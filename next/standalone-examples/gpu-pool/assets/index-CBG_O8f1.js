const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./webgpu-device-CDwtVi08.js","./wgsl-interface-scan-BaCgnr12.js"])))=>i.map(i=>d[i]);
import{B as e,C as t,D as n,F as r,H as i,I as a,L as o,M as s,N as c,O as l,P as u,S as d,T as f,V as p,W as m,_ as h,a as g,b as _,c as v,d as y,g as b,h as x,i as S,j as C,k as w,l as T,m as ee,n as E,o as te,p as D,r as ne,s as re,t as ie,u as O,v as ae,w as oe,x as se,y as k,z as ce}from"./wgsl-interface-scan-BaCgnr12.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var le=`set luma.log.level=1 (or higher) to trace rendering`,ue="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",de=class t{static defaultProps={...p,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=e;log=i;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw i.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),i.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);i.error(`This version of luma.gl has already been initialized`)()}i.log(1,`${this.VERSION} - ${le}`)(),globalThis.luma=this}async createDevice(e={}){let n={...t.defaultProps,...e};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(ue);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n)}catch(e){throw n.debug&&fe(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(ue);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||i.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(e){Object.assign(t.defaultProps,e)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?i.warn(`WebGL1 is not supported`,e)():i.warn(`Unknown handle type`,e)(),null)}};function fe(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var pe=new de,me=class{get pageLoaded(){return ve()}},he=m()&&typeof document<`u`,ge=()=>he&&document.readyState===`complete`,_e=null;function ve(){return _e||=ge()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),_e}function ye(e,t={}){let n={...e},r=t.layout??`std140`,i={},a=0;for(let[e,t]of Object.entries(n))a=be(i,e,t,a,r);return a=c(a,M(n,r)),{layout:r,byteLength:a*4,uniformTypes:n,fields:i}}function A(e,t){let n=r(e),i=u(n),a=/^mat(\d)x(\d)<.+>$/.exec(n);if(a){let e=Number(a[1]),r=Number(a[2]),o=Se(r,n,i.type,t),s=Te(o.size,o.alignment,t);return{alignment:o.alignment,size:e*s,components:e*r,columns:e,rows:r,columnStride:s,shaderType:n,type:i.type}}let o=/^vec(\d)<.+>$/.exec(n);return o?Se(Number(o[1]),n,i.type,t):{alignment:1,size:1,components:1,columns:1,rows:1,columnStride:1,shaderType:n,type:i.type}}function j(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function be(e,t,n,r,i){if(typeof n==`string`){let a=A(n,i),o=c(r,a.alignment);return e[t]={offset:o,...a},o+a.size}if(Array.isArray(n)){if(Array.isArray(n[0]))throw Error(`Nested arrays are not supported for ${t}`);let a=n[0],o=n[1],s=Ce(a,i),l=c(r,M(n,i));for(let n=0;n<o;n++)be(e,`${t}[${n}]`,a,l+n*s,i);return l+s*o}if(j(n)){let a=M(n,i),o=c(r,a);for(let[r,a]of Object.entries(n))o=be(e,`${t}.${r}`,a,o,i);return c(o,a)}throw Error(`Unsupported CompositeShaderType for ${t}`)}function xe(e,t){if(typeof e==`string`)return A(e,t).size;if(Array.isArray(e)){let n=e[0],r=e[1];if(Array.isArray(n))throw Error(`Nested arrays are not supported`);return Ce(n,t)*r}let n=0;for(let r of Object.values(e)){let e=r;n=c(n,M(e,t)),n+=xe(e,t)}return c(n,M(e,t))}function M(e,t){if(typeof e==`string`)return A(e,t).alignment;if(Array.isArray(e)){let n=e[0],r=M(n,t);return Ee(t)?Math.max(r,4):r}let n=1;for(let r of Object.values(e)){let e=M(r,t);n=Math.max(n,e)}return De(t)?Math.max(n,4):n}function Se(e,t,n,r){return{alignment:e===2?2:4,size:e===3?3:e,components:e,columns:1,rows:e,columnStride:e===3?3:e,shaderType:t,type:n}}function Ce(e,t){return we(xe(e,t),M(e,t),t)}function we(e,t,n){return c(e,Ee(n)?4:t)}function Te(e,t,n){return n===`std140`?4:c(e,t)}function Ee(e){return e===`std140`||e===`wgsl-uniform`}function De(e){return e===`std140`||e===`wgsl-uniform`}var Oe=new WeakMap,N=class e{static defaultProps={...k.defaultProps};static getDefaultPipelineFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new e(t),n.defaultPipelineFactory}static beginAsyncCompilation(e){if(Oe.has(e))throw Error(`An asynchronous pipeline compilation scope is already active`);let t=[];return Oe.set(e,t),t}static getAsyncCompilation(e){return Oe.get(e)}static endAsyncCompilation(e,t){if(Oe.get(e)!==t)throw Error(`The asynchronous pipeline compilation scope is not active`);Oe.delete(e)}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_pendingRenderPipelineCache={};_pendingComputePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...k.defaultProps,...e},n=this._renderPipelineCache,r=this._hashRenderPipeline(t),a=n[r]?.resource;if(a)n[r].useCount++,this.device.props.debugFactories&&i.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;a=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:ce(`unnamed-cached`),_sharedRenderPipeline:e}),a.hash=r,n[r]={resource:a,useCount:1},this.device.props.debugFactories&&i.log(3,`${this}: ${a} created, count=${n[r].useCount}`)()}return a}async createRenderPipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createRenderPipelineAsync(e);let t={...k.defaultProps,...e},n=this._hashRenderPipeline(t);return await this._createPipelineAsync(this._renderPipelineCache,this._pendingRenderPipelineCache,n,()=>{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;return this.device.createRenderPipelineAsync({...t,id:t.id?`${t.id}-cached`:ce(`unnamed-cached`),_sharedRenderPipeline:e})})}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...ae.defaultProps,...e},n=this._computePipelineCache,r=this._hashComputePipeline(t),a=n[r]?.resource;return a?(n[r].useCount++,this.device.props.debugFactories&&i.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)()):(a=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),a.hash=r,n[r]={resource:a,useCount:1},this.device.props.debugFactories&&i.log(3,`${this}: ${a} created, count=${n[r].useCount}`)()),a}async createComputePipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createComputePipelineAsync(e);let t={...ae.defaultProps,...e},n=this._hashComputePipeline(t);return await this._createPipelineAsync(this._computePipelineCache,this._pendingComputePipelineCache,n,()=>this.device.createComputePipelineAsync({...t,id:t.id?`${t.id}-cached`:void 0}))}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&i.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(i.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&i.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}async _createPipelineAsync(e,t,n,r){let i=e[n];if(i)return i.useCount++,i.resource;let a=t[n];if(a)return a.useCount++,await a.promise;let o={promise:void 0,useCount:1};return o.promise=r().then(r=>{delete t[n];let i=e[n];return i?(i.useCount+=o.useCount,r.destroy(),r instanceof k&&this.releaseSharedRenderPipeline(r),i.resource):(r.hash=n,e[n]={resource:r,useCount:o.useCount},r)}).catch(e=>{throw delete t[n],e}),t[n]=o,await o.promise}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof k&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof ae&&(t=this._computePipelineCache),e instanceof k&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){return`${this._getHash(e.shader.source)}/${this._getHash(JSON.stringify([e.shaderLayout,e.entryPoint??`main`,e.constants]))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e._uniformBlockLayouts)),o=this._getHash(JSON.stringify(e.bufferLayout)),{type:s}=this.device;switch(s){case`webgl`:let c=this._getHash(JSON.stringify(e.parameters));return`${s}/R/${t}/${n}V${r}T${e.topology}P${c}SL${i}UBL${a}BL${o}`;default:let l=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),u=this._getHash(JSON.stringify(e.parameters)),d=this._getWebGPUAttachmentHash(e);return`${s}/R/${t}/${n}V${r}T${e.topology}EP${l}P${u}SL${i}BL${o}A${d}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=e.depthStencilAttachmentFormat??(e.parameters?.depthWriteEnabled?this.device.preferredDepthFormat:null);return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}},ke=class e{static defaultProps={..._.defaultProps};static getDefaultShaderFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new e(t),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&i.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let r=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:r,useCount:1},this.device.props.debugFactories&&i.log(3,`${this}: Created new shader ${r.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&i.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&i.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}},Ae;function je(e){return(!Ae||Ae.byteLength<e)&&(Ae=new ArrayBuffer(e)),Ae}function Me(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Ne(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:Me(e)}var Pe=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=je(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let a=n[0],o=n[1];if(Array.isArray(a))throw Error(`Nested arrays are not supported for ${t}`);if(typeof a==`string`&&Ne(r)){this._flattenPackedArray(e,t,a,o,r);return}if(!Array.isArray(r)){i.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,o);n++){let i=r[n];i!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,a,i)}return}if(j(n)&&Fe(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}i.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=A(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=Ie(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){i.warn(`Uniform ${t} not found in layout`)();return}let{type:a,components:o,columns:s,rows:c,offset:l,columnStride:u}=r,d=e[a];if(o===1){d[l]=Number(n);return}let f=n;if(s===1){for(let e=0;e<o;e++)d[l+e]=Number(f[e]??0);return}let p=0;for(let e=0;e<s;e++){let t=l+e*u;for(let e=0;e<c;e++)d[t+e]=Number(f[p++]??0)}}};function Fe(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Ie(e,t,n){return Array.prototype.slice.call(e,t,n)}var Le=128;function Re(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!Ne(r)||!Ne(i)||r.length!==i.length)return!1;let a=Math.min(n,Le);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function ze(e){return Ne(e)?e.slice():e}var Be=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return Re(this.uniforms[e],t)?!1:(this.uniforms[e]=ze(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},Ve=1024,He=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=ye(r.uniformTypes??{},{layout:r.layout??Ue(e)}),a=new Pe(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new Be({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,Ve)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let n=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:o.UNIFORM|o.COPY_DST,byteLength:n}),i=this.getUniformBufferData(e);return r.write(i),r}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),n=this.device.createBuffer({usage:o.UNIFORM|o.COPY_DST,byteLength:t});this.uniformBuffers.set(e,n)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&i.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),a=!1;if(r&&n?.needsRedraw){a||=n.needsRedraw;let o=this.getUniformBufferData(e);if(r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,o):r.write(o)),i.level>=4){let t=this.uniformBlocks.get(e)?.getAllUniforms();i.log(4,`Writing to uniform buffer ${String(e)}`,o,t)()}}return a}};function Ue(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function We(e,t){let n={},r=x(e,t,{warnOnMissingBufferLayout:!0});for(let t of r){let r=Ge(e,t);n[t.attributeName]=r}return n}function Ge(e,t){let n=Ke(e,t.attributeName),r=a.getAttributeShaderTypeInfo(n.type),i=t.vertexFormat,o=C.getVertexFormatInfo(i);return{attributeName:t.attributeName,bufferName:t.bufferName,location:n.location,shaderType:n.type,primitiveType:r.primitiveType,shaderComponents:r.components,vertexFormat:i,bufferDataType:o.type,bufferComponents:o.components,normalized:o.normalized,integer:r.integer,stepMode:t.stepMode,byteOffset:t.byteOffset,byteStride:t.byteStride}}function Ke(e,t){let n=e.attributes.find(e=>e.name===t);return n||i.warn(`shader layout attribute "${t}" not present in shader`)(),n||null}var qe=`modulepreload`,Je=function(e,t){return new URL(e,t).href},Ye={},Xe=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=Je(t,n),t in Ye)return;Ye[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:qe,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Ze=`core-features-and-limits`,Qe=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function $e(e){let t={};for(let n of Qe){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function et(e){return e.featureLevel??`core`}function tt(e){let t=et(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function nt(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(Ze)&&r.push(Ze);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function rt(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(Ze)?`core`:e===`best-available`?`compatibility`:e}function it(e,t){return e===`core`?`core`:rt(`compatibility`,t)}var at=new class extends me{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let n=et(e),r=tt(e),a;try{a=await this.requestGPUAdapter(r)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!a)throw Error(`Failed to request WebGPU adapter`);let o=await ot(a),s={},c=nt(a.features,n,e.optionalFeatures);c.length>0&&(s.requiredFeatures=c);let l={...n===`max`?$e(a.limits):{},...e.requiredLimits};Object.keys(l).length>0&&(s.requiredLimits=l);let u;try{u=await a.requestDevice(s)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await st(u);if(d){if(u.destroy(),t&&d.reason!==`destroyed`)return i.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}let{WebGPUDevice:f}=await Xe(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-CDwtVi08.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url),p=rt(n,u.features),m={...e,featureLevel:p};i.groupCollapsed(1,`WebGPUDevice created`)();try{let e;try{e=new f(m,u,a,o)}catch(e){throw u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e})}let t=f.getCanvasContextProps(m);if(t)try{e.initializeCanvasContext(t)}catch(t){throw e.destroy(),Error(`WebGPU canvas initialization failed`,{cause:t})}return i.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),i.table(1,e.info)(),e}finally{i.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await Xe(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-CDwtVi08.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url);if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await st(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=it(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function ot(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return i.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function st(e){return await Promise.race([e.lost,Promise.resolve(null)])}function ct(e,t){if(!e){let e=Error(t||`shaders: assertion failed.`);throw Error.captureStackTrace?.(e,ct),e}}var lt={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function ut(e){let t={};for(let[n,r]of Object.entries(e))t[n]=dt(r);return t}function dt(e){let t=ft(e);if(t!==`object`)return{value:e,...lt[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=ft(e.value),{...e,...lt[t],type:t}):{...e,...lt[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function ft(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}function pt(e){e.map(e=>mt(e))}function mt(e){if(e.instance)return;pt(e.dependencies||[]);let{propTypes:t={},deprecations:n=[]}=e,r={parsedDeprecations:gt(n),normalizedInjections:{vertex:{},fragment:{}}};t&&(r.propValidators=ut(t)),e.instance=r;let i={};t&&(i=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...i}}function ht(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function gt(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function _t(e){let t=new Set,n=new Set,r=[],i=new Map;function a(e){let t=i.get(e.name);if(t&&t!==e)throw Error(`Shader module name collision: Multiple different module objects share the name "${e.name}". Each module object must have a unique name.`);i.set(e.name,e)}function o(e,i){if(n.has(e)){let t=[...i,e.name].join(` -> `);throw Error(`Shader module dependency cycle detected: ${t}`)}if(t.has(e))return;a(e),n.add(e);let s=[...i,e.name];if(e.dependencies)for(let t of e.dependencies)o(t,s);n.delete(e),t.add(e),r.push(e)}for(let t of e)o(t,[]);let s=new Set;for(let e of r)e.implements!==void 0&&(ct(!s.has(e.implements)),s.add(e.implements));return pt(r),r}var vt=class{_shaderTranspilers=new Map;_injectionTargets=[];_defaultModules=[];addShaderTranspiler(e){this._shaderTranspilers.set(e.sourceLanguage,e)}removeShaderTranspiler(e){this._shaderTranspilers.delete(e)}_transpileShader(e,t,n,r){let i=e.sourceLanguage||this.shaderLanguage;if(i===this.shaderLanguage)return ct(!_t(t).some(e=>e.sourceLanguage&&e.sourceLanguage!==this.shaderLanguage)),{code:n||``,modules:t};let a=this._shaderTranspilers.get(i);ct(a);let o=_t(t);ct(!o.some(e=>e.sourceLanguage&&e.sourceLanguage!==i&&e.sourceLanguage!==this.shaderLanguage));let s=o.filter(e=>e.sourceLanguage===i).map(e=>e.source||``).join(`
`),c={vertex:e.vertexEntryPoint,fragment:e.fragmentEntryPoint,compute:e.computeEntryPoint},l=n==null?{code:``}:a.transpile({source:[s,n].filter(Boolean).join(`
`),target:this.shaderLanguage,stage:r,entryPoints:c,platformInfo:e.platformInfo}),u=o.map(e=>({...e,dependencies:void 0,...e.sourceLanguage===i?{source:void 0,vs:void 0,fs:void 0}:{}}));return{...l,modules:u}}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderInjectionTarget(e){this._injectionTargets.push(e)}resetShaderInjectionTargets(){this._injectionTargets.length=0}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,pt(t),t}},yt=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${ne}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${ne}\\s*:\\s*([^;]+);`,`g`)];function bt(e,t=[]){let n=T(e),r=new Map;for(let e of t)r.set(St(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of yt){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===yt[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(St(l,s,o));i.push(xt({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function xt(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:Tt(e.resourceType),viewDimension:Ct(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:Ct(e.resourceType),sampleType:wt(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function St(e,t,n){return`${t}:${n}:${e}`}function Ct(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function wt(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function Tt(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}function Et(e,t=``){let n=new Map,r=Object.values(e).flatMap(e=>Object.entries(e).map(([e,t])=>`${e.slice(3)}\n${t.signature}\n${t.header||``}\n${t.footer||``}`)),i=new Set(T(`${t}\n${r.join(`
`)}`).match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let t of Object.keys(e.vertex)){let r=t.slice(3);e.fragment[`fs:${r}`]&&n.set(r,{vertex:Ot(`_luma_vertex_target_${r}`,i),fragment:Ot(`_luma_fragment_target_${r}`,i)})}return n}function Dt(e,t,n=Et(t)){if(!n.size)return e;let r=T(e),i=new Map,a=/((?:@\w+(?:\([^)]*\))?\s*)*)\bfn\s+([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu;for(let e=a.exec(r);e;e=a.exec(r)){let t=r.indexOf(`{`,a.lastIndex),n=t+1,o=1;for(;n<r.length&&o;n++)r[n]===`{`&&o++,r[n]===`}`&&o--;ct(t>=0&&o===0);let s=e[2],c=e.index+e[0].lastIndexOf(s),l=Array.from(r.slice(t+1,n-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu),e=>e[1]);i.set(s,{name:s,start:e.index,end:n,nameStart:c,bodyStart:t,calls:l,stages:new Set,entryStage:/@vertex\b/.test(e[1])?`vertex`:/@fragment\b/.test(e[1])?`fragment`:void 0}),a.lastIndex=n}function o(e,t){let r=i.get(e);if(!(!r||r.stages.has(t))){r.stages.add(t);for(let e of r.calls)o(n.get(e)?.[t]||e,t)}}for(let e of i.values())e.entryStage&&o(e.name,e.entryStage);for(let e of[`vertex`,`fragment`])for(let r of Object.keys(t[e])){let t=r.slice(3);o(n.get(t)?.[e]||t,e)}let s=new Set,c=!0;for(;c;){c=!1;for(let e of i.values())!s.has(e.name)&&e.calls.some(e=>n.has(e)||s.has(e))&&(s.add(e.name),c=!0)}let l=new Map,u=new Set(r.match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let e of s)i.get(e)?.stages.size===2&&l.set(e,{vertex:Ot(`_luma_vertex_helper_${e}`,u),fragment:Ot(`_luma_fragment_helper_${e}`,u)});function d(e,t){return n.get(e)?.[t]||l.get(e)?.[t]||e}for(let t of[...i.values()].reverse()){if(!s.has(t.name))continue;if(!t.stages.size)throw Error(`Cannot infer WGSL target stage in ${t.name}`);let n=[],i=t.start;for(let a of t.stages){let o=e.slice(i,t.end),s=[...r.slice(t.bodyStart+1,t.end-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu)];for(let e of s.reverse()){let n=t.bodyStart+1+e.index-i,r=d(e[1],a);o=o.slice(0,n)+r+o.slice(n+e[1].length)}let c=t.nameStart-i;o=o.slice(0,c)+d(t.name,a)+o.slice(c+t.name.length),n.push(o)}e=e.slice(0,i)+n.join(`
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
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(cn),o=e.match(pn)||e.match(ln),s=e.match(un),c=e.match(dn),l=e.match(mn)||e.match(fn);if(n){let e=gn(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function gn(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=`(?:[A-Za-z_][A-Za-z0-9_]*|[+-]?\\d+(?:\\.\\d+)?)`,i=n.match(RegExp(`^(${r})\\s*(==|!=|<=|>=|<|>)\\s*(${r})$`));if(i){let e=e=>/^[A-Za-z_]/.test(e)?Number(t[e]??0):Number(e),n=e(i[1]),r=e(i[3]);switch(i[2]){case`==`:return n===r;case`!=`:return n!==r;case`<=`:return n<=r;case`>=`:return n>=r;case`<`:return n<r;case`>`:return n>r}}let a=n.match(RegExp(`^!\\s*${sn}$`));if(a)return!t[a[1]];let o=n.match(RegExp(`^${sn}$`));if(o)return!!t[o[1]];let s=n.match(RegExp(`^defined\\s*\\(\\s*${sn}\\s*\\)$`));if(s)return t[s[1]]!==void 0;let c=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${sn}\\s*\\)$`));if(c)return t[c[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function _n(e,t){let n=[];for(let[r,i]of Object.entries(t))bn(e,r),n.push(`in ${yn(i)} ${r};`);return n.join(`
`)}function vn(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=xn(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Sn(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||Dn(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=On(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function yn(e){let{primitiveType:t,components:n}=a.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function bn(e,t){let n=jn(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function xn(e,t){let n=RegExp(`\\bfn\\s+${jn(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=kn(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Sn(e,t){let n=Cn(t),r=new Set(wn(t)),i=Tn(t);for(let t of i){let i=En(e,t);if(i!==null){n.push(...Cn(i));for(let e of wn(i))r.add(e)}}return{locations:n,names:r}}function Cn(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function wn(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Tn(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function En(e,t){let n=RegExp(`\\bstruct\\s+${jn(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=kn(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function Dn(e,t){let n=jn(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(An(e,i.index)===0)return!0;i=r.exec(e)}return!1}function On(e){let t=0;for(;e.has(t);)t++;return t}function kn(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function An(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function jn(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Mn(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){Qn(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${yn(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Xn(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function Nn(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=Pn(a,t,`vertex`),s=Fn(a,o),c=Pn(a,n,`fragment`),l=In(a,c),u=Ln(a,s),d=l?Ln(a,l.type):null,f=new Set([...qn(o.parameters),...qn(u.body),...qn(c.parameters),...qn(d?.body||``)]),p=new Set([...Kn(u.body),...Kn(d?.body||``),...Kn(c.parameters)]),m=[],h=[],g=[],_=[],v=[];for(let[e,t]of i){if(f.has(e)||Jn(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=Yn(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;if(m.push(`  @location(${n})${r} ${e}: ${t.type},`),g.push(`var<private> ${e}: ${t.type};`),_.push(`${e} = ${Zn(t.type)};`),l)v.push(`${e} = ${l.name}.${e};`);else{let i=`_luma_${e}`;if(f.has(i))throw Error(`ShaderPlugin varying "${e}" conflicts with a generated fragment parameter`);h.push(`@location(${n})${r} ${i}: ${t.type}`),v.push(`${e} = ${i};`)}}zn(a,s,o.openBrace,o.closeBrace),a=Bn(a,s,o,i.map(([e])=>e)),o=Pn(a,t,`vertex`),a=Vn(a,o,i.map(([e])=>e));let y=(!l||s===l.type?[s]:[s,l.type]).map(e=>Ln(a,e).closeBrace).sort((e,t)=>t-e);for(let e of y)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=Pn(a,n,`fragment`),h.length){let e=c.parameters,t=T(e).trimEnd();if(t.trim()&&!t.endsWith(`,`)){let n=t.length;e=`${e.slice(0,n)},${e.slice(n)}`}a=a.slice(0,c.openParenthesis+1)+e+`
  `+h.join(`,
  `)+`
`+a.slice(c.closeParenthesis)}return{source:a,declarations:g.join(`
`),vertexInitialization:_.join(`
`),fragmentInitialization:v.join(`
`)}}function Pn(e,t,n){let r=RegExp(`\\bfn\\s+${tr(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin interStageVariables require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=$n(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=$n(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function Fn(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||Rn(e,r[1])===null)throw Error(`ShaderPlugin interStageVariables require the WGSL vertex entry point to return a named struct`);return r[1]}function In(e,t){let n=[];for(let r of Gn(T(t.parameters),`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&Rn(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length>1)throw Error(`ShaderPlugin interStageVariables require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]||null}function Ln(e,t){let n=Rn(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function Rn(e,t){let n=RegExp(`\\bstruct\\s+${tr(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=$n(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function zn(e,t,n,r){let i=RegExp(`\\b${tr(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function Bn(e,t,n,r){let i=RegExp(`\\b${tr(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=$n(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function Vn(e,t,n){let r=Hn(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function Hn(e,t,n){let r=[],i=t;for(;i<n;)if(i=Wn(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=Un(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function Un(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=Wn(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function Wn(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function Gn(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function Kn(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function qn(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Jn(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${tr(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(er(e,r.index)===0)return!0;r=n.exec(e)}return!1}function Yn(e){let t=0;for(;e.has(t);)t++;return t}function Xn(e){let{primitiveType:t,components:n}=a.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${yn(e)}(${r})`}function Zn(e){let{primitiveType:t,components:n}=a.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function Qn(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${tr(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function $n(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function er(e,t){let n=0;for(let r=0;r<t;r++){let i=Wn(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function tr(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function nr(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i],o=a.returnType||`void`,s=n===`wgsl`?`fn`:o,c=n===`wgsl`&&o!==`void`?` -> ${o}`:``;if(r+=`${s} ${a.signature}${c} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function rr(e,t=[],n=`glsl`){let r={vertex:{},fragment:{}};for(let t of e){let e=t[n];if(e){let n=t.stage===`vertex`?`vs`:`fs`;r[t.stage][`${n}:${t.name}`]={...e,signature:`${t.name}(${e.parameters})`}}}for(let e of t){let t=rr([e],[],n);for(let e of[`vertex`,`fragment`])for(let[n,i]of Object.entries(t[e])){let t=r[e][n];if(t&&(t.signature!==i.signature||(t.returnType||`void`)!==(i.returnType||`void`)))throw Error(`Conflicting ShaderPlugin injection target ${n}`);r[e][n]=t||i}}return r}function ir(e,t){return!!(t.startsWith(`vs:`)?e.vertex:e.fragment)[t]}function ar(e,t,n){let r=n===`vertex`?`vs:`:n===`fragment`?`fs:`:null;for(let n in t)if(!(r&&!n.startsWith(r))&&!ir(e,n)){let e=[...new Set(t[n].map(e=>e.pluginName).filter(Boolean))];throw Error(`Unknown shader injection target ${n}${e.length?` (plugins: ${e.join(`, `)})`:``}`)}}function or(e){let t=_t(e.modules||[]),{source:n,bindingAssignments:r}=sr(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:rn(t),bindingAssignments:r}}function sr(e,t){let{source:n,stage:r,modules:i,defines:a={},injectionTargets:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginInterStageVariables:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;ct(typeof n==`string`,`shader source must be a string`);let m=vn(hn(n,{defines:a}),d,l),h=Nn(m.source,d,f,u),g=h.source,_=``,v=rr(o,t.pluginInjectionTargets,`wgsl`),y={},b={},x={};an(c,y,b,x),an(Array.isArray(s)?Pt(s,`wgsl`):{},y,b,x);let S=Array.isArray(s)?{}:s;for(let e in S){let t=typeof S[e]==`string`?{injection:S[e],order:0}:S[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[...b[e]||[],t]:x[e]=[...x[e]||[],t]:y[e]=[...y[e]||[],t]}else x[e]=[...x[e]||[],t]}cr(m.declarations,m.initialization,b,x),lr(h,b,x),ar(v,y);let C=i.map(e=>({module:e,source:hn(on(e,`wgsl`,p),{defines:a})})),w=pr(g),T=fr(w.source),ee=_r(C,t._bindingRegistry,T),E=[],te=C.map(({module:e,source:n})=>{let r=mr(n,e,{usedBindingsByGroup:T,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:ee});return E.push(...r.bindingAssignments),{module:e,source:r.source}});for(let{module:e,source:t}of te)p&&ht(e,g,p),_+=t;_+=nn,_=Ft(_,r,ur(b),!1,`wgsl`,{vertex:d,fragment:f});let D=Et(v,[_,w.source,...Object.values(y).flat().map(e=>e.injection),...Object.values(x).flat().map(e=>e.injection)].join(`
`));return _+=dr(v,y,D),_+=Tr(E),_+=w.source,_=Ft(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),_=Dt(_,v,D),wr(_),{source:_,bindingAssignments:E}}function cr(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function lr(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function ur(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function dr(e,t,n=Et(e)){return[`vertex`,`fragment`].map(r=>nr(Object.fromEntries(Object.entries(e[r]).map(([e,t])=>{let i=e.slice(3),a=n.get(i)?.[r]||i;return[e,{...t,signature:a+t.signature.slice(i.length)}]})),t,`wgsl`)).join(``)}function fr(e){let t=new Map;for(let n of re(e,g)){let e=Number(n.bindingToken),r=Number(n.groupToken);yr(r,e,n.name),xr(t,r,e,`application binding "${n.name}"`)}return t}function pr(e){let t=re(e,S),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);yr(r,t,e.name),xr(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=O(e,S,e=>gr(e,n,r));if(v(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function mr(e,t,n){let r=[],i={sawSupportedBindingDeclaration:re(e,E).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=O(e,E,e=>hr(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(v(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function hr(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=Er(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?Sr(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return br(n.name,u,s,l),t!==void 0&&vr(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(xr(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);br(n.name,u,d,l);let f=Er(u,n.name,l);return vr(r.reservedBindingKeysByGroup,u,d,f)||xr(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function gr(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=Cr(s,t);return yr(s,e,o),xr(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function _r(e,t,n){let r=new Map,i=[];function a(e,t,i,a){xr(n,e,t,a);let o=r.get(e)||new Map;o.set(t,i),r.set(e,o)}for(let{module:t,source:n}of e)for(let e of re(n,E)){let n=Number(e.groupToken);if(e.bindingToken===`auto`){i.push({module:t,name:e.name,group:n});continue}let r=Number(e.bindingToken);br(t.name,n,r,e.name),a(n,r,Er(n,t.name,e.name),`module "${t.name}" binding "${e.name}"`)}for(let{module:e,name:n,group:r}of i){let i=Er(r,e.name,n),o=t?.get(i);o!==void 0&&a(r,o,i,`registered module binding "${i}"`)}return r}function vr(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return i.delete(n),!0}function yr(e,t,n){if(e===0&&t>=100)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function br(e,t,n,r){if(t===0&&n<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function xr(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function Sr(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?100:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function Cr(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function wr(e){let t=te(e,E);if(!t)return;let n=Dr(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):Or(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${kr(t.match)}".`)}function Tr(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function Er(e,t,n){return`${e}:${t}:${n}`}function Dr(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function Or(e,t){let n=e.indexOf(nn);return n>=0?t>n:!0}function kr(e){return e.replace(/\s+/g,` `).trim()}var Ar=class e extends vt{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=[...this._injectionTargets,...t.injectionTargets||[]],i=this._transpileShader(t,n,t.source,t.shaderStage??(t.computeEntryPoint?`compute`:void 0)),a={vertex:i.entryPoints?.vertex??t.vertexEntryPoint,fragment:i.entryPoints?.fragment??t.fragmentEntryPoint,compute:i.entryPoints?.compute??t.computeEntryPoint},o=e.getShaderPreprocessorDefines(t,n),s=t.platformInfo.shaderLanguage===`wgsl`&&i.code?hn(i.code,{defines:o}):i.code,{source:c,getUniforms:l,bindingAssignments:u}=or({...t,source:s,vertexEntryPoint:a.vertex,fragmentEntryPoint:a.fragment,defines:o,_bindingRegistry:this._wgslBindingRegistry,modules:i.modules,injectionTargets:r}),d=t.platformInfo.shaderLanguage===`wgsl`?hn(c,{defines:o}):c;return{source:d,entryPoints:a,getUniforms:l,modules:n,bindingAssignments:u,bindingTable:bt(d,u),shaderLayout:ie(d,{vertexEntryPoint:a.vertex,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}},jr=/^vertex-list<([^<>]+)>$/,Mr=/^value-list<([^<>]+)>$/,Nr=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function Pr(e){return jr.test(e)}function Fr(e){return Mr.test(e)}function Ir(e){let t=jr.exec(e),n=Mr.exec(e),r=Rr(e)?.elementFormat??t?.[1]??n?.[1]??e;try{C.getVertexFormatInfo(r)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return r}function Lr(e){let t=Ir(e),n=Pr(e),r=Fr(e),i=Rr(e),a=C.getVertexFormatInfo(t),o=a.byteLength*(i?.listSize??1);if(!Number.isSafeInteger(o))throw Error(`Unsupported GPUVector format ${e}`);let s=a.type,c=a.normalized,l=zr(s,c);return{format:e,elementFormat:t,vertexList:n,valueList:r,fixedSizeList:!!i,...i?{listSize:i.listSize}:{},type:s,signedDataType:Br(t,s),primitiveType:l,components:a.components,elementByteLength:a.byteLength,byteLength:o,integer:a.integer,signed:a.signed,normalized:c,...a.webglOnly?{webglOnly:!0}:{}}}function Rr(e){let t=Nr.exec(e);if(!t)return;let n=Number(t[2]);if(!Number.isSafeInteger(n))return;let r=t[1];try{let e=C.getVertexFormatInfo(r);if(!Number.isSafeInteger(n*e.components)||!Number.isSafeInteger(n*e.byteLength))return}catch{return}return{elementFormat:r,listSize:n}}function zr(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function Br(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function Vr(e){let t=0;return Object.freeze(e.map(e=>{let n=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,n}))}async function Hr(e,n){if(e.destroyed)throw Error(`Resource has been destroyed.`);if(e instanceof o){if(!(e.usage&o.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);let t=n.byteOffset??0,r=Math.min(256,n.byteLength??e.byteLength-t);if(t<0||r<0||t+r>e.byteLength)throw Error(`Preview range is outside the buffer.`);return{data:r?await e.readAsync(t,r):new Uint8Array,format:n.format}}let r=e.device.getTextureFormatInfo(e.format);if(r.packed)throw Error(`Packed texture previews are not supported.`);if(e.device.type!==`webgpu`)throw Error(`Texture previews require WebGPU.`);if(!((e.props.usage??0)&t.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);if(e.samples!==1||r.compressed||e.format.startsWith(`depth`)||e.format.startsWith(`stencil`))throw Error(`Preview requires a single-sample, uncompressed color texture.`);let i=n.baseMipLevel??0,a=Math.min(32,n.width??Math.max(1,e.width>>i)),s=Math.min(32,n.height??Math.max(1,e.height>>i)),c=e.computeMemoryLayout({width:a,height:s,depthOrArrayLayers:1}),l=e.device.createBuffer({byteLength:c.byteLength,usage:o.MAP_READ|o.COPY_DST}),u=e.device.createCommandEncoder();try{u.copyTextureToBuffer({sourceTexture:e,destinationBuffer:l,mipLevel:i,origin:[0,0,n.baseArrayLayer??0],width:a,height:s,depthOrArrayLayers:1,bytesPerRow:c.bytesPerRow}),e.device.submit(u.finish());let t=await l.readAsync(),o=a*r.bytesPerPixel,d=new Uint8Array(o*s);for(let e=0;e<s;e++)d.set(t.subarray(e*c.bytesPerRow,e*c.bytesPerRow+o),e*o);return{data:d,width:a,height:s,format:e.format}}finally{l.destroy(),u.destroy()}}var Ur=o.DEBUG_DATA_MAX_LENGTH,P=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:n=!1,buffer:r,ownsBuffer:i=!0,...a}=t;if(r&&r.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(r&&(a.byteLength!==void 0||a.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let s=t.id||r?.id||ce(`dynamic-buffer`),c={...a,id:s,usage:a.usage??r?.usage,indexType:a.indexType??r?.indexType};(c.usage||0)&o.INDEX&&!c.indexType&&(a.data instanceof Uint32Array?c.indexType=`uint32`:a.data instanceof Uint16Array?c.indexType=`uint16`:a.data instanceof Uint8Array&&(c.indexType=`uint8`)),delete c.data,delete c.byteOffset,this.device=e,this.id=s,this.props=c,this.usage=c.usage||0,this._debugDataEnabled=!!n,this._maxDebugDataByteLength=typeof n==`object`&&n.maxByteLength!==void 0?n.maxByteLength:Ur,this._ownsBuffer=i,this._buffer=r??this.device.createBuffer({...a,id:s}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),a.data&&this._writeDebugData(a.data,a.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}};function Wr(e){return typeof e==`object`&&!!e&&`buffer`in e}function Gr(e){return e instanceof P?e.buffer:e}function Kr(e){return{buffer:Gr(e.buffer),offset:e.offset,size:e.size}}var qr={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function Jr(e){return e?Array.isArray(e)?e[0]??null:e:null}function Yr(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=Jr(n);if(!e)return null;let{width:t}=Xr(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=Jr(n);return e?Xr(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=Jr(n[0]);return e?Xr(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=Jr(t);return r?Xr(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=Jr(e[t]);return r?Xr(r):null}default:return null}}function Xr(e){if(l(e))return n(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function Zr(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function Qr(e){return ArrayBuffer.isView(e)}function $r(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function ei(e){let t=qr[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function ti(e,t){return 6*e+ei(t)}function ni(e){throw Error(`setTexture1DData not supported in WebGL.`)}function ri(e){return Array.isArray(e)?e:[e]}function ii(e,t,n,r){let i=ri(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(l(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(Zr(t))o.push({type:`texture-data`,data:t,textureFormat:$r(t),z:a,mipLevel:e});else if(Qr(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function ai(e){let t=[];for(let n=0;n<e.length;n++)t.push(...ii(n,e[n]));return t}function oi(e){let t=[];for(let n=0;n<e.length;n++)t.push(...ii(n,e[n]));return t}function si(e){let t=[];for(let[n,r]of Object.entries(e)){let e=ei(n);t.push(...ii(e,r))}return t}function ci(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=ti(n,r);t.push(...ii(e,i))}}),t}var li=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=ce(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let n=await this._loadAllData(e);this._checkNotDestroyed();let r=n.data?ui({...n,width:e.width,height:e.height,format:e.format}):[],a=`format`in e&&e.format!==void 0,o=`usage`in e&&e.usage!==void 0,s=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:Yr(n)||{width:this.props.width||1,height:this.props.height||1};if(!s||s.width<=0||s.height<=0)throw Error(`${this} size could not be determined or was zero`);let c=di(this.device,r,s,{format:a?e.format:void 0}),l=c.format??this.props.format,u={...this.props,...s,format:l,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(l)&&!o&&(u.usage=t.SAMPLE|t.COPY_DST);let d=this.props.mipmaps&&!c.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(l);if(this.device.type===`webgpu`&&d){let e=this.props.dimension===`3d`?t.SAMPLE|t.STORAGE|t.COPY_DST|t.COPY_SRC:t.SAMPLE|t.RENDER|t.COPY_DST|t.COPY_SRC;u.usage|=e}let f=this.device.getMipLevelCount(u.width,u.height),p=c.hasExplicitMipChain?c.mipLevels:this.props.mipLevels===`auto`?f:Math.max(1,Math.min(f,this.props.mipLevels??1)),m={...u,mipLevels:p};this._texture=this.device.createTexture(m),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),c.subresources.length&&this._setTextureSubresources(c.subresources),this.props.mipmaps&&!c.hasExplicitMipChain&&!d&&i.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),d&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),i.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):i.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof oe?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:o.COPY_DST|o.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let s=this.device.createFence();return await s.signaled,s.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),i.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=qr[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=ni(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=ii(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=ai(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=oi(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=si(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=ci(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await hi(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&i.warn(`${this} already destroyed`)}_checkReady(){this.isReady||i.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...t.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function ui(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return ni(e.data);case`2d`:return ii(0,e.data,t,n);case`3d`:return ai(e.data);case`2d-array`:return oi(e.data);case`cube`:return si(e.data);case`cube-array`:return ci(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function di(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=pi(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=fi(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?mi(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=pi(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=fi(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function fi(e){if(e.type===`texture-data`)return e.textureFormat??$r(e.data)}function pi(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function mi(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function hi(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(hi));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(hi)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}function gi(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function _i(e){return e?.type===`texture`||e?.type===`external-texture`}function vi(e,t,n){let r=b(e,t,{ignoreWarnings:!0});return _i(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var yi=class{values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function bi(e){let t=Fi(e.nodes),n=Bi(t,e.buffers.values()),r=Vi(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return Si(e,t,o,i,a,n,r)}async function xi(e){let t=Fi(e.nodes),n=Bi(t,e.buffers.values()),r=Vi(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=N.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));N.endAsyncCompilation(e.device,o);let[c,l]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),u=[],d=l.find(e=>e.status===`rejected`),f=d?.status===`rejected`?d.reason:void 0;for(let e of c)e.status===`fulfilled`?u.push(e.value):f??=e.reason;if(f){for(let e of u)e.executable.destroy?.();throw f}return Si(e,t,u,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function Si(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=qi(c.map(e=>e.byteLength),`imported buffer capacities`),d=qi(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=Ki(u,d,`logical buffer capacities`),p=qi(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=qi(g.map(Gi),`imported texture estimates`),y=qi(_.map(Gi),`logical transient texture estimates`),b=Ki(v,y,`logical texture estimates`),x=qi(o.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:Ki(f,b,`logical resource estimates`),physicalTransientResourceBytes:Ki(p,x,`physical transient resource estimates`)},w=wi(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:C,preflight:w}}function Ci(e){if(`buffer`in e){let t=e.buffer,n=`buffer`in t?t:void 0;return Object.freeze({id:n?n.buffer.id:t.id,kind:`buffer`,usage:e.usage,byteOffset:n?.byteOffset??0,byteLength:n?n.length===0?0:(n.length-1)*n.byteStride+n.rowByteLength:t.byteLength,...n?{format:n.format,length:n.length}:{}})}let t=`texture`in e?e.texture:e.externalTexture;return Object.freeze({id:`texture`in t?t.texture.id:t.id,kind:`externalTexture`in e?`external-texture`:`texture`,usage:e.usage,width:t.width,height:t.height,...`texture`in t?{baseMipLevel:t.baseMipLevel,baseArrayLayer:t.baseArrayLayer,mipLevelCount:t.mipLevelCount,arrayLayerCount:t.arrayLayerCount,aspect:t.aspect}:{},...`format`in t?{format:t.format,depth:t.depth}:{}})}function wi(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,...e.description===void 0?{}:{description:e.description},type:e.type,resources:Object.freeze((e.resources??[]).map(Ci)),...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])Ei(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,ki(n.buffer).size));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?Ki(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function F(e){return`buffer`in e?e.buffer:e}function Ti(e){return`texture`in e?e.texture:e}function Ei(e){return`buffer`in e}function Di(e){return`texture`in e}function Oi(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>Ei(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||F(r.buffer)!==F(n.buffer)||!Mi(r.usage)&&!Mi(n.usage))continue;let a=ki(r.buffer),o=ki(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=F(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${Ai(a)} and ${Ai(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function ki(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function Ai(e){return`${e.offset}–${e.offset+e.size} bytes`}function ji(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function Mi(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function Ni(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function Pi(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function Fi(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(Ei(t)){let n=F(t.buffer);if(ji(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(Mi(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(Di(t)){let n=Ti(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&Ii(n.resource,t)&&(Ni(t.usage)&&Pi(n.resource.usage)||Pi(t.usage)&&(Ni(n.resource.usage)||Pi(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function Ii(e,t){if(Ti(e.texture)!==Ti(t.texture))return!1;let n=Li(e.texture),r=Li(t.texture);return Ri(n.aspect,r.aspect)&&zi(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&zi(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function Li(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function Ri(e,t){return e===`all`||t===`all`||e===t}function zi(e,t,n,r){return e<n+r&&n<e+t}function Bi(e,t){let n=Hi(e,e=>Ei(e)?F(e.buffer):null),r=new Map;e.forEach((e,t)=>{if(!e.retainedBuffers?.length)return;let n=r.get(e.retainedBuffers);n?n.lastUse=t:r.set(e.retainedBuffers,{firstUse:t,lastUse:t})});for(let[e,t]of r)for(let r of e){if(!r.transient)continue;let e=n.get(r);n.set(r,{firstUse:Math.min(e?.firstUse??t.firstUse,t.firstUse),lastUse:Math.max(e?.lastUse??t.lastUse,t.lastUse)})}let i=[],a=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),s=new yi((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),c=new Map,l=e=>{let t=e&(o.MAP_READ|o.MAP_WRITE),n=c.get(t);return n||(n=new yi((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index),c.set(t,n)),n};for(let{buffer:e,lifetime:t}of a){if(!t)continue;for(;s.peek()&&s.peek().allocation.lastUse<t.firstUse;){let e=s.pop();l(e.allocation.usage).push(e)}let n=l(e.usage).pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:i.length},i.push(n.allocation));let{allocation:r}=n;r.byteLength=Math.max(r.byteLength,e.byteLength),r.usage|=e.usage,r.lastUse=t.lastUse,r.handles.push(e),s.push(n)}return i}function Vi(e,t){let n=Hi(e,e=>Di(e)?Ti(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&Wi(n.descriptor,e));n||(n={descriptor:Ui(e),byteLength:Gi(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function Hi(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function Ui(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function Wi(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function Gi(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=Ki(t,w.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function Ki(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function qi(e,t){return e.reduce((e,n)=>Ki(e,n,t),0)}var Ji=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},Yi=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},Xi=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=Vr(this.data)}},Zi=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},Qi=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},$i=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}};function ea(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function ta(e,t){for(let n of t)ea(e,n)}function na(e){return{...e,type:`compute`}}var ra=4,ia=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){ua(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function aa(e,t,n={}){ua(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=oa();for(;s<a.length;){let r=sa(n,a[s]);if(s>e&&ca(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||la(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:ca(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>sa(e,t),oa());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function oa(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function sa(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function ca(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function la(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function ua(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function da(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var fa=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i,a){this.readResource=a,this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let o=e.filter(e=>e.stats.condition?.outcome!==`skipped`),s=o.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:o.length,skippedNodeCount:e.length-o.length,computePassCount:n,coalescedComputeNodeCount:s-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},pa=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);Sa(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),wa(e,this.device),t&&ka(t,e,this.device);let n=this.addBuffer(new Ji(this,e,!1,t));if(t){let e=ha(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof P&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),wa(e,this.device),this.addBuffer(new Ji(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=Lr(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return Oa(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new Yi(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(Pr(n)||Fr(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=Lr(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new Xi({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=Ea(e,this.device);return t&&Aa(t,n,this.device),this.addTexture(new Zi(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=Ea(e,this.device);return this.addTexture(new Zi(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),Ta(e,this.device),this.addExternalTexture(new Qi(this,e))}createTransientTexture(e){this.assertMutable();let t=Ea(e,this.device);return this.addTexture(new Zi(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new $i(e,Da(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)ta(this,e.getCommandNodes(this));else if(`type`in e)ea(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),Sa(this.device,`compilation`),this.compiled=!0,new ma(bi({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}async compileAsync(){return this.assertMutable(),Sa(this.device,`compilation`),this.compiled=!0,new ma(await xi({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*ra>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>Ei(e)&&F(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(Ei(t)){let e=F(t.buffer);this.assertBuffer(e),Ma(e,t.usage)}else if(Di(t)){let e=Ti(t.texture);this.assertTexture(e),Na(e,t.usage),Pa(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}Oi(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=ha(t.buffer),r={byteLength:ga(t),usage:n.usage},i=t.buffer instanceof P?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof P?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&_a(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&_a(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&ha(n.defaultBuffer)===e&&_a(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&_a(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&_a(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},ma=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(Ei(t)){let e=F(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(Di(t)){let e=Ti(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=xa(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return aa(this.preflight,e,t)}createExecution(e,t={}){return new ia({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(Sa(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=Ca(),a=this.resolveImportedBuffers(t.buffers??{});ya(t.frameTextures??{},t.externalTextures??{});let s=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),c=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of s.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of c.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of c.textures.values())this.consumedExternalTextures.add(e);let l=s.textures,u=e=>{let t=F(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},d=e=>{let t=Ti(e),n=t.transient?this.transientTextures.get(t):l.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},f=e=>{let t=d(e);if(e instanceof Zi||La(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},p={commandEncoder:e,parameters:t.parameters,getBuffer:u,getTexture:d,getTextureView:f,getExternalTexture:e=>{let t=c.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},m=[],h,g=0,_=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,v=()=>{let e=h;h=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=Ca();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){let e=Ca();m.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{h||(h=e.beginComputePass({id:n.id}),g++);let t=h;o=ba(t,e),o&&(_=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?da(t,u(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...p,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}_||v();break}case`render`:{v();let t=r,i=t.getRenderPassProps?.(p)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,f):void 0,s=n.attachments?.resolveTargets?.map(e=>e?f(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=ba(c,e),c.pushDebugGroup(n.id);try{t.encode({...p,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:v(),r.encode(p);break}let s=Ca();m.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{v()}let y=Ca();return new fa(m,y-i,g,i,y,async(e,t)=>{if(this.destroyed)throw Error(`Graph has been destroyed.`);let n=this.compiledNodes.findIndex(({node:t})=>t.id===e),r=this.compiledNodes[n]?.node.resources?.[t],i=this.preflight.nodes[n]?.resources?.[t];if(!r||!i)throw Error(`Resource is unavailable.`);if(`externalTexture`in r)throw Error(`External images cannot be read back.`);let a=`buffer`in r?F(r.buffer):Ti(r.texture);if(`frameScoped`in a&&a.frameScoped)throw Error(`Frame textures expire after presentation.`);let s=`buffer`in r?u(r.buffer):d(r.texture),c=s instanceof o?this.transientBuffers:this.transientTextures;if(a.transient&&[...c].some(([e,t])=>e!==a&&t===s))throw Error(`Transient allocation is reused; logical contents are no longer available.`);return Hr(s,i)})}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);ka(a,i,this.device);let o=ha(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);Aa(e.texture,a,this.device),n.set(a,va(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);Aa(o,a,this.device),n.set(a,va(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);ja(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function ha(e){return e instanceof P?e.buffer:e}function ga(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function _a(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function va(e){if(e instanceof li){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function ya(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function ba(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function xa(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function Sa(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function Ca(){return globalThis.performance?.now()??Date.now()}function wa(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function Ta(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function Ea(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,n===`3d`?r:1))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function Da(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function Oa(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function ka(e,t,n){let r=ha(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function Aa(e,t,n){let r=va(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function ja(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function Ma(e,t){let n=Fa(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function Na(e,t){let n=Ia(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function Pa(e,t){if(e instanceof $i&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function Fa(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return o.STORAGE;case`uniform`:return o.UNIFORM;case`copy-source`:return o.COPY_SRC;case`copy-destination`:return o.COPY_DST;case`indirect`:return o.INDIRECT;case`vertex`:return o.VERTEX;case`index`:return o.INDEX}}function Ia(e){switch(e){case`sampled`:return t.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return t.STORAGE;case`render-attachment`:return t.RENDER;case`copy-source`:return t.COPY_SRC;case`copy-destination`:return t.COPY_DST}}function La(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var Ra=Uint32Array.BYTES_PER_ELEMENT,za=256;function Ba(e,t,n){let r=Lr(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%Ra!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function Va(e,t){Ba(e,[`uint32`],t)}function I(e,t){let n=Ha(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function Ha(e){let t=Math.floor(e.byteOffset/za)*za,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function L(e){if(e.byteOffset%Ra!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%za/Ra}function Ua(e,t){if(e.buffer!==t.buffer||e.length===0||t.length===0)return!1;let n=e.byteOffset+(e.length-1)*e.byteStride+e.rowByteLength,r=t.byteOffset+(t.length-1)*t.byteStride+t.rowByteLength;return e.byteOffset<r&&t.byteOffset<n}function R(e,t,n,r,i=o.STORAGE){if(!Number.isSafeInteger(r)||r<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((i&o.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(Pr(n)||Fr(n))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let a=Lr(n),s=e.createTransientBuffer({id:t,byteLength:Math.max(r,1)*a.byteLength,usage:i});return e.createDataView(s,{format:n,length:r})}var Wa=class e{static async createAsync(t,n){let r=!N.getAsyncCompilation(t),i=r?N.beginAsyncCompilation(t):N.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&N.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if(e.type!==`webgpu`)throw Error(`Kernel is only supported in WebGPU`);let{source:n,pipelineFactory:r,shaderFactory:i,debugShaders:a,...o}=t;this.device=e,this.id=t.id??`kernel`,this.source=n,this.pipelineFactory=r??N.getDefaultPipelineFactory(e),this.shaderFactory=i??ke.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:`compute`,source:this.source,debugShaders:a});let s={...o,shader:this.shader},c=N.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(s);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(s)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}};function Ga(e){return e instanceof Xi?e.data:[e]}function Ka(e,t){let n=t[0]?.length??0;if(t.some(e=>e.length!==n))throw Error(`Aligned vectors must have equal logical lengths`);let r=t.map(Ga),i=t.map(()=>0),a=t.map(()=>0),o=[],s=0;for(;s<n;){for(let e=0;e<r.length;e++)for(;r[e][i[e]]?.length===a[e];)i[e]++,a[e]=0;let t=r.map((e,t)=>e[i[t]]),n=Math.min(...t.map((e,t)=>e.length-a[t])),c=[];for(let r=0;r<t.length;r++){let i=t[r],o=t.findIndex((e,t)=>t<r&&e===i&&a[t]===a[r]);c.push(o>=0?c[o]:a[r]===0&&n===i.length?i:e.createDataView(i.buffer,{format:i.format,length:n,byteOffset:i.byteOffset+a[r]*i.byteStride,byteStride:i.byteStride,rowByteLength:i.rowByteLength}))}o.push(c);for(let e=0;e<a.length;e++)a[e]+=n;s+=n}return o}var qa=120,Ja=class{maxSamples;getNodeGroup;graphs=new Map;encodingGraphs=new WeakMap;constructor(e={}){let t=e.maxSamples??qa;if(!Number.isSafeInteger(t)||t<=0)throw Error(`GPUCommandGraphInspector maxSamples must be a positive safe integer`);this.maxSamples=t,this.getNodeGroup=e.getNodeGroup}registerGraph(e){this.graphs.set(e.id,{id:e.id,stats:Ya(e.stats),capabilities:Object.freeze({...e.capabilities}),...e.preflight?{preflight:Xa(e.preflight)}:{},encodingCount:0,timingReadFailureCount:0,cpuSamples:[],gpuSamples:[],counters:new Map,nodes:new Map});let t=this.getGraph(e.id);for(let n of e.preflight?.nodes??[])this.getNode(t,n)}observeGraph(e){this.registerGraph(e);let t=this.getGraph(e.id),n=new WeakMap,r=!0,i=()=>r&&this.graphs.get(e.id)===t;return Object.freeze({graph:e,encode:(n,r)=>{let a=e.encode(n,r);return i()&&this.recordGraphEncoding(t,a),a},recordGPUTimings:async r=>{let a=n.get(r);if(a)return await a;if(i()&&this.encodingGraphs.get(r)===t){let i=this.recordGraphGPUTimings(e.id,t,r);return n.set(r,i),await i}},recordCounters:e=>{i()&&this.recordGraphCounters(t,e)},detach:()=>{r&&(r=!1,this.graphs.get(e.id)===t&&this.graphs.delete(e.id))}})}clear(){this.graphs.clear()}recordEncoding(e,t){let n=this.getGraph(e);this.recordGraphEncoding(n,t)}async readResource(e,t,n){let r=this.getGraph(e);if(!r.encoding?.readResource)throw Error(`No live resource readback is available.`);let i=await r.encoding.readResource(t,n);if(this.graphs.get(e)!==r)throw Error(`Graph registration changed during readback.`);return i}recordCounters(e,t){this.recordGraphCounters(this.getGraph(e),t)}recordGraphEncoding(e,t){e.encoding=t,this.encodingGraphs.set(t,e);let{stats:n}=t;e.encodingCount++,this.addSample(e.cpuSamples,n.cpuEncodeTimeMilliseconds);for(let t of n.nodes){let n=this.getNode(e,t);this.addSample(n.cpuSamples,t.cpuEncodeTimeMilliseconds)}}recordGraphCounters(e,t){let n=Object.entries(t);for(let[e,t]of n)if(!e||!Number.isFinite(t)||t<0)throw Error(`GPUCommandGraphInspector counters require an ID and a finite, non-negative value`);for(let[t,r]of n){let n=e.counters.get(t);n||(n=[],e.counters.set(t,n)),this.addSample(n,r)}}async recordGPUTimings(e,t){let n=this.encodingGraphs.get(t)??this.getGraph(e);return await this.recordGraphGPUTimings(e,n,t)}async recordGraphGPUTimings(e,t,n){if(this.graphs.get(e)!==t)return;let r;try{r=await n.readTimings()}catch{this.graphs.get(e)===t&&t.timingReadFailureCount++;return}if(this.graphs.get(e)===t){r.gpuTimeMilliseconds!==void 0&&this.addSample(t.gpuSamples,r.gpuTimeMilliseconds);for(let e of r.nodes)if(e.gpuTimeMilliseconds!==void 0){let n=this.getNode(t,e);this.addSample(n.gpuSamples,e.gpuTimeMilliseconds)}return r}}getSnapshot(){let e=Array.from(this.graphs.values(),e=>this.getGraphSnapshot(e));return Object.freeze({graphs:Object.freeze(e)})}getGraph(e){let t=this.graphs.get(e);if(!t)throw Error(`GPUCommandGraphInspector graph "${e}" is not registered`);return t}getNode(e,t){let n=e.nodes.get(t.id);if(n)return t.description!==void 0&&(n.description=t.description),t.resources!==void 0&&(n.resources=eo(t.resources)),n;let r=eo(t.resources),i=this.getNodeGroup?.({graphId:e.id,id:t.id,type:t.type,description:t.description,resources:r}),a={id:t.id,resources:r,...t.description===void 0?{}:{description:t.description},type:t.type,...i===void 0?{}:{group:i},cpuSamples:[],gpuSamples:[]};return e.nodes.set(a.id,a),a}addSample(e,t){e.push(t),e.length>this.maxSamples&&e.splice(0,e.length-this.maxSamples)}getGraphSnapshot(e){let t=[],n=new Set;for(let r of e.stats.nodeOrder){let i=e.nodes.get(r);i&&(t.push(i),n.add(r))}for(let r of e.nodes.values())n.has(r.id)||t.push(r);let r=t.map(e=>Object.freeze({id:e.id,resources:e.resources,...e.description===void 0?{}:{description:e.description},type:e.type,...e.group===void 0?{}:{group:e.group},cpu:Za(e.cpuSamples),gpu:Za(e.gpuSamples)})),i=Array.from(e.counters,([e,t])=>Qa(e,t));return Object.freeze({id:e.id,stats:e.stats,capabilities:e.capabilities,...e.preflight?{preflight:e.preflight}:{},encodingCount:e.encodingCount,timingReadFailureCount:e.timingReadFailureCount,totals:Object.freeze({cpu:Za(e.cpuSamples),gpu:Za(e.gpuSamples)}),counters:Object.freeze(i),nodes:Object.freeze(r)})}};function Ya(e){return Object.freeze({...e,nodeOrder:Object.freeze([...e.nodeOrder])})}function Xa(e){return Object.freeze({...e,nodes:Object.freeze(e.nodes.map(e=>Object.freeze({...e,resources:eo(e.resources)})))})}function Za(e){if(e.length===0)return Object.freeze({sampleCount:0});let t=[...e].sort((e,t)=>e-t);return Object.freeze({sampleCount:e.length,latestMilliseconds:e[e.length-1],p50Milliseconds:$a(t,.5),p95Milliseconds:$a(t,.95)})}function Qa(e,t){let n=[...t].sort((e,t)=>e-t);return Object.freeze({id:e,sampleCount:t.length,latestValue:t[t.length-1],p50Value:$a(n,.5),p95Value:$a(n,.95)})}function $a(e,t){return e[Math.ceil(t*e.length)-1]}function eo(e){return e&&Object.freeze(e.map(e=>Object.freeze({...e})))}var to=4294967295,no=4294967296;function ro(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>to)throw Error(`${e} element count must be a non-negative uint32`);ao(e,n);let i=Math.floor(r);if(!Number.isSafeInteger(i)||i<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let a=Math.max(1,Math.ceil(t/n)),o=Math.min(a,i),s=Math.min(Math.ceil(a/o),i),c=Math.ceil(a/o/s);if(c>i)throw Error(`${e} requires ${a} workgroups, exceeding the 3D dispatch limit of ${i} per dimension`);return{x:o,y:s,z:c}}function io(e,t){ao(`GPU dispatch`,t);let n=Math.floor(to/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function ao(e,t){if(!Number.isSafeInteger(t)||t<2||t>to||no%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function oo(e,t){let[n,r,i]=t;for(let[e,t]of[[`x`,n],[`y`,r],[`z`,i]])if(!Number.isSafeInteger(t)||t<0)throw Error(`compute dispatch ${e} workgroup count must be a non-negative safe integer`);return{...e,dispatchWorkgroups:Object.freeze([n,r,i])}}function so(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var z=256,co=64;function lo(e,t=!1){return t?`portable`:so(e,{requiresSubgroupId:!0})}var uo=class{id;input;output;mode;segmentFlags;constructor(e){if(this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,_o(this.input,`${this.id} input`),_o(this.output,`${this.id} output`),this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.output instanceof Xi&&this.output.length!==this.input.length)throw Error(`${this.id} vector output length must equal input length`);if(this.segmentFlags){if(_o(this.segmentFlags,`${this.id} segmentFlags`),this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);if(this.segmentFlags instanceof Xi&&this.segmentFlags.length!==this.input.length)throw Error(`${this.id} vector segmentFlags length must equal input length`);let e=new Set(vo(this.output).map(e=>e.buffer));if(vo(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}getCommandNodes(e){let t=[];return t.push(...fo(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function fo(e,t,n){let r=[];yo(t,e.input,e.id),yo(t,e.output,e.id),e.segmentFlags&&yo(t,e.segmentFlags,e.id);let i=po(t,e.output,e.input.length),a=e.segmentFlags?po(t,e.segmentFlags,e.input.length):void 0,o=a?Ka(t,[e.input,i,a]):Ka(t,[e.input,i]);return r.push(...mo(t,{id:e.id,inputChunks:o.map(e=>e[0]),outputChunks:o.map(e=>e[1]),segmentFlagChunks:a?o.map(e=>e[2]):void 0,isVector:o.length>1,mode:e.mode},n)),r}function po(e,t,n){return t.length===n||t instanceof Xi?t:e.createDataView(t.buffer,{format:t.format,length:n,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}function mo(e,t,n){let r=[],i=t.inputChunks,a=t.outputChunks,o=t.segmentFlagChunks,s=i.map((e,t)=>({chunkIndex:t,input:e,output:a[t],segmentFlags:o?.[t]})).filter(e=>e.input.length>0);if(s.length===0)return r;if(s.length===1){let i=s[0];return r.push(...ho(e,{id:t.isVector?`${t.id}-chunk-${i.chunkIndex}`:t.id,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,maxComputeWorkgroupsPerDimension:n})),r}let c=R(e,`${t.id}-chunk-totals`,`uint32`,s.length),l=R(e,`${t.id}-chunk-offsets`,`uint32`,s.length),u=o?R(e,`${t.id}-chunk-segment-flags`,`uint32`,s.length):void 0,d=o?s.map(n=>R(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[i,a]of s.entries())r.push(...ho(e,{id:`${t.id}-chunk-${a.chunkIndex}`,input:a.input,output:a.output,mode:t.mode,segmentFlags:a.segmentFlags,outputSegmentPrefixes:d?.[i],finalSum:go(e,c,i),finalSegmentFlag:u?go(e,u,i):void 0,maxComputeWorkgroupsPerDimension:n}));r.push(...ho(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n}));for(let[i,a]of s.entries())r.push(...Co(e,{id:`${t.id}-chunk-${a.chunkIndex}-add-carry`,output:a.output,offsets:l,length:a.output.length,offsetIndex:i,segmentPrefixes:d?.[i],dispatchLayout:wo(a.output.length,n)}));return r}function ho(e,t){let n=[];if(t.input.length===0)return n;let r=[],i=t.input,a=t.output,o=t.segmentFlags,s=t.input.length,c=0;for(;;){let l=Math.ceil(s/z),u,d;l>1&&(u=R(e,`${t.id}-level-${c}-block-sums`,`uint32`,l),o&&(d=R(e,`${t.id}-level-${c}-block-segment-flags`,`uint32`,l)));let f=o?c===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:l>1||c>0?R(e,`${t.id}-level-${c}-segment-prefixes`,`uint32`,s):void 0:void 0;if(n.push(...bo(e,{id:`${t.id}-level-${c}-scan`,input:i,output:a,mode:c===0?t.mode:`exclusive`,segmentFlags:o,segmentSummaryInput:!!o&&(c>0||t.segmentSummaryInput),segmentPrefixes:f,blockSums:u,blockSegmentFlags:d,finalSum:u?void 0:t.finalSum,finalSegmentFlag:u?void 0:t.finalSegmentFlag,length:s,blockCount:l,dispatchLayout:wo(s,t.maxComputeWorkgroupsPerDimension)})),r.push({output:a,length:s,segmentPrefixes:f}),!u)break;let p=R(e,`${t.id}-level-${c}-block-offsets`,`uint32`,l);r[r.length-1].blockOffsets=p,i=u,a=p,o=d,s=l,c++}for(let i=r.length-2;i>=0;i--){let a=r[i],o=r[i+1];n.push(...Co(e,{id:`${t.id}-level-${i}-add-offsets`,output:a.output,offsets:a.blockOffsets,length:a.length,segmentPrefixes:a.segmentPrefixes,offsetSegmentPrefixes:o.segmentPrefixes,dispatchLayout:wo(a.length,t.maxComputeWorkgroupsPerDimension)}))}return n}function go(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function _o(e,t){let n=e instanceof Xi?e.data:[e];for(let e of n)Va(e,t)}function vo(e){return e instanceof Xi?e.data:[e]}function yo(e,t,n){if((t instanceof Xi?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function bo(e,t){let n=[],r=t.blockSums??t.finalSum,i=t.blockSegmentFlags??t.finalSegmentFlag,a=r?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,o=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,s=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,c=i?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,l=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,u=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,d=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,f=t.segmentFlags?`if (lane >= stride) {
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
  ${To(t.dispatchLayout)}
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
}`,_=xo(e,!!t.segmentFlags,t.length),v=_===`subgroups`?So(t,r,a):g;return n.push(na({id:t.id,workload:{operation:`GPUScan`,variant:_,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*z,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...r?[{buffer:r,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...i?[{buffer:i,usage:`storage-write`}]:[]],compile:({device:e})=>{let n=new Wa(e,{id:t.id,source:v,shaderLayout:{bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...r?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...i?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]}});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:I(t.input,a),outputValues:I(t.output,a)};r&&(o.sumValues=I(r,a)),t.segmentFlags&&(o.segmentFlags=I(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=I(t.segmentPrefixes,a)),i&&(o.summarySegmentFlags=I(i,a)),n.dispatch(e,{bindings:o,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>oo(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function xo(e,t,n){let r=lo(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||lo(e.device,!1)===`subgroups`}]}).variant}function So(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/z)+1;return`
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
var<workgroup> subgroupOffsets: array<u32, ${co}>;

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
}`}function Co(e,t){let n=[],r=t.offsetIndex===void 0?`index / ${z}u`:`${t.offsetIndex}u`,i=`
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
  ${To(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${r}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${r}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`;return n.push(na({id:t.id,workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*z,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new Wa(e,{id:t.id,source:i,shaderLayout:{bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]}});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:I(t.output,r),offsets:I(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=I(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=I(t.offsetSegmentPrefixes,r)),n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>oo(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function wo(e,t){return ro(`GPUScan`,e,z,t)}function To(e){return io(e,z)}function Eo(e,t){let n=[...Object.entries(t.inputs??{}),...Object.entries(t.outputs)];for(let[,t]of n)if(Ha(t).size>e.device.limits.maxStorageBufferBindingSize)throw Error(`Active chunks must fit a storage binding`);let r=t.dispatch.x*t.dispatch.y*t.dispatch.z;return oo(na({id:t.id,workload:{commandCount:1,maximumWorkgroupCount:r,maximumInvocationCount:r*(t.workgroupSize??256)},resources:[...Object.values(t.inputs??{}).map(e=>({buffer:e,usage:`storage-read`})),...Object.values(t.outputs).map(e=>({buffer:e,usage:`storage-read-write`}))],compile:({device:e})=>{let r=new Wa(e,{id:t.id,source:t.source,shaderLayout:{bindings:n.map(([e],n)=>({name:e,group:0,location:n,type:n<Object.keys(t.inputs??{}).length?`read-only-storage`:`storage`}))}});return{encode:({computePass:e,getBuffer:i})=>{let a={};for(let[e,t]of n)a[e]=I(t,i);r.dispatch(e,{bindings:a,x:t.dispatch.x,y:t.dispatch.y,z:t.dispatch.z})},destroy:()=>r.destroy()}}}),[t.dispatch.x,t.dispatch.y,t.dispatch.z])}function Do(e,t,n){let r=[],i=Ka(e,[t.keys,t.values]),a=Ka(e,[t.outputKeys,t.outputValues]),o=i.map(([i,a],o)=>{let s=`${t.id}-span-${o}`,c=R(e,`${s}-keys`,`uint32`,i.length),l=R(e,`${s}-values`,`uint32`,i.length),u=R(e,`${s}-ranks`,`uint32`,i.length);return r.push(...Io(new Fo({id:s,keys:i,values:a,outputKeys:c,outputValues:l,algorithm:t.resolvedAlgorithm,direction:t.direction,keyBits:t.keyBits}),e,n)),{keys:c,values:l,ranks:u}}),s=t.resolvedAlgorithm===`radix`&&t.keyBits<32?2**t.keyBits-1:4294967295,c=t.direction===`ascending`?`<`:`>`;for(let[i,l]of o.entries()){let u=ro(`GPUSort merge`,l.keys.length,256,n),d=io(u,256);r.push(Eo(e,{id:`${t.id}-ranks-${i}`,outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index < ${l.keys.length}u) { ranks[index] = index; }
}`}));for(let[n,a]of o.entries())n!==i&&r.push(Eo(e,{id:`${t.id}-rank-${i}-against-${n}`,inputs:{keys:l.keys,otherKeys:a.keys},outputs:{ranks:l.ranks},dispatch:u,source:`
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
}`}));let f=0;for(let[n,[o,s]]of a.entries())r.push(Eo(e,{id:`${t.id}-publish-${i}-${n}`,inputs:{keys:l.keys,values:l.values,ranks:l.ranks},outputs:{outputKeys:o,outputValues:s},dispatch:u,source:`
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
}`})),f+=o.length}return r}var Oo=256,ko=256,Ao=4,jo=ko/32,Mo=4294967295,No=2147483648,Po=Oo,Fo=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])for(let n of Ga(t))Va(n,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>No)throw Error(`${this.id} supports at most ${No} rows`);Ro(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=Po?`bitonic`:`radix`:this.algorithm}getCommandNodes(e){let t=[];return t.push(...Io(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function Io(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])for(let r of Ga(n))if(r.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);return[e.keys,e.values,e.outputKeys,e.outputValues].some(e=>e instanceof Xi)?Do(t,e,n):Lo(e,t,n)}function Lo(e,t,n){let r=[];if(e.keys.length===0)return r;if(e.keys.length===1)return r.push(...zo(t,e)),r;let i=ro(`GPUSort`,e.keys.length,ko,n);return e.resolvedAlgorithm===`bitonic`?r.push(...Bo(t,e,i,n)):r.push(...qo(t,e,i,n)),r}function Ro(e){let t=Ga(e.outputKeys),n=Ga(e.outputValues),r=[...Ga(e.keys),...Ga(e.values)];if([...t,...n].some(e=>r.some(t=>t.buffer===e.buffer))||t.some(e=>n.some(t=>e.buffer===t.buffer)))throw Error(`${e.id} outputs must use separate buffers from inputs and each other`);for(let r of[t,n])for(let[t,n]of r.entries())if(r.slice(0,t).some(e=>Ua(e,n)))throw Error(`${e.id} output chunks must not overlap`)}function zo(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=[],s=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${L(n)}u;
const VALUES_OFFSET: u32 = ${L(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${L(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${L(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${ko}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${io(a,ko)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;return o.push(...Qo(e,{id:`${t.id}-${i}`,source:s,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})),o}function Bo(e,t,n,r){let i=[],a=Xo(t.keys.length);if(a<=Oo)return i.push(...Vo(e,t,a)),i;let o=ro(`GPUSort bitonic`,a,Oo,r),s=R(e,`${t.id}-bitonic-indices-a`,`uint32`,a),c=R(e,`${t.id}-bitonic-indices-b`,`uint32`,a);i.push(...Wo(e,t,s,a,o));let l=s,u=c;for(let n of Zo(a))i.push(...Go(e,t,l,u,a,n,o)),[l,u]=[u,l];return i.push(...Ko(e,t,l,n)),i}function Vo(e,t,n){let r=[],i=t.direction===`descending`,a=so(e.device,{requiresSubgroupId:!0})===`subgroups`,o=`
${a?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${Mo}u;
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
${a?Uo():Ho()}
}`;return r.push(...Qo(e,{id:`${t.id}-bitonic-local`,source:o,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})),r}function Ho(){return`
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
  }`}function Uo(){return`
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
  }`}function Wo(e,t,n,r,i){let a=[],o=`
const INVALID_INDEX: u32 = ${Mo}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${L(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${Oo}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${io(i,Oo)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;return a.push(...Qo(e,{id:`${t.id}-bitonic-initialize`,source:o,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})),a}function Go(e,t,n,r,i,a,o){let s=[],c=t.direction===`descending`,l=`
const INVALID_INDEX: u32 = ${Mo}u;
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

@compute @workgroup_size(${Oo}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${io(o,Oo)}
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
}`;return s.push(...Qo(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})),s}function Ko(e,t,n,r){let i=[],a=`
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

@compute @workgroup_size(${Oo}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${io(r,Oo)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;return i.push(...Qo(e,{id:`${t.id}-bitonic-gather`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})),i}function qo(e,t,n,r){let i=[],a=Math.ceil(t.keyBits/Ao),o=Math.ceil(t.keys.length/ko),s=a>1?R(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,c=a>1?R(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,l=t.keys,u=t.values;for(let d=0;d<a;d++){let f=d*Ao,p=Math.min(Ao,t.keyBits-f),m=2**p,h=R(e,`${t.id}-radix-digit-${f}-histogram`,`uint32`,m*o),g=R(e,`${t.id}-radix-digit-${f}-offsets`,`uint32`,m*o),_=(a-d)%2==1,v=_?t.outputKeys:s,y=_?t.outputValues:c;if(!v||!y)throw Error(`${t.id} radix scratch is missing`);i.push(...Jo(e,t,l,h,f,p,o,n));let b=new uo({id:`${t.id}-radix-digit-${f}-scan`,input:h,output:g});i.push(...fo(b,e,r)),i.push(...Yo(e,t,l,u,g,v,y,f,p,o,n)),l=v,u=y}return i}function Jo(e,t,n,r,i,a,o,s){let c=[],l=2**a,u=t.direction===`descending`,d=`
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

@compute @workgroup_size(${ko}) fn main(
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

  let index = workgroupIndex * ${ko}u + localInvocationIndex;
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
}`;return c.push(...Qo(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:d,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})),c}function Yo(e,t,n,r,i,a,o,s,c,l,u){let d=[],f=2**c,p=t.direction===`descending`,m=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${f-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${jo}u;
const MASK_COUNT: u32 = ${f*jo}u;
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
var<workgroup> digitMasks: array<atomic<u32>, ${f*jo}>;

@compute @workgroup_size(${ko}) fn main(
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

  let index = workgroupIndex * ${ko}u + localInvocationIndex;
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
}`;return d.push(...Qo(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:m,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})),d}function Xo(e){let t=1;for(;t<e;)t*=2;return t}function Zo(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function Qo(e,t){let n=[];return n.push(na({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new Wa(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=I(n,r);n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n}function $o(e,t){let{bindings:n={},...r}=t;return{kernel:new Wa(e,r),bindings:{...n}}}async function es(e,t){let{bindings:n={},...r}=t;return{kernel:await Wa.createAsync(e,r),bindings:{...n}}}function ts(e,t,n,r,i=0){return`
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
`}var ns=`
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
`,rs=`
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
`;function is(e,t){return`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> sortedKeys: array<u32>;
@group(0) @binding(4) var<storage, read> sortedBodies: array<u32>;
@group(0) @binding(5) var<storage, read_write> counts: array<u32>;
@group(0) @binding(6) var<storage, read> offsets: array<u32>;
@group(0) @binding(7) var<storage, read_write> contacts: array<vec2u>;
@group(0) @binding(8) var<storage, read_write> diagnostics: array<atomic<u32>>;
fn lowerBound(key: u32) -> u32 {
  var first = 0u; var last = BODY_COUNT;
  while (first < last) {
    let middle = first + (last - first) / 2u;
    if (sortedKeys[middle] < key) { first = middle + 1u; } else { last = middle; }
  }
  return first;
}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  var contactCount = 0u;
  var candidateCount = 0u;
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
  ${e===`count`?`counts[index] = min(contactCount, MAXIMUM_CONTACTS);
    if (contactCount > MAXIMUM_CONTACTS) {
      var current = atomicLoad(&diagnostics[0]);
      loop {
        let next = current + min(contactCount - MAXIMUM_CONTACTS, 0xffffffffu - current);
        let result = atomicCompareExchangeWeak(&diagnostics[0], current, next);
        if (result.exchanged) {break;} current = result.old_value;
      }
    }
    var currentCandidates = atomicLoad(&diagnostics[5]);
    loop {
      let next = currentCandidates + min(candidateCount, 0xffffffffu - currentCandidates);
      let result = atomicCompareExchangeWeak(&diagnostics[5], currentCandidates, next);
      if (result.exchanged) {break;} currentCandidates = result.old_value;
    }
    atomicMax(&diagnostics[6], contactCount);
    if(MAXIMUM_CANDIDATES > 0u && candidateCount >= MAXIMUM_CANDIDATES) {atomicAdd(&diagnostics[7], 2u);}`:`atomicAdd(&diagnostics[2], min(contactCount, MAXIMUM_CONTACTS));`}
}
`}var as=`
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
`,os=`
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
`,ss=`
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
`,cs=`
struct PersistentContact {
 identity: vec2u, impulse: f32, step: u32,
 tangent: vec4f, normal: vec4f,
};
`;function ls(e,t){for(let[n,r]of t)f(e.indexOf(n)>=0&&e.indexOf(n)===e.lastIndexOf(n)),e=e.replace(n,r);return e}function us(e,t=!1){let n=ls(e,[[`array<vec2u>`,`array<PersistentContact>`]]).replaceAll(`contact.x`,`contact.identity.x`).replaceAll(`contact.y`,`contact.identity.y`);return t&&(n=ls(n,[[`= vec2u(other, bitcast<u32>(bounce));`,`= PersistentContact(vec2u(other, bitcast<u32>(bounce)), 0.0, 0u, vec4f(0.0), vec4f(0.0));`]])),cs+n}var ds=`
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
`,fs=`
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
`;function ps(e){return ls(us(e),[[`var<storage, read> contacts:`,`var<storage, read_write> contacts:`],[`if (distance > sphere.w + neighbor.w) { continue; }`,`if (distance > sphere.w + neighbor.w && contact.impulse == 0.0 && all(contact.tangent.xyz == vec3f(0.0))) { continue; }`],[`if (signedHeight > -sphere.w && floorDistance <= sphere.w) {`,`if ((signedHeight > -sphere.w && floorDistance <= sphere.w) || contacts[BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex].impulse > 0.0) {`],[`let normalImpulse = max((bitcast<f32>(contact.identity.y) - dot(relative, normal)) / inverseMass, 0.0);`,`
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
        contacts[planeSlot].step = clock.step;`]])}var ms=`
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
`;function hs(){return`
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
`}function gs(e,t){return`
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
`}function _s(e,t=0){let n=(e.length-4)/8,r=e[0],i=r-t>>>0,a=Math.min(i,n),o=new Float32Array(e.buffer,e.byteOffset,e.length),s=[],c=[`sphere-impact`,`plane-impact`,`trigger`,`trail`];for(let t=a;t>0;t--){let i=r-t>>>0,a=4+i%n*8,l=e[a+2];s.push({sequence:i,step:e[a+1],kind:c[l>>>24],phase:l&8388608?`begin`:`impact`,body:l&8388607,target:e[a+3],position:[o[a+4],o[a+5],o[a+6]],speed:o[a+7]})}return{sequence:r,dropped:Math.max(0,i-n),exhaustedImpactSteps:e[1],discardedSimulationTime:o[2],events:s}}function vs(e){return{droppedContacts:e[0],invalidBodies:e[1],contacts:e[2],awakeBodies:e[3],sleepingBodies:e[4],candidateTests:e[5],maximumContacts:e[6],exhaustedImpactSteps:e[7]&1,exhaustedCandidateBodies:e[7]>>>1}}var ys=class{id;count;positions;velocities;orientations;angularVelocities;sleepStates;diagnostics;timeStep;substeps;iterations;maximumRadius;maximumContacts;contactSkin;maximumCandidateTests;broadPhase;parameters;continuous;maximumImpactSteps;warmStarting;contactCache;eventCapacity;triggers;events;eventCursor=0;eventRead;settings;commandSettings;bodyControl;ownedBuffers=[];added=!1;wakeRevision=1;constructor(e){if(this.id=e.id??`gpu-sphere-world`,this.count=e.count,this.positions=e.positions,this.velocities=e.velocities,this.orientations=e.orientations,this.angularVelocities=e.angularVelocities,this.sleepStates=e.sleepStates,this.diagnostics=e.diagnostics,this.timeStep=e.timeStep??1/120,this.substeps=e.substeps??1,this.iterations=e.iterations??8,this.maximumRadius=e.maximumRadius??1,this.maximumContacts=e.maximumContacts??32,this.contactSkin=e.contactSkin??this.maximumRadius*.01,this.maximumCandidateTests=e.maximumCandidateTests??0,!Number.isInteger(this.maximumCandidateTests)||this.maximumCandidateTests<0||this.maximumCandidateTests>1e6)throw Error(`Invalid sphere candidate budget`);if(this.broadPhase=e.broadPhase??`grid`,this.continuous=e.continuous??!1,this.warmStarting=e.warmStarting??!1,this.maximumImpactSteps=e.maximumImpactSteps??4,this.eventCapacity=e.eventCapacity??0,this.triggers=e.triggers??[],(this.continuous||this.warmStarting||this.eventCapacity>0)&&this.count>256||!Number.isInteger(this.maximumImpactSteps)||this.maximumImpactSteps<1||this.maximumImpactSteps>16||!Number.isInteger(this.eventCapacity)||this.eventCapacity<0||this.eventCapacity>65536||this.eventCapacity>0&&this.eventCapacity&this.eventCapacity-1||this.triggers.length>32||this.triggers.length>0&&!this.eventCapacity||this.triggers.some(e=>![...e.center,e.radius].every(Number.isFinite)||e.radius<=0))throw Error(`Invalid sphere sweep or event capacity`);for(let[e,t]of[[this.count,1e6],[this.substeps,64],[this.iterations,64],[this.maximumContacts,256]])if(!Number.isSafeInteger(e)||e<1||e>t)throw Error(`Invalid sphere world capacity`);if(!(this.timeStep>0)||!Number.isFinite(this.timeStep)||!(this.maximumRadius>0)||!Number.isFinite(this.maximumRadius)||!(this.contactSkin>=0)||!Number.isFinite(this.contactSkin))throw Error(`Invalid sphere world step or radius`);if(![`grid`,`all-pairs`].includes(this.broadPhase)||this.broadPhase===`all-pairs`&&this.count>256)throw Error(`Invalid sphere broad phase`);this.parameters={gravity:e.gravity??[0,0,-9.81],plane:e.plane??{offset:e.floor??0},planes:e.planes,restitution:e.restitution??.45,staticFriction:e.staticFriction??Math.max(.5,e.dynamicFriction??(e.friction===void 0?.35:1-e.friction)),dynamicFriction:e.dynamicFriction??(e.friction===void 0?Math.min(.35,e.staticFriction??.5):1-e.friction),rollingResistance:e.rollingResistance??.025,sleepAfter:e.sleepAfter??.75,sleepLinearSpeed:e.sleepLinearSpeed??.025,sleepAngularSpeed:e.sleepAngularSpeed??.05,restitutionThreshold:e.restitutionThreshold??.5,cutInducedThrow:e.cutInducedThrow??!0,spinInducedThrow:e.spinInducedThrow??!0},this.update({});let t=[e.positions,e.velocities,e.orientations,e.angularVelocities,e.sleepStates,e.diagnostics].filter(e=>!!e);if(new Set(t).size!==t.length)throw Error(`Sphere state buffers must not alias`);for(let n of t){let t=n===e.diagnostics?32:this.count*16;if(n.byteLength<t||!(n.usage&o.STORAGE))throw Error(`Sphere state requires packed STORAGE buffers`)}}get gravity(){return this.parameters.gravity}get restitution(){return this.parameters.restitution}get floor(){return this.parameters.plane.offset??0}get friction(){return 1-this.parameters.dynamicFriction}update(e){let t={...this.parameters,...e,plane:{...this.parameters.plane,...e.plane}},n=t.plane.normal??[0,0,1];if(![...t.gravity,...n,t.plane.offset??0,...t.plane.halfExtents??[1,1]].every(Number.isFinite)||Math.hypot(...n)<1e-6)throw Error(`Invalid sphere plane or gravity`);if(t.plane.halfExtents?.some(e=>e<=0))throw Error(`Plane half extents must be positive`);for(let e of[t.restitution,t.staticFriction,t.dynamicFriction,t.rollingResistance,t.sleepAfter,t.sleepLinearSpeed,t.sleepAngularSpeed,t.restitutionThreshold])if(!Number.isFinite(e)||e<0)throw Error(`Invalid sphere material`);if(t.restitution>1||t.dynamicFriction>t.staticFriction)throw Error(`Invalid sphere friction or restitution`);let r=t.planes??[t.plane];if(r.length>32)throw Error(`Too many sphere planes`);for(let e of r){let n=e.normal??[0,0,1],r=[e.restitution??t.restitution,e.staticFriction??t.staticFriction,e.dynamicFriction??t.dynamicFriction,e.rollingResistance??t.rollingResistance,e.spinningResistance??0,e.contactHeightRatio??0,e.restitutionVelocityScale??0];if(![...n,...e.center??[0,0,0],e.offset??0,...e.halfExtents??[1,1],...r].every(Number.isFinite)||Math.hypot(...n)<1e-6||e.halfExtents?.some(e=>e<=0)||r.some(e=>e<0)||r[0]>1||r[5]>=1||r[2]>r[1])throw Error(`Invalid sphere plane material or geometry`)}let i=this.parameters,a=e=>[...e.gravity,...e.plane.normal??[0,0,1],e.plane.offset??0,...e.plane.halfExtents??[1e10,1e10],e.staticFriction,e.dynamicFriction,e.rollingResistance,Number(e.cutInducedThrow),Number(e.spinInducedThrow),...(e.planes??[e.plane]).flatMap(t=>[...t.normal??[0,0,1],...bs(t),t.offset??0,...t.halfExtents??[1e10,1e10],t.restitution??e.restitution,t.staticFriction??e.staticFriction,t.dynamicFriction??e.dynamicFriction,t.rollingResistance??e.rollingResistance,t.spinningResistance??0,t.contactHeightRatio??0,t.restitutionVelocityScale??0])],o=a(i);(a(t).length!==o.length||a(t).some((e,t)=>Math.abs(e-o[t])>1e-5))&&(this.wakeRevision=this.wakeRevision%16e6+1),this.parameters={...t,gravity:[...t.gravity],planes:t.planes?.map(e=>({...e,normal:e.normal?[...e.normal]:void 0,center:e.center?[...e.center]:void 0,halfExtents:e.halfExtents?[...e.halfExtents]:void 0})),plane:{...t.plane,center:t.plane.center?[...t.plane.center]:void 0,normal:[...n],halfExtents:t.plane.halfExtents?[...t.plane.halfExtents]:void 0}},this.writeSettings()}addToGraph(e){if(this.added)throw Error(`Sphere world has already been added to a graph`);if(Math.ceil(this.count/64)>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Sphere world exceeds device dispatch limits`);if(Math.max(this.count*16,this.count*(this.warmStarting?(this.maximumContacts+32)*48:this.maximumContacts*8),this.warmStarting?this.count*(this.count+32)*48:0,32,this.eventCapacity?16+this.eventCapacity*32:0,this.eventCapacity?this.count*(this.count+32)*4:0)>e.device.limits.maxStorageBufferBindingSize)throw Error(`Sphere world exceeds maxStorageBufferBindingSize`);let t=(t,n,r=!1)=>{let i=e.device.createBuffer({id:`${this.id}-${t}`,byteLength:n,usage:(r?o.UNIFORM:o.STORAGE|o.COPY_SRC)|o.COPY_DST});return this.ownedBuffers.push(i),i};this.settings=t(`settings`,3200,!0),this.orientations??=t(`orientations`,this.count*16),this.angularVelocities??=t(`angular-velocities`,this.count*16),this.sleepStates??=t(`sleep-states`,this.count*16),this.diagnostics??=t(`diagnostics`,32);let n=(t,n,r,i=!1)=>e.createDataView(e.importBuffer({id:`${this.id}-${t}`,byteLength:r*16,usage:i?o.UNIFORM:o.STORAGE},n),{format:`float32x4`,length:r}),r=n(`settings`,this.settings,200,!0),i={positions:n(`positions`,this.positions,this.count),velocities:n(`velocities`,this.velocities,this.count),angularVelocities:n(`angular-velocities`,this.angularVelocities,this.count)},a=n(`orientations`,this.orientations,this.count),s=n(`sleep-states`,this.sleepStates,this.count),c=e.createDataView(e.importBuffer({id:`${this.id}-diagnostics`,byteLength:32,usage:o.STORAGE},this.diagnostics),{format:`uint32`,length:8}),l={positions:R(e,`${this.id}-predicted-positions`,`float32x4`,this.count),velocities:R(e,`${this.id}-predicted-velocities`,`float32x4`,this.count),angularVelocities:R(e,`${this.id}-predicted-angular`,`float32x4`,this.count)},u=R(e,`${this.id}-keys`,`uint32`,this.count),d=R(e,`${this.id}-values`,`uint32`,this.count),f=R(e,`${this.id}-sorted-keys`,`uint32`,this.count),p=R(e,`${this.id}-sorted-bodies`,`uint32`,this.count),m=R(e,`${this.id}-counts`,`uint32`,this.count),h=R(e,`${this.id}-offsets`,`uint32`,this.count+1),g=R(e,`${this.id}-contacts`,`uint32x2`,this.count*(this.warmStarting?(this.maximumContacts+32)*6:this.maximumContacts)),_;this.warmStarting&&(this.contactCache=t(`contact-cache`,this.count*(this.count+32)*48),_=n(`contact-cache`,this.contactCache,this.count*(this.count+32)*3));let v=e.device.createBuffer({id:`${this.id}-clock`,byteLength:16,usage:o.UNIFORM|o.STORAGE|o.COPY_DST});this.ownedBuffers.push(v);let y=e.createDataView(e.importBuffer({id:`${this.id}-clock`,byteLength:16,usage:o.STORAGE|o.UNIFORM},v),{format:`float32x4`,length:1}),b=R(e,`${this.id}-previous-positions`,`float32x4`,this.count),x=R(e,`${this.id}-previous-velocities`,`float32x4`,this.count),S,C;if(this.eventCapacity){let n=t(`contact-states`,this.count*(this.count+32)*4);C=e.createDataView(e.importBuffer({id:`${this.id}-contact-states`,byteLength:n.byteLength,usage:o.STORAGE},n),{format:`uint32`,length:this.count*(this.count+32)}),this.events=t(`events`,16+this.eventCapacity*32),S=e.createDataView(e.importBuffer({id:`${this.id}-events`,byteLength:this.events.byteLength,usage:o.STORAGE},this.events),{format:`uint32`,length:this.events.byteLength/4})}let w=ts(this.count,this.maximumRadius,this.maximumContacts,this.contactSkin,this.maximumCandidateTests),T=(e,t,n,r=`read`)=>({name:e,view:t,location:n,access:r}),ee={clear:`Reset diagnostics for this simulation substep.`,begin:`Initialize the substep clock and remaining simulation time.`,sweep:`Find the earliest swept-sphere impact to avoid tunneling.`,remember:`Save sphere state before speculative integration.`,integrate:`Apply gravity and advance sphere positions.`,cells:`Assign spheres to spatial grid cells for collision detection.`,count:`Count candidate sphere pairs in neighboring cells.`,sentinel:`Write the final candidate-pair offset.`,emit:`Emit candidate sphere pairs from neighboring grid cells.`,restore:`Restore cached contact data to initialize persistent contact constraints.`,warm:`Warm start contacts using impulses from the previous step.`,solve:`Resolve sphere contacts and friction for this solver iteration.`,publish:`Copy solved sphere positions and velocities into the public simulation state.`,store:`Store solved contact impulses for the next step.`,events:`Publish contact events for the application.`,"state-counts":`Count active and sleeping sphere states.`,finalize:`Finalize sphere positions and velocities after contact solving.`,budget:`Record whether the continuous collision impact budget was exhausted.`},E=(t,n,i,a=Math.ceil(this.count/64),o=!0)=>{let s=o&&/\bclock\./.test(n),c=o?[.../\bsettings\./.test(n)?[T(`settings`,r,0,`uniform`)]:[],...s?[T(`clock`,y,9,`uniform`)]:[],...i]:i,l=c.map(e=>({buffer:e.view,usage:e.access===`uniform`?`uniform`:e.access===`read`?`storage-read`:`storage-read-write`})),u={attributes:[],bindings:c.map(e=>{let t={name:e.name,group:0,location:e.location};return e.access===`uniform`?{...t,type:`uniform`}:{...t,type:e.access===`read`?`read-only-storage`:`storage`}})},d={id:`${this.id}-${t}`,source:(s?w:w.replace(`@group(0) @binding(9) var<uniform> clock: Clock;`,``))+n,shaderLayout:u},f=e=>({encode:({computePass:t,getBuffer:n})=>{let r={};for(let e of c)r[e.name]=I(e.view,n);Object.assign(e.bindings,r),e.kernel.dispatch(t,{bindings:e.bindings,x:a,y:1,z:1})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:d.id,description:ee[t.replace(/^step-\d+-(?:impact-\d+-)?/,``).replace(/-\d+$/,``)],resources:l,compile:({device:e})=>f($o(e,d)),compileAsync:async({device:e})=>f(await es(e,d))})};for(let t=0;t<this.substeps;t++){let n=`step-${t}`;E(`${n}-clear`,`@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>; @compute @workgroup_size(8) fn main(@builtin(local_invocation_index) index:u32) {atomicStore(&diagnostics[index], 0u);}`,[T(`diagnostics`,c,1,`write`)],1,!1),E(`${n}-begin`,`
@group(0) @binding(1) var<storage, read_write> outputClock: Clock;
@compute @workgroup_size(1) fn main() {
 outputClock = Clock(settings.material.x, settings.material.x, outputClock.step + 1u, 0u);
}`,[T(`settings`,r,0,`uniform`),T(`outputClock`,y,1,`write`)],1,!1);for(let t=0;t<(this.continuous?this.maximumImpactSteps:1);t++){let o=`${n}-impact-${t}`;this.continuous&&E(`${o}-sweep`,hs(),[T(`positions`,i.positions,1),T(`velocities`,i.velocities,2),T(`settings`,r,0,`uniform`),T(`outputClock`,y,3,`write`)],1,!1),S&&E(`${o}-remember`,`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> previousPositions: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> previousVelocities: array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT) {return;}
 previousPositions[index] = positions[index]; previousVelocities[index] = velocities[index];
}`,[T(`positions`,i.positions,1),T(`velocities`,i.velocities,2),T(`previousPositions`,b,3,`write`),T(`previousVelocities`,x,4,`write`)],Math.ceil(this.count/64),!1),E(`${o}-integrate`,ns,[T(`positions`,i.positions,1),T(`velocities`,i.velocities,2),T(`angularVelocities`,i.angularVelocities,3),T(`sleepStates`,s,4,`write`),T(`predictedPositions`,l.positions,5,`write`),T(`predictedVelocities`,l.velocities,6,`write`),T(`predictedAngularVelocities`,l.angularVelocities,7,`write`)]),E(`${o}-cells`,rs,[T(`positions`,l.positions,1),T(`keys`,u,2,`write`),T(`values`,d,3,`write`),T(`diagnostics`,c,4,`write`)],Math.ceil(this.count/64),!1),this.broadPhase===`grid`&&ta(e,new Fo({id:`${this.id}-${o}-sort`,keys:u,values:d,outputKeys:f,outputValues:p}).getCommandNodes(e));let v=[T(`positions`,l.positions,1),T(`velocities`,l.velocities,2),...this.broadPhase===`grid`?[T(`sortedKeys`,f,3),T(`sortedBodies`,p,4)]:[],T(`diagnostics`,c,8,`write`)];E(`${o}-count`,is(`count`,this.broadPhase===`all-pairs`),[...v,T(`counts`,m,5,`write`)]),ta(e,new uo({id:`${this.id}-${o}-scan`,input:m,output:h}).getCommandNodes(e)),E(`${o}-sentinel`,`@group(0) @binding(1) var<storage, read> counts: array<u32>; @group(0) @binding(2) var<storage, read_write> offsets: array<u32>; @compute @workgroup_size(1) fn main() {offsets[BODY_COUNT] = offsets[BODY_COUNT - 1u] + counts[BODY_COUNT - 1u];}`,[T(`counts`,m,1),T(`offsets`,h,2,`write`)],1,!1),E(`${o}-emit`,this.warmStarting?us(is(`emit`,this.broadPhase===`all-pairs`),!0):is(`emit`,this.broadPhase===`all-pairs`),[...v,T(`offsets`,h,6),T(`contacts`,g,7,`write`)]),_&&(E(`${o}-restore`,cs+`const ALLOW_WARM = ${t===0};`+ds,[T(`positions`,l.positions,1),T(`offsets`,h,2),T(`contacts`,g,3,`write`),T(`cache`,_,4),T(`velocities`,l.velocities,5),T(`angularVelocities`,l.angularVelocities,6)]),E(`${o}-warm`,cs+fs,[T(`positions`,l.positions,1),T(`velocities`,l.velocities,2,`write`),T(`angularVelocities`,l.angularVelocities,3,`write`),T(`offsets`,h,4),T(`contacts`,g,5)]));let w=this.iterations;for(let e=0;e<w;e++){let t=e%2==0?l:i,n=e%2==0?i:l;E(`${o}-solve-${e}`,this.warmStarting?ps(as):as,[T(`positions`,t.positions,1),T(`velocities`,t.velocities,2),T(`angularVelocities`,t.angularVelocities,3),T(`offsets`,h,4),T(`contacts`,g,5,this.warmStarting?`write`:`read`),T(`outputPositions`,n.positions,6,`write`),T(`outputVelocities`,n.velocities,7,`write`),T(`outputAngularVelocities`,n.angularVelocities,8,`write`)])}w%2==0&&E(`${o}-publish`,`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> outputPositions: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> outputVelocities: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> outputAngularVelocities: array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT) {return;}
 outputPositions[index] = positions[index]; outputVelocities[index] = velocities[index]; outputAngularVelocities[index] = angularVelocities[index];
}`,[T(`positions`,l.positions,1),T(`velocities`,l.velocities,2),T(`angularVelocities`,l.angularVelocities,3),T(`outputPositions`,i.positions,4,`write`),T(`outputVelocities`,i.velocities,5,`write`),T(`outputAngularVelocities`,i.angularVelocities,6,`write`)],Math.ceil(this.count/64),!1),_&&E(`${o}-store`,cs+ms,[T(`offsets`,h,1),T(`contacts`,g,2),T(`cache`,_,3,`write`)]),S&&E(`${o}-events`,this.warmStarting?us(gs(this.eventCapacity,this.triggers)):gs(this.eventCapacity,this.triggers),[T(`positions`,i.positions,1,`write`),...this.triggers.some(e=>e.capture)?[T(`velocities`,i.velocities,2,`write`)]:[],T(`previousPositions`,b,3),T(`previousVelocities`,x,4),T(`offsets`,h,5),T(`contacts`,g,6),T(`events`,S,7,`write`),T(`contactStates`,C,8,`write`)],1),E(`${o}-state-counts`,`
@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>;
@compute @workgroup_size(1) fn main() {
 if(clock.timeStep > 0.0) {atomicStore(&diagnostics[3], 0u); atomicStore(&diagnostics[4], 0u);}
}`,[T(`diagnostics`,c,1,`write`)],1),E(`${o}-finalize`,os,[T(`positions`,i.positions,1),T(`velocities`,i.velocities,2,`write`),T(`angularVelocities`,i.angularVelocities,3,`write`),T(`orientations`,a,4,`write`),T(`sleepStates`,s,5,`write`),T(`diagnostics`,c,6,`write`)])}this.continuous&&E(`${n}-budget`,`
@group(0) @binding(1) var<storage, read_write> diagnostics: array<atomic<u32>>;
${S?`@group(0) @binding(2) var<storage, read_write> events: array<atomic<u32>>;`:``}
@compute @workgroup_size(1) fn main() {if(clock.remaining > 0.0) {
 atomicOr(&diagnostics[7], 1u); ${S?`atomicAdd(&events[1], 1u); atomicStore(&events[2], bitcast<u32>(bitcast<f32>(atomicLoad(&events[2])) + clock.remaining));`:``}
}}
`,[T(`diagnostics`,c,1,`write`),...S?[T(`events`,S,2,`write`)]:[]],1)}this.commandSettings=t(`body-command`,80,!0),this.bodyControl=$o(e.device,{id:`${this.id}-body-control`,source:ss,bindings:{command:this.commandSettings,positions:this.positions,velocities:this.velocities,angularVelocities:this.angularVelocities,orientations:this.orientations,sleepStates:this.sleepStates},shaderLayout:{bindings:[{name:`command`,type:`uniform`,group:0,location:0},...[`positions`,`velocities`,`angularVelocities`,`orientations`,`sleepStates`].map((e,t)=>({name:e,type:`storage`,group:0,location:t+1}))]}}),this.added=!0,this.writeSettings()}applyImpulse(e,t,n){this.submitBodyCommand(e,1,t,n??[0,0,0],n?1:0)}applyAngularImpulse(e,t){this.submitBodyCommand(e,2,t)}wakeBody(e){this.submitBodyCommand(e,3)}teleportBody(e,t,n=[0,0,0,1]){if(!n.every(Number.isFinite)||Math.hypot(...n)<1e-6)throw Error(`Invalid sphere orientation`);this.submitBodyCommand(e,4,t,[0,0,0],0,n)}setBodyEnabled(e,t){this.submitBodyCommand(e,5,[t?1:-1,0,0])}async readState(){if(!this.bodyControl)throw Error(`Add sphere world to a graph first`);let e=[this.positions,this.velocities,this.angularVelocities,this.orientations,this.sleepStates],t=this.parameters.sleepAfter,n=await Promise.all(e.map(async e=>new Float32Array((await e.readAsync(0,this.count*16)).buffer))),r=(e,t)=>[e[t],e[t+1],e[t+2]];return Array.from({length:this.count},(e,i)=>{let a=i*4;return{index:i,position:r(n[0],a),radius:Math.abs(n[0][a+3]),enabled:n[0][a+3]>0,velocity:r(n[1],a),inverseMass:n[1][a+3],angularVelocity:r(n[2],a),orientation:[...r(n[3],a),n[3][a+3]],sleeping:t>0&&n[4][a]>=t}})}submitBodyCommand(e,t,n=[0,0,0],r=[0,0,0],i=0,a=[0,0,0,1]){if(!this.bodyControl||!this.commandSettings)throw Error(`Add sphere world to a graph first`);if(!Number.isInteger(e)||e<0||e>=this.count||![...n,...r].every(Number.isFinite))throw Error(`Invalid sphere body command`);this.clearContactCache(),this.commandSettings.write(new Float32Array([e,t,i,0,...n,0,...r,0,...a,0,0,0,0]));let o=this.positions.device,s=o.createCommandEncoder(),c=s.beginComputePass();this.bodyControl.kernel.dispatch(c,{bindings:this.bodyControl.bindings,x:1,y:1,z:1}),c.end(),o.submit(s.finish())}readEvents(){if(!this.events)throw Error(`Sphere events are disabled`);return this.eventRead??=this.events.readAsync().then(e=>{let t=_s(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.eventCursor);return this.eventCursor=t.sequence,t}).finally(()=>{this.eventRead=void 0}),this.eventRead}destroy(){this.bodyControl?.kernel.destroy(),this.bodyControl=void 0;for(let e of this.ownedBuffers)e.destroy();this.ownedBuffers=[]}clearContactCache(){this.contactCache&&this.contactCache.write(new Uint8Array(this.contactCache.byteLength))}writeSettings(){if(this.clearContactCache(),!this.settings)return;let e=this.parameters,t=e.plane.normal??[0,0,1],n=Math.hypot(...t),r=t.map(e=>e/n),i=Math.abs(r[1])<.9?[r[2],0,-r[0]]:[0,-r[2],r[1]],a=Math.hypot(...i);for(let e=0;e<3;e++)i[e]/=a;let o=[r[1]*i[2]-r[2]*i[1],r[2]*i[0]-r[0]*i[2],r[0]*i[1]-r[1]*i[0]],s=new Float32Array(800);s.set([...e.gravity,this.wakeRevision,...r,e.plane.offset??0,...i,e.plane.halfExtents?.[0]??1e10,...o,e.plane.halfExtents?.[1]??1e10,this.timeStep,e.restitution,e.staticFriction,e.dynamicFriction,e.rollingResistance,e.sleepLinearSpeed,e.sleepAngularSpeed,(e.planes??[e.plane]).length,e.sleepAfter,e.restitutionThreshold,this.contactSkin,.8,Number(e.cutInducedThrow),Number(e.spinInducedThrow),0,0]);for(let[t,n]of(e.planes??[e.plane]).entries()){let r=n.normal??[0,0,1],i=Math.hypot(...r),a=r.map(e=>e/i),o=Math.abs(a[1])<.9?[a[2],0,-a[0]]:[0,-a[2],a[1]],c=Math.hypot(...o);for(let e=0;e<3;e++)o[e]/=c;let l=[a[1]*o[2]-a[2]*o[1],a[2]*o[0]-a[0]*o[2],a[0]*o[1]-a[1]*o[0]],u=bs(n);s.set([...a,u.reduce((e,t,n)=>e+t*a[n],0),...o,n.halfExtents?.[0]??1e10,...l,n.halfExtents?.[1]??1e10,...u,n.spinningResistance??0,n.restitution??e.restitution,n.staticFriction??e.staticFriction,n.dynamicFriction??e.dynamicFriction,n.rollingResistance??e.rollingResistance,n.contactHeightRatio??0,n.restitutionVelocityScale??0,0,0],32+t*24)}this.settings.write(s)}};function bs(e){if(e.center)return e.center;let t=e.normal??[0,0,1],n=(e.offset??0)/Math.hypot(...t);return[t[0]*n,t[1]*n,t[2]*n]}var B=.18,xs=.39,Ss=[[-6,-3,B],[0,-3.13,B],[6,-3,B],[-6,3,B],[0,3.13,B],[6,3,B]],Cs=[{halfExtents:[6,3],restitution:0,staticFriction:.25,dynamicFriction:.18,rollingResistance:.035,spinningResistance:.3},...[-1,1].flatMap(e=>[...[-1,1].map(t=>({normal:[0,-e,0],center:[t*3,e*3,.2],halfExtents:[.5,2.6],restitution:.88,restitutionVelocityScale:.035,contactHeightRatio:.35,staticFriction:.22,dynamicFriction:.16,rollingResistance:0})),{normal:[-e,0,0],center:[e*6,0,.2],halfExtents:[.5,2.6],restitution:.88,restitutionVelocityScale:.035,contactHeightRatio:.35,staticFriction:.22,dynamicFriction:.16,rollingResistance:0}])];for(let e of[-1,1])for(let t of[-1,1]){for(let n of[!0,!1])Cs.push({normal:n?[e*.6,-t,0]:[-e,t*.6,0],center:n?[e*5.725,t*3.075,.2]:[e*6.075,t*2.725,.2],halfExtents:[.5,.146],restitution:.8,staticFriction:.22,dynamicFriction:.16,rollingResistance:0,contactHeightRatio:.35,restitutionVelocityScale:.035});Cs.push({normal:[-e*.8,-t*.6,0],center:[e*.325,t*3.1,.2],halfExtents:[.5,.125],restitution:.8,staticFriction:.22,dynamicFriction:.16,rollingResistance:0,contactHeightRatio:.35,restitutionVelocityScale:.035})}function ws(){let e=new Float32Array(64);e.set([-3,0,B,B]);let t=[1,9,2,10,8,3,4,11,5,12,13,6,14,7,15],n=0;for(let r=0;r<5;r++)for(let i=0;i<=r;i++)e.set([2+r*Math.sqrt(3)*(B+.002),(i-r/2)*(2*B+.004),B,B],t[n++]*4);return e}function Ts(e){for(let t=0;t<8;t++)for(let n=0;n<11;n++){let r=[-3-t*.3,(n%2?1:-1)*Math.ceil(n/2)*.42,B];if(e.every(e=>e.index===0||!e.enabled||Math.hypot(e.position[0]-r[0],e.position[1]-r[1])>e.radius+.18+.02))return r}return null}function Es(e){return e.every(e=>!e.enabled||Math.hypot(...e.velocity)<.035&&Math.hypot(...e.angularVelocity)<.15)}var Ds=0,Os=class{constructor(e){this.userData={},this.id=e.id||`geometry-${++Ds}`,this.topology=e.topology,this.attributes={};let t=e.indices?ks(e.indices):void 0;for(let[n,r]of Object.entries(e.attributes||{})){let e=ks(r);if((n===`POSITION`||n===`positions`)&&(e.size||=3),n===`indices`){if(t)throw Error(`Geometry has multiple index attributes`);t=e}else this.attributes[n]=e}if(t){if(!(t.value instanceof Uint16Array||t.value instanceof Uint32Array))throw Error(`Geometry indices must be a Uint16Array or Uint32Array`);t.size=1,this.indices=t,js(t,this.attributes)}if(this.vertexCount=e.vertexCount??Ms(this.attributes,this.indices),!Number.isInteger(this.vertexCount)||this.vertexCount<0)throw Error(`Geometry vertexCount must be a non-negative integer`)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}};function ks(e){let t=As(e)?{value:e}:{...e};if(!As(t.value))throw Error(`Geometry attributes must contain a typed-array value`);if(t.size!==void 0&&(!Number.isInteger(t.size)||t.size<1))throw Error(`Geometry attribute size must be a positive integer`);if(t.size&&t.value.length%t.size!==0)throw Error(`Geometry attribute length must be divisible by its size`);return t}function As(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function js(e,t){let n=-1;for(let t of e.value)n=Math.max(n,Number(t));for(let[e,r]of Object.entries(t))if(!r.constant&&r.size){let t=r.value.length/r.size;if(n>=t)throw Error(`Geometry index ${n} exceeds ${e} vertex count ${t}`)}}function Ms(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e))!t.constant&&t.size&&(n=Math.min(n,t.value.length/t.size));if(!Number.isFinite(n))throw Error(`Geometry has no countable attributes`);return n}var Ns=class extends Os{bufferLayout;constructor(e){let t={},n=new Map;for(let[r,i]of Object.entries(e.attributes)){let e=Ps(r),a=n.get(e);a&&delete t[a],n.set(e,r),t[r]=i}let r=e.indices,i=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;super({...e,attributes:t,indices:i});for(let[e,n]of Object.entries(t))!ArrayBuffer.isView(n)&&Object.isExtensible(n)&&e!==`indices`&&(Object.assign(n,this.attributes[e]),this.attributes[e]=n);this.bufferLayout=e.bufferLayout||Fs(this.attributes)}};function Ps(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function Fs(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:i,normalized:a}=r;if(i===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:Ps(n),format:C.getVertexFormatFromAttribute(e,i,a)})}return t}function Is(e,t={}){let n=t.bufferName||`geometry`;if(Ls(e,n))return e;let r=t.minAttributeAlignment||4,i=Rs(e,t.attributes),a=[],o=0,s=1/0;for(let[e,t]of i){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:i,normalized:c}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(i===void 0)throw Error(`Attribute ${e} is missing a size`);let l=C.getVertexFormatFromAttribute(n,i,c),u=C.getVertexFormatInfo(l);o=Bs(o,r),a.push({sourceName:e,attributeName:Ps(e),value:n,size:i,format:l,byteOffset:o,byteLength:u.byteLength}),o+=u.byteLength;let d=n.length/i;if(!Number.isInteger(d))throw Error(`Attribute ${e} length is not divisible by size`);s=Math.min(s,d)}if(a.length===0||!Number.isFinite(s))throw Error(`Geometry ${e.id} has no interleavable attributes`);let c=Bs(o,r),l=new ArrayBuffer(s*c);for(let e of a)zs(l,s,c,e);return new Ns({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(l),size:c,byteStride:c}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:c,attributes:a.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function Ls(e,t){if(e.bufferLayout?.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function Rs(e,t){let n=new Map,r=t||Object.keys(e.attributes);for(let t of r){let r=e.attributes[t];r&&n.set(Ps(t),[t,r])}return Array.from(n.values())}function zs(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function Bs(e,t){return Math.ceil(e/t)*t}function Vs(e=[],t){let n={modules:[],injectionTargets:[],defines:{},injections:{},vertexInputs:{},interStageVariables:{}};for(let r of e)Us(n,r,t);let{vertexInputs:r,interStageVariables:i}=n;for(let e of Object.keys(i))if(r[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return n}function Hs(e=[],t=[],n={}){let r=[...e],i=new Map;for(let e of r){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||i.set(e.name,e)}for(let e of t){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||(r.push(e),i.set(e.name,e))}return r}function Us(e,t,n){t.module&&e.modules.push(t.module),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){Ws(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.interStageVariables||{})){Ws(n,`varying`);let t=Gs(n,r),i=e.interStageVariables[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.interStageVariables[n]=t}for(let r of t.injectionTargets||[]){let t=r[n];if(!t)continue;let i=`${r.stage===`vertex`?`vs`:`fs`}:${r.name}`;if(!/^(vs|fs):[A-Za-z_][A-Za-z0-9_]*$/.test(i))throw Error(`Invalid ShaderPlugin injection target ${i}`);let a=e.injectionTargets.find(e=>e.stage===r.stage&&e.name===r.name),o=a?.[n];if(o&&(o.parameters!==t.parameters||(o.returnType||`void`)!==(t.returnType||`void`)||o.header!==t.header||o.footer!==t.footer))throw Error(`Conflicting ShaderPlugin injection target ${i}`);a||e.injectionTargets.push({name:r.name,stage:r.stage,[n]:t})}let r=Pt(Array.isArray(t.injections)?t.injections:Object.entries(t.injections||{}).flatMap(([e,t])=>{let r=Ks(e,n);if(r===void 0)return[];let[i,...a]=r.split(`:`);if(i!==`vs`&&i!==`fs`)throw Error(`Invalid ShaderPlugin injection ${e}`);return[{stage:i===`vs`?`vertex`:`fragment`,target:a.join(`:`),[n]:t}]}),n,t.name);for(let[t,n]of Object.entries(r))e.injections[t]||=[],e.injections[t].push(...n)}function Ws(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function Gs(e,t){let{primitiveType:n}=a.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function Ks(e,t){let n=/^(glsl|wgsl):([\s\S]+)$/.exec(e);return n?n[1]===t?n[2]:void 0:e}function qs(e,t){return{name:Js(e,t),language:`glsl`,version:Ys(e)}}function Js(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Ys(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function Xs(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function Zs(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=tc(e,$s),e;case`fragment`:return e=tc(e,ec),e;default:throw Error(t)}}var Qs=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],$s=[...Qs,[nc(`attribute`),`in $1`],[nc(`varying`),`out $1`]],ec=[...Qs,[nc(`varying`),`in $1`]];function tc(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function nc(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var rc=`precision highp float;
`;function ic(e){let{vs:t,fs:n}=e,r=_t(e.modules||[]);return{vs:ac(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:ac(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:rn(r)}}function ac(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},injectionTargets:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginInterStageVariables:d={},prologue:f=!0,log:p}=t;ct(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?qs(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${Xs(e)}
${r===`fragment`?rc:``}

// ----- APPLICATION DEFINES -------------------------

${oc(v)}

`:`${g}
`;break}let b=rr(s,t.pluginInjectionTargets,`glsl`),x={},S={},C={};an(l,x,S,C),an(Array.isArray(c)?Pt(c,`glsl`):{},x,S,C);let w=Array.isArray(c)?{}:c;for(let e in w){let t=typeof w[e]==`string`?{injection:w[e],order:0}:w[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[...S[e]||[],t]:C[e]=[...C[e]||[],t]:x[e]=[...x[e]||[],t]}else C[e]=[...C[e]||[],t]}if(r===`vertex`){let e=_n(_,u);e&&(y+=`${e}\n`)}let T=Mn(_,r,d);T.declarations&&(y+=`${T.declarations}\n`),T.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:T.initialization,order:-(2**53-1)}));for(let e of a){p&&ht(e,_,p);let t=on(e,r,p);y+=t}return ar(b,x,r),y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=nn,y=Ft(y,r,S),y+=nr(b[r],x),y+=_,y=Ft(y,r,C),i===`glsl`&&m!==h&&(y=Zs(y,r)),i===`glsl`&&Kt(y,r,p),y.trim()}function oc(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var sc=class extends vt{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...ic({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}},cc=class{buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),n=this.device.createBuffer({id:`batch-uniforms`,byteLength:t,usage:o.UNIFORM|o.COPY_DST});this.buffer?.destroy(),this.buffer=n}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){f(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}};function lc(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var uc=`__debugFramebufferState`,dc=8;function fc(e,t,n){if(e.device.type!==`webgl`)return;let r=hc(e.device);if(!r.flushing){if(_c(e)){pc(e,n,r);return}t&&gc(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function pc(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=vc(t.top,dc),l=vc(t.left,dc);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=mc({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+dc}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function mc(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function hc(e){return e.userData[uc]||={flushing:!1,queuedFramebuffers:[]},e.userData[uc]}function gc(e){return`colorAttachments`in e}function _c(e){let t=e.props.framebuffer;return!t||t.handle===null}function vc(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function yc(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!yc(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=e,i=t,a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(let e of a)if(!t.hasOwnProperty(e)||!yc(r[e],i[e],n-1))return!1;return!0}return!1}var bc=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return y(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function xc(e,t){let n=ee(e),r=t.slice();return r.sort((e,t)=>D(y(e).map(e=>n[e]))-D(y(t).map(e=>n[e]))),r}function Sc(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of Dc(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function Cc(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?Ac(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:kc(e.bindings,t.bindings)}:e:t}function wc(e){return!!(e.uniformTypes&&!Oc(e.uniformTypes))}function Tc(e){let t=[];for(let n of e){let e=Vt(n),r=new Set([n.vs,n.fs].flatMap(e=>e?Gt(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),i=r.has(e)?e:r.size===1?r.values().next().value:void 0;wc(n)&&i&&t.push({name:i,uniformTypes:n.uniformTypes})}return t}function Ec(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function Dc(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function Oc(e){for(let t in e)return!1;return!0}function kc(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function Ac(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}function jc(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var Mc={};function Nc(e=`id`){return Mc[e]=Mc[e]||1,`${e}-${Mc[e]++}`}function Pc(e,t,n){for(let[r,i]of Object.entries(t)){if(!i)continue;if(!i.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=n.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let a=t.attributes??[];if(a.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let o=a[0],s=t.format??o?.format,c=Ic(e,r,i.format),l=t.byteStride??c.byteLength;if(s!==i.format||l!==i.byteStride||i.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function Fc(e,t){let n=Object.entries(t).filter(e=>e[1]!==void 0);if(n.length===0)return[];let[r,i]=n[0];for(let[t,a]of n){if(!a.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(Ic(e,t,a.format),a.length!==i.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(a.data.length!==i.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let a=0;return i.data.map((t,r)=>{let i={};for(let[a,o]of n){let n=o.data[r];if(!n||n.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(n.format!==o.format||n.byteStride!==o.byteStride||n.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${a}" chunk layout must be stable`);i[a]=n}let o={batchIndex:r,rowIndexOffset:a,rowCount:t.length,data:i};return a+=t.length,o})}function Ic(e,t,n){if(n.includes(`<`))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return C.getVertexFormatInfo(n)}function Lc(e){let t;for(let n of Object.values(e)){if(!n||`isConstant`in n)continue;let e=0;for(let t of n.data)e+=t.length;if(f(e===n.length),t){f(n.length===t.length&&n.data.length===t.data.length);for(let e=0;e<n.data.length;e++)f(n.data[e].length===t.data[e].length)}else t=n}}function Rc(e,t,n,r,i,a){let o=t.inputs,s=n.inputs,c=t.sourceLayouts,l=n.sourceLayouts,u=t.layouts,d=n.layouts,f=n.stepMode,p=t.batchCount,m=n.batchCount,h=Array.from({length:p},(e,n)=>t.getBatch(n)),g=Array.from({length:m},(e,t)=>n.getBatch(t)),_=zc(h),v=zc(g),y=e.vertexCount,b=e.instanceCount,x=!0;try{let o=e.isInstanced&&n.vertexCount===void 0,s=o?p*m:Math.max(p,m);if(p===0||m===0)return!0;for(let c=0;c<s;c++){let s=o?Math.floor(c/m):Math.min(c,p-1),l=o?c%m:Math.min(c,m-1);t.setInputs(h[s],u,`vertex`),n.setInputs(g[l],d,f),r();let S=t.rowCount===void 0?n.vertexCount===void 0?0:v[l]:_[s];a===`vertex`&&e.setVertexCount(Math.max(0,Math.min(t.rowCount??n.vertexCount??y,y-S))),a===`instance`&&n.instanceCount!==void 0&&e.setInstanceCount(Math.max(0,Math.min(n.instanceCount,b-v[l]))),!(!e.indexBuffer&&e.vertexCount===0||e.isInstanced&&e.instanceCount===0)&&(x=i()&&x)}}finally{t.setInputs(o,c,`vertex`),n.setInputs(s,l,f),r(),e.setVertexCount(y),e.setInstanceCount(b)}return x}function zc(e){let t=0;return e.map(e=>{let n=t;for(let n of Object.values(e))if(n&&`data`in n){t+=n.length;break}return n})}var Bc=class{inputs={};sourceLayouts;stepMode=`vertex`;claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,n,r=!0){if(r)Lc(e);else for(let t of Object.values(e))t&&!V(t)&&f(t.data.length===1);this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=n,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let i=t??Object.entries(e).flatMap(([e,t])=>t&&!V(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),a=Object.entries(e).flatMap(([e,t])=>{if(!t||i.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];f(t.format);let r=t.format;return[{name:e,stepMode:n,byteStride:V(t)?0:t.byteStride,attributes:[{attribute:e,format:r,byteOffset:0}]}]}),s=[...i,...Hc(e,a)];for(let[t,i]of Object.entries(e))if(i){if(!V(i)&&!Array.isArray(i.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);!V(i)&&r&&((s.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t))?.stepMode??n)===`instance`?(f(this.instanceCount===void 0||this.instanceCount===i.length),this.instanceCount=i.length):(f(this.vertexCount===void 0||this.vertexCount===i.length),this.vertexCount=i.length),this.rowCount=n===`instance`?this.instanceCount:this.vertexCount),this.claimedNames.add(t)}this.layouts=s.flatMap(t=>{let r=e[t.name],i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),a=i.filter(t=>V(e[t.attribute])),o={...t,stepMode:t.stepMode??n};return this.device.type!==`webgpu`||r&&!V(r)&&r.bufferLayout||!a.length||a.length===i.length?[{...o,byteStride:a.length===i.length&&a.length?0:o.byteStride}]:[{...o,attributes:i.filter(t=>!V(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:a}]}),this.buffers={},this.byteOffsets={},this.constants={};let c=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let n=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of n)this.claimedNames.add(e.attribute);let r=e[t.name];if(r&&!V(r)){let e=r.bufferLayout||!r.format?0:(n.find(e=>e.attribute===t.name)??n[0])?.byteOffset??0;this.bindVector(t.name,r,e)}let i=0;for(let r of n){let n=e[r.attribute]??(r.attribute===t.name?e[t.name]:void 0);n&&(f(n.format===void 0||n.format===r.format),V(n)?(this.constants[r.attribute]=Vc(n),i=Math.max(i,(r.byteOffset??0)+n.byteLength)):this.buffers[t.name]||this.bindVector(t.name,n,r.byteOffset??0))}if(this.device.type===`webgpu`&&i&&!this.buffers[t.name]){let r=new Uint8Array(Math.ceil(i/4)*4);for(let t of n){let n=e[t.attribute];V(n)&&r.set(new Uint8Array(n.value.buffer,n.value.byteOffset,n.byteLength),t.byteOffset??0)}let a=this.constantBuffers[t.name];(!a||a.byteLength<r.byteLength)&&(a?.destroy(),a=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:r.byteLength,usage:o.VERTEX|o.COPY_DST|o.COPY_SRC}),this.constantBuffers[t.name]=a),a.write(r),this.buffers[t.name]=a,c.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))c.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!V(e));return e&&!V(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,n])=>{if(!n||V(n))return[t,n];let r=n.data[e];return[t,{...n,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,n){let r=t.data[0];if(!r)return;let i=r.byteOffset-n;f(i>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=i}};function V(e){return!!(e&&`isConstant`in e&&e.isConstant)}function Vc(e){let t=C.getVertexFormatInfo(e.format);if(e.format===`unorm10-10-10-2`){let t=e.value[0];return new Float32Array([(t&1023)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let n=Array.from(e.value);if(e.format===`unorm8x4-bgra`&&([n[0],n[2]]=[n[2],n[0]]),t.normalized){let r=e.value.BYTES_PER_ELEMENT*8,i=2**r-1;return new Float32Array(n.map(e=>t.signed?(e+2**(r-1))/i*2-1:e/i))}return t.integer?t.signed?new Int32Array(n):new Uint32Array(n):new Float32Array(n)}function Hc(e,t){let n=[],r,i=0,a=[...t].sort((t,n)=>{let r=e[t.name],i=e[n.name];return(r&&!V(r)?r.data[0]?.byteOffset??0:0)-(i&&!V(i)?i.data[0]?.byteOffset??0:0)});for(let t of a){let a=e[t.name],o=t.attributes[0];if(V(a)){r||(r={...t,attributes:[]},n.push(r));let e=Math.min(4,a.byteLength);i=Math.ceil(i/e)*e,r.attributes.push({...o,byteOffset:i}),i+=a.byteLength;continue}let s=n.find(n=>{let r=e[n.name];if(!r||V(r)||!r.data.length||!a.data.length)return!1;let i=a.data[0].byteOffset-r.data[0].byteOffset;return n.stepMode===t.stepMode&&n.byteStride===t.byteStride&&i>=0&&i+a.rowByteLength<=a.byteStride&&a.data.every((e,t)=>{let n=r.data[t];return e.buffer===n.buffer&&e.byteStride===n.byteStride&&e.byteOffset-n.byteOffset===i})});if(s){let t=e[s.name];s.attributes.push({...o,byteOffset:a.data[0].byteOffset-t.data[0].byteOffset})}else n.push({...t,attributes:[...t.attributes]})}return n}function Uc(e){return(Array.isArray(e)?e.length===0||typeof e[0]==`number`:ArrayBuffer.isView(e)&&!(e instanceof DataView))||typeof e==`number`||typeof e==`boolean`}function Wc(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||Uc(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var Gc=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=_t(Object.values(e).filter(Zc));for(let t of n)e[t.name]=t;i.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&i.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},a=this.modules[n];if(!a)this.options.disableWarnings||i.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:i,bindings:o}=Wc(a.getUniforms?.(r,e)||r,a.uniformTypes);this.moduleUniforms[n]=Kc(e,i,a.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=_t(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=Kc({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function Kc(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=qc(e[i],a,n[i]));return r}function qc(e,t,n){if(!n||typeof n==`string`)return Jc(t);if(Array.isArray(n)){if(Yc(t)||!Array.isArray(t))return Jc(t);let r=Array.isArray(e)&&!Yc(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=qc(r[e],a,n[0]))}return i}if(!Xc(t))return Jc(t);let r=n,i=Xc(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=qc(i[e],n,r[e]));return a}function Jc(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?Yc(e)?e.slice():e.map(e=>e===void 0?void 0:Jc(e)):Xc(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:Jc(t)])):e}function Yc(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function Xc(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Zc(e){return!!e?.dependencies}var Qc=2,$c=1e4,el=`render pipeline initialization failed`,tl=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],nl=class e{static async createAsync(e,t){let n=!N.getAsyncCompilation(e),r=n?N.beginAsyncCompilation(e):N.getAsyncCompilation(e),i;try{i=new this(e,t)}finally{n&&N.endAsyncCompilation(e,r)}try{return n?await Promise.all(r):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...k.defaultProps,inferDrawCount:`no`,enforceMatchingVectorLengths:!0,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){this.constructorDrawOffsets={firstVertex:n.firstVertex,firstIndex:n.firstIndex};let r=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:n.vertexCount??(r.vertexCount||void 0),instanceCount:n.instanceCount??(r.instanceCount||void 0)};let i=r.shaderAssembler,a=Object.hasOwn(n,`vertexCount`);this.props={...r,...n,shaderAssembler:n.shaderAssembler??(i&&rl(i,t.info.shadingLanguage)?i:t.info.shadingLanguage===`wgsl`?new Ar:new sc)},this._vertexCountSet=a,n=this.props,this.id=n.id||Nc(`model`),this.device=t,Object.assign(this.userData,n.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=n.isInstanced??(n.instanceCount?!0:void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new Bc(t,`${this.id}-geometry`),this.attributeVectorBindings=new Bc(t,`${this.id}-attributes`);try{this._initializeProps(n);let e=jc(t),r=Vs(this.props.plugins,e.shaderLanguage),i=Hs(this.props.modules,r.modules),a=Object.fromEntries(i.map(e=>[e.name,e])),o=n.shaderInputs||new Gc(a,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&r.modules.length>0&&o.addModules(r.modules),this.setShaderInputs(o);let s=Ec(this.props.modules,o.getModules()),c={...r.defines,...this.props.defines};if(this.device.type===`webgl`&&(this.props._uniformBlockLayouts=Tc(s)),this.props.shaderLayout=Sc(this.props.shaderLayout,s)||null,this.device.type===`webgpu`&&this.props.source){let n=this.props.shaderAssembler;f(rl(n,`wgsl`));let{source:i,getUniforms:a,bindingTable:o,entryPoints:l={},shaderLayout:u}=n.assembleWGSLShader({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.source=i,this.props.vertexEntryPoint=l.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=l.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=a,this._bindingTable=o;let d=il(u??t.getShaderLayout?.(this.source),r.vertexInputs),p=Cc(this.props.shaderLayout,d,Object.keys(r.vertexInputs));this.props.shaderLayout=Sc(p||null,s)||null}else{let t=this.props.shaderAssembler;f(rl(t,`glsl`));let{vs:n,fs:i,getUniforms:a}=t.assembleGLSLShaderPair({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.vs=n,this.fs=i,this._getModuleUniforms=a,this._bindingTable=[]}this.pipelineFactory=n.pipelineFactory||N.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||ke.getDefaultShaderFactory(this.device);let l=N.getAsyncCompilation(this.device);l?(this._pipelineInitialization=this._initializePipelineAsync(n),l.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(n))}catch(t){try{e.prototype.destroy.call(this)}finally{throw t}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),e.indexCount!==void 0&&this.setIndexCount(e.indexCount),this.constructorDrawOffsets.firstVertex!==void 0&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),this.constructorDrawOffsets.firstIndex!==void 0&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),e.isInstanced!==void 0&&(this.isInstanced=e.isInstanced),this.constructorDrawCounts.instanceCount!==void 0&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),this.constructorDrawCounts.vertexCount!==void 0&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||=(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e,t){return t?.parameters?this._withDrawParameters(e,t.parameters,()=>this._draw(e)):this._draw(e)}_withDrawParameters(e,t,n){let r=e.getParameters();try{return e.setParameters(t),n()}finally{e.setParameters(r)}}_draw(e){if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(this.geometryVectorBindings.batchCount!==1||this.attributeVectorBindings.batchCount!==1))return this.drawVectorGroups(e);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return i.info(Qc,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return i.info(Qc,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)i.info(Qc,`>>> DRAWING ABORTED ${this.id}: ${el}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)i.info(Qc,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??(this._vertexCountSet?this.vertexCount:a.byteLength/(a.indexType===`uint32`?4:2)):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0?!0:e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=el,this._drawBlockedReason=el):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),this.validateVectorLengthPolicy(),this.props.enforceMatchingVectorLengths&&Lc(e),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||this.attributeVectorBindings.vertexCount!==void 0)&&Lc([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let n=this.geometryVectorBindings.rowCount;f(n===void 0||this.attributeVectorBindings.vertexCount===void 0||n===this.attributeVectorBindings.vertexCount),this.props.inferDrawCount===`vertex`&&this.setVertexCount(n??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),this.isInstanced===void 0&&(t?.some(e=>e.stepMode===`instance`)||Object.values(e).some(e=>e&&`data`in e&&e.bufferLayout?.stepMode===`instance`))&&(this.isInstanced=!0);let n=!this.isInstanced||Object.entries(e).some(([e,n])=>n&&`data`in n&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??n.bufferLayout?.stepMode)===`vertex`);this.validateVectorLengthPolicy(),n&&this.props.enforceMatchingVectorLengths&&Lc([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),this.props.inferDrawCount===`instance`&&this.attributeVectorBindings.instanceCount!==void 0&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let r=this.attributeVectorBindings.vertexCount;if(r!==void 0&&this.props.inferDrawCount===`vertex`){let e=this.geometryVectorBindings.rowCount;f(e===void 0||e===r),e===void 0&&this.setVertexCount(r)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&(f(e.format===`uint8`||e.format===`uint16`||e.format===`uint32`),f(e.data.length<=1),f(e.byteStride===(e.format===`uint32`?4:e.format===`uint16`?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];t&&this.indexVector&&f((t.buffer instanceof P?t.buffer.buffer:t.buffer).indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride===0),this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let n=new Set(Object.keys(e)),r=t.filter(e=>n.has(e.name)||e.attributes?.some(e=>n.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),this.device.type===`webgl`&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let n=Fc(this.id,e);f(n.length<=1),Pc(this.id,e,this.bufferLayout),n[0]&&this.setGPUData(n[0].data),this.setBatchDrawCount(n[0]?.rowCount??0,t?.count)}drawVectorGroups(t){let n=this.drawingVectorBatches,r=this._vertexCountSet;this.drawingVectorBatches=!0;try{let n=Rc(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>e.prototype.draw.call(this,t),this.props.inferDrawCount);return n&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),n}finally{this._vertexCountSet=r,this.drawingVectorBatches=n}}drawBatches(t,{vectors:n,onBatch:r}){let i=Fc(this.id,n);Pc(this.id,n,this.bufferLayout);for(let e of Object.keys(n))f(!n[e]||this.currentAttributes[e]);let a={...this.currentAttributes},o={...this.currentAttributeByteOffsets},s={...this.bindings},c=this.instanceCount,l=this.vertexCount,u=this.isInstanced,d=this._vertexCountSet,p=this.drawingVectorBatches,m=this.device.type===`webgpu`&&i.length?new He(this.device,this.shaderInputs.modules):void 0;if(m&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new cc(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(m.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*i.length)}this.drawingVectorBatches=!0;let h=!0;try{for(let n of i){this.setGPUData(n.data),this.setBatchDrawCount(n.rowCount),r?.(n);let i={};try{if(m){m.setUniforms(this.shaderInputs.getUniformValues());for(let[e,t]of this._uniformStore.uniformBuffers){let n=`${e}Uniforms`;this.bindings[n]===t&&(i[n]=t,this.setBindings({[n]:this.batchUniformBuffer.write(m.getUniformBufferData(e))}))}}h=e.prototype.draw.call(this,t)&&h}finally{this.setBindings(i)}}}finally{m?.destroy(),this.setAttributes(a,{byteOffsets:o});for(let e of Object.keys(this.bindings))e in s||delete this.bindings[e];this.setBindings(s),this.setInstanceCount(c),this.setVertexCount(l),this.isInstanced=u,this._vertexCountSet=d,this.drawingVectorBatches=p}return h}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let n=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(n?.attributes?.[0]?.byteOffset??0);return f(r>=0),[e,r]}))})}validateVectorLengthPolicy(){f(this.props.enforceMatchingVectorLengths!==!1||this.props.inferDrawCount===`no`)}setBatchDrawCount(e,t=this.props.inferDrawCount===`no`?`none`:this.props.inferDrawCount){t===`instance`?this.setInstanceCount(e):t===`vertex`&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,n=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,i=this.getExplicitVectorLayouts(n.inputs)??n.sourceLayouts;t.setInputs(t.inputs,r,`vertex`,this.props.enforceMatchingVectorLengths),n.setInputs(n.inputs,i,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||n.vertexCount!==void 0)&&Lc([...Object.values(t.inputs),...Object.values(n.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(n),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(e=xc(this.pipeline.shaderLayout,e),yc(e,this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){yc(e,this.parameters,2)||(this.parameters=e,this.device.type===`webgl`?this.setNeedsRedraw(`parameters`):this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new He(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(wc(t)&&this._usesManagedUniformBuffer(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw(`shaderInputs`)}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof P?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof P?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){Object.assign(this.currentAttributes,e);for(let n of Object.keys(e))this.currentAttributeByteOffsets[n]=t?.byteOffsets?.[n]??0;this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&i.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=xc(this.pipeline.shaderLayout,this.bufferLayout);let r=new bc(this.bufferLayout);for(let[a,o]of Object.entries(e)){let e=o instanceof P?o.buffer:o,s=r.getBufferLayout(a);if(!s){n||i.warn(`Model(${this.id}): Missing layout for buffer "${a}".`)();continue}let c=r.getAttributeNamesForBuffer(s),l=!1;for(let r of c){let s=this._attributeInfos[r];if(s){let r=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(s.bufferName):s.location;if(r===null){n||i.warn(`Model(${this.id}): Missing vertex array slot for buffer "${s.bufferName}".`)();continue}let c=t?.byteOffsets?.[a]??0;this.vertexArray.setBuffer(r,e,c),o instanceof P?this._dynamicAttributeBufferSources[r]={source:o,generation:o.generation,byteOffset:c}:delete this._dynamicAttributeBufferSources[r],l=!0}}!l&&!n&&i.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${a}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||i.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(gi(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=al(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?h(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let n of Object.values(this.bindings))n instanceof d?e=Math.max(e,n.texture.updateTimestamp):n instanceof o||n instanceof t||n instanceof se||n instanceof P?e=Math.max(e,n.updateTimestamp):gi(n)?e=n.isReady?Math.max(e,n.updateTimestamp):1/0:Wr(n)&&(e=Math.max(e,(n.buffer instanceof P,n.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?.vs??null,t=this.pipeline?.fs??null;this.pipeline&&i.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let n=null,r=null;try{n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(n,r),this._pipelineNeedsUpdate=`shader creation failed`,e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r},vertexShader:n,fragmentShader:r,previousVertexShader:e,previousFragmentShader:t}}_finishPipelineUpdate(e){this._attributeInfos=We(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=i.level>3?0:$c;i.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,i.group(Qc,`>>> DRAWING MODEL ${this.id}`,{collapsed:i.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=lc(this.pipeline.shaderLayout,this.id);i.table(Qc,e)();let t=this.shaderInputs.getDebugTable();i.table(Qc,t)();let n=this._getAttributeDebugTable();i.table(Qc,this._attributeInfos)(),i.table(Qc,n)(),i.groupEnd(Qc)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;fc(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let n=s.getTypedArrayConstructor(t);return(e instanceof o?new n(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>ol(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??sl(t?.depthStencilAttachment?.texture?.format);(!yc(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function rl(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function il(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function al(e,t,n){if(gi(t)){let r=vi(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof P?t.buffer:Wr(t)?Kr(t):t}function ol(e){return e&&!cl(e)?e:null}function sl(e){return e&&cl(e)?e:void 0}function cl(e){return tl.includes(e)}var ll=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||Nc(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&o.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function ul(e,t){if(t instanceof ll)return t;let n=Is(t),r=dl(e,n),{attributes:i,bufferLayout:a}=fl(e,n);return new ll({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function dl(e,t){if(!t.indices)return;let n=t.indices.value;return e.createBuffer({usage:o.INDEX,data:n})}function fl(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout?.find(e=>e.name===r)?.name||Ps(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout||Fs(t.attributes),vertexCount:t.vertexCount}}var pl=class{attributes;indices;topology;vertexCount;bufferLayout;destroy(){}constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??`triangle-list`,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}};function ml(e){let t={};for(let[n,r]of Object.entries(e.attributes)){let i=e.bufferLayout.find(e=>e.name===n),a=i?.format,o=i?.byteStride??(a?C.getVertexFormatInfo(a).byteLength:0),s=e.indices&&o?Math.floor(r.byteLength/o):e.vertexCount;t[n]={name:n,format:a,length:s,byteStride:o,rowByteLength:o,bufferLayout:i,data:[{buffer:r,byteOffset:0,length:s,format:a,byteStride:o,rowByteLength:o}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[n,r]of Object.entries(t))t[n]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let n=e.indices,r=n?.indexType===`uint32`?4:n?.indexType===`uint8`?1:2,i=n?n.byteLength/r:0;return new pl({attributes:t,indices:n?{name:`indices`,format:n.indexType,length:i,byteStride:r,rowByteLength:r,data:[{buffer:n,byteOffset:0,length:i,format:n.indexType,byteStride:r,rowByteLength:r}]}:null,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}var hl=class extends nl{static defaultProps={...nl.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let n=t.geometry===void 0?new.target.defaultProps.geometry:t.geometry,r=n&&!(n instanceof pl)?ul(e,n):null,i=r?ml(r):n,a={...t,geometry:i instanceof pl?i:null};try{super(e,a)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=n,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=e&&!(e instanceof pl)?ul(this.device,e):null;let t=this._gpuGeometry?ml(this._gpuGeometry):e;super.setGeometry(t instanceof pl?t:null),e instanceof pl||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if(gi(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}},gl=`
struct View {extent: vec4f};
@group(0) @binding(0) var<uniform> view: View;
const CORNERS = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
const POCKETS = array<vec2f,6>(vec2f(-6,-3),vec2f(0,-3.13),vec2f(6,-3),vec2f(-6,3),vec2f(0,3.13),vec2f(6,3));
`,_l=gl+`
struct Vertex {@builtin(position) position: vec4f, @location(0) point: vec2f};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> Vertex {
 var output: Vertex; output.position = vec4f(CORNERS[index], 0, 1); output.point = CORNERS[index] * view.extent.xy; return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
 let point = input.point; let absolute = abs(point);
 var color = vec3f(0.10, 0.18, 0.16);
 if (absolute.x < 6.65 && absolute.y < 3.65) {
   let grain = 0.025 * sin(point.x * 5.0 + sin(point.y * 23.0));
   color = vec3f(0.26 + grain, 0.15 + grain * 0.5, 0.095);
 }
 if (absolute.x < 6.3 && absolute.y < 3.3) {color = vec3f(0.055, 0.22, 0.16);}
 if (absolute.x < 6.0 && absolute.y < 3.0) {
   let vignette = 1.0 - 0.12 * length(point / vec2f(6,3));
   color = vec3f(0.08, 0.36, 0.27) * vignette;
   // Subtle cloth detail and the head string.
   color += 0.004 * sin(point.x * 430.0) * sin(point.y * 430.0);
   if (abs(point.x + 3.0) < 0.008) {color += vec3f(0.015);}
 }
 for (var index = 0u; index < 6u; index++) {
   let distance = length(point - POCKETS[index]);
   if (distance < 0.47) {color = vec3f(0.17,0.12,0.07);}
   if (distance < 0.39) {color = vec3f(0.016,0.025,0.022);}
 }
 // Inlaid diamond sights: six per long rail (clear of the side pocket), three per short rail.
 let longSight = abs(fract((point.x + 0.75) / 1.5) - 0.5) * 1.5;
 let shortSight = abs(fract((point.y + 0.75) / 1.5) - 0.5) * 1.5;
 let longDiamond = longSight / 0.065 + abs(absolute.y - 3.46) / 0.055 < 1.0 && absolute.x > 0.75 && absolute.x < 5.5;
 let shortDiamond = shortSight / 0.065 + abs(absolute.x - 6.46) / 0.055 < 1.0 && absolute.y < 2.25;
 if (longDiamond || shortDiamond) {color = vec3f(0.78,0.70,0.50);}
 return vec4f(color, 1);
}`,vl=gl+`
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> orientations: array<vec4f>;
struct Vertex {@builtin(position) position: vec4f, @location(0) corner: vec2f, @location(1) @interpolate(flat) index: u32, @location(2) @interpolate(flat) orientation: vec4f};
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) index: u32) -> Vertex {
 let sphere = positions[index]; var output: Vertex;
 output.corner = CORNERS[vertex]; output.index = index; output.orientation = orientations[index];
 output.position = vec4f((sphere.xy + output.corner * sphere.w) / view.extent.xy, 0, 1);
 if (sphere.w <= 0.0) {output.position = vec4f(3,3,0,1);}
 return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
 let squared = dot(input.corner,input.corner); if (squared > 1.0) {discard;}
 let normal = vec3f(input.corner, sqrt(1.0-squared));
 let conjugate = -input.orientation.xyz;
 let local = normal + 2.0 * cross(conjugate, cross(conjugate, normal) + input.orientation.w * normal);
 let colors = array<vec3f,8>(vec3f(0.035),vec3f(0.96,0.69,0.08),vec3f(0.08,0.30,0.76),vec3f(0.83,0.12,0.10),vec3f(0.39,0.16,0.61),vec3f(0.97,0.36,0.06),vec3f(0.08,0.46,0.25),vec3f(0.51,0.10,0.15));
 var base = colors[input.index % 8u];
 let band = 1.0 - smoothstep(0.38-fwidth(local.z),0.38+fwidth(local.z),abs(local.z));
 if (input.index > 8u) {base = mix(vec3f(0.94,0.91,0.80),base,band);}
 if (input.index == 0u) {
   let cueBand = 1.0 - smoothstep(0.09,0.13,abs(local.z));
   base = mix(vec3f(0.97,0.94,0.84),vec3f(0.23,0.34,0.30),cueBand);
 }
 let light = 0.45 + 0.55 * max(dot(normal,normalize(vec3f(-0.4,0.5,1))),0.0);
 let highlight = pow(max(dot(normal, normalize(vec3f(-0.3,0.4,1))),0.0),40.0) * 0.35;
 return vec4f(base * light + highlight,1);
}`;function yl(e,t,n){let r=e.createBuffer({byteLength:16,usage:o.UNIFORM|o.COPY_DST}),i={name:`view`,type:`uniform`,group:0,location:0},a=new hl(e,{id:`pool-table`,source:_l,vertexCount:6,bindings:{view:r},shaderLayout:{attributes:[],bindings:[i]}}),s=new hl(e,{id:`pool-balls`,source:vl,vertexCount:6,instanceCount:16,bindings:{view:r,positions:t,orientations:n},shaderLayout:{attributes:[],bindings:[i,{name:`positions`,type:`read-only-storage`,group:0,location:1,visibility:1},{name:`orientations`,type:`read-only-storage`,group:0,location:2,visibility:1}]}});return{draw(t){r.write(new Float32Array([...t,0,0]));let n=e.beginRenderPass({clearColor:[.1,.18,.16,1]});a.draw(n),s.draw(n),n.end(),e.submit()},destroy(){a.destroy(),s.destroy(),r.destroy()}}}var bl=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!Cl(t.style,n.style)&&(Sl(r,t.style),xl(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return xl(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function xl(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(wl(n),String(r))}function Sl(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(wl(n))}function Cl(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length?n.every(n=>e?.[n]===t?.[n]):!1}function wl(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var Tl=class extends bl{static defaultProps={...bl.defaultProps,panel:void 0,placement:`top-left`}},El=`data-deck-gl-community-panels-styles`,Dl=`.deck-widget {
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
`;function Ol(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function kl(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(Ol))return!0}return!1}function Al(e){if(e.querySelector(`style[${El}]`)||kl(e))return;let t=e.createElement(`style`);t.setAttribute(El,`true`),t.textContent=Dl,e.head.appendChild(t)}var jl={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Ml=`top-left`,Nl=`root`,Pl=class{deck;parentElement;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,deck:t=null,className:n}){this.deck=t,this.parentElement=e,this.className=n,Al(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),n&&this.parentElement.classList.add(n)}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!Fl(e.components,this.components)){let t=e.components.filter(Il);this._setComponents(t)}}finalize(){for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e}_addComponent(e){let{viewId:t=null,placement:n=Ml}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:Nl,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,jl[t]),r.append(i)),i}_updateContainers(){let e=this.deck,t=e?.width??this.parentElement.clientWidth,n=e?.height??this.parentElement.clientHeight;for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===Nl||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function Fl(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Il(e){return e instanceof bl}var Ll,H,Rl,zl,Bl,Vl,Hl,Ul,Wl,Gl,Kl,ql,Jl,Yl,Xl,Zl={},Ql=[],$l=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,eu=Array.isArray;function tu(e,t){for(var n in t)e[n]=t[n];return e}function nu(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function ru(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?Ll.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return iu(e,o,r,i,null)}function iu(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Rl,__i:-1,__u:0};return i==null&&H.vnode!=null&&H.vnode(a),a}function au(e){return e.children}function ou(e,t){this.props=e,this.context=t}function su(e,t){if(t==null)return e.__?su(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?su(e):null}function cu(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=tu({},t);a.__v=t.__v+1,H.vnode&&H.vnode(a),yu(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??su(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,xu(r,a,i),t.__e=t.__=null,a.__e!=n&&lu(a)}}function lu(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),lu(e)}function uu(e){(!e.__d&&(e.__d=!0)&&zl.push(e)&&!du.__r++||Bl!=H.debounceRendering)&&((Bl=H.debounceRendering)||Vl)(du)}function du(){try{for(var e,t=1;zl.length;)zl.length>t&&zl.sort(Hl),e=zl.shift(),t=zl.length,cu(e)}finally{zl.length=du.__r=0}}function fu(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||Ql,y=t.length;for(c=pu(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||Zl,p.__i=d,g=yu(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&wu(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=mu(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function pu(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=iu(null,o,null,null,null):eu(o)?o=e.__k[a]=iu(au,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=iu(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=hu(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=su(s)),Tu(s,s));return r}function mu(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=mu(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=su(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function hu(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>(u?1:0)){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function gu(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||$l.test(t)?n:n+`px`}function _u(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||gu(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||gu(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(Kl,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[Gl]=r[Gl]:(n[Gl]=ql,e.addEventListener(t,a?Yl:Jl,a)):e.removeEventListener(t,a?Yl:Jl,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function vu(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[Wl]==null)t[Wl]=ql++;else if(t[Wl]<n[Gl])return;return n(H.event?H.event(t):t)}}}function yu(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=H.__b)&&u(t);n:if(typeof T==`function`)try{if(_=t.props,v=T.prototype&&T.prototype.render,y=(u=T.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new T(_,b):(t.__c=d=new ou(_,b),d.constructor=T,d.render=Eu),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&T.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=tu({},d.__s)),tu(d.__s,T.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&T.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&T.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),Ql.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=H.__r,S=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),Ql.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++S<25);d.state=d.__s,d.getChildContext!=null&&(r=tu(tu({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),C=u!=null&&u.type===au&&u.key==null?Su(u.props.children):u,s=fu(e,eu(C)?C:[C],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(w=a.length;w--;)nu(a[w]);bu(t)}else t.__e=n.__e,t.__k=n.__k,e.then||bu(t);H.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=Cu(n.__e,t,n,r,i,a,o,c,l);return(u=H.diffed)&&u(t),128&t.__u?void 0:s}function bu(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(bu))}function xu(e,t,n){for(var r=0;r<n.length;r++)wu(n[r],n[++r],n[++r]);H.__c&&H.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){H.__e(e,t.__v)}})}function Su(e){return typeof e!=`object`||!e||e.__b>0?e:eu(e)?e.map(Su):e.constructor===void 0?tu({},e):null}function Cu(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||Zl,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(H.__m&&H.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&Ll.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||_u(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||_u(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),fu(t.type==`template`?e.content:e,eu(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&su(n,0),s,c),a!=null)for(l=a.length;l--;)nu(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&_u(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&_u(e,l,h,g[l],i))}return e}function wu(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){H.__e(e,n)}}function Tu(e,t,n){var r,i;if(H.unmount&&H.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||wu(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){H.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&Tu(r[i],t,n||typeof e.type!=`function`);n||nu(e.__e),e.__c=e.__=e.__e=void 0}function Eu(e,t,n){return this.constructor(e,n)}function Du(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),H.__&&H.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],yu(t,e=(!r&&n||t).__k=ru(au,null,[e]),i||Zl,Zl,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?Ll.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),xu(a,e,o)}function Ou(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,uu(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+ Xl++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}Ll=Ql.slice,H={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},Rl=0,ou.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=tu({},this.state);typeof e==`function`&&(e=e(tu({},n),this.props)),e&&tu(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),uu(this))},ou.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),uu(this))},ou.prototype.render=au,zl=[],Vl=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Hl=function(e,t){return e.__v.__b-t.__v.__b},du.__r=0,Ul=Math.random().toString(8),Wl=`__d`+Ul,Gl=`__a`+Ul,Kl=/(PointerCapture)$|Capture$/i,ql=0,Jl=vu(!1),Yl=vu(!0),Xl=0;var ku=0;Array.isArray;function U(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--ku,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return H.vnode&&H.vnode(l),l}var Au,W,ju,Mu,Nu=0,Pu=[],G=H,Fu=G.__b,Iu=G.__r,Lu=G.diffed,Ru=G.__c,zu=G.unmount,Bu=G.__;function Vu(e,t){G.__h&&G.__h(W,e,Nu||t),Nu=0;var n=W.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function Hu(e){return Nu=1,Uu(nd,e)}function Uu(e,t,n){var r=Vu(Au++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):nd(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=W,!W.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};W.__f=!0;var a=W.shouldComponentUpdate,o=W.componentWillUpdate;W.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},W.shouldComponentUpdate=i}return r.__N||r.__}function Wu(e,t){var n=Vu(Au++,3);!G.__s&&td(n.__H,t)&&(n.__=e,n.u=t,W.__H.__h.push(n))}function Gu(e,t){var n=Vu(Au++,4);!G.__s&&td(n.__H,t)&&(n.__=e,n.u=t,W.__h.push(n))}function Ku(e){return Nu=5,qu(function(){return{current:e}},[])}function qu(e,t){var n=Vu(Au++,7);return td(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function Ju(e,t){return Nu=8,qu(function(){return e},t)}function Yu(e){var t=W.context[e.__c],n=Vu(Au++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(W)),t.props.value):e.__}function Xu(){for(var e;e=Pu.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some($u),t.__h.some(ed),t.__h=[]}catch(n){t.__h=[],G.__e(n,e.__v)}}}G.__b=function(e){W=null,Fu&&Fu(e)},G.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Bu&&Bu(e,t)},G.__r=function(e){Iu&&Iu(e),Au=0;var t=(W=e.__c).__H;t&&(ju===W?(t.__h=[],W.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some($u),t.__h.some(ed),t.__h=[],Au=0)),ju=W},G.diffed=function(e){Lu&&Lu(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(Pu.push(t)!==1&&Mu===G.requestAnimationFrame||((Mu=G.requestAnimationFrame)||Qu)(Xu)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),ju=W=null},G.__c=function(e,t){t.some(function(e){try{e.__h.some($u),e.__h=e.__h.filter(function(e){return!e.__||ed(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],G.__e(n,e.__v)}}),Ru&&Ru(e,t)},G.unmount=function(e){zu&&zu(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{$u(e)}catch(e){t=e}}),n.__H=void 0,t&&G.__e(t,n.__v))};var Zu=typeof requestAnimationFrame==`function`;function Qu(e){var t,n=function(){clearTimeout(r),Zu&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);Zu&&(t=requestAnimationFrame(n))}function $u(e){var t=W,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),W=t}function ed(e){var t=W;e.__c=e.__(),W=t}function td(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function nd(e,t){return typeof t==`function`?t(e):t}var rd={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},id={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},ad=Ou(void 0);function od({panel:e,children:t}){let n=Yu(ad),r=Ku(null),[i,a]=Hu(`light`),o=sd(n??i,e.theme);return Gu(()=>{if(!n){let e=r.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=ud(t);a(t=>t===e?t:e)};n();let i=new MutationObserver(()=>{n()});for(let e of cd(t))i.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{i.disconnect()}}},[n]),U(ad.Provider,{value:o,children:U(`div`,{ref:r,"data-panel-theme-mode":o,style:ld(o),children:t})})}function sd(e,t){return t===`dark`?`dark`:t===`light`?`light`:t===`invert`?e===`dark`?`light`:`dark`:e}function cd(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function ld(e){return{...e===`dark`?id:rd}}function ud(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=dd(t.getComputedStyle(e).getPropertyValue(`--menu-background`).trim());return n&&fd(n)<.5?`dark`:`light`}function dd(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function fd([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}var pd;function md(e){let t=Math.max(220,Math.floor(e));return Number.isFinite(t)?t:360}function hd({panel:e,title:t,widthPx:n,maxHeightPx:r,open:i,collapsible:a,onOpenChange:o}){return U(`section`,{style:vd(n,r),"aria-label":t??`Panel box`,onPointerDown:K,onPointerMove:K,onPointerUp:K,onMouseDown:K,onMouseMove:K,onMouseUp:K,onTouchStart:K,onTouchMove:K,onTouchEnd:K,onClick:K,onContextMenu:K,onWheel:K,children:[t?U(`header`,{style:yd,children:a?U(`button`,{type:`button`,"aria-expanded":i,style:bd,onClick:()=>o(!i),children:[U(`span`,{children:t}),U(`span`,{"aria-hidden":`true`,style:xd(i),children:i?`▾`:`▸`})]}):U(`span`,{children:t})}):null,U(`div`,{style:Sd(i),children:e?U(od,{panel:e,children:e.content}):null})]})}var gd=class extends Tl{static defaultProps={...Tl.defaultProps,id:`box-panel-container`,placement:`bottom-left`,title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0};className=`deck-widget-box`;placement=pd.defaultProps.placement;title=pd.defaultProps.title;widthPx=pd.defaultProps.widthPx;collapsible=pd.defaultProps.collapsible;isOpen=pd.defaultProps.defaultOpen;#e=pd.defaultProps.panel;#t=null;#n=void 0;#r=!1;#i=!1;#a=void 0;constructor(e={}){super({...pd.defaultProps,...e}),this.setProps(this.props)}setProps(e){e.placement!==void 0&&(this.placement=e.placement),`title`in e&&(this.title=e.title),e.widthPx!==void 0&&(this.widthPx=md(e.widthPx)),e.collapsible!==void 0&&(this.collapsible=e.collapsible),this.#c(e),`panel`in e&&(this.#e=e.panel),this.#s(),super.setProps(e)}onRemove(){this.#t&&Du(null,this.#t)}onRenderHTML(e){this.#t=e,e.style.margin=`0`,this.#s()}onViewportChange(){this.#s()}#o=e=>{this.#i||(this.isOpen=e),this.#a?.(e),this.#s()};#s=()=>{this.#t&&(this.#n=_d(this.#t),Du(U(hd,{panel:this.#e,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#o}),this.#t))};#c(e){if(this.#i=e.open!==void 0,e.onOpenChange!==void 0&&(this.#a=e.onOpenChange),e.open!==void 0){this.isOpen=e.open,this.#r=!0;return}!this.#r&&e.defaultOpen!==void 0&&(this.isOpen=e.defaultOpen,this.#r=!0)}};pd=gd;function K(e){e.stopPropagation()}function _d(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow===`hidden`||n?.overflowX===`hidden`||n?.overflowY===`hidden`)&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}var vd=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...t===void 0?{}:{maxHeight:`${t}px`},boxSizing:`border-box`,display:`flex`,flexDirection:`column`,pointerEvents:`auto`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`12px`,background:`var(--menu-background, rgba(255, 255, 255, 0.96))`,backdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))`,overflow:`hidden`}),yd={padding:`14px 16px 10px`,fontSize:`18px`,fontWeight:700,lineHeight:1.2,color:`var(--button-text, currentColor)`},bd={width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`12px`,border:`none`,background:`none`,color:`inherit`,padding:`0`,margin:`0`,cursor:`pointer`,font:`inherit`,textAlign:`left`},xd=e=>({fontSize:`18px`,lineHeight:1,color:`var(--button-icon-idle, #616166)`,transform:e?`translateY(1px)`:`translateY(-1px)`}),Sd=e=>({display:e?`block`:`none`,flex:`1 1 auto`,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`0 16px 16px`});function Cd(e,t){let[n,r]=Hu(t),i=e!==void 0,a=i?e:n;return Wu(()=>{i&&r(e)},[i,e]),[a,Ju(e=>{i||r(e)},[i])]}var wd=class extends bl{static defaultProps={...bl.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){Du(ru(od,{panel:this},this.content),e)}onRemove(){this.rootElement&&Du(null,this.rootElement)}},Td=class extends wd{constructor({panels:e,id:t=`tabbed-panels`,title:n=`Panels`,tabListLayout:r=`wrap`,theme:i=`inherit`}){super({id:t,title:n,theme:i,content:U(Ed,{panels:e,tabListLayout:r})})}};function Ed({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=Cd(r,n),c=qu(()=>e.filter(e=>!e.disabled),[e]),l=qu(()=>o&&c.some(e=>e.id===o)?o:c[0]?.id,[o,c]);return Wu(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),U(`div`,{className:t,style:Dd,children:[U(`div`,{"data-panel-tabs":``,style:Od(a),children:e.map(e=>{let t=e.id===l;return U(`button`,{type:`button`,style:{...kd,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border, rgba(148, 163, 184, 0.35))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onPointerDown:t=>{if(e.disabled){t.stopPropagation();return}t.preventDefault(),s(e.id),i?.(e.id)},children:e.title},e.id)})}),U(`div`,{style:Ad,children:e.map(e=>{let t=e.id===l;return U(`div`,{"aria-hidden":!t,style:{...jd,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:U(od,{panel:e,children:e.content})},e.id)})})]})}var Dd={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--button-corner-radius, 8px)`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,color:`var(--menu-text, rgb(24, 24, 26))`};function Od(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`4px`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`4px 6px`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var kd={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`4px`,margin:0,padding:`4px 8px`,fontSize:`12px`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},Ad={display:`grid`,alignItems:`start`,padding:`10px`,overflow:`auto`},jd={gridArea:`1 / 1`,minWidth:0};function Md({className:e,onRenderHTML:t}){let n=Ku(null);return Gu(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),U(`div`,{ref:n,className:e})}var Nd=class extends wd{constructor({id:e,title:t,onRenderHTML:n,disabled:r,keepMounted:i,className:a,theme:o=`inherit`}){super({id:e,title:t,theme:o,disabled:r,keepMounted:i,content:U(Md,{className:a,onRenderHTML:n})})}},Pd=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],Fd={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function Id(e,t){let n=Fd[t];for(let[t,r]of Pd)e.style.setProperty(r,n[t])}function Ld(e){for(let[,t]of Pd)e.style.removeProperty(t)}var Rd=`data-example-panel-host`,zd=`data-example-settings-panel`,Bd=`data-example-settings-sections`,Vd=`example-source`,Hd=`/examples/`,Ud=`data-example-panel-appearance`;`${Ud}${zd}${zd}${zd}${zd}${zd}${Bd}${zd}${Bd}`;function Wd({id:e,title:t,html:n,onRender:r}){return new Nd({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function Gd({id:e,title:t,content:n}){return new Nd({id:e,title:t,onRenderHTML:e=>(Du(ru(au,{},n),e),()=>Du(null,e))})}function Kd(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===Vd),i=Yd()&&!r?[...e.panels,qd(t)]:e.panels;return new Td({...n,panels:i})}function qd(e){return Gd({id:Vd,title:`Source`,content:ru(Jd,{sourcePaths:e})})}function Jd({sourcePaths:e}){let[t,n]=Hu({});return Wu(()=>{let t=e??Xd();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return Zd(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?ru(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):ru(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},ru(`code`,{},t.source??`// Loading source…`))}function Yd(){return typeof window<`u`&&!!window.website}function Xd(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(Hd);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function Zd(e,t){let n=window.location.pathname.indexOf(Hd),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}function Qd(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute(Rd,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(Ud,r),r===`cinematic`||r===`light`?Id(e,r):Ld(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?Fd[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}function $d(e){let t=/^(r|rg|rgba|bgra)(8unorm|8snorm|16float|32float)(-srgb)?$/.exec(e.format??``);if(!t||!e.width||!e.height)return;let n=t[1]===`r`?1:t[1]===`rg`?2:4,r=t[2],i=r===`16float`?2:r===`32float`?4:1,a=e.width*e.height;if(e.data.byteLength!==a*n*i)return;let o=new DataView(e.data.buffer,e.data.byteOffset,e.data.byteLength),s=new Uint8ClampedArray(a*4),c=e=>{let t=e*i;if(r===`8unorm`)return o.getUint8(t)/255;if(r===`8snorm`)return Math.max(-1,o.getInt8(t)/127);if(r===`32float`)return o.getFloat32(t,!0);let n=o.getUint16(t,!0),a=n&32768?-1:1,s=n>>10&31,c=n&1023;return a*(s===31?c?NaN:1/0:s===0?c*2**-24:(1+c/1024)*2**(s-15))};for(let e=0;e<a;e++)for(let r=0;r<4;r++){let i=t[1]===`bgra`&&r<3?2-r:r,a=r===3?1:0;i<n?a=c(e*n+i):n===1&&r<3&&(a=c(e)),a=Number.isNaN(a)?0:Math.max(0,Math.min(1,a)),r<3&&!t[3]&&(a=a<=.0031308?12.92*a:1.055*a**(1/2.4)-.055),s[e*4+r]=Math.round(a*255)}return s}function ef(e,t){let n=$d(t);if(!n)return;let r=e.createElement(`canvas`);return r.width=t.width,r.height=t.height,r.setAttribute(`role`,`img`),r.setAttribute(`aria-label`,`Current texture allocation, top-left ${r.width} by ${r.height} pixels; display range 0 to 1`),r.title=`Current allocation · top-left crop · display range 0–1`,r.getContext(`2d`)?.putImageData(new ImageData(n,r.width,r.height),0,0),r.style.cssText=`width:${128*r.width/Math.max(r.width,r.height)}px;max-width:100%;height:auto;image-rendering:pixelated;background:repeating-conic-gradient(#888 0% 25%,#bbb 0% 50%) 0/12px 12px`,r}var tf=1,nf=class{element;document;trigger;valueElement;listbox;ariaLabel;onChange;options;selectedValue=null;activeIndex=-1;disabled;openState=!1;destroyed=!1;typeaheadText=``;typeaheadTimer=null;constructor(e,t){this.document=e.ownerDocument,this.options=[...t.options],this.ariaLabel=t.ariaLabel??`Select option`,this.onChange=t.onChange,this.disabled=t.disabled??!1;let n=tf++,r=`compact-dropdown-trigger-${n}`,i=`compact-dropdown-listbox-${n}`;this.element=this.document.createElement(`div`),this.element.dataset.compactDropdown=``,this.element.innerHTML=`<style>${rf}</style>`,this.trigger=this.document.createElement(`button`),this.trigger.id=r,this.trigger.type=`button`,this.trigger.setAttribute(`role`,`combobox`),this.trigger.setAttribute(`aria-label`,this.ariaLabel),this.trigger.setAttribute(`aria-haspopup`,`listbox`),this.trigger.setAttribute(`aria-controls`,i),this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.dataset.compactDropdownTrigger=``,this.valueElement=this.document.createElement(`span`),this.valueElement.dataset.compactDropdownValue=``;let a=this.document.createElement(`span`);a.dataset.compactDropdownChevron=``,a.setAttribute(`aria-hidden`,`true`),this.trigger.append(this.valueElement,a),this.element.append(this.trigger),this.listbox=this.document.createElement(`div`),this.listbox.id=i,this.listbox.hidden=!0,this.listbox.setAttribute(`role`,`listbox`),this.listbox.setAttribute(`aria-label`,this.ariaLabel),this.listbox.dataset.compactDropdownPopup=``,e.append(this.element),this.document.body.append(this.listbox),this.trigger.addEventListener(`click`,this.handleTriggerClick),this.trigger.addEventListener(`keydown`,this.handleKeyDown),this.listbox.addEventListener(`click`,this.handleOptionClick),this.listbox.addEventListener(`pointermove`,this.handleOptionPointerMove),this.document.addEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.addEventListener(`focusin`,this.handleDocumentFocusIn),this.renderOptions();let o=t.value??this.getFirstEnabledOption()?.value;o!==void 0&&this.setValue(o),this.updateDisabledState()}get value(){return this.selectedValue}set value(e){e===null?(this.selectedValue=null,this.activeIndex=-1,this.updateSelection()):this.setValue(e)}setValue(e,t={}){let n=this.options.find(t=>t.value===e);if(!n)return!1;let r=this.selectedValue!==e;return this.selectedValue=e,this.activeIndex=this.options.indexOf(n),this.updateSelection(),r&&t.emitChange&&this.onChange?.(e,n),!0}setOptions(e){this.options=[...e],this.selectedValue=this.options.find(e=>e.value===this.selectedValue)?.value??this.getFirstEnabledOption()?.value??null,this.activeIndex=this.getSelectedIndex(),this.renderOptions(),this.updateSelection(),this.updateDisabledState(),this.openState&&this.updatePopupPosition()}setDisabled(e){this.disabled=e,this.updateDisabledState(),this.trigger.disabled&&this.close()}focus(){this.trigger.focus()}open(){this.openState||this.trigger.disabled||this.destroyed||(this.openState=!0,this.activeIndex=this.getSelectedIndex(),this.activeIndex<0&&(this.activeIndex=this.getNextEnabledIndex(-1,1)),this.listbox.hidden=!1,this.trigger.setAttribute(`aria-expanded`,`true`),this.element.dataset.open=`true`,this.updateActiveOption(!0),this.updatePopupPosition(),this.document.defaultView?.addEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.addEventListener(`scroll`,this.handleViewportChange,!0))}close(e={}){this.openState&&(this.openState=!1,this.listbox.hidden=!0,this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.removeAttribute(`aria-activedescendant`),delete this.element.dataset.open,this.document.defaultView?.removeEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.removeEventListener(`scroll`,this.handleViewportChange,!0),e.restoreFocus&&this.trigger.focus())}destroy(){this.destroyed||(this.close(),this.destroyed=!0,this.trigger.removeEventListener(`click`,this.handleTriggerClick),this.trigger.removeEventListener(`keydown`,this.handleKeyDown),this.listbox.removeEventListener(`click`,this.handleOptionClick),this.listbox.removeEventListener(`pointermove`,this.handleOptionPointerMove),this.document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.removeEventListener(`focusin`,this.handleDocumentFocusIn),this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.listbox.remove(),this.element.remove())}handleTriggerClick=()=>{this.openState?this.close():this.open()};handleKeyDown=e=>{switch(e.key){case`ArrowDown`:e.preventDefault(),this.openState?this.moveActiveOption(1):this.open();break;case`ArrowUp`:e.preventDefault(),this.openState?this.moveActiveOption(-1):this.open();break;case`Home`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(-1,1));break;case`End`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(this.options.length,-1));break;case`Enter`:case` `:e.preventDefault(),this.openState?this.selectActiveOption():this.open();break;case`Escape`:this.openState&&(e.preventDefault(),this.close({restoreFocus:!0}));break;case`Tab`:this.close();break;default:e.key.length===1&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.preventDefault(),this.openState||this.open(),this.moveActiveOptionByText(e.key));break}};handleOptionClick=e=>{let t=this.getOptionIndex(e.target);t<0||this.options[t]?.disabled||(this.activeIndex=t,this.selectActiveOption())};handleOptionPointerMove=e=>{let t=this.getOptionIndex(e.target);t>=0&&!this.options[t]?.disabled&&t!==this.activeIndex&&this.setActiveIndex(t)};handleDocumentPointerDown=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleDocumentFocusIn=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleViewportChange=()=>{this.openState&&this.updatePopupPosition()};renderOptions(){this.listbox.replaceChildren(...this.options.map((e,t)=>{let n=this.document.createElement(`div`);n.id=`${this.listbox.id}-option-${t}`,n.setAttribute(`role`,`option`),n.setAttribute(`aria-selected`,String(e.value===this.selectedValue)),e.disabled&&n.setAttribute(`aria-disabled`,`true`),n.dataset.compactDropdownOption=``,n.dataset.optionIndex=String(t);let r=this.document.createElement(`span`);r.textContent=e.label;let i=this.document.createElement(`span`);return i.dataset.compactDropdownStatus=``,i.setAttribute(`aria-hidden`,`true`),n.append(r,i),n}))}updateSelection(){let e=this.options.find(e=>e.value===this.selectedValue);this.valueElement.textContent=e?.label??`—`,this.trigger.title=e?.label??this.ariaLabel;for(let[e,t]of this.getOptionElements().entries())t.setAttribute(`aria-selected`,String(this.options[e]?.value===this.selectedValue));this.updateActiveOption(!1)}updateDisabledState(){this.trigger.disabled=this.disabled||!this.options.some(e=>!e.disabled)}moveActiveOption(e){this.setActiveIndex(this.getNextEnabledIndex(this.activeIndex,e))}moveActiveOptionByText(e){this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.typeaheadText+=e.toLocaleLowerCase();let t=this.getMatchingOptionIndex(this.typeaheadText);t<0&&this.typeaheadText.length>1&&(this.typeaheadText=e.toLocaleLowerCase(),t=this.getMatchingOptionIndex(this.typeaheadText)),t>=0&&this.setActiveIndex(t),this.typeaheadTimer=setTimeout(()=>{this.typeaheadText=``,this.typeaheadTimer=null},650)}getMatchingOptionIndex(e){for(let t=1;t<=this.options.length;t++){let n=(this.activeIndex+t+this.options.length)%this.options.length,r=this.options[n];if(!r?.disabled&&r.label.toLocaleLowerCase().startsWith(e))return n}return-1}getNextEnabledIndex(e,t){if(!this.options.length)return-1;let n=e;for(let e=0;e<this.options.length;e++)if(n=(n+t+this.options.length)%this.options.length,!this.options[n]?.disabled)return n;return-1}setActiveIndex(e){e<0||this.options[e]?.disabled||(this.activeIndex=e,this.updateActiveOption(!0))}updateActiveOption(e){let t=this.getOptionElements();for(let[e,n]of t.entries())e===this.activeIndex&&this.openState?n.dataset.active=`true`:delete n.dataset.active;let n=t[this.activeIndex];this.openState&&n&&(this.trigger.setAttribute(`aria-activedescendant`,n.id),e&&n.scrollIntoView({block:`nearest`}))}selectActiveOption(){let e=this.options[this.activeIndex];!e||e.disabled||(this.setValue(e.value,{emitChange:!0}),this.close({restoreFocus:!0}))}getFirstEnabledOption(){return this.options.find(e=>!e.disabled)}getSelectedIndex(){return this.options.findIndex(e=>e.value===this.selectedValue)}getOptionIndex(e){let t=e?.closest(`[data-compact-dropdown-option]`);return!t||!this.listbox.contains(t)?-1:Number(t.dataset.optionIndex??-1)}getOptionElements(){return Array.from(this.listbox.querySelectorAll(`[role="option"]`))}updatePopupPosition(){let e=this.document.defaultView;if(!e)return;let t=this.trigger.getBoundingClientRect(),n=Math.min(Math.max(t.width,128),e.innerWidth-8),r=Math.max(4,Math.min(t.left,e.innerWidth-n-4)),i=e.innerHeight-t.bottom-3-4,a=t.top-3-4,o=Math.min(176,this.options.length*20+2),s=i<Math.min(o,80)&&a>i,c=s?a:i;Object.assign(this.listbox.style,{left:`${r}px`,top:s?`auto`:`${t.bottom+3}px`,bottom:s?`${e.innerHeight-t.top+3}px`:`auto`,width:`${n}px`,maxHeight:`${Math.max(40,Math.min(176,c))}px`})}},rf=`
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
`,af=0;function of(e){let t=e.createElement(`div`);t.id=`gpu-operation-tooltip-${af++}`,t.setAttribute(`role`,`tooltip`),t.setAttribute(`data-gpu-operation-tooltip`,``),t.hidden=!0,Object.assign(t.style,{position:`fixed`,zIndex:`2147483647`,pointerEvents:`none`,boxSizing:`border-box`,width:`560px`,maxWidth:`calc(100vw - 24px)`,maxHeight:`min(440px, calc(100vh - 24px))`,overflow:`hidden`,padding:`18px`,border:`1px solid rgb(125 170 212 / 32%)`,borderRadius:`12px`,background:`linear-gradient(145deg, #111e30, #080f1b 70%)`,color:`#e4effc`,boxShadow:`0 8px 28px rgb(0 0 0 / 45%)`,font:`14px/1.5 system-ui, sans-serif`,whiteSpace:`normal`,overflowWrap:`anywhere`});let n=e.createElement(`style`);return n.textContent=df,t.append(n),e.body.append(t),t}function sf(e,t){let n=t.getBoundingClientRect(),r=t.ownerDocument.documentElement,i=e.getBoundingClientRect();e.style.left=`${Math.max(12,Math.min(n.left,r.clientWidth-i.width-12))}px`;let a=n.bottom+i.height+12<r.clientHeight?n.bottom+6:n.top-i.height-6;e.style.top=`${Math.max(12,Math.min(a,r.clientHeight-i.height-12))}px`}function cf(e,t=e.id){let n=[t];if(e.description&&n.push(e.description),e.resources?.length){n.push(``,`Declared inputs / outputs`);for(let t of e.resources){let e=t.usage===`storage-read-write`||t.usage===`render-attachment`?`Input/output`:[`storage-write`,`copy-destination`].includes(t.usage)?`Output`:`Input`,r=t.width===void 0?t.length===void 0?void 0:`${t.length.toLocaleString()} rows`:`${t.width} × ${t.height}${t.depth&&t.depth>1?` × ${t.depth}`:``}`,i=t.byteLength===void 0?void 0:`${t.byteLength.toLocaleString()} B${t.byteOffset?` @ ${t.byteOffset.toLocaleString()}`:``}`;n.push(`${e}: ${t.id}`,`  ${[t.usage,t.format??t.kind,r,i].filter(Boolean).join(` · `)}`)}}return n.join(`
`)}function lf(e,t,n={}){let r=e.ownerDocument,i=r.createElement(`div`);i.className=`gpu-operation-content`;let a=(e,t,n,i)=>{let a=r.createElement(t);return a.className=n,a.textContent=i,e.append(a),a},o=a(i,`div`,`gpu-operation-header`,``),s=t.id.split(`-`).filter(Boolean).at(-1)??t.id,c=n.name??t.operation??s.replace(/([a-z])([A-Z])/g,`$1 $2`);if(a(o,`strong`,`gpu-operation-name`,c.charAt(0).toUpperCase()+c.slice(1)),t.type&&a(o,`span`,`gpu-operation-kind`,t.type===`render`?`draw`:t.type),a(i,`code`,`gpu-operation-id`,t.id),t.description&&a(i,`p`,`gpu-operation-description`,t.description),t.resources?.length){let e=a(i,`section`,`gpu-operation-resources`,``);a(e,`div`,`gpu-operation-section-label`,`Declared inputs / outputs`);let n=r.createElement(`table`);n.className=`gpu-operation-table`;let o=r.createElement(`caption`);o.textContent=`Declared resource inputs and outputs`,o.hidden=!0,n.append(o);let s=n.createTHead().insertRow();for(let e of[`Access`,`Resource`,`Format / shape`,`Size`]){let t=r.createElement(`th`);t.scope=`col`,t.textContent=e,s.append(t)}let c=n.createTBody(),l=t.id.slice(0,t.id.lastIndexOf(`-`)+1),u=t.resources.slice(0,6);for(let e of u){let t=c.insertRow(),n=e.usage===`storage-read-write`||e.usage===`render-attachment`?`In / out`:[`storage-write`,`copy-destination`].includes(e.usage)?`Output`:`Input`,r=a(t.insertCell(),`span`,`gpu-operation-access`,n);r.dataset.access=n;let i=a(t.insertCell(),`code`,`gpu-operation-resource-id`,l&&e.id.startsWith(l)?e.id.slice(l.length):e.id);i.title=`${e.id} · ${e.usage}`;let o=t.insertCell(),s=e.width===void 0?e.length===void 0?``:`${e.length.toLocaleString()} rows`:`${e.width} × ${e.height}${e.depth&&e.depth>1?` × ${e.depth}`:``}`,u=a(o,`code`,`gpu-operation-format`,[e.format??e.kind,s].filter(Boolean).join(` · `));u.title=u.textContent??``;let d=t.insertCell();d.className=`gpu-operation-size`,d.textContent=e.byteLength===void 0?`—`:e.byteLength>=1024?`${(e.byteLength/1024).toFixed(1)} KiB`:`${e.byteLength} B`,e.byteLength!==void 0&&(d.title=`${e.byteLength.toLocaleString()} bytes`),e.byteOffset&&(d.title+=` · offset ${e.byteOffset.toLocaleString()} bytes`)}e.append(n),uf(a(e,`div`,`gpu-operation-resource-overflow`,``),t.resources.length,u.length)}n.timing&&a(i,`div`,`gpu-operation-timing`,n.timing),e.querySelector(`.gpu-operation-content`)?.remove(),e.append(i);let l=e.hidden;e.hidden=!1;let u=i.querySelector(`tbody`),d=i.querySelector(`.gpu-operation-resource-overflow`);for(;u?.rows.length&&e.scrollHeight>e.clientHeight;)u.deleteRow(-1),uf(d,t.resources.length,u.rows.length),u.rows.length===0&&(u.closest(`table`).hidden=!0);e.hidden=l}function uf(e,t,n){let r=t-n;e.hidden=r===0,e.textContent=r?`+ ${r} more ${r===1?`resource`:`resources`}`:``}var df=`
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
`,ff=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:1}),pf=new Intl.NumberFormat(`en-US`,{notation:`compact`,maximumFractionDigits:1}),mf=class{element;graphLabels;nodeLabels;counterLabels;snapshot={graphs:[]};selectedGraphId=null;selectionIsManual=!1;graphOptionsSignature=``;memoryMarkup=``;nodeRows=new Map;counterRows=new Map;graphDropdown;tooltip;tooltipEvents=new AbortController;inspector;resourceRows=new Map;resources=new Map;activeResourceKey;previewGeneration=0;renderedGraphId;selectedResourceKey;viewerGeneration=0;pendingPreviews=new Map;thumbnailGeneration=0;activeNodeId;constructor(e,t={}){this.element=e,this.inspector=t.inspector,this.tooltip=of(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-graph-tooltip`,``);let n=e=>{let t=e.target.closest(`[data-resource-key]`);if(t&&this.element.contains(t)){this.showResourceTooltip(t);return}let n=e.target.closest(`[data-full-name]`);n&&this.element.contains(n)&&this.showTooltip(n)},r=e=>{let t=e.target.closest(`[data-full-name], [data-resource-key]`),n=e.relatedTarget;(!(n instanceof Node)||!t?.contains(n))&&this.hideTooltip()},i={signal:this.tooltipEvents.signal};e.addEventListener(`mouseover`,n,i),e.addEventListener(`focusin`,n,i),e.addEventListener(`mouseout`,r,i),e.addEventListener(`focusout`,r,i),e.addEventListener(`scroll`,()=>this.hideTooltip(),{...i,capture:!0}),e.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip();let t=e.target.closest(`[data-resource-key]`);t&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.selectResource(t.dataset.resourceKey))},i),e.ownerDocument.defaultView?.addEventListener(`resize`,()=>this.hideTooltip(),i),this.graphLabels=t.graphLabels??{},this.nodeLabels=t.nodeLabels??{},this.counterLabels=t.counterLabels??{},this.element.innerHTML=`<div data-gpu-command-graph-inspector>
      <style>${vf}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div role="tablist" aria-label="Graph inspector views">
          <button type="button" role="tab" aria-selected="true" data-inspector-tab="timings">Graph</button>
          <button type="button" role="tab" aria-selected="false" data-inspector-tab="resources">Graph Resources</button>
        </div>
        <div data-inspector-view="timings">
        <div class="graph-inspector-summary">
          ${yf(`encodings`,``,`encoding-count`)}
          ${yf(`CPU p50 / p95 (ms)`,``,`cpu-totals`)}
          ${yf(`GPU p50 / p95 (ms)`,``,`gpu-totals`)}
          ${yf(`GPU samples`,``,`gpu-samples`)}
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
    </div>`,e.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-inspector-tab]`);if(r){this.hideTooltip();for(let t of e.querySelectorAll(`[data-inspector-tab]`))t.setAttribute(`aria-selected`,String(t===r));for(let t of e.querySelectorAll(`[data-inspector-view]`))t.hidden=t.dataset.inspectorView!==r.dataset.inspectorTab}n.closest(`[data-texture-previews]`)&&this.refreshTextureThumbnails();let i=n.closest(`[data-resource-key]`);i&&this.selectResource(i.dataset.resourceKey),n.closest(`[data-resource-refresh]`)&&this.selectedResourceKey&&this.selectResource(this.selectedResourceKey)},i),this.graphDropdown=new nf(this.element.querySelector(`[data-graph-inspector-picker-host]`),{ariaLabel:`Graph`,options:[],onChange:e=>{this.hideTooltip(),this.selectedGraphId=e,this.selectionIsManual=!0,this.render()}})}update(e,t){if(this.snapshot=e,e.graphs.some(e=>e.id===this.selectedGraphId)||(this.selectedGraphId=null,this.selectionIsManual=!1),!this.selectionIsManual&&t){let n=e.graphs.find(e=>e.id===t);n&&(this.selectedGraphId=n.id)}this.selectedGraphId??=e.graphs[0]?.id??null,this.render()}destroy(){this.hideTooltip(),this.viewerGeneration++,this.thumbnailGeneration++,this.tooltipEvents.abort(),this.tooltip.remove(),this.graphDropdown.destroy(),this.element.replaceChildren(),this.nodeRows.clear(),this.counterRows.clear(),this.resourceRows.clear(),this.resources.clear()}showTooltip(e){this.activeResourceKey&&this.hideTooltip(),this.activeNodeId=e.getAttribute(`data-full-name`)??void 0;let t=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId)?.nodes.find(e=>e.id===this.activeNodeId);if(!t)return;let n=Tf(this.nodeLabels,t.id);lf(this.tooltip,t,{name:n===t.id?void 0:n}),this.tooltip.hidden=!1,sf(this.tooltip,e)}async showResourceTooltip(e){let t=e.dataset.resourceKey;if(this.activeResourceKey===t)return;this.hideTooltip(),this.activeResourceKey=t;let n=this.previewGeneration,r=this.resources.get(t),i=this.selectedGraphId;if(!r||!i)return;let a=this.tooltip.ownerDocument.createElement(`div`);a.className=`gpu-operation-content`;let o=this.tooltip.ownerDocument.createElement(`strong`);o.textContent=r.summary.id;let s=this.tooltip.ownerDocument.createElement(`div`);s.textContent=Df(r.summary);let c=this.tooltip.ownerDocument.createElement(`pre`);c.style.whiteSpace=`pre-wrap`,c.style.fontSize=`11px`,c.textContent=`Reading current GPU data…`,a.append(o,s,c),this.tooltip.querySelector(`.gpu-operation-content`)?.remove(),this.tooltip.append(a),this.tooltip.hidden=!1,sf(this.tooltip,e);try{if(!this.inspector)throw Error(`No live inspector is connected.`);let e=await this.readPreview(t,i,r);if(n!==this.previewGeneration)return;this.showTextureThumbnail(t,e),c.textContent=Of(e);let o=ef(this.tooltip.ownerDocument,e);o&&a.insertBefore(o,c)}catch(e){if(n!==this.previewGeneration)return;c.textContent=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`}n===this.previewGeneration&&sf(this.tooltip,e)}readPreview(e,t,n){let r=`${t}/${e}`,i=this.pendingPreviews.get(r);if(i)return i;let a=this.inspector?this.inspector.readResource(t,n.nodeId,n.index):Promise.reject(Error(`No live inspector is connected.`));return this.pendingPreviews.set(r,a),a.finally(()=>this.pendingPreviews.delete(r)).catch(()=>{}),a}async selectResource(e){this.hideTooltip();let t=this.resources.get(e),n=this.selectedGraphId;if(!t||!n)return;this.selectedResourceKey=e;let r=++this.viewerGeneration;for(let[t,n]of this.resourceRows)n.setAttribute(`aria-pressed`,String(t===e));let i=this.element.querySelector(`[data-resource-viewer]`);i.textContent=`${t.summary.id} · ${Df(t.summary)}\nReading current GPU data…`;try{let a=await this.readPreview(e,n,t);if(r!==this.viewerGeneration)return;this.showTextureThumbnail(e,a),i.textContent=`${t.summary.id} · ${Df(t.summary)}\n${Of(a)}`;let o=ef(i.ownerDocument,a);o&&i.prepend(o)}catch(e){r===this.viewerGeneration&&(i.textContent=`${t.summary.id}\nPreview unavailable: ${e instanceof Error?e.message:String(e)}`)}}showTextureThumbnail(e,t){let n=this.resourceRows.get(e);if(!n)return;let r=ef(n.ownerDocument,t);if(!r)return;let i=Math.max(r.width,r.height);r.style.width=`${48*r.width/i}px`,r.style.height=`${48*r.height/i}px`,r.style.flexShrink=`0`,n.removeAttribute(`title`),n.querySelector(`canvas`)?.remove(),n.prepend(r)}async refreshTextureThumbnails(){let e=this.selectedGraphId;if(!e)return;let t=++this.thumbnailGeneration,n=this.element.querySelector(`[data-texture-previews]`);n.disabled=!0;let r=[...this.resources].filter(([,e])=>e.summary.kind===`texture`).slice(0,32);n.textContent=`Reading up to 32 textures…`;try{for(let[n,i]of r){if(t!==this.thumbnailGeneration)return;this.resourceRows.get(n)?.querySelector(`canvas`)?.remove();try{let r=await this.readPreview(n,e,i);if(t!==this.thumbnailGeneration)return;this.showTextureThumbnail(n,r)}catch(e){if(t!==this.thumbnailGeneration)return;let r=this.resourceRows.get(n);r&&(r.title=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`)}}}finally{n.disabled=!1,n.textContent=`Refresh texture thumbnails`}}hideTooltip(){this.previewGeneration++,this.activeResourceKey=void 0,this.activeNodeId=void 0,this.tooltip.hidden=!0}render(){let e=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId),t=this.element.querySelector(`[data-graph-inspector-empty]`),n=this.element.querySelector(`[data-graph-inspector-content]`);if(!e){this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.thumbnailGeneration++,this.renderedGraphId=void 0,t.hidden=!1,n.hidden=!0;return}if(this.renderedGraphId!==e.id){this.thumbnailGeneration++;for(let e of this.resourceRows.values())e.querySelector(`canvas`)?.remove();this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`}this.renderedGraphId=e.id,this.resources.clear();for(let t of e.nodes)for(let[e,n]of(t.resources??[]).entries()){let{usage:r,...i}=n,a=JSON.stringify(i);this.resources.set(a,{nodeId:t.id,index:e,summary:n})}this.selectedResourceKey&&!this.resources.has(this.selectedResourceKey)&&(this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`),hf(this.element.querySelector(`[data-graph-inspector-resources]`),this.resourceRows,[...this.resources].map(([e,t])=>({id:e,...t})),(e,t)=>{e.className=`graph-inspector-resource`,e.tabIndex=0,q(e,`role`,`button`),q(e,`aria-pressed`,String(t.id===this.selectedResourceKey)),q(e,`data-resource-key`,t.id),q(e,`aria-describedby`,this.tooltip.id);let n=e.querySelector(`span`);n||(n=e.ownerDocument.createElement(`span`),e.append(n)),gf(n,`${t.summary.kind===`buffer`?`Buffer`:`Texture`} · ${t.summary.id} · ${Df(t.summary)}`)}),this.activeResourceKey&&!this.resources.has(this.activeResourceKey)&&this.hideTooltip(),t.hidden=!0,n.hidden=!1;let r=this.snapshot.graphs.map(e=>`${e.id}\u0000${this.getGraphLabel(e.id)}`).join(``);r!==this.graphOptionsSignature&&(this.graphDropdown.setOptions(this.snapshot.graphs.map(e=>({value:e.id,label:this.getGraphLabel(e.id)}))),this.graphOptionsSignature=r),this.graphDropdown.value!==e.id&&(this.graphDropdown.value=e.id);let i=e.stats.logicalTransientBytes+e.stats.logicalTransientTextureBytes,a=e.stats.reusedTransientBytes+e.stats.reusedTransientTextureBytes,o=i?a/i*100:0,s=e.totals.gpu.sampleCount;hf(this.element.querySelector(`[data-graph-inspector-nodes]`),this.nodeRows,e.nodes,(t,n)=>{t.hasChildNodes()||(t.className=`graph-inspector-node`,t.innerHTML=`<span><i></i><span data-node-label></span></span><strong data-node-cpu></strong><strong data-node-gpu></strong>`),q(t,`data-node-type`,n.type),q(t,`data-full-name`,n.id),q(t,`data-operation-details`,cf(n)),q(t,`aria-describedby`,this.tooltip.id),t.tabIndex=0,this.activeNodeId===n.id&&this.showTooltip(t);let r=t.querySelector(`i`),i=n.type===`render`?`draw`:n.type;q(r,`title`,i),q(r,`aria-label`,i);let a=Tf(this.nodeLabels,n.id);gf(t.querySelector(`[data-node-label]`),a===n.id?bf(n.id,e.id):a),gf(t.querySelector(`[data-node-cpu]`),xf(n.cpu)),gf(t.querySelector(`[data-node-gpu]`),xf(n.gpu))}),this.activeNodeId&&!e.nodes.some(e=>e.id===this.activeNodeId)&&this.hideTooltip(),hf(this.element.querySelector(`[data-graph-inspector-counter-rows]`),this.counterRows,e.counters,(e,t)=>{e.hasChildNodes()||(e.className=`graph-inspector-counter`,e.innerHTML=`<span></span><strong data-counter-latest></strong><strong data-counter-percentiles></strong>`),q(e,`title`,`${t.id} · ${t.sampleCount} samples`),gf(e.querySelector(`span`),this.getCounterLabel(t.id)),gf(e.querySelector(`[data-counter-latest]`),Cf(t.latestValue)),gf(e.querySelector(`[data-counter-percentiles]`),`${Cf(t.p50Value)} / ${Cf(t.p95Value)}`)}),this.setText(`encoding-count`,String(e.encodingCount)),this.setText(`cpu-totals`,xf(e.totals.cpu)),this.setText(`gpu-totals`,xf(e.totals.gpu)),this.setText(`gpu-samples`,`${s}${e.timingReadFailureCount?` · ${e.timingReadFailureCount} failed`:``}`);let c=`
      <span>${e.stats.nodeOrder.length} nodes</span>
      <span>${wf(e.stats.logicalResourceBytes)} logical</span>
      <span>${wf(e.stats.physicalTransientResourceBytes)} scratch</span>
      ${e.preflight?.annotatedNodeCount?`<span>${e.preflight.annotatedNodeCount}/${e.stats.nodeOrder.length} costed nodes</span>`:``}
      ${e.preflight?.maximumInvocationCount?`<span>${_f(e.preflight.maximumInvocationCount)} max invocations</span>`:``}
      ${e.preflight?.readByteLength?`<span>${wf(e.preflight.readByteLength)} max reads</span>`:``}
      ${e.preflight?.writeByteLength?`<span>${wf(e.preflight.writeByteLength)} max writes</span>`:``}
      <span>${o?`${o.toFixed(0)}% reuse`:`no reuse`}</span>
      <span>${s?`GPU timings sampled`:`CPU timings only`}</span>`;c!==this.memoryMarkup&&(this.element.querySelector(`[data-graph-inspector-memory]`).innerHTML=c,this.memoryMarkup=c);let l=this.element.querySelector(`[data-graph-inspector-counters]`);l.hidden=e.counters.length===0}setText(e,t){gf(this.element.querySelector(`[data-graph-inspector-${e}]`),t)}getGraphLabel(e){return Tf(this.graphLabels,e)}getCounterLabel(e){return Tf(this.counterLabels,e)}};function hf(e,t,n,r){let i=new Set(n.map(e=>e.id));for(let[e,n]of t)i.has(e)||(n.remove(),t.delete(e));for(let[i,a]of n.entries()){let n=t.get(a.id);n||(n=e.ownerDocument.createElement(`div`),t.set(a.id,n)),r(n,a);let o=e.children[i]??null;o!==n&&e.insertBefore(n,o)}}function gf(e,t){e.textContent!==t&&(e.textContent=t)}function q(e,t,n){e.getAttribute(t)!==n&&e.setAttribute(t,n)}function _f(e){return pf.format(e)}var vf=`
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
`;function yf(e,t,n){return`<span class="graph-inspector-metric"><span>${Ef(e)}</span><strong data-graph-inspector-${n}>${Ef(t)}</strong></span>`}function bf(e,t){let n=t.endsWith(`-graph`)?t.slice(0,-6):t,r=e.startsWith(`${n}-`)?e.slice(n.length+1):e;return r.length>32?`${r.slice(0,30)}…`:r}function xf(e){return e.p50Milliseconds===void 0?`—`:`${Sf(e.p50Milliseconds)} / ${Sf(e.p95Milliseconds??e.p50Milliseconds)}`}function Sf(e){return e.toFixed(e<1?3:2)}function Cf(e){return(e>=1e4?pf:ff).format(e)}function wf(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(1)} KiB`:e<1024**3?`${(e/1024**2).toFixed(1)} MiB`:`${(e/1024**3).toFixed(1)} GiB`}function Tf(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:t}function Ef(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Df(e){return e.kind===`buffer`?`${e.format??`raw bytes`} · ${e.byteLength??0} B @ ${e.byteOffset??0}`:`${e.format??e.kind} · ${e.width} × ${e.height} · mip ${e.baseMipLevel??0}, layer ${e.baseArrayLayer??0}`}function Of(e){let t=e.data,n,r=`bytes`;return/^float32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Float32Array(t.slice().buffer)),r=`float32`):/^uint32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Uint32Array(t.slice().buffer)),r=`uint32`):n=Array.from(t),`Current allocation · ${t.length} bytes read${e.width?` · top-left ${e.width} × ${e.height}`:``}\n${r}: ${n.slice(0,64).join(`, `)}${n.length>64?`, …`:``}`}function kf(e){let t=document.querySelector(`#pool-info`),n=new Ja({maxSamples:90}),r=n.observeGraph(e),i=null,a=0,o=-1/0,s=null,c=e.device.features.has(`timestamp-query`)?`GPU timings are sampled while this tab is visible.`:`GPU timestamp queries are unavailable; CPU encoding timings remain available.`,l=null;Id(t,`light`);let u=new gd({id:`pool-info-box`,title:`luma.gl · GPU Pool`,placement:`top-right`,widthPx:420,collapsible:!0,defaultOpen:!1,panel:Kd({id:`pool-info-tabs`,theme:`light`,panels:[Wd({id:`pool-about`,title:`About`,html:`<p>Free practice: pot any ball, in any order. A scratched cue ball returns after the shot.</p>
            <p>Move to aim. Hold Shoot to charge and release to shoot; Escape cancels. New Rack restores the table. Choose a practice setup to compare follow, draw and cushion spin.</p>
            <p>Physics stays on the GPU. Step-local triggers capture pockets; small snapshots check when balls settle. Cloth friction converts sliding to rolling, while cushions exchange spin and lose more rebound pace on harder impacts.</p>
            <p>Throw controls isolate linear and angular surface slip. These are experimental approximations, not measured billiards calibration. Shots are capped at 12 table units/s; exhausted collision budgets report discarded time.</p>`,onRender:e=>Qd(e,`light`)}),Wd({id:`pool-graph`,title:`GPU graph inspector`,html:`<p data-pool-timing-status></p><div data-pool-graph-inspector></div>`,onRender:t=>(Qd(t,`light`),l=t,t.querySelector(`[data-pool-timing-status]`).textContent=c,i=new mf(t.querySelector(`[data-pool-graph-inspector]`),{inspector:n,graphLabels:{[e.id]:`Pool physics`},nodeLabels:Object.fromEntries(e.stats.nodeOrder.map(e=>[e,Af(e)]))}),i.update(n.getSnapshot(),e.id),()=>{i?.destroy(),i=null,l=null})})]})}),d=new Pl({parentElement:t});return d.setProps({components:[u]}),{observation:r,sampleStep(t){if(!u.isOpen||!l?.getClientRects().length||s||t-o<500||!e.device.features.has(`timestamp-query`))return!1;o=t;let n=e.device.createQuerySet({type:`timestamp`,count:e.stats.nodeOrder.length*2});try{let t=e.device.createCommandEncoder({timeProfilingQuerySet:n}),i=r.encode(t,{parameters:void 0,coalesceComputePasses:!1});e.device.submit(t.finish()),s=r.recordGPUTimings(i).then(()=>void 0,e=>{c=`GPU timing read failed: ${String(e)}`}).finally(()=>{n.destroy(),s=null})}catch(e){throw n.destroy(),e}return!0},update(t){d.onRedraw({viewports:[],layers:[]}),u.isOpen&&i&&t-a>=250&&(a=t,i.update(n.getSnapshot(),e.id),l.querySelector(`[data-pool-timing-status]`).textContent=c)},destroy(){return d.finalize(),r.detach(),n.clear(),s}}}function Af(e){let t=e.replace(/^gpu-sphere-world-step-\d+-/,``),n=/^impact-(\d+)-(.+)$/.exec(t),r=(n?n[2]:t).replaceAll(`-`,` `);return r.charAt(0).toUpperCase()+r.slice(1)+(n?` · impact `+(Number(n[1])+1):``)}var jf=class{enabled=!0;context;output;noise;lastContact=new Map;unlock(){if(this.enabled)try{if(!this.context){this.context=new AudioContext,this.output=this.context.createGain(),this.output.gain.value=.32;let e=this.context.createDynamicsCompressor();e.threshold.value=-12,e.ratio.value=8,this.output.connect(e).connect(this.context.destination),this.noise=this.context.createBuffer(1,Math.ceil(this.context.sampleRate*.18),this.context.sampleRate);let t=this.noise.getChannelData(0);for(let e=0;e<t.length;e++)t[e]=Math.random()*2-1}this.context.resume().catch(()=>{})}catch{this.enabled=!1}}playCue(e){this.playImpact(330,.5+e*.45,.045,-.1)}playPocket(){this.playImpact(140,.5,.16,0)}playEvents(e,t){if(!this.enabled)return;let n=0;for(let r of e){if(r.kind!==`sphere-impact`&&r.kind!==`plane-impact`)continue;let e=r.body*1024+r.target+(r.kind===`plane-impact`?512:0);if(r.speed<.18||t-(this.lastContact.get(e)??-1e3)<60)continue;this.lastContact.set(e,t);let i=r.kind===`sphere-impact`;if(this.playImpact(i?470:180,Math.min(.8,.12+r.speed*.1),i?.045:.065,r.position[0]/7),++n>=8)break}}destroy(){this.context?.close().catch(()=>{}),this.context=void 0}playImpact(e,t,n,r){let i=this.context;if(!this.enabled||!i||i.state!==`running`||!this.output||!this.noise)return;let a=i.currentTime,o=i.createStereoPanner();o.pan.value=Math.max(-1,Math.min(1,r)),o.connect(this.output);let s=.96+Math.random()*.08;for(let[r,c,l]of[[.45,.55,1],[1,.6,.65],[1.73,.2,.35]]){let u=i.createOscillator();u.type=`sine`,u.frequency.value=e*r*s;let d=i.createGain();d.gain.setValueAtTime(1e-4,a),d.gain.exponentialRampToValueAtTime(t*c,a+7e-4),d.gain.exponentialRampToValueAtTime(1e-4,a+n*l),u.connect(d).connect(o),u.start(a),u.stop(a+n),u.onended=()=>{u.disconnect(),d.disconnect()}}let c=i.createBufferSource();c.buffer=this.noise;let l=i.createBiquadFilter();l.type=`lowpass`,l.frequency.value=Math.min(2600,e*5),l.Q.value=.5;let u=i.createGain();u.gain.setValueAtTime(t*1.7,a),u.gain.exponentialRampToValueAtTime(1e-4,a+.012),c.connect(l).connect(u).connect(o),c.start(a),c.stop(a+n+.005),c.onended=()=>{c.disconnect(),l.disconnect(),u.disconnect(),o.disconnect()}}};function Mf(e){let t=Math.max(0,e)%1950;return Math.min(100,t/1600*100)}function Nf(e,t,n){return e===`rack`&&n>0&&t>=n}function J(e){return document.querySelector(`#`+e)}var Y=J(`status`),X=J(`pool`),Z=J(`shoot`),Pf=J(`reset`),Q=J(`power`),Ff=J(`angle`),If=J(`practice`),Lf=document.querySelector(`#aim-line`),Rf=document.querySelector(`#cue-trail`),zf=document.querySelector(`#cue-trail-recent`),Bf=document.querySelector(`#cue-stick`),$=new jf;try{let e=null,t=await pe.createDevice({adapters:[at],optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:X,autoResize:!0},onError:t=>{e=t}}),n=e=>t.createBuffer({data:e,usage:o.STORAGE|o.COPY_SRC|o.COPY_DST}),r=n(ws()),i=new Float32Array(64),a=new Float32Array(64);for(let e=0;e<16;e++)i[e*4+3]=1,a[e*4]=Math.SQRT1_2,a[e*4+3]=Math.SQRT1_2;let s=n(i),c=n(a),l=new ys({count:16,continuous:!0,warmStarting:!0,maximumImpactSteps:4,broadPhase:`all-pairs`,eventCapacity:4096,triggers:Ss.map(e=>({center:e,radius:xs,capture:!0})),positions:r,velocities:s,orientations:c,maximumRadius:B,maximumContacts:15,timeStep:1/240,iterations:12,contactSkin:.002,restitution:.94,staticFriction:.06,dynamicFriction:.04,rollingResistance:.035,sleepAfter:.3,sleepLinearSpeed:.025,sleepAngularSpeed:.12,restitutionThreshold:.08,planes:Cs}),u=new pa(t);l.addToGraph(u);let d=await u.compileAsync(),f=kf(d),p=yl(t,r,c),m=await l.readState(),h=`aiming`,g=0,_=15,v=!1,y=0,b=0,x=0,S=0,C=[0,0],w=!0,T=!0,ee=0,E=performance.now(),te=0,D=null,ne=0,re=!0,ie=0,O=null,ae=null,oe=null,se=null,k=!1,ce=!1,le=0,ue=0,de=0,fe=0,me=new AbortController;function he(e){Q.value=String(Math.round(e)),J(`power-value`).textContent=Q.value+`%`,Q.style.setProperty(`--power`,Q.value+`%`)}function ge(){O=null,se=null;let e=ae;ae=null,e!==null&&Z.hasPointerCapture(e)&&Z.releasePointerCapture(e),Z.textContent=`Shoot`,Z.setAttribute(`aria-pressed`,`false`)}function _e(){h!==`aiming`||O!==null||($.unlock(),O=performance.now(),he(0),Z.textContent=`Release to shoot`,Z.setAttribute(`aria-pressed`,`true`),Y.value=`Charging — release to shoot · Esc to cancel`,j())}function ve(){O!==null&&(he(Mf(performance.now()-O)),ge(),Number(Q.value)>0?Te():(Y.value=`Shot cancelled.`,j()))}let ye=new Set,A=[];function j(){Z.disabled=h!==`aiming`,Q.disabled=h!==`aiming`||O!==null,Ff.disabled=h!==`aiming`;for(let e of[`center-spin`,`cut-throw`,`spin-throw`])J(e).disabled=h!==`aiming`;J(`contact-ball`).setAttribute(`aria-disabled`,String(h!==`aiming`)),J(`pot-count`).hidden=_===0,J(`score`).textContent=`${ye.size} / ${_}`,J(`shots`).textContent=`${g} ${g===1?`shot`:`shots`}`,J(`potted-balls`).textContent=ye.size?`Potted: ${[...ye].sort((e,t)=>e-t).join(` · `)}`:`All practice balls on the table`}function be(e){S=Math.atan2(Math.sin(e),Math.cos(e)),Ff.value=String(S*180/Math.PI),J(`angle-value`).textContent=`${Math.round(S*180/Math.PI)}°`}function xe(e,t){let n=Math.hypot(e,t),r=n>.8?.8/n:1;C=[e*r,t*r],J(`contact-marker`).style.left=`${50+C[0]*50}%`,J(`contact-marker`).style.top=`${50-C[1]*50}%`;let i=[C[1]>.08?`Follow`:C[1]<-.08?`Draw`:``,C[0]>.08?`Right`:C[0]<-.08?`Left`:``].filter(Boolean),a=i.length?i.join(` + `)+` spin`:`Center hit`;J(`spin-value`).textContent=a,J(`contact-ball`).setAttribute(`aria-label`,`Cue-ball contact point: ${a}. Arrow keys adjust; Home centers.`)}let M=J(`contact-ball`);function Se(e){if(h!==`aiming`)return;let t=M.getBoundingClientRect();xe(2*(e.clientX-t.left)/t.width-1,1-2*(e.clientY-t.top)/t.height)}M.onpointerdown=e=>{e.button!==0||h!==`aiming`||(M.focus(),M.setPointerCapture(e.pointerId),Se(e))},M.onpointermove=e=>{M.hasPointerCapture(e.pointerId)&&Se(e)},M.onkeydown=e=>{if(h!==`aiming`)return;let t={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]};e.key===`Home`?(e.preventDefault(),xe(0,0)):t[e.key]&&(e.preventDefault(),xe(C[0]+t[e.key][0],C[1]+t[e.key][1]))},J(`center-spin`).onclick=()=>xe(0,0),J(`cut-throw`).onclick=()=>{w=!w,l.update({cutInducedThrow:w}),J(`cut-throw`).setAttribute(`aria-pressed`,String(w))},J(`spin-throw`).onclick=()=>{T=!T,l.update({spinInducedThrow:T}),J(`spin-throw`).setAttribute(`aria-pressed`,String(T))};function Ce(){let e=X.clientWidth/X.clientHeight;return e>=1.85?[4*e,4]:[7.4,7.4/e]}function we(e){if(h!==`aiming`||!m[0].enabled)return;let t=X.getBoundingClientRect(),n=Ce(),r=[(2*(e.clientX-t.left)/t.width-1)*n[0],(1-2*(e.clientY-t.top)/t.height)*n[1]];be(Math.atan2(r[1]-m[0].position[1],r[0]-m[0].position[0]))}X.onpointerdown=e=>{if(O!==null){e.preventDefault();return}e.button!==0||h!==`aiming`||(X.focus(),oe=e.pointerId,X.setPointerCapture(e.pointerId),we(e),$.unlock())},X.onpointerup=e=>{e.button!==0||!X.hasPointerCapture(e.pointerId)||(oe=null,X.releasePointerCapture(e.pointerId),we(e),Te())},X.onpointermove=we,Q.oninput=()=>{J(`power-value`).textContent=Q.value+`%`,Q.style.setProperty(`--power`,Q.value+`%`)},Ff.oninput=()=>be(Number(Ff.value)*Math.PI/180);function Te(){h!==`aiming`||O!==null||(ce=!1,de=0,$.unlock(),A.length=0,A.push([m[0].position[0],m[0].position[1]]),h=`striking`,b=performance.now(),j(),Y.value=`Taking the shot…`)}Z.onpointerdown=e=>{e.button!==0||h!==`aiming`||O!==null||(e.preventDefault(),Z.focus(),ae=e.pointerId,Z.setPointerCapture(e.pointerId),_e())},Z.onpointerup=e=>{e.pointerId===ae&&(e.preventDefault(),ve())},Z.onpointercancel=Z.onlostpointercapture=()=>{O!==null&&(ge(),he(0),j())},Z.onkeydown=e=>{(e.code===`Space`||e.code===`Enter`)&&(e.preventDefault(),!e.repeat&&h===`aiming`&&O===null&&(se=e.code,_e()))},window.addEventListener(`keyup`,e=>{se===e.code&&(e.preventDefault(),ve())},{signal:me.signal}),Z.onclick=e=>{e.detail===0&&O===null&&Te()},window.addEventListener(`keydown`,e=>{e.key!==`Escape`||Pf.disabled||(O!==null||oe!==null||h===`striking`)&&(oe!==null&&X.hasPointerCapture(oe)&&X.releasePointerCapture(oe),oe=null,e.preventDefault(),ge(),he(0),h=`aiming`,Y.value=`Shot cancelled — ready to aim.`,j())},{signal:me.signal}),window.addEventListener(`blur`,()=>{O!==null&&(ge(),he(0),j())},{signal:me.signal}),J(`sound`).onclick=()=>{$.enabled=!$.enabled,$.enabled&&$.unlock(),J(`sound`).textContent=$.enabled?`Sound on`:`Sound off`,J(`sound`).setAttribute(`aria-pressed`,String($.enabled))},X.onkeydown=e=>{h===`aiming`&&(e.code===`Space`&&(e.preventDefault(),Te()),(e.key===`ArrowLeft`||e.key===`ArrowRight`)&&(e.preventDefault(),be(S+(e.key===`ArrowLeft`?1:-1)*Math.PI/180)))};async function Ee(){if(!Pf.disabled){Pf.disabled=!0,J(`reset-shot`).disabled=!0,If.disabled=!0,ne++,ge(),fe=0,h=`striking`,j();try{D&&await D;let e=await l.readEvents();le=e.exhaustedImpactSteps,ue=e.discardedSimulationTime;let t=ws(),n=If.value;_=n===`rack`?15:n===`cushion`?0:1,n!==`rack`&&(t.set(n===`cushion`?[2,-1,B,B]:[-2,0,B,B],0),t.set([0,0,B,B],4));for(let e=0;e<16;e++)l.teleportBody(e,[t[e*4],t[e*4+1],t[e*4+2]],[Math.SQRT1_2,0,0,Math.SQRT1_2]),l.setBodyEnabled(e,e<=_);m=await l.readState(),g=0,ye.clear(),A.length=0,v=!1,y=0,ee=0,be(n===`cushion`?Math.PI/9:0),xe(n===`cushion`?.65:0,n===`follow`?.65:n===`draw`?-.65:0),Q.value=n===`rack`?`85`:`60`,J(`power-value`).textContent=Q.value+`%`,Q.style.setProperty(`--power`,Q.value+`%`),J(`reset-shot`).hidden=n===`rack`,J(`cue-motion`).textContent=``,h=`aiming`,Y.value=n===`rack`?`Ready for the break.`:n===`cushion`?`Compare left and right spin, then try a softer or firmer shot.`:`Shoot straight at the object ball. Watch the cue ball after contact.`,j()}catch(t){e=t instanceof Error?t:Error(String(t))}finally{Pf.disabled=!1,J(`reset-shot`).disabled=!1,If.disabled=!1}}}Pf.onclick=()=>{If.value=`rack`,Ee()},J(`reset-shot`).onclick=()=>void Ee(),If.onchange=()=>void Ee();async function De(e,t){let[n,r,i]=await Promise.all([l.readEvents(),l.readState(),l.diagnostics.readAsync()]);if(!re||t!==ne||(m=r,h!==`rolling`))return;let a=vs(new Uint32Array(i.buffer,i.byteOffset,8));ce||=!!a.exhaustedImpactSteps||n.exhaustedImpactSteps!==le,le=n.exhaustedImpactSteps,de+=Math.max(0,n.discardedSimulationTime-ue),ue=n.discardedSimulationTime,f.observation.recordCounters({...a,discardedSimulationTime:n.discardedSimulationTime});let o=m[0];if(!v){for(let e of n.events)e.kind===`trail`&&A.push([e.position[0],e.position[1]]);A.length>1200&&A.splice(0,A.length-1200)}if(n.dropped)throw Error(`Physics event overflow: ${n.dropped}; reload to reset the table.`);let s=Math.hypot(o.velocity[0],o.velocity[1]),c=Math.hypot(o.velocity[0]-B*o.angularVelocity[1],o.velocity[1]+B*o.angularVelocity[0]);J(`cue-motion`).textContent=o.enabled?`Cue ball: ${s<.035?Math.hypot(...o.angularVelocity)>.15?`spinning`:`resting`:c>.03?`sliding`:`rolling`} · pace ${s.toFixed(1)} · sidespin ${Math.abs(o.angularVelocity[2]).toFixed(1)} rad/s`:``,ce&&(J(`cue-motion`).textContent+=` · Impact budget reached; ${(de*1e3).toFixed(2)} ms discarded. Try lower power.`),$.playEvents(n.events,e);let u=new Set(n.events.filter(e=>e.kind===`trigger`).map(e=>e.body));for(let e of m)!e.enabled&&!u.has(e.index)||!u.has(e.index)&&e.position[2]>-1&&Math.abs(e.position[0])<6.8&&Math.abs(e.position[1])<3.8||($.playPocket(),l.setBodyEnabled(e.index,!1),e.enabled=!1,e.index===0?(v=!0,Y.value=`Scratch — the cue ball returns when the shot settles.`):(ye.add(e.index),Y.value=`Ball ${e.index} potted.`),j());if(e-x>300&&Es(m)){if(y||=e,e-y>=350){if(!k){k=!0;try{await De(performance.now(),t)}finally{k=!1}return}if(v){let e=Ts(m);if(!e){Y.value=`No clear cue-ball position. Start a new rack.`,h=`complete`,j();return}l.teleportBody(0,e),l.setBodyEnabled(0,!0),m[0].position=e,m[0].enabled=!0,v=!1}h=_>0&&ye.size===_?`complete`:`aiming`,Nf(If.value,ye.size,_)&&(fe=performance.now()+1200),Y.value=h===`complete`?`Table cleared in ${g} shots.${fe?` New rack in a moment…`:` Nicely done.`}`:`Shot complete. Line up the next one.`,j()}}else y=0}function Oe(e,t,n){let r=Ce(),i=e=>[(e[0]/r[0]+1)*X.clientWidth/2,(1-e[1]/r[1])*X.clientHeight/2],a=i(t),o=i(n);for(let[t,n]of Object.entries({x1:a[0],y1:a[1],x2:o[0],y2:o[1]}))e.setAttribute(t,String(n))}function N(n){if(re)try{if(e)throw e;O!==null&&he(Mf(n-O)),fe&&n>=fe&&!Pf.disabled&&(fe=0,Ee());let r=Math.min((n-E)/1e3,.05);if(E=n,h===`striking`&&!Pf.disabled&&n-b>=180){let e=.3+11.7*(Number(Q.value)/100)**1.6;$.playCue(e/12);let t=[Math.cos(S),Math.sin(S)],r=Math.sqrt(1-C[0]**2-C[1]**2),i=m[0].position;l.applyImpulse(0,[t[0]*e,t[1]*e,0],[i[0]+B*(-t[0]*r+t[1]*C[0]),i[1]+B*(-t[1]*r-t[0]*C[0]),i[2]+B*C[1]]),h=`rolling`,g++,x=n,y=0,j(),Y.value=`Balls in motion…`}if(h===`rolling`&&!k){ee=Math.min(ee+r,12/240);let i=Math.floor(ee*240);ee-=i/240;let a=t.createCommandEncoder();for(let e=0;e<i;e++)e===0&&f.sampleStep(n)||f.observation.encode(a,{parameters:void 0});t.submit(a.finish()),!D&&n-te>=1e3/30&&(te=n,D=De(n,ne).catch(t=>{e=t instanceof Error?t:Error(String(t))}).finally(()=>{D=null}))}let i=Ce();p.draw(i),f.update(n);let a=A.map(e=>`${(e[0]/i[0]+1)*X.clientWidth/2},${(1-e[1]/i[1])*X.clientHeight/2}`);Rf.setAttribute(`points`,a.join(` `)),zf.setAttribute(`points`,a.slice(-12).join(` `));let o=(h===`aiming`||h===`striking`)&&!Pf.disabled;if(Bf.style.display=o?``:`none`,Lf.style.display=o?``:`none`,o){let e=m[0].position,t=[Math.cos(S),Math.sin(S)],r=.15+Number(Q.value)/100*.65,i=h===`striking`?Math.max(0,1-(n-b)/180)*r:r,a=Ce(),o=X.clientWidth/(a[0]*2),s=[e[0]-t[0]*(.21+i),e[1]-t[1]*(.21+i)];Bf.setAttribute(`transform`,`translate(${(s[0]/a[0]+1)*X.clientWidth/2},${(1-s[1]/a[1])*X.clientHeight/2}) rotate(${-S*180/Math.PI}) scale(${o})`),Oe(Lf,[e[0]+t[0]*.3,e[1]+t[1]*.3],[e[0]+t[0]*4,e[1]+t[1]*4])}ie=requestAnimationFrame(N)}catch(e){Y.value=`Pool stopped: ${String(e)}`,Z.disabled=!0}}Y.value=`Ready for the break.`,j(),ie=requestAnimationFrame(N),window.addEventListener(`pagehide`,()=>{re=!1;let e=f.destroy();me.abort(),ge(),cancelAnimationFrame(ie),Promise.allSettled([D,e]).then(()=>{$.destroy(),p.destroy(),d.destroy(),l.destroy(),r.destroy(),s.destroy(),c.destroy(),t.destroy()})},{once:!0})}catch(e){Y.value=`Unable to start WebGPU pool: ${String(e)}`}