const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./webgpu-device-DEKFHqMa.js","./wgsl-interface-scan-BeLN4x0P.js"])))=>i.map(i=>d[i]);
import{C as e,D as t,E as n,F as r,G as i,I as a,J as o,K as s,L as c,N as l,O as u,P as d,R as f,T as p,U as m,V as h,W as g,_,a as v,b as y,c as b,d as x,g as S,h as C,i as w,j as T,k as E,l as D,m as O,n as k,o as A,p as ee,r as te,s as ne,t as j,u as re,v as ie,w as M,y as ae,z as N}from"./wgsl-interface-scan-BeLN4x0P.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var oe=`LUMA_WEBGPU_ADAPTER_UNAVAILABLE`,se=class{get pageLoaded(){return de()}},ce=o()&&typeof document<`u`,le=()=>ce&&document.readyState===`complete`,ue=null;function de(){return ue||=le()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),ue}var fe=`set luma.log.level=1 (or higher) to trace rendering`,pe="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",me=class e{static defaultProps={...i,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=g;log=s;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw s.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),s.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);s.error(`This version of luma.gl has already been initialized`)()}s.log(1,`${this.VERSION} - ${fe}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(pe);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n).catch(t=>{if(n.type===`best-available`&&e.type===`webgpu`&&t?.code===`LUMA_WEBGPU_ADAPTER_UNAVAILABLE`){let e=this.selectAdapter(`webgl`,n.adapters);if(e?.isSupported())return e.create(n)}throw t})}catch(e){throw n.debug&&he(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(pe);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||s.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?s.warn(`WebGL1 is not supported`,e)():s.warn(`Unknown handle type`,e)(),null)}};function he(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var ge=new me;function _e(e,t={}){let n={...e},i=t.layout??`std140`,a={},o=0;for(let[e,t]of Object.entries(n))o=P(a,e,t,o,i);return o=r(o,xe(n,i)),{layout:i,byteLength:o*4,uniformTypes:n,fields:a}}function ve(e,t){let n=c(e),r=a(n),i=/^mat(\d)x(\d)<.+>$/.exec(n);if(i){let e=Number(i[1]),a=Number(i[2]),o=Se(a,n,r.type,t),s=Te(o.size,o.alignment,t);return{alignment:o.alignment,size:e*s,components:e*a,columns:e,rows:a,columnStride:s,shaderType:n,type:r.type}}let o=/^vec(\d)<.+>$/.exec(n);return o?Se(Number(o[1]),n,r.type,t):{alignment:1,size:1,components:1,columns:1,rows:1,columnStride:1,shaderType:n,type:r.type}}function ye(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function P(e,t,n,i,a){if(typeof n==`string`){let o=ve(n,a),s=r(i,o.alignment);return e[t]={offset:s,...o},s+o.size}if(Array.isArray(n)){if(Array.isArray(n[0]))throw Error(`Nested arrays are not supported for ${t}`);let o=n[0],s=n[1],c=Ce(o,a),l=r(i,xe(n,a));for(let n=0;n<s;n++)P(e,`${t}[${n}]`,o,l+n*c,a);return l+c*s}if(ye(n)){let o=xe(n,a),s=r(i,o);for(let[r,i]of Object.entries(n))s=P(e,`${t}.${r}`,i,s,a);return r(s,o)}throw Error(`Unsupported CompositeShaderType for ${t}`)}function be(e,t){if(typeof e==`string`)return ve(e,t).size;if(Array.isArray(e)){let n=e[0],r=e[1];if(Array.isArray(n))throw Error(`Nested arrays are not supported`);return Ce(n,t)*r}let n=0;for(let i of Object.values(e)){let e=i;n=r(n,xe(e,t)),n+=be(e,t)}return r(n,xe(e,t))}function xe(e,t){if(typeof e==`string`)return ve(e,t).alignment;if(Array.isArray(e)){let n=e[0],r=xe(n,t);return Ee(t)?Math.max(r,4):r}let n=1;for(let r of Object.values(e)){let e=xe(r,t);n=Math.max(n,e)}return De(t)?Math.max(n,4):n}function Se(e,t,n,r){return{alignment:e===2?2:4,size:e===3?3:e,components:e,columns:1,rows:e,columnStride:e===3?3:e,shaderType:t,type:n}}function Ce(e,t){return we(be(e,t),xe(e,t),t)}function we(e,t,n){return r(e,Ee(n)?4:t)}function Te(e,t,n){return n===`std140`?4:r(e,t)}function Ee(e){return e===`std140`||e===`wgsl-uniform`}function De(e){return e===`std140`||e===`wgsl-uniform`}var Oe=new WeakMap,F=class e{static defaultProps={...ae.defaultProps};static getDefaultPipelineFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new e(t),n.defaultPipelineFactory}static beginAsyncCompilation(e){if(Oe.has(e))throw Error(`An asynchronous pipeline compilation scope is already active`);let t=[];return Oe.set(e,t),t}static getAsyncCompilation(e){return Oe.get(e)}static endAsyncCompilation(e,t){if(Oe.get(e)!==t)throw Error(`The asynchronous pipeline compilation scope is not active`);Oe.delete(e)}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_pendingRenderPipelineCache={};_pendingComputePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...ae.defaultProps,...e},n=this._renderPipelineCache,r=this._hashRenderPipeline(t),i=n[r]?.resource;if(i)n[r].useCount++,this.device.props.debugFactories&&s.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;i=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:m(`unnamed-cached`),_sharedRenderPipeline:e}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&s.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()}return i}async createRenderPipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createRenderPipelineAsync(e);let t={...ae.defaultProps,...e},n=this._hashRenderPipeline(t);return await this._createPipelineAsync(this._renderPipelineCache,this._pendingRenderPipelineCache,n,()=>{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;return this.device.createRenderPipelineAsync({...t,id:t.id?`${t.id}-cached`:m(`unnamed-cached`),_sharedRenderPipeline:e})})}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...ie.defaultProps,...e},n=this._computePipelineCache,r=this._hashComputePipeline(t),i=n[r]?.resource;return i?(n[r].useCount++,this.device.props.debugFactories&&s.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)()):(i=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&s.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()),i}async createComputePipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createComputePipelineAsync(e);let t={...ie.defaultProps,...e},n=this._hashComputePipeline(t);return await this._createPipelineAsync(this._computePipelineCache,this._pendingComputePipelineCache,n,()=>this.device.createComputePipelineAsync({...t,id:t.id?`${t.id}-cached`:void 0}))}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&s.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(s.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&s.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}async _createPipelineAsync(e,t,n,r){let i=e[n];if(i)return i.useCount++,i.resource;let a=t[n];if(a)return a.useCount++,await a.promise;let o={promise:void 0,useCount:1};return o.promise=r().then(r=>{delete t[n];let i=e[n];return i?(i.useCount+=o.useCount,r.destroy(),r instanceof ae&&this.releaseSharedRenderPipeline(r),i.resource):(r.hash=n,e[n]={resource:r,useCount:o.useCount},r)}).catch(e=>{throw delete t[n],e}),t[n]=o,await o.promise}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof ae&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof ie&&(t=this._computePipelineCache),e instanceof ae&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){return`${this._getHash(e.shader.source)}/${this._getHash(JSON.stringify([e.shaderLayout,e.entryPoint??`main`,e.constants]))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e._uniformBlockLayouts)),o=this._getHash(JSON.stringify(e.bufferLayout)),{type:s}=this.device;switch(s){case`webgl`:let c=this._getHash(JSON.stringify(e.parameters));return`${s}/R/${t}/${n}V${r}T${e.topology}P${c}SL${i}UBL${a}BL${o}`;default:let l=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),u=this._getHash(JSON.stringify(e.parameters)),d=this._getWebGPUAttachmentHash(e);return`${s}/R/${t}/${n}V${r}T${e.topology}EP${l}P${u}SL${i}BL${o}A${d}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=y(this.device,e)??null;return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}},ke=class t{static defaultProps={...e.defaultProps};static getDefaultShaderFactory(e){let n=e.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new t(e),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&s.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let r=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:r,useCount:1},this.device.props.debugFactories&&s.log(3,`${this}: Created new shader ${r.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&s.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&s.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}},Ae;function je(e){return(!Ae||Ae.byteLength<e)&&(Ae=new ArrayBuffer(e)),Ae}function Me(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Ne(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:Me(e)}var Pe=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=je(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let i=n[0],a=n[1];if(Array.isArray(i))throw Error(`Nested arrays are not supported for ${t}`);if(typeof i==`string`&&Ne(r)){this._flattenPackedArray(e,t,i,a,r);return}if(!Array.isArray(r)){s.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,a);n++){let a=r[n];a!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,i,a)}return}if(ye(n)&&Fe(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}s.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=ve(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=Ie(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){s.warn(`Uniform ${t} not found in layout`)();return}let{type:i,components:a,columns:o,rows:c,offset:l,columnStride:u}=r,d=e[i];if(a===1){d[l]=Number(n);return}let f=n;if(o===1){for(let e=0;e<a;e++)d[l+e]=Number(f[e]??0);return}let p=0;for(let e=0;e<o;e++){let t=l+e*u;for(let e=0;e<c;e++)d[t+e]=Number(f[p++]??0)}}};function Fe(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Ie(e,t,n){return Array.prototype.slice.call(e,t,n)}var Le=128;function Re(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!Ne(r)||!Ne(i)||r.length!==i.length)return!1;let a=Math.min(n,Le);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function ze(e){return Ne(e)?e.slice():e}var Be=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return Re(this.uniforms[e],t)?!1:(this.uniforms[e]=ze(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},Ve=1024,He=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=_e(r.uniformTypes??{},{layout:r.layout??Ue(e)}),a=new Pe(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new Be({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,Ve)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let n=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:N.UNIFORM|N.COPY_DST,byteLength:n}),i=this.getUniformBufferData(e);return r.write(i),r}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),n=this.device.createBuffer({usage:N.UNIFORM|N.COPY_DST,byteLength:t});this.uniformBuffers.set(e,n)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&s.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),i=!1;if(r&&n?.needsRedraw){i||=n.needsRedraw;let a=this.getUniformBufferData(e);if(r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,a):r.write(a)),s.level>=4){let t=this.uniformBlocks.get(e)?.getAllUniforms();s.log(4,`Writing to uniform buffer ${String(e)}`,a,t)()}}return i}};function Ue(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function We(e,t){let n={},r=C(e,t,{warnOnMissingBufferLayout:!0});for(let t of r){let r=Ge(e,t);n[t.attributeName]=r}return n}function Ge(e,t){let n=Ke(e,t.attributeName),r=f.getAttributeShaderTypeInfo(n.type),i=t.vertexFormat,a=l.getVertexFormatInfo(i);return{attributeName:t.attributeName,bufferName:t.bufferName,location:n.location,shaderType:n.type,primitiveType:r.primitiveType,shaderComponents:r.components,vertexFormat:i,bufferDataType:a.type,bufferComponents:a.components,normalized:a.normalized,integer:r.integer,stepMode:t.stepMode,byteOffset:t.byteOffset,byteStride:t.byteStride}}function Ke(e,t){let n=e.attributes.find(e=>e.name===t);return n||s.warn(`shader layout attribute "${t}" not present in shader`)(),n||null}var qe=`modulepreload`,Je=function(e,t){return new URL(e,t).href},Ye={},Xe=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=Je(t,n),t=s(t),t in Ye)return;Ye[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:qe,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Ze=`core-features-and-limits`,Qe=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function $e(e){let t={};for(let n of Qe){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function et(e){return e.featureLevel??`core`}function tt(e){let t=et(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!=="default"&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function nt(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(Ze)&&r.push(Ze);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function rt(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(Ze)?`core`:e===`best-available`?`compatibility`:e}function it(e,t){return e===`core`?`core`:rt(`compatibility`,t)}var at=new class extends se{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){if(typeof navigator>`u`||!navigator.gpu)throw Error(`navigator.gpu is unavailable. WebGPU requires a supported browser and a secure context.`);if(typeof navigator.gpu.requestAdapter!=`function`)throw Error(`navigator.gpu.requestAdapter is unavailable.`);let n=et(e),r=tt(e),i;try{i=await this.requestGPUAdapter(r)}catch(e){throw Error(`navigator.gpu.requestAdapter() failed`,{cause:e})}if(!i)throw Object.assign(Error(`navigator.gpu.requestAdapter() returned null. No matching WebGPU adapter is available.`),{code:t?oe:void 0});let a=await ot(i),o={},c=nt(i.features,n,e.optionalFeatures);c.length>0&&(o.requiredFeatures=c);let l={...n===`max`?$e(i.limits):{},...e.requiredLimits};Object.keys(l).length>0&&(o.requiredLimits=l);let u;try{u=await i.requestDevice(o)}catch(e){throw Error(`GPUAdapter.requestDevice() failed`,{cause:e})}let d=await st(u);if(d){if(u.destroy(),t&&d.reason!==`destroyed`)return s.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}s.groupCollapsed(1,`WebGPUDevice created`)();try{let t;try{let{WebGPUDevice:r}=await Xe(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-DEKFHqMa.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url),o=rt(n,u.features),s={...e,featureLevel:o};t=new r(s,u,i,a);let c=r.getCanvasContextProps(s);c&&t.initializeCanvasContext(c)}catch(e){throw t?(t.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})):(u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e}))}return s.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),s.table(1,t.info)(),t}finally{s.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await Xe(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-DEKFHqMa.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url);if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await st(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=it(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function ot(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return s.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function st(e){return await Promise.race([e.lost,Promise.resolve(null)])}function ct(e,t){if(!e){let e=Error(t||`shaders: assertion failed.`);throw Error.captureStackTrace?.(e,ct),e}}var lt={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function ut(e){let t={};for(let[n,r]of Object.entries(e))t[n]=dt(r);return t}function dt(e){let t=ft(e);if(t!==`object`)return{value:e,...lt[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=ft(e.value),{...e,...lt[t],type:t}):{...e,...lt[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function ft(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}function pt(e){e.map(e=>mt(e))}function mt(e){if(e.instance)return;pt(e.dependencies||[]);let{propTypes:t={},deprecations:n=[]}=e,r={parsedDeprecations:gt(n),normalizedInjections:{vertex:{},fragment:{}}};t&&(r.propValidators=ut(t)),e.instance=r;let i={};t&&(i=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...i}}function ht(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function gt(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function _t(e){let t=new Set,n=new Set,r=[],i=new Map;function a(e){let t=i.get(e.name);if(t&&t!==e)throw Error(`Shader module name collision: Multiple different module objects share the name "${e.name}". Each module object must have a unique name.`);i.set(e.name,e)}function o(e,i){if(n.has(e)){let t=[...i,e.name].join(` -> `);throw Error(`Shader module dependency cycle detected: ${t}`)}if(t.has(e))return;a(e),n.add(e);let s=[...i,e.name];if(e.dependencies)for(let t of e.dependencies)o(t,s);n.delete(e),t.add(e),r.push(e)}for(let t of e)o(t,[]);let s=new Set;for(let e of r)e.implements!==void 0&&(ct(!s.has(e.implements)),s.add(e.implements));return pt(r),r}var vt=class{_shaderTranspilers=new Map;_injectionTargets=[];_defaultModules=[];addShaderTranspiler(e){this._shaderTranspilers.set(e.sourceLanguage,e)}removeShaderTranspiler(e){this._shaderTranspilers.delete(e)}_transpileShader(e,t,n,r){let i=e.sourceLanguage||this.shaderLanguage;if(i===this.shaderLanguage)return ct(!_t(t).some(e=>e.sourceLanguage&&e.sourceLanguage!==this.shaderLanguage)),{code:n||``,modules:t};let a=this._shaderTranspilers.get(i);ct(a);let o=_t(t);ct(!o.some(e=>e.sourceLanguage&&e.sourceLanguage!==i&&e.sourceLanguage!==this.shaderLanguage));let s=o.filter(e=>e.sourceLanguage===i).map(e=>e.source||``).join(`
`),c={vertex:e.vertexEntryPoint,fragment:e.fragmentEntryPoint,compute:e.computeEntryPoint},l=n==null?{code:``}:a.transpile({source:[s,n].filter(Boolean).join(`
`),target:this.shaderLanguage,stage:r,entryPoints:c,platformInfo:e.platformInfo}),u=o.map(e=>({...e,dependencies:void 0,...e.sourceLanguage===i?{source:void 0,vs:void 0,fs:void 0}:{}}));return{...l,modules:u}}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderInjectionTarget(e){this._injectionTargets.push(e)}resetShaderInjectionTargets(){this._injectionTargets.length=0}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,pt(t),t}},yt=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${te}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${te}\\s*:\\s*([^;]+);`,`g`)];function bt(e,t=[]){let n=D(e),r=new Map;for(let e of t)r.set(St(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of yt){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===yt[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(St(l,s,o));i.push(xt({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function xt(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:Tt(e.resourceType),viewDimension:Ct(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:Ct(e.resourceType),sampleType:wt(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function St(e,t,n){return`${t}:${n}:${e}`}function Ct(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function wt(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function Tt(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}function Et(e,t=``){let n=new Map,r=Object.values(e).flatMap(e=>Object.entries(e).map(([e,t])=>`${e.slice(3)}\n${t.signature}\n${t.header||``}\n${t.footer||``}`)),i=new Set(D(`${t}\n${r.join(`
`)}`).match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let t of Object.keys(e.vertex)){let r=t.slice(3);e.fragment[`fs:${r}`]&&n.set(r,{vertex:Ot(`_luma_vertex_target_${r}`,i),fragment:Ot(`_luma_fragment_target_${r}`,i)})}return n}function Dt(e,t,n=Et(t)){if(!n.size)return e;let r=D(e),i=new Map,a=/((?:@\w+(?:\([^)]*\))?\s*)*)\bfn\s+([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu;for(let e=a.exec(r);e;e=a.exec(r)){let t=r.indexOf(`{`,a.lastIndex),n=t+1,o=1;for(;n<r.length&&o;n++)r[n]===`{`&&o++,r[n]===`}`&&o--;ct(t>=0&&o===0);let s=e[2],c=e.index+e[0].lastIndexOf(s),l=Array.from(r.slice(t+1,n-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu),e=>e[1]);i.set(s,{name:s,start:e.index,end:n,nameStart:c,bodyStart:t,calls:l,stages:new Set,entryStage:/@vertex\b/.test(e[1])?`vertex`:/@fragment\b/.test(e[1])?`fragment`:void 0}),a.lastIndex=n}function o(e,t){let r=i.get(e);if(!(!r||r.stages.has(t))){r.stages.add(t);for(let e of r.calls)o(n.get(e)?.[t]||e,t)}}for(let e of i.values())e.entryStage&&o(e.name,e.entryStage);for(let e of[`vertex`,`fragment`])for(let r of Object.keys(t[e])){let t=r.slice(3);o(n.get(t)?.[e]||t,e)}let s=new Set,c=!0;for(;c;){c=!1;for(let e of i.values())!s.has(e.name)&&e.calls.some(e=>n.has(e)||s.has(e))&&(s.add(e.name),c=!0)}let l=new Map,u=new Set(r.match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let e of s)i.get(e)?.stages.size===2&&l.set(e,{vertex:Ot(`_luma_vertex_helper_${e}`,u),fragment:Ot(`_luma_fragment_helper_${e}`,u)});function d(e,t){return n.get(e)?.[t]||l.get(e)?.[t]||e}for(let t of[...i.values()].reverse()){if(!s.has(t.name))continue;if(!t.stages.size)throw Error(`Cannot infer WGSL target stage in ${t.name}`);let n=[],i=t.start;for(let a of t.stages){let o=e.slice(i,t.end),s=[...r.slice(t.bodyStart+1,t.end-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu)];for(let e of s.reverse()){let n=t.bodyStart+1+e.index-i,r=d(e[1],a);o=o.slice(0,n)+r+o.slice(n+e[1].length)}let c=t.nameStart-i;o=o.slice(0,c)+d(t.name,a)+o.slice(c+t.name.length),n.push(o)}e=e.slice(0,i)+n.join(`
`)+e.slice(t.end)}return e}function Ot(e,t){let n=e,r=0;for(;t.has(n);)n=`${e}_${++r}`;return t.add(n),n}var kt={vertex:`#ifdef MODULE_LOGDEPTH
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
`},At=/void\s+main\s*\([^)]*\)\s*\{\n?/,jt=/}\n?[^{}]*$/,Mt=[],Nt=`__LUMA_INJECT_DECLARATIONS__`;function Pt(e,t,n){let r={};for(let i of e){let e=i[t];if(e===void 0)continue;if(i.stage!==`vertex`&&i.stage!==`fragment`||i.target.includes(`:`))throw Error(`Shader injection targets require an explicit stage and unqualified target`);let a=`${i.stage===`vertex`?`vs`:`fs`}:${i.target}`;if(!/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][A-Za-z0-9_]*)$/.test(a))throw Error(`Shader injection target "${a}" must be a named shader injection target`);r[a]||=[],r[a].push({injection:e,order:i.order??0,...n?{pluginName:n}:{}})}return r}function Ft(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),Mt.length=r.length;for(let e=0,t=r.length;e<t;++e)Mt[e]=r[e].injection;let s=`${Mt.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(Nt,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?It(e,`vertex`,s,`start`,a.vertex):e.replace(At,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?It(e,`vertex`,s,`end`,a.vertex):e.replace(jt,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(Nt,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?It(e,`fragment`,s,`start`,a.fragment):e.replace(At,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?It(e,`fragment`,s,`end`,a.fragment):e.replace(jt,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(Nt,``),r&&(e=e.replace(/\}\s*$/,e=>e+kt[t])),e}function It(e,t,n,r,i){let a=Lt(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function Lt(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${Rt(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function Rt(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var zt=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,Bt=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function Vt(e){return`${e.name}Uniforms`}function Ht(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=Vt(e);return qt(n,t===`wgsl`?`wgsl`:`glsl`,r)}function Ut(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=Ht(e,t);return r?{moduleName:e.name,uniformBlockName:Vt(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:Xt(n,r)}:null}function Wt(e,t,n={}){let r=Ut(e,t);if(!r||r.matches)return r;let i=Zt(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&ct(!1,i),r}function Gt(e){let t=[],n=Qt(e);for(let e of n.matchAll(Bt)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function Kt(e,t,n,r){let i=Gt(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${$t(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function qt(e,t,n){let r=t===`wgsl`?Jt(e,n):Yt(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(zt);r&&i.push(r[1])}return i}function Jt(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function Yt(e,t){return Gt(e).find(e=>e.blockName===t)?.body||null}function Xt(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Zt(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=en(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${tn(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${tn(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function Qt(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function $t(e){return e.replace(/\s+/g,` `).trim()}function en(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function tn(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}var nn=`\n\n${Nt}\n`;function rn(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function an(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function on(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:ct(!1)}if(!e.name)throw Error(`Shader module must have a name`);Wt(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}var sn=`([a-zA-Z_][a-zA-Z0-9_]*)`,cn=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,ln=RegExp(`^\\s*\\#\\s*ifdef\\s*${sn}\\s*$`),un=RegExp(`^\\s*\\#\\s*ifndef\\s*${sn}\\s*(?:\\/\\/.*)?$`),dn=/^\s*\#\s*else\s*(?:\/\/.*)?$/,fn=/^\s*\#\s*endif\s*$/,pn=RegExp(`^\\s*\\#\\s*ifdef\\s*${sn}\\s*(?:\\/\\/.*)?$`),mn=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function hn(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(cn),o=e.match(pn)||e.match(ln),s=e.match(un),c=e.match(dn),l=e.match(mn)||e.match(fn);if(n){let e=gn(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=!i.length||i[i.length-1].active):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function gn(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=`(?:[A-Za-z_][A-Za-z0-9_]*|[+-]?\\d+(?:\\.\\d+)?)`,i=n.match(RegExp(`^(${r})\\s*(==|!=|<=|>=|<|>)\\s*(${r})$`));if(i){let e=e=>/^[A-Za-z_]/.test(e)?Number(t[e]??0):Number(e),n=e(i[1]),r=e(i[3]);switch(i[2]){case`==`:return n===r;case`!=`:return n!==r;case`<=`:return n<=r;case`>=`:return n>=r;case`<`:return n<r;case`>`:return n>r}}let a=n.match(RegExp(`^!\\s*${sn}$`));if(a)return!t[a[1]];let o=n.match(RegExp(`^${sn}$`));if(o)return!!t[o[1]];let s=n.match(RegExp(`^defined\\s*\\(\\s*${sn}\\s*\\)$`));if(s)return t[s[1]]!==void 0;let c=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${sn}\\s*\\)$`));if(c)return t[c[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function _n(e,t){let n=[];for(let[r,i]of Object.entries(t))bn(e,r),n.push(`in ${yn(i)} ${r};`);return n.join(`
`)}function vn(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=xn(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Sn(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||Dn(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=On(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function yn(e){let{primitiveType:t,components:n}=f.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function bn(e,t){let n=jn(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function xn(e,t){let n=RegExp(`\\bfn\\s+${jn(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=kn(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Sn(e,t){let n=Cn(t),r=new Set(wn(t)),i=Tn(t);for(let t of i){let i=En(e,t);if(i!==null){n.push(...Cn(i));for(let e of wn(i))r.add(e)}}return{locations:n,names:r}}function Cn(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function wn(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Tn(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function En(e,t){let n=RegExp(`\\bstruct\\s+${jn(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=kn(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function Dn(e,t){let n=jn(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(An(e,i.index)===0)return!0;i=r.exec(e)}return!1}function On(e){let t=0;for(;e.has(t);)t++;return t}function kn(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function An(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function jn(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Mn(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){Qn(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${yn(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Xn(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function Nn(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=Pn(a,t,`vertex`),s=Fn(a,o),c=Pn(a,n,`fragment`),l=In(a,c),u=Ln(a,s),d=l?Ln(a,l.type):null,f=new Set([...qn(o.parameters),...qn(u.body),...qn(c.parameters),...qn(d?.body||``)]),p=new Set([...Kn(u.body),...Kn(d?.body||``),...Kn(c.parameters)]),m=[],h=[],g=[],_=[],v=[];for(let[e,t]of i){if(f.has(e)||Jn(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=Yn(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;if(m.push(`  @location(${n})${r} ${e}: ${t.type},`),g.push(`var<private> ${e}: ${t.type};`),_.push(`${e} = ${Zn(t.type)};`),l)v.push(`${e} = ${l.name}.${e};`);else{let i=`_luma_${e}`;if(f.has(i))throw Error(`ShaderPlugin varying "${e}" conflicts with a generated fragment parameter`);h.push(`@location(${n})${r} ${i}: ${t.type}`),v.push(`${e} = ${i};`)}}zn(a,s,o.openBrace,o.closeBrace),a=Bn(a,s,o,i.map(([e])=>e)),o=Pn(a,t,`vertex`),a=Vn(a,o,i.map(([e])=>e));let y=(!l||s===l.type?[s]:[s,l.type]).map(e=>Ln(a,e).closeBrace).sort((e,t)=>t-e);for(let e of y)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=Pn(a,n,`fragment`),h.length){let e=c.parameters,t=D(e).trimEnd();if(t.trim()&&!t.endsWith(`,`)){let n=t.length;e=`${e.slice(0,n)},${e.slice(n)}`}a=a.slice(0,c.openParenthesis+1)+e+`
  `+h.join(`,
  `)+`
`+a.slice(c.closeParenthesis)}return{source:a,declarations:g.join(`
`),vertexInitialization:_.join(`
`),fragmentInitialization:v.join(`
`)}}function Pn(e,t,n){let r=RegExp(`\\bfn\\s+${tr(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin interStageVariables require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=$n(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=$n(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function Fn(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||Rn(e,r[1])===null)throw Error(`ShaderPlugin interStageVariables require the WGSL vertex entry point to return a named struct`);return r[1]}function In(e,t){let n=[];for(let r of Gn(D(t.parameters),`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&Rn(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length>1)throw Error(`ShaderPlugin interStageVariables require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]||null}function Ln(e,t){let n=Rn(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function Rn(e,t){let n=RegExp(`\\bstruct\\s+${tr(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=$n(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function zn(e,t,n,r){let i=RegExp(`\\b${tr(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function Bn(e,t,n,r){let i=RegExp(`\\b${tr(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=$n(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function Vn(e,t,n){let r=Hn(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function Hn(e,t,n){let r=[],i=t;for(;i<n;)if(i=Wn(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=Un(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function Un(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=Wn(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function Wn(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function Gn(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function Kn(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function qn(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Jn(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${tr(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(er(e,r.index)===0)return!0;r=n.exec(e)}return!1}function Yn(e){let t=0;for(;e.has(t);)t++;return t}function Xn(e){let{primitiveType:t,components:n}=f.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${yn(e)}(${r})`}function Zn(e){let{primitiveType:t,components:n}=f.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function Qn(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${tr(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function $n(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function er(e,t){let n=0;for(let r=0;r<t;r++){let i=Wn(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function tr(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function nr(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i],o=a.returnType||`void`,s=n===`wgsl`?`fn`:o,c=n===`wgsl`&&o!==`void`?` -> ${o}`:``;if(r+=`${s} ${a.signature}${c} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function rr(e,t=[],n=`glsl`){let r={vertex:{},fragment:{}};for(let t of e){let e=t[n];if(e){let n=t.stage===`vertex`?`vs`:`fs`;r[t.stage][`${n}:${t.name}`]={...e,signature:`${t.name}(${e.parameters})`}}}for(let e of t){let t=rr([e],[],n);for(let e of[`vertex`,`fragment`])for(let[n,i]of Object.entries(t[e])){let t=r[e][n];if(t&&(t.signature!==i.signature||(t.returnType||`void`)!==(i.returnType||`void`)))throw Error(`Conflicting ShaderPlugin injection target ${n}`);r[e][n]=t||i}}return r}function ir(e,t){return!!(t.startsWith(`vs:`)?e.vertex:e.fragment)[t]}function ar(e,t,n){let r=n===`vertex`?`vs:`:n===`fragment`?`fs:`:null;for(let n in t)if(!(r&&!n.startsWith(r))&&!ir(e,n)){let e=[...new Set(t[n].map(e=>e.pluginName).filter(Boolean))];throw Error(`Unknown shader injection target ${n}${e.length?` (plugins: ${e.join(`, `)})`:``}`)}}function or(e){let t=_t(e.modules||[]),{source:n,bindingAssignments:r}=sr(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:rn(t),bindingAssignments:r}}function sr(e,t){let{source:n,stage:r,modules:i,defines:a={},injectionTargets:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginInterStageVariables:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;ct(typeof n==`string`,`shader source must be a string`);let m=vn(hn(n,{defines:a}),d,l),h=Nn(m.source,d,f,u),g=h.source,_=``,v=rr(o,t.pluginInjectionTargets,`wgsl`),y={},b={},x={};an(c,y,b,x),an(Array.isArray(s)?Pt(s,`wgsl`):{},y,b,x);let S=Array.isArray(s)?{}:s;for(let e in S){let t=typeof S[e]==`string`?{injection:S[e],order:0}:S[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[...b[e]||[],t]:x[e]=[...x[e]||[],t]:y[e]=[...y[e]||[],t]}else x[e]=[...x[e]||[],t]}cr(m.declarations,m.initialization,b,x),lr(h,b,x),ar(v,y);let C=i.map(e=>({module:e,source:hn(on(e,`wgsl`,p),{defines:a})})),w=pr(g),T=fr(w.source),E=_r(C,t._bindingRegistry,T),D=[],O=C.map(({module:e,source:n})=>{let r=mr(n,e,{usedBindingsByGroup:T,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:E});return D.push(...r.bindingAssignments),{module:e,source:r.source}});for(let{module:e,source:t}of O)p&&ht(e,g,p),_+=t;_+=nn,_=Ft(_,r,ur(b),!1,`wgsl`,{vertex:d,fragment:f});let k=Et(v,[_,w.source,...Object.values(y).flat().map(e=>e.injection),...Object.values(x).flat().map(e=>e.injection)].join(`
`));return _+=dr(v,y,k),_+=Tr(D),_+=w.source,_=Ft(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),_=Dt(_,v,k),wr(_),{source:_,bindingAssignments:D}}function cr(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function lr(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function ur(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function dr(e,t,n=Et(e)){return[`vertex`,`fragment`].map(r=>nr(Object.fromEntries(Object.entries(e[r]).map(([e,t])=>{let i=e.slice(3),a=n.get(i)?.[r]||i;return[e,{...t,signature:a+t.signature.slice(i.length)}]})),t,`wgsl`)).join(``)}function fr(e){let t=new Map;for(let n of ne(e,v)){let e=Number(n.bindingToken),r=Number(n.groupToken);yr(r,e,n.name),xr(t,r,e,`application binding "${n.name}"`)}return t}function pr(e){let t=ne(e,w),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);yr(r,t,e.name),xr(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=re(e,w,e=>gr(e,n,r));if(b(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function mr(e,t,n){let r=[],i={sawSupportedBindingDeclaration:ne(e,k).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=re(e,k,e=>hr(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(b(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function hr(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=Er(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?Sr(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return br(n.name,u,s,l),t!==void 0&&vr(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(xr(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);br(n.name,u,d,l);let f=Er(u,n.name,l);return vr(r.reservedBindingKeysByGroup,u,d,f)||xr(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function gr(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=Cr(s,t);return yr(s,e,o),xr(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function _r(e,t,n){let r=new Map,i=[];function a(e,t,i,a){xr(n,e,t,a);let o=r.get(e)||new Map;o.set(t,i),r.set(e,o)}for(let{module:t,source:n}of e)for(let e of ne(n,k)){let n=Number(e.groupToken);if(e.bindingToken===`auto`){i.push({module:t,name:e.name,group:n});continue}let r=Number(e.bindingToken);br(t.name,n,r,e.name),a(n,r,Er(n,t.name,e.name),`module "${t.name}" binding "${e.name}"`)}for(let{module:e,name:n,group:r}of i){let i=Er(r,e.name,n),o=t?.get(i);o!==void 0&&a(r,o,i,`registered module binding "${i}"`)}return r}function vr(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return i.delete(n),!0}function yr(e,t,n){if(e===0&&t>=100)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function br(e,t,n,r){if(t===0&&n<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function xr(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function Sr(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?100:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function Cr(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function wr(e){let t=A(e,k);if(!t)return;let n=Dr(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):Or(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${kr(t.match)}".`)}function Tr(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function Er(e,t,n){return`${e}:${t}:${n}`}function Dr(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function Or(e,t){let n=e.indexOf(nn);return n>=0?t>n:!0}function kr(e){return e.replace(/\s+/g,` `).trim()}var Ar=class e extends vt{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=[...this._injectionTargets,...t.injectionTargets||[]],i=this._transpileShader(t,n,t.source,t.shaderStage??(t.computeEntryPoint?`compute`:void 0)),a={vertex:i.entryPoints?.vertex??t.vertexEntryPoint,fragment:i.entryPoints?.fragment??t.fragmentEntryPoint,compute:i.entryPoints?.compute??t.computeEntryPoint},o=e.getShaderPreprocessorDefines(t,n),s=t.platformInfo.shaderLanguage===`wgsl`&&i.code?hn(i.code,{defines:o}):i.code,{source:c,getUniforms:l,bindingAssignments:u}=or({...t,source:s,vertexEntryPoint:a.vertex,fragmentEntryPoint:a.fragment,defines:o,_bindingRegistry:this._wgslBindingRegistry,modules:i.modules,injectionTargets:r}),d=t.platformInfo.shaderLanguage===`wgsl`?hn(c,{defines:o}):c;return{source:d,entryPoints:a,getUniforms:l,modules:n,bindingAssignments:u,bindingTable:bt(d,u),shaderLayout:j(d,{vertexEntryPoint:a.vertex,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}},jr=/^vertex-list<([^<>]+)>$/,Mr=/^value-list<([^<>]+)>$/,Nr=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function Pr(e){return jr.test(e)}function Fr(e){return Mr.test(e)}function Ir(e){let t=jr.exec(e),n=Mr.exec(e),r=Rr(e)?.elementFormat??t?.[1]??n?.[1]??e;try{l.getVertexFormatInfo(r)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return r}function Lr(e){let t=Ir(e),n=Pr(e),r=Fr(e),i=Rr(e),a=l.getVertexFormatInfo(t),o=a.byteLength*(i?.listSize??1);if(!Number.isSafeInteger(o))throw Error(`Unsupported GPUVector format ${e}`);let s=a.type,c=a.normalized,u=zr(s,c);return{format:e,elementFormat:t,vertexList:n,valueList:r,fixedSizeList:!!i,...i?{listSize:i.listSize}:{},type:s,signedDataType:Br(t,s),primitiveType:u,components:a.components,elementByteLength:a.byteLength,byteLength:o,integer:a.integer,signed:a.signed,normalized:c,...a.webglOnly?{webglOnly:!0}:{}}}function Rr(e){let t=Nr.exec(e);if(!t)return;let n=Number(t[2]);if(!Number.isSafeInteger(n))return;let r=t[1];try{let e=l.getVertexFormatInfo(r);if(!Number.isSafeInteger(n*e.components)||!Number.isSafeInteger(n*e.byteLength))return}catch{return}return{elementFormat:r,listSize:n}}function zr(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function Br(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function Vr(e){let t=0;return Object.freeze(e.map(e=>{let n=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,n}))}function Hr(e=[],t){let n={modules:[],injectionTargets:[],defines:{},injections:{},vertexInputs:{},interStageVariables:{}};for(let r of e)Wr(n,r,t);let{vertexInputs:r,interStageVariables:i}=n;for(let e of Object.keys(i))if(r[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return n}function Ur(e=[],t=[],n={}){let r=[...e],i=new Map;for(let e of r){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||i.set(e.name,e)}for(let e of t){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||(r.push(e),i.set(e.name,e))}return r}function Wr(e,t,n){t.module&&e.modules.push(t.module),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){Gr(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.interStageVariables||{})){Gr(n,`varying`);let t=Kr(n,r),i=e.interStageVariables[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.interStageVariables[n]=t}for(let r of t.injectionTargets||[]){let t=r[n];if(!t)continue;let i=`${r.stage===`vertex`?`vs`:`fs`}:${r.name}`;if(!/^(vs|fs):[A-Za-z_][A-Za-z0-9_]*$/.test(i))throw Error(`Invalid ShaderPlugin injection target ${i}`);let a=e.injectionTargets.find(e=>e.stage===r.stage&&e.name===r.name),o=a?.[n];if(o&&(o.parameters!==t.parameters||(o.returnType||`void`)!==(t.returnType||`void`)||o.header!==t.header||o.footer!==t.footer))throw Error(`Conflicting ShaderPlugin injection target ${i}`);a||e.injectionTargets.push({name:r.name,stage:r.stage,[n]:t})}let r=Pt(Array.isArray(t.injections)?t.injections:Object.entries(t.injections||{}).flatMap(([e,t])=>{let r=qr(e,n);if(r===void 0)return[];let[i,...a]=r.split(`:`);if(i!==`vs`&&i!==`fs`)throw Error(`Invalid ShaderPlugin injection ${e}`);return[{stage:i===`vs`?`vertex`:`fragment`,target:a.join(`:`),[n]:t}]}),n,t.name);for(let[t,n]of Object.entries(r))e.injections[t]||=[],e.injections[t].push(...n)}function Gr(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function Kr(e,t){let{primitiveType:n}=f.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function qr(e,t){let n=/^(glsl|wgsl):([\s\S]+)$/.exec(e);return n?n[1]===t?n[2]:void 0:e}function Jr(e,t){return{name:Yr(e,t),language:`glsl`,version:Xr(e)}}function Yr(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Xr(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function Zr(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function Qr(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=ni(e,ei),e;case`fragment`:return e=ni(e,ti),e;default:throw Error(t)}}var $r=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],ei=[...$r,[ri(`attribute`),`in $1`],[ri(`varying`),`out $1`]],ti=[...$r,[ri(`varying`),`in $1`]];function ni(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function ri(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var ii=`precision highp float;
`;function ai(e){let{vs:t,fs:n}=e,r=_t(e.modules||[]);return{vs:oi(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:oi(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:rn(r)}}function oi(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},injectionTargets:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginInterStageVariables:d={},prologue:f=!0,log:p}=t;ct(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?Jr(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${Zr(e)}
${r===`fragment`?ii:``}

// ----- APPLICATION DEFINES -------------------------

${si(v)}

`:`${g}
`;break}let b=rr(s,t.pluginInjectionTargets,`glsl`),x={},S={},C={};an(l,x,S,C),an(Array.isArray(c)?Pt(c,`glsl`):{},x,S,C);let w=Array.isArray(c)?{}:c;for(let e in w){let t=typeof w[e]==`string`?{injection:w[e],order:0}:w[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[...S[e]||[],t]:C[e]=[...C[e]||[],t]:x[e]=[...x[e]||[],t]}else C[e]=[...C[e]||[],t]}if(r===`vertex`){let e=_n(_,u);e&&(y+=`${e}\n`)}let T=Mn(_,r,d);T.declarations&&(y+=`${T.declarations}\n`),T.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:T.initialization,order:-(2**53-1)}));for(let e of a){p&&ht(e,_,p);let t=on(e,r,p);y+=t}return ar(b,x,r),y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=nn,y=Ft(y,r,S),y+=nr(b[r],x),y+=_,y=Ft(y,r,C),i===`glsl`&&m!==h&&(y=Qr(y,r)),i===`glsl`&&Kt(y,r,p),y.trim()}function si(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var ci=class extends vt{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...ai({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}};1/Math.PI*180;var li=1/180*Math.PI;globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}};var ui=globalThis.mathgl.config;function di(e,{precision:t=ui.precision}={}){return e=hi(e),`${parseFloat(e.toPrecision(t))}`}function fi(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function pi(e,t){return _i(e,e=>e*li,t)}function mi(e,t,n){let r=ui.EPSILON;n&&(ui.EPSILON=n);try{if(e===t)return!0;if(fi(e)&&fi(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!mi(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`&&Math.abs(e-t)<=ui.EPSILON*Math.max(1,Math.abs(e),Math.abs(t))}finally{ui.EPSILON=r}}function hi(e){return Math.round(e/ui.EPSILON)*ui.EPSILON}function gi(e){return e.clone?e.clone():Array(e.length)}function _i(e,t,n){if(fi(e)){let r=e;n||=gi(r);for(let i=0;i<n.length&&i<r.length;++i){let r=typeof e==`number`?e:e[i];n[i]=t(r,i,n)}return n}return t(e)}var vi=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:fi(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(ui)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+di(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!mi(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r],a=typeof t==`number`?t:t[r];this[r]=i+n*(a-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(ui.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}};function yi(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function I(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function bi(e,t,n=``){if(ui.debug&&!yi(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}var xi=class extends vi{toString(){let e=`[`;if(ui.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=I(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}};function Si(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}var Ci=class extends vi{get x(){return this[0]}set x(e){this[0]=I(e)}get y(){return this[1]}set y(e){this[1]=I(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let n=0;n<this.ELEMENTS;++n){let r=this[n]-e[n];t+=r*r}return I(t)}dot(e){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*e[n];return I(t)}normalize(){let e=this.magnitude();if(e!==0)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return Si(e>=0&&e<this.ELEMENTS,`index is out of range`),I(this[e])}setComponent(e,t){return Si(e>=0&&e<this.ELEMENTS,`index is out of range`),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]+=e[n]*t;return this.check()}},wi=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180;function Ti(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}function Ei(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function Di(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function Oi(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e[2]=t[2],e}function ki(){let e=new wi(3);return wi!==Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function Ai(e){let t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)}function ji(e,t,n){let r=new wi(3);return r[0]=e,r[1]=t,r[2]=n,r}function Mi(e,t){let n=t[0],r=t[1],i=t[2],a=n*n+r*r+i*i;return a>0&&(a=1/Math.sqrt(a)),e[0]=t[0]*a,e[1]=t[1]*a,e[2]=t[2]*a,e}function Ni(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function Pi(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function Fi(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}function Ii(e,t,n){let r=t[0],i=t[1],a=t[2];return e[0]=r*n[0]+i*n[3]+a*n[6],e[1]=r*n[1]+i*n[4]+a*n[7],e[2]=r*n[2]+i*n[5]+a*n[8],e}function Li(e,t,n){let r=n[0],i=n[1],a=n[2],o=n[3],s=t[0],c=t[1],l=t[2],u=i*l-a*c,d=a*s-r*l,f=r*c-i*s,p=i*f-a*d,m=a*u-r*f,h=r*d-i*u,g=o*2;return u*=g,d*=g,f*=g,p*=2,m*=2,h*=2,e[0]=s+u+p,e[1]=c+d+m,e[2]=l+f+h,e}function Ri(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0],a[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),a[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function zi(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function Bi(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function Vi(e,t){let n=e[0],r=e[1],i=e[2],a=t[0],o=t[1],s=t[2],c=Math.sqrt((n*n+r*r+i*i)*(a*a+o*o+s*s)),l=c&&Ni(e,t)/c;return Math.acos(Math.min(Math.max(l,-1),1))}var Hi=Ai,Ui=[0,0,0],Wi,Gi=class e extends Ci{static get ZERO(){return Wi||(Wi=new e(0,0,0),Object.freeze(Wi)),Wi}constructor(e=0,t=0,n=0){super(-0,-0,-0),arguments.length===1&&fi(e)?this.copy(e):(ui.debug&&(I(e),I(t),I(n)),this[0]=e,this[1]=t,this[2]=n)}set(e,t,n){return this[0]=e,this[1]=t,this[2]=n,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return ui.debug&&(I(e.x),I(e.y),I(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=I(e)}angle(e){return Vi(this,e)}cross(e){return Pi(this,this,e),this.check()}rotateX({radians:e,origin:t=Ui}){return Ri(this,this,t,e),this.check()}rotateY({radians:e,origin:t=Ui}){return zi(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=Ui}){return Bi(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return Fi(this,this,e),this.check()}transformAsVector(e){return Di(this,this,e),this.check()}transformByMatrix3(e){return Ii(this,this,e),this.check()}transformByMatrix2(e){return Oi(this,this,e),this.check()}transformByQuaternion(e){return Li(this,this,e),this.check()}};function Ki(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function qi(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function Ji(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function Yi(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function Xi(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function Zi(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function Qi(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function $i(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,ee;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,ee=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*ee,e[9]=f*k+g*A+b*ee,e[10]=p*k+_*A+x*ee,e[11]=m*k+v*A+S*ee,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function ea(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function ta(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function na(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function ra(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function ia(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function aa(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var oa=aa;function sa(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var ca=sa;function la(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?Ki(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function ua(e){if(e.length!==16||Array.from(e).some(e=>!Number.isFinite(e))||e[3]!==0||e[7]!==0||e[11]!==0||e[15]!==1)throw RangeError(`Expected a finite affine matrix`);let t=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(t.some(e=>e===0||!Number.isFinite(e)))throw RangeError(`Singular transform`);let n=Array.from({length:9},(n,r)=>e[Math.floor(r/3)*4+r%3]/t[Math.floor(r/3)]);for(let[e,t]of[[0,3],[0,6],[3,6]])if(Math.abs(n[e]*n[t]+n[e+1]*n[t+1]+n[e+2]*n[t+2])>1e-7)throw RangeError(`Sheared transforms do not have a TRS decomposition`);if(n[0]*(n[4]*n[8]-n[5]*n[7])-n[3]*(n[1]*n[8]-n[2]*n[7])+n[6]*(n[1]*n[5]-n[2]*n[4])<0){t[0]=-t[0];for(let e=0;e<3;e++)n[e]=-n[e]}return{rotation:n,scale:t,translation:[e[12],e[13],e[14]]}}function da(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e[3]=t[3]+n[3],e}function fa(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function pa(e){let t=e[0],n=e[1],r=e[2],i=e[3];return Math.sqrt(t*t+n*n+r*r+i*i)}function ma(e){let t=e[0],n=e[1],r=e[2],i=e[3];return t*t+n*n+r*r+i*i}function ha(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a;return o>0&&(o=1/Math.sqrt(o)),e[0]=n*o,e[1]=r*o,e[2]=i*o,e[3]=a*o,e}function ga(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]+e[3]*t[3]}function _a(e,t,n,r){let i=t[0],a=t[1],o=t[2],s=t[3];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e[3]=s+r*(n[3]-s),e}function va(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}var ya=45*Math.PI/180,ba=1,xa=.1,Sa=500,Ca=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),L=class extends xi{static get IDENTITY(){return Da()}static get ZERO(){return Ea()}get ELEMENTS(){return 16}get RANK(){return 4}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(Ca)}fromObject(e){return this.check()}fromQuaternion(e){return ra(this,e),this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=xa,far:o=Sa}=e;return o===1/0?ka(this,t,n,r,i,a):ia(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return la(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=xa,far:o=Sa}=e;return ca(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=ya,aspect:n=ba,focalDistance:r=1,near:i=xa,far:a=Sa}=e;Oa(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return Oa(t),oa(this,t,n,r,i),this.check()}determinant(){return Yi(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){let{rotation:n,scale:r}=ua(this);if(e||=Array(16),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<16;t++)e[t]=0;for(let t=0;t<9;t++)e[Math.floor(t/3)*4+t%3]=n[t];return e[15]=1,e}getRotationMatrix3(e,t){let{rotation:n,scale:r}=ua(this);if(e||=Array(9),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<9;t++)e[t]=n[t];return e}transpose(){return qi(this,this),this.check()}invert(){return Ji(this,this),this.check()}multiplyLeft(e){return Xi(this,e,this),this.check()}multiplyRight(e){return Xi(this,this,e),this.check()}rotateX(e){return ea(this,this,e),this.check()}rotateY(e){return ta(this,this,e),this.check()}rotateZ(e){return na(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return $i(this,this,e,t),this.check()}scale(e){return Qi(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return Zi(this,this,e),this.check()}transform(e,t){return e.length===4?(t=va(t||[-0,-0,-0,-0],e,this),bi(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=Ti(t||[-0,-0],e,this);break;case 3:r=Fi(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return bi(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=Ei(t||[-0,-0],e,this);break;case 3:n=Di(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return bi(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},wa,Ta;function Ea(){return wa||(wa=new L([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(wa)),wa}function Da(){return Ta||(Ta=new L,Object.freeze(Ta)),Ta}function Oa(e){if(e>Math.PI*2)throw Error(`expected radians`)}function ka(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}function Aa(e){return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e}function ja(e,t,n){n*=.5;let r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e}function Ma(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1],l=n[2],u=n[3];return e[0]=r*u+o*s+i*l-a*c,e[1]=i*u+o*c+a*s-r*l,e[2]=a*u+o*l+r*c-i*s,e[3]=o*u-r*s-i*c-a*l,e}function Na(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+o*s,e[1]=i*c+a*s,e[2]=a*c-i*s,e[3]=o*c-r*s,e}function Pa(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c-a*s,e[1]=i*c+o*s,e[2]=a*c+r*s,e[3]=o*c-i*s,e}function Fa(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+i*s,e[1]=i*c-r*s,e[2]=a*c+o*s,e[3]=o*c-a*s,e}function Ia(e,t){let n=t[0],r=t[1],i=t[2];return e[0]=n,e[1]=r,e[2]=i,e[3]=Math.sqrt(Math.abs(1-n*n-r*r-i*i)),e}function La(e,t,n,r){let i=t[0],a=t[1],o=t[2],s=t[3],c=n[0],l=n[1],u=n[2],d=n[3],f,p,m,h,g;return f=i*c+a*l+o*u+s*d,f<0&&(f=-f,c=-c,l=-l,u=-u,d=-d),1-f>1e-6?(p=Math.acos(f),g=Math.sin(p),m=Math.sin((1-r)*p)/g,h=Math.sin(r*p)/g):(m=1-r,h=r),e[0]=m*i+h*c,e[1]=m*a+h*l,e[2]=m*o+h*u,e[3]=m*s+h*d,e}function Ra(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a,s=o?1/o:0;return e[0]=-n*s,e[1]=-r*s,e[2]=-i*s,e[3]=a*s,e}function za(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=t[3],e}function Ba(e,t){let n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[5]-t[7])*r,e[1]=(t[6]-t[2])*r,e[2]=(t[1]-t[3])*r;else{let n=0;t[4]>t[0]&&(n=1),t[8]>t[n*3+n]&&(n=2);let i=(n+1)%3,a=(n+2)%3;r=Math.sqrt(t[n*3+n]-t[i*3+i]-t[a*3+a]+1),e[n]=.5*r,r=.5/r,e[3]=(t[i*3+a]-t[a*3+i])*r,e[i]=(t[i*3+n]+t[n*3+i])*r,e[a]=(t[a*3+n]+t[n*3+a])*r}return e}var Va=da,Ha=fa,Ua=ga,Wa=_a,Ga=pa,Ka=ma,qa=ha,Ja=(function(){let e=ki(),t=ji(1,0,0),n=ji(0,1,0);return function(r,i,a){let o=Ni(i,a);return o<-.999999?(Pi(e,t,i),Hi(e)<1e-6&&Pi(e,n,i),Mi(e,e),ja(r,e,Math.PI),r):o>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(Pi(e,i,a),r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=1+o,qa(r,r))}})();function Ya(e,t,n,r){if(t.length!==4||n.length!==4||[...Array.from(t),...Array.from(n),r].some(e=>!Number.isFinite(e)))throw RangeError(`Expected finite quaternions and step`);if(t.length!==4||r<0)throw RangeError(`Expected quaternions and a nonnegative step`);let i=Math.max(...Array.from(t,Math.abs)),a=Math.max(...Array.from(n,Math.abs));if(!i||!a)throw RangeError(`Zero quaternion`);let o=Array.from(t,e=>e/i),s=Array.from(n,e=>e/a),c=Math.hypot(...o),l=Math.hypot(...s);for(let e=0;e<4;e++)o[e]/=c,s[e]/=l;let u=o.reduce((e,t,n)=>e+t*s[n],0),d=2*Math.acos(Math.min(1,Math.abs(u)));if(e.length<4)throw RangeError(`Result buffer is too short`);return La(e,o,s,d===0?0:Math.min(1,r/d)),e}var Xa=class extends vi{constructor(e=0,t=0,n=0,r=1){super(-0,-0,-0,-0),Array.isArray(e)&&arguments.length===1?this.copy(e):this.set(e,t,n,r)}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}set(e,t,n,r){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this.check()}fromObject(e){return this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this.check()}fromMatrix3(e){return Ba(this,e),this.check()}fromEuler(e){switch(this.identity(),e.order){case`xyz`:return this.rotateX(e.x).rotateY(e.y).rotateZ(e.z);case`yxz`:return this.rotateY(e.y).rotateX(e.x).rotateZ(e.z);case`zxy`:return this.rotateZ(e.z).rotateX(e.x).rotateY(e.y);case`zyx`:return this.rotateZ(e.z).rotateY(e.y).rotateX(e.x);case`yzx`:return this.rotateY(e.y).rotateZ(e.z).rotateX(e.x);case`xzy`:return this.rotateX(e.x).rotateZ(e.z).rotateY(e.y);default:throw Error(`Unknown Euler angle order`)}}fromAxisRotation(e,t){return ja(this,e,t),this.check()}rotateTowards(e,t){return Ya(this,this,e,t)}identity(){return Aa(this),this.check()}setAxisAngle(e,t){return this.fromAxisRotation(e,t)}get ELEMENTS(){return 4}get x(){return this[0]}set x(e){this[0]=I(e)}get y(){return this[1]}set y(e){this[1]=I(e)}get z(){return this[2]}set z(e){this[2]=I(e)}get w(){return this[3]}set w(e){this[3]=I(e)}len(){return Ga(this)}lengthSquared(){return Ka(this)}dot(e){return Ua(this,e)}rotationTo(e,t){return Ja(this,e,t),this.check()}add(e){return Va(this,this,e),this.check()}calculateW(){return Ia(this,this),this.check()}conjugate(){return za(this,this),this.check()}invert(){return Ra(this,this),this.check()}lerp(e,t,n){return n===void 0?this.lerp(this,e,t):(Wa(this,e,t,n),this.check())}multiplyRight(e){return Ma(this,this,e),this.check()}multiplyLeft(e){return Ma(this,e,this),this.check()}normalize(){let e=this.len(),t=e>0?1/e:0;return this[0]*=t,this[1]*=t,this[2]*=t,this[3]*=t,e===0&&(this[3]=1),this.check()}rotateX(e){return Na(this,this,e),this.check()}rotateY(e){return Pa(this,this,e),this.check()}rotateZ(e){return Fa(this,this,e),this.check()}scale(e){return Ha(this,this,e),this.check()}slerp(e,t,n){let r,i,a;switch(arguments.length){case 2:r=this,i=e,a=t;break;default:r=e,i=t,a=n}return La(this,r,i,a),this.check()}lengthSq(){return this.lengthSquared()}setFromAxisAngle(e,t){return this.setAxisAngle(e,t)}premultiply(e){return this.multiplyLeft(e)}multiply(e){return this.multiplyRight(e)}};function Za(e,t=!0){return e??t}function Qa(e=[0,0,0],t=!0){if(eo(e)&&e.length===3)return e;let n=$a(e,t)?255:1;return[e[0]/n,e[1]/n,e[2]/n]}function $a(e,t){return Array.isArray(e)?t:`BYTES_PER_ELEMENT`in e&&e.BYTES_PER_ELEMENT===1}function eo(e){let t=Object.prototype.toString.call(e);return ArrayBuffer.isView(e)&&(t===`[object Float16Array]`||t===`[object Float32Array]`||t===`[object Float64Array]`)}var to={props:{},uniforms:{},bindings:{},name:`skin`,bindingLayout:[{name:`skin`,group:0},{name:`skinJointMatrices`,group:0,visibility:1}],dependencies:[],source:`
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

`,fs:``,defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:n,skinJointMatrices:r,scenegraphsFromGLTF:i,skinIndex:a=0,meshWorldMatrix:o}=e,s=r?{skinJointMatrices:r}:{};if(n)return{jointMatrix:no(n),...s};let c=i?.gltf?.skins?.[a];if(!c)return{jointMatrix:[],...s};let{inverseBindMatrices:l,joints:u,skeleton:d}=c,f=i.gltfNodeIndexToNodeMap,p=new Map,m=d===void 0?void 0:f?.get(d),h=m?[m]:i.scenes||[];for(let e of h)e.preorderTraversal((e,{worldMatrix:t})=>{p.set(e.id,t)});let g=o?new L(o).invert():null,_=new Float32Array(1024),v=l?.value;for(let e=0;e<Math.min(u.length,64);e++){let t=f?.get(u[e]);if(!t)continue;let n=p.get(t.id)||t.matrix,r=g?new L(g).multiplyRight(n):new L(n);v&&v.length>=(e+1)*16&&r.multiplyRight(new L(Array.from(v.slice(e*16,(e+1)*16)))),_.set(r,e*16)}return{jointMatrix:_,...s}},uniformTypes:{jointMatrix:[`mat4x4<f32>`,64]}};function no(e){let t=new Float32Array(1024);return t.set(e instanceof Float32Array?e.subarray(0,t.length):e.slice(0,t.length)),t}function ro(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}var io={color:`vec3<f32>`,position:`vec3<f32>`,halfAxisX:`vec3<f32>`,halfAxisY:`vec3<f32>`,normal:`vec3<f32>`,disk:`i32`};function ao(e,t=!1){return Array.from({length:4},(n,r)=>{let i=e[r];if(!i)return ro();let a=Qa(i.color||(t?[255,255,255]:[1,1,1]),t);return{position:i.position,halfAxisX:i.halfAxisX,halfAxisY:i.halfAxisY,normal:i.normal,disk:+(i.type===`disk`),color:a.map(e=>e*(i.intensity??1e3))}})}var oo=`precision highp int;

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
`,so=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,co=5,lo={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},co],areaLightCount:`i32`,areaLights:[io,4]},defaultUniforms:ho(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:so,vs:oo,fs:oo,getUniforms:uo};function uo(e,t={}){e&&={...e};let n=(e?.lights||[]).filter(e=>e.type===`rect`||e.type===`disk`);if(!e)return ho();e.lights&&(e={...e,...po(e.lights),lights:void 0});let{useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s}=e||{};if(!(i||a&&a.length>0||o&&o.length>0||s&&s.length>0)&&n.length===0)return{...ho(),enabled:0};let c={...ho(),...fo({useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s})};return c.areaLightCount=Math.min(n.length,4),c.areaLights=ao(n,Za(e.useByteColors,!0)),e.enabled!==void 0&&(c.enabled=+!!e.enabled),c}function fo({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=go(),o=0,s=0,c=0,l=0;for(let t of n){if(o>=co)break;a[o]={...a[o],color:mo(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},o++,s++}for(let t of r){if(o>=co)break;a[o]={...a[o],color:mo(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:vo(t)},o++,c++}for(let t of i){if(o>=co)break;a[o]={...a[o],color:mo(t,e),direction:t.direction},o++,l++}return n.length+r.length+i.length>co&&console.warn(`MAX_LIGHTS exceeded, truncating to ${co}`),{ambientColor:mo(t,e),directionalLightCount:l,pointLightCount:s,spotLightCount:c,lights:a}}function po(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function mo(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return Qa(n,Za(t,!0)).map(e=>e*r)}function ho(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:go(),areaLightCount:0,areaLights:ao([])}}function go(){return Array.from({length:co},()=>_o())}function _o(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function vo(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var yo=`#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,bo=`#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`,xo={name:`ibl`,firstBindingSlot:32,bindingLayout:[{name:`pbr_diffuseEnvSampler`,group:2},{name:`pbr_specularEnvSampler`,group:2},{name:`pbr_brdfLUT`,group:2}],source:yo,vs:bo,fs:bo},So=`
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
`,Co=`
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
`,wo=`
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
`,To={name:`areaLighting`,props:{},uniforms:{},dependencies:[lo],defaultUniforms:{lightCount:0,sampleCount:64,lights:Array.from({length:4},ro)},uniformTypes:{lightCount:`i32`,sampleCount:`i32`,lights:[io,4]},bindingLayout:[{name:`areaLighting`,group:2},{name:`areaLTCMatrix`,group:2},{name:`areaLTCAmplitude`,group:2}],source:`
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
`+Co,vs:wo+So,fs:wo+So,getUniforms(e={}){let t=e.lights||[];return{lightCount:Math.min(t.length,4),sampleCount:e.sampleCount||64,lights:ao(t,e.useByteColors)}}},Eo=`out vec3 pbr_vPosition;
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
`,Do=`precision highp float;

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
`,Oo=`#ifdef DOUBLE_SIDED
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
`,ko=`layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,Ao={name:`pbrProjection`,bindingLayout:[{name:`pbrProjection`,group:0}],source:`struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,vs:ko,fs:ko,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:`mat4x4<f32>`,modelMatrix:`mat4x4<f32>`,normalMatrix:`mat4x4<f32>`,camera:`vec3<f32>`}},jo={NONE:0,REINHARD:1,KHRONOS_PBR_NEUTRAL:2,ACES:3},Mo=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],No=`layout(std140) uniform pbrSceneUniforms {
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
`,Po={name:`pbrScene`,bindingLayout:[{name:`pbrScene`,group:1},{name:`pbr_transmissionFramebufferSampler`,group:1}],source:`struct pbrSceneUniforms {
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
`,vs:No,fs:No,getUniforms:e=>e,uniformTypes:{exposure:`f32`,toneMapMode:`i32`,environmentIntensity:`f32`,environmentRotation:`f32`,environmentMipCount:`f32`,outputEncoding:`i32`,framebufferSize:`vec2<f32>`,viewMatrix:`mat4x4<f32>`,projectionMatrix:`mat4x4<f32>`},defaultUniforms:{exposure:1,toneMapMode:jo.KHRONOS_PBR_NEUTRAL,environmentIntensity:1,environmentRotation:Math.PI*.5,environmentMipCount:1,outputEncoding:1,framebufferSize:[1,1],viewMatrix:Mo,projectionMatrix:Mo}},Fo={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,lightmapMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,lightmapIntensity:1,scatterStrengthFactor:0,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,lightmapUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],lightmapUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:`pbrMaterial`,firstBindingSlot:0,bindingLayout:[{name:`pbrMaterial`,group:3},{name:`pbr_baseColorSampler`,group:3},{name:`pbr_normalSampler`,group:3},{name:`pbr_emissiveSampler`,group:3},{name:`pbr_lightmapSampler`,group:3},{name:`pbr_metallicRoughnessSampler`,group:3},{name:`pbr_occlusionSampler`,group:3},{name:`pbr_specularColorSampler`,group:3},{name:`pbr_specularIntensitySampler`,group:3},{name:`pbr_transmissionSampler`,group:3},{name:`pbr_thicknessSampler`,group:3},{name:`pbr_clearcoatSampler`,group:3},{name:`pbr_clearcoatRoughnessSampler`,group:3},{name:`pbr_clearcoatNormalSampler`,group:3},{name:`pbr_sheenColorSampler`,group:3},{name:`pbr_sheenRoughnessSampler`,group:3},{name:`pbr_iridescenceSampler`,group:3},{name:`pbr_iridescenceThicknessSampler`,group:3},{name:`pbr_anisotropySampler`,group:3},{name:`pbr_bumpSampler`,group:3},{name:`pbr_diffuseTransmissionSampler`,group:3},{name:`pbr_diffuseTransmissionColorSampler`,group:3},{name:`pbr_multiscatterColorSampler`,group:3}],dependencies:[lo,To,xo,Ao,Po],source:Oo,vs:Eo,fs:Do,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_LIGHTMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:`i32`,baseColorMapEnabled:`i32`,baseColorFactor:`vec4<f32>`,normalMapEnabled:`i32`,normalScale:`f32`,emissiveMapEnabled:`i32`,emissiveFactor:`vec3<f32>`,metallicRoughnessValues:`vec2<f32>`,metallicRoughnessMapEnabled:`i32`,occlusionMapEnabled:`i32`,occlusionStrength:`f32`,alphaCutoffEnabled:`i32`,alphaCutoff:`f32`,specularColorFactor:`vec3<f32>`,specularIntensityFactor:`f32`,specularColorMapEnabled:`i32`,specularIntensityMapEnabled:`i32`,ior:`f32`,transmissionFactor:`f32`,transmissionMapEnabled:`i32`,thicknessFactor:`f32`,attenuationDistance:`f32`,attenuationColor:`vec3<f32>`,clearcoatFactor:`f32`,clearcoatRoughnessFactor:`f32`,clearcoatMapEnabled:`i32`,clearcoatRoughnessMapEnabled:`i32`,sheenColorFactor:`vec3<f32>`,sheenRoughnessFactor:`f32`,sheenColorMapEnabled:`i32`,sheenRoughnessMapEnabled:`i32`,iridescenceFactor:`f32`,iridescenceIor:`f32`,iridescenceThicknessRange:`vec2<f32>`,iridescenceMapEnabled:`i32`,anisotropyStrength:`f32`,anisotropyRotation:`f32`,anisotropyDirection:`vec2<f32>`,anisotropyMapEnabled:`i32`,emissiveStrength:`f32`,dispersion:`f32`,IBLenabled:`i32`,scaleIBLAmbient:`vec2<f32>`,scaleDiffBaseMR:`vec4<f32>`,scaleFGDSpec:`vec4<f32>`,baseColorUVSet:`i32`,baseColorUVTransform:`mat3x3<f32>`,metallicRoughnessUVSet:`i32`,metallicRoughnessUVTransform:`mat3x3<f32>`,normalUVSet:`i32`,normalUVTransform:`mat3x3<f32>`,occlusionUVSet:`i32`,occlusionUVTransform:`mat3x3<f32>`,emissiveUVSet:`i32`,emissiveUVTransform:`mat3x3<f32>`,specularColorUVSet:`i32`,specularColorUVTransform:`mat3x3<f32>`,specularIntensityUVSet:`i32`,specularIntensityUVTransform:`mat3x3<f32>`,transmissionUVSet:`i32`,transmissionUVTransform:`mat3x3<f32>`,thicknessUVSet:`i32`,thicknessUVTransform:`mat3x3<f32>`,clearcoatUVSet:`i32`,clearcoatUVTransform:`mat3x3<f32>`,clearcoatRoughnessUVSet:`i32`,clearcoatRoughnessUVTransform:`mat3x3<f32>`,clearcoatNormalUVSet:`i32`,clearcoatNormalUVTransform:`mat3x3<f32>`,sheenColorUVSet:`i32`,sheenColorUVTransform:`mat3x3<f32>`,sheenRoughnessUVSet:`i32`,sheenRoughnessUVTransform:`mat3x3<f32>`,iridescenceUVSet:`i32`,iridescenceUVTransform:`mat3x3<f32>`,iridescenceThicknessUVSet:`i32`,iridescenceThicknessUVTransform:`mat3x3<f32>`,anisotropyUVSet:`i32`,anisotropyUVTransform:`mat3x3<f32>`,bumpFactor:`f32`,bumpMapEnabled:`i32`,diffuseTransmissionFactor:`f32`,diffuseTransmissionMapEnabled:`i32`,diffuseTransmissionColorFactor:`vec3<f32>`,diffuseTransmissionColorMapEnabled:`i32`,multiscatterColorFactor:`vec3<f32>`,multiscatterColorMapEnabled:`i32`,scatterAnisotropy:`f32`,bumpUVSet:`i32`,bumpUVTransform:`mat3x3<f32>`,diffuseTransmissionUVSet:`i32`,diffuseTransmissionUVTransform:`mat3x3<f32>`,diffuseTransmissionColorUVSet:`i32`,diffuseTransmissionColorUVTransform:`mat3x3<f32>`,multiscatterColorUVSet:`i32`,multiscatterColorUVTransform:`mat3x3<f32>`,lightmapMapEnabled:`i32`,lightmapIntensity:`f32`,lightmapUVSet:`i32`,lightmapUVTransform:`mat3x3<f32>`,scatterStrengthFactor:`f32`}},Io=`
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
  vec4 directionalCascadeSplits[4];
  mat4 directionalViewProjectionMatrices[16];
  mat4 spotViewProjectionMatrices[4];
  mat4 pointViewProjectionMatrices[24];
  DirectionalShadowLightUniform directionalLights[4];
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
int shadow_directionalCascadeIndex(int lightIndex, float viewDepth) {
  int cascadeIndex = 0;
  for (int index = 0; index < 4; index++) {
    if (index >= shadow.cascadeCount) break;
    cascadeIndex = index;
    if (viewDepth <= shadow.directionalCascadeSplits[lightIndex][index]) break;
  }
  return cascadeIndex;
}
int shadow_getDirectionalCascadeIndex(float viewDepth) {
  return shadow.directionalLightCount == 0 ? -1 : shadow_directionalCascadeIndex(0, viewDepth);
}
float shadow_directionalPCSS(int lightIndex, int cascadeIndex, vec3 worldPosition, float viewDepth) {
  DirectionalShadowLightUniform light = shadow.directionalLights[lightIndex];
  int layerIndex = lightIndex * shadow.cascadeCount + cascadeIndex;
  return shadow_arrayPCSS(directionalShadowTexture, layerIndex,
    shadow_project(shadow.directionalViewProjectionMatrices[layerIndex], worldPosition),
    light.sourceAngularRadius * viewDepth / max(light.shadowDistance, 0.001),
    shadow_hash(worldPosition) * 2.0 * SHADOW_PI, 18.0);
}
float shadow_getDirectionalLightFactor(int lightIndex, vec3 worldPosition, vec3 worldNormal, float viewDepth) {
  if (lightIndex < 0 || lightIndex >= shadow.directionalLightCount || viewDepth <= 0.0) return 1.0;
  DirectionalShadowLightUniform light = shadow.directionalLights[lightIndex];
  if (viewDepth >= light.shadowDistance) return 1.0;
  vec3 position = worldPosition + normalize(worldNormal) * light.normalBias;
  int cascadeIndex = shadow_directionalCascadeIndex(lightIndex, viewDepth);
  float visibility = shadow_directionalPCSS(lightIndex, cascadeIndex, position, viewDepth);
  if (cascadeIndex + 1 < shadow.cascadeCount) {
    float cascadeStart = cascadeIndex > 0 ? shadow.directionalCascadeSplits[lightIndex][cascadeIndex - 1] : 0.0;
    float cascadeEnd = shadow.directionalCascadeSplits[lightIndex][cascadeIndex];
    float blendWidth = max((cascadeEnd - cascadeStart) * light.cascadeBlendFraction, 0.0001);
    float blend = smoothstep(cascadeEnd - blendWidth, cascadeEnd, viewDepth);
    if (blend > 0.0) visibility = mix(visibility, shadow_directionalPCSS(lightIndex, cascadeIndex + 1, position, viewDepth), blend);
  }
  float fadeWidth = max(light.shadowDistance * light.farFadeFraction, 0.0001);
  visibility = mix(visibility, 1.0, smoothstep(light.shadowDistance - fadeWidth, light.shadowDistance, viewDepth));
  return mix(1.0, visibility, light.strength);
}
// Preserve the first-light helper used by existing shader consumers.
float shadow_getDirectionalFactor(vec3 worldPosition, vec3 worldNormal, float viewDepth) {
  return shadow_getDirectionalLightFactor(0, worldPosition, worldNormal, viewDepth);
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
`,Lo=4,Ro=4,zo=4,Bo=4,Vo={name:`shadow`,source:`const SHADOW_PI: f32 = 3.141592653589793;

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
  directionalCascadeSplits: array<vec4f, 4>,
  directionalViewProjectionMatrices: array<mat4x4f, 16>,
  spotViewProjectionMatrices: array<mat4x4f, 4>,
  pointViewProjectionMatrices: array<mat4x4f, 24>,
  directionalLights: array<DirectionalShadowLightUniform, 4>,
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

fn shadow_directionalCascadeIndex(lightIndex: i32, viewDepth: f32) -> i32 {
  var cascadeIndex = 0;
  for (var index: i32 = 0; index < 4; index++) {
    if (index >= shadow.cascadeCount) { break; }
    cascadeIndex = index;
    if (viewDepth <= shadow.directionalCascadeSplits[lightIndex][index]) { break; }
  }
  return cascadeIndex;
}

fn shadow_getDirectionalCascadeIndex(viewDepth: f32) -> i32 {
  if (shadow.directionalLightCount == 0) { return -1; }
  return shadow_directionalCascadeIndex(0, viewDepth);
}

fn shadow_directionalPCSS(lightIndex: i32, cascadeIndex: i32, worldPosition: vec3f, viewDepth: f32) -> f32 {
  let layerIndex = lightIndex * shadow.cascadeCount + cascadeIndex;
  let projected = shadow_project(shadow.directionalViewProjectionMatrices[layerIndex], worldPosition);
  if (!shadow_validProjection(projected)) { return 1.0; }
  let dimensions = vec2f(textureDimensions(directionalShadowTexture));
  let texel = 1.0 / dimensions;
  let light = shadow.directionalLights[lightIndex];
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
      layerIndex,
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
      layerIndex,
      projected.z
    );
  }
  return visibility / max(f32(shadow.filterSampleCount), 1.0);
}

fn shadow_getDirectionalLightFactor(lightIndex: i32, worldPosition: vec3f, worldNormal: vec3f, viewDepth: f32) -> f32 {
  if (lightIndex < 0 || lightIndex >= shadow.directionalLightCount || viewDepth <= 0.0) { return 1.0; }
  let light = shadow.directionalLights[lightIndex];
  if (viewDepth >= light.shadowDistance) { return 1.0; }
  let biasedPosition = worldPosition + normalize(worldNormal) * light.normalBias;
  let cascadeIndex = shadow_directionalCascadeIndex(lightIndex, viewDepth);
  var visibility = shadow_directionalPCSS(lightIndex, cascadeIndex, biasedPosition, viewDepth);
  if (cascadeIndex + 1 < shadow.cascadeCount) {
    var cascadeStart = 0.0;
    if (cascadeIndex > 0) { cascadeStart = shadow.directionalCascadeSplits[lightIndex][cascadeIndex - 1]; }
    let cascadeEnd = shadow.directionalCascadeSplits[lightIndex][cascadeIndex];
    let blendWidth = max((cascadeEnd - cascadeStart) * light.cascadeBlendFraction, 0.0001);
    let blend = smoothstep(cascadeEnd - blendWidth, cascadeEnd, viewDepth);
    if (blend > 0.0) {
      visibility = mix(
        visibility,
        shadow_directionalPCSS(lightIndex, cascadeIndex + 1, biasedPosition, viewDepth),
        blend
      );
    }
  }
  let fadeWidth = max(light.shadowDistance * light.farFadeFraction, 0.0001);
  let farFade = smoothstep(light.shadowDistance - fadeWidth, light.shadowDistance, viewDepth);
  visibility = mix(visibility, 1.0, farFade);
  return mix(1.0, visibility, light.strength);
}

// Preserve the first-light helper used by existing shader consumers.
fn shadow_getDirectionalFactor(worldPosition: vec3f, worldNormal: vec3f, viewDepth: f32) -> f32 {
  return shadow_getDirectionalLightFactor(0, worldPosition, worldNormal, viewDepth);
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
`,fs:Io,props:{},uniforms:{},bindings:{},uniformTypes:{directionalLightCount:`i32`,spotLightCount:`i32`,pointLightCount:`i32`,cascadeCount:`i32`,blockerSampleCount:`i32`,filterSampleCount:`i32`,directionalCascadeSplits:[`vec4<f32>`,Ro],directionalViewProjectionMatrices:[`mat4x4<f32>`,Ro*Lo],spotViewProjectionMatrices:[`mat4x4<f32>`,zo],pointViewProjectionMatrices:[`mat4x4<f32>`,24],directionalLights:[{direction:`vec3<f32>`,strength:`f32`,normalBias:`f32`,sourceAngularRadius:`f32`,cascadeBlendFraction:`f32`,farFadeFraction:`f32`,shadowDistance:`f32`},Ro],spotLights:[{position:`vec3<f32>`,range:`f32`,direction:`vec3<f32>`,outerConeCos:`f32`,sourceRadius:`f32`,normalBias:`f32`,strength:`f32`,nearPlane:`f32`},zo],pointLights:[{position:`vec3<f32>`,range:`f32`,sourceRadius:`f32`,normalBias:`f32`,strength:`f32`,nearPlane:`f32`},Bo]},bindingLayout:[{name:`shadow`,group:2},{name:`directionalShadowTexture`,group:2},{name:`spotShadowTexture`,group:2},{name:`pointShadowTexture`,group:2},{name:`shadowComparisonSampler`,group:2}],getUniforms(e){return!e.directionalLights||!e.spotLights||!e.pointLights||!e.cascadeSplits||!e.directionalViewProjectionMatrices||!e.spotViewProjectionMatrices||!e.pointViewProjectionMatrices||!e.directionalShadowTexture||!e.spotShadowTexture||!e.pointShadowTexture||!e.nonFilteringSampler||!e.comparisonSampler?{}:{directionalLightCount:e.directionalLights.length,spotLightCount:e.spotLights.length,pointLightCount:e.pointLights.length,cascadeCount:e.cascadeCount,blockerSampleCount:e.blockerSampleCount,filterSampleCount:e.filterSampleCount,directionalCascadeSplits:Go(e.directionalCascadeSplits??[e.cascadeSplits],Ro,[0,0,0,0]),directionalViewProjectionMatrices:e.directionalViewProjectionMatrices,spotViewProjectionMatrices:e.spotViewProjectionMatrices,pointViewProjectionMatrices:e.pointViewProjectionMatrices,directionalLights:Ho(e.directionalLights),spotLights:Uo(e.spotLights),pointLights:Wo(e.pointLights),directionalShadowTexture:e.directionalShadowTexture,spotShadowTexture:e.spotShadowTexture,pointShadowTexture:e.pointShadowTexture,...e.directionalShadowTexture.device.type===`webgpu`?{shadowComparisonSampler:e.comparisonSampler}:{}}}};function Ho(e){return Go(e.map(e=>({direction:e.direction,strength:e.strength??1,normalBias:e.normalBias??.04,sourceAngularRadius:e.sourceAngularRadius??.00465,cascadeBlendFraction:e.cascadeBlendFraction??.1,farFadeFraction:e.farFadeFraction??.1,shadowDistance:e.shadowDistance??1})),Ro,{direction:[0,1,0],strength:0,normalBias:0,sourceAngularRadius:0,cascadeBlendFraction:0,farFadeFraction:0,shadowDistance:1})}function Uo(e){return Go(e.map(e=>({position:e.position,range:e.range,direction:e.direction,outerConeCos:Math.cos(e.outerConeAngle),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,strength:e.strength??1,nearPlane:e.nearPlane??.1})),zo,{position:[0,0,0],range:1,direction:[0,-1,0],outerConeCos:1,sourceRadius:0,normalBias:0,strength:0,nearPlane:.1})}function Wo(e){return Go(e.map(e=>({position:e.position,range:e.range,sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,strength:e.strength??1,nearPlane:e.nearPlane??.1})),Bo,{position:[0,0,0],range:1,sourceRadius:0,normalBias:0,strength:0,nearPlane:.1})}function Go(e,t,n){let r=e.slice(0,t);for(;r.length<t;)r.push(n);return r}var Ko={name:`pbrShadow`,dependencies:[Fo,Vo],bindingLayout:[{name:`pbrShadow`,group:0}],uniformTypes:{viewMatrix:`mat4x4<f32>`,enabled:`i32`},defaultUniforms:{viewMatrix:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],enabled:1},getUniforms(e={}){return{...e.viewMatrix?{viewMatrix:e.viewMatrix}:{},...e.enabled===void 0?{}:{enabled:Number(e.enabled)}}},source:`
struct PBRShadowUniforms {
  viewMatrix: mat4x4f,
  enabled: i32,
};
@group(0) @binding(auto) var<uniform> pbrShadow: PBRShadowUniforms;
fn pbrShadow_filterColorWithDirectionalContact(vertexColor: vec4f, worldPosition: vec3f, worldNormal: vec3f, contactVisibility: f32) -> vec4f {
  var directionalVisibility = 1.0;
  var pointVisibility = vec4f(1.0);
  var spotVisibility = vec4f(1.0);
  if (pbrShadow.enabled != 0) {
    let normal = normalize(worldNormal);
    let viewDepth = -(pbrShadow.viewMatrix * vec4f(worldPosition, 1.0)).z;
    directionalVisibility = shadow_getDirectionalFactor(worldPosition, normal, viewDepth);
    for (var index = 0; index < 4; index++) {
      pointVisibility[index] = shadow_getPointFactor(index, worldPosition, normal);
      spotVisibility[index] = shadow_getSpotFactor(index, worldPosition, normal);
    }
  }
  return pbr_filterColorWithShadows(vertexColor, min(directionalVisibility, contactVisibility), pointVisibility, spotVisibility);
}
fn pbrShadow_filterColor(vertexColor: vec4f, worldPosition: vec3f, worldNormal: vec3f) -> vec4f {
  return pbrShadow_filterColorWithDirectionalContact(vertexColor, worldPosition, worldNormal, 1.0);
}`,fs:`
layout(std140) uniform pbrShadowUniforms {
  mat4 viewMatrix;
  int enabled;
} pbrShadow;
vec4 pbrShadow_filterColorWithDirectionalContact(vec4 vertexColor, vec3 worldPosition, vec3 worldNormal, float contactVisibility) {
  float directionalVisibility = 1.0;
  vec4 pointVisibility = vec4(1.0);
  vec4 spotVisibility = vec4(1.0);
  if (pbrShadow.enabled != 0) {
    vec3 normal = normalize(worldNormal);
    float viewDepth = -(pbrShadow.viewMatrix * vec4(worldPosition, 1.0)).z;
    directionalVisibility = shadow_getDirectionalFactor(worldPosition, normal, viewDepth);
    for (int index = 0; index < 4; index++) {
      pointVisibility[index] = shadow_getPointFactor(index, worldPosition, normal);
      spotVisibility[index] = shadow_getSpotFactor(index, worldPosition, normal);
    }
  }
  return pbr_filterColorWithShadows(vertexColor, min(directionalVisibility, contactVisibility), pointVisibility, spotVisibility);
 }
vec4 pbrShadow_filterColor(vec4 vertexColor, vec3 worldPosition, vec3 worldNormal) {
  return pbrShadow_filterColorWithDirectionalContact(vertexColor, worldPosition, worldNormal, 1.0);
}`},qo={name:`pbrSurface`,dependencies:[Fo],bindingLayout:[{name:`pbrSurface`,group:0}],uniformTypes:{viewMatrix:`mat4x4<f32>`,useMaterialNormals:`i32`},defaultUniforms:{viewMatrix:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],useMaterialNormals:0},getUniforms(e={}){return{...e.viewMatrix?{viewMatrix:e.viewMatrix}:{},...e.useMaterialNormals===void 0?{}:{useMaterialNormals:Number(e.useMaterialNormals)}}},source:`
struct PBRSurfaceUniforms {
  viewMatrix: mat4x4f,
  useMaterialNormals: i32,
};
@group(0) @binding(auto) var<uniform> pbrSurface: PBRSurfaceUniforms;
fn pbrSurface_getColor() -> vec4f {
#ifdef HAS_NORMALS
  var normal = normalize(fragmentInputs.pbr_vNormal);
#ifdef DOUBLE_SIDED
  if (!pbr_frontFacing) {normal = -normal;}
#endif
#else
  var normal = normalize(cross(dpdy(fragmentInputs.pbr_vPosition), dpdx(fragmentInputs.pbr_vPosition)));
#endif
#ifdef HAS_NORMALMAP
  if (pbrSurface.useMaterialNormals != 0) {
    let coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#else
#ifdef HAS_BUMPMAP
  if (pbrSurface.useMaterialNormals != 0) {
    let coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#endif
#endif
  let viewNormal = normalize((pbrSurface.viewMatrix * vec4f(normal, 0.0)).xyz);
  return vec4f(viewNormal * 0.5 + vec3f(0.5), 1.0);
}`,fs:`
layout(std140) uniform pbrSurfaceUniforms {
  mat4 viewMatrix;
  int useMaterialNormals;
} pbrSurface;
vec4 pbrSurface_getColor() {
#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 normal = normalize(pbr_vTBN[2]);
#else
  vec3 normal = normalize(pbr_vNormal);
#endif
#ifdef DOUBLE_SIDED
  if (!gl_FrontFacing) normal = -normal;
#endif
#else
  vec3 normal = normalize(cross(dFdx(pbr_vPosition), dFdy(pbr_vPosition)));
#endif
#ifdef HAS_NORMALMAP
  if (pbrSurface.useMaterialNormals != 0) {
    vec2 coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#else
#ifdef HAS_BUMPMAP
  if (pbrSurface.useMaterialNormals != 0) {
    vec2 coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#endif
#endif
  vec3 viewNormal = normalize((pbrSurface.viewMatrix * vec4(normal, 0.0)).xyz);
  return vec4(viewNormal * 0.5 + 0.5, 1.0);
}`},Jo={name:`pbrContactShadow`,dependencies:[Fo],bindingLayout:[{name:`pbrContactShadow`,group:0},{name:`contactShadowTexture`,group:2}],uniformTypes:{viewport:`vec4<f32>`,strength:`f32`,enabled:`i32`},defaultUniforms:{viewport:[0,0,1,1],strength:1,enabled:1},getUniforms(e={}){return{...e.viewport?{viewport:e.viewport}:{},...e.strength===void 0?{}:{strength:e.strength},...e.enabled===void 0?{}:{enabled:Number(e.enabled)},...e.contactShadowTexture?{contactShadowTexture:e.contactShadowTexture}:{}}},source:`
struct PBRContactShadowUniforms {
  viewport: vec4f,
  strength: f32,
  enabled: i32,
};
@group(0) @binding(auto) var<uniform> pbrContactShadow: PBRContactShadowUniforms;
@group(2) @binding(auto) var contactShadowTexture: texture_2d<f32>;
@group(2) @binding(auto) var contactShadowTextureSampler: sampler;
fn pbrContactShadow_getFactor(pixelPosition:vec2f)->f32 {
  if(pbrContactShadow.enabled==0){return 1.0;}
  let coordinates=(pixelPosition-pbrContactShadow.viewport.xy)/pbrContactShadow.viewport.zw;
  if(any(coordinates<vec2f(0.0))||any(coordinates>vec2f(1.0))){return 1.0;}
  let visibility=textureSampleLevel(contactShadowTexture,contactShadowTextureSampler,coordinates,0.0).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrContactShadow.strength,0.0,1.0));
}
fn pbrContactShadow_filterColor(vertexColor:vec4f,pixelPosition:vec2f)->vec4f {
  return pbr_filterColorWithShadows(vertexColor,pbrContactShadow_getFactor(pixelPosition),vec4f(1.0),vec4f(1.0));
}`,fs:`
layout(std140) uniform pbrContactShadowUniforms {
  vec4 viewport;
  float strength;
  int enabled;
} pbrContactShadow;
uniform sampler2D contactShadowTexture;
float pbrContactShadow_getFactor(vec2 pixelPosition) {
  if(pbrContactShadow.enabled==0)return 1.0;
  vec2 coordinates=(pixelPosition-pbrContactShadow.viewport.xy)/pbrContactShadow.viewport.zw;
  if(any(lessThan(coordinates,vec2(0.0)))||any(greaterThan(coordinates,vec2(1.0))))return 1.0;
  float visibility=texture(contactShadowTexture,coordinates).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrContactShadow.strength,0.0,1.0));
}
vec4 pbrContactShadow_filterColor(vec4 vertexColor,vec2 pixelPosition) {
  return pbr_filterColorWithShadows(vertexColor,pbrContactShadow_getFactor(pixelPosition),vec4(1.0),vec4(1.0));
}`},Yo={name:`pbrAmbientOcclusion`,dependencies:[Fo],bindingLayout:[{name:`pbrAmbientOcclusion`,group:0},{name:`ambientOcclusionTexture`,group:2}],uniformTypes:{viewport:`vec4<f32>`,strength:`f32`,enabled:`i32`},defaultUniforms:{viewport:[0,0,1,1],strength:1,enabled:1},getUniforms(e={}){return{...e.viewport?{viewport:e.viewport}:{},...e.strength===void 0?{}:{strength:e.strength},...e.enabled===void 0?{}:{enabled:Number(e.enabled)},...e.ambientOcclusionTexture?{ambientOcclusionTexture:e.ambientOcclusionTexture}:{}}},source:`
struct PBRAmbientOcclusionUniforms {
  viewport: vec4f,
  strength: f32,
  enabled: i32,
};
@group(0) @binding(auto) var<uniform> pbrAmbientOcclusion: PBRAmbientOcclusionUniforms;
@group(2) @binding(auto) var ambientOcclusionTexture: texture_2d<f32>;
@group(2) @binding(auto) var ambientOcclusionTextureSampler: sampler;
fn pbrAmbientOcclusion_getFactor(pixelPosition:vec2f)->f32 {
  if(pbrAmbientOcclusion.enabled==0){return 1.0;}
  let coordinates=(pixelPosition-pbrAmbientOcclusion.viewport.xy)/pbrAmbientOcclusion.viewport.zw;
  if(any(coordinates<vec2f(0.0))||any(coordinates>vec2f(1.0))){return 1.0;}
  let visibility=textureSampleLevel(ambientOcclusionTexture,ambientOcclusionTextureSampler,coordinates,0.0).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrAmbientOcclusion.strength,0.0,1.0));
}
fn pbrAmbientOcclusion_setFactor(pixelPosition:vec2f) {
  pbr_ambientVisibility = pbrAmbientOcclusion_getFactor(pixelPosition);
}`,fs:`
layout(std140) uniform pbrAmbientOcclusionUniforms {
  vec4 viewport;
  float strength;
  int enabled;
} pbrAmbientOcclusion;
uniform sampler2D ambientOcclusionTexture;
float pbrAmbientOcclusion_getFactor(vec2 pixelPosition) {
  if(pbrAmbientOcclusion.enabled==0)return 1.0;
  vec2 coordinates=(pixelPosition-pbrAmbientOcclusion.viewport.xy)/pbrAmbientOcclusion.viewport.zw;
  if(any(lessThan(coordinates,vec2(0.0)))||any(greaterThan(coordinates,vec2(1.0))))return 1.0;
  float visibility=texture(ambientOcclusionTexture,coordinates).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrAmbientOcclusion.strength,0.0,1.0));
}
void pbrAmbientOcclusion_setFactor(vec2 pixelPosition) {
  pbr_ambientVisibility = pbrAmbientOcclusion_getFactor(pixelPosition);
}`};async function Xo(e,t){if(e.destroyed)throw Error(`Resource has been destroyed.`);if(e instanceof N){if(!(e.usage&N.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);let n=t.byteOffset??0,r=Math.min(256,t.byteLength??e.byteLength-n);if(n<0||r<0||n+r>e.byteLength)throw Error(`Preview range is outside the buffer.`);return{data:r?await e.readAsync(n,r):new Uint8Array,format:t.format}}let r=e.device.getTextureFormatInfo(e.format);if(r.packed)throw Error(`Packed texture previews are not supported.`);if(e.device.type!==`webgpu`)throw Error(`Texture previews require WebGPU.`);if(!((e.props.usage??0)&n.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);if(e.samples!==1||r.compressed||e.format.startsWith(`depth`)||e.format.startsWith(`stencil`))throw Error(`Preview requires a single-sample, uncompressed color texture.`);let i=t.baseMipLevel??0,a=Math.min(32,t.width??Math.max(1,e.width>>i)),o=Math.min(32,t.height??Math.max(1,e.height>>i)),s=e.computeMemoryLayout({width:a,height:o,depthOrArrayLayers:1}),c=e.device.createBuffer({byteLength:s.byteLength,usage:N.MAP_READ|N.COPY_DST}),l=e.device.createCommandEncoder();try{l.copyTextureToBuffer({sourceTexture:e,destinationBuffer:c,mipLevel:i,origin:[0,0,t.baseArrayLayer??0],width:a,height:o,depthOrArrayLayers:1,bytesPerRow:s.bytesPerRow}),e.device.submit(l.finish());let n=await c.readAsync(),u=a*r.bytesPerPixel,d=new Uint8Array(u*o);for(let e=0;e<o;e++)d.set(n.subarray(e*s.bytesPerRow,e*s.bytesPerRow+u),e*u);return{data:d,width:a,height:o,format:e.format}}finally{c.destroy(),l.destroy()}}var Zo=N.DEBUG_DATA_MAX_LENGTH,R=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:n=!1,buffer:r,ownsBuffer:i=!0,...a}=t;if(r&&r.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(r&&(a.byteLength!==void 0||a.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let o=t.id||r?.id||m(`dynamic-buffer`),s={...a,id:o,usage:a.usage??r?.usage,indexType:a.indexType??r?.indexType};(s.usage||0)&N.INDEX&&!s.indexType&&(a.data instanceof Uint32Array?s.indexType=`uint32`:a.data instanceof Uint16Array?s.indexType=`uint16`:a.data instanceof Uint8Array&&(s.indexType=`uint8`)),delete s.data,delete s.byteOffset,this.device=e,this.id=o,this.props=s,this.usage=s.usage||0,this._debugDataEnabled=!!n,this._maxDebugDataByteLength=typeof n==`object`&&n.maxByteLength!==void 0?n.maxByteLength:Zo,this._ownsBuffer=i,this._buffer=r??this.device.createBuffer({...a,id:o}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),a.data&&this._writeDebugData(a.data,a.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}};function Qo(e){return typeof e==`object`&&!!e&&`buffer`in e}function $o(e){return e instanceof R?e:Qo(e)&&e.buffer instanceof R?e.buffer:null}function es(e){return e instanceof R?e.buffer:e}function ts(e){return{buffer:es(e.buffer),offset:e.offset,size:e.size}}var ns={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function rs(e){return e?Array.isArray(e)?e[0]??null:e:null}function is(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=rs(n);if(!e)return null;let{width:t}=as(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=rs(n);return e?as(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=rs(n[0]);return e?as(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=rs(t);return r?as(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=rs(e[t]);return r?as(r):null}default:return null}}function as(e){if(E(e))return u(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function os(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function ss(e){return ArrayBuffer.isView(e)}function cs(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function ls(e){let t=ns[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function us(e,t){return 6*e+ls(t)}function ds(e){throw Error(`setTexture1DData not supported in WebGL.`)}function fs(e){return Array.isArray(e)?e:[e]}function ps(e,t,n,r){let i=fs(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(E(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(os(t))o.push({type:`texture-data`,data:t,textureFormat:cs(t),z:a,mipLevel:e});else if(ss(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function ms(e){let t=[];for(let n=0;n<e.length;n++)t.push(...ps(n,e[n]));return t}function hs(e){let t=[];for(let n=0;n<e.length;n++)t.push(...ps(n,e[n]));return t}function gs(e){let t=[];for(let[n,r]of Object.entries(e)){let e=ls(n);t.push(...ps(e,r))}return t}function _s(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=us(n,r);t.push(...ps(e,i))}}),t}var vs=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=m(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let r=t.data?ys({...t,width:e.width,height:e.height,format:e.format}):[],i=`format`in e&&e.format!==void 0,a=`usage`in e&&e.usage!==void 0,o=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:is(t)||{width:this.props.width||1,height:this.props.height||1};if(!o||o.width<=0||o.height<=0)throw Error(`${this} size could not be determined or was zero`);let c=bs(this.device,r,o,{format:i?e.format:void 0}),l=c.format??this.props.format,u={...this.props,...o,format:l,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(l)&&!a&&(u.usage=n.SAMPLE|n.COPY_DST);let d=this.props.mipmaps&&!c.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(l);if(this.device.type===`webgpu`&&d){let e=this.props.dimension===`3d`?n.SAMPLE|n.STORAGE|n.COPY_DST|n.COPY_SRC:n.SAMPLE|n.RENDER|n.COPY_DST|n.COPY_SRC;u.usage|=e}let f=this.device.getMipLevelCount(u.width,u.height),p=c.hasExplicitMipChain?c.mipLevels:this.props.mipLevels===`auto`?f:Math.max(1,Math.min(f,this.props.mipLevels??1)),m={...u,mipLevels:p};this._texture=this.device.createTexture(m),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),c.subresources.length&&this._setTextureSubresources(c.subresources),this.props.mipmaps&&!c.hasExplicitMipChain&&!d&&s.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),d&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),s.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):s.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let n=e instanceof t?e:this.device.createSampler(e);this.texture.setSampler(n),this._sampler=n,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:N.COPY_DST|N.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let o=this.device.createFence();return await o.signaled,o.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),s.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=ns[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=ds(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=ps(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=ms(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=hs(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=gs(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=_s(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await ws(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&s.warn(`${this} already destroyed`)}_checkReady(){this.isReady||s.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...n.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function ys(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return ds(e.data);case`2d`:return ps(0,e.data,t,n);case`3d`:return ms(e.data);case`2d-array`:return hs(e.data);case`cube`:return gs(e.data);case`cube-array`:return _s(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function bs(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=Ss(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=xs(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?Cs(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=Ss(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=xs(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function xs(e){if(e.type===`texture-data`)return e.textureFormat??cs(e.data)}function Ss(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function Cs(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function ws(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(ws));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(ws)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}function Ts(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function Es(e){return e?.type===`texture`||e?.type===`external-texture`}function Ds(e,t,n){let r=S(e,t,{ignoreWarnings:!0});return Es(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var Os=class{compare;values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function ks(e){let t=Gs(e.nodes),n=Xs(t,e.buffers.values()),r=Zs(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return js(e,t,o,i,a,n,r)}async function As(e){let t=Gs(e.nodes),n=Xs(t,e.buffers.values()),r=Zs(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=F.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));F.endAsyncCompilation(e.device,o);let[c,l]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),u=[],d=l.find(e=>e.status===`rejected`),f=d?.status===`rejected`?d.reason:void 0;for(let e of c)e.status===`fulfilled`?u.push(e.value):f??=e.reason;if(f){for(let e of u)e.executable.destroy?.();throw f}return js(e,t,u,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function js(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=rc(c.map(e=>e.byteLength),`imported buffer capacities`),d=rc(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=nc(u,d,`logical buffer capacities`),p=rc(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=rc(g.map(tc),`imported texture estimates`),y=rc(_.map(tc),`logical transient texture estimates`),b=nc(v,y,`logical texture estimates`),x=rc(o.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:nc(f,b,`logical resource estimates`),physicalTransientResourceBytes:nc(p,x,`physical transient resource estimates`)},w=Ns(e.device,s,t,e.kernelMetadata);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:C,preflight:w}}function Ms(e){if(`buffer`in e){let t=e.buffer,n=`buffer`in t?t:void 0;return Object.freeze({id:n?n.buffer.id:t.id,kind:`buffer`,usage:e.usage,byteOffset:n?.byteOffset??0,byteLength:n?n.length===0?0:(n.length-1)*n.byteStride+n.rowByteLength:t.byteLength,...n?{format:n.format,length:n.length}:{}})}let t=`texture`in e?e.texture:e.externalTexture;return Object.freeze({id:`texture`in t?t.texture.id:t.id,kind:`externalTexture`in e?`external-texture`:`texture`,usage:e.usage,width:t.width,height:t.height,...`texture`in t?{baseMipLevel:t.baseMipLevel,baseArrayLayer:t.baseArrayLayer,mipLevelCount:t.mipLevelCount,arrayLayerCount:t.arrayLayerCount,aspect:t.aspect}:{},...`format`in t?{format:t.format,depth:t.depth}:{}})}function Ns(e,t,n,r){let i=n.map(e=>{let t=e.workload??{},n=r&&e.type===`compute`?e.kernel:void 0;return Object.freeze({id:e.id,...e.description===void 0?{}:{description:e.description},type:e.type,...n&&{kernel:Object.freeze({entryPoint:n.entryPoint,workgroupSize:Object.freeze([...n.workgroupSize]),bindings:Object.freeze(n.bindings.map(({name:e,type:t,group:n,location:r})=>Object.freeze({name:e,type:t,group:n,location:r}))),...r===`source`&&n.source!==void 0?{source:n.source}:{}})},resources:Object.freeze((e.resources??[]).map(Ms)),...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),a=t.reduce((e,t)=>Math.max(e,t.byteLength),0),o=n.reduce((e,t)=>{for(let n of t.resources??[])Is(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,zs(n.buffer).size));return e},0),s=e=>i.reduce((t,n)=>{let r=n[e];return typeof r==`number`?nc(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(i),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:s(`commandCount`),maximumWorkgroupCount:s(`maximumWorkgroupCount`),maximumInvocationCount:s(`maximumInvocationCount`),readByteLength:s(`readByteLength`),writeByteLength:s(`writeByteLength`),largestBufferByteLength:a,largestStorageBufferBindingByteLength:o,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:a<=e.limits.maxBufferSize&&o<=e.limits.maxStorageBufferBindingSize})}function Ps(e){return`buffer`in e?e.buffer:e}function Fs(e){return`texture`in e?e.texture:e}function Is(e){return`buffer`in e}function Ls(e){return`texture`in e}function Rs(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>Is(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||Ps(r.buffer)!==Ps(n.buffer)||!Hs(r.usage)&&!Hs(n.usage))continue;let a=zs(r.buffer),o=zs(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=Ps(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${Bs(a)} and ${Bs(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function zs(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function Bs(e){return`${e.offset}–${e.offset+e.size} bytes`}function Vs(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function Hs(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function Us(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function Ws(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function Gs(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(Is(t)){let n=Ps(t.buffer);if(Vs(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(Hs(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(Ls(t)){let n=Fs(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&Ks(n.resource,t)&&(Us(t.usage)&&Ws(n.resource.usage)||Ws(t.usage)&&(Us(n.resource.usage)||Ws(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function Ks(e,t){if(Fs(e.texture)!==Fs(t.texture))return!1;let n=qs(e.texture),r=qs(t.texture);return Js(n.aspect,r.aspect)&&Ys(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&Ys(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function qs(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function Js(e,t){return e===`all`||t===`all`||e===t}function Ys(e,t,n,r){return e<n+r&&n<e+t}function Xs(e,t){let n=Qs(e,e=>Is(e)?Ps(e.buffer):null),r=new Map;e.forEach((e,t)=>{if(!e.retainedBuffers?.length)return;let n=r.get(e.retainedBuffers);n?n.lastUse=t:r.set(e.retainedBuffers,{firstUse:t,lastUse:t})});for(let[e,t]of r)for(let r of e){if(!r.transient)continue;let e=n.get(r);n.set(r,{firstUse:Math.min(e?.firstUse??t.firstUse,t.firstUse),lastUse:Math.max(e?.lastUse??t.lastUse,t.lastUse)})}let i=[],a=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),o=new Os((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),s=new Map,c=e=>{let t=e&(N.MAP_READ|N.MAP_WRITE),n=s.get(t);return n||(n=new Os((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index),s.set(t,n)),n};for(let{buffer:e,lifetime:t}of a){if(!t)continue;for(;o.peek()&&o.peek().allocation.lastUse<t.firstUse;){let e=o.pop();c(e.allocation.usage).push(e)}let n=c(e.usage).pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:i.length},i.push(n.allocation));let{allocation:r}=n;r.byteLength=Math.max(r.byteLength,e.byteLength),r.usage|=e.usage,r.lastUse=t.lastUse,r.handles.push(e),o.push(n)}return i}function Zs(e,t){let n=Qs(e,e=>Ls(e)?Fs(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&ec(n.descriptor,e));n||(n={descriptor:$s(e),byteLength:tc(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function Qs(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function $s(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function ec(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function tc(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=nc(t,T.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function nc(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function rc(e,t){return e.reduce((e,n)=>nc(e,n,t),0)}var ic=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},ac=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},oc=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=Vr(this.data)}},sc=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},cc=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},lc=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}};function uc(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function dc(e,t){for(let n of t)uc(e,n)}function fc(e){return{...e,type:`compute`}}var pc=4,mc=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){bc(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function hc(e,t,n={}){bc(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=gc();for(;s<a.length;){let r=_c(n,a[s]);if(s>e&&vc(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||yc(n,t))break}let c=Object.freeze(i===`progressive`?a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[]):[]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:vc(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>_c(e,t),gc());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function gc(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function _c(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+ +!!t.condition}}function vc(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function yc(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function bc(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function xc(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var Sc=class{readResource;stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i,a){this.readResource=a,this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let o=e.filter(e=>e.stats.condition?.outcome!==`skipped`),s=o.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:o.length,skippedNodeCount:e.length-o.length,computePassCount:n,coalescedComputeNodeCount:s-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},Cc=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){Mc(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),Pc(e,this.device),t&&zc(t,e,this.device);let n=this.addBuffer(new ic(this,e,!1,t));if(t){let e=Tc(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof R&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),Pc(e,this.device),this.addBuffer(new ic(this,e,!0))}getUniqueResourceId(e){let t=e,n=1;for(;this.buffers.has(t)||this.textures.has(t)||this.externalTextures.has(t);)t=`${e}-${n++}`;return t}createDataView(e,t){this.assertBuffer(e);let n=Lr(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return Rc(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new ac(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(Pr(n)||Fr(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=Lr(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new oc({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=Ic(e,this.device);return t&&Bc(t,n,this.device),this.addTexture(new sc(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=Ic(e,this.device);return this.addTexture(new sc(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),Fc(e,this.device),this.addExternalTexture(new cc(this,e))}createTransientTexture(e){this.assertMutable();let t=Ic(e,this.device);return this.addTexture(new sc(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new lc(e,Lc(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)dc(this,e.getCommandNodes(this));else if(`type`in e)uc(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(e={}){return this.assertMutable(),Mc(this.device,`compilation`),this.compiled=!0,new wc(ks({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes,kernelMetadata:e.kernelMetadata}))}async compileAsync(e={}){return this.assertMutable(),Mc(this.device,`compilation`),this.compiled=!0,new wc(await As({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes,kernelMetadata:e.kernelMetadata}))}addNode(e){if(this.device.type!==`webgpu`&&e.type!==`render`)throw Error(`WebGL graphs support render passes only`);if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*pc>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>Is(e)&&Ps(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(Is(t)){let e=Ps(t.buffer);this.assertBuffer(e),Hc(e,t.usage)}else if(Ls(t)){let e=Fs(t.texture);if(this.assertTexture(e),Uc(e,t.usage),Wc(t.texture,t.usage),this.device.type===`webgl`&&t.usage===`sampled`&&t.texture instanceof lc&&!qc(t.texture))throw Error(`WebGL sampled textures require a full-resource view`)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}Rs(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=Tc(t.buffer),r={byteLength:Ec(t),usage:n.usage},i=t.buffer instanceof R?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof R?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&Dc(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&Dc(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&Tc(n.defaultBuffer)===e&&Dc(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&Dc(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&Dc(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},wc=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(Is(t)){let e=Ps(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(Ls(t)){let e=Fs(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=jc(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return hc(this.preflight,e,t)}createExecution(e,t={}){return new mc({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(Mc(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=Nc(),a=this.resolveImportedBuffers(t.buffers??{});kc(t.frameTextures??{},t.externalTextures??{});let o=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),s=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of o.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of s.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of s.textures.values())this.consumedExternalTextures.add(e);let c=o.textures,l=e=>{let t=Ps(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},u=e=>{let t=Fs(e),n=t.transient?this.transientTextures.get(t):c.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},d=e=>{let t=u(e);if(e instanceof sc||qc(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},f={commandEncoder:e,parameters:t.parameters,getBuffer:l,getTexture:u,getTextureView:d,getExternalTexture:e=>{let t=s.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},p=[],m,h=0,g=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,_=()=>{let e=m;m=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=Nc();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){let e=Nc();p.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{m||(m=e.beginComputePass({id:n.id}),h++);let t=m;o=Ac(t,e),o&&(g=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?xc(t,l(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...f,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}g||_();break}case`render`:{_();let t=r,i=t.getRenderPassProps?.(f)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,d):void 0,s=n.attachments?.resolveTargets?.map(e=>e?d(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=Ac(c,e),c.pushDebugGroup(n.id);try{t.encode({...f,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:_(),r.encode(f);break}let s=Nc();p.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{_()}let v=Nc();return new Sc(p,v-i,h,i,v,async(e,t)=>{if(this.destroyed)throw Error(`Graph has been destroyed.`);let n=this.compiledNodes.findIndex(({node:t})=>t.id===e),r=this.compiledNodes[n]?.node.resources?.[t],i=this.preflight.nodes[n]?.resources?.[t];if(!r||!i)throw Error(`Resource is unavailable.`);if(`externalTexture`in r)throw Error(`External images cannot be read back.`);let a=`buffer`in r?Ps(r.buffer):Fs(r.texture);if(`frameScoped`in a&&a.frameScoped)throw Error(`Frame textures expire after presentation.`);let o=`buffer`in r?l(r.buffer):u(r.texture),s=o instanceof N?this.transientBuffers:this.transientTextures;if(a.transient&&[...s].some(([e,t])=>e!==a&&t===o))throw Error(`Transient allocation is reused; logical contents are no longer available.`);return Xo(o,i)})}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);zc(a,i,this.device);let o=Tc(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);Bc(e.texture,a,this.device),n.set(a,Oc(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);Bc(o,a,this.device),n.set(a,Oc(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);Vc(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function Tc(e){return e instanceof R?e.buffer:e}function Ec(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function Dc(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function Oc(e){if(e instanceof vs){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function kc(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function Ac(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function jc(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function Mc(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function Nc(){return globalThis.performance?.now()??Date.now()}function Pc(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function Fc(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function Ic(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,n===`3d`?r:1))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function Lc(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function Rc(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function zc(e,t,n){let r=Tc(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function Bc(e,t,n){let r=Oc(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function Vc(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function Hc(e,t){let n=Gc(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function Uc(e,t){let n=Kc(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function Wc(e,t){if(e instanceof lc&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function Gc(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return N.STORAGE;case`uniform`:return N.UNIFORM;case`copy-source`:return N.COPY_SRC;case`copy-destination`:return N.COPY_DST;case`indirect`:return N.INDIRECT;case`vertex`:return N.VERTEX;case`index`:return N.INDEX}}function Kc(e){switch(e){case`sampled`:return n.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return n.STORAGE;case`render-attachment`:return n.RENDER;case`copy-source`:return n.COPY_SRC;case`copy-destination`:return n.COPY_DST}}function qc(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var Jc=class extends Cc{constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);super(e,t)}},Yc=Uint32Array.BYTES_PER_ELEMENT,Xc=256;function Zc(e,t,n){let r=Lr(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%Yc!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function Qc(e,t){Zc(e,[`uint32`],t)}function z(e,t){let n=$c(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function $c(e){let t=Math.floor(e.byteOffset/Xc)*Xc,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function B(e){if(e.byteOffset%Yc!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%Xc/Yc}function el(e,t){if(e.buffer!==t.buffer||e.length===0||t.length===0)return!1;let n=e.byteOffset+(e.length-1)*e.byteStride+e.rowByteLength,r=t.byteOffset+(t.length-1)*t.byteStride+t.rowByteLength;return e.byteOffset<r&&t.byteOffset<n}function V(e,t,n,r,i=N.STORAGE){if(!Number.isSafeInteger(r)||r<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((i&N.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(Pr(n)||Fr(n))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let a=Lr(n),o=e.createTransientBuffer({id:t,byteLength:Math.max(r,1)*a.byteLength,usage:i});return e.createDataView(o,{format:n,length:r})}var tl=class e{static async createAsync(t,n){let r=!F.getAsyncCompilation(t),i=r?F.beginAsyncCompilation(t):F.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&F.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if(e.type!==`webgpu`)throw Error(`Kernel is only supported in WebGPU`);let{source:n,pipelineFactory:r,shaderFactory:i,debugShaders:a,...o}=t;this.device=e,this.id=t.id??`kernel`,this.source=n,this.pipelineFactory=r??F.getDefaultPipelineFactory(e),this.shaderFactory=i??ke.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:`compute`,source:this.source,debugShaders:a});let s={...o,shader:this.shader},c=F.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(s);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(s)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}};function nl(e){return e instanceof oc?e.data:[e]}function rl(e,t){let n=t[0]?.length??0;if(t.some(e=>e.length!==n))throw Error(`Aligned vectors must have equal logical lengths`);let r=t.map(nl),i=t.map(()=>0),a=t.map(()=>0),o=[],s=0;for(;s<n;){for(let e=0;e<r.length;e++)for(;r[e][i[e]]?.length===a[e];)i[e]++,a[e]=0;let t=r.map((e,t)=>e[i[t]]),n=Math.min(...t.map((e,t)=>e.length-a[t])),c=[];for(let r=0;r<t.length;r++){let i=t[r],o=t.findIndex((e,t)=>t<r&&e===i&&a[t]===a[r]);c.push(o>=0?c[o]:a[r]===0&&n===i.length?i:e.createDataView(i.buffer,{format:i.format,length:n,byteOffset:i.byteOffset+a[r]*i.byteStride,byteStride:i.byteStride,rowByteLength:i.rowByteLength}))}o.push(c);for(let e=0;e<a.length;e++)a[e]+=n;s+=n}return o}var il=120,al=class{maxSamples;getNodeGroup;graphs=new Map;encodingGraphs=new WeakMap;constructor(e={}){let t=e.maxSamples??il;if(!Number.isSafeInteger(t)||t<=0)throw Error(`GPUCommandGraphInspector maxSamples must be a positive safe integer`);this.maxSamples=t,this.getNodeGroup=e.getNodeGroup}registerGraph(e){this.graphs.set(e.id,{id:e.id,stats:ol(e.stats),capabilities:Object.freeze({...e.capabilities}),...e.preflight?{preflight:sl(e.preflight)}:{},encodingCount:0,timingReadFailureCount:0,cpuSamples:[],gpuSamples:[],counters:new Map,nodes:new Map});let t=this.getGraph(e.id);for(let n of e.preflight?.nodes??[])this.getNode(t,n)}observeGraph(e){this.registerGraph(e);let t=this.getGraph(e.id),n=new WeakMap,r=!0,i=()=>r&&this.graphs.get(e.id)===t;return Object.freeze({graph:e,encode:(n,r)=>{let a=e.encode(n,r);return i()&&this.recordGraphEncoding(t,a),a},recordGPUTimings:async r=>{let a=n.get(r);if(a)return await a;if(i()&&this.encodingGraphs.get(r)===t){let i=this.recordGraphGPUTimings(e.id,t,r);return n.set(r,i),await i}},recordCounters:e=>{i()&&this.recordGraphCounters(t,e)},detach:()=>{r&&(r=!1,this.graphs.get(e.id)===t&&this.graphs.delete(e.id))}})}clear(){this.graphs.clear()}recordEncoding(e,t){let n=this.getGraph(e);this.recordGraphEncoding(n,t)}async readResource(e,t,n){let r=this.getGraph(e);if(!r.encoding?.readResource)throw Error(`No live resource readback is available.`);let i=await r.encoding.readResource(t,n);if(this.graphs.get(e)!==r)throw Error(`Graph registration changed during readback.`);return i}recordCounters(e,t){this.recordGraphCounters(this.getGraph(e),t)}recordGraphEncoding(e,t){e.encoding=t,this.encodingGraphs.set(t,e);let{stats:n}=t;e.encodingCount++,this.addSample(e.cpuSamples,n.cpuEncodeTimeMilliseconds);for(let t of n.nodes){let n=this.getNode(e,t);this.addSample(n.cpuSamples,t.cpuEncodeTimeMilliseconds)}}recordGraphCounters(e,t){let n=Object.entries(t);for(let[e,t]of n)if(!e||!Number.isFinite(t)||t<0)throw Error(`GPUCommandGraphInspector counters require an ID and a finite, non-negative value`);for(let[t,r]of n){let n=e.counters.get(t);n||(n=[],e.counters.set(t,n)),this.addSample(n,r)}}async recordGPUTimings(e,t){let n=this.encodingGraphs.get(t)??this.getGraph(e);return await this.recordGraphGPUTimings(e,n,t)}async recordGraphGPUTimings(e,t,n){if(this.graphs.get(e)!==t)return;let r;try{r=await n.readTimings()}catch{this.graphs.get(e)===t&&t.timingReadFailureCount++;return}if(this.graphs.get(e)===t){r.gpuTimeMilliseconds!==void 0&&this.addSample(t.gpuSamples,r.gpuTimeMilliseconds);for(let e of r.nodes)if(e.gpuTimeMilliseconds!==void 0){let n=this.getNode(t,e);this.addSample(n.gpuSamples,e.gpuTimeMilliseconds)}return r}}getSnapshot(){let e=Array.from(this.graphs.values(),e=>this.getGraphSnapshot(e));return Object.freeze({graphs:Object.freeze(e)})}getGraph(e){let t=this.graphs.get(e);if(!t)throw Error(`GPUCommandGraphInspector graph "${e}" is not registered`);return t}getNode(e,t){let n=e.nodes.get(t.id);if(n)return t.description!==void 0&&(n.description=t.description),t.resources!==void 0&&(n.resources=dl(t.resources)),n;let r=dl(t.resources),i=this.getNodeGroup?.({graphId:e.id,id:t.id,type:t.type,description:t.description,resources:r}),a={id:t.id,resources:r,...t.description===void 0?{}:{description:t.description},type:t.type,...i===void 0?{}:{group:i},cpuSamples:[],gpuSamples:[]};return e.nodes.set(a.id,a),a}addSample(e,t){e.push(t),e.length>this.maxSamples&&e.splice(0,e.length-this.maxSamples)}getGraphSnapshot(e){let t=[],n=new Set;for(let r of e.stats.nodeOrder){let i=e.nodes.get(r);i&&(t.push(i),n.add(r))}for(let r of e.nodes.values())n.has(r.id)||t.push(r);let r=t.map(e=>Object.freeze({id:e.id,resources:e.resources,...e.description===void 0?{}:{description:e.description},type:e.type,...e.group===void 0?{}:{group:e.group},cpu:cl(e.cpuSamples),gpu:cl(e.gpuSamples)})),i=Array.from(e.counters,([e,t])=>ll(e,t));return Object.freeze({id:e.id,stats:e.stats,capabilities:e.capabilities,...e.preflight?{preflight:e.preflight}:{},encodingCount:e.encodingCount,timingReadFailureCount:e.timingReadFailureCount,totals:Object.freeze({cpu:cl(e.cpuSamples),gpu:cl(e.gpuSamples)}),counters:Object.freeze(i),nodes:Object.freeze(r)})}};function ol(e){return Object.freeze({...e,nodeOrder:Object.freeze([...e.nodeOrder])})}function sl(e){return Object.freeze({...e,nodes:Object.freeze(e.nodes.map(e=>Object.freeze({...e,resources:dl(e.resources)})))})}function cl(e){if(e.length===0)return Object.freeze({sampleCount:0});let t=[...e].sort((e,t)=>e-t);return Object.freeze({sampleCount:e.length,latestMilliseconds:e[e.length-1],p50Milliseconds:ul(t,.5),p95Milliseconds:ul(t,.95)})}function ll(e,t){let n=[...t].sort((e,t)=>e-t);return Object.freeze({id:e,sampleCount:t.length,latestValue:t[t.length-1],p50Value:ul(n,.5),p95Value:ul(n,.95)})}function ul(e,t){return e[Math.ceil(t*e.length)-1]}function dl(e){return e&&Object.freeze(e.map(e=>Object.freeze({...e})))}var fl=4294967295,pl=4294967296;function ml(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>fl)throw Error(`${e} element count must be a non-negative uint32`);return _l(e,n),hl(e,Math.max(1,Math.ceil(t/n)),r)}function hl(e,t,n){let r=Math.floor(n);if(!Number.isSafeInteger(r)||r<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let i=Math.min(t,r),a=Math.min(Math.ceil(t/i),r),o=Math.ceil(t/i/a);if(o>r)throw Error(`${e} requires ${t} workgroups, exceeding the 3D dispatch limit of ${r} per dimension`);return{x:i,y:a,z:o}}function gl(e,t){_l(`GPU dispatch`,t);let n=Math.floor(fl/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function _l(e,t){if(!Number.isSafeInteger(t)||t<2||t>fl||pl%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function vl(e,t){let[n,r,i]=t;for(let[e,t]of[[`x`,n],[`y`,r],[`z`,i]])if(!Number.isSafeInteger(t)||t<0)throw Error(`compute dispatch ${e} workgroup count must be a non-negative safe integer`);return{...e,dispatchWorkgroups:Object.freeze([n,r,i])}}function yl(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var H=256,bl=64;function xl(e,t=!1){return t?`portable`:yl(e,{requiresSubgroupId:!0})}var Sl=class{id;input;output;mode;segmentFlags;constructor(e){if(this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,Ol(this.input,`${this.id} input`),Ol(this.output,`${this.id} output`),this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.output instanceof oc&&this.output.length!==this.input.length)throw Error(`${this.id} vector output length must equal input length`);if(this.segmentFlags){if(Ol(this.segmentFlags,`${this.id} segmentFlags`),this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);if(this.segmentFlags instanceof oc&&this.segmentFlags.length!==this.input.length)throw Error(`${this.id} vector segmentFlags length must equal input length`);let e=new Set(kl(this.output).map(e=>e.buffer));if(kl(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}getCommandNodes(e){let t=[];return t.push(...Cl(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function Cl(e,t,n){let r=[];Al(t,e.input,e.id),Al(t,e.output,e.id),e.segmentFlags&&Al(t,e.segmentFlags,e.id);let i=wl(t,e.output,e.input.length),a=e.segmentFlags?wl(t,e.segmentFlags,e.input.length):void 0,o=a?rl(t,[e.input,i,a]):rl(t,[e.input,i]);return r.push(...Tl(t,{id:e.id,inputChunks:o.map(e=>e[0]),outputChunks:o.map(e=>e[1]),segmentFlagChunks:a?o.map(e=>e[2]):void 0,isVector:o.length>1,mode:e.mode},n)),r}function wl(e,t,n){return t.length===n||t instanceof oc?t:e.createDataView(t.buffer,{format:t.format,length:n,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}function Tl(e,t,n){let r=[],i=t.inputChunks,a=t.outputChunks,o=t.segmentFlagChunks,s=i.map((e,t)=>({chunkIndex:t,input:e,output:a[t],segmentFlags:o?.[t]})).filter(e=>e.input.length>0);if(s.length===0)return r;if(s.length===1){let i=s[0];return r.push(...El(e,{id:t.isVector?`${t.id}-chunk-${i.chunkIndex}`:t.id,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,maxComputeWorkgroupsPerDimension:n})),r}let c=V(e,`${t.id}-chunk-totals`,`uint32`,s.length),l=V(e,`${t.id}-chunk-offsets`,`uint32`,s.length),u=o?V(e,`${t.id}-chunk-segment-flags`,`uint32`,s.length):void 0,d=o?s.map(n=>V(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[i,a]of s.entries())r.push(...El(e,{id:`${t.id}-chunk-${a.chunkIndex}`,input:a.input,output:a.output,mode:t.mode,segmentFlags:a.segmentFlags,outputSegmentPrefixes:d?.[i],finalSum:Dl(e,c,i),finalSegmentFlag:u?Dl(e,u,i):void 0,maxComputeWorkgroupsPerDimension:n}));r.push(...El(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n}));for(let[i,a]of s.entries())r.push(...Pl(e,{id:`${t.id}-chunk-${a.chunkIndex}-add-carry`,output:a.output,offsets:l,length:a.output.length,offsetIndex:i,segmentPrefixes:d?.[i],dispatchLayout:Fl(a.output.length,n)}));return r}function El(e,t){let n=[];if(t.input.length===0)return n;let r=[],i=t.input,a=t.output,o=t.segmentFlags,s=t.input.length,c=0;for(;;){let l=Math.ceil(s/H),u,d;l>1&&(u=V(e,`${t.id}-level-${c}-block-sums`,`uint32`,l),o&&(d=V(e,`${t.id}-level-${c}-block-segment-flags`,`uint32`,l)));let f=o?c===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:l>1||c>0?V(e,`${t.id}-level-${c}-segment-prefixes`,`uint32`,s):void 0:void 0;if(n.push(...jl(e,{id:`${t.id}-level-${c}-scan`,input:i,output:a,mode:c===0?t.mode:`exclusive`,segmentFlags:o,segmentSummaryInput:!!o&&(c>0||t.segmentSummaryInput),segmentPrefixes:f,blockSums:u,blockSegmentFlags:d,finalSum:u?void 0:t.finalSum,finalSegmentFlag:u?void 0:t.finalSegmentFlag,length:s,blockCount:l,dispatchLayout:Fl(s,t.maxComputeWorkgroupsPerDimension)})),r.push({output:a,length:s,segmentPrefixes:f}),!u)break;let p=V(e,`${t.id}-level-${c}-block-offsets`,`uint32`,l);r[r.length-1].blockOffsets=p,i=u,a=p,o=d,s=l,c++}for(let i=r.length-2;i>=0;i--){let a=r[i],o=r[i+1];n.push(...Pl(e,{id:`${t.id}-level-${i}-add-offsets`,output:a.output,offsets:a.blockOffsets,length:a.length,segmentPrefixes:a.segmentPrefixes,offsetSegmentPrefixes:o.segmentPrefixes,dispatchLayout:Fl(a.length,t.maxComputeWorkgroupsPerDimension)}))}return n}function Dl(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function Ol(e,t){let n=e instanceof oc?e.data:[e];for(let e of n)Qc(e,t)}function kl(e){return e instanceof oc?e.data:[e]}function Al(e,t,n){if((t instanceof oc?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function jl(e,t){let n=[],r=t.blockSums??t.finalSum,i=t.blockSegmentFlags??t.finalSegmentFlag,a=r?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,o=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,s=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,c=i?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,l=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,u=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,d=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,f=t.segmentFlags?`if (lane >= stride) {
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
const INPUT_OFFSET: u32 = ${B(t.input)}u;
const OUTPUT_OFFSET: u32 = ${B(t.output)}u;
${r?`const SUM_OFFSET: u32 = ${B(r)}u;`:``}
${t.segmentFlags?`const SEGMENT_FLAGS_OFFSET: u32 = ${B(t.segmentFlags)}u;`:``}
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${B(t.segmentPrefixes)}u;`:``}
${i?`const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${B(i)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${a}
${o}
${s}
${c}
var<workgroup> scratch: array<u32, ${H}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${H}>;`:``}

@compute @workgroup_size(${H}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Il(t.dispatchLayout)}
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

  for (var stride = 1u; stride < ${H}u; stride = stride * 2u) {
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

  if (lane == ${H-1}u) {
    ${l}
    ${u}
  }
  if (index < ELEMENT_COUNT) {
    ${m}
    ${h}
  }
}`,_=Ml(e,!!t.segmentFlags,t.length),v=_===`subgroups`?Nl(t,r,a):g,y={bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...r?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...i?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]};return n.push(fc({id:t.id,kernel:{entryPoint:`main`,workgroupSize:[H,1,1],bindings:y.bindings,source:v},workload:{operation:`GPUScan`,variant:_,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*H,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...r?[{buffer:r,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...i?[{buffer:i,usage:`storage-write`}]:[]],compile:({device:e})=>{let n=new tl(e,{id:t.id,source:v,shaderLayout:y});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:z(t.input,a),outputValues:z(t.output,a)};r&&(o.sumValues=z(r,a)),t.segmentFlags&&(o.segmentFlags=z(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=z(t.segmentPrefixes,a)),i&&(o.summarySegmentFlags=z(i,a)),n.dispatch(e,{bindings:o,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>vl(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function Ml(e,t,n){let r=xl(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||xl(e.device,!1)===`subgroups`}]}).variant}function Nl(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/H)+1;return`
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${e.length}u;
const BLOCK_COUNT: u32 = ${e.blockCount}u;
const INPUT_OFFSET: u32 = ${B(e.input)}u;
const OUTPUT_OFFSET: u32 = ${B(e.output)}u;
${t?`const SUM_OFFSET: u32 = ${B(t)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${n}
var<workgroup> subgroupOffsets: array<u32, ${bl}>;

@compute @workgroup_size(${H}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${H}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${H}u / subgroupSize;
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
  if (lane == ${H-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function Pl(e,t){let n=[],r=t.offsetIndex===void 0?`index / ${H}u`:`${t.offsetIndex}u`,i=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${B(t.output)}u;
const OFFSETS_OFFSET: u32 = ${B(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${B(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${B(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${H}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Il(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${r}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${r}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`,a={bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]};return n.push(fc({id:t.id,kernel:{entryPoint:`main`,workgroupSize:[H,1,1],bindings:a.bindings,source:i},workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*H,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new tl(e,{id:t.id,source:i,shaderLayout:a});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:z(t.output,r),offsets:z(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=z(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=z(t.offsetSegmentPrefixes,r)),n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>vl(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function Fl(e,t){return ml(`GPUScan`,e,H,t)}function Il(e){return gl(e,H)}function Ll(e,t){let n=[...Object.entries(t.inputs??{}),...Object.entries(t.outputs)];for(let[,t]of n)if($c(t).size>e.device.limits.maxStorageBufferBindingSize)throw Error(`Active chunks must fit a storage binding`);let r=t.dispatch.x*t.dispatch.y*t.dispatch.z;return vl(fc({id:t.id,workload:{commandCount:1,maximumWorkgroupCount:r,maximumInvocationCount:r*(t.workgroupSize??256)},resources:[...Object.values(t.inputs??{}).map(e=>({buffer:e,usage:`storage-read`})),...Object.values(t.outputs).map(e=>({buffer:e,usage:`storage-read-write`}))],compile:({device:e})=>{let r=new tl(e,{id:t.id,source:t.source,shaderLayout:{bindings:n.map(([e],n)=>({name:e,group:0,location:n,type:n<Object.keys(t.inputs??{}).length?`read-only-storage`:`storage`}))}});return{encode:({computePass:e,getBuffer:i})=>{let a={};for(let[e,t]of n)a[e]=z(t,i);r.dispatch(e,{bindings:a,x:t.dispatch.x,y:t.dispatch.y,z:t.dispatch.z})},destroy:()=>r.destroy()}}}),[t.dispatch.x,t.dispatch.y,t.dispatch.z])}function Rl(e,t,n){let r=[],i=rl(e,[t.keys,t.values]),a=rl(e,[t.outputKeys,t.outputValues]),o=i.map(([i,a],o)=>{let s=`${t.id}-span-${o}`,c=V(e,`${s}-keys`,`uint32`,i.length),l=V(e,`${s}-values`,`uint32`,i.length),u=V(e,`${s}-ranks`,`uint32`,i.length);return r.push(...ql(new Kl({id:s,keys:i,values:a,outputKeys:c,outputValues:l,algorithm:t.resolvedAlgorithm,direction:t.direction,keyBits:t.keyBits}),e,n)),{keys:c,values:l,ranks:u}}),s=t.resolvedAlgorithm===`radix`&&t.keyBits<32?2**t.keyBits-1:4294967295,c=t.direction===`ascending`?`<`:`>`;for(let[i,l]of o.entries()){let u=ml(`GPUSort merge`,l.keys.length,256,n),d=gl(u,256);r.push(Ll(e,{id:`${t.id}-ranks-${i}`,outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index < ${l.keys.length}u) { ranks[index] = index; }
}`}));for(let[n,a]of o.entries())n!==i&&r.push(Ll(e,{id:`${t.id}-rank-${i}-against-${n}`,inputs:{keys:l.keys,otherKeys:a.keys},outputs:{ranks:l.ranks},dispatch:u,source:`
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
}`}));let f=0;for(let[n,[o,s]]of a.entries())r.push(Ll(e,{id:`${t.id}-publish-${i}-${n}`,inputs:{keys:l.keys,values:l.values,ranks:l.ranks},outputs:{outputKeys:o,outputValues:s},dispatch:u,source:`
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
    outputKeys[${B(o)}u + localRank] = keys[index];
    outputValues[${B(s)}u + localRank] = values[index];
  }
}`})),f+=o.length}return r}var zl=256,Bl=256,Vl=4,Hl=Bl/32,Ul=4294967295,Wl=2147483648,Gl=zl,Kl=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])for(let n of nl(t))Qc(n,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>Wl)throw Error(`${this.id} supports at most ${Wl} rows`);Yl(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=Gl?`bitonic`:`radix`:this.algorithm}getCommandNodes(e){let t=[];return t.push(...ql(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function ql(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])for(let r of nl(n))if(r.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);return[e.keys,e.values,e.outputKeys,e.outputValues].some(e=>e instanceof oc)?Rl(t,e,n):Jl(e,t,n)}function Jl(e,t,n){let r=[];if(e.keys.length===0)return r;if(e.keys.length===1)return r.push(...Xl(t,e)),r;let i=ml(`GPUSort`,e.keys.length,Bl,n);return e.resolvedAlgorithm===`bitonic`?r.push(...Zl(t,e,i,n)):r.push(...iu(t,e,i,n)),r}function Yl(e){let t=nl(e.outputKeys),n=nl(e.outputValues),r=[...nl(e.keys),...nl(e.values)];if([...t,...n].some(e=>r.some(t=>t.buffer===e.buffer))||t.some(e=>n.some(t=>e.buffer===t.buffer)))throw Error(`${e.id} outputs must use separate buffers from inputs and each other`);for(let r of[t,n])for(let[t,n]of r.entries())if(r.slice(0,t).some(e=>el(e,n)))throw Error(`${e.id} output chunks must not overlap`)}function Xl(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=[],s=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${B(n)}u;
const VALUES_OFFSET: u32 = ${B(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${B(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${B(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${Bl}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gl(a,Bl)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;return o.push(...lu(e,{id:`${t.id}-${i}`,source:s,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})),o}function Zl(e,t,n,r){let i=[],a=su(t.keys.length);if(a<=zl)return i.push(...Ql(e,t,a)),i;let o=ml(`GPUSort bitonic`,a,zl,r),s=V(e,`${t.id}-bitonic-indices-a`,`uint32`,a),c=V(e,`${t.id}-bitonic-indices-b`,`uint32`,a);i.push(...tu(e,t,s,a,o));let l=s,u=c;for(let n of cu(a))i.push(...nu(e,t,l,u,a,n,o)),[l,u]=[u,l];return i.push(...ru(e,t,l,n)),i}function Ql(e,t,n){let r=[],i=t.direction===`descending`,a=yl(e.device,{requiresSubgroupId:!0})===`subgroups`,o=`
${a?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${Ul}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${n}u;
const KEYS_OFFSET: u32 = ${B(t.keys)}u;
const VALUES_OFFSET: u32 = ${B(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${B(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${B(t.outputValues)}u;
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
${a?eu():$l()}
}`;return r.push(...lu(e,{id:`${t.id}-bitonic-local`,source:o,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})),r}function $l(){return`
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
  }`}function eu(){return`
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
  }`}function tu(e,t,n,r,i){let a=[],o=`
const INVALID_INDEX: u32 = ${Ul}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${B(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${zl}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gl(i,zl)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;return a.push(...lu(e,{id:`${t.id}-bitonic-initialize`,source:o,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})),a}function nu(e,t,n,r,i,a,o){let s=[],c=t.direction===`descending`,l=`
const INVALID_INDEX: u32 = ${Ul}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${i}u;
const BLOCK_WIDTH: u32 = ${a.blockWidth}u;
const COMPARE_STRIDE: u32 = ${a.compareStride}u;
const KEYS_OFFSET: u32 = ${B(t.keys)}u;
const INDICES_IN_OFFSET: u32 = ${B(n)}u;
const INDICES_OUT_OFFSET: u32 = ${B(r)}u;
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

@compute @workgroup_size(${zl}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gl(o,zl)}
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
}`;return s.push(...lu(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})),s}function ru(e,t,n,r){let i=[],a=`
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${B(t.keys)}u;
const VALUES_OFFSET: u32 = ${B(t.values)}u;
const INDICES_OFFSET: u32 = ${B(n)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${B(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${B(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${zl}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${gl(r,zl)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;return i.push(...lu(e,{id:`${t.id}-bitonic-gather`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})),i}function iu(e,t,n,r){let i=[],a=Math.ceil(t.keyBits/Vl),o=Math.ceil(t.keys.length/Bl),s=a>1?V(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,c=a>1?V(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,l=t.keys,u=t.values;for(let d=0;d<a;d++){let f=d*Vl,p=Math.min(Vl,t.keyBits-f),m=2**p,h=V(e,`${t.id}-radix-digit-${f}-histogram`,`uint32`,m*o),g=V(e,`${t.id}-radix-digit-${f}-offsets`,`uint32`,m*o),_=(a-d)%2==1,v=_?t.outputKeys:s,y=_?t.outputValues:c;if(!v||!y)throw Error(`${t.id} radix scratch is missing`);i.push(...au(e,t,l,h,f,p,o,n));let b=new Sl({id:`${t.id}-radix-digit-${f}-scan`,input:h,output:g});i.push(...Cl(b,e,r)),i.push(...ou(e,t,l,u,g,v,y,f,p,o,n)),l=v,u=y}return i}function au(e,t,n,r,i,a,o,s){let c=[],l=2**a,u=t.direction===`descending`,d=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${i}u;
const BUCKET_COUNT: u32 = ${l}u;
const DIGIT_MASK: u32 = ${l-1}u;
const WORKGROUP_COUNT: u32 = ${o}u;
const KEYS_OFFSET: u32 = ${B(n)}u;
const HISTOGRAM_OFFSET: u32 = ${B(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${l}>;

@compute @workgroup_size(${Bl}) fn main(
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

  let index = workgroupIndex * ${Bl}u + localInvocationIndex;
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
}`;return c.push(...lu(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:d,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})),c}function ou(e,t,n,r,i,a,o,s,c,l,u){let d=[],f=2**c,p=t.direction===`descending`,m=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${f-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${Hl}u;
const MASK_COUNT: u32 = ${f*Hl}u;
const KEYS_OFFSET: u32 = ${B(n)}u;
const VALUES_OFFSET: u32 = ${B(r)}u;
const OFFSETS_OFFSET: u32 = ${B(i)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${B(a)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${B(o)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${f*Hl}>;

@compute @workgroup_size(${Bl}) fn main(
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

  let index = workgroupIndex * ${Bl}u + localInvocationIndex;
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
}`;return d.push(...lu(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:m,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})),d}function su(e){let t=1;for(;t<e;)t*=2;return t}function cu(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function lu(e,t){let n=[];return n.push(fc({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new tl(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=z(n,r);n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n}function uu(e,t){let{bindings:n={},...r}=t;return{kernel:new tl(e,r),bindings:{...n}}}async function du(e,t){let{bindings:n={},...r}=t;return{kernel:await tl.createAsync(e,r),bindings:{...n}}}function fu(e,t,n,r,i=0){return`
const BODY_COUNT = ${e}u;
const CELL_SIZE = ${t*2+r};
const MAXIMUM_RADIUS = ${t};
const MAXIMUM_CANDIDATES = ${i}u;
const MAXIMUM_CONTACTS = ${n}u;
const INVALID_KEY = 0xffffffffu;
struct Plane {normal: vec4f, right: vec4f, forward: vec4f, center: vec4f, material: vec4f, response: vec4f};
struct Clock {timeStep: f32, remaining: f32, step: u32, reserved: u32};
struct Settings {
  gravity: vec4f,
  normal: vec4f,
  right: vec4f,
  forward: vec4f,
  material: vec4f,
  resting: vec4f,
  solver: vec4f,
  contactEffects: vec4f,
  planes: array<Plane, 32>,
};
@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(9) var<uniform> clock: Clock;
fn getCell(point: vec3f) -> vec3i { return vec3i(floor(point / CELL_SIZE)); }
fn hashCell(cell: vec3i) -> u32 {
  return ((bitcast<u32>(cell.x) * 73856093u) ^
    (bitcast<u32>(cell.y) * 19349663u) ^
    (bitcast<u32>(cell.z) * 83492791u)) & 0x7fffffffu;
}
fn isValidSphere(sphere: vec4f) -> bool {
  return sphere.w > 0.0 && sphere.w <= MAXIMUM_RADIUS &&
    all(abs(sphere.xyz) < vec3f(CELL_SIZE * 100000000.0));
}
fn getPlaneDelta(point: vec3f, plane: Plane) -> vec3f {
  let relative = point - plane.center.xyz;
  let horizontal = clamp(dot(relative, plane.right.xyz), -plane.right.w, plane.right.w);
  let vertical = clamp(dot(relative, plane.forward.xyz), -plane.forward.w, plane.forward.w);
  return relative - plane.right.xyz * horizontal - plane.forward.xyz * vertical;
}
fn getContactNormal(delta: vec3f, first: u32, second: u32) -> vec3f {
  let distance = length(delta);
  if (distance > 0.0) { return delta / distance; }
  return vec3f(select(-1.0, 1.0, first < second), 0.0, 0.0);
}
`}var pu=`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> sleepStates: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> predictedPositions: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> predictedVelocities: array<vec4f>;
@group(0) @binding(7) var<storage, read_write> predictedAngularVelocities: array<vec4f>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  var velocity = velocities[index];
  var sleep = sleepStates[index];
  if (sleep.y != settings.gravity.w) { sleep.x = 0.0; }
  sleep.y = settings.gravity.w;
  sleepStates[index] = sleep;
  var point = sphere.xyz;
  let sleeping = settings.solver.x > 0.0 && sleep.x >= settings.solver.x;
  if (velocity.w > 0.0 && !sleeping && isValidSphere(sphere)) {
    velocity = vec4f(velocity.xyz + settings.gravity.xyz * clock.timeStep, velocity.w);
    point += velocity.xyz * clock.timeStep;
  }
  predictedPositions[index] = vec4f(point, sphere.w);
  predictedVelocities[index] = velocity;
  predictedAngularVelocities[index] = angularVelocities[index];
}
`,mu=`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> keys: array<u32>;
@group(0) @binding(3) var<storage, read_write> values: array<u32>;
@group(0) @binding(4) var<storage, read_write> diagnostics: array<atomic<u32>>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  var key = INVALID_KEY;
  if (isValidSphere(sphere)) { key = hashCell(getCell(sphere.xyz)); }
  else if (sphere.w >= 0.0 || !isValidSphere(vec4f(sphere.xyz, -sphere.w))) { atomicAdd(&diagnostics[1], 1u); }
  keys[index] = key; values[index] = index;
}
`;function hu(e,t){return`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> sortedKeys: array<u32>;
@group(0) @binding(4) var<storage, read> sortedBodies: array<u32>;
@group(0) @binding(5) var<storage, read_write> counts: array<u32>;
@group(0) @binding(6) var<storage, read> offsets: array<u32>;
@group(0) @binding(7) var<storage, read_write> contacts: array<vec2u>;
@group(0) @binding(8) var<storage, read_write> diagnostics: array<atomic<u32>>;
${e===`count`?`var<workgroup> contactDiagnostics: array<vec4u, 64>;

fn addSaturated(counterIndex: u32, amount: u32) {
  var current = atomicLoad(&diagnostics[counterIndex]);
  loop {
    let next = current + min(amount, 0xffffffffu - current);
    let result = atomicCompareExchangeWeak(&diagnostics[counterIndex], current, next);
    if (result.exchanged) { break; }
    current = result.old_value;
  }
}

fn countContacts(localIndex: u32, contactCount: u32, candidateCount: u32) {
  contactDiagnostics[localIndex] = vec4u(
    contactCount - min(contactCount, MAXIMUM_CONTACTS),
    candidateCount,
    contactCount,
    select(0u, 2u, MAXIMUM_CANDIDATES > 0u && candidateCount >= MAXIMUM_CANDIDATES)
  );
  workgroupBarrier();
  for (var stride = 32u; stride > 0u; stride >>= 1u) {
    if (localIndex < stride) {
      let first = contactDiagnostics[localIndex];
      let second = contactDiagnostics[localIndex + stride];
      contactDiagnostics[localIndex] = vec4u(
        first.x + second.x, first.y + second.y, max(first.z, second.z), first.w + second.w
      );
    }
    workgroupBarrier();
  }
  if (localIndex == 0u) {
    let totals = contactDiagnostics[0];
    if (totals.x > 0u) { addSaturated(0u, totals.x); }
    if (totals.y > 0u) { addSaturated(5u, totals.y); }
    if (totals.z > 0u) { atomicMax(&diagnostics[6], totals.z); }
    if (totals.w > 0u) { atomicAdd(&diagnostics[7], totals.w); }
  }
}
`:``}
fn lowerBound(key: u32) -> u32 {
  var first = 0u; var last = BODY_COUNT;
  while (first < last) {
    let middle = first + (last - first) / 2u;
    if (sortedKeys[middle] < key) { first = middle + 1u; } else { last = middle; }
  }
  return first;
}
@compute @workgroup_size(64)
fn main(
  @builtin(global_invocation_id) invocation: vec3u,
  @builtin(local_invocation_index) localIndex: u32
) {
  let index = invocation.x;
  var contactCount = 0u;
  var candidateCount = 0u;
  // Out-of-range lanes supply zero counts and still participate in the reduction.
  var sphere = vec4f(0.0);
  if (index < BODY_COUNT) { sphere = positions[index]; }
  if (isValidSphere(sphere)) {
    let cell = getCell(sphere.xyz);
    ${t?`let neighborCount = 1u;`:`let neighborCount = 27u;`}
    for (var neighborIndex = 0u; neighborIndex < neighborCount; neighborIndex++) {
      if(MAXIMUM_CANDIDATES > 0u && candidateCount >= MAXIMUM_CANDIDATES) {break;}
      let neighborCell = cell + vec3i(i32(neighborIndex % 3u) - 1,
        i32((neighborIndex / 3u) % 3u) - 1, i32(neighborIndex / 9u) - 1);
      let key = hashCell(neighborCell);
      var cursor = ${t?`0u`:`lowerBound(key)`};
      while (cursor < BODY_COUNT) {
        ${t?``:`if (sortedKeys[cursor] != key) { break; }`}
        let other = ${t?`cursor`:`sortedBodies[cursor]`};
        cursor++;
        if(MAXIMUM_CANDIDATES > 0u && candidateCount >= MAXIMUM_CANDIDATES) {break;}
        candidateCount++;
        if (other == index) { continue; }
        let neighbor = positions[other];
        ${t?``:`if (any(getCell(neighbor.xyz) != neighborCell)) { continue; }`}
        if (!isValidSphere(neighbor)) { continue; }
        if (velocities[index].w <= 0.0 && velocities[other].w <= 0.0) { continue; }
        let delta = sphere.xyz - neighbor.xyz;
        let radius = sphere.w + neighbor.w;
        if (dot(delta, delta) > (radius + settings.solver.z) * (radius + settings.solver.z)) { continue; }
        ${e===`emit`?`if (contactCount < MAXIMUM_CONTACTS) {
          let closing = dot(velocities[index].xyz - velocities[other].xyz, getContactNormal(delta, index, other));
          let bounce = select(0.0, -settings.material.y * closing,
            closing < -settings.solver.y && length(delta) <= radius);
          contacts[offsets[index] + contactCount] = vec2u(other, bitcast<u32>(bounce));
        }`:``}
        contactCount++;
      }
    }
  }
  ${e===`count`?`if (index < BODY_COUNT) { counts[index] = min(contactCount, MAXIMUM_CONTACTS); }
    countContacts(localIndex, contactCount, candidateCount);`:`if (contactCount > 0u) { atomicAdd(&diagnostics[2], min(contactCount, MAXIMUM_CONTACTS)); }`}
}
`}var gu=`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read> offsets: array<u32>;
@group(0) @binding(5) var<storage, read> contacts: array<vec2u>;
@group(0) @binding(6) var<storage, read_write> outputPositions: array<vec4f>;
@group(0) @binding(7) var<storage, read_write> outputVelocities: array<vec4f>;
@group(0) @binding(8) var<storage, read_write> outputAngularVelocities: array<vec4f>;
fn getFrictionImpulse(relative: vec3f, normal: vec3f, normalImpulse: f32, denominator: f32, staticFriction: f32, dynamicFriction: f32) -> vec3f {
  let tangent = relative - normal * dot(relative, normal);
  let speed = length(tangent);
  if (speed < 0.000001 || normalImpulse <= 0.0) { return vec3f(0.0); }
  let stoppingImpulse = speed / denominator;
  let limit = select(dynamicFriction * normalImpulse, stoppingImpulse,
    stoppingImpulse <= staticFriction * normalImpulse);
  return -tangent * min(stoppingImpulse, limit) / speed;
}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  let velocity = velocities[index];
  let angular = angularVelocities[index];
  var point = sphere.xyz; var linearVelocity = velocity.xyz; var angularVelocity = angular.xyz;
  if (clock.timeStep > 0.0 && velocity.w > 0.0 && isValidSphere(sphere)) {
    let inverseInertia = 2.5 * velocity.w / (sphere.w * sphere.w);
    for (var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
      let contact = contacts[cursor]; let other = contact.x;
      let neighbor = positions[other]; let neighborVelocity = velocities[other];
      let delta = sphere.xyz - neighbor.xyz; let distance = length(delta);
      let normal = getContactNormal(delta, index, other);
      if (distance > sphere.w + neighbor.w) { continue; }
      let inverseMass = velocity.w + max(neighborVelocity.w, 0.0);
      let degree = max(1u, max(offsets[index + 1u] - offsets[index], offsets[other + 1u] - offsets[other]));
      let relaxation = 1.0 / f32(degree);
      let penetration = max(sphere.w + neighbor.w - distance - settings.solver.z * 0.1, 0.0);
      point += normal * penetration * velocity.w / inverseMass * settings.solver.w * relaxation;
      let linearRelative = velocity.xyz - neighborVelocity.xyz;
      let angularRelative = cross(angular.xyz, -normal * sphere.w) - cross(angularVelocities[other].xyz, normal * neighbor.w);
      let relative = linearRelative + angularRelative;
      let frictionRelative = linearRelative * settings.contactEffects.x + angularRelative * settings.contactEffects.y;
      let normalImpulse = max((bitcast<f32>(contact.y) - dot(relative, normal)) / inverseMass, 0.0);
      let tangentImpulse = getFrictionImpulse(frictionRelative, normal, normalImpulse, 3.5 * inverseMass, settings.material.z, settings.material.w);
      linearVelocity += (normal * normalImpulse + tangentImpulse) * velocity.w * relaxation;
      angularVelocity += cross(-normal * sphere.w, tangentImpulse) * inverseInertia * relaxation;
    }
    for (var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
      let plane = settings.planes[planeIndex];
      let floorDelta = getPlaneDelta(point, plane);
      let floorDistance = length(floorDelta);
      let signedHeight = dot(point, plane.normal.xyz) - plane.normal.w;
      if (signedHeight > -sphere.w && floorDistance <= sphere.w) {
        let outsideEdge = length(floorDelta - plane.normal.xyz * signedHeight) > 0.000001;
        let useClosestPoint = signedHeight > 0.0 || outsideEdge;
        let rectangleNormal = select(plane.normal.xyz, floorDelta / max(floorDistance, 0.000001), useClosestPoint);
        let penetration = select(sphere.w - signedHeight, sphere.w - floorDistance, useClosestPoint);
        point += rectangleNormal * max(penetration, 0.0);
        // An optional raised cushion nose couples follow/draw into the normal rebound.
        // Collision detection still uses the rectangle; this is a rigid impulse approximation.
        let upward = -settings.gravity.xyz + rectangleNormal * dot(settings.gravity.xyz, rectangleNormal);
        let height = select(0.0, plane.response.x, length(upward) > 0.000001);
        let normal = rectangleNormal * sqrt(1.0 - height * height) -
          upward / max(length(upward), 0.000001) * height;
        let arm = -normal * sphere.w;
        let relative = linearVelocity + cross(angularVelocity, arm);
        let closing = dot(relative, normal);
        let restitution = plane.material.x / (1.0 + plane.response.y * max(-closing, 0.0));
        let bounce = select(0.0, -restitution * closing, closing < -settings.solver.y);
        let normalArm = cross(arm, normal);
        let normalMass = velocity.w + inverseInertia * dot(normalArm, normalArm);
        let normalImpulse = max((bounce - closing) / normalMass, 0.0);
        linearVelocity += normal * normalImpulse * velocity.w;
        angularVelocity += normalArm * normalImpulse * inverseInertia;
        // Friction uses the post-impact contact velocity and its directional effective mass.
        let surfaceVelocity = linearVelocity + cross(angularVelocity, arm);
        let tangent = surfaceVelocity - normal * dot(surfaceVelocity, normal);
        let tangentDirection = tangent / max(length(tangent), 0.000001);
        let tangentArm = cross(arm, tangentDirection);
        let tangentMass = velocity.w + inverseInertia * dot(tangentArm, tangentArm);
        let tangentImpulse = getFrictionImpulse(surfaceVelocity, normal, normalImpulse, tangentMass, plane.material.y, plane.material.z);
        linearVelocity += tangentImpulse * velocity.w;
        angularVelocity += cross(arm, tangentImpulse) * inverseInertia;
      }
    }
  }
  outputPositions[index] = vec4f(point, sphere.w);
  outputVelocities[index] = vec4f(linearVelocity, velocity.w);
  outputAngularVelocities[index] = vec4f(angularVelocity, angular.w);
}
`,_u=`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> orientations: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> sleepStates: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> diagnostics: array<atomic<u32>>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  if(clock.timeStep <= 0.0) {return;}
  let sphere = positions[index]; var velocity = velocities[index];
  var angular = angularVelocities[index]; var sleep = sleepStates[index];
  var orientation = orientations[index];
  if (dot(orientation, orientation) < 0.000001) { orientation = vec4f(0.0, 0.0, 0.0, 1.0); }
  if (velocity.w <= 0.0 || !isValidSphere(sphere)) {
    orientations[index] = normalize(orientation);
    return;
  }
  var grounded = false;
  var supportNormal = vec3f(0.0, 0.0, 1.0);
  var rollingResistance = 0.0;
  var spinningResistance = 0.0;
  var supportWeight = -1e30;
  for (var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
    let plane = settings.planes[planeIndex];
    if (length(getPlaneDelta(sphere.xyz, plane)) <= sphere.w + settings.solver.z &&
      dot(sphere.xyz, plane.normal.xyz) - plane.normal.w >= 0.0) {
      grounded = true;
      let weight = dot(plane.normal.xyz, -settings.gravity.xyz);
      if (weight > supportWeight) {supportWeight = weight; supportNormal = plane.normal.xyz; rollingResistance = plane.material.w; spinningResistance = plane.center.w;}
    }
  }

  // Only fixed-plane support can authorize sleep. Dynamic contact cycles are not
  // evidence of support: an airborne pair must keep integrating gravity.
  if (grounded) {
    let normalVelocity = supportNormal * dot(velocity.xyz, supportNormal);
    let tangentVelocity = velocity.xyz - normalVelocity;
    let normalSpin = supportNormal * dot(angular.xyz, supportNormal);
    let rollingAngular = angular.xyz - normalSpin;
    let slip = tangentVelocity + cross(rollingAngular, -supportNormal * sphere.w);
    // Sliding friction already exchanges translation and spin in the contact solver.
    // Apply rolling resistance only after reaching no-slip, without damping sidespin.
    if (length(slip) <= 0.0001) {
      let speed = length(tangentVelocity);
      let damping = max(0.0, 1.0 - rollingResistance * max(supportWeight, 0.0) * clock.timeStep / max(speed, 0.000001));
      velocity = vec4f(normalVelocity + tangentVelocity * damping, velocity.w);
      angular = vec4f(normalSpin + rollingAngular * damping, angular.w);
    }
    let spin = dot(angular.xyz, supportNormal);
    let spinLoss = spinningResistance * max(supportWeight, 0.0) * clock.timeStep / sphere.w;
    angular = vec4f(angular.xyz - supportNormal * sign(spin) * min(abs(spin), spinLoss), angular.w);
  }
  if (grounded && length(velocity.xyz) < settings.resting.y && length(angular.xyz) < settings.resting.z) {
    sleep.x += clock.timeStep;
  } else { sleep.x = 0.0; }
  if (settings.solver.x > 0.0 && sleep.x >= settings.solver.x) {
    velocity = vec4f(0.0, 0.0, 0.0, velocity.w); angular = vec4f(0.0);
    atomicAdd(&diagnostics[4], 1u);
  } else { atomicAdd(&diagnostics[3], 1u); }
  let derivative = vec4f(orientation.w * angular.xyz + cross(angular.xyz, orientation.xyz), -dot(angular.xyz, orientation.xyz));
  orientations[index] = normalize(orientation + derivative * (0.5 * clock.timeStep));
  velocities[index] = velocity; angularVelocities[index] = angular; sleepStates[index] = sleep;
}
`,vu=`
struct Command {control: vec4f, value: vec4f, point: vec4f, orientation: vec4f, reserved: vec4f};
@group(0) @binding(0) var<uniform> command: Command;
@group(0) @binding(1) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> orientations: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> sleepStates: array<vec4f>;
@compute @workgroup_size(1) fn main() {
  let index = u32(command.control.x); let operation = u32(command.control.y);
  var sphere = positions[index]; var velocity = velocities[index]; var angular = angularVelocities[index];
  if (operation == 1u && sphere.w > 0.0 && velocity.w > 0.0) {
    let inverseInertia = 2.5 * velocity.w / (sphere.w * sphere.w);
    velocity = vec4f(velocity.xyz + command.value.xyz * velocity.w, velocity.w);
    if (command.control.z > 0.0) {
      angular = vec4f(angular.xyz + cross(command.point.xyz - sphere.xyz, command.value.xyz) * inverseInertia, angular.w);
    }
  }
  if (operation == 2u && sphere.w > 0.0 && velocity.w > 0.0) {
    let inverseInertia = 2.5 * velocity.w / (sphere.w * sphere.w);
    angular = vec4f(angular.xyz + command.value.xyz * inverseInertia, angular.w);
  }
  if (operation == 4u) {
    sphere = vec4f(command.value.xyz, sphere.w); orientations[index] = normalize(command.orientation);
  }
  if (operation == 5u) {sphere.w = abs(sphere.w) * command.value.x;}
  if (operation == 4u || operation == 5u) {velocity = vec4f(0.0, 0.0, 0.0, velocity.w); angular = vec4f(0.0);}
  positions[index] = sphere; velocities[index] = velocity; angularVelocities[index] = angular;
  sleepStates[index] = vec4f(0.0);
}
`,yu=`
struct PersistentContact {
 identity: vec2u, impulse: f32, step: u32,
 tangent: vec4f, normal: vec4f,
};
`;function bu(e,t){for(let[n,r]of t)h(e.indexOf(n)>=0&&e.indexOf(n)===e.lastIndexOf(n)),e=e.replace(n,r);return e}function xu(e,t=!1){let n=bu(e,[[`array<vec2u>`,`array<PersistentContact>`]]).replaceAll(`contact.x`,`contact.identity.x`).replaceAll(`contact.y`,`contact.identity.y`);return t&&(n=bu(n,[[`= vec2u(other, bitcast<u32>(bounce));`,`= PersistentContact(vec2u(other, bitcast<u32>(bounce)), 0.0, 0u, vec4f(0.0), vec4f(0.0));`]])),yu+n}var Su=`
@group(0) @binding(5) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(6) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> contacts: array<PersistentContact>;
@group(0) @binding(4) var<storage, read> cache: array<PersistentContact>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT || clock.timeStep <= 0.0) {return;}
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let other = contacts[cursor].identity.x;
  let normal = getContactNormal(positions[index].xyz - positions[other].xyz, index, other);
  let previous = cache[index * (BODY_COUNT + 32u) + other];
  // Reject stale pairs, changed normals and restitution impacts. Never seed a new impact.
  if(ALLOW_WARM && distance(positions[index].xyz, positions[other].xyz) <= positions[index].w + positions[other].w &&
     previous.step == clock.step - 1u && previous.tangent.w > 0.0 &&
     dot(previous.normal.xyz, normal) > 0.98 && bitcast<f32>(contacts[cursor].identity.y) == 0.0) {
   let scale = min(clock.timeStep / previous.tangent.w, 1.0);
   contacts[cursor].impulse = previous.impulse * scale;
   let tangent = previous.tangent.xyz - normal * dot(previous.tangent.xyz, normal);
   contacts[cursor].tangent = vec4f(tangent * scale, 0.0);
  }
  contacts[cursor].normal = vec4f(normal, 0.0);
 }
 let sphere = positions[index];
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  let slot = BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex;
  var contact = PersistentContact(vec2u(planeIndex, 0u), 0.0, 0u, vec4f(0.0), vec4f(0.0));
  let plane = settings.planes[planeIndex]; let delta = getPlaneDelta(sphere.xyz, plane);
  let signedHeight = dot(sphere.xyz, plane.normal.xyz) - plane.normal.w;
  if(isValidSphere(sphere) && velocities[index].w > 0.0 && signedHeight > -sphere.w && length(delta) <= sphere.w) {
   let outsideEdge = length(delta - plane.normal.xyz * signedHeight) > 0.000001;
   let rectangleNormal = select(plane.normal.xyz, delta / max(length(delta), 0.000001), signedHeight > 0.0 || outsideEdge);
   let upward = -settings.gravity.xyz + rectangleNormal * dot(settings.gravity.xyz, rectangleNormal);
   let height = select(0.0, plane.response.x, length(upward) > 0.000001);
   let normal = rectangleNormal * sqrt(1.0 - height * height) - upward / max(length(upward), 0.000001) * height;
   let relative = velocities[index].xyz + cross(angularVelocities[index].xyz, -normal * sphere.w);
   let closing = dot(relative, normal);
   let restitution = plane.material.x / (1.0 + plane.response.y * max(-closing, 0.0));
   let bounce = select(0.0, -restitution * closing, closing < -settings.solver.y);
   contact.identity.y = bitcast<u32>(bounce);
   contact.normal = vec4f(normal, 1.0);
   let previous = cache[index * (BODY_COUNT + 32u) + BODY_COUNT + planeIndex];
   if(ALLOW_WARM && previous.step == clock.step - 1u && previous.tangent.w > 0.0 &&
      dot(previous.normal.xyz, normal) > 0.98 && bounce == 0.0) {
    let scale = min(clock.timeStep / previous.tangent.w, 1.0);
    contact.impulse = previous.impulse * scale;
    contact.tangent = vec4f((previous.tangent.xyz - normal * dot(previous.tangent.xyz, normal)) * scale, 0.0);
   }
  }
  contacts[slot] = contact;
 }
}
`,Cu=`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read> offsets: array<u32>;
@group(0) @binding(5) var<storage, read> contacts: array<PersistentContact>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT || clock.timeStep <= 0.0) {return;}
 let sphere = positions[index]; let inverseMass = velocities[index].w;
 if(!isValidSphere(sphere) || inverseMass <= 0.0) {return;}
 var linear = vec3f(0.0); var angular = vec3f(0.0);
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let contact = contacts[cursor]; let normal = contact.normal.xyz;
  linear += (normal * contact.impulse + contact.tangent.xyz) * inverseMass;
  angular += cross(-normal * sphere.w, contact.tangent.xyz) * 2.5 * inverseMass / (sphere.w * sphere.w);
 }
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  let contact = contacts[BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex];
  if(contact.normal.w == 0.0) {continue;}
  linear += (contact.normal.xyz * contact.impulse + contact.tangent.xyz) * inverseMass;
  angular += cross(-contact.normal.xyz * sphere.w, contact.tangent.xyz) * 2.5 * inverseMass / (sphere.w * sphere.w);
 }
 velocities[index] = vec4f(velocities[index].xyz + linear, inverseMass);
 angularVelocities[index] = vec4f(angularVelocities[index].xyz + angular, angularVelocities[index].w);
}
`;function wu(e){return bu(xu(e),[[`var<storage, read> contacts:`,`var<storage, read_write> contacts:`],[`if (distance > sphere.w + neighbor.w) { continue; }`,`if (distance > sphere.w + neighbor.w && contact.impulse == 0.0 && all(contact.tangent.xyz == vec3f(0.0))) { continue; }`],[`if (signedHeight > -sphere.w && floorDistance <= sphere.w) {`,`if ((signedHeight > -sphere.w && floorDistance <= sphere.w) || contacts[BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex].impulse > 0.0) {`],[`let normalImpulse = max((bitcast<f32>(contact.identity.y) - dot(relative, normal)) / inverseMass, 0.0);`,`
      let accumulatedNormal = max(contact.impulse +
        (bitcast<f32>(contact.identity.y) - dot(relative, normal)) / inverseMass * relaxation, 0.0);
      let normalImpulse = accumulatedNormal - contact.impulse;`],[`let tangentImpulse = getFrictionImpulse(frictionRelative, normal, normalImpulse, 3.5 * inverseMass, settings.material.z, settings.material.w);`,`
      let slip = frictionRelative - normal * dot(frictionRelative, normal);
      var accumulatedTangent = contact.tangent.xyz - slip / (3.5 * inverseMass) * relaxation;
      let tangentLength = length(accumulatedTangent);
      let frictionLimit = select(settings.material.w * accumulatedNormal,
        tangentLength, tangentLength <= settings.material.z * accumulatedNormal);
      accumulatedTangent *= min(1.0, frictionLimit / max(tangentLength, 0.0000001));
      let tangentImpulse = accumulatedTangent - contact.tangent.xyz;
      contacts[cursor].impulse = accumulatedNormal;
      contacts[cursor].tangent = vec4f(accumulatedTangent, clock.timeStep);
      contacts[cursor].normal = vec4f(normal, 0.0);
      contacts[cursor].step = clock.step;`],[`(normal * normalImpulse + tangentImpulse) * velocity.w * relaxation`,`(normal * normalImpulse + tangentImpulse) * velocity.w`],[`tangentImpulse) * inverseInertia * relaxation`,`tangentImpulse) * inverseInertia`],[`let normalImpulse = max((bounce - closing) / normalMass, 0.0);`,`
        let planeSlot = BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex;
        var constraint = contacts[planeSlot];
        // Position corrections can create a surface contact after the restore pass.
        // Capture its first impact target now, and retain it in subsequent iterations.
        if (constraint.normal.w == 0.0) {
          constraint.identity.y = bitcast<u32>(bounce);
          constraint.normal = vec4f(normal, 1.0);
          contacts[planeSlot] = constraint;
        }
        // Existing contacts keep the target captured before warm impulses.
        let accumulatedNormal = max(constraint.impulse +
          (bitcast<f32>(constraint.identity.y) - closing) / normalMass, 0.0);
        let normalImpulse = accumulatedNormal - constraint.impulse;`],[`let tangentImpulse = getFrictionImpulse(surfaceVelocity, normal, normalImpulse, tangentMass, plane.material.y, plane.material.z);`,`
        var accumulatedTangent = constraint.tangent.xyz - tangent / tangentMass;
        let tangentLength = length(accumulatedTangent);
        let frictionLimit = select(plane.material.z * accumulatedNormal, tangentLength,
          tangentLength <= plane.material.y * accumulatedNormal);
        accumulatedTangent *= min(1.0, frictionLimit / max(tangentLength, 0.0000001));
        let tangentImpulse = accumulatedTangent - constraint.tangent.xyz;
        contacts[planeSlot].impulse = accumulatedNormal;
        contacts[planeSlot].tangent = vec4f(accumulatedTangent, clock.timeStep);
        contacts[planeSlot].normal = vec4f(normal, 1.0);
        contacts[planeSlot].step = clock.step;`]])}var Tu=`
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
@group(0) @binding(2) var<storage, read> contacts: array<PersistentContact>;
@group(0) @binding(3) var<storage, read_write> cache: array<PersistentContact>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT || clock.timeStep <= 0.0) {return;}
 // Expire absent pairs too: a contact from an earlier impact interval is not
 // evidence of support at the end of this fixed step. Each invocation owns a row.
 for(var targetIndex = 0u; targetIndex < BODY_COUNT + 32u; targetIndex++) {
  cache[index * (BODY_COUNT + 32u) + targetIndex].step = 0u;
  cache[index * (BODY_COUNT + 32u) + targetIndex].tangent.w = 0.0;
 }
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let contact = contacts[cursor];
  cache[index * (BODY_COUNT + 32u) + contact.identity.x] = contact;
 }
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  cache[index * (BODY_COUNT + 32u) + BODY_COUNT + planeIndex] =
    contacts[BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex];
 }
}
`;function Eu(){return`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> outputClock: Clock;
fn sphereTime(delta: vec3f, velocity: vec3f, radius: f32, limit: f32) -> f32 {
 let squaredSpeed = dot(velocity, velocity);
 let closing = dot(delta, velocity);
 let separation = dot(delta, delta) - radius * radius;
 if(closing >= 0.0 || squaredSpeed <= 0.0) {return limit;}
 let nudge = min(settings.material.x * 0.0001, radius * 0.001 / sqrt(squaredSpeed));
 if(separation <= 0.0) {return min(limit, nudge);}
 // Closest approach avoids subtracting two large nearly equal quadratic terms
 // when a very small sphere grazes a collider after travelling a long distance.
 let closestTime = -closing / squaredSpeed;
 let closestPoint = delta + velocity * closestTime;
 let radialSquared = radius * radius - dot(closestPoint, closestPoint);
 if(radialSquared <= 0.0) {return limit;}
 let halfWidth = sqrt(radialSquared / squaredSpeed);
 return min(limit, max(0.0, closestTime - halfWidth) + min(nudge, halfWidth * 0.5));
}
fn segmentTime(point: vec3f, velocity: vec3f, start: vec3f, end: vec3f, radius: f32, limit: f32) -> f32 {
 let axis = end - start; let squaredLength = dot(axis, axis);
 let relative = point - start;
 let perpendicular = relative - axis * dot(relative, axis) / squaredLength;
 let perpendicularVelocity = velocity - axis * dot(velocity, axis) / squaredLength;
 var time = sphereTime(perpendicular, perpendicularVelocity, radius, limit);
 let along = dot(relative + velocity * time, axis) / squaredLength;
 if(along < 0.0 || along > 1.0) {time = limit;}
 time = sphereTime(point - start, velocity, radius, time);
 return sphereTime(point - end, velocity, radius, time);
}
@compute @workgroup_size(1) fn main() {
 let remaining = outputClock.remaining;
 if(remaining <= 0.0) {outputClock.timeStep = 0.0; return;}
 var time = remaining;
 for(var first = 0u; first < BODY_COUNT; first++) {
  let sphere = positions[first];
  if(!isValidSphere(sphere) || velocities[first].w <= 0.0) {continue;}
  let velocity = velocities[first].xyz + settings.gravity.xyz * remaining;
  for(var second = 0u; second < BODY_COUNT; second++) {
   let neighbor = positions[second];
   if(first == second || !isValidSphere(neighbor)) {continue;}
   let otherVelocity = select(vec3f(0.0), velocities[second].xyz + settings.gravity.xyz * remaining, velocities[second].w > 0.0);
   let delta = sphere.xyz - neighbor.xyz;
   let radius = sphere.w + neighbor.w;
   let normal = getContactNormal(delta, first, second);
   let actualOther = select(vec3f(0.0), velocities[second].xyz, velocities[second].w > 0.0);
   let actualClosing = dot(velocities[first].xyz - actualOther, normal);
   // A touching pair already at rest must not repeatedly stop the whole world's clock
   // just because gravity was included in the conservative sweep velocity.
   if(length(delta) <= radius + settings.solver.z && actualClosing >= -radius * 0.00001 / settings.material.x && length(settings.gravity.xyz) * remaining * remaining < radius * 0.25) {continue;}
   time = sphereTime(delta, velocity - otherVelocity, radius, time);
  }
  for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
   let plane = settings.planes[planeIndex];
   let height = dot(sphere.xyz, plane.normal.xyz) - plane.normal.w;
   let closing = dot(velocity, plane.normal.xyz);
   if(height < -sphere.w) {continue;}
   // Supported resting contacts are resolved by the discrete solver, without stalling time.
   if(abs(height - sphere.w) <= settings.solver.z && dot(velocities[first].xyz, plane.normal.xyz) >= -sphere.w * 0.00001 / settings.material.x && length(settings.gravity.xyz) * remaining * remaining < sphere.w * 0.25) {continue;}
   if(closing < -0.000001) {
    let candidate = max(0.0, (sphere.w - height) / closing);
    let point = sphere.xyz + velocity * candidate;
    let relative = point - plane.center.xyz;
    if(abs(dot(relative, plane.right.xyz)) <= plane.right.w && abs(dot(relative, plane.forward.xyz)) <= plane.forward.w) {
     let nudge = min(settings.material.x * 0.0001, sphere.w * 0.001 / max(length(velocity), 0.0000001));
     time = min(time, candidate + nudge);
    }
   }
   // Four swept edge capsules also cover corner spheres. Infinite planes skip this work.
   if(plane.right.w < 1e9 && plane.forward.w < 1e9) {
    for(var edge = 0u; edge < 4u; edge++) {
     let side = select(-1.0, 1.0, edge % 2u == 1u);
     let horizontal = edge < 2u;
     let midpoint = plane.center.xyz + select(plane.forward.xyz * plane.forward.w, plane.right.xyz * plane.right.w, horizontal) * side;
     let extent = select(plane.right.xyz * plane.right.w, plane.forward.xyz * plane.forward.w, horizontal);
     time = segmentTime(sphere.xyz, velocity, midpoint - extent, midpoint + extent, sphere.w, time);
    }
   }
  }
 }
 // Each root already includes a scale- and contact-window-bounded nudge.
 let progress = min(remaining, time);
 outputClock = Clock(progress, max(0.0, remaining - progress), outputClock.step, 0u);
}
`}function Du(e,t){return`
@group(0) @binding(1) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> previousPositions: array<vec4f>;
@group(0) @binding(4) var<storage, read> previousVelocities: array<vec4f>;
@group(0) @binding(5) var<storage, read> offsets: array<u32>;
@group(0) @binding(6) var<storage, read> contacts: array<vec2u>;
@group(0) @binding(7) var<storage, read_write> events: array<atomic<u32>>;
@group(0) @binding(8) var<storage, read_write> contactStates: array<u32>;
fn isContactBegin(body: u32, counterpart: u32) -> bool {
 let offset = body * (BODY_COUNT + 32u) + counterpart;
 let previous = contactStates[offset];
 contactStates[offset] = clock.step;
 return previous == 0u || (previous != clock.step && previous != clock.step - 1u);
}
fn emit(body: u32, kind: u32, counterpart: u32, point: vec3f, speed: f32) {
 let sequence = atomicAdd(&events[0], 1u);
 let offset = 4u + (sequence % ${e}u) * 8u;
 atomicStore(&events[offset], sequence);
 atomicStore(&events[offset + 1u], clock.step);
 atomicStore(&events[offset + 2u], (kind << 24u) | body);
 atomicStore(&events[offset + 3u], counterpart);
 atomicStore(&events[offset + 4u], bitcast<u32>(point.x));
 atomicStore(&events[offset + 5u], bitcast<u32>(point.y));
 atomicStore(&events[offset + 6u], bitcast<u32>(point.z));
 atomicStore(&events[offset + 7u], bitcast<u32>(speed));
}
@compute @workgroup_size(1) fn main() {
 if(clock.timeStep <= 0.0) {return;}
 for(var index = 0u; index < BODY_COUNT; index++) {
 let sphere = positions[index]; let before = previousPositions[index];
 if(!isValidSphere(before)) {continue;}
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let contact = contacts[cursor];
  let normal = getContactNormal(before.xyz - previousPositions[contact.x].xyz, index, contact.x);
  let closing = -dot(previousVelocities[index].xyz - previousVelocities[contact.x].xyz, normal);
  if(index < contact.x && distance(sphere.xyz, positions[contact.x].xyz) <= sphere.w + abs(positions[contact.x].w) + settings.solver.z) {
   let begin = isContactBegin(index, contact.x);
   if(begin || closing > 0.001) {emit(index | select(0u, 0x800000u, begin), 0u, contact.x, sphere.xyz, max(closing, 0.0));}
  }
 }
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  let plane = settings.planes[planeIndex];
  let closing = -dot(previousVelocities[index].xyz, plane.normal.xyz);
  if(length(getPlaneDelta(sphere.xyz, plane)) <= sphere.w + settings.solver.z) {
   let begin = isContactBegin(index, BODY_COUNT + planeIndex);
   if(begin || closing > settings.solver.y) {emit(index | select(0u, 0x800000u, begin), 1u, planeIndex, sphere.xyz, max(closing, 0.0));}
  }
 }
 ${t.map((e,t)=>`
  {
   let center = vec3f(${e.center.map(e=>e.toExponential(8)).join(`, `)});
   let delta = sphere.xyz - before.xyz;
   let squaredTravel = dot(delta, delta);
   var fraction = 0.0;
   if(squaredTravel > 0.0) {fraction = clamp(dot(center - before.xyz, delta) / squaredTravel, 0.0, 1.0);}
   if(distance(before.xyz + delta * fraction, center) <= ${e.radius.toExponential(8)} ${e.capture?``:`&& distance(before.xyz, center) > ${e.radius.toExponential(8)}`}) {
    emit(index | 0x800000u, 2u, ${t}u, sphere.xyz, 0.0);
    ${e.capture?`positions[index].w = -sphere.w; velocities[index] = vec4f(0.0, 0.0, 0.0, velocities[index].w);`:``}
   }
  }`).join(`
`)}
 if(index == 0u && positions[index].w > 0.0 && distance(before.xyz, sphere.xyz) > 0.00001) {emit(index, 3u, 0u, sphere.xyz, 0.0);}
 }
}
`}function Ou(e,t=0){let n=(e.length-4)/8,r=e[0],i=r-t>>>0,a=Math.min(i,n),o=new Float32Array(e.buffer,e.byteOffset,e.length),s=[],c=[`sphere-impact`,`plane-impact`,`trigger`,`trail`];for(let t=a;t>0;t--){let i=r-t>>>0,a=4+i%n*8,l=e[a+2];s.push({sequence:i,step:e[a+1],kind:c[l>>>24],phase:l&8388608?`begin`:`impact`,body:l&8388607,target:e[a+3],position:[o[a+4],o[a+5],o[a+6]],speed:o[a+7]})}return{sequence:r,dropped:Math.max(0,i-n),exhaustedImpactSteps:e[1],discardedSimulationTime:o[2],events:s}}function ku(e){return{droppedContacts:e[0],invalidBodies:e[1],contacts:e[2],awakeBodies:e[3],sleepingBodies:e[4],candidateTests:e[5],maximumContacts:e[6],exhaustedImpactSteps:e[7]&1,exhaustedCandidateBodies:e[7]>>>1}}var Au=class{id;count;positions;velocities;orientations;angularVelocities;sleepStates;diagnostics;timeStep;substeps;iterations;maximumRadius;maximumContacts;contactSkin;maximumCandidateTests;broadPhase;parameters;continuous;maximumImpactSteps;warmStarting;contactCache;eventCapacity;triggers;events;eventCursor=0;eventRead;settings;commandSettings;bodyControl;ownedBuffers=[];added=!1;wakeRevision=1;constructor(e){if(this.id=e.id??`gpu-sphere-world`,this.count=e.count,this.positions=e.positions,this.velocities=e.velocities,this.orientations=e.orientations,this.angularVelocities=e.angularVelocities,this.sleepStates=e.sleepStates,this.diagnostics=e.diagnostics,this.timeStep=e.timeStep??1/120,this.substeps=e.substeps??1,this.iterations=e.iterations??8,this.maximumRadius=e.maximumRadius??1,this.maximumContacts=e.maximumContacts??32,this.contactSkin=e.contactSkin??this.maximumRadius*.01,this.maximumCandidateTests=e.maximumCandidateTests??0,!Number.isInteger(this.maximumCandidateTests)||this.maximumCandidateTests<0||this.maximumCandidateTests>1e6)throw Error(`Invalid sphere candidate budget`);if(this.broadPhase=e.broadPhase??`grid`,this.continuous=e.continuous??!1,this.warmStarting=e.warmStarting??!1,this.maximumImpactSteps=e.maximumImpactSteps??4,this.eventCapacity=e.eventCapacity??0,this.triggers=e.triggers??[],(this.continuous||this.warmStarting||this.eventCapacity>0)&&this.count>256||!Number.isInteger(this.maximumImpactSteps)||this.maximumImpactSteps<1||this.maximumImpactSteps>16||!Number.isInteger(this.eventCapacity)||this.eventCapacity<0||this.eventCapacity>65536||this.eventCapacity>0&&this.eventCapacity&this.eventCapacity-1||this.triggers.length>32||this.triggers.length>0&&!this.eventCapacity||this.triggers.some(e=>![...e.center,e.radius].every(Number.isFinite)||e.radius<=0))throw Error(`Invalid sphere sweep or event capacity`);for(let[e,t]of[[this.count,1e6],[this.substeps,64],[this.iterations,64],[this.maximumContacts,256]])if(!Number.isSafeInteger(e)||e<1||e>t)throw Error(`Invalid sphere world capacity`);if(!(this.timeStep>0)||!Number.isFinite(this.timeStep)||!(this.maximumRadius>0)||!Number.isFinite(this.maximumRadius)||!(this.contactSkin>=0)||!Number.isFinite(this.contactSkin))throw Error(`Invalid sphere world step or radius`);if(![`grid`,`all-pairs`].includes(this.broadPhase)||this.broadPhase===`all-pairs`&&this.count>256)throw Error(`Invalid sphere broad phase`);this.parameters={gravity:e.gravity??[0,0,-9.81],plane:e.plane??{offset:e.floor??0},planes:e.planes,restitution:e.restitution??.45,staticFriction:e.staticFriction??Math.max(.5,e.dynamicFriction??(e.friction===void 0?.35:1-e.friction)),dynamicFriction:e.dynamicFriction??(e.friction===void 0?Math.min(.35,e.staticFriction??.5):1-e.friction),rollingResistance:e.rollingResistance??.025,sleepAfter:e.sleepAfter??.75,sleepLinearSpeed:e.sleepLinearSpeed??.025,sleepAngularSpeed:e.sleepAngularSpeed??.05,restitutionThreshold:e.restitutionThreshold??.5,cutInducedThrow:e.cutInducedThrow??!0,spinInducedThrow:e.spinInducedThrow??!0},this.update({});let t=[e.positions,e.velocities,e.orientations,e.angularVelocities,e.sleepStates,e.diagnostics].filter(e=>!!e);if(new Set(t).size!==t.length)throw Error(`Sphere state buffers must not alias`);for(let n of t){let t=n===e.diagnostics?32:this.count*16;if(n.byteLength<t||!(n.usage&N.STORAGE))throw Error(`Sphere state requires packed STORAGE buffers`)}}get gravity(){return this.parameters.gravity}get restitution(){return this.parameters.restitution}get floor(){return this.parameters.plane.offset??0}get friction(){return 1-this.parameters.dynamicFriction}update(e){let t={...this.parameters,...e,plane:{...this.parameters.plane,...e.plane}},n=t.plane.normal??[0,0,1];if(![...t.gravity,...n,t.plane.offset??0,...t.plane.halfExtents??[1,1]].every(Number.isFinite)||Math.hypot(...n)<1e-6)throw Error(`Invalid sphere plane or gravity`);if(t.plane.halfExtents?.some(e=>e<=0))throw Error(`Plane half extents must be positive`);for(let e of[t.restitution,t.staticFriction,t.dynamicFriction,t.rollingResistance,t.sleepAfter,t.sleepLinearSpeed,t.sleepAngularSpeed,t.restitutionThreshold])if(!Number.isFinite(e)||e<0)throw Error(`Invalid sphere material`);if(t.restitution>1||t.dynamicFriction>t.staticFriction)throw Error(`Invalid sphere friction or restitution`);let r=t.planes??[t.plane];if(r.length>32)throw Error(`Too many sphere planes`);for(let e of r){let n=e.normal??[0,0,1],r=[e.restitution??t.restitution,e.staticFriction??t.staticFriction,e.dynamicFriction??t.dynamicFriction,e.rollingResistance??t.rollingResistance,e.spinningResistance??0,e.contactHeightRatio??0,e.restitutionVelocityScale??0];if(![...n,...e.center??[0,0,0],e.offset??0,...e.halfExtents??[1,1],...r].every(Number.isFinite)||Math.hypot(...n)<1e-6||e.halfExtents?.some(e=>e<=0)||r.some(e=>e<0)||r[0]>1||r[5]>=1||r[2]>r[1])throw Error(`Invalid sphere plane material or geometry`)}let i=this.parameters,a=e=>[...e.gravity,...e.plane.normal??[0,0,1],e.plane.offset??0,...e.plane.halfExtents??[1e10,1e10],e.staticFriction,e.dynamicFriction,e.rollingResistance,Number(e.cutInducedThrow),Number(e.spinInducedThrow),...(e.planes??[e.plane]).flatMap(t=>[...t.normal??[0,0,1],...ju(t),t.offset??0,...t.halfExtents??[1e10,1e10],t.restitution??e.restitution,t.staticFriction??e.staticFriction,t.dynamicFriction??e.dynamicFriction,t.rollingResistance??e.rollingResistance,t.spinningResistance??0,t.contactHeightRatio??0,t.restitutionVelocityScale??0])],o=a(i);(a(t).length!==o.length||a(t).some((e,t)=>Math.abs(e-o[t])>1e-5))&&(this.wakeRevision=this.wakeRevision%16e6+1),this.parameters={...t,gravity:[...t.gravity],planes:t.planes?.map(e=>({...e,normal:e.normal?[...e.normal]:void 0,center:e.center?[...e.center]:void 0,halfExtents:e.halfExtents?[...e.halfExtents]:void 0})),plane:{...t.plane,center:t.plane.center?[...t.plane.center]:void 0,normal:[...n],halfExtents:t.plane.halfExtents?[...t.plane.halfExtents]:void 0}},this.writeSettings()}addToGraph(e){if(this.added)throw Error(`Sphere world has already been added to a graph`);if(Math.ceil(this.count/64)>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Sphere world exceeds device dispatch limits`);if(Math.max(this.count*16,this.count*(this.warmStarting?(this.maximumContacts+32)*48:this.maximumContacts*8),this.warmStarting?this.count*(this.count+32)*48:0,32,this.eventCapacity?16+this.eventCapacity*32:0,this.eventCapacity?this.count*(this.count+32)*4:0)>e.device.limits.maxStorageBufferBindingSize)throw Error(`Sphere world exceeds maxStorageBufferBindingSize`);let t=(t,n,r=!1)=>{let i=e.device.createBuffer({id:`${this.id}-${t}`,byteLength:n,usage:(r?N.UNIFORM:N.STORAGE|N.COPY_SRC)|N.COPY_DST});return this.ownedBuffers.push(i),i};this.settings=t(`settings`,3200,!0),this.orientations??=t(`orientations`,this.count*16),this.angularVelocities??=t(`angular-velocities`,this.count*16),this.sleepStates??=t(`sleep-states`,this.count*16),this.diagnostics??=t(`diagnostics`,32);let n=(t,n,r,i=!1)=>e.createDataView(e.importBuffer({id:`${this.id}-${t}`,byteLength:r*16,usage:i?N.UNIFORM:N.STORAGE},n),{format:`float32x4`,length:r}),r=n(`settings`,this.settings,200,!0),i={positions:n(`positions`,this.positions,this.count),velocities:n(`velocities`,this.velocities,this.count),angularVelocities:n(`angular-velocities`,this.angularVelocities,this.count)},a=n(`orientations`,this.orientations,this.count),o=n(`sleep-states`,this.sleepStates,this.count),s=e.createDataView(e.importBuffer({id:`${this.id}-diagnostics`,byteLength:32,usage:N.STORAGE},this.diagnostics),{format:`uint32`,length:8}),c={positions:V(e,`${this.id}-predicted-positions`,`float32x4`,this.count),velocities:V(e,`${this.id}-predicted-velocities`,`float32x4`,this.count),angularVelocities:V(e,`${this.id}-predicted-angular`,`float32x4`,this.count)},l=V(e,`${this.id}-keys`,`uint32`,this.count),u=V(e,`${this.id}-values`,`uint32`,this.count),d=V(e,`${this.id}-sorted-keys`,`uint32`,this.count),f=V(e,`${this.id}-sorted-bodies`,`uint32`,this.count),p=V(e,`${this.id}-counts`,`uint32`,this.count),m=V(e,`${this.id}-offsets`,`uint32`,this.count+1),h=V(e,`${this.id}-contacts`,`uint32x2`,this.count*(this.warmStarting?(this.maximumContacts+32)*6:this.maximumContacts)),g;this.warmStarting&&(this.contactCache=t(`contact-cache`,this.count*(this.count+32)*48),g=n(`contact-cache`,this.contactCache,this.count*(this.count+32)*3));let _=e.device.createBuffer({id:`${this.id}-clock`,byteLength:16,usage:N.UNIFORM|N.STORAGE|N.COPY_DST});this.ownedBuffers.push(_);let v=e.createDataView(e.importBuffer({id:`${this.id}-clock`,byteLength:16,usage:N.STORAGE|N.UNIFORM},_),{format:`float32x4`,length:1}),y=V(e,`${this.id}-previous-positions`,`float32x4`,this.count),b=V(e,`${this.id}-previous-velocities`,`float32x4`,this.count),x,S;if(this.eventCapacity){let n=t(`contact-states`,this.count*(this.count+32)*4);S=e.createDataView(e.importBuffer({id:`${this.id}-contact-states`,byteLength:n.byteLength,usage:N.STORAGE},n),{format:`uint32`,length:this.count*(this.count+32)}),this.events=t(`events`,16+this.eventCapacity*32),x=e.createDataView(e.importBuffer({id:`${this.id}-events`,byteLength:this.events.byteLength,usage:N.STORAGE},this.events),{format:`uint32`,length:this.events.byteLength/4})}let C=fu(this.count,this.maximumRadius,this.maximumContacts,this.contactSkin,this.maximumCandidateTests),w=(e,t,n,r=`read`)=>({name:e,view:t,location:n,access:r}),T={clear:`Reset diagnostics for this simulation substep.`,begin:`Initialize the substep clock and remaining simulation time.`,sweep:`Find the earliest swept-sphere impact to avoid tunneling.`,remember:`Save sphere state before speculative integration.`,integrate:`Apply gravity and advance sphere positions.`,cells:`Assign spheres to spatial grid cells for collision detection.`,count:`Count candidate sphere pairs in neighboring cells.`,sentinel:`Write the final candidate-pair offset.`,emit:`Emit candidate sphere pairs from neighboring grid cells.`,restore:`Restore cached contact data to initialize persistent contact constraints.`,warm:`Warm start contacts using impulses from the previous step.`,solve:`Resolve sphere contacts and friction for this solver iteration.`,publish:`Copy solved sphere positions and velocities into the public simulation state.`,store:`Store solved contact impulses for the next step.`,events:`Publish contact events for the application.`,"state-counts":`Count active and sleeping sphere states.`,finalize:`Finalize sphere positions and velocities after contact solving.`,budget:`Record whether the continuous collision impact budget was exhausted.`},E=(t,n,i,a=Math.ceil(this.count/64),o=!0)=>{let s=o&&/\bclock\./.test(n),c=o?[.../\bsettings\./.test(n)?[w(`settings`,r,0,`uniform`)]:[],...s?[w(`clock`,v,9,`uniform`)]:[],...i]:i,l=c.map(e=>({buffer:e.view,usage:e.access===`uniform`?`uniform`:e.access===`read`?`storage-read`:`storage-read-write`})),u={attributes:[],bindings:c.map(e=>{let t={name:e.name,group:0,location:e.location};return e.access===`uniform`?{...t,type:`uniform`}:{...t,type:e.access===`read`?`read-only-storage`:`storage`}})},d={id:`${this.id}-${t}`,source:(s?C:C.replace(`@group(0) @binding(9) var<uniform> clock: Clock;`,``))+n,shaderLayout:u},f=e=>({encode:({computePass:t,getBuffer:n})=>{let r={};for(let e of c)r[e.name]=z(e.view,n);Object.assign(e.bindings,r),e.kernel.dispatch(t,{bindings:e.bindings,x:a,y:1,z:1})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:d.id,description:T[t.replace(/^step-\d+-(?:impact-\d+-)?/,``).replace(/-\d+$/,``)],resources:l,compile:({device:e})=>f(uu(e,d)),compileAsync:async({device:e})=>f(await du(e,d))})};for(let t=0;t<this.substeps;t++){let n=`step-${t}`;E(`${n}-clear`,`@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>; @compute @workgroup_size(8) fn main(@builtin(local_invocation_index) index:u32) {atomicStore(&diagnostics[index], 0u);}`,[w(`diagnostics`,s,1,`write`)],1,!1),E(`${n}-begin`,`
@group(0) @binding(1) var<storage, read_write> outputClock: Clock;
@compute @workgroup_size(1) fn main() {
 outputClock = Clock(settings.material.x, settings.material.x, outputClock.step + 1u, 0u);
}`,[w(`settings`,r,0,`uniform`),w(`outputClock`,v,1,`write`)],1,!1);for(let t=0;t<(this.continuous?this.maximumImpactSteps:1);t++){let _=`${n}-impact-${t}`;this.continuous&&E(`${_}-sweep`,Eu(),[w(`positions`,i.positions,1),w(`velocities`,i.velocities,2),w(`settings`,r,0,`uniform`),w(`outputClock`,v,3,`write`)],1,!1),x&&E(`${_}-remember`,`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> previousPositions: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> previousVelocities: array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT) {return;}
 previousPositions[index] = positions[index]; previousVelocities[index] = velocities[index];
}`,[w(`positions`,i.positions,1),w(`velocities`,i.velocities,2),w(`previousPositions`,y,3,`write`),w(`previousVelocities`,b,4,`write`)],Math.ceil(this.count/64),!1),E(`${_}-integrate`,pu,[w(`positions`,i.positions,1),w(`velocities`,i.velocities,2),w(`angularVelocities`,i.angularVelocities,3),w(`sleepStates`,o,4,`write`),w(`predictedPositions`,c.positions,5,`write`),w(`predictedVelocities`,c.velocities,6,`write`),w(`predictedAngularVelocities`,c.angularVelocities,7,`write`)]),E(`${_}-cells`,mu,[w(`positions`,c.positions,1),w(`keys`,l,2,`write`),w(`values`,u,3,`write`),w(`diagnostics`,s,4,`write`)],Math.ceil(this.count/64),!1),this.broadPhase===`grid`&&dc(e,new Kl({id:`${this.id}-${_}-sort`,keys:l,values:u,outputKeys:d,outputValues:f}).getCommandNodes(e));let C=[w(`positions`,c.positions,1),w(`velocities`,c.velocities,2),...this.broadPhase===`grid`?[w(`sortedKeys`,d,3),w(`sortedBodies`,f,4)]:[],w(`diagnostics`,s,8,`write`)];E(`${_}-count`,hu(`count`,this.broadPhase===`all-pairs`),[...C,w(`counts`,p,5,`write`)]),dc(e,new Sl({id:`${this.id}-${_}-scan`,input:p,output:m}).getCommandNodes(e)),E(`${_}-sentinel`,`@group(0) @binding(1) var<storage, read> counts: array<u32>; @group(0) @binding(2) var<storage, read_write> offsets: array<u32>; @compute @workgroup_size(1) fn main() {offsets[BODY_COUNT] = offsets[BODY_COUNT - 1u] + counts[BODY_COUNT - 1u];}`,[w(`counts`,p,1),w(`offsets`,m,2,`write`)],1,!1),E(`${_}-emit`,this.warmStarting?xu(hu(`emit`,this.broadPhase===`all-pairs`),!0):hu(`emit`,this.broadPhase===`all-pairs`),[...C,w(`offsets`,m,6),w(`contacts`,h,7,`write`)]),g&&(E(`${_}-restore`,yu+`const ALLOW_WARM = ${t===0};`+Su,[w(`positions`,c.positions,1),w(`offsets`,m,2),w(`contacts`,h,3,`write`),w(`cache`,g,4),w(`velocities`,c.velocities,5),w(`angularVelocities`,c.angularVelocities,6)]),E(`${_}-warm`,yu+Cu,[w(`positions`,c.positions,1),w(`velocities`,c.velocities,2,`write`),w(`angularVelocities`,c.angularVelocities,3,`write`),w(`offsets`,m,4),w(`contacts`,h,5)]));let T=this.iterations;for(let e=0;e<T;e++){let t=e%2==0?c:i,n=e%2==0?i:c;E(`${_}-solve-${e}`,this.warmStarting?wu(gu):gu,[w(`positions`,t.positions,1),w(`velocities`,t.velocities,2),w(`angularVelocities`,t.angularVelocities,3),w(`offsets`,m,4),w(`contacts`,h,5,this.warmStarting?`write`:`read`),w(`outputPositions`,n.positions,6,`write`),w(`outputVelocities`,n.velocities,7,`write`),w(`outputAngularVelocities`,n.angularVelocities,8,`write`)])}T%2==0&&E(`${_}-publish`,`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> outputPositions: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> outputVelocities: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> outputAngularVelocities: array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT) {return;}
 outputPositions[index] = positions[index]; outputVelocities[index] = velocities[index]; outputAngularVelocities[index] = angularVelocities[index];
}`,[w(`positions`,c.positions,1),w(`velocities`,c.velocities,2),w(`angularVelocities`,c.angularVelocities,3),w(`outputPositions`,i.positions,4,`write`),w(`outputVelocities`,i.velocities,5,`write`),w(`outputAngularVelocities`,i.angularVelocities,6,`write`)],Math.ceil(this.count/64),!1),g&&E(`${_}-store`,yu+Tu,[w(`offsets`,m,1),w(`contacts`,h,2),w(`cache`,g,3,`write`)]),x&&E(`${_}-events`,this.warmStarting?xu(Du(this.eventCapacity,this.triggers)):Du(this.eventCapacity,this.triggers),[w(`positions`,i.positions,1,`write`),...this.triggers.some(e=>e.capture)?[w(`velocities`,i.velocities,2,`write`)]:[],w(`previousPositions`,y,3),w(`previousVelocities`,b,4),w(`offsets`,m,5),w(`contacts`,h,6),w(`events`,x,7,`write`),w(`contactStates`,S,8,`write`)],1),E(`${_}-state-counts`,`
@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>;
@compute @workgroup_size(1) fn main() {
 if(clock.timeStep > 0.0) {atomicStore(&diagnostics[3], 0u); atomicStore(&diagnostics[4], 0u);}
}`,[w(`diagnostics`,s,1,`write`)],1),E(`${_}-finalize`,_u,[w(`positions`,i.positions,1),w(`velocities`,i.velocities,2,`write`),w(`angularVelocities`,i.angularVelocities,3,`write`),w(`orientations`,a,4,`write`),w(`sleepStates`,o,5,`write`),w(`diagnostics`,s,6,`write`)])}this.continuous&&E(`${n}-budget`,`
@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>;
${x?`@group(0) @binding(2) var<storage, read_write> events: array<atomic<u32>>;`:``}
@compute @workgroup_size(1) fn main() {if(clock.remaining > 0.0) {
 atomicOr(&diagnostics[7], 1u); ${x?`atomicAdd(&events[1], 1u); atomicStore(&events[2], bitcast<u32>(bitcast<f32>(atomicLoad(&events[2])) + clock.remaining));`:``}
}}
`,[w(`diagnostics`,s,1,`write`),...x?[w(`events`,x,2,`write`)]:[]],1)}this.commandSettings=t(`body-command`,80,!0),this.bodyControl=uu(e.device,{id:`${this.id}-body-control`,source:vu,bindings:{command:this.commandSettings,positions:this.positions,velocities:this.velocities,angularVelocities:this.angularVelocities,orientations:this.orientations,sleepStates:this.sleepStates},shaderLayout:{bindings:[{name:`command`,type:`uniform`,group:0,location:0},...[`positions`,`velocities`,`angularVelocities`,`orientations`,`sleepStates`].map((e,t)=>({name:e,type:`storage`,group:0,location:t+1}))]}}),this.added=!0,this.writeSettings()}applyImpulse(e,t,n){this.submitBodyCommand(e,1,t,n??[0,0,0],+!!n)}applyAngularImpulse(e,t){this.submitBodyCommand(e,2,t)}wakeBody(e){this.submitBodyCommand(e,3)}teleportBody(e,t,n=[0,0,0,1]){if(!n.every(Number.isFinite)||Math.hypot(...n)<1e-6)throw Error(`Invalid sphere orientation`);this.submitBodyCommand(e,4,t,[0,0,0],0,n)}setBodyEnabled(e,t){this.submitBodyCommand(e,5,[t?1:-1,0,0])}async readState(){if(!this.bodyControl)throw Error(`Add sphere world to a graph first`);let e=[this.positions,this.velocities,this.angularVelocities,this.orientations,this.sleepStates],t=this.parameters.sleepAfter,n=await Promise.all(e.map(async e=>new Float32Array((await e.readAsync(0,this.count*16)).buffer))),r=(e,t)=>[e[t],e[t+1],e[t+2]];return Array.from({length:this.count},(e,i)=>{let a=i*4;return{index:i,position:r(n[0],a),radius:Math.abs(n[0][a+3]),enabled:n[0][a+3]>0,velocity:r(n[1],a),inverseMass:n[1][a+3],angularVelocity:r(n[2],a),orientation:[...r(n[3],a),n[3][a+3]],sleeping:t>0&&n[4][a]>=t}})}submitBodyCommand(e,t,n=[0,0,0],r=[0,0,0],i=0,a=[0,0,0,1]){if(!this.bodyControl||!this.commandSettings)throw Error(`Add sphere world to a graph first`);if(!Number.isInteger(e)||e<0||e>=this.count||![...n,...r].every(Number.isFinite))throw Error(`Invalid sphere body command`);this.clearContactCache(),this.commandSettings.write(new Float32Array([e,t,i,0,...n,0,...r,0,...a,0,0,0,0]));let o=this.positions.device,s=o.createCommandEncoder(),c=s.beginComputePass();this.bodyControl.kernel.dispatch(c,{bindings:this.bodyControl.bindings,x:1,y:1,z:1}),c.end(),o.submit(s.finish())}readEvents(){if(!this.events)throw Error(`Sphere events are disabled`);return this.eventRead??=this.events.readAsync().then(e=>{let t=Ou(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.eventCursor);return this.eventCursor=t.sequence,t}).finally(()=>{this.eventRead=void 0}),this.eventRead}destroy(){this.bodyControl?.kernel.destroy(),this.bodyControl=void 0;for(let e of this.ownedBuffers)e.destroy();this.ownedBuffers=[]}clearContactCache(){this.contactCache&&this.contactCache.write(new Uint8Array(this.contactCache.byteLength))}writeSettings(){if(this.clearContactCache(),!this.settings)return;let e=this.parameters,t=e.plane.normal??[0,0,1],n=Math.hypot(...t),r=t.map(e=>e/n),i=Math.abs(r[1])<.9?[r[2],0,-r[0]]:[0,-r[2],r[1]],a=Math.hypot(...i);for(let e=0;e<3;e++)i[e]/=a;let o=[r[1]*i[2]-r[2]*i[1],r[2]*i[0]-r[0]*i[2],r[0]*i[1]-r[1]*i[0]],s=new Float32Array(800);s.set([...e.gravity,this.wakeRevision,...r,e.plane.offset??0,...i,e.plane.halfExtents?.[0]??1e10,...o,e.plane.halfExtents?.[1]??1e10,this.timeStep,e.restitution,e.staticFriction,e.dynamicFriction,e.rollingResistance,e.sleepLinearSpeed,e.sleepAngularSpeed,(e.planes??[e.plane]).length,e.sleepAfter,e.restitutionThreshold,this.contactSkin,.8,Number(e.cutInducedThrow),Number(e.spinInducedThrow),0,0]);for(let[t,n]of(e.planes??[e.plane]).entries()){let r=n.normal??[0,0,1],i=Math.hypot(...r),a=r.map(e=>e/i),o=Math.abs(a[1])<.9?[a[2],0,-a[0]]:[0,-a[2],a[1]],c=Math.hypot(...o);for(let e=0;e<3;e++)o[e]/=c;let l=[a[1]*o[2]-a[2]*o[1],a[2]*o[0]-a[0]*o[2],a[0]*o[1]-a[1]*o[0]],u=ju(n);s.set([...a,u.reduce((e,t,n)=>e+t*a[n],0),...o,n.halfExtents?.[0]??1e10,...l,n.halfExtents?.[1]??1e10,...u,n.spinningResistance??0,n.restitution??e.restitution,n.staticFriction??e.staticFriction,n.dynamicFriction??e.dynamicFriction,n.rollingResistance??e.rollingResistance,n.contactHeightRatio??0,n.restitutionVelocityScale??0,0,0],32+t*24)}this.settings.write(s)}};function ju(e){if(e.center)return e.center;let t=e.normal??[0,0,1],n=(e.offset??0)/Math.hypot(...t);return[t[0]*n,t[1]*n,t[2]*n]}var U=.18,Mu=.39,Nu=[[-6,-3,U],[0,-3.13,U],[6,-3,U],[-6,3,U],[0,3.13,U],[6,3,U]],Pu=[{halfExtents:[6,3],restitution:0,staticFriction:.25,dynamicFriction:.18,rollingResistance:.035,spinningResistance:.3},...[-1,1].flatMap(e=>[...[-1,1].map(t=>({normal:[0,-e,0],center:[t*3,e*3,.2],halfExtents:[.5,2.6],restitution:.88,restitutionVelocityScale:.035,contactHeightRatio:.35,staticFriction:.22,dynamicFriction:.16,rollingResistance:0})),{normal:[-e,0,0],center:[e*6,0,.2],halfExtents:[.5,2.6],restitution:.88,restitutionVelocityScale:.035,contactHeightRatio:.35,staticFriction:.22,dynamicFriction:.16,rollingResistance:0}])];for(let e of[-1,1])for(let t of[-1,1]){for(let n of[!0,!1])Pu.push({normal:n?[e*.6,-t,0]:[-e,t*.6,0],center:n?[e*5.725,t*3.075,.2]:[e*6.075,t*2.725,.2],halfExtents:[.5,.146],restitution:.8,staticFriction:.22,dynamicFriction:.16,rollingResistance:0,contactHeightRatio:.35,restitutionVelocityScale:.035});Pu.push({normal:[-e*.8,-t*.6,0],center:[e*.325,t*3.1,.2],halfExtents:[.5,.125],restitution:.8,staticFriction:.22,dynamicFriction:.16,rollingResistance:0,contactHeightRatio:.35,restitutionVelocityScale:.035})}function Fu(){let e=new Float32Array(64);e.set([-3,0,U,U]);let t=[1,9,2,10,8,3,4,11,5,12,13,6,14,7,15],n=0;for(let r=0;r<5;r++)for(let i=0;i<=r;i++)e.set([2+r*Math.sqrt(3)*.182,(i-r/2)*.364,U,U],t[n++]*4);return e}function Iu(e){for(let t=0;t<8;t++)for(let n=0;n<11;n++){let r=[-3-t*.3,(n%2?1:-1)*Math.ceil(n/2)*.42,U];if(e.every(e=>e.index===0||!e.enabled||Math.hypot(e.position[0]-r[0],e.position[1]-r[1])>e.radius+.18+.02))return r}return null}function Lu(e){return e.every(e=>!e.enabled||Math.hypot(...e.velocity)<.035&&Math.hypot(...e.angularVelocity)<.15)}var Ru=6,zu=4,Bu=6,Vu=140;function Hu(e,t,n,r){let i=.3+17.7*(r/100)**1.35,a=Math.cos(t),o=Math.sin(t),[s,c]=n,l=Math.sqrt(Math.max(0,1-s**2-c**2));return{speed:i,impulse:[a*i,o*i,0],point:[e[0]+U*(-a*l+o*s),e[1]+U*(-o*l-a*s),e[2]+U*c]}}async function Uu(e,t,n){let r=t.count*16,i=N.STORAGE|N.COPY_SRC|N.COPY_DST,a=e.createBuffer({byteLength:r,usage:i}),o=e.createBuffer({byteLength:r,usage:i}),s=e.createBuffer({byteLength:r*Bu,usage:i}),c=new Au({...n,id:`pool-shot-forecast`,positions:a,velocities:o,orientations:void 0,angularVelocities:void 0,sleepStates:void 0,diagnostics:void 0,eventCapacity:64}),l=new Jc(e);c.addToGraph(l);let u=await l.compileAsync(),d,f,p=Math.round(Ru/c.timeStep);function m(n){let i=e.createCommandEncoder();for(let e of[`positions`,`velocities`,`orientations`,`angularVelocities`,`sleepStates`])i.copyBufferToBuffer({sourceBuffer:t[e],destinationBuffer:c[e],size:r});e.submit(i.finish()),c.events.write(new Uint32Array(4)),c.applyImpulse(0,n.strike.impulse,n.strike.point)}async function h(n){n.steps||m(n);let i=e.createCommandEncoder();for(let e=0;e<Bu;e++){for(let e=0;e<zu;e++)u.encode(i,{parameters:void 0});i.copyBufferToBuffer({sourceBuffer:a,destinationBuffer:s,destinationOffset:e*r,size:r})}e.submit(i.finish());let o=await s.readAsync();if(d!==n)return;let c=new Float32Array(o.buffer,o.byteOffset,o.byteLength/4),l=!1;for(let e=0;e<Bu;e++)for(let[r,i]of n.paths.entries()){if(!i.length)continue;let n=(e*t.count+r)*4,a=[c[n],c[n+1]],o=i.at(-1);Math.hypot(a[0]-o[0],a[1]-o[1])>=.004&&(i.push(a),l=!0)}n.steps+=Bu*zu,n.stationaryBatches=l?0:n.stationaryBatches+1}return{setThrow(e,t){c.update({cutInducedThrow:e,spinInducedThrow:t})},update(e,t,n,r){if((d?.states!==t||d.revision!==n)&&(d={states:t,revision:n,strike:r,requestedAt:e,steps:0,stationaryBatches:0,failed:!1,paths:t.map(e=>e.enabled?[[e.position[0],e.position[1]]]:[])}),!f&&e-d.requestedAt>=Vu&&d.steps<p&&d.stationaryBatches<3){let e=d;f=h(e).catch(()=>{for(let t of e.paths)t.length=0;e.failed=!0,e.steps=p}).finally(()=>{f=void 0})}return d},cancel(){d=void 0},async destroy(){d=void 0,await f,u.destroy(),c.destroy(),s.destroy(),a.destroy(),o.destroy()}}}var Wu=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),Symbol.toStringTag).get;function Gu(e){return ArrayBuffer.isView(e)?Wu.call(e):void 0}function Ku(e){let t=Gu(e);return t!==void 0&&t!==`BigInt64Array`&&t!==`BigUint64Array`}var qu=0,Ju=class{constructor(e){this.userData={},this.id=e.id||`geometry-${++qu}`,this.topology=e.topology,this.attributes={};let t=e.indices?Yu(e.indices):void 0;for(let[n,r]of Object.entries(e.attributes||{})){let e=Yu(r);if((n===`POSITION`||n===`positions`)&&(e.size||=3),n===`indices`){if(t)throw Error(`Geometry has multiple index attributes`);t=e}else this.attributes[n]=e}if(t){if(!(t.value instanceof Uint16Array||t.value instanceof Uint32Array))throw Error(`Geometry indices must be a Uint16Array or Uint32Array`);t.size=1,this.indices=t,Xu(t,this.attributes)}if(this.vertexCount=e.vertexCount??Zu(this.attributes,this.indices),!Number.isInteger(this.vertexCount)||this.vertexCount<0)throw Error(`Geometry vertexCount must be a non-negative integer`)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}};function Yu(e){let t=Ku(e)?{value:e}:{...e};if(!Ku(t.value))throw Error(`Geometry attributes must contain a typed-array value`);if(t.size!==void 0&&(!Number.isInteger(t.size)||t.size<1))throw Error(`Geometry attribute size must be a positive integer`);if(t.size&&t.value.length%t.size!==0)throw Error(`Geometry attribute length must be divisible by its size`);return t}function Xu(e,t){let n=-1;for(let t of e.value)n=Math.max(n,Number(t));for(let[e,r]of Object.entries(t))if(!r.constant&&r.size){let t=r.value.length/r.size;if(n>=t)throw Error(`Geometry index ${n} exceeds ${e} vertex count ${t}`)}}function Zu(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e))!t.constant&&t.size&&(n=Math.min(n,t.value.length/t.size));if(!Number.isFinite(n))throw Error(`Geometry has no countable attributes`);return n}function Qu(e,t){if(!Number.isFinite(e)||e<=0)throw Error(`${t} must be greater than zero`)}function $u(e,t){if(!Number.isFinite(e)||e<0)throw Error(`${t} must be non-negative`)}function ed(e,t,n=1){if(!Number.isInteger(e)||e<n)throw Error(`${t} must be an integer >= ${n}`)}function td(e,t){return e>65535?new Uint32Array(t):new Uint16Array(t)}var nd=class extends Ju{constructor(e={}){let t=e.size||[1,1,1];Qu(t[0],`size[0]`),Qu(t[1],`size[1]`),Qu(t[2],`size[2]`);let n=[t[0]/2,t[1]/2,t[2]/2],r=[],i=[],a=[],o=[],s=[{n:[1,0,0],u:[0,0,-1],v:[0,1,0],h1:n[2],h2:n[1]},{n:[-1,0,0],u:[0,0,1],v:[0,1,0],h1:n[2],h2:n[1]},{n:[0,1,0],u:[1,0,0],v:[0,0,-1],h1:n[0],h2:n[2]},{n:[0,-1,0],u:[1,0,0],v:[0,0,1],h1:n[0],h2:n[2]},{n:[0,0,1],u:[1,0,0],v:[0,1,0],h1:n[0],h2:n[1]},{n:[0,0,-1],u:[-1,0,0],v:[0,1,0],h1:n[0],h2:n[1]}];for(let e of s){let t=r.length/3;for(let[t,o,s,c]of[[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]])r.push(e.n[0]*n[0]+e.u[0]*e.h1*t+e.v[0]*e.h2*o,e.n[1]*n[1]+e.u[1]*e.h1*t+e.v[1]*e.h2*o,e.n[2]*n[2]+e.u[2]*e.h1*t+e.v[2]*e.h2*o),i.push(...e.n),a.push(s,c);o.push(t,t+1,t+2,t,t+2,t+3)}super({id:e.id,topology:`triangle-list`,indices:td(24,o),attributes:{POSITION:{size:3,value:new Float32Array(r)},NORMAL:{size:3,value:new Float32Array(i)},TEXCOORD_0:{size:2,value:new Float32Array(a)},...e.attributes}})}},rd=class extends nd{constructor(e={}){let t=e.size??1;super({...e,size:[t,t,t]})}};function id(e,t){let n=[],r=[],i=[],a=[],o=t+1;for(let a=0;a<e.length;a++){let o=e[a];for(let s=0;s<=t;s++){let c=s/t,l=c*Math.PI*2,u=Math.sin(l),d=Math.cos(l);n.push(u*o.radius,o.y,d*o.radius),r.push(u*o.normalRadius,o.normalY,d*o.normalRadius),i.push(c,a/(e.length-1))}}for(let n=0;n<e.length-1;n++)for(let e=0;e<t;e++){let t=n*o+e,r=t+1,i=t+o,s=i+1;a.push(t,r,s,t,s,i)}return{positions:n,normals:r,texCoords:i,indices:a,indexArray:td(n.length/3,a)}}var ad=class extends Ju{constructor(e={}){let{topRadius:t=0,bottomRadius:n=0,topCap:r=!1,bottomCap:i=!1,height:a=1,nradial:o=10,nvertical:s=1,verticalAxis:c=`y`}=e;if($u(t,`topRadius`),$u(n,`bottomRadius`),t===0&&n===0)throw Error(`At least one radius must be greater than zero`);Qu(a,`height`),ed(o,`nradial`,3),ed(s,`nvertical`);let l=[],u=[],d=[],f=[],p=o+1,m=(n-t)/a,h=1/Math.hypot(1,m),g=(e,t,n,r,i)=>{let a=l.length/3/p;for(let a=0;a<=o;a++){let s=a/o,f=s*Math.PI*2,p=Math.sin(f),m=Math.cos(f),h=od([p*e,t,m*e],c),g=od([p*n,r,m*n],c);l.push(...h),u.push(...g),d.push(s,i)}return a},_=(e,t)=>{for(let n=0;n<o;n++){let r=e*p+n,i=r+1,a=t*p+n,o=a+1;f.push(r,i,o,r,o,a)}},v;i&&(_(g(0,-a/2,0,-1,0),g(n,-a/2,0,-1,1)),v=g(n,-a/2,h,m*h,0));for(let e=0;e<=s;e++){let r=e/s,o=g(n+(t-n)*r,(r-.5)*a,h,m*h,r);v!==void 0&&!(i&&e===0)&&_(v,o),v=o}r&&v!==void 0&&_(g(t,a/2,0,1,1),g(0,a/2,0,1,0));let y=l.length/3;super({id:e.id,topology:`triangle-list`,indices:td(y,f),attributes:{POSITION:{size:3,value:new Float32Array(l)},NORMAL:{size:3,value:new Float32Array(u)},TEXCOORD_0:{size:2,value:new Float32Array(d)},...e.attributes}})}};function od(e,t){switch(t){case`x`:return[e[1],e[2],e[0]];case`z`:return[e[2],e[0],e[1]];default:return[e[0],e[1],e[2]]}}var sd=class extends Ju{constructor(e={}){let{radius:t=.5,nlat:n=10,nlong:r=10}=e;Qu(t,`radius`),ed(n,`nlat`,2),ed(r,`nlong`,3);let i=[];for(let e=0;e<=n;e++){let r=-Math.PI/2+e/n*Math.PI,a=Math.cos(r),o=Math.sin(r);i.push({radius:t*a,y:t*o,normalRadius:a,normalY:o})}let a=id(i,r);super({id:e.id,topology:`triangle-list`,indices:a.indexArray,attributes:{POSITION:{size:3,value:new Float32Array(a.positions)},NORMAL:{size:3,value:new Float32Array(a.normals)},TEXCOORD_0:{size:2,value:new Float32Array(a.texCoords)},...e.attributes}})}},cd=class extends Ju{bufferLayout;constructor(e){let t={},n=new Map;for(let[r,i]of Object.entries(e.attributes)){let e=ld(r),a=n.get(e);a&&delete t[a],n.set(e,r),t[r]=i}let r=e.indices,i=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;super({...e,attributes:t,indices:i});for(let[e,n]of Object.entries(t))!ArrayBuffer.isView(n)&&Object.isExtensible(n)&&e!==`indices`&&(Object.assign(n,this.attributes[e]),this.attributes[e]=n);this.bufferLayout=e.bufferLayout||ud(this.attributes)}};function ld(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function ud(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:i,normalized:a}=r;if(i===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:ld(n),format:l.getVertexFormatFromAttribute(e,i,a)})}return t}function dd(e){if(!e.indices)return e;let t=e.indices.value,n={};for(let[r,i]of Object.entries(e.attributes)){if(!i)continue;if(i.constant||!i.size){n[r]=i;continue}let e=i.value.constructor,a=new e(t.length*i.size);for(let e=0;e<t.length;e++)for(let n=0;n<i.size;n++)a[e*i.size+n]=i.value[Number(t[e])*i.size+n];n[r]={...i,value:a}}return{attributes:n}}function fd(e,t={}){let n=t.bufferName||`geometry`;if(pd(e,n))return e;let r=t.minAttributeAlignment||4,i=md(e,t.attributes),a=[],o=0,s=1/0;for(let[e,t]of i){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:i,normalized:c}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(i===void 0)throw Error(`Attribute ${e} is missing a size`);let u=l.getVertexFormatFromAttribute(n,i,c),d=l.getVertexFormatInfo(u);o=gd(o,r),a.push({sourceName:e,attributeName:ld(e),value:n,size:i,format:u,byteOffset:o,byteLength:d.byteLength}),o+=d.byteLength;let f=n.length/i;if(!Number.isInteger(f))throw Error(`Attribute ${e} length is not divisible by size`);s=Math.min(s,f)}if(a.length===0||!Number.isFinite(s))throw Error(`Geometry ${e.id} has no interleavable attributes`);let c=gd(o,r),u=new ArrayBuffer(s*c);for(let e of a)hd(u,s,c,e);return new cd({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(u),size:c,byteStride:c}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:c,attributes:a.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function pd(e,t){if(e.bufferLayout?.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function md(e,t){let n=new Map,r=t||Object.keys(e.attributes);for(let t of r){let r=e.attributes[t];r&&n.set(ld(t),[t,r])}return Array.from(n.values())}function hd(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function gd(e,t){return Math.ceil(e/t)*t}function _d(e){let t=e.value;if(t instanceof Float32Array)return t;let n=new Float32Array(t.length),r=xd(t),i=t instanceof Int8Array||t instanceof Int16Array||t instanceof Int32Array;for(let a=0;a<t.length;a++){let o=Number(t[a]);n[a]=e.normalized&&r?i?Math.max(o/r,-1):o/r:o}return n}function vd(e,t,n){let r={};for(let i of[`POSITION`,`NORMAL`,`TANGENT`]){let a=e[i];if(!a)continue;let o=new Float32Array(a),s=i===`TANGENT`?4:3,c=Math.floor(a.length/s);for(let e=0;e<Math.min(t.length,n.length);e++){let r=n[e],a=t[e][i];if(!r||!a)continue;let l=i===`TANGENT`&&a.length===c*4?4:3;for(let e=0;e<c;e++){let t=e*s,n=e*l;for(let e=0;e<3;e++)o[t+e]+=(a[n+e]||0)*r}}i!==`POSITION`&&Sd(o,s),r[i]=o}return r}function yd(e,t,n,r){let i={};for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let n=t.attributes[e];n&&(i[e]=_d(n))}let a=vd(i,n,r),o={};for(let[e,n]of Object.entries(t.attributes))n&&(o[e]=n);for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let t=a[e],n=o[e];t&&n&&(o[e]={...n,value:bd(n,t)})}let s=fd(new cd({id:t.id,topology:t.topology||`triangle-list`,vertexCount:t.vertexCount,indices:t.indices,attributes:o,bufferLayout:t.bufferLayout})).attributes.geometry?.value,c=e._gpuGeometry?.attributes.geometry||e.bufferAttributes.geometry;if(s&&c){c.write(s);return}for(let t of[`POSITION`,`NORMAL`,`TANGENT`]){let n=a[t];if(n){let r=t===`POSITION`?`positions`:t===`NORMAL`?`normals`:`TANGENT`;e.bufferAttributes[r]?.write(n)}}}function bd(e,t){if(e.value instanceof Float32Array)return t;let n=e.value.slice(),r=xd(n),i=n instanceof Int8Array||n instanceof Int16Array||n instanceof Int32Array;for(let a=0;a<t.length;a++){let o=t[a];n[a]=e.normalized&&r?Math.round(Math.max(i?-1:0,Math.min(1,o))*r):o}return n}function xd(e){return e instanceof Int8Array?127:e instanceof Uint8Array||e instanceof Uint8ClampedArray?255:e instanceof Int16Array?32767:e instanceof Uint16Array?65535:e instanceof Int32Array?2147483647:e instanceof Uint32Array?4294967295:0}function Sd(e,t){for(let n=0;n<e.length;n+=t){let t=Math.hypot(e[n],e[n+1],e[n+2]);t>0&&(e[n]/=t,e[n+1]/=t,e[n+2]/=t)}}var Cd=class{device;buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),n=this.device.createBuffer({id:`batch-uniforms`,byteLength:t,usage:N.UNIFORM|N.COPY_DST});this.buffer?.destroy(),this.buffer=n}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){h(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}};function wd(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var Td=`__debugFramebufferState`,Ed=8;function Dd(e,t,n){if(e.device.type!==`webgl`)return;let r=Ad(e.device);if(!r.flushing){if(Md(e)){Od(e,n,r);return}t&&jd(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function Od(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=Nd(t.top,Ed),l=Nd(t.left,Ed);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=kd({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+Ed}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function kd(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function Ad(e){return e.userData[Td]||={flushing:!1,queuedFramebuffers:[]},e.userData[Td]}function jd(e){return`colorAttachments`in e}function Md(e){let t=e.props.framebuffer;return!t||t.handle===null}function Nd(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function Pd(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!Pd(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=e,i=t,a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(let e of a)if(!t.hasOwnProperty(e)||!Pd(r[e],i[e],n-1))return!1;return!0}return!1}var Fd=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return x(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function Id(e,t){let n=O(e),r=t.slice();return r.sort((e,t)=>ee(x(e).map(e=>n[e]))-ee(x(t).map(e=>n[e]))),r}function Ld(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of Hd(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function Rd(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?Gd(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:Wd(e.bindings,t.bindings)}:e:t}function zd(e){return!!(e.uniformTypes&&!Ud(e.uniformTypes))}function Bd(e){let t=[];for(let n of e){let e=Vt(n),r=new Set([n.vs,n.fs].flatMap(e=>e?Gt(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),i=r.has(e)?e:r.size===1?r.values().next().value:void 0;zd(n)&&i&&t.push({name:i,uniformTypes:n.uniformTypes})}return t}function Vd(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function Hd(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function Ud(e){for(let t in e)return!1;return!0}function Wd(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function Gd(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}function Kd(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var qd={};function Jd(e=`id`){return qd[e]=qd[e]||1,`${e}-${qd[e]++}`}function Yd(e,t,n){for(let[r,i]of Object.entries(t)){if(!i)continue;if(!i.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=n.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let a=t.attributes??[];if(a.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let o=a[0],s=t.format??o?.format,c=Zd(e,r,i.format),l=t.byteStride??c.byteLength;if(s!==i.format||l!==i.byteStride||i.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function Xd(e,t){let n=Object.entries(t).filter(e=>e[1]!==void 0);if(n.length===0)return[];let[r,i]=n[0];for(let[t,a]of n){if(!a.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(Zd(e,t,a.format),a.length!==i.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(a.data.length!==i.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let a=0;return i.data.map((t,r)=>{let i={};for(let[a,o]of n){let n=o.data[r];if(!n||n.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(n.format!==o.format||n.byteStride!==o.byteStride||n.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${a}" chunk layout must be stable`);i[a]=n}let o={batchIndex:r,rowIndexOffset:a,rowCount:t.length,data:i};return a+=t.length,o})}function Zd(e,t,n){if(n.includes(`<`))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return l.getVertexFormatInfo(n)}function Qd(e){let t;for(let n of Object.values(e)){if(!n||`isConstant`in n)continue;let e=0;for(let t of n.data)e+=t.length;if(h(e===n.length),t){h(n.length===t.length&&n.data.length===t.data.length);for(let e=0;e<n.data.length;e++)h(n.data[e].length===t.data[e].length)}else t=n}}function $d(e,t,n,r,i,a){let o=t.inputs,s=n.inputs,c=t.sourceLayouts,l=n.sourceLayouts,u=t.layouts,d=n.layouts,f=n.stepMode,p=t.batchCount,m=n.batchCount,h=Array.from({length:p},(e,n)=>t.getBatch(n)),g=Array.from({length:m},(e,t)=>n.getBatch(t)),_=ef(h),v=ef(g),y=e.vertexCount,b=e.instanceCount,x=!0;try{let o=e.isInstanced&&n.vertexCount===void 0,s=o?p*m:Math.max(p,m);if(p===0||m===0)return!0;for(let c=0;c<s;c++){let s=o?Math.floor(c/m):Math.min(c,p-1),l=o?c%m:Math.min(c,m-1);t.setInputs(h[s],u,`vertex`),n.setInputs(g[l],d,f),r();let S=t.rowCount===void 0?n.vertexCount===void 0?0:v[l]:_[s];a===`vertex`&&e.setVertexCount(Math.max(0,Math.min(t.rowCount??n.vertexCount??y,y-S))),a===`instance`&&n.instanceCount!==void 0&&e.setInstanceCount(Math.max(0,Math.min(n.instanceCount,b-v[l]))),!(!e.indexBuffer&&e.vertexCount===0||e.isInstanced&&e.instanceCount===0)&&(x=i()&&x)}}finally{t.setInputs(o,c,`vertex`),n.setInputs(s,l,f),r(),e.setVertexCount(y),e.setInstanceCount(b)}return x}function ef(e){let t=0;return e.map(e=>{let n=t;for(let n of Object.values(e))if(n&&`data`in n){t+=n.length;break}return n})}var tf=class{device;id;inputs={};sourceLayouts;stepMode=`vertex`;claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,n,r=!0){if(r)Qd(e);else for(let t of Object.values(e))t&&!W(t)&&h(t.data.length===1);this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=n,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let i=t??Object.entries(e).flatMap(([e,t])=>t&&!W(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),a=Object.entries(e).flatMap(([e,t])=>{if(!t||i.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];h(t.format);let r=t.format;return[{name:e,stepMode:n,byteStride:W(t)?0:t.byteStride,attributes:[{attribute:e,format:r,byteOffset:0}]}]}),o=[...i,...rf(e,a)];for(let[t,i]of Object.entries(e))if(i){if(!W(i)&&!Array.isArray(i.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);!W(i)&&r&&((o.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t))?.stepMode??n)===`instance`?(h(this.instanceCount===void 0||this.instanceCount===i.length),this.instanceCount=i.length):(h(this.vertexCount===void 0||this.vertexCount===i.length),this.vertexCount=i.length),this.rowCount=n===`instance`?this.instanceCount:this.vertexCount),this.claimedNames.add(t)}this.layouts=o.flatMap(t=>{let r=e[t.name],i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),a=i.filter(t=>W(e[t.attribute])),o={...t,stepMode:t.stepMode??n};return this.device.type!==`webgpu`||r&&!W(r)&&r.bufferLayout||!a.length||a.length===i.length?[{...o,byteStride:a.length===i.length&&a.length?0:o.byteStride}]:[{...o,attributes:i.filter(t=>!W(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:a}]}),this.buffers={},this.byteOffsets={},this.constants={};let s=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let n=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of n)this.claimedNames.add(e.attribute);let r=e[t.name];if(r&&!W(r)){let e=r.bufferLayout||!r.format?0:(n.find(e=>e.attribute===t.name)??n[0])?.byteOffset??0;this.bindVector(t.name,r,e)}let i=0;for(let r of n){let n=e[r.attribute]??(r.attribute===t.name?e[t.name]:void 0);n&&(h(n.format===void 0||n.format===r.format),W(n)?(this.constants[r.attribute]=nf(n),i=Math.max(i,(r.byteOffset??0)+n.byteLength)):this.buffers[t.name]||this.bindVector(t.name,n,r.byteOffset??0))}if(this.device.type===`webgpu`&&i&&!this.buffers[t.name]){let r=new Uint8Array(Math.ceil(i/4)*4);for(let t of n){let n=e[t.attribute];W(n)&&r.set(new Uint8Array(n.value.buffer,n.value.byteOffset,n.byteLength),t.byteOffset??0)}let a=this.constantBuffers[t.name];(!a||a.byteLength<r.byteLength)&&(a?.destroy(),a=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:r.byteLength,usage:N.VERTEX|N.COPY_DST|N.COPY_SRC}),this.constantBuffers[t.name]=a),a.write(r),this.buffers[t.name]=a,s.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))s.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!W(e));return e&&!W(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,n])=>{if(!n||W(n))return[t,n];let r=n.data[e];return[t,{...n,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,n){let r=t.data[0];if(!r)return;let i=r.byteOffset-n;h(i>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=i}};function W(e){return!!(e&&`isConstant`in e&&e.isConstant)}function nf(e){let t=l.getVertexFormatInfo(e.format);if(e.format===`unorm10-10-10-2`){let t=e.value[0];return new Float32Array([(t&1023)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let n=Array.from(e.value);if(e.format===`unorm8x4-bgra`&&([n[0],n[2]]=[n[2],n[0]]),t.normalized){let r=e.value.BYTES_PER_ELEMENT*8,i=2**r-1;return new Float32Array(n.map(e=>t.signed?(e+2**(r-1))/i*2-1:e/i))}return t.integer?t.signed?new Int32Array(n):new Uint32Array(n):new Float32Array(n)}function rf(e,t){let n=[],r,i=0,a=[...t].sort((t,n)=>{let r=e[t.name],i=e[n.name];return(r&&!W(r)?r.data[0]?.byteOffset??0:0)-(i&&!W(i)?i.data[0]?.byteOffset??0:0)});for(let t of a){let a=e[t.name],o=t.attributes[0];if(W(a)){r||(r={...t,attributes:[]},n.push(r));let e=Math.min(4,a.byteLength);i=Math.ceil(i/e)*e,r.attributes.push({...o,byteOffset:i}),i+=a.byteLength;continue}let s=n.find(n=>{let r=e[n.name];if(!r||W(r)||!r.data.length||!a.data.length)return!1;let i=a.data[0].byteOffset-r.data[0].byteOffset;return n.stepMode===t.stepMode&&n.byteStride===t.byteStride&&i>=0&&i+a.rowByteLength<=a.byteStride&&a.data.every((e,t)=>{let n=r.data[t];return e.buffer===n.buffer&&e.byteStride===n.byteStride&&e.byteOffset-n.byteOffset===i})});if(s){let t=e[s.name];s.attributes.push({...o,byteOffset:a.data[0].byteOffset-t.data[0].byteOffset})}else n.push({...t,attributes:[...t.attributes]})}return n}function af(e){return(Array.isArray(e)?e.length===0||typeof e[0]==`number`:ArrayBuffer.isView(e)&&!(e instanceof DataView))||typeof e==`number`||typeof e==`boolean`}function of(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||af(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var sf=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=_t(Object.values(e).filter(pf));for(let t of n)e[t.name]=t;s.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&s.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},i=this.modules[n];if(!i)this.options.disableWarnings||s.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:a,bindings:o}=of(i.getUniforms?.(r,e)||r,i.uniformTypes);this.moduleUniforms[n]=cf(e,a,i.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=_t(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=cf({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function cf(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=lf(e[i],a,n[i]));return r}function lf(e,t,n){if(!n||typeof n==`string`)return uf(t);if(Array.isArray(n)){if(df(t)||!Array.isArray(t))return uf(t);let r=Array.isArray(e)&&!df(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=lf(r[e],a,n[0]))}return i}if(!ff(t))return uf(t);let r=n,i=ff(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=lf(i[e],n,r[e]));return a}function uf(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?df(e)?e.slice():e.map(e=>e===void 0?void 0:uf(e)):ff(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:uf(t)])):e}function df(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function ff(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function pf(e){return!!e?.dependencies}var mf=2,hf=1e4,gf=`render pipeline initialization failed`,_f=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],vf=class e{static async createAsync(e,t){let n=!F.getAsyncCompilation(e),r=n?F.beginAsyncCompilation(e):F.getAsyncCompilation(e),i;try{i=new this(e,t)}finally{n&&F.endAsyncCompilation(e,r)}try{return n?await Promise.all(r):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...ae.defaultProps,inferDrawCount:`no`,enforceMatchingVectorLengths:!0,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){this.constructorDrawOffsets={firstVertex:n.firstVertex,firstIndex:n.firstIndex};let r=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:n.vertexCount??(r.vertexCount||void 0),instanceCount:n.instanceCount??(r.instanceCount||void 0)};let i=r.shaderAssembler,a=Object.hasOwn(n,`vertexCount`);this.props={...r,...n,shaderAssembler:n.shaderAssembler??(i&&yf(i,t.info.shadingLanguage)?i:t.info.shadingLanguage===`wgsl`?new Ar:new ci)},this._vertexCountSet=a,n=this.props,this.id=n.id||Jd(`model`),this.device=t,Object.assign(this.userData,n.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=n.isInstanced??(n.instanceCount?!0:void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new tf(t,`${this.id}-geometry`),this.attributeVectorBindings=new tf(t,`${this.id}-attributes`);try{this._initializeProps(n);let e=Kd(t),r=Hr(this.props.plugins,e.shaderLanguage),i=Ur(this.props.modules,r.modules),a=Object.fromEntries(i.map(e=>[e.name,e])),o=n.shaderInputs||new sf(a,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&r.modules.length>0&&o.addModules(r.modules),this.setShaderInputs(o);let s=Vd(this.props.modules,o.getModules()),c={...r.defines,...this.props.defines};if(this.device.type===`webgl`&&(this.props._uniformBlockLayouts=Bd(s)),this.props.shaderLayout=Ld(this.props.shaderLayout,s)||null,this.device.type===`webgpu`&&this.props.source){let n=this.props.shaderAssembler;h(yf(n,`wgsl`));let{source:i,getUniforms:a,bindingTable:o,entryPoints:l={},shaderLayout:u}=n.assembleWGSLShader({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.source=i,this.props.vertexEntryPoint=l.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=l.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=a,this._bindingTable=o;let d=bf(u??t.getShaderLayout?.(this.source),r.vertexInputs),f=Rd(this.props.shaderLayout,d,Object.keys(r.vertexInputs));this.props.shaderLayout=Ld(f||null,s)||null}else{let t=this.props.shaderAssembler;h(yf(t,`glsl`));let{vs:n,fs:i,getUniforms:a}=t.assembleGLSLShaderPair({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.vs=n,this.fs=i,this._getModuleUniforms=a,this._bindingTable=[]}this.pipelineFactory=n.pipelineFactory||F.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||ke.getDefaultShaderFactory(this.device);let l=F.getAsyncCompilation(this.device);l?(this._pipelineInitialization=this._initializePipelineAsync(n),l.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(n))}catch(t){try{e.prototype.destroy.call(this)}finally{throw t}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),e.indexCount!==void 0&&this.setIndexCount(e.indexCount),this.constructorDrawOffsets.firstVertex!==void 0&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),this.constructorDrawOffsets.firstIndex!==void 0&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),e.isInstanced!==void 0&&(this.isInstanced=e.isInstanced),this.constructorDrawCounts.instanceCount!==void 0&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),this.constructorDrawCounts.vertexCount!==void 0&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||=(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e,t){return t?.parameters?this._withDrawParameters(e,t.parameters,()=>this._draw(e)):this._draw(e)}_withDrawParameters(e,t,n){let r=e.getParameters();try{return e.setParameters(t),n()}finally{e.setParameters(r)}}_draw(e){if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(this.geometryVectorBindings.batchCount!==1||this.attributeVectorBindings.batchCount!==1))return this.drawVectorGroups(e);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return s.info(mf,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return s.info(mf,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)s.info(mf,`>>> DRAWING ABORTED ${this.id}: ${gf}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)s.info(mf,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??(this._vertexCountSet?this.vertexCount:a.byteLength/(a.indexType===`uint32`?4:2)):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0||e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=gf,this._drawBlockedReason=gf):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),this.validateVectorLengthPolicy(),this.props.enforceMatchingVectorLengths&&Qd(e),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||this.attributeVectorBindings.vertexCount!==void 0)&&Qd([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let n=this.geometryVectorBindings.rowCount;h(n===void 0||this.attributeVectorBindings.vertexCount===void 0||n===this.attributeVectorBindings.vertexCount),this.props.inferDrawCount===`vertex`&&this.setVertexCount(n??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),this.isInstanced===void 0&&(t?.some(e=>e.stepMode===`instance`)||Object.values(e).some(e=>e&&`data`in e&&e.bufferLayout?.stepMode===`instance`))&&(this.isInstanced=!0);let n=!this.isInstanced||Object.entries(e).some(([e,n])=>n&&`data`in n&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??n.bufferLayout?.stepMode)===`vertex`);this.validateVectorLengthPolicy(),n&&this.props.enforceMatchingVectorLengths&&Qd([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),this.props.inferDrawCount===`instance`&&this.attributeVectorBindings.instanceCount!==void 0&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let r=this.attributeVectorBindings.vertexCount;if(r!==void 0&&this.props.inferDrawCount===`vertex`){let e=this.geometryVectorBindings.rowCount;h(e===void 0||e===r),e===void 0&&this.setVertexCount(r)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&(h(e.format===`uint8`||e.format===`uint16`||e.format===`uint32`),h(e.data.length<=1),h(e.byteStride===(e.format===`uint32`?4:e.format===`uint16`?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];t&&this.indexVector&&h((t.buffer instanceof R?t.buffer.buffer:t.buffer).indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride===0),this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let n=new Set(Object.keys(e)),r=t.filter(e=>n.has(e.name)||e.attributes?.some(e=>n.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),this.device.type===`webgl`&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let n=Xd(this.id,e);h(n.length<=1),Yd(this.id,e,this.bufferLayout),n[0]&&this.setGPUData(n[0].data),this.setBatchDrawCount(n[0]?.rowCount??0,t?.count)}drawVectorGroups(t){let n=this.drawingVectorBatches,r=this._vertexCountSet;this.drawingVectorBatches=!0;try{let n=$d(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>e.prototype.draw.call(this,t),this.props.inferDrawCount);return n&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),n}finally{this._vertexCountSet=r,this.drawingVectorBatches=n}}drawBatches(t,{vectors:n,onBatch:r}){let i=Xd(this.id,n);Yd(this.id,n,this.bufferLayout);for(let e of Object.keys(n))h(!n[e]||this.currentAttributes[e]);let a={...this.currentAttributes},o={...this.currentAttributeByteOffsets},s={...this.bindings},c=this.instanceCount,l=this.vertexCount,u=this.isInstanced,d=this._vertexCountSet,f=this.drawingVectorBatches,p=this.device.type===`webgpu`&&i.length?new He(this.device,this.shaderInputs.modules):void 0;if(p&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new Cd(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(p.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*i.length)}this.drawingVectorBatches=!0;let m=!0;try{for(let n of i){this.setGPUData(n.data),this.setBatchDrawCount(n.rowCount),r?.(n);let i={};try{if(p){p.setUniforms(this.shaderInputs.getUniformValues());for(let[e,t]of this._uniformStore.uniformBuffers){let n=`${e}Uniforms`;this.bindings[n]===t&&(i[n]=t,this.setBindings({[n]:this.batchUniformBuffer.write(p.getUniformBufferData(e))}))}}m=e.prototype.draw.call(this,t)&&m}finally{this.setBindings(i)}}}finally{p?.destroy(),this.setAttributes(a,{byteOffsets:o});for(let e of Object.keys(this.bindings))e in s||delete this.bindings[e];this.setBindings(s),this.setInstanceCount(c),this.setVertexCount(l),this.isInstanced=u,this._vertexCountSet=d,this.drawingVectorBatches=f}return m}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let n=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(n?.attributes?.[0]?.byteOffset??0);return h(r>=0),[e,r]}))})}validateVectorLengthPolicy(){h(this.props.enforceMatchingVectorLengths!==!1||this.props.inferDrawCount===`no`)}setBatchDrawCount(e,t=this.props.inferDrawCount===`no`?`none`:this.props.inferDrawCount){t===`instance`?this.setInstanceCount(e):t===`vertex`&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,n=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,i=this.getExplicitVectorLayouts(n.inputs)??n.sourceLayouts;t.setInputs(t.inputs,r,`vertex`,this.props.enforceMatchingVectorLengths),n.setInputs(n.inputs,i,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||n.vertexCount!==void 0)&&Qd([...Object.values(t.inputs),...Object.values(n.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(n),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(e=Id(this.pipeline.shaderLayout,e),Pd(e,this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){Pd(e,this.parameters,2)||(this.parameters=e,this.device.type===`webgl`?this.setNeedsRedraw(`parameters`):this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new He(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(zd(t)&&this._usesManagedUniformBuffer(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw(`shaderInputs`)}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof R?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof R?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){Object.assign(this.currentAttributes,e);for(let n of Object.keys(e))this.currentAttributeByteOffsets[n]=t?.byteOffsets?.[n]??0;this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&s.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=Id(this.pipeline.shaderLayout,this.bufferLayout);let r=new Fd(this.bufferLayout);for(let[i,a]of Object.entries(e)){let e=a instanceof R?a.buffer:a,o=r.getBufferLayout(i);if(!o){n||s.warn(`Model(${this.id}): Missing layout for buffer "${i}".`)();continue}let c=r.getAttributeNamesForBuffer(o),l=!1;for(let r of c){let o=this._attributeInfos[r];if(o){let r=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(o.bufferName):o.location;if(r===null){n||s.warn(`Model(${this.id}): Missing vertex array slot for buffer "${o.bufferName}".`)();continue}let c=t?.byteOffsets?.[i]??0;this.vertexArray.setBuffer(r,e,c),a instanceof R?this._dynamicAttributeBufferSources[r]={source:a,generation:a.generation,byteOffset:c}:delete this._dynamicAttributeBufferSources[r],l=!0}}!l&&!n&&s.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${i}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||s.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(Ts(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=xf(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?_(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let t of Object.values(this.bindings))t instanceof p?e=Math.max(e,t.texture.updateTimestamp):t instanceof N||t instanceof n||t instanceof M||t instanceof R?e=Math.max(e,t.updateTimestamp):Ts(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:Qo(t)&&(e=Math.max(e,(t.buffer instanceof R,t.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?.vs??null,t=this.pipeline?.fs??null;this.pipeline&&s.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let n=null,r=null;try{n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(n,r),this._pipelineNeedsUpdate=`shader creation failed`,e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r},vertexShader:n,fragmentShader:r,previousVertexShader:e,previousFragmentShader:t}}_finishPipelineUpdate(e){this._attributeInfos=We(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=s.level>3?0:hf;s.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,s.group(mf,`>>> DRAWING MODEL ${this.id}`,{collapsed:s.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=wd(this.pipeline.shaderLayout,this.id);s.table(mf,e)();let t=this.shaderInputs.getDebugTable();s.table(mf,t)();let n=this._getAttributeDebugTable();s.table(mf,this._attributeInfos)(),s.table(mf,n)(),s.groupEnd(mf)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;Dd(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let n=d.getTypedArrayConstructor(t);return(e instanceof N?new n(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>Sf(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??Cf(t?.depthStencilAttachment?.props?.format??t?.depthStencilAttachment?.texture?.format);(!Pd(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function yf(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function bf(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function xf(e,t,n){if(Ts(t)){let r=Ds(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof R?t.buffer:Qo(t)?ts(t):t}function Sf(e){return e&&!wf(e)?e:null}function Cf(e){return e&&wf(e)?e:void 0}function wf(e){return _f.includes(e)}var Tf=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||Jd(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&N.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function Ef(e,t){if(t instanceof Tf)return t;let n=fd(t),r=Df(e,n),{attributes:i,bufferLayout:a}=Of(e,n);return new Tf({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function Df(e,t){if(!t.indices)return;let n=t.indices.value;return e.createBuffer({usage:N.INDEX,data:n})}function Of(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout?.find(e=>e.name===r)?.name||ld(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout||ud(t.attributes),vertexCount:t.vertexCount}}var kf=class{attributes;indices;topology;vertexCount;bufferLayout;destroy(){}constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??`triangle-list`,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}};function Af(e){let t={};for(let[n,r]of Object.entries(e.attributes)){let i=e.bufferLayout.find(e=>e.name===n),a=i?.format,o=i?.byteStride??(a?l.getVertexFormatInfo(a).byteLength:0),s=e.indices&&o?Math.floor(r.byteLength/o):e.vertexCount;t[n]={name:n,format:a,length:s,byteStride:o,rowByteLength:o,bufferLayout:i,data:[{buffer:r,byteOffset:0,length:s,format:a,byteStride:o,rowByteLength:o}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[n,r]of Object.entries(t))t[n]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let n=e.indices,r=n?.indexType===`uint32`?4:n?.indexType===`uint8`?1:2,i=n?n.byteLength/r:0;return new kf({attributes:t,indices:n?{name:`indices`,format:n.indexType,length:i,byteStride:r,rowByteLength:r,data:[{buffer:n,byteOffset:0,length:i,format:n.indexType,byteStride:r,rowByteLength:r}]}:null,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}var jf=class extends vf{static defaultProps={...vf.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let n=t.geometry===void 0?new.target.defaultProps.geometry:t.geometry,r=n&&!(n instanceof kf)?Ef(e,n):null,i=r?Af(r):n,a={...t,geometry:i instanceof kf?i:null};try{super(e,a)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=n,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=e&&!(e instanceof kf)?Ef(this.device,e):null;let t=this._gpuGeometry?Af(this._gpuGeometry):e;super.setGeometry(t instanceof kf?t:null),e instanceof kf||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if(Ts(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}},Mf=class{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let n=new sf(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=Pf(n),this._materialModuleNames=Ff(n)}createMaterial(e={}){return new If(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=Nf(e);return t?this._materialModuleNames.has(t):!1}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{3:e}:{}}};function Nf(e){return e.endsWith(`Uniforms`)?e.slice(0,-8):null}function Pf(e){let t=new Set;for(let n of Object.values(e.modules))for(let e of n.bindingLayout||[])e.group===3&&t.add(e.name);return t}function Ff(e){let t=new Set;for(let n of Object.values(e.modules))n.name&&n.bindingLayout?.some(e=>e.group===3&&e.name===n.name)&&t.add(n.name);return t}var If=class{id;metadata={};device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||Jd(`material`),this.device=e,this.factory=t.factory||new Mf(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let n=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));this.shaderInputs=t.shaderInputs||new sf(n),this._uniformStore=new He(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(this.ownsModule(e)&&zd(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.metadata={...this.metadata},t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,n]of Object.entries(this.bindings))Nf(t)||(e[t]=n);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={},n=t;for(let[t,r]of Object.entries(this.bindings))if(Ts(r)){let i=Ds(e,t,{fallbackGroup:3}),a=i?r.resolveTextureBinding(i):null;a&&(n[t]=a)}else r instanceof R?n[t]=r.buffer:Qo(r)?n[t]=ts(r):n[t]=r;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===3?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof p?e=Math.max(e,t.texture.updateTimestamp):t instanceof N||t instanceof n||t instanceof M||t instanceof R?e=Math.max(e,t.updateTimestamp):Ts(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:Qo(t)&&(e=Math.max(e,(t.buffer instanceof R,t.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[n,r]of Object.entries(e))r!==void 0&&this.ownsBinding(n)&&this.bindings[n]!==r&&(this.bindings[n]=r,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[n,r]of Object.entries(this.bindings)){let i=Lf(r);i!==null&&(e[n]=i,this._dynamicResourceGenerations[n]!==i&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}};function Lf(e){return Ts(e)?e.generation:$o(e)?.generation??null}var Rf=class extends cd{constructor(e={}){let t=new rd({size:2}),n=new Uint32Array(24),r=[4,5,2,3,0,1];for(let e=0;e<n.length;e++)n[e]=r[Math.floor(e/4)];t.attributes.faceIndex={size:1,value:n},e.indices===!1&&(t.attributes.COLOR_0={size:3,value:new Float32Array(Array.from(t.attributes.POSITION.value,e=>(e+1)/2))});let i=e.indices===!1?dd(t):t;super({id:e.id,topology:t.topology,indices:e.indices===!1?void 0:t.indices,attributes:Hf(i.attributes,e.attributes)})}},zf=class extends cd{constructor(e={}){let t=new sd({...e,attributes:void 0,radius:e.radius??1});for(let e of[`POSITION`,`NORMAL`]){let n=t.attributes[e].value;for(let e=0;e<n.length;e+=3){let t=n[e];n[e]=n[e+2],n[e+2]=t}}let n=t.indices?.value;if(n)for(let e=0;e<n.length;e+=3){let t=n[e+1];n[e+1]=n[e+2],n[e+2]=t}super({...t,attributes:{...t.attributes,...e.attributes}})}},Bf=class extends cd{constructor(e={}){let t=new ad({...e,bottomRadius:e.bottomRadius??1});super({...t,attributes:t.attributes})}},Vf=class extends Bf{constructor(e={}){let t=e.radius??1;super({...e,topRadius:t,bottomRadius:t})}};function Hf(e,t={}){let n={};for(let[t,r]of Object.entries(e))r&&(n[t]=r);return{...n,...t}}function Uf(e,t){if(!e)throw Error(t)}var Wf=class{id;matrix=new L;display=!0;selectable=!0;hoverable=!0;position=new Gi;rotation=new Gi;scale=new Gi(1,1,1);metadata={};userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||Jd(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return Uf(e.length===3,`setPosition requires vector argument`),this.position=e,this}setRotation(e){return Uf(e.length===3||e.length===4,`setRotation requires vector argument`),this.rotation=e,this}setScale(e){return Uf(e.length===3,`setScale requires vector argument`),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:n,scale:r,update:i=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),r&&this.setScale(r),i&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),this.rotation.length===4){let e=new L().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:n}={}){return e&&this.setPosition(e),t&&this.setRotation(t),n&&this.setScale(n),this.updateMatrix(),this}getCoordinateUniforms(e,t){t||=this.matrix;let n=new L(e).multiplyRight(t),r=n.invert(),i=r.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:r,worldInverseTransposeMatrix:i}}_setScenegraphNodeProps(e){e.selectable!==void 0&&(this.selectable=e.selectable),e.hoverable!==void 0&&(this.hoverable=e.hoverable),e.display!==void 0&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}};function Gf(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function Kf(e,t,n){let r=new L(n);for(let n=0;n<8;n++){let i=new Gi(t[n&1?1:0][0],t[n&2?1:0][1],t[n&4?1:0][2]);r.transformAsPoint(i,i);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],i[t]),e[1][t]=Math.max(e[1][t],i[t])}}function qf(e){return Number.isFinite(e[0][0])}var Jf=class e extends Wf{children;transformSource;constructor(e={}){e=Array.isArray(e)?{children:e}:e;let{children:t=[]}=e;s.assert(t.every(e=>e instanceof Wf),`every child must an instance of ScenegraphNode`),super(e),this.children=t,this.transformSource=e.transformSource??null}getBounds(){let e=Gf();return this.traverse((t,{worldMatrix:n})=>{let r=t.getBounds();if(!r)return;let i=new L(n).multiplyRight(t.matrix);Kf(e,r,i)}),qf(e)?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,n=t.indexOf(e);return n>-1&&t.splice(n,1),this}removeAll(){return this.children=[],this}findNode(e){let t=this.findNodes(e);if(t.length>1)throw Error(`Ambiguous scenegraph path: ${e} (${t.length} matches)`);return t[0]}findNodes(t){let n=t.startsWith(`/`),r=t===`/`?[]:(n?t.slice(1):t).split(`/`).map(e=>{if(!e||/~(?![01])/.test(e))throw Error(`Invalid scenegraph path: ${t}`);return e.replace(/~1/g,`/`).replace(/~0/g,`~`)}),i=[],a=[],o=new Set,s=[{node:this,depth:0}];for(;s.length;){let{node:t,depth:c}=s.pop();h(!o.has(t)),o.add(t),a.length=c,a.push(t.id);let l=a.length-r.length;if((n?l===1:l>=0)&&r.every((e,t)=>e===a[l+t])&&i.push(t),t instanceof e)for(let e=t.children.length-1;e>=0;e--)s.push({node:t.children[e],depth:c+1})}return i}traverse(t,{worldMatrix:n=new L}={}){if(!this.display)return;let r=new L(n).multiplyRight(this.matrix);for(let n of this.children)n.display&&(n instanceof e?n.traverse(t,{worldMatrix:r}):t(n,{worldMatrix:r}))}traverseDepthSorted(e,{viewMatrix:t,worldMatrix:n=new L,order:r=`back-to-front`}){let i=new L(t),a=[];this.traverse((e,t)=>{let n=e.getBounds(),r=n?new Gi(n[0]).add(n[1]).divide([2,2,2]):new Gi,o=new L(t.worldMatrix).multiplyRight(e.matrix);o.transformAsPoint(r,r),i.transformAsPoint(r,r),a.push({node:e,context:{worldMatrix:o,bounds:n,depth:-r[2]},index:a.length})},{worldMatrix:new L(n)});let o=r===`back-to-front`?-1:1;a.sort((e,t)=>o*(e.context.depth-t.context.depth)||e.index-t.index);for(let{node:t,context:n}of a)e(t,n)}preorderTraversal(t,{worldMatrix:n=new L}={}){let r=new L(n).multiplyRight(this.matrix);t(this,{worldMatrix:r});for(let n of this.children)n instanceof e?n.preorderTraversal(t,{worldMatrix:r}):t(n,{worldMatrix:r})}},Yf=class extends Wf{geometry;constructor(e){super(e),this.geometry=e.geometry}getBounds(){let e=this.geometry.attributes.POSITION;if(!e||e.size!==3||!e.value.length)return null;let t=[1/0,1/0,1/0],n=[-1/0,-1/0,-1/0];for(let r=0;r<e.value.length;r++){let i=r%3;t[i]=Math.min(t[i],e.value[r]),n[i]=Math.max(n[i],e.value[r])}return[t,n]}};function Xf(e){return new Mf(e,{modules:[Fo]})}function Zf(e,t={}){let n=t.factory||Xf(e),r={};for(let[e,i]of Object.entries(t.bindings||{}))i&&n.ownsBinding(e)&&(r[e]=i);let i=n.createMaterial({id:t.id,bindings:r});return i.setProps({pbrMaterial:{...Qf(r),...t.uniforms}}),i}function Qf(e){return{baseColorMapEnabled:!!e.pbr_baseColorSampler,normalMapEnabled:!!e.pbr_normalSampler,lightmapMapEnabled:!!e.pbr_lightmapSampler,emissiveMapEnabled:!!e.pbr_emissiveSampler,metallicRoughnessMapEnabled:!!e.pbr_metallicRoughnessSampler,occlusionMapEnabled:!!e.pbr_occlusionSampler,specularColorMapEnabled:!!e.pbr_specularColorSampler,specularIntensityMapEnabled:!!e.pbr_specularIntensitySampler,transmissionMapEnabled:!!e.pbr_transmissionSampler,clearcoatMapEnabled:!!e.pbr_clearcoatSampler,clearcoatRoughnessMapEnabled:!!e.pbr_clearcoatRoughnessSampler,sheenColorMapEnabled:!!e.pbr_sheenColorSampler,sheenRoughnessMapEnabled:!!e.pbr_sheenRoughnessSampler,iridescenceMapEnabled:!!e.pbr_iridescenceSampler,anisotropyMapEnabled:!!e.pbr_anisotropySampler,bumpMapEnabled:!!e.pbr_bumpSampler,diffuseTransmissionMapEnabled:!!e.pbr_diffuseTransmissionSampler,diffuseTransmissionColorMapEnabled:!!e.pbr_diffuseTransmissionColorSampler,multiscatterColorMapEnabled:!!e.pbr_multiscatterColorSampler}}function $f(e={}){return`
struct PBRModelVertexInputs {
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
${e.vertexInputs??``}
#ifdef HAS_INSTANCING
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
#endif
};

struct PBRModelFragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
  @location(4) pbrColor: vec4f,
${e.fragmentInputs??``}
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
fn vertexMain(inputs: PBRModelVertexInputs) -> PBRModelFragmentInputs {
  var outputs: PBRModelFragmentInputs;
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
  normal = normalize(getPBRInstanceNormalMatrix(mat3x3f(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz)) * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w * sign(determinant(mat3x3f(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz))));
#endif
#endif

#ifdef HAS_INSTANCING
  var instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
${e.instanceTransform??``}  position = instanceMatrix * position;
  let instanceNormalMatrix = getPBRInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz, instanceMatrix[1].xyz, instanceMatrix[2].xyz
  ));
  normal = normalize(instanceNormalMatrix * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w * sign(determinant(mat3x3f(instanceMatrix[0].xyz, instanceMatrix[1].xyz, instanceMatrix[2].xyz))));
#endif
#endif
  let worldPosition = pbrProjection.modelMatrix * position;
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w * sign(determinant(mat3x3f(pbrProjection.modelMatrix[0].xyz, pbrProjection.modelMatrix[1].xyz, pbrProjection.modelMatrix[2].xyz))));
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
#ifdef PBR_LIGHTMAP_PASS
  let atlasUV = (lightmapBake.uvTransform * vec3f(select(textureCoordinates, secondTextureCoordinates, lightmapBake.uvSet == 1), 1.0)).xy;
  outputs.position = vec4f(atlasUV.x * 2.0 - 1.0, 1.0 - atlasUV.y * 2.0, 0.0, 1.0);
#endif
${e.vertexOutput??``}
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

${e.fragmentDeclarations??``}
@fragment
fn fragmentMain(inputs: PBRModelFragmentInputs, @builtin(front_facing) frontFacing: bool)
${e.fragmentReturnType??`#ifndef PBR_SHADOW_PASS
-> @location(0) vec4f
#endif`}
{
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
${e.fragmentBody??`
#ifdef PBR_LIGHTMAP_PASS
  pbr_discardMaskedFragment(inputs.pbrColor);
  var directionalVisibility = 1.0;
  var pointVisibility = vec4f(1.0);
  var spotVisibility = vec4f(1.0);
  let normal = normalize(inputs.pbrNormal);
#ifdef PBR_RECEIVE_SHADOWS
  if (pbrShadow.enabled != 0) {
  let viewDepth = -(pbrShadow.viewMatrix * vec4f(inputs.pbrPosition, 1.0)).z;
  directionalVisibility = shadow_getDirectionalFactor(inputs.pbrPosition, normal, viewDepth);
  for (var index = 0; index < 4; index++) {
    pointVisibility[index] = shadow_getPointFactor(index, inputs.pbrPosition, normal);
    spotVisibility[index] = shadow_getSpotFactor(index, inputs.pbrPosition, normal);
  }
  }
#endif
  return vec4f(lightmap_getIrradiance(inputs.pbrPosition, normal, directionalVisibility, pointVisibility, spotVisibility), lightmapBake.chartId);
#else
#ifdef PBR_SHADOW_PASS
  pbr_discardMaskedFragment(inputs.pbrColor);
#else
#ifdef PBR_SURFACE_PASS
  pbr_discardMaskedFragment(inputs.pbrColor);
  return pbrSurface_getColor();
#else
#ifdef DEBUG_NORMALS
  return vec4f(normalize(inputs.pbrNormal) * 0.5 + vec3f(0.5), 1.0);
#else
#ifdef DEBUG_DEPTH
  return vec4f(vec3f(inputs.position.z), 1.0);
#else
#ifdef PBR_RECEIVE_AMBIENT_OCCLUSION
  pbrAmbientOcclusion_setFactor(inputs.position.xy);
#endif
#ifdef PBR_RECEIVE_SHADOWS
#ifdef HAS_NORMALS
  let shadowNormal = inputs.pbrNormal;
#else
  let shadowNormal = normalize(cross(dpdy(inputs.pbrPosition), dpdx(inputs.pbrPosition)));
#endif
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  return pbrShadow_filterColorWithDirectionalContact(inputs.pbrColor, inputs.pbrPosition, shadowNormal, pbrContactShadow_getFactor(inputs.position.xy));
#else
  return pbrShadow_filterColor(inputs.pbrColor, inputs.pbrPosition, shadowNormal);
#endif
#else
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  return pbrContactShadow_filterColor(inputs.pbrColor, inputs.position.xy);
#else
  return pbr_filterColor(inputs.pbrColor);
#endif
#endif
#endif
#endif
#endif
#endif
#endif
`}
}
`}var ep=$f(),tp=`#version 300 es
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
  normal = vec4(transpose(inverse(mat3(skinMatrix))) * normal.xyz, 0.0);
  tangent = vec4((skinMatrix * vec4(tangent.xyz, 0.0)).xyz, tangent.w * sign(determinant(mat3(skinMatrix))));
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
  tangent = vec4(normalize(mat3(instanceMatrix) * tangent.xyz), tangent.w * sign(determinant(mat3(instanceMatrix))));
#endif

  tangent.w *= sign(determinant(mat3(pbrProjection.modelMatrix)));
  pbr_setPositionNormalTangentUV(
    position,
    normal,
    tangent,
    textureCoordinates,
    secondTextureCoordinates
  );
  gl_Position = pbrProjection.modelViewProjectionMatrix * position;
#ifdef PBR_LIGHTMAP_PASS
  vec2 atlasUV = (lightmapBake.uvTransform * vec3(lightmapBake.uvSet == 1 ? secondTextureCoordinates : textureCoordinates, 1.0)).xy;
  gl_Position = vec4(atlasUV * 2.0 - 1.0, 0.0, 1.0);
#endif
#ifdef PBR_SHADOW_PASS
  // ShadowMapRenderer light projections use [0, 1] depth on both backends.
  gl_Position.z = gl_Position.z * 2.0 - gl_Position.w;
#endif
}
`,np=`#version 300 es
in vec4 sceneVertexColor;
#ifndef PBR_SHADOW_PASS
out vec4 fragmentColor;
#endif

void main(void) {
#ifdef PBR_LIGHTMAP_PASS
  pbr_discardMaskedFragment(sceneVertexColor);
#ifdef HAS_TANGENTS
  vec3 normal = normalize(pbr_vTBN[2]);
#else
  vec3 normal = normalize(pbr_vNormal);
#endif
  float directionalVisibility = 1.0;
  vec4 pointVisibility = vec4(1.0);
  vec4 spotVisibility = vec4(1.0);
#ifdef PBR_RECEIVE_SHADOWS
  if (pbrShadow.enabled != 0) {
  float viewDepth = -(pbrShadow.viewMatrix * vec4(pbr_vPosition, 1.0)).z;
  directionalVisibility = shadow_getDirectionalFactor(pbr_vPosition, normal, viewDepth);
  for (int index = 0; index < 4; index++) {
    pointVisibility[index] = shadow_getPointFactor(index, pbr_vPosition, normal);
    spotVisibility[index] = shadow_getSpotFactor(index, pbr_vPosition, normal);
  }
  }
#endif
  fragmentColor = vec4(lightmap_getIrradiance(pbr_vPosition, normal, directionalVisibility, pointVisibility, spotVisibility), lightmapBake.chartId);
#else
#ifdef PBR_SHADOW_PASS
  pbr_discardMaskedFragment(sceneVertexColor);
#else
#ifdef PBR_SURFACE_PASS
  pbr_discardMaskedFragment(sceneVertexColor);
  fragmentColor = pbrSurface_getColor();
#else
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
#ifdef PBR_RECEIVE_AMBIENT_OCCLUSION
  pbrAmbientOcclusion_setFactor(gl_FragCoord.xy);
#endif
#ifdef PBR_RECEIVE_SHADOWS
#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 shadowNormal = pbr_vTBN[2];
#else
  vec3 shadowNormal = pbr_vNormal;
#endif
#else
  vec3 shadowNormal = normalize(cross(dFdx(pbr_vPosition), dFdy(pbr_vPosition)));
#endif
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  fragmentColor = pbrShadow_filterColorWithDirectionalContact(sceneVertexColor, pbr_vPosition, shadowNormal, pbrContactShadow_getFactor(gl_FragCoord.xy));
#else
  fragmentColor = pbrShadow_filterColor(sceneVertexColor, pbr_vPosition, shadowNormal);
#endif
#else
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  fragmentColor = pbrContactShadow_filterColor(sceneVertexColor, gl_FragCoord.xy);
#else
  fragmentColor = pbr_filterColor(sceneVertexColor);
#endif
#endif
#endif
#endif
#endif
#endif
#endif
}
`;function rp(e,t){let{receiveShadows:n=!1,receiveContactShadows:r=!1,receiveAmbientOcclusion:i=!1,...a}=t,o=[Po,Fo,...n?[Ko]:[],...r?[Jo]:[],...i?[Yo]:[],...t.defines?.PBR_SURFACE_PASS?[qo]:[],...t.modules||[]],s=o.filter((e,t)=>o.findIndex(t=>t.name===e.name)===t),c=ip(t.geometry);(t.defines?.HAS_SKIN??c.HAS_SKIN)&&!s.some(e=>e.name===to.name)&&s.push(to);let l=new jf(e,{source:ep,vs:tp,fs:np,...a,modules:s,defines:{USE_SCENE_COLOR_MANAGEMENT:!0,PBR_RECEIVE_SHADOWS:n,PBR_RECEIVE_CONTACT_SHADOWS:r,PBR_RECEIVE_AMBIENT_OCCLUSION:i,...c,...ap(t.material.getResourceBindings()),...t.defines}});if(!t.shaderInputs){let e=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];l.shaderInputs.setProps({pbrProjection:{modelMatrix:e.slice(),modelViewProjectionMatrix:e.slice(),normalMatrix:e.slice(),camera:[0,0,1]},pbrScene:{toneMapMode:0,outputEncoding:0}})}return l}function ip(e){let t=e&&`attributes`in e?e.attributes:{},n=t.COLOR_0||t.colors;return{HAS_NORMALS:!!(t.NORMAL||t.normals),HAS_TANGENTS:!!(t.TANGENT||t.tangents),HAS_UV:!!(t.TEXCOORD_0||t.texCoords),HAS_UV_1:!!(t.TEXCOORD_1||t.texCoords1),HAS_SKIN:!!(t.JOINTS_0&&t.WEIGHTS_0),HAS_COLORS:!!n,HAS_RGBA_COLORS:!!(n&&`size`in n&&n.size===4)}}function ap(e){return{HAS_BASECOLORMAP:!!e.pbr_baseColorSampler,HAS_NORMALMAP:!!e.pbr_normalSampler,HAS_LIGHTMAP:!!e.pbr_lightmapSampler,HAS_EMISSIVEMAP:!!e.pbr_emissiveSampler,HAS_METALROUGHNESSMAP:!!e.pbr_metallicRoughnessSampler,HAS_OCCLUSIONMAP:!!e.pbr_occlusionSampler,HAS_SPECULARCOLORMAP:!!e.pbr_specularColorSampler,HAS_SPECULARINTENSITYMAP:!!e.pbr_specularIntensitySampler,HAS_TRANSMISSIONMAP:!!e.pbr_transmissionSampler,HAS_THICKNESSMAP:!!e.pbr_thicknessSampler,HAS_CLEARCOATMAP:!!e.pbr_clearcoatSampler,HAS_CLEARCOATROUGHNESSMAP:!!e.pbr_clearcoatRoughnessSampler,HAS_CLEARCOATNORMALMAP:!!e.pbr_clearcoatNormalSampler,HAS_SHEENCOLORMAP:!!e.pbr_sheenColorSampler,HAS_SHEENROUGHNESSMAP:!!e.pbr_sheenRoughnessSampler,HAS_IRIDESCENCEMAP:!!e.pbr_iridescenceSampler,HAS_IRIDESCENCETHICKNESSMAP:!!e.pbr_iridescenceThicknessSampler,HAS_ANISOTROPYMAP:!!e.pbr_anisotropySampler,HAS_BUMPMAP:!!e.pbr_bumpSampler,HAS_DIFFUSETRANSMISSIONMAP:!!e.pbr_diffuseTransmissionSampler,HAS_DIFFUSETRANSMISSIONCOLORMAP:!!e.pbr_diffuseTransmissionColorSampler,HAS_MULTISCATTERCOLORMAP:!!e.pbr_multiscatterColorSampler}}var op=Object.freeze({low:Object.freeze({cascadeCount:3,directionalMapSize:1024,spotMapSize:512,pointMapSize:256,blockerSampleCount:8,filterSampleCount:12,contactScale:.5,contactStepCount:12}),balanced:Object.freeze({cascadeCount:4,directionalMapSize:1536,spotMapSize:1024,pointMapSize:512,blockerSampleCount:16,filterSampleCount:24,contactScale:.75,contactStepCount:24}),cinematic:Object.freeze({cascadeCount:4,directionalMapSize:2048,spotMapSize:2048,pointMapSize:1024,blockerSampleCount:24,filterSampleCount:48,contactScale:1,contactStepCount:40})}),sp=4,cp=4,lp=4,up=4,dp=6,fp=.1,pp=[1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1],mp=[1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],hp=[{face:`+X`,direction:[1,0,0],up:[0,-1,0]},{face:`-X`,direction:[-1,0,0],up:[0,-1,0]},{face:`+Y`,direction:[0,1,0],up:[0,0,1]},{face:`-Y`,direction:[0,-1,0],up:[0,0,-1]},{face:`+Z`,direction:[0,0,1],up:[0,-1,0]},{face:`-Z`,direction:[0,0,-1],up:[0,-1,0]}],gp=0,_p=class{device;props;inputProps;resources;destroyed=!1;constructor(e,t={}){if(e.type!==`webgpu`&&e.type!==`webgl`)throw Error(`ShadowMapRenderer requires a WebGPU or WebGL2 device.`);this.device=e,this.inputProps={...t},this.props=Sp(e,this.inputProps),this.resources=Cp(e,this.props)}setProps(e){this.assertNotDestroyed();let t={...this.inputProps,...e},n=Sp(this.device,t),r=!Dp(this.props,n);if(this.inputProps=t,this.props=n,!r)return;let i=this.resources;this.resources=Cp(this.device,n),Ep(i)}render(e){this.assertNotDestroyed(),Mp(e.camera);let t=e.directionalLights||[],n=e.spotLights||[],r=e.pointLights||[];Fp(`directional`,t.length,this.props.directionalLightCapacity),Fp(`spot`,n.length,this.props.spotLightCapacity),Fp(`point`,r.length,this.props.pointLightCapacity);let i=[],a=t.map(t=>Op(t,e.camera)),o=a.map((t,n)=>{let r=Lp(vp(e.camera.near,t.shadowDistance,this.props.cascadeCount,t.cascadeSplitLambda),t.shadowDistance),a=yp(e.camera,t,r,this.props.cascadeCount,this.props.directionalMapSize);return i.push(...a),a.forEach((r,i)=>{this.renderView({framebuffer:this.resources.directionalFramebuffers[n*this.props.cascadeCount+i],view:r,type:`directional`,lightIndex:n,cascadeIndex:i,mapSize:this.props.directionalMapSize,light:t,drawShadowCasters:e.drawShadowCasters,prepareShadowCasters:e.prepareShadowCasters})}),r}),s=n.map(e=>bp(kp(e)));s.forEach((t,r)=>{this.renderView({framebuffer:this.resources.spotFramebuffers[r],view:t,type:`spot`,lightIndex:r,mapSize:this.props.spotMapSize,light:kp(n[r]),drawShadowCasters:e.drawShadowCasters,prepareShadowCasters:e.prepareShadowCasters})});let c=r.flatMap(e=>xp(Ap(e),this.device.type===`webgpu`));return r.forEach((t,n)=>{let r=Ap(t);for(let t=0;t<dp;t++){let i=n*dp+t;this.renderView({framebuffer:this.resources.pointFramebuffers[i],view:c[i],type:`point`,lightIndex:n,pointFace:hp[t].face,mapSize:this.props.pointMapSize,light:r,drawShadowCasters:e.drawShadowCasters,prepareShadowCasters:e.prepareShadowCasters})}}),{quality:this.props.quality,cascadeCount:this.props.cascadeCount,cascadeSplits:o[0]??Lp([],e.camera.far),directionalCascadeSplits:o,blockerSampleCount:this.props.blockerSampleCount,filterSampleCount:this.props.filterSampleCount,directionalLights:a,spotLights:n.map(kp),pointLights:r.map(Ap),directionalViewProjectionMatrices:Rp(i.map(e=>e.viewProjectionMatrix),sp*up),spotViewProjectionMatrices:Rp(s.map(e=>e.viewProjectionMatrix),cp),pointViewProjectionMatrices:Rp(c.map(e=>e.viewProjectionMatrix),lp*dp),directionalShadowTexture:this.resources.directionalTexture,spotShadowTexture:this.resources.spotTexture,pointShadowTexture:this.resources.pointTexture,comparisonSampler:this.resources.comparisonSampler,nonFilteringSampler:this.resources.nonFilteringSampler}}destroy(){this.destroyed||(this.destroyed=!0,Ep(this.resources))}renderView(e){let t=Object.freeze({depthWriteEnabled:!0,depthCompare:`less-equal`,depthBias:e.light.depthBias,depthBiasSlopeScale:e.light.depthBiasSlopeScale,cullMode:`back`,frontFace:e.type===`point`&&this.device.type===`webgpu`?`cw`:`ccw`}),n={framebuffer:e.framebuffer,type:e.type,lightIndex:e.lightIndex,cascadeIndex:e.cascadeIndex,pointFace:e.pointFace,camera:e.view.camera,viewProjectionMatrix:e.view.viewProjectionMatrix,mapSize:e.mapSize,rasterParameters:t};e.prepareShadowCasters?.(n);let r=this.device.beginRenderPass({id:Xp(`${e.type}-shadow-pass`),framebuffer:e.framebuffer,clearDepth:1});try{e.drawShadowCasters({renderPass:r,framebuffer:e.framebuffer,type:e.type,lightIndex:e.lightIndex,cascadeIndex:e.cascadeIndex,pointFace:e.pointFace,camera:e.view.camera,viewProjectionMatrix:e.view.viewProjectionMatrix,mapSize:e.mapSize,rasterParameters:t})}finally{r.end()}}assertNotDestroyed(){if(this.destroyed)throw Error(`ShadowMapRenderer has been destroyed.`)}};function vp(e,t,n,r=.5){if(!(e>0&&t>e))throw Error(`Cascade split range requires 0 < near < far.`);if(!Number.isInteger(n)||n<1||n>up)throw Error(`Cascade count must be an integer from 1 to ${up}.`);let i=Yp(r,0,1),a=[];for(let r=1;r<=n;r++){let o=r/n,s=e*(t/e)**+o,c=e+(t-e)*o;a.push(c*(1-i)+s*i)}return a}function yp(e,t,n,r,i){let a=new L(e.projectionMatrix).multiplyRight(e.viewMatrix).invert(),o=zp(a,e.clipDepth===`zero-to-one`?0:-1),s=zp(a,1),c=Vp(t.direction),l=[],u=e.near;for(let a=0;a<r;a++){let r=n[a],d=(u-e.near)/(e.far-e.near),f=(r-e.near)/(e.far-e.near),p=[];for(let e=0;e<4;e++)p.push(Kp(o[e],s[e],d)),p.push(Kp(o[e],s[e],f));let m=qp(p),h=0;for(let e of p)h=Math.max(h,Jp(m,e));h=Math.ceil(h*16)/16;let g=h*2/i,_=Up(c,-1),v=Vp(Gp(_,Math.abs(_[1])>.99?[0,0,1]:[0,1,0])),y=Vp(Gp(v,_)),b=Wp(m,v),x=Wp(m,y),S=Hp(m,Hp(Up(v,Math.round(b/g)*g-b),Up(y,Math.round(x/g)*g-x))),C=Hp(S,Up(c,h+t.casterDistance)),w=new L().lookAt({eye:C,center:S,up:y}),T=new L(pp).multiplyRight(new L().ortho({left:-h,right:h,bottom:-h,top:h,near:.01,far:h*2+t.casterDistance}));l.push({camera:{viewMatrix:w,projectionMatrix:T,near:.01,far:h*2+t.casterDistance,clipDepth:`zero-to-one`},viewProjectionMatrix:new L(T).multiplyRight(w)}),u=r}return l}function bp(e){let t=Vp(e.direction),n=Math.abs(t[1])>.99?[0,0,1]:[0,1,0],r=new L().lookAt({eye:e.position,center:Hp(e.position,t),up:n}),i=new L(pp).multiplyRight(new L().perspective({fovy:e.outerConeAngle*2,aspect:1,near:e.nearPlane,far:e.range}));return{camera:{viewMatrix:r,projectionMatrix:i,near:e.nearPlane,far:e.range,clipDepth:`zero-to-one`},viewProjectionMatrix:new L(i).multiplyRight(r)}}function xp(e,t=!1){let n=new L(pp).multiplyRight(new L().perspective({fovy:pi(90),aspect:1,near:e.nearPlane,far:e.range}));return t&&n.multiplyLeft(new L().scale([1,-1,1])),hp.map(t=>{let r=new L().lookAt({eye:e.position,center:Hp(e.position,t.direction),up:t.up});return{camera:{viewMatrix:r,projectionMatrix:n,near:e.nearPlane,far:e.range,clipDepth:`zero-to-one`},viewProjectionMatrix:new L(n).multiplyRight(r)}})}function Sp(e,t){let n=t.quality||`balanced`,r=op[n];if(!r)throw Error(`Unknown shadow quality: ${String(n)}.`);let i={quality:n,directionalLightCapacity:t.directionalLightCapacity??1,spotLightCapacity:t.spotLightCapacity??1,pointLightCapacity:t.pointLightCapacity??1,directionalMapSize:t.directionalMapSize??r.directionalMapSize,spotMapSize:t.spotMapSize??r.spotMapSize,pointMapSize:t.pointMapSize??r.pointMapSize,cascadeCount:r.cascadeCount,blockerSampleCount:r.blockerSampleCount,filterSampleCount:r.filterSampleCount};Np(`directionalLightCapacity`,i.directionalLightCapacity,sp),Np(`spotLightCapacity`,i.spotLightCapacity,cp),Np(`pointLightCapacity`,i.pointLightCapacity,lp),Pp(e,`directionalMapSize`,i.directionalMapSize),Pp(e,`spotMapSize`,i.spotMapSize),Pp(e,`pointMapSize`,i.pointMapSize);let a=Math.max(dp,i.pointLightCapacity*dp);if(a>e.limits.maxTextureArrayLayers)throw Error(`pointLightCapacity requires ${a} array layers, exceeding the device limit ${e.limits.maxTextureArrayLayers}.`);return i}function Cp(e,t){let n=Math.max(1,t.directionalLightCapacity*t.cascadeCount),r=Math.max(1,t.spotLightCapacity),i=Math.max(dp,t.pointLightCapacity*dp),a=e.createSampler({id:Xp(`shadow-comparison-sampler`),type:`comparison-sampler`,compare:`less-equal`,minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`}),o=e.createSampler({id:Xp(`shadow-depth-sampler`),minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`}),s=wp(e,`directional-shadow-map`,`2d-array`,t.directionalMapSize,n,o),c=wp(e,`spot-shadow-map`,`2d-array`,t.spotMapSize,r,o),l=wp(e,`point-shadow-map`,e.type===`webgpu`?`cube-array`:`2d-array`,t.pointMapSize,i,o),u=[];return{directionalTexture:s,spotTexture:c,pointTexture:l,comparisonSampler:a,nonFilteringSampler:o,directionalFramebuffers:Tp(e,s,t.directionalMapSize,n,u),spotFramebuffers:Tp(e,c,t.spotMapSize,r,u),pointFramebuffers:Tp(e,l,t.pointMapSize,i,u),attachmentViews:u}}function wp(e,t,r,i,a,o){return e.createTexture({id:Xp(t),dimension:r,format:`depth32float`,width:i,height:i,depth:a,sampler:o,usage:n.SAMPLE|n.RENDER})}function Tp(e,t,n,r,i){return Array.from({length:r},(r,a)=>{let o=t.createView({id:Xp(`shadow-layer-view`),format:t.format,dimension:`2d`,baseMipLevel:0,mipLevelCount:1,baseArrayLayer:a,arrayLayerCount:1});return i.push(o),e.createFramebuffer({id:Xp(`shadow-layer-framebuffer`),width:n,height:n,colorAttachments:[],depthStencilAttachment:o})})}function Ep(e){for(let t of[...e.directionalFramebuffers,...e.spotFramebuffers,...e.pointFramebuffers])t.destroy();for(let t of e.attachmentViews)t.destroy();e.directionalTexture.destroy(),e.spotTexture.destroy(),e.pointTexture.destroy(),e.comparisonSampler.destroy(),e.nonFilteringSampler.destroy()}function Dp(e,t){return e.cascadeCount===t.cascadeCount&&e.directionalLightCapacity===t.directionalLightCapacity&&e.spotLightCapacity===t.spotLightCapacity&&e.pointLightCapacity===t.pointLightCapacity&&e.directionalMapSize===t.directionalMapSize&&e.spotMapSize===t.spotMapSize&&e.pointMapSize===t.pointMapSize}function Op(e,t){let n=Yp(e.shadowDistance??t.far,t.near,t.far);return{direction:Vp(e.direction),shadowDistance:n,casterDistance:e.casterDistance??n,sourceAngularRadius:e.sourceAngularRadius??.00465,cascadeSplitLambda:e.cascadeSplitLambda??.5,cascadeBlendFraction:e.cascadeBlendFraction??.1,farFadeFraction:e.farFadeFraction??.1,normalBias:e.normalBias??.04,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:Yp(e.strength??1,0,1)}}function kp(e){if(Ip(`Spot shadow`,e.range),!(e.outerConeAngle>0&&e.outerConeAngle<Math.PI/2))throw Error(`Spot shadow outerConeAngle must be between 0 and PI / 2 radians.`);return{position:[...e.position],direction:Vp(e.direction),range:e.range,outerConeAngle:e.outerConeAngle,nearPlane:jp(e.nearPlane,e.range),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:Yp(e.strength??1,0,1)}}function Ap(e){return Ip(`Point shadow`,e.range),{position:[...e.position],range:e.range,nearPlane:jp(e.nearPlane,e.range),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:Yp(e.strength??1,0,1)}}function jp(e,t){let n=e??Math.max(fp,t/1e3);if(!(n>0&&n<t))throw Error(`Shadow nearPlane must be greater than zero and less than range.`);return n}function Mp(e){if(!(e.near>0&&e.far>e.near))throw Error(`ShadowCamera requires 0 < near < far.`)}function Np(e,t,n){if(!Number.isInteger(t)||t<0||t>n)throw Error(`${e} must be an integer from 0 to ${n}.`)}function Pp(e,t,n){if(!Number.isInteger(n)||n<1||n>e.limits.maxTextureDimension2D)throw Error(`${t} must be a positive integer no greater than ${e.limits.maxTextureDimension2D}.`)}function Fp(e,t,n){if(t>n)throw Error(`${e} shadow light count ${t} exceeds configured capacity ${n}.`)}function Ip(e,t){if(!(t>0&&Number.isFinite(t)))throw Error(`${e} range must be a finite positive number.`)}function Lp(e,t){let n=e.slice(0,up);for(;n.length<up;)n.push(n[n.length-1]??t);return n}function Rp(e,t){let n=e.slice(0,t);for(;n.length<t;)n.push(mp);return n}function zp(e,t){return[Bp(e,[-1,-1,t]),Bp(e,[1,-1,t]),Bp(e,[1,1,t]),Bp(e,[-1,1,t])]}function Bp(e,t){let n=t[0],r=t[1],i=t[2],a=e[3]*n+e[7]*r+e[11]*i+e[15];return[(e[0]*n+e[4]*r+e[8]*i+e[12])/a,(e[1]*n+e[5]*r+e[9]*i+e[13])/a,(e[2]*n+e[6]*r+e[10]*i+e[14])/a]}function Vp(e){let t=Math.hypot(e[0],e[1],e[2]);if(!(t>0))throw Error(`Shadow light direction must be non-zero.`);return[e[0]/t,e[1]/t,e[2]/t]}function Hp(e,t){return[e[0]+t[0],e[1]+t[1],e[2]+t[2]]}function Up(e,t){return[e[0]*t,e[1]*t,e[2]*t]}function Wp(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function Gp(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function Kp(e,t,n){return[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n]}function qp(e){let t=[0,0,0];for(let n of e)t[0]+=n[0],t[1]+=n[1],t[2]+=n[2];return Up(t,1/e.length)}function Jp(e,t){return Math.hypot(e[0]-t[0],e[1]-t[1],e[2]-t[2])}function Yp(e,t,n){return Math.max(t,Math.min(n,e))}function Xp(e){return gp+=1,`${e}-${gp}`}var Zp=$f({vertexInputs:`#ifdef USE_SCENE_INSTANCES
  @location(12) instanceMetadata: vec4u,
#endif`,fragmentInputs:`#ifdef USE_SCENE_INSTANCES
  @location(6) @interpolate(flat) instanceIdentifier: u32,
#endif`,instanceTransform:`#ifdef HAS_GPU_TRANSFORMS
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
`,vertexOutput:`#ifdef USE_SCENE_PROBE_CAMERA
  outputs.position = pbrProjection.modelViewProjectionMatrix * vec4f(worldPosition.xyz - sceneProbeOrigin[0].xyz, worldPosition.w);
#endif
#ifdef USE_SCENE_INSTANCES
  outputs.instanceIdentifier = inputs.instanceMetadata.z;
#endif`,fragmentDeclarations:`// Depth, shadow and picking must use the visible material's alpha cutoff and UV transform.
fn sceneDiscardMaskedFragment(inputs: PBRModelFragmentInputs) {
#ifdef ALPHA_CUTOFF
  var alpha = pbrMaterial.baseColorFactor.a * inputs.pbrColor.a;
#ifdef HAS_BASECOLORMAP
  let coordinates = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  alpha *= textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, coordinates).a;
#endif
  if (alpha < pbrMaterial.alphaCutoff) {discard;}
#endif
}
`,fragmentReturnType:`#ifdef SCENE_DEPTH_PASS
#else
 -> @location(0) vec4f
#endif`,fragmentBody:`#ifndef SCENE_DEPTH_PASS
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
#endif`});function Qp(e,t){return rp(e,{source:Zp,...t})}var $p={name:`sceneProbeCamera`,source:`@group(0) @binding(auto) var<storage, read> sceneProbeOrigin: array<vec4f>;`,bindingLayout:[{name:`sceneProbeOrigin`,group:0}]},em={name:`sceneInstances`,source:`
#ifdef HAS_GPU_TRANSFORMS
@group(0) @binding(auto) var<storage,read> sceneWorldMatrices:array<mat4x4f>;
#endif
`,bindingLayout:[{name:`sceneWorldMatrices`,group:0}]},tm=class extends Yf{material;environment;connection;constructor(e){super(e),this.material=e.material,this.environment=e.environment,this.connection=e.connection}},nm=class{identifiers=new Map;nextIdentifier=1;used=new Set;getIdentifier(e){this.used.add(e);let t=this.identifiers.get(e);return t===void 0&&(t=this.nextIdentifier++,this.identifiers.set(e,t)),t}getSurfaces(e){this.used.clear();let t=new Map,n=new Set,r=[{node:e,matrix:new L,frame:null,visible:!0}];for(;r.length;){let e=r.pop(),{node:i}=e;h(!n.has(i)),n.add(i);let a=new L(e.matrix).multiplyRight(i.matrix),o=i instanceof Jf&&i.transformSource?i.transformSource.getFrame():e.frame,s=o?.bindings.get(i),c=e.visible&&i.display&&s?.visible!==!1;if(i instanceof Jf)for(let e=i.children.length-1;e>=0;e--)r.push({node:i.children[e],matrix:a,frame:o,visible:c});else if(i instanceof tm&&c){if(i.connection&&!o)continue;let e=!!(o&&(s||i.connection)),n=[this.getIdentifier(i.geometry),this.getIdentifier(i.material),i.environment?this.getIdentifier(i.environment):0,e?this.getIdentifier(o.matrices):0,om(i.material)===`BLEND`?this.getIdentifier(i):0].join(`-`),r=t.get(n);if(r||(r={id:n,geometry:i.geometry,material:i.material,transforms:[],nodes:[],environment:i.environment,...e?{gpuTransforms:{matrices:o.matrices,matrixCount:o.matrixCount,revision:o.revision,indices:[],connections:[]}}:{}},t.set(n,r)),r.transforms.push(s?new L(s.localMatrix):a),r.nodes.push(i),e){let e=i.connection?.first??s.matrixIndex,t=i.connection?.second;h(Number.isInteger(e)&&e>=0&&e<o.matrixCount),h(t===void 0||Number.isInteger(t)&&t>=0&&t<o.matrixCount),r.gpuTransforms.indices.push(e),r.gpuTransforms.connections.push(i.connection)}}else if(c&&!(i instanceof tm)&&`model`in i)throw Error(`SceneRenderer scene traversal requires SceneMeshNode for renderable leaves`)}for(let e of this.identifiers.keys())this.used.has(e)||this.identifiers.delete(e);return Array.from(t.values())}destroy(){this.identifiers.clear(),this.used.clear()}},rm=new L,im=class{device;materialFactory;scenegraphs=new Map;nextSceneIdentifier=1;shadowMaps=new Map;pickNodes=new Map;frames=new Map;constructor(e){this.device=e,this.materialFactory=Xf(e)}render(e){let t=this.resolveSceneOptions(e);if(t.camera.gpuOrigin){let e=t.camera.gpuOrigin;h(this.device.type===`webgpu`&&e.device===this.device&&e.byteLength>=16&&e.usage&N.STORAGE&&!t.spotShadows&&!t.rasterPass&&(t.transmission===!1||t.renderMode&&t.renderMode!=="default"||!t.surfaces.some(mm)))}let n;t.spotShadows&&!t.rasterPass&&(n=this.renderShadows(t));let r=this.getTransmissionResources(t),i=t.background||[0,0,0,1];if(r){let e={...t,id:gm(t.id),surfaces:t.surfaces.filter(e=>!mm(e)&&om(e.material)!==`BLEND`),framebuffer:r.framebuffer,exposure:1,toneMapMode:jo.NONE,outputColorSpace:`linear`,transmission:!1},a=this.prepareScene(e,void 0,n),o=this.device.beginRenderPass({id:`scene-${t.id}-transmission`,framebuffer:r.framebuffer,clearColor:[i[0],i[1],i[2],i[3]??1],clearDepth:1});this.drawPreparedScene(a,o),o.end()}else this.destroyFrame(gm(t.id));let a=this.prepareScene(t,r?.colorTexture,n),o=this.device.beginRenderPass({id:`scene-${t.id}`,framebuffer:t.framebuffer,clearColor:Sm(this.device,t,i),clearDepth:1});return a.statistics.drawCount=this.drawPreparedScene(a,o),o.end(),a.statistics}resolveSceneOptions(e){if(!(`scene`in e))return e;let t=this.scenegraphs.get(e.scene);t||(t={id:`scenegraph-${this.nextSceneIdentifier++}`,adapter:new nm},this.scenegraphs.set(e.scene,t));let{scene:n,...r}=e;return{...r,id:t.id,surfaces:t.adapter.getSurfaces(n)}}destroyScene(e){let t=this.scenegraphs.get(e);t&&(this.destroyFrame(t.id),t.adapter.destroy(),this.scenegraphs.delete(e))}async pick(e,t){h(this.device.type===`webgpu`);let r=this.resolveSceneOptions(e),[i,a]=wm(this.device,r);if(!Number.isInteger(t.x)||!Number.isInteger(t.y)||t.x<0||t.y<0||t.x>=i||t.y>=a)return;let o=this.device.createTexture({width:i,height:a,format:`rgba8unorm`,usage:n.RENDER|n.COPY_SRC}),s=this.device.createTexture({width:i,height:a,format:`depth24plus`,usage:n.RENDER}),c=this.device.createFramebuffer({width:i,height:a,colorAttachments:[o],depthStencilAttachment:s}),l=o.computeMemoryLayout({width:1,height:1}),u=this.device.createBuffer({byteLength:l.byteLength,usage:N.COPY_DST|N.MAP_READ}),d=`${r.id}-pick-${this.nextSceneIdentifier++}`;try{this.pickNodes.clear(),this.render({...r,id:d,framebuffer:c,rasterPass:`picking`,renderMode:`default`,spotShadows:void 0,transmission:!1,background:[0,0,0,0],environment:void 0,lights:[],outputColorSpace:`linear`,toneMapMode:0});let e=new Map(this.pickNodes);this.pickNodes.clear(),this.device.submit(),o.readBuffer({x:t.x,y:t.y,width:1,height:1},u);let n=await u.readAsync(0,l.byteLength),i=new Uint8Array(n.buffer,n.byteOffset,4);return e.get(i[0]|i[1]<<8|i[2]<<16)}finally{this.pickNodes.clear(),this.destroyFrame(d),u.destroy(),c.destroy(),o.destroy(),s.destroy()}}renderShadows(e){h(this.device.type===`webgpu`);let t=this.shadowMaps.get(e.id);t||(t=new _p(this.device,{directionalLightCapacity:0,pointLightCapacity:0,spotLightCapacity:e.spotShadows.spotLights.length,spotMapSize:e.spotShadows.mapSize??2048}),this.shadowMaps.set(e.id,t)),t.setProps({spotMapSize:e.spotShadows.mapSize??2048,spotLightCapacity:e.spotShadows.spotLights.length});let n=new Map;return t.render({camera:{viewMatrix:new L(e.camera.viewMatrix),projectionMatrix:new L(e.camera.projectionMatrix),near:e.camera.near??.1,far:e.camera.far??1e3,clipDepth:e.camera.clipDepth},spotLights:[...e.spotShadows.spotLights],prepareShadowCasters:t=>{let r=this.prepareScene({...e,id:`${e.id}-shadow-${t.lightIndex}`,spotShadows:void 0,rasterPass:`depth`,transmission:!1,environment:void 0,lights:[],framebuffer:t.framebuffer,camera:{...e.camera,viewMatrix:t.camera.viewMatrix,projectionMatrix:t.camera.projectionMatrix},rasterParameters:t.rasterParameters});n.set(t.lightIndex,r)},drawShadowCasters:e=>{this.drawPreparedScene(n.get(e.lightIndex),e.renderPass)}})}destroyFrame(e){let t=this.frames.get(e);if(t){for(let e of t.surfaces.values())Dm(e);Tm(t.transmission),this.frames.delete(e)}this.shadowMaps.get(e)?.destroy(),this.shadowMaps.delete(e);for(let t=0;t<4;t++){let n=`${e}-shadow-${t}`;(this.frames.has(n)||this.shadowMaps.has(n))&&this.destroyFrame(n)}let n=gm(e);this.frames.has(n)&&this.destroyFrame(n)}destroy(){for(let e of this.scenegraphs.values())e.adapter.destroy();this.scenegraphs.clear(),this.pickNodes.clear();for(let e of Array.from(this.frames.keys()))this.destroyFrame(e);for(let e of this.shadowMaps.values())e.destroy();this.shadowMaps.clear()}prepareScene(e,t,n){let r=this.frames.get(e.id);r||(r={surfaces:new Map},this.frames.set(e.id,r));let i=new Set,a=[],o=0,s=0,c=1;e.rasterPass===`picking`&&h(e.surfaces.reduce((e,t)=>e+t.transforms.length,0)<=16777215),(e.rasterPass||e.spotShadows)&&h(this.device.type===`webgpu`);for(let l of e.surfaces){if(l.transforms.length===0)continue;let u=l.environment?{...e,environment:l.environment}:e;l.gpuTransforms&&(h(this.device.type===`webgpu`&&om(l.material)!==`BLEND`),h(l.gpuTransforms.indices.length===l.transforms.length),h(l.gpuTransforms.matrices.usage&N.STORAGE),h(Number.isSafeInteger(l.gpuTransforms.matrixCount)&&l.gpuTransforms.matrixCount>0),h(l.gpuTransforms.matrices.byteLength>=l.gpuTransforms.matrixCount*64));let d=mm(l)?t:void 0,f=this.getCompiledSurface(r,l,u,d);lm(f,l.transforms);let p=new Uint32Array(l.transforms.length*4),m=new Float32Array(p.buffer);for(let t=0;t<l.transforms.length;t++){let n=l.gpuTransforms?.indices[t]??4294967295,r=l.gpuTransforms?.connections?.[t];l.gpuTransforms&&(h(Number.isInteger(n)&&n>=0&&n<l.gpuTransforms.matrixCount),h(!r||r.second>=0&&r.second<l.gpuTransforms.matrixCount&&r.radius>0)),p[t*4]=n,p[t*4+1]=r?.second??4294967295,p[t*4+2]=c,m[t*4+3]=r?.radius??0;let i=l.nodes?.[t];i&&e.rasterPass===`picking`&&this.pickNodes.set(c,i),c++}f.metadataBuffer.write(p),l.gpuTransforms&&f.model.setBindings({sceneWorldMatrices:l.gpuTransforms.matrices}),e.camera.gpuOrigin&&f.model.setBindings({sceneProbeOrigin:e.camera.gpuOrigin}),hm(l)&&f.model.shaderInputs.setProps({skin:l.skin}),am(f,l),f.material.setProps({pbrMaterial:{...Qf(l.material.bindings||{}),...l.material.uniforms,alphaCutoffEnabled:f.alphaMode===`MASK`,IBLenabled:fm(u.environment)}}),um(f.model,u,d),n&&f.model.shaderInputs.setProps({shadow:n}),f.model.predraw(this.device.commandEncoder),f.depth=Em(l.transforms,e.camera.viewMatrix),i.add(l.id),a.push(f),o+=l.transforms.length,s+=f.triangleCount*l.transforms.length}for(let[e,t]of r.surfaces)i.has(e)||(Dm(t),r.surfaces.delete(e));return a.sort((e,t)=>{let n=e.alphaMode===`BLEND`;return n===(t.alphaMode===`BLEND`)?!n&&e.transmissive!==t.transmissive?e.transmissive?1:-1:n?t.depth-e.depth:0:n?1:-1}),{surfaces:a,statistics:{surfaceCount:a.length,instanceCount:o,drawCount:0,triangleCount:s}}}drawPreparedScene(e,t){let n=0;for(let r of e.surfaces)r.model.draw(t)&&n++;return n}getSurfaceModelOptions(e,t){return{}}getCompiledSurface(e,t,n,r){let i=om(t.material),a=sm(t,n,i,r),o=Object.entries(t.material.bindings||{}).filter(([,e])=>!!e),s=e.surfaces.get(t.id);if(s&&(s.source.geometry!==t.geometry||s.signature!==a||!cm(s.textureBindings,o))&&(Dm(s),e.surfaces.delete(t.id),s=void 0),!s){let c=Zf(this.device,{id:t.material.id,uniforms:t.material.uniforms,bindings:t.material.bindings,factory:this.materialFactory}),l=[],u=[],d={},f=[];for(let e=0;e<4;e++){let n=new Float32Array(t.transforms.length*4),r=this.device.createBuffer({id:`${t.id}-instance-column-${e}`,data:n,usage:N.VERTEX|N.COPY_DST}),i=`instanceModelMatrixCol${e}`;d[i]=r,f.push({name:i,format:`float32x4`,stepMode:`instance`}),l.push(r),u.push(n)}let p=this.device.createBuffer({id:`${t.id}-metadata`,data:new Uint32Array(t.transforms.length*4),usage:N.VERTEX|N.COPY_DST});d.instanceMetadata=p,f.push({name:`instanceMetadata`,format:`uint32x4`,stepMode:`instance`});let m=this.getSurfaceModelOptions(t,n),h=hm(t),g=Qp(this.device,{id:`${t.id}-model`,geometry:t.geometry,topology:t.geometry.topology,material:c,attributes:d,bufferLayout:f,instanceCount:t.transforms.length,modules:[...t.gpuTransforms?[em]:[],...n.camera.gpuOrigin?[$p]:[],...n.spotShadows&&!n.rasterPass?[Vo]:[]],bindings:t.gpuTransforms?{sceneWorldMatrices:t.gpuTransforms.matrices}:{},shaderInputs:new sf({pbrMaterial:Fo,pbrScene:Po,...h?{skin:to}:{},...t.gpuTransforms?{sceneInstances:em}:{},...n.camera.gpuOrigin?{sceneProbeCamera:$p}:{},...n.spotShadows&&!n.rasterPass?{shadow:Vo}:{}}),colorAttachmentFormats:n.framebuffer?.colorAttachments.map(e=>e.texture.format),depthStencilAttachmentFormat:Om(n.framebuffer),parameters:{...n.rasterParameters,cullMode:t.material.doubleSided?`none`:`back`,depthWriteEnabled:i!==`BLEND`,depthCompare:`less-equal`,...n.rasterPass===`depth`?{}:{blend:i===`BLEND`,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`},...m.parameters},...m,defines:{HAS_INSTANCING:!0,USE_SCENE_INSTANCES:!0,HAS_GPU_TRANSFORMS:!!t.gpuTransforms,USE_SCENE_PROBE_CAMERA:!!n.camera.gpuOrigin,USE_SCENE_SHADOWS:!!(n.spotShadows&&!n.rasterPass),SCENE_DEPTH_PASS:n.rasterPass===`depth`,SCENE_PICK_PASS:n.rasterPass===`picking`,USE_LIGHTS:!!n.lights?.length,USE_MATERIAL_EXTENSIONS:!0,ALPHA_CUTOFF:i===`MASK`,USE_IBL:fm(n.environment),USE_SCENE_ENVIRONMENT:fm(n.environment),USE_TEX_LOD:pm(n.environment),USE_TRANSMISSION_FRAMEBUFFER:!!r,USE_SCENE_COLOR_MANAGEMENT:!0,DEBUG_NORMALS:n.renderMode===`debugNormals`,DEBUG_DEPTH:n.renderMode===`debugDepth`,...t.material.defines,...m.defines,HAS_SKIN:h}});s={id:t.id,source:t,material:c,model:g,instanceBuffers:l,instanceColumns:u,metadataBuffer:p,signature:a,textureBindings:o,triangleCount:Math.floor((t.geometry.indices?.value.length||t.geometry.vertexCount)/3),alphaMode:i,transmissive:!!r,depth:0},e.surfaces.set(t.id,s)}return s.source=t,s}getTransmissionResources(e){let t=e.transmission!==!1&&!e.rasterPass&&(!e.renderMode||e.renderMode==="default")&&e.surfaces.some(mm),r=this.frames.get(e.id);if(!t){r?.transmission&&(Tm(r.transmission),r.transmission=void 0);return}r||(r={surfaces:new Map},this.frames.set(e.id,r));let[i,a]=wm(this.device,e);if(r.transmission&&(r.transmission.colorTexture.width!==i||r.transmission.colorTexture.height!==a)&&(Tm(r.transmission),r.transmission=void 0),!r.transmission){let t=this.device.createTexture({id:`scene-${e.id}-transmission-color`,width:i,height:a,format:_m(this.device),usage:n.SAMPLE|n.RENDER,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),o=this.device.createTexture({id:`scene-${e.id}-transmission-depth`,width:i,height:a,format:`depth24plus`,usage:n.RENDER}),s=this.device.createFramebuffer({id:`scene-${e.id}-transmission-framebuffer`,width:i,height:a,colorAttachments:[t],depthStencilAttachment:o});r.transmission={colorTexture:t,depthTexture:o,framebuffer:s}}return r.transmission}};function am(e,t){if(!t.morphTargets?.length)return;let n=t.morphWeights||[];e.morphWeights?.length===n.length&&e.morphWeights.every((e,t)=>e===n[t])||(yd(e.model,t.geometry,t.morphTargets,n),e.morphWeights=[...n])}function om(e){return e.alphaMode?e.alphaMode:(e.uniforms?.baseColorFactor?.[3]??1)<1?`BLEND`:`OPAQUE`}function sm(e,t,n,r){return JSON.stringify({gpuTransforms:!!e.gpuTransforms,gpuOrigin:!!t.camera.gpuOrigin,rasterPass:t.rasterPass,shadows:!!t.spotShadows,depthFormat:t.framebuffer?.depthStencilAttachment?.texture.format,rasterParameters:t.rasterParameters,geometryVersion:e.geometryVersion,material:e.material.id,instanceCount:e.transforms.length,alphaMode:n,doubleSided:!!e.material.doubleSided,skin:hm(e),defines:Object.entries(e.material.defines||{}).sort(([e],[t])=>e.localeCompare(t)),environment:fm(t.environment),lights:!!t.lights?.length,environmentMipmapped:pm(t.environment),transmission:!!r,transmissionWidth:r?.width,transmissionHeight:r?.height,colorFormat:t.framebuffer?.colorAttachments[0]?.texture.format,renderMode:t.renderMode||`default`})}function cm(e,t){return e.length===t.length&&e.every(([e,n])=>t.some(([t,r])=>e===t&&n===r))}function lm(e,t){for(let n=0;n<t.length;n++){let r=t[n];for(let t=0;t<4;t++)for(let i=0;i<4;i++)e.instanceColumns[t][n*4+i]=r[t*4+i]}for(let t=0;t<4;t++)e.instanceBuffers[t].write(e.instanceColumns[t])}function um(e,t,n){let r=new L(t.camera.viewMatrix),i=new L(t.camera.projectionMatrix),a=t.framebuffer?.width||t.width||n?.width||1,o=t.framebuffer?.height||t.height||n?.height||1;e.shaderInputs.setProps({pbrProjection:{modelViewProjectionMatrix:new L(i).multiplyRight(r),modelMatrix:rm,normalMatrix:rm,camera:t.camera.position},pbrScene:{exposure:t.exposure??1,toneMapMode:bm(e.device,t),environmentIntensity:t.environment?.intensity??1,environmentRotation:t.environment?.rotation??0,environmentMipCount:t.environment?.specularTexture?.mipLevels??1,outputEncoding:xm(e.device,t),framebufferSize:[a,o],viewMatrix:r,projectionMatrix:i,...n?{pbr_transmissionFramebufferSampler:n}:{}},lighting:{lights:dm(t.lights),useByteColors:!1},...fm(t.environment)?{ibl:{pbr_diffuseEnvSampler:t.environment.diffuseTexture,pbr_specularEnvSampler:t.environment.specularTexture,pbr_brdfLUT:t.environment.brdfLUTTexture}}:{}})}function dm(e=[]){let t=[...e],n=t.filter(e=>e.type===`ambient`);if(n.length<=1)return t;let r=[0,0,0];for(let e of n){let t=e.color??[1,1,1],n=e.intensity??1;r[0]+=t[0]*n,r[1]+=t[1]*n,r[2]+=t[2]*n}return[{type:`ambient`,color:r,intensity:1},...t.filter(e=>e.type!==`ambient`)]}function fm(e){return!!(e?.diffuseTexture&&e.specularTexture&&e.brdfLUTTexture)}function pm(e){return fm(e)&&(e?.specularTexture?.mipLevels??1)>1}function mm(e){return(e.material.uniforms?.transmissionFactor??0)>0}function hm(e){return!!(e.skin?.jointMatrices?.length&&ip(e.geometry).HAS_SKIN)}function gm(e){return`${e}::linear-transmission-capture`}function _m(e){let t=e.getTextureFormatCapabilities(`rgba16float`);return t.render&&t.filter?`rgba16float`:`rgba8unorm`}function vm(e,t){return t.framebuffer?.colorAttachments[0]?.texture.format||e.preferredColorFormat}function ym(e){return!!(T.getInfo(e).dataType?.startsWith(`float`)||e.endsWith(`ufloat`))}function bm(e,t){return t.toneMapMode??(ym(vm(e,t))?jo.NONE:jo.KHRONOS_PBR_NEUTRAL)}function xm(e,t){if(t.outputColorSpace)return+(t.outputColorSpace===`srgb`);let n=vm(e,t);return ym(n)||n.endsWith(`-srgb`)?0:1}function Sm(e,t,n){let r=Math.max(t.exposure??1,0),i=[Math.max(n[0],0)*r,Math.max(n[1],0)*r,Math.max(n[2],0)*r];switch(bm(e,t)){case jo.REINHARD:i=i.map(e=>e/(1+e));break;case jo.KHRONOS_PBR_NEUTRAL:i=Cm(i);break;case jo.ACES:i=i.map(e=>Math.min(Math.max(e*(2.51*e+.03)/(e*(2.43*e+.59)+.14),0),1));break}return xm(e,t)!==0&&(i=i.map(e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055)),[...i,n[3]??1]}function Cm(e){let t=Math.min(...e),n=t<.08?t-6.25*t*t:.04,r=e.map(e=>e-n),i=Math.max(...r),a=.76;if(i<a)return r;let o=1-a,s=1-o*o/(i+o-a),c=s/Math.max(i,1e-4),l=1-1/(.15*(i-s)+1);return r.map(e=>e*c*(1-l)+s*l)}function wm(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function Tm(e){e&&(e.framebuffer.destroy(),e.colorTexture.destroy(),e.depthTexture.destroy())}function Em(e,t){let n=new L(t),r=0;for(let t of e){let e=n.transformAsPoint([t[12],t[13],t[14]]);r-=e[2]}return r/e.length}function Dm(e){e.model.destroy(),e.metadataBuffer.destroy(),e.material.destroy();for(let t of e.instanceBuffers)t.destroy()}function Om(e){let t=e?.depthStencilAttachment?.texture.format;return t&&T.isDepthStencil(t)?t:void 0}var km=3.4,Am=696/(84*km),jm=12*1.25/(168*.103),Mm=new Rf,Nm=new Vf({verticalAxis:`z`,nradial:48,topCap:!0}),Pm=new zf({nlat:28,nlong:48});function G(e,t,n,r=0,i=0){return{id:e,uniforms:{baseColorFactor:[...t,1],metallicRoughnessValues:[r,n],clearcoatFactor:i,clearcoatRoughnessFactor:.15}}}function Fm(e,t,n,r,i){let a=new tm({id:t,geometry:n,material:r,matrix:i});return e.add(a),a}function Im(e,t,n,r,i,a=0){return Fm(e,t,Mm,n,new L().translate(r).rotateZ(a).scale(i))}function Lm(e,t){let n=G(`cloth`,[.022,.21,.135],.96),r=G(`cushion`,[.015,.125,.075],.84),i=G(`walnut`,[.23,.083,.032],.31,0,.65);i.bindings={pbr_baseColorSampler:t};let a=G(`brass`,[.64,.39,.13],.29,.77),o=G(`leather`,[.052,.026,.013],.88),s=G(`pocket`,[.004,.003,.002],1);Im(e,`apron`,i,[0,0,-.2],[6.69,3.69,.14]),Im(e,`slate`,n,[0,0,-.15],[6.02,3.02,.15]);for(let[t,n]of Pu.slice(1).entries()){let[i,a]=n.center,[o,s]=n.normal,c=Math.atan2(-o,s);Im(e,`cushion-${t}`,r,[i+Math.sin(c)*.12,a-Math.cos(c)*.12,.052],[n.halfExtents[1],.12,.11],c)}for(let t of[-1,1]){for(let n of[-1,1]){Im(e,`long-rail-${t}-${n}`,i,[n*3,t*3.45,-.015],[2.57,.24,.24]);for(let r of[1.5,3,4.5])Im(e,`long-sight-${t}-${n}-${r}`,a,[n*r,t*3.46,.228],[.043,.043,.004],Math.PI/4)}Im(e,`end-rail-${t}`,i,[t*6.45,0,-.015],[.24,2.6,.24]);for(let n of[-1.5,0,1.5])Im(e,`end-sight-${t}-${n}`,a,[t*6.46,n,.228],[.043,.043,.004],Math.PI/4)}for(let[t,[n,r]]of Nu.entries())Fm(e,`pocket-rim-${t}`,Nm,o,new L().translate([n,r,.08]).scale([.47,.47,.2])),Fm(e,`pocket-well-${t}`,Nm,s,new L().translate([n,r,.182]).scale([.38,.38,.025]));let c=G(`spot`,[.41,.49,.4],.95);for(let t of[-3,2])Fm(e,`spot-${t}`,Nm,c,new L().translate([t,0,.001]).scale([.031,.031,.003]))}var Rm={usage:n.SAMPLE|n.COPY_DST|n.RENDER,sampler:{magFilter:`linear`,minFilter:`linear`,mipmapFilter:`linear`,maxAnisotropy:8}};function zm(e){let t=new Uint8Array(16384*4),n=new Uint8Array(t.length);for(let e=0;e<128;e++)for(let r=0;r<128;r++){let i=(e*128+r)*4,a=Math.sin(e*.92+1.6*Math.sin(r*.07))*21+Math.sin(e*.29+Math.sin(r*.11))*17;t.set([216+a,210+a,196+a,255],i),n.set([128+11*Math.sin(r*Math.PI/4)*Math.cos(e*Math.PI/4),128+11*Math.cos(r*Math.PI/4)*Math.sin(e*Math.PI/4),249,255],i)}let r={wood:e.createTexture({width:128,height:128,format:`rgba8unorm-srgb`,data:t,...Rm,mipLevels:8}),weave:e.createTexture({width:128,height:128,format:`rgba8unorm`,data:n,...Rm,mipLevels:8})};return e.generateMipmapsWebGPU(r.wood),e.generateMipmapsWebGPU(r.weave),r}function Bm(e,t){let n=document.createElement(`canvas`);n.width=256,n.height=128;let r=n.getContext(`2d`),i=[`#191817`,`#f1b82a`,`#2a62cf`,`#c73028`,`#71429a`,`#ed7627`,`#247950`,`#841e35`];if(r.fillStyle=t===0||t>8?`#fcf3d8`:i[t%8],r.fillRect(0,0,256,128),t===0||t>8){r.fillStyle=t===0?`#8b2220`:i[t%8];let e=t===0?6:38;r.fillRect(0,(128-e)/2,256,e)}if(t)for(let e of[256/4,256*3/4])r.fillStyle=`#fff9e6`,r.beginPath(),r.arc(e,128/2,15,0,Math.PI*2),r.fill(),r.fillStyle=`#161619`,r.textAlign=`center`,r.textBaseline=`middle`,r.font=`bold 20px system-ui`,r.fillText(String(t),e,128/2);return e.createTexture({width:256,height:128,format:`rgba8unorm-srgb`,data:new Uint8Array(r.getImageData(0,0,256,128).data)})}function Vm(e,t){function n(t,n,r,i,a,o){Fm(e,t,new Bf({height:i-r,bottomRadius:a,topRadius:o,nradial:24,topCap:!0,bottomCap:!0}),n,new L().translate([0,(r+i)/2,0]))}let r=-3.4/2;n(`shaft`,t.shaft,-1.671,-.095,.055,.024),n(`forearm`,t.forearm,-2.39,r-.029,.078,.055),n(`grip`,t.wrap,-3.01,-2.39,.094,.078),n(`joint-collar`,t.ivory,r-.029,-1.671,.056,.054),n(`butt`,t.butt,-3.29,-3.01,.103,.094),n(`butt-cap`,t.ivory,-3.37,-3.29,.099,.103),n(`bumper`,t.tip,-3.4,-3.37,.098,.099),n(`ferrule`,t.inlay,-.095,-.024,.024,.023),n(`chalk`,t.tip,-.024,0,.023,.023);for(let[e,[i,a]]of[[-3.28,.103],[-3.02,.095],[-2.39,.079],[r-.035,.057]].entries())n(`ring-${e}`,t.inlay,i-.009,i+.009,a+.002,a+.002)}var Hm=512;function Um(e,t){let n=document.createElement(`canvas`);n.width=n.height=Hm;let r=n.getContext(`2d`),[i,a,o,s,c]=e===`malachite`?[`#162e22`,`#f3cd58`,`#79bd54`,`#2b1a12`,`#b7834e`]:e===`ember`?[`#452625`,`#bd543c`,`#e5ad64`,`#45241d`,`#d4af78`]:[`#1d4679`,`#e9f6fa`,`#57b7c0`,`#171515`,`#be9a6e`];r.fillStyle=t?s:c,r.fillRect(0,0,Hm,Hm);for(let e=0;e<4;e++){let n=(e+.5)*(Hm/4),c=t?[34,27,20,13]:[57,49,41,33];[i,a,o,s].forEach((e,i)=>{r.fillStyle=t?[s,`#d0ba92`,`#f0dfbf`,s][i]:e;let a=c[i];if(r.beginPath(),t){let e=134-22*i;r.moveTo(n,256-e),r.lineTo(n+a,256),r.lineTo(n,256+e),r.lineTo(n-a,256)}else r.moveTo(n,Hm-16-i*34),r.lineTo(n+a,0),r.lineTo(n-a,0);r.closePath(),r.fill()})}return new Uint8Array(r.getImageData(0,0,Hm,Hm).data)}function Wm(e,t){let n=new im(e),r=e.createCanvasContext({canvas:t,autoResize:!0,useDevicePixels:Math.max(2,devicePixelRatio)}),i=new Jf({id:`pool-table`}),a=new Jf({id:`playing-cue`}),o=new Jf({id:`preview-cue`});i.add(a);let s=zm(e);Lm(i,s.wood);let c=Array.from({length:16},(t,n)=>Bm(e,n)),l=c.map((e,t)=>{let n=G(`ball-${t}`,[1,1,1],.18,0,.9);return n.uniforms.baseColorMapEnabled=!0,n.bindings={pbr_baseColorSampler:e},Fm(i,`ball-${t}`,Pm,n,new L)}),u=[!1,!0].map(t=>e.createTexture({width:Hm,height:Hm,format:`rgba8unorm-srgb`,data:Um(`peacock`,t),...Rm,mipLevels:10})),d={shaft:G(`cue-shaft`,[.67,.4,.17],.25,0,.75),butt:G(`cue-butt`,[1,1,1],.21,0,1),forearm:G(`cue-forearm`,[1,1,1],.21,0,1),wrap:G(`cue-wrap`,[.049,.041,.033],.54,0,.22),inlay:G(`cue-inlay`,[.73,.47,.18],.31,.52,.6),ivory:G(`cue-ivory`,[.92,.86,.72],.26,0,.58),tip:G(`cue-tip`,[.032,.069,.068],.8)};d.forearm.bindings={pbr_baseColorSampler:u[0]},d.butt.bindings={pbr_baseColorSampler:u[1]},d.wrap.bindings={pbr_normalSampler:s.weave},Vm(a,d),Vm(o,d);let f=new Jf({id:`cue-display`,children:[o]}),p=[{type:`ambient`,color:[1,1,1],intensity:.48},{type:`directional`,direction:[.25,-.35,-1],color:[1,.87,.72],intensity:2.7},{type:`directional`,direction:[-.6,.4,-1],color:[.7,.83,1],intensity:.85}],m=[0,0,15],h=new L().lookAt({eye:m,center:[0,0,0],up:[0,1,0]}),g=new L().translate([0,0,.5]).scale([1,1,.5]),_=(e,t)=>g.clone().multiplyRight(new L().ortho({left:-e,right:e,bottom:-t,top:t,near:.1,far:30})),v=matchMedia(`(prefers-reduced-motion: reduce)`),y=new Xa,b=[],x=[],S=0,C=1e3/30,w=``,T=-1/0;return{draw(s,c,g,E,D,O,k){k?x!==c&&(C=Math.max(16,Math.min(60,O-S)),S=O,b=x,x=c):(b=x=c,S=O);let A=Math.min(1,(O-S)/C);for(let e of c){let t=l[e.index];if(t.display=e.enabled,!e.enabled)continue;let n=b[e.index],r=k&&n?.enabled,i=r?y.slerp(n.orientation,e.orientation,A):e.orientation,a=new L().fromQuaternion(i).scale(e.radius||.18);for(let t=0;t<3;t++){let i=e.position[t];a[12+t]=r?n.position[t]+(i-n.position[t])*A:i}t.setMatrix(a,!1)}if(a.setMatrix(new L().translate(g?[...g,U]:[100,0,0]).rotateZ(E-Math.PI/2).rotateX(-.055).scale([jm,Am,jm]),!1),D!==w&&(w=D,u.forEach((t,n)=>{t.writeData(Um(D,n===1)),e.generateMipmapsWebGPU(t)}),d.inlay.uniforms.baseColorFactor=D===`malachite`?[.82,.58,.17,1]:D===`ember`?[.89,.67,.44,1]:[.5,.82,.94,1]),n.render({scene:i,framebuffer:e.getCanvasContext().getCurrentFramebuffer({depthStencilFormat:`depth24plus`}),camera:{viewMatrix:h,projectionMatrix:_(s[0],s[1]),position:m},lights:p,background:[.017,.022,.019,1],transmission:!1}),e.submit(),O-T<32||!t.clientWidth||!t.clientHeight)return;T=O;let ee=t.clientWidth/t.clientHeight,te=Math.max(.98,.135/ee),ne=te*ee;o.setMatrix(new L().translate([0,km*.72,0]).rotateY(v.matches?.55:O/1900).scale([jm,1,jm]),!1),n.render({scene:f,framebuffer:r.getCurrentFramebuffer({depthStencilFormat:`depth24plus`}),camera:{viewMatrix:h,projectionMatrix:_(ne,te),position:m},lights:p,background:[.025,.032,.027,1],transmission:!1}),e.submit()},destroy(){n.destroy(),s.wood.destroy(),s.weave.destroy(),r.destroy();for(let e of[...c,...u])e.destroy()}}}var Gm=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!Jm(t.style,n.style)&&(qm(r,t.style),Km(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return Km(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function Km(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(Ym(n),String(r))}function qm(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(Ym(n))}function Jm(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length&&n.every(n=>e?.[n]===t?.[n])}function Ym(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var Xm=class extends Gm{static defaultProps={...Gm.defaultProps,panel:void 0,placement:`top-left`};stopObservingPanel;_onAdd(e){let t=super._onAdd(e);return this.observePanel(),t}setProps(e){super.setProps(e),this.rootElement&&this.observePanel()}onRemove(){this.stopObservingPanel?.(),this.stopObservingPanel=void 0,super.onRemove()}getObservedPanels(){return this.props.panel?[this.props.panel]:[]}observePanel(){this.stopObservingPanel?.();let e=[...new Set(this.getObservedPanels())].map(e=>e.subscribe(()=>this.updateHTML()));this.stopObservingPanel=()=>e.forEach(e=>e())}},Zm,K,Qm,$m,eh,th,nh,rh,ih,ah,oh,sh,ch,lh,uh,dh={},fh=[],ph=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,mh=Array.isArray;function hh(e,t){for(var n in t)e[n]=t[n];return e}function gh(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function _h(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?Zm.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return vh(e,o,r,i,null)}function vh(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Qm,__i:-1,__u:0};return i==null&&K.vnode!=null&&K.vnode(a),a}function yh(e){return e.children}function bh(e,t){this.props=e,this.context=t}function xh(e,t){if(t==null)return e.__?xh(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?xh(e):null}function Sh(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=hh({},t);a.__v=t.__v+1,K.vnode&&K.vnode(a),Nh(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??xh(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,Fh(r,a,i),t.__e=t.__=null,a.__e!=n&&Ch(a)}}function Ch(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),Ch(e)}function wh(e){(!e.__d&&(e.__d=!0)&&$m.push(e)&&!Th.__r++||eh!=K.debounceRendering)&&((eh=K.debounceRendering)||th)(Th)}function Th(){try{for(var e,t=1;$m.length;)$m.length>t&&$m.sort(nh),e=$m.shift(),t=$m.length,Sh(e)}finally{$m.length=Th.__r=0}}function Eh(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||fh,y=t.length;for(c=Dh(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||dh,p.__i=d,g=Nh(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&Rh(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=Oh(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function Dh(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=vh(null,o,null,null,null):mh(o)?o=e.__k[a]=vh(yh,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=vh(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=kh(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=xh(s)),zh(s,s));return r}function Oh(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=Oh(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=xh(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function kh(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>+!!u){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function Ah(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||ph.test(t)?n:n+`px`}function jh(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||Ah(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||Ah(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(oh,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[ah]=r[ah]:(n[ah]=sh,e.addEventListener(t,a?lh:ch,a)):e.removeEventListener(t,a?lh:ch,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function Mh(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[ih]==null)t[ih]=sh++;else if(t[ih]<n[ah])return;return n(K.event?K.event(t):t)}}}function Nh(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=K.__b)&&u(t);n:if(typeof T==`function`)try{if(_=t.props,v=T.prototype&&T.prototype.render,y=(u=T.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new T(_,b):(t.__c=d=new bh(_,b),d.constructor=T,d.render=Bh),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&T.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=hh({},d.__s)),hh(d.__s,T.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&T.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&T.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),fh.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=K.__r,S=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),fh.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++S<25);d.state=d.__s,d.getChildContext!=null&&(r=hh(hh({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),C=u!=null&&u.type===yh&&u.key==null?Ih(u.props.children):u,s=Eh(e,mh(C)?C:[C],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(w=a.length;w--;)gh(a[w]);Ph(t)}else t.__e=n.__e,t.__k=n.__k,e.then||Ph(t);K.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=Lh(n.__e,t,n,r,i,a,o,c,l);return(u=K.diffed)&&u(t),128&t.__u?void 0:s}function Ph(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(Ph))}function Fh(e,t,n){for(var r=0;r<n.length;r++)Rh(n[r],n[++r],n[++r]);K.__c&&K.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){K.__e(e,t.__v)}})}function Ih(e){return typeof e!=`object`||!e||e.__b>0?e:mh(e)?e.map(Ih):e.constructor===void 0?hh({},e):null}function Lh(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||dh,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(K.__m&&K.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&Zm.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||jh(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||jh(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),Eh(t.type==`template`?e.content:e,mh(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&xh(n,0),s,c),a!=null)for(l=a.length;l--;)gh(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&jh(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&jh(e,l,h,g[l],i))}return e}function Rh(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){K.__e(e,n)}}function zh(e,t,n){var r,i;if(K.unmount&&K.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||Rh(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){K.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&zh(r[i],t,n||typeof e.type!=`function`);n||gh(e.__e),e.__c=e.__=e.__e=void 0}function Bh(e,t,n){return this.constructor(e,n)}function Vh(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),K.__&&K.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],Nh(t,e=(!r&&n||t).__k=_h(yh,null,[e]),i||dh,dh,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?Zm.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),Fh(a,e,o)}function Hh(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,wh(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+uh++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}Zm=fh.slice,K={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},Qm=0,bh.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=hh({},this.state);typeof e==`function`&&(e=e(hh({},n),this.props)),e&&hh(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),wh(this))},bh.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),wh(this))},bh.prototype.render=yh,$m=[],th=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,nh=function(e,t){return e.__v.__b-t.__v.__b},Th.__r=0,rh=Math.random().toString(8),ih=`__d`+rh,ah=`__a`+rh,oh=/(PointerCapture)$|Capture$/i,sh=0,ch=Mh(!1),lh=Mh(!0),uh=0;var Uh=0;Array.isArray;function q(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Uh,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return K.vnode&&K.vnode(l),l}var Wh,J,Gh,Kh,qh=0,Jh=[],Y=K,Yh=Y.__b,Xh=Y.__r,Zh=Y.diffed,Qh=Y.__c,$h=Y.unmount,eg=Y.__;function tg(e,t){Y.__h&&Y.__h(J,e,qh||t),qh=0;var n=J.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function ng(e){return qh=1,rg(gg,e)}function rg(e,t,n){var r=tg(Wh++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):gg(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=J,!J.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};J.__f=!0;var a=J.shouldComponentUpdate,o=J.componentWillUpdate;J.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},J.shouldComponentUpdate=i}return r.__N||r.__}function ig(e,t){var n=tg(Wh++,3);!Y.__s&&hg(n.__H,t)&&(n.__=e,n.u=t,J.__H.__h.push(n))}function ag(e,t){var n=tg(Wh++,4);!Y.__s&&hg(n.__H,t)&&(n.__=e,n.u=t,J.__h.push(n))}function og(e){return qh=5,sg(function(){return{current:e}},[])}function sg(e,t){var n=tg(Wh++,7);return hg(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function cg(e,t){return qh=8,sg(function(){return e},t)}function lg(e){var t=J.context[e.__c],n=tg(Wh++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(J)),t.props.value):e.__}function ug(){for(var e;e=Jh.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(pg),t.__h.some(mg),t.__h=[]}catch(n){t.__h=[],Y.__e(n,e.__v)}}}Y.__b=function(e){J=null,Yh&&Yh(e)},Y.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),eg&&eg(e,t)},Y.__r=function(e){Xh&&Xh(e),Wh=0;var t=(J=e.__c).__H;t&&(Gh===J?(t.__h=[],J.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(pg),t.__h.some(mg),t.__h=[],Wh=0)),Gh=J},Y.diffed=function(e){Zh&&Zh(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(Jh.push(t)!==1&&Kh===Y.requestAnimationFrame||((Kh=Y.requestAnimationFrame)||fg)(ug)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),Gh=J=null},Y.__c=function(e,t){t.some(function(e){try{e.__h.some(pg),e.__h=e.__h.filter(function(e){return!e.__||mg(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],Y.__e(n,e.__v)}}),Qh&&Qh(e,t)},Y.unmount=function(e){$h&&$h(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{pg(e)}catch(e){t=e}}),n.__H=void 0,t&&Y.__e(t,n.__v))};var dg=typeof requestAnimationFrame==`function`;function fg(e){var t,n=function(){clearTimeout(r),dg&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);dg&&(t=requestAnimationFrame(n))}function pg(e){var t=J,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),J=t}function mg(e){var t=J;e.__c=e.__(),J=t}function hg(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function gg(e,t){return typeof t==`function`?t(e):t}var _g={"--panel-preset":`light`,"--panel-font-size":`initial`,"--panel-padding":`initial`,"--panel-control-height":`initial`,"--panel-control-padding":`initial`,"--panel-surface-radius":`initial`,"--panel-input-corner-radius":`initial`,"--panel-content-background":`initial`,"--panel-gap":`initial`,"--panel-corner-radius":`initial`,"--panel-round-radius":`initial`,"--panel-switch-padding":`initial`,"--menu-border-color":`initial`,"--panel-focus-color":`initial`,"--panel-accent-color":`initial`,"--panel-hover-background":`initial`,"--panel-disabled-opacity":`initial`,"--menu-corner-radius":`initial`,"--menu-weak-background":`initial`,"--menu-divider":`initial`,"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},vg={"--panel-preset":`dark`,"--panel-font-size":`initial`,"--panel-padding":`initial`,"--panel-control-height":`initial`,"--panel-control-padding":`initial`,"--panel-surface-radius":`initial`,"--panel-input-corner-radius":`initial`,"--panel-content-background":`initial`,"--panel-gap":`initial`,"--panel-corner-radius":`initial`,"--panel-round-radius":`initial`,"--panel-switch-padding":`initial`,"--menu-border-color":`initial`,"--panel-focus-color":`initial`,"--panel-accent-color":`initial`,"--panel-hover-background":`initial`,"--panel-disabled-opacity":`initial`,"--menu-corner-radius":`initial`,"--menu-weak-background":`initial`,"--menu-divider":`initial`,"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},yg={"--widget-margin":`8px`,"--button-size":`20px`,"--button-corner-radius":`4px`,"--panel-font-size":`10px`,"--panel-padding":`4px 6px`,"--panel-control-height":`20px`,"--panel-control-padding":`1px 5px`,"--panel-gap":`3px`,"--panel-corner-radius":`4px`,"--panel-round-radius":`999px`,"--panel-switch-padding":`2px`,"--panel-surface-radius":`8px`,"--panel-input-corner-radius":`3px`,"--panel-content-background":`transparent`,"--menu-corner-radius":`8px`,"--menu-backdrop-filter":`none`,"--button-backdrop-filter":`none`,"--menu-gap":`4px`,"--range-step-button-size":`20px`,"--range-track-size":`12px`,"--range-thumb-size":`8px`},bg={light:_g,dark:vg,"sleek-light":{..._g,...yg,"--panel-preset":`sleek-light`,"--button-background":`rgba(241, 245, 251, 0.78)`,"--button-stroke":`rgba(82, 111, 157, 0.28)`,"--button-inner-stroke":`1px solid rgba(82, 111, 157, 0.28)`,"--button-shadow":`inset 0 1px 0 rgba(255, 255, 255, 0.7)`,"--button-text":`#24344c`,"--button-icon-idle":`#526985`,"--button-icon-hover":`#16385e`,"--menu-background":`rgba(248, 251, 255, 0.72)`,"--menu-text":`#24344c`,"--menu-border":`1px solid rgba(82, 111, 157, 0.28)`,"--menu-border-color":`rgba(82, 111, 157, 0.28)`,"--menu-divider":`1px solid rgba(82, 111, 157, 0.16)`,"--menu-weak-background":`rgba(210, 225, 245, 0.18)`,"--menu-item-hover":`rgba(70, 125, 196, 0.12)`,"--menu-shadow":`0 12px 30px rgba(15, 32, 60, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.65)`,"--panel-focus-color":`#2563eb`,"--panel-accent-color":`#167565`,"--panel-hover-background":`rgba(201, 221, 247, 0.76)`,"--panel-disabled-opacity":`0.5`,"--range-track-color":`rgba(111, 137, 173, 0.38)`,"--range-thumb-color":`#527caa`,"--range-decoration-active-color":`#267cba`},"sleek-dark":{...vg,...yg,"--panel-preset":`sleek-dark`,"--button-background":`rgba(15, 23, 42, 0.72)`,"--button-stroke":`rgba(140, 169, 211, 0.28)`,"--button-inner-stroke":`initial`,"--button-shadow":`inset 0 1px 0 rgba(255, 255, 255, 0.04)`,"--button-text":`#e2e8f0`,"--button-icon-idle":`#94a3b8`,"--button-icon-hover":`#eff4fd`,"--menu-background":`rgba(8, 12, 20, 0.91)`,"--menu-text":`#e2e8f0`,"--menu-border":`1px solid rgba(126, 155, 205, 0.26)`,"--menu-border-color":`rgba(126, 155, 205, 0.26)`,"--menu-divider":`1px solid rgba(126, 155, 205, 0.18)`,"--menu-weak-background":`rgba(15, 23, 42, 0.48)`,"--menu-item-hover":`rgba(125, 211, 252, 0.12)`,"--menu-shadow":`0 12px 30px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04)`,"--panel-focus-color":`#8bb4ff`,"--panel-accent-color":`#86cbbd`,"--panel-hover-background":`rgba(70, 104, 159, 0.38)`,"--panel-disabled-opacity":`0.5`,"--range-track-color":`rgba(71, 85, 105, 0.8)`,"--range-thumb-color":`#7dd3fc`,"--range-decoration-active-color":`#86cbbd`}};function xg(e){return{...bg[e.base],...e.variables,"--panel-preset":e.base}}var Sg=`data-deck-gl-community-panels-styles`,Cg=`/* Stop at nested scopes so explicit original presets retain their native states. */
@scope ([data-panel-theme-preset^="sleek-"]) to ([data-panel-theme-preset]) {
  :is(button, input, select, textarea):focus-visible {
    outline: var(--panel-focus-color) solid 2px !important;
    outline-offset: -2px;
  }
  input[type='checkbox'] {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
    box-sizing: border-box;
    width: 26px !important;
    height: 14px;
    border: 1px solid var(--panel-accent-color);
    border-radius: 7px;
    background: var(--button-background);
    cursor: pointer;
    transition: background-color 120ms ease, border-color 120ms ease;
  }
  input[type='checkbox']::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 1px;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 1px solid var(--button-icon-idle);
    background: transparent;
    transition: transform 120ms ease, background-color 120ms ease;
  }
  input[type='checkbox']:checked {
    background: var(--button-background);
    border-color: var(--panel-accent-color);
  }
  input[type='checkbox']:checked::before {
    transform: translate(12px, -50%);
    border-color: var(--panel-accent-color);
    background: var(--panel-accent-color);
  }
  @media (prefers-reduced-motion: reduce) {
    input[type='checkbox'], input[type='checkbox']::before { transition: none; }
  }
  @media (forced-colors: active) {
    input[type='checkbox'] { appearance: auto; -webkit-appearance: auto; }
    input[type='checkbox']::before { display: none; }
  }
  input[type='range'] {
    appearance: none;
    -webkit-appearance: none;
    height: 16px;
    background: transparent;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-runnable-track {
    height: 2px;
    background: var(--range-track-color);
    border-radius: 1px;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -6px;
    border: 0;
    border-radius: 50%;
    background: var(--panel-accent-color);
  }
  input[type='range']::-moz-range-track {
    height: 2px;
    background: var(--range-track-color);
    border-radius: 1px;
  }
  input[type='range']::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: var(--panel-accent-color);
  }
  button:not(:disabled):not([aria-pressed='true']):not([aria-selected='true']):not([data-panel-active='true']):hover {
    background-color: var(--panel-hover-background) !important;
  }
  :is(button, input, select, textarea):disabled {
    opacity: var(--panel-disabled-opacity);
  }
}
`,wg=`.deck-panel-layout {
  position: relative;
  display: grid;
  grid-template-areas: "top top top" "left center right" "bottom bottom bottom";
  grid-template-columns: minmax(0, max-content) minmax(0, 1fr) minmax(0, max-content);
  grid-template-rows: minmax(0, max-content) minmax(0, 1fr) minmax(0, max-content);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.deck-panel-layout-center { grid-area: center; position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.deck-panel-layout-edge { display: flex; min-width: 0; min-height: 0; overflow: auto; }
.deck-panel-layout-edge[data-side="top"] { grid-area: top; }
.deck-panel-layout-edge[data-side="bottom"] { grid-area: bottom; }
.deck-panel-layout-edge[data-side="left"] { grid-area: left; flex-direction: column; }
.deck-panel-layout-edge[data-side="right"] { grid-area: right; flex-direction: column; }
.deck-panel-chrome {
  position: relative; pointer-events: auto; min-width: 0; min-height: 0;
  box-sizing: border-box; flex: 0 1 auto;
  color: var(--menu-text, #18181a); background: var(--menu-background, #fff);
  font: 13px system-ui, sans-serif;
}
.deck-panel-chrome[hidden] { display: none; }
.deck-panel-chrome[data-docked="true"][data-side="left"],
.deck-panel-chrome[data-docked="true"][data-side="right"] { flex: 1 1 auto; }
.deck-panel-chrome-shell { position: relative; display: flex; flex-direction: column; height: 100%; max-height: inherit; min-height: 0; }
.deck-panel-chrome-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px; flex: 0 0 auto; }
.deck-panel-chrome-header button { color: inherit; font: inherit; cursor: pointer; }
.deck-panel-chrome-header button:disabled { cursor: default; }
.deck-panel-chrome-content { overflow: auto; min-width: 0; min-height: 0; flex: 1 1 auto; padding: 8px; }
.deck-panel-chrome[data-pinnable="true"] {
  font-size: 14px;
  line-height: 1.5;
  border-radius: 12px;
  background: var(--menu-background, rgba(255, 255, 255, 0.96));
  backdrop-filter: var(--menu-backdrop-filter, unset);
  box-shadow: var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16));
}
.deck-panel-chrome[data-pinnable="true"][data-docked="true"] {
  border-radius: 0;
  box-shadow: none;
}
.deck-panel-chrome[data-pinnable="true"] > .deck-panel-chrome-shell {
  box-sizing: border-box;
  border: var(--menu-border, 1px solid rgba(148, 163, 184, 0.35));
  border-radius: inherit;
  overflow: hidden;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header {
  padding: 14px 16px 10px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--button-text, currentColor);
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--button-icon-idle, #616166);
  font: 500 12px/1.2 system-ui, sans-serif;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:hover:enabled {
  background: var(--menu-item-hover, rgba(0, 0, 0, 0.08));
  color: var(--button-icon-hover, #18181a);
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:disabled { opacity: 0.45; }
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-content {
  padding: 0 16px 16px;
  overscroll-behavior: contain;
}
.deck-panel-chrome-content[hidden] { display: none; }
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header .deck-panel-chrome-toggle {
  flex: 1 1 auto;
  justify-content: space-between;
  gap: 8px;
  padding: 0;
  color: inherit;
  font: inherit;
  text-align: left;
}
.deck-panel-chrome-header .deck-panel-chrome-hide {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--button-icon-idle, #616166);
}
.deck-panel-chrome-header .deck-panel-chrome-hide:hover,
.deck-panel-chrome-restore:hover {
  background: var(--menu-item-hover, rgba(0, 0, 0, 0.08));
  color: var(--button-icon-hover, #18181a);
}
.deck-panel-chrome-hide:focus-visible,
.deck-panel-chrome-restore:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.deck-panel-chrome-restore {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  pointer-events: auto;
  width: 32px;
  height: 32px;
  border: var(--menu-border, 1px solid #cbd0d6);
  border-radius: 6px;
  background: var(--menu-background, #fff);
  color: var(--menu-text, #18181a);
  box-shadow: var(--menu-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
}
.deck-panel-chrome-divider { position: absolute; touch-action: none; z-index: 1; background: transparent; }
.deck-panel-chrome-divider:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.deck-panel-chrome[data-side="left"] .deck-panel-chrome-divider { right: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.deck-panel-chrome[data-side="right"] .deck-panel-chrome-divider { left: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.deck-panel-chrome[data-side="top"] .deck-panel-chrome-divider { bottom: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; }
.deck-panel-chrome[data-side="bottom"] .deck-panel-chrome-divider { top: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; }
`,Tg=`.deck-widget {
  margin: var(--widget-margin, 12px);
  box-sizing: border-box;
  font-size: var(--panel-font-size);
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

.deck-widget-button-label {
  white-space: nowrap;
}

.deck-widget-button-with-text {
  width: auto;
}

.deck-widget-button-with-text button {
  display: flex;
  width: auto;
  min-width: var(--button-size, 28px);
  height: calc(var(--button-size, 28px) - 2px);
  align-items: center;
  gap: 6px;
  padding: 0 8px;
}

.deck-widget-button-with-text button > span:first-child {
  width: auto;
  height: auto;
  flex: 0 0 auto;
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
  font-size: var(--panel-font-size, 13px);
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
  font-size: var(--panel-font-size, 13px);
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
  padding: var(--panel-padding, 6px 10px);
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  color: rgb(220, 80, 80);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--panel-font-size, 12px);
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
  font-size: var(--panel-font-size, 13px);
}

.deck-widget .deck-widget-dropdown-item {
  padding: var(--panel-padding, 8px 12px);
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
  padding: var(--panel-padding, 4px 8px 8px);
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
  padding: var(--panel-padding, 10px);
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
`;function Eg(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function Dg(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(Eg))return!0}return!1}function Og(e){if(!e.querySelector(`style[data-panel-theme-styles]`)){let t=e.createElement(`style`);t.setAttribute(`data-panel-theme-styles`,`true`),t.textContent=Cg,e.head.appendChild(t)}if(e.querySelector(`style[${Sg}]`)||Dg(e))return;let t=e.createElement(`style`);t.setAttribute(Sg,`true`),t.textContent=Tg,e.head.appendChild(t)}function kg(e){if(e.querySelector(`style[data-panel-chrome-styles]`))return;let t=e.createElement(`style`);t.setAttribute(`data-panel-chrome-styles`,`true`),t.textContent=wg,e.head.append(t)}var Ag=Hh(void 0);function jg({panel:e,children:t}){let[,n]=rg(e=>e+1,0);ag(()=>e.subscribe(()=>n(void 0),!1),[e]);let r=lg(Ag),i=og(null),[a,o]=ng(!1),[s,c]=ng(`light`),l=Ng(r??s,e.theme);return ag(()=>{if(i.current&&Og(i.current.ownerDocument),!r){let e=i.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=t.ownerDocument.defaultView?.getComputedStyle(t).getPropertyValue(`--panel-preset`).trim();o(!!(e&&Object.hasOwn(bg,e)));let n=Ig(t);c(e=>e===n?e:n)};n();let r=new MutationObserver(()=>{n()});for(let e of Pg(t))r.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{r.disconnect()}}},[r]),q(Ag.Provider,{value:l,children:q(`div`,{ref:i,"data-panel-theme-mode":Mg(l),"data-panel-theme-preset":l,style:(!e.theme||e.theme===`inherit`)&&(r||a)?void 0:Fg(l,e.theme),children:t})})}function Mg(e){return e===`dark`||e===`sleek-dark`?`dark`:`light`}function Ng(e,t){if(typeof t==`object`)return t.base;if(t&&t!==`inherit`&&t!==`invert`)return t;if(t===`invert`){let t=Mg(e)===`dark`?`light`:`dark`;return e.startsWith(`sleek-`)?`sleek-${t}`:t}return e}function Pg(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function Fg(e,t){return{...typeof t==`object`?xg(t):bg[e]}}function Ig(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=t.getComputedStyle(e),r=n.getPropertyValue(`--panel-preset`).trim();if(Object.hasOwn(bg,r))return r;let i=Lg(n.getPropertyValue(`--menu-background`).trim());return i&&Rg(i)<.5?`dark`:`light`}function Lg(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function Rg([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}var zg=Hh(void 0),Bg=class extends Xm{static defaultProps={...Xm.defaultProps,title:void 0,widthPx:320,heightPx:240,fitContent:!1,resizable:!1};className=`deck-panel-chrome`;placement=`top-left`;get overlayPlacement(){return this.placement}resizedWidth;resizedHeight;stopDrag;eventRoot;get isPinned(){return!0}get isDocked(){return this.isPinned}get isPinnable(){return!1}get canPin(){return!!this.panelManager?.contentElement}setProps(e){e.fitContent===!0&&(this.resizedWidth=void 0,this.resizedHeight=void 0),e.widthPx!==void 0&&e.widthPx!==this.props.widthPx&&(this.resizedWidth=void 0),e.heightPx!==void 0&&e.heightPx!==this.props.heightPx&&(this.resizedHeight=void 0),super.setProps(e)}reconcileProps(e){let t={...e};t.fitContent===this.props.fitContent&&delete t.fitContent,this.setProps(t)}onRenderHTML(e){this.prepareRoot(e);let{panel:t,title:n}=this.props,r={pinned:this.isPinned,side:this.side,canPin:this.canPin};Vh(q(zg.Provider,{value:r,children:q(`section`,{className:`deck-panel-chrome-shell`,"aria-label":n??`Panel`,children:[n||this.isPinnable||this.hasHeaderActions?q(`header`,{className:`deck-panel-chrome-header`,children:[this.renderHeaderTitle(),this.renderHeaderActions(),this.renderPinControl()]}):null,this.renderHeaderPanel(),q(`div`,{className:`deck-panel-chrome-content`,hidden:!this.isContentOpen,children:t?q(jg,{panel:t,children:t.content}):null}),this.renderResizeHandle()]})}),e)}prepareRoot(e){if(this.eventRoot!==e){this.removeEventListeners(),this.eventRoot=e;for(let t of Hg)e.addEventListener(t,Ug)}kg(e.ownerDocument),e.style.margin=this.isDocked?`0`:`${this.floatingOffsetPx}px`,this.panelManager?.updateDockedContainer?.(this),e.hidden=this.isPinned&&!this.canPin;let{fitContent:t}=this.props,n=this.side===`left`||this.side===`right`,r=this.resizedWidth??Vg(this.props.widthPx,320),i=this.resizedHeight??Vg(this.props.heightPx,240);e.dataset.side=this.side,e.dataset.pinned=String(this.isPinned),e.dataset.docked=String(this.isDocked),e.dataset.pinnable=String(this.isPinnable),e.style.width=this.isDocked&&!n?`100%`:t&&this.resizedWidth===void 0?`max-content`:`${r}px`,e.style.height=this.isDocked&&!n?t&&this.resizedHeight===void 0?`max-content`:`${i}px`:``}renderPinControl(){return this.isPinnable?q(`button`,{type:`button`,disabled:!this.canPin,"aria-label":this.isPinned?`Unpin panel`:`Pin panel`,title:this.isPinned?`Unpin panel`:`Pin panel`,"aria-pressed":this.isPinned,onClick:()=>this.changePinned(!this.isPinned),children:q(`svg`,{width:`18`,height:`18`,viewBox:`0 0 24 24`,fill:this.isPinned?`currentColor`:`none`,stroke:`currentColor`,strokeWidth:`1.75`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,focusable:`false`,style:{transform:this.isPinned?`none`:`rotate(45deg)`},children:[q(`path`,{d:`M9 3h6l-1 7 4 4v2H6v-2l4-4-1-7Z`}),q(`path`,{d:`M12 16v5`})]})}):null}renderResizeHandle(){let e=this.rootElement,t=this.props.title,n=this.side===`left`||this.side===`right`;return this.isDocked&&this.canPin&&this.props.resizable?q(`div`,{className:`deck-panel-chrome-divider`,role:`separator`,tabIndex:0,"aria-label":`Resize ${t??`panel`}`,"aria-orientation":n?`vertical`:`horizontal`,"aria-valuemin":0,"aria-valuemax":Math.floor(this.getSizeLimit()),"aria-valuenow":Math.round(n?e.getBoundingClientRect().width:e.getBoundingClientRect().height),onPointerDown:e=>this.startResize(e),onKeyDown:t=>{let r=(n?{ArrowLeft:-1,ArrowRight:1}:{ArrowUp:-1,ArrowDown:1})[t.key];if(r){t.preventDefault();let i=e.getBoundingClientRect();this.resizePanel((n?i.width:i.height)+r*10*this.getResizeSign())}}}):null}onRemove(){super.onRemove(),this.stopDrag?.(),this.removeEventListeners(),this.rootElement&&Vh(null,this.rootElement)}get floatingOffsetPx(){return 0}get hasHeaderActions(){return!1}renderHeaderActions(){return null}get isContentOpen(){return!0}renderHeaderPanel(){return null}renderHeaderTitle(){return q(`span`,{children:this.props.title})}changePinned(e){}removeEventListeners(){if(this.eventRoot)for(let e of Hg)this.eventRoot.removeEventListener(e,Ug);this.eventRoot=void 0}getResizeSign(){return this.side===`right`||this.side===`bottom`?-1:1}getSizeLimit(){let e=this.panelManager?.parentElement;return e?(this.side===`left`||this.side===`right`?e.clientWidth:e.clientHeight)*.45:0}resizePanel(e){let t=Math.max(0,Math.min(e,this.getSizeLimit()));this.side===`left`||this.side===`right`?this.resizedWidth=t:this.resizedHeight=t,this.updateHTML()}startResize(e){if(e.button!==0||!this.rootElement)return;e.preventDefault(),this.stopDrag?.();let t=e.currentTarget,n=this.side===`left`||this.side===`right`,r=this.rootElement.getBoundingClientRect(),i=n?r.width:r.height,a=n?e.clientX:e.clientY,o=this.side;t.setPointerCapture(e.pointerId);let s=e=>{if(this.side!==o||!this.isDocked){this.stopDrag?.();return}this.resizePanel(i+((n?e.clientX:e.clientY)-a)*this.getResizeSign())},c=()=>{t.removeEventListener(`pointermove`,s),t.removeEventListener(`pointerup`,c),t.removeEventListener(`pointercancel`,c),t.removeEventListener(`lostpointercapture`,c),t.hasPointerCapture(e.pointerId)&&t.releasePointerCapture(e.pointerId),this.stopDrag=void 0};this.stopDrag=c,t.addEventListener(`pointermove`,s),t.addEventListener(`pointerup`,c),t.addEventListener(`pointercancel`,c),t.addEventListener(`lostpointercapture`,c)}};function Vg(e,t){return Number.isFinite(e)?Math.max(0,e):t}var Hg=[`pointerdown`,`pointermove`,`pointerup`,`pointercancel`,`mousedown`,`mousemove`,`mouseup`,`touchstart`,`touchmove`,`touchend`,`touchcancel`,`click`,`dblclick`,`contextmenu`,`wheel`];function Ug(e){e.stopPropagation()}var Wg=class{parent;content;root;center;edges;marker;originalStyles;observer;constructor(e,t,n){this.parent=e,this.content=t;let r=e.ownerDocument;this.marker=r.createComment(`panel-content`),t.before(this.marker),this.root=r.createElement(`div`),this.root.className=`deck-panel-layout`,this.center=r.createElement(`div`),this.center.className=`deck-panel-layout-center`,this.edges={};for(let e of[`top`,`left`,`right`,`bottom`]){let t=r.createElement(`div`);t.className=`deck-panel-layout-edge`,t.dataset.side=e,this.edges[e]=t,this.root.append(t)}this.root.append(this.center),this.marker.after(this.root),this.center.append(t),this.originalStyles=new Map;for(let[e,n]of Object.entries({position:`absolute`,top:`0px`,right:`0px`,bottom:`0px`,left:`0px`,width:`100%`,height:`100%`,"min-width":`0px`,"min-height":`0px`,"margin-top":`0px`,"margin-right":`0px`,"margin-bottom":`0px`,"margin-left":`0px`,"box-sizing":`border-box`}))this.originalStyles.set(e,{value:t.style.getPropertyValue(e),priority:t.style.getPropertyPriority(e)}),t.style.setProperty(e,n);this.observer=new ResizeObserver(n),this.observer.observe(this.root),this.observer.observe(this.center)}updateLimits(){let{width:e,height:t}=this.root.getBoundingClientRect();for(let n of[`top`,`left`,`right`,`bottom`]){let r=n===`left`||n===`right`;for(let i of this.edges[n].children){let n=i.style;n.maxWidth=r?`${e*.45}px`:``,n.maxHeight=r?``:`${t*.45}px`}}}finalize(){this.observer.disconnect(),this.marker.parentNode?this.marker.before(this.content):this.parent.append(this.content);for(let[e,{value:t,priority:n}]of this.originalStyles)t?this.content.style.setProperty(e,t,n):this.content.style.removeProperty(e);this.root.remove(),this.marker.remove()}},Gg={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Kg=`top-left`,qg=`root`,Jg=class{deck;parentElement;contentElement;layout;resizeObserver;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,contentElement:t,components:n,deck:r=null,className:i}){if(t&&t.parentElement!==e)throw Error(`PanelManager contentElement must be a direct child of parentElement`);this.contentElement=t,this.deck=r,this.parentElement=e,this.className=i,Og(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),i&&this.parentElement.classList.add(i),typeof ResizeObserver<`u`&&(this.resizeObserver=new ResizeObserver(()=>this._updateContainers()),this.resizeObserver.observe(e)),this.setProps({components:n})}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!Yg(e.components,this.components)){let t=e.components.filter(Xg);this._setComponents(t)}}finalize(){this.resizeObserver?.disconnect(),this.resizeObserver=void 0;for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.layout?.finalize(),this.layout=void 0,this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}updateDockedContainer(e){let t=e.rootElement;if(!t)return;if(kg(this.parentElement.ownerDocument),this.contentElement&&!this.layout){this.layout=new Wg(this.parentElement,this.contentElement,()=>this._updateContainers());for(let e of Object.values(this.containers))this.layout.center.append(e)}t.hidden=e.isPinned&&!this.contentElement;let n=e.isDocked&&this.layout?this.layout.edges[e.side]:this._getContainer(e._container??e.viewId??null,e.overlayPlacement);if(t.parentElement!==n){let r=t.ownerDocument.activeElement,i=this.resolvedComponents.indexOf(e),a=e.isDocked&&i>=0?this.resolvedComponents.slice(i+1).find(t=>t instanceof Bg&&t.isDocked&&t.side===e.side&&t.rootElement?.parentElement===n):void 0;n.insertBefore(t,a?.rootElement??null),r instanceof HTMLElement&&t.contains(r)&&r.focus({preventScroll:!0})}t.style.maxWidth=``,t.style.maxHeight=``,this._updateContainers()}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e instanceof Bg?e.reconcileProps(n.props):e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e;for(let e of this.resolvedComponents)e instanceof Bg&&e.isDocked&&this.layout&&e.rootElement&&this.layout.edges[e.side].append(e.rootElement);this._updateContainers()}_addComponent(e){let{viewId:t=null,placement:n=Kg}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:qg,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,(this.layout?.center??this.parentElement).append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Gg[t]),r.append(i)),i}_updateContainers(){let e=this.deck;this.layout?.updateLimits();let t=this.layout?.center.clientWidth??e?.width??this.parentElement.clientWidth,n=this.layout?.center.clientHeight??e?.height??this.parentElement.clientHeight;for(let e of this.resolvedComponents)if(e instanceof Bg&&!e.isDocked&&e.rootElement){let r=e.rootElement.style,i=(parseFloat(r.marginLeft)||0)+(parseFloat(r.marginRight)||0),a=(parseFloat(r.marginTop)||0)+(parseFloat(r.marginBottom)||0);r.maxWidth=`${Math.max(0,t-i)}px`,r.maxHeight=`${Math.max(0,n-a)}px`}for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===qg||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function Yg(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Xg(e){return e instanceof Gm}var Zg;function Qg(e){let t=Math.max(220,Math.floor(e));return Number.isFinite(t)?t:360}function $g({panel:e,headerPanel:t,title:n,widthPx:r,maxHeightPx:i,open:a,collapsible:o,onOpenChange:s}){return q(`section`,{style:a_(r,i),"aria-label":n??`Panel box`,onPointerDown:r_,onPointerMove:r_,onPointerUp:r_,onMouseDown:r_,onMouseMove:r_,onMouseUp:r_,onTouchStart:r_,onTouchMove:r_,onTouchEnd:r_,onClick:r_,onContextMenu:r_,onWheel:r_,children:[n?q(`header`,{style:o_,children:o?q(`button`,{type:`button`,"aria-expanded":a,style:s_,onClick:()=>s(!a),children:[q(`span`,{children:n}),q(`span`,{"aria-hidden":`true`,style:c_(a),children:a?`▾`:`▸`})]}):q(`span`,{children:n})}):null,t_(t),q(`div`,{style:l_(a),children:e?q(jg,{panel:e,children:e.content}):null})]})}var e_=class extends Bg{static defaultProps={...Bg.defaultProps,pinnable:!1,side:`right`,pinned:void 0,defaultPinned:!1,onPinnedChange:void 0,offsetPx:0,resizable:!0,id:`box-panel-container`,placement:`bottom-left`,title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0,headerPanel:void 0};className=`deck-widget-box`;placement=Zg.defaultProps.placement;title=Zg.defaultProps.title;widthPx=Zg.defaultProps.widthPx;collapsible=Zg.defaultProps.collapsible;isOpen=Zg.defaultProps.defaultOpen;uncontrolledPinned=!1;#e=Zg.defaultProps.panel;#t=null;#n=void 0;#r=!1;#i=!1;#a=void 0;constructor(e={}){super({...Zg.defaultProps,...e}),this.uncontrolledPinned=this.props.defaultPinned,this.setProps(this.props)}get side(){return this.props.side}get isPinned(){return this.props.pinnable&&(this.props.pinned??this.uncontrolledPinned)}get isDocked(){return this.isPinned&&this.isOpen}get isPinnable(){return this.props.pinnable}get floatingOffsetPx(){return Number.isFinite(this.props.offsetPx)?Math.max(0,this.props.offsetPx):0}get isContentOpen(){return this.isOpen}getObservedPanels(){return[this.props.panel,this.props.headerPanel].filter(e=>!!e)}renderHeaderPanel(){return t_(this.props.headerPanel)}renderHeaderTitle(){let e=this.title??this.#e?.title??`Panel`;return this.collapsible?q(`button`,{type:`button`,className:`deck-panel-chrome-toggle`,"aria-expanded":this.isOpen,"aria-label":`${this.isOpen?`Collapse`:`Expand`} ${e}`,title:`${this.isOpen?`Collapse`:`Expand`} ${e}`,onClick:()=>this.#o(!this.isOpen),children:[q(`span`,{children:e}),q(`svg`,{width:`14`,height:`14`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.75`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,focusable:`false`,children:q(`path`,{d:this.isOpen?`m6 9 6 6 6-6`:`m9 6 6 6-6 6`})})]}):q(`span`,{children:e})}changePinned(e){!this.canPin||!this.props.pinnable||(this.props.pinned===void 0&&(this.uncontrolledPinned=e),this.props.onPinnedChange?.(e),this.updateHTML())}setProps(e){this.props.pinned!==void 0&&`pinned`in e&&e.pinned===void 0&&(this.uncontrolledPinned=this.props.pinned),e.placement!==void 0&&(this.placement=e.placement),`title`in e&&(this.title=e.title),e.widthPx!==void 0&&(this.widthPx=Qg(e.widthPx)),e.collapsible!==void 0&&(this.collapsible=e.collapsible),this.#c(e),`panel`in e&&(this.#e=e.panel),super.setProps(e),this.#s()}onRemove(){super.onRemove(),this.#t&&Vh(null,this.#t)}onRenderHTML(e){this.#t=e,this.#s()}onViewportChange(){this.#s()}#o=e=>{this.#i||(this.isOpen=e),this.#a?.(e),this.#s()};#s=()=>{if(!this.#t)return;let e=this.#t;if(e.classList.toggle(`deck-panel-chrome`,this.props.pinnable),this.props.pinnable?super.onRenderHTML(e):(e.dataset.pinnable===`true`&&(this.panelManager?.updateDockedContainer(this),e.hidden=!1,e.style.width=``,e.style.height=``,e.style.maxWidth=``,e.style.maxHeight=``,e.dataset.pinnable=`false`),this.#n=i_(e)),e.style.margin=this.isDocked?`0`:`${this.floatingOffsetPx}px`,this.props.pinnable){this.isOpen||(e.style.width=`max-content`);return}Vh(q($g,{panel:this.#e,headerPanel:this.props.headerPanel,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#o}),this.#t)};#c(e){if(this.#i=(`open`in e?e.open:this.props.open)!==void 0,e.onOpenChange!==void 0&&(this.#a=e.onOpenChange),e.open!==void 0){this.isOpen=e.open,this.#r=!0;return}!this.#r&&e.defaultOpen!==void 0&&(this.isOpen=e.defaultOpen,this.#r=!0)}};Zg=e_;function t_(e){return e?q(`div`,{"data-panel-header":``,style:n_,children:q(jg,{panel:e,children:e.content})}):null}var n_={flex:`0 1 auto`,minWidth:0,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`var(--panel-padding, 8px 12px)`};function r_(e){e.stopPropagation()}function i_(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow===`hidden`||n?.overflowX===`hidden`||n?.overflowY===`hidden`)&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}var a_=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...t===void 0?{}:{maxHeight:`${t}px`},boxSizing:`border-box`,display:`flex`,flexDirection:`column`,pointerEvents:`auto`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--panel-surface-radius, var(--panel-corner-radius, 12px))`,background:`var(--menu-background, rgba(255, 255, 255, 0.96))`,backdropFilter:`var(--menu-backdrop-filter, unset)`,WebkitBackdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))`,overflow:`hidden`}),o_={padding:`var(--panel-padding, 14px 16px 10px)`,fontSize:`var(--panel-font-size, 18px)`,fontWeight:700,lineHeight:1.2,color:`var(--button-text, currentColor)`},s_={width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`var(--panel-gap, 12px)`,border:`none`,background:`none`,color:`inherit`,padding:`0`,margin:`0`,cursor:`pointer`,font:`inherit`,textAlign:`left`},c_=e=>({fontSize:`var(--panel-font-size, 18px)`,lineHeight:1,color:`var(--button-icon-idle, #616166)`,transform:e?`translateY(1px)`:`translateY(-1px)`}),l_=e=>({display:e?`block`:`none`,flex:`1 1 auto`,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`var(--panel-padding, 0 16px 16px)`});function u_(e,t){let[n,r]=ng(t),i=e!==void 0,a=i?e:n;return ig(()=>{i&&r(e)},[i,e]),[a,cg(e=>{i||r(e)},[i])]}var d_=class extends Gm{static defaultProps={...Gm.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;listeners=new Set;constructor(e){super(p_(e,new.target.defaultProps))}get title(){return this.props.title}get content(){return _h(f_,{panel:this})}get theme(){return this.props.theme}get disabled(){return this.props.disabled}get keepMounted(){return this.props.keepMounted}renderContent(){return this.props.content}getChildPanels(){return[]}subscribe(e,t=!0){this.listeners.add(e);let n=t?this.getChildPanels().map(t=>t.subscribe(e)):[];return()=>{this.listeners.delete(e),n.forEach(e=>e())}}setProps(e){super.setProps(p_(e,this.constructor.defaultProps));for(let e of this.listeners)e()}onRenderHTML(e){Vh(_h(jg,{panel:this},this.content),e)}onRemove(){this.rootElement&&Vh(null,this.rootElement)}};function f_({panel:e}){let[,t]=rg(e=>e+1,0);return ag(()=>e.subscribe(()=>t(void 0))),e.renderContent()}function p_(e,t){return Object.fromEntries(Object.entries(e).map(([e,n])=>[e,n===void 0&&Object.hasOwn(t,e)?t[e]:n]))}var m_=class extends d_{static defaultProps={...d_.defaultProps,id:`tabbed-panels`,title:`Panels`,tabListLayout:`wrap`,theme:`inherit`};getChildPanels(){return this.props.panels}renderContent(){let{panels:e,tabListLayout:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i}=this.props;return q(h_,{panels:e,tabListLayout:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i})}};function h_({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=u_(r,n),c=e.filter(e=>!e.disabled),l=c.some(e=>e.id===o)?o:c[0]?.id;return ag(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),q(`div`,{className:t,style:g_,children:[q(`div`,{"data-panel-tabs":``,style:__(a),children:e.map(e=>{let t=e.id===l;return q(`button`,{"data-panel-active":t,type:`button`,style:{...v_,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border-color, var(--menu-border, rgba(148, 163, 184, 0.35)))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onClick:()=>{e.disabled||(s(e.id),i?.(e.id))},children:e.title},e.id)})}),q(`div`,{style:y_,children:e.map(e=>{let t=e.id===l;return q(`div`,{"aria-hidden":!t,style:{...b_,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:q(jg,{panel:e,children:e.content})},e.id)})})]})}var g_={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--panel-surface-radius, var(--button-corner-radius, 8px))`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,backdropFilter:`var(--menu-backdrop-filter, unset)`,WebkitBackdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, none)`};function __(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`var(--panel-gap, 4px)`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`var(--panel-padding, 4px 6px)`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var v_={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`var(--panel-corner-radius, 4px)`,margin:0,padding:`var(--panel-control-padding, 4px 8px)`,fontSize:`var(--panel-font-size, 12px)`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},y_={display:`grid`,alignItems:`start`,padding:`var(--panel-padding, 10px)`,overflow:`auto`},b_={gridArea:`1 / 1`,minWidth:0};function x_({className:e,onRenderHTML:t}){let n=og(null);return ag(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),q(`div`,{ref:n,className:e})}var S_=class extends d_{static defaultProps={...d_.defaultProps,id:`custom-panel`};renderContent(){let{onRenderHTML:e,className:t}=this.props;return q(x_,{className:t,onRenderHTML:e})}},C_=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],w_={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function T_(e,t){let n=w_[t];for(let[t,r]of C_)e.style.setProperty(r,n[t])}function E_(e){for(let[,t]of C_)e.style.removeProperty(t)}var D_=`data-example-panel-host`,O_=`data-example-settings-panel`,k_=`data-example-settings-sections`,A_=`example-source`,j_=`/examples/`,M_=`data-example-panel-appearance`;`${M_}${O_}${O_}${O_}${O_}${O_}${k_}${O_}${k_}`;function N_({id:e,title:t,html:n,onRender:r}){return new S_({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function P_({id:e,title:t,content:n}){return new S_({id:e,title:t,onRenderHTML:e=>(Vh(_h(yh,{},n),e),()=>Vh(null,e))})}function F_(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===A_),i=R_()&&!r?[...e.panels,I_(t)]:e.panels;return e.onActivePanelIdChange?P_({id:e.id??`tabbed-panels`,title:e.title??`Panels`,content:_h(h_,{...n,panels:i})}):new m_({...n,panels:i})}function I_(e){return P_({id:A_,title:`Source`,content:_h(L_,{sourcePaths:e})})}function L_({sourcePaths:e}){let[t,n]=ng({});return ig(()=>{let t=e??z_();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return B_(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?_h(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):_h(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},_h(`code`,{},t.source??`// Loading source…`))}function R_(){return typeof window<`u`&&!!window.website}function z_(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(j_);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function B_(e,t){let n=window.location.pathname.indexOf(j_),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}function V_(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute(D_,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(M_,r),r===`cinematic`||r===`light`?T_(e,r):E_(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?w_[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}function H_(e){let t=/^(r|rg|rgba|bgra)(8unorm|8snorm|16float|32float)(-srgb)?$/.exec(e.format??``);if(!t||!e.width||!e.height)return;let n=t[1]===`r`?1:t[1]===`rg`?2:4,r=t[2],i=r===`16float`?2:r===`32float`?4:1,a=e.width*e.height;if(e.data.byteLength!==a*n*i)return;let o=new DataView(e.data.buffer,e.data.byteOffset,e.data.byteLength),s=new Uint8ClampedArray(a*4),c=e=>{let t=e*i;if(r===`8unorm`)return o.getUint8(t)/255;if(r===`8snorm`)return Math.max(-1,o.getInt8(t)/127);if(r===`32float`)return o.getFloat32(t,!0);let n=o.getUint16(t,!0),a=n&32768?-1:1,s=n>>10&31,c=n&1023;return a*(s===31?c?NaN:1/0:s===0?c*2**-24:(1+c/1024)*2**(s-15))};for(let e=0;e<a;e++)for(let r=0;r<4;r++){let i=t[1]===`bgra`&&r<3?2-r:r,a=+(r===3);i<n?a=c(e*n+i):n===1&&r<3&&(a=c(e)),a=Number.isNaN(a)?0:Math.max(0,Math.min(1,a)),r<3&&!t[3]&&(a=a<=.0031308?12.92*a:1.055*a**(1/2.4)-.055),s[e*4+r]=Math.round(a*255)}return s}function U_(e,t){let n=H_(t);if(!n)return;let r=e.createElement(`canvas`);return r.width=t.width,r.height=t.height,r.setAttribute(`role`,`img`),r.setAttribute(`aria-label`,`Current texture allocation, top-left ${r.width} by ${r.height} pixels; display range 0 to 1`),r.title=`Current allocation · top-left crop · display range 0–1`,r.getContext(`2d`)?.putImageData(new ImageData(n,r.width,r.height),0,0),r.style.cssText=`width:${128*r.width/Math.max(r.width,r.height)}px;max-width:100%;height:auto;image-rendering:pixelated;background:repeating-conic-gradient(#888 0% 25%,#bbb 0% 50%) 0/12px 12px`,r}var W_=1,G_=class{element;document;trigger;valueElement;listbox;ariaLabel;onChange;options;selectedValue=null;activeIndex=-1;disabled;openState=!1;destroyed=!1;typeaheadText=``;typeaheadTimer=null;constructor(e,t){this.document=e.ownerDocument,this.options=[...t.options],this.ariaLabel=t.ariaLabel??`Select option`,this.onChange=t.onChange,this.disabled=t.disabled??!1;let n=W_++,r=`compact-dropdown-trigger-${n}`,i=`compact-dropdown-listbox-${n}`;this.element=this.document.createElement(`div`),this.element.dataset.compactDropdown=``,this.element.innerHTML=`<style>${K_}</style>`,this.trigger=this.document.createElement(`button`),this.trigger.id=r,this.trigger.type=`button`,this.trigger.setAttribute(`role`,`combobox`),this.trigger.setAttribute(`aria-label`,this.ariaLabel),this.trigger.setAttribute(`aria-haspopup`,`listbox`),this.trigger.setAttribute(`aria-controls`,i),this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.dataset.compactDropdownTrigger=``,this.valueElement=this.document.createElement(`span`),this.valueElement.dataset.compactDropdownValue=``;let a=this.document.createElement(`span`);a.dataset.compactDropdownChevron=``,a.setAttribute(`aria-hidden`,`true`),this.trigger.append(this.valueElement,a),this.element.append(this.trigger),this.listbox=this.document.createElement(`div`),this.listbox.id=i,this.listbox.hidden=!0,this.listbox.setAttribute(`role`,`listbox`),this.listbox.setAttribute(`aria-label`,this.ariaLabel),this.listbox.dataset.compactDropdownPopup=``,e.append(this.element),this.document.body.append(this.listbox),this.trigger.addEventListener(`click`,this.handleTriggerClick),this.trigger.addEventListener(`keydown`,this.handleKeyDown),this.listbox.addEventListener(`click`,this.handleOptionClick),this.listbox.addEventListener(`pointermove`,this.handleOptionPointerMove),this.document.addEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.addEventListener(`focusin`,this.handleDocumentFocusIn),this.renderOptions();let o=t.value??this.getFirstEnabledOption()?.value;o!==void 0&&this.setValue(o),this.updateDisabledState()}get value(){return this.selectedValue}set value(e){e===null?(this.selectedValue=null,this.activeIndex=-1,this.updateSelection()):this.setValue(e)}setValue(e,t={}){let n=this.options.find(t=>t.value===e);if(!n)return!1;let r=this.selectedValue!==e;return this.selectedValue=e,this.activeIndex=this.options.indexOf(n),this.updateSelection(),r&&t.emitChange&&this.onChange?.(e,n),!0}setOptions(e){this.options=[...e];let t=this.options.find(e=>e.value===this.selectedValue);this.selectedValue=t?.value??this.getFirstEnabledOption()?.value??null,this.activeIndex=this.getSelectedIndex(),this.renderOptions(),this.updateSelection(),this.updateDisabledState(),this.openState&&this.updatePopupPosition()}setDisabled(e){this.disabled=e,this.updateDisabledState(),this.trigger.disabled&&this.close()}focus(){this.trigger.focus()}open(){this.openState||this.trigger.disabled||this.destroyed||(this.openState=!0,this.activeIndex=this.getSelectedIndex(),this.activeIndex<0&&(this.activeIndex=this.getNextEnabledIndex(-1,1)),this.listbox.hidden=!1,this.trigger.setAttribute(`aria-expanded`,`true`),this.element.dataset.open=`true`,this.updateActiveOption(!0),this.updatePopupPosition(),this.document.defaultView?.addEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.addEventListener(`scroll`,this.handleViewportChange,!0))}close(e={}){this.openState&&(this.openState=!1,this.listbox.hidden=!0,this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.removeAttribute(`aria-activedescendant`),delete this.element.dataset.open,this.document.defaultView?.removeEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.removeEventListener(`scroll`,this.handleViewportChange,!0),e.restoreFocus&&this.trigger.focus())}destroy(){this.destroyed||(this.close(),this.destroyed=!0,this.trigger.removeEventListener(`click`,this.handleTriggerClick),this.trigger.removeEventListener(`keydown`,this.handleKeyDown),this.listbox.removeEventListener(`click`,this.handleOptionClick),this.listbox.removeEventListener(`pointermove`,this.handleOptionPointerMove),this.document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.removeEventListener(`focusin`,this.handleDocumentFocusIn),this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.listbox.remove(),this.element.remove())}handleTriggerClick=()=>{this.openState?this.close():this.open()};handleKeyDown=e=>{switch(e.key){case`ArrowDown`:e.preventDefault(),this.openState?this.moveActiveOption(1):this.open();break;case`ArrowUp`:e.preventDefault(),this.openState?this.moveActiveOption(-1):this.open();break;case`Home`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(-1,1));break;case`End`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(this.options.length,-1));break;case`Enter`:case` `:e.preventDefault(),this.openState?this.selectActiveOption():this.open();break;case`Escape`:this.openState&&(e.preventDefault(),this.close({restoreFocus:!0}));break;case`Tab`:this.close();break;default:e.key.length===1&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.preventDefault(),this.openState||this.open(),this.moveActiveOptionByText(e.key));break}};handleOptionClick=e=>{let t=this.getOptionIndex(e.target);t<0||this.options[t]?.disabled||(this.activeIndex=t,this.selectActiveOption())};handleOptionPointerMove=e=>{let t=this.getOptionIndex(e.target);t>=0&&!this.options[t]?.disabled&&t!==this.activeIndex&&this.setActiveIndex(t)};handleDocumentPointerDown=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleDocumentFocusIn=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleViewportChange=()=>{this.openState&&this.updatePopupPosition()};renderOptions(){this.listbox.replaceChildren(...this.options.map((e,t)=>{let n=this.document.createElement(`div`);n.id=`${this.listbox.id}-option-${t}`,n.setAttribute(`role`,`option`),n.setAttribute(`aria-selected`,String(e.value===this.selectedValue)),e.disabled&&n.setAttribute(`aria-disabled`,`true`),n.dataset.compactDropdownOption=``,n.dataset.optionIndex=String(t);let r=this.document.createElement(`span`);r.textContent=e.label;let i=this.document.createElement(`span`);return i.dataset.compactDropdownStatus=``,i.setAttribute(`aria-hidden`,`true`),n.append(r,i),n}))}updateSelection(){let e=this.options.find(e=>e.value===this.selectedValue);this.valueElement.textContent=e?.label??`—`,this.trigger.title=e?.label??this.ariaLabel;for(let[e,t]of this.getOptionElements().entries())t.setAttribute(`aria-selected`,String(this.options[e]?.value===this.selectedValue));this.updateActiveOption(!1)}updateDisabledState(){this.trigger.disabled=this.disabled||!this.options.some(e=>!e.disabled)}moveActiveOption(e){this.setActiveIndex(this.getNextEnabledIndex(this.activeIndex,e))}moveActiveOptionByText(e){this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.typeaheadText+=e.toLocaleLowerCase();let t=this.getMatchingOptionIndex(this.typeaheadText);t<0&&this.typeaheadText.length>1&&(this.typeaheadText=e.toLocaleLowerCase(),t=this.getMatchingOptionIndex(this.typeaheadText)),t>=0&&this.setActiveIndex(t),this.typeaheadTimer=setTimeout(()=>{this.typeaheadText=``,this.typeaheadTimer=null},650)}getMatchingOptionIndex(e){for(let t=1;t<=this.options.length;t++){let n=(this.activeIndex+t+this.options.length)%this.options.length,r=this.options[n];if(!r?.disabled&&r.label.toLocaleLowerCase().startsWith(e))return n}return-1}getNextEnabledIndex(e,t){if(!this.options.length)return-1;let n=e;for(let e=0;e<this.options.length;e++)if(n=(n+t+this.options.length)%this.options.length,!this.options[n]?.disabled)return n;return-1}setActiveIndex(e){e<0||this.options[e]?.disabled||(this.activeIndex=e,this.updateActiveOption(!0))}updateActiveOption(e){let t=this.getOptionElements();for(let[e,n]of t.entries())e===this.activeIndex&&this.openState?n.dataset.active=`true`:delete n.dataset.active;let n=t[this.activeIndex];this.openState&&n&&(this.trigger.setAttribute(`aria-activedescendant`,n.id),e&&n.scrollIntoView({block:`nearest`}))}selectActiveOption(){let e=this.options[this.activeIndex];!e||e.disabled||(this.setValue(e.value,{emitChange:!0}),this.close({restoreFocus:!0}))}getFirstEnabledOption(){return this.options.find(e=>!e.disabled)}getSelectedIndex(){return this.options.findIndex(e=>e.value===this.selectedValue)}getOptionIndex(e){let t=e?.closest(`[data-compact-dropdown-option]`);return!t||!this.listbox.contains(t)?-1:Number(t.dataset.optionIndex??-1)}getOptionElements(){return Array.from(this.listbox.querySelectorAll(`[role="option"]`))}updatePopupPosition(){let e=this.document.defaultView;if(!e)return;let t=this.trigger.getBoundingClientRect(),n=Math.min(Math.max(t.width,128),e.innerWidth-8),r=Math.max(4,Math.min(t.left,e.innerWidth-n-4)),i=e.innerHeight-t.bottom-3-4,a=t.top-3-4,o=Math.min(176,this.options.length*20+2),s=i<Math.min(o,80)&&a>i,c=s?a:i;Object.assign(this.listbox.style,{left:`${r}px`,top:s?`auto`:`${t.bottom+3}px`,bottom:s?`${e.innerHeight-t.top+3}px`:`auto`,width:`${n}px`,maxHeight:`${Math.max(40,Math.min(176,c))}px`})}},K_=`
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
`,q_=0;function J_(e){let t=e.createElement(`div`);t.id=`gpu-operation-tooltip-${q_++}`,t.setAttribute(`role`,`tooltip`),t.setAttribute(`data-gpu-operation-tooltip`,``),t.hidden=!0,Object.assign(t.style,{position:`fixed`,zIndex:`2147483647`,pointerEvents:`none`,boxSizing:`border-box`,width:`560px`,maxWidth:`calc(100vw - 24px)`,maxHeight:`min(440px, calc(100vh - 24px))`,overflow:`hidden`,padding:`18px`,border:`1px solid rgb(125 170 212 / 32%)`,borderRadius:`12px`,background:`linear-gradient(145deg, #111e30, #080f1b 70%)`,color:`#e4effc`,boxShadow:`0 8px 28px rgb(0 0 0 / 45%)`,font:`14px/1.5 system-ui, sans-serif`,whiteSpace:`normal`,overflowWrap:`anywhere`});let n=e.createElement(`style`);return n.textContent=$_,t.append(n),e.body.append(t),t}function Y_(e,t){let n=t.getBoundingClientRect(),r=t.ownerDocument.documentElement,i=e.getBoundingClientRect();e.style.left=`${Math.max(12,Math.min(n.left,r.clientWidth-i.width-12))}px`;let a=n.bottom+i.height+12<r.clientHeight?n.bottom+6:n.top-i.height-6;e.style.top=`${Math.max(12,Math.min(a,r.clientHeight-i.height-12))}px`}function X_(e,t=e.id){let n=[t];if(e.description&&n.push(e.description),e.resources?.length){n.push(``,`Declared inputs / outputs`);for(let t of e.resources){let e=t.usage===`storage-read-write`||t.usage===`render-attachment`?`Input/output`:[`storage-write`,`copy-destination`].includes(t.usage)?`Output`:`Input`,r=t.width===void 0?t.length===void 0?void 0:`${t.length.toLocaleString()} rows`:`${t.width} × ${t.height}${t.depth&&t.depth>1?` × ${t.depth}`:``}`,i=t.byteLength===void 0?void 0:`${t.byteLength.toLocaleString()} B${t.byteOffset?` @ ${t.byteOffset.toLocaleString()}`:``}`;n.push(`${e}: ${t.id}`,`  ${[t.usage,t.format??t.kind,r,i].filter(Boolean).join(` · `)}`)}}return n.join(`
`)}function Z_(e,t,n={}){let r=e.ownerDocument,i=r.createElement(`div`);i.className=`gpu-operation-content`;let a=(e,t,n,i)=>{let a=r.createElement(t);return a.className=n,a.textContent=i,e.append(a),a},o=a(i,`div`,`gpu-operation-header`,``),s=t.id.split(`-`).filter(Boolean).at(-1)??t.id,c=n.name??t.operation??s.replace(/([a-z])([A-Z])/g,`$1 $2`);if(a(o,`strong`,`gpu-operation-name`,c.charAt(0).toUpperCase()+c.slice(1)),t.type&&a(o,`span`,`gpu-operation-kind`,t.type===`render`?`draw`:t.type),a(i,`code`,`gpu-operation-id`,t.id),t.description&&a(i,`p`,`gpu-operation-description`,t.description),t.resources?.length){let e=a(i,`section`,`gpu-operation-resources`,``);a(e,`div`,`gpu-operation-section-label`,`Declared inputs / outputs`);let n=r.createElement(`table`);n.className=`gpu-operation-table`;let o=r.createElement(`caption`);o.textContent=`Declared resource inputs and outputs`,o.hidden=!0,n.append(o);let s=n.createTHead().insertRow();for(let e of[`Access`,`Resource`,`Format / shape`,`Size`]){let t=r.createElement(`th`);t.scope=`col`,t.textContent=e,s.append(t)}let c=n.createTBody(),l=t.id.slice(0,t.id.lastIndexOf(`-`)+1),u=t.resources.slice(0,6);for(let e of u){let t=c.insertRow(),n=e.usage===`storage-read-write`||e.usage===`render-attachment`?`In / out`:[`storage-write`,`copy-destination`].includes(e.usage)?`Output`:`Input`,r=a(t.insertCell(),`span`,`gpu-operation-access`,n);r.dataset.access=n;let i=a(t.insertCell(),`code`,`gpu-operation-resource-id`,l&&e.id.startsWith(l)?e.id.slice(l.length):e.id);i.title=`${e.id} · ${e.usage}`;let o=t.insertCell(),s=e.width===void 0?e.length===void 0?``:`${e.length.toLocaleString()} rows`:`${e.width} × ${e.height}${e.depth&&e.depth>1?` × ${e.depth}`:``}`,u=a(o,`code`,`gpu-operation-format`,[e.format??e.kind,s].filter(Boolean).join(` · `));u.title=u.textContent??``;let d=t.insertCell();d.className=`gpu-operation-size`,d.textContent=e.byteLength===void 0?`—`:e.byteLength>=1024?`${(e.byteLength/1024).toFixed(1)} KiB`:`${e.byteLength} B`,e.byteLength!==void 0&&(d.title=`${e.byteLength.toLocaleString()} bytes`),e.byteOffset&&(d.title+=` · offset ${e.byteOffset.toLocaleString()} bytes`)}e.append(n),Q_(a(e,`div`,`gpu-operation-resource-overflow`,``),t.resources.length,u.length)}n.timing&&a(i,`div`,`gpu-operation-timing`,n.timing),e.querySelector(`.gpu-operation-content`)?.remove(),e.append(i);let l=e.hidden;e.hidden=!1;let u=i.querySelector(`tbody`),d=i.querySelector(`.gpu-operation-resource-overflow`);for(;u?.rows.length&&e.scrollHeight>e.clientHeight;)u.deleteRow(-1),Q_(d,t.resources.length,u.rows.length),u.rows.length===0&&(u.closest(`table`).hidden=!0);e.hidden=l}function Q_(e,t,n){let r=t-n;e.hidden=r===0,e.textContent=r?`+ ${r} more ${r===1?`resource`:`resources`}`:``}var $_=`
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
`,ev=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:1}),tv=new Intl.NumberFormat(`en-US`,{notation:`compact`,maximumFractionDigits:1}),nv=class{element;graphLabels;nodeLabels;counterLabels;snapshot={graphs:[]};selectedGraphId=null;selectionIsManual=!1;graphOptionsSignature=``;memoryMarkup=``;nodeRows=new Map;counterRows=new Map;graphDropdown;tooltip;tooltipEvents=new AbortController;inspector;resourceRows=new Map;resources=new Map;activeResourceKey;previewGeneration=0;renderedGraphId;selectedResourceKey;viewerGeneration=0;pendingPreviews=new Map;thumbnailGeneration=0;activeNodeId;constructor(e,t={}){this.element=e,this.inspector=t.inspector,this.tooltip=J_(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-graph-tooltip`,``);let n=e=>{let t=e.target.closest(`[data-resource-key]`);if(t&&this.element.contains(t)){this.showResourceTooltip(t);return}let n=e.target.closest(`[data-full-name]`);n&&this.element.contains(n)&&this.showTooltip(n)},r=e=>{let t=e.target.closest(`[data-full-name], [data-resource-key]`),n=e.relatedTarget;(!(n instanceof Node)||!t?.contains(n))&&this.hideTooltip()},i={signal:this.tooltipEvents.signal};e.addEventListener(`mouseover`,n,i),e.addEventListener(`focusin`,n,i),e.addEventListener(`mouseout`,r,i),e.addEventListener(`focusout`,r,i),e.addEventListener(`scroll`,()=>this.hideTooltip(),{...i,capture:!0}),e.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip();let t=e.target.closest(`[data-resource-key]`);t&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.selectResource(t.dataset.resourceKey))},i),e.ownerDocument.defaultView?.addEventListener(`resize`,()=>this.hideTooltip(),i),this.graphLabels=t.graphLabels??{},this.nodeLabels=t.nodeLabels??{},this.counterLabels=t.counterLabels??{},this.element.innerHTML=`<div data-gpu-command-graph-inspector>
      <style>${sv}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div role="tablist" aria-label="Graph inspector views">
          <button type="button" role="tab" aria-selected="true" data-inspector-tab="timings">Graph</button>
          <button type="button" role="tab" aria-selected="false" data-inspector-tab="resources">Graph Resources</button>
        </div>
        <div data-inspector-view="timings">
        <div class="graph-inspector-summary">
          ${cv(`encodings`,``,`encoding-count`)}
          ${cv(`CPU p50 / p95 (ms)`,``,`cpu-totals`)}
          ${cv(`GPU p50 / p95 (ms)`,``,`gpu-totals`)}
          ${cv(`GPU samples`,``,`gpu-samples`)}
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
    </div>`,e.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-inspector-tab]`);if(r){this.hideTooltip();for(let t of e.querySelectorAll(`[data-inspector-tab]`))t.setAttribute(`aria-selected`,String(t===r));for(let t of e.querySelectorAll(`[data-inspector-view]`))t.hidden=t.dataset.inspectorView!==r.dataset.inspectorTab}n.closest(`[data-texture-previews]`)&&this.refreshTextureThumbnails();let i=n.closest(`[data-resource-key]`);i&&this.selectResource(i.dataset.resourceKey),n.closest(`[data-resource-refresh]`)&&this.selectedResourceKey&&this.selectResource(this.selectedResourceKey)},i);let a=this.element.querySelector(`[data-graph-inspector-picker-host]`);this.graphDropdown=new G_(a,{ariaLabel:`Graph`,options:[],onChange:e=>{this.hideTooltip(),this.selectedGraphId=e,this.selectionIsManual=!0,this.render()}})}update(e,t){if(this.snapshot=e,e.graphs.some(e=>e.id===this.selectedGraphId)||(this.selectedGraphId=null,this.selectionIsManual=!1),!this.selectionIsManual&&t){let n=e.graphs.find(e=>e.id===t);n&&(this.selectedGraphId=n.id)}this.selectedGraphId??=e.graphs[0]?.id??null,this.render()}destroy(){this.hideTooltip(),this.viewerGeneration++,this.thumbnailGeneration++,this.tooltipEvents.abort(),this.tooltip.remove(),this.graphDropdown.destroy(),this.element.replaceChildren(),this.nodeRows.clear(),this.counterRows.clear(),this.resourceRows.clear(),this.resources.clear()}showTooltip(e){this.activeResourceKey&&this.hideTooltip(),this.activeNodeId=e.getAttribute(`data-full-name`)??void 0;let t=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId)?.nodes.find(e=>e.id===this.activeNodeId);if(!t)return;let n=mv(this.nodeLabels,t.id);Z_(this.tooltip,t,{name:n===t.id?void 0:n}),this.tooltip.hidden=!1,Y_(this.tooltip,e)}async showResourceTooltip(e){let t=e.dataset.resourceKey;if(this.activeResourceKey===t)return;this.hideTooltip(),this.activeResourceKey=t;let n=this.previewGeneration,r=this.resources.get(t),i=this.selectedGraphId;if(!r||!i)return;let a=this.tooltip.ownerDocument.createElement(`div`);a.className=`gpu-operation-content`;let o=this.tooltip.ownerDocument.createElement(`strong`);o.textContent=r.summary.id;let s=this.tooltip.ownerDocument.createElement(`div`);s.textContent=gv(r.summary);let c=this.tooltip.ownerDocument.createElement(`pre`);c.style.whiteSpace=`pre-wrap`,c.style.fontSize=`11px`,c.textContent=`Reading current GPU data…`,a.append(o,s,c),this.tooltip.querySelector(`.gpu-operation-content`)?.remove(),this.tooltip.append(a),this.tooltip.hidden=!1,Y_(this.tooltip,e);try{if(!this.inspector)throw Error(`No live inspector is connected.`);let e=await this.readPreview(t,i,r);if(n!==this.previewGeneration)return;this.showTextureThumbnail(t,e),c.textContent=_v(e);let o=U_(this.tooltip.ownerDocument,e);o&&a.insertBefore(o,c)}catch(e){if(n!==this.previewGeneration)return;c.textContent=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`}n===this.previewGeneration&&Y_(this.tooltip,e)}readPreview(e,t,n){let r=`${t}/${e}`,i=this.pendingPreviews.get(r);if(i)return i;let a=this.inspector?this.inspector.readResource(t,n.nodeId,n.index):Promise.reject(Error(`No live inspector is connected.`));return this.pendingPreviews.set(r,a),a.finally(()=>this.pendingPreviews.delete(r)).catch(()=>{}),a}async selectResource(e){this.hideTooltip();let t=this.resources.get(e),n=this.selectedGraphId;if(!t||!n)return;this.selectedResourceKey=e;let r=++this.viewerGeneration;for(let[t,n]of this.resourceRows)n.setAttribute(`aria-pressed`,String(t===e));let i=this.element.querySelector(`[data-resource-viewer]`);i.textContent=`${t.summary.id} · ${gv(t.summary)}\nReading current GPU data…`;try{let a=await this.readPreview(e,n,t);if(r!==this.viewerGeneration)return;this.showTextureThumbnail(e,a),i.textContent=`${t.summary.id} · ${gv(t.summary)}\n${_v(a)}`;let o=U_(i.ownerDocument,a);o&&i.prepend(o)}catch(e){r===this.viewerGeneration&&(i.textContent=`${t.summary.id}\nPreview unavailable: ${e instanceof Error?e.message:String(e)}`)}}showTextureThumbnail(e,t){let n=this.resourceRows.get(e);if(!n)return;let r=U_(n.ownerDocument,t);if(!r)return;let i=Math.max(r.width,r.height);r.style.width=`${48*r.width/i}px`,r.style.height=`${48*r.height/i}px`,r.style.flexShrink=`0`,n.removeAttribute(`title`),n.querySelector(`canvas`)?.remove(),n.prepend(r)}async refreshTextureThumbnails(){let e=this.selectedGraphId;if(!e)return;let t=++this.thumbnailGeneration,n=this.element.querySelector(`[data-texture-previews]`);n.disabled=!0;let r=[...this.resources].filter(([,e])=>e.summary.kind===`texture`).slice(0,32);n.textContent=`Reading up to 32 textures…`;try{for(let[n,i]of r){if(t!==this.thumbnailGeneration)return;this.resourceRows.get(n)?.querySelector(`canvas`)?.remove();try{let r=await this.readPreview(n,e,i);if(t!==this.thumbnailGeneration)return;this.showTextureThumbnail(n,r)}catch(e){if(t!==this.thumbnailGeneration)return;let r=this.resourceRows.get(n);r&&(r.title=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`)}}}finally{n.disabled=!1,n.textContent=`Refresh texture thumbnails`}}hideTooltip(){this.previewGeneration++,this.activeResourceKey=void 0,this.activeNodeId=void 0,this.tooltip.hidden=!0}render(){let e=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId),t=this.element.querySelector(`[data-graph-inspector-empty]`),n=this.element.querySelector(`[data-graph-inspector-content]`);if(!e){this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.thumbnailGeneration++,this.renderedGraphId=void 0,t.hidden=!1,n.hidden=!0;return}if(this.renderedGraphId!==e.id){this.thumbnailGeneration++;for(let e of this.resourceRows.values())e.querySelector(`canvas`)?.remove();this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`}this.renderedGraphId=e.id,this.resources.clear();for(let t of e.nodes)for(let[e,n]of(t.resources??[]).entries()){let{usage:r,...i}=n,a=JSON.stringify(i);this.resources.set(a,{nodeId:t.id,index:e,summary:n})}this.selectedResourceKey&&!this.resources.has(this.selectedResourceKey)&&(this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`),rv(this.element.querySelector(`[data-graph-inspector-resources]`),this.resourceRows,[...this.resources].map(([e,t])=>({id:e,...t})),(e,t)=>{e.className=`graph-inspector-resource`,e.tabIndex=0,av(e,`role`,`button`),av(e,`aria-pressed`,String(t.id===this.selectedResourceKey)),av(e,`data-resource-key`,t.id),av(e,`aria-describedby`,this.tooltip.id);let n=e.querySelector(`span`);n||(n=e.ownerDocument.createElement(`span`),e.append(n)),iv(n,`${t.summary.kind===`buffer`?`Buffer`:`Texture`} · ${t.summary.id} · ${gv(t.summary)}`)}),this.activeResourceKey&&!this.resources.has(this.activeResourceKey)&&this.hideTooltip(),t.hidden=!0,n.hidden=!1;let r=this.snapshot.graphs.map(e=>`${e.id}\u0000${this.getGraphLabel(e.id)}`).join(``);r!==this.graphOptionsSignature&&(this.graphDropdown.setOptions(this.snapshot.graphs.map(e=>({value:e.id,label:this.getGraphLabel(e.id)}))),this.graphOptionsSignature=r),this.graphDropdown.value!==e.id&&(this.graphDropdown.value=e.id);let i=e.stats.logicalTransientBytes+e.stats.logicalTransientTextureBytes,a=e.stats.reusedTransientBytes+e.stats.reusedTransientTextureBytes,o=i?a/i*100:0,s=e.totals.gpu.sampleCount;rv(this.element.querySelector(`[data-graph-inspector-nodes]`),this.nodeRows,e.nodes,(t,n)=>{t.hasChildNodes()||(t.className=`graph-inspector-node`,t.innerHTML=`<span><i></i><span data-node-label></span></span><strong data-node-cpu></strong><strong data-node-gpu></strong>`),av(t,`data-node-type`,n.type),av(t,`data-full-name`,n.id),av(t,`data-operation-details`,X_(n)),av(t,`aria-describedby`,this.tooltip.id),t.tabIndex=0,this.activeNodeId===n.id&&this.showTooltip(t);let r=t.querySelector(`i`),i=n.type===`render`?`draw`:n.type;av(r,`title`,i),av(r,`aria-label`,i);let a=mv(this.nodeLabels,n.id);iv(t.querySelector(`[data-node-label]`),a===n.id?lv(n.id,e.id):a),iv(t.querySelector(`[data-node-cpu]`),uv(n.cpu)),iv(t.querySelector(`[data-node-gpu]`),uv(n.gpu))}),this.activeNodeId&&!e.nodes.some(e=>e.id===this.activeNodeId)&&this.hideTooltip(),rv(this.element.querySelector(`[data-graph-inspector-counter-rows]`),this.counterRows,e.counters,(e,t)=>{e.hasChildNodes()||(e.className=`graph-inspector-counter`,e.innerHTML=`<span></span><strong data-counter-latest></strong><strong data-counter-percentiles></strong>`),av(e,`title`,`${t.id} · ${t.sampleCount} samples`),iv(e.querySelector(`span`),this.getCounterLabel(t.id)),iv(e.querySelector(`[data-counter-latest]`),fv(t.latestValue)),iv(e.querySelector(`[data-counter-percentiles]`),`${fv(t.p50Value)} / ${fv(t.p95Value)}`)}),this.setText(`encoding-count`,String(e.encodingCount)),this.setText(`cpu-totals`,uv(e.totals.cpu)),this.setText(`gpu-totals`,uv(e.totals.gpu)),this.setText(`gpu-samples`,`${s}${e.timingReadFailureCount?` · ${e.timingReadFailureCount} failed`:``}`);let c=`
      <span>${e.stats.nodeOrder.length} nodes</span>
      <span>${pv(e.stats.logicalResourceBytes)} logical</span>
      <span>${pv(e.stats.physicalTransientResourceBytes)} scratch</span>
      ${e.preflight?.annotatedNodeCount?`<span>${e.preflight.annotatedNodeCount}/${e.stats.nodeOrder.length} costed nodes</span>`:``}
      ${e.preflight?.maximumInvocationCount?`<span>${ov(e.preflight.maximumInvocationCount)} max invocations</span>`:``}
      ${e.preflight?.readByteLength?`<span>${pv(e.preflight.readByteLength)} max reads</span>`:``}
      ${e.preflight?.writeByteLength?`<span>${pv(e.preflight.writeByteLength)} max writes</span>`:``}
      <span>${o?`${o.toFixed(0)}% reuse`:`no reuse`}</span>
      <span>${s?`GPU timings sampled`:`CPU timings only`}</span>`;c!==this.memoryMarkup&&(this.element.querySelector(`[data-graph-inspector-memory]`).innerHTML=c,this.memoryMarkup=c);let l=this.element.querySelector(`[data-graph-inspector-counters]`);l.hidden=e.counters.length===0}setText(e,t){iv(this.element.querySelector(`[data-graph-inspector-${e}]`),t)}getGraphLabel(e){return mv(this.graphLabels,e)}getCounterLabel(e){return mv(this.counterLabels,e)}};function rv(e,t,n,r){let i=new Set(n.map(e=>e.id));for(let[e,n]of t)i.has(e)||(n.remove(),t.delete(e));for(let[i,a]of n.entries()){let n=t.get(a.id);n||(n=e.ownerDocument.createElement(`div`),t.set(a.id,n)),r(n,a);let o=e.children[i]??null;o!==n&&e.insertBefore(n,o)}}function iv(e,t){e.textContent!==t&&(e.textContent=t)}function av(e,t,n){e.getAttribute(t)!==n&&e.setAttribute(t,n)}function ov(e){return tv.format(e)}var sv=`
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
`;function cv(e,t,n){return`<span class="graph-inspector-metric"><span>${hv(e)}</span><strong data-graph-inspector-${n}>${hv(t)}</strong></span>`}function lv(e,t){let n=t.endsWith(`-graph`)?t.slice(0,-6):t,r=e.startsWith(`${n}-`)?e.slice(n.length+1):e;return r.length>32?`${r.slice(0,30)}…`:r}function uv(e){return e.p50Milliseconds===void 0?`—`:`${dv(e.p50Milliseconds)} / ${dv(e.p95Milliseconds??e.p50Milliseconds)}`}function dv(e){return e.toFixed(e<1?3:2)}function fv(e){return(e>=1e4?tv:ev).format(e)}function pv(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(1)} KiB`:e<1024**3?`${(e/1024**2).toFixed(1)} MiB`:`${(e/1024**3).toFixed(1)} GiB`}function mv(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:t}function hv(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function gv(e){return e.kind===`buffer`?`${e.format??`raw bytes`} · ${e.byteLength??0} B @ ${e.byteOffset??0}`:`${e.format??e.kind} · ${e.width} × ${e.height} · mip ${e.baseMipLevel??0}, layer ${e.baseArrayLayer??0}`}function _v(e){let t=e.data,n,r=`bytes`;return/^float32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Float32Array(t.slice().buffer)),r=`float32`):/^uint32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Uint32Array(t.slice().buffer)),r=`uint32`):n=Array.from(t),`Current allocation · ${t.length} bytes read${e.width?` · top-left ${e.width} × ${e.height}`:``}\n${r}: ${n.slice(0,64).join(`, `)}${n.length>64?`, …`:``}`}function vv(e){let t=document.querySelector(`#pool-info`),n=new al({maxSamples:90}),r=n.observeGraph(e),i=null,a=0,o=-1/0,s=null,c=e.device.features.has(`timestamp-query`)?`GPU timings are sampled while this tab is visible.`:`GPU timestamp queries are unavailable; CPU encoding timings remain available.`,l=null;T_(t,`cinematic`);let u=new e_({id:`pool-info-box`,title:`GPU Pool Practice`,placement:`top-left`,widthPx:340,onOpenChange:e=>document.body.toggleAttribute(`data-inspector-open`,e),collapsible:!0,defaultOpen:!1,panel:F_({id:`pool-info-tabs`,theme:`dark`,panels:[N_({id:`pool-about`,title:`About`,html:`<p>Free practice: pot any ball, in any order. A scratched cue ball returns after the shot.</p>
            <p>Drag on the table to aim. Release to hold that angle. Hold Shoot to charge and release to shoot; Escape cancels. New Rack restores the table. Choose a practice setup to compare follow, draw and cushion spin.</p>
            <p>After you pause aiming, the guide previews up to six seconds with the selected spin, power and throw settings. White tracks the cue ball and gold tracks the object balls that move.</p>
            <p>Physics stays on the GPU. Step-local triggers capture pockets; small snapshots check when balls settle. Cloth friction converts sliding to rolling, while cushions exchange spin and lose more rebound pace on harder impacts.</p>
            <p>Throw controls isolate linear and angular surface slip. These are experimental approximations, not measured billiards calibration. Shots are capped at 18 table units/s; exhausted collision budgets report discarded time.</p>`,onRender:e=>V_(e,`cinematic`)}),N_({id:`pool-graph`,title:`GPU graph inspector`,html:`<p data-pool-timing-status></p><div data-pool-graph-inspector></div>`,onRender:t=>(V_(t,`cinematic`),l=t,t.querySelector(`[data-pool-timing-status]`).textContent=c,i=new nv(t.querySelector(`[data-pool-graph-inspector]`),{inspector:n,graphLabels:{[e.id]:`Pool physics`},nodeLabels:Object.fromEntries(e.stats.nodeOrder.map(e=>[e,yv(e)]))}),i.update(n.getSnapshot(),e.id),()=>{i?.destroy(),i=null,l=null})})]})}),d=new Jg({parentElement:t});return d.setProps({components:[u]}),{observation:r,sampleStep(t){if(!u.isOpen||!l?.getClientRects().length||s||t-o<500||!e.device.features.has(`timestamp-query`))return!1;o=t;let n=e.device.createQuerySet({type:`timestamp`,count:e.stats.nodeOrder.length*2});try{let t=e.device.createCommandEncoder({timeProfilingQuerySet:n}),i=r.encode(t,{parameters:void 0,coalesceComputePasses:!1});e.device.submit(t.finish()),s=r.recordGPUTimings(i).then(()=>void 0,e=>{c=`GPU timing read failed: ${String(e)}`}).finally(()=>{n.destroy(),s=null})}catch(e){throw n.destroy(),e}return!0},update(t){d.onRedraw({viewports:[],layers:[]}),u.isOpen&&i&&t-a>=250&&(a=t,i.update(n.getSnapshot(),e.id),l.querySelector(`[data-pool-timing-status]`).textContent=c)},destroy(){return d.finalize(),r.detach(),n.clear(),s}}}function yv(e){let t=e.replace(/^gpu-sphere-world-step-\d+-/,``),n=/^impact-(\d+)-(.+)$/.exec(t),r=(n?n[2]:t).replaceAll(`-`,` `);return r.charAt(0).toUpperCase()+r.slice(1)+(n?` · impact `+(Number(n[1])+1):``)}var bv=class{enabled=!0;context;output;noise;lastContact=new Map;unlock(){if(this.enabled)try{if(!this.context){this.context=new AudioContext,this.output=this.context.createGain(),this.output.gain.value=.32;let e=this.context.createDynamicsCompressor();e.threshold.value=-12,e.ratio.value=8,this.output.connect(e).connect(this.context.destination),this.noise=this.context.createBuffer(1,Math.ceil(this.context.sampleRate*.18),this.context.sampleRate);let t=this.noise.getChannelData(0);for(let e=0;e<t.length;e++)t[e]=Math.random()*2-1}this.context.resume().catch(()=>{})}catch{this.enabled=!1}}playCue(e){this.playImpact(330,.5+e*.45,.045,-.1)}playPocket(){this.playImpact(140,.5,.16,0)}playEvents(e,t){if(!this.enabled)return;let n=0;for(let r of e){if(r.kind!==`sphere-impact`&&r.kind!==`plane-impact`)continue;let e=r.body*1024+r.target+(r.kind===`plane-impact`?512:0);if(r.speed<.18||t-(this.lastContact.get(e)??-1e3)<60)continue;this.lastContact.set(e,t);let i=r.kind===`sphere-impact`;if(this.playImpact(i?470:180,Math.min(.8,.12+r.speed*.1),i?.045:.065,r.position[0]/7),++n>=8)break}}destroy(){this.context?.close().catch(()=>{}),this.context=void 0}playImpact(e,t,n,r){let i=this.context;if(!this.enabled||!i||i.state!==`running`||!this.output||!this.noise)return;let a=i.currentTime,o=i.createStereoPanner();o.pan.value=Math.max(-1,Math.min(1,r)),o.connect(this.output);let s=.96+Math.random()*.08;for(let[r,c,l]of[[.45,.55,1],[1,.6,.65],[1.73,.2,.35]]){let u=i.createOscillator();u.type=`sine`,u.frequency.value=e*r*s;let d=i.createGain();d.gain.setValueAtTime(1e-4,a),d.gain.exponentialRampToValueAtTime(t*c,a+7e-4),d.gain.exponentialRampToValueAtTime(1e-4,a+n*l),u.connect(d).connect(o),u.start(a),u.stop(a+n),u.onended=()=>{u.disconnect(),d.disconnect()}}let c=i.createBufferSource();c.buffer=this.noise;let l=i.createBiquadFilter();l.type=`lowpass`,l.frequency.value=Math.min(2600,e*5),l.Q.value=.5;let u=i.createGain();u.gain.setValueAtTime(t*1.7,a),u.gain.exponentialRampToValueAtTime(1e-4,a+.012),c.connect(l).connect(u).connect(o),c.start(a),c.stop(a+n+.005),c.onended=()=>{c.disconnect(),l.disconnect(),u.disconnect(),o.disconnect()}}};function xv(e,t=0){let n=(100-t)*16,r=Math.max(0,e)%(n+(t===0?350:650));return Math.min(100,t+r/16)}function Sv(e,t,n){return e===`rack`&&n>0&&t>=n}function X(e){return document.querySelector(`#`+e)}var Cv=X(`status`),Z=X(`pool`),Q=X(`shoot`),wv=X(`reset`),$=X(`power`),Tv=X(`angle`),Ev=X(`practice`),Dv=X(`forecast-status`),Ov=document.querySelector(`#aim-guide`),kv=document.querySelector(`#aim-line`),Av=document.querySelector(`#object-line`),jv=X(`guides`),Mv=!0;jv.onclick=()=>{Mv=!Mv,jv.setAttribute(`aria-pressed`,String(Mv))};var Nv=document.querySelector(`#cue-trail`),Pv=document.querySelector(`#cue-trail-recent`),Fv=X(`cue-style`),Iv=new bv;try{let e=null,t=await ge.createDevice({adapters:[at],optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:Z,autoResize:!0},onError:t=>{e=t}}),n=e=>t.createBuffer({data:e,usage:N.STORAGE|N.COPY_SRC|N.COPY_DST}),r=n(Fu()),i=new Float32Array(64),a=new Float32Array(64);for(let e=0;e<16;e++)i[e*4+3]=1,a[e*4]=Math.SQRT1_2,a[e*4+3]=Math.SQRT1_2;let o=n(i),s=n(a),c={count:16,continuous:!0,warmStarting:!0,maximumImpactSteps:4,broadPhase:`all-pairs`,eventCapacity:4096,triggers:Nu.map(e=>({center:e,radius:Mu,capture:!0})),positions:r,velocities:o,orientations:s,maximumRadius:U,maximumContacts:15,timeStep:1/240,iterations:12,contactSkin:.002,restitution:.94,staticFriction:.06,dynamicFriction:.04,rollingResistance:.035,sleepAfter:.3,sleepLinearSpeed:.025,sleepAngularSpeed:.12,restitutionThreshold:.08,planes:Pu},l=new Au(c),u=new Jc(t);l.addToGraph(u);let d=await u.compileAsync(),f=await Uu(t,l,c),p=vv(d),m=Wm(t,X(`cue-preview`)),h=await l.readState(),g=`aiming`,_=0,v=15,y=!1,b=0,x=0,S=0,C=0,w=[0,0],T=!0,E=!0,D=0,O=performance.now(),k=0,A=null,ee=0,te=!0,ne=0,j=null,re=0,ie=null,M=null,ae=null,oe=!1,se=!1,ce=0,le=0,ue=0,de=0,fe=new AbortController;function pe(e){$.value=String(Math.round(e)),X(`power-value`).textContent=$.value+`%`,$.style.setProperty(`--power`,$.value+`%`)}function me(){j=null,ae=null;let e=ie;ie=null,e!==null&&Q.hasPointerCapture(e)&&Q.releasePointerCapture(e),Q.textContent=`Shoot`,Q.setAttribute(`aria-pressed`,`false`)}function he(){g!==`aiming`||j!==null||(Iv.unlock(),j=performance.now(),re=Number($.value),Q.textContent=`Release`,Q.setAttribute(`aria-pressed`,`true`),Cv.value=`Charging — release to shoot · Esc to cancel`,P())}function _e(){j!==null&&(me(),Number($.value)>0?Ee():(Cv.value=`Shot cancelled.`,P()))}let ve=new Set,ye=[];function P(){Q.disabled=g!==`aiming`,$.disabled=g!==`aiming`||j!==null,Tv.disabled=g!==`aiming`;for(let e of[`center-spin`,`cut-throw`,`spin-throw`])X(e).disabled=g!==`aiming`;X(`contact-ball`).setAttribute(`aria-disabled`,String(g!==`aiming`)),X(`pot-count`).hidden=v===0,X(`score`).textContent=`${ve.size} / ${v}`,X(`shots`).textContent=`${_} ${_===1?`shot`:`shots`}`,X(`potted-balls`).textContent=ve.size?`Potted: ${[...ve].sort((e,t)=>e-t).join(` · `)}`:`All practice balls on the table`}function be(e){C=Math.atan2(Math.sin(e),Math.cos(e)),Tv.value=String(C*180/Math.PI),X(`angle-value`).textContent=`${Math.round(C*180/Math.PI)}°`}function xe(e,t){let n=Math.hypot(e,t),r=n>.8?.8/n:1;w=[e*r,t*r],X(`contact-marker`).style.left=`${50+w[0]*50}%`,X(`contact-marker`).style.top=`${50-w[1]*50}%`;let i=[w[1]>.08?`Follow`:w[1]<-.08?`Draw`:``,w[0]>.08?`Right`:w[0]<-.08?`Left`:``].filter(Boolean),a=i.length?i.join(` + `)+` spin`:`Center hit`;X(`spin-value`).textContent=a,X(`contact-ball`).setAttribute(`aria-label`,`Cue-ball contact point: ${a}. Arrow keys adjust; Home centers.`)}let Se=X(`contact-ball`);function Ce(e){if(g!==`aiming`)return;let t=Se.getBoundingClientRect();xe(2*(e.clientX-t.left)/t.width-1,1-2*(e.clientY-t.top)/t.height)}Se.onpointerdown=e=>{e.button!==0||g!==`aiming`||(Se.focus(),Se.setPointerCapture(e.pointerId),Ce(e))},Se.onpointermove=e=>{Se.hasPointerCapture(e.pointerId)&&Ce(e)},Se.onkeydown=e=>{if(g!==`aiming`)return;let t={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]};e.key===`Home`?(e.preventDefault(),xe(0,0)):t[e.key]&&(e.preventDefault(),xe(w[0]+t[e.key][0],w[1]+t[e.key][1]))},X(`center-spin`).onclick=()=>xe(0,0),X(`cut-throw`).onclick=()=>{T=!T,l.update({cutInducedThrow:T}),f.setThrow(T,E),X(`cut-throw`).setAttribute(`aria-pressed`,String(T))},X(`spin-throw`).onclick=()=>{E=!E,l.update({spinInducedThrow:E}),f.setThrow(T,E),X(`spin-throw`).setAttribute(`aria-pressed`,String(E))};function we(){let e=Z.clientWidth/Z.clientHeight;return e>=1.85?[4*e,4]:[7.4,7.4/e]}function Te(e){if(g!==`aiming`||!h[0].enabled)return;let t=Z.getBoundingClientRect(),n=we(),r=[(2*(e.clientX-t.left)/t.width-1)*n[0],(1-2*(e.clientY-t.top)/t.height)*n[1]];be(Math.atan2(r[1]-h[0].position[1],r[0]-h[0].position[0]))}Z.onpointerdown=e=>{if(j!==null){e.preventDefault();return}e.button!==0||g!==`aiming`||M!==null||(Z.focus(),M=e.pointerId,Z.setPointerCapture(e.pointerId),Te(e),Iv.unlock())},Z.onpointerup=e=>{e.pointerId===M&&(M=null,Z.releasePointerCapture(e.pointerId))},Z.onpointermove=e=>{e.pointerId===M&&Te(e)},Z.onlostpointercapture=e=>{e.pointerId===M&&(M=null)},$.oninput=()=>{X(`power-value`).textContent=$.value+`%`,$.style.setProperty(`--power`,$.value+`%`)},Tv.oninput=()=>be(Number(Tv.value)*Math.PI/180);function Ee(){g!==`aiming`||j!==null||(se=!1,ue=0,Iv.unlock(),ye.length=0,ye.push([h[0].position[0],h[0].position[1]]),g=`striking`,x=performance.now(),P(),Cv.value=`Taking the shot…`)}Q.onpointerdown=e=>{e.button!==0||g!==`aiming`||j!==null||(e.preventDefault(),Q.focus(),ie=e.pointerId,Q.setPointerCapture(e.pointerId),he())},Q.onpointerup=e=>{e.pointerId===ie&&(e.preventDefault(),_e())},Q.onpointercancel=Q.onlostpointercapture=()=>{j!==null&&(me(),pe(0),P())},window.addEventListener(`keydown`,e=>{let t=e.target,n=t instanceof HTMLElement&&t.closest(`button, input, select, textarea, summary, a, [contenteditable], #contact-ball`);!(e.code===`Space`||t===Q&&e.code===`Enter`)||n&&t!==Q||g!==`aiming`||e.defaultPrevented||(e.preventDefault(),!e.repeat&&j===null&&(ae=e.code===`Enter`?`Enter`:`Space`,he()))},{signal:fe.signal}),window.addEventListener(`keyup`,e=>{ae===e.code&&(e.preventDefault(),_e())},{signal:fe.signal}),Q.onclick=e=>{e.detail===0&&j===null&&Ee()},window.addEventListener(`keydown`,e=>{e.key!==`Escape`||wv.disabled||(j!==null||M!==null||g===`striking`)&&(M!==null&&Z.hasPointerCapture(M)&&Z.releasePointerCapture(M),M=null,e.preventDefault(),me(),pe(0),g=`aiming`,Cv.value=`Shot cancelled — ready to aim.`,P())},{signal:fe.signal}),window.addEventListener(`blur`,()=>{j!==null&&(me(),pe(0),P())},{signal:fe.signal}),X(`sound`).onclick=()=>{Iv.enabled=!Iv.enabled,Iv.enabled&&Iv.unlock(),X(`sound`).setAttribute(`aria-pressed`,String(Iv.enabled))},Z.onkeydown=e=>{g===`aiming`&&(e.key===`ArrowLeft`||e.key===`ArrowRight`)&&(e.preventDefault(),be(C+(e.key===`ArrowLeft`?1:-1)*Math.PI/180))};async function De(){if(!wv.disabled){wv.disabled=!0,X(`reset-shot`).disabled=!0,Ev.disabled=!0,ee++,me(),de=0,g=`striking`,P();try{A&&await A;let e=await l.readEvents();ce=e.exhaustedImpactSteps,le=e.discardedSimulationTime;let t=Fu(),n=Ev.value;v=n===`rack`?15:n===`cushion`?0:1,n!==`rack`&&(t.set(n===`cushion`?[2,-1,U,U]:[-2,0,U,U],0),t.set([0,0,U,U],4));for(let e=0;e<16;e++)l.teleportBody(e,[t[e*4],t[e*4+1],t[e*4+2]],[Math.SQRT1_2,0,0,Math.SQRT1_2]),l.setBodyEnabled(e,e<=v);h=await l.readState(),_=0,ve.clear(),ye.length=0,y=!1,b=0,D=0,be(n===`cushion`?Math.PI/9:0),xe(n===`cushion`?.65:0,n===`follow`?.65:n===`draw`?-.65:0),$.value=n===`rack`?`85`:`60`,X(`power-value`).textContent=$.value+`%`,$.style.setProperty(`--power`,$.value+`%`),X(`reset-shot`).hidden=n===`rack`,X(`cue-motion`).textContent=``,g=`aiming`,Cv.value=n===`rack`?`Ready for the break.`:n===`cushion`?`Compare left and right spin, then try a softer or firmer shot.`:`Shoot straight at the object ball. Watch the cue ball after contact.`,P()}catch(t){e=t instanceof Error?t:Error(String(t))}finally{wv.disabled=!1,X(`reset-shot`).disabled=!1,Ev.disabled=!1}}}wv.onclick=()=>{Ev.value=`rack`,De()},X(`reset-shot`).onclick=()=>void De(),Ev.onchange=()=>void De();async function Oe(e,t){let[n,r,i]=await Promise.all([l.readEvents(),l.readState(),l.diagnostics.readAsync()]);if(!te||t!==ee||(h=r,g!==`rolling`))return;let a=ku(new Uint32Array(i.buffer,i.byteOffset,8));se||=!!a.exhaustedImpactSteps||n.exhaustedImpactSteps!==ce,ce=n.exhaustedImpactSteps,ue+=Math.max(0,n.discardedSimulationTime-le),le=n.discardedSimulationTime,p.observation.recordCounters({...a,discardedSimulationTime:n.discardedSimulationTime});let o=h[0];if(!y){for(let e of n.events)e.kind===`trail`&&ye.push([e.position[0],e.position[1]]);ye.length>1200&&ye.splice(0,ye.length-1200)}if(n.dropped)throw Error(`Physics event overflow: ${n.dropped}; reload to reset the table.`);let s=Math.hypot(o.velocity[0],o.velocity[1]),c=Math.hypot(o.velocity[0]-U*o.angularVelocity[1],o.velocity[1]+U*o.angularVelocity[0]);X(`cue-motion`).textContent=o.enabled?`Cue ball: ${s<.035?Math.hypot(...o.angularVelocity)>.15?`spinning`:`resting`:c>.03?`sliding`:`rolling`} · pace ${s.toFixed(1)} · sidespin ${Math.abs(o.angularVelocity[2]).toFixed(1)} rad/s`:``,se&&(X(`cue-motion`).textContent+=` · Impact budget reached; ${(ue*1e3).toFixed(2)} ms discarded. Try lower power.`),Iv.playEvents(n.events,e);let u=new Set(n.events.filter(e=>e.kind===`trigger`).map(e=>e.body));for(let e of h)!e.enabled&&!u.has(e.index)||!u.has(e.index)&&e.position[2]>-1&&Math.abs(e.position[0])<6.8&&Math.abs(e.position[1])<3.8||(Iv.playPocket(),l.setBodyEnabled(e.index,!1),e.enabled=!1,e.index===0?(y=!0,Cv.value=`Scratch — the cue ball returns when the shot settles.`):(ve.add(e.index),Cv.value=`Ball ${e.index} potted.`),P());if(e-S>300&&Lu(h)){if(b||=e,e-b>=350){if(!oe){oe=!0;try{await Oe(performance.now(),t)}finally{oe=!1}return}if(y){let e=Iu(h);if(!e){Cv.value=`No clear cue-ball position. Start a new rack.`,g=`complete`,P();return}l.teleportBody(0,e),l.setBodyEnabled(0,!0),h[0].position=e,h[0].enabled=!0,y=!1}ye.length=0,g=v>0&&ve.size===v?`complete`:`aiming`,Sv(Ev.value,ve.size,v)&&(de=performance.now()+1200),Cv.value=g===`complete`?`Table cleared in ${_} shots.${de?` New rack in a moment…`:` Nicely done.`}`:`Shot complete. Line up the next one.`,P()}}else b=0}function F(n){if(te)try{if(e)throw e;j!==null&&pe(xv(n-j,re)),de&&n>=de&&!wv.disabled&&(de=0,De());let r=Math.min((n-O)/1e3,.05);if(O=n,g===`striking`&&!wv.disabled&&n-x>=180){let e=Hu(h[0].position,C,w,Number($.value));Iv.playCue(e.speed/18),l.applyImpulse(0,e.impulse,e.point),g=`rolling`,_++,S=n,b=0,P(),Cv.value=`Balls in motion…`}if(g===`rolling`&&!oe){D=Math.min(D+r,12/240);let i=Math.floor(D*240);D-=i/240;let a=t.createCommandEncoder();for(let e=0;e<i;e++)e===0&&p.sampleStep(n)||p.observation.encode(a,{parameters:void 0});t.submit(a.finish()),!A&&n-k>=1e3/30&&(k=n,A=Oe(n,ee).catch(t=>{e=t instanceof Error?t:Error(String(t))}).finally(()=>{A=null}))}let i=we();p.update(n);let a=ye.map(e=>`${(e[0]/i[0]+1)*Z.clientWidth/2},${(1-e[1]/i[1])*Z.clientHeight/2}`);Nv.setAttribute(`points`,a.join(` `)),Pv.setAttribute(`points`,a.slice(-12).join(` `));let o=(g===`aiming`||g===`striking`)&&!wv.disabled,s,c=o&&g===`aiming`&&Mv&&h[0].enabled;if(Ov.style.display=c?``:`none`,c||(f.cancel(),Dv.hidden=!0),o){let e=h[0].position,t=[Math.cos(C),Math.sin(C)],r=.15+Number($.value)/100*.65,a=g===`striking`?Math.max(0,1-(n-x)/180)*r:r;if(s=[e[0]-t[0]*(.21+a),e[1]-t[1]*(.21+a)],c){let t=Number($.value),r=Hu(e,C,w,t),a=[C,...w,t,T,E].join(`,`),{paths:o,failed:s}=f.update(n,h,a,r);Dv.hidden=!s;let c=e=>`${(e[0]/i[0]+1)*Z.clientWidth/2},${(1-e[1]/i[1])*Z.clientHeight/2}`;kv.setAttribute(`points`,o[0].map(c).join(` `)),Av.setAttribute(`d`,o.slice(1).filter(e=>e.length>1).map(e=>`M`+e.map(c).join(` L`)).join(` `))}}m.draw(i,h,s,C,Fv.value,n,g===`rolling`),ne=requestAnimationFrame(F)}catch(e){Cv.value=`Pool stopped: ${String(e)}`,Q.disabled=!0}}Cv.value=`Ready for the break.`,P(),ne=requestAnimationFrame(F),window.addEventListener(`pagehide`,()=>{te=!1;let e=p.destroy();fe.abort(),me(),cancelAnimationFrame(ne),Promise.allSettled([A,e,f.destroy()]).then(()=>{Iv.destroy(),m.destroy(),d.destroy(),l.destroy(),r.destroy(),o.destroy(),s.destroy(),t.destroy()})},{once:!0})}catch(e){Cv.value=`Unable to start WebGPU pool: ${String(e)}`}