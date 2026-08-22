const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./webgpu-device-CaoTiL6w.js","./buffer-layout-utils-BIP28hBl.js","./fence-WqHZ2vRB.js","./wgsl-interface-scan-CLW9X4pL.js","./webgl-device-BLqwiT6P.js","./debug-hooks-BaBoIcbs.js"])))=>i.map(i=>d[i]);
import{t as e}from"./chunk-BRNzzbbm.js";import{A as t,C as n,D as r,E as i,F as a,I as o,L as s,M as c,N as l,O as u,P as d,T as f,_ as p,c as m,d as h,f as g,g as _,h as v,i as y,m as b,o as x,p as S,r as C,s as w,t as T,u as E,w as D,y as O,z as k}from"./buffer-layout-utils-BIP28hBl.js";import{a as A,c as ee,d as te,f as ne,i as re,l as ie,n as ae,o as oe,r as se,s as ce,t as le,u as ue}from"./wgsl-interface-scan-CLW9X4pL.js";import{a as de,c as fe,n as pe,o as me,r as he}from"./debug-hooks-BaBoIcbs.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var ge=`set luma.log.level=1 (or higher) to trace rendering`,_e="No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.",ve=new class e{static defaultProps={...a,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=l;log=o;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw o.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),o.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);o.error(`This version of luma.gl has already been initialized`)()}o.log(1,`${this.VERSION} - ${ge}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t},r=this.selectAdapter(n.type,n.adapters);if(!r)throw Error(_e);return n.waitForPageLoad&&await r.pageLoaded,await r.create(n)}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(_e);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||o.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?o.warn(`WebGL1 is not supported`,e)():o.warn(`Unknown handle type`,e)(),null)}},ye=class{get pageLoaded(){return Ce()}},be=k()&&typeof document<`u`,xe=()=>be&&document.readyState===`complete`,Se=null;function Ce(){return Se||=xe()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),Se}var we=class e{static defaultProps={...g.defaultProps};static getDefaultPipelineFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new e(t),n.defaultPipelineFactory}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...g.defaultProps,...e},n=this._renderPipelineCache,r=this._hashRenderPipeline(t),i=n[r]?.resource;if(i)n[r].useCount++,this.device.props.debugFactories&&o.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;i=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:c(`unnamed-cached`),_sharedRenderPipeline:e}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&o.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()}return i}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...te.defaultProps,...e},n=this._computePipelineCache,r=this._hashComputePipeline(t),i=n[r]?.resource;return i?(n[r].useCount++,this.device.props.debugFactories&&o.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)()):(i=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&o.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()),i}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&o.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(o.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&o.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof g&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof te&&(t=this._computePipelineCache),e instanceof g&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){let{type:t}=this.device;return`${t}/C/${this._getHash(e.shader.source)}SL${this._getHash(JSON.stringify(e.shaderLayout))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e.bufferLayout)),{type:o}=this.device;switch(o){case`webgl`:let s=this._getHash(JSON.stringify(e.parameters));return`${o}/R/${t}/${n}V${r}T${e.topology}P${s}SL${i}BL${a}`;default:let c=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),l=this._getHash(JSON.stringify(e.parameters)),u=this._getWebGPUAttachmentHash(e);return`${o}/R/${t}/${n}V${r}T${e.topology}EP${c}P${l}SL${i}BL${a}A${u}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=e.depthStencilAttachmentFormat??(e.parameters?.depthWriteEnabled?this.device.preferredDepthFormat:null);return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}},Te=class e{static defaultProps={...S.defaultProps};static getDefaultShaderFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new e(t),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&o.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let r=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:r,useCount:1},this.device.props.debugFactories&&o.log(3,`${this}: Created new shader ${r.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&o.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&o.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}};function Ee(e,t={}){let n={...e},r=t.layout??`std140`,i={},a=0;for(let[e,t]of Object.entries(n))a=ke(i,e,t,a,r);return a=u(a,je(n,r)),{layout:r,byteLength:a*4,uniformTypes:n,fields:i}}function De(e,t){let n=w(e),r=x(n),i=/^mat(\d)x(\d)<.+>$/.exec(n);if(i){let e=Number(i[1]),a=Number(i[2]),o=Me(a,n,r.type,t),s=Fe(o.size,o.alignment,t);return{alignment:o.alignment,size:e*s,components:e*a,columns:e,rows:a,columnStride:s,shaderType:n,type:r.type}}let a=/^vec(\d)<.+>$/.exec(n);return a?Me(Number(a[1]),n,r.type,t):{alignment:1,size:1,components:1,columns:1,rows:1,columnStride:1,shaderType:n,type:r.type}}function Oe(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function ke(e,t,n,r,i){if(typeof n==`string`){let a=De(n,i),o=u(r,a.alignment);return e[t]={offset:o,...a},o+a.size}if(Array.isArray(n)){if(Array.isArray(n[0]))throw Error(`Nested arrays are not supported for ${t}`);let a=n[0],o=n[1],s=Ne(a,i),c=u(r,je(n,i));for(let n=0;n<o;n++)ke(e,`${t}[${n}]`,a,c+n*s,i);return c+s*o}if(Oe(n)){let a=je(n,i),o=u(r,a);for(let[r,a]of Object.entries(n))o=ke(e,`${t}.${r}`,a,o,i);return u(o,a)}throw Error(`Unsupported CompositeShaderType for ${t}`)}function Ae(e,t){if(typeof e==`string`)return De(e,t).size;if(Array.isArray(e)){let n=e[0],r=e[1];if(Array.isArray(n))throw Error(`Nested arrays are not supported`);return Ne(n,t)*r}let n=0;for(let r of Object.values(e)){let e=r;n=u(n,je(e,t)),n+=Ae(e,t)}return u(n,je(e,t))}function je(e,t){if(typeof e==`string`)return De(e,t).alignment;if(Array.isArray(e)){let n=e[0],r=je(n,t);return Ie(t)?Math.max(r,4):r}let n=1;for(let r of Object.values(e)){let e=je(r,t);n=Math.max(n,e)}return Le(t)?Math.max(n,4):n}function Me(e,t,n,r){return{alignment:e===2?2:4,size:e===3?3:e,components:e,columns:1,rows:e,columnStride:e===3?3:e,shaderType:t,type:n}}function Ne(e,t){return Pe(Ae(e,t),je(e,t),t)}function Pe(e,t,n){return u(e,Ie(n)?4:t)}function Fe(e,t,n){return n===`std140`?4:u(e,t)}function Ie(e){return e===`std140`||e===`wgsl-uniform`}function Le(e){return e===`std140`||e===`wgsl-uniform`}function Re(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function ze(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:Re(e)}var Be=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=fe(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let i=n[0],a=n[1];if(Array.isArray(i))throw Error(`Nested arrays are not supported for ${t}`);if(typeof i==`string`&&ze(r)){this._flattenPackedArray(e,t,i,a,r);return}if(!Array.isArray(r)){o.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,a);n++){let a=r[n];a!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,i,a)}return}if(Oe(n)&&Ve(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}o.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=De(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=He(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){o.warn(`Uniform ${t} not found in layout`)();return}let{type:i,components:a,columns:s,rows:c,offset:l,columnStride:u}=r,d=e[i];if(a===1){d[l]=Number(n);return}let f=n;if(s===1){for(let e=0;e<a;e++)d[l+e]=Number(f[e]??0);return}let p=0;for(let e=0;e<s;e++){let t=l+e*u;for(let e=0;e<c;e++)d[t+e]=Number(f[p++]??0)}}};function Ve(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function He(e,t,n){return Array.prototype.slice.call(e,t,n)}var Ue=128;function We(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!ze(r)||!ze(i)||r.length!==i.length)return!1;let a=Math.min(n,Ue);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function Ge(e){return ze(e)?e.slice():e}var Ke=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return We(this.uniforms[e],t)?!1:(this.uniforms[e]=Ge(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},qe=1024,Je=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=Ee(r.uniformTypes??{},{layout:r.layout??Ye(e)}),a=new Be(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new Ke({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,qe)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,n){n&&this.setUniforms(n);let r=this.getUniformBufferByteLength(e),i=this.device.createBuffer({usage:t.UNIFORM|t.COPY_DST,byteLength:r}),a=this.getUniformBufferData(e);return i.write(a),i}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let n=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:t.UNIFORM|t.COPY_DST,byteLength:n});this.uniformBuffers.set(e,r)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&o.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),i=!1;if(r&&n?.needsRedraw){i||=n.needsRedraw;let a=this.getUniformBufferData(e);r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,a):r.write(a));let s=this.uniformBlocks.get(e)?.getAllUniforms();o.log(4,`Writing to uniform buffer ${String(e)}`,a,s)()}return i}};function Ye(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function Xe(e,t,n=`vector`){let{input:r,output:i,interpolation:a=`LINEAR`}=t;if(!r.length||!i.length||!Number.isFinite(e))return null;let o=r.length-1;if(e<=r[0]||o===0)return Qe(i,a,0,n);if(e>=r[o])return Qe(i,a,o,n);let s=0,c=o;for(;c-s>1;){let t=Math.floor((s+c)/2);r[t]<=e?s=t:c=t}let l=r[s],u=r[c]-l;if(u<=0||a===`STEP`)return Qe(i,a,s,n);let d=(e-l)/u;switch(a){case`LINEAR`:{let e=i[s],t=i[c];return!e||!t?null:n===`quaternion`?Ze(e,t,d):$e(e,t,d)}case`CUBICSPLINE`:{let e=i[s*3+1],t=i[s*3+2],r=i[c*3],a=i[c*3+1];if(!e||!t||!r||!a)return null;let o=et(e,t,r,a,u,d);return n===`quaternion`?tt(o):o}default:return null}}function Ze(e,t,n){let r=tt(e),i=tt(t),a=r.reduce((e,t,n)=>e+t*i[n],0),o=a<0?-1:1;if(a=Math.min(Math.abs(a),1),a>.9995)return tt(r.map((e,t)=>e+n*(i[t]*o-e)));let s=Math.acos(a),c=Math.sin(s),l=Math.sin((1-n)*s)/c,u=Math.sin(n*s)/c*o;return tt(r.map((e,t)=>e*l+i[t]*u))}function Qe(e,t,n,r){let i=e[t===`CUBICSPLINE`?n*3+1:n];return i?r===`quaternion`?tt(i):[...i]:null}function $e(e,t,n){return e.map((e,r)=>(1-n)*e+n*t[r])}function et(e,t,n,r,i,a){let o=a*a,s=o*a;return e.map((e,c)=>(2*s-3*o+1)*e+(s-2*o+a)*t[c]*i+(-2*s+3*o)*r[c]+(s-o)*n[c]*i)}function tt(e){let t=Math.hypot(...e);return t>0?e.map(e=>e/t):[0,0,0,1]}var nt=class{name;times;values;interpolation;valueType;binding;constructor(e){this.name=e.name||e.binding.id||`unnamed`,this.times=e.times,this.values=e.values,this.interpolation=e.interpolation||`LINEAR`,this.valueType=e.valueType||`vector`,this.binding=e.binding}get duration(){return this.times[this.times.length-1]||0}get sampler(){return{input:this.times,output:this.values,interpolation:this.interpolation}}evaluate(e){return Xe(e,this.sampler,this.valueType)}},rt=class{name;tracks;duration;constructor(e){this.name=e.name||`unnamed`,this.tracks=e.tracks,this.duration=e.duration??Math.max(0,...e.tracks.map(e=>e.duration))}},it=class{clip;mixer;time=0;timeScale;weight;loop;repetitions;paused=!1;playing=!1;elapsedTime=0;fade=null;constructor(e,t,n={}){this.mixer=e,this.clip=t,this.loop=n.loop||`repeat`,this.repetitions=n.repetitions??1/0,this.timeScale=n.timeScale??1,this.weight=n.weight??1}play(){return this.playing=!0,this.paused=!1,this}pause(){return this.paused=!0,this}resume(){return this.playing=!0,this.paused=!1,this}stop(){return this.playing=!1,this.paused=!1,this.fade=null,this.reset()}reset(){return this.elapsedTime=0,this.time=0,this}setTime(e){return this.elapsedTime=e,this.time=this.resolveLocalTime(e),this}setLoop(e,t=1/0){return this.loop=e,this.repetitions=t,this.time=this.resolveLocalTime(this.elapsedTime),this}setEffectiveWeight(e){return this.weight=Math.max(0,e),this.fade=null,this}setEffectiveTimeScale(e){return this.timeScale=e,this}fadeIn(e){return this.scheduleFade(1,e)}fadeOut(e){return this.scheduleFade(0,e)}crossFadeTo(e,t){return e.weight=0,e.play().fadeIn(t),this.fadeOut(t)}crossFadeFrom(e,t){return e.crossFadeTo(this,t),this}advance(e){!this.playing||this.paused||(this.advanceFade(Math.abs(e)),this.elapsedTime+=e*this.timeScale,this.time=this.resolveLocalTime(this.elapsedTime),this.hasFinished()&&(this.playing=!1))}get shouldApply(){return(this.playing||this.hasFinished())&&this.weight>0}scheduleFade(e,t){return t<=0?(this.weight=e,this.fade=null,this):(this.fade={duration:t,elapsedTime:0,startWeight:this.weight,endWeight:e},this)}advanceFade(e){if(!this.fade)return;this.fade.elapsedTime+=e;let t=Math.min(this.fade.elapsedTime/this.fade.duration,1);this.weight=this.fade.startWeight+(this.fade.endWeight-this.fade.startWeight)*t,t===1&&(this.fade=null)}hasFinished(){let e=this.clip.duration;return e<=0?this.loop===`once`:this.loop===`once`?this.elapsedTime>=e||this.elapsedTime<0:Number.isFinite(this.repetitions)&&Math.abs(this.elapsedTime)>=e*this.repetitions}resolveLocalTime(e){let t=this.clip.duration;if(t<=0)return 0;if(this.loop===`once`)return Math.min(Math.max(e,0),t);if(Number.isFinite(this.repetitions)&&Math.abs(e)>=t*this.repetitions)return this.loop===`ping-pong`&&this.repetitions%2==0||e<0?0:t;let n=e>=0&&e<t?e:(e%t+t)%t;if(this.loop===`repeat`)return n;let r=Math.floor(e/t);return Math.abs(r%2)===0?n:t-n}},at=class{time=0;timeScale=1;clips=new Map;actions=new Map;initialValues=new Map;constructor(e=[]){e.forEach(e=>this.addClip(e))}addClip(e){return this.clips.set(e.name,e),this}clipAction(e,t){let n=typeof e==`string`?this.clips.get(e):e;if(!n)throw Error(`Unknown animation clip: ${e}`);this.addClip(n);let r=this.actions.get(n);return r||(r=new it(this,n,t),this.actions.set(n,r)),r}getAction(e){let t=this.clips.get(e);return t?this.actions.get(t):void 0}update(e){return this.advance(e),this.applyValues(),this}advance(e){let t=e*this.timeScale;return this.time+=t,this.actions.forEach(e=>e.advance(t)),this}setTime(e){return this.time=e,this.actions.forEach(t=>{t.paused||t.setTime(e*t.timeScale)}),this.applyValues(),this}stopAllAction(){return this.actions.forEach(e=>e.stop()),this}applyValues(){let e=new Map;this.actions.forEach(t=>{!t.shouldApply&&!(t.playing&&t.weight===0)||t.clip.tracks.forEach(n=>{let r=n.evaluate(t.time);if(!r)return;let i=n.binding.id||n.binding;if(!this.initialValues.has(i)){let e=n.binding.getValue?.();e&&this.initialValues.set(i,[...e])}if(t.weight===0&&!this.initialValues.has(i))return;let a=e.get(i);if(!a){e.set(i,{binding:n.binding,value:[...r],valueType:n.valueType,weight:t.weight});return}if(t.weight===0)return;let o=a.weight+t.weight,s=t.weight/o;a.value=n.valueType===`quaternion`?Ze(a.value,r,s):a.value.map((e,t)=>e+(r[t]-e)*s),a.weight=o})}),e.forEach(({binding:e,value:t,valueType:n,weight:r},i)=>{let a=r<1?this.initialValues.get(i):void 0;a&&a.length===t.length&&(t=n===`quaternion`?Ze(a,t,r):t.map((e,t)=>a[t]+(e-a[t])*r)),e.setValue(t)})}},ot={};function j(e=`id`){return ot[e]=ot[e]||1,`${e}-${ot[e]++}`}var st=class{id;topology;vertexCount;indices;attributes;bufferLayout;userData={};constructor(e){let{attributes:t={},indices:n=null,vertexCount:r=null}=e;this.id=e.id||j(`geometry`),this.topology=e.topology,n&&(this.indices=ArrayBuffer.isView(n)?{value:n,size:1}:n),this.attributes={};for(let[e,n]of Object.entries(t)){let t=ArrayBuffer.isView(n)?{value:n}:n;if(!ArrayBuffer.isView(t.value))throw Error(`${this._print(e)}: must be typed array or object with value as typed array`);if((e===`POSITION`||e===`positions`)&&!t.size&&(t.size=3),e===`indices`){if(this.indices)throw Error(`Multiple indices detected`);this.indices=t}else{let n=ct(e),r=Object.keys(this.attributes).find(e=>ct(e)===n);r&&delete this.attributes[r],this.attributes[e]=t}}this.indices&&this.indices.isIndexed!==void 0&&(this.indices=Object.assign({},this.indices),delete this.indices.isIndexed),this.vertexCount=r||this._calculateVertexCount(this.attributes,this.indices),this.bufferLayout=e.bufferLayout||lt(this.attributes)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}_print(e){return`Geometry ${this.id} attribute ${e}`}_setAttributes(e,t){return this}_calculateVertexCount(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e)){if(!t)continue;let{value:e,size:r,constant:i}=t;!i&&e&&r!==void 0&&r>=1&&(n=Math.min(n,e.length/r))}return n}};function ct(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function lt(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:a,normalized:o}=r;if(a===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:ct(n),format:i.getVertexFormatFromAttribute(e,a,o)})}return t}function ut(e){let{indices:t,attributes:n}=e;if(!t)return e;let r=t.value.length,i={};for(let e in n){let a=n[e];if(!a)continue;let{value:o,size:s}=a;if(a.constant||!s)continue;let c=o.constructor,l=new c(r*s);for(let e=0;e<r;++e){let n=t.value[e];for(let t=0;t<s;t++)l[e*s+t]=o[n*s+t]}i[e]={size:s,value:l}}return{attributes:Object.assign({},n,i)}}function dt(e,t={}){let n=t.bufferName||`geometry`;if(ft(e,n))return e;let r=t.minAttributeAlignment||4,a=pt(e,t.attributes),o=[],s=0,c=1/0;for(let[e,t]of a){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:a,normalized:l}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(a===void 0)throw Error(`Attribute ${e} is missing a size`);let u=i.getVertexFormatFromAttribute(n,a,l),d=i.getVertexFormatInfo(u);s=ht(s,r),o.push({sourceName:e,attributeName:ct(e),value:n,size:a,format:u,byteOffset:s,byteLength:d.byteLength}),s+=d.byteLength;let f=n.length/a;if(!Number.isInteger(f))throw Error(`Attribute ${e} length is not divisible by size`);c=Math.min(c,f)}if(o.length===0||!Number.isFinite(c))throw Error(`Geometry ${e.id} has no interleavable attributes`);let l=ht(s,r),u=new ArrayBuffer(c*l);for(let e of o)mt(u,c,l,e);return new st({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(u),size:l,byteStride:l}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:l,attributes:o.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function ft(e,t){if(e.bufferLayout.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function pt(e,t){return t?t.map(t=>[t,e.attributes[t]]):Object.entries(e.attributes)}function mt(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function ht(e,t){return Math.ceil(e/t)*t}function gt(e){let t=e.value;if(t instanceof Float32Array)return t;let n=new Float32Array(t.length),r=bt(t),i=t instanceof Int8Array||t instanceof Int16Array||t instanceof Int32Array;for(let a=0;a<t.length;a++){let o=Number(t[a]);n[a]=e.normalized&&r?i?Math.max(o/r,-1):o/r:o}return n}function _t(e,t,n){let r={};for(let i of[`POSITION`,`NORMAL`,`TANGENT`]){let a=e[i];if(!a)continue;let o=new Float32Array(a),s=i===`TANGENT`?4:3,c=Math.floor(a.length/s);for(let e=0;e<Math.min(t.length,n.length);e++){let r=n[e],a=t[e][i];if(!r||!a)continue;let l=i===`TANGENT`&&a.length===c*4?4:3;for(let e=0;e<c;e++){let t=e*s,n=e*l;for(let e=0;e<3;e++)o[t+e]+=(a[n+e]||0)*r}}i!==`POSITION`&&xt(o,s),r[i]=o}return r}function vt(e,t,n,r){let i={};for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let n=t.attributes[e];n&&(i[e]=gt(n))}let a=_t(i,n,r),o={};for(let[e,n]of Object.entries(t.attributes))n&&(o[e]=n);for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let t=a[e],n=o[e];t&&n&&(o[e]={...n,value:yt(n,t)})}let s=dt(new st({id:t.id,topology:t.topology||`triangle-list`,vertexCount:t.vertexCount,indices:t.indices,attributes:o,bufferLayout:t.bufferLayout})).attributes.geometry?.value,c=e._gpuGeometry?.attributes.geometry||e.bufferAttributes.geometry;if(s&&c){c.write(s);return}for(let t of[`POSITION`,`NORMAL`,`TANGENT`]){let n=a[t];if(n){let r=t===`POSITION`?`positions`:t===`NORMAL`?`normals`:`TANGENT`;e.bufferAttributes[r]?.write(n)}}}function yt(e,t){if(e.value instanceof Float32Array)return t;let n=e.value.slice(),r=bt(n),i=n instanceof Int8Array||n instanceof Int16Array||n instanceof Int32Array;for(let a=0;a<t.length;a++){let o=t[a];n[a]=e.normalized&&r?Math.round(Math.max(i?-1:0,Math.min(1,o))*r):o}return n}function bt(e){return e instanceof Int8Array?127:e instanceof Uint8Array||e instanceof Uint8ClampedArray?255:e instanceof Int16Array?32767:e instanceof Uint16Array?65535:e instanceof Int32Array?2147483647:e instanceof Uint32Array?4294967295:0}function xt(e,t){for(let n=0;n<e.length;n+=t){let t=Math.hypot(e[n],e[n+1],e[n+2]);t>0&&(e[n]/=t,e[n+1]/=t,e[n+2]/=t)}}1/Math.PI*180,1/180*Math.PI;var St={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...St}};var M=globalThis.mathgl.config;function Ct(e,{precision:t=M.precision}={}){return e=Et(e),`${parseFloat(e.toPrecision(t))}`}function wt(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Tt(e,t,n){let r=M.EPSILON;n&&(M.EPSILON=n);try{if(e===t)return!0;if(wt(e)&&wt(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!Tt(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`?Math.abs(e-t)<=M.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{M.EPSILON=r}}function Et(e){return Math.round(e/M.EPSILON)*M.EPSILON}var Dt=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:wt(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toFloat32Array(){return new Float32Array(this)}toString(){return this.formatString(M)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+Ct(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!Tt(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r];this[r]=i+n*((typeof t==`number`?t:t[r])-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(M.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}sub(e){return this.subtract(e)}setScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=e;return this.check()}addScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]+=e;return this.check()}subScalar(e){return this.addScalar(-e)}multiplyScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}divideScalar(e){return this.multiplyByScalar(1/e)}clampScalar(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e),t);return this.check()}get elements(){return this}};function Ot(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function N(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function kt(e,t,n=``){if(M.debug&&!Ot(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}function At(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}var jt=class extends Dt{get x(){return this[0]}set x(e){this[0]=N(e)}get y(){return this[1]}set y(e){this[1]=N(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let n=0;n<this.ELEMENTS;++n){let r=this[n]-e[n];t+=r*r}return N(t)}dot(e){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*e[n];return N(t)}normalize(){let e=this.magnitude();if(e!==0)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return At(e>=0&&e<this.ELEMENTS,`index is out of range`),N(this[e])}setComponent(e,t){return At(e>=0&&e<this.ELEMENTS,`index is out of range`),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){return this.add(new this.constructor(e).multiplyScalar(t))}},Mt=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180;function Nt(){let e=new Mt(2);return Mt!=Float32Array&&(e[0]=0,e[1]=0),e}function Pt(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[3]*i+n[6],e[1]=n[1]*r+n[4]*i+n[7],e}function Ft(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}(function(){let e=Nt();return function(t,n,r,i,a,o){let s,c;for(n||=2,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],a(e,e,o),t[s]=e[0],t[s+1]=e[1];return t}})();function It(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function Lt(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function Rt(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e[2]=t[2],e}function zt(e,t,n){let r=t[0],i=t[1],a=t[2];return e[0]=n[0]*r+n[3]*i+n[6]*a,e[1]=n[1]*r+n[4]*i+n[7]*a,e[2]=n[2]*r+n[5]*i+n[8]*a,e[3]=t[3],e}function Bt(){let e=new Mt(3);return Mt!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function Vt(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function Ht(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function Ut(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}function Wt(e,t,n){let r=t[0],i=t[1],a=t[2];return e[0]=r*n[0]+i*n[3]+a*n[6],e[1]=r*n[1]+i*n[4]+a*n[7],e[2]=r*n[2]+i*n[5]+a*n[8],e}function Gt(e,t,n){let r=n[0],i=n[1],a=n[2],o=n[3],s=t[0],c=t[1],l=t[2],u=i*l-a*c,d=a*s-r*l,f=r*c-i*s,p=i*f-a*d,m=a*u-r*f,h=r*d-i*u,g=o*2;return u*=g,d*=g,f*=g,p*=2,m*=2,h*=2,e[0]=s+u+p,e[1]=c+d+m,e[2]=l+f+h,e}function Kt(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0],a[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),a[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function qt(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function Jt(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function Yt(e,t){let n=e[0],r=e[1],i=e[2],a=t[0],o=t[1],s=t[2],c=Math.sqrt((n*n+r*r+i*i)*(a*a+o*o+s*s)),l=c&&Vt(e,t)/c;return Math.acos(Math.min(Math.max(l,-1),1))}(function(){let e=Bt();return function(t,n,r,i,a,o){let s,c;for(n||=3,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2];return t}})();var Xt=[0,0,0],Zt,Qt=class e extends jt{static get ZERO(){return Zt||(Zt=new e(0,0,0),Object.freeze(Zt)),Zt}constructor(e=0,t=0,n=0){super(-0,-0,-0),arguments.length===1&&wt(e)?this.copy(e):(M.debug&&(N(e),N(t),N(n)),this[0]=e,this[1]=t,this[2]=n)}set(e,t,n){return this[0]=e,this[1]=t,this[2]=n,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return M.debug&&(N(e.x),N(e.y),N(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=N(e)}angle(e){return Yt(this,e)}cross(e){return Ht(this,this,e),this.check()}rotateX({radians:e,origin:t=Xt}){return Kt(this,this,t,e),this.check()}rotateY({radians:e,origin:t=Xt}){return qt(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=Xt}){return Jt(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return Ut(this,this,e),this.check()}transformAsVector(e){return Lt(this,this,e),this.check()}transformByMatrix3(e){return Wt(this,this,e),this.check()}transformByMatrix2(e){return Rt(this,this,e),this.check()}transformByQuaternion(e){return Gt(this,this,e),this.check()}},$t=class extends Dt{toString(){let e=`[`;if(M.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=N(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}};function en(e,t){if(e===t){let n=t[1],r=t[2],i=t[5];e[1]=t[3],e[2]=t[6],e[3]=n,e[5]=t[7],e[6]=r,e[7]=i}else e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8];return e}function tn(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=u*o-s*l,f=-u*a+s*c,p=l*a-o*c,m=n*d+r*f+i*p;return m?(m=1/m,e[0]=d*m,e[1]=(-u*r+i*l)*m,e[2]=(s*r-i*o)*m,e[3]=f*m,e[4]=(u*n-i*c)*m,e[5]=(-s*n+i*a)*m,e[6]=p*m,e[7]=(-l*n+r*c)*m,e[8]=(o*n-r*a)*m,e):null}function nn(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*(l*a-o*c)+n*(-l*i+o*s)+r*(c*i-a*s)}function rn(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=n[0],p=n[1],m=n[2],h=n[3],g=n[4],_=n[5],v=n[6],y=n[7],b=n[8];return e[0]=f*r+p*o+m*l,e[1]=f*i+p*s+m*u,e[2]=f*a+p*c+m*d,e[3]=h*r+g*o+_*l,e[4]=h*i+g*s+_*u,e[5]=h*a+g*c+_*d,e[6]=v*r+y*o+b*l,e[7]=v*i+y*s+b*u,e[8]=v*a+y*c+b*d,e}function an(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=n[0],p=n[1];return e[0]=r,e[1]=i,e[2]=a,e[3]=o,e[4]=s,e[5]=c,e[6]=f*r+p*o+l,e[7]=f*i+p*s+u,e[8]=f*a+p*c+d,e}function on(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=Math.sin(n),p=Math.cos(n);return e[0]=p*r+f*o,e[1]=p*i+f*s,e[2]=p*a+f*c,e[3]=p*o-f*r,e[4]=p*s-f*i,e[5]=p*c-f*a,e[6]=l,e[7]=u,e[8]=d,e}function sn(e,t,n){let r=n[0],i=n[1];return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=i*t[3],e[4]=i*t[4],e[5]=i*t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e}function cn(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[3]=u-_,e[6]=f+g,e[1]=u+_,e[4]=1-l-m,e[7]=p-h,e[2]=f-g,e[5]=p+h,e[8]=1-l-d,e}var ln;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL1ROW0=3]=`COL1ROW0`,e[e.COL1ROW1=4]=`COL1ROW1`,e[e.COL1ROW2=5]=`COL1ROW2`,e[e.COL2ROW0=6]=`COL2ROW0`,e[e.COL2ROW1=7]=`COL2ROW1`,e[e.COL2ROW2=8]=`COL2ROW2`})(ln||={});var un=Object.freeze([1,0,0,0,1,0,0,0,1]),dn=class extends $t{static get IDENTITY(){return hn()}static get ZERO(){return mn()}get ELEMENTS(){return 9}get RANK(){return 3}get INDICES(){return ln}constructor(e,...t){super(-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):t.length>0?this.copy([e,...t]):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this.check()}identity(){return this.copy(un)}fromObject(e){return this.check()}fromQuaternion(e){return cn(this,e),this.check()}set(e,t,n,r,i,a,o,s,c){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c){return this[0]=e,this[1]=r,this[2]=o,this[3]=t,this[4]=i,this[5]=s,this[6]=n,this[7]=a,this[8]=c,this.check()}determinant(){return nn(this)}transpose(){return en(this,this),this.check()}invert(){return tn(this,this),this.check()}multiplyLeft(e){return rn(this,e,this),this.check()}multiplyRight(e){return rn(this,this,e),this.check()}rotate(e){return on(this,this,e),this.check()}scale(e){return Array.isArray(e)?sn(this,this,e):sn(this,this,[e,e]),this.check()}translate(e){return an(this,this,e),this.check()}transform(e,t){let n;switch(e.length){case 2:n=Pt(t||[-0,-0],e,this);break;case 3:n=Wt(t||[-0,-0,-0],e,this);break;case 4:n=zt(t||[-0,-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return kt(n,e.length),n}transformVector(e,t){return this.transform(e,t)}transformVector2(e,t){return this.transform(e,t)}transformVector3(e,t){return this.transform(e,t)}},fn,pn=null;function mn(){return fn||(fn=new dn([0,0,0,0,0,0,0,0,0]),Object.freeze(fn)),fn}function hn(){return pn||(pn=new dn,Object.freeze(pn)),pn}function gn(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function _n(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function vn(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function yn(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function bn(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function xn(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function Sn(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function Cn(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,ee;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,ee=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*ee,e[9]=f*k+g*A+b*ee,e[10]=p*k+_*A+x*ee,e[11]=m*k+v*A+S*ee,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function wn(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function Tn(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function En(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function Dn(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function On(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function kn(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var An=kn;function jn(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var Mn=jn;function Nn(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?gn(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function Pn(){let e=new Mt(4);return Mt!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0,e[3]=0),e}function Fn(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}(function(){let e=Pn();return function(t,n,r,i,a,o){let s,c;for(n||=4,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],e[3]=t[s+3],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2],t[s+3]=e[3];return t}})();var In;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL0ROW3=3]=`COL0ROW3`,e[e.COL1ROW0=4]=`COL1ROW0`,e[e.COL1ROW1=5]=`COL1ROW1`,e[e.COL1ROW2=6]=`COL1ROW2`,e[e.COL1ROW3=7]=`COL1ROW3`,e[e.COL2ROW0=8]=`COL2ROW0`,e[e.COL2ROW1=9]=`COL2ROW1`,e[e.COL2ROW2=10]=`COL2ROW2`,e[e.COL2ROW3=11]=`COL2ROW3`,e[e.COL3ROW0=12]=`COL3ROW0`,e[e.COL3ROW1=13]=`COL3ROW1`,e[e.COL3ROW2=14]=`COL3ROW2`,e[e.COL3ROW3=15]=`COL3ROW3`})(In||={});var Ln=45*Math.PI/180,Rn=1,zn=.1,Bn=500,Vn=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),P=class extends $t{static get IDENTITY(){return Gn()}static get ZERO(){return Wn()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return In}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(Vn)}fromObject(e){return this.check()}fromQuaternion(e){return Dn(this,e),this.check()}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=zn,far:o=Bn}=e;return o===1/0?qn(this,t,n,r,i,a):On(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return Nn(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=zn,far:o=Bn}=e;return Mn(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=Ln,aspect:n=Rn,focalDistance:r=1,near:i=zn,far:a=Bn}=e;Kn(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return Kn(t),An(this,t,n,r,i),this.check()}determinant(){return yn(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=0,e[4]=this[4]*r,e[5]=this[5]*i,e[6]=this[6]*a,e[7]=0,e[8]=this[8]*r,e[9]=this[9]*i,e[10]=this[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=this[4]*r,e[4]=this[5]*i,e[5]=this[6]*a,e[6]=this[8]*r,e[7]=this[9]*i,e[8]=this[10]*a,e}transpose(){return _n(this,this),this.check()}invert(){return vn(this,this),this.check()}multiplyLeft(e){return bn(this,e,this),this.check()}multiplyRight(e){return bn(this,this,e),this.check()}rotateX(e){return wn(this,this,e),this.check()}rotateY(e){return Tn(this,this,e),this.check()}rotateZ(e){return En(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return Cn(this,this,e,t),this.check()}scale(e){return Sn(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return xn(this,this,e),this.check()}transform(e,t){return e.length===4?(t=Fn(t||[-0,-0,-0,-0],e,this),kt(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=Ft(t||[-0,-0],e,this);break;case 3:r=Ut(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return kt(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=It(t||[-0,-0],e,this);break;case 3:n=Lt(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return kt(n,e.length),n}transformPoint(e,t){return this.transformAsPoint(e,t)}transformVector(e,t){return this.transformAsPoint(e,t)}transformDirection(e,t){return this.transformAsVector(e,t)}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},Hn,Un;function Wn(){return Hn||(Hn=new P([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(Hn)),Hn}function Gn(){return Un||(Un=new P,Object.freeze(Un)),Un}function Kn(e){if(e>Math.PI*2)throw Error(`expected radians`)}function qn(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}function Jn(e){let{joints:t,meshNode:n,worldMatrices:r,inverseBindMatrices:i,target:a}=e,o=t.length,s=a&&a.length===o*16?a:new Float32Array(o*16),c=n?r.get(n)||n.matrix:void 0,l=c?new P(c).invert():null;for(let e=0;e<o;e++){let n=t[e],a=r.get(n)||n.matrix,o=l?new P(l).multiplyRight(a):new P(a),c=e*16;if(i&&i.length>=c+16){let e=new P;for(let t=0;t<16;t++)e[t]=i[c+t];o.multiplyRight(e)}s.set(o,c)}return s}var Yn=class{constructor(e){}async onInitialize(e){return null}};function Xn(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function Zn(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var Qn=0,$n=`Animation Loop`,er={requestAnimationFrame:e=>Xn(e),cancelAnimationFrame:e=>Zn(e)},tr=class e{static defaultAnimationLoopProps={device:null,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:er};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new d({id:`animation-loop-${Qn++}`}),this.sharedStats=ve.stats.get($n),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(e){this.props.onError(e),this._error=e}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||er;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){return this._running&&(this.animationProps&&!this._error&&this.props.onFinalize(this.animationProps),this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0),this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){this._running&&(this.redraw(e,t??null),this._requestAnimationFrame())}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove.bind(this)),this.canvas.addEventListener(`mouseleave`,this._onMouseleave.bind(this)))}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}};function nr(e,t){let n=null,r=t?.device||ve.createDevice({id:`animation-loop`,adapters:t?.adapters,createCanvasContext:!0}),i=new tr({...t,device:r,async onInitialize(t){ir(t.animationLoop.device);try{return n=new e(t),await n?.onInitialize(t)}catch(e){return console.error(e),n=null,rr(t.animationLoop.device,e),t.animationLoop.stop(),null}},onRender(e){let r=n?.onRender(e),i=t?.onAfterRender?.(e,n);return t?.onAfterRender?r!==!1||i!==!1:r},onFinalize(e){try{n?.onFinalize(e)}finally{n=null}}}),a=i;return a.getAnimationLoopTemplate=()=>n,i.getInfo=()=>this.AnimationLoopTemplateCtor.info,a}function rr(e,t){if(!e)return;let n=e.getDefaultCanvasContext().canvas;if(n instanceof HTMLCanvasElement){n.style.overflow=`visible`;let e=document.getElementById(`animation-loop-error`);e?.remove(),e=document.createElement(`h1`),e.id=`animation-loop-error`,e.innerHTML=t.message,e.style.position=`absolute`,e.style.top=`10px`,e.style.left=`10px`,e.style.color=`black`,e.style.backgroundColor=`red`,n.parentElement?.appendChild(e)}}function ir(e){if(!e)return;let t=document.getElementById(`animation-loop-error`);t&&t.remove()}var ar={target:[0,0,0],distance:10,yaw:0,pitch:.25,minDistance:1,maxDistance:100,minPitch:-Math.PI/2+.01,maxPitch:Math.PI/2-.01,rotateSpeed:.006,zoomSpeed:.001,enabled:!0,enableZoom:!0,enablePan:!1,panSpeed:.0018,autoRotate:!1,autoRotateSpeed:.1},or=class{canvas;props;yaw;pitch;distance;dragging=!1;activePointers=new Map;lastPointer=[0,0];previousPinchDistance=null;previousTimeMilliseconds=null;previousCursor;previousTouchAction;constructor(e,t={}){this.canvas=e,this.props={...ar,...t},this.props.target=[...this.props.target],this.yaw=this.props.yaw,this.pitch=sr(this.props.pitch,this.props.minPitch,this.props.maxPitch),this.distance=sr(this.props.distance,this.props.minDistance,this.props.maxDistance),this.previousCursor=e.style.cursor,this.previousTouchAction=e.style.touchAction,e.style.cursor=`grab`,e.style.touchAction=`none`,e.addEventListener(`pointerdown`,this.handlePointerDown),e.addEventListener(`pointermove`,this.handlePointerMove),e.addEventListener(`pointerup`,this.handlePointerUp),e.addEventListener(`pointercancel`,this.handlePointerUp),e.addEventListener(`wheel`,this.handleWheel,{passive:!1})}update(e){if(this.previousTimeMilliseconds!==null&&this.props.enabled&&this.props.autoRotate&&!this.dragging){let t=Math.min(Math.max(e-this.previousTimeMilliseconds,0)/1e3,.1);this.yaw+=this.props.autoRotateSpeed*t}this.previousTimeMilliseconds=e}getEyePosition(){let e=this.distance*Math.cos(this.pitch);return[this.props.target[0]+e*Math.sin(this.yaw),this.props.target[1]+this.distance*Math.sin(this.pitch),this.props.target[2]+e*Math.cos(this.yaw)]}setAutoRotate(e){this.props.autoRotate=e}setProps(e){Object.assign(this.props,e),e.enabled===!1&&this.dragging&&this.endPointerInteraction(),e.target&&(this.props.target=[...e.target]),e.yaw!==void 0&&(this.yaw=e.yaw),(e.pitch!==void 0||e.minPitch!==void 0||e.maxPitch!==void 0)&&(this.pitch=sr(e.pitch??this.pitch,this.props.minPitch,this.props.maxPitch)),(e.distance!==void 0||e.minDistance!==void 0||e.maxDistance!==void 0)&&(this.distance=sr(e.distance??this.distance,this.props.minDistance,this.props.maxDistance))}reset(){this.yaw=this.props.yaw,this.pitch=sr(this.props.pitch,this.props.minPitch,this.props.maxPitch),this.distance=sr(this.props.distance,this.props.minDistance,this.props.maxDistance)}destroy(){this.canvas.removeEventListener(`pointerdown`,this.handlePointerDown),this.canvas.removeEventListener(`pointermove`,this.handlePointerMove),this.canvas.removeEventListener(`pointerup`,this.handlePointerUp),this.canvas.removeEventListener(`pointercancel`,this.handlePointerUp),this.canvas.removeEventListener(`wheel`,this.handleWheel),this.endPointerInteraction(),this.canvas.style.cursor=this.previousCursor,this.canvas.style.touchAction=this.previousTouchAction}handlePointerDown=e=>{if(!(!this.props.enabled||e.button!==0||this.activePointers.has(e.pointerId)||this.activePointers.size>=2||this.activePointers.size>0&&e.pointerType!==`touch`)){if(this.activePointers.size===0&&this.props.onInteractionStart?.(),this.dragging=!0,this.activePointers.set(e.pointerId,[e.clientX,e.clientY]),this.activePointers.size===1)this.lastPointer=[e.clientX,e.clientY];else{let{center:e,distance:t}=this.getMultiPointerState();this.lastPointer=e,this.previousPinchDistance=t}this.canvas.setPointerCapture(e.pointerId),this.canvas.style.cursor=`grabbing`}};handlePointerMove=e=>{if(!this.props.enabled||!this.dragging||!this.activePointers.has(e.pointerId))return;if(this.activePointers.set(e.pointerId,[e.clientX,e.clientY]),this.activePointers.size>1){let{center:e,distance:t}=this.getMultiPointerState();this.props.enablePan&&this.panTarget(e[0]-this.lastPointer[0],e[1]-this.lastPointer[1]),this.props.enableZoom&&this.previousPinchDistance&&t>0&&(this.distance=sr(this.distance*this.previousPinchDistance/t,this.props.minDistance,this.props.maxDistance)),this.lastPointer=e,this.previousPinchDistance=t;return}let t=e.clientX-this.lastPointer[0],n=e.clientY-this.lastPointer[1];this.lastPointer=[e.clientX,e.clientY],this.props.enablePan&&e.shiftKey?this.panTarget(t,n):(this.yaw-=t*this.props.rotateSpeed,this.pitch=sr(this.pitch-n*(this.props.pitchSpeed??this.props.rotateSpeed),this.props.minPitch,this.props.maxPitch))};handlePointerUp=e=>{if(!this.activePointers.has(e.pointerId))return;this.canvas.hasPointerCapture(e.pointerId)&&this.canvas.releasePointerCapture(e.pointerId),this.activePointers.delete(e.pointerId),this.previousPinchDistance=null;let t=this.activePointers.entries().next().value;if(t){this.lastPointer=t[1];return}this.endPointerInteraction()};endPointerInteraction(){this.dragging=!1;for(let e of this.activePointers.keys())this.canvas.hasPointerCapture(e)&&this.canvas.releasePointerCapture(e);this.activePointers.clear(),this.previousPinchDistance=null,this.canvas.style.cursor=`grab`}getMultiPointerState(){let[e,t]=this.activePointers.values(),n=t[0]-e[0],r=t[1]-e[1];return{center:[(e[0]+t[0])/2,(e[1]+t[1])/2],distance:Math.hypot(n,r)}}panTarget(e,t){let n=this.distance*this.props.panSpeed;this.props.target=[this.props.target[0]-Math.cos(this.yaw)*e*n,this.props.target[1]+t*n,this.props.target[2]+Math.sin(this.yaw)*e*n]}handleWheel=e=>{if(!this.props.enabled||!this.props.enableZoom)return;e.preventDefault(),this.props.onInteractionStart?.();let t=sr(e.deltaY,-240,240);this.distance=sr(this.distance*Math.exp(t*this.props.zoomSpeed),this.props.minDistance,this.props.maxDistance)}};function sr(e,t,n){return Math.min(Math.max(e,t),n)}function cr(e,t){if(!e){let e=Error(t||`shadertools: assertion failed.`);throw Error.captureStackTrace?.(e,cr),e}}var lr={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function ur(e){let t={};for(let[n,r]of Object.entries(e))t[n]=dr(r);return t}function dr(e){let t=fr(e);if(t!==`object`)return{value:e,...lr[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=fr(e.value),{...e,...lr[t],type:t}):{...e,...lr[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function fr(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}var pr={vertex:`#ifdef MODULE_LOGDEPTH
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
`},mr=/void\s+main\s*\([^)]*\)\s*\{\n?/,hr=/}\n?[^{}]*$/,gr=[],_r=`__LUMA_INJECT_DECLARATIONS__`;function vr(e){let t={vertex:{},fragment:{}};for(let n in e){let r=e[n],i=yr(n);typeof r==`string`&&(r={order:0,injection:r}),t[i][n]=r}return t}function yr(e){let t=e.slice(0,2);switch(t){case`vs`:return`vertex`;case`fs`:return`fragment`;default:throw Error(t)}}function br(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),gr.length=r.length;for(let e=0,t=r.length;e<t;++e)gr[e]=r[e].injection;let s=`${gr.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(_r,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?xr(e,`vertex`,s,`start`,a.vertex):e.replace(mr,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?xr(e,`vertex`,s,`end`,a.vertex):e.replace(hr,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(_r,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?xr(e,`fragment`,s,`start`,a.fragment):e.replace(mr,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?xr(e,`fragment`,s,`end`,a.fragment):e.replace(hr,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(_r,``),r&&(e=e.replace(/\}\s*$/,e=>e+pr[t])),e}function xr(e,t,n,r,i){let a=Sr(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function Sr(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${Cr(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function Cr(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function wr(e){e.map(e=>Tr(e))}function Tr(e){if(e.instance)return;wr(e.dependencies||[]);let{propTypes:t={},deprecations:n=[],inject:r={}}=e,i={normalizedInjections:vr(r),parsedDeprecations:Dr(n)};t&&(i.propValidators=ur(t)),e.instance=i;let a={};t&&(a=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...a}}function Er(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function Dr(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function Or(e){wr(e);let t={},n={};kr({modules:e,level:0,moduleMap:t,moduleDepth:n});let r=Object.keys(n).sort((e,t)=>n[t]-n[e]).map(e=>t[e]);return wr(r),r}function kr(e){let{modules:t,level:n,moduleMap:r,moduleDepth:i}=e;if(n>=5)throw Error(`Possible loop in shader dependency graph`);for(let e of t)r[e.name]=e,(i[e.name]===void 0||i[e.name]<n)&&(i[e.name]=n);for(let e of t)e.dependencies&&kr({modules:e.dependencies,level:n+1,moduleMap:r,moduleDepth:i})}var Ar=/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][\w-]*)$/;function jr(e=[],t){let n=[],r={},i={},a={},o={};for(let s of e)Nr({modules:n,defines:r,injections:i,vertexInputs:a,varyings:o},s),Nr({modules:n,defines:r,injections:i,vertexInputs:a,varyings:o},s[t]);for(let e of Object.keys(o))if(a[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return{modules:n,defines:r,injections:i,vertexInputs:a,varyings:o}}function Mr(e=[],t=[]){let n=[...e],r=new Set(n.map(e=>e.name));for(let e of t)r.has(e.name)||(n.push(e),r.add(e.name));return n}function Nr(e,t){if(t){t.modules?.length&&e.modules.push(...t.modules),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){Pr(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.varyings||{})){Pr(n,`varying`);let t=Fr(n,r),i=e.varyings[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.varyings[n]=t}for(let n of t.injections||[])Ir(n.target),e.injections[n.target]||(e.injections[n.target]=[]),e.injections[n.target].push({injection:n.injection,order:n.order??0})}}function Pr(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function Fr(e,t){let{primitiveType:n}=m.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function Ir(e){if(!Ar.test(e))throw Error(`ShaderPlugin injection target "${e}" must be a named shader anchor or hook`)}var Lr=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,Rr=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function zr(e){return`${e.name}Uniforms`}function Br(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=zr(e);return Gr(n,t===`wgsl`?`wgsl`:`glsl`,r)}function Vr(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=Br(e,t);return r?{moduleName:e.name,uniformBlockName:zr(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:Jr(n,r)}:null}function Hr(e,t,n={}){let r=Vr(e,t);if(!r||r.matches)return r;let i=Yr(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&cr(!1,i),r}function Ur(e){let t=[],n=Xr(e);for(let e of n.matchAll(Rr)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function Wr(e,t,n,r){let i=Ur(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${Zr(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function Gr(e,t,n){let r=t===`wgsl`?Kr(e,n):qr(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(Lr);r&&i.push(r[1])}return i}function Kr(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function qr(e,t){return Ur(e).find(e=>e.blockName===t)?.body||null}function Jr(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Yr(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=Qr(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${$r(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${$r(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function Xr(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function Zr(e){return e.replace(/\s+/g,` `).trim()}function Qr(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function $r(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}function ei(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function ti(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=ai(e,ri),e;case`fragment`:return e=ai(e,ii),e;default:throw Error(t)}}var ni=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],ri=[...ni,[oi(`attribute`),`in $1`],[oi(`varying`),`out $1`]],ii=[...ni,[oi(`varying`),`in $1`]];function ai(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function oi(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}function si(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i];if(r+=`${n===`wgsl`?`fn`:`void`} ${a.signature} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function ci(e){let t={vertex:{},fragment:{}};for(let n of e){let e,r;typeof n==`string`?(e={},r=n):(e=n,r=e.hook),r=r.trim();let i=r.indexOf(`:`),a=r.slice(0,i),o=r.slice(i+1),s=r.replace(/\(.+/,``),c=Object.assign(e,{signature:o});switch(a){case`vs`:t.vertex[s]=c;break;case`fs`:t.fragment[s]=c;break;default:throw Error(a)}}return t}function li(e,t){return{name:ui(e,t),language:`glsl`,version:di(e)}}function ui(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function di(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}var fi=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${se}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${se}\\s*:\\s*([^;]+);`,`g`)];function pi(e,t=[]){let n=ie(e),r=new Map;for(let e of t)r.set(hi(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of fi){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===fi[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(hi(l,s,o));i.push(mi({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function mi(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:vi(e.resourceType),viewDimension:gi(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:gi(e.resourceType),sampleType:_i(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function hi(e,t,n){return`${t}:${n}:${e}`}function gi(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function _i(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function vi(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}var yi=`([a-zA-Z_][a-zA-Z0-9_]*)`,bi=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,xi=RegExp(`^\\s*\\#\\s*ifdef\\s*${yi}\\s*$`),Si=RegExp(`^\\s*\\#\\s*ifndef\\s*${yi}\\s*(?:\\/\\/.*)?$`),Ci=/^\s*\#\s*else\s*(?:\/\/.*)?$/,wi=/^\s*\#\s*endif\s*$/,Ti=RegExp(`^\\s*\\#\\s*ifdef\\s*${yi}\\s*(?:\\/\\/.*)?$`),Ei=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function Di(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(bi),o=e.match(Ti)||e.match(xi),s=e.match(Si),c=e.match(Ci),l=e.match(Ei)||e.match(wi);if(n){let e=Oi(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function Oi(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=n.match(RegExp(`^!\\s*${yi}$`));if(r)return!t[r[1]];let i=n.match(RegExp(`^${yi}$`));if(i)return!!t[i[1]];let a=n.match(RegExp(`^defined\\s*\\(\\s*${yi}\\s*\\)$`));if(a)return t[a[1]]!==void 0;let o=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${yi}\\s*\\)$`));if(o)return t[o[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function ki(e,t){let n=[];for(let[r,i]of Object.entries(t))Mi(e,r),n.push(`in ${ji(i)} ${r};`);return n.join(`
`)}function Ai(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=Ni(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Pi(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||zi(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=Bi(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function ji(e){let{primitiveType:t,components:n}=m.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function Mi(e,t){let n=Ui(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function Ni(e,t){let n=RegExp(`\\bfn\\s+${Ui(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=Vi(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Pi(e,t){let n=Fi(t),r=new Set(Ii(t)),i=Li(t);for(let t of i){let i=Ri(e,t);if(i!==null){n.push(...Fi(i));for(let e of Ii(i))r.add(e)}}return{locations:n,names:r}}function Fi(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function Ii(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Li(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Ri(e,t){let n=RegExp(`\\bstruct\\s+${Ui(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=Vi(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function zi(e,t){let n=Ui(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(Hi(e,i.index)===0)return!0;i=r.exec(e)}return!1}function Bi(e){let t=0;for(;e.has(t);)t++;return t}function Vi(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function Hi(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function Ui(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Wi(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){ua(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${ji(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${ca(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function Gi(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=Ki(a,t,`vertex`),s=qi(a,o),c=Ki(a,n,`fragment`),l=Ji(a,c),u=Yi(a,s),d=Yi(a,l.type),f=new Set([...aa(o.parameters),...aa(u.body),...aa(c.parameters),...aa(d.body)]),p=new Set([...ia(u.body),...ia(d.body)]),m=[],h=[],g=[],_=[];for(let[e,t]of i){if(f.has(e)||oa(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=sa(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;m.push(`  @location(${n})${r} ${e}: ${t.type},`),h.push(`var<private> ${e}: ${t.type};`),g.push(`${e} = ${la(t.type)};`),_.push(`${e} = ${l.name}.${e};`)}Zi(a,s,o.openBrace,o.closeBrace),a=Qi(a,s,o,i.map(([e])=>e)),o=Ki(a,t,`vertex`),a=$i(a,o,i.map(([e])=>e));let v=(s===l.type?[s]:[s,l.type]).map(e=>Yi(a,e).closeBrace).sort((e,t)=>t-e);for(let e of v)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=Ki(a,n,`fragment`),!RegExp(`\\b${pa(l.name)}\\s*:`).test(c.parameters))throw Error(`Unable to preserve WGSL fragment input "${l.name}"`);return{source:a,declarations:h.join(`
`),vertexInitialization:g.join(`
`),fragmentInitialization:_.join(`
`)}}function Ki(e,t,n){let r=RegExp(`\\bfn\\s+${pa(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin varyings require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=da(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=da(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function qi(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||Xi(e,r[1])===null)throw Error(`ShaderPlugin varyings require the WGSL vertex entry point to return a named struct`);return r[1]}function Ji(e,t){let n=[];for(let r of ra(t.parameters,`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&Xi(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length!==1)throw Error(`ShaderPlugin varyings require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]}function Yi(e,t){let n=Xi(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function Xi(e,t){let n=RegExp(`\\bstruct\\s+${pa(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=da(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function Zi(e,t,n,r){let i=RegExp(`\\b${pa(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function Qi(e,t,n,r){let i=RegExp(`\\b${pa(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=da(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function $i(e,t,n){let r=ea(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function ea(e,t,n){let r=[],i=t;for(;i<n;)if(i=na(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=ta(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function ta(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=na(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function na(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function ra(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function ia(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function aa(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function oa(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${pa(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(fa(e,r.index)===0)return!0;r=n.exec(e)}return!1}function sa(e){let t=0;for(;e.has(t);)t++;return t}function ca(e){let{primitiveType:t,components:n}=m.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${ji(e)}(${r})`}function la(e){let{primitiveType:t,components:n}=m.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function ua(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${pa(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function da(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function fa(e,t){let n=0;for(let r=0;r<t;r++){let i=na(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function pa(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var ma=`\n\n${_r}\n`,ha=100,ga=`precision highp float;
`;function _a(e){let t=Or(e.modules||[]),{source:n,bindingAssignments:r}=ya(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:xa(t),bindingAssignments:r,bindingTable:pi(n,r),shaderLayout:le(n,{vertexEntryPoint:e.vertexEntryPoint,scanVertexAttributes:e.scanVertexAttributes})}}function va(e){let{vs:t,fs:n}=e,r=Or(e.modules||[]);return{vs:ba(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:ba(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:xa(r)}}function ya(e,t){let{source:n,stage:r,modules:i,defines:a={},hookFunctions:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginVaryings:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;cr(typeof n==`string`,`shader source must be a string`);let m=Ai(Di(n,{defines:a}),d,l),h=Gi(m.source,d,f,u),g=h.source,_=``,v=ci(o),y={},b={},x={};Sa(c,y,b,x);for(let e in s){let t=typeof s[e]==`string`?{injection:s[e],order:0}:s[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[t]:x[e]=[t]:y[e]=[t]}else x[e]=[t]}Ca(m.declarations,m.initialization,b,x),wa(h,b,x);let S=i,C=ja(g),w=Aa(C.source),T=Fa(S,t._bindingRegistry,w,a),E=[];for(let e of S){p&&Er(e,g,p);let n=Ma(Di(ka(e,`wgsl`,p),{defines:a}),e,{usedBindingsByGroup:w,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:T});E.push(...n.bindingAssignments);let r=n.source;_+=r;let i=Ta(e);for(let e in i){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let n=t[2]===`decl`?b:x;n[e]=n[e]||[],n[e].push(i[e])}else y[e]=y[e]||[],y[e].push(i[e])}}return _+=ma,_=br(_,r,Ea(b),!1,`wgsl`,{vertex:d,fragment:f}),_+=Da(v,y),_+=Wa(E),_+=C.source,_=br(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),Ua(_),{source:_,bindingAssignments:E}}function ba(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},hookFunctions:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginVaryings:d={},prologue:f=!0,log:p}=t;cr(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?li(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${ei(e)}
${r===`fragment`?ga:``}

// ----- APPLICATION DEFINES -------------------------

${Oa(v)}

`:`${g}
`;break}let b=ci(s),x={},S={},C={};Sa(l,x,S,C);for(let e in c){let t=typeof c[e]==`string`?{injection:c[e],order:0}:c[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[t]:C[e]=[t]:x[e]=[t]}else C[e]=[t]}if(r===`vertex`){let e=ki(_,u);e&&(S[`vs:#decl`]=S[`vs:#decl`]||[],S[`vs:#decl`].push({injection:e,order:-(2**53-1)}))}let w=Wi(_,r,d);if(w.declarations){let e=r===`vertex`?`vs:#decl`:`fs:#decl`;S[e]=S[e]||[],S[e].push({injection:w.declarations,order:-(2**53-1)})}w.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:w.initialization,order:-(2**53-1)}));for(let e of a){p&&Er(e,_,p);let t=ka(e,r,p);y+=t;let n=e.instance?.normalizedInjections[r]||{};for(let e in n){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let r=t[2]===`decl`?S:C;r[e]=r[e]||[],r[e].push(n[e])}else x[e]=x[e]||[],x[e].push(n[e])}}return y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=ma,y=br(y,r,S),y+=si(b[r],x),y+=_,y=br(y,r,C),i===`glsl`&&m!==h&&(y=ti(y,r)),i===`glsl`&&Wr(y,r,p),y.trim()}function xa(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function Sa(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function Ca(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function wa(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function Ta(e){return{...e.instance?.normalizedInjections.vertex||{},...e.instance?.normalizedInjections.fragment||{}}}function Ea(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function Da(e,t){return si(e.vertex,t,`wgsl`)+si(e.fragment,t,`wgsl`)}function Oa(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}function ka(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:cr(!1)}if(!e.name)throw Error(`Shader module must have a name`);Hr(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}function Aa(e){let t=new Map;for(let n of ce(e,A)){let e=Number(n.bindingToken),r=Number(n.groupToken);Ra(r,e,n.name),Ba(t,r,e,`application binding "${n.name}"`)}return t}function ja(e){let t=ce(e,re),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);Ra(r,t,e.name),Ba(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=ue(e,re,e=>Pa(e,n,r));if(ee(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function Ma(e,t,n){let r=[],i={sawSupportedBindingDeclaration:ce(e,ae).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=ue(e,ae,e=>Na(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(ee(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function Na(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=Ga(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?Va(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return za(n.name,u,s,l),t!==void 0&&Ia(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(Ba(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);return za(n.name,u,d,l),Ba(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function Pa(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=Ha(s,t);return Ra(s,e,o),Ba(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function Fa(e,t,n,r){let i=new Map;if(!t)return i;for(let a of e)for(let e of La(a,r)){let r=Ga(e.group,a.name,e.name),o=t.get(r);if(o!==void 0){let t=i.get(e.group)||new Map,a=t.get(o);if(a&&a!==r)throw Error(`Duplicate WGSL binding reservation for modules "${a}" and "${r}": group ${e.group}, binding ${o}.`);Ba(n,e.group,o,`registered module binding "${r}"`),t.set(o,r),i.set(e.group,t)}}return i}function Ia(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return!0}function La(e,t){let n=[],r=Di(e.source||``,{defines:t});for(let e of ce(r,ae))n.push({name:e.name,group:Number(e.groupToken)});return n}function Ra(e,t,n){if(e===0&&t>=ha)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below ${ha}.`)}function za(e,t,n,r){if(t===0&&n<ha)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be ${ha} or higher.`)}function Ba(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function Va(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?ha:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function Ha(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function Ua(e){let t=oe(e,ae);if(!t)return;let n=Ka(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):qa(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${Ja(t.match)}".`)}function Wa(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function Ga(e,t,n){return`${e}:${t}:${n}`}function Ka(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function qa(e,t){let n=e.indexOf(ma);return n>=0?t>n:!0}function Ja(e){return e.replace(/\s+/g,` `).trim()}var Ya=class e{static defaultShaderAssemblers={};_hookFunctions=[];_defaultModules=[];static getDefaultShaderAssembler(t){return cr(t===`glsl`||t===`wgsl`),t===`wgsl`?(e.defaultShaderAssemblers.wgsl=e.defaultShaderAssemblers.wgsl||new Za,e.defaultShaderAssemblers.wgsl):(e.defaultShaderAssemblers.glsl=e.defaultShaderAssemblers.glsl||new Xa,e.defaultShaderAssemblers.glsl)}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderHook(e,t){t&&(e=Object.assign(t,{hook:e})),this._hookFunctions.push(e)}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,wr(t),t}},Xa=class extends Ya{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=this._hookFunctions;return{...va({...e,vs:e.vs,fs:e.fs,modules:t,hookFunctions:n}),modules:t}}},Za=class e extends Ya{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=this._hookFunctions,i=e.getShaderPreprocessorDefines(t,n),a=t.platformInfo.shaderLanguage===`wgsl`&&t.source?Di(t.source,{defines:i}):t.source,{source:o,getUniforms:s,bindingAssignments:c}=_a({...t,source:a,defines:i,_bindingRegistry:this._wgslBindingRegistry,modules:n,hookFunctions:r}),l=t.platformInfo.shaderLanguage===`wgsl`?Di(o,{defines:i}):o;return{source:l,getUniforms:s,modules:n,bindingAssignments:c,bindingTable:pi(l,c),shaderLayout:le(l,{vertexEntryPoint:t.vertexEntryPoint,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}};function Qa(e,t=!0){return e??t}function $a(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}var eo={props:{},uniforms:{},bindings:{},name:`skin`,bindingLayout:[{name:`skin`,group:0},{name:`skinJointMatrices`,group:0,visibility:1}],dependencies:[],source:`
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
#endif

fn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4<f32> {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
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
#endif

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
}

`,fs:``,defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:n,skinJointMatrices:r,scenegraphsFromGLTF:i,skinIndex:a=0,meshWorldMatrix:o}=e,s=r?{skinJointMatrices:r}:{};if(n)return{jointMatrix:to(n),...s};let c=i?.gltf?.skins?.[a];if(!c)return{jointMatrix:[],...s};let{inverseBindMatrices:l,joints:u,skeleton:d}=c,f=i.gltfNodeIndexToNodeMap,p=new Map,m=d===void 0?void 0:f?.get(d),h=m?[m]:i.scenes||[];for(let e of h)e.preorderTraversal((e,{worldMatrix:t})=>{p.set(e.id,t)});let g=o?new P(o).invert():null,_=new Float32Array(1024),v=l?.value;for(let e=0;e<Math.min(u.length,64);e++){let t=f?.get(u[e]);if(!t)continue;let n=p.get(t.id)||t.matrix,r=g?new P(g).multiplyRight(n):new P(n);v&&v.length>=(e+1)*16&&r.multiplyRight(new P(Array.from(v.slice(e*16,(e+1)*16)))),_.set(r,e*16)}return{jointMatrix:_,...s}},uniformTypes:{jointMatrix:[`mat4x4<f32>`,64]}};function to(e){let t=new Float32Array(1024);return t.set(e instanceof Float32Array?e.subarray(0,t.length):e.slice(0,t.length)),t}var no=`precision highp int;

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
`,ro=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,io=5,ao={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},io]},defaultUniforms:uo(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:ro,vs:no,fs:no,getUniforms:oo};function oo(e,t={}){if(e&&={...e},!e)return uo();e.lights&&(e={...e,...co(e.lights),lights:void 0});let{useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o}=e||{};if(!(r||i&&i.length>0||a&&a.length>0||o&&o.length>0))return{...uo(),enabled:0};let s={...uo(),...so({useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o})};return e.enabled!==void 0&&(s.enabled=e.enabled?1:0),s}function so({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=fo(),s=0,c=0,l=0,u=0;for(let t of n){if(s>=io)break;a[s]={...a[s],color:lo(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},s++,c++}for(let t of r){if(s>=io)break;a[s]={...a[s],color:lo(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:mo(t)},s++,l++}for(let t of i){if(s>=io)break;a[s]={...a[s],color:lo(t,e),direction:t.direction},s++,u++}return n.length+r.length+i.length>io&&o.warn(`MAX_LIGHTS exceeded, truncating to ${io}`)(),{ambientColor:lo(t,e),directionalLightCount:u,pointLightCount:c,spotLightCount:l,lights:a}}function co(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function lo(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return $a(n,Qa(t,!0)).map(e=>e*r)}function uo(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:fo()}}function fo(){return Array.from({length:io},()=>po())}function po(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function mo(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var ho=`#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,go=`#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`,_o={name:`ibl`,firstBindingSlot:32,bindingLayout:[{name:`pbr_diffuseEnvSampler`,group:2},{name:`pbr_specularEnvSampler`,group:2},{name:`pbr_brdfLUT`,group:2}],source:ho,vs:go,fs:go},vo=`out vec3 pbr_vPosition;
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
`,yo=`precision highp float;

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
`,bo=`struct PBRFragmentInputs {
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
`,xo=`layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,So={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:`pbrMaterial`,firstBindingSlot:0,bindingLayout:[{name:`pbrMaterial`,group:3},{name:`pbr_baseColorSampler`,group:3},{name:`pbr_normalSampler`,group:3},{name:`pbr_emissiveSampler`,group:3},{name:`pbr_metallicRoughnessSampler`,group:3},{name:`pbr_occlusionSampler`,group:3},{name:`pbr_specularColorSampler`,group:3},{name:`pbr_specularIntensitySampler`,group:3},{name:`pbr_transmissionSampler`,group:3},{name:`pbr_thicknessSampler`,group:3},{name:`pbr_clearcoatSampler`,group:3},{name:`pbr_clearcoatRoughnessSampler`,group:3},{name:`pbr_clearcoatNormalSampler`,group:3},{name:`pbr_sheenColorSampler`,group:3},{name:`pbr_sheenRoughnessSampler`,group:3},{name:`pbr_iridescenceSampler`,group:3},{name:`pbr_iridescenceThicknessSampler`,group:3},{name:`pbr_anisotropySampler`,group:3},{name:`pbr_bumpSampler`,group:3},{name:`pbr_diffuseTransmissionSampler`,group:3},{name:`pbr_diffuseTransmissionColorSampler`,group:3},{name:`pbr_multiscatterColorSampler`,group:3}],dependencies:[ao,_o,{name:`pbrProjection`,bindingLayout:[{name:`pbrProjection`,group:0}],source:`struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,vs:xo,fs:xo,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:`mat4x4<f32>`,modelMatrix:`mat4x4<f32>`,normalMatrix:`mat4x4<f32>`,camera:`vec3<f32>`}}],source:bo,vs:vo,fs:yo,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:`i32`,baseColorMapEnabled:`i32`,baseColorFactor:`vec4<f32>`,normalMapEnabled:`i32`,normalScale:`f32`,emissiveMapEnabled:`i32`,emissiveFactor:`vec3<f32>`,metallicRoughnessValues:`vec2<f32>`,metallicRoughnessMapEnabled:`i32`,occlusionMapEnabled:`i32`,occlusionStrength:`f32`,alphaCutoffEnabled:`i32`,alphaCutoff:`f32`,specularColorFactor:`vec3<f32>`,specularIntensityFactor:`f32`,specularColorMapEnabled:`i32`,specularIntensityMapEnabled:`i32`,ior:`f32`,transmissionFactor:`f32`,transmissionMapEnabled:`i32`,thicknessFactor:`f32`,attenuationDistance:`f32`,attenuationColor:`vec3<f32>`,clearcoatFactor:`f32`,clearcoatRoughnessFactor:`f32`,clearcoatMapEnabled:`i32`,clearcoatRoughnessMapEnabled:`i32`,sheenColorFactor:`vec3<f32>`,sheenRoughnessFactor:`f32`,sheenColorMapEnabled:`i32`,sheenRoughnessMapEnabled:`i32`,iridescenceFactor:`f32`,iridescenceIor:`f32`,iridescenceThicknessRange:`vec2<f32>`,iridescenceMapEnabled:`i32`,anisotropyStrength:`f32`,anisotropyRotation:`f32`,anisotropyDirection:`vec2<f32>`,anisotropyMapEnabled:`i32`,emissiveStrength:`f32`,dispersion:`f32`,IBLenabled:`i32`,scaleIBLAmbient:`vec2<f32>`,scaleDiffBaseMR:`vec4<f32>`,scaleFGDSpec:`vec4<f32>`,baseColorUVSet:`i32`,baseColorUVTransform:`mat3x3<f32>`,metallicRoughnessUVSet:`i32`,metallicRoughnessUVTransform:`mat3x3<f32>`,normalUVSet:`i32`,normalUVTransform:`mat3x3<f32>`,occlusionUVSet:`i32`,occlusionUVTransform:`mat3x3<f32>`,emissiveUVSet:`i32`,emissiveUVTransform:`mat3x3<f32>`,specularColorUVSet:`i32`,specularColorUVTransform:`mat3x3<f32>`,specularIntensityUVSet:`i32`,specularIntensityUVTransform:`mat3x3<f32>`,transmissionUVSet:`i32`,transmissionUVTransform:`mat3x3<f32>`,thicknessUVSet:`i32`,thicknessUVTransform:`mat3x3<f32>`,clearcoatUVSet:`i32`,clearcoatUVTransform:`mat3x3<f32>`,clearcoatRoughnessUVSet:`i32`,clearcoatRoughnessUVTransform:`mat3x3<f32>`,clearcoatNormalUVSet:`i32`,clearcoatNormalUVTransform:`mat3x3<f32>`,sheenColorUVSet:`i32`,sheenColorUVTransform:`mat3x3<f32>`,sheenRoughnessUVSet:`i32`,sheenRoughnessUVTransform:`mat3x3<f32>`,iridescenceUVSet:`i32`,iridescenceUVTransform:`mat3x3<f32>`,iridescenceThicknessUVSet:`i32`,iridescenceThicknessUVTransform:`mat3x3<f32>`,anisotropyUVSet:`i32`,anisotropyUVTransform:`mat3x3<f32>`,bumpFactor:`f32`,bumpMapEnabled:`i32`,diffuseTransmissionFactor:`f32`,diffuseTransmissionMapEnabled:`i32`,diffuseTransmissionColorFactor:`vec3<f32>`,diffuseTransmissionColorMapEnabled:`i32`,multiscatterColorFactor:`vec3<f32>`,multiscatterColorMapEnabled:`i32`,scatterAnisotropy:`f32`,bumpUVSet:`i32`,bumpUVTransform:`mat3x3<f32>`,diffuseTransmissionUVSet:`i32`,diffuseTransmissionUVTransform:`mat3x3<f32>`,diffuseTransmissionColorUVSet:`i32`,diffuseTransmissionColorUVTransform:`mat3x3<f32>`,multiscatterColorUVSet:`i32`,multiscatterColorUVTransform:`mat3x3<f32>`}},Co={NONE:0,REINHARD:1,KHRONOS_PBR_NEUTRAL:2,ACES:3},wo=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],To=`layout(std140) uniform pbrSceneUniforms {
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
`,Eo={name:`pbrScene`,bindingLayout:[{name:`pbrScene`,group:1},{name:`pbr_transmissionFramebufferSampler`,group:1}],source:`struct pbrSceneUniforms {
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
`,vs:To,fs:To,getUniforms:e=>e,uniformTypes:{exposure:`f32`,toneMapMode:`i32`,environmentIntensity:`f32`,environmentRotation:`f32`,environmentMipCount:`f32`,outputEncoding:`i32`,framebufferSize:`vec2<f32>`,viewMatrix:`mat4x4<f32>`,projectionMatrix:`mat4x4<f32>`},defaultUniforms:{exposure:1,toneMapMode:Co.KHRONOS_PBR_NEUTRAL,environmentIntensity:1,environmentRotation:Math.PI*.5,environmentMipCount:1,outputEncoding:1,framebufferSize:[1,1],viewMatrix:wo,projectionMatrix:wo}},Do=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||j(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&t.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function Oo(e,t){if(t instanceof Do)return t;let n=dt(t),r=ko(e,n),{attributes:i,bufferLayout:a}=Ao(e,n);return new Do({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function ko(e,n){if(!n.indices)return;let r=n.indices.value;return e.createBuffer({usage:t.INDEX,data:r})}function Ao(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout.find(e=>e.name===r)?.name||ct(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout,vertexCount:t.vertexCount}}function jo(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var Mo=`__debugFramebufferState`,No=8;function Po(e,t,n){if(e.device.type!==`webgl`)return;let r=Lo(e.device);if(!r.flushing){if(zo(e)){Fo(e,n,r);return}t&&Ro(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function Fo(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=Bo(t.top,No),l=Bo(t.left,No);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=Io({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+No}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function Io(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function Lo(e){return e.userData[Mo]||={flushing:!1,queuedFramebuffers:[]},e.userData[Mo]}function Ro(e){return`colorAttachments`in e}function zo(e){let t=e.props.framebuffer;return!t||t.handle===null}function Bo(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function Vo(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!Vo(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=Object.keys(e),i=Object.keys(t);if(r.length!==i.length)return!1;for(let i of r)if(!t.hasOwnProperty(i)||!Vo(e[i],t[i],n-1))return!1;return!0}return!1}var Ho=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return T(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function Uo(e,t){let n=y(e),r=t.slice();return r.sort((e,t)=>C(T(e).map(e=>n[e]))-C(T(t).map(e=>n[e]))),r}function Wo(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of Jo(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function Go(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?Zo(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:Xo(e.bindings,t.bindings)}:e:t}function Ko(e){return!!(e.uniformTypes&&!Yo(e.uniformTypes))}function qo(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function Jo(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function Yo(e){for(let t in e)return!1;return!0}function Xo(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function Zo(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}function Qo(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function $o(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:!1}function es(e){return Qo(e)||$o(e)}function ts(e){return es(e)||typeof e==`number`||typeof e==`boolean`}function ns(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||ts(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var rs=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=Or(Object.values(e).filter(ls));for(let t of n)e[t.name]=t;o.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&o.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},i=this.modules[n];if(!i)this.options.disableWarnings||o.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:a,bindings:o}=ns(i.getUniforms?.(r,e)||r,i.uniformTypes);this.moduleUniforms[n]=is(e,a,i.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=Or(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=is({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function is(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=as(e[i],a,n[i]));return r}function as(e,t,n){if(!n||typeof n==`string`)return os(t);if(Array.isArray(n)){if(ss(t)||!Array.isArray(t))return os(t);let r=Array.isArray(e)&&!ss(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=as(r[e],a,n[0]))}return i}if(!cs(t))return os(t);let r=n,i=cs(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=as(i[e],n,r[e]));return a}function os(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?ss(e)?e.slice():e.map(e=>e===void 0?void 0:os(e)):cs(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:os(t)])):e}function ss(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function cs(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function ls(e){return!!e?.dependencies}var us=t.DEBUG_DATA_MAX_LENGTH,F=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,n){let{debugData:r=!1,buffer:i,ownsBuffer:a=!0,...o}=n;if(i&&i.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(i&&(o.byteLength!==void 0||o.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let s=n.id||i?.id||j(`dynamic-buffer`),c={...o,id:s,usage:o.usage??i?.usage,indexType:o.indexType??i?.indexType};(c.usage||0)&t.INDEX&&!c.indexType&&(o.data instanceof Uint32Array?c.indexType=`uint32`:o.data instanceof Uint16Array?c.indexType=`uint16`:o.data instanceof Uint8Array&&(c.indexType=`uint8`)),delete c.data,delete c.byteOffset,this.device=e,this.id=s,this.props=c,this.usage=c.usage||0,this._debugDataEnabled=!!r,this._maxDebugDataByteLength=typeof r==`object`&&r.maxByteLength!==void 0?r.maxByteLength:us,this._ownsBuffer=a,this._buffer=i??this.device.createBuffer({...o,id:s}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),o.data&&this._writeDebugData(o.data,o.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}};function ds(e){return typeof e==`object`&&!!e&&`buffer`in e}function fs(e){return e instanceof F?e:ds(e)&&e.buffer instanceof F?e.buffer:null}function ps(e){return e instanceof F?e.buffer:e}function ms(e){return{buffer:ps(e.buffer),offset:e.offset,size:e.size}}function hs(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function gs(e){return e?.type===`texture`||e?.type===`external-texture`}function _s(e,t,n){let r=E(e,t,{ignoreWarnings:!0});return gs(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var vs=2,ys=1e4,bs=`render pipeline initialization failed`,xs=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],Ss=class e{static defaultProps={...g.defaultProps,source:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],geometry:null,indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,material:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:Ya.getDefaultShaderAssembler(`glsl`),debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;material=null;_uniformStore;_attributeInfos={};_gpuGeometry=null;props;_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_lastDrawTimestamp=-1;_bindingTable=[];get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){let r=e.defaultProps.shaderAssembler;this.props={...e.defaultProps,...n,shaderAssembler:n.shaderAssembler??(Cs(r,t.info.shadingLanguage)?r:Ya.getDefaultShaderAssembler(t.info.shadingLanguage))},n=this.props,this.id=n.id||j(`model`),this.device=t,Object.assign(this.userData,n.userData),this.material=n.material||null;let i=ks(t),a=jr(this.props.plugins,i.shaderLanguage),o=Mr(this.props.modules,a.modules),s=Object.fromEntries(o.map(e=>[e.name,e])),c=n.shaderInputs||new rs(s,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&a.modules.length>0&&c.addModules(a.modules),this.setShaderInputs(c);let l=qo(this.props.modules,c.getModules()),u={...a.defines,...this.props.defines};if(this.props.shaderLayout=Wo(this.props.shaderLayout,l)||null,this.device.type===`webgpu`&&this.props.source){let e=this.props.shaderAssembler;p(Cs(e,`wgsl`));let{source:n,getUniforms:r,bindingTable:o,shaderLayout:s}=e.assembleWGSLShader({platformInfo:i,...this.props,modules:l,defines:u,pluginInjections:a.injections,pluginVertexInputs:a.vertexInputs,pluginVaryings:a.varyings});this.source=n,this._getModuleUniforms=r,this._bindingTable=o;let c=ws(s??t.getShaderLayout?.(this.source),a.vertexInputs),d=Go(this.props.shaderLayout,c,Object.keys(a.vertexInputs));this.props.shaderLayout=Wo(d||null,l)||null}else{let e=this.props.shaderAssembler;p(Cs(e,`glsl`));let{vs:t,fs:n,getUniforms:r}=e.assembleGLSLShaderPair({platformInfo:i,...this.props,modules:l,defines:u,pluginInjections:a.injections,pluginVertexInputs:a.vertexInputs,pluginVaryings:a.varyings});this.vs=t,this.fs=n,this._getModuleUniforms=r,this._bindingTable=[]}this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,n.geometry&&this.setGeometry(n.geometry),this.pipelineFactory=n.pipelineFactory||we.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||Te.getDefaultShaderFactory(this.device),this.pipeline=this._updatePipeline(),this.vertexArray=t.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._gpuGeometry&&this._setGeometryAttributes(this._gpuGeometry),`isInstanced`in n&&(this.isInstanced=n.isInstanced),n.instanceCount&&this.setInstanceCount(n.instanceCount),n.vertexCount&&this.setVertexCount(n.vertexCount),n.indexBuffer&&this.setIndexBuffer(n.indexBuffer),n.attributes&&this.setAttributes(n.attributes),n.constantAttributes&&this.setConstantAttributes(n.constantAttributes),n.bindings&&this.setBindings(n.bindings),n.transformFeedback&&(this.transformFeedback=n.transformFeedback)}destroy(){this._destroyed||=(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs),this._uniformStore.destroy(),this._gpuGeometry?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.material?.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e){if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return o.info(vs,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return o.info(vs,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this.material?.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)o.info(vs,`>>> DRAWING ABORTED ${this.id}: ${bs}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)o.info(vs,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??a.byteLength/(a.indexType===`uint32`?4:2):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0?!0:e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=bs,this._drawBlockedReason=bs):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){this._gpuGeometry?.destroy();let t=e&&Oo(this.device,e);t&&(this.setTopology(t.topology||`triangle-list`),this.bufferLayout=new Ho(this.bufferLayout).mergeBufferLayouts(t.bufferLayout,this.bufferLayout),this.vertexArray&&this._setGeometryAttributes(t)),this._gpuGeometry=t}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){let t=new Ho(this.bufferLayout),n=this._gpuGeometry?t.mergeBufferLayouts(e,this._gpuGeometry.bufferLayout):e;Vo(n,this.bufferLayout,-1)||(this.bufferLayout=n,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline(),this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._gpuGeometry&&this._setGeometryAttributes(this._gpuGeometry))}setParameters(e){Vo(e,this.parameters,2)||(this.parameters=e,this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new Je(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Ko(t)&&!this.material?.ownsModule(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getNonMaterialBindings(this.shaderInputs.getBindingValues())),this.setNeedsRedraw(`shaderInputs`)}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){let t=e instanceof F?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof F?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&o.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=Uo(this.pipeline.shaderLayout,this.bufferLayout);let r=new Ho(this.bufferLayout);for(let[t,i]of Object.entries(e)){let e=i instanceof F?i.buffer:i,a=r.getBufferLayout(t);if(!a){n||o.warn(`Model(${this.id}): Missing layout for buffer "${t}".`)();continue}let s=r.getAttributeNamesForBuffer(a),c=!1;for(let t of s){let r=this._attributeInfos[t];if(r){let t=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(r.bufferName):r.location;if(t===null){n||o.warn(`Model(${this.id}): Missing vertex array slot for buffer "${r.bufferName}".`)();continue}this.vertexArray.setBuffer(t,e),i instanceof F?this._dynamicAttributeBufferSources[t]={source:i,generation:i.generation}:delete this._dynamicAttributeBufferSources[t],c=!0}}!c&&!n&&o.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${t}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||o.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(hs(e)&&!e.isReady)return e.id;for(let e of Object.values(this.material?.bindings||{}))if(hs(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=Ts(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=e.bindings.length?h(e,t):{0:t};if(!this.material)return n;for(let[t,r]of Object.entries(this.material.getBindingsByGroup(e))){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let n of Object.values(this.bindings))n instanceof b?e=Math.max(e,n.texture.updateTimestamp):n instanceof t||n instanceof v||n instanceof ne||n instanceof F?e=Math.max(e,n.updateTimestamp):hs(n)?e=n.isReady?Math.max(e,n.updateTimestamp):1/0:ds(n)&&(e=Math.max(e,(n.buffer instanceof F,n.buffer.updateTimestamp)));return Math.max(e,this.material?.getBindingsUpdateTimestamp()||0)}_setGeometryAttributes(e){let t={...e.attributes};for(let[e]of Object.entries(t))!this.pipeline.shaderLayout.attributes.find(t=>t.name===e)&&e!==`positions`&&delete t[e];this.vertexCount=e.vertexCount,this.setIndexBuffer(e.indices||null),this.setAttributes(e.attributes,{disableWarnings:!0}),this.setAttributes(t,{disableWarnings:this.props.disableWarnings}),this.setNeedsRedraw(`geometry attributes`)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){if(this._pipelineNeedsUpdate){let e=null,t=null;this.pipeline&&(o.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),e=this.pipeline.vs,t=this.pipeline.fs),this._pipelineNeedsUpdate=!1;let n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),r=null;this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.source||this.fs,debugShaders:this.props.debugShaders})),this.pipeline=this.pipelineFactory.createRenderPipeline({...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r}),this._attributeInfos=me(this.pipeline.shaderLayout,this.bufferLayout),e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=o.level>3?0:ys;o.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,o.group(vs,`>>> DRAWING MODEL ${this.id}`,{collapsed:o.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=jo(this.pipeline.shaderLayout,this.id);o.table(vs,e)();let t=this.shaderInputs.getDebugTable();o.table(vs,t)();let n=this._getAttributeDebugTable();o.table(vs,this._attributeInfos)(),o.table(vs,n)(),o.groupEnd(vs)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;Po(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,n){let i=r.getTypedArrayConstructor(n);return(e instanceof t?new i(e.debugData):e).toString()}_getNonMaterialBindings(e){if(!this.material)return e;let t={};for(let[n,r]of Object.entries(e))this.material.ownsBinding(n)||(t[n]=r);return t}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>Es(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??Ds(t?.depthStencilAttachment?.texture?.format);(!Vo(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function Cs(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function ws(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function Ts(e,t,n){if(hs(t)){let r=_s(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof F?t.buffer:ds(t)?ms(t):t}function Es(e){return e&&!Os(e)?e:null}function Ds(e){return e&&Os(e)?e:void 0}function Os(e){return xs.includes(e)}function ks(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var As=class{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let n=new rs(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=Ms(n),this._materialModuleNames=Ns(n)}createMaterial(e={}){return new Ps(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=js(e);return t?this._materialModuleNames.has(t):!1}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{3:e}:{}}};function js(e){return e.endsWith(`Uniforms`)?e.slice(0,-8):null}function Ms(e){let t=new Set;for(let n of Object.values(e.modules))for(let e of n.bindingLayout||[])e.group===3&&t.add(e.name);return t}function Ns(e){let t=new Set;for(let n of Object.values(e.modules))n.name&&n.bindingLayout?.some(e=>e.group===3&&e.name===n.name)&&t.add(n.name);return t}var Ps=class{id;device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||j(`material`),this.device=e,this.factory=t.factory||new As(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let n=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));this.shaderInputs=t.shaderInputs||new rs(n),this._uniformStore=new Je(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(this.ownsModule(e)&&Ko(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,n]of Object.entries(this.bindings))js(t)||(e[t]=n);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={},n=t;for(let[t,r]of Object.entries(this.bindings))if(hs(r)){let i=_s(e,t,{fallbackGroup:3}),a=i?r.resolveTextureBinding(i):null;a&&(n[t]=a)}else r instanceof F?n[t]=r.buffer:ds(r)?n[t]=ms(r):n[t]=r;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===3?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let n of Object.values(this.bindings))n instanceof b?e=Math.max(e,n.texture.updateTimestamp):n instanceof t||n instanceof v||n instanceof ne||n instanceof F?e=Math.max(e,n.updateTimestamp):hs(n)?e=n.isReady?Math.max(e,n.updateTimestamp):1/0:ds(n)&&(e=Math.max(e,(n.buffer instanceof F,n.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[n,r]of Object.entries(e))r!==void 0&&this.ownsBinding(n)&&this.bindings[n]!==r&&(this.bindings[n]=r,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[n,r]of Object.entries(this.bindings)){let i=Fs(r);i!==null&&(e[n]=i,this._dynamicResourceGenerations[n]!==i&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}};function Fs(e){return hs(e)?e.generation:fs(e)?.generation??null}var Is=`struct VertexInputs {
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
`,Ls=`#version 300 es
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
`,Rs=[-1,-1,1,-1,-1,1,1,1],zs=class extends Ss{constructor(e,t){let n=Rs.map(e=>e===-1?0:e);t.source&&(t={...t,source:`${Is}\n${t.source}`}),super(e,{id:t.id||j(`clip-space`),...t,vs:Ls,vertexCount:4,geometry:new st({topology:`triangle-strip`,vertexCount:4,attributes:{clipSpacePositions:{size:2,value:new Float32Array(Rs)},texCoords:{size:2,value:new Float32Array(n)},coordinates:{size:2,value:new Float32Array(n)}}})})}},Bs={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function Vs(e){return e?Array.isArray(e)?e[0]??null:e:null}function Hs(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=Vs(n);if(!e)return null;let{width:t}=Us(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=Vs(n);return e?Us(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=Vs(n[0]);return e?Us(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=Vs(t);return r?Us(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=Vs(e[t]);return r?Us(r):null}default:return null}}function Us(e){if(D(e))return n(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function Ws(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function Gs(e){return ArrayBuffer.isView(e)}function Ks(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function qs(e){let t=Bs[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function Js(e,t){return 6*e+qs(t)}function Ys(e){throw Error(`setTexture1DData not supported in WebGL.`)}function Xs(e){return Array.isArray(e)?e:[e]}function Zs(e,t,n,r){let i=Xs(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(D(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(Ws(t))o.push({type:`texture-data`,data:t,textureFormat:Ks(t),z:a,mipLevel:e});else if(Gs(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function Qs(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Zs(n,e[n]));return t}function $s(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Zs(n,e[n]));return t}function ec(e){let t=[];for(let[n,r]of Object.entries(e)){let e=qs(n);t.push(...Zs(e,r))}return t}function tc(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=Js(n,r);t.push(...Zs(e,i))}}),t}var nc=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=j(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?rc({...t,width:e.width,height:e.height,format:e.format}):[],r=`format`in e&&e.format!==void 0,i=`usage`in e&&e.usage!==void 0,a=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:Hs(t)||{width:this.props.width||1,height:this.props.height||1};if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let s=ic(this.device,n,a,{format:r?e.format:void 0}),c=s.format??this.props.format,l={...this.props,...a,format:c,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(c)&&!i&&(l.usage=v.SAMPLE|v.COPY_DST);let u=this.props.mipmaps&&!s.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(c);if(this.device.type===`webgpu`&&u){let e=this.props.dimension===`3d`?v.SAMPLE|v.STORAGE|v.COPY_DST|v.COPY_SRC:v.SAMPLE|v.RENDER|v.COPY_DST|v.COPY_SRC;l.usage|=e}let d=this.device.getMipLevelCount(l.width,l.height),f=s.hasExplicitMipChain?s.mipLevels:this.props.mipLevels===`auto`?d:Math.max(1,Math.min(d,this.props.mipLevels??1)),p={...l,mipLevels:f};this._texture=this.device.createTexture(p),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),s.subresources.length&&this._setTextureSubresources(s.subresources),this.props.mipmaps&&!s.hasExplicitMipChain&&!u&&o.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),u&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),o.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):o.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof _?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let n=e.width??this.texture.width,r=e.height??this.texture.height,i=e.depthOrArrayLayers??this.texture.depth,a=this.texture.computeMemoryLayout({width:n,height:r,depthOrArrayLayers:i}),o=this.device.createBuffer({byteLength:a.byteLength,usage:t.COPY_DST|t.MAP_READ});this.texture.readBuffer({...e,width:n,height:r,depthOrArrayLayers:i},o);let s=this.device.createFence();return await s.signaled,s.destroy(),o}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),o.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=Bs[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=Ys(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=Zs(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=Qs(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=$s(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=ec(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=tc(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await cc(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&o.warn(`${this} already destroyed`)}_checkReady(){this.isReady||o.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...v.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function rc(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return Ys(e.data);case`2d`:return Zs(0,e.data,t,n);case`3d`:return Qs(e.data);case`2d-array`:return $s(e.data);case`cube`:return ec(e.data);case`cube-array`:return tc(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function ic(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=oc(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=ac(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?sc(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=oc(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=ac(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function ac(e){if(e.type===`texture-data`)return e.textureFormat??Ks(e.data)}function oc(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function sc(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function cc(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(cc));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(cc)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}var lc={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},uc=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
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
`,dc=`#version 300 es
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
`,fc=class extends zs{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:uc,fs:dc,modules:[...t.modules||[],lc],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof nc?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:this.flipY?1:0}})}},pc=class extends st{constructor(e={}){let{id:t=j(`sphere-geometry`)}=e,{indices:n,attributes:r}=mc(e);super({...e,id:t,topology:`triangle-list`,indices:n,attributes:{...r,...e.attributes}})}};function mc(e){let{nlat:t=10,nlong:n=10}=e,r=Math.PI-0,i=2*Math.PI-0,a=(t+1)*(n+1),o=(t,n,r,i,a)=>e.radius||1,s=new Float32Array(a*3),c=new Float32Array(a*3),l=new Float32Array(a*2),u=new(a>65535?Uint32Array:Uint16Array)(t*n*6);for(let e=0;e<=t;e++)for(let a=0;a<=n;a++){let u=a/n,d=e/t,f=a+e*(n+1),p=f*2,m=f*3,h=i*u,g=r*d,_=Math.sin(h),v=Math.cos(h),y=Math.sin(g),b=Math.cos(g),x=v*y,S=b,C=_*y,w=o(x,S,C,u,d);s[m+0]=w*x,s[m+1]=w*S,s[m+2]=w*C,c[m+0]=x,c[m+1]=S,c[m+2]=C,l[p+0]=u,l[p+1]=1-d}let d=n+1;for(let e=0;e<n;e++)for(let n=0;n<t;n++){let r=(e*t+n)*6;u[r+0]=n*d+e,u[r+1]=n*d+e+1,u[r+2]=(n+1)*d+e,u[r+3]=(n+1)*d+e,u[r+4]=n*d+e+1,u[r+5]=(n+1)*d+e+1}return{indices:{size:1,value:u},attributes:{POSITION:{size:3,value:s},NORMAL:{size:3,value:c},TEXCOORD_0:{size:2,value:l}}}}var hc={x:[2,0,1],y:[0,1,2],z:[1,2,0]},gc=class extends st{constructor(e={}){let{id:t=j(`truncated-code-geometry`)}=e,{indices:n,attributes:r}=_c(e);super({...e,id:t,topology:`triangle-list`,indices:n,attributes:{POSITION:{size:3,value:r.POSITION},NORMAL:{size:3,value:r.NORMAL},TEXCOORD_0:{size:2,value:r.TEXCOORD_0},...e.attributes}})}};function _c(e={}){let{bottomRadius:t=0,topRadius:n=0,height:r=1,nradial:i=10,nvertical:a=10,verticalAxis:o=`y`,topCap:s=!1,bottomCap:c=!1}=e,l=(s?2:0)+(c?2:0),u=(i+1)*(a+1+l),d=Math.atan2(t-n,r),f=Math.sin,p=Math.cos,m=Math.PI,h=p(d),g=f(d),_=s?-2:0,v=a+(c?2:0),y=i+1,b=new Uint16Array(i*(a+l)*6),x=hc[o],S=new Float32Array(u*3),C=new Float32Array(u*3),w=new Float32Array(u*2),T=0,E=0;for(let e=_;e<=v;e++){let o=e/a,s=r*o,c;e<0?(s=0,o=1,c=t):e>a?(s=r,o=1,c=n):c=t+(n-t)*(e/a),(e===-2||e===a+2)&&(c=0,o=0),s-=r/2;for(let t=0;t<y;t++){let n=f(t*m*2/i),r=p(t*m*2/i);S[T+x[0]]=n*c,S[T+x[1]]=s,S[T+x[2]]=r*c,C[T+x[0]]=e<0||e>a?0:n*h,C[T+x[1]]=e<0?-1:e>a?1:g,C[T+x[2]]=e<0||e>a?0:r*h,w[E+0]=t/i,w[E+1]=o,E+=2,T+=3}}for(let e=0;e<a+l;e++)for(let t=0;t<i;t++){let n=(e*i+t)*6;b[n+0]=y*(e+0)+0+t,b[n+1]=y*(e+0)+1+t,b[n+2]=y*(e+1)+1+t,b[n+3]=y*(e+0)+0+t,b[n+4]=y*(e+1)+1+t,b[n+5]=y*(e+1)+0+t}return{indices:b,attributes:{POSITION:S,NORMAL:C,TEXCOORD_0:w}}}var vc=class extends gc{constructor(e={}){let{id:t=j(`cone-geometry`),radius:n=1,cap:r=!0}=e;super({...e,id:t,topRadius:0,topCap:!!r,bottomCap:!!r,bottomRadius:n})}};function yc(e,t){if(!e)throw Error(t)}var bc=class{id;matrix=new P;display=!0;position=new Qt;rotation=new Qt;scale=new Qt(1,1,1);userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||j(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return yc(e.length===3,`setPosition requires vector argument`),this.position=e,this}setRotation(e){return yc(e.length===3||e.length===4,`setRotation requires vector argument`),this.rotation=e,this}setScale(e){return yc(e.length===3,`setScale requires vector argument`),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:n,scale:r,update:i=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),r&&this.setScale(r),i&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),this.rotation.length===4){let e=new P().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:n}={}){return e&&this.setPosition(e),t&&this.setRotation(t),n&&this.setScale(n),this.updateMatrix(),this}getCoordinateUniforms(e,t){t||=this.matrix;let n=new P(e).multiplyRight(t),r=n.invert(),i=r.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:r,worldInverseTransposeMatrix:i}}_setScenegraphNodeProps(e){e.display!==void 0&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}};function xc(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function Sc(e,t,n){let r=new P(n);for(let n=0;n<8;n++){let i=new Qt(t[n&1?1:0][0],t[n&2?1:0][1],t[n&4?1:0][2]);r.transformAsPoint(i,i);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],i[t]),e[1][t]=Math.max(e[1][t],i[t])}}function Cc(e){return Number.isFinite(e[0][0])}var wc=class e extends bc{children;constructor(e={}){e=Array.isArray(e)?{children:e}:e;let{children:t=[]}=e;o.assert(t.every(e=>e instanceof bc),`every child must an instance of ScenegraphNode`),super(e),this.children=t}getBounds(){let e=xc();return this.traverse((t,{worldMatrix:n})=>{let r=t.getBounds();r&&Sc(e,r,new P(n).multiplyRight(t.matrix))}),Cc(e)?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,n=t.indexOf(e);return n>-1&&t.splice(n,1),this}removeAll(){return this.children=[],this}traverse(t,{worldMatrix:n=new P}={}){if(!this.display)return;let r=new P(n).multiplyRight(this.matrix);for(let n of this.children)n.display&&(n instanceof e?n.traverse(t,{worldMatrix:r}):t(n,{worldMatrix:r}))}traverseDepthSorted(e,{viewMatrix:t,worldMatrix:n=new P,order:r=`back-to-front`}){let i=new P(t),a=[];this.traverse((e,t)=>{let n=e.getBounds(),r=n?new Qt(n[0]).add(n[1]).divide([2,2,2]):new Qt,o=new P(t.worldMatrix).multiplyRight(e.matrix);o.transformAsPoint(r,r),i.transformAsPoint(r,r),a.push({node:e,context:{worldMatrix:o,bounds:n,depth:-r[2]},index:a.length})},{worldMatrix:new P(n)});let o=r===`back-to-front`?-1:1;a.sort((e,t)=>o*(e.context.depth-t.context.depth)||e.index-t.index);for(let{node:t,context:n}of a)e(t,n)}preorderTraversal(t,{worldMatrix:n=new P}={}){let r=new P(n).multiplyRight(this.matrix);t(this,{worldMatrix:r});for(let n of this.children)n instanceof e?n.preorderTraversal(t,{worldMatrix:r}):t(n,{worldMatrix:r})}},Tc=class extends gc{constructor(e={}){let{id:t=j(`cylinder-geometry`),radius:n=1}=e;super({...e,id:t,bottomRadius:n,topRadius:n})}},Ec=class extends st{constructor(e={}){let{id:t=j(`plane-geometry`)}=e,{indices:n,attributes:r}=Dc(e);super({...e,id:t,topology:`triangle-list`,indices:n,attributes:{...r,...e.attributes}})}};function Dc(e){let{type:t=`x,y`,offset:n=0,flipCull:r=!1,unpack:i=!1}=e,a=t.split(`,`),o=e[`${a[0]}len`]||1,s=e[`${a[1]}len`]||1,c=e[`n${a[0]}`]||1,l=e[`n${a[1]}`]||1,u=(c+1)*(l+1),d=new Float32Array(u*3),f=new Float32Array(u*3),p=new Float32Array(u*2);r&&(o=-o);let m=0,h=0;for(let e=0;e<=l;e++)for(let i=0;i<=c;i++){let a=i/c,u=e/l;switch(p[m+0]=r?1-a:a,p[m+1]=u,t){case`x,y`:d[h+0]=o*a-o*.5,d[h+1]=s*u-s*.5,d[h+2]=n,f[h+0]=0,f[h+1]=0,f[h+2]=r?1:-1;break;case`x,z`:d[h+0]=o*a-o*.5,d[h+1]=n,d[h+2]=s*u-s*.5,f[h+0]=0,f[h+1]=r?1:-1,f[h+2]=0;break;case`y,z`:d[h+0]=n,d[h+1]=o*a-o*.5,d[h+2]=s*u-s*.5,f[h+0]=r?1:-1,f[h+1]=0,f[h+2]=0;break;default:throw Error(`PlaneGeometry: unknown type`)}m+=2,h+=3}let g=c+1,_=new Uint16Array(c*l*6);for(let e=0;e<l;e++)for(let t=0;t<c;t++){let n=(e*c+t)*6;_[n+0]=(e+0)*g+t,_[n+1]=(e+1)*g+t,_[n+2]=(e+0)*g+t+1,_[n+3]=(e+1)*g+t,_[n+4]=(e+1)*g+t+1,_[n+5]=(e+0)*g+t+1}let v={indices:{size:1,value:_},attributes:{POSITION:{size:3,value:d},NORMAL:{size:3,value:f},TEXCOORD_0:{size:2,value:p}}};return i?ut(v):v}var Oc=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},kc=class extends Oc{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:v.SAMPLE|v.RENDER|v.COPY_SRC|v.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:v.SAMPLE|v.RENDER|v.COPY_SRC|v.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),Ac(this.current),t.destroy(),this.next=n.clone(e),Ac(this.next),n.destroy(),!0}};function Ac(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}var jc=2,Mc=1e4,I=class e{static defaultProps={...te.defaultProps,id:`unnamed`,handle:void 0,userData:{},source:``,modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:Ya.getDefaultShaderAssembler(`wgsl`),debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate=`newly created`;_getModuleUniforms;props;_destroyed=!1;constructor(t,n){if(t.type!==`webgpu`)throw Error(`Computation is only supported in WebGPU`);this.props={...e.defaultProps,...n},n=this.props,this.id=n.id||j(`model`),this.device=t,Object.assign(this.userData,n.userData);let r=Nc(t),i=jr(this.props.plugins,r.shaderLanguage);if(Object.keys(i.vertexInputs).length>0||Object.keys(i.varyings).length>0)throw Error(`Computation does not support ShaderPlugin vertex inputs or varyings`);let a=Mr(this.props.modules,i.modules),o=Object.fromEntries(a.map(e=>[e.name,e]));this.shaderInputs=n.shaderInputs||new rs(o),n.shaderInputs&&i.modules.length>0&&this.shaderInputs.addModules(i.modules),this.setShaderInputs(this.shaderInputs);let s=qo(this.props.modules,this.shaderInputs?.getModules()),c={...i.defines,...this.props.defines};this.props.shaderLayout=Wo(this.props.shaderLayout,s)||null,this.pipelineFactory=n.pipelineFactory||we.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||Te.getDefaultShaderFactory(this.device);let l=this.props.shaderAssembler;p(l instanceof Za);let{source:u,getUniforms:d,shaderLayout:f}=l.assembleWGSLShader({platformInfo:r,...this.props,modules:s,defines:c,scanVertexAttributes:!1,pluginInjections:i.injections});this.source=u,this._getModuleUniforms=d;let m=f??t.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=Wo(this.props.shaderLayout||m||null,s)||null,this.pipeline=this._updatePipeline(),n.bindings&&this.setBindings(n.bindings)}destroy(){this._destroyed||=(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._uniformStore.destroy(),!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new Je(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Ko(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(e=>{let n=t[e];return!es(n)&&typeof n!=`number`&&typeof n!=`boolean`}),r={};for(let e of n)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){if(this._pipelineNeedsUpdate){let e=null;this.pipeline&&(o.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),e=this.shader),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`compute`,source:this.source,debugShaders:this.props.debugShaders}),this.pipeline=this.pipelineFactory.createComputePipeline({...this.props,shader:this.shader}),e&&this.shaderFactory.release(e)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=o.level>3?0:Mc;o.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,o.group(jc,`>>> DRAWING MODEL ${this.id}`,{collapsed:o.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();o.table(jc,e)(),o.groupEnd(jc)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,n){let i=r.getTypedArrayConstructor(n);return(e instanceof t?new i(e.debugData):e).toString()}};function Nc(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}function Pc(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?Fc(e):Lc(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?Ic(n):Rc(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function Fc(e){return`\
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
`}function Ic(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function Lc(e){return`\
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
`}function Rc(e){return`\
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
`}var zc={name:`textureTransform`,source:`
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
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Bc=new Set([`original`,`previous`]),Vc=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(e,t){this.device=e;let n=Gc(t.shaderPasses);n.map(e=>Tr(e));let r=n.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=t.shaderInputs||new rs(r);let i=e.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new kc(e,{colorAttachments:[t.colorFormat||e.preferredColorFormat],width:i[0],height:i[1]}),this.textureModel=new fc(e,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:t.flipY??e.type===`webgpu`});let a=t.flipY??e.type===`webgpu`;this.passRenderers=t.shaderPasses.map(t=>new Hc(e,t,this.shaderInputs,a))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);if(!n)return!1;let r=this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:n}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});return this.textureModel.draw(i),i.end(),!0}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof nc&&!n.isReady)return null;let r=n instanceof nc?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=dl(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=ll(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?ul(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=ll(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=Qc(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:fl(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},Hc=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,Kc(t)){Yc(t.name,t.renderTargets||{}),this.renderTargets=$c(e,t.renderTargets||{}),qc(e,t)&&(this.computeRenderer=new Uc(e,t.compute,this.renderTargets,n)),this.subPassExecutions=(this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps).flatMap(e=>this.createStepExecutions(t,e,r));return}Jc(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();nl(this.renderTargets)}resize(e){rl(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=sl(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=ol(t),n=sl(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return Jc(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return Xc(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new Wc(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:Zc(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?ol(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},Uc=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,n,r,i){this.optimization=n,this.renderTargets=r,this.shaderInputs=i,this.parameterBuffer=e.createBuffer({id:`${n.name}-parameters`,byteLength:Math.max(Math.ceil(n.uniformNames.length/4)*16,16),usage:t.UNIFORM|t.COPY_DST});let a=Object.entries(n.outputs).map(([e,t],n)=>({name:e,type:`storage`,group:0,location:n+2,access:`write-only`,format:r[t].texture.format}));try{this.computation=new I(e,{id:n.name,source:n.source,shaderLayout:{bindings:[{name:n.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...a]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},Wc=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=Pc({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new zs(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[zc,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:this.flipY?1:0}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function Gc(e){return e.flatMap(e=>Kc(e)?e.steps.map(e=>e.shaderPass):[e])}function Kc(e){return`steps`in e}function qc(e,t){let n=t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function Jc(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use ShaderPassPipeline.renderTargets instead`)}function Yc(e,t){for(let n of Object.keys(t))if(Bc.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function Xc(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function Zc(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function Qc(e,t,n){return Zc(Zc(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function $c(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=cl(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!el(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!tl(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=il(e,i,a,n)}return r}function el(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function tl(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function nl(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function rl(e,t,n){for(let r of new Set(Object.values(t))){let t=cl(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=il(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function il(e,t,n,r){let i=cl(r,n.scale),{texture:a,framebuffer:o}=al(e,t,n,i),s,c;if(n.lifetime===`history`){let r=al(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function al(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:v.SAMPLE|v.RENDER|v.COPY_SRC|v.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?v.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function ol(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function sl(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function cl(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function ll(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function ul(e,t){return t===e.current?e.next:e.current}function dl(e,t){return ll(e.current)===t?e.next:e.current}function fl(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}var pl=`modulepreload`,ml=function(e,t){return new URL(e,t).href},hl={},gl=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=ml(t,n),t in hl)return;hl[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:pl,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},_l=`core-features-and-limits`,vl=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function yl(e){let t={};for(let n of vl){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function bl(e){return e.featureLevel??`core`}function xl(e){let t=bl(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function Sl(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(_l)&&r.push(_l);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function Cl(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(_l)?`core`:e===`best-available`?`compatibility`:e}var wl=new class extends ye{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){if(!navigator.gpu)throw Error(`WebGPU not available. Recent Chrome browsers should work.`);let t=bl(e),n=xl(e),r=await this.requestGPUAdapter(n);if(!r)throw Error(`Failed to request WebGPU adapter`);let i=r.info||await r.requestAdapterInfo?.(),a={},s=Sl(r.features,t,e.optionalFeatures);s.length>0&&(a.requiredFeatures=s),t===`max`&&(a.requiredLimits=yl(r.limits));let c=await r.requestDevice(a),{WebGPUDevice:l}=await gl(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-CaoTiL6w.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1,2,3]),import.meta.url),u=Cl(t,c.features),d={...e,featureLevel:u};o.groupCollapsed(1,`WebGPUDevice created`)();try{let e=new l(d,c,r,i);return o.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),o.table(1,e.info)(),e}finally{o.groupEnd(1)()}}async attach(e){throw Error(`WebGPUAdapter.attach() not implemented`)}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}},Tl={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:de.UNSIGNED_INT_24_8},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:de.HALF_FLOAT},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:de.FRAGMENT_SHADER_DERIVATIVE_HINT},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:de.MIN,MAX_EXT:de.MAX},EXT_shader_texture_lod:{}},El=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:de.COLOR_ATTACHMENT0,COLOR_ATTACHMENT1_WEBGL:de.COLOR_ATTACHMENT1,COLOR_ATTACHMENT2_WEBGL:de.COLOR_ATTACHMENT2,COLOR_ATTACHMENT3_WEBGL:de.COLOR_ATTACHMENT3}),Dl=e=>({VERTEX_ARRAY_BINDING_OES:de.VERTEX_ARRAY_BINDING,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),Ol=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function kl(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&Al(e),e}return this.originalGetContext(e,t)}}function Al(e){e.getExtension(`EXT_color_buffer_float`);let t={...Tl,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:El(e),OES_vertex_array_object:Dl(e),ANGLE_instanced_arrays:Ol(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var jl=1,Ml=class extends ye{type=`webgl`;enforceWebGL2(e){kl(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&e instanceof WebGLRenderingContext&&o.warn(`WebGL1 is not supported`,e)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await gl(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-BLqwiT6P.js`);return{WebGLDevice:e}},__vite__mapDeps([4,1,5,2]),import.meta.url);if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!Nl(e))throw Error(`Invalid WebGL2RenderingContext`);t=Fl(t),await Il(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(e={}){let{WebGLDevice:t}=await gl(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-BLqwiT6P.js`);return{WebGLDevice:e}},__vite__mapDeps([4,1,5,2]),import.meta.url);e=Fl(e),await Il(e);try{let n=new t(e);o.groupCollapsed(jl,`WebGLDevice ${n.id} created`)();let r=`\
${n._reused?`Reusing`:`Created`} device with WebGL2 ${n.props.debug?`debug `:``}context: \
${n.info.vendor}, ${n.info.renderer} for canvas: ${n.canvasContext.id}`;return o.probe(jl,r)(),o.table(jl,n.info)(),n}finally{o.groupEnd(jl)(),o.info(jl,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function Nl(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var Pl=new Ml;function Fl(e){return{...e,debug:e.debug??O.defaultProps.debug,debugWebGL:e.debugWebGL??O.defaultProps.debugWebGL,debugSpectorJS:e.debugSpectorJS??!!o.get(`debug-spectorjs`)}}async function Il(e){let t=[];(e.debugWebGL||e.debug)&&t.push(he()),e.debugSpectorJS&&t.push(pe(e));let n=await Promise.allSettled(t);for(let e of n)e.status===`rejected`&&o.error(`Failed to initialize debug libraries ${e.reason}`)()}var Ll=0,Rl=class{device;type;subtype;id;version=0;pendingParameters;committedParameters={};constructor(e,t,n,r={}){this.device=e,this.type=t,this.subtype=n,this.id=`${t}-${++Ll}`,this.pendingParameters={...r},this.commitParameters()}setParameter(e,t){return this.pendingParameters[e]=t,this}setParameters(e){return Object.assign(this.pendingParameters,e),this}unsetParameter(e){return delete this.pendingParameters[e],this}getParameter(e){return this.committedParameters[e]}getParameters(){return this.committedParameters}commitParameters(){let e=this.committedParameters;this.committedParameters={...this.pendingParameters},this.version++;let t=this.type===`instance`&&Reflect.get(e,`group`)!==Reflect.get(this.committedParameters,`group`);return this.device.recordSceneObjectCommit(this.type,this.id,t),this}},L=class extends Rl{constructor(e,t){super(e,`array`,`array1D`,t)}get data(){return this.getParameter(`data`)}get length(){return this.data.length}},zl=class extends Rl{constructor(e,t,n={}){super(e,`geometry`,t,n)}},Bl=class extends Rl{constructor(e,t,n={}){super(e,`material`,t,n)}},Vl=class extends Rl{constructor(e,t,n){super(e,`sampler`,t,n)}},Hl=class extends Rl{constructor(e,t){super(e,`surface`,`default`,t)}},Ul=class extends Rl{constructor(e,t={}){super(e,`group`,`default`,t)}},Wl=class extends Rl{constructor(e,t){super(e,`instance`,`transform`,t)}},Gl=class extends Rl{constructor(e,t={}){super(e,`world`,`default`,t)}},Kl=class extends Rl{constructor(e,t,n={}){super(e,`light`,t,n)}},ql=class extends Rl{constructor(e,t,n={}){super(e,`camera`,t,n)}},Jl=class extends Rl{constructor(e,t,n={}){super(e,`renderer`,t,n)}},Yl=class extends Rl{statistics={surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};constructor(e,t){super(e,`frame`,`default`,t)}render(){return this.statistics=this.device.renderFrame(this),this.statistics}destroy(){this.device.destroyFrame(this)}};function Xl(e){return new As(e,{modules:[So]})}function Zl(e,t={}){let n=t.factory||Xl(e),r={};for(let[e,i]of Object.entries(t.bindings||{}))i&&n.ownsBinding(e)&&(r[e]=i);let i=n.createMaterial({id:t.id,bindings:r});return i.setProps({pbrMaterial:{...Ql(r),...t.uniforms}}),i}function Ql(e){return{baseColorMapEnabled:!!e.pbr_baseColorSampler,normalMapEnabled:!!e.pbr_normalSampler,emissiveMapEnabled:!!e.pbr_emissiveSampler,metallicRoughnessMapEnabled:!!e.pbr_metallicRoughnessSampler,occlusionMapEnabled:!!e.pbr_occlusionSampler,specularColorMapEnabled:!!e.pbr_specularColorSampler,specularIntensityMapEnabled:!!e.pbr_specularIntensitySampler,transmissionMapEnabled:!!e.pbr_transmissionSampler,clearcoatMapEnabled:!!e.pbr_clearcoatSampler,clearcoatRoughnessMapEnabled:!!e.pbr_clearcoatRoughnessSampler,sheenColorMapEnabled:!!e.pbr_sheenColorSampler,sheenRoughnessMapEnabled:!!e.pbr_sheenRoughnessSampler,iridescenceMapEnabled:!!e.pbr_iridescenceSampler,anisotropyMapEnabled:!!e.pbr_anisotropySampler,bumpMapEnabled:!!e.pbr_bumpSampler,diffuseTransmissionMapEnabled:!!e.pbr_diffuseTransmissionSampler,diffuseTransmissionColorMapEnabled:!!e.pbr_diffuseTransmissionColorSampler,multiscatterColorMapEnabled:!!e.pbr_multiscatterColorSampler}}var $l=`
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
`,eu=`#version 300 es
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
`,tu=`#version 300 es
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
`;function nu(e,t){let n=[Eo,So,...t.modules||[]],r=n.filter((e,t)=>n.findIndex(t=>t.name===e.name)===t),i=ru(t.geometry);return(t.defines?.HAS_SKIN??i.HAS_SKIN)&&!r.some(e=>e.name===eo.name)&&r.push(eo),new Ss(e,{source:$l,vs:eu,fs:tu,...t,modules:r,defines:{...i,...iu(t.material.getResourceBindings()),...t.defines}})}function ru(e){let t=e&&`attributes`in e?e.attributes:{},n=t.COLOR_0||t.colors;return{HAS_NORMALS:!!(t.NORMAL||t.normals),HAS_TANGENTS:!!(t.TANGENT||t.tangents),HAS_UV:!!(t.TEXCOORD_0||t.texCoords),HAS_UV_1:!!(t.TEXCOORD_1||t.texCoords1),HAS_SKIN:!!(t.JOINTS_0&&t.WEIGHTS_0),HAS_COLORS:!!n,HAS_RGBA_COLORS:!!(n&&`size`in n&&n.size===4)}}function iu(e){return{HAS_BASECOLORMAP:!!e.pbr_baseColorSampler,HAS_NORMALMAP:!!e.pbr_normalSampler,HAS_EMISSIVEMAP:!!e.pbr_emissiveSampler,HAS_METALROUGHNESSMAP:!!e.pbr_metallicRoughnessSampler,HAS_OCCLUSIONMAP:!!e.pbr_occlusionSampler,HAS_SPECULARCOLORMAP:!!e.pbr_specularColorSampler,HAS_SPECULARINTENSITYMAP:!!e.pbr_specularIntensitySampler,HAS_TRANSMISSIONMAP:!!e.pbr_transmissionSampler,HAS_THICKNESSMAP:!!e.pbr_thicknessSampler,HAS_CLEARCOATMAP:!!e.pbr_clearcoatSampler,HAS_CLEARCOATROUGHNESSMAP:!!e.pbr_clearcoatRoughnessSampler,HAS_CLEARCOATNORMALMAP:!!e.pbr_clearcoatNormalSampler,HAS_SHEENCOLORMAP:!!e.pbr_sheenColorSampler,HAS_SHEENROUGHNESSMAP:!!e.pbr_sheenRoughnessSampler,HAS_IRIDESCENCEMAP:!!e.pbr_iridescenceSampler,HAS_IRIDESCENCETHICKNESSMAP:!!e.pbr_iridescenceThicknessSampler,HAS_ANISOTROPYMAP:!!e.pbr_anisotropySampler,HAS_BUMPMAP:!!e.pbr_bumpSampler,HAS_DIFFUSETRANSMISSIONMAP:!!e.pbr_diffuseTransmissionSampler,HAS_DIFFUSETRANSMISSIONCOLORMAP:!!e.pbr_diffuseTransmissionColorSampler,HAS_MULTISCATTERCOLORMAP:!!e.pbr_multiscatterColorSampler}}var au=new P,ou=class{device;materialFactory;frames=new Map;constructor(e){this.device=e,this.materialFactory=Xl(e)}render(e){let t=this.getTransmissionResources(e),n=e.background||[0,0,0,1];if(t){let r={...e,id:vu(e.id),surfaces:e.surfaces.filter(e=>!gu(e)&&cu(e.material)!==`BLEND`),framebuffer:t.framebuffer,exposure:1,toneMapMode:Co.NONE,outputColorSpace:`linear`,transmission:!1},i=this.prepareScene(r),a=this.device.beginRenderPass({id:`scene-${e.id}-transmission`,framebuffer:t.framebuffer,clearColor:[n[0],n[1],n[2],n[3]??1],clearDepth:1});this.drawPreparedScene(i,a),a.end()}else this.destroyFrame(vu(e.id));let r=this.prepareScene(e,t?.colorTexture),i=this.device.beginRenderPass({id:`scene-${e.id}`,framebuffer:e.framebuffer,clearColor:wu(this.device,e,n),clearDepth:1});return r.statistics.drawCount=this.drawPreparedScene(r,i),i.end(),r.statistics}destroyFrame(e){let t=this.frames.get(e);if(t){for(let e of t.surfaces.values())ku(e);Du(t.transmission),this.frames.delete(e),t.transmission&&this.destroyFrame(vu(e))}}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e)}prepareScene(e,t){let n=this.frames.get(e.id);n||(n={surfaces:new Map},this.frames.set(e.id,n));let r=new Set,i=[],a=0,o=0;for(let s of e.surfaces){if(s.transforms.length===0)continue;let c=gu(s)?t:void 0,l=this.getCompiledSurface(n,s,e,c);du(l,s.transforms),_u(s)&&l.model.shaderInputs.setProps({skin:s.skin}),su(l,s),l.material.setProps({pbrMaterial:{...Ql(s.material.bindings||{}),...s.material.uniforms,alphaCutoffEnabled:l.alphaMode===`MASK`,IBLenabled:mu(e.environment)}}),fu(l.model,e,c),l.model.predraw(this.device.commandEncoder),l.depth=Ou(s.transforms,e.camera.viewMatrix),r.add(s.id),i.push(l),a+=s.transforms.length,o+=l.triangleCount*s.transforms.length}for(let[e,t]of n.surfaces)r.has(e)||(ku(t),n.surfaces.delete(e));return i.sort((e,t)=>{let n=e.alphaMode===`BLEND`;return n===(t.alphaMode===`BLEND`)?!n&&e.transmissive!==t.transmissive?e.transmissive?1:-1:n?t.depth-e.depth:0:n?1:-1}),{surfaces:i,statistics:{surfaceCount:i.length,instanceCount:a,drawCount:0,triangleCount:o}}}drawPreparedScene(e,t){let n=0;for(let r of e.surfaces)r.model.draw(t)&&n++;return n}getSurfaceModelOptions(e,t){return{}}getCompiledSurface(e,n,r,i){let a=cu(n.material),o=lu(n,r,a,i),s=Object.entries(n.material.bindings||{}).filter(([,e])=>!!e),c=e.surfaces.get(n.id);if(c&&(c.source.geometry!==n.geometry||c.signature!==o||!uu(c.textureBindings,s))&&(ku(c),e.surfaces.delete(n.id),c=void 0),!c){let l=Zl(this.device,{id:n.material.id,uniforms:n.material.uniforms,bindings:n.material.bindings,factory:this.materialFactory}),u=[],d=[],f={},p=[];for(let e=0;e<4;e++){let r=new Float32Array(n.transforms.length*4),i=this.device.createBuffer({id:`${n.id}-instance-column-${e}`,data:r,usage:t.VERTEX|t.COPY_DST}),a=`instanceModelMatrixCol${e}`;f[a]=i,p.push({name:a,format:`float32x4`,stepMode:`instance`}),u.push(i),d.push(r)}let m=this.getSurfaceModelOptions(n,r),h=_u(n),g=nu(this.device,{id:`${n.id}-model`,geometry:n.geometry,topology:n.geometry.topology,material:l,attributes:f,bufferLayout:p,instanceCount:n.transforms.length,shaderInputs:new rs({pbrMaterial:So,pbrScene:Eo,...h?{skin:eo}:{}}),colorAttachmentFormats:r.framebuffer?.colorAttachments.map(e=>e.texture.format),parameters:{cullMode:n.material.doubleSided?`none`:`back`,depthWriteEnabled:a!==`BLEND`,depthCompare:`less-equal`,blend:a===`BLEND`,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`,...m.parameters},...m,defines:{HAS_INSTANCING:!0,USE_LIGHTS:!!r.lights?.length,USE_MATERIAL_EXTENSIONS:!0,ALPHA_CUTOFF:a===`MASK`,USE_IBL:mu(r.environment),USE_SCENE_ENVIRONMENT:mu(r.environment),USE_TEX_LOD:hu(r.environment),USE_TRANSMISSION_FRAMEBUFFER:!!i,USE_SCENE_COLOR_MANAGEMENT:!0,DEBUG_NORMALS:r.renderMode===`debugNormals`,DEBUG_DEPTH:r.renderMode===`debugDepth`,...n.material.defines,...m.defines,HAS_SKIN:h}});c={id:n.id,source:n,material:l,model:g,instanceBuffers:u,instanceColumns:d,signature:o,textureBindings:s,triangleCount:Math.floor((n.geometry.indices?.value.length||n.geometry.vertexCount)/3),alphaMode:a,transmissive:!!i,depth:0},e.surfaces.set(n.id,c)}return c.source=n,c}getTransmissionResources(e){let t=e.transmission!==!1&&(!e.renderMode||e.renderMode===`default`)&&e.surfaces.some(gu),n=this.frames.get(e.id);if(!t){n?.transmission&&(Du(n.transmission),n.transmission=void 0);return}n||(n={surfaces:new Map},this.frames.set(e.id,n));let[r,i]=Eu(this.device,e);if(n.transmission&&(n.transmission.colorTexture.width!==r||n.transmission.colorTexture.height!==i)&&(Du(n.transmission),n.transmission=void 0),!n.transmission){let t=this.device.createTexture({id:`scene-${e.id}-transmission-color`,width:r,height:i,format:yu(this.device),usage:v.SAMPLE|v.RENDER,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),a=this.device.createTexture({id:`scene-${e.id}-transmission-depth`,width:r,height:i,format:`depth24plus`,usage:v.RENDER}),o=this.device.createFramebuffer({id:`scene-${e.id}-transmission-framebuffer`,width:r,height:i,colorAttachments:[t],depthStencilAttachment:a});n.transmission={colorTexture:t,depthTexture:a,framebuffer:o}}return n.transmission}};function su(e,t){if(!t.morphTargets?.length)return;let n=t.morphWeights||[];e.morphWeights?.length===n.length&&e.morphWeights.every((e,t)=>e===n[t])||(vt(e.model,t.geometry,t.morphTargets,n),e.morphWeights=[...n])}function cu(e){return e.alphaMode?e.alphaMode:(e.uniforms?.baseColorFactor?.[3]??1)<1?`BLEND`:`OPAQUE`}function lu(e,t,n,r){return JSON.stringify({geometryVersion:e.geometryVersion,material:e.material.id,instanceCount:e.transforms.length,alphaMode:n,doubleSided:!!e.material.doubleSided,skin:_u(e),defines:Object.entries(e.material.defines||{}).sort(([e],[t])=>e.localeCompare(t)),environment:mu(t.environment),lights:!!t.lights?.length,environmentMipmapped:hu(t.environment),transmission:!!r,transmissionWidth:r?.width,transmissionHeight:r?.height,colorFormat:t.framebuffer?.colorAttachments[0]?.texture.format,renderMode:t.renderMode||`default`})}function uu(e,t){return e.length===t.length?e.every(([e,n])=>t.some(([t,r])=>e===t&&n===r)):!1}function du(e,t){for(let n=0;n<t.length;n++){let r=t[n];for(let t=0;t<4;t++)for(let i=0;i<4;i++)e.instanceColumns[t][n*4+i]=r[t*4+i]}for(let t=0;t<4;t++)e.instanceBuffers[t].write(e.instanceColumns[t])}function fu(e,t,n){let r=new P(t.camera.viewMatrix),i=new P(t.camera.projectionMatrix),a=t.framebuffer?.width||t.width||n?.width||1,o=t.framebuffer?.height||t.height||n?.height||1;e.shaderInputs.setProps({pbrProjection:{modelViewProjectionMatrix:new P(i).multiplyRight(r),modelMatrix:au,normalMatrix:au,camera:t.camera.position},pbrScene:{exposure:t.exposure??1,toneMapMode:Su(e.device,t),environmentIntensity:t.environment?.intensity??1,environmentRotation:t.environment?.rotation??0,environmentMipCount:t.environment?.specularTexture?.mipLevels??1,outputEncoding:Cu(e.device,t),framebufferSize:[a,o],viewMatrix:r,projectionMatrix:i,...n?{pbr_transmissionFramebufferSampler:n}:{}},lighting:{lights:pu(t.lights),useByteColors:!1},...mu(t.environment)?{ibl:{pbr_diffuseEnvSampler:t.environment.diffuseTexture,pbr_specularEnvSampler:t.environment.specularTexture,pbr_brdfLUT:t.environment.brdfLUTTexture}}:{}})}function pu(e=[]){let t=e.map(e=>e.type===`directional`?{...e,direction:[-e.direction[0],-e.direction[1],-e.direction[2]]}:e),n=t.filter(e=>e.type===`ambient`);if(n.length<=1)return t;let r=[0,0,0];for(let e of n){let t=e.color??[1,1,1],n=e.intensity??1;r[0]+=t[0]*n,r[1]+=t[1]*n,r[2]+=t[2]*n}return[{type:`ambient`,color:r,intensity:1},...t.filter(e=>e.type!==`ambient`)]}function mu(e){return!!(e?.diffuseTexture&&e.specularTexture&&e.brdfLUTTexture)}function hu(e){return mu(e)&&(e?.specularTexture?.mipLevels??1)>1}function gu(e){return(e.material.uniforms?.transmissionFactor??0)>0}function _u(e){return!!(e.skin?.jointMatrices?.length&&ru(e.geometry).HAS_SKIN)}function vu(e){return`${e}::linear-transmission-capture`}function yu(e){let t=e.getTextureFormatCapabilities(`rgba16float`);return t.render&&t.filter?`rgba16float`:`rgba8unorm`}function bu(e,t){return t.framebuffer?.colorAttachments[0]?.texture.format||e.preferredColorFormat}function xu(e){return!!(f.getInfo(e).dataType?.startsWith(`float`)||e.endsWith(`ufloat`))}function Su(e,t){return t.toneMapMode??(xu(bu(e,t))?Co.NONE:Co.KHRONOS_PBR_NEUTRAL)}function Cu(e,t){if(t.outputColorSpace)return t.outputColorSpace===`srgb`?1:0;let n=bu(e,t);return xu(n)||n.endsWith(`-srgb`)?0:1}function wu(e,t,n){let r=Math.max(t.exposure??1,0),i=[Math.max(n[0],0)*r,Math.max(n[1],0)*r,Math.max(n[2],0)*r];switch(Su(e,t)){case Co.REINHARD:i=i.map(e=>e/(1+e));break;case Co.KHRONOS_PBR_NEUTRAL:i=Tu(i);break;case Co.ACES:i=i.map(e=>Math.min(Math.max(e*(2.51*e+.03)/(e*(2.43*e+.59)+.14),0),1));break}return Cu(e,t)!==0&&(i=i.map(e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055)),[...i,n[3]??1]}function Tu(e){let t=Math.min(...e),n=t<.08?t-6.25*t*t:.04,r=e.map(e=>e-n),i=Math.max(...r),a=.76;if(i<a)return r;let o=1-a,s=1-o*o/(i+o-a),c=s/Math.max(i,1e-4),l=1-1/(.15*(i-s)+1);return r.map(e=>e*c*(1-l)+s*l)}function Eu(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function Du(e){e&&(e.framebuffer.destroy(),e.colorTexture.destroy(),e.depthTexture.destroy())}function Ou(e,t){let n=new P(t),r=0;for(let t of e){let e=n.transformAsPoint([t[12],t[13],t[14]]);r-=e[2]}return r/e.length}function ku(e){e.model.destroy(),e.material.destroy();for(let t of e.instanceBuffers)t.destroy()}var Au=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];function ju(e,t=64){if(!Number.isSafeInteger(t)||t<1)throw Error(`maxLightCount must be a positive safe integer.`);if(e.length>t)throw Error(`Point light count exceeds maxLightCount.`);let n=new Float32Array(t*8);for(let t=0;t<e.length;t++){let r=e[t];if(!(r.range>0)||!(r.intensity>=0))throw Error(`Point light range must be positive and intensity must be non-negative.`);let i=t*8;n.set(r.position,i),n[i+3]=r.range,n.set(r.color,i+4),n[i+7]=r.intensity}return n}var Mu={name:`deferredLighting`,source:`const DEFERRED_LIGHTING_PI: f32 = 3.141592653589793;
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
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0},{name:`baseColorMetallicTexture`,group:0},{name:`emissiveOcclusionTexture`,group:0},{name:`pointLights`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,ambientColor:`vec3<f32>`,exposure:`f32`,fogColor:`vec3<f32>`,fogDensity:`f32`,directionalLightDirectionView:`vec3<f32>`,directionalLightColor:`vec3<f32>`,directionalLightIntensity:`f32`,pointLightCount:`u32`},propTypes:{inverseProjectionMatrix:{value:Au,private:!0},ambientColor:{value:[.04,.04,.05],private:!0},exposure:{value:1,min:0,softMax:4},fogColor:{value:[.025,.035,.075],private:!0},fogDensity:{value:0,min:0,softMax:.01},directionalLightDirectionView:{value:[.3,.75,.55],private:!0},directionalLightColor:{value:[1,.95,.86],private:!0},directionalLightIntensity:{value:2.5,min:0,softMax:8},pointLightCount:{value:0,min:0,max:64}},passes:[{sampler:!0}]};function Nu(){return{name:`deferredLightingShaderPassPipeline`,steps:[{shaderPass:Mu,inputs:{sourceTexture:`previous`},output:`previous`}]}}var Pu={minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Fu={minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Iu=new Set([`color`,`normalRoughness`,`velocity`,`depth`]),Lu=new Set([`rgba8unorm`,`rgba8unorm-srgb`,`rgba8snorm`,`bgra8unorm`,`bgra8unorm-srgb`,`rgb10a2uint`,`rgb10a2unorm`,`rg11b10ufloat`]),Ru=0,zu=class{device;id;props;renderTargets;constructor(e,t){if(e.type!==`webgpu`)throw Error(`GBuffer requires a WebGPU device.`);this.device=e,this.id=t.id||Xu(`g-buffer`),this.props=Bu(this.id,t),Vu(e,this.props),this.renderTargets=qu(e,this.props)}get framebuffer(){return this.renderTargets.framebuffer}get colorTexture(){return this.renderTargets.colorTexture}get normalRoughnessTexture(){return this.renderTargets.normalRoughnessTexture}get velocityTexture(){let e=this.renderTargets.velocityTexture;if(!e)throw Error(`GBuffer velocity attachment is disabled.`);return e}get depthTexture(){return this.renderTargets.depthTexture}get width(){return this.renderTargets.framebuffer.width}get height(){return this.renderTargets.framebuffer.height}getShaderPassBindings(){return{depthTexture:this.depthTexture,normalTexture:this.normalRoughnessTexture,velocityTexture:this.velocityTexture}}getExtraColorTexture(e){let t=this.renderTargets.extraColorTextures.get(e);if(!t)throw Error(`GBuffer has no extra color attachment named "`+e+`".`);return t}resize(e){if(Wu(e.width,e.height),e.width===this.width&&e.height===this.height)return!1;let t=this.renderTargets;return this.renderTargets=qu(this.device,{...this.props,width:e.width,height:e.height}),Yu(t),!0}destroy(){Yu(this.renderTargets)}};function Bu(e,t){return{id:e,width:t.width,height:t.height,colorFormat:t.colorFormat||`rgba8unorm`,normalRoughnessFormat:t.normalRoughnessFormat||`rgba8unorm`,velocity:t.velocity??!0,velocityFormat:t.velocityFormat||`rg16float`,depthStencilFormat:t.depthStencilFormat||`depth24plus`,extraColorAttachments:t.extraColorAttachments||[]}}function Vu(e,t){Wu(t.width,t.height);let n=[t.colorFormat,t.normalRoughnessFormat,...t.velocity?[t.velocityFormat]:[],...t.extraColorAttachments.map(e=>e.format)],r=n.length;if(r>e.limits.maxColorAttachments)throw Error(`GBuffer requires `+r+` color attachments, but the device supports `+e.limits.maxColorAttachments+`.`);Gu(e,t.colorFormat,`color`),Gu(e,t.normalRoughnessFormat,`normalRoughness`),t.velocity&&Gu(e,t.velocityFormat,`velocity`),Ku(e,t.depthStencilFormat,`depth`);let i=new Set;for(let n of t.extraColorAttachments){if(!n.name)throw Error(`GBuffer extra color attachment name is required.`);if(Iu.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is reserved.`);if(i.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is duplicated.`);i.add(n.name),Gu(e,n.format,n.name)}let a=Hu(e,n);if(a>e.limits.maxColorAttachmentBytesPerSample)throw Error(`GBuffer color attachments require `+a+` bytes per sample, but the device supports `+e.limits.maxColorAttachmentBytesPerSample+`.`)}function Hu(e,t){let n=0;for(let r of t){let t=Uu(r);n=Math.ceil(n/t)*t;let i=e.getTextureFormatInfo(r).bytesPerPixel;n+=Lu.has(r)?8:i}return n}function Uu(e){return e.startsWith(`r8`)||e.startsWith(`rg8`)||e.startsWith(`rgba8`)||e.startsWith(`bgra8`)?1:e.startsWith(`r16`)||e.startsWith(`rg16`)||e.startsWith(`rgba16`)?2:4}function Wu(e,t){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<=0||t<=0)throw Error(`GBuffer size must use positive safe integer dimensions.`)}function Gu(e,t,n){if(!e.getTextureFormatCapabilities(t).render)throw Error(`GBuffer attachment "`+n+`" requires renderable format `+t+`.`)}function Ku(e,t,n){if(!e.getTextureFormatCapabilities(t).create)throw Error(`GBuffer attachment "`+n+`" requires supported format `+t+`.`)}function qu(e,t){let n=Ju(e,t,`color`,t.colorFormat),r=Ju(e,t,`normal-roughness`,t.normalRoughnessFormat),i=t.velocity?Ju(e,t,`velocity`,t.velocityFormat):void 0,a=new Map(t.extraColorAttachments.map(n=>[n.name,Ju(e,t,n.name,n.format,n.sampler)])),o=e.createTexture({id:t.id+`-depth`,format:t.depthStencilFormat,width:t.width,height:t.height,usage:v.SAMPLE|v.RENDER|v.COPY_DST,sampler:Fu});return{framebuffer:e.createFramebuffer({id:t.id+`-framebuffer`,width:t.width,height:t.height,colorAttachments:[n,r,...i?[i]:[],...a.values()],depthStencilAttachment:o}),colorTexture:n,normalRoughnessTexture:r,velocityTexture:i,depthTexture:o,extraColorTextures:a}}function Ju(e,t,n,r,i=Pu){return e.createTexture({id:t.id+`-`+n,format:r,width:t.width,height:t.height,usage:v.SAMPLE|v.RENDER|v.COPY_DST,sampler:i})}function Yu(e){e.framebuffer.destroy(),e.colorTexture.destroy(),e.normalRoughnessTexture.destroy(),e.velocityTexture?.destroy(),e.depthTexture.destroy();for(let t of e.extraColorTextures.values())t.destroy()}function Xu(e){return Ru+=1,e+`-`+Ru}var Zu=`
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
`,Qu=[`rgba16float`,`rgba8unorm`,`rgba8unorm`,`rgba16float`];function $u(e){if(e.renderMode&&e.renderMode!==`default`)return!1;let t=0,n=0;for(let r of e.lights||[])if(r.type===`spot`||r.type===`directional`&&++t>1||r.type===`point`&&++n>64)return!1;return e.environment?.diffuseTexture||e.environment?.specularTexture||e.environment?.brdfLUTTexture?!1:e.surfaces.every(e=>{let t=e.material.uniforms||{},n=e.material.bindings||{};return cu(e.material)!==`BLEND`&&!t.unlit&&!(t.transmissionFactor&&t.transmissionFactor>0)&&!(t.diffuseTransmissionFactor&&t.diffuseTransmissionFactor>0)&&!(t.multiscatterColorFactor||[]).some(e=>e>0)&&!t.bumpMapEnabled&&!n.pbr_bumpSampler&&!(t.thicknessFactor&&t.thicknessFactor>0)&&!(t.clearcoatFactor&&t.clearcoatFactor>0)&&!(t.iridescenceFactor&&t.iridescenceFactor>0)&&!(t.anisotropyStrength&&t.anisotropyStrength>0)&&!(t.sheenColorFactor||[]).some(e=>e>0)&&(t.ior===void 0||t.ior===1.5)&&(t.specularIntensityFactor===void 0||t.specularIntensityFactor===1)&&(t.specularColorFactor||[1,1,1]).every(e=>e===1)&&!t.specularColorMapEnabled&&!t.specularIntensityMapEnabled&&!n.pbr_specularColorSampler&&!n.pbr_specularIntensitySampler})}var ed=class extends ou{buffers=new Map;pointLightBuffer;lightingRenderer;forwardRenderer=null;lastDeferredFrameIdentifiers=new Set;constructor(e){if(e.type!==`webgpu`)throw Error(`Deferred scene rendering requires a WebGPU device.`);super(e),this.pointLightBuffer=e.createBuffer({id:`deferred-scene-point-lights`,data:ju([],64),usage:t.STORAGE|t.COPY_DST}),this.lightingRenderer=new Vc(e,{shaderPasses:[Nu()],colorFormat:`rgba16float`,flipY:!0})}render(e){if(!$u(e))return this.lastDeferredFrameIdentifiers.delete(e.id),this.forwardRenderer||=new ou(this.device),this.forwardRenderer.render(e);let[t,n]=td(this.device,e),r=this.getGBuffer(e.id,t,n);this.lastDeferredFrameIdentifiers.add(e.id);let i=this.prepareScene(e),a=e.background||[0,0,0,1],o=this.device.beginRenderPass({id:`scene-${e.id}-deferred-gbuffer`,framebuffer:r.framebuffer,clearColors:[new Float32Array([a[0],a[1],a[2],a[3]??1]),new Float32Array([.5,.5,1,1]),new Float32Array([0,0,0,0]),new Float32Array([0,0,0,0])],clearDepth:1});i.statistics.drawCount=this.drawPreparedScene(i,o),o.end();let s=nd(e.lights||[],new P(e.camera.viewMatrix));this.pointLightBuffer.write(ju(s.pointLights,64)),this.lightingRenderer.resize([t,n]);let c={sourceTexture:r.colorTexture,bindings:{depthTexture:r.depthTexture,normalTexture:r.normalRoughnessTexture,baseColorMetallicTexture:r.getExtraColorTexture(`baseColorMetallic`),emissiveOcclusionTexture:r.getExtraColorTexture(`emissiveOcclusion`),pointLights:this.pointLightBuffer},uniforms:{deferredLighting:{inverseProjectionMatrix:new P(e.camera.projectionMatrix).invert(),ambientColor:s.ambientColor,exposure:e.exposure??1,fogColor:e.fogColor||[0,0,0],fogDensity:e.fogDensity??0,directionalLightDirectionView:s.directionalLightDirectionView,directionalLightColor:s.directionalLightColor,directionalLightIntensity:s.directionalLightIntensity,pointLightCount:s.pointLights.length}}};if(e.framebuffer){let t=this.lightingRenderer.renderToTexture(c);if(t){let n=this.lightingRenderer.textureModel;n.setProps({backgroundTexture:t}),n.predraw(this.device.commandEncoder);let r=this.device.beginRenderPass({id:`scene-${e.id}-deferred-resolve`,framebuffer:e.framebuffer,clearDepth:!1});n.draw(r),r.end()}}else this.lightingRenderer.renderToScreen(c);return i.statistics}getLastDepthTexture(e){return this.lastDeferredFrameIdentifiers.has(e)&&this.buffers.get(e)?.depthTexture||null}destroyFrame(e){super.destroyFrame(e),this.forwardRenderer?.destroyFrame(e),this.buffers.get(e)?.destroy(),this.buffers.delete(e),this.lastDeferredFrameIdentifiers.delete(e)}destroy(){super.destroy(),this.forwardRenderer?.destroy();for(let e of this.buffers.values())e.destroy();this.buffers.clear(),this.lastDeferredFrameIdentifiers.clear(),this.lightingRenderer.destroy(),this.pointLightBuffer.destroy()}getSurfaceModelOptions(e,t){return{source:Zu,colorAttachmentFormats:Qu,depthStencilAttachmentFormat:`depth24plus`}}getGBuffer(e,t,n){let r=this.buffers.get(e);return r?r.resize({width:t,height:n}):(r=new zu(this.device,{id:`scene-${e}-deferred`,width:t,height:n,colorFormat:`rgba16float`,normalRoughnessFormat:`rgba8unorm`,velocity:!1,depthStencilFormat:`depth24plus`,extraColorAttachments:[{name:`baseColorMetallic`,format:`rgba8unorm`},{name:`emissiveOcclusion`,format:`rgba16float`}]}),this.buffers.set(e,r)),r}};function td(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function nd(e,t){let n=[0,0,0],r=[0,0,1],i=[1,1,1],a=[],o=0;for(let s of e){let e=rd(s.color||[1,1,1]),c=s.intensity??1;switch(s.type){case`ambient`:n[0]+=e[0]*c,n[1]+=e[1]*c,n[2]+=e[2]*c;break;case`directional`:{let n=t.transformAsVector(s.direction),a=Math.hypot(n[0],n[1],n[2])||1;r[0]=-n[0]/a,r[1]=-n[1]/a,r[2]=-n[2]/a,i[0]=e[0],i[1]=e[1],i[2]=e[2],o=c;break}case`point`:if(a.length<64){let n=t.transformAsPoint(s.position);a.push({position:[n[0],n[1],n[2]],range:Math.max(4,Math.sqrt(Math.max(c,0))*3),color:e,intensity:c})}break}}return{ambientColor:n,directionalLightDirectionView:r,directionalLightColor:i,directionalLightIntensity:o,pointLights:a}}function rd(e){let t=e[0]>1||e[1]>1||e[2]>1?1/255:1;return[e[0]*t,e[1]*t,e[2]*t]}var id=/^vertex-list<([^<>]+)>$/,ad=/^value-list<([^<>]+)>$/;function od(e){return id.test(e)}function sd(e){return ad.test(e)}function cd(e){let t=id.exec(e),n=ad.exec(e),r=t?.[1]??n?.[1]??e;try{i.getVertexFormatInfo(r)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return r}function ld(e){let t=cd(e),n=od(e),r=sd(e),a=i.getVertexFormatInfo(t),o=a.type,s=a.normalized,c=ud(o,s);return{format:e,elementFormat:t,vertexList:n,valueList:r,type:o,signedDataType:dd(t,o),primitiveType:c,components:a.components,byteLength:a.byteLength,integer:a.integer,signed:a.signed,normalized:s,...a.webglOnly?{webglOnly:!0}:{}}}function ud(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function dd(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function fd(e){let t=Td(e.nodes),n=Ad(t,e.buffers.values()),r=jd(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=Ld(c.map(e=>e.byteLength),`imported buffer capacities`),d=Ld(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=Id(u,d,`logical buffer capacities`),p=Ld(n.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=Ld(g.map(Fd),`imported texture estimates`),y=Ld(_.map(Fd),`logical transient texture estimates`),b=Id(v,y,`logical texture estimates`),x=Ld(r.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:n.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:r.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:Id(f,b,`logical resource estimates`),physicalTransientResourceBytes:Id(p,x,`physical transient resource estimates`)},w=pd(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:o,transientBuffers:i,transientTextures:a,bufferTransientAllocations:n,textureTransientAllocations:r,stats:C,preflight:w}}function pd(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,type:e.type,...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])gd(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,md(n.buffer).byteLength));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?Id(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function md(e){return`buffer`in e?e.buffer:e}function hd(e){return`texture`in e?e.texture:e}function gd(e){return`buffer`in e}function _d(e){return`texture`in e}function vd(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>gd(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||md(r.buffer)!==md(n.buffer)||!Sd(r.usage)&&!Sd(n.usage))continue;let a=yd(r.buffer),o=yd(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=md(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${bd(a)} and ${bd(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function yd(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function bd(e){return`${e.offset}–${e.offset+e.size} bytes`}function xd(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function Sd(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function Cd(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function wd(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function Td(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(gd(t)){let n=md(t.buffer);if(xd(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(Sd(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(_d(t)){let n=hd(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&Ed(n.resource,t)&&(Cd(t.usage)&&wd(n.resource.usage)||wd(t.usage)&&(Cd(n.resource.usage)||wd(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=new Map(e.map((e,t)=>[e.id,t])),s=new Map(Array.from(n,([e,t])=>[e,new Set(t)])),c=[];for(;s.size>0;){let e=Array.from(s).filter(([,e])=>e.size===0).map(([e])=>e).sort((e,t)=>o.get(e)-o.get(t));if(e.length===0)throw Error(`GPUCommandGraph contains a dependency cycle`);for(let n of e){c.push(t.get(n)),s.delete(n);for(let e of s.values())e.delete(n)}}return c}function Ed(e,t){if(hd(e.texture)!==hd(t.texture))return!1;let n=Dd(e.texture),r=Dd(t.texture);return Od(n.aspect,r.aspect)&&kd(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&kd(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function Dd(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function Od(e,t){return e===`all`||t===`all`||e===t}function kd(e,t,n,r){return e<n+r&&n<e+t}function Ad(e,t){let n=Md(e,e=>gd(e)?md(e.buffer):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{buffer:e,lifetime:t}of i){if(!t)continue;let n=r.filter(e=>e.lastUse<t.firstUse).sort((e,t)=>e.byteLength-t.byteLength)[0];n||(n={byteLength:0,usage:0,lastUse:-1,handles:[]},r.push(n)),n.byteLength=Math.max(n.byteLength,e.byteLength),n.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function jd(e,t){let n=Md(e,e=>_d(e)?hd(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&Pd(n.descriptor,e));n||(n={descriptor:Nd(e),byteLength:Fd(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function Md(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function Nd(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function Pd(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function Fd(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=Id(t,f.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function Id(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function Ld(e,t){return e.reduce((e,n)=>Id(e,n,t),0)}var Rd=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},zd=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},Bd=class{id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,this.data=e.data}},Vd=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},Hd=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},Ud=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}},Wd=4,Gd=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){Zd(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function Kd(e,t,n={}){Zd(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=qd();for(;s<a.length;){let r=Jd(n,a[s]);if(s>e&&Yd(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||Xd(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:Yd(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>Jd(e,t),qd());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function qd(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function Jd(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function Yd(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function Xd(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function Zd(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function Qd(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var $d=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length){this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let r=e.filter(e=>e.stats.condition?.outcome!==`skipped`),i=r.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,nodeCount:r.length,skippedNodeCount:e.length-r.length,computePassCount:n,coalescedComputeNodeCount:i-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>({...e,...t?{gpuTimeMilliseconds:await t.querySet.readTimestampDuration(t.beginIndex,t.endIndex)}:{}}))),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0);return{cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},ef=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;tableBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);cf(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){return this.assertMutable(),uf(e,this.device),t&&hf(t,e,this.device),this.addBuffer(new Rd(this,e,!1,t))}createTransientBuffer(e){return this.assertMutable(),uf(e,this.device),this.addBuffer(new Rd(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=ld(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return mf(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new zd(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(od(n)||sd(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new Bd({id:e,name:t.name,format:n,length:t.length,valueLength:t.valueLength,stride:t.stride,byteStride:t.byteStride,rowByteLength:t.rowByteLength,data:r})}importTexture(e,t){this.assertMutable();let n=ff(e,this.device);return t&&gf(t,n,this.device),this.addTexture(new Vd(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=ff(e,this.device);return this.addTexture(new Vd(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),df(e,this.device),this.addExternalTexture(new Hd(this,e))}createTransientTexture(e){this.assertMutable();let t=ff(e,this.device);return this.addTexture(new Vd(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new Ud(e,pf(e,t))}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),cf(this.device,`compilation`),this.compiled=!0,new tf(fd({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*Wd>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>gd(e)&&md(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(gd(t)){let e=md(t.buffer);this.assertBuffer(e),vf(e,t.usage)}else if(_d(t)){let e=hd(t.texture);this.assertTexture(e),yf(e,t.usage),bf(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}vd(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=nf(t.buffer),r=this.tableBufferHandles.get(n);return r||(r=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),this.tableBufferHandles.set(n,r)),this.createDataView(r,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},tf=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(gd(t)){let e=md(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(_d(t)){let e=hd(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=sf(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return Kd(this.preflight,e,t)}createExecution(e,t={}){return new Gd({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(cf(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=lf(),a=this.resolveImportedBuffers(t.buffers??{});af(t.frameTextures??{},t.externalTextures??{});let o=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),s=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of o.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of s.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of s.textures.values())this.consumedExternalTextures.add(e);let c=o.textures,l=e=>{let t=md(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},u=e=>{let t=hd(e),n=t.transient?this.transientTextures.get(t):c.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},d=e=>{let t=u(e);if(e instanceof Vd||Cf(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},f={commandEncoder:e,parameters:t.parameters,getBuffer:l,getTexture:u,getTextureView:d,getExternalTexture:e=>{let t=s.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},p=[],m,h=0,g=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,_=()=>{let e=m;m=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=lf();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){p.push({stats:{id:n.id,type:n.type,cpuEncodeTimeMilliseconds:lf()-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{m||(m=e.beginComputePass({id:n.id}),h++);let t=m;o=of(t),o&&(g=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?Qd(t,l(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...f,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}g||_();break}case`render`:{_();let t=r,i=t.getRenderPassProps?.(f)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,d):void 0,s=n.attachments?.resolveTargets?.map(e=>e?d(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=of(c),c.pushDebugGroup(n.id);try{t.encode({...f,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:_(),r.encode(f);break}p.push({stats:{id:n.id,type:n.type,cpuEncodeTimeMilliseconds:lf()-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{_()}return new $d(p,lf()-i,h)}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);hf(a,i,this.device);let o=nf(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);gf(e.texture,a,this.device),n.set(a,rf(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);gf(o,a,this.device),n.set(a,rf(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);_f(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function nf(e){return e instanceof F?e.buffer:e}function rf(e){if(e instanceof nc){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function af(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function of(e){let{timestampQuerySet:t,beginTimestampIndex:n,endTimestampIndex:r}=e.props;return t&&Number.isSafeInteger(n)&&Number.isSafeInteger(r)&&n>=0&&r>n?{querySet:t,beginIndex:n,endIndex:r}:void 0}function sf(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function cf(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function lf(){return globalThis.performance?.now()??Date.now()}function uf(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function df(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function ff(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,r))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function pf(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function mf(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function hf(e,t,n){let r=nf(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function gf(e,t,n){let r=rf(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function _f(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function vf(e,t){let n=xf(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function yf(e,t){let n=Sf(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function bf(e,t){if(e instanceof Ud&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function xf(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return t.STORAGE;case`uniform`:return t.UNIFORM;case`copy-source`:return t.COPY_SRC;case`copy-destination`:return t.COPY_DST;case`indirect`:return t.INDIRECT;case`vertex`:return t.VERTEX;case`index`:return t.INDEX}}function Sf(e){switch(e){case`sampled`:return v.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return v.STORAGE;case`render-attachment`:return v.RENDER;case`copy-source`:return v.COPY_SRC;case`copy-destination`:return v.COPY_DST}}function Cf(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var wf=class{device;id;textures;previousIndex=0;destroyed=!1;constructor(e,t){this.device=e,this.id=t.id??`gpu-texture-history`;let n=e.createTexture({...t,id:`${this.id}-previous`});try{this.textures=[n,e.createTexture({...t,id:`${this.id}-current`})]}catch(e){throw n.destroy(),e}}get previousTexture(){return this.assertAvailable(),this.textures[this.previousIndex]}get currentTexture(){return this.assertAvailable(),this.textures[1-this.previousIndex]}getBindings(e,t){if(this.assertAvailable(),e===t)throw Error(`GPUTextureHistory previous and current identifiers must differ`);return{[e]:this.previousTexture,[t]:this.currentTexture}}advance(){this.assertAvailable(),this.previousIndex=1-this.previousIndex}reset(){this.assertAvailable(),this.previousIndex=0}destroy(){this.destroyed||(this.destroyed=!0,this.textures[0].destroy(),this.textures[1].destroy())}assertAvailable(){if(this.destroyed)throw Error(`GPUTextureHistory has been destroyed`)}},Tf=Uint32Array.BYTES_PER_ELEMENT,Ef=256;function Df(e,t,n){let r=ld(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%Tf!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function Of(e,t){Df(e,[`uint32`],t)}function R(e,t){let n=kf(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function kf(e){let t=Math.floor(e.byteOffset/Ef)*Ef,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function z(e){if(e.byteOffset%Tf!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%Ef/Tf}function B(e,n,r,i,a=t.STORAGE){if(!Number.isSafeInteger(i)||i<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((a&t.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(od(r)||sd(r))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let o=ld(r),s=e.createTransientBuffer({id:n,byteLength:Math.max(i,1)*o.byteLength,usage:a});return e.createDataView(s,{format:r,length:i})}function Af(e,t,n){if(e.length!==t.length||e.data.length!==t.data.length||e.data.some((e,n)=>e.length!==t.data[n].length))throw Error(`${n} must preserve the same chunk topology`)}var jf=4294967295,Mf=4294967296;function Nf(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>jf)throw Error(`${e} element count must be a non-negative uint32`);Ff(e,n);let i=Math.floor(r);if(!Number.isSafeInteger(i)||i<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let a=Math.max(1,Math.ceil(t/n)),o=Math.min(a,i),s=Math.min(Math.ceil(a/o),i),c=Math.ceil(a/o/s);if(c>i)throw Error(`${e} requires ${a} workgroups, exceeding the 3D dispatch limit of ${i} per dimension`);return{x:o,y:s,z:c}}function Pf(e,t){Ff(`GPU dispatch`,t);let n=Math.floor(jf/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function Ff(e,t){if(!Number.isSafeInteger(t)||t<2||t>jf||Mf%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function If(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var V=256,Lf=64;function Rf(e,t=!1){return t?`portable`:If(e,{requiresSubgroupId:!0})}var zf=class{id;input;output;mode;segmentFlags;constructor(e){this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,Wf(this.input,`${this.id} input`),Wf(this.output,`${this.id} output`);let t=this.input instanceof Bd;if(t!==this.output instanceof Bd)throw Error(`${this.id} input and output must both be data views or vector views`);if(this.input instanceof Bd&&this.output instanceof Bd)Af(this.input,this.output,`${this.id} output`);else if(this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.segmentFlags){if(Wf(this.segmentFlags,`${this.id} segmentFlags`),t!==this.segmentFlags instanceof Bd)throw Error(`${this.id} input and segmentFlags must both be data views or vector views`);if(this.input instanceof Bd&&this.segmentFlags instanceof Bd)Af(this.input,this.segmentFlags,`${this.id} segmentFlags`);else if(this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);let e=new Set(Gf(this.output).map(e=>e.buffer));if(Gf(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}addToGraph(e){Bf(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function Bf(e,t,n){Kf(t,e.input,e.id),Kf(t,e.output,e.id),e.segmentFlags&&Kf(t,e.segmentFlags,e.id),Vf(t,{id:e.id,input:e.input,output:e.output,mode:e.mode,segmentFlags:e.segmentFlags},n)}function Vf(e,t,n){let r=Gf(t.input),i=Gf(t.output),a=t.segmentFlags?Gf(t.segmentFlags):void 0,o=r.map((e,t)=>({chunkIndex:t,input:e,output:i[t],segmentFlags:a?.[t]})).filter(e=>e.input.length>0);if(o.length===0)return;let s=t.input instanceof Bd;if(o.length===1){let r=o[0];Hf(e,{id:s?`${t.id}-chunk-${r.chunkIndex}`:t.id,input:r.input,output:r.output,mode:t.mode,segmentFlags:r.segmentFlags,maxComputeWorkgroupsPerDimension:n});return}let c=B(e,`${t.id}-chunk-totals`,`uint32`,o.length),l=B(e,`${t.id}-chunk-offsets`,`uint32`,o.length),u=t.segmentFlags?B(e,`${t.id}-chunk-segment-flags`,`uint32`,o.length):void 0,d=t.segmentFlags?o.map(n=>B(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[r,i]of o.entries())Hf(e,{id:`${t.id}-chunk-${i.chunkIndex}`,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,outputSegmentPrefixes:d?.[r],finalSum:Uf(e,c,r),finalSegmentFlag:u?Uf(e,u,r):void 0,maxComputeWorkgroupsPerDimension:n});Hf(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n});for(let[r,i]of o.entries())Xf(e,{id:`${t.id}-chunk-${i.chunkIndex}-add-carry`,output:i.output,offsets:l,length:i.output.length,offsetIndex:r,segmentPrefixes:d?.[r],dispatchLayout:Zf(i.output.length,n)})}function Hf(e,t){if(t.input.length===0)return;let n=[],r=t.input,i=t.output,a=t.segmentFlags,o=t.input.length,s=0;for(;;){let c=Math.ceil(o/V),l,u;c>1&&(l=B(e,`${t.id}-level-${s}-block-sums`,`uint32`,c),a&&(u=B(e,`${t.id}-level-${s}-block-segment-flags`,`uint32`,c)));let d=a?s===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:c>1||s>0?B(e,`${t.id}-level-${s}-segment-prefixes`,`uint32`,o):void 0:void 0;if(qf(e,{id:`${t.id}-level-${s}-scan`,input:r,output:i,mode:s===0?t.mode:`exclusive`,segmentFlags:a,segmentSummaryInput:!!a&&(s>0||t.segmentSummaryInput),segmentPrefixes:d,blockSums:l,blockSegmentFlags:u,finalSum:l?void 0:t.finalSum,finalSegmentFlag:l?void 0:t.finalSegmentFlag,length:o,blockCount:c,dispatchLayout:Zf(o,t.maxComputeWorkgroupsPerDimension)}),n.push({output:i,length:o,segmentPrefixes:d}),!l)break;let f=B(e,`${t.id}-level-${s}-block-offsets`,`uint32`,c);n[n.length-1].blockOffsets=f,r=l,i=f,a=u,o=c,s++}for(let r=n.length-2;r>=0;r--){let i=n[r],a=n[r+1];Xf(e,{id:`${t.id}-level-${r}-add-offsets`,output:i.output,offsets:i.blockOffsets,length:i.length,segmentPrefixes:i.segmentPrefixes,offsetSegmentPrefixes:a.segmentPrefixes,dispatchLayout:Zf(i.length,t.maxComputeWorkgroupsPerDimension)})}}function Uf(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function Wf(e,t){let n=e instanceof Bd?e.data:[e];for(let e of n)Of(e,t)}function Gf(e){return e instanceof Bd?e.data:[e]}function Kf(e,t,n){if((t instanceof Bd?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function qf(e,t){let n=t.blockSums??t.finalSum,r=t.blockSegmentFlags??t.finalSegmentFlag,i=n?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,a=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,o=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,s=r?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,c=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,l=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,u=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,d=t.segmentFlags?`if (lane >= stride) {
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
const INPUT_OFFSET: u32 = ${z(t.input)}u;
const OUTPUT_OFFSET: u32 = ${z(t.output)}u;
${n?`const SUM_OFFSET: u32 = ${z(n)}u;`:``}
${t.segmentFlags?`const SEGMENT_FLAGS_OFFSET: u32 = ${z(t.segmentFlags)}u;`:``}
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${z(t.segmentPrefixes)}u;`:``}
${r?`const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${z(r)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${i}
${a}
${o}
${s}
var<workgroup> scratch: array<u32, ${V}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${V}>;`:``}

@compute @workgroup_size(${V}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Qf(t.dispatchLayout)}
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

  for (var stride = 1u; stride < ${V}u; stride = stride * 2u) {
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

  if (lane == ${V-1}u) {
    ${c}
    ${l}
  }
  if (index < ELEMENT_COUNT) {
    ${p}
    ${m}
  }
}`,g=Jf(e,!!t.segmentFlags,t.length),_=g===`subgroups`?Yf(t,n,i):h;e.addComputePass({id:t.id,workload:{operation:`GPUScan`,variant:g,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*V,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...n?[{buffer:n,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...r?[{buffer:r,usage:`storage-write`}]:[]],compile:({device:e})=>{let i=new I(e,{id:t.id,source:_,shaderLayout:{bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...n?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...r?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]}});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:R(t.input,a),outputValues:R(t.output,a)};n&&(o.sumValues=R(n,a)),t.segmentFlags&&(o.segmentFlags=R(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=R(t.segmentPrefixes,a)),r&&(o.summarySegmentFlags=R(r,a)),i.setBindings(o),i.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>i.destroy()}}})}function Jf(e,t,n){let r=Rf(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||Rf(e.device,!1)===`subgroups`}]}).variant}function Yf(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/V)+1;return`
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${e.length}u;
const BLOCK_COUNT: u32 = ${e.blockCount}u;
const INPUT_OFFSET: u32 = ${z(e.input)}u;
const OUTPUT_OFFSET: u32 = ${z(e.output)}u;
${t?`const SUM_OFFSET: u32 = ${z(t)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${n}
var<workgroup> subgroupOffsets: array<u32, ${Lf}>;

@compute @workgroup_size(${V}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${V}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${V}u / subgroupSize;
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
  if (lane == ${V-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function Xf(e,t){let n=t.offsetIndex===void 0?`index / ${V}u`:`${t.offsetIndex}u`,r=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${z(t.output)}u;
const OFFSETS_OFFSET: u32 = ${z(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${z(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${z(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${V}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Qf(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${n}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${n}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`;e.addComputePass({id:t.id,workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*V,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new I(e,{id:t.id,source:r,shaderLayout:{bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]}});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:R(t.output,r),offsets:R(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=R(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=R(t.offsetSegmentPrefixes,r)),n.setBindings(i),n.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>n.destroy()}}})}function Zf(e,t){return Nf(`GPUScan`,e,V,t)}function Qf(e){return Pf(e,V)}var $f=256,ep=4294967295,tp=4294967295,np=class{id;keys;values;outputKeys;outputValues;segments;direction;constructor(e){this.id=e.id??`gpu-segmented-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.direction=e.direction??`ascending`;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])Of(t,`${this.id} ${e}`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(this.outputKeys.buffer===this.outputValues.buffer||this.outputKeys.buffer===this.keys.buffer||this.outputKeys.buffer===this.values.buffer||this.outputValues.buffer===this.keys.buffer||this.outputValues.buffer===this.values.buffer)throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>ip(this,e,t)),ap(this.segments,`outputKeysOffset`,`${this.id} output keys`),ap(this.segments,`outputValuesOffset`,`${this.id} output values`)}addToGraph(e){rp(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function rp(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);let r=op(e.segments),i=Array.from(r,([t,r])=>({width:t,segments:r,dispatchLayout:Nf(`${e.id} ${t}-wide segments`,r.length*t,t,n)}));for(let n of i)sp(t,e,n.width,n.segments,n.dispatchLayout)}function ip(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isInteger(t.length)||t.length<0||t.length>$f)throw Error(`${r} length must be an integer from 0 to ${$f}`);for(let[n,i]of[[`keysOffset`,e.keys],[`valuesOffset`,e.values],[`outputKeysOffset`,e.outputKeys],[`outputValuesOffset`,e.outputValues]]){let e=t[n];if(!Number.isSafeInteger(e)||e<0||e>tp)throw Error(`${r} ${n} must be a non-negative uint32`);if(e>i.length||t.length>i.length-e)throw Error(`${r} ${n} and length exceed the parent view`)}return{keysOffset:t.keysOffset,valuesOffset:t.valuesOffset,outputKeysOffset:t.outputKeysOffset,outputValuesOffset:t.outputValuesOffset,length:t.length}}function ap(e,t,n){let r=e.filter(e=>e.length>0).slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+i.length)throw Error(`${n} segments must not overlap`)}}function op(e){let t=new Map;for(let n of e){if(n.length===0)continue;let e=2;for(;e<n.length;)e*=2;let r=t.get(e);r?r.push(n):t.set(e,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function sp(e,t,n,r,i){let a=r.map(e=>`  SortSegment(${e.keysOffset}u, ${e.valuesOffset}u, ${e.outputKeysOffset}u, ${e.outputValuesOffset}u, ${e.length}u)`).join(`,
`),o=t.direction===`descending`,s=If(e.device,{requiresSubgroupId:!0})===`subgroups`,c=`
${s?`enable subgroups;
requires subgroup_id;`:``}
struct SortSegment {
  keysOffset: u32,
  valuesOffset: u32,
  outputKeysOffset: u32,
  outputValuesOffset: u32,
  length: u32,
};

const INVALID_INDEX: u32 = ${ep}u;
const SEGMENT_COUNT: u32 = ${r.length}u;
const KEYS_OFFSET: u32 = ${z(t.keys)}u;
const VALUES_OFFSET: u32 = ${z(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${z(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${z(t.outputValues)}u;
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
${s?lp(n):cp(n)}
}`,l=`${t.id}-bitonic-local-${n}`,u={keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues};e.addComputePass({id:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],compile:({device:e})=>{let t=new I(e,{id:l,source:c,shaderLayout:{bindings:Object.keys(u).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(u))r[e]=R(t,n);t.setBindings(r),t.dispatch(e,i.x,i.y,i.z)},destroy:()=>t.destroy()}}})}function cp(e){return`
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
  }`}function lp(e){return`
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
  }`}var up=256,dp=256,fp=4,pp=dp/32,mp=4294967295,hp=2147483648,gp=up,_p=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])Of(t,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>hp)throw Error(`${this.id} supports at most ${hp} rows`);yp(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=gp?`bitonic`:`radix`:this.algorithm}addToGraph(e){vp(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function vp(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);if(e.keys.length===0)return;if(e.keys.length===1){bp(t,e);return}let r=Nf(`GPUSort`,e.keys.length,dp,n);e.resolvedAlgorithm===`bitonic`?xp(t,e,r,n):Op(t,e,r,n)}function yp(e){if(e.outputKeys.buffer===e.outputValues.buffer||e.outputKeys.buffer===e.keys.buffer||e.outputKeys.buffer===e.values.buffer||e.outputValues.buffer===e.keys.buffer||e.outputValues.buffer===e.values.buffer)throw Error(`${e.id} outputs must use separate buffers from inputs and each other`)}function bp(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${z(n)}u;
const VALUES_OFFSET: u32 = ${z(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${z(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${z(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${dp}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Pf(a,dp)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;Np(e,{id:`${t.id}-${i}`,source:o,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})}function xp(e,t,n,r){let i=jp(t.keys.length);if(i<=up){Sp(e,t,i);return}let a=Nf(`GPUSort bitonic`,i,up,r),o=B(e,`${t.id}-bitonic-indices-a`,`uint32`,i),s=B(e,`${t.id}-bitonic-indices-b`,`uint32`,i);Tp(e,t,o,i,a);let c=o,l=s;for(let n of Mp(i))Ep(e,t,c,l,i,n,a),[c,l]=[l,c];Dp(e,t,c,n)}function Sp(e,t,n){let r=t.direction===`descending`,i=If(e.device,{requiresSubgroupId:!0})===`subgroups`,a=`
${i?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${mp}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${n}u;
const KEYS_OFFSET: u32 = ${z(t.keys)}u;
const VALUES_OFFSET: u32 = ${z(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${z(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${z(t.outputValues)}u;
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
${i?wp():Cp()}
}`;Np(e,{id:`${t.id}-bitonic-local`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})}function Cp(){return`
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
  }`}function wp(){return`
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
  }`}function Tp(e,t,n,r,i){let a=`
const INVALID_INDEX: u32 = ${mp}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${z(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${up}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Pf(i,up)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;Np(e,{id:`${t.id}-bitonic-initialize`,source:a,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})}function Ep(e,t,n,r,i,a,o){let s=t.direction===`descending`,c=`
const INVALID_INDEX: u32 = ${mp}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${i}u;
const BLOCK_WIDTH: u32 = ${a.blockWidth}u;
const COMPARE_STRIDE: u32 = ${a.compareStride}u;
const KEYS_OFFSET: u32 = ${z(t.keys)}u;
const INDICES_IN_OFFSET: u32 = ${z(n)}u;
const INDICES_OUT_OFFSET: u32 = ${z(r)}u;
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

@compute @workgroup_size(${up}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Pf(o,up)}
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
}`;Np(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:c,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})}function Dp(e,t,n,r){let i=`
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${z(t.keys)}u;
const VALUES_OFFSET: u32 = ${z(t.values)}u;
const INDICES_OFFSET: u32 = ${z(n)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${z(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${z(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${up}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Pf(r,up)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;Np(e,{id:`${t.id}-bitonic-gather`,source:i,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})}function Op(e,t,n,r){let i=Math.ceil(t.keyBits/fp),a=Math.ceil(t.keys.length/dp),o=i>1?B(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,s=i>1?B(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,c=t.keys,l=t.values;for(let u=0;u<i;u++){let d=u*fp,f=Math.min(fp,t.keyBits-d),p=2**f,m=B(e,`${t.id}-radix-digit-${d}-histogram`,`uint32`,p*a),h=B(e,`${t.id}-radix-digit-${d}-offsets`,`uint32`,p*a),g=(i-u)%2==1,_=g?t.outputKeys:o,v=g?t.outputValues:s;if(!_||!v)throw Error(`${t.id} radix scratch is missing`);kp(e,t,c,m,d,f,a,n),Bf(new zf({id:`${t.id}-radix-digit-${d}-scan`,input:m,output:h}),e,r),Ap(e,t,c,l,h,_,v,d,f,a,n),c=_,l=v}}function kp(e,t,n,r,i,a,o,s){let c=2**a,l=t.direction===`descending`,u=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${i}u;
const BUCKET_COUNT: u32 = ${c}u;
const DIGIT_MASK: u32 = ${c-1}u;
const WORKGROUP_COUNT: u32 = ${o}u;
const KEYS_OFFSET: u32 = ${z(n)}u;
const HISTOGRAM_OFFSET: u32 = ${z(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${c}>;

@compute @workgroup_size(${dp}) fn main(
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

  let index = workgroupIndex * ${dp}u + localInvocationIndex;
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
}`;Np(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:u,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})}function Ap(e,t,n,r,i,a,o,s,c,l,u){let d=2**c,f=t.direction===`descending`,p=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${d-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${pp}u;
const MASK_COUNT: u32 = ${d*pp}u;
const KEYS_OFFSET: u32 = ${z(n)}u;
const VALUES_OFFSET: u32 = ${z(r)}u;
const OFFSETS_OFFSET: u32 = ${z(i)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${z(a)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${z(o)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${d*pp}>;

@compute @workgroup_size(${dp}) fn main(
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

  let index = workgroupIndex * ${dp}u + localInvocationIndex;
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
}`;Np(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:p,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})}function jp(e){let t=1;for(;t<e;)t*=2;return t}function Mp(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function Np(e,t){e.addComputePass({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new I(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=R(n,r);n.setBindings(i),n.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>n.destroy()}}})}var Pp=256,Fp=128,Ip=64,Lp=4294967295,Rp=class{id;strategy;resolvedStrategy;minima;maxima;sourceIds;leafCapacity;nodeMinima;nodeMaxima;nodeChildren;leafIds;count;overflow;dimension;nodeCount;internalNodeCount;levelCount;rootNode=0;topology=`complete-binary`;updatePolicy=`refit`;stats;constructor(e){if(this.id=e.id??`gpu-bvh`,this.strategy=e.strategy??`auto`,this.minima=e.minima,this.maxima=e.maxima,this.sourceIds=e.sourceIds,this.leafCapacity=e.leafCapacity,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.count=e.count,this.overflow=e.overflow,this.dimension=this.minima.format===`float32x2`?2:3,this.minima.length>Lp)throw Error(`${this.id} source row count exceeds uint32 range`);if(!Number.isSafeInteger(this.leafCapacity)||!Gp(this.leafCapacity))throw Error(`${this.id} leafCapacity must be a positive power of two`);if(![`auto`,`fused`,`level`].includes(this.strategy))throw Error(`${this.id} strategy must be auto, fused, or level`);let t=this.minima.buffer.graph.device.limits,n=this.leafCapacity<=Fp&&this.leafCapacity<=t.maxComputeInvocationsPerWorkgroup&&this.leafCapacity<=t.maxComputeWorkgroupSizeX&&this.leafCapacity*Ip<=t.maxComputeWorkgroupStorageSize;if(this.strategy===`fused`&&!n)throw Error(`${this.id} fused strategy exceeds portable single-workgroup limits`);if(this.resolvedStrategy=this.strategy===`level`||!n?`level`:`fused`,this.nodeCount=this.leafCapacity*2-1,this.internalNodeCount=this.leafCapacity-1,this.levelCount=Math.log2(this.leafCapacity)+1,!Number.isSafeInteger(this.nodeCount)||this.nodeCount>Lp)throw Error(`${this.id} node count exceeds uint32 range`);if(Df(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),Df(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),Df(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),Df(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),Df(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),Of(this.leafIds,`${this.id} leafIds`),Of(this.count,`${this.id} count`),Of(this.overflow,`${this.id} overflow`),this.sourceIds&&Of(this.sourceIds,`${this.id} sourceIds`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.sourceIds&&this.sourceIds.length!==this.minima.length)throw Error(`${this.id} sourceIds.length must equal bounds length`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeCount||this.nodeMaxima.length!==this.nodeCount)throw Error(`${this.id} node bounds must match source format and node count`);if(this.nodeChildren.length!==this.nodeCount)throw Error(`${this.id} nodeChildren.length must equal node count`);if(this.leafIds.length!==this.leafCapacity)throw Error(`${this.id} leafIds.length must equal leafCapacity`);if(this.count.length<1||this.overflow.length<1)throw Error(`${this.id} count and overflow must each contain one uint32 row`);let r=ld(this.minima.format).byteLength;this.stats={dimension:this.dimension,leafCapacity:this.leafCapacity,internalNodeCount:this.internalNodeCount,nodeCount:this.nodeCount,levelCount:this.levelCount,outputByteLength:this.nodeCount*(r*2+Uint32Array.BYTES_PER_ELEMENT*2)+this.leafCapacity*Uint32Array.BYTES_PER_ELEMENT+Uint32Array.BYTES_PER_ELEMENT*2}}addToGraph(e){if([this.minima,this.maxima,...this.sourceIds?[this.sourceIds]:[],this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.count,this.overflow].some(t=>t.buffer.graph!==e))throw Error(`${this.id} views must belong to the target graph`);if(this.resolvedStrategy===`fused`)zp(e,this);else{Bp(e,this,Wp(this.nodeCount,e.device.limits.maxComputeWorkgroupsPerDimension));for(let t=this.levelCount-2;t>=0;t--)Hp(e,this,t)}this.sourceIds&&Vp(e,this,this.sourceIds)}};function zp(e,t){let n=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${z(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${z(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${z(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${z(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${z(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${z(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${z(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${z(t.overflow)}u;
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
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${Lp}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${Lp}u;
  leafIds[LEAF_IDS_OFFSET + localIndex] = ${Lp}u;

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
}`,r=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];Up(e,{id:`${t.id}-fused-refit`,source:n,resources:r,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchCount:1})}function Bp(e,t,n){let r=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const NODE_COUNT: u32 = ${t.nodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${z(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${z(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${z(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${z(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${z(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${z(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${z(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${z(t.overflow)}u;
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

@compute @workgroup_size(${Pp}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${n.y}u + workgroupId.y) * ${n.x}u + workgroupId.x;
  let nodeIndex = workgroupIndex * ${Pp}u + localId.x;
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
    nodeChildren[CHILDREN_OFFSET + childComponent] = ${Lp}u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = ${Lp}u;
    let leafIndex = nodeIndex - INTERNAL_NODE_COUNT;
    leafIds[LEAF_IDS_OFFSET + leafIndex] = ${Lp}u;
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
}`,i=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];Up(e,{id:`${t.id}-load-leaves`,source:r,resources:i,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchSize:n})}function Vp(e,t,n){let r=Math.min(n.length,t.leafCapacity),i=Wp(r,e.device.limits.maxComputeWorkgroupsPerDimension),a=`
const STORED_COUNT: u32 = ${r}u;
const SOURCE_IDS_OFFSET: u32 = ${z(n)}u;
const LEAF_IDS_OFFSET: u32 = ${z(t.leafIds)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read_write> leafIds: array<u32>;

@compute @workgroup_size(${Pp}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  let leafIndex = workgroupIndex * ${Pp}u + localId.x;
  if (leafIndex >= STORED_COUNT) { return; }
  let sourceIndex = leafIds[LEAF_IDS_OFFSET + leafIndex];
  if (sourceIndex == ${Lp}u) { return; }
  leafIds[LEAF_IDS_OFFSET + leafIndex] = sourceIds[SOURCE_IDS_OFFSET + sourceIndex];
}`;Up(e,{id:`${t.id}-remap-source-ids`,source:a,resources:[{buffer:n,usage:`storage-read`},{buffer:t.leafIds,usage:`storage-read-write`}],bindings:{sourceIds:n,leafIds:t.leafIds},dispatchSize:i})}function Hp(e,t,n){let r=2**n-1,i=2**n,a=`
const FIRST_NODE: u32 = ${r}u;
const LEVEL_NODE_COUNT: u32 = ${i}u;
const DIMENSION: u32 = ${t.dimension}u;
const NODE_MINIMA_OFFSET: u32 = ${z(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${z(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${z(t.nodeChildren)}u;
@group(0) @binding(0) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeChildren: array<u32>;

@compute @workgroup_size(${Pp}) fn main(
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
}`;Up(e,{id:`${t.id}-refit-depth-${n}`,source:a,resources:[{buffer:t.nodeMinima,usage:`storage-read-write`},{buffer:t.nodeMaxima,usage:`storage-read-write`},{buffer:t.nodeChildren,usage:`storage-read`}],bindings:{nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren},dispatchCount:Math.ceil(i/Pp)})}function Up(e,t){e.addComputePass({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new I(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=R(n,r);n.setBindings(i),t.dispatchSize?n.dispatch(e,t.dispatchSize.x,t.dispatchSize.y,t.dispatchSize.z):n.dispatch(e,t.dispatchCount)},destroy:()=>n.destroy()}}})}function Wp(e,t){let n=Math.floor(t),r=Math.max(1,Math.ceil(e/Pp)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`GPUBVH requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function Gp(e){return e>0&&Number.isInteger(Math.log2(e))}var Kp=128,qp=64,Jp=4294967295,Yp=class{id;minima;maxima;nodeMinima;nodeMaxima;nodeChildren;leafIds;counts;overflows;segments;dimension;topology=`complete-binary`;updatePolicy=`refit`;constructor(e){if(this.id=e.id??`gpu-segmented-bvh`,this.minima=e.minima,this.maxima=e.maxima,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.counts=e.counts,this.overflows=e.overflows,this.dimension=this.minima.format===`float32x2`?2:3,Df(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),Df(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),Df(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),Df(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),Df(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),Of(this.leafIds,`${this.id} leafIds`),Of(this.counts,`${this.id} counts`),Of(this.overflows,`${this.id} overflows`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeMaxima.length||this.nodeMinima.length!==this.nodeChildren.length)throw Error(`${this.id} node views must have matching formats and lengths`);if(this.counts.length!==this.overflows.length)throw Error(`${this.id} counts and overflows must have matching lengths`);let t=[this.minima,this.maxima],n=[this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.counts,this.overflows];for(let[e,r]of n.entries())if(t.some(e=>e.buffer===r.buffer)||n.slice(0,e).some(e=>e.buffer===r.buffer))throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>Zp(this,e,t)),$p(this.segments,`nodeOffset`,e=>e.leafCapacity*2-1),$p(this.segments,`leafOffset`,e=>e.leafCapacity),$p(this.segments,`metadataOffset`,()=>1)}addToGraph(e){Xp(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function Xp(e,t,n){for(let n of[e.minima,e.maxima,e.nodeMinima,e.nodeMaxima,e.nodeChildren,e.leafIds,e.counts,e.overflows])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);let r=em(e.segments),i=Array.from(r,([t,r])=>{let i=Math.max(2,t);return{leafCapacity:t,segments:r,dispatchLayout:Nf(`${e.id} ${t}-leaf hierarchies`,r.length*i,i,n)}});for(let n of i)tm(t,e,n.leafCapacity,n.segments,n.dispatchLayout)}function Zp(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isSafeInteger(t.leafCapacity)||t.leafCapacity<1||t.leafCapacity>Kp||t.leafCapacity&t.leafCapacity-1)throw Error(`${r} leafCapacity must be a positive power of two from 1 through 128`);let i=e.minima.buffer.graph.device.limits;if(t.leafCapacity>i.maxComputeInvocationsPerWorkgroup||t.leafCapacity>i.maxComputeWorkgroupSizeX||t.leafCapacity*qp>i.maxComputeWorkgroupStorageSize)throw Error(`${r} leafCapacity exceeds portable single-workgroup limits`);for(let e of[`sourceOffset`,`sourceCount`,`nodeOffset`,`leafOffset`,`metadataOffset`]){let n=t[e];if(!Number.isSafeInteger(n)||n<0||n>Jp)throw Error(`${r} ${e} must be a non-negative uint32`)}return Qp(r,`sourceOffset`,t.sourceOffset,t.sourceCount,e.minima.length),Qp(r,`nodeOffset`,t.nodeOffset,t.leafCapacity*2-1,e.nodeMinima.length),Qp(r,`leafOffset`,t.leafOffset,t.leafCapacity,e.leafIds.length),Qp(r,`metadataOffset`,t.metadataOffset,1,e.counts.length),{sourceOffset:t.sourceOffset,sourceCount:t.sourceCount,nodeOffset:t.nodeOffset,leafOffset:t.leafOffset,metadataOffset:t.metadataOffset,leafCapacity:t.leafCapacity}}function Qp(e,t,n,r,i){if(n>i||r>i-n)throw Error(`${e} ${t} and required rows exceed the parent view`)}function $p(e,t,n){let r=e.slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+n(i))throw Error(`GPUSegmentedBVH ${t} ranges must not overlap`)}}function em(e){let t=new Map;for(let n of e){let e=t.get(n.leafCapacity);e?e.push(n):t.set(n.leafCapacity,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function tm(e,t,n,r,i){let a=r.map(e=>`  BVHSegment(${e.sourceOffset}u, ${e.sourceCount}u, ${e.nodeOffset}u, ${e.leafOffset}u, ${e.metadataOffset}u)`).join(`,
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
const MINIMA_OFFSET: u32 = ${z(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${z(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${z(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${z(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${z(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${z(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${z(t.counts)}u;
const OVERFLOW_OFFSET: u32 = ${z(t.overflows)}u;
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
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${Jp}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${Jp}u;
  leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = ${Jp}u;

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
}`,s=`${t.id}-fused-refit-${n}`,c={sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCounts:t.counts,outputOverflows:t.overflows};e.addComputePass({id:s,resources:[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.counts,usage:`storage-write`},{buffer:t.overflows,usage:`storage-write`}],compile:({device:e})=>{let t=new I(e,{id:s,source:o,shaderLayout:{bindings:Object.keys(c).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(c))r[e]=R(t,n);t.setBindings(r),t.dispatch(e,i.x,i.y,i.z)},destroy:()=>t.destroy()}}})}var nm=`
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
`,rm=`
${nm}

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
`,im=`
${nm}

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
`,am=`
${nm}

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
`;function om(e){let t=typeof e==`boolean`?e?0:2:e.toneMapMode;return`
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
`}var sm=68,cm=24,lm=8,um=16,dm=68,fm=.5,pm=.25,mm=33.3,hm=[.25,.375,.5,.75,1],gm=750,_m=1.2,vm=.65,ym=6,bm=45,xm=8,Sm=64,Cm=4294967295,wm=32,Tm=.25,Em=`
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
`,Dm=`
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
`,Om=`
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
`,km=`
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
`,Am=`
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
`,jm=`
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
`,Mm=`
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
`,Nm=`
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
`,Pm=`
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
`,Fm=class{device;frames=new Map;geometryCache=new Map;constructor(e){if(e.type!==`webgpu`)throw Error(`Ray tracing scene rendering requires a WebGPU device.`);this.device=e}render(e){let[t,n]=Im(this.device,e),r=Lm(this.device,e),i=e.lights??[],a=sh(e),o=new P(e.camera.projectionMatrix).multiplyRight(e.camera.viewMatrix),s=new P(o).invert(),c=Gm(e),l=qm(e),u=Km(e,l),d=Jm(e,i),f=this.frames.get(e.id),p=_h();if(f){lh(f,p),ch(f,a)&&(f.historyNeedsReset=!0);let s=f.topologyRevision!==c,m=f.primitiveRevision!==u,h=f.transformRevision!==l,g=f.lightRevision!==d,_=Hm(e,f,s,h),v=!s&&!m&&f.previousTransformsNeedCommit&&f.pendingPreviousTransformInstanceIds.size>0&&f.pendingPreviousTransformInstanceIds.size<=Vm(f),y,b,x;if(s&&(y=Xm(e.surfaces,e.primitives??{},this.geometryCache)),s||m&&!_?b=Zm(e.surfaces,e.primitives??{},y?.geometryLayouts??f.geometryLayouts,f.previousTransforms):f.previousTransformsNeedCommit&&!_&&!v&&(b=Zm(e.surfaces,e.primitives??{},f.geometryLayouts,f.previousTransforms)),g&&(x=nh(i)),s||b&&f.primitiveBuffer.byteLength<b.primitives.byteLength||y&&f.triangleBuffer.byteLength<y.triangles.byteLength||x&&f.lightBuffer.byteLength<x.byteLength){y??=Xm(e.surfaces,e.primitives??{},this.geometryCache),b??=Zm(e.surfaces,e.primitives??{},y.geometryLayouts,f.previousTransforms);let s=Qm(b,y.triangles,i),p=f.previousTransformsNeedCommit||h;this.destroyFrame(e.id),f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:s,topology:y,primitiveData:b,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.previousTransformsNeedCommit=p;let m=f.primitivePlacements;f.pendingPreviousTransformInstanceIds=new Set(p?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>m.has(e)):[]),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}else{if(y&&(f.triangleBuffer.write(y.triangles),f.geometryLayouts=y.geometryLayouts,f.historyNeedsReset=!0,f.accelerationUpdateMode=`rebuild`),b){f.primitiveBuffer.write(b.primitives),f.previousTransforms=b.previousTransforms,f.primitivePlacements=b.placements,f.retainedSurfaces=e.surfaces;let t=b.placements;f.pendingPreviousTransformInstanceIds=new Set(h?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>t.has(e)):[]),f.previousTransformsNeedCommit=h,f.primitiveCount=b.primitiveCount,f.triangleCount=b.triangleCount,h?(Wm(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)):m&&(f.historyNeedsReset=!0)}else (_||v)&&(Um(f,_??[]),h&&(Wm(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)));if(x){let t=f.lightCount!==i.length;f.lightBuffer.write(x),f.lightCount=i.length,(t||!(e.temporalReprojection??!0))&&(f.historyNeedsReset=!0)}f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d}}else{let s=Xm(e.surfaces,e.primitives??{},this.geometryCache),p=Zm(e.surfaces,e.primitives??{},s.geometryLayouts,new Map),m=Qm(p,s.triangles,i);f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:m,topology:s,primitiveData:p,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}f.lastRenderTimeMilliseconds||=p;let m=Ym(e,s);f.renderRevision!==m&&(f.renderRevision=m,f.historyNeedsReset=!0),(e.temporalReprojection??!0)&&gh(f.previousViewProjection,o,f.previousCameraPosition,e.camera.position)&&(f.historyNeedsReset=!0),(f.displayWidth!==t||f.displayHeight!==n)&&(f.historyNeedsReset=!0),uh(f,p);let h=dh(t,n,f.resolutionScale);f.displayWidth!==t||f.displayHeight!==n||f.internalWidth!==h.width||f.internalHeight!==h.height?this.recreateTraceResources(e.id,f,t,n,h.width,h.height,r):Rm(f.presentation,r)||this.recreateTraceGraph(e.id,f,r);let g=e.progressive??!0;f.historyNeedsReset&&(f.accumulatedFrameCount=0,f.phaseCount=1,f.phaseIndex=0);let _=f.historyNeedsReset?1:f.phaseCount,v=f.historyNeedsReset?0:f.phaseIndex%_,y=g?f.accumulatedFrameCount:0;f.uniformBuffer.write(ih({options:e,inverseViewProjection:s,previousViewProjection:f.previousViewProjection,previousCameraPosition:f.previousCameraPosition,displayWidth:t,displayHeight:n,internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,phaseIndex:v,phaseCount:_,primitiveCount:f.primitiveCount,primitiveCapacity:f.primitiveCapacity,leafCapacity:f.leafCapacity,lightCount:f.lightCount,directLightCount:i.reduce((e,t)=>e+Number(t.type!==`ambient`),0),accumulatedFrameCount:y,frameIndex:f.frameIndex}));let b,x,S;f.topologyNeedsUpdate&&(b=f.topologyGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.topologyNeedsUpdate=!1),f.accelerationUpdateMode===`rebuild`?(x=f.accelerationGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild=0):f.accelerationUpdateMode===`refit`&&(S=f.refitGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild++),f.accelerationUpdateMode=`none`;let C=f.traceGraph.encode(this.device.commandEncoder,{parameters:{dispatchWidth:Math.ceil(f.internalWidth/_),carryWidth:_>1?Math.ceil(f.internalWidth*(_-1)/_):0,...e.framebuffer?{framebuffer:e.framebuffer}:{}},textures:{...f.colorHistory.getBindings(`history`,`output`),...f.metadataHistory.getBindings(`history-metadata`,`output-metadata`)}}).stats;f.colorHistory.advance(),f.metadataHistory.advance(),f.previousViewProjection=new P(o),f.previousCameraPosition=Array.from(e.camera.position),f.historyNeedsReset=!1,f.phaseIndex=(v+1)%f.phaseCount,f.frameIndex++,f.accumulatedFrameCount=g?y+1:0;let w=hh(e);return{surfaceCount:e.surfaces.length,instanceCount:f.primitiveCount,drawCount:1,triangleCount:f.triangleCount,rayTracing:{internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,sampledPixelCoverage:1/_,frameTimeMilliseconds:f.averageFrameTimeMilliseconds??f.targetFrameTimeMilliseconds,accumulatedSamples:g?Math.min(f.accumulatedFrameCount*w,Sm):w,graph:Bm({topology:b,acceleration:x,refit:S,trace:C})}}}destroyFrame(e){let t=this.frames.get(e);t&&(t.topologyGraph.destroy(),t.accelerationGraph.destroy(),t.refitGraph.destroy(),t.traceGraph.destroy(),t.uniformBuffer.destroy(),t.primitiveBuffer.destroy(),t.triangleBuffer.destroy(),t.lightBuffer.destroy(),t.nodeMinimaBuffer.destroy(),t.nodeMaximaBuffer.destroy(),t.nodeChildrenBuffer.destroy(),t.leafIdsBuffer.destroy(),t.sortedPrimitiveIdsBuffer.destroy(),t.blasNodesBuffer.destroy(),t.blasTriangleIdsBuffer.destroy(),t.bvhCountBuffer.destroy(),t.bvhOverflowBuffer.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e)}createFrameResources(e){let{frameIdentifier:n,scene:r}=e,i=this.device.createBuffer({id:`${n}-ray-tracing-uniforms`,byteLength:dm*Float32Array.BYTES_PER_ELEMENT,usage:t.UNIFORM|t.COPY_DST}),a=this.device.createBuffer({id:`${n}-ray-tracing-primitives`,data:r.primitives,usage:t.STORAGE|t.COPY_DST}),o=this.device.createBuffer({id:`${n}-ray-tracing-triangles`,data:r.triangles,usage:t.STORAGE|t.COPY_DST}),s=this.device.createBuffer({id:`${n}-ray-tracing-lights`,data:r.lights,usage:t.STORAGE|t.COPY_DST}),c=Math.max(1,Math.floor(a.byteLength/(sm*Float32Array.BYTES_PER_ELEMENT))),l=2**Math.ceil(Math.log2(c)),u=l*2-1,d=this.device.createBuffer({id:`${n}-ray-tracing-node-minima`,byteLength:u*3*Float32Array.BYTES_PER_ELEMENT,usage:t.STORAGE}),f=this.device.createBuffer({id:`${n}-ray-tracing-node-maxima`,byteLength:u*3*Float32Array.BYTES_PER_ELEMENT,usage:t.STORAGE}),p=this.device.createBuffer({id:`${n}-ray-tracing-node-children`,byteLength:u*2*Uint32Array.BYTES_PER_ELEMENT,usage:t.STORAGE}),m=this.device.createBuffer({id:`${n}-ray-tracing-leaf-ids`,byteLength:l*Uint32Array.BYTES_PER_ELEMENT,usage:t.STORAGE}),h=this.device.createBuffer({id:`${n}-ray-tracing-sorted-primitive-ids`,data:new Uint32Array(l).fill(Cm),usage:t.STORAGE}),g=this.device.createBuffer({id:`${n}-ray-tracing-blas-nodes`,byteLength:Math.max(1,e.topology.blasNodeCount)*lm*Float32Array.BYTES_PER_ELEMENT,usage:t.STORAGE}),_=this.device.createBuffer({id:`${n}-ray-tracing-blas-triangle-ids`,data:new Uint32Array(Math.max(1,e.topology.blasTriangleIdCount)).fill(Cm),usage:t.STORAGE}),v=this.device.createBuffer({id:`${n}-ray-tracing-bvh-count`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:t.STORAGE}),y=this.device.createBuffer({id:`${n}-ray-tracing-bvh-overflow`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:t.STORAGE}),b=dh(e.displayWidth,e.displayHeight,e.quality.resolutionScale),x=this.createTextureHistory(n,`history`,b.width,b.height),S=this.createTextureHistory(n,`history-metadata`,b.width,b.height),C=this.createTopologyGraph({frameIdentifier:n,topology:e.topology,triangleBuffer:o,blasNodesBuffer:g,blasTriangleIdsBuffer:_}),w=this.createAccelerationGraph({frameIdentifier:n,uniformBuffer:i,primitiveBuffer:a,blasNodesBuffer:g,primitiveCapacity:c,leafCapacity:l,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:p,leafIdsBuffer:m,sortedPrimitiveIdsBuffer:h,bvhCountBuffer:v,bvhOverflowBuffer:y}),T=this.createRefitGraph({frameIdentifier:n,uniformBuffer:i,primitiveBuffer:a,blasNodesBuffer:g,primitiveCapacity:c,leafCapacity:l,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:p,leafIdsBuffer:m,sortedPrimitiveIdsBuffer:h,bvhCountBuffer:v,bvhOverflowBuffer:y}),E=this.createTraceGraph({frameIdentifier:n,internalWidth:b.width,internalHeight:b.height,presentation:e.presentation,uniformBuffer:i,primitiveBuffer:a,triangleBuffer:o,lightBuffer:s,nodeMinimaBuffer:d,nodeMaximaBuffer:f,sortedPrimitiveIdsBuffer:h,blasNodesBuffer:g,blasTriangleIdsBuffer:_,colorHistory:x,metadataHistory:S});return{displayWidth:e.displayWidth,displayHeight:e.displayHeight,presentation:e.presentation,internalWidth:b.width,internalHeight:b.height,resolutionScale:e.quality.resolutionScale,requestedResolutionScale:e.quality.requestedResolutionScale,minimumResolutionScale:e.quality.minimumResolutionScale,adaptiveResolution:e.quality.adaptiveResolution,targetFrameTimeMilliseconds:e.quality.targetFrameTimeMilliseconds,phaseCount:1,phaseIndex:0,overBudgetFrameCount:0,underBudgetFrameCount:0,lastBudgetAdjustmentTimeMilliseconds:0,uniformBuffer:i,primitiveBuffer:a,triangleBuffer:o,lightBuffer:s,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:p,leafIdsBuffer:m,sortedPrimitiveIdsBuffer:h,blasNodesBuffer:g,blasTriangleIdsBuffer:_,bvhCountBuffer:v,bvhOverflowBuffer:y,colorHistory:x,metadataHistory:S,topologyGraph:C,accelerationGraph:w,refitGraph:T,traceGraph:E,topologyRevision:``,primitiveRevision:``,transformRevision:``,lightRevision:``,renderRevision:``,geometryLayouts:e.topology.geometryLayouts,retainedSurfaces:e.surfaces,previousTransforms:e.primitiveData.previousTransforms,primitivePlacements:e.primitiveData.placements,pendingPreviousTransformInstanceIds:new Set,previousTransformsNeedCommit:!1,previousViewProjection:new P(e.viewProjection),previousCameraPosition:Array.from(e.cameraPosition),historyNeedsReset:!0,topologyNeedsUpdate:!0,accelerationUpdateMode:`rebuild`,refitsSinceMortonRebuild:0,frameIndex:0,accumulatedFrameCount:0,primitiveCount:r.primitiveCount,primitiveCapacity:c,leafCapacity:l,lightCount:r.lightCount,triangleCount:r.triangleCount}}recreateTraceResources(e,t,n,r,i,a,o){t.traceGraph.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),t.colorHistory=this.createTextureHistory(e,`history`,i,a),t.metadataHistory=this.createTextureHistory(e,`history-metadata`,i,a),t.traceGraph=this.createTraceGraph({frameIdentifier:e,internalWidth:i,internalHeight:a,presentation:o,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory}),t.displayWidth=n,t.displayHeight=r,t.presentation=o,t.internalWidth=i,t.internalHeight=a,t.phaseIndex=0,t.historyNeedsReset=!0}recreateTraceGraph(e,t,n){let r=this.createTraceGraph({frameIdentifier:e,internalWidth:t.internalWidth,internalHeight:t.internalHeight,presentation:n,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory});t.traceGraph.destroy(),t.traceGraph=r,t.presentation=n}createTextureHistory(e,t,n,r){return new wf(this.device,{id:`${e}-ray-tracing-${t}`,width:n,height:r,format:`rgba16float`,usage:v.SAMPLE|v.STORAGE})}createTopologyGraph(e){let t=new ef(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-topology`}),n=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),r=Math.max(1,e.topology.triangleCount),i=Math.max(1,e.topology.blasNodeCount),a=Math.max(1,e.topology.blasTriangleIdCount),o=B(t,`triangle-minima`,`float32x3`,r),s=B(t,`triangle-maxima`,`float32x3`,r),c=B(t,`blas-morton-keys`,`uint32`,a),l=B(t,`blas-local-triangle-ids`,`uint32`,a),u=B(t,`blas-sorted-morton-keys`,`uint32`,a),d=U(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,a),f=B(t,`blas-sorted-minima`,`float32x3`,r),p=B(t,`blas-sorted-maxima`,`float32x3`,r),m=B(t,`blas-node-minima`,`float32x3`,i),h=B(t,`blas-node-maxima`,`float32x3`,i),g=B(t,`blas-node-children`,`uint32x2`,i),_=B(t,`blas-leaf-ids`,`uint32`,a),v=U(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,i*2),y=Math.max(1,e.topology.geometryLayouts.size),b=B(t,`blas-counts`,`uint32`,y),x=B(t,`blas-overflows`,`uint32`,y);t.addComputePass({id:`${e.frameIdentifier}-build-triangle-bounds`,resources:[{buffer:n,usage:`storage-read`},{buffer:o,usage:`storage-write`},{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-triangle-bounds-computation`,source:ah(Am,{TRIANGLE_COUNT:e.topology.triangleCount}),shaderLayout:{bindings:[{name:`triangles`,type:`read-only-storage`,group:0,location:0},{name:`triangleMinima`,type:`storage`,group:0,location:1},{name:`triangleMaxima`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangles:t(n),triangleMinima:R(o,t),triangleMaxima:R(s,t)}),i.dispatch(e,Math.ceil(r/128))},destroy:()=>i.destroy()}}});let S=[],C=[],w=[];for(let[n,r]of Array.from(e.topology.geometryLayouts.values()).entries()){if(r.triangleCount===0)continue;let i=r.blasLeafCapacity*2-1,a=H(t,o,`float32x3`,r.triangleStart,r.triangleCount),y=H(t,s,`float32x3`,r.triangleStart,r.triangleCount),T=H(t,c,`uint32`,r.blasTriangleIdStart,r.triangleCount),E=H(t,l,`uint32`,r.blasTriangleIdStart,r.triangleCount),D=H(t,u,`uint32`,r.blasTriangleIdStart,r.triangleCount),O=H(t,d,`uint32`,r.blasTriangleIdStart,r.triangleCount),k=H(t,f,`float32x3`,r.triangleStart,r.triangleCount),A=H(t,p,`float32x3`,r.triangleStart,r.triangleCount),ee=H(t,m,`float32x3`,r.blasNodeStart,i),te=H(t,h,`float32x3`,r.blasNodeStart,i),ne=H(t,g,`uint32x2`,r.blasNodeStart,i),re=H(t,_,`uint32`,r.blasTriangleIdStart,r.blasLeafCapacity),ie=H(t,v,`float32x4`,r.blasNodeStart*2,i*2),ae=H(t,b,`uint32`,n,1),oe=H(t,x,`uint32`,n,1),se=r.triangleCount<=256;if(r.triangleCount>0){let o=B(t,`blas-${n}-scene-bounds`,`uint32`,6);if(t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-initialize-scene-bounds`,resources:[{buffer:o,usage:`storage-write`}],compile:({device:t})=>{let r=new I(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-initialize-computation`,source:Em,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({sceneBounds:R(o,t)}),r.dispatch(e,1)},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-reduce-computation`,source:ah(jm,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:z(a),MAXIMA_OFFSET:z(y)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:R(a,t),triangleMaxima:R(y,t),sceneBounds:R(o,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:T,usage:`storage-write`},{buffer:E,usage:`storage-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-blas-${n}-morton-keys-computation`,source:ah(Mm,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:z(a),MAXIMA_OFFSET:z(y),MORTON_KEYS_OFFSET:z(T),TRIANGLE_IDS_OFFSET:z(E)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`triangleIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:R(a,t),triangleMaxima:R(y,t),sceneBounds:R(o,t),mortonKeys:R(T,t),triangleIds:R(E,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),se){let e=r.blasTriangleIdStart;S.push({keysOffset:e,valuesOffset:e,outputKeysOffset:e,outputValuesOffset:e,length:r.triangleCount})}else new _p({id:`${e.frameIdentifier}-blas-${n}-sort-triangle-morton-keys`,keys:T,values:E,outputKeys:D,outputValues:O}).addToGraph(t);let s=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:O,usage:`storage-read`},{buffer:k,usage:`storage-write`},{buffer:A,usage:`storage-write`}],compile:({device:t})=>{let i=new I(t,{id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds-computation`,source:ah(Nm,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:z(a),MAXIMA_OFFSET:z(y),SORTED_TRIANGLE_IDS_OFFSET:z(O),SORTED_MINIMA_OFFSET:z(k),SORTED_MAXIMA_OFFSET:z(A)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedTriangleIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:R(a,t),triangleMaxima:R(y,t),sortedTriangleIds:R(O,t),sortedMinima:R(k,t),sortedMaxima:R(A,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}})},c=()=>{new Rp({id:`${e.frameIdentifier}-blas-${n}-bvh`,minima:k,maxima:A,leafCapacity:r.blasLeafCapacity,nodeMinima:ee,nodeMaxima:te,nodeChildren:ne,leafIds:re,count:ae,overflow:oe}).addToGraph(t)},l=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-pack-nodes`,resources:[{buffer:ee,usage:`storage-read`},{buffer:te,usage:`storage-read`},{buffer:ie,usage:`storage-write`}],compile:({device:t})=>{let r=new I(t,{id:`${e.frameIdentifier}-blas-${n}-pack-nodes-computation`,source:ah(Pm,{NODE_COUNT:i,NODE_MINIMA_OFFSET:z(ee),NODE_MAXIMA_OFFSET:z(te),PACKED_NODES_OFFSET:z(ie)}),shaderLayout:{bindings:[{name:`nodeMinima`,type:`read-only-storage`,group:0,location:0},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:1},{name:`packedNodes`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({nodeMinima:R(ee,t),nodeMaxima:R(te,t),packedNodes:R(ie,t)}),r.dispatch(e,Math.ceil(i/128))},destroy:()=>r.destroy()}}})};if(se){let e=r.blasLeafCapacity<=128;e&&C.push({sourceOffset:r.triangleStart,sourceCount:r.triangleCount,nodeOffset:r.blasNodeStart,leafOffset:r.blasTriangleIdStart,metadataOffset:n,leafCapacity:r.blasLeafCapacity}),w.push({addGatherPass:s,addHierarchyPass:c,addPackPass:l,usesSegmentedHierarchy:e})}else s(),c(),l()}}if(S.length>0){new np({id:`${e.frameIdentifier}-blas-sort-triangle-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d,segments:S}).addToGraph(t);for(let e of w)e.addGatherPass();C.length>0&&new Yp({id:`${e.frameIdentifier}-blas-bvh`,minima:f,maxima:p,nodeMinima:m,nodeMaxima:h,nodeChildren:g,leafIds:_,counts:b,overflows:x,segments:C}).addToGraph(t);for(let e of w)e.usesSegmentedHierarchy||e.addHierarchyPass(),e.addPackPass()}return t.compile()}createAccelerationGraph(e){let t=new ef(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-acceleration`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=B(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=B(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=B(t,`scene-bounds`,`uint32`,6),c=B(t,`primitive-morton-keys`,`uint32`,e.primitiveCapacity),l=B(t,`primitive-ids`,`uint32`,e.primitiveCapacity),u=B(t,`sorted-primitive-morton-keys`,`uint32`,e.primitiveCapacity),d=U(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),f=B(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),p=B(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),m=e.leafCapacity*2-1,h=U(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,m),g=U(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,m),_=U(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,m),v=U(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),y=new Rp({id:`${e.frameIdentifier}-ray-tracing-bvh`,minima:f,maxima:p,leafCapacity:e.leafCapacity,nodeMinima:h,nodeMaxima:g,nodeChildren:_,leafIds:v,count:U(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:U(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-build-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new I(t,{id:`${e.frameIdentifier}-primitive-bounds-computation`,source:rm,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:R(a,c),primitiveMaxima:R(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-initialize-scene-bounds`,resources:[{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-scene-bounds-initialize-computation`,source:Em,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{n.setBindings({sceneBounds:R(s,t)}),n.dispatch(e,1)},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-scene-bounds-reduce-computation`,source:Dm.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:R(a,r),primitiveMaxima:R(o,r),sceneBounds:R(s,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-morton-keys-computation`,source:Om.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`primitiveIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:R(a,r),primitiveMaxima:R(o,r),sceneBounds:R(s,r),mortonKeys:R(c,r),primitiveIds:R(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),new _p({id:`${e.frameIdentifier}-sort-primitive-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d}).addToGraph(t),t.addComputePass({id:`${e.frameIdentifier}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:d,usage:`storage-read`},{buffer:f,usage:`storage-write`},{buffer:p,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-gather-sorted-bounds-computation`,source:km.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:R(a,r),primitiveMaxima:R(o,r),sortedPrimitiveIds:R(d,r),sortedMinima:R(f,r),sortedMaxima:R(p,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),y.addToGraph(t),t.compile()}createRefitGraph(e){let t=new ef(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-refit`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=B(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=B(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=U(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),c=B(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),l=B(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),u=e.leafCapacity*2-1,d=U(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,u),f=U(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,u),p=U(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,u),m=U(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),h=new Rp({id:`${e.frameIdentifier}-ray-tracing-refit-bvh`,minima:c,maxima:l,leafCapacity:e.leafCapacity,nodeMinima:d,nodeMaxima:f,nodeChildren:p,leafIds:m,count:U(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:U(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-refit-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new I(t,{id:`${e.frameIdentifier}-refit-primitive-bounds-computation`,source:rm,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:R(a,c),primitiveMaxima:R(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-refit-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new I(t,{id:`${e.frameIdentifier}-refit-gather-sorted-bounds-computation`,source:km.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:R(a,r),primitiveMaxima:R(o,r),sortedPrimitiveIds:R(s,r),sortedMinima:R(c,r),sortedMaxima:R(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),h.addToGraph(t),t.compile()}createTraceGraph(e){let t=new ef(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-trace`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),a=t.importBuffer({id:`lights`,byteLength:e.lightBuffer.byteLength,usage:e.lightBuffer.usage},e.lightBuffer),o=Math.max(1,Math.floor(e.nodeMinimaBuffer.byteLength/(3*Float32Array.BYTES_PER_ELEMENT))),s=U(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,o),c=U(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,o),l=U(t,`leaf-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,Math.max(1,Math.floor(e.sortedPrimitiveIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),u=U(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,Math.max(1,Math.floor(e.blasNodesBuffer.byteLength/(4*Float32Array.BYTES_PER_ELEMENT)))),d=U(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,Math.max(1,Math.floor(e.blasTriangleIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),f=t.importTexture({id:`history`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.colorHistory.previousTexture),p=t.importTexture({id:`history-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.metadataHistory.previousTexture),m=t.importTexture({id:`output`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.colorHistory.currentTexture),h=t.importTexture({id:`output-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:v.SAMPLE|v.STORAGE},e.metadataHistory.currentTexture),g=t.createTextureView(f),_=t.createTextureView(p),y=t.createTextureView(m),b=t.createTextureView(h);return t.addComputePass({id:`${e.frameIdentifier}-carry-ray-tracing-history`,resources:[{buffer:n,usage:`uniform`},{texture:g,usage:`sampled`},{texture:_,usage:`sampled`},{texture:y,usage:`storage-write`},{texture:b,usage:`storage-write`}],compile:({device:t})=>{let r=new I(t,{id:`${e.frameIdentifier}-ray-tracing-history-carry-computation`,source:im,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`historyImage`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:2,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:3,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:4,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:i,getTextureView:a,parameters:o})=>{o.carryWidth!==0&&(r.setBindings({uniforms:i(n),historyImage:a(g),historyMetadata:a(_),outputImage:a(y),outputMetadata:a(b)}),r.dispatch(t,Math.ceil(o.carryWidth/8),Math.ceil(e.internalHeight/8),1))},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-trace-rays`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-read`},{buffer:l,usage:`storage-read`},{buffer:u,usage:`storage-read`},{buffer:d,usage:`storage-read`},{texture:g,usage:`sampled`},{texture:_,usage:`sampled`},{texture:y,usage:`storage-write`},{texture:b,usage:`storage-write`}],compile:({device:t})=>{let o=new I(t,{id:`${e.frameIdentifier}-ray-tracing-computation`,source:am,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`triangles`,type:`read-only-storage`,group:0,location:2},{name:`lights`,type:`read-only-storage`,group:0,location:3},{name:`nodeMinima`,type:`read-only-storage`,group:0,location:4},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:5},{name:`leafPrimitiveIds`,type:`read-only-storage`,group:0,location:6},{name:`blasNodes`,type:`read-only-storage`,group:0,location:7},{name:`blasTriangleIds`,type:`read-only-storage`,group:0,location:8},{name:`historyImage`,type:`texture`,group:0,location:9,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:10,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:11,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:12,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:f,getTextureView:p,parameters:m})=>{o.setBindings({uniforms:f(n),primitives:f(r),triangles:f(i),lights:f(a),nodeMinima:R(s,f),nodeMaxima:R(c,f),leafPrimitiveIds:R(l,f),blasNodes:R(u,f),blasTriangleIds:R(d,f),historyImage:p(g),historyMetadata:p(_),outputImage:p(y),outputMetadata:p(b)}),o.dispatch(t,Math.ceil(m.dispatchWidth/8),Math.ceil(e.internalHeight/8),1)},destroy:()=>o.destroy()}}}),t.addRenderPass({id:`${e.frameIdentifier}-present-ray-tracing`,resources:[{texture:y,usage:`sampled`}],compile:({device:t})=>{let n=new Ss(t,{id:`${e.frameIdentifier}-ray-tracing-presentation`,source:om({toneMapMode:e.presentation.toneMapMode,outputEncoding:e.presentation.outputEncoding}),vertexCount:3,colorAttachmentFormats:[e.presentation.colorFormat],...e.presentation.depthStencilFormat?{depthStencilAttachmentFormat:e.presentation.depthStencilFormat}:{},shaderLayout:{attributes:[],bindings:[{name:`image`,type:`texture`,group:0,location:0,sampleType:`unfilterable-float`}]},parameters:{depthWriteEnabled:!1,...e.presentation.depthStencilFormat?{depthCompare:`always`}:{}}});return{getRenderPassProps:({parameters:t})=>({id:`${e.frameIdentifier}-present-ray-tracing`,...t.framebuffer?{framebuffer:t.framebuffer}:{}}),encode:({renderPass:e,getTextureView:t})=>{n.setBindings({image:t(y)}),n.draw(e)},destroy:()=>n.destroy()}}}),t.compile()}};function Im(e,t){if(t.framebuffer)return[t.framebuffer.width,t.framebuffer.height];if(t.width!==void 0&&t.height!==void 0)return[t.width,t.height];let[n,r]=e.getDefaultCanvasContext().getDrawingBufferSize();return[t.width??n,t.height??r]}function Lm(e,t){let n=t.framebuffer?.colorAttachments[0]?.texture.format??e.preferredColorFormat,r=!!(f.getInfo(n).dataType?.startsWith(`float`)||n.endsWith(`ufloat`)),i=t.framebuffer?t.framebuffer.depthStencilAttachment?.texture.format:`depth24plus`;return{colorFormat:n,...i?{depthStencilFormat:i}:{},toneMapMode:t.toneMapMode??(r?Co.NONE:Co.KHRONOS_PBR_NEUTRAL),outputEncoding:t.outputColorSpace?Number(t.outputColorSpace===`srgb`):Number(!r&&!n.endsWith(`-srgb`))}}function Rm(e,t){return e.colorFormat===t.colorFormat&&e.depthStencilFormat===t.depthStencilFormat&&e.toneMapMode===t.toneMapMode&&e.outputEncoding===t.outputEncoding}function zm(e){return{nodeCount:e.nodeCount,computePassCount:e.computePassCount,coalescedComputeNodeCount:e.coalescedComputeNodeCount,cpuEncodeTimeMilliseconds:e.cpuEncodeTimeMilliseconds}}function Bm(e){let t=e.topology&&zm(e.topology),n=e.acceleration&&zm(e.acceleration),r=e.refit&&zm(e.refit),i=zm(e.trace),a=[t,n,r,i].filter(e=>!!e);return{nodeCount:a.reduce((e,t)=>e+t.nodeCount,0),computePassCount:a.reduce((e,t)=>e+t.computePassCount,0),coalescedComputeNodeCount:a.reduce((e,t)=>e+t.coalescedComputeNodeCount,0),cpuEncodeTimeMilliseconds:a.reduce((e,t)=>e+t.cpuEncodeTimeMilliseconds,0),...t?{topology:t}:{},...n?{acceleration:n}:{},...r?{refit:r}:{},trace:i}}function Vm(e){return Math.max(1,Math.floor(e.primitiveCount*Tm))}function Hm(e,t,n,r){let i=e.sceneRevisions,a=i?.dirtyInstanceIds;if(n||!r||!i||!a||a.length===0||e.surfaces!==t.retainedSurfaces||t.materialRevision!==i.materials)return;let o=Array.from(new Set(a));if(!(o.length>Vm(t)||o.some(n=>{let r=t.primitivePlacements.get(n);return!r||e.surfaces[r.surfaceIndex]!==r.surface||r.surface.instanceIds?.[r.transformIndex]!==n})))return o}function Um(e,t){let n=new Set(t);for(let t of e.pendingPreviousTransformInstanceIds){if(n.has(t))continue;let r=e.primitivePlacements.get(t);if(!r)continue;let i=e.previousTransforms.get(r.placementIdentifier);i&&e.primitiveBuffer.write(Float32Array.from(i),(r.primitiveIndex*sm+52)*Float32Array.BYTES_PER_ELEMENT)}for(let t of n){let n=e.primitivePlacements.get(t);if(!n)continue;let r=n.surface.transforms[n.transformIndex],i=e.previousTransforms.get(n.placementIdentifier)??r,a=new Float32Array(32);a.set(r),a.set(new P(r).invert(),16);let o=n.primitiveIndex*sm*Float32Array.BYTES_PER_ELEMENT;e.primitiveBuffer.write(a,o),e.primitiveBuffer.write(Float32Array.from(i),o+52*Float32Array.BYTES_PER_ELEMENT),e.previousTransforms.set(n.placementIdentifier,new P(r))}e.pendingPreviousTransformInstanceIds=n,e.previousTransformsNeedCommit=n.size>0}function Wm(e){e.accelerationUpdateMode!==`rebuild`&&(e.accelerationUpdateMode=e.refitsSinceMortonRebuild>=wm?`rebuild`:`refit`)}function Gm(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.topology}`:JSON.stringify(e.surfaces.map(t=>[t.id,t.geometry.id,t.geometryVersion,t.transforms.length,t.morphWeights,e.primitives?.[t.id]]))}function Km(e,t){return e.sceneRevisions?`${t}:${e.sceneRevisions.materials}`:JSON.stringify([t,e.surfaces.map(t=>[t.material.id,t.material.version,t.material.uniforms,e.primitives?.[t.id]])])}function qm(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.transforms}`:JSON.stringify(e.surfaces.map(e=>[e.id,e.transforms.map(e=>Array.from(e)),e.instanceIds]))}function Jm(e,t){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.lights}`:JSON.stringify(t)}function Ym(e,t){let n=e.temporalReprojection??!0?void 0:[Array.from(t),Array.from(e.camera.position)];return JSON.stringify([e.cameraProjection,n,e.background,e.exposure,e.fogColor,e.fogDensity,e.samplesPerPixel,e.maxBounces,e.progressive,e.shadows,e.temporalReprojection,e.shadowSamplesPerFrame])}function Xm(e,t,n){let r=[],i=new Map,a=0,o=0;for(let s of e){if(t[s.id]?.type===`sphere`)continue;let e=eh(s);if(i.has(e))continue;let c=$m(s,n),l=r.length/cm,u=oh(Math.max(1,c.triangleCount)),d=u*2-1;for(let e of c.triangles)r.push(e);i.set(e,{triangleStart:l,triangleCount:c.triangleCount,blasNodeStart:a,blasTriangleIdStart:o,blasInternalNodeCount:u-1,blasLeafCapacity:u,bounds:c.bounds}),a+=d,o+=u}return{triangles:rh(r,cm),geometryLayouts:i,triangleCount:r.length/cm,blasNodeCount:a,blasTriangleIdCount:o}}function Zm(e,t,n,r){let i=e.reduce((e,t)=>e+t.transforms.length,0),a=new Float32Array(Math.max(i,1)*sm),o=new Map,s=new Map,c=0,l=0;for(let[i,u]of e.entries()){let e=t[u.id],d=e?.type===`sphere`?e.radius:0,f=d>0?void 0:n.get(eh(u)),p=f?.bounds??[0,0,0,d],m=u.material.uniforms,h=m?.baseColorFactor??[.8,.8,.8,1],g=m?.emissiveFactor??[0,0,0],_=m?.emissiveStrength??1,v=m?.metallicRoughnessValues??[0,.5],y=u.instanceIds;for(let e=0;e<u.transforms.length;e++){let t=u.transforms[e],n=new P(t).invert(),m=y?.[e]??String(e),b=`${u.id}:${m}`,x=r.get(b)??t,S=c*sm;a.set(t,S),a.set(n,S+16),a[S+32]=h[0],a[S+33]=h[1],a[S+34]=h[2],a[S+35]=h[3]??1,a[S+36]=g[0]*_,a[S+37]=g[1]*_,a[S+38]=g[2]*_,a[S+39]=v[0],a[S+40]=v[1],a[S+41]=d,a[S+42]=f?.triangleStart??0,a[S+43]=f?.triangleCount??0,a[S+44]=p[0],a[S+45]=p[1],a[S+46]=p[2],a[S+47]=p[3],a[S+48]=f?.blasNodeStart??0,a[S+49]=f?.blasTriangleIdStart??0,a[S+50]=f?.blasInternalNodeCount??0,a[S+51]=f?.blasLeafCapacity??0,a.set(x,S+52),o.set(b,new P(t)),s.set(y?.[e]??b,{surface:u,surfaceIndex:i,transformIndex:e,primitiveIndex:c,placementIdentifier:b}),c++,l+=f?.triangleCount??0}}return{primitives:a,primitiveCount:i,triangleCount:l,previousTransforms:o,placements:s}}function Qm(e,t,n){return{primitives:e.primitives,triangles:t,lights:nh(n),primitiveCount:e.primitiveCount,lightCount:n.length,triangleCount:e.triangleCount}}function $m(e,t){let n=eh(e),r=t.get(n);if(r)return r;let i=e.geometry,a=i.attributes.POSITION?.value,o=i.attributes.NORMAL?.value;if(!a||!o)throw Error(`Ray tracing scene geometry requires positions and normals.`);let s=[],c=th(i),l=i.indices?.value,u=l?.length??a.length/3;for(let e=0;e+2<u;e+=3){for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(a[n]),Number(a[n+1]),Number(a[n+2]),0)}for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(o[n]),Number(o[n+1]),Number(o[n+2]),0)}}let d={triangles:new Float32Array(s),triangleCount:s.length/cm,bounds:c};return t.set(n,d),d}function eh(e){return`${e.geometry.id}:${e.geometryVersion??0}`}function th(e){let t=e.attributes.POSITION?.value;if(!t||t.length===0)return[0,0,0,0];let n=[1/0,1/0,1/0],r=[-1/0,-1/0,-1/0];for(let e=0;e+2<t.length;e+=3)for(let i=0;i<3;i++){let a=Number(t[e+i]);n[i]=Math.min(n[i],a),r[i]=Math.max(r[i],a)}let i=n.map((e,t)=>(e+r[t])*.5),a=0;for(let e=0;e+2<t.length;e+=3){let n=(Number(t[e])-i[0])**2+(Number(t[e+1])-i[1])**2+(Number(t[e+2])-i[2])**2;a=Math.max(a,n)}return[i[0],i[1],i[2],Math.sqrt(a)+1e-4]}function nh(e){let t=[];for(let n of e){let e=n.color??[1,1,1],r=n.intensity??1,i=n.type===`point`||n.type===`spot`?n.position:[0,0,0],a=n.type===`directional`||n.type===`spot`?n.direction:[0,-1,0],o=n.type===`point`||n.type===`spot`?n.attenuation??[1,0,0]:[1,0,0],s=n.type===`ambient`?0:n.type===`directional`?1:n.type===`point`?2:3,c=n.type===`spot`?Math.cos(n.innerConeAngle??.35):1,l=n.type===`spot`?Math.cos(n.outerConeAngle??.5):0;t.push(e[0],e[1],e[2],r,i[0],i[1],i[2],c,a[0],a[1],a[2],s,o[0],o[1],o[2],l)}return rh(t,um)}function rh(e,t){return e.length>0?new Float32Array(e):new Float32Array(t)}function ih(e){let t=new Float32Array(dm),n=new Uint32Array(t.buffer),r=e.options.background??[.015,.018,.038,1],i=e.options.fogColor??[.025,.035,.075];return t.set(e.inverseViewProjection,0),t.set(e.options.camera.position,16),t[19]=e.options.cameraProjection===`orthographic`?1:0,t.set(r,20),n[24]=e.internalWidth,n[25]=e.internalHeight,n[26]=e.primitiveCount,n[27]=e.lightCount,t[28]=e.options.exposure??1.35,t[29]=e.accumulatedFrameCount,t[30]=e.options.samplesPerPixel??1,t[31]=e.options.shadows??!0?1:0,t.set(i,32),t[35]=e.options.fogDensity??0,n[36]=e.leafCapacity-1,n[37]=e.leafCapacity,n[38]=e.primitiveCapacity,n[39]=e.frameIndex,n[40]=e.displayWidth,n[41]=e.displayHeight,n[42]=e.phaseIndex,n[43]=e.phaseCount,t[44]=e.resolutionScale,t[45]=e.directLightCount,t[46]=e.options.shadowSamplesPerFrame??1,t[47]=e.options.temporalReprojection??!0?1:0,t.set(e.previousViewProjection,48),t.set(e.previousCameraPosition,64),t[67]=e.options.progressive??!0?1:0,t}function H(e,t,n,r,i){return e.createDataView(t.buffer,{format:n,length:i,byteOffset:t.byteOffset+r*t.byteStride})}function U(e,t,n,r,i){let a=e.importBuffer({id:t,byteLength:n.byteLength,usage:n.usage},n);return e.createDataView(a,{format:r,length:i})}function ah(e,t){let n=e;for(let[e,r]of Object.entries(t))n=n.replaceAll(`__${e}__`,String(r));return n}function oh(e){return 2**Math.ceil(Math.log2(Math.max(1,e)))}function sh(e){let t=e.adaptiveResolution??!0,n=mh(e.minimumResolutionScale??pm,.125,1),r=mh(e.resolutionScale??fm,n,1);return{resolutionScale:r,requestedResolutionScale:r,minimumResolutionScale:n,adaptiveResolution:t,targetFrameTimeMilliseconds:Math.max(1,e.targetFrameTimeMilliseconds??mm)}}function ch(e,t){return e.minimumResolutionScale===t.minimumResolutionScale&&e.adaptiveResolution===t.adaptiveResolution&&e.targetFrameTimeMilliseconds===t.targetFrameTimeMilliseconds&&e.requestedResolutionScale===t.requestedResolutionScale?!1:(e.resolutionScale=t.resolutionScale,e.requestedResolutionScale=t.requestedResolutionScale,e.minimumResolutionScale=t.minimumResolutionScale,e.adaptiveResolution=t.adaptiveResolution,e.targetFrameTimeMilliseconds=t.targetFrameTimeMilliseconds,e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0,e.averageFrameTimeMilliseconds=void 0,!0)}function lh(e,t){let n=e.lastRenderTimeMilliseconds;if(e.lastRenderTimeMilliseconds=t,n===void 0)return;let r=t-n;r<=0||r>1e3||(e.averageFrameTimeMilliseconds=e.averageFrameTimeMilliseconds===void 0?r:e.averageFrameTimeMilliseconds*.8+r*.2)}function uh(e,t){if(e.historyNeedsReset){e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0;return}if(!e.adaptiveResolution||e.averageFrameTimeMilliseconds===void 0)return;let n=e.averageFrameTimeMilliseconds,r=e.targetFrameTimeMilliseconds;if(n>r*_m?(e.overBudgetFrameCount=Math.min(ym,e.overBudgetFrameCount+1),e.underBudgetFrameCount=0):n<r*vm?(e.underBudgetFrameCount=Math.min(bm,e.underBudgetFrameCount+1),e.overBudgetFrameCount=0):(e.overBudgetFrameCount=0,e.underBudgetFrameCount=0),!(t-e.lastBudgetAdjustmentTimeMilliseconds<gm)){if(e.overBudgetFrameCount>=ym){let n=fh(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,-1);if(n<e.resolutionScale)e.resolutionScale=n,e.historyNeedsReset=!0;else if(e.accumulatedFrameCount>=xm)e.phaseCount=Math.min(4,e.phaseCount*2),e.phaseIndex%=e.phaseCount;else return;e.overBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t;return}if(e.underBudgetFrameCount>=bm){if(e.phaseCount>1)e.phaseCount=Math.max(1,e.phaseCount/2),e.phaseIndex%=e.phaseCount;else{let t=fh(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,1);if(t<=e.resolutionScale){e.underBudgetFrameCount=0;return}e.resolutionScale=t,e.historyNeedsReset=!0}e.underBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t}}}function dh(e,t,n){return{width:Math.max(1,Math.ceil(e*n)),height:Math.max(1,Math.ceil(t*n))}}function fh(e,t,n,r){let i=ph(t,n),a=i.findIndex(t=>t>=e-1e-4),o=a<0?i.length-1:a;return i[Math.max(0,Math.min(i.length-1,o+r))]}function ph(e,t){let n=[e,...hm.filter(n=>n>e&&n<t),t].sort((e,t)=>e-t);return n.filter((e,t)=>t===0||Math.abs(e-n[t-1])>1e-4)}function mh(e,t,n){return Math.max(t,Math.min(n,Number.isFinite(e)?e:t))}function hh(e){return Math.max(1,Math.min(16,Math.floor(e.samplesPerPixel??1)))}function gh(e,t,n,r){let i=0;for(let n=0;n<16;n++)i=Math.max(i,Math.abs(Number(e[n])-Number(t[n])));let a=Math.hypot(Number(n[0]??0)-Number(r[0]??0),Number(n[1]??0)-Number(r[1]??0),Number(n[2]??0)-Number(r[2]??0));return i>.75||a>4}function _h(){return globalThis.performance?.now()??Date.now()}var vh=new P,yh=[1,0,0,0,1,0,0,0,1],bh=[{parameter:`baseColorTexture`,binding:`pbr_baseColorSampler`,enabled:`baseColorMapEnabled`,textureCoordinateSet:`baseColorUVSet`,transform:`baseColorUVTransform`},{parameter:`normalTexture`,binding:`pbr_normalSampler`,enabled:`normalMapEnabled`,textureCoordinateSet:`normalUVSet`,transform:`normalUVTransform`},{parameter:`metallicRoughnessTexture`,binding:`pbr_metallicRoughnessSampler`,enabled:`metallicRoughnessMapEnabled`,textureCoordinateSet:`metallicRoughnessUVSet`,transform:`metallicRoughnessUVTransform`},{parameter:`emissiveTexture`,binding:`pbr_emissiveSampler`,enabled:`emissiveMapEnabled`,textureCoordinateSet:`emissiveUVSet`,transform:`emissiveUVTransform`},{parameter:`occlusionTexture`,binding:`pbr_occlusionSampler`,enabled:`occlusionMapEnabled`,textureCoordinateSet:`occlusionUVSet`,transform:`occlusionUVTransform`},{parameter:`specularColorTexture`,binding:`pbr_specularColorSampler`,enabled:`specularColorMapEnabled`,textureCoordinateSet:`specularColorUVSet`,transform:`specularColorUVTransform`},{parameter:`specularIntensityTexture`,binding:`pbr_specularIntensitySampler`,enabled:`specularIntensityMapEnabled`,textureCoordinateSet:`specularIntensityUVSet`,transform:`specularIntensityUVTransform`},{parameter:`transmissionTexture`,binding:`pbr_transmissionSampler`,enabled:`transmissionMapEnabled`,textureCoordinateSet:`transmissionUVSet`,transform:`transmissionUVTransform`},{parameter:`thicknessTexture`,binding:`pbr_thicknessSampler`,enabled:null,textureCoordinateSet:`thicknessUVSet`,transform:`thicknessUVTransform`},{parameter:`clearcoatTexture`,binding:`pbr_clearcoatSampler`,enabled:`clearcoatMapEnabled`,textureCoordinateSet:`clearcoatUVSet`,transform:`clearcoatUVTransform`},{parameter:`clearcoatRoughnessTexture`,binding:`pbr_clearcoatRoughnessSampler`,enabled:`clearcoatRoughnessMapEnabled`,textureCoordinateSet:`clearcoatRoughnessUVSet`,transform:`clearcoatRoughnessUVTransform`},{parameter:`clearcoatNormalTexture`,binding:`pbr_clearcoatNormalSampler`,enabled:null,textureCoordinateSet:`clearcoatNormalUVSet`,transform:`clearcoatNormalUVTransform`},{parameter:`sheenColorTexture`,binding:`pbr_sheenColorSampler`,enabled:`sheenColorMapEnabled`,textureCoordinateSet:`sheenColorUVSet`,transform:`sheenColorUVTransform`},{parameter:`sheenRoughnessTexture`,binding:`pbr_sheenRoughnessSampler`,enabled:`sheenRoughnessMapEnabled`,textureCoordinateSet:`sheenRoughnessUVSet`,transform:`sheenRoughnessUVTransform`},{parameter:`iridescenceTexture`,binding:`pbr_iridescenceSampler`,enabled:`iridescenceMapEnabled`,textureCoordinateSet:`iridescenceUVSet`,transform:`iridescenceUVTransform`},{parameter:`iridescenceThicknessTexture`,binding:`pbr_iridescenceThicknessSampler`,enabled:null,textureCoordinateSet:`iridescenceThicknessUVSet`,transform:`iridescenceThicknessUVTransform`},{parameter:`anisotropyTexture`,binding:`pbr_anisotropySampler`,enabled:`anisotropyMapEnabled`,textureCoordinateSet:`anisotropyUVSet`,transform:`anisotropyUVTransform`},{parameter:`bumpTexture`,binding:`pbr_bumpSampler`,enabled:`bumpMapEnabled`,textureCoordinateSet:`bumpUVSet`,transform:`bumpUVTransform`},{parameter:`diffuseTransmissionTexture`,binding:`pbr_diffuseTransmissionSampler`,enabled:`diffuseTransmissionMapEnabled`,textureCoordinateSet:`diffuseTransmissionUVSet`,transform:`diffuseTransmissionUVTransform`},{parameter:`diffuseTransmissionColorTexture`,binding:`pbr_diffuseTransmissionColorSampler`,enabled:`diffuseTransmissionColorMapEnabled`,textureCoordinateSet:`diffuseTransmissionColorUVSet`,transform:`diffuseTransmissionColorUVTransform`},{parameter:`multiscatterColorTexture`,binding:`pbr_multiscatterColorSampler`,enabled:`multiscatterColorMapEnabled`,textureCoordinateSet:`multiscatterColorUVSet`,transform:`multiscatterColorUVTransform`}],xh=class{geometries=new Map;materials=new Map;worlds=new Map;makeRenderOptions(e){let t=e.getParameter(`world`),n=e.getParameter(`camera`),r=e.getParameter(`renderer`);if(!t||!n||!r)return null;let[i,a]=wh(e,e.device.device),o=r.getParameter(`ambientRadiance`)??.12,s=r.getParameter(`toneMapMode`),c=r.getParameter(`outputColorSpace`),l=this.worlds.get(t);return l?this.updateCachedWorld(l,o):(l=this.createCachedWorld(t,o),this.worlds.set(t,l)),{id:e.id,surfaces:l.surfaces,sceneRevisions:{...l.revisions},camera:Ah(n,i,a),lights:l.lights,background:r.getParameter(`background`)||[.015,.018,.038,1],width:i,height:a,environment:r.getParameter(`environment`),exposure:r.getParameter(`exposure`)??1.35,...s===void 0?{}:{toneMapMode:s},...c===void 0?{}:{outputColorSpace:c},fogColor:r.getParameter(`fogColor`)||[.025,.035,.075],fogDensity:r.getParameter(`fogDensity`)??0,renderMode:r.subtype===`debugNormals`?`debugNormals`:r.subtype===`debugDepth`?`debugDepth`:`default`}}getAnalyticPrimitives(e){let t=this.worlds.get(e);return t||(t=this.createCachedWorld(e,.12),this.worlds.set(e,t)),t.analyticPrimitives}destroy(){this.geometries.clear(),this.materials.clear(),this.worlds.clear()}createCachedWorld(e,t){let n={world:e,surfaces:[],surfaceEntries:[],lights:[],analyticPrimitives:{},ambientRadiance:t,observedCommitRevision:e.device.getSceneCommitRevision(),topologyObjectIds:new Set,lightObjectIds:new Set,instancePlacements:new Map,materialSurfaces:new Map,samplerMaterials:new Map,revisions:{identity:e.id,topology:0,transforms:0,materials:0,lights:0}};return this.rebuildCachedWorld(n,t),n}updateCachedWorld(e,t){let n=e.world.device.getSceneCommitRevision(),r=e.ambientRadiance!==t;if(n===e.observedCommitRevision&&!r)return;let i=e.world.device.getSceneCommitsSince(e.observedCommitRevision),a=i===null,o=r||i===null,s=i===null,c=new Set,l=new Set;for(let t of i??[])if(t.categories.includes(`topology`)&&e.topologyObjectIds.has(t.objectId)&&(a=!0),t.categories.includes(`lights`)&&e.lightObjectIds.has(t.objectId)&&(o=!0,t.categories.includes(`topology`)&&(s=!0)),t.categories.includes(`transforms`)&&e.instancePlacements.has(t.objectId)&&c.add(t.objectId),t.categories.includes(`materials`)){for(let n of e.materialSurfaces.get(t.objectId)??[])l.add(n.material);for(let n of e.samplerMaterials.get(t.objectId)??[])l.add(n)}if(a){this.rebuildCachedWorld(e,t),e.revisions.topology++,e.revisions.lights++,delete e.revisions.dirtyInstanceIds;return}if(c.size>0){let t=new Set;for(let n of c)for(let r of e.instancePlacements.get(n)??[])r.transforms[r.transformIndex]=r.instance.getParameter(`transform`)||vh,t.add(r.instanceId);e.revisions.transforms++,e.revisions.dirtyInstanceIds=Array.from(t)}if(l.size>0){for(let t of l){let n=this.getMaterial(t);for(let r of e.materialSurfaces.get(t.id)??[])r.surface.material=n}this.updateMaterialDependencies(e),e.revisions.materials++}o&&(e.lights=Oh(e.world,t),e.ambientRadiance=t,e.revisions.lights++,s&&this.updateLightDependencies(e)),e.observedCommitRevision=n}rebuildCachedWorld(e,t){e.topologyObjectIds.clear(),e.lightObjectIds.clear(),e.instancePlacements.clear(),e.materialSurfaces.clear(),e.samplerMaterials.clear(),e.surfaceEntries=[],e.analyticPrimitives={},e.surfaces=this.makeSceneSurfaces(e),e.lights=Oh(e.world,t),this.updateLightDependencies(e),e.ambientRadiance=t,e.observedCommitRevision=e.world.device.getSceneCommitRevision()}makeSceneSurfaces(e){let t=new Map;for(let n of Th(e.world,e)){let e=t.get(n.surface)||[];e.push(n),t.set(n.surface,e)}let n=[];for(let[r,i]of t){let t=r.getParameter(`geometry`),a=r.getParameter(`material`);if(!t||!a)continue;let o=this.getGeometry(t),s=this.geometries.get(t),c=i.map(e=>e.transform),l={id:r.id,geometry:o,geometryVersion:s.structuralVersion,material:this.getMaterial(a),transforms:c,instanceIds:i.map(e=>e.instanceId),...r.getParameter(`skin`)?{skin:r.getParameter(`skin`)}:{},...t.getParameter(`morphTargets`)?{morphTargets:t.getParameter(`morphTargets`),morphWeights:t.getParameter(`morphWeights`)||[]}:{}};n.push(l),e.topologyObjectIds.add(r.id),e.topologyObjectIds.add(t.id);for(let n of Object.values(t.getParameters()))n instanceof L&&e.topologyObjectIds.add(n.id);let u={source:r,material:a,surface:l};e.surfaceEntries.push(u);let d=e.materialSurfaces.get(a.id)??[];d.push(u),e.materialSurfaces.set(a.id,d),t.subtype===`sphere`&&(e.analyticPrimitives[r.id]={type:`sphere`,radius:t.getParameter(`radius`)??1});for(let[t,n]of i.entries()){if(!n.instance)continue;let r=e.instancePlacements.get(n.instance.id)??[];r.push({instance:n.instance,transforms:c,transformIndex:t,instanceId:n.instanceId}),e.instancePlacements.set(n.instance.id,r)}}return this.updateMaterialDependencies(e),n}updateMaterialDependencies(e){e.samplerMaterials.clear();for(let t of e.surfaceEntries){let n=t.material.getParameters();for(let r of bh){let i=n[r.parameter];if(!i)continue;let a=e.samplerMaterials.get(i.id)??new Set;a.add(t.material),e.samplerMaterials.set(i.id,a)}}}updateLightDependencies(e){let{world:t}=e,n=t.getParameters();e.lightObjectIds.clear(),e.lightObjectIds.add(t.id),n.light instanceof L&&e.lightObjectIds.add(n.light.id);for(let t of Dh(n.light,n.lights))e.lightObjectIds.add(t.id);n.instance instanceof L&&e.lightObjectIds.add(n.instance.id);for(let t of Dh(n.instance,n.instances)){e.lightObjectIds.add(t.id);let n=t.getParameter(`group`);n instanceof L&&e.lightObjectIds.add(n.id);let r=n instanceof L?n.data:Array.isArray(n)?n:n?[n]:[];for(let t of r){if(!(t instanceof Ul))continue;e.lightObjectIds.add(t.id);let n=t.getParameters();n.light instanceof L&&e.lightObjectIds.add(n.light.id);for(let t of Dh(n.light,n.lights))e.lightObjectIds.add(t.id)}}}getMaterial(e){let t=this.materials.get(e);if(t?.version===e.version&&Array.from(t.samplers).every(([e,t])=>e.version===t))return t.material;let n=new Map,r=e.getParameters();for(let e of bh){let t=r[e.parameter];t&&n.set(t,t.version)}let i=Ch(e);return this.materials.set(e,{version:e.version,samplers:n,material:i}),i}getGeometry(e){let t=this.geometries.get(e),n=t!==void 0&&Array.from(t.arrayVersions).every(([e,t])=>e.version===t);if(t?.version===e.version&&n)return t.geometry;let r=e.getParameters();if(t&&n&&Sh(t.parameters,r))return t.version=e.version,t.parameters=r,t.geometry;let i=jh(e),a=new Map;for(let e of Object.values(r))e instanceof L&&a.set(e,e.version);return this.geometries.set(e,{version:e.version,structuralVersion:Math.max(e.version,(t?.structuralVersion??0)+1),geometry:i,parameters:r,arrayVersions:a}),i}};function Sh(e,t){let n=new Set([...Object.keys(e),...Object.keys(t)]);return n.delete(`morphWeights`),Array.from(n).every(n=>{let r=n;return e[r]===t[r]})}function Ch(e){let t=e.getParameters(),n=t.baseColor||t.color||[.8,.8,.8],r=t.opacity??(n.length>3?n[3]??1:1),i=t.alphaMode?t.alphaMode.toUpperCase():r<1?`BLEND`:`OPAQUE`,a={...So.defaultUniforms,unlit:t.unlit??!1,baseColorFactor:[n[0],n[1],n[2],r],metallicRoughnessValues:[e.subtype===`matte`?0:t.metallic??0,e.subtype===`matte`?.92:t.roughness??.38],normalScale:t.normalScale??1,occlusionStrength:t.occlusionStrength??1,emissiveFactor:t.emissive||[0,0,0],emissiveStrength:t.emissiveStrength??1,alphaCutoffEnabled:i===`MASK`,alphaCutoff:t.alphaCutoff??.5,specularColorFactor:t.specularColor||[1,1,1],specularIntensityFactor:t.specularIntensity??1,ior:t.indexOfRefraction??1.5,transmissionFactor:t.transmission??0,diffuseTransmissionFactor:t.diffuseTransmission??0,diffuseTransmissionColorFactor:t.diffuseTransmissionColor||[1,1,1],dispersion:t.dispersion??0,thicknessFactor:t.thickness??0,attenuationDistance:t.attenuationDistance??1e9,attenuationColor:t.attenuationColor||[1,1,1],multiscatterColorFactor:t.multiscatterColor||[0,0,0],scatterAnisotropy:t.scatterAnisotropy??0,clearcoatFactor:t.clearcoat??0,clearcoatRoughnessFactor:t.clearcoatRoughness??.18,sheenColorFactor:t.sheenColor||[0,0,0],sheenRoughnessFactor:t.sheenRoughness??.5,iridescenceFactor:t.iridescence??0,iridescenceIor:t.iridescenceIndexOfRefraction??1.3,iridescenceThicknessRange:[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400],anisotropyStrength:t.anisotropyStrength??0,anisotropyRotation:t.anisotropyRotation??0,anisotropyDirection:t.anisotropyDirection||[1,0],bumpFactor:t.bumpFactor??1},o={};for(let e of bh){let n=t[e.parameter];if(!n)continue;let r=n.getParameter(`image`);r&&(o[e.binding]=r,e.enabled&&(a[e.enabled]=!0),a[e.textureCoordinateSet]=n.getParameter(`textureCoordinateSet`)??0,a[e.transform]=n.getParameter(`transform`)||yh)}return{id:e.id,version:e.version,uniforms:a,bindings:o,alphaMode:i===`MASK`?`MASK`:i===`BLEND`?`BLEND`:`OPAQUE`,doubleSided:t.doubleSided??!0}}function wh(e,t){let n=e.getParameter(`size`);return n?[n[0],n[1]]:t.getDefaultCanvasContext().getDrawingBufferSize()}function Th(e,t){let n=[],r=e.getParameters();t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),r.surface instanceof L&&t?.topologyObjectIds.add(r.surface.id),r.instance instanceof L&&(t?.topologyObjectIds.add(r.instance.id),t?.lightObjectIds.add(r.instance.id)),r.light instanceof L&&t?.lightObjectIds.add(r.light.id);for(let e of Dh(r.light,r.lights))t?.lightObjectIds.add(e.id);let i=new Map;for(let e of Dh(r.surface,r.surfaces)){t?.topologyObjectIds.add(e.id);let r=i.get(e.id)||0;i.set(e.id,r+1),n.push({surface:e,transform:vh,instanceId:r===0?e.id:`${e.id}:${r}`})}let a=new Map;for(let e of Dh(r.instance,r.instances))t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),Eh(e,n,t,a);return n}function Eh(e,t,n,r){let i=e.getParameters();i.group instanceof L&&(n?.topologyObjectIds.add(i.group.id),n?.lightObjectIds.add(i.group.id));let a=i.group instanceof L?i.group.data:Array.isArray(i.group)?i.group:i.group?[i.group]:[];for(let o of a){if(!(o instanceof Ul))continue;n?.topologyObjectIds.add(o.id),n?.lightObjectIds.add(o.id);let a=o.getParameters();a.surface instanceof L&&n?.topologyObjectIds.add(a.surface.id),a.light instanceof L&&n?.lightObjectIds.add(a.light.id);for(let e of Dh(a.light,a.lights))n?.lightObjectIds.add(e.id);for(let s of Dh(a.surface,a.surfaces)){n?.topologyObjectIds.add(s.id);let a=`${e.id}:${o.id}:${s.id}`,c=r.get(a)||0;r.set(a,c+1),t.push({surface:s,transform:i.transform||vh,instanceId:c===0?a:`${a}:${c}`,instance:e})}}}function Dh(e,t){let n=e||t||[];if(n instanceof L){let e=n.data;return ArrayBuffer.isView(e)?[]:e.filter(e=>typeof e==`object`&&!!e&&`type`in e)}return Array.from(n)}function Oh(e,t){let n=[{type:`ambient`,color:[1,1,1],intensity:t}],r=e.getParameters();for(let e of Dh(r.light,r.lights))kh(e,n);for(let e of Dh(r.instance,r.instances)){let t=e.getParameter(`group`),r=t instanceof L?t.data:Array.isArray(t)?t:t?[t]:[];for(let e of r){if(!(e instanceof Ul))continue;let t=e.getParameters();for(let e of Dh(t.light,t.lights))kh(e,n)}}return n}function kh(e,t){let n=e.getParameters(),r=n.color||[1,1,1];switch(e.subtype){case`ambient`:t.push({type:`ambient`,color:r,intensity:n.radiance??n.intensity??1});break;case`directional`:t.push({type:`directional`,color:r,direction:n.direction||[0,-1,-1],intensity:n.irradiance??n.intensity??1});break;case`point`:t.push({type:`point`,color:r,position:n.position||[0,0,0],intensity:n.intensity??1,attenuation:[1,0,.025]});break;case`spot`:t.push({type:`spot`,color:r,position:n.position||[0,0,0],direction:n.direction||[0,-1,0],intensity:n.intensity??1,attenuation:[1,0,.018],innerConeAngle:n.falloffAngle??(n.openingAngle??.5)*.7,outerConeAngle:n.openingAngle??.5});break}}function Ah(e,t,n){let r=e.getParameters(),i=r.position||[0,0,5],a=r.direction||[0,0,-1],o=[i[0]+a[0],i[1]+a[1],i[2]+a[2]],s=r.aspect||t/Math.max(n,1),c=r.near??.05,l=r.far??500;return{projectionMatrix:e.subtype===`orthographic`?new P().ortho({left:-(r.height??12)*s*.5,right:(r.height??12)*s*.5,bottom:-(r.height??12)*.5,top:(r.height??12)*.5,near:c,far:l}):new P().perspective({fovy:r.fovy??Math.PI/3,aspect:s,near:c,far:l}),viewMatrix:new P().lookAt({eye:i,center:o,up:r.up||[0,1,0]}),position:i}}function jh(e){let t=e.getParameters(),n=t.segments??32,r;switch(e.subtype){case`sphere`:r=new pc({radius:t.radius??1,nlat:n,nlong:n*2});break;case`cylinder`:r=new Tc({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,topCap:!0,bottomCap:!0});break;case`cone`:r=new vc({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,cap:!0});break;case`quad`:r=new Ec({type:`x,z`,xlen:t.width??1,zlen:t.height??t.width??1,flipCull:!0});break;case`triangle`:{let e=Mh(t[`vertex.position`]),n=Mh(t[`vertex.normal`]),i=Mh(t[`vertex.tangent`]),a=Mh(t[`vertex.joint`]),o=Mh(t[`vertex.weight`]),s=Mh(t[`vertex.attribute1`]),c=Mh(t[`vertex.attribute2`]),l=Mh(t[`primitive.index`]);if(!(e instanceof Float32Array))throw Error(`Triangle geometry requires vertex.position`);r=new st({topology:`triangle-list`,attributes:{POSITION:{size:3,value:e},NORMAL:{size:3,value:n instanceof Float32Array?n:Nh(e)},...i instanceof Float32Array?{TANGENT:{size:4,value:i}}:{},...a instanceof Uint8Array||a instanceof Uint16Array||a instanceof Uint32Array?{JOINTS_0:{size:4,value:a}}:{},...o instanceof Float32Array?{WEIGHTS_0:{size:4,value:o}}:{},TEXCOORD_0:{size:2,value:s instanceof Float32Array?s:new Float32Array(e.length/3*2)},...c instanceof Float32Array?{TEXCOORD_1:{size:2,value:c}}:{}},indices:l instanceof Uint16Array||l instanceof Uint32Array?l:void 0});break}}let i=r.attributes.POSITION?.value,a=i?i.length/3:r.vertexCount,o=Mh(t[`vertex.attribute0`]),s=o instanceof Float32Array?o:new Float32Array(a*3).fill(1),c=s.length===a*4?4:3,l=r.attributes.TEXCOORD_0?.value;return new st({topology:r.topology||`triangle-list`,attributes:{...r.attributes,COLOR_0:{size:c,value:s},TEXCOORD_0:{size:2,value:l instanceof Float32Array?l:new Float32Array(a*2)}},indices:r.indices})}function Mh(e){return e instanceof L?e.data:e}function Nh(e){let t=new Float32Array(e.length);for(let n=0;n<e.length;n+=9){let r=e[n+3]-e[n],i=e[n+4]-e[n+1],a=e[n+5]-e[n+2],o=e[n+6]-e[n],s=e[n+7]-e[n+1],c=e[n+8]-e[n+2],l=i*c-a*s,u=a*o-r*c,d=r*s-i*o,f=Math.hypot(l,u,d)||1;for(let e=0;e<3;e++)t[n+e*3]=l/f,t[n+e*3+1]=u/f,t[n+e*3+2]=d/f}return t}var Ph=class{adapter=new xh;renderer;constructor(e){this.renderer=new Fm(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`world`),r=e.getParameter(`camera`),i=e.getParameter(`renderer`);if(!t||!n||!r||!i)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let a=this.adapter.getAnalyticPrimitives(n);return this.renderer.render({...t,primitives:a,cameraProjection:r.subtype,samplesPerPixel:i.getParameter(`samplesPerPixel`),maxBounces:i.getParameter(`maxBounces`),progressive:i.getParameter(`progressive`),shadows:i.getParameter(`shadows`),resolutionScale:i.getParameter(`resolutionScale`),minimumResolutionScale:i.getParameter(`minimumResolutionScale`),adaptiveResolution:i.getParameter(`adaptiveResolution`),targetFrameTimeMilliseconds:i.getParameter(`targetFrameTimeMilliseconds`),temporalReprojection:i.getParameter(`temporalReprojection`),shadowSamplesPerFrame:i.getParameter(`shadowSamplesPerFrame`)})}destroyFrame(e){this.renderer.destroyFrame(e.id)}destroy(){this.renderer.destroy(),this.adapter.destroy()}},Fh=24,Ih={minFilter:`linear`,magFilter:`linear`},Lh={name:`bloomExtract`,source:`
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
`,uniformTypes:{threshold:`f32`,softKnee:`f32`,fireflyReduction:`f32`,exposure:`f32`,exposureCompensation:`f32`},defaultUniforms:{threshold:.8,softKnee:.5,fireflyReduction:0,exposure:1,exposureCompensation:0},propTypes:{threshold:{value:.8,min:0,max:1},softKnee:{value:.5,min:0,max:1},fireflyReduction:{value:0,min:0,max:1},exposure:{value:1,min:1e-4,softMax:8},exposureCompensation:{value:0,min:-8,max:8}},passes:[{sampler:!0}]},Rh={name:`bloomDownsample`,source:`
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
`,passes:[{sampler:!0}]},zh={name:`bloomBlur`,source:`
const BLOOM_BLUR_MAX_RADIUS = ${Fh}.0;
const BLOOM_BLUR_MAX_PAIRS = ${Math.ceil(Fh/2)};

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
#define BLOOM_BLUR_MAX_RADIUS ${Fh}.0
#define BLOOM_BLUR_MAX_PAIRS ${Math.ceil(Fh/2)}

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
`,uniformTypes:{radius:`f32`,delta:`vec2<f32>`},propTypes:{radius:{value:8,min:0,max:Fh,softMax:Fh},delta:{value:[1,0],private:!0}},passes:[{sampler:!0}]},Bh={name:`bloomShaderPassPipeline`,renderTargets:{extractHalf:{scale:[.5,.5],sampler:Ih},blurHalfScratch:{scale:[.5,.5],sampler:Ih},blurHalf:{scale:[.5,.5],sampler:Ih},extractQuarter:{scale:[.25,.25],sampler:Ih},blurQuarterScratch:{scale:[.25,.25],sampler:Ih},blurQuarter:{scale:[.25,.25],sampler:Ih},extractEighth:{scale:[.125,.125],sampler:Ih},blurEighthScratch:{scale:[.125,.125],sampler:Ih},blurEighth:{scale:[.125,.125],sampler:Ih}},steps:[{shaderPass:Lh,inputs:{sourceTexture:`previous`},output:`extractHalf`,uniforms:{threshold:.8}},{shaderPass:zh,inputs:{sourceTexture:`extractHalf`},output:`blurHalfScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:zh,inputs:{sourceTexture:`blurHalfScratch`},output:`blurHalf`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:Rh,inputs:{sourceTexture:`extractHalf`},output:`extractQuarter`},{shaderPass:zh,inputs:{sourceTexture:`extractQuarter`},output:`blurQuarterScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:zh,inputs:{sourceTexture:`blurQuarterScratch`},output:`blurQuarter`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:Rh,inputs:{sourceTexture:`extractQuarter`},output:`extractEighth`},{shaderPass:zh,inputs:{sourceTexture:`extractEighth`},output:`blurEighthScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:zh,inputs:{sourceTexture:`blurEighthScratch`},output:`blurEighth`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:{name:`bloomComposite`,source:`
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
`,bindingLayout:[{name:`glowHalf`,group:0},{name:`glowQuarter`,group:0},{name:`glowEighth`,group:0}],uniforms:{},bindings:{},uniformTypes:{intensity:`f32`},propTypes:{intensity:{value:1,min:0,softMax:3}},passes:[{sampler:!0}]},inputs:{sourceTexture:`previous`,glowHalf:`blurHalf`,glowQuarter:`blurQuarter`,glowEighth:`blurEighth`},output:`previous`,uniforms:{intensity:1}}]},Vh={name:`advancedCopy`,source:`fn advancedCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { return textureSample(sourceTexture, sourceTextureSampler, texCoord); }`,passes:[{sampler:!0}]},Hh=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Uh={name:`cameraReprojectionTaaResolve`,source:`const CAMERA_REPROJECTION_TAA_EPSILON: f32 = 0.00001;

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
}`,bindingLayout:[{name:`historyTexture`,group:0},{name:`depthTexture`,group:0},{name:`previousDepthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseViewProjectionMatrix:`mat4x4<f32>`,previousViewProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`,currentJitter:`vec2<f32>`,previousJitter:`vec2<f32>`},propTypes:{inverseViewProjectionMatrix:{value:Hh,private:!0},previousViewProjectionMatrix:{value:Hh,private:!0},historyWeight:{value:.9,min:0,max:.98},depthThreshold:{value:.0025,min:1e-5,softMax:.05},currentJitter:{value:[0,0],private:!0},previousJitter:{value:[0,0],private:!0}},passes:[{sampler:!0}]},Wh={name:`cameraReprojectionTaaDepthHistoryCopy`,source:`@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn cameraReprojectionTaaDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]};function Gh(){return{name:`cameraReprojectionTaaShaderPassPipeline`,renderTargets:{cameraReprojectionTaaHistoryColor:{format:`rgba16float`,lifetime:`history`,initialize:`original`},cameraReprojectionTaaHistoryDepth:{format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[1,0,0,1]}}},steps:[{shaderPass:Uh,inputs:{sourceTexture:`previous`,historyTexture:`cameraReprojectionTaaHistoryColor`,previousDepthTexture:`cameraReprojectionTaaHistoryDepth`},output:`cameraReprojectionTaaHistoryColor`},{shaderPass:Vh,inputs:{sourceTexture:`cameraReprojectionTaaHistoryColor`},output:`previous`},{shaderPass:Wh,inputs:{sourceTexture:`previous`},output:`cameraReprojectionTaaHistoryDepth`}]}}var Kh=8,qh=.5,Jh=class{device;adapter=new xh;renderer;frames=new Map;constructor(e,{deferred:t=!1}={}){this.device=e,this.renderer=t?new ed(e):new ou(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`renderer`);if(!t||!n)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let r=t.renderMode===`default`?n.getParameter(`bloomIntensity`)??0:0,i=this.device.type===`webgpu`&&t.renderMode===`default`&&(n.getParameter(`temporalAntialiasing`)??!0),a=i||r>0?this.getFrameResources(e):null,o=!1,s=null;if(a){let n=this.getFramebuffer(e,a,i);t.framebuffer=n.framebuffer,o=n.resized}i&&a?(s=Zh(t,a.temporalAntialiasingState,o),t.camera={...t.camera,projectionMatrix:s.jitteredProjectionMatrix}):a&&Xh(a.temporalAntialiasingState);let c=this.renderer.render(t);if(!a||!t.framebuffer)return c;let l=t.framebuffer.colorAttachments[0].texture;if(s){let t=this.getTemporalAntialiasingRenderer(a),[n,i]=wh(e,this.device);t.resize([n,i]);let o=this.getTemporalAntialiasingDepthTexture(e.id,a),c={sourceTexture:l,bindings:{depthTexture:o},uniforms:{cameraReprojectionTaaResolve:{inverseViewProjectionMatrix:new P(s.currentViewProjectionMatrix).invert(),previousViewProjectionMatrix:s.previousViewProjectionMatrix,currentJitter:s.currentJitter,previousJitter:s.previousJitter}},resetHistory:s.resetHistory};if(r>0){let e=t.renderToTexture(c);e&&(l=e)}else t.renderToScreen(c);Qh(a.temporalAntialiasingState,s)}if(r>0){let t=this.getBloomRenderer(a);t.resize(wh(e,this.device)),t.renderToScreen({sourceTexture:l,uniforms:{bloomExtract:{threshold:n.getParameter(`bloomThreshold`)??.62},bloomBlur:{radius:n.getParameter(`bloomRadius`)??7},bloomComposite:{intensity:r}}})}return c}destroyFrame(e){this.renderer.destroyFrame(e.id);let t=this.frames.get(e);t&&(t.framebuffer?.destroy(),t.colorTexture?.destroy(),t.depthTexture?.destroy(),t.bloomRenderer?.destroy(),t.temporalAntialiasingRenderer?.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e);this.renderer.destroy(),this.adapter.destroy()}getFrameResources(e){let t=this.frames.get(e);return t||(t={framebuffer:null,colorTexture:null,depthTexture:null,bloomRenderer:null,temporalAntialiasingRenderer:null,temporalAntialiasingState:Yh()},this.frames.set(e,t)),t}getFramebuffer(e,t,n){let[r,i]=wh(e,this.device),a=this.device.preferredColorFormat,o=t.framebuffer&&(t.framebuffer.width!==r||t.framebuffer.height!==i||t.colorTexture?.format!==a||!!t.depthTexture!==n);return o&&ag(t),t.framebuffer||=(t.colorTexture=this.device.createTexture({id:`anari-${e.id}-color-texture`,width:r,height:i,format:a,usage:v.RENDER_ATTACHMENT|v.SAMPLE}),t.depthTexture=n?this.device.createTexture({id:`anari-${e.id}-depth-texture`,width:r,height:i,format:`depth24plus`,usage:v.RENDER_ATTACHMENT|v.SAMPLE,sampler:{minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}):null,this.device.createFramebuffer({id:`anari-${e.id}-color`,width:r,height:i,colorAttachments:[t.colorTexture],depthStencilAttachment:t.depthTexture||`depth24plus`})),{framebuffer:t.framebuffer,resized:!!o}}getTemporalAntialiasingDepthTexture(e,t){if(this.renderer instanceof ed){let t=this.renderer.getLastDepthTexture(e);if(t)return t}if(!t.depthTexture)throw Error(`ANARI temporal antialiasing requires a sampleable scene depth texture.`);return t.depthTexture}getBloomRenderer(e){return e.bloomRenderer||=new Vc(this.device,{shaderPasses:[Bh]}),e.bloomRenderer}getTemporalAntialiasingRenderer(e){return e.temporalAntialiasingRenderer||=new Vc(this.device,{shaderPasses:[Gh()],colorFormat:`rgba16float`}),e.temporalAntialiasingRenderer}};function Yh(){return{frameIndex:0,previousViewProjectionMatrix:null,previousViewMatrix:null,previousProjectionMatrix:null,previousJitter:[0,0],topologySignature:null}}function Xh(e){e.frameIndex=0,e.previousViewProjectionMatrix=null,e.previousViewMatrix=null,e.previousProjectionMatrix=null,e.previousJitter=[0,0],e.topologySignature=null}function Zh(e,t,n){let r=new P(e.camera.viewMatrix),i=new P(e.camera.projectionMatrix),a=new P(i).multiplyRight(r),o=tg(e),s=n||!t.previousViewProjectionMatrix||t.topologySignature!==o||$h(t,r,i),c=s?0:t.frameIndex,l=ng(c,e.width||1,e.height||1);return{currentViewMatrix:r,currentProjectionMatrix:i,currentViewProjectionMatrix:a,previousViewProjectionMatrix:s?a:t.previousViewProjectionMatrix,jitteredProjectionMatrix:rg(i,l),currentJitter:l,previousJitter:s?l:t.previousJitter,topologySignature:o,resetHistory:s,nextFrameIndex:(c+1)%Kh}}function Qh(e,t){e.frameIndex=t.nextFrameIndex,e.previousViewProjectionMatrix=t.currentViewProjectionMatrix,e.previousViewMatrix=t.currentViewMatrix,e.previousProjectionMatrix=t.currentProjectionMatrix,e.previousJitter=t.currentJitter,e.topologySignature=t.topologySignature}function $h(e,t,n){return e.previousViewMatrix!==null&&eg(e.previousViewMatrix,t)>qh||e.previousProjectionMatrix!==null&&eg(e.previousProjectionMatrix,n)>qh}function eg(e,t){let n=0;for(let r=0;r<16;r++)n=Math.max(n,Math.abs((e[r]||0)-(t[r]||0)));return n}function tg(e){return e.surfaces.map(e=>`${e.id}:${e.geometryVersion??0}:${e.material.id}:${e.material.version??0}:${e.transforms.length}:${e.instanceIds?.join(`,`)||``}`).sort().join(`|`)}function ng(e,t,n){let r=e%Kh+1;return[(ig(r,2)-.5)/Math.max(t,1),(ig(r,3)-.5)/Math.max(n,1)]}function rg(e,t){let n=new P(e),r=t[0]*2,i=t[1]*-2;for(let e=0;e<4;e++){let t=e*4,a=n[t+3];n[t]+=r*a,n[t+1]+=i*a}return n}function ig(e,t){let n=0,r=1,i=e;for(;i>0;)r/=t,n+=i%t*r,i=Math.floor(i/t);return n}function ag(e){e.framebuffer?.destroy(),e.colorTexture?.destroy(),e.depthTexture?.destroy(),e.framebuffer=null,e.colorTexture=null,e.depthTexture=null}var og={array:[`array1D`],camera:[`perspective`,`orthographic`],frame:[`default`],geometry:[`triangle`,`sphere`,`cylinder`,`cone`,`quad`],group:[`default`],instance:[`transform`],light:[`ambient`,`directional`,`point`,`spot`],material:[`matte`,`physicallyBased`],sampler:[`image2D`],surface:[`default`],world:[`default`]},sg=[`KHR_CAMERA_PERSPECTIVE`,`KHR_CAMERA_ORTHOGRAPHIC`,`KHR_GEOMETRY_TRIANGLE`,`KHR_GEOMETRY_SPHERE`,`KHR_GEOMETRY_CYLINDER`,`KHR_GEOMETRY_CONE`,`KHR_GEOMETRY_QUAD`,`KHR_INSTANCE_TRANSFORM`,`KHR_LIGHT_DIRECTIONAL`,`KHR_LIGHT_POINT`,`KHR_LIGHT_SPOT`,`KHR_MATERIAL_MATTE`,`KHR_MATERIAL_PHYSICALLY_BASED`,`KHR_SAMPLER_IMAGE2D`],cg=256,lg=class{device;extensions=sg;rendererRuntimeFactories=new Map;renderingRuntimes=new Map;sceneCommits=[];sceneCommitRevision=0;constructor(e){this.device=e;let t=e=>new Jh(e);this.registerRenderer(`default`,t),this.registerRenderer(`deferred`,e=>new Jh(e,{deferred:!0})),this.registerRenderer(`debugNormals`,t),this.registerRenderer(`debugDepth`,t),this.registerRenderer(`raytrace`,e=>new Ph(e))}newArray(e){return new L(this,e)}newGeometry(e,t={}){return new zl(this,e,t)}newMaterial(e,t={}){return new Bl(this,e,t)}newSampler(e,t){return new Vl(this,e,t)}newSurface(e){return new Hl(this,e)}newGroup(e={}){return new Ul(this,e)}newInstance(e){return new Wl(this,e)}newWorld(e={}){return new Gl(this,e)}newLight(e,t={}){return new Kl(this,e,t)}newCamera(e,t={}){return new ql(this,e,t)}newRenderer(e=`default`,t={}){return new Jl(this,e,t)}registerRenderer(e,t){let n=this.rendererRuntimeFactories.get(e);return this.rendererRuntimeFactories.set(e,t),n&&n!==t&&!Array.from(this.rendererRuntimeFactories.values()).includes(n)&&(this.renderingRuntimes.get(n)?.destroy(),this.renderingRuntimes.delete(n)),this}newFrame(e){return new Yl(this,e)}getObjectSubtypes(e){return e===`renderer`?Array.from(this.rendererRuntimeFactories.keys()):og[e]}getObjectInfo(e){return{type:e,subtypes:this.getObjectSubtypes(e),extensions:this.extensions}}getSceneCommitRevision(){return this.sceneCommitRevision}getSceneCommitsSince(e){return e===this.sceneCommitRevision?[]:this.sceneCommits.length===0||e<this.sceneCommits[0].revision-1?null:this.sceneCommits.filter(t=>t.revision>e)}recordSceneObjectCommit(e,t,n=!1){let r;switch(e){case`world`:case`group`:case`array`:r=[`topology`,`lights`];break;case`geometry`:case`surface`:r=[`topology`];break;case`instance`:r=n?[`topology`,`lights`]:[`transforms`];break;case`material`:case`sampler`:r=[`materials`];break;case`light`:r=[`lights`];break;default:return}this.sceneCommitRevision++,this.sceneCommits.push({revision:this.sceneCommitRevision,objectId:t,categories:r}),this.sceneCommits.length>cg&&this.sceneCommits.shift()}renderFrame(e){let t=e.getParameter(`renderer`)?.subtype??`default`,n=this.rendererRuntimeFactories.get(t);if(!n)throw Error(`ANARI renderer "${t}" is not registered.`);let r=this.renderingRuntimes.get(n);return r||(r=n(this.device),this.renderingRuntimes.set(n,r)),r.render(e)}destroyFrame(e){for(let t of this.renderingRuntimes.values())t.destroyFrame(e)}destroy(){for(let e of this.renderingRuntimes.values())e.destroy();this.renderingRuntimes.clear(),this.sceneCommits.length=0}},W=function(e){return e[e.POINTS=0]=`POINTS`,e[e.LINES=1]=`LINES`,e[e.LINE_LOOP=2]=`LINE_LOOP`,e[e.LINE_STRIP=3]=`LINE_STRIP`,e[e.TRIANGLES=4]=`TRIANGLES`,e[e.TRIANGLE_STRIP=5]=`TRIANGLE_STRIP`,e[e.TRIANGLE_FAN=6]=`TRIANGLE_FAN`,e[e.ONE=1]=`ONE`,e[e.SRC_ALPHA=770]=`SRC_ALPHA`,e[e.ONE_MINUS_SRC_ALPHA=771]=`ONE_MINUS_SRC_ALPHA`,e[e.FUNC_ADD=32774]=`FUNC_ADD`,e[e.LINEAR=9729]=`LINEAR`,e[e.NEAREST=9728]=`NEAREST`,e[e.NEAREST_MIPMAP_NEAREST=9984]=`NEAREST_MIPMAP_NEAREST`,e[e.LINEAR_MIPMAP_NEAREST=9985]=`LINEAR_MIPMAP_NEAREST`,e[e.NEAREST_MIPMAP_LINEAR=9986]=`NEAREST_MIPMAP_LINEAR`,e[e.LINEAR_MIPMAP_LINEAR=9987]=`LINEAR_MIPMAP_LINEAR`,e[e.TEXTURE_MAG_FILTER=10240]=`TEXTURE_MAG_FILTER`,e[e.TEXTURE_MIN_FILTER=10241]=`TEXTURE_MIN_FILTER`,e[e.TEXTURE_WRAP_S=10242]=`TEXTURE_WRAP_S`,e[e.TEXTURE_WRAP_T=10243]=`TEXTURE_WRAP_T`,e[e.REPEAT=10497]=`REPEAT`,e[e.CLAMP_TO_EDGE=33071]=`CLAMP_TO_EDGE`,e[e.MIRRORED_REPEAT=33648]=`MIRRORED_REPEAT`,e[e.UNPACK_FLIP_Y_WEBGL=37440]=`UNPACK_FLIP_Y_WEBGL`,e}({}),ug=[G(`baseColor`,`pbr_baseColorSampler`,`baseColorTexture`,[`pbrMetallicRoughness`,`baseColorTexture`]),G(`metallicRoughness`,`pbr_metallicRoughnessSampler`,`metallicRoughnessTexture`,[`pbrMetallicRoughness`,`metallicRoughnessTexture`]),G(`normal`,`pbr_normalSampler`,`normalTexture`,[`normalTexture`]),G(`occlusion`,`pbr_occlusionSampler`,`occlusionTexture`,[`occlusionTexture`]),G(`emissive`,`pbr_emissiveSampler`,`emissiveTexture`,[`emissiveTexture`]),G(`specularColor`,`pbr_specularColorSampler`,`KHR_materials_specular.specularColorTexture`,[`extensions`,`KHR_materials_specular`,`specularColorTexture`]),G(`specularIntensity`,`pbr_specularIntensitySampler`,`KHR_materials_specular.specularTexture`,[`extensions`,`KHR_materials_specular`,`specularTexture`]),G(`transmission`,`pbr_transmissionSampler`,`KHR_materials_transmission.transmissionTexture`,[`extensions`,`KHR_materials_transmission`,`transmissionTexture`]),G(`thickness`,`pbr_thicknessSampler`,`KHR_materials_volume.thicknessTexture`,[`extensions`,`KHR_materials_volume`,`thicknessTexture`]),G(`clearcoat`,`pbr_clearcoatSampler`,`KHR_materials_clearcoat.clearcoatTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatTexture`]),G(`clearcoatRoughness`,`pbr_clearcoatRoughnessSampler`,`KHR_materials_clearcoat.clearcoatRoughnessTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatRoughnessTexture`]),G(`clearcoatNormal`,`pbr_clearcoatNormalSampler`,`KHR_materials_clearcoat.clearcoatNormalTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatNormalTexture`]),G(`sheenColor`,`pbr_sheenColorSampler`,`KHR_materials_sheen.sheenColorTexture`,[`extensions`,`KHR_materials_sheen`,`sheenColorTexture`]),G(`sheenRoughness`,`pbr_sheenRoughnessSampler`,`KHR_materials_sheen.sheenRoughnessTexture`,[`extensions`,`KHR_materials_sheen`,`sheenRoughnessTexture`]),G(`iridescence`,`pbr_iridescenceSampler`,`KHR_materials_iridescence.iridescenceTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceTexture`]),G(`iridescenceThickness`,`pbr_iridescenceThicknessSampler`,`KHR_materials_iridescence.iridescenceThicknessTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceThicknessTexture`]),G(`anisotropy`,`pbr_anisotropySampler`,`KHR_materials_anisotropy.anisotropyTexture`,[`extensions`,`KHR_materials_anisotropy`,`anisotropyTexture`]),G(`bump`,`pbr_bumpSampler`,`EXT_materials_bump.bumpTexture`,[`extensions`,`EXT_materials_bump`,`bumpTexture`]),G(`diffuseTransmission`,`pbr_diffuseTransmissionSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionTexture`]),G(`diffuseTransmissionColor`,`pbr_diffuseTransmissionColorSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionColorTexture`]),G(`multiscatterColor`,`pbr_multiscatterColorSampler`,`KHR_materials_volume_scatter.multiscatterColorTexture`,[`extensions`,`KHR_materials_volume_scatter`,`multiscatterColorTexture`])];new Map(ug.map(e=>[e.slot,e]));function G(e,t,n,r){return{slot:e,binding:t,displayName:n,pathSegments:r,colorSpace:e===`baseColor`||e===`emissive`||e===`specularColor`||e===`sheenColor`||e===`diffuseTransmissionColor`||e===`multiscatterColor`?`srgb`:`linear`,uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function dg(){return ug}function fg(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function pg(e){return e?.extensions?.KHR_texture_transform?.texCoord??e?.texCoord??0}function mg(e){return ug.find(t=>t.pathSegments.length===e.length&&t.pathSegments.every((t,n)=>e[n]===t))||null}function hg(e){let t=new dn().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),n=new dn().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),r=new dn().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(n).multiplyRight(r))}function gg(e={}){let t=e.wrapS??e.parameters?.[W.TEXTURE_WRAP_S],n=e.wrapT??e.parameters?.[W.TEXTURE_WRAP_T],r=e.magFilter??e.parameters?.[W.TEXTURE_MAG_FILTER],i=e.minFilter??e.parameters?.[W.TEXTURE_MIN_FILTER],a=vg(t),o=vg(n),s=Sg(r);return{...a?{addressModeU:a}:{},...o?{addressModeV:o}:{},...s?{magFilter:s}:{},...Cg(i)}}function _g(e){let t=yg(e.addressModeU),n=yg(e.addressModeV),r=bg(e.magFilter),i=xg(e.minFilter,e.mipmapFilter);return{...t===void 0?{}:{wrapS:t},...n===void 0?{}:{wrapT:n},...r===void 0?{}:{magFilter:r},...i===void 0?{}:{minFilter:i}}}function vg(e){switch(e){case W.CLAMP_TO_EDGE:return`clamp-to-edge`;case W.REPEAT:return`repeat`;case W.MIRRORED_REPEAT:return`mirror-repeat`;default:return}}function yg(e){switch(e){case`clamp-to-edge`:return W.CLAMP_TO_EDGE;case`repeat`:return W.REPEAT;case`mirror-repeat`:return W.MIRRORED_REPEAT;default:return}}function bg(e){switch(e){case`nearest`:return W.NEAREST;case`linear`:return W.LINEAR;default:return}}function xg(e,t){if(e)return t===`nearest`?e===`nearest`?W.NEAREST_MIPMAP_NEAREST:W.LINEAR_MIPMAP_NEAREST:t===`linear`?e===`nearest`?W.NEAREST_MIPMAP_LINEAR:W.LINEAR_MIPMAP_LINEAR:e===`nearest`?W.NEAREST:W.LINEAR}function Sg(e){switch(e){case W.NEAREST:return`nearest`;case W.LINEAR:return`linear`;default:return}}function Cg(e){switch(e){case W.NEAREST:return{minFilter:`nearest`};case W.LINEAR:return{minFilter:`linear`};case W.NEAREST_MIPMAP_NEAREST:return{minFilter:`nearest`,mipmapFilter:`nearest`};case W.LINEAR_MIPMAP_NEAREST:return{minFilter:`linear`,mipmapFilter:`nearest`};case W.NEAREST_MIPMAP_LINEAR:return{minFilter:`nearest`,mipmapFilter:`linear`};case W.LINEAR_MIPMAP_LINEAR:return{minFilter:`linear`,mipmapFilter:`linear`};default:return{}}}function wg(e,t,n){if(`compressed`in t)return Og(e,t,{id:n.id,sampler:n.sampler});let r=n.width!==void 0&&n.height!==void 0?{width:n.width,height:n.height}:e.getExternalImageSize(t),i=n.sampler.mipmapFilter===`nearest`||n.sampler.mipmapFilter===`linear`,a=i?e.getMipLevelCount(r.width,r.height):1,o=e.createTexture({id:n.id,sampler:n.sampler,width:r.width,height:r.height,mipLevels:a,...i?{usage:v.SAMPLE|v.RENDER|v.COPY_DST|v.COPY_SRC}:{},...n.colorSpace?{format:n.colorSpace===`srgb`?`rgba8unorm-srgb`:`rgba8unorm`}:{},data:t});return a>1&&(e.type===`webgl`?o.generateMipmapsWebGL():e.type===`webgpu`&&e.generateMipmapsWebGPU(o)),o}function Tg(e,t){return e.createTexture({...t,format:`rgba8unorm`,width:1,height:1,mipLevels:1})}function Eg(e){return e.textureFormat}function Dg(e,t,n){let{blockWidth:r=1,blockHeight:i=1}=f.getInfo(n),a=1;for(let n=1;;n++){let o=Math.max(1,e>>n),s=Math.max(1,t>>n);if(o<r||s<i)break;a++}return a}function Og(e,t,n){let r;if(r=Array.isArray(t.data)&&t.data[0]?.data?t.data:`mipmaps`in t&&Array.isArray(t.mipmaps)?t.mipmaps:[],r.length===0||!r[0]?.data)return o.warn(`createCompressedTexture: compressed image has no valid mip levels, creating fallback`)(),Tg(e,n);let i=r[0],a=i.width??t.width??0,s=i.height??t.height??0;if(a<=0||s<=0)return o.warn(`createCompressedTexture: base level has invalid dimensions, creating fallback`)(),Tg(e,n);let c=Eg(i);if(!c)return o.warn(`createCompressedTexture: compressed image has no textureFormat, creating fallback`)(),Tg(e,n);if(!e.isTextureFormatSupported(c))return o.warn(`createCompressedTexture: ${e.type} device does not support '${c}', creating fallback`)(),Tg(e,n);let l=Dg(a,s,c),u=Math.min(r.length,l),d=1;for(let e=1;e<u;e++){let t=r[e];if(!t.data||t.width<=0||t.height<=0){o.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let n=Eg(t);if(n&&n!==c){o.warn(`createCompressedTexture: mip level ${e} format '${n}' differs from base '${c}', truncating`)();break}let i=Math.max(1,a>>e),l=Math.max(1,s>>e);if(t.width!==i||t.height!==l){o.warn(`createCompressedTexture: mip level ${e} dimensions ${t.width}x${t.height} don't match expected ${i}x${l}, truncating`)();break}d++}let f=e.createTexture({...n,format:c,usage:v.TEXTURE|v.COPY_DST,width:a,height:s,mipLevels:d,data:i.data});for(let e=1;e<d;e++)f.writeData(r[e].data,{width:r[e].width,height:r[e].height,mipLevel:e});return f}function kg(e,t={}){let n=t.lightDefinitions||e.lights||e.extensions?.KHR_lights_punctual?.lights;if(!n||!Array.isArray(n)||n.length===0)return[];let r=[],i=Fg(e.nodes||[]),a=new Map;for(let o of e.nodes||[]){if(!Ag(o,i,t.nodeVisibility))continue;let e=o.light??o.extensions?.KHR_lights_punctual?.light;if(typeof e!=`number`||t.nodeIdentifiers&&!t.nodeIdentifiers.has(o.id))continue;let s=n[e];if(!s)continue;let c=jg(s.color||[1,1,1],t.useByteColors??!0),l=s.intensity??1,u=s.range,d=Ig(o,i,a);switch(s.type){case`directional`:r.push(Ng(d,c,l));break;case`point`:r.push(Mg(d,c,l,u));break;case`spot`:r.push(Pg(d,c,l,u,s.spot));break;default:break}}return r}function Ag(e,t,n){let r=e;for(;r;){let e=n?.get(r.id);if(e?!e.display:r.extensions?.KHR_node_visibility?.visible===!1)return!1;r=t.get(r.id)}return!0}function jg(e,t){return t?e.map(e=>e*255):$a(e,!1)}function Mg(e,t,n,r){let i=Rg(e),a=[1,0,0];return r!==void 0&&r>0&&(a=[1,0,1/(r*r)]),{type:`point`,position:i,color:t,intensity:n,attenuation:a}}function Ng(e,t,n){return{type:`directional`,direction:zg(e),color:t,intensity:n}}function Pg(e,t,n,r,i={}){let a=Rg(e),o=zg(e),s=[1,0,0];return r!==void 0&&r>0&&(s=[1,0,1/(r*r)]),{type:`spot`,position:a,direction:o,color:t,intensity:n,attenuation:s,innerConeAngle:i.innerConeAngle??0,outerConeAngle:i.outerConeAngle??Math.PI/4}}function Fg(e){let t=new Map;for(let n of e)for(let e of n.children||[])t.set(e.id,n);return t}function Ig(e,t,n){let r=n.get(e.id);if(r)return r;let i=Lg(e),a=t.get(e.id),o=a?new P(Ig(a,t,n)).multiplyRight(i):i;return n.set(e.id,o),o}function Lg(e){if(e.matrix)return new P(e.matrix);let t=new P;return e.translation&&t.translate(e.translation),e.rotation&&t.multiplyRight(new P().fromQuaternion(e.rotation)),e.scale&&t.scale(e.scale),t}function Rg(e){return e.transformAsPoint([0,0,0])}function zg(e){return e.transformDirection([0,0,-1])}function Bg(e,t){return typeof t==`number`?t:(e.skins||[]).findIndex(n=>{if(n===t||t.id&&n.id===t.id)return!0;if(n.joints.length!==t.joints?.length||!n.joints.every((e,n)=>e===t.joints?.[n]))return!1;if(typeof t.inverseBindMatrices==`number`){let r=e.accessors[t.inverseBindMatrices];return!n.inverseBindMatrices||n.inverseBindMatrices===r}return!0})}var Vg={KHR_draco_mesh_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Decoded by loaders.gl before luma.gl builds the scenegraph.`},EXT_meshopt_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering.`},KHR_meshopt_compression:{supportLevel:`none`,standardStatus:`release-candidate`,comment:`The installed loaders.gl GLTFLoader supports EXT_meshopt_compression, not the KHR release candidate.`},KHR_mesh_quantization:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Loader-materialized quantized accessors retain their typed values and normalization.`},EXT_mesh_features:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned.`},EXT_structural_metadata:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned.`},KHR_lights_punctual:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Parsed into luma.gl Light objects.`},KHR_materials_unlit:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Unlit materials bypass the default lighting path.`},KHR_materials_emissive_strength:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Applied by the stock PBR shader.`},KHR_texture_basisu:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`BasisU / KTX2 textures pass through when the device supports them.`},KHR_texture_transform:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking.`},EXT_texture_webp:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Texture source is resolved during load; final support depends on browser and device decode support.`},EXT_texture_avif:{supportLevel:`none`,standardStatus:`ratified`,comment:`The image loader can decode supported AVIF images, but GLTFLoader does not select EXT_texture_avif sources.`},KHR_materials_specular:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies specular factors and textures to the dielectric F0 term.`},KHR_materials_ior:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now drives dielectric reflectance from the glTF IOR value.`},KHR_materials_transmission:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer.`},KHR_materials_volume:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Thickness and attenuation now tint transmitted light in the stock shader.`},KHR_materials_clearcoat:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a secondary clearcoat specular lobe.`},KHR_materials_sheen:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a sheen lobe for cloth-like materials.`},KHR_materials_iridescence:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now tints specular response with a view-dependent thin-film iridescence approximation.`},KHR_materials_anisotropy:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation.`},KHR_materials_pbrSpecularGlossiness:{supportLevel:`loader-only`,standardStatus:`archived`,comment:`Extension data can be loaded, but it is not translated into the default metallic-roughness material path.`},KHR_materials_variants:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Primitive material variants can be selected and restored on the generated scenegraph.`},EXT_mesh_gpu_instancing:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Accessor-backed instance transforms use one instanced draw per source primitive.`},KHR_node_visibility:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Recursive node visibility controls rendered geometry, punctual lights, and animation.`},KHR_animation_pointer:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates.`},EXT_materials_bump:{supportLevel:`built-in`,standardStatus:`draft`,comment:`The experimental bump-map draft perturbs the canonical surface normal from a linear height texture.`},KHR_materials_diffuse_transmission:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures.`},KHR_materials_dispersion:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction.`},KHR_materials_volume_scatter:{supportLevel:`parsed-and-wired`,standardStatus:`draft`,comment:`The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented.`},KHR_xmp:{supportLevel:`none`,standardStatus:`archived`,comment:`Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them.`},KHR_xmp_json_ld:{supportLevel:`none`,standardStatus:`ratified`,comment:`Metadata is preserved in the glTF, but luma.gl does not interpret it.`},EXT_lights_image_based:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Use loadPBREnvironment() or custom environment setup instead.`},EXT_texture_video:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Video textures are not created automatically by the stock pipeline.`},MSFT_lod:{supportLevel:`parsed-and-wired`,standardStatus:`vendor`,comment:`Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented.`}};function Hg(e){return Vg[e]||null}function Ug(e){let t=e.animations||[],n=new Map,r=new Map;return t.flatMap((t,i)=>{let a=t.name||`Animation-${i}`,o=new Map,s=t.channels.flatMap(({sampler:i,target:a})=>{let s=Yg(e,a),c=`${i}:${s??0}`,l=o.get(c);if(!l){let a=t.samplers[i];if(!a)throw Error(`Cannot find animation sampler ${i}`);let{input:u,interpolation:d=`LINEAR`,output:f}=a,p=o_(e.accessors[u],n),m=s_(e.accessors[f],r);l={input:p,interpolation:d,output:s===void 0?m:Xg(m,p.length,d,s)},o.set(c,l)}let u=Wg(e,a,l);return u?[u]:[]});return s.length?[{name:a,channels:s}]:[]})}function Wg(e,t,n){if(t.path===`pointer`)return Gg(e,t,n);let r=Qg(t.path);if(!r)return null;let i=e.nodes[t.node??0];if(!i)throw Error(`Cannot find animation target ${t.node}`);return{type:`node`,sampler:n,targetNodeId:i.id,path:r}}function Gg(e,t,n){let r=t.extensions?.KHR_animation_pointer?.pointer;if(typeof r!=`string`||!r.startsWith(`/`))return o.warn(`KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped`)(),null;let i=n_(r);switch(i[0]){case`nodes`:return Jg(e,i,n,r);case`materials`:return Zg(e,i,n,r);case`cameras`:return Kg(e,i,n,r);case`extensions`:if(i[1]===`KHR_lights_punctual`)return qg(e,i,n,r);break;default:break}return a_(r,`top-level target "${i[0]}" has no runtime animation mapping`),null}function Kg(e,t,n,r){let i=Number(t[1]),a=e.cameras?.[i],o=t[2],s=t[3];return t.length!==4||!Number.isInteger(i)||!a||o!==`perspective`&&o!==`orthographic`||a.type!==o||!(o===`perspective`?[`aspectRatio`,`yfov`,`znear`,`zfar`]:[`xmag`,`ymag`,`znear`,`zfar`]).includes(s)?(a_(r,`camera pointers must target a supported projection property`),null):{type:`camera`,sampler:n,pointer:r,targetCameraIndex:i,projection:o,property:s}}function qg(e,t,n,r){let i=Number(t[3]),a=e.lights||e.extensions?.KHR_lights_punctual?.lights,o=t[4]===`spot`,s=o?t[5]:t[4],c=!o&&s===`color`?t[5]:void 0,l=[`color`,`intensity`,`range`,`innerConeAngle`,`outerConeAngle`],u=o||c!==void 0?6:5;return t[2]!==`lights`||t.length!==u||!Number.isInteger(i)||!Array.isArray(a)||!a[i]||!l.includes(s)||o&&s!==`innerConeAngle`&&s!==`outerConeAngle`||c!==void 0&&(!/^[0-2]$/.test(c)||s!==`color`)?(a_(r,`punctual-light pointers must target supported typed light properties`),null):{type:`light`,sampler:n,pointer:r,targetLightIndex:i,property:s,...c===void 0?{}:{component:Number(c)}}}function Jg(e,t,n,r){let i=t.length===5&&t[2]===`extensions`&&t[3]===`KHR_node_visibility`&&t[4]===`visible`;if(t.length!==3&&!i)return a_(r,`node pointers must target transforms, morph weights, or KHR_node_visibility.visible`),null;let a=Number(t[1]),s=e.nodes[a];if(!Number.isInteger(a)||!s)return o.warn(`KHR_animation_pointer target ${r} references a missing node and will be skipped`)(),null;if(i&&n.interpolation!==`STEP`)return a_(r,`boolean visibility animation requires STEP interpolation`),null;let c=i?`visibility`:Qg(t[2]);return c?{type:`node`,sampler:n,targetNodeId:s.id,path:c}:(a_(r,`node property "${t[2]}" has no runtime animation mapping`),null)}function Yg(e,t){let n;if(t.path===`weights`)n=t.node;else if(t.path===`pointer`){let e=t.extensions?.KHR_animation_pointer?.pointer,r=typeof e==`string`?/^\/nodes\/(\d+)\/weights$/.exec(e):null;if(!r)return;n=Number(r[1])}else return;let r=e.nodes[n??0],i=typeof r?.mesh==`number`?e.meshes[r.mesh]:r?.mesh;return r?.weights?.length||i?.weights?.length||i?.primitives?.[0]?.targets?.length||1}function Xg(e,t,n,r){let i=n===`CUBICSPLINE`?3:1,a=e.length/(Math.max(t,1)*i),o=r>1?r:Number.isInteger(a)&&a>1?a:r;if(o<=1)return e;let s=e.flat(),c=[];for(let e=0;e<s.length;e+=o)c.push(s.slice(e,e+o));return c}function Zg(e,t,n,r){if(t.length<3)return a_(r,`material pointers must include a material index and target property path`),null;let i=Number(t[1]),a=e.materials[i];if(!Number.isInteger(i)||!a)return o.warn(`KHR_animation_pointer target ${r} references a missing material and will be skipped`)(),null;let s=$g(a,t.slice(2));return`reason`in s?(a_(r,s.reason),null):{sampler:n,pointer:r,targetMaterialIndex:i,...s}}function Qg(e){switch(e){case`translation`:case`rotation`:case`scale`:case`weights`:return e;default:return null}}function $g(e,t){let n=e_(e,t);if(!(`reason`in n)||n.reason!==`not-a-texture-transform-target`)return n;switch(t.join(`/`)){case`pbrMetallicRoughness/baseColorFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`baseColorFactor`}:{reason:K(t)};case`pbrMetallicRoughness/metallicFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:0}:{reason:K(t)};case`pbrMetallicRoughness/roughnessFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:1}:{reason:K(t)};case`normalTexture/scale`:return e.normalTexture?{type:`material`,property:`normalScale`}:{reason:K(t)};case`occlusionTexture/strength`:return e.occlusionTexture?{type:`material`,property:`occlusionStrength`}:{reason:K(t)};case`emissiveFactor`:return{type:`material`,property:`emissiveFactor`};case`alphaCutoff`:return{type:`material`,property:`alphaCutoff`};case`extensions/KHR_materials_specular/specularFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularIntensityFactor`}:{reason:K(t)};case`extensions/KHR_materials_specular/specularColorFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularColorFactor`}:{reason:K(t)};case`extensions/KHR_materials_ior/ior`:return e.extensions?.KHR_materials_ior?{type:`material`,property:`ior`}:{reason:K(t)};case`extensions/EXT_materials_bump/bumpFactor`:return e.extensions?.EXT_materials_bump?{type:`material`,property:`bumpFactor`}:{reason:K(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionFactor`}:{reason:K(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionColorFactor`}:{reason:K(t)};case`extensions/KHR_materials_volume_scatter/multiscatterColorFactor`:case`extensions/KHR_materials_volume_scatter/multiscatterColor`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`multiscatterColorFactor`}:{reason:K(t)};case`extensions/KHR_materials_volume_scatter/scatterAnisotropy`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`scatterAnisotropy`}:{reason:K(t)};case`extensions/KHR_materials_dispersion/dispersion`:return e.extensions?.KHR_materials_dispersion?{type:`material`,property:`dispersion`}:{reason:K(t)};case`extensions/KHR_materials_transmission/transmissionFactor`:return e.extensions?.KHR_materials_transmission?{type:`material`,property:`transmissionFactor`}:{reason:K(t)};case`extensions/KHR_materials_volume/thicknessFactor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`thicknessFactor`}:{reason:K(t)};case`extensions/KHR_materials_volume/attenuationDistance`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationDistance`}:{reason:K(t)};case`extensions/KHR_materials_volume/attenuationColor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationColor`}:{reason:K(t)};case`extensions/KHR_materials_clearcoat/clearcoatFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatFactor`}:{reason:K(t)};case`extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatRoughnessFactor`}:{reason:K(t)};case`extensions/KHR_materials_sheen/sheenColorFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenColorFactor`}:{reason:K(t)};case`extensions/KHR_materials_sheen/sheenRoughnessFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenRoughnessFactor`}:{reason:K(t)};case`extensions/KHR_materials_iridescence/iridescenceFactor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceFactor`}:{reason:K(t)};case`extensions/KHR_materials_iridescence/iridescenceIor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceIor`}:{reason:K(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMinimum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:0}:{reason:K(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMaximum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:1}:{reason:K(t)};case`extensions/KHR_materials_anisotropy/anisotropyStrength`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyStrength`}:{reason:K(t)};case`extensions/KHR_materials_anisotropy/anisotropyRotation`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyRotation`}:{reason:K(t)};case`extensions/KHR_materials_emissive_strength/emissiveStrength`:return e.extensions?.KHR_materials_emissive_strength?{type:`material`,property:`emissiveStrength`}:{reason:K(t)};default:return{reason:K(t)}}}function e_(e,t){let n=t.lastIndexOf(`extensions`);if(n<0||t[n+1]!==`KHR_texture_transform`||n<1)return{reason:`not-a-texture-transform-target`};let r=mg(t.slice(0,n));if(!r)return{reason:r_(t.slice(0,n))};let i=t_(e,r.pathSegments);if(!i)return{reason:`texture-transform target "${t.slice(0,n).join(`/`)}" does not exist on the referenced material`};let a=t[n+2];if(a===`texCoord`)return{reason:`animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update`};if(a!==`offset`&&a!==`rotation`&&a!==`scale`)return{reason:`KHR_texture_transform property "${a}" is not animatable; supported properties are offset, rotation, and scale`};let o=t[n+3];if(t.length>n+4)return{reason:`KHR_texture_transform.${a} does not support nested property paths`};let s;if(o!==void 0){if(s=Number(o),a===`rotation`)return{reason:`KHR_texture_transform.rotation does not support component indices`};if(!Number.isInteger(s)||s<0||s>1)return{reason:`KHR_texture_transform.${a} component index "${o}" is invalid; only 0 and 1 are supported`}}return{type:`textureTransform`,textureSlot:r.slot,path:a,component:s,baseTransform:fg(i)}}function t_(e,t){let n=e;for(let e of t)if(n=n?.[e],!n)return null;return n}function n_(e){return e.slice(1).split(`/`).map(e=>e.replace(/~1/g,`/`).replace(/~0/g,`~`))}function K(e){let t=i_(e);if(t){let e=Hg(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join(`/`)}"`}function r_(e){let t=i_(e);if(t){let e=Hg(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join(`/`)}" has no runtime texture-slot mapping`}function i_(e){let t=e.indexOf(`extensions`),n=e[t+1];return t>=0&&n?n:null}function a_(e,t){o.warn(`KHR_animation_pointer target ${e} will be skipped because ${t}`)()}function o_(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=c_(e);l_(r===1,`accessorToJsArray1D must have exactly 1 component`);let i=Array.from(n);return t.set(e,i),i}function s_(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=c_(e);l_(r>=1,`accessorToJsArray2D must have at least 1 component`);let i=[];for(let e=0;e<n.length;e+=r)i.push(Array.from(n.slice(e,e+r)));return t.set(e,i),i}function c_(e){if(e.value)return{value:e.value,components:e.components};let t=e.bufferView?.data;l_(t!==void 0),l_(e.componentType===5126);let n=e.type===`SCALAR`?1:Number(e.type.slice(3));return{value:new Float32Array(t.buffer,t.byteOffset+(e.byteOffset||0),e.count*n),components:n}}function l_(e,t){if(!e)throw Error(t)}var u_=`4.4.5`;async function d_(e,t,n,r){return r._parse(e,t,n,r)}function f_(e,t){if(!e)throw Error(t||`loader assertion failed.`)}var p_={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};p_.self||p_.window||p_.global,p_.window||p_.self||p_.global,p_.global||p_.self||p_.window,p_.document;var m_=!!(typeof process!=`object`||String(process)!==`[object process]`||process.browser),h_=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);h_&&parseFloat(h_[1]);var g_=`v4.4.5`;function __(){let e=new s({id:`loaders.gl`});return globalThis.loaders||={},globalThis.loaders.log=e,globalThis.loaders.version=g_,globalThis.probe||={},globalThis.probe.loaders=e,e}var v_=__(),y_=e=>typeof e==`boolean`,b_=e=>typeof e==`function`,x_=e=>typeof e==`object`&&!!e,S_=e=>x_(e)&&e.constructor==={}.constructor,C_=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer,w_=e=>x_(e)&&typeof e.byteLength==`number`&&typeof e.slice==`function`,T_=e=>!!e&&b_(e[Symbol.iterator]),E_=e=>!!e&&b_(e[Symbol.asyncIterator]),D_=e=>typeof Response<`u`&&e instanceof Response||x_(e)&&b_(e.arrayBuffer)&&b_(e.text)&&b_(e.json),O_=e=>typeof Blob<`u`&&e instanceof Blob,k_=e=>typeof ReadableStream<`u`&&e instanceof ReadableStream||x_(e)&&b_(e.tee)&&b_(e.cancel)&&b_(e.getReader),A_=e=>x_(e)&&b_(e.read)&&b_(e.pipe)&&y_(e.readable),j_=e=>k_(e)||A_(e);function M_(e,t){return N_(e||{},t)}function N_(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))i&&typeof i==`object`&&!Array.isArray(i)?r[e]=N_(r[e]||{},t[e],n+1):r[e]=t[e];return r}function P_(e){globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,e)}function F_(e){return globalThis.loaders?.modules?.[e]||null}var I_=`latest`;function L_(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version=`4.4.5`),globalThis._loadersgl_.version}var R_=L_();function z_(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var B_={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};B_.self||B_.window||B_.global,B_.window||B_.self||B_.global,B_.global||B_.self||B_.window,B_.document;var q=typeof process!=`object`||String(process)!==`[object process]`||process.browser,V_=typeof importScripts==`function`,H_=typeof window<`u`&&window.orientation!==void 0,U_=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);U_&&parseFloat(U_[1]);var W_=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){z_(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){z_(this.isRunning),this.isRunning=!1,this._reject(e)}},G_=class{terminate(){}},K_=new Map;function q_(e){z_(e.source&&!e.url||!e.source&&e.url);let t=K_.get(e.source||e.url);return t||(e.url&&(t=J_(e.url),K_.set(e.url,t)),e.source&&(t=Y_(e.source),K_.set(e.source,t))),z_(t),t}function J_(e){return e.startsWith(`http`)?Y_(X_(e)):e}function Y_(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function X_(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function Z_(e,t=!0,n){let r=n||new Set;if(e){if(Q_(e))r.add(e);else if(Q_(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)Z_(e[n],t,r)}return n===void 0?Array.from(r):[]}function Q_(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}var $_=()=>{},ev=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&q||G_!==void 0&&!q}constructor(e){let{name:t,source:n,url:r}=e;z_(n||r),this.name=t,this.source=n,this.url=r,this.onMessage=$_,this.onError=e=>console.log(e),this.worker=q?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=$_,this.onError=$_,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=Z_(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){this._loadableURL=q_({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url)e=new G_(this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`});else if(this.source)e=new G_(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},tv=class{name=`unnamed`;source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return ev.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new W_(t.name,e);e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!q||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new ev({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return H_?this.maxMobileConcurrency:this.maxConcurrency}},nv={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},rv=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return ev.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...nv},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r}=e,i=this.workerPools.get(t);return i||(i=new tv({name:t,source:n,url:r}),i.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,i)),i}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function iv(e,t={}){let n=t[e.id]||{},r=q?`${e.id}-worker.js`:`${e.id}-worker-node.js`,i=n.workerUrl;if(!i&&e.id===`compression`&&(i=t.workerUrl),(t._workerType||t?.core?._workerType)===`test`&&(i=q?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!i){let t=e.version;t===`latest`&&(t=I_);let n=t?`@${t}`:``;i=`https://unpkg.com/@loaders.gl/${e.module}${n}/dist/${r}`}return z_(i),i}function av(e,t=R_){z_(e,`no worker provided`);let n=e.version;return!(!t||!n)}var ov={};function sv(e={}){let t=e.useLocalLibraries??e.core?.useLocalLibraries,n=e.CDN??e.core?.CDN,r=e.modules;return{...t===void 0?{}:{useLocalLibraries:t},...n===void 0?{}:{CDN:n},...r===void 0?{}:{modules:r}}}async function cv(e,t=null,n={},r=null){return t&&(e=lv(e,t,n,r)),ov[e]=ov[e]||uv(e),await ov[e]}function lv(e,t,n={},r=null){if(n?.core)throw Error(`loadLibrary: options.core must be pre-normalized`);if(!n.useLocalLibraries&&e.startsWith(`http`))return e;r||=e;let i=n.modules||{};return i[r]?i[r]:q?n.CDN?(z_(n.CDN.startsWith(`http`)),`${n.CDN}/${t}@${R_}/dist/libs/${r}`):V_?`../src/libs/${r}`:`modules/${t}/src/libs/${r}`:`modules/${t}/dist/libs/${r}`}async function uv(e){if(e.endsWith(`wasm`))return await fv(e);if(!q){let{requireFromFile:t}=globalThis.loaders||{};try{let n=await t?.(e);return n||!e.includes(`/dist/libs/`)?n:await t?.(e.replace(`/dist/libs/`,`/src/libs/`))}catch(n){if(e.includes(`/dist/libs/`))try{return await t?.(e.replace(`/dist/libs/`,`/src/libs/`))}catch{}return console.error(n),null}}return V_?importScripts(e):dv(await pv(e),e)}function dv(e,t){if(!q){let{requireFromString:n}=globalThis.loaders||{};return n?.(e,t)}if(V_)return eval.call(globalThis,e),null;let n=document.createElement(`script`);n.id=t;try{n.appendChild(document.createTextNode(e))}catch{n.text=e}return document.body.appendChild(n),null}async function fv(e){let{readFileAsArrayBuffer:t}=globalThis.loaders||{};if(q||!t||e.startsWith(`http`))return await(await fetch(e)).arrayBuffer();try{return await t(e)}catch{if(e.includes(`/dist/libs/`))return await t(e.replace(`/dist/libs/`,`/src/libs/`));throw Error(`Failed to load ArrayBuffer from ${e}`)}}async function pv(e){let{readFileAsText:t}=globalThis.loaders||{};if(q||!t||e.startsWith(`http`))return await(await fetch(e)).text();try{return await t(e)}catch{if(e.includes(`/dist/libs/`))return await t(e.replace(`/dist/libs/`,`/src/libs/`));throw Error(`Failed to load text from ${e}`)}}function mv(e,t){if(!rv.isSupported())return!1;let n=t?._nodeWorkers??t?.core?._nodeWorkers;if(!q&&!n)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}async function hv(e,t,n,r,i){let a=e.id,o=iv(e,n),s=rv.getWorkerFarm(n?.core).getWorkerPool({name:a,url:o});n=JSON.parse(JSON.stringify(n)),r=JSON.parse(JSON.stringify(r||{}));let c=await s.startJob(`process-on-worker`,gv.bind(null,i));return c.postMessage(`process`,{input:t,options:n,context:r}),await(await c.result).result}async function gv(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{let n=await e(a,o);t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`parse-with-worker unknown message ${n}`)}}function _v(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?vv(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?vv(e,0,t):``}function vv(e,t,n){if(e.byteLength<=t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}function yv(e){try{return JSON.parse(e)}catch{throw Error(`Failed to parse JSON from data starting with "${_v(e)}"`)}}function bv(e,t,n){if(n||=e.byteLength,e.byteLength<n||t.byteLength<n)return!1;let r=new Uint8Array(e),i=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==i[e])return!1;return!0}function xv(...e){return Sv(e)}function Sv(e){let t=e.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=t.reduce((e,t)=>e+t.byteLength,0),r=new Uint8Array(n),i=0;for(let e of t)r.set(e,i),i+=e.byteLength;return r.buffer}function Cv(e,t,n){let r=n===void 0?new Uint8Array(e).subarray(t):new Uint8Array(e).subarray(t,t+n);return new Uint8Array(r).buffer}function wv(e,t){return f_(e>=0),f_(t>0),e+(t-1)&~(t-1)}function Tv(e,t,n){let r;if(e instanceof ArrayBuffer)r=new Uint8Array(e);else{let t=e.byteOffset,n=e.byteLength;r=new Uint8Array(e.buffer||e.arrayBuffer,t,n)}return t.set(r,n),n+wv(r.byteLength,4)}async function Ev(e){let t=[];for await(let n of e)t.push(Dv(n));return xv(...t)}function Dv(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return Ov(t,n,r)}return Ov(e)}function Ov(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}var kv=``,Av={};function jv(e){for(let t in Av)if(e.startsWith(t)){let n=Av[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${kv}${e}`),e}function Mv(e){return e}function Nv(e){return e&&typeof e==`object`&&e.isBuffer}function Pv(e){if(Nv(e))return Mv(e);if(e instanceof ArrayBuffer)return e;if(C_(e))return Iv(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(typeof e==`string`){let t=e;return new TextEncoder().encode(t).buffer}if(e&&typeof e==`object`&&e._toArrayBuffer)return e._toArrayBuffer();throw Error(`toArrayBuffer`)}function Fv(e){if(e instanceof ArrayBuffer)return e;if(C_(e))return Iv(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:Iv(t,n,r)}function Iv(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function Lv(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}function Rv(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function zv(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}var Bv=globalThis.loaders?.parseImageNode,Vv=typeof Image<`u`,Hv=typeof ImageBitmap<`u`,Uv=m_?!0:!!Bv;function Wv(e){switch(e){case`auto`:return Hv||Vv||Uv;case`imagebitmap`:return Hv;case`image`:return Vv;case`data`:return Uv;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}function Gv(){if(Hv)return`imagebitmap`;if(Vv)return`image`;if(Uv)return`data`;throw Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`)}function Kv(e){let t=Jv(e);if(!t)throw Error(`Not an image`);return t}function qv(e){switch(Kv(e)){case`data`:return e;case`image`:case`imagebitmap`:let t=document.createElement(`canvas`),n=t.getContext(`2d`);if(!n)throw Error(`getImageData`);return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw Error(`getImageData`)}}function Jv(e){return typeof ImageBitmap<`u`&&e instanceof ImageBitmap?`imagebitmap`:typeof Image<`u`&&e instanceof Image?`image`:e&&typeof e==`object`&&e.data&&e.width&&e.height?`data`:null}var Yv=/^data:image\/svg\+xml/,Xv=/\.svg((\?|#).*)?$/;function Zv(e){return e&&(Yv.test(e)||Xv.test(e))}function Qv(e,t){if(Zv(t)){let t=new TextDecoder().decode(e);try{typeof unescape==`function`&&typeof encodeURIComponent==`function`&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return $v(e,t)}function $v(e,t){if(Zv(t))throw Error(`SVG cannot be parsed directly to imagebitmap`);return new Blob([new Uint8Array(e)])}async function ey(e,t,n){let r=Qv(e,n),i=self.URL||self.webkitURL,a=typeof r!=`string`&&i.createObjectURL(r);try{return await ty(a||r,t)}finally{a&&i.revokeObjectURL(a)}}async function ty(e,t){let n=new Image;return n.src=e,t.image&&t.image.decode&&n.decode?(await n.decode(),n):await new Promise((e,t)=>{try{n.onload=()=>e(n),n.onerror=e=>{let n=e instanceof Error?e.message:`error`;t(Error(n))}}catch(e){t(e)}})}var ny=!0;async function ry(e,t,n){let r;r=Zv(n)?await ey(e,t,n):$v(e,n);let i=t&&t.imagebitmap;return await iy(r,i)}async function iy(e,t=null){if((ay(t)||!ny)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),ny=!1}return await createImageBitmap(e)}function ay(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function oy(e){return!uy(e,`ftyp`,4)||!(e[8]&96)?null:sy(e)}function sy(e){switch(cy(e,8,12).replace(`\0`,` `).trim()){case`avif`:case`avis`:return{extension:`avif`,mimeType:`image/avif`};default:return null}}function cy(e,t,n){return String.fromCharCode(...e.slice(t,n))}function ly(e){return[...e].map(e=>e.charCodeAt(0))}function uy(e,t,n=0){let r=ly(t);for(let t=0;t<r.length;++t)if(r[t]!==e[t+n])return!1;return!0}var dy=!1,fy=!0;function py(e){let t=by(e);return hy(t)||vy(t)||gy(t)||_y(t)||my(t)}function my(e){let t=oy(new Uint8Array(e instanceof DataView?e.buffer:e));return t?{mimeType:t.mimeType,width:0,height:0}:null}function hy(e){let t=by(e);return t.byteLength>=24&&t.getUint32(0,dy)===2303741511?{mimeType:`image/png`,width:t.getUint32(16,dy),height:t.getUint32(20,dy)}:null}function gy(e){let t=by(e);return t.byteLength>=10&&t.getUint32(0,dy)===1195984440?{mimeType:`image/gif`,width:t.getUint16(6,fy),height:t.getUint16(8,fy)}:null}function _y(e){let t=by(e);return t.byteLength>=14&&t.getUint16(0,dy)===16973&&t.getUint32(2,fy)===t.byteLength?{mimeType:`image/bmp`,width:t.getUint32(18,fy),height:t.getUint32(22,fy)}:null}function vy(e){let t=by(e);if(!(t.byteLength>=3&&t.getUint16(0,dy)===65496&&t.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:r}=yy(),i=2;for(;i+9<t.byteLength;){let e=t.getUint16(i,dy);if(r.has(e))return{mimeType:`image/jpeg`,height:t.getUint16(i+5,dy),width:t.getUint16(i+7,dy)};if(!n.has(e))return null;i+=2,i+=t.getUint16(i,dy)}return null}function yy(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function by(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error(`toDataView`)}async function xy(e,t){let{mimeType:n}=py(e)||{},r=globalThis.loaders?.parseImageNode;return f_(r),await r(e,n)}async function Sy(e,t,n){t||={};let r=(t.image||{}).type||`auto`,{url:i}=n||{},a=Cy(r),o;switch(a){case`imagebitmap`:o=await ry(e,t,i);break;case`image`:o=await ey(e,t,i);break;case`data`:o=await xy(e,t);break;default:f_(!1)}return r===`data`&&(o=qv(o)),o}function Cy(e){switch(e){case`auto`:case`data`:return Gv();default:return Wv(e),e}}var wy={dataType:null,batchType:null,id:`image`,module:`images`,name:`Images`,version:u_,mimeTypes:[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/bmp`,`image/vnd.microsoft.icon`,`image/svg+xml`],extensions:[`png`,`jpg`,`jpeg`,`gif`,`webp`,`bmp`,`ico`,`svg`,`avif`],parse:Sy,tests:[e=>!!py(new DataView(e))],options:{image:{type:`auto`,decode:!0}}},Ty={};function Ey(e){return Ty[e]===void 0&&(Ty[e]=m_?Oy(e):Dy(e)),Ty[e]}function Dy(e){let t=globalThis.loaders?.imageFormatsNode||[`image/png`,`image/jpeg`,`image/gif`];return!!globalThis.loaders?.parseImageNode&&t.includes(e)}function Oy(e){switch(e){case`image/avif`:case`image/webp`:return ky(e);default:return!0}}function ky(e){try{return document.createElement(`canvas`).toDataURL(e).indexOf(`data:${e}`)===0}catch{return!1}}function J(e,t){if(!e)throw Error(t||`assert failed: gltf`)}var Ay={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},jy={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},My=[`SCALAR`,`VEC2`,`VEC3`,`VEC4`],Ny=[[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125],[Float32Array,5126],[Float64Array,5130]],Py=new Map(Ny),Fy={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Iy={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Ly={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function Ry(e){return My[e-1]||My[0]}function zy(e){let t=Py.get(e.constructor);if(!t)throw Error(`Illegal typed array`);return t}function By(e,t){let n=Ly[e.componentType],r=Fy[e.type],i=Iy[e.componentType],a=e.count*r,o=e.count*r*i;return J(o>=0&&o<=t.byteLength),{ArrayType:n,length:a,byteLength:o,componentByteSize:jy[e.componentType],numberOfComponentsInElement:Ay[e.type]}}function Vy(e,t,n){let r=e.bufferViews[n];J(r);let i=t[r.buffer];J(i);let a=(r.byteOffset||0)+i.byteOffset;return new Uint8Array(i.arrayBuffer,a,r.byteLength)}function Hy(e,t,n){let r=typeof n==`number`?e.accessors?.[n]:n;if(!r)throw Error(`No gltf accessor ${JSON.stringify(n)}`);let i=e.bufferViews?.[r.bufferView||0];if(!i)throw Error(`No gltf buffer view for accessor ${i}`);let{arrayBuffer:a,byteOffset:o}=t[i.buffer],s=(o||0)+(r.byteOffset||0)+(i.byteOffset||0),{ArrayType:c,length:l,componentByteSize:u,numberOfComponentsInElement:d}=By(r,i),f=u*d,p=i.byteStride||f;if(i.byteStride===void 0||i.byteStride===f)return new c(a,s,l);let m=new c(l);for(let e=0;e<r.count;e++){let t=new c(a,s+e*p,d);m.set(t,e*d)}return m}function Uy(){return{asset:{version:`2.0`,generator:`loaders.gl`},buffers:[],extensions:{},extensionsRequired:[],extensionsUsed:[]}}var Y=class{gltf;sourceBuffers;byteLength;constructor(e){this.gltf={json:e?.json||Uy(),buffers:e?.buffers||[],images:e?.images||[]},this.sourceBuffers=[],this.byteLength=0,this.gltf.buffers&&this.gltf.buffers[0]&&(this.byteLength=this.gltf.buffers[0].byteLength,this.sourceBuffers=[this.gltf.buffers[0]])}get json(){return this.gltf.json}getApplicationData(e){return this.json[e]}getExtraData(e){return(this.json.extras||{})[e]}hasExtension(e){let t=this.getUsedExtensions().find(t=>t===e),n=this.getRequiredExtensions().find(t=>t===e);return typeof t==`string`||typeof n==`string`}getExtension(e){let t=this.getUsedExtensions().find(t=>t===e),n=this.json.extensions||{};return t?n[e]:null}getRequiredExtension(e){return this.getRequiredExtensions().find(t=>t===e)?this.getExtension(e):null}getRequiredExtensions(){return this.json.extensionsRequired||[]}getUsedExtensions(){return this.json.extensionsUsed||[]}getRemovedExtensions(){return this.json.extensionsRemoved||[]}getObjectExtension(e,t){return(e.extensions||{})[t]}getScene(e){return this.getObject(`scenes`,e)}getNode(e){return this.getObject(`nodes`,e)}getSkin(e){return this.getObject(`skins`,e)}getMesh(e){return this.getObject(`meshes`,e)}getMaterial(e){return this.getObject(`materials`,e)}getAccessor(e){return this.getObject(`accessors`,e)}getTexture(e){return this.getObject(`textures`,e)}getSampler(e){return this.getObject(`samplers`,e)}getImage(e){return this.getObject(`images`,e)}getBufferView(e){return this.getObject(`bufferViews`,e)}getBuffer(e){return this.getObject(`buffers`,e)}getObject(e,t){if(typeof t==`object`)return t;let n=this.json[e]&&this.json[e][t];if(!n)throw Error(`glTF file error: Could not find ${e}[${t}]`);return n}getTypedArrayForBufferView(e){e=this.getBufferView(e);let t=e.buffer,n=this.gltf.buffers[t];J(n);let r=(e.byteOffset||0)+n.byteOffset;return new Uint8Array(n.arrayBuffer,r,e.byteLength)}getTypedArrayForAccessor(e){let t=this.getAccessor(e);return Hy(this.gltf.json,this.gltf.buffers,t)}getTypedArrayForImageData(e){e=this.getAccessor(e);let t=this.getBufferView(e.bufferView),n=this.getBuffer(t.buffer).data,r=t.byteOffset||0;return new Uint8Array(n,r,t.byteLength)}addApplicationData(e,t){return this.json[e]=t,this}addExtraData(e,t){return this.json.extras=this.json.extras||{},this.json.extras[e]=t,this}addObjectExtension(e,t,n){return e.extensions=e.extensions||{},e.extensions[t]=n,this.registerUsedExtension(t),this}setObjectExtension(e,t,n){let r=e.extensions||{};r[t]=n}removeObjectExtension(e,t){let n=e?.extensions||{};if(n[t]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let e=this.json.extensionsRemoved;e.includes(t)||e.push(t)}delete n[t]}addExtension(e,t={}){return J(t),this.json.extensions=this.json.extensions||{},this.json.extensions[e]=t,this.registerUsedExtension(e),t}addRequiredExtension(e,t={}){return J(t),this.addExtension(e,t),this.registerRequiredExtension(e),t}registerUsedExtension(e){this.json.extensionsUsed=this.json.extensionsUsed||[],this.json.extensionsUsed.find(t=>t===e)||this.json.extensionsUsed.push(e)}registerRequiredExtension(e){this.registerUsedExtension(e),this.json.extensionsRequired=this.json.extensionsRequired||[],this.json.extensionsRequired.find(t=>t===e)||this.json.extensionsRequired.push(e)}removeExtension(e){if(this.json.extensions?.[e]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let t=this.json.extensionsRemoved;t.includes(e)||t.push(e)}this.json.extensions&&delete this.json.extensions[e],this.json.extensionsRequired&&this._removeStringFromArray(this.json.extensionsRequired,e),this.json.extensionsUsed&&this._removeStringFromArray(this.json.extensionsUsed,e)}setDefaultScene(e){this.json.scene=e}addScene(e){let{nodeIndices:t}=e;return this.json.scenes=this.json.scenes||[],this.json.scenes.push({nodes:t}),this.json.scenes.length-1}addNode(e){let{meshIndex:t,matrix:n}=e;this.json.nodes=this.json.nodes||[];let r={mesh:t};return n&&(r.matrix=n),this.json.nodes.push(r),this.json.nodes.length-1}addMesh(e){let{attributes:t,indices:n,material:r,mode:i=4}=e,a={primitives:[{attributes:this._addAttributes(t),mode:i}]};if(n){let e=this._addIndices(n);a.primitives[0].indices=e}return Number.isFinite(r)&&(a.primitives[0].material=r),this.json.meshes=this.json.meshes||[],this.json.meshes.push(a),this.json.meshes.length-1}addPointCloud(e){let t={primitives:[{attributes:this._addAttributes(e),mode:0}]};return this.json.meshes=this.json.meshes||[],this.json.meshes.push(t),this.json.meshes.length-1}addImage(e,t){let n=py(e),r=t||n?.mimeType,i={bufferView:this.addBufferView(e),mimeType:r};return this.json.images=this.json.images||[],this.json.images.push(i),this.json.images.length-1}addBufferView(e,t=0,n=this.byteLength){let r=e.byteLength;J(Number.isFinite(r)),this.sourceBuffers=this.sourceBuffers||[],this.sourceBuffers.push(e);let i={buffer:t,byteOffset:n,byteLength:r};return this.byteLength+=wv(r,4),this.json.bufferViews=this.json.bufferViews||[],this.json.bufferViews.push(i),this.json.bufferViews.length-1}addAccessor(e,t){let n={bufferView:e,type:Ry(t.size),componentType:t.componentType,count:t.count,max:t.max,min:t.min};return this.json.accessors=this.json.accessors||[],this.json.accessors.push(n),this.json.accessors.length-1}addBinaryBuffer(e,t={size:3}){let n=this.addBufferView(e),r={min:t.min,max:t.max};(!r.min||!r.max)&&(r=this._getAccessorMinMax(e,t.size));let i={size:t.size,componentType:zy(e),count:Math.round(e.length/t.size),min:r.min,max:r.max};return this.addAccessor(n,Object.assign(i,t))}addTexture(e){let{imageIndex:t}=e,n={source:t};return this.json.textures=this.json.textures||[],this.json.textures.push(n),this.json.textures.length-1}addMaterial(e){return this.json.materials=this.json.materials||[],this.json.materials.push(e),this.json.materials.length-1}createBinaryChunk(){let e=this.byteLength,t=new ArrayBuffer(e),n=new Uint8Array(t),r=0;for(let e of this.sourceBuffers||[])r=Tv(e,n,r);this.json?.buffers?.[0]?this.json.buffers[0].byteLength=e:this.json.buffers=[{byteLength:e}],this.gltf.binary=t,this.sourceBuffers=[t],this.gltf.buffers=[{arrayBuffer:t,byteOffset:0,byteLength:t.byteLength}]}_removeStringFromArray(e,t){let n=!0;for(;n;){let r=e.indexOf(t);r>-1?e.splice(r,1):n=!1}}_addAttributes(e={}){let t={};for(let n in e){let r=e[n],i=this._getGltfAttributeName(n);t[i]=this.addBinaryBuffer(r.value,r)}return t}_addIndices(e){return this.addBinaryBuffer(e,{size:1})}_getGltfAttributeName(e){switch(e.toLowerCase()){case`position`:case`positions`:case`vertices`:return`POSITION`;case`normal`:case`normals`:return`NORMAL`;case`color`:case`colors`:return`COLOR_0`;case`texcoord`:case`texcoords`:return`TEXCOORD_0`;default:return e}}_getAccessorMinMax(e,t){let n={min:null,max:null};if(e.length<t)return n;n.min=[],n.max=[];let r=e.subarray(0,t);for(let e of r)n.min.push(e),n.max.push(e);for(let r=t;r<e.length;r+=t)for(let i=0;i<t;i++)n.min[0+i]=Math.min(n.min[0+i],e[r+i]),n.max[0+i]=Math.max(n.max[0+i],e[r+i]);return n}};function Wy(e){return(e%1+1)%1}var Gy={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16,BOOLEAN:1,STRING:1,ENUM:1},Ky={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:BigInt64Array,UINT64:BigUint64Array,FLOAT32:Float32Array,FLOAT64:Float64Array},qy={INT8:1,UINT8:1,INT16:2,UINT16:2,INT32:4,UINT32:4,INT64:8,UINT64:8,FLOAT32:4,FLOAT64:8};function Jy(e,t){return qy[t]*Gy[e]}function Yy(e,t,n,r){if(n!==`UINT8`&&n!==`UINT16`&&n!==`UINT32`&&n!==`UINT64`)return null;let i=Xy(e.getTypedArrayForBufferView(t),`SCALAR`,n,r+1);return i instanceof BigInt64Array||i instanceof BigUint64Array?null:i}function Xy(e,t,n,r=1){let i=Gy[t],a=Ky[n],o=qy[n],s=r*i,c=s*o,l=e.buffer,u=e.byteOffset;return u%o!==0&&(l=new Uint8Array(l).slice(u,u+c).buffer,u=0),new a(Fv(l),u,s)}function Zy(e,t,n){let r=`TEXCOORD_${t.texCoord||0}`,i=n.attributes[r],a=e.getTypedArrayForAccessor(i),o=e.gltf.json,s=t.index,c=o.textures?.[s]?.source;if(c!==void 0){let n=o.images?.[c]?.mimeType,r=e.gltf.images?.[c];if(r&&r.width!==void 0){let e=[];for(let i=0;i<a.length;i+=2){let o=$y(r,n,a,i,t.channels);e.push(o)}return e}}return[]}function Qy(e,t,n,r,i){if(!n?.length)return;let a=[];for(let e of n){let t=r.findIndex(t=>t===e);t===-1&&(t=r.push(e)-1),a.push(t)}let o=new Uint32Array(a),s=e.gltf.buffers.push({arrayBuffer:o.buffer,byteOffset:o.byteOffset,byteLength:o.byteLength})-1,c=e.addBufferView(o,s,0),l=e.addAccessor(c,{size:1,componentType:zy(o),count:o.length});i.attributes[t]=l}function $y(e,t,n,r,i=[0]){let a={r:{offset:0,shift:0},g:{offset:1,shift:8},b:{offset:2,shift:16},a:{offset:3,shift:24}},o=n[r],s=n[r+1],c=1;t&&(t.indexOf(`image/jpeg`)!==-1||t.indexOf(`image/png`)!==-1)&&(c=4);let l=eb(o,s,e,c),u=0;for(let t of i){let n=typeof t==`number`?Object.values(a)[t]:a[t],r=l+n.offset,i=qv(e);if(i.data.length<=r)throw Error(`${i.data.length} <= ${r}`);let o=i.data[r];u|=o<<n.shift}return u}function eb(e,t,n,r=1){let i=n.width,a=Wy(e)*(i-1),o=Math.round(a),s=n.height,c=Wy(t)*(s-1),l=Math.round(c),u=n.components?n.components:r;return(l*i+o)*u}function tb(e,t,n,r,i){let a=[];for(let o=0;o<t;o++){let t=n[o],s=n[o+1]-n[o];if(s+t>r)break;let c=t/i,l=s/i;a.push(e.slice(c,c+l))}return a}function nb(e,t,n){let r=[];for(let i=0;i<t;i++){let t=i*n;r.push(e.slice(t,t+n))}return r}function rb(e,t,n,r){if(n)throw Error(`Not implemented - arrayOffsets for strings is specified`);if(r){let n=[],i=new TextDecoder(`utf8`),a=0;for(let o=0;o<e;o++){let e=r[o+1]-r[o];if(e+a<=t.length){let r=t.subarray(a,e+a),o=i.decode(r);n.push(o),a+=e}}return n}return[]}var ib=e({createExtMeshFeatures:()=>fb,decode:()=>sb,encode:()=>cb,name:()=>ob}),ab=`EXT_mesh_features`,ob=ab;async function sb(e,t){lb(new Y(e),t)}function cb(e,t){let n=new Y(e);return db(n,t),n.createBinaryChunk(),n.gltf}function lb(e,t){let n=e.gltf.json;if(n.meshes)for(let r of n.meshes)for(let n of r.primitives)ub(e,n,t)}function ub(e,t,n){if(!n?.gltf?.loadBuffers)return;let r=t.extensions?.[ab]?.featureIds;if(r)for(let i of r){let r;if(i.attribute!==void 0){let n=`_FEATURE_ID_${i.attribute}`,a=t.attributes[n];r=e.getTypedArrayForAccessor(a)}else r=i.texture!==void 0&&n?.gltf?.loadImages?Zy(e,i.texture,t):[];i.data=r}}function db(e,t){let n=e.gltf.json.meshes;if(n)for(let t of n)for(let n of t.primitives)pb(e,n)}function fb(e,t,n,r){t.extensions||={};let i=t.extensions[ab];i||(i={featureIds:[]},t.extensions[ab]=i);let{featureIds:a}=i,o={featureCount:n.length,propertyTable:r,data:n};a.push(o),e.addObjectExtension(t,ab,i)}function pb(e,t){let n=t.extensions?.[ab];if(!n)return;let r=n.featureIds;r.forEach((n,i)=>{if(n.data){let{accessorKey:a,index:o}=mb(t.attributes),s=new Uint32Array(n.data);r[i]={featureCount:s.length,propertyTable:n.propertyTable,attribute:o},e.gltf.buffers.push({arrayBuffer:s.buffer,byteOffset:s.byteOffset,byteLength:s.byteLength});let c=e.addBufferView(s),l=e.addAccessor(c,{size:1,componentType:zy(s),count:s.length});t.attributes[a]=l}})}function mb(e){let t=`_FEATURE_ID_`,n=Object.keys(e).filter(e=>e.indexOf(t)===0),r=-1;for(let e of n){let t=Number(e.substring(12));t>r&&(r=t)}return r++,{accessorKey:`${t}${r}`,index:r}}var hb=e({createExtStructuralMetadata:()=>zb,decode:()=>vb,encode:()=>yb,name:()=>_b}),gb=`EXT_structural_metadata`,_b=gb;async function vb(e,t){bb(new Y(e),t)}function yb(e,t){let n=new Y(e);return Lb(n,t),n.createBinaryChunk(),n.gltf}function bb(e,t){if(!t.gltf?.loadBuffers)return;let n=e.getExtension(gb);n&&(t.gltf?.loadImages&&xb(e,n),Sb(e,n))}function xb(e,t){let n=t.propertyTextures,r=e.gltf.json;if(n&&r.meshes)for(let i of r.meshes)for(let r of i.primitives)wb(e,n,r,t)}function Sb(e,t){let n=t.schema;if(!n)return;let r=n.classes,i=t.propertyTables;if(r&&i)for(let t in r){let r=Cb(i,t);r&&Eb(e,n,r)}}function Cb(e,t){for(let n of e)if(n.class===t)return n;return null}function wb(e,t,n,r){if(!t)return;let i=n.extensions?.[gb]?.propertyTextures;if(i)for(let a of i){let i=t[a];Tb(e,i,n,r)}}function Tb(e,t,n,r){if(!t.properties)return;r.dataAttributeNames||=[];let i=t.class;for(let a in t.properties){let o=`${i}_${a}`,s=t.properties?.[a];if(!s)continue;s.data||=[];let c=s.data,l=Zy(e,s,n);l!==null&&(Qy(e,o,l,c,n),s.data=c,r.dataAttributeNames.push(o))}}function Eb(e,t,n){let r=t.classes?.[n.class];if(!r)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${n.class}`);let i=n.count;for(let a in r.properties){let o=r.properties[a],s=n.properties?.[a];s&&(s.data=Db(e,t,o,i,s))}}function Db(e,t,n,r,i){let a=[],o=i.values,s=e.getTypedArrayForBufferView(o),c=Ob(e,n,i,r),l=kb(e,i,r);switch(n.type){case`SCALAR`:case`VEC2`:case`VEC3`:case`VEC4`:case`MAT2`:case`MAT3`:case`MAT4`:a=Ab(n,r,s,c);break;case`BOOLEAN`:throw Error(`Not implemented - classProperty.type=${n.type}`);case`STRING`:a=rb(r,s,c,l);break;case`ENUM`:a=jb(t,n,r,s,c);break;default:throw Error(`Unknown classProperty type ${n.type}`)}return a}function Ob(e,t,n,r){return t.array&&t.count===void 0&&n.arrayOffsets!==void 0?Yy(e,n.arrayOffsets,n.arrayOffsetType||`UINT32`,r):null}function kb(e,t,n){return t.stringOffsets===void 0?null:Yy(e,t.stringOffsets,t.stringOffsetType||`UINT32`,n)}function Ab(e,t,n,r){let i=e.array,a=e.count,o=Jy(e.type,e.componentType),s=n.byteLength/o,c;return c=e.componentType?Xy(n,e.type,e.componentType,s):n,i?r?tb(c,t,r,n.length,o):a?nb(c,t,a):[]:c}function jb(e,t,n,r,i){let a=t.enumType;if(!a)throw Error(`Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM`);let o=e.enums?.[a];if(!o)throw Error(`Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${a}`);let s=o.valueType||`UINT16`,c=Jy(t.type,s),l=r.byteLength/c,u=Xy(r,t.type,s,l);if(u||=r,t.array){if(i)return Mb({valuesData:u,numberOfElements:n,arrayOffsets:i,valuesDataBytesLength:r.length,elementSize:c,enumEntry:o});let e=t.count;return e?Nb(u,n,e,o):[]}return Pb(u,0,n,o)}function Mb(e){let{valuesData:t,numberOfElements:n,arrayOffsets:r,valuesDataBytesLength:i,elementSize:a,enumEntry:o}=e,s=[];for(let e=0;e<n;e++){let n=r[e],c=r[e+1]-r[e];if(c+n>i)break;let l=Pb(t,n/a,c/a,o);s.push(l)}return s}function Nb(e,t,n,r){let i=[];for(let a=0;a<t;a++){let t=Pb(e,n*a,n,r);i.push(t)}return i}function Pb(e,t,n,r){let i=[];for(let a=0;a<n;a++)if(e instanceof BigInt64Array||e instanceof BigUint64Array)i.push(``);else{let n=e[t+a],o=Fb(r,n);o?i.push(o.name):i.push(``)}return i}function Fb(e,t){for(let n of e.values)if(n.value===t)return n;return null}var Ib=`schemaClassId`;function Lb(e,t){let n=e.getExtension(gb);if(n&&n.propertyTables)for(let t of n.propertyTables){let r=t.class,i=n.schema?.classes?.[r];t.properties&&i&&Rb(t,i,e)}}function Rb(e,t,n){for(let r in e.properties){let i=e.properties[r].data;if(i){let a=t.properties[r];if(a){let t=Hb(i,a,n);e.properties[r]=t}}}}function zb(e,t,n=Ib){let r=e.getExtension(gb);r||=e.addExtension(gb),r.schema=Bb(t,n,r.schema);let i=Vb(t,n,r.schema);return r.propertyTables||=[],r.propertyTables.push(i)-1}function Bb(e,t,n){let r=n??{id:`schema_id`},i={properties:{}};for(let t of e){let e={type:t.elementType,componentType:t.componentType};i.properties[t.name]=e}return r.classes={},r.classes[t]=i,r}function Vb(e,t,n){let r={class:t,count:0},i=0,a=n.classes?.[t];for(let t of e){if(i===0&&(i=t.values.length),i!==t.values.length&&t.values.length)throw Error(`Illegal values in attributes`);a?.properties[t.name]&&(r.properties||={},r.properties[t.name]={values:0,data:t.values})}return r.count=i,r}function Hb(e,t,n){let r={values:0};if(t.type===`STRING`){let{stringData:t,stringOffsets:i}=Gb(e);r.stringOffsets=Kb(i,n),r.values=Kb(t,n)}else t.type===`SCALAR`&&t.componentType&&(r.values=Kb(Wb(e,t.componentType),n));return r}var Ub={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:Int32Array,UINT64:Uint32Array,FLOAT32:Float32Array,FLOAT64:Float64Array};function Wb(e,t){let n=[];for(let t of e)n.push(Number(t));let r=Ub[t];if(!r)throw Error(`Illegal component type`);return new r(n)}function Gb(e){let t=new TextEncoder,n=[],r=0;for(let i of e){let e=t.encode(i);r+=e.length,n.push(e)}let i=new Uint8Array(r),a=[],o=0;for(let e of n)i.set(e,o),a.push(o),o+=e.length;return a.push(o),{stringData:i,stringOffsets:new Uint32Array(a)}}function Kb(e,t){return t.gltf.buffers.push({arrayBuffer:Fv(e.buffer),byteOffset:e.byteOffset,byteLength:e.byteLength}),t.addBufferView(e)}var qb=e({decode:()=>Xb,name:()=>Yb}),Jb=`EXT_feature_metadata`,Yb=Jb;async function Xb(e,t){Zb(new Y(e),t)}function Zb(e,t){if(!t.gltf?.loadBuffers)return;let n=e.getExtension(Jb);n&&(t.gltf?.loadImages&&Qb(e,n),$b(e,n))}function Qb(e,t){let n=t.schema;if(!n)return;let r=n.classes,{featureTextures:i}=t;if(r&&i)for(let t in r){let n=r[t],a=tx(i,t);a&&rx(e,a,n)}}function $b(e,t){let n=t.schema;if(!n)return;let r=n.classes,i=t.featureTables;if(r&&i)for(let t in r){let r=ex(i,t);r&&nx(e,n,r)}}function ex(e,t){for(let n in e){let r=e[n];if(r.class===t)return r}return null}function tx(e,t){for(let n in e){let r=e[n];if(r.class===t)return r}return null}function nx(e,t,n){if(!n.class)return;let r=t.classes?.[n.class];if(!r)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${n.class}`);let i=n.count;for(let a in r.properties){let o=r.properties[a],s=n.properties?.[a];s&&(s.data=ix(e,t,o,i,s))}}function rx(e,t,n){let r=t.class;for(let i in n.properties){let n=t?.properties?.[i];n&&(n.data=lx(e,n,r))}}function ix(e,t,n,r,i){let a=[],o=i.bufferView,s=e.getTypedArrayForBufferView(o),c=ax(e,n,i,r),l=ox(e,n,i,r);return n.type===`STRING`||n.componentType===`STRING`?a=rb(r,s,c,l):sx(n)&&(a=cx(n,r,s,c)),a}function ax(e,t,n,r){return t.type===`ARRAY`&&t.componentCount===void 0&&n.arrayOffsetBufferView!==void 0?Yy(e,n.arrayOffsetBufferView,n.offsetType||`UINT32`,r):null}function ox(e,t,n,r){return n.stringOffsetBufferView===void 0?null:Yy(e,n.stringOffsetBufferView,n.offsetType||`UINT32`,r)}function sx(e){let t=[`UINT8`,`INT16`,`UINT16`,`INT32`,`UINT32`,`INT64`,`UINT64`,`FLOAT32`,`FLOAT64`];return t.includes(e.type)||e.componentType!==void 0&&t.includes(e.componentType)}function cx(e,t,n,r){let i=e.type===`ARRAY`,a=e.componentCount,o=`SCALAR`,s=e.componentType||e.type,c=Jy(o,s),l=Xy(n,o,s,n.byteLength/c);return i?r?tb(l,t,r,n.length,c):a?nb(l,t,a):[]:l}function lx(e,t,n){let r=e.gltf.json;if(!r.meshes)return[];let i=[];for(let a of r.meshes)for(let r of a.primitives)ux(e,n,t,i,r);return i}function ux(e,t,n,r,i){let a=Zy(e,{channels:n.channels,...n.texture},i);a&&Qy(e,t,a,r,i)}var dx=`4.4.5`,fx=`4.4.5`,px={TRANSCODER:`basis_transcoder.js`,TRANSCODER_WASM:`basis_transcoder.wasm`,ENCODER:`basis_encoder.js`,ENCODER_WASM:`basis_encoder.wasm`},mx;async function hx(e){return P_(e.modules),F_(`basis`)||(mx||=gx(e),await mx)}async function gx(e){let t=null,n=null;return[t,n]=await Promise.all([await cv(px.TRANSCODER,`textures`,e),await cv(px.TRANSCODER_WASM,`textures`,e)]),t||=globalThis.BASIS,await _x(t,n)}function _x(e,t){let n={};return t&&(n.wasmBinary=t),new Promise(t=>{e(n).then(e=>{let{BasisFile:n,initializeBasis:r}=e;r(),t({BasisFile:n})})})}var vx;async function yx(e){let t=e.modules||{};return t.basisEncoder?t.basisEncoder:(vx||=bx(e),await vx)}async function bx(e){let t=null,n=null;return[t,n]=await Promise.all([await cv(px.ENCODER,`textures`,e),await cv(px.ENCODER_WASM,`textures`,e)]),t||=globalThis.BASIS,await xx(t,n)}function xx(e,t){let n={};return t&&(n.wasmBinary=t),new Promise(t=>{e(n).then(e=>{let{BasisFile:n,KTX2File:r,initializeBasis:i,BasisEncoder:a}=e;i(),t({BasisFile:n,KTX2File:r,BasisEncoder:a})})})}var Sx=32854,Cx=32856,wx=36194,Tx=33776,Ex=33779,Dx=37493,Ox=35840,kx=35842,Ax=36196,jx=35986,Mx=34798,Nx=37808,Px=36283,Fx=36285,Ix=36492,Lx=[``,`WEBKIT_`,`MOZ_`],Rx={WEBGL_compressed_texture_s3tc:[`bc1-rgb-unorm-webgl`,`bc1-rgba-unorm`,`bc2-rgba-unorm`,`bc3-rgba-unorm`],WEBGL_compressed_texture_s3tc_srgb:[`bc1-rgb-unorm-srgb-webgl`,`bc1-rgba-unorm-srgb`,`bc2-rgba-unorm-srgb`,`bc3-rgba-unorm-srgb`],EXT_texture_compression_rgtc:[`bc4-r-unorm`,`bc4-r-snorm`,`bc5-rg-unorm`,`bc5-rg-snorm`],EXT_texture_compression_bptc:[`bc6h-rgb-ufloat`,`bc6h-rgb-float`,`bc7-rgba-unorm`,`bc7-rgba-unorm-srgb`],WEBGL_compressed_texture_etc1:[`etc1-rgb-unorm-webgl`],WEBGL_compressed_texture_etc:[`etc2-rgb8unorm`,`etc2-rgb8unorm-srgb`,`etc2-rgb8a1unorm`,`etc2-rgb8a1unorm-srgb`,`etc2-rgba8unorm`,`etc2-rgba8unorm-srgb`,`eac-r11unorm`,`eac-r11snorm`,`eac-rg11unorm`,`eac-rg11snorm`],WEBGL_compressed_texture_pvrtc:[`pvrtc-rgb4unorm-webgl`,`pvrtc-rgba4unorm-webgl`,`pvrtc-rgb2unorm-webgl`,`pvrtc-rgba2unorm-webgl`],WEBGL_compressed_texture_atc:[`atc-rgb-unorm-webgl`,`atc-rgba-unorm-webgl`,`atc-rgbai-unorm-webgl`],WEBGL_compressed_texture_astc:`astc-4x4-unorm.astc-4x4-unorm-srgb.astc-5x4-unorm.astc-5x4-unorm-srgb.astc-5x5-unorm.astc-5x5-unorm-srgb.astc-6x5-unorm.astc-6x5-unorm-srgb.astc-6x6-unorm.astc-6x6-unorm-srgb.astc-8x5-unorm.astc-8x5-unorm-srgb.astc-8x6-unorm.astc-8x6-unorm-srgb.astc-8x8-unorm.astc-8x8-unorm-srgb.astc-10x5-unorm.astc-10x5-unorm-srgb.astc-10x6-unorm.astc-10x6-unorm-srgb.astc-10x8-unorm.astc-10x8-unorm-srgb.astc-10x10-unorm.astc-10x10-unorm-srgb.astc-12x10-unorm.astc-12x10-unorm-srgb.astc-12x12-unorm.astc-12x12-unorm-srgb`.split(`.`)},zx=null;function Bx(e){if(!zx){e=e||Vx()||void 0,zx=new Set;for(let t of Lx)for(let n in Rx)if(e&&e.getExtension(`${t}${n}`))for(let e of Rx[n])zx.add(e)}return zx}function Vx(){try{return document.createElement(`canvas`).getContext(`webgl`)}catch{return null}}var Hx=[171,75,84,88,32,50,48,187,13,10,26,10];function Ux(e){let t=new Uint8Array(e);return!(t.byteLength<Hx.length||t[0]!==Hx[0]||t[1]!==Hx[1]||t[2]!==Hx[2]||t[3]!==Hx[3]||t[4]!==Hx[4]||t[5]!==Hx[5]||t[6]!==Hx[6]||t[7]!==Hx[7]||t[8]!==Hx[8]||t[9]!==Hx[9]||t[10]!==Hx[10]||t[11]!==Hx[11])}var Wx=Promise.resolve(),Gx={etc1:{basisFormat:0,compressed:!0,format:Ax,textureFormat:`etc1-rgb-unorm-webgl`},etc2:{basisFormat:1,compressed:!0,format:Dx,textureFormat:`etc2-rgba8unorm`},bc1:{basisFormat:2,compressed:!0,format:Tx,textureFormat:`bc1-rgb-unorm-webgl`},bc3:{basisFormat:3,compressed:!0,format:Ex,textureFormat:`bc3-rgba-unorm`},bc4:{basisFormat:4,compressed:!0,format:Px,textureFormat:`bc4-r-unorm`},bc5:{basisFormat:5,compressed:!0,format:Fx,textureFormat:`bc5-rg-unorm`},"bc7-m6-opaque-only":{basisFormat:6,compressed:!0,format:Ix,textureFormat:`bc7-rgba-unorm`},"bc7-m5":{basisFormat:7,compressed:!0,format:Ix,textureFormat:`bc7-rgba-unorm`},"pvrtc1-4-rgb":{basisFormat:8,compressed:!0,format:Ox,textureFormat:`pvrtc-rgb4unorm-webgl`},"pvrtc1-4-rgba":{basisFormat:9,compressed:!0,format:kx,textureFormat:`pvrtc-rgba4unorm-webgl`},"astc-4x4":{basisFormat:10,compressed:!0,format:Nx,textureFormat:`astc-4x4-unorm`},"atc-rgb":{basisFormat:11,compressed:!0,format:jx,textureFormat:`atc-rgb-unorm-webgl`},"atc-rgba-interpolated-alpha":{basisFormat:12,compressed:!0,format:Mx,textureFormat:`atc-rgbai-unorm-webgl`},rgba32:{basisFormat:13,compressed:!1,format:Cx,textureFormat:`rgba8unorm`},rgb565:{basisFormat:14,compressed:!1,format:wx,textureFormat:`rgb565unorm-webgl`},bgr565:{basisFormat:15,compressed:!1,format:wx,textureFormat:`rgb565unorm-webgl`},rgba4444:{basisFormat:16,compressed:!1,format:Sx,textureFormat:`rgba4unorm-webgl`}};Object.freeze(Object.keys(Gx));async function Kx(e){let t=Wx,n;Wx=new Promise(e=>{n=e}),await t;try{return await e()}finally{n()}}async function qx(e,t={}){let n=sv(t);return await Kx(async()=>{if(!t.basis?.containerFormat||t.basis.containerFormat===`auto`){if(Ux(e))return Xx((await yx(n)).KTX2File,e,t);let{BasisFile:r}=await hx(n);return Jx(r,e,t)}switch(t.basis.module){case`encoder`:let r=await yx(n);switch(t.basis.containerFormat){case`ktx2`:return Xx(r.KTX2File,e,t);default:return Jx(r.BasisFile,e,t)}default:let{BasisFile:i}=await hx(n);return Jx(i,e,t)}})}function Jx(e,t,n){let r=new e(new Uint8Array(t));try{if(!r.startTranscoding())throw Error(`Failed to start basis transcoding`);let e=r.getNumImages(),t=[];for(let i=0;i<e;i++){let e=r.getNumLevels(i),a=[];for(let t=0;t<e;t++)a.push(Yx(r,i,t,n));t.push(a)}return t}finally{r.close(),r.delete()}}function Yx(e,t,n,r){let i=e.getImageWidth(t,n),a=e.getImageHeight(t,n),o=e.getHasAlpha(),{compressed:s,format:c,basisFormat:l,textureFormat:u}=Qx(r,o),d=e.getImageTranscodedSizeInBytes(t,n,l),f=new Uint8Array(d);if(!e.transcodeImage(f,t,n,l,0,0))throw Error(`failed to start Basis transcoding`);return{shape:`texture-level`,width:i,height:a,data:f,compressed:s,...c===void 0?{}:{format:c},...u===void 0?{}:{textureFormat:u},hasAlpha:o}}function Xx(e,t,n){let r=new e(new Uint8Array(t));try{if(!r.startTranscoding())throw Error(`failed to start KTX2 transcoding`);let e=r.getLevels(),t=[];for(let i=0;i<e;i++)t.push(Zx(r,i,n));return[t]}finally{r.close(),r.delete()}}function Zx(e,t,n){let{alphaFlag:r,height:i,width:a}=e.getImageLevelInfo(t,0,0),{compressed:o,format:s,basisFormat:c,textureFormat:l}=Qx(n,r),u=e.getImageTranscodedSizeInBytes(t,0,0,c),d=new Uint8Array(u);if(!e.transcodeImage(d,t,0,0,c,0,-1,-1))throw Error(`Failed to transcode KTX2 image`);return{shape:`texture-level`,width:a,height:i,data:d,compressed:o,...s===void 0?{}:{format:s},...l===void 0?{}:{textureFormat:l},levelSize:u,hasAlpha:r}}function Qx(e,t){let n=e.basis?.format||`auto`;n===`auto`&&(n=e.basis?.supportedTextureFormats?$x(e.basis.supportedTextureFormats):$x()),typeof n==`object`&&(n=t?n.alpha:n.noAlpha);let r=Gx[n.toLowerCase()];if(!r)throw Error(`Unknown Basis format ${n}`);return r}function $x(e=Bx()){let t=new Set(e);return eS(t,[`astc-4x4-unorm`,`astc-4x4-unorm-srgb`])?`astc-4x4`:eS(t,[`bc7-rgba-unorm`,`bc7-rgba-unorm-srgb`])?{alpha:`bc7-m5`,noAlpha:`bc7-m6-opaque-only`}:eS(t,[`bc1-rgb-unorm-webgl`,`bc1-rgb-unorm-srgb-webgl`,`bc1-rgba-unorm`,`bc1-rgba-unorm-srgb`,`bc2-rgba-unorm`,`bc2-rgba-unorm-srgb`,`bc3-rgba-unorm`,`bc3-rgba-unorm-srgb`])?{alpha:`bc3`,noAlpha:`bc1`}:eS(t,[`pvrtc-rgb4unorm-webgl`,`pvrtc-rgba4unorm-webgl`,`pvrtc-rgb2unorm-webgl`,`pvrtc-rgba2unorm-webgl`])?{alpha:`pvrtc1-4-rgba`,noAlpha:`pvrtc1-4-rgb`}:eS(t,[`etc2-rgb8unorm`,`etc2-rgb8unorm-srgb`,`etc2-rgb8a1unorm`,`etc2-rgb8a1unorm-srgb`,`etc2-rgba8unorm`,`etc2-rgba8unorm-srgb`,`eac-r11unorm`,`eac-r11snorm`,`eac-rg11unorm`,`eac-rg11snorm`])?`etc2`:t.has(`etc1-rgb-unorm-webgl`)?`etc1`:eS(t,[`atc-rgb-unorm-webgl`,`atc-rgba-unorm-webgl`,`atc-rgbai-unorm-webgl`])?{alpha:`atc-rgba-interpolated-alpha`,noAlpha:`atc-rgb`}:`rgb565`}function eS(e,t){return t.some(t=>e.has(t))}var tS={dataType:null,batchType:null,name:`Basis`,id:`basis`,module:`textures`,version:fx,worker:!0,extensions:[`basis`,`ktx2`],mimeTypes:[`application/octet-stream`,`image/ktx2`],tests:[`sB`],binary:!0,options:{basis:{format:`auto`,containerFormat:`auto`,module:`transcoder`}},parse:qx},nS=!0,rS=1735152710,iS=12,aS=8,oS=1313821514,sS=5130562,cS=0,lS=0,uS=1;function dS(e,t=0){return`\
${String.fromCharCode(e.getUint8(t+0))}\
${String.fromCharCode(e.getUint8(t+1))}\
${String.fromCharCode(e.getUint8(t+2))}\
${String.fromCharCode(e.getUint8(t+3))}`}function fS(e,t=0,n={}){let r=new DataView(e),{magic:i=rS}=n,a=r.getUint32(t,!1);return a===i||a===rS}function pS(e,t,n=0,r={}){let i=new DataView(t),a=dS(i,n+0),o=i.getUint32(n+4,nS),s=i.getUint32(n+8,nS);switch(Object.assign(e,{header:{byteOffset:n,byteLength:s,hasBinChunk:!1},type:a,version:o,json:{},binChunks:[]}),n+=iS,e.version){case 1:return mS(e,i,n);case 2:return hS(e,i,n,r={});default:throw Error(`Invalid GLB version ${e.version}. Only supports version 1 and 2.`)}}function mS(e,t,n){f_(e.header.byteLength>iS+aS);let r=t.getUint32(n+0,nS),i=t.getUint32(n+4,nS);return n+=aS,f_(i===cS),_S(e,t,n,r),n+=r,n+=vS(e,t,n,e.header.byteLength),n}function hS(e,t,n,r){return f_(e.header.byteLength>iS+aS),gS(e,t,n,r),n+e.header.byteLength}function gS(e,t,n,r){for(;n+8<=e.header.byteLength;){let i=t.getUint32(n+0,nS),a=t.getUint32(n+4,nS);switch(n+=aS,a){case oS:_S(e,t,n,i);break;case sS:vS(e,t,n,i);break;case lS:r.strict||_S(e,t,n,i);break;case uS:r.strict||vS(e,t,n,i);break;default:break}n+=wv(i,4)}return n}function _S(e,t,n,r){let i=new Uint8Array(t.buffer,n,r),a=new TextDecoder(`utf8`).decode(i);return e.json=JSON.parse(a),wv(r,4)}function vS(e,t,n,r){return e.header.hasBinChunk=!0,e.binChunks.push({byteOffset:n,byteLength:r,arrayBuffer:t.buffer}),wv(r,4)}function yS(e,t,n){if(e.startsWith(`data:`)||e.startsWith(`http:`)||e.startsWith(`https:`))return e;let r=n?.baseUrl||bS(t?.core?.baseUrl);if(!r)throw Error(`'baseUrl' must be provided to resolve relative url ${e}`);return r.endsWith(`/`)?`${r}${e}`:`${r}/${e}`}function bS(e){if(!e)return;if(e.endsWith(`/`))return e;let t=e.lastIndexOf(`/`);return t>=0?e.slice(0,t+1):``}var xS=(function(){var e=`b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuixkbeeeddddillviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WboY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbrl79IV9Rbwq1Zkdbk:kYi5ud9:du8Jjjjjbcjq9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz:jjjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCaAcethXaxaDfhiaOaeaoaeao6E9RhQalcl4cifcd4hLazcjdfaAfhKcbhYabaOad2fg8AhEaHh3incbh5dnawTmbaxaYcd4fRbbh5kcbh8Eazcjdfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcjdfa8EaA2fa8FaAz:jjjjb8Aa8FaAfhixdkazcjdfa8EaA2fcbaAz:kjjjb8Aa8FhixekaPa8F9RaL6mva8FaLfhidnaCTmbaPai9RcK6mbaocdtc:q:G:cjbfcj:G:cjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bwar9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfcbaicdfa8J9c8N1:NfghRbbag9cjjjjjw:dg8J9qE86bbarcVfcbaha8J9c8M1:NfghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fcbaha8J9c8N1:NfgiRbbag9cjjjjjw:dg8J9qE86bbarc96fcbaia8J9c8M1:NfgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbw83bwarai8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasaYcd4fRbbgociGPlbedrbkaATmdazaYfh8Fazcjdfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeazaYfhaazcjdfhhcbhoceh8EaKh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaQaocefgofmbka8FaXfh8FcdhoaacdfhaahaXfhha8EceGhlcbh8EalmbxdkkaATmbaocl4h8EazaYfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaKhainazcjdfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E94aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3aYclfgYad6mbkaza8AaAcufad2fadz:jjjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcjqf8Kjjjjbaok:ysezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:kjjjb8Aav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk:4ioiue99dud99dud99dnaeTmbcbhiabhlindndnal8Uebgv:YgoJ:ji:1Salcof8UebgrciVgw:Y:vgDNJbbbZJbbb:;avcu9kEMgq:lJbbb9p9DTmbaq:Ohkxekcjjjj94hkkalclf8Uebhvalcdf8UebhxalarcefciGcetfak87ebdndnax:YgqaDNJbbbZJbbb:;axcu9kEMgm:lJbbb9p9DTmbam:Ohxxekcjjjj94hxkabaiarciGgkfcd7cetfax87ebdndnav:YgmaDNJbbbZJbbb:;avcu9kEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkalarcufciGcetfav87ebdndnawaw2:ZgPaPMaoaoN:taqaqN:tamamN:tgoJbbbbaoJbbbb9GE:raDNJbbbZMgD:lJbbb9p9DTmbaD:Ohrxekcjjjj94hrkalakcetfar87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk:Tvirud99eudndnadcl9hmbaeTmeindndnabRbbgiabcefgl8Sbbgvabcdfgo8Sbbgrf9R:YJbbuJabcifgwRbbgdce4adVgDcd4aDVgDcl4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax86bbdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao86bbdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai86bbdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad86bbabclfhbaecufgembxdkkaeTmbindndnab8Vebgiabcdfgl8Uebgvabclfgo8Uebgrf9R:YJbFu9habcofgw8Vebgdce4adVgDcd4aDVgDcl4aDVgDcw4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax87ebdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao87ebdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai87ebdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad87ebabcwfhbaecufgembkkk9teiucbcbyd:K:G:cjbgeabcifc98GfgbBd:K:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk83dbcj:Gdk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:K:Gdkl8W:qbb`,t=`b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuixkbbebeeddddilve9Weeeviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WbwY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbDl79IV9Rbqq:59Dklbzik94evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaeai86b:q:W:cjbaecitab8Piw83i:q:G:cjbaecefgecjd9hmbkk:SBlEud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaialfgxar9RhodnadTgmmbavaoad;8qbbkaicefhPcj;abad9Uc;WFbGcjdadca0EhsdndndnadTmbaoadfhzcbhHinaeaH9nmdaxaP9RaD6miabaHad2fgOavcjdfasaeaH9RaHasfae6EgAaAcsfgoc9WGgCSEhXaPaDfhQaocl4cifcd4hLavcj;cbfaCcetfhKavcj;cbfaCci2fhYavcj;cbfaCfh8AcbhEaoc;ab6h3incbh5dnawTmbaPaEcd4fRbbh5kcbh8Eavcj;cbfh8Findndndndna5a8Ecet4ciGgoc9:fPdebdkaxaQ9RaC6mwdnaCTmbavcj;cbfa8EaC2faQaC;8qbbkaQaAfhQxdkaCTmeavcj;cbfa8EaC2fcbaC;8kbxekaxaQ9RaL6moaoclVcbawEhraQaLfhocbhidna3mbaxao9Rc;Gb6mbcbhlina8FalfhidndndndndndnaQalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiczfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaicafaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaoclffaqRb:q:W:cjbfhoxikaic8Wfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaocwffaqRb:q:W:cjbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitpbi:q:G:cjbaiRb:q:W:cjbgipsaoRbegqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqRb:q:W:cjbfhokalc;abfhialcjefaC0meaihlaxao9Rc;Fb0mbkkdnaiaC9pmbaici4hlinaxao9RcK6mwa8FaifhqdndndndndndnaQaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaoclffa8JRb:q:W:cjbfhoxikaqaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaocwffa8JRb:q:W:cjbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpkbbagaocdffa8JRb:q:W:cjbfhokalcdfhlaiczfgiaC6mbkkaohQaoTmoka8FaCfh8Fa8Ecefg8Ecl9hmbkdndndndnawTmbazaEcd4fRbbglciGPlbedwbkaCTmdaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep9Taapxeeeeeeeeeeeeeeeeghp9op9Hp9rgaa8Kp9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ughp9Abbbaladfglahaaaapmlvorlvorlvorlvorp9Ughp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp9Ughp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9AbbbaladfhlaoczfgoaC6mbxikkaCTmeaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep:neaapxebebebebebebebebghp9op:bep9rgaa8Kp:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeghp9Abbbaladfglahaaaapmlvorlvorlvorlvorp:oeghp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp:oeghp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9AbbbaladfhlaoczfgoaC6mbxdkkaCTmbaXaEfhrcbhocbalcl4gl9Rc8FGhiavaEfpbdbhhinaravcj;cbfaofpblbg8Ka8Aaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaKaofpblbg8NaYaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgaahp9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ma8PpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9AbbbaradfhraoczfgoaC6mbkkaEclfgEad6mbkdnaXavcjdf9hmbaAad2goTmbaOavcjdfao;8qbbkdnammbavaXaAcufad2fad;8qbbkaAaHfhHc9:hoaQhPaQmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdasaeao9Raoasfae6Eaofgoae6mbkaial9RhPkcbc99axaP9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbkNsezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk;Toio97eue97aec98Ghedndnadcl9hmbaeTmecbhdinababpbbbgicKp:RecKp:Sep;6eglaicwp:RecKp:Sep;6ealp;Geaiczp:RecKp:Sep;6egvp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgwp9op9rp;Keglpxbb;:9cbb;:9cbb;:9cbb;:9calalp;Meaoaop;Meavaravawp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFbbbFbbbFbbbFbbbp9oaipxbbbFbbbFbbbFbbbFp9op9qalavp;Mearp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaoavp;Mearp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgDaDpbbbgipxbbbbbbFFbbbbbbFFgwp9oabpbbbgoaipmbediwDqkzHOAKY8AEgvczp:Reczp:Sep;6eglaoaipmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eavczp:Sep;6egvp;Gealp;Gep;Kep;Legipxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgqp9op9rp;Keglpxb;:FSb;:FSb;:FSb;:FSalalp;Meaiaip;Meavaravaqp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbp9oaiavp;Mearp;Keczp:Rep9qgialavp;Mearp;KepxFFbbFFbbFFbbFFbbp9oglpmwDKYqk8AExm35Ps8E8Fp9qpkbbabaoawp9oaialpmbezHdiOAlvCXorQLp9qpkbbabcafhbadclfgdae6mbkkk;2ileue97euo97dnaec98GgiTmbcbheinabcKfpx:ji:1S:ji:1S:ji:1S:ji:1SabpbbbglabczfgvpbbbgopmlvorxmPsCXQL358E8Fgrczp:Segwpxibbbibbbibbbibbbp9qp;6egDp;NegqaDaDp;MegDaDp;KealaopmbediwDqkzHOAKY8AEgDczp:Reczp:Sep;6eglalp;MeaDczp:Sep;6egoaop;Mearczp:Reczp:Sep;6egrarp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jep;Mepxbbn0bbn0bbn0bbn0gDp;KepxFFbbFFbbFFbbFFbbgkp9oaqaop;MeaDp;Keczp:Rep9qgoaqalp;MeaDp;Keakp9oaqarp;MeaDp;Keczp:Rep9qgDpmwDKYqk8AExm35Ps8E8Fglp5eawclp:RegqpEi:T:j83ibavalp5baqpEd:T:j83ibabcwfaoaDpmbezHdiOAlvCXorQLgDp5eaqpEe:T:j83ibabaDp5baqpEb:T:j83ibabcafhbaeclfgeai6mbkkkuee97dnadcd4ae2c98GgeTmbcbhdinababpbbbgicwp:Recwp:Sep;6eaicep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbabczfhbadclfgdae6mbkkk:Sodw97euaec98Ghedndnadcl9hmbaeTmecbhdinabpxbbuJbbuJbbuJbbuJabpbbbgicKp:TeglaicYp:Tep9qgvcdp:Teavp9qgvclp:Teavp9qgop;6ep;Negvaicwp:RecKp:SegraipxFbbbFbbbFbbbFbbbgwp9ogDp:Uep;6ep;Mepxbbn0bbn0bbn0bbn0gqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9oavaDarp:Xeaiczp:RecKp:Segip:Uep;6ep;Meaqp;Keawp9op9qavaDaraip:Uep:Xep;6ep;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qavaoalcep:Rep9oalpxebbbebbbebbbebbbp9op9qp;6ep;Meaqp;KecKp:Rep9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgkpxbFu9hbFu9hbFu9hbFu9habpbbbglakpbbbgrpmlvorxmPsCXQL358E8Fgvczp:TegqavcHp:Tep9qgicdp:Teaip9qgiclp:Teaip9qgicwp:Teaip9qgop;6ep;NegialarpmbediwDqkzHOAKY8AEgDpxFFbbFFbbFFbbFFbbglp9ograDczp:Segwp:Ueavczp:Reczp:SegDp:Xep;6ep;Mepxbbn0bbn0bbn0bbn0gvp;Kealp9oaiarawaDp:Uep:Xep;6ep;Meavp;Keczp:Rep9qgwaiaoaqcep:Rep9oaqpxebbbebbbebbbebbbp9op9qp;6ep;Meavp;Keczp:ReaiaDarp:Uep;6ep;Meavp;Kealp9op9qgipmwDKYqk8AExm35Ps8E8FpkbbabawaipmbezHdiOAlvCXorQLpkbbabcafhbadclfgdae6mbkkk9teiucbcbydj:G:cjbgeabcifc98GfgbBdj:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkxebcj:Gdklz:zbb`,n=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),r=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!=`object`)return{supported:!1};var i=WebAssembly.validate(n)?s(t):s(e),a,o=WebAssembly.instantiate(i,{}).then(function(e){a=e.instance,a.exports.__wasm_call_ctors()});function s(e){for(var t=new Uint8Array(e.length),n=0;n<e.length;++n){var i=e.charCodeAt(n);t[n]=i>96?i-97:i>64?i-39:i+4}for(var a=0,n=0;n<e.length;++n)t[a++]=t[n]<60?r[t[n]]:(t[n]-60)*64+t[++n];return t.buffer.slice(0,a)}function c(e,t,n,r,i,a,o){var s=e.exports.sbrk,c=r+3&-4,l=s(c*i),u=s(a.length),d=new Uint8Array(e.exports.memory.buffer);d.set(a,u);var f=t(l,r,i,u,a.length);if(f==0&&o&&o(l,c,i),n.set(d.subarray(l,l+r*i)),s(l-s(0)),f!=0)throw Error(`Malformed buffer data: `+f)}var l={NONE:``,OCTAHEDRAL:`meshopt_decodeFilterOct`,QUATERNION:`meshopt_decodeFilterQuat`,EXPONENTIAL:`meshopt_decodeFilterExp`,COLOR:`meshopt_decodeFilterColor`},u={ATTRIBUTES:`meshopt_decodeVertexBuffer`,TRIANGLES:`meshopt_decodeIndexBuffer`,INDICES:`meshopt_decodeIndexSequence`},d=[],f=0;function p(e){var t={object:new Worker(e),pending:0,requests:{}};return t.object.onmessage=function(e){var n=e.data;t.pending-=n.count,t.requests[n.id][n.action](n.value),delete t.requests[n.id]},t}function m(e){for(var t=`self.ready = WebAssembly.instantiate(new Uint8Array([`+new Uint8Array(i)+`]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = `+g.name+`;`+c.toString()+g.toString(),n=new Blob([t],{type:`text/javascript`}),r=URL.createObjectURL(n),a=d.length;a<e;++a)d[a]=p(r);for(var a=e;a<d.length;++a)d[a].object.postMessage({});d.length=e,URL.revokeObjectURL(r)}function h(e,t,n,r,i){for(var a=d[0],o=1;o<d.length;++o)d[o].pending<a.pending&&(a=d[o]);return new Promise(function(o,s){var c=new Uint8Array(n),l=++f;a.pending+=e,a.requests[l]={resolve:o,reject:s},a.object.postMessage({id:l,count:e,size:t,source:c,mode:r,filter:i},[c.buffer])})}function g(e){var t=e.data;self.ready.then(function(e){if(!t.id)return self.close();try{var n=new Uint8Array(t.count*t.size);c(e,e.exports[t.mode],n,t.count,t.size,t.source,e.exports[t.filter]),self.postMessage({id:t.id,count:t.count,action:`resolve`,value:n},[n.buffer])}catch(e){self.postMessage({id:t.id,count:t.count,action:`reject`,value:e})}})}return{ready:o,supported:!0,useWorkers:function(e){m(e)},decodeVertexBuffer:function(e,t,n,r,i){c(a,a.exports.meshopt_decodeVertexBuffer,e,t,n,r,a.exports[l[i]])},decodeIndexBuffer:function(e,t,n,r){c(a,a.exports.meshopt_decodeIndexBuffer,e,t,n,r)},decodeIndexSequence:function(e,t,n,r){c(a,a.exports.meshopt_decodeIndexSequence,e,t,n,r)},decodeGltfBuffer:function(e,t,n,r,i,o){c(a,a.exports[u[i]],e,t,n,r,a.exports[l[o]])},decodeGltfBufferAsync:function(e,t,n,r,i){return d.length>0?h(e,t,n,u[r],l[i]):o.then(function(){var o=new Uint8Array(e*t);return c(a,a.exports[u[r]],o,e,t,n,a.exports[l[i]]),o})}}})();function SS(e){return typeof e==`string`?e:[`NONE`,`OCTAHEDRAL`,`QUATERNION`,`EXPONENTIAL`,`COLOR`][e]}async function CS(e,t,n,r,i,a=`NONE`){await xS.ready,xS.decodeGltfBuffer(e,t,n,r,i,SS(a))}async function wS(e,t,n){if(!t.gltf?.decompressMeshes||!t.gltf.loadBuffers)return;TS(e.json);let r=new Y(e),i=e.json.bufferViews||[],a=i.map(e=>ES(r,e,n));await Promise.all(a);for(let e of i)r.removeObjectExtension(e,n);for(let t of e.json.buffers||[])r.removeObjectExtension(t,n);r.removeExtension(n)}function TS(e){let t=e.bufferViews||[];for(let e=0;e<t.length;e++){let n=t[e].extensions;if(n?.KHR_meshopt_compression&&n.EXT_meshopt_compression)throw Error(`glTF bufferView ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}let n=e.buffers||[];for(let e=0;e<n.length;e++){let t=n[e].extensions;if(t?.KHR_meshopt_compression&&t.EXT_meshopt_compression)throw Error(`glTF buffer ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}}async function ES(e,t,n){let r=e.getObjectExtension(t,n);if(!r)return;let{byteOffset:i=0,byteLength:a,byteStride:o,count:s,mode:c,filter:l=`NONE`,buffer:u}=r,d=e.gltf.buffers[u],f=e.gltf.buffers[t.buffer],p=new Uint8Array(d.arrayBuffer,d.byteOffset+i,a);await CS(new Uint8Array(f.arrayBuffer,f.byteOffset+(t.byteOffset||0),t.byteLength),s,o,p,c,l)}var DS=e({decode:()=>kS,name:()=>OS}),OS=`EXT_meshopt_compression`;async function kS(e,t){await wS(e,t,OS)}var AS=e({decode:()=>MS,name:()=>jS}),jS=`KHR_meshopt_compression`;async function MS(e,t){await wS(e,t,jS)}var NS=e({name:()=>FS,preprocess:()=>IS}),PS=`EXT_texture_webp`,FS=PS;function IS(e,t){let n=new Y(e);if(!Ey(`image/webp`)){if(n.getRequiredExtensions().includes(PS))throw Error(`gltf: Required extension ${PS} not supported by browser`);return}let{json:r}=n;for(let e of r.textures||[]){let t=n.getObjectExtension(e,PS);t&&(e.source=t.source),n.removeObjectExtension(e,PS)}n.removeExtension(PS)}var LS=e({name:()=>zS,preprocess:()=>BS}),RS=`KHR_texture_basisu`,zS=RS;function BS(e,t){let n=new Y(e),{json:r}=n;for(let e of r.textures||[]){let t=n.getObjectExtension(e,RS);t&&(e.source=t.source,n.removeObjectExtension(e,RS))}n.removeExtension(RS)}var VS=`1.5.6`,HS=`1.4.1`,US=`https://www.gstatic.com/draco/versioned/decoders/${VS}`,X={DECODER:`draco_wasm_wrapper.js`,DECODER_WASM:`draco_decoder.wasm`,FALLBACK_DECODER:`draco_decoder.js`,ENCODER:`draco_encoder.js`},WS={[X.DECODER]:`${US}/${X.DECODER}`,[X.DECODER_WASM]:`${US}/${X.DECODER_WASM}`,[X.FALLBACK_DECODER]:`${US}/${X.FALLBACK_DECODER}`,[X.ENCODER]:`https://raw.githubusercontent.com/google/draco/${HS}/javascript/${X.ENCODER}`},GS;async function KS(e={},t){let n=e.modules||{};return n.draco3d?GS||=n.draco3d.createDecoderModule({}).then(e=>({draco:e})):GS||=JS(e,t),await GS}function qS(e,t){if(e&&typeof e==`object`){if(e.default)return e.default;if(e[t])return e[t]}return e}async function JS(e,t){let n,r;switch(t){case`js`:n=await cv(WS[X.FALLBACK_DECODER],`draco`,e,X.FALLBACK_DECODER);break;default:try{[n,r]=await Promise.all([await cv(WS[X.DECODER],`draco`,e,X.DECODER),await cv(WS[X.DECODER_WASM],`draco`,e,X.DECODER_WASM)])}catch{n=null,r=null}}return n=qS(n,`DracoDecoderModule`),n||=globalThis.DracoDecoderModule,!n&&!q&&([n,r]=await Promise.all([await cv(WS[X.DECODER],`draco`,{...e,useLocalLibraries:!0},X.DECODER),await cv(WS[X.DECODER_WASM],`draco`,{...e,useLocalLibraries:!0},X.DECODER_WASM)]),n=qS(n,`DracoDecoderModule`),n||=globalThis.DracoDecoderModule),await YS(n,r)}function YS(e,t){if(typeof e!=`function`)throw Error(`DracoDecoderModule could not be loaded`);let n={};return t&&(n.wasmBinary=t),new Promise(t=>{e({...n,onModuleLoaded:e=>t({draco:e})})})}var XS=`4.4.5`;function ZS(e){switch(e.constructor){case Int8Array:return`int8`;case Uint8Array:case Uint8ClampedArray:return`uint8`;case Int16Array:return`int16`;case Uint16Array:return`uint16`;case Int32Array:return`int32`;case Uint32Array:return`uint32`;case Float32Array:return`float32`;case Float64Array:return`float64`;default:return`null`}}function QS(e){let t=1/0,n=1/0,r=1/0,i=-1/0,a=-1/0,o=-1/0,s=e.POSITION?e.POSITION.value:[],c=s&&s.length;for(let e=0;e<c;e+=3){let c=s[e],l=s[e+1],u=s[e+2];t=c<t?c:t,n=l<n?l:n,r=u<r?u:r,i=c>i?c:i,a=l>a?l:a,o=u>o?u:o}return[[t,n,r],[i,a,o]]}function $S(e,t,n){let r=ZS(t.value),i=n||eC(t);return{name:e,type:{type:`fixed-size-list`,listSize:t.size,children:[{name:`value`,type:r}]},nullable:!1,metadata:i}}function eC(e){let t={};return`byteOffset`in e&&(t.byteOffset=e.byteOffset.toString(10)),`byteStride`in e&&(t.byteStride=e.byteStride.toString(10)),`normalized`in e&&(t.normalized=e.normalized.toString()),t}function tC(e,t,n){let r=iC(t.metadata),i=[],a=nC(t.attributes);for(let t in e){let n=e[t],r=rC(t,n,a[t]);i.push(r)}if(n){let e=rC(`indices`,n);i.push(e)}return{fields:i,metadata:r}}function nC(e){let t={};for(let n in e){let r=e[n];t[r.name||`undefined`]=r}return t}function rC(e,t,n){return $S(e,t,n?iC(n.metadata):void 0)}function iC(e){Object.entries(e);let t={};for(let n in e)t[`${n}.string`]=JSON.stringify(e[n]);return t}var aC={POSITION:`POSITION`,NORMAL:`NORMAL`,COLOR:`COLOR_0`,TEX_COORD:`TEXCOORD_0`},oC={1:Int8Array,2:Uint8Array,3:Int16Array,4:Uint16Array,5:Int32Array,6:Uint32Array,9:Float32Array},sC=4,cC=class{draco;decoder;metadataQuerier;constructor(e){this.draco=e,this.decoder=new this.draco.Decoder,this.metadataQuerier=new this.draco.MetadataQuerier}destroy(){this.draco.destroy(this.decoder),this.draco.destroy(this.metadataQuerier)}parseSync(e,t={}){let n=new this.draco.DecoderBuffer;n.Init(new Int8Array(e),e.byteLength),this._disableAttributeTransforms(t);let r=this.decoder.GetEncodedGeometryType(n),i=r===this.draco.TRIANGULAR_MESH?new this.draco.Mesh:new this.draco.PointCloud;try{let e;switch(r){case this.draco.TRIANGULAR_MESH:e=this.decoder.DecodeBufferToMesh(n,i);break;case this.draco.POINT_CLOUD:e=this.decoder.DecodeBufferToPointCloud(n,i);break;default:throw Error(`DRACO: Unknown geometry type.`)}if(!e.ok()||!i.ptr){let t=`DRACO decompression failed: ${e.error_msg()}`;throw Error(t)}let a=this._getDracoLoaderData(i,r,t),o=this._getMeshData(i,a,t),s=QS(o.attributes),c=tC(o.attributes,a,o.indices);return{loader:`draco`,loaderData:a,header:{vertexCount:i.num_points(),boundingBox:s},...o,schema:c}}finally{this.draco.destroy(n),i&&this.draco.destroy(i)}}_getDracoLoaderData(e,t,n){let r=this._getTopLevelMetadata(e),i=this._getDracoAttributes(e,n);return{geometry_type:t,num_attributes:e.num_attributes(),num_points:e.num_points(),num_faces:e instanceof this.draco.Mesh?e.num_faces():0,metadata:r,attributes:i}}_getDracoAttributes(e,t){let n={};for(let r=0;r<e.num_attributes();r++){let i=this.decoder.GetAttribute(e,r),a=this._getAttributeMetadata(e,r);n[i.unique_id()]={unique_id:i.unique_id(),attribute_type:i.attribute_type(),data_type:i.data_type(),num_components:i.num_components(),byte_offset:i.byte_offset(),byte_stride:i.byte_stride(),normalized:i.normalized(),attribute_index:r,metadata:a};let o=this._getQuantizationTransform(i,t);o&&(n[i.unique_id()].quantization_transform=o);let s=this._getOctahedronTransform(i,t);s&&(n[i.unique_id()].octahedron_transform=s)}return n}_getMeshData(e,t,n){let r=this._getMeshAttributes(t,e,n);if(!r.POSITION)throw Error(`DRACO: No position attribute found.`);if(e instanceof this.draco.Mesh)switch(n.topology){case`triangle-strip`:return{topology:`triangle-strip`,mode:4,attributes:r,indices:{value:this._getTriangleStripIndices(e),size:1}};default:return{topology:`triangle-list`,mode:5,attributes:r,indices:{value:this._getTriangleListIndices(e),size:1}}}return{topology:`point-list`,mode:0,attributes:r}}_getMeshAttributes(e,t,n){let r={};for(let i of Object.values(e.attributes)){let e=this._deduceAttributeName(i,n);i.name=e;let a=this._getAttributeValues(t,i);if(a){let{value:t,size:n}=a;r[e]={value:t,size:n,byteOffset:i.byte_offset,byteStride:i.byte_stride,normalized:i.normalized}}}return r}_getTriangleListIndices(e){let t=e.num_faces()*3,n=t*sC,r=this.draco._malloc(n);try{return this.decoder.GetTrianglesUInt32Array(e,n,r),new Uint32Array(this.draco.HEAPF32.buffer,r,t).slice()}finally{this.draco._free(r)}}_getTriangleStripIndices(e){let t=new this.draco.DracoInt32Array;try{return this.decoder.GetTriangleStripsFromMesh(e,t),dC(t)}finally{this.draco.destroy(t)}}_getAttributeValues(e,t){let n=oC[t.data_type];if(!n)return console.warn(`DRACO: Unsupported attribute type ${t.data_type}`),null;let r=t.num_components,i=e.num_points()*r,a=i*n.BYTES_PER_ELEMENT,o=lC(this.draco,n),s,c=this.draco._malloc(a);try{let r=this.decoder.GetAttribute(e,t.attribute_index);this.decoder.GetAttributeDataArrayForAllPoints(e,r,o,a,c),s=new n(this.draco.HEAPF32.buffer,c,i).slice()}finally{this.draco._free(c)}return{value:s,size:r}}_deduceAttributeName(e,t){let n=e.unique_id;for(let[e,r]of Object.entries(t.extraAttributes||{}))if(r===n)return e;let r=e.attribute_type;for(let e in aC)if(this.draco[e]===r)return aC[e];let i=t.attributeNameEntry||`name`;return e.metadata[i]?e.metadata[i].string:`CUSTOM_ATTRIBUTE_${n}`}_getTopLevelMetadata(e){let t=this.decoder.GetMetadata(e);return this._getDracoMetadata(t)}_getAttributeMetadata(e,t){let n=this.decoder.GetAttributeMetadata(e,t);return this._getDracoMetadata(n)}_getDracoMetadata(e){if(!e||!e.ptr)return{};let t={},n=this.metadataQuerier.NumEntries(e);for(let r=0;r<n;r++){let n=this.metadataQuerier.GetEntryName(e,r);t[n]=this._getDracoMetadataField(e,n)}return t}_getDracoMetadataField(e,t){let n=new this.draco.DracoInt32Array;try{this.metadataQuerier.GetIntEntryArray(e,t,n);let r=uC(n);return{int:this.metadataQuerier.GetIntEntry(e,t),string:this.metadataQuerier.GetStringEntry(e,t),double:this.metadataQuerier.GetDoubleEntry(e,t),intArray:r}}finally{this.draco.destroy(n)}}_disableAttributeTransforms(e){let{quantizedAttributes:t=[],octahedronAttributes:n=[]}=e,r=[...t,...n];for(let e of r)this.decoder.SkipAttributeTransform(this.draco[e])}_getQuantizationTransform(e,t){let{quantizedAttributes:n=[]}=t,r=e.attribute_type();if(n.map(e=>this.decoder[e]).includes(r)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits(),range:t.range(),min_values:new Float32Array([1,2,3]).map(e=>t.min_value(e))}}finally{this.draco.destroy(t)}}return null}_getOctahedronTransform(e,t){let{octahedronAttributes:n=[]}=t,r=e.attribute_type();if(n.map(e=>this.decoder[e]).includes(r)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits()}}finally{this.draco.destroy(t)}}return null}};function lC(e,t){switch(t){case Float32Array:return e.DT_FLOAT32;case Int8Array:return e.DT_INT8;case Int16Array:return e.DT_INT16;case Int32Array:return e.DT_INT32;case Uint8Array:return e.DT_UINT8;case Uint16Array:return e.DT_UINT16;case Uint32Array:return e.DT_UINT32;default:return e.DT_INVALID}}function uC(e){let t=e.size(),n=new Int32Array(t);for(let r=0;r<t;r++)n[r]=e.GetValue(r);return n}function dC(e){let t=e.size(),n=new Int32Array(t);for(let r=0;r<t;r++)n[r]=e.GetValue(r);return n}var fC={dataType:null,batchType:null,name:`Draco`,id:`draco`,module:`draco`,version:XS,worker:!0,extensions:[`drc`],mimeTypes:[`application/octet-stream`],binary:!0,tests:[`DRACO`],options:{draco:{decoderType:typeof WebAssembly==`object`?`wasm`:`js`,extraAttributes:{},attributeNameEntry:void 0}},parse:pC};async function pC(e,t){let{draco:n}=await KS(sv(t),t?.draco?.decoderType||`wasm`),r=new cC(n);try{return r.parseSync(e,t?.draco)}finally{r.destroy()}}function mC(e){let t={};for(let n in e){let r=e[n];n!==`indices`&&(t[n]=hC(r))}return t}function hC(e){let{buffer:t,size:n,count:r}=gC(e);return{value:t,size:n,byteOffset:0,count:r,type:Ry(n),componentType:zy(t)}}function gC(e){let t=e,n=1,r=0;return e&&e.value&&(t=e.value,n=e.size||1),t&&(ArrayBuffer.isView(t)||(t=_C(t,Float32Array)),r=t.length/n),{buffer:t,size:n,count:r}}function _C(e,t,n=!1){return e?Array.isArray(e)||n&&!(e instanceof t)?new t(e):e:null}var vC=e({decode:()=>SC,encode:()=>CC,name:()=>bC,preprocess:()=>xC}),yC=`KHR_draco_mesh_compression`,bC=yC;function xC(e,t,n){let r=new Y(e);for(let e of DC(r))r.getObjectExtension(e,yC)}async function SC(e,t,n){if(!t?.gltf?.decompressMeshes)return;let r=new Y(e),i=[];for(let e of DC(r))r.getObjectExtension(e,yC)&&i.push(wC(r,e,t,n));await Promise.all(i),r.removeExtension(yC)}function CC(e,t={}){let n=new Y(e);for(let e of n.json.meshes||[])TC(e,t),n.addRequiredExtension(yC)}async function wC(e,t,n,r){let i=e.getObjectExtension(t,yC);if(!i)return;let a=e.getTypedArrayForBufferView(i.bufferView),o=Cv(a.buffer,a.byteOffset),s={...n};delete s[`3d-tiles`];let c=await d_(o,fC,s,r),l=mC(c.attributes);for(let[n,r]of Object.entries(l))if(n in t.attributes){let i=t.attributes[n],a=e.getAccessor(i);a?.min&&a?.max&&(r.min=a.min,r.max=a.max)}t.attributes=l,c.indices&&(t.indices=hC(c.indices)),e.removeObjectExtension(t,yC),EC(t)}function TC(e,t,n=4,r,i){if(!r.DracoWriter)throw Error(`options.gltf.DracoWriter not provided`);let a=r.DracoWriter.encodeSync({attributes:e}),o=i?.parseSync?.({attributes:e}),s=r._addFauxAttributes(o.attributes),c=r.addBufferView(a);return{primitives:[{attributes:s,mode:n,extensions:{[yC]:{bufferView:c,attributes:s}}}]}}function EC(e){if(!e.attributes&&Object.keys(e.attributes).length>0)throw Error(`glTF: Empty primitive detected: Draco decompression failure?`)}function*DC(e){for(let t of e.json.meshes||[])for(let e of t.primitives)yield e}var OC=e({decode:()=>PC,name:()=>AC}),kC=`KHR_texture_transform`,AC=kC,jC=new Qt,MC=new dn,NC=new dn;async function PC(e,t){if(!new Y(e).hasExtension(kC)||!t.gltf?.loadBuffers)return;let n=e.json.materials||[];for(let t=0;t<n.length;t++)FC(t,e)}function FC(e,t){let n=t.json.materials?.[e],r=[n?.pbrMetallicRoughness?.baseColorTexture,n?.emissiveTexture,n?.normalTexture,n?.occlusionTexture,n?.pbrMetallicRoughness?.metallicRoughnessTexture],i=[];for(let n of r)n&&n?.extensions?.[kC]&&IC(t,e,n,i)}function IC(e,t,n,r){let i=LC(n,r);if(!i)return;let a=e.json.meshes||[];for(let n of a)for(let r of n.primitives){let n=r.material;Number.isFinite(n)&&t===n&&RC(e,r,i)}}function LC(e,t){let n=e.extensions?.[kC],{texCoord:r=0}=e,{texCoord:i=r}=n;if(t.findIndex(([e,t])=>e===r&&t===i)===-1){let a=VC(n);return r!==i&&(e.texCoord=i),t.push([r,i]),{originalTexCoord:r,texCoord:i,matrix:a}}return null}function RC(e,t,n){let{originalTexCoord:r,texCoord:i,matrix:a}=n,o=t.attributes[`TEXCOORD_${r}`];if(Number.isFinite(o)){let n=e.json.accessors?.[o];if(n&&n.bufferView!==void 0){let o=e.json.bufferViews?.[n.bufferView];if(o){let{arrayBuffer:s,byteOffset:c}=e.buffers[o.buffer],l=(c||0)+(n.byteOffset||0)+(o.byteOffset||0),{ArrayType:u,length:d}=By(n,o),f=jy[n.componentType],p=Ay[n.type],m=o.byteStride||f*p,h=new Float32Array(d);for(let e=0;e<n.count;e++){let t=new u(s,l+e*m,2);jC.set(t[0],t[1],1),jC.transformByMatrix3(a),h.set([jC[0],jC[1]],e*p)}r===i?zC(n,e,h,n.bufferView):BC(i,n,t,e,h)}}}}function zC(e,t,n,r){e.componentType=5126,e.byteOffset=0;let i=(t.json.accessors||[]).reduce((e,t)=>t.bufferView===r?e+1:e,0)>1;t.buffers.push({arrayBuffer:Fv(n.buffer),byteOffset:0,byteLength:n.buffer.byteLength});let a=t.buffers.length-1;if(t.json.bufferViews=t.json.bufferViews||[],i){t.json.bufferViews.push({buffer:a,byteLength:n.buffer.byteLength,byteOffset:0}),e.bufferView=t.json.bufferViews.length-1;return}let o=t.json.bufferViews[r];o&&(o.buffer=a,o.byteOffset=0,o.byteLength=n.buffer.byteLength,o.byteStride!==void 0&&delete o.byteStride)}function BC(e,t,n,r,i){r.buffers.push({arrayBuffer:Fv(i.buffer),byteOffset:0,byteLength:i.buffer.byteLength}),r.json.bufferViews=r.json.bufferViews||[];let a=r.json.bufferViews;a.push({buffer:r.buffers.length-1,byteLength:i.buffer.byteLength,byteOffset:0});let o=r.json.accessors;o&&(o.push({bufferView:a?.length-1,byteOffset:0,componentType:5126,count:t.count,type:`VEC2`}),n.attributes[`TEXCOORD_${e}`]=o.length-1)}function VC(e){let{offset:t=[0,0],rotation:n=0,scale:r=[1,1]}=e,i=new dn().set(1,0,0,0,1,0,t[0],t[1],1),a=MC.set(Math.cos(n),Math.sin(n),0,-Math.sin(n),Math.cos(n),0,0,0,1),o=NC.set(r[0],0,0,0,r[1],0,0,0,1);return i.multiplyRight(a).multiplyRight(o)}var HC=e({decode:()=>GC,encode:()=>KC,name:()=>WC}),UC=`KHR_lights_punctual`,WC=UC;async function GC(e){let t=new Y(e),{json:n}=t,r=t.getExtension(UC);r&&(t.json.lights=r.lights,t.removeExtension(UC));for(let e of n.nodes||[]){let n=t.getObjectExtension(e,UC);n&&(e.light=n.light),t.removeObjectExtension(e,UC)}}async function KC(e){let t=new Y(e),{json:n}=t;if(n.lights){let e=t.addExtension(UC);J(!e.lights),e.lights=n.lights,delete n.lights}if(t.json.lights){for(let e of t.json.lights){let n=e.node;t.addObjectExtension(n,UC,e)}delete t.json.lights}}var qC=e({decode:()=>XC,encode:()=>ZC,name:()=>YC}),JC=`KHR_materials_unlit`,YC=JC;async function XC(e){let t=new Y(e),{json:n}=t;for(let e of n.materials||[])e.extensions&&e.extensions.KHR_materials_unlit&&(e.unlit=!0),t.removeObjectExtension(e,JC);t.removeExtension(JC)}function ZC(e){let t=new Y(e),{json:n}=t;if(t.materials)for(let e of n.materials||[])e.unlit&&(delete e.unlit,t.addObjectExtension(e,JC,{}),t.addExtension(JC))}var QC=e({decode:()=>tw,encode:()=>nw,name:()=>ew}),$C=`KHR_techniques_webgl`,ew=$C;async function tw(e){let t=new Y(e),{json:n}=t,r=t.getExtension($C);if(r){let e=rw(r,t);for(let r of n.materials||[]){let n=t.getObjectExtension(r,$C);n&&(r.technique=Object.assign({},n,e[n.technique]),r.technique.values=iw(r.technique,t)),t.removeObjectExtension(r,$C)}t.removeExtension($C)}}async function nw(e,t){}function rw(e,t){let{programs:n=[],shaders:r=[],techniques:i=[]}=e,a=new TextDecoder;return r.forEach(e=>{if(Number.isFinite(e.bufferView))e.code=a.decode(t.getTypedArrayForBufferView(e.bufferView));else throw Error(`KHR_techniques_webgl: no shader code`)}),n.forEach(e=>{e.fragmentShader=r[e.fragmentShader],e.vertexShader=r[e.vertexShader]}),i.forEach(e=>{e.program=n[e.program]}),i}function iw(e,t){let n=Object.assign({},e.values);return Object.keys(e.uniforms||{}).forEach(t=>{e.uniforms[t].value&&!(t in n)&&(n[t]=e.uniforms[t].value)}),Object.keys(n).forEach(e=>{typeof n[e]==`object`&&n[e].index!==void 0&&(n[e].texture=t.getTexture(n[e].index))}),n}var aw=[hb,ib,AS,DS,NS,LS,vC,HC,qC,QC,OC,qb];function ow(e,t={},n){let r=aw.filter(e=>cw(e.name,t));for(let i of r)i.preprocess?.(e,t,n)}async function sw(e,t={},n){let r=aw.filter(e=>cw(e.name,t));for(let i of r)await i.decode?.(e,t,n)}function cw(e,t){let n=t?.gltf?.excludeExtensions||{};return!(e in n&&!n[e])}var lw=`KHR_binary_glTF`;function uw(e){let t=new Y(e),{json:n}=t;for(let e of n.images||[]){let n=t.getObjectExtension(e,lw);n&&Object.assign(e,n),t.removeObjectExtension(e,lw)}n.buffers&&n.buffers[0]&&delete n.buffers[0].uri,t.removeExtension(lw)}var dw={accessors:`accessor`,animations:`animation`,buffers:`buffer`,bufferViews:`bufferView`,images:`image`,materials:`material`,meshes:`mesh`,nodes:`node`,samplers:`sampler`,scenes:`scene`,skins:`skin`,textures:`texture`},fw={accessor:`accessors`,animations:`animation`,buffer:`buffers`,bufferView:`bufferViews`,image:`images`,material:`materials`,mesh:`meshes`,node:`nodes`,sampler:`samplers`,scene:`scenes`,skin:`skins`,texture:`textures`},pw=class{idToIndexMap={animations:{},accessors:{},buffers:{},bufferViews:{},images:{},materials:{},meshes:{},nodes:{},samplers:{},scenes:{},skins:{},textures:{}};json;normalize(e,t){this.json=e.json;let n=e.json;switch(n.asset&&n.asset.version){case`2.0`:return;case void 0:case`1.0`:break;default:console.warn(`glTF: Unknown version ${n.asset.version}`);return}if(!t.normalize)throw Error(`glTF v1 is not supported.`);console.warn(`Converting glTF v1 to glTF v2 format. This is experimental and may fail.`),this._addAsset(n),this._convertTopLevelObjectsToArrays(n),uw(e),this._convertObjectIdsToArrayIndices(n),this._updateObjects(n),this._updateMaterial(n)}_addAsset(e){e.asset=e.asset||{},e.asset.version=`2.0`,e.asset.generator=e.asset.generator||`Normalized to glTF 2.0 by loaders.gl`}_convertTopLevelObjectsToArrays(e){for(let t in dw)this._convertTopLevelObjectToArray(e,t)}_convertTopLevelObjectToArray(e,t){let n=e[t];if(!(!n||Array.isArray(n))){e[t]=[];for(let r in n){let i=n[r];i.id=i.id||r;let a=e[t].length;e[t].push(i),this.idToIndexMap[t][r]=a}}}_convertObjectIdsToArrayIndices(e){for(let t in dw)this._convertIdsToIndices(e,t);`scene`in e&&(e.scene=this._convertIdToIndex(e.scene,`scene`));for(let t of e.textures)this._convertTextureIds(t);for(let t of e.meshes)this._convertMeshIds(t);for(let t of e.nodes)this._convertNodeIds(t);for(let t of e.scenes)this._convertSceneIds(t)}_convertTextureIds(e){e.source&&=this._convertIdToIndex(e.source,`image`)}_convertMeshIds(e){for(let t of e.primitives){let{attributes:e,indices:n,material:r}=t;for(let t in e)e[t]=this._convertIdToIndex(e[t],`accessor`);n&&(t.indices=this._convertIdToIndex(n,`accessor`)),r&&(t.material=this._convertIdToIndex(r,`material`))}}_convertNodeIds(e){e.children&&=e.children.map(e=>this._convertIdToIndex(e,`node`)),e.meshes&&=e.meshes.map(e=>this._convertIdToIndex(e,`mesh`))}_convertSceneIds(e){e.nodes&&=e.nodes.map(e=>this._convertIdToIndex(e,`node`))}_convertIdsToIndices(e,t){e[t]||(console.warn(`gltf v1: json doesn't contain attribute ${t}`),e[t]=[]);for(let n of e[t])for(let e in n){let t=n[e];n[e]=this._convertIdToIndex(t,e)}}_convertIdToIndex(e,t){let n=fw[t];if(n in this.idToIndexMap){let r=this.idToIndexMap[n][e];if(!Number.isFinite(r))throw Error(`gltf v1: failed to resolve ${t} with id ${e}`);return r}return e}_updateObjects(e){for(let e of this.json.buffers)delete e.type}_updateMaterial(e){for(let t of e.materials){t.pbrMetallicRoughness={baseColorFactor:[1,1,1,1],metallicFactor:1,roughnessFactor:1};let n=t.values?.tex||t.values?.texture2d_0||t.values?.diffuseTex,r=e.textures.findIndex(e=>e.id===n);r!==-1&&(t.pbrMetallicRoughness.baseColorTexture={index:r})}}};function mw(e,t={}){return new pw().normalize(e,t)}function hw(e,t){let n=e.basis,r=n?.format;return{...e,core:{...e.core,mimeType:t},basis:{...n,format:r&&r!==`auto`?r:$x(n?.supportedTextureFormats)}}}async function gw(e,t,n=0,r,i){return _w(e,t,n,r),mw(e,{normalize:r?.gltf?.normalize}),ow(e,r,i),r?.gltf?.loadBuffers&&e.json.buffers&&await vw(e,r,i),r?.gltf?.loadImages&&await yw(e,r,i),await sw(e,r,i),e}function _w(e,t,n,r){if(r.core?.baseUrl&&(e.baseUri=r.core?.baseUrl),t instanceof ArrayBuffer&&!fS(t,n,r.glb)&&(t=new TextDecoder().decode(t)),typeof t==`string`)e.json=yv(t);else if(t instanceof ArrayBuffer){let i={};n=pS(i,t,n,r.glb),J(i.type===`glTF`,`Invalid GLB magic string ${i.type}`),e._glb=i,e.json=i.json}else J(!1,`GLTF: must be ArrayBuffer or string`);let i=e.json.buffers||[];if(e.buffers=Array(i.length).fill(null),e._glb&&e._glb.header.hasBinChunk){let{binChunks:t}=e._glb;e.buffers[0]={arrayBuffer:t[0].arrayBuffer,byteOffset:t[0].byteOffset,byteLength:t[0].byteLength}}let a=e.json.images||[];e.images=Array(a.length).fill({})}async function vw(e,t,n){let r=e.json.buffers||[];for(let i=0;i<r.length;++i){let a=r[i];if(a.uri){let{fetch:r}=n;J(r);let o=yS(a.uri,t,n),s=await(await n?.fetch?.(o))?.arrayBuffer?.();e.buffers[i]={arrayBuffer:s,byteOffset:0,byteLength:s.byteLength},delete a.uri}else e.buffers[i]===null&&(e.buffers[i]={arrayBuffer:new ArrayBuffer(a.byteLength),byteOffset:0,byteLength:a.byteLength})}}async function yw(e,t,n){let r=bw(e),i=e.json.images||[],a=[];for(let o of r)a.push(xw(e,i[o],o,t,n));return await Promise.all(a)}function bw(e){let t=new Set,n=e.json.textures||[];for(let e of n)e.source!==void 0&&t.add(e.source);return Array.from(t).sort()}async function xw(e,t,n,r,i){let a;if(t.uri&&!t.hasOwnProperty(`bufferView`)){let e=yS(t.uri,r,i),{fetch:n}=i;a=await(await n(e)).arrayBuffer(),t.bufferView={data:a}}if(Number.isFinite(t.bufferView)){let n=Vy(e.json,e.buffers,t.bufferView);a=Cv(n.buffer,n.byteOffset,n.byteLength)}J(a,`glTF image has no data`);let o=hw(r,t.mimeType),s=await d_(a,[wy,tS],o,i);s&&s[0]&&(s={compressed:!0,mipmaps:!1,width:s[0].width,height:s[0].height,data:s[0]}),e.images=e.images||[],e.images[n]=s}var Sw={dataType:null,batchType:null,name:`glTF`,id:`gltf`,module:`gltf`,version:dx,extensions:[`gltf`,`glb`],mimeTypes:[`model/gltf+json`,`model/gltf-binary`],text:!0,binary:!0,tests:[`glTF`],parse:Cw,options:{gltf:{normalize:!0,loadBuffers:!0,loadImages:!0,decompressMeshes:!0}}};async function Cw(e,t={},n){let r={...Sw.options,...t};return r.gltf={...Sw.options.gltf,...r.gltf},await gw({},e,t?.glb?.byteOffset||0,r,n)}var ww={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Tw={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Ew={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},Dw={magFilter:Ew.TEXTURE_MAG_FILTER,minFilter:Ew.TEXTURE_MIN_FILTER,wrapS:Ew.TEXTURE_WRAP_S,wrapT:Ew.TEXTURE_WRAP_T},Ow={[Ew.TEXTURE_MAG_FILTER]:Ew.LINEAR,[Ew.TEXTURE_MIN_FILTER]:Ew.NEAREST_MIPMAP_LINEAR,[Ew.TEXTURE_WRAP_S]:Ew.REPEAT,[Ew.TEXTURE_WRAP_T]:Ew.REPEAT};function kw(){return{id:`default-sampler`,parameters:Ow}}function Aw(e){return Tw[e]}function jw(e){return ww[e]}var Mw=class{baseUri=``;jsonUnprocessed;json;buffers=[];images=[];postProcess(e,t={}){let{json:n,buffers:r=[],images:i=[]}=e,{baseUri:a=``}=e;return J(n),this.baseUri=a,this.buffers=r,this.images=i,this.jsonUnprocessed=n,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){let n={...e};return this.json=n,e.bufferViews&&(n.bufferViews=e.bufferViews.map((e,t)=>this._resolveBufferView(e,t))),e.images&&(n.images=e.images.map((e,t)=>this._resolveImage(e,t))),e.samplers&&(n.samplers=e.samplers.map((e,t)=>this._resolveSampler(e,t))),e.textures&&(n.textures=e.textures.map((e,t)=>this._resolveTexture(e,t))),e.accessors&&(n.accessors=e.accessors.map((e,t)=>this._resolveAccessor(e,t))),e.materials&&(n.materials=e.materials.map((e,t)=>this._resolveMaterial(e,t))),e.meshes&&(n.meshes=e.meshes.map((e,t)=>this._resolveMesh(e,t))),e.nodes&&(n.nodes=e.nodes.map((e,t)=>this._resolveNode(e,t)),n.nodes=n.nodes.map((e,t)=>this._resolveNodeChildren(e))),e.skins&&(n.skins=e.skins.map((e,t)=>this._resolveSkin(e,t))),e.scenes&&(n.scenes=e.scenes.map((e,t)=>this._resolveScene(e,t))),typeof this.json.scene==`number`&&n.scenes&&(n.scene=n.scenes[this.json.scene]),n}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t==`object`)return t;let n=e&&e[t];return n||console.warn(`glTF file error: Could not find ${e}[${t}]`),n}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(e=>this.getNode(e))}}_resolveNode(e,t){let n={...e,id:e?.id||`node-${t}`};return e.mesh!==void 0&&(n.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(n.camera=this.getCamera(e.camera)),e.skin!==void 0&&(n.skin=this.getSkin(e.skin)),e.meshes!==void 0&&e.meshes.length&&(n.mesh=e.meshes.reduce((e,t)=>{let n=this.getMesh(t);return e.id=n.id,e.primitives=e.primitives.concat(n.primitives),e},{primitives:[]})),n}_resolveNodeChildren(e){return e.children&&=e.children.map(e=>this.getNode(e)),e}_resolveSkin(e,t){let n=typeof e.inverseBindMatrices==`number`?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:n}}_resolveMesh(e,t){let n={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(n.primitives=e.primitives.map((e,t)=>{let r={...e,attributes:{},indices:void 0,material:void 0},i=e.attributes;for(let e in i)r.attributes[e]=this.getAccessor(i[e]);return e.indices!==void 0&&(r.indices=this.getAccessor(e.indices)),e.material!==void 0&&(r.material=this.getMaterial(e.material)),Nw(r,n.id,t)})),n}_resolveMaterial(e,t){let n={...e,id:e.id||`material-${t}`};if(n.normalTexture&&(n.normalTexture={...n.normalTexture},n.normalTexture.texture=this.getTexture(n.normalTexture.index)),n.occlusionTexture&&(n.occlusionTexture={...n.occlusionTexture},n.occlusionTexture.texture=this.getTexture(n.occlusionTexture.index)),n.emissiveTexture&&(n.emissiveTexture={...n.emissiveTexture},n.emissiveTexture.texture=this.getTexture(n.emissiveTexture.index)),n.emissiveFactor||=n.emissiveTexture?[1,1,1]:[0,0,0],n.pbrMetallicRoughness){n.pbrMetallicRoughness={...n.pbrMetallicRoughness};let e=n.pbrMetallicRoughness;e.baseColorTexture&&(e.baseColorTexture={...e.baseColorTexture},e.baseColorTexture.texture=this.getTexture(e.baseColorTexture.index)),e.metallicRoughnessTexture&&(e.metallicRoughnessTexture={...e.metallicRoughnessTexture},e.metallicRoughnessTexture.texture=this.getTexture(e.metallicRoughnessTexture.index))}return n}_resolveAccessor(e,t){let n=Aw(e.componentType),r=jw(e.type),i=n*r,a={...e,id:e.id||`accessor-${t}`,bytesPerComponent:n,components:r,bytesPerElement:i,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(a.bufferView=this.getBufferView(e.bufferView)),a.bufferView){let e=a.bufferView.buffer,{ArrayType:t,byteLength:n}=By(a,a.bufferView),r=(a.bufferView.byteOffset||0)+(a.byteOffset||0)+e.byteOffset,i=Iv(e.arrayBuffer,r,n);a.bufferView.byteStride&&(i=this._getValueFromInterleavedBuffer(e,r,a.bufferView.byteStride,a.bytesPerElement,a.count)),a.value=new t(i)}else{let{ArrayType:e}=By(a,{byteLength:a.count*a.bytesPerElement});a.value=new e(a.count*a.components)}return e.sparse&&this._applySparseAccessor(a,e.sparse),a}_applySparseAccessor(e,t){let n=Pw(t.indices.componentType),r=this._getTypedArrayFromBufferView(n,this.getBufferView(t.indices.bufferView),t.indices.byteOffset||0,t.count),i=e.value.constructor,a=this._getTypedArrayFromBufferView(i,this.getBufferView(t.values.bufferView),t.values.byteOffset||0,t.count*e.components);for(let n=0;n<t.count;n++){let t=Number(r[n]);J(Number.isInteger(t)&&t>=0&&t<e.count,`glTF sparse accessor index is out of bounds`);for(let r=0;r<e.components;r++){let i=t*e.components+r,o=n*e.components+r;Reflect.set(e.value,i,a[o])}}}_getTypedArrayFromBufferView(e,t,n,r){let i=r*e.BYTES_PER_ELEMENT;J(n+i<=t.byteLength,`glTF sparse accessor data exceeds its buffer view`);let a=t.buffer,o=a.byteOffset+(t.byteOffset||0)+n;return new e(Iv(a.arrayBuffer,o,i))}_getValueFromInterleavedBuffer(e,t,n,r,i){let a=new Uint8Array(i*r);for(let o=0;o<i;o++){let i=t+o*n;a.set(new Uint8Array(e.arrayBuffer.slice(i,i+r)),o*r)}return a.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler==`number`?this.getSampler(e.sampler):kw(),source:typeof e.source==`number`?this.getImage(e.source):void 0}}_resolveSampler(e,t){let n={id:e.id||`sampler-${t}`,...e,parameters:{}};for(let e in n){let t=this._enumSamplerParameter(e);t!==void 0&&(n.parameters[t]=n[e])}return n}_enumSamplerParameter(e){return Dw[e]}_resolveImage(e,t){let n={...e,id:e.id||`image-${t}`,image:null,bufferView:e.bufferView===void 0?void 0:this.getBufferView(e.bufferView)},r=this.images[t];return r&&(n.image=r),n}_resolveBufferView(e,t){let n=e.buffer,r=this.buffers[n].arrayBuffer,i=this.buffers[n].byteOffset||0;return e.byteOffset&&(i+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[n],data:new Uint8Array(r,i,e.byteLength)}}_resolveCamera(e,t){let n={...e,id:e.id||`camera-${t}`};return n.perspective,n.orthographic,n}};function Nw(e,t,n){if(e.mode!==2&&e.mode!==6)return e;let r=e.indices?.value,i=e.indices?.count??Fw(e),a=Iw(r,i),o=a<=65535?Uint16Array:Uint32Array,s=e.mode===2?zw(r,i,o):Bw(r,i,o);return e.mode=e.mode===2?1:4,e.indices={id:`${t}-primitive-${n}-portable-indices`,components:1,bytesPerComponent:o.BYTES_PER_ELEMENT,bytesPerElement:o.BYTES_PER_ELEMENT,componentType:o===Uint16Array?5123:5125,normalized:!1,count:s.length,type:`SCALAR`,min:s.length?[Lw(s)]:void 0,max:s.length?[a]:void 0,value:s},e}function Pw(e){switch(e){case 5121:return Uint8Array;case 5123:return Uint16Array;case 5125:return Uint32Array;default:throw Error(`Invalid glTF sparse index component type ${e}`)}}function Fw(e){let t=Object.values(e.attributes)[0];return J(t,`glTF primitive must define at least one attribute`),t.count}function Iw(e,t){if(!e)return Math.max(0,t-1);let n=0;for(let r=0;r<t;r++)n=Math.max(n,Number(e[r]));return n}function Lw(e){let t=1/0;for(let n of e)t=Math.min(t,n);return t}function Rw(e,t){return e?Number(e[t]):t}function zw(e,t,n){if(t<2)return new n(0);let r=new n(t*2);for(let n=0;n<t;n++)r[n*2]=Rw(e,n),r[n*2+1]=Rw(e,(n+1)%t);return r}function Bw(e,t,n){let r=Math.max(0,t-2),i=new n(r*3);for(let t=0;t<r;t++)i[t*3]=Rw(e,0),i[t*3+1]=Rw(e,t+1),i[t*3+2]=Rw(e,t+2);return i}function Vw(e,t){return new Mw().postProcess(e,t)}var Hw={alphaCutoff:`alphaCutoff`,anisotropyRotation:`anisotropyRotation`,anisotropyStrength:`anisotropyStrength`,attenuationColor:`attenuationColor`,attenuationDistance:`attenuationDistance`,baseColorFactor:`baseColor`,clearcoatFactor:`clearcoat`,clearcoatRoughnessFactor:`clearcoatRoughness`,bumpFactor:`bumpFactor`,diffuseTransmissionFactor:`diffuseTransmission`,diffuseTransmissionColorFactor:`diffuseTransmissionColor`,dispersion:`dispersion`,emissiveFactor:`emissive`,emissiveStrength:`emissiveStrength`,ior:`indexOfRefraction`,iridescenceFactor:`iridescence`,iridescenceIor:`iridescenceIndexOfRefraction`,normalScale:`normalScale`,multiscatterColorFactor:`multiscatterColor`,scatterAnisotropy:`scatterAnisotropy`,occlusionStrength:`occlusionStrength`,sheenColorFactor:`sheenColor`,sheenRoughnessFactor:`sheenRoughness`,specularColorFactor:`specularColor`,specularIntensityFactor:`specularIntensity`,thicknessFactor:`thickness`,transmissionFactor:`transmission`};function Uw(e,t={}){return e.flatMap(e=>{let n=e.channels.flatMap(e=>Kw(e,t));return n.length>0?[{name:e.name,tracks:n}]:[]})}function Ww(e,t){let n=e.nodes||{},r=new Map,i=new Map,a=new Map,o=!1,s;for(let[e,t]of Object.entries(n)){let n=new wc({id:e,...t.translation?{position:[...t.translation]}:{},...t.rotation?{rotation:[...t.rotation]}:{},...t.scale?{scale:[...t.scale]}:{},...t.matrix?{matrix:[...t.matrix]}:{}});t.weights&&(n.userData.morphWeights=[...t.weights]),r.set(e,n)}for(let[e,t]of Object.entries(n))t.parent&&r.get(t.parent)?.add(r.get(e));let c=(e,t,n)=>{let r=i.get(e)||{};if(t.component!==void 0){let i=e.getParameters(),a=r[t.path]||i[t.path],o=Array.isArray(a)?[...a]:[];o[t.component]=n[0],r[t.path]=o}else r[t.path]=n.length===1?n[0]:[...n];i.set(e,r)},l=e=>{let{target:s}=e,l=`${s.type}:${s.identifier}:${s.path}:${s.component??`*`}`;if(s.type===`node`){let e=r.get(s.identifier);return e?{id:l,getValue:()=>s.path===`translation`?e.position:s.path===`rotation`?e.rotation:s.path===`scale`?e.scale:e.userData.morphWeights||[],setValue:r=>{if(s.path===`translation`)e.setPosition(r);else if(s.path===`rotation`)e.setRotation(r);else if(s.path===`scale`)e.setScale(r);else if(s.path===`weights`){e.userData.morphWeights=[...r];for(let e of n[s.identifier]?.geometries||[]){let n=t.geometries?.get(e);if(n){let e=i.get(n)||{};e.morphWeights=[...r],i.set(n,e)}}return}e.updateMatrix(),o=!0}}:null}if(s.type===`sampler`){let n=t.samplers?.get(s.identifier);if(!n)return null;let r=e.baseTransform||{offset:[0,0],rotation:0,scale:[1,1]},o=a.get(s.identifier);o||(o={offset:[...r.offset],rotation:r.rotation,scale:[...r.scale]},a.set(s.identifier,o));let c=o;return{id:l,setValue:e=>{s.path===`rotation`?c.rotation=e[0]:(s.path===`offset`||s.path===`scale`)&&(s.component===void 0?c[s.path]=[e[0],e[1]]:c[s.path][s.component]=e[0]);let t=i.get(n)||{};t.transform=hg(c),i.set(n,t)}}}let u=s.type===`instance`?t.instances.get(s.identifier):s.type===`material`?t.materials?.get(s.identifier):s.type===`light`?t.lights?.get(s.identifier):s.type===`camera`?t.camera:void 0;return u?{id:l,getValue:()=>{let e=u.getParameters()[s.path];return Array.isArray(e)?s.component===void 0?e:[e[s.component]||0]:typeof e==`number`?[e]:[]},setValue:e=>c(u,s,e)}:null},u=(e.clips||[]).map(e=>{let t=e.tracks.flatMap(e=>{let t=l(e);return t?[new nt({name:`${e.target.type}:${e.target.identifier}:${e.target.path}`,times:e.times,values:e.values,interpolation:e.interpolation,valueType:e.target.path===`rotation`&&e.target.type===`node`?`quaternion`:`vector`,binding:t})]:[]});return new rt({name:e.name,tracks:t,duration:e.duration})}),d=new at(u),f=e.playback?.clip||u[0]?.name;if(f){let t=d.clipAction(f,{loop:e.playback?.loop,timeScale:e.playback?.speed});t.play(),e.playback?.playing===!1&&t.pause()}let p=(e,a)=>{let o=r.get(e);if(!o)return;let s=new P(a).multiplyRight(o.matrix);for(let r of n[e]?.instances||[]){let e=t.instances.get(r);if(e){let t=i.get(e)||{};t.transform=Array.from(s),i.set(e,t)}}for(let[t,r]of Object.entries(n))r.parent===e&&p(t,s)},m=()=>{if(!t.skins?.size)return;let e=new Map;for(let[t,i]of Object.entries(n))i.parent||r.get(t)?.preorderTraversal((t,{worldMatrix:n})=>{t instanceof wc&&e.set(t,new P(n))});for(let[n,a]of t.skins){let t=r.get(a.node),o=a.joints.flatMap(e=>{let t=r.get(e);return t?[t]:[]});if(!t||o.length!==a.joints.length)continue;let s=Jn({joints:o,meshNode:t,worldMatrices:e,inverseBindMatrices:a.inverseBindMatrices}),c=n.getParameter(`skin`)?.jointMatrices;if(c?.length===s.length&&s.every((e,t)=>e===c[t]))continue;let l=i.get(n)||{};l.skin={jointMatrices:s},i.set(n,l)}},h=()=>{if(o){for(let[e,t]of Object.entries(n))t.parent||p(e,new P);m(),o=!1}for(let[e,t]of i){let n=e.getParameters(),r=Object.fromEntries(Object.entries(t).filter(([e,t])=>!Gw(n[e],t)));Object.keys(r).length!==0&&(e.type===`geometry`||e.type===`material`||e.type===`light`||e.type===`camera`||e.type===`surface`?e.setParameters(r):(e.type===`sampler`||e.type===`instance`)&&e.setParameter(`transform`,r.transform),e.commitParameters())}i.clear()};return t.skins?.size&&(m(),h()),{mixer:d,clipNames:u.map(e=>e.name),get activeClip(){return f},update(e){let t=s===void 0?0:e-s;s=e,d.update(t),h()},selectClip(e){f&&f!==e&&d.getAction(f)?.stop(),f=e,d.clipAction(e).play(),h()},play(){f&&d.clipAction(f).play()},pause(){f&&d.clipAction(f).pause()},seek(e){let t=f?d.getAction(f):void 0;t?(t.setTime(e),d.time=e,d.update(0)):d.setTime(e),h()},setSpeed(e){f&&d.clipAction(f).setEffectiveTimeScale(e)}}}function Gw(e,t){return Array.isArray(e)&&Array.isArray(t)?e.length===t.length&&e.every((e,n)=>e===t[n]):e===t}function Kw(e,t){let n,r;if(e.type===`node`)n={type:`node`,identifier:t.nodeIdentifiers?.[e.targetNodeId]||e.targetNodeId,path:e.path};else if(e.type===`material`){let r=t.materialIdentifiers?.[e.targetMaterialIndex];if(!r)return[];let i=e.property===`baseColorFactor`&&e.component===3;if(i&&t.materialAlphaModes?.[e.targetMaterialIndex]===`OPAQUE`)return[];let a=e.property===`metallicRoughnessValues`||e.property===`iridescenceThicknessRange`||i,o=i?`opacity`:e.property===`metallicRoughnessValues`?e.component===0?`metallic`:`roughness`:e.property===`iridescenceThicknessRange`?e.component===0?`iridescenceThicknessMinimum`:`iridescenceThicknessMaximum`:Hw[e.property];if(!o)return[];n={type:`material`,identifier:r,path:o,...e.component!==void 0&&!a?{component:e.component}:{}}}else if(e.type===`textureTransform`){let i=t.samplerIdentifiers?.[`${e.targetMaterialIndex}:${e.textureSlot}`];if(!i)return[];n={type:`sampler`,identifier:i,path:e.path,...e.component===void 0?{}:{component:e.component}},r={offset:[...e.baseTransform.offset],rotation:e.baseTransform.rotation,scale:[...e.baseTransform.scale]}}else return[];let i=e.sampler.interpolation,a={target:n,times:[...e.sampler.input],values:e.sampler.output.map(e=>[...e]),...i===`LINEAR`?{}:{interpolation:i},...r?{baseTransform:r}:{}};return e.type===`material`&&e.property===`baseColorFactor`&&e.component===void 0&&e.sampler.output.every(e=>e.length>3)&&t.materialAlphaModes?.[e.targetMaterialIndex]!==`OPAQUE`?[a,{...a,target:{...n,path:`opacity`},values:e.sampler.output.map(e=>[e[3]])}]:[a]}var qw=[`triangle`,`sphere`,`cylinder`,`cone`,`quad`],Jw=[`matte`,`physicallyBased`],Yw=[`ambient`,`directional`,`point`,`spot`],Xw=[`perspective`,`orthographic`],Zw=[`default`,`deferred`,`raytrace`,`debugNormals`,`debugDepth`],Qw={"@@type":`default`,background:[.016,.019,.044,1],ambientRadiance:.1,exposure:1.5,bloomIntensity:.82,bloomThreshold:.64,bloomRadius:8,fogColor:[.018,.025,.065],fogDensity:24e-5},$w={resolutionScale:.5,minimumResolutionScale:.25,adaptiveResolution:!0,targetFrameTimeMilliseconds:33.3,temporalReprojection:!0,shadowSamplesPerFrame:1,progressive:!0,shadows:!0},eT=[`baseColorTexture`,`normalTexture`,`bumpTexture`,`metallicRoughnessTexture`,`emissiveTexture`,`occlusionTexture`,`specularColorTexture`,`specularIntensityTexture`,`clearcoatTexture`,`clearcoatRoughnessTexture`,`clearcoatNormalTexture`,`transmissionTexture`,`diffuseTransmissionTexture`,`diffuseTransmissionColorTexture`,`thicknessTexture`,`multiscatterColorTexture`,`sheenColorTexture`,`sheenRoughnessTexture`,`iridescenceTexture`,`iridescenceThicknessTexture`,`anisotropyTexture`],tT=new Map;async function nT(e){if(typeof createImageBitmap!=`function`)return;let t=new Map;for(let n of Object.values(e.textures||{}))tT.has(n.source)||t.has(n.source)||t.set(n.source,fetch(n.source).then(async e=>{if(!e.ok)throw Error(`Unable to load texture "${n.source}": ${e.status}.`);return createImageBitmap(await e.blob())}).then(e=>{tT.set(n.source,e)}).catch(e=>{throw Error(`Unable to load texture "${n.source}": ${String(e)}`)}));await Promise.all(t.values())}function rT(e,t,n={}){if(t.version!==1)throw Error(`Scene "version" must be 1.`);let r=new Map,i=new Map,a=[],o=new Map,s=new Map,c=new Map,l=new Map,u=new Map,d=new Map,f=new Map,p=[],m=[],h=iT(t),g=[];for(let[n,i]of Object.entries(t.geometries)){let{"@@type":t,"vertex.position":a,"vertex.normal":o,"vertex.tangent":s,"vertex.joint":c,"vertex.weight":l,"vertex.attribute0":u,"vertex.attribute1":d,"vertex.attribute2":f,"primitive.index":p,morphTargets:m,generator:h,...g}=i;yT(`geometry`,t,qw);let _={...g};if(a&&(_[`vertex.position`]=new Float32Array(a)),o&&(_[`vertex.normal`]=new Float32Array(o)),s&&(_[`vertex.tangent`]=new Float32Array(s)),c&&(_[`vertex.joint`]=new Uint16Array(c)),l&&(_[`vertex.weight`]=new Float32Array(l)),u&&(_[`vertex.attribute0`]=new Float32Array(u)),d&&(_[`vertex.attribute1`]=new Float32Array(d)),f&&Object.assign(_,{"vertex.attribute2":new Float32Array(f)}),p&&(_[`primitive.index`]=new Uint32Array(p)),m&&(_.morphTargets=m.map(e=>({...e.POSITION?{POSITION:new Float32Array(e.POSITION)}:{},...e.NORMAL?{NORMAL:new Float32Array(e.NORMAL)}:{},...e.TANGENT?{TANGENT:new Float32Array(e.TANGENT)}:{}}))),h){if(t!==`triangle`)throw Error(`Geometry "${n}" generators require the "triangle" subtype.`);Object.assign(_,lT(h))}r.set(n,e.newGeometry(t,_))}for(let[n,r]of Object.entries(t.textures||{})){let t=tT.get(r.source);if(!t)throw Error(`Texture "${n}" must be loaded before creating its ANARI scene.`);let o=wg(e.device,t,{id:`anari-${n}`,width:t.width,height:t.height,colorSpace:r.colorSpace||`linear`,sampler:{addressModeU:`repeat`,addressModeV:`repeat`,minFilter:`linear`,magFilter:`linear`,...r.sampler}});a.push(o),i.set(n,e.newSampler(`image2D`,{image:o,transform:r.transform,textureCoordinateSet:r.textureCoordinateSet}))}for(let[n,r]of Object.entries(t.materials)){let{"@@type":t,...a}=r;yT(`material`,t,Jw);let s={};for(let[e,t]of Object.entries(a))eT.includes(e)?s[e]=_T(i,String(t),`texture`):Object.assign(s,{[e]:t});o.set(n,e.newMaterial(t,s))}for(let[n,i]of Object.entries(t.surfaces)){let t=_T(r,i.geometry,`geometry`),a=_T(o,i.material,`material`),l=e.newSurface({geometry:t,material:a,...i.skin?{skin:{jointMatrices:new Float32Array(i.skin.joints.length*16)}}:{}});s.set(n,l),i.skin&&c.set(l,i.skin)}for(let n of t.lights||[]){let{"@@id":t,"@@type":r,animation:i,...a}=n;yT(`light`,r,Yw),vT(l,t,`light`);let o=e.newLight(r,a);l.set(t,o),i&&g.push({identifier:t,light:o,parameters:a,animation:i})}for(let[n,r]of Object.entries(t.groups||{}))u.set(n,e.newGroup({surface:r.surfaces.map(e=>_T(s,e,`surface`)),light:r.lights?.map(e=>_T(l,e,`light`))}));let _=t=>{let n=t[`@@id`];vT(d,n,`instance`);let r;if(t.group)r=_T(u,t.group,`group`);else if(t.surface){let n=f.get(t.surface);r=n||e.newGroup({surface:[_T(s,t.surface,`surface`)]}),n||f.set(t.surface,r)}else throw Error(`Instance "${n}" must declare a "group" or "surface".`);let i=e.newInstance({group:r,transform:hT(t)});d.set(n,i);let a=t.animations||(t.animation?[t.animation]:[]);a.length>0&&!h.instances.has(n)&&p.push(aT(i,t,a))};for(let e of t.instances||[])_(e);for(let e of t.distributions||[]){if(e[`@@type`]!==`starfield`)throw Error(`Unsupported distribution "${e[`@@type`]}".`);for(let t of cT(e))_(t)}for(let{identifier:e,light:t,parameters:n,animation:r}of g)h.lights.has(e)||m.push(oT(t,n,r,d));let v=e.newWorld({surface:(t.world?.surfaces||[]).map(e=>_T(s,e,`surface`)),instance:t.world?.instances?t.world.instances.map(e=>_T(d,e,`instance`)):Array.from(d.values()),light:t.world?.lights?t.world.lights.map(e=>_T(l,e,`light`)):Array.from(l.values())}),{"@@type":y,target:b=[0,0,0],orbit:x,...S}=t.camera;yT(`camera`,y,Xw);let C=S.position||[0,4,12],w=e.newCamera(y,{...S,position:C,direction:S.direction||gT(b,C)}),{"@@type":T,...E}=t.renderer||Qw,D=n.rendererSubtype||T;yT(`renderer`,D,Zw);let O=e.newRenderer(D,{...D===`raytrace`?$w:{},...E}),k=e.newFrame({world:v,camera:w,renderer:O}),A=t.clips?.length||c.size>0?Ww(t,{instances:d,geometries:r,materials:o,samplers:i,lights:l,camera:w,skins:c}):void 0;return{frame:k,name:t.name,description:t.description||``,cameraTarget:b,cameraPosition:C,cameraOrbitSpeed:x?.speed||0,animations:A,update(e){A?.update(e);for(let t of p)t(e);for(let t of m)t(e)},destroy(){k.destroy();for(let e of a)e.destroy()}}}function iT(e){let t=new Set,n=new Set,r=new Set;for(let i of e.clips||[])for(let{target:e}of i.tracks)e.type===`instance`?t.add(e.identifier):e.type===`light`?n.add(e.identifier):e.type===`node`&&r.add(e.identifier);for(let[n,i]of Object.entries(e.nodes||{})){let a=new Set,o=n;for(;o&&!a.has(o);){if(r.has(o)){for(let e of i.instances||[])t.add(e);break}a.add(o),o=e.nodes?.[o]?.parent}}return{instances:t,lights:n}}function aT(e,t,n){let r=t.position||[0,0,0],i=t.rotation||[0,0,0];for(let e of n)if(e[`@@type`]!==`orbit`&&e[`@@type`]!==`bob`&&e[`@@type`]!==`spin`&&e[`@@type`]!==`wobble`)throw Error(`Instance "${t[`@@id`]}" does not support "${e[`@@type`]}" animation.`);return a=>{let o=r,s=[...i];for(let e of n)if(e[`@@type`]===`orbit`)o=sT(e,r,a);else if(e[`@@type`]===`bob`)o=[o[0],o[1]+Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.4),o[2]];else if(e[`@@type`]===`spin`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=a*(e.speed??1)+(e.phase||0)}else if(e[`@@type`]===`wobble`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.08)}e.setParameter(`transform`,hT({...t,position:o,rotation:s})).commitParameters()}}function oT(e,t,n,r){if(n[`@@type`]===`orbit`){let r=t.position||[3,2,0];return t=>{e.setParameter(`position`,sT(n,r,t)).commitParameters()}}if(n[`@@type`]===`pulse`){let r=t.intensity??1,i=n.amplitude??.5,a=n.speed??1,o=n.phase||0;return t=>{e.setParameter(`intensity`,r*(1+Math.sin(t*a+o)*i)).commitParameters()}}if(n[`@@type`]===`follow`){let t=_T(r,n.target,`instance`),i=n.offset||[0,0,0];return()=>{let n=t.getParameter(`transform`);n&&e.setParameter(`position`,[n[12]+i[0],n[13]+i[1],n[14]+i[2]]).commitParameters()}}throw Error(`Lights do not support "${n[`@@type`]}" animation.`)}function sT(e,t,n){let r=e.center||[0,t[1],0],i=e.radius||Math.hypot(t[0]-r[0],t[2]-r[2])||3,a=n*(e.speed??1)+(e.phase||0),o=Math.sin(a)*Math.sin(e.inclination||0)*i,s=(e.height||0)*Math.sin(a*(e.verticalFrequency??2));return[r[0]+Math.cos(a)*i,r[1]+o+s,r[2]+Math.sin(a)*i]}function cT(e){let t=[],n=e.seed||0;for(let r=0;r<e.count;r++){let i=mT(r*7+1+n)*Math.PI*2,a=mT(r*11+3+n)*.82+.08,o=e.radius*(.72+mT(r*13+5+n)*.32),s=.7+mT(r*19+n)*2;t.push({"@@id":`${e[`@@id`]}-${r}`,surface:e.surface,position:[Math.cos(i)*Math.cos(a)*o,Math.sin(a)*o,Math.sin(i)*Math.cos(a)*o],scale:[s,s,s]})}return t}function lT(e){return e[`@@type`]===`torus`?uT(e):e[`@@type`]===`crystal`?dT(e):fT(e)}function uT(e){let t=e.majorRadius??1,n=e.minorRadius??.035,r=e.majorSegments??64,i=e.minorSegments??8,a=(r+1)*(i+1),o=new Float32Array(a*3),s=new Float32Array(a*3),c=new Uint32Array(r*i*6);for(let e=0;e<=r;e++){let a=e/r*Math.PI*2,c=Math.cos(a),l=Math.sin(a);for(let r=0;r<=i;r++){let a=r/i*Math.PI*2,u=Math.cos(a),d=Math.sin(a),f=(e*(i+1)+r)*3,p=t+n*u;o[f]=p*c,o[f+1]=n*d,o[f+2]=p*l,s[f]=u*c,s[f+1]=d,s[f+2]=u*l}}let l=0;for(let e=0;e<r;e++)for(let t=0;t<i;t++){let n=e*(i+1)+t,r=(e+1)*(i+1)+t;c[l++]=n,c[l++]=r,c[l++]=n+1,c[l++]=n+1,c[l++]=r,c[l++]=r+1}return{"vertex.position":o,"vertex.normal":s,"primitive.index":c}}function dT(e){let t=e.radius??.5,n=e.height??1.8,r=e.sides??6,i=[],a=[];for(let e=0;e<r;e++){let o=e/r*Math.PI*2,s=(e+1)/r*Math.PI*2,c=[Math.cos(o)*t,0,Math.sin(o)*t],l=[Math.cos(s)*t,0,Math.sin(s)*t];pT(i,a,[0,n*.66,0],l,c),pT(i,a,[0,-n*.34,0],c,l)}return{"vertex.position":new Float32Array(i),"vertex.normal":new Float32Array(a)}}function fT(e){let t=e.radius??.5,n=e.height??1,r=e.sides??12,i=Math.min(e.bevel??.11,n*.24),a=[],o=[];for(let e=0;e<r;e++){let s=e/r*Math.PI*2,c=(e+1)/r*Math.PI*2,l=(e,t,n)=>[Math.cos(e)*t,n,Math.sin(e)*t],u=l(s,t*.77,-n/2),d=l(c,t*.77,-n/2),f=l(s,t,-n/2+i),p=l(c,t,-n/2+i),m=l(s,t,n/2-i),h=l(c,t,n/2-i),g=l(s,t*.77,n/2),_=l(c,t*.77,n/2);pT(a,o,u,f,p),pT(a,o,u,p,d),pT(a,o,f,m,h),pT(a,o,f,h,p),pT(a,o,m,g,_),pT(a,o,m,_,h),pT(a,o,[0,-n/2,0],u,d),pT(a,o,[0,n/2,0],_,g)}return{"vertex.position":new Float32Array(a),"vertex.normal":new Float32Array(o)}}function pT(e,t,n,r,i){let a=gT(r,n),o=gT(i,n),s=[a[1]*o[2]-a[2]*o[1],a[2]*o[0]-a[0]*o[2],a[0]*o[1]-a[1]*o[0]],c=Math.hypot(...s)||1,l=[s[0]/c,s[1]/c,s[2]/c];e.push(...n,...r,...i),t.push(...l,...l,...l)}function mT(e){let t=Math.sin(e*91.7341+19.19)*43758.5453;return t-Math.floor(t)}function hT(e){if(e.matrix)return e.matrix;let t=new P().translate(e.position||[0,0,0]);return e.rotation&&(t.rotateX(e.rotation[0]),t.rotateY(e.rotation[1]),t.rotateZ(e.rotation[2])),e.scale&&t.scale(e.scale),t}function gT(e,t){return[e[0]-t[0],e[1]-t[1],e[2]-t[2]]}function _T(e,t,n){let r=e.get(t);if(!r)throw Error(`Unknown ${n} reference "${t}".`);return r}function vT(e,t,n){if(!t)throw Error(`Every ${n} requires an "@@id".`);if(e.has(t))throw Error(`Duplicate ${n} identifier "${t}".`)}function yT(e,t,n){if(!n.some(e=>e===t))throw Error(`Unsupported ${e} subtype "${t}". Expected ${n.join(`, `)}.`)}var bT=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},xT=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,ST=/^([-\w.]+\/[-\w.+]+)/;function CT(e,t){return e.toLowerCase()===t.toLowerCase()}function wT(e){let t=ST.exec(e);return t?t[1]:e}function TT(e){let t=xT.exec(e);return t?t[1]:``}var ET=/\?.*/;function DT(e){let t=e.match(ET);return t&&t[0]}function OT(e){return e.replace(ET,``)}function kT(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function AT(e){return D_(e)?e.url:O_(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function jT(e){if(D_(e)){let t=e.headers.get(`content-type`)||``,n=OT(e.url);return wT(t)||TT(n)}return O_(e)?e.type||``:typeof e==`string`?TT(e):``}function MT(e){return D_(e)?e.headers[`content-length`]||-1:O_(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function NT(e){if(D_(e))return e;let t={},n=MT(e);n>=0&&(t[`content-length`]=String(n));let r=AT(e),i=jT(e);i&&(t[`content-type`]=i);let a=await IT(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function PT(e){if(!e.ok)throw await FT(e)}async function FT(e){let t=kT(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new bT(n,r)}async function IT(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${LT(e.slice(0,5))}`:null}function LT(e){let t=``,n=new Uint8Array(e);for(let e=0;e<n.byteLength;e++)t+=String.fromCharCode(n[e]);return btoa(t)}function RT(e){return!zT(e)&&!BT(e)}function zT(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function BT(e){return e.startsWith(`data:`)}async function VT(e,t){if(typeof e==`string`){let n=jv(e);return RT(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await NT(e)}var HT=new s({id:`loaders.gl`}),UT=class{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},WT={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:m_,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},GT={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},KT=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function qT(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function JT(){let e=qT();return e.globalOptions=e.globalOptions||{...WT,core:{...WT.core}},XT(e.globalOptions)}function YT(e,t,n,r){return n||=[],n=Array.isArray(n)?n:[n],ZT(e,n),XT(eE(t,e,r))}function XT(e){let t=rE(e);iE(t);for(let e of KT)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function ZT(e,t){QT(e,null,WT,GT,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};QT(r,n.id,i,a,t)}}function QT(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&x_(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)HT.level>0&&HT.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&HT.level>0){let e=$T(s,i);HT.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function $T(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function eE(e,t,n){let r=e.options||{},i={...r};return r.core&&(i.core={...r.core}),iE(i),i.core?.log===null&&(i.core={...i.core,log:new UT}),tE(i,XT(JT())),tE(i,XT(t)),nE(i,n),aE(i),i}function tE(e,t){for(let n in t)if(n in t){let r=t[n];S_(r)&&S_(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function nE(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=zv(OT(t)))}function rE(e){let t={...e};return e.core&&(t.core={...e.core}),t}function iE(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of KT)if(e[t]!==void 0){let n=e.core=e.core||{};n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function aE(e){let t=e.core;if(t)for(let n of KT)t[n]!==void 0&&(e[n]=t[n])}function oE(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function sE(e){f_(e,`null loader`),f_(oE(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var cE=()=>{let e=qT();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function lE(){return cE()}var uE=/\.([^.]+)$/;async function dE(e,t=[],n,r){if(!hE(e))return null;let i=XT(n||{});if(i.core||={},e instanceof Response&&fE(e)){let n=pE(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=pE(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(O_(e)&&(e=await e.slice(0,10).arrayBuffer(),a=pE(e,t,i,r)),!a&&e instanceof Response&&fE(e)&&(a=pE(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(gE(e));return a}function fE(e){let t=jT(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function pE(e,t=[],n,r){if(!hE(e))return null;let i=XT(n||{});if(i.core||={},t&&!Array.isArray(t))return sE(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...lE()),_E(a);let o=mE(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(gE(e));return o}function mE(e,t,n,r){let i=AT(e),a=jT(e),o=OT(i)||r?.url,s=null,c=``;return n?.core?.mimeType&&(s=bE(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=vE(t,o),c||=s?`matched url ${o}`:``,s||=bE(t,a),c||=s?`matched MIME type ${a}`:``,s||=xE(t,e),c||=s?`matched initial data ${TE(e)}`:``,n?.core?.fallbackMimeType&&(s||=bE(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&v_.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function hE(e){return!(e instanceof Response&&e.status===204)}function gE(e){let t=AT(e),n=jT(e),r=`No valid loader found (`;r+=t?`${Rv(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?TE(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function _E(e){for(let t of e)sE(t)}function vE(e,t){let n=t&&uE.exec(t),r=n&&n[1];return r?yE(e,r):null}function yE(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function bE(e,t){for(let n of e)if(n.mimeTypes?.some(e=>CT(t,e))||CT(t,`application/x.${n.id}`))return n;return null}function xE(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(SE(t,n))return n}else if(ArrayBuffer.isView(t)){if(CE(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&CE(t,0,n))return n;return null}function SE(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function CE(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>wE(e,t,n,r))}function wE(e,t,n,r){if(w_(r))return bv(r,e,r.byteLength);switch(typeof r){case`function`:return r(Fv(e));case`string`:return r===EE(e,t,r.length);default:return!1}}function TE(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?EE(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?EE(e,0,t):``}function EE(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var DE=256*1024;function*OE(e,t){let n=t?.chunkSize||DE,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield Fv(i.encode(a))}}var kE=256*1024;function*AE(e,t={}){let{chunkSize:n=kE}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var jE=1024*1024;async function*ME(e,t){let n=t?.chunkSize||jE,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function NE(e,t){return m_?PE(e,t):FE(e,t)}async function*PE(e,t){let n=e.getReader(),r;try{for(;;){let e=r||n.read();t?._streamReadAhead&&(r=n.read());let{done:i,value:a}=await e;if(i)return;yield Pv(a)}}catch{n.releaseLock()}}async function*FE(e,t){for await(let t of e)yield Pv(t)}function IE(e,t){if(typeof e==`string`)return OE(e,t);if(e instanceof ArrayBuffer)return AE(e,t);if(O_(e))return ME(e,t);if(j_(e))return NE(e,t);if(D_(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return NE(n,t)}throw Error(`makeIterator`)}var LE=`Cannot convert supplied data type`;function RE(e,t,n){if(t.text&&typeof e==`string`)return e;if(Nv(e)&&(e=e.buffer),w_(e)){let n=Lv(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):Pv(n)}throw Error(LE)}async function zE(e,t,n){if(typeof e==`string`||w_(e))return RE(e,t,n);if(O_(e)&&(e=await NT(e)),D_(e))return await PT(e),t.binary?await e.arrayBuffer():await e.text();if(j_(e)&&(e=IE(e,n)),T_(e)||E_(e))return Ev(e);throw Error(LE)}function BE(e,t){let n=JT(),r=e||n,i=r.fetch??r.core?.fetch;return typeof i==`function`?i:x_(i)?e=>VT(e,i):t?.fetch?t?.fetch:VT}function VE(e,t,n){if(n)return n;let r={fetch:BE(t,e),...e};if(r.url){let e=OT(r.url);r.baseUrl=e,r.queryString=DT(r.url),r.filename=Rv(e),r.baseUrl=zv(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function HE(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function UE(e,t,n,r){t&&!Array.isArray(t)&&!oE(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=AT(e),a=HE(t,r),o=await dE(e,a,n);if(!o)return null;let s=YT(n,o,a,i);return r=VE({url:i,_parse:UE,loaders:a},s,r||null),await WE(o,e,s,r)}async function WE(e,t,n,r){if(av(e),n=M_(e.options,n),D_(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}t=await zE(t,e,n);let i=e;if(i.parseTextSync&&typeof t==`string`)return i.parseTextSync(t,n,r);if(mv(e,n))return await hv(e,t,n,r,UE);if(i.parseText&&typeof t==`string`)return await i.parseText(t,n,r);if(i.parse)return await i.parse(t,n,r);throw z_(!i.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function GE(e,t,n,r){let i,a;!Array.isArray(t)&&!oE(t)?(i=[],a=t,r=void 0):(i=t,a=n);let o=BE(a),s=e;return typeof e==`string`&&(s=await o(e)),O_(e)&&(s=await o(e)),typeof e==`string`&&(XT(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await UE(s,i,a)}function KE(e,t){let n={version:1,name:t||uD(e),description:`Imported OpenUSD · ${e.layers.length} composed ${e.layers.length===1?`layer`:`layers`}`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.105,exposure:1.55,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={scene:n,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},nextIdentifier:0};for(let t of e.rootPrims)sD(t,r.materials);let i=new P;e.metadata.upAxis===`Z`&&i.rotateX(-Math.PI/2);for(let t of e.rootPrims)JE(t,i,r);return $E(r),n}function qE(e,t){$E({scene:e,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:t,nextIdentifier:Object.keys(e.geometries).length})}function JE(e,t,n){if(Z(e,`visibility`)===`invisible`)return;let r=new P(t).multiplyRight(cD(e));if(e.type===`Mesh`)YE(e,r,n);else if(e.type===`Sphere`||e.type===`Cylinder`||e.type===`Cone`||e.type===`Cube`||e.type===`Capsule`)XE(e,r,n);else if(e.type===`DistantLight`||e.type===`SphereLight`||e.type===`DiskLight`)QE(e,r,n);else if(e.type===`PointInstancer`){ZE(e,r,n);return}if(e.type!==`Material`&&e.type!==`Shader`&&e.type!==`GeomSubset`)for(let t of e.children)JE(t,r,n)}function YE(e,t,n){let r=gD(Z(e,`points`)),i=hD(Z(e,`faceVertexCounts`)),a=hD(Z(e,`faceVertexIndices`));if(r.length===0||i.length===0||a.length===0)return;let o=[],s=0;for(let e of i)o.push(s),s+=e;let c=gD((e.attributes.normals||e.attributes[`primvars:normals`])?.value),l=e.attributes[`primvars:st`]||e.attributes[`primvars:map1`]||e.attributes[`primvars:st0`]||e.attributes[`primvars:uv`],u=gD(l?.value),d=l?hD(Z(e,`${l.name}:indices`)):[],f=dD(e),p=e.children.filter(e=>e.type===`GeomSubset`),m=new Set,h=p.map(e=>{let t=hD(Z(e,`indices`));for(let e of t)m.add(e);return{name:e.name,faceIndices:t,materialPath:dD(e)||f}}),g=i.map((e,t)=>t).filter(e=>!m.has(e));(g.length>0||h.length===0)&&h.push({name:e.name,faceIndices:g,materialPath:f});for(let s of h){if(s.faceIndices.length===0)continue;let l=nD(s.materialPath,s.name,n),f=`${e.sourceUrl||e.path}:${e.name}:${s.name}:${l}`,p=n.surfaceIdentifiers.get(f);if(!p){let t=[],m=[],h=[];for(let e of s.faceIndices){let n=i[e],s=o[e];for(let e=1;e<n-1;e++)for(let n of[0,e,e+1]){let e=a[s+n],i=r[e];if(!i)continue;t.push(i[0],i[1],i[2]);let o=c.length===a.length?c[s+n]:c.length===r.length?c[e]:void 0;o&&m.push(o[0],o[1],o[2]);let l=u[d[s+n]??(u.length===a.length?s+n:e)];l&&l.length>=2&&h.push(l[0],l[1])}}if(t.length===0)continue;let g=bD(e.name,s.name,n),_={"@@type":`triangle`,"vertex.position":t};m.length===t.length&&(_[`vertex.normal`]=m),h.length===t.length/3*2&&(_[`vertex.attribute1`]=h),n.scene.geometries[g]=_,n.scene.surfaces[g]={geometry:g,material:l},p=g,n.surfaceIdentifiers.set(f,g)}lD(n,p,t,`${e.name}-${s.name}`);for(let e of s.faceIndices){let s=i[e],c=o[e];for(let e=0;e<s;e++){let i=r[a[c+e]];i&&xD(n.bounds,t.transformAsPoint(i))}}}}function XE(e,t,n){let r=vD(Z(e,`radius`),.5),i=vD(Z(e,`height`),1),a=vD(Z(e,`size`),1),o=Z(e,`axis`),s=nD(dD(e),e.name,n,e),c=`${e.sourceUrl||``}:${e.path}:${e.type}:${s}:${r}:${i}:${a}:${o}`,l=n.surfaceIdentifiers.get(c);if(!l){l=bD(e.name,e.type,n);let t;t=e.type===`Sphere`?{"@@type":`sphere`,radius:r,segments:24}:e.type===`Cylinder`?{"@@type":`cylinder`,radius:r,height:i,segments:32}:e.type===`Cone`?{"@@type":`cone`,radius:r,height:i,segments:32}:e.type===`Capsule`?{"@@type":`sphere`,radius:r,segments:24}:{"@@type":`triangle`,"vertex.position":SD(a)},n.scene.geometries[l]=t,n.scene.surfaces[l]={geometry:l,material:s},n.surfaceIdentifiers.set(c,l)}e.type===`Capsule`&&t.scale([1,Math.max(1,i/Math.max(r*2,.001)),1]),(e.type===`Cylinder`||e.type===`Cone`)&&o===`Z`&&t.rotateX(Math.PI/2),(e.type===`Cylinder`||e.type===`Cone`)&&o===`X`&&t.rotateZ(Math.PI/2),lD(n,l,t,e.name);let u=e.type===`Cube`?a/2:Math.max(r,i/2);xD(n.bounds,t.transformAsPoint([-u,-u,-u])),xD(n.bounds,t.transformAsPoint([u,u,u]))}function ZE(e,t,n){let r=gD(Z(e,`positions`)),i=hD(Z(e,`protoIndices`)),a=pD(Z(e,`prototypes`));for(let o=0;o<r.length;o++){let s=a[i[o]||0]?.split(`/`).pop(),c=e.children.find(e=>e.name===s);c&&JE(c,new P(t).translate(r[o]),n)}}function QE(e,t,n){let r=_D(Z(e,`inputs:color`))||[1,1,1],i=vD(Z(e,`inputs:intensity`),1),a=bD(e.name,`light`,n),o;if(e.type===`DistantLight`){let e=t.transformAsVector([0,0,-1]);o={"@@id":a,"@@type":`directional`,direction:[e[0],e[1],e[2]],color:r,irradiance:Math.min(4,Math.max(.6,i*.003))}}else o={"@@id":a,"@@type":`point`,position:[t[12],t[13],t[14]],color:r,intensity:Math.min(70,Math.max(8,i*.02))};n.scene.lights=[...n.scene.lights||[],o]}function $E(e){if(!Number.isFinite(e.bounds.minimum[0]))throw Error(`The imported OpenUSD stage contains no supported renderable geometry.`);eD(e);let t=e.bounds.minimum,n=e.bounds.maximum,r=[(t[0]+n[0])/2,t[1]+(n[1]-t[1])*.41,(t[2]+n[2])/2],i=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.5);e.scene.camera.target=r,e.scene.camera.position=[r[0]+i*.76,r[1]+i*.43,r[2]+i*.96],e.scene.camera.near=Math.max(.01,i*.001),e.scene.camera.far=Math.max(200,i*18),e.scene.renderer||={"@@type":`default`},e.scene.renderer.fogDensity=.003/i;let a=bD(`gallery`,`floor`,e);e.scene.geometries[a]={"@@type":`quad`,width:i*8,height:i*8},e.scene.materials[a]={"@@type":`physicallyBased`,baseColor:[.033,.046,.084],metallic:.48,roughness:.23,clearcoat:.78},e.scene.surfaces[a]={geometry:a,material:a},e.scene.instances=[...e.scene.instances||[],{"@@id":`${a}-placement`,surface:a,position:[r[0],t[1]-i*.035,r[2]]}];let o=tD(e,{identifier:`cyan`,color:[.12,.65,1],center:[r[0],r[1]+i*.28,r[2]],radius:i*.76,height:i*.14,phase:.2,speed:.36,size:i*.015}),s=tD(e,{identifier:`amber`,color:[1,.43,.14],center:[r[0],r[1]+i*.43,r[2]],radius:i*.68,height:i*.1,phase:Math.PI*.75,speed:-.28,size:i*.013}),c=(e.scene.lights||[]).some(e=>e[`@@type`]===`directional`);e.scene.lights=[...e.scene.lights||[],{"@@id":`gallery-key-light`,"@@type":`directional`,direction:[-.36,-1,-.42],color:[1,.91,.8],irradiance:c?1.45:2.35},{"@@id":`gallery-fill-light`,"@@type":`point`,position:[r[0]+i*.76,r[1]+i*.28,r[2]],color:[.12,.62,1],intensity:46,animation:{"@@type":`follow`,target:o}},{"@@id":`gallery-rim-light`,"@@type":`point`,position:[r[0]-i*.58,r[1]+i*.43,r[2]],color:[1,.41,.14],intensity:39,animation:{"@@type":`follow`,target:s}}];let l=Object.keys(e.scene.geometries).length-1;e.scene.description+=` · ${l} ${l===1?`mesh`:`meshes`}`}function eD(e){let t=e.bounds.minimum,n=e.bounds.maximum,r=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.001),i=[(t[0]+n[0])/2,t[1],(t[2]+n[2])/2],a=new P().scale(11.5/r).translate([-i[0],-i[1],-i[2]]);e.scene.instances=(e.scene.instances||[]).map(e=>({...e,matrix:e.matrix?Array.from(new P(a).multiplyRight(e.matrix)):Array.from(a)})),e.scene.lights=(e.scene.lights||[]).map(e=>{if(!e.position)return e;let t=a.transformAsPoint(e.position);return{...e,position:[t[0],t[1],t[2]]}});let o=a.transformAsPoint(t),s=a.transformAsPoint(n);e.bounds={minimum:[o[0],o[1],o[2]],maximum:[s[0],s[1],s[2]]}}function tD(e,t){let n=`studio-${t.identifier}-emitter`;e.scene.geometries[n]={"@@type":`sphere`,radius:t.size,segments:18},e.scene.materials[n]={"@@type":`physicallyBased`,baseColor:t.color,emissive:t.color,emissiveStrength:11,roughness:.09,clearcoat:.82},e.scene.surfaces[n]={geometry:n,material:n};let r=`${n}-placement`;return e.scene.instances=[...e.scene.instances||[],{"@@id":r,surface:n,position:[t.center[0]+Math.cos(t.phase)*t.radius,t.center[1],t.center[2]+Math.sin(t.phase)*t.radius],animation:{"@@type":`orbit`,center:t.center,radius:t.radius,height:t.height,phase:t.phase,speed:t.speed}}],r}function nD(e,t,n,r){let i=e||t,a=n.materialIdentifiers.get(i);if(a)return a;a=bD(i.split(`/`).pop()||t,`material`,n);let o=e?aD(e,n):void 0,s=o?oD(o):void 0,c=o&&s?rD(o,s,`inputs:diffuseColor`,`srgb`,n):void 0,l=gD(r?Z(r,`primvars:displayColor`):void 0),u=l[0]?[l[0][0],l[0][1],l[0][2]]:void 0,d=_D(s?Z(s,`inputs:diffuseColor`):void 0)||_D(s?Z(s,`inputs:base_color`):void 0)||u||(c?[1,1,1]:yD(i)),f=i.toLowerCase(),p=f.includes(`window`)||f.includes(`glass`),m=f.includes(`frontlight`)||f.includes(`backlight`)||f.includes(`headlight`)||f.includes(`taillight`)||f.includes(`emissive`),h=_D(s?Z(s,`inputs:emissiveColor`):void 0)||(m?d:void 0),g={"@@type":`physicallyBased`,baseColor:d,metallic:vD(s?Z(s,`inputs:metallic`):void 0,p?.22:f.includes(`grey`)?.82:.48),roughness:vD(s?Z(s,`inputs:roughness`):void 0,p?.07:f.includes(`grey`)?.16:.13),clearcoat:p?.96:.89,iridescence:p?.25:.045};if(c&&(g.baseColorTexture=c),o&&s){let e=rD(o,s,`inputs:normal`,`linear`,n);e&&(g.normalTexture=e)}return p&&(g.opacity=vD(s?Z(s,`inputs:opacity`):void 0,.52)),h&&(g.emissive=h,g.emissiveStrength=m?3.6:1.2,c&&m&&(g.emissiveTexture=c)),n.scene.materials[a]=g,n.materialIdentifiers.set(i,a),a}function rD(e,t,n,r,i){let a=Z(t,`${n}.connect`)||Z(t,n);if(!fD(a))return;let o=a.path.split(`.outputs:`)[0],s=iD(e,o);if(!s||Z(s,`info:id`)!==`UsdUVTexture`)return;let c=Z(s,`inputs:file`);if(!c||typeof c!=`object`||Array.isArray(c)||!(`assetPath`in c))return;let l=s.sourceUrl||e.sourceUrl;if(!l)return;let u=new URL(String(c.assetPath),l).href,d=`${u}:${r}`,f=i.textureIdentifiers.get(d);return f||(f=bD(s.name,`texture`,i),i.scene.textures||={},i.scene.textures[f]={source:u,colorSpace:r},i.textureIdentifiers.set(d,f)),f}function iD(e,t){if(e.path===t||t.endsWith(`/${e.name}`))return e;for(let n of e.children){let e=iD(n,t);if(e)return e}}function aD(e,t){let n=t.materials.get(e);if(n)return n;let r=e.split(`/`).pop();if(r)return Array.from(t.materials.values()).find(e=>e.name===r)}function oD(e){for(let t of e.children){let e=Z(t,`info:id`);if(t.type===`Shader`&&(e===`UsdPreviewSurface`||e===`ND_standard_surface_surfaceshader`||e===`ND_UsdPreviewSurface_surfaceshader`))return t;let n=oD(t);if(n)return n}}function sD(e,t){e.type===`Material`&&t.set(e.path,e);for(let n of e.children)sD(n,t)}function cD(e){let t=new P,n=mD(Z(e,`xformOpOrder`)),r=n.length?n:Object.keys(e.attributes).filter(e=>e.startsWith(`xformOp:`));for(let n of r){let r=Z(e,n);if(n.startsWith(`xformOp:translate`)){let e=_D(r);e&&t.translate(e)}else if(n.startsWith(`xformOp:scale`)){let e=_D(r);e&&t.scale(e)}else if(n.startsWith(`xformOp:transform`)){let e=gD(r);e.length===4&&e.every(e=>e.length===4)&&t.multiplyRight(new P(e.flat()))}else if(n.startsWith(`xformOp:rotate`)){let e=n.slice(14).split(`:`)[0],i=Array.isArray(r)?r:[r];for(let n=0;n<e.length;n++){let r=vD(i[n],0)*(Math.PI/180);e[n]===`X`?t.rotateX(r):e[n]===`Y`?t.rotateY(r):e[n]===`Z`&&t.rotateZ(r)}}else if(n.startsWith(`xformOp:orient`)&&Array.isArray(r)){let e=r.map(e=>vD(e,0));e.length===4&&t.multiplyRight(new P().fromQuaternion([e[1],e[2],e[3],e[0]]))}}return t}function lD(e,t,n,r){let i={"@@id":bD(r,`instance`,e),surface:t,matrix:Array.from(n)};e.scene.instances=[...e.scene.instances||[],i]}function uD(e){let t=e.metadata.defaultPrim;return typeof t==`string`?t.replace(/([a-z])([A-Z])/g,`$1 $2`).toUpperCase():`IMPORTED OPENUSD STAGE`}function Z(e,t){return e.attributes[t]?.value}function dD(e){let t=Z(e,`material:binding`);return fD(t)?t.path:void 0}function fD(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`path`in e)}function pD(e){return fD(e)?[e.path]:Array.isArray(e)?e.filter(fD).map(e=>e.path):[]}function mD(e){return Array.isArray(e)?e.filter(e=>typeof e==`string`):[]}function hD(e){return Array.isArray(e)?e.filter(e=>typeof e==`number`):[]}function gD(e){return Array.isArray(e)?e.filter(e=>Array.isArray(e)).map(e=>e.filter(e=>typeof e==`number`)):[]}function _D(e){if(!(!Array.isArray(e)||e.length<3)&&!(typeof e[0]!=`number`||typeof e[1]!=`number`||typeof e[2]!=`number`))return[e[0],e[1],e[2]]}function vD(e,t){return typeof e==`number`&&Number.isFinite(e)?e:t}function yD(e){let t=e.toLowerCase();return t.includes(`frontlight`)?[1,.87,.58]:t.includes(`backlight`)?[1,.12,.055]:t.includes(`red`)?[.92,.065,.085]:t.includes(`blue`)?[.075,.36,.96]:t.includes(`green`)?[.09,.66,.31]:t.includes(`gold`)?[1,.69,.2]:t.includes(`window`)||t.includes(`glass`)?[.31,.67,.96]:t.includes(`lightgrey`)||t.includes(`greylight`)?[.78,.84,.93]:t.includes(`mediumgrey`)||t.includes(`greymedium`)?[.22,.27,.35]:[.52,.65,.83]}function bD(e,t,n){return`${e.replace(/[^a-zA-Z0-9]+/g,`-`).replace(/^-|-$/g,``).toLowerCase()||`usd`}-${t}-${++n.nextIdentifier}`}function xD(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function SD(e){let t=e/2,n=[[-t,-t,-t],[t,-t,-t],[t,t,-t],[-t,t,-t],[-t,-t,t],[t,-t,t],[t,t,t],[-t,t,t]];return[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,2,3,7,2,7,6,1,2,6,1,6,5,3,0,4,3,4,7].flatMap(e=>n[e])}async function CD(e,t){let n={version:1,name:t,description:`Imported glTF · full PBR textures, mapped emission, and retained meshes`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.16,exposure:1.62,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={gltf:e,scene:n,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},imageSources:new Map,textureIdentifiers:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,nodeIdentifiers:{},nextIdentifier:0},i=e.scene?.nodes||e.scenes[0]?.nodes||e.nodes;for(let e of i)ED(e,new P,r);r.scene.lights=wD(e,r);let a=(e.materials||[]).map(e=>r.materialIdentifiers.get(e)),o={};for(let[e,t]of a.entries()){if(!t)continue;let r=n.materials[t];for(let{slot:t}of dg()){let n=r[`${t}Texture`];n&&(o[`${e}:${t}`]=n)}}let s=Uw(Ug(e),{nodeIdentifiers:r.nodeIdentifiers,materialIdentifiers:a,materialAlphaModes:(e.materials||[]).map(e=>e.alphaMode===`BLEND`?`BLEND`:e.alphaMode===`MASK`?`MASK`:`OPAQUE`),samplerIdentifiers:o});s.length>0&&(n.clips=s,n.playback={clip:s[0].name,playing:!0,loop:`repeat`},n.description=`Imported glTF · ${s.length} animation clip${s.length===1?``:`s`} · retained PBR scene`);let c=TD(r.bounds);if(qE(n,r.bounds),n.nodes&&Object.keys(n.nodes).length>0){let e=`anari-presentation-root`;for(;e in n.nodes;)e+=`-root`;for(let t of Object.values(n.nodes))t.parent||=e;n.nodes[e]={matrix:Array.from(c)}}return n}function wD(e,t){return kg(e,{nodeIdentifiers:new Set(Object.keys(t.nodeIdentifiers)),useByteColors:!1}).flatMap(e=>{if(e.type===`ambient`)return[];let n={"@@id":LD(`source-${e.type}`,`light`,t),"@@type":e.type,color:FD(e.color,[1,1,1]),intensity:e.intensity??1};return`position`in e&&(n.position=FD(e.position,[0,0,0])),`direction`in e&&(n.direction=FD(e.direction,[0,0,-1])),e.type===`spot`&&(n.openingAngle=e.outerConeAngle??Math.PI/4,n.falloffAngle=e.innerConeAngle??0),[n]})}function TD(e){let t=Math.max(e.maximum[0]-e.minimum[0],e.maximum[1]-e.minimum[1],e.maximum[2]-e.minimum[2],.001);return new P().scale(11.5/t).translate([-(e.minimum[0]+e.maximum[0])/2,-e.minimum[1],-(e.minimum[2]+e.maximum[2])/2])}function ED(e,t,n,r){let i=e.id,a=e.mesh?.primitives.find(e=>e.targets?.length)?.targets?.length||0,o=e.weights||e.mesh?.weights||(a?Array(a).fill(0):void 0);n.nodeIdentifiers[e.id]=i,n.scene.nodes||={};let s={...r?{parent:r}:{},...e.translation?{translation:[e.translation[0],e.translation[1],e.translation[2]]}:{},...e.rotation?{rotation:[e.rotation[0],e.rotation[1],e.rotation[2],e.rotation[3]]}:{},...e.scale?{scale:[e.scale[0],e.scale[1],e.scale[2]]}:{},...e.matrix?{matrix:Array.from(e.matrix)}:{},...o?{weights:[...o]}:{}};n.scene.nodes[i]=s;let c=new P(t);if(e.matrix?c.multiplyRight(e.matrix):(e.translation&&c.translate(e.translation),e.rotation&&c.multiplyRight(new P().fromQuaternion(e.rotation)),e.scale&&c.scale(e.scale)),e.mesh)for(let[t,r]of e.mesh.primitives.entries()){if(r.mode!==void 0&&r.mode!==4)continue;let i=DD(e.mesh.id,t,r,n,e);if(!i)continue;let a=r.attributes.POSITION;for(let e=0;e<a.value.length;e+=3){let t=c.transformAsPoint([a.value[e],a.value[e+1],a.value[e+2]]);ID(n.bounds,t)}let o=LD(e.name||e.id,`instance`,n);n.scene.instances=[...n.scene.instances||[],{"@@id":o,surface:i,matrix:Array.from(c)}],s.instances=[...s.instances||[],o],r.targets?.length&&(s.geometries=[...s.geometries||[],i])}for(let t of e.children||[])ED(t,c,n,i)}function DD(e,t,n,r,i){let a=n.attributes.POSITION;if(!a)return;let o=`${e}:${t}${n.targets?.length||i.skin!==void 0?`:${i.id}`:``}`,s=r.surfaceIdentifiers.get(o);if(s)return s;s=LD(e,`primitive-${t}`,r);let c={"@@type":`triangle`,"vertex.position":Array.from(a.value)},l=n.attributes.NORMAL;l&&(c[`vertex.normal`]=Array.from(l.value));let u=n.attributes.TANGENT;u&&(c[`vertex.tangent`]=Array.from(u.value));let d=n.attributes.JOINTS_0;d&&(c[`vertex.joint`]=Array.from(d.value));let f=n.attributes.WEIGHTS_0;if(f){let e=f.normalized?f.value instanceof Uint8Array?255:f.value instanceof Uint16Array?65535:1:1;c[`vertex.weight`]=Array.from(f.value,t=>t/e)}n.indices&&(c[`primitive.index`]=Array.from(n.indices.value));let p=kD(n,a.count);p&&(c[`vertex.attribute0`]=p);let m=n.attributes.TEXCOORD_0;m&&(c[`vertex.attribute1`]=Array.from(m.value));let h=n.attributes.TEXCOORD_1;h&&(c[`vertex.attribute2`]=Array.from(h.value)),n.targets?.length&&(c.morphTargets=n.targets.map(e=>{let t={};for(let n of[`POSITION`,`NORMAL`,`TANGENT`]){let i=e[n],a=typeof i==`number`?r.gltf.accessors[i]:i;a&&(t[n]=Array.from(a.value))}return t}),c.morphWeights=[...i.weights||i.mesh?.weights||Array(n.targets.length).fill(0)]);let g=OD(n.material,r),_=i.skin===void 0?void 0:r.gltf.skins?.[Bg(r.gltf,i.skin)],v=_?{node:i.id,joints:_.joints.map(e=>r.gltf.nodes[e].id),..._.inverseBindMatrices?.value?{inverseBindMatrices:Array.from(_.inverseBindMatrices.value)}:{}}:void 0;return r.scene.geometries[s]=c,r.scene.surfaces[s]={geometry:s,material:g,...v?{skin:v}:{}},r.surfaceIdentifiers.set(o,s),s}function OD(e,t){if(!e){let e=`default-material`;return t.scene.materials[e]||={"@@type":`physicallyBased`,baseColor:[1,1,1],metallic:1,roughness:1,clearcoat:0},e}let n=t.materialIdentifiers.get(e);if(n)return n;let r=LD(e.name||e.id,`material`,t),i=e.pbrMetallicRoughness,a=i?.baseColorFactor||[1,1,1,1],o=e.alphaMode===`BLEND`?`blend`:e.alphaMode===`MASK`?`mask`:`opaque`,s=e.extensions?.KHR_materials_clearcoat,c=e.extensions?.EXT_materials_bump,l=e.extensions?.KHR_materials_diffuse_transmission,u=e.extensions?.KHR_materials_dispersion,d=e.extensions?.KHR_materials_iridescence,f=e.extensions?.KHR_materials_transmission,p=e.extensions?.KHR_materials_sheen,m=e.extensions?.KHR_materials_specular,h=e.extensions?.KHR_materials_volume,g=e.extensions?.KHR_materials_volume_scatter,_=e.extensions?.KHR_materials_anisotropy,v=e.extensions?.KHR_materials_ior,y={"@@type":`physicallyBased`,baseColor:[a[0],a[1],a[2]],alphaMode:o,doubleSided:e.doubleSided??!1,metallic:Q(i?.metallicFactor??1,0,1),roughness:Q(i?.roughnessFactor??1,0,1),unlit:!!(`unlit`in e&&e.unlit||e.extensions?.KHR_materials_unlit),specularColor:FD(m?.specularColorFactor,[1,1,1]),specularIntensity:Q(m?.specularFactor??1,0,1),clearcoat:Q(s?.clearcoatFactor??0,0,1),clearcoatRoughness:Q(s?.clearcoatRoughnessFactor??0,0,1),iridescence:Q(d?.iridescenceFactor??0,0,1),transmission:Q(f?.transmissionFactor??0,0,1),diffuseTransmission:Q(l?.diffuseTransmissionFactor??0,0,1),diffuseTransmissionColor:FD(l?.diffuseTransmissionColorFactor,[1,1,1]),dispersion:Math.max(u?.dispersion??0,0),thickness:Math.max(h?.thicknessFactor??0,0),attenuationColor:FD(h?.attenuationColor,[1,1,1]),multiscatterColor:h?FD(g?.multiscatterColorFactor||g?.multiscatterColor,[0,0,0]):[0,0,0],scatterAnisotropy:h?Q(g?.scatterAnisotropy??0,-.999,.999):0,indexOfRefraction:Q(v?.ior??1.5,1,2.5),sheenColor:FD(p?.sheenColorFactor,[0,0,0]),sheenRoughness:Q(p?.sheenRoughnessFactor??0,0,1),iridescenceIndexOfRefraction:Math.max(d?.iridescenceIor??1.3,1),iridescenceThicknessMinimum:Math.max(d?.iridescenceThicknessMinimum??100,0),iridescenceThicknessMaximum:Math.max(d?.iridescenceThicknessMaximum??400,0),anisotropyStrength:Q(_?.anisotropyStrength??0,0,1),anisotropyRotation:_?.anisotropyRotation??0,bumpFactor:Math.max(c?.bumpFactor??1,0),normalScale:Q(e.normalTexture?.scale??1,0,4),occlusionStrength:Q(e.occlusionTexture?.strength??1,0,1)};h?.attenuationDistance!==void 0&&h.attenuationDistance>0&&(y.attenuationDistance=h.attenuationDistance);for(let{slot:n,pathSegments:r,colorSpace:i}of dg())jD(y,`${n}Texture`,MD(e,r),i,t);let b=e.emissiveFactor||[0,0,0];return(e.emissiveTexture||b.some(e=>e>0))&&(y.emissive=FD(b,[1,1,1]),y.emissiveStrength=e.extensions?.KHR_materials_emissive_strength?.emissiveStrength??1),o===`mask`&&(y.alphaCutoff=Q(e.alphaCutoff??.5,0,1)),(o===`blend`||o===`mask`)&&(y.opacity=Q(a[3],0,1)),t.scene.materials[r]=y,t.materialIdentifiers.set(e,r),r}function kD(e,t){let n=e.attributes.COLOR_0;if(!n)return;let r=n.components===4?4:3,i=Array(t*r);for(let e=0;e<t;e++){let t=AD(n,e),a=e*r;if(i[a]=t[0],i[a+1]=t[1],i[a+2]=t[2],r===4){let t=n.value[e*n.components+3],r=n.normalized?n.componentType===5121?255:n.componentType===5123?65535:1:1;i[a+3]=t/r}}return i}function AD(e,t){if(!e)return[1,1,1];let n=t*e.components,r=e.normalized?e.componentType===5121?255:e.componentType===5123?65535:1:1;return[e.value[n]/r,e.value[n+1]/r,e.value[n+2]/r]}function jD(e,t,n,r,i){if(!n)return;let a=n.texture||(typeof n.index==`number`?i.gltf.textures[n.index]:void 0),o=a?.source;if(!o)return;let s=PD(n),c=pg(n)===1?1:0,l=gg(a.sampler),u=Object.entries(l).map(([e,t])=>`${e}:${t}`).join(`,`),d=`${o.id}:${r}:${c}:${s?.join(`,`)||`identity`}:${u}`,f=i.textureIdentifiers.get(d);if(!f){let e=ND(o,i);if(!e)return;f=LD(o.name||o.id,`texture`,i);let t={source:e,colorSpace:r};c===1&&(t.textureCoordinateSet=c),s&&(t.transform=s),Object.keys(l).length>0&&(t.sampler=l),i.scene.textures||={},i.scene.textures[f]=t,i.textureIdentifiers.set(d,f)}e[t]=f}function MD(e,t){let n=e;for(let e of t){if(!n||typeof n!=`object`)return;n=Reflect.get(n,e)}return n&&typeof n==`object`?n:void 0}function ND(e,t){let n=t.imageSources.get(e);if(n)return n;let r=e.bufferView?.data||e.image?.data,i=r?URL.createObjectURL(new Blob([new Uint8Array(r)],{type:e.mimeType||`image/png`})):e.uri;return i&&t.imageSources.set(e,i),i}function PD(e){if(!e.extensions?.KHR_texture_transform)return;let t=hg(fg(e));return[t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8]]}function FD(e,t){return e&&e.length>=3?[e[0],e[1],e[2]]:t}function ID(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function LD(e,t,n){return`${e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`gltf`}-${t}-${n.nextIdentifier++}`}function Q(e,t,n){return Math.max(t,Math.min(n,e))}var RD=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/,zD=new Set([`uniform`,`varying`,`custom`,`prepend`,`append`,`add`,`delete`,`reorder`]);function BD(e,t){if(!e.trimStart().startsWith(`#usda`))throw Error(`OpenUSD ASCII layers must begin with the #usda header.`);return new VD(e,t).parse()}var VD=class{tokenizer;url;constructor(e,t){this.tokenizer=new HD(e),this.url=t}parse(){let e=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{},t=[];for(;!this.tokenizer.isAtEnd();)this.isPrimDeclaration()?t.push(this.parsePrim(``)):this.tokenizer.read();return{format:`usda`,url:this.url,metadata:e,rootPrims:t,layers:this.url?[this.url]:[]}}parsePrim(e){let t=this.tokenizer.read().value,n=this.tokenizer.read(),r=this.tokenizer.peek().kind===`string`,i=r?n.value:``,a=r?this.tokenizer.read().value:n.value,o=`${e}/${a}`,s=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{};this.tokenizer.expect(`{`);let c=this.parsePrimContents(o);return{name:a,path:o,sourceUrl:this.url,type:i,specifier:t,attributes:c.attributes,metadata:{...s,...c.metadata},variants:c.variants,children:c.children}}parsePrimContents(e){let t={},n={},r=[],i={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);)if(this.isPrimDeclaration())r.push(this.parsePrim(e));else if(this.tokenizer.peek().value===`variantSet`)this.parseVariantSet(e,i);else{let e=this.parseAttribute();e&&(t[e.name]=e)}return{attributes:t,metadata:n,children:r,variants:i}}parseVariantSet(e,t){this.tokenizer.expect(`variantSet`);let n=this.tokenizer.read().value;this.tokenizer.expect(`=`),this.tokenizer.expect(`{`);let r={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);){let t=this.tokenizer.read().value;this.tokenizer.expect(`{`);let n=this.parsePrimContents(e);r[t]={attributes:n.attributes,metadata:n.metadata,children:n.children}}t[n]=r}parseAttribute(){let e=this.tokenizer.read();if(e.kind===`end`)return null;let t=[e];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===e.line;){let e=this.tokenizer.peek();if(e.value===`=`){this.tokenizer.read();break}if(e.value===`{`||e.value===`}`)return null;t.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`)return null;let n=t.filter(e=>!zD.has(e.value));return n.length===0?null:{name:n[n.length-1].value,type:n.slice(0,-1).map(e=>e.value).join(``),value:this.parseValue(),metadata:this.tokenizer.match(`(`)?this.parseMetadata(`)`):{}}}parseMetadata(e){let t={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);){if(this.tokenizer.match(`,`),this.tokenizer.peek().value===e){this.tokenizer.read();break}let n=this.tokenizer.read(),r=[n];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===n.line;){if(this.tokenizer.peek().value===`=`||this.tokenizer.peek().value===`:`){this.tokenizer.read();break}if(this.tokenizer.peek().value===e)break;r.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`&&this.tokenizer.previousValue!==`:`)continue;let i=r[r.length-1].value;t[i]=this.parseValue(),this.tokenizer.match(`,`)}return t}parseValue(){let e=this.tokenizer.read();if(e.value===`[`)return this.parseList(`]`);if(e.value===`(`)return this.parseList(`)`);if(e.value===`{`)return this.parseMetadata(`}`);if(e.kind===`asset`){let t={assetPath:e.value};return this.tokenizer.peek().kind===`path`&&this.tokenizer.peek().line===e.line&&(t.primPath=this.tokenizer.read().value),t}return e.kind===`path`?{path:e.value}:e.kind===`number`?Number(e.value):e.value===`true`?!0:e.value===`false`?!1:e.value===`None`||e.value===`null`?null:e.value}parseList(e){let t=[];for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);)this.tokenizer.match(`,`)||(t.push(this.parseValue()),this.tokenizer.match(`,`));return t}isPrimDeclaration(){let e=this.tokenizer.peek().value;return e===`def`||e===`over`||e===`class`}},HD=class{source;offset=0;line=1;bufferedToken=null;previousValue=``;constructor(e){this.source=e}peek(){return this.bufferedToken||=this.readToken(),this.bufferedToken}read(){let e=this.peek();return this.bufferedToken=null,this.previousValue=e.value,e}match(e){return this.peek().value===e?(this.read(),!0):!1}expect(e){let t=this.read();if(t.value!==e)throw Error(`Expected "${e}" at USDA line ${t.line}, received "${t.value}".`)}isAtEnd(){return this.peek().kind===`end`}readToken(){this.skipIgnoredText();let e=this.line,t=this.source[this.offset];if(t===void 0)return{value:``,line:e,kind:`end`};if(`{}[](),=`.includes(t))return this.offset++,{value:t,line:e,kind:`punctuation`};if(t===`"`||t===`'`)return{value:this.readQuotedString(t),line:e,kind:`string`};if(t===`@`)return{value:this.readDelimitedValue(`@`),line:e,kind:`asset`};if(t===`<`)return{value:this.readDelimitedValue(`>`),line:e,kind:`path`};let n=this.source.slice(this.offset).match(RD);if(n)return this.offset+=n[0].length,{value:n[0],line:e,kind:`number`};let r=this.offset;for(;this.offset<this.source.length;){let e=this.source[this.offset];if(/\s/.test(e)||`{}[](),=@<>`.includes(e))break;this.offset++}return this.offset===r&&this.offset++,{value:this.source.slice(r,this.offset),line:e,kind:`word`}}skipIgnoredText(){for(;this.offset<this.source.length;){let e=this.source[this.offset];if(e===`
`)this.line++,this.offset++;else if(/\s/.test(e))this.offset++;else if(e===`#`)for(;this.offset<this.source.length&&this.source[this.offset]!==`
`;)this.offset++;else if(e===`/`&&this.source[this.offset+1]===`*`){for(this.offset+=2;this.offset<this.source.length&&!this.source.startsWith(`*/`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=2}else if(this.source.startsWith(`"""`,this.offset)){for(this.offset+=3;this.offset<this.source.length&&!this.source.startsWith(`"""`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=3}else break}}readQuotedString(e){this.offset++;let t=``;for(;this.offset<this.source.length;){let n=this.source[this.offset++];if(n===e)break;if(n===`\\`&&this.offset<this.source.length){let e=this.source[this.offset++];t+=e===`n`?`
`:e}else t+=n}return t}readDelimitedValue(e){this.offset++;let t=this.offset;for(;this.offset<this.source.length&&this.source[this.offset]!==e;)this.offset++;let n=this.source.slice(t,this.offset);return this.offset++,n}},UD=101010256,WD=33639248,GD=67324752;function KD(e){let t=new DataView(e),n=qD(t),r=t.getUint16(n+10,!0),i=t.getUint32(n+16,!0),a=new Map,o=new TextDecoder;for(let n=0;n<r;n++){if(t.getUint32(i,!0)!==WD)throw Error(`USDZ archive contains an invalid ZIP central-directory entry.`);let n=t.getUint16(i+10,!0),r=t.getUint32(i+20,!0),s=t.getUint16(i+28,!0),c=t.getUint16(i+30,!0),l=t.getUint16(i+32,!0),u=t.getUint32(i+42,!0),d=o.decode(new Uint8Array(e,i+46,s));if(n!==0)throw Error(`USDZ entry "${d}" is compressed; USDZ requires stored ZIP entries.`);if(t.getUint32(u,!0)!==GD)throw Error(`USDZ entry "${d}" has an invalid local ZIP header.`);let f=t.getUint16(u+26,!0),p=t.getUint16(u+28,!0),m=u+30+f+p;a.set(d,e.slice(m,m+r)),i+=46+s+c+l}return a}function qD(e){let t=Math.max(0,e.byteLength-65557);for(let n=e.byteLength-22;n>=t;n--)if(e.getUint32(n,!0)===UD)return n;throw Error(`USDZ archive does not contain a ZIP end-of-central-directory record.`)}var JD=new TextDecoder,YD=`PXR-USDC`,XD=67324752,ZD={dataType:null,batchType:null,name:`Universal Scene Description`,id:`usd`,module:`usd`,version:`0.0.0-experimental`,extensions:[`usd`,`usda`,`usdz`],mimeTypes:[`model/vnd.usd`,`model/vnd.usda`,`model/vnd.usdz+zip`],text:!0,binary:!0,tests:[`#usda`,`PK`],parse:QD,options:{usd:{compose:!0,loadReferences:!0,maxReferenceDepth:12,variantSelections:{}}}};async function QD(e,t={},n){let r=n?.url||t.core?.baseUrl,i={fetch:async e=>{let t=await(n?.fetch||fetch)(e);if(!(t instanceof Response))throw Error(`OpenUSD reference "${e}" did not return an HTTP response.`);if(!t.ok)throw Error(`Unable to load OpenUSD reference "${e}": ${t.status}.`);return t},cache:new Map,archiveFiles:new Map,layers:new Set,options:{...t,usd:{...ZD.options.usd,...t.usd}}},a;if(uO(e)){let t=KD(e),n=Array.from(t.keys()).find(e=>/\.usda?$/i.test(e));if(!n)throw Error(`USDZ archives with binary USDC root layers are not implemented yet.`);let r=`https://usd.archive/`;for(let[e,n]of t)i.archiveFiles.set(new URL(e,r).href,n);let o=new URL(n,r).href;a=$D(t.get(n),o),a.format=`usdz`}else a=$D(e,r);return a.url&&i.layers.add(a.url),i.options.usd?.compose!==!1&&(a.rootPrims=await eO(a.rootPrims,a.url,{},i,0)),a.layers=Array.from(i.layers),r&&(a.url=r),a}function $D(e,t){if(JD.decode(e.slice(0,8))===YD)throw Error(`Binary USDC crate layers are not implemented yet; use ASCII USDA layers.`);return BD(JD.decode(e),t)}async function eO(e,t,n,r,i){if(i>(r.options.usd?.maxReferenceDepth??12))throw Error(`OpenUSD reference composition exceeded the configured depth limit.`);let a=[];for(let o of e){if(o.specifier===`class`)continue;let e={...aO(o.metadata.variants),...n,...r.options.usd?.variantSelections},s=o.sourceUrl||t,c=sO(o);for(let[t,n]of Object.entries(c.variants)){let r=n[e[t]||Object.keys(n)[0]];r&&(c=lO(c,{...c,attributes:r.attributes,metadata:r.metadata,children:r.children,variants:{}}))}let l=iO(c);if(r.options.usd?.loadReferences!==!1&&l.length>0)for(let t of l){if(!s)throw Error(`OpenUSD references require a source URL or options.core.baseUrl.`);let n=new URL(t.assetPath,s).href,a=await eO(nO(await tO(n,r),t.primPath),n,e,r,i+1);for(let e of a)c=lO(cO(e,c.path),c)}c.children=await eO(c.children,s,e,r,i+1),a.push(c)}return a}async function tO(e,t){let n=t.cache.get(e);return n||(n=(async()=>{let n=t.archiveFiles.get(e);if(!n){let r;try{r=await t.fetch(e)}catch(t){throw Error(`Unable to fetch USD layer "${e}": ${String(t)}`)}if(!r.ok)throw Error(`Unable to fetch USD layer "${e}": ${r.status}.`);n=r.arrayBuffer()}let r=$D(await n,e);return t.layers.add(e),r})(),t.cache.set(e,n)),n}function nO(e,t){let n=t||e.metadata.defaultPrim;if(typeof n!=`string`)return e.rootPrims;let r=n.startsWith(`/`)?n:`/${n}`,i=rO(e.rootPrims,r);return i?[i]:[]}function rO(e,t){for(let n of e){if(n.path===t)return n;let e=rO(n.children,t);if(e)return e}}function iO(e){let t=[];for(let n of[e.metadata.references,e.metadata.payload,e.metadata.payloads])Array.isArray(n)?t.push(...n.filter(oO)):oO(n)&&t.push(n);return t}function aO(e){return!e||typeof e!=`object`||Array.isArray(e)||oO(e)?{}:Object.fromEntries(Object.entries(e).filter(e=>typeof e[1]==`string`))}function oO(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`assetPath`in e)}function sO(e){return{...e,attributes:{...e.attributes},metadata:{...e.metadata},variants:{...e.variants},children:e.children.map(sO)}}function cO(e,t){let n=sO(e);return n.path=t,n.children=n.children.map(e=>cO(e,`${t}/${e.name}`)),n}function lO(e,t){let n=e.children.map(sO);for(let e of t.children){let t=n.findIndex(t=>t.name===e.name);t>=0?n[t]=lO(n[t],e):n.push(sO(e))}return{...e,...t,sourceUrl:iO(t).length>0?t.sourceUrl:e.sourceUrl||t.sourceUrl,type:t.type||e.type,attributes:{...e.attributes,...t.attributes},metadata:{...e.metadata,...t.metadata},variants:{...e.variants,...t.variants},children:n}}function uO(e){return e.byteLength>=4&&new DataView(e).getUint32(0,!0)===XD}var dO={usd:{variantSelections:{wheels:`wheelNormal`}}};function $(e){return new URL(e,document.baseURI).href}var fO=[{identifier:`gltf-expressive-robot`,label:`glTF · Expressive Robot · 14 Animated Clips`,url:$(`./gltf/RobotExpressive.glb`),format:`gltf`},{identifier:`gltf-animated-morphs`,label:`glTF · Animated Morph Targets`,url:$(`./gltf/AnimatedMorphCube.glb`),format:`gltf`},{identifier:`gltf-animated-skin`,label:`glTF · Animated Skeleton`,url:$(`./gltf/SimpleSkin.gltf`),format:`gltf`},{identifier:`gltf-animated-colors`,label:`glTF · Animated Colors`,url:$(`./gltf/AnimatedColorsCube.glb`),format:`gltf`},{identifier:`gltf-antique-camera`,label:`glTF · Antique Camera`,url:$(`./gltf/AntiqueCamera.glb`),format:`gltf`},{identifier:`gltf-lantern`,label:`glTF · Brass Lantern`,url:$(`./gltf/Lantern.glb`),format:`gltf`},{identifier:`gltf-toy-car`,label:`glTF · Vintage Toy Car`,url:$(`./gltf/ToyCar.glb`),format:`gltf`},{identifier:`porcelain-atelier`,label:`OpenUSD · Porcelain Atelier`,url:$(`./usd/porcelain-atelier.usda`),format:`usd`},{identifier:`knights-gambit`,label:`OpenUSD · Knight’s Gambit`,url:$(`./usd/knights-gambit.usda`),format:`usd`},{identifier:`vehicle-gallery`,label:`OpenUSD · Vehicle Gallery`,url:$(`./usd/vehicle-gallery.usda`),format:`usd`,options:dO},{identifier:`material-laboratory`,label:`OpenUSD · Prismatic Materials`,url:$(`./usd/material-laboratory.usda`),format:`usd`},{identifier:`formula-racer`,label:`OpenUSD · Formula Racer`,url:$(`./usd/mini-vehicles/assets/vehicles/formula/asset/formulaFullAsset.usda`),format:`usd`,options:dO},{identifier:`crimson-sedan`,label:`OpenUSD · Crimson Sedan`,url:$(`./usd/mini-vehicles/assets/vehicles/sedan/asset/sedanFullAsset.usda`),format:`usd`,options:dO},{identifier:`precision-wheel`,label:`OpenUSD · Precision Wheel`,url:$(`./usd/mini-vehicles/assets/wheels/wheelNormal/asset/wheelNormalAsset.usda`),format:`usd`}];async function pO(e){let t=fO.find(t=>t.identifier===e);if(!t)throw Error(`Unknown 3D sample "${e}".`);let n=t.label.replace(/^(OpenUSD|glTF) · /,``).toUpperCase();if(t.format===`gltf`){let e=await CD(Vw(await GE(t.url,Sw,{gltf:{loadImages:!1}})),n);return await nT(e),e}let r=KE(await GE(t.url,ZD,t.options),n);return await nT(r),r}async function mO(e){let t=e.name.replace(/\.(usd|usda|usdz|gltf|glb)$/i,``).replace(/[-_]/g,` `).toUpperCase();if(/\.(gltf|glb)$/i.test(e.name)){let n=await CD(Vw(await UE(await e.arrayBuffer(),Sw,{gltf:{loadImages:!1}})),t);return await nT(n),n}let n=KE(await ZD.parse(await e.arrayBuffer()),t);return await nT(n),n}export{nr as _,lT as a,ve as b,dx as c,dg as d,lg as f,or as g,gl as h,rT as i,wv as l,wl as m,mO as n,hT as o,Pl as p,pO as r,cT as s,fO as t,_g as u,Yn as v,P as y};