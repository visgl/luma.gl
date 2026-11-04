const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./webgpu-device-D8bNA4At.js","./wgsl-interface-scan-BaCgnr12.js"])))=>i.map(i=>d[i]);
import{B as e,C as t,D as n,F as r,H as i,I as a,L as o,M as s,N as c,O as l,P as u,S as d,T as f,V as p,W as m,_ as h,a as g,b as _,c as v,d as y,g as b,h as x,i as S,j as C,k as w,l as T,m as E,n as D,o as O,p as k,r as A,s as j,t as ee,u as te,v as ne,w as re,x as ie,y as M,z as ae}from"./wgsl-interface-scan-BaCgnr12.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var oe=`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`,N=15e5;function se(e,t){let n=typeof e.matchMedia==`function`?e.matchMedia.bind(e):()=>({matches:!1}),r=n(`(pointer: coarse)`).matches,i=e.innerWidth||1,a=e.innerHeight||1;return{compactViewport:n(oe).matches,handheld:r&&t.maxTouchPoints>0&&Math.min(i,a)<=700,coarsePointer:r,maxTouchPoints:t.maxTouchPoints||0,viewportWidth:i,viewportHeight:a,devicePixelRatio:e.devicePixelRatio||1}}function ce({devicePixelRatio:e,viewportHeight:t,viewportWidth:n,handheld:r}){let i=Math.max(n,1)*Math.max(t,1);if(!r)return!0;let a=Math.max(1,Math.min(2,Math.sqrt(N/i)));return e<=a?!0:a}function le(e,t){let n=t.handheld&&e.mobileMode===`reduced`;return{canvasPixelRatio:ce(t),intermediateTargetScale:n?.75:1,maximumSampleCount:n?2:4,preferFloatingPointColor:!n,maximumWorkerCount:n?1:2,maximumConcurrentLoadCount:n?2:4,maximumResidentRecordCount:n?25e4:1e6,simulationDimensionScale:n?.5:1,simulationIterationScale:n?.5:1}}function ue(e,t){return t.handheld&&e.mobileMode===`unsupported`?e.unsupportedReason||`This example does not support mobile devices.`:void 0}function de(e){switch(e){case`full`:return`Mobile`;case`reduced`:return`Mobile quality`;case`unsupported`:return`Desktop only`}}function fe(e,t,n){let r=ue(e,t);if(r)return{supported:!1,reason:r};let i=e.requirements;if(!i)return{supported:!0};if(!i.backends.some(e=>n.backends.includes(e)))return{supported:!1,reason:`This example requires ${xe(i.backends)}, but this browser does not expose a compatible graphics backend. Try a current browser on a capable device or use a desktop browser.`};let a=new Set(n.deviceFeatures),o=i.requiredDeviceFeatures?.find(e=>!a.has(e));if(o)return{supported:!1,reason:`This example requires the GPU feature “${o}”. Try a current browser on a capable device or use a desktop browser.`};let s=i.requiredDeviceLimits,c=n.deviceLimits;return s?.maxColorAttachments!==void 0&&(c?.maxColorAttachments??0)<s.maxColorAttachments?{supported:!1,reason:`This example requires ${s.maxColorAttachments} color attachments, but this GPU exposes only ${c?.maxColorAttachments??0}. Try a capable device or desktop browser.`}:s?.maxColorAttachmentBytesPerSample!==void 0&&(c?.maxColorAttachmentBytesPerSample??0)<s.maxColorAttachmentBytesPerSample?{supported:!1,reason:`This example requires ${s.maxColorAttachmentBytesPerSample} color-attachment bytes per sample, but this GPU exposes only ${c?.maxColorAttachmentBytesPerSample??0}. Try a capable device or desktop browser.`}:{supported:!0}}async function pe(){let e=document.documentElement,t=he(document),n=se(window,navigator),r=fe(t,n,{backends:await me()}),i=le(t,n);e.dataset.lumaExampleId=t.id,e.dataset.lumaExampleMobileMode=t.mobileMode,e.dataset.lumaExampleQualityProfile=t.mobileProfile,e.dataset.lumaExampleState=r.supported?`loading`:`unsupported`,n.handheld&&typeof i.canvasPixelRatio==`number`&&Object.defineProperty(window,`devicePixelRatio`,{configurable:!0,value:i.canvasPixelRatio});let a=t=>{e.dataset.lumaExampleState!==`unsupported`&&(e.dataset.lumaExampleState=`failed`,ve(`failed`,be(t)))},o=()=>{e.dataset.lumaExampleState===`loading`&&(e.dataset.lumaExampleState=`running`)};return window.addEventListener(`error`,e=>a(e.error||e.message)),window.addEventListener(`unhandledrejection`,e=>a(e.reason)),ye(),n.handheld&&_e(t.mobileMode),r.supported===!1?ve(`unsupported`,r.reason):ge(o),{supported:r.supported,reportFailed:a,reportRunning:o}}async function me(){let e=[];if(`WebGL2RenderingContext`in window&&e.push(`webgl2`),`gpu`in navigator)try{let t=navigator.gpu;t&&await t.requestAdapter()&&e.push(`webgpu`)}catch{}return e}function he(e){let t=t=>e.querySelector(`meta[name="${t}"]`)?.content||void 0,n=t(`luma-example-mobile`),r=t(`luma-example-mobile-profile`),i=(t(`luma-example-backends`)||``).split(`,`).filter(Boolean);return{id:t(`luma-example-id`)||location.pathname,mobileMode:n||`reduced`,mobileProfile:r||`standard`,unsupportedReason:t(`luma-example-mobile-unsupported-reason`),requirements:i.length?{backends:i}:void 0}}function ge(e){let t=!1,n=()=>{if(t)return;let n=document.querySelector(`canvas`),i=n&&n.clientWidth>0&&n.clientHeight>0,a=[...document.body?.querySelectorAll(`*`)||[]].some(e=>{if(e instanceof HTMLScriptElement||e instanceof HTMLStyleElement||e.hasAttribute(`data-luma-example-mobile-badge`)||e.hasAttribute(`data-luma-example-status`))return!1;let t=e.getBoundingClientRect();return t.width>0&&t.height>0&&(e.textContent?.trim()||e.children.length)});(i||a)&&(t=!0,r.disconnect(),requestAnimationFrame(()=>requestAnimationFrame(e)))},r=new MutationObserver(n);r.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener(`load`,n,{once:!0})}function _e(e){let t=document.createElement(`span`);t.dataset.lumaExampleMobileBadge=``,t.setAttribute(`aria-label`,`Mobile support: ${de(e)}`),t.style.cssText=`position:fixed;left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483646;padding:4px 8px;border:1px solid #7dd3fc57;border-radius:999px;background:#020617dd;color:#bae6fd;font:700 11px/1.4 system-ui;pointer-events:none;`,t.textContent=de(e),document.body.append(t)}function ve(e,t){document.querySelector(`[data-luma-example-status]`)?.remove();let n=document.createElement(`div`);n.dataset.lumaExampleStatus=e,n.setAttribute(`role`,`alert`),n.style.cssText=`position:fixed;inset:16px;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #475569;border-radius:12px;background:#020617ee;color:#e2e8f0;font:16px/1.5 system-ui;text-align:center;`;let r=document.createElement(`div`);r.style.maxWidth=`620px`;let i=document.createElement(`strong`);i.style.cssText=`display:block;font-size:20px;margin-bottom:8px;`,i.textContent=e===`unsupported`?`This example is not supported on this device.`:`This example could not start.`;let a=document.createElement(`span`);a.textContent=t,r.append(i,a),n.append(r),document.body.append(n)}function ye(){let e=document.createElement(`style`);e.textContent=`
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
  `,document.head.append(e)}function be(e){return e instanceof Error?e.message:typeof e==`string`?e:`An unexpected error stopped the example.`}function xe(e){return e.map(e=>e===`webgpu`?`WebGPU`:`WebGL2`).join(` or `)}(await pe()).supported||document.querySelectorAll(`script[type="module"]:not([data-luma-example-support-bootstrap])`).forEach(e=>e.remove());var Se=`set luma.log.level=1 (or higher) to trace rendering`,Ce="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",we=class t{static defaultProps={...p,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=e;log=i;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw i.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),i.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);i.error(`This version of luma.gl has already been initialized`)()}i.log(1,`${this.VERSION} - ${Se}`)(),globalThis.luma=this}async createDevice(e={}){let n={...t.defaultProps,...e};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(Ce);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n)}catch(e){throw n.debug&&Te(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(Ce);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||i.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(e){Object.assign(t.defaultProps,e)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?i.warn(`WebGL1 is not supported`,e)():i.warn(`Unknown handle type`,e)(),null)}};function Te(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var Ee=new we,De=class{get pageLoaded(){return je()}},Oe=m()&&typeof document<`u`,ke=()=>Oe&&document.readyState===`complete`,Ae=null;function je(){return Ae||=ke()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),Ae}function Me(e,t={}){let n={...e},r=t.layout??`std140`,i={},a=0;for(let[e,t]of Object.entries(n))a=Fe(i,e,t,a,r);return a=c(a,Le(n,r)),{layout:r,byteLength:a*4,uniformTypes:n,fields:i}}function Ne(e,t){let n=r(e),i=u(n),a=/^mat(\d)x(\d)<.+>$/.exec(n);if(a){let e=Number(a[1]),r=Number(a[2]),o=Re(r,n,i.type,t),s=Ve(o.size,o.alignment,t);return{alignment:o.alignment,size:e*s,components:e*r,columns:e,rows:r,columnStride:s,shaderType:n,type:i.type}}let o=/^vec(\d)<.+>$/.exec(n);return o?Re(Number(o[1]),n,i.type,t):{alignment:1,size:1,components:1,columns:1,rows:1,columnStride:1,shaderType:n,type:i.type}}function Pe(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function Fe(e,t,n,r,i){if(typeof n==`string`){let a=Ne(n,i),o=c(r,a.alignment);return e[t]={offset:o,...a},o+a.size}if(Array.isArray(n)){if(Array.isArray(n[0]))throw Error(`Nested arrays are not supported for ${t}`);let a=n[0],o=n[1],s=ze(a,i),l=c(r,Le(n,i));for(let n=0;n<o;n++)Fe(e,`${t}[${n}]`,a,l+n*s,i);return l+s*o}if(Pe(n)){let a=Le(n,i),o=c(r,a);for(let[r,a]of Object.entries(n))o=Fe(e,`${t}.${r}`,a,o,i);return c(o,a)}throw Error(`Unsupported CompositeShaderType for ${t}`)}function Ie(e,t){if(typeof e==`string`)return Ne(e,t).size;if(Array.isArray(e)){let n=e[0],r=e[1];if(Array.isArray(n))throw Error(`Nested arrays are not supported`);return ze(n,t)*r}let n=0;for(let r of Object.values(e)){let e=r;n=c(n,Le(e,t)),n+=Ie(e,t)}return c(n,Le(e,t))}function Le(e,t){if(typeof e==`string`)return Ne(e,t).alignment;if(Array.isArray(e)){let n=e[0],r=Le(n,t);return He(t)?Math.max(r,4):r}let n=1;for(let r of Object.values(e)){let e=Le(r,t);n=Math.max(n,e)}return Ue(t)?Math.max(n,4):n}function Re(e,t,n,r){return{alignment:e===2?2:4,size:e===3?3:e,components:e,columns:1,rows:e,columnStride:e===3?3:e,shaderType:t,type:n}}function ze(e,t){return Be(Ie(e,t),Le(e,t),t)}function Be(e,t,n){return c(e,He(n)?4:t)}function Ve(e,t,n){return n===`std140`?4:c(e,t)}function He(e){return e===`std140`||e===`wgsl-uniform`}function Ue(e){return e===`std140`||e===`wgsl-uniform`}var We=new WeakMap,P=class e{static defaultProps={...M.defaultProps};static getDefaultPipelineFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new e(t),n.defaultPipelineFactory}static beginAsyncCompilation(e){if(We.has(e))throw Error(`An asynchronous pipeline compilation scope is already active`);let t=[];return We.set(e,t),t}static getAsyncCompilation(e){return We.get(e)}static endAsyncCompilation(e,t){if(We.get(e)!==t)throw Error(`The asynchronous pipeline compilation scope is not active`);We.delete(e)}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_pendingRenderPipelineCache={};_pendingComputePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...M.defaultProps,...e},n=this._renderPipelineCache,r=this._hashRenderPipeline(t),a=n[r]?.resource;if(a)n[r].useCount++,this.device.props.debugFactories&&i.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;a=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:ae(`unnamed-cached`),_sharedRenderPipeline:e}),a.hash=r,n[r]={resource:a,useCount:1},this.device.props.debugFactories&&i.log(3,`${this}: ${a} created, count=${n[r].useCount}`)()}return a}async createRenderPipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createRenderPipelineAsync(e);let t={...M.defaultProps,...e},n=this._hashRenderPipeline(t);return await this._createPipelineAsync(this._renderPipelineCache,this._pendingRenderPipelineCache,n,()=>{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;return this.device.createRenderPipelineAsync({...t,id:t.id?`${t.id}-cached`:ae(`unnamed-cached`),_sharedRenderPipeline:e})})}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...ne.defaultProps,...e},n=this._computePipelineCache,r=this._hashComputePipeline(t),a=n[r]?.resource;return a?(n[r].useCount++,this.device.props.debugFactories&&i.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)()):(a=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),a.hash=r,n[r]={resource:a,useCount:1},this.device.props.debugFactories&&i.log(3,`${this}: ${a} created, count=${n[r].useCount}`)()),a}async createComputePipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createComputePipelineAsync(e);let t={...ne.defaultProps,...e},n=this._hashComputePipeline(t);return await this._createPipelineAsync(this._computePipelineCache,this._pendingComputePipelineCache,n,()=>this.device.createComputePipelineAsync({...t,id:t.id?`${t.id}-cached`:void 0}))}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&i.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(i.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&i.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}async _createPipelineAsync(e,t,n,r){let i=e[n];if(i)return i.useCount++,i.resource;let a=t[n];if(a)return a.useCount++,await a.promise;let o={promise:void 0,useCount:1};return o.promise=r().then(r=>{delete t[n];let i=e[n];return i?(i.useCount+=o.useCount,r.destroy(),r instanceof M&&this.releaseSharedRenderPipeline(r),i.resource):(r.hash=n,e[n]={resource:r,useCount:o.useCount},r)}).catch(e=>{throw delete t[n],e}),t[n]=o,await o.promise}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof M&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof ne&&(t=this._computePipelineCache),e instanceof M&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){return`${this._getHash(e.shader.source)}/${this._getHash(JSON.stringify([e.shaderLayout,e.entryPoint??`main`,e.constants]))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e._uniformBlockLayouts)),o=this._getHash(JSON.stringify(e.bufferLayout)),{type:s}=this.device;switch(s){case`webgl`:let c=this._getHash(JSON.stringify(e.parameters));return`${s}/R/${t}/${n}V${r}T${e.topology}P${c}SL${i}UBL${a}BL${o}`;default:let l=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),u=this._getHash(JSON.stringify(e.parameters)),d=this._getWebGPUAttachmentHash(e);return`${s}/R/${t}/${n}V${r}T${e.topology}EP${l}P${u}SL${i}BL${o}A${d}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=e.depthStencilAttachmentFormat??(e.parameters?.depthWriteEnabled?this.device.preferredDepthFormat:null);return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}},Ge=class e{static defaultProps={..._.defaultProps};static getDefaultShaderFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new e(t),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&i.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let r=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:r,useCount:1},this.device.props.debugFactories&&i.log(3,`${this}: Created new shader ${r.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&i.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&i.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}},Ke;function qe(e){return(!Ke||Ke.byteLength<e)&&(Ke=new ArrayBuffer(e)),Ke}function Je(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Ye(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:Je(e)}var Xe=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=qe(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let a=n[0],o=n[1];if(Array.isArray(a))throw Error(`Nested arrays are not supported for ${t}`);if(typeof a==`string`&&Ye(r)){this._flattenPackedArray(e,t,a,o,r);return}if(!Array.isArray(r)){i.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,o);n++){let i=r[n];i!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,a,i)}return}if(Pe(n)&&Ze(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}i.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=Ne(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=Qe(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){i.warn(`Uniform ${t} not found in layout`)();return}let{type:a,components:o,columns:s,rows:c,offset:l,columnStride:u}=r,d=e[a];if(o===1){d[l]=Number(n);return}let f=n;if(s===1){for(let e=0;e<o;e++)d[l+e]=Number(f[e]??0);return}let p=0;for(let e=0;e<s;e++){let t=l+e*u;for(let e=0;e<c;e++)d[t+e]=Number(f[p++]??0)}}};function Ze(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Qe(e,t,n){return Array.prototype.slice.call(e,t,n)}var $e=128;function et(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!Ye(r)||!Ye(i)||r.length!==i.length)return!1;let a=Math.min(n,$e);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function tt(e){return Ye(e)?e.slice():e}var nt=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return et(this.uniforms[e],t)?!1:(this.uniforms[e]=tt(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},rt=1024,it=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=Me(r.uniformTypes??{},{layout:r.layout??at(e)}),a=new Xe(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new nt({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,rt)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let n=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:o.UNIFORM|o.COPY_DST,byteLength:n}),i=this.getUniformBufferData(e);return r.write(i),r}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),n=this.device.createBuffer({usage:o.UNIFORM|o.COPY_DST,byteLength:t});this.uniformBuffers.set(e,n)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&i.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),a=!1;if(r&&n?.needsRedraw){a||=n.needsRedraw;let o=this.getUniformBufferData(e);if(r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,o):r.write(o)),i.level>=4){let t=this.uniformBlocks.get(e)?.getAllUniforms();i.log(4,`Writing to uniform buffer ${String(e)}`,o,t)()}}return a}};function at(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function ot(e,t){let n={},r=x(e,t,{warnOnMissingBufferLayout:!0});for(let t of r){let r=st(e,t);n[t.attributeName]=r}return n}function st(e,t){let n=ct(e,t.attributeName),r=a.getAttributeShaderTypeInfo(n.type),i=t.vertexFormat,o=C.getVertexFormatInfo(i);return{attributeName:t.attributeName,bufferName:t.bufferName,location:n.location,shaderType:n.type,primitiveType:r.primitiveType,shaderComponents:r.components,vertexFormat:i,bufferDataType:o.type,bufferComponents:o.components,normalized:o.normalized,integer:r.integer,stepMode:t.stepMode,byteOffset:t.byteOffset,byteStride:t.byteStride}}function ct(e,t){let n=e.attributes.find(e=>e.name===t);return n||i.warn(`shader layout attribute "${t}" not present in shader`)(),n||null}var lt=`modulepreload`,ut=function(e,t){return new URL(e,t).href},dt={},ft=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=ut(t,n),t in dt)return;dt[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:lt,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},pt=`core-features-and-limits`,mt=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function ht(e){let t={};for(let n of mt){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function gt(e){return e.featureLevel??`core`}function _t(e){let t=gt(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function vt(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(pt)&&r.push(pt);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function yt(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(pt)?`core`:e===`best-available`?`compatibility`:e}function bt(e,t){return e===`core`?`core`:yt(`compatibility`,t)}var xt=new class extends De{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let n=gt(e),r=_t(e),a;try{a=await this.requestGPUAdapter(r)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!a)throw Error(`Failed to request WebGPU adapter`);let o=await St(a),s={},c=vt(a.features,n,e.optionalFeatures);c.length>0&&(s.requiredFeatures=c);let l={...n===`max`?ht(a.limits):{},...e.requiredLimits};Object.keys(l).length>0&&(s.requiredLimits=l);let u;try{u=await a.requestDevice(s)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await Ct(u);if(d){if(u.destroy(),t&&d.reason!==`destroyed`)return i.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}let{WebGPUDevice:f}=await ft(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-D8bNA4At.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url),p=yt(n,u.features),m={...e,featureLevel:p};i.groupCollapsed(1,`WebGPUDevice created`)();try{let e;try{e=new f(m,u,a,o)}catch(e){throw u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e})}let t=f.getCanvasContextProps(m);if(t)try{e.initializeCanvasContext(t)}catch(t){throw e.destroy(),Error(`WebGPU canvas initialization failed`,{cause:t})}return i.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),i.table(1,e.info)(),e}finally{i.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await ft(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-D8bNA4At.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url);if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await Ct(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=bt(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function St(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return i.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function Ct(e){return await Promise.race([e.lost,Promise.resolve(null)])}function wt(e,t){if(!e){let e=Error(t||`shaders: assertion failed.`);throw Error.captureStackTrace?.(e,wt),e}}var Tt={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function Et(e){let t={};for(let[n,r]of Object.entries(e))t[n]=Dt(r);return t}function Dt(e){let t=Ot(e);if(t!==`object`)return{value:e,...Tt[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=Ot(e.value),{...e,...Tt[t],type:t}):{...e,...Tt[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function Ot(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}function kt(e){e.map(e=>At(e))}function At(e){if(e.instance)return;kt(e.dependencies||[]);let{propTypes:t={},deprecations:n=[]}=e,r={parsedDeprecations:Mt(n),normalizedInjections:{vertex:{},fragment:{}}};t&&(r.propValidators=Et(t)),e.instance=r;let i={};t&&(i=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...i}}function jt(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function Mt(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function Nt(e){let t=new Set,n=new Set,r=[],i=new Map;function a(e){let t=i.get(e.name);if(t&&t!==e)throw Error(`Shader module name collision: Multiple different module objects share the name "${e.name}". Each module object must have a unique name.`);i.set(e.name,e)}function o(e,i){if(n.has(e)){let t=[...i,e.name].join(` -> `);throw Error(`Shader module dependency cycle detected: ${t}`)}if(t.has(e))return;a(e),n.add(e);let s=[...i,e.name];if(e.dependencies)for(let t of e.dependencies)o(t,s);n.delete(e),t.add(e),r.push(e)}for(let t of e)o(t,[]);let s=new Set;for(let e of r)e.implements!==void 0&&(wt(!s.has(e.implements)),s.add(e.implements));return kt(r),r}var Pt=class{_shaderTranspilers=new Map;_injectionTargets=[];_defaultModules=[];addShaderTranspiler(e){this._shaderTranspilers.set(e.sourceLanguage,e)}removeShaderTranspiler(e){this._shaderTranspilers.delete(e)}_transpileShader(e,t,n,r){let i=e.sourceLanguage||this.shaderLanguage;if(i===this.shaderLanguage)return wt(!Nt(t).some(e=>e.sourceLanguage&&e.sourceLanguage!==this.shaderLanguage)),{code:n||``,modules:t};let a=this._shaderTranspilers.get(i);wt(a);let o=Nt(t);wt(!o.some(e=>e.sourceLanguage&&e.sourceLanguage!==i&&e.sourceLanguage!==this.shaderLanguage));let s=o.filter(e=>e.sourceLanguage===i).map(e=>e.source||``).join(`
`),c={vertex:e.vertexEntryPoint,fragment:e.fragmentEntryPoint,compute:e.computeEntryPoint},l=n==null?{code:``}:a.transpile({source:[s,n].filter(Boolean).join(`
`),target:this.shaderLanguage,stage:r,entryPoints:c,platformInfo:e.platformInfo}),u=o.map(e=>({...e,dependencies:void 0,...e.sourceLanguage===i?{source:void 0,vs:void 0,fs:void 0}:{}}));return{...l,modules:u}}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderInjectionTarget(e){this._injectionTargets.push(e)}resetShaderInjectionTargets(){this._injectionTargets.length=0}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,kt(t),t}},Ft=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${A}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${A}\\s*:\\s*([^;]+);`,`g`)];function It(e,t=[]){let n=T(e),r=new Map;for(let e of t)r.set(Rt(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of Ft){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===Ft[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(Rt(l,s,o));i.push(Lt({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function Lt(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:Vt(e.resourceType),viewDimension:zt(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:zt(e.resourceType),sampleType:Bt(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function Rt(e,t,n){return`${t}:${n}:${e}`}function zt(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function Bt(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function Vt(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}function Ht(e,t=``){let n=new Map,r=Object.values(e).flatMap(e=>Object.entries(e).map(([e,t])=>`${e.slice(3)}\n${t.signature}\n${t.header||``}\n${t.footer||``}`)),i=new Set(T(`${t}\n${r.join(`
`)}`).match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let t of Object.keys(e.vertex)){let r=t.slice(3);e.fragment[`fs:${r}`]&&n.set(r,{vertex:Wt(`_luma_vertex_target_${r}`,i),fragment:Wt(`_luma_fragment_target_${r}`,i)})}return n}function Ut(e,t,n=Ht(t)){if(!n.size)return e;let r=T(e),i=new Map,a=/((?:@\w+(?:\([^)]*\))?\s*)*)\bfn\s+([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu;for(let e=a.exec(r);e;e=a.exec(r)){let t=r.indexOf(`{`,a.lastIndex),n=t+1,o=1;for(;n<r.length&&o;n++)r[n]===`{`&&o++,r[n]===`}`&&o--;wt(t>=0&&o===0);let s=e[2],c=e.index+e[0].lastIndexOf(s),l=Array.from(r.slice(t+1,n-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu),e=>e[1]);i.set(s,{name:s,start:e.index,end:n,nameStart:c,bodyStart:t,calls:l,stages:new Set,entryStage:/@vertex\b/.test(e[1])?`vertex`:/@fragment\b/.test(e[1])?`fragment`:void 0}),a.lastIndex=n}function o(e,t){let r=i.get(e);if(!(!r||r.stages.has(t))){r.stages.add(t);for(let e of r.calls)o(n.get(e)?.[t]||e,t)}}for(let e of i.values())e.entryStage&&o(e.name,e.entryStage);for(let e of[`vertex`,`fragment`])for(let r of Object.keys(t[e])){let t=r.slice(3);o(n.get(t)?.[e]||t,e)}let s=new Set,c=!0;for(;c;){c=!1;for(let e of i.values())!s.has(e.name)&&e.calls.some(e=>n.has(e)||s.has(e))&&(s.add(e.name),c=!0)}let l=new Map,u=new Set(r.match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let e of s)i.get(e)?.stages.size===2&&l.set(e,{vertex:Wt(`_luma_vertex_helper_${e}`,u),fragment:Wt(`_luma_fragment_helper_${e}`,u)});function d(e,t){return n.get(e)?.[t]||l.get(e)?.[t]||e}for(let t of[...i.values()].reverse()){if(!s.has(t.name))continue;if(!t.stages.size)throw Error(`Cannot infer WGSL target stage in ${t.name}`);let n=[],i=t.start;for(let a of t.stages){let o=e.slice(i,t.end),s=[...r.slice(t.bodyStart+1,t.end-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu)];for(let e of s.reverse()){let n=t.bodyStart+1+e.index-i,r=d(e[1],a);o=o.slice(0,n)+r+o.slice(n+e[1].length)}let c=t.nameStart-i;o=o.slice(0,c)+d(t.name,a)+o.slice(c+t.name.length),n.push(o)}e=e.slice(0,i)+n.join(`
`)+e.slice(t.end)}return e}function Wt(e,t){let n=e,r=0;for(;t.has(n);)n=`${e}_${++r}`;return t.add(n),n}var Gt={vertex:`#ifdef MODULE_LOGDEPTH
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
`},Kt=/void\s+main\s*\([^)]*\)\s*\{\n?/,qt=/}\n?[^{}]*$/,Jt=[],Yt=`__LUMA_INJECT_DECLARATIONS__`;function Xt(e,t,n){let r={};for(let i of e){let e=i[t];if(e===void 0)continue;if(i.stage!==`vertex`&&i.stage!==`fragment`||i.target.includes(`:`))throw Error(`Shader injection targets require an explicit stage and unqualified target`);let a=`${i.stage===`vertex`?`vs`:`fs`}:${i.target}`;if(!/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][A-Za-z0-9_]*)$/.test(a))throw Error(`Shader injection target "${a}" must be a named shader injection target`);r[a]||=[],r[a].push({injection:e,order:i.order??0,...n?{pluginName:n}:{}})}return r}function Zt(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),Jt.length=r.length;for(let e=0,t=r.length;e<t;++e)Jt[e]=r[e].injection;let s=`${Jt.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(Yt,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?Qt(e,`vertex`,s,`start`,a.vertex):e.replace(Kt,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?Qt(e,`vertex`,s,`end`,a.vertex):e.replace(qt,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(Yt,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?Qt(e,`fragment`,s,`start`,a.fragment):e.replace(Kt,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?Qt(e,`fragment`,s,`end`,a.fragment):e.replace(qt,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(Yt,``),r&&(e=e.replace(/\}\s*$/,e=>e+Gt[t])),e}function Qt(e,t,n,r,i){let a=$t(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function $t(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${en(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function en(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var tn=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,nn=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function rn(e){return`${e.name}Uniforms`}function an(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=rn(e);return un(n,t===`wgsl`?`wgsl`:`glsl`,r)}function on(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=an(e,t);return r?{moduleName:e.name,uniformBlockName:rn(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:pn(n,r)}:null}function sn(e,t,n={}){let r=on(e,t);if(!r||r.matches)return r;let i=mn(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&wt(!1,i),r}function cn(e){let t=[],n=hn(e);for(let e of n.matchAll(nn)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function ln(e,t,n,r){let i=cn(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${gn(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function un(e,t,n){let r=t===`wgsl`?dn(e,n):fn(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(tn);r&&i.push(r[1])}return i}function dn(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function fn(e,t){return cn(e).find(e=>e.blockName===t)?.body||null}function pn(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function mn(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=_n(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${vn(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${vn(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function hn(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function gn(e){return e.replace(/\s+/g,` `).trim()}function _n(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function vn(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}var yn=`\n\n${Yt}\n`;function bn(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function xn(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function Sn(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:wt(!1)}if(!e.name)throw Error(`Shader module must have a name`);sn(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}var Cn=`([a-zA-Z_][a-zA-Z0-9_]*)`,wn=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,Tn=RegExp(`^\\s*\\#\\s*ifdef\\s*${Cn}\\s*$`),En=RegExp(`^\\s*\\#\\s*ifndef\\s*${Cn}\\s*(?:\\/\\/.*)?$`),Dn=/^\s*\#\s*else\s*(?:\/\/.*)?$/,On=/^\s*\#\s*endif\s*$/,kn=RegExp(`^\\s*\\#\\s*ifdef\\s*${Cn}\\s*(?:\\/\\/.*)?$`),An=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function jn(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(wn),o=e.match(kn)||e.match(Tn),s=e.match(En),c=e.match(Dn),l=e.match(An)||e.match(On);if(n){let e=Mn(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function Mn(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=`(?:[A-Za-z_][A-Za-z0-9_]*|[+-]?\\d+(?:\\.\\d+)?)`,i=n.match(RegExp(`^(${r})\\s*(==|!=|<=|>=|<|>)\\s*(${r})$`));if(i){let e=e=>/^[A-Za-z_]/.test(e)?Number(t[e]??0):Number(e),n=e(i[1]),r=e(i[3]);switch(i[2]){case`==`:return n===r;case`!=`:return n!==r;case`<=`:return n<=r;case`>=`:return n>=r;case`<`:return n<r;case`>`:return n>r}}let a=n.match(RegExp(`^!\\s*${Cn}$`));if(a)return!t[a[1]];let o=n.match(RegExp(`^${Cn}$`));if(o)return!!t[o[1]];let s=n.match(RegExp(`^defined\\s*\\(\\s*${Cn}\\s*\\)$`));if(s)return t[s[1]]!==void 0;let c=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${Cn}\\s*\\)$`));if(c)return t[c[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function Nn(e,t){let n=[];for(let[r,i]of Object.entries(t))In(e,r),n.push(`in ${Fn(i)} ${r};`);return n.join(`
`)}function Pn(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=Ln(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Rn(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||Un(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=Wn(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function Fn(e){let{primitiveType:t,components:n}=a.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function In(e,t){let n=qn(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function Ln(e,t){let n=RegExp(`\\bfn\\s+${qn(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=Gn(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Rn(e,t){let n=zn(t),r=new Set(Bn(t)),i=Vn(t);for(let t of i){let i=Hn(e,t);if(i!==null){n.push(...zn(i));for(let e of Bn(i))r.add(e)}}return{locations:n,names:r}}function zn(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function Bn(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Vn(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Hn(e,t){let n=RegExp(`\\bstruct\\s+${qn(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=Gn(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function Un(e,t){let n=qn(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(Kn(e,i.index)===0)return!0;i=r.exec(e)}return!1}function Wn(e){let t=0;for(;e.has(t);)t++;return t}function Gn(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function Kn(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function qn(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Jn(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){mr(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${Fn(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${fr(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function Yn(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=Xn(a,t,`vertex`),s=Zn(a,o),c=Xn(a,n,`fragment`),l=Qn(a,c),u=$n(a,s),d=l?$n(a,l.type):null,f=new Set([...lr(o.parameters),...lr(u.body),...lr(c.parameters),...lr(d?.body||``)]),p=new Set([...cr(u.body),...cr(d?.body||``),...cr(c.parameters)]),m=[],h=[],g=[],_=[],v=[];for(let[e,t]of i){if(f.has(e)||ur(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=dr(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;if(m.push(`  @location(${n})${r} ${e}: ${t.type},`),g.push(`var<private> ${e}: ${t.type};`),_.push(`${e} = ${pr(t.type)};`),l)v.push(`${e} = ${l.name}.${e};`);else{let i=`_luma_${e}`;if(f.has(i))throw Error(`ShaderPlugin varying "${e}" conflicts with a generated fragment parameter`);h.push(`@location(${n})${r} ${i}: ${t.type}`),v.push(`${e} = ${i};`)}}tr(a,s,o.openBrace,o.closeBrace),a=nr(a,s,o,i.map(([e])=>e)),o=Xn(a,t,`vertex`),a=rr(a,o,i.map(([e])=>e));let y=(!l||s===l.type?[s]:[s,l.type]).map(e=>$n(a,e).closeBrace).sort((e,t)=>t-e);for(let e of y)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=Xn(a,n,`fragment`),h.length){let e=c.parameters,t=T(e).trimEnd();if(t.trim()&&!t.endsWith(`,`)){let n=t.length;e=`${e.slice(0,n)},${e.slice(n)}`}a=a.slice(0,c.openParenthesis+1)+e+`
  `+h.join(`,
  `)+`
`+a.slice(c.closeParenthesis)}return{source:a,declarations:g.join(`
`),vertexInitialization:_.join(`
`),fragmentInitialization:v.join(`
`)}}function Xn(e,t,n){let r=RegExp(`\\bfn\\s+${_r(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin interStageVariables require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=hr(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=hr(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function Zn(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||er(e,r[1])===null)throw Error(`ShaderPlugin interStageVariables require the WGSL vertex entry point to return a named struct`);return r[1]}function Qn(e,t){let n=[];for(let r of sr(T(t.parameters),`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&er(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length>1)throw Error(`ShaderPlugin interStageVariables require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]||null}function $n(e,t){let n=er(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function er(e,t){let n=RegExp(`\\bstruct\\s+${_r(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=hr(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function tr(e,t,n,r){let i=RegExp(`\\b${_r(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function nr(e,t,n,r){let i=RegExp(`\\b${_r(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=hr(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function rr(e,t,n){let r=ir(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function ir(e,t,n){let r=[],i=t;for(;i<n;)if(i=or(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=ar(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function ar(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=or(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function or(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function sr(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function cr(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function lr(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function ur(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${_r(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(gr(e,r.index)===0)return!0;r=n.exec(e)}return!1}function dr(e){let t=0;for(;e.has(t);)t++;return t}function fr(e){let{primitiveType:t,components:n}=a.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${Fn(e)}(${r})`}function pr(e){let{primitiveType:t,components:n}=a.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function mr(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${_r(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function hr(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function gr(e,t){let n=0;for(let r=0;r<t;r++){let i=or(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function _r(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function vr(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i],o=a.returnType||`void`,s=n===`wgsl`?`fn`:o,c=n===`wgsl`&&o!==`void`?` -> ${o}`:``;if(r+=`${s} ${a.signature}${c} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function yr(e,t=[],n=`glsl`){let r={vertex:{},fragment:{}};for(let t of e){let e=t[n];if(e){let n=t.stage===`vertex`?`vs`:`fs`;r[t.stage][`${n}:${t.name}`]={...e,signature:`${t.name}(${e.parameters})`}}}for(let e of t){let t=yr([e],[],n);for(let e of[`vertex`,`fragment`])for(let[n,i]of Object.entries(t[e])){let t=r[e][n];if(t&&(t.signature!==i.signature||(t.returnType||`void`)!==(i.returnType||`void`)))throw Error(`Conflicting ShaderPlugin injection target ${n}`);r[e][n]=t||i}}return r}function br(e,t){return!!(t.startsWith(`vs:`)?e.vertex:e.fragment)[t]}function xr(e,t,n){let r=n===`vertex`?`vs:`:n===`fragment`?`fs:`:null;for(let n in t)if(!(r&&!n.startsWith(r))&&!br(e,n)){let e=[...new Set(t[n].map(e=>e.pluginName).filter(Boolean))];throw Error(`Unknown shader injection target ${n}${e.length?` (plugins: ${e.join(`, `)})`:``}`)}}function Sr(e){let t=Nt(e.modules||[]),{source:n,bindingAssignments:r}=Cr(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:bn(t),bindingAssignments:r}}function Cr(e,t){let{source:n,stage:r,modules:i,defines:a={},injectionTargets:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginInterStageVariables:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;wt(typeof n==`string`,`shader source must be a string`);let m=Pn(jn(n,{defines:a}),d,l),h=Yn(m.source,d,f,u),g=h.source,_=``,v=yr(o,t.pluginInjectionTargets,`wgsl`),y={},b={},x={};xn(c,y,b,x),xn(Array.isArray(s)?Xt(s,`wgsl`):{},y,b,x);let S=Array.isArray(s)?{}:s;for(let e in S){let t=typeof S[e]==`string`?{injection:S[e],order:0}:S[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[...b[e]||[],t]:x[e]=[...x[e]||[],t]:y[e]=[...y[e]||[],t]}else x[e]=[...x[e]||[],t]}wr(m.declarations,m.initialization,b,x),Tr(h,b,x),xr(v,y);let C=i.map(e=>({module:e,source:jn(Sn(e,`wgsl`,p),{defines:a})})),w=kr(g),T=Or(w.source),E=Nr(C,t._bindingRegistry,T),D=[],O=C.map(({module:e,source:n})=>{let r=Ar(n,e,{usedBindingsByGroup:T,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:E});return D.push(...r.bindingAssignments),{module:e,source:r.source}});for(let{module:e,source:t}of O)p&&jt(e,g,p),_+=t;_+=yn,_=Zt(_,r,Er(b),!1,`wgsl`,{vertex:d,fragment:f});let k=Ht(v,[_,w.source,...Object.values(y).flat().map(e=>e.injection),...Object.values(x).flat().map(e=>e.injection)].join(`
`));return _+=Dr(v,y,k),_+=Vr(D),_+=w.source,_=Zt(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),_=Ut(_,v,k),Br(_),{source:_,bindingAssignments:D}}function wr(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function Tr(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function Er(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function Dr(e,t,n=Ht(e)){return[`vertex`,`fragment`].map(r=>vr(Object.fromEntries(Object.entries(e[r]).map(([e,t])=>{let i=e.slice(3),a=n.get(i)?.[r]||i;return[e,{...t,signature:a+t.signature.slice(i.length)}]})),t,`wgsl`)).join(``)}function Or(e){let t=new Map;for(let n of j(e,g)){let e=Number(n.bindingToken),r=Number(n.groupToken);Fr(r,e,n.name),Lr(t,r,e,`application binding "${n.name}"`)}return t}function kr(e){let t=j(e,S),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);Fr(r,t,e.name),Lr(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=te(e,S,e=>Mr(e,n,r));if(v(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function Ar(e,t,n){let r=[],i={sawSupportedBindingDeclaration:j(e,D).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=te(e,D,e=>jr(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(v(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function jr(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=Hr(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?Rr(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return Ir(n.name,u,s,l),t!==void 0&&Pr(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(Lr(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);Ir(n.name,u,d,l);let f=Hr(u,n.name,l);return Pr(r.reservedBindingKeysByGroup,u,d,f)||Lr(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function Mr(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=zr(s,t);return Fr(s,e,o),Lr(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function Nr(e,t,n){let r=new Map,i=[];function a(e,t,i,a){Lr(n,e,t,a);let o=r.get(e)||new Map;o.set(t,i),r.set(e,o)}for(let{module:t,source:n}of e)for(let e of j(n,D)){let n=Number(e.groupToken);if(e.bindingToken===`auto`){i.push({module:t,name:e.name,group:n});continue}let r=Number(e.bindingToken);Ir(t.name,n,r,e.name),a(n,r,Hr(n,t.name,e.name),`module "${t.name}" binding "${e.name}"`)}for(let{module:e,name:n,group:r}of i){let i=Hr(r,e.name,n),o=t?.get(i);o!==void 0&&a(r,o,i,`registered module binding "${i}"`)}return r}function Pr(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return i.delete(n),!0}function Fr(e,t,n){if(e===0&&t>=100)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function Ir(e,t,n,r){if(t===0&&n<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function Lr(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function Rr(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?100:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function zr(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function Br(e){let t=O(e,D);if(!t)return;let n=Ur(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):Wr(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${Gr(t.match)}".`)}function Vr(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function Hr(e,t,n){return`${e}:${t}:${n}`}function Ur(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function Wr(e,t){let n=e.indexOf(yn);return n>=0?t>n:!0}function Gr(e){return e.replace(/\s+/g,` `).trim()}var Kr=class e extends Pt{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=[...this._injectionTargets,...t.injectionTargets||[]],i=this._transpileShader(t,n,t.source,t.shaderStage??(t.computeEntryPoint?`compute`:void 0)),a={vertex:i.entryPoints?.vertex??t.vertexEntryPoint,fragment:i.entryPoints?.fragment??t.fragmentEntryPoint,compute:i.entryPoints?.compute??t.computeEntryPoint},o=e.getShaderPreprocessorDefines(t,n),s=t.platformInfo.shaderLanguage===`wgsl`&&i.code?jn(i.code,{defines:o}):i.code,{source:c,getUniforms:l,bindingAssignments:u}=Sr({...t,source:s,vertexEntryPoint:a.vertex,fragmentEntryPoint:a.fragment,defines:o,_bindingRegistry:this._wgslBindingRegistry,modules:i.modules,injectionTargets:r}),d=t.platformInfo.shaderLanguage===`wgsl`?jn(c,{defines:o}):c;return{source:d,entryPoints:a,getUniforms:l,modules:n,bindingAssignments:u,bindingTable:It(d,u),shaderLayout:ee(d,{vertexEntryPoint:a.vertex,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}},qr=/^vertex-list<([^<>]+)>$/,Jr=/^value-list<([^<>]+)>$/,Yr=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function Xr(e){return qr.test(e)}function Zr(e){return Jr.test(e)}function Qr(e){let t=qr.exec(e),n=Jr.exec(e),r=ei(e)?.elementFormat??t?.[1]??n?.[1]??e;try{C.getVertexFormatInfo(r)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return r}function $r(e){let t=Qr(e),n=Xr(e),r=Zr(e),i=ei(e),a=C.getVertexFormatInfo(t),o=a.byteLength*(i?.listSize??1);if(!Number.isSafeInteger(o))throw Error(`Unsupported GPUVector format ${e}`);let s=a.type,c=a.normalized,l=ti(s,c);return{format:e,elementFormat:t,vertexList:n,valueList:r,fixedSizeList:!!i,...i?{listSize:i.listSize}:{},type:s,signedDataType:ni(t,s),primitiveType:l,components:a.components,elementByteLength:a.byteLength,byteLength:o,integer:a.integer,signed:a.signed,normalized:c,...a.webglOnly?{webglOnly:!0}:{}}}function ei(e){let t=Yr.exec(e);if(!t)return;let n=Number(t[2]);if(!Number.isSafeInteger(n))return;let r=t[1];try{let e=C.getVertexFormatInfo(r);if(!Number.isSafeInteger(n*e.components)||!Number.isSafeInteger(n*e.byteLength))return}catch{return}return{elementFormat:r,listSize:n}}function ti(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function ni(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function ri(e){let t=0;return Object.freeze(e.map(e=>{let n=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,n}))}async function ii(e,n){if(e.destroyed)throw Error(`Resource has been destroyed.`);if(e instanceof o){if(!(e.usage&o.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);let t=n.byteOffset??0,r=Math.min(256,n.byteLength??e.byteLength-t);if(t<0||r<0||t+r>e.byteLength)throw Error(`Preview range is outside the buffer.`);return{data:r?await e.readAsync(t,r):new Uint8Array,format:n.format}}let r=e.device.getTextureFormatInfo(e.format);if(r.packed)throw Error(`Packed texture previews are not supported.`);if(e.device.type!==`webgpu`)throw Error(`Texture previews require WebGPU.`);if(!((e.props.usage??0)&t.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);if(e.samples!==1||r.compressed||e.format.startsWith(`depth`)||e.format.startsWith(`stencil`))throw Error(`Preview requires a single-sample, uncompressed color texture.`);let i=n.baseMipLevel??0,a=Math.min(32,n.width??Math.max(1,e.width>>i)),s=Math.min(32,n.height??Math.max(1,e.height>>i)),c=e.computeMemoryLayout({width:a,height:s,depthOrArrayLayers:1}),l=e.device.createBuffer({byteLength:c.byteLength,usage:o.MAP_READ|o.COPY_DST}),u=e.device.createCommandEncoder();try{u.copyTextureToBuffer({sourceTexture:e,destinationBuffer:l,mipLevel:i,origin:[0,0,n.baseArrayLayer??0],width:a,height:s,depthOrArrayLayers:1,bytesPerRow:c.bytesPerRow}),e.device.submit(u.finish());let t=await l.readAsync(),o=a*r.bytesPerPixel,d=new Uint8Array(o*s);for(let e=0;e<s;e++)d.set(t.subarray(e*c.bytesPerRow,e*c.bytesPerRow+o),e*o);return{data:d,width:a,height:s,format:e.format}}finally{l.destroy(),u.destroy()}}var ai=o.DEBUG_DATA_MAX_LENGTH,F=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:n=!1,buffer:r,ownsBuffer:i=!0,...a}=t;if(r&&r.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(r&&(a.byteLength!==void 0||a.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let s=t.id||r?.id||ae(`dynamic-buffer`),c={...a,id:s,usage:a.usage??r?.usage,indexType:a.indexType??r?.indexType};(c.usage||0)&o.INDEX&&!c.indexType&&(a.data instanceof Uint32Array?c.indexType=`uint32`:a.data instanceof Uint16Array?c.indexType=`uint16`:a.data instanceof Uint8Array&&(c.indexType=`uint8`)),delete c.data,delete c.byteOffset,this.device=e,this.id=s,this.props=c,this.usage=c.usage||0,this._debugDataEnabled=!!n,this._maxDebugDataByteLength=typeof n==`object`&&n.maxByteLength!==void 0?n.maxByteLength:ai,this._ownsBuffer=i,this._buffer=r??this.device.createBuffer({...a,id:s}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),a.data&&this._writeDebugData(a.data,a.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}};function oi(e){return typeof e==`object`&&!!e&&`buffer`in e}function si(e){return e instanceof F?e.buffer:e}function ci(e){return{buffer:si(e.buffer),offset:e.offset,size:e.size}}var li={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function ui(e){return e?Array.isArray(e)?e[0]??null:e:null}function di(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=ui(n);if(!e)return null;let{width:t}=fi(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=ui(n);return e?fi(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=ui(n[0]);return e?fi(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=ui(t);return r?fi(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=ui(e[t]);return r?fi(r):null}default:return null}}function fi(e){if(l(e))return n(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function pi(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function mi(e){return ArrayBuffer.isView(e)}function hi(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function gi(e){let t=li[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function _i(e,t){return 6*e+gi(t)}function vi(e){throw Error(`setTexture1DData not supported in WebGL.`)}function yi(e){return Array.isArray(e)?e:[e]}function bi(e,t,n,r){let i=yi(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(l(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(pi(t))o.push({type:`texture-data`,data:t,textureFormat:hi(t),z:a,mipLevel:e});else if(mi(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function xi(e){let t=[];for(let n=0;n<e.length;n++)t.push(...bi(n,e[n]));return t}function Si(e){let t=[];for(let n=0;n<e.length;n++)t.push(...bi(n,e[n]));return t}function Ci(e){let t=[];for(let[n,r]of Object.entries(e)){let e=gi(n);t.push(...bi(e,r))}return t}function wi(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=_i(n,r);t.push(...bi(e,i))}}),t}var Ti=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=ae(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let n=await this._loadAllData(e);this._checkNotDestroyed();let r=n.data?Ei({...n,width:e.width,height:e.height,format:e.format}):[],a=`format`in e&&e.format!==void 0,o=`usage`in e&&e.usage!==void 0,s=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:di(n)||{width:this.props.width||1,height:this.props.height||1};if(!s||s.width<=0||s.height<=0)throw Error(`${this} size could not be determined or was zero`);let c=Di(this.device,r,s,{format:a?e.format:void 0}),l=c.format??this.props.format,u={...this.props,...s,format:l,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(l)&&!o&&(u.usage=t.SAMPLE|t.COPY_DST);let d=this.props.mipmaps&&!c.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(l);if(this.device.type===`webgpu`&&d){let e=this.props.dimension===`3d`?t.SAMPLE|t.STORAGE|t.COPY_DST|t.COPY_SRC:t.SAMPLE|t.RENDER|t.COPY_DST|t.COPY_SRC;u.usage|=e}let f=this.device.getMipLevelCount(u.width,u.height),p=c.hasExplicitMipChain?c.mipLevels:this.props.mipLevels===`auto`?f:Math.max(1,Math.min(f,this.props.mipLevels??1)),m={...u,mipLevels:p};this._texture=this.device.createTexture(m),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),c.subresources.length&&this._setTextureSubresources(c.subresources),this.props.mipmaps&&!c.hasExplicitMipChain&&!d&&i.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),d&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),i.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):i.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof re?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:o.COPY_DST|o.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let s=this.device.createFence();return await s.signaled,s.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),i.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=li[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=vi(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=bi(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=xi(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=Si(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=Ci(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=wi(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await ji(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&i.warn(`${this} already destroyed`)}_checkReady(){this.isReady||i.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...t.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function Ei(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return vi(e.data);case`2d`:return bi(0,e.data,t,n);case`3d`:return xi(e.data);case`2d-array`:return Si(e.data);case`cube`:return Ci(e.data);case`cube-array`:return wi(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function Di(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=ki(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=Oi(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?Ai(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=ki(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=Oi(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function Oi(e){if(e.type===`texture-data`)return e.textureFormat??hi(e.data)}function ki(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function Ai(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function ji(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(ji));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(ji)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}function Mi(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function Ni(e){return e?.type===`texture`||e?.type===`external-texture`}function Pi(e,t,n){let r=b(e,t,{ignoreWarnings:!0});return Ni(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var Fi=class{values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function Ii(e){let t=Qi(e.nodes),n=ra(t,e.buffers.values()),r=ia(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return Ri(e,t,o,i,a,n,r)}async function Li(e){let t=Qi(e.nodes),n=ra(t,e.buffers.values()),r=ia(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=P.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));P.endAsyncCompilation(e.device,o);let[c,l]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),u=[],d=l.find(e=>e.status===`rejected`),f=d?.status===`rejected`?d.reason:void 0;for(let e of c)e.status===`fulfilled`?u.push(e.value):f??=e.reason;if(f){for(let e of u)e.executable.destroy?.();throw f}return Ri(e,t,u,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function Ri(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=ua(c.map(e=>e.byteLength),`imported buffer capacities`),d=ua(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=la(u,d,`logical buffer capacities`),p=ua(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=ua(g.map(ca),`imported texture estimates`),y=ua(_.map(ca),`logical transient texture estimates`),b=la(v,y,`logical texture estimates`),x=ua(o.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:la(f,b,`logical resource estimates`),physicalTransientResourceBytes:la(p,x,`physical transient resource estimates`)},w=Bi(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:C,preflight:w}}function zi(e){if(`buffer`in e){let t=e.buffer,n=`buffer`in t?t:void 0;return Object.freeze({id:n?n.buffer.id:t.id,kind:`buffer`,usage:e.usage,byteOffset:n?.byteOffset??0,byteLength:n?n.length===0?0:(n.length-1)*n.byteStride+n.rowByteLength:t.byteLength,...n?{format:n.format,length:n.length}:{}})}let t=`texture`in e?e.texture:e.externalTexture;return Object.freeze({id:`texture`in t?t.texture.id:t.id,kind:`externalTexture`in e?`external-texture`:`texture`,usage:e.usage,width:t.width,height:t.height,...`texture`in t?{baseMipLevel:t.baseMipLevel,baseArrayLayer:t.baseArrayLayer,mipLevelCount:t.mipLevelCount,arrayLayerCount:t.arrayLayerCount,aspect:t.aspect}:{},...`format`in t?{format:t.format,depth:t.depth}:{}})}function Bi(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,...e.description===void 0?{}:{description:e.description},type:e.type,resources:Object.freeze((e.resources??[]).map(zi)),...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])Ui(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,Ki(n.buffer).size));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?la(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function Vi(e){return`buffer`in e?e.buffer:e}function Hi(e){return`texture`in e?e.texture:e}function Ui(e){return`buffer`in e}function Wi(e){return`texture`in e}function Gi(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>Ui(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||Vi(r.buffer)!==Vi(n.buffer)||!Yi(r.usage)&&!Yi(n.usage))continue;let a=Ki(r.buffer),o=Ki(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=Vi(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${qi(a)} and ${qi(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function Ki(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function qi(e){return`${e.offset}–${e.offset+e.size} bytes`}function Ji(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function Yi(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function Xi(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function Zi(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function Qi(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(Ui(t)){let n=Vi(t.buffer);if(Ji(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(Yi(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(Wi(t)){let n=Hi(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&$i(n.resource,t)&&(Xi(t.usage)&&Zi(n.resource.usage)||Zi(t.usage)&&(Xi(n.resource.usage)||Zi(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function $i(e,t){if(Hi(e.texture)!==Hi(t.texture))return!1;let n=ea(e.texture),r=ea(t.texture);return ta(n.aspect,r.aspect)&&na(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&na(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function ea(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function ta(e,t){return e===`all`||t===`all`||e===t}function na(e,t,n,r){return e<n+r&&n<e+t}function ra(e,t){let n=aa(e,e=>Ui(e)?Vi(e.buffer):null),r=new Map;e.forEach((e,t)=>{if(!e.retainedBuffers?.length)return;let n=r.get(e.retainedBuffers);n?n.lastUse=t:r.set(e.retainedBuffers,{firstUse:t,lastUse:t})});for(let[e,t]of r)for(let r of e){if(!r.transient)continue;let e=n.get(r);n.set(r,{firstUse:Math.min(e?.firstUse??t.firstUse,t.firstUse),lastUse:Math.max(e?.lastUse??t.lastUse,t.lastUse)})}let i=[],a=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),s=new Fi((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),c=new Map,l=e=>{let t=e&(o.MAP_READ|o.MAP_WRITE),n=c.get(t);return n||(n=new Fi((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index),c.set(t,n)),n};for(let{buffer:e,lifetime:t}of a){if(!t)continue;for(;s.peek()&&s.peek().allocation.lastUse<t.firstUse;){let e=s.pop();l(e.allocation.usage).push(e)}let n=l(e.usage).pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:i.length},i.push(n.allocation));let{allocation:r}=n;r.byteLength=Math.max(r.byteLength,e.byteLength),r.usage|=e.usage,r.lastUse=t.lastUse,r.handles.push(e),s.push(n)}return i}function ia(e,t){let n=aa(e,e=>Wi(e)?Hi(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&sa(n.descriptor,e));n||(n={descriptor:oa(e),byteLength:ca(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function aa(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function oa(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function sa(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function ca(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=la(t,w.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function la(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function ua(e,t){return e.reduce((e,n)=>la(e,n,t),0)}var da=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},fa=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},pa=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=ri(this.data)}},ma=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},ha=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},ga=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}};function _a(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function va(e,t){for(let n of t)_a(e,n)}function ya(e){return{...e,type:`compute`}}var ba=4,xa=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){Da(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function Sa(e,t,n={}){Da(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=Ca();for(;s<a.length;){let r=wa(n,a[s]);if(s>e&&Ta(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||Ea(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:Ta(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>wa(e,t),Ca());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function Ca(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function wa(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function Ta(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function Ea(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function Da(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function Oa(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var ka=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i,a){this.readResource=a,this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let o=e.filter(e=>e.stats.condition?.outcome!==`skipped`),s=o.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:o.length,skippedNodeCount:e.length-o.length,computePassCount:n,coalescedComputeNodeCount:s-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},Aa=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);za(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),Va(e,this.device),t&&Ka(t,e,this.device);let n=this.addBuffer(new da(this,e,!1,t));if(t){let e=Ma(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof F&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),Va(e,this.device),this.addBuffer(new da(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=$r(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return Ga(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new fa(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(Xr(n)||Zr(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=$r(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new pa({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=Ua(e,this.device);return t&&qa(t,n,this.device),this.addTexture(new ma(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=Ua(e,this.device);return this.addTexture(new ma(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),Ha(e,this.device),this.addExternalTexture(new ha(this,e))}createTransientTexture(e){this.assertMutable();let t=Ua(e,this.device);return this.addTexture(new ma(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new ga(e,Wa(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)va(this,e.getCommandNodes(this));else if(`type`in e)_a(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),za(this.device,`compilation`),this.compiled=!0,new ja(Ii({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}async compileAsync(){return this.assertMutable(),za(this.device,`compilation`),this.compiled=!0,new ja(await Li({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*ba>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>Ui(e)&&Vi(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(Ui(t)){let e=Vi(t.buffer);this.assertBuffer(e),Ya(e,t.usage)}else if(Wi(t)){let e=Hi(t.texture);this.assertTexture(e),Xa(e,t.usage),Za(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}Gi(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=Ma(t.buffer),r={byteLength:Na(t),usage:n.usage},i=t.buffer instanceof F?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof F?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&Pa(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&Pa(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&Ma(n.defaultBuffer)===e&&Pa(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&Pa(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&Pa(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},ja=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(Ui(t)){let e=Vi(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(Wi(t)){let e=Hi(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=Ra(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return Sa(this.preflight,e,t)}createExecution(e,t={}){return new xa({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(za(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=Ba(),a=this.resolveImportedBuffers(t.buffers??{});Ia(t.frameTextures??{},t.externalTextures??{});let s=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),c=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of s.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of c.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of c.textures.values())this.consumedExternalTextures.add(e);let l=s.textures,u=e=>{let t=Vi(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},d=e=>{let t=Hi(e),n=t.transient?this.transientTextures.get(t):l.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},f=e=>{let t=d(e);if(e instanceof ma||eo(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},p={commandEncoder:e,parameters:t.parameters,getBuffer:u,getTexture:d,getTextureView:f,getExternalTexture:e=>{let t=c.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},m=[],h,g=0,_=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,v=()=>{let e=h;h=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=Ba();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){let e=Ba();m.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{h||(h=e.beginComputePass({id:n.id}),g++);let t=h;o=La(t,e),o&&(_=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?Oa(t,u(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...p,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}_||v();break}case`render`:{v();let t=r,i=t.getRenderPassProps?.(p)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,f):void 0,s=n.attachments?.resolveTargets?.map(e=>e?f(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=La(c,e),c.pushDebugGroup(n.id);try{t.encode({...p,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:v(),r.encode(p);break}let s=Ba();m.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{v()}let y=Ba();return new ka(m,y-i,g,i,y,async(e,t)=>{if(this.destroyed)throw Error(`Graph has been destroyed.`);let n=this.compiledNodes.findIndex(({node:t})=>t.id===e),r=this.compiledNodes[n]?.node.resources?.[t],i=this.preflight.nodes[n]?.resources?.[t];if(!r||!i)throw Error(`Resource is unavailable.`);if(`externalTexture`in r)throw Error(`External images cannot be read back.`);let a=`buffer`in r?Vi(r.buffer):Hi(r.texture);if(`frameScoped`in a&&a.frameScoped)throw Error(`Frame textures expire after presentation.`);let s=`buffer`in r?u(r.buffer):d(r.texture),c=s instanceof o?this.transientBuffers:this.transientTextures;if(a.transient&&[...c].some(([e,t])=>e!==a&&t===s))throw Error(`Transient allocation is reused; logical contents are no longer available.`);return ii(s,i)})}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);Ka(a,i,this.device);let o=Ma(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);qa(e.texture,a,this.device),n.set(a,Fa(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);qa(o,a,this.device),n.set(a,Fa(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);Ja(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function Ma(e){return e instanceof F?e.buffer:e}function Na(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function Pa(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function Fa(e){if(e instanceof Ti){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function Ia(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function La(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function Ra(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function za(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function Ba(){return globalThis.performance?.now()??Date.now()}function Va(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function Ha(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function Ua(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,n===`3d`?r:1))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function Wa(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function Ga(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function Ka(e,t,n){let r=Ma(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function qa(e,t,n){let r=Fa(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function Ja(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function Ya(e,t){let n=Qa(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function Xa(e,t){let n=$a(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function Za(e,t){if(e instanceof ga&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function Qa(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return o.STORAGE;case`uniform`:return o.UNIFORM;case`copy-source`:return o.COPY_SRC;case`copy-destination`:return o.COPY_DST;case`indirect`:return o.INDIRECT;case`vertex`:return o.VERTEX;case`index`:return o.INDEX}}function $a(e){switch(e){case`sampled`:return t.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return t.STORAGE;case`render-attachment`:return t.RENDER;case`copy-source`:return t.COPY_SRC;case`copy-destination`:return t.COPY_DST}}function eo(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var to=Uint32Array.BYTES_PER_ELEMENT,no=256;function ro(e,t,n){let r=$r(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%to!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function io(e,t){ro(e,[`uint32`],t)}function I(e,t){let n=ao(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function ao(e){let t=Math.floor(e.byteOffset/no)*no,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function L(e){if(e.byteOffset%to!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%no/to}function oo(e,t){if(e.buffer!==t.buffer||e.length===0||t.length===0)return!1;let n=e.byteOffset+(e.length-1)*e.byteStride+e.rowByteLength,r=t.byteOffset+(t.length-1)*t.byteStride+t.rowByteLength;return e.byteOffset<r&&t.byteOffset<n}function R(e,t,n,r,i=o.STORAGE){if(!Number.isSafeInteger(r)||r<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((i&o.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(Xr(n)||Zr(n))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let a=$r(n),s=e.createTransientBuffer({id:t,byteLength:Math.max(r,1)*a.byteLength,usage:i});return e.createDataView(s,{format:n,length:r})}var so=class e{static async createAsync(t,n){let r=!P.getAsyncCompilation(t),i=r?P.beginAsyncCompilation(t):P.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&P.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if(e.type!==`webgpu`)throw Error(`Kernel is only supported in WebGPU`);let{source:n,pipelineFactory:r,shaderFactory:i,debugShaders:a,...o}=t;this.device=e,this.id=t.id??`kernel`,this.source=n,this.pipelineFactory=r??P.getDefaultPipelineFactory(e),this.shaderFactory=i??Ge.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:`compute`,source:this.source,debugShaders:a});let s={...o,shader:this.shader},c=P.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(s);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(s)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}};function co(e){return e instanceof pa?e.data:[e]}function lo(e,t){let n=t[0]?.length??0;if(t.some(e=>e.length!==n))throw Error(`Aligned vectors must have equal logical lengths`);let r=t.map(co),i=t.map(()=>0),a=t.map(()=>0),o=[],s=0;for(;s<n;){for(let e=0;e<r.length;e++)for(;r[e][i[e]]?.length===a[e];)i[e]++,a[e]=0;let t=r.map((e,t)=>e[i[t]]),n=Math.min(...t.map((e,t)=>e.length-a[t])),c=[];for(let r=0;r<t.length;r++){let i=t[r],o=t.findIndex((e,t)=>t<r&&e===i&&a[t]===a[r]);c.push(o>=0?c[o]:a[r]===0&&n===i.length?i:e.createDataView(i.buffer,{format:i.format,length:n,byteOffset:i.byteOffset+a[r]*i.byteStride,byteStride:i.byteStride,rowByteLength:i.rowByteLength}))}o.push(c);for(let e=0;e<a.length;e++)a[e]+=n;s+=n}return o}var uo=120,fo=class{maxSamples;getNodeGroup;graphs=new Map;encodingGraphs=new WeakMap;constructor(e={}){let t=e.maxSamples??uo;if(!Number.isSafeInteger(t)||t<=0)throw Error(`GPUCommandGraphInspector maxSamples must be a positive safe integer`);this.maxSamples=t,this.getNodeGroup=e.getNodeGroup}registerGraph(e){this.graphs.set(e.id,{id:e.id,stats:po(e.stats),capabilities:Object.freeze({...e.capabilities}),...e.preflight?{preflight:mo(e.preflight)}:{},encodingCount:0,timingReadFailureCount:0,cpuSamples:[],gpuSamples:[],counters:new Map,nodes:new Map});let t=this.getGraph(e.id);for(let n of e.preflight?.nodes??[])this.getNode(t,n)}observeGraph(e){this.registerGraph(e);let t=this.getGraph(e.id),n=new WeakMap,r=!0,i=()=>r&&this.graphs.get(e.id)===t;return Object.freeze({graph:e,encode:(n,r)=>{let a=e.encode(n,r);return i()&&this.recordGraphEncoding(t,a),a},recordGPUTimings:async r=>{let a=n.get(r);if(a)return await a;if(i()&&this.encodingGraphs.get(r)===t){let i=this.recordGraphGPUTimings(e.id,t,r);return n.set(r,i),await i}},recordCounters:e=>{i()&&this.recordGraphCounters(t,e)},detach:()=>{r&&(r=!1,this.graphs.get(e.id)===t&&this.graphs.delete(e.id))}})}clear(){this.graphs.clear()}recordEncoding(e,t){let n=this.getGraph(e);this.recordGraphEncoding(n,t)}async readResource(e,t,n){let r=this.getGraph(e);if(!r.encoding?.readResource)throw Error(`No live resource readback is available.`);let i=await r.encoding.readResource(t,n);if(this.graphs.get(e)!==r)throw Error(`Graph registration changed during readback.`);return i}recordCounters(e,t){this.recordGraphCounters(this.getGraph(e),t)}recordGraphEncoding(e,t){e.encoding=t,this.encodingGraphs.set(t,e);let{stats:n}=t;e.encodingCount++,this.addSample(e.cpuSamples,n.cpuEncodeTimeMilliseconds);for(let t of n.nodes){let n=this.getNode(e,t);this.addSample(n.cpuSamples,t.cpuEncodeTimeMilliseconds)}}recordGraphCounters(e,t){let n=Object.entries(t);for(let[e,t]of n)if(!e||!Number.isFinite(t)||t<0)throw Error(`GPUCommandGraphInspector counters require an ID and a finite, non-negative value`);for(let[t,r]of n){let n=e.counters.get(t);n||(n=[],e.counters.set(t,n)),this.addSample(n,r)}}async recordGPUTimings(e,t){let n=this.encodingGraphs.get(t)??this.getGraph(e);return await this.recordGraphGPUTimings(e,n,t)}async recordGraphGPUTimings(e,t,n){if(this.graphs.get(e)!==t)return;let r;try{r=await n.readTimings()}catch{this.graphs.get(e)===t&&t.timingReadFailureCount++;return}if(this.graphs.get(e)===t){r.gpuTimeMilliseconds!==void 0&&this.addSample(t.gpuSamples,r.gpuTimeMilliseconds);for(let e of r.nodes)if(e.gpuTimeMilliseconds!==void 0){let n=this.getNode(t,e);this.addSample(n.gpuSamples,e.gpuTimeMilliseconds)}return r}}getSnapshot(){let e=Array.from(this.graphs.values(),e=>this.getGraphSnapshot(e));return Object.freeze({graphs:Object.freeze(e)})}getGraph(e){let t=this.graphs.get(e);if(!t)throw Error(`GPUCommandGraphInspector graph "${e}" is not registered`);return t}getNode(e,t){let n=e.nodes.get(t.id);if(n)return t.description!==void 0&&(n.description=t.description),t.resources!==void 0&&(n.resources=vo(t.resources)),n;let r=vo(t.resources),i=this.getNodeGroup?.({graphId:e.id,id:t.id,type:t.type,description:t.description,resources:r}),a={id:t.id,resources:r,...t.description===void 0?{}:{description:t.description},type:t.type,...i===void 0?{}:{group:i},cpuSamples:[],gpuSamples:[]};return e.nodes.set(a.id,a),a}addSample(e,t){e.push(t),e.length>this.maxSamples&&e.splice(0,e.length-this.maxSamples)}getGraphSnapshot(e){let t=[],n=new Set;for(let r of e.stats.nodeOrder){let i=e.nodes.get(r);i&&(t.push(i),n.add(r))}for(let r of e.nodes.values())n.has(r.id)||t.push(r);let r=t.map(e=>Object.freeze({id:e.id,resources:e.resources,...e.description===void 0?{}:{description:e.description},type:e.type,...e.group===void 0?{}:{group:e.group},cpu:ho(e.cpuSamples),gpu:ho(e.gpuSamples)})),i=Array.from(e.counters,([e,t])=>go(e,t));return Object.freeze({id:e.id,stats:e.stats,capabilities:e.capabilities,...e.preflight?{preflight:e.preflight}:{},encodingCount:e.encodingCount,timingReadFailureCount:e.timingReadFailureCount,totals:Object.freeze({cpu:ho(e.cpuSamples),gpu:ho(e.gpuSamples)}),counters:Object.freeze(i),nodes:Object.freeze(r)})}};function po(e){return Object.freeze({...e,nodeOrder:Object.freeze([...e.nodeOrder])})}function mo(e){return Object.freeze({...e,nodes:Object.freeze(e.nodes.map(e=>Object.freeze({...e,resources:vo(e.resources)})))})}function ho(e){if(e.length===0)return Object.freeze({sampleCount:0});let t=[...e].sort((e,t)=>e-t);return Object.freeze({sampleCount:e.length,latestMilliseconds:e[e.length-1],p50Milliseconds:_o(t,.5),p95Milliseconds:_o(t,.95)})}function go(e,t){let n=[...t].sort((e,t)=>e-t);return Object.freeze({id:e,sampleCount:t.length,latestValue:t[t.length-1],p50Value:_o(n,.5),p95Value:_o(n,.95)})}function _o(e,t){return e[Math.ceil(t*e.length)-1]}function vo(e){return e&&Object.freeze(e.map(e=>Object.freeze({...e})))}var yo=4294967295,bo=4294967296;function xo(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>yo)throw Error(`${e} element count must be a non-negative uint32`);Co(e,n);let i=Math.floor(r);if(!Number.isSafeInteger(i)||i<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let a=Math.max(1,Math.ceil(t/n)),o=Math.min(a,i),s=Math.min(Math.ceil(a/o),i),c=Math.ceil(a/o/s);if(c>i)throw Error(`${e} requires ${a} workgroups, exceeding the 3D dispatch limit of ${i} per dimension`);return{x:o,y:s,z:c}}function So(e,t){Co(`GPU dispatch`,t);let n=Math.floor(yo/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function Co(e,t){if(!Number.isSafeInteger(t)||t<2||t>yo||bo%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function wo(e,t){let[n,r,i]=t;for(let[e,t]of[[`x`,n],[`y`,r],[`z`,i]])if(!Number.isSafeInteger(t)||t<0)throw Error(`compute dispatch ${e} workgroup count must be a non-negative safe integer`);return{...e,dispatchWorkgroups:Object.freeze([n,r,i])}}function To(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var z=256,Eo=64;function Do(e,t=!1){return t?`portable`:To(e,{requiresSubgroupId:!0})}var Oo=class{id;input;output;mode;segmentFlags;constructor(e){if(this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,Po(this.input,`${this.id} input`),Po(this.output,`${this.id} output`),this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.output instanceof pa&&this.output.length!==this.input.length)throw Error(`${this.id} vector output length must equal input length`);if(this.segmentFlags){if(Po(this.segmentFlags,`${this.id} segmentFlags`),this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);if(this.segmentFlags instanceof pa&&this.segmentFlags.length!==this.input.length)throw Error(`${this.id} vector segmentFlags length must equal input length`);let e=new Set(Fo(this.output).map(e=>e.buffer));if(Fo(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}getCommandNodes(e){let t=[];return t.push(...ko(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function ko(e,t,n){let r=[];Io(t,e.input,e.id),Io(t,e.output,e.id),e.segmentFlags&&Io(t,e.segmentFlags,e.id);let i=Ao(t,e.output,e.input.length),a=e.segmentFlags?Ao(t,e.segmentFlags,e.input.length):void 0,o=a?lo(t,[e.input,i,a]):lo(t,[e.input,i]);return r.push(...jo(t,{id:e.id,inputChunks:o.map(e=>e[0]),outputChunks:o.map(e=>e[1]),segmentFlagChunks:a?o.map(e=>e[2]):void 0,isVector:o.length>1,mode:e.mode},n)),r}function Ao(e,t,n){return t.length===n||t instanceof pa?t:e.createDataView(t.buffer,{format:t.format,length:n,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}function jo(e,t,n){let r=[],i=t.inputChunks,a=t.outputChunks,o=t.segmentFlagChunks,s=i.map((e,t)=>({chunkIndex:t,input:e,output:a[t],segmentFlags:o?.[t]})).filter(e=>e.input.length>0);if(s.length===0)return r;if(s.length===1){let i=s[0];return r.push(...Mo(e,{id:t.isVector?`${t.id}-chunk-${i.chunkIndex}`:t.id,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,maxComputeWorkgroupsPerDimension:n})),r}let c=R(e,`${t.id}-chunk-totals`,`uint32`,s.length),l=R(e,`${t.id}-chunk-offsets`,`uint32`,s.length),u=o?R(e,`${t.id}-chunk-segment-flags`,`uint32`,s.length):void 0,d=o?s.map(n=>R(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[i,a]of s.entries())r.push(...Mo(e,{id:`${t.id}-chunk-${a.chunkIndex}`,input:a.input,output:a.output,mode:t.mode,segmentFlags:a.segmentFlags,outputSegmentPrefixes:d?.[i],finalSum:No(e,c,i),finalSegmentFlag:u?No(e,u,i):void 0,maxComputeWorkgroupsPerDimension:n}));r.push(...Mo(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n}));for(let[i,a]of s.entries())r.push(...Bo(e,{id:`${t.id}-chunk-${a.chunkIndex}-add-carry`,output:a.output,offsets:l,length:a.output.length,offsetIndex:i,segmentPrefixes:d?.[i],dispatchLayout:Vo(a.output.length,n)}));return r}function Mo(e,t){let n=[];if(t.input.length===0)return n;let r=[],i=t.input,a=t.output,o=t.segmentFlags,s=t.input.length,c=0;for(;;){let l=Math.ceil(s/z),u,d;l>1&&(u=R(e,`${t.id}-level-${c}-block-sums`,`uint32`,l),o&&(d=R(e,`${t.id}-level-${c}-block-segment-flags`,`uint32`,l)));let f=o?c===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:l>1||c>0?R(e,`${t.id}-level-${c}-segment-prefixes`,`uint32`,s):void 0:void 0;if(n.push(...Lo(e,{id:`${t.id}-level-${c}-scan`,input:i,output:a,mode:c===0?t.mode:`exclusive`,segmentFlags:o,segmentSummaryInput:!!o&&(c>0||t.segmentSummaryInput),segmentPrefixes:f,blockSums:u,blockSegmentFlags:d,finalSum:u?void 0:t.finalSum,finalSegmentFlag:u?void 0:t.finalSegmentFlag,length:s,blockCount:l,dispatchLayout:Vo(s,t.maxComputeWorkgroupsPerDimension)})),r.push({output:a,length:s,segmentPrefixes:f}),!u)break;let p=R(e,`${t.id}-level-${c}-block-offsets`,`uint32`,l);r[r.length-1].blockOffsets=p,i=u,a=p,o=d,s=l,c++}for(let i=r.length-2;i>=0;i--){let a=r[i],o=r[i+1];n.push(...Bo(e,{id:`${t.id}-level-${i}-add-offsets`,output:a.output,offsets:a.blockOffsets,length:a.length,segmentPrefixes:a.segmentPrefixes,offsetSegmentPrefixes:o.segmentPrefixes,dispatchLayout:Vo(a.length,t.maxComputeWorkgroupsPerDimension)}))}return n}function No(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function Po(e,t){let n=e instanceof pa?e.data:[e];for(let e of n)io(e,t)}function Fo(e){return e instanceof pa?e.data:[e]}function Io(e,t,n){if((t instanceof pa?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function Lo(e,t){let n=[],r=t.blockSums??t.finalSum,i=t.blockSegmentFlags??t.finalSegmentFlag,a=r?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,o=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,s=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,c=i?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,l=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,u=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,d=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,f=t.segmentFlags?`if (lane >= stride) {
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
var<workgroup> scratch: array<u32, ${z}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${z}>;`:``}

@compute @workgroup_size(${z}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Ho(t.dispatchLayout)}
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

  for (var stride = 1u; stride < ${z}u; stride = stride * 2u) {
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

  if (lane == ${z-1}u) {
    ${l}
    ${u}
  }
  if (index < ELEMENT_COUNT) {
    ${m}
    ${h}
  }
}`,_=Ro(e,!!t.segmentFlags,t.length),v=_===`subgroups`?zo(t,r,a):g;return n.push(ya({id:t.id,workload:{operation:`GPUScan`,variant:_,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*z,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...r?[{buffer:r,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...i?[{buffer:i,usage:`storage-write`}]:[]],compile:({device:e})=>{let n=new so(e,{id:t.id,source:v,shaderLayout:{bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...r?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...i?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]}});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:I(t.input,a),outputValues:I(t.output,a)};r&&(o.sumValues=I(r,a)),t.segmentFlags&&(o.segmentFlags=I(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=I(t.segmentPrefixes,a)),i&&(o.summarySegmentFlags=I(i,a)),n.dispatch(e,{bindings:o,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>wo(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function Ro(e,t,n){let r=Do(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||Do(e.device,!1)===`subgroups`}]}).variant}function zo(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/z)+1;return`
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
var<workgroup> subgroupOffsets: array<u32, ${Eo}>;

@compute @workgroup_size(${z}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${z}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${z}u / subgroupSize;
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
  if (lane == ${z-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function Bo(e,t){let n=[],r=t.offsetIndex===void 0?`index / ${z}u`:`${t.offsetIndex}u`,i=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${L(t.output)}u;
const OFFSETS_OFFSET: u32 = ${L(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${L(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${L(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${z}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Ho(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${r}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${r}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`;return n.push(ya({id:t.id,workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*z,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new so(e,{id:t.id,source:i,shaderLayout:{bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]}});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:I(t.output,r),offsets:I(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=I(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=I(t.offsetSegmentPrefixes,r)),n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>wo(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function Vo(e,t){return xo(`GPUScan`,e,z,t)}function Ho(e){return So(e,z)}function Uo(e,t){let n=[...Object.entries(t.inputs??{}),...Object.entries(t.outputs)];for(let[,t]of n)if(ao(t).size>e.device.limits.maxStorageBufferBindingSize)throw Error(`Active chunks must fit a storage binding`);let r=t.dispatch.x*t.dispatch.y*t.dispatch.z;return wo(ya({id:t.id,workload:{commandCount:1,maximumWorkgroupCount:r,maximumInvocationCount:r*(t.workgroupSize??256)},resources:[...Object.values(t.inputs??{}).map(e=>({buffer:e,usage:`storage-read`})),...Object.values(t.outputs).map(e=>({buffer:e,usage:`storage-read-write`}))],compile:({device:e})=>{let r=new so(e,{id:t.id,source:t.source,shaderLayout:{bindings:n.map(([e],n)=>({name:e,group:0,location:n,type:n<Object.keys(t.inputs??{}).length?`read-only-storage`:`storage`}))}});return{encode:({computePass:e,getBuffer:i})=>{let a={};for(let[e,t]of n)a[e]=I(t,i);r.dispatch(e,{bindings:a,x:t.dispatch.x,y:t.dispatch.y,z:t.dispatch.z})},destroy:()=>r.destroy()}}}),[t.dispatch.x,t.dispatch.y,t.dispatch.z])}function Wo(e,t,n){let r=[],i=lo(e,[t.keys,t.values]),a=lo(e,[t.outputKeys,t.outputValues]),o=i.map(([i,a],o)=>{let s=`${t.id}-span-${o}`,c=R(e,`${s}-keys`,`uint32`,i.length),l=R(e,`${s}-values`,`uint32`,i.length),u=R(e,`${s}-ranks`,`uint32`,i.length);return r.push(...$o(new Qo({id:s,keys:i,values:a,outputKeys:c,outputValues:l,algorithm:t.resolvedAlgorithm,direction:t.direction,keyBits:t.keyBits}),e,n)),{keys:c,values:l,ranks:u}}),s=t.resolvedAlgorithm===`radix`&&t.keyBits<32?2**t.keyBits-1:4294967295,c=t.direction===`ascending`?`<`:`>`;for(let[i,l]of o.entries()){let u=xo(`GPUSort merge`,l.keys.length,256,n),d=So(u,256);r.push(Uo(e,{id:`${t.id}-ranks-${i}`,outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index < ${l.keys.length}u) { ranks[index] = index; }
}`}));for(let[n,a]of o.entries())n!==i&&r.push(Uo(e,{id:`${t.id}-rank-${i}-against-${n}`,inputs:{keys:l.keys,otherKeys:a.keys},outputs:{ranks:l.ranks},dispatch:u,source:`
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
}`}));let f=0;for(let[n,[o,s]]of a.entries())r.push(Uo(e,{id:`${t.id}-publish-${i}-${n}`,inputs:{keys:l.keys,values:l.values,ranks:l.ranks},outputs:{outputKeys:o,outputValues:s},dispatch:u,source:`
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
}`})),f+=o.length}return r}var Go=256,Ko=256,qo=4,Jo=Ko/32,Yo=4294967295,Xo=2147483648,Zo=Go,Qo=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])for(let n of co(t))io(n,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>Xo)throw Error(`${this.id} supports at most ${Xo} rows`);ts(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=Zo?`bitonic`:`radix`:this.algorithm}getCommandNodes(e){let t=[];return t.push(...$o(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function $o(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])for(let r of co(n))if(r.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);return[e.keys,e.values,e.outputKeys,e.outputValues].some(e=>e instanceof pa)?Wo(t,e,n):es(e,t,n)}function es(e,t,n){let r=[];if(e.keys.length===0)return r;if(e.keys.length===1)return r.push(...ns(t,e)),r;let i=xo(`GPUSort`,e.keys.length,Ko,n);return e.resolvedAlgorithm===`bitonic`?r.push(...rs(t,e,i,n)):r.push(...us(t,e,i,n)),r}function ts(e){let t=co(e.outputKeys),n=co(e.outputValues),r=[...co(e.keys),...co(e.values)];if([...t,...n].some(e=>r.some(t=>t.buffer===e.buffer))||t.some(e=>n.some(t=>e.buffer===t.buffer)))throw Error(`${e.id} outputs must use separate buffers from inputs and each other`);for(let r of[t,n])for(let[t,n]of r.entries())if(r.slice(0,t).some(e=>oo(e,n)))throw Error(`${e.id} output chunks must not overlap`)}function ns(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=[],s=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${L(n)}u;
const VALUES_OFFSET: u32 = ${L(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${L(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${L(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${Ko}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${So(a,Ko)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;return o.push(...hs(e,{id:`${t.id}-${i}`,source:s,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})),o}function rs(e,t,n,r){let i=[],a=ps(t.keys.length);if(a<=Go)return i.push(...is(e,t,a)),i;let o=xo(`GPUSort bitonic`,a,Go,r),s=R(e,`${t.id}-bitonic-indices-a`,`uint32`,a),c=R(e,`${t.id}-bitonic-indices-b`,`uint32`,a);i.push(...ss(e,t,s,a,o));let l=s,u=c;for(let n of ms(a))i.push(...cs(e,t,l,u,a,n,o)),[l,u]=[u,l];return i.push(...ls(e,t,l,n)),i}function is(e,t,n){let r=[],i=t.direction===`descending`,a=To(e.device,{requiresSubgroupId:!0})===`subgroups`,o=`
${a?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${Yo}u;
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
${a?os():as()}
}`;return r.push(...hs(e,{id:`${t.id}-bitonic-local`,source:o,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})),r}function as(){return`
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
  }`}function os(){return`
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
  }`}function ss(e,t,n,r,i){let a=[],o=`
const INVALID_INDEX: u32 = ${Yo}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${L(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${Go}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${So(i,Go)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;return a.push(...hs(e,{id:`${t.id}-bitonic-initialize`,source:o,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})),a}function cs(e,t,n,r,i,a,o){let s=[],c=t.direction===`descending`,l=`
const INVALID_INDEX: u32 = ${Yo}u;
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

@compute @workgroup_size(${Go}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${So(o,Go)}
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
}`;return s.push(...hs(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})),s}function ls(e,t,n,r){let i=[],a=`
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

@compute @workgroup_size(${Go}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${So(r,Go)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;return i.push(...hs(e,{id:`${t.id}-bitonic-gather`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})),i}function us(e,t,n,r){let i=[],a=Math.ceil(t.keyBits/qo),o=Math.ceil(t.keys.length/Ko),s=a>1?R(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,c=a>1?R(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,l=t.keys,u=t.values;for(let d=0;d<a;d++){let f=d*qo,p=Math.min(qo,t.keyBits-f),m=2**p,h=R(e,`${t.id}-radix-digit-${f}-histogram`,`uint32`,m*o),g=R(e,`${t.id}-radix-digit-${f}-offsets`,`uint32`,m*o),_=(a-d)%2==1,v=_?t.outputKeys:s,y=_?t.outputValues:c;if(!v||!y)throw Error(`${t.id} radix scratch is missing`);i.push(...ds(e,t,l,h,f,p,o,n));let b=new Oo({id:`${t.id}-radix-digit-${f}-scan`,input:h,output:g});i.push(...ko(b,e,r)),i.push(...fs(e,t,l,u,g,v,y,f,p,o,n)),l=v,u=y}return i}function ds(e,t,n,r,i,a,o,s){let c=[],l=2**a,u=t.direction===`descending`,d=`
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

@compute @workgroup_size(${Ko}) fn main(
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

  let index = workgroupIndex * ${Ko}u + localInvocationIndex;
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
}`;return c.push(...hs(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:d,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})),c}function fs(e,t,n,r,i,a,o,s,c,l,u){let d=[],f=2**c,p=t.direction===`descending`,m=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${f-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${Jo}u;
const MASK_COUNT: u32 = ${f*Jo}u;
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
var<workgroup> digitMasks: array<atomic<u32>, ${f*Jo}>;

@compute @workgroup_size(${Ko}) fn main(
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

  let index = workgroupIndex * ${Ko}u + localInvocationIndex;
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
}`;return d.push(...hs(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:m,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})),d}function ps(e){let t=1;for(;t<e;)t*=2;return t}function ms(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function hs(e,t){let n=[];return n.push(ya({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new so(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=I(n,r);n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n}1/Math.PI*180,1/180*Math.PI;var gs={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...gs}};var B=globalThis.mathgl.config;function _s(e,{precision:t=B.precision}={}){return e=bs(e),`${parseFloat(e.toPrecision(t))}`}function vs(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function ys(e,t,n){let r=B.EPSILON;n&&(B.EPSILON=n);try{if(e===t)return!0;if(vs(e)&&vs(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!ys(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`?Math.abs(e-t)<=B.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{B.EPSILON=r}}function bs(e){return Math.round(e/B.EPSILON)*B.EPSILON}var xs=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:vs(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(B)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+_s(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!ys(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r];this[r]=i+n*((typeof t==`number`?t:t[r])-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(B.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}};function Ss(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function Cs(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function ws(e,t,n=``){if(B.debug&&!Ss(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}var Ts=class extends xs{toString(){let e=`[`;if(B.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=Cs(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}},Es=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180;function Ds(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}function Os(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function ks(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function As(){let e=new Es(3);return Es!==Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function js(e){let t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)}function Ms(e,t,n){let r=new Es(3);return r[0]=e,r[1]=t,r[2]=n,r}function Ns(e,t){let n=t[0],r=t[1],i=t[2],a=n*n+r*r+i*i;return a>0&&(a=1/Math.sqrt(a)),e[0]=t[0]*a,e[1]=t[1]*a,e[2]=t[2]*a,e}function Ps(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function Fs(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function Is(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}var Ls=js;function Rs(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function zs(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function Bs(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function Vs(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function Hs(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function Us(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function Ws(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function Gs(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,j=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*j,e[9]=f*k+g*A+b*j,e[10]=p*k+_*A+x*j,e[11]=m*k+v*A+S*j,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function Ks(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function qs(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function Js(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function Ys(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function Xs(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function Zs(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var Qs=Zs;function $s(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var ec=$s;function tc(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?Rs(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function nc(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e[3]=t[3]+n[3],e}function rc(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function ic(e){let t=e[0],n=e[1],r=e[2],i=e[3];return Math.sqrt(t*t+n*n+r*r+i*i)}function ac(e){let t=e[0],n=e[1],r=e[2],i=e[3];return t*t+n*n+r*r+i*i}function oc(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a;return o>0&&(o=1/Math.sqrt(o)),e[0]=n*o,e[1]=r*o,e[2]=i*o,e[3]=a*o,e}function sc(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]+e[3]*t[3]}function cc(e,t,n,r){let i=t[0],a=t[1],o=t[2],s=t[3];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e[3]=s+r*(n[3]-s),e}function lc(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}var uc;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL0ROW3=3]=`COL0ROW3`,e[e.COL1ROW0=4]=`COL1ROW0`,e[e.COL1ROW1=5]=`COL1ROW1`,e[e.COL1ROW2=6]=`COL1ROW2`,e[e.COL1ROW3=7]=`COL1ROW3`,e[e.COL2ROW0=8]=`COL2ROW0`,e[e.COL2ROW1=9]=`COL2ROW1`,e[e.COL2ROW2=10]=`COL2ROW2`,e[e.COL2ROW3=11]=`COL2ROW3`,e[e.COL3ROW0=12]=`COL3ROW0`,e[e.COL3ROW1=13]=`COL3ROW1`,e[e.COL3ROW2=14]=`COL3ROW2`,e[e.COL3ROW3=15]=`COL3ROW3`})(uc||={});var dc=45*Math.PI/180,fc=1,pc=.1,mc=500,hc=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),gc=class extends Ts{static get IDENTITY(){return bc()}static get ZERO(){return yc()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return uc}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(hc)}fromObject(e){return this.check()}fromQuaternion(e){return Ys(this,e),this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=pc,far:o=mc}=e;return o===1/0?Sc(this,t,n,r,i,a):Xs(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return tc(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=pc,far:o=mc}=e;return ec(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=dc,aspect:n=fc,focalDistance:r=1,near:i=pc,far:a=mc}=e;xc(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return xc(t),Qs(this,t,n,r,i),this.check()}determinant(){return Vs(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=0,e[4]=this[4]*r,e[5]=this[5]*i,e[6]=this[6]*a,e[7]=0,e[8]=this[8]*r,e[9]=this[9]*i,e[10]=this[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=this[4]*r,e[4]=this[5]*i,e[5]=this[6]*a,e[6]=this[8]*r,e[7]=this[9]*i,e[8]=this[10]*a,e}transpose(){return zs(this,this),this.check()}invert(){return Bs(this,this),this.check()}multiplyLeft(e){return Hs(this,e,this),this.check()}multiplyRight(e){return Hs(this,this,e),this.check()}rotateX(e){return Ks(this,this,e),this.check()}rotateY(e){return qs(this,this,e),this.check()}rotateZ(e){return Js(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return Gs(this,this,e,t),this.check()}scale(e){return Ws(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return Us(this,this,e),this.check()}transform(e,t){return e.length===4?(t=lc(t||[-0,-0,-0,-0],e,this),ws(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=Ds(t||[-0,-0],e,this);break;case 3:r=Is(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ws(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=Os(t||[-0,-0],e,this);break;case 3:n=ks(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ws(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},_c,vc;function yc(){return _c||(_c=new gc([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(_c)),_c}function bc(){return vc||(vc=new gc,Object.freeze(vc)),vc}function xc(e){if(e>Math.PI*2)throw Error(`expected radians`)}function Sc(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}function Cc(e){return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e}function wc(e,t,n){n*=.5;let r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e}function Tc(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1],l=n[2],u=n[3];return e[0]=r*u+o*s+i*l-a*c,e[1]=i*u+o*c+a*s-r*l,e[2]=a*u+o*l+r*c-i*s,e[3]=o*u-r*s-i*c-a*l,e}function Ec(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+o*s,e[1]=i*c+a*s,e[2]=a*c-i*s,e[3]=o*c-r*s,e}function Dc(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c-a*s,e[1]=i*c+o*s,e[2]=a*c+r*s,e[3]=o*c-i*s,e}function Oc(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+i*s,e[1]=i*c-r*s,e[2]=a*c+o*s,e[3]=o*c-a*s,e}function kc(e,t){let n=t[0],r=t[1],i=t[2];return e[0]=n,e[1]=r,e[2]=i,e[3]=Math.sqrt(Math.abs(1-n*n-r*r-i*i)),e}function Ac(e,t,n,r){let i=t[0],a=t[1],o=t[2],s=t[3],c=n[0],l=n[1],u=n[2],d=n[3],f,p,m,h,g;return f=i*c+a*l+o*u+s*d,f<0&&(f=-f,c=-c,l=-l,u=-u,d=-d),1-f>1e-6?(p=Math.acos(f),g=Math.sin(p),m=Math.sin((1-r)*p)/g,h=Math.sin(r*p)/g):(m=1-r,h=r),e[0]=m*i+h*c,e[1]=m*a+h*l,e[2]=m*o+h*u,e[3]=m*s+h*d,e}function jc(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a,s=o?1/o:0;return e[0]=-n*s,e[1]=-r*s,e[2]=-i*s,e[3]=a*s,e}function Mc(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=t[3],e}function Nc(e,t){let n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[5]-t[7])*r,e[1]=(t[6]-t[2])*r,e[2]=(t[1]-t[3])*r;else{let n=0;t[4]>t[0]&&(n=1),t[8]>t[n*3+n]&&(n=2);let i=(n+1)%3,a=(n+2)%3;r=Math.sqrt(t[n*3+n]-t[i*3+i]-t[a*3+a]+1),e[n]=.5*r,r=.5/r,e[3]=(t[i*3+a]-t[a*3+i])*r,e[i]=(t[i*3+n]+t[n*3+i])*r,e[a]=(t[a*3+n]+t[n*3+a])*r}return e}var Pc=nc,Fc=rc,Ic=sc,Lc=cc,Rc=ic,zc=ac,Bc=oc,Vc=(function(){let e=As(),t=Ms(1,0,0),n=Ms(0,1,0);return function(r,i,a){let o=Ps(i,a);return o<-.999999?(Fs(e,t,i),Ls(e)<1e-6&&Fs(e,n,i),Ns(e,e),wc(r,e,Math.PI),r):o>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(Fs(e,i,a),r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=1+o,Bc(r,r))}})(),Hc=class extends xs{constructor(e=0,t=0,n=0,r=1){super(-0,-0,-0,-0),Array.isArray(e)&&arguments.length===1?this.copy(e):this.set(e,t,n,r)}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}set(e,t,n,r){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this.check()}fromObject(e){return this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this.check()}fromMatrix3(e){return Nc(this,e),this.check()}fromEuler(e){switch(this.identity(),e.order){case`xyz`:return this.rotateX(e.x).rotateY(e.y).rotateZ(e.z);case`yxz`:return this.rotateY(e.y).rotateX(e.x).rotateZ(e.z);case`zxy`:return this.rotateZ(e.z).rotateX(e.x).rotateY(e.y);case`zyx`:return this.rotateZ(e.z).rotateY(e.y).rotateX(e.x);case`yzx`:return this.rotateY(e.y).rotateZ(e.z).rotateX(e.x);case`xzy`:return this.rotateX(e.x).rotateZ(e.z).rotateY(e.y);default:throw Error(`Unknown Euler angle order`)}}fromAxisRotation(e,t){return wc(this,e,t),this.check()}identity(){return Cc(this),this.check()}setAxisAngle(e,t){return this.fromAxisRotation(e,t)}get ELEMENTS(){return 4}get x(){return this[0]}set x(e){this[0]=Cs(e)}get y(){return this[1]}set y(e){this[1]=Cs(e)}get z(){return this[2]}set z(e){this[2]=Cs(e)}get w(){return this[3]}set w(e){this[3]=Cs(e)}len(){return Rc(this)}lengthSquared(){return zc(this)}dot(e){return Ic(this,e)}rotationTo(e,t){return Vc(this,e,t),this.check()}add(e){return Pc(this,this,e),this.check()}calculateW(){return kc(this,this),this.check()}conjugate(){return Mc(this,this),this.check()}invert(){return jc(this,this),this.check()}lerp(e,t,n){return n===void 0?this.lerp(this,e,t):(Lc(this,e,t,n),this.check())}multiplyRight(e){return Tc(this,this,e),this.check()}multiplyLeft(e){return Tc(this,e,this),this.check()}normalize(){let e=this.len(),t=e>0?1/e:0;return this[0]*=t,this[1]*=t,this[2]*=t,this[3]*=t,e===0&&(this[3]=1),this.check()}rotateX(e){return Ec(this,this,e),this.check()}rotateY(e){return Dc(this,this,e),this.check()}rotateZ(e){return Oc(this,this,e),this.check()}scale(e){return Fc(this,this,e),this.check()}slerp(e,t,n){let r,i,a;switch(arguments.length){case 2:r=this,i=e,a=t;break;default:r=e,i=t,a=n}return Ac(this,r,i,a),this.check()}lengthSq(){return this.lengthSquared()}setFromAxisAngle(e,t){return this.setAxisAngle(e,t)}premultiply(e){return this.multiplyLeft(e)}multiply(e){return this.multiplyRight(e)}};function V(e,t){let{bindings:n={},...r}=t;return{kernel:new so(e,r),bindings:{...n}}}async function H(e,t){let{bindings:n={},...r}=t;return{kernel:await so.createAsync(e,r),bindings:{...n}}}function Uc(e,t){if(!Number.isFinite(e)||e<0)throw Error(`Invalid body mass`);if(t.type===`sphere`){if(!(t.radius>0)||!Number.isFinite(t.radius))throw Error(`Invalid sphere radius`);let n=.4*e*t.radius**2;return[n,n,n]}if(t.halfExtents.some(e=>!(e>0)||!Number.isFinite(e)))throw Error(`Invalid box extents`);let[n,r,i]=t.halfExtents;return[e*(r**2+i**2)/3,e*(n**2+i**2)/3,e*(n**2+r**2)/3]}function Wc(e){let t=new ArrayBuffer(4),n=new DataView(t),r=e.map(e=>e.map(e=>{n.setFloat32(0,e);let t=n.getUint32(0),r=t>>>23&255;return{mantissa:BigInt(t&8388607|(r?8388608:0))*(t>>>31?-1n:1n),exponent:r?r-150:-149}})),i=128;for(let e of r)for(let t of e)t.mantissa!==0n&&(i=Math.min(i,t.exponent));let a=r.map(e=>e.map(e=>e.mantissa===0n?0n:e.mantissa<<BigInt(e.exponent-i)));return(e,t,n,r)=>{let i=a[e],o=a[t].map((e,t)=>e-i[t]),s=a[n].map((e,t)=>e-i[t]),c=a[r].map((e,t)=>e-i[t]),l=(o[1]*s[2]-o[2]*s[1])*c[0]+(o[2]*s[0]-o[0]*s[2])*c[1]+(o[0]*s[1]-o[1]*s[0])*c[2];return l>0n?1:l<0n?-1:0}}function Gc(e){if(e.type===`convex-hull`||e.type===`triangle-mesh`)return e.geometry;if(e.type===`plane`){if([e.sizeX,e.sizeZ].some(e=>e!==void 0&&(!Number.isFinite(e)||e<=0)))throw Error(`Invalid plane extent`);return{volume:0,center:[0,0,0],tensor:Array(9).fill(0)}}if(e.type===`sphere`||e.type===`box`){let t=Uc(1,e),n=e.type===`sphere`?4*Math.PI*e.radius**3/3:8*e.halfExtents[0]*e.halfExtents[1]*e.halfExtents[2];return{volume:n,center:[0,0,0],tensor:[t[0]*n,0,0,0,t[1]*n,0,0,0,t[2]*n]}}let{height:t,radiusBottom:n,radiusTop:r}=e;if(![t,n,r].every(Number.isFinite)||t<=0||Math.min(n,r)<0||Math.max(n,r)<=0)throw Error(`Invalid tapered shape`);let i=[],a=(e,t,n,r)=>i.push({lower:n,upper:r,radiusSquared:[t*t-e*e,2*e,-1]}),o=(e,t,n,r)=>{let a=(r-n)/(t-e),o=n-a*e;i.push({lower:e,upper:t,radiusSquared:[o*o,2*o*a,a*a]})};if(e.type===`cylinder`)o(-t/2,t/2,n,r);else if(Math.abs(r-n)>=t){let e=r>=n,i=e?t/2:-t/2,o=e?r:n;a(i,o,i-o,i+o)}else{let e=(r-n)/t,i=Math.sqrt(1-e*e),s=-t/2-n*e,c=t/2-r*e;a(-t/2,n,-t/2-n,s),o(s,c,n*i,r*i),a(t/2,r,c,t/2+r)}let s=(e,t,n,r=0)=>e.reduce((e,i,a)=>e+i*(n**(a+r+1)-t**(a+r+1))/(a+r+1),0),c=0,l=0,u=0,d=0;for(let{lower:e,upper:t,radiusSquared:n}of i){let r=[,,,,,].fill(0);for(let e=0;e<3;e++)for(let t=0;t<3;t++)r[e+t]+=n[e]*n[t];c+=Math.PI*s(n,e,t),l+=Math.PI*s(n,e,t,1),u+=Math.PI*s(r,e,t)/2,d+=Math.PI*(s(n,e,t,2)+s(r,e,t)/4)}let f=l/c;return d-=c*f*f,{volume:c,center:[0,f,0],tensor:[d,0,0,0,u,0,0,0,d]}}function Kc(e,t,n,r,i,a,s,c){let l=[{name:`positions`,count:r,stride:1,offset:0,contacts:!1},{name:`targets`,count:r,stride:2,offset:0,contacts:!1},{name:`manifolds`,count:a*4,stride:0,offset:0,contacts:!0},{name:`trigger-previous`,count:i,stride:1,offset:0,contacts:!1},{name:`contact-events`,count:s,stride:4,offset:3,contacts:!1}],u=[],d=e.createBuffer({data:new Float32Array([...c,0]),usage:o.UNIFORM|o.COPY_DST});try{let r=e.createCommandEncoder(),i=r.beginComputePass();for(let r of l){let a=n.find(e=>e.id===`${t}-${r.name}`);if(!a||!r.count)continue;let o=Math.min(Math.ceil(r.count/64),e.limits.maxComputeWorkgroupsPerDimension),s=V(e,{source:`
@group(0) @binding(0) var<storage,read_write> values:array<vec4f>;
@group(0) @binding(1) var<uniform> shift:vec4f;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u) {
 let index=invocation.x+invocation.y*${o*64}u;
 if(index>=${r.count}u){return;}
 let address=${r.contacts?`(index/4u)*26u+(index%4u)*6u`:`${r.offset}u+index*${r.stride}u`};
 values[address]=vec4f(values[address].xyz-shift.xyz,values[address].w);
}`,shaderLayout:{bindings:[{name:`values`,group:0,location:0,type:`storage`},{name:`shift`,group:0,location:1,type:`uniform`}]},bindings:{values:a,shift:d}});u.push(s),s.kernel.dispatch(i,{bindings:s.bindings,x:o,y:Math.ceil(r.count/(o*64))})}i.end(),e.submit(r.finish())}finally{for(let e of u)e.kernel.destroy();d.destroy()}}function qc(e,t,n,r=!1){if(!t||!n)return`
fn bodyScheduled(body:u32)->bool{return true;}
fn colliderScheduled(collider:u32)->bool{return true;}
fn scheduledBody(index:u32)->u32{return index;}
fn scheduledCollider(index:u32)->u32{return index;}
fn scheduledBodyCount()->u32{return BODY_COUNT;}
fn scheduledColliderCount()->u32{return COLLIDER_COUNT;}
`;let i=e/t;return`
const INSTANCE_COUNT:u32=${i}u;
const INSTANCE_BODIES:u32=${t}u;
const INSTANCE_COLLIDERS:u32=${n}u;
const INSTANCE_QUEUE:u32=${16+i*8}u;
@group(0) @binding(28) var<storage,read_write> ensemble:array<atomic<u32>>;
fn bodyScheduled(body:u32)->bool{return atomicLoad(&ensemble[16u+(body/INSTANCE_BODIES)*8u+1u])!=0u;}
fn colliderScheduled(collider:u32)->bool{return atomicLoad(&ensemble[16u+(collider/INSTANCE_COLLIDERS)*8u+1u])!=0u;}
fn scheduledBodyCount()->u32{return atomicLoad(&ensemble[0])*INSTANCE_BODIES;}
fn scheduledColliderCount()->u32{return atomicLoad(&ensemble[0])*INSTANCE_COLLIDERS;}
fn scheduledBody(index:u32)->u32{return atomicLoad(&ensemble[INSTANCE_QUEUE+index/INSTANCE_BODIES])*INSTANCE_BODIES+index%INSTANCE_BODIES;}
fn scheduledCollider(index:u32)->u32{return atomicLoad(&ensemble[INSTANCE_QUEUE+index/INSTANCE_COLLIDERS])*INSTANCE_COLLIDERS+index%INSTANCE_COLLIDERS;}
@compute @workgroup_size(64) fn ensembleClear(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}
 atomicStore(&ensemble[16u+instance*8u+1u],0u);
 atomicStore(&ensemble[16u+instance*8u+4u],0u);
 if(instance==0u){atomicStore(&ensemble[0],0u);${r?`atomicStore(&meshTasks.count,0u);atomicStore(&meshTasks.overflow,0u);atomicStore(&meshTasks.unresolved,0u);atomicStore(&meshTasks.incomplete,0u);atomicStore(&targets.dispatch,0u);targets.vertical=1u;targets.depth=1u;`:``}}
}
@compute @workgroup_size(64) fn ensembleMark(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}let offset=16u+instance*8u;
 // Controls must remain pending across disabled steps after the shared wake flag is consumed.
 if(atomicLoad(&ensemble[1])!=0u){atomicStore(&ensemble[offset+6u],1u);}
 if(atomicLoad(&ensemble[offset])==0u){return;}
 if(atomicLoad(&ensemble[offset+5u])!=0u||atomicLoad(&ensemble[offset+6u])!=0u||atomicLoad(&ensemble[1])!=0u){
  atomicStore(&ensemble[offset+1u],1u);atomicStore(&ensemble[offset+6u],0u);
 }
}
@compute @workgroup_size(64) fn ensembleCompact(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}
 if(atomicLoad(&ensemble[16u+instance*8u+1u])!=0u){let slot=atomicAdd(&ensemble[0],1u);atomicStore(&ensemble[INSTANCE_QUEUE+slot],instance);}
}
@compute @workgroup_size(1) fn ensembleDispatch(){
 atomicStore(&ensemble[1],0u);
 atomicStore(&ensemble[4],(scheduledBodyCount()+63u)/64u);atomicStore(&ensemble[5],1u);atomicStore(&ensemble[6],1u);
 atomicStore(&ensemble[8],(scheduledColliderCount()+63u)/64u);atomicStore(&ensemble[9],1u);atomicStore(&ensemble[10],1u);
}
`}function Jc(e){return e.replace(/@compute @workgroup_size\(64\) fn ensembleClear[\s\S]*?atomicStore\(&ensemble\[10\],1u\);\n}/,``).replace(`var<storage,read_write> ensemble:array<atomic<u32>>`,`var<storage,read> ensemble:array<u32>`).replace(/atomicLoad\(&ensemble\[([^\]]+)\]\)/g,`ensemble[$1]`)}function Yc(e,t,n,r,i,a,o,s){let c={id:`${t}-ensemble-status`,source:`
@group(0) @binding(0) var<storage,read_write> ensemble:array<u32>;
@group(0) @binding(1) var<storage,read> statistics:array<u32>;
struct Body {inertia:vec4f,inertiaOrientation:vec4f,motion:vec4f}
@group(0) @binding(2) var<storage,read> bodies:array<Body>;
@group(0) @binding(3) var<storage,read> sleepStates:array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=${n}u){return;}
 let offset=16u+instance*8u;let failed=statistics[1]!=0u||statistics[15]!=0u;
 ensemble[offset+4u]=select(0u,1u,failed);
 if(ensemble[offset+1u]==0u){return;}
 var awake=failed;
 for(var local=0u;local<${r}u;local++){
  let body=instance*${r}u+local;let motion=bodies[body].motion.x;
  awake=awake||motion==2.0||(motion==1.0&&sleepStates[body].y<0.5);
 }
 ensemble[offset+5u]=select(0u,1u,awake);
 let counter=offset+select(2u,3u,failed);
 if(ensemble[counter]!=0xffffffffu){ensemble[counter]++;}
}`,shaderLayout:{bindings:[{name:`ensemble`,group:0,location:0,type:`storage`},{name:`statistics`,group:0,location:1,type:`read-only-storage`},{name:`bodies`,group:0,location:2,type:`read-only-storage`},{name:`sleepStates`,group:0,location:3,type:`read-only-storage`}]},bindings:{ensemble:o.buffer,statistics:s.buffer,bodies:i.buffer,sleepStates:a.buffer}},l=e=>({encode:({computePass:t})=>e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(n/64)}),destroy:()=>e.kernel.destroy()});e.addComputePass({id:c.id,workload:{commandCount:1},description:`Record per-instance participation and shared rollback status.`,resources:[{buffer:o.resource,usage:`storage-read-write`},{buffer:s.resource,usage:`storage-read`},{buffer:i.resource,usage:`storage-read`},{buffer:a.resource,usage:`storage-read`}],compile:({device:e})=>l(V(e,c)),compileAsync:async({device:e})=>l(await H(e,c))})}function Xc(e,t,n,r,i,a,s){let c=e=>n.find(n=>n.id===`${t}-${e}`),l=[...[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`].map(e=>({name:e,offset:0,size:i*16})),{name:`targets`,offset:0,size:i*32},{name:`bodies`,offset:0,size:i*48},{name:`bodies`,offset:r*48,size:a*96},{name:`object-attributes`,offset:0,size:a*4},{name:`pose-metadata`,offset:0,size:i*48}].filter(e=>c(e.name)),u=[],d=e.createBuffer({byteLength:32,usage:o.UNIFORM|o.COPY_DST}),f;try{let t=e.createCommandEncoder();for(let n of l){let r=e.createBuffer({byteLength:n.size,usage:o.COPY_SRC|o.COPY_DST});u.push(r),t.copyBufferToBuffer({sourceBuffer:c(n.name),sourceOffset:n.offset,destinationBuffer:r,size:n.size})}e.submit(t.finish());let n=c(`contact-history`);f=V(e,{source:`
@group(0) @binding(0) var<uniform> settings:Settings;
struct Settings {selection:vec4u, shift:vec4f}
@group(0) @binding(6) var<storage,read_write> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read_write> metadata:array<u32>;
@group(0) @binding(2) var<storage,read_write> attributes:array<u32>;
@group(0) @binding(3) var<storage,read_write> manifolds:array<u32>;
@group(0) @binding(4) var<storage,read_write> targets:array<u32>;
${n?`@group(0) @binding(5) var<storage,read_write> history:array<u32>;`:``}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;let selection=settings.selection;
 if(index==0u){targets[${r*8+8+s*2}u+selection.x/${i}u]=0u;}
 if(index<${i}u){
  let body=selection.x+index;positions[body]=vec4f(positions[body].xyz-settings.shift.xyz,positions[body].w);
  for(var axis=0u;axis<3u;axis++){let address=body*8u+axis;targets[address]=bitcast<u32>(bitcast<f32>(targets[address])-settings.shift[axis]);}
 }
 if(index<${a}u){
  let collider=selection.y+index;let address=${r*12}u+collider*24u+7u;
  metadata[address]=bitcast<u32>(bitcast<f32>(metadata[address])+f32(selection.x));
  attributes[collider]=(attributes[collider]&0xffff0000u)|((attributes[collider]&0xffffu)+selection.x);
 }
 if(index>=${s}u){return;}
 let key=targets[${r*8+8}u+index*2u];
 if(key==0u||key==0xffffffffu){return;}
 let address=index*104u;let collider=manifolds[address+97u];
 if(collider<selection.y||collider>=selection.y+${a}u){return;}
 for(var word=0u;word<104u;word++){manifolds[address+word]=0u;}
 targets[${r*8+8}u+index*2u]=0xffffffffu;
 targets[${r*8+9}u+index*2u]=0u;
 ${n?`for(var word=0u;word<4u;word++){history[index*4u+word]=0u;}`:``}
}`,shaderLayout:{bindings:[{name:`settings`,group:0,location:0,type:`uniform`},{name:`positions`,group:0,location:6,type:`storage`},...[`metadata`,`attributes`,`manifolds`,`targets`,...n?[`history`]:[]].map((e,t)=>({name:e,group:0,location:t+1,type:`storage`}))]},bindings:{settings:d,positions:c(`positions`),metadata:c(`bodies`),attributes:c(`object-attributes`),manifolds:c(`manifolds`),targets:c(`targets`),...n?{history:n}:{}}})}catch(e){for(let e of u)e.destroy();throw d.destroy(),f?.kernel.destroy(),e}return{byteLength:u.reduce((e,t)=>e+t.byteLength,d.byteLength),reset(t,n){let r=new ArrayBuffer(32);new Uint32Array(r).set([t*i,t*a]),new Float32Array(r).set(n,4),d.write(new Uint8Array(r));let o=e.createCommandEncoder();for(let[e,n]of l.entries())o.copyBufferToBuffer({sourceBuffer:u[e],destinationBuffer:c(n.name),destinationOffset:n.offset+t*n.size,size:n.size});let p=o.beginComputePass();f.kernel.dispatch(p,{bindings:f.bindings,x:Math.ceil(Math.max(s,a,i)/64)}),p.end(),e.submit(o.finish())},destroy(){f.kernel.destroy(),d.destroy();for(let e of u)e.destroy()}}}function Zc(e){let t=e.indices.length/3,n=Array.from({length:t},(e,t)=>t),r=e=>{for(;n[e]!==e;)n[e]=n[n[e]],e=n[e];return e},i=t=>e.positions.slice(t*3,t*3+3),a=Array(t).fill(0),o=new Map,s=Wc(Array.from({length:e.positions.length/3},(e,t)=>i(t)));for(let n=0;n<t;n++){let t=e.indices.slice(n*3,n*3+3);for(let e=0;e<3;e++){let r=i(t[e]).join(`,`),a=i(t[(e+1)%3]).join(`,`),s=r<a?`${r}/${a}`:`${a}/${r}`,c=o.get(s)??[];c.push({triangle:n,side:e,opposite:t[(e+2)%3]}),o.set(s,c)}}for(let t of o.values()){if(t.length!==2)continue;let[o,c]=t,l=e.indices.slice(o.triangle*3,o.triangle*3+3);if(s(l[0],l[1],l[2],c.opposite)!==0)continue;let u=e.indices.slice(o.triangle*3,o.triangle*3+3),d=i(u[o.side]),f=i(u[(o.side+1)%3]).map((e,t)=>e-d[t]),p=e=>{let t=i(e).map((e,t)=>e-d[t]);return[f[1]*t[2]-f[2]*t[1],f[2]*t[0]-f[0]*t[2],f[0]*t[1]-f[1]*t[0]]},m=p(o.opposite),h=p(c.opposite);if(m.reduce((e,t,n)=>e+t*h[n],0)>=0)continue;a[o.triangle]|=1<<o.side,a[c.triangle]|=1<<c.side;let g=r(o.triangle),_=r(c.triangle);n[Math.max(g,_)]=Math.min(g,_)}return{features:n.map((e,t)=>r(t)+1),internalEdges:a}}function Qc(e){let t=[],n=new Map;return{shapes:e.map(({shape:e})=>{let r=[0,0],i=[0,0,0,0],a;if(e.type===`sphere`)a=[e.radius,0,0,0];else if(e.type===`plane`)a=[(e.sizeX??0)/2,(e.sizeZ??0)/2,e.doubleSided?1:0,6];else if(e.type===`box`)a=[...e.halfExtents,1];else if(e.type===`capsule`||e.type===`cylinder`)a=[e.radiusBottom,e.radiusTop,e.height,e.type===`capsule`?4:5];else{let o=e.geometry,s=n.get(o);if(s)i.splice(0,i.length,...s.padding),r.splice(0,r.length,...s.policies);else{i[0]=t.length/4,i[1]=o.positions.length/3;for(let e=0;e<o.positions.length;e+=3)t.push(o.positions[e],o.positions[e+1],o.positions[e+2],0);i[2]=t.length/4,i[3]=o.indices.length/3;let{features:e,internalEdges:a}=Zc(o);for(let n=0;n<o.indices.length;n+=3)t.push(o.indices[n],o.indices[n+1],o.indices[n+2],e[n/3]*8+a[n/3]);r[0]=t.length/4,r[1]=o.nodes.length/12;for(let e of o.nodes)t.push(e);n.set(o,{padding:[...i],policies:[...r]})}a=[...o.minimum.map((e,t)=>Math.max(Math.abs(e),Math.abs(o.maximum[t]))),e.type===`convex-hull`?2:3]}return{dimensions:a,policies:r,padding:i}}),geometry:t,filters:e.map(e=>{let n=[...new Set(e.excludedColliders??[])].sort((e,t)=>e-t),r=t.length;for(let e of n)t.push(e);for(;t.length%4;)t.push(0);return[r,n.length]})}}function $c(e,t){let n=new gc().fromQuaternion(e).transformAsVector(t);return[n[0],n[1],n[2]]}function U(e=[0,0,0,1]){let t=Math.hypot(...e);if(!e.every(Number.isFinite)||t===0)throw Error(`Invalid body rotation`);return[e[0]/t,e[1]/t,e[2]/t,e[3]/t]}function el(e,t,n){let r=t.map(({shape:e})=>Gc(e)),i=r.map((e,n)=>t[n].isTrigger?0:e.volume),a=i.reduce((e,t)=>e+t,0),o=Array(9).fill(0);for(let[s,c]of t.entries()){let t=a>0?e*i[s]/a:0,l=i[s]>0?t/i[s]:0,u=new gc().fromQuaternion(U(c.orientation)),d=$c(U(c.orientation),r[s].center),f=(c.position??[0,0,0]).map((e,t)=>e+d[t]-n[t]);for(let e=0;e<3;e++)for(let n=0;n<3;n++){for(let t=0;t<3;t++)for(let i=0;i<3;i++)o[e*3+n]+=u[t*4+e]*r[s].tensor[t*3+i]*l*u[i*4+n];o[e*3+n]+=t*((e===n?f.reduce((e,t)=>e+t**2,0):0)-f[e]*f[n])}}let s=[1,0,0,0,1,0,0,0,1];for(let e=0;e<24;e++){let e=0,t=1;for(let[n,r]of[[0,2],[1,2]])Math.abs(o[n*3+r])>Math.abs(o[e*3+t])&&(e=n,t=r);if(Math.abs(o[e*3+t])<=1e-12*Math.max(...o.map(Math.abs)))break;let n=.5*Math.atan2(2*o[e*3+t],o[t*3+t]-o[e*3+e]),r=Math.cos(n),i=Math.sin(n);for(let n=0;n<3;n++){let a=o[n*3+e],c=o[n*3+t];o[n*3+e]=r*a-i*c,o[n*3+t]=i*a+r*c;let l=s[e*3+n],u=s[t*3+n];s[e*3+n]=r*l-i*u,s[t*3+n]=i*l+r*u}for(let n=0;n<3;n++){let a=o[e*3+n],s=o[t*3+n];o[e*3+n]=r*a-i*s,o[t*3+n]=i*a+r*s}}let c=new Hc().fromMatrix3(s).normalize();return{diagonal:[o[0],o[4],o[8]],orientation:[c[0],c[1],c[2],c[3]]}}function tl(e){return{pairCount:e[0],droppedPairs:e[1],invalidBounds:e[2],candidateTests:e[3],occupiedLevelMask:e[4],oversizedBounds:e[5],incompleteQueries:e[6]}}var nl=class{id;props;constructor(e){if(this.id=e.id??`rigid-body-broad-phase`,this.props=e,ro(e.minima,[`float32x3`],`broad-phase minima`),ro(e.maxima,[`float32x3`],`broad-phase maxima`),ro(e.pairs,[`uint32x2`],`broad-phase pairs`),ro(e.diagnostics,[`uint32`],`broad-phase diagnostics`),e.objectMetadata&&ro(e.objectMetadata,[`uint32`],`broad-phase object metadata`),e.activeInstances&&(ro(e.activeInstances,[`uint32`],`active instances`),!e.partitionSize||e.activeInstances.length!==16+9*e.minima.length/e.partitionSize))throw Error(`Invalid active instance queue`);let t=e.minima.length;if(e.bucketState&&(ro(e.bucketState,[`uint32`],`persistent buckets`),!e.activeInstances||e.bucketState.buffer.transient||e.bucketState.length!==2**Math.ceil(Math.log2(Math.max(1,t*2)))+t+2))throw Error(`Invalid persistent bucket storage`);let n=e.maximumCandidateTestsPerQuery??4096,r=e.minimumCellSize??1/1024;if(e.partitionSize!==void 0&&(!Number.isSafeInteger(e.partitionSize)||e.partitionSize<1||t%e.partitionSize!==0)||t!==e.maxima.length||e.objectMetadata&&e.objectMetadata.length!==t||t>65535||e.diagnostics.length<8||!Number.isFinite(r)||r<=0||!Number.isSafeInteger(n)||n<1||n>65535)throw Error(`Invalid rigid-body broad-phase layout`);let i=[e.pairs,e.diagnostics,...e.bucketState?[e.bucketState]:[]];for(let t of i)for(let n of[e.minima,e.maxima,...e.objectMetadata?[e.objectMetadata]:[],...e.activeInstances?[e.activeInstances]:[],...i.filter(e=>e!==t)])if(t.buffer===n.buffer){let e=ao(t),r=ao(n);if(oo(t,n)||e.offset<r.offset+r.size&&r.offset<e.offset+e.size)throw Error(`Broad-phase storage bindings overlap`)}}getCommandNodes(e){let{minima:t,maxima:n,pairs:r,diagnostics:i}=this.props,a=t.length,o=R(e,`${this.id}-keys`,`uint32`,a),s=R(e,`${this.id}-values`,`uint32`,a),c=R(e,`${this.id}-sorted-keys`,`uint32`,a),l=R(e,`${this.id}-sorted-values`,`uint32`,a),u=R(e,`${this.id}-levels`,`uint32`,a*(this.props.activeInstances?2:1)),d={minima:t,maxima:n,keys:o,values:s,sortedKeys:c,sortedValues:l,levels:u,oversized:this.props.activeInstances?e.createDataView(u.buffer,{format:`uint32`,length:a,byteOffset:a*4}):R(e,`${this.id}-oversized`,`uint32`,a),pairs:r,diagnostics:i,objectMetadata:this.props.objectMetadata??s,...this.props.activeInstances?{activeInstances:this.props.activeInstances,heads:this.props.bucketState??R(e,`${this.id}-heads`,`uint32`,2**Math.ceil(Math.log2(Math.max(1,a*2)))+a+2)}:{}},f=Object.keys(d),p=rl(this.props,d),m={clear:`Reset broad-phase diagnostics and candidate counts.`,assign:`Assign collider bounds to hierarchical spatial grid cells.`,discover:`Discover potentially overlapping collider pairs from the sorted grid.`},h=(t,n,r,i)=>{n=n.filter(e=>!this.props.activeInstances||![`keys`,`oversized`].includes(e));let a=n.map(e=>({name:e,group:0,location:f.indexOf(e),type:[`keys`,`values`,`levels`,`oversized`,`pairs`,`diagnostics`,`heads`].includes(e)?`storage`:`read-only-storage`})),o=()=>{let r=new so(e.device,{id:`${this.id}-${t}`,source:p,entryPoint:t,shaderLayout:{bindings:a}});return{encode:({computePass:e,getBuffer:a})=>{let o={};for(let e of n)o[e]=I(d[e],a);this.props.activeInstances&&[`assign`,`discover`].includes(t)?r.dispatchIndirect(e,{bindings:o,indirectBuffer:a(this.props.activeInstances.buffer),indirectOffset:ao(this.props.activeInstances).offset+32}):r.dispatch(e,{bindings:o,x:i,y:1,z:1})},destroy:()=>r.destroy()}};return ya({id:`${this.id}-${t}`,description:m[t],workload:{commandCount:1},resources:[...this.props.activeInstances&&[`assign`,`discover`].includes(t)?[{buffer:this.props.activeInstances,usage:`indirect`}]:[],...n.map(e=>({buffer:d[e],usage:r.includes(e)?`storage-read-write`:`storage-read`}))],compile:o})};return[h(`clear`,[`diagnostics`],[`diagnostics`],1),...this.props.activeInstances?[h(`clearBuckets`,[`heads`],[`heads`],1)]:[],h(`assign`,[`minima`,`maxima`,`keys`,`values`,`levels`,`oversized`,`diagnostics`,...this.props.objectMetadata?[`objectMetadata`]:[],...this.props.activeInstances?[`heads`,`activeInstances`]:[]],[`keys`,`values`,`levels`,`oversized`,`diagnostics`,...this.props.activeInstances?[`heads`]:[]],Math.max(1,Math.ceil(a/64))),...this.props.activeInstances?[]:new Qo({id:`${this.id}-sort`,keys:o,values:s,outputKeys:c,outputValues:l}).getCommandNodes(e),h(`discover`,[`minima`,`maxima`,...this.props.activeInstances?[]:[`sortedKeys`,`sortedValues`],`levels`,`oversized`,`pairs`,`diagnostics`,...this.props.activeInstances?[`heads`,`keys`,`values`,`activeInstances`]:[]],[`pairs`,`diagnostics`],Math.max(1,Math.ceil(a/64)))]}};function rl(e,t){let n=Object.keys(t),r=Object.fromEntries(n.map(e=>[e,L(t[e])])),i=new Set([`keys`,`values`,`levels`,`oversized`,`pairs`,`diagnostics`,`heads`]),a=`
${n.map((e,t)=>`@group(0) @binding(${t}) var<storage, ${i.has(e)?`read_write`:`read`}> ${e}:array<${e===`minima`||e===`maxima`?`f32`:[`diagnostics`,`heads`].includes(e)?`atomic<u32>`:`u32`}>;`).join(`
`)}
const BODY_COUNT:u32=${e.minima.length}u;
const PAIR_CAPACITY:u32=${e.pairs.length}u;
const BASE_CELL:f32=${e.minimumCellSize??1/1024};
const MAXIMUM_CANDIDATES:u32=${e.maximumCandidateTestsPerQuery??4096}u;
fn minimum(index:u32)->vec3f{let offset=${r.minima}u+index*3u;return vec3f(minima[offset],minima[offset+1u],minima[offset+2u]);}
fn maximum(index:u32)->vec3f{let offset=${r.maxima}u+index*3u;return vec3f(maxima[offset],maxima[offset+1u],maxima[offset+2u]);}
fn valid(index:u32)->bool{let lower=minimum(index);let upper=maximum(index);return all(lower<=upper)&&all(abs(lower)<=vec3f(3.4028234663852886e38))&&all(abs(upper)<=vec3f(3.4028234663852886e38));}
fn center(index:u32)->vec3f{return minimum(index)*0.5+maximum(index)*0.5;}
fn cell(index:u32,level:u32)->vec3i{return vec3i(floor(center(index)/(BASE_CELL*exp2(f32(level)))));}
fn domain(index:u32)->u32{return ${e.partitionSize?`index/${e.partitionSize}u`:`0u`};}
fn hash(coordinate:vec3i,level:u32,domainIndex:u32)->u32{
 let words=bitcast<vec3u>(coordinate);var result=(words.x*73856093u)^(words.y*19349663u)^(words.z*83492791u)^(level*2654435761u)^(domainIndex*1597334677u);
 result=(result^(result>>16u))*2246822519u;return result^(result>>13u);
}
@compute @workgroup_size(8) fn clear(@builtin(local_invocation_index) index:u32){atomicStore(&diagnostics[${r.diagnostics}u+index],0u);}
@compute @workgroup_size(64) fn assign(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=BODY_COUNT){return;}
 values[${r.values}u+index]=index;
 if(!valid(index)){keys[${r.keys}u+index]=0xffffffffu;levels[${r.levels}u+index]=33u;atomicAdd(&diagnostics[${r.diagnostics}u+2u],1u);return;}
 let extent=maximum(index)-minimum(index);let size=max(extent.x,max(extent.y,extent.z));
 let required=ceil(log2(max(size*2.0/BASE_CELL,1.0)));
 var level=u32(clamp(required,0.0,32.0));
 // Very remote tiny objects cannot be represented by signed integer cell coordinates.
 if(level<32u&&any(abs(center(index)/(BASE_CELL*exp2(f32(level))))>vec3f(1048576.0))){level=32u;}
 levels[${r.levels}u+index]=level|(${e.objectMetadata?`(objectMetadata[${r.objectMetadata}u+index]&0x1ffffu)`:`(index|(1u<<16u))`}<<6u);
 if(level>=32u){let slot=atomicAdd(&diagnostics[${r.diagnostics}u+5u],1u);oversized[${r.oversized}u+slot]=index;keys[${r.keys}u+index]=0xffffffffu;return;}
 atomicOr(&diagnostics[${r.diagnostics}u+4u],1u<<level);keys[${r.keys}u+index]=hash(cell(index,level),level,domain(index));
}
fn lowerBound(key:u32)->u32{var lower=0u;var upper=BODY_COUNT;loop{if(lower>=upper){break;}let middle=(lower+upper)/2u;if(sortedKeys[${r.sortedKeys}u+middle]<key){lower=middle+1u;}else{upper=middle;}}return lower;}
fn emit(first:u32,second:u32){
 if(domain(first)!=domain(second)){return;}
 let firstMetadata=levels[${r.levels}u+first]>>6u;let secondMetadata=levels[${r.levels}u+second]>>6u;
 if((firstMetadata&0xffffu)==(secondMetadata&0xffffu)||((firstMetadata|secondMetadata)&0x10000u)==0u){return;}
 if(any(maximum(first)<minimum(second))||any(maximum(second)<minimum(first))){return;}
 let slot=atomicAdd(&diagnostics[${r.diagnostics}u],1u);
 if(slot>=PAIR_CAPACITY){atomicAdd(&diagnostics[${r.diagnostics}u+1u],1u);return;}
 pairs[${r.pairs}u+slot*2u]=min(first,second);pairs[${r.pairs}u+slot*2u+1u]=max(first,second);
}
@compute @workgroup_size(64) fn discover(@builtin(global_invocation_id) invocation:vec3u){
 let first=invocation.x;if(first>=BODY_COUNT){return;}let ownLevel=levels[${r.levels}u+first]&63u;if(ownLevel==33u){return;}
 var tested=0u;var occupied=0u;if(ownLevel<32u){occupied=atomicLoad(&diagnostics[${r.diagnostics}u+4u])&(0xffffffffu<<ownLevel);}
 loop{if(occupied==0u){break;}let level=firstTrailingBit(occupied);occupied&=~(1u<<level);let origin=cell(first,level);
  for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
   let coordinate=origin+vec3i(x,y,z);let key=hash(coordinate,level,domain(first));var cursor=lowerBound(key);
   loop{if(cursor>=BODY_COUNT||sortedKeys[${r.sortedKeys}u+cursor]!=key){break;}let second=sortedValues[${r.sortedValues}u+cursor];cursor++;
    if(tested>=MAXIMUM_CANDIDATES){atomicAdd(&diagnostics[${r.diagnostics}u+6u],1u);return;}tested++;atomicAdd(&diagnostics[${r.diagnostics}u+3u],1u);
    if((levels[${r.levels}u+second]&63u)!=level||(level==ownLevel&&second<=first)){continue;}
    if(domain(first)!=domain(second)||any(cell(second,level)!=coordinate)){continue;}
    emit(first,second);
   }
  }}}
 }
 let oversizedCount=atomicLoad(&diagnostics[${r.diagnostics}u+5u]);
 for(var index=0u;index<oversizedCount;index++){let second=oversized[${r.oversized}u+index];if(domain(first)!=domain(second)||second==first||(ownLevel==32u&&second<first)){continue;}
  if(tested>=MAXIMUM_CANDIDATES){atomicAdd(&diagnostics[${r.diagnostics}u+6u],1u);return;}tested++;atomicAdd(&diagnostics[${r.diagnostics}u+3u],1u);emit(first,second);
 }
}
`;if(e.activeInstances){let t=e.minima.length/e.partitionSize,n=r.activeInstances+16+t*8,i=2**Math.ceil(Math.log2(Math.max(1,e.minima.length*2))),o=i-1;a+=`
fn activeCount()->u32{return activeInstances[${r.activeInstances}u]*${e.partitionSize}u;}
fn activeObject(index:u32)->u32{return activeInstances[${n}u+index/${e.partitionSize}u]*${e.partitionSize}u+index%${e.partitionSize}u;}
@compute @workgroup_size(64) fn clearBuckets(@builtin(global_invocation_id) invocation:vec3u){
 // First use initializes the table; subsequent steps clear only buckets touched last step.
 let initialized=${e.bucketState?`atomicLoad(&heads[${r.heads}u+${i+1}u])`:`0u`};
 let count=select(${i}u,atomicLoad(&heads[${r.heads}u+${i}u]),initialized!=0u);
 for(var index=invocation.x;index<count;index+=64u){
  var bucket=index;if(initialized!=0u){bucket=atomicLoad(&heads[${r.heads}u+${i+2}u+index]);}
  atomicStore(&heads[${r.heads}u+bucket],0xffffffffu);
 }
 storageBarrier();
 if(invocation.x==0u){atomicStore(&heads[${r.heads}u+${i}u],0u);atomicStore(&heads[${r.heads}u+${i+1}u],1u);}
}
`,a=a.replace(`var tested=0u;`,`var tested=0u;var bucketVisits=0u;`).replace(`let index=invocation.x;if(index>=BODY_COUNT){return;}`,`let work=invocation.x;if(work>=activeCount()){return;}let index=activeObject(work);`).replace(`let first=invocation.x;if(first>=BODY_COUNT){return;}`,`let work=invocation.x;if(work>=activeCount()){return;}let first=activeObject(work);`).replace(`keys[`+r.keys+`u+index]=hash(cell(index,level),level,domain(index));`,`let key=hash(cell(index,level),level,domain(index));let bucket=key&${o}u;let previous=atomicExchange(&heads[${r.heads}u+bucket],index);values[${r.values}u+index]=previous;
 if(previous==0xffffffffu){let touched=atomicAdd(&heads[${r.heads}u+${i}u],1u);atomicStore(&heads[${r.heads}u+${i+2}u+touched],bucket);}`).replace(`var cursor=lowerBound(key);`,`var cursor=atomicLoad(&heads[${r.heads}u+(key&${o}u)]);`).replace(`if(cursor>=BODY_COUNT||sortedKeys[${r.sortedKeys}u+cursor]!=key){break;}let second=sortedValues[${r.sortedValues}u+cursor];cursor++;`,`if(cursor>=BODY_COUNT){break;}if(bucketVisits>=${Math.min(4294967295,(e.maximumCandidateTestsPerQuery??4096)*32)}u){atomicAdd(&diagnostics[${r.diagnostics}u+6u],1u);return;}bucketVisits++;let second=cursor;cursor=values[${r.values}u+second];if(domain(first)!=domain(second)||(levels[${r.levels}u+second]&63u)!=level||any(cell(second,level)!=coordinate)){continue;}`),a=a.replace(/keys\[[^\]]+\]=0xffffffffu;/g,``).replace(/oversized\[/g,`levels[`)}return a}function il(e){return{steps:e[0],incompleteSteps:e[1],droppedPairs:e[2],droppedManifolds:e[3],incompleteQueries:e[4],invalidBounds:e[5],droppedTriangleQueries:e[6],unresolvedQueries:e[7],incompleteIslandUnions:e[8],incompleteMeshQueries:e[11],incompleteContinuousBodies:e[12],incompleteTriggerQueries:e[13],invalidBodyStates:e[14],maximumCandidatePairs:e[9],maximumCandidateTests:e[10],saturated:e[15]!==0,complete:e[1]===0&&e[15]===0}}function al(e,t,n,r){let i=[...r.broadPhase?[{name:`discovery`,...r.broadPhase}]:[],...r.targets?[{name:`cache`,...r.targets}]:[],...r.meshTasks?[{name:`mesh`,...r.meshTasks}]:[],...r.parallelState?[{name:`islands`,...r.parallelState}]:[],...r.continuous?[{name:`continuous`,...r.continuous}]:[],...r.triggers?[{name:`triggers`,...r.triggers}]:[],...r.validity?[{name:`validity`,...r.validity}]:[]],a=[{name:`statistics`,buffer:n,resource:r.statisticsResource??e.importBuffer({id:t,byteLength:n.byteLength,usage:o.STORAGE},n)},...i],s={id:t,source:`
${a.map(({name:e},t)=>`@group(0) @binding(${t}) var<storage,${t===0?`read_write`:`read`}> ${e}:array<u32>;`).join(`
`)}
fn accumulate(index:u32,value:u32){
 let previous=statistics[index];
 if(value>0xffffffffu-previous){statistics[index]=0xffffffffu;statistics[15]=1u;}
 else {statistics[index]=previous+value;}
}
@compute @workgroup_size(1) fn record(){
 var failures:array<u32,7>;
 ${r.broadPhase?`failures[0]=discovery[${r.broadPhase.wordOffset+1}u];failures[2]=discovery[${r.broadPhase.wordOffset+6}u];failures[3]=discovery[${r.broadPhase.wordOffset+2}u];statistics[9]=max(statistics[9],discovery[${r.broadPhase.wordOffset}u]);statistics[10]=max(statistics[10],discovery[${r.broadPhase.wordOffset+3}u]);`:``}
 ${r.targets?`failures[1]=cache[${r.targets.wordOffset}u];`:``}
 ${r.meshTasks?`failures[4]=mesh[1];failures[5]=mesh[2];`:``}
 ${r.parallelState?`failures[6]=islands[0];`:``}
 var incomplete=false;
 for(var index=0u;index<7u;index++){accumulate(index+2u,failures[index]);incomplete=incomplete||failures[index]>0u;}
 ${r.meshTasks?`accumulate(11u,mesh[3]);incomplete=incomplete||mesh[3]>0u;`:``}
 ${r.continuous?`for(var body=0u;body<${r.continuous.count}u;body++){let failure=continuous[body*4u];accumulate(12u,failure);incomplete=incomplete||failure!=0u;}`:``}
 ${r.triggers?`for(var group=0u;group<${r.triggers.count}u;group++){let failure=select(0u,1u,(triggers[group*4u]&4u)!=0u);accumulate(13u,failure);incomplete=incomplete||failure!=0u;}`:``}
 ${r.validity?`for(var body=0u;body<${r.validity.count}u;body++){accumulate(14u,validity[body]);incomplete=incomplete||validity[body]!=0u;}`:``}
 accumulate(0u,1u);if(incomplete){accumulate(1u,1u);}
}`,entryPoint:`record`,shaderLayout:{bindings:a.map(({name:e},t)=>({name:e,location:t,group:0,type:t===0?`storage`:`read-only-storage`}))},bindings:Object.fromEntries(a.map(({name:e,buffer:t})=>[e,t]))},c=e=>({encode:({computePass:t})=>e.kernel.dispatch(t,{bindings:e.bindings,x:1}),destroy:()=>e.kernel.destroy()});e.addComputePass({id:t,workload:{commandCount:1},description:`Summarize contacts, solver limits, and simulation failures for diagnostics.`,resources:a.map(({resource:e},t)=>({buffer:e,usage:t===0?`storage-read-write`:`storage-read`})),compile:({device:e})=>c(V(e,s)),compileAsync:async({device:e})=>c(await H(e,s))})}function ol(e,t,n){let r=e*8+8,i=r+n*2,a=i+t,o=a+t,s=o+n,c=s+n,l=Math.ceil((c+n)/2)*2,u=l+n*2,d=u+n,f=d+t,p=f+t,m=Math.ceil((p+8)/4)*4;return{keyOffset:r,headOffset:i,frameOffset:a,linkOffset:o,markOffset:s,journalOffset:c,savedKeyOffset:l,savedLinkOffset:u,savedHeadOffset:d,savedFrameOffset:f,savedHeaderOffset:p,savedManifoldOffset:m,byteLength:(m+n*104)*4}}function sl(e){if(!e.axes.length||e.axes.length>3||new Set(e.axes).size!==e.axes.length||e.axes.some(e=>!Number.isInteger(e)||e<0||e>2)||e.drive&&e.axes.length!==1)throw Error(`Invalid constraint axes`);for(let t of[e.minimum,e.maximum,e.drive?.positionTarget,e.drive?.velocityTarget])if(t!==void 0&&!Number.isFinite(Math.fround(t)))throw Error(`Invalid constraint coordinate`);for(let t of[e.stiffness,e.damping,e.drive?.stiffness,e.drive?.damping,e.drive?.maximumForce])if(t!==void 0&&(!Number.isFinite(Math.fround(t))||t<0))throw Error(`Invalid constraint response`);if((e.minimum??-1/0)>(e.maximum??1/0)||e.drive?.mode!==void 0&&![`force`,`acceleration`].includes(e.drive.mode))throw Error(`Invalid constraint bounds`)}function cl(){return`
fn generalJointDriven(index:u32)->bool{return targets.joints[index].general.control.y>0.0;}
fn generalConstraintRow(index:u32,row:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,coordinate:f32,warm:bool,locked:bool){
 let joint=JOINTS[index];let constraint=targets.joints[index].general;let angular=constraint.axes.w>0.0;
 let first=joint.identifiers.x;let second=joint.identifiers.y;
 // Changing radial/conical directions invalidate scalar warm starts. Rebuild these small rows each step.
 if(warm){targets.joints[index].impulses[row]=0.0;return;}
 let inverseMass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(inverseMass<=1e-20){return;}
 let speed=jointVelocity(first,second,firstPoint,secondPoint,axis,angular);
 let previous=targets.joints[index].impulses[row];let timeStep=settings.gravity.w;
 var accumulated=0.0;
 if(constraint.control.y>0.0){
  let effectiveScale=select(1.0,1.0/inverseMass,constraint.control.z>0.0);
  let stiffness=constraint.drive.z*effectiveScale;let damping=constraint.drive.w*effectiveScale;
  // Implicit spring/damper evaluated against the velocity before this row's accumulated impulse.
  let force=stiffness*(constraint.drive.x-coordinate-timeStep*speed)+damping*(constraint.drive.y-speed);
  let increment=(timeStep*force-previous)/(1.0+timeStep*(damping+timeStep*stiffness)*inverseMass);
  let cap=constraint.control.w*timeStep;
  accumulated=clamp(previous+increment,-cap,cap);
 }else{
  let minimum=select(constraint.limits.x,0.0,locked);let maximum=select(constraint.limits.y,0.0,locked);
  if(constraint.control.x>0.0){
   let error=coordinate-clamp(coordinate,minimum,maximum);
   if(error!=0.0){
    let stiffness=constraint.limits.z;let damping=constraint.limits.w;
    let force= -stiffness*(error+timeStep*speed)-damping*speed;
    accumulated=previous+(timeStep*force-previous)/(1.0+timeStep*(damping+timeStep*stiffness)*inverseMass);
    accumulated=select(min(0.0,accumulated),max(0.0,accumulated),error<0.0);
   }
  }else{
   var minimumSpeed=(minimum-coordinate)/timeStep;var maximumSpeed=(maximum-coordinate)/timeStep;
   if(coordinate<minimum){minimumSpeed=min(settings.stability.z,settings.stability.y*(minimum-coordinate)/timeStep);}
   if(coordinate>maximum){maximumSpeed=max(-settings.stability.z,settings.stability.y*(maximum-coordinate)/timeStep);}
   accumulated=previous+(clamp(speed,minimumSpeed,maximumSpeed)-speed)/inverseMass;
   if(coordinate<minimum){accumulated=max(0.0,accumulated);}else if(coordinate>maximum){accumulated=min(0.0,accumulated);}
  }
 }
 targets.joints[index].impulses[row]=accumulated;
 jointImpulse(first,second,firstPoint,secondPoint,axis,accumulated-previous,angular);
}
fn solveGeneralJoint(index:u32,firstPoint:vec3f,secondPoint:vec3f,firstRotation:vec4f,secondRotation:vec4f,warm:bool){
 let constraint=targets.joints[index].general;let angular=constraint.axes.w>0.0;
 let count=dot(constraint.axes.xyz,vec3f(1));let offset=secondPoint-firstPoint;
 var relative=multiplyRotation(vec4f(-firstRotation.xyz,firstRotation.w),secondRotation);
 if(relative.w<0.0){relative=-relative;}
 // A hard zero-radius ball/socket or cone needs independent rows. Soft limits retain their radial metric.
 if(count>1.0&&constraint.limits.x<=0.0&&constraint.limits.y==0.0&&constraint.control.y==0.0&&constraint.control.x==0.0){
  for(var component=0u;component<3u;component++){
   if(constraint.axes[component]==0.0){continue;}var basis=vec3f(0);basis[component]=1.0;
   let axis=rotate(firstRotation,basis);
   let coordinate=select(dot(offset,axis),2.0*atan2(relative[component],relative.w),angular);
   let firstConstraintPoint=select(firstPoint+offset-axis*coordinate,firstPoint,angular);
   generalConstraintRow(index,component,firstConstraintPoint,secondPoint,axis,coordinate,warm,true);
  }return;
 }
 var axis=vec3f(0);var coordinate=0.0;
 if(!angular){
  let localOffset=rotate(vec4f(-firstRotation.xyz,firstRotation.w),offset)*constraint.axes.xyz;
  coordinate=length(localOffset);axis=localOffset/max(coordinate,1e-20);
  if(count==1.0){axis=constraint.axes.xyz;coordinate=dot(localOffset,axis);}
  if(length(axis)<0.5){for(var component=0u;component<3u;component++){if(constraint.axes[component]>0.0){axis[component]=1.0;break;}}}
  axis=rotate(firstRotation,axis);
 }else if(count==1.0){
  let basis=constraint.axes.xyz;let projection=dot(relative.xyz,basis);
  coordinate=2.0*atan2(projection,relative.w);
  // The twist-coordinate gradient changes under swing; a fixed axis loses this coupling.
  let denominator=max(relative.w*relative.w+projection*projection,1e-12);
  let gradient=(relative.w*relative.w*basis+relative.w*cross(relative.xyz,basis)+projection*relative.xyz)/denominator;
  axis=rotate(firstRotation,gradient);
 }else if(count==2.0){
  let remaining=vec3f(1)-constraint.axes.xyz;let firstAxis=rotate(firstRotation,remaining);let secondAxis=rotate(secondRotation,remaining);
  let perpendicular=cross(firstAxis,secondAxis);let sine=length(perpendicular);
  coordinate=atan2(sine,clamp(dot(firstAxis,secondAxis),-1.0,1.0));axis=perpendicular/max(sine,1e-20);
  if(sine<1e-6){for(var component=0u;component<3u;component++){if(constraint.axes[component]>0.0){var basis=vec3f(0);basis[component]=1.0;axis=rotate(firstRotation,basis);break;}}}
 }else{
  let sine=length(relative.xyz);coordinate=2.0*atan2(sine,relative.w);axis=rotate(firstRotation,relative.xyz/max(sine,1e-20));
  if(sine<1e-6){axis=rotate(firstRotation,vec3f(1,0,0));}
 }
 let firstConstraintPoint=select(firstPoint+offset-axis*coordinate,firstPoint,angular);
 generalConstraintRow(index,0u,firstConstraintPoint,secondPoint,axis,coordinate,warm,false);
}
`}function ll(e,t,n){if(e.length>64)throw Error(`Unsupported joint configuration`);for(let r of e){if(![`distance`,`fixed`,`hinge`,`slider`,`general`].includes(r.type)||r.first===r.second||[r.first,r.second].some(e=>!Number.isInteger(e)||e<0||e>=t.length)||![r.first,r.second].some(e=>(t[e].mode??((t[e].mass??1)===0?`static`:`dynamic`))===`dynamic`))throw Error(`Invalid joint bodies`);if(n===`parallel`){let e=[r.first,r.second].some(e=>(t[e].mode??((t[e].mass??1)===0?`static`:`dynamic`))===`static`);if(r.type!==`distance`||!e)throw Error(`Unsupported parallel joint`)}r.type===`general`&&sl(r);for(let e of[r.firstFrame,r.secondFrame]){if(e?.position&&(e.position.length!==3||!e.position.every(e=>Number.isFinite(Math.fround(e)))))throw Error(`Invalid joint anchor`);e?.orientation&&U(e.orientation)}if(r.type===`distance`&&(!Number.isFinite(Math.fround(r.distance))||r.distance<0))throw Error(`Invalid joint distance`);let e=r.type===`distance`?r.spring:void 0,i=r.type===`hinge`||r.type===`slider`?r.motor:void 0;if([e?.stiffness,e?.damping,i?.stiffness,i?.damping].some(e=>e!==void 0&&(!Number.isFinite(Math.fround(e))||e<0))||i?.position!==void 0&&!Number.isFinite(Math.fround(i.position)))throw Error(`Invalid joint drive`);if(r.type===`hinge`||r.type===`slider`){if(r.type===`hinge`&&i?.position!==void 0&&Math.abs(i.position)>Math.PI)throw Error(`Invalid hinge target`);if(r.limits&&(r.limits.length!==2||!r.limits.every(e=>Number.isFinite(Math.fround(e)))||r.limits[0]>r.limits[1]||r.type===`hinge`&&(r.limits[0]<=-Math.PI||r.limits[1]>=Math.PI)))throw Error(`Invalid joint limits`);if(r.motor&&(!Number.isFinite(Math.fround(r.motor.velocity??0))||!Number.isFinite(Math.fround(r.motor.maximumForce))||r.motor.maximumForce<0))throw Error(`Invalid joint motor`)}}}function ul(e,t){if(!e.length)return`fn jointActive(body:u32)->bool{return false;} fn jointExcluded(first:u32,second:u32)->bool{return false;}`;let n=e=>`vec${e.length}f(${e.map(e=>`${Math.fround(e)}`).join(`,`)})`,r=(e,t)=>`${n(t?.position??[0,0,0])},${n(U(t?.orientation??[0,0,0,1]))}`,i=e.map(e=>{let t=e.type===`hinge`||e.type===`slider`?e:void 0;return`Joint(vec4u(${e.first},${e.second},${[`distance`,`fixed`,`hinge`,`slider`,`general`].indexOf(e.type)},${e.collideConnected?1:0}),${r(e.first,e.firstFrame)},${r(e.second,e.secondFrame)},${n([e.type===`distance`?e.distance:0,t?.limits?.[0]??0,t?.limits?.[1]??0,t?.limits?1:0])},${n([t?.motor?.velocity??0,t?.motor?.maximumForce??0,t?.motor?1:0,0])},${n([t?.motor?.position??0,t?.motor?.stiffness??30,t?.motor?.damping??5,t?.motor?.position===void 0?0:1])},${n([e.type===`distance`?e.spring?.stiffness??0:0,e.type===`distance`?e.spring?.damping??0:0,e.type===`distance`&&e.spring?1:0,0])})`});return`
struct Joint { identifiers:vec4u, firstAnchor:vec3f, firstFrame:vec4f, secondAnchor:vec3f, secondFrame:vec4f, limits:vec4f, motor:vec4f, drive:vec4f, spring:vec4f }
const JOINTS:array<Joint,${e.length}>=array<Joint,${e.length}>(${i.join(`,`)});
fn liveJoint(index:u32)->Joint {
 var joint=JOINTS[index];let state=targets.joints[index];
 joint.identifiers.w=u32(state.control.y);joint.limits=state.limits;joint.motor=state.motor;joint.drive=state.drive;joint.spring=state.spring;return joint;
}
${cl()}
fn jointActive(body:u32)->bool {for(var index=0u;index<${e.length}u;index++){let joint=liveJoint(index);if(targets.joints[index].control.x<0.5){continue;}if(joint.identifiers.x==body||joint.identifiers.y==body){let first=joint.identifiers.x;let second=joint.identifiers.y;if(joint.motor.z>0.0 || generalJointDriven(index) || (bodies.bodies[first].motion.x==2.0 && length(velocities[first].xyz)+length(angularVelocities[first].xyz)>1e-6) || (bodies.bodies[second].motion.x==2.0 && length(velocities[second].xyz)+length(angularVelocities[second].xyz)>1e-6)){return true;}}}return false;}
fn connectJoints(){for(var index=0u;index<${e.length}u;index++){if(targets.joints[index].control.x<0.5){continue;}let joint=liveJoint(index);let first=joint.identifiers.x;let second=joint.identifiers.y;if(dynamic(first)&&dynamic(second)){let firstRoot=root(first);let secondRoot=root(second);sleepStates[max(firstRoot,secondRoot)].z=f32(min(firstRoot,secondRoot));}}}
fn jointExcluded(first:u32,second:u32)->bool {for(var index=0u;index<${e.length}u;index++){let identifiers=liveJoint(index).identifiers;if(targets.joints[index].control.x>0.5&&identifiers.w==0u&&((identifiers.x==first&&identifiers.y==second)||(identifiers.y==first&&identifiers.x==second))){return true;}}return false;}
fn jointMass(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,angular:bool)->f32 {
 if(angular){return dot(axis,inverseInertia(first,axis)+inverseInertia(second,axis));}
 let firstLever=firstPoint-positions[first].xyz;let secondLever=secondPoint-positions[second].xyz;
 return velocities[first].w+velocities[second].w+dot(axis,cross(inverseInertia(first,cross(firstLever,axis)),firstLever)+cross(inverseInertia(second,cross(secondLever,axis)),secondLever));
}
fn jointVelocity(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,angular:bool)->f32 {
 if(angular){return dot(angularVelocities[second].xyz-angularVelocities[first].xyz,axis);}
 return dot(pointVelocity(second,secondPoint)-pointVelocity(first,firstPoint),axis);
}
fn jointImpulse(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,impulse:f32,angular:bool){
 if(angular){if(dynamic(first)){angularVelocities[first]=vec4f(angularVelocities[first].xyz-inverseInertia(first,axis*impulse),0);}if(dynamic(second)){angularVelocities[second]=vec4f(angularVelocities[second].xyz+inverseInertia(second,axis*impulse),0);}}
 else{applyImpulse(first,firstPoint,-axis*impulse);applyImpulse(second,secondPoint,axis*impulse);}
}
fn jointRow(index:u32,row:u32,first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,error:f32,angular:bool,spring:vec4f,warm:bool){
 let previous=targets.joints[index].impulses[row];
 if(warm){let retained=previous*settings.stability.x;targets.joints[index].impulses[row]=retained;jointImpulse(first,second,firstPoint,secondPoint,axis,retained,angular);return;}
 let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){return;}
 var softness=0.0;var bias=clamp(settings.stability.y*error/settings.gravity.w,-settings.stability.z,settings.stability.z);
 if(spring.z>0){softness=1.0/max(1e-20,settings.gravity.w*(spring.y+settings.gravity.w*spring.x));bias=error*settings.gravity.w*spring.x*softness;}
 let increment=-(jointVelocity(first,second,firstPoint,secondPoint,axis,angular)+bias+softness*previous)/(mass+softness);
 targets.joints[index].impulses[row]=previous+increment;jointImpulse(first,second,firstPoint,secondPoint,axis,increment,angular);
}
fn solveJoints(warm:bool){
 for(var index=0u;index<${e.length}u;index++){
  if(targets.joints[index].control.x<0.5){continue;}
  let joint=liveJoint(index);let first=joint.identifiers.x;let second=joint.identifiers.y;let kind=joint.identifiers.z;
  if((!dynamic(first)||sleepStates[first].y>0.5)&&(!dynamic(second)||sleepStates[second].y>0.5)){continue;}
  var firstPoint=positions[first].xyz+rotate(orientations[first],joint.firstAnchor-bodyCenter(first));let secondPoint=positions[second].xyz+rotate(orientations[second],joint.secondAnchor-bodyCenter(second));
  let firstRotation=multiplyRotation(orientations[first],joint.firstFrame);let secondRotation=multiplyRotation(orientations[second],joint.secondFrame);
  let offset=secondPoint-firstPoint;
  if(kind==4u){solveGeneralJoint(index,firstPoint,secondPoint,firstRotation,secondRotation,warm);continue;}
  // A slider constrains a point on the moving axis, not the fixed frame origin.
  if(kind==3u){let axis=rotate(firstRotation,vec3f(0,0,1));firstPoint+=axis*dot(offset,axis);}
  if(kind==0u){let distance=length(offset);let axis=select(rotate(firstRotation,vec3f(1,0,0)),offset/max(distance,1e-20),distance>1e-8);jointRow(index,0u,first,second,firstPoint,secondPoint,axis,distance-joint.limits.x,false,joint.spring,warm);continue;}
  for(var component=0u;component<select(3u,2u,kind==3u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(index,component,first,second,firstPoint,secondPoint,axis,dot(offset,axis),false,vec4f(0),warm);}
  var relative=multiplyRotation(secondRotation,vec4f(-firstRotation.xyz,firstRotation.w));if(relative.w<0){relative=-relative;}
  let sine=length(relative.xyz);let rotationError=relative.xyz*(2.0*atan2(sine,relative.w)/max(sine,1e-20));
  for(var component=0u;component<select(3u,2u,kind==2u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(index,3u+component,first,second,firstPoint,secondPoint,axis,dot(rotationError,axis),true,vec4f(0),warm);}
  if(kind==1u){continue;}
  let angular=kind==2u;let axis=rotate(firstRotation,vec3f(0,0,1));
  let localRotation=multiplyRotation(vec4f(-firstRotation.xyz,firstRotation.w),secondRotation);
  var angle=2.0*atan2(localRotation.z,localRotation.w);if(angle>3.14159265){angle-=6.2831853;}if(angle < -3.14159265){angle+=6.2831853;}
  let coordinate=select(dot(offset,axis),angle,angular);let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){continue;}
  if(joint.motor.z>0){
   let previous=targets.joints[index].impulses[6];let limit=joint.motor.y*settings.gravity.w;
   var desired=joint.motor.x;var softness=0.0;
   if(joint.drive.w>0){softness=1.0/max(1e-20,settings.gravity.w*(joint.drive.z+settings.gravity.w*joint.drive.y));desired-= (coordinate-joint.drive.x)*settings.gravity.w*joint.drive.y*softness;}
   let increment=(desired-jointVelocity(first,second,firstPoint,secondPoint,axis,angular)-softness*previous)/(mass+softness);
   let accumulated=clamp(select(previous+increment,previous*settings.stability.x,warm),-limit,limit);
   jointImpulse(first,second,firstPoint,secondPoint,axis,select(accumulated-previous,accumulated,warm),angular);targets.joints[index].impulses[6]=accumulated;
  }
  if(joint.limits.w>0){
   // Limits are unilateral: discard a cached impulse when the active side changes.
   let previous=targets.joints[index].impulses[7];let minimum=(joint.limits.y-coordinate)/settings.gravity.w;let maximum=(joint.limits.z-coordinate)/settings.gravity.w;
   let speed=jointVelocity(first,second,firstPoint,secondPoint,axis,angular);
   var accumulated=previous+(clamp(speed,minimum,maximum)-speed)/mass;
   if(coordinate<joint.limits.y){accumulated=max(0.0,accumulated);}else if(coordinate>joint.limits.z){accumulated=min(0.0,accumulated);}
   if(warm){accumulated=0.0;}
   jointImpulse(first,second,firstPoint,secondPoint,axis,select(accumulated-previous,0.0,warm),angular);targets.joints[index].impulses[7]=accumulated;
  }
 }
}
`}function dl(e){let t=new Float32Array(176/4),n=e.type===`hinge`||e.type===`slider`?e:void 0;t.set([e.enabled===!1?0:1,e.collideConnected?1:0,0,0],8),t.set([e.type===`distance`?e.distance:0,n?.limits?.[0]??0,n?.limits?.[1]??0,n?.limits?1:0],12),t.set([n?.motor?.velocity??0,n?.motor?.maximumForce??0,n?.motor?1:0,0],16),t.set([n?.motor?.position??0,n?.motor?.stiffness??30,n?.motor?.damping??5,n?.motor?.position===void 0?0:1],20),t.set([e.type===`distance`?e.spring?.stiffness??0:0,e.type===`distance`?e.spring?.damping??0:0,e.type===`distance`&&e.spring?1:0,0],24);let r=e.type===`general`?e:void 0;t.set([...[0,1,2].map(e=>r?.axes.includes(e)?1:0),r?.angular?1:0],28),t.set([r?.minimum??-1e30,r?.maximum??1e30,r?.stiffness??0,r?.damping??0],32);let i=r?.drive;return t.set([r?.stiffness===void 0?0:1,i?1:0,i?.mode===`acceleration`?1:0,i?.maximumForce??1e30],36),t.set([i?.positionTarget??0,i?.velocityTarget??0,i?.stiffness??0,i?.damping??0],40),t}function fl(e,t,n,r,i,a,o,s=0,c=!1,l=!1,u=!1,d=0,f=0){let p=Math.ceil((e*12+t*26)/4)*4,m=Math.ceil((p+r)/64)*64,h=Math.ceil((m+n*2)/64)*64,g=i?h+8:p+Math.max(4,r),_=Math.ceil((4+e*5+n*2)/4)*16+n*64+Math.ceil((n*2+e)/4)*16,v=[...[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`].map(t=>({name:t,byteLength:e*16,uniform:!1})),{name:`targets`,byteLength:f?ol(e,f,n).byteLength:Math.ceil((e*32+(i?32+n*8:16))/16)*16+d*176,uniform:!1},{name:`manifolds`,byteLength:n*416,uniform:!1},{name:`bodies`,byteLength:g*4,uniform:!1},{name:`settings`,byteLength:64,uniform:!0},{name:`control-settings`,byteLength:64,uniform:!0},{name:`simulation-statistics`,byteLength:64,uniform:!1},...s?[{name:`contact-events`,byteLength:16+s*64,uniform:!1},{name:`contact-history`,byteLength:n*16,uniform:!1}]:[],...c?[{name:`query-settings`,byteLength:48,uniform:!0},{name:`query-selection`,byteLength:Math.max(4,t*4),uniform:!1},{name:`query-output`,byteLength:16+Math.max(1,t)*48,uniform:!1}]:[],...a?[{name:`mesh-tasks`,byteLength:3145744,uniform:!1}]:[],...o?[{name:`parallel-state`,byteLength:_,uniform:!1},{name:`parallel-dispatch`,byteLength:48,uniform:!1}]:[],...i?[{name:`minima`,byteLength:t*12,uniform:!1},{name:`maxima`,byteLength:t*12,uniform:!1},{name:`object-attributes`,byteLength:t*4,uniform:!1}]:[]];if(u&&v.push({name:`continuous-previous`,byteLength:e*16,uniform:!1},{name:`continuous-selection`,byteLength:e*4,uniform:!1},{name:`continuous-status`,byteLength:e*16,uniform:!1}),l){v.push({name:`state-validity`,byteLength:e*4,uniform:!1});let t=[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`,...f?[]:[`targets`,`manifolds`]].map((e,t)=>({name:`checkpoint-${t}`,byteLength:v.find(t=>t.name===e).byteLength,uniform:!1}));v.push(...t)}return{geometryOffset:p,pairOffset:m,diagnosticOffset:h,metadataLength:g,parallelByteLength:_,buffers:v}}var pl=`
struct SurfacePoint { point:vec3f, distance:f32, complete:u32 }
fn closestSegment(point:vec3f,first:vec3f,second:vec3f)->vec3f{
 let edge=second-first;return first+edge*clamp(dot(point-first,edge)/max(dot(edge,edge),1e-30),0.0,1.0);
}
fn closestTriangle(point:vec3f,first:vec3f,second:vec3f,third:vec3f)->vec3f{
 let firstEdge=second-first;let secondEdge=third-first;let normal=cross(firstEdge,secondEdge);
 let squared=dot(normal,normal);
 if(squared>0.0){
  let projected=point-normal*(dot(point-first,normal)/squared);
  if(dot(cross(second-first,projected-first),normal)>=0.0&&dot(cross(third-second,projected-second),normal)>=0.0&&dot(cross(first-third,projected-third),normal)>=0.0){return projected;}
 }
 var nearest=closestSegment(point,first,second);
 for(var edge=0u;edge<2u;edge++){
  let candidate=closestSegment(point,select(third,second,edge==0u),select(first,third,edge==0u));
  if(distance(point,candidate)<distance(point,nearest)){nearest=candidate;}
 }
 return nearest;
}
fn closestSurface(collider:u32,point:vec3f)->SurfacePoint{
 let shape=bodies.colliders[collider].shape;var nearest=point;var inside=false;var complete=1u;
 if(shape.w==0.0){let magnitude=length(point);nearest=point/max(magnitude,1e-20)*shape.x;if(magnitude==0.0){nearest=vec3f(shape.x,0,0);}inside=magnitude<=shape.x;}
 else if(shape.w==1.0){nearest=clamp(point,-shape.xyz,shape.xyz);inside=all(abs(point)<=shape.xyz);}
 else if(shape.w==6.0){nearest=vec3f(point.x,0,point.z);if(shape.x>0.0){nearest.x=clamp(point.x,-shape.x,shape.x);}if(shape.y>0.0){nearest.z=clamp(point.z,-shape.y,shape.y);}}
 else if(shape.w==5.0){
  let radial=length(point.xz);let direction=select(vec2f(1,0),point.xz/max(radial,1e-20),radial>1e-20);
  let flattened=vec3f(radial,point.y,0);let bottom=vec3f(shape.x,-shape.z*0.5,0);let top=vec3f(shape.y,shape.z*0.5,0);
  var closest=closestSegment(flattened,bottom,top);
  let bottomCap=vec3f(clamp(radial,0.0,shape.x),bottom.y,0);let topCap=vec3f(clamp(radial,0.0,shape.y),top.y,0);
  if(distance(flattened,bottomCap)<distance(flattened,closest)){closest=bottomCap;}
  if(distance(flattened,topCap)<distance(flattened,closest)){closest=topCap;}
  nearest=vec3f(direction.x*closest.x,closest.y,direction.y*closest.x);
  inside=point.y>=bottom.y&&point.y<=top.y&&radial<=mix(shape.x,shape.y,clamp((point.y-bottom.y)/max(shape.z,1e-20),0.0,1.0));
 }else if(shape.w==4.0){
  let bottom=vec3f(0,-shape.z*0.5,0);let top=vec3f(0,shape.z*0.5,0);
  if(abs(shape.y-shape.x)>=shape.z){let center=select(bottom,top,shape.y>=shape.x);let radius=max(shape.x,shape.y);let delta=point-center;nearest=center+select(vec3f(1,0,0),delta/max(length(delta),1e-20),length(delta)>1e-20)*radius;inside=length(delta)<=radius;}
  else{
   let slope=(shape.y-shape.x)/shape.z;let radial=length(point.xz);let direction=select(vec2f(1,0),point.xz/max(radial,1e-20),radial>1e-20);
   let tangent=vec3f(sqrt(max(0.0,1.0-slope*slope)),-slope,0);
   let flattened=vec3f(radial,point.y,0);var closest=closestSegment(flattened,bottom+tangent*shape.x,top+tangent*shape.y);
   let bottomDirection=(flattened-bottom)/max(length(flattened-bottom),1e-20);let topDirection=(flattened-top)/max(length(flattened-top),1e-20);
   let bottomPoint=bottom+bottomDirection*shape.x;let topPoint=top+topDirection*shape.y;
   if(bottomDirection.y<=-slope&&distance(flattened,bottomPoint)<distance(flattened,closest)){closest=bottomPoint;}
   if(topDirection.y>=-slope&&distance(flattened,topPoint)<distance(flattened,closest)){closest=topPoint;}
   nearest=vec3f(direction.x*closest.x,closest.y,direction.y*closest.x);
   inside=length(flattened-bottom)<=shape.x||length(flattened-top)<=shape.y||(point.y>=bottom.y-shape.x*slope&&point.y<=top.y-shape.y*slope&&dot(flattened-bottom,tangent)<=shape.x);
  }
 }else{
  var best=3.402823e38;var work=0u;var node=0u;
  let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
  // Convex containment uses oriented face half-spaces. Triangle meshes retain surface semantics.
  inside=shape.w==2.0;
  if(inside){for(var triangle=0u;triangle<u32(bodies.colliders[collider].padding.w);triangle++){
   if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
   let first=triangleVertex(collider,triangle,0u);let second=triangleVertex(collider,triangle,1u);let third=triangleVertex(collider,triangle,2u);
   if(dot(point-first,cross(second-first,third-first))>0.0){inside=false;break;}
  }}
  loop{
   if(node>=nodeCount){break;}if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
   let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
   if(distance(point,clamp(point,lower.xyz,upper.xyz))>best){node=u32(lower.w);continue;}
   if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);
    for(var offset=0u;offset<u32(upper.w);offset++){
     if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
     let candidate=closestTriangle(point,triangleVertex(collider,start+offset,0u),triangleVertex(collider,start+offset,1u),triangleVertex(collider,start+offset,2u));
     let separation=distance(point,candidate);if(separation<best){best=separation;nearest=candidate;}
    }
   }if(complete==0u){break;}node++;
  }
 }
 return SurfacePoint(nearest,select(distance(point,nearest),0.0,inside),complete);
}
struct SphereSweep { point:vec3f, normal:vec3f, distance:f32, hit:u32, complete:u32 }
// Exact rounded-box cast: face rectangles, finite edge cylinders and corner spheres.
// Testing features separately preserves open corners instead of inflating an AABB.
fn sweepBox(origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,extent:vec3f)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;
 if(radius==0.0){
  var enter=0.0;var leave=maximumDistance;
  for(var coordinate=0u;coordinate<3u;coordinate++){
   if(direction[coordinate]==0.0){if(abs(origin[coordinate])>extent[coordinate]){return result;}}
   else{let first=(-extent[coordinate]-origin[coordinate])/direction[coordinate];let second=(extent[coordinate]-origin[coordinate])/direction[coordinate];let lower=min(first,second);
    if(lower>=enter){enter=lower;result.normal=vec3f(0);result.normal[coordinate]=select(1.0,-1.0,direction[coordinate]>0.0);}leave=min(leave,max(first,second));}
  }
  if(enter<=leave){result.hit=1u;result.distance=enter;result.point=origin+direction*enter;}
  return result;
 }
 let initial=clamp(origin,-extent,extent);let initialDelta=origin-initial;
 if(length(initialDelta)<=radius){result.hit=1u;result.point=initial;result.normal=initialDelta/max(length(initialDelta),1e-20);return result;}
 for(var coordinate=0u;coordinate<3u;coordinate++){
  let first=(coordinate+1u)%3u;let second=(coordinate+2u)%3u;
  for(var side=0u;side<2u;side++){
   let sign=select(-1.0,1.0,side==1u);
   if(direction[coordinate]*sign>=0.0){continue;}
   let travelled=(sign*(extent[coordinate]+radius)-origin[coordinate])/direction[coordinate];
   let center=origin+direction*travelled;
   if(travelled>=0.0&&travelled<=nearest&&abs(center[first])<=extent[first]&&abs(center[second])<=extent[second]){
    nearest=travelled;result.hit=1u;result.normal=vec3f(0);result.normal[coordinate]=sign;
   }
  }
  for(var corner=0u;corner<4u;corner++){
   var center=vec3f(0);center[first]=select(-extent[first],extent[first],(corner&1u)!=0u);center[second]=select(-extent[second],extent[second],(corner&2u)!=0u);
   var delta=origin-center;delta[coordinate]=0.0;var radialDirection=direction;radialDirection[coordinate]=0.0;
   let squared=dot(radialDirection,radialDirection);if(squared==0.0){continue;}
   let projection=dot(delta,radialDirection)/squared;let perpendicular=delta-radialDirection*projection;
   let discriminant=(radius*radius-dot(perpendicular,perpendicular))/squared;if(discriminant < -1e-6*radius*radius/squared){continue;}
   let travelled=-projection-sqrt(max(0.0,discriminant));let point=origin+direction*travelled;
   if(travelled>=0.0&&travelled<=nearest&&abs(point[coordinate])<=extent[coordinate]){
    nearest=travelled;result.hit=1u;center[coordinate]=point[coordinate];result.normal=(point-center)/max(radius,1e-20);
   }
  }
 }
 for(var corner=0u;corner<8u;corner++){
  let center=select(-extent,extent,vec3u(corner&1u,corner&2u,corner&4u)!=vec3u(0));
  let delta=origin-center;let projection=dot(delta,direction);let perpendicular=delta-direction*projection;
  let discriminant=radius*radius-dot(perpendicular,perpendicular);if(discriminant < -1e-6*radius*radius){continue;}
  let travelled=-projection-sqrt(max(0.0,discriminant));
  if(travelled>=0.0&&travelled<=nearest){nearest=travelled;result.hit=1u;result.normal=(origin+direction*travelled-center)/max(radius,1e-20);}
 }
 if(result.hit!=0u){result.distance=nearest;result.point=origin+direction*nearest-result.normal*radius;}
 return result;
}
// A triangle's sphere expansion is convex. Ignore only a departing initial touch
// on that triangle; other triangles in the same nonconvex mesh remain candidates.
fn sweepTriangle(origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,first:vec3f,second:vec3f,third:vec3f,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;
 let firstEdge=second-first;let secondEdge=third-first;
 let edgeScale=max(max(max(abs(firstEdge.x),abs(firstEdge.y)),abs(firstEdge.z)),max(max(abs(secondEdge.x),abs(secondEdge.y)),abs(secondEdge.z)));
 let rawNormal=cross(firstEdge/max(edgeScale,1e-30),secondEdge/max(edgeScale,1e-30));
 let normal=rawNormal/max(length(rawNormal),1e-20);
 let initial=closestTriangle(origin,first,second,third);let delta=origin-initial;
 let tolerance=max(1e-8,min(1e-5,radius*1e-5));
 if(length(delta)<=radius+tolerance){
  result.normal=select(normal,(delta)/max(length(delta),1e-20),length(delta)>0.0);
  if(skipSeparating&&dot(direction,result.normal)>=0.0){return result;}
  result.hit=1u;result.point=initial;return result;
 }
 let denominator=dot(direction,normal);
 // Clip a coplanar zero-radius ray against the triangle's three inward half-spaces.
 // A parallel offset ray remains a miss; coplanar picking retains edge intersections.
 if(radius==0.0&&denominator==0.0&&abs(dot(origin-first,normal))<=tolerance){
  var enter=0.0;var leave=maximumDistance;var enterNormal=normal;
  let corners=array<vec3f,3>(first,second,third);
  for(var edge=0u;edge<3u;edge++){
   let start=corners[edge];let side=(corners[(edge+1u)%3u]-start)/edgeScale;
   let offset=dot(cross(side,(origin-start)/edgeScale),normal);
   let change=dot(cross(side,direction/edgeScale),normal);
   if(change==0.0){if(offset<0.0){return result;}}
   else{let boundary=-offset/change;if(change>0.0){if(boundary>=enter){enter=boundary;enterNormal=normalize(cross(side,normal));}}else{leave=min(leave,boundary);}}
  }
  if(enter<=leave){result.hit=1u;result.distance=enter;result.point=origin+direction*enter;result.normal=enterNormal;}
  return result;
 }
 if(abs(denominator)>0.0){for(var side=0u;side<2u;side++){
  let sign=select(-1.0,1.0,side==1u);if(denominator*sign>=0.0){continue;}
  let travelled=(sign*radius-dot(origin-first,normal))/denominator;
  let point=origin+direction*travelled-normal*(sign*radius);
  if(travelled<0.0||travelled>nearest){continue;}
  if(dot(cross((second-first)/edgeScale,(point-first)/edgeScale),normal)>=0.0&&dot(cross((third-second)/edgeScale,(point-second)/edgeScale),normal)>=0.0&&dot(cross((first-third)/edgeScale,(point-third)/edgeScale),normal)>=0.0){
   nearest=travelled;result.hit=1u;result.normal=normal*sign;
  }
 }}
 if(radius>0.0){
  var vertices=array<vec3f,3>(first,second,third);
  for(var edge=0u;edge<3u;edge++){
   let start=vertices[edge];let segment=vertices[(edge+1u)%3u]-start;
   let segmentLength=length(segment);let axis=segment/max(segmentLength,1e-20);
   let offset=origin-start;let radial=offset-axis*dot(offset,axis);let radialDirection=direction-axis*dot(direction,axis);
   let squared=dot(radialDirection,radialDirection);
   if(squared>0.0){
    let projection=dot(radial,radialDirection)/squared;let perpendicular=radial-radialDirection*projection;
    let discriminant=(radius*radius-dot(perpendicular,perpendicular))/squared;
    if(discriminant>=-1e-6*radius*radius/squared){
     let travelled=-projection-sqrt(max(0.0,discriminant));let center=origin+direction*travelled;let along=dot(center-start,axis);
     if(travelled>=0.0&&travelled<=nearest&&along>=0.0&&along<=segmentLength){nearest=travelled;result.hit=1u;result.normal=(center-start-axis*along)/radius;}
    }
   }
   let projection=dot(offset,direction);let perpendicular=offset-direction*projection;
   let discriminant=radius*radius-dot(perpendicular,perpendicular);
   if(discriminant>=-1e-6*radius*radius){
    let travelled=-projection-sqrt(max(0.0,discriminant));
    if(travelled>=0.0&&travelled<=nearest){nearest=travelled;result.hit=1u;result.normal=(origin+direction*travelled-start)/radius;}
   }
  }
 }
 if(result.hit!=0u){result.distance=nearest;result.point=origin+direction*nearest-result.normal*radius;}
 return result;
}
fn intersectsSweepBounds(origin:vec3f,direction:vec3f,maximumDistance:f32,lower:vec3f,upper:vec3f)->bool{
 var enter=0.0;var leave=maximumDistance;
 for(var coordinate=0u;coordinate<3u;coordinate++){
  if(direction[coordinate]==0.0){if(origin[coordinate]<lower[coordinate]||origin[coordinate]>upper[coordinate]){return false;}}
  else{let first=(lower[coordinate]-origin[coordinate])/direction[coordinate];let second=(upper[coordinate]-origin[coordinate])/direction[coordinate];enter=max(enter,min(first,second));leave=min(leave,max(first,second));}
 }
 return enter<=leave;
}
fn sweepMesh(collider:u32,origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;var work=0u;var node=0u;
 let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
 loop{
  if(node>=nodeCount){break;}if(work>=MESH_TRAVERSAL_BUDGET){result.complete=0u;return result;}work++;
  let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
  if(!intersectsSweepBounds(origin,direction,nearest,lower.xyz-vec3f(radius),upper.xyz+vec3f(radius))){node=u32(lower.w);continue;}
  if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);
   for(var offset=0u;offset<u32(upper.w);offset++){
    if(work>=MESH_TRAVERSAL_BUDGET){result.complete=0u;return result;}work++;
    let candidate=sweepTriangle(origin,direction,nearest,radius,triangleVertex(collider,start+offset,0u),triangleVertex(collider,start+offset,1u),triangleVertex(collider,start+offset,2u),skipSeparating);
    if(candidate.hit!=0u){nearest=candidate.distance;result=candidate;}
   }
  }node++;
 }
 return result;
}
fn sweepSphere(collider:u32,origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var travelled=0.0;
 let shape=bodies.colliders[collider].shape;
 if(shape.w==6.0&&shape.z==0.0&&origin.y<0.0){return result;}
 if(shape.w==3.0){return sweepMesh(collider,origin,direction,maximumDistance,radius,skipSeparating);}
 if(shape.w==1.0){return sweepBox(origin,direction,maximumDistance,radius,shape.xyz);}
 if(shape.w==0.0){
  let inflated=shape.x+radius;let projection=dot(origin,direction);
  let perpendicular=origin-direction*projection;let discriminant=inflated*inflated-dot(perpendicular,perpendicular);
  if(length(origin)>inflated){
   if(discriminant < -1e-6*inflated*inflated){return result;}
   travelled=-projection-sqrt(max(0.0,discriminant));
   if(travelled<0.0||travelled>maximumDistance){return result;}
  }
  let center=origin+direction*travelled;let normal=center/max(length(center),1e-20);
  result.point=normal*shape.x;result.normal=normal;result.distance=travelled;result.hit=1u;return result;
 }
 // Unbounded planes have an exact intersection, including parallel and tangent casts.
 if(shape.w==6.0&&shape.x==0.0&&shape.y==0.0){
  let side=select(-1.0,1.0,origin.y>=0.0);
  if(abs(origin.y)>radius){
   if(direction.y*side>=0.0){return result;}
   travelled=(side*radius-origin.y)/direction.y;
   if(travelled>maximumDistance){return result;}
  }
  let center=origin+direction*travelled;
  result.point=vec3f(center.x,0,center.z);result.normal=vec3f(0,side,0);result.distance=travelled;result.hit=1u;return result;
 }
 // Radius-zero rays still need a local-feature tolerance above float32 roundoff.
 // Never derive this from an elongated world AABB or the whole mesh bounds.
 let tolerance=max(1e-8,min(1e-5,max(radius,contactFeatureScale(collider,-1))*1e-6));
 for(var iteration=0u;iteration<128u;iteration++){
  let center=origin+direction*travelled;let surface=closestSurface(collider,center);
  if(surface.complete==0u){result.complete=0u;return result;}
  let separation=surface.distance-radius;
  if(separation<=tolerance){result.point=surface.point;result.normal=select(vec3f(0),(center-surface.point)/max(length(center-surface.point),1e-20),surface.distance>0.0);result.distance=travelled;result.hit=1u;return result;}
  if(travelled+separation>maximumDistance){return result;}
  let next=travelled+separation;
  if(next<=travelled){result.complete=0u;return result;}travelled=next;
 }
 result.complete=0u;return result;
}
`,ml=`
struct SupportVertex { difference: vec3f, first: vec3f, second: vec3f }
fn meshVertex(collider:u32, index:u32)->vec3f {return readGeometry(u32(bodies.colliders[collider].padding.x)+index).xyz;}
fn localShapeSupport(collider:u32,direction:vec3f,triangle:i32)->vec3f {
 let shape=bodies.colliders[collider].shape;
 let magnitude=length(direction);let unit=select(vec3f(1,0,0),direction/max(magnitude,1e-20),magnitude>1e-20);
 if(triangle>=0){var best=triangleVertex(collider,u32(triangle),0u);for(var corner=1u;corner<3u;corner++){let candidate=triangleVertex(collider,u32(triangle),corner);if(dot(candidate,direction)>dot(best,direction)){best=candidate;}}return best;}
 if(shape.w==0.0){return unit*shape.x;}
 if(shape.w==1.0){return select(-shape.xyz,shape.xyz,direction>=vec3f(0));}
 if(shape.w==4.0){let bottom=unit*shape.x-vec3f(0,shape.z*0.5,0);let top=unit*shape.y+vec3f(0,shape.z*0.5,0);return select(bottom,top,dot(top,direction)>dot(bottom,direction));}
 if(shape.w==5.0){let radial=length(direction.xz);let ring=select(vec2f(1,0),direction.xz/max(radial,1e-20),radial>1e-20);let bottom=vec3f(ring.x*shape.x,-shape.z*0.5,ring.y*shape.x);let top=vec3f(ring.x*shape.y,shape.z*0.5,ring.y*shape.y);return select(bottom,top,dot(top,direction)>dot(bottom,direction));}
 let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
 var best=meshVertex(collider,0u);var projection=dot(best,direction);var node=0u;
 loop {if(node>=nodeCount){break;}let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
  let bound=dot(select(lower.xyz,upper.xyz,direction>=vec3f(0)),direction);
  if(bound<projection){node=u32(lower.w);continue;}
  if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);for(var face=0u;face<u32(upper.w);face++){for(var corner=0u;corner<3u;corner++){let candidate=triangleVertex(collider,start+face,corner);let value=dot(candidate,direction);if(value>projection){best=candidate;projection=value;}}}}
  node++;
 }
 return best;
}
fn triangleWeights(point:vec3f,first:vec3f,second:vec3f,third:vec3f)->vec3f {
 let firstEdge=second-first;let secondEdge=third-first;let delta=point-first;let firstProjection=dot(firstEdge,delta);let secondProjection=dot(secondEdge,delta);
 if(firstProjection<=0.0&&secondProjection<=0.0){return vec3f(1,0,0);}
 let secondDelta=point-second;let thirdProjection=dot(firstEdge,secondDelta);let fourthProjection=dot(secondEdge,secondDelta);
 if(thirdProjection>=0.0&&fourthProjection<=thirdProjection){return vec3f(0,1,0);}
 let edgeRegion=firstProjection*fourthProjection-thirdProjection*secondProjection;
 if(edgeRegion<=0.0&&firstProjection>=0.0&&thirdProjection<=0.0){let weight=firstProjection/(firstProjection-thirdProjection);return vec3f(1-weight,weight,0);}
 let thirdDelta=point-third;let fifthProjection=dot(firstEdge,thirdDelta);let sixthProjection=dot(secondEdge,thirdDelta);
 if(sixthProjection>=0.0&&fifthProjection<=sixthProjection){return vec3f(0,0,1);}
 let secondRegion=fifthProjection*secondProjection-firstProjection*sixthProjection;
 if(secondRegion<=0.0&&secondProjection>=0.0&&sixthProjection<=0.0){let weight=secondProjection/(secondProjection-sixthProjection);return vec3f(1-weight,0,weight);}
 let thirdRegion=thirdProjection*sixthProjection-fifthProjection*fourthProjection;
 if(thirdRegion<=0.0&&(fourthProjection-thirdProjection)>=0.0&&(fifthProjection-sixthProjection)>=0.0){let weight=(fourthProjection-thirdProjection)/((fourthProjection-thirdProjection)+(fifthProjection-sixthProjection));return vec3f(0,1-weight,weight);}
 let inverse=1.0/max(thirdRegion+secondRegion+edgeRegion,1e-20);return vec3f(thirdRegion,secondRegion,edgeRegion)*inverse;
}
`;function hl(e,t,n,r){return`
const CONTINUOUS_CAPACITY:u32=${e}u;
struct ContinuousCandidate { colliders:vec4u, point:vec4f, normal:vec4f }
struct ContinuousBounds { lower:vec4f, upper:vec4f }
struct ContinuousWork {
 count:atomic<u32>, overflow:atomic<u32>, remaining:f32, finished:u32,
 tests:atomic<u32>, peakTests:u32, rounds:u32, axis:u32,
 lastPair:vec4u, lastNormal:vec4f,
 bounds:array<ContinuousBounds,${r}>,
 previousPositions:array<vec4f,BODY_COUNT>, previousOrientations:array<vec4f,BODY_COUNT>,
 finalPositions:array<vec4f,BODY_COUNT>, finalOrientations:array<vec4f,BODY_COUNT>,
 candidates:array<ContinuousCandidate,CONTINUOUS_CAPACITY>
}
@group(0) @binding(15) var<storage,read_write> continuousWork:ContinuousWork;
@group(0) @binding(16) var<storage,read_write> continuousDispatch:array<atomic<u32>,4>;
struct ContinuousDistance { normal:vec3f, distance:f32, point:vec3f, complete:u32 }
fn continuousRotation(rotation:vec4f,angular:vec3f,time:f32)->vec4f {
 let speed=length(angular);if(speed<1e-12){return rotation;}
 let halfAngle=speed*time*0.5;
 return normalize(multiplyRotation(vec4f(angular*(sin(halfAngle)/speed),cos(halfAngle)),rotation));
}
fn continuousVelocity(body:u32)->vec3f {
 return select(velocities[body].xyz,vec3f(0),bodies.bodies[body].motion.x==0.0);
}
fn continuousAngular(body:u32)->vec3f {
 return select(angularVelocities[body].xyz,vec3f(0),bodies.bodies[body].motion.x==0.0);
}
fn continuousPointVelocity(body:u32,point:vec3f,time:f32)->vec3f {
 return continuousVelocity(body)+cross(continuousAngular(body),point-positions[body].xyz-continuousVelocity(body)*time);
}
fn continuousSupport(collider:u32,direction:vec3f,time:f32)->vec3f {
 let body=colliderBody(collider);
 let rotation=continuousRotation(orientations[body],continuousAngular(body),time);
 let colliderOrientation=multiplyRotation(rotation,bodies.colliders[collider].orientation);
 let localDirection=rotate(vec4f(-colliderOrientation.xyz,colliderOrientation.w),direction);
 let shape=bodies.colliders[collider].shape;
 let magnitude=length(localDirection);let unit=localDirection/max(magnitude,1e-20);
 var supportPoint=unit*shape.x;
 // Tied support faces use their center instead of an arbitrary torque-producing corner.
 if(shape.w==1.0){supportPoint=select(-shape.xyz,shape.xyz,localDirection>=vec3f(0));supportPoint=select(supportPoint,vec3f(0),localDirection==vec3f(0));}
 if(shape.w==4.0||shape.w==5.0){
  var bottom=unit*shape.x-vec3f(0,shape.z*0.5,0);var top=unit*shape.y+vec3f(0,shape.z*0.5,0);
  if(shape.w==5.0){
   let radial=length(localDirection.xz);let ring=localDirection.xz/max(radial,1e-20);
   bottom=vec3f(ring.x*shape.x,-shape.z*0.5,ring.y*shape.x);top=vec3f(ring.x*shape.y,shape.z*0.5,ring.y*shape.y);
  }
  let bottomProjection=dot(bottom,localDirection);let topProjection=dot(top,localDirection);
  supportPoint=select(bottom,top,topProjection>bottomProjection);
  if(topProjection==bottomProjection){supportPoint=(bottom+top)*0.5;}
 }
 ${n?`if(shape.w==2.0){
  supportPoint=localShapeSupport(collider,localDirection,-1);
  let projection=dot(supportPoint,localDirection);var total=vec3f(0);var count=0u;
  for(var vertex=0u;vertex<u32(bodies.colliders[collider].padding.y);vertex++){
   let point=meshVertex(collider,vertex);
   if(dot(point,localDirection)==projection){total+=point;count++;}
  }
  if(count>0u){supportPoint=total/f32(count);}
 }`:``}
 return positions[body].xyz+continuousVelocity(body)*time+rotate(rotation,bodies.colliders[collider].position.xyz)+rotate(colliderOrientation,supportPoint);
}
fn continuousVertex(first:u32,second:u32,direction:vec3f,time:f32,scale:f32)->SupportVertex {
 var vertex:SupportVertex;
 vertex.first=continuousSupport(first,direction,time);vertex.second=continuousSupport(second,-direction,time);
 vertex.difference=(vertex.first-vertex.second)/scale;return vertex;
}
// Closest-simplex distance with independently evaluated vertices, segments and faces.
// A support plane supplies a lower bound; its witness supplies an upper bound.
fn continuousDistance(first:u32,second:u32,time:f32,tolerance:f32)->ContinuousDistance {
 // Exact point-to-OBB distance avoids a near-contact smooth-support GJK degeneracy.
 let firstShape=bodies.colliders[first].shape;let secondShape=bodies.colliders[second].shape;
 if(firstShape.w==0.0&&secondShape.w==0.0){
  let firstBody=colliderBody(first);let secondBody=colliderBody(second);
  let firstCenter=positions[firstBody].xyz+continuousVelocity(firstBody)*time+rotate(continuousRotation(orientations[firstBody],continuousAngular(firstBody),time),bodies.colliders[first].position.xyz);
  let secondCenter=positions[secondBody].xyz+continuousVelocity(secondBody)*time+rotate(continuousRotation(orientations[secondBody],continuousAngular(secondBody),time),bodies.colliders[second].position.xyz);
  let offset=firstCenter-secondCenter;let magnitude=length(offset);let normal=offset/max(magnitude,1e-20);
  var exact:ContinuousDistance;exact.complete=1u;exact.distance=max(0.0,magnitude-firstShape.x-secondShape.x);exact.normal=normal;
  exact.point=(firstCenter-normal*firstShape.x+secondCenter+normal*secondShape.x)*0.5;return exact;
 }
 if(firstShape.w==1.0&&secondShape.w==1.0){
  let firstBody=colliderBody(first);let secondBody=colliderBody(second);
  let firstBodyRotation=continuousRotation(orientations[firstBody],continuousAngular(firstBody),time);
  let secondBodyRotation=continuousRotation(orientations[secondBody],continuousAngular(secondBody),time);
  let firstRotation=multiplyRotation(firstBodyRotation,bodies.colliders[first].orientation);
  let secondRotation=multiplyRotation(secondBodyRotation,bodies.colliders[second].orientation);
  let firstCenter=positions[firstBody].xyz+continuousVelocity(firstBody)*time+rotate(firstBodyRotation,bodies.colliders[first].position.xyz);
  let secondCenter=positions[secondBody].xyz+continuousVelocity(secondBody)*time+rotate(secondBodyRotation,bodies.colliders[second].position.xyz);
  var axes:array<vec3f,6>;
  for(var coordinate=0u;coordinate<3u;coordinate++){
   var unit=vec3f(0);unit[coordinate]=1.0;axes[coordinate]=rotate(firstRotation,unit);axes[coordinate+3u]=rotate(secondRotation,unit);
  }
  var separation= -1e30;var normal=vec3f(1,0,0);
  for(var index=0u;index<15u;index++){
   var direction=vec3f(0);
   if(index<6u){direction=axes[index];}else{let edge=index-6u;direction=cross(axes[edge/3u],axes[3u+edge%3u]);}
   let magnitude=length(direction);if(magnitude<1e-7){continue;}direction/=magnitude;
   var firstExtent=0.0;var secondExtent=0.0;
   for(var coordinate=0u;coordinate<3u;coordinate++){
    firstExtent+=abs(dot(direction,axes[coordinate]))*firstShape[coordinate];
    secondExtent+=abs(dot(direction,axes[coordinate+3u]))*secondShape[coordinate];
   }
   let projection=dot(firstCenter-secondCenter,direction);let gap=abs(projection)-firstExtent-secondExtent;
   if(gap>separation){separation=gap;normal=direction*select(-1.0,1.0,projection>=0.0);}
  }
  // The largest separating-axis gap is a conservative Euclidean distance bound.
  var bounds:ContinuousDistance;bounds.complete=1u;bounds.distance=max(0.0,separation);bounds.normal=normal;
  bounds.point=(continuousSupport(first,-normal,time)+continuousSupport(second,normal,time))*0.5;return bounds;
 }
 if((firstShape.w==0.0&&secondShape.w==1.0)||(firstShape.w==1.0&&secondShape.w==0.0)){
  let sphere=select(second,first,firstShape.w==0.0);let box=select(first,second,firstShape.w==0.0);
  let sphereBody=colliderBody(sphere);let boxBody=colliderBody(box);
  let sphereRotation=continuousRotation(orientations[sphereBody],continuousAngular(sphereBody),time);
  let boxBodyRotation=continuousRotation(orientations[boxBody],continuousAngular(boxBody),time);
  let boxRotation=multiplyRotation(boxBodyRotation,bodies.colliders[box].orientation);
  let center=positions[sphereBody].xyz+continuousVelocity(sphereBody)*time+rotate(sphereRotation,bodies.colliders[sphere].position.xyz);
  let boxCenter=positions[boxBody].xyz+continuousVelocity(boxBody)*time+rotate(boxBodyRotation,bodies.colliders[box].position.xyz);
  let localCenter=rotate(vec4f(-boxRotation.xyz,boxRotation.w),center-boxCenter);
  let closest=boxCenter+rotate(boxRotation,clamp(localCenter,-bodies.colliders[box].shape.xyz,bodies.colliders[box].shape.xyz));
  let offset=center-closest;let magnitude=length(offset);let radius=bodies.colliders[sphere].shape.x;
  var exact:ContinuousDistance;exact.complete=1u;exact.distance=max(0.0,magnitude-radius);
  let normal=offset/max(magnitude,1e-20);exact.normal=select(-normal,normal,firstShape.w==0.0);
  exact.point=(closest+center-normal*radius)*0.5;return exact;
 }
 let scale=max(1e-12,min(contactFeatureScale(first,-1),contactFeatureScale(second,-1)));
 let normalizedTolerance=tolerance/scale;
 var result:ContinuousDistance;
 var simplex:array<SupportVertex,4>;var count=1u;
 var direction=colliderPosition(second)-colliderPosition(first);
 if(length(direction)<1e-12){direction=vec3f(1,0,0);}
 simplex[0]=continuousVertex(first,second,direction,time,scale);
 var closest=simplex[0].difference;var witnessFirst=simplex[0].first;var witnessSecond=simplex[0].second;
 for(var iteration=0u;iteration<64u;iteration++){
  let magnitude=length(closest);
  if(magnitude<=normalizedTolerance){result.distance=0.0;result.point=(witnessFirst+witnessSecond)*0.5;result.complete=1u;return result;}
  let normal=closest/magnitude;
  let vertex=continuousVertex(first,second,-normal,time,scale);
  let lower=dot(normal,vertex.difference);
  if(magnitude-lower<=normalizedTolerance*0.25||(iteration>=8u&&lower>normalizedTolerance)){
   result.normal=normal;result.distance=max(0.0,lower)*scale;result.point=(witnessFirst+witnessSecond)*0.5;result.complete=1u;return result;
  }
  if(count>=4u){return result;}
  simplex[count]=vertex;count++;
  var best=1e30;var weights=vec4f(0);
  for(var corner=0u;corner<count;corner++){
   let squared=dot(simplex[corner].difference,simplex[corner].difference);
   if(squared<best){best=squared;weights=vec4f(0);weights[corner]=1.0;}
   for(var other=corner+1u;other<count;other++){
    let edge=simplex[other].difference-simplex[corner].difference;
    let fraction=clamp(-dot(simplex[corner].difference,edge)/max(dot(edge,edge),1e-30),0.0,1.0);
    let point=simplex[corner].difference+edge*fraction;let squaredEdge=dot(point,point);
    if(squaredEdge<best){best=squaredEdge;weights=vec4f(0);weights[corner]=1.0-fraction;weights[other]=fraction;}
    for(var third=other+1u;third<count;third++){
     let faceWeights=triangleWeights(vec3f(0),simplex[corner].difference,simplex[other].difference,simplex[third].difference);
     let point=faceWeights.x*simplex[corner].difference+faceWeights.y*simplex[other].difference+faceWeights.z*simplex[third].difference;
     let squaredFace=dot(point,point);
     if(squaredFace<best){best=squaredFace;weights=vec4f(0);weights[corner]=faceWeights.x;weights[other]=faceWeights.y;weights[third]=faceWeights.z;}
    }
   }
  }
  if(count==4u){
   let origin=simplex[0].difference;let firstEdge=simplex[1].difference-origin;let secondEdge=simplex[2].difference-origin;let thirdEdge=simplex[3].difference-origin;
   let determinant=dot(firstEdge,cross(secondEdge,thirdEdge));
   if(abs(determinant)>1e-25){
    let coordinates=vec3f(dot(-origin,cross(secondEdge,thirdEdge)),dot(firstEdge,cross(-origin,thirdEdge)),dot(firstEdge,cross(secondEdge,-origin)))/determinant;
    if(all(coordinates>=vec3f(0))&&coordinates.x+coordinates.y+coordinates.z<=1.0){
     let weights=vec4f(1.0-coordinates.x-coordinates.y-coordinates.z,coordinates);
     var firstPoint=vec3f(0);var secondPoint=vec3f(0);
     for(var corner=0u;corner<4u;corner++){firstPoint+=simplex[corner].first*weights[corner];secondPoint+=simplex[corner].second*weights[corner];}
     result.complete=1u;result.distance=0.0;result.point=(firstPoint+secondPoint)*0.5;return result;
    }
   }
  }
  closest=vec3f(0);witnessFirst=vec3f(0);witnessSecond=vec3f(0);var retained=0u;
  for(var corner=0u;corner<count;corner++){
   closest+=simplex[corner].difference*weights[corner];witnessFirst+=simplex[corner].first*weights[corner];witnessSecond+=simplex[corner].second*weights[corner];
   if(weights[corner]>0.0){simplex[retained]=simplex[corner];retained++;}
  }
  count=retained;
 }
 return result;
}
fn continuousRadius(collider:u32)->f32 {
 let shape=bodies.colliders[collider].shape;var radius=length(shape.xyz);
 if(shape.w==0.0){radius=shape.x;}
 if(shape.w==4.0){radius=max(shape.x,shape.y)+shape.z*0.5;}
 if(shape.w==5.0){radius=length(vec2f(max(shape.x,shape.y),shape.z*0.5));}
 return radius+length(bodies.colliders[collider].position.xyz);
}
@compute @workgroup_size(64) fn saveConvexContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}
 continuousWork.previousPositions[body]=positions[body];continuousWork.previousOrientations[body]=orientations[body];continuousStatus[body]=vec4u(0);
}
@compute @workgroup_size(64) fn prepareConvexContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}
 continuousWork.finalPositions[body]=positions[body];continuousWork.finalOrientations[body]=orientations[body];
 // Preserve discrete positional recovery while replaying the accepted velocity trajectory.
 positions[body]=vec4f(positions[body].xyz-continuousVelocity(body)*settings.gravity.w,positions[body].w);
 orientations[body]=continuousWork.previousOrientations[body];
 if(body==0u){continuousWork.remaining=settings.gravity.w;continuousWork.finished=0u;continuousWork.peakTests=0u;continuousWork.rounds=0u;continuousWork.lastPair=vec4u(0xffffffffu);}
}
@compute @workgroup_size(64) fn boundContinuousQueue(@builtin(global_invocation_id) invocation:vec3u){
 let collider=invocation.x;if(collider>=${r}u){return;}
 var bounds:ContinuousBounds;bounds.lower=vec4f(3.4e38);bounds.upper=vec4f(3.4e38);
 if(collider<COLLIDER_COUNT){
  let body=colliderBody(collider);let start=positions[body].xyz;
  let end=start+continuousVelocity(body)*continuousWork.remaining;let radius=vec3f(continuousRadius(collider));
  bounds.lower=vec4f(min(start,end)-radius,bitcast<f32>(collider));bounds.upper=vec4f(max(start,end)+radius,0);
 }
 continuousWork.bounds[collider]=bounds;
}
@compute @workgroup_size(1) fn resetContinuousQueue(){
 atomicStore(&continuousDispatch[0],0u);atomicStore(&continuousDispatch[1],1u);atomicStore(&continuousDispatch[2],1u);
 atomicStore(&continuousWork.count,0u);atomicStore(&continuousWork.overflow,0u);atomicStore(&continuousWork.tests,0u);
 var lower=vec3f(3.4e38);var upper=vec3f(-3.4e38);
 for(var index=0u;index<COLLIDER_COUNT;index++){
  let bounds=continuousWork.bounds[index];let center=bounds.lower.xyz*0.5+bounds.upper.xyz*0.5;
  lower=min(lower,center);upper=max(upper,center);
 }
 let extent=upper-lower;var coordinate=0u;
 if(extent.y>extent.x){coordinate=1u;}if(extent.z>extent[coordinate]){coordinate=2u;}continuousWork.axis=coordinate;
}
${Array.from({length:Math.log2(r)},(e,t)=>{let n=2**(t+1);return Array.from({length:t+1},(e,i)=>{let a=2**(t-i);return`@compute @workgroup_size(64) fn sortContinuous${n}_${a}(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;let partner=index^${a}u;if(index>=${r}u||partner<=index){return;}
 let first=continuousWork.bounds[index];let second=continuousWork.bounds[partner];let coordinate=continuousWork.axis;
 let greater=first.lower[coordinate]>second.lower[coordinate]||(first.lower[coordinate]==second.lower[coordinate]&&bitcast<u32>(first.lower.w)>bitcast<u32>(second.lower.w));
 if(greater==((index&${n}u)==0u)){continuousWork.bounds[index]=second;continuousWork.bounds[partner]=first;}
}`}).join(`
`)}).join(`
`)}
@compute @workgroup_size(64) fn buildContinuousQueue(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=COLLIDER_COUNT||continuousWork.finished!=0u){return;}
 let firstBounds=continuousWork.bounds[index];let originalFirst=bitcast<u32>(firstBounds.lower.w);
 for(var other=index+1u;other<COLLIDER_COUNT;other++){
  let secondBounds=continuousWork.bounds[other];
  if(secondBounds.lower[continuousWork.axis]>firstBounds.upper[continuousWork.axis]){break;}
  atomicAdd(&continuousWork.tests,1u);
  let originalSecond=bitcast<u32>(secondBounds.lower.w);let first=min(originalFirst,originalSecond);let second=max(originalFirst,originalSecond);
  let firstBody=colliderBody(first);let secondBody=colliderBody(second);
  if(firstBody==secondBody||(continuousSelection[firstBody]==0u&&continuousSelection[secondBody]==0u)||bodies.colliders[first].material.w!=0.0||bodies.colliders[second].material.w!=0.0||excludes(first,second)||excludes(second,first)){continue;}
  if(any(firstBounds.lower.xyz>secondBounds.upper.xyz)||any(secondBounds.lower.xyz>firstBounds.upper.xyz)){continue;}
  let slot=atomicAdd(&continuousWork.count,1u);
  if(slot>=CONTINUOUS_CAPACITY){atomicStore(&continuousWork.overflow,1u);continue;}
  continuousWork.candidates[slot].colliders=vec4u(first,second,0,0);
  atomicMax(&continuousDispatch[0],slot/64u+1u);
 }
}
// Lower bound on the fixed-plane gap rate over every material point.
// Including non-supporting box corners keeps the bound valid through feature changes.
fn continuousSupportRate(collider:u32,direction:vec3f,normal:vec3f,time:f32)->f32 {
 let body=colliderBody(collider);let angular=continuousAngular(body);
 let rotation=continuousRotation(orientations[body],angular,time);
 let colliderOrientation=multiplyRotation(rotation,bodies.colliders[collider].orientation);
 let offset=rotate(rotation,bodies.colliders[collider].position.xyz);
 let base=dot(continuousVelocity(body)+cross(angular,offset),normal);
 let shape=bodies.colliders[collider].shape;
 if(shape.w==0.0){return base;}
 if(shape.w==1.0){
  let coefficients=rotate(vec4f(-colliderOrientation.xyz,colliderOrientation.w),cross(normal,angular));
  let rate=base-dot(abs(coefficients),shape.xyz);
  return rate;
 }
 return dot(continuousVelocity(body),normal)-length(angular)*continuousRadius(collider);
}
fn continuousQuadraticLimit(available:f32,rate:f32,curvature:f32)->f32 {
 if(available<=0.0){return 0.0;}
 if(curvature>1e-20){let root=sqrt(rate*rate+2.0*curvature*available);return select(2.0*available/(root-rate),(root+rate)/curvature,rate>=0.0);}
 if(rate<0.0){return available/(-rate);}return 1e30;
}
fn continuousAdvance(first:u32,second:u32,normal:vec3f,time:f32,margin:f32)->f32 {
 let firstBody=colliderBody(first);let secondBody=colliderBody(second);
 let firstRadius=select(continuousRadius(first),length(bodies.colliders[first].position.xyz),bodies.colliders[first].shape.w==0.0);
 let secondRadius=select(continuousRadius(second),length(bodies.colliders[second].position.xyz),bodies.colliders[second].shape.w==0.0);
 let curvature=dot(continuousAngular(firstBody),continuousAngular(firstBody))*firstRadius+dot(continuousAngular(secondBody),continuousAngular(secondBody))*secondRadius;
 if(bodies.colliders[first].shape.w==1.0||bodies.colliders[second].shape.w==1.0){
  let box=select(second,first,bodies.colliders[first].shape.w==1.0);let other=select(first,second,box==first);
  let planeNormal=select(-normal,normal,box==first);let body=colliderBody(box);
  let rotation=continuousRotation(orientations[body],continuousAngular(body),time);
  let colliderOrientation=multiplyRotation(rotation,bodies.colliders[box].orientation);
  let center=positions[body].xyz+continuousVelocity(body)*time+rotate(rotation,bodies.colliders[box].position.xyz);
  let otherPoint=continuousSupport(other,planeNormal,time);
  let otherRate=continuousSupportRate(other,planeNormal,-planeNormal,time);
  var limit=1e30;
  // Each corner carries its own initial gap and rate. Taking their minimum stays
  // conservative through face changes without combining one corner's small gap
  // with a different, distant corner's worst angular velocity.
  for(var corner=0u;corner<8u;corner++){
   let signs=vec3f(select(-1.0,1.0,(corner&1u)!=0u),select(-1.0,1.0,(corner&2u)!=0u),select(-1.0,1.0,(corner&4u)!=0u));
   let point=center+rotate(colliderOrientation,signs*bodies.colliders[box].shape.xyz);
   let gap=dot(point-otherPoint,planeNormal)-margin;
   let rate=dot(continuousPointVelocity(body,point,time),planeNormal)+otherRate;
   limit=min(limit,continuousQuadraticLimit(gap,rate,curvature));
  }
  return limit;
 }
 let gap=dot(continuousSupport(first,-normal,time)-continuousSupport(second,normal,time),normal)-margin;
 let rate=continuousSupportRate(first,-normal,normal,time)+continuousSupportRate(second,normal,-normal,time);
 return continuousQuadraticLimit(gap,rate,curvature);
}
@compute @workgroup_size(64) fn findContinuousImpacts(@builtin(global_invocation_id) invocation:vec3u){
 let slot=invocation.x;if(slot>=min(atomicLoad(&continuousWork.count),CONTINUOUS_CAPACITY)||continuousWork.finished!=0u){return;}
 let pair=continuousWork.candidates[slot].colliders.xy;let first=pair.x;let second=pair.y;
 let firstBody=colliderBody(first);let secondBody=colliderBody(second);
 let relative=continuousVelocity(firstBody)-continuousVelocity(secondBody);
 // A centered sphere is rotationally invariant; spin alone must not inflate TOI work.
 let firstAngularRadius=select(continuousRadius(first),length(bodies.colliders[first].position.xyz),bodies.colliders[first].shape.w==0.0);
 let secondAngularRadius=select(continuousRadius(second),length(bodies.colliders[second].position.xyz),bodies.colliders[second].shape.w==0.0);
 let angularBound=length(continuousAngular(firstBody))*firstAngularRadius+length(continuousAngular(secondBody))*secondAngularRadius;
 let coordinate=max(length(positions[firstBody].xyz),length(positions[secondBody].xyz));
 let tolerance=max(max(1e-7,coordinate*8e-7),min(1e-5,min(contactFeatureScale(first,-1),contactFeatureScale(second,-1))*1e-4));
 let contactEnvelope=tolerance*8.0;
 var time=0.0;var lastNormal=vec3f(0);var complete=false;var leavingContact=false;var exitNormal=vec3f(0);
 for(var iteration=0u;iteration<128u;iteration++){
  var distance=continuousDistance(first,second,time,tolerance);
  if(time==0.0&&length(distance.normal)<0.5&&all(continuousWork.lastPair.xy==pair)){
   // The immediately preceding impulse owns a qualified plane at this unchanged pose.
   distance.normal=continuousWork.lastNormal.xyz;
  }
  if(distance.complete==0u){break;}
  if(time==0.0&&distance.distance<=contactEnvelope){
   // A fresh closing contact can be caused by another simultaneous impact.
   let normal=distance.normal;var closing=false;
   // A different impact may have driven an initially touching generic simplex closed.
   // Without a qualified plane, never silently call that pair separating.
   if(length(normal)<0.5&&continuousWork.rounds>0u){break;}
   if(length(normal)>0.5){closing=dot(pointVelocity(firstBody,distance.point)-pointVelocity(secondBody,distance.point),normal)< -1e-5;}
   if(closing){lastNormal=normal;}else{
    // Fixed-orientation separating convex trajectories cannot re-enter until another impact.
    if(angularBound<=1e-8){complete=true;break;}
    leavingContact=true;exitNormal=normal;
   }
  }
  if(leavingContact){
   if(length(distance.normal)>0.5){
    // Refresh the separating plane as the obstacle rotates. An old plane can cut
    // through disjoint shapes and must not be mistaken for actual penetration.
    exitNormal=distance.normal;
    let speed=dot(continuousPointVelocity(firstBody,distance.point,time)-continuousPointVelocity(secondBody,distance.point,time),exitNormal);
    if(time>0.0&&distance.distance<=contactEnvelope&&speed< -1e-5){
     continuousWork.candidates[slot].colliders.z=1u;
     continuousWork.candidates[slot].point=vec4f(distance.point,time);
     continuousWork.candidates[slot].normal=vec4f(exitNormal,contactEnvelope);complete=true;break;
    }
   }
   if(distance.distance>contactEnvelope){leavingContact=false;}else{
    // Bound fixed-plane curvature rather than sampling at velocity-sized intervals.
    // Every support-point trajectory stays above this quadratic lower envelope.
    var increment=contactEnvelope*0.5/max(length(relative)+angularBound,1e-20);
    if(length(exitNormal)>0.5){
     increment=continuousAdvance(first,second,exitNormal,time,-contactEnvelope);
     if(increment<=0.0){break;}
    }
    if(time+increment>=continuousWork.remaining){
     // The entire remaining interval is certified within the contact envelope.
     complete=true;break;
    }
    time+=increment;continue;
   }
  }
  if(distance.distance<=contactEnvelope){
   continuousWork.candidates[slot].colliders.z=1u;
   continuousWork.candidates[slot].point=vec4f(distance.point,time);
   continuousWork.candidates[slot].normal=vec4f(lastNormal,contactEnvelope);complete=true;break;
  }
  lastNormal=distance.normal;
  let increment=continuousAdvance(first,second,distance.normal,time,contactEnvelope*0.5);
  if(time+increment>continuousWork.remaining){complete=true;break;}
  if(increment<=max(1e-12,continuousWork.remaining*1e-8)){break;}
  time+=increment;
 }
 if(!complete){continuousWork.candidates[slot].colliders.z=2u;}
}
fn continuousBoxShell(collider:u32,point:vec3f,tolerance:f32)->bool {
 return all(abs(colliderLocal(collider,point-colliderPosition(collider)))<=bodies.colliders[collider].shape.xyz+vec3f(tolerance));
}
fn continuousImpactPoint(first:u32,second:u32,point:vec3f,normal:vec3f,queryTolerance:f32)->vec4f {
 if(bodies.colliders[first].shape.w!=1.0||bodies.colliders[second].shape.w!=1.0){return vec4f(point,1);}
 let tolerance=max(queryTolerance*2.0,max(1e-5,max(length(colliderPosition(first)),length(colliderPosition(second)))*2e-6));
 var reference=first;var faceAxis=0u;var maximumAlignment=0.0;
 for(var side=0u;side<2u;side++){
  let collider=select(first,second,side==1u);
  for(var coordinate=0u;coordinate<3u;coordinate++){
   let alignment=abs(dot(axis(collider,coordinate),normal));
   if(alignment>maximumAlignment){maximumAlignment=alignment;reference=collider;faceAxis=coordinate;}
  }
 }
 if(maximumAlignment>0.99999){
  // Preserve the exact authored center when an entire support face is contained.
  // Averaging translated world corners can otherwise create a tiny artificial torque.
  var contained=vec4f(0);var smallestArea=1e30;
  for(var side=0u;side<2u;side++){
   let collider=select(first,second,side==1u);let other=select(second,first,side==1u);
   let direction=select(-normal,normal,side==1u);
   for(var coordinate=0u;coordinate<3u;coordinate++){
    let faceDirection=axis(collider,coordinate);if(abs(dot(faceDirection,direction))<0.99999){continue;}
    let faceCenter=colliderPosition(collider)+faceDirection*bodies.colliders[collider].shape[coordinate]*select(-1.0,1.0,dot(faceDirection,direction)>=0.0);
    let firstTangent=axis(collider,(coordinate+1u)%3u)*bodies.colliders[collider].shape[(coordinate+1u)%3u];
    let secondTangent=axis(collider,(coordinate+2u)%3u)*bodies.colliders[collider].shape[(coordinate+2u)%3u];
    let area=length(firstTangent)*length(secondTangent);
    if(area<smallestArea&&continuousBoxShell(other,faceCenter-firstTangent-secondTangent,tolerance)&&continuousBoxShell(other,faceCenter+firstTangent-secondTangent,tolerance)&&continuousBoxShell(other,faceCenter+firstTangent+secondTangent,tolerance)&&continuousBoxShell(other,faceCenter-firstTangent+secondTangent,tolerance)){
     contained=vec4f(faceCenter,1);smallestArea=area;
    }
   }
  }
  if(contained.w>0.0){return contained;}
  let incident=select(first,second,reference==first);
  let direction=select(-normal,normal,reference==second);
  let referenceNormal=axis(reference,faceAxis)*select(-1.0,1.0,dot(axis(reference,faceAxis),direction)>=0.0);
  let referenceCenter=colliderPosition(reference)+referenceNormal*bodies.colliders[reference].shape[faceAxis];
  let contactPatch=clipBoxContact(reference,incident,faceAxis,referenceNormal,tolerance);
  var total=vec3f(0);var count=0u;
  for(var index=0u;index<contactPatch.count;index++){
   let separation=dot(referenceCenter-contactPatch.points[index],referenceNormal);
   if(abs(separation)<=tolerance*4.0){total+=contactPatch.points[index]+referenceNormal*separation*0.5;count++;}
  }
  if(count>0u){
   let centroid=total/f32(count);
   if(continuousBoxShell(first,centroid,tolerance*4.0)&&continuousBoxShell(second,centroid,tolerance*4.0)){return vec4f(centroid,1);}
  }
  // No valid clipped witness is a failed query, never permission to use an off-surface point.
  return vec4f(0);
 }
 // Edge/edge SAT axes use closest points on the actual supporting finite segments.
 var firstAxis=0u;var secondAxis=0u;var maximumCrossAlignment=0.0;
 for(var horizontal=0u;horizontal<3u;horizontal++){
  for(var vertical=0u;vertical<3u;vertical++){
   let direction=cross(axis(first,horizontal),axis(second,vertical));let magnitude=length(direction);
   if(magnitude>1e-7){let alignment=abs(dot(direction/magnitude,normal));if(alignment>maximumCrossAlignment){maximumCrossAlignment=alignment;firstAxis=horizontal;secondAxis=vertical;}}
  }
 }
 if(maximumCrossAlignment<0.99999){return vec4f(0);}
 let firstDirection=axis(first,firstAxis);let secondDirection=axis(second,secondAxis);
 var firstCenter=continuousSupport(first,-normal,0.0);var secondCenter=continuousSupport(second,normal,0.0);
 firstCenter-=firstDirection*dot(firstCenter-colliderPosition(first),firstDirection);
 secondCenter-=secondDirection*dot(secondCenter-colliderPosition(second),secondDirection);
 let delta=firstCenter-secondCenter;let alignment=dot(firstDirection,secondDirection);let denominator=1.0-alignment*alignment;
 if(denominator<=1e-12){return vec4f(0);}
 var firstDistance=clamp((alignment*dot(secondDirection,delta)-dot(firstDirection,delta))/denominator,-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
 let secondDistance=clamp(dot(secondDirection,delta)+alignment*firstDistance,-bodies.colliders[second].shape[secondAxis],bodies.colliders[second].shape[secondAxis]);
 firstDistance=clamp(alignment*secondDistance-dot(firstDirection,delta),-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
 let witness=(firstCenter+firstDirection*firstDistance+secondCenter+secondDirection*secondDistance)*0.5;
 if(continuousBoxShell(first,witness,tolerance*4.0)&&continuousBoxShell(second,witness,tolerance*4.0)){return vec4f(witness,1);}
 return vec4f(0);
}
@compute @workgroup_size(1) fn resolveConvexContinuous(){
 if(continuousWork.finished!=0u){return;}
 continuousWork.peakTests=max(continuousWork.peakTests,atomicLoad(&continuousWork.tests));continuousWork.rounds++;
 continuousStatus[0].w=max(continuousStatus[0].w,atomicLoad(&continuousWork.count));
 if(atomicLoad(&continuousWork.overflow)!=0u){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 var nearest=continuousWork.remaining;var selected=0xffffffffu;
 // Deterministic ownership even though queue reservations are parallel.
 var selectedPair=vec2u(0xffffffffu);
 for(var slot=0u;slot<min(atomicLoad(&continuousWork.count),CONTINUOUS_CAPACITY);slot++){
  let candidate=continuousWork.candidates[slot];
  if(candidate.colliders.z==2u){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
  let pair=candidate.colliders.xy;
  let precedes=pair.x<selectedPair.x||(pair.x==selectedPair.x&&pair.y<selectedPair.y);
  if(candidate.colliders.z==1u&&(candidate.point.w<nearest||(candidate.point.w==nearest&&precedes))){nearest=candidate.point.w;selected=slot;selectedPair=pair;}
 }
 if(selected!=0xffffffffu&&continuousStatus[0].z>=${t}u){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 if(selected!=0xffffffffu){continuousStatus[0].z++;}
 for(var body=0u;body<BODY_COUNT;body++){
  positions[body]=vec4f(positions[body].xyz+continuousVelocity(body)*nearest,positions[body].w);
  orientations[body]=continuousRotation(orientations[body],continuousAngular(body),nearest);
 }
 continuousWork.remaining-=nearest;
 if(selected==0xffffffffu){continuousWork.finished=1u;return;}
 let candidate=continuousWork.candidates[selected];let firstCollider=candidate.colliders.x;let secondCollider=candidate.colliders.y;
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);let normal=candidate.normal.xyz;let witness=continuousImpactPoint(firstCollider,secondCollider,candidate.point.xyz,normal,candidate.normal.w);
 if(witness.w==0.0){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 let point=witness.xyz;
 let closing=dot(pointVelocity(first,point)-pointVelocity(second,point),normal);
 let response=effectiveMass(first,second,point,normal);
 if(response<=1e-20||length(normal)<0.5){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 let restitution=select(0.0,combineMaterial(bodies.colliders[firstCollider].material.x,bodies.colliders[secondCollider].material.x,bodies.colliders[firstCollider].policies.x,bodies.colliders[secondCollider].policies.x,false),-closing>settings.solver.z);
 var contact:Contact;contact.point=vec4f(point,0);contact.normal=vec4f(-normal,0);
 // Apply restitution once. Restoring its velocity target after friction can inject energy.
 contact.impulse.x=max(0.0,-closing)*(1.0+restitution)/response;
 let reboundImpulse=normal*contact.impulse.x;
 applyImpulse(first,point,reboundImpulse);applyImpulse(second,point,-reboundImpulse);
 for(var iteration=0u;iteration<16u;iteration++){
  let speed=dot(pointVelocity(first,point)-pointVelocity(second,point),normal);
  let normalIncrement=normal*(max(0.0,-speed)/response);
  contact.impulse.x+=length(normalIncrement);
  applyImpulse(first,point,normalIncrement);applyImpulse(second,point,-normalIncrement);
  let relative=pointVelocity(second,point)-pointVelocity(first,point);
  let tangent=solveFriction(firstCollider,secondCollider,contact,relative);
  var tangentIncrement=tangent-contact.tangent.xyz;
  // Minimize contact work along the candidate increment; never accept positive friction work.
  let slope=dot(relative,tangentIncrement);
  let curvature=dot(tangentIncrement,impulseResponse(first,second,point,tangentIncrement));
  if(slope>=0.0){tangentIncrement=vec3f(0);}else if(curvature>0.0){tangentIncrement*=min(1.0,-slope/curvature);}
  contact.tangent=vec4f(contact.tangent.xyz+tangentIncrement,0);
  applyImpulse(first,point,-tangentIncrement);applyImpulse(second,point,tangentIncrement);
  if(all(normalIncrement==vec3f(0))&&all(tangentIncrement==vec3f(0))){break;}
 }
 let residual=dot(pointVelocity(first,point)-pointVelocity(second,point),normal);
 if(residual<0.0){
  // This only increases the normal impulse, so the retained tangent stays inside its friction cone.
  let correction=normal*(-residual/response);
  applyImpulse(first,point,correction);applyImpulse(second,point,-correction);
 }
 if(dynamic(first)){sleepStates[first]=vec4f(0);}
 if(dynamic(second)){sleepStates[second]=vec4f(0);}
 continuousWork.lastPair=vec4u(firstCollider,secondCollider,0,0);continuousWork.lastNormal=vec4f(normal,0);
 continuousStatus[first].y++;continuousStatus[second].y++;
}
@compute @workgroup_size(64) fn checkConvexContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}
 if(body==0u&&continuousWork.finished==0u&&continuousWork.remaining>1e-9){continuousStatus[0].x=1u;}
 // CCD must not perturb unrelated discrete contacts, kinematic targets or torque-free integration.
 if(continuousStatus[body].y==0u||!dynamic(body)){
  positions[body]=continuousWork.finalPositions[body];orientations[body]=continuousWork.finalOrientations[body];
 }
}
`}function gl(e,t,n,r,i,a,s,c,l=!1,u=0,d=r,f=!1,p=!1){if(u)return _l(e,t,f?n:n+ml,r,i,a,s,c,u,d,p);let m=c(`continuous-previous`,r*16),h=c(`continuous-selection`,i),g=c(`continuous-status`,r*16),_=[{name:`continuousPrevious`,buffer:m,location:12},{name:`continuousSelection`,buffer:h,location:13},{name:`continuousStatus`,buffer:g,location:14}].map(n=>({...n,resource:e.importBuffer({id:`${t}-${n.name}`,byteLength:n.buffer.byteLength,usage:o.STORAGE},n.buffer)})),v=n+pl+`
@group(0) @binding(12) var<storage,read_write> continuousPrevious:array<vec4f>;
@group(0) @binding(13) var<storage,read> continuousSelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> continuousStatus:array<vec4u>;
@compute @workgroup_size(64) fn saveContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}continuousPrevious[body]=positions[body];continuousStatus[body]=vec4u(0);
}
@compute @workgroup_size(64) fn resolveContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT||continuousSelection[body]==0u){return;}
 let movingCollider=continuousSelection[body]-1u;let radius=bodies.colliders[movingCollider].shape.x;
 let tolerance=max(1e-8,radius*1e-5);
 var position=continuousPrevious[body].xyz;var motion=positions[body].xyz-position;var velocity=velocities[body].xyz;var remaining=settings.gravity.w;
 for(var impact=0u;impact<=${a}u;impact++){
  let magnitude=length(motion);if(magnitude<=1e-8){positions[body]=vec4f(position,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  var nearest=magnitude;var hitCollider=0xffffffffu;var hitNormal=vec3f(0);
  for(var collider=0u;collider<COLLIDER_COUNT;collider++){
   if(bodies.bodies[colliderBody(collider)].motion.x!=0.0||bodies.colliders[collider].material.w!=0.0||excludes(movingCollider,collider)||excludes(collider,movingCollider)){continue;}
   // Initial penetration belongs to the discrete solver; still sweep other obstacles.
   let initialOrigin=colliderLocal(collider,continuousPrevious[body].xyz-colliderPosition(collider));
   let initialSurface=closestSurface(collider,initialOrigin);
   if(initialSurface.complete==0u){continuousStatus[body].x=1u;return;}
   if(initialSurface.distance<radius-tolerance){continue;}
   let origin=colliderLocal(collider,position-colliderPosition(collider));let direction=colliderLocal(collider,motion/magnitude);
   let result=sweepSphere(collider,origin,direction,magnitude,radius,true);
   if(result.complete==0u){continuousStatus[body].x=1u;return;}
   if(result.hit==0u){continue;}
   let normal=rotate(colliderRotation(collider),result.normal);
   // Touching and separating bodies must not repeatedly collide at time zero.
   if(result.distance<=tolerance&&dot(motion,normal)>=0.0&&length(normal)>0.5){continue;}
   if(length(normal)<0.5){continuousStatus[body].x=1u;return;}
   if(result.distance<=nearest){nearest=result.distance;hitCollider=collider;hitNormal=normal;}
  }
  if(hitCollider==0xffffffffu){positions[body]=vec4f(position+motion,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  if(impact==${a}u){continuousStatus[body].x=1u;return;}
  position+=motion*(nearest/magnitude)+hitNormal*tolerance;
  remaining*=max(0.0,1.0-nearest/magnitude);
  let closing=dot(velocity,hitNormal);
  let restitution=select(0.0,combineMaterial(bodies.colliders[movingCollider].material.x,bodies.colliders[hitCollider].material.x,bodies.colliders[movingCollider].policies.x,bodies.colliders[hitCollider].policies.x,false),-closing>settings.solver.z);
  if(closing<0.0){velocity-=hitNormal*closing*(1.0+restitution);}
  continuousStatus[body].y++;
  motion=velocity*remaining;
  if(remaining<=1e-8){positions[body]=vec4f(position,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
 }
 // The complete step is rejected by the transactional wrapper when the impact budget ends.
 continuousStatus[body].x=1u;
}
`,y=(n,i)=>{let a=[...s,..._].filter(e=>i.includes(e.name)),o={id:`${t}-${n}`,source:v,entryPoint:n,shaderLayout:{bindings:a.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:[`bodies`,`continuousSelection`].includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(a.map(e=>[e.name,e.buffer]))},c=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(r/64)})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:o.id,resources:a.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:[`bodies`,`continuousSelection`].includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>c(V(e.device,o)),compileAsync:async()=>c(await H(e.device,o))})};return y(`saveContinuous`,[`positions`,`continuousPrevious`,`continuousStatus`]),{status:{buffer:g,resource:_[2].resource},finish:()=>y(`resolveContinuous`,[`settings`,`positions`,`orientations`,`velocities`,`bodies`,`continuousPrevious`,`continuousSelection`,`continuousStatus`,...l?[`targets`]:[]])}}function _l(e,t,n,r,i,a,s,c,l,u,d){let f=2**Math.ceil(Math.log2(Math.max(1,u))),p=[{name:`continuousSelection`,buffer:c(`continuous-selection`,i),location:13},{name:`continuousStatus`,buffer:c(`continuous-status`,r*16),location:14},{name:`continuousWork`,buffer:c(`continuous-work`,64+f*32+r*64+l*48),location:15},{name:`continuousDispatch`,buffer:c(`continuous-dispatch`,16),location:16}].map(n=>({...n,resource:e.importBuffer({id:`${t}-${n.name}`,byteLength:n.buffer.byteLength,usage:o.STORAGE|(n.name===`continuousDispatch`?o.INDIRECT:0)},n.buffer)})),m=n+`
@group(0) @binding(13) var<storage,read> continuousSelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> continuousStatus:array<vec4u>;
`+hl(l,a,d,f),h=(n,i,o)=>{let c=[...s,...p].filter(e=>o.includes(e.name)),l={saveConvexContinuous:[`positions`,`orientations`,`continuousWork`,`continuousStatus`],prepareConvexContinuous:[`settings`,`positions`,`orientations`,`velocities`,`bodies`,`continuousWork`],boundContinuousQueue:[`positions`,`velocities`,`bodies`,`continuousWork`],resetContinuousQueue:[`continuousWork`,`continuousDispatch`],buildContinuousQueue:[`bodies`,`continuousSelection`,`continuousWork`,`continuousDispatch`],findContinuousImpacts:[`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`continuousWork`],resolveConvexContinuous:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`continuousWork`,`continuousStatus`],checkConvexContinuous:[`positions`,`orientations`,`bodies`,`continuousWork`,`continuousStatus`]},u=e=>{let n=c.filter(t=>(l[e]??[`continuousWork`]).includes(t.name));return{id:`${t}-${e}`,source:m,entryPoint:e,shaderLayout:{bindings:n.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:[`bodies`,`continuousSelection`].includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(n.map(e=>[e.name,e.buffer]))}},d=e=>({encode:({computePass:t})=>{if(n===`resolve`){e[0].kernel.dispatch(t,{bindings:e[0].bindings,x:Math.ceil(r/64)});for(let n=0;n<=a;n++)for(let n=1;n<e.length-1;n++)i[n].entryPoint===`findContinuousImpacts`?e[n].kernel.dispatchIndirect(t,{bindings:e[n].bindings,indirectBuffer:p[3].buffer,indirectOffset:0}):e[n].kernel.dispatch(t,{bindings:e[n].bindings,x:i[n].groups});e[e.length-1].kernel.dispatch(t,{bindings:e[e.length-1].bindings,x:Math.ceil(r/64)})}else e[0].kernel.dispatch(t,{bindings:e[0].bindings,x:Math.ceil(r/64)})},destroy:()=>e.forEach(e=>e.kernel.destroy())});e.addComputePass({id:`${t}-${n}-convex-continuous`,description:n===`save`?`Checkpoint convex CCD trajectories.`:`Rebuild bounded swept queues, find TOIs in parallel and resolve impacts with exclusive ownership.`,resources:[...n===`resolve`?[{buffer:p[3].resource,usage:`indirect`}]:[],...c.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:[`bodies`,`continuousSelection`].includes(e.name)?`storage-read`:`storage-read-write`}))],compile:()=>d(i.map(t=>V(e.device,u(t.entryPoint)))),compileAsync:async()=>d(await Promise.all(i.map(t=>H(e.device,u(t.entryPoint)))))})};return h(`save`,[{entryPoint:`saveConvexContinuous`,groups:Math.ceil(r/64)}],[`positions`,`orientations`,`continuousWork`,`continuousStatus`]),{status:{buffer:p[1].buffer,resource:p[1].resource},finish:()=>h(`resolve`,[{entryPoint:`prepareConvexContinuous`,groups:Math.ceil(r/64)},{entryPoint:`boundContinuousQueue`,groups:Math.ceil(f/64)},{entryPoint:`resetContinuousQueue`,groups:1},...Array.from({length:Math.log2(f)},(e,t)=>Array.from({length:t+1},(e,n)=>({entryPoint:`sortContinuous${2**(t+1)}_${2**(t-n)}`,groups:Math.ceil(f/64)}))).flat(),{entryPoint:`buildContinuousQueue`,groups:Math.ceil(u/64)},{entryPoint:`findContinuousImpacts`,groups:Math.ceil(l/64)},{entryPoint:`resolveConvexContinuous`,groups:1},{entryPoint:`checkConvexContinuous`,groups:1}],[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`bodies`,`continuousWork`,`continuousSelection`,`continuousStatus`,`continuousDispatch`])}}function vl(e,t){let n=[],r=[];for(let[i,a]of e.entries()){let e=[...new Set(a.colliders)];if(!e.length||e.some(e=>!Number.isInteger(e)||!t[e]?.isTrigger||a.swept&&t[e].shape.type!==`sphere`))throw Error(`Invalid sensor colliders or swept trigger shapes`);let o=[...new Set(a.targets??t.flatMap((e,t)=>e.isTrigger?[]:[t]))];if(o.some(e=>!Number.isInteger(e)||!t[e]||a.swept&&t[e].shape.type!==`sphere`))throw Error(`Invalid trigger targets`);let s=new Set((a.excludedPairs??[]).map(([t,n])=>{if(!e.includes(t)||!o.includes(n))throw Error(`Invalid excluded trigger pair`);return`${t}:${n}`})),c=a.perCollider?o.map(e=>[e]):[...new Set(o.map(e=>t[e].body))].map(e=>o.filter(n=>t[n].body===e));for(let o of c){let c=t[o[0]].body,l=r.length/2;for(let n of e)for(let e of o)t[e].body===c&&t[n].body!==c&&!s.has(`${n}:${e}`)&&r.push(n,e);let u=r.length/2-l;u&&n.push(i,c,l,u|(a.swept?2147483648:0))}}if(n.length/4>65536||r.length/2>65536)throw Error(`Trigger pair capacity exceeded`);return{groups:new Uint32Array(n.length?n:[0,0,0,0]),pairs:new Uint32Array(r.length?r:[0,0]),count:n.length/4}}function yl(e,t=0){let n=(e.length-4)/8,r=e[0],i=[];for(let a=Math.max(t,r-n);a<r;a++){let t=4+a%n*8;i.push({sequence:e[t],step:e[t+1],phase:e[t+2]===0?`enter`:`exit`,swept:e[t+3]!==0,trigger:e[t+4],body:e[t+5],triggerCollider:e[t+6],collider:e[t+7]})}return{sequence:r,step:e[1],dropped:Math.max(0,r-t-n),saturated:e[2]!==0,events:i}}function bl(e,t,n,r,i,a,s,c,l,u=!1,d=!1){let f=[{name:`triggerPrevious`,key:`trigger-previous`,data:r*16},{name:`triggerGroups`,key:`trigger-groups`,data:i.groups},{name:`triggerPairs`,key:`trigger-pairs`,data:i.pairs},{name:`triggerSamples`,key:`trigger-samples`,data:Math.max(1,i.count)*16},{name:`triggerHistory`,key:`trigger-history`,data:Math.max(1,i.count)*16},{name:`triggerEvents`,key:`trigger-events`,data:16+a*32}].map((n,r)=>{let i=l(n.key,n.data);return{name:n.name,buffer:i,location:12+r,resource:e.importBuffer({id:`${t}-${n.key}`,byteLength:i.byteLength,usage:o.STORAGE},i)}}),p=n+pl+`
@group(0) @binding(12) var<storage,read_write> triggerPrevious:array<vec4f>;
@group(0) @binding(13) var<storage,read> triggerGroups:array<vec4u>;
@group(0) @binding(14) var<storage,read> triggerPairs:array<vec2u>;
@group(0) @binding(15) var<storage,read_write> triggerSamples:array<vec4u>;
@group(0) @binding(16) var<storage,read_write> triggerHistory:array<vec4u>;
struct TriggerRecord {stamp:vec4u,identifiers:vec4u}
struct TriggerRing {sequence:u32,step:u32,saturated:u32,reserved:u32,entries:array<TriggerRecord,${a}>}
@group(0) @binding(17) var<storage,read_write> triggerEvents:TriggerRing;
@group(0) @binding(18) var<storage,read> triggerStatistics:array<u32>;
@compute @workgroup_size(64) fn saveTriggers(@builtin(global_invocation_id) invocation:vec3u){let collider=invocation.x;if(collider<COLLIDER_COUNT){triggerPrevious[collider]=vec4f(colliderPosition(collider),0);}}
@compute @workgroup_size(64) fn sampleTriggers(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=${i.count}u){return;}let group=triggerGroups[index];var overlapping=false;var crossed=false;var incomplete=false;var selected=vec2u(0);
 for(var offset=0u;offset<(group.w&0x7fffffffu);offset++){
  let pair=triggerPairs[group.z+offset];if(excludes(pair.x,pair.y)||excludes(pair.y,pair.x)){continue;}
  let radius=bodies.colliders[pair.x].shape.x;
  // Sphere-vs-surface distance is symmetric: avoid GJK/EPA degeneracy when the sphere is the target.
  if(bodies.colliders[pair.x].shape.w==0.0||bodies.colliders[pair.y].shape.w==0.0){
  let sphere=select(pair.y,pair.x,bodies.colliders[pair.x].shape.w==0.0);
  let surfaceCollider=select(pair.x,pair.y,sphere==pair.x);
  let center=colliderLocal(surfaceCollider,colliderPosition(sphere)-colliderPosition(surfaceCollider));
  let targetShape=bodies.colliders[surfaceCollider].shape;if(targetShape.w==6.0&&targetShape.z==0.0&&center.y<0.0){continue;}
  let surface=closestSurface(surfaceCollider,center);
  incomplete=incomplete||surface.complete==0u;
  if(surface.distance<=bodies.colliders[sphere].shape.x){overlapping=true;selected=pair;}
  }${d?`else {
    let firstMesh=bodies.colliders[pair.x].shape.w==3.0;let secondMesh=bodies.colliders[pair.y].shape.w==3.0;
    let firstCount=select(1u,u32(bodies.colliders[pair.x].padding.w),firstMesh);
    let secondCount=select(1u,u32(bodies.colliders[pair.y].padding.w),secondMesh);
    var tested=0u;var found=false;
    for(var firstTriangle=0u;firstTriangle<firstCount&&!found;firstTriangle++){
      for(var secondTriangle=0u;secondTriangle<secondCount;secondTriangle++){
        if(tested>=MESH_TRAVERSAL_BUDGET){incomplete=true;break;}tested++;
        if(!permitsPlaneContact(pair.x,pair.y)||!permitsPlaneContact(pair.y,pair.x)){continue;}
        let hit=convexContact(pair.x,pair.y,select(-1,i32(firstTriangle),firstMesh),select(-1,i32(secondTriangle),secondMesh));
        incomplete=incomplete||hit.status==2u;
        if(hit.status==1u&&hit.depth>=0.0){overlapping=true;selected=pair;found=true;break;}
      }
      if(tested>=MESH_TRAVERSAL_BUDGET){break;}
    }
  }`:``}
  if((group.w&0x80000000u)!=0u){
   let start=triggerPrevious[pair.y].xyz-triggerPrevious[pair.x].xyz;
   let finish=colliderPosition(pair.y)-colliderPosition(pair.x);
   let distance=length(closestSegment(vec3f(0),start,finish));
   if(distance<=radius+bodies.colliders[pair.y].shape.x){crossed=true;if(!overlapping){selected=pair;}}
  }
 }
 triggerSamples[index]=vec4u(select(0u,1u,overlapping)|select(0u,2u,crossed)|select(0u,4u,incomplete),selected,0u);
}
fn emitTrigger(group:vec4u,pair:vec2u,phase:u32,swept:u32){
 if(triggerEvents.sequence==0xffffffffu){triggerEvents.saturated=1u;return;}
 let slot=triggerEvents.sequence%${a}u;triggerEvents.sequence++;
 triggerEvents.entries[slot]=TriggerRecord(vec4u(triggerEvents.sequence,triggerEvents.step,phase,swept),vec4u(group.x,group.y,pair));
}
@compute @workgroup_size(1) fn publishTriggers(){
 if(triggerStatistics[1]!=0u||triggerStatistics[15]!=0u){return;}
 if(triggerEvents.step==0xffffffffu){triggerEvents.saturated=1u;return;}triggerEvents.step++;
 for(var index=0u;index<${i.count}u;index++){
  let sample=triggerSamples[index];let previous=triggerHistory[index];let group=triggerGroups[index];
  let overlapping=(sample.x&1u)!=0u;let prior=(previous.x&1u)!=0u;
  if(overlapping&&!prior){emitTrigger(group,sample.yz,0u,0u);}
  if(!overlapping&&prior){emitTrigger(group,previous.yz,1u,0u);}
  if(!overlapping&&!prior&&(sample.x&2u)!=0u){emitTrigger(group,sample.yz,0u,1u);emitTrigger(group,sample.yz,1u,1u);}
  triggerHistory[index]=sample;
 }
}
`,m=(n,r,i)=>{let a=[...s,...f,c].filter(e=>r.includes(e.name)),o=[`bodies`,`triggerGroups`,`triggerPairs`,`triggerStatistics`],l={id:`${t}-${n}`,source:p,entryPoint:n,shaderLayout:{bindings:a.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:o.includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(a.map(e=>[e.name,e.buffer]))},u=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.max(1,Math.ceil(i/64))})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:l.id,resources:a.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:o.includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>u(V(e.device,l)),compileAsync:async()=>u(await H(e.device,l))})};return m(`saveTriggers`,[`positions`,`orientations`,`bodies`,`triggerPrevious`],r),{events:f[5].buffer,samples:{buffer:f[3].buffer,resource:f[3].resource,count:i.count},sample:()=>m(`sampleTriggers`,[...d?[`settings`]:[],`positions`,`orientations`,`bodies`,`triggerPrevious`,`triggerGroups`,`triggerPairs`,`triggerSamples`,...u?[`targets`]:[]],i.count),publish:()=>m(`publishTriggers`,[`triggerStatistics`,`triggerGroups`,`triggerSamples`,`triggerHistory`,`triggerEvents`],1)}}function xl(e,t,n,r,i,a,s,c,l){let u=n[0].buffer.byteLength/16,d=u/s,f=n[5],{headOffset:p,linkOffset:m,journalOffset:h,savedKeyOffset:g,savedLinkOffset:_,savedHeadOffset:v,savedHeaderOffset:y,savedManifoldOffset:b}=ol(u,d,c),x=(t,n)=>{let r=l(t,n);return{buffer:r,resource:e.importBuffer({id:r.id,byteLength:n,usage:o.STORAGE|o.COPY_DST},r)}},S=n.slice(0,5).map((e,t)=>x(`checkpoint-${t}`,e.buffer.byteLength)),C=x(`state-validity`,u*4),w=(n,r,a,o=!1)=>{let s={id:`${t}-${n}`,entryPoint:`main`,source:`${r.map((e,t)=>`@group(0) @binding(${t}) var<storage,${e.writable?`read_write`:`read`}> ${e.name}:array<${e.atomic?`atomic<u32>`:`u32`}>;`).join(`
`)}\n${a}`,shaderLayout:{bindings:r.map((e,t)=>({name:e.name,group:0,location:t,type:e.writable?`storage`:`read-only-storage`}))},bindings:Object.fromEntries(r.map(e=>[e.name,e.buffer]))},c=e=>({encode:({computePass:t})=>{o?e.kernel.dispatchIndirect(t,{bindings:e.bindings,indirectBuffer:i.buffer,indirectOffset:16}):e.kernel.dispatch(t,{bindings:e.bindings,x:1})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:s.id,workload:{commandCount:1},resources:[...r.map(e=>({buffer:e.resource,usage:e.writable?`storage-read-write`:`storage-read`})),...o?[{buffer:i.resource,usage:`indirect`}]:[]],compile:()=>c(V(e.device,s)),compileAsync:async()=>c(await H(e.device,s))})},T=`let work=invocation.x;if(work>=ensemble[0]*${s}u){return;}
 let body=ensemble[${16+d*8}u+work/${s}u]*${s}u+work%${s}u;`;return{save:()=>{w(`checkpoint-metadata`,[{...f,name:`targets`,writable:!0},{...i,name:`ensemble`},{...C,name:`validity`,writable:!0}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(invocation.x==0u){validity[0]=0u;}
 if(invocation.x<8u){targets[${y}u+invocation.x]=targets[${u*8}u+invocation.x];}
 for(var work=invocation.x;work<ensemble[0];work+=64u){
  let instance=ensemble[${16+d*8}u+work];
  targets[${v}u+instance]=targets[${p}u+instance];
  targets[${v+d}u+instance]=targets[${p+d}u+instance];
 }
}`),n.slice(0,5).forEach((e,t)=>w(`checkpoint-${t}`,[{...e,name:`state`},{...S[t],name:`snapshot`,writable:!0},{...i,name:`ensemble`}],`@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${T}
 for(var word=0u;word<4u;word++){snapshot[body*4u+word]=state[body*4u+word];}
}`,!0))},restore:()=>{w(`rollback-contacts`,[{...a,name:`manifolds`,writable:!0},{...f,name:`targets`},{...r,name:`statistics`}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let count=targets[${u*8+5}u];
 for(var work=invocation.x;work<count*104u;work+=64u){
  let pair=targets[${h}u+work/104u];let word=work%104u;
  manifolds[pair*104u+word]=targets[${b}u+pair*104u+word];
 }
}`),w(`rollback-allocator`,[{...f,name:`targets`,writable:!0},{...i,name:`ensemble`},{...r,name:`statistics`}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let count=targets[${u*8+5}u];
 for(var index=invocation.x;index<count;index+=64u){let pair=targets[${h}u+index];
  targets[${u*8+8}u+pair*2u]=targets[${g}u+pair*2u];
  targets[${u*8+9}u+pair*2u]=targets[${g+1}u+pair*2u];
  targets[${m}u+pair]=targets[${_}u+pair];
 }
 for(var work=invocation.x;work<ensemble[0];work+=64u){let instance=ensemble[${16+d*8}u+work];
  targets[${p}u+instance]=targets[${v}u+instance];
  targets[${p+d}u+instance]=targets[${v+d}u+instance];
 }
 storageBarrier();
 // Preserve the attempted step's journal list and counters so the next prepare can clear its marks.
 if(invocation.x<5u){targets[${u*8}u+invocation.x]=targets[${y}u+invocation.x];}
}`),n.slice(0,5).forEach((e,t)=>w(`rollback-${t}`,[{...e,name:`state`,writable:!0},{...S[t],name:`snapshot`},{...r,name:`statistics`},{...i,name:`ensemble`}],`@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 ${T}
 for(var word=0u;word<4u;word++){state[body*4u+word]=snapshot[body*4u+word];}
}`,!0))},validate:()=>w(`validate`,[...n.slice(0,4).map((e,t)=>({...e,name:[`positions`,`orientations`,`velocities`,`angularVelocities`][t]})),{...C,name:`validity`,writable:!0,atomic:!0},{...i,name:`ensemble`}],`
fn finite(value:u32)->bool{return abs(bitcast<f32>(value))<=3.402823466e38;}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${T}
 var valid=true;
 for(var word=0u;word<4u;word++){let address=body*4u+word;valid=valid&&finite(positions[address])&&finite(orientations[address])&&finite(velocities[address])&&finite(angularVelocities[address]);}
 if(!valid){atomicAdd(&validity[0],1u);}
}`,!0),validity:{...C,count:1}}}function Sl(e,t,n,r,i){let a=n.map((n,r)=>{let a=i(`checkpoint-${r}`,n.buffer.byteLength);return{...n,snapshot:a,snapshotResource:e.importBuffer({id:`${t}-checkpoint-${r}`,byteLength:a.byteLength,usage:o.STORAGE|o.COPY_DST},a)}});e.addCopyPass({id:`${t}-checkpoint`,description:`Save simulation state so an incomplete step can be rolled back.`,resources:a.flatMap(e=>[{buffer:e.resource,usage:`copy-source`},{buffer:e.snapshotResource,usage:`copy-destination`}]),compile:()=>({encode:({commandEncoder:e,getBuffer:t})=>{for(let n of a)e.copyBufferToBuffer({sourceBuffer:t(n.resource),destinationBuffer:t(n.snapshotResource),size:n.buffer.byteLength})}})});let s=()=>{let n=a.map((n,i)=>{let a=Math.ceil(n.buffer.byteLength/256),o=Math.min(a,e.device.limits.maxComputeWorkgroupsPerDimension);return{id:`${t}-restore-${i}`,entryPoint:`restore`,source:`
@group(0) @binding(0) var<storage,read_write> state:array<u32>;
@group(0) @binding(1) var<storage,read> snapshot:array<u32>;
@group(0) @binding(2) var<storage,read> statistics:array<u32>;
@compute @workgroup_size(64) fn restore(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let index=invocation.x+invocation.y*${o*64}u;
 if(index<arrayLength(&state)){state[index]=snapshot[index];}
}`,shaderLayout:{bindings:[{name:`state`,group:0,location:0,type:`storage`},{name:`snapshot`,group:0,location:1,type:`read-only-storage`},{name:`statistics`,group:0,location:2,type:`read-only-storage`}]},bindings:{state:n.buffer,snapshot:n.snapshot,statistics:r.buffer},horizontal:o,vertical:Math.ceil(a/o)}}),i=e=>({encode:({computePass:t})=>{for(let[r,i]of e.entries())i.kernel.dispatch(t,{bindings:i.bindings,x:n[r].horizontal,y:n[r].vertical})},destroy:()=>{for(let t of e)t.kernel.destroy()}});e.addComputePass({id:`${t}-rollback`,description:`Restore saved simulation state when diagnostics reject the step.`,resources:[{buffer:r.resource,usage:`storage-read`},...a.flatMap(e=>[{buffer:e.resource,usage:`storage-read-write`},{buffer:e.snapshotResource,usage:`storage-read`}])],compile:()=>i(n.map(t=>V(e.device,t))),compileAsync:async()=>i(await Promise.all(n.map(t=>H(e.device,t))))})},c=i(`state-validity`,n[0].buffer.byteLength/4),l=e.importBuffer({id:`${t}-state-validity`,byteLength:c.byteLength,usage:o.STORAGE},c);return{save:void 0,restore:s,validate:()=>{let r=[`positions`,`orientations`,`velocities`,`angularVelocities`],i={id:`${t}-validate`,source:`
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> velocities:array<vec4f>;
@group(0) @binding(3) var<storage,read> angularVelocities:array<vec4f>;
@group(0) @binding(4) var<storage,read_write> validity:array<u32>;
fn finite(value:vec4f)->bool{return all(abs(value)<=vec4f(3.402823466e38));}
@compute @workgroup_size(64) fn validate(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=arrayLength(&positions)){return;}
 validity[body]=select(1u,0u,finite(positions[body])&&finite(orientations[body])&&finite(velocities[body])&&finite(angularVelocities[body]));
}`,entryPoint:`validate`,shaderLayout:{bindings:[...r.map((e,t)=>({name:e,group:0,location:t,type:`read-only-storage`})),{name:`validity`,group:0,location:4,type:`storage`}]},bindings:{...Object.fromEntries(r.map((e,t)=>[e,n[t].buffer])),validity:c}},a=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(n[0].buffer.byteLength/1024)})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:i.id,description:`Validate body state before publishing the completed simulation step.`,resources:[...n.slice(0,4).map(e=>({buffer:e.resource,usage:`storage-read`})),{buffer:l,usage:`storage-read-write`}],compile:()=>a(V(e.device,i)),compileAsync:async()=>a(await H(e.device,i))})},validity:{buffer:c,resource:l,count:n[0].buffer.byteLength/16}}}function Cl(e,t,n,r,i,a,s){let c=new Float32Array(n.length*12);for(let[e,t]of n.entries())c.set([...t.centerOfMass??[0,0,0],0,...r[e][0],0,...r[e][1],0],e*12);let l=s(`pose-metadata`,c),u=new Float32Array(n.length*16);for(let[e,t]of n.entries())u.set(new gc().translate(t.position).multiplyRight(new gc().fromQuaternion(U(t.orientation))),e*16);let d=s(`pose-matrices`,u),f=s(`pose-bounds`,n.length*32),p=(n,r)=>({buffer:r,resource:e.importBuffer({id:`${t}-${n}`,byteLength:r.byteLength,usage:o.STORAGE},r)}),m={positions:i,orientations:a,metadata:p(`pose-metadata`,l),matrices:p(`pose-matrices`,d),worldBounds:p(`pose-bounds`,f)},h={id:`${t}-publish-poses`,source:`
struct Bounds {minimum:vec4f,maximum:vec4f}
struct Metadata {center:vec4f,minimum:vec4f,maximum:vec4f}
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> metadata:array<Metadata>;
@group(0) @binding(3) var<storage,read_write> matrices:array<mat4x4f>;
@group(0) @binding(4) var<storage,read_write> worldBounds:array<Bounds>;
fn rotate(rotation:vec4f,point:vec3f)->vec3f{return point+2.0*cross(rotation.xyz,cross(rotation.xyz,point)+rotation.w*point);}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=${n.length}u){return;}
 let rotation=orientations[body];let origin=positions[body].xyz-rotate(rotation,metadata[body].center.xyz);
 let horizontal=rotate(rotation,vec3f(1,0,0));let vertical=rotate(rotation,vec3f(0,1,0));let depth=rotate(rotation,vec3f(0,0,1));
 matrices[body]=mat4x4f(vec4f(horizontal,0),vec4f(vertical,0),vec4f(depth,0),vec4f(origin,1));
 let center=(metadata[body].minimum.xyz+metadata[body].maximum.xyz)*0.5;let extent=(metadata[body].maximum.xyz-metadata[body].minimum.xyz)*0.5;
 let worldCenter=origin+rotate(rotation,center);let worldExtent=abs(horizontal)*extent.x+abs(vertical)*extent.y+abs(depth)*extent.z;
 worldBounds[body]=Bounds(vec4f(worldCenter-worldExtent,0),vec4f(worldCenter+worldExtent,0));
}`,shaderLayout:{bindings:Object.keys(m).map((e,t)=>({name:e,group:0,location:t,type:t<3?`read-only-storage`:`storage`}))},bindings:Object.fromEntries(Object.entries(m).map(([e,t])=>[e,t.buffer]))},g,_=e=>(g=e,{encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(n.length/64)})},destroy:()=>e.kernel.destroy()});return e.addComputePass({id:h.id,resources:Object.values(m).map((e,t)=>({buffer:e.resource,usage:t<3?`storage-read`:`storage-write`})),compile:()=>_(V(e.device,h)),compileAsync:async()=>_(await H(e.device,h))}),{matrices:d,bounds:f,encode:e=>{let t=e.beginComputePass();g.kernel.dispatch(t,{bindings:g.bindings,x:Math.ceil(n.length/64)}),t.end()}}}var wl=`
fn triangleVertex(collider:u32, triangle:u32, corner:u32)->vec3f {
 let indices=readGeometry(u32(bodies.colliders[collider].padding.z)+triangle);
 return readGeometry(u32(bodies.colliders[collider].padding.x)+u32(indices[corner])).xyz;
}
// Use the smaller local contact feature, not an elongated world AABB or an
// entire nonconvex mesh. A plane contributes no finite scale of its own.
fn contactFeatureScale(collider:u32,triangle:i32)->f32 {
 if(triangle>=0){
  let first=triangleVertex(collider,u32(triangle),0u);let second=triangleVertex(collider,u32(triangle),1u);let third=triangleVertex(collider,u32(triangle),2u);
  return min(length(second-first),min(length(third-second),length(first-third)));
 }
 let shape=bodies.colliders[collider].shape;
 if(shape.w==0.0){return shape.x;}
 if(shape.w==6.0){return 1e30;}
 if(shape.w==4.0){return max(shape.x,shape.y);}
 if(shape.w==5.0){return min(max(shape.x,shape.y),shape.z*0.5);}
 if(shape.w==1.0){return min(shape.x,min(shape.y,shape.z));}
 let root=u32(bodies.colliders[collider].policies.z);
 let extent=(readGeometry(root+1u).xyz-readGeometry(root).xyz)*0.5;
 return min(extent.x,min(extent.y,extent.z));
}
// Conservative world-space extents prevent a large rotated box's mesh-local
// AABB from expanding into unnecessary whole-mesh traversal.
fn shapeWorldExtent(collider:u32)->vec3f {
 let shape=bodies.colliders[collider].shape;var extent=shape.xyz;
 if(shape.w==0.0){extent=vec3f(shape.x);}
 if(shape.w==4.0){let radius=max(shape.x,shape.y);extent=vec3f(radius,radius+shape.z*0.5,radius);}
 if(shape.w==5.0){let radius=max(shape.x,shape.y);extent=vec3f(radius,shape.z*0.5,radius);}
 if(shape.w==6.0){extent=vec3f(select(1e15,shape.x,shape.x>0.0),0,select(1e15,shape.y,shape.y>0.0));}
 return abs(axis(collider,0u))*extent.x+abs(axis(collider,1u))*extent.y+abs(axis(collider,2u))*extent.z;
}
`,Tl=`
@group(0) @binding(24) var<storage,read_write> minima:array<f32>;
@group(0) @binding(25) var<storage,read_write> maxima:array<f32>;
@compute @workgroup_size(64) fn bounds(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledColliderCount()){return;}let index=scheduledCollider(work);
 let center=colliderPosition(index);let extent=shapeWorldExtent(index)+vec3f(settings.solver.x);
 for(var axisIndex=0u;axisIndex<3u;axisIndex++){
  minima[index*3u+axisIndex]=center[axisIndex]-extent[axisIndex];
  maxima[index*3u+axisIndex]=center[axisIndex]+extent[axisIndex];
 }
}
`;function El(e){return`
struct ParallelState {
 diagnostics:array<atomic<u32>,4>,
 heads:array<atomic<u32>,BODY_COUNT>,
 degrees:array<atomic<u32>,BODY_COUNT>,
 roots:array<atomic<u32>,BODY_COUNT>,
 flags:array<atomic<u32>,BODY_COUNT>,
 forced:array<atomic<u32>,BODY_COUNT>,
 next:array<u32,PAIR_CAPACITY*2u>,
 deltas:array<vec4f,PAIR_CAPACITY*4u>,
 activePairs:array<u32,PAIR_CAPACITY>,
 solvePairs:array<u32,PAIR_CAPACITY>,
 awakeBodies:array<u32,BODY_COUNT>
}
@group(0) @binding(26) var<storage,read_write> parallelState:ParallelState;
@group(0) @binding(27) var<storage,read_write> parallelDispatch:array<u32,12>;
fn parallelPair(index:u32)->u32 {
 if(COMPACT_CONTACTS){
  if(index>=atomicLoad(&parallelState.diagnostics[1])){return PAIR_CAPACITY;}
  return parallelState.activePairs[index];
 }
 return index;
}
// One bounded scan builds the queue; every iterative solve reuses original manifold IDs.
@compute @workgroup_size(64) fn parallelCompact(@builtin(global_invocation_id) invocation:vec3u){
 ${e?`
 let work=invocation.x;if(work>=atomicLoad(&ensemble[0])){return;}
 let instance=atomicLoad(&ensemble[INSTANCE_QUEUE+work]);var link=atomicLoad(&targets.instanceHeads[instance]);
 loop{if(link==0u){break;}let pair=link-1u;link=targets.links[pair];
  if(manifolds[pair].count==0u){continue;}
  let slot=atomicAdd(&parallelState.diagnostics[1],1u);parallelState.activePairs[slot]=pair;
 }`:`
 let pair=invocation.x;if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u){return;}
 let slot=atomicAdd(&parallelState.diagnostics[1],1u);parallelState.activePairs[slot]=pair;`}

}
@compute @workgroup_size(1) fn parallelDispatchCount(){
 parallelDispatch[0]=(atomicLoad(&parallelState.diagnostics[1])+63u)/64u;
 parallelDispatch[1]=1u;parallelDispatch[2]=1u;parallelDispatch[3]=0u;
}
// Build solver work only after island wake propagation has completed.
@compute @workgroup_size(64) fn parallelActive(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;
 if(!${e}&&index<BODY_COUNT&&bodyScheduled(index)&&dynamic(index)&&sleepStates[index].y<0.5){
  let slot=atomicAdd(&parallelState.diagnostics[2],1u);parallelState.awakeBodies[slot]=index;
 }
 let pair=parallelPair(index);
 if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u||!colliderScheduled(manifolds[pair].first)){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 if((dynamic(first)&&sleepStates[first].y<0.5)||(dynamic(second)&&sleepStates[second].y<0.5)){
  let slot=atomicAdd(&parallelState.diagnostics[3],1u);parallelState.solvePairs[slot]=pair;
 }
}
@compute @workgroup_size(64) fn parallelActiveBodies(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);
 if(dynamic(body)&&sleepStates[body].y<0.5){let slot=atomicAdd(&parallelState.diagnostics[2],1u);parallelState.awakeBodies[slot]=body;}
}
@compute @workgroup_size(1) fn parallelActiveCount(){
 parallelDispatch[4]=(atomicLoad(&parallelState.diagnostics[3])+63u)/64u;
 parallelDispatch[5]=1u;parallelDispatch[6]=1u;parallelDispatch[7]=0u;
 parallelDispatch[8]=(atomicLoad(&parallelState.diagnostics[2])+63u)/64u;
 parallelDispatch[9]=1u;parallelDispatch[10]=1u;parallelDispatch[11]=0u;
}
fn parallelSolvePair(index:u32)->u32 {
 if(!COMPACT_CONTACTS){
  if(index>=PAIR_CAPACITY||manifolds[index].count==0u){return PAIR_CAPACITY;}
  // Only scheduled contacts were linked. Reuse adjacency to avoid a ninth storage binding.
  let first=colliderBody(getFirstCollider(index));let second=colliderBody(getSecondCollider(index));
  if(atomicLoad(&parallelState.heads[first])==0xffffffffu&&atomicLoad(&parallelState.heads[second])==0xffffffffu){return PAIR_CAPACITY;}
  return index;
 }
 if(index>=atomicLoad(&parallelState.diagnostics[3])){return PAIR_CAPACITY;}
 return parallelState.solvePairs[index];
}
// Parent IDs strictly decrease. A connected chain can require up to BODY_COUNT links
// before compression completes; a fixed 64-link cap rejects valid larger islands.
fn parallelRoot(body:u32)->u32 {
 var current=body;
 for(var iteration=0u;iteration<max(64u,BODY_COUNT);iteration++){
  let parent=atomicLoad(&parallelState.roots[current]);
  if(parent==current){return current;}
  let grandparent=atomicLoad(&parallelState.roots[parent]);
  atomicMin(&parallelState.roots[current],grandparent);current=parent;
 }
 // Incomplete union work prevents sleeping, rather than treating split islands as independent.
 atomicAdd(&parallelState.diagnostics[0],1u);return current;
}
@compute @workgroup_size(1) fn parallelResetCounters(){
 for(var index=0u;index<4u;index++){atomicStore(&parallelState.diagnostics[index],0u);}
}
@compute @workgroup_size(64) fn parallelReset(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;var body=work;if(${e}&&COMPACT_CONTACTS){if(work>=scheduledBodyCount()){return;}body=scheduledBody(work);}
 if(!(${e}&&COMPACT_CONTACTS)&&body<4u){atomicStore(&parallelState.diagnostics[body],0u);}
 if(body>=BODY_COUNT||(${e}&&COMPACT_CONTACTS&&work>=scheduledBodyCount())){return;}
 atomicStore(&parallelState.heads[body],0xffffffffu);atomicStore(&parallelState.degrees[body],0u);
 atomicStore(&parallelState.roots[body],body);atomicStore(&parallelState.flags[body],1u);atomicStore(&parallelState.forced[body],0u);
}
@compute @workgroup_size(64) fn parallelLink(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelPair(invocation.x);if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u||!colliderScheduled(manifolds[pair].first)){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 for(var endpoint=0u;endpoint<2u;endpoint++){
  let body=select(first,second,endpoint==1u);let other=select(second,first,endpoint==1u);
  if(!dynamic(body)){continue;}
  let edge=pair*2u+endpoint;
  parallelState.next[edge]=atomicExchange(&parallelState.heads[body],edge);
  atomicAdd(&parallelState.degrees[body],1u);
  if(bodies.bodies[other].motion.x==2.0&&length(velocities[other].xyz)+length(angularVelocities[other].xyz)>0.000001){atomicStore(&parallelState.forced[body],1u);}
 }
}
@compute @workgroup_size(64) fn parallelUnion(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelPair(invocation.x);if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u||!colliderScheduled(manifolds[pair].first)){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 if(!dynamic(first)||!dynamic(second)){return;}
 for(var iteration=0u;iteration<max(64u,BODY_COUNT);iteration++){
  let firstRoot=parallelRoot(first);let secondRoot=parallelRoot(second);
  if(firstRoot==secondRoot){return;}
  let larger=max(firstRoot,secondRoot);let smaller=min(firstRoot,secondRoot);
  if(atomicMin(&parallelState.roots[larger],smaller)==larger){return;}
 }
 atomicAdd(&parallelState.diagnostics[0],1u);
}
@compute @workgroup_size(64) fn parallelCompress(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)){return;}
 sleepStates[body].z=f32(parallelRoot(body));
}
@compute @workgroup_size(64) fn parallelWakeRoots(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(sleepStates[body].y<0.5||atomicLoad(&parallelState.forced[body])>0u){atomicStore(&parallelState.flags[u32(sleepStates[body].z)],0u);}
}
@compute @workgroup_size(64) fn parallelWakeBodies(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(atomicLoad(&parallelState.flags[u32(sleepStates[body].z)])==0u||atomicLoad(&parallelState.diagnostics[0])>0u){
  if(sleepStates[body].y>0.5||atomicLoad(&parallelState.forced[body])>0u){sleepStates[body].x=0.0;}
  sleepStates[body].y=0.0;
 }
}
fn writePairDeltas(pair:u32,first:u32,second:u32,impulse:vec3f,firstTorque:vec3f,secondTorque:vec3f){
 parallelState.deltas[pair*4u]=vec4f(select(vec3f(0),-impulse*velocities[first].w,dynamic(first)),0);
 parallelState.deltas[pair*4u+1u]=vec4f(select(vec3f(0),inverseInertia(first,firstTorque),dynamic(first)),0);
 parallelState.deltas[pair*4u+2u]=vec4f(select(vec3f(0),impulse*velocities[second].w,dynamic(second)),0);
 parallelState.deltas[pair*4u+3u]=vec4f(select(vec3f(0),inverseInertia(second,secondTorque),dynamic(second)),0);
}
@compute @workgroup_size(64) fn parallelWarm(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelSolvePair(invocation.x);if(pair>=PAIR_CAPACITY){return;}
 for(var index=0u;index<4u;index++){parallelState.deltas[pair*4u+index]=vec4f(0);}
 if(manifolds[pair].count==0u){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 if((sleepStates[first].y>0.5||!dynamic(first))&&(sleepStates[second].y>0.5||!dynamic(second))){return;}
 var impulse=vec3f(0);var firstTorque=vec3f(0);var secondTorque=vec3f(0);
 for(var slot=0u;slot<manifolds[pair].count;slot++){
  let contact=manifolds[pair].contacts[slot];let increment=contact.normal.xyz*contact.impulse.x+contact.tangent.xyz;
  impulse+=increment;firstTorque-=cross(contact.point.xyz-positions[first].xyz,increment);secondTorque+=cross(contact.point.xyz-positions[second].xyz,increment);
 }
 writePairDeltas(pair,first,second,impulse,firstTorque,secondTorque);
}
@compute @workgroup_size(64) fn parallelPairs(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelSolvePair(invocation.x);if(pair>=PAIR_CAPACITY){return;}
 for(var index=0u;index<4u;index++){parallelState.deltas[pair*4u+index]=vec4f(0);}
 if(manifolds[pair].count==0u){return;}
 let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
 if((sleepStates[first].y>0.5||!dynamic(first))&&(sleepStates[second].y>0.5||!dynamic(second))){return;}
 let relaxation=settings.stability.w/f32(max(1u,max(atomicLoad(&parallelState.degrees[first]),atomicLoad(&parallelState.degrees[second]))));
 var firstLinear=velocities[first].xyz;var secondLinear=velocities[second].xyz;
 var firstAngular=angularVelocities[first].xyz;var secondAngular=angularVelocities[second].xyz;
 for(var slot=0u;slot<manifolds[pair].count;slot++){
  var contact=manifolds[pair].contacts[slot];let point=contact.point.xyz;let normal=contact.normal.xyz;
  let firstLever=point-positions[first].xyz;let secondLever=point-positions[second].xyz;
  let relative=secondLinear+cross(secondAngular,secondLever)-firstLinear-cross(firstAngular,firstLever);
  let normalMass=effectiveMass(first,second,point,normal);if(normalMass<=0.0){continue;}
  let bias=min(settings.stability.z,settings.stability.y*max(0.0,contact.point.w-settings.solver.x)/settings.gravity.w);
  let desiredImpulse=max(0.0,contact.impulse.x+(max(bias,contact.normal.w)-dot(relative,normal))/normalMass);
  let change=(desiredImpulse-contact.impulse.x)*relaxation;contact.impulse.x+=change;
  var impulse=normal*change;
  if(dynamic(first)){firstLinear-=impulse*velocities[first].w;firstAngular-=inverseInertia(first,cross(firstLever,impulse));}
  if(dynamic(second)){secondLinear+=impulse*velocities[second].w;secondAngular+=inverseInertia(second,cross(secondLever,impulse));}
  let after=secondLinear+cross(secondAngular,secondLever)-firstLinear-cross(firstAngular,firstLever);
  let tangent=solveFriction(firstCollider,secondCollider,contact,after);
  var relaxedTangent=contact.tangent.xyz+(tangent-contact.tangent.xyz)*relaxation;
  // A falling normal impulse must shrink the cone even when under-relaxing.
  let staticLimit=frictionCoefficient(firstCollider,secondCollider,false)*contact.impulse.x;
  if(length(relaxedTangent)>staticLimit){relaxedTangent*=staticLimit/max(1e-30,length(relaxedTangent));}
  impulse=relaxedTangent-contact.tangent.xyz;contact.tangent=vec4f(relaxedTangent,0);
  if(dynamic(first)){firstLinear-=impulse*velocities[first].w;firstAngular-=inverseInertia(first,cross(firstLever,impulse));}
  if(dynamic(second)){secondLinear+=impulse*velocities[second].w;secondAngular+=inverseInertia(second,cross(secondLever,impulse));}
  manifolds[pair].contacts[slot]=contact;
 }
 parallelState.deltas[pair*4u]=vec4f(firstLinear-velocities[first].xyz,0);
 parallelState.deltas[pair*4u+1u]=vec4f(firstAngular-angularVelocities[first].xyz,0);
 parallelState.deltas[pair*4u+2u]=vec4f(secondLinear-velocities[second].xyz,0);
 parallelState.deltas[pair*4u+3u]=vec4f(secondAngular-angularVelocities[second].xyz,0);
}
@compute @workgroup_size(64) fn parallelGather(@builtin(global_invocation_id) invocation:vec3u){
 var body=invocation.x;
 if(COMPACT_CONTACTS){if(body>=atomicLoad(&parallelState.diagnostics[2])){return;}body=parallelState.awakeBodies[body];}if(body>=BODY_COUNT||!dynamic(body)||sleepStates[body].y>0.5){return;}
 var linear=vec3f(0);var angular=vec3f(0);var edge=atomicLoad(&parallelState.heads[body]);if(edge==0xffffffffu){return;}
 loop{if(edge==0xffffffffu){break;}let pair=edge/2u;let endpoint=edge%2u;
  linear+=parallelState.deltas[pair*4u+endpoint*2u].xyz;angular+=parallelState.deltas[pair*4u+endpoint*2u+1u].xyz;edge=parallelState.next[edge];
 }
 velocities[body]=vec4f(velocities[body].xyz+linear,velocities[body].w);angularVelocities[body]=vec4f(angularVelocities[body].xyz+angular,0);
}
@compute @workgroup_size(64) fn parallelAdvance(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);finishBody(body);${e?``:`atomicStore(&parallelState.flags[body],1u);`}
}
@compute @workgroup_size(64) fn parallelPrepareSleep(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work<scheduledBodyCount()){let body=scheduledBody(work);atomicStore(&parallelState.flags[body],1u);}
}
@compute @workgroup_size(64) fn parallelMarkSleep(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(settings.sleep.x<=0.0||sleepStates[body].x<settings.sleep.x||atomicLoad(&parallelState.diagnostics[0])>0u){atomicStore(&parallelState.flags[u32(sleepStates[body].z)],0u);}
}
@compute @workgroup_size(64) fn parallelSleep(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(atomicLoad(&parallelState.flags[u32(sleepStates[body].z)])>0u){sleepStates[body].y=1.0;velocities[body]=vec4f(0,0,0,velocities[body].w);angularVelocities[body]=vec4f(0);}
}
`}var Dl=`
const MESH_TASK_CAPACITY:u32=65536u;
struct MeshTask { key:vec4u, point:vec4f, normal:vec4f }
struct MeshTasks { count:atomic<u32>, overflow:atomic<u32>, unresolved:atomic<u32>, incomplete:atomic<u32>, entries:array<MeshTask,65536> }
@group(0) @binding(10) var<storage,read_write> meshTasks:MeshTasks;
${ml}
struct Simplex { points: array<SupportVertex,4>, count: u32 }
struct ConvexHit { point: vec3f, normal: vec3f, depth: f32, status: u32 }
struct EPAFace { indices: vec3u, normal: vec3f, distance: f32 }
fn shapeSupport(collider:u32,direction:vec3f,triangle:i32)->vec3f {return colliderPosition(collider)+rotate(colliderRotation(collider),localShapeSupport(collider,colliderLocal(collider,direction),triangle));}
// Clip an unbounded plane to this pair's conservative footprint. The patch
// contains every possible contact without putting huge coordinates into GJK.
fn pairShapeSupport(collider:u32,other:u32,direction:vec3f,triangle:i32)->vec3f {
 let shape=bodies.colliders[collider].shape;
 if(shape.w!=6.0){return shapeSupport(collider,direction,triangle);}
 let center=colliderLocal(collider,colliderPosition(other)-colliderPosition(collider));
 let extent=shapeWorldExtent(other);let localDirection=colliderLocal(collider,direction);
 var point=vec3f(0);
 for(var coordinate=0u;coordinate<2u;coordinate++){
  let component=coordinate*2u;let halfExtent=shape[coordinate];
  let radius=dot(abs(axis(collider,component)),extent)+settings.solver.x*2.0;
  var lower=center[component]-radius;var upper=center[component]+radius;
  if(halfExtent>0.0){lower=-halfExtent;upper=halfExtent;}
  point[component]=select(lower,upper,localDirection[component]>=0.0);
 }
 return colliderPosition(collider)+rotate(colliderRotation(collider),point);
}
fn permitsPlaneContact(plane:u32,other:u32)->bool {
 let shape=bodies.colliders[plane].shape;
 return shape.w!=6.0||shape.z!=0.0||dot(colliderPosition(other)-colliderPosition(plane),axis(plane,1u))>=0.0;
}
fn minkowski(first:u32,second:u32,direction:vec3f,firstTriangle:i32,secondTriangle:i32,scale:f32)->SupportVertex {
 let maximumComponent=max(abs(direction.x),max(abs(direction.y),abs(direction.z)));
 let searchDirection=direction/max(maximumComponent,1e-30);
 var vertex:SupportVertex;vertex.first=pairShapeSupport(first,second,searchDirection,firstTriangle);vertex.second=pairShapeSupport(second,first,-searchDirection,secondTriangle);
 vertex.difference=(vertex.first-vertex.second+searchDirection/max(length(searchDirection),1e-20)*settings.solver.x)/scale;return vertex;
}
fn perpendicular(direction:vec3f)->vec3f {return cross(direction,select(vec3f(1,0,0),vec3f(0,1,0),abs(direction.x)>abs(direction.y)));}
fn reduceLine(simplex:ptr<function,Simplex>)->vec3f {
 let start=(*simplex).points[0].difference;let edge=(*simplex).points[1].difference-start;
 if(dot(edge,-start)>0.0){var direction=cross(cross(edge,-start),edge);if(dot(direction,direction)<1e-18){direction=perpendicular(edge);}return direction;}
 (*simplex).count=1u;return -start;
}
fn reduceTriangle(simplex:ptr<function,Simplex>)->vec3f {
 let start=(*simplex).points[0].difference;let first=(*simplex).points[1].difference-start;let second=(*simplex).points[2].difference-start;let normal=cross(first,second);
 if(dot(cross(normal,second),-start)>0.0){
  if(dot(second,-start)>0.0){(*simplex).points[1]=(*simplex).points[2];(*simplex).count=2u;return reduceLine(simplex);}
  (*simplex).count=2u;return reduceLine(simplex);
 }
 if(dot(cross(first,normal),-start)>0.0){(*simplex).count=2u;return reduceLine(simplex);}
 if(dot(normal,-start)>=0.0){return normal;}
 let temporary=(*simplex).points[1];(*simplex).points[1]=(*simplex).points[2];(*simplex).points[2]=temporary;return -normal;
}
fn reduceTetrahedron(simplex:ptr<function,Simplex>)->vec4f {
 let start=(*simplex).points[0].difference;
 for(var face=0u;face<3u;face++){
  let first=1u+face%3u;let second=1u+(face+1u)%3u;let opposite=1u+(face+2u)%3u;
  var normal=cross((*simplex).points[first].difference-start,(*simplex).points[second].difference-start);
  if(dot(normal,(*simplex).points[opposite].difference-start)>0.0){normal=-normal;}
  if(dot(normal,-start)>1e-10){let firstVertex=(*simplex).points[first];let secondVertex=(*simplex).points[second];(*simplex).points[1]=firstVertex;(*simplex).points[2]=secondVertex;(*simplex).count=3u;return vec4f(reduceTriangle(simplex),0);}
 }
 return vec4f(0,0,0,1);
}
fn makeEPAFace(vertices:ptr<function,array<SupportVertex,64>>,first:u32,second:u32,third:u32,interior:vec3f)->EPAFace {
 var result:EPAFace;result.indices=vec3u(first,second,third);
 let point=(*vertices)[first].difference;var normal=cross((*vertices)[second].difference-point,(*vertices)[third].difference-point);
 if(dot(normal,interior-point)>0.0){normal=-normal;result.indices=vec3u(first,third,second);}
 result.normal=normal/max(length(normal),1e-20);result.distance=dot(result.normal,point);return result;
}
fn faceHit(vertices:ptr<function,array<SupportVertex,64>>,face:EPAFace,scale:f32)->ConvexHit {
 let first=(*vertices)[face.indices.x];let second=(*vertices)[face.indices.y];let third=(*vertices)[face.indices.z];
 let weights=triangleWeights(face.normal*face.distance,first.difference,second.difference,third.difference);
 var hit:ConvexHit;hit.point=((first.first+first.second)*weights.x+(second.first+second.second)*weights.y+(third.first+third.second)*weights.z)*0.5;
 hit.normal=face.normal;hit.depth=face.distance*scale-settings.solver.x;hit.status=1u;return hit;
}
fn convexContact(first:u32,second:u32,firstTriangle:i32,secondTriangle:i32)->ConvexHit {
 // Analytic sphere/triangle witnesses avoid EPA noise at coplanar tessellation seams.
 let sphereFirst=bodies.colliders[first].shape.w==0.0&&secondTriangle>=0;
 let sphereSecond=bodies.colliders[second].shape.w==0.0&&firstTriangle>=0;
 if(sphereFirst||sphereSecond){
  let sphere=select(second,first,sphereFirst);let mesh=select(first,second,sphereFirst);
  let triangle=u32(select(firstTriangle,secondTriangle,sphereFirst));
  let center=colliderLocal(mesh,colliderPosition(sphere)-colliderPosition(mesh));
  let firstPoint=triangleVertex(mesh,triangle,0u);let secondPoint=triangleVertex(mesh,triangle,1u);let thirdPoint=triangleVertex(mesh,triangle,2u);
  let extent=max(abs(secondPoint-firstPoint),abs(thirdPoint-firstPoint));
  let normalization=max(max(extent.x,max(extent.y,extent.z)),1e-20);
  let firstEdge=(secondPoint-firstPoint)/normalization;let secondEdge=(thirdPoint-firstPoint)/normalization;
  let weights=triangleWeights((center-firstPoint)/normalization,vec3f(0),firstEdge,secondEdge);
  let closest=firstPoint+(secondPoint-firstPoint)*weights.y+(thirdPoint-firstPoint)*weights.z;
  let faceNormal=normalize(cross(firstEdge,secondEdge));
  let delta=center-closest;let magnitude=length(delta);let radius=bodies.colliders[sphere].shape.x;
  var hit:ConvexHit;if(magnitude>radius+settings.solver.x){return hit;}
  let internalEdges=u32(readGeometry(u32(bodies.colliders[mesh].padding.z)+triangle).w)%8u;
  // Opposite barycentric coordinate identifies an edge. Internal coplanar edges are
  // not collision ridges: their adjacent triangle owns the face witness instead.
  for(var edge=0u;edge<3u;edge++){
   if((internalEdges&(1u<<edge))!=0u&&weights[(edge+2u)%3u]<=1e-7&&weights[edge]>1e-7&&weights[(edge+1u)%3u]>1e-7){
    let tangential=delta-faceNormal*dot(delta,faceNormal);
    if(length(tangential)>max(1e-8,radius*1e-6)){return hit;}
   }
  }
  var normal=faceNormal;
  if(magnitude>1e-12){normal=delta/magnitude;}
  let worldNormal=rotate(colliderRotation(mesh),normal);
  let worldClosest=colliderPosition(mesh)+rotate(colliderRotation(mesh),closest);
  hit.point=(worldClosest+colliderPosition(sphere)-worldNormal*radius)*0.5;
  hit.normal=select(worldNormal,-worldNormal,sphereFirst);hit.depth=radius-magnitude;hit.status=1u;return hit;
 }

 // Normalize by local feature size and independently cap EPA's world-space tolerance.
 let scale=max(min(contactFeatureScale(first,firstTriangle),contactFeatureScale(second,secondTriangle)),1e-12);
 let distanceTolerance=min(0.0001,0.0001/scale);
 var miss:ConvexHit;var simplex:Simplex;simplex.count=1u;var direction=colliderPosition(second)-colliderPosition(first);if(length(direction)<1e-8){direction=vec3f(1,0,0);}
 simplex.points[0]=minkowski(first,second,direction,firstTriangle,secondTriangle,scale);direction=-simplex.points[0].difference;
 var intersected=false;
 for(var iteration=0u;iteration<48u;iteration++){
  if(length(direction)<1e-12){direction=vec3f(0,1,0);}
  let vertex=minkowski(first,second,direction,firstTriangle,secondTriangle,scale);if(dot(vertex.difference,direction)<0.0){return miss;}
  for(var index=simplex.count;index>0u;index--){simplex.points[index]=simplex.points[index-1u];}simplex.points[0]=vertex;simplex.count++;
  if(simplex.count==2u){direction=reduceLine(&simplex);}else if(simplex.count==3u){direction=reduceTriangle(&simplex);}else{let reduced=reduceTetrahedron(&simplex);if(reduced.w>0.5){intersected=true;break;}direction=reduced.xyz;}
 }
 if(!intersected){miss.status=2u;return miss;}
 var vertices:array<SupportVertex,64>;for(var index=0u;index<4u;index++){vertices[index]=simplex.points[index];}
 let interior=(vertices[0].difference+vertices[1].difference+vertices[2].difference+vertices[3].difference)*0.25;
 var faces:array<EPAFace,128>;faces[0]=makeEPAFace(&vertices,0u,1u,2u,interior);faces[1]=makeEPAFace(&vertices,0u,3u,1u,interior);faces[2]=makeEPAFace(&vertices,0u,2u,3u,interior);faces[3]=makeEPAFace(&vertices,1u,3u,2u,interior);
 var faceCount=4u;var vertexCount=4u;
 for(var iteration=0u;iteration<48u;iteration++){
  var nearest=0u;var distance=1e30;
  for(var index=0u;index<faceCount;index++){if(dot(faces[index].normal,faces[index].normal)>0.5&&faces[index].distance<distance){distance=faces[index].distance;nearest=index;}}
  if(distance==1e30){miss.status=2u;return miss;}
  let face=faces[nearest];let vertex=minkowski(first,second,face.normal,firstTriangle,secondTriangle,scale);
  if(dot(vertex.difference,face.normal)-distance<distanceTolerance){return faceHit(&vertices,face,scale);}
  if(vertexCount>=64u){miss.status=2u;return miss;}
  var edges:array<vec2u,256>;var edgeCount=0u;var retained=0u;
  for(var index=0u;index<faceCount;index++){
   let candidate=faces[index];
   if(dot(candidate.normal,vertex.difference-vertices[candidate.indices.x].difference)>1e-7){
    for(var side=0u;side<3u;side++){
     let edge=vec2u(candidate.indices[side],candidate.indices[(side+1u)%3u]);var cancelled=false;
     for(var previous=0u;previous<edgeCount;previous++){if(all(edges[previous]==edge.yx)){edges[previous]=vec2u(0xffffffffu);cancelled=true;break;}}
     if(!cancelled){if(edgeCount>=256u){miss.status=2u;return miss;}edges[edgeCount]=edge;edgeCount++;}
    }
   }else{faces[retained]=candidate;retained++;}
  }
  vertices[vertexCount]=vertex;faceCount=retained;
  for(var index=0u;index<edgeCount;index++){if(edges[index].x!=0xffffffffu){if(faceCount>=128u){miss.status=2u;return miss;}faces[faceCount]=makeEPAFace(&vertices,edges[index].x,edges[index].y,vertexCount,interior);faceCount++;}}
  vertexCount++;
 }
 miss.status=2u;return miss;
}
fn appendConvexContact(pair:u32,hit:ConvexHit,previous:Manifold,first:u32,second:u32,firstTriangle:i32,secondTriangle:i32){
 if(hit.status==2u){manifolds[pair].padding.x++;atomicAdd(&meshTasks.unresolved,1u);return;}
 if(hit.status!=1u||hit.depth < -settings.solver.x){return;}
 var slot=manifolds[pair].count;
 for(var index=0u;index<slot;index++){if(distance(manifolds[pair].contacts[index].point.xyz,hit.point)<settings.solver.w&&dot(manifolds[pair].contacts[index].normal.xyz,hit.normal)>0.95){if(hit.depth>manifolds[pair].contacts[index].point.w){storeFeatureContact(pair,index,hit.point,hit.normal,hit.depth,previous,first,second,firstTriangle,secondTriangle);}return;}}
 if(slot>=4u){slot=0u;for(var index=1u;index<4u;index++){if(manifolds[pair].contacts[index].point.w<manifolds[pair].contacts[slot].point.w){slot=index;}}if(hit.depth<=manifolds[pair].contacts[slot].point.w){return;}}
 storeFeatureContact(pair,slot,hit.point,hit.normal,hit.depth,previous,first,second,firstTriangle,secondTriangle);manifolds[pair].count=min(4u,manifolds[pair].count+1u);
}

fn addMeshCounter(counter:ptr<storage,atomic<u32>,read_write>,increment:u32)->u32 {
 var previous=atomicLoad(counter);
 loop {
  let replacement=previous+min(increment,0xffffffffu-previous);
  let exchanged=atomicCompareExchangeWeak(counter,previous,replacement);
  if(exchanged.exchanged){return previous;}
  previous=exchanged.old_value;
 }
}
fn reserveMeshTasks(requested:u32)->vec2u {
 let reserved=addMeshCounter(&meshTasks.count,requested);
 let start=min(reserved,MESH_TASK_CAPACITY);
 let retained=min(requested,MESH_TASK_CAPACITY-start);
 atomicMax(&targets.dispatch,(start+retained+31u)/32u);
 if(retained<requested){addMeshCounter(&meshTasks.overflow,requested-retained);}
 return vec2u(start,retained);
}
fn queueMeshPairContacts(pair:u32,first:u32,second:u32,previous:Manifold){
 // Traverse the smaller mesh outside; every candidate still retains both original IDs.
 let outerMesh=select(first,second,bodies.colliders[first].padding.w>bodies.colliders[second].padding.w);
 let queryMesh=select(first,second,outerMesh==first);
 let outerOffset=u32(bodies.colliders[outerMesh].policies.z);
 let outerCount=u32(bodies.colliders[outerMesh].policies.w);
 let queryOffset=u32(bodies.colliders[queryMesh].policies.z);
 let queryCount=u32(bodies.colliders[queryMesh].policies.w);
 let queryCenter=colliderLocal(outerMesh,colliderPosition(queryMesh)-colliderPosition(outerMesh));
 let queryExtent=shapeWorldExtent(queryMesh);
 var outerExtent=vec3f(0);
 for(var coordinate=0u;coordinate<3u;coordinate++){
  outerExtent[coordinate]=dot(abs(axis(outerMesh,coordinate)),queryExtent)+settings.solver.x;
 }
 let outerLower=queryCenter-outerExtent;let outerUpper=queryCenter+outerExtent;
 var candidates=0u;var written=0u;var reservation=vec2u(0);
 for(var traversal=0u;traversal<2u;traversal++){
  var work=0u;var exhausted=false;var outerNode=0u;
  loop {
   if(outerNode>=outerCount){break;}
   if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
   let minimum=readGeometry(outerOffset+outerNode*3u);
   let maximum=readGeometry(outerOffset+outerNode*3u+1u);
   if(any(maximum.xyz<outerLower)||any(minimum.xyz>outerUpper)){outerNode=u32(minimum.w);continue;}
   if(maximum.w>0.0){
    let start=u32(readGeometry(outerOffset+outerNode*3u+2u).x);
    for(var offset=0u;offset<u32(maximum.w);offset++){
     if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
     let outerTriangle=start+offset;
     var lower=vec3f(3.402823e38);var upper=vec3f(-3.402823e38);
     for(var corner=0u;corner<3u;corner++){
      let worldPoint=colliderPosition(outerMesh)+rotate(colliderRotation(outerMesh),triangleVertex(outerMesh,outerTriangle,corner));
      let point=colliderLocal(queryMesh,worldPoint-colliderPosition(queryMesh));
      lower=min(lower,point);upper=max(upper,point);
     }
     lower-=vec3f(settings.solver.x);upper+=vec3f(settings.solver.x);
     var queryNode=0u;
     loop {
      if(queryNode>=queryCount){break;}
      if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
      let queryMinimum=readGeometry(queryOffset+queryNode*3u);
      let queryMaximum=readGeometry(queryOffset+queryNode*3u+1u);
      if(any(queryMaximum.xyz<lower)||any(queryMinimum.xyz>upper)){queryNode=u32(queryMinimum.w);continue;}
      if(queryMaximum.w>0.0){
       let queryStart=u32(readGeometry(queryOffset+queryNode*3u+2u).x);
       for(var queryIndex=0u;queryIndex<u32(queryMaximum.w);queryIndex++){
        if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
        let queryTriangle=queryStart+queryIndex;
        let firstPoint=triangleVertex(queryMesh,queryTriangle,0u);
        let secondPoint=triangleVertex(queryMesh,queryTriangle,1u);
        let thirdPoint=triangleVertex(queryMesh,queryTriangle,2u);
        if(any(max(firstPoint,max(secondPoint,thirdPoint))<lower)||any(min(firstPoint,min(secondPoint,thirdPoint))>upper)){continue;}
        if(traversal==0u){candidates++;}
        else if(written<reservation.y){
         meshTasks.entries[reservation.x+written].key=vec4u(first,second,
          select(queryTriangle,outerTriangle,outerMesh==first),select(outerTriangle,queryTriangle,outerMesh==first));
         written++;
        }
       }
      }
      if(exhausted){break;}queryNode++;
     }
     if(exhausted){break;}
    }
   }
   if(exhausted){break;}outerNode++;
  }
  if(traversal==0u){
   if(exhausted){addMeshCounter(&meshTasks.incomplete,1u);}
   reservation=reserveMeshTasks(candidates);
  }
 }
 manifolds[pair].padding=vec3u(previous.count,reservation.x,reservation.y);
}

fn collideExtended(pair:u32,first:u32,second:u32,previous:Manifold){
 if(any(abs(colliderPosition(second)-colliderPosition(first))>shapeWorldExtent(first)+shapeWorldExtent(second)+vec3f(settings.solver.x))){return;}
 let firstShape=bodies.colliders[first].shape;let secondShape=bodies.colliders[second].shape;
 var firstRadius=length(firstShape.xyz);var secondRadius=length(secondShape.xyz);
 if(firstShape.w==0.0){firstRadius=firstShape.x;}if(secondShape.w==0.0){secondRadius=secondShape.x;}
 if(firstShape.w==4.0||firstShape.w==5.0){firstRadius=max(firstShape.x,firstShape.y)+firstShape.z*0.5;}if(secondShape.w==4.0||secondShape.w==5.0){secondRadius=max(secondShape.x,secondShape.y)+secondShape.z*0.5;}
 if(firstShape.w!=6.0&&secondShape.w!=6.0&&distance(colliderPosition(first),colliderPosition(second))>firstRadius+secondRadius+settings.solver.x){return;}
 if(!permitsPlaneContact(first,second)||!permitsPlaneContact(second,first)){return;}
 // Two unbounded zero-volume surfaces do not define a finite contact manifold.
 if(firstShape.w==6.0&&secondShape.w==6.0){manifolds[pair].padding.x++;atomicAdd(&meshTasks.unresolved,1u);return;}
 let firstMesh=bodies.colliders[first].shape.w==3.0;let secondMesh=bodies.colliders[second].shape.w==3.0;
 if(!firstMesh&&!secondMesh){appendConvexContact(pair,convexContact(first,second,-1,-1),previous,first,second,-1,-1);return;}
 if(firstMesh&&secondMesh){queueMeshPairContacts(pair,first,second,previous);return;}
 let mesh=select(second,first,firstMesh);let convex=select(first,second,firstMesh);
 var lower=vec3f(0);var upper=vec3f(0);
 for(var index=0u;index<3u;index++){let direction=axis(mesh,index);lower[index]=colliderLocal(mesh,pairShapeSupport(convex,mesh,-direction,-1)-colliderPosition(mesh))[index]-settings.solver.x;upper[index]=colliderLocal(mesh,pairShapeSupport(convex,mesh,direction,-1)-colliderPosition(mesh))[index]+settings.solver.x;}
 let offset=u32(bodies.colliders[mesh].policies.z);let count=u32(bodies.colliders[mesh].policies.w);
 var candidates=0u;var written=0u;var taskStart=0u;var taskCount=0u;
 for(var traversal=0u;traversal<2u;traversal++){
 var node=0u;var work=0u;var exhausted=false;
 loop{if(node>=count){break;}if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;let minimum=readGeometry(offset+node*3u);let maximum=readGeometry(offset+node*3u+1u);
  if(any(maximum.xyz<lower)||any(minimum.xyz>upper)){node=u32(minimum.w);continue;}
  if(maximum.w>0.0){let start=u32(readGeometry(offset+node*3u+2u).x);for(var index=0u;index<u32(maximum.w);index++){
   if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
   let firstPoint=triangleVertex(mesh,start+index,0u);let secondPoint=triangleVertex(mesh,start+index,1u);let thirdPoint=triangleVertex(mesh,start+index,2u);
   if(any(max(firstPoint,max(secondPoint,thirdPoint))<lower)||any(min(firstPoint,min(secondPoint,thirdPoint))>upper)){continue;}
   if(traversal==0u){candidates++;}
   else if(written<taskCount){meshTasks.entries[taskStart+written].key=vec4u(first,second,select(0xffffffffu,start+index,firstMesh),select(start+index,0xffffffffu,firstMesh));written++;}
  }}
  if(exhausted){break;}node++;
 }
 if(traversal==0u){if(exhausted){addMeshCounter(&meshTasks.incomplete,1u);}let reservation=reserveMeshTasks(candidates);taskStart=reservation.x;taskCount=reservation.y;}
 }
 manifolds[pair].padding=vec3u(previous.count,taskStart,taskCount);
}
@compute @workgroup_size(32) fn meshCollide(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=min(atomicLoad(&meshTasks.count),MESH_TASK_CAPACITY)){return;}
 let key=meshTasks.entries[index].key;
 let hit=convexContact(key.x,key.y,i32(key.z),i32(key.w));
 meshTasks.entries[index].point=vec4f(hit.point,hit.depth);meshTasks.entries[index].normal=vec4f(hit.normal,f32(hit.status));
}
fn collectMeshContacts(){
 for(var pair=0u;pair<PAIR_CAPACITY;pair++){
  let first=getFirstCollider(pair);let second=getSecondCollider(pair);
  if(first>=second||(bodies.colliders[first].shape.w!=3.0&&bodies.colliders[second].shape.w!=3.0)){continue;}
  var previous=manifolds[pair];previous.count=previous.padding.x;
  let start=manifolds[pair].padding.y;let count=manifolds[pair].padding.z;
  manifolds[pair].count=0u;manifolds[pair].padding.x=0u;
  for(var index=0u;index<count;index++){let task=meshTasks.entries[start+index];var hit:ConvexHit;hit.point=task.point.xyz;hit.depth=task.point.w;hit.normal=task.normal.xyz;hit.status=u32(task.normal.w);appendConvexContact(pair,hit,previous,first,second,i32(task.key.z),i32(task.key.w));}
 }
}
`;function Ol(e,t=!1){let n=`
const EMPTY_PAIR:u32=0u;
const DELETED_PAIR:u32=0xffffffffu;
fn metadataWord(component:u32)->u32{return bodies.geometry[component/4u][component%4u];}
fn candidateCount()->u32{return min(metadataWord(${e.diagnosticOffset}u),PAIR_CAPACITY);}
fn candidatePair(index:u32)->vec2u{let component=${e.pairOffset}u+index*2u;return vec2u(metadataWord(component),metadataWord(component+1u));}
fn getFirstCollider(pair:u32)->u32{return manifolds[pair].first;}
fn getSecondCollider(pair:u32)->u32{return manifolds[pair].second;}
fn claimManifold(first:u32,second:u32)->u32{
 let key=((first<<16u)|second)+1u;
 var mixed=(key^(key>>16u))*2246822519u;
 mixed=(mixed^(mixed>>13u))*3266489917u;
 let origin=(mixed^(mixed>>16u))&(PAIR_CAPACITY-1u);
 for(var attempt=0u;attempt<8u;attempt++){
  var reusable=DELETED_PAIR;var observed=DELETED_PAIR;
  for(var probe=0u;probe<min(PAIR_CAPACITY,128u);probe++){
   let slot=(origin+probe)&(PAIR_CAPACITY-1u);let stored=atomicLoad(&targets.keys[slot].key);
   if(stored==key){targets.keys[slot].epoch=targets.frame;manifolds[slot].first=first;manifolds[slot].second=second;return slot;}
   if(stored==DELETED_PAIR&&reusable==DELETED_PAIR){reusable=slot;observed=DELETED_PAIR;}
   if(stored==EMPTY_PAIR){if(reusable==DELETED_PAIR){reusable=slot;observed=EMPTY_PAIR;}break;}
  }
  if(reusable==DELETED_PAIR){break;}
  let claimed=atomicCompareExchangeWeak(&targets.keys[reusable].key,observed,key);
  if(claimed.exchanged){
   targets.keys[reusable].epoch=targets.frame;manifolds[reusable].previousCount=0u;
   manifolds[reusable].first=first;manifolds[reusable].second=second;return reusable;
  }
 }
 atomicAdd(&targets.cacheDropped,1u);return DELETED_PAIR;
}
var<workgroup> cacheEpoch:u32;
@compute @workgroup_size(64) fn prepare(@builtin(local_invocation_index) invocation:u32){
 if(invocation==0u){targets.frame++;cacheEpoch=targets.frame;atomicStore(&targets.cacheDropped,0u);}
 workgroupBarrier();
 for(var pair=invocation;pair<PAIR_CAPACITY;pair+=64u){
  let existing=atomicLoad(&targets.keys[pair].key);
  if(existing!=EMPTY_PAIR&&existing!=DELETED_PAIR&&!colliderScheduled(manifolds[pair].first)){targets.keys[pair].epoch=cacheEpoch;continue;}
  manifolds[pair].previousCount=manifolds[pair].count;
  manifolds[pair].count=0u;manifolds[pair].padding=vec3u(0);
  let key=atomicLoad(&targets.keys[pair].key);
  if(key!=EMPTY_PAIR&&key!=DELETED_PAIR&&cacheEpoch-targets.keys[pair].epoch>2u){
   atomicStore(&targets.keys[pair].key,DELETED_PAIR);manifolds[pair].previousCount=0u;
  }
 }
}
`;return t?(n=n.replaceAll(`targets.keys[slot].epoch=targets.frame;`,`targets.keys[slot].epoch=targets.instanceFrames[first/INSTANCE_COLLIDERS];`),n=n.replace(`targets.keys[reusable].epoch=targets.frame;`,`
   journalManifold(reusable,observed);atomicAdd(&targets.reserved2,1u);
   let instance=first/INSTANCE_COLLIDERS;
   targets.links[reusable]=atomicExchange(&targets.instanceHeads[instance],reusable+1u);
   targets.keys[reusable].epoch=targets.instanceFrames[instance];`),n=n.slice(0,n.indexOf(`var<workgroup> cacheEpoch`))+`
// Every slot has one owner during preparation and one successful claimant during discovery.
// A retired slot reused in this step retains its first snapshot and appears once in the journal.
fn journalManifold(pair:u32,key:u32){
 if(targets.journalMarks[pair]!=0u){return;}
 targets.journalKeys[pair]=vec2u(key,targets.keys[pair].epoch);targets.journalLinks[pair]=targets.links[pair];
 targets.journalManifolds[pair]=manifolds[pair];targets.journalMarks[pair]=1u;
 let index=atomicAdd(&targets.reserved0,1u);targets.journalSlots[index]=pair;
}
@compute @workgroup_size(64) fn prepareStart(@builtin(local_invocation_index) invocation:u32){
 let count=atomicLoad(&targets.reserved0);
 for(var index=invocation;index<count;index+=64u){targets.journalMarks[targets.journalSlots[index]]=0u;}
 storageBarrier();
 if(invocation==0u){targets.frame++;atomicStore(&targets.reserved0,0u);atomicStore(&targets.reserved1,0u);atomicStore(&targets.reserved2,0u);atomicStore(&targets.cacheDropped,0u);}
}
@compute @workgroup_size(64) fn prepare(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=atomicLoad(&ensemble[0])){return;}
 let instance=atomicLoad(&ensemble[INSTANCE_QUEUE+work]);
 targets.instanceFrames[instance]++;let epoch=targets.instanceFrames[instance];
 var previous=0u;var link=atomicLoad(&targets.instanceHeads[instance]);
 loop{
  if(link==0u){break;}let pair=link-1u;let next=targets.links[pair];journalManifold(pair,atomicLoad(&targets.keys[pair].key));atomicAdd(&targets.reserved1,1u);
  manifolds[pair].previousCount=manifolds[pair].count;manifolds[pair].count=0u;manifolds[pair].padding=vec3u(0);
  if(epoch-targets.keys[pair].epoch>2u){
   atomicStore(&targets.keys[pair].key,DELETED_PAIR);manifolds[pair].previousCount=0u;
   if(previous==0u){atomicStore(&targets.instanceHeads[instance],next);}else{targets.links[previous-1u]=next;}
  }else{previous=link;}
  link=next;
 }
}
`,n):n}function kl(e,t,n=e,r=!1,i,a=!1,o=65536,s=`fn jointActive(body:u32)->bool{return false;} fn jointExcluded(first:u32,second:u32)->bool{return false;}`,c=!1,l=0,u=0,d=0,f=!0,p,m){return`
const COMPACT_CONTACTS:bool=${f};
const BODY_COUNT: u32 = ${e}u;
const COLLIDER_COUNT: u32 = ${n}u;
const ITERATIONS: u32 = ${t}u;
const MESH_TRAVERSAL_BUDGET:u32=${o}u;
const PAIR_CAPACITY:u32=${i?.maximumPairs??n*n}u;
struct Body { inertia: vec4f, inertiaOrientation: vec4f, motion: vec4f }
struct Collider { shape: vec4f, position: vec4f, orientation: vec4f, material: vec4f, policies: vec4f, padding: vec4f }
struct Metadata { bodies: array<Body, BODY_COUNT>, colliders: array<Collider, COLLIDER_COUNT>, exclusions: array<vec2f, COLLIDER_COUNT>, geometry: array<vec4u> }
struct Target { position: vec4f, orientation: vec4f }
struct CacheKey { key:atomic<u32>, epoch:u32 }
struct GeneralConstraint {axes:vec4f,limits:vec4f,control:vec4f,drive:vec4f}
struct JointState {impulses:array<f32,8>, control:vec4f, limits:vec4f, motor:vec4f, drive:vec4f, spring:vec4f, general:GeneralConstraint}
struct Targets { entries:array<Target,BODY_COUNT>, dispatch:atomic<u32>, vertical:u32, depth:u32 ${i?`, frame:u32, cacheDropped:atomic<u32>, reserved0:${m?`atomic<u32>`:`u32`}, reserved1:${m?`atomic<u32>`:`u32`}, reserved2:${m?`atomic<u32>`:`u32`}, keys:array<CacheKey,PAIR_CAPACITY>`:``}${m?`, instanceHeads:array<atomic<u32>,${e/m}>, instanceFrames:array<u32,${e/m}>, links:array<u32,PAIR_CAPACITY>, journalMarks:array<u32,PAIR_CAPACITY>, journalSlots:array<u32,PAIR_CAPACITY>, journalKeys:array<vec2u,PAIR_CAPACITY>, journalLinks:array<u32,PAIR_CAPACITY>, savedHeads:array<u32,${e/m}>, savedFrames:array<u32,${e/m}>, savedHeader:array<u32,8>, journalManifolds:array<Manifold,PAIR_CAPACITY>`:``}${d?`, joints:array<JointState,${d}>`:``} }
struct Contact { point: vec4f, normal: vec4f, impulse: vec4f, tangent: vec4f, firstAnchor:vec4f, secondAnchor:vec4f }
struct Manifold { contacts: array<Contact, 4>, count: u32, first:u32, second:u32, previousCount:u32, padding: vec3u }
struct Settings { gravity: vec4f, solver: vec4f, sleep: vec4f, stability: vec4f }
@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> orientations: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(5) var<storage, read> bodies: Metadata;
@group(0) @binding(6) var<storage, read_write> manifolds: array<Manifold>;
@group(0) @binding(7) var<storage, read_write> sleepStates: array<vec4f>;
@group(0) @binding(9) var<storage, read_write> targets: Targets;
${qc(e,m,p,r)}
${i?Ol(i,!!m):`
fn getFirstCollider(pair:u32)->u32{return pair/COLLIDER_COUNT;}
fn getSecondCollider(pair:u32)->u32{return pair%COLLIDER_COUNT;}
`}
fn rotate(rotation: vec4f, vector: vec3f) -> vec3f {
  return vector + 2.0 * cross(rotation.xyz, cross(rotation.xyz, vector) + rotation.w * vector);
}
fn local(body: u32, vector: vec3f) -> vec3f {return rotate(vec4f(-orientations[body].xyz, orientations[body].w), vector);}
fn multiplyRotation(first: vec4f, second: vec4f) -> vec4f {return vec4f(first.w*second.xyz+second.w*first.xyz+cross(first.xyz,second.xyz),first.w*second.w-dot(first.xyz,second.xyz));}
fn colliderBody(collider: u32) -> u32 {return u32(bodies.colliders[collider].position.w);}
fn colliderPosition(collider: u32) -> vec3f {let body=colliderBody(collider);return positions[body].xyz+rotate(orientations[body],bodies.colliders[collider].position.xyz);}
fn colliderRotation(collider: u32) -> vec4f {return multiplyRotation(orientations[colliderBody(collider)],bodies.colliders[collider].orientation);}
fn colliderLocal(collider: u32, vector: vec3f) -> vec3f {let rotation=colliderRotation(collider);return rotate(vec4f(-rotation.xyz,rotation.w),vector);}
fn axis(collider: u32, index: u32) -> vec3f {var unit=vec3f(0);unit[index]=1;return rotate(colliderRotation(collider),unit);}
fn readGeometry(index:u32)->vec4f{return bitcast<vec4f>(bodies.geometry[index]);}
fn excludes(first:u32,second:u32)->bool {
 ${p?`if(first/${p}u!=second/${p}u){return true;}`:``}
 if(jointExcluded(colliderBody(first),colliderBody(second))){return true;}
 let range=bodies.exclusions[first];let start=u32(range.x);let count=u32(range.y);
 var lower=0u;var upper=count;
 loop{if(lower>=upper){break;}let middle=(lower+upper)/2u;let component=start+middle;
  if(u32(readGeometry(component/4u)[component%4u])<second){lower=middle+1u;}else{upper=middle;}}
 let component=start+lower;
 return lower<count && u32(readGeometry(component/4u)[component%4u])==second;
}
fn bodyCenter(body:u32)->vec3f {let metadata=bodies.bodies[body];return vec3f(metadata.inertia.w,metadata.motion.zw);}
fn dynamic(body: u32) -> bool {return bodies.bodies[body].motion.x==1.0;}
fn principalRotation(body: u32) -> vec4f {return multiplyRotation(orientations[body],bodies.bodies[body].inertiaOrientation);}
fn combineMaterial(first: f32, second: f32, firstPolicy: f32, secondPolicy: f32, friction: bool) -> f32 {
 let policy=min(firstPolicy,secondPolicy);
 if(policy==0.0) {return (first+second)*0.5;} if(policy==1.0) {return min(first,second);}
 if(policy==2.0) {return max(first,second);} if(policy==3.0) {return first*second;}
 return select(min(first,second),sqrt(first*second),friction);
}
fn frictionCoefficient(first: u32, second: u32, sliding: bool) -> f32 {
 let firstMaterial=bodies.colliders[first].material;let secondMaterial=bodies.colliders[second].material;
 return combineMaterial(select(firstMaterial.y,firstMaterial.z,sliding),select(secondMaterial.y,secondMaterial.z,sliding),bodies.colliders[first].policies.y,bodies.colliders[second].policies.y,true);
}
fn inverseInertia(body: u32, vector: vec3f) -> vec3f {
 let rotation=principalRotation(body);return rotate(rotation,rotate(vec4f(-rotation.xyz,rotation.w),vector)*bodies.bodies[body].inertia.xyz);
}
fn extent(body: u32, direction: vec3f) -> f32 {
 if(bodies.colliders[body].shape.w == 0.0) {return bodies.colliders[body].shape.x;}
 return dot(abs(colliderLocal(body,direction)), bodies.colliders[body].shape.xyz);
}
fn support(body: u32, direction: vec3f) -> vec3f {
 if(bodies.colliders[body].shape.w == 0.0) {return colliderPosition(body) + direction * bodies.colliders[body].shape.x;}
 let side=select(vec3f(-1),vec3f(1),colliderLocal(body,direction)>=vec3f(0));
 return colliderPosition(body) + rotate(colliderRotation(body), side*bodies.colliders[body].shape.xyz);
}
fn vertex(body: u32, index: u32) -> vec3f {
 let side=vec3f(select(-1.0,1.0,(index&1u)!=0u),select(-1.0,1.0,(index&2u)!=0u),select(-1.0,1.0,(index&4u)!=0u));
 return colliderPosition(body)+rotate(colliderRotation(body),side*bodies.colliders[body].shape.xyz);
}
fn pointVelocity(body: u32, point: vec3f) -> vec3f {
 return velocities[body].xyz+cross(angularVelocities[body].xyz,point-positions[body].xyz);
}
fn applyImpulse(body: u32, point: vec3f, impulse: vec3f) {
 if(!dynamic(body)) {return;}
 velocities[body]=vec4f(velocities[body].xyz+impulse*velocities[body].w,velocities[body].w);
 angularVelocities[body]=vec4f(angularVelocities[body].xyz+inverseInertia(body,cross(point-positions[body].xyz,impulse)),0);
}
fn impulseResponse(first:u32,second:u32,point:vec3f,direction:vec3f)->vec3f {
 let firstLever=point-positions[first].xyz;let secondLever=point-positions[second].xyz;
 return direction*(velocities[first].w+velocities[second].w)+
 cross(inverseInertia(first,cross(firstLever,direction)),firstLever)+cross(inverseInertia(second,cross(secondLever,direction)),secondLever);
}
fn effectiveMass(first:u32,second:u32,point:vec3f,direction:vec3f)->f32 {
 return dot(direction,impulseResponse(first,second,point,direction));
}
// Solve the coupled two-dimensional tangent response, then project the accumulated
// impulse into the static cone or onto the dynamic cone. No arbitrary slip-speed switch.
fn solveFriction(firstCollider:u32,secondCollider:u32,contact:Contact,relative:vec3f)->vec3f {
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
 let normal=contact.normal.xyz;let point=contact.point.xyz;
 let reference=select(vec3f(1,0,0),vec3f(0,1,0),abs(normal.x)>0.7);
 let firstTangent=normalize(cross(normal,reference));let secondTangent=cross(normal,firstTangent);
 let firstResponse=impulseResponse(first,second,point,firstTangent);
 let secondResponse=impulseResponse(first,second,point,secondTangent);
 let firstDiagonal=dot(firstTangent,firstResponse);let secondDiagonal=dot(secondTangent,secondResponse);
 let coupling=dot(firstTangent,secondResponse);let determinant=firstDiagonal*secondDiagonal-coupling*coupling;
 var increment=vec2f(0);
 let slip=vec2f(dot(relative,firstTangent),dot(relative,secondTangent));
 if(determinant>1e-6*firstDiagonal*secondDiagonal&&firstDiagonal>0.0&&secondDiagonal>0.0){
  increment=vec2f(secondDiagonal*slip.x-coupling*slip.y,firstDiagonal*slip.y-coupling*slip.x)/determinant;
 }else{
  // Locked inertia can make both coordinates describe one rotational DOF.
  // For a rank-one positive semidefinite K, K+ = K / trace(K)^2.
  let trace=firstDiagonal+secondDiagonal;
  if(trace>0.0){increment=vec2f((firstDiagonal/trace)*slip.x+(coupling/trace)*slip.y,(coupling/trace)*slip.x+(secondDiagonal/trace)*slip.y)/max(1e-30,trace);}
 }
 var tangent=contact.tangent.xyz-normal*dot(contact.tangent.xyz,normal)-firstTangent*increment.x-secondTangent*increment.y;
 let magnitude=length(tangent);let staticLimit=frictionCoefficient(firstCollider,secondCollider,false)*contact.impulse.x;
 if(magnitude>staticLimit){
  let dynamicLimit=frictionCoefficient(firstCollider,secondCollider,true)*contact.impulse.x;
  tangent*=min(1.0,dynamicLimit/max(1e-30,magnitude));
 }
 return tangent;
}
@compute @workgroup_size(64) fn integrate(@builtin(global_invocation_id) invocation: vec3u) {
 ${r&&!m?`if(invocation.x==0u){atomicStore(&meshTasks.count,0u);atomicStore(&meshTasks.overflow,0u);atomicStore(&meshTasks.unresolved,0u);atomicStore(&meshTasks.incomplete,0u);atomicStore(&targets.dispatch,0u);targets.vertical=1u;targets.depth=1u;}`:``}
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);
 let rotation=orientations[body]; orientations[body]=select(vec4f(0,0,0,1),normalize(rotation),dot(rotation,rotation)>0.000001);
 if(bodies.bodies[body].motion.x==2.0 && targets.entries[body].position.w>0.0) {
  velocities[body]=vec4f((targets.entries[body].position.xyz-positions[body].xyz)/settings.gravity.w,0);
  var difference=multiplyRotation(targets.entries[body].orientation,vec4f(-rotation.xyz,rotation.w));
  if(difference.w<0.0) {difference=-difference;}
  let sine=length(difference.xyz); var angular=vec3f(0);
  if(sine>0.000001) {angular=difference.xyz*(2.0*atan2(sine,difference.w)/(sine*settings.gravity.w));}
  angularVelocities[body]=vec4f(angular,0);return;
 }
 if(!dynamic(body) || sleepStates[body].y>0.5) {return;}
 velocities[body]=vec4f(velocities[body].xyz+settings.gravity.xyz*settings.gravity.w*bodies.bodies[body].motion.y,velocities[body].w);
 velocities[body]=vec4f(velocities[body].xyz*exp(-f32(${l})*settings.gravity.w),velocities[body].w);
 angularVelocities[body]=vec4f(angularVelocities[body].xyz*exp(-f32(${u})*settings.gravity.w),angularVelocities[body].w);
}
// Keys describe analytic features or a deterministic cooked surface triangle.
// Anchor distance remains mandatory: equal face keys alone cannot transfer friction.
fn contactFeature(collider:u32,point:vec3f,normal:vec3f)->u32 {
 let shape=bodies.colliders[collider].shape;
 if(shape.w==0.0){return 1u;}
 if(shape.w==1.0){
  var key=0u;
  // The midpoint moves inside the box as depth changes. Identify its supporting
  // face/edge/vertex from the outward local normal, independently of penetration.
  let tolerance=max(abs(normal.x),max(abs(normal.y),abs(normal.z)))*1e-4;
  for(var component=0u;component<3u;component++){
   var side=0u;
   if(abs(normal[component])>tolerance){side=select(1u,2u,normal[component]>=0.0);}
   key+=side*(1u<<(component*2u));
  }
  return key+1u;
 }
 if(shape.w==6.0){return select(1u,2u,normal.y<0.0);}
 if(shape.w==4.0||shape.w==5.0){return select(select(2u,3u,point.y>shape.z*0.5-1e-6),1u,point.y< -shape.z*0.5+1e-6);}
 if(shape.w==3.0){return 0u;}
 var nearest=1e30;var feature=0u;
 // Bounded by cooked triangle count. Mesh callers can supply the exact triangle key.
 for(var triangle=0u;triangle<u32(bodies.colliders[collider].padding.w);triangle++){
  let first=triangleVertex(collider,triangle,0u);let second=triangleVertex(collider,triangle,1u);let third=triangleVertex(collider,triangle,2u);
  let crossProduct=cross(second-first,third-first);let magnitude=length(crossProduct);
  let separation=abs(dot(point-first,crossProduct))/max(magnitude,1e-20);
  let alignment=abs(dot(normal,crossProduct))/max(magnitude,1e-20);
  let score=separation+(1.0-alignment)*settings.solver.w;
  if(score<nearest){nearest=score;feature=triangle;}
 }
 return u32(readGeometry(u32(bodies.colliders[collider].padding.z)+feature).w)/8u;
}
fn cookedContactFeature(collider:u32,triangle:i32,fallback:u32)->u32 {
 if(triangle<0){return fallback;}
 return u32(readGeometry(u32(bodies.colliders[collider].padding.z)+u32(triangle)).w)/8u;
}
fn storeFeatureContact(pair: u32, slot: u32, point: vec3f, normal: vec3f, depth: f32, previous: Manifold, firstCollider: u32, secondCollider: u32, firstTriangle:i32, secondTriangle:i32) {
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
 var contact: Contact; contact.point=vec4f(point,depth); contact.normal=vec4f(normal,0);
 let closing=dot(pointVelocity(second,point)-pointVelocity(first,point),normal);
 contact.normal.w=select(0.0,-closing*combineMaterial(bodies.colliders[firstCollider].material.x,bodies.colliders[secondCollider].material.x,bodies.colliders[firstCollider].policies.x,bodies.colliders[secondCollider].policies.x,false),closing < -settings.solver.z);
 // Match in material coordinates: common translation must not invalidate a contact.
 let firstAnchor=colliderLocal(firstCollider,point-colliderPosition(firstCollider));
 let secondAnchor=colliderLocal(secondCollider,point-colliderPosition(secondCollider));
 let firstFeature=cookedContactFeature(firstCollider,firstTriangle,contactFeature(firstCollider,firstAnchor,colliderLocal(firstCollider,normal)));
 let secondFeature=cookedContactFeature(secondCollider,secondTriangle,contactFeature(secondCollider,secondAnchor,colliderLocal(secondCollider,-normal)));
 contact.firstAnchor=vec4f(firstAnchor,f32(firstFeature));
 contact.secondAnchor=vec4f(secondAnchor,f32(secondFeature));
 var nearest=2.0*settings.solver.w*settings.solver.w; var found=false;
 for(var old=0u;old<previous.count;old++) {
  var used=false;
  for(var retained=0u;retained<max(slot,manifolds[pair].count);retained++) {if(retained!=slot&&manifolds[pair].contacts[retained].impulse.y==f32(old+1u)) {used=true;}}
  if(used) {continue;}
  let cached=previous.contacts[old];
  if(u32(cached.firstAnchor.w)!=firstFeature||u32(cached.secondAnchor.w)!=secondFeature){continue;}
  let firstDelta=cached.firstAnchor.xyz-firstAnchor;let secondDelta=cached.secondAnchor.xyz-secondAnchor;
  let firstDistance=dot(firstDelta,firstDelta);let secondDistance=dot(secondDelta,secondDelta);
  if(max(firstDistance,secondDistance)>settings.solver.w*settings.solver.w){continue;}
  let distance=firstDistance+secondDistance;
  if(distance<nearest && dot(cached.normal.xyz,normal)>0.95) {
   nearest=distance; contact.impulse=cached.impulse; contact.tangent=cached.tangent; contact.impulse.y=f32(old+1u); found=true;
  }
 }
 if(found) {
  contact.normal.w=0.0;
  contact.impulse.x*=settings.stability.x;contact.tangent=vec4f(contact.tangent.xyz*settings.stability.x,0);
  var tangent=contact.tangent.xyz-normal*dot(contact.tangent.xyz,normal);
  let limit=frictionCoefficient(firstCollider,secondCollider,false)*contact.impulse.x;
  if(length(tangent)>limit) {tangent*=limit/max(0.000001,length(tangent));}
  contact.tangent=vec4f(tangent,0);
 }
 manifolds[pair].contacts[slot]=contact;
}
struct BoxContactPatch { points:array<vec3f,16>, count:u32 }
fn clipBoxContact(reference:u32,incident:u32,faceAxis:u32,referenceNormal:vec3f,tolerance:f32)->BoxContactPatch {
 let referenceCenter=colliderPosition(reference)+referenceNormal*bodies.colliders[reference].shape[faceAxis];
 var incidentAxis=0u;var maximumAlignment=0.0;
 for(var index=0u;index<3u;index++) {let alignment=abs(dot(axis(incident,index),referenceNormal));if(alignment>maximumAlignment) {maximumAlignment=alignment;incidentAxis=index;}}
 let incidentNormal=axis(incident,incidentAxis)*select(1.0,-1.0,dot(axis(incident,incidentAxis),referenceNormal)>0.0);
 let incidentCenter=colliderPosition(incident)+incidentNormal*bodies.colliders[incident].shape[incidentAxis];
 let firstTangent=axis(incident,(incidentAxis+1u)%3u)*bodies.colliders[incident].shape[(incidentAxis+1u)%3u];
 let secondTangent=axis(incident,(incidentAxis+2u)%3u)*bodies.colliders[incident].shape[(incidentAxis+2u)%3u];
 var polygon: array<vec3f, 16>;var temporary: array<vec3f, 16>;
 polygon[0]=incidentCenter-firstTangent-secondTangent;polygon[1]=incidentCenter+firstTangent-secondTangent;
 polygon[2]=incidentCenter+firstTangent+secondTangent;polygon[3]=incidentCenter-firstTangent+secondTangent;
 var vertexCount=4u;
 for(var boundary=0u;boundary<4u;boundary++) {
  let tangentAxis=(faceAxis+1u+boundary/2u)%3u;
  let direction=axis(reference,tangentAxis)*select(-1.0,1.0,boundary%2u==0u);
  let limit=bodies.colliders[reference].shape[tangentAxis];var outputCount=0u;
  for(var index=0u;index<vertexCount;index++) {
   let start=polygon[index];let end=polygon[(index+1u)%vertexCount];
   let startDistance=dot(start-referenceCenter,direction)-limit;let endDistance=dot(end-referenceCenter,direction)-limit;
   if(startDistance<=0.0) {temporary[outputCount]=start;outputCount++;}
   if((startDistance<=0.0)!=(endDistance<=0.0)) {temporary[outputCount]=mix(start,end,startDistance/(startDistance-endDistance));outputCount++;}
  }
  vertexCount=outputCount;for(var index=0u;index<vertexCount;index++) {polygon[index]=temporary[index];}
 }
 var contactPatch:BoxContactPatch;
 for(var index=0u;index<vertexCount;index++) {if(dot(referenceCenter-polygon[index],referenceNormal)>=-tolerance) {contactPatch.points[contactPatch.count]=polygon[index];contactPatch.count++;}}
 return contactPatch;
}
fn storeContact(pair:u32,slot:u32,point:vec3f,normal:vec3f,depth:f32,previous:Manifold,first:u32,second:u32){
 storeFeatureContact(pair,slot,point,normal,depth,previous,first,second,-1,-1);
}
${wl}
${i?Tl:``}
${r?m?Dl.replace(`for(var pair=0u;pair<PAIR_CAPACITY;pair++){`,`for(var index=0u;index<atomicLoad(&targets.reserved0);index++){let pair=targets.journalSlots[index];if(manifolds[pair].padding.z==0u){continue;}`):Dl:``}
// SAT separates oriented boxes along all six face normals and nine edge cross products.
@compute @workgroup_size(64) fn collide(@builtin(global_invocation_id) invocation: vec3u) {
 ${i?`
 let candidate=invocation.x;if(candidate>=candidateCount()){return;}
 let colliders=candidatePair(candidate);let first=colliders.x;let second=colliders.y;
 if(bodies.colliders[first].material.w!=0.0||bodies.colliders[second].material.w!=0.0||first>=second||colliderBody(first)==colliderBody(second)||excludes(first,second)||excludes(second,first)||(!dynamic(colliderBody(first))&&!dynamic(colliderBody(second)))){return;}
 let pair=claimManifold(first,second);if(pair==DELETED_PAIR){return;}
 `:`
 let pair=invocation.x; if(pair>=PAIR_CAPACITY) {return;}
 let first=getFirstCollider(pair); let second=getSecondCollider(pair);
 `}
 var previous=manifolds[pair]; ${i?`previous.count=previous.previousCount;`:``} manifolds[pair].count=0u;
 ${r?`manifolds[pair].padding=vec3u(0);`:``}
 let firstBody=colliderBody(first);let secondBody=colliderBody(second);
 if(bodies.colliders[first].material.w!=0.0 || bodies.colliders[second].material.w!=0.0 || first>=second || firstBody==secondBody || (excludes(first,second)||excludes(second,first)) || (!dynamic(firstBody) && !dynamic(secondBody))) {return;}
 ${r?`manifolds[pair].padding=vec3u(0); if(bodies.colliders[first].shape.w>=2.0 || bodies.colliders[second].shape.w>=2.0){collideExtended(pair,first,second,previous);return;}`:``}
 let difference=colliderPosition(second)-colliderPosition(first);
 let firstSphere=bodies.colliders[first].shape.w==0.0; let secondSphere=bodies.colliders[second].shape.w==0.0;
 var normal=vec3f(0,0,1); var depth=1e20; var faceBody=first; var faceAxis=0u; var edgeContact=false;
 if(firstSphere && secondSphere) {
  let distance=length(difference); depth=bodies.colliders[first].shape.x+bodies.colliders[second].shape.x-distance;
  if(depth < -settings.solver.x) {return;}
  if(distance>0.000001) {normal=difference/distance;}
  let point=colliderPosition(first)+normal*(bodies.colliders[first].shape.x-depth*0.5);
  storeContact(pair,0u,point,normal,depth,previous,first,second); manifolds[pair].count=1u; return;
 }
 if(firstSphere || secondSphere) {
  let sphere=select(second,first,firstSphere); let box=select(first,second,firstSphere);
  let center=colliderLocal(box,colliderPosition(sphere)-colliderPosition(box)); let halfExtent=bodies.colliders[box].shape.xyz;
  var closest=clamp(center,-halfExtent,halfExtent); var delta=center-closest; let distance=length(delta);
  var boxNormal=vec3f(0,0,1);
  if(distance>0.000001) {boxNormal=rotate(colliderRotation(box),delta/distance);depth=bodies.colliders[sphere].shape.x-distance;}
  else {
   let distances=halfExtent-abs(center); var minimumAxis=0u;
   if(distances.y<distances.x) {minimumAxis=1u;} if(distances.z<distances[minimumAxis]) {minimumAxis=2u;}
   var localNormal=vec3f(0); localNormal[minimumAxis]=select(-1.0,1.0,center[minimumAxis]>=0.0);
   closest[minimumAxis]=localNormal[minimumAxis]*halfExtent[minimumAxis]; boxNormal=rotate(colliderRotation(box),localNormal);
   depth=bodies.colliders[sphere].shape.x+distances[minimumAxis];
  }
  if(depth < -settings.solver.x) {return;}
  normal=select(boxNormal,-boxNormal,firstSphere);
  storeContact(pair,0u,colliderPosition(box)+rotate(colliderRotation(box),closest),normal,depth,previous,first,second);
  manifolds[pair].count=1u;return;
 }
 for(var candidate=0u;candidate<15u;candidate++) {
  var direction=vec3f(0); var candidateBody=first; var candidateAxis=candidate;
  if(candidate<3u) {direction=axis(first,candidate);}
  else if(candidate<6u) {candidateBody=second;candidateAxis=candidate-3u;direction=axis(second,candidateAxis);}
  else {direction=cross(axis(first,(candidate-6u)/3u),axis(second,(candidate-6u)%3u));}
  let magnitude=length(direction);if(magnitude<0.0001) {continue;} direction/=magnitude;
  let overlap=extent(first,direction)+extent(second,direction)-abs(dot(difference,direction));
  if(overlap < -settings.solver.x) {return;}
  // Prefer face manifolds over nearly tied edge axes.
  if(overlap<depth-select(0.0,0.001,candidate>=6u)) {
   depth=overlap;normal=select(-direction,direction,dot(difference,direction)>=0.0);
   faceBody=candidateBody;faceAxis=candidateAxis;edgeContact=candidate>=6u;
  }
 }
 if(edgeContact) {
  // Closest points between the two supporting edge segments.
  var firstAxis=0u;var secondAxis=0u;var smallest=1e20;
  for(var horizontal=0u;horizontal<3u;horizontal++) {for(var vertical=0u;vertical<3u;vertical++) {
   let candidate=cross(axis(first,horizontal),axis(second,vertical));let magnitude=length(candidate);
   if(magnitude>0.0001) {let error=1.0-abs(dot(candidate/magnitude,normal));if(error<smallest) {smallest=error;firstAxis=horizontal;secondAxis=vertical;}}
  }}
  let firstDirection=axis(first,firstAxis);let secondDirection=axis(second,secondAxis);
  var firstCenter=support(first,normal);var secondCenter=support(second,-normal);
  firstCenter-=firstDirection*dot(firstCenter-colliderPosition(first),firstDirection);
  secondCenter-=secondDirection*dot(secondCenter-colliderPosition(second),secondDirection);
  let delta=firstCenter-secondCenter;let alignment=dot(firstDirection,secondDirection);let denominator=max(0.00001,1.0-alignment*alignment);
  var firstDistance=clamp((alignment*dot(secondDirection,delta)-dot(firstDirection,delta))/denominator,-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
  let secondDistance=clamp(dot(secondDirection,delta)+alignment*firstDistance,-bodies.colliders[second].shape[secondAxis],bodies.colliders[second].shape[secondAxis]);
  firstDistance=clamp(alignment*secondDistance-dot(firstDirection,delta),-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
  storeContact(pair,0u,(firstCenter+firstDirection*firstDistance+secondCenter+secondDirection*secondDistance)*0.5,normal,depth,previous,first,second);
  manifolds[pair].count=1u;return;
 }
 // Clip the incident face polygon against the four reference-face side planes.
 let reference=faceBody;let incident=select(first,second,reference==first);
 let referenceNormal=select(-normal,normal,reference==first);
 let referenceCenter=colliderPosition(reference)+referenceNormal*bodies.colliders[reference].shape[faceAxis];
 let contactPatch=clipBoxContact(reference,incident,faceAxis,referenceNormal,settings.solver.x);
 let acceptedCount=contactPatch.count;
 let contactCount=min(4u,acceptedCount);
 for(var index=0u;index<contactCount;index++) {
  let point=contactPatch.points[index*acceptedCount/contactCount];let separation=dot(referenceCenter-point,referenceNormal);
  storeContact(pair,index,point+referenceNormal*separation*0.5,normal,separation,previous,first,second);
 }
 manifolds[pair].count=contactCount;
}
${a?El(!!m):``}
${(a||c)&&r?`@compute @workgroup_size(1) fn meshCollect(){collectMeshContacts();}`:``}
${s}
${a&&c?`@compute @workgroup_size(1) fn parallelJointWarm(){solveJoints(true);} @compute @workgroup_size(1) fn parallelJointSolve(){solveJoints(false);}`:``}
fn root(body: u32) -> u32 {var current=body;for(var iteration=0u;iteration<BODY_COUNT;iteration++) {let parent=u32(sleepStates[current].z);if(parent==current) {break;}current=parent;}return current;}
@compute @workgroup_size(1) fn solve() {
 ${r&&!c?`collectMeshContacts();`:``}
 // Connected components include dynamic bodies only: a shared static floor must not join islands.
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].z=f32(body);}
 for(var pair=0u;pair<PAIR_CAPACITY;pair++) {
  if(manifolds[pair].count==0u) {continue;}let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
  if(bodies.bodies[first].motion.x==2.0 && length(velocities[first].xyz)+length(angularVelocities[first].xyz)>0.000001 && dynamic(second)) {sleepStates[second].y=0.0;sleepStates[second].x=0.0;}
  if(bodies.bodies[second].motion.x==2.0 && length(velocities[second].xyz)+length(angularVelocities[second].xyz)>0.000001 && dynamic(first)) {sleepStates[first].y=0.0;sleepStates[first].x=0.0;}
  if(dynamic(first) && dynamic(second)) {let firstRoot=root(first);let secondRoot=root(second);sleepStates[max(firstRoot,secondRoot)].z=f32(min(firstRoot,secondRoot));}
 }
 ${c?`connectJoints();`:``}
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].w=1.0;}
 for(var body=0u;body<BODY_COUNT;body++) {if(dynamic(body) && sleepStates[body].y<0.5) {sleepStates[root(body)].w=0.0;}}
 for(var body=0u;body<BODY_COUNT;body++) {if(dynamic(body) && sleepStates[root(body)].w<0.5) {if(sleepStates[body].y>0.5) {sleepStates[body].x=0.0;}sleepStates[body].y=0.0;}}
 for(var pair=0u;pair<PAIR_CAPACITY;pair++) {
  if(manifolds[pair].count==0u){continue;}
  let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
  if((sleepStates[first].y>0.5 || !dynamic(first)) && (sleepStates[second].y>0.5 || !dynamic(second))) {continue;}
  for(var slot=0u;slot<manifolds[pair].count;slot++) {
   let contact=manifolds[pair].contacts[slot];let impulse=contact.normal.xyz*contact.impulse.x+contact.tangent.xyz;
   applyImpulse(first,contact.point.xyz,-impulse);applyImpulse(second,contact.point.xyz,impulse);
  }
 }
 ${c?`solveJoints(true);`:``}
 for(var iteration=0u;iteration<ITERATIONS;iteration++) {
  ${c?`solveJoints(false);`:``}
  for(var pair=0u;pair<PAIR_CAPACITY;pair++) {
   let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
   if((sleepStates[first].y>0.5 || !dynamic(first)) && (sleepStates[second].y>0.5 || !dynamic(second))) {continue;}
   for(var slot=0u;slot<manifolds[pair].count;slot++) {
    var contact=manifolds[pair].contacts[slot];let point=contact.point.xyz;let normal=contact.normal.xyz;
    let relative=pointVelocity(second,point)-pointVelocity(first,point);
    let bias=min(settings.stability.z,settings.stability.y*max(0.0,contact.point.w-settings.solver.x)/settings.gravity.w);
    if(effectiveMass(first,second,point,normal)<=0.0) {continue;}
    let increment=(max(bias,contact.normal.w)-dot(relative,normal))/max(1e-30,effectiveMass(first,second,point,normal));
    let accumulated=max(0.0,contact.impulse.x+increment);let change=accumulated-contact.impulse.x;contact.impulse.x=accumulated;
    applyImpulse(first,point,-normal*change);applyImpulse(second,point,normal*change);
    let tangent=solveFriction(firstCollider,secondCollider,contact,pointVelocity(second,point)-pointVelocity(first,point));
    let tangentChange=tangent-contact.tangent.xyz;contact.tangent=vec4f(tangent,0);
    applyImpulse(first,point,-tangentChange);applyImpulse(second,point,tangentChange);
    manifolds[pair].contacts[slot]=contact;
   }
  }
 }
}
// Exact constant-world-angular-velocity update. This removes the normalized Euler
// phase lag at high spin; torque-free asymmetric-body dynamics remain timestep dependent.
fn advanceOrientation(rotation:vec4f,angular:vec3f)->vec4f {
 let speed=length(angular);let halfAngle=speed*settings.gravity.w*0.5;
 let factor=select(settings.gravity.w*0.5,sin(halfAngle)/max(speed,1e-20),speed>1e-10);
 return normalize(multiplyRotation(vec4f(angular*factor,cos(halfAngle)),rotation));
}
fn finishBody(body:u32) {
  if(!bodyScheduled(body)||bodies.bodies[body].motion.x==0.0 || sleepStates[body].y>0.5) {return;}
  if(bodies.bodies[body].motion.x==2.0) {
   if(targets.entries[body].position.w>0.0) {positions[body]=vec4f(targets.entries[body].position.xyz,positions[body].w);orientations[body]=targets.entries[body].orientation;}
   else {positions[body]=vec4f(positions[body].xyz+velocities[body].xyz*settings.gravity.w,positions[body].w);let rotation=orientations[body];let angular=angularVelocities[body].xyz;orientations[body]=advanceOrientation(rotation,angular);}
   return;
  }
  positions[body]=vec4f(positions[body].xyz+velocities[body].xyz*settings.gravity.w,positions[body].w);
  let rotation=orientations[body];let angular=angularVelocities[body].xyz;
  let inversePrincipalInertia=bodies.bodies[body].inertia.xyz;
  let movableAxes=inversePrincipalInertia>vec3f(0);
  let principal=principalRotation(body);
  let principalAngular=rotate(vec4f(-principal.xyz,principal.w),angular);
  let principalMomentum=principalAngular/select(vec3f(1),inversePrincipalInertia,movableAxes);
  let momentum=rotate(principal,select(vec3f(0),principalMomentum,movableAxes));
  orientations[body]=advanceOrientation(rotation,angular);
  // Preserve world angular momentum as the inertia tensor rotates.
  // Infinite inertia blocks torque response without erasing prescribed spin.
  let preservedSpin=rotate(principalRotation(body),select(principalAngular,vec3f(0),movableAxes));
  angularVelocities[body]=vec4f(inverseInertia(body,momentum)+preservedSpin,0);
  let quiet=length(velocities[body].xyz)<settings.sleep.y && length(angular)<settings.sleep.z;
  sleepStates[body].x=select(0.0,sleepStates[body].x+settings.gravity.w,quiet);
 }
@compute @workgroup_size(1) fn finish() {
 for(var body=0u;body<BODY_COUNT;body++){finishBody(body);}
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].w=1.0;}
 for(var body=0u;body<BODY_COUNT;body++) {if(dynamic(body) && (jointActive(body) || settings.sleep.x<=0.0 || sleepStates[body].x<settings.sleep.x)) {sleepStates[root(body)].w=0.0;}}
 for(var body=0u;body<BODY_COUNT;body++) {
  if(dynamic(body) && sleepStates[root(body)].w>0.5) {sleepStates[body].y=1.0;velocities[body]=vec4f(0,0,0,velocities[body].w);angularVelocities[body]=vec4f(0);}
 }
}
`}function Al(e,t=0){let n=(e.length-4)/16,r=e[0],i=Math.max(t,r-n),a=new Float32Array(e.buffer,e.byteOffset,e.length),o=[];for(let t=i;t<r;t++){let r=4+t%n*16;o.push({sequence:e[r],step:e[r+1],phase:e[r+2]===0?`begin`:e[r+2]===1?`impact`:`end`,bodies:[e[r+4],e[r+5]],colliders:[e[r+6],e[r+7]],point:[a[r+8],a[r+9],a[r+10]],normalImpulse:a[r+11],normal:[a[r+12],a[r+13],a[r+14]]})}return{sequence:r,step:e[1],dropped:Math.max(0,r-t-n),saturated:e[2]!==0,events:o}}function jl(e,t,n=!1){return`
${n?`@group(0) @binding(14) var<storage,read> eventStatistics:array<u32>;`:``}
struct ContactEvent { stamp:vec4u, identifiers:vec4u, point:vec4f, normal:vec4f }
struct EventRing { sequence:u32, step:u32, saturated:u32, reserved:u32, entries:array<ContactEvent,${e}> }
@group(0) @binding(12) var<storage,read_write> contactHistory:array<vec4u>;
@group(0) @binding(13) var<storage,read_write> contactEvents:EventRing;
fn emitContact(first:u32,second:u32,phase:u32,point:vec3f,normal:vec3f,impulse:f32){
 if(contactEvents.sequence==0xffffffffu){contactEvents.saturated=1u;return;}
 let slot=contactEvents.sequence%${e}u;contactEvents.sequence++;
 contactEvents.entries[slot]=ContactEvent(vec4u(contactEvents.sequence,contactEvents.step,phase,0),vec4u(colliderBody(first),colliderBody(second),first,second),vec4f(point,impulse),vec4f(normal,0));
}
@compute @workgroup_size(1) fn recordContacts(){
 ${n?`if(eventStatistics[1]!=0u||eventStatistics[15]!=0u){return;}`:``}
 if(contactEvents.step==0xffffffffu){contactEvents.saturated=1u;return;}contactEvents.step++;
 for(var pair=0u;pair<PAIR_CAPACITY;pair++){
  let previous=contactHistory[pair];let hasContact=manifolds[pair].count>0u;
  let first=getFirstCollider(pair);let second=getSecondCollider(pair);
  if(!colliderScheduled(first)){continue;}
  let same=previous.x==first&&previous.y==second;
  if(previous.z!=0u&&(!hasContact||!same)){emitContact(previous.x,previous.y,2u,vec3f(0),vec3f(0),0);}
  if(hasContact){
   var impulse=0.0;var strongest=0u;
   for(var contact=0u;contact<manifolds[pair].count;contact++){
    impulse+=max(0.0,manifolds[pair].contacts[contact].impulse.x);
    if(manifolds[pair].contacts[contact].impulse.x>manifolds[pair].contacts[strongest].impulse.x){strongest=contact;}
   }
   let contact=manifolds[pair].contacts[strongest];
   if(previous.z==0u||!same){emitContact(first,second,0u,contact.point.xyz,contact.normal.xyz,impulse);}
   else if(impulse>${t}){emitContact(first,second,1u,contact.point.xyz,contact.normal.xyz,impulse);}
  }
  contactHistory[pair]=vec4u(first,second,select(0u,1u,hasContact),0u);
 }
}`}var Ml=`
struct Query { origin:vec4f, direction:vec4f, settings:vec4u }
struct QueryHit { identifiers:vec4u, point:vec4f, normal:vec4f }
struct QueryOutput { count:u32, total:u32, reserved:vec2u, hits:array<QueryHit> }
@group(0) @binding(12) var<uniform> query:Query;
@group(0) @binding(13) var<storage,read> querySelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> queryOutput:QueryOutput;
@compute @workgroup_size(64) fn queryColliders(@builtin(global_invocation_id) invocation:vec3u){
 let collider=invocation.x;if(collider>=COLLIDER_COUNT){return;}
 queryOutput.hits[collider]=QueryHit();
 if(querySelection[collider]==0u){return;}
  let shape=bodies.colliders[collider].shape;
  let origin=colliderLocal(collider,query.origin.xyz-colliderPosition(collider));
  let direction=colliderLocal(collider,query.direction.xyz);
  var point=origin;var normal=vec3f(0);var distance=0.0;var hit=false;
  var complete=1u;
  if(query.settings.x==2u||shape.w>1.0){
   if(query.settings.x==1u){let surface=closestSurface(collider,origin);hit=surface.distance<=query.origin.w;point=surface.point;normal=select(vec3f(0),(origin-point)/max(length(origin-point),1e-20),surface.distance>0.0);complete=surface.complete;if(shape.w==6.0&&shape.z==0.0&&origin.y<0.0){hit=false;}}
   else{let sweep=sweepSphere(collider,origin,direction,query.direction.w,query.origin.w,false);hit=sweep.hit!=0u;point=sweep.point;normal=sweep.normal;distance=sweep.distance;complete=sweep.complete;}
  }else if(query.settings.x==1u){
   if(shape.w==0.0){let lengthFromCenter=length(origin);hit=lengthFromCenter<=shape.x+query.origin.w;normal=select(vec3f(1,0,0),origin/max(lengthFromCenter,1e-20),lengthFromCenter>1e-20);point=normal*shape.x;}
   else {point=clamp(origin,-shape.xyz,shape.xyz);let separation=origin-point;let lengthFromSurface=length(separation);hit=lengthFromSurface<=query.origin.w;normal=separation/max(lengthFromSurface,1e-20);}
  }else if(shape.w==0.0){
   let projection=dot(origin,direction);
   // Avoid cancellation between large squared distances for distant rays.
   let perpendicular=origin-direction*projection;let discriminant=shape.x*shape.x-dot(perpendicular,perpendicular);
   if(dot(origin,origin)<=shape.x*shape.x){hit=true;}
   else if(discriminant>=0.0){distance=-projection-sqrt(discriminant);hit=distance>=0.0;point=origin+direction*distance;normal=normalize(point);}
  }else{
   var enter=0.0;var leave=query.direction.w;hit=true;
   for(var coordinate=0u;coordinate<3u;coordinate++){
    if(direction[coordinate]==0.0){if(abs(origin[coordinate])>shape[coordinate]){hit=false;}}
    else{
     let first=(-shape[coordinate]-origin[coordinate])/direction[coordinate];let second=(shape[coordinate]-origin[coordinate])/direction[coordinate];
     let lower=min(first,second);let upper=max(first,second);
     if(lower>enter){enter=lower;normal=vec3f(0);normal[coordinate]=select(1.0,-1.0,direction[coordinate]>0.0);}
     leave=min(leave,upper);
    }
   }
   distance=enter;point=origin+direction*distance;hit=hit&&enter<=leave&&leave>=0.0;
  }
  queryOutput.hits[collider]=QueryHit(vec4u(colliderBody(collider),collider,select(0u,1u,hit&&distance<=query.direction.w),complete),vec4f(colliderPosition(collider)+rotate(colliderRotation(collider),point),distance),vec4f(rotate(colliderRotation(collider),normal),0));
}
@compute @workgroup_size(1) fn reduceQueries(){
 queryOutput.count=0u;queryOutput.total=0u;queryOutput.reserved=vec2u(0);var nearest=query.direction.w;
 for(var collider=0u;collider<COLLIDER_COUNT;collider++){
  if(querySelection[collider]==0u){continue;}
  let candidate=queryOutput.hits[collider];if(candidate.identifiers.w==0u){queryOutput.reserved.x++;}
  if(candidate.identifiers.z==0u){continue;}queryOutput.total++;
  var slot=queryOutput.count;
  if(query.settings.x!=1u){if(candidate.point.w>nearest){continue;}if(queryOutput.count>0u&&candidate.point.w==nearest){continue;}nearest=candidate.point.w;slot=0u;}
  if(slot>=query.settings.y){continue;}queryOutput.hits[slot]=candidate;queryOutput.count=max(queryOutput.count,slot+1u);
 }
}
`,Nl=class{worldOrigin=[0,0,0];id;count;timeStep;colliderCount;colliderStorageCount;broadPhase;solver;maximumPairs;poseMatrices=null;poseBounds=null;encodePosePublication;positions=null;orientations=null;velocities=null;angularVelocities=null;sleepStates=null;contactEvents=null;triggerEvents=null;triggerCursor=0;triggerRead=null;eventCursor=0;eventRead=null;queryComputation=null;queryReduction=null;querySettings=null;querySelection=null;queryOutput=null;queryPending=!1;targets=null;simulationStatistics=null;colliders;props;ownedBuffers=[];ensembleBuffer=null;ensembleResetOrigin;ensembleReset;initialEnsembleBodies;manifolds=null;meshTasks=null;parallelState=null;parallelDispatch=null;device=null;control=null;invalidation=null;controlSettings=null;destroyed=!1;colliderShapeScales=new Map;gpuCheckpoints=new Set;broadPhaseCounters=null;constructor(e){for(let t of[e.linearDamping??0,e.angularDamping??0])if(!Number.isFinite(t)||t<0)throw Error(`Invalid damping`);if(e.publicationBounds&&(e.publicationBounds.length!==e.bodies.length||e.publicationBounds.some(e=>e.some(e=>e.length!==3||!e.every(e=>Number.isFinite(Math.fround(e))))||e[0].some((t,n)=>t>e[1][n]))))throw Error(`Invalid publication bounds`);if(this.id=e.id??`gpu-rigid-body-world`,this.count=e.bodies.length,this.solver=e.solver??`ordered`,![`ordered`,`parallel`].includes(this.solver))throw Error(`Invalid rigid-body solver`);ll(e.joints??[],e.bodies,this.solver);let t=e.bodies.reduce((e,t)=>e+(t.colliders?.length??1),0);this.broadPhase=e.broadPhase??(Math.max(this.count,t)>128?`hierarchical-grid`:`all-pairs`),this.timeStep=e.timeStep??1/120;let n=e.iterations??16;if([e.warmStartFactor??1,e.penetrationRecoveryFraction??.15,e.parallelRelaxation??1].some(e=>!Number.isFinite(e)||e<0||e>1)||e.parallelRelaxation===0||!Number.isFinite(e.maximumRecoverySpeed??2)||(e.maximumRecoverySpeed??2)<0)throw Error(`Invalid rigid-body stability settings`);if(e.failurePolicy&&![`report`,`rollback`].includes(e.failurePolicy))throw Error(`Invalid failure policy`);let r=e.eventCapacity??0;if(!Number.isInteger(r)||r<0||r>65536||!Number.isFinite(e.impactImpulseThreshold??1)||(e.impactImpulseThreshold??1)<0)throw Error(`Invalid contact event settings`);let i=e.maximumMeshTraversalTestsPerPair??65536;if(!Number.isInteger(i)||i<1||i>1048576)throw Error(`Invalid mesh traversal budget`);let a=e.maximumCandidateTestsPerCollider??4096;if(!Number.isInteger(a)||a<1||a>65535)throw Error(`Invalid rigid-body traversal budget`);if(this.count<1||this.count>(this.broadPhase===`all-pairs`?128:65535)||!(this.timeStep>0)||!Number.isFinite(this.timeStep)||!Number.isInteger(n)||n<1||n>64)throw Error(`Invalid rigid-body capacity or timestep`);let o=[];for(let[t,n]of e.bodies.entries()){if(!Number.isFinite(n.mass??1)||(n.mass??1)<0)throw Error(`Invalid rigid body mass`);if(n.shape?n.colliders!==void 0:n.colliders===void 0)throw Error(`Supply shape or colliders`);let e=n.colliders??(n.shape?[{shape:n.shape}]:[]);for(let r of e){let e=Gc(r.shape);if(!Number.isFinite(e.volume)||!e.center.every(Number.isFinite)||!e.tensor.every(Number.isFinite))throw Error(`Invalid shape properties`);if((r.shape.type===`convex-hull`||r.shape.type===`triangle-mesh`)&&n.mode!==`static`&&n.mass!==0&&(!(e.volume>0)||(r.shape.type===`convex-hull`||r.shape.type===`triangle-mesh`)&&!r.shape.geometry.closed))throw Error(`Dynamic meshes require closed positive-volume geometry`);if(U(r.orientation),!(r.position??[]).every(Number.isFinite))throw Error(`Invalid collider position`);let i=r.material;if([i?.staticFriction??.6,i?.dynamicFriction??.6,i?.restitution??.1].some(e=>!Number.isFinite(e)||e<0)||(i?.restitution??.1)>1)throw Error(`Invalid collider material`);o.push({...r,body:t})}if(U(n.orientation),U(n.inertiaOrientation),n.inertiaOrientation&&!n.inertiaDiagonal)throw Error(`Inertia orientation requires diagonal`);if(!(n.centerOfMass??[]).every(Number.isFinite)||(n.inertiaDiagonal??[]).some(e=>!Number.isFinite(e)||e<0)||!Number.isFinite(n.gravityFactor??1))throw Error(`Invalid mass properties`);if(![...n.position,...n.velocity??[],...n.angularVelocity??[],...n.orientation??[]].every(Number.isFinite)||!Number.isFinite(n.friction??.6)||(n.friction??.6)<0||!Number.isFinite(n.restitution??.1)||(n.restitution??.1)<0||(n.restitution??.1)>1)throw Error(`Invalid rigid body`)}if(!(e.gravity??[0,0,-9.81]).every(Number.isFinite)||[e.contactSlop??.002,e.contactMatchDistance??.05,e.restitutionThreshold??.5,e.sleepAfter??.5,e.sleepLinearSpeed??.04,e.sleepAngularSpeed??.04].some(e=>!Number.isFinite(e)||e<0))throw Error(`Invalid rigid-body settings`);if(o.length>(this.broadPhase===`all-pairs`?128:65535))throw Error(`Rigid-body collider capacity exceeded`);for(let e of o)if(e.excludedColliders?.some(e=>!Number.isInteger(e)||e<0||e>=o.length))throw Error(`Invalid collider filter`);if(e.collisionPartitionSize!==void 0&&(!Number.isSafeInteger(e.collisionPartitionSize)||e.collisionPartitionSize<1||!o.length||o.length%e.collisionPartitionSize!==0||e.joints?.length||e.continuous||e.triggers?.length))throw Error(`Invalid collision partitions`);if(e.ensembleBodiesPerInstance!==void 0&&(!Number.isSafeInteger(e.ensembleBodiesPerInstance)||e.ensembleBodiesPerInstance<1||this.count%e.ensembleBodiesPerInstance!==0||!e.collisionPartitionSize||this.count/e.ensembleBodiesPerInstance!==o.length/e.collisionPartitionSize||this.solver!==`parallel`||this.broadPhase!==`hierarchical-grid`))throw Error(`Invalid ensemble scheduling layout`);if(this.colliderCount=o.length,this.colliderStorageCount=Math.max(1,o.length),o.length||o.push({body:0,shape:{type:`box`,halfExtents:[0,0,0]}}),this.maximumPairs=this.broadPhase===`all-pairs`?this.colliderStorageCount*this.colliderStorageCount:e.maximumPairs??2**Math.ceil(Math.log2(Math.max(64,this.colliderStorageCount*16))),![`all-pairs`,`hierarchical-grid`].includes(this.broadPhase)||!Number.isSafeInteger(this.maximumPairs)||this.maximumPairs<1||this.maximumPairs>1073741824||this.broadPhase===`hierarchical-grid`&&this.maximumPairs&this.maximumPairs-1)throw Error(`Invalid rigid-body pair capacity`);if(e.continuous){if(e.failurePolicy!==`rollback`||!Number.isInteger(e.continuous.maximumImpacts??4)||(e.continuous.maximumImpacts??4)<1||(e.continuous.maximumImpacts??4)>16||![`sphere-static`,`convex`].includes(e.continuous.mode??`sphere-static`)||!Number.isSafeInteger(e.continuous.maximumCandidates??this.maximumPairs)||(e.continuous.maximumCandidates??this.maximumPairs)<1||(e.continuous.maximumCandidates??this.maximumPairs)>1073741824||e.continuous.mode===`convex`&&(e.joints?.length||o.some(e=>[`plane`,`triangle-mesh`].includes(e.shape.type))))throw Error(`Invalid continuous settings`);for(let t of e.continuous.bodies){let n=e.bodies[t],r=o.filter(e=>e.body===t);if(!Number.isInteger(t)||!n||(n.mode??((n.mass??1)===0?`static`:`dynamic`))!==`dynamic`||n.mass===0||r.length!==1||r[0].isTrigger||e.continuous.mode!==`convex`&&r[0].shape.type!==`sphere`||e.continuous.mode!==`convex`&&(r[0].position??[0,0,0]).some((e,t)=>e!==(n.centerOfMass??[0,0,0])[t]))throw Error(`Invalid continuous body geometry`)}}if(e.triggers?.length){if(e.failurePolicy!==`rollback`||!Number.isInteger(e.triggerEventCapacity??256)||(e.triggerEventCapacity??256)<1||(e.triggerEventCapacity??256)>65536)throw Error(`Invalid trigger settings`);vl(e.triggers,o)}let s=structuredClone({colliders:o,props:e});this.colliders=s.colliders,this.props=s.props,e.ensembleBodiesPerInstance&&(this.initialEnsembleBodies=this.props.bodies.slice(0,e.ensembleBodiesPerInstance))}getStorageLayout(){let e=Qc(this.colliders),t=this.broadPhase===`hierarchical-grid`,n=this.colliders.some(e=>e.shape.type!==`sphere`&&e.shape.type!==`box`||e.isTrigger&&e.shape.type!==`sphere`),r=this.solver===`parallel`,i={packed:e,sparse:t,extended:n,parallel:r,...fl(this.count,this.colliderStorageCount,this.maximumPairs,e.geometry.length,t,n,r,this.props.eventCapacity??0,this.props.enableQueries??!1,this.props.failurePolicy===`rollback`,!!this.props.continuous,this.props.joints?.length??0,this.props.ensembleBodiesPerInstance?this.count/this.props.ensembleBodiesPerInstance:0)};this.props.continuous?.mode===`convex`&&(i.buffers=i.buffers.filter(e=>e.name!==`continuous-previous`),i.buffers.push({name:`continuous-dispatch`,byteLength:16,uniform:!1}),i.buffers.push({name:`continuous-work`,byteLength:64+2**Math.ceil(Math.log2(Math.max(1,this.colliders.length)))*32+this.count*64+(this.props.continuous.maximumCandidates??this.maximumPairs)*48,uniform:!1})),(this.props.publicationBounds||this.props.publishPoses)&&i.buffers.push({name:`pose-metadata`,byteLength:this.count*48,uniform:!1},{name:`pose-matrices`,byteLength:this.count*64,uniform:!1},{name:`pose-bounds`,byteLength:this.count*32,uniform:!1});let a=this.props.triggers?.length?vl(this.props.triggers,this.colliders):void 0;return a&&i.buffers.push({name:`trigger-previous`,byteLength:this.colliderStorageCount*16,uniform:!1},{name:`trigger-groups`,byteLength:a.groups.byteLength,uniform:!1},{name:`trigger-pairs`,byteLength:a.pairs.byteLength,uniform:!1},{name:`trigger-samples`,byteLength:Math.max(1,a.count)*16,uniform:!1},{name:`trigger-history`,byteLength:Math.max(1,a.count)*16,uniform:!1},{name:`trigger-events`,byteLength:16+(this.props.triggerEventCapacity??256)*32,uniform:!1}),this.props.ensembleBodiesPerInstance&&i.buffers.push({name:`ensemble`,byteLength:(16+9*this.count/this.props.ensembleBodiesPerInstance)*4,uniform:!1}),this.props.ensembleBodiesPerInstance&&i.buffers.push({name:`ensemble-buckets`,byteLength:(2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2)))+this.colliderStorageCount+2)*4,uniform:!1}),{...i,triggerLayout:a}}initializeEnsembleReset(){if(!this.device||!this.ensembleBuffer||this.destroyed)throw Error(`World has no ensemble scheduler`);return this.ensembleResetOrigin??=this.origin,this.ensembleReset??=Xc(this.device,this.id,this.ownedBuffers,this.count,this.props.ensembleBodiesPerInstance,this.props.collisionPartitionSize,this.maximumPairs),this.ensembleReset.byteLength}resetEnsembleInstance(e){if(this.assertEnsembleInstance(e),!this.ensembleReset)throw Error(`Ensemble reset image unavailable`);let t=e*this.props.ensembleBodiesPerInstance,n=e*this.props.collisionPartitionSize,r=n,i=this.initialEnsembleBodies.map(e=>{if(e.shape){let t=this.colliders[r++].shape;return{...e,shape:e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`?t:e.shape}}return{...e,colliders:e.colliders.map(e=>{let t=this.colliders[r++].shape;return{...e,shape:e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`?t:e.shape,excludedColliders:e.excludedColliders?.map(e=>e+n)}})}}),a=[...this.props.bodies];a.splice(t,i.length,...i),this.props.bodies=a;for(let e=n;e<n+this.props.collisionPartitionSize;e++)this.colliderShapeScales.delete(e);if(this.restoreColliderDefinitions(),this.ensembleReset.reset(e,this.origin.map((e,t)=>e-this.ensembleResetOrigin[t])),this.ensembleBuffer.write(new Uint32Array([0,0,0,0,1,1]),(16+e*8+1)*4),this.encodePosePublication){let e=this.device.createCommandEncoder();this.encodePosePublication(e),this.device.submit(e.finish())}}wakeEnsembleInstance(e){this.assertEnsembleInstance(e),this.ensembleBuffer.write(new Uint32Array([1]),(16+e*8+6)*4),this.sleepStates.write(new Uint32Array(this.props.ensembleBodiesPerInstance*4),e*this.props.ensembleBodiesPerInstance*16)}setEnsembleActive(e,t){this.assertEnsembleInstance(e),this.ensembleBuffer.write(new Uint32Array([t?1:0]),(16+e*8)*4)}async readEnsembleState(){if(!this.ensembleBuffer||this.destroyed)throw Error(`World has no ensemble scheduler`);return new Uint32Array((await this.ensembleBuffer.readAsync()).buffer)}async readEnsembleWork(){if(!this.ensembleBuffer||!this.targets||this.destroyed)throw Error(`World has no ensemble scheduler`);let e=this.ownedBuffers.find(e=>e.id===`${this.id}-ensemble-buckets`),t=2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2))),[n,r,i]=await Promise.all([this.ensembleBuffer.readAsync(0,4),this.targets.readAsync(this.count*32+20,12),e.readAsync(t*4,4)]),a=new Uint32Array(n.buffer)[0],[o,s,c]=new Uint32Array(r.buffer),l=a*this.props.ensembleBodiesPerInstance;return{activeInstances:a,activeBodies:l,touchedBuckets:new Uint32Array(i.buffer)[0],visitedContacts:s,claimedContacts:c,journaledContacts:o,bodySnapshotBytes:l*80,contactSnapshotBytes:o*416,allocatorSnapshotBytes:(8+a*2+o*3)*4,residentInstances:this.count/this.props.ensembleBodiesPerInstance,residentBodies:this.count,contactCapacity:this.maximumPairs}}assertEnsembleInstance(e){if(!this.ensembleBuffer||this.destroyed||!Number.isSafeInteger(e)||e<0||e>=this.count/this.props.ensembleBodiesPerInstance)throw Error(`Invalid ensemble instance`)}getCapacityInfo(){let{buffers:e}=this.getStorageLayout();return{bodyCount:this.count,colliderCount:this.colliderCount,maximumPairs:this.maximumPairs,pairWorkgroups:Math.ceil(this.maximumPairs/64),buffers:e,ownedBufferBytes:e.reduce((e,t)=>e+t.byteLength,0)}}addToGraph(e){if(this.device||this.destroyed)throw Error(`Rigid-body world already attached or destroyed`);let{packed:t,sparse:n,extended:r,parallel:i,geometryOffset:a,pairOffset:s,diagnosticOffset:c,metadataLength:l,parallelByteLength:u,triggerLayout:d,buffers:f}=this.getStorageLayout();if(Math.ceil(this.maximumPairs/64)>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Rigid-body pair dispatch exceeds device limits`);if(this.props.continuous?.mode===`convex`&&Math.max(Math.ceil((this.props.continuous.maximumCandidates??this.maximumPairs)/64),Math.ceil(2**Math.ceil(Math.log2(Math.max(1,this.colliders.length)))/64))>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Continuous candidate dispatch exceeds device limits`);for(let t of f){let n=t.uniform?e.device.limits.maxUniformBufferBindingSize:e.device.limits.maxStorageBufferBindingSize;if(t.byteLength>Math.min(e.device.limits.maxBufferSize,n))throw Error(`Rigid-body ${t.name} storage exceeds device limits`)}this.device=e.device;let p=(t,n,r=!1)=>{let i=e.device.createBuffer({id:`${this.id}-${t}`,...typeof n==`number`?{byteLength:n}:{data:n},usage:(r?o.UNIFORM:o.STORAGE)|o.COPY_DST|o.COPY_SRC|([`targets`,`parallel-dispatch`,`continuous-dispatch`,`ensemble`].includes(t)?o.INDIRECT:0)});return this.ownedBuffers.push(i),i},m=new Float32Array(this.count*4),h=new Float32Array(this.count*4),g=new Float32Array(this.count*4),_=new Float32Array(this.count*4),v=n?{maximumPairs:this.maximumPairs,pairOffset:s-a,diagnosticOffset:c-a}:void 0,y=new Float32Array(l);y.set(t.geometry,a);let b=Array.from({length:this.count},()=>[]);if(this.colliderCount)for(let e of this.colliders)b[e.body].push(e);for(let[e,t]of this.props.bodies.entries()){let n=t.mass??1,r=t.mode??(n===0?`static`:`dynamic`),i=t.centerOfMass??[0,0,0],a=U(t.orientation),o=$c(a,i);m.set([...t.position.map((e,t)=>e+o[t]),t.shape?.type===`sphere`?t.shape.radius:0],e*4),h.set(a,e*4),g.set([...r===`static`?[0,0,0]:t.velocity??[0,0,0],r===`dynamic`&&n?1/n:0],e*4),_.set(r===`static`?[0,0,0]:t.angularVelocity??[0,0,0],e*4);let s=el(n,b[e],i),c=t.inertiaDiagonal??s.diagonal,l=U(t.inertiaOrientation??(t.inertiaDiagonal?void 0:s.orientation));y.set([...c.map(e=>r===`dynamic`&&e?1/e:0),i[0],...l,r===`static`?0:r===`dynamic`?1:2,t.gravityFactor??1,i[1],i[2]],e*12)}let x=[`average`,`minimum`,`maximum`,`multiply`];for(let[e,n]of this.colliders.entries()){let r=this.props.bodies[n.body],i=n.material,a=r.centerOfMass??[0,0,0],o=(n.position??[0,0,0]).map((e,t)=>e-a[t]),s=t.shapes[e];y.set([...s.dimensions,...o,n.body,...U(n.orientation),i?.restitution??r.restitution??.1,i?.staticFriction??r.friction??.6,i?.dynamicFriction??r.friction??.6,n.isTrigger?1:0,i?.restitutionCombine?x.indexOf(i.restitutionCombine):4,i?.frictionCombine?x.indexOf(i.frictionCombine):4,...s.policies,...s.padding],this.count*12+e*24)}let S=this.count*12+this.colliderStorageCount*24;for(let[e,n]of t.filters.entries())y.set(n,S+e*2);this.positions=p(`positions`,m),this.orientations=p(`orientations`,h),this.velocities=p(`velocities`,g),this.angularVelocities=p(`angular-velocities`,_),this.sleepStates=p(`sleep`,this.count*16),this.targets=p(`targets`,this.props.ensembleBodiesPerInstance?ol(this.count,this.count/this.props.ensembleBodiesPerInstance,this.maximumPairs).byteLength:Math.ceil((this.count*32+(n?32+this.maximumPairs*8:16))/16)*16+(this.props.joints?.length??0)*176);for(let[e,t]of(this.props.joints??[]).entries())this.targets.write(dl(t),this.getJointStateOffset()+e*176);this.manifolds=p(`manifolds`,this.maximumPairs*416),r&&(this.meshTasks=p(`mesh-tasks`,3145744));let C=p(`bodies`,y);n&&(this.broadPhaseCounters={buffer:C,byteOffset:c*4});let w=p(`settings`,new Float32Array([...this.props.gravity??[0,0,-9.81],this.timeStep,this.props.contactSlop??.002,0,this.props.restitutionThreshold??.5,this.props.contactMatchDistance??.05,this.props.sleepAfter??.5,this.props.sleepLinearSpeed??.04,this.props.sleepAngularSpeed??.04,0,this.props.warmStartFactor??1,this.props.penetrationRecoveryFraction??.15,this.props.maximumRecoverySpeed??2,this.props.parallelRelaxation??1]),!0);if(i&&(this.parallelState=p(`parallel-state`,u),this.parallelDispatch=p(`parallel-dispatch`,48)),this.props.ensembleBodiesPerInstance){let e=this.count/this.props.ensembleBodiesPerInstance,t=new Uint32Array(16+e*9);for(let n=0;n<e;n++)t[16+n*8]=1,t[16+n*8+5]=1;this.ensembleBuffer=p(`ensemble`,t)}let T={settings:w,positions:this.positions,orientations:this.orientations,velocities:this.velocities,angularVelocities:this.angularVelocities,bodies:C,manifolds:this.manifolds,sleepStates:this.sleepStates,targets:this.targets,...this.meshTasks?{meshTasks:this.meshTasks}:{},...this.parallelState?{parallelState:this.parallelState,parallelDispatch:this.parallelDispatch}:{},...n?{minima:p(`minima`,this.colliderStorageCount*12),maxima:p(`maxima`,this.colliderStorageCount*12)}:{}},E={...T,...this.ensembleBuffer?{ensemble:this.ensembleBuffer}:{}},D=Object.entries(E).map(([t,n],r)=>({name:t,buffer:n,location:t===`ensemble`?28:t===`parallelDispatch`?27:t===`parallelState`?26:t===`minima`?24:t===`maxima`?25:r>=8?r+1:r,resource:e.importBuffer({id:`${this.id}-${t}`,byteLength:n.byteLength,usage:r===0?o.UNIFORM:o.STORAGE|o.COPY_SRC|([`targets`,`parallelDispatch`,`ensemble`].includes(t)?o.INDIRECT:0)},n)})),O={attributes:[],bindings:D.map(({name:e,location:t})=>{let n={name:e,location:t,group:0};return t===0?{...n,type:`uniform`}:{...n,type:e===`bodies`?`read-only-storage`:`storage`}})},k=n?p(`object-attributes`,Uint32Array.from(this.colliders,e=>{let t=this.props.bodies[e.body],n=t.mode??((t.mass??1)===0?`static`:`dynamic`);return e.body|(n===`dynamic`?65536:0)})):null,A=k?e.createDataView(e.importBuffer({id:`${this.id}-object-attributes`,byteLength:k.byteLength,usage:o.STORAGE},k),{format:`uint32`,length:this.colliderStorageCount}):void 0,j=kl(this.count,this.props.iterations??16,this.colliderStorageCount,r,v,i,this.props.maximumMeshTraversalTestsPerPair??65536,ul(this.props.joints??[],this.props.bodies),!!this.props.joints?.length,this.props.linearDamping??0,this.props.angularDamping??0,this.props.joints?.length??0,this.props.compactContacts??!0,this.props.collisionPartitionSize,this.props.ensembleBodiesPerInstance),ee={parallelReset:[`parallelState`],parallelResetCounters:[`parallelState`],parallelActiveBodies:[`bodies`,`sleepStates`,`parallelState`],parallelPrepareSleep:[`parallelState`],parallelCompact:[`manifolds`,`parallelState`,...this.ensembleBuffer?[`targets`]:[]],parallelDispatchCount:[`parallelState`,`parallelDispatch`],parallelActive:[`bodies`,`sleepStates`,`manifolds`,`parallelState`],parallelActiveCount:[`parallelState`,`parallelDispatch`],parallelLink:[`velocities`,`angularVelocities`,`bodies`,`manifolds`,`parallelState`],parallelUnion:[`bodies`,`manifolds`,`parallelState`],parallelCompress:[`sleepStates`,`parallelState`],parallelWakeRoots:[`bodies`,`sleepStates`,`parallelState`],parallelWakeBodies:[`bodies`,`sleepStates`,`parallelState`],parallelWarm:[`positions`,`orientations`,`velocities`,`bodies`,`manifolds`,`sleepStates`,`parallelState`],parallelPairs:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`manifolds`,`sleepStates`,`parallelState`],parallelGather:[`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`parallelState`],parallelAdvance:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`targets`,...this.ensembleBuffer?[]:[`parallelState`]],parallelMarkSleep:[`settings`,`bodies`,`sleepStates`,`parallelState`],parallelSleep:[`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`parallelState`]};if(ee.parallelSolve=ee.parallelPairs,this.props.joints?.length){let e=[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`targets`];ee.parallelJointWarm=e,ee.parallelJointSolve=e,ee.parallelSolve=[...new Set([...ee.parallelSolve,...e])]}this.simulationStatistics=p(`simulation-statistics`,64);let te=e.importBuffer({id:`${this.id}-statistics`,byteLength:64,usage:o.STORAGE},this.simulationStatistics),ne=[`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`targets`].map(e=>{let t=D.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}}),re=this.props.failurePolicy===`rollback`?this.ensembleBuffer?xl(e,this.id,ne,{buffer:this.simulationStatistics,resource:te},D.find(e=>e.name===`ensemble`),D.find(e=>e.name===`manifolds`),this.props.ensembleBodiesPerInstance,this.maximumPairs,p):Sl(e,this.id,[`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`targets`,...this.ensembleBuffer?[]:[`manifolds`]].map(e=>{let t=D.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}}),{buffer:this.simulationStatistics,resource:te},p):void 0,ie=new Uint32Array(this.count);for(let e of this.props.continuous?.bodies??[])ie[e]=this.colliders.findIndex(t=>t.body===e)+1;let M=this.props.continuous?gl(e,this.id,j,this.count,ie,this.props.continuous.maximumImpacts??4,D,p,!!this.props.joints?.length,this.props.continuous.mode===`convex`?this.props.continuous.maximumCandidates??this.maximumPairs:0,this.colliderStorageCount,r,this.colliders.some(e=>e.shape.type===`convex-hull`)):void 0,ae=d?bl(e,this.id,j,this.colliderStorageCount,d,this.props.triggerEventCapacity??256,D,{name:`triggerStatistics`,buffer:this.simulationStatistics,resource:te,location:18},p,!!this.props.joints?.length,r):void 0;this.triggerEvents=ae?.events??null;let oe={integrate:`Apply gravity and advance body velocities and predicted poses for this timestep.`,prepare:`Reset broad-phase counters before generating potential collider pairs.`,bounds:`Compute world-space collider bounds for broad-phase collision detection.`,collide:`Find overlapping collider pairs and generate contact manifolds.`,meshCollide:`Generate contacts against triangle meshes and heightfields.`,meshCollect:`Collect mesh contacts for the parallel constraint solver.`,solve:`Resolve contact and joint constraints, including friction and restitution.`,finish:`Publish solved body poses and update sleeping state.`,parallelReset:`Initialize body ownership for parallel contact islands.`,parallelCompact:`Compact live contact manifolds into a reusable GPU work queue.`,parallelDispatchCount:`Build indirect workgroup counts from the compact contact queue.`,parallelLink:`Link bodies connected by active contacts or joints.`,parallelUnion:`Merge connected bodies into constraint islands.`,parallelCompress:`Compress island links to their root body.`,parallelWakeRoots:`Mark islands that must wake for active constraints.`,parallelWakeBodies:`Wake bodies belonging to active constraint islands.`,parallelActive:`Compact awake bodies and contacts after connected islands wake.`,parallelActiveCount:`Build indirect dispatches for awake solver work.`,parallelAdvance:`Advance body poses using the solved velocities.`,parallelMarkSleep:`Identify islands whose bodies are quiet enough to sleep.`,parallelSleep:`Put quiet constraint islands to sleep.`};for(let t of[...this.ensembleBuffer?[`ensembleClear`,`ensembleMark`,`ensembleCompact`,`ensembleDispatch`]:[],`integrate`,...n?[...this.ensembleBuffer?[`prepareStart`]:[],`prepare`,`bounds`]:[],`collide`,...r?[`meshCollide`]:[],...i?[...r?[`meshCollect`]:[],...this.ensembleBuffer&&this.props.compactContacts!==!1?[`parallelResetCounters`]:[],`parallelReset`,...this.props.compactContacts===!1?[]:[`parallelCompact`,`parallelDispatchCount`],`parallelLink`,`parallelUnion`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,...this.props.compactContacts===!1?[]:[...this.ensembleBuffer?[`parallelActiveBodies`]:[],`parallelActive`,`parallelActiveCount`],`parallelSolve`,`parallelAdvance`,...this.ensembleBuffer?[`parallelPrepareSleep`]:[],`parallelMarkSleep`,`parallelSleep`]:[...r&&this.props.joints?.length?[`meshCollect`]:[],`solve`,`finish`]]){if(t===`integrate`&&re?.save?.(),n&&t===`collide`){let t=D.find(e=>e.name===`bodies`),n=D.find(e=>e.name===`minima`),r=D.find(e=>e.name===`maxima`),i=this.ensembleBuffer?p(`ensemble-buckets`,(2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2)))+this.colliderStorageCount+2)*4):void 0;va(e,new nl({...i?{bucketState:e.createDataView(e.importBuffer({id:i.id,byteLength:i.byteLength,usage:o.STORAGE},i),{format:`uint32`,length:i.byteLength/4})}:{},id:`${this.id}-broad-phase`,objectMetadata:A,partitionSize:this.props.collisionPartitionSize,...this.ensembleBuffer?{activeInstances:e.createDataView(D.find(e=>e.name===`ensemble`).resource,{format:`uint32`,length:this.ensembleBuffer.byteLength/4})}:{},maximumCandidateTestsPerQuery:this.props.maximumCandidateTestsPerCollider,minima:e.createDataView(n.resource,{format:`float32x3`,length:this.colliderStorageCount}),maxima:e.createDataView(r.resource,{format:`float32x3`,length:this.colliderStorageCount}),pairs:e.createDataView(t.resource,{format:`uint32x2`,length:this.maximumPairs,byteOffset:s*4}),diagnostics:e.createDataView(t.resource,{format:`uint32`,length:8,byteOffset:c*4})}).getCommandNodes(e))}let a=[...t.startsWith(`parallel`)?D.filter(e=>!ee[t].includes(e.name)).map(e=>e.name):t===`meshCollect`?[`sleepStates`,...this.ensembleBuffer?[]:[`targets`],`parallelState`]:[`prepare`,`prepareStart`].includes(t)?D.filter(e=>!(t===`prepareStart`?[`targets`]:[`targets`,`manifolds`]).includes(e.name)).map(e=>e.name):t===`bounds`?D.filter(e=>![`settings`,`positions`,`orientations`,`bodies`,`minima`,`maxima`].includes(e.name)).map(e=>e.name):t===`meshCollide`?[`velocities`,`angularVelocities`,`manifolds`,`sleepStates`,`targets`]:t===`integrate`?[`manifolds`,...this.ensembleBuffer?[`meshTasks`]:[]]:t===`collide`?[`sleepStates`,...r||n||this.props.joints?.length?[]:[`targets`]]:t===`finish`?[`manifolds`,`meshTasks`]:this.props.joints?.length?[]:[`targets`],...t===`solve`&&this.props.joints?.length?[`meshTasks`]:[],...t.startsWith(`parallel`)?[]:[`parallelState`,`parallelDispatch`],...t===`bounds`?[]:[`minima`,`maxima`]],l=[`integrate`,`bounds`,`prepare`,`parallelReset`,`parallelPrepareSleep`,`parallelActiveBodies`,`parallelCompact`,`parallelActive`,`parallelLink`,`parallelUnion`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,`parallelAdvance`,`parallelMarkSleep`,`parallelSleep`].includes(t),u=e=>t.startsWith(`ensemble`)?e===`ensemble`||t===`ensembleClear`&&r&&[`meshTasks`,`targets`].includes(e):e===`ensemble`?l:!a.includes(e),d=D.filter(e=>u(e.name)),f={attributes:[],bindings:O.bindings.filter(e=>u(e.name)).map(e=>e.name===`ensemble`&&!t.startsWith(`ensemble`)?{...e,type:`read-only-storage`}:e)},m=i&&this.props.compactContacts!==!1&&[`parallelSolve`,`parallelLink`,`parallelUnion`,...this.ensembleBuffer?[`parallelActive`]:[]].includes(t),h=D.find(e=>e.name===`parallelDispatch`),g=D.find(e=>e.name===`ensemble`),_=!!(this.ensembleBuffer&&[`integrate`,`bounds`,`parallelAdvance`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,`parallelPrepareSleep`,`parallelMarkSleep`,`parallelSleep`,`parallelActiveBodies`,...this.props.compactContacts===!1?[]:[`parallelReset`]].includes(t)),v=_?[{buffer:g.resource,usage:`indirect`}]:m?[{buffer:h.resource,usage:`indirect`}]:[];if(t===`parallelSolve`){let t=[`parallelWarm`,`parallelPairs`,`parallelGather`,...this.props.joints?.length?[`parallelJointWarm`,`parallelJointSolve`]:[]],n=t.map(e=>({id:`${this.id}-${e}`,source:j,entryPoint:e,shaderLayout:{attributes:[],bindings:f.bindings.filter(t=>ee[e].includes(t.name))}})),r=e=>({encode:({computePass:n,getBuffer:r})=>{let i={};for(let e of d)i[e.name]=r(e.resource);for(let[n,r]of e.entries())Object.assign(r.bindings,Object.fromEntries(Object.entries(i).filter(([e])=>ee[t[n]].includes(e))));let a=e=>{m?e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(h.resource),indirectOffset:16}):e.kernel.dispatch(n,{bindings:e.bindings,x:Math.ceil(this.maximumPairs/64)})},o=e=>{m?e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(h.resource),indirectOffset:32}):e.kernel.dispatch(n,{bindings:e.bindings,x:Math.ceil(this.count/64)})};a(e[0]),o(e[2]),e[3]&&e[3].kernel.dispatch(n,{bindings:e[3].bindings,x:1});for(let t=0;t<(this.props.iterations??16);t++)a(e[1]),o(e[2]),e[4]&&e[4].kernel.dispatch(n,{bindings:e[4].bindings,x:1})},destroy:()=>{for(let t of e)t.kernel.destroy()}});e.addComputePass({id:`${this.id}-solve`,workload:{commandCount:(this.props.joints?.length?3:2)+(this.props.joints?.length?3:2)*(this.props.iterations??16)},description:oe.solve,resources:[...v,...d.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:e.name===`bodies`?`storage-read`:`storage-read-write`}))],compile:({device:e})=>r(n.map(t=>V(e,t))),compileAsync:async({device:e})=>r(await Promise.all(n.map(t=>H(e,t))))});continue}let y=e=>({encode:({computePass:n,getBuffer:r})=>{let i={};for(let e of d)i[e.name]=r(e.resource);if(Object.assign(e.bindings,i),_)e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(g.resource),indirectOffset:t===`bounds`?32:16});else if(m)e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(h.resource),indirectOffset:0});else if(t===`meshCollide`){let t=D.find(e=>e.name===`targets`);e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(t.resource),indirectOffset:this.count*32})}else e.kernel.dispatch(n,{bindings:e.bindings,x:t===`ensembleDispatch`?1:t.startsWith(`ensemble`)||this.ensembleBuffer&&[`prepare`,`parallelCompact`].includes(t)?Math.ceil(this.count/this.props.ensembleBodiesPerInstance/64):[`parallelLink`,`parallelUnion`,`parallelCompact`].includes(t)?Math.ceil(this.maximumPairs/64):t===`parallelActive`?Math.ceil(Math.max(this.maximumPairs,this.count)/64):[`parallelDispatchCount`,`parallelActiveCount`,`parallelResetCounters`].includes(t)?1:t.startsWith(`parallel`)?Math.ceil(this.count/64):t===`collide`?Math.ceil(this.maximumPairs/64):t===`bounds`?Math.ceil(this.colliderStorageCount/64):t===`integrate`?Math.ceil(this.count/64):1})},destroy:()=>e.kernel.destroy()}),b={id:`${this.id}-${t}`,source:t.startsWith(`ensemble`)?j:Jc(j),entryPoint:t,shaderLayout:f};e.addComputePass({id:b.id,workload:{commandCount:1},description:oe[t],resources:[...v,...d.map(e=>({buffer:e.resource,usage:e.location===0?`uniform`:e.name===`bodies`||e.name===`ensemble`&&!t.startsWith(`ensemble`)?`storage-read`:`storage-read-write`})),...t===`meshCollide`?[{buffer:D.find(e=>e.name===`targets`).resource,usage:`indirect`}]:[]],compile:({device:e})=>y(V(e,b)),compileAsync:async({device:e})=>y(await H(e,b))})}M?.finish(),ae?.sample(),re?.validate();let N=e=>{let t=D.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}};if(al(e,`${this.id}-diagnostics`,this.simulationStatistics,{statisticsResource:te,...re?{validity:re.validity}:{},...ae?{triggers:ae.samples}:{},...M?{continuous:{...M.status,count:this.count}}:{},...n?{broadPhase:{...N(`bodies`),wordOffset:c},targets:{...N(`targets`),wordOffset:this.count*8+4}}:{},...r?{meshTasks:N(`meshTasks`)}:{},...i?{parallelState:N(`parallelState`)}:{}}),re?.restore(),this.ensembleBuffer&&Yc(e,this.id,this.count/this.props.ensembleBodiesPerInstance,this.props.ensembleBodiesPerInstance,N(`bodies`),N(`sleepStates`),N(`ensemble`),{buffer:this.simulationStatistics,resource:te}),ae?.publish(),this.props.publicationBounds||this.props.publishPoses){let t=Cl(e,this.id,this.props.bodies,this.props.publicationBounds??this.props.bodies.map(()=>[[0,0,0],[0,0,0]]),N(`positions`),N(`orientations`),p);this.encodePosePublication=t.encode,this.poseMatrices=t.matrices,this.poseBounds=this.props.publicationBounds?t.bounds:null}if(this.props.eventCapacity){let t=p(`contact-history`,this.maximumPairs*16);this.contactEvents=p(`contact-events`,16+this.props.eventCapacity*64);let n=[...D.filter(e=>[`bodies`,`manifolds`,`ensemble`].includes(e.name)),...this.props.failurePolicy===`rollback`?[{name:`eventStatistics`,buffer:this.simulationStatistics,resource:te,location:14}]:[],...[{name:`contactHistory`,buffer:t,location:12},{name:`contactEvents`,buffer:this.contactEvents,location:13}].map(t=>({...t,resource:e.importBuffer({id:`${this.id}-${t.name}`,byteLength:t.buffer.byteLength,usage:o.STORAGE},t.buffer)}))],r={id:`${this.id}-contact-events`,source:j+jl(this.props.eventCapacity,this.props.impactImpulseThreshold??1,this.props.failurePolicy===`rollback`),entryPoint:`recordContacts`,shaderLayout:{bindings:n.map(({name:e,location:t})=>({name:e,location:t,group:0,type:[`bodies`,`eventStatistics`].includes(e)?`read-only-storage`:`storage`}))}},i=e=>({encode:({computePass:t,getBuffer:r})=>{Object.assign(e.bindings,Object.fromEntries(n.map(e=>[e.name,r(e.resource)]))),e.kernel.dispatch(t,{bindings:e.bindings,x:1})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:r.id,description:`Compare contact history and publish contact begin, persist, and end events.`,resources:n.map(e=>({buffer:e.resource,usage:[`bodies`,`eventStatistics`].includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>i(V(e.device,r)),compileAsync:async()=>i(await H(e.device,r))})}if(this.props.enableQueries){this.querySettings=p(`query-settings`,48,!0),this.querySelection=p(`query-selection`,Math.max(4,this.colliderStorageCount*4)),this.queryOutput=p(`query-output`,16+Math.max(1,this.colliderStorageCount)*48);let t={id:`${this.id}-queries`,source:j+pl+Ml,entryPoint:`queryColliders`,shaderLayout:{bindings:[...O.bindings.filter(e=>[`positions`,`orientations`,`bodies`].includes(e.name)),{name:`query`,group:0,location:12,type:`uniform`},{name:`querySelection`,group:0,location:13,type:`read-only-storage`},{name:`queryOutput`,group:0,location:14,type:`storage`}]},bindings:{positions:this.positions,orientations:this.orientations,bodies:C,query:this.querySettings,querySelection:this.querySelection,queryOutput:this.queryOutput}};this.queryComputation=V(e.device,t),this.queryReduction=V(e.device,{...t,entryPoint:`reduceQueries`,shaderLayout:{bindings:t.shaderLayout.bindings.filter(e=>[`query`,`querySelection`,`queryOutput`].includes(e.name))},bindings:{query:this.querySettings,querySelection:this.querySelection,queryOutput:this.queryOutput}})}this.controlSettings=p(`control-settings`,64,!0);let se={id:`${this.id}-impulse`,source:j+`
struct Command { impulse: vec4f, point: vec4f, orientation: vec4f, bodyIndex: vec4u }
@group(0) @binding(8) var<uniform> command: Command;
@compute @workgroup_size(1) fn control() {
 if(command.bodyIndex.y==0u) {applyImpulse(command.bodyIndex.x,command.point.xyz,command.impulse.xyz);}
 else if(command.bodyIndex.y==6u){
  let body=command.bodyIndex.x;let shift=rotate(orientations[body],command.impulse.xyz);
  positions[body]=vec4f(positions[body].xyz+shift,positions[body].w);
  var linear=velocities[body].xyz+cross(angularVelocities[body].xyz,shift);
  var angular=angularVelocities[body].xyz;
  if(command.point.w>0.0){linear=command.point.xyz;}
  if(command.orientation.w>0.0){angular=command.orientation.xyz;}
  if(bodies.bodies[body].motion.x==0.0){linear=vec3f(0);angular=vec3f(0);}
  velocities[body]=vec4f(linear,command.impulse.w);angularVelocities[body]=vec4f(angular,0);
  if(command.bodyIndex.z!=0u){targets.entries[body].position.w=0.0;}
 }
 else if(command.bodyIndex.y==5u){let body=command.bodyIndex.x;if(dynamic(body)){angularVelocities[body]=vec4f(angularVelocities[body].xyz+inverseInertia(body,command.impulse.xyz),0);}}
 else if(command.bodyIndex.y==2u) {applyImpulse(command.bodyIndex.x,positions[command.bodyIndex.x].xyz,command.impulse.xyz);}
 ${this.props.joints?.length?`else if(command.bodyIndex.y==3u){targets.joints[command.bodyIndex.x].control.x=command.impulse.x;}`:``}
 else {targets.entries[command.bodyIndex.x].position=vec4f(command.point.xyz,1);targets.entries[command.bodyIndex.x].orientation=command.orientation;}
}
@compute @workgroup_size(64) fn invalidate(@builtin(global_invocation_id) invocation:vec3u) {
 let index=invocation.x+invocation.y*4194240u;
 if(index<BODY_COUNT){sleepStates[index]=vec4f(0);}
 if(index<PAIR_CAPACITY){manifolds[index].count=0u;}
 ${this.props.joints?.length?`if(index<${this.props.joints.length}u){for(var row=0u;row<8u;row++){targets.joints[index].impulses[row]=0.0;}}`:``}
}`,entryPoint:`control`,shaderLayout:{bindings:[...O.bindings.filter(e=>![`settings`,`meshTasks`,`parallelState`,`parallelDispatch`,`minima`,`maxima`].includes(e.name)),{name:`command`,group:0,location:8,type:`uniform`}]},bindings:{...Object.fromEntries(Object.entries(T).filter(([e])=>![`settings`,`meshTasks`,`parallelState`,`parallelDispatch`,`minima`,`maxima`].includes(e))),command:this.controlSettings}};this.control=V(e.device,{...se,shaderLayout:{bindings:se.shaderLayout.bindings.filter(e=>![`sleepStates`,`manifolds`].includes(e.name))},bindings:Object.fromEntries(Object.entries(se.bindings).filter(([e])=>![`sleepStates`,`manifolds`].includes(e)))});let ce=[`sleepStates`,`manifolds`,...this.props.joints?.length?[`targets`]:[]];this.invalidation=V(e.device,{...se,id:`${this.id}-invalidate`,entryPoint:`invalidate`,shaderLayout:{bindings:se.shaderLayout.bindings.filter(e=>ce.includes(e.name))},bindings:Object.fromEntries(Object.entries(se.bindings).filter(([e])=>ce.includes(e)))})}invalidateState(e){this.ensembleBuffer?.write(new Uint32Array([1]),4);let t=Math.ceil(Math.max(this.count,this.maximumPairs,this.props.joints?.length??0)/64);this.invalidation.kernel.dispatch(e,{bindings:this.invalidation.bindings,x:Math.min(65535,t),y:Math.ceil(t/65535)})}get origin(){return[...this.worldOrigin]}shiftOrigin(e){if(!this.device||this.destroyed||this.queryPending||this.eventRead||this.triggerRead)throw Error(`Origin shifting requires an idle attached world`);if(e.length!==3||e.some(e=>!Number.isFinite(e)||Math.fround(e)!==e))throw Error(`Origin shift must be an exactly representable float32 vector`);e.every(e=>e===0)||(Kc(this.device,this.id,this.ownedBuffers,this.count,this.colliderStorageCount,this.maximumPairs,this.props.eventCapacity??0,e),this.worldOrigin=this.worldOrigin.map((t,n)=>t+e[n]),this.publishPoses())}getBodyMode(e){let t=this.props.bodies[e];return t?t.mode??((t.mass??1)===0?`static`:`dynamic`):void 0}applyImpulse(e,t,n){if(!this.control||!this.device||!this.controlSettings||this.destroyed||!Number.isInteger(e)||e<0||e>=this.count||![...t,...n??[]].every(Number.isFinite))throw Error(`Invalid rigid-body impulse`);let r=new ArrayBuffer(64);new Float32Array(r).set([...t,0,...n??[0,0,0],0]),new Uint32Array(r)[12]=e,new Uint32Array(r)[13]=n?0:2,this.controlSettings.write(new Uint8Array(r));let i=this.device.createCommandEncoder(),a=i.beginComputePass();this.control.kernel.dispatch(a,{bindings:this.control.bindings,x:1}),this.invalidateState(a),a.end(),this.device.submit(i.finish())}getBodyParameters(e,{deriveInertia:t=!0}={}){let n=this.props.bodies[e];if(!n||this.destroyed)throw Error(`Invalid body`);let{mode:r,mass:i,centerOfMass:a,inertiaDiagonal:o,inertiaOrientation:s,velocity:c,angularVelocity:l,gravityFactor:u}=n,d=el(i??1,this.colliders.filter(t=>t.body===e),a??[0,0,0]);return structuredClone({mode:r??((i??1)===0?`static`:`dynamic`),mass:i??1,centerOfMass:a??[0,0,0],inertiaDiagonal:o??(t?d.diagonal:void 0),inertiaOrientation:s??(t?o?[0,0,0,1]:d.orientation:void 0),velocity:c??[0,0,0],angularVelocity:l??[0,0,0],gravityFactor:u??1})}publishPoses(){if(!this.device||this.destroyed)throw Error(`Unavailable physics world`);if(!this.encodePosePublication)return;let e=this.device.createCommandEncoder();this.encodePosePublication(e),this.device.submit(e.finish())}setPublicationBounds(e){if(!this.poseBounds||e.length!==this.count||e.some(e=>e.length!==2||e.some(e=>e.length!==3||!e.every(e=>Number.isFinite(Math.fround(e))))||e[0].some((t,n)=>t>e[1][n])))throw Error(`Invalid publication bounds`);let t=this.ownedBuffers.find(e=>e.id===`${this.id}-pose-metadata`),n=new Float32Array(this.count*12);for(let[t,r]of this.props.bodies.entries())n.set([...r.centerOfMass??[0,0,0],0,...e[t][0],0,...e[t][1],0],t*12);t.write(n),this.props.publicationBounds=structuredClone(e)}getColliderShapeScale(e){return this.getColliderShape(e),[...this.colliderShapeScales.get(e)??[1,1,1]]}getColliderShape(e){let t=this.colliders[e];if(!Number.isInteger(e)||!t||this.destroyed)throw Error(`Invalid collider`);return structuredClone(t.shape)}setColliderShapes(e){if(!this.device||this.destroyed)throw Error(`World is not attached`);let t=new Set,n=e.map(e=>{let n=this.getColliderShape(e.collider),r=structuredClone(e.shape);if(e.shapeScale&&(e.shapeScale.length!==3||e.shapeScale.some(e=>!Number.isFinite(e)||e<=0)))throw Error(`Invalid collider shape scale`);if(t.has(e.collider)||n.type!==r.type||r.type===`convex-hull`||r.type===`triangle-mesh`)throw Error(`Shape edit requires a topology rebuild`);t.add(e.collider);let i=Gc(r),a=Qc([{shape:r}]).shapes[0];if(![...a.dimensions,i.volume,...i.tensor,...i.center].every(e=>Number.isFinite(Math.fround(e))))throw Error(`Shape exceeds float32 range`);return{collider:e.collider,shape:r,dimensions:a.dimensions,shapeScale:e.shapeScale}}),r=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!r)throw Error(`World is not attached`);for(let e of n)r.write(new Float32Array(e.dimensions),this.count*48+e.collider*96),this.colliders[e.collider].shape=e.shape,e.shapeScale&&this.colliderShapeScales.set(e.collider,[...e.shapeScale]);for(let e of new Set(n.map(e=>this.colliders[e.collider].body)))this.updateColliderDefinitions(e),this.setBodyParameters(e,{})}setColliderMaterial(e,t){let n=this.colliders[e];if(!this.device||this.destroyed||!Number.isInteger(e)||!n)throw Error(`Invalid collider`);let r=[`average`,`minimum`,`maximum`,`multiply`];if([t.staticFriction??.6,t.dynamicFriction??.6,t.restitution??.1].some(e=>!Number.isFinite(Math.fround(e))||e<0)||(t.restitution??.1)>1||[t.frictionCombine,t.restitutionCombine].some(e=>e!==void 0&&!r.includes(e)))throw Error(`Invalid collider material`);let i=this.props.bodies[n.body],a=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!a)throw Error(`World is not attached`);a.write(new Float32Array([t.restitution??i.restitution??.1,t.staticFriction??i.friction??.6,t.dynamicFriction??i.friction??.6]),this.count*48+e*96+48),a.write(new Float32Array([t.restitutionCombine?r.indexOf(t.restitutionCombine):4,t.frictionCombine?r.indexOf(t.frictionCombine):4]),this.count*48+e*96+64),n.material=structuredClone(t),this.updateColliderDefinitions(n.body),this.wake()}setColliderTransform(e,t,n){let r=this.colliders[e];if(this.destroyed||!this.device||!r||!t.every(e=>Number.isFinite(Math.fround(e))))throw Error(`Invalid collider transform`);let i=U(n),a=this.props.bodies[r.body].centerOfMass??[0,0,0];if(this.props.continuous?.mode!==`convex`&&this.props.continuous?.bodies.includes(r.body)&&t.some((e,t)=>e!==a[t]))throw Error(`Collider transform exceeds continuous envelope`);let o=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!o)throw Error(`World is not attached`);o.write(new Float32Array([...t.map((e,t)=>e-a[t]),r.body,...i]),this.count*48+e*96+16),r.position=[...t],r.orientation=i,this.updateColliderDefinitions(r.body),this.setBodyParameters(r.body,{})}updateColliderDefinitions(e){let{shape:t,colliders:n,...r}=this.props.bodies[e],i=this.colliders.filter(t=>t.body===e).map(({body:e,...t})=>t),a=[...this.props.bodies];a[e]={...r,colliders:i},this.props.bodies=a}getColliderMaterial(e){let t=this.colliders[e];if(!t||this.destroyed)throw Error(`Invalid collider`);return structuredClone(t.material??{})}restoreColliderDefinitions(){let e=this.props.bodies.flatMap(e=>e.colliders??(e.shape?[{shape:e.shape}]:[]));for(let[t,n]of e.entries()){let e=this.colliders[t];e.shape=n.shape,e.material=n.material,e.position=n.position,e.orientation=n.orientation}}setBodyParameters(e,t){if(!this.device||!this.control||!this.controlSettings||this.destroyed||!Number.isInteger(e)||!this.props.bodies[e])throw Error(`Invalid body mutation`);let n=this.props.bodies[e],r={...n,...structuredClone(t)},i=r.mass??1,a=r.mode??(i===0?`static`:`dynamic`),o=r.centerOfMass??[0,0,0],s=n.centerOfMass??[0,0,0];if(![`static`,`dynamic`,`kinematic`].includes(a)||!Number.isFinite(Math.fround(i))||i<0||![...o,...r.velocity??[],...r.angularVelocity??[],r.gravityFactor??1].every(e=>Number.isFinite(Math.fround(e)))||(r.inertiaDiagonal??[]).some(e=>!Number.isFinite(Math.fround(e))||e<0)||r.inertiaOrientation&&!r.inertiaDiagonal)throw Error(`Invalid motion properties`);if(this.props.joints?.length){let t=[...this.props.bodies];t[e]=r,ll(this.props.joints,t,this.solver)}let c=this.colliders.filter(t=>t.body===e);for(let e of c)if((e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`)&&a!==`static`&&i>0&&(!e.shape.geometry.closed||!(Gc(e.shape).volume>0)))throw Error(`Dynamic meshes require closed positive-volume geometry`);if(this.props.continuous?.bodies.includes(e)&&(a!==`dynamic`||i===0||this.props.continuous.mode!==`convex`&&(c[0].position??[0,0,0]).some((e,t)=>e!==o[t])))throw Error(`Mutation exceeds the continuous body envelope`);let l=el(i,c,o),u=r.inertiaDiagonal??l.diagonal,d=U(r.inertiaOrientation??(r.inertiaDiagonal?void 0:l.orientation)),f=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);f.write(new Float32Array([...u.map(e=>a===`dynamic`&&e?1/e:0),o[0],...d,a===`static`?0:a===`dynamic`?1:2,r.gravityFactor??1,o[1],o[2]]),e*48);let p=this.ownedBuffers.find(e=>e.id===`${this.id}-object-attributes`);for(let[t,n]of this.colliders.entries())n.body===e&&(f.write(new Float32Array((n.position??[0,0,0]).map((e,t)=>e-o[t])),this.count*48+t*96+16),p?.write(new Uint32Array([e|(a===`dynamic`?65536:0)]),t*4));this.ownedBuffers.find(e=>e.id===`${this.id}-pose-metadata`)?.write(new Float32Array(o),e*48);let m=new ArrayBuffer(64);new Float32Array(m).set([...o.map((e,t)=>e-s[t]),a===`dynamic`&&i?1/i:0,...t.velocity??[0,0,0],t.velocity?1:0,...t.angularVelocity??[0,0,0],t.angularVelocity?1:0]),new Uint32Array(m).set([e,6,a===this.getBodyMode(e)?0:1],12),this.controlSettings.write(new Uint8Array(m));let h=this.device.createCommandEncoder(),g=h.beginComputePass();this.control.kernel.dispatch(g,{bindings:this.control.bindings,x:1}),this.invalidateState(g),g.end(),this.device.submit(h.finish());let _=[...this.props.bodies];_[e]=r,this.props.bodies=_}applyAngularImpulse(e,t){if(!this.control||!this.device||!this.controlSettings||this.destroyed||!Number.isInteger(e)||e<0||e>=this.count||!t.every(Number.isFinite))throw Error(`Invalid angular impulse`);let n=new ArrayBuffer(64);new Float32Array(n).set(t),new Uint32Array(n)[12]=e,new Uint32Array(n)[13]=5,this.controlSettings.write(new Uint8Array(n));let r=this.device.createCommandEncoder(),i=r.beginComputePass();this.control.kernel.dispatch(i,{bindings:this.control.bindings,x:1}),this.invalidateState(i),i.end(),this.device.submit(r.finish())}setKinematicTarget(e,t,n){if(!this.control||!this.controlSettings||!this.device||this.destroyed||!Number.isInteger(e)||this.props.bodies[e]?.mode!==`kinematic`||!t.every(Number.isFinite))throw Error(`Invalid kinematic target`);let r=U(n),i=$c(r,this.props.bodies[e].centerOfMass??[0,0,0]),a=new ArrayBuffer(64);new Float32Array(a).set([...t.map((e,t)=>e+i[t]),0],4),new Float32Array(a).set(r,8),new Uint32Array(a).set([e,1],12),this.controlSettings.write(new Uint8Array(a));let o=this.device.createCommandEncoder(),s=o.beginComputePass();this.control.kernel.dispatch(s,{bindings:this.control.bindings,x:1}),this.invalidateState(s),s.end(),this.device.submit(o.finish())}getJointStateOffset(){return Math.ceil((this.count*32+(this.broadPhase===`hierarchical-grid`?32+this.maximumPairs*8:16))/16)*16}getJointParameters(e){let t=this.props.joints?.[e];if(!t||this.destroyed)throw Error(`Invalid joint`);return structuredClone(t)}setJointParameters(e,t){this.setJointParameterEdits([{index:e,parameters:t}])}setJointParameterEdits(e){for(let{index:t,parameters:n}of e)this.validateJointParameters(t,n);for(let{index:t,parameters:n}of e)this.writeJointParameters(t,n)}validateJointParameters(e,t){let n=this.props.joints?.[e];if(!n||!this.targets||this.destroyed||n.type!==t.type||n.first!==t.first||n.second!==t.second||JSON.stringify(n.firstFrame)!==JSON.stringify(t.firstFrame)||JSON.stringify(n.secondFrame)!==JSON.stringify(t.secondFrame))throw Error(`Joint topology must remain unchanged`);ll([t],this.props.bodies,this.solver)}writeJointParameters(e,t){let n=[...this.props.joints];n[e]=structuredClone(t),this.props.joints=n,this.targets.write(dl(t),this.getJointStateOffset()+e*176),this.setJointEnabled(e,t.enabled!==!1)}setJointEnabled(e,t){if(!this.control||!this.controlSettings||!this.device||this.destroyed||!Number.isInteger(e)||!this.props.joints?.[e])throw Error(`Invalid joint`);let n=new ArrayBuffer(64);new Float32Array(n)[0]=t?1:0,new Uint32Array(n).set([e,3],12),this.controlSettings.write(new Uint8Array(n));let r=this.device.createCommandEncoder(),i=r.beginComputePass();this.control.kernel.dispatch(i,{bindings:this.control.bindings,x:1}),this.invalidateState(i),i.end(),this.device.submit(r.finish());let a=[...this.props.joints];a[e]={...a[e],enabled:t},this.props.joints=a}wake(){if(this.destroyed||!this.device||!this.invalidation)return;let e=this.device.createCommandEncoder(),t=e.beginComputePass();this.invalidateState(t),t.end(),this.device.submit(e.finish())}readContactEvents(){return!this.contactEvents||this.destroyed?Promise.reject(Error(`Contact events are not enabled`)):(this.eventRead||=this.contactEvents.readAsync().then(e=>{let t=Al(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.eventCursor);return this.eventCursor=t.sequence,t}).finally(()=>{this.eventRead=null}),this.eventRead)}raycast(e){return this.runQuery(e)}overlapSphere(e){return this.runQuery(e)}async runQuery(e){if(!this.device||!this.queryComputation||!this.querySettings||!this.querySelection||!this.queryOutput||this.destroyed||this.queryPending)throw Error(`Queries are disabled or busy`);let t=`origin`in e,n=t&&`radius`in e,r=t?e.origin:e.center,i=t?e.direction:[0,0,0],a=Math.hypot(...i),o=t?1:e.maximumHits??this.colliderCount;if(n&&(!Number.isFinite(e.radius)||e.radius<0)||r.length!==3||!r.every(e=>Number.isFinite(Math.fround(e)))||i.length!==3||!i.every(Number.isFinite)||(t?!Number.isFinite(a)||a===0||!Number.isFinite(e.maximumDistance)||e.maximumDistance<0:!Number.isFinite(e.radius)||e.radius<0)||!Number.isInteger(o)||o<0||o>Math.max(1,this.colliderCount)||e.excludeBody!==void 0&&(!Number.isInteger(e.excludeBody)||e.excludeBody<0||e.excludeBody>=this.count))throw Error(`Invalid collision query`);let s=e.colliderIndices??Array.from({length:this.colliderCount},(e,t)=>t),c=new Uint32Array(this.colliderStorageCount);for(let t of s){if(!Number.isInteger(t)||t<0||t>=this.colliderCount)throw Error(`Invalid query collider`);this.colliders[t].body!==e.excludeBody&&(c[t]=1)}this.queryPending=!0;try{let s=new ArrayBuffer(48);new Float32Array(s).set([...r,t?n?e.radius:0:e.radius,...i.map(e=>t?e/a:0),t?e.maximumDistance:1e30]),new Uint32Array(s).set([t?n?2:0:1,o,0,0],8),this.querySettings.write(new Uint8Array(s)),this.querySelection.write(c);let l=this.device.createCommandEncoder(),u=l.beginComputePass();this.queryComputation.kernel.dispatch(u,{bindings:this.queryComputation.bindings,x:Math.ceil(this.colliderStorageCount/64)}),this.queryReduction.kernel.dispatch(u,{bindings:this.queryReduction.bindings,x:1}),u.end(),this.device.submit(l.finish());let d=await this.queryOutput.readAsync(0,16+o*48),f=new Uint32Array(d.buffer,d.byteOffset,d.byteLength/4),p=new Float32Array(d.buffer,d.byteOffset,d.byteLength/4);return{hits:Array.from({length:f[0]},(e,t)=>{let n=4+t*12;return{body:f[n],collider:f[n+1],point:[p[n+4],p[n+5],p[n+6]],distance:p[n+7],normal:[p[n+8],p[n+9],p[n+10]]}}),totalHits:f[1],truncated:!t&&f[1]>f[0],complete:f[2]===0}}finally{this.queryPending=!1}}castSphere(e){return this.runQuery(e)}async readState(){if(!this.positions||!this.orientations||!this.velocities||!this.angularVelocities||!this.sleepStates||this.destroyed)throw Error(`Rigid-body world is not active`);let e=await Promise.all([this.positions,this.orientations,this.velocities,this.angularVelocities,this.sleepStates].map(async e=>new Float32Array((await e.readAsync()).buffer)));return Array.from({length:this.count},(t,n)=>{let r=n*4;return{position:[e[0][r],e[0][r+1],e[0][r+2]],orientation:[e[1][r],e[1][r+1],e[1][r+2],e[1][r+3]],velocity:[e[2][r],e[2][r+1],e[2][r+2]],angularVelocity:[e[3][r],e[3][r+1],e[3][r+2]],sleeping:e[4][r+1]>.5}})}readTriggerEvents(){if(!this.triggerEvents||this.destroyed)throw Error(`Triggers are disabled`);return this.triggerRead||=this.triggerEvents.readAsync().then(e=>{let t=yl(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.triggerCursor);return this.triggerCursor=t.sequence,t}).finally(()=>{this.triggerRead=null}),this.triggerRead}getSnapshotBuffers(e=!0){return this.ownedBuffers.filter(t=>e||!t.id.startsWith(`${this.id}-checkpoint-`))}createGPUCheckpoint(e={}){if(!this.device||this.destroyed)throw Error(`Checkpoint requires an attached world`);let t=this.device,n=this.getSnapshotBuffers(e.includeRollbackScratch),r=[],i=!1,a=!1,s=[...this.worldOrigin],c=structuredClone(this.props.joints),l=structuredClone(this.props.bodies),u=0,d=0;try{for(let e of n)r.push(t.createBuffer({id:`${e.id}-recovery`,byteLength:e.byteLength,usage:o.COPY_SRC|o.COPY_DST}))}catch(e){for(let e of r)e.destroy();throw e}let f=e=>{if(i||this.destroyed||this.queryPending||this.eventRead||this.triggerRead)throw Error(`Checkpoint requires an idle live world`);let a=t.createCommandEncoder();for(let[t,i]of n.entries())a.copyBufferToBuffer({sourceBuffer:e?r[t]:i,destinationBuffer:e?i:r[t],size:i.byteLength});t.submit(a.finish())},p=structuredClone(this.colliderShapeScales),m=structuredClone(this.props.publicationBounds),h={byteLength:r.reduce((e,t)=>e+t.byteLength,0),save:()=>{f(!1),s=[...this.worldOrigin],c=structuredClone(this.props.joints),l=structuredClone(this.props.bodies),p=structuredClone(this.colliderShapeScales),m=structuredClone(this.props.publicationBounds),u=this.eventCursor,d=this.triggerCursor,a=!0},restore:()=>{if(!a)throw Error(`Checkpoint has not been saved`);f(!0),this.worldOrigin=[...s],this.props.joints=structuredClone(c),this.props.bodies=structuredClone(l),this.restoreColliderDefinitions(),this.colliderShapeScales=structuredClone(p),this.props.publicationBounds=structuredClone(m),this.eventCursor=u,this.triggerCursor=d},destroy:()=>{if(!i){i=!0;for(let e of r)e.destroy();this.gpuCheckpoints.delete(h)}}};return this.gpuCheckpoints.add(h),h}async captureState(e={}){if(!this.device||this.destroyed||this.queryPending||this.eventRead||this.triggerRead)throw Error(`Capture requires an idle attached world`);return{version:1,origin:[...this.worldOrigin],includeRollbackScratch:e.includeRollbackScratch!==!1,props:structuredClone(this.props),colliderShapeScales:structuredClone([...this.colliderShapeScales]),contactCursor:this.eventCursor,triggerCursor:this.triggerCursor,buffers:await Promise.all(this.getSnapshotBuffers(e.includeRollbackScratch).map(async e=>({name:e.id.slice(this.id.length+1),data:new Uint8Array(await e.readAsync())})))}}restoreState(e){let t=this.getSnapshotBuffers(e.includeRollbackScratch);if(!this.device||this.destroyed||this.queryPending||this.eventRead||this.triggerRead||e.version!==1||e.origin!==void 0&&(e.origin.length!==3||!e.origin.every(Number.isFinite))||e.buffers.length!==t.length||Pl(e.props)!==Pl(this.props)||![e.contactCursor,e.triggerCursor].every(e=>Number.isInteger(e)&&e>=0&&e<=4294967295))throw Error(`Incompatible rigid-body capture`);let n=new Map(e.colliderShapeScales??[]);for(let[e,t]of n)if(this.getColliderShape(e),t.length!==3||t.some(e=>!Number.isFinite(e)||e<=0))throw Error(`Invalid captured collider scale`);for(let[n,r]of t.entries()){let t=e.buffers[n];if(t.name!==r.id.slice(this.id.length+1)||!(t.data instanceof Uint8Array)||t.data.byteLength!==r.byteLength)throw Error(`Incompatible rigid-body capture storage`)}for(let[n,r]of t.entries())r.write(e.buffers[n].data);this.props.joints=structuredClone(e.props.joints),this.props.bodies=structuredClone(e.props.bodies),this.props.publicationBounds=structuredClone(e.props.publicationBounds),this.restoreColliderDefinitions(),this.colliderShapeScales=structuredClone(n),this.worldOrigin=[...e.origin??[0,0,0]],this.eventCursor=e.contactCursor,this.triggerCursor=e.triggerCursor}async getRecoveryProps(e={}){if(this.props.failurePolicy!==`rollback`)throw Error(`Recovery requires rollback`);if(this.props.bodies.some(e=>e.mode===`kinematic`))throw Error(`Kinematic recovery requires explicit target replay`);let t=await this.readState();return{...structuredClone(this.props),...e,bodies:this.props.bodies.map((e,n)=>{let r=t[n],i=$c(r.orientation,e.centerOfMass??[0,0,0]);return{...structuredClone(e),position:r.position.map((e,t)=>e-i[t]),orientation:r.orientation,velocity:r.velocity,angularVelocity:r.angularVelocity}})}}async readContinuousWork(){if(this.props.continuous?.mode!==`convex`)return null;let e=this.ownedBuffers.find(e=>e.id===`${this.id}-continuous-status`);if(!e)return null;let t=await e.readAsync(0,16),n=new Uint32Array(t.buffer,t.byteOffset,4),r=await this.ownedBuffers.find(e=>e.id===`${this.id}-continuous-work`).readAsync(16,16),i=new Uint32Array(r.buffer,r.byteOffset,4);return{peakSpatialTests:i[1],rounds:i[2],candidateCapacity:this.props.continuous.maximumCandidates??this.maximumPairs,peakCandidates:n[3],peakCandidateWorkgroups:Math.ceil(Math.min(n[3],this.props.continuous.maximumCandidates??this.maximumPairs)/64),impacts:n[2],incomplete:n[0]!==0}}async readSolverWork(){if(!this.parallelState||this.destroyed)return null;let e=await this.parallelState.readAsync(0,16),t=new Uint32Array(e.buffer,e.byteOffset,4),n=this.props.compactContacts!==!1;return{compacted:n,activeContacts:n?t[1]:null,awakeBodies:n?t[2]:null,awakeContacts:n?t[3]:null,bodyWorkgroups:Math.ceil((n?t[2]:this.count)/64),pairCapacity:this.maximumPairs,pairWorkgroups:Math.ceil((n?t[3]:this.maximumPairs)/64)}}async readSimulationDiagnostics(){if(!this.simulationStatistics||this.destroyed)throw Error(`Rigid-body world is not active`);return il(new Uint32Array((await this.simulationStatistics.readAsync()).buffer))}async readCollisionDiagnostics(){if(!this.manifolds||this.destroyed)throw Error(`Rigid-body world is not active`);let e=this.meshTasks?new Uint32Array((await this.meshTasks.readAsync(0,16)).buffer):new Uint32Array(4),t=this.broadPhaseCounters?tl(new Uint32Array((await this.broadPhaseCounters.buffer.readAsync(this.broadPhaseCounters.byteOffset,32)).buffer)):void 0,n=this.broadPhase===`hierarchical-grid`?new Uint32Array((await this.targets.readAsync(this.count*32+16,4)).buffer)[0]:0;return{unresolvedQueries:e[2],triangleQueries:e[0],droppedTriangleQueries:e[1],incompleteMeshQueries:e[3],droppedManifolds:n,incompleteIslandUnions:this.parallelState?new Uint32Array((await this.parallelState.readAsync(0,4)).buffer)[0]:0,broadPhase:t}}destroy(){if(!this.destroyed){this.ensembleReset?.destroy();for(let e of this.gpuCheckpoints)e.destroy();this.destroyed=!0,this.control?.kernel.destroy(),this.invalidation?.kernel.destroy(),this.queryComputation?.kernel.destroy(),this.queryReduction?.kernel.destroy();for(let e of this.ownedBuffers)e.destroy();this.ownedBuffers.length=0}}};function Pl(e){return JSON.stringify({...e,id:void 0,publicationBounds:e.publicationBounds?e.publicationBounds.map(()=>!0):void 0,bodies:e.bodies.map(e=>({...e,shape:void 0,colliders:(e.colliders??[{shape:e.shape}]).map(e=>({...e,shape:e.shape?.type===`convex-hull`||e.shape?.type===`triangle-mesh`?e.shape:{type:e.shape?.type},material:void 0,position:void 0,orientation:void 0})),mode:void 0,mass:void 0,centerOfMass:void 0,inertiaDiagonal:void 0,inertiaOrientation:void 0,velocity:void 0,angularVelocity:void 0,gravityFactor:void 0})),joints:e.joints?.map(e=>({type:e.type,first:e.first,second:e.second,firstFrame:e.firstFrame,secondFrame:e.secondFrame}))},(e,t)=>{if(!t||typeof t!=`object`||Array.isArray(t))return t;let n=t;return Object.fromEntries(Object.keys(n).sort().map(e=>[e,n[e]]))})}var Fl=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!Rl(t.style,n.style)&&(Ll(r,t.style),Il(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return Il(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function Il(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(zl(n),String(r))}function Ll(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(zl(n))}function Rl(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length?n.every(n=>e?.[n]===t?.[n]):!1}function zl(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var Bl=class extends Fl{static defaultProps={...Fl.defaultProps,panel:void 0,placement:`top-left`}},Vl=`data-deck-gl-community-panels-styles`,Hl=`.deck-widget {
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
`;function Ul(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function Wl(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(Ul))return!0}return!1}function Gl(e){if(e.querySelector(`style[${Vl}]`)||Wl(e))return;let t=e.createElement(`style`);t.setAttribute(Vl,`true`),t.textContent=Hl,e.head.appendChild(t)}var Kl={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},ql=`top-left`,Jl=`root`,Yl=class{deck;parentElement;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,deck:t=null,className:n}){this.deck=t,this.parentElement=e,this.className=n,Gl(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),n&&this.parentElement.classList.add(n)}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!Xl(e.components,this.components)){let t=e.components.filter(Zl);this._setComponents(t)}}finalize(){for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e}_addComponent(e){let{viewId:t=null,placement:n=ql}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:Jl,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Kl[t]),r.append(i)),i}_updateContainers(){let e=this.deck,t=e?.width??this.parentElement.clientWidth,n=e?.height??this.parentElement.clientHeight;for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===Jl||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function Xl(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Zl(e){return e instanceof Fl}var Ql,W,$l,eu,tu,nu,ru,iu,au,ou,su,cu,lu,uu,du,fu={},pu=[],mu=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,hu=Array.isArray;function gu(e,t){for(var n in t)e[n]=t[n];return e}function _u(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function vu(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?Ql.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return yu(e,o,r,i,null)}function yu(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++$l,__i:-1,__u:0};return i==null&&W.vnode!=null&&W.vnode(a),a}function bu(e){return e.children}function xu(e,t){this.props=e,this.context=t}function Su(e,t){if(t==null)return e.__?Su(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?Su(e):null}function Cu(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=gu({},t);a.__v=t.__v+1,W.vnode&&W.vnode(a),Pu(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??Su(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,Iu(r,a,i),t.__e=t.__=null,a.__e!=n&&wu(a)}}function wu(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),wu(e)}function Tu(e){(!e.__d&&(e.__d=!0)&&eu.push(e)&&!Eu.__r++||tu!=W.debounceRendering)&&((tu=W.debounceRendering)||nu)(Eu)}function Eu(){try{for(var e,t=1;eu.length;)eu.length>t&&eu.sort(ru),e=eu.shift(),t=eu.length,Cu(e)}finally{eu.length=Eu.__r=0}}function Du(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||pu,y=t.length;for(c=Ou(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||fu,p.__i=d,g=Pu(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&zu(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=ku(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function Ou(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=yu(null,o,null,null,null):hu(o)?o=e.__k[a]=yu(bu,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=yu(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=Au(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=Su(s)),Bu(s,s));return r}function ku(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=ku(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=Su(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function Au(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>(u?1:0)){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function ju(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||mu.test(t)?n:n+`px`}function Mu(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||ju(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||ju(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(su,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[ou]=r[ou]:(n[ou]=cu,e.addEventListener(t,a?uu:lu,a)):e.removeEventListener(t,a?uu:lu,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function Nu(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[au]==null)t[au]=cu++;else if(t[au]<n[ou])return;return n(W.event?W.event(t):t)}}}function Pu(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=W.__b)&&u(t);n:if(typeof T==`function`)try{if(_=t.props,v=T.prototype&&T.prototype.render,y=(u=T.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new T(_,b):(t.__c=d=new xu(_,b),d.constructor=T,d.render=Vu),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&T.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=gu({},d.__s)),gu(d.__s,T.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&T.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&T.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),pu.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=W.__r,S=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),pu.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++S<25);d.state=d.__s,d.getChildContext!=null&&(r=gu(gu({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),C=u!=null&&u.type===bu&&u.key==null?Lu(u.props.children):u,s=Du(e,hu(C)?C:[C],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(w=a.length;w--;)_u(a[w]);Fu(t)}else t.__e=n.__e,t.__k=n.__k,e.then||Fu(t);W.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=Ru(n.__e,t,n,r,i,a,o,c,l);return(u=W.diffed)&&u(t),128&t.__u?void 0:s}function Fu(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(Fu))}function Iu(e,t,n){for(var r=0;r<n.length;r++)zu(n[r],n[++r],n[++r]);W.__c&&W.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){W.__e(e,t.__v)}})}function Lu(e){return typeof e!=`object`||!e||e.__b>0?e:hu(e)?e.map(Lu):e.constructor===void 0?gu({},e):null}function Ru(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||fu,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(W.__m&&W.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&Ql.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||Mu(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||Mu(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),Du(t.type==`template`?e.content:e,hu(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&Su(n,0),s,c),a!=null)for(l=a.length;l--;)_u(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&Mu(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&Mu(e,l,h,g[l],i))}return e}function zu(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){W.__e(e,n)}}function Bu(e,t,n){var r,i;if(W.unmount&&W.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||zu(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){W.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&Bu(r[i],t,n||typeof e.type!=`function`);n||_u(e.__e),e.__c=e.__=e.__e=void 0}function Vu(e,t,n){return this.constructor(e,n)}function Hu(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),W.__&&W.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],Pu(t,e=(!r&&n||t).__k=vu(bu,null,[e]),i||fu,fu,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?Ql.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),Iu(a,e,o)}function Uu(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,Tu(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+ du++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}Ql=pu.slice,W={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},$l=0,xu.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=gu({},this.state);typeof e==`function`&&(e=e(gu({},n),this.props)),e&&gu(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),Tu(this))},xu.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),Tu(this))},xu.prototype.render=bu,eu=[],nu=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,ru=function(e,t){return e.__v.__b-t.__v.__b},Eu.__r=0,iu=Math.random().toString(8),au=`__d`+iu,ou=`__a`+iu,su=/(PointerCapture)$|Capture$/i,cu=0,lu=Nu(!1),uu=Nu(!0),du=0;var Wu=0;Array.isArray;function G(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Wu,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return W.vnode&&W.vnode(l),l}var Gu,K,Ku,qu,Ju=0,Yu=[],q=W,Xu=q.__b,Zu=q.__r,Qu=q.diffed,$u=q.__c,ed=q.unmount,td=q.__;function nd(e,t){q.__h&&q.__h(K,e,Ju||t),Ju=0;var n=K.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function rd(e){return Ju=1,id(_d,e)}function id(e,t,n){var r=nd(Gu++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):_d(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=K,!K.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};K.__f=!0;var a=K.shouldComponentUpdate,o=K.componentWillUpdate;K.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},K.shouldComponentUpdate=i}return r.__N||r.__}function ad(e,t){var n=nd(Gu++,3);!q.__s&&gd(n.__H,t)&&(n.__=e,n.u=t,K.__H.__h.push(n))}function od(e,t){var n=nd(Gu++,4);!q.__s&&gd(n.__H,t)&&(n.__=e,n.u=t,K.__h.push(n))}function sd(e){return Ju=5,cd(function(){return{current:e}},[])}function cd(e,t){var n=nd(Gu++,7);return gd(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function ld(e,t){return Ju=8,cd(function(){return e},t)}function ud(e){var t=K.context[e.__c],n=nd(Gu++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(K)),t.props.value):e.__}function dd(){for(var e;e=Yu.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(md),t.__h.some(hd),t.__h=[]}catch(n){t.__h=[],q.__e(n,e.__v)}}}q.__b=function(e){K=null,Xu&&Xu(e)},q.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),td&&td(e,t)},q.__r=function(e){Zu&&Zu(e),Gu=0;var t=(K=e.__c).__H;t&&(Ku===K?(t.__h=[],K.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(md),t.__h.some(hd),t.__h=[],Gu=0)),Ku=K},q.diffed=function(e){Qu&&Qu(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(Yu.push(t)!==1&&qu===q.requestAnimationFrame||((qu=q.requestAnimationFrame)||pd)(dd)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),Ku=K=null},q.__c=function(e,t){t.some(function(e){try{e.__h.some(md),e.__h=e.__h.filter(function(e){return!e.__||hd(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],q.__e(n,e.__v)}}),$u&&$u(e,t)},q.unmount=function(e){ed&&ed(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{md(e)}catch(e){t=e}}),n.__H=void 0,t&&q.__e(t,n.__v))};var fd=typeof requestAnimationFrame==`function`;function pd(e){var t,n=function(){clearTimeout(r),fd&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);fd&&(t=requestAnimationFrame(n))}function md(e){var t=K,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),K=t}function hd(e){var t=K;e.__c=e.__(),K=t}function gd(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function _d(e,t){return typeof t==`function`?t(e):t}var vd={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},yd={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},bd=Uu(void 0);function xd({panel:e,children:t}){let n=ud(bd),r=sd(null),[i,a]=rd(`light`),o=Sd(n??i,e.theme);return od(()=>{if(!n){let e=r.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=Td(t);a(t=>t===e?t:e)};n();let i=new MutationObserver(()=>{n()});for(let e of Cd(t))i.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{i.disconnect()}}},[n]),G(bd.Provider,{value:o,children:G(`div`,{ref:r,"data-panel-theme-mode":o,style:wd(o),children:t})})}function Sd(e,t){return t===`dark`?`dark`:t===`light`?`light`:t===`invert`?e===`dark`?`light`:`dark`:e}function Cd(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function wd(e){return{...e===`dark`?yd:vd}}function Td(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=Ed(t.getComputedStyle(e).getPropertyValue(`--menu-background`).trim());return n&&Dd(n)<.5?`dark`:`light`}function Ed(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function Dd([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}var Od;function kd(e){let t=Math.max(220,Math.floor(e));return Number.isFinite(t)?t:360}function Ad({panel:e,title:t,widthPx:n,maxHeightPx:r,open:i,collapsible:a,onOpenChange:o}){return G(`section`,{style:Nd(n,r),"aria-label":t??`Panel box`,onPointerDown:J,onPointerMove:J,onPointerUp:J,onMouseDown:J,onMouseMove:J,onMouseUp:J,onTouchStart:J,onTouchMove:J,onTouchEnd:J,onClick:J,onContextMenu:J,onWheel:J,children:[t?G(`header`,{style:Pd,children:a?G(`button`,{type:`button`,"aria-expanded":i,style:Fd,onClick:()=>o(!i),children:[G(`span`,{children:t}),G(`span`,{"aria-hidden":`true`,style:Id(i),children:i?`▾`:`▸`})]}):G(`span`,{children:t})}):null,G(`div`,{style:Ld(i),children:e?G(xd,{panel:e,children:e.content}):null})]})}var jd=class extends Bl{static defaultProps={...Bl.defaultProps,id:`box-panel-container`,placement:`bottom-left`,title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0};className=`deck-widget-box`;placement=Od.defaultProps.placement;title=Od.defaultProps.title;widthPx=Od.defaultProps.widthPx;collapsible=Od.defaultProps.collapsible;isOpen=Od.defaultProps.defaultOpen;#e=Od.defaultProps.panel;#t=null;#n=void 0;#r=!1;#i=!1;#a=void 0;constructor(e={}){super({...Od.defaultProps,...e}),this.setProps(this.props)}setProps(e){e.placement!==void 0&&(this.placement=e.placement),`title`in e&&(this.title=e.title),e.widthPx!==void 0&&(this.widthPx=kd(e.widthPx)),e.collapsible!==void 0&&(this.collapsible=e.collapsible),this.#c(e),`panel`in e&&(this.#e=e.panel),this.#s(),super.setProps(e)}onRemove(){this.#t&&Hu(null,this.#t)}onRenderHTML(e){this.#t=e,e.style.margin=`0`,this.#s()}onViewportChange(){this.#s()}#o=e=>{this.#i||(this.isOpen=e),this.#a?.(e),this.#s()};#s=()=>{this.#t&&(this.#n=Md(this.#t),Hu(G(Ad,{panel:this.#e,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#o}),this.#t))};#c(e){if(this.#i=e.open!==void 0,e.onOpenChange!==void 0&&(this.#a=e.onOpenChange),e.open!==void 0){this.isOpen=e.open,this.#r=!0;return}!this.#r&&e.defaultOpen!==void 0&&(this.isOpen=e.defaultOpen,this.#r=!0)}};Od=jd;function J(e){e.stopPropagation()}function Md(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow===`hidden`||n?.overflowX===`hidden`||n?.overflowY===`hidden`)&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}var Nd=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...t===void 0?{}:{maxHeight:`${t}px`},boxSizing:`border-box`,display:`flex`,flexDirection:`column`,pointerEvents:`auto`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`12px`,background:`var(--menu-background, rgba(255, 255, 255, 0.96))`,backdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))`,overflow:`hidden`}),Pd={padding:`14px 16px 10px`,fontSize:`18px`,fontWeight:700,lineHeight:1.2,color:`var(--button-text, currentColor)`},Fd={width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`12px`,border:`none`,background:`none`,color:`inherit`,padding:`0`,margin:`0`,cursor:`pointer`,font:`inherit`,textAlign:`left`},Id=e=>({fontSize:`18px`,lineHeight:1,color:`var(--button-icon-idle, #616166)`,transform:e?`translateY(1px)`:`translateY(-1px)`}),Ld=e=>({display:e?`block`:`none`,flex:`1 1 auto`,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`0 16px 16px`});function Rd(e,t){let[n,r]=rd(t),i=e!==void 0,a=i?e:n;return ad(()=>{i&&r(e)},[i,e]),[a,ld(e=>{i||r(e)},[i])]}var zd=class extends Fl{static defaultProps={...Fl.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){Hu(vu(xd,{panel:this},this.content),e)}onRemove(){this.rootElement&&Hu(null,this.rootElement)}},Bd=class extends zd{constructor({panels:e,id:t=`column-panels`,title:n=`Panels`,theme:r=`inherit`}){super({id:t,title:n,theme:r,content:G(Vd,{panels:e})})}};function Vd({panels:e,className:t}){return G(`div`,{className:t,style:Hd,children:e.map((e,t)=>G(`section`,{style:{...Ud,borderTop:t>0?`1px solid var(--menu-border, rgba(148, 163, 184, 0.25))`:`none`,opacity:e.disabled?.55:1},children:[e.title?G(`header`,{style:Wd,children:e.title}):null,G(`div`,{style:Gd,children:G(xd,{panel:e,children:e.content})})]},e.id))})}var Hd={display:`grid`,gap:`0`},Ud={display:`grid`,gap:`10px`,padding:`12px 0`},Wd={fontSize:`12px`,fontWeight:700,color:`var(--button-text, currentColor)`,padding:`0 2px`},Gd={minWidth:0},Kd=class extends zd{constructor({panels:e,id:t=`tabbed-panels`,title:n=`Panels`,tabListLayout:r=`wrap`,theme:i=`inherit`}){super({id:t,title:n,theme:i,content:G(qd,{panels:e,tabListLayout:r})})}};function qd({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=Rd(r,n),c=cd(()=>e.filter(e=>!e.disabled),[e]),l=cd(()=>o&&c.some(e=>e.id===o)?o:c[0]?.id,[o,c]);return ad(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),G(`div`,{className:t,style:Jd,children:[G(`div`,{"data-panel-tabs":``,style:Yd(a),children:e.map(e=>{let t=e.id===l;return G(`button`,{type:`button`,style:{...Xd,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border, rgba(148, 163, 184, 0.35))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onPointerDown:t=>{if(e.disabled){t.stopPropagation();return}t.preventDefault(),s(e.id),i?.(e.id)},children:e.title},e.id)})}),G(`div`,{style:Zd,children:e.map(e=>{let t=e.id===l;return G(`div`,{"aria-hidden":!t,style:{...Qd,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:G(xd,{panel:e,children:e.content})},e.id)})})]})}var Jd={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--button-corner-radius, 8px)`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,color:`var(--menu-text, rgb(24, 24, 26))`};function Yd(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`4px`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`4px 6px`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var Xd={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`4px`,margin:0,padding:`4px 8px`,fontSize:`12px`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},Zd={display:`grid`,alignItems:`start`,padding:`10px`,overflow:`auto`},Qd={gridArea:`1 / 1`,minWidth:0};function $d({className:e,onRenderHTML:t}){let n=sd(null);return od(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),G(`div`,{ref:n,className:e})}var ef=class extends zd{constructor({id:e,title:t,onRenderHTML:n,disabled:r,keepMounted:i,className:a,theme:o=`inherit`}){super({id:e,title:t,theme:o,disabled:r,keepMounted:i,content:G($d,{className:a,onRenderHTML:n})})}},tf=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],nf={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function rf(e,t){let n=nf[t];for(let[t,r]of tf)e.style.setProperty(r,n[t])}function af(e){for(let[,t]of tf)e.style.removeProperty(t)}var of=`data-example-panel-host`,sf=`data-example-settings-panel`,cf=`data-example-settings-sections`,lf=`example-source`,uf=`/examples/`,df=`data-example-panel-appearance`;`${df}${sf}${sf}${sf}${sf}${sf}${cf}${sf}${cf}`;function ff({id:e,title:t,html:n,onRender:r}){return new ef({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function pf({id:e,title:t,content:n}){return new ef({id:e,title:t,onRenderHTML:e=>(Hu(vu(bu,{},n),e),()=>Hu(null,e))})}function mf(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===lf),i=_f()&&!r?[...e.panels,hf(t)]:e.panels;return new Kd({...n,panels:i})}function hf(e){return pf({id:lf,title:`Source`,content:vu(gf,{sourcePaths:e})})}function gf({sourcePaths:e}){let[t,n]=rd({});return ad(()=>{let t=e??vf();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return yf(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?vu(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):vu(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},vu(`code`,{},t.source??`// Loading source…`))}function _f(){return typeof window<`u`&&!!window.website}function vf(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(uf);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function yf(e,t){let n=window.location.pathname.indexOf(uf),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}function bf(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute(of,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(df,r),r===`cinematic`||r===`light`?rf(e,r):af(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?nf[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}function xf(e){let t=/^(r|rg|rgba|bgra)(8unorm|8snorm|16float|32float)(-srgb)?$/.exec(e.format??``);if(!t||!e.width||!e.height)return;let n=t[1]===`r`?1:t[1]===`rg`?2:4,r=t[2],i=r===`16float`?2:r===`32float`?4:1,a=e.width*e.height;if(e.data.byteLength!==a*n*i)return;let o=new DataView(e.data.buffer,e.data.byteOffset,e.data.byteLength),s=new Uint8ClampedArray(a*4),c=e=>{let t=e*i;if(r===`8unorm`)return o.getUint8(t)/255;if(r===`8snorm`)return Math.max(-1,o.getInt8(t)/127);if(r===`32float`)return o.getFloat32(t,!0);let n=o.getUint16(t,!0),a=n&32768?-1:1,s=n>>10&31,c=n&1023;return a*(s===31?c?NaN:1/0:s===0?c*2**-24:(1+c/1024)*2**(s-15))};for(let e=0;e<a;e++)for(let r=0;r<4;r++){let i=t[1]===`bgra`&&r<3?2-r:r,a=r===3?1:0;i<n?a=c(e*n+i):n===1&&r<3&&(a=c(e)),a=Number.isNaN(a)?0:Math.max(0,Math.min(1,a)),r<3&&!t[3]&&(a=a<=.0031308?12.92*a:1.055*a**(1/2.4)-.055),s[e*4+r]=Math.round(a*255)}return s}function Sf(e,t){let n=xf(t);if(!n)return;let r=e.createElement(`canvas`);return r.width=t.width,r.height=t.height,r.setAttribute(`role`,`img`),r.setAttribute(`aria-label`,`Current texture allocation, top-left ${r.width} by ${r.height} pixels; display range 0 to 1`),r.title=`Current allocation · top-left crop · display range 0–1`,r.getContext(`2d`)?.putImageData(new ImageData(n,r.width,r.height),0,0),r.style.cssText=`width:${128*r.width/Math.max(r.width,r.height)}px;max-width:100%;height:auto;image-rendering:pixelated;background:repeating-conic-gradient(#888 0% 25%,#bbb 0% 50%) 0/12px 12px`,r}var Cf=1,wf=class{element;document;trigger;valueElement;listbox;ariaLabel;onChange;options;selectedValue=null;activeIndex=-1;disabled;openState=!1;destroyed=!1;typeaheadText=``;typeaheadTimer=null;constructor(e,t){this.document=e.ownerDocument,this.options=[...t.options],this.ariaLabel=t.ariaLabel??`Select option`,this.onChange=t.onChange,this.disabled=t.disabled??!1;let n=Cf++,r=`compact-dropdown-trigger-${n}`,i=`compact-dropdown-listbox-${n}`;this.element=this.document.createElement(`div`),this.element.dataset.compactDropdown=``,this.element.innerHTML=`<style>${Tf}</style>`,this.trigger=this.document.createElement(`button`),this.trigger.id=r,this.trigger.type=`button`,this.trigger.setAttribute(`role`,`combobox`),this.trigger.setAttribute(`aria-label`,this.ariaLabel),this.trigger.setAttribute(`aria-haspopup`,`listbox`),this.trigger.setAttribute(`aria-controls`,i),this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.dataset.compactDropdownTrigger=``,this.valueElement=this.document.createElement(`span`),this.valueElement.dataset.compactDropdownValue=``;let a=this.document.createElement(`span`);a.dataset.compactDropdownChevron=``,a.setAttribute(`aria-hidden`,`true`),this.trigger.append(this.valueElement,a),this.element.append(this.trigger),this.listbox=this.document.createElement(`div`),this.listbox.id=i,this.listbox.hidden=!0,this.listbox.setAttribute(`role`,`listbox`),this.listbox.setAttribute(`aria-label`,this.ariaLabel),this.listbox.dataset.compactDropdownPopup=``,e.append(this.element),this.document.body.append(this.listbox),this.trigger.addEventListener(`click`,this.handleTriggerClick),this.trigger.addEventListener(`keydown`,this.handleKeyDown),this.listbox.addEventListener(`click`,this.handleOptionClick),this.listbox.addEventListener(`pointermove`,this.handleOptionPointerMove),this.document.addEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.addEventListener(`focusin`,this.handleDocumentFocusIn),this.renderOptions();let o=t.value??this.getFirstEnabledOption()?.value;o!==void 0&&this.setValue(o),this.updateDisabledState()}get value(){return this.selectedValue}set value(e){e===null?(this.selectedValue=null,this.activeIndex=-1,this.updateSelection()):this.setValue(e)}setValue(e,t={}){let n=this.options.find(t=>t.value===e);if(!n)return!1;let r=this.selectedValue!==e;return this.selectedValue=e,this.activeIndex=this.options.indexOf(n),this.updateSelection(),r&&t.emitChange&&this.onChange?.(e,n),!0}setOptions(e){this.options=[...e],this.selectedValue=this.options.find(e=>e.value===this.selectedValue)?.value??this.getFirstEnabledOption()?.value??null,this.activeIndex=this.getSelectedIndex(),this.renderOptions(),this.updateSelection(),this.updateDisabledState(),this.openState&&this.updatePopupPosition()}setDisabled(e){this.disabled=e,this.updateDisabledState(),this.trigger.disabled&&this.close()}focus(){this.trigger.focus()}open(){this.openState||this.trigger.disabled||this.destroyed||(this.openState=!0,this.activeIndex=this.getSelectedIndex(),this.activeIndex<0&&(this.activeIndex=this.getNextEnabledIndex(-1,1)),this.listbox.hidden=!1,this.trigger.setAttribute(`aria-expanded`,`true`),this.element.dataset.open=`true`,this.updateActiveOption(!0),this.updatePopupPosition(),this.document.defaultView?.addEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.addEventListener(`scroll`,this.handleViewportChange,!0))}close(e={}){this.openState&&(this.openState=!1,this.listbox.hidden=!0,this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.removeAttribute(`aria-activedescendant`),delete this.element.dataset.open,this.document.defaultView?.removeEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.removeEventListener(`scroll`,this.handleViewportChange,!0),e.restoreFocus&&this.trigger.focus())}destroy(){this.destroyed||(this.close(),this.destroyed=!0,this.trigger.removeEventListener(`click`,this.handleTriggerClick),this.trigger.removeEventListener(`keydown`,this.handleKeyDown),this.listbox.removeEventListener(`click`,this.handleOptionClick),this.listbox.removeEventListener(`pointermove`,this.handleOptionPointerMove),this.document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.removeEventListener(`focusin`,this.handleDocumentFocusIn),this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.listbox.remove(),this.element.remove())}handleTriggerClick=()=>{this.openState?this.close():this.open()};handleKeyDown=e=>{switch(e.key){case`ArrowDown`:e.preventDefault(),this.openState?this.moveActiveOption(1):this.open();break;case`ArrowUp`:e.preventDefault(),this.openState?this.moveActiveOption(-1):this.open();break;case`Home`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(-1,1));break;case`End`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(this.options.length,-1));break;case`Enter`:case` `:e.preventDefault(),this.openState?this.selectActiveOption():this.open();break;case`Escape`:this.openState&&(e.preventDefault(),this.close({restoreFocus:!0}));break;case`Tab`:this.close();break;default:e.key.length===1&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.preventDefault(),this.openState||this.open(),this.moveActiveOptionByText(e.key));break}};handleOptionClick=e=>{let t=this.getOptionIndex(e.target);t<0||this.options[t]?.disabled||(this.activeIndex=t,this.selectActiveOption())};handleOptionPointerMove=e=>{let t=this.getOptionIndex(e.target);t>=0&&!this.options[t]?.disabled&&t!==this.activeIndex&&this.setActiveIndex(t)};handleDocumentPointerDown=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleDocumentFocusIn=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleViewportChange=()=>{this.openState&&this.updatePopupPosition()};renderOptions(){this.listbox.replaceChildren(...this.options.map((e,t)=>{let n=this.document.createElement(`div`);n.id=`${this.listbox.id}-option-${t}`,n.setAttribute(`role`,`option`),n.setAttribute(`aria-selected`,String(e.value===this.selectedValue)),e.disabled&&n.setAttribute(`aria-disabled`,`true`),n.dataset.compactDropdownOption=``,n.dataset.optionIndex=String(t);let r=this.document.createElement(`span`);r.textContent=e.label;let i=this.document.createElement(`span`);return i.dataset.compactDropdownStatus=``,i.setAttribute(`aria-hidden`,`true`),n.append(r,i),n}))}updateSelection(){let e=this.options.find(e=>e.value===this.selectedValue);this.valueElement.textContent=e?.label??`—`,this.trigger.title=e?.label??this.ariaLabel;for(let[e,t]of this.getOptionElements().entries())t.setAttribute(`aria-selected`,String(this.options[e]?.value===this.selectedValue));this.updateActiveOption(!1)}updateDisabledState(){this.trigger.disabled=this.disabled||!this.options.some(e=>!e.disabled)}moveActiveOption(e){this.setActiveIndex(this.getNextEnabledIndex(this.activeIndex,e))}moveActiveOptionByText(e){this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.typeaheadText+=e.toLocaleLowerCase();let t=this.getMatchingOptionIndex(this.typeaheadText);t<0&&this.typeaheadText.length>1&&(this.typeaheadText=e.toLocaleLowerCase(),t=this.getMatchingOptionIndex(this.typeaheadText)),t>=0&&this.setActiveIndex(t),this.typeaheadTimer=setTimeout(()=>{this.typeaheadText=``,this.typeaheadTimer=null},650)}getMatchingOptionIndex(e){for(let t=1;t<=this.options.length;t++){let n=(this.activeIndex+t+this.options.length)%this.options.length,r=this.options[n];if(!r?.disabled&&r.label.toLocaleLowerCase().startsWith(e))return n}return-1}getNextEnabledIndex(e,t){if(!this.options.length)return-1;let n=e;for(let e=0;e<this.options.length;e++)if(n=(n+t+this.options.length)%this.options.length,!this.options[n]?.disabled)return n;return-1}setActiveIndex(e){e<0||this.options[e]?.disabled||(this.activeIndex=e,this.updateActiveOption(!0))}updateActiveOption(e){let t=this.getOptionElements();for(let[e,n]of t.entries())e===this.activeIndex&&this.openState?n.dataset.active=`true`:delete n.dataset.active;let n=t[this.activeIndex];this.openState&&n&&(this.trigger.setAttribute(`aria-activedescendant`,n.id),e&&n.scrollIntoView({block:`nearest`}))}selectActiveOption(){let e=this.options[this.activeIndex];!e||e.disabled||(this.setValue(e.value,{emitChange:!0}),this.close({restoreFocus:!0}))}getFirstEnabledOption(){return this.options.find(e=>!e.disabled)}getSelectedIndex(){return this.options.findIndex(e=>e.value===this.selectedValue)}getOptionIndex(e){let t=e?.closest(`[data-compact-dropdown-option]`);return!t||!this.listbox.contains(t)?-1:Number(t.dataset.optionIndex??-1)}getOptionElements(){return Array.from(this.listbox.querySelectorAll(`[role="option"]`))}updatePopupPosition(){let e=this.document.defaultView;if(!e)return;let t=this.trigger.getBoundingClientRect(),n=Math.min(Math.max(t.width,128),e.innerWidth-8),r=Math.max(4,Math.min(t.left,e.innerWidth-n-4)),i=e.innerHeight-t.bottom-3-4,a=t.top-3-4,o=Math.min(176,this.options.length*20+2),s=i<Math.min(o,80)&&a>i,c=s?a:i;Object.assign(this.listbox.style,{left:`${r}px`,top:s?`auto`:`${t.bottom+3}px`,bottom:s?`${e.innerHeight-t.top+3}px`:`auto`,width:`${n}px`,maxHeight:`${Math.max(40,Math.min(176,c))}px`})}},Tf=`
  [data-compact-dropdown] {
    position: relative;
    width: 100%;
    min-width: 0;
  }
  [data-compact-dropdown] *,
  [data-compact-dropdown-popup] * { box-sizing: border-box; }
  [data-compact-dropdown-trigger] {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 16px;
    align-items: center;
    width: 100%;
    height: 21px;
    min-width: 0;
    margin: 0;
    padding: 0 0 0 9px;
    appearance: none;
    border: 1px solid rgb(127 164 203 / 18%);
    border-bottom-color: rgb(95 180 220 / 30%);
    border-left-color: rgb(54 213 255 / 68%);
    border-radius: 1px;
    background: linear-gradient(90deg, rgb(11 27 39 / 98%), rgb(5 12 20 / 98%));
    box-shadow: inset 2px 0 rgb(54 213 255 / 12%), inset 0 -1px rgb(54 213 255 / 5%);
    clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
    color: #cde3f4;
    cursor: pointer;
    font: 650 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .055em;
    text-align: left;
    text-transform: uppercase;
  }
  [data-compact-dropdown-trigger]::before {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 2px;
    width: 1px;
    background: #44dfff;
    box-shadow: 0 0 5px rgb(68 223 255 / 58%);
    content: '';
  }
  [data-compact-dropdown-trigger]:hover,
  [data-compact-dropdown][data-open='true'] [data-compact-dropdown-trigger] {
    border-color: rgb(82 209 247 / 55%);
    border-left-color: #45ddff;
    background: linear-gradient(90deg, rgb(12 35 48 / 98%), rgb(6 16 25 / 98%));
    color: #effcff;
  }
  [data-compact-dropdown-trigger]:focus-visible {
    outline: 2px solid rgb(91 189 255 / 72%);
    outline-offset: 1px;
  }
  [data-compact-dropdown-trigger]:disabled {
    cursor: default;
    filter: saturate(.35);
    opacity: .48;
  }
  [data-compact-dropdown-value] {
    overflow: hidden;
    padding-right: 4px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-compact-dropdown-chevron] {
    position: relative;
    align-self: stretch;
    border-left: 1px solid rgb(84 188 226 / 20%);
  }
  [data-compact-dropdown-chevron]::before,
  [data-compact-dropdown-chevron]::after {
    position: absolute;
    top: 9px;
    width: 5px;
    height: 1px;
    background: #62dfff;
    content: '';
  }
  [data-compact-dropdown-chevron]::before { left: 3px; transform: rotate(38deg); }
  [data-compact-dropdown-chevron]::after { right: 3px; transform: rotate(-38deg); }
  [data-compact-dropdown][data-open='true'] [data-compact-dropdown-chevron]::before {
    transform: rotate(-38deg);
  }
  [data-compact-dropdown][data-open='true'] [data-compact-dropdown-chevron]::after {
    transform: rotate(38deg);
  }
  [data-compact-dropdown-popup] {
    position: fixed;
    z-index: 2147483000;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 2px;
    border: 1px solid rgb(85 195 229 / 42%);
    border-left-color: rgb(63 222 255 / 84%);
    background: rgb(3 10 17 / 98%);
    box-shadow: 0 9px 24px rgb(0 0 0 / 72%), inset 2px 0 rgb(54 213 255 / 10%);
    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
    color: #cde3f4;
    scrollbar-color: rgb(74 184 216 / 58%) transparent;
    scrollbar-width: thin;
  }
  [data-compact-dropdown-popup][hidden] { display: none; }
  [data-compact-dropdown-option] {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 10px;
    align-items: center;
    height: 19px;
    padding: 0 4px 0 7px;
    border-left: 1px solid transparent;
    color: #9fb7ca;
    cursor: pointer;
    font: 650 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  [data-compact-dropdown-option] > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-compact-dropdown-option][data-active='true'] {
    border-left-color: #49dcff;
    background: linear-gradient(90deg, rgb(36 160 195 / 22%), rgb(18 49 65 / 20%));
    color: #effcff;
  }
  [data-compact-dropdown-option][aria-selected='true'] { color: #bfefff; }
  [data-compact-dropdown-option][aria-disabled='true'] {
    cursor: default;
    opacity: .34;
  }
  [data-compact-dropdown-status] {
    justify-self: center;
    width: 4px;
    height: 4px;
    border: 1px solid rgb(95 201 230 / 24%);
    transform: rotate(45deg);
  }
  [data-compact-dropdown-option][aria-selected='true'] [data-compact-dropdown-status] {
    border-color: #6ee5ff;
    background: #45dfff;
    box-shadow: 0 0 5px rgb(69 223 255 / 70%);
  }
  @media (prefers-reduced-motion: no-preference) {
    [data-compact-dropdown-trigger],
    [data-compact-dropdown-option] { transition: color 90ms linear, background-color 90ms linear; }
  }
`,Ef=0;function Df(e){let t=e.createElement(`div`);t.id=`gpu-operation-tooltip-${Ef++}`,t.setAttribute(`role`,`tooltip`),t.setAttribute(`data-gpu-operation-tooltip`,``),t.hidden=!0,Object.assign(t.style,{position:`fixed`,zIndex:`2147483647`,pointerEvents:`none`,boxSizing:`border-box`,width:`560px`,maxWidth:`calc(100vw - 24px)`,maxHeight:`min(440px, calc(100vh - 24px))`,overflow:`hidden`,padding:`18px`,border:`1px solid rgb(125 170 212 / 32%)`,borderRadius:`12px`,background:`linear-gradient(145deg, #111e30, #080f1b 70%)`,color:`#e4effc`,boxShadow:`0 8px 28px rgb(0 0 0 / 45%)`,font:`14px/1.5 system-ui, sans-serif`,whiteSpace:`normal`,overflowWrap:`anywhere`});let n=e.createElement(`style`);return n.textContent=Mf,t.append(n),e.body.append(t),t}function Of(e,t){let n=t.getBoundingClientRect(),r=t.ownerDocument.documentElement,i=e.getBoundingClientRect();e.style.left=`${Math.max(12,Math.min(n.left,r.clientWidth-i.width-12))}px`;let a=n.bottom+i.height+12<r.clientHeight?n.bottom+6:n.top-i.height-6;e.style.top=`${Math.max(12,Math.min(a,r.clientHeight-i.height-12))}px`}function kf(e,t=e.id){let n=[t];if(e.description&&n.push(e.description),e.resources?.length){n.push(``,`Declared inputs / outputs`);for(let t of e.resources){let e=t.usage===`storage-read-write`||t.usage===`render-attachment`?`Input/output`:[`storage-write`,`copy-destination`].includes(t.usage)?`Output`:`Input`,r=t.width===void 0?t.length===void 0?void 0:`${t.length.toLocaleString()} rows`:`${t.width} × ${t.height}${t.depth&&t.depth>1?` × ${t.depth}`:``}`,i=t.byteLength===void 0?void 0:`${t.byteLength.toLocaleString()} B${t.byteOffset?` @ ${t.byteOffset.toLocaleString()}`:``}`;n.push(`${e}: ${t.id}`,`  ${[t.usage,t.format??t.kind,r,i].filter(Boolean).join(` · `)}`)}}return n.join(`
`)}function Af(e,t,n={}){let r=e.ownerDocument,i=r.createElement(`div`);i.className=`gpu-operation-content`;let a=(e,t,n,i)=>{let a=r.createElement(t);return a.className=n,a.textContent=i,e.append(a),a},o=a(i,`div`,`gpu-operation-header`,``),s=t.id.split(`-`).filter(Boolean).at(-1)??t.id,c=n.name??t.operation??s.replace(/([a-z])([A-Z])/g,`$1 $2`);if(a(o,`strong`,`gpu-operation-name`,c.charAt(0).toUpperCase()+c.slice(1)),t.type&&a(o,`span`,`gpu-operation-kind`,t.type===`render`?`draw`:t.type),a(i,`code`,`gpu-operation-id`,t.id),t.description&&a(i,`p`,`gpu-operation-description`,t.description),t.resources?.length){let e=a(i,`section`,`gpu-operation-resources`,``);a(e,`div`,`gpu-operation-section-label`,`Declared inputs / outputs`);let n=r.createElement(`table`);n.className=`gpu-operation-table`;let o=r.createElement(`caption`);o.textContent=`Declared resource inputs and outputs`,o.hidden=!0,n.append(o);let s=n.createTHead().insertRow();for(let e of[`Access`,`Resource`,`Format / shape`,`Size`]){let t=r.createElement(`th`);t.scope=`col`,t.textContent=e,s.append(t)}let c=n.createTBody(),l=t.id.slice(0,t.id.lastIndexOf(`-`)+1),u=t.resources.slice(0,6);for(let e of u){let t=c.insertRow(),n=e.usage===`storage-read-write`||e.usage===`render-attachment`?`In / out`:[`storage-write`,`copy-destination`].includes(e.usage)?`Output`:`Input`,r=a(t.insertCell(),`span`,`gpu-operation-access`,n);r.dataset.access=n;let i=a(t.insertCell(),`code`,`gpu-operation-resource-id`,l&&e.id.startsWith(l)?e.id.slice(l.length):e.id);i.title=`${e.id} · ${e.usage}`;let o=t.insertCell(),s=e.width===void 0?e.length===void 0?``:`${e.length.toLocaleString()} rows`:`${e.width} × ${e.height}${e.depth&&e.depth>1?` × ${e.depth}`:``}`,u=a(o,`code`,`gpu-operation-format`,[e.format??e.kind,s].filter(Boolean).join(` · `));u.title=u.textContent??``;let d=t.insertCell();d.className=`gpu-operation-size`,d.textContent=e.byteLength===void 0?`—`:e.byteLength>=1024?`${(e.byteLength/1024).toFixed(1)} KiB`:`${e.byteLength} B`,e.byteLength!==void 0&&(d.title=`${e.byteLength.toLocaleString()} bytes`),e.byteOffset&&(d.title+=` · offset ${e.byteOffset.toLocaleString()} bytes`)}e.append(n),jf(a(e,`div`,`gpu-operation-resource-overflow`,``),t.resources.length,u.length)}n.timing&&a(i,`div`,`gpu-operation-timing`,n.timing),e.querySelector(`.gpu-operation-content`)?.remove(),e.append(i);let l=e.hidden;e.hidden=!1;let u=i.querySelector(`tbody`),d=i.querySelector(`.gpu-operation-resource-overflow`);for(;u?.rows.length&&e.scrollHeight>e.clientHeight;)u.deleteRow(-1),jf(d,t.resources.length,u.rows.length),u.rows.length===0&&(u.closest(`table`).hidden=!0);e.hidden=l}function jf(e,t,n){let r=t-n;e.hidden=r===0,e.textContent=r?`+ ${r} more ${r===1?`resource`:`resources`}`:``}var Mf=`
[data-gpu-operation-tooltip] .gpu-operation-content {min-width:0;}
[data-gpu-operation-tooltip] .gpu-operation-header {display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:8px;}
[data-gpu-operation-tooltip] .gpu-operation-name {font:650 18px/1.25 system-ui,sans-serif; letter-spacing:-.025em; color:#f1f6ff;}
[data-gpu-operation-tooltip] .gpu-operation-kind {font:600 9px/1.4 system-ui,sans-serif; text-transform:uppercase; letter-spacing:.12em; padding:4px 7px; border:1px solid #79aee536; border-radius:5px; background:#69a8f014; color:#9ec7f4;}
[data-gpu-operation-tooltip] .gpu-operation-id {display:inline-block; max-width:100%; box-sizing:border-box; padding:4px 7px; border:1px solid #8da8c41a; border-radius:4px; background:#02081366; font:11px/1.4 ui-monospace,monospace; color:#90a6be; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:top;}
[data-gpu-operation-tooltip] .gpu-operation-description {margin:10px 0 12px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; font:400 16px/1.5 system-ui,sans-serif; color:#dce8f6; white-space:pre-wrap;}
[data-gpu-operation-tooltip] .gpu-operation-resources {margin-top:12px; border-top:1px solid #a0bcdd20; padding-top:10px;}
[data-gpu-operation-tooltip] .gpu-operation-section-label {margin-bottom:9px; font:600 9px/1.4 system-ui,sans-serif; letter-spacing:.12em; text-transform:uppercase; color:#849bb5;}
[data-gpu-operation-tooltip] .gpu-operation-table {width:100%; border-collapse:collapse; table-layout:fixed; margin:0; display:table; font:11px/1.4 system-ui,sans-serif; color:#bfd0e3;}
[data-gpu-operation-tooltip] .gpu-operation-table th {padding:0 6px 7px; text-align:left; font:500 10px/1.4 system-ui,sans-serif; color:#7891ac; border-bottom:1px solid #a0bcdd20;}
[data-gpu-operation-tooltip] .gpu-operation-table td {padding:5px 6px; vertical-align:middle; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-bottom:1px solid #a0bcdd10; background:transparent;}
[data-gpu-operation-tooltip] .gpu-operation-table tr:last-child td {border-bottom:0;}
[data-gpu-operation-tooltip] .gpu-operation-table th:first-child {width:58px; padding-left:0;}
[data-gpu-operation-tooltip] .gpu-operation-table td:first-child {padding-left:0;}
[data-gpu-operation-tooltip] .gpu-operation-table th:nth-child(3) {width:100px;}
[data-gpu-operation-tooltip] .gpu-operation-table th:last-child {width:62px; text-align:right; padding-right:0;}
[data-gpu-operation-tooltip] .gpu-operation-table td:last-child {padding-right:0; text-align:right;}
[data-gpu-operation-tooltip] .gpu-operation-table code {display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font:10.5px/1.4 ui-monospace,monospace; padding:0; border:0; background:transparent; color:inherit;}
[data-gpu-operation-tooltip] .gpu-operation-resource-id {color:#d6e6f8 !important;}
[data-gpu-operation-tooltip] .gpu-operation-resource-overflow {padding-top:7px; color:#7891ac; font:10px/1.4 system-ui,sans-serif;}
[data-gpu-operation-tooltip] .gpu-operation-access {display:inline-block; white-space:nowrap; font:600 9px/1.4 system-ui,sans-serif; padding:2px 5px; border-radius:4px; color:#8fc6fa; background:#3c92ec1a;}
[data-gpu-operation-tooltip] .gpu-operation-access[data-access="Output"] {color:#bba8ff; background:#9874ef1a;}
[data-gpu-operation-tooltip] .gpu-operation-access[data-access="In / out"] {color:#88d7c4; background:#54bda31a;}
[data-gpu-operation-tooltip] .gpu-operation-size {font:10px/1.4 ui-monospace,monospace; color:#a5bbd3; white-space:nowrap;}
[data-gpu-operation-tooltip] .gpu-operation-timing {margin-top:12px; padding-top:10px; border-top:1px solid #a0bcdd20; font:10px/1.5 ui-monospace,monospace; color:#7f9ab6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
`,Nf=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:1}),Pf=new Intl.NumberFormat(`en-US`,{notation:`compact`,maximumFractionDigits:1}),Ff=class{element;graphLabels;nodeLabels;counterLabels;snapshot={graphs:[]};selectedGraphId=null;selectionIsManual=!1;graphOptionsSignature=``;memoryMarkup=``;nodeRows=new Map;counterRows=new Map;graphDropdown;tooltip;tooltipEvents=new AbortController;inspector;resourceRows=new Map;resources=new Map;activeResourceKey;previewGeneration=0;renderedGraphId;selectedResourceKey;viewerGeneration=0;pendingPreviews=new Map;thumbnailGeneration=0;activeNodeId;constructor(e,t={}){this.element=e,this.inspector=t.inspector,this.tooltip=Df(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-graph-tooltip`,``);let n=e=>{let t=e.target.closest(`[data-resource-key]`);if(t&&this.element.contains(t)){this.showResourceTooltip(t);return}let n=e.target.closest(`[data-full-name]`);n&&this.element.contains(n)&&this.showTooltip(n)},r=e=>{let t=e.target.closest(`[data-full-name], [data-resource-key]`),n=e.relatedTarget;(!(n instanceof Node)||!t?.contains(n))&&this.hideTooltip()},i={signal:this.tooltipEvents.signal};e.addEventListener(`mouseover`,n,i),e.addEventListener(`focusin`,n,i),e.addEventListener(`mouseout`,r,i),e.addEventListener(`focusout`,r,i),e.addEventListener(`scroll`,()=>this.hideTooltip(),{...i,capture:!0}),e.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip();let t=e.target.closest(`[data-resource-key]`);t&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.selectResource(t.dataset.resourceKey))},i),e.ownerDocument.defaultView?.addEventListener(`resize`,()=>this.hideTooltip(),i),this.graphLabels=t.graphLabels??{},this.nodeLabels=t.nodeLabels??{},this.counterLabels=t.counterLabels??{},this.element.innerHTML=`<div data-gpu-command-graph-inspector>
      <style>${zf}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div role="tablist" aria-label="Graph inspector views">
          <button type="button" role="tab" aria-selected="true" data-inspector-tab="timings">Graph</button>
          <button type="button" role="tab" aria-selected="false" data-inspector-tab="resources">Graph Resources</button>
        </div>
        <div data-inspector-view="timings">
        <div class="graph-inspector-summary">
          ${Bf(`encodings`,``,`encoding-count`)}
          ${Bf(`CPU p50 / p95 (ms)`,``,`cpu-totals`)}
          ${Bf(`GPU p50 / p95 (ms)`,``,`gpu-totals`)}
          ${Bf(`GPU samples`,``,`gpu-samples`)}
        </div>
        <div class="graph-inspector-memory" data-graph-inspector-memory></div>
        <div class="graph-inspector-counters" data-graph-inspector-counters hidden>
          <div class="graph-inspector-counter graph-inspector-counter-header"><span>Sampled counter</span><strong>Latest</strong><strong>50/95</strong></div>
          <div class="graph-inspector-counter-rows" data-graph-inspector-counter-rows></div>
        </div>
        <div class="graph-inspector-node graph-inspector-node-header"><span>Node</span><strong>CPU 50/95 (ms)</strong><strong>GPU 50/95 (ms)</strong></div>
        <div class="graph-inspector-legend"><span style="color:#508bc9">● Compute</span> · <span style="color:#b16cba">● Draw</span> · <span style="color:#ba873e">● Copy</span></div>
        <div class="graph-inspector-nodes" data-graph-inspector-nodes></div>
        </div>
        <div data-inspector-view="resources" hidden>
        <div class="graph-inspector-legend">Select a resource to inspect current data</div>
        <div class="graph-inspector-resources" data-graph-inspector-resources role="group" aria-label="Graph resources"></div>
        <button type="button" data-texture-previews>Refresh texture thumbnails</button>
        <button type="button" data-resource-refresh>Refresh selected resource</button>
        <div data-resource-viewer role="region" aria-label="Resource contents" aria-live="polite">Select a buffer or texture.</div>
        </div>
      </div>
    </div>`,e.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-inspector-tab]`);if(r){this.hideTooltip();for(let t of e.querySelectorAll(`[data-inspector-tab]`))t.setAttribute(`aria-selected`,String(t===r));for(let t of e.querySelectorAll(`[data-inspector-view]`))t.hidden=t.dataset.inspectorView!==r.dataset.inspectorTab}n.closest(`[data-texture-previews]`)&&this.refreshTextureThumbnails();let i=n.closest(`[data-resource-key]`);i&&this.selectResource(i.dataset.resourceKey),n.closest(`[data-resource-refresh]`)&&this.selectedResourceKey&&this.selectResource(this.selectedResourceKey)},i),this.graphDropdown=new wf(this.element.querySelector(`[data-graph-inspector-picker-host]`),{ariaLabel:`Graph`,options:[],onChange:e=>{this.hideTooltip(),this.selectedGraphId=e,this.selectionIsManual=!0,this.render()}})}update(e,t){if(this.snapshot=e,e.graphs.some(e=>e.id===this.selectedGraphId)||(this.selectedGraphId=null,this.selectionIsManual=!1),!this.selectionIsManual&&t){let n=e.graphs.find(e=>e.id===t);n&&(this.selectedGraphId=n.id)}this.selectedGraphId??=e.graphs[0]?.id??null,this.render()}destroy(){this.hideTooltip(),this.viewerGeneration++,this.thumbnailGeneration++,this.tooltipEvents.abort(),this.tooltip.remove(),this.graphDropdown.destroy(),this.element.replaceChildren(),this.nodeRows.clear(),this.counterRows.clear(),this.resourceRows.clear(),this.resources.clear()}showTooltip(e){this.activeResourceKey&&this.hideTooltip(),this.activeNodeId=e.getAttribute(`data-full-name`)??void 0;let t=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId)?.nodes.find(e=>e.id===this.activeNodeId);if(!t)return;let n=Kf(this.nodeLabels,t.id);Af(this.tooltip,t,{name:n===t.id?void 0:n}),this.tooltip.hidden=!1,Of(this.tooltip,e)}async showResourceTooltip(e){let t=e.dataset.resourceKey;if(this.activeResourceKey===t)return;this.hideTooltip(),this.activeResourceKey=t;let n=this.previewGeneration,r=this.resources.get(t),i=this.selectedGraphId;if(!r||!i)return;let a=this.tooltip.ownerDocument.createElement(`div`);a.className=`gpu-operation-content`;let o=this.tooltip.ownerDocument.createElement(`strong`);o.textContent=r.summary.id;let s=this.tooltip.ownerDocument.createElement(`div`);s.textContent=Jf(r.summary);let c=this.tooltip.ownerDocument.createElement(`pre`);c.style.whiteSpace=`pre-wrap`,c.style.fontSize=`11px`,c.textContent=`Reading current GPU data…`,a.append(o,s,c),this.tooltip.querySelector(`.gpu-operation-content`)?.remove(),this.tooltip.append(a),this.tooltip.hidden=!1,Of(this.tooltip,e);try{if(!this.inspector)throw Error(`No live inspector is connected.`);let e=await this.readPreview(t,i,r);if(n!==this.previewGeneration)return;this.showTextureThumbnail(t,e),c.textContent=Yf(e);let o=Sf(this.tooltip.ownerDocument,e);o&&a.insertBefore(o,c)}catch(e){if(n!==this.previewGeneration)return;c.textContent=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`}n===this.previewGeneration&&Of(this.tooltip,e)}readPreview(e,t,n){let r=`${t}/${e}`,i=this.pendingPreviews.get(r);if(i)return i;let a=this.inspector?this.inspector.readResource(t,n.nodeId,n.index):Promise.reject(Error(`No live inspector is connected.`));return this.pendingPreviews.set(r,a),a.finally(()=>this.pendingPreviews.delete(r)).catch(()=>{}),a}async selectResource(e){this.hideTooltip();let t=this.resources.get(e),n=this.selectedGraphId;if(!t||!n)return;this.selectedResourceKey=e;let r=++this.viewerGeneration;for(let[t,n]of this.resourceRows)n.setAttribute(`aria-pressed`,String(t===e));let i=this.element.querySelector(`[data-resource-viewer]`);i.textContent=`${t.summary.id} · ${Jf(t.summary)}\nReading current GPU data…`;try{let a=await this.readPreview(e,n,t);if(r!==this.viewerGeneration)return;this.showTextureThumbnail(e,a),i.textContent=`${t.summary.id} · ${Jf(t.summary)}\n${Yf(a)}`;let o=Sf(i.ownerDocument,a);o&&i.prepend(o)}catch(e){r===this.viewerGeneration&&(i.textContent=`${t.summary.id}\nPreview unavailable: ${e instanceof Error?e.message:String(e)}`)}}showTextureThumbnail(e,t){let n=this.resourceRows.get(e);if(!n)return;let r=Sf(n.ownerDocument,t);if(!r)return;let i=Math.max(r.width,r.height);r.style.width=`${48*r.width/i}px`,r.style.height=`${48*r.height/i}px`,r.style.flexShrink=`0`,n.removeAttribute(`title`),n.querySelector(`canvas`)?.remove(),n.prepend(r)}async refreshTextureThumbnails(){let e=this.selectedGraphId;if(!e)return;let t=++this.thumbnailGeneration,n=this.element.querySelector(`[data-texture-previews]`);n.disabled=!0;let r=[...this.resources].filter(([,e])=>e.summary.kind===`texture`).slice(0,32);n.textContent=`Reading up to 32 textures…`;try{for(let[n,i]of r){if(t!==this.thumbnailGeneration)return;this.resourceRows.get(n)?.querySelector(`canvas`)?.remove();try{let r=await this.readPreview(n,e,i);if(t!==this.thumbnailGeneration)return;this.showTextureThumbnail(n,r)}catch(e){if(t!==this.thumbnailGeneration)return;let r=this.resourceRows.get(n);r&&(r.title=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`)}}}finally{n.disabled=!1,n.textContent=`Refresh texture thumbnails`}}hideTooltip(){this.previewGeneration++,this.activeResourceKey=void 0,this.activeNodeId=void 0,this.tooltip.hidden=!0}render(){let e=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId),t=this.element.querySelector(`[data-graph-inspector-empty]`),n=this.element.querySelector(`[data-graph-inspector-content]`);if(!e){this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.thumbnailGeneration++,this.renderedGraphId=void 0,t.hidden=!1,n.hidden=!0;return}if(this.renderedGraphId!==e.id){this.thumbnailGeneration++;for(let e of this.resourceRows.values())e.querySelector(`canvas`)?.remove();this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`}this.renderedGraphId=e.id,this.resources.clear();for(let t of e.nodes)for(let[e,n]of(t.resources??[]).entries()){let{usage:r,...i}=n,a=JSON.stringify(i);this.resources.set(a,{nodeId:t.id,index:e,summary:n})}this.selectedResourceKey&&!this.resources.has(this.selectedResourceKey)&&(this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`),If(this.element.querySelector(`[data-graph-inspector-resources]`),this.resourceRows,[...this.resources].map(([e,t])=>({id:e,...t})),(e,t)=>{e.className=`graph-inspector-resource`,e.tabIndex=0,Y(e,`role`,`button`),Y(e,`aria-pressed`,String(t.id===this.selectedResourceKey)),Y(e,`data-resource-key`,t.id),Y(e,`aria-describedby`,this.tooltip.id);let n=e.querySelector(`span`);n||(n=e.ownerDocument.createElement(`span`),e.append(n)),Lf(n,`${t.summary.kind===`buffer`?`Buffer`:`Texture`} · ${t.summary.id} · ${Jf(t.summary)}`)}),this.activeResourceKey&&!this.resources.has(this.activeResourceKey)&&this.hideTooltip(),t.hidden=!0,n.hidden=!1;let r=this.snapshot.graphs.map(e=>`${e.id}\u0000${this.getGraphLabel(e.id)}`).join(``);r!==this.graphOptionsSignature&&(this.graphDropdown.setOptions(this.snapshot.graphs.map(e=>({value:e.id,label:this.getGraphLabel(e.id)}))),this.graphOptionsSignature=r),this.graphDropdown.value!==e.id&&(this.graphDropdown.value=e.id);let i=e.stats.logicalTransientBytes+e.stats.logicalTransientTextureBytes,a=e.stats.reusedTransientBytes+e.stats.reusedTransientTextureBytes,o=i?a/i*100:0,s=e.totals.gpu.sampleCount;If(this.element.querySelector(`[data-graph-inspector-nodes]`),this.nodeRows,e.nodes,(t,n)=>{t.hasChildNodes()||(t.className=`graph-inspector-node`,t.innerHTML=`<span><i></i><span data-node-label></span></span><strong data-node-cpu></strong><strong data-node-gpu></strong>`),Y(t,`data-node-type`,n.type),Y(t,`data-full-name`,n.id),Y(t,`data-operation-details`,kf(n)),Y(t,`aria-describedby`,this.tooltip.id),t.tabIndex=0,this.activeNodeId===n.id&&this.showTooltip(t);let r=t.querySelector(`i`),i=n.type===`render`?`draw`:n.type;Y(r,`title`,i),Y(r,`aria-label`,i);let a=Kf(this.nodeLabels,n.id);Lf(t.querySelector(`[data-node-label]`),a===n.id?Vf(n.id,e.id):a),Lf(t.querySelector(`[data-node-cpu]`),Hf(n.cpu)),Lf(t.querySelector(`[data-node-gpu]`),Hf(n.gpu))}),this.activeNodeId&&!e.nodes.some(e=>e.id===this.activeNodeId)&&this.hideTooltip(),If(this.element.querySelector(`[data-graph-inspector-counter-rows]`),this.counterRows,e.counters,(e,t)=>{e.hasChildNodes()||(e.className=`graph-inspector-counter`,e.innerHTML=`<span></span><strong data-counter-latest></strong><strong data-counter-percentiles></strong>`),Y(e,`title`,`${t.id} · ${t.sampleCount} samples`),Lf(e.querySelector(`span`),this.getCounterLabel(t.id)),Lf(e.querySelector(`[data-counter-latest]`),Wf(t.latestValue)),Lf(e.querySelector(`[data-counter-percentiles]`),`${Wf(t.p50Value)} / ${Wf(t.p95Value)}`)}),this.setText(`encoding-count`,String(e.encodingCount)),this.setText(`cpu-totals`,Hf(e.totals.cpu)),this.setText(`gpu-totals`,Hf(e.totals.gpu)),this.setText(`gpu-samples`,`${s}${e.timingReadFailureCount?` · ${e.timingReadFailureCount} failed`:``}`);let c=`
      <span>${e.stats.nodeOrder.length} nodes</span>
      <span>${Gf(e.stats.logicalResourceBytes)} logical</span>
      <span>${Gf(e.stats.physicalTransientResourceBytes)} scratch</span>
      ${e.preflight?.annotatedNodeCount?`<span>${e.preflight.annotatedNodeCount}/${e.stats.nodeOrder.length} costed nodes</span>`:``}
      ${e.preflight?.maximumInvocationCount?`<span>${Rf(e.preflight.maximumInvocationCount)} max invocations</span>`:``}
      ${e.preflight?.readByteLength?`<span>${Gf(e.preflight.readByteLength)} max reads</span>`:``}
      ${e.preflight?.writeByteLength?`<span>${Gf(e.preflight.writeByteLength)} max writes</span>`:``}
      <span>${o?`${o.toFixed(0)}% reuse`:`no reuse`}</span>
      <span>${s?`GPU timings sampled`:`CPU timings only`}</span>`;c!==this.memoryMarkup&&(this.element.querySelector(`[data-graph-inspector-memory]`).innerHTML=c,this.memoryMarkup=c);let l=this.element.querySelector(`[data-graph-inspector-counters]`);l.hidden=e.counters.length===0}setText(e,t){Lf(this.element.querySelector(`[data-graph-inspector-${e}]`),t)}getGraphLabel(e){return Kf(this.graphLabels,e)}getCounterLabel(e){return Kf(this.counterLabels,e)}};function If(e,t,n,r){let i=new Set(n.map(e=>e.id));for(let[e,n]of t)i.has(e)||(n.remove(),t.delete(e));for(let[i,a]of n.entries()){let n=t.get(a.id);n||(n=e.ownerDocument.createElement(`div`),t.set(a.id,n)),r(n,a);let o=e.children[i]??null;o!==n&&e.insertBefore(n,o)}}function Lf(e,t){e.textContent!==t&&(e.textContent=t)}function Y(e,t,n){e.getAttribute(t)!==n&&e.setAttribute(t,n)}function Rf(e){return Pf.format(e)}var zf=`
  [data-gpu-command-graph-inspector] { min-width: 0; }
  [data-gpu-command-graph-inspector] * { box-sizing: border-box; }
  [data-gpu-command-graph-inspector] [hidden] { display: none !important; }
  [data-inspector-view="timings"] { display: grid; gap: 7px; }
  [data-gpu-command-graph-inspector] button { background: #17263a; border: 1px solid #405777; color: #cbdcf1; border-radius: 4px; padding: 5px 8px; cursor: pointer; }
  [data-gpu-command-graph-inspector] [aria-selected="true"], [data-gpu-command-graph-inspector] [aria-pressed="true"] { background: #284566; }
  [data-resource-viewer] { white-space: pre-wrap; overflow-wrap: anywhere; font: 11px/1.6 ui-monospace, monospace; padding: 12px; margin-top: 8px; background: #101c2b; color: #dce8f7; max-height: 360px; overflow: auto; }
  [data-resource-viewer] canvas { display: block; margin-bottom: 10px; }
  [data-gpu-command-graph-inspector] .graph-inspector-content { display: grid; gap: 7px; min-width: 0; }
  [data-gpu-command-graph-inspector] .graph-inspector-content[hidden] { display: none; }
  [data-gpu-command-graph-inspector] .graph-inspector-picker {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    color: #91a6c3;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-metric {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
    padding: 5px 6px;
    border: 1px solid rgb(137 166 211 / 14%);
    border-radius: 4px;
    background: rgb(15 24 38 / 54%);
    color: #8295af;
    font: 8px/1.2 system-ui, sans-serif;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-metric strong {
    overflow: hidden;
    color: #e8f1ff;
    font: 650 9px/1.2 ui-monospace, monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-memory {
    display: flex;
    flex-wrap: wrap;
    gap: 3px 8px;
    color: #7286a2;
    font: 8px/1.35 ui-monospace, monospace;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counters[hidden] { display: none; }
  [data-gpu-command-graph-inspector] .graph-inspector-counter-rows {
    max-height: 110px;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 52px 66px;
    align-items: center;
    gap: 7px;
    min-height: 22px;
    border-bottom: 1px solid rgb(137 166 211 / 9%);
    color: #b9c8dc;
    font: 8px/1.25 ui-monospace, monospace;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter strong {
    color: #dce8f7;
    font-weight: 600;
    text-align: right;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter-header {
    min-height: 17px;
    border-bottom-color: rgb(137 166 211 / 18%);
    color: #7186a3;
    font: 7px/1.2 system-ui, sans-serif;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter-header strong {
    color: #7186a3;
    font-weight: 600;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 66px 66px;
    align-items: center;
    gap: 7px;
    min-height: 22px;
    border-bottom: 1px solid rgb(137 166 211 / 9%);
    color: #b9c8dc;
    font: 8px/1.25 ui-monospace, monospace;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node i {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 6px;
    background: #508bc9;
    color: #729ed4;
    font-style: normal;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] [data-node-type="render"] i { background: #b16cba; }
  [data-gpu-command-graph-inspector] [data-node-type="copy"] i { background: #ba873e; }
  [data-gpu-command-graph-inspector] .graph-inspector-node strong {
    color: #dce8f7;
    font-weight: 600;
    text-align: right;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node-header {
    min-height: 17px;
    border-bottom-color: rgb(137 166 211 / 18%);
    color: #7186a3;
    font: 7px/1.2 system-ui, sans-serif;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node-header strong {
    color: #7186a3;
    font-weight: 600;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-nodes { max-height: 154px; overflow: auto; }
  [data-gpu-command-graph-inspector] .graph-inspector-legend { font: 10px/1.4 system-ui, sans-serif; }
  [data-gpu-command-graph-inspector] .graph-inspector-resources { max-height: 140px; overflow: auto; }
  [data-gpu-command-graph-inspector] .graph-inspector-resource { display: flex; align-items: center; gap: 8px; color: #b9c8dc; font: 10px/1.5 ui-monospace, monospace; padding: 4px 0; overflow-wrap: anywhere; border-bottom: 1px solid #26354a; }
  [data-gpu-command-graph-inspector] .graph-inspector-empty { color: #8192aa; font-size: 9px; }
`;function Bf(e,t,n){return`<span class="graph-inspector-metric"><span>${qf(e)}</span><strong data-graph-inspector-${n}>${qf(t)}</strong></span>`}function Vf(e,t){let n=t.endsWith(`-graph`)?t.slice(0,-6):t,r=e.startsWith(`${n}-`)?e.slice(n.length+1):e;return r.length>32?`${r.slice(0,30)}…`:r}function Hf(e){return e.p50Milliseconds===void 0?`—`:`${Uf(e.p50Milliseconds)} / ${Uf(e.p95Milliseconds??e.p50Milliseconds)}`}function Uf(e){return e.toFixed(e<1?3:2)}function Wf(e){return(e>=1e4?Pf:Nf).format(e)}function Gf(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(1)} KiB`:e<1024**3?`${(e/1024**2).toFixed(1)} MiB`:`${(e/1024**3).toFixed(1)} GiB`}function Kf(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:t}function qf(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Jf(e){return e.kind===`buffer`?`${e.format??`raw bytes`} · ${e.byteLength??0} B @ ${e.byteOffset??0}`:`${e.format??e.kind} · ${e.width} × ${e.height} · mip ${e.baseMipLevel??0}, layer ${e.baseArrayLayer??0}`}function Yf(e){let t=e.data,n,r=`bytes`;return/^float32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Float32Array(t.slice().buffer)),r=`float32`):/^uint32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Uint32Array(t.slice().buffer)),r=`uint32`):n=Array.from(t),`Current allocation · ${t.length} bytes read${e.width?` · top-left ${e.width} × ${e.height}`:``}\n${r}: ${n.slice(0,64).join(`, `)}${n.length>64?`, …`:``}`}var Xf=class{panel;renderer=null;snapshot={graphs:[]};preferredGraphId;constructor(e={}){this.panel=ff({id:e.id??`gpu-command-graph-debug`,title:e.title??`GPU Graph`,html:`<p class="hint">Compiled nodes, memory, and recorded timings. GPU timings appear when supplied by the application.</p><div data-graph-debug-host></div>`,onRender:t=>{let n=new Ff(t.querySelector(`[data-graph-debug-host]`),e);return this.renderer=n,n.update(this.snapshot,this.preferredGraphId),()=>{n.destroy(),this.renderer===n&&(this.renderer=null)}}})}update(e,t){this.snapshot=e,this.preferredGraphId=t,this.renderer?.update(e,t)}},Zf=new Intl.NumberFormat(`en-US`,{maximumSignificantDigits:3,useGrouping:!1}),Qf=class{panel;renderer=null;report;label=``;constructor(e={}){this.panel=ff({id:e.id??`gpu-trace`,title:e.title??`GPU Trace`,html:`<div data-gpu-trace-host></div>`,onRender:e=>{let t=new $f(e.querySelector(`[data-gpu-trace-host]`));return this.renderer=t,t.update(this.report,this.label),()=>{t.destroy(),this.renderer===t&&(this.renderer=null)}}})}update(e,t=``){this.report=e,this.label=t,this.renderer?.update(e,t)}},$f=class{combinedTimeline=!1;tooltip;activeSpanKey;tooltipNodes=new Map;constructor(e){this.element=e,this.tooltip=Df(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-trace-tooltip`,``)}update(e,t=``){this.tooltipNodes.clear();let n=document.createElement(`section`);n.setAttribute(`data-gpu-trace`,``),n.setAttribute(`aria-label`,`GPU Trace`);let r=document.createElement(`style`);if(r.textContent=np,n.append(r),ep(n,`strong`,t||`Latest graph execution`),!e)ep(n,`p`,`No trace collected yet.`);else{let r=e.clockCorrelation,i=!!(r&&Number.isFinite(r.offsetMilliseconds)&&Number.isFinite(r.uncertaintyMilliseconds)&&r.uncertaintyMilliseconds>=0),a=document.createElement(`label`),o=document.createElement(`input`);o.type=`checkbox`,o.checked=this.combinedTimeline,o.disabled=!i,o.addEventListener(`change`,()=>{this.combinedTimeline=o.checked,this.update(e,t)}),a.append(o,` Combined timeline (estimated)`),n.append(a);let s=this.combinedTimeline&&i;ep(n,`p`,s?`Alignment ±${tp(r.uncertaintyMilliseconds)}ms, plus timestamp precision. Submission-time estimate.`:`CPU and GPU use separate clocks. Each timeline starts at its own origin.`),i||ep(n,`p`,`Combined timeline requires submission clock correlation.`);let c=s?r.offsetMilliseconds:0,l=s?e.nodes.flatMap(e=>[e.cpuEncodeStartTimeMilliseconds,e.gpuStartTimeMilliseconds===void 0?void 0:e.gpuStartTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[],u=s?e.nodes.flatMap(e=>[e.cpuEncodeEndTimeMilliseconds,e.gpuEndTimeMilliseconds===void 0?void 0:e.gpuEndTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[];s&&e.cpuEncodeStartTimeMilliseconds!==void 0&&l.push(e.cpuEncodeStartTimeMilliseconds),s&&e.cpuEncodeEndTimeMilliseconds!==void 0&&u.push(e.cpuEncodeEndTimeMilliseconds);for(let t of[`gpu`,`cpu`]){let r=e.nodes.flatMap(e=>{let n=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,r=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds;return n!==void 0&&r!==void 0&&Number.isFinite(n)&&Number.isFinite(r)&&r>=n?[{node:e,start:n+(t===`gpu`?c:0),end:r+(t===`gpu`?c:0)}]:[]}),i=document.createElement(`section`);if(i.dataset.traceClock=t,n.append(i),ep(i,`h4`,t===`cpu`?`CPU encoding`:`GPU execution`),!r.length){ep(i,`p`,t===`cpu`?`CPU span endpoints unavailable.`:`GPU span endpoints unavailable. Timestamp queries are required.`);continue}let a=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,o=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds,d=s?Math.min(...l):Math.min(...r.map(e=>e.start),a??1/0),f=(s?Math.max(...u):Math.max(...r.map(e=>e.end),o??-1/0))-d;ep(i,`p`,`0 – ${tp(f)}ms · ${r.length}/${e.nodes.length} nodes`);let p=document.createElement(`div`);p.className=`gpu-trace-rows`,i.append(p);for(let e of r){let n=document.createElement(`div`);n.className=`gpu-trace-row`,ep(n,`span`,e.node.operation??e.node.type).setAttribute(`aria-label`,kf(e.node));let r=document.createElement(`div`);r.className=`gpu-trace-track`;let i=document.createElement(`span`);i.className=`gpu-trace-bar`,i.tabIndex=0,i.style.left=`${f?(e.start-d)/f*100:0}%`,i.style.width=`${f?(e.end-e.start)/f*100:0}%`;let a=t===`cpu`?e.node.cpuEncodeTimeMilliseconds:e.node.gpuTimeMilliseconds,o=`${e.node.id} (${e.node.type}${e.node.condition?.outcome===`skipped`?`, skipped`:``}): ${tp(e.start-d)}–${tp(e.end-d)}ms; duration ${tp(a??e.end-e.start)}ms`;n.dataset.spanKey=JSON.stringify([t,e.node.id]),this.tooltipNodes.set(n.dataset.spanKey,{node:e.node,timing:`${t.toUpperCase()} · ${tp(a??e.end-e.start)}ms duration · ${tp(e.start-d)}–${tp(e.end-d)}ms${e.node.condition?.outcome===`skipped`?` · skipped`:``}`});let s=kf(e.node,o);n.dataset.spanDetails=s,i.setAttribute(`aria-describedby`,this.tooltip.id),i.setAttribute(`aria-label`,s),r.append(i),n.append(r),ep(n,`span`,`${tp(a??e.end-e.start)}ms`),p.append(n)}}}let i=ep(n,`p`,`Hover or focus a span for details.`);i.setAttribute(`aria-live`,`polite`);let a=e=>{let t=e.target.closest(`.gpu-trace-row`);t&&(i.textContent=t.dataset.spanDetails,this.showTooltip(t))},o=e=>{let t=e.relatedTarget,n=e.target.closest(`.gpu-trace-row`);(!(t instanceof Node)||!n?.contains(t))&&this.hideTooltip()};n.addEventListener(`mouseover`,a),n.addEventListener(`focusin`,a),n.addEventListener(`mouseout`,o),n.addEventListener(`focusout`,o),n.addEventListener(`scroll`,()=>this.hideTooltip(),!0),n.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip()});let s=this.element.ownerDocument.activeElement,c=s&&this.element.contains(s)?s.closest(`.gpu-trace-row`)?.dataset.spanKey:void 0,l=this.activeSpanKey;this.element.replaceChildren(n);let u=Array.from(n.querySelectorAll(`.gpu-trace-row`)),d=u.find(e=>e.dataset.spanKey===c);d&&d.querySelector(`.gpu-trace-bar`).focus({preventScroll:!0});let f=u.find(e=>e.dataset.spanKey===l);f?(i.textContent=f.dataset.spanDetails,this.showTooltip(f)):this.hideTooltip()}showTooltip(e){this.activeSpanKey=e.dataset.spanKey;let t=this.tooltipNodes.get(this.activeSpanKey);t&&(Af(this.tooltip,t.node,{timing:t.timing}),this.tooltip.hidden=!1,Of(this.tooltip,e))}hideTooltip(){this.activeSpanKey=void 0,this.tooltip.hidden=!0}destroy(){this.hideTooltip(),this.tooltip.remove(),this.tooltipNodes.clear(),this.element.replaceChildren()}};function ep(e,t,n){let r=document.createElement(t);return r.textContent=n,e.append(r),r}function tp(e){return Zf.format(e)}var np=`
[data-gpu-trace-tooltip] {position: fixed; z-index: 10000; max-width: min(360px, calc(100vw - 16px)); padding: 8px 10px; border: 1px solid #64748b; border-radius: 5px; background: #0f172a; color: #f1f5f9; box-shadow: 0 4px 16px #0006; font: 11px/1.5 system-ui, sans-serif; overflow-wrap: anywhere; pointer-events: none;}
[data-gpu-trace-tooltip][hidden] {display: none;}

[data-gpu-trace] {font: 11px/1.5 system-ui, sans-serif; min-width: 0; color: var(--luma-example-text, #cbd5e1);}
[data-gpu-trace] p {color: var(--luma-example-text-muted, #94a3b8); margin: 6px 0;}
[data-gpu-trace] h4 {margin: 12px 0 0; font-size: 12px;}
[data-gpu-trace] .gpu-trace-rows {max-height: 260px; overflow: auto;}
[data-gpu-trace] .gpu-trace-row {display: grid; grid-template-columns: minmax(82px, 1fr) minmax(70px, 2fr) 65px; gap: 8px; align-items: center; min-height: 26px;}
[data-gpu-trace] .gpu-trace-row > span {overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
[data-gpu-trace] .gpu-trace-row > span:last-child {text-align: right; font: 10px ui-monospace, monospace;}
[data-gpu-trace] .gpu-trace-track {height: 18px; position: relative; background: rgb(128 128 128 / 12%); border-radius: 3px;}
[data-gpu-trace] .gpu-trace-bar {position: absolute; top: 2px; height: 14px; min-width: 2px; max-width: 100%; border-radius: 3px; background: #38bdf8;}
[data-gpu-trace] [data-trace-clock='gpu'] .gpu-trace-bar {background: #a78bfa;}
[data-gpu-trace] .gpu-trace-bar:focus {outline: 2px solid currentColor; outline-offset: 2px;}
`,rp=class{inspector=new fo;inspectorPanel=new Xf({inspector:this.inspector});tracePanel;graphs=new Map;sampleCounts=new Map;latestEncoding=null;generation=0;latestGraphId;constructor(e={}){this.tracePanel=new Qf({title:e.traceTitle})}encode(e,t,n){let r=(this.graphs.get(e.id)===e?this.sampleCounts.get(e.id):0)%60==0&&t.getTimeProfilingQuerySet()===null&&t.device.features.has(`timestamp-query`)&&t.withTimeProfilingQuerySet?t.device.createQuerySet({type:`timestamp`,count:Math.min(8192,Math.max(2,e.stats.nodeOrder.length*2))}):void 0,i;try{i=r?t.withTimeProfilingQuerySet(r,()=>e.encode(t,n)):e.encode(t,n)}catch(e){throw r?.destroy(),e}return this.record(e,i,r),i}record(e,t,n){this.graphs.get(e.id)!==e&&(this.graphs.set(e.id,e),this.sampleCounts.set(e.id,0),this.inspector.registerGraph(e)),this.inspector.recordEncoding(e.id,t);let r=this.sampleCounts.get(e.id);if(this.sampleCounts.set(e.id,r+1),r%60!=0)return;this.latestEncoding=t,this.latestGraphId=e.id,this.inspectorPanel.update(this.inspector.getSnapshot(),e.id);let i=this.generation;queueMicrotask(()=>{if(i!==this.generation||this.graphs.get(e.id)!==e){n?.destroy();return}this.inspector.recordGPUTimings(e.id,t).then(n=>{i!==this.generation||this.graphs.get(e.id)!==e||(this.inspectorPanel.update(this.inspector.getSnapshot(),this.latestGraphId),this.latestEncoding===t&&this.tracePanel.update(n??t.stats,e.id))}).catch(()=>{i===this.generation&&this.latestEncoding===t&&this.tracePanel.update(t.stats,e.id)}).finally(()=>n?.destroy())})}clear(){this.generation++,this.latestEncoding=null,this.latestGraphId=void 0,this.graphs.clear(),this.sampleCounts.clear(),this.inspector.clear(),this.inspectorPanel.update(this.inspector.getSnapshot()),this.tracePanel.update(void 0)}};function ip(e){let t=document.querySelector(`#info`);rf(t,`cinematic`);let n=document.querySelector(`#lab-controls`),r=document.querySelector(`#lab-details`),i=(e,t)=>(bf(t,`cinematic`),e.hidden=!1,t.append(e),()=>{e.hidden=!0,document.body.append(e)}),a=new Yl({parentElement:t});return a.setProps({components:[new jd({id:`space-salvage`,title:`luma.gl · Space Salvage`,placement:`top-left`,widthPx:360,collapsible:!0,defaultOpen:!1,panel:new Bd({id:`lab-panel`,panels:[ff({id:`lab-controls-panel`,title:``,html:``,onRender:e=>i(n,e)}),mf({id:`lab-tabs`,theme:`dark`,panels:[ff({id:`lab-details-panel`,title:`Info`,html:``,onRender:e=>i(r,e)}),e.inspectorPanel.panel,e.tracePanel.panel]})]})})]}),{update(){a.onRedraw({viewports:[],layers:[]})},destroy(){a.finalize(),e.clear(),t.remove(),n.remove(),r.remove()}}}var ap=[-14,7,0],op=[1,2,3,4,5];function sp(){let e=[{position:[-11,2,0],mass:2,shape:{type:`sphere`,radius:.65},inertiaDiagonal:[0,0,0],restitution:.25,friction:.2}];for(let t of[[-7,6,0],[3,7,0],[12,-5,0],[-6,-7,0],[13,7,0]])e.push({position:t,mass:1.5,shape:{type:`box`,halfExtents:[.6,.6,.6]},inertiaDiagonal:[0,0,.36],restitution:.35,friction:.2});for(let t=0;t<9;t++){let n=t*2.39996;e.push({position:[Math.cos(n)*(6+t*.7),Math.sin(n)*(3+t*.5),0],velocity:[Math.sin(n)*.25,Math.cos(n)*.25,0],angularVelocity:[0,0,.1*(t%2?1:-1)],mass:4,shape:t%2?{type:`box`,halfExtents:[.7+t*.04,.9,.65]}:{type:`sphere`,radius:.9+t*.04},inertiaDiagonal:[0,0,3],restitution:.45,friction:.2})}for(let[t,n]of[[[-20.5,0,0],[.5,13,1]],[[20.5,0,0],[.5,13,1]],[[0,-12.5,0],[20,.5,1]],[[0,12.5,0],[20,.5,1]]])e.push({position:t,mass:0,shape:{type:`box`,halfExtents:n},restitution:.3});return e}var cp=0,lp=class{constructor(e){this.userData={},this.id=e.id||`geometry-${++cp}`,this.topology=e.topology,this.attributes={};let t=e.indices?up(e.indices):void 0;for(let[n,r]of Object.entries(e.attributes||{})){let e=up(r);if((n===`POSITION`||n===`positions`)&&(e.size||=3),n===`indices`){if(t)throw Error(`Geometry has multiple index attributes`);t=e}else this.attributes[n]=e}if(t){if(!(t.value instanceof Uint16Array||t.value instanceof Uint32Array))throw Error(`Geometry indices must be a Uint16Array or Uint32Array`);t.size=1,this.indices=t,fp(t,this.attributes)}if(this.vertexCount=e.vertexCount??pp(this.attributes,this.indices),!Number.isInteger(this.vertexCount)||this.vertexCount<0)throw Error(`Geometry vertexCount must be a non-negative integer`)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}};function up(e){let t=dp(e)?{value:e}:{...e};if(!dp(t.value))throw Error(`Geometry attributes must contain a typed-array value`);if(t.size!==void 0&&(!Number.isInteger(t.size)||t.size<1))throw Error(`Geometry attribute size must be a positive integer`);if(t.size&&t.value.length%t.size!==0)throw Error(`Geometry attribute length must be divisible by its size`);return t}function dp(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function fp(e,t){let n=-1;for(let t of e.value)n=Math.max(n,Number(t));for(let[e,r]of Object.entries(t))if(!r.constant&&r.size){let t=r.value.length/r.size;if(n>=t)throw Error(`Geometry index ${n} exceeds ${e} vertex count ${t}`)}}function pp(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e))!t.constant&&t.size&&(n=Math.min(n,t.value.length/t.size));if(!Number.isFinite(n))throw Error(`Geometry has no countable attributes`);return n}var mp=class extends lp{bufferLayout;constructor(e){let t={},n=new Map;for(let[r,i]of Object.entries(e.attributes)){let e=hp(r),a=n.get(e);a&&delete t[a],n.set(e,r),t[r]=i}let r=e.indices,i=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;super({...e,attributes:t,indices:i});for(let[e,n]of Object.entries(t))!ArrayBuffer.isView(n)&&Object.isExtensible(n)&&e!==`indices`&&(Object.assign(n,this.attributes[e]),this.attributes[e]=n);this.bufferLayout=e.bufferLayout||gp(this.attributes)}};function hp(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function gp(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:i,normalized:a}=r;if(i===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:hp(n),format:C.getVertexFormatFromAttribute(e,i,a)})}return t}function _p(e,t={}){let n=t.bufferName||`geometry`;if(vp(e,n))return e;let r=t.minAttributeAlignment||4,i=yp(e,t.attributes),a=[],o=0,s=1/0;for(let[e,t]of i){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:i,normalized:c}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(i===void 0)throw Error(`Attribute ${e} is missing a size`);let l=C.getVertexFormatFromAttribute(n,i,c),u=C.getVertexFormatInfo(l);o=xp(o,r),a.push({sourceName:e,attributeName:hp(e),value:n,size:i,format:l,byteOffset:o,byteLength:u.byteLength}),o+=u.byteLength;let d=n.length/i;if(!Number.isInteger(d))throw Error(`Attribute ${e} length is not divisible by size`);s=Math.min(s,d)}if(a.length===0||!Number.isFinite(s))throw Error(`Geometry ${e.id} has no interleavable attributes`);let c=xp(o,r),l=new ArrayBuffer(s*c);for(let e of a)bp(l,s,c,e);return new mp({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(l),size:c,byteStride:c}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:c,attributes:a.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function vp(e,t){if(e.bufferLayout?.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function yp(e,t){let n=new Map,r=t||Object.keys(e.attributes);for(let t of r){let r=e.attributes[t];r&&n.set(hp(t),[t,r])}return Array.from(n.values())}function bp(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function xp(e,t){return Math.ceil(e/t)*t}function Sp(e=[],t){let n={modules:[],injectionTargets:[],defines:{},injections:{},vertexInputs:{},interStageVariables:{}};for(let r of e)wp(n,r,t);let{vertexInputs:r,interStageVariables:i}=n;for(let e of Object.keys(i))if(r[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return n}function Cp(e=[],t=[],n={}){let r=[...e],i=new Map;for(let e of r){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||i.set(e.name,e)}for(let e of t){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||(r.push(e),i.set(e.name,e))}return r}function wp(e,t,n){t.module&&e.modules.push(t.module),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){Tp(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.interStageVariables||{})){Tp(n,`varying`);let t=Ep(n,r),i=e.interStageVariables[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.interStageVariables[n]=t}for(let r of t.injectionTargets||[]){let t=r[n];if(!t)continue;let i=`${r.stage===`vertex`?`vs`:`fs`}:${r.name}`;if(!/^(vs|fs):[A-Za-z_][A-Za-z0-9_]*$/.test(i))throw Error(`Invalid ShaderPlugin injection target ${i}`);let a=e.injectionTargets.find(e=>e.stage===r.stage&&e.name===r.name),o=a?.[n];if(o&&(o.parameters!==t.parameters||(o.returnType||`void`)!==(t.returnType||`void`)||o.header!==t.header||o.footer!==t.footer))throw Error(`Conflicting ShaderPlugin injection target ${i}`);a||e.injectionTargets.push({name:r.name,stage:r.stage,[n]:t})}let r=Xt(Array.isArray(t.injections)?t.injections:Object.entries(t.injections||{}).flatMap(([e,t])=>{let r=Dp(e,n);if(r===void 0)return[];let[i,...a]=r.split(`:`);if(i!==`vs`&&i!==`fs`)throw Error(`Invalid ShaderPlugin injection ${e}`);return[{stage:i===`vs`?`vertex`:`fragment`,target:a.join(`:`),[n]:t}]}),n,t.name);for(let[t,n]of Object.entries(r))e.injections[t]||=[],e.injections[t].push(...n)}function Tp(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function Ep(e,t){let{primitiveType:n}=a.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function Dp(e,t){let n=/^(glsl|wgsl):([\s\S]+)$/.exec(e);return n?n[1]===t?n[2]:void 0:e}function Op(e,t){return{name:kp(e,t),language:`glsl`,version:Ap(e)}}function kp(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Ap(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function jp(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function Mp(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=Ip(e,Pp),e;case`fragment`:return e=Ip(e,Fp),e;default:throw Error(t)}}var Np=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],Pp=[...Np,[Lp(`attribute`),`in $1`],[Lp(`varying`),`out $1`]],Fp=[...Np,[Lp(`varying`),`in $1`]];function Ip(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function Lp(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var Rp=`precision highp float;
`;function zp(e){let{vs:t,fs:n}=e,r=Nt(e.modules||[]);return{vs:Bp(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:Bp(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:bn(r)}}function Bp(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},injectionTargets:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginInterStageVariables:d={},prologue:f=!0,log:p}=t;wt(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?Op(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${jp(e)}
${r===`fragment`?Rp:``}

// ----- APPLICATION DEFINES -------------------------

${Vp(v)}

`:`${g}
`;break}let b=yr(s,t.pluginInjectionTargets,`glsl`),x={},S={},C={};xn(l,x,S,C),xn(Array.isArray(c)?Xt(c,`glsl`):{},x,S,C);let w=Array.isArray(c)?{}:c;for(let e in w){let t=typeof w[e]==`string`?{injection:w[e],order:0}:w[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[...S[e]||[],t]:C[e]=[...C[e]||[],t]:x[e]=[...x[e]||[],t]}else C[e]=[...C[e]||[],t]}if(r===`vertex`){let e=Nn(_,u);e&&(y+=`${e}\n`)}let T=Jn(_,r,d);T.declarations&&(y+=`${T.declarations}\n`),T.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:T.initialization,order:-(2**53-1)}));for(let e of a){p&&jt(e,_,p);let t=Sn(e,r,p);y+=t}return xr(b,x,r),y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=yn,y=Zt(y,r,S),y+=vr(b[r],x),y+=_,y=Zt(y,r,C),i===`glsl`&&m!==h&&(y=Mp(y,r)),i===`glsl`&&ln(y,r,p),y.trim()}function Vp(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var Hp=class extends Pt{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...zp({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}},Up=class{buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),n=this.device.createBuffer({id:`batch-uniforms`,byteLength:t,usage:o.UNIFORM|o.COPY_DST});this.buffer?.destroy(),this.buffer=n}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){f(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}};function Wp(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var Gp=`__debugFramebufferState`,Kp=8;function qp(e,t,n){if(e.device.type!==`webgl`)return;let r=Xp(e.device);if(!r.flushing){if(Qp(e)){Jp(e,n,r);return}t&&Zp(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function Jp(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=$p(t.top,Kp),l=$p(t.left,Kp);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=Yp({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+Kp}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function Yp(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function Xp(e){return e.userData[Gp]||={flushing:!1,queuedFramebuffers:[]},e.userData[Gp]}function Zp(e){return`colorAttachments`in e}function Qp(e){let t=e.props.framebuffer;return!t||t.handle===null}function $p(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function em(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!em(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=e,i=t,a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(let e of a)if(!t.hasOwnProperty(e)||!em(r[e],i[e],n-1))return!1;return!0}return!1}var tm=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return y(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function nm(e,t){let n=E(e),r=t.slice();return r.sort((e,t)=>k(y(e).map(e=>n[e]))-k(y(t).map(e=>n[e]))),r}function rm(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of cm(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function im(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?dm(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:um(e.bindings,t.bindings)}:e:t}function am(e){return!!(e.uniformTypes&&!lm(e.uniformTypes))}function om(e){let t=[];for(let n of e){let e=rn(n),r=new Set([n.vs,n.fs].flatMap(e=>e?cn(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),i=r.has(e)?e:r.size===1?r.values().next().value:void 0;am(n)&&i&&t.push({name:i,uniformTypes:n.uniformTypes})}return t}function sm(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function cm(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function lm(e){for(let t in e)return!1;return!0}function um(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function dm(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}function fm(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var pm={};function mm(e=`id`){return pm[e]=pm[e]||1,`${e}-${pm[e]++}`}function hm(e,t,n){for(let[r,i]of Object.entries(t)){if(!i)continue;if(!i.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=n.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let a=t.attributes??[];if(a.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let o=a[0],s=t.format??o?.format,c=_m(e,r,i.format),l=t.byteStride??c.byteLength;if(s!==i.format||l!==i.byteStride||i.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function gm(e,t){let n=Object.entries(t).filter(e=>e[1]!==void 0);if(n.length===0)return[];let[r,i]=n[0];for(let[t,a]of n){if(!a.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(_m(e,t,a.format),a.length!==i.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(a.data.length!==i.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let a=0;return i.data.map((t,r)=>{let i={};for(let[a,o]of n){let n=o.data[r];if(!n||n.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(n.format!==o.format||n.byteStride!==o.byteStride||n.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${a}" chunk layout must be stable`);i[a]=n}let o={batchIndex:r,rowIndexOffset:a,rowCount:t.length,data:i};return a+=t.length,o})}function _m(e,t,n){if(n.includes(`<`))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return C.getVertexFormatInfo(n)}function vm(e){let t;for(let n of Object.values(e)){if(!n||`isConstant`in n)continue;let e=0;for(let t of n.data)e+=t.length;if(f(e===n.length),t){f(n.length===t.length&&n.data.length===t.data.length);for(let e=0;e<n.data.length;e++)f(n.data[e].length===t.data[e].length)}else t=n}}function ym(e,t,n,r,i,a){let o=t.inputs,s=n.inputs,c=t.sourceLayouts,l=n.sourceLayouts,u=t.layouts,d=n.layouts,f=n.stepMode,p=t.batchCount,m=n.batchCount,h=Array.from({length:p},(e,n)=>t.getBatch(n)),g=Array.from({length:m},(e,t)=>n.getBatch(t)),_=bm(h),v=bm(g),y=e.vertexCount,b=e.instanceCount,x=!0;try{let o=e.isInstanced&&n.vertexCount===void 0,s=o?p*m:Math.max(p,m);if(p===0||m===0)return!0;for(let c=0;c<s;c++){let s=o?Math.floor(c/m):Math.min(c,p-1),l=o?c%m:Math.min(c,m-1);t.setInputs(h[s],u,`vertex`),n.setInputs(g[l],d,f),r();let S=t.rowCount===void 0?n.vertexCount===void 0?0:v[l]:_[s];a===`vertex`&&e.setVertexCount(Math.max(0,Math.min(t.rowCount??n.vertexCount??y,y-S))),a===`instance`&&n.instanceCount!==void 0&&e.setInstanceCount(Math.max(0,Math.min(n.instanceCount,b-v[l]))),!(!e.indexBuffer&&e.vertexCount===0||e.isInstanced&&e.instanceCount===0)&&(x=i()&&x)}}finally{t.setInputs(o,c,`vertex`),n.setInputs(s,l,f),r(),e.setVertexCount(y),e.setInstanceCount(b)}return x}function bm(e){let t=0;return e.map(e=>{let n=t;for(let n of Object.values(e))if(n&&`data`in n){t+=n.length;break}return n})}var xm=class{inputs={};sourceLayouts;stepMode=`vertex`;claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,n,r=!0){if(r)vm(e);else for(let t of Object.values(e))t&&!X(t)&&f(t.data.length===1);this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=n,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let i=t??Object.entries(e).flatMap(([e,t])=>t&&!X(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),a=Object.entries(e).flatMap(([e,t])=>{if(!t||i.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];f(t.format);let r=t.format;return[{name:e,stepMode:n,byteStride:X(t)?0:t.byteStride,attributes:[{attribute:e,format:r,byteOffset:0}]}]}),s=[...i,...Cm(e,a)];for(let[t,i]of Object.entries(e))if(i){if(!X(i)&&!Array.isArray(i.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);!X(i)&&r&&((s.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t))?.stepMode??n)===`instance`?(f(this.instanceCount===void 0||this.instanceCount===i.length),this.instanceCount=i.length):(f(this.vertexCount===void 0||this.vertexCount===i.length),this.vertexCount=i.length),this.rowCount=n===`instance`?this.instanceCount:this.vertexCount),this.claimedNames.add(t)}this.layouts=s.flatMap(t=>{let r=e[t.name],i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),a=i.filter(t=>X(e[t.attribute])),o={...t,stepMode:t.stepMode??n};return this.device.type!==`webgpu`||r&&!X(r)&&r.bufferLayout||!a.length||a.length===i.length?[{...o,byteStride:a.length===i.length&&a.length?0:o.byteStride}]:[{...o,attributes:i.filter(t=>!X(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:a}]}),this.buffers={},this.byteOffsets={},this.constants={};let c=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let n=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of n)this.claimedNames.add(e.attribute);let r=e[t.name];if(r&&!X(r)){let e=r.bufferLayout||!r.format?0:(n.find(e=>e.attribute===t.name)??n[0])?.byteOffset??0;this.bindVector(t.name,r,e)}let i=0;for(let r of n){let n=e[r.attribute]??(r.attribute===t.name?e[t.name]:void 0);n&&(f(n.format===void 0||n.format===r.format),X(n)?(this.constants[r.attribute]=Sm(n),i=Math.max(i,(r.byteOffset??0)+n.byteLength)):this.buffers[t.name]||this.bindVector(t.name,n,r.byteOffset??0))}if(this.device.type===`webgpu`&&i&&!this.buffers[t.name]){let r=new Uint8Array(Math.ceil(i/4)*4);for(let t of n){let n=e[t.attribute];X(n)&&r.set(new Uint8Array(n.value.buffer,n.value.byteOffset,n.byteLength),t.byteOffset??0)}let a=this.constantBuffers[t.name];(!a||a.byteLength<r.byteLength)&&(a?.destroy(),a=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:r.byteLength,usage:o.VERTEX|o.COPY_DST|o.COPY_SRC}),this.constantBuffers[t.name]=a),a.write(r),this.buffers[t.name]=a,c.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))c.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!X(e));return e&&!X(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,n])=>{if(!n||X(n))return[t,n];let r=n.data[e];return[t,{...n,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,n){let r=t.data[0];if(!r)return;let i=r.byteOffset-n;f(i>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=i}};function X(e){return!!(e&&`isConstant`in e&&e.isConstant)}function Sm(e){let t=C.getVertexFormatInfo(e.format);if(e.format===`unorm10-10-10-2`){let t=e.value[0];return new Float32Array([(t&1023)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let n=Array.from(e.value);if(e.format===`unorm8x4-bgra`&&([n[0],n[2]]=[n[2],n[0]]),t.normalized){let r=e.value.BYTES_PER_ELEMENT*8,i=2**r-1;return new Float32Array(n.map(e=>t.signed?(e+2**(r-1))/i*2-1:e/i))}return t.integer?t.signed?new Int32Array(n):new Uint32Array(n):new Float32Array(n)}function Cm(e,t){let n=[],r,i=0,a=[...t].sort((t,n)=>{let r=e[t.name],i=e[n.name];return(r&&!X(r)?r.data[0]?.byteOffset??0:0)-(i&&!X(i)?i.data[0]?.byteOffset??0:0)});for(let t of a){let a=e[t.name],o=t.attributes[0];if(X(a)){r||(r={...t,attributes:[]},n.push(r));let e=Math.min(4,a.byteLength);i=Math.ceil(i/e)*e,r.attributes.push({...o,byteOffset:i}),i+=a.byteLength;continue}let s=n.find(n=>{let r=e[n.name];if(!r||X(r)||!r.data.length||!a.data.length)return!1;let i=a.data[0].byteOffset-r.data[0].byteOffset;return n.stepMode===t.stepMode&&n.byteStride===t.byteStride&&i>=0&&i+a.rowByteLength<=a.byteStride&&a.data.every((e,t)=>{let n=r.data[t];return e.buffer===n.buffer&&e.byteStride===n.byteStride&&e.byteOffset-n.byteOffset===i})});if(s){let t=e[s.name];s.attributes.push({...o,byteOffset:a.data[0].byteOffset-t.data[0].byteOffset})}else n.push({...t,attributes:[...t.attributes]})}return n}function wm(e){return(Array.isArray(e)?e.length===0||typeof e[0]==`number`:ArrayBuffer.isView(e)&&!(e instanceof DataView))||typeof e==`number`||typeof e==`boolean`}function Tm(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||wm(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var Em=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=Nt(Object.values(e).filter(Mm));for(let t of n)e[t.name]=t;i.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&i.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},a=this.modules[n];if(!a)this.options.disableWarnings||i.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:i,bindings:o}=Tm(a.getUniforms?.(r,e)||r,a.uniformTypes);this.moduleUniforms[n]=Dm(e,i,a.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=Nt(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=Dm({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function Dm(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=Om(e[i],a,n[i]));return r}function Om(e,t,n){if(!n||typeof n==`string`)return km(t);if(Array.isArray(n)){if(Am(t)||!Array.isArray(t))return km(t);let r=Array.isArray(e)&&!Am(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=Om(r[e],a,n[0]))}return i}if(!jm(t))return km(t);let r=n,i=jm(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=Om(i[e],n,r[e]));return a}function km(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?Am(e)?e.slice():e.map(e=>e===void 0?void 0:km(e)):jm(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:km(t)])):e}function Am(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function jm(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Mm(e){return!!e?.dependencies}var Z=2,Nm=1e4,Pm=`render pipeline initialization failed`,Fm=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],Im=class e{static async createAsync(e,t){let n=!P.getAsyncCompilation(e),r=n?P.beginAsyncCompilation(e):P.getAsyncCompilation(e),i;try{i=new this(e,t)}finally{n&&P.endAsyncCompilation(e,r)}try{return n?await Promise.all(r):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...M.defaultProps,inferDrawCount:`no`,enforceMatchingVectorLengths:!0,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){this.constructorDrawOffsets={firstVertex:n.firstVertex,firstIndex:n.firstIndex};let r=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:n.vertexCount??(r.vertexCount||void 0),instanceCount:n.instanceCount??(r.instanceCount||void 0)};let i=r.shaderAssembler,a=Object.hasOwn(n,`vertexCount`);this.props={...r,...n,shaderAssembler:n.shaderAssembler??(i&&Lm(i,t.info.shadingLanguage)?i:t.info.shadingLanguage===`wgsl`?new Kr:new Hp)},this._vertexCountSet=a,n=this.props,this.id=n.id||mm(`model`),this.device=t,Object.assign(this.userData,n.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=n.isInstanced??(n.instanceCount?!0:void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new xm(t,`${this.id}-geometry`),this.attributeVectorBindings=new xm(t,`${this.id}-attributes`);try{this._initializeProps(n);let e=fm(t),r=Sp(this.props.plugins,e.shaderLanguage),i=Cp(this.props.modules,r.modules),a=Object.fromEntries(i.map(e=>[e.name,e])),o=n.shaderInputs||new Em(a,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&r.modules.length>0&&o.addModules(r.modules),this.setShaderInputs(o);let s=sm(this.props.modules,o.getModules()),c={...r.defines,...this.props.defines};if(this.device.type===`webgl`&&(this.props._uniformBlockLayouts=om(s)),this.props.shaderLayout=rm(this.props.shaderLayout,s)||null,this.device.type===`webgpu`&&this.props.source){let n=this.props.shaderAssembler;f(Lm(n,`wgsl`));let{source:i,getUniforms:a,bindingTable:o,entryPoints:l={},shaderLayout:u}=n.assembleWGSLShader({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.source=i,this.props.vertexEntryPoint=l.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=l.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=a,this._bindingTable=o;let d=Rm(u??t.getShaderLayout?.(this.source),r.vertexInputs),p=im(this.props.shaderLayout,d,Object.keys(r.vertexInputs));this.props.shaderLayout=rm(p||null,s)||null}else{let t=this.props.shaderAssembler;f(Lm(t,`glsl`));let{vs:n,fs:i,getUniforms:a}=t.assembleGLSLShaderPair({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.vs=n,this.fs=i,this._getModuleUniforms=a,this._bindingTable=[]}this.pipelineFactory=n.pipelineFactory||P.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||Ge.getDefaultShaderFactory(this.device);let l=P.getAsyncCompilation(this.device);l?(this._pipelineInitialization=this._initializePipelineAsync(n),l.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(n))}catch(t){try{e.prototype.destroy.call(this)}finally{throw t}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),e.indexCount!==void 0&&this.setIndexCount(e.indexCount),this.constructorDrawOffsets.firstVertex!==void 0&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),this.constructorDrawOffsets.firstIndex!==void 0&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),e.isInstanced!==void 0&&(this.isInstanced=e.isInstanced),this.constructorDrawCounts.instanceCount!==void 0&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),this.constructorDrawCounts.vertexCount!==void 0&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||=(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e,t){return t?.parameters?e.withParameters(t.parameters,()=>this._draw(e)):this._draw(e)}_draw(e){if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(this.geometryVectorBindings.batchCount!==1||this.attributeVectorBindings.batchCount!==1))return this.drawVectorGroups(e);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return i.info(Z,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return i.info(Z,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)i.info(Z,`>>> DRAWING ABORTED ${this.id}: ${Pm}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)i.info(Z,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??(this._vertexCountSet?this.vertexCount:a.byteLength/(a.indexType===`uint32`?4:2)):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0?!0:e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=Pm,this._drawBlockedReason=Pm):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),this.validateVectorLengthPolicy(),this.props.enforceMatchingVectorLengths&&vm(e),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||this.attributeVectorBindings.vertexCount!==void 0)&&vm([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let n=this.geometryVectorBindings.rowCount;f(n===void 0||this.attributeVectorBindings.vertexCount===void 0||n===this.attributeVectorBindings.vertexCount),this.props.inferDrawCount===`vertex`&&this.setVertexCount(n??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),this.isInstanced===void 0&&(t?.some(e=>e.stepMode===`instance`)||Object.values(e).some(e=>e&&`data`in e&&e.bufferLayout?.stepMode===`instance`))&&(this.isInstanced=!0);let n=!this.isInstanced||Object.entries(e).some(([e,n])=>n&&`data`in n&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??n.bufferLayout?.stepMode)===`vertex`);this.validateVectorLengthPolicy(),n&&this.props.enforceMatchingVectorLengths&&vm([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),this.props.inferDrawCount===`instance`&&this.attributeVectorBindings.instanceCount!==void 0&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let r=this.attributeVectorBindings.vertexCount;if(r!==void 0&&this.props.inferDrawCount===`vertex`){let e=this.geometryVectorBindings.rowCount;f(e===void 0||e===r),e===void 0&&this.setVertexCount(r)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&(f(e.format===`uint8`||e.format===`uint16`||e.format===`uint32`),f(e.data.length<=1),f(e.byteStride===(e.format===`uint32`?4:e.format===`uint16`?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];t&&this.indexVector&&f((t.buffer instanceof F?t.buffer.buffer:t.buffer).indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride===0),this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let n=new Set(Object.keys(e)),r=t.filter(e=>n.has(e.name)||e.attributes?.some(e=>n.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),this.device.type===`webgl`&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let n=gm(this.id,e);f(n.length<=1),hm(this.id,e,this.bufferLayout),n[0]&&this.setGPUData(n[0].data),this.setBatchDrawCount(n[0]?.rowCount??0,t?.count)}drawVectorGroups(t){let n=this.drawingVectorBatches,r=this._vertexCountSet;this.drawingVectorBatches=!0;try{let n=ym(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>e.prototype.draw.call(this,t),this.props.inferDrawCount);return n&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),n}finally{this._vertexCountSet=r,this.drawingVectorBatches=n}}drawBatches(t,{vectors:n,onBatch:r}){let i=gm(this.id,n);hm(this.id,n,this.bufferLayout);for(let e of Object.keys(n))f(!n[e]||this.currentAttributes[e]);let a={...this.currentAttributes},o={...this.currentAttributeByteOffsets},s={...this.bindings},c=this.instanceCount,l=this.vertexCount,u=this.isInstanced,d=this._vertexCountSet,p=this.drawingVectorBatches,m=this.device.type===`webgpu`&&i.length?new it(this.device,this.shaderInputs.modules):void 0;if(m&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new Up(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(m.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*i.length)}this.drawingVectorBatches=!0;let h=!0;try{for(let n of i){this.setGPUData(n.data),this.setBatchDrawCount(n.rowCount),r?.(n);let i={};try{if(m){m.setUniforms(this.shaderInputs.getUniformValues());for(let[e,t]of this._uniformStore.uniformBuffers){let n=`${e}Uniforms`;this.bindings[n]===t&&(i[n]=t,this.setBindings({[n]:this.batchUniformBuffer.write(m.getUniformBufferData(e))}))}}h=e.prototype.draw.call(this,t)&&h}finally{this.setBindings(i)}}}finally{m?.destroy(),this.setAttributes(a,{byteOffsets:o});for(let e of Object.keys(this.bindings))e in s||delete this.bindings[e];this.setBindings(s),this.setInstanceCount(c),this.setVertexCount(l),this.isInstanced=u,this._vertexCountSet=d,this.drawingVectorBatches=p}return h}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let n=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(n?.attributes?.[0]?.byteOffset??0);return f(r>=0),[e,r]}))})}validateVectorLengthPolicy(){f(this.props.enforceMatchingVectorLengths!==!1||this.props.inferDrawCount===`no`)}setBatchDrawCount(e,t=this.props.inferDrawCount===`no`?`none`:this.props.inferDrawCount){t===`instance`?this.setInstanceCount(e):t===`vertex`&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,n=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,i=this.getExplicitVectorLayouts(n.inputs)??n.sourceLayouts;t.setInputs(t.inputs,r,`vertex`,this.props.enforceMatchingVectorLengths),n.setInputs(n.inputs,i,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||n.vertexCount!==void 0)&&vm([...Object.values(t.inputs),...Object.values(n.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(n),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(e=nm(this.pipeline.shaderLayout,e),em(e,this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){em(e,this.parameters,2)||(this.parameters=e,this.device.type===`webgl`?this.setNeedsRedraw(`parameters`):this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new it(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(am(t)&&this._usesManagedUniformBuffer(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw(`shaderInputs`)}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof F?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof F?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){Object.assign(this.currentAttributes,e);for(let n of Object.keys(e))this.currentAttributeByteOffsets[n]=t?.byteOffsets?.[n]??0;this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&i.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=nm(this.pipeline.shaderLayout,this.bufferLayout);let r=new tm(this.bufferLayout);for(let[a,o]of Object.entries(e)){let e=o instanceof F?o.buffer:o,s=r.getBufferLayout(a);if(!s){n||i.warn(`Model(${this.id}): Missing layout for buffer "${a}".`)();continue}let c=r.getAttributeNamesForBuffer(s),l=!1;for(let r of c){let s=this._attributeInfos[r];if(s){let r=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(s.bufferName):s.location;if(r===null){n||i.warn(`Model(${this.id}): Missing vertex array slot for buffer "${s.bufferName}".`)();continue}let c=t?.byteOffsets?.[a]??0;this.vertexArray.setBuffer(r,e,c),o instanceof F?this._dynamicAttributeBufferSources[r]={source:o,generation:o.generation,byteOffset:c}:delete this._dynamicAttributeBufferSources[r],l=!0}}!l&&!n&&i.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${a}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||i.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(Mi(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=zm(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?h(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let n of Object.values(this.bindings))n instanceof d?e=Math.max(e,n.texture.updateTimestamp):n instanceof o||n instanceof t||n instanceof ie||n instanceof F?e=Math.max(e,n.updateTimestamp):Mi(n)?e=n.isReady?Math.max(e,n.updateTimestamp):1/0:oi(n)&&(e=Math.max(e,(n.buffer instanceof F,n.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?.vs??null,t=this.pipeline?.fs??null;this.pipeline&&i.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let n=null,r=null;try{n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(n,r),this._pipelineNeedsUpdate=`shader creation failed`,e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r},vertexShader:n,fragmentShader:r,previousVertexShader:e,previousFragmentShader:t}}_finishPipelineUpdate(e){this._attributeInfos=ot(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=i.level>3?0:Nm;i.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,i.group(Z,`>>> DRAWING MODEL ${this.id}`,{collapsed:i.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=Wp(this.pipeline.shaderLayout,this.id);i.table(Z,e)();let t=this.shaderInputs.getDebugTable();i.table(Z,t)();let n=this._getAttributeDebugTable();i.table(Z,this._attributeInfos)(),i.table(Z,n)(),i.groupEnd(Z)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;qp(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let n=s.getTypedArrayConstructor(t);return(e instanceof o?new n(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>Bm(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??Vm(t?.depthStencilAttachment?.texture?.format);(!em(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function Lm(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function Rm(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function zm(e,t,n){if(Mi(t)){let r=Pi(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof F?t.buffer:oi(t)?ci(t):t}function Bm(e){return e&&!Hm(e)?e:null}function Vm(e){return e&&Hm(e)?e:void 0}function Hm(e){return Fm.includes(e)}var Um=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||mm(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&o.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function Wm(e,t){if(t instanceof Um)return t;let n=_p(t),r=Gm(e,n),{attributes:i,bufferLayout:a}=Km(e,n);return new Um({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function Gm(e,t){if(!t.indices)return;let n=t.indices.value;return e.createBuffer({usage:o.INDEX,data:n})}function Km(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout?.find(e=>e.name===r)?.name||hp(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout||gp(t.attributes),vertexCount:t.vertexCount}}var qm=class{attributes;indices;topology;vertexCount;bufferLayout;destroy(){}constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??`triangle-list`,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}};function Jm(e){let t={};for(let[n,r]of Object.entries(e.attributes)){let i=e.bufferLayout.find(e=>e.name===n),a=i?.format,o=i?.byteStride??(a?C.getVertexFormatInfo(a).byteLength:0),s=e.indices&&o?Math.floor(r.byteLength/o):e.vertexCount;t[n]={name:n,format:a,length:s,byteStride:o,rowByteLength:o,bufferLayout:i,data:[{buffer:r,byteOffset:0,length:s,format:a,byteStride:o,rowByteLength:o}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[n,r]of Object.entries(t))t[n]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let n=e.indices,r=n?.indexType===`uint32`?4:n?.indexType===`uint8`?1:2,i=n?n.byteLength/r:0;return new qm({attributes:t,indices:n?{name:`indices`,format:n.indexType,length:i,byteStride:r,rowByteLength:r,data:[{buffer:n,byteOffset:0,length:i,format:n.indexType,byteStride:r,rowByteLength:r}]}:null,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}var Ym=class extends Im{static defaultProps={...Im.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let n=t.geometry===void 0?new.target.defaultProps.geometry:t.geometry,r=n&&!(n instanceof qm)?Wm(e,n):null,i=r?Jm(r):n,a={...t,geometry:i instanceof qm?i:null};try{super(e,a)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=n,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=e&&!(e instanceof qm)?Wm(this.device,e):null;let t=this._gpuGeometry?Jm(this._gpuGeometry):e;super.setGeometry(t instanceof qm?t:null),e instanceof qm||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if(Mi(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}};function Xm(e,t,n){let r=e.createBuffer({byteLength:112,usage:o.UNIFORM|o.COPY_DST}),i=e.createBuffer({data:new Float32Array(n.flatMap((e,t)=>{let n=e.shape,r=n.type===`sphere`?[n.radius,0,0,0]:n.type===`box`?[...n.halfExtents,1]:[1,1,1,1],i=t===0?[.4,.9,1,2]:t<=5?[1,.63,.2,1]:e.mass===0?[.12,.24,.32,0]:[.35,.43,.53,0];return[...r,...i]})),usage:o.STORAGE}),a=`struct Globals {matrix:mat4x4f, view:vec4f, aim:vec4f, beam:vec4f}
@group(0) @binding(0) var<uniform> globals:Globals;`,s=new Ym(e,{id:`salvage-space`,vertexCount:3,source:a+`
struct Output {@builtin(position) position:vec4f,@location(0) uv:vec2f}
@vertex fn vertexMain(@builtin(vertex_index) index:u32)->Output {let point=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3))[index];var output:Output;output.position=vec4f(point,0.999,1);output.uv=point;return output;}
fn hash(point:vec2f)->f32{return fract(sin(dot(point,vec2f(127.1,311.7)))*43758.5453);}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {
 let world=input.uv*globals.view.xy;let cell=floor(world*3.0);let local=fract(world*3.0)-vec2f(hash(cell),hash(cell+17.0));
 let star=pow(max(0.0,1.0-length(local)*12.0),4.0)*select(0.0,1.0,hash(cell+3.0)>0.65);
 let nebula=0.5+0.5*sin(world.x*0.13+sin(world.y*0.2));
 var color=vec3f(0.014,0.025,0.06)+vec3f(0.012,0.024,0.036)*nebula+vec3f(star)*0.8;
 let dock=length(world-vec2f(-14,7));let ring=1.0-smoothstep(0.03,0.09,abs(dock-2.6));
 color+=vec3f(0.08,0.75,0.55)*(ring*0.65+max(0.0,1.0-dock/2.6)*0.1);
 let ticks=abs(sin(atan2(world.y-7.0,world.x+14.0)*12.0));color+=vec3f(0.1,0.8,0.65)*(1.0-smoothstep(0.03,0.08,abs(dock-3.0)))*step(0.6,ticks);
 if(globals.beam.w>0.0){let start=globals.aim.xy;let delta=globals.beam.xy-start;let fraction=clamp(dot(world-start,delta)/max(dot(delta,delta),0.001),0.0,1.0);let distance=length(world-start-delta*fraction);color+=vec3f(0.1,0.8,0.65)*exp(-distance*35.0)*(0.6+0.2*sin(globals.view.z*40.0));}
 return vec4f(color,1);
}`,bindings:{globals:r},shaderLayout:{attributes:[],bindings:[{name:`globals`,location:0,group:0,type:`uniform`}]},parameters:{depthWriteEnabled:!1,depthCompare:`always`,depthFormat:`depth24plus`}}),c=new Ym(e,{id:`salvage-bodies`,vertexCount:1152,instanceCount:n.length,source:a+`
@group(0) @binding(1) var<storage,read> positions:array<vec4f>;
@group(0) @binding(2) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(3) var<storage,read> shapes:array<vec4f>;
struct Output {@builtin(position) position:vec4f,@location(0) normal:vec3f,@location(1) color:vec3f,@location(2) local:vec3f,@location(3) @interpolate(flat) kind:f32}
fn rotate(rotation:vec4f,point:vec3f)->vec3f{return point+2.0*cross(rotation.xyz,cross(rotation.xyz,point)+rotation.w*point);}
@vertex fn vertexMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) body:u32)->Output{
 let shape=shapes[body*2u];let color=shapes[body*2u+1u];var point=vec3f(0);var normal=vec3f(0,0,1);
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));let corner=corners[vertex%6u];
 if(body==0u){
  let vertices=array<vec3f,12>(vec3f(0,0.9,0),vec3f(-0.6,-0.6,0),vec3f(0,0,0.4),vec3f(0,0.9,0),vec3f(0,0,0.4),vec3f(0.6,-0.6,0),vec3f(-0.6,-0.6,0),vec3f(0.6,-0.6,0),vec3f(0,0,0.4),vec3f(0,0.9,0),vec3f(0.6,-0.6,0),vec3f(-0.6,-0.6,0));
  if(vertex<12u){point=vertices[vertex];let first=(vertex/3u)*3u;normal=normalize(cross(vertices[first+1u]-vertices[first],vertices[first+2u]-vertices[first]));}
  let angle=globals.aim.z;point=vec3f(point.x*cos(angle)-point.y*sin(angle),point.x*sin(angle)+point.y*cos(angle),point.z);normal=vec3f(normal.x*cos(angle)-normal.y*sin(angle),normal.x*sin(angle)+normal.y*cos(angle),normal.z);
 }else if(shape.w==0.0){let tile=vertex/6u;let longitude=(f32(tile%16u)+corner.x)*6.2831853/16.0;let latitude=(f32(tile/16u)+corner.y)*3.14159265/12.0;normal=vec3f(cos(longitude)*sin(latitude),sin(longitude)*sin(latitude),cos(latitude));point=normal*shape.x;}
 else{let face=(vertex/6u)%6u;let axis=face/2u;let direction=select(-1.0,1.0,face%2u==0u);normal=vec3f(0);normal[axis]=direction;point[axis]=direction;point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;point*=shape.xyz;if(vertex>=36u){point=vec3f(0);}}
 var output:Output;output.local=point;output.kind=color.w;output.position=globals.matrix*vec4f(positions[body].xyz+rotate(orientations[body],point),1);output.normal=rotate(orientations[body],normal);output.color=color.xyz;return output;
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {let light=0.3+0.7*max(0.0,dot(normalize(input.normal),normalize(vec3f(-0.5,0.7,1))));let stripe=select(1.0,0.35,input.kind==1.0&&abs(input.local.x)<0.13);return vec4f(input.color*light*stripe,1);}
`,bindings:{globals:r,positions:t.positions,orientations:t.orientations,shapes:i},shaderLayout:{attributes:[],bindings:[{name:`globals`,group:0,location:0,type:`uniform`},...[`positions`,`orientations`,`shapes`].map((e,t)=>({name:e,group:0,location:t+1,type:`read-only-storage`,visibility:1}))]},parameters:{depthWriteEnabled:!0,depthCompare:`less-equal`,depthFormat:`depth24plus`}});return{draw(t,n,i,a,o){let l=Math.max(14,22/n),u=l*n,d=new gc().ortho({left:-u,right:u,bottom:-l,top:l,near:.1,far:100}).multiplyRight(new gc().lookAt({eye:[0,0,40],center:[0,0,0],up:[0,1,0]})),f=new gc([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(d);r.write(new Float32Array([...f,u,l,t,0,i[0],i[1],Math.atan2(a[1]-i[1],a[0]-i[0])-Math.PI/2,0,...o?[o[0],o[1],0,1]:[0,0,0,0]]));let p=e.beginRenderPass({clearColor:[.01,.02,.05,1],clearDepth:1});return s.draw(p),c.draw(p),p.end(),e.submit(),{extentX:u,extentY:l}},destroy(){s.destroy(),c.destroy(),i.destroy(),r.destroy()}}}function Zm(){let e=document.createElement(`div`);Object.assign(e.style,{position:`fixed`,inset:`0`,pointerEvents:`none`,zIndex:`2`,overflow:`hidden`}),document.body.append(e);let t=null,n=!1,r=0,i=()=>{n||(t??=new AudioContext,t.resume().catch(()=>{}))},a=()=>{for(let t of e.getAnimations({subtree:!0}))t.cancel();e.replaceChildren()};return{unlock:i,toggleSound(){return n=!n,n||i(),!n},impact(i,a,o){if(i.phase===`end`||i.normalImpulse<1)return;let s=Math.min(1,i.normalImpulse/12),c=(i.point[0]/a+1)*innerWidth/2,l=(1-i.point[1]/o)*innerHeight/2;for(let t=0;t<6&&e.childElementCount<72;t++){let n=document.createElement(`span`),r=t*Math.PI/3+i.sequence;Object.assign(n.style,{position:`absolute`,left:`${c}px`,top:`${l}px`,width:`3px`,height:`3px`,borderRadius:`50%`,background:`#ffc879`,boxShadow:`0 0 7px #ffad48`}),e.append(n);let a=15+s*35;n.animate([{transform:`translate(0,0)`,opacity:1},{transform:`translate(${Math.cos(r)*a}px,${Math.sin(r)*a}px)`,opacity:0}],{duration:350,easing:`ease-out`}).finished.catch(()=>{}).finally(()=>n.remove())}if(!t||t.state!==`running`||n||r>=4)return;r++;let u=t.currentTime,d=t.createOscillator(),f=t.createGain();d.type=`triangle`,d.frequency.setValueAtTime(230,u),d.frequency.exponentialRampToValueAtTime(75,u+.07),f.gain.setValueAtTime(1e-4,u),f.gain.exponentialRampToValueAtTime(.035+s*.09,u+.002),f.gain.exponentialRampToValueAtTime(1e-4,u+.09),d.connect(f).connect(t.destination),d.onended=()=>{r--,d.disconnect(),f.disconnect()},d.start(u),d.stop(u+.1)},clear:a,destroy(){a(),e.remove(),t?.close().catch(()=>{})}}}var Q=document.querySelector(`#world`),Qm=document.querySelector(`#status`),$m=document.querySelector(`#target`),eh=document.querySelector(`#restart-overlay`),$=new Set,th=Zm(),nh=new rp({traceTitle:`GPU Graph Timeline`}),rh=ip(nh),ih=[0,0,0],ah=!1,oh=!1,sh=!1,ch=!0,lh=0,uh=22,dh=14,fh=()=>{$.clear(),ah=!1};window.addEventListener(`blur`,fh),document.addEventListener(`visibilitychange`,()=>{document.hidden&&fh()}),window.addEventListener(`keydown`,e=>{th.unlock(),[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`Space`,`KeyW`,`KeyA`,`KeyS`,`KeyD`].includes(e.code)&&(e.preventDefault(),$.add(e.code)),e.code===`KeyR`&&(oh=!0)}),window.addEventListener(`keyup`,e=>$.delete(e.code)),Q.addEventListener(`pointermove`,e=>{let t=Q.getBoundingClientRect();ih=[((e.clientX-t.left)/t.width*2-1)*uh,(1-(e.clientY-t.top)/t.height*2)*dh,0]}),Q.addEventListener(`pointerdown`,e=>{th.unlock(),Q.focus(),Q.setPointerCapture(e.pointerId);let t=Q.getBoundingClientRect();ih=[((e.clientX-t.left)/t.width*2-1)*uh,(1-(e.clientY-t.top)/t.height*2)*dh,0],ah=!0}),Q.addEventListener(`pointerup`,()=>{ah=!1}),Q.addEventListener(`pointercancel`,()=>{ah=!1});for(let e of document.querySelectorAll(`[data-key]`))e.onpointerdown=t=>{t.preventDefault(),e.setPointerCapture(t.pointerId),$.add(e.dataset.key)},e.onpointerup=e.onpointercancel=()=>$.delete(e.dataset.key);document.querySelector(`#sound`).onclick=e=>{e.currentTarget.textContent=th.toggleSound()?`Sound on`:`Sound off`},document.querySelector(`#reset`).onclick=()=>{oh=!0},document.querySelector(`#play-again`).onclick=()=>{oh=!0},document.querySelector(`#pause`).onclick=e=>{sh=!sh,fh(),e.currentTarget.textContent=sh?`Resume`:`Pause`};try{let e=null,t=await Ee.createDevice({adapters:[xt],optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:Q,autoResize:!0},onError:t=>{e=t}});async function n(){let e=sp(),n=new Nl({bodies:[...e,{position:ap,mode:`static`,colliders:[{shape:{type:`sphere`,radius:2},isTrigger:!0}]}],failurePolicy:`rollback`,continuous:{bodies:[0]},triggers:[{colliders:[e.length],targets:op}],gravity:[0,0,0],timeStep:1/120,iterations:24,solver:`ordered`,joints:Array.from({length:14},(e,t)=>({type:`distance`,first:0,second:t+1,distance:1.5,enabled:!1,spring:{stiffness:12,damping:4}})),broadPhase:`hierarchical-grid`,eventCapacity:1024,impactImpulseThreshold:2,enableQueries:!0,sleepAfter:0}),r=new Aa(t);return n.addToGraph(r),{world:n,graph:await r.compileAsync(),renderer:Xm(t,n,e),states:await n.readState(),towBody:0}}let r=await n(),i=new Set,a=100,o=0,s=0,c=0,l=performance.now(),u=0,d=0,f,p=!1,m=!1,h=!1,g=()=>{r.renderer.destroy(),r.graph.destroy(),r.world.destroy()},_=()=>{h||(h=!0,g(),rh.destroy(),th.destroy(),t.destroy())},v=e=>{p=!0,ah=!1,eh.hidden=!1,document.querySelector(`#result`).textContent=e?`Cargo secured.`:`Ship disabled.`,document.querySelector(`#result-detail`).textContent=e?`All five pods recovered in ${o.toFixed(1)} simulated seconds.`:`Take it slower. Brake before impact and tow cargo gently.`};async function y(h){if(ch){m=!0;try{if(e)throw e;oh&&(th.clear(),g(),nh.clear(),r=await n(),i=new Set,a=100,o=s=c=0,f=void 0,p=!1,sh=!1,eh.hidden=!0,oh=!1,u=0,d=0,fh(),document.querySelector(`#pause`).textContent=`Pause`,l=performance.now());let m=Math.min(.05,Math.max(0,(h-l)/1e3));if(l=h,!sh&&!p&&!document.hidden){u=Math.min(u+m,4/120);let e=Math.floor(u*120),n=e/120,l=r.states[0];if(e){let a=Number($.has(`KeyD`)||$.has(`ArrowRight`))-Number($.has(`KeyA`)||$.has(`ArrowLeft`)),s=Number($.has(`KeyW`)||$.has(`ArrowUp`))-Number($.has(`KeyS`)||$.has(`ArrowDown`)),c=18*n/Math.max(1,Math.hypot(a,s));(a||s)&&r.world.applyImpulse(0,[a*c,s*c,0]),$.has(`Space`)&&r.world.applyImpulse(0,[-l.velocity[0]*Math.min(1,n*4)*2,-l.velocity[1]*Math.min(1,n*4)*2,0]);let d=i.has(r.towBody)?0:r.towBody,p=f&&f.body>0&&f.body<15&&!i.has(f.body)?f.body:0,m=ah?d||p:0;m!==r.towBody&&(r.towBody&&r.world.setJointEnabled(r.towBody-1,!1),m&&r.world.setJointEnabled(m-1,!0),r.towBody=m);let h=t.createCommandEncoder();for(let t=0;t<e;t++)nh.encode(r.graph,h,{parameters:void 0});t.submit(h.finish()),u-=n,o+=n}if(h-d>100){d=h;let[e,t,n]=await Promise.all([r.world.readState(),r.world.readContactEvents(),r.world.readTriggerEvents()]);if(r.states=e,t.dropped||t.saturated||n.dropped||n.saturated)throw Error(`Collision event capacity exhausted. Restart the mission.`);s+=t.events.length;for(let e of t.events)th.impact(e,uh,dh),e.phase!==`end`&&e.bodies.includes(0)&&e.normalImpulse>3&&(a=Math.max(0,a-(e.normalImpulse-3)*1.2));a<=0&&v(!1);let o=r.states[0].position,l=[ih[0]-o[0],ih[1]-o[1],0];f=Math.hypot(...l)>.001?(await r.world.raycast({origin:o,direction:l,maximumDistance:12,excludeBody:0,colliderIndices:Array.from({length:r.world.colliderCount-1},(e,t)=>t)})).hits[0]:void 0,c++;for(let e of n.events)e.phase!==`enter`||i.has(e.body)||(i.add(e.body),r.towBody===e.body&&(r.world.setJointEnabled(e.body-1,!1),r.towBody=0),f?.body===e.body&&(f=void 0),r.world.positions.write(new Float32Array([100+e.body*4,100,0]),e.body*16),r.world.velocities.write(new Float32Array([0,0,0]),e.body*16),r.world.angularVelocities.write(new Float32Array([0,0,0]),e.body*16),r.world.wake());if(!(await r.world.readSimulationDiagnostics()).complete)throw Error(`Incomplete GPU physics step. Restart the mission.`);i.size===op.length&&!p&&v(!0)}}let _=r.states[0],b=ah&&r.towBody&&!i.has(r.towBody)&&!sh&&!p?r.states[r.towBody].position:null;({extentX:uh,extentY:dh}=r.renderer.draw(h/1e3,Q.clientWidth/Q.clientHeight,_.position,ih,b));let x=t.createFence();try{await x.signaled}finally{x.destroy()}document.querySelector(`#cargo-count`).textContent=`${i.size} / ${op.length}`,document.querySelector(`#hull`).textContent=`HULL ${Math.ceil(a)}%`,document.querySelector(`#navigation`).textContent=`NAV ${_.position[0].toFixed(1)} / ${_.position[1].toFixed(1)}`,$m.textContent=b?`TOW ATTACHED · ${r.towBody<=5?`CARGO POD`:`DEBRIS`} · release mouse to detach`:f?`${f.body<=5?`CARGO POD`:f.body<15?`DEBRIS`:`BOUNDARY`} · ${f.distance.toFixed(1)} m${b?` · TRACTOR ACTIVE`:``}`:`SCANNER · NO TARGET`,Qm.value=`${o.toFixed(1)} s simulated · ${r.graph.stats.nodeOrder.length} graph nodes\n${s} contact events · ${c} GPU queries\n${Math.hypot(..._.velocity).toFixed(1)} m/s · ${sh?`paused`:`running`}`,rh.update(),lh=requestAnimationFrame(e=>{y(e)})}catch(t){document.querySelector(`#startup-error`).textContent=t instanceof Error?t.stack??t.message:String(t),fh(),sh=!0;let n=t=>{ch&&(oh&&!e?(document.querySelector(`#startup-error`).textContent=``,y(t)):lh=requestAnimationFrame(n))};lh=requestAnimationFrame(n)}finally{m=!1,ch||_()}}}lh=requestAnimationFrame(e=>{y(e)}),window.addEventListener(`pagehide`,()=>{ch=!1,cancelAnimationFrame(lh),fh(),m||_()},{once:!0})}catch(e){document.querySelector(`#startup-error`).textContent=e instanceof Error?e.stack??e.message:String(e)}