const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./webgpu-device-DUDYo4S4.js","./buffer-layout-utils-JkjUdae_.js","./probe-log-B1Xc-tfO.js","./fence-Bs1U-DE7.js","./wgsl-interface-scan-DeeFUlEQ.js","./webgl-device-Bfl6Zip7.js","./debug-hooks-CtN7R8tq.js"])))=>i.map(i=>d[i]);
import{r as e,t}from"./probe-log-B1Xc-tfO.js";import{A as n,C as r,D as i,E as a,F as o,I as s,M as c,N as l,O as u,P as d,T as f,_ as p,c as m,d as h,f as g,g as _,h as v,i as y,m as b,o as x,p as S,r as C,s as w,t as T,u as E,w as D,y as O}from"./buffer-layout-utils-JkjUdae_.js";import{a as k,c as A,d as j,f as ee,i as te,l as ne,n as re,o as ie,r as ae,s as oe,t as se,u as ce}from"./wgsl-interface-scan-DeeFUlEQ.js";import{a as le,c as ue,n as de,o as fe,r as pe}from"./debug-hooks-CtN7R8tq.js";import{A as me,C as he,D as ge,E as _e,F as ve,L as ye,M as be,N as xe,O as Se,P as Ce,S as we,T as Te,b as M,d as Ee,f as De,g as Oe,h as ke,i as Ae,j as je,k as Me,l as Ne,m as Pe,p as Fe,t as Ie,u as Le,v as Re,w as ze,x as Be,y as Ve}from"./gltf-loader-M19z3sym.js";import{t as He}from"./preload-helper-CM5_IGEG.js";import{n as Ue,t as We}from"./globals-DcOAZo2r.js";import{t as Ge}from"./log-DknvWNRq.js";import{a as Ke,i as qe,n as Je,o as Ye,t as Xe}from"./globals-B923U4HV.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Ze=`set luma.log.level=1 (or higher) to trace rendering`,Qe="No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.",$e=new class e{static defaultProps={...o,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=l;log=s;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw s.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),s.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);s.error(`This version of luma.gl has already been initialized`)()}s.log(1,`${this.VERSION} - ${Ze}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t},r=this.selectAdapter(n.type,n.adapters);if(!r)throw Error(Qe);return n.waitForPageLoad&&await r.pageLoaded,await r.create(n)}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(Qe);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||s.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?s.warn(`WebGL1 is not supported`,e)():s.warn(`Unknown handle type`,e)(),null)}},et=class{get pageLoaded(){return it()}},tt=e()&&typeof document<`u`,nt=()=>tt&&document.readyState===`complete`,rt=null;function it(){return rt||=nt()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),rt}var at=class e{static defaultProps={...g.defaultProps};static getDefaultPipelineFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new e(t),n.defaultPipelineFactory}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...g.defaultProps,...e},n=this._renderPipelineCache,r=this._hashRenderPipeline(t),i=n[r]?.resource;if(i)n[r].useCount++,this.device.props.debugFactories&&s.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;i=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:c(`unnamed-cached`),_sharedRenderPipeline:e}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&s.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()}return i}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...j.defaultProps,...e},n=this._computePipelineCache,r=this._hashComputePipeline(t),i=n[r]?.resource;return i?(n[r].useCount++,this.device.props.debugFactories&&s.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)()):(i=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&s.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()),i}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&s.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(s.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&s.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof g&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof j&&(t=this._computePipelineCache),e instanceof g&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){let{type:t}=this.device;return`${t}/C/${this._getHash(e.shader.source)}SL${this._getHash(JSON.stringify(e.shaderLayout))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e.bufferLayout)),{type:o}=this.device;switch(o){case`webgl`:let s=this._getHash(JSON.stringify(e.parameters));return`${o}/R/${t}/${n}V${r}T${e.topology}P${s}SL${i}BL${a}`;default:let c=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),l=this._getHash(JSON.stringify(e.parameters)),u=this._getWebGPUAttachmentHash(e);return`${o}/R/${t}/${n}V${r}T${e.topology}EP${c}P${l}SL${i}BL${a}A${u}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=e.depthStencilAttachmentFormat??(e.parameters?.depthWriteEnabled?this.device.preferredDepthFormat:null);return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}},ot=class e{static defaultProps={...S.defaultProps};static getDefaultShaderFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new e(t),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&s.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let r=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:r,useCount:1},this.device.props.debugFactories&&s.log(3,`${this}: Created new shader ${r.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&s.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&s.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}};function st(e,t={}){let n={...e},r=t.layout??`std140`,i={},a=0;for(let[e,t]of Object.entries(n))a=ut(i,e,t,a,r);return a=u(a,ft(n,r)),{layout:r,byteLength:a*4,uniformTypes:n,fields:i}}function ct(e,t){let n=w(e),r=x(n),i=/^mat(\d)x(\d)<.+>$/.exec(n);if(i){let e=Number(i[1]),a=Number(i[2]),o=pt(a,n,r.type,t),s=gt(o.size,o.alignment,t);return{alignment:o.alignment,size:e*s,components:e*a,columns:e,rows:a,columnStride:s,shaderType:n,type:r.type}}let a=/^vec(\d)<.+>$/.exec(n);return a?pt(Number(a[1]),n,r.type,t):{alignment:1,size:1,components:1,columns:1,rows:1,columnStride:1,shaderType:n,type:r.type}}function lt(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function ut(e,t,n,r,i){if(typeof n==`string`){let a=ct(n,i),o=u(r,a.alignment);return e[t]={offset:o,...a},o+a.size}if(Array.isArray(n)){if(Array.isArray(n[0]))throw Error(`Nested arrays are not supported for ${t}`);let a=n[0],o=n[1],s=mt(a,i),c=u(r,ft(n,i));for(let n=0;n<o;n++)ut(e,`${t}[${n}]`,a,c+n*s,i);return c+s*o}if(lt(n)){let a=ft(n,i),o=u(r,a);for(let[r,a]of Object.entries(n))o=ut(e,`${t}.${r}`,a,o,i);return u(o,a)}throw Error(`Unsupported CompositeShaderType for ${t}`)}function dt(e,t){if(typeof e==`string`)return ct(e,t).size;if(Array.isArray(e)){let n=e[0],r=e[1];if(Array.isArray(n))throw Error(`Nested arrays are not supported`);return mt(n,t)*r}let n=0;for(let r of Object.values(e)){let e=r;n=u(n,ft(e,t)),n+=dt(e,t)}return u(n,ft(e,t))}function ft(e,t){if(typeof e==`string`)return ct(e,t).alignment;if(Array.isArray(e)){let n=e[0],r=ft(n,t);return _t(t)?Math.max(r,4):r}let n=1;for(let r of Object.values(e)){let e=ft(r,t);n=Math.max(n,e)}return vt(t)?Math.max(n,4):n}function pt(e,t,n,r){return{alignment:e===2?2:4,size:e===3?3:e,components:e,columns:1,rows:e,columnStride:e===3?3:e,shaderType:t,type:n}}function mt(e,t){return ht(dt(e,t),ft(e,t),t)}function ht(e,t,n){return u(e,_t(n)?4:t)}function gt(e,t,n){return n===`std140`?4:u(e,t)}function _t(e){return e===`std140`||e===`wgsl-uniform`}function vt(e){return e===`std140`||e===`wgsl-uniform`}function yt(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function bt(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:yt(e)}var xt=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=ue(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let i=n[0],a=n[1];if(Array.isArray(i))throw Error(`Nested arrays are not supported for ${t}`);if(typeof i==`string`&&bt(r)){this._flattenPackedArray(e,t,i,a,r);return}if(!Array.isArray(r)){s.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,a);n++){let a=r[n];a!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,i,a)}return}if(lt(n)&&St(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}s.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=ct(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=Ct(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){s.warn(`Uniform ${t} not found in layout`)();return}let{type:i,components:a,columns:o,rows:c,offset:l,columnStride:u}=r,d=e[i];if(a===1){d[l]=Number(n);return}let f=n;if(o===1){for(let e=0;e<a;e++)d[l+e]=Number(f[e]??0);return}let p=0;for(let e=0;e<o;e++){let t=l+e*u;for(let e=0;e<c;e++)d[t+e]=Number(f[p++]??0)}}};function St(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Ct(e,t,n){return Array.prototype.slice.call(e,t,n)}var wt=128;function Tt(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!bt(r)||!bt(i)||r.length!==i.length)return!1;let a=Math.min(n,wt);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function Et(e){return bt(e)?e.slice():e}var Dt=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return Tt(this.uniforms[e],t)?!1:(this.uniforms[e]=Et(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},Ot=1024,kt=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=st(r.uniformTypes??{},{layout:r.layout??At(e)}),a=new xt(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new Dt({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,Ot)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let r=this.getUniformBufferByteLength(e),i=this.device.createBuffer({usage:n.UNIFORM|n.COPY_DST,byteLength:r}),a=this.getUniformBufferData(e);return i.write(a),i}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:n.UNIFORM|n.COPY_DST,byteLength:t});this.uniformBuffers.set(e,r)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&s.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),i=!1;if(r&&n?.needsRedraw){i||=n.needsRedraw;let a=this.getUniformBufferData(e);r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,a):r.write(a));let o=this.uniformBlocks.get(e)?.getAllUniforms();s.log(4,`Writing to uniform buffer ${String(e)}`,a,o)()}return i}};function At(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function jt(e,t,n=`vector`){let{input:r,output:i,interpolation:a=`LINEAR`}=t;if(!r.length||!i.length||!Number.isFinite(e))return null;let o=r.length-1;if(e<=r[0]||o===0)return Nt(i,a,0,n);if(e>=r[o])return Nt(i,a,o,n);let s=0,c=o;for(;c-s>1;){let t=Math.floor((s+c)/2);r[t]<=e?s=t:c=t}let l=r[s],u=r[c]-l;if(u<=0||a===`STEP`)return Nt(i,a,s,n);let d=(e-l)/u;switch(a){case`LINEAR`:{let e=i[s],t=i[c];return!e||!t?null:n===`quaternion`?Mt(e,t,d):Pt(e,t,d)}case`CUBICSPLINE`:{let e=i[s*3+1],t=i[s*3+2],r=i[c*3],a=i[c*3+1];if(!e||!t||!r||!a)return null;let o=Ft(e,t,r,a,u,d);return n===`quaternion`?It(o):o}default:return null}}function Mt(e,t,n){let r=It(e),i=It(t),a=r.reduce((e,t,n)=>e+t*i[n],0),o=a<0?-1:1;if(a=Math.min(Math.abs(a),1),a>.9995)return It(r.map((e,t)=>e+n*(i[t]*o-e)));let s=Math.acos(a),c=Math.sin(s),l=Math.sin((1-n)*s)/c,u=Math.sin(n*s)/c*o;return It(r.map((e,t)=>e*l+i[t]*u))}function Nt(e,t,n,r){let i=e[t===`CUBICSPLINE`?n*3+1:n];return i?r===`quaternion`?It(i):[...i]:null}function Pt(e,t,n){return e.map((e,r)=>(1-n)*e+n*t[r])}function Ft(e,t,n,r,i,a){let o=a*a,s=o*a;return e.map((e,c)=>(2*s-3*o+1)*e+(s-2*o+a)*t[c]*i+(-2*s+3*o)*r[c]+(s-o)*n[c]*i)}function It(e){let t=Math.hypot(...e);return t>0?e.map(e=>e/t):[0,0,0,1]}var Lt=class{name;times;values;interpolation;valueType;binding;constructor(e){this.name=e.name||e.binding.id||`unnamed`,this.times=e.times,this.values=e.values,this.interpolation=e.interpolation||`LINEAR`,this.valueType=e.valueType||`vector`,this.binding=e.binding}get duration(){return this.times[this.times.length-1]||0}get sampler(){return{input:this.times,output:this.values,interpolation:this.interpolation}}evaluate(e){return jt(e,this.sampler,this.valueType)}},Rt=class{name;tracks;duration;constructor(e){this.name=e.name||`unnamed`,this.tracks=e.tracks,this.duration=e.duration??Math.max(0,...e.tracks.map(e=>e.duration))}},zt=class{clip;mixer;time=0;timeScale;weight;loop;repetitions;paused=!1;playing=!1;elapsedTime=0;fade=null;constructor(e,t,n={}){this.mixer=e,this.clip=t,this.loop=n.loop||`repeat`,this.repetitions=n.repetitions??1/0,this.timeScale=n.timeScale??1,this.weight=n.weight??1}play(){return this.playing=!0,this.paused=!1,this}pause(){return this.paused=!0,this}resume(){return this.playing=!0,this.paused=!1,this}stop(){return this.playing=!1,this.paused=!1,this.fade=null,this.reset()}reset(){return this.elapsedTime=0,this.time=0,this}setTime(e){return this.elapsedTime=e,this.time=this.resolveLocalTime(e),this}setLoop(e,t=1/0){return this.loop=e,this.repetitions=t,this.time=this.resolveLocalTime(this.elapsedTime),this}setEffectiveWeight(e){return this.weight=Math.max(0,e),this.fade=null,this}setEffectiveTimeScale(e){return this.timeScale=e,this}fadeIn(e){return this.scheduleFade(1,e)}fadeOut(e){return this.scheduleFade(0,e)}crossFadeTo(e,t){return e.weight=0,e.play().fadeIn(t),this.fadeOut(t)}crossFadeFrom(e,t){return e.crossFadeTo(this,t),this}advance(e){!this.playing||this.paused||(this.advanceFade(Math.abs(e)),this.elapsedTime+=e*this.timeScale,this.time=this.resolveLocalTime(this.elapsedTime),this.hasFinished()&&(this.playing=!1))}get shouldApply(){return(this.playing||this.hasFinished())&&this.weight>0}scheduleFade(e,t){return t<=0?(this.weight=e,this.fade=null,this):(this.fade={duration:t,elapsedTime:0,startWeight:this.weight,endWeight:e},this)}advanceFade(e){if(!this.fade)return;this.fade.elapsedTime+=e;let t=Math.min(this.fade.elapsedTime/this.fade.duration,1);this.weight=this.fade.startWeight+(this.fade.endWeight-this.fade.startWeight)*t,t===1&&(this.fade=null)}hasFinished(){let e=this.clip.duration;return e<=0?this.loop===`once`:this.loop===`once`?this.elapsedTime>=e||this.elapsedTime<0:Number.isFinite(this.repetitions)&&Math.abs(this.elapsedTime)>=e*this.repetitions}resolveLocalTime(e){let t=this.clip.duration;if(t<=0)return 0;if(this.loop===`once`)return Math.min(Math.max(e,0),t);if(Number.isFinite(this.repetitions)&&Math.abs(e)>=t*this.repetitions)return this.loop===`ping-pong`&&this.repetitions%2==0||e<0?0:t;let n=e>=0&&e<t?e:(e%t+t)%t;if(this.loop===`repeat`)return n;let r=Math.floor(e/t);return Math.abs(r%2)===0?n:t-n}},Bt=class{time=0;timeScale=1;clips=new Map;actions=new Map;initialValues=new Map;constructor(e=[]){e.forEach(e=>this.addClip(e))}addClip(e){return this.clips.set(e.name,e),this}clipAction(e,t){let n=typeof e==`string`?this.clips.get(e):e;if(!n)throw Error(`Unknown animation clip: ${e}`);this.addClip(n);let r=this.actions.get(n);return r||(r=new zt(this,n,t),this.actions.set(n,r)),r}getAction(e){let t=this.clips.get(e);return t?this.actions.get(t):void 0}update(e){return this.advance(e),this.applyValues(),this}advance(e){let t=e*this.timeScale;return this.time+=t,this.actions.forEach(e=>e.advance(t)),this}setTime(e){return this.time=e,this.actions.forEach(t=>{t.paused||t.setTime(e*t.timeScale)}),this.applyValues(),this}stopAllAction(){return this.actions.forEach(e=>e.stop()),this}applyValues(){let e=new Map;this.actions.forEach(t=>{!t.shouldApply&&!(t.playing&&t.weight===0)||t.clip.tracks.forEach(n=>{let r=n.evaluate(t.time);if(!r)return;let i=n.binding.id||n.binding;if(!this.initialValues.has(i)){let e=n.binding.getValue?.();e&&this.initialValues.set(i,[...e])}if(t.weight===0&&!this.initialValues.has(i))return;let a=e.get(i);if(!a){e.set(i,{binding:n.binding,value:[...r],valueType:n.valueType,weight:t.weight});return}if(t.weight===0)return;let o=a.weight+t.weight,s=t.weight/o;a.value=n.valueType===`quaternion`?Mt(a.value,r,s):a.value.map((e,t)=>e+(r[t]-e)*s),a.weight=o})}),e.forEach(({binding:e,value:t,valueType:n,weight:r},i)=>{let a=r<1?this.initialValues.get(i):void 0;a&&a.length===t.length&&(t=n===`quaternion`?Mt(a,t,r):t.map((e,t)=>a[t]+(e-a[t])*r)),e.setValue(t)})}},Vt={};function N(e=`id`){return Vt[e]=Vt[e]||1,`${e}-${Vt[e]++}`}var Ht=class{id;topology;vertexCount;indices;attributes;bufferLayout;userData={};constructor(e){let{attributes:t={},indices:n=null,vertexCount:r=null}=e;this.id=e.id||N(`geometry`),this.topology=e.topology,n&&(this.indices=ArrayBuffer.isView(n)?{value:n,size:1}:n),this.attributes={};for(let[e,n]of Object.entries(t)){let t=ArrayBuffer.isView(n)?{value:n}:n;if(!ArrayBuffer.isView(t.value))throw Error(`${this._print(e)}: must be typed array or object with value as typed array`);if((e===`POSITION`||e===`positions`)&&!t.size&&(t.size=3),e===`indices`){if(this.indices)throw Error(`Multiple indices detected`);this.indices=t}else{let n=Ut(e),r=Object.keys(this.attributes).find(e=>Ut(e)===n);r&&delete this.attributes[r],this.attributes[e]=t}}this.indices&&this.indices.isIndexed!==void 0&&(this.indices=Object.assign({},this.indices),delete this.indices.isIndexed),this.vertexCount=r||this._calculateVertexCount(this.attributes,this.indices),this.bufferLayout=e.bufferLayout||Wt(this.attributes)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}_print(e){return`Geometry ${this.id} attribute ${e}`}_setAttributes(e,t){return this}_calculateVertexCount(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e)){if(!t)continue;let{value:e,size:r,constant:i}=t;!i&&e&&r!==void 0&&r>=1&&(n=Math.min(n,e.length/r))}return n}};function Ut(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function Wt(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:i,normalized:o}=r;if(i===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:Ut(n),format:a.getVertexFormatFromAttribute(e,i,o)})}return t}function Gt(e){let{indices:t,attributes:n}=e;if(!t)return e;let r=t.value.length,i={};for(let e in n){let a=n[e];if(!a)continue;let{value:o,size:s}=a;if(a.constant||!s)continue;let c=o.constructor,l=new c(r*s);for(let e=0;e<r;++e){let n=t.value[e];for(let t=0;t<s;t++)l[e*s+t]=o[n*s+t]}i[e]={size:s,value:l}}return{attributes:Object.assign({},n,i)}}function Kt(e,t={}){let n=t.bufferName||`geometry`;if(qt(e,n))return e;let r=t.minAttributeAlignment||4,i=Jt(e,t.attributes),o=[],s=0,c=1/0;for(let[e,t]of i){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:i,normalized:l}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(i===void 0)throw Error(`Attribute ${e} is missing a size`);let u=a.getVertexFormatFromAttribute(n,i,l),d=a.getVertexFormatInfo(u);s=Xt(s,r),o.push({sourceName:e,attributeName:Ut(e),value:n,size:i,format:u,byteOffset:s,byteLength:d.byteLength}),s+=d.byteLength;let f=n.length/i;if(!Number.isInteger(f))throw Error(`Attribute ${e} length is not divisible by size`);c=Math.min(c,f)}if(o.length===0||!Number.isFinite(c))throw Error(`Geometry ${e.id} has no interleavable attributes`);let l=Xt(s,r),u=new ArrayBuffer(c*l);for(let e of o)Yt(u,c,l,e);return new Ht({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(u),size:l,byteStride:l}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:l,attributes:o.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function qt(e,t){if(e.bufferLayout.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function Jt(e,t){return t?t.map(t=>[t,e.attributes[t]]):Object.entries(e.attributes)}function Yt(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function Xt(e,t){return Math.ceil(e/t)*t}function Zt(e){let t=e.value;if(t instanceof Float32Array)return t;let n=new Float32Array(t.length),r=tn(t),i=t instanceof Int8Array||t instanceof Int16Array||t instanceof Int32Array;for(let a=0;a<t.length;a++){let o=Number(t[a]);n[a]=e.normalized&&r?i?Math.max(o/r,-1):o/r:o}return n}function Qt(e,t,n){let r={};for(let i of[`POSITION`,`NORMAL`,`TANGENT`]){let a=e[i];if(!a)continue;let o=new Float32Array(a),s=i===`TANGENT`?4:3,c=Math.floor(a.length/s);for(let e=0;e<Math.min(t.length,n.length);e++){let r=n[e],a=t[e][i];if(!r||!a)continue;let l=i===`TANGENT`&&a.length===c*4?4:3;for(let e=0;e<c;e++){let t=e*s,n=e*l;for(let e=0;e<3;e++)o[t+e]+=(a[n+e]||0)*r}}i!==`POSITION`&&nn(o,s),r[i]=o}return r}function $t(e,t,n,r){let i={};for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let n=t.attributes[e];n&&(i[e]=Zt(n))}let a=Qt(i,n,r),o={};for(let[e,n]of Object.entries(t.attributes))n&&(o[e]=n);for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let t=a[e],n=o[e];t&&n&&(o[e]={...n,value:en(n,t)})}let s=Kt(new Ht({id:t.id,topology:t.topology||`triangle-list`,vertexCount:t.vertexCount,indices:t.indices,attributes:o,bufferLayout:t.bufferLayout})).attributes.geometry?.value,c=e._gpuGeometry?.attributes.geometry||e.bufferAttributes.geometry;if(s&&c){c.write(s);return}for(let t of[`POSITION`,`NORMAL`,`TANGENT`]){let n=a[t];if(n){let r=t===`POSITION`?`positions`:t===`NORMAL`?`normals`:`TANGENT`;e.bufferAttributes[r]?.write(n)}}}function en(e,t){if(e.value instanceof Float32Array)return t;let n=e.value.slice(),r=tn(n),i=n instanceof Int8Array||n instanceof Int16Array||n instanceof Int32Array;for(let a=0;a<t.length;a++){let o=t[a];n[a]=e.normalized&&r?Math.round(Math.max(i?-1:0,Math.min(1,o))*r):o}return n}function tn(e){return e instanceof Int8Array?127:e instanceof Uint8Array||e instanceof Uint8ClampedArray?255:e instanceof Int16Array?32767:e instanceof Uint16Array?65535:e instanceof Int32Array?2147483647:e instanceof Uint32Array?4294967295:0}function nn(e,t){for(let n=0;n<e.length;n+=t){let t=Math.hypot(e[n],e[n+1],e[n+2]);t>0&&(e[n]/=t,e[n+1]/=t,e[n+2]/=t)}}function rn(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function an(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function on(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function sn(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function cn(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function ln(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function un(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function dn(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,j=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*j,e[9]=f*k+g*A+b*j,e[10]=p*k+_*A+x*j,e[11]=m*k+v*A+S*j,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function fn(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function pn(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function mn(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function hn(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function gn(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function _n(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var vn=_n;function yn(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var bn=yn;function xn(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?rn(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function Sn(){let e=new ve(4);return ve!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0,e[3]=0),e}function Cn(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}(function(){let e=Sn();return function(t,n,r,i,a,o){let s,c;for(n||=4,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],e[3]=t[s+3],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2],t[s+3]=e[3];return t}})();var wn;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL0ROW3=3]=`COL0ROW3`,e[e.COL1ROW0=4]=`COL1ROW0`,e[e.COL1ROW1=5]=`COL1ROW1`,e[e.COL1ROW2=6]=`COL1ROW2`,e[e.COL1ROW3=7]=`COL1ROW3`,e[e.COL2ROW0=8]=`COL2ROW0`,e[e.COL2ROW1=9]=`COL2ROW1`,e[e.COL2ROW2=10]=`COL2ROW2`,e[e.COL2ROW3=11]=`COL2ROW3`,e[e.COL3ROW0=12]=`COL3ROW0`,e[e.COL3ROW1=13]=`COL3ROW1`,e[e.COL3ROW2=14]=`COL3ROW2`,e[e.COL3ROW3=15]=`COL3ROW3`})(wn||={});var Tn=45*Math.PI/180,En=1,Dn=.1,On=500,kn=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),P=class extends Me{static get IDENTITY(){return Nn()}static get ZERO(){return Mn()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return wn}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(kn)}fromObject(e){return this.check()}fromQuaternion(e){return hn(this,e),this.check()}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=Dn,far:o=On}=e;return o===1/0?Fn(this,t,n,r,i,a):gn(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return xn(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=Dn,far:o=On}=e;return bn(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=Tn,aspect:n=En,focalDistance:r=1,near:i=Dn,far:a=On}=e;Pn(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return Pn(t),vn(this,t,n,r,i),this.check()}determinant(){return sn(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=0,e[4]=this[4]*r,e[5]=this[5]*i,e[6]=this[6]*a,e[7]=0,e[8]=this[8]*r,e[9]=this[9]*i,e[10]=this[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=this[4]*r,e[4]=this[5]*i,e[5]=this[6]*a,e[6]=this[8]*r,e[7]=this[9]*i,e[8]=this[10]*a,e}transpose(){return an(this,this),this.check()}invert(){return on(this,this),this.check()}multiplyLeft(e){return cn(this,e,this),this.check()}multiplyRight(e){return cn(this,this,e),this.check()}rotateX(e){return fn(this,this,e),this.check()}rotateY(e){return pn(this,this,e),this.check()}rotateZ(e){return mn(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return dn(this,this,e,t),this.check()}scale(e){return un(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return ln(this,this,e),this.check()}transform(e,t){return e.length===4?(t=Cn(t||[-0,-0,-0,-0],e,this),ye(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=Ce(t||[-0,-0],e,this);break;case 3:r=je(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ye(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=be(t||[-0,-0],e,this);break;case 3:n=xe(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ye(n,e.length),n}transformPoint(e,t){return this.transformAsPoint(e,t)}transformVector(e,t){return this.transformAsPoint(e,t)}transformDirection(e,t){return this.transformAsVector(e,t)}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},An,jn;function Mn(){return An||(An=new P([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(An)),An}function Nn(){return jn||(jn=new P,Object.freeze(jn)),jn}function Pn(e){if(e>Math.PI*2)throw Error(`expected radians`)}function Fn(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}function In(e){let{joints:t,meshNode:n,worldMatrices:r,inverseBindMatrices:i,target:a}=e,o=t.length,s=a&&a.length===o*16?a:new Float32Array(o*16),c=n?r.get(n)||n.matrix:void 0,l=c?new P(c).invert():null;for(let e=0;e<o;e++){let n=t[e],a=r.get(n)||n.matrix,o=l?new P(l).multiplyRight(a):new P(a),c=e*16;if(i&&i.length>=c+16){let e=new P;for(let t=0;t<16;t++)e[t]=i[c+t];o.multiplyRight(e)}s.set(o,c)}return s}var Ln=class{constructor(e){}async onInitialize(e){return null}};function Rn(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function zn(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var Bn=0,Vn=`Animation Loop`,Hn={requestAnimationFrame:e=>Rn(e),cancelAnimationFrame:e=>zn(e)},Un=class e{static defaultAnimationLoopProps={device:null,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:Hn};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new d({id:`animation-loop-${Bn++}`}),this.sharedStats=$e.stats.get(Vn),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(e){this.props.onError(e),this._error=e}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||Hn;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){return this._running&&(this.animationProps&&!this._error&&this.props.onFinalize(this.animationProps),this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0),this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){this._running&&(this.redraw(e,t??null),this._requestAnimationFrame())}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove.bind(this)),this.canvas.addEventListener(`mouseleave`,this._onMouseleave.bind(this)))}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}};function Wn(e,t){let n=null,r=t?.device||$e.createDevice({id:`animation-loop`,adapters:t?.adapters,createCanvasContext:!0}),i=new Un({...t,device:r,async onInitialize(t){Kn(t.animationLoop.device);try{return n=new e(t),await n?.onInitialize(t)}catch(e){return console.error(e),n=null,Gn(t.animationLoop.device,e),t.animationLoop.stop(),null}},onRender(e){let r=n?.onRender(e),i=t?.onAfterRender?.(e,n);return t?.onAfterRender?r!==!1||i!==!1:r},onFinalize(e){try{n?.onFinalize(e)}finally{n=null}}}),a=i;return a.getAnimationLoopTemplate=()=>n,i.getInfo=()=>this.AnimationLoopTemplateCtor.info,a}function Gn(e,t){if(!e)return;let n=e.getDefaultCanvasContext().canvas;if(n instanceof HTMLCanvasElement){n.style.overflow=`visible`;let e=document.getElementById(`animation-loop-error`);e?.remove(),e=document.createElement(`h1`),e.id=`animation-loop-error`,e.innerHTML=t.message,e.style.position=`absolute`,e.style.top=`10px`,e.style.left=`10px`,e.style.color=`black`,e.style.backgroundColor=`red`,n.parentElement?.appendChild(e)}}function Kn(e){if(!e)return;let t=document.getElementById(`animation-loop-error`);t&&t.remove()}var qn={target:[0,0,0],distance:10,yaw:0,pitch:.25,minDistance:1,maxDistance:100,minPitch:-Math.PI/2+.01,maxPitch:Math.PI/2-.01,rotateSpeed:.006,zoomSpeed:.001,enabled:!0,enableZoom:!0,enablePan:!1,panSpeed:.0018,autoRotate:!1,autoRotateSpeed:.1},Jn=class{canvas;props;yaw;pitch;distance;dragging=!1;activePointers=new Map;lastPointer=[0,0];previousPinchDistance=null;previousTimeMilliseconds=null;previousCursor;previousTouchAction;constructor(e,t={}){this.canvas=e,this.props={...qn,...t},this.props.target=[...this.props.target],this.yaw=this.props.yaw,this.pitch=Yn(this.props.pitch,this.props.minPitch,this.props.maxPitch),this.distance=Yn(this.props.distance,this.props.minDistance,this.props.maxDistance),this.previousCursor=e.style.cursor,this.previousTouchAction=e.style.touchAction,e.style.cursor=`grab`,e.style.touchAction=`none`,e.addEventListener(`pointerdown`,this.handlePointerDown),e.addEventListener(`pointermove`,this.handlePointerMove),e.addEventListener(`pointerup`,this.handlePointerUp),e.addEventListener(`pointercancel`,this.handlePointerUp),e.addEventListener(`wheel`,this.handleWheel,{passive:!1})}update(e){if(this.previousTimeMilliseconds!==null&&this.props.enabled&&this.props.autoRotate&&!this.dragging){let t=Math.min(Math.max(e-this.previousTimeMilliseconds,0)/1e3,.1);this.yaw+=this.props.autoRotateSpeed*t}this.previousTimeMilliseconds=e}getEyePosition(){let e=this.distance*Math.cos(this.pitch);return[this.props.target[0]+e*Math.sin(this.yaw),this.props.target[1]+this.distance*Math.sin(this.pitch),this.props.target[2]+e*Math.cos(this.yaw)]}setAutoRotate(e){this.props.autoRotate=e}setProps(e){Object.assign(this.props,e),e.enabled===!1&&this.dragging&&this.endPointerInteraction(),e.target&&(this.props.target=[...e.target]),e.yaw!==void 0&&(this.yaw=e.yaw),(e.pitch!==void 0||e.minPitch!==void 0||e.maxPitch!==void 0)&&(this.pitch=Yn(e.pitch??this.pitch,this.props.minPitch,this.props.maxPitch)),(e.distance!==void 0||e.minDistance!==void 0||e.maxDistance!==void 0)&&(this.distance=Yn(e.distance??this.distance,this.props.minDistance,this.props.maxDistance))}reset(){this.yaw=this.props.yaw,this.pitch=Yn(this.props.pitch,this.props.minPitch,this.props.maxPitch),this.distance=Yn(this.props.distance,this.props.minDistance,this.props.maxDistance)}destroy(){this.canvas.removeEventListener(`pointerdown`,this.handlePointerDown),this.canvas.removeEventListener(`pointermove`,this.handlePointerMove),this.canvas.removeEventListener(`pointerup`,this.handlePointerUp),this.canvas.removeEventListener(`pointercancel`,this.handlePointerUp),this.canvas.removeEventListener(`wheel`,this.handleWheel),this.endPointerInteraction(),this.canvas.style.cursor=this.previousCursor,this.canvas.style.touchAction=this.previousTouchAction}handlePointerDown=e=>{if(!(!this.props.enabled||e.button!==0||this.activePointers.has(e.pointerId)||this.activePointers.size>=2||this.activePointers.size>0&&e.pointerType!==`touch`)){if(this.activePointers.size===0&&this.props.onInteractionStart?.(),this.dragging=!0,this.activePointers.set(e.pointerId,[e.clientX,e.clientY]),this.activePointers.size===1)this.lastPointer=[e.clientX,e.clientY];else{let{center:e,distance:t}=this.getMultiPointerState();this.lastPointer=e,this.previousPinchDistance=t}this.canvas.setPointerCapture(e.pointerId),this.canvas.style.cursor=`grabbing`}};handlePointerMove=e=>{if(!this.props.enabled||!this.dragging||!this.activePointers.has(e.pointerId))return;if(this.activePointers.set(e.pointerId,[e.clientX,e.clientY]),this.activePointers.size>1){let{center:e,distance:t}=this.getMultiPointerState();this.props.enablePan&&this.panTarget(e[0]-this.lastPointer[0],e[1]-this.lastPointer[1]),this.props.enableZoom&&this.previousPinchDistance&&t>0&&(this.distance=Yn(this.distance*this.previousPinchDistance/t,this.props.minDistance,this.props.maxDistance)),this.lastPointer=e,this.previousPinchDistance=t;return}let t=e.clientX-this.lastPointer[0],n=e.clientY-this.lastPointer[1];this.lastPointer=[e.clientX,e.clientY],this.props.enablePan&&e.shiftKey?this.panTarget(t,n):(this.yaw-=t*this.props.rotateSpeed,this.pitch=Yn(this.pitch-n*(this.props.pitchSpeed??this.props.rotateSpeed),this.props.minPitch,this.props.maxPitch))};handlePointerUp=e=>{if(!this.activePointers.has(e.pointerId))return;this.canvas.hasPointerCapture(e.pointerId)&&this.canvas.releasePointerCapture(e.pointerId),this.activePointers.delete(e.pointerId),this.previousPinchDistance=null;let t=this.activePointers.entries().next().value;if(t){this.lastPointer=t[1];return}this.endPointerInteraction()};endPointerInteraction(){this.dragging=!1;for(let e of this.activePointers.keys())this.canvas.hasPointerCapture(e)&&this.canvas.releasePointerCapture(e);this.activePointers.clear(),this.previousPinchDistance=null,this.canvas.style.cursor=`grab`}getMultiPointerState(){let[e,t]=this.activePointers.values(),n=t[0]-e[0],r=t[1]-e[1];return{center:[(e[0]+t[0])/2,(e[1]+t[1])/2],distance:Math.hypot(n,r)}}panTarget(e,t){let n=this.distance*this.props.panSpeed;this.props.target=[this.props.target[0]-Math.cos(this.yaw)*e*n,this.props.target[1]+t*n,this.props.target[2]+Math.sin(this.yaw)*e*n]}handleWheel=e=>{if(!this.props.enabled||!this.props.enableZoom)return;e.preventDefault(),this.props.onInteractionStart?.();let t=Yn(e.deltaY,-240,240);this.distance=Yn(this.distance*Math.exp(t*this.props.zoomSpeed),this.props.minDistance,this.props.maxDistance)}};function Yn(e,t,n){return Math.min(Math.max(e,t),n)}function Xn(e,t){if(!e){let e=Error(t||`shadertools: assertion failed.`);throw Error.captureStackTrace?.(e,Xn),e}}var Zn={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function Qn(e){let t={};for(let[n,r]of Object.entries(e))t[n]=$n(r);return t}function $n(e){let t=er(e);if(t!==`object`)return{value:e,...Zn[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=er(e.value),{...e,...Zn[t],type:t}):{...e,...Zn[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function er(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}var tr={vertex:`#ifdef MODULE_LOGDEPTH
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
`},nr=/void\s+main\s*\([^)]*\)\s*\{\n?/,rr=/}\n?[^{}]*$/,ir=[],ar=`__LUMA_INJECT_DECLARATIONS__`;function or(e){let t={vertex:{},fragment:{}};for(let n in e){let r=e[n],i=sr(n);typeof r==`string`&&(r={order:0,injection:r}),t[i][n]=r}return t}function sr(e){let t=e.slice(0,2);switch(t){case`vs`:return`vertex`;case`fs`:return`fragment`;default:throw Error(t)}}function cr(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),ir.length=r.length;for(let e=0,t=r.length;e<t;++e)ir[e]=r[e].injection;let s=`${ir.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(ar,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?lr(e,`vertex`,s,`start`,a.vertex):e.replace(nr,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?lr(e,`vertex`,s,`end`,a.vertex):e.replace(rr,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(ar,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?lr(e,`fragment`,s,`start`,a.fragment):e.replace(nr,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?lr(e,`fragment`,s,`end`,a.fragment):e.replace(rr,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(ar,``),r&&(e=e.replace(/\}\s*$/,e=>e+tr[t])),e}function lr(e,t,n,r,i){let a=ur(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function ur(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${dr(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function dr(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function fr(e){e.map(e=>pr(e))}function pr(e){if(e.instance)return;fr(e.dependencies||[]);let{propTypes:t={},deprecations:n=[],inject:r={}}=e,i={normalizedInjections:or(r),parsedDeprecations:hr(n)};t&&(i.propValidators=Qn(t)),e.instance=i;let a={};t&&(a=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...a}}function mr(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function hr(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function gr(e){fr(e);let t={},n={};_r({modules:e,level:0,moduleMap:t,moduleDepth:n});let r=Object.keys(n).sort((e,t)=>n[t]-n[e]).map(e=>t[e]);return fr(r),r}function _r(e){let{modules:t,level:n,moduleMap:r,moduleDepth:i}=e;if(n>=5)throw Error(`Possible loop in shader dependency graph`);for(let e of t)r[e.name]=e,(i[e.name]===void 0||i[e.name]<n)&&(i[e.name]=n);for(let e of t)e.dependencies&&_r({modules:e.dependencies,level:n+1,moduleMap:r,moduleDepth:i})}var vr=/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][\w-]*)$/;function yr(e=[],t){let n=[],r={},i={},a={},o={};for(let s of e)xr({modules:n,defines:r,injections:i,vertexInputs:a,varyings:o},s),xr({modules:n,defines:r,injections:i,vertexInputs:a,varyings:o},s[t]);for(let e of Object.keys(o))if(a[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return{modules:n,defines:r,injections:i,vertexInputs:a,varyings:o}}function br(e=[],t=[]){let n=[...e],r=new Set(n.map(e=>e.name));for(let e of t)r.has(e.name)||(n.push(e),r.add(e.name));return n}function xr(e,t){if(t){t.modules?.length&&e.modules.push(...t.modules),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){Sr(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.varyings||{})){Sr(n,`varying`);let t=Cr(n,r),i=e.varyings[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.varyings[n]=t}for(let n of t.injections||[])wr(n.target),e.injections[n.target]||(e.injections[n.target]=[]),e.injections[n.target].push({injection:n.injection,order:n.order??0})}}function Sr(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function Cr(e,t){let{primitiveType:n}=m.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function wr(e){if(!vr.test(e))throw Error(`ShaderPlugin injection target "${e}" must be a named shader anchor or hook`)}var Tr=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,Er=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function Dr(e){return`${e.name}Uniforms`}function Or(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=Dr(e);return Nr(n,t===`wgsl`?`wgsl`:`glsl`,r)}function kr(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=Or(e,t);return r?{moduleName:e.name,uniformBlockName:Dr(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:Ir(n,r)}:null}function Ar(e,t,n={}){let r=kr(e,t);if(!r||r.matches)return r;let i=Lr(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&Xn(!1,i),r}function jr(e){let t=[],n=Rr(e);for(let e of n.matchAll(Er)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function Mr(e,t,n,r){let i=jr(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${zr(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function Nr(e,t,n){let r=t===`wgsl`?Pr(e,n):Fr(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(Tr);r&&i.push(r[1])}return i}function Pr(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function Fr(e,t){return jr(e).find(e=>e.blockName===t)?.body||null}function Ir(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Lr(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=Br(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${Vr(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${Vr(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function Rr(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function zr(e){return e.replace(/\s+/g,` `).trim()}function Br(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function Vr(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}function Hr(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function Ur(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=qr(e,Gr),e;case`fragment`:return e=qr(e,Kr),e;default:throw Error(t)}}var Wr=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],Gr=[...Wr,[Jr(`attribute`),`in $1`],[Jr(`varying`),`out $1`]],Kr=[...Wr,[Jr(`varying`),`in $1`]];function qr(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function Jr(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}function Yr(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i];if(r+=`${n===`wgsl`?`fn`:`void`} ${a.signature} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function Xr(e){let t={vertex:{},fragment:{}};for(let n of e){let e,r;typeof n==`string`?(e={},r=n):(e=n,r=e.hook),r=r.trim();let i=r.indexOf(`:`),a=r.slice(0,i),o=r.slice(i+1),s=r.replace(/\(.+/,``),c=Object.assign(e,{signature:o});switch(a){case`vs`:t.vertex[s]=c;break;case`fs`:t.fragment[s]=c;break;default:throw Error(a)}}return t}function Zr(e,t){return{name:Qr(e,t),language:`glsl`,version:$r(e)}}function Qr(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function $r(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}var ei=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${ae}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${ae}\\s*:\\s*([^;]+);`,`g`)];function ti(e,t=[]){let n=ne(e),r=new Map;for(let e of t)r.set(ri(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of ei){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===ei[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(ri(l,s,o));i.push(ni({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function ni(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:oi(e.resourceType),viewDimension:ii(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:ii(e.resourceType),sampleType:ai(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function ri(e,t,n){return`${t}:${n}:${e}`}function ii(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function ai(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function oi(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}var si=`([a-zA-Z_][a-zA-Z0-9_]*)`,ci=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,li=RegExp(`^\\s*\\#\\s*ifdef\\s*${si}\\s*$`),ui=RegExp(`^\\s*\\#\\s*ifndef\\s*${si}\\s*(?:\\/\\/.*)?$`),di=/^\s*\#\s*else\s*(?:\/\/.*)?$/,fi=/^\s*\#\s*endif\s*$/,pi=RegExp(`^\\s*\\#\\s*ifdef\\s*${si}\\s*(?:\\/\\/.*)?$`),mi=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function hi(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(ci),o=e.match(pi)||e.match(li),s=e.match(ui),c=e.match(di),l=e.match(mi)||e.match(fi);if(n){let e=gi(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function gi(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=n.match(RegExp(`^!\\s*${si}$`));if(r)return!t[r[1]];let i=n.match(RegExp(`^${si}$`));if(i)return!!t[i[1]];let a=n.match(RegExp(`^defined\\s*\\(\\s*${si}\\s*\\)$`));if(a)return t[a[1]]!==void 0;let o=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${si}\\s*\\)$`));if(o)return t[o[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function _i(e,t){let n=[];for(let[r,i]of Object.entries(t))bi(e,r),n.push(`in ${yi(i)} ${r};`);return n.join(`
`)}function vi(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=xi(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Si(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||Di(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=Oi(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function yi(e){let{primitiveType:t,components:n}=m.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function bi(e,t){let n=ji(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function xi(e,t){let n=RegExp(`\\bfn\\s+${ji(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=ki(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Si(e,t){let n=Ci(t),r=new Set(wi(t)),i=Ti(t);for(let t of i){let i=Ei(e,t);if(i!==null){n.push(...Ci(i));for(let e of wi(i))r.add(e)}}return{locations:n,names:r}}function Ci(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function wi(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Ti(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Ei(e,t){let n=RegExp(`\\bstruct\\s+${ji(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=ki(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function Di(e,t){let n=ji(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(Ai(e,i.index)===0)return!0;i=r.exec(e)}return!1}function Oi(e){let t=0;for(;e.has(t);)t++;return t}function ki(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function Ai(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function ji(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Mi(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){Qi(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${yi(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Xi(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function Ni(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=Pi(a,t,`vertex`),s=Fi(a,o),c=Pi(a,n,`fragment`),l=Ii(a,c),u=Li(a,s),d=Li(a,l.type),f=new Set([...qi(o.parameters),...qi(u.body),...qi(c.parameters),...qi(d.body)]),p=new Set([...Ki(u.body),...Ki(d.body)]),m=[],h=[],g=[],_=[];for(let[e,t]of i){if(f.has(e)||Ji(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=Yi(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;m.push(`  @location(${n})${r} ${e}: ${t.type},`),h.push(`var<private> ${e}: ${t.type};`),g.push(`${e} = ${Zi(t.type)};`),_.push(`${e} = ${l.name}.${e};`)}zi(a,s,o.openBrace,o.closeBrace),a=Bi(a,s,o,i.map(([e])=>e)),o=Pi(a,t,`vertex`),a=Vi(a,o,i.map(([e])=>e));let v=(s===l.type?[s]:[s,l.type]).map(e=>Li(a,e).closeBrace).sort((e,t)=>t-e);for(let e of v)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=Pi(a,n,`fragment`),!RegExp(`\\b${ta(l.name)}\\s*:`).test(c.parameters))throw Error(`Unable to preserve WGSL fragment input "${l.name}"`);return{source:a,declarations:h.join(`
`),vertexInitialization:g.join(`
`),fragmentInitialization:_.join(`
`)}}function Pi(e,t,n){let r=RegExp(`\\bfn\\s+${ta(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin varyings require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=$i(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=$i(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function Fi(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||Ri(e,r[1])===null)throw Error(`ShaderPlugin varyings require the WGSL vertex entry point to return a named struct`);return r[1]}function Ii(e,t){let n=[];for(let r of Gi(t.parameters,`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&Ri(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length!==1)throw Error(`ShaderPlugin varyings require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]}function Li(e,t){let n=Ri(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function Ri(e,t){let n=RegExp(`\\bstruct\\s+${ta(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=$i(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function zi(e,t,n,r){let i=RegExp(`\\b${ta(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function Bi(e,t,n,r){let i=RegExp(`\\b${ta(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=$i(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function Vi(e,t,n){let r=Hi(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function Hi(e,t,n){let r=[],i=t;for(;i<n;)if(i=Wi(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=Ui(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function Ui(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=Wi(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function Wi(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function Gi(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function Ki(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function qi(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Ji(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${ta(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(ea(e,r.index)===0)return!0;r=n.exec(e)}return!1}function Yi(e){let t=0;for(;e.has(t);)t++;return t}function Xi(e){let{primitiveType:t,components:n}=m.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${yi(e)}(${r})`}function Zi(e){let{primitiveType:t,components:n}=m.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function Qi(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${ta(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function $i(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function ea(e,t){let n=0;for(let r=0;r<t;r++){let i=Wi(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function ta(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var na=`\n\n${ar}\n`,ra=100,ia=`precision highp float;
`;function aa(e){let t=gr(e.modules||[]),{source:n,bindingAssignments:r}=sa(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:la(t),bindingAssignments:r,bindingTable:ti(n,r),shaderLayout:se(n,{vertexEntryPoint:e.vertexEntryPoint,scanVertexAttributes:e.scanVertexAttributes})}}function oa(e){let{vs:t,fs:n}=e,r=gr(e.modules||[]);return{vs:ca(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:ca(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:la(r)}}function sa(e,t){let{source:n,stage:r,modules:i,defines:a={},hookFunctions:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginVaryings:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;Xn(typeof n==`string`,`shader source must be a string`);let m=vi(hi(n,{defines:a}),d,l),h=Ni(m.source,d,f,u),g=h.source,_=``,v=Xr(o),y={},b={},x={};ua(c,y,b,x);for(let e in s){let t=typeof s[e]==`string`?{injection:s[e],order:0}:s[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[t]:x[e]=[t]:y[e]=[t]}else x[e]=[t]}da(m.declarations,m.initialization,b,x),fa(h,b,x);let S=i,C=ya(g),w=va(C.source),T=Ca(S,t._bindingRegistry,w,a),E=[];for(let e of S){p&&mr(e,g,p);let n=ba(hi(_a(e,`wgsl`,p),{defines:a}),e,{usedBindingsByGroup:w,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:T});E.push(...n.bindingAssignments);let r=n.source;_+=r;let i=pa(e);for(let e in i){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let n=t[2]===`decl`?b:x;n[e]=n[e]||[],n[e].push(i[e])}else y[e]=y[e]||[],y[e].push(i[e])}}return _+=na,_=cr(_,r,ma(b),!1,`wgsl`,{vertex:d,fragment:f}),_+=ha(v,y),_+=Ma(E),_+=C.source,_=cr(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),ja(_),{source:_,bindingAssignments:E}}function ca(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},hookFunctions:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginVaryings:d={},prologue:f=!0,log:p}=t;Xn(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?Zr(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${Hr(e)}
${r===`fragment`?ia:``}

// ----- APPLICATION DEFINES -------------------------

${ga(v)}

`:`${g}
`;break}let b=Xr(s),x={},S={},C={};ua(l,x,S,C);for(let e in c){let t=typeof c[e]==`string`?{injection:c[e],order:0}:c[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[t]:C[e]=[t]:x[e]=[t]}else C[e]=[t]}if(r===`vertex`){let e=_i(_,u);e&&(S[`vs:#decl`]=S[`vs:#decl`]||[],S[`vs:#decl`].push({injection:e,order:-(2**53-1)}))}let w=Mi(_,r,d);if(w.declarations){let e=r===`vertex`?`vs:#decl`:`fs:#decl`;S[e]=S[e]||[],S[e].push({injection:w.declarations,order:-(2**53-1)})}w.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:w.initialization,order:-(2**53-1)}));for(let e of a){p&&mr(e,_,p);let t=_a(e,r,p);y+=t;let n=e.instance?.normalizedInjections[r]||{};for(let e in n){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let r=t[2]===`decl`?S:C;r[e]=r[e]||[],r[e].push(n[e])}else x[e]=x[e]||[],x[e].push(n[e])}}return y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=na,y=cr(y,r,S),y+=Yr(b[r],x),y+=_,y=cr(y,r,C),i===`glsl`&&m!==h&&(y=Ur(y,r)),i===`glsl`&&Mr(y,r,p),y.trim()}function la(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function ua(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function da(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function fa(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function pa(e){return{...e.instance?.normalizedInjections.vertex||{},...e.instance?.normalizedInjections.fragment||{}}}function ma(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function ha(e,t){return Yr(e.vertex,t,`wgsl`)+Yr(e.fragment,t,`wgsl`)}function ga(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}function _a(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:Xn(!1)}if(!e.name)throw Error(`Shader module must have a name`);Ar(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}function va(e){let t=new Map;for(let n of oe(e,k)){let e=Number(n.bindingToken),r=Number(n.groupToken);Ea(r,e,n.name),Oa(t,r,e,`application binding "${n.name}"`)}return t}function ya(e){let t=oe(e,te),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);Ea(r,t,e.name),Oa(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=ce(e,te,e=>Sa(e,n,r));if(A(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function ba(e,t,n){let r=[],i={sawSupportedBindingDeclaration:oe(e,re).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=ce(e,re,e=>xa(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(A(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function xa(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=Na(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?ka(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return Da(n.name,u,s,l),t!==void 0&&wa(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(Oa(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);return Da(n.name,u,d,l),Oa(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function Sa(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=Aa(s,t);return Ea(s,e,o),Oa(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function Ca(e,t,n,r){let i=new Map;if(!t)return i;for(let a of e)for(let e of Ta(a,r)){let r=Na(e.group,a.name,e.name),o=t.get(r);if(o!==void 0){let t=i.get(e.group)||new Map,a=t.get(o);if(a&&a!==r)throw Error(`Duplicate WGSL binding reservation for modules "${a}" and "${r}": group ${e.group}, binding ${o}.`);Oa(n,e.group,o,`registered module binding "${r}"`),t.set(o,r),i.set(e.group,t)}}return i}function wa(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return!0}function Ta(e,t){let n=[],r=hi(e.source||``,{defines:t});for(let e of oe(r,re))n.push({name:e.name,group:Number(e.groupToken)});return n}function Ea(e,t,n){if(e===0&&t>=ra)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below ${ra}.`)}function Da(e,t,n,r){if(t===0&&n<ra)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be ${ra} or higher.`)}function Oa(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function ka(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?ra:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function Aa(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function ja(e){let t=ie(e,re);if(!t)return;let n=Pa(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):Fa(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${Ia(t.match)}".`)}function Ma(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function Na(e,t,n){return`${e}:${t}:${n}`}function Pa(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function Fa(e,t){let n=e.indexOf(na);return n>=0?t>n:!0}function Ia(e){return e.replace(/\s+/g,` `).trim()}var La=class e{static defaultShaderAssemblers={};_hookFunctions=[];_defaultModules=[];static getDefaultShaderAssembler(t){return Xn(t===`glsl`||t===`wgsl`),t===`wgsl`?(e.defaultShaderAssemblers.wgsl=e.defaultShaderAssemblers.wgsl||new za,e.defaultShaderAssemblers.wgsl):(e.defaultShaderAssemblers.glsl=e.defaultShaderAssemblers.glsl||new Ra,e.defaultShaderAssemblers.glsl)}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderHook(e,t){t&&(e=Object.assign(t,{hook:e})),this._hookFunctions.push(e)}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,fr(t),t}},Ra=class extends La{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=this._hookFunctions;return{...oa({...e,vs:e.vs,fs:e.fs,modules:t,hookFunctions:n}),modules:t}}},za=class e extends La{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=this._hookFunctions,i=e.getShaderPreprocessorDefines(t,n),a=t.platformInfo.shaderLanguage===`wgsl`&&t.source?hi(t.source,{defines:i}):t.source,{source:o,getUniforms:s,bindingAssignments:c}=aa({...t,source:a,defines:i,_bindingRegistry:this._wgslBindingRegistry,modules:n,hookFunctions:r}),l=t.platformInfo.shaderLanguage===`wgsl`?hi(o,{defines:i}):o;return{source:l,getUniforms:s,modules:n,bindingAssignments:c,bindingTable:ti(l,c),shaderLayout:se(l,{vertexEntryPoint:t.vertexEntryPoint,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}};function Ba(e,t=!0){return e??t}function Va(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}var Ha={props:{},uniforms:{},bindings:{},name:`skin`,bindingLayout:[{name:`skin`,group:0},{name:`skinJointMatrices`,group:0,visibility:1}],dependencies:[],source:`
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

`,fs:``,defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:n,skinJointMatrices:r,scenegraphsFromGLTF:i,skinIndex:a=0,meshWorldMatrix:o}=e,s=r?{skinJointMatrices:r}:{};if(n)return{jointMatrix:Ua(n),...s};let c=i?.gltf?.skins?.[a];if(!c)return{jointMatrix:[],...s};let{inverseBindMatrices:l,joints:u,skeleton:d}=c,f=i.gltfNodeIndexToNodeMap,p=new Map,m=d===void 0?void 0:f?.get(d),h=m?[m]:i.scenes||[];for(let e of h)e.preorderTraversal((e,{worldMatrix:t})=>{p.set(e.id,t)});let g=o?new P(o).invert():null,_=new Float32Array(1024),v=l?.value;for(let e=0;e<Math.min(u.length,64);e++){let t=f?.get(u[e]);if(!t)continue;let n=p.get(t.id)||t.matrix,r=g?new P(g).multiplyRight(n):new P(n);v&&v.length>=(e+1)*16&&r.multiplyRight(new P(Array.from(v.slice(e*16,(e+1)*16)))),_.set(r,e*16)}return{jointMatrix:_,...s}},uniformTypes:{jointMatrix:[`mat4x4<f32>`,64]}};function Ua(e){let t=new Float32Array(1024);return t.set(e instanceof Float32Array?e.subarray(0,t.length):e.slice(0,t.length)),t}var Wa=`precision highp int;

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
`,Ka=5,qa={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},Ka]},defaultUniforms:Qa(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:Ga,vs:Wa,fs:Wa,getUniforms:Ja};function Ja(e,t={}){if(e&&={...e},!e)return Qa();e.lights&&(e={...e,...Xa(e.lights),lights:void 0});let{useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o}=e||{};if(!(r||i&&i.length>0||a&&a.length>0||o&&o.length>0))return{...Qa(),enabled:0};let s={...Qa(),...Ya({useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o})};return e.enabled!==void 0&&(s.enabled=e.enabled?1:0),s}function Ya({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=$a(),o=0,c=0,l=0,u=0;for(let t of n){if(o>=Ka)break;a[o]={...a[o],color:Za(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},o++,c++}for(let t of r){if(o>=Ka)break;a[o]={...a[o],color:Za(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:to(t)},o++,l++}for(let t of i){if(o>=Ka)break;a[o]={...a[o],color:Za(t,e),direction:t.direction},o++,u++}return n.length+r.length+i.length>Ka&&s.warn(`MAX_LIGHTS exceeded, truncating to ${Ka}`)(),{ambientColor:Za(t,e),directionalLightCount:u,pointLightCount:c,spotLightCount:l,lights:a}}function Xa(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function Za(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return Va(n,Ba(t,!0)).map(e=>e*r)}function Qa(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:$a()}}function $a(){return Array.from({length:Ka},()=>eo())}function eo(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function to(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var no=`#ifdef USE_IBL
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
`,io={name:`ibl`,firstBindingSlot:32,bindingLayout:[{name:`pbr_diffuseEnvSampler`,group:2},{name:`pbr_specularEnvSampler`,group:2},{name:`pbr_brdfLUT`,group:2}],source:no,vs:ro,fs:ro},ao=`out vec3 pbr_vPosition;
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
`,oo=`precision highp float;

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

vec4 pbr_filterColor(vec4 vertexColor)
{
  vec2 baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  vec2 metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  vec2 normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  vec2 occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  vec2 emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
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

  if(pbrMaterial.unlit){
    color.rgb = baseColor.rgb;
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
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color / attenuation);
        }
      }
#endif

#ifdef USE_IBL
      if (pbrMaterial.IBLenabled) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
#endif

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
          lighting_getSpotLight(i).color / attenuation,
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
          lighting_getSpotLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
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
`,so=`struct PBRFragmentInputs {
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

fn pbr_filterColor(vertexColor: vec4<f32>) -> vec4<f32> {
  let baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  let metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  let emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
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

  if (pbrMaterial.unlit != 0u) {
    color = baseColor.rgb;
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
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color / attenuation);
        }
      }
      #endif

      #ifdef USE_IBL
      if (pbrMaterial.IBLenabled != 0) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
      #endif

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
          lighting_getSpotLight(i).color / attenuation,
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
          lighting_getSpotLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
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
`,co=`layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,lo={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:`pbrMaterial`,firstBindingSlot:0,bindingLayout:[{name:`pbrMaterial`,group:3},{name:`pbr_baseColorSampler`,group:3},{name:`pbr_normalSampler`,group:3},{name:`pbr_emissiveSampler`,group:3},{name:`pbr_metallicRoughnessSampler`,group:3},{name:`pbr_occlusionSampler`,group:3},{name:`pbr_specularColorSampler`,group:3},{name:`pbr_specularIntensitySampler`,group:3},{name:`pbr_transmissionSampler`,group:3},{name:`pbr_thicknessSampler`,group:3},{name:`pbr_clearcoatSampler`,group:3},{name:`pbr_clearcoatRoughnessSampler`,group:3},{name:`pbr_clearcoatNormalSampler`,group:3},{name:`pbr_sheenColorSampler`,group:3},{name:`pbr_sheenRoughnessSampler`,group:3},{name:`pbr_iridescenceSampler`,group:3},{name:`pbr_iridescenceThicknessSampler`,group:3},{name:`pbr_anisotropySampler`,group:3},{name:`pbr_bumpSampler`,group:3},{name:`pbr_diffuseTransmissionSampler`,group:3},{name:`pbr_diffuseTransmissionColorSampler`,group:3},{name:`pbr_multiscatterColorSampler`,group:3}],dependencies:[qa,io,{name:`pbrProjection`,bindingLayout:[{name:`pbrProjection`,group:0}],source:`struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,vs:co,fs:co,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:`mat4x4<f32>`,modelMatrix:`mat4x4<f32>`,normalMatrix:`mat4x4<f32>`,camera:`vec3<f32>`}}],source:so,vs:ao,fs:oo,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:`i32`,baseColorMapEnabled:`i32`,baseColorFactor:`vec4<f32>`,normalMapEnabled:`i32`,normalScale:`f32`,emissiveMapEnabled:`i32`,emissiveFactor:`vec3<f32>`,metallicRoughnessValues:`vec2<f32>`,metallicRoughnessMapEnabled:`i32`,occlusionMapEnabled:`i32`,occlusionStrength:`f32`,alphaCutoffEnabled:`i32`,alphaCutoff:`f32`,specularColorFactor:`vec3<f32>`,specularIntensityFactor:`f32`,specularColorMapEnabled:`i32`,specularIntensityMapEnabled:`i32`,ior:`f32`,transmissionFactor:`f32`,transmissionMapEnabled:`i32`,thicknessFactor:`f32`,attenuationDistance:`f32`,attenuationColor:`vec3<f32>`,clearcoatFactor:`f32`,clearcoatRoughnessFactor:`f32`,clearcoatMapEnabled:`i32`,clearcoatRoughnessMapEnabled:`i32`,sheenColorFactor:`vec3<f32>`,sheenRoughnessFactor:`f32`,sheenColorMapEnabled:`i32`,sheenRoughnessMapEnabled:`i32`,iridescenceFactor:`f32`,iridescenceIor:`f32`,iridescenceThicknessRange:`vec2<f32>`,iridescenceMapEnabled:`i32`,anisotropyStrength:`f32`,anisotropyRotation:`f32`,anisotropyDirection:`vec2<f32>`,anisotropyMapEnabled:`i32`,emissiveStrength:`f32`,dispersion:`f32`,IBLenabled:`i32`,scaleIBLAmbient:`vec2<f32>`,scaleDiffBaseMR:`vec4<f32>`,scaleFGDSpec:`vec4<f32>`,baseColorUVSet:`i32`,baseColorUVTransform:`mat3x3<f32>`,metallicRoughnessUVSet:`i32`,metallicRoughnessUVTransform:`mat3x3<f32>`,normalUVSet:`i32`,normalUVTransform:`mat3x3<f32>`,occlusionUVSet:`i32`,occlusionUVTransform:`mat3x3<f32>`,emissiveUVSet:`i32`,emissiveUVTransform:`mat3x3<f32>`,specularColorUVSet:`i32`,specularColorUVTransform:`mat3x3<f32>`,specularIntensityUVSet:`i32`,specularIntensityUVTransform:`mat3x3<f32>`,transmissionUVSet:`i32`,transmissionUVTransform:`mat3x3<f32>`,thicknessUVSet:`i32`,thicknessUVTransform:`mat3x3<f32>`,clearcoatUVSet:`i32`,clearcoatUVTransform:`mat3x3<f32>`,clearcoatRoughnessUVSet:`i32`,clearcoatRoughnessUVTransform:`mat3x3<f32>`,clearcoatNormalUVSet:`i32`,clearcoatNormalUVTransform:`mat3x3<f32>`,sheenColorUVSet:`i32`,sheenColorUVTransform:`mat3x3<f32>`,sheenRoughnessUVSet:`i32`,sheenRoughnessUVTransform:`mat3x3<f32>`,iridescenceUVSet:`i32`,iridescenceUVTransform:`mat3x3<f32>`,iridescenceThicknessUVSet:`i32`,iridescenceThicknessUVTransform:`mat3x3<f32>`,anisotropyUVSet:`i32`,anisotropyUVTransform:`mat3x3<f32>`,bumpFactor:`f32`,bumpMapEnabled:`i32`,diffuseTransmissionFactor:`f32`,diffuseTransmissionMapEnabled:`i32`,diffuseTransmissionColorFactor:`vec3<f32>`,diffuseTransmissionColorMapEnabled:`i32`,multiscatterColorFactor:`vec3<f32>`,multiscatterColorMapEnabled:`i32`,scatterAnisotropy:`f32`,bumpUVSet:`i32`,bumpUVTransform:`mat3x3<f32>`,diffuseTransmissionUVSet:`i32`,diffuseTransmissionUVTransform:`mat3x3<f32>`,diffuseTransmissionColorUVSet:`i32`,diffuseTransmissionColorUVTransform:`mat3x3<f32>`,multiscatterColorUVSet:`i32`,multiscatterColorUVTransform:`mat3x3<f32>`}},uo={NONE:0,REINHARD:1,KHRONOS_PBR_NEUTRAL:2,ACES:3},fo=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],po=`layout(std140) uniform pbrSceneUniforms {
  float exposure;
  int toneMapMode;
  float environmentIntensity;
  float environmentRotation;
  float environmentMipCount;
  int outputEncoding;
  vec2 framebufferSize;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} pbrScene;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
uniform sampler2D pbr_transmissionFramebufferSampler;
#endif
`,mo={name:`pbrScene`,bindingLayout:[{name:`pbrScene`,group:1},{name:`pbr_transmissionFramebufferSampler`,group:1}],source:`struct pbrSceneUniforms {
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
`,vs:po,fs:po,getUniforms:e=>e,uniformTypes:{exposure:`f32`,toneMapMode:`i32`,environmentIntensity:`f32`,environmentRotation:`f32`,environmentMipCount:`f32`,outputEncoding:`i32`,framebufferSize:`vec2<f32>`,viewMatrix:`mat4x4<f32>`,projectionMatrix:`mat4x4<f32>`},defaultUniforms:{exposure:1,toneMapMode:uo.KHRONOS_PBR_NEUTRAL,environmentIntensity:1,environmentRotation:Math.PI*.5,environmentMipCount:1,outputEncoding:1,framebufferSize:[1,1],viewMatrix:fo,projectionMatrix:fo}},ho=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||N(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&n.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function go(e,t){if(t instanceof ho)return t;let n=Kt(t),r=_o(e,n),{attributes:i,bufferLayout:a}=vo(e,n);return new ho({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function _o(e,t){if(!t.indices)return;let r=t.indices.value;return e.createBuffer({usage:n.INDEX,data:r})}function vo(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout.find(e=>e.name===r)?.name||Ut(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout,vertexCount:t.vertexCount}}function yo(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var bo=`__debugFramebufferState`,xo=8;function So(e,t,n){if(e.device.type!==`webgl`)return;let r=To(e.device);if(!r.flushing){if(Do(e)){Co(e,n,r);return}t&&Eo(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function Co(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=Oo(t.top,xo),l=Oo(t.left,xo);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=wo({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+xo}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function wo(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function To(e){return e.userData[bo]||={flushing:!1,queuedFramebuffers:[]},e.userData[bo]}function Eo(e){return`colorAttachments`in e}function Do(e){let t=e.props.framebuffer;return!t||t.handle===null}function Oo(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function ko(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!ko(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=Object.keys(e),i=Object.keys(t);if(r.length!==i.length)return!1;for(let i of r)if(!t.hasOwnProperty(i)||!ko(e[i],t[i],n-1))return!1;return!0}return!1}var Ao=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return T(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function jo(e,t){let n=y(e),r=t.slice();return r.sort((e,t)=>C(T(e).map(e=>n[e]))-C(T(t).map(e=>n[e]))),r}function Mo(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of Io(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function No(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?zo(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:Ro(e.bindings,t.bindings)}:e:t}function Po(e){return!!(e.uniformTypes&&!Lo(e.uniformTypes))}function Fo(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function Io(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function Lo(e){for(let t in e)return!1;return!0}function Ro(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function zo(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}function Bo(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Vo(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:!1}function Ho(e){return Bo(e)||Vo(e)}function Uo(e){return Ho(e)||typeof e==`number`||typeof e==`boolean`}function Wo(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||Uo(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var Go=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=gr(Object.values(e).filter(Zo));for(let t of n)e[t.name]=t;s.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&s.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},i=this.modules[n];if(!i)this.options.disableWarnings||s.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:a,bindings:o}=Wo(i.getUniforms?.(r,e)||r,i.uniformTypes);this.moduleUniforms[n]=Ko(e,a,i.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=gr(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=Ko({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function Ko(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=qo(e[i],a,n[i]));return r}function qo(e,t,n){if(!n||typeof n==`string`)return Jo(t);if(Array.isArray(n)){if(Yo(t)||!Array.isArray(t))return Jo(t);let r=Array.isArray(e)&&!Yo(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=qo(r[e],a,n[0]))}return i}if(!Xo(t))return Jo(t);let r=n,i=Xo(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=qo(i[e],n,r[e]));return a}function Jo(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?Yo(e)?e.slice():e.map(e=>e===void 0?void 0:Jo(e)):Xo(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:Jo(t)])):e}function Yo(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function Xo(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Zo(e){return!!e?.dependencies}var Qo=n.DEBUG_DATA_MAX_LENGTH,F=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:r=!1,buffer:i,ownsBuffer:a=!0,...o}=t;if(i&&i.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(i&&(o.byteLength!==void 0||o.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let s=t.id||i?.id||N(`dynamic-buffer`),c={...o,id:s,usage:o.usage??i?.usage,indexType:o.indexType??i?.indexType};(c.usage||0)&n.INDEX&&!c.indexType&&(o.data instanceof Uint32Array?c.indexType=`uint32`:o.data instanceof Uint16Array?c.indexType=`uint16`:o.data instanceof Uint8Array&&(c.indexType=`uint8`)),delete c.data,delete c.byteOffset,this.device=e,this.id=s,this.props=c,this.usage=c.usage||0,this._debugDataEnabled=!!r,this._maxDebugDataByteLength=typeof r==`object`&&r.maxByteLength!==void 0?r.maxByteLength:Qo,this._ownsBuffer=a,this._buffer=i??this.device.createBuffer({...o,id:s}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),o.data&&this._writeDebugData(o.data,o.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}};function $o(e){return typeof e==`object`&&!!e&&`buffer`in e}function es(e){return e instanceof F?e:$o(e)&&e.buffer instanceof F?e.buffer:null}function ts(e){return e instanceof F?e.buffer:e}function ns(e){return{buffer:ts(e.buffer),offset:e.offset,size:e.size}}function rs(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function is(e){return e?.type===`texture`||e?.type===`external-texture`}function as(e,t,n){let r=E(e,t,{ignoreWarnings:!0});return is(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var os=2,ss=1e4,cs=`render pipeline initialization failed`,ls=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],us=class e{static defaultProps={...g.defaultProps,source:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],geometry:null,indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,material:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:La.getDefaultShaderAssembler(`glsl`),debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;material=null;_uniformStore;_attributeInfos={};_gpuGeometry=null;props;_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_lastDrawTimestamp=-1;_bindingTable=[];get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){let r=e.defaultProps.shaderAssembler;this.props={...e.defaultProps,...n,shaderAssembler:n.shaderAssembler??(ds(r,t.info.shadingLanguage)?r:La.getDefaultShaderAssembler(t.info.shadingLanguage))},n=this.props,this.id=n.id||N(`model`),this.device=t,Object.assign(this.userData,n.userData),this.material=n.material||null;let i=_s(t),a=yr(this.props.plugins,i.shaderLanguage),o=br(this.props.modules,a.modules),s=Object.fromEntries(o.map(e=>[e.name,e])),c=n.shaderInputs||new Go(s,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&a.modules.length>0&&c.addModules(a.modules),this.setShaderInputs(c);let l=Fo(this.props.modules,c.getModules()),u={...a.defines,...this.props.defines};if(this.props.shaderLayout=Mo(this.props.shaderLayout,l)||null,this.device.type===`webgpu`&&this.props.source){let e=this.props.shaderAssembler;p(ds(e,`wgsl`));let{source:n,getUniforms:r,bindingTable:o,shaderLayout:s}=e.assembleWGSLShader({platformInfo:i,...this.props,modules:l,defines:u,pluginInjections:a.injections,pluginVertexInputs:a.vertexInputs,pluginVaryings:a.varyings});this.source=n,this._getModuleUniforms=r,this._bindingTable=o;let c=fs(s??t.getShaderLayout?.(this.source),a.vertexInputs),d=No(this.props.shaderLayout,c,Object.keys(a.vertexInputs));this.props.shaderLayout=Mo(d||null,l)||null}else{let e=this.props.shaderAssembler;p(ds(e,`glsl`));let{vs:t,fs:n,getUniforms:r}=e.assembleGLSLShaderPair({platformInfo:i,...this.props,modules:l,defines:u,pluginInjections:a.injections,pluginVertexInputs:a.vertexInputs,pluginVaryings:a.varyings});this.vs=t,this.fs=n,this._getModuleUniforms=r,this._bindingTable=[]}this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,n.geometry&&this.setGeometry(n.geometry),this.pipelineFactory=n.pipelineFactory||at.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||ot.getDefaultShaderFactory(this.device),this.pipeline=this._updatePipeline(),this.vertexArray=t.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._gpuGeometry&&this._setGeometryAttributes(this._gpuGeometry),`isInstanced`in n&&(this.isInstanced=n.isInstanced),n.instanceCount&&this.setInstanceCount(n.instanceCount),n.vertexCount&&this.setVertexCount(n.vertexCount),n.indexBuffer&&this.setIndexBuffer(n.indexBuffer),n.attributes&&this.setAttributes(n.attributes),n.constantAttributes&&this.setConstantAttributes(n.constantAttributes),n.bindings&&this.setBindings(n.bindings),n.transformFeedback&&(this.transformFeedback=n.transformFeedback)}destroy(){this._destroyed||=(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs),this._uniformStore.destroy(),this._gpuGeometry?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.material?.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e){if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return s.info(os,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return s.info(os,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this.material?.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)s.info(os,`>>> DRAWING ABORTED ${this.id}: ${cs}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)s.info(os,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??a.byteLength/(a.indexType===`uint32`?4:2):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0?!0:e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=cs,this._drawBlockedReason=cs):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){this._gpuGeometry?.destroy();let t=e&&go(this.device,e);t&&(this.setTopology(t.topology||`triangle-list`),this.bufferLayout=new Ao(this.bufferLayout).mergeBufferLayouts(t.bufferLayout,this.bufferLayout),this.vertexArray&&this._setGeometryAttributes(t)),this._gpuGeometry=t}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){let t=new Ao(this.bufferLayout),n=this._gpuGeometry?t.mergeBufferLayouts(e,this._gpuGeometry.bufferLayout):e;ko(n,this.bufferLayout,-1)||(this.bufferLayout=n,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline(),this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._gpuGeometry&&this._setGeometryAttributes(this._gpuGeometry))}setParameters(e){ko(e,this.parameters,2)||(this.parameters=e,this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new kt(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Po(t)&&!this.material?.ownsModule(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getNonMaterialBindings(this.shaderInputs.getBindingValues())),this.setNeedsRedraw(`shaderInputs`)}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){let t=e instanceof F?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof F?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&s.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=jo(this.pipeline.shaderLayout,this.bufferLayout);let r=new Ao(this.bufferLayout);for(let[t,i]of Object.entries(e)){let e=i instanceof F?i.buffer:i,a=r.getBufferLayout(t);if(!a){n||s.warn(`Model(${this.id}): Missing layout for buffer "${t}".`)();continue}let o=r.getAttributeNamesForBuffer(a),c=!1;for(let t of o){let r=this._attributeInfos[t];if(r){let t=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(r.bufferName):r.location;if(t===null){n||s.warn(`Model(${this.id}): Missing vertex array slot for buffer "${r.bufferName}".`)();continue}this.vertexArray.setBuffer(t,e),i instanceof F?this._dynamicAttributeBufferSources[t]={source:i,generation:i.generation}:delete this._dynamicAttributeBufferSources[t],c=!0}}!c&&!n&&s.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${t}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||s.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(rs(e)&&!e.isReady)return e.id;for(let e of Object.values(this.material?.bindings||{}))if(rs(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=ps(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=e.bindings.length?h(e,t):{0:t};if(!this.material)return n;for(let[t,r]of Object.entries(this.material.getBindingsByGroup(e))){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let t of Object.values(this.bindings))t instanceof b?e=Math.max(e,t.texture.updateTimestamp):t instanceof n||t instanceof v||t instanceof ee||t instanceof F?e=Math.max(e,t.updateTimestamp):rs(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:$o(t)&&(e=Math.max(e,(t.buffer instanceof F,t.buffer.updateTimestamp)));return Math.max(e,this.material?.getBindingsUpdateTimestamp()||0)}_setGeometryAttributes(e){let t={...e.attributes};for(let[e]of Object.entries(t))!this.pipeline.shaderLayout.attributes.find(t=>t.name===e)&&e!==`positions`&&delete t[e];this.vertexCount=e.vertexCount,this.setIndexBuffer(e.indices||null),this.setAttributes(e.attributes,{disableWarnings:!0}),this.setAttributes(t,{disableWarnings:this.props.disableWarnings}),this.setNeedsRedraw(`geometry attributes`)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){if(this._pipelineNeedsUpdate){let e=null,t=null;this.pipeline&&(s.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),e=this.pipeline.vs,t=this.pipeline.fs),this._pipelineNeedsUpdate=!1;let n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),r=null;this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.source||this.fs,debugShaders:this.props.debugShaders})),this.pipeline=this.pipelineFactory.createRenderPipeline({...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r}),this._attributeInfos=fe(this.pipeline.shaderLayout,this.bufferLayout),e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=s.level>3?0:ss;s.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,s.group(os,`>>> DRAWING MODEL ${this.id}`,{collapsed:s.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=yo(this.pipeline.shaderLayout,this.id);s.table(os,e)();let t=this.shaderInputs.getDebugTable();s.table(os,t)();let n=this._getAttributeDebugTable();s.table(os,this._attributeInfos)(),s.table(os,n)(),s.groupEnd(os)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;So(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let r=i.getTypedArrayConstructor(t);return(e instanceof n?new r(e.debugData):e).toString()}_getNonMaterialBindings(e){if(!this.material)return e;let t={};for(let[n,r]of Object.entries(e))this.material.ownsBinding(n)||(t[n]=r);return t}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>ms(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??hs(t?.depthStencilAttachment?.texture?.format);(!ko(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function ds(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function fs(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function ps(e,t,n){if(rs(t)){let r=as(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof F?t.buffer:$o(t)?ns(t):t}function ms(e){return e&&!gs(e)?e:null}function hs(e){return e&&gs(e)?e:void 0}function gs(e){return ls.includes(e)}function _s(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var vs=class{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let n=new Go(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=bs(n),this._materialModuleNames=xs(n)}createMaterial(e={}){return new Ss(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=ys(e);return t?this._materialModuleNames.has(t):!1}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{3:e}:{}}};function ys(e){return e.endsWith(`Uniforms`)?e.slice(0,-8):null}function bs(e){let t=new Set;for(let n of Object.values(e.modules))for(let e of n.bindingLayout||[])e.group===3&&t.add(e.name);return t}function xs(e){let t=new Set;for(let n of Object.values(e.modules))n.name&&n.bindingLayout?.some(e=>e.group===3&&e.name===n.name)&&t.add(n.name);return t}var Ss=class{id;device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||N(`material`),this.device=e,this.factory=t.factory||new vs(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let n=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));this.shaderInputs=t.shaderInputs||new Go(n),this._uniformStore=new kt(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(this.ownsModule(e)&&Po(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,n]of Object.entries(this.bindings))ys(t)||(e[t]=n);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={},n=t;for(let[t,r]of Object.entries(this.bindings))if(rs(r)){let i=as(e,t,{fallbackGroup:3}),a=i?r.resolveTextureBinding(i):null;a&&(n[t]=a)}else r instanceof F?n[t]=r.buffer:$o(r)?n[t]=ns(r):n[t]=r;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===3?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof b?e=Math.max(e,t.texture.updateTimestamp):t instanceof n||t instanceof v||t instanceof ee||t instanceof F?e=Math.max(e,t.updateTimestamp):rs(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:$o(t)&&(e=Math.max(e,(t.buffer instanceof F,t.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[n,r]of Object.entries(e))r!==void 0&&this.ownsBinding(n)&&this.bindings[n]!==r&&(this.bindings[n]=r,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[n,r]of Object.entries(this.bindings)){let i=Cs(r);i!==null&&(e[n]=i,this._dynamicResourceGenerations[n]!==i&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}};function Cs(e){return rs(e)?e.generation:es(e)?.generation??null}var ws=`struct VertexInputs {
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
`,Ts=`#version 300 es
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
`,Es=[-1,-1,1,-1,-1,1,1,1],Ds=class extends us{constructor(e,t){let n=Es.map(e=>e===-1?0:e);t.source&&(t={...t,source:`${ws}\n${t.source}`}),super(e,{id:t.id||N(`clip-space`),...t,vs:Ts,vertexCount:4,geometry:new Ht({topology:`triangle-strip`,vertexCount:4,attributes:{clipSpacePositions:{size:2,value:new Float32Array(Es)},texCoords:{size:2,value:new Float32Array(n)},coordinates:{size:2,value:new Float32Array(n)}}})})}},Os={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function ks(e){return e?Array.isArray(e)?e[0]??null:e:null}function As(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=ks(n);if(!e)return null;let{width:t}=js(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=ks(n);return e?js(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=ks(n[0]);return e?js(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=ks(t);return r?js(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=ks(e[t]);return r?js(r):null}default:return null}}function js(e){if(D(e))return r(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function Ms(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function Ns(e){return ArrayBuffer.isView(e)}function Ps(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function Fs(e){let t=Os[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function Is(e,t){return 6*e+Fs(t)}function Ls(e){throw Error(`setTexture1DData not supported in WebGL.`)}function Rs(e){return Array.isArray(e)?e:[e]}function zs(e,t,n,r){let i=Rs(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(D(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(Ms(t))o.push({type:`texture-data`,data:t,textureFormat:Ps(t),z:a,mipLevel:e});else if(Ns(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function Bs(e){let t=[];for(let n=0;n<e.length;n++)t.push(...zs(n,e[n]));return t}function Vs(e){let t=[];for(let n=0;n<e.length;n++)t.push(...zs(n,e[n]));return t}function Hs(e){let t=[];for(let[n,r]of Object.entries(e)){let e=Fs(n);t.push(...zs(e,r))}return t}function Us(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=Is(n,r);t.push(...zs(e,i))}}),t}var Ws=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=N(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?Gs({...t,width:e.width,height:e.height,format:e.format}):[],r=`format`in e&&e.format!==void 0,i=`usage`in e&&e.usage!==void 0,a=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:As(t)||{width:this.props.width||1,height:this.props.height||1};if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let o=Ks(this.device,n,a,{format:r?e.format:void 0}),c=o.format??this.props.format,l={...this.props,...a,format:c,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(c)&&!i&&(l.usage=v.SAMPLE|v.COPY_DST);let u=this.props.mipmaps&&!o.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(c);if(this.device.type===`webgpu`&&u){let e=this.props.dimension===`3d`?v.SAMPLE|v.STORAGE|v.COPY_DST|v.COPY_SRC:v.SAMPLE|v.RENDER|v.COPY_DST|v.COPY_SRC;l.usage|=e}let d=this.device.getMipLevelCount(l.width,l.height),f=o.hasExplicitMipChain?o.mipLevels:this.props.mipLevels===`auto`?d:Math.max(1,Math.min(d,this.props.mipLevels??1)),p={...l,mipLevels:f};this._texture=this.device.createTexture(p),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),o.subresources.length&&this._setTextureSubresources(o.subresources),this.props.mipmaps&&!o.hasExplicitMipChain&&!u&&s.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),u&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),s.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):s.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof _?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,r=e.height??this.texture.height,i=e.depthOrArrayLayers??this.texture.depth,a=this.texture.computeMemoryLayout({width:t,height:r,depthOrArrayLayers:i}),o=this.device.createBuffer({byteLength:a.byteLength,usage:n.COPY_DST|n.MAP_READ});this.texture.readBuffer({...e,width:t,height:r,depthOrArrayLayers:i},o);let s=this.device.createFence();return await s.signaled,s.destroy(),o}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),s.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=Os[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=Ls(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=zs(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=Bs(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=Vs(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=Hs(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=Us(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await Xs(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&s.warn(`${this} already destroyed`)}_checkReady(){this.isReady||s.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...v.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function Gs(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return Ls(e.data);case`2d`:return zs(0,e.data,t,n);case`3d`:return Bs(e.data);case`2d-array`:return Vs(e.data);case`cube`:return Hs(e.data);case`cube-array`:return Us(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function Ks(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=Js(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=qs(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?Ys(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=Js(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=qs(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function qs(e){if(e.type===`texture-data`)return e.textureFormat??Ps(e.data)}function Js(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function Ys(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function Xs(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(Xs));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(Xs)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}var Zs={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Qs=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
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
`,$s=`#version 300 es
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
`,ec=class extends Ds{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:Qs,fs:$s,modules:[...t.modules||[],Zs],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof Ws?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:this.flipY?1:0}})}},tc=class extends Ht{constructor(e={}){let{id:t=N(`sphere-geometry`)}=e,{indices:n,attributes:r}=nc(e);super({...e,id:t,topology:`triangle-list`,indices:n,attributes:{...r,...e.attributes}})}};function nc(e){let{nlat:t=10,nlong:n=10}=e,r=Math.PI-0,i=2*Math.PI-0,a=(t+1)*(n+1),o=(t,n,r,i,a)=>e.radius||1,s=new Float32Array(a*3),c=new Float32Array(a*3),l=new Float32Array(a*2),u=new(a>65535?Uint32Array:Uint16Array)(t*n*6);for(let e=0;e<=t;e++)for(let a=0;a<=n;a++){let u=a/n,d=e/t,f=a+e*(n+1),p=f*2,m=f*3,h=i*u,g=r*d,_=Math.sin(h),v=Math.cos(h),y=Math.sin(g),b=Math.cos(g),x=v*y,S=b,C=_*y,w=o(x,S,C,u,d);s[m+0]=w*x,s[m+1]=w*S,s[m+2]=w*C,c[m+0]=x,c[m+1]=S,c[m+2]=C,l[p+0]=u,l[p+1]=1-d}let d=n+1;for(let e=0;e<n;e++)for(let n=0;n<t;n++){let r=(e*t+n)*6;u[r+0]=n*d+e,u[r+1]=n*d+e+1,u[r+2]=(n+1)*d+e,u[r+3]=(n+1)*d+e,u[r+4]=n*d+e+1,u[r+5]=(n+1)*d+e+1}return{indices:{size:1,value:u},attributes:{POSITION:{size:3,value:s},NORMAL:{size:3,value:c},TEXCOORD_0:{size:2,value:l}}}}var rc={x:[2,0,1],y:[0,1,2],z:[1,2,0]},ic=class extends Ht{constructor(e={}){let{id:t=N(`truncated-code-geometry`)}=e,{indices:n,attributes:r}=ac(e);super({...e,id:t,topology:`triangle-list`,indices:n,attributes:{POSITION:{size:3,value:r.POSITION},NORMAL:{size:3,value:r.NORMAL},TEXCOORD_0:{size:2,value:r.TEXCOORD_0},...e.attributes}})}};function ac(e={}){let{bottomRadius:t=0,topRadius:n=0,height:r=1,nradial:i=10,nvertical:a=10,verticalAxis:o=`y`,topCap:s=!1,bottomCap:c=!1}=e,l=(s?2:0)+(c?2:0),u=(i+1)*(a+1+l),d=Math.atan2(t-n,r),f=Math.sin,p=Math.cos,m=Math.PI,h=p(d),g=f(d),_=s?-2:0,v=a+(c?2:0),y=i+1,b=new Uint16Array(i*(a+l)*6),x=rc[o],S=new Float32Array(u*3),C=new Float32Array(u*3),w=new Float32Array(u*2),T=0,E=0;for(let e=_;e<=v;e++){let o=e/a,s=r*o,c;e<0?(s=0,o=1,c=t):e>a?(s=r,o=1,c=n):c=t+(n-t)*(e/a),(e===-2||e===a+2)&&(c=0,o=0),s-=r/2;for(let t=0;t<y;t++){let n=f(t*m*2/i),r=p(t*m*2/i);S[T+x[0]]=n*c,S[T+x[1]]=s,S[T+x[2]]=r*c,C[T+x[0]]=e<0||e>a?0:n*h,C[T+x[1]]=e<0?-1:e>a?1:g,C[T+x[2]]=e<0||e>a?0:r*h,w[E+0]=t/i,w[E+1]=o,E+=2,T+=3}}for(let e=0;e<a+l;e++)for(let t=0;t<i;t++){let n=(e*i+t)*6;b[n+0]=y*(e+0)+0+t,b[n+1]=y*(e+0)+1+t,b[n+2]=y*(e+1)+1+t,b[n+3]=y*(e+0)+0+t,b[n+4]=y*(e+1)+1+t,b[n+5]=y*(e+1)+0+t}return{indices:b,attributes:{POSITION:S,NORMAL:C,TEXCOORD_0:w}}}var oc=class extends ic{constructor(e={}){let{id:t=N(`cone-geometry`),radius:n=1,cap:r=!0}=e;super({...e,id:t,topRadius:0,topCap:!!r,bottomCap:!!r,bottomRadius:n})}};function sc(e,t){if(!e)throw Error(t)}var cc=class{id;matrix=new P;display=!0;position=new me;rotation=new me;scale=new me(1,1,1);userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||N(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return sc(e.length===3,`setPosition requires vector argument`),this.position=e,this}setRotation(e){return sc(e.length===3||e.length===4,`setRotation requires vector argument`),this.rotation=e,this}setScale(e){return sc(e.length===3,`setScale requires vector argument`),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:n,scale:r,update:i=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),r&&this.setScale(r),i&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),this.rotation.length===4){let e=new P().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:n}={}){return e&&this.setPosition(e),t&&this.setRotation(t),n&&this.setScale(n),this.updateMatrix(),this}getCoordinateUniforms(e,t){t||=this.matrix;let n=new P(e).multiplyRight(t),r=n.invert(),i=r.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:r,worldInverseTransposeMatrix:i}}_setScenegraphNodeProps(e){e.display!==void 0&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}};function lc(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function uc(e,t,n){let r=new P(n);for(let n=0;n<8;n++){let i=new me(t[n&1?1:0][0],t[n&2?1:0][1],t[n&4?1:0][2]);r.transformAsPoint(i,i);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],i[t]),e[1][t]=Math.max(e[1][t],i[t])}}function dc(e){return Number.isFinite(e[0][0])}var fc=class e extends cc{children;constructor(e={}){e=Array.isArray(e)?{children:e}:e;let{children:t=[]}=e;s.assert(t.every(e=>e instanceof cc),`every child must an instance of ScenegraphNode`),super(e),this.children=t}getBounds(){let e=lc();return this.traverse((t,{worldMatrix:n})=>{let r=t.getBounds();r&&uc(e,r,new P(n).multiplyRight(t.matrix))}),dc(e)?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,n=t.indexOf(e);return n>-1&&t.splice(n,1),this}removeAll(){return this.children=[],this}traverse(t,{worldMatrix:n=new P}={}){if(!this.display)return;let r=new P(n).multiplyRight(this.matrix);for(let n of this.children)n.display&&(n instanceof e?n.traverse(t,{worldMatrix:r}):t(n,{worldMatrix:r}))}traverseDepthSorted(e,{viewMatrix:t,worldMatrix:n=new P,order:r=`back-to-front`}){let i=new P(t),a=[];this.traverse((e,t)=>{let n=e.getBounds(),r=n?new me(n[0]).add(n[1]).divide([2,2,2]):new me,o=new P(t.worldMatrix).multiplyRight(e.matrix);o.transformAsPoint(r,r),i.transformAsPoint(r,r),a.push({node:e,context:{worldMatrix:o,bounds:n,depth:-r[2]},index:a.length})},{worldMatrix:new P(n)});let o=r===`back-to-front`?-1:1;a.sort((e,t)=>o*(e.context.depth-t.context.depth)||e.index-t.index);for(let{node:t,context:n}of a)e(t,n)}preorderTraversal(t,{worldMatrix:n=new P}={}){let r=new P(n).multiplyRight(this.matrix);t(this,{worldMatrix:r});for(let n of this.children)n instanceof e?n.preorderTraversal(t,{worldMatrix:r}):t(n,{worldMatrix:r})}},pc=class extends ic{constructor(e={}){let{id:t=N(`cylinder-geometry`),radius:n=1}=e;super({...e,id:t,bottomRadius:n,topRadius:n})}},mc=class extends Ht{constructor(e={}){let{id:t=N(`plane-geometry`)}=e,{indices:n,attributes:r}=hc(e);super({...e,id:t,topology:`triangle-list`,indices:n,attributes:{...r,...e.attributes}})}};function hc(e){let{type:t=`x,y`,offset:n=0,flipCull:r=!1,unpack:i=!1}=e,a=t.split(`,`),o=e[`${a[0]}len`]||1,s=e[`${a[1]}len`]||1,c=e[`n${a[0]}`]||1,l=e[`n${a[1]}`]||1,u=(c+1)*(l+1),d=new Float32Array(u*3),f=new Float32Array(u*3),p=new Float32Array(u*2);r&&(o=-o);let m=0,h=0;for(let e=0;e<=l;e++)for(let i=0;i<=c;i++){let a=i/c,u=e/l;switch(p[m+0]=r?1-a:a,p[m+1]=u,t){case`x,y`:d[h+0]=o*a-o*.5,d[h+1]=s*u-s*.5,d[h+2]=n,f[h+0]=0,f[h+1]=0,f[h+2]=r?1:-1;break;case`x,z`:d[h+0]=o*a-o*.5,d[h+1]=n,d[h+2]=s*u-s*.5,f[h+0]=0,f[h+1]=r?1:-1,f[h+2]=0;break;case`y,z`:d[h+0]=n,d[h+1]=o*a-o*.5,d[h+2]=s*u-s*.5,f[h+0]=r?1:-1,f[h+1]=0,f[h+2]=0;break;default:throw Error(`PlaneGeometry: unknown type`)}m+=2,h+=3}let g=c+1,_=new Uint16Array(c*l*6);for(let e=0;e<l;e++)for(let t=0;t<c;t++){let n=(e*c+t)*6;_[n+0]=(e+0)*g+t,_[n+1]=(e+1)*g+t,_[n+2]=(e+0)*g+t+1,_[n+3]=(e+1)*g+t,_[n+4]=(e+1)*g+t+1,_[n+5]=(e+0)*g+t+1}let v={indices:{size:1,value:_},attributes:{POSITION:{size:3,value:d},NORMAL:{size:3,value:f},TEXCOORD_0:{size:2,value:p}}};return i?Gt(v):v}var gc=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},_c=class extends gc{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:v.SAMPLE|v.RENDER|v.COPY_SRC|v.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:v.SAMPLE|v.RENDER|v.COPY_SRC|v.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),vc(this.current),t.destroy(),this.next=n.clone(e),vc(this.next),n.destroy(),!0}};function vc(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}var yc=2,bc=1e4,I=class e{static defaultProps={...j.defaultProps,id:`unnamed`,handle:void 0,userData:{},source:``,modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:La.getDefaultShaderAssembler(`wgsl`),debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate=`newly created`;_getModuleUniforms;props;_destroyed=!1;constructor(t,n){if(t.type!==`webgpu`)throw Error(`Computation is only supported in WebGPU`);this.props={...e.defaultProps,...n},n=this.props,this.id=n.id||N(`model`),this.device=t,Object.assign(this.userData,n.userData);let r=xc(t),i=yr(this.props.plugins,r.shaderLanguage);if(Object.keys(i.vertexInputs).length>0||Object.keys(i.varyings).length>0)throw Error(`Computation does not support ShaderPlugin vertex inputs or varyings`);let a=br(this.props.modules,i.modules),o=Object.fromEntries(a.map(e=>[e.name,e]));this.shaderInputs=n.shaderInputs||new Go(o),n.shaderInputs&&i.modules.length>0&&this.shaderInputs.addModules(i.modules),this.setShaderInputs(this.shaderInputs);let s=Fo(this.props.modules,this.shaderInputs?.getModules()),c={...i.defines,...this.props.defines};this.props.shaderLayout=Mo(this.props.shaderLayout,s)||null,this.pipelineFactory=n.pipelineFactory||at.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||ot.getDefaultShaderFactory(this.device);let l=this.props.shaderAssembler;p(l instanceof za);let{source:u,getUniforms:d,shaderLayout:f}=l.assembleWGSLShader({platformInfo:r,...this.props,modules:s,defines:c,scanVertexAttributes:!1,pluginInjections:i.injections});this.source=u,this._getModuleUniforms=d;let m=f??t.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=Mo(this.props.shaderLayout||m||null,s)||null,this.pipeline=this._updatePipeline(),n.bindings&&this.setBindings(n.bindings)}destroy(){this._destroyed||=(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._uniformStore.destroy(),!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new kt(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Po(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(e=>{let n=t[e];return!Ho(n)&&typeof n!=`number`&&typeof n!=`boolean`}),r={};for(let e of n)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){if(this._pipelineNeedsUpdate){let e=null;this.pipeline&&(s.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),e=this.shader),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`compute`,source:this.source,debugShaders:this.props.debugShaders}),this.pipeline=this.pipelineFactory.createComputePipeline({...this.props,shader:this.shader}),e&&this.shaderFactory.release(e)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=s.level>3?0:bc;s.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,s.group(yc,`>>> DRAWING MODEL ${this.id}`,{collapsed:s.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();s.table(yc,e)(),s.groupEnd(yc)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let r=i.getTypedArrayConstructor(t);return(e instanceof n?new r(e.debugData):e).toString()}};function xc(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}function Sc(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?Cc(e):Tc(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?wc(n):Ec(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function Cc(e){return`\
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
`}function wc(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function Tc(e){return`\
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
`}function Ec(e){return`\
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
`}var Dc={name:`textureTransform`,source:`
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
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Oc=new Set([`original`,`previous`]),kc=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(e,t){this.device=e;let n=Nc(t.shaderPasses);n.map(e=>pr(e));let r=n.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=t.shaderInputs||new Go(r);let i=e.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new _c(e,{colorAttachments:[t.colorFormat||e.preferredColorFormat],width:i[0],height:i[1]}),this.textureModel=new ec(e,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:t.flipY??e.type===`webgpu`});let a=t.flipY??e.type===`webgpu`;this.passRenderers=t.shaderPasses.map(t=>new Ac(e,t,this.shaderInputs,a))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);if(!n)return!1;let r=this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:n}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});return this.textureModel.draw(i),i.end(),!0}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof Ws&&!n.isReady)return null;let r=n instanceof Ws?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=$c(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=Zc(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?Qc(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=Zc(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=Bc(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:el(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},Ac=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,Pc(t)){Lc(t.name,t.renderTargets||{}),this.renderTargets=Vc(e,t.renderTargets||{}),Fc(e,t)&&(this.computeRenderer=new jc(e,t.compute,this.renderTargets,n)),this.subPassExecutions=(this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps).flatMap(e=>this.createStepExecutions(t,e,r));return}Ic(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();Wc(this.renderTargets)}resize(e){Gc(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=Yc(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=Jc(t),n=Yc(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return Ic(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return Rc(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new Mc(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:zc(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?Jc(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},jc=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,t,r,i){this.optimization=t,this.renderTargets=r,this.shaderInputs=i,this.parameterBuffer=e.createBuffer({id:`${t.name}-parameters`,byteLength:Math.max(Math.ceil(t.uniformNames.length/4)*16,16),usage:n.UNIFORM|n.COPY_DST});let a=Object.entries(t.outputs).map(([e,t],n)=>({name:e,type:`storage`,group:0,location:n+2,access:`write-only`,format:r[t].texture.format}));try{this.computation=new I(e,{id:t.name,source:t.source,shaderLayout:{bindings:[{name:t.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...a]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},Mc=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=Sc({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new Ds(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[Dc,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:this.flipY?1:0}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function Nc(e){return e.flatMap(e=>Pc(e)?e.steps.map(e=>e.shaderPass):[e])}function Pc(e){return`steps`in e}function Fc(e,t){let n=t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function Ic(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use ShaderPassPipeline.renderTargets instead`)}function Lc(e,t){for(let n of Object.keys(t))if(Oc.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function Rc(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function zc(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function Bc(e,t,n){return zc(zc(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function Vc(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=Xc(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!Hc(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!Uc(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=Kc(e,i,a,n)}return r}function Hc(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function Uc(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function Wc(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function Gc(e,t,n){for(let r of new Set(Object.values(t))){let t=Xc(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=Kc(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function Kc(e,t,n,r){let i=Xc(r,n.scale),{texture:a,framebuffer:o}=qc(e,t,n,i),s,c;if(n.lifetime===`history`){let r=qc(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function qc(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:v.SAMPLE|v.RENDER|v.COPY_SRC|v.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?v.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function Jc(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function Yc(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function Xc(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function Zc(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function Qc(e,t){return t===e.current?e.next:e.current}function $c(e,t){return Zc(e.current)===t?e.next:e.current}function el(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}var tl=`core-features-and-limits`,nl=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function rl(e){let t={};for(let n of nl){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function il(e){return e.featureLevel??`core`}function al(e){let t=il(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function ol(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(tl)&&r.push(tl);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function sl(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(tl)?`core`:e===`best-available`?`compatibility`:e}var cl=new class extends et{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){if(!navigator.gpu)throw Error(`WebGPU not available. Recent Chrome browsers should work.`);let t=il(e),n=al(e),r=await this.requestGPUAdapter(n);if(!r)throw Error(`Failed to request WebGPU adapter`);let i=r.info||await r.requestAdapterInfo?.(),a={},o=ol(r.features,t,e.optionalFeatures);o.length>0&&(a.requiredFeatures=o),t===`max`&&(a.requiredLimits=rl(r.limits));let c=await r.requestDevice(a),{WebGPUDevice:l}=await He(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-DUDYo4S4.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),u=sl(t,c.features),d={...e,featureLevel:u};s.groupCollapsed(1,`WebGPUDevice created`)();try{let e=new l(d,c,r,i);return s.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),s.table(1,e.info)(),e}finally{s.groupEnd(1)()}}async attach(e){throw Error(`WebGPUAdapter.attach() not implemented`)}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}},ll={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:le.UNSIGNED_INT_24_8},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:le.HALF_FLOAT},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:le.FRAGMENT_SHADER_DERIVATIVE_HINT},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:le.MIN,MAX_EXT:le.MAX},EXT_shader_texture_lod:{}},ul=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:le.COLOR_ATTACHMENT0,COLOR_ATTACHMENT1_WEBGL:le.COLOR_ATTACHMENT1,COLOR_ATTACHMENT2_WEBGL:le.COLOR_ATTACHMENT2,COLOR_ATTACHMENT3_WEBGL:le.COLOR_ATTACHMENT3}),dl=e=>({VERTEX_ARRAY_BINDING_OES:le.VERTEX_ARRAY_BINDING,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),fl=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function pl(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&ml(e),e}return this.originalGetContext(e,t)}}function ml(e){e.getExtension(`EXT_color_buffer_float`);let t={...ll,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:ul(e),OES_vertex_array_object:dl(e),ANGLE_instanced_arrays:fl(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var hl=1,gl=class extends et{type=`webgl`;enforceWebGL2(e){pl(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&e instanceof WebGLRenderingContext&&s.warn(`WebGL1 is not supported`,e)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await He(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-Bfl6Zip7.js`);return{WebGLDevice:e}},__vite__mapDeps([5,1,2,6,3]),import.meta.url);if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!_l(e))throw Error(`Invalid WebGL2RenderingContext`);t=yl(t),await bl(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(e={}){let{WebGLDevice:t}=await He(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-Bfl6Zip7.js`);return{WebGLDevice:e}},__vite__mapDeps([5,1,2,6,3]),import.meta.url);e=yl(e),await bl(e);try{let n=new t(e);s.groupCollapsed(hl,`WebGLDevice ${n.id} created`)();let r=`\
${n._reused?`Reusing`:`Created`} device with WebGL2 ${n.props.debug?`debug `:``}context: \
${n.info.vendor}, ${n.info.renderer} for canvas: ${n.canvasContext.id}`;return s.probe(hl,r)(),s.table(hl,n.info)(),n}finally{s.groupEnd(hl)(),s.info(hl,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function _l(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var vl=new gl;function yl(e){return{...e,debug:e.debug??O.defaultProps.debug,debugWebGL:e.debugWebGL??O.defaultProps.debugWebGL,debugSpectorJS:e.debugSpectorJS??!!s.get(`debug-spectorjs`)}}async function bl(e){let t=[];(e.debugWebGL||e.debug)&&t.push(pe()),e.debugSpectorJS&&t.push(de(e));let n=await Promise.allSettled(t);for(let e of n)e.status===`rejected`&&s.error(`Failed to initialize debug libraries ${e.reason}`)()}var xl=0,L=class{device;type;subtype;id;version=0;pendingParameters;committedParameters={};constructor(e,t,n,r={}){this.device=e,this.type=t,this.subtype=n,this.id=`${t}-${++xl}`,this.pendingParameters={...r},this.commitParameters()}setParameter(e,t){return this.pendingParameters[e]=t,this}setParameters(e){return Object.assign(this.pendingParameters,e),this}unsetParameter(e){return delete this.pendingParameters[e],this}getParameter(e){return this.committedParameters[e]}getParameters(){return this.committedParameters}commitParameters(){let e=this.committedParameters;this.committedParameters={...this.pendingParameters},this.version++;let t=this.type===`instance`&&Reflect.get(e,`group`)!==Reflect.get(this.committedParameters,`group`);return this.device.recordSceneObjectCommit(this.type,this.id,t),this}},R=class extends L{constructor(e,t){super(e,`array`,`array1D`,t)}get data(){return this.getParameter(`data`)}get length(){return this.data.length}},Sl=class extends L{constructor(e,t,n={}){super(e,`geometry`,t,n)}},Cl=class extends L{constructor(e,t,n={}){super(e,`material`,t,n)}},wl=class extends L{constructor(e,t,n){super(e,`sampler`,t,n)}},Tl=class extends L{constructor(e,t){super(e,`surface`,`default`,t)}},El=class extends L{constructor(e,t={}){super(e,`group`,`default`,t)}},Dl=class extends L{constructor(e,t){super(e,`instance`,`transform`,t)}},Ol=class extends L{constructor(e,t={}){super(e,`world`,`default`,t)}},kl=class extends L{constructor(e,t,n={}){super(e,`light`,t,n)}},Al=class extends L{constructor(e,t,n={}){super(e,`camera`,t,n)}},jl=class extends L{constructor(e,t,n={}){super(e,`renderer`,t,n)}},Ml=class extends L{statistics={surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};constructor(e,t){super(e,`frame`,`default`,t)}render(){return this.statistics=this.device.renderFrame(this),this.statistics}destroy(){this.device.destroyFrame(this)}};function Nl(e){return new vs(e,{modules:[lo]})}function Pl(e,t={}){let n=t.factory||Nl(e),r={};for(let[e,i]of Object.entries(t.bindings||{}))i&&n.ownsBinding(e)&&(r[e]=i);let i=n.createMaterial({id:t.id,bindings:r});return i.setProps({pbrMaterial:{...Fl(r),...t.uniforms}}),i}function Fl(e){return{baseColorMapEnabled:!!e.pbr_baseColorSampler,normalMapEnabled:!!e.pbr_normalSampler,emissiveMapEnabled:!!e.pbr_emissiveSampler,metallicRoughnessMapEnabled:!!e.pbr_metallicRoughnessSampler,occlusionMapEnabled:!!e.pbr_occlusionSampler,specularColorMapEnabled:!!e.pbr_specularColorSampler,specularIntensityMapEnabled:!!e.pbr_specularIntensitySampler,transmissionMapEnabled:!!e.pbr_transmissionSampler,clearcoatMapEnabled:!!e.pbr_clearcoatSampler,clearcoatRoughnessMapEnabled:!!e.pbr_clearcoatRoughnessSampler,sheenColorMapEnabled:!!e.pbr_sheenColorSampler,sheenRoughnessMapEnabled:!!e.pbr_sheenRoughnessSampler,iridescenceMapEnabled:!!e.pbr_iridescenceSampler,anisotropyMapEnabled:!!e.pbr_anisotropySampler,bumpMapEnabled:!!e.pbr_bumpSampler,diffuseTransmissionMapEnabled:!!e.pbr_diffuseTransmissionSampler,diffuseTransmissionColorMapEnabled:!!e.pbr_diffuseTransmissionColorSampler,multiscatterColorMapEnabled:!!e.pbr_multiscatterColorSampler}}var Il=`
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
  let instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
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

@fragment
fn fragmentMain(inputs: ScenePBRFragmentInputs) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
#ifdef DEBUG_NORMALS
  return vec4f(normalize(inputs.pbrNormal) * 0.5 + vec3f(0.5), 1.0);
#endif
#ifdef DEBUG_DEPTH
  return vec4f(vec3f(inputs.position.z), 1.0);
#endif
  return pbr_filterColor(inputs.pbrColor);
}
`,Ll=`#version 300 es
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
`,Rl=`#version 300 es
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
`;function zl(e,t){let n=[mo,lo,...t.modules||[]],r=n.filter((e,t)=>n.findIndex(t=>t.name===e.name)===t),i=Bl(t.geometry);return(t.defines?.HAS_SKIN??i.HAS_SKIN)&&!r.some(e=>e.name===Ha.name)&&r.push(Ha),new us(e,{source:Il,vs:Ll,fs:Rl,...t,modules:r,defines:{...i,...Vl(t.material.getResourceBindings()),...t.defines}})}function Bl(e){let t=e&&`attributes`in e?e.attributes:{},n=t.COLOR_0||t.colors;return{HAS_NORMALS:!!(t.NORMAL||t.normals),HAS_TANGENTS:!!(t.TANGENT||t.tangents),HAS_UV:!!(t.TEXCOORD_0||t.texCoords),HAS_UV_1:!!(t.TEXCOORD_1||t.texCoords1),HAS_SKIN:!!(t.JOINTS_0&&t.WEIGHTS_0),HAS_COLORS:!!n,HAS_RGBA_COLORS:!!(n&&`size`in n&&n.size===4)}}function Vl(e){return{HAS_BASECOLORMAP:!!e.pbr_baseColorSampler,HAS_NORMALMAP:!!e.pbr_normalSampler,HAS_EMISSIVEMAP:!!e.pbr_emissiveSampler,HAS_METALROUGHNESSMAP:!!e.pbr_metallicRoughnessSampler,HAS_OCCLUSIONMAP:!!e.pbr_occlusionSampler,HAS_SPECULARCOLORMAP:!!e.pbr_specularColorSampler,HAS_SPECULARINTENSITYMAP:!!e.pbr_specularIntensitySampler,HAS_TRANSMISSIONMAP:!!e.pbr_transmissionSampler,HAS_THICKNESSMAP:!!e.pbr_thicknessSampler,HAS_CLEARCOATMAP:!!e.pbr_clearcoatSampler,HAS_CLEARCOATROUGHNESSMAP:!!e.pbr_clearcoatRoughnessSampler,HAS_CLEARCOATNORMALMAP:!!e.pbr_clearcoatNormalSampler,HAS_SHEENCOLORMAP:!!e.pbr_sheenColorSampler,HAS_SHEENROUGHNESSMAP:!!e.pbr_sheenRoughnessSampler,HAS_IRIDESCENCEMAP:!!e.pbr_iridescenceSampler,HAS_IRIDESCENCETHICKNESSMAP:!!e.pbr_iridescenceThicknessSampler,HAS_ANISOTROPYMAP:!!e.pbr_anisotropySampler,HAS_BUMPMAP:!!e.pbr_bumpSampler,HAS_DIFFUSETRANSMISSIONMAP:!!e.pbr_diffuseTransmissionSampler,HAS_DIFFUSETRANSMISSIONCOLORMAP:!!e.pbr_diffuseTransmissionColorSampler,HAS_MULTISCATTERCOLORMAP:!!e.pbr_multiscatterColorSampler}}var Hl=new P,Ul=class{device;materialFactory;frames=new Map;constructor(e){this.device=e,this.materialFactory=Nl(e)}render(e){let t=this.getTransmissionResources(e),n=e.background||[0,0,0,1];if(t){let r={...e,id:tu(e.id),surfaces:e.surfaces.filter(e=>!$l(e)&&Gl(e.material)!==`BLEND`),framebuffer:t.framebuffer,exposure:1,toneMapMode:uo.NONE,outputColorSpace:`linear`,transmission:!1},i=this.prepareScene(r),a=this.device.beginRenderPass({id:`scene-${e.id}-transmission`,framebuffer:t.framebuffer,clearColor:[n[0],n[1],n[2],n[3]??1],clearDepth:1});this.drawPreparedScene(i,a),a.end()}else this.destroyFrame(tu(e.id));let r=this.prepareScene(e,t?.colorTexture),i=this.device.beginRenderPass({id:`scene-${e.id}`,framebuffer:e.framebuffer,clearColor:su(this.device,e,n),clearDepth:1});return r.statistics.drawCount=this.drawPreparedScene(r,i),i.end(),r.statistics}destroyFrame(e){let t=this.frames.get(e);if(t){for(let e of t.surfaces.values())fu(e);uu(t.transmission),this.frames.delete(e),t.transmission&&this.destroyFrame(tu(e))}}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e)}prepareScene(e,t){let n=this.frames.get(e.id);n||(n={surfaces:new Map},this.frames.set(e.id,n));let r=new Set,i=[],a=0,o=0;for(let s of e.surfaces){if(s.transforms.length===0)continue;let c=$l(s)?t:void 0,l=this.getCompiledSurface(n,s,e,c);Jl(l,s.transforms),eu(s)&&l.model.shaderInputs.setProps({skin:s.skin}),Wl(l,s),l.material.setProps({pbrMaterial:{...Fl(s.material.bindings||{}),...s.material.uniforms,alphaCutoffEnabled:l.alphaMode===`MASK`,IBLenabled:Zl(e.environment)}}),Yl(l.model,e,c),l.model.predraw(this.device.commandEncoder),l.depth=du(s.transforms,e.camera.viewMatrix),r.add(s.id),i.push(l),a+=s.transforms.length,o+=l.triangleCount*s.transforms.length}for(let[e,t]of n.surfaces)r.has(e)||(fu(t),n.surfaces.delete(e));return i.sort((e,t)=>{let n=e.alphaMode===`BLEND`;return n===(t.alphaMode===`BLEND`)?!n&&e.transmissive!==t.transmissive?e.transmissive?1:-1:n?t.depth-e.depth:0:n?1:-1}),{surfaces:i,statistics:{surfaceCount:i.length,instanceCount:a,drawCount:0,triangleCount:o}}}drawPreparedScene(e,t){let n=0;for(let r of e.surfaces)r.model.draw(t)&&n++;return n}getSurfaceModelOptions(e,t){return{}}getCompiledSurface(e,t,r,i){let a=Gl(t.material),o=Kl(t,r,a,i),s=Object.entries(t.material.bindings||{}).filter(([,e])=>!!e),c=e.surfaces.get(t.id);if(c&&(c.source.geometry!==t.geometry||c.signature!==o||!ql(c.textureBindings,s))&&(fu(c),e.surfaces.delete(t.id),c=void 0),!c){let l=Pl(this.device,{id:t.material.id,uniforms:t.material.uniforms,bindings:t.material.bindings,factory:this.materialFactory}),u=[],d=[],f={},p=[];for(let e=0;e<4;e++){let r=new Float32Array(t.transforms.length*4),i=this.device.createBuffer({id:`${t.id}-instance-column-${e}`,data:r,usage:n.VERTEX|n.COPY_DST}),a=`instanceModelMatrixCol${e}`;f[a]=i,p.push({name:a,format:`float32x4`,stepMode:`instance`}),u.push(i),d.push(r)}let m=this.getSurfaceModelOptions(t,r),h=eu(t),g=zl(this.device,{id:`${t.id}-model`,geometry:t.geometry,topology:t.geometry.topology,material:l,attributes:f,bufferLayout:p,instanceCount:t.transforms.length,shaderInputs:new Go({pbrMaterial:lo,pbrScene:mo,...h?{skin:Ha}:{}}),colorAttachmentFormats:r.framebuffer?.colorAttachments.map(e=>e.texture.format),parameters:{cullMode:t.material.doubleSided?`none`:`back`,depthWriteEnabled:a!==`BLEND`,depthCompare:`less-equal`,blend:a===`BLEND`,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`,...m.parameters},...m,defines:{HAS_INSTANCING:!0,USE_LIGHTS:!!r.lights?.length,USE_MATERIAL_EXTENSIONS:!0,ALPHA_CUTOFF:a===`MASK`,USE_IBL:Zl(r.environment),USE_SCENE_ENVIRONMENT:Zl(r.environment),USE_TEX_LOD:Ql(r.environment),USE_TRANSMISSION_FRAMEBUFFER:!!i,USE_SCENE_COLOR_MANAGEMENT:!0,DEBUG_NORMALS:r.renderMode===`debugNormals`,DEBUG_DEPTH:r.renderMode===`debugDepth`,...t.material.defines,...m.defines,HAS_SKIN:h}});c={id:t.id,source:t,material:l,model:g,instanceBuffers:u,instanceColumns:d,signature:o,textureBindings:s,triangleCount:Math.floor((t.geometry.indices?.value.length||t.geometry.vertexCount)/3),alphaMode:a,transmissive:!!i,depth:0},e.surfaces.set(t.id,c)}return c.source=t,c}getTransmissionResources(e){let t=e.transmission!==!1&&(!e.renderMode||e.renderMode===`default`)&&e.surfaces.some($l),n=this.frames.get(e.id);if(!t){n?.transmission&&(uu(n.transmission),n.transmission=void 0);return}n||(n={surfaces:new Map},this.frames.set(e.id,n));let[r,i]=lu(this.device,e);if(n.transmission&&(n.transmission.colorTexture.width!==r||n.transmission.colorTexture.height!==i)&&(uu(n.transmission),n.transmission=void 0),!n.transmission){let t=this.device.createTexture({id:`scene-${e.id}-transmission-color`,width:r,height:i,format:nu(this.device),usage:v.SAMPLE|v.RENDER,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),a=this.device.createTexture({id:`scene-${e.id}-transmission-depth`,width:r,height:i,format:`depth24plus`,usage:v.RENDER}),o=this.device.createFramebuffer({id:`scene-${e.id}-transmission-framebuffer`,width:r,height:i,colorAttachments:[t],depthStencilAttachment:a});n.transmission={colorTexture:t,depthTexture:a,framebuffer:o}}return n.transmission}};function Wl(e,t){if(!t.morphTargets?.length)return;let n=t.morphWeights||[];e.morphWeights?.length===n.length&&e.morphWeights.every((e,t)=>e===n[t])||($t(e.model,t.geometry,t.morphTargets,n),e.morphWeights=[...n])}function Gl(e){return e.alphaMode?e.alphaMode:(e.uniforms?.baseColorFactor?.[3]??1)<1?`BLEND`:`OPAQUE`}function Kl(e,t,n,r){return JSON.stringify({geometryVersion:e.geometryVersion,material:e.material.id,instanceCount:e.transforms.length,alphaMode:n,doubleSided:!!e.material.doubleSided,skin:eu(e),defines:Object.entries(e.material.defines||{}).sort(([e],[t])=>e.localeCompare(t)),environment:Zl(t.environment),lights:!!t.lights?.length,environmentMipmapped:Ql(t.environment),transmission:!!r,transmissionWidth:r?.width,transmissionHeight:r?.height,colorFormat:t.framebuffer?.colorAttachments[0]?.texture.format,renderMode:t.renderMode||`default`})}function ql(e,t){return e.length===t.length?e.every(([e,n])=>t.some(([t,r])=>e===t&&n===r)):!1}function Jl(e,t){for(let n=0;n<t.length;n++){let r=t[n];for(let t=0;t<4;t++)for(let i=0;i<4;i++)e.instanceColumns[t][n*4+i]=r[t*4+i]}for(let t=0;t<4;t++)e.instanceBuffers[t].write(e.instanceColumns[t])}function Yl(e,t,n){let r=new P(t.camera.viewMatrix),i=new P(t.camera.projectionMatrix),a=t.framebuffer?.width||t.width||n?.width||1,o=t.framebuffer?.height||t.height||n?.height||1;e.shaderInputs.setProps({pbrProjection:{modelViewProjectionMatrix:new P(i).multiplyRight(r),modelMatrix:Hl,normalMatrix:Hl,camera:t.camera.position},pbrScene:{exposure:t.exposure??1,toneMapMode:au(e.device,t),environmentIntensity:t.environment?.intensity??1,environmentRotation:t.environment?.rotation??0,environmentMipCount:t.environment?.specularTexture?.mipLevels??1,outputEncoding:ou(e.device,t),framebufferSize:[a,o],viewMatrix:r,projectionMatrix:i,...n?{pbr_transmissionFramebufferSampler:n}:{}},lighting:{lights:Xl(t.lights),useByteColors:!1},...Zl(t.environment)?{ibl:{pbr_diffuseEnvSampler:t.environment.diffuseTexture,pbr_specularEnvSampler:t.environment.specularTexture,pbr_brdfLUT:t.environment.brdfLUTTexture}}:{}})}function Xl(e=[]){let t=e.map(e=>e.type===`directional`?{...e,direction:[-e.direction[0],-e.direction[1],-e.direction[2]]}:e),n=t.filter(e=>e.type===`ambient`);if(n.length<=1)return t;let r=[0,0,0];for(let e of n){let t=e.color??[1,1,1],n=e.intensity??1;r[0]+=t[0]*n,r[1]+=t[1]*n,r[2]+=t[2]*n}return[{type:`ambient`,color:r,intensity:1},...t.filter(e=>e.type!==`ambient`)]}function Zl(e){return!!(e?.diffuseTexture&&e.specularTexture&&e.brdfLUTTexture)}function Ql(e){return Zl(e)&&(e?.specularTexture?.mipLevels??1)>1}function $l(e){return(e.material.uniforms?.transmissionFactor??0)>0}function eu(e){return!!(e.skin?.jointMatrices?.length&&Bl(e.geometry).HAS_SKIN)}function tu(e){return`${e}::linear-transmission-capture`}function nu(e){let t=e.getTextureFormatCapabilities(`rgba16float`);return t.render&&t.filter?`rgba16float`:`rgba8unorm`}function ru(e,t){return t.framebuffer?.colorAttachments[0]?.texture.format||e.preferredColorFormat}function iu(e){return!!(f.getInfo(e).dataType?.startsWith(`float`)||e.endsWith(`ufloat`))}function au(e,t){return t.toneMapMode??(iu(ru(e,t))?uo.NONE:uo.KHRONOS_PBR_NEUTRAL)}function ou(e,t){if(t.outputColorSpace)return t.outputColorSpace===`srgb`?1:0;let n=ru(e,t);return iu(n)||n.endsWith(`-srgb`)?0:1}function su(e,t,n){let r=Math.max(t.exposure??1,0),i=[Math.max(n[0],0)*r,Math.max(n[1],0)*r,Math.max(n[2],0)*r];switch(au(e,t)){case uo.REINHARD:i=i.map(e=>e/(1+e));break;case uo.KHRONOS_PBR_NEUTRAL:i=cu(i);break;case uo.ACES:i=i.map(e=>Math.min(Math.max(e*(2.51*e+.03)/(e*(2.43*e+.59)+.14),0),1));break}return ou(e,t)!==0&&(i=i.map(e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055)),[...i,n[3]??1]}function cu(e){let t=Math.min(...e),n=t<.08?t-6.25*t*t:.04,r=e.map(e=>e-n),i=Math.max(...r),a=.76;if(i<a)return r;let o=1-a,s=1-o*o/(i+o-a),c=s/Math.max(i,1e-4),l=1-1/(.15*(i-s)+1);return r.map(e=>e*c*(1-l)+s*l)}function lu(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function uu(e){e&&(e.framebuffer.destroy(),e.colorTexture.destroy(),e.depthTexture.destroy())}function du(e,t){let n=new P(t),r=0;for(let t of e){let e=n.transformAsPoint([t[12],t[13],t[14]]);r-=e[2]}return r/e.length}function fu(e){e.model.destroy(),e.material.destroy();for(let t of e.instanceBuffers)t.destroy()}var pu=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];function mu(e,t=64){if(!Number.isSafeInteger(t)||t<1)throw Error(`maxLightCount must be a positive safe integer.`);if(e.length>t)throw Error(`Point light count exceeds maxLightCount.`);let n=new Float32Array(t*8);for(let t=0;t<e.length;t++){let r=e[t];if(!(r.range>0)||!(r.intensity>=0))throw Error(`Point light range must be positive and intensity must be non-negative.`);let i=t*8;n.set(r.position,i),n[i+3]=r.range,n.set(r.color,i+4),n[i+7]=r.intensity}return n}var hu={name:`deferredLighting`,source:`const DEFERRED_LIGHTING_PI: f32 = 3.141592653589793;
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
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0},{name:`baseColorMetallicTexture`,group:0},{name:`emissiveOcclusionTexture`,group:0},{name:`pointLights`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,ambientColor:`vec3<f32>`,exposure:`f32`,fogColor:`vec3<f32>`,fogDensity:`f32`,directionalLightDirectionView:`vec3<f32>`,directionalLightColor:`vec3<f32>`,directionalLightIntensity:`f32`,pointLightCount:`u32`},propTypes:{inverseProjectionMatrix:{value:pu,private:!0},ambientColor:{value:[.04,.04,.05],private:!0},exposure:{value:1,min:0,softMax:4},fogColor:{value:[.025,.035,.075],private:!0},fogDensity:{value:0,min:0,softMax:.01},directionalLightDirectionView:{value:[.3,.75,.55],private:!0},directionalLightColor:{value:[1,.95,.86],private:!0},directionalLightIntensity:{value:2.5,min:0,softMax:8},pointLightCount:{value:0,min:0,max:64}},passes:[{sampler:!0}]};function gu(){return{name:`deferredLightingShaderPassPipeline`,steps:[{shaderPass:hu,inputs:{sourceTexture:`previous`},output:`previous`}]}}var _u={minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},vu={minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},yu=new Set([`color`,`normalRoughness`,`velocity`,`depth`]),bu=new Set([`rgba8unorm`,`rgba8unorm-srgb`,`rgba8snorm`,`bgra8unorm`,`bgra8unorm-srgb`,`rgb10a2uint`,`rgb10a2unorm`,`rg11b10ufloat`]),xu=0,Su=class{device;id;props;renderTargets;constructor(e,t){if(e.type!==`webgpu`)throw Error(`GBuffer requires a WebGPU device.`);this.device=e,this.id=t.id||Nu(`g-buffer`),this.props=Cu(this.id,t),wu(e,this.props),this.renderTargets=Au(e,this.props)}get framebuffer(){return this.renderTargets.framebuffer}get colorTexture(){return this.renderTargets.colorTexture}get normalRoughnessTexture(){return this.renderTargets.normalRoughnessTexture}get velocityTexture(){let e=this.renderTargets.velocityTexture;if(!e)throw Error(`GBuffer velocity attachment is disabled.`);return e}get depthTexture(){return this.renderTargets.depthTexture}get width(){return this.renderTargets.framebuffer.width}get height(){return this.renderTargets.framebuffer.height}getShaderPassBindings(){return{depthTexture:this.depthTexture,normalTexture:this.normalRoughnessTexture,velocityTexture:this.velocityTexture}}getExtraColorTexture(e){let t=this.renderTargets.extraColorTextures.get(e);if(!t)throw Error(`GBuffer has no extra color attachment named "`+e+`".`);return t}resize(e){if(Du(e.width,e.height),e.width===this.width&&e.height===this.height)return!1;let t=this.renderTargets;return this.renderTargets=Au(this.device,{...this.props,width:e.width,height:e.height}),Mu(t),!0}destroy(){Mu(this.renderTargets)}};function Cu(e,t){return{id:e,width:t.width,height:t.height,colorFormat:t.colorFormat||`rgba8unorm`,normalRoughnessFormat:t.normalRoughnessFormat||`rgba8unorm`,velocity:t.velocity??!0,velocityFormat:t.velocityFormat||`rg16float`,depthStencilFormat:t.depthStencilFormat||`depth24plus`,extraColorAttachments:t.extraColorAttachments||[]}}function wu(e,t){Du(t.width,t.height);let n=[t.colorFormat,t.normalRoughnessFormat,...t.velocity?[t.velocityFormat]:[],...t.extraColorAttachments.map(e=>e.format)],r=n.length;if(r>e.limits.maxColorAttachments)throw Error(`GBuffer requires `+r+` color attachments, but the device supports `+e.limits.maxColorAttachments+`.`);Ou(e,t.colorFormat,`color`),Ou(e,t.normalRoughnessFormat,`normalRoughness`),t.velocity&&Ou(e,t.velocityFormat,`velocity`),ku(e,t.depthStencilFormat,`depth`);let i=new Set;for(let n of t.extraColorAttachments){if(!n.name)throw Error(`GBuffer extra color attachment name is required.`);if(yu.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is reserved.`);if(i.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is duplicated.`);i.add(n.name),Ou(e,n.format,n.name)}let a=Tu(e,n);if(a>e.limits.maxColorAttachmentBytesPerSample)throw Error(`GBuffer color attachments require `+a+` bytes per sample, but the device supports `+e.limits.maxColorAttachmentBytesPerSample+`.`)}function Tu(e,t){let n=0;for(let r of t){let t=Eu(r);n=Math.ceil(n/t)*t;let i=e.getTextureFormatInfo(r).bytesPerPixel;n+=bu.has(r)?8:i}return n}function Eu(e){return e.startsWith(`r8`)||e.startsWith(`rg8`)||e.startsWith(`rgba8`)||e.startsWith(`bgra8`)?1:e.startsWith(`r16`)||e.startsWith(`rg16`)||e.startsWith(`rgba16`)?2:4}function Du(e,t){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<=0||t<=0)throw Error(`GBuffer size must use positive safe integer dimensions.`)}function Ou(e,t,n){if(!e.getTextureFormatCapabilities(t).render)throw Error(`GBuffer attachment "`+n+`" requires renderable format `+t+`.`)}function ku(e,t,n){if(!e.getTextureFormatCapabilities(t).create)throw Error(`GBuffer attachment "`+n+`" requires supported format `+t+`.`)}function Au(e,t){let n=ju(e,t,`color`,t.colorFormat),r=ju(e,t,`normal-roughness`,t.normalRoughnessFormat),i=t.velocity?ju(e,t,`velocity`,t.velocityFormat):void 0,a=new Map(t.extraColorAttachments.map(n=>[n.name,ju(e,t,n.name,n.format,n.sampler)])),o=e.createTexture({id:t.id+`-depth`,format:t.depthStencilFormat,width:t.width,height:t.height,usage:v.SAMPLE|v.RENDER|v.COPY_DST,sampler:vu});return{framebuffer:e.createFramebuffer({id:t.id+`-framebuffer`,width:t.width,height:t.height,colorAttachments:[n,r,...i?[i]:[],...a.values()],depthStencilAttachment:o}),colorTexture:n,normalRoughnessTexture:r,velocityTexture:i,depthTexture:o,extraColorTextures:a}}function ju(e,t,n,r,i=_u){return e.createTexture({id:t.id+`-`+n,format:r,width:t.width,height:t.height,usage:v.SAMPLE|v.RENDER|v.COPY_DST,sampler:i})}function Mu(e){e.framebuffer.destroy(),e.colorTexture.destroy(),e.normalRoughnessTexture.destroy(),e.velocityTexture?.destroy(),e.depthTexture.destroy();for(let t of e.extraColorTextures.values())t.destroy()}function Nu(e){return xu+=1,e+`-`+xu}var Pu=`
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
`,Fu=[`rgba16float`,`rgba8unorm`,`rgba8unorm`,`rgba16float`];function Iu(e){if(e.renderMode&&e.renderMode!==`default`)return!1;let t=0,n=0;for(let r of e.lights||[])if(r.type===`spot`||r.type===`directional`&&++t>1||r.type===`point`&&++n>64)return!1;return e.environment?.diffuseTexture||e.environment?.specularTexture||e.environment?.brdfLUTTexture?!1:e.surfaces.every(e=>{let t=e.material.uniforms||{},n=e.material.bindings||{};return Gl(e.material)!==`BLEND`&&!t.unlit&&!(t.transmissionFactor&&t.transmissionFactor>0)&&!(t.diffuseTransmissionFactor&&t.diffuseTransmissionFactor>0)&&!(t.multiscatterColorFactor||[]).some(e=>e>0)&&!t.bumpMapEnabled&&!n.pbr_bumpSampler&&!(t.thicknessFactor&&t.thicknessFactor>0)&&!(t.clearcoatFactor&&t.clearcoatFactor>0)&&!(t.iridescenceFactor&&t.iridescenceFactor>0)&&!(t.anisotropyStrength&&t.anisotropyStrength>0)&&!(t.sheenColorFactor||[]).some(e=>e>0)&&(t.ior===void 0||t.ior===1.5)&&(t.specularIntensityFactor===void 0||t.specularIntensityFactor===1)&&(t.specularColorFactor||[1,1,1]).every(e=>e===1)&&!t.specularColorMapEnabled&&!t.specularIntensityMapEnabled&&!n.pbr_specularColorSampler&&!n.pbr_specularIntensitySampler})}var Lu=class extends Ul{buffers=new Map;pointLightBuffer;lightingRenderer;forwardRenderer=null;lastDeferredFrameIdentifiers=new Set;constructor(e){if(e.type!==`webgpu`)throw Error(`Deferred scene rendering requires a WebGPU device.`);super(e),this.pointLightBuffer=e.createBuffer({id:`deferred-scene-point-lights`,data:mu([],64),usage:n.STORAGE|n.COPY_DST}),this.lightingRenderer=new kc(e,{shaderPasses:[gu()],colorFormat:`rgba16float`,flipY:!0})}render(e){if(!Iu(e))return this.lastDeferredFrameIdentifiers.delete(e.id),this.forwardRenderer||=new Ul(this.device),this.forwardRenderer.render(e);let[t,n]=Ru(this.device,e),r=this.getGBuffer(e.id,t,n);this.lastDeferredFrameIdentifiers.add(e.id);let i=this.prepareScene(e),a=e.background||[0,0,0,1],o=this.device.beginRenderPass({id:`scene-${e.id}-deferred-gbuffer`,framebuffer:r.framebuffer,clearColors:[new Float32Array([a[0],a[1],a[2],a[3]??1]),new Float32Array([.5,.5,1,1]),new Float32Array([0,0,0,0]),new Float32Array([0,0,0,0])],clearDepth:1});i.statistics.drawCount=this.drawPreparedScene(i,o),o.end();let s=zu(e.lights||[],new P(e.camera.viewMatrix));this.pointLightBuffer.write(mu(s.pointLights,64)),this.lightingRenderer.resize([t,n]);let c={sourceTexture:r.colorTexture,bindings:{depthTexture:r.depthTexture,normalTexture:r.normalRoughnessTexture,baseColorMetallicTexture:r.getExtraColorTexture(`baseColorMetallic`),emissiveOcclusionTexture:r.getExtraColorTexture(`emissiveOcclusion`),pointLights:this.pointLightBuffer},uniforms:{deferredLighting:{inverseProjectionMatrix:new P(e.camera.projectionMatrix).invert(),ambientColor:s.ambientColor,exposure:e.exposure??1,fogColor:e.fogColor||[0,0,0],fogDensity:e.fogDensity??0,directionalLightDirectionView:s.directionalLightDirectionView,directionalLightColor:s.directionalLightColor,directionalLightIntensity:s.directionalLightIntensity,pointLightCount:s.pointLights.length}}};if(e.framebuffer){let t=this.lightingRenderer.renderToTexture(c);if(t){let n=this.lightingRenderer.textureModel;n.setProps({backgroundTexture:t}),n.predraw(this.device.commandEncoder);let r=this.device.beginRenderPass({id:`scene-${e.id}-deferred-resolve`,framebuffer:e.framebuffer,clearDepth:!1});n.draw(r),r.end()}}else this.lightingRenderer.renderToScreen(c);return i.statistics}getLastDepthTexture(e){return this.lastDeferredFrameIdentifiers.has(e)&&this.buffers.get(e)?.depthTexture||null}destroyFrame(e){super.destroyFrame(e),this.forwardRenderer?.destroyFrame(e),this.buffers.get(e)?.destroy(),this.buffers.delete(e),this.lastDeferredFrameIdentifiers.delete(e)}destroy(){super.destroy(),this.forwardRenderer?.destroy();for(let e of this.buffers.values())e.destroy();this.buffers.clear(),this.lastDeferredFrameIdentifiers.clear(),this.lightingRenderer.destroy(),this.pointLightBuffer.destroy()}getSurfaceModelOptions(e,t){return{source:Pu,colorAttachmentFormats:Fu,depthStencilAttachmentFormat:`depth24plus`}}getGBuffer(e,t,n){let r=this.buffers.get(e);return r?r.resize({width:t,height:n}):(r=new Su(this.device,{id:`scene-${e}-deferred`,width:t,height:n,colorFormat:`rgba16float`,normalRoughnessFormat:`rgba8unorm`,velocity:!1,depthStencilFormat:`depth24plus`,extraColorAttachments:[{name:`baseColorMetallic`,format:`rgba8unorm`},{name:`emissiveOcclusion`,format:`rgba16float`}]}),this.buffers.set(e,r)),r}};function Ru(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function zu(e,t){let n=[0,0,0],r=[0,0,1],i=[1,1,1],a=[],o=0;for(let s of e){let e=Bu(s.color||[1,1,1]),c=s.intensity??1;switch(s.type){case`ambient`:n[0]+=e[0]*c,n[1]+=e[1]*c,n[2]+=e[2]*c;break;case`directional`:{let n=t.transformAsVector(s.direction),a=Math.hypot(n[0],n[1],n[2])||1;r[0]=-n[0]/a,r[1]=-n[1]/a,r[2]=-n[2]/a,i[0]=e[0],i[1]=e[1],i[2]=e[2],o=c;break}case`point`:if(a.length<64){let n=t.transformAsPoint(s.position);a.push({position:[n[0],n[1],n[2]],range:Math.max(4,Math.sqrt(Math.max(c,0))*3),color:e,intensity:c})}break}}return{ambientColor:n,directionalLightDirectionView:r,directionalLightColor:i,directionalLightIntensity:o,pointLights:a}}function Bu(e){let t=e[0]>1||e[1]>1||e[2]>1?1/255:1;return[e[0]*t,e[1]*t,e[2]*t]}var Vu=/^vertex-list<([^<>]+)>$/,Hu=/^value-list<([^<>]+)>$/;function Uu(e){return Vu.test(e)}function Wu(e){return Hu.test(e)}function Gu(e){let t=Vu.exec(e),n=Hu.exec(e),r=t?.[1]??n?.[1]??e;try{a.getVertexFormatInfo(r)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return r}function Ku(e){let t=Gu(e),n=Uu(e),r=Wu(e),i=a.getVertexFormatInfo(t),o=i.type,s=i.normalized,c=qu(o,s);return{format:e,elementFormat:t,vertexList:n,valueList:r,type:o,signedDataType:Ju(t,o),primitiveType:c,components:i.components,byteLength:i.byteLength,integer:i.integer,signed:i.signed,normalized:s,...i.webglOnly?{webglOnly:!0}:{}}}function qu(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function Ju(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function Yu(e){let t=cd(e.nodes),n=pd(t,e.buffers.values()),r=md(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=bd(c.map(e=>e.byteLength),`imported buffer capacities`),d=bd(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=yd(u,d,`logical buffer capacities`),p=bd(n.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=bd(g.map(vd),`imported texture estimates`),y=bd(_.map(vd),`logical transient texture estimates`),b=yd(v,y,`logical texture estimates`),x=bd(r.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:n.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:r.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:yd(f,b,`logical resource estimates`),physicalTransientResourceBytes:yd(p,x,`physical transient resource estimates`)},w=Xu(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:o,transientBuffers:i,transientTextures:a,bufferTransientAllocations:n,textureTransientAllocations:r,stats:C,preflight:w}}function Xu(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,type:e.type,...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])$u(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,Zu(n.buffer).byteLength));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?yd(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function Zu(e){return`buffer`in e?e.buffer:e}function Qu(e){return`texture`in e?e.texture:e}function $u(e){return`buffer`in e}function ed(e){return`texture`in e}function td(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>$u(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||Zu(r.buffer)!==Zu(n.buffer)||!ad(r.usage)&&!ad(n.usage))continue;let a=nd(r.buffer),o=nd(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=Zu(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${rd(a)} and ${rd(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function nd(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function rd(e){return`${e.offset}–${e.offset+e.size} bytes`}function id(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function ad(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function od(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function sd(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function cd(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if($u(t)){let n=Zu(t.buffer);if(id(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(ad(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(ed(t)){let n=Qu(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&ld(n.resource,t)&&(od(t.usage)&&sd(n.resource.usage)||sd(t.usage)&&(od(n.resource.usage)||sd(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=new Map(e.map((e,t)=>[e.id,t])),s=new Map(Array.from(n,([e,t])=>[e,new Set(t)])),c=[];for(;s.size>0;){let e=Array.from(s).filter(([,e])=>e.size===0).map(([e])=>e).sort((e,t)=>o.get(e)-o.get(t));if(e.length===0)throw Error(`GPUCommandGraph contains a dependency cycle`);for(let n of e){c.push(t.get(n)),s.delete(n);for(let e of s.values())e.delete(n)}}return c}function ld(e,t){if(Qu(e.texture)!==Qu(t.texture))return!1;let n=ud(e.texture),r=ud(t.texture);return dd(n.aspect,r.aspect)&&fd(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&fd(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function ud(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function dd(e,t){return e===`all`||t===`all`||e===t}function fd(e,t,n,r){return e<n+r&&n<e+t}function pd(e,t){let n=hd(e,e=>$u(e)?Zu(e.buffer):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{buffer:e,lifetime:t}of i){if(!t)continue;let n=r.filter(e=>e.lastUse<t.firstUse).sort((e,t)=>e.byteLength-t.byteLength)[0];n||(n={byteLength:0,usage:0,lastUse:-1,handles:[]},r.push(n)),n.byteLength=Math.max(n.byteLength,e.byteLength),n.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function md(e,t){let n=hd(e,e=>ed(e)?Qu(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&_d(n.descriptor,e));n||(n={descriptor:gd(e),byteLength:vd(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function hd(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function gd(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function _d(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function vd(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=yd(t,f.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function yd(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function bd(e,t){return e.reduce((e,n)=>yd(e,n,t),0)}var xd=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},Sd=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},z=class{id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,this.data=e.data}},Cd=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},wd=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},Td=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}},Ed=4,Dd=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){Nd(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function Od(e,t,n={}){Nd(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=kd();for(;s<a.length;){let r=Ad(n,a[s]);if(s>e&&jd(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||Md(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:jd(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>Ad(e,t),kd());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function kd(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function Ad(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function jd(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function Md(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function Nd(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function Pd(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var Fd=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length){this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let r=e.filter(e=>e.stats.condition?.outcome!==`skipped`),i=r.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,nodeCount:r.length,skippedNodeCount:e.length-r.length,computePassCount:n,coalescedComputeNodeCount:i-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>({...e,...t?{gpuTimeMilliseconds:await t.querySet.readTimestampDuration(t.beginIndex,t.endIndex)}:{}}))),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0);return{cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},Id=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;tableBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);Ud(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){return this.assertMutable(),Gd(e,this.device),t&&Xd(t,e,this.device),this.addBuffer(new xd(this,e,!1,t))}createTransientBuffer(e){return this.assertMutable(),Gd(e,this.device),this.addBuffer(new xd(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=Ku(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return Yd(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new Sd(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(Uu(n)||Wu(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new z({id:e,name:t.name,format:n,length:t.length,valueLength:t.valueLength,stride:t.stride,byteStride:t.byteStride,rowByteLength:t.rowByteLength,data:r})}importTexture(e,t){this.assertMutable();let n=qd(e,this.device);return t&&Zd(t,n,this.device),this.addTexture(new Cd(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=qd(e,this.device);return this.addTexture(new Cd(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),Kd(e,this.device),this.addExternalTexture(new wd(this,e))}createTransientTexture(e){this.assertMutable();let t=qd(e,this.device);return this.addTexture(new Cd(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new Td(e,Jd(e,t))}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),Ud(this.device,`compilation`),this.compiled=!0,new Ld(Yu({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*Ed>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>$u(e)&&Zu(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if($u(t)){let e=Zu(t.buffer);this.assertBuffer(e),$d(e,t.usage)}else if(ed(t)){let e=Qu(t.texture);this.assertTexture(e),ef(e,t.usage),tf(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}td(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=Rd(t.buffer),r=this.tableBufferHandles.get(n);return r||(r=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),this.tableBufferHandles.set(n,r)),this.createDataView(r,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},Ld=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if($u(t)){let e=Zu(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(ed(t)){let e=Qu(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=Hd(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return Od(this.preflight,e,t)}createExecution(e,t={}){return new Dd({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(Ud(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=Wd(),a=this.resolveImportedBuffers(t.buffers??{});Bd(t.frameTextures??{},t.externalTextures??{});let o=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),s=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of o.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of s.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of s.textures.values())this.consumedExternalTextures.add(e);let c=o.textures,l=e=>{let t=Zu(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},u=e=>{let t=Qu(e),n=t.transient?this.transientTextures.get(t):c.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},d=e=>{let t=u(e);if(e instanceof Cd||af(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},f={commandEncoder:e,parameters:t.parameters,getBuffer:l,getTexture:u,getTextureView:d,getExternalTexture:e=>{let t=s.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},p=[],m,h=0,g=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,_=()=>{let e=m;m=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=Wd();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){p.push({stats:{id:n.id,type:n.type,cpuEncodeTimeMilliseconds:Wd()-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{m||(m=e.beginComputePass({id:n.id}),h++);let t=m;o=Vd(t),o&&(g=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?Pd(t,l(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...f,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}g||_();break}case`render`:{_();let t=r,i=t.getRenderPassProps?.(f)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,d):void 0,s=n.attachments?.resolveTargets?.map(e=>e?d(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=Vd(c),c.pushDebugGroup(n.id);try{t.encode({...f,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:_(),r.encode(f);break}p.push({stats:{id:n.id,type:n.type,cpuEncodeTimeMilliseconds:Wd()-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{_()}return new Fd(p,Wd()-i,h)}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);Xd(a,i,this.device);let o=Rd(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);Zd(e.texture,a,this.device),n.set(a,zd(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);Zd(o,a,this.device),n.set(a,zd(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);Qd(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function Rd(e){return e instanceof F?e.buffer:e}function zd(e){if(e instanceof Ws){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function Bd(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function Vd(e){let{timestampQuerySet:t,beginTimestampIndex:n,endTimestampIndex:r}=e.props;return t&&Number.isSafeInteger(n)&&Number.isSafeInteger(r)&&n>=0&&r>n?{querySet:t,beginIndex:n,endIndex:r}:void 0}function Hd(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function Ud(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function Wd(){return globalThis.performance?.now()??Date.now()}function Gd(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function Kd(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function qd(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,r))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function Jd(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function Yd(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function Xd(e,t,n){let r=Rd(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function Zd(e,t,n){let r=zd(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function Qd(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function $d(e,t){let n=nf(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function ef(e,t){let n=rf(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function tf(e,t){if(e instanceof Td&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function nf(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return n.STORAGE;case`uniform`:return n.UNIFORM;case`copy-source`:return n.COPY_SRC;case`copy-destination`:return n.COPY_DST;case`indirect`:return n.INDIRECT;case`vertex`:return n.VERTEX;case`index`:return n.INDEX}}function rf(e){switch(e){case`sampled`:return v.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return v.STORAGE;case`render-attachment`:return v.RENDER;case`copy-source`:return v.COPY_SRC;case`copy-destination`:return v.COPY_DST}}function af(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var of=class{device;id;textures;previousIndex=0;destroyed=!1;constructor(e,t){this.device=e,this.id=t.id??`gpu-texture-history`;let n=e.createTexture({...t,id:`${this.id}-previous`});try{this.textures=[n,e.createTexture({...t,id:`${this.id}-current`})]}catch(e){throw n.destroy(),e}}get previousTexture(){return this.assertAvailable(),this.textures[this.previousIndex]}get currentTexture(){return this.assertAvailable(),this.textures[1-this.previousIndex]}getBindings(e,t){if(this.assertAvailable(),e===t)throw Error(`GPUTextureHistory previous and current identifiers must differ`);return{[e]:this.previousTexture,[t]:this.currentTexture}}advance(){this.assertAvailable(),this.previousIndex=1-this.previousIndex}reset(){this.assertAvailable(),this.previousIndex=0}destroy(){this.destroyed||(this.destroyed=!0,this.textures[0].destroy(),this.textures[1].destroy())}assertAvailable(){if(this.destroyed)throw Error(`GPUTextureHistory has been destroyed`)}},sf=Uint32Array.BYTES_PER_ELEMENT,cf=256;function lf(e,t,n){let r=Ku(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%sf!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function uf(e,t){lf(e,[`uint32`],t)}function B(e,t){let n=df(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function df(e){let t=Math.floor(e.byteOffset/cf)*cf,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function V(e){if(e.byteOffset%sf!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%cf/sf}function H(e,t,r,i,a=n.STORAGE){if(!Number.isSafeInteger(i)||i<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((a&n.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(Uu(r)||Wu(r))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let o=Ku(r),s=e.createTransientBuffer({id:t,byteLength:Math.max(i,1)*o.byteLength,usage:a});return e.createDataView(s,{format:r,length:i})}function ff(e,t,n){if(e.length!==t.length||e.data.length!==t.data.length||e.data.some((e,n)=>e.length!==t.data[n].length))throw Error(`${n} must preserve the same chunk topology`)}var pf=4294967295,mf=4294967296;function hf(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>pf)throw Error(`${e} element count must be a non-negative uint32`);_f(e,n);let i=Math.floor(r);if(!Number.isSafeInteger(i)||i<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let a=Math.max(1,Math.ceil(t/n)),o=Math.min(a,i),s=Math.min(Math.ceil(a/o),i),c=Math.ceil(a/o/s);if(c>i)throw Error(`${e} requires ${a} workgroups, exceeding the 3D dispatch limit of ${i} per dimension`);return{x:o,y:s,z:c}}function gf(e,t){_f(`GPU dispatch`,t);let n=Math.floor(pf/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function _f(e,t){if(!Number.isSafeInteger(t)||t<2||t>pf||mf%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function vf(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var U=256,yf=64;function bf(e,t=!1){return t?`portable`:vf(e,{requiresSubgroupId:!0})}var xf=class{id;input;output;mode;segmentFlags;constructor(e){this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,Ef(this.input,`${this.id} input`),Ef(this.output,`${this.id} output`);let t=this.input instanceof z;if(t!==this.output instanceof z)throw Error(`${this.id} input and output must both be data views or vector views`);if(this.input instanceof z&&this.output instanceof z)ff(this.input,this.output,`${this.id} output`);else if(this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.segmentFlags){if(Ef(this.segmentFlags,`${this.id} segmentFlags`),t!==this.segmentFlags instanceof z)throw Error(`${this.id} input and segmentFlags must both be data views or vector views`);if(this.input instanceof z&&this.segmentFlags instanceof z)ff(this.input,this.segmentFlags,`${this.id} segmentFlags`);else if(this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);let e=new Set(Df(this.output).map(e=>e.buffer));if(Df(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}addToGraph(e){Sf(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function Sf(e,t,n){Of(t,e.input,e.id),Of(t,e.output,e.id),e.segmentFlags&&Of(t,e.segmentFlags,e.id),Cf(t,{id:e.id,input:e.input,output:e.output,mode:e.mode,segmentFlags:e.segmentFlags},n)}function Cf(e,t,n){let r=Df(t.input),i=Df(t.output),a=t.segmentFlags?Df(t.segmentFlags):void 0,o=r.map((e,t)=>({chunkIndex:t,input:e,output:i[t],segmentFlags:a?.[t]})).filter(e=>e.input.length>0);if(o.length===0)return;let s=t.input instanceof z;if(o.length===1){let r=o[0];wf(e,{id:s?`${t.id}-chunk-${r.chunkIndex}`:t.id,input:r.input,output:r.output,mode:t.mode,segmentFlags:r.segmentFlags,maxComputeWorkgroupsPerDimension:n});return}let c=H(e,`${t.id}-chunk-totals`,`uint32`,o.length),l=H(e,`${t.id}-chunk-offsets`,`uint32`,o.length),u=t.segmentFlags?H(e,`${t.id}-chunk-segment-flags`,`uint32`,o.length):void 0,d=t.segmentFlags?o.map(n=>H(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[r,i]of o.entries())wf(e,{id:`${t.id}-chunk-${i.chunkIndex}`,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,outputSegmentPrefixes:d?.[r],finalSum:Tf(e,c,r),finalSegmentFlag:u?Tf(e,u,r):void 0,maxComputeWorkgroupsPerDimension:n});wf(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n});for(let[r,i]of o.entries())Mf(e,{id:`${t.id}-chunk-${i.chunkIndex}-add-carry`,output:i.output,offsets:l,length:i.output.length,offsetIndex:r,segmentPrefixes:d?.[r],dispatchLayout:Nf(i.output.length,n)})}function wf(e,t){if(t.input.length===0)return;let n=[],r=t.input,i=t.output,a=t.segmentFlags,o=t.input.length,s=0;for(;;){let c=Math.ceil(o/U),l,u;c>1&&(l=H(e,`${t.id}-level-${s}-block-sums`,`uint32`,c),a&&(u=H(e,`${t.id}-level-${s}-block-segment-flags`,`uint32`,c)));let d=a?s===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:c>1||s>0?H(e,`${t.id}-level-${s}-segment-prefixes`,`uint32`,o):void 0:void 0;if(kf(e,{id:`${t.id}-level-${s}-scan`,input:r,output:i,mode:s===0?t.mode:`exclusive`,segmentFlags:a,segmentSummaryInput:!!a&&(s>0||t.segmentSummaryInput),segmentPrefixes:d,blockSums:l,blockSegmentFlags:u,finalSum:l?void 0:t.finalSum,finalSegmentFlag:l?void 0:t.finalSegmentFlag,length:o,blockCount:c,dispatchLayout:Nf(o,t.maxComputeWorkgroupsPerDimension)}),n.push({output:i,length:o,segmentPrefixes:d}),!l)break;let f=H(e,`${t.id}-level-${s}-block-offsets`,`uint32`,c);n[n.length-1].blockOffsets=f,r=l,i=f,a=u,o=c,s++}for(let r=n.length-2;r>=0;r--){let i=n[r],a=n[r+1];Mf(e,{id:`${t.id}-level-${r}-add-offsets`,output:i.output,offsets:i.blockOffsets,length:i.length,segmentPrefixes:i.segmentPrefixes,offsetSegmentPrefixes:a.segmentPrefixes,dispatchLayout:Nf(i.length,t.maxComputeWorkgroupsPerDimension)})}}function Tf(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function Ef(e,t){let n=e instanceof z?e.data:[e];for(let e of n)uf(e,t)}function Df(e){return e instanceof z?e.data:[e]}function Of(e,t,n){if((t instanceof z?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function kf(e,t){let n=t.blockSums??t.finalSum,r=t.blockSegmentFlags??t.finalSegmentFlag,i=n?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,a=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,o=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,s=r?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,c=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,l=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,u=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,d=t.segmentFlags?`if (lane >= stride) {
      scratch[lane] = select(addend + scratch[lane], scratch[lane], segmentScratch[lane] != 0u);
      segmentScratch[lane] = addendSegment | segmentScratch[lane];
    }`:`if (lane >= stride) {
      scratch[lane] = scratch[lane] + addend;
    }`,f=t.mode===`inclusive`?`scratch[lane]`:`scratch[lane] - inputValue`,p=t.segmentFlags&&t.mode===`exclusive`?`var scannedOutput = 0u;
    if (lane > 0u) {
      scannedOutput = scratch[lane - 1u];
    }
    ${t.segmentSummaryInput?``:`if (inputSegmentFlag != 0u) { scannedOutput = 0u; }`}
    outputValues[OUTPUT_OFFSET + index] = scannedOutput;`:`outputValues[OUTPUT_OFFSET + index] = ${f};`,m=t.segmentPrefixes?t.segmentSummaryInput?`var segmentPrefix = 0u;
    if (lane > 0u) {
      segmentPrefix = segmentScratch[lane - 1u];
    }
    segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix;`:`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentScratch[lane];`:``,h=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const BLOCK_COUNT: u32 = ${t.blockCount}u;
const INPUT_OFFSET: u32 = ${V(t.input)}u;
const OUTPUT_OFFSET: u32 = ${V(t.output)}u;
${n?`const SUM_OFFSET: u32 = ${V(n)}u;`:``}
${t.segmentFlags?`const SEGMENT_FLAGS_OFFSET: u32 = ${V(t.segmentFlags)}u;`:``}
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${V(t.segmentPrefixes)}u;`:``}
${r?`const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${V(r)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${i}
${a}
${o}
${s}
var<workgroup> scratch: array<u32, ${U}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${U}>;`:``}

@compute @workgroup_size(${U}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Pf(t.dispatchLayout)}
  if (workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = localInvocationIndex;
  var inputValue = 0u;
  var inputSegmentFlag = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
    inputSegmentFlag = ${u};
  }
  scratch[lane] = inputValue;
  ${t.segmentFlags?`segmentScratch[lane] = inputSegmentFlag;`:``}
  workgroupBarrier();

  for (var stride = 1u; stride < ${U}u; stride = stride * 2u) {
    var addend = 0u;
    ${t.segmentFlags?`var addendSegment = 0u;`:``}
    if (lane >= stride) {
      addend = scratch[lane - stride];
      ${t.segmentFlags?`addendSegment = segmentScratch[lane - stride];`:``}
    }
    workgroupBarrier();
    ${d}
    workgroupBarrier();
  }

  if (lane == ${U-1}u) {
    ${c}
    ${l}
  }
  if (index < ELEMENT_COUNT) {
    ${p}
    ${m}
  }
}`,g=Af(e,!!t.segmentFlags,t.length),_=g===`subgroups`?jf(t,n,i):h;e.addComputePass({id:t.id,workload:{operation:`GPUScan`,variant:g,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*U,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...n?[{buffer:n,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...r?[{buffer:r,usage:`storage-write`}]:[]],compile:({device:e})=>{let i=new I(e,{id:t.id,source:_,shaderLayout:{bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...n?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...r?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]}});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:B(t.input,a),outputValues:B(t.output,a)};n&&(o.sumValues=B(n,a)),t.segmentFlags&&(o.segmentFlags=B(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=B(t.segmentPrefixes,a)),r&&(o.summarySegmentFlags=B(r,a)),i.setBindings(o),i.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>i.destroy()}}})}function Af(e,t,n){let r=bf(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||bf(e.device,!1)===`subgroups`}]}).variant}function jf(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/U)+1;return`
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${e.length}u;
const BLOCK_COUNT: u32 = ${e.blockCount}u;
const INPUT_OFFSET: u32 = ${V(e.input)}u;
const OUTPUT_OFFSET: u32 = ${V(e.output)}u;
${t?`const SUM_OFFSET: u32 = ${V(t)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${n}
var<workgroup> subgroupOffsets: array<u32, ${yf}>;

@compute @workgroup_size(${U}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${U}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${U}u / subgroupSize;
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
  if (lane == ${U-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function Mf(e,t){let n=t.offsetIndex===void 0?`index / ${U}u`:`${t.offsetIndex}u`,r=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${V(t.output)}u;
const OFFSETS_OFFSET: u32 = ${V(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${V(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${V(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${U}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Pf(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${n}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${n}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`;e.addComputePass({id:t.id,workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*U,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new I(e,{id:t.id,source:r,shaderLayout:{bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]}});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:B(t.output,r),offsets:B(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=B(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=B(t.offsetSegmentPrefixes,r)),n.setBindings(i),n.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>n.destroy()}}})}function Nf(e,t){return hf(`GPUScan`,e,U,t)}function Pf(e){return gf(e,U)}var Ff=256,If=4294967295,Lf=4294967295,Rf=class{id;keys;values;outputKeys;outputValues;segments;direction;constructor(e){this.id=e.id??`gpu-segmented-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.direction=e.direction??`ascending`;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])uf(t,`${this.id} ${e}`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(this.outputKeys.buffer===this.outputValues.buffer||this.outputKeys.buffer===this.keys.buffer||this.outputKeys.buffer===this.values.buffer||this.outputValues.buffer===this.keys.buffer||this.outputValues.buffer===this.values.buffer)throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>Bf(this,e,t)),Vf(this.segments,`outputKeysOffset`,`${this.id} output keys`),Vf(this.segments,`outputValuesOffset`,`${this.id} output values`)}addToGraph(e){zf(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function zf(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);let r=Hf(e.segments),i=Array.from(r,([t,r])=>({width:t,segments:r,dispatchLayout:hf(`${e.id} ${t}-wide segments`,r.length*t,t,n)}));for(let n of i)Uf(t,e,n.width,n.segments,n.dispatchLayout)}function Bf(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isInteger(t.length)||t.length<0||t.length>Ff)throw Error(`${r} length must be an integer from 0 to ${Ff}`);for(let[n,i]of[[`keysOffset`,e.keys],[`valuesOffset`,e.values],[`outputKeysOffset`,e.outputKeys],[`outputValuesOffset`,e.outputValues]]){let e=t[n];if(!Number.isSafeInteger(e)||e<0||e>Lf)throw Error(`${r} ${n} must be a non-negative uint32`);if(e>i.length||t.length>i.length-e)throw Error(`${r} ${n} and length exceed the parent view`)}return{keysOffset:t.keysOffset,valuesOffset:t.valuesOffset,outputKeysOffset:t.outputKeysOffset,outputValuesOffset:t.outputValuesOffset,length:t.length}}function Vf(e,t,n){let r=e.filter(e=>e.length>0).slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+i.length)throw Error(`${n} segments must not overlap`)}}function Hf(e){let t=new Map;for(let n of e){if(n.length===0)continue;let e=2;for(;e<n.length;)e*=2;let r=t.get(e);r?r.push(n):t.set(e,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function Uf(e,t,n,r,i){let a=r.map(e=>`  SortSegment(${e.keysOffset}u, ${e.valuesOffset}u, ${e.outputKeysOffset}u, ${e.outputValuesOffset}u, ${e.length}u)`).join(`,
`),o=t.direction===`descending`,s=vf(e.device,{requiresSubgroupId:!0})===`subgroups`,c=`
${s?`enable subgroups;
requires subgroup_id;`:``}
struct SortSegment {
  keysOffset: u32,
  valuesOffset: u32,
  outputKeysOffset: u32,
  outputValuesOffset: u32,
  length: u32,
};

const INVALID_INDEX: u32 = ${If}u;
const SEGMENT_COUNT: u32 = ${r.length}u;
const KEYS_OFFSET: u32 = ${V(t.keys)}u;
const VALUES_OFFSET: u32 = ${V(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${V(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${V(t.outputValues)}u;
const SEGMENTS: array<SortSegment, ${r.length}> = array<SortSegment, ${r.length}>(
${a}
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
  return ${o?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${n}) fn main(
  ${s?`@builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,`:`@builtin(local_invocation_index) localInvocationIndex: u32,`}
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let segmentIndex =
    (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  if (segmentIndex >= SEGMENT_COUNT) { return; }
  let segment = SEGMENTS[segmentIndex];
${s?Gf(n):Wf(n)}
}`,l=`${t.id}-bitonic-local-${n}`,u={keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues};e.addComputePass({id:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],compile:({device:e})=>{let t=new I(e,{id:l,source:c,shaderLayout:{bindings:Object.keys(u).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(u))r[e]=B(t,n);t.setBindings(r),t.dispatch(e,i.x,i.y,i.z)},destroy:()=>t.destroy()}}})}function Wf(e){return`
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
  }`}function Gf(e){return`
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
  }`}var Kf=256,qf=256,Jf=4,Yf=qf/32,Xf=4294967295,Zf=2147483648,Qf=Kf,$f=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])uf(t,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>Zf)throw Error(`${this.id} supports at most ${Zf} rows`);tp(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=Qf?`bitonic`:`radix`:this.algorithm}addToGraph(e){ep(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function ep(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);if(e.keys.length===0)return;if(e.keys.length===1){np(t,e);return}let r=hf(`GPUSort`,e.keys.length,qf,n);e.resolvedAlgorithm===`bitonic`?rp(t,e,r,n):up(t,e,r,n)}function tp(e){if(e.outputKeys.buffer===e.outputValues.buffer||e.outputKeys.buffer===e.keys.buffer||e.outputKeys.buffer===e.values.buffer||e.outputValues.buffer===e.keys.buffer||e.outputValues.buffer===e.values.buffer)throw Error(`${e.id} outputs must use separate buffers from inputs and each other`)}function np(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${V(n)}u;
const VALUES_OFFSET: u32 = ${V(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${V(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${V(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${qf}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gf(a,qf)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;hp(e,{id:`${t.id}-${i}`,source:o,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})}function rp(e,t,n,r){let i=pp(t.keys.length);if(i<=Kf){ip(e,t,i);return}let a=hf(`GPUSort bitonic`,i,Kf,r),o=H(e,`${t.id}-bitonic-indices-a`,`uint32`,i),s=H(e,`${t.id}-bitonic-indices-b`,`uint32`,i);sp(e,t,o,i,a);let c=o,l=s;for(let n of mp(i))cp(e,t,c,l,i,n,a),[c,l]=[l,c];lp(e,t,c,n)}function ip(e,t,n){let r=t.direction===`descending`,i=vf(e.device,{requiresSubgroupId:!0})===`subgroups`,a=`
${i?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${Xf}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${n}u;
const KEYS_OFFSET: u32 = ${V(t.keys)}u;
const VALUES_OFFSET: u32 = ${V(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${V(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${V(t.outputValues)}u;
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
  return ${r?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${n}) fn main(
  ${i?`@builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32`:`@builtin(local_invocation_index) localInvocationIndex: u32`}
) {
${i?op():ap()}
}`;hp(e,{id:`${t.id}-bitonic-local`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})}function ap(){return`
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
  }`}function op(){return`
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
  }`}function sp(e,t,n,r,i){let a=`
const INVALID_INDEX: u32 = ${Xf}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${V(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${Kf}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gf(i,Kf)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;hp(e,{id:`${t.id}-bitonic-initialize`,source:a,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})}function cp(e,t,n,r,i,a,o){let s=t.direction===`descending`,c=`
const INVALID_INDEX: u32 = ${Xf}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${i}u;
const BLOCK_WIDTH: u32 = ${a.blockWidth}u;
const COMPARE_STRIDE: u32 = ${a.compareStride}u;
const KEYS_OFFSET: u32 = ${V(t.keys)}u;
const INDICES_IN_OFFSET: u32 = ${V(n)}u;
const INDICES_OUT_OFFSET: u32 = ${V(r)}u;
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
  return ${s?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${Kf}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gf(o,Kf)}
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
}`;hp(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:c,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})}function lp(e,t,n,r){let i=`
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${V(t.keys)}u;
const VALUES_OFFSET: u32 = ${V(t.values)}u;
const INDICES_OFFSET: u32 = ${V(n)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${V(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${V(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${Kf}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gf(r,Kf)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;hp(e,{id:`${t.id}-bitonic-gather`,source:i,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})}function up(e,t,n,r){let i=Math.ceil(t.keyBits/Jf),a=Math.ceil(t.keys.length/qf),o=i>1?H(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,s=i>1?H(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,c=t.keys,l=t.values;for(let u=0;u<i;u++){let d=u*Jf,f=Math.min(Jf,t.keyBits-d),p=2**f,m=H(e,`${t.id}-radix-digit-${d}-histogram`,`uint32`,p*a),h=H(e,`${t.id}-radix-digit-${d}-offsets`,`uint32`,p*a),g=(i-u)%2==1,_=g?t.outputKeys:o,v=g?t.outputValues:s;if(!_||!v)throw Error(`${t.id} radix scratch is missing`);dp(e,t,c,m,d,f,a,n),Sf(new xf({id:`${t.id}-radix-digit-${d}-scan`,input:m,output:h}),e,r),fp(e,t,c,l,h,_,v,d,f,a,n),c=_,l=v}}function dp(e,t,n,r,i,a,o,s){let c=2**a,l=t.direction===`descending`,u=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${i}u;
const BUCKET_COUNT: u32 = ${c}u;
const DIGIT_MASK: u32 = ${c-1}u;
const WORKGROUP_COUNT: u32 = ${o}u;
const KEYS_OFFSET: u32 = ${V(n)}u;
const HISTOGRAM_OFFSET: u32 = ${V(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${c}>;

@compute @workgroup_size(${qf}) fn main(
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

  let index = workgroupIndex * ${qf}u + localInvocationIndex;
  if (index < ELEMENT_COUNT) {
    let key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    let bucket = ${l?`DIGIT_MASK - digit`:`digit`};
    atomicAdd(&digitCounts[bucket], 1u);
  }
  workgroupBarrier();

  if (localInvocationIndex < BUCKET_COUNT) {
    histogram[HISTOGRAM_OFFSET + localInvocationIndex * WORKGROUP_COUNT + workgroupIndex] =
      atomicLoad(&digitCounts[localInvocationIndex]);
  }
}`;hp(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:u,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})}function fp(e,t,n,r,i,a,o,s,c,l,u){let d=2**c,f=t.direction===`descending`,p=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${d-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${Yf}u;
const MASK_COUNT: u32 = ${d*Yf}u;
const KEYS_OFFSET: u32 = ${V(n)}u;
const VALUES_OFFSET: u32 = ${V(r)}u;
const OFFSETS_OFFSET: u32 = ${V(i)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${V(a)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${V(o)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${d*Yf}>;

@compute @workgroup_size(${qf}) fn main(
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

  let index = workgroupIndex * ${qf}u + localInvocationIndex;
  let valid = index < ELEMENT_COUNT;
  var key = 0u;
  var bucket = 0u;
  if (valid) {
    key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    bucket = ${f?`DIGIT_MASK - digit`:`digit`};
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
}`;hp(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:p,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})}function pp(e){let t=1;for(;t<e;)t*=2;return t}function mp(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function hp(e,t){e.addComputePass({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new I(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=B(n,r);n.setBindings(i),n.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>n.destroy()}}})}var gp=256,_p=128,vp=64,yp=4294967295,bp=class{id;strategy;resolvedStrategy;minima;maxima;sourceIds;leafCapacity;nodeMinima;nodeMaxima;nodeChildren;leafIds;count;overflow;dimension;nodeCount;internalNodeCount;levelCount;rootNode=0;topology=`complete-binary`;updatePolicy=`refit`;stats;constructor(e){if(this.id=e.id??`gpu-bvh`,this.strategy=e.strategy??`auto`,this.minima=e.minima,this.maxima=e.maxima,this.sourceIds=e.sourceIds,this.leafCapacity=e.leafCapacity,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.count=e.count,this.overflow=e.overflow,this.dimension=this.minima.format===`float32x2`?2:3,this.minima.length>yp)throw Error(`${this.id} source row count exceeds uint32 range`);if(!Number.isSafeInteger(this.leafCapacity)||!Dp(this.leafCapacity))throw Error(`${this.id} leafCapacity must be a positive power of two`);if(![`auto`,`fused`,`level`].includes(this.strategy))throw Error(`${this.id} strategy must be auto, fused, or level`);let t=this.minima.buffer.graph.device.limits,n=this.leafCapacity<=_p&&this.leafCapacity<=t.maxComputeInvocationsPerWorkgroup&&this.leafCapacity<=t.maxComputeWorkgroupSizeX&&this.leafCapacity*vp<=t.maxComputeWorkgroupStorageSize;if(this.strategy===`fused`&&!n)throw Error(`${this.id} fused strategy exceeds portable single-workgroup limits`);if(this.resolvedStrategy=this.strategy===`level`||!n?`level`:`fused`,this.nodeCount=this.leafCapacity*2-1,this.internalNodeCount=this.leafCapacity-1,this.levelCount=Math.log2(this.leafCapacity)+1,!Number.isSafeInteger(this.nodeCount)||this.nodeCount>yp)throw Error(`${this.id} node count exceeds uint32 range`);if(lf(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),lf(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),lf(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),lf(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),lf(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),uf(this.leafIds,`${this.id} leafIds`),uf(this.count,`${this.id} count`),uf(this.overflow,`${this.id} overflow`),this.sourceIds&&uf(this.sourceIds,`${this.id} sourceIds`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.sourceIds&&this.sourceIds.length!==this.minima.length)throw Error(`${this.id} sourceIds.length must equal bounds length`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeCount||this.nodeMaxima.length!==this.nodeCount)throw Error(`${this.id} node bounds must match source format and node count`);if(this.nodeChildren.length!==this.nodeCount)throw Error(`${this.id} nodeChildren.length must equal node count`);if(this.leafIds.length!==this.leafCapacity)throw Error(`${this.id} leafIds.length must equal leafCapacity`);if(this.count.length<1||this.overflow.length<1)throw Error(`${this.id} count and overflow must each contain one uint32 row`);let r=Ku(this.minima.format).byteLength;this.stats={dimension:this.dimension,leafCapacity:this.leafCapacity,internalNodeCount:this.internalNodeCount,nodeCount:this.nodeCount,levelCount:this.levelCount,outputByteLength:this.nodeCount*(r*2+Uint32Array.BYTES_PER_ELEMENT*2)+this.leafCapacity*Uint32Array.BYTES_PER_ELEMENT+Uint32Array.BYTES_PER_ELEMENT*2}}addToGraph(e){if([this.minima,this.maxima,...this.sourceIds?[this.sourceIds]:[],this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.count,this.overflow].some(t=>t.buffer.graph!==e))throw Error(`${this.id} views must belong to the target graph`);if(this.resolvedStrategy===`fused`)xp(e,this);else{Sp(e,this,Ep(this.nodeCount,e.device.limits.maxComputeWorkgroupsPerDimension));for(let t=this.levelCount-2;t>=0;t--)wp(e,this,t)}this.sourceIds&&Cp(e,this,this.sourceIds)}};function xp(e,t){let n=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${V(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${V(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${V(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${V(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${V(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${V(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${V(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${V(t.overflow)}u;
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
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${yp}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${yp}u;
  leafIds[LEAF_IDS_OFFSET + localIndex] = ${yp}u;

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
}`,r=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];Tp(e,{id:`${t.id}-fused-refit`,source:n,resources:r,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchCount:1})}function Sp(e,t,n){let r=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const NODE_COUNT: u32 = ${t.nodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${V(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${V(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${V(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${V(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${V(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${V(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${V(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${V(t.overflow)}u;
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

@compute @workgroup_size(${gp}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${n.y}u + workgroupId.y) * ${n.x}u + workgroupId.x;
  let nodeIndex = workgroupIndex * ${gp}u + localId.x;
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
    nodeChildren[CHILDREN_OFFSET + childComponent] = ${yp}u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = ${yp}u;
    let leafIndex = nodeIndex - INTERNAL_NODE_COUNT;
    leafIds[LEAF_IDS_OFFSET + leafIndex] = ${yp}u;
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
}`,i=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];Tp(e,{id:`${t.id}-load-leaves`,source:r,resources:i,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchSize:n})}function Cp(e,t,n){let r=Math.min(n.length,t.leafCapacity),i=Ep(r,e.device.limits.maxComputeWorkgroupsPerDimension),a=`
const STORED_COUNT: u32 = ${r}u;
const SOURCE_IDS_OFFSET: u32 = ${V(n)}u;
const LEAF_IDS_OFFSET: u32 = ${V(t.leafIds)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read_write> leafIds: array<u32>;

@compute @workgroup_size(${gp}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  let leafIndex = workgroupIndex * ${gp}u + localId.x;
  if (leafIndex >= STORED_COUNT) { return; }
  let sourceIndex = leafIds[LEAF_IDS_OFFSET + leafIndex];
  if (sourceIndex == ${yp}u) { return; }
  leafIds[LEAF_IDS_OFFSET + leafIndex] = sourceIds[SOURCE_IDS_OFFSET + sourceIndex];
}`;Tp(e,{id:`${t.id}-remap-source-ids`,source:a,resources:[{buffer:n,usage:`storage-read`},{buffer:t.leafIds,usage:`storage-read-write`}],bindings:{sourceIds:n,leafIds:t.leafIds},dispatchSize:i})}function wp(e,t,n){let r=2**n-1,i=2**n,a=`
const FIRST_NODE: u32 = ${r}u;
const LEVEL_NODE_COUNT: u32 = ${i}u;
const DIMENSION: u32 = ${t.dimension}u;
const NODE_MINIMA_OFFSET: u32 = ${V(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${V(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${V(t.nodeChildren)}u;
@group(0) @binding(0) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeChildren: array<u32>;

@compute @workgroup_size(${gp}) fn main(
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
}`;Tp(e,{id:`${t.id}-refit-depth-${n}`,source:a,resources:[{buffer:t.nodeMinima,usage:`storage-read-write`},{buffer:t.nodeMaxima,usage:`storage-read-write`},{buffer:t.nodeChildren,usage:`storage-read`}],bindings:{nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren},dispatchCount:Math.ceil(i/gp)})}function Tp(e,t){e.addComputePass({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new I(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=B(n,r);n.setBindings(i),t.dispatchSize?n.dispatch(e,t.dispatchSize.x,t.dispatchSize.y,t.dispatchSize.z):n.dispatch(e,t.dispatchCount)},destroy:()=>n.destroy()}}})}function Ep(e,t){let n=Math.floor(t),r=Math.max(1,Math.ceil(e/gp)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`GPUBVH requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function Dp(e){return e>0&&Number.isInteger(Math.log2(e))}var Op=128,kp=64,Ap=4294967295,jp=class{id;minima;maxima;nodeMinima;nodeMaxima;nodeChildren;leafIds;counts;overflows;segments;dimension;topology=`complete-binary`;updatePolicy=`refit`;constructor(e){if(this.id=e.id??`gpu-segmented-bvh`,this.minima=e.minima,this.maxima=e.maxima,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.counts=e.counts,this.overflows=e.overflows,this.dimension=this.minima.format===`float32x2`?2:3,lf(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),lf(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),lf(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),lf(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),lf(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),uf(this.leafIds,`${this.id} leafIds`),uf(this.counts,`${this.id} counts`),uf(this.overflows,`${this.id} overflows`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeMaxima.length||this.nodeMinima.length!==this.nodeChildren.length)throw Error(`${this.id} node views must have matching formats and lengths`);if(this.counts.length!==this.overflows.length)throw Error(`${this.id} counts and overflows must have matching lengths`);let t=[this.minima,this.maxima],n=[this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.counts,this.overflows];for(let[e,r]of n.entries())if(t.some(e=>e.buffer===r.buffer)||n.slice(0,e).some(e=>e.buffer===r.buffer))throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>Np(this,e,t)),Fp(this.segments,`nodeOffset`,e=>e.leafCapacity*2-1),Fp(this.segments,`leafOffset`,e=>e.leafCapacity),Fp(this.segments,`metadataOffset`,()=>1)}addToGraph(e){Mp(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function Mp(e,t,n){for(let n of[e.minima,e.maxima,e.nodeMinima,e.nodeMaxima,e.nodeChildren,e.leafIds,e.counts,e.overflows])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);let r=Ip(e.segments),i=Array.from(r,([t,r])=>{let i=Math.max(2,t);return{leafCapacity:t,segments:r,dispatchLayout:hf(`${e.id} ${t}-leaf hierarchies`,r.length*i,i,n)}});for(let n of i)Lp(t,e,n.leafCapacity,n.segments,n.dispatchLayout)}function Np(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isSafeInteger(t.leafCapacity)||t.leafCapacity<1||t.leafCapacity>Op||t.leafCapacity&t.leafCapacity-1)throw Error(`${r} leafCapacity must be a positive power of two from 1 through 128`);let i=e.minima.buffer.graph.device.limits;if(t.leafCapacity>i.maxComputeInvocationsPerWorkgroup||t.leafCapacity>i.maxComputeWorkgroupSizeX||t.leafCapacity*kp>i.maxComputeWorkgroupStorageSize)throw Error(`${r} leafCapacity exceeds portable single-workgroup limits`);for(let e of[`sourceOffset`,`sourceCount`,`nodeOffset`,`leafOffset`,`metadataOffset`]){let n=t[e];if(!Number.isSafeInteger(n)||n<0||n>Ap)throw Error(`${r} ${e} must be a non-negative uint32`)}return Pp(r,`sourceOffset`,t.sourceOffset,t.sourceCount,e.minima.length),Pp(r,`nodeOffset`,t.nodeOffset,t.leafCapacity*2-1,e.nodeMinima.length),Pp(r,`leafOffset`,t.leafOffset,t.leafCapacity,e.leafIds.length),Pp(r,`metadataOffset`,t.metadataOffset,1,e.counts.length),{sourceOffset:t.sourceOffset,sourceCount:t.sourceCount,nodeOffset:t.nodeOffset,leafOffset:t.leafOffset,metadataOffset:t.metadataOffset,leafCapacity:t.leafCapacity}}function Pp(e,t,n,r,i){if(n>i||r>i-n)throw Error(`${e} ${t} and required rows exceed the parent view`)}function Fp(e,t,n){let r=e.slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+n(i))throw Error(`GPUSegmentedBVH ${t} ranges must not overlap`)}}function Ip(e){let t=new Map;for(let n of e){let e=t.get(n.leafCapacity);e?e.push(n):t.set(n.leafCapacity,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function Lp(e,t,n,r,i){let a=r.map(e=>`  BVHSegment(${e.sourceOffset}u, ${e.sourceCount}u, ${e.nodeOffset}u, ${e.leafOffset}u, ${e.metadataOffset}u)`).join(`,
`),o=`
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
const MINIMA_OFFSET: u32 = ${V(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${V(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${V(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${V(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${V(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${V(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${V(t.counts)}u;
const OVERFLOW_OFFSET: u32 = ${V(t.overflows)}u;
const SEGMENTS: array<BVHSegment, ${r.length}> = array<BVHSegment, ${r.length}>(
${a}
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
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${Ap}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${Ap}u;
  leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = ${Ap}u;

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
}`,s=`${t.id}-fused-refit-${n}`,c={sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCounts:t.counts,outputOverflows:t.overflows};e.addComputePass({id:s,resources:[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.counts,usage:`storage-write`},{buffer:t.overflows,usage:`storage-write`}],compile:({device:e})=>{let t=new I(e,{id:s,source:o,shaderLayout:{bindings:Object.keys(c).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(c))r[e]=B(t,n);t.setBindings(r),t.dispatch(e,i.x,i.y,i.z)},destroy:()=>t.destroy()}}})}var Rp=`
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
};

struct RayBlasNode {
  minimum: vec4<f32>,
  maximum: vec4<f32>,
};
`,zp=`
${Rp}

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
`,Bp=`
${Rp}

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
`,Vp=`
${Rp}

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
const MAXIMUM_HISTORY_SAMPLES = 64.0;
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

fn makeCameraRayAtOffset(pixel: vec2<u32>, offset: vec2<f32>) -> Ray {
  let coordinates = (vec2<f32>(pixel) + offset) / vec2<f32>(uniforms.dimensions.xy);
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

fn makeRadianceSampleOffset(pixel: vec2<u32>, sampleIndex: u32) -> vec2<f32> {
  let pixelIndex = pixel.y * uniforms.dimensions.x + pixel.x;
  let pixelRotation = vec2<f32>(
    makeRandom(pixelIndex * 1973u + 17u),
    makeRandom(pixelIndex * 26699u + 101u)
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

fn evaluateDirectLighting(ray: Ray, hit: RayHit) -> vec3<f32> {
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
  var result = primitive.emissive.rgb;
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
    min(historicalColor.a, MAXIMUM_HISTORY_SAMPLES),
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
    min(historicalSampleCount / totalWeight, MAXIMUM_HISTORY_SAMPLES),
    true
  );
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
  let useStableGuideSample = sampleCount == 1u &&
    uniforms.previousCameraPosition.w < 0.5 && uniforms.temporal.w < 0.5;
  var accumulatedColor = vec3<f32>(0.0);
  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    var ray = guideRay;
    var hit = guideHit;
    if (!useStableGuideSample) {
      ray = makeCameraRay(pixel, sampleIndex);
      hit = intersectScene(ray, RAY_INFINITY);
    }
    var color = uniforms.background.rgb;
    if (hit.distance < RAY_INFINITY) {
      color = evaluateDirectLighting(ray, hit);
    }
    accumulatedColor += color;
  }

  var color = accumulatedColor / f32(sampleCount) * uniforms.settings.x;
  let historicalSample = getHistoricalRaySample(pixel, guideRay, guideHit, color);
  var totalSampleCount = f32(sampleCount);
  if (historicalSample.valid) {
    totalSampleCount = min(
      historicalSample.sampleCount + f32(sampleCount),
      MAXIMUM_HISTORY_SAMPLES
    );
    let currentWeight = f32(sampleCount) / totalSampleCount;
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
`;function Hp(e){let t=typeof e==`boolean`?e?0:2:e.toneMapMode;return`
@group(0) @binding(0) var image: texture_2d<f32>;

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
  let topLeft = textureLoad(image, firstPixel, 0).rgb;
  let topRight = textureLoad(image, vec2<i32>(secondPixel.x, firstPixel.y), 0).rgb;
  let bottomLeft = textureLoad(image, vec2<i32>(firstPixel.x, secondPixel.y), 0).rgb;
  let bottomRight = textureLoad(image, secondPixel, 0).rgb;
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
  if (${typeof e==`boolean`?e?0:1:e.outputEncoding} == 0) {
    return vec4<f32>(color, 1.0);
  }
  return vec4<f32>(encodeRayTracingLinearSRGB(color), 1.0);
}
`}var Up=68,Wp=24,Gp=8,Kp=16,qp=68,Jp=.5,Yp=.25,Xp=33.3,Zp=[.25,.375,.5,.75,1],Qp=750,$p=1.2,em=.65,tm=6,nm=45,rm=8,im=64,am=4294967295,om=32,sm=.25,cm=`
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
`,lm=`
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
`,um=`
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
`,dm=`
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
`,fm=`
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
`,pm=`
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
`,mm=`
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
`,hm=`
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
`,gm=`
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
`,_m=class{device;frames=new Map;geometryCache=new Map;constructor(e){if(e.type!==`webgpu`)throw Error(`Ray tracing scene rendering requires a WebGPU device.`);this.device=e}render(e){let[t,n]=vm(this.device,e),r=ym(this.device,e),i=e.lights??[],a=Um(e),o=new P(e.camera.projectionMatrix).multiplyRight(e.camera.viewMatrix),s=new P(o).invert(),c=Dm(e),l=km(e),u=Om(e,l),d=Am(e,i),f=this.frames.get(e.id),p=$m();if(f){Gm(f,p),Wm(f,a)&&(f.historyNeedsReset=!0);let s=f.topologyRevision!==c,m=f.primitiveRevision!==u,h=f.transformRevision!==l,g=f.lightRevision!==d,_=wm(e,f,s,h),v=!s&&!m&&f.previousTransformsNeedCommit&&f.pendingPreviousTransformInstanceIds.size>0&&f.pendingPreviousTransformInstanceIds.size<=Cm(f),y,b,x;if(s&&(y=Mm(e.surfaces,e.primitives??{},this.geometryCache)),s||m&&!_?b=Nm(e.surfaces,e.primitives??{},y?.geometryLayouts??f.geometryLayouts,f.previousTransforms):f.previousTransformsNeedCommit&&!_&&!v&&(b=Nm(e.surfaces,e.primitives??{},f.geometryLayouts,f.previousTransforms)),g&&(x=Rm(i)),s||b&&f.primitiveBuffer.byteLength<b.primitives.byteLength||y&&f.triangleBuffer.byteLength<y.triangles.byteLength||x&&f.lightBuffer.byteLength<x.byteLength){y??=Mm(e.surfaces,e.primitives??{},this.geometryCache),b??=Nm(e.surfaces,e.primitives??{},y.geometryLayouts,f.previousTransforms);let s=Pm(b,y.triangles,i),p=f.previousTransformsNeedCommit||h;this.destroyFrame(e.id),f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:s,topology:y,primitiveData:b,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.previousTransformsNeedCommit=p;let m=f.primitivePlacements;f.pendingPreviousTransformInstanceIds=new Set(p?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>m.has(e)):[]),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}else{if(y&&(f.triangleBuffer.write(y.triangles),f.geometryLayouts=y.geometryLayouts,f.historyNeedsReset=!0,f.accelerationUpdateMode=`rebuild`),b){f.primitiveBuffer.write(b.primitives),f.previousTransforms=b.previousTransforms,f.primitivePlacements=b.placements,f.retainedSurfaces=e.surfaces;let t=b.placements;f.pendingPreviousTransformInstanceIds=new Set(h?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>t.has(e)):[]),f.previousTransformsNeedCommit=h,f.primitiveCount=b.primitiveCount,f.triangleCount=b.triangleCount,h?(Em(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)):m&&(f.historyNeedsReset=!0)}else (_||v)&&(Tm(f,_??[]),h&&(Em(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)));if(x){let t=f.lightCount!==i.length;f.lightBuffer.write(x),f.lightCount=i.length,(t||!(e.temporalReprojection??!0))&&(f.historyNeedsReset=!0)}f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d}}else{let s=Mm(e.surfaces,e.primitives??{},this.geometryCache),p=Nm(e.surfaces,e.primitives??{},s.geometryLayouts,new Map),m=Pm(p,s.triangles,i);f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:m,topology:s,primitiveData:p,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}f.lastRenderTimeMilliseconds||=p;let m=jm(e,s);f.renderRevision!==m&&(f.renderRevision=m,f.historyNeedsReset=!0),(e.temporalReprojection??!0)&&Qm(f.previousViewProjection,o,f.previousCameraPosition,e.camera.position)&&(f.historyNeedsReset=!0),(f.displayWidth!==t||f.displayHeight!==n)&&(f.historyNeedsReset=!0),Km(f,p);let h=qm(t,n,f.resolutionScale);f.displayWidth!==t||f.displayHeight!==n||f.internalWidth!==h.width||f.internalHeight!==h.height?this.recreateTraceResources(e.id,f,t,n,h.width,h.height,r):bm(f.presentation,r)||this.recreateTraceGraph(e.id,f,r);let g=e.progressive??!0;f.historyNeedsReset&&(f.accumulatedFrameCount=0,f.phaseCount=1,f.phaseIndex=0);let _=f.historyNeedsReset?1:f.phaseCount,v=f.historyNeedsReset?0:f.phaseIndex%_,y=g?f.accumulatedFrameCount:0;f.uniformBuffer.write(Bm({options:e,inverseViewProjection:s,previousViewProjection:f.previousViewProjection,previousCameraPosition:f.previousCameraPosition,displayWidth:t,displayHeight:n,internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,phaseIndex:v,phaseCount:_,primitiveCount:f.primitiveCount,primitiveCapacity:f.primitiveCapacity,leafCapacity:f.leafCapacity,lightCount:f.lightCount,directLightCount:i.reduce((e,t)=>e+Number(t.type!==`ambient`),0),accumulatedFrameCount:y,frameIndex:f.frameIndex}));let b,x,S;f.topologyNeedsUpdate&&(b=f.topologyGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.topologyNeedsUpdate=!1),f.accelerationUpdateMode===`rebuild`?(x=f.accelerationGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild=0):f.accelerationUpdateMode===`refit`&&(S=f.refitGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild++),f.accelerationUpdateMode=`none`;let C=f.traceGraph.encode(this.device.commandEncoder,{parameters:{dispatchWidth:Math.ceil(f.internalWidth/_),carryWidth:_>1?Math.ceil(f.internalWidth*(_-1)/_):0,...e.framebuffer?{framebuffer:e.framebuffer}:{}},textures:{...f.colorHistory.getBindings(`history`,`output`),...f.metadataHistory.getBindings(`history-metadata`,`output-metadata`)}}).stats;f.colorHistory.advance(),f.metadataHistory.advance(),f.previousViewProjection=new P(o),f.previousCameraPosition=Array.from(e.camera.position),f.historyNeedsReset=!1,f.phaseIndex=(v+1)%f.phaseCount,f.frameIndex++,f.accumulatedFrameCount=g?y+1:0;let w=Zm(e);return{surfaceCount:e.surfaces.length,instanceCount:f.primitiveCount,drawCount:1,triangleCount:f.triangleCount,rayTracing:{internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,sampledPixelCoverage:1/_,frameTimeMilliseconds:f.averageFrameTimeMilliseconds??f.targetFrameTimeMilliseconds,accumulatedSamples:g?Math.min(f.accumulatedFrameCount*w,im):w,graph:Sm({topology:b,acceleration:x,refit:S,trace:C})}}}destroyFrame(e){let t=this.frames.get(e);t&&(t.topologyGraph.destroy(),t.accelerationGraph.destroy(),t.refitGraph.destroy(),t.traceGraph.destroy(),t.uniformBuffer.destroy(),t.primitiveBuffer.destroy(),t.triangleBuffer.destroy(),t.lightBuffer.destroy(),t.nodeMinimaBuffer.destroy(),t.nodeMaximaBuffer.destroy(),t.nodeChildrenBuffer.destroy(),t.leafIdsBuffer.destroy(),t.sortedPrimitiveIdsBuffer.destroy(),t.blasNodesBuffer.destroy(),t.blasTriangleIdsBuffer.destroy(),t.bvhCountBuffer.destroy(),t.bvhOverflowBuffer.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e)}createFrameResources(e){let{frameIdentifier:t,scene:r}=e,i=this.device.createBuffer({id:`${t}-ray-tracing-uniforms`,byteLength:qp*Float32Array.BYTES_PER_ELEMENT,usage:n.UNIFORM|n.COPY_DST}),a=this.device.createBuffer({id:`${t}-ray-tracing-primitives`,data:r.primitives,usage:n.STORAGE|n.COPY_DST}),o=this.device.createBuffer({id:`${t}-ray-tracing-triangles`,data:r.triangles,usage:n.STORAGE|n.COPY_DST}),s=this.device.createBuffer({id:`${t}-ray-tracing-lights`,data:r.lights,usage:n.STORAGE|n.COPY_DST}),c=Math.max(1,Math.floor(a.byteLength/(Up*Float32Array.BYTES_PER_ELEMENT))),l=2**Math.ceil(Math.log2(c)),u=l*2-1,d=this.device.createBuffer({id:`${t}-ray-tracing-node-minima`,byteLength:u*3*Float32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),f=this.device.createBuffer({id:`${t}-ray-tracing-node-maxima`,byteLength:u*3*Float32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),p=this.device.createBuffer({id:`${t}-ray-tracing-node-children`,byteLength:u*2*Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),m=this.device.createBuffer({id:`${t}-ray-tracing-leaf-ids`,byteLength:l*Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),h=this.device.createBuffer({id:`${t}-ray-tracing-sorted-primitive-ids`,data:new Uint32Array(l).fill(am),usage:n.STORAGE}),g=this.device.createBuffer({id:`${t}-ray-tracing-blas-nodes`,byteLength:Math.max(1,e.topology.blasNodeCount)*Gp*Float32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),_=this.device.createBuffer({id:`${t}-ray-tracing-blas-triangle-ids`,data:new Uint32Array(Math.max(1,e.topology.blasTriangleIdCount)).fill(am),usage:n.STORAGE}),v=this.device.createBuffer({id:`${t}-ray-tracing-bvh-count`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),y=this.device.createBuffer({id:`${t}-ray-tracing-bvh-overflow`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),b=qm(e.displayWidth,e.displayHeight,e.quality.resolutionScale),x=this.createTextureHistory(t,`history`,b.width,b.height),S=this.createTextureHistory(t,`history-metadata`,b.width,b.height),C=this.createTopologyGraph({frameIdentifier:t,topology:e.topology,triangleBuffer:o,blasNodesBuffer:g,blasTriangleIdsBuffer:_}),w=this.createAccelerationGraph({frameIdentifier:t,uniformBuffer:i,primitiveBuffer:a,blasNodesBuffer:g,primitiveCapacity:c,leafCapacity:l,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:p,leafIdsBuffer:m,sortedPrimitiveIdsBuffer:h,bvhCountBuffer:v,bvhOverflowBuffer:y}),T=this.createRefitGraph({frameIdentifier:t,uniformBuffer:i,primitiveBuffer:a,blasNodesBuffer:g,primitiveCapacity:c,leafCapacity:l,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:p,leafIdsBuffer:m,sortedPrimitiveIdsBuffer:h,bvhCountBuffer:v,bvhOverflowBuffer:y}),E=this.createTraceGraph({frameIdentifier:t,internalWidth:b.width,internalHeight:b.height,presentation:e.presentation,uniformBuffer:i,primitiveBuffer:a,triangleBuffer:o,lightBuffer:s,nodeMinimaBuffer:d,nodeMaximaBuffer:f,sortedPrimitiveIdsBuffer:h,blasNodesBuffer:g,blasTriangleIdsBuffer:_,colorHistory:x,metadataHistory:S});return{displayWidth:e.displayWidth,displayHeight:e.displayHeight,presentation:e.presentation,internalWidth:b.width,internalHeight:b.height,resolutionScale:e.quality.resolutionScale,requestedResolutionScale:e.quality.requestedResolutionScale,minimumResolutionScale:e.quality.minimumResolutionScale,adaptiveResolution:e.quality.adaptiveResolution,targetFrameTimeMilliseconds:e.quality.targetFrameTimeMilliseconds,phaseCount:1,phaseIndex:0,overBudgetFrameCount:0,underBudgetFrameCount:0,lastBudgetAdjustmentTimeMilliseconds:0,uniformBuffer:i,primitiveBuffer:a,triangleBuffer:o,lightBuffer:s,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:p,leafIdsBuffer:m,sortedPrimitiveIdsBuffer:h,blasNodesBuffer:g,blasTriangleIdsBuffer:_,bvhCountBuffer:v,bvhOverflowBuffer:y,colorHistory:x,metadataHistory:S,topologyGraph:C,accelerationGraph:w,refitGraph:T,traceGraph:E,topologyRevision:``,primitiveRevision:``,transformRevision:``,lightRevision:``,renderRevision:``,geometryLayouts:e.topology.geometryLayouts,retainedSurfaces:e.surfaces,previousTransforms:e.primitiveData.previousTransforms,primitivePlacements:e.primitiveData.placements,pendingPreviousTransformInstanceIds:new Set,previousTransformsNeedCommit:!1,previousViewProjection:new P(e.viewProjection),previousCameraPosition:Array.from(e.cameraPosition),historyNeedsReset:!0,topologyNeedsUpdate:!0,accelerationUpdateMode:`rebuild`,refitsSinceMortonRebuild:0,frameIndex:0,accumulatedFrameCount:0,primitiveCount:r.primitiveCount,primitiveCapacity:c,leafCapacity:l,lightCount:r.lightCount,triangleCount:r.triangleCount}}recreateTraceResources(e,t,n,r,i,a,o){t.traceGraph.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),t.colorHistory=this.createTextureHistory(e,`history`,i,a),t.metadataHistory=this.createTextureHistory(e,`history-metadata`,i,a),t.traceGraph=this.createTraceGraph({frameIdentifier:e,internalWidth:i,internalHeight:a,presentation:o,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory}),t.displayWidth=n,t.displayHeight=r,t.presentation=o,t.internalWidth=i,t.internalHeight=a,t.phaseIndex=0,t.historyNeedsReset=!0}recreateTraceGraph(e,t,n){let r=this.createTraceGraph({frameIdentifier:e,internalWidth:t.internalWidth,internalHeight:t.internalHeight,presentation:n,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory});t.traceGraph.destroy(),t.traceGraph=r,t.presentation=n}createTextureHistory(e,t,n,r){return new of(this.device,{id:`${e}-ray-tracing-${t}`,width:n,height:r,format:`rgba16float`,usage:v.SAMPLE|v.STORAGE})}createTopologyGraph(e){let t=new Id(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-topology`}),n=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),r=Math.max(1,e.topology.triangleCount),i=Math.max(1,e.topology.blasNodeCount),a=Math.max(1,e.topology.blasTriangleIdCount),o=H(t,`triangle-minima`,`float32x3`,r),s=H(t,`triangle-maxima`,`float32x3`,r),c=H(t,`blas-morton-keys`,`uint32`,a),l=H(t,`blas-local-triangle-ids`,`uint32`,a),u=H(t,`blas-sorted-morton-keys`,`uint32`,a),d=G(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,a),f=H(t,`blas-sorted-minima`,`float32x3`,r),p=H(t,`blas-sorted-maxima`,`float32x3`,r),m=H(t,`blas-node-minima`,`float32x3`,i),h=H(t,`blas-node-maxima`,`float32x3`,i),g=H(t,`blas-node-children`,`uint32x2`,i),_=H(t,`blas-leaf-ids`,`uint32`,a),v=G(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,i*2),y=Math.max(1,e.topology.geometryLayouts.size),b=H(t,`blas-counts`,`uint32`,y),x=H(t,`blas-overflows`,`uint32`,y);t.addComputePass({id:`${e.frameIdentifier}-build-triangle-bounds`,resources:[{buffer:n,usage:`storage-read`},{buffer:o,usage:`storage-write`},{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-triangle-bounds-computation`,source:Vm(fm,{TRIANGLE_COUNT:e.topology.triangleCount}),shaderLayout:{bindings:[{name:`triangles`,type:`read-only-storage`,group:0,location:0},{name:`triangleMinima`,type:`storage`,group:0,location:1},{name:`triangleMaxima`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangles:t(n),triangleMinima:B(o,t),triangleMaxima:B(s,t)}),i.dispatch(e,Math.ceil(r/128))},destroy:()=>i.destroy()}}});let S=[],C=[],w=[];for(let[n,r]of Array.from(e.topology.geometryLayouts.values()).entries()){if(r.triangleCount===0)continue;let i=r.blasLeafCapacity*2-1,a=W(t,o,`float32x3`,r.triangleStart,r.triangleCount),y=W(t,s,`float32x3`,r.triangleStart,r.triangleCount),T=W(t,c,`uint32`,r.blasTriangleIdStart,r.triangleCount),E=W(t,l,`uint32`,r.blasTriangleIdStart,r.triangleCount),D=W(t,u,`uint32`,r.blasTriangleIdStart,r.triangleCount),O=W(t,d,`uint32`,r.blasTriangleIdStart,r.triangleCount),k=W(t,f,`float32x3`,r.triangleStart,r.triangleCount),A=W(t,p,`float32x3`,r.triangleStart,r.triangleCount),j=W(t,m,`float32x3`,r.blasNodeStart,i),ee=W(t,h,`float32x3`,r.blasNodeStart,i),te=W(t,g,`uint32x2`,r.blasNodeStart,i),ne=W(t,_,`uint32`,r.blasTriangleIdStart,r.blasLeafCapacity),re=W(t,v,`float32x4`,r.blasNodeStart*2,i*2),ie=W(t,b,`uint32`,n,1),ae=W(t,x,`uint32`,n,1),oe=r.triangleCount<=256;if(r.triangleCount>0){let o=H(t,`blas-${n}-scene-bounds`,`uint32`,6);if(t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-initialize-scene-bounds`,resources:[{buffer:o,usage:`storage-write`}],compile:({device:t})=>{let r=new I(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-initialize-computation`,source:cm,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({sceneBounds:B(o,t)}),r.dispatch(e,1)},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-reduce-computation`,source:Vm(pm,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:V(a),MAXIMA_OFFSET:V(y)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:B(a,t),triangleMaxima:B(y,t),sceneBounds:B(o,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:T,usage:`storage-write`},{buffer:E,usage:`storage-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-blas-${n}-morton-keys-computation`,source:Vm(mm,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:V(a),MAXIMA_OFFSET:V(y),MORTON_KEYS_OFFSET:V(T),TRIANGLE_IDS_OFFSET:V(E)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`triangleIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:B(a,t),triangleMaxima:B(y,t),sceneBounds:B(o,t),mortonKeys:B(T,t),triangleIds:B(E,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),oe){let e=r.blasTriangleIdStart;S.push({keysOffset:e,valuesOffset:e,outputKeysOffset:e,outputValuesOffset:e,length:r.triangleCount})}else new $f({id:`${e.frameIdentifier}-blas-${n}-sort-triangle-morton-keys`,keys:T,values:E,outputKeys:D,outputValues:O}).addToGraph(t);let s=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:O,usage:`storage-read`},{buffer:k,usage:`storage-write`},{buffer:A,usage:`storage-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds-computation`,source:Vm(hm,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:V(a),MAXIMA_OFFSET:V(y),SORTED_TRIANGLE_IDS_OFFSET:V(O),SORTED_MINIMA_OFFSET:V(k),SORTED_MAXIMA_OFFSET:V(A)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedTriangleIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:B(a,t),triangleMaxima:B(y,t),sortedTriangleIds:B(O,t),sortedMinima:B(k,t),sortedMaxima:B(A,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}})},c=()=>{new bp({id:`${e.frameIdentifier}-blas-${n}-bvh`,minima:k,maxima:A,leafCapacity:r.blasLeafCapacity,nodeMinima:j,nodeMaxima:ee,nodeChildren:te,leafIds:ne,count:ie,overflow:ae}).addToGraph(t)},l=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-pack-nodes`,resources:[{buffer:j,usage:`storage-read`},{buffer:ee,usage:`storage-read`},{buffer:re,usage:`storage-write`}],compile:({device:t})=>{let r=new I(t,{id:`${e.frameIdentifier}-blas-${n}-pack-nodes-computation`,source:Vm(gm,{NODE_COUNT:i,NODE_MINIMA_OFFSET:V(j),NODE_MAXIMA_OFFSET:V(ee),PACKED_NODES_OFFSET:V(re)}),shaderLayout:{bindings:[{name:`nodeMinima`,type:`read-only-storage`,group:0,location:0},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:1},{name:`packedNodes`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({nodeMinima:B(j,t),nodeMaxima:B(ee,t),packedNodes:B(re,t)}),r.dispatch(e,Math.ceil(i/128))},destroy:()=>r.destroy()}}})};if(oe){let e=r.blasLeafCapacity<=128;e&&C.push({sourceOffset:r.triangleStart,sourceCount:r.triangleCount,nodeOffset:r.blasNodeStart,leafOffset:r.blasTriangleIdStart,metadataOffset:n,leafCapacity:r.blasLeafCapacity}),w.push({addGatherPass:s,addHierarchyPass:c,addPackPass:l,usesSegmentedHierarchy:e})}else s(),c(),l()}}if(S.length>0){new Rf({id:`${e.frameIdentifier}-blas-sort-triangle-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d,segments:S}).addToGraph(t);for(let e of w)e.addGatherPass();C.length>0&&new jp({id:`${e.frameIdentifier}-blas-bvh`,minima:f,maxima:p,nodeMinima:m,nodeMaxima:h,nodeChildren:g,leafIds:_,counts:b,overflows:x,segments:C}).addToGraph(t);for(let e of w)e.usesSegmentedHierarchy||e.addHierarchyPass(),e.addPackPass()}return t.compile()}createAccelerationGraph(e){let t=new Id(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-acceleration`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=H(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=H(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=H(t,`scene-bounds`,`uint32`,6),c=H(t,`primitive-morton-keys`,`uint32`,e.primitiveCapacity),l=H(t,`primitive-ids`,`uint32`,e.primitiveCapacity),u=H(t,`sorted-primitive-morton-keys`,`uint32`,e.primitiveCapacity),d=G(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),f=H(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),p=H(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),m=e.leafCapacity*2-1,h=G(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,m),g=G(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,m),_=G(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,m),v=G(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),y=new bp({id:`${e.frameIdentifier}-ray-tracing-bvh`,minima:f,maxima:p,leafCapacity:e.leafCapacity,nodeMinima:h,nodeMaxima:g,nodeChildren:_,leafIds:v,count:G(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:G(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-build-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new I(t,{id:`${e.frameIdentifier}-primitive-bounds-computation`,source:zp,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:B(a,c),primitiveMaxima:B(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-initialize-scene-bounds`,resources:[{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-scene-bounds-initialize-computation`,source:cm,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{n.setBindings({sceneBounds:B(s,t)}),n.dispatch(e,1)},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-scene-bounds-reduce-computation`,source:lm.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:B(a,r),primitiveMaxima:B(o,r),sceneBounds:B(s,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-morton-keys-computation`,source:um.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`primitiveIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:B(a,r),primitiveMaxima:B(o,r),sceneBounds:B(s,r),mortonKeys:B(c,r),primitiveIds:B(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),new $f({id:`${e.frameIdentifier}-sort-primitive-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d}).addToGraph(t),t.addComputePass({id:`${e.frameIdentifier}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:d,usage:`storage-read`},{buffer:f,usage:`storage-write`},{buffer:p,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-gather-sorted-bounds-computation`,source:dm.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:B(a,r),primitiveMaxima:B(o,r),sortedPrimitiveIds:B(d,r),sortedMinima:B(f,r),sortedMaxima:B(p,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),y.addToGraph(t),t.compile()}createRefitGraph(e){let t=new Id(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-refit`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=H(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=H(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=G(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),c=H(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),l=H(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),u=e.leafCapacity*2-1,d=G(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,u),f=G(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,u),p=G(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,u),m=G(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),h=new bp({id:`${e.frameIdentifier}-ray-tracing-refit-bvh`,minima:c,maxima:l,leafCapacity:e.leafCapacity,nodeMinima:d,nodeMaxima:f,nodeChildren:p,leafIds:m,count:G(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:G(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-refit-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new I(t,{id:`${e.frameIdentifier}-refit-primitive-bounds-computation`,source:zp,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:B(a,c),primitiveMaxima:B(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-refit-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-refit-gather-sorted-bounds-computation`,source:dm.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:B(a,r),primitiveMaxima:B(o,r),sortedPrimitiveIds:B(s,r),sortedMinima:B(c,r),sortedMaxima:B(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),h.addToGraph(t),t.compile()}createTraceGraph(e){let t=new Id(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-trace`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),a=t.importBuffer({id:`lights`,byteLength:e.lightBuffer.byteLength,usage:e.lightBuffer.usage},e.lightBuffer),o=Math.max(1,Math.floor(e.nodeMinimaBuffer.byteLength/(3*Float32Array.BYTES_PER_ELEMENT))),s=G(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,o),c=G(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,o),l=G(t,`leaf-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,Math.max(1,Math.floor(e.sortedPrimitiveIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),u=G(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,Math.max(1,Math.floor(e.blasNodesBuffer.byteLength/(4*Float32Array.BYTES_PER_ELEMENT)))),d=G(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,Math.max(1,Math.floor(e.blasTriangleIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),f=t.importTexture({id:`history`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.colorHistory.previousTexture),p=t.importTexture({id:`history-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.metadataHistory.previousTexture),m=t.importTexture({id:`output`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.colorHistory.currentTexture),h=t.importTexture({id:`output-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.metadataHistory.currentTexture),g=t.createTextureView(f),_=t.createTextureView(p),y=t.createTextureView(m),b=t.createTextureView(h);return t.addComputePass({id:`${e.frameIdentifier}-carry-ray-tracing-history`,resources:[{buffer:n,usage:`uniform`},{texture:g,usage:`sampled`},{texture:_,usage:`sampled`},{texture:y,usage:`storage-write`},{texture:b,usage:`storage-write`}],compile:({device:t})=>{let r=new I(t,{id:`${e.frameIdentifier}-ray-tracing-history-carry-computation`,source:Bp,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`historyImage`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:2,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:3,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:4,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:i,getTextureView:a,parameters:o})=>{o.carryWidth!==0&&(r.setBindings({uniforms:i(n),historyImage:a(g),historyMetadata:a(_),outputImage:a(y),outputMetadata:a(b)}),r.dispatch(t,Math.ceil(o.carryWidth/8),Math.ceil(e.internalHeight/8),1))},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-trace-rays`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-read`},{buffer:l,usage:`storage-read`},{buffer:u,usage:`storage-read`},{buffer:d,usage:`storage-read`},{texture:g,usage:`sampled`},{texture:_,usage:`sampled`},{texture:y,usage:`storage-write`},{texture:b,usage:`storage-write`}],compile:({device:t})=>{let o=new I(t,{id:`${e.frameIdentifier}-ray-tracing-computation`,source:Vp,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`triangles`,type:`read-only-storage`,group:0,location:2},{name:`lights`,type:`read-only-storage`,group:0,location:3},{name:`nodeMinima`,type:`read-only-storage`,group:0,location:4},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:5},{name:`leafPrimitiveIds`,type:`read-only-storage`,group:0,location:6},{name:`blasNodes`,type:`read-only-storage`,group:0,location:7},{name:`blasTriangleIds`,type:`read-only-storage`,group:0,location:8},{name:`historyImage`,type:`texture`,group:0,location:9,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:10,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:11,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:12,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:f,getTextureView:p,parameters:m})=>{o.setBindings({uniforms:f(n),primitives:f(r),triangles:f(i),lights:f(a),nodeMinima:B(s,f),nodeMaxima:B(c,f),leafPrimitiveIds:B(l,f),blasNodes:B(u,f),blasTriangleIds:B(d,f),historyImage:p(g),historyMetadata:p(_),outputImage:p(y),outputMetadata:p(b)}),o.dispatch(t,Math.ceil(m.dispatchWidth/8),Math.ceil(e.internalHeight/8),1)},destroy:()=>o.destroy()}}}),t.addRenderPass({id:`${e.frameIdentifier}-present-ray-tracing`,resources:[{texture:y,usage:`sampled`}],compile:({device:t})=>{let n=new us(t,{id:`${e.frameIdentifier}-ray-tracing-presentation`,source:Hp({toneMapMode:e.presentation.toneMapMode,outputEncoding:e.presentation.outputEncoding}),vertexCount:3,colorAttachmentFormats:[e.presentation.colorFormat],...e.presentation.depthStencilFormat?{depthStencilAttachmentFormat:e.presentation.depthStencilFormat}:{},shaderLayout:{attributes:[],bindings:[{name:`image`,type:`texture`,group:0,location:0,sampleType:`unfilterable-float`}]},parameters:{depthWriteEnabled:!1,...e.presentation.depthStencilFormat?{depthCompare:`always`}:{}}});return{getRenderPassProps:({parameters:t})=>({id:`${e.frameIdentifier}-present-ray-tracing`,...t.framebuffer?{framebuffer:t.framebuffer}:{}}),encode:({renderPass:e,getTextureView:t})=>{n.setBindings({image:t(y)}),n.draw(e)},destroy:()=>n.destroy()}}}),t.compile()}};function vm(e,t){if(t.framebuffer)return[t.framebuffer.width,t.framebuffer.height];if(t.width!==void 0&&t.height!==void 0)return[t.width,t.height];let[n,r]=e.getDefaultCanvasContext().getDrawingBufferSize();return[t.width??n,t.height??r]}function ym(e,t){let n=t.framebuffer?.colorAttachments[0]?.texture.format??e.preferredColorFormat,r=!!(f.getInfo(n).dataType?.startsWith(`float`)||n.endsWith(`ufloat`)),i=t.framebuffer?t.framebuffer.depthStencilAttachment?.texture.format:`depth24plus`;return{colorFormat:n,...i?{depthStencilFormat:i}:{},toneMapMode:t.toneMapMode??(r?uo.NONE:uo.KHRONOS_PBR_NEUTRAL),outputEncoding:t.outputColorSpace?Number(t.outputColorSpace===`srgb`):Number(!r&&!n.endsWith(`-srgb`))}}function bm(e,t){return e.colorFormat===t.colorFormat&&e.depthStencilFormat===t.depthStencilFormat&&e.toneMapMode===t.toneMapMode&&e.outputEncoding===t.outputEncoding}function xm(e){return{nodeCount:e.nodeCount,computePassCount:e.computePassCount,coalescedComputeNodeCount:e.coalescedComputeNodeCount,cpuEncodeTimeMilliseconds:e.cpuEncodeTimeMilliseconds}}function Sm(e){let t=e.topology&&xm(e.topology),n=e.acceleration&&xm(e.acceleration),r=e.refit&&xm(e.refit),i=xm(e.trace),a=[t,n,r,i].filter(e=>!!e);return{nodeCount:a.reduce((e,t)=>e+t.nodeCount,0),computePassCount:a.reduce((e,t)=>e+t.computePassCount,0),coalescedComputeNodeCount:a.reduce((e,t)=>e+t.coalescedComputeNodeCount,0),cpuEncodeTimeMilliseconds:a.reduce((e,t)=>e+t.cpuEncodeTimeMilliseconds,0),...t?{topology:t}:{},...n?{acceleration:n}:{},...r?{refit:r}:{},trace:i}}function Cm(e){return Math.max(1,Math.floor(e.primitiveCount*sm))}function wm(e,t,n,r){let i=e.sceneRevisions,a=i?.dirtyInstanceIds;if(n||!r||!i||!a||a.length===0||e.surfaces!==t.retainedSurfaces||t.materialRevision!==i.materials)return;let o=Array.from(new Set(a));if(!(o.length>Cm(t)||o.some(n=>{let r=t.primitivePlacements.get(n);return!r||e.surfaces[r.surfaceIndex]!==r.surface||r.surface.instanceIds?.[r.transformIndex]!==n})))return o}function Tm(e,t){let n=new Set(t);for(let t of e.pendingPreviousTransformInstanceIds){if(n.has(t))continue;let r=e.primitivePlacements.get(t);if(!r)continue;let i=e.previousTransforms.get(r.placementIdentifier);i&&e.primitiveBuffer.write(Float32Array.from(i),(r.primitiveIndex*Up+52)*Float32Array.BYTES_PER_ELEMENT)}for(let t of n){let n=e.primitivePlacements.get(t);if(!n)continue;let r=n.surface.transforms[n.transformIndex],i=e.previousTransforms.get(n.placementIdentifier)??r,a=new Float32Array(32);a.set(r),a.set(new P(r).invert(),16);let o=n.primitiveIndex*Up*Float32Array.BYTES_PER_ELEMENT;e.primitiveBuffer.write(a,o),e.primitiveBuffer.write(Float32Array.from(i),o+52*Float32Array.BYTES_PER_ELEMENT),e.previousTransforms.set(n.placementIdentifier,new P(r))}e.pendingPreviousTransformInstanceIds=n,e.previousTransformsNeedCommit=n.size>0}function Em(e){e.accelerationUpdateMode!==`rebuild`&&(e.accelerationUpdateMode=e.refitsSinceMortonRebuild>=om?`rebuild`:`refit`)}function Dm(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.topology}`:JSON.stringify(e.surfaces.map(t=>[t.id,t.geometry.id,t.geometryVersion,t.transforms.length,t.morphWeights,e.primitives?.[t.id]]))}function Om(e,t){return e.sceneRevisions?`${t}:${e.sceneRevisions.materials}`:JSON.stringify([t,e.surfaces.map(t=>[t.material.id,t.material.version,t.material.uniforms,e.primitives?.[t.id]])])}function km(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.transforms}`:JSON.stringify(e.surfaces.map(e=>[e.id,e.transforms.map(e=>Array.from(e)),e.instanceIds]))}function Am(e,t){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.lights}`:JSON.stringify(t)}function jm(e,t){let n=e.temporalReprojection??!0?void 0:[Array.from(t),Array.from(e.camera.position)];return JSON.stringify([e.cameraProjection,n,e.background,e.exposure,e.fogColor,e.fogDensity,e.samplesPerPixel,e.maxBounces,e.progressive,e.shadows,e.temporalReprojection,e.shadowSamplesPerFrame])}function Mm(e,t,n){let r=[],i=new Map,a=0,o=0;for(let s of e){if(t[s.id]?.type===`sphere`)continue;let e=Im(s);if(i.has(e))continue;let c=Fm(s,n),l=r.length/Wp,u=Hm(Math.max(1,c.triangleCount)),d=u*2-1;for(let e of c.triangles)r.push(e);i.set(e,{triangleStart:l,triangleCount:c.triangleCount,blasNodeStart:a,blasTriangleIdStart:o,blasInternalNodeCount:u-1,blasLeafCapacity:u,bounds:c.bounds}),a+=d,o+=u}return{triangles:zm(r,Wp),geometryLayouts:i,triangleCount:r.length/Wp,blasNodeCount:a,blasTriangleIdCount:o}}function Nm(e,t,n,r){let i=e.reduce((e,t)=>e+t.transforms.length,0),a=new Float32Array(Math.max(i,1)*Up),o=new Map,s=new Map,c=0,l=0;for(let[i,u]of e.entries()){let e=t[u.id],d=e?.type===`sphere`?e.radius:0,f=d>0?void 0:n.get(Im(u)),p=f?.bounds??[0,0,0,d],m=u.material.uniforms,h=m?.baseColorFactor??[.8,.8,.8,1],g=m?.emissiveFactor??[0,0,0],_=m?.emissiveStrength??1,v=m?.metallicRoughnessValues??[0,.5],y=u.instanceIds;for(let e=0;e<u.transforms.length;e++){let t=u.transforms[e],n=new P(t).invert(),m=y?.[e]??String(e),b=`${u.id}:${m}`,x=r.get(b)??t,S=c*Up;a.set(t,S),a.set(n,S+16),a[S+32]=h[0],a[S+33]=h[1],a[S+34]=h[2],a[S+35]=h[3]??1,a[S+36]=g[0]*_,a[S+37]=g[1]*_,a[S+38]=g[2]*_,a[S+39]=v[0],a[S+40]=v[1],a[S+41]=d,a[S+42]=f?.triangleStart??0,a[S+43]=f?.triangleCount??0,a[S+44]=p[0],a[S+45]=p[1],a[S+46]=p[2],a[S+47]=p[3],a[S+48]=f?.blasNodeStart??0,a[S+49]=f?.blasTriangleIdStart??0,a[S+50]=f?.blasInternalNodeCount??0,a[S+51]=f?.blasLeafCapacity??0,a.set(x,S+52),o.set(b,new P(t)),s.set(y?.[e]??b,{surface:u,surfaceIndex:i,transformIndex:e,primitiveIndex:c,placementIdentifier:b}),c++,l+=f?.triangleCount??0}}return{primitives:a,primitiveCount:i,triangleCount:l,previousTransforms:o,placements:s}}function Pm(e,t,n){return{primitives:e.primitives,triangles:t,lights:Rm(n),primitiveCount:e.primitiveCount,lightCount:n.length,triangleCount:e.triangleCount}}function Fm(e,t){let n=Im(e),r=t.get(n);if(r)return r;let i=e.geometry,a=i.attributes.POSITION?.value,o=i.attributes.NORMAL?.value;if(!a||!o)throw Error(`Ray tracing scene geometry requires positions and normals.`);let s=[],c=Lm(i),l=i.indices?.value,u=l?.length??a.length/3;for(let e=0;e+2<u;e+=3){for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(a[n]),Number(a[n+1]),Number(a[n+2]),0)}for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(o[n]),Number(o[n+1]),Number(o[n+2]),0)}}let d={triangles:new Float32Array(s),triangleCount:s.length/Wp,bounds:c};return t.set(n,d),d}function Im(e){return`${e.geometry.id}:${e.geometryVersion??0}`}function Lm(e){let t=e.attributes.POSITION?.value;if(!t||t.length===0)return[0,0,0,0];let n=[1/0,1/0,1/0],r=[-1/0,-1/0,-1/0];for(let e=0;e+2<t.length;e+=3)for(let i=0;i<3;i++){let a=Number(t[e+i]);n[i]=Math.min(n[i],a),r[i]=Math.max(r[i],a)}let i=n.map((e,t)=>(e+r[t])*.5),a=0;for(let e=0;e+2<t.length;e+=3){let n=(Number(t[e])-i[0])**2+(Number(t[e+1])-i[1])**2+(Number(t[e+2])-i[2])**2;a=Math.max(a,n)}return[i[0],i[1],i[2],Math.sqrt(a)+1e-4]}function Rm(e){let t=[];for(let n of e){let e=n.color??[1,1,1],r=n.intensity??1,i=n.type===`point`||n.type===`spot`?n.position:[0,0,0],a=n.type===`directional`||n.type===`spot`?n.direction:[0,-1,0],o=n.type===`point`||n.type===`spot`?n.attenuation??[1,0,0]:[1,0,0],s=n.type===`ambient`?0:n.type===`directional`?1:n.type===`point`?2:3,c=n.type===`spot`?Math.cos(n.innerConeAngle??.35):1,l=n.type===`spot`?Math.cos(n.outerConeAngle??.5):0;t.push(e[0],e[1],e[2],r,i[0],i[1],i[2],c,a[0],a[1],a[2],s,o[0],o[1],o[2],l)}return zm(t,Kp)}function zm(e,t){return e.length>0?new Float32Array(e):new Float32Array(t)}function Bm(e){let t=new Float32Array(qp),n=new Uint32Array(t.buffer),r=e.options.background??[.015,.018,.038,1],i=e.options.fogColor??[.025,.035,.075];return t.set(e.inverseViewProjection,0),t.set(e.options.camera.position,16),t[19]=e.options.cameraProjection===`orthographic`?1:0,t.set(r,20),n[24]=e.internalWidth,n[25]=e.internalHeight,n[26]=e.primitiveCount,n[27]=e.lightCount,t[28]=e.options.exposure??1.35,t[29]=e.accumulatedFrameCount,t[30]=e.options.samplesPerPixel??1,t[31]=e.options.shadows??!0?1:0,t.set(i,32),t[35]=e.options.fogDensity??0,n[36]=e.leafCapacity-1,n[37]=e.leafCapacity,n[38]=e.primitiveCapacity,n[39]=e.frameIndex,n[40]=e.displayWidth,n[41]=e.displayHeight,n[42]=e.phaseIndex,n[43]=e.phaseCount,t[44]=e.resolutionScale,t[45]=e.directLightCount,t[46]=e.options.shadowSamplesPerFrame??1,t[47]=e.options.temporalReprojection??!0?1:0,t.set(e.previousViewProjection,48),t.set(e.previousCameraPosition,64),t[67]=e.options.progressive??!0?1:0,t}function W(e,t,n,r,i){return e.createDataView(t.buffer,{format:n,length:i,byteOffset:t.byteOffset+r*t.byteStride})}function G(e,t,n,r,i){let a=e.importBuffer({id:t,byteLength:n.byteLength,usage:n.usage},n);return e.createDataView(a,{format:r,length:i})}function Vm(e,t){let n=e;for(let[e,r]of Object.entries(t))n=n.replaceAll(`__${e}__`,String(r));return n}function Hm(e){return 2**Math.ceil(Math.log2(Math.max(1,e)))}function Um(e){let t=e.adaptiveResolution??!0,n=Xm(e.minimumResolutionScale??Yp,.125,1),r=Xm(e.resolutionScale??Jp,n,1);return{resolutionScale:r,requestedResolutionScale:r,minimumResolutionScale:n,adaptiveResolution:t,targetFrameTimeMilliseconds:Math.max(1,e.targetFrameTimeMilliseconds??Xp)}}function Wm(e,t){return e.minimumResolutionScale===t.minimumResolutionScale&&e.adaptiveResolution===t.adaptiveResolution&&e.targetFrameTimeMilliseconds===t.targetFrameTimeMilliseconds&&e.requestedResolutionScale===t.requestedResolutionScale?!1:(e.resolutionScale=t.resolutionScale,e.requestedResolutionScale=t.requestedResolutionScale,e.minimumResolutionScale=t.minimumResolutionScale,e.adaptiveResolution=t.adaptiveResolution,e.targetFrameTimeMilliseconds=t.targetFrameTimeMilliseconds,e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0,e.averageFrameTimeMilliseconds=void 0,!0)}function Gm(e,t){let n=e.lastRenderTimeMilliseconds;if(e.lastRenderTimeMilliseconds=t,n===void 0)return;let r=t-n;r<=0||r>1e3||(e.averageFrameTimeMilliseconds=e.averageFrameTimeMilliseconds===void 0?r:e.averageFrameTimeMilliseconds*.8+r*.2)}function Km(e,t){if(e.historyNeedsReset){e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0;return}if(!e.adaptiveResolution||e.averageFrameTimeMilliseconds===void 0)return;let n=e.averageFrameTimeMilliseconds,r=e.targetFrameTimeMilliseconds;if(n>r*$p?(e.overBudgetFrameCount=Math.min(tm,e.overBudgetFrameCount+1),e.underBudgetFrameCount=0):n<r*em?(e.underBudgetFrameCount=Math.min(nm,e.underBudgetFrameCount+1),e.overBudgetFrameCount=0):(e.overBudgetFrameCount=0,e.underBudgetFrameCount=0),!(t-e.lastBudgetAdjustmentTimeMilliseconds<Qp)){if(e.overBudgetFrameCount>=tm){let n=Jm(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,-1);if(n<e.resolutionScale)e.resolutionScale=n,e.historyNeedsReset=!0;else if(e.accumulatedFrameCount>=rm)e.phaseCount=Math.min(4,e.phaseCount*2),e.phaseIndex%=e.phaseCount;else return;e.overBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t;return}if(e.underBudgetFrameCount>=nm){if(e.phaseCount>1)e.phaseCount=Math.max(1,e.phaseCount/2),e.phaseIndex%=e.phaseCount;else{let t=Jm(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,1);if(t<=e.resolutionScale){e.underBudgetFrameCount=0;return}e.resolutionScale=t,e.historyNeedsReset=!0}e.underBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t}}}function qm(e,t,n){return{width:Math.max(1,Math.ceil(e*n)),height:Math.max(1,Math.ceil(t*n))}}function Jm(e,t,n,r){let i=Ym(t,n),a=i.findIndex(t=>t>=e-1e-4),o=a<0?i.length-1:a;return i[Math.max(0,Math.min(i.length-1,o+r))]}function Ym(e,t){let n=[e,...Zp.filter(n=>n>e&&n<t),t].sort((e,t)=>e-t);return n.filter((e,t)=>t===0||Math.abs(e-n[t-1])>1e-4)}function Xm(e,t,n){return Math.max(t,Math.min(n,Number.isFinite(e)?e:t))}function Zm(e){return Math.max(1,Math.min(16,Math.floor(e.samplesPerPixel??1)))}function Qm(e,t,n,r){let i=0;for(let n=0;n<16;n++)i=Math.max(i,Math.abs(Number(e[n])-Number(t[n])));let a=Math.hypot(Number(n[0]??0)-Number(r[0]??0),Number(n[1]??0)-Number(r[1]??0),Number(n[2]??0)-Number(r[2]??0));return i>.75||a>4}function $m(){return globalThis.performance?.now()??Date.now()}var eh=new P,th=[1,0,0,0,1,0,0,0,1],nh=[{parameter:`baseColorTexture`,binding:`pbr_baseColorSampler`,enabled:`baseColorMapEnabled`,textureCoordinateSet:`baseColorUVSet`,transform:`baseColorUVTransform`},{parameter:`normalTexture`,binding:`pbr_normalSampler`,enabled:`normalMapEnabled`,textureCoordinateSet:`normalUVSet`,transform:`normalUVTransform`},{parameter:`metallicRoughnessTexture`,binding:`pbr_metallicRoughnessSampler`,enabled:`metallicRoughnessMapEnabled`,textureCoordinateSet:`metallicRoughnessUVSet`,transform:`metallicRoughnessUVTransform`},{parameter:`emissiveTexture`,binding:`pbr_emissiveSampler`,enabled:`emissiveMapEnabled`,textureCoordinateSet:`emissiveUVSet`,transform:`emissiveUVTransform`},{parameter:`occlusionTexture`,binding:`pbr_occlusionSampler`,enabled:`occlusionMapEnabled`,textureCoordinateSet:`occlusionUVSet`,transform:`occlusionUVTransform`},{parameter:`specularColorTexture`,binding:`pbr_specularColorSampler`,enabled:`specularColorMapEnabled`,textureCoordinateSet:`specularColorUVSet`,transform:`specularColorUVTransform`},{parameter:`specularIntensityTexture`,binding:`pbr_specularIntensitySampler`,enabled:`specularIntensityMapEnabled`,textureCoordinateSet:`specularIntensityUVSet`,transform:`specularIntensityUVTransform`},{parameter:`transmissionTexture`,binding:`pbr_transmissionSampler`,enabled:`transmissionMapEnabled`,textureCoordinateSet:`transmissionUVSet`,transform:`transmissionUVTransform`},{parameter:`thicknessTexture`,binding:`pbr_thicknessSampler`,enabled:null,textureCoordinateSet:`thicknessUVSet`,transform:`thicknessUVTransform`},{parameter:`clearcoatTexture`,binding:`pbr_clearcoatSampler`,enabled:`clearcoatMapEnabled`,textureCoordinateSet:`clearcoatUVSet`,transform:`clearcoatUVTransform`},{parameter:`clearcoatRoughnessTexture`,binding:`pbr_clearcoatRoughnessSampler`,enabled:`clearcoatRoughnessMapEnabled`,textureCoordinateSet:`clearcoatRoughnessUVSet`,transform:`clearcoatRoughnessUVTransform`},{parameter:`clearcoatNormalTexture`,binding:`pbr_clearcoatNormalSampler`,enabled:null,textureCoordinateSet:`clearcoatNormalUVSet`,transform:`clearcoatNormalUVTransform`},{parameter:`sheenColorTexture`,binding:`pbr_sheenColorSampler`,enabled:`sheenColorMapEnabled`,textureCoordinateSet:`sheenColorUVSet`,transform:`sheenColorUVTransform`},{parameter:`sheenRoughnessTexture`,binding:`pbr_sheenRoughnessSampler`,enabled:`sheenRoughnessMapEnabled`,textureCoordinateSet:`sheenRoughnessUVSet`,transform:`sheenRoughnessUVTransform`},{parameter:`iridescenceTexture`,binding:`pbr_iridescenceSampler`,enabled:`iridescenceMapEnabled`,textureCoordinateSet:`iridescenceUVSet`,transform:`iridescenceUVTransform`},{parameter:`iridescenceThicknessTexture`,binding:`pbr_iridescenceThicknessSampler`,enabled:null,textureCoordinateSet:`iridescenceThicknessUVSet`,transform:`iridescenceThicknessUVTransform`},{parameter:`anisotropyTexture`,binding:`pbr_anisotropySampler`,enabled:`anisotropyMapEnabled`,textureCoordinateSet:`anisotropyUVSet`,transform:`anisotropyUVTransform`},{parameter:`bumpTexture`,binding:`pbr_bumpSampler`,enabled:`bumpMapEnabled`,textureCoordinateSet:`bumpUVSet`,transform:`bumpUVTransform`},{parameter:`diffuseTransmissionTexture`,binding:`pbr_diffuseTransmissionSampler`,enabled:`diffuseTransmissionMapEnabled`,textureCoordinateSet:`diffuseTransmissionUVSet`,transform:`diffuseTransmissionUVTransform`},{parameter:`diffuseTransmissionColorTexture`,binding:`pbr_diffuseTransmissionColorSampler`,enabled:`diffuseTransmissionColorMapEnabled`,textureCoordinateSet:`diffuseTransmissionColorUVSet`,transform:`diffuseTransmissionColorUVTransform`},{parameter:`multiscatterColorTexture`,binding:`pbr_multiscatterColorSampler`,enabled:`multiscatterColorMapEnabled`,textureCoordinateSet:`multiscatterColorUVSet`,transform:`multiscatterColorUVTransform`}],rh=class{geometries=new Map;materials=new Map;worlds=new Map;makeRenderOptions(e){let t=e.getParameter(`world`),n=e.getParameter(`camera`),r=e.getParameter(`renderer`);if(!t||!n||!r)return null;let[i,a]=oh(e,e.device.device),o=r.getParameter(`ambientRadiance`)??.12,s=r.getParameter(`toneMapMode`),c=r.getParameter(`outputColorSpace`),l=this.worlds.get(t);return l?this.updateCachedWorld(l,o):(l=this.createCachedWorld(t,o),this.worlds.set(t,l)),{id:e.id,surfaces:l.surfaces,sceneRevisions:{...l.revisions},camera:fh(n,i,a),lights:l.lights,background:r.getParameter(`background`)||[.015,.018,.038,1],width:i,height:a,environment:r.getParameter(`environment`),exposure:r.getParameter(`exposure`)??1.35,...s===void 0?{}:{toneMapMode:s},...c===void 0?{}:{outputColorSpace:c},fogColor:r.getParameter(`fogColor`)||[.025,.035,.075],fogDensity:r.getParameter(`fogDensity`)??0,renderMode:r.subtype===`debugNormals`?`debugNormals`:r.subtype===`debugDepth`?`debugDepth`:`default`}}getAnalyticPrimitives(e){let t=this.worlds.get(e);return t||(t=this.createCachedWorld(e,.12),this.worlds.set(e,t)),t.analyticPrimitives}destroy(){this.geometries.clear(),this.materials.clear(),this.worlds.clear()}createCachedWorld(e,t){let n={world:e,surfaces:[],surfaceEntries:[],lights:[],analyticPrimitives:{},ambientRadiance:t,observedCommitRevision:e.device.getSceneCommitRevision(),topologyObjectIds:new Set,lightObjectIds:new Set,instancePlacements:new Map,materialSurfaces:new Map,samplerMaterials:new Map,revisions:{identity:e.id,topology:0,transforms:0,materials:0,lights:0}};return this.rebuildCachedWorld(n,t),n}updateCachedWorld(e,t){let n=e.world.device.getSceneCommitRevision(),r=e.ambientRadiance!==t;if(n===e.observedCommitRevision&&!r)return;let i=e.world.device.getSceneCommitsSince(e.observedCommitRevision),a=i===null,o=r||i===null,s=i===null,c=new Set,l=new Set;for(let t of i??[])if(t.categories.includes(`topology`)&&e.topologyObjectIds.has(t.objectId)&&(a=!0),t.categories.includes(`lights`)&&e.lightObjectIds.has(t.objectId)&&(o=!0,t.categories.includes(`topology`)&&(s=!0)),t.categories.includes(`transforms`)&&e.instancePlacements.has(t.objectId)&&c.add(t.objectId),t.categories.includes(`materials`)){for(let n of e.materialSurfaces.get(t.objectId)??[])l.add(n.material);for(let n of e.samplerMaterials.get(t.objectId)??[])l.add(n)}if(a){this.rebuildCachedWorld(e,t),e.revisions.topology++,e.revisions.lights++,delete e.revisions.dirtyInstanceIds;return}if(c.size>0){let t=new Set;for(let n of c)for(let r of e.instancePlacements.get(n)??[])r.transforms[r.transformIndex]=r.instance.getParameter(`transform`)||eh,t.add(r.instanceId);e.revisions.transforms++,e.revisions.dirtyInstanceIds=Array.from(t)}if(l.size>0){for(let t of l){let n=this.getMaterial(t);for(let r of e.materialSurfaces.get(t.id)??[])r.surface.material=n}this.updateMaterialDependencies(e),e.revisions.materials++}o&&(e.lights=uh(e.world,t),e.ambientRadiance=t,e.revisions.lights++,s&&this.updateLightDependencies(e)),e.observedCommitRevision=n}rebuildCachedWorld(e,t){e.topologyObjectIds.clear(),e.lightObjectIds.clear(),e.instancePlacements.clear(),e.materialSurfaces.clear(),e.samplerMaterials.clear(),e.surfaceEntries=[],e.analyticPrimitives={},e.surfaces=this.makeSceneSurfaces(e),e.lights=uh(e.world,t),this.updateLightDependencies(e),e.ambientRadiance=t,e.observedCommitRevision=e.world.device.getSceneCommitRevision()}makeSceneSurfaces(e){let t=new Map;for(let n of sh(e.world,e)){let e=t.get(n.surface)||[];e.push(n),t.set(n.surface,e)}let n=[];for(let[r,i]of t){let t=r.getParameter(`geometry`),a=r.getParameter(`material`);if(!t||!a)continue;let o=this.getGeometry(t),s=this.geometries.get(t),c=i.map(e=>e.transform),l={id:r.id,geometry:o,geometryVersion:s.structuralVersion,material:this.getMaterial(a),transforms:c,instanceIds:i.map(e=>e.instanceId),...r.getParameter(`skin`)?{skin:r.getParameter(`skin`)}:{},...t.getParameter(`morphTargets`)?{morphTargets:t.getParameter(`morphTargets`),morphWeights:t.getParameter(`morphWeights`)||[]}:{}};n.push(l),e.topologyObjectIds.add(r.id),e.topologyObjectIds.add(t.id);for(let n of Object.values(t.getParameters()))n instanceof R&&e.topologyObjectIds.add(n.id);let u={source:r,material:a,surface:l};e.surfaceEntries.push(u);let d=e.materialSurfaces.get(a.id)??[];d.push(u),e.materialSurfaces.set(a.id,d),t.subtype===`sphere`&&(e.analyticPrimitives[r.id]={type:`sphere`,radius:t.getParameter(`radius`)??1});for(let[t,n]of i.entries()){if(!n.instance)continue;let r=e.instancePlacements.get(n.instance.id)??[];r.push({instance:n.instance,transforms:c,transformIndex:t,instanceId:n.instanceId}),e.instancePlacements.set(n.instance.id,r)}}return this.updateMaterialDependencies(e),n}updateMaterialDependencies(e){e.samplerMaterials.clear();for(let t of e.surfaceEntries){let n=t.material.getParameters();for(let r of nh){let i=n[r.parameter];if(!i)continue;let a=e.samplerMaterials.get(i.id)??new Set;a.add(t.material),e.samplerMaterials.set(i.id,a)}}}updateLightDependencies(e){let{world:t}=e,n=t.getParameters();e.lightObjectIds.clear(),e.lightObjectIds.add(t.id),n.light instanceof R&&e.lightObjectIds.add(n.light.id);for(let t of lh(n.light,n.lights))e.lightObjectIds.add(t.id);n.instance instanceof R&&e.lightObjectIds.add(n.instance.id);for(let t of lh(n.instance,n.instances)){e.lightObjectIds.add(t.id);let n=t.getParameter(`group`);n instanceof R&&e.lightObjectIds.add(n.id);let r=n instanceof R?n.data:Array.isArray(n)?n:n?[n]:[];for(let t of r){if(!(t instanceof El))continue;e.lightObjectIds.add(t.id);let n=t.getParameters();n.light instanceof R&&e.lightObjectIds.add(n.light.id);for(let t of lh(n.light,n.lights))e.lightObjectIds.add(t.id)}}}getMaterial(e){let t=this.materials.get(e);if(t?.version===e.version&&Array.from(t.samplers).every(([e,t])=>e.version===t))return t.material;let n=new Map,r=e.getParameters();for(let e of nh){let t=r[e.parameter];t&&n.set(t,t.version)}let i=ah(e);return this.materials.set(e,{version:e.version,samplers:n,material:i}),i}getGeometry(e){let t=this.geometries.get(e),n=t!==void 0&&Array.from(t.arrayVersions).every(([e,t])=>e.version===t);if(t?.version===e.version&&n)return t.geometry;let r=e.getParameters();if(t&&n&&ih(t.parameters,r))return t.version=e.version,t.parameters=r,t.geometry;let i=ph(e),a=new Map;for(let e of Object.values(r))e instanceof R&&a.set(e,e.version);return this.geometries.set(e,{version:e.version,structuralVersion:Math.max(e.version,(t?.structuralVersion??0)+1),geometry:i,parameters:r,arrayVersions:a}),i}};function ih(e,t){let n=new Set([...Object.keys(e),...Object.keys(t)]);return n.delete(`morphWeights`),Array.from(n).every(n=>{let r=n;return e[r]===t[r]})}function ah(e){let t=e.getParameters(),n=t.baseColor||t.color||[.8,.8,.8],r=t.opacity??(n.length>3?n[3]??1:1),i=t.alphaMode?t.alphaMode.toUpperCase():r<1?`BLEND`:`OPAQUE`,a={...lo.defaultUniforms,unlit:t.unlit??!1,baseColorFactor:[n[0],n[1],n[2],r],metallicRoughnessValues:[e.subtype===`matte`?0:t.metallic??0,e.subtype===`matte`?.92:t.roughness??.38],normalScale:t.normalScale??1,occlusionStrength:t.occlusionStrength??1,emissiveFactor:t.emissive||[0,0,0],emissiveStrength:t.emissiveStrength??1,alphaCutoffEnabled:i===`MASK`,alphaCutoff:t.alphaCutoff??.5,specularColorFactor:t.specularColor||[1,1,1],specularIntensityFactor:t.specularIntensity??1,ior:t.indexOfRefraction??1.5,transmissionFactor:t.transmission??0,diffuseTransmissionFactor:t.diffuseTransmission??0,diffuseTransmissionColorFactor:t.diffuseTransmissionColor||[1,1,1],dispersion:t.dispersion??0,thicknessFactor:t.thickness??0,attenuationDistance:t.attenuationDistance??1e9,attenuationColor:t.attenuationColor||[1,1,1],multiscatterColorFactor:t.multiscatterColor||[0,0,0],scatterAnisotropy:t.scatterAnisotropy??0,clearcoatFactor:t.clearcoat??0,clearcoatRoughnessFactor:t.clearcoatRoughness??.18,sheenColorFactor:t.sheenColor||[0,0,0],sheenRoughnessFactor:t.sheenRoughness??.5,iridescenceFactor:t.iridescence??0,iridescenceIor:t.iridescenceIndexOfRefraction??1.3,iridescenceThicknessRange:[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400],anisotropyStrength:t.anisotropyStrength??0,anisotropyRotation:t.anisotropyRotation??0,anisotropyDirection:t.anisotropyDirection||[1,0],bumpFactor:t.bumpFactor??1},o={};for(let e of nh){let n=t[e.parameter];if(!n)continue;let r=n.getParameter(`image`);r&&(o[e.binding]=r,e.enabled&&(a[e.enabled]=!0),a[e.textureCoordinateSet]=n.getParameter(`textureCoordinateSet`)??0,a[e.transform]=n.getParameter(`transform`)||th)}return{id:e.id,version:e.version,uniforms:a,bindings:o,alphaMode:i===`MASK`?`MASK`:i===`BLEND`?`BLEND`:`OPAQUE`,doubleSided:t.doubleSided??!0}}function oh(e,t){let n=e.getParameter(`size`);return n?[n[0],n[1]]:t.getDefaultCanvasContext().getDrawingBufferSize()}function sh(e,t){let n=[],r=e.getParameters();t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),r.surface instanceof R&&t?.topologyObjectIds.add(r.surface.id),r.instance instanceof R&&(t?.topologyObjectIds.add(r.instance.id),t?.lightObjectIds.add(r.instance.id)),r.light instanceof R&&t?.lightObjectIds.add(r.light.id);for(let e of lh(r.light,r.lights))t?.lightObjectIds.add(e.id);let i=new Map;for(let e of lh(r.surface,r.surfaces)){t?.topologyObjectIds.add(e.id);let r=i.get(e.id)||0;i.set(e.id,r+1),n.push({surface:e,transform:eh,instanceId:r===0?e.id:`${e.id}:${r}`})}let a=new Map;for(let e of lh(r.instance,r.instances))t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),ch(e,n,t,a);return n}function ch(e,t,n,r){let i=e.getParameters();i.group instanceof R&&(n?.topologyObjectIds.add(i.group.id),n?.lightObjectIds.add(i.group.id));let a=i.group instanceof R?i.group.data:Array.isArray(i.group)?i.group:i.group?[i.group]:[];for(let o of a){if(!(o instanceof El))continue;n?.topologyObjectIds.add(o.id),n?.lightObjectIds.add(o.id);let a=o.getParameters();a.surface instanceof R&&n?.topologyObjectIds.add(a.surface.id),a.light instanceof R&&n?.lightObjectIds.add(a.light.id);for(let e of lh(a.light,a.lights))n?.lightObjectIds.add(e.id);for(let s of lh(a.surface,a.surfaces)){n?.topologyObjectIds.add(s.id);let a=`${e.id}:${o.id}:${s.id}`,c=r.get(a)||0;r.set(a,c+1),t.push({surface:s,transform:i.transform||eh,instanceId:c===0?a:`${a}:${c}`,instance:e})}}}function lh(e,t){let n=e||t||[];if(n instanceof R){let e=n.data;return ArrayBuffer.isView(e)?[]:e.filter(e=>typeof e==`object`&&!!e&&`type`in e)}return Array.from(n)}function uh(e,t){let n=[{type:`ambient`,color:[1,1,1],intensity:t}],r=e.getParameters();for(let e of lh(r.light,r.lights))dh(e,n);for(let e of lh(r.instance,r.instances)){let t=e.getParameter(`group`),r=t instanceof R?t.data:Array.isArray(t)?t:t?[t]:[];for(let e of r){if(!(e instanceof El))continue;let t=e.getParameters();for(let e of lh(t.light,t.lights))dh(e,n)}}return n}function dh(e,t){let n=e.getParameters(),r=n.color||[1,1,1];switch(e.subtype){case`ambient`:t.push({type:`ambient`,color:r,intensity:n.radiance??n.intensity??1});break;case`directional`:t.push({type:`directional`,color:r,direction:n.direction||[0,-1,-1],intensity:n.irradiance??n.intensity??1});break;case`point`:t.push({type:`point`,color:r,position:n.position||[0,0,0],intensity:n.intensity??1,attenuation:[1,0,.025]});break;case`spot`:t.push({type:`spot`,color:r,position:n.position||[0,0,0],direction:n.direction||[0,-1,0],intensity:n.intensity??1,attenuation:[1,0,.018],innerConeAngle:n.falloffAngle??(n.openingAngle??.5)*.7,outerConeAngle:n.openingAngle??.5});break}}function fh(e,t,n){let r=e.getParameters(),i=r.position||[0,0,5],a=r.direction||[0,0,-1],o=[i[0]+a[0],i[1]+a[1],i[2]+a[2]],s=r.aspect||t/Math.max(n,1),c=r.near??.05,l=r.far??500;return{projectionMatrix:e.subtype===`orthographic`?new P().ortho({left:-(r.height??12)*s*.5,right:(r.height??12)*s*.5,bottom:-(r.height??12)*.5,top:(r.height??12)*.5,near:c,far:l}):new P().perspective({fovy:r.fovy??Math.PI/3,aspect:s,near:c,far:l}),viewMatrix:new P().lookAt({eye:i,center:o,up:r.up||[0,1,0]}),position:i}}function ph(e){let t=e.getParameters(),n=t.segments??32,r;switch(e.subtype){case`sphere`:r=new tc({radius:t.radius??1,nlat:n,nlong:n*2});break;case`cylinder`:r=new pc({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,topCap:!0,bottomCap:!0});break;case`cone`:r=new oc({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,cap:!0});break;case`quad`:r=new mc({type:`x,z`,xlen:t.width??1,zlen:t.height??t.width??1,flipCull:!0});break;case`triangle`:{let e=mh(t[`vertex.position`]),n=mh(t[`vertex.normal`]),i=mh(t[`vertex.tangent`]),a=mh(t[`vertex.joint`]),o=mh(t[`vertex.weight`]),s=mh(t[`vertex.attribute1`]),c=mh(t[`vertex.attribute2`]),l=mh(t[`primitive.index`]);if(!(e instanceof Float32Array))throw Error(`Triangle geometry requires vertex.position`);r=new Ht({topology:`triangle-list`,attributes:{POSITION:{size:3,value:e},NORMAL:{size:3,value:n instanceof Float32Array?n:hh(e)},...i instanceof Float32Array?{TANGENT:{size:4,value:i}}:{},...a instanceof Uint8Array||a instanceof Uint16Array||a instanceof Uint32Array?{JOINTS_0:{size:4,value:a}}:{},...o instanceof Float32Array?{WEIGHTS_0:{size:4,value:o}}:{},TEXCOORD_0:{size:2,value:s instanceof Float32Array?s:new Float32Array(e.length/3*2)},...c instanceof Float32Array?{TEXCOORD_1:{size:2,value:c}}:{}},indices:l instanceof Uint16Array||l instanceof Uint32Array?l:void 0});break}}let i=r.attributes.POSITION?.value,a=i?i.length/3:r.vertexCount,o=mh(t[`vertex.attribute0`]),s=o instanceof Float32Array?o:new Float32Array(a*3).fill(1),c=s.length===a*4?4:3,l=r.attributes.TEXCOORD_0?.value;return new Ht({topology:r.topology||`triangle-list`,attributes:{...r.attributes,COLOR_0:{size:c,value:s},TEXCOORD_0:{size:2,value:l instanceof Float32Array?l:new Float32Array(a*2)}},indices:r.indices})}function mh(e){return e instanceof R?e.data:e}function hh(e){let t=new Float32Array(e.length);for(let n=0;n<e.length;n+=9){let r=e[n+3]-e[n],i=e[n+4]-e[n+1],a=e[n+5]-e[n+2],o=e[n+6]-e[n],s=e[n+7]-e[n+1],c=e[n+8]-e[n+2],l=i*c-a*s,u=a*o-r*c,d=r*s-i*o,f=Math.hypot(l,u,d)||1;for(let e=0;e<3;e++)t[n+e*3]=l/f,t[n+e*3+1]=u/f,t[n+e*3+2]=d/f}return t}var gh=class{adapter=new rh;renderer;constructor(e){this.renderer=new _m(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`world`),r=e.getParameter(`camera`),i=e.getParameter(`renderer`);if(!t||!n||!r||!i)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let a=this.adapter.getAnalyticPrimitives(n);return this.renderer.render({...t,primitives:a,cameraProjection:r.subtype,samplesPerPixel:i.getParameter(`samplesPerPixel`),maxBounces:i.getParameter(`maxBounces`),progressive:i.getParameter(`progressive`),shadows:i.getParameter(`shadows`),resolutionScale:i.getParameter(`resolutionScale`),minimumResolutionScale:i.getParameter(`minimumResolutionScale`),adaptiveResolution:i.getParameter(`adaptiveResolution`),targetFrameTimeMilliseconds:i.getParameter(`targetFrameTimeMilliseconds`),temporalReprojection:i.getParameter(`temporalReprojection`),shadowSamplesPerFrame:i.getParameter(`shadowSamplesPerFrame`)})}destroyFrame(e){this.renderer.destroyFrame(e.id)}destroy(){this.renderer.destroy(),this.adapter.destroy()}},_h=24,vh={minFilter:`linear`,magFilter:`linear`},yh={name:`bloomExtract`,source:`
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
`,uniformTypes:{threshold:`f32`,softKnee:`f32`,fireflyReduction:`f32`,exposure:`f32`,exposureCompensation:`f32`},defaultUniforms:{threshold:.8,softKnee:.5,fireflyReduction:0,exposure:1,exposureCompensation:0},propTypes:{threshold:{value:.8,min:0,max:1},softKnee:{value:.5,min:0,max:1},fireflyReduction:{value:0,min:0,max:1},exposure:{value:1,min:1e-4,softMax:8},exposureCompensation:{value:0,min:-8,max:8}},passes:[{sampler:!0}]},bh={name:`bloomDownsample`,source:`
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
`,passes:[{sampler:!0}]},xh={name:`bloomBlur`,source:`
const BLOOM_BLUR_MAX_RADIUS = ${_h}.0;
const BLOOM_BLUR_MAX_PAIRS = ${Math.ceil(_h/2)};

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
#define BLOOM_BLUR_MAX_RADIUS ${_h}.0
#define BLOOM_BLUR_MAX_PAIRS ${Math.ceil(_h/2)}

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
`,uniformTypes:{radius:`f32`,delta:`vec2<f32>`},propTypes:{radius:{value:8,min:0,max:_h,softMax:_h},delta:{value:[1,0],private:!0}},passes:[{sampler:!0}]},Sh={name:`bloomShaderPassPipeline`,renderTargets:{extractHalf:{scale:[.5,.5],sampler:vh},blurHalfScratch:{scale:[.5,.5],sampler:vh},blurHalf:{scale:[.5,.5],sampler:vh},extractQuarter:{scale:[.25,.25],sampler:vh},blurQuarterScratch:{scale:[.25,.25],sampler:vh},blurQuarter:{scale:[.25,.25],sampler:vh},extractEighth:{scale:[.125,.125],sampler:vh},blurEighthScratch:{scale:[.125,.125],sampler:vh},blurEighth:{scale:[.125,.125],sampler:vh}},steps:[{shaderPass:yh,inputs:{sourceTexture:`previous`},output:`extractHalf`,uniforms:{threshold:.8}},{shaderPass:xh,inputs:{sourceTexture:`extractHalf`},output:`blurHalfScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:xh,inputs:{sourceTexture:`blurHalfScratch`},output:`blurHalf`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:bh,inputs:{sourceTexture:`extractHalf`},output:`extractQuarter`},{shaderPass:xh,inputs:{sourceTexture:`extractQuarter`},output:`blurQuarterScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:xh,inputs:{sourceTexture:`blurQuarterScratch`},output:`blurQuarter`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:bh,inputs:{sourceTexture:`extractQuarter`},output:`extractEighth`},{shaderPass:xh,inputs:{sourceTexture:`extractEighth`},output:`blurEighthScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:xh,inputs:{sourceTexture:`blurEighthScratch`},output:`blurEighth`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:{name:`bloomComposite`,source:`
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
`,bindingLayout:[{name:`glowHalf`,group:0},{name:`glowQuarter`,group:0},{name:`glowEighth`,group:0}],uniforms:{},bindings:{},uniformTypes:{intensity:`f32`},propTypes:{intensity:{value:1,min:0,softMax:3}},passes:[{sampler:!0}]},inputs:{sourceTexture:`previous`,glowHalf:`blurHalf`,glowQuarter:`blurQuarter`,glowEighth:`blurEighth`},output:`previous`,uniforms:{intensity:1}}]},Ch={name:`advancedCopy`,source:`fn advancedCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { return textureSample(sourceTexture, sourceTextureSampler, texCoord); }`,passes:[{sampler:!0}]},wh=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Th={name:`cameraReprojectionTaaResolve`,source:`const CAMERA_REPROJECTION_TAA_EPSILON: f32 = 0.00001;

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

  let currentClip = vec4f(
    unjitteredCoordinate.x * 2.0 - 1.0,
    1.0 - unjitteredCoordinate.y * 2.0,
    depth,
    1.0
  );
  let worldPositionHomogeneous =
    cameraReprojectionTaaResolve.inverseViewProjectionMatrix * currentClip;
  if (abs(worldPositionHomogeneous.w) <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return vec4f(0.0);
  }

  let worldPosition = worldPositionHomogeneous.xyz / worldPositionHomogeneous.w;
  let previousClip =
    cameraReprojectionTaaResolve.previousViewProjectionMatrix * vec4f(worldPosition, 1.0);
  if (previousClip.w <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return vec4f(0.0);
  }

  let previousNormalizedDeviceCoordinate = previousClip.xyz / previousClip.w;
  let previousCoordinate =
    previousNormalizedDeviceCoordinate.xy * vec2f(0.5, -0.5) +
    vec2f(0.5) +
    cameraReprojectionTaaResolve.previousJitter;
  let expectedPreviousDepth = previousNormalizedDeviceCoordinate.z;
  let validCoordinate = all(previousCoordinate >= vec2f(0.0)) &&
    all(previousCoordinate <= vec2f(1.0));
  let validDepthRange = expectedPreviousDepth >= 0.0 && expectedPreviousDepth <= 1.0;
  return vec4f(
    previousCoordinate,
    expectedPreviousDepth,
    select(0.0, 1.0, validCoordinate && validDepthRange)
  );
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

  let sourceTexel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimumColor = currentColor.rgb;
  var maximumColor = currentColor.rgb;
  for (var sampleY: i32 = -1; sampleY <= 1; sampleY++) {
    for (var sampleX: i32 = -1; sampleX <= 1; sampleX++) {
      let sampleCoordinate = clamp(
        texCoord + vec2f(f32(sampleX), f32(sampleY)) * sourceTexel,
        vec2f(0.0),
        vec2f(1.0)
      );
      let sampleColor = textureSampleLevel(
        sourceTexture,
        sourceTextureSampler,
        sampleCoordinate,
        0
      ).rgb;
      minimumColor = min(minimumColor, sampleColor);
      maximumColor = max(maximumColor, sampleColor);
    }
  }

  let historyDimensions = textureDimensions(historyTexture);
  let historyPosition = previousFrame.xy * vec2f(historyDimensions) - vec2f(0.5);
  let baseHistoryCoordinate = vec2i(floor(historyPosition));
  let historyFraction = fract(historyPosition);
  var accumulatedHistoryColor = vec3f(0.0);
  var accumulatedHistoryWeight = 0.0;
  for (var tapY: i32 = 0; tapY <= 1; tapY++) {
    for (var tapX: i32 = 0; tapX <= 1; tapX++) {
      let historyCoordinate = clamp(
        baseHistoryCoordinate + vec2i(tapX, tapY),
        vec2i(0),
        vec2i(historyDimensions) - vec2i(1)
      );
      let tapDepth = textureLoad(previousDepthTexture, historyCoordinate, 0).r;
      let validTapDepth =
        abs(tapDepth - previousFrame.z) <= cameraReprojectionTaaResolve.depthThreshold;
      let horizontalWeight = select(1.0 - historyFraction.x, historyFraction.x, tapX == 1);
      let verticalWeight = select(1.0 - historyFraction.y, historyFraction.y, tapY == 1);
      let tapWeight = select(0.0, horizontalWeight * verticalWeight, validTapDepth);
      accumulatedHistoryColor += textureLoad(historyTexture, historyCoordinate, 0).rgb *
        tapWeight;
      accumulatedHistoryWeight += tapWeight;
    }
  }

  if (accumulatedHistoryWeight <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return currentColor;
  }

  let historyColor = accumulatedHistoryColor / accumulatedHistoryWeight;
  let clampedHistoryColor = clamp(historyColor, minimumColor, maximumColor);
  let resolvedColor = mix(
    currentColor.rgb,
    clampedHistoryColor,
    cameraReprojectionTaaResolve.historyWeight
  );
  return vec4f(resolvedColor, currentColor.a);
}`,bindingLayout:[{name:`historyTexture`,group:0},{name:`depthTexture`,group:0},{name:`previousDepthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseViewProjectionMatrix:`mat4x4<f32>`,previousViewProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`,currentJitter:`vec2<f32>`,previousJitter:`vec2<f32>`},propTypes:{inverseViewProjectionMatrix:{value:wh,private:!0},previousViewProjectionMatrix:{value:wh,private:!0},historyWeight:{value:.9,min:0,max:.98},depthThreshold:{value:.0025,min:1e-5,softMax:.05},currentJitter:{value:[0,0],private:!0},previousJitter:{value:[0,0],private:!0}},passes:[{sampler:!0}]},Eh={name:`cameraReprojectionTaaDepthHistoryCopy`,source:`@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn cameraReprojectionTaaDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]};function Dh(){return{name:`cameraReprojectionTaaShaderPassPipeline`,renderTargets:{cameraReprojectionTaaHistoryColor:{format:`rgba16float`,lifetime:`history`,initialize:`original`},cameraReprojectionTaaHistoryDepth:{format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[1,0,0,1]}}},steps:[{shaderPass:Th,inputs:{sourceTexture:`previous`,historyTexture:`cameraReprojectionTaaHistoryColor`,previousDepthTexture:`cameraReprojectionTaaHistoryDepth`},output:`cameraReprojectionTaaHistoryColor`},{shaderPass:Ch,inputs:{sourceTexture:`cameraReprojectionTaaHistoryColor`},output:`previous`},{shaderPass:Eh,inputs:{sourceTexture:`previous`},output:`cameraReprojectionTaaHistoryDepth`}]}}var Oh=8,kh=.5,Ah=class{device;adapter=new rh;renderer;frames=new Map;constructor(e,{deferred:t=!1}={}){this.device=e,this.renderer=t?new Lu(e):new Ul(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`renderer`);if(!t||!n)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let r=t.renderMode===`default`?n.getParameter(`bloomIntensity`)??0:0,i=this.device.type===`webgpu`&&t.renderMode===`default`&&(n.getParameter(`temporalAntialiasing`)??!0),a=i||r>0?this.getFrameResources(e):null,o=!1,s=null;if(a){let n=this.getFramebuffer(e,a,i);t.framebuffer=n.framebuffer,o=n.resized}i&&a?(s=Nh(t,a.temporalAntialiasingState,o),t.camera={...t.camera,projectionMatrix:s.jitteredProjectionMatrix}):a&&Mh(a.temporalAntialiasingState);let c=this.renderer.render(t);if(!a||!t.framebuffer)return c;let l=t.framebuffer.colorAttachments[0].texture;if(s){let t=this.getTemporalAntialiasingRenderer(a),[n,i]=oh(e,this.device);t.resize([n,i]);let o=this.getTemporalAntialiasingDepthTexture(e.id,a),c={sourceTexture:l,bindings:{depthTexture:o},uniforms:{cameraReprojectionTaaResolve:{inverseViewProjectionMatrix:new P(s.currentViewProjectionMatrix).invert(),previousViewProjectionMatrix:s.previousViewProjectionMatrix,currentJitter:s.currentJitter,previousJitter:s.previousJitter}},resetHistory:s.resetHistory};if(r>0){let e=t.renderToTexture(c);e&&(l=e)}else t.renderToScreen(c);Ph(a.temporalAntialiasingState,s)}if(r>0){let t=this.getBloomRenderer(a);t.resize(oh(e,this.device)),t.renderToScreen({sourceTexture:l,uniforms:{bloomExtract:{threshold:n.getParameter(`bloomThreshold`)??.62},bloomBlur:{radius:n.getParameter(`bloomRadius`)??7},bloomComposite:{intensity:r}}})}return c}destroyFrame(e){this.renderer.destroyFrame(e.id);let t=this.frames.get(e);t&&(t.framebuffer?.destroy(),t.colorTexture?.destroy(),t.depthTexture?.destroy(),t.bloomRenderer?.destroy(),t.temporalAntialiasingRenderer?.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e);this.renderer.destroy(),this.adapter.destroy()}getFrameResources(e){let t=this.frames.get(e);return t||(t={framebuffer:null,colorTexture:null,depthTexture:null,bloomRenderer:null,temporalAntialiasingRenderer:null,temporalAntialiasingState:jh()},this.frames.set(e,t)),t}getFramebuffer(e,t,n){let[r,i]=oh(e,this.device),a=this.device.preferredColorFormat,o=t.framebuffer&&(t.framebuffer.width!==r||t.framebuffer.height!==i||t.colorTexture?.format!==a||!!t.depthTexture!==n);return o&&Vh(t),t.framebuffer||=(t.colorTexture=this.device.createTexture({id:`anari-${e.id}-color-texture`,width:r,height:i,format:a,usage:v.RENDER_ATTACHMENT|v.SAMPLE}),t.depthTexture=n?this.device.createTexture({id:`anari-${e.id}-depth-texture`,width:r,height:i,format:`depth24plus`,usage:v.RENDER_ATTACHMENT|v.SAMPLE,sampler:{minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}):null,this.device.createFramebuffer({id:`anari-${e.id}-color`,width:r,height:i,colorAttachments:[t.colorTexture],depthStencilAttachment:t.depthTexture||`depth24plus`})),{framebuffer:t.framebuffer,resized:!!o}}getTemporalAntialiasingDepthTexture(e,t){if(this.renderer instanceof Lu){let t=this.renderer.getLastDepthTexture(e);if(t)return t}if(!t.depthTexture)throw Error(`ANARI temporal antialiasing requires a sampleable scene depth texture.`);return t.depthTexture}getBloomRenderer(e){return e.bloomRenderer||=new kc(this.device,{shaderPasses:[Sh]}),e.bloomRenderer}getTemporalAntialiasingRenderer(e){return e.temporalAntialiasingRenderer||=new kc(this.device,{shaderPasses:[Dh()],colorFormat:`rgba16float`}),e.temporalAntialiasingRenderer}};function jh(){return{frameIndex:0,previousViewProjectionMatrix:null,previousViewMatrix:null,previousProjectionMatrix:null,previousJitter:[0,0],topologySignature:null}}function Mh(e){e.frameIndex=0,e.previousViewProjectionMatrix=null,e.previousViewMatrix=null,e.previousProjectionMatrix=null,e.previousJitter=[0,0],e.topologySignature=null}function Nh(e,t,n){let r=new P(e.camera.viewMatrix),i=new P(e.camera.projectionMatrix),a=new P(i).multiplyRight(r),o=Lh(e),s=n||!t.previousViewProjectionMatrix||t.topologySignature!==o||Fh(t,r,i),c=s?0:t.frameIndex,l=Rh(c,e.width||1,e.height||1);return{currentViewMatrix:r,currentProjectionMatrix:i,currentViewProjectionMatrix:a,previousViewProjectionMatrix:s?a:t.previousViewProjectionMatrix,jitteredProjectionMatrix:zh(i,l),currentJitter:l,previousJitter:s?l:t.previousJitter,topologySignature:o,resetHistory:s,nextFrameIndex:(c+1)%Oh}}function Ph(e,t){e.frameIndex=t.nextFrameIndex,e.previousViewProjectionMatrix=t.currentViewProjectionMatrix,e.previousViewMatrix=t.currentViewMatrix,e.previousProjectionMatrix=t.currentProjectionMatrix,e.previousJitter=t.currentJitter,e.topologySignature=t.topologySignature}function Fh(e,t,n){return e.previousViewMatrix!==null&&Ih(e.previousViewMatrix,t)>kh||e.previousProjectionMatrix!==null&&Ih(e.previousProjectionMatrix,n)>kh}function Ih(e,t){let n=0;for(let r=0;r<16;r++)n=Math.max(n,Math.abs((e[r]||0)-(t[r]||0)));return n}function Lh(e){return e.surfaces.map(e=>`${e.id}:${e.geometryVersion??0}:${e.material.id}:${e.material.version??0}:${e.transforms.length}:${e.instanceIds?.join(`,`)||``}`).sort().join(`|`)}function Rh(e,t,n){let r=e%Oh+1;return[(Bh(r,2)-.5)/Math.max(t,1),(Bh(r,3)-.5)/Math.max(n,1)]}function zh(e,t){let n=new P(e),r=t[0]*2,i=t[1]*-2;for(let e=0;e<4;e++){let t=e*4,a=n[t+3];n[t]+=r*a,n[t+1]+=i*a}return n}function Bh(e,t){let n=0,r=1,i=e;for(;i>0;)r/=t,n+=i%t*r,i=Math.floor(i/t);return n}function Vh(e){e.framebuffer?.destroy(),e.colorTexture?.destroy(),e.depthTexture?.destroy(),e.framebuffer=null,e.colorTexture=null,e.depthTexture=null}var Hh={array:[`array1D`],camera:[`perspective`,`orthographic`],frame:[`default`],geometry:[`triangle`,`sphere`,`cylinder`,`cone`,`quad`],group:[`default`],instance:[`transform`],light:[`ambient`,`directional`,`point`,`spot`],material:[`matte`,`physicallyBased`],sampler:[`image2D`],surface:[`default`],world:[`default`]},Uh=[`KHR_CAMERA_PERSPECTIVE`,`KHR_CAMERA_ORTHOGRAPHIC`,`KHR_GEOMETRY_TRIANGLE`,`KHR_GEOMETRY_SPHERE`,`KHR_GEOMETRY_CYLINDER`,`KHR_GEOMETRY_CONE`,`KHR_GEOMETRY_QUAD`,`KHR_INSTANCE_TRANSFORM`,`KHR_LIGHT_DIRECTIONAL`,`KHR_LIGHT_POINT`,`KHR_LIGHT_SPOT`,`KHR_MATERIAL_MATTE`,`KHR_MATERIAL_PHYSICALLY_BASED`,`KHR_SAMPLER_IMAGE2D`],Wh=256,Gh=class{device;extensions=Uh;rendererRuntimeFactories=new Map;renderingRuntimes=new Map;sceneCommits=[];sceneCommitRevision=0;constructor(e){this.device=e;let t=e=>new Ah(e);this.registerRenderer(`default`,t),this.registerRenderer(`deferred`,e=>new Ah(e,{deferred:!0})),this.registerRenderer(`debugNormals`,t),this.registerRenderer(`debugDepth`,t),this.registerRenderer(`raytrace`,e=>new gh(e))}newArray(e){return new R(this,e)}newGeometry(e,t={}){return new Sl(this,e,t)}newMaterial(e,t={}){return new Cl(this,e,t)}newSampler(e,t){return new wl(this,e,t)}newSurface(e){return new Tl(this,e)}newGroup(e={}){return new El(this,e)}newInstance(e){return new Dl(this,e)}newWorld(e={}){return new Ol(this,e)}newLight(e,t={}){return new kl(this,e,t)}newCamera(e,t={}){return new Al(this,e,t)}newRenderer(e=`default`,t={}){return new jl(this,e,t)}registerRenderer(e,t){let n=this.rendererRuntimeFactories.get(e);return this.rendererRuntimeFactories.set(e,t),n&&n!==t&&!Array.from(this.rendererRuntimeFactories.values()).includes(n)&&(this.renderingRuntimes.get(n)?.destroy(),this.renderingRuntimes.delete(n)),this}newFrame(e){return new Ml(this,e)}getObjectSubtypes(e){return e===`renderer`?Array.from(this.rendererRuntimeFactories.keys()):Hh[e]}getObjectInfo(e){return{type:e,subtypes:this.getObjectSubtypes(e),extensions:this.extensions}}getSceneCommitRevision(){return this.sceneCommitRevision}getSceneCommitsSince(e){return e===this.sceneCommitRevision?[]:this.sceneCommits.length===0||e<this.sceneCommits[0].revision-1?null:this.sceneCommits.filter(t=>t.revision>e)}recordSceneObjectCommit(e,t,n=!1){let r;switch(e){case`world`:case`group`:case`array`:r=[`topology`,`lights`];break;case`geometry`:case`surface`:r=[`topology`];break;case`instance`:r=n?[`topology`,`lights`]:[`transforms`];break;case`material`:case`sampler`:r=[`materials`];break;case`light`:r=[`lights`];break;default:return}this.sceneCommitRevision++,this.sceneCommits.push({revision:this.sceneCommitRevision,objectId:t,categories:r}),this.sceneCommits.length>Wh&&this.sceneCommits.shift()}renderFrame(e){let t=e.getParameter(`renderer`)?.subtype??`default`,n=this.rendererRuntimeFactories.get(t);if(!n)throw Error(`ANARI renderer "${t}" is not registered.`);let r=this.renderingRuntimes.get(n);return r||(r=n(this.device),this.renderingRuntimes.set(n,r)),r.render(e)}destroyFrame(e){for(let t of this.renderingRuntimes.values())t.destroyFrame(e)}destroy(){for(let e of this.renderingRuntimes.values())e.destroy();this.renderingRuntimes.clear(),this.sceneCommits.length=0}},K=function(e){return e[e.POINTS=0]=`POINTS`,e[e.LINES=1]=`LINES`,e[e.LINE_LOOP=2]=`LINE_LOOP`,e[e.LINE_STRIP=3]=`LINE_STRIP`,e[e.TRIANGLES=4]=`TRIANGLES`,e[e.TRIANGLE_STRIP=5]=`TRIANGLE_STRIP`,e[e.TRIANGLE_FAN=6]=`TRIANGLE_FAN`,e[e.ONE=1]=`ONE`,e[e.SRC_ALPHA=770]=`SRC_ALPHA`,e[e.ONE_MINUS_SRC_ALPHA=771]=`ONE_MINUS_SRC_ALPHA`,e[e.FUNC_ADD=32774]=`FUNC_ADD`,e[e.LINEAR=9729]=`LINEAR`,e[e.NEAREST=9728]=`NEAREST`,e[e.NEAREST_MIPMAP_NEAREST=9984]=`NEAREST_MIPMAP_NEAREST`,e[e.LINEAR_MIPMAP_NEAREST=9985]=`LINEAR_MIPMAP_NEAREST`,e[e.NEAREST_MIPMAP_LINEAR=9986]=`NEAREST_MIPMAP_LINEAR`,e[e.LINEAR_MIPMAP_LINEAR=9987]=`LINEAR_MIPMAP_LINEAR`,e[e.TEXTURE_MAG_FILTER=10240]=`TEXTURE_MAG_FILTER`,e[e.TEXTURE_MIN_FILTER=10241]=`TEXTURE_MIN_FILTER`,e[e.TEXTURE_WRAP_S=10242]=`TEXTURE_WRAP_S`,e[e.TEXTURE_WRAP_T=10243]=`TEXTURE_WRAP_T`,e[e.REPEAT=10497]=`REPEAT`,e[e.CLAMP_TO_EDGE=33071]=`CLAMP_TO_EDGE`,e[e.MIRRORED_REPEAT=33648]=`MIRRORED_REPEAT`,e[e.UNPACK_FLIP_Y_WEBGL=37440]=`UNPACK_FLIP_Y_WEBGL`,e}({}),Kh=[q(`baseColor`,`pbr_baseColorSampler`,`baseColorTexture`,[`pbrMetallicRoughness`,`baseColorTexture`]),q(`metallicRoughness`,`pbr_metallicRoughnessSampler`,`metallicRoughnessTexture`,[`pbrMetallicRoughness`,`metallicRoughnessTexture`]),q(`normal`,`pbr_normalSampler`,`normalTexture`,[`normalTexture`]),q(`occlusion`,`pbr_occlusionSampler`,`occlusionTexture`,[`occlusionTexture`]),q(`emissive`,`pbr_emissiveSampler`,`emissiveTexture`,[`emissiveTexture`]),q(`specularColor`,`pbr_specularColorSampler`,`KHR_materials_specular.specularColorTexture`,[`extensions`,`KHR_materials_specular`,`specularColorTexture`]),q(`specularIntensity`,`pbr_specularIntensitySampler`,`KHR_materials_specular.specularTexture`,[`extensions`,`KHR_materials_specular`,`specularTexture`]),q(`transmission`,`pbr_transmissionSampler`,`KHR_materials_transmission.transmissionTexture`,[`extensions`,`KHR_materials_transmission`,`transmissionTexture`]),q(`thickness`,`pbr_thicknessSampler`,`KHR_materials_volume.thicknessTexture`,[`extensions`,`KHR_materials_volume`,`thicknessTexture`]),q(`clearcoat`,`pbr_clearcoatSampler`,`KHR_materials_clearcoat.clearcoatTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatTexture`]),q(`clearcoatRoughness`,`pbr_clearcoatRoughnessSampler`,`KHR_materials_clearcoat.clearcoatRoughnessTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatRoughnessTexture`]),q(`clearcoatNormal`,`pbr_clearcoatNormalSampler`,`KHR_materials_clearcoat.clearcoatNormalTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatNormalTexture`]),q(`sheenColor`,`pbr_sheenColorSampler`,`KHR_materials_sheen.sheenColorTexture`,[`extensions`,`KHR_materials_sheen`,`sheenColorTexture`]),q(`sheenRoughness`,`pbr_sheenRoughnessSampler`,`KHR_materials_sheen.sheenRoughnessTexture`,[`extensions`,`KHR_materials_sheen`,`sheenRoughnessTexture`]),q(`iridescence`,`pbr_iridescenceSampler`,`KHR_materials_iridescence.iridescenceTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceTexture`]),q(`iridescenceThickness`,`pbr_iridescenceThicknessSampler`,`KHR_materials_iridescence.iridescenceThicknessTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceThicknessTexture`]),q(`anisotropy`,`pbr_anisotropySampler`,`KHR_materials_anisotropy.anisotropyTexture`,[`extensions`,`KHR_materials_anisotropy`,`anisotropyTexture`]),q(`bump`,`pbr_bumpSampler`,`EXT_materials_bump.bumpTexture`,[`extensions`,`EXT_materials_bump`,`bumpTexture`]),q(`diffuseTransmission`,`pbr_diffuseTransmissionSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionTexture`]),q(`diffuseTransmissionColor`,`pbr_diffuseTransmissionColorSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionColorTexture`]),q(`multiscatterColor`,`pbr_multiscatterColorSampler`,`KHR_materials_volume_scatter.multiscatterColorTexture`,[`extensions`,`KHR_materials_volume_scatter`,`multiscatterColorTexture`])];new Map(Kh.map(e=>[e.slot,e]));function q(e,t,n,r){return{slot:e,binding:t,displayName:n,pathSegments:r,colorSpace:e===`baseColor`||e===`emissive`||e===`specularColor`||e===`sheenColor`||e===`diffuseTransmissionColor`||e===`multiscatterColor`?`srgb`:`linear`,uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function qh(){return Kh}function Jh(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function Yh(e){return e?.extensions?.KHR_texture_transform?.texCoord??e?.texCoord??0}function Xh(e){return Kh.find(t=>t.pathSegments.length===e.length&&t.pathSegments.every((t,n)=>e[n]===t))||null}function Zh(e){let t=new Se().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),n=new Se().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),r=new Se().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(n).multiplyRight(r))}function Qh(e={}){let t=e.wrapS??e.parameters?.[K.TEXTURE_WRAP_S],n=e.wrapT??e.parameters?.[K.TEXTURE_WRAP_T],r=e.magFilter??e.parameters?.[K.TEXTURE_MAG_FILTER],i=e.minFilter??e.parameters?.[K.TEXTURE_MIN_FILTER],a=eg(t),o=eg(n),s=ig(r);return{...a?{addressModeU:a}:{},...o?{addressModeV:o}:{},...s?{magFilter:s}:{},...ag(i)}}function $h(e){let t=tg(e.addressModeU),n=tg(e.addressModeV),r=ng(e.magFilter),i=rg(e.minFilter,e.mipmapFilter);return{...t===void 0?{}:{wrapS:t},...n===void 0?{}:{wrapT:n},...r===void 0?{}:{magFilter:r},...i===void 0?{}:{minFilter:i}}}function eg(e){switch(e){case K.CLAMP_TO_EDGE:return`clamp-to-edge`;case K.REPEAT:return`repeat`;case K.MIRRORED_REPEAT:return`mirror-repeat`;default:return}}function tg(e){switch(e){case`clamp-to-edge`:return K.CLAMP_TO_EDGE;case`repeat`:return K.REPEAT;case`mirror-repeat`:return K.MIRRORED_REPEAT;default:return}}function ng(e){switch(e){case`nearest`:return K.NEAREST;case`linear`:return K.LINEAR;default:return}}function rg(e,t){if(e)return t===`nearest`?e===`nearest`?K.NEAREST_MIPMAP_NEAREST:K.LINEAR_MIPMAP_NEAREST:t===`linear`?e===`nearest`?K.NEAREST_MIPMAP_LINEAR:K.LINEAR_MIPMAP_LINEAR:e===`nearest`?K.NEAREST:K.LINEAR}function ig(e){switch(e){case K.NEAREST:return`nearest`;case K.LINEAR:return`linear`;default:return}}function ag(e){switch(e){case K.NEAREST:return{minFilter:`nearest`};case K.LINEAR:return{minFilter:`linear`};case K.NEAREST_MIPMAP_NEAREST:return{minFilter:`nearest`,mipmapFilter:`nearest`};case K.LINEAR_MIPMAP_NEAREST:return{minFilter:`linear`,mipmapFilter:`nearest`};case K.NEAREST_MIPMAP_LINEAR:return{minFilter:`nearest`,mipmapFilter:`linear`};case K.LINEAR_MIPMAP_LINEAR:return{minFilter:`linear`,mipmapFilter:`linear`};default:return{}}}function og(e,t,n){if(`compressed`in t)return ug(e,t,{id:n.id,sampler:n.sampler});let r=n.width!==void 0&&n.height!==void 0?{width:n.width,height:n.height}:e.getExternalImageSize(t),i=n.sampler.mipmapFilter===`nearest`||n.sampler.mipmapFilter===`linear`,a=i?e.getMipLevelCount(r.width,r.height):1,o=e.createTexture({id:n.id,sampler:n.sampler,width:r.width,height:r.height,mipLevels:a,...i?{usage:v.SAMPLE|v.RENDER|v.COPY_DST|v.COPY_SRC}:{},...n.colorSpace?{format:n.colorSpace===`srgb`?`rgba8unorm-srgb`:`rgba8unorm`}:{},data:t});return a>1&&(e.type===`webgl`?o.generateMipmapsWebGL():e.type===`webgpu`&&e.generateMipmapsWebGPU(o)),o}function sg(e,t){return e.createTexture({...t,format:`rgba8unorm`,width:1,height:1,mipLevels:1})}function cg(e){return e.textureFormat}function lg(e,t,n){let{blockWidth:r=1,blockHeight:i=1}=f.getInfo(n),a=1;for(let n=1;;n++){let o=Math.max(1,e>>n),s=Math.max(1,t>>n);if(o<r||s<i)break;a++}return a}function ug(e,t,n){let r;if(r=Array.isArray(t.data)&&t.data[0]?.data?t.data:`mipmaps`in t&&Array.isArray(t.mipmaps)?t.mipmaps:[],r.length===0||!r[0]?.data)return s.warn(`createCompressedTexture: compressed image has no valid mip levels, creating fallback`)(),sg(e,n);let i=r[0],a=i.width??t.width??0,o=i.height??t.height??0;if(a<=0||o<=0)return s.warn(`createCompressedTexture: base level has invalid dimensions, creating fallback`)(),sg(e,n);let c=cg(i);if(!c)return s.warn(`createCompressedTexture: compressed image has no textureFormat, creating fallback`)(),sg(e,n);if(!e.isTextureFormatSupported(c))return s.warn(`createCompressedTexture: ${e.type} device does not support '${c}', creating fallback`)(),sg(e,n);let l=lg(a,o,c),u=Math.min(r.length,l),d=1;for(let e=1;e<u;e++){let t=r[e];if(!t.data||t.width<=0||t.height<=0){s.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let n=cg(t);if(n&&n!==c){s.warn(`createCompressedTexture: mip level ${e} format '${n}' differs from base '${c}', truncating`)();break}let i=Math.max(1,a>>e),l=Math.max(1,o>>e);if(t.width!==i||t.height!==l){s.warn(`createCompressedTexture: mip level ${e} dimensions ${t.width}x${t.height} don't match expected ${i}x${l}, truncating`)();break}d++}let f=e.createTexture({...n,format:c,usage:v.TEXTURE|v.COPY_DST,width:a,height:o,mipLevels:d,data:i.data});for(let e=1;e<d;e++)f.writeData(r[e].data,{width:r[e].width,height:r[e].height,mipLevel:e});return f}function dg(e,t={}){let n=t.lightDefinitions||e.lights||e.extensions?.KHR_lights_punctual?.lights;if(!n||!Array.isArray(n)||n.length===0)return[];let r=[],i=_g(e.nodes||[]),a=new Map;for(let o of e.nodes||[]){if(!fg(o,i,t.nodeVisibility))continue;let e=o.light??o.extensions?.KHR_lights_punctual?.light;if(typeof e!=`number`||t.nodeIdentifiers&&!t.nodeIdentifiers.has(o.id))continue;let s=n[e];if(!s)continue;let c=pg(s.color||[1,1,1],t.useByteColors??!0),l=s.intensity??1,u=s.range,d=vg(o,i,a);switch(s.type){case`directional`:r.push(hg(d,c,l));break;case`point`:r.push(mg(d,c,l,u));break;case`spot`:r.push(gg(d,c,l,u,s.spot));break;default:break}}return r}function fg(e,t,n){let r=e;for(;r;){let e=n?.get(r.id);if(e?!e.display:r.extensions?.KHR_node_visibility?.visible===!1)return!1;r=t.get(r.id)}return!0}function pg(e,t){return t?e.map(e=>e*255):Va(e,!1)}function mg(e,t,n,r){let i=bg(e),a=[1,0,0];return r!==void 0&&r>0&&(a=[1,0,1/(r*r)]),{type:`point`,position:i,color:t,intensity:n,attenuation:a}}function hg(e,t,n){return{type:`directional`,direction:xg(e),color:t,intensity:n}}function gg(e,t,n,r,i={}){let a=bg(e),o=xg(e),s=[1,0,0];return r!==void 0&&r>0&&(s=[1,0,1/(r*r)]),{type:`spot`,position:a,direction:o,color:t,intensity:n,attenuation:s,innerConeAngle:i.innerConeAngle??0,outerConeAngle:i.outerConeAngle??Math.PI/4}}function _g(e){let t=new Map;for(let n of e)for(let e of n.children||[])t.set(e.id,n);return t}function vg(e,t,n){let r=n.get(e.id);if(r)return r;let i=yg(e),a=t.get(e.id),o=a?new P(vg(a,t,n)).multiplyRight(i):i;return n.set(e.id,o),o}function yg(e){if(e.matrix)return new P(e.matrix);let t=new P;return e.translation&&t.translate(e.translation),e.rotation&&t.multiplyRight(new P().fromQuaternion(e.rotation)),e.scale&&t.scale(e.scale),t}function bg(e){return e.transformAsPoint([0,0,0])}function xg(e){return e.transformDirection([0,0,-1])}function Sg(e,t){return typeof t==`number`?t:(e.skins||[]).findIndex(n=>{if(n===t||t.id&&n.id===t.id)return!0;if(n.joints.length!==t.joints?.length||!n.joints.every((e,n)=>e===t.joints?.[n]))return!1;if(typeof t.inverseBindMatrices==`number`){let r=e.accessors[t.inverseBindMatrices];return!n.inverseBindMatrices||n.inverseBindMatrices===r}return!0})}var Cg={KHR_draco_mesh_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Decoded by loaders.gl before luma.gl builds the scenegraph.`},EXT_meshopt_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering.`},KHR_meshopt_compression:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`Decoded by loaders.gl v5 before luma.gl builds the scenegraph.`},KHR_mesh_quantization:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Loader-materialized quantized accessors retain their typed values and normalization.`},EXT_mesh_features:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned.`},EXT_structural_metadata:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned.`},KHR_lights_punctual:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Parsed into luma.gl Light objects.`},KHR_materials_unlit:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Unlit materials bypass the default lighting path.`},KHR_materials_emissive_strength:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Applied by the stock PBR shader.`},KHR_texture_basisu:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`BasisU / KTX2 textures pass through when the device supports them.`},KHR_texture_transform:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking.`},EXT_texture_webp:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Texture source is resolved during load; final support depends on browser and device decode support.`},EXT_texture_avif:{supportLevel:`none`,standardStatus:`ratified`,comment:`The image loader can decode supported AVIF images, but GLTFLoader does not select EXT_texture_avif sources.`},KHR_materials_specular:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies specular factors and textures to the dielectric F0 term.`},KHR_materials_ior:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now drives dielectric reflectance from the glTF IOR value.`},KHR_materials_transmission:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer.`},KHR_materials_volume:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Thickness and attenuation now tint transmitted light in the stock shader.`},KHR_materials_clearcoat:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a secondary clearcoat specular lobe.`},KHR_materials_sheen:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a sheen lobe for cloth-like materials.`},KHR_materials_iridescence:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now tints specular response with a view-dependent thin-film iridescence approximation.`},KHR_materials_anisotropy:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation.`},KHR_materials_pbrSpecularGlossiness:{supportLevel:`loader-only`,standardStatus:`archived`,comment:`Extension data can be loaded, but it is not translated into the default metallic-roughness material path.`},KHR_materials_variants:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Primitive material variants can be selected and restored on the generated scenegraph.`},EXT_mesh_gpu_instancing:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Accessor-backed instance transforms use one instanced draw per source primitive.`},KHR_node_visibility:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Recursive node visibility controls rendered geometry, punctual lights, and animation.`},KHR_animation_pointer:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates.`},EXT_materials_bump:{supportLevel:`built-in`,standardStatus:`draft`,comment:`The experimental bump-map draft perturbs the canonical surface normal from a linear height texture.`},KHR_materials_diffuse_transmission:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures.`},KHR_materials_dispersion:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction.`},KHR_materials_volume_scatter:{supportLevel:`parsed-and-wired`,standardStatus:`draft`,comment:`The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented.`},KHR_xmp:{supportLevel:`none`,standardStatus:`archived`,comment:`Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them.`},KHR_xmp_json_ld:{supportLevel:`none`,standardStatus:`ratified`,comment:`Metadata is preserved in the glTF, but luma.gl does not interpret it.`},EXT_lights_image_based:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Use loadPBREnvironment() or custom environment setup instead.`},EXT_texture_video:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Video textures are not created automatically by the stock pipeline.`},MSFT_lod:{supportLevel:`parsed-and-wired`,standardStatus:`vendor`,comment:`Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented.`}};function wg(e){return Cg[e]||null}function Tg(e){let t=e.animations||[],n=new Map,r=new Map;return t.flatMap((t,i)=>{let a=t.name||`Animation-${i}`,o=new Map,s=t.channels.flatMap(({sampler:i,target:a})=>{let s=jg(e,a),c=`${i}:${s??0}`,l=o.get(c);if(!l){let a=t.samplers[i];if(!a)throw Error(`Cannot find animation sampler ${i}`);let{input:u,interpolation:d=`LINEAR`,output:f}=a,p=Hg(e.accessors[u],n),m=Ug(e.accessors[f],r);l={input:p,interpolation:d,output:s===void 0?m:Mg(m,p.length,d,s)},o.set(c,l)}let u=Eg(e,a,l);return u?[u]:[]});return s.length?[{name:a,channels:s}]:[]})}function Eg(e,t,n){if(t.path===`pointer`)return Dg(e,t,n);let r=Pg(t.path);if(!r)return null;let i=e.nodes[t.node??0];if(!i)throw Error(`Cannot find animation target ${t.node}`);return{type:`node`,sampler:n,targetNodeId:i.id,path:r}}function Dg(e,t,n){let r=t.extensions?.KHR_animation_pointer?.pointer;if(typeof r!=`string`||!r.startsWith(`/`))return s.warn(`KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped`)(),null;let i=Rg(r);switch(i[0]){case`nodes`:return Ag(e,i,n,r);case`materials`:return Ng(e,i,n,r);case`cameras`:return Og(e,i,n,r);case`extensions`:if(i[1]===`KHR_lights_punctual`)return kg(e,i,n,r);break;default:break}return Vg(r,`top-level target "${i[0]}" has no runtime animation mapping`),null}function Og(e,t,n,r){let i=Number(t[1]),a=e.cameras?.[i],o=t[2],s=t[3];return t.length!==4||!Number.isInteger(i)||!a||o!==`perspective`&&o!==`orthographic`||a.type!==o||!(o===`perspective`?[`aspectRatio`,`yfov`,`znear`,`zfar`]:[`xmag`,`ymag`,`znear`,`zfar`]).includes(s)?(Vg(r,`camera pointers must target a supported projection property`),null):{type:`camera`,sampler:n,pointer:r,targetCameraIndex:i,projection:o,property:s}}function kg(e,t,n,r){let i=Number(t[3]),a=e.lights||e.extensions?.KHR_lights_punctual?.lights,o=t[4]===`spot`,s=o?t[5]:t[4],c=!o&&s===`color`?t[5]:void 0,l=[`color`,`intensity`,`range`,`innerConeAngle`,`outerConeAngle`],u=o||c!==void 0?6:5;return t[2]!==`lights`||t.length!==u||!Number.isInteger(i)||!Array.isArray(a)||!a[i]||!l.includes(s)||o&&s!==`innerConeAngle`&&s!==`outerConeAngle`||c!==void 0&&(!/^[0-2]$/.test(c)||s!==`color`)?(Vg(r,`punctual-light pointers must target supported typed light properties`),null):{type:`light`,sampler:n,pointer:r,targetLightIndex:i,property:s,...c===void 0?{}:{component:Number(c)}}}function Ag(e,t,n,r){let i=t.length===5&&t[2]===`extensions`&&t[3]===`KHR_node_visibility`&&t[4]===`visible`;if(t.length!==3&&!i)return Vg(r,`node pointers must target transforms, morph weights, or KHR_node_visibility.visible`),null;let a=Number(t[1]),o=e.nodes[a];if(!Number.isInteger(a)||!o)return s.warn(`KHR_animation_pointer target ${r} references a missing node and will be skipped`)(),null;if(i&&n.interpolation!==`STEP`)return Vg(r,`boolean visibility animation requires STEP interpolation`),null;let c=i?`visibility`:Pg(t[2]);return c?{type:`node`,sampler:n,targetNodeId:o.id,path:c}:(Vg(r,`node property "${t[2]}" has no runtime animation mapping`),null)}function jg(e,t){let n;if(t.path===`weights`)n=t.node;else if(t.path===`pointer`){let e=t.extensions?.KHR_animation_pointer?.pointer,r=typeof e==`string`?/^\/nodes\/(\d+)\/weights$/.exec(e):null;if(!r)return;n=Number(r[1])}else return;let r=e.nodes[n??0],i=typeof r?.mesh==`number`?e.meshes[r.mesh]:r?.mesh;return r?.weights?.length||i?.weights?.length||i?.primitives?.[0]?.targets?.length||1}function Mg(e,t,n,r){let i=n===`CUBICSPLINE`?3:1,a=e.length/(Math.max(t,1)*i),o=r>1?r:Number.isInteger(a)&&a>1?a:r;if(o<=1)return e;let s=e.flat(),c=[];for(let e=0;e<s.length;e+=o)c.push(s.slice(e,e+o));return c}function Ng(e,t,n,r){if(t.length<3)return Vg(r,`material pointers must include a material index and target property path`),null;let i=Number(t[1]),a=e.materials[i];if(!Number.isInteger(i)||!a)return s.warn(`KHR_animation_pointer target ${r} references a missing material and will be skipped`)(),null;let o=Fg(a,t.slice(2));return`reason`in o?(Vg(r,o.reason),null):{sampler:n,pointer:r,targetMaterialIndex:i,...o}}function Pg(e){switch(e){case`translation`:case`rotation`:case`scale`:case`weights`:return e;default:return null}}function Fg(e,t){let n=Ig(e,t);if(!(`reason`in n)||n.reason!==`not-a-texture-transform-target`)return n;switch(t.join(`/`)){case`pbrMetallicRoughness/baseColorFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`baseColorFactor`}:{reason:J(t)};case`pbrMetallicRoughness/metallicFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:0}:{reason:J(t)};case`pbrMetallicRoughness/roughnessFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:1}:{reason:J(t)};case`normalTexture/scale`:return e.normalTexture?{type:`material`,property:`normalScale`}:{reason:J(t)};case`occlusionTexture/strength`:return e.occlusionTexture?{type:`material`,property:`occlusionStrength`}:{reason:J(t)};case`emissiveFactor`:return{type:`material`,property:`emissiveFactor`};case`alphaCutoff`:return{type:`material`,property:`alphaCutoff`};case`extensions/KHR_materials_specular/specularFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularIntensityFactor`}:{reason:J(t)};case`extensions/KHR_materials_specular/specularColorFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularColorFactor`}:{reason:J(t)};case`extensions/KHR_materials_ior/ior`:return e.extensions?.KHR_materials_ior?{type:`material`,property:`ior`}:{reason:J(t)};case`extensions/EXT_materials_bump/bumpFactor`:return e.extensions?.EXT_materials_bump?{type:`material`,property:`bumpFactor`}:{reason:J(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionFactor`}:{reason:J(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionColorFactor`}:{reason:J(t)};case`extensions/KHR_materials_volume_scatter/multiscatterColorFactor`:case`extensions/KHR_materials_volume_scatter/multiscatterColor`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`multiscatterColorFactor`}:{reason:J(t)};case`extensions/KHR_materials_volume_scatter/scatterAnisotropy`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`scatterAnisotropy`}:{reason:J(t)};case`extensions/KHR_materials_dispersion/dispersion`:return e.extensions?.KHR_materials_dispersion?{type:`material`,property:`dispersion`}:{reason:J(t)};case`extensions/KHR_materials_transmission/transmissionFactor`:return e.extensions?.KHR_materials_transmission?{type:`material`,property:`transmissionFactor`}:{reason:J(t)};case`extensions/KHR_materials_volume/thicknessFactor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`thicknessFactor`}:{reason:J(t)};case`extensions/KHR_materials_volume/attenuationDistance`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationDistance`}:{reason:J(t)};case`extensions/KHR_materials_volume/attenuationColor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationColor`}:{reason:J(t)};case`extensions/KHR_materials_clearcoat/clearcoatFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatFactor`}:{reason:J(t)};case`extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatRoughnessFactor`}:{reason:J(t)};case`extensions/KHR_materials_sheen/sheenColorFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenColorFactor`}:{reason:J(t)};case`extensions/KHR_materials_sheen/sheenRoughnessFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenRoughnessFactor`}:{reason:J(t)};case`extensions/KHR_materials_iridescence/iridescenceFactor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceFactor`}:{reason:J(t)};case`extensions/KHR_materials_iridescence/iridescenceIor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceIor`}:{reason:J(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMinimum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:0}:{reason:J(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMaximum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:1}:{reason:J(t)};case`extensions/KHR_materials_anisotropy/anisotropyStrength`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyStrength`}:{reason:J(t)};case`extensions/KHR_materials_anisotropy/anisotropyRotation`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyRotation`}:{reason:J(t)};case`extensions/KHR_materials_emissive_strength/emissiveStrength`:return e.extensions?.KHR_materials_emissive_strength?{type:`material`,property:`emissiveStrength`}:{reason:J(t)};default:return{reason:J(t)}}}function Ig(e,t){let n=t.lastIndexOf(`extensions`);if(n<0||t[n+1]!==`KHR_texture_transform`||n<1)return{reason:`not-a-texture-transform-target`};let r=Xh(t.slice(0,n));if(!r)return{reason:zg(t.slice(0,n))};let i=Lg(e,r.pathSegments);if(!i)return{reason:`texture-transform target "${t.slice(0,n).join(`/`)}" does not exist on the referenced material`};let a=t[n+2];if(a===`texCoord`)return{reason:`animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update`};if(a!==`offset`&&a!==`rotation`&&a!==`scale`)return{reason:`KHR_texture_transform property "${a}" is not animatable; supported properties are offset, rotation, and scale`};let o=t[n+3];if(t.length>n+4)return{reason:`KHR_texture_transform.${a} does not support nested property paths`};let s;if(o!==void 0){if(s=Number(o),a===`rotation`)return{reason:`KHR_texture_transform.rotation does not support component indices`};if(!Number.isInteger(s)||s<0||s>1)return{reason:`KHR_texture_transform.${a} component index "${o}" is invalid; only 0 and 1 are supported`}}return{type:`textureTransform`,textureSlot:r.slot,path:a,component:s,baseTransform:Jh(i)}}function Lg(e,t){let n=e;for(let e of t)if(n=n?.[e],!n)return null;return n}function Rg(e){return e.slice(1).split(`/`).map(e=>e.replace(/~1/g,`/`).replace(/~0/g,`~`))}function J(e){let t=Bg(e);if(t){let e=wg(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join(`/`)}"`}function zg(e){let t=Bg(e);if(t){let e=wg(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join(`/`)}" has no runtime texture-slot mapping`}function Bg(e){let t=e.indexOf(`extensions`),n=e[t+1];return t>=0&&n?n:null}function Vg(e,t){s.warn(`KHR_animation_pointer target ${e} will be skipped because ${t}`)()}function Hg(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=Wg(e);Gg(r===1,`accessorToJsArray1D must have exactly 1 component`);let i=Array.from(n);return t.set(e,i),i}function Ug(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=Wg(e);Gg(r>=1,`accessorToJsArray2D must have at least 1 component`);let i=[];for(let e=0;e<n.length;e+=r)i.push(Array.from(n.slice(e,e+r)));return t.set(e,i),i}function Wg(e){if(e.value)return{value:e.value,components:e.components};let t=e.bufferView?.data;Gg(t!==void 0),Gg(e.componentType===5126);let n=e.type===`SCALAR`?1:Number(e.type.slice(3));return{value:new Float32Array(t.buffer,t.byteOffset+(e.byteOffset||0),e.count*n),components:n}}function Gg(e,t){if(!e)throw Error(t)}function Kg(e,t){return qg(e||{},t)}function qg(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))i&&typeof i==`object`&&!Array.isArray(i)?r[e]=qg(r[e]||{},t[e],n+1):r[e]=t[e];return r}var Jg=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){qe(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){qe(this.isRunning),this.isRunning=!1,this._reject(e)}},Yg=class{terminate(){}},Xg=new Map;function Zg(e){qe(e.source&&!e.url||!e.source&&e.url);let t=Xg.get(e.source||e.url);return t||(e.url&&(t=Qg(e.url),Xg.set(e.url,t)),e.source&&(t=$g(e.source),Xg.set(e.source,t))),qe(t),t}function Qg(e){return e.startsWith(`http`)?$g(e_(e)):e}function $g(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function e_(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function t_(e,t=!0,n){let r=n||new Set;if(e){if(n_(e))r.add(e);else if(n_(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)t_(e[n],t,r)}return n===void 0?Array.from(r):[]}function n_(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}function r_(e){if(e===null)return{};let t=Object.assign({},e);return Object.keys(t).forEach(n=>{typeof e[n]==`object`&&!ArrayBuffer.isView(e[n])&&!(e[n]instanceof Array)?t[n]=r_(e[n]):typeof t[n]==`function`||t[n]instanceof RegExp?t[n]={}:t[n]=e[n]}),t}var i_=()=>{},a_=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&Xe||Yg!==void 0&&!Xe}constructor(e){let{name:t,source:n,url:r}=e;qe(n||r),this.name=t,this.source=n,this.url=r,this.onMessage=i_,this.onError=e=>console.log(e),this.worker=Xe?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=i_,this.onError=i_,this.worker.terminate(),this.terminated=!0}unref(){!Xe&&typeof this.worker.unref==`function`&&this.worker.unref()}ref(){!Xe&&typeof this.worker.ref==`function`&&this.worker.ref()}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=t_(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){this._loadableURL=Zg({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url)e=new Yg(this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`});else if(this.source)e=new Yg(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},o_=class{name=`unnamed`;source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return a_.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new Jg(t.name,e);e.ref(),e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch{}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):(e.unref(),this.idleQueue.push(e)),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new a_({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return Je?this.maxMobileConcurrency:this.maxConcurrency}},s_={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},c_=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return a_.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...s_},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r}=e,i=this.workerPools.get(t);return i||(i=new o_({name:t,source:n,url:r}),i.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,i)),i}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}},l_=new Set;function u_(e){let t=e.version===Ke?``:` (worker-utils@${Ke})`;return`${e.name}@${e.version}${t}`}function d_(e,t={}){let n=t[e.id]||{},r=Xe?`${e.id}-worker.js`:`${e.id}-worker-node.js`,i=n.workerUrl;if(!i&&e.id===`compression`&&(i=t.workerUrl),(t._workerType||t?.core?._workerType)===`test`&&(i=Xe?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!i){let t=e.version;t===`latest`&&(t=Ye);let n=t?`@${t}`:``;i=`https://unpkg.com/@loaders.gl/${e.module}${n}/dist/${r}`,f_(e,i)}return qe(i),i}function f_(e,t){if(e.version!==`latest`)return;let n=`${e.module}:${e.id}`;l_.has(n)||(l_.add(n),console.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`))}function p_(e,t){return c_.isSupported()?e.worker&&t?.worker:!1}async function m_(e,t,n={},r={},i={}){let a=u_(e),o=c_.getWorkerFarm(n),{source:s}=n,c={name:a,source:s};s||(c.url=d_(e,n));let l=o.getWorkerPool(c),u=n.jobName||e.name,d=await l.startJob(u,h_.bind(null,r)),f=r_(n),p=r_(i);return d.postMessage(`process`,{input:t,options:f,context:p}),(await d.result).result}async function h_(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{if(!e.process){t.postMessage(`error`,{id:i,error:`Worker not set up to process on main thread`});return}let n=await e.process(a,o,void 0,r.context||{});t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`process-on-worker: unknown message ${n}`)}}function g_(e,t=Ke){qe(e,`no worker provided`);let n=e.version;return!(!t||!n)}function __(e,t){let n=b_(t),r=n._nodeWorkers;return!Xe&&!r||e.id===`excel`&&t?.excel?.shape===`arrow-table`||e.id===`ply`&&t?.ply?.shape===`arrow-table`||e.id===`csv`&&!S_(t)?!1:!!p_(e,n)}async function v_(e,t,n,r,i){let a=await m_(e,t,b_(n),{process:async(e,t,n,a)=>{if(!i)throw Error(`Worker not set up to parse on main thread`);return await y_(i,e,t,r?{...r,...a||{}}:void 0)}},x_(r));return C_(e)?e.deserializeWorkerResult(a,n,r):a}function y_(e,t,n,r){return e.length<=2?e(t,n):e(t,void 0,n,r)}function b_(e={}){let t=JSON.parse(JSON.stringify(e));return{...t.core,...t}}function x_(e){if(!e)return{};let{fetch:t,loaders:n,coreApi:r,_parse:i,_parseSync:a,_parseInBatches:o,...s}=e;return JSON.parse(JSON.stringify(s))}function S_(e){let t=e;return(t?.csv?.shape??t?.core?.shape)===`arrow-table`}function C_(e){return typeof e.deserializeWorkerResult==`function`}async function w_(e){let t=[];for await(let n of e)t.push(T_(n));return Oe(...t)}function T_(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return E_(t,n,r)}return E_(e)}function E_(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}var D_=``,O_={};function k_(e){for(let t in O_)if(e.startsWith(t)){let n=O_[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${D_}${e}`),e}function A_(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function j_(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}function M_(e){return!!(e&&typeof e==`object`&&`createDataSource`in e)}function N_(e){switch(typeof e==`object`&&e?.shape){case`array-row-table`:case`object-row-table`:return Array.isArray(e.data);case`geojson-table`:return Array.isArray(e.features);case`columnar-table`:return e.data&&typeof e.data==`object`;case`arrow-table`:return e?.data?.numRows!==void 0;default:return!1}}function P_(e){switch(e.shape){case`array-row-table`:case`object-row-table`:return e.data.length;case`geojson-table`:return e.features.length;case`arrow-table`:return e.data.numRows;case`columnar-table`:for(let t of Object.values(e.data))return t.length||0;return 0;default:throw Error(`table`)}}function F_(e){return{...e,length:P_(e),batchType:`data`}}var I_={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},L_={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Y={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},R_={magFilter:Y.TEXTURE_MAG_FILTER,minFilter:Y.TEXTURE_MIN_FILTER,wrapS:Y.TEXTURE_WRAP_S,wrapT:Y.TEXTURE_WRAP_T},z_={[Y.TEXTURE_MAG_FILTER]:Y.LINEAR,[Y.TEXTURE_MIN_FILTER]:Y.NEAREST_MIPMAP_LINEAR,[Y.TEXTURE_WRAP_S]:Y.REPEAT,[Y.TEXTURE_WRAP_T]:Y.REPEAT};function B_(){return{id:`default-sampler`,parameters:z_}}function V_(e){return L_[e]}function H_(e){return I_[e]}var U_=class{baseUri=``;jsonUnprocessed;json;buffers=[];images=[];postProcess(e,t={}){let{json:n,buffers:r=[],images:i=[]}=e,{baseUri:a=``}=e;return Ne(n),this.baseUri=a,this.buffers=r,this.images=i,this.jsonUnprocessed=n,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){let n={...e};return this.json=n,e.bufferViews&&(n.bufferViews=e.bufferViews.map((e,t)=>this._resolveBufferView(e,t))),e.images&&(n.images=e.images.map((e,t)=>this._resolveImage(e,t))),e.samplers&&(n.samplers=e.samplers.map((e,t)=>this._resolveSampler(e,t))),e.textures&&(n.textures=e.textures.map((e,t)=>this._resolveTexture(e,t))),e.accessors&&(n.accessors=e.accessors.map((e,t)=>this._resolveAccessor(e,t))),e.materials&&(n.materials=e.materials.map((e,t)=>this._resolveMaterial(e,t))),e.meshes&&(n.meshes=e.meshes.map((e,t)=>this._resolveMesh(e,t))),e.nodes&&(n.nodes=e.nodes.map((e,t)=>this._resolveNode(e,t)),n.nodes=n.nodes.map((e,t)=>this._resolveNodeChildren(e))),e.skins&&(n.skins=e.skins.map((e,t)=>this._resolveSkin(e,t))),e.scenes&&(n.scenes=e.scenes.map((e,t)=>this._resolveScene(e,t))),typeof this.json.scene==`number`&&n.scenes&&(n.scene=n.scenes[this.json.scene]),n}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t==`object`)return t;let n=e&&e[t];return n||console.warn(`glTF file error: Could not find ${e}[${t}]`),n}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(e=>this.getNode(e))}}_resolveNode(e,t){let n={...e,id:e?.id||`node-${t}`};return e.mesh!==void 0&&(n.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(n.camera=this.getCamera(e.camera)),e.skin!==void 0&&(n.skin=this.getSkin(e.skin)),e.meshes!==void 0&&e.meshes.length&&(n.mesh=e.meshes.reduce((e,t)=>{let n=this.getMesh(t);return e.id=n.id,e.primitives=e.primitives.concat(n.primitives),e},{primitives:[]})),n}_resolveNodeChildren(e){return e.children&&=e.children.map(e=>this.getNode(e)),e}_resolveSkin(e,t){let n=typeof e.inverseBindMatrices==`number`?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:n}}_resolveMesh(e,t){let n={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(n.primitives=e.primitives.map(e=>{let t={...e,attributes:{},indices:void 0,material:void 0},n=e.attributes;for(let e in n)t.attributes[e]=this.getAccessor(n[e]);return e.indices!==void 0&&(t.indices=this.getAccessor(e.indices)),e.material!==void 0&&(t.material=this.getMaterial(e.material)),t})),n}_resolveMaterial(e,t){let n={...e,id:e.id||`material-${t}`};if(n.normalTexture&&(n.normalTexture={...n.normalTexture},n.normalTexture.texture=this.getTexture(n.normalTexture.index)),n.occlusionTexture&&(n.occlusionTexture={...n.occlusionTexture},n.occlusionTexture.texture=this.getTexture(n.occlusionTexture.index)),n.emissiveTexture&&(n.emissiveTexture={...n.emissiveTexture},n.emissiveTexture.texture=this.getTexture(n.emissiveTexture.index)),n.emissiveFactor||=n.emissiveTexture?[1,1,1]:[0,0,0],n.pbrMetallicRoughness){n.pbrMetallicRoughness={...n.pbrMetallicRoughness};let e=n.pbrMetallicRoughness;e.baseColorTexture&&(e.baseColorTexture={...e.baseColorTexture},e.baseColorTexture.texture=this.getTexture(e.baseColorTexture.index)),e.metallicRoughnessTexture&&(e.metallicRoughnessTexture={...e.metallicRoughnessTexture},e.metallicRoughnessTexture.texture=this.getTexture(e.metallicRoughnessTexture.index))}return n}_resolveAccessor(e,t){let n=V_(e.componentType),r=H_(e.type),i=n*r,a={...e,id:e.id||`accessor-${t}`,bytesPerComponent:n,components:r,bytesPerElement:i,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(a.bufferView=this.getBufferView(e.bufferView)),a.bufferView){let e=a.bufferView.buffer,{ArrayType:t,byteLength:n}=Ae(a,a.bufferView),r=(a.bufferView.byteOffset||0)+(a.byteOffset||0)+e.byteOffset,i=Le(e.arrayBuffer,r,n);a.bufferView.byteStride&&(i=this._getValueFromInterleavedBuffer(e,r,a.bufferView.byteStride,a.bytesPerElement,a.count)),a.value=new t(i)}return a}_getValueFromInterleavedBuffer(e,t,n,r,i){let a=new Uint8Array(i*r);for(let o=0;o<i;o++){let i=t+o*n;a.set(new Uint8Array(e.arrayBuffer.slice(i,i+r)),o*r)}return a.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler==`number`?this.getSampler(e.sampler):B_(),source:typeof e.source==`number`?this.getImage(e.source):void 0}}_resolveSampler(e,t){let n={id:e.id||`sampler-${t}`,...e,parameters:{}};for(let e in n){let t=this._enumSamplerParameter(e);t!==void 0&&(n.parameters[t]=n[e])}return n}_enumSamplerParameter(e){return R_[e]}_resolveImage(e,t){let n={...e,id:e.id||`image-${t}`,image:null,bufferView:e.bufferView===void 0?void 0:this.getBufferView(e.bufferView)},r=this.images[t];return r&&(n.image=r),n}_resolveBufferView(e,t){let n=e.buffer,r=this.buffers[n].arrayBuffer,i=this.buffers[n].byteOffset||0;return e.byteOffset&&(i+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[n],data:new Uint8Array(r,i,e.byteLength)}}_resolveCamera(e,t){let n={...e,id:e.id||`camera-${t}`};return n.perspective,n.orthographic,n}};function W_(e,t){return new U_().postProcess(e,t)}var G_={alphaCutoff:`alphaCutoff`,anisotropyRotation:`anisotropyRotation`,anisotropyStrength:`anisotropyStrength`,attenuationColor:`attenuationColor`,attenuationDistance:`attenuationDistance`,baseColorFactor:`baseColor`,clearcoatFactor:`clearcoat`,clearcoatRoughnessFactor:`clearcoatRoughness`,bumpFactor:`bumpFactor`,diffuseTransmissionFactor:`diffuseTransmission`,diffuseTransmissionColorFactor:`diffuseTransmissionColor`,dispersion:`dispersion`,emissiveFactor:`emissive`,emissiveStrength:`emissiveStrength`,ior:`indexOfRefraction`,iridescenceFactor:`iridescence`,iridescenceIor:`iridescenceIndexOfRefraction`,normalScale:`normalScale`,multiscatterColorFactor:`multiscatterColor`,scatterAnisotropy:`scatterAnisotropy`,occlusionStrength:`occlusionStrength`,sheenColorFactor:`sheenColor`,sheenRoughnessFactor:`sheenRoughness`,specularColorFactor:`specularColor`,specularIntensityFactor:`specularIntensity`,thicknessFactor:`thickness`,transmissionFactor:`transmission`};function K_(e,t={}){return e.flatMap(e=>{let n=e.channels.flatMap(e=>Y_(e,t));return n.length>0?[{name:e.name,tracks:n}]:[]})}function q_(e,t){let n=e.nodes||{},r=new Map,i=new Map,a=new Map,o=!1,s;for(let[e,t]of Object.entries(n)){let n=new fc({id:e,...t.translation?{position:[...t.translation]}:{},...t.rotation?{rotation:[...t.rotation]}:{},...t.scale?{scale:[...t.scale]}:{},...t.matrix?{matrix:[...t.matrix]}:{}});t.weights&&(n.userData.morphWeights=[...t.weights]),r.set(e,n)}for(let[e,t]of Object.entries(n))t.parent&&r.get(t.parent)?.add(r.get(e));let c=(e,t,n)=>{let r=i.get(e)||{};if(t.component!==void 0){let i=e.getParameters(),a=r[t.path]||i[t.path],o=Array.isArray(a)?[...a]:[];o[t.component]=n[0],r[t.path]=o}else r[t.path]=n.length===1?n[0]:[...n];i.set(e,r)},l=e=>{let{target:s}=e,l=`${s.type}:${s.identifier}:${s.path}:${s.component??`*`}`;if(s.type===`node`){let e=r.get(s.identifier);return e?{id:l,getValue:()=>s.path===`translation`?e.position:s.path===`rotation`?e.rotation:s.path===`scale`?e.scale:e.userData.morphWeights||[],setValue:r=>{if(s.path===`translation`)e.setPosition(r);else if(s.path===`rotation`)e.setRotation(r);else if(s.path===`scale`)e.setScale(r);else if(s.path===`weights`){e.userData.morphWeights=[...r];for(let e of n[s.identifier]?.geometries||[]){let n=t.geometries?.get(e);if(n){let e=i.get(n)||{};e.morphWeights=[...r],i.set(n,e)}}return}e.updateMatrix(),o=!0}}:null}if(s.type===`sampler`){let n=t.samplers?.get(s.identifier);if(!n)return null;let r=e.baseTransform||{offset:[0,0],rotation:0,scale:[1,1]},o=a.get(s.identifier);o||(o={offset:[...r.offset],rotation:r.rotation,scale:[...r.scale]},a.set(s.identifier,o));let c=o;return{id:l,setValue:e=>{s.path===`rotation`?c.rotation=e[0]:(s.path===`offset`||s.path===`scale`)&&(s.component===void 0?c[s.path]=[e[0],e[1]]:c[s.path][s.component]=e[0]);let t=i.get(n)||{};t.transform=Zh(c),i.set(n,t)}}}let u=s.type===`instance`?t.instances.get(s.identifier):s.type===`material`?t.materials?.get(s.identifier):s.type===`light`?t.lights?.get(s.identifier):s.type===`camera`?t.camera:void 0;return u?{id:l,getValue:()=>{let e=u.getParameters()[s.path];return Array.isArray(e)?s.component===void 0?e:[e[s.component]||0]:typeof e==`number`?[e]:[]},setValue:e=>c(u,s,e)}:null},u=(e.clips||[]).map(e=>{let t=e.tracks.flatMap(e=>{let t=l(e);return t?[new Lt({name:`${e.target.type}:${e.target.identifier}:${e.target.path}`,times:e.times,values:e.values,interpolation:e.interpolation,valueType:e.target.path===`rotation`&&e.target.type===`node`?`quaternion`:`vector`,binding:t})]:[]});return new Rt({name:e.name,tracks:t,duration:e.duration})}),d=new Bt(u),f=e.playback?.clip||u[0]?.name;if(f){let t=d.clipAction(f,{loop:e.playback?.loop,timeScale:e.playback?.speed});t.play(),e.playback?.playing===!1&&t.pause()}let p=(e,a)=>{let o=r.get(e);if(!o)return;let s=new P(a).multiplyRight(o.matrix);for(let r of n[e]?.instances||[]){let e=t.instances.get(r);if(e){let t=i.get(e)||{};t.transform=Array.from(s),i.set(e,t)}}for(let[t,r]of Object.entries(n))r.parent===e&&p(t,s)},m=()=>{if(!t.skins?.size)return;let e=new Map;for(let[t,i]of Object.entries(n))i.parent||r.get(t)?.preorderTraversal((t,{worldMatrix:n})=>{t instanceof fc&&e.set(t,new P(n))});for(let[n,a]of t.skins){let t=r.get(a.node),o=a.joints.flatMap(e=>{let t=r.get(e);return t?[t]:[]});if(!t||o.length!==a.joints.length)continue;let s=In({joints:o,meshNode:t,worldMatrices:e,inverseBindMatrices:a.inverseBindMatrices}),c=n.getParameter(`skin`)?.jointMatrices;if(c?.length===s.length&&s.every((e,t)=>e===c[t]))continue;let l=i.get(n)||{};l.skin={jointMatrices:s},i.set(n,l)}},h=()=>{if(o){for(let[e,t]of Object.entries(n))t.parent||p(e,new P);m(),o=!1}for(let[e,t]of i){let n=e.getParameters(),r=Object.fromEntries(Object.entries(t).filter(([e,t])=>!J_(n[e],t)));Object.keys(r).length!==0&&(e.type===`geometry`||e.type===`material`||e.type===`light`||e.type===`camera`||e.type===`surface`?e.setParameters(r):(e.type===`sampler`||e.type===`instance`)&&e.setParameter(`transform`,r.transform),e.commitParameters())}i.clear()};return t.skins?.size&&(m(),h()),{mixer:d,clipNames:u.map(e=>e.name),get activeClip(){return f},update(e){let t=s===void 0?0:e-s;s=e,d.update(t),h()},selectClip(e){f&&f!==e&&d.getAction(f)?.stop(),f=e,d.clipAction(e).play(),h()},play(){f&&d.clipAction(f).play()},pause(){f&&d.clipAction(f).pause()},seek(e){let t=f?d.getAction(f):void 0;t?(t.setTime(e),d.time=e,d.update(0)):d.setTime(e),h()},setSpeed(e){f&&d.clipAction(f).setEffectiveTimeScale(e)}}}function J_(e,t){return Array.isArray(e)&&Array.isArray(t)?e.length===t.length&&e.every((e,n)=>e===t[n]):e===t}function Y_(e,t){let n,r;if(e.type===`node`)n={type:`node`,identifier:t.nodeIdentifiers?.[e.targetNodeId]||e.targetNodeId,path:e.path};else if(e.type===`material`){let r=t.materialIdentifiers?.[e.targetMaterialIndex];if(!r)return[];let i=e.property===`baseColorFactor`&&e.component===3;if(i&&t.materialAlphaModes?.[e.targetMaterialIndex]===`OPAQUE`)return[];let a=e.property===`metallicRoughnessValues`||e.property===`iridescenceThicknessRange`||i,o=i?`opacity`:e.property===`metallicRoughnessValues`?e.component===0?`metallic`:`roughness`:e.property===`iridescenceThicknessRange`?e.component===0?`iridescenceThicknessMinimum`:`iridescenceThicknessMaximum`:G_[e.property];if(!o)return[];n={type:`material`,identifier:r,path:o,...e.component!==void 0&&!a?{component:e.component}:{}}}else if(e.type===`textureTransform`){let i=t.samplerIdentifiers?.[`${e.targetMaterialIndex}:${e.textureSlot}`];if(!i)return[];n={type:`sampler`,identifier:i,path:e.path,...e.component===void 0?{}:{component:e.component}},r={offset:[...e.baseTransform.offset],rotation:e.baseTransform.rotation,scale:[...e.baseTransform.scale]}}else return[];let i=e.sampler.interpolation,a={target:n,times:[...e.sampler.input],values:e.sampler.output.map(e=>[...e]),...i===`LINEAR`?{}:{interpolation:i},...r?{baseTransform:r}:{}};return e.type===`material`&&e.property===`baseColorFactor`&&e.component===void 0&&e.sampler.output.every(e=>e.length>3)&&t.materialAlphaModes?.[e.targetMaterialIndex]!==`OPAQUE`?[a,{...a,target:{...n,path:`opacity`},values:e.sampler.output.map(e=>[e[3]])}]:[a]}var X_=[`triangle`,`sphere`,`cylinder`,`cone`,`quad`],Z_=[`matte`,`physicallyBased`],Q_=[`ambient`,`directional`,`point`,`spot`],$_=[`perspective`,`orthographic`],ev=[`default`,`deferred`,`raytrace`,`debugNormals`,`debugDepth`],tv={"@@type":`default`,background:[.016,.019,.044,1],ambientRadiance:.1,exposure:1.5,bloomIntensity:.82,bloomThreshold:.64,bloomRadius:8,fogColor:[.018,.025,.065],fogDensity:24e-5},nv={resolutionScale:.5,minimumResolutionScale:.25,adaptiveResolution:!0,targetFrameTimeMilliseconds:33.3,temporalReprojection:!0,shadowSamplesPerFrame:1,progressive:!0,shadows:!0},rv=[`baseColorTexture`,`normalTexture`,`bumpTexture`,`metallicRoughnessTexture`,`emissiveTexture`,`occlusionTexture`,`specularColorTexture`,`specularIntensityTexture`,`clearcoatTexture`,`clearcoatRoughnessTexture`,`clearcoatNormalTexture`,`transmissionTexture`,`diffuseTransmissionTexture`,`diffuseTransmissionColorTexture`,`thicknessTexture`,`multiscatterColorTexture`,`sheenColorTexture`,`sheenRoughnessTexture`,`iridescenceTexture`,`iridescenceThicknessTexture`,`anisotropyTexture`],iv=new Map;async function av(e){if(typeof createImageBitmap!=`function`)return;let t=new Map;for(let n of Object.values(e.textures||{}))iv.has(n.source)||t.has(n.source)||t.set(n.source,fetch(n.source).then(async e=>{if(!e.ok)throw Error(`Unable to load texture "${n.source}": ${e.status}.`);return createImageBitmap(await e.blob())}).then(e=>{iv.set(n.source,e)}).catch(e=>{throw Error(`Unable to load texture "${n.source}": ${String(e)}`)}));await Promise.all(t.values())}function ov(e,t,n={}){if(t.version!==1)throw Error(`Scene "version" must be 1.`);let r=new Map,i=new Map,a=[],o=new Map,s=new Map,c=new Map,l=new Map,u=new Map,d=new Map,f=new Map,p=[],m=[],h=sv(t),g=[];for(let[n,i]of Object.entries(t.geometries)){let{"@@type":t,"vertex.position":a,"vertex.normal":o,"vertex.tangent":s,"vertex.joint":c,"vertex.weight":l,"vertex.attribute0":u,"vertex.attribute1":d,"vertex.attribute2":f,"primitive.index":p,morphTargets:m,generator:h,...g}=i;Sv(`geometry`,t,X_);let _={...g};if(a&&(_[`vertex.position`]=new Float32Array(a)),o&&(_[`vertex.normal`]=new Float32Array(o)),s&&(_[`vertex.tangent`]=new Float32Array(s)),c&&(_[`vertex.joint`]=new Uint16Array(c)),l&&(_[`vertex.weight`]=new Float32Array(l)),u&&(_[`vertex.attribute0`]=new Float32Array(u)),d&&(_[`vertex.attribute1`]=new Float32Array(d)),f&&Object.assign(_,{"vertex.attribute2":new Float32Array(f)}),p&&(_[`primitive.index`]=new Uint32Array(p)),m&&(_.morphTargets=m.map(e=>({...e.POSITION?{POSITION:new Float32Array(e.POSITION)}:{},...e.NORMAL?{NORMAL:new Float32Array(e.NORMAL)}:{},...e.TANGENT?{TANGENT:new Float32Array(e.TANGENT)}:{}}))),h){if(t!==`triangle`)throw Error(`Geometry "${n}" generators require the "triangle" subtype.`);Object.assign(_,fv(h))}r.set(n,e.newGeometry(t,_))}for(let[n,r]of Object.entries(t.textures||{})){let t=iv.get(r.source);if(!t)throw Error(`Texture "${n}" must be loaded before creating its ANARI scene.`);let o=og(e.device,t,{id:`anari-${n}`,width:t.width,height:t.height,colorSpace:r.colorSpace||`linear`,sampler:{addressModeU:`repeat`,addressModeV:`repeat`,minFilter:`linear`,magFilter:`linear`,...r.sampler}});a.push(o),i.set(n,e.newSampler(`image2D`,{image:o,transform:r.transform,textureCoordinateSet:r.textureCoordinateSet}))}for(let[n,r]of Object.entries(t.materials)){let{"@@type":t,...a}=r;Sv(`material`,t,Z_);let s={};for(let[e,t]of Object.entries(a))rv.includes(e)?s[e]=bv(i,String(t),`texture`):Object.assign(s,{[e]:t});o.set(n,e.newMaterial(t,s))}for(let[n,i]of Object.entries(t.surfaces)){let t=bv(r,i.geometry,`geometry`),a=bv(o,i.material,`material`),l=e.newSurface({geometry:t,material:a,...i.skin?{skin:{jointMatrices:new Float32Array(i.skin.joints.length*16)}}:{}});s.set(n,l),i.skin&&c.set(l,i.skin)}for(let n of t.lights||[]){let{"@@id":t,"@@type":r,animation:i,...a}=n;Sv(`light`,r,Q_),xv(l,t,`light`);let o=e.newLight(r,a);l.set(t,o),i&&g.push({identifier:t,light:o,parameters:a,animation:i})}for(let[n,r]of Object.entries(t.groups||{}))u.set(n,e.newGroup({surface:r.surfaces.map(e=>bv(s,e,`surface`)),light:r.lights?.map(e=>bv(l,e,`light`))}));let _=t=>{let n=t[`@@id`];xv(d,n,`instance`);let r;if(t.group)r=bv(u,t.group,`group`);else if(t.surface){let n=f.get(t.surface);r=n||e.newGroup({surface:[bv(s,t.surface,`surface`)]}),n||f.set(t.surface,r)}else throw Error(`Instance "${n}" must declare a "group" or "surface".`);let i=e.newInstance({group:r,transform:vv(t)});d.set(n,i);let a=t.animations||(t.animation?[t.animation]:[]);a.length>0&&!h.instances.has(n)&&p.push(cv(i,t,a))};for(let e of t.instances||[])_(e);for(let e of t.distributions||[]){if(e[`@@type`]!==`starfield`)throw Error(`Unsupported distribution "${e[`@@type`]}".`);for(let t of dv(e))_(t)}for(let{identifier:e,light:t,parameters:n,animation:r}of g)h.lights.has(e)||m.push(lv(t,n,r,d));let v=e.newWorld({surface:(t.world?.surfaces||[]).map(e=>bv(s,e,`surface`)),instance:t.world?.instances?t.world.instances.map(e=>bv(d,e,`instance`)):Array.from(d.values()),light:t.world?.lights?t.world.lights.map(e=>bv(l,e,`light`)):Array.from(l.values())}),{"@@type":y,target:b=[0,0,0],orbit:x,...S}=t.camera;Sv(`camera`,y,$_);let C=S.position||[0,4,12],w=e.newCamera(y,{...S,position:C,direction:S.direction||yv(b,C)}),{"@@type":T,...E}=t.renderer||tv,D=n.rendererSubtype||T;Sv(`renderer`,D,ev);let O=e.newRenderer(D,{...D===`raytrace`?nv:{},...E}),k=e.newFrame({world:v,camera:w,renderer:O}),A=t.clips?.length||c.size>0?q_(t,{instances:d,geometries:r,materials:o,samplers:i,lights:l,camera:w,skins:c}):void 0;return{frame:k,name:t.name,description:t.description||``,cameraTarget:b,cameraPosition:C,cameraOrbitSpeed:x?.speed||0,animations:A,update(e){A?.update(e);for(let t of p)t(e);for(let t of m)t(e)},destroy(){k.destroy();for(let e of a)e.destroy()}}}function sv(e){let t=new Set,n=new Set,r=new Set;for(let i of e.clips||[])for(let{target:e}of i.tracks)e.type===`instance`?t.add(e.identifier):e.type===`light`?n.add(e.identifier):e.type===`node`&&r.add(e.identifier);for(let[n,i]of Object.entries(e.nodes||{})){let a=new Set,o=n;for(;o&&!a.has(o);){if(r.has(o)){for(let e of i.instances||[])t.add(e);break}a.add(o),o=e.nodes?.[o]?.parent}}return{instances:t,lights:n}}function cv(e,t,n){let r=t.position||[0,0,0],i=t.rotation||[0,0,0];for(let e of n)if(e[`@@type`]!==`orbit`&&e[`@@type`]!==`bob`&&e[`@@type`]!==`spin`&&e[`@@type`]!==`wobble`)throw Error(`Instance "${t[`@@id`]}" does not support "${e[`@@type`]}" animation.`);return a=>{let o=r,s=[...i];for(let e of n)if(e[`@@type`]===`orbit`)o=uv(e,r,a);else if(e[`@@type`]===`bob`)o=[o[0],o[1]+Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.4),o[2]];else if(e[`@@type`]===`spin`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=a*(e.speed??1)+(e.phase||0)}else if(e[`@@type`]===`wobble`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.08)}e.setParameter(`transform`,vv({...t,position:o,rotation:s})).commitParameters()}}function lv(e,t,n,r){if(n[`@@type`]===`orbit`){let r=t.position||[3,2,0];return t=>{e.setParameter(`position`,uv(n,r,t)).commitParameters()}}if(n[`@@type`]===`pulse`){let r=t.intensity??1,i=n.amplitude??.5,a=n.speed??1,o=n.phase||0;return t=>{e.setParameter(`intensity`,r*(1+Math.sin(t*a+o)*i)).commitParameters()}}if(n[`@@type`]===`follow`){let t=bv(r,n.target,`instance`),i=n.offset||[0,0,0];return()=>{let n=t.getParameter(`transform`);n&&e.setParameter(`position`,[n[12]+i[0],n[13]+i[1],n[14]+i[2]]).commitParameters()}}throw Error(`Lights do not support "${n[`@@type`]}" animation.`)}function uv(e,t,n){let r=e.center||[0,t[1],0],i=e.radius||Math.hypot(t[0]-r[0],t[2]-r[2])||3,a=n*(e.speed??1)+(e.phase||0),o=Math.sin(a)*Math.sin(e.inclination||0)*i,s=(e.height||0)*Math.sin(a*(e.verticalFrequency??2));return[r[0]+Math.cos(a)*i,r[1]+o+s,r[2]+Math.sin(a)*i]}function dv(e){let t=[],n=e.seed||0;for(let r=0;r<e.count;r++){let i=_v(r*7+1+n)*Math.PI*2,a=_v(r*11+3+n)*.82+.08,o=e.radius*(.72+_v(r*13+5+n)*.32),s=.7+_v(r*19+n)*2;t.push({"@@id":`${e[`@@id`]}-${r}`,surface:e.surface,position:[Math.cos(i)*Math.cos(a)*o,Math.sin(a)*o,Math.sin(i)*Math.cos(a)*o],scale:[s,s,s]})}return t}function fv(e){return e[`@@type`]===`torus`?pv(e):e[`@@type`]===`crystal`?mv(e):hv(e)}function pv(e){let t=e.majorRadius??1,n=e.minorRadius??.035,r=e.majorSegments??64,i=e.minorSegments??8,a=(r+1)*(i+1),o=new Float32Array(a*3),s=new Float32Array(a*3),c=new Uint32Array(r*i*6);for(let e=0;e<=r;e++){let a=e/r*Math.PI*2,c=Math.cos(a),l=Math.sin(a);for(let r=0;r<=i;r++){let a=r/i*Math.PI*2,u=Math.cos(a),d=Math.sin(a),f=(e*(i+1)+r)*3,p=t+n*u;o[f]=p*c,o[f+1]=n*d,o[f+2]=p*l,s[f]=u*c,s[f+1]=d,s[f+2]=u*l}}let l=0;for(let e=0;e<r;e++)for(let t=0;t<i;t++){let n=e*(i+1)+t,r=(e+1)*(i+1)+t;c[l++]=n,c[l++]=r,c[l++]=n+1,c[l++]=n+1,c[l++]=r,c[l++]=r+1}return{"vertex.position":o,"vertex.normal":s,"primitive.index":c}}function mv(e){let t=e.radius??.5,n=e.height??1.8,r=e.sides??6,i=[],a=[];for(let e=0;e<r;e++){let o=e/r*Math.PI*2,s=(e+1)/r*Math.PI*2,c=[Math.cos(o)*t,0,Math.sin(o)*t],l=[Math.cos(s)*t,0,Math.sin(s)*t];gv(i,a,[0,n*.66,0],l,c),gv(i,a,[0,-n*.34,0],c,l)}return{"vertex.position":new Float32Array(i),"vertex.normal":new Float32Array(a)}}function hv(e){let t=e.radius??.5,n=e.height??1,r=e.sides??12,i=Math.min(e.bevel??.11,n*.24),a=[],o=[];for(let e=0;e<r;e++){let s=e/r*Math.PI*2,c=(e+1)/r*Math.PI*2,l=(e,t,n)=>[Math.cos(e)*t,n,Math.sin(e)*t],u=l(s,t*.77,-n/2),d=l(c,t*.77,-n/2),f=l(s,t,-n/2+i),p=l(c,t,-n/2+i),m=l(s,t,n/2-i),h=l(c,t,n/2-i),g=l(s,t*.77,n/2),_=l(c,t*.77,n/2);gv(a,o,u,f,p),gv(a,o,u,p,d),gv(a,o,f,m,h),gv(a,o,f,h,p),gv(a,o,m,g,_),gv(a,o,m,_,h),gv(a,o,[0,-n/2,0],u,d),gv(a,o,[0,n/2,0],_,g)}return{"vertex.position":new Float32Array(a),"vertex.normal":new Float32Array(o)}}function gv(e,t,n,r,i){let a=yv(r,n),o=yv(i,n),s=[a[1]*o[2]-a[2]*o[1],a[2]*o[0]-a[0]*o[2],a[0]*o[1]-a[1]*o[0]],c=Math.hypot(...s)||1,l=[s[0]/c,s[1]/c,s[2]/c];e.push(...n,...r,...i),t.push(...l,...l,...l)}function _v(e){let t=Math.sin(e*91.7341+19.19)*43758.5453;return t-Math.floor(t)}function vv(e){if(e.matrix)return e.matrix;let t=new P().translate(e.position||[0,0,0]);return e.rotation&&(t.rotateX(e.rotation[0]),t.rotateY(e.rotation[1]),t.rotateZ(e.rotation[2])),e.scale&&t.scale(e.scale),t}function yv(e,t){return[e[0]-t[0],e[1]-t[1],e[2]-t[2]]}function bv(e,t,n){let r=e.get(t);if(!r)throw Error(`Unknown ${n} reference "${t}".`);return r}function xv(e,t,n){if(!t)throw Error(`Every ${n} requires an "@@id".`);if(e.has(t))throw Error(`Duplicate ${n} identifier "${t}".`)}function Sv(e,t,n){if(!n.some(e=>e===t))throw Error(`Unsupported ${e} subtype "${t}". Expected ${n.join(`, `)}.`)}var Cv=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},wv=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,Tv=/^([-\w.]+\/[-\w.+]+)/;function Ev(e,t){return e.toLowerCase()===t.toLowerCase()}function Dv(e){let t=Tv.exec(e);return t?t[1]:e}function Ov(e){let t=wv.exec(e);return t?t[1]:``}var kv=/\?.*/;function Av(e){let t=e.match(kv);return t&&t[0]}function jv(e){return e.replace(kv,``)}function Mv(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function Nv(e){return ge(e)?e.url:M(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function Pv(e){if(ge(e)){let t=e.headers.get(`content-type`)||``,n=jv(e.url);return Dv(t)||Ov(n)}return M(e)?e.type||``:typeof e==`string`?Ov(e):``}function Fv(e){return ge(e)?e.headers[`content-length`]||-1:M(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function Iv(e){if(ge(e))return e;let t={},n=Fv(e);n>=0&&(t[`content-length`]=String(n));let r=Nv(e),i=Pv(e);i&&(t[`content-type`]=i);let a=await zv(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function Lv(e){if(!e.ok)throw await Rv(e)}async function Rv(e){let t=Mv(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new Cv(n,r)}async function zv(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${Bv(e.slice(0,5))}`:null}function Bv(e){let t=``,n=new Uint8Array(e);for(let e=0;e<n.byteLength;e++)t+=String.fromCharCode(n[e]);return btoa(t)}function Vv(e){return!Hv(e)&&!Uv(e)}function Hv(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function Uv(e){return e.startsWith(`data:`)}async function Wv(e,t){if(typeof e==`string`){let n=k_(e);return Vv(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await Iv(e)}var Gv=new t({id:`loaders.gl`}),Kv=class{log(){return()=>{}}info(){return()=>{}}once(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},qv={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,shape:void 0,log:new class{console;onceMessages=new Set;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}once(...e){let t=String(e[0]);return this.onceMessages.has(t)?()=>{}:(this.onceMessages.add(t),this.console.info.bind(this.console,...e))}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:We,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},Jv={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,shape:`core.shape`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},Yv=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`workerTransferBufferCopy`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`shape`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function Xv(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function Zv(){let e=Xv();return e.globalOptions=e.globalOptions||{...qv,core:{...qv.core}},$v(e.globalOptions)}function Qv(e,t,n,r){return n||=[],n=Array.isArray(n)?n:[n],ey(e,n),$v(ry(t,e,r))}function $v(e){let t=sy(e);cy(t);for(let e of Yv)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function ey(e,t){ty(e,null,qv,Jv,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};ty(r,n.id,i,a,t)}}function ty(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&he(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)Gv.level>0&&Gv.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&Gv.level>0){let e=ny(s,i);Gv.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function ny(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function ry(e,t,n){let r=e.options||{},i={...r};r.core&&(i.core={...r.core}),cy(i),i.core?.log===null&&(i.core={...i.core,log:new Kv}),ay(i,$v(Zv()));let a=$v(t);return ay(i,a),iy(i,a,e),oy(i,n),ly(i),i}function iy(e,t,n){let r=e.core?.shape;if(r===void 0)return;let i=n.options?.[n.id];if(!Te(i)||!(`shape`in i))return;let a=Zv()[n.id];if(Te(a)&&`shape`in a)return;let o=t[n.id];if(Te(o)&&`shape`in o)return;let s=e[n.id];e[n.id]={...Te(s)?s:{},shape:r}}function ay(e,t){for(let n in t)if(n in t){let r=t[n];Te(r)&&Te(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function oy(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=j_(jv(t)))}function sy(e){let t={...e};return e.core&&(t.core={...e.core}),t}function cy(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of Yv)if(e[t]!==void 0){e.core||={};let n=e.core;n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function ly(e){let t=e.core;if(t)for(let n of Yv)t[n]!==void 0&&(e[n]=t[n])}function uy(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function dy(e){Ue(e,`null loader`),Ue(uy(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var fy=()=>{let e=Xv();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function py(){return fy()}var my=/\.([^.]+)$/;async function hy(e,t=[],n,r){if(!yy(e))return null;let i=$v(n||{});if(i.core||={},e instanceof Response&&gy(e)){let n=_y(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=_y(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(M(e)&&(e=await e.slice(0,10).arrayBuffer(),a=_y(e,t,i,r)),!a&&e instanceof Response&&gy(e)&&(a=_y(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(by(e));return a}function gy(e){let t=Pv(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function _y(e,t=[],n,r){if(!yy(e))return null;let i=$v(n||{});if(i.core||={},t&&!Array.isArray(t))return dy(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...py()),xy(a);let o=vy(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(by(e));return o}function vy(e,t,n,r){let i=Nv(e),a=Pv(e),o=jv(i)||r?.url,s=null,c=``,l=n?.core&&`type`in n.core?n.core.type:void 0;return l&&l!==`auto`&&(s=wy(t,l),c=s?`match forced by supplied source type ${l}`:``),n?.core?.mimeType&&(s=Dy(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=Ty(t,o),c||=s?`matched source url ${o}`:``,s||=Sy(t,o),c||=s?`matched url ${o}`:``,s||=Dy(t,a),c||=s?`matched MIME type ${a}`:``,s||=Oy(t,e),c||=s?`matched initial data ${My(e)}`:``,!s&&M(e)&&(s=Ey(t,e),c||=s?`matched source testData`:``),n?.core?.fallbackMimeType&&(s||=Dy(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&Ge.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function yy(e){return!(e instanceof Response&&e.status===204)}function by(e){let t=Nv(e),n=Pv(e),r=`No valid loader found (`;r+=t?`${A_(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?My(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function xy(e){for(let t of e)dy(t)}function Sy(e,t){let n=t&&my.exec(t),r=n&&n[1];return r?Cy(e,r):null}function Cy(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function wy(e,t){for(let n of e)if(M_(n)&&n.type===t)return n;return null}function Ty(e,t){if(!t)return null;for(let n of e)if(M_(n)&&n.testURL(t))return n;return null}function Ey(e,t){for(let n of e)if(M_(n)&&n.testData?.(t))return n;return null}function Dy(e,t){for(let n of e)if(n.mimeTypes?.some(e=>Ev(t,e))||Ev(t,`application/x.${n.id}`))return n;return null}function Oy(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(ky(t,n))return n}else if(ArrayBuffer.isView(t)){if(Ay(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&Ay(t,0,n))return n;return null}function ky(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function Ay(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>jy(e,t,n,r))}function jy(e,t,n,r){if(Re(r))return ke(r,e,r.byteLength);switch(typeof r){case`function`:return r(Ee(e));case`string`:return r===Ny(e,t,r.length);default:return!1}}function My(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?Ny(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?Ny(e,0,t):``}function Ny(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var Py=256*1024;function*Fy(e,t){let n=t?.chunkSize||Py,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield Ee(i.encode(a))}}var Iy=256*1024;function*Ly(e,t={}){let{chunkSize:n=Iy}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var Ry=1024*1024;async function*zy(e,t){let n=t?.chunkSize||Ry,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function By(e,t){return We?Vy(e,t):Hy(e,t)}async function*Vy(e,t){let n=e.getReader(),r;try{for(;;){let e=r||n.read();t?._streamReadAhead&&(r=n.read());let{done:i,value:a}=await e;if(i)return;yield Fe(a)}}catch{n.releaseLock()}}async function*Hy(e,t){for await(let t of e)yield Fe(t)}function Uy(e,t){if(typeof e==`string`)return Fy(e,t);if(e instanceof ArrayBuffer)return Ly(e,t);if(M(e))return zy(e,t);if(_e(e))return By(e,t);if(ge(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return By(n,t)}throw Error(`makeIterator`)}var Wy=`Cannot convert supplied data type`;function Gy(e,t,n){if(t.text&&typeof e==`string`)return e;if(De(e)&&(e=e.buffer),Re(e)){let n=Pe(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):Fe(n)}throw Error(Wy)}async function Ky(e,t,n){if(typeof e==`string`||Re(e))return Gy(e,t,n);if(M(e)&&(e=await Iv(e)),ge(e))return await Lv(e),t.binary?await e.arrayBuffer():await e.text();if(_e(e)&&(e=Uy(e,n)),Be(e)||Ve(e))return w_(e);throw Error(Wy)}async function qy(e,t){if(typeof e==`string`)return new TextEncoder().encode(e).buffer;if(Re(e))return Fe(Pe(e));if(M(e)&&(e=await Iv(e)),ge(e))return await Lv(e),await e.arrayBuffer();if(_e(e)&&(e=Uy(e,t)),Be(e)||Ve(e))return w_(e);throw Error(Wy)}async function Jy(e,t){if(ze(e)&&(e=await e),we(e))return e;if(ge(e)){await Lv(e);let n=await e.body;if(!n)throw Error(Wy);return Uy(n,t)}return M(e)||_e(e)?Uy(e,t):Ve(e)||Be(e)?e:Yy(e)}function Yy(e){if(ArrayBuffer.isView(e)||Re(e))return(function*(){yield Fe(e)})();if(we(e))return e;if(Be(e))return e[Symbol.iterator]();throw Error(Wy)}function Xy(e,t){let n=Zv(),r=e||n,i=r.fetch??r.core?.fetch;return typeof i==`function`?i:he(i)?e=>Wv(e,i):t?.fetch?t?.fetch:Wv}var Zy=new Map,Qy=new Map;async function $y(e,t,n){if(tb(e))return e;let r=ib(e,t),i=Qy.get(e)?.get(r);if(i)return i;let a=Zy.get(e);a||(a=new Map,Zy.set(e,a));let o=a.get(r);return o||(o=nb(e,t,n).then(t=>{let n=Qy.get(e);return n||(n=new Map,Qy.set(e,n)),n.set(r,t),t}).catch(t=>{throw a.delete(r),a.size===0&&Zy.delete(e),t}),a.set(r,o)),await o}function eb(e){if(tb(e))return e;let t=ib(e);return Qy.get(e)?.get(t)||null}function tb(e){let t=e;return!!(t.parse||t.parseSync||t.parseInBatches||t.parseText||t.parseTextSync||t.parseFile||t.parseFileInBatches)}async function nb(e,t,n){if(e.preload){let r=await e.preload(n||``,t);if(tb(r))return r;throw Error(`${e.id} loader preload() did not return a parser-bearing loader`)}return await ob(rb(e,t),e.id)}function rb(e,t){if((t?._workerType||t?.core?._workerType)===`test`){let t=`modules/${e.module}/src/${e.id}-loader.ts`;return typeof window<`u`?`/${t}`:typeof process<`u`&&process.cwd?new URL(t,`file://${process.cwd()}/`).toString():t}throw Error(`${e.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`)}function ib(e,t){let n=t?.[e.id],r=e.options?.[e.id];return String(n?.backend||ab(n?.implementation)||r?.backend||``)}function ab(e){return e===`js`?`typescript`:e}async function ob(e,t){let n=await He(()=>import(e),[],import.meta.url);for(let e of Object.values(n))if(e&&typeof e==`object`&&e.id===t&&tb(e))return e;throw Error(`Could not find parser implementation for ${t} in ${e}`)}async function sb(e,t,n,r){t&&!Array.isArray(t)&&!uy(t)&&(r=void 0,n=t,t=void 0),n||={};let i=e.url||``,a=Sb(t,r),o=await hy(i,a,n);if(!o)return null;if(M_(o))throw Error(`${o.id} is a SourceLoader. Use load() to create a runtime source object instead of parseFile().`);let s=Qv(n,o,a,i);return r=xb({url:i,_parse:X,loaders:a},s,r||null),await cb(o,e,s,r)}async function cb(e,t,n,r){g_(e),n=Kg(e.options,n);let i=await $y(e,n,r.url);if(i.parseFile)return await i.parseFile(t,n,r);if(i.parse){let a=t.bigsize>0n?Number(t.bigsize):t.size;if(!a)throw Error(`${e.id} loader - cannot fall back to parse without a file size`);return await X(await t.read(0n,a),i,n,r)}throw Error(`${e.id} loader - no file parser found`)}function lb(e,t,n,r){!Array.isArray(t)&&!uy(t)&&(r=void 0,n=t,t=void 0),n||={};let i=Sb(t,r),a=_y(e,i,n);if(!a)return null;if(M_(a))throw Error(`${a.id} is a SourceLoader. Use load() to create a runtime source object instead of parseSync().`);let o=Qv(n,a,i),s=Nv(e),c=()=>{throw Error(`parseSync called parse (which is async`)};return r=xb({url:s,_parseSync:c,_parse:c,loaders:t},o,r||null),ub(eb(a)||a,e,o,r)}function ub(e,t,n,r){if(t=Gy(t,e,n),e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n);if(e.parseSync&&t instanceof ArrayBuffer)return e.parseSync(t,n,r);throw e.preload?Error(`${e.name} loader: 'parseSync' requires a parser-bearing loader. Import the loader implementation directly, or call preload(loader) before parseSync(). ${r.url||``}`):Error(`${e.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${r.url||``}`)}async function db(e,t,n,r){let i=Array.isArray(t)?t:void 0;!Array.isArray(t)&&!uy(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let a=Nv(e),o=await hy(e,t,n);if(!o)return[];let s=Qv(n,o,i,a);return r=xb({url:a,_parseInBatches:db,_parse:X,loaders:i},s,r||null),await fb(o,await $y(o,s,r.url),e,s,r)}async function fb(e,t,n,r,i){let a=await pb(t,n,r,i);if(!r?.core?.metadata)return a;let o={shape:`metadata`,batchType:`metadata`,metadata:{_loader:e,_context:i},data:[],bytesUsed:0};async function*s(e){yield o,yield*e}return s(a)}async function pb(e,t,n,r){let i=await gb(await Jy(t,n),n?.core?.transforms||[]);return e.parseInBatches?e.parseInBatches(i,n,r):mb(i,e,n,r)}async function*mb(e,t,n,r){yield hb(await X(await w_(e),t,{...n,core:{...n?.core,mimeType:t.mimeTypes[0]}},r),t)}function hb(e,t){let n=N_(e)?F_(e):{shape:`unknown`,batchType:`data`,data:e,length:Array.isArray(e)?e.length:1};return n.mimeType=t.mimeTypes[0],n}async function gb(e,t=[]){let n=e;for await(let e of t)n=e(n);return n}function _b(e,t,n,r){let i;!Array.isArray(t)&&!uy(t)?(r=void 0,n=t,i=void 0):i=t;let a=Xy(n||{});return Array.isArray(e)?e.map(e=>vb(e,i,n||{},a)):vb(e,i,n||{},a)}async function vb(e,t,n,r){return typeof e==`string`?await db(await r(e),t,n):await db(e,t,n)}async function yb(e,t,n,r){let i,a;if(!Array.isArray(t)&&!uy(t)?(i=[],a=t,r=void 0):(i=t,a=n),!Array.isArray(i)&&M_(i)){let t={fetchFile:Wv,parse:X,parseFile:sb,parseSync:lb,parseInBatches:db,load:yb,loadInBatches:_b};return i.createDataSource(e,a||{},t)}if(Array.isArray(i)&&i.length===1&&M_(i[0])){let t={fetchFile:Wv,parse:X,parseFile:sb,parseSync:lb,parseInBatches:db,load:yb,loadInBatches:_b};return i[0].createDataSource(e,a||{},t)}if(typeof e==`string`||M(e)){let t=await hy(e,i,{...a,core:{...a?.core,nothrow:!0}});if(t&&M_(t))return t.createDataSource(e,a||{},{fetchFile:Wv,parse:X,parseFile:sb,parseSync:lb,parseInBatches:db,load:yb,loadInBatches:_b})}let o=Xy(a),s=e;return typeof e==`string`&&(s=await o(e)),M(e)&&(s=await o(e)),typeof e==`string`&&($v(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await X(s,i,a,r)}var bb=Object.freeze({fetchFile:Wv,parse:X,parseFile:sb,parseSync:lb,parseInBatches:db,load:yb,loadInBatches:_b});function xb(e,t,n){if(n)return n;let r={...e,fetch:Xy(t,e),coreApi:e.coreApi||bb};if(r.url){let e=jv(r.url);r.baseUrl=e,r.queryString=Av(r.url),r.filename=A_(e),r.baseUrl=j_(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function Sb(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function X(e,t,n,r){t&&!Array.isArray(t)&&!uy(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=Nv(e),a=Sb(t,r),o=await hy(e,a,n);if(!o)return null;if(M_(o))throw Error(`${o.id} is a SourceLoader. Use load() to create a runtime source object instead of parse().`);let s=Qv(n,o,a,i);return r=xb({url:i,_parse:X,loaders:a},s,r||null),await Cb(o,e,s,r)}async function Cb(e,t,n,r){if(g_(e),n=Kg(e.options,n),ge(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}let i=await $y(e,n,r.url);return __(i,n)?(t=await qy(t,n),await v_(i,t,n,r,X)):(t=await Ky(t,e,n),await wb(i,t,n,r))}async function wb(e,t,n,r){if(e.parseText&&typeof t==`string`)return await e.parseText(t,n,r);if(e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n,r);if(e.parse)return await e.parse(t,n,r);throw e.parseSync?Error(`${e.name} loader: 'parse' not available on parser-bearing sync loader. Add an async 'parse' function to this loader, or call preload(loader) before parseSync(). ${r.url||``}`):Error(`${e.id} loader - no parser found and worker is disabled`)}function Tb(e,t){let n={version:1,name:t||Ub(e),description:`Imported OpenUSD · ${e.layers.length} composed ${e.layers.length===1?`layer`:`layers`}`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.105,exposure:1.55,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={scene:n,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},nextIdentifier:0};for(let t of e.rootPrims)Bb(t,r.materials);let i=new P;e.metadata.upAxis===`Z`&&i.rotateX(-Math.PI/2);for(let t of e.rootPrims)Db(t,i,r);return Mb(r),n}function Eb(e,t){Mb({scene:e,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:t,nextIdentifier:Object.keys(e.geometries).length})}function Db(e,t,n){if(Z(e,`visibility`)===`invisible`)return;let r=new P(t).multiplyRight(Vb(e));if(e.type===`Mesh`)Ob(e,r,n);else if(e.type===`Sphere`||e.type===`Cylinder`||e.type===`Cone`||e.type===`Cube`||e.type===`Capsule`)kb(e,r,n);else if(e.type===`DistantLight`||e.type===`SphereLight`||e.type===`DiskLight`)jb(e,r,n);else if(e.type===`PointInstancer`){Ab(e,r,n);return}if(e.type!==`Material`&&e.type!==`Shader`&&e.type!==`GeomSubset`)for(let t of e.children)Db(t,r,n)}function Ob(e,t,n){let r=Yb(Z(e,`points`)),i=Jb(Z(e,`faceVertexCounts`)),a=Jb(Z(e,`faceVertexIndices`));if(r.length===0||i.length===0||a.length===0)return;let o=[],s=0;for(let e of i)o.push(s),s+=e;let c=Yb((e.attributes.normals||e.attributes[`primvars:normals`])?.value),l=e.attributes[`primvars:st`]||e.attributes[`primvars:map1`]||e.attributes[`primvars:st0`]||e.attributes[`primvars:uv`],u=Yb(l?.value),d=l?Jb(Z(e,`${l.name}:indices`)):[],f=Wb(e),p=e.children.filter(e=>e.type===`GeomSubset`),m=new Set,h=p.map(e=>{let t=Jb(Z(e,`indices`));for(let e of t)m.add(e);return{name:e.name,faceIndices:t,materialPath:Wb(e)||f}}),g=i.map((e,t)=>t).filter(e=>!m.has(e));(g.length>0||h.length===0)&&h.push({name:e.name,faceIndices:g,materialPath:f});for(let s of h){if(s.faceIndices.length===0)continue;let l=Fb(s.materialPath,s.name,n),f=`${e.sourceUrl||e.path}:${e.name}:${s.name}:${l}`,p=n.surfaceIdentifiers.get(f);if(!p){let t=[],m=[],h=[];for(let e of s.faceIndices){let n=i[e],s=o[e];for(let e=1;e<n-1;e++)for(let n of[0,e,e+1]){let e=a[s+n],i=r[e];if(!i)continue;t.push(i[0],i[1],i[2]);let o=c.length===a.length?c[s+n]:c.length===r.length?c[e]:void 0;o&&m.push(o[0],o[1],o[2]);let l=u[d[s+n]??(u.length===a.length?s+n:e)];l&&l.length>=2&&h.push(l[0],l[1])}}if(t.length===0)continue;let g=$b(e.name,s.name,n),_={"@@type":`triangle`,"vertex.position":t};m.length===t.length&&(_[`vertex.normal`]=m),h.length===t.length/3*2&&(_[`vertex.attribute1`]=h),n.scene.geometries[g]=_,n.scene.surfaces[g]={geometry:g,material:l},p=g,n.surfaceIdentifiers.set(f,g)}Hb(n,p,t,`${e.name}-${s.name}`);for(let e of s.faceIndices){let s=i[e],c=o[e];for(let e=0;e<s;e++){let i=r[a[c+e]];i&&ex(n.bounds,t.transformAsPoint(i))}}}}function kb(e,t,n){let r=Zb(Z(e,`radius`),.5),i=Zb(Z(e,`height`),1),a=Zb(Z(e,`size`),1),o=Z(e,`axis`),s=Fb(Wb(e),e.name,n,e),c=`${e.sourceUrl||``}:${e.path}:${e.type}:${s}:${r}:${i}:${a}:${o}`,l=n.surfaceIdentifiers.get(c);if(!l){l=$b(e.name,e.type,n);let t;t=e.type===`Sphere`?{"@@type":`sphere`,radius:r,segments:24}:e.type===`Cylinder`?{"@@type":`cylinder`,radius:r,height:i,segments:32}:e.type===`Cone`?{"@@type":`cone`,radius:r,height:i,segments:32}:e.type===`Capsule`?{"@@type":`sphere`,radius:r,segments:24}:{"@@type":`triangle`,"vertex.position":tx(a)},n.scene.geometries[l]=t,n.scene.surfaces[l]={geometry:l,material:s},n.surfaceIdentifiers.set(c,l)}e.type===`Capsule`&&t.scale([1,Math.max(1,i/Math.max(r*2,.001)),1]),(e.type===`Cylinder`||e.type===`Cone`)&&o===`Z`&&t.rotateX(Math.PI/2),(e.type===`Cylinder`||e.type===`Cone`)&&o===`X`&&t.rotateZ(Math.PI/2),Hb(n,l,t,e.name);let u=e.type===`Cube`?a/2:Math.max(r,i/2);ex(n.bounds,t.transformAsPoint([-u,-u,-u])),ex(n.bounds,t.transformAsPoint([u,u,u]))}function Ab(e,t,n){let r=Yb(Z(e,`positions`)),i=Jb(Z(e,`protoIndices`)),a=Kb(Z(e,`prototypes`));for(let o=0;o<r.length;o++){let s=a[i[o]||0]?.split(`/`).pop(),c=e.children.find(e=>e.name===s);c&&Db(c,new P(t).translate(r[o]),n)}}function jb(e,t,n){let r=Xb(Z(e,`inputs:color`))||[1,1,1],i=Zb(Z(e,`inputs:intensity`),1),a=$b(e.name,`light`,n),o;if(e.type===`DistantLight`){let e=t.transformAsVector([0,0,-1]);o={"@@id":a,"@@type":`directional`,direction:[e[0],e[1],e[2]],color:r,irradiance:Math.min(4,Math.max(.6,i*.003))}}else o={"@@id":a,"@@type":`point`,position:[t[12],t[13],t[14]],color:r,intensity:Math.min(70,Math.max(8,i*.02))};n.scene.lights=[...n.scene.lights||[],o]}function Mb(e){if(!Number.isFinite(e.bounds.minimum[0]))throw Error(`The imported OpenUSD stage contains no supported renderable geometry.`);Nb(e);let t=e.bounds.minimum,n=e.bounds.maximum,r=[(t[0]+n[0])/2,t[1]+(n[1]-t[1])*.41,(t[2]+n[2])/2],i=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.5);e.scene.camera.target=r,e.scene.camera.position=[r[0]+i*.76,r[1]+i*.43,r[2]+i*.96],e.scene.camera.near=Math.max(.01,i*.001),e.scene.camera.far=Math.max(200,i*18),e.scene.renderer||={"@@type":`default`},e.scene.renderer.fogDensity=.003/i;let a=$b(`gallery`,`floor`,e);e.scene.geometries[a]={"@@type":`quad`,width:i*8,height:i*8},e.scene.materials[a]={"@@type":`physicallyBased`,baseColor:[.033,.046,.084],metallic:.48,roughness:.23,clearcoat:.78},e.scene.surfaces[a]={geometry:a,material:a},e.scene.instances=[...e.scene.instances||[],{"@@id":`${a}-placement`,surface:a,position:[r[0],t[1]-i*.035,r[2]]}];let o=Pb(e,{identifier:`cyan`,color:[.12,.65,1],center:[r[0],r[1]+i*.28,r[2]],radius:i*.76,height:i*.14,phase:.2,speed:.36,size:i*.015}),s=Pb(e,{identifier:`amber`,color:[1,.43,.14],center:[r[0],r[1]+i*.43,r[2]],radius:i*.68,height:i*.1,phase:Math.PI*.75,speed:-.28,size:i*.013}),c=(e.scene.lights||[]).some(e=>e[`@@type`]===`directional`);e.scene.lights=[...e.scene.lights||[],{"@@id":`gallery-key-light`,"@@type":`directional`,direction:[-.36,-1,-.42],color:[1,.91,.8],irradiance:c?1.45:2.35},{"@@id":`gallery-fill-light`,"@@type":`point`,position:[r[0]+i*.76,r[1]+i*.28,r[2]],color:[.12,.62,1],intensity:46,animation:{"@@type":`follow`,target:o}},{"@@id":`gallery-rim-light`,"@@type":`point`,position:[r[0]-i*.58,r[1]+i*.43,r[2]],color:[1,.41,.14],intensity:39,animation:{"@@type":`follow`,target:s}}];let l=Object.keys(e.scene.geometries).length-1;e.scene.description+=` · ${l} ${l===1?`mesh`:`meshes`}`}function Nb(e){let t=e.bounds.minimum,n=e.bounds.maximum,r=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.001),i=[(t[0]+n[0])/2,t[1],(t[2]+n[2])/2],a=new P().scale(11.5/r).translate([-i[0],-i[1],-i[2]]);e.scene.instances=(e.scene.instances||[]).map(e=>({...e,matrix:e.matrix?Array.from(new P(a).multiplyRight(e.matrix)):Array.from(a)})),e.scene.lights=(e.scene.lights||[]).map(e=>{if(!e.position)return e;let t=a.transformAsPoint(e.position);return{...e,position:[t[0],t[1],t[2]]}});let o=a.transformAsPoint(t),s=a.transformAsPoint(n);e.bounds={minimum:[o[0],o[1],o[2]],maximum:[s[0],s[1],s[2]]}}function Pb(e,t){let n=`studio-${t.identifier}-emitter`;e.scene.geometries[n]={"@@type":`sphere`,radius:t.size,segments:18},e.scene.materials[n]={"@@type":`physicallyBased`,baseColor:t.color,emissive:t.color,emissiveStrength:11,roughness:.09,clearcoat:.82},e.scene.surfaces[n]={geometry:n,material:n};let r=`${n}-placement`;return e.scene.instances=[...e.scene.instances||[],{"@@id":r,surface:n,position:[t.center[0]+Math.cos(t.phase)*t.radius,t.center[1],t.center[2]+Math.sin(t.phase)*t.radius],animation:{"@@type":`orbit`,center:t.center,radius:t.radius,height:t.height,phase:t.phase,speed:t.speed}}],r}function Fb(e,t,n,r){let i=e||t,a=n.materialIdentifiers.get(i);if(a)return a;a=$b(i.split(`/`).pop()||t,`material`,n);let o=e?Rb(e,n):void 0,s=o?zb(o):void 0,c=o&&s?Ib(o,s,`inputs:diffuseColor`,`srgb`,n):void 0,l=Yb(r?Z(r,`primvars:displayColor`):void 0),u=l[0]?[l[0][0],l[0][1],l[0][2]]:void 0,d=Xb(s?Z(s,`inputs:diffuseColor`):void 0)||Xb(s?Z(s,`inputs:base_color`):void 0)||u||(c?[1,1,1]:Qb(i)),f=i.toLowerCase(),p=f.includes(`window`)||f.includes(`glass`),m=f.includes(`frontlight`)||f.includes(`backlight`)||f.includes(`headlight`)||f.includes(`taillight`)||f.includes(`emissive`),h=Xb(s?Z(s,`inputs:emissiveColor`):void 0)||(m?d:void 0),g={"@@type":`physicallyBased`,baseColor:d,metallic:Zb(s?Z(s,`inputs:metallic`):void 0,p?.22:f.includes(`grey`)?.82:.48),roughness:Zb(s?Z(s,`inputs:roughness`):void 0,p?.07:f.includes(`grey`)?.16:.13),clearcoat:p?.96:.89,iridescence:p?.25:.045};if(c&&(g.baseColorTexture=c),o&&s){let e=Ib(o,s,`inputs:normal`,`linear`,n);e&&(g.normalTexture=e)}return p&&(g.opacity=Zb(s?Z(s,`inputs:opacity`):void 0,.52)),h&&(g.emissive=h,g.emissiveStrength=m?3.6:1.2,c&&m&&(g.emissiveTexture=c)),n.scene.materials[a]=g,n.materialIdentifiers.set(i,a),a}function Ib(e,t,n,r,i){let a=Z(t,`${n}.connect`)||Z(t,n);if(!Gb(a))return;let o=a.path.split(`.outputs:`)[0],s=Lb(e,o);if(!s||Z(s,`info:id`)!==`UsdUVTexture`)return;let c=Z(s,`inputs:file`);if(!c||typeof c!=`object`||Array.isArray(c)||!(`assetPath`in c))return;let l=s.sourceUrl||e.sourceUrl;if(!l)return;let u=new URL(String(c.assetPath),l).href,d=`${u}:${r}`,f=i.textureIdentifiers.get(d);return f||(f=$b(s.name,`texture`,i),i.scene.textures||={},i.scene.textures[f]={source:u,colorSpace:r},i.textureIdentifiers.set(d,f)),f}function Lb(e,t){if(e.path===t||t.endsWith(`/${e.name}`))return e;for(let n of e.children){let e=Lb(n,t);if(e)return e}}function Rb(e,t){let n=t.materials.get(e);if(n)return n;let r=e.split(`/`).pop();if(r)return Array.from(t.materials.values()).find(e=>e.name===r)}function zb(e){for(let t of e.children){let e=Z(t,`info:id`);if(t.type===`Shader`&&(e===`UsdPreviewSurface`||e===`ND_standard_surface_surfaceshader`||e===`ND_UsdPreviewSurface_surfaceshader`))return t;let n=zb(t);if(n)return n}}function Bb(e,t){e.type===`Material`&&t.set(e.path,e);for(let n of e.children)Bb(n,t)}function Vb(e){let t=new P,n=qb(Z(e,`xformOpOrder`)),r=n.length?n:Object.keys(e.attributes).filter(e=>e.startsWith(`xformOp:`));for(let n of r){let r=Z(e,n);if(n.startsWith(`xformOp:translate`)){let e=Xb(r);e&&t.translate(e)}else if(n.startsWith(`xformOp:scale`)){let e=Xb(r);e&&t.scale(e)}else if(n.startsWith(`xformOp:transform`)){let e=Yb(r);e.length===4&&e.every(e=>e.length===4)&&t.multiplyRight(new P(e.flat()))}else if(n.startsWith(`xformOp:rotate`)){let e=n.slice(14).split(`:`)[0],i=Array.isArray(r)?r:[r];for(let n=0;n<e.length;n++){let r=Zb(i[n],0)*(Math.PI/180);e[n]===`X`?t.rotateX(r):e[n]===`Y`?t.rotateY(r):e[n]===`Z`&&t.rotateZ(r)}}else if(n.startsWith(`xformOp:orient`)&&Array.isArray(r)){let e=r.map(e=>Zb(e,0));e.length===4&&t.multiplyRight(new P().fromQuaternion([e[1],e[2],e[3],e[0]]))}}return t}function Hb(e,t,n,r){let i={"@@id":$b(r,`instance`,e),surface:t,matrix:Array.from(n)};e.scene.instances=[...e.scene.instances||[],i]}function Ub(e){let t=e.metadata.defaultPrim;return typeof t==`string`?t.replace(/([a-z])([A-Z])/g,`$1 $2`).toUpperCase():`IMPORTED OPENUSD STAGE`}function Z(e,t){return e.attributes[t]?.value}function Wb(e){let t=Z(e,`material:binding`);return Gb(t)?t.path:void 0}function Gb(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`path`in e)}function Kb(e){return Gb(e)?[e.path]:Array.isArray(e)?e.filter(Gb).map(e=>e.path):[]}function qb(e){return Array.isArray(e)?e.filter(e=>typeof e==`string`):[]}function Jb(e){return Array.isArray(e)?e.filter(e=>typeof e==`number`):[]}function Yb(e){return Array.isArray(e)?e.filter(e=>Array.isArray(e)).map(e=>e.filter(e=>typeof e==`number`)):[]}function Xb(e){if(!(!Array.isArray(e)||e.length<3)&&!(typeof e[0]!=`number`||typeof e[1]!=`number`||typeof e[2]!=`number`))return[e[0],e[1],e[2]]}function Zb(e,t){return typeof e==`number`&&Number.isFinite(e)?e:t}function Qb(e){let t=e.toLowerCase();return t.includes(`frontlight`)?[1,.87,.58]:t.includes(`backlight`)?[1,.12,.055]:t.includes(`red`)?[.92,.065,.085]:t.includes(`blue`)?[.075,.36,.96]:t.includes(`green`)?[.09,.66,.31]:t.includes(`gold`)?[1,.69,.2]:t.includes(`window`)||t.includes(`glass`)?[.31,.67,.96]:t.includes(`lightgrey`)||t.includes(`greylight`)?[.78,.84,.93]:t.includes(`mediumgrey`)||t.includes(`greymedium`)?[.22,.27,.35]:[.52,.65,.83]}function $b(e,t,n){return`${e.replace(/[^a-zA-Z0-9]+/g,`-`).replace(/^-|-$/g,``).toLowerCase()||`usd`}-${t}-${++n.nextIdentifier}`}function ex(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function tx(e){let t=e/2,n=[[-t,-t,-t],[t,-t,-t],[t,t,-t],[-t,t,-t],[-t,-t,t],[t,-t,t],[t,t,t],[-t,t,t]];return[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,2,3,7,2,7,6,1,2,6,1,6,5,3,0,4,3,4,7].flatMap(e=>n[e])}async function nx(e,t){let n={version:1,name:t,description:`Imported glTF · full PBR textures, mapped emission, and retained meshes`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.16,exposure:1.62,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={gltf:e,scene:n,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},imageSources:new Map,textureIdentifiers:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,nodeIdentifiers:{},nextIdentifier:0},i=e.scene?.nodes||e.scenes[0]?.nodes||e.nodes;for(let e of i)ax(e,new P,r);r.scene.lights=rx(e,r);let a=(e.materials||[]).map(e=>r.materialIdentifiers.get(e)),o={};for(let[e,t]of a.entries()){if(!t)continue;let r=n.materials[t];for(let{slot:t}of qh()){let n=r[`${t}Texture`];n&&(o[`${e}:${t}`]=n)}}let s=K_(Tg(e),{nodeIdentifiers:r.nodeIdentifiers,materialIdentifiers:a,materialAlphaModes:(e.materials||[]).map(e=>e.alphaMode===`BLEND`?`BLEND`:e.alphaMode===`MASK`?`MASK`:`OPAQUE`),samplerIdentifiers:o});s.length>0&&(n.clips=s,n.playback={clip:s[0].name,playing:!0,loop:`repeat`},n.description=`Imported glTF · ${s.length} animation clip${s.length===1?``:`s`} · retained PBR scene`);let c=ix(r.bounds);if(Eb(n,r.bounds),n.nodes&&Object.keys(n.nodes).length>0){let e=`anari-presentation-root`;for(;e in n.nodes;)e+=`-root`;for(let t of Object.values(n.nodes))t.parent||=e;n.nodes[e]={matrix:Array.from(c)}}return n}function rx(e,t){return dg(e,{nodeIdentifiers:new Set(Object.keys(t.nodeIdentifiers)),useByteColors:!1}).flatMap(e=>{if(e.type===`ambient`)return[];let n={"@@id":gx(`source-${e.type}`,`light`,t),"@@type":e.type,color:mx(e.color,[1,1,1]),intensity:e.intensity??1};return`position`in e&&(n.position=mx(e.position,[0,0,0])),`direction`in e&&(n.direction=mx(e.direction,[0,0,-1])),e.type===`spot`&&(n.openingAngle=e.outerConeAngle??Math.PI/4,n.falloffAngle=e.innerConeAngle??0),[n]})}function ix(e){let t=Math.max(e.maximum[0]-e.minimum[0],e.maximum[1]-e.minimum[1],e.maximum[2]-e.minimum[2],.001);return new P().scale(11.5/t).translate([-(e.minimum[0]+e.maximum[0])/2,-e.minimum[1],-(e.minimum[2]+e.maximum[2])/2])}function ax(e,t,n,r){let i=e.id,a=e.mesh?.primitives.find(e=>e.targets?.length)?.targets?.length||0,o=e.weights||e.mesh?.weights||(a?Array(a).fill(0):void 0);n.nodeIdentifiers[e.id]=i,n.scene.nodes||={};let s={...r?{parent:r}:{},...e.translation?{translation:[e.translation[0],e.translation[1],e.translation[2]]}:{},...e.rotation?{rotation:[e.rotation[0],e.rotation[1],e.rotation[2],e.rotation[3]]}:{},...e.scale?{scale:[e.scale[0],e.scale[1],e.scale[2]]}:{},...e.matrix?{matrix:Array.from(e.matrix)}:{},...o?{weights:[...o]}:{}};n.scene.nodes[i]=s;let c=new P(t);if(e.matrix?c.multiplyRight(e.matrix):(e.translation&&c.translate(e.translation),e.rotation&&c.multiplyRight(new P().fromQuaternion(e.rotation)),e.scale&&c.scale(e.scale)),e.mesh)for(let[t,r]of e.mesh.primitives.entries()){if(r.mode!==void 0&&r.mode!==4)continue;let i=ox(e.mesh.id,t,r,n,e);if(!i)continue;let a=r.attributes.POSITION;for(let e=0;e<a.value.length;e+=3){let t=c.transformAsPoint([a.value[e],a.value[e+1],a.value[e+2]]);hx(n.bounds,t)}let o=gx(e.name||e.id,`instance`,n);n.scene.instances=[...n.scene.instances||[],{"@@id":o,surface:i,matrix:Array.from(c)}],s.instances=[...s.instances||[],o],r.targets?.length&&(s.geometries=[...s.geometries||[],i])}for(let t of e.children||[])ax(t,c,n,i)}function ox(e,t,n,r,i){let a=n.attributes.POSITION;if(!a)return;let o=`${e}:${t}${n.targets?.length||i.skin!==void 0?`:${i.id}`:``}`,s=r.surfaceIdentifiers.get(o);if(s)return s;s=gx(e,`primitive-${t}`,r);let c={"@@type":`triangle`,"vertex.position":Array.from(a.value)},l=n.attributes.NORMAL;l&&(c[`vertex.normal`]=Array.from(l.value));let u=n.attributes.TANGENT;u&&(c[`vertex.tangent`]=Array.from(u.value));let d=n.attributes.JOINTS_0;d&&(c[`vertex.joint`]=Array.from(d.value));let f=n.attributes.WEIGHTS_0;if(f){let e=f.normalized?f.value instanceof Uint8Array?255:f.value instanceof Uint16Array?65535:1:1;c[`vertex.weight`]=Array.from(f.value,t=>t/e)}n.indices&&(c[`primitive.index`]=Array.from(n.indices.value));let p=cx(n,a.count);p&&(c[`vertex.attribute0`]=p);let m=n.attributes.TEXCOORD_0;m&&(c[`vertex.attribute1`]=Array.from(m.value));let h=n.attributes.TEXCOORD_1;h&&(c[`vertex.attribute2`]=Array.from(h.value)),n.targets?.length&&(c.morphTargets=n.targets.map(e=>{let t={};for(let n of[`POSITION`,`NORMAL`,`TANGENT`]){let i=e[n],a=typeof i==`number`?r.gltf.accessors[i]:i;a&&(t[n]=Array.from(a.value))}return t}),c.morphWeights=[...i.weights||i.mesh?.weights||Array(n.targets.length).fill(0)]);let g=sx(n.material,r),_=i.skin===void 0?void 0:r.gltf.skins?.[Sg(r.gltf,i.skin)],v=_?{node:i.id,joints:_.joints.map(e=>r.gltf.nodes[e].id),..._.inverseBindMatrices?.value?{inverseBindMatrices:Array.from(_.inverseBindMatrices.value)}:{}}:void 0;return r.scene.geometries[s]=c,r.scene.surfaces[s]={geometry:s,material:g,...v?{skin:v}:{}},r.surfaceIdentifiers.set(o,s),s}function sx(e,t){if(!e){let e=`default-material`;return t.scene.materials[e]||={"@@type":`physicallyBased`,baseColor:[1,1,1],metallic:1,roughness:1,clearcoat:0},e}let n=t.materialIdentifiers.get(e);if(n)return n;let r=gx(e.name||e.id,`material`,t),i=e.pbrMetallicRoughness,a=i?.baseColorFactor||[1,1,1,1],o=e.alphaMode===`BLEND`?`blend`:e.alphaMode===`MASK`?`mask`:`opaque`,s=e.extensions?.KHR_materials_clearcoat,c=e.extensions?.EXT_materials_bump,l=e.extensions?.KHR_materials_diffuse_transmission,u=e.extensions?.KHR_materials_dispersion,d=e.extensions?.KHR_materials_iridescence,f=e.extensions?.KHR_materials_transmission,p=e.extensions?.KHR_materials_sheen,m=e.extensions?.KHR_materials_specular,h=e.extensions?.KHR_materials_volume,g=e.extensions?.KHR_materials_volume_scatter,_=e.extensions?.KHR_materials_anisotropy,v=e.extensions?.KHR_materials_ior,y={"@@type":`physicallyBased`,baseColor:[a[0],a[1],a[2]],alphaMode:o,doubleSided:e.doubleSided??!1,metallic:Q(i?.metallicFactor??1,0,1),roughness:Q(i?.roughnessFactor??1,0,1),unlit:!!(`unlit`in e&&e.unlit||e.extensions?.KHR_materials_unlit),specularColor:mx(m?.specularColorFactor,[1,1,1]),specularIntensity:Q(m?.specularFactor??1,0,1),clearcoat:Q(s?.clearcoatFactor??0,0,1),clearcoatRoughness:Q(s?.clearcoatRoughnessFactor??0,0,1),iridescence:Q(d?.iridescenceFactor??0,0,1),transmission:Q(f?.transmissionFactor??0,0,1),diffuseTransmission:Q(l?.diffuseTransmissionFactor??0,0,1),diffuseTransmissionColor:mx(l?.diffuseTransmissionColorFactor,[1,1,1]),dispersion:Math.max(u?.dispersion??0,0),thickness:Math.max(h?.thicknessFactor??0,0),attenuationColor:mx(h?.attenuationColor,[1,1,1]),multiscatterColor:h?mx(g?.multiscatterColorFactor||g?.multiscatterColor,[0,0,0]):[0,0,0],scatterAnisotropy:h?Q(g?.scatterAnisotropy??0,-.999,.999):0,indexOfRefraction:Q(v?.ior??1.5,1,2.5),sheenColor:mx(p?.sheenColorFactor,[0,0,0]),sheenRoughness:Q(p?.sheenRoughnessFactor??0,0,1),iridescenceIndexOfRefraction:Math.max(d?.iridescenceIor??1.3,1),iridescenceThicknessMinimum:Math.max(d?.iridescenceThicknessMinimum??100,0),iridescenceThicknessMaximum:Math.max(d?.iridescenceThicknessMaximum??400,0),anisotropyStrength:Q(_?.anisotropyStrength??0,0,1),anisotropyRotation:_?.anisotropyRotation??0,bumpFactor:Math.max(c?.bumpFactor??1,0),normalScale:Q(e.normalTexture?.scale??1,0,4),occlusionStrength:Q(e.occlusionTexture?.strength??1,0,1)};h?.attenuationDistance!==void 0&&h.attenuationDistance>0&&(y.attenuationDistance=h.attenuationDistance);for(let{slot:n,pathSegments:r,colorSpace:i}of qh())ux(y,`${n}Texture`,dx(e,r),i,t);let b=e.emissiveFactor||[0,0,0];return(e.emissiveTexture||b.some(e=>e>0))&&(y.emissive=mx(b,[1,1,1]),y.emissiveStrength=e.extensions?.KHR_materials_emissive_strength?.emissiveStrength??1),o===`mask`&&(y.alphaCutoff=Q(e.alphaCutoff??.5,0,1)),(o===`blend`||o===`mask`)&&(y.opacity=Q(a[3],0,1)),t.scene.materials[r]=y,t.materialIdentifiers.set(e,r),r}function cx(e,t){let n=e.attributes.COLOR_0;if(!n)return;let r=n.components===4?4:3,i=Array(t*r);for(let e=0;e<t;e++){let t=lx(n,e),a=e*r;if(i[a]=t[0],i[a+1]=t[1],i[a+2]=t[2],r===4){let t=n.value[e*n.components+3],r=n.normalized?n.componentType===5121?255:n.componentType===5123?65535:1:1;i[a+3]=t/r}}return i}function lx(e,t){if(!e)return[1,1,1];let n=t*e.components,r=e.normalized?e.componentType===5121?255:e.componentType===5123?65535:1:1;return[e.value[n]/r,e.value[n+1]/r,e.value[n+2]/r]}function ux(e,t,n,r,i){if(!n)return;let a=n.texture||(typeof n.index==`number`?i.gltf.textures[n.index]:void 0),o=a?.source;if(!o)return;let s=px(n),c=Yh(n)===1?1:0,l=Qh(a.sampler),u=Object.entries(l).map(([e,t])=>`${e}:${t}`).join(`,`),d=`${o.id}:${r}:${c}:${s?.join(`,`)||`identity`}:${u}`,f=i.textureIdentifiers.get(d);if(!f){let e=fx(o,i);if(!e)return;f=gx(o.name||o.id,`texture`,i);let t={source:e,colorSpace:r};c===1&&(t.textureCoordinateSet=c),s&&(t.transform=s),Object.keys(l).length>0&&(t.sampler=l),i.scene.textures||={},i.scene.textures[f]=t,i.textureIdentifiers.set(d,f)}e[t]=f}function dx(e,t){let n=e;for(let e of t){if(!n||typeof n!=`object`)return;n=Reflect.get(n,e)}return n&&typeof n==`object`?n:void 0}function fx(e,t){let n=t.imageSources.get(e);if(n)return n;let r=e.bufferView?.data||e.image?.data,i=r?URL.createObjectURL(new Blob([new Uint8Array(r)],{type:e.mimeType||`image/png`})):e.uri;return i&&t.imageSources.set(e,i),i}function px(e){if(!e.extensions?.KHR_texture_transform)return;let t=Zh(Jh(e));return[t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8]]}function mx(e,t){return e&&e.length>=3?[e[0],e[1],e[2]]:t}function hx(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function gx(e,t,n){return`${e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`gltf`}-${t}-${n.nextIdentifier++}`}function Q(e,t,n){return Math.max(t,Math.min(n,e))}var _x=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/,vx=new Set([`uniform`,`varying`,`custom`,`prepend`,`append`,`add`,`delete`,`reorder`]);function yx(e,t){if(!e.trimStart().startsWith(`#usda`))throw Error(`OpenUSD ASCII layers must begin with the #usda header.`);return new bx(e,t).parse()}var bx=class{tokenizer;url;constructor(e,t){this.tokenizer=new xx(e),this.url=t}parse(){let e=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{},t=[];for(;!this.tokenizer.isAtEnd();)this.isPrimDeclaration()?t.push(this.parsePrim(``)):this.tokenizer.read();return{format:`usda`,url:this.url,metadata:e,rootPrims:t,layers:this.url?[this.url]:[]}}parsePrim(e){let t=this.tokenizer.read().value,n=this.tokenizer.read(),r=this.tokenizer.peek().kind===`string`,i=r?n.value:``,a=r?this.tokenizer.read().value:n.value,o=`${e}/${a}`,s=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{};this.tokenizer.expect(`{`);let c=this.parsePrimContents(o);return{name:a,path:o,sourceUrl:this.url,type:i,specifier:t,attributes:c.attributes,metadata:{...s,...c.metadata},variants:c.variants,children:c.children}}parsePrimContents(e){let t={},n={},r=[],i={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);)if(this.isPrimDeclaration())r.push(this.parsePrim(e));else if(this.tokenizer.peek().value===`variantSet`)this.parseVariantSet(e,i);else{let e=this.parseAttribute();e&&(t[e.name]=e)}return{attributes:t,metadata:n,children:r,variants:i}}parseVariantSet(e,t){this.tokenizer.expect(`variantSet`);let n=this.tokenizer.read().value;this.tokenizer.expect(`=`),this.tokenizer.expect(`{`);let r={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);){let t=this.tokenizer.read().value;this.tokenizer.expect(`{`);let n=this.parsePrimContents(e);r[t]={attributes:n.attributes,metadata:n.metadata,children:n.children}}t[n]=r}parseAttribute(){let e=this.tokenizer.read();if(e.kind===`end`)return null;let t=[e];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===e.line;){let e=this.tokenizer.peek();if(e.value===`=`){this.tokenizer.read();break}if(e.value===`{`||e.value===`}`)return null;t.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`)return null;let n=t.filter(e=>!vx.has(e.value));return n.length===0?null:{name:n[n.length-1].value,type:n.slice(0,-1).map(e=>e.value).join(``),value:this.parseValue(),metadata:this.tokenizer.match(`(`)?this.parseMetadata(`)`):{}}}parseMetadata(e){let t={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);){if(this.tokenizer.match(`,`),this.tokenizer.peek().value===e){this.tokenizer.read();break}let n=this.tokenizer.read(),r=[n];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===n.line;){if(this.tokenizer.peek().value===`=`||this.tokenizer.peek().value===`:`){this.tokenizer.read();break}if(this.tokenizer.peek().value===e)break;r.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`&&this.tokenizer.previousValue!==`:`)continue;let i=r[r.length-1].value;t[i]=this.parseValue(),this.tokenizer.match(`,`)}return t}parseValue(){let e=this.tokenizer.read();if(e.value===`[`)return this.parseList(`]`);if(e.value===`(`)return this.parseList(`)`);if(e.value===`{`)return this.parseMetadata(`}`);if(e.kind===`asset`){let t={assetPath:e.value};return this.tokenizer.peek().kind===`path`&&this.tokenizer.peek().line===e.line&&(t.primPath=this.tokenizer.read().value),t}return e.kind===`path`?{path:e.value}:e.kind===`number`?Number(e.value):e.value===`true`?!0:e.value===`false`?!1:e.value===`None`||e.value===`null`?null:e.value}parseList(e){let t=[];for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);)this.tokenizer.match(`,`)||(t.push(this.parseValue()),this.tokenizer.match(`,`));return t}isPrimDeclaration(){let e=this.tokenizer.peek().value;return e===`def`||e===`over`||e===`class`}},xx=class{source;offset=0;line=1;bufferedToken=null;previousValue=``;constructor(e){this.source=e}peek(){return this.bufferedToken||=this.readToken(),this.bufferedToken}read(){let e=this.peek();return this.bufferedToken=null,this.previousValue=e.value,e}match(e){return this.peek().value===e?(this.read(),!0):!1}expect(e){let t=this.read();if(t.value!==e)throw Error(`Expected "${e}" at USDA line ${t.line}, received "${t.value}".`)}isAtEnd(){return this.peek().kind===`end`}readToken(){this.skipIgnoredText();let e=this.line,t=this.source[this.offset];if(t===void 0)return{value:``,line:e,kind:`end`};if(`{}[](),=`.includes(t))return this.offset++,{value:t,line:e,kind:`punctuation`};if(t===`"`||t===`'`)return{value:this.readQuotedString(t),line:e,kind:`string`};if(t===`@`)return{value:this.readDelimitedValue(`@`),line:e,kind:`asset`};if(t===`<`)return{value:this.readDelimitedValue(`>`),line:e,kind:`path`};let n=this.source.slice(this.offset).match(_x);if(n)return this.offset+=n[0].length,{value:n[0],line:e,kind:`number`};let r=this.offset;for(;this.offset<this.source.length;){let e=this.source[this.offset];if(/\s/.test(e)||`{}[](),=@<>`.includes(e))break;this.offset++}return this.offset===r&&this.offset++,{value:this.source.slice(r,this.offset),line:e,kind:`word`}}skipIgnoredText(){for(;this.offset<this.source.length;){let e=this.source[this.offset];if(e===`
`)this.line++,this.offset++;else if(/\s/.test(e))this.offset++;else if(e===`#`)for(;this.offset<this.source.length&&this.source[this.offset]!==`
`;)this.offset++;else if(e===`/`&&this.source[this.offset+1]===`*`){for(this.offset+=2;this.offset<this.source.length&&!this.source.startsWith(`*/`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=2}else if(this.source.startsWith(`"""`,this.offset)){for(this.offset+=3;this.offset<this.source.length&&!this.source.startsWith(`"""`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=3}else break}}readQuotedString(e){this.offset++;let t=``;for(;this.offset<this.source.length;){let n=this.source[this.offset++];if(n===e)break;if(n===`\\`&&this.offset<this.source.length){let e=this.source[this.offset++];t+=e===`n`?`
`:e}else t+=n}return t}readDelimitedValue(e){this.offset++;let t=this.offset;for(;this.offset<this.source.length&&this.source[this.offset]!==e;)this.offset++;let n=this.source.slice(t,this.offset);return this.offset++,n}},Sx=101010256,Cx=33639248,wx=67324752;function Tx(e){let t=new DataView(e),n=Ex(t),r=t.getUint16(n+10,!0),i=t.getUint32(n+16,!0),a=new Map,o=new TextDecoder;for(let n=0;n<r;n++){if(t.getUint32(i,!0)!==Cx)throw Error(`USDZ archive contains an invalid ZIP central-directory entry.`);let n=t.getUint16(i+10,!0),r=t.getUint32(i+20,!0),s=t.getUint16(i+28,!0),c=t.getUint16(i+30,!0),l=t.getUint16(i+32,!0),u=t.getUint32(i+42,!0),d=o.decode(new Uint8Array(e,i+46,s));if(n!==0)throw Error(`USDZ entry "${d}" is compressed; USDZ requires stored ZIP entries.`);if(t.getUint32(u,!0)!==wx)throw Error(`USDZ entry "${d}" has an invalid local ZIP header.`);let f=t.getUint16(u+26,!0),p=t.getUint16(u+28,!0),m=u+30+f+p;a.set(d,e.slice(m,m+r)),i+=46+s+c+l}return a}function Ex(e){let t=Math.max(0,e.byteLength-65557);for(let n=e.byteLength-22;n>=t;n--)if(e.getUint32(n,!0)===Sx)return n;throw Error(`USDZ archive does not contain a ZIP end-of-central-directory record.`)}var Dx=new TextDecoder,Ox=`PXR-USDC`,kx=67324752,Ax={dataType:null,batchType:null,name:`Universal Scene Description`,id:`usd`,module:`usd`,version:`0.0.0-experimental`,extensions:[`usd`,`usda`,`usdz`],mimeTypes:[`model/vnd.usd`,`model/vnd.usda`,`model/vnd.usdz+zip`],text:!0,binary:!0,tests:[`#usda`,`PK`],parse:jx,options:{usd:{compose:!0,loadReferences:!0,maxReferenceDepth:12,variantSelections:{}}}};async function jx(e,t={},n){let r=n?.url||t.core?.baseUrl,i={fetch:async e=>{let t=await(n?.fetch||fetch)(e);if(!(t instanceof Response))throw Error(`OpenUSD reference "${e}" did not return an HTTP response.`);if(!t.ok)throw Error(`Unable to load OpenUSD reference "${e}": ${t.status}.`);return t},cache:new Map,archiveFiles:new Map,layers:new Set,options:{...t,usd:{...Ax.options.usd,...t.usd}}},a;if(Ux(e)){let t=Tx(e),n=Array.from(t.keys()).find(e=>/\.usda?$/i.test(e));if(!n)throw Error(`USDZ archives with binary USDC root layers are not implemented yet.`);let r=`https://usd.archive/`;for(let[e,n]of t)i.archiveFiles.set(new URL(e,r).href,n);let o=new URL(n,r).href;a=Mx(t.get(n),o),a.format=`usdz`}else a=Mx(e,r);return a.url&&i.layers.add(a.url),i.options.usd?.compose!==!1&&(a.rootPrims=await Nx(a.rootPrims,a.url,{},i,0)),a.layers=Array.from(i.layers),r&&(a.url=r),a}function Mx(e,t){if(Dx.decode(e.slice(0,8))===Ox)throw Error(`Binary USDC crate layers are not implemented yet; use ASCII USDA layers.`);return yx(Dx.decode(e),t)}async function Nx(e,t,n,r,i){if(i>(r.options.usd?.maxReferenceDepth??12))throw Error(`OpenUSD reference composition exceeded the configured depth limit.`);let a=[];for(let o of e){if(o.specifier===`class`)continue;let e={...Rx(o.metadata.variants),...n,...r.options.usd?.variantSelections},s=o.sourceUrl||t,c=Bx(o);for(let[t,n]of Object.entries(c.variants)){let r=n[e[t]||Object.keys(n)[0]];r&&(c=Hx(c,{...c,attributes:r.attributes,metadata:r.metadata,children:r.children,variants:{}}))}let l=Lx(c);if(r.options.usd?.loadReferences!==!1&&l.length>0)for(let t of l){if(!s)throw Error(`OpenUSD references require a source URL or options.core.baseUrl.`);let n=new URL(t.assetPath,s).href,a=await Nx(Fx(await Px(n,r),t.primPath),n,e,r,i+1);for(let e of a)c=Hx(Vx(e,c.path),c)}c.children=await Nx(c.children,s,e,r,i+1),a.push(c)}return a}async function Px(e,t){let n=t.cache.get(e);return n||(n=(async()=>{let n=t.archiveFiles.get(e);if(!n){let r;try{r=await t.fetch(e)}catch(t){throw Error(`Unable to fetch USD layer "${e}": ${String(t)}`)}if(!r.ok)throw Error(`Unable to fetch USD layer "${e}": ${r.status}.`);n=r.arrayBuffer()}let r=Mx(await n,e);return t.layers.add(e),r})(),t.cache.set(e,n)),n}function Fx(e,t){let n=t||e.metadata.defaultPrim;if(typeof n!=`string`)return e.rootPrims;let r=n.startsWith(`/`)?n:`/${n}`,i=Ix(e.rootPrims,r);return i?[i]:[]}function Ix(e,t){for(let n of e){if(n.path===t)return n;let e=Ix(n.children,t);if(e)return e}}function Lx(e){let t=[];for(let n of[e.metadata.references,e.metadata.payload,e.metadata.payloads])Array.isArray(n)?t.push(...n.filter(zx)):zx(n)&&t.push(n);return t}function Rx(e){return!e||typeof e!=`object`||Array.isArray(e)||zx(e)?{}:Object.fromEntries(Object.entries(e).filter(e=>typeof e[1]==`string`))}function zx(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`assetPath`in e)}function Bx(e){return{...e,attributes:{...e.attributes},metadata:{...e.metadata},variants:{...e.variants},children:e.children.map(Bx)}}function Vx(e,t){let n=Bx(e);return n.path=t,n.children=n.children.map(e=>Vx(e,`${t}/${e.name}`)),n}function Hx(e,t){let n=e.children.map(Bx);for(let e of t.children){let t=n.findIndex(t=>t.name===e.name);t>=0?n[t]=Hx(n[t],e):n.push(Bx(e))}return{...e,...t,sourceUrl:Lx(t).length>0?t.sourceUrl:e.sourceUrl||t.sourceUrl,type:t.type||e.type,attributes:{...e.attributes,...t.attributes},metadata:{...e.metadata,...t.metadata},variants:{...e.variants,...t.variants},children:n}}function Ux(e){return e.byteLength>=4&&new DataView(e).getUint32(0,!0)===kx}var Wx={usd:{variantSelections:{wheels:`wheelNormal`}}};function $(e){return new URL(e,document.baseURI).href}var Gx=[{identifier:`gltf-expressive-robot`,label:`glTF · Expressive Robot · 14 Animated Clips`,url:$(`./gltf/RobotExpressive.glb`),format:`gltf`},{identifier:`gltf-animated-morphs`,label:`glTF · Animated Morph Targets`,url:$(`./gltf/AnimatedMorphCube.glb`),format:`gltf`},{identifier:`gltf-animated-skin`,label:`glTF · Animated Skeleton`,url:$(`./gltf/SimpleSkin.gltf`),format:`gltf`},{identifier:`gltf-animated-colors`,label:`glTF · Animated Colors`,url:$(`./gltf/AnimatedColorsCube.glb`),format:`gltf`},{identifier:`gltf-antique-camera`,label:`glTF · Antique Camera`,url:$(`./gltf/AntiqueCamera.glb`),format:`gltf`},{identifier:`gltf-lantern`,label:`glTF · Brass Lantern`,url:$(`./gltf/Lantern.glb`),format:`gltf`},{identifier:`gltf-toy-car`,label:`glTF · Vintage Toy Car`,url:$(`./gltf/ToyCar.glb`),format:`gltf`},{identifier:`porcelain-atelier`,label:`OpenUSD · Porcelain Atelier`,url:$(`./usd/porcelain-atelier.usda`),format:`usd`},{identifier:`knights-gambit`,label:`OpenUSD · Knight’s Gambit`,url:$(`./usd/knights-gambit.usda`),format:`usd`},{identifier:`vehicle-gallery`,label:`OpenUSD · Vehicle Gallery`,url:$(`./usd/vehicle-gallery.usda`),format:`usd`,options:Wx},{identifier:`material-laboratory`,label:`OpenUSD · Prismatic Materials`,url:$(`./usd/material-laboratory.usda`),format:`usd`},{identifier:`formula-racer`,label:`OpenUSD · Formula Racer`,url:$(`./usd/mini-vehicles/assets/vehicles/formula/asset/formulaFullAsset.usda`),format:`usd`,options:Wx},{identifier:`crimson-sedan`,label:`OpenUSD · Crimson Sedan`,url:$(`./usd/mini-vehicles/assets/vehicles/sedan/asset/sedanFullAsset.usda`),format:`usd`,options:Wx},{identifier:`precision-wheel`,label:`OpenUSD · Precision Wheel`,url:$(`./usd/mini-vehicles/assets/wheels/wheelNormal/asset/wheelNormalAsset.usda`),format:`usd`}];async function Kx(e){let t=Gx.find(t=>t.identifier===e);if(!t)throw Error(`Unknown 3D sample "${e}".`);let n=t.label.replace(/^(OpenUSD|glTF) · /,``).toUpperCase();if(t.format===`gltf`){let e=await nx(W_(await yb(t.url,Ie,{gltf:{loadImages:!1}})),n);return await av(e),e}let r=Tb(await yb(t.url,Ax,t.options),n);return await av(r),r}async function qx(e){let t=e.name.replace(/\.(usd|usda|usdz|gltf|glb)$/i,``).replace(/[-_]/g,` `).toUpperCase();if(/\.(gltf|glb)$/i.test(e.name)){let n=await nx(W_(await X(await e.arrayBuffer(),Ie,{gltf:{loadImages:!1}})),t);return await av(n),n}let n=Tb(await Ax.parse(await e.arrayBuffer()),t);return await av(n),n}export{$e as _,fv as a,$h as c,vl as d,cl as f,P as g,Ln as h,ov as i,qh as l,Wn as m,qx as n,vv as o,Jn as p,Kx as r,dv as s,Gx as t,Gh as u};