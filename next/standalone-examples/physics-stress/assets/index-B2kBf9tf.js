const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./webgpu-device-DiYvQ6nh.js","./compute-pipeline-BLFqLe_b.js"])))=>i.map(i=>d[i]);
import{a as e,c as t,d as n,g as r,h as i,i as a,m as o,n as s,o as c,p as l,r as u,s as d,t as f,u as p,v as m}from"./compute-pipeline-BLFqLe_b.js";var h=Object.create,g=Object.defineProperty,_=Object.getOwnPropertyDescriptor,v=Object.getOwnPropertyNames,y=Object.getPrototypeOf,b=Object.prototype.hasOwnProperty,x=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),S=(e,t,n,r)=>{if(t&&typeof t==`object`||typeof t==`function`)for(var i=v(t),a=0,o=i.length,s;a<o;a++)s=i[a],!b.call(e,s)&&s!==n&&g(e,s,{get:(e=>t[e]).bind(null,s),enumerable:!(r=_(t,s))||r.enumerable});return e},C=(e,t,n)=>(n=e==null?{}:h(y(e)),S(t||!e||!e.__esModule?g(n,`default`,{value:e,enumerable:!0}):n,e));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var w=`set luma.log.level=1 (or higher) to trace rendering`,T="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",ee=class e{static defaultProps={...i,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=o;log=r;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw r.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),r.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);r.error(`This version of luma.gl has already been initialized`)()}r.log(1,`${this.VERSION} - ${w}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(T);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n)}catch(e){throw n.debug&&E(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(T);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||r.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?r.warn(`WebGL1 is not supported`,e)():r.warn(`Unknown handle type`,e)(),null)}};function E(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var D=new ee,O=class{get pageLoaded(){return j()}},k=m()&&typeof document<`u`,A=()=>k&&document.readyState===`complete`,te=null;function j(){return te||=A()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),te}var M=new WeakMap,ne=class e{static defaultProps={...s.defaultProps};static getDefaultPipelineFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new e(t),n.defaultPipelineFactory}static beginAsyncCompilation(e){if(M.has(e))throw Error(`An asynchronous pipeline compilation scope is already active`);let t=[];return M.set(e,t),t}static getAsyncCompilation(e){return M.get(e)}static endAsyncCompilation(e,t){if(M.get(e)!==t)throw Error(`The asynchronous pipeline compilation scope is not active`);M.delete(e)}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_pendingRenderPipelineCache={};_pendingComputePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...s.defaultProps,...e},n=this._renderPipelineCache,i=this._hashRenderPipeline(t),a=n[i]?.resource;if(a)n[i].useCount++,this.device.props.debugFactories&&r.log(3,`${this}: ${n[i].resource} reused, count=${n[i].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;a=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:l(`unnamed-cached`),_sharedRenderPipeline:e}),a.hash=i,n[i]={resource:a,useCount:1},this.device.props.debugFactories&&r.log(3,`${this}: ${a} created, count=${n[i].useCount}`)()}return a}async createRenderPipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createRenderPipelineAsync(e);let t={...s.defaultProps,...e},n=this._hashRenderPipeline(t);return await this._createPipelineAsync(this._renderPipelineCache,this._pendingRenderPipelineCache,n,()=>{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;return this.device.createRenderPipelineAsync({...t,id:t.id?`${t.id}-cached`:l(`unnamed-cached`),_sharedRenderPipeline:e})})}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...f.defaultProps,...e},n=this._computePipelineCache,i=this._hashComputePipeline(t),a=n[i]?.resource;return a?(n[i].useCount++,this.device.props.debugFactories&&r.log(3,`${this}: ${n[i].resource} reused, count=${n[i].useCount}, (id=${e.id})`)()):(a=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),a.hash=i,n[i]={resource:a,useCount:1},this.device.props.debugFactories&&r.log(3,`${this}: ${a} created, count=${n[i].useCount}`)()),a}async createComputePipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createComputePipelineAsync(e);let t={...f.defaultProps,...e},n=this._hashComputePipeline(t);return await this._createPipelineAsync(this._computePipelineCache,this._pendingComputePipelineCache,n,()=>this.device.createComputePipelineAsync({...t,id:t.id?`${t.id}-cached`:void 0}))}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&r.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(r.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&r.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}async _createPipelineAsync(e,t,n,r){let i=e[n];if(i)return i.useCount++,i.resource;let a=t[n];if(a)return a.useCount++,await a.promise;let o={promise:void 0,useCount:1};return o.promise=r().then(r=>{delete t[n];let i=e[n];return i?(i.useCount+=o.useCount,r.destroy(),r instanceof s&&this.releaseSharedRenderPipeline(r),i.resource):(r.hash=n,e[n]={resource:r,useCount:o.useCount},r)}).catch(e=>{throw delete t[n],e}),t[n]=o,await o.promise}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof s&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof f&&(t=this._computePipelineCache),e instanceof s&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){return`${this._getHash(e.shader.source)}/${this._getHash(JSON.stringify([e.shaderLayout,e.entryPoint??`main`,e.constants]))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e._uniformBlockLayouts)),o=this._getHash(JSON.stringify(e.bufferLayout)),{type:s}=this.device;switch(s){case`webgl`:let c=this._getHash(JSON.stringify(e.parameters));return`${s}/R/${t}/${n}V${r}T${e.topology}P${c}SL${i}UBL${a}BL${o}`;default:let l=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),u=this._getHash(JSON.stringify(e.parameters)),d=this._getWebGPUAttachmentHash(e);return`${s}/R/${t}/${n}V${r}T${e.topology}EP${l}P${u}SL${i}BL${o}A${d}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=e.depthStencilAttachmentFormat??(e.parameters?.depthWriteEnabled?this.device.preferredDepthFormat:null);return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}},re=class e{static defaultProps={...u.defaultProps};static getDefaultShaderFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new e(t),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&r.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let i=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:i,useCount:1},this.device.props.debugFactories&&r.log(3,`${this}: Created new shader ${i.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&r.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&r.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}},N=`modulepreload`,ie=function(e,t){return new URL(e,t).href},ae={},oe=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=ie(t,n),t in ae)return;ae[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:N,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},se=`core-features-and-limits`,ce=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function le(e){let t={};for(let n of ce){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function ue(e){return e.featureLevel??`core`}function de(e){let t=ue(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function fe(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(se)&&r.push(se);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function pe(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(se)?`core`:e===`best-available`?`compatibility`:e}function me(e,t){return e===`core`?`core`:pe(`compatibility`,t)}var he=new class extends O{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let n=ue(e),i=de(e),a;try{a=await this.requestGPUAdapter(i)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!a)throw Error(`Failed to request WebGPU adapter`);let o=await ge(a),s={},c=fe(a.features,n,e.optionalFeatures);c.length>0&&(s.requiredFeatures=c);let l={...n===`max`?le(a.limits):{},...e.requiredLimits};Object.keys(l).length>0&&(s.requiredLimits=l);let u;try{u=await a.requestDevice(s)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await _e(u);if(d){if(u.destroy(),t&&d.reason!==`destroyed`)return r.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}let{WebGPUDevice:f}=await oe(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-DiYvQ6nh.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url),p=pe(n,u.features),m={...e,featureLevel:p};r.groupCollapsed(1,`WebGPUDevice created`)();try{let e;try{e=new f(m,u,a,o)}catch(e){throw u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e})}let t=f.getCanvasContextProps(m);if(t)try{e.initializeCanvasContext(t)}catch(t){throw e.destroy(),Error(`WebGPU canvas initialization failed`,{cause:t})}return r.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),r.table(1,e.info)(),e}finally{r.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await oe(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-DiYvQ6nh.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1]),import.meta.url);if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await _e(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=me(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function ge(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return r.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function _e(e){return await Promise.race([e.lost,Promise.resolve(null)])}var ve=class e{static async createAsync(t,n){let r=!ne.getAsyncCompilation(t),i=r?ne.beginAsyncCompilation(t):ne.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&ne.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if(e.type!==`webgpu`)throw Error(`Kernel is only supported in WebGPU`);let{source:n,pipelineFactory:r,shaderFactory:i,debugShaders:a,...o}=t;this.device=e,this.id=t.id??`kernel`,this.source=n,this.pipelineFactory=r??ne.getDefaultPipelineFactory(e),this.shaderFactory=i??re.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:`compute`,source:this.source,debugShaders:a});let s={...o,shader:this.shader},c=ne.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(s);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(s)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}};function ye(e,t){let{bindings:n={},...r}=t;return{kernel:new ve(e,r),bindings:{...n}}}async function be(e,t){let{bindings:n={},...r}=t;return{kernel:await ve.createAsync(e,r),bindings:{...n}}}function xe(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function Se(e,t){for(let n of t)xe(e,n)}function Ce(e){return{...e,type:`compute`}}async function we(e,t){if(e.destroyed)throw Error(`Resource has been destroyed.`);if(e instanceof n){if(!(e.usage&n.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);let r=t.byteOffset??0,i=Math.min(256,t.byteLength??e.byteLength-r);if(r<0||i<0||r+i>e.byteLength)throw Error(`Preview range is outside the buffer.`);return{data:i?await e.readAsync(r,i):new Uint8Array,format:t.format}}let r=e.device.getTextureFormatInfo(e.format);if(r.packed)throw Error(`Packed texture previews are not supported.`);if(e.device.type!==`webgpu`)throw Error(`Texture previews require WebGPU.`);if(!((e.props.usage??0)&a.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);if(e.samples!==1||r.compressed||e.format.startsWith(`depth`)||e.format.startsWith(`stencil`))throw Error(`Preview requires a single-sample, uncompressed color texture.`);let i=t.baseMipLevel??0,o=Math.min(32,t.width??Math.max(1,e.width>>i)),s=Math.min(32,t.height??Math.max(1,e.height>>i)),c=e.computeMemoryLayout({width:o,height:s,depthOrArrayLayers:1}),l=e.device.createBuffer({byteLength:c.byteLength,usage:n.MAP_READ|n.COPY_DST}),u=e.device.createCommandEncoder();try{u.copyTextureToBuffer({sourceTexture:e,destinationBuffer:l,mipLevel:i,origin:[0,0,t.baseArrayLayer??0],width:o,height:s,depthOrArrayLayers:1,bytesPerRow:c.bytesPerRow}),e.device.submit(u.finish());let n=await l.readAsync(),a=o*r.bytesPerPixel,d=new Uint8Array(a*s);for(let e=0;e<s;e++)d.set(n.subarray(e*c.bytesPerRow,e*c.bytesPerRow+a),e*a);return{data:d,width:o,height:s,format:e.format}}finally{l.destroy(),u.destroy()}}var Te=n.DEBUG_DATA_MAX_LENGTH,Ee=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:r=!1,buffer:i,ownsBuffer:a=!0,...o}=t;if(i&&i.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(i&&(o.byteLength!==void 0||o.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let s=t.id||i?.id||l(`dynamic-buffer`),c={...o,id:s,usage:o.usage??i?.usage,indexType:o.indexType??i?.indexType};(c.usage||0)&n.INDEX&&!c.indexType&&(o.data instanceof Uint32Array?c.indexType=`uint32`:o.data instanceof Uint16Array?c.indexType=`uint16`:o.data instanceof Uint8Array&&(c.indexType=`uint8`)),delete c.data,delete c.byteOffset,this.device=e,this.id=s,this.props=c,this.usage=c.usage||0,this._debugDataEnabled=!!r,this._maxDebugDataByteLength=typeof r==`object`&&r.maxByteLength!==void 0?r.maxByteLength:Te,this._ownsBuffer=a,this._buffer=i??this.device.createBuffer({...o,id:s}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),o.data&&this._writeDebugData(o.data,o.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}},De={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function Oe(e){return e?Array.isArray(e)?e[0]??null:e:null}function ke(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=Oe(n);if(!e)return null;let{width:t}=Ae(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=Oe(n);return e?Ae(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=Oe(n[0]);return e?Ae(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=Oe(t);return r?Ae(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=Oe(e[t]);return r?Ae(r):null}default:return null}}function Ae(e){if(d(e))return c(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function je(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function Me(e){return ArrayBuffer.isView(e)}function Ne(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function Pe(e){let t=De[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function Fe(e,t){return 6*e+Pe(t)}function Ie(e){throw Error(`setTexture1DData not supported in WebGL.`)}function Le(e){return Array.isArray(e)?e:[e]}function Re(e,t,n,r){let i=Le(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(d(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(je(t))o.push({type:`texture-data`,data:t,textureFormat:Ne(t),z:a,mipLevel:e});else if(Me(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function ze(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Re(n,e[n]));return t}function Be(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Re(n,e[n]));return t}function Ve(e){let t=[];for(let[n,r]of Object.entries(e)){let e=Pe(n);t.push(...Re(e,r))}return t}function He(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=Fe(n,r);t.push(...Re(e,i))}}),t}var Ue=class t{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(e,n){this.device=e;let r=l(`dynamic-texture`),i=n;this.props={...t.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?We({...t,width:e.width,height:e.height,format:e.format}):[],i=`format`in e&&e.format!==void 0,o=`usage`in e&&e.usage!==void 0,s=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:ke(t)||{width:this.props.width||1,height:this.props.height||1};if(!s||s.width<=0||s.height<=0)throw Error(`${this} size could not be determined or was zero`);let c=Ge(this.device,n,s,{format:i?e.format:void 0}),l=c.format??this.props.format,u={...this.props,...s,format:l,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(l)&&!o&&(u.usage=a.SAMPLE|a.COPY_DST);let d=this.props.mipmaps&&!c.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(l);if(this.device.type===`webgpu`&&d){let e=this.props.dimension===`3d`?a.SAMPLE|a.STORAGE|a.COPY_DST|a.COPY_SRC:a.SAMPLE|a.RENDER|a.COPY_DST|a.COPY_SRC;u.usage|=e}let f=this.device.getMipLevelCount(u.width,u.height),p=c.hasExplicitMipChain?c.mipLevels:this.props.mipLevels===`auto`?f:Math.max(1,Math.min(f,this.props.mipLevels??1)),m={...u,mipLevels:p};this._texture=this.device.createTexture(m),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),c.subresources.length&&this._setTextureSubresources(c.subresources),this.props.mipmaps&&!c.hasExplicitMipChain&&!d&&r.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),d&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),r.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):r.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(t={}){this._checkReady();let n=t instanceof e?t:this.device.createSampler(t);this.texture.setSampler(n),this._sampler=n,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,r=e.height??this.texture.height,i=e.depthOrArrayLayers??this.texture.depth,a=this.texture.computeMemoryLayout({width:t,height:r,depthOrArrayLayers:i}),o=this.device.createBuffer({byteLength:a.byteLength,usage:n.COPY_DST|n.MAP_READ});this.texture.readBuffer({...e,width:t,height:r,depthOrArrayLayers:i},o);let s=this.device.createFence();return await s.signaled,s.destroy(),o}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),r.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=De[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=Ie(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=Re(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=ze(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=Be(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=Ve(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=He(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await Ye(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&r.warn(`${this} already destroyed`)}_checkReady(){this.isReady||r.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...a.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function We(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return Ie(e.data);case`2d`:return Re(0,e.data,t,n);case`3d`:return ze(e.data);case`2d-array`:return Be(e.data);case`cube`:return Ve(e.data);case`cube-array`:return He(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function Ge(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=qe(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=Ke(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?Je(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=qe(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=Ke(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function Ke(e){if(e.type===`texture-data`)return e.textureFormat??Ne(e.data)}function qe(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function Je(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function Ye(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(Ye));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(Ye)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}var Xe=/^vertex-list<([^<>]+)>$/,Ze=/^value-list<([^<>]+)>$/,Qe=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function $e(e){return Xe.test(e)}function et(e){return Ze.test(e)}function tt(e){let t=Xe.exec(e),n=Ze.exec(e),r=rt(e)?.elementFormat??t?.[1]??n?.[1]??e;try{p.getVertexFormatInfo(r)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return r}function nt(e){let t=tt(e),n=$e(e),r=et(e),i=rt(e),a=p.getVertexFormatInfo(t),o=a.byteLength*(i?.listSize??1);if(!Number.isSafeInteger(o))throw Error(`Unsupported GPUVector format ${e}`);let s=a.type,c=a.normalized,l=it(s,c);return{format:e,elementFormat:t,vertexList:n,valueList:r,fixedSizeList:!!i,...i?{listSize:i.listSize}:{},type:s,signedDataType:at(t,s),primitiveType:l,components:a.components,elementByteLength:a.byteLength,byteLength:o,integer:a.integer,signed:a.signed,normalized:c,...a.webglOnly?{webglOnly:!0}:{}}}function rt(e){let t=Qe.exec(e);if(!t)return;let n=Number(t[2]);if(!Number.isSafeInteger(n))return;let r=t[1];try{let e=p.getVertexFormatInfo(r);if(!Number.isSafeInteger(n*e.components)||!Number.isSafeInteger(n*e.byteLength))return}catch{return}return{elementFormat:r,listSize:n}}function it(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function at(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function ot(e){let t=0;return Object.freeze(e.map(e=>{let n=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,n}))}var st=class{values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function ct(e){let t=Ct(e.nodes),n=Ot(t,e.buffers.values()),r=kt(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return ut(e,t,o,i,a,n,r)}async function lt(e){let t=Ct(e.nodes),n=Ot(t,e.buffers.values()),r=kt(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=ne.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));ne.endAsyncCompilation(e.device,o);let[c,l]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),u=[],d=l.find(e=>e.status===`rejected`),f=d?.status===`rejected`?d.reason:void 0;for(let e of c)e.status===`fulfilled`?u.push(e.value):f??=e.reason;if(f){for(let e of u)e.executable.destroy?.();throw f}return ut(e,t,u,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function ut(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=Ft(c.map(e=>e.byteLength),`imported buffer capacities`),d=Ft(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=Pt(u,d,`logical buffer capacities`),p=Ft(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=Ft(g.map(Nt),`imported texture estimates`),y=Ft(_.map(Nt),`logical transient texture estimates`),b=Pt(v,y,`logical texture estimates`),x=Ft(o.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:Pt(f,b,`logical resource estimates`),physicalTransientResourceBytes:Pt(p,x,`physical transient resource estimates`)},w=ft(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:C,preflight:w}}function dt(e){if(`buffer`in e){let t=e.buffer,n=`buffer`in t?t:void 0;return Object.freeze({id:n?n.buffer.id:t.id,kind:`buffer`,usage:e.usage,byteOffset:n?.byteOffset??0,byteLength:n?n.length===0?0:(n.length-1)*n.byteStride+n.rowByteLength:t.byteLength,...n?{format:n.format,length:n.length}:{}})}let t=`texture`in e?e.texture:e.externalTexture;return Object.freeze({id:`texture`in t?t.texture.id:t.id,kind:`externalTexture`in e?`external-texture`:`texture`,usage:e.usage,width:t.width,height:t.height,...`texture`in t?{baseMipLevel:t.baseMipLevel,baseArrayLayer:t.baseArrayLayer,mipLevelCount:t.mipLevelCount,arrayLayerCount:t.arrayLayerCount,aspect:t.aspect}:{},...`format`in t?{format:t.format,depth:t.depth}:{}})}function ft(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,...e.description===void 0?{}:{description:e.description},type:e.type,resources:Object.freeze((e.resources??[]).map(dt)),...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])ht(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,vt(n.buffer).size));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?Pt(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function pt(e){return`buffer`in e?e.buffer:e}function mt(e){return`texture`in e?e.texture:e}function ht(e){return`buffer`in e}function gt(e){return`texture`in e}function _t(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>ht(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||pt(r.buffer)!==pt(n.buffer)||!bt(r.usage)&&!bt(n.usage))continue;let a=vt(r.buffer),o=vt(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=pt(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${yt(a)} and ${yt(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function vt(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function yt(e){return`${e.offset}–${e.offset+e.size} bytes`}function P(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function bt(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function xt(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function St(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function Ct(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(ht(t)){let n=pt(t.buffer);if(P(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(bt(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(gt(t)){let n=mt(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&wt(n.resource,t)&&(xt(t.usage)&&St(n.resource.usage)||St(t.usage)&&(xt(n.resource.usage)||St(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function wt(e,t){if(mt(e.texture)!==mt(t.texture))return!1;let n=Tt(e.texture),r=Tt(t.texture);return Et(n.aspect,r.aspect)&&Dt(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&Dt(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function Tt(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function Et(e,t){return e===`all`||t===`all`||e===t}function Dt(e,t,n,r){return e<n+r&&n<e+t}function Ot(e,t){let r=At(e,e=>ht(e)?pt(e.buffer):null),i=new Map;e.forEach((e,t)=>{if(!e.retainedBuffers?.length)return;let n=i.get(e.retainedBuffers);n?n.lastUse=t:i.set(e.retainedBuffers,{firstUse:t,lastUse:t})});for(let[e,t]of i)for(let n of e){if(!n.transient)continue;let e=r.get(n);r.set(n,{firstUse:Math.min(e?.firstUse??t.firstUse,t.firstUse),lastUse:Math.max(e?.lastUse??t.lastUse,t.lastUse)})}let a=[],o=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:r.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),s=new st((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),c=new Map,l=e=>{let t=e&(n.MAP_READ|n.MAP_WRITE),r=c.get(t);return r||(r=new st((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index),c.set(t,r)),r};for(let{buffer:e,lifetime:t}of o){if(!t)continue;for(;s.peek()&&s.peek().allocation.lastUse<t.firstUse;){let e=s.pop();l(e.allocation.usage).push(e)}let n=l(e.usage).pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:a.length},a.push(n.allocation));let{allocation:r}=n;r.byteLength=Math.max(r.byteLength,e.byteLength),r.usage|=e.usage,r.lastUse=t.lastUse,r.handles.push(e),s.push(n)}return a}function kt(e,t){let n=At(e,e=>gt(e)?mt(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&Mt(n.descriptor,e));n||(n={descriptor:jt(e),byteLength:Nt(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function At(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function jt(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function Mt(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function Nt(e){let n=0;for(let r=0;r<e.mipLevels;r++)n=Pt(n,t.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>r),height:e.dimension===`1d`?1:Math.max(1,e.height>>r),depth:e.dimension===`3d`?Math.max(1,e.depth>>r):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let r=n*e.samples;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return r}function Pt(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function Ft(e,t){return e.reduce((e,n)=>Pt(e,n,t),0)}var It=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},Lt=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},Rt=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=ot(this.data)}},zt=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},Bt=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},Vt=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}},Ht=4,Ut=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){Jt(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function Wt(e,t,n={}){Jt(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=F();for(;s<a.length;){let r=Gt(n,a[s]);if(s>e&&Kt(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||qt(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:Kt(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>Gt(e,t),F());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function F(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function Gt(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function Kt(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function qt(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function Jt(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function Yt(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var Xt=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i,a){this.readResource=a,this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let o=e.filter(e=>e.stats.condition?.outcome!==`skipped`),s=o.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:o.length,skippedNodeCount:e.length-o.length,computePassCount:n,coalescedComputeNodeCount:s-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},Zt=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);sn(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),ln(e,this.device),t&&mn(t,e,this.device);let n=this.addBuffer(new It(this,e,!1,t));if(t){let e=$t(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof Ee&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),ln(e,this.device),this.addBuffer(new It(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=nt(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return pn(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new Lt(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if($e(n)||et(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=nt(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new Rt({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=dn(e,this.device);return t&&hn(t,n,this.device),this.addTexture(new zt(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=dn(e,this.device);return this.addTexture(new zt(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),un(e,this.device),this.addExternalTexture(new Bt(this,e))}createTransientTexture(e){this.assertMutable();let t=dn(e,this.device);return this.addTexture(new zt(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new Vt(e,fn(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)Se(this,e.getCommandNodes(this));else if(`type`in e)xe(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),sn(this.device,`compilation`),this.compiled=!0,new Qt(ct({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}async compileAsync(){return this.assertMutable(),sn(this.device,`compilation`),this.compiled=!0,new Qt(await lt({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*Ht>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>ht(e)&&pt(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(ht(t)){let e=pt(t.buffer);this.assertBuffer(e),_n(e,t.usage)}else if(gt(t)){let e=mt(t.texture);this.assertTexture(e),vn(e,t.usage),yn(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}_t(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=$t(t.buffer),r={byteLength:en(t),usage:n.usage},i=t.buffer instanceof Ee?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof Ee?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&tn(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&tn(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&$t(n.defaultBuffer)===e&&tn(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&tn(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&tn(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},Qt=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(ht(t)){let e=pt(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(gt(t)){let e=mt(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=on(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return Wt(this.preflight,e,t)}createExecution(e,t={}){return new Ut({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,r,i){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(sn(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let a=cn(),o=this.resolveImportedBuffers(t.buffers??{});rn(t.frameTextures??{},t.externalTextures??{});let s=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),c=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of s.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of c.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of c.textures.values())this.consumedExternalTextures.add(e);let l=s.textures,u=e=>{let t=pt(e),n=t.transient?this.transientBuffers.get(t):o.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},d=e=>{let t=mt(e),n=t.transient?this.transientTextures.get(t):l.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},f=e=>{let t=d(e);if(e instanceof zt||Sn(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},p={commandEncoder:e,parameters:t.parameters,getBuffer:u,getTexture:d,getTextureView:f,getExternalTexture:e=>{let t=c.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},m=[],h,g=0,_=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,v=()=>{let e=h;h=void 0,e?.end()};try{for(let n=r;n<i;n++){let{node:r,executable:i}=this.compiledNodes[n],a=cn();if(r.condition?.source===`cpu`){let e=!1;try{e=r.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${r.condition.id}" failed for node "${r.id}": ${t}`)}if(!e){let e=cn();m.push({stats:{id:r.id,description:r.description,resources:this.preflight.nodes[n].resources,operation:r.workload?.operation,type:r.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:r.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(r.type){case`compute`:{h||(h=e.beginComputePass({id:r.id}),g++);let t=h;o=an(t,e),o&&(_=!1),t.pushDebugGroup(r.id);try{let e=r.condition?.source===`gpu`?r.condition:void 0,n=e?Yt(t,u(e.buffer),e.byteOffset??0,r.id):void 0;i.encode({...p,computePass:n?.computePass??t}),n?.assertDispatched()}finally{t.popDebugGroup()}_||v();break}case`render`:{v();let t=i,n=t.getRenderPassProps?.(p)??{id:r.id};if(r.attachments&&n.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${r.id}" cannot supply framebuffer with graph attachments`);if(r.attachments?.resolveTargets&&n.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${r.id}" cannot supply resolveTargets with graph attachments`);let a=r.attachments?this.getFramebuffer(r.id,r.attachments,f):void 0,s=r.attachments?.resolveTargets?.map(e=>e?f(e):null),c=e.beginRenderPass({...n,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=an(c,e),c.pushDebugGroup(r.id);try{t.encode({...p,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:v(),i.encode(p);break}let s=cn();m.push({stats:{id:r.id,description:r.description,resources:this.preflight.nodes[n].resources,operation:r.workload?.operation,type:r.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...r.condition?{condition:{id:r.condition.id,source:r.condition.source,outcome:r.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{v()}let y=cn();return new Xt(m,y-a,g,a,y,async(e,t)=>{if(this.destroyed)throw Error(`Graph has been destroyed.`);let r=this.compiledNodes.findIndex(({node:t})=>t.id===e),i=this.compiledNodes[r]?.node.resources?.[t],a=this.preflight.nodes[r]?.resources?.[t];if(!i||!a)throw Error(`Resource is unavailable.`);if(`externalTexture`in i)throw Error(`External images cannot be read back.`);let o=`buffer`in i?pt(i.buffer):mt(i.texture);if(`frameScoped`in o&&o.frameScoped)throw Error(`Frame textures expire after presentation.`);let s=`buffer`in i?u(i.buffer):d(i.texture),c=s instanceof n?this.transientBuffers:this.transientTextures;if(o.transient&&[...c].some(([e,t])=>e!==o&&t===s))throw Error(`Transient allocation is reused; logical contents are no longer available.`);return we(s,a)})}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);mn(a,i,this.device);let o=$t(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);hn(e.texture,a,this.device),n.set(a,nn(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);hn(o,a,this.device),n.set(a,nn(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);gn(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function $t(e){return e instanceof Ee?e.buffer:e}function en(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function tn(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function nn(e){if(e instanceof Ue){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function rn(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function an(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function on(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function sn(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function cn(){return globalThis.performance?.now()??Date.now()}function ln(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function un(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function dn(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,n===`3d`?r:1))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function fn(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function pn(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function mn(e,t,n){let r=$t(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function hn(e,t,n){let r=nn(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function gn(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function _n(e,t){let n=bn(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function vn(e,t){let n=xn(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function yn(e,t){if(e instanceof Vt&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function bn(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return n.STORAGE;case`uniform`:return n.UNIFORM;case`copy-source`:return n.COPY_SRC;case`copy-destination`:return n.COPY_DST;case`indirect`:return n.INDIRECT;case`vertex`:return n.VERTEX;case`index`:return n.INDEX}}function xn(e){switch(e){case`sampled`:return a.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return a.STORAGE;case`render-attachment`:return a.RENDER;case`copy-source`:return a.COPY_SRC;case`copy-destination`:return a.COPY_DST}}function Sn(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}function Cn(e){return e instanceof Rt?e.data:[e]}function wn(e,t){let n=t[0]?.length??0;if(t.some(e=>e.length!==n))throw Error(`Aligned vectors must have equal logical lengths`);let r=t.map(Cn),i=t.map(()=>0),a=t.map(()=>0),o=[],s=0;for(;s<n;){for(let e=0;e<r.length;e++)for(;r[e][i[e]]?.length===a[e];)i[e]++,a[e]=0;let t=r.map((e,t)=>e[i[t]]),n=Math.min(...t.map((e,t)=>e.length-a[t])),c=[];for(let r=0;r<t.length;r++){let i=t[r],o=t.findIndex((e,t)=>t<r&&e===i&&a[t]===a[r]);c.push(o>=0?c[o]:a[r]===0&&n===i.length?i:e.createDataView(i.buffer,{format:i.format,length:n,byteOffset:i.byteOffset+a[r]*i.byteStride,byteStride:i.byteStride,rowByteLength:i.rowByteLength}))}o.push(c);for(let e=0;e<a.length;e++)a[e]+=n;s+=n}return o}var Tn=Uint32Array.BYTES_PER_ELEMENT,En=256;function Dn(e,t,n){let r=nt(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%Tn!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function On(e,t){Dn(e,[`uint32`],t)}function kn(e,t){let n=An(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function An(e){let t=Math.floor(e.byteOffset/En)*En,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function I(e){if(e.byteOffset%Tn!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%En/Tn}function jn(e,t){if(e.buffer!==t.buffer||e.length===0||t.length===0)return!1;let n=e.byteOffset+(e.length-1)*e.byteStride+e.rowByteLength,r=t.byteOffset+(t.length-1)*t.byteStride+t.rowByteLength;return e.byteOffset<r&&t.byteOffset<n}function L(e,t,r,i,a=n.STORAGE){if(!Number.isSafeInteger(i)||i<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((a&n.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if($e(r)||et(r))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let o=nt(r),s=e.createTransientBuffer({id:t,byteLength:Math.max(i,1)*o.byteLength,usage:a});return e.createDataView(s,{format:r,length:i})}function Mn(e,t){let[n,r,i]=t;for(let[e,t]of[[`x`,n],[`y`,r],[`z`,i]])if(!Number.isSafeInteger(t)||t<0)throw Error(`compute dispatch ${e} workgroup count must be a non-negative safe integer`);return{...e,dispatchWorkgroups:Object.freeze([n,r,i])}}function Nn(e,t){let n=[...Object.entries(t.inputs??{}),...Object.entries(t.outputs)];for(let[,t]of n)if(An(t).size>e.device.limits.maxStorageBufferBindingSize)throw Error(`Active chunks must fit a storage binding`);let r=t.dispatch.x*t.dispatch.y*t.dispatch.z;return Mn(Ce({id:t.id,workload:{commandCount:1,maximumWorkgroupCount:r,maximumInvocationCount:r*(t.workgroupSize??256)},resources:[...Object.values(t.inputs??{}).map(e=>({buffer:e,usage:`storage-read`})),...Object.values(t.outputs).map(e=>({buffer:e,usage:`storage-read-write`}))],compile:({device:e})=>{let r=new ve(e,{id:t.id,source:t.source,shaderLayout:{bindings:n.map(([e],n)=>({name:e,group:0,location:n,type:n<Object.keys(t.inputs??{}).length?`read-only-storage`:`storage`}))}});return{encode:({computePass:e,getBuffer:i})=>{let a={};for(let[e,t]of n)a[e]=kn(t,i);r.dispatch(e,{bindings:a,x:t.dispatch.x,y:t.dispatch.y,z:t.dispatch.z})},destroy:()=>r.destroy()}}}),[t.dispatch.x,t.dispatch.y,t.dispatch.z])}var Pn=4294967295,Fn=4294967296;function In(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>Pn)throw Error(`${e} element count must be a non-negative uint32`);Rn(e,n);let i=Math.floor(r);if(!Number.isSafeInteger(i)||i<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let a=Math.max(1,Math.ceil(t/n)),o=Math.min(a,i),s=Math.min(Math.ceil(a/o),i),c=Math.ceil(a/o/s);if(c>i)throw Error(`${e} requires ${a} workgroups, exceeding the 3D dispatch limit of ${i} per dimension`);return{x:o,y:s,z:c}}function Ln(e,t){Rn(`GPU dispatch`,t);let n=Math.floor(Pn/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function Rn(e,t){if(!Number.isSafeInteger(t)||t<2||t>Pn||Fn%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function zn(e,t,n){let r=[],i=wn(e,[t.keys,t.values]),a=wn(e,[t.outputKeys,t.outputValues]),o=i.map(([i,a],o)=>{let s=`${t.id}-span-${o}`,c=L(e,`${s}-keys`,`uint32`,i.length),l=L(e,`${s}-values`,`uint32`,i.length),u=L(e,`${s}-ranks`,`uint32`,i.length);return r.push(...pr(new fr({id:s,keys:i,values:a,outputKeys:c,outputValues:l,algorithm:t.resolvedAlgorithm,direction:t.direction,keyBits:t.keyBits}),e,n)),{keys:c,values:l,ranks:u}}),s=t.resolvedAlgorithm===`radix`&&t.keyBits<32?2**t.keyBits-1:4294967295,c=t.direction===`ascending`?`<`:`>`;for(let[i,l]of o.entries()){let u=In(`GPUSort merge`,l.keys.length,256,n),d=Ln(u,256);r.push(Nn(e,{id:`${t.id}-ranks-${i}`,outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index < ${l.keys.length}u) { ranks[index] = index; }
}`}));for(let[n,a]of o.entries())n!==i&&r.push(Nn(e,{id:`${t.id}-rank-${i}-against-${n}`,inputs:{keys:l.keys,otherKeys:a.keys},outputs:{ranks:l.ranks},dispatch:u,source:`
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
}`}));let f=0;for(let[n,[o,s]]of a.entries())r.push(Nn(e,{id:`${t.id}-publish-${i}-${n}`,inputs:{keys:l.keys,values:l.values,ranks:l.ranks},outputs:{outputKeys:o,outputValues:s},dispatch:u,source:`
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
    outputKeys[${I(o)}u + localRank] = keys[index];
    outputValues[${I(s)}u + localRank] = values[index];
  }
}`})),f+=o.length}return r}function Bn(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var Vn=256,Hn=64;function Un(e,t=!1){return t?`portable`:Bn(e,{requiresSubgroupId:!0})}var Wn=class{id;input;output;mode;segmentFlags;constructor(e){if(this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,Xn(this.input,`${this.id} input`),Xn(this.output,`${this.id} output`),this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.output instanceof Rt&&this.output.length!==this.input.length)throw Error(`${this.id} vector output length must equal input length`);if(this.segmentFlags){if(Xn(this.segmentFlags,`${this.id} segmentFlags`),this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);if(this.segmentFlags instanceof Rt&&this.segmentFlags.length!==this.input.length)throw Error(`${this.id} vector segmentFlags length must equal input length`);let e=new Set(Zn(this.output).map(e=>e.buffer));if(Zn(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}getCommandNodes(e){let t=[];return t.push(...Gn(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function Gn(e,t,n){let r=[];Qn(t,e.input,e.id),Qn(t,e.output,e.id),e.segmentFlags&&Qn(t,e.segmentFlags,e.id);let i=Kn(t,e.output,e.input.length),a=e.segmentFlags?Kn(t,e.segmentFlags,e.input.length):void 0,o=a?wn(t,[e.input,i,a]):wn(t,[e.input,i]);return r.push(...qn(t,{id:e.id,inputChunks:o.map(e=>e[0]),outputChunks:o.map(e=>e[1]),segmentFlagChunks:a?o.map(e=>e[2]):void 0,isVector:o.length>1,mode:e.mode},n)),r}function Kn(e,t,n){return t.length===n||t instanceof Rt?t:e.createDataView(t.buffer,{format:t.format,length:n,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}function qn(e,t,n){let r=[],i=t.inputChunks,a=t.outputChunks,o=t.segmentFlagChunks,s=i.map((e,t)=>({chunkIndex:t,input:e,output:a[t],segmentFlags:o?.[t]})).filter(e=>e.input.length>0);if(s.length===0)return r;if(s.length===1){let i=s[0];return r.push(...Jn(e,{id:t.isVector?`${t.id}-chunk-${i.chunkIndex}`:t.id,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,maxComputeWorkgroupsPerDimension:n})),r}let c=L(e,`${t.id}-chunk-totals`,`uint32`,s.length),l=L(e,`${t.id}-chunk-offsets`,`uint32`,s.length),u=o?L(e,`${t.id}-chunk-segment-flags`,`uint32`,s.length):void 0,d=o?s.map(n=>L(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[i,a]of s.entries())r.push(...Jn(e,{id:`${t.id}-chunk-${a.chunkIndex}`,input:a.input,output:a.output,mode:t.mode,segmentFlags:a.segmentFlags,outputSegmentPrefixes:d?.[i],finalSum:Yn(e,c,i),finalSegmentFlag:u?Yn(e,u,i):void 0,maxComputeWorkgroupsPerDimension:n}));r.push(...Jn(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n}));for(let[i,a]of s.entries())r.push(...nr(e,{id:`${t.id}-chunk-${a.chunkIndex}-add-carry`,output:a.output,offsets:l,length:a.output.length,offsetIndex:i,segmentPrefixes:d?.[i],dispatchLayout:rr(a.output.length,n)}));return r}function Jn(e,t){let n=[];if(t.input.length===0)return n;let r=[],i=t.input,a=t.output,o=t.segmentFlags,s=t.input.length,c=0;for(;;){let l=Math.ceil(s/Vn),u,d;l>1&&(u=L(e,`${t.id}-level-${c}-block-sums`,`uint32`,l),o&&(d=L(e,`${t.id}-level-${c}-block-segment-flags`,`uint32`,l)));let f=o?c===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:l>1||c>0?L(e,`${t.id}-level-${c}-segment-prefixes`,`uint32`,s):void 0:void 0;if(n.push(...$n(e,{id:`${t.id}-level-${c}-scan`,input:i,output:a,mode:c===0?t.mode:`exclusive`,segmentFlags:o,segmentSummaryInput:!!o&&(c>0||t.segmentSummaryInput),segmentPrefixes:f,blockSums:u,blockSegmentFlags:d,finalSum:u?void 0:t.finalSum,finalSegmentFlag:u?void 0:t.finalSegmentFlag,length:s,blockCount:l,dispatchLayout:rr(s,t.maxComputeWorkgroupsPerDimension)})),r.push({output:a,length:s,segmentPrefixes:f}),!u)break;let p=L(e,`${t.id}-level-${c}-block-offsets`,`uint32`,l);r[r.length-1].blockOffsets=p,i=u,a=p,o=d,s=l,c++}for(let i=r.length-2;i>=0;i--){let a=r[i],o=r[i+1];n.push(...nr(e,{id:`${t.id}-level-${i}-add-offsets`,output:a.output,offsets:a.blockOffsets,length:a.length,segmentPrefixes:a.segmentPrefixes,offsetSegmentPrefixes:o.segmentPrefixes,dispatchLayout:rr(a.length,t.maxComputeWorkgroupsPerDimension)}))}return n}function Yn(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function Xn(e,t){let n=e instanceof Rt?e.data:[e];for(let e of n)On(e,t)}function Zn(e){return e instanceof Rt?e.data:[e]}function Qn(e,t,n){if((t instanceof Rt?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function $n(e,t){let n=[],r=t.blockSums??t.finalSum,i=t.blockSegmentFlags??t.finalSegmentFlag,a=r?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,o=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,s=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,c=i?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,l=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,u=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,d=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,f=t.segmentFlags?`if (lane >= stride) {
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
const INPUT_OFFSET: u32 = ${I(t.input)}u;
const OUTPUT_OFFSET: u32 = ${I(t.output)}u;
${r?`const SUM_OFFSET: u32 = ${I(r)}u;`:``}
${t.segmentFlags?`const SEGMENT_FLAGS_OFFSET: u32 = ${I(t.segmentFlags)}u;`:``}
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${I(t.segmentPrefixes)}u;`:``}
${i?`const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${I(i)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${a}
${o}
${s}
${c}
var<workgroup> scratch: array<u32, ${Vn}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${Vn}>;`:``}

@compute @workgroup_size(${Vn}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${ir(t.dispatchLayout)}
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

  for (var stride = 1u; stride < ${Vn}u; stride = stride * 2u) {
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

  if (lane == ${Vn-1}u) {
    ${l}
    ${u}
  }
  if (index < ELEMENT_COUNT) {
    ${m}
    ${h}
  }
}`,_=er(e,!!t.segmentFlags,t.length),v=_===`subgroups`?tr(t,r,a):g;return n.push(Ce({id:t.id,workload:{operation:`GPUScan`,variant:_,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*Vn,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...r?[{buffer:r,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...i?[{buffer:i,usage:`storage-write`}]:[]],compile:({device:e})=>{let n=new ve(e,{id:t.id,source:v,shaderLayout:{bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...r?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...i?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]}});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:kn(t.input,a),outputValues:kn(t.output,a)};r&&(o.sumValues=kn(r,a)),t.segmentFlags&&(o.segmentFlags=kn(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=kn(t.segmentPrefixes,a)),i&&(o.summarySegmentFlags=kn(i,a)),n.dispatch(e,{bindings:o,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>Mn(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function er(e,t,n){let r=Un(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||Un(e.device,!1)===`subgroups`}]}).variant}function tr(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/Vn)+1;return`
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${e.length}u;
const BLOCK_COUNT: u32 = ${e.blockCount}u;
const INPUT_OFFSET: u32 = ${I(e.input)}u;
const OUTPUT_OFFSET: u32 = ${I(e.output)}u;
${t?`const SUM_OFFSET: u32 = ${I(t)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${n}
var<workgroup> subgroupOffsets: array<u32, ${Hn}>;

@compute @workgroup_size(${Vn}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${Vn}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${Vn}u / subgroupSize;
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
  if (lane == ${Vn-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function nr(e,t){let n=[],r=t.offsetIndex===void 0?`index / ${Vn}u`:`${t.offsetIndex}u`,i=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${I(t.output)}u;
const OFFSETS_OFFSET: u32 = ${I(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${I(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${I(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${Vn}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${ir(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${r}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${r}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`;return n.push(Ce({id:t.id,workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*Vn,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new ve(e,{id:t.id,source:i,shaderLayout:{bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]}});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:kn(t.output,r),offsets:kn(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=kn(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=kn(t.offsetSegmentPrefixes,r)),n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>Mn(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function rr(e,t){return In(`GPUScan`,e,Vn,t)}function ir(e){return Ln(e,Vn)}var ar=256,or=256,sr=4,cr=or/32,lr=4294967295,ur=2147483648,dr=ar,fr=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])for(let n of Cn(t))On(n,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>ur)throw Error(`${this.id} supports at most ${ur} rows`);hr(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=dr?`bitonic`:`radix`:this.algorithm}getCommandNodes(e){let t=[];return t.push(...pr(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function pr(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])for(let r of Cn(n))if(r.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);return[e.keys,e.values,e.outputKeys,e.outputValues].some(e=>e instanceof Rt)?zn(t,e,n):mr(e,t,n)}function mr(e,t,n){let r=[];if(e.keys.length===0)return r;if(e.keys.length===1)return r.push(...gr(t,e)),r;let i=In(`GPUSort`,e.keys.length,or,n);return e.resolvedAlgorithm===`bitonic`?r.push(..._r(t,e,i,n)):r.push(...wr(t,e,i,n)),r}function hr(e){let t=Cn(e.outputKeys),n=Cn(e.outputValues),r=[...Cn(e.keys),...Cn(e.values)];if([...t,...n].some(e=>r.some(t=>t.buffer===e.buffer))||t.some(e=>n.some(t=>e.buffer===t.buffer)))throw Error(`${e.id} outputs must use separate buffers from inputs and each other`);for(let r of[t,n])for(let[t,n]of r.entries())if(r.slice(0,t).some(e=>jn(e,n)))throw Error(`${e.id} output chunks must not overlap`)}function gr(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=[],s=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${I(n)}u;
const VALUES_OFFSET: u32 = ${I(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${I(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${I(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${or}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Ln(a,or)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;return o.push(...kr(e,{id:`${t.id}-${i}`,source:s,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})),o}function _r(e,t,n,r){let i=[],a=Dr(t.keys.length);if(a<=ar)return i.push(...vr(e,t,a)),i;let o=In(`GPUSort bitonic`,a,ar,r),s=L(e,`${t.id}-bitonic-indices-a`,`uint32`,a),c=L(e,`${t.id}-bitonic-indices-b`,`uint32`,a);i.push(...xr(e,t,s,a,o));let l=s,u=c;for(let n of Or(a))i.push(...Sr(e,t,l,u,a,n,o)),[l,u]=[u,l];return i.push(...Cr(e,t,l,n)),i}function vr(e,t,n){let r=[],i=t.direction===`descending`,a=Bn(e.device,{requiresSubgroupId:!0})===`subgroups`,o=`
${a?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${lr}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${n}u;
const KEYS_OFFSET: u32 = ${I(t.keys)}u;
const VALUES_OFFSET: u32 = ${I(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${I(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${I(t.outputValues)}u;
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
${a?br():yr()}
}`;return r.push(...kr(e,{id:`${t.id}-bitonic-local`,source:o,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})),r}function yr(){return`
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
  }`}function br(){return`
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
  }`}function xr(e,t,n,r,i){let a=[],o=`
const INVALID_INDEX: u32 = ${lr}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${I(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${ar}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Ln(i,ar)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;return a.push(...kr(e,{id:`${t.id}-bitonic-initialize`,source:o,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})),a}function Sr(e,t,n,r,i,a,o){let s=[],c=t.direction===`descending`,l=`
const INVALID_INDEX: u32 = ${lr}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${i}u;
const BLOCK_WIDTH: u32 = ${a.blockWidth}u;
const COMPARE_STRIDE: u32 = ${a.compareStride}u;
const KEYS_OFFSET: u32 = ${I(t.keys)}u;
const INDICES_IN_OFFSET: u32 = ${I(n)}u;
const INDICES_OUT_OFFSET: u32 = ${I(r)}u;
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

@compute @workgroup_size(${ar}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Ln(o,ar)}
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
}`;return s.push(...kr(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})),s}function Cr(e,t,n,r){let i=[],a=`
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${I(t.keys)}u;
const VALUES_OFFSET: u32 = ${I(t.values)}u;
const INDICES_OFFSET: u32 = ${I(n)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${I(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${I(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${ar}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Ln(r,ar)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;return i.push(...kr(e,{id:`${t.id}-bitonic-gather`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})),i}function wr(e,t,n,r){let i=[],a=Math.ceil(t.keyBits/sr),o=Math.ceil(t.keys.length/or),s=a>1?L(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,c=a>1?L(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,l=t.keys,u=t.values;for(let d=0;d<a;d++){let f=d*sr,p=Math.min(sr,t.keyBits-f),m=2**p,h=L(e,`${t.id}-radix-digit-${f}-histogram`,`uint32`,m*o),g=L(e,`${t.id}-radix-digit-${f}-offsets`,`uint32`,m*o),_=(a-d)%2==1,v=_?t.outputKeys:s,y=_?t.outputValues:c;if(!v||!y)throw Error(`${t.id} radix scratch is missing`);i.push(...Tr(e,t,l,h,f,p,o,n));let b=new Wn({id:`${t.id}-radix-digit-${f}-scan`,input:h,output:g});i.push(...Gn(b,e,r)),i.push(...Er(e,t,l,u,g,v,y,f,p,o,n)),l=v,u=y}return i}function Tr(e,t,n,r,i,a,o,s){let c=[],l=2**a,u=t.direction===`descending`,d=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${i}u;
const BUCKET_COUNT: u32 = ${l}u;
const DIGIT_MASK: u32 = ${l-1}u;
const WORKGROUP_COUNT: u32 = ${o}u;
const KEYS_OFFSET: u32 = ${I(n)}u;
const HISTOGRAM_OFFSET: u32 = ${I(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${l}>;

@compute @workgroup_size(${or}) fn main(
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

  let index = workgroupIndex * ${or}u + localInvocationIndex;
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
}`;return c.push(...kr(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:d,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})),c}function Er(e,t,n,r,i,a,o,s,c,l,u){let d=[],f=2**c,p=t.direction===`descending`,m=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${f-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${cr}u;
const MASK_COUNT: u32 = ${f*cr}u;
const KEYS_OFFSET: u32 = ${I(n)}u;
const VALUES_OFFSET: u32 = ${I(r)}u;
const OFFSETS_OFFSET: u32 = ${I(i)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${I(a)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${I(o)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${f*cr}>;

@compute @workgroup_size(${or}) fn main(
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

  let index = workgroupIndex * ${or}u + localInvocationIndex;
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
}`;return d.push(...kr(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:m,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})),d}function Dr(e){let t=1;for(;t<e;)t*=2;return t}function Or(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function kr(e,t){let n=[];return n.push(Ce({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new ve(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=kn(n,r);n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n}function Ar(e,t){if(!Number.isFinite(e)||e<0)throw Error(`Invalid body mass`);if(t.type===`sphere`){if(!(t.radius>0)||!Number.isFinite(t.radius))throw Error(`Invalid sphere radius`);let n=.4*e*t.radius**2;return[n,n,n]}if(t.halfExtents.some(e=>!(e>0)||!Number.isFinite(e)))throw Error(`Invalid box extents`);let[n,r,i]=t.halfExtents;return[e*(r**2+i**2)/3,e*(n**2+i**2)/3,e*(n**2+r**2)/3]}function jr(e){let t=new ArrayBuffer(4),n=new DataView(t),r=e.map(e=>e.map(e=>{n.setFloat32(0,e);let t=n.getUint32(0),r=t>>>23&255;return{mantissa:BigInt(t&8388607|(r?8388608:0))*(t>>>31?-1n:1n),exponent:r?r-150:-149}})),i=128;for(let e of r)for(let t of e)t.mantissa!==0n&&(i=Math.min(i,t.exponent));let a=r.map(e=>e.map(e=>e.mantissa===0n?0n:e.mantissa<<BigInt(e.exponent-i)));return(e,t,n,r)=>{let i=a[e],o=a[t].map((e,t)=>e-i[t]),s=a[n].map((e,t)=>e-i[t]),c=a[r].map((e,t)=>e-i[t]),l=(o[1]*s[2]-o[2]*s[1])*c[0]+(o[2]*s[0]-o[0]*s[2])*c[1]+(o[0]*s[1]-o[1]*s[0])*c[2];return l>0n?1:l<0n?-1:0}}var Mr=(e,t)=>e.map((e,n)=>e-t[n]),Nr=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],Pr=(e,t)=>e.reduce((e,n,r)=>e+n*t[r],0);function Fr(e){if(!Number.isSafeInteger(e.length)||e.length%3||e.length>3e6)throw Error(`Invalid hull capacity`);let t=new Map;for(let n=0;n<e.length;n+=3){let r=[Math.fround(e[n]),Math.fround(e[n+1]),Math.fround(e[n+2])];if(!r.every(Number.isFinite))throw Error(`Invalid hull positions`);t.set(r.join(`,`),r)}let n=[...t.values()],r=jr(n);if(n.length<4)throw Error(`A hull requires four noncoplanar vertices`);if(n.length>16384)throw Error(`Convex hull vertex capacity exceeded`);let i=1;for(let e=2;e<n.length;e++)Pr(Mr(n[e],n[0]),Mr(n[e],n[0]))>Pr(Mr(n[i],n[0]),Mr(n[i],n[0]))&&(i=e);let a=Mr(n[i],n[0]),o=0,s=0;for(let e=0;e<n.length;e++){let t=Nr(a,Mr(n[e],n[0])),r=Pr(t,t);r>s&&(s=r,o=e)}let c=Nr(a,Mr(n[o],n[0])),l=0;s=0;for(let e=0;e<n.length;e++){let t=Math.abs(Pr(c,Mr(n[e],n[0])));t>s&&(s=t,l=e)}let u=Math.max(...a.map(Math.abs),1e-12);if(s===0||r(0,i,o,l)===0)throw Error(`Degenerate convex hull`);let d=[0,1,2].map(e=>(n[0][e]+n[i][e]+n[o][e]+n[l][e])/4),f=(e,t,r)=>{let i=Nr(Mr(n[t],n[e]),Mr(n[r],n[e])),a=Pr(i,Mr(d,n[e]))>0;if(a)for(let e=0;e<3;e++)i[e]=-i[e];return{indices:a?[e,r,t]:[e,t,r],normal:i,constant:Pr(i,n[e]),epsilon:1e-8*u*Math.sqrt(Pr(i,i))}},p=[f(0,i,o),f(0,l,i),f(0,o,l),f(i,l,o)];for(let e=0;e<n.length;e++){if([0,i,o,l].includes(e))continue;let t=new Map,a=[];for(let i of p){let o=i.indices,s=n[e],c=n[o[0]],l=i.normal[0]*(s[0]-c[0])+i.normal[1]*(s[1]-c[1])+i.normal[2]*(s[2]-c[2]);if(Math.abs(l)<=i.epsilon?r(o[0],o[1],o[2],e)>0:l>0)for(let e=0;e<3;e++){let n=o[e],r=o[(e+1)%3];t.delete(`${r},${n}`)||t.set(`${n},${r}`,[n,r])}else a.push(i)}for(let[n,r]of t.values())a.push(f(n,r,e));if(p=a,p.length>n.length*2-4)throw Error(`Non-manifold convex hull`)}let m=p.flatMap(e=>e.indices),h=[...new Set(m)],g=new Map(h.map((e,t)=>[e,t]));return Ir(h.flatMap(e=>n[e]),m.map(e=>g.get(e)))}function Ir(e,t){if(!Number.isSafeInteger(e.length)||!Number.isSafeInteger(t.length)||e.length<3||t.length<3||e.length%3||t.length%3)throw Error(`Incomplete mesh geometry`);if(e.length>3e6||t.length>3e6)throw Error(`Mesh geometry capacity exceeded`);let n=Array.from(e,Math.fround),r=Array.from(t);if(!n.every(Number.isFinite)||r.some(e=>!Number.isInteger(e)||e<0||e>=n.length/3))throw Error(`Invalid mesh geometry`);let i=e=>[n[e*3],n[e*3+1],n[e*3+2]];for(let e=0;e<r.length;e+=3){let t=i(r[e]);if(Nr(Mr(i(r[e+1]),t),Mr(i(r[e+2]),t)).every(e=>e===0))throw Error(`Degenerate mesh triangle`)}let a=[1/0,1/0,1/0],o=[-1/0,-1/0,-1/0];for(let e=0;e<n.length;e++){let t=e%3;a[t]=Math.min(a[t],n[e]),o[t]=Math.max(o[t],n[e])}let s=[],c=[],l=e=>{let t=s.length;s.push(...Array(12).fill(0));let a=[1/0,1/0,1/0],o=[-1/0,-1/0,-1/0];for(let t of e)for(let e=0;e<3;e++){let n=i(r[t*3+e]);for(let e=0;e<3;e++)a[e]=Math.min(a[e],n[e]),o[e]=Math.max(o[e],n[e])}if(e.length<=4){s[t+7]=e.length,s[t+8]=c.length/3;for(let t of e)c.push(...r.slice(t*3,t*3+3))}else{let t=0;for(let e=1;e<3;e++)o[e]-a[e]>o[t]-a[t]&&(t=e);let i=e=>r.slice(e*3,e*3+3).reduce((e,r)=>e+n[r*3+t],0);e.sort((e,t)=>i(e)-i(t));let s=e.length>>1;l(e.slice(0,s)),l(e.slice(s))}s.splice(t,3,...a),s.splice(t+4,3,...o),s[t+3]=s.length/12};l(Array.from({length:r.length/3},(e,t)=>t));let u=Array.from({length:n.length/3},(e,t)=>i(t).join(`,`)),d=new Map;for(let e=0;e<r.length;e+=3)for(let t=0;t<3;t++){let n=u[r[e+t]],i=u[r[e+(t+1)%3]],a=n<i,o=a?`${n}/${i}`:`${i}/${n}`,s=d.get(o)??{count:0,balance:0};s.count++,s.balance+=a?1:-1,d.set(o,s)}let f=[...d.values()].every(e=>e.count===2&&e.balance===0),p=a.map((e,t)=>(e+o[t])/2),m=0,h=[0,0,0],g=Array(9).fill(0);for(let e=0;e<r.length;e+=3){let t=[Mr(i(r[e]),p),Mr(i(r[e+1]),p),Mr(i(r[e+2]),p)],n=Pr(t[0],Nr(t[1],t[2]))/6;m+=n;for(let e=0;e<3;e++){h[e]+=n*t.reduce((t,n)=>t+n[e],0)/4;for(let r=0;r<3;r++){let i=0;for(let n=0;n<3;n++)for(let a=0;a<3;a++)i+=t[n][e]*t[a][r]*(n===a?2:1);g[e*3+r]+=n*i/20}}}let _=m===0?[0,0,0]:h.map(e=>e/m),v=Math.sign(m);m=Math.abs(m);let y=g.map((e,t)=>{let n=Math.floor(t/3),r=t%3;return v*((n===r?g[0]+g[4]+g[8]:0)-e)-m*((n===r?Pr(_,_):0)-_[n]*_[r])});return{positions:n,indices:c,minimum:a,maximum:o,nodes:s,closed:f,volume:m,center:_.map((e,t)=>e+p[t]),tensor:y}}function Lr(e){if(e.type===`convex-hull`||e.type===`triangle-mesh`)return e.geometry;if(e.type===`plane`){if([e.sizeX,e.sizeZ].some(e=>e!==void 0&&(!Number.isFinite(e)||e<=0)))throw Error(`Invalid plane extent`);return{volume:0,center:[0,0,0],tensor:Array(9).fill(0)}}if(e.type===`sphere`||e.type===`box`){let t=Ar(1,e),n=e.type===`sphere`?4*Math.PI*e.radius**3/3:8*e.halfExtents[0]*e.halfExtents[1]*e.halfExtents[2];return{volume:n,center:[0,0,0],tensor:[t[0]*n,0,0,0,t[1]*n,0,0,0,t[2]*n]}}let{height:t,radiusBottom:n,radiusTop:r}=e;if(![t,n,r].every(Number.isFinite)||t<=0||Math.min(n,r)<0||Math.max(n,r)<=0)throw Error(`Invalid tapered shape`);let i=[],a=(e,t,n,r)=>i.push({lower:n,upper:r,radiusSquared:[t*t-e*e,2*e,-1]}),o=(e,t,n,r)=>{let a=(r-n)/(t-e),o=n-a*e;i.push({lower:e,upper:t,radiusSquared:[o*o,2*o*a,a*a]})};if(e.type===`cylinder`)o(-t/2,t/2,n,r);else if(Math.abs(r-n)>=t){let e=r>=n,i=e?t/2:-t/2,o=e?r:n;a(i,o,i-o,i+o)}else{let e=(r-n)/t,i=Math.sqrt(1-e*e),s=-t/2-n*e,c=t/2-r*e;a(-t/2,n,-t/2-n,s),o(s,c,n*i,r*i),a(t/2,r,c,t/2+r)}let s=(e,t,n,r=0)=>e.reduce((e,i,a)=>e+i*(n**(a+r+1)-t**(a+r+1))/(a+r+1),0),c=0,l=0,u=0,d=0;for(let{lower:e,upper:t,radiusSquared:n}of i){let r=[,,,,,].fill(0);for(let e=0;e<3;e++)for(let t=0;t<3;t++)r[e+t]+=n[e]*n[t];c+=Math.PI*s(n,e,t),l+=Math.PI*s(n,e,t,1),u+=Math.PI*s(r,e,t)/2,d+=Math.PI*(s(n,e,t,2)+s(r,e,t)/4)}let f=l/c;return d-=c*f*f,{volume:c,center:[0,f,0],tensor:[d,0,0,0,u,0,0,0,d]}}function Rr(e,t,r,i,a,o,s,c){let l=[{name:`positions`,count:i,stride:1,offset:0,contacts:!1},{name:`targets`,count:i,stride:2,offset:0,contacts:!1},{name:`manifolds`,count:o*4,stride:0,offset:0,contacts:!0},{name:`trigger-previous`,count:a,stride:1,offset:0,contacts:!1},{name:`contact-events`,count:s,stride:4,offset:3,contacts:!1}],u=[],d=e.createBuffer({data:new Float32Array([...c,0]),usage:n.UNIFORM|n.COPY_DST});try{let n=e.createCommandEncoder(),i=n.beginComputePass();for(let n of l){let a=r.find(e=>e.id===`${t}-${n.name}`);if(!a||!n.count)continue;let o=Math.min(Math.ceil(n.count/64),e.limits.maxComputeWorkgroupsPerDimension),s=ye(e,{source:`
@group(0) @binding(0) var<storage,read_write> values:array<vec4f>;
@group(0) @binding(1) var<uniform> shift:vec4f;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u) {
 let index=invocation.x+invocation.y*${o*64}u;
 if(index>=${n.count}u){return;}
 let address=${n.contacts?`(index/4u)*26u+(index%4u)*6u`:`${n.offset}u+index*${n.stride}u`};
 values[address]=vec4f(values[address].xyz-shift.xyz,values[address].w);
}`,shaderLayout:{bindings:[{name:`values`,group:0,location:0,type:`storage`},{name:`shift`,group:0,location:1,type:`uniform`}]},bindings:{values:a,shift:d}});u.push(s),s.kernel.dispatch(i,{bindings:s.bindings,x:o,y:Math.ceil(n.count/(o*64))})}i.end(),e.submit(n.finish())}finally{for(let e of u)e.kernel.destroy();d.destroy()}}function zr(e,t,n,r=!1){if(!t||!n)return`
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
`}function Br(e){return e.replace(/@compute @workgroup_size\(64\) fn ensembleClear[\s\S]*?atomicStore\(&ensemble\[10\],1u\);\n}/,``).replace(`var<storage,read_write> ensemble:array<atomic<u32>>`,`var<storage,read> ensemble:array<u32>`).replace(/atomicLoad\(&ensemble\[([^\]]+)\]\)/g,`ensemble[$1]`)}function Vr(e,t,n,r,i,a,o,s){let c={id:`${t}-ensemble-status`,source:`
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
}`,shaderLayout:{bindings:[{name:`ensemble`,group:0,location:0,type:`storage`},{name:`statistics`,group:0,location:1,type:`read-only-storage`},{name:`bodies`,group:0,location:2,type:`read-only-storage`},{name:`sleepStates`,group:0,location:3,type:`read-only-storage`}]},bindings:{ensemble:o.buffer,statistics:s.buffer,bodies:i.buffer,sleepStates:a.buffer}},l=e=>({encode:({computePass:t})=>e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(n/64)}),destroy:()=>e.kernel.destroy()});e.addComputePass({id:c.id,workload:{commandCount:1},description:`Record per-instance participation and shared rollback status.`,resources:[{buffer:o.resource,usage:`storage-read-write`},{buffer:s.resource,usage:`storage-read`},{buffer:i.resource,usage:`storage-read`},{buffer:a.resource,usage:`storage-read`}],compile:({device:e})=>l(ye(e,c)),compileAsync:async({device:e})=>l(await be(e,c))})}function Hr(e,t,r,i,a,o,s){let c=e=>r.find(n=>n.id===`${t}-${e}`),l=[...[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`].map(e=>({name:e,offset:0,size:a*16})),{name:`targets`,offset:0,size:a*32},{name:`bodies`,offset:0,size:a*48},{name:`bodies`,offset:i*48,size:o*96},{name:`object-attributes`,offset:0,size:o*4},{name:`pose-metadata`,offset:0,size:a*48}].filter(e=>c(e.name)),u=[],d=e.createBuffer({byteLength:32,usage:n.UNIFORM|n.COPY_DST}),f;try{let t=e.createCommandEncoder();for(let r of l){let i=e.createBuffer({byteLength:r.size,usage:n.COPY_SRC|n.COPY_DST});u.push(i),t.copyBufferToBuffer({sourceBuffer:c(r.name),sourceOffset:r.offset,destinationBuffer:i,size:r.size})}e.submit(t.finish());let r=c(`contact-history`);f=ye(e,{source:`
@group(0) @binding(0) var<uniform> settings:Settings;
struct Settings {selection:vec4u, shift:vec4f}
@group(0) @binding(6) var<storage,read_write> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read_write> metadata:array<u32>;
@group(0) @binding(2) var<storage,read_write> attributes:array<u32>;
@group(0) @binding(3) var<storage,read_write> manifolds:array<u32>;
@group(0) @binding(4) var<storage,read_write> targets:array<u32>;
${r?`@group(0) @binding(5) var<storage,read_write> history:array<u32>;`:``}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;let selection=settings.selection;
 if(index==0u){targets[${i*8+8+s*2}u+selection.x/${a}u]=0u;}
 if(index<${a}u){
  let body=selection.x+index;positions[body]=vec4f(positions[body].xyz-settings.shift.xyz,positions[body].w);
  for(var axis=0u;axis<3u;axis++){let address=body*8u+axis;targets[address]=bitcast<u32>(bitcast<f32>(targets[address])-settings.shift[axis]);}
 }
 if(index<${o}u){
  let collider=selection.y+index;let address=${i*12}u+collider*24u+7u;
  metadata[address]=bitcast<u32>(bitcast<f32>(metadata[address])+f32(selection.x));
  attributes[collider]=(attributes[collider]&0xffff0000u)|((attributes[collider]&0xffffu)+selection.x);
 }
 if(index>=${s}u){return;}
 let key=targets[${i*8+8}u+index*2u];
 if(key==0u||key==0xffffffffu){return;}
 let address=index*104u;let collider=manifolds[address+97u];
 if(collider<selection.y||collider>=selection.y+${o}u){return;}
 for(var word=0u;word<104u;word++){manifolds[address+word]=0u;}
 targets[${i*8+8}u+index*2u]=0xffffffffu;
 targets[${i*8+9}u+index*2u]=0u;
 ${r?`for(var word=0u;word<4u;word++){history[index*4u+word]=0u;}`:``}
}`,shaderLayout:{bindings:[{name:`settings`,group:0,location:0,type:`uniform`},{name:`positions`,group:0,location:6,type:`storage`},...[`metadata`,`attributes`,`manifolds`,`targets`,...r?[`history`]:[]].map((e,t)=>({name:e,group:0,location:t+1,type:`storage`}))]},bindings:{settings:d,positions:c(`positions`),metadata:c(`bodies`),attributes:c(`object-attributes`),manifolds:c(`manifolds`),targets:c(`targets`),...r?{history:r}:{}}})}catch(e){for(let e of u)e.destroy();throw d.destroy(),f?.kernel.destroy(),e}return{byteLength:u.reduce((e,t)=>e+t.byteLength,d.byteLength),reset(t,n){let r=new ArrayBuffer(32);new Uint32Array(r).set([t*a,t*o]),new Float32Array(r).set(n,4),d.write(new Uint8Array(r));let i=e.createCommandEncoder();for(let[e,n]of l.entries())i.copyBufferToBuffer({sourceBuffer:u[e],destinationBuffer:c(n.name),destinationOffset:n.offset+t*n.size,size:n.size});let p=i.beginComputePass();f.kernel.dispatch(p,{bindings:f.bindings,x:Math.ceil(Math.max(s,o,a)/64)}),p.end(),e.submit(i.finish())},destroy(){f.kernel.destroy(),d.destroy();for(let e of u)e.destroy()}}}function Ur(e){let t=e.indices.length/3,n=Array.from({length:t},(e,t)=>t),r=e=>{for(;n[e]!==e;)n[e]=n[n[e]],e=n[e];return e},i=t=>e.positions.slice(t*3,t*3+3),a=Array(t).fill(0),o=new Map,s=jr(Array.from({length:e.positions.length/3},(e,t)=>i(t)));for(let n=0;n<t;n++){let t=e.indices.slice(n*3,n*3+3);for(let e=0;e<3;e++){let r=i(t[e]).join(`,`),a=i(t[(e+1)%3]).join(`,`),s=r<a?`${r}/${a}`:`${a}/${r}`,c=o.get(s)??[];c.push({triangle:n,side:e,opposite:t[(e+2)%3]}),o.set(s,c)}}for(let t of o.values()){if(t.length!==2)continue;let[o,c]=t,l=e.indices.slice(o.triangle*3,o.triangle*3+3);if(s(l[0],l[1],l[2],c.opposite)!==0)continue;let u=e.indices.slice(o.triangle*3,o.triangle*3+3),d=i(u[o.side]),f=i(u[(o.side+1)%3]).map((e,t)=>e-d[t]),p=e=>{let t=i(e).map((e,t)=>e-d[t]);return[f[1]*t[2]-f[2]*t[1],f[2]*t[0]-f[0]*t[2],f[0]*t[1]-f[1]*t[0]]},m=p(o.opposite),h=p(c.opposite);if(m.reduce((e,t,n)=>e+t*h[n],0)>=0)continue;a[o.triangle]|=1<<o.side,a[c.triangle]|=1<<c.side;let g=r(o.triangle),_=r(c.triangle);n[Math.max(g,_)]=Math.min(g,_)}return{features:n.map((e,t)=>r(t)+1),internalEdges:a}}function Wr(e){let t=[],n=new Map;return{shapes:e.map(({shape:e})=>{let r=[0,0],i=[0,0,0,0],a;if(e.type===`sphere`)a=[e.radius,0,0,0];else if(e.type===`plane`)a=[(e.sizeX??0)/2,(e.sizeZ??0)/2,e.doubleSided?1:0,6];else if(e.type===`box`)a=[...e.halfExtents,1];else if(e.type===`capsule`||e.type===`cylinder`)a=[e.radiusBottom,e.radiusTop,e.height,e.type===`capsule`?4:5];else{let o=e.geometry,s=n.get(o);if(s)i.splice(0,i.length,...s.padding),r.splice(0,r.length,...s.policies);else{i[0]=t.length/4,i[1]=o.positions.length/3;for(let e=0;e<o.positions.length;e+=3)t.push(o.positions[e],o.positions[e+1],o.positions[e+2],0);i[2]=t.length/4,i[3]=o.indices.length/3;let{features:e,internalEdges:a}=Ur(o);for(let n=0;n<o.indices.length;n+=3)t.push(o.indices[n],o.indices[n+1],o.indices[n+2],e[n/3]*8+a[n/3]);r[0]=t.length/4,r[1]=o.nodes.length/12;for(let e of o.nodes)t.push(e);n.set(o,{padding:[...i],policies:[...r]})}a=[...o.minimum.map((e,t)=>Math.max(Math.abs(e),Math.abs(o.maximum[t]))),e.type===`convex-hull`?2:3]}return{dimensions:a,policies:r,padding:i}}),geometry:t,filters:e.map(e=>{let n=[...new Set(e.excludedColliders??[])].sort((e,t)=>e-t),r=t.length;for(let e of n)t.push(e);for(;t.length%4;)t.push(0);return[r,n.length]})}}1/Math.PI*180,1/180*Math.PI;var Gr={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...Gr}};var Kr=globalThis.mathgl.config;function qr(e,{precision:t=Kr.precision}={}){return e=Xr(e),`${parseFloat(e.toPrecision(t))}`}function Jr(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Yr(e,t,n){let r=Kr.EPSILON;n&&(Kr.EPSILON=n);try{if(e===t)return!0;if(Jr(e)&&Jr(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!Yr(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`?Math.abs(e-t)<=Kr.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{Kr.EPSILON=r}}function Xr(e){return Math.round(e/Kr.EPSILON)*Kr.EPSILON}var Zr=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:Jr(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(Kr)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+qr(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!Yr(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r];this[r]=i+n*((typeof t==`number`?t:t[r])-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(Kr.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}};function Qr(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function $r(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function ei(e,t,n=``){if(Kr.debug&&!Qr(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}var ti=class extends Zr{toString(){let e=`[`;if(Kr.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=$r(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}},ni=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180;function ri(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}function ii(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function ai(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function oi(){let e=new ni(3);return ni!==Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function si(e){let t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)}function ci(e,t,n){let r=new ni(3);return r[0]=e,r[1]=t,r[2]=n,r}function R(e,t){let n=t[0],r=t[1],i=t[2],a=n*n+r*r+i*i;return a>0&&(a=1/Math.sqrt(a)),e[0]=t[0]*a,e[1]=t[1]*a,e[2]=t[2]*a,e}function li(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function ui(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function di(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}var fi=si;function pi(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function mi(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function hi(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,ee=u*_-p*m,E=d*g-f*h,D=d*_-p*h,O=f*_-p*g,k=v*O-y*D+b*E+x*ee-S*T+C*w;return k?(k=1/k,e[0]=(s*O-c*D+l*E)*k,e[1]=(i*D-r*O-a*E)*k,e[2]=(h*C-g*S+_*x)*k,e[3]=(f*S-d*C-p*x)*k,e[4]=(c*ee-o*O-l*T)*k,e[5]=(n*O-i*ee+a*T)*k,e[6]=(g*b-m*C-_*y)*k,e[7]=(u*C-f*b+p*y)*k,e[8]=(o*D-s*ee+l*w)*k,e[9]=(r*ee-n*D-a*w)*k,e[10]=(m*S-h*b+_*v)*k,e[11]=(d*b-u*S-p*v)*k,e[12]=(s*T-o*E-c*w)*k,e[13]=(n*E-r*T+i*w)*k,e[14]=(h*y-m*x-g*v)*k,e[15]=(u*x-d*y+f*v)*k,e):null}function gi(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,ee=p*y-m*v+h*_;return c*C-i*w+g*T-f*ee}function _i(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function vi(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function yi(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function bi(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,ee,E,D,O,k,A;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,ee=i*a*u-o*l,E=a*a*u+c,D=o*a*u+i*l,O=i*o*u+a*l,k=a*o*u-i*l,A=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*ee+h*E+y*D,e[5]=f*ee+g*E+b*D,e[6]=p*ee+_*E+x*D,e[7]=m*ee+v*E+S*D,e[8]=d*O+h*k+y*A,e[9]=f*O+g*k+b*A,e[10]=p*O+_*k+x*A,e[11]=m*O+v*k+S*A,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function xi(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function Si(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function Ci(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function wi(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function Ti(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function Ei(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var Di=Ei;function Oi(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var ki=Oi;function Ai(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?pi(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function ji(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e[3]=t[3]+n[3],e}function Mi(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function Ni(e){let t=e[0],n=e[1],r=e[2],i=e[3];return Math.sqrt(t*t+n*n+r*r+i*i)}function Pi(e){let t=e[0],n=e[1],r=e[2],i=e[3];return t*t+n*n+r*r+i*i}function Fi(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a;return o>0&&(o=1/Math.sqrt(o)),e[0]=n*o,e[1]=r*o,e[2]=i*o,e[3]=a*o,e}function Ii(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]+e[3]*t[3]}function Li(e,t,n,r){let i=t[0],a=t[1],o=t[2],s=t[3];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e[3]=s+r*(n[3]-s),e}function Ri(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}var zi;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL0ROW3=3]=`COL0ROW3`,e[e.COL1ROW0=4]=`COL1ROW0`,e[e.COL1ROW1=5]=`COL1ROW1`,e[e.COL1ROW2=6]=`COL1ROW2`,e[e.COL1ROW3=7]=`COL1ROW3`,e[e.COL2ROW0=8]=`COL2ROW0`,e[e.COL2ROW1=9]=`COL2ROW1`,e[e.COL2ROW2=10]=`COL2ROW2`,e[e.COL2ROW3=11]=`COL2ROW3`,e[e.COL3ROW0=12]=`COL3ROW0`,e[e.COL3ROW1=13]=`COL3ROW1`,e[e.COL3ROW2=14]=`COL3ROW2`,e[e.COL3ROW3=15]=`COL3ROW3`})(zi||={});var Bi=45*Math.PI/180,Vi=1,Hi=.1,Ui=500,Wi=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),Gi=class extends ti{static get IDENTITY(){return B()}static get ZERO(){return z()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return zi}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(Wi)}fromObject(e){return this.check()}fromQuaternion(e){return wi(this,e),this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=Hi,far:o=Ui}=e;return o===1/0?Yi(this,t,n,r,i,a):Ti(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return Ai(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=Hi,far:o=Ui}=e;return ki(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=Bi,aspect:n=Vi,focalDistance:r=1,near:i=Hi,far:a=Ui}=e;Ji(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return Ji(t),Di(this,t,n,r,i),this.check()}determinant(){return gi(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=0,e[4]=this[4]*r,e[5]=this[5]*i,e[6]=this[6]*a,e[7]=0,e[8]=this[8]*r,e[9]=this[9]*i,e[10]=this[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=this[4]*r,e[4]=this[5]*i,e[5]=this[6]*a,e[6]=this[8]*r,e[7]=this[9]*i,e[8]=this[10]*a,e}transpose(){return mi(this,this),this.check()}invert(){return hi(this,this),this.check()}multiplyLeft(e){return _i(this,e,this),this.check()}multiplyRight(e){return _i(this,this,e),this.check()}rotateX(e){return xi(this,this,e),this.check()}rotateY(e){return Si(this,this,e),this.check()}rotateZ(e){return Ci(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return bi(this,this,e,t),this.check()}scale(e){return yi(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return vi(this,this,e),this.check()}transform(e,t){return e.length===4?(t=Ri(t||[-0,-0,-0,-0],e,this),ei(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=ri(t||[-0,-0],e,this);break;case 3:r=di(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ei(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=ii(t||[-0,-0],e,this);break;case 3:n=ai(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ei(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},Ki,qi;function z(){return Ki||(Ki=new Gi([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(Ki)),Ki}function B(){return qi||(qi=new Gi,Object.freeze(qi)),qi}function Ji(e){if(e>Math.PI*2)throw Error(`expected radians`)}function Yi(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}function Xi(e){return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e}function Zi(e,t,n){n*=.5;let r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e}function Qi(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1],l=n[2],u=n[3];return e[0]=r*u+o*s+i*l-a*c,e[1]=i*u+o*c+a*s-r*l,e[2]=a*u+o*l+r*c-i*s,e[3]=o*u-r*s-i*c-a*l,e}function $i(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+o*s,e[1]=i*c+a*s,e[2]=a*c-i*s,e[3]=o*c-r*s,e}function ea(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c-a*s,e[1]=i*c+o*s,e[2]=a*c+r*s,e[3]=o*c-i*s,e}function ta(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+i*s,e[1]=i*c-r*s,e[2]=a*c+o*s,e[3]=o*c-a*s,e}function na(e,t){let n=t[0],r=t[1],i=t[2];return e[0]=n,e[1]=r,e[2]=i,e[3]=Math.sqrt(Math.abs(1-n*n-r*r-i*i)),e}function ra(e,t,n,r){let i=t[0],a=t[1],o=t[2],s=t[3],c=n[0],l=n[1],u=n[2],d=n[3],f,p,m,h,g;return f=i*c+a*l+o*u+s*d,f<0&&(f=-f,c=-c,l=-l,u=-u,d=-d),1-f>1e-6?(p=Math.acos(f),g=Math.sin(p),m=Math.sin((1-r)*p)/g,h=Math.sin(r*p)/g):(m=1-r,h=r),e[0]=m*i+h*c,e[1]=m*a+h*l,e[2]=m*o+h*u,e[3]=m*s+h*d,e}function ia(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a,s=o?1/o:0;return e[0]=-n*s,e[1]=-r*s,e[2]=-i*s,e[3]=a*s,e}function aa(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=t[3],e}function oa(e,t){let n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[5]-t[7])*r,e[1]=(t[6]-t[2])*r,e[2]=(t[1]-t[3])*r;else{let n=0;t[4]>t[0]&&(n=1),t[8]>t[n*3+n]&&(n=2);let i=(n+1)%3,a=(n+2)%3;r=Math.sqrt(t[n*3+n]-t[i*3+i]-t[a*3+a]+1),e[n]=.5*r,r=.5/r,e[3]=(t[i*3+a]-t[a*3+i])*r,e[i]=(t[i*3+n]+t[n*3+i])*r,e[a]=(t[a*3+n]+t[n*3+a])*r}return e}var sa=ji,ca=Mi,la=Ii,ua=Li,da=Ni,fa=Pi,pa=Fi,ma=(function(){let e=oi(),t=ci(1,0,0),n=ci(0,1,0);return function(r,i,a){let o=li(i,a);return o<-.999999?(ui(e,t,i),fi(e)<1e-6&&ui(e,n,i),R(e,e),Zi(r,e,Math.PI),r):o>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(ui(e,i,a),r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=1+o,pa(r,r))}})(),ha=class extends Zr{constructor(e=0,t=0,n=0,r=1){super(-0,-0,-0,-0),Array.isArray(e)&&arguments.length===1?this.copy(e):this.set(e,t,n,r)}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}set(e,t,n,r){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this.check()}fromObject(e){return this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this.check()}fromMatrix3(e){return oa(this,e),this.check()}fromEuler(e){switch(this.identity(),e.order){case`xyz`:return this.rotateX(e.x).rotateY(e.y).rotateZ(e.z);case`yxz`:return this.rotateY(e.y).rotateX(e.x).rotateZ(e.z);case`zxy`:return this.rotateZ(e.z).rotateX(e.x).rotateY(e.y);case`zyx`:return this.rotateZ(e.z).rotateY(e.y).rotateX(e.x);case`yzx`:return this.rotateY(e.y).rotateZ(e.z).rotateX(e.x);case`xzy`:return this.rotateX(e.x).rotateZ(e.z).rotateY(e.y);default:throw Error(`Unknown Euler angle order`)}}fromAxisRotation(e,t){return Zi(this,e,t),this.check()}identity(){return Xi(this),this.check()}setAxisAngle(e,t){return this.fromAxisRotation(e,t)}get ELEMENTS(){return 4}get x(){return this[0]}set x(e){this[0]=$r(e)}get y(){return this[1]}set y(e){this[1]=$r(e)}get z(){return this[2]}set z(e){this[2]=$r(e)}get w(){return this[3]}set w(e){this[3]=$r(e)}len(){return da(this)}lengthSquared(){return fa(this)}dot(e){return la(this,e)}rotationTo(e,t){return ma(this,e,t),this.check()}add(e){return sa(this,this,e),this.check()}calculateW(){return na(this,this),this.check()}conjugate(){return aa(this,this),this.check()}invert(){return ia(this,this),this.check()}lerp(e,t,n){return n===void 0?this.lerp(this,e,t):(ua(this,e,t,n),this.check())}multiplyRight(e){return Qi(this,this,e),this.check()}multiplyLeft(e){return Qi(this,e,this),this.check()}normalize(){let e=this.len(),t=e>0?1/e:0;return this[0]*=t,this[1]*=t,this[2]*=t,this[3]*=t,e===0&&(this[3]=1),this.check()}rotateX(e){return $i(this,this,e),this.check()}rotateY(e){return ea(this,this,e),this.check()}rotateZ(e){return ta(this,this,e),this.check()}scale(e){return ca(this,this,e),this.check()}slerp(e,t,n){let r,i,a;switch(arguments.length){case 2:r=this,i=e,a=t;break;default:r=e,i=t,a=n}return ra(this,r,i,a),this.check()}lengthSq(){return this.lengthSquared()}setFromAxisAngle(e,t){return this.setAxisAngle(e,t)}premultiply(e){return this.multiplyLeft(e)}multiply(e){return this.multiplyRight(e)}};function ga(e,t){let n=new Gi().fromQuaternion(e).transformAsVector(t);return[n[0],n[1],n[2]]}function _a(e=[0,0,0,1]){let t=Math.hypot(...e);if(!e.every(Number.isFinite)||t===0)throw Error(`Invalid body rotation`);return[e[0]/t,e[1]/t,e[2]/t,e[3]/t]}function va(e,t,n){let r=t.map(({shape:e})=>Lr(e)),i=r.map((e,n)=>t[n].isTrigger?0:e.volume),a=i.reduce((e,t)=>e+t,0),o=Array(9).fill(0);for(let[s,c]of t.entries()){let t=a>0?e*i[s]/a:0,l=i[s]>0?t/i[s]:0,u=new Gi().fromQuaternion(_a(c.orientation)),d=ga(_a(c.orientation),r[s].center),f=(c.position??[0,0,0]).map((e,t)=>e+d[t]-n[t]);for(let e=0;e<3;e++)for(let n=0;n<3;n++){for(let t=0;t<3;t++)for(let i=0;i<3;i++)o[e*3+n]+=u[t*4+e]*r[s].tensor[t*3+i]*l*u[i*4+n];o[e*3+n]+=t*((e===n?f.reduce((e,t)=>e+t**2,0):0)-f[e]*f[n])}}let s=[1,0,0,0,1,0,0,0,1];for(let e=0;e<24;e++){let e=0,t=1;for(let[n,r]of[[0,2],[1,2]])Math.abs(o[n*3+r])>Math.abs(o[e*3+t])&&(e=n,t=r);if(Math.abs(o[e*3+t])<=1e-12*Math.max(...o.map(Math.abs)))break;let n=.5*Math.atan2(2*o[e*3+t],o[t*3+t]-o[e*3+e]),r=Math.cos(n),i=Math.sin(n);for(let n=0;n<3;n++){let a=o[n*3+e],c=o[n*3+t];o[n*3+e]=r*a-i*c,o[n*3+t]=i*a+r*c;let l=s[e*3+n],u=s[t*3+n];s[e*3+n]=r*l-i*u,s[t*3+n]=i*l+r*u}for(let n=0;n<3;n++){let a=o[e*3+n],s=o[t*3+n];o[e*3+n]=r*a-i*s,o[t*3+n]=i*a+r*s}}let c=new ha().fromMatrix3(s).normalize();return{diagonal:[o[0],o[4],o[8]],orientation:[c[0],c[1],c[2],c[3]]}}function ya(e){return{pairCount:e[0],droppedPairs:e[1],invalidBounds:e[2],candidateTests:e[3],occupiedLevelMask:e[4],oversizedBounds:e[5],incompleteQueries:e[6]}}var ba=class{id;props;constructor(e){if(this.id=e.id??`rigid-body-broad-phase`,this.props=e,Dn(e.minima,[`float32x3`],`broad-phase minima`),Dn(e.maxima,[`float32x3`],`broad-phase maxima`),Dn(e.pairs,[`uint32x2`],`broad-phase pairs`),Dn(e.diagnostics,[`uint32`],`broad-phase diagnostics`),e.objectMetadata&&Dn(e.objectMetadata,[`uint32`],`broad-phase object metadata`),e.activeInstances&&(Dn(e.activeInstances,[`uint32`],`active instances`),!e.partitionSize||e.activeInstances.length!==16+9*e.minima.length/e.partitionSize))throw Error(`Invalid active instance queue`);let t=e.minima.length;if(e.bucketState&&(Dn(e.bucketState,[`uint32`],`persistent buckets`),!e.activeInstances||e.bucketState.buffer.transient||e.bucketState.length!==2**Math.ceil(Math.log2(Math.max(1,t*2)))+t+2))throw Error(`Invalid persistent bucket storage`);let n=e.maximumCandidateTestsPerQuery??4096,r=e.minimumCellSize??1/1024;if(e.partitionSize!==void 0&&(!Number.isSafeInteger(e.partitionSize)||e.partitionSize<1||t%e.partitionSize!==0)||t!==e.maxima.length||e.objectMetadata&&e.objectMetadata.length!==t||t>65535||e.diagnostics.length<8||!Number.isFinite(r)||r<=0||!Number.isSafeInteger(n)||n<1||n>65535)throw Error(`Invalid rigid-body broad-phase layout`);let i=[e.pairs,e.diagnostics,...e.bucketState?[e.bucketState]:[]];for(let t of i)for(let n of[e.minima,e.maxima,...e.objectMetadata?[e.objectMetadata]:[],...e.activeInstances?[e.activeInstances]:[],...i.filter(e=>e!==t)])if(t.buffer===n.buffer){let e=An(t),r=An(n);if(jn(t,n)||e.offset<r.offset+r.size&&r.offset<e.offset+e.size)throw Error(`Broad-phase storage bindings overlap`)}}getCommandNodes(e){let{minima:t,maxima:n,pairs:r,diagnostics:i}=this.props,a=t.length,o=L(e,`${this.id}-keys`,`uint32`,a),s=L(e,`${this.id}-values`,`uint32`,a),c=L(e,`${this.id}-sorted-keys`,`uint32`,a),l=L(e,`${this.id}-sorted-values`,`uint32`,a),u=L(e,`${this.id}-levels`,`uint32`,a*(this.props.activeInstances?2:1)),d={minima:t,maxima:n,keys:o,values:s,sortedKeys:c,sortedValues:l,levels:u,oversized:this.props.activeInstances?e.createDataView(u.buffer,{format:`uint32`,length:a,byteOffset:a*4}):L(e,`${this.id}-oversized`,`uint32`,a),pairs:r,diagnostics:i,objectMetadata:this.props.objectMetadata??s,...this.props.activeInstances?{activeInstances:this.props.activeInstances,heads:this.props.bucketState??L(e,`${this.id}-heads`,`uint32`,2**Math.ceil(Math.log2(Math.max(1,a*2)))+a+2)}:{}},f=Object.keys(d),p=xa(this.props,d),m={clear:`Reset broad-phase diagnostics and candidate counts.`,assign:`Assign collider bounds to hierarchical spatial grid cells.`,discover:`Discover potentially overlapping collider pairs from the sorted grid.`},h=(t,n,r,i)=>{n=n.filter(e=>!this.props.activeInstances||![`keys`,`oversized`].includes(e));let a=n.map(e=>({name:e,group:0,location:f.indexOf(e),type:[`keys`,`values`,`levels`,`oversized`,`pairs`,`diagnostics`,`heads`].includes(e)?`storage`:`read-only-storage`})),o=()=>{let r=new ve(e.device,{id:`${this.id}-${t}`,source:p,entryPoint:t,shaderLayout:{bindings:a}});return{encode:({computePass:e,getBuffer:a})=>{let o={};for(let e of n)o[e]=kn(d[e],a);this.props.activeInstances&&[`assign`,`discover`].includes(t)?r.dispatchIndirect(e,{bindings:o,indirectBuffer:a(this.props.activeInstances.buffer),indirectOffset:An(this.props.activeInstances).offset+32}):r.dispatch(e,{bindings:o,x:i,y:1,z:1})},destroy:()=>r.destroy()}};return Ce({id:`${this.id}-${t}`,description:m[t],workload:{commandCount:1},resources:[...this.props.activeInstances&&[`assign`,`discover`].includes(t)?[{buffer:this.props.activeInstances,usage:`indirect`}]:[],...n.map(e=>({buffer:d[e],usage:r.includes(e)?`storage-read-write`:`storage-read`}))],compile:o})};return[h(`clear`,[`diagnostics`],[`diagnostics`],1),...this.props.activeInstances?[h(`clearBuckets`,[`heads`],[`heads`],1)]:[],h(`assign`,[`minima`,`maxima`,`keys`,`values`,`levels`,`oversized`,`diagnostics`,...this.props.objectMetadata?[`objectMetadata`]:[],...this.props.activeInstances?[`heads`,`activeInstances`]:[]],[`keys`,`values`,`levels`,`oversized`,`diagnostics`,...this.props.activeInstances?[`heads`]:[]],Math.max(1,Math.ceil(a/64))),...this.props.activeInstances?[]:new fr({id:`${this.id}-sort`,keys:o,values:s,outputKeys:c,outputValues:l}).getCommandNodes(e),h(`discover`,[`minima`,`maxima`,...this.props.activeInstances?[]:[`sortedKeys`,`sortedValues`],`levels`,`oversized`,`pairs`,`diagnostics`,...this.props.activeInstances?[`heads`,`keys`,`values`,`activeInstances`]:[]],[`pairs`,`diagnostics`],Math.max(1,Math.ceil(a/64)))]}};function xa(e,t){let n=Object.keys(t),r=Object.fromEntries(n.map(e=>[e,I(t[e])])),i=new Set([`keys`,`values`,`levels`,`oversized`,`pairs`,`diagnostics`,`heads`]),a=`
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
 if(previous==0xffffffffu){let touched=atomicAdd(&heads[${r.heads}u+${i}u],1u);atomicStore(&heads[${r.heads}u+${i+2}u+touched],bucket);}`).replace(`var cursor=lowerBound(key);`,`var cursor=atomicLoad(&heads[${r.heads}u+(key&${o}u)]);`).replace(`if(cursor>=BODY_COUNT||sortedKeys[${r.sortedKeys}u+cursor]!=key){break;}let second=sortedValues[${r.sortedValues}u+cursor];cursor++;`,`if(cursor>=BODY_COUNT){break;}if(bucketVisits>=${Math.min(4294967295,(e.maximumCandidateTestsPerQuery??4096)*32)}u){atomicAdd(&diagnostics[${r.diagnostics}u+6u],1u);return;}bucketVisits++;let second=cursor;cursor=values[${r.values}u+second];if(domain(first)!=domain(second)||(levels[${r.levels}u+second]&63u)!=level||any(cell(second,level)!=coordinate)){continue;}`),a=a.replace(/keys\[[^\]]+\]=0xffffffffu;/g,``).replace(/oversized\[/g,`levels[`)}return a}function Sa(e){return{steps:e[0],incompleteSteps:e[1],droppedPairs:e[2],droppedManifolds:e[3],incompleteQueries:e[4],invalidBounds:e[5],droppedTriangleQueries:e[6],unresolvedQueries:e[7],incompleteIslandUnions:e[8],incompleteMeshQueries:e[11],incompleteContinuousBodies:e[12],incompleteTriggerQueries:e[13],invalidBodyStates:e[14],maximumCandidatePairs:e[9],maximumCandidateTests:e[10],saturated:e[15]!==0,complete:e[1]===0&&e[15]===0}}function Ca(e,t,r,i){let a=[...i.broadPhase?[{name:`discovery`,...i.broadPhase}]:[],...i.targets?[{name:`cache`,...i.targets}]:[],...i.meshTasks?[{name:`mesh`,...i.meshTasks}]:[],...i.parallelState?[{name:`islands`,...i.parallelState}]:[],...i.continuous?[{name:`continuous`,...i.continuous}]:[],...i.triggers?[{name:`triggers`,...i.triggers}]:[],...i.validity?[{name:`validity`,...i.validity}]:[]],o=[{name:`statistics`,buffer:r,resource:i.statisticsResource??e.importBuffer({id:t,byteLength:r.byteLength,usage:n.STORAGE},r)},...a],s={id:t,source:`
${o.map(({name:e},t)=>`@group(0) @binding(${t}) var<storage,${t===0?`read_write`:`read`}> ${e}:array<u32>;`).join(`
`)}
fn accumulate(index:u32,value:u32){
 let previous=statistics[index];
 if(value>0xffffffffu-previous){statistics[index]=0xffffffffu;statistics[15]=1u;}
 else {statistics[index]=previous+value;}
}
@compute @workgroup_size(1) fn record(){
 var failures:array<u32,7>;
 ${i.broadPhase?`failures[0]=discovery[${i.broadPhase.wordOffset+1}u];failures[2]=discovery[${i.broadPhase.wordOffset+6}u];failures[3]=discovery[${i.broadPhase.wordOffset+2}u];statistics[9]=max(statistics[9],discovery[${i.broadPhase.wordOffset}u]);statistics[10]=max(statistics[10],discovery[${i.broadPhase.wordOffset+3}u]);`:``}
 ${i.targets?`failures[1]=cache[${i.targets.wordOffset}u];`:``}
 ${i.meshTasks?`failures[4]=mesh[1];failures[5]=mesh[2];`:``}
 ${i.parallelState?`failures[6]=islands[0];`:``}
 var incomplete=false;
 for(var index=0u;index<7u;index++){accumulate(index+2u,failures[index]);incomplete=incomplete||failures[index]>0u;}
 ${i.meshTasks?`accumulate(11u,mesh[3]);incomplete=incomplete||mesh[3]>0u;`:``}
 ${i.continuous?`for(var body=0u;body<${i.continuous.count}u;body++){let failure=continuous[body*4u];accumulate(12u,failure);incomplete=incomplete||failure!=0u;}`:``}
 ${i.triggers?`for(var group=0u;group<${i.triggers.count}u;group++){let failure=select(0u,1u,(triggers[group*4u]&4u)!=0u);accumulate(13u,failure);incomplete=incomplete||failure!=0u;}`:``}
 ${i.validity?`for(var body=0u;body<${i.validity.count}u;body++){accumulate(14u,validity[body]);incomplete=incomplete||validity[body]!=0u;}`:``}
 accumulate(0u,1u);if(incomplete){accumulate(1u,1u);}
}`,entryPoint:`record`,shaderLayout:{bindings:o.map(({name:e},t)=>({name:e,location:t,group:0,type:t===0?`storage`:`read-only-storage`}))},bindings:Object.fromEntries(o.map(({name:e,buffer:t})=>[e,t]))},c=e=>({encode:({computePass:t})=>e.kernel.dispatch(t,{bindings:e.bindings,x:1}),destroy:()=>e.kernel.destroy()});e.addComputePass({id:t,workload:{commandCount:1},description:`Summarize contacts, solver limits, and simulation failures for diagnostics.`,resources:o.map(({resource:e},t)=>({buffer:e,usage:t===0?`storage-read-write`:`storage-read`})),compile:({device:e})=>c(ye(e,s)),compileAsync:async({device:e})=>c(await be(e,s))})}function wa(e,t,n){let r=e*8+8,i=r+n*2,a=i+t,o=a+t,s=o+n,c=s+n,l=Math.ceil((c+n)/2)*2,u=l+n*2,d=u+n,f=d+t,p=f+t,m=Math.ceil((p+8)/4)*4;return{keyOffset:r,headOffset:i,frameOffset:a,linkOffset:o,markOffset:s,journalOffset:c,savedKeyOffset:l,savedLinkOffset:u,savedHeadOffset:d,savedFrameOffset:f,savedHeaderOffset:p,savedManifoldOffset:m,byteLength:(m+n*104)*4}}function Ta(e){if(!e.axes.length||e.axes.length>3||new Set(e.axes).size!==e.axes.length||e.axes.some(e=>!Number.isInteger(e)||e<0||e>2)||e.drive&&e.axes.length!==1)throw Error(`Invalid constraint axes`);for(let t of[e.minimum,e.maximum,e.drive?.positionTarget,e.drive?.velocityTarget])if(t!==void 0&&!Number.isFinite(Math.fround(t)))throw Error(`Invalid constraint coordinate`);for(let t of[e.stiffness,e.damping,e.drive?.stiffness,e.drive?.damping,e.drive?.maximumForce])if(t!==void 0&&(!Number.isFinite(Math.fround(t))||t<0))throw Error(`Invalid constraint response`);if((e.minimum??-1/0)>(e.maximum??1/0)||e.drive?.mode!==void 0&&![`force`,`acceleration`].includes(e.drive.mode))throw Error(`Invalid constraint bounds`)}function V(){return`
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
`}function Ea(e,t,n){if(e.length>64)throw Error(`Unsupported joint configuration`);for(let r of e){if(![`distance`,`fixed`,`hinge`,`slider`,`general`].includes(r.type)||r.first===r.second||[r.first,r.second].some(e=>!Number.isInteger(e)||e<0||e>=t.length)||![r.first,r.second].some(e=>(t[e].mode??((t[e].mass??1)===0?`static`:`dynamic`))===`dynamic`))throw Error(`Invalid joint bodies`);if(n===`parallel`){let e=[r.first,r.second].some(e=>(t[e].mode??((t[e].mass??1)===0?`static`:`dynamic`))===`static`);if(r.type!==`distance`||!e)throw Error(`Unsupported parallel joint`)}r.type===`general`&&Ta(r);for(let e of[r.firstFrame,r.secondFrame]){if(e?.position&&(e.position.length!==3||!e.position.every(e=>Number.isFinite(Math.fround(e)))))throw Error(`Invalid joint anchor`);e?.orientation&&_a(e.orientation)}if(r.type===`distance`&&(!Number.isFinite(Math.fround(r.distance))||r.distance<0))throw Error(`Invalid joint distance`);let e=r.type===`distance`?r.spring:void 0,i=r.type===`hinge`||r.type===`slider`?r.motor:void 0;if([e?.stiffness,e?.damping,i?.stiffness,i?.damping].some(e=>e!==void 0&&(!Number.isFinite(Math.fround(e))||e<0))||i?.position!==void 0&&!Number.isFinite(Math.fround(i.position)))throw Error(`Invalid joint drive`);if(r.type===`hinge`||r.type===`slider`){if(r.type===`hinge`&&i?.position!==void 0&&Math.abs(i.position)>Math.PI)throw Error(`Invalid hinge target`);if(r.limits&&(r.limits.length!==2||!r.limits.every(e=>Number.isFinite(Math.fround(e)))||r.limits[0]>r.limits[1]||r.type===`hinge`&&(r.limits[0]<=-Math.PI||r.limits[1]>=Math.PI)))throw Error(`Invalid joint limits`);if(r.motor&&(!Number.isFinite(Math.fround(r.motor.velocity??0))||!Number.isFinite(Math.fround(r.motor.maximumForce))||r.motor.maximumForce<0))throw Error(`Invalid joint motor`)}}}function Da(e,t){if(!e.length)return`fn jointActive(body:u32)->bool{return false;} fn jointExcluded(first:u32,second:u32)->bool{return false;}`;let n=e=>`vec${e.length}f(${e.map(e=>`${Math.fround(e)}`).join(`,`)})`,r=(e,t)=>`${n(t?.position??[0,0,0])},${n(_a(t?.orientation??[0,0,0,1]))}`,i=e.map(e=>{let t=e.type===`hinge`||e.type===`slider`?e:void 0;return`Joint(vec4u(${e.first},${e.second},${[`distance`,`fixed`,`hinge`,`slider`,`general`].indexOf(e.type)},${e.collideConnected?1:0}),${r(e.first,e.firstFrame)},${r(e.second,e.secondFrame)},${n([e.type===`distance`?e.distance:0,t?.limits?.[0]??0,t?.limits?.[1]??0,t?.limits?1:0])},${n([t?.motor?.velocity??0,t?.motor?.maximumForce??0,t?.motor?1:0,0])},${n([t?.motor?.position??0,t?.motor?.stiffness??30,t?.motor?.damping??5,t?.motor?.position===void 0?0:1])},${n([e.type===`distance`?e.spring?.stiffness??0:0,e.type===`distance`?e.spring?.damping??0:0,e.type===`distance`&&e.spring?1:0,0])})`});return`
struct Joint { identifiers:vec4u, firstAnchor:vec3f, firstFrame:vec4f, secondAnchor:vec3f, secondFrame:vec4f, limits:vec4f, motor:vec4f, drive:vec4f, spring:vec4f }
const JOINTS:array<Joint,${e.length}>=array<Joint,${e.length}>(${i.join(`,`)});
fn liveJoint(index:u32)->Joint {
 var joint=JOINTS[index];let state=targets.joints[index];
 joint.identifiers.w=u32(state.control.y);joint.limits=state.limits;joint.motor=state.motor;joint.drive=state.drive;joint.spring=state.spring;return joint;
}
${V()}
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
`}function Oa(e){let t=new Float32Array(176/4),n=e.type===`hinge`||e.type===`slider`?e:void 0;t.set([e.enabled===!1?0:1,e.collideConnected?1:0,0,0],8),t.set([e.type===`distance`?e.distance:0,n?.limits?.[0]??0,n?.limits?.[1]??0,n?.limits?1:0],12),t.set([n?.motor?.velocity??0,n?.motor?.maximumForce??0,n?.motor?1:0,0],16),t.set([n?.motor?.position??0,n?.motor?.stiffness??30,n?.motor?.damping??5,n?.motor?.position===void 0?0:1],20),t.set([e.type===`distance`?e.spring?.stiffness??0:0,e.type===`distance`?e.spring?.damping??0:0,e.type===`distance`&&e.spring?1:0,0],24);let r=e.type===`general`?e:void 0;t.set([...[0,1,2].map(e=>r?.axes.includes(e)?1:0),r?.angular?1:0],28),t.set([r?.minimum??-1e30,r?.maximum??1e30,r?.stiffness??0,r?.damping??0],32);let i=r?.drive;return t.set([r?.stiffness===void 0?0:1,i?1:0,i?.mode===`acceleration`?1:0,i?.maximumForce??1e30],36),t.set([i?.positionTarget??0,i?.velocityTarget??0,i?.stiffness??0,i?.damping??0],40),t}function ka(e,t,n,r,i,a,o,s=0,c=!1,l=!1,u=!1,d=0,f=0){let p=Math.ceil((e*12+t*26)/4)*4,m=Math.ceil((p+r)/64)*64,h=Math.ceil((m+n*2)/64)*64,g=i?h+8:p+Math.max(4,r),_=Math.ceil((4+e*5+n*2)/4)*16+n*64+Math.ceil((n*2+e)/4)*16,v=[...[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`].map(t=>({name:t,byteLength:e*16,uniform:!1})),{name:`targets`,byteLength:f?wa(e,f,n).byteLength:Math.ceil((e*32+(i?32+n*8:16))/16)*16+d*176,uniform:!1},{name:`manifolds`,byteLength:n*416,uniform:!1},{name:`bodies`,byteLength:g*4,uniform:!1},{name:`settings`,byteLength:64,uniform:!0},{name:`control-settings`,byteLength:64,uniform:!0},{name:`simulation-statistics`,byteLength:64,uniform:!1},...s?[{name:`contact-events`,byteLength:16+s*64,uniform:!1},{name:`contact-history`,byteLength:n*16,uniform:!1}]:[],...c?[{name:`query-settings`,byteLength:48,uniform:!0},{name:`query-selection`,byteLength:Math.max(4,t*4),uniform:!1},{name:`query-output`,byteLength:16+Math.max(1,t)*48,uniform:!1}]:[],...a?[{name:`mesh-tasks`,byteLength:3145744,uniform:!1}]:[],...o?[{name:`parallel-state`,byteLength:_,uniform:!1},{name:`parallel-dispatch`,byteLength:48,uniform:!1}]:[],...i?[{name:`minima`,byteLength:t*12,uniform:!1},{name:`maxima`,byteLength:t*12,uniform:!1},{name:`object-attributes`,byteLength:t*4,uniform:!1}]:[]];if(u&&v.push({name:`continuous-previous`,byteLength:e*16,uniform:!1},{name:`continuous-selection`,byteLength:e*4,uniform:!1},{name:`continuous-status`,byteLength:e*16,uniform:!1}),l){v.push({name:`state-validity`,byteLength:e*4,uniform:!1});let t=[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`,...f?[]:[`targets`,`manifolds`]].map((e,t)=>({name:`checkpoint-${t}`,byteLength:v.find(t=>t.name===e).byteLength,uniform:!1}));v.push(...t)}return{geometryOffset:p,pairOffset:m,diagnosticOffset:h,metadataLength:g,parallelByteLength:_,buffers:v}}var Aa=`
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
`,ja=`
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
`;function Ma(e,t,n,r){return`
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
`}function Na(e,t,r,i,a,o,s,c,l=!1,u=0,d=i,f=!1,p=!1){if(u)return Pa(e,t,f?r:r+ja,i,a,o,s,c,u,d,p);let m=c(`continuous-previous`,i*16),h=c(`continuous-selection`,a),g=c(`continuous-status`,i*16),_=[{name:`continuousPrevious`,buffer:m,location:12},{name:`continuousSelection`,buffer:h,location:13},{name:`continuousStatus`,buffer:g,location:14}].map(r=>({...r,resource:e.importBuffer({id:`${t}-${r.name}`,byteLength:r.buffer.byteLength,usage:n.STORAGE},r.buffer)})),v=r+Aa+`
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
 for(var impact=0u;impact<=${o}u;impact++){
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
  if(impact==${o}u){continuousStatus[body].x=1u;return;}
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
`,y=(n,r)=>{let a=[...s,..._].filter(e=>r.includes(e.name)),o={id:`${t}-${n}`,source:v,entryPoint:n,shaderLayout:{bindings:a.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:[`bodies`,`continuousSelection`].includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(a.map(e=>[e.name,e.buffer]))},c=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(i/64)})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:o.id,resources:a.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:[`bodies`,`continuousSelection`].includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>c(ye(e.device,o)),compileAsync:async()=>c(await be(e.device,o))})};return y(`saveContinuous`,[`positions`,`continuousPrevious`,`continuousStatus`]),{status:{buffer:g,resource:_[2].resource},finish:()=>y(`resolveContinuous`,[`settings`,`positions`,`orientations`,`velocities`,`bodies`,`continuousPrevious`,`continuousSelection`,`continuousStatus`,...l?[`targets`]:[]])}}function Pa(e,t,r,i,a,o,s,c,l,u,d){let f=2**Math.ceil(Math.log2(Math.max(1,u))),p=[{name:`continuousSelection`,buffer:c(`continuous-selection`,a),location:13},{name:`continuousStatus`,buffer:c(`continuous-status`,i*16),location:14},{name:`continuousWork`,buffer:c(`continuous-work`,64+f*32+i*64+l*48),location:15},{name:`continuousDispatch`,buffer:c(`continuous-dispatch`,16),location:16}].map(r=>({...r,resource:e.importBuffer({id:`${t}-${r.name}`,byteLength:r.buffer.byteLength,usage:n.STORAGE|(r.name===`continuousDispatch`?n.INDIRECT:0)},r.buffer)})),m=r+`
@group(0) @binding(13) var<storage,read> continuousSelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> continuousStatus:array<vec4u>;
`+Ma(l,o,d,f),h=(n,r,a)=>{let c=[...s,...p].filter(e=>a.includes(e.name)),l={saveConvexContinuous:[`positions`,`orientations`,`continuousWork`,`continuousStatus`],prepareConvexContinuous:[`settings`,`positions`,`orientations`,`velocities`,`bodies`,`continuousWork`],boundContinuousQueue:[`positions`,`velocities`,`bodies`,`continuousWork`],resetContinuousQueue:[`continuousWork`,`continuousDispatch`],buildContinuousQueue:[`bodies`,`continuousSelection`,`continuousWork`,`continuousDispatch`],findContinuousImpacts:[`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`continuousWork`],resolveConvexContinuous:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`continuousWork`,`continuousStatus`],checkConvexContinuous:[`positions`,`orientations`,`bodies`,`continuousWork`,`continuousStatus`]},u=e=>{let n=c.filter(t=>(l[e]??[`continuousWork`]).includes(t.name));return{id:`${t}-${e}`,source:m,entryPoint:e,shaderLayout:{bindings:n.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:[`bodies`,`continuousSelection`].includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(n.map(e=>[e.name,e.buffer]))}},d=e=>({encode:({computePass:t})=>{if(n===`resolve`){e[0].kernel.dispatch(t,{bindings:e[0].bindings,x:Math.ceil(i/64)});for(let n=0;n<=o;n++)for(let n=1;n<e.length-1;n++)r[n].entryPoint===`findContinuousImpacts`?e[n].kernel.dispatchIndirect(t,{bindings:e[n].bindings,indirectBuffer:p[3].buffer,indirectOffset:0}):e[n].kernel.dispatch(t,{bindings:e[n].bindings,x:r[n].groups});e[e.length-1].kernel.dispatch(t,{bindings:e[e.length-1].bindings,x:Math.ceil(i/64)})}else e[0].kernel.dispatch(t,{bindings:e[0].bindings,x:Math.ceil(i/64)})},destroy:()=>e.forEach(e=>e.kernel.destroy())});e.addComputePass({id:`${t}-${n}-convex-continuous`,description:n===`save`?`Checkpoint convex CCD trajectories.`:`Rebuild bounded swept queues, find TOIs in parallel and resolve impacts with exclusive ownership.`,resources:[...n===`resolve`?[{buffer:p[3].resource,usage:`indirect`}]:[],...c.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:[`bodies`,`continuousSelection`].includes(e.name)?`storage-read`:`storage-read-write`}))],compile:()=>d(r.map(t=>ye(e.device,u(t.entryPoint)))),compileAsync:async()=>d(await Promise.all(r.map(t=>be(e.device,u(t.entryPoint)))))})};return h(`save`,[{entryPoint:`saveConvexContinuous`,groups:Math.ceil(i/64)}],[`positions`,`orientations`,`continuousWork`,`continuousStatus`]),{status:{buffer:p[1].buffer,resource:p[1].resource},finish:()=>h(`resolve`,[{entryPoint:`prepareConvexContinuous`,groups:Math.ceil(i/64)},{entryPoint:`boundContinuousQueue`,groups:Math.ceil(f/64)},{entryPoint:`resetContinuousQueue`,groups:1},...Array.from({length:Math.log2(f)},(e,t)=>Array.from({length:t+1},(e,n)=>({entryPoint:`sortContinuous${2**(t+1)}_${2**(t-n)}`,groups:Math.ceil(f/64)}))).flat(),{entryPoint:`buildContinuousQueue`,groups:Math.ceil(u/64)},{entryPoint:`findContinuousImpacts`,groups:Math.ceil(l/64)},{entryPoint:`resolveConvexContinuous`,groups:1},{entryPoint:`checkConvexContinuous`,groups:1}],[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`bodies`,`continuousWork`,`continuousSelection`,`continuousStatus`,`continuousDispatch`])}}function Fa(e,t){let n=[],r=[];for(let[i,a]of e.entries()){let e=[...new Set(a.colliders)];if(!e.length||e.some(e=>!Number.isInteger(e)||!t[e]?.isTrigger||a.swept&&t[e].shape.type!==`sphere`))throw Error(`Invalid sensor colliders or swept trigger shapes`);let o=[...new Set(a.targets??t.flatMap((e,t)=>e.isTrigger?[]:[t]))];if(o.some(e=>!Number.isInteger(e)||!t[e]||a.swept&&t[e].shape.type!==`sphere`))throw Error(`Invalid trigger targets`);let s=new Set((a.excludedPairs??[]).map(([t,n])=>{if(!e.includes(t)||!o.includes(n))throw Error(`Invalid excluded trigger pair`);return`${t}:${n}`})),c=a.perCollider?o.map(e=>[e]):[...new Set(o.map(e=>t[e].body))].map(e=>o.filter(n=>t[n].body===e));for(let o of c){let c=t[o[0]].body,l=r.length/2;for(let n of e)for(let e of o)t[e].body===c&&t[n].body!==c&&!s.has(`${n}:${e}`)&&r.push(n,e);let u=r.length/2-l;u&&n.push(i,c,l,u|(a.swept?2147483648:0))}}if(n.length/4>65536||r.length/2>65536)throw Error(`Trigger pair capacity exceeded`);return{groups:new Uint32Array(n.length?n:[0,0,0,0]),pairs:new Uint32Array(r.length?r:[0,0]),count:n.length/4}}function Ia(e,t=0){let n=(e.length-4)/8,r=e[0],i=[];for(let a=Math.max(t,r-n);a<r;a++){let t=4+a%n*8;i.push({sequence:e[t],step:e[t+1],phase:e[t+2]===0?`enter`:`exit`,swept:e[t+3]!==0,trigger:e[t+4],body:e[t+5],triggerCollider:e[t+6],collider:e[t+7]})}return{sequence:r,step:e[1],dropped:Math.max(0,r-t-n),saturated:e[2]!==0,events:i}}function La(e,t,r,i,a,o,s,c,l,u=!1,d=!1){let f=[{name:`triggerPrevious`,key:`trigger-previous`,data:i*16},{name:`triggerGroups`,key:`trigger-groups`,data:a.groups},{name:`triggerPairs`,key:`trigger-pairs`,data:a.pairs},{name:`triggerSamples`,key:`trigger-samples`,data:Math.max(1,a.count)*16},{name:`triggerHistory`,key:`trigger-history`,data:Math.max(1,a.count)*16},{name:`triggerEvents`,key:`trigger-events`,data:16+o*32}].map((r,i)=>{let a=l(r.key,r.data);return{name:r.name,buffer:a,location:12+i,resource:e.importBuffer({id:`${t}-${r.key}`,byteLength:a.byteLength,usage:n.STORAGE},a)}}),p=r+Aa+`
@group(0) @binding(12) var<storage,read_write> triggerPrevious:array<vec4f>;
@group(0) @binding(13) var<storage,read> triggerGroups:array<vec4u>;
@group(0) @binding(14) var<storage,read> triggerPairs:array<vec2u>;
@group(0) @binding(15) var<storage,read_write> triggerSamples:array<vec4u>;
@group(0) @binding(16) var<storage,read_write> triggerHistory:array<vec4u>;
struct TriggerRecord {stamp:vec4u,identifiers:vec4u}
struct TriggerRing {sequence:u32,step:u32,saturated:u32,reserved:u32,entries:array<TriggerRecord,${o}>}
@group(0) @binding(17) var<storage,read_write> triggerEvents:TriggerRing;
@group(0) @binding(18) var<storage,read> triggerStatistics:array<u32>;
@compute @workgroup_size(64) fn saveTriggers(@builtin(global_invocation_id) invocation:vec3u){let collider=invocation.x;if(collider<COLLIDER_COUNT){triggerPrevious[collider]=vec4f(colliderPosition(collider),0);}}
@compute @workgroup_size(64) fn sampleTriggers(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=${a.count}u){return;}let group=triggerGroups[index];var overlapping=false;var crossed=false;var incomplete=false;var selected=vec2u(0);
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
 let slot=triggerEvents.sequence%${o}u;triggerEvents.sequence++;
 triggerEvents.entries[slot]=TriggerRecord(vec4u(triggerEvents.sequence,triggerEvents.step,phase,swept),vec4u(group.x,group.y,pair));
}
@compute @workgroup_size(1) fn publishTriggers(){
 if(triggerStatistics[1]!=0u||triggerStatistics[15]!=0u){return;}
 if(triggerEvents.step==0xffffffffu){triggerEvents.saturated=1u;return;}triggerEvents.step++;
 for(var index=0u;index<${a.count}u;index++){
  let sample=triggerSamples[index];let previous=triggerHistory[index];let group=triggerGroups[index];
  let overlapping=(sample.x&1u)!=0u;let prior=(previous.x&1u)!=0u;
  if(overlapping&&!prior){emitTrigger(group,sample.yz,0u,0u);}
  if(!overlapping&&prior){emitTrigger(group,previous.yz,1u,0u);}
  if(!overlapping&&!prior&&(sample.x&2u)!=0u){emitTrigger(group,sample.yz,0u,1u);emitTrigger(group,sample.yz,1u,1u);}
  triggerHistory[index]=sample;
 }
}
`,m=(n,r,i)=>{let a=[...s,...f,c].filter(e=>r.includes(e.name)),o=[`bodies`,`triggerGroups`,`triggerPairs`,`triggerStatistics`],l={id:`${t}-${n}`,source:p,entryPoint:n,shaderLayout:{bindings:a.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:o.includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(a.map(e=>[e.name,e.buffer]))},u=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.max(1,Math.ceil(i/64))})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:l.id,resources:a.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:o.includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>u(ye(e.device,l)),compileAsync:async()=>u(await be(e.device,l))})};return m(`saveTriggers`,[`positions`,`orientations`,`bodies`,`triggerPrevious`],i),{events:f[5].buffer,samples:{buffer:f[3].buffer,resource:f[3].resource,count:a.count},sample:()=>m(`sampleTriggers`,[...d?[`settings`]:[],`positions`,`orientations`,`bodies`,`triggerPrevious`,`triggerGroups`,`triggerPairs`,`triggerSamples`,...u?[`targets`]:[]],a.count),publish:()=>m(`publishTriggers`,[`triggerStatistics`,`triggerGroups`,`triggerSamples`,`triggerHistory`,`triggerEvents`],1)}}function Ra(e,t,r,i,a,o,s,c,l){let u=r[0].buffer.byteLength/16,d=u/s,f=r[5],{headOffset:p,linkOffset:m,journalOffset:h,savedKeyOffset:g,savedLinkOffset:_,savedHeadOffset:v,savedHeaderOffset:y,savedManifoldOffset:b}=wa(u,d,c),x=(t,r)=>{let i=l(t,r);return{buffer:i,resource:e.importBuffer({id:i.id,byteLength:r,usage:n.STORAGE|n.COPY_DST},i)}},S=r.slice(0,5).map((e,t)=>x(`checkpoint-${t}`,e.buffer.byteLength)),C=x(`state-validity`,u*4),w=(n,r,i,o=!1)=>{let s={id:`${t}-${n}`,entryPoint:`main`,source:`${r.map((e,t)=>`@group(0) @binding(${t}) var<storage,${e.writable?`read_write`:`read`}> ${e.name}:array<${e.atomic?`atomic<u32>`:`u32`}>;`).join(`
`)}\n${i}`,shaderLayout:{bindings:r.map((e,t)=>({name:e.name,group:0,location:t,type:e.writable?`storage`:`read-only-storage`}))},bindings:Object.fromEntries(r.map(e=>[e.name,e.buffer]))},c=e=>({encode:({computePass:t})=>{o?e.kernel.dispatchIndirect(t,{bindings:e.bindings,indirectBuffer:a.buffer,indirectOffset:16}):e.kernel.dispatch(t,{bindings:e.bindings,x:1})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:s.id,workload:{commandCount:1},resources:[...r.map(e=>({buffer:e.resource,usage:e.writable?`storage-read-write`:`storage-read`})),...o?[{buffer:a.resource,usage:`indirect`}]:[]],compile:()=>c(ye(e.device,s)),compileAsync:async()=>c(await be(e.device,s))})},T=`let work=invocation.x;if(work>=ensemble[0]*${s}u){return;}
 let body=ensemble[${16+d*8}u+work/${s}u]*${s}u+work%${s}u;`;return{save:()=>{w(`checkpoint-metadata`,[{...f,name:`targets`,writable:!0},{...a,name:`ensemble`},{...C,name:`validity`,writable:!0}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(invocation.x==0u){validity[0]=0u;}
 if(invocation.x<8u){targets[${y}u+invocation.x]=targets[${u*8}u+invocation.x];}
 for(var work=invocation.x;work<ensemble[0];work+=64u){
  let instance=ensemble[${16+d*8}u+work];
  targets[${v}u+instance]=targets[${p}u+instance];
  targets[${v+d}u+instance]=targets[${p+d}u+instance];
 }
}`),r.slice(0,5).forEach((e,t)=>w(`checkpoint-${t}`,[{...e,name:`state`},{...S[t],name:`snapshot`,writable:!0},{...a,name:`ensemble`}],`@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${T}
 for(var word=0u;word<4u;word++){snapshot[body*4u+word]=state[body*4u+word];}
}`,!0))},restore:()=>{w(`rollback-contacts`,[{...o,name:`manifolds`,writable:!0},{...f,name:`targets`},{...i,name:`statistics`}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let count=targets[${u*8+5}u];
 for(var work=invocation.x;work<count*104u;work+=64u){
  let pair=targets[${h}u+work/104u];let word=work%104u;
  manifolds[pair*104u+word]=targets[${b}u+pair*104u+word];
 }
}`),w(`rollback-allocator`,[{...f,name:`targets`,writable:!0},{...a,name:`ensemble`},{...i,name:`statistics`}],`
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
}`),r.slice(0,5).forEach((e,t)=>w(`rollback-${t}`,[{...e,name:`state`,writable:!0},{...S[t],name:`snapshot`},{...i,name:`statistics`},{...a,name:`ensemble`}],`@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 ${T}
 for(var word=0u;word<4u;word++){state[body*4u+word]=snapshot[body*4u+word];}
}`,!0))},validate:()=>w(`validate`,[...r.slice(0,4).map((e,t)=>({...e,name:[`positions`,`orientations`,`velocities`,`angularVelocities`][t]})),{...C,name:`validity`,writable:!0,atomic:!0},{...a,name:`ensemble`}],`
fn finite(value:u32)->bool{return abs(bitcast<f32>(value))<=3.402823466e38;}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${T}
 var valid=true;
 for(var word=0u;word<4u;word++){let address=body*4u+word;valid=valid&&finite(positions[address])&&finite(orientations[address])&&finite(velocities[address])&&finite(angularVelocities[address]);}
 if(!valid){atomicAdd(&validity[0],1u);}
}`,!0),validity:{...C,count:1}}}function za(e,t,r,i,a){let o=r.map((r,i)=>{let o=a(`checkpoint-${i}`,r.buffer.byteLength);return{...r,snapshot:o,snapshotResource:e.importBuffer({id:`${t}-checkpoint-${i}`,byteLength:o.byteLength,usage:n.STORAGE|n.COPY_DST},o)}});e.addCopyPass({id:`${t}-checkpoint`,description:`Save simulation state so an incomplete step can be rolled back.`,resources:o.flatMap(e=>[{buffer:e.resource,usage:`copy-source`},{buffer:e.snapshotResource,usage:`copy-destination`}]),compile:()=>({encode:({commandEncoder:e,getBuffer:t})=>{for(let n of o)e.copyBufferToBuffer({sourceBuffer:t(n.resource),destinationBuffer:t(n.snapshotResource),size:n.buffer.byteLength})}})});let s=()=>{let n=o.map((n,r)=>{let a=Math.ceil(n.buffer.byteLength/256),o=Math.min(a,e.device.limits.maxComputeWorkgroupsPerDimension);return{id:`${t}-restore-${r}`,entryPoint:`restore`,source:`
@group(0) @binding(0) var<storage,read_write> state:array<u32>;
@group(0) @binding(1) var<storage,read> snapshot:array<u32>;
@group(0) @binding(2) var<storage,read> statistics:array<u32>;
@compute @workgroup_size(64) fn restore(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let index=invocation.x+invocation.y*${o*64}u;
 if(index<arrayLength(&state)){state[index]=snapshot[index];}
}`,shaderLayout:{bindings:[{name:`state`,group:0,location:0,type:`storage`},{name:`snapshot`,group:0,location:1,type:`read-only-storage`},{name:`statistics`,group:0,location:2,type:`read-only-storage`}]},bindings:{state:n.buffer,snapshot:n.snapshot,statistics:i.buffer},horizontal:o,vertical:Math.ceil(a/o)}}),r=e=>({encode:({computePass:t})=>{for(let[r,i]of e.entries())i.kernel.dispatch(t,{bindings:i.bindings,x:n[r].horizontal,y:n[r].vertical})},destroy:()=>{for(let t of e)t.kernel.destroy()}});e.addComputePass({id:`${t}-rollback`,description:`Restore saved simulation state when diagnostics reject the step.`,resources:[{buffer:i.resource,usage:`storage-read`},...o.flatMap(e=>[{buffer:e.resource,usage:`storage-read-write`},{buffer:e.snapshotResource,usage:`storage-read`}])],compile:()=>r(n.map(t=>ye(e.device,t))),compileAsync:async()=>r(await Promise.all(n.map(t=>be(e.device,t))))})},c=a(`state-validity`,r[0].buffer.byteLength/4),l=e.importBuffer({id:`${t}-state-validity`,byteLength:c.byteLength,usage:n.STORAGE},c);return{save:void 0,restore:s,validate:()=>{let n=[`positions`,`orientations`,`velocities`,`angularVelocities`],i={id:`${t}-validate`,source:`
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> velocities:array<vec4f>;
@group(0) @binding(3) var<storage,read> angularVelocities:array<vec4f>;
@group(0) @binding(4) var<storage,read_write> validity:array<u32>;
fn finite(value:vec4f)->bool{return all(abs(value)<=vec4f(3.402823466e38));}
@compute @workgroup_size(64) fn validate(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=arrayLength(&positions)){return;}
 validity[body]=select(1u,0u,finite(positions[body])&&finite(orientations[body])&&finite(velocities[body])&&finite(angularVelocities[body]));
}`,entryPoint:`validate`,shaderLayout:{bindings:[...n.map((e,t)=>({name:e,group:0,location:t,type:`read-only-storage`})),{name:`validity`,group:0,location:4,type:`storage`}]},bindings:{...Object.fromEntries(n.map((e,t)=>[e,r[t].buffer])),validity:c}},a=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(r[0].buffer.byteLength/1024)})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:i.id,description:`Validate body state before publishing the completed simulation step.`,resources:[...r.slice(0,4).map(e=>({buffer:e.resource,usage:`storage-read`})),{buffer:l,usage:`storage-read-write`}],compile:()=>a(ye(e.device,i)),compileAsync:async()=>a(await be(e.device,i))})},validity:{buffer:c,resource:l,count:r[0].buffer.byteLength/16}}}function Ba(e,t,r,i,a,o,s){let c=new Float32Array(r.length*12);for(let[e,t]of r.entries())c.set([...t.centerOfMass??[0,0,0],0,...i[e][0],0,...i[e][1],0],e*12);let l=s(`pose-metadata`,c),u=new Float32Array(r.length*16);for(let[e,t]of r.entries())u.set(new Gi().translate(t.position).multiplyRight(new Gi().fromQuaternion(_a(t.orientation))),e*16);let d=s(`pose-matrices`,u),f=s(`pose-bounds`,r.length*32),p=(r,i)=>({buffer:i,resource:e.importBuffer({id:`${t}-${r}`,byteLength:i.byteLength,usage:n.STORAGE},i)}),m={positions:a,orientations:o,metadata:p(`pose-metadata`,l),matrices:p(`pose-matrices`,d),worldBounds:p(`pose-bounds`,f)},h={id:`${t}-publish-poses`,source:`
struct Bounds {minimum:vec4f,maximum:vec4f}
struct Metadata {center:vec4f,minimum:vec4f,maximum:vec4f}
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> metadata:array<Metadata>;
@group(0) @binding(3) var<storage,read_write> matrices:array<mat4x4f>;
@group(0) @binding(4) var<storage,read_write> worldBounds:array<Bounds>;
fn rotate(rotation:vec4f,point:vec3f)->vec3f{return point+2.0*cross(rotation.xyz,cross(rotation.xyz,point)+rotation.w*point);}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=${r.length}u){return;}
 let rotation=orientations[body];let origin=positions[body].xyz-rotate(rotation,metadata[body].center.xyz);
 let horizontal=rotate(rotation,vec3f(1,0,0));let vertical=rotate(rotation,vec3f(0,1,0));let depth=rotate(rotation,vec3f(0,0,1));
 matrices[body]=mat4x4f(vec4f(horizontal,0),vec4f(vertical,0),vec4f(depth,0),vec4f(origin,1));
 let center=(metadata[body].minimum.xyz+metadata[body].maximum.xyz)*0.5;let extent=(metadata[body].maximum.xyz-metadata[body].minimum.xyz)*0.5;
 let worldCenter=origin+rotate(rotation,center);let worldExtent=abs(horizontal)*extent.x+abs(vertical)*extent.y+abs(depth)*extent.z;
 worldBounds[body]=Bounds(vec4f(worldCenter-worldExtent,0),vec4f(worldCenter+worldExtent,0));
}`,shaderLayout:{bindings:Object.keys(m).map((e,t)=>({name:e,group:0,location:t,type:t<3?`read-only-storage`:`storage`}))},bindings:Object.fromEntries(Object.entries(m).map(([e,t])=>[e,t.buffer]))},g,_=e=>(g=e,{encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(r.length/64)})},destroy:()=>e.kernel.destroy()});return e.addComputePass({id:h.id,resources:Object.values(m).map((e,t)=>({buffer:e.resource,usage:t<3?`storage-read`:`storage-write`})),compile:()=>_(ye(e.device,h)),compileAsync:async()=>_(await be(e.device,h))}),{matrices:d,bounds:f,encode:e=>{let t=e.beginComputePass();g.kernel.dispatch(t,{bindings:g.bindings,x:Math.ceil(r.length/64)}),t.end()}}}var Va=`
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
`,Ha=`
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
`;function Ua(e){return`
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
`}var Wa=`
const MESH_TASK_CAPACITY:u32=65536u;
struct MeshTask { key:vec4u, point:vec4f, normal:vec4f }
struct MeshTasks { count:atomic<u32>, overflow:atomic<u32>, unresolved:atomic<u32>, incomplete:atomic<u32>, entries:array<MeshTask,65536> }
@group(0) @binding(10) var<storage,read_write> meshTasks:MeshTasks;
${ja}
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
`;function Ga(e,t=!1){let n=`
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
`,n):n}function Ka(e,t,n=e,r=!1,i,a=!1,o=65536,s=`fn jointActive(body:u32)->bool{return false;} fn jointExcluded(first:u32,second:u32)->bool{return false;}`,c=!1,l=0,u=0,d=0,f=!0,p,m){return`
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
${zr(e,m,p,r)}
${i?Ga(i,!!m):`
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
${Va}
${i?Ha:``}
${r?m?Wa.replace(`for(var pair=0u;pair<PAIR_CAPACITY;pair++){`,`for(var index=0u;index<atomicLoad(&targets.reserved0);index++){let pair=targets.journalSlots[index];if(manifolds[pair].padding.z==0u){continue;}`):Wa:``}
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
${a?Ua(!!m):``}
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
`}function qa(e,t=0){let n=(e.length-4)/16,r=e[0],i=Math.max(t,r-n),a=new Float32Array(e.buffer,e.byteOffset,e.length),o=[];for(let t=i;t<r;t++){let r=4+t%n*16;o.push({sequence:e[r],step:e[r+1],phase:e[r+2]===0?`begin`:e[r+2]===1?`impact`:`end`,bodies:[e[r+4],e[r+5]],colliders:[e[r+6],e[r+7]],point:[a[r+8],a[r+9],a[r+10]],normalImpulse:a[r+11],normal:[a[r+12],a[r+13],a[r+14]]})}return{sequence:r,step:e[1],dropped:Math.max(0,r-t-n),saturated:e[2]!==0,events:o}}function Ja(e,t,n=!1){return`
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
}`}var Ya=`
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
`,Xa=class{worldOrigin=[0,0,0];id;count;timeStep;colliderCount;colliderStorageCount;broadPhase;solver;maximumPairs;poseMatrices=null;poseBounds=null;encodePosePublication;positions=null;orientations=null;velocities=null;angularVelocities=null;sleepStates=null;contactEvents=null;triggerEvents=null;triggerCursor=0;triggerRead=null;eventCursor=0;eventRead=null;queryComputation=null;queryReduction=null;querySettings=null;querySelection=null;queryOutput=null;queryPending=!1;targets=null;simulationStatistics=null;colliders;props;ownedBuffers=[];ensembleBuffer=null;ensembleResetOrigin;ensembleReset;initialEnsembleBodies;manifolds=null;meshTasks=null;parallelState=null;parallelDispatch=null;device=null;control=null;invalidation=null;controlSettings=null;destroyed=!1;colliderShapeScales=new Map;gpuCheckpoints=new Set;broadPhaseCounters=null;constructor(e){for(let t of[e.linearDamping??0,e.angularDamping??0])if(!Number.isFinite(t)||t<0)throw Error(`Invalid damping`);if(e.publicationBounds&&(e.publicationBounds.length!==e.bodies.length||e.publicationBounds.some(e=>e.some(e=>e.length!==3||!e.every(e=>Number.isFinite(Math.fround(e))))||e[0].some((t,n)=>t>e[1][n]))))throw Error(`Invalid publication bounds`);if(this.id=e.id??`gpu-rigid-body-world`,this.count=e.bodies.length,this.solver=e.solver??`ordered`,![`ordered`,`parallel`].includes(this.solver))throw Error(`Invalid rigid-body solver`);Ea(e.joints??[],e.bodies,this.solver);let t=e.bodies.reduce((e,t)=>e+(t.colliders?.length??1),0);this.broadPhase=e.broadPhase??(Math.max(this.count,t)>128?`hierarchical-grid`:`all-pairs`),this.timeStep=e.timeStep??1/120;let n=e.iterations??16;if([e.warmStartFactor??1,e.penetrationRecoveryFraction??.15,e.parallelRelaxation??1].some(e=>!Number.isFinite(e)||e<0||e>1)||e.parallelRelaxation===0||!Number.isFinite(e.maximumRecoverySpeed??2)||(e.maximumRecoverySpeed??2)<0)throw Error(`Invalid rigid-body stability settings`);if(e.failurePolicy&&![`report`,`rollback`].includes(e.failurePolicy))throw Error(`Invalid failure policy`);let r=e.eventCapacity??0;if(!Number.isInteger(r)||r<0||r>65536||!Number.isFinite(e.impactImpulseThreshold??1)||(e.impactImpulseThreshold??1)<0)throw Error(`Invalid contact event settings`);let i=e.maximumMeshTraversalTestsPerPair??65536;if(!Number.isInteger(i)||i<1||i>1048576)throw Error(`Invalid mesh traversal budget`);let a=e.maximumCandidateTestsPerCollider??4096;if(!Number.isInteger(a)||a<1||a>65535)throw Error(`Invalid rigid-body traversal budget`);if(this.count<1||this.count>(this.broadPhase===`all-pairs`?128:65535)||!(this.timeStep>0)||!Number.isFinite(this.timeStep)||!Number.isInteger(n)||n<1||n>64)throw Error(`Invalid rigid-body capacity or timestep`);let o=[];for(let[t,n]of e.bodies.entries()){if(!Number.isFinite(n.mass??1)||(n.mass??1)<0)throw Error(`Invalid rigid body mass`);if(n.shape?n.colliders!==void 0:n.colliders===void 0)throw Error(`Supply shape or colliders`);let e=n.colliders??(n.shape?[{shape:n.shape}]:[]);for(let r of e){let e=Lr(r.shape);if(!Number.isFinite(e.volume)||!e.center.every(Number.isFinite)||!e.tensor.every(Number.isFinite))throw Error(`Invalid shape properties`);if((r.shape.type===`convex-hull`||r.shape.type===`triangle-mesh`)&&n.mode!==`static`&&n.mass!==0&&(!(e.volume>0)||(r.shape.type===`convex-hull`||r.shape.type===`triangle-mesh`)&&!r.shape.geometry.closed))throw Error(`Dynamic meshes require closed positive-volume geometry`);if(_a(r.orientation),!(r.position??[]).every(Number.isFinite))throw Error(`Invalid collider position`);let i=r.material;if([i?.staticFriction??.6,i?.dynamicFriction??.6,i?.restitution??.1].some(e=>!Number.isFinite(e)||e<0)||(i?.restitution??.1)>1)throw Error(`Invalid collider material`);o.push({...r,body:t})}if(_a(n.orientation),_a(n.inertiaOrientation),n.inertiaOrientation&&!n.inertiaDiagonal)throw Error(`Inertia orientation requires diagonal`);if(!(n.centerOfMass??[]).every(Number.isFinite)||(n.inertiaDiagonal??[]).some(e=>!Number.isFinite(e)||e<0)||!Number.isFinite(n.gravityFactor??1))throw Error(`Invalid mass properties`);if(![...n.position,...n.velocity??[],...n.angularVelocity??[],...n.orientation??[]].every(Number.isFinite)||!Number.isFinite(n.friction??.6)||(n.friction??.6)<0||!Number.isFinite(n.restitution??.1)||(n.restitution??.1)<0||(n.restitution??.1)>1)throw Error(`Invalid rigid body`)}if(!(e.gravity??[0,0,-9.81]).every(Number.isFinite)||[e.contactSlop??.002,e.contactMatchDistance??.05,e.restitutionThreshold??.5,e.sleepAfter??.5,e.sleepLinearSpeed??.04,e.sleepAngularSpeed??.04].some(e=>!Number.isFinite(e)||e<0))throw Error(`Invalid rigid-body settings`);if(o.length>(this.broadPhase===`all-pairs`?128:65535))throw Error(`Rigid-body collider capacity exceeded`);for(let e of o)if(e.excludedColliders?.some(e=>!Number.isInteger(e)||e<0||e>=o.length))throw Error(`Invalid collider filter`);if(e.collisionPartitionSize!==void 0&&(!Number.isSafeInteger(e.collisionPartitionSize)||e.collisionPartitionSize<1||!o.length||o.length%e.collisionPartitionSize!==0||e.joints?.length||e.continuous||e.triggers?.length))throw Error(`Invalid collision partitions`);if(e.ensembleBodiesPerInstance!==void 0&&(!Number.isSafeInteger(e.ensembleBodiesPerInstance)||e.ensembleBodiesPerInstance<1||this.count%e.ensembleBodiesPerInstance!==0||!e.collisionPartitionSize||this.count/e.ensembleBodiesPerInstance!==o.length/e.collisionPartitionSize||this.solver!==`parallel`||this.broadPhase!==`hierarchical-grid`))throw Error(`Invalid ensemble scheduling layout`);if(this.colliderCount=o.length,this.colliderStorageCount=Math.max(1,o.length),o.length||o.push({body:0,shape:{type:`box`,halfExtents:[0,0,0]}}),this.maximumPairs=this.broadPhase===`all-pairs`?this.colliderStorageCount*this.colliderStorageCount:e.maximumPairs??2**Math.ceil(Math.log2(Math.max(64,this.colliderStorageCount*16))),![`all-pairs`,`hierarchical-grid`].includes(this.broadPhase)||!Number.isSafeInteger(this.maximumPairs)||this.maximumPairs<1||this.maximumPairs>1073741824||this.broadPhase===`hierarchical-grid`&&this.maximumPairs&this.maximumPairs-1)throw Error(`Invalid rigid-body pair capacity`);if(e.continuous){if(e.failurePolicy!==`rollback`||!Number.isInteger(e.continuous.maximumImpacts??4)||(e.continuous.maximumImpacts??4)<1||(e.continuous.maximumImpacts??4)>16||![`sphere-static`,`convex`].includes(e.continuous.mode??`sphere-static`)||!Number.isSafeInteger(e.continuous.maximumCandidates??this.maximumPairs)||(e.continuous.maximumCandidates??this.maximumPairs)<1||(e.continuous.maximumCandidates??this.maximumPairs)>1073741824||e.continuous.mode===`convex`&&(e.joints?.length||o.some(e=>[`plane`,`triangle-mesh`].includes(e.shape.type))))throw Error(`Invalid continuous settings`);for(let t of e.continuous.bodies){let n=e.bodies[t],r=o.filter(e=>e.body===t);if(!Number.isInteger(t)||!n||(n.mode??((n.mass??1)===0?`static`:`dynamic`))!==`dynamic`||n.mass===0||r.length!==1||r[0].isTrigger||e.continuous.mode!==`convex`&&r[0].shape.type!==`sphere`||e.continuous.mode!==`convex`&&(r[0].position??[0,0,0]).some((e,t)=>e!==(n.centerOfMass??[0,0,0])[t]))throw Error(`Invalid continuous body geometry`)}}if(e.triggers?.length){if(e.failurePolicy!==`rollback`||!Number.isInteger(e.triggerEventCapacity??256)||(e.triggerEventCapacity??256)<1||(e.triggerEventCapacity??256)>65536)throw Error(`Invalid trigger settings`);Fa(e.triggers,o)}let s=structuredClone({colliders:o,props:e});this.colliders=s.colliders,this.props=s.props,e.ensembleBodiesPerInstance&&(this.initialEnsembleBodies=this.props.bodies.slice(0,e.ensembleBodiesPerInstance))}getStorageLayout(){let e=Wr(this.colliders),t=this.broadPhase===`hierarchical-grid`,n=this.colliders.some(e=>e.shape.type!==`sphere`&&e.shape.type!==`box`||e.isTrigger&&e.shape.type!==`sphere`),r=this.solver===`parallel`,i={packed:e,sparse:t,extended:n,parallel:r,...ka(this.count,this.colliderStorageCount,this.maximumPairs,e.geometry.length,t,n,r,this.props.eventCapacity??0,this.props.enableQueries??!1,this.props.failurePolicy===`rollback`,!!this.props.continuous,this.props.joints?.length??0,this.props.ensembleBodiesPerInstance?this.count/this.props.ensembleBodiesPerInstance:0)};this.props.continuous?.mode===`convex`&&(i.buffers=i.buffers.filter(e=>e.name!==`continuous-previous`),i.buffers.push({name:`continuous-dispatch`,byteLength:16,uniform:!1}),i.buffers.push({name:`continuous-work`,byteLength:64+2**Math.ceil(Math.log2(Math.max(1,this.colliders.length)))*32+this.count*64+(this.props.continuous.maximumCandidates??this.maximumPairs)*48,uniform:!1})),(this.props.publicationBounds||this.props.publishPoses)&&i.buffers.push({name:`pose-metadata`,byteLength:this.count*48,uniform:!1},{name:`pose-matrices`,byteLength:this.count*64,uniform:!1},{name:`pose-bounds`,byteLength:this.count*32,uniform:!1});let a=this.props.triggers?.length?Fa(this.props.triggers,this.colliders):void 0;return a&&i.buffers.push({name:`trigger-previous`,byteLength:this.colliderStorageCount*16,uniform:!1},{name:`trigger-groups`,byteLength:a.groups.byteLength,uniform:!1},{name:`trigger-pairs`,byteLength:a.pairs.byteLength,uniform:!1},{name:`trigger-samples`,byteLength:Math.max(1,a.count)*16,uniform:!1},{name:`trigger-history`,byteLength:Math.max(1,a.count)*16,uniform:!1},{name:`trigger-events`,byteLength:16+(this.props.triggerEventCapacity??256)*32,uniform:!1}),this.props.ensembleBodiesPerInstance&&i.buffers.push({name:`ensemble`,byteLength:(16+9*this.count/this.props.ensembleBodiesPerInstance)*4,uniform:!1}),this.props.ensembleBodiesPerInstance&&i.buffers.push({name:`ensemble-buckets`,byteLength:(2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2)))+this.colliderStorageCount+2)*4,uniform:!1}),{...i,triggerLayout:a}}initializeEnsembleReset(){if(!this.device||!this.ensembleBuffer||this.destroyed)throw Error(`World has no ensemble scheduler`);return this.ensembleResetOrigin??=this.origin,this.ensembleReset??=Hr(this.device,this.id,this.ownedBuffers,this.count,this.props.ensembleBodiesPerInstance,this.props.collisionPartitionSize,this.maximumPairs),this.ensembleReset.byteLength}resetEnsembleInstance(e){if(this.assertEnsembleInstance(e),!this.ensembleReset)throw Error(`Ensemble reset image unavailable`);let t=e*this.props.ensembleBodiesPerInstance,n=e*this.props.collisionPartitionSize,r=n,i=this.initialEnsembleBodies.map(e=>{if(e.shape){let t=this.colliders[r++].shape;return{...e,shape:e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`?t:e.shape}}return{...e,colliders:e.colliders.map(e=>{let t=this.colliders[r++].shape;return{...e,shape:e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`?t:e.shape,excludedColliders:e.excludedColliders?.map(e=>e+n)}})}}),a=[...this.props.bodies];a.splice(t,i.length,...i),this.props.bodies=a;for(let e=n;e<n+this.props.collisionPartitionSize;e++)this.colliderShapeScales.delete(e);if(this.restoreColliderDefinitions(),this.ensembleReset.reset(e,this.origin.map((e,t)=>e-this.ensembleResetOrigin[t])),this.ensembleBuffer.write(new Uint32Array([0,0,0,0,1,1]),(16+e*8+1)*4),this.encodePosePublication){let e=this.device.createCommandEncoder();this.encodePosePublication(e),this.device.submit(e.finish())}}wakeEnsembleInstance(e){this.assertEnsembleInstance(e),this.ensembleBuffer.write(new Uint32Array([1]),(16+e*8+6)*4),this.sleepStates.write(new Uint32Array(this.props.ensembleBodiesPerInstance*4),e*this.props.ensembleBodiesPerInstance*16)}setEnsembleActive(e,t){this.assertEnsembleInstance(e),this.ensembleBuffer.write(new Uint32Array([t?1:0]),(16+e*8)*4)}async readEnsembleState(){if(!this.ensembleBuffer||this.destroyed)throw Error(`World has no ensemble scheduler`);return new Uint32Array((await this.ensembleBuffer.readAsync()).buffer)}async readEnsembleWork(){if(!this.ensembleBuffer||!this.targets||this.destroyed)throw Error(`World has no ensemble scheduler`);let e=this.ownedBuffers.find(e=>e.id===`${this.id}-ensemble-buckets`),t=2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2))),[n,r,i]=await Promise.all([this.ensembleBuffer.readAsync(0,4),this.targets.readAsync(this.count*32+20,12),e.readAsync(t*4,4)]),a=new Uint32Array(n.buffer)[0],[o,s,c]=new Uint32Array(r.buffer),l=a*this.props.ensembleBodiesPerInstance;return{activeInstances:a,activeBodies:l,touchedBuckets:new Uint32Array(i.buffer)[0],visitedContacts:s,claimedContacts:c,journaledContacts:o,bodySnapshotBytes:l*80,contactSnapshotBytes:o*416,allocatorSnapshotBytes:(8+a*2+o*3)*4,residentInstances:this.count/this.props.ensembleBodiesPerInstance,residentBodies:this.count,contactCapacity:this.maximumPairs}}assertEnsembleInstance(e){if(!this.ensembleBuffer||this.destroyed||!Number.isSafeInteger(e)||e<0||e>=this.count/this.props.ensembleBodiesPerInstance)throw Error(`Invalid ensemble instance`)}getCapacityInfo(){let{buffers:e}=this.getStorageLayout();return{bodyCount:this.count,colliderCount:this.colliderCount,maximumPairs:this.maximumPairs,pairWorkgroups:Math.ceil(this.maximumPairs/64),buffers:e,ownedBufferBytes:e.reduce((e,t)=>e+t.byteLength,0)}}addToGraph(e){if(this.device||this.destroyed)throw Error(`Rigid-body world already attached or destroyed`);let{packed:t,sparse:r,extended:i,parallel:a,geometryOffset:o,pairOffset:s,diagnosticOffset:c,metadataLength:l,parallelByteLength:u,triggerLayout:d,buffers:f}=this.getStorageLayout();if(Math.ceil(this.maximumPairs/64)>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Rigid-body pair dispatch exceeds device limits`);if(this.props.continuous?.mode===`convex`&&Math.max(Math.ceil((this.props.continuous.maximumCandidates??this.maximumPairs)/64),Math.ceil(2**Math.ceil(Math.log2(Math.max(1,this.colliders.length)))/64))>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Continuous candidate dispatch exceeds device limits`);for(let t of f){let n=t.uniform?e.device.limits.maxUniformBufferBindingSize:e.device.limits.maxStorageBufferBindingSize;if(t.byteLength>Math.min(e.device.limits.maxBufferSize,n))throw Error(`Rigid-body ${t.name} storage exceeds device limits`)}this.device=e.device;let p=(t,r,i=!1)=>{let a=e.device.createBuffer({id:`${this.id}-${t}`,...typeof r==`number`?{byteLength:r}:{data:r},usage:(i?n.UNIFORM:n.STORAGE)|n.COPY_DST|n.COPY_SRC|([`targets`,`parallel-dispatch`,`continuous-dispatch`,`ensemble`].includes(t)?n.INDIRECT:0)});return this.ownedBuffers.push(a),a},m=new Float32Array(this.count*4),h=new Float32Array(this.count*4),g=new Float32Array(this.count*4),_=new Float32Array(this.count*4),v=r?{maximumPairs:this.maximumPairs,pairOffset:s-o,diagnosticOffset:c-o}:void 0,y=new Float32Array(l);y.set(t.geometry,o);let b=Array.from({length:this.count},()=>[]);if(this.colliderCount)for(let e of this.colliders)b[e.body].push(e);for(let[e,t]of this.props.bodies.entries()){let n=t.mass??1,r=t.mode??(n===0?`static`:`dynamic`),i=t.centerOfMass??[0,0,0],a=_a(t.orientation),o=ga(a,i);m.set([...t.position.map((e,t)=>e+o[t]),t.shape?.type===`sphere`?t.shape.radius:0],e*4),h.set(a,e*4),g.set([...r===`static`?[0,0,0]:t.velocity??[0,0,0],r===`dynamic`&&n?1/n:0],e*4),_.set(r===`static`?[0,0,0]:t.angularVelocity??[0,0,0],e*4);let s=va(n,b[e],i),c=t.inertiaDiagonal??s.diagonal,l=_a(t.inertiaOrientation??(t.inertiaDiagonal?void 0:s.orientation));y.set([...c.map(e=>r===`dynamic`&&e?1/e:0),i[0],...l,r===`static`?0:r===`dynamic`?1:2,t.gravityFactor??1,i[1],i[2]],e*12)}let x=[`average`,`minimum`,`maximum`,`multiply`];for(let[e,n]of this.colliders.entries()){let r=this.props.bodies[n.body],i=n.material,a=r.centerOfMass??[0,0,0],o=(n.position??[0,0,0]).map((e,t)=>e-a[t]),s=t.shapes[e];y.set([...s.dimensions,...o,n.body,..._a(n.orientation),i?.restitution??r.restitution??.1,i?.staticFriction??r.friction??.6,i?.dynamicFriction??r.friction??.6,n.isTrigger?1:0,i?.restitutionCombine?x.indexOf(i.restitutionCombine):4,i?.frictionCombine?x.indexOf(i.frictionCombine):4,...s.policies,...s.padding],this.count*12+e*24)}let S=this.count*12+this.colliderStorageCount*24;for(let[e,n]of t.filters.entries())y.set(n,S+e*2);this.positions=p(`positions`,m),this.orientations=p(`orientations`,h),this.velocities=p(`velocities`,g),this.angularVelocities=p(`angular-velocities`,_),this.sleepStates=p(`sleep`,this.count*16),this.targets=p(`targets`,this.props.ensembleBodiesPerInstance?wa(this.count,this.count/this.props.ensembleBodiesPerInstance,this.maximumPairs).byteLength:Math.ceil((this.count*32+(r?32+this.maximumPairs*8:16))/16)*16+(this.props.joints?.length??0)*176);for(let[e,t]of(this.props.joints??[]).entries())this.targets.write(Oa(t),this.getJointStateOffset()+e*176);this.manifolds=p(`manifolds`,this.maximumPairs*416),i&&(this.meshTasks=p(`mesh-tasks`,3145744));let C=p(`bodies`,y);r&&(this.broadPhaseCounters={buffer:C,byteOffset:c*4});let w=p(`settings`,new Float32Array([...this.props.gravity??[0,0,-9.81],this.timeStep,this.props.contactSlop??.002,0,this.props.restitutionThreshold??.5,this.props.contactMatchDistance??.05,this.props.sleepAfter??.5,this.props.sleepLinearSpeed??.04,this.props.sleepAngularSpeed??.04,0,this.props.warmStartFactor??1,this.props.penetrationRecoveryFraction??.15,this.props.maximumRecoverySpeed??2,this.props.parallelRelaxation??1]),!0);if(a&&(this.parallelState=p(`parallel-state`,u),this.parallelDispatch=p(`parallel-dispatch`,48)),this.props.ensembleBodiesPerInstance){let e=this.count/this.props.ensembleBodiesPerInstance,t=new Uint32Array(16+e*9);for(let n=0;n<e;n++)t[16+n*8]=1,t[16+n*8+5]=1;this.ensembleBuffer=p(`ensemble`,t)}let T={settings:w,positions:this.positions,orientations:this.orientations,velocities:this.velocities,angularVelocities:this.angularVelocities,bodies:C,manifolds:this.manifolds,sleepStates:this.sleepStates,targets:this.targets,...this.meshTasks?{meshTasks:this.meshTasks}:{},...this.parallelState?{parallelState:this.parallelState,parallelDispatch:this.parallelDispatch}:{},...r?{minima:p(`minima`,this.colliderStorageCount*12),maxima:p(`maxima`,this.colliderStorageCount*12)}:{}},ee={...T,...this.ensembleBuffer?{ensemble:this.ensembleBuffer}:{}},E=Object.entries(ee).map(([t,r],i)=>({name:t,buffer:r,location:t===`ensemble`?28:t===`parallelDispatch`?27:t===`parallelState`?26:t===`minima`?24:t===`maxima`?25:i>=8?i+1:i,resource:e.importBuffer({id:`${this.id}-${t}`,byteLength:r.byteLength,usage:i===0?n.UNIFORM:n.STORAGE|n.COPY_SRC|([`targets`,`parallelDispatch`,`ensemble`].includes(t)?n.INDIRECT:0)},r)})),D={attributes:[],bindings:E.map(({name:e,location:t})=>{let n={name:e,location:t,group:0};return t===0?{...n,type:`uniform`}:{...n,type:e===`bodies`?`read-only-storage`:`storage`}})},O=r?p(`object-attributes`,Uint32Array.from(this.colliders,e=>{let t=this.props.bodies[e.body],n=t.mode??((t.mass??1)===0?`static`:`dynamic`);return e.body|(n===`dynamic`?65536:0)})):null,k=O?e.createDataView(e.importBuffer({id:`${this.id}-object-attributes`,byteLength:O.byteLength,usage:n.STORAGE},O),{format:`uint32`,length:this.colliderStorageCount}):void 0,A=Ka(this.count,this.props.iterations??16,this.colliderStorageCount,i,v,a,this.props.maximumMeshTraversalTestsPerPair??65536,Da(this.props.joints??[],this.props.bodies),!!this.props.joints?.length,this.props.linearDamping??0,this.props.angularDamping??0,this.props.joints?.length??0,this.props.compactContacts??!0,this.props.collisionPartitionSize,this.props.ensembleBodiesPerInstance),te={parallelReset:[`parallelState`],parallelResetCounters:[`parallelState`],parallelActiveBodies:[`bodies`,`sleepStates`,`parallelState`],parallelPrepareSleep:[`parallelState`],parallelCompact:[`manifolds`,`parallelState`,...this.ensembleBuffer?[`targets`]:[]],parallelDispatchCount:[`parallelState`,`parallelDispatch`],parallelActive:[`bodies`,`sleepStates`,`manifolds`,`parallelState`],parallelActiveCount:[`parallelState`,`parallelDispatch`],parallelLink:[`velocities`,`angularVelocities`,`bodies`,`manifolds`,`parallelState`],parallelUnion:[`bodies`,`manifolds`,`parallelState`],parallelCompress:[`sleepStates`,`parallelState`],parallelWakeRoots:[`bodies`,`sleepStates`,`parallelState`],parallelWakeBodies:[`bodies`,`sleepStates`,`parallelState`],parallelWarm:[`positions`,`orientations`,`velocities`,`bodies`,`manifolds`,`sleepStates`,`parallelState`],parallelPairs:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`manifolds`,`sleepStates`,`parallelState`],parallelGather:[`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`parallelState`],parallelAdvance:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`targets`,...this.ensembleBuffer?[]:[`parallelState`]],parallelMarkSleep:[`settings`,`bodies`,`sleepStates`,`parallelState`],parallelSleep:[`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`parallelState`]};if(te.parallelSolve=te.parallelPairs,this.props.joints?.length){let e=[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`targets`];te.parallelJointWarm=e,te.parallelJointSolve=e,te.parallelSolve=[...new Set([...te.parallelSolve,...e])]}this.simulationStatistics=p(`simulation-statistics`,64);let j=e.importBuffer({id:`${this.id}-statistics`,byteLength:64,usage:n.STORAGE},this.simulationStatistics),M=[`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`targets`].map(e=>{let t=E.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}}),ne=this.props.failurePolicy===`rollback`?this.ensembleBuffer?Ra(e,this.id,M,{buffer:this.simulationStatistics,resource:j},E.find(e=>e.name===`ensemble`),E.find(e=>e.name===`manifolds`),this.props.ensembleBodiesPerInstance,this.maximumPairs,p):za(e,this.id,[`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`targets`,...this.ensembleBuffer?[]:[`manifolds`]].map(e=>{let t=E.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}}),{buffer:this.simulationStatistics,resource:j},p):void 0,re=new Uint32Array(this.count);for(let e of this.props.continuous?.bodies??[])re[e]=this.colliders.findIndex(t=>t.body===e)+1;let N=this.props.continuous?Na(e,this.id,A,this.count,re,this.props.continuous.maximumImpacts??4,E,p,!!this.props.joints?.length,this.props.continuous.mode===`convex`?this.props.continuous.maximumCandidates??this.maximumPairs:0,this.colliderStorageCount,i,this.colliders.some(e=>e.shape.type===`convex-hull`)):void 0,ie=d?La(e,this.id,A,this.colliderStorageCount,d,this.props.triggerEventCapacity??256,E,{name:`triggerStatistics`,buffer:this.simulationStatistics,resource:j,location:18},p,!!this.props.joints?.length,i):void 0;this.triggerEvents=ie?.events??null;let ae={integrate:`Apply gravity and advance body velocities and predicted poses for this timestep.`,prepare:`Reset broad-phase counters before generating potential collider pairs.`,bounds:`Compute world-space collider bounds for broad-phase collision detection.`,collide:`Find overlapping collider pairs and generate contact manifolds.`,meshCollide:`Generate contacts against triangle meshes and heightfields.`,meshCollect:`Collect mesh contacts for the parallel constraint solver.`,solve:`Resolve contact and joint constraints, including friction and restitution.`,finish:`Publish solved body poses and update sleeping state.`,parallelReset:`Initialize body ownership for parallel contact islands.`,parallelCompact:`Compact live contact manifolds into a reusable GPU work queue.`,parallelDispatchCount:`Build indirect workgroup counts from the compact contact queue.`,parallelLink:`Link bodies connected by active contacts or joints.`,parallelUnion:`Merge connected bodies into constraint islands.`,parallelCompress:`Compress island links to their root body.`,parallelWakeRoots:`Mark islands that must wake for active constraints.`,parallelWakeBodies:`Wake bodies belonging to active constraint islands.`,parallelActive:`Compact awake bodies and contacts after connected islands wake.`,parallelActiveCount:`Build indirect dispatches for awake solver work.`,parallelAdvance:`Advance body poses using the solved velocities.`,parallelMarkSleep:`Identify islands whose bodies are quiet enough to sleep.`,parallelSleep:`Put quiet constraint islands to sleep.`};for(let t of[...this.ensembleBuffer?[`ensembleClear`,`ensembleMark`,`ensembleCompact`,`ensembleDispatch`]:[],`integrate`,...r?[...this.ensembleBuffer?[`prepareStart`]:[],`prepare`,`bounds`]:[],`collide`,...i?[`meshCollide`]:[],...a?[...i?[`meshCollect`]:[],...this.ensembleBuffer&&this.props.compactContacts!==!1?[`parallelResetCounters`]:[],`parallelReset`,...this.props.compactContacts===!1?[]:[`parallelCompact`,`parallelDispatchCount`],`parallelLink`,`parallelUnion`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,...this.props.compactContacts===!1?[]:[...this.ensembleBuffer?[`parallelActiveBodies`]:[],`parallelActive`,`parallelActiveCount`],`parallelSolve`,`parallelAdvance`,...this.ensembleBuffer?[`parallelPrepareSleep`]:[],`parallelMarkSleep`,`parallelSleep`]:[...i&&this.props.joints?.length?[`meshCollect`]:[],`solve`,`finish`]]){if(t===`integrate`&&ne?.save?.(),r&&t===`collide`){let t=E.find(e=>e.name===`bodies`),r=E.find(e=>e.name===`minima`),i=E.find(e=>e.name===`maxima`),a=this.ensembleBuffer?p(`ensemble-buckets`,(2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2)))+this.colliderStorageCount+2)*4):void 0;Se(e,new ba({...a?{bucketState:e.createDataView(e.importBuffer({id:a.id,byteLength:a.byteLength,usage:n.STORAGE},a),{format:`uint32`,length:a.byteLength/4})}:{},id:`${this.id}-broad-phase`,objectMetadata:k,partitionSize:this.props.collisionPartitionSize,...this.ensembleBuffer?{activeInstances:e.createDataView(E.find(e=>e.name===`ensemble`).resource,{format:`uint32`,length:this.ensembleBuffer.byteLength/4})}:{},maximumCandidateTestsPerQuery:this.props.maximumCandidateTestsPerCollider,minima:e.createDataView(r.resource,{format:`float32x3`,length:this.colliderStorageCount}),maxima:e.createDataView(i.resource,{format:`float32x3`,length:this.colliderStorageCount}),pairs:e.createDataView(t.resource,{format:`uint32x2`,length:this.maximumPairs,byteOffset:s*4}),diagnostics:e.createDataView(t.resource,{format:`uint32`,length:8,byteOffset:c*4})}).getCommandNodes(e))}let o=[...t.startsWith(`parallel`)?E.filter(e=>!te[t].includes(e.name)).map(e=>e.name):t===`meshCollect`?[`sleepStates`,...this.ensembleBuffer?[]:[`targets`],`parallelState`]:[`prepare`,`prepareStart`].includes(t)?E.filter(e=>!(t===`prepareStart`?[`targets`]:[`targets`,`manifolds`]).includes(e.name)).map(e=>e.name):t===`bounds`?E.filter(e=>![`settings`,`positions`,`orientations`,`bodies`,`minima`,`maxima`].includes(e.name)).map(e=>e.name):t===`meshCollide`?[`velocities`,`angularVelocities`,`manifolds`,`sleepStates`,`targets`]:t===`integrate`?[`manifolds`,...this.ensembleBuffer?[`meshTasks`]:[]]:t===`collide`?[`sleepStates`,...i||r||this.props.joints?.length?[]:[`targets`]]:t===`finish`?[`manifolds`,`meshTasks`]:this.props.joints?.length?[]:[`targets`],...t===`solve`&&this.props.joints?.length?[`meshTasks`]:[],...t.startsWith(`parallel`)?[]:[`parallelState`,`parallelDispatch`],...t===`bounds`?[]:[`minima`,`maxima`]],l=[`integrate`,`bounds`,`prepare`,`parallelReset`,`parallelPrepareSleep`,`parallelActiveBodies`,`parallelCompact`,`parallelActive`,`parallelLink`,`parallelUnion`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,`parallelAdvance`,`parallelMarkSleep`,`parallelSleep`].includes(t),u=e=>t.startsWith(`ensemble`)?e===`ensemble`||t===`ensembleClear`&&i&&[`meshTasks`,`targets`].includes(e):e===`ensemble`?l:!o.includes(e),d=E.filter(e=>u(e.name)),f={attributes:[],bindings:D.bindings.filter(e=>u(e.name)).map(e=>e.name===`ensemble`&&!t.startsWith(`ensemble`)?{...e,type:`read-only-storage`}:e)},m=a&&this.props.compactContacts!==!1&&[`parallelSolve`,`parallelLink`,`parallelUnion`,...this.ensembleBuffer?[`parallelActive`]:[]].includes(t),h=E.find(e=>e.name===`parallelDispatch`),g=E.find(e=>e.name===`ensemble`),_=!!(this.ensembleBuffer&&[`integrate`,`bounds`,`parallelAdvance`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,`parallelPrepareSleep`,`parallelMarkSleep`,`parallelSleep`,`parallelActiveBodies`,...this.props.compactContacts===!1?[]:[`parallelReset`]].includes(t)),v=_?[{buffer:g.resource,usage:`indirect`}]:m?[{buffer:h.resource,usage:`indirect`}]:[];if(t===`parallelSolve`){let t=[`parallelWarm`,`parallelPairs`,`parallelGather`,...this.props.joints?.length?[`parallelJointWarm`,`parallelJointSolve`]:[]],n=t.map(e=>({id:`${this.id}-${e}`,source:A,entryPoint:e,shaderLayout:{attributes:[],bindings:f.bindings.filter(t=>te[e].includes(t.name))}})),r=e=>({encode:({computePass:n,getBuffer:r})=>{let i={};for(let e of d)i[e.name]=r(e.resource);for(let[n,r]of e.entries())Object.assign(r.bindings,Object.fromEntries(Object.entries(i).filter(([e])=>te[t[n]].includes(e))));let a=e=>{m?e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(h.resource),indirectOffset:16}):e.kernel.dispatch(n,{bindings:e.bindings,x:Math.ceil(this.maximumPairs/64)})},o=e=>{m?e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(h.resource),indirectOffset:32}):e.kernel.dispatch(n,{bindings:e.bindings,x:Math.ceil(this.count/64)})};a(e[0]),o(e[2]),e[3]&&e[3].kernel.dispatch(n,{bindings:e[3].bindings,x:1});for(let t=0;t<(this.props.iterations??16);t++)a(e[1]),o(e[2]),e[4]&&e[4].kernel.dispatch(n,{bindings:e[4].bindings,x:1})},destroy:()=>{for(let t of e)t.kernel.destroy()}});e.addComputePass({id:`${this.id}-solve`,workload:{commandCount:(this.props.joints?.length?3:2)+(this.props.joints?.length?3:2)*(this.props.iterations??16)},description:ae.solve,resources:[...v,...d.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:e.name===`bodies`?`storage-read`:`storage-read-write`}))],compile:({device:e})=>r(n.map(t=>ye(e,t))),compileAsync:async({device:e})=>r(await Promise.all(n.map(t=>be(e,t))))});continue}let y=e=>({encode:({computePass:n,getBuffer:r})=>{let i={};for(let e of d)i[e.name]=r(e.resource);if(Object.assign(e.bindings,i),_)e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(g.resource),indirectOffset:t===`bounds`?32:16});else if(m)e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(h.resource),indirectOffset:0});else if(t===`meshCollide`){let t=E.find(e=>e.name===`targets`);e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(t.resource),indirectOffset:this.count*32})}else e.kernel.dispatch(n,{bindings:e.bindings,x:t===`ensembleDispatch`?1:t.startsWith(`ensemble`)||this.ensembleBuffer&&[`prepare`,`parallelCompact`].includes(t)?Math.ceil(this.count/this.props.ensembleBodiesPerInstance/64):[`parallelLink`,`parallelUnion`,`parallelCompact`].includes(t)?Math.ceil(this.maximumPairs/64):t===`parallelActive`?Math.ceil(Math.max(this.maximumPairs,this.count)/64):[`parallelDispatchCount`,`parallelActiveCount`,`parallelResetCounters`].includes(t)?1:t.startsWith(`parallel`)?Math.ceil(this.count/64):t===`collide`?Math.ceil(this.maximumPairs/64):t===`bounds`?Math.ceil(this.colliderStorageCount/64):t===`integrate`?Math.ceil(this.count/64):1})},destroy:()=>e.kernel.destroy()}),b={id:`${this.id}-${t}`,source:t.startsWith(`ensemble`)?A:Br(A),entryPoint:t,shaderLayout:f};e.addComputePass({id:b.id,workload:{commandCount:1},description:ae[t],resources:[...v,...d.map(e=>({buffer:e.resource,usage:e.location===0?`uniform`:e.name===`bodies`||e.name===`ensemble`&&!t.startsWith(`ensemble`)?`storage-read`:`storage-read-write`})),...t===`meshCollide`?[{buffer:E.find(e=>e.name===`targets`).resource,usage:`indirect`}]:[]],compile:({device:e})=>y(ye(e,b)),compileAsync:async({device:e})=>y(await be(e,b))})}N?.finish(),ie?.sample(),ne?.validate();let oe=e=>{let t=E.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}};if(Ca(e,`${this.id}-diagnostics`,this.simulationStatistics,{statisticsResource:j,...ne?{validity:ne.validity}:{},...ie?{triggers:ie.samples}:{},...N?{continuous:{...N.status,count:this.count}}:{},...r?{broadPhase:{...oe(`bodies`),wordOffset:c},targets:{...oe(`targets`),wordOffset:this.count*8+4}}:{},...i?{meshTasks:oe(`meshTasks`)}:{},...a?{parallelState:oe(`parallelState`)}:{}}),ne?.restore(),this.ensembleBuffer&&Vr(e,this.id,this.count/this.props.ensembleBodiesPerInstance,this.props.ensembleBodiesPerInstance,oe(`bodies`),oe(`sleepStates`),oe(`ensemble`),{buffer:this.simulationStatistics,resource:j}),ie?.publish(),this.props.publicationBounds||this.props.publishPoses){let t=Ba(e,this.id,this.props.bodies,this.props.publicationBounds??this.props.bodies.map(()=>[[0,0,0],[0,0,0]]),oe(`positions`),oe(`orientations`),p);this.encodePosePublication=t.encode,this.poseMatrices=t.matrices,this.poseBounds=this.props.publicationBounds?t.bounds:null}if(this.props.eventCapacity){let t=p(`contact-history`,this.maximumPairs*16);this.contactEvents=p(`contact-events`,16+this.props.eventCapacity*64);let r=[...E.filter(e=>[`bodies`,`manifolds`,`ensemble`].includes(e.name)),...this.props.failurePolicy===`rollback`?[{name:`eventStatistics`,buffer:this.simulationStatistics,resource:j,location:14}]:[],...[{name:`contactHistory`,buffer:t,location:12},{name:`contactEvents`,buffer:this.contactEvents,location:13}].map(t=>({...t,resource:e.importBuffer({id:`${this.id}-${t.name}`,byteLength:t.buffer.byteLength,usage:n.STORAGE},t.buffer)}))],i={id:`${this.id}-contact-events`,source:A+Ja(this.props.eventCapacity,this.props.impactImpulseThreshold??1,this.props.failurePolicy===`rollback`),entryPoint:`recordContacts`,shaderLayout:{bindings:r.map(({name:e,location:t})=>({name:e,location:t,group:0,type:[`bodies`,`eventStatistics`].includes(e)?`read-only-storage`:`storage`}))}},a=e=>({encode:({computePass:t,getBuffer:n})=>{Object.assign(e.bindings,Object.fromEntries(r.map(e=>[e.name,n(e.resource)]))),e.kernel.dispatch(t,{bindings:e.bindings,x:1})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:i.id,description:`Compare contact history and publish contact begin, persist, and end events.`,resources:r.map(e=>({buffer:e.resource,usage:[`bodies`,`eventStatistics`].includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>a(ye(e.device,i)),compileAsync:async()=>a(await be(e.device,i))})}if(this.props.enableQueries){this.querySettings=p(`query-settings`,48,!0),this.querySelection=p(`query-selection`,Math.max(4,this.colliderStorageCount*4)),this.queryOutput=p(`query-output`,16+Math.max(1,this.colliderStorageCount)*48);let t={id:`${this.id}-queries`,source:A+Aa+Ya,entryPoint:`queryColliders`,shaderLayout:{bindings:[...D.bindings.filter(e=>[`positions`,`orientations`,`bodies`].includes(e.name)),{name:`query`,group:0,location:12,type:`uniform`},{name:`querySelection`,group:0,location:13,type:`read-only-storage`},{name:`queryOutput`,group:0,location:14,type:`storage`}]},bindings:{positions:this.positions,orientations:this.orientations,bodies:C,query:this.querySettings,querySelection:this.querySelection,queryOutput:this.queryOutput}};this.queryComputation=ye(e.device,t),this.queryReduction=ye(e.device,{...t,entryPoint:`reduceQueries`,shaderLayout:{bindings:t.shaderLayout.bindings.filter(e=>[`query`,`querySelection`,`queryOutput`].includes(e.name))},bindings:{query:this.querySettings,querySelection:this.querySelection,queryOutput:this.queryOutput}})}this.controlSettings=p(`control-settings`,64,!0);let se={id:`${this.id}-impulse`,source:A+`
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
}`,entryPoint:`control`,shaderLayout:{bindings:[...D.bindings.filter(e=>![`settings`,`meshTasks`,`parallelState`,`parallelDispatch`,`minima`,`maxima`].includes(e.name)),{name:`command`,group:0,location:8,type:`uniform`}]},bindings:{...Object.fromEntries(Object.entries(T).filter(([e])=>![`settings`,`meshTasks`,`parallelState`,`parallelDispatch`,`minima`,`maxima`].includes(e))),command:this.controlSettings}};this.control=ye(e.device,{...se,shaderLayout:{bindings:se.shaderLayout.bindings.filter(e=>![`sleepStates`,`manifolds`].includes(e.name))},bindings:Object.fromEntries(Object.entries(se.bindings).filter(([e])=>![`sleepStates`,`manifolds`].includes(e)))});let ce=[`sleepStates`,`manifolds`,...this.props.joints?.length?[`targets`]:[]];this.invalidation=ye(e.device,{...se,id:`${this.id}-invalidate`,entryPoint:`invalidate`,shaderLayout:{bindings:se.shaderLayout.bindings.filter(e=>ce.includes(e.name))},bindings:Object.fromEntries(Object.entries(se.bindings).filter(([e])=>ce.includes(e)))})}invalidateState(e){this.ensembleBuffer?.write(new Uint32Array([1]),4);let t=Math.ceil(Math.max(this.count,this.maximumPairs,this.props.joints?.length??0)/64);this.invalidation.kernel.dispatch(e,{bindings:this.invalidation.bindings,x:Math.min(65535,t),y:Math.ceil(t/65535)})}get origin(){return[...this.worldOrigin]}shiftOrigin(e){if(!this.device||this.destroyed||this.queryPending||this.eventRead||this.triggerRead)throw Error(`Origin shifting requires an idle attached world`);if(e.length!==3||e.some(e=>!Number.isFinite(e)||Math.fround(e)!==e))throw Error(`Origin shift must be an exactly representable float32 vector`);e.every(e=>e===0)||(Rr(this.device,this.id,this.ownedBuffers,this.count,this.colliderStorageCount,this.maximumPairs,this.props.eventCapacity??0,e),this.worldOrigin=this.worldOrigin.map((t,n)=>t+e[n]),this.publishPoses())}getBodyMode(e){let t=this.props.bodies[e];return t?t.mode??((t.mass??1)===0?`static`:`dynamic`):void 0}applyImpulse(e,t,n){if(!this.control||!this.device||!this.controlSettings||this.destroyed||!Number.isInteger(e)||e<0||e>=this.count||![...t,...n??[]].every(Number.isFinite))throw Error(`Invalid rigid-body impulse`);let r=new ArrayBuffer(64);new Float32Array(r).set([...t,0,...n??[0,0,0],0]),new Uint32Array(r)[12]=e,new Uint32Array(r)[13]=n?0:2,this.controlSettings.write(new Uint8Array(r));let i=this.device.createCommandEncoder(),a=i.beginComputePass();this.control.kernel.dispatch(a,{bindings:this.control.bindings,x:1}),this.invalidateState(a),a.end(),this.device.submit(i.finish())}getBodyParameters(e,{deriveInertia:t=!0}={}){let n=this.props.bodies[e];if(!n||this.destroyed)throw Error(`Invalid body`);let{mode:r,mass:i,centerOfMass:a,inertiaDiagonal:o,inertiaOrientation:s,velocity:c,angularVelocity:l,gravityFactor:u}=n,d=va(i??1,this.colliders.filter(t=>t.body===e),a??[0,0,0]);return structuredClone({mode:r??((i??1)===0?`static`:`dynamic`),mass:i??1,centerOfMass:a??[0,0,0],inertiaDiagonal:o??(t?d.diagonal:void 0),inertiaOrientation:s??(t?o?[0,0,0,1]:d.orientation:void 0),velocity:c??[0,0,0],angularVelocity:l??[0,0,0],gravityFactor:u??1})}publishPoses(){if(!this.device||this.destroyed)throw Error(`Unavailable physics world`);if(!this.encodePosePublication)return;let e=this.device.createCommandEncoder();this.encodePosePublication(e),this.device.submit(e.finish())}setPublicationBounds(e){if(!this.poseBounds||e.length!==this.count||e.some(e=>e.length!==2||e.some(e=>e.length!==3||!e.every(e=>Number.isFinite(Math.fround(e))))||e[0].some((t,n)=>t>e[1][n])))throw Error(`Invalid publication bounds`);let t=this.ownedBuffers.find(e=>e.id===`${this.id}-pose-metadata`),n=new Float32Array(this.count*12);for(let[t,r]of this.props.bodies.entries())n.set([...r.centerOfMass??[0,0,0],0,...e[t][0],0,...e[t][1],0],t*12);t.write(n),this.props.publicationBounds=structuredClone(e)}getColliderShapeScale(e){return this.getColliderShape(e),[...this.colliderShapeScales.get(e)??[1,1,1]]}getColliderShape(e){let t=this.colliders[e];if(!Number.isInteger(e)||!t||this.destroyed)throw Error(`Invalid collider`);return structuredClone(t.shape)}setColliderShapes(e){if(!this.device||this.destroyed)throw Error(`World is not attached`);let t=new Set,n=e.map(e=>{let n=this.getColliderShape(e.collider),r=structuredClone(e.shape);if(e.shapeScale&&(e.shapeScale.length!==3||e.shapeScale.some(e=>!Number.isFinite(e)||e<=0)))throw Error(`Invalid collider shape scale`);if(t.has(e.collider)||n.type!==r.type||r.type===`convex-hull`||r.type===`triangle-mesh`)throw Error(`Shape edit requires a topology rebuild`);t.add(e.collider);let i=Lr(r),a=Wr([{shape:r}]).shapes[0];if(![...a.dimensions,i.volume,...i.tensor,...i.center].every(e=>Number.isFinite(Math.fround(e))))throw Error(`Shape exceeds float32 range`);return{collider:e.collider,shape:r,dimensions:a.dimensions,shapeScale:e.shapeScale}}),r=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!r)throw Error(`World is not attached`);for(let e of n)r.write(new Float32Array(e.dimensions),this.count*48+e.collider*96),this.colliders[e.collider].shape=e.shape,e.shapeScale&&this.colliderShapeScales.set(e.collider,[...e.shapeScale]);for(let e of new Set(n.map(e=>this.colliders[e.collider].body)))this.updateColliderDefinitions(e),this.setBodyParameters(e,{})}setColliderMaterial(e,t){let n=this.colliders[e];if(!this.device||this.destroyed||!Number.isInteger(e)||!n)throw Error(`Invalid collider`);let r=[`average`,`minimum`,`maximum`,`multiply`];if([t.staticFriction??.6,t.dynamicFriction??.6,t.restitution??.1].some(e=>!Number.isFinite(Math.fround(e))||e<0)||(t.restitution??.1)>1||[t.frictionCombine,t.restitutionCombine].some(e=>e!==void 0&&!r.includes(e)))throw Error(`Invalid collider material`);let i=this.props.bodies[n.body],a=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!a)throw Error(`World is not attached`);a.write(new Float32Array([t.restitution??i.restitution??.1,t.staticFriction??i.friction??.6,t.dynamicFriction??i.friction??.6]),this.count*48+e*96+48),a.write(new Float32Array([t.restitutionCombine?r.indexOf(t.restitutionCombine):4,t.frictionCombine?r.indexOf(t.frictionCombine):4]),this.count*48+e*96+64),n.material=structuredClone(t),this.updateColliderDefinitions(n.body),this.wake()}setColliderTransform(e,t,n){let r=this.colliders[e];if(this.destroyed||!this.device||!r||!t.every(e=>Number.isFinite(Math.fround(e))))throw Error(`Invalid collider transform`);let i=_a(n),a=this.props.bodies[r.body].centerOfMass??[0,0,0];if(this.props.continuous?.mode!==`convex`&&this.props.continuous?.bodies.includes(r.body)&&t.some((e,t)=>e!==a[t]))throw Error(`Collider transform exceeds continuous envelope`);let o=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!o)throw Error(`World is not attached`);o.write(new Float32Array([...t.map((e,t)=>e-a[t]),r.body,...i]),this.count*48+e*96+16),r.position=[...t],r.orientation=i,this.updateColliderDefinitions(r.body),this.setBodyParameters(r.body,{})}updateColliderDefinitions(e){let{shape:t,colliders:n,...r}=this.props.bodies[e],i=this.colliders.filter(t=>t.body===e).map(({body:e,...t})=>t),a=[...this.props.bodies];a[e]={...r,colliders:i},this.props.bodies=a}getColliderMaterial(e){let t=this.colliders[e];if(!t||this.destroyed)throw Error(`Invalid collider`);return structuredClone(t.material??{})}restoreColliderDefinitions(){let e=this.props.bodies.flatMap(e=>e.colliders??(e.shape?[{shape:e.shape}]:[]));for(let[t,n]of e.entries()){let e=this.colliders[t];e.shape=n.shape,e.material=n.material,e.position=n.position,e.orientation=n.orientation}}setBodyParameters(e,t){if(!this.device||!this.control||!this.controlSettings||this.destroyed||!Number.isInteger(e)||!this.props.bodies[e])throw Error(`Invalid body mutation`);let n=this.props.bodies[e],r={...n,...structuredClone(t)},i=r.mass??1,a=r.mode??(i===0?`static`:`dynamic`),o=r.centerOfMass??[0,0,0],s=n.centerOfMass??[0,0,0];if(![`static`,`dynamic`,`kinematic`].includes(a)||!Number.isFinite(Math.fround(i))||i<0||![...o,...r.velocity??[],...r.angularVelocity??[],r.gravityFactor??1].every(e=>Number.isFinite(Math.fround(e)))||(r.inertiaDiagonal??[]).some(e=>!Number.isFinite(Math.fround(e))||e<0)||r.inertiaOrientation&&!r.inertiaDiagonal)throw Error(`Invalid motion properties`);if(this.props.joints?.length){let t=[...this.props.bodies];t[e]=r,Ea(this.props.joints,t,this.solver)}let c=this.colliders.filter(t=>t.body===e);for(let e of c)if((e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`)&&a!==`static`&&i>0&&(!e.shape.geometry.closed||!(Lr(e.shape).volume>0)))throw Error(`Dynamic meshes require closed positive-volume geometry`);if(this.props.continuous?.bodies.includes(e)&&(a!==`dynamic`||i===0||this.props.continuous.mode!==`convex`&&(c[0].position??[0,0,0]).some((e,t)=>e!==o[t])))throw Error(`Mutation exceeds the continuous body envelope`);let l=va(i,c,o),u=r.inertiaDiagonal??l.diagonal,d=_a(r.inertiaOrientation??(r.inertiaDiagonal?void 0:l.orientation)),f=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);f.write(new Float32Array([...u.map(e=>a===`dynamic`&&e?1/e:0),o[0],...d,a===`static`?0:a===`dynamic`?1:2,r.gravityFactor??1,o[1],o[2]]),e*48);let p=this.ownedBuffers.find(e=>e.id===`${this.id}-object-attributes`);for(let[t,n]of this.colliders.entries())n.body===e&&(f.write(new Float32Array((n.position??[0,0,0]).map((e,t)=>e-o[t])),this.count*48+t*96+16),p?.write(new Uint32Array([e|(a===`dynamic`?65536:0)]),t*4));this.ownedBuffers.find(e=>e.id===`${this.id}-pose-metadata`)?.write(new Float32Array(o),e*48);let m=new ArrayBuffer(64);new Float32Array(m).set([...o.map((e,t)=>e-s[t]),a===`dynamic`&&i?1/i:0,...t.velocity??[0,0,0],t.velocity?1:0,...t.angularVelocity??[0,0,0],t.angularVelocity?1:0]),new Uint32Array(m).set([e,6,a===this.getBodyMode(e)?0:1],12),this.controlSettings.write(new Uint8Array(m));let h=this.device.createCommandEncoder(),g=h.beginComputePass();this.control.kernel.dispatch(g,{bindings:this.control.bindings,x:1}),this.invalidateState(g),g.end(),this.device.submit(h.finish());let _=[...this.props.bodies];_[e]=r,this.props.bodies=_}applyAngularImpulse(e,t){if(!this.control||!this.device||!this.controlSettings||this.destroyed||!Number.isInteger(e)||e<0||e>=this.count||!t.every(Number.isFinite))throw Error(`Invalid angular impulse`);let n=new ArrayBuffer(64);new Float32Array(n).set(t),new Uint32Array(n)[12]=e,new Uint32Array(n)[13]=5,this.controlSettings.write(new Uint8Array(n));let r=this.device.createCommandEncoder(),i=r.beginComputePass();this.control.kernel.dispatch(i,{bindings:this.control.bindings,x:1}),this.invalidateState(i),i.end(),this.device.submit(r.finish())}setKinematicTarget(e,t,n){if(!this.control||!this.controlSettings||!this.device||this.destroyed||!Number.isInteger(e)||this.props.bodies[e]?.mode!==`kinematic`||!t.every(Number.isFinite))throw Error(`Invalid kinematic target`);let r=_a(n),i=ga(r,this.props.bodies[e].centerOfMass??[0,0,0]),a=new ArrayBuffer(64);new Float32Array(a).set([...t.map((e,t)=>e+i[t]),0],4),new Float32Array(a).set(r,8),new Uint32Array(a).set([e,1],12),this.controlSettings.write(new Uint8Array(a));let o=this.device.createCommandEncoder(),s=o.beginComputePass();this.control.kernel.dispatch(s,{bindings:this.control.bindings,x:1}),this.invalidateState(s),s.end(),this.device.submit(o.finish())}getJointStateOffset(){return Math.ceil((this.count*32+(this.broadPhase===`hierarchical-grid`?32+this.maximumPairs*8:16))/16)*16}getJointParameters(e){let t=this.props.joints?.[e];if(!t||this.destroyed)throw Error(`Invalid joint`);return structuredClone(t)}setJointParameters(e,t){this.setJointParameterEdits([{index:e,parameters:t}])}setJointParameterEdits(e){for(let{index:t,parameters:n}of e)this.validateJointParameters(t,n);for(let{index:t,parameters:n}of e)this.writeJointParameters(t,n)}validateJointParameters(e,t){let n=this.props.joints?.[e];if(!n||!this.targets||this.destroyed||n.type!==t.type||n.first!==t.first||n.second!==t.second||JSON.stringify(n.firstFrame)!==JSON.stringify(t.firstFrame)||JSON.stringify(n.secondFrame)!==JSON.stringify(t.secondFrame))throw Error(`Joint topology must remain unchanged`);Ea([t],this.props.bodies,this.solver)}writeJointParameters(e,t){let n=[...this.props.joints];n[e]=structuredClone(t),this.props.joints=n,this.targets.write(Oa(t),this.getJointStateOffset()+e*176),this.setJointEnabled(e,t.enabled!==!1)}setJointEnabled(e,t){if(!this.control||!this.controlSettings||!this.device||this.destroyed||!Number.isInteger(e)||!this.props.joints?.[e])throw Error(`Invalid joint`);let n=new ArrayBuffer(64);new Float32Array(n)[0]=t?1:0,new Uint32Array(n).set([e,3],12),this.controlSettings.write(new Uint8Array(n));let r=this.device.createCommandEncoder(),i=r.beginComputePass();this.control.kernel.dispatch(i,{bindings:this.control.bindings,x:1}),this.invalidateState(i),i.end(),this.device.submit(r.finish());let a=[...this.props.joints];a[e]={...a[e],enabled:t},this.props.joints=a}wake(){if(this.destroyed||!this.device||!this.invalidation)return;let e=this.device.createCommandEncoder(),t=e.beginComputePass();this.invalidateState(t),t.end(),this.device.submit(e.finish())}readContactEvents(){return!this.contactEvents||this.destroyed?Promise.reject(Error(`Contact events are not enabled`)):(this.eventRead||=this.contactEvents.readAsync().then(e=>{let t=qa(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.eventCursor);return this.eventCursor=t.sequence,t}).finally(()=>{this.eventRead=null}),this.eventRead)}raycast(e){return this.runQuery(e)}overlapSphere(e){return this.runQuery(e)}async runQuery(e){if(!this.device||!this.queryComputation||!this.querySettings||!this.querySelection||!this.queryOutput||this.destroyed||this.queryPending)throw Error(`Queries are disabled or busy`);let t=`origin`in e,n=t&&`radius`in e,r=t?e.origin:e.center,i=t?e.direction:[0,0,0],a=Math.hypot(...i),o=t?1:e.maximumHits??this.colliderCount;if(n&&(!Number.isFinite(e.radius)||e.radius<0)||r.length!==3||!r.every(e=>Number.isFinite(Math.fround(e)))||i.length!==3||!i.every(Number.isFinite)||(t?!Number.isFinite(a)||a===0||!Number.isFinite(e.maximumDistance)||e.maximumDistance<0:!Number.isFinite(e.radius)||e.radius<0)||!Number.isInteger(o)||o<0||o>Math.max(1,this.colliderCount)||e.excludeBody!==void 0&&(!Number.isInteger(e.excludeBody)||e.excludeBody<0||e.excludeBody>=this.count))throw Error(`Invalid collision query`);let s=e.colliderIndices??Array.from({length:this.colliderCount},(e,t)=>t),c=new Uint32Array(this.colliderStorageCount);for(let t of s){if(!Number.isInteger(t)||t<0||t>=this.colliderCount)throw Error(`Invalid query collider`);this.colliders[t].body!==e.excludeBody&&(c[t]=1)}this.queryPending=!0;try{let s=new ArrayBuffer(48);new Float32Array(s).set([...r,t?n?e.radius:0:e.radius,...i.map(e=>t?e/a:0),t?e.maximumDistance:1e30]),new Uint32Array(s).set([t?n?2:0:1,o,0,0],8),this.querySettings.write(new Uint8Array(s)),this.querySelection.write(c);let l=this.device.createCommandEncoder(),u=l.beginComputePass();this.queryComputation.kernel.dispatch(u,{bindings:this.queryComputation.bindings,x:Math.ceil(this.colliderStorageCount/64)}),this.queryReduction.kernel.dispatch(u,{bindings:this.queryReduction.bindings,x:1}),u.end(),this.device.submit(l.finish());let d=await this.queryOutput.readAsync(0,16+o*48),f=new Uint32Array(d.buffer,d.byteOffset,d.byteLength/4),p=new Float32Array(d.buffer,d.byteOffset,d.byteLength/4);return{hits:Array.from({length:f[0]},(e,t)=>{let n=4+t*12;return{body:f[n],collider:f[n+1],point:[p[n+4],p[n+5],p[n+6]],distance:p[n+7],normal:[p[n+8],p[n+9],p[n+10]]}}),totalHits:f[1],truncated:!t&&f[1]>f[0],complete:f[2]===0}}finally{this.queryPending=!1}}castSphere(e){return this.runQuery(e)}async readState(){if(!this.positions||!this.orientations||!this.velocities||!this.angularVelocities||!this.sleepStates||this.destroyed)throw Error(`Rigid-body world is not active`);let e=await Promise.all([this.positions,this.orientations,this.velocities,this.angularVelocities,this.sleepStates].map(async e=>new Float32Array((await e.readAsync()).buffer)));return Array.from({length:this.count},(t,n)=>{let r=n*4;return{position:[e[0][r],e[0][r+1],e[0][r+2]],orientation:[e[1][r],e[1][r+1],e[1][r+2],e[1][r+3]],velocity:[e[2][r],e[2][r+1],e[2][r+2]],angularVelocity:[e[3][r],e[3][r+1],e[3][r+2]],sleeping:e[4][r+1]>.5}})}readTriggerEvents(){if(!this.triggerEvents||this.destroyed)throw Error(`Triggers are disabled`);return this.triggerRead||=this.triggerEvents.readAsync().then(e=>{let t=Ia(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.triggerCursor);return this.triggerCursor=t.sequence,t}).finally(()=>{this.triggerRead=null}),this.triggerRead}getSnapshotBuffers(e=!0){return this.ownedBuffers.filter(t=>e||!t.id.startsWith(`${this.id}-checkpoint-`))}createGPUCheckpoint(e={}){if(!this.device||this.destroyed)throw Error(`Checkpoint requires an attached world`);let t=this.device,r=this.getSnapshotBuffers(e.includeRollbackScratch),i=[],a=!1,o=!1,s=[...this.worldOrigin],c=structuredClone(this.props.joints),l=structuredClone(this.props.bodies),u=0,d=0;try{for(let e of r)i.push(t.createBuffer({id:`${e.id}-recovery`,byteLength:e.byteLength,usage:n.COPY_SRC|n.COPY_DST}))}catch(e){for(let e of i)e.destroy();throw e}let f=e=>{if(a||this.destroyed||this.queryPending||this.eventRead||this.triggerRead)throw Error(`Checkpoint requires an idle live world`);let n=t.createCommandEncoder();for(let[t,a]of r.entries())n.copyBufferToBuffer({sourceBuffer:e?i[t]:a,destinationBuffer:e?a:i[t],size:a.byteLength});t.submit(n.finish())},p=structuredClone(this.colliderShapeScales),m=structuredClone(this.props.publicationBounds),h={byteLength:i.reduce((e,t)=>e+t.byteLength,0),save:()=>{f(!1),s=[...this.worldOrigin],c=structuredClone(this.props.joints),l=structuredClone(this.props.bodies),p=structuredClone(this.colliderShapeScales),m=structuredClone(this.props.publicationBounds),u=this.eventCursor,d=this.triggerCursor,o=!0},restore:()=>{if(!o)throw Error(`Checkpoint has not been saved`);f(!0),this.worldOrigin=[...s],this.props.joints=structuredClone(c),this.props.bodies=structuredClone(l),this.restoreColliderDefinitions(),this.colliderShapeScales=structuredClone(p),this.props.publicationBounds=structuredClone(m),this.eventCursor=u,this.triggerCursor=d},destroy:()=>{if(!a){a=!0;for(let e of i)e.destroy();this.gpuCheckpoints.delete(h)}}};return this.gpuCheckpoints.add(h),h}async captureState(e={}){if(!this.device||this.destroyed||this.queryPending||this.eventRead||this.triggerRead)throw Error(`Capture requires an idle attached world`);return{version:1,origin:[...this.worldOrigin],includeRollbackScratch:e.includeRollbackScratch!==!1,props:structuredClone(this.props),colliderShapeScales:structuredClone([...this.colliderShapeScales]),contactCursor:this.eventCursor,triggerCursor:this.triggerCursor,buffers:await Promise.all(this.getSnapshotBuffers(e.includeRollbackScratch).map(async e=>({name:e.id.slice(this.id.length+1),data:new Uint8Array(await e.readAsync())})))}}restoreState(e){let t=this.getSnapshotBuffers(e.includeRollbackScratch);if(!this.device||this.destroyed||this.queryPending||this.eventRead||this.triggerRead||e.version!==1||e.origin!==void 0&&(e.origin.length!==3||!e.origin.every(Number.isFinite))||e.buffers.length!==t.length||Za(e.props)!==Za(this.props)||![e.contactCursor,e.triggerCursor].every(e=>Number.isInteger(e)&&e>=0&&e<=4294967295))throw Error(`Incompatible rigid-body capture`);let n=new Map(e.colliderShapeScales??[]);for(let[e,t]of n)if(this.getColliderShape(e),t.length!==3||t.some(e=>!Number.isFinite(e)||e<=0))throw Error(`Invalid captured collider scale`);for(let[n,r]of t.entries()){let t=e.buffers[n];if(t.name!==r.id.slice(this.id.length+1)||!(t.data instanceof Uint8Array)||t.data.byteLength!==r.byteLength)throw Error(`Incompatible rigid-body capture storage`)}for(let[n,r]of t.entries())r.write(e.buffers[n].data);this.props.joints=structuredClone(e.props.joints),this.props.bodies=structuredClone(e.props.bodies),this.props.publicationBounds=structuredClone(e.props.publicationBounds),this.restoreColliderDefinitions(),this.colliderShapeScales=structuredClone(n),this.worldOrigin=[...e.origin??[0,0,0]],this.eventCursor=e.contactCursor,this.triggerCursor=e.triggerCursor}async getRecoveryProps(e={}){if(this.props.failurePolicy!==`rollback`)throw Error(`Recovery requires rollback`);if(this.props.bodies.some(e=>e.mode===`kinematic`))throw Error(`Kinematic recovery requires explicit target replay`);let t=await this.readState();return{...structuredClone(this.props),...e,bodies:this.props.bodies.map((e,n)=>{let r=t[n],i=ga(r.orientation,e.centerOfMass??[0,0,0]);return{...structuredClone(e),position:r.position.map((e,t)=>e-i[t]),orientation:r.orientation,velocity:r.velocity,angularVelocity:r.angularVelocity}})}}async readContinuousWork(){if(this.props.continuous?.mode!==`convex`)return null;let e=this.ownedBuffers.find(e=>e.id===`${this.id}-continuous-status`);if(!e)return null;let t=await e.readAsync(0,16),n=new Uint32Array(t.buffer,t.byteOffset,4),r=await this.ownedBuffers.find(e=>e.id===`${this.id}-continuous-work`).readAsync(16,16),i=new Uint32Array(r.buffer,r.byteOffset,4);return{peakSpatialTests:i[1],rounds:i[2],candidateCapacity:this.props.continuous.maximumCandidates??this.maximumPairs,peakCandidates:n[3],peakCandidateWorkgroups:Math.ceil(Math.min(n[3],this.props.continuous.maximumCandidates??this.maximumPairs)/64),impacts:n[2],incomplete:n[0]!==0}}async readSolverWork(){if(!this.parallelState||this.destroyed)return null;let e=await this.parallelState.readAsync(0,16),t=new Uint32Array(e.buffer,e.byteOffset,4),n=this.props.compactContacts!==!1;return{compacted:n,activeContacts:n?t[1]:null,awakeBodies:n?t[2]:null,awakeContacts:n?t[3]:null,bodyWorkgroups:Math.ceil((n?t[2]:this.count)/64),pairCapacity:this.maximumPairs,pairWorkgroups:Math.ceil((n?t[3]:this.maximumPairs)/64)}}async readSimulationDiagnostics(){if(!this.simulationStatistics||this.destroyed)throw Error(`Rigid-body world is not active`);return Sa(new Uint32Array((await this.simulationStatistics.readAsync()).buffer))}async readCollisionDiagnostics(){if(!this.manifolds||this.destroyed)throw Error(`Rigid-body world is not active`);let e=this.meshTasks?new Uint32Array((await this.meshTasks.readAsync(0,16)).buffer):new Uint32Array(4),t=this.broadPhaseCounters?ya(new Uint32Array((await this.broadPhaseCounters.buffer.readAsync(this.broadPhaseCounters.byteOffset,32)).buffer)):void 0,n=this.broadPhase===`hierarchical-grid`?new Uint32Array((await this.targets.readAsync(this.count*32+16,4)).buffer)[0]:0;return{unresolvedQueries:e[2],triangleQueries:e[0],droppedTriangleQueries:e[1],incompleteMeshQueries:e[3],droppedManifolds:n,incompleteIslandUnions:this.parallelState?new Uint32Array((await this.parallelState.readAsync(0,4)).buffer)[0]:0,broadPhase:t}}destroy(){if(!this.destroyed){this.ensembleReset?.destroy();for(let e of this.gpuCheckpoints)e.destroy();this.destroyed=!0,this.control?.kernel.destroy(),this.invalidation?.kernel.destroy(),this.queryComputation?.kernel.destroy(),this.queryReduction?.kernel.destroy();for(let e of this.ownedBuffers)e.destroy();this.ownedBuffers.length=0}}};function Za(e){return JSON.stringify({...e,id:void 0,publicationBounds:e.publicationBounds?e.publicationBounds.map(()=>!0):void 0,bodies:e.bodies.map(e=>({...e,shape:void 0,colliders:(e.colliders??[{shape:e.shape}]).map(e=>({...e,shape:e.shape?.type===`convex-hull`||e.shape?.type===`triangle-mesh`?e.shape:{type:e.shape?.type},material:void 0,position:void 0,orientation:void 0})),mode:void 0,mass:void 0,centerOfMass:void 0,inertiaDiagonal:void 0,inertiaOrientation:void 0,velocity:void 0,angularVelocity:void 0,gravityFactor:void 0})),joints:e.joints?.map(e=>({type:e.type,first:e.first,second:e.second,firstFrame:e.firstFrame,secondFrame:e.secondFrame}))},(e,t)=>{if(!t||typeof t!=`object`||Array.isArray(t))return t;let n=t;return Object.fromEntries(Object.keys(n).sort().map(e=>[e,n[e]]))})}function Qa(e,t){switch(t.type){case`impulse`:e.applyImpulse(t.body,t.impulse,t.point);break;case`kinematic-target`:e.setKinematicTarget(t.body,t.position,t.orientation);break;case`angular-impulse`:e.applyAngularImpulse(t.body,t.impulse);break;case`collider-transform`:e.setColliderTransform(t.collider,t.position,t.orientation);break;case`collider-material`:e.setColliderMaterial(t.collider,t.material);break;case`body-parameters`:e.setBodyParameters(t.body,t.parameters);break;case`joint-parameters`:e.setJointParameters(t.joint,t.parameters);break;case`joint-enabled`:e.setJointEnabled(t.joint,t.enabled);break}}function $a(e,t,n,r){if(t.saturated||t.invalidBounds||t.invalidBodyStates||t.unresolvedQueries||t.incompleteIslandUnions||t.incompleteContinuousBodies&&!(e.continuous?.mode===`convex`&&r&&r.peakCandidates>r.candidateCapacity)||t.incompleteTriggerQueries||t.droppedTriangleQueries)return null;let i=structuredClone(e),a=!1;if(t.incompleteContinuousBodies&&i.continuous&&r){let e=r.candidateCapacity;if(e>=1073741824)return null;i.continuous.maximumCandidates=Math.min(1073741824,Math.max(e*2,r.peakCandidates)),a=!0}if(t.droppedPairs||t.droppedManifolds){if(e.broadPhase!==`hierarchical-grid`||n>=1073741824)return null;i.maximumPairs=n*2,a=!0}if(t.incompleteQueries){let t=e.maximumCandidateTestsPerCollider??4096;i.maximumCandidateTestsPerCollider=Math.min(65535,t*2),a||=i.maximumCandidateTestsPerCollider>t}if(t.incompleteMeshQueries){let t=e.maximumMeshTraversalTestsPerPair??65536;i.maximumMeshTraversalTestsPerPair=Math.min(1048576,t*2),a||=i.maximumMeshTraversalTestsPerPair>t}return a?i:null}var eo=class e{execution;props;history=[];busy=!1;destroyed=!1;blocked=!1;constructor(e,t,n,r){this.device=e,this.options=n,this.props=t,this.execution=r}static async create(t,n,r={}){let i={maximumRetries:8,maximumReplayTicks:4096,maximumOwnedBufferBytes:256*1024*1024,...r};if(Object.values(i).some(e=>!Number.isSafeInteger(e)||e<0)||i.maximumReplayTicks===0||i.maximumOwnedBufferBytes===0)throw Error(`Invalid recovery limits`);let a=structuredClone({...n,failurePolicy:`rollback`}),o=await to(t,a,i.maximumOwnedBufferBytes);return a.broadPhase=o.world.broadPhase,new e(t,a,i,o)}get world(){return this.execution.world}get tick(){return this.history.length}get graph(){return this.execution.graph}get encoding(){return this.execution.encoding}async advance(e=[]){if(this.busy||this.destroyed||this.blocked||this.tick>=this.options.maximumReplayTicks)throw Error(`Recovery runner is unavailable`);this.busy=!0;let t=this.execution,n,r=0,i=0,a;try{let o=structuredClone([...e]);if(o.length){if(!t.checkpoint){if(t.world.getCapacityInfo().ownedBufferBytes*2>this.options.maximumOwnedBufferBytes)throw Error(`Recovery checkpoint memory budget exhausted`);t.checkpoint=t.world.createGPUCheckpoint()}n=t.checkpoint,n.save()}let s=await no(this.device,this.execution,o),c=this.props,l=this.world.maximumPairs,u=s.incompleteContinuousBodies?await this.world.readContinuousWork():null;for(;!s.complete&&r<this.options.maximumRetries;){let e=$a(c,s,l,u);if(!e)break;c=e,a=await to(this.device,c,this.options.maximumOwnedBufferBytes),r++;for(let e of[...this.history,o])if(s=await no(this.device,a,e),i++,!s.complete)break;if(l=a.world.maximumPairs,u=s.incompleteContinuousBodies?await a.world.readContinuousWork():null,s.complete){ro(this.execution),this.execution=a,a=void 0,this.props=c;break}ro(a),a=void 0}return s.complete?this.history.push(o):(n&&n.restore(),this.blocked=!0),{accepted:s.complete,tick:this.tick,retries:r,replayedTicks:i,diagnostics:s}}catch(e){throw n&&this.execution===t&&n.restore(),this.blocked=!0,e}finally{a&&ro(a),this.busy=!1}}destroy(){if(this.busy)throw Error(`Recovery runner is busy`);this.destroyed||(this.destroyed=!0,ro(this.execution),this.history=[])}};async function to(e,t,n){let r=new Xa(t);try{if(r.getCapacityInfo().ownedBufferBytes>n)throw Error(`Recovery memory budget exhausted`);let t=new Zt(e);return r.addToGraph(t),{world:r,graph:await t.compileAsync()}}catch(e){throw r.destroy(),e}}async function no(e,t,n){for(let e of n)Qa(t.world,e);let r=e.createCommandEncoder();return t.encoding=t.graph.encode(r,{parameters:void 0}),e.submit(r.finish()),t.world.readSimulationDiagnostics()}function ro(e){e.graph.destroy(),e.world.destroy()}var io={matchedPile:`Box3D comparison · box pile`,matchedMixed:`Box3D comparison · mixed sizes`,matchedStack:`Box3D comparison · tall stacks`,matchedChain:`Box3D comparison · joint chain`,matchedFast:`Box3D comparison · fast rotating bars`,matchedBallistic:`Box3D comparison · ballistic control`};function ao(e){return Object.hasOwn(io,e)}function oo(e,t=32,n=42){if(!Object.hasOwn(io,e)||!Number.isInteger(t)||t<1||t>4096||!Number.isInteger(n)||n<0||n>4294967295||e===`matchedChain`&&t>64)throw Error(`Invalid matched fixture`);let r=n>>>0,i=()=>(r=Math.imul(r,1664525)+1013904223>>>0,r/4294967296),a={version:1,scene:e,seed:n,gravity:[0,0,-9.81],bodies:[],joints:[],continuous:e===`matchedFast`,description:`${{matchedPile:`Identical boxes fall onto a slab; compare settled overlap, energy dissipation and contact cost.`,matchedMixed:`Seeded sizes and uniform density vary both mass and inertia; compare broad-phase work and overlap.`,matchedStack:`Eight-high stacks expose solver drift and sustained contact error.`,matchedChain:`A rigid distance-joint chain swings under gravity; compare length error and energy loss. This scenario requires the ordered GPU solver.`,matchedFast:`Fast rotating bars strike thin walls. Incomplete CCD steps are rolled back and reported; a stopped or energy-losing body is not automatically a successful result.`,matchedBallistic:`Free fall has an exact position/velocity oracle, separating integration error from contact behavior.`}[e]} Shared Box3D/GPU inputs; this diagnostic view is not timed. Use the matched runner for independent quality and performance replays.`},o=(e,t,n=1)=>{let r={position:e,halfExtents:t,mass:n,orientation:[0,0,0,1],velocity:[0,0,0],angularVelocity:[0,0,0],friction:.5,restitution:0};return a.bodies.push(r),r};if(e===`matchedChain`){o([0,0,t*.8+2],[.2,.2,.2],0);for(let e=1;e<=t;e++)o([e*.48,0,t*.8+2-e*.64],[.2,.2,.2]),a.joints.push({first:e-1,second:e,distance:.8})}else if(e===`matchedFast`){a.gravity=[0,0,0];for(let e=0;e<t;e++){let t=e*2;for(let e of[-5,5])o([e,t,0],[.03,.8,1e3],0);let n=o([0,t,0],[.6,.12,.12]);n.velocity=[120,0,0],n.angularVelocity=[0,60,0]}for(let e of a.bodies)e.friction=0,e.restitution=1}else if(e===`matchedBallistic`)for(let e=0;e<t;e++)o([e*2,0,10],[.3,.3,.3]).velocity=[1,0,2];else{let n=Math.ceil(Math.sqrt(e===`matchedStack`?Math.ceil(t/8):t));o([0,0,-.5],[n*1.5+4,n*1.5+4,.5],0);let r=e===`matchedStack`?n:4,a=(r-1)/2;for(let n=0;n<t;n++){let t=e===`matchedStack`?n%8:Math.floor(n/16),s=e===`matchedStack`?Math.floor(n/8):n%16,c=e===`matchedMixed`?.2+i()*.3:.45,l=o([(s%r-a)*1.4,(Math.floor(s/r)-a)*1.4,.5+t*(e===`matchedStack`?.92:1.4)],[c,c,c],8*c**3);if(e!==`matchedStack`){let e=(i()-.5)*.4;l.orientation=[0,0,Math.sin(e/2),Math.cos(e/2)]}}}return a}function so(e,t,n=`ordered`,r=16){return{timeStep:t,solver:n,iterations:r,gravity:e.gravity,sleepAfter:0,restitutionThreshold:0,broadPhase:`hierarchical-grid`,failurePolicy:e.continuous?`rollback`:`report`,compactContacts:!0,bodies:e.bodies.map(e=>({...e,mode:e.mass===0?`static`:`dynamic`,shape:{type:`box`,halfExtents:e.halfExtents}})),joints:e.joints.map(e=>({...e,type:`distance`,collideConnected:!1})),...e.continuous?{continuous:{mode:`convex`,bodies:e.bodies.flatMap((e,t)=>e.mass?[t]:[]),maximumImpacts:16}}:{}}}function co(e,t,n,r,i=0){let a=e=>{let[t,a,o,s]=n,c=2*(a*e[2]-o*e[1]),l=2*(o*e[0]-t*e[2]),u=2*(t*e[1]-a*e[0]),d=e[0]+s*c+a*u-o*l,f=e[1]+s*l+o*c-t*u,p=e[2]+s*u+t*l-a*c;return[(d+i*f)*r,-(p+.7*i*f)*r]};if(t.type===`box`){let n=Array.from({length:8},(e,n)=>a(t.halfExtents.map((e,t)=>n&1<<t?e:-e)));e.globalAlpha=.4,e.strokeStyle=`#8ea3b2`;for(let t of[[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]])e.beginPath(),t.forEach((t,r)=>{r===0?e.moveTo(...n[t]):e.lineTo(...n[t])}),e.closePath(),e.fill(),e.stroke()}else if(t.type===`convex-hull`||t.type===`triangle-mesh`){e.lineWidth=Math.max(1,r*.015),e.strokeStyle=t.type===`triangle-mesh`?`#e7b77c`:`#8ea3b2`,e.globalAlpha=.9;for(let n=0;n<t.geometry.indices.length;n+=3){e.beginPath();for(let r=0;r<3;r++){let i=t.geometry.indices[n+r]*3,o=a(t.geometry.positions.slice(i,i+3));r===0?e.moveTo(o[0],o[1]):e.lineTo(o[0],o[1])}e.closePath(),t.type===`convex-hull`&&e.fill(),e.stroke()}}else if(t.type===`capsule`||t.type===`cylinder`){for(let n=0;n<12;n++){let r=n*Math.PI/6,i=a([Math.cos(r)*t.radiusBottom,-t.height/2,Math.sin(r)*t.radiusBottom]),o=a([Math.cos(r)*t.radiusTop,t.height/2,Math.sin(r)*t.radiusTop]);e.strokeStyle=`#8ea3b2`,e.beginPath(),e.moveTo(...i),e.lineTo(...o),e.stroke()}e.beginPath(),e.arc(0,0,Math.max(t.radiusBottom,t.radiusTop)*r,0,2*Math.PI),e.fill()}}var lo=120,uo=class{maxSamples;getNodeGroup;graphs=new Map;encodingGraphs=new WeakMap;constructor(e={}){let t=e.maxSamples??lo;if(!Number.isSafeInteger(t)||t<=0)throw Error(`GPUCommandGraphInspector maxSamples must be a positive safe integer`);this.maxSamples=t,this.getNodeGroup=e.getNodeGroup}registerGraph(e){this.graphs.set(e.id,{id:e.id,stats:fo(e.stats),capabilities:Object.freeze({...e.capabilities}),...e.preflight?{preflight:po(e.preflight)}:{},encodingCount:0,timingReadFailureCount:0,cpuSamples:[],gpuSamples:[],counters:new Map,nodes:new Map});let t=this.getGraph(e.id);for(let n of e.preflight?.nodes??[])this.getNode(t,n)}observeGraph(e){this.registerGraph(e);let t=this.getGraph(e.id),n=new WeakMap,r=!0,i=()=>r&&this.graphs.get(e.id)===t;return Object.freeze({graph:e,encode:(n,r)=>{let a=e.encode(n,r);return i()&&this.recordGraphEncoding(t,a),a},recordGPUTimings:async r=>{let a=n.get(r);if(a)return await a;if(i()&&this.encodingGraphs.get(r)===t){let i=this.recordGraphGPUTimings(e.id,t,r);return n.set(r,i),await i}},recordCounters:e=>{i()&&this.recordGraphCounters(t,e)},detach:()=>{r&&(r=!1,this.graphs.get(e.id)===t&&this.graphs.delete(e.id))}})}clear(){this.graphs.clear()}recordEncoding(e,t){let n=this.getGraph(e);this.recordGraphEncoding(n,t)}async readResource(e,t,n){let r=this.getGraph(e);if(!r.encoding?.readResource)throw Error(`No live resource readback is available.`);let i=await r.encoding.readResource(t,n);if(this.graphs.get(e)!==r)throw Error(`Graph registration changed during readback.`);return i}recordCounters(e,t){this.recordGraphCounters(this.getGraph(e),t)}recordGraphEncoding(e,t){e.encoding=t,this.encodingGraphs.set(t,e);let{stats:n}=t;e.encodingCount++,this.addSample(e.cpuSamples,n.cpuEncodeTimeMilliseconds);for(let t of n.nodes){let n=this.getNode(e,t);this.addSample(n.cpuSamples,t.cpuEncodeTimeMilliseconds)}}recordGraphCounters(e,t){let n=Object.entries(t);for(let[e,t]of n)if(!e||!Number.isFinite(t)||t<0)throw Error(`GPUCommandGraphInspector counters require an ID and a finite, non-negative value`);for(let[t,r]of n){let n=e.counters.get(t);n||(n=[],e.counters.set(t,n)),this.addSample(n,r)}}async recordGPUTimings(e,t){let n=this.encodingGraphs.get(t)??this.getGraph(e);return await this.recordGraphGPUTimings(e,n,t)}async recordGraphGPUTimings(e,t,n){if(this.graphs.get(e)!==t)return;let r;try{r=await n.readTimings()}catch{this.graphs.get(e)===t&&t.timingReadFailureCount++;return}if(this.graphs.get(e)===t){r.gpuTimeMilliseconds!==void 0&&this.addSample(t.gpuSamples,r.gpuTimeMilliseconds);for(let e of r.nodes)if(e.gpuTimeMilliseconds!==void 0){let n=this.getNode(t,e);this.addSample(n.gpuSamples,e.gpuTimeMilliseconds)}return r}}getSnapshot(){let e=Array.from(this.graphs.values(),e=>this.getGraphSnapshot(e));return Object.freeze({graphs:Object.freeze(e)})}getGraph(e){let t=this.graphs.get(e);if(!t)throw Error(`GPUCommandGraphInspector graph "${e}" is not registered`);return t}getNode(e,t){let n=e.nodes.get(t.id);if(n)return t.description!==void 0&&(n.description=t.description),t.resources!==void 0&&(n.resources=_o(t.resources)),n;let r=_o(t.resources),i=this.getNodeGroup?.({graphId:e.id,id:t.id,type:t.type,description:t.description,resources:r}),a={id:t.id,resources:r,...t.description===void 0?{}:{description:t.description},type:t.type,...i===void 0?{}:{group:i},cpuSamples:[],gpuSamples:[]};return e.nodes.set(a.id,a),a}addSample(e,t){e.push(t),e.length>this.maxSamples&&e.splice(0,e.length-this.maxSamples)}getGraphSnapshot(e){let t=[],n=new Set;for(let r of e.stats.nodeOrder){let i=e.nodes.get(r);i&&(t.push(i),n.add(r))}for(let r of e.nodes.values())n.has(r.id)||t.push(r);let r=t.map(e=>Object.freeze({id:e.id,resources:e.resources,...e.description===void 0?{}:{description:e.description},type:e.type,...e.group===void 0?{}:{group:e.group},cpu:mo(e.cpuSamples),gpu:mo(e.gpuSamples)})),i=Array.from(e.counters,([e,t])=>ho(e,t));return Object.freeze({id:e.id,stats:e.stats,capabilities:e.capabilities,...e.preflight?{preflight:e.preflight}:{},encodingCount:e.encodingCount,timingReadFailureCount:e.timingReadFailureCount,totals:Object.freeze({cpu:mo(e.cpuSamples),gpu:mo(e.gpuSamples)}),counters:Object.freeze(i),nodes:Object.freeze(r)})}};function fo(e){return Object.freeze({...e,nodeOrder:Object.freeze([...e.nodeOrder])})}function po(e){return Object.freeze({...e,nodes:Object.freeze(e.nodes.map(e=>Object.freeze({...e,resources:_o(e.resources)})))})}function mo(e){if(e.length===0)return Object.freeze({sampleCount:0});let t=[...e].sort((e,t)=>e-t);return Object.freeze({sampleCount:e.length,latestMilliseconds:e[e.length-1],p50Milliseconds:go(t,.5),p95Milliseconds:go(t,.95)})}function ho(e,t){let n=[...t].sort((e,t)=>e-t);return Object.freeze({id:e,sampleCount:t.length,latestValue:t[t.length-1],p50Value:go(n,.5),p95Value:go(n,.95)})}function go(e,t){return e[Math.ceil(t*e.length)-1]}function _o(e){return e&&Object.freeze(e.map(e=>Object.freeze({...e})))}var vo=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!H(t.style,n.style)&&(bo(r,t.style),yo(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return yo(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function yo(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(xo(n),String(r))}function bo(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(xo(n))}function H(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length?n.every(n=>e?.[n]===t?.[n]):!1}function xo(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var So=class extends vo{static defaultProps={...vo.defaultProps,panel:void 0,placement:`top-left`}},Co=`data-deck-gl-community-panels-styles`,wo=`.deck-widget {
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
`;function To(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function Eo(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(To))return!0}return!1}function U(e){if(e.querySelector(`style[${Co}]`)||Eo(e))return;let t=e.createElement(`style`);t.setAttribute(Co,`true`),t.textContent=wo,e.head.appendChild(t)}var Do={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Oo=`top-left`,ko=`root`,Ao=class{deck;parentElement;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,deck:t=null,className:n}){this.deck=t,this.parentElement=e,this.className=n,U(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),n&&this.parentElement.classList.add(n)}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!jo(e.components,this.components)){let t=e.components.filter(Mo);this._setComponents(t)}}finalize(){for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e}_addComponent(e){let{viewId:t=null,placement:n=Oo}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:ko,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Do[t]),r.append(i)),i}_updateContainers(){let e=this.deck,t=e?.width??this.parentElement.clientWidth,n=e?.height??this.parentElement.clientHeight;for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===ko||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function jo(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Mo(e){return e instanceof vo}var No,W,Po,Fo,Io,Lo,Ro,zo,Bo,Vo,Ho,Uo,Wo,Go,Ko,qo={},Jo=[],Yo=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Xo=Array.isArray;function Zo(e,t){for(var n in t)e[n]=t[n];return e}function Qo(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function $o(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?No.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return es(e,o,r,i,null)}function es(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Po,__i:-1,__u:0};return i==null&&W.vnode!=null&&W.vnode(a),a}function ts(e){return e.children}function ns(e,t){this.props=e,this.context=t}function rs(e,t){if(t==null)return e.__?rs(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?rs(e):null}function is(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=Zo({},t);a.__v=t.__v+1,W.vnode&&W.vnode(a),hs(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??rs(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,_s(r,a,i),t.__e=t.__=null,a.__e!=n&&as(a)}}function as(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),as(e)}function os(e){(!e.__d&&(e.__d=!0)&&Fo.push(e)&&!ss.__r++||Io!=W.debounceRendering)&&((Io=W.debounceRendering)||Lo)(ss)}function ss(){try{for(var e,t=1;Fo.length;)Fo.length>t&&Fo.sort(Ro),e=Fo.shift(),t=Fo.length,is(e)}finally{Fo.length=ss.__r=0}}function cs(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||Jo,y=t.length;for(c=ls(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||qo,p.__i=d,g=hs(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&bs(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=us(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function ls(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=es(null,o,null,null,null):Xo(o)?o=e.__k[a]=es(ts,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=es(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=ds(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=rs(s)),xs(s,s));return r}function us(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=us(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=rs(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function ds(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>(u?1:0)){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function fs(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||Yo.test(t)?n:n+`px`}function ps(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||fs(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||fs(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(Ho,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[Vo]=r[Vo]:(n[Vo]=Uo,e.addEventListener(t,a?Go:Wo,a)):e.removeEventListener(t,a?Go:Wo,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function ms(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[Bo]==null)t[Bo]=Uo++;else if(t[Bo]<n[Vo])return;return n(W.event?W.event(t):t)}}}function hs(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=W.__b)&&u(t);n:if(typeof T==`function`)try{if(_=t.props,v=T.prototype&&T.prototype.render,y=(u=T.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new T(_,b):(t.__c=d=new ns(_,b),d.constructor=T,d.render=Ss),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&T.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=Zo({},d.__s)),Zo(d.__s,T.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&T.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&T.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),Jo.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=W.__r,S=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),Jo.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++S<25);d.state=d.__s,d.getChildContext!=null&&(r=Zo(Zo({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),C=u!=null&&u.type===ts&&u.key==null?vs(u.props.children):u,s=cs(e,Xo(C)?C:[C],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(w=a.length;w--;)Qo(a[w]);gs(t)}else t.__e=n.__e,t.__k=n.__k,e.then||gs(t);W.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=ys(n.__e,t,n,r,i,a,o,c,l);return(u=W.diffed)&&u(t),128&t.__u?void 0:s}function gs(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(gs))}function _s(e,t,n){for(var r=0;r<n.length;r++)bs(n[r],n[++r],n[++r]);W.__c&&W.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){W.__e(e,t.__v)}})}function vs(e){return typeof e!=`object`||!e||e.__b>0?e:Xo(e)?e.map(vs):e.constructor===void 0?Zo({},e):null}function ys(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||qo,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(W.__m&&W.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&No.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||ps(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||ps(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),cs(t.type==`template`?e.content:e,Xo(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&rs(n,0),s,c),a!=null)for(l=a.length;l--;)Qo(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&ps(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&ps(e,l,h,g[l],i))}return e}function bs(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){W.__e(e,n)}}function xs(e,t,n){var r,i;if(W.unmount&&W.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||bs(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){W.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&xs(r[i],t,n||typeof e.type!=`function`);n||Qo(e.__e),e.__c=e.__=e.__e=void 0}function Ss(e,t,n){return this.constructor(e,n)}function Cs(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),W.__&&W.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],hs(t,e=(!r&&n||t).__k=$o(ts,null,[e]),i||qo,qo,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?No.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),_s(a,e,o)}function ws(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,os(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+ Ko++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}No=Jo.slice,W={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},Po=0,ns.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=Zo({},this.state);typeof e==`function`&&(e=e(Zo({},n),this.props)),e&&Zo(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),os(this))},ns.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),os(this))},ns.prototype.render=ts,Fo=[],Lo=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ro=function(e,t){return e.__v.__b-t.__v.__b},ss.__r=0,zo=Math.random().toString(8),Bo=`__d`+zo,Vo=`__a`+zo,Ho=/(PointerCapture)$|Capture$/i,Uo=0,Wo=ms(!1),Go=ms(!0),Ko=0;var Ts=0;Array.isArray;function Es(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Ts,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return W.vnode&&W.vnode(l),l}var Ds,G,Os,ks,As=0,js=[],K=W,Ms=K.__b,Ns=K.__r,Ps=K.diffed,Fs=K.__c,Is=K.unmount,Ls=K.__;function Rs(e,t){K.__h&&K.__h(G,e,As||t),As=0;var n=G.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function zs(e){return As=1,Bs($s,e)}function Bs(e,t,n){var r=Rs(Ds++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):$s(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=G,!G.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};G.__f=!0;var a=G.shouldComponentUpdate,o=G.componentWillUpdate;G.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},G.shouldComponentUpdate=i}return r.__N||r.__}function Vs(e,t){var n=Rs(Ds++,3);!K.__s&&Qs(n.__H,t)&&(n.__=e,n.u=t,G.__H.__h.push(n))}function Hs(e,t){var n=Rs(Ds++,4);!K.__s&&Qs(n.__H,t)&&(n.__=e,n.u=t,G.__h.push(n))}function Us(e){return As=5,Ws(function(){return{current:e}},[])}function Ws(e,t){var n=Rs(Ds++,7);return Qs(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function Gs(e,t){return As=8,Ws(function(){return e},t)}function Ks(e){var t=G.context[e.__c],n=Rs(Ds++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(G)),t.props.value):e.__}function qs(){for(var e;e=js.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(Xs),t.__h.some(Zs),t.__h=[]}catch(n){t.__h=[],K.__e(n,e.__v)}}}K.__b=function(e){G=null,Ms&&Ms(e)},K.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Ls&&Ls(e,t)},K.__r=function(e){Ns&&Ns(e),Ds=0;var t=(G=e.__c).__H;t&&(Os===G?(t.__h=[],G.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(Xs),t.__h.some(Zs),t.__h=[],Ds=0)),Os=G},K.diffed=function(e){Ps&&Ps(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(js.push(t)!==1&&ks===K.requestAnimationFrame||((ks=K.requestAnimationFrame)||Ys)(qs)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),Os=G=null},K.__c=function(e,t){t.some(function(e){try{e.__h.some(Xs),e.__h=e.__h.filter(function(e){return!e.__||Zs(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],K.__e(n,e.__v)}}),Fs&&Fs(e,t)},K.unmount=function(e){Is&&Is(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{Xs(e)}catch(e){t=e}}),n.__H=void 0,t&&K.__e(t,n.__v))};var Js=typeof requestAnimationFrame==`function`;function Ys(e){var t,n=function(){clearTimeout(r),Js&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);Js&&(t=requestAnimationFrame(n))}function Xs(e){var t=G,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),G=t}function Zs(e){var t=G;e.__c=e.__(),G=t}function Qs(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function $s(e,t){return typeof t==`function`?t(e):t}var ec={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},tc={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},nc=ws(void 0);function rc({panel:e,children:t}){let n=Ks(nc),r=Us(null),[i,a]=zs(`light`),o=ic(n??i,e.theme);return Hs(()=>{if(!n){let e=r.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=sc(t);a(t=>t===e?t:e)};n();let i=new MutationObserver(()=>{n()});for(let e of ac(t))i.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{i.disconnect()}}},[n]),Es(nc.Provider,{value:o,children:Es(`div`,{ref:r,"data-panel-theme-mode":o,style:oc(o),children:t})})}function ic(e,t){return t===`dark`?`dark`:t===`light`?`light`:t===`invert`?e===`dark`?`light`:`dark`:e}function ac(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function oc(e){return{...e===`dark`?tc:ec}}function sc(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=cc(t.getComputedStyle(e).getPropertyValue(`--menu-background`).trim());return n&&lc(n)<.5?`dark`:`light`}function cc(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function lc([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}function uc(e,t){let[n,r]=zs(t),i=e!==void 0,a=i?e:n;return Vs(()=>{i&&r(e)},[i,e]),[a,Gs(e=>{i||r(e)},[i])]}var dc=class extends vo{static defaultProps={...vo.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){Cs($o(rc,{panel:this},this.content),e)}onRemove(){this.rootElement&&Cs(null,this.rootElement)}},fc=class extends dc{constructor({panels:e,id:t=`tabbed-panels`,title:n=`Panels`,tabListLayout:r=`wrap`,theme:i=`inherit`}){super({id:t,title:n,theme:i,content:Es(pc,{panels:e,tabListLayout:r})})}};function pc({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=uc(r,n),c=Ws(()=>e.filter(e=>!e.disabled),[e]),l=Ws(()=>o&&c.some(e=>e.id===o)?o:c[0]?.id,[o,c]);return Vs(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),Es(`div`,{className:t,style:mc,children:[Es(`div`,{"data-panel-tabs":``,style:q(a),children:e.map(e=>{let t=e.id===l;return Es(`button`,{type:`button`,style:{...hc,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border, rgba(148, 163, 184, 0.35))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onPointerDown:t=>{if(e.disabled){t.stopPropagation();return}t.preventDefault(),s(e.id),i?.(e.id)},children:e.title},e.id)})}),Es(`div`,{style:gc,children:e.map(e=>{let t=e.id===l;return Es(`div`,{"aria-hidden":!t,style:{..._c,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:Es(rc,{panel:e,children:e.content})},e.id)})})]})}var mc={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--button-corner-radius, 8px)`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,color:`var(--menu-text, rgb(24, 24, 26))`};function q(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`4px`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`4px 6px`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var hc={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`4px`,margin:0,padding:`4px 8px`,fontSize:`12px`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},gc={display:`grid`,alignItems:`start`,padding:`10px`,overflow:`auto`},_c={gridArea:`1 / 1`,minWidth:0};function vc({className:e,onRenderHTML:t}){let n=Us(null);return Hs(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),Es(`div`,{ref:n,className:e})}var yc=class extends dc{constructor({id:e,title:t,onRenderHTML:n,disabled:r,keepMounted:i,className:a,theme:o=`inherit`}){super({id:e,title:t,theme:o,disabled:r,keepMounted:i,content:Es(vc,{className:a,onRenderHTML:n})})}},bc=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],xc={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function Sc(e,t){let n=xc[t];for(let[t,r]of bc)e.style.setProperty(r,n[t])}function Cc(e){for(let[,t]of bc)e.style.removeProperty(t)}var wc=`data-example-panel-host`,Tc=`data-example-settings-panel`,Ec=`data-example-settings-sections`,Dc=`example-source`,Oc=`/examples/`,kc=`data-example-panel-appearance`,Ac=`
[data-example-panel-host] [aria-hidden='true'] {
  display: none !important;
}
[data-example-panel-host][${kc}='cinematic'] [data-panel-theme-mode] {
  --button-background: var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72)) !important;
  --button-icon-hover: rgb(240, 249, 255) !important;
  --button-icon-idle: var(--luma-example-text-muted, rgb(148, 163, 184)) !important;
  --button-stroke: var(--luma-example-border, rgba(148, 163, 184, 0.24)) !important;
  --button-text: var(--luma-example-text, rgb(226, 232, 240)) !important;
  --menu-background: transparent !important;
  --menu-border-color: rgba(148, 163, 184, 0.2) !important;
  --menu-divider: rgba(148, 163, 184, 0.18) !important;
  --menu-item-hover: rgba(125, 211, 252, 0.12) !important;
  --menu-text: var(--luma-example-text, rgb(226, 232, 240)) !important;
  --menu-weak-background: rgba(15, 23, 42, 0.48) !important;
  --range-decoration-active-color: var(--luma-example-accent, rgb(56, 189, 248)) !important;
  --range-thumb-color: rgb(125, 211, 252) !important;
  --range-track-color: rgba(71, 85, 105, 0.8) !important;
  color: var(--luma-example-text, rgb(226, 232, 240));
  color-scheme: dark;
}
[${Tc}] [data-setting-row-for] > label,
[${Tc}] [data-setting-row-for] button,
[${Tc}] [data-setting-row-for] input[type='number'],
[${Tc}] [data-setting-row-for] input[type='text'],
[id^='settings-panel-input-'][role='listbox'] > button[role='option'] {
  font-size: 11px !important;
}
[${Tc}][${Ec}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) {
  margin-top: 4px !important;
  padding: 8px !important;
  border-radius: 7px !important;
  background: rgba(70, 104, 159, 0.08) !important;
}
[${Tc}][${Ec}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) > span:first-child > span:first-child {
  font-size: 11px !important;
  letter-spacing: 0.01em;
}
`;function jc(e,t){Cs(t?$o(rc,{panel:t},$o(`style`,{},Ac),t.content):null,e)}function Mc({id:e,title:t,html:n,onRender:r}){return new yc({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function Nc({id:e,title:t,content:n}){return new yc({id:e,title:t,onRenderHTML:e=>(Cs($o(ts,{},n),e),()=>Cs(null,e))})}function Pc(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===Dc),i=Lc()&&!r?[...e.panels,Fc(t)]:e.panels;return new fc({...n,panels:i})}function Fc(e){return Nc({id:Dc,title:`Source`,content:$o(Ic,{sourcePaths:e})})}function Ic({sourcePaths:e}){let[t,n]=zs({});return Vs(()=>{let t=e??Rc();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return zc(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?$o(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):$o(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},$o(`code`,{},t.source??`// Loading source…`))}function Lc(){return typeof window<`u`&&!!window.website}function Rc(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(Oc);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function zc(e,t){let n=window.location.pathname.indexOf(Oc),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}function Bc(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute(wc,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(kc,r),r===`cinematic`||r===`light`?Sc(e,r):Cc(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?xc[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}function Vc(e){let t=/^(r|rg|rgba|bgra)(8unorm|8snorm|16float|32float)(-srgb)?$/.exec(e.format??``);if(!t||!e.width||!e.height)return;let n=t[1]===`r`?1:t[1]===`rg`?2:4,r=t[2],i=r===`16float`?2:r===`32float`?4:1,a=e.width*e.height;if(e.data.byteLength!==a*n*i)return;let o=new DataView(e.data.buffer,e.data.byteOffset,e.data.byteLength),s=new Uint8ClampedArray(a*4),c=e=>{let t=e*i;if(r===`8unorm`)return o.getUint8(t)/255;if(r===`8snorm`)return Math.max(-1,o.getInt8(t)/127);if(r===`32float`)return o.getFloat32(t,!0);let n=o.getUint16(t,!0),a=n&32768?-1:1,s=n>>10&31,c=n&1023;return a*(s===31?c?NaN:1/0:s===0?c*2**-24:(1+c/1024)*2**(s-15))};for(let e=0;e<a;e++)for(let r=0;r<4;r++){let i=t[1]===`bgra`&&r<3?2-r:r,a=r===3?1:0;i<n?a=c(e*n+i):n===1&&r<3&&(a=c(e)),a=Number.isNaN(a)?0:Math.max(0,Math.min(1,a)),r<3&&!t[3]&&(a=a<=.0031308?12.92*a:1.055*a**(1/2.4)-.055),s[e*4+r]=Math.round(a*255)}return s}function Hc(e,t){let n=Vc(t);if(!n)return;let r=e.createElement(`canvas`);return r.width=t.width,r.height=t.height,r.setAttribute(`role`,`img`),r.setAttribute(`aria-label`,`Current texture allocation, top-left ${r.width} by ${r.height} pixels; display range 0 to 1`),r.title=`Current allocation · top-left crop · display range 0–1`,r.getContext(`2d`)?.putImageData(new ImageData(n,r.width,r.height),0,0),r.style.cssText=`width:${128*r.width/Math.max(r.width,r.height)}px;max-width:100%;height:auto;image-rendering:pixelated;background:repeating-conic-gradient(#888 0% 25%,#bbb 0% 50%) 0/12px 12px`,r}var Uc=1,J=class{element;document;trigger;valueElement;listbox;ariaLabel;onChange;options;selectedValue=null;activeIndex=-1;disabled;openState=!1;destroyed=!1;typeaheadText=``;typeaheadTimer=null;constructor(e,t){this.document=e.ownerDocument,this.options=[...t.options],this.ariaLabel=t.ariaLabel??`Select option`,this.onChange=t.onChange,this.disabled=t.disabled??!1;let n=Uc++,r=`compact-dropdown-trigger-${n}`,i=`compact-dropdown-listbox-${n}`;this.element=this.document.createElement(`div`),this.element.dataset.compactDropdown=``,this.element.innerHTML=`<style>${Wc}</style>`,this.trigger=this.document.createElement(`button`),this.trigger.id=r,this.trigger.type=`button`,this.trigger.setAttribute(`role`,`combobox`),this.trigger.setAttribute(`aria-label`,this.ariaLabel),this.trigger.setAttribute(`aria-haspopup`,`listbox`),this.trigger.setAttribute(`aria-controls`,i),this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.dataset.compactDropdownTrigger=``,this.valueElement=this.document.createElement(`span`),this.valueElement.dataset.compactDropdownValue=``;let a=this.document.createElement(`span`);a.dataset.compactDropdownChevron=``,a.setAttribute(`aria-hidden`,`true`),this.trigger.append(this.valueElement,a),this.element.append(this.trigger),this.listbox=this.document.createElement(`div`),this.listbox.id=i,this.listbox.hidden=!0,this.listbox.setAttribute(`role`,`listbox`),this.listbox.setAttribute(`aria-label`,this.ariaLabel),this.listbox.dataset.compactDropdownPopup=``,e.append(this.element),this.document.body.append(this.listbox),this.trigger.addEventListener(`click`,this.handleTriggerClick),this.trigger.addEventListener(`keydown`,this.handleKeyDown),this.listbox.addEventListener(`click`,this.handleOptionClick),this.listbox.addEventListener(`pointermove`,this.handleOptionPointerMove),this.document.addEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.addEventListener(`focusin`,this.handleDocumentFocusIn),this.renderOptions();let o=t.value??this.getFirstEnabledOption()?.value;o!==void 0&&this.setValue(o),this.updateDisabledState()}get value(){return this.selectedValue}set value(e){e===null?(this.selectedValue=null,this.activeIndex=-1,this.updateSelection()):this.setValue(e)}setValue(e,t={}){let n=this.options.find(t=>t.value===e);if(!n)return!1;let r=this.selectedValue!==e;return this.selectedValue=e,this.activeIndex=this.options.indexOf(n),this.updateSelection(),r&&t.emitChange&&this.onChange?.(e,n),!0}setOptions(e){this.options=[...e],this.selectedValue=this.options.find(e=>e.value===this.selectedValue)?.value??this.getFirstEnabledOption()?.value??null,this.activeIndex=this.getSelectedIndex(),this.renderOptions(),this.updateSelection(),this.updateDisabledState(),this.openState&&this.updatePopupPosition()}setDisabled(e){this.disabled=e,this.updateDisabledState(),this.trigger.disabled&&this.close()}focus(){this.trigger.focus()}open(){this.openState||this.trigger.disabled||this.destroyed||(this.openState=!0,this.activeIndex=this.getSelectedIndex(),this.activeIndex<0&&(this.activeIndex=this.getNextEnabledIndex(-1,1)),this.listbox.hidden=!1,this.trigger.setAttribute(`aria-expanded`,`true`),this.element.dataset.open=`true`,this.updateActiveOption(!0),this.updatePopupPosition(),this.document.defaultView?.addEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.addEventListener(`scroll`,this.handleViewportChange,!0))}close(e={}){this.openState&&(this.openState=!1,this.listbox.hidden=!0,this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.removeAttribute(`aria-activedescendant`),delete this.element.dataset.open,this.document.defaultView?.removeEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.removeEventListener(`scroll`,this.handleViewportChange,!0),e.restoreFocus&&this.trigger.focus())}destroy(){this.destroyed||(this.close(),this.destroyed=!0,this.trigger.removeEventListener(`click`,this.handleTriggerClick),this.trigger.removeEventListener(`keydown`,this.handleKeyDown),this.listbox.removeEventListener(`click`,this.handleOptionClick),this.listbox.removeEventListener(`pointermove`,this.handleOptionPointerMove),this.document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.removeEventListener(`focusin`,this.handleDocumentFocusIn),this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.listbox.remove(),this.element.remove())}handleTriggerClick=()=>{this.openState?this.close():this.open()};handleKeyDown=e=>{switch(e.key){case`ArrowDown`:e.preventDefault(),this.openState?this.moveActiveOption(1):this.open();break;case`ArrowUp`:e.preventDefault(),this.openState?this.moveActiveOption(-1):this.open();break;case`Home`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(-1,1));break;case`End`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(this.options.length,-1));break;case`Enter`:case` `:e.preventDefault(),this.openState?this.selectActiveOption():this.open();break;case`Escape`:this.openState&&(e.preventDefault(),this.close({restoreFocus:!0}));break;case`Tab`:this.close();break;default:e.key.length===1&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.preventDefault(),this.openState||this.open(),this.moveActiveOptionByText(e.key));break}};handleOptionClick=e=>{let t=this.getOptionIndex(e.target);t<0||this.options[t]?.disabled||(this.activeIndex=t,this.selectActiveOption())};handleOptionPointerMove=e=>{let t=this.getOptionIndex(e.target);t>=0&&!this.options[t]?.disabled&&t!==this.activeIndex&&this.setActiveIndex(t)};handleDocumentPointerDown=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleDocumentFocusIn=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleViewportChange=()=>{this.openState&&this.updatePopupPosition()};renderOptions(){this.listbox.replaceChildren(...this.options.map((e,t)=>{let n=this.document.createElement(`div`);n.id=`${this.listbox.id}-option-${t}`,n.setAttribute(`role`,`option`),n.setAttribute(`aria-selected`,String(e.value===this.selectedValue)),e.disabled&&n.setAttribute(`aria-disabled`,`true`),n.dataset.compactDropdownOption=``,n.dataset.optionIndex=String(t);let r=this.document.createElement(`span`);r.textContent=e.label;let i=this.document.createElement(`span`);return i.dataset.compactDropdownStatus=``,i.setAttribute(`aria-hidden`,`true`),n.append(r,i),n}))}updateSelection(){let e=this.options.find(e=>e.value===this.selectedValue);this.valueElement.textContent=e?.label??`—`,this.trigger.title=e?.label??this.ariaLabel;for(let[e,t]of this.getOptionElements().entries())t.setAttribute(`aria-selected`,String(this.options[e]?.value===this.selectedValue));this.updateActiveOption(!1)}updateDisabledState(){this.trigger.disabled=this.disabled||!this.options.some(e=>!e.disabled)}moveActiveOption(e){this.setActiveIndex(this.getNextEnabledIndex(this.activeIndex,e))}moveActiveOptionByText(e){this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.typeaheadText+=e.toLocaleLowerCase();let t=this.getMatchingOptionIndex(this.typeaheadText);t<0&&this.typeaheadText.length>1&&(this.typeaheadText=e.toLocaleLowerCase(),t=this.getMatchingOptionIndex(this.typeaheadText)),t>=0&&this.setActiveIndex(t),this.typeaheadTimer=setTimeout(()=>{this.typeaheadText=``,this.typeaheadTimer=null},650)}getMatchingOptionIndex(e){for(let t=1;t<=this.options.length;t++){let n=(this.activeIndex+t+this.options.length)%this.options.length,r=this.options[n];if(!r?.disabled&&r.label.toLocaleLowerCase().startsWith(e))return n}return-1}getNextEnabledIndex(e,t){if(!this.options.length)return-1;let n=e;for(let e=0;e<this.options.length;e++)if(n=(n+t+this.options.length)%this.options.length,!this.options[n]?.disabled)return n;return-1}setActiveIndex(e){e<0||this.options[e]?.disabled||(this.activeIndex=e,this.updateActiveOption(!0))}updateActiveOption(e){let t=this.getOptionElements();for(let[e,n]of t.entries())e===this.activeIndex&&this.openState?n.dataset.active=`true`:delete n.dataset.active;let n=t[this.activeIndex];this.openState&&n&&(this.trigger.setAttribute(`aria-activedescendant`,n.id),e&&n.scrollIntoView({block:`nearest`}))}selectActiveOption(){let e=this.options[this.activeIndex];!e||e.disabled||(this.setValue(e.value,{emitChange:!0}),this.close({restoreFocus:!0}))}getFirstEnabledOption(){return this.options.find(e=>!e.disabled)}getSelectedIndex(){return this.options.findIndex(e=>e.value===this.selectedValue)}getOptionIndex(e){let t=e?.closest(`[data-compact-dropdown-option]`);return!t||!this.listbox.contains(t)?-1:Number(t.dataset.optionIndex??-1)}getOptionElements(){return Array.from(this.listbox.querySelectorAll(`[role="option"]`))}updatePopupPosition(){let e=this.document.defaultView;if(!e)return;let t=this.trigger.getBoundingClientRect(),n=Math.min(Math.max(t.width,128),e.innerWidth-8),r=Math.max(4,Math.min(t.left,e.innerWidth-n-4)),i=e.innerHeight-t.bottom-3-4,a=t.top-3-4,o=Math.min(176,this.options.length*20+2),s=i<Math.min(o,80)&&a>i,c=s?a:i;Object.assign(this.listbox.style,{left:`${r}px`,top:s?`auto`:`${t.bottom+3}px`,bottom:s?`${e.innerHeight-t.top+3}px`:`auto`,width:`${n}px`,maxHeight:`${Math.max(40,Math.min(176,c))}px`})}},Wc=`
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
`,Gc=0;function Kc(e){let t=e.createElement(`div`);t.id=`gpu-operation-tooltip-${Gc++}`,t.setAttribute(`role`,`tooltip`),t.setAttribute(`data-gpu-operation-tooltip`,``),t.hidden=!0,Object.assign(t.style,{position:`fixed`,zIndex:`2147483647`,pointerEvents:`none`,boxSizing:`border-box`,width:`560px`,maxWidth:`calc(100vw - 24px)`,maxHeight:`min(440px, calc(100vh - 24px))`,overflow:`hidden`,padding:`18px`,border:`1px solid rgb(125 170 212 / 32%)`,borderRadius:`12px`,background:`linear-gradient(145deg, #111e30, #080f1b 70%)`,color:`#e4effc`,boxShadow:`0 8px 28px rgb(0 0 0 / 45%)`,font:`14px/1.5 system-ui, sans-serif`,whiteSpace:`normal`,overflowWrap:`anywhere`});let n=e.createElement(`style`);return n.textContent=Zc,t.append(n),e.body.append(t),t}function qc(e,t){let n=t.getBoundingClientRect(),r=t.ownerDocument.documentElement,i=e.getBoundingClientRect();e.style.left=`${Math.max(12,Math.min(n.left,r.clientWidth-i.width-12))}px`;let a=n.bottom+i.height+12<r.clientHeight?n.bottom+6:n.top-i.height-6;e.style.top=`${Math.max(12,Math.min(a,r.clientHeight-i.height-12))}px`}function Jc(e,t=e.id){let n=[t];if(e.description&&n.push(e.description),e.resources?.length){n.push(``,`Declared inputs / outputs`);for(let t of e.resources){let e=t.usage===`storage-read-write`||t.usage===`render-attachment`?`Input/output`:[`storage-write`,`copy-destination`].includes(t.usage)?`Output`:`Input`,r=t.width===void 0?t.length===void 0?void 0:`${t.length.toLocaleString()} rows`:`${t.width} × ${t.height}${t.depth&&t.depth>1?` × ${t.depth}`:``}`,i=t.byteLength===void 0?void 0:`${t.byteLength.toLocaleString()} B${t.byteOffset?` @ ${t.byteOffset.toLocaleString()}`:``}`;n.push(`${e}: ${t.id}`,`  ${[t.usage,t.format??t.kind,r,i].filter(Boolean).join(` · `)}`)}}return n.join(`
`)}function Yc(e,t,n={}){let r=e.ownerDocument,i=r.createElement(`div`);i.className=`gpu-operation-content`;let a=(e,t,n,i)=>{let a=r.createElement(t);return a.className=n,a.textContent=i,e.append(a),a},o=a(i,`div`,`gpu-operation-header`,``),s=t.id.split(`-`).filter(Boolean).at(-1)??t.id,c=n.name??t.operation??s.replace(/([a-z])([A-Z])/g,`$1 $2`);if(a(o,`strong`,`gpu-operation-name`,c.charAt(0).toUpperCase()+c.slice(1)),t.type&&a(o,`span`,`gpu-operation-kind`,t.type===`render`?`draw`:t.type),a(i,`code`,`gpu-operation-id`,t.id),t.description&&a(i,`p`,`gpu-operation-description`,t.description),t.resources?.length){let e=a(i,`section`,`gpu-operation-resources`,``);a(e,`div`,`gpu-operation-section-label`,`Declared inputs / outputs`);let n=r.createElement(`table`);n.className=`gpu-operation-table`;let o=r.createElement(`caption`);o.textContent=`Declared resource inputs and outputs`,o.hidden=!0,n.append(o);let s=n.createTHead().insertRow();for(let e of[`Access`,`Resource`,`Format / shape`,`Size`]){let t=r.createElement(`th`);t.scope=`col`,t.textContent=e,s.append(t)}let c=n.createTBody(),l=t.id.slice(0,t.id.lastIndexOf(`-`)+1),u=t.resources.slice(0,6);for(let e of u){let t=c.insertRow(),n=e.usage===`storage-read-write`||e.usage===`render-attachment`?`In / out`:[`storage-write`,`copy-destination`].includes(e.usage)?`Output`:`Input`,r=a(t.insertCell(),`span`,`gpu-operation-access`,n);r.dataset.access=n;let i=a(t.insertCell(),`code`,`gpu-operation-resource-id`,l&&e.id.startsWith(l)?e.id.slice(l.length):e.id);i.title=`${e.id} · ${e.usage}`;let o=t.insertCell(),s=e.width===void 0?e.length===void 0?``:`${e.length.toLocaleString()} rows`:`${e.width} × ${e.height}${e.depth&&e.depth>1?` × ${e.depth}`:``}`,u=a(o,`code`,`gpu-operation-format`,[e.format??e.kind,s].filter(Boolean).join(` · `));u.title=u.textContent??``;let d=t.insertCell();d.className=`gpu-operation-size`,d.textContent=e.byteLength===void 0?`—`:e.byteLength>=1024?`${(e.byteLength/1024).toFixed(1)} KiB`:`${e.byteLength} B`,e.byteLength!==void 0&&(d.title=`${e.byteLength.toLocaleString()} bytes`),e.byteOffset&&(d.title+=` · offset ${e.byteOffset.toLocaleString()} bytes`)}e.append(n),Xc(a(e,`div`,`gpu-operation-resource-overflow`,``),t.resources.length,u.length)}n.timing&&a(i,`div`,`gpu-operation-timing`,n.timing),e.querySelector(`.gpu-operation-content`)?.remove(),e.append(i);let l=e.hidden;e.hidden=!1;let u=i.querySelector(`tbody`),d=i.querySelector(`.gpu-operation-resource-overflow`);for(;u?.rows.length&&e.scrollHeight>e.clientHeight;)u.deleteRow(-1),Xc(d,t.resources.length,u.rows.length),u.rows.length===0&&(u.closest(`table`).hidden=!0);e.hidden=l}function Xc(e,t,n){let r=t-n;e.hidden=r===0,e.textContent=r?`+ ${r} more ${r===1?`resource`:`resources`}`:``}var Zc=`
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
`,Qc=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:1}),$c=new Intl.NumberFormat(`en-US`,{notation:`compact`,maximumFractionDigits:1}),el=class{element;graphLabels;nodeLabels;counterLabels;snapshot={graphs:[]};selectedGraphId=null;selectionIsManual=!1;graphOptionsSignature=``;memoryMarkup=``;nodeRows=new Map;counterRows=new Map;graphDropdown;tooltip;tooltipEvents=new AbortController;inspector;resourceRows=new Map;resources=new Map;activeResourceKey;previewGeneration=0;renderedGraphId;selectedResourceKey;viewerGeneration=0;pendingPreviews=new Map;thumbnailGeneration=0;activeNodeId;constructor(e,t={}){this.element=e,this.inspector=t.inspector,this.tooltip=Kc(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-graph-tooltip`,``);let n=e=>{let t=e.target.closest(`[data-resource-key]`);if(t&&this.element.contains(t)){this.showResourceTooltip(t);return}let n=e.target.closest(`[data-full-name]`);n&&this.element.contains(n)&&this.showTooltip(n)},r=e=>{let t=e.target.closest(`[data-full-name], [data-resource-key]`),n=e.relatedTarget;(!(n instanceof Node)||!t?.contains(n))&&this.hideTooltip()},i={signal:this.tooltipEvents.signal};e.addEventListener(`mouseover`,n,i),e.addEventListener(`focusin`,n,i),e.addEventListener(`mouseout`,r,i),e.addEventListener(`focusout`,r,i),e.addEventListener(`scroll`,()=>this.hideTooltip(),{...i,capture:!0}),e.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip();let t=e.target.closest(`[data-resource-key]`);t&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.selectResource(t.dataset.resourceKey))},i),e.ownerDocument.defaultView?.addEventListener(`resize`,()=>this.hideTooltip(),i),this.graphLabels=t.graphLabels??{},this.nodeLabels=t.nodeLabels??{},this.counterLabels=t.counterLabels??{},this.element.innerHTML=`<div data-gpu-command-graph-inspector>
      <style>${al}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div role="tablist" aria-label="Graph inspector views">
          <button type="button" role="tab" aria-selected="true" data-inspector-tab="timings">Graph</button>
          <button type="button" role="tab" aria-selected="false" data-inspector-tab="resources">Graph Resources</button>
        </div>
        <div data-inspector-view="timings">
        <div class="graph-inspector-summary">
          ${ol(`encodings`,``,`encoding-count`)}
          ${ol(`CPU p50 / p95 (ms)`,``,`cpu-totals`)}
          ${ol(`GPU p50 / p95 (ms)`,``,`gpu-totals`)}
          ${ol(`GPU samples`,``,`gpu-samples`)}
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
    </div>`,e.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-inspector-tab]`);if(r){this.hideTooltip();for(let t of e.querySelectorAll(`[data-inspector-tab]`))t.setAttribute(`aria-selected`,String(t===r));for(let t of e.querySelectorAll(`[data-inspector-view]`))t.hidden=t.dataset.inspectorView!==r.dataset.inspectorTab}n.closest(`[data-texture-previews]`)&&this.refreshTextureThumbnails();let i=n.closest(`[data-resource-key]`);i&&this.selectResource(i.dataset.resourceKey),n.closest(`[data-resource-refresh]`)&&this.selectedResourceKey&&this.selectResource(this.selectedResourceKey)},i),this.graphDropdown=new J(this.element.querySelector(`[data-graph-inspector-picker-host]`),{ariaLabel:`Graph`,options:[],onChange:e=>{this.hideTooltip(),this.selectedGraphId=e,this.selectionIsManual=!0,this.render()}})}update(e,t){if(this.snapshot=e,e.graphs.some(e=>e.id===this.selectedGraphId)||(this.selectedGraphId=null,this.selectionIsManual=!1),!this.selectionIsManual&&t){let n=e.graphs.find(e=>e.id===t);n&&(this.selectedGraphId=n.id)}this.selectedGraphId??=e.graphs[0]?.id??null,this.render()}destroy(){this.hideTooltip(),this.viewerGeneration++,this.thumbnailGeneration++,this.tooltipEvents.abort(),this.tooltip.remove(),this.graphDropdown.destroy(),this.element.replaceChildren(),this.nodeRows.clear(),this.counterRows.clear(),this.resourceRows.clear(),this.resources.clear()}showTooltip(e){this.activeResourceKey&&this.hideTooltip(),this.activeNodeId=e.getAttribute(`data-full-name`)??void 0;let t=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId)?.nodes.find(e=>e.id===this.activeNodeId);if(!t)return;let n=fl(this.nodeLabels,t.id);Yc(this.tooltip,t,{name:n===t.id?void 0:n}),this.tooltip.hidden=!1,qc(this.tooltip,e)}async showResourceTooltip(e){let t=e.dataset.resourceKey;if(this.activeResourceKey===t)return;this.hideTooltip(),this.activeResourceKey=t;let n=this.previewGeneration,r=this.resources.get(t),i=this.selectedGraphId;if(!r||!i)return;let a=this.tooltip.ownerDocument.createElement(`div`);a.className=`gpu-operation-content`;let o=this.tooltip.ownerDocument.createElement(`strong`);o.textContent=r.summary.id;let s=this.tooltip.ownerDocument.createElement(`div`);s.textContent=ml(r.summary);let c=this.tooltip.ownerDocument.createElement(`pre`);c.style.whiteSpace=`pre-wrap`,c.style.fontSize=`11px`,c.textContent=`Reading current GPU data…`,a.append(o,s,c),this.tooltip.querySelector(`.gpu-operation-content`)?.remove(),this.tooltip.append(a),this.tooltip.hidden=!1,qc(this.tooltip,e);try{if(!this.inspector)throw Error(`No live inspector is connected.`);let e=await this.readPreview(t,i,r);if(n!==this.previewGeneration)return;this.showTextureThumbnail(t,e),c.textContent=hl(e);let o=Hc(this.tooltip.ownerDocument,e);o&&a.insertBefore(o,c)}catch(e){if(n!==this.previewGeneration)return;c.textContent=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`}n===this.previewGeneration&&qc(this.tooltip,e)}readPreview(e,t,n){let r=`${t}/${e}`,i=this.pendingPreviews.get(r);if(i)return i;let a=this.inspector?this.inspector.readResource(t,n.nodeId,n.index):Promise.reject(Error(`No live inspector is connected.`));return this.pendingPreviews.set(r,a),a.finally(()=>this.pendingPreviews.delete(r)).catch(()=>{}),a}async selectResource(e){this.hideTooltip();let t=this.resources.get(e),n=this.selectedGraphId;if(!t||!n)return;this.selectedResourceKey=e;let r=++this.viewerGeneration;for(let[t,n]of this.resourceRows)n.setAttribute(`aria-pressed`,String(t===e));let i=this.element.querySelector(`[data-resource-viewer]`);i.textContent=`${t.summary.id} · ${ml(t.summary)}\nReading current GPU data…`;try{let a=await this.readPreview(e,n,t);if(r!==this.viewerGeneration)return;this.showTextureThumbnail(e,a),i.textContent=`${t.summary.id} · ${ml(t.summary)}\n${hl(a)}`;let o=Hc(i.ownerDocument,a);o&&i.prepend(o)}catch(e){r===this.viewerGeneration&&(i.textContent=`${t.summary.id}\nPreview unavailable: ${e instanceof Error?e.message:String(e)}`)}}showTextureThumbnail(e,t){let n=this.resourceRows.get(e);if(!n)return;let r=Hc(n.ownerDocument,t);if(!r)return;let i=Math.max(r.width,r.height);r.style.width=`${48*r.width/i}px`,r.style.height=`${48*r.height/i}px`,r.style.flexShrink=`0`,n.removeAttribute(`title`),n.querySelector(`canvas`)?.remove(),n.prepend(r)}async refreshTextureThumbnails(){let e=this.selectedGraphId;if(!e)return;let t=++this.thumbnailGeneration,n=this.element.querySelector(`[data-texture-previews]`);n.disabled=!0;let r=[...this.resources].filter(([,e])=>e.summary.kind===`texture`).slice(0,32);n.textContent=`Reading up to 32 textures…`;try{for(let[n,i]of r){if(t!==this.thumbnailGeneration)return;this.resourceRows.get(n)?.querySelector(`canvas`)?.remove();try{let r=await this.readPreview(n,e,i);if(t!==this.thumbnailGeneration)return;this.showTextureThumbnail(n,r)}catch(e){if(t!==this.thumbnailGeneration)return;let r=this.resourceRows.get(n);r&&(r.title=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`)}}}finally{n.disabled=!1,n.textContent=`Refresh texture thumbnails`}}hideTooltip(){this.previewGeneration++,this.activeResourceKey=void 0,this.activeNodeId=void 0,this.tooltip.hidden=!0}render(){let e=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId),t=this.element.querySelector(`[data-graph-inspector-empty]`),n=this.element.querySelector(`[data-graph-inspector-content]`);if(!e){this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.thumbnailGeneration++,this.renderedGraphId=void 0,t.hidden=!1,n.hidden=!0;return}if(this.renderedGraphId!==e.id){this.thumbnailGeneration++;for(let e of this.resourceRows.values())e.querySelector(`canvas`)?.remove();this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`}this.renderedGraphId=e.id,this.resources.clear();for(let t of e.nodes)for(let[e,n]of(t.resources??[]).entries()){let{usage:r,...i}=n,a=JSON.stringify(i);this.resources.set(a,{nodeId:t.id,index:e,summary:n})}this.selectedResourceKey&&!this.resources.has(this.selectedResourceKey)&&(this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`),tl(this.element.querySelector(`[data-graph-inspector-resources]`),this.resourceRows,[...this.resources].map(([e,t])=>({id:e,...t})),(e,t)=>{e.className=`graph-inspector-resource`,e.tabIndex=0,rl(e,`role`,`button`),rl(e,`aria-pressed`,String(t.id===this.selectedResourceKey)),rl(e,`data-resource-key`,t.id),rl(e,`aria-describedby`,this.tooltip.id);let n=e.querySelector(`span`);n||(n=e.ownerDocument.createElement(`span`),e.append(n)),nl(n,`${t.summary.kind===`buffer`?`Buffer`:`Texture`} · ${t.summary.id} · ${ml(t.summary)}`)}),this.activeResourceKey&&!this.resources.has(this.activeResourceKey)&&this.hideTooltip(),t.hidden=!0,n.hidden=!1;let r=this.snapshot.graphs.map(e=>`${e.id}\u0000${this.getGraphLabel(e.id)}`).join(``);r!==this.graphOptionsSignature&&(this.graphDropdown.setOptions(this.snapshot.graphs.map(e=>({value:e.id,label:this.getGraphLabel(e.id)}))),this.graphOptionsSignature=r),this.graphDropdown.value!==e.id&&(this.graphDropdown.value=e.id);let i=e.stats.logicalTransientBytes+e.stats.logicalTransientTextureBytes,a=e.stats.reusedTransientBytes+e.stats.reusedTransientTextureBytes,o=i?a/i*100:0,s=e.totals.gpu.sampleCount;tl(this.element.querySelector(`[data-graph-inspector-nodes]`),this.nodeRows,e.nodes,(t,n)=>{t.hasChildNodes()||(t.className=`graph-inspector-node`,t.innerHTML=`<span><i></i><span data-node-label></span></span><strong data-node-cpu></strong><strong data-node-gpu></strong>`),rl(t,`data-node-type`,n.type),rl(t,`data-full-name`,n.id),rl(t,`data-operation-details`,Jc(n)),rl(t,`aria-describedby`,this.tooltip.id),t.tabIndex=0,this.activeNodeId===n.id&&this.showTooltip(t);let r=t.querySelector(`i`),i=n.type===`render`?`draw`:n.type;rl(r,`title`,i),rl(r,`aria-label`,i);let a=fl(this.nodeLabels,n.id);nl(t.querySelector(`[data-node-label]`),a===n.id?sl(n.id,e.id):a),nl(t.querySelector(`[data-node-cpu]`),cl(n.cpu)),nl(t.querySelector(`[data-node-gpu]`),cl(n.gpu))}),this.activeNodeId&&!e.nodes.some(e=>e.id===this.activeNodeId)&&this.hideTooltip(),tl(this.element.querySelector(`[data-graph-inspector-counter-rows]`),this.counterRows,e.counters,(e,t)=>{e.hasChildNodes()||(e.className=`graph-inspector-counter`,e.innerHTML=`<span></span><strong data-counter-latest></strong><strong data-counter-percentiles></strong>`),rl(e,`title`,`${t.id} · ${t.sampleCount} samples`),nl(e.querySelector(`span`),this.getCounterLabel(t.id)),nl(e.querySelector(`[data-counter-latest]`),ul(t.latestValue)),nl(e.querySelector(`[data-counter-percentiles]`),`${ul(t.p50Value)} / ${ul(t.p95Value)}`)}),this.setText(`encoding-count`,String(e.encodingCount)),this.setText(`cpu-totals`,cl(e.totals.cpu)),this.setText(`gpu-totals`,cl(e.totals.gpu)),this.setText(`gpu-samples`,`${s}${e.timingReadFailureCount?` · ${e.timingReadFailureCount} failed`:``}`);let c=`
      <span>${e.stats.nodeOrder.length} nodes</span>
      <span>${dl(e.stats.logicalResourceBytes)} logical</span>
      <span>${dl(e.stats.physicalTransientResourceBytes)} scratch</span>
      ${e.preflight?.annotatedNodeCount?`<span>${e.preflight.annotatedNodeCount}/${e.stats.nodeOrder.length} costed nodes</span>`:``}
      ${e.preflight?.maximumInvocationCount?`<span>${il(e.preflight.maximumInvocationCount)} max invocations</span>`:``}
      ${e.preflight?.readByteLength?`<span>${dl(e.preflight.readByteLength)} max reads</span>`:``}
      ${e.preflight?.writeByteLength?`<span>${dl(e.preflight.writeByteLength)} max writes</span>`:``}
      <span>${o?`${o.toFixed(0)}% reuse`:`no reuse`}</span>
      <span>${s?`GPU timings sampled`:`CPU timings only`}</span>`;c!==this.memoryMarkup&&(this.element.querySelector(`[data-graph-inspector-memory]`).innerHTML=c,this.memoryMarkup=c);let l=this.element.querySelector(`[data-graph-inspector-counters]`);l.hidden=e.counters.length===0}setText(e,t){nl(this.element.querySelector(`[data-graph-inspector-${e}]`),t)}getGraphLabel(e){return fl(this.graphLabels,e)}getCounterLabel(e){return fl(this.counterLabels,e)}};function tl(e,t,n,r){let i=new Set(n.map(e=>e.id));for(let[e,n]of t)i.has(e)||(n.remove(),t.delete(e));for(let[i,a]of n.entries()){let n=t.get(a.id);n||(n=e.ownerDocument.createElement(`div`),t.set(a.id,n)),r(n,a);let o=e.children[i]??null;o!==n&&e.insertBefore(n,o)}}function nl(e,t){e.textContent!==t&&(e.textContent=t)}function rl(e,t,n){e.getAttribute(t)!==n&&e.setAttribute(t,n)}function il(e){return $c.format(e)}var al=`
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
`;function ol(e,t,n){return`<span class="graph-inspector-metric"><span>${pl(e)}</span><strong data-graph-inspector-${n}>${pl(t)}</strong></span>`}function sl(e,t){let n=t.endsWith(`-graph`)?t.slice(0,-6):t,r=e.startsWith(`${n}-`)?e.slice(n.length+1):e;return r.length>32?`${r.slice(0,30)}…`:r}function cl(e){return e.p50Milliseconds===void 0?`—`:`${ll(e.p50Milliseconds)} / ${ll(e.p95Milliseconds??e.p50Milliseconds)}`}function ll(e){return e.toFixed(e<1?3:2)}function ul(e){return(e>=1e4?$c:Qc).format(e)}function dl(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(1)} KiB`:e<1024**3?`${(e/1024**2).toFixed(1)} MiB`:`${(e/1024**3).toFixed(1)} GiB`}function fl(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:t}function pl(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function ml(e){return e.kind===`buffer`?`${e.format??`raw bytes`} · ${e.byteLength??0} B @ ${e.byteOffset??0}`:`${e.format??e.kind} · ${e.width} × ${e.height} · mip ${e.baseMipLevel??0}, layer ${e.baseArrayLayer??0}`}function hl(e){let t=e.data,n,r=`bytes`;return/^float32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Float32Array(t.slice().buffer)),r=`float32`):/^uint32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Uint32Array(t.slice().buffer)),r=`uint32`):n=Array.from(t),`Current allocation · ${t.length} bytes read${e.width?` · top-left ${e.width} × ${e.height}`:``}\n${r}: ${n.slice(0,64).join(`, `)}${n.length>64?`, …`:``}`}var gl=class{panel;renderer=null;snapshot={graphs:[]};preferredGraphId;constructor(e={}){this.panel=Mc({id:e.id??`gpu-command-graph-debug`,title:e.title??`GPU Graph`,html:`<p class="hint">Compiled nodes, memory, and recorded timings. GPU timings appear when supplied by the application.</p><div data-graph-debug-host></div>`,onRender:t=>{let n=new el(t.querySelector(`[data-graph-debug-host]`),e);return this.renderer=n,n.update(this.snapshot,this.preferredGraphId),()=>{n.destroy(),this.renderer===n&&(this.renderer=null)}}})}update(e,t){this.snapshot=e,this.preferredGraphId=t,this.renderer?.update(e,t)}},_l=new Intl.NumberFormat(`en-US`,{maximumSignificantDigits:3,useGrouping:!1}),vl=class{panel;renderer=null;report;label=``;constructor(e={}){this.panel=Mc({id:e.id??`gpu-trace`,title:e.title??`GPU Trace`,html:`<div data-gpu-trace-host></div>`,onRender:e=>{let t=new yl(e.querySelector(`[data-gpu-trace-host]`));return this.renderer=t,t.update(this.report,this.label),()=>{t.destroy(),this.renderer===t&&(this.renderer=null)}}})}update(e,t=``){this.report=e,this.label=t,this.renderer?.update(e,t)}},yl=class{combinedTimeline=!1;tooltip;activeSpanKey;tooltipNodes=new Map;constructor(e){this.element=e,this.tooltip=Kc(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-trace-tooltip`,``)}update(e,t=``){this.tooltipNodes.clear();let n=document.createElement(`section`);n.setAttribute(`data-gpu-trace`,``),n.setAttribute(`aria-label`,`GPU Trace`);let r=document.createElement(`style`);if(r.textContent=Sl,n.append(r),bl(n,`strong`,t||`Latest graph execution`),!e)bl(n,`p`,`No trace collected yet.`);else{let r=e.clockCorrelation,i=!!(r&&Number.isFinite(r.offsetMilliseconds)&&Number.isFinite(r.uncertaintyMilliseconds)&&r.uncertaintyMilliseconds>=0),a=document.createElement(`label`),o=document.createElement(`input`);o.type=`checkbox`,o.checked=this.combinedTimeline,o.disabled=!i,o.addEventListener(`change`,()=>{this.combinedTimeline=o.checked,this.update(e,t)}),a.append(o,` Combined timeline (estimated)`),n.append(a);let s=this.combinedTimeline&&i;bl(n,`p`,s?`Alignment ±${xl(r.uncertaintyMilliseconds)}ms, plus timestamp precision. Submission-time estimate.`:`CPU and GPU use separate clocks. Each timeline starts at its own origin.`),i||bl(n,`p`,`Combined timeline requires submission clock correlation.`);let c=s?r.offsetMilliseconds:0,l=s?e.nodes.flatMap(e=>[e.cpuEncodeStartTimeMilliseconds,e.gpuStartTimeMilliseconds===void 0?void 0:e.gpuStartTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[],u=s?e.nodes.flatMap(e=>[e.cpuEncodeEndTimeMilliseconds,e.gpuEndTimeMilliseconds===void 0?void 0:e.gpuEndTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[];s&&e.cpuEncodeStartTimeMilliseconds!==void 0&&l.push(e.cpuEncodeStartTimeMilliseconds),s&&e.cpuEncodeEndTimeMilliseconds!==void 0&&u.push(e.cpuEncodeEndTimeMilliseconds);for(let t of[`gpu`,`cpu`]){let r=e.nodes.flatMap(e=>{let n=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,r=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds;return n!==void 0&&r!==void 0&&Number.isFinite(n)&&Number.isFinite(r)&&r>=n?[{node:e,start:n+(t===`gpu`?c:0),end:r+(t===`gpu`?c:0)}]:[]}),i=document.createElement(`section`);if(i.dataset.traceClock=t,n.append(i),bl(i,`h4`,t===`cpu`?`CPU encoding`:`GPU execution`),!r.length){bl(i,`p`,t===`cpu`?`CPU span endpoints unavailable.`:`GPU span endpoints unavailable. Timestamp queries are required.`);continue}let a=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,o=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds,d=s?Math.min(...l):Math.min(...r.map(e=>e.start),a??1/0),f=(s?Math.max(...u):Math.max(...r.map(e=>e.end),o??-1/0))-d;bl(i,`p`,`0 – ${xl(f)}ms · ${r.length}/${e.nodes.length} nodes`);let p=document.createElement(`div`);p.className=`gpu-trace-rows`,i.append(p);for(let e of r){let n=document.createElement(`div`);n.className=`gpu-trace-row`,bl(n,`span`,e.node.operation??e.node.type).setAttribute(`aria-label`,Jc(e.node));let r=document.createElement(`div`);r.className=`gpu-trace-track`;let i=document.createElement(`span`);i.className=`gpu-trace-bar`,i.tabIndex=0,i.style.left=`${f?(e.start-d)/f*100:0}%`,i.style.width=`${f?(e.end-e.start)/f*100:0}%`;let a=t===`cpu`?e.node.cpuEncodeTimeMilliseconds:e.node.gpuTimeMilliseconds,o=`${e.node.id} (${e.node.type}${e.node.condition?.outcome===`skipped`?`, skipped`:``}): ${xl(e.start-d)}–${xl(e.end-d)}ms; duration ${xl(a??e.end-e.start)}ms`;n.dataset.spanKey=JSON.stringify([t,e.node.id]),this.tooltipNodes.set(n.dataset.spanKey,{node:e.node,timing:`${t.toUpperCase()} · ${xl(a??e.end-e.start)}ms duration · ${xl(e.start-d)}–${xl(e.end-d)}ms${e.node.condition?.outcome===`skipped`?` · skipped`:``}`});let s=Jc(e.node,o);n.dataset.spanDetails=s,i.setAttribute(`aria-describedby`,this.tooltip.id),i.setAttribute(`aria-label`,s),r.append(i),n.append(r),bl(n,`span`,`${xl(a??e.end-e.start)}ms`),p.append(n)}}}let i=bl(n,`p`,`Hover or focus a span for details.`);i.setAttribute(`aria-live`,`polite`);let a=e=>{let t=e.target.closest(`.gpu-trace-row`);t&&(i.textContent=t.dataset.spanDetails,this.showTooltip(t))},o=e=>{let t=e.relatedTarget,n=e.target.closest(`.gpu-trace-row`);(!(t instanceof Node)||!n?.contains(t))&&this.hideTooltip()};n.addEventListener(`mouseover`,a),n.addEventListener(`focusin`,a),n.addEventListener(`mouseout`,o),n.addEventListener(`focusout`,o),n.addEventListener(`scroll`,()=>this.hideTooltip(),!0),n.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip()});let s=this.element.ownerDocument.activeElement,c=s&&this.element.contains(s)?s.closest(`.gpu-trace-row`)?.dataset.spanKey:void 0,l=this.activeSpanKey;this.element.replaceChildren(n);let u=Array.from(n.querySelectorAll(`.gpu-trace-row`)),d=u.find(e=>e.dataset.spanKey===c);d&&d.querySelector(`.gpu-trace-bar`).focus({preventScroll:!0});let f=u.find(e=>e.dataset.spanKey===l);f?(i.textContent=f.dataset.spanDetails,this.showTooltip(f)):this.hideTooltip()}showTooltip(e){this.activeSpanKey=e.dataset.spanKey;let t=this.tooltipNodes.get(this.activeSpanKey);t&&(Yc(this.tooltip,t.node,{timing:t.timing}),this.tooltip.hidden=!1,qc(this.tooltip,e))}hideTooltip(){this.activeSpanKey=void 0,this.tooltip.hidden=!0}destroy(){this.hideTooltip(),this.tooltip.remove(),this.tooltipNodes.clear(),this.element.replaceChildren()}};function bl(e,t,n){let r=document.createElement(t);return r.textContent=n,e.append(r),r}function xl(e){return _l.format(e)}var Sl=`
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
`,Cl=class{inspector=new uo;inspectorPanel=new gl({inspector:this.inspector});tracePanel;graphs=new Map;sampleCounts=new Map;latestEncoding=null;generation=0;latestGraphId;constructor(e={}){this.tracePanel=new vl({title:e.traceTitle})}encode(e,t,n){let r=(this.graphs.get(e.id)===e?this.sampleCounts.get(e.id):0)%60==0&&t.getTimeProfilingQuerySet()===null&&t.device.features.has(`timestamp-query`)&&t.withTimeProfilingQuerySet?t.device.createQuerySet({type:`timestamp`,count:Math.min(8192,Math.max(2,e.stats.nodeOrder.length*2))}):void 0,i;try{i=r?t.withTimeProfilingQuerySet(r,()=>e.encode(t,n)):e.encode(t,n)}catch(e){throw r?.destroy(),e}return this.record(e,i,r),i}record(e,t,n){this.graphs.get(e.id)!==e&&(this.graphs.set(e.id,e),this.sampleCounts.set(e.id,0),this.inspector.registerGraph(e)),this.inspector.recordEncoding(e.id,t);let r=this.sampleCounts.get(e.id);if(this.sampleCounts.set(e.id,r+1),r%60!=0)return;this.latestEncoding=t,this.latestGraphId=e.id,this.inspectorPanel.update(this.inspector.getSnapshot(),e.id);let i=this.generation;queueMicrotask(()=>{if(i!==this.generation||this.graphs.get(e.id)!==e){n?.destroy();return}this.inspector.recordGPUTimings(e.id,t).then(n=>{i!==this.generation||this.graphs.get(e.id)!==e||(this.inspectorPanel.update(this.inspector.getSnapshot(),this.latestGraphId),this.latestEncoding===t&&this.tracePanel.update(n??t.stats,e.id))}).catch(()=>{i===this.generation&&this.latestEncoding===t&&this.tracePanel.update(t.stats,e.id)}).finally(()=>n?.destroy())})}clear(){this.generation++,this.latestEncoding=null,this.latestGraphId=void 0,this.graphs.clear(),this.sampleCounts.clear(),this.inspector.clear(),this.inspectorPanel.update(this.inspector.getSnapshot()),this.tracePanel.update(void 0)}},wl=x((e=>{var t=Symbol.for(`react.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.provider`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.iterator;function p(e){return typeof e!=`object`||!e?null:(e=f&&e[f]||e[`@@iterator`],typeof e==`function`?e:null)}var m={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},h=Object.assign,g={};function _(e,t,n){this.props=e,this.context=t,this.refs=g,this.updater=n||m}_.prototype.isReactComponent={},_.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`setState(...): takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},_.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function v(){}v.prototype=_.prototype;function y(e,t,n){this.props=e,this.context=t,this.refs=g,this.updater=n||m}var b=y.prototype=new v;b.constructor=y,h(b,_.prototype),b.isPureReactComponent=!0;var x=Array.isArray,S=Object.prototype.hasOwnProperty,C={current:null},w={key:!0,ref:!0,__self:!0,__source:!0};function T(e,n,r){var i,a={},o=null,s=null;if(n!=null)for(i in n.ref!==void 0&&(s=n.ref),n.key!==void 0&&(o=``+n.key),n)S.call(n,i)&&!w.hasOwnProperty(i)&&(a[i]=n[i]);var c=arguments.length-2;if(c===1)a.children=r;else if(1<c){for(var l=Array(c),u=0;u<c;u++)l[u]=arguments[u+2];a.children=l}if(e&&e.defaultProps)for(i in c=e.defaultProps,c)a[i]===void 0&&(a[i]=c[i]);return{$$typeof:t,type:e,key:o,ref:s,props:a,_owner:C.current}}function ee(e,n){return{$$typeof:t,type:e.type,key:n,ref:e.ref,props:e.props,_owner:e._owner}}function E(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function D(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var O=/\/+/g;function k(e,t){return typeof e==`object`&&e&&e.key!=null?D(``+e.key):t.toString(36)}function A(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0}}if(c)return c=e,o=o(c),e=a===``?`.`+k(c,0):a,x(o)?(i=``,e!=null&&(i=e.replace(O,`$&/`)+`/`),A(o,r,i,``,function(e){return e})):o!=null&&(E(o)&&(o=ee(o,i+(!o.key||c&&c.key===o.key?``:(``+o.key).replace(O,`$&/`)+`/`)+e)),r.push(o)),1;if(c=0,a=a===``?`.`:a+`:`,x(e))for(var l=0;l<e.length;l++){s=e[l];var u=a+k(s,l);c+=A(s,r,i,u,o)}else if(u=p(e),typeof u==`function`)for(e=u.call(e),l=0;!(s=e.next()).done;)s=s.value,u=a+k(s,l++),c+=A(s,r,i,u,o);else if(s===`object`)throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`);return c}function te(e,t,n){if(e==null)return e;var r=[],i=0;return A(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function j(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t)},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var M={current:null},ne={transition:null},re={ReactCurrentDispatcher:M,ReactCurrentBatchConfig:ne,ReactCurrentOwner:C};function N(){throw Error(`act(...) is not supported in production builds of React.`)}e.Children={map:te,forEach:function(e,t,n){te(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return te(e,function(){t++}),t},toArray:function(e){return te(e,function(e){return e})||[]},only:function(e){if(!E(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}},e.Component=_,e.Fragment=r,e.Profiler=a,e.PureComponent=y,e.StrictMode=i,e.Suspense=l,e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=re,e.act=N,e.cloneElement=function(e,n,r){if(e==null)throw Error(`React.cloneElement(...): The argument must be a React element, but you passed `+e+`.`);var i=h({},e.props),a=e.key,o=e.ref,s=e._owner;if(n!=null){if(n.ref!==void 0&&(o=n.ref,s=C.current),n.key!==void 0&&(a=``+n.key),e.type&&e.type.defaultProps)var c=e.type.defaultProps;for(l in n)S.call(n,l)&&!w.hasOwnProperty(l)&&(i[l]=n[l]===void 0&&c!==void 0?c[l]:n[l])}var l=arguments.length-2;if(l===1)i.children=r;else if(1<l){c=Array(l);for(var u=0;u<l;u++)c[u]=arguments[u+2];i.children=c}return{$$typeof:t,type:e.type,key:a,ref:o,props:i,_owner:s}},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:o,_context:e},e.Consumer=e},e.createElement=T,e.createFactory=function(e){var t=T.bind(null,e);return t.type=e,t},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=E,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:j}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=function(e){var t=ne.transition;ne.transition={};try{e()}finally{ne.transition=t}},e.unstable_act=N,e.useCallback=function(e,t){return M.current.useCallback(e,t)},e.useContext=function(e){return M.current.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e){return M.current.useDeferredValue(e)},e.useEffect=function(e,t){return M.current.useEffect(e,t)},e.useId=function(){return M.current.useId()},e.useImperativeHandle=function(e,t,n){return M.current.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return M.current.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return M.current.useLayoutEffect(e,t)},e.useMemo=function(e,t){return M.current.useMemo(e,t)},e.useReducer=function(e,t,n){return M.current.useReducer(e,t,n)},e.useRef=function(e){return M.current.useRef(e)},e.useState=function(e){return M.current.useState(e)},e.useSyncExternalStore=function(e,t,n){return M.current.useSyncExternalStore(e,t,n)},e.useTransition=function(){return M.current.useTransition()},e.version=`18.3.1`})),Tl=x(((e,t)=>{t.exports=wl()})),El=x((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=typeof setTimeout==`function`?setTimeout:null,_=typeof clearTimeout==`function`?clearTimeout:null,v=typeof setImmediate<`u`?setImmediate:null;typeof navigator<`u`&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function y(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function b(e){if(h=!1,y(e),!m)if(n(c)!==null)m=!0,te(x);else{var t=n(l);t!==null&&j(b,t.startTime-e)}}function x(t,i){m=!1,h&&(h=!1,_(w),w=-1),p=!0;var a=f;try{for(y(i),d=n(c);d!==null&&(!(d.expirationTime>i)||t&&!E());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=i);i=e.unstable_now(),typeof s==`function`?d.callback=s:d===n(c)&&r(c),y(i)}else r(c);d=n(c)}if(d!==null)var u=!0;else{var g=n(l);g!==null&&j(b,g.startTime-i),u=!1}return u}finally{d=null,f=a,p=!1}}var S=!1,C=null,w=-1,T=5,ee=-1;function E(){return!(e.unstable_now()-ee<T)}function D(){if(C!==null){var t=e.unstable_now();ee=t;var n=!0;try{n=C(!0,t)}finally{n?O():(S=!1,C=null)}}else S=!1}var O;if(typeof v==`function`)O=function(){v(D)};else if(typeof MessageChannel<`u`){var k=new MessageChannel,A=k.port2;k.port1.onmessage=D,O=function(){A.postMessage(null)}}else O=function(){g(D,0)};function te(e){C=e,S||(S=!0,O())}function j(t,n){w=g(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_continueExecution=function(){m||p||(m=!0,te(x))},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):T=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_getFirstCallbackNode=function(){return n(c)},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_pauseExecution=function(){},e.unstable_requestPaint=function(){},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(_(w),w=-1):h=!0,j(b,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,te(x))),r},e.unstable_shouldYield=E,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),Dl=x(((e,t)=>{t.exports=El()})),Ol=x((e=>{var t=Tl(),n=Dl();function r(e){for(var t=`https://reactjs.org/docs/error-decoder.html?invariant=`+e,n=1;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n]);return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}var i=new Set,a={};function o(e,t){s(e,t),s(e+`Capture`,t)}function s(e,t){for(a[e]=t,e=0;e<t.length;e++)i.add(t[e])}var c=!(typeof window>`u`||window.document===void 0||window.document.createElement===void 0),l=Object.prototype.hasOwnProperty,u=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,d={},f={};function p(e){return l.call(f,e)?!0:l.call(d,e)?!1:u.test(e)?f[e]=!0:(d[e]=!0,!1)}function m(e,t,n,r){if(n!==null&&n.type===0)return!1;switch(typeof t){case`function`:case`symbol`:return!0;case`boolean`:return r?!1:n===null?(e=e.toLowerCase().slice(0,5),e!==`data-`&&e!==`aria-`):!n.acceptsBooleans;default:return!1}}function h(e,t,n,r){if(t==null||m(e,t,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return!1===t;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function g(e,t,n,r,i,a,o){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=r,this.attributeNamespace=i,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=a,this.removeEmptyString=o}var _={};`children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style`.split(` `).forEach(function(e){_[e]=new g(e,0,!1,e,null,!1,!1)}),[[`acceptCharset`,`accept-charset`],[`className`,`class`],[`htmlFor`,`for`],[`httpEquiv`,`http-equiv`]].forEach(function(e){var t=e[0];_[t]=new g(t,1,!1,e[1],null,!1,!1)}),[`contentEditable`,`draggable`,`spellCheck`,`value`].forEach(function(e){_[e]=new g(e,2,!1,e.toLowerCase(),null,!1,!1)}),[`autoReverse`,`externalResourcesRequired`,`focusable`,`preserveAlpha`].forEach(function(e){_[e]=new g(e,2,!1,e,null,!1,!1)}),`allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope`.split(` `).forEach(function(e){_[e]=new g(e,3,!1,e.toLowerCase(),null,!1,!1)}),[`checked`,`multiple`,`muted`,`selected`].forEach(function(e){_[e]=new g(e,3,!0,e,null,!1,!1)}),[`capture`,`download`].forEach(function(e){_[e]=new g(e,4,!1,e,null,!1,!1)}),[`cols`,`rows`,`size`,`span`].forEach(function(e){_[e]=new g(e,6,!1,e,null,!1,!1)}),[`rowSpan`,`start`].forEach(function(e){_[e]=new g(e,5,!1,e.toLowerCase(),null,!1,!1)});var v=/[\-:]([a-z])/g;function y(e){return e[1].toUpperCase()}`accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height`.split(` `).forEach(function(e){var t=e.replace(v,y);_[t]=new g(t,1,!1,e,null,!1,!1)}),`xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type`.split(` `).forEach(function(e){var t=e.replace(v,y);_[t]=new g(t,1,!1,e,`http://www.w3.org/1999/xlink`,!1,!1)}),[`xml:base`,`xml:lang`,`xml:space`].forEach(function(e){var t=e.replace(v,y);_[t]=new g(t,1,!1,e,`http://www.w3.org/XML/1998/namespace`,!1,!1)}),[`tabIndex`,`crossOrigin`].forEach(function(e){_[e]=new g(e,1,!1,e.toLowerCase(),null,!1,!1)}),_.xlinkHref=new g(`xlinkHref`,1,!1,`xlink:href`,`http://www.w3.org/1999/xlink`,!0,!1),[`src`,`href`,`action`,`formAction`].forEach(function(e){_[e]=new g(e,1,!1,e.toLowerCase(),null,!0,!0)});function b(e,t,n,r){var i=_.hasOwnProperty(t)?_[t]:null;(i===null?r||!(2<t.length)||t[0]!==`o`&&t[0]!==`O`||t[1]!==`n`&&t[1]!==`N`:i.type!==0)&&(h(t,n,i,r)&&(n=null),r||i===null?p(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,``+n)):i.mustUseProperty?e[i.propertyName]=n===null?i.type===3?!1:``:n:(t=i.attributeName,r=i.attributeNamespace,n===null?e.removeAttribute(t):(i=i.type,n=i===3||i===4&&!0===n?``:``+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}var x=t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,S=Symbol.for(`react.element`),C=Symbol.for(`react.portal`),w=Symbol.for(`react.fragment`),T=Symbol.for(`react.strict_mode`),ee=Symbol.for(`react.profiler`),E=Symbol.for(`react.provider`),D=Symbol.for(`react.context`),O=Symbol.for(`react.forward_ref`),k=Symbol.for(`react.suspense`),A=Symbol.for(`react.suspense_list`),te=Symbol.for(`react.memo`),j=Symbol.for(`react.lazy`),M=Symbol.for(`react.offscreen`),ne=Symbol.iterator;function re(e){return typeof e!=`object`||!e?null:(e=ne&&e[ne]||e[`@@iterator`],typeof e==`function`?e:null)}var N=Object.assign,ie;function ae(e){if(ie===void 0)try{throw Error()}catch(e){var t=e.stack.trim().match(/\n( *(at )?)/);ie=t&&t[1]||``}return`
`+ie+e}var oe=!1;function se(e,t){if(!e||oe)return``;oe=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,`props`,{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(t,[])}catch(e){var r=e}Reflect.construct(e,[],t)}else{try{t.call()}catch(e){r=e}e.call(t.prototype)}else{try{throw Error()}catch(e){r=e}e()}}catch(t){if(t&&r&&typeof t.stack==`string`){for(var i=t.stack.split(`
`),a=r.stack.split(`
`),o=i.length-1,s=a.length-1;1<=o&&0<=s&&i[o]!==a[s];)s--;for(;1<=o&&0<=s;o--,s--)if(i[o]!==a[s]){if(o!==1||s!==1)do if(o--,s--,0>s||i[o]!==a[s]){var c=`
`+i[o].replace(` at new `,` at `);return e.displayName&&c.includes(`<anonymous>`)&&(c=c.replace(`<anonymous>`,e.displayName)),c}while(1<=o&&0<=s);break}}}finally{oe=!1,Error.prepareStackTrace=n}return(e=e?e.displayName||e.name:``)?ae(e):``}function ce(e){switch(e.tag){case 5:return ae(e.type);case 16:return ae(`Lazy`);case 13:return ae(`Suspense`);case 19:return ae(`SuspenseList`);case 0:case 2:case 15:return e=se(e.type,!1),e;case 11:return e=se(e.type.render,!1),e;case 1:return e=se(e.type,!0),e;default:return``}}function le(e){if(e==null)return null;if(typeof e==`function`)return e.displayName||e.name||null;if(typeof e==`string`)return e;switch(e){case w:return`Fragment`;case C:return`Portal`;case ee:return`Profiler`;case T:return`StrictMode`;case k:return`Suspense`;case A:return`SuspenseList`}if(typeof e==`object`)switch(e.$$typeof){case D:return(e.displayName||`Context`)+`.Consumer`;case E:return(e._context.displayName||`Context`)+`.Provider`;case O:var t=e.render;return e=e.displayName,e||=(e=t.displayName||t.name||``,e===``?`ForwardRef`:`ForwardRef(`+e+`)`),e;case te:return t=e.displayName||null,t===null?le(e.type)||`Memo`:t;case j:t=e._payload,e=e._init;try{return le(e(t))}catch{}}return null}function ue(e){var t=e.type;switch(e.tag){case 24:return`Cache`;case 9:return(t.displayName||`Context`)+`.Consumer`;case 10:return(t._context.displayName||`Context`)+`.Provider`;case 18:return`DehydratedFragment`;case 11:return e=t.render,e=e.displayName||e.name||``,t.displayName||(e===``?`ForwardRef`:`ForwardRef(`+e+`)`);case 7:return`Fragment`;case 5:return t;case 4:return`Portal`;case 3:return`Root`;case 6:return`Text`;case 16:return le(t);case 8:return t===T?`StrictMode`:`Mode`;case 22:return`Offscreen`;case 12:return`Profiler`;case 21:return`Scope`;case 13:return`Suspense`;case 19:return`SuspenseList`;case 25:return`TracingMarker`;case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t==`function`)return t.displayName||t.name||null;if(typeof t==`string`)return t}return null}function de(e){switch(typeof e){case`boolean`:case`number`:case`string`:case`undefined`:return e;case`object`:return e;default:return``}}function fe(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()===`input`&&(t===`checkbox`||t===`radio`)}function pe(e){var t=fe(e)?`checked`:`value`,n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=``+e[t];if(!e.hasOwnProperty(t)&&n!==void 0&&typeof n.get==`function`&&typeof n.set==`function`){var i=n.get,a=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){r=``+e,a.call(this,e)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(e){r=``+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function me(e){e._valueTracker||=pe(e)}function he(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r=``;return e&&(r=fe(e)?e.checked?`true`:`false`:e.value),e=r,e===n?!1:(t.setValue(e),!0)}function ge(e){if(e||=typeof document<`u`?document:void 0,e===void 0)return null;try{return e.activeElement||e.body}catch{return e.body}}function _e(e,t){var n=t.checked;return N({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??e._wrapperState.initialChecked})}function ve(e,t){var n=t.defaultValue==null?``:t.defaultValue,r=t.checked==null?t.defaultChecked:t.checked;n=de(t.value==null?n:t.value),e._wrapperState={initialChecked:r,initialValue:n,controlled:t.type===`checkbox`||t.type===`radio`?t.checked!=null:t.value!=null}}function ye(e,t){t=t.checked,t!=null&&b(e,`checked`,t,!1)}function be(e,t){ye(e,t);var n=de(t.value),r=t.type;if(n!=null)r===`number`?(n===0&&e.value===``||e.value!=n)&&(e.value=``+n):e.value!==``+n&&(e.value=``+n);else if(r===`submit`||r===`reset`){e.removeAttribute(`value`);return}t.hasOwnProperty(`value`)?Se(e,t.type,n):t.hasOwnProperty(`defaultValue`)&&Se(e,t.type,de(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function xe(e,t,n){if(t.hasOwnProperty(`value`)||t.hasOwnProperty(`defaultValue`)){var r=t.type;if(!(r!==`submit`&&r!==`reset`||t.value!==void 0&&t.value!==null))return;t=``+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==``&&(e.name=``),e.defaultChecked=!!e._wrapperState.initialChecked,n!==``&&(e.name=n)}function Se(e,t,n){(t!==`number`||ge(e.ownerDocument)!==e)&&(n==null?e.defaultValue=``+e._wrapperState.initialValue:e.defaultValue!==``+n&&(e.defaultValue=``+n))}var Ce=Array.isArray;function we(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t[`$`+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty(`$`+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=``+de(n),t=null,i=0;i<e.length;i++){if(e[i].value===n){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function Te(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(r(91));return N({},t,{value:void 0,defaultValue:void 0,children:``+e._wrapperState.initialValue})}function Ee(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(r(92));if(Ce(n)){if(1<n.length)throw Error(r(93));n=n[0]}t=n}t??=``,n=t}e._wrapperState={initialValue:de(n)}}function De(e,t){var n=de(t.value),r=de(t.defaultValue);n!=null&&(n=``+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),r!=null&&(e.defaultValue=``+r)}function Oe(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==``&&t!==null&&(e.value=t)}function ke(e){switch(e){case`svg`:return`http://www.w3.org/2000/svg`;case`math`:return`http://www.w3.org/1998/Math/MathML`;default:return`http://www.w3.org/1999/xhtml`}}function Ae(e,t){return e==null||e===`http://www.w3.org/1999/xhtml`?ke(t):e===`http://www.w3.org/2000/svg`&&t===`foreignObject`?`http://www.w3.org/1999/xhtml`:e}var je,Me=function(e){return typeof MSApp<`u`&&MSApp.execUnsafeLocalFunction?function(t,n,r,i){MSApp.execUnsafeLocalFunction(function(){return e(t,n,r,i)})}:e}(function(e,t){if(e.namespaceURI!==`http://www.w3.org/2000/svg`||`innerHTML`in e)e.innerHTML=t;else{for(je||=document.createElement(`div`),je.innerHTML=`<svg>`+t.valueOf().toString()+`</svg>`,t=je.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Ne(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Pe={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Fe=[`Webkit`,`ms`,`Moz`,`O`];Object.keys(Pe).forEach(function(e){Fe.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Pe[t]=Pe[e]})});function Ie(e,t,n){return t==null||typeof t==`boolean`||t===``?``:n||typeof t!=`number`||t===0||Pe.hasOwnProperty(e)&&Pe[e]?(``+t).trim():t+`px`}function Le(e,t){for(var n in e=e.style,t)if(t.hasOwnProperty(n)){var r=n.indexOf(`--`)===0,i=Ie(n,t[n],r);n===`float`&&(n=`cssFloat`),r?e.setProperty(n,i):e[n]=i}}var Re=N({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function ze(e,t){if(t){if(Re[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(r(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(r(60));if(typeof t.dangerouslySetInnerHTML!=`object`||!(`__html`in t.dangerouslySetInnerHTML))throw Error(r(61))}if(t.style!=null&&typeof t.style!=`object`)throw Error(r(62))}}function Be(e,t){if(e.indexOf(`-`)===-1)return typeof t.is==`string`;switch(e){case`annotation-xml`:case`color-profile`:case`font-face`:case`font-face-src`:case`font-face-uri`:case`font-face-format`:case`font-face-name`:case`missing-glyph`:return!1;default:return!0}}var Ve=null;function He(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Ue=null,We=null,Ge=null;function Ke(e){if(e=Hi(e)){if(typeof Ue!=`function`)throw Error(r(280));var t=e.stateNode;t&&(t=Wi(t),Ue(e.stateNode,e.type,t))}}function qe(e){We?Ge?Ge.push(e):Ge=[e]:We=e}function Je(){if(We){var e=We,t=Ge;if(Ge=We=null,Ke(e),t)for(e=0;e<t.length;e++)Ke(t[e])}}function Ye(e,t){return e(t)}function Xe(){}var Ze=!1;function Qe(e,t,n){if(Ze)return e(t,n);Ze=!0;try{return Ye(e,t,n)}finally{Ze=!1,(We!==null||Ge!==null)&&(Xe(),Je())}}function $e(e,t){var n=e.stateNode;if(n===null)return null;var i=Wi(n);if(i===null)return null;n=i[t];a:switch(t){case`onClick`:case`onClickCapture`:case`onDoubleClick`:case`onDoubleClickCapture`:case`onMouseDown`:case`onMouseDownCapture`:case`onMouseMove`:case`onMouseMoveCapture`:case`onMouseUp`:case`onMouseUpCapture`:case`onMouseEnter`:(i=!i.disabled)||(e=e.type,i=!(e===`button`||e===`input`||e===`select`||e===`textarea`)),e=!i;break a;default:e=!1}if(e)return null;if(n&&typeof n!=`function`)throw Error(r(231,t,typeof n));return n}var et=!1;if(c)try{var tt={};Object.defineProperty(tt,`passive`,{get:function(){et=!0}}),window.addEventListener(`test`,tt,tt),window.removeEventListener(`test`,tt,tt)}catch{et=!1}function nt(e,t,n,r,i,a,o,s,c){var l=Array.prototype.slice.call(arguments,3);try{t.apply(n,l)}catch(e){this.onError(e)}}var rt=!1,it=null,at=!1,ot=null,st={onError:function(e){rt=!0,it=e}};function ct(e,t,n,r,i,a,o,s,c){rt=!1,it=null,nt.apply(st,arguments)}function lt(e,t,n,i,a,o,s,c,l){if(ct.apply(this,arguments),rt){if(rt){var u=it;rt=!1,it=null}else throw Error(r(198));at||(at=!0,ot=u)}}function ut(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function dt(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function ft(e){if(ut(e)!==e)throw Error(r(188))}function pt(e){var t=e.alternate;if(!t){if(t=ut(e),t===null)throw Error(r(188));return t===e?e:null}for(var n=e,i=t;;){var a=n.return;if(a===null)break;var o=a.alternate;if(o===null){if(i=a.return,i!==null){n=i;continue}break}if(a.child===o.child){for(o=a.child;o;){if(o===n)return ft(a),e;if(o===i)return ft(a),t;o=o.sibling}throw Error(r(188))}if(n.return!==i.return)n=a,i=o;else{for(var s=!1,c=a.child;c;){if(c===n){s=!0,n=a,i=o;break}if(c===i){s=!0,i=a,n=o;break}c=c.sibling}if(!s){for(c=o.child;c;){if(c===n){s=!0,n=o,i=a;break}if(c===i){s=!0,i=o,n=a;break}c=c.sibling}if(!s)throw Error(r(189))}}if(n.alternate!==i)throw Error(r(190))}if(n.tag!==3)throw Error(r(188));return n.stateNode.current===n?e:t}function mt(e){return e=pt(e),e===null?null:ht(e)}function ht(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=ht(e);if(t!==null)return t;e=e.sibling}return null}var gt=n.unstable_scheduleCallback,_t=n.unstable_cancelCallback,vt=n.unstable_shouldYield,yt=n.unstable_requestPaint,P=n.unstable_now,bt=n.unstable_getCurrentPriorityLevel,xt=n.unstable_ImmediatePriority,St=n.unstable_UserBlockingPriority,Ct=n.unstable_NormalPriority,wt=n.unstable_LowPriority,Tt=n.unstable_IdlePriority,Et=null,Dt=null;function Ot(e){if(Dt&&typeof Dt.onCommitFiberRoot==`function`)try{Dt.onCommitFiberRoot(Et,e,void 0,(e.current.flags&128)==128)}catch{}}var kt=Math.clz32?Math.clz32:Mt,At=Math.log,jt=Math.LN2;function Mt(e){return e>>>=0,e===0?32:31-(At(e)/jt|0)|0}var Nt=64,Pt=4194304;function Ft(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function It(e,t){var n=e.pendingLanes;if(n===0)return 0;var r=0,i=e.suspendedLanes,a=e.pingedLanes,o=n&268435455;if(o!==0){var s=o&~i;s===0?(a&=o,a!==0&&(r=Ft(a))):r=Ft(s)}else o=n&~i,o===0?a!==0&&(r=Ft(a)):r=Ft(o);if(r===0)return 0;if(t!==0&&t!==r&&(t&i)===0&&(i=r&-r,a=t&-t,i>=a||i===16&&a&4194240))return t;if(r&4&&(r|=n&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=r;0<t;)n=31-kt(t),i=1<<n,r|=e[n],t&=~i;return r}function Lt(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Rt(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes;0<a;){var o=31-kt(a),s=1<<o,c=i[o];c===-1?((s&n)===0||(s&r)!==0)&&(i[o]=Lt(s,t)):c<=t&&(e.expiredLanes|=s),a&=~s}}function zt(e){return e=e.pendingLanes&-1073741825,e===0?e&1073741824?1073741824:0:e}function Bt(){var e=Nt;return Nt<<=1,!(Nt&4194240)&&(Nt=64),e}function Vt(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Ht(e,t,n){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-kt(t),e[t]=n}function Ut(e,t){var n=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<n;){var i=31-kt(n),a=1<<i;t[i]=0,r[i]=-1,e[i]=-1,n&=~a}}function Wt(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-kt(n),i=1<<r;i&t|e[r]&t&&(e[r]|=t),n&=~i}}var F=0;function Gt(e){return e&=-e,1<e?4<e?e&268435455?16:536870912:4:1}var Kt,qt,Jt,Yt,Xt,Zt=!1,Qt=[],$t=null,en=null,tn=null,nn=new Map,rn=new Map,an=[],on=`mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit`.split(` `);function sn(e,t){switch(e){case`focusin`:case`focusout`:$t=null;break;case`dragenter`:case`dragleave`:en=null;break;case`mouseover`:case`mouseout`:tn=null;break;case`pointerover`:case`pointerout`:nn.delete(t.pointerId);break;case`gotpointercapture`:case`lostpointercapture`:rn.delete(t.pointerId)}}function cn(e,t,n,r,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:a,targetContainers:[i]},t!==null&&(t=Hi(t),t!==null&&qt(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function ln(e,t,n,r,i){switch(t){case`focusin`:return $t=cn($t,e,t,n,r,i),!0;case`dragenter`:return en=cn(en,e,t,n,r,i),!0;case`mouseover`:return tn=cn(tn,e,t,n,r,i),!0;case`pointerover`:var a=i.pointerId;return nn.set(a,cn(nn.get(a)||null,e,t,n,r,i)),!0;case`gotpointercapture`:return a=i.pointerId,rn.set(a,cn(rn.get(a)||null,e,t,n,r,i)),!0}return!1}function un(e){var t=Vi(e.target);if(t!==null){var n=ut(t);if(n!==null){if(t=n.tag,t===13){if(t=dt(n),t!==null){e.blockedOn=t,Xt(e.priority,function(){Jt(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function dn(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Sn(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);Ve=r,n.target.dispatchEvent(r),Ve=null}else return t=Hi(n),t!==null&&qt(t),e.blockedOn=n,!1;t.shift()}return!0}function fn(e,t,n){dn(e)&&n.delete(t)}function pn(){Zt=!1,$t!==null&&dn($t)&&($t=null),en!==null&&dn(en)&&(en=null),tn!==null&&dn(tn)&&(tn=null),nn.forEach(fn),rn.forEach(fn)}function mn(e,t){e.blockedOn===t&&(e.blockedOn=null,Zt||(Zt=!0,n.unstable_scheduleCallback(n.unstable_NormalPriority,pn)))}function hn(e){function t(t){return mn(t,e)}if(0<Qt.length){mn(Qt[0],e);for(var n=1;n<Qt.length;n++){var r=Qt[n];r.blockedOn===e&&(r.blockedOn=null)}}for($t!==null&&mn($t,e),en!==null&&mn(en,e),tn!==null&&mn(tn,e),nn.forEach(t),rn.forEach(t),n=0;n<an.length;n++)r=an[n],r.blockedOn===e&&(r.blockedOn=null);for(;0<an.length&&(n=an[0],n.blockedOn===null);)un(n),n.blockedOn===null&&an.shift()}var gn=x.ReactCurrentBatchConfig,_n=!0;function vn(e,t,n,r){var i=F,a=gn.transition;gn.transition=null;try{F=1,bn(e,t,n,r)}finally{F=i,gn.transition=a}}function yn(e,t,n,r){var i=F,a=gn.transition;gn.transition=null;try{F=4,bn(e,t,n,r)}finally{F=i,gn.transition=a}}function bn(e,t,n,r){if(_n){var i=Sn(e,t,n,r);if(i===null)pi(e,t,r,xn,n),sn(e,r);else if(ln(i,e,t,n,r))r.stopPropagation();else if(sn(e,r),t&4&&-1<on.indexOf(e)){for(;i!==null;){var a=Hi(i);if(a!==null&&Kt(a),a=Sn(e,t,n,r),a===null&&pi(e,t,r,xn,n),a===i)break;i=a}i!==null&&r.stopPropagation()}else pi(e,t,r,null,n)}}var xn=null;function Sn(e,t,n,r){if(xn=null,e=He(r),e=Vi(e),e!==null)if(t=ut(e),t===null)e=null;else if(n=t.tag,n===13){if(e=dt(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return xn=e,null}function Cn(e){switch(e){case`cancel`:case`click`:case`close`:case`contextmenu`:case`copy`:case`cut`:case`auxclick`:case`dblclick`:case`dragend`:case`dragstart`:case`drop`:case`focusin`:case`focusout`:case`input`:case`invalid`:case`keydown`:case`keypress`:case`keyup`:case`mousedown`:case`mouseup`:case`paste`:case`pause`:case`play`:case`pointercancel`:case`pointerdown`:case`pointerup`:case`ratechange`:case`reset`:case`resize`:case`seeked`:case`submit`:case`touchcancel`:case`touchend`:case`touchstart`:case`volumechange`:case`change`:case`selectionchange`:case`textInput`:case`compositionstart`:case`compositionend`:case`compositionupdate`:case`beforeblur`:case`afterblur`:case`beforeinput`:case`blur`:case`fullscreenchange`:case`focus`:case`hashchange`:case`popstate`:case`select`:case`selectstart`:return 1;case`drag`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`mousemove`:case`mouseout`:case`mouseover`:case`pointermove`:case`pointerout`:case`pointerover`:case`scroll`:case`toggle`:case`touchmove`:case`wheel`:case`mouseenter`:case`mouseleave`:case`pointerenter`:case`pointerleave`:return 4;case`message`:switch(bt()){case xt:return 1;case St:return 4;case Ct:case wt:return 16;case Tt:return 536870912;default:return 16}default:return 16}}var wn=null,Tn=null,En=null;function Dn(){if(En)return En;var e,t=Tn,n=t.length,r,i=`value`in wn?wn.value:wn.textContent,a=i.length;for(e=0;e<n&&t[e]===i[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===i[a-r];r++);return En=i.slice(e,1<r?1-r:void 0)}function On(e){var t=e.keyCode;return`charCode`in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function kn(){return!0}function An(){return!1}function I(e){function t(t,n,r,i,a){for(var o in this._reactName=t,this._targetInst=r,this.type=n,this.nativeEvent=i,this.target=a,this.currentTarget=null,e)e.hasOwnProperty(o)&&(t=e[o],this[o]=t?t(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented==null?!1===i.returnValue:i.defaultPrevented)?kn:An,this.isPropagationStopped=An,this}return N(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!=`unknown`&&(e.returnValue=!1),this.isDefaultPrevented=kn)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!=`unknown`&&(e.cancelBubble=!0),this.isPropagationStopped=kn)},persist:function(){},isPersistent:kn}),t}var jn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},L=I(jn),Mn=N({},jn,{view:0,detail:0}),Nn=I(Mn),Pn,Fn,In,Ln=N({},Mn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Jn,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return`movementX`in e?e.movementX:(e!==In&&(In&&e.type===`mousemove`?(Pn=e.screenX-In.screenX,Fn=e.screenY-In.screenY):Fn=Pn=0,In=e),Pn)},movementY:function(e){return`movementY`in e?e.movementY:Fn}}),Rn=I(Ln),zn=I(N({},Ln,{dataTransfer:0})),Bn=I(N({},Mn,{relatedTarget:0})),Vn=I(N({},jn,{animationName:0,elapsedTime:0,pseudoElement:0})),Hn=I(N({},jn,{clipboardData:function(e){return`clipboardData`in e?e.clipboardData:window.clipboardData}})),Un=I(N({},jn,{data:0})),Wn={Esc:`Escape`,Spacebar:` `,Left:`ArrowLeft`,Up:`ArrowUp`,Right:`ArrowRight`,Down:`ArrowDown`,Del:`Delete`,Win:`OS`,Menu:`ContextMenu`,Apps:`ContextMenu`,Scroll:`ScrollLock`,MozPrintableKey:`Unidentified`},Gn={8:`Backspace`,9:`Tab`,12:`Clear`,13:`Enter`,16:`Shift`,17:`Control`,18:`Alt`,19:`Pause`,20:`CapsLock`,27:`Escape`,32:` `,33:`PageUp`,34:`PageDown`,35:`End`,36:`Home`,37:`ArrowLeft`,38:`ArrowUp`,39:`ArrowRight`,40:`ArrowDown`,45:`Insert`,46:`Delete`,112:`F1`,113:`F2`,114:`F3`,115:`F4`,116:`F5`,117:`F6`,118:`F7`,119:`F8`,120:`F9`,121:`F10`,122:`F11`,123:`F12`,144:`NumLock`,145:`ScrollLock`,224:`Meta`},Kn={Alt:`altKey`,Control:`ctrlKey`,Meta:`metaKey`,Shift:`shiftKey`};function qn(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Kn[e])?!!t[e]:!1}function Jn(){return qn}var Yn=I(N({},Mn,{key:function(e){if(e.key){var t=Wn[e.key]||e.key;if(t!==`Unidentified`)return t}return e.type===`keypress`?(e=On(e),e===13?`Enter`:String.fromCharCode(e)):e.type===`keydown`||e.type===`keyup`?Gn[e.keyCode]||`Unidentified`:``},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Jn,charCode:function(e){return e.type===`keypress`?On(e):0},keyCode:function(e){return e.type===`keydown`||e.type===`keyup`?e.keyCode:0},which:function(e){return e.type===`keypress`?On(e):e.type===`keydown`||e.type===`keyup`?e.keyCode:0}})),Xn=I(N({},Ln,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0})),Zn=I(N({},Mn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Jn})),Qn=I(N({},jn,{propertyName:0,elapsedTime:0,pseudoElement:0})),$n=I(N({},Ln,{deltaX:function(e){return`deltaX`in e?e.deltaX:`wheelDeltaX`in e?-e.wheelDeltaX:0},deltaY:function(e){return`deltaY`in e?e.deltaY:`wheelDeltaY`in e?-e.wheelDeltaY:`wheelDelta`in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0})),er=[9,13,27,32],tr=c&&`CompositionEvent`in window,nr=null;c&&`documentMode`in document&&(nr=document.documentMode);var rr=c&&`TextEvent`in window&&!nr,ir=c&&(!tr||nr&&8<nr&&11>=nr),ar=` `,or=!1;function sr(e,t){switch(e){case`keyup`:return er.indexOf(t.keyCode)!==-1;case`keydown`:return t.keyCode!==229;case`keypress`:case`mousedown`:case`focusout`:return!0;default:return!1}}function cr(e){return e=e.detail,typeof e==`object`&&`data`in e?e.data:null}var lr=!1;function ur(e,t){switch(e){case`compositionend`:return cr(t);case`keypress`:return t.which===32?(or=!0,ar):null;case`textInput`:return e=t.data,e===ar&&or?null:e;default:return null}}function dr(e,t){if(lr)return e===`compositionend`||!tr&&sr(e,t)?(e=Dn(),En=Tn=wn=null,lr=!1,e):null;switch(e){case`paste`:return null;case`keypress`:if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case`compositionend`:return ir&&t.locale!==`ko`?null:t.data;default:return null}}var fr={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function pr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t===`input`?!!fr[e.type]:t===`textarea`}function mr(e,t,n,r){qe(r),t=hi(t,`onChange`),0<t.length&&(n=new L(`onChange`,`change`,null,n,r),e.push({event:n,listeners:t}))}var hr=null,gr=null;function _r(e){ci(e,0)}function vr(e){if(he(Ui(e)))return e}function yr(e,t){if(e===`change`)return t}var br=!1;if(c){var xr;if(c){var Sr=`oninput`in document;if(!Sr){var Cr=document.createElement(`div`);Cr.setAttribute(`oninput`,`return;`),Sr=typeof Cr.oninput==`function`}xr=Sr}else xr=!1;br=xr&&(!document.documentMode||9<document.documentMode)}function wr(){hr&&(hr.detachEvent(`onpropertychange`,Tr),gr=hr=null)}function Tr(e){if(e.propertyName===`value`&&vr(gr)){var t=[];mr(t,gr,e,He(e)),Qe(_r,t)}}function Er(e,t,n){e===`focusin`?(wr(),hr=t,gr=n,hr.attachEvent(`onpropertychange`,Tr)):e===`focusout`&&wr()}function Dr(e){if(e===`selectionchange`||e===`keyup`||e===`keydown`)return vr(gr)}function Or(e,t){if(e===`click`)return vr(t)}function kr(e,t){if(e===`input`||e===`change`)return vr(t)}function Ar(e,t){return e===t&&(e!==0||1/e==1/t)||e!==e&&t!==t}var jr=typeof Object.is==`function`?Object.is:Ar;function Mr(e,t){if(jr(e,t))return!0;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!l.call(t,i)||!jr(e[i],t[i]))return!1}return!0}function Nr(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Pr(e,t){var n=Nr(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}a:{for(;n;){if(n.nextSibling){n=n.nextSibling;break a}n=n.parentNode}n=void 0}n=Nr(n)}}function Fr(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Fr(e,t.parentNode):`contains`in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Ir(){for(var e=window,t=ge();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href==`string`}catch{n=!1}if(n)e=t.contentWindow;else break;t=ge(e.document)}return t}function Lr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t===`input`&&(e.type===`text`||e.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}function Rr(e){var t=Ir(),n=e.focusedElem,r=e.selectionRange;if(t!==n&&n&&n.ownerDocument&&Fr(n.ownerDocument.documentElement,n)){if(r!==null&&Lr(n)){if(t=r.start,e=r.end,e===void 0&&(e=t),`selectionStart`in n)n.selectionStart=t,n.selectionEnd=Math.min(e,n.value.length);else if(e=(t=n.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var i=n.textContent.length,a=Math.min(r.start,i);r=r.end===void 0?a:Math.min(r.end,i),!e.extend&&a>r&&(i=r,r=a,a=i),i=Pr(n,a);var o=Pr(n,r);i&&o&&(e.rangeCount!==1||e.anchorNode!==i.node||e.anchorOffset!==i.offset||e.focusNode!==o.node||e.focusOffset!==o.offset)&&(t=t.createRange(),t.setStart(i.node,i.offset),e.removeAllRanges(),a>r?(e.addRange(t),e.extend(o.node,o.offset)):(t.setEnd(o.node,o.offset),e.addRange(t)))}}for(t=[],e=n;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof n.focus==`function`&&n.focus(),n=0;n<t.length;n++)e=t[n],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var zr=c&&`documentMode`in document&&11>=document.documentMode,Br=null,Vr=null,Hr=null,Ur=!1;function Wr(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Ur||Br==null||Br!==ge(r)||(r=Br,`selectionStart`in r&&Lr(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Hr&&Mr(Hr,r)||(Hr=r,r=hi(Vr,`onSelect`),0<r.length&&(t=new L(`onSelect`,`select`,null,t,n),e.push({event:t,listeners:r}),t.target=Br)))}function Gr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n[`Webkit`+e]=`webkit`+t,n[`Moz`+e]=`moz`+t,n}var Kr={animationend:Gr(`Animation`,`AnimationEnd`),animationiteration:Gr(`Animation`,`AnimationIteration`),animationstart:Gr(`Animation`,`AnimationStart`),transitionend:Gr(`Transition`,`TransitionEnd`)},qr={},Jr={};c&&(Jr=document.createElement(`div`).style,`AnimationEvent`in window||(delete Kr.animationend.animation,delete Kr.animationiteration.animation,delete Kr.animationstart.animation),`TransitionEvent`in window||delete Kr.transitionend.transition);function Yr(e){if(qr[e])return qr[e];if(!Kr[e])return e;var t=Kr[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in Jr)return qr[e]=t[n];return e}var Xr=Yr(`animationend`),Zr=Yr(`animationiteration`),Qr=Yr(`animationstart`),$r=Yr(`transitionend`),ei=new Map,ti=`abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);function ni(e,t){ei.set(e,t),o(t,[e])}for(var ri=0;ri<ti.length;ri++){var ii=ti[ri];ni(ii.toLowerCase(),`on`+(ii[0].toUpperCase()+ii.slice(1)))}ni(Xr,`onAnimationEnd`),ni(Zr,`onAnimationIteration`),ni(Qr,`onAnimationStart`),ni(`dblclick`,`onDoubleClick`),ni(`focusin`,`onFocus`),ni(`focusout`,`onBlur`),ni($r,`onTransitionEnd`),s(`onMouseEnter`,[`mouseout`,`mouseover`]),s(`onMouseLeave`,[`mouseout`,`mouseover`]),s(`onPointerEnter`,[`pointerout`,`pointerover`]),s(`onPointerLeave`,[`pointerout`,`pointerover`]),o(`onChange`,`change click focusin focusout input keydown keyup selectionchange`.split(` `)),o(`onSelect`,`focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)),o(`onBeforeInput`,[`compositionend`,`keypress`,`textInput`,`paste`]),o(`onCompositionEnd`,`compositionend focusout keydown keypress keyup mousedown`.split(` `)),o(`onCompositionStart`,`compositionstart focusout keydown keypress keyup mousedown`.split(` `)),o(`onCompositionUpdate`,`compositionupdate focusout keydown keypress keyup mousedown`.split(` `));var ai=`abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),oi=new Set(`cancel close invalid load scroll toggle`.split(` `).concat(ai));function si(e,t,n){var r=e.type||`unknown-event`;e.currentTarget=n,lt(r,t,void 0,e),e.currentTarget=null}function ci(e,t){t=(t&4)!=0;for(var n=0;n<e.length;n++){var r=e[n],i=r.event;r=r.listeners;a:{var a=void 0;if(t)for(var o=r.length-1;0<=o;o--){var s=r[o],c=s.instance,l=s.currentTarget;if(s=s.listener,c!==a&&i.isPropagationStopped())break a;si(i,s,l),a=c}else for(o=0;o<r.length;o++){if(s=r[o],c=s.instance,l=s.currentTarget,s=s.listener,c!==a&&i.isPropagationStopped())break a;si(i,s,l),a=c}}}if(at)throw e=ot,at=!1,ot=null,e}function R(e,t){var n=t[Ri];n===void 0&&(n=t[Ri]=new Set);var r=e+`__bubble`;n.has(r)||(fi(t,e,2,!1),n.add(r))}function li(e,t,n){var r=0;t&&(r|=4),fi(n,e,r,t)}var ui=`_reactListening`+Math.random().toString(36).slice(2);function di(e){if(!e[ui]){e[ui]=!0,i.forEach(function(t){t!==`selectionchange`&&(oi.has(t)||li(t,!1,e),li(t,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[ui]||(t[ui]=!0,li(`selectionchange`,!1,t))}}function fi(e,t,n,r){switch(Cn(t)){case 1:var i=vn;break;case 4:i=yn;break;default:i=bn}n=i.bind(null,t,n,e),i=void 0,!et||t!==`touchstart`&&t!==`touchmove`&&t!==`wheel`||(i=!0),r?i===void 0?e.addEventListener(t,n,!0):e.addEventListener(t,n,{capture:!0,passive:i}):i===void 0?e.addEventListener(t,n,!1):e.addEventListener(t,n,{passive:i})}function pi(e,t,n,r,i){var a=r;if(!(t&1)&&!(t&2)&&r!==null)a:for(;;){if(r===null)return;var o=r.tag;if(o===3||o===4){var s=r.stateNode.containerInfo;if(s===i||s.nodeType===8&&s.parentNode===i)break;if(o===4)for(o=r.return;o!==null;){var c=o.tag;if((c===3||c===4)&&(c=o.stateNode.containerInfo,c===i||c.nodeType===8&&c.parentNode===i))return;o=o.return}for(;s!==null;){if(o=Vi(s),o===null)return;if(c=o.tag,c===5||c===6){r=a=o;continue a}s=s.parentNode}}r=r.return}Qe(function(){var r=a,i=He(n),o=[];a:{var s=ei.get(e);if(s!==void 0){var c=L,l=e;switch(e){case`keypress`:if(On(n)===0)break a;case`keydown`:case`keyup`:c=Yn;break;case`focusin`:l=`focus`,c=Bn;break;case`focusout`:l=`blur`,c=Bn;break;case`beforeblur`:case`afterblur`:c=Bn;break;case`click`:if(n.button===2)break a;case`auxclick`:case`dblclick`:case`mousedown`:case`mousemove`:case`mouseup`:case`mouseout`:case`mouseover`:case`contextmenu`:c=Rn;break;case`drag`:case`dragend`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`dragstart`:case`drop`:c=zn;break;case`touchcancel`:case`touchend`:case`touchmove`:case`touchstart`:c=Zn;break;case Xr:case Zr:case Qr:c=Vn;break;case $r:c=Qn;break;case`scroll`:c=Nn;break;case`wheel`:c=$n;break;case`copy`:case`cut`:case`paste`:c=Hn;break;case`gotpointercapture`:case`lostpointercapture`:case`pointercancel`:case`pointerdown`:case`pointermove`:case`pointerout`:case`pointerover`:case`pointerup`:c=Xn}var u=(t&4)!=0,d=!u&&e===`scroll`,f=u?s===null?null:s+`Capture`:s;u=[];for(var p=r,m;p!==null;){m=p;var h=m.stateNode;if(m.tag===5&&h!==null&&(m=h,f!==null&&(h=$e(p,f),h!=null&&u.push(mi(p,h,m)))),d)break;p=p.return}0<u.length&&(s=new c(s,l,null,n,i),o.push({event:s,listeners:u}))}}if(!(t&7)){a:{if(s=e===`mouseover`||e===`pointerover`,c=e===`mouseout`||e===`pointerout`,s&&n!==Ve&&(l=n.relatedTarget||n.fromElement)&&(Vi(l)||l[Li]))break a;if((c||s)&&(s=i.window===i?i:(s=i.ownerDocument)?s.defaultView||s.parentWindow:window,c?(l=n.relatedTarget||n.toElement,c=r,l=l?Vi(l):null,l!==null&&(d=ut(l),l!==d||l.tag!==5&&l.tag!==6)&&(l=null)):(c=null,l=r),c!==l)){if(u=Rn,h=`onMouseLeave`,f=`onMouseEnter`,p=`mouse`,(e===`pointerout`||e===`pointerover`)&&(u=Xn,h=`onPointerLeave`,f=`onPointerEnter`,p=`pointer`),d=c==null?s:Ui(c),m=l==null?s:Ui(l),s=new u(h,p+`leave`,c,n,i),s.target=d,s.relatedTarget=m,h=null,Vi(i)===r&&(u=new u(f,p+`enter`,l,n,i),u.target=m,u.relatedTarget=d,h=u),d=h,c&&l)b:{for(u=c,f=l,p=0,m=u;m;m=gi(m))p++;for(m=0,h=f;h;h=gi(h))m++;for(;0<p-m;)u=gi(u),p--;for(;0<m-p;)f=gi(f),m--;for(;p--;){if(u===f||f!==null&&u===f.alternate)break b;u=gi(u),f=gi(f)}u=null}else u=null;c!==null&&_i(o,s,c,u,!1),l!==null&&d!==null&&_i(o,d,l,u,!0)}}a:{if(s=r?Ui(r):window,c=s.nodeName&&s.nodeName.toLowerCase(),c===`select`||c===`input`&&s.type===`file`)var g=yr;else if(pr(s))if(br)g=kr;else{g=Dr;var _=Er}else (c=s.nodeName)&&c.toLowerCase()===`input`&&(s.type===`checkbox`||s.type===`radio`)&&(g=Or);if(g&&=g(e,r)){mr(o,g,n,i);break a}_&&_(e,s,r),e===`focusout`&&(_=s._wrapperState)&&_.controlled&&s.type===`number`&&Se(s,`number`,s.value)}switch(_=r?Ui(r):window,e){case`focusin`:(pr(_)||_.contentEditable===`true`)&&(Br=_,Vr=r,Hr=null);break;case`focusout`:Hr=Vr=Br=null;break;case`mousedown`:Ur=!0;break;case`contextmenu`:case`mouseup`:case`dragend`:Ur=!1,Wr(o,n,i);break;case`selectionchange`:if(zr)break;case`keydown`:case`keyup`:Wr(o,n,i)}var v;if(tr)b:{switch(e){case`compositionstart`:var y=`onCompositionStart`;break b;case`compositionend`:y=`onCompositionEnd`;break b;case`compositionupdate`:y=`onCompositionUpdate`;break b}y=void 0}else lr?sr(e,n)&&(y=`onCompositionEnd`):e===`keydown`&&n.keyCode===229&&(y=`onCompositionStart`);y&&(ir&&n.locale!==`ko`&&(lr||y!==`onCompositionStart`?y===`onCompositionEnd`&&lr&&(v=Dn()):(wn=i,Tn=`value`in wn?wn.value:wn.textContent,lr=!0)),_=hi(r,y),0<_.length&&(y=new Un(y,e,null,n,i),o.push({event:y,listeners:_}),v?y.data=v:(v=cr(n),v!==null&&(y.data=v)))),(v=rr?ur(e,n):dr(e,n))&&(r=hi(r,`onBeforeInput`),0<r.length&&(i=new Un(`onBeforeInput`,`beforeinput`,null,n,i),o.push({event:i,listeners:r}),i.data=v))}ci(o,t)})}function mi(e,t,n){return{instance:e,listener:t,currentTarget:n}}function hi(e,t){for(var n=t+`Capture`,r=[];e!==null;){var i=e,a=i.stateNode;i.tag===5&&a!==null&&(i=a,a=$e(e,n),a!=null&&r.unshift(mi(e,a,i)),a=$e(e,t),a!=null&&r.push(mi(e,a,i))),e=e.return}return r}function gi(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function _i(e,t,n,r,i){for(var a=t._reactName,o=[];n!==null&&n!==r;){var s=n,c=s.alternate,l=s.stateNode;if(c!==null&&c===r)break;s.tag===5&&l!==null&&(s=l,i?(c=$e(n,a),c!=null&&o.unshift(mi(n,c,s))):i||(c=$e(n,a),c!=null&&o.push(mi(n,c,s)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var vi=/\r\n?/g,yi=/\u0000|\uFFFD/g;function bi(e){return(typeof e==`string`?e:``+e).replace(vi,`
`).replace(yi,``)}function xi(e,t,n){if(t=bi(t),bi(e)!==t&&n)throw Error(r(425))}function Si(){}var Ci=null,wi=null;function Ti(e,t){return e===`textarea`||e===`noscript`||typeof t.children==`string`||typeof t.children==`number`||typeof t.dangerouslySetInnerHTML==`object`&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Ei=typeof setTimeout==`function`?setTimeout:void 0,Di=typeof clearTimeout==`function`?clearTimeout:void 0,Oi=typeof Promise==`function`?Promise:void 0,ki=typeof queueMicrotask==`function`?queueMicrotask:Oi===void 0?Ei:function(e){return Oi.resolve(null).then(e).catch(Ai)};function Ai(e){setTimeout(function(){throw e})}function ji(e,t){var n=t,r=0;do{var i=n.nextSibling;if(e.removeChild(n),i&&i.nodeType===8)if(n=i.data,n===`/$`){if(r===0){e.removeChild(i),hn(t);return}r--}else n!==`$`&&n!==`$?`&&n!==`$!`||r++;n=i}while(n);hn(t)}function Mi(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t===`$`||t===`$!`||t===`$?`)break;if(t===`/$`)return null}}return e}function Ni(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`$`||n===`$!`||n===`$?`){if(t===0)return e;t--}else n===`/$`&&t++}e=e.previousSibling}return null}var Pi=Math.random().toString(36).slice(2),Fi=`__reactFiber$`+Pi,Ii=`__reactProps$`+Pi,Li=`__reactContainer$`+Pi,Ri=`__reactEvents$`+Pi,zi=`__reactListeners$`+Pi,Bi=`__reactHandles$`+Pi;function Vi(e){var t=e[Fi];if(t)return t;for(var n=e.parentNode;n;){if(t=n[Li]||n[Fi]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Ni(e);e!==null;){if(n=e[Fi])return n;e=Ni(e)}return t}e=n,n=e.parentNode}return null}function Hi(e){return e=e[Fi]||e[Li],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Ui(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(r(33))}function Wi(e){return e[Ii]||null}var Gi=[],Ki=-1;function qi(e){return{current:e}}function z(e){0>Ki||(e.current=Gi[Ki],Gi[Ki]=null,Ki--)}function B(e,t){Ki++,Gi[Ki]=e.current,e.current=t}var Ji={},Yi=qi(Ji),Xi=qi(!1),Zi=Ji;function Qi(e,t){var n=e.type.contextTypes;if(!n)return Ji;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var i={},a;for(a in n)i[a]=t[a];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=i),i}function $i(e){return e=e.childContextTypes,e!=null}function ea(){z(Xi),z(Yi)}function ta(e,t,n){if(Yi.current!==Ji)throw Error(r(168));B(Yi,t),B(Xi,n)}function na(e,t,n){var i=e.stateNode;if(t=t.childContextTypes,typeof i.getChildContext!=`function`)return n;for(var a in i=i.getChildContext(),i)if(!(a in t))throw Error(r(108,ue(e)||`Unknown`,a));return N({},n,i)}function ra(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Ji,Zi=Yi.current,B(Yi,e),B(Xi,Xi.current),!0}function ia(e,t,n){var i=e.stateNode;if(!i)throw Error(r(169));n?(e=na(e,t,Zi),i.__reactInternalMemoizedMergedChildContext=e,z(Xi),z(Yi),B(Yi,e)):z(Xi),B(Xi,n)}var aa=null,oa=!1,sa=!1;function ca(e){aa===null?aa=[e]:aa.push(e)}function la(e){oa=!0,ca(e)}function ua(){if(!sa&&aa!==null){sa=!0;var e=0,t=F;try{var n=aa;for(F=1;e<n.length;e++){var r=n[e];do r=r(!0);while(r!==null)}aa=null,oa=!1}catch(t){throw aa!==null&&(aa=aa.slice(e+1)),gt(xt,ua),t}finally{F=t,sa=!1}}return null}var da=[],fa=0,pa=null,ma=0,ha=[],ga=0,_a=null,va=1,ya=``;function ba(e,t){da[fa++]=ma,da[fa++]=pa,pa=e,ma=t}function xa(e,t,n){ha[ga++]=va,ha[ga++]=ya,ha[ga++]=_a,_a=e;var r=va;e=ya;var i=32-kt(r)-1;r&=~(1<<i),n+=1;var a=32-kt(t)+i;if(30<a){var o=i-i%5;a=(r&(1<<o)-1).toString(32),r>>=o,i-=o,va=1<<32-kt(t)+i|n<<i|r,ya=a+e}else va=1<<a|n<<i|r,ya=e}function Sa(e){e.return!==null&&(ba(e,1),xa(e,1,0))}function Ca(e){for(;e===pa;)pa=da[--fa],da[fa]=null,ma=da[--fa],da[fa]=null;for(;e===_a;)_a=ha[--ga],ha[ga]=null,ya=ha[--ga],ha[ga]=null,va=ha[--ga],ha[ga]=null}var wa=null,Ta=null,V=!1,Ea=null;function Da(e,t){var n=Yl(5,null,null,0);n.elementType=`DELETED`,n.stateNode=t,n.return=e,t=e.deletions,t===null?(e.deletions=[n],e.flags|=16):t.push(n)}function Oa(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t===null?!1:(e.stateNode=t,wa=e,Ta=Mi(t.firstChild),!0);case 6:return t=e.pendingProps===``||t.nodeType!==3?null:t,t===null?!1:(e.stateNode=t,wa=e,Ta=null,!0);case 13:return t=t.nodeType===8?t:null,t===null?!1:(n=_a===null?null:{id:va,overflow:ya},e.memoizedState={dehydrated:t,treeContext:n,retryLane:1073741824},n=Yl(18,null,null,0),n.stateNode=t,n.return=e,e.child=n,wa=e,Ta=null,!0);default:return!1}}function ka(e){return(e.mode&1)!=0&&(e.flags&128)==0}function Aa(e){if(V){var t=Ta;if(t){var n=t;if(!Oa(e,t)){if(ka(e))throw Error(r(418));t=Mi(n.nextSibling);var i=wa;t&&Oa(e,t)?Da(i,n):(e.flags=e.flags&-4097|2,V=!1,wa=e)}}else{if(ka(e))throw Error(r(418));e.flags=e.flags&-4097|2,V=!1,wa=e}}}function ja(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;wa=e}function Ma(e){if(e!==wa)return!1;if(!V)return ja(e),V=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!==`head`&&t!==`body`&&!Ti(e.type,e.memoizedProps)),t&&=Ta){if(ka(e))throw Na(),Error(r(418));for(;t;)Da(e,t),t=Mi(t.nextSibling)}if(ja(e),e.tag===13){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(r(317));a:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`/$`){if(t===0){Ta=Mi(e.nextSibling);break a}t--}else n!==`$`&&n!==`$!`&&n!==`$?`||t++}e=e.nextSibling}Ta=null}}else Ta=wa?Mi(e.stateNode.nextSibling):null;return!0}function Na(){for(var e=Ta;e;)e=Mi(e.nextSibling)}function Pa(){Ta=wa=null,V=!1}function Fa(e){Ea===null?Ea=[e]:Ea.push(e)}var Ia=x.ReactCurrentBatchConfig;function La(e,t,n){if(e=n.ref,e!==null&&typeof e!=`function`&&typeof e!=`object`){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(r(309));var i=n.stateNode}if(!i)throw Error(r(147,e));var a=i,o=``+e;return t!==null&&t.ref!==null&&typeof t.ref==`function`&&t.ref._stringRef===o?t.ref:(t=function(e){var t=a.refs;e===null?delete t[o]:t[o]=e},t._stringRef=o,t)}if(typeof e!=`string`)throw Error(r(284));if(!n._owner)throw Error(r(290,e))}return e}function Ra(e,t){throw e=Object.prototype.toString.call(t),Error(r(31,e===`[object Object]`?`object with keys {`+Object.keys(t).join(`, `)+`}`:e))}function za(e){var t=e._init;return t(e._payload)}function Ba(e){function t(t,n){if(e){var r=t.deletions;r===null?(t.deletions=[n],t.flags|=16):r.push(n)}}function n(n,r){if(!e)return null;for(;r!==null;)t(n,r),r=r.sibling;return null}function i(e,t){for(e=new Map;t!==null;)t.key===null?e.set(t.index,t):e.set(t.key,t),t=t.sibling;return e}function a(e,t){return e=Ql(e,t),e.index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?(r=t.alternate,r===null?(t.flags|=2,n):(r=r.index,r<n?(t.flags|=2,n):r)):(t.flags|=1048576,n)}function s(t){return e&&t.alternate===null&&(t.flags|=2),t}function c(e,t,n,r){return t===null||t.tag!==6?(t=nu(n,e.mode,r),t.return=e,t):(t=a(t,n),t.return=e,t)}function l(e,t,n,r){var i=n.type;return i===w?d(e,t,n.props.children,r,n.key):t!==null&&(t.elementType===i||typeof i==`object`&&i&&i.$$typeof===j&&za(i)===t.type)?(r=a(t,n.props),r.ref=La(e,t,n),r.return=e,r):(r=$l(n.type,n.key,n.props,null,e.mode,r),r.ref=La(e,t,n),r.return=e,r)}function u(e,t,n,r){return t===null||t.tag!==4||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?(t=ru(n,e.mode,r),t.return=e,t):(t=a(t,n.children||[]),t.return=e,t)}function d(e,t,n,r,i){return t===null||t.tag!==7?(t=eu(n,e.mode,r,i),t.return=e,t):(t=a(t,n),t.return=e,t)}function f(e,t,n){if(typeof t==`string`&&t!==``||typeof t==`number`)return t=nu(``+t,e.mode,n),t.return=e,t;if(typeof t==`object`&&t){switch(t.$$typeof){case S:return n=$l(t.type,t.key,t.props,null,e.mode,n),n.ref=La(e,null,t),n.return=e,n;case C:return t=ru(t,e.mode,n),t.return=e,t;case j:var r=t._init;return f(e,r(t._payload),n)}if(Ce(t)||re(t))return t=eu(t,e.mode,n,null),t.return=e,t;Ra(e,t)}return null}function p(e,t,n,r){var i=t===null?null:t.key;if(typeof n==`string`&&n!==``||typeof n==`number`)return i===null?c(e,t,``+n,r):null;if(typeof n==`object`&&n){switch(n.$$typeof){case S:return n.key===i?l(e,t,n,r):null;case C:return n.key===i?u(e,t,n,r):null;case j:return i=n._init,p(e,t,i(n._payload),r)}if(Ce(n)||re(n))return i===null?d(e,t,n,r,null):null;Ra(e,n)}return null}function m(e,t,n,r,i){if(typeof r==`string`&&r!==``||typeof r==`number`)return e=e.get(n)||null,c(t,e,``+r,i);if(typeof r==`object`&&r){switch(r.$$typeof){case S:return e=e.get(r.key===null?n:r.key)||null,l(t,e,r,i);case C:return e=e.get(r.key===null?n:r.key)||null,u(t,e,r,i);case j:var a=r._init;return m(e,t,n,a(r._payload),i)}if(Ce(r)||re(r))return e=e.get(n)||null,d(t,e,r,i,null);Ra(t,r)}return null}function h(r,a,s,c){for(var l=null,u=null,d=a,h=a=0,g=null;d!==null&&h<s.length;h++){d.index>h?(g=d,d=null):g=d.sibling;var _=p(r,d,s[h],c);if(_===null){d===null&&(d=g);break}e&&d&&_.alternate===null&&t(r,d),a=o(_,a,h),u===null?l=_:u.sibling=_,u=_,d=g}if(h===s.length)return n(r,d),V&&ba(r,h),l;if(d===null){for(;h<s.length;h++)d=f(r,s[h],c),d!==null&&(a=o(d,a,h),u===null?l=d:u.sibling=d,u=d);return V&&ba(r,h),l}for(d=i(r,d);h<s.length;h++)g=m(d,r,h,s[h],c),g!==null&&(e&&g.alternate!==null&&d.delete(g.key===null?h:g.key),a=o(g,a,h),u===null?l=g:u.sibling=g,u=g);return e&&d.forEach(function(e){return t(r,e)}),V&&ba(r,h),l}function g(a,s,c,l){var u=re(c);if(typeof u!=`function`)throw Error(r(150));if(c=u.call(c),c==null)throw Error(r(151));for(var d=u=null,h=s,g=s=0,_=null,v=c.next();h!==null&&!v.done;g++,v=c.next()){h.index>g?(_=h,h=null):_=h.sibling;var y=p(a,h,v.value,l);if(y===null){h===null&&(h=_);break}e&&h&&y.alternate===null&&t(a,h),s=o(y,s,g),d===null?u=y:d.sibling=y,d=y,h=_}if(v.done)return n(a,h),V&&ba(a,g),u;if(h===null){for(;!v.done;g++,v=c.next())v=f(a,v.value,l),v!==null&&(s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return V&&ba(a,g),u}for(h=i(a,h);!v.done;g++,v=c.next())v=m(h,a,g,v.value,l),v!==null&&(e&&v.alternate!==null&&h.delete(v.key===null?g:v.key),s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return e&&h.forEach(function(e){return t(a,e)}),V&&ba(a,g),u}function _(e,r,i,o){if(typeof i==`object`&&i&&i.type===w&&i.key===null&&(i=i.props.children),typeof i==`object`&&i){switch(i.$$typeof){case S:a:{for(var c=i.key,l=r;l!==null;){if(l.key===c){if(c=i.type,c===w){if(l.tag===7){n(e,l.sibling),r=a(l,i.props.children),r.return=e,e=r;break a}}else if(l.elementType===c||typeof c==`object`&&c&&c.$$typeof===j&&za(c)===l.type){n(e,l.sibling),r=a(l,i.props),r.ref=La(e,l,i),r.return=e,e=r;break a}n(e,l);break}else t(e,l);l=l.sibling}i.type===w?(r=eu(i.props.children,e.mode,o,i.key),r.return=e,e=r):(o=$l(i.type,i.key,i.props,null,e.mode,o),o.ref=La(e,r,i),o.return=e,e=o)}return s(e);case C:a:{for(l=i.key;r!==null;){if(r.key===l)if(r.tag===4&&r.stateNode.containerInfo===i.containerInfo&&r.stateNode.implementation===i.implementation){n(e,r.sibling),r=a(r,i.children||[]),r.return=e,e=r;break a}else{n(e,r);break}else t(e,r);r=r.sibling}r=ru(i,e.mode,o),r.return=e,e=r}return s(e);case j:return l=i._init,_(e,r,l(i._payload),o)}if(Ce(i))return h(e,r,i,o);if(re(i))return g(e,r,i,o);Ra(e,i)}return typeof i==`string`&&i!==``||typeof i==`number`?(i=``+i,r!==null&&r.tag===6?(n(e,r.sibling),r=a(r,i),r.return=e,e=r):(n(e,r),r=nu(i,e.mode,o),r.return=e,e=r),s(e)):n(e,r)}return _}var Va=Ba(!0),Ha=Ba(!1),Ua=qi(null),Wa=null,Ga=null,Ka=null;function qa(){Ka=Ga=Wa=null}function Ja(e){var t=Ua.current;z(Ua),e._currentValue=t}function Ya(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)===t?r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t):(e.childLanes|=t,r!==null&&(r.childLanes|=t)),e===n)break;e=e.return}}function Xa(e,t){Wa=e,Ka=Ga=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&t)!==0&&(Fs=!0),e.firstContext=null)}function Za(e){var t=e._currentValue;if(Ka!==e)if(e={context:e,memoizedValue:t,next:null},Ga===null){if(Wa===null)throw Error(r(308));Ga=e,Wa.dependencies={lanes:0,firstContext:e}}else Ga=Ga.next=e;return t}var Qa=null;function $a(e){Qa===null?Qa=[e]:Qa.push(e)}function eo(e,t,n,r){var i=t.interleaved;return i===null?(n.next=n,$a(t)):(n.next=i.next,i.next=n),t.interleaved=n,to(e,r)}function to(e,t){e.lanes|=t;var n=e.alternate;for(n!==null&&(n.lanes|=t),n=e,e=e.return;e!==null;)e.childLanes|=t,n=e.alternate,n!==null&&(n.childLanes|=t),n=e,e=e.return;return n.tag===3?n.stateNode:null}var no=!1;function ro(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function io(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function ao(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function oo(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,J&2){var i=r.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),r.pending=t,to(e,n)}return i=r.interleaved,i===null?(t.next=t,$a(r)):(t.next=i.next,i.next=t),r.interleaved=t,to(e,n)}function so(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,n&4194240)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Wt(e,n)}}function co(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var o={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};a===null?i=a=o:a=a.next=o,n=n.next}while(n!==null);a===null?i=a=t:a=a.next=t}else i=a=t;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:r.shared,effects:r.effects},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}function lo(e,t,n,r){var i=e.updateQueue;no=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var c=s,l=c.next;c.next=null,o===null?a=l:o.next=l,o=c;var u=e.alternate;u!==null&&(u=u.updateQueue,s=u.lastBaseUpdate,s!==o&&(s===null?u.firstBaseUpdate=l:s.next=l,u.lastBaseUpdate=c))}if(a!==null){var d=i.baseState;o=0,u=l=c=null,s=a;do{var f=s.lane,p=s.eventTime;if((r&f)===f){u!==null&&(u=u.next={eventTime:p,lane:0,tag:s.tag,payload:s.payload,callback:s.callback,next:null});a:{var m=e,h=s;switch(f=t,p=n,h.tag){case 1:if(m=h.payload,typeof m==`function`){d=m.call(p,d,f);break a}d=m;break a;case 3:m.flags=m.flags&-65537|128;case 0:if(m=h.payload,f=typeof m==`function`?m.call(p,d,f):m,f==null)break a;d=N({},d,f);break a;case 2:no=!0}}s.callback!==null&&s.lane!==0&&(e.flags|=64,f=i.effects,f===null?i.effects=[s]:f.push(s))}else p={eventTime:p,lane:f,tag:s.tag,payload:s.payload,callback:s.callback,next:null},u===null?(l=u=p,c=d):u=u.next=p,o|=f;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;f=s,s=f.next,f.next=null,i.lastBaseUpdate=f,i.shared.pending=null}}while(1);if(u===null&&(c=d),i.baseState=c,i.firstBaseUpdate=l,i.lastBaseUpdate=u,t=i.shared.interleaved,t!==null){i=t;do o|=i.lane,i=i.next;while(i!==t)}else a===null&&(i.shared.lanes=0);Zc|=o,e.lanes=o,e.memoizedState=d}}function uo(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var i=e[t],a=i.callback;if(a!==null){if(i.callback=null,i=n,typeof a!=`function`)throw Error(r(191,a));a.call(i)}}}var fo={},po=qi(fo),mo=qi(fo),ho=qi(fo);function go(e){if(e===fo)throw Error(r(174));return e}function _o(e,t){switch(B(ho,t),B(mo,e),B(po,fo),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:Ae(null,``);break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=Ae(t,e)}z(po),B(po,t)}function vo(){z(po),z(mo),z(ho)}function yo(e){go(ho.current);var t=go(po.current),n=Ae(t,e.type);t!==n&&(B(mo,e),B(po,n))}function bo(e){mo.current===e&&(z(po),z(mo))}var H=qi(0);function xo(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data===`$?`||n.data===`$!`))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var So=[];function Co(){for(var e=0;e<So.length;e++)So[e]._workInProgressVersionPrimary=null;So.length=0}var wo=x.ReactCurrentDispatcher,To=x.ReactCurrentBatchConfig,Eo=0,U=null,Do=null,Oo=null,ko=!1,Ao=!1,jo=0,Mo=0;function No(){throw Error(r(321))}function W(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!jr(e[n],t[n]))return!1;return!0}function Po(e,t,n,i,a,o){if(Eo=o,U=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,wo.current=e===null||e.memoizedState===null?_s:vs,e=n(i,a),Ao){o=0;do{if(Ao=!1,jo=0,25<=o)throw Error(r(301));o+=1,Oo=Do=null,t.updateQueue=null,wo.current=ys,e=n(i,a)}while(Ao)}if(wo.current=gs,t=Do!==null&&Do.next!==null,Eo=0,Oo=Do=U=null,ko=!1,t)throw Error(r(300));return e}function Fo(){var e=jo!==0;return jo=0,e}function Io(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Oo===null?U.memoizedState=Oo=e:Oo=Oo.next=e,Oo}function Lo(){if(Do===null){var e=U.alternate;e=e===null?null:e.memoizedState}else e=Do.next;var t=Oo===null?U.memoizedState:Oo.next;if(t!==null)Oo=t,Do=e;else{if(e===null)throw Error(r(310));Do=e,e={memoizedState:Do.memoizedState,baseState:Do.baseState,baseQueue:Do.baseQueue,queue:Do.queue,next:null},Oo===null?U.memoizedState=Oo=e:Oo=Oo.next=e}return Oo}function Ro(e,t){return typeof t==`function`?t(e):t}function zo(e){var t=Lo(),n=t.queue;if(n===null)throw Error(r(311));n.lastRenderedReducer=e;var i=Do,a=i.baseQueue,o=n.pending;if(o!==null){if(a!==null){var s=a.next;a.next=o.next,o.next=s}i.baseQueue=a=o,n.pending=null}if(a!==null){o=a.next,i=i.baseState;var c=s=null,l=null,u=o;do{var d=u.lane;if((Eo&d)===d)l!==null&&(l=l.next={lane:0,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),i=u.hasEagerState?u.eagerState:e(i,u.action);else{var f={lane:d,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null};l===null?(c=l=f,s=i):l=l.next=f,U.lanes|=d,Zc|=d}u=u.next}while(u!==null&&u!==o);l===null?s=i:l.next=c,jr(i,t.memoizedState)||(Fs=!0),t.memoizedState=i,t.baseState=s,t.baseQueue=l,n.lastRenderedState=i}if(e=n.interleaved,e!==null){a=e;do o=a.lane,U.lanes|=o,Zc|=o,a=a.next;while(a!==e)}else a===null&&(n.lanes=0);return[t.memoizedState,n.dispatch]}function Bo(e){var t=Lo(),n=t.queue;if(n===null)throw Error(r(311));n.lastRenderedReducer=e;var i=n.dispatch,a=n.pending,o=t.memoizedState;if(a!==null){n.pending=null;var s=a=a.next;do o=e(o,s.action),s=s.next;while(s!==a);jr(o,t.memoizedState)||(Fs=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,i]}function Vo(){}function Ho(e,t){var n=U,i=Lo(),a=t(),o=!jr(i.memoizedState,a);if(o&&(i.memoizedState=a,Fs=!0),i=i.queue,es(Go.bind(null,n,i,e),[e]),i.getSnapshot!==t||o||Oo!==null&&Oo.memoizedState.tag&1){if(n.flags|=2048,Yo(9,Wo.bind(null,n,i,a,t),void 0,null),Wc===null)throw Error(r(349));Eo&30||Uo(n,t,a)}return a}function Uo(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=U.updateQueue,t===null?(t={lastEffect:null,stores:null},U.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Wo(e,t,n,r){t.value=n,t.getSnapshot=r,Ko(t)&&qo(e)}function Go(e,t,n){return n(function(){Ko(t)&&qo(e)})}function Ko(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!jr(e,n)}catch{return!0}}function qo(e){var t=to(e,1);t!==null&&_l(t,e,1,-1)}function Jo(e){var t=Io();return typeof e==`function`&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Ro,lastRenderedState:e},t.queue=e,e=e.dispatch=fs.bind(null,U,e),[t.memoizedState,e]}function Yo(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},t=U.updateQueue,t===null?(t={lastEffect:null,stores:null},U.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e)),e}function Xo(){return Lo().memoizedState}function Zo(e,t,n,r){var i=Io();U.flags|=e,i.memoizedState=Yo(1|t,n,void 0,r===void 0?null:r)}function Qo(e,t,n,r){var i=Lo();r=r===void 0?null:r;var a=void 0;if(Do!==null){var o=Do.memoizedState;if(a=o.destroy,r!==null&&W(r,o.deps)){i.memoizedState=Yo(t,n,a,r);return}}U.flags|=e,i.memoizedState=Yo(1|t,n,a,r)}function $o(e,t){return Zo(8390656,8,e,t)}function es(e,t){return Qo(2048,8,e,t)}function ts(e,t){return Qo(4,2,e,t)}function ns(e,t){return Qo(4,4,e,t)}function rs(e,t){if(typeof t==`function`)return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function is(e,t,n){return n=n==null?null:n.concat([e]),Qo(4,4,rs.bind(null,t,e),n)}function as(){}function os(e,t){var n=Lo();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&W(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function ss(e,t){var n=Lo();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&W(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}function cs(e,t,n){return Eo&21?(jr(n,t)||(n=Bt(),U.lanes|=n,Zc|=n,e.baseState=!0),t):(e.baseState&&(e.baseState=!1,Fs=!0),e.memoizedState=n)}function ls(e,t){var n=F;F=n!==0&&4>n?n:4,e(!0);var r=To.transition;To.transition={};try{e(!1),t()}finally{F=n,To.transition=r}}function us(){return Lo().memoizedState}function ds(e,t,n){var r=gl(e);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},ps(e))ms(t,n);else if(n=eo(e,t,n,r),n!==null){var i=hl();_l(n,e,r,i),hs(n,t,r)}}function fs(e,t,n){var r=gl(e),i={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(ps(e))ms(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,n);if(i.hasEagerState=!0,i.eagerState=s,jr(s,o)){var c=t.interleaved;c===null?(i.next=i,$a(t)):(i.next=c.next,c.next=i),t.interleaved=i;return}}catch{}n=eo(e,t,i,r),n!==null&&(i=hl(),_l(n,e,r,i),hs(n,t,r))}}function ps(e){var t=e.alternate;return e===U||t!==null&&t===U}function ms(e,t){Ao=ko=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function hs(e,t,n){if(n&4194240){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Wt(e,n)}}var gs={readContext:Za,useCallback:No,useContext:No,useEffect:No,useImperativeHandle:No,useInsertionEffect:No,useLayoutEffect:No,useMemo:No,useReducer:No,useRef:No,useState:No,useDebugValue:No,useDeferredValue:No,useTransition:No,useMutableSource:No,useSyncExternalStore:No,useId:No,unstable_isNewReconciler:!1},_s={readContext:Za,useCallback:function(e,t){return Io().memoizedState=[e,t===void 0?null:t],e},useContext:Za,useEffect:$o,useImperativeHandle:function(e,t,n){return n=n==null?null:n.concat([e]),Zo(4194308,4,rs.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Zo(4194308,4,e,t)},useInsertionEffect:function(e,t){return Zo(4,2,e,t)},useMemo:function(e,t){var n=Io();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var r=Io();return t=n===void 0?t:n(t),r.memoizedState=r.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},r.queue=e,e=e.dispatch=ds.bind(null,U,e),[r.memoizedState,e]},useRef:function(e){var t=Io();return e={current:e},t.memoizedState=e},useState:Jo,useDebugValue:as,useDeferredValue:function(e){return Io().memoizedState=e},useTransition:function(){var e=Jo(!1),t=e[0];return e=ls.bind(null,e[1]),Io().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,n){var i=U,a=Io();if(V){if(n===void 0)throw Error(r(407));n=n()}else{if(n=t(),Wc===null)throw Error(r(349));Eo&30||Uo(i,t,n)}a.memoizedState=n;var o={value:n,getSnapshot:t};return a.queue=o,$o(Go.bind(null,i,o,e),[e]),i.flags|=2048,Yo(9,Wo.bind(null,i,o,n,t),void 0,null),n},useId:function(){var e=Io(),t=Wc.identifierPrefix;if(V){var n=ya,r=va;n=(r&~(1<<32-kt(r)-1)).toString(32)+n,t=`:`+t+`R`+n,n=jo++,0<n&&(t+=`H`+n.toString(32)),t+=`:`}else n=Mo++,t=`:`+t+`r`+n.toString(32)+`:`;return e.memoizedState=t},unstable_isNewReconciler:!1},vs={readContext:Za,useCallback:os,useContext:Za,useEffect:es,useImperativeHandle:is,useInsertionEffect:ts,useLayoutEffect:ns,useMemo:ss,useReducer:zo,useRef:Xo,useState:function(){return zo(Ro)},useDebugValue:as,useDeferredValue:function(e){return cs(Lo(),Do.memoizedState,e)},useTransition:function(){return[zo(Ro)[0],Lo().memoizedState]},useMutableSource:Vo,useSyncExternalStore:Ho,useId:us,unstable_isNewReconciler:!1},ys={readContext:Za,useCallback:os,useContext:Za,useEffect:es,useImperativeHandle:is,useInsertionEffect:ts,useLayoutEffect:ns,useMemo:ss,useReducer:Bo,useRef:Xo,useState:function(){return Bo(Ro)},useDebugValue:as,useDeferredValue:function(e){var t=Lo();return Do===null?t.memoizedState=e:cs(t,Do.memoizedState,e)},useTransition:function(){return[Bo(Ro)[0],Lo().memoizedState]},useMutableSource:Vo,useSyncExternalStore:Ho,useId:us,unstable_isNewReconciler:!1};function bs(e,t){if(e&&e.defaultProps){for(var n in t=N({},t),e=e.defaultProps,e)t[n]===void 0&&(t[n]=e[n]);return t}return t}function xs(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:N({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Ss={isMounted:function(e){return(e=e._reactInternals)?ut(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var r=hl(),i=gl(e),a=ao(r,i);a.payload=t,n!=null&&(a.callback=n),t=oo(e,a,i),t!==null&&(_l(t,e,i,r),so(t,e,i))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=hl(),i=gl(e),a=ao(r,i);a.tag=1,a.payload=t,n!=null&&(a.callback=n),t=oo(e,a,i),t!==null&&(_l(t,e,i,r),so(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=hl(),r=gl(e),i=ao(n,r);i.tag=2,t!=null&&(i.callback=t),t=oo(e,i,r),t!==null&&(_l(t,e,r,n),so(t,e,r))}};function Cs(e,t,n,r,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate==`function`?e.shouldComponentUpdate(r,a,o):t.prototype&&t.prototype.isPureReactComponent?!Mr(n,r)||!Mr(i,a):!0}function ws(e,t,n){var r=!1,i=Ji,a=t.contextType;return typeof a==`object`&&a?a=Za(a):(i=$i(t)?Zi:Yi.current,r=t.contextTypes,a=(r=r!=null)?Qi(e,i):Ji),t=new t(n,a),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=Ss,e.stateNode=t,t._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=i,e.__reactInternalMemoizedMaskedChildContext=a),t}function Ts(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps==`function`&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps==`function`&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&Ss.enqueueReplaceState(t,t.state,null)}function Es(e,t,n,r){var i=e.stateNode;i.props=n,i.state=e.memoizedState,i.refs={},ro(e);var a=t.contextType;typeof a==`object`&&a?i.context=Za(a):(a=$i(t)?Zi:Yi.current,i.context=Qi(e,a)),i.state=e.memoizedState,a=t.getDerivedStateFromProps,typeof a==`function`&&(xs(e,t,a,n),i.state=e.memoizedState),typeof t.getDerivedStateFromProps==`function`||typeof i.getSnapshotBeforeUpdate==`function`||typeof i.UNSAFE_componentWillMount!=`function`&&typeof i.componentWillMount!=`function`||(t=i.state,typeof i.componentWillMount==`function`&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount==`function`&&i.UNSAFE_componentWillMount(),t!==i.state&&Ss.enqueueReplaceState(i,i.state,null),lo(e,n,i,r),i.state=e.memoizedState),typeof i.componentDidMount==`function`&&(e.flags|=4194308)}function Ds(e,t){try{var n=``,r=t;do n+=ce(r),r=r.return;while(r);var i=n}catch(e){i=`
Error generating stack: `+e.message+`
`+e.stack}return{value:e,source:t,stack:i,digest:null}}function G(e,t,n){return{value:e,source:null,stack:n??null,digest:t??null}}function Os(e,t){try{console.error(t.value)}catch(e){setTimeout(function(){throw e})}}var ks=typeof WeakMap==`function`?WeakMap:Map;function As(e,t,n){n=ao(-1,n),n.tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){al||(al=!0,ol=r),Os(e,t)},n}function js(e,t,n){n=ao(-1,n),n.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r==`function`){var i=t.value;n.payload=function(){return r(i)},n.callback=function(){Os(e,t)}}var a=e.stateNode;return a!==null&&typeof a.componentDidCatch==`function`&&(n.callback=function(){Os(e,t),typeof r!=`function`&&(sl===null?sl=new Set([this]):sl.add(this));var n=t.stack;this.componentDidCatch(t.value,{componentStack:n===null?``:n})}),n}function K(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new ks;var i=new Set;r.set(t,i)}else i=r.get(t),i===void 0&&(i=new Set,r.set(t,i));i.has(n)||(i.add(n),e=Hl.bind(null,e,t,n),t.then(e,e))}function Ms(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t===null?!0:t.dehydrated!==null),t)return e;e=e.return}while(e!==null);return null}function Ns(e,t,n,r,i){return e.mode&1?(e.flags|=65536,e.lanes=i,e):(e===t?e.flags|=65536:(e.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(t=ao(-1,1),t.tag=2,oo(n,t,1))),n.lanes|=1),e)}var Ps=x.ReactCurrentOwner,Fs=!1;function Is(e,t,n,r){t.child=e===null?Ha(t,null,n,r):Va(t,e.child,n,r)}function Ls(e,t,n,r,i){n=n.render;var a=t.ref;return Xa(t,i),r=Po(e,t,n,r,a,i),n=Fo(),e!==null&&!Fs?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~i,rc(e,t,i)):(V&&n&&Sa(t),t.flags|=1,Is(e,t,r,i),t.child)}function Rs(e,t,n,r,i){if(e===null){var a=n.type;return typeof a==`function`&&!Xl(a)&&a.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=a,zs(e,t,a,r,i)):(e=$l(n.type,null,r,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,(e.lanes&i)===0){var o=a.memoizedProps;if(n=n.compare,n=n===null?Mr:n,n(o,r)&&e.ref===t.ref)return rc(e,t,i)}return t.flags|=1,e=Ql(a,r),e.ref=t.ref,e.return=t,t.child=e}function zs(e,t,n,r,i){if(e!==null){var a=e.memoizedProps;if(Mr(a,r)&&e.ref===t.ref)if(Fs=!1,t.pendingProps=r=a,(e.lanes&i)!==0)e.flags&131072&&(Fs=!0);else return t.lanes=e.lanes,rc(e,t,i)}return Hs(e,t,n,r,i)}function Bs(e,t,n){var r=t.pendingProps,i=r.children,a=e===null?null:e.memoizedState;if(r.mode===`hidden`)if(!(t.mode&1))t.memoizedState={baseLanes:0,cachePool:null,transitions:null},B(Jc,qc),qc|=n;else{if(!(n&1073741824))return e=a===null?n:a.baseLanes|n,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,B(Jc,qc),qc|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=a===null?n:a.baseLanes,B(Jc,qc),qc|=r}else a===null?r=n:(r=a.baseLanes|n,t.memoizedState=null),B(Jc,qc),qc|=r;return Is(e,t,i,n),t.child}function Vs(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.flags|=512,t.flags|=2097152)}function Hs(e,t,n,r,i){var a=$i(n)?Zi:Yi.current;return a=Qi(t,a),Xa(t,i),n=Po(e,t,n,r,a,i),r=Fo(),e!==null&&!Fs?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~i,rc(e,t,i)):(V&&r&&Sa(t),t.flags|=1,Is(e,t,n,i),t.child)}function Us(e,t,n,r,i){if($i(n)){var a=!0;ra(t)}else a=!1;if(Xa(t,i),t.stateNode===null)nc(e,t),ws(t,n,r),Es(t,n,r,i),r=!0;else if(e===null){var o=t.stateNode,s=t.memoizedProps;o.props=s;var c=o.context,l=n.contextType;typeof l==`object`&&l?l=Za(l):(l=$i(n)?Zi:Yi.current,l=Qi(t,l));var u=n.getDerivedStateFromProps,d=typeof u==`function`||typeof o.getSnapshotBeforeUpdate==`function`;d||typeof o.UNSAFE_componentWillReceiveProps!=`function`&&typeof o.componentWillReceiveProps!=`function`||(s!==r||c!==l)&&Ts(t,o,r,l),no=!1;var f=t.memoizedState;o.state=f,lo(t,r,o,i),c=t.memoizedState,s!==r||f!==c||Xi.current||no?(typeof u==`function`&&(xs(t,n,u,r),c=t.memoizedState),(s=no||Cs(t,n,s,r,f,c,l))?(d||typeof o.UNSAFE_componentWillMount!=`function`&&typeof o.componentWillMount!=`function`||(typeof o.componentWillMount==`function`&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount==`function`&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount==`function`&&(t.flags|=4194308)):(typeof o.componentDidMount==`function`&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=c),o.props=r,o.state=c,o.context=l,r=s):(typeof o.componentDidMount==`function`&&(t.flags|=4194308),r=!1)}else{o=t.stateNode,io(e,t),s=t.memoizedProps,l=t.type===t.elementType?s:bs(t.type,s),o.props=l,d=t.pendingProps,f=o.context,c=n.contextType,typeof c==`object`&&c?c=Za(c):(c=$i(n)?Zi:Yi.current,c=Qi(t,c));var p=n.getDerivedStateFromProps;(u=typeof p==`function`||typeof o.getSnapshotBeforeUpdate==`function`)||typeof o.UNSAFE_componentWillReceiveProps!=`function`&&typeof o.componentWillReceiveProps!=`function`||(s!==d||f!==c)&&Ts(t,o,r,c),no=!1,f=t.memoizedState,o.state=f,lo(t,r,o,i);var m=t.memoizedState;s!==d||f!==m||Xi.current||no?(typeof p==`function`&&(xs(t,n,p,r),m=t.memoizedState),(l=no||Cs(t,n,l,r,f,m,c)||!1)?(u||typeof o.UNSAFE_componentWillUpdate!=`function`&&typeof o.componentWillUpdate!=`function`||(typeof o.componentWillUpdate==`function`&&o.componentWillUpdate(r,m,c),typeof o.UNSAFE_componentWillUpdate==`function`&&o.UNSAFE_componentWillUpdate(r,m,c)),typeof o.componentDidUpdate==`function`&&(t.flags|=4),typeof o.getSnapshotBeforeUpdate==`function`&&(t.flags|=1024)):(typeof o.componentDidUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=m),o.props=r,o.state=m,o.context=c,r=l):(typeof o.componentDidUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return Ws(e,t,n,r,a,i)}function Ws(e,t,n,r,i,a){Vs(e,t);var o=(t.flags&128)!=0;if(!r&&!o)return i&&ia(t,n,!1),rc(e,t,a);r=t.stateNode,Ps.current=t;var s=o&&typeof n.getDerivedStateFromError!=`function`?null:r.render();return t.flags|=1,e!==null&&o?(t.child=Va(t,e.child,null,a),t.child=Va(t,null,s,a)):Is(e,t,s,a),t.memoizedState=r.state,i&&ia(t,n,!0),t.child}function Gs(e){var t=e.stateNode;t.pendingContext?ta(e,t.pendingContext,t.pendingContext!==t.context):t.context&&ta(e,t.context,!1),_o(e,t.containerInfo)}function Ks(e,t,n,r,i){return Pa(),Fa(i),t.flags|=256,Is(e,t,n,r),t.child}var qs={dehydrated:null,treeContext:null,retryLane:0};function Js(e){return{baseLanes:e,cachePool:null,transitions:null}}function Ys(e,t,n){var r=t.pendingProps,i=H.current,a=!1,o=(t.flags&128)!=0,s;if((s=o)||(s=e!==null&&e.memoizedState===null?!1:(i&2)!=0),s?(a=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(i|=1),B(H,i&1),e===null)return Aa(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?(t.mode&1?e.data===`$!`?t.lanes=8:t.lanes=1073741824:t.lanes=1,null):(o=r.children,e=r.fallback,a?(r=t.mode,a=t.child,o={mode:`hidden`,children:o},!(r&1)&&a!==null?(a.childLanes=0,a.pendingProps=o):a=tu(o,r,0,null),e=eu(e,r,n,null),a.return=t,e.return=t,a.sibling=e,t.child=a,t.child.memoizedState=Js(n),t.memoizedState=qs,e):Xs(t,o));if(i=e.memoizedState,i!==null&&(s=i.dehydrated,s!==null))return Qs(e,t,o,r,s,i,n);if(a){a=r.fallback,o=t.mode,i=e.child,s=i.sibling;var c={mode:`hidden`,children:r.children};return!(o&1)&&t.child!==i?(r=t.child,r.childLanes=0,r.pendingProps=c,t.deletions=null):(r=Ql(i,c),r.subtreeFlags=i.subtreeFlags&14680064),s===null?(a=eu(a,o,n,null),a.flags|=2):a=Ql(s,a),a.return=t,r.return=t,r.sibling=a,t.child=r,r=a,a=t.child,o=e.child.memoizedState,o=o===null?Js(n):{baseLanes:o.baseLanes|n,cachePool:null,transitions:o.transitions},a.memoizedState=o,a.childLanes=e.childLanes&~n,t.memoizedState=qs,r}return a=e.child,e=a.sibling,r=Ql(a,{mode:`visible`,children:r.children}),!(t.mode&1)&&(r.lanes=n),r.return=t,r.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=r,t.memoizedState=null,r}function Xs(e,t){return t=tu({mode:`visible`,children:t},e.mode,0,null),t.return=e,e.child=t}function Zs(e,t,n,r){return r!==null&&Fa(r),Va(t,e.child,null,n),e=Xs(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Qs(e,t,n,i,a,o,s){if(n)return t.flags&256?(t.flags&=-257,i=G(Error(r(422))),Zs(e,t,s,i)):t.memoizedState===null?(o=i.fallback,a=t.mode,i=tu({mode:`visible`,children:i.children},a,0,null),o=eu(o,a,s,null),o.flags|=2,i.return=t,o.return=t,i.sibling=o,t.child=i,t.mode&1&&Va(t,e.child,null,s),t.child.memoizedState=Js(s),t.memoizedState=qs,o):(t.child=e.child,t.flags|=128,null);if(!(t.mode&1))return Zs(e,t,s,null);if(a.data===`$!`){if(i=a.nextSibling&&a.nextSibling.dataset,i)var c=i.dgst;return i=c,o=Error(r(419)),i=G(o,i,void 0),Zs(e,t,s,i)}if(c=(s&e.childLanes)!==0,Fs||c){if(i=Wc,i!==null){switch(s&-s){case 4:a=2;break;case 16:a=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:a=32;break;case 536870912:a=268435456;break;default:a=0}a=(a&(i.suspendedLanes|s))===0?a:0,a!==0&&a!==o.retryLane&&(o.retryLane=a,to(e,a),_l(i,e,a,-1))}return Ml(),i=G(Error(r(421))),Zs(e,t,s,i)}return a.data===`$?`?(t.flags|=128,t.child=e.child,t=Wl.bind(null,e),a._reactRetry=t,null):(e=o.treeContext,Ta=Mi(a.nextSibling),wa=t,V=!0,Ea=null,e!==null&&(ha[ga++]=va,ha[ga++]=ya,ha[ga++]=_a,va=e.id,ya=e.overflow,_a=t),t=Xs(t,i.children),t.flags|=4096,t)}function $s(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Ya(e.return,t,n)}function ec(e,t,n,r,i){var a=e.memoizedState;a===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i}:(a.isBackwards=t,a.rendering=null,a.renderingStartTime=0,a.last=r,a.tail=n,a.tailMode=i)}function tc(e,t,n){var r=t.pendingProps,i=r.revealOrder,a=r.tail;if(Is(e,t,r.children,n),r=H.current,r&2)r=r&1|2,t.flags|=128;else{if(e!==null&&e.flags&128)a:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&$s(e,n,t);else if(e.tag===19)$s(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break a;for(;e.sibling===null;){if(e.return===null||e.return===t)break a;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(B(H,r),!(t.mode&1))t.memoizedState=null;else switch(i){case`forwards`:for(n=t.child,i=null;n!==null;)e=n.alternate,e!==null&&xo(e)===null&&(i=n),n=n.sibling;n=i,n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),ec(t,!1,i,n,a);break;case`backwards`:for(n=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&xo(e)===null){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}ec(t,!0,n,null,a);break;case`together`:ec(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function nc(e,t){!(t.mode&1)&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function rc(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Zc|=t.lanes,(n&t.childLanes)===0)return null;if(e!==null&&t.child!==e.child)throw Error(r(153));if(t.child!==null){for(e=t.child,n=Ql(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Ql(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function ic(e,t,n){switch(t.tag){case 3:Gs(t),Pa();break;case 5:yo(t);break;case 1:$i(t.type)&&ra(t);break;case 4:_o(t,t.stateNode.containerInfo);break;case 10:var r=t.type._context,i=t.memoizedProps.value;B(Ua,r._currentValue),r._currentValue=i;break;case 13:if(r=t.memoizedState,r!==null)return r.dehydrated===null?(n&t.child.childLanes)===0?(B(H,H.current&1),e=rc(e,t,n),e===null?null:e.sibling):Ys(e,t,n):(B(H,H.current&1),t.flags|=128,null);B(H,H.current&1);break;case 19:if(r=(n&t.childLanes)!==0,e.flags&128){if(r)return tc(e,t,n);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),B(H,H.current),r)break;return null;case 22:case 23:return t.lanes=0,Bs(e,t,n)}return rc(e,t,n)}var ac=function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}},oc=function(e,t,n,r){var i=e.memoizedProps;if(i!==r){e=t.stateNode,go(po.current);var o=null;switch(n){case`input`:i=_e(e,i),r=_e(e,r),o=[];break;case`select`:i=N({},i,{value:void 0}),r=N({},r,{value:void 0}),o=[];break;case`textarea`:i=Te(e,i),r=Te(e,r),o=[];break;default:typeof i.onClick!=`function`&&typeof r.onClick==`function`&&(e.onclick=Si)}ze(n,r);var s;for(u in n=null,i)if(!r.hasOwnProperty(u)&&i.hasOwnProperty(u)&&i[u]!=null)if(u===`style`){var c=i[u];for(s in c)c.hasOwnProperty(s)&&(n||={},n[s]=``)}else u!==`dangerouslySetInnerHTML`&&u!==`children`&&u!==`suppressContentEditableWarning`&&u!==`suppressHydrationWarning`&&u!==`autoFocus`&&(a.hasOwnProperty(u)?o||=[]:(o||=[]).push(u,null));for(u in r){var l=r[u];if(c=i?.[u],r.hasOwnProperty(u)&&l!==c&&(l!=null||c!=null))if(u===`style`)if(c){for(s in c)!c.hasOwnProperty(s)||l&&l.hasOwnProperty(s)||(n||={},n[s]=``);for(s in l)l.hasOwnProperty(s)&&c[s]!==l[s]&&(n||={},n[s]=l[s])}else n||(o||=[],o.push(u,n)),n=l;else u===`dangerouslySetInnerHTML`?(l=l?l.__html:void 0,c=c?c.__html:void 0,l!=null&&c!==l&&(o||=[]).push(u,l)):u===`children`?typeof l!=`string`&&typeof l!=`number`||(o||=[]).push(u,``+l):u!==`suppressContentEditableWarning`&&u!==`suppressHydrationWarning`&&(a.hasOwnProperty(u)?(l!=null&&u===`onScroll`&&R(`scroll`,e),o||c===l||(o=[])):(o||=[]).push(u,l))}n&&(o||=[]).push(`style`,n);var u=o;(t.updateQueue=u)&&(t.flags|=4)}},sc=function(e,t,n,r){n!==r&&(t.flags|=4)};function cc(e,t){if(!V)switch(e.tailMode){case`hidden`:t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case`collapsed`:n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function lc(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&14680064,r|=i.flags&14680064,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function uc(e,t,n){var i=t.pendingProps;switch(Ca(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return lc(t),null;case 1:return $i(t.type)&&ea(),lc(t),null;case 3:return i=t.stateNode,vo(),z(Xi),z(Yi),Co(),i.pendingContext&&(i.context=i.pendingContext,i.pendingContext=null),(e===null||e.child===null)&&(Ma(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,Ea!==null&&(xl(Ea),Ea=null))),lc(t),null;case 5:bo(t);var o=go(ho.current);if(n=t.type,e!==null&&t.stateNode!=null)oc(e,t,n,i,o),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!i){if(t.stateNode===null)throw Error(r(166));return lc(t),null}if(e=go(po.current),Ma(t)){i=t.stateNode,n=t.type;var s=t.memoizedProps;switch(i[Fi]=t,i[Ii]=s,e=(t.mode&1)!=0,n){case`dialog`:R(`cancel`,i),R(`close`,i);break;case`iframe`:case`object`:case`embed`:R(`load`,i);break;case`video`:case`audio`:for(o=0;o<ai.length;o++)R(ai[o],i);break;case`source`:R(`error`,i);break;case`img`:case`image`:case`link`:R(`error`,i),R(`load`,i);break;case`details`:R(`toggle`,i);break;case`input`:ve(i,s),R(`invalid`,i);break;case`select`:i._wrapperState={wasMultiple:!!s.multiple},R(`invalid`,i);break;case`textarea`:Ee(i,s),R(`invalid`,i)}for(var c in ze(n,s),o=null,s)if(s.hasOwnProperty(c)){var l=s[c];c===`children`?typeof l==`string`?i.textContent!==l&&(!0!==s.suppressHydrationWarning&&xi(i.textContent,l,e),o=[`children`,l]):typeof l==`number`&&i.textContent!==``+l&&(!0!==s.suppressHydrationWarning&&xi(i.textContent,l,e),o=[`children`,``+l]):a.hasOwnProperty(c)&&l!=null&&c===`onScroll`&&R(`scroll`,i)}switch(n){case`input`:me(i),xe(i,s,!0);break;case`textarea`:me(i),Oe(i);break;case`select`:case`option`:break;default:typeof s.onClick==`function`&&(i.onclick=Si)}i=o,t.updateQueue=i,i!==null&&(t.flags|=4)}else{c=o.nodeType===9?o:o.ownerDocument,e===`http://www.w3.org/1999/xhtml`&&(e=ke(n)),e===`http://www.w3.org/1999/xhtml`?n===`script`?(e=c.createElement(`div`),e.innerHTML=`<script><\/script>`,e=e.removeChild(e.firstChild)):typeof i.is==`string`?e=c.createElement(n,{is:i.is}):(e=c.createElement(n),n===`select`&&(c=e,i.multiple?c.multiple=!0:i.size&&(c.size=i.size))):e=c.createElementNS(e,n),e[Fi]=t,e[Ii]=i,ac(e,t,!1,!1),t.stateNode=e;a:{switch(c=Be(n,i),n){case`dialog`:R(`cancel`,e),R(`close`,e),o=i;break;case`iframe`:case`object`:case`embed`:R(`load`,e),o=i;break;case`video`:case`audio`:for(o=0;o<ai.length;o++)R(ai[o],e);o=i;break;case`source`:R(`error`,e),o=i;break;case`img`:case`image`:case`link`:R(`error`,e),R(`load`,e),o=i;break;case`details`:R(`toggle`,e),o=i;break;case`input`:ve(e,i),o=_e(e,i),R(`invalid`,e);break;case`option`:o=i;break;case`select`:e._wrapperState={wasMultiple:!!i.multiple},o=N({},i,{value:void 0}),R(`invalid`,e);break;case`textarea`:Ee(e,i),o=Te(e,i),R(`invalid`,e);break;default:o=i}for(s in ze(n,o),l=o,l)if(l.hasOwnProperty(s)){var u=l[s];s===`style`?Le(e,u):s===`dangerouslySetInnerHTML`?(u=u?u.__html:void 0,u!=null&&Me(e,u)):s===`children`?typeof u==`string`?(n!==`textarea`||u!==``)&&Ne(e,u):typeof u==`number`&&Ne(e,``+u):s!==`suppressContentEditableWarning`&&s!==`suppressHydrationWarning`&&s!==`autoFocus`&&(a.hasOwnProperty(s)?u!=null&&s===`onScroll`&&R(`scroll`,e):u!=null&&b(e,s,u,c))}switch(n){case`input`:me(e),xe(e,i,!1);break;case`textarea`:me(e),Oe(e);break;case`option`:i.value!=null&&e.setAttribute(`value`,``+de(i.value));break;case`select`:e.multiple=!!i.multiple,s=i.value,s==null?i.defaultValue!=null&&we(e,!!i.multiple,i.defaultValue,!0):we(e,!!i.multiple,s,!1);break;default:typeof o.onClick==`function`&&(e.onclick=Si)}switch(n){case`button`:case`input`:case`select`:case`textarea`:i=!!i.autoFocus;break a;case`img`:i=!0;break a;default:i=!1}}i&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return lc(t),null;case 6:if(e&&t.stateNode!=null)sc(e,t,e.memoizedProps,i);else{if(typeof i!=`string`&&t.stateNode===null)throw Error(r(166));if(n=go(ho.current),go(po.current),Ma(t)){if(i=t.stateNode,n=t.memoizedProps,i[Fi]=t,(s=i.nodeValue!==n)&&(e=wa,e!==null))switch(e.tag){case 3:xi(i.nodeValue,n,(e.mode&1)!=0);break;case 5:!0!==e.memoizedProps.suppressHydrationWarning&&xi(i.nodeValue,n,(e.mode&1)!=0)}s&&(t.flags|=4)}else i=(n.nodeType===9?n:n.ownerDocument).createTextNode(i),i[Fi]=t,t.stateNode=i}return lc(t),null;case 13:if(z(H),i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(V&&Ta!==null&&t.mode&1&&!(t.flags&128))Na(),Pa(),t.flags|=98560,s=!1;else if(s=Ma(t),i!==null&&i.dehydrated!==null){if(e===null){if(!s)throw Error(r(318));if(s=t.memoizedState,s=s===null?null:s.dehydrated,!s)throw Error(r(317));s[Fi]=t}else Pa(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;lc(t),s=!1}else Ea!==null&&(xl(Ea),Ea=null),s=!0;if(!s)return t.flags&65536?t:null}return t.flags&128?(t.lanes=n,t):(i=i!==null,i!==(e!==null&&e.memoizedState!==null)&&i&&(t.child.flags|=8192,t.mode&1&&(e===null||H.current&1?Yc===0&&(Yc=3):Ml())),t.updateQueue!==null&&(t.flags|=4),lc(t),null);case 4:return vo(),e===null&&di(t.stateNode.containerInfo),lc(t),null;case 10:return Ja(t.type._context),lc(t),null;case 17:return $i(t.type)&&ea(),lc(t),null;case 19:if(z(H),s=t.memoizedState,s===null)return lc(t),null;if(i=(t.flags&128)!=0,c=s.rendering,c===null)if(i)cc(s,!1);else{if(Yc!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(c=xo(e),c!==null){for(t.flags|=128,cc(s,!1),i=c.updateQueue,i!==null&&(t.updateQueue=i,t.flags|=4),t.subtreeFlags=0,i=n,n=t.child;n!==null;)s=n,e=i,s.flags&=14680066,c=s.alternate,c===null?(s.childLanes=0,s.lanes=e,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=c.childLanes,s.lanes=c.lanes,s.child=c.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=c.memoizedProps,s.memoizedState=c.memoizedState,s.updateQueue=c.updateQueue,s.type=c.type,e=c.dependencies,s.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),n=n.sibling;return B(H,H.current&1|2),t.child}e=e.sibling}s.tail!==null&&P()>rl&&(t.flags|=128,i=!0,cc(s,!1),t.lanes=4194304)}else{if(!i)if(e=xo(c),e!==null){if(t.flags|=128,i=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),cc(s,!0),s.tail===null&&s.tailMode===`hidden`&&!c.alternate&&!V)return lc(t),null}else 2*P()-s.renderingStartTime>rl&&n!==1073741824&&(t.flags|=128,i=!0,cc(s,!1),t.lanes=4194304);s.isBackwards?(c.sibling=t.child,t.child=c):(n=s.last,n===null?t.child=c:n.sibling=c,s.last=c)}return s.tail===null?(lc(t),null):(t=s.tail,s.rendering=t,s.tail=t.sibling,s.renderingStartTime=P(),t.sibling=null,n=H.current,B(H,i?n&1|2:n&1),t);case 22:case 23:return kl(),i=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==i&&(t.flags|=8192),i&&t.mode&1?qc&1073741824&&(lc(t),t.subtreeFlags&6&&(t.flags|=8192)):lc(t),null;case 24:return null;case 25:return null}throw Error(r(156,t.tag))}function dc(e,t){switch(Ca(t),t.tag){case 1:return $i(t.type)&&ea(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return vo(),z(Xi),z(Yi),Co(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 5:return bo(t),null;case 13:if(z(H),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(r(340));Pa()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return z(H),null;case 4:return vo(),null;case 10:return Ja(t.type._context),null;case 22:case 23:return kl(),null;case 24:return null;default:return null}}var fc=!1,pc=!1,mc=typeof WeakSet==`function`?WeakSet:Set,q=null;function hc(e,t){var n=e.ref;if(n!==null)if(typeof n==`function`)try{n(null)}catch(n){X(e,t,n)}else n.current=null}function gc(e,t,n){try{n()}catch(n){X(e,t,n)}}var _c=!1;function vc(e,t){if(Ci=_n,e=Ir(),Lr(e)){if(`selectionStart`in e)var n={start:e.selectionStart,end:e.selectionEnd};else a:{n=(n=e.ownerDocument)&&n.defaultView||window;var i=n.getSelection&&n.getSelection();if(i&&i.rangeCount!==0){n=i.anchorNode;var a=i.anchorOffset,o=i.focusNode;i=i.focusOffset;try{n.nodeType,o.nodeType}catch{n=null;break a}var s=0,c=-1,l=-1,u=0,d=0,f=e,p=null;b:for(;;){for(var m;f!==n||a!==0&&f.nodeType!==3||(c=s+a),f!==o||i!==0&&f.nodeType!==3||(l=s+i),f.nodeType===3&&(s+=f.nodeValue.length),(m=f.firstChild)!==null;)p=f,f=m;for(;;){if(f===e)break b;if(p===n&&++u===a&&(c=s),p===o&&++d===i&&(l=s),(m=f.nextSibling)!==null)break;f=p,p=f.parentNode}f=m}n=c===-1||l===-1?null:{start:c,end:l}}else n=null}n||={start:0,end:0}}else n=null;for(wi={focusedElem:e,selectionRange:n},_n=!1,q=t;q!==null;)if(t=q,e=t.child,t.subtreeFlags&1028&&e!==null)e.return=t,q=e;else for(;q!==null;){t=q;try{var h=t.alternate;if(t.flags&1024)switch(t.tag){case 0:case 11:case 15:break;case 1:if(h!==null){var g=h.memoizedProps,_=h.memoizedState,v=t.stateNode;v.__reactInternalSnapshotBeforeUpdate=v.getSnapshotBeforeUpdate(t.elementType===t.type?g:bs(t.type,g),_)}break;case 3:var y=t.stateNode.containerInfo;y.nodeType===1?y.textContent=``:y.nodeType===9&&y.documentElement&&y.removeChild(y.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(r(163))}}catch(e){X(t,t.return,e)}if(e=t.sibling,e!==null){e.return=t.return,q=e;break}q=t.return}return h=_c,_c=!1,h}function yc(e,t,n){var r=t.updateQueue;if(r=r===null?null:r.lastEffect,r!==null){var i=r=r.next;do{if((i.tag&e)===e){var a=i.destroy;i.destroy=void 0,a!==void 0&&gc(t,n,a)}i=i.next}while(i!==r)}}function bc(e,t){if(t=t.updateQueue,t=t===null?null:t.lastEffect,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}function xc(e){var t=e.ref;if(t!==null){var n=e.stateNode;switch(e.tag){case 5:e=n;break;default:e=n}typeof t==`function`?t(e):t.current=e}}function Sc(e){var t=e.alternate;t!==null&&(e.alternate=null,Sc(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[Fi],delete t[Ii],delete t[Ri],delete t[zi],delete t[Bi])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function Cc(e){return e.tag===5||e.tag===3||e.tag===4}function wc(e){a:for(;;){for(;e.sibling===null;){if(e.return===null||Cc(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue a;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Tc(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Si));else if(r!==4&&(e=e.child,e!==null))for(Tc(e,t,n),e=e.sibling;e!==null;)Tc(e,t,n),e=e.sibling}function Ec(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(Ec(e,t,n),e=e.sibling;e!==null;)Ec(e,t,n),e=e.sibling}var Dc=null,Oc=!1;function kc(e,t,n){for(n=n.child;n!==null;)Ac(e,t,n),n=n.sibling}function Ac(e,t,n){if(Dt&&typeof Dt.onCommitFiberUnmount==`function`)try{Dt.onCommitFiberUnmount(Et,n)}catch{}switch(n.tag){case 5:pc||hc(n,t);case 6:var r=Dc,i=Oc;Dc=null,kc(e,t,n),Dc=r,Oc=i,Dc!==null&&(Oc?(e=Dc,n=n.stateNode,e.nodeType===8?e.parentNode.removeChild(n):e.removeChild(n)):Dc.removeChild(n.stateNode));break;case 18:Dc!==null&&(Oc?(e=Dc,n=n.stateNode,e.nodeType===8?ji(e.parentNode,n):e.nodeType===1&&ji(e,n),hn(e)):ji(Dc,n.stateNode));break;case 4:r=Dc,i=Oc,Dc=n.stateNode.containerInfo,Oc=!0,kc(e,t,n),Dc=r,Oc=i;break;case 0:case 11:case 14:case 15:if(!pc&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){i=r=r.next;do{var a=i,o=a.destroy;a=a.tag,o!==void 0&&(a&2||a&4)&&gc(n,t,o),i=i.next}while(i!==r)}kc(e,t,n);break;case 1:if(!pc&&(hc(n,t),r=n.stateNode,typeof r.componentWillUnmount==`function`))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(e){X(n,t,e)}kc(e,t,n);break;case 21:kc(e,t,n);break;case 22:n.mode&1?(pc=(r=pc)||n.memoizedState!==null,kc(e,t,n),pc=r):kc(e,t,n);break;default:kc(e,t,n)}}function jc(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new mc),t.forEach(function(t){var r=Gl.bind(null,e,t);n.has(t)||(n.add(t),t.then(r,r))})}}function Mc(e,t){var n=t.deletions;if(n!==null)for(var i=0;i<n.length;i++){var a=n[i];try{var o=e,s=t,c=s;a:for(;c!==null;){switch(c.tag){case 5:Dc=c.stateNode,Oc=!1;break a;case 3:Dc=c.stateNode.containerInfo,Oc=!0;break a;case 4:Dc=c.stateNode.containerInfo,Oc=!0;break a}c=c.return}if(Dc===null)throw Error(r(160));Ac(o,s,a),Dc=null,Oc=!1;var l=a.alternate;l!==null&&(l.return=null),a.return=null}catch(e){X(a,t,e)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)Nc(t,e),t=t.sibling}function Nc(e,t){var n=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(Mc(t,e),Pc(e),i&4){try{yc(3,e,e.return),bc(3,e)}catch(t){X(e,e.return,t)}try{yc(5,e,e.return)}catch(t){X(e,e.return,t)}}break;case 1:Mc(t,e),Pc(e),i&512&&n!==null&&hc(n,n.return);break;case 5:if(Mc(t,e),Pc(e),i&512&&n!==null&&hc(n,n.return),e.flags&32){var a=e.stateNode;try{Ne(a,``)}catch(t){X(e,e.return,t)}}if(i&4&&(a=e.stateNode,a!=null)){var o=e.memoizedProps,s=n===null?o:n.memoizedProps,c=e.type,l=e.updateQueue;if(e.updateQueue=null,l!==null)try{c===`input`&&o.type===`radio`&&o.name!=null&&ye(a,o),Be(c,s);var u=Be(c,o);for(s=0;s<l.length;s+=2){var d=l[s],f=l[s+1];d===`style`?Le(a,f):d===`dangerouslySetInnerHTML`?Me(a,f):d===`children`?Ne(a,f):b(a,d,f,u)}switch(c){case`input`:be(a,o);break;case`textarea`:De(a,o);break;case`select`:var p=a._wrapperState.wasMultiple;a._wrapperState.wasMultiple=!!o.multiple;var m=o.value;m==null?p!==!!o.multiple&&(o.defaultValue==null?we(a,!!o.multiple,o.multiple?[]:``,!1):we(a,!!o.multiple,o.defaultValue,!0)):we(a,!!o.multiple,m,!1)}a[Ii]=o}catch(t){X(e,e.return,t)}}break;case 6:if(Mc(t,e),Pc(e),i&4){if(e.stateNode===null)throw Error(r(162));a=e.stateNode,o=e.memoizedProps;try{a.nodeValue=o}catch(t){X(e,e.return,t)}}break;case 3:if(Mc(t,e),Pc(e),i&4&&n!==null&&n.memoizedState.isDehydrated)try{hn(t.containerInfo)}catch(t){X(e,e.return,t)}break;case 4:Mc(t,e),Pc(e);break;case 13:Mc(t,e),Pc(e),a=e.child,a.flags&8192&&(o=a.memoizedState!==null,a.stateNode.isHidden=o,!o||a.alternate!==null&&a.alternate.memoizedState!==null||(nl=P())),i&4&&jc(e);break;case 22:if(d=n!==null&&n.memoizedState!==null,e.mode&1?(pc=(u=pc)||d,Mc(t,e),pc=u):Mc(t,e),Pc(e),i&8192){if(u=e.memoizedState!==null,(e.stateNode.isHidden=u)&&!d&&e.mode&1)for(q=e,d=e.child;d!==null;){for(f=q=d;q!==null;){switch(p=q,m=p.child,p.tag){case 0:case 11:case 14:case 15:yc(4,p,p.return);break;case 1:hc(p,p.return);var h=p.stateNode;if(typeof h.componentWillUnmount==`function`){i=p,n=p.return;try{t=i,h.props=t.memoizedProps,h.state=t.memoizedState,h.componentWillUnmount()}catch(e){X(i,n,e)}}break;case 5:hc(p,p.return);break;case 22:if(p.memoizedState!==null){Rc(f);continue}}m===null?Rc(f):(m.return=p,q=m)}d=d.sibling}a:for(d=null,f=e;;){if(f.tag===5){if(d===null){d=f;try{a=f.stateNode,u?(o=a.style,typeof o.setProperty==`function`?o.setProperty(`display`,`none`,`important`):o.display=`none`):(c=f.stateNode,l=f.memoizedProps.style,s=l!=null&&l.hasOwnProperty(`display`)?l.display:null,c.style.display=Ie(`display`,s))}catch(t){X(e,e.return,t)}}}else if(f.tag===6){if(d===null)try{f.stateNode.nodeValue=u?``:f.memoizedProps}catch(t){X(e,e.return,t)}}else if((f.tag!==22&&f.tag!==23||f.memoizedState===null||f===e)&&f.child!==null){f.child.return=f,f=f.child;continue}if(f===e)break a;for(;f.sibling===null;){if(f.return===null||f.return===e)break a;d===f&&(d=null),f=f.return}d===f&&(d=null),f.sibling.return=f.return,f=f.sibling}}break;case 19:Mc(t,e),Pc(e),i&4&&jc(e);break;case 21:break;default:Mc(t,e),Pc(e)}}function Pc(e){var t=e.flags;if(t&2){try{a:{for(var n=e.return;n!==null;){if(Cc(n)){var i=n;break a}n=n.return}throw Error(r(160))}switch(i.tag){case 5:var a=i.stateNode;i.flags&32&&(Ne(a,``),i.flags&=-33),Ec(e,wc(e),a);break;case 3:case 4:var o=i.stateNode.containerInfo;Tc(e,wc(e),o);break;default:throw Error(r(161))}}catch(t){X(e,e.return,t)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Fc(e,t,n){q=e,Ic(e,t,n)}function Ic(e,t,n){for(var r=(e.mode&1)!=0;q!==null;){var i=q,a=i.child;if(i.tag===22&&r){var o=i.memoizedState!==null||fc;if(!o){var s=i.alternate,c=s!==null&&s.memoizedState!==null||pc;s=fc;var l=pc;if(fc=o,(pc=c)&&!l)for(q=i;q!==null;)o=q,c=o.child,o.tag===22&&o.memoizedState!==null||c===null?zc(i):(c.return=o,q=c);for(;a!==null;)q=a,Ic(a,t,n),a=a.sibling;q=i,fc=s,pc=l}Lc(e,t,n)}else i.subtreeFlags&8772&&a!==null?(a.return=i,q=a):Lc(e,t,n)}}function Lc(e){for(;q!==null;){var t=q;if(t.flags&8772){var n=t.alternate;try{if(t.flags&8772)switch(t.tag){case 0:case 11:case 15:pc||bc(5,t);break;case 1:var i=t.stateNode;if(t.flags&4&&!pc)if(n===null)i.componentDidMount();else{var a=t.elementType===t.type?n.memoizedProps:bs(t.type,n.memoizedProps);i.componentDidUpdate(a,n.memoizedState,i.__reactInternalSnapshotBeforeUpdate)}var o=t.updateQueue;o!==null&&uo(t,o,i);break;case 3:var s=t.updateQueue;if(s!==null){if(n=null,t.child!==null)switch(t.child.tag){case 5:n=t.child.stateNode;break;case 1:n=t.child.stateNode}uo(t,s,n)}break;case 5:var c=t.stateNode;if(n===null&&t.flags&4){n=c;var l=t.memoizedProps;switch(t.type){case`button`:case`input`:case`select`:case`textarea`:l.autoFocus&&n.focus();break;case`img`:l.src&&(n.src=l.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var u=t.alternate;if(u!==null){var d=u.memoizedState;if(d!==null){var f=d.dehydrated;f!==null&&hn(f)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(r(163))}pc||t.flags&512&&xc(t)}catch(e){X(t,t.return,e)}}if(t===e){q=null;break}if(n=t.sibling,n!==null){n.return=t.return,q=n;break}q=t.return}}function Rc(e){for(;q!==null;){var t=q;if(t===e){q=null;break}var n=t.sibling;if(n!==null){n.return=t.return,q=n;break}q=t.return}}function zc(e){for(;q!==null;){var t=q;try{switch(t.tag){case 0:case 11:case 15:var n=t.return;try{bc(4,t)}catch(e){X(t,n,e)}break;case 1:var r=t.stateNode;if(typeof r.componentDidMount==`function`){var i=t.return;try{r.componentDidMount()}catch(e){X(t,i,e)}}var a=t.return;try{xc(t)}catch(e){X(t,a,e)}break;case 5:var o=t.return;try{xc(t)}catch(e){X(t,o,e)}}}catch(e){X(t,t.return,e)}if(t===e){q=null;break}var s=t.sibling;if(s!==null){s.return=t.return,q=s;break}q=t.return}}var Bc=Math.ceil,Vc=x.ReactCurrentDispatcher,Hc=x.ReactCurrentOwner,Uc=x.ReactCurrentBatchConfig,J=0,Wc=null,Gc=null,Kc=0,qc=0,Jc=qi(0),Yc=0,Xc=null,Zc=0,Qc=0,$c=0,el=null,tl=null,nl=0,rl=1/0,il=null,al=!1,ol=null,sl=null,cl=!1,ll=null,ul=0,dl=0,fl=null,pl=-1,ml=0;function hl(){return J&6?P():pl===-1?pl=P():pl}function gl(e){return e.mode&1?J&2&&Kc!==0?Kc&-Kc:Ia.transition===null?(e=F,e===0?(e=window.event,e=e===void 0?16:Cn(e.type),e):e):(ml===0&&(ml=Bt()),ml):1}function _l(e,t,n,i){if(50<dl)throw dl=0,fl=null,Error(r(185));Ht(e,n,i),(!(J&2)||e!==Wc)&&(e===Wc&&(!(J&2)&&(Qc|=n),Yc===4&&Cl(e,Kc)),vl(e,i),n===1&&J===0&&!(t.mode&1)&&(rl=P()+500,oa&&ua()))}function vl(e,t){var n=e.callbackNode;Rt(e,t);var r=It(e,e===Wc?Kc:0);if(r===0)n!==null&&_t(n),e.callbackNode=null,e.callbackPriority=0;else if(t=r&-r,e.callbackPriority!==t){if(n!=null&&_t(n),t===1)e.tag===0?la(wl.bind(null,e)):ca(wl.bind(null,e)),ki(function(){!(J&6)&&ua()}),n=null;else{switch(Gt(r)){case 1:n=xt;break;case 4:n=St;break;case 16:n=Ct;break;case 536870912:n=Tt;break;default:n=Ct}n=ql(n,yl.bind(null,e))}e.callbackPriority=t,e.callbackNode=n}}function yl(e,t){if(pl=-1,ml=0,J&6)throw Error(r(327));var n=e.callbackNode;if(Bl()&&e.callbackNode!==n)return null;var i=It(e,e===Wc?Kc:0);if(i===0)return null;if(i&30||(i&e.expiredLanes)!==0||t)t=Nl(e,i);else{t=i;var a=J;J|=2;var o=jl();(Wc!==e||Kc!==t)&&(il=null,rl=P()+500,Al(e,t));do try{Fl();break}catch(t){Y(e,t)}while(1);qa(),Vc.current=o,J=a,Gc===null?(Wc=null,Kc=0,t=Yc):t=0}if(t!==0){if(t===2&&(a=zt(e),a!==0&&(i=a,t=bl(e,a))),t===1)throw n=Xc,Al(e,0),Cl(e,i),vl(e,P()),n;if(t===6)Cl(e,i);else{if(a=e.current.alternate,!(i&30)&&!Sl(a)&&(t=Nl(e,i),t===2&&(o=zt(e),o!==0&&(i=o,t=bl(e,o))),t===1))throw n=Xc,Al(e,0),Cl(e,i),vl(e,P()),n;switch(e.finishedWork=a,e.finishedLanes=i,t){case 0:case 1:throw Error(r(345));case 2:Rl(e,tl,il);break;case 3:if(Cl(e,i),(i&130023424)===i&&(t=nl+500-P(),10<t)){if(It(e,0)!==0)break;if(a=e.suspendedLanes,(a&i)!==i){hl(),e.pingedLanes|=e.suspendedLanes&a;break}e.timeoutHandle=Ei(Rl.bind(null,e,tl,il),t);break}Rl(e,tl,il);break;case 4:if(Cl(e,i),(i&4194240)===i)break;for(t=e.eventTimes,a=-1;0<i;){var s=31-kt(i);o=1<<s,s=t[s],s>a&&(a=s),i&=~o}if(i=a,i=P()-i,i=(120>i?120:480>i?480:1080>i?1080:1920>i?1920:3e3>i?3e3:4320>i?4320:1960*Bc(i/1960))-i,10<i){e.timeoutHandle=Ei(Rl.bind(null,e,tl,il),i);break}Rl(e,tl,il);break;case 5:Rl(e,tl,il);break;default:throw Error(r(329))}}}return vl(e,P()),e.callbackNode===n?yl.bind(null,e):null}function bl(e,t){var n=el;return e.current.memoizedState.isDehydrated&&(Al(e,t).flags|=256),e=Nl(e,t),e!==2&&(t=tl,tl=n,t!==null&&xl(t)),e}function xl(e){tl===null?tl=e:tl.push.apply(tl,e)}function Sl(e){for(var t=e;;){if(t.flags&16384){var n=t.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var i=n[r],a=i.getSnapshot;i=i.value;try{if(!jr(a(),i))return!1}catch{return!1}}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Cl(e,t){for(t&=~$c,t&=~Qc,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var n=31-kt(t),r=1<<n;e[n]=-1,t&=~r}}function wl(e){if(J&6)throw Error(r(327));Bl();var t=It(e,0);if(!(t&1))return vl(e,P()),null;var n=Nl(e,t);if(e.tag!==0&&n===2){var i=zt(e);i!==0&&(t=i,n=bl(e,i))}if(n===1)throw n=Xc,Al(e,0),Cl(e,t),vl(e,P()),n;if(n===6)throw Error(r(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,Rl(e,tl,il),vl(e,P()),null}function El(e,t){var n=J;J|=1;try{return e(t)}finally{J=n,J===0&&(rl=P()+500,oa&&ua())}}function Ol(e){ll!==null&&ll.tag===0&&!(J&6)&&Bl();var t=J;J|=1;var n=Uc.transition,r=F;try{if(Uc.transition=null,F=1,e)return e()}finally{F=r,Uc.transition=n,J=t,!(J&6)&&ua()}}function kl(){qc=Jc.current,z(Jc)}function Al(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,Di(n)),Gc!==null)for(n=Gc.return;n!==null;){var r=n;switch(Ca(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&ea();break;case 3:vo(),z(Xi),z(Yi),Co();break;case 5:bo(r);break;case 4:vo();break;case 13:z(H);break;case 19:z(H);break;case 10:Ja(r.type._context);break;case 22:case 23:kl()}n=n.return}if(Wc=e,Gc=e=Ql(e.current,null),Kc=qc=t,Yc=0,Xc=null,$c=Qc=Zc=0,tl=el=null,Qa!==null){for(t=0;t<Qa.length;t++)if(n=Qa[t],r=n.interleaved,r!==null){n.interleaved=null;var i=r.next,a=n.pending;if(a!==null){var o=a.next;a.next=i,r.next=o}n.pending=r}Qa=null}return e}function Y(e,t){do{var n=Gc;try{if(qa(),wo.current=gs,ko){for(var i=U.memoizedState;i!==null;){var a=i.queue;a!==null&&(a.pending=null),i=i.next}ko=!1}if(Eo=0,Oo=Do=U=null,Ao=!1,jo=0,Hc.current=null,n===null||n.return===null){Yc=1,Xc=t,Gc=null;break}a:{var o=e,s=n.return,c=n,l=t;if(t=Kc,c.flags|=32768,typeof l==`object`&&l&&typeof l.then==`function`){var u=l,d=c,f=d.tag;if(!(d.mode&1)&&(f===0||f===11||f===15)){var p=d.alternate;p?(d.updateQueue=p.updateQueue,d.memoizedState=p.memoizedState,d.lanes=p.lanes):(d.updateQueue=null,d.memoizedState=null)}var m=Ms(s);if(m!==null){m.flags&=-257,Ns(m,s,c,o,t),m.mode&1&&K(o,u,t),t=m,l=u;var h=t.updateQueue;if(h===null){var g=new Set;g.add(l),t.updateQueue=g}else h.add(l);break a}else{if(!(t&1)){K(o,u,t),Ml();break a}l=Error(r(426))}}else if(V&&c.mode&1){var _=Ms(s);if(_!==null){!(_.flags&65536)&&(_.flags|=256),Ns(_,s,c,o,t),Fa(Ds(l,c));break a}}o=l=Ds(l,c),Yc!==4&&(Yc=2),el===null?el=[o]:el.push(o),o=s;do{switch(o.tag){case 3:o.flags|=65536,t&=-t,o.lanes|=t;var v=As(o,l,t);co(o,v);break a;case 1:c=l;var y=o.type,b=o.stateNode;if(!(o.flags&128)&&(typeof y.getDerivedStateFromError==`function`||b!==null&&typeof b.componentDidCatch==`function`&&(sl===null||!sl.has(b)))){o.flags|=65536,t&=-t,o.lanes|=t;var x=js(o,c,t);co(o,x);break a}}o=o.return}while(o!==null)}Ll(n)}catch(e){t=e,Gc===n&&n!==null&&(Gc=n=n.return);continue}break}while(1)}function jl(){var e=Vc.current;return Vc.current=gs,e===null?gs:e}function Ml(){(Yc===0||Yc===3||Yc===2)&&(Yc=4),Wc===null||!(Zc&268435455)&&!(Qc&268435455)||Cl(Wc,Kc)}function Nl(e,t){var n=J;J|=2;var i=jl();(Wc!==e||Kc!==t)&&(il=null,Al(e,t));do try{Pl();break}catch(t){Y(e,t)}while(1);if(qa(),J=n,Vc.current=i,Gc!==null)throw Error(r(261));return Wc=null,Kc=0,Yc}function Pl(){for(;Gc!==null;)Il(Gc)}function Fl(){for(;Gc!==null&&!vt();)Il(Gc)}function Il(e){var t=Kl(e.alternate,e,qc);e.memoizedProps=e.pendingProps,t===null?Ll(e):Gc=t,Hc.current=null}function Ll(e){var t=e;do{var n=t.alternate;if(e=t.return,t.flags&32768){if(n=dc(n,t),n!==null){n.flags&=32767,Gc=n;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{Yc=6,Gc=null;return}}else if(n=uc(n,t,qc),n!==null){Gc=n;return}if(t=t.sibling,t!==null){Gc=t;return}Gc=t=e}while(t!==null);Yc===0&&(Yc=5)}function Rl(e,t,n){var r=F,i=Uc.transition;try{Uc.transition=null,F=1,zl(e,t,n,r)}finally{Uc.transition=i,F=r}return null}function zl(e,t,n,i){do Bl();while(ll!==null);if(J&6)throw Error(r(327));n=e.finishedWork;var a=e.finishedLanes;if(n===null)return null;if(e.finishedWork=null,e.finishedLanes=0,n===e.current)throw Error(r(177));e.callbackNode=null,e.callbackPriority=0;var o=n.lanes|n.childLanes;if(Ut(e,o),e===Wc&&(Gc=Wc=null,Kc=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||cl||(cl=!0,ql(Ct,function(){return Bl(),null})),o=(n.flags&15990)!=0,n.subtreeFlags&15990||o){o=Uc.transition,Uc.transition=null;var s=F;F=1;var c=J;J|=4,Hc.current=null,vc(e,n),Nc(n,e),Rr(wi),_n=!!Ci,wi=Ci=null,e.current=n,Fc(n,e,a),yt(),J=c,F=s,Uc.transition=o}else e.current=n;if(cl&&(cl=!1,ll=e,ul=a),o=e.pendingLanes,o===0&&(sl=null),Ot(n.stateNode,i),vl(e,P()),t!==null)for(i=e.onRecoverableError,n=0;n<t.length;n++)a=t[n],i(a.value,{componentStack:a.stack,digest:a.digest});if(al)throw al=!1,e=ol,ol=null,e;return ul&1&&e.tag!==0&&Bl(),o=e.pendingLanes,o&1?e===fl?dl++:(dl=0,fl=e):dl=0,ua(),null}function Bl(){if(ll!==null){var e=Gt(ul),t=Uc.transition,n=F;try{if(Uc.transition=null,F=16>e?16:e,ll===null)var i=!1;else{if(e=ll,ll=null,ul=0,J&6)throw Error(r(331));var a=J;for(J|=4,q=e.current;q!==null;){var o=q,s=o.child;if(q.flags&16){var c=o.deletions;if(c!==null){for(var l=0;l<c.length;l++){var u=c[l];for(q=u;q!==null;){var d=q;switch(d.tag){case 0:case 11:case 15:yc(8,d,o)}var f=d.child;if(f!==null)f.return=d,q=f;else for(;q!==null;){d=q;var p=d.sibling,m=d.return;if(Sc(d),d===u){q=null;break}if(p!==null){p.return=m,q=p;break}q=m}}}var h=o.alternate;if(h!==null){var g=h.child;if(g!==null){h.child=null;do{var _=g.sibling;g.sibling=null,g=_}while(g!==null)}}q=o}}if(o.subtreeFlags&2064&&s!==null)s.return=o,q=s;else b:for(;q!==null;){if(o=q,o.flags&2048)switch(o.tag){case 0:case 11:case 15:yc(9,o,o.return)}var v=o.sibling;if(v!==null){v.return=o.return,q=v;break b}q=o.return}}var y=e.current;for(q=y;q!==null;){s=q;var b=s.child;if(s.subtreeFlags&2064&&b!==null)b.return=s,q=b;else b:for(s=y;q!==null;){if(c=q,c.flags&2048)try{switch(c.tag){case 0:case 11:case 15:bc(9,c)}}catch(e){X(c,c.return,e)}if(c===s){q=null;break b}var x=c.sibling;if(x!==null){x.return=c.return,q=x;break b}q=c.return}}if(J=a,ua(),Dt&&typeof Dt.onPostCommitFiberRoot==`function`)try{Dt.onPostCommitFiberRoot(Et,e)}catch{}i=!0}return i}finally{F=n,Uc.transition=t}}return!1}function Vl(e,t,n){t=Ds(n,t),t=As(e,t,1),e=oo(e,t,1),t=hl(),e!==null&&(Ht(e,1,t),vl(e,t))}function X(e,t,n){if(e.tag===3)Vl(e,e,n);else for(;t!==null;){if(t.tag===3){Vl(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError==`function`||typeof r.componentDidCatch==`function`&&(sl===null||!sl.has(r))){e=Ds(n,e),e=js(t,e,1),t=oo(t,e,1),e=hl(),t!==null&&(Ht(t,1,e),vl(t,e));break}}t=t.return}}function Hl(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),t=hl(),e.pingedLanes|=e.suspendedLanes&n,Wc===e&&(Kc&n)===n&&(Yc===4||Yc===3&&(Kc&130023424)===Kc&&500>P()-nl?Al(e,0):$c|=n),vl(e,t)}function Ul(e,t){t===0&&(e.mode&1?(t=Pt,Pt<<=1,!(Pt&130023424)&&(Pt=4194304)):t=1);var n=hl();e=to(e,t),e!==null&&(Ht(e,t,n),vl(e,n))}function Wl(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),Ul(e,n)}function Gl(e,t){var n=0;switch(e.tag){case 13:var i=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:i=e.stateNode;break;default:throw Error(r(314))}i!==null&&i.delete(t),Ul(e,n)}var Kl=function(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps||Xi.current)Fs=!0;else{if((e.lanes&n)===0&&!(t.flags&128))return Fs=!1,ic(e,t,n);Fs=!!(e.flags&131072)}else Fs=!1,V&&t.flags&1048576&&xa(t,ma,t.index);switch(t.lanes=0,t.tag){case 2:var i=t.type;nc(e,t),e=t.pendingProps;var a=Qi(t,Yi.current);Xa(t,n),a=Po(null,t,i,e,a,n);var o=Fo();return t.flags|=1,typeof a==`object`&&a&&typeof a.render==`function`&&a.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,$i(i)?(o=!0,ra(t)):o=!1,t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,ro(t),a.updater=Ss,t.stateNode=a,a._reactInternals=t,Es(t,i,e,n),t=Ws(null,t,i,!0,o,n)):(t.tag=0,V&&o&&Sa(t),Is(null,t,a,n),t=t.child),t;case 16:i=t.elementType;a:{switch(nc(e,t),e=t.pendingProps,a=i._init,i=a(i._payload),t.type=i,a=t.tag=Zl(i),e=bs(i,e),a){case 0:t=Hs(null,t,i,e,n);break a;case 1:t=Us(null,t,i,e,n);break a;case 11:t=Ls(null,t,i,e,n);break a;case 14:t=Rs(null,t,i,bs(i.type,e),n);break a}throw Error(r(306,i,``))}return t;case 0:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:bs(i,a),Hs(e,t,i,a,n);case 1:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:bs(i,a),Us(e,t,i,a,n);case 3:a:{if(Gs(t),e===null)throw Error(r(387));i=t.pendingProps,o=t.memoizedState,a=o.element,io(e,t),lo(t,i,null,n);var s=t.memoizedState;if(i=s.element,o.isDehydrated)if(o={element:i,isDehydrated:!1,cache:s.cache,pendingSuspenseBoundaries:s.pendingSuspenseBoundaries,transitions:s.transitions},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){a=Ds(Error(r(423)),t),t=Ks(e,t,i,n,a);break a}else if(i!==a){a=Ds(Error(r(424)),t),t=Ks(e,t,i,n,a);break a}else for(Ta=Mi(t.stateNode.containerInfo.firstChild),wa=t,V=!0,Ea=null,n=Ha(t,null,i,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Pa(),i===a){t=rc(e,t,n);break a}Is(e,t,i,n)}t=t.child}return t;case 5:return yo(t),e===null&&Aa(t),i=t.type,a=t.pendingProps,o=e===null?null:e.memoizedProps,s=a.children,Ti(i,a)?s=null:o!==null&&Ti(i,o)&&(t.flags|=32),Vs(e,t),Is(e,t,s,n),t.child;case 6:return e===null&&Aa(t),null;case 13:return Ys(e,t,n);case 4:return _o(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=Va(t,null,i,n):Is(e,t,i,n),t.child;case 11:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:bs(i,a),Ls(e,t,i,a,n);case 7:return Is(e,t,t.pendingProps,n),t.child;case 8:return Is(e,t,t.pendingProps.children,n),t.child;case 12:return Is(e,t,t.pendingProps.children,n),t.child;case 10:a:{if(i=t.type._context,a=t.pendingProps,o=t.memoizedProps,s=a.value,B(Ua,i._currentValue),i._currentValue=s,o!==null)if(jr(o.value,s)){if(o.children===a.children&&!Xi.current){t=rc(e,t,n);break a}}else for(o=t.child,o!==null&&(o.return=t);o!==null;){var c=o.dependencies;if(c!==null){s=o.child;for(var l=c.firstContext;l!==null;){if(l.context===i){if(o.tag===1){l=ao(-1,n&-n),l.tag=2;var u=o.updateQueue;if(u!==null){u=u.shared;var d=u.pending;d===null?l.next=l:(l.next=d.next,d.next=l),u.pending=l}}o.lanes|=n,l=o.alternate,l!==null&&(l.lanes|=n),Ya(o.return,n,t),c.lanes|=n;break}l=l.next}}else if(o.tag===10)s=o.type===t.type?null:o.child;else if(o.tag===18){if(s=o.return,s===null)throw Error(r(341));s.lanes|=n,c=s.alternate,c!==null&&(c.lanes|=n),Ya(s,n,t),s=o.sibling}else s=o.child;if(s!==null)s.return=o;else for(s=o;s!==null;){if(s===t){s=null;break}if(o=s.sibling,o!==null){o.return=s.return,s=o;break}s=s.return}o=s}Is(e,t,a.children,n),t=t.child}return t;case 9:return a=t.type,i=t.pendingProps.children,Xa(t,n),a=Za(a),i=i(a),t.flags|=1,Is(e,t,i,n),t.child;case 14:return i=t.type,a=bs(i,t.pendingProps),a=bs(i.type,a),Rs(e,t,i,a,n);case 15:return zs(e,t,t.type,t.pendingProps,n);case 17:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:bs(i,a),nc(e,t),t.tag=1,$i(i)?(e=!0,ra(t)):e=!1,Xa(t,n),ws(t,i,a),Es(t,i,a,n),Ws(null,t,i,!0,e,n);case 19:return tc(e,t,n);case 22:return Bs(e,t,n)}throw Error(r(156,t.tag))};function ql(e,t){return gt(e,t)}function Jl(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Yl(e,t,n,r){return new Jl(e,t,n,r)}function Xl(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Zl(e){if(typeof e==`function`)return Xl(e)?1:0;if(e!=null){if(e=e.$$typeof,e===O)return 11;if(e===te)return 14}return 2}function Ql(e,t){var n=e.alternate;return n===null?(n=Yl(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&14680064,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function $l(e,t,n,i,a,o){var s=2;if(i=e,typeof e==`function`)Xl(e)&&(s=1);else if(typeof e==`string`)s=5;else a:switch(e){case w:return eu(n.children,a,o,t);case T:s=8,a|=8;break;case ee:return e=Yl(12,n,t,a|2),e.elementType=ee,e.lanes=o,e;case k:return e=Yl(13,n,t,a),e.elementType=k,e.lanes=o,e;case A:return e=Yl(19,n,t,a),e.elementType=A,e.lanes=o,e;case M:return tu(n,a,o,t);default:if(typeof e==`object`&&e)switch(e.$$typeof){case E:s=10;break a;case D:s=9;break a;case O:s=11;break a;case te:s=14;break a;case j:s=16,i=null;break a}throw Error(r(130,e==null?e:typeof e,``))}return t=Yl(s,n,t,a),t.elementType=e,t.type=i,t.lanes=o,t}function eu(e,t,n,r){return e=Yl(7,e,r,t),e.lanes=n,e}function tu(e,t,n,r){return e=Yl(22,e,r,t),e.elementType=M,e.lanes=n,e.stateNode={isHidden:!1},e}function nu(e,t,n){return e=Yl(6,e,null,t),e.lanes=n,e}function ru(e,t,n){return t=Yl(4,e.children===null?[]:e.children,e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function iu(e,t,n,r,i){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Vt(0),this.expirationTimes=Vt(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Vt(0),this.identifierPrefix=r,this.onRecoverableError=i,this.mutableSourceEagerHydrationData=null}function au(e,t,n,r,i,a,o,s,c){return e=new iu(e,t,n,s,c),t===1?(t=1,!0===a&&(t|=8)):t=0,a=Yl(3,null,null,t),e.current=a,a.stateNode=e,a.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},ro(a),e}function ou(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:C,key:r==null?null:``+r,children:e,containerInfo:t,implementation:n}}function su(e){if(!e)return Ji;e=e._reactInternals;a:{if(ut(e)!==e||e.tag!==1)throw Error(r(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break a;case 1:if($i(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break a}}t=t.return}while(t!==null);throw Error(r(171))}if(e.tag===1){var n=e.type;if($i(n))return na(e,n,t)}return t}function cu(e,t,n,r,i,a,o,s,c){return e=au(n,r,!0,e,i,a,o,s,c),e.context=su(null),n=e.current,r=hl(),i=gl(n),a=ao(r,i),a.callback=t??null,oo(n,a,i),e.current.lanes=i,Ht(e,i,r),vl(e,r),e}function lu(e,t,n,r){var i=t.current,a=hl(),o=gl(i);return n=su(n),t.context===null?t.context=n:t.pendingContext=n,t=ao(a,o),t.payload={element:e},r=r===void 0?null:r,r!==null&&(t.callback=r),e=oo(i,t,o),e!==null&&(_l(e,i,o,a),so(e,i,o)),o}function uu(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function du(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function fu(e,t){du(e,t),(e=e.alternate)&&du(e,t)}function pu(){return null}var Z=typeof reportError==`function`?reportError:function(e){console.error(e)};function mu(e){this._internalRoot=e}hu.prototype.render=mu.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(r(409));lu(e,t,null,null)},hu.prototype.unmount=mu.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Ol(function(){lu(null,e,null,null)}),t[Li]=null}};function hu(e){this._internalRoot=e}hu.prototype.unstable_scheduleHydration=function(e){if(e){var t=Yt();e={blockedOn:null,target:e,priority:t};for(var n=0;n<an.length&&t!==0&&t<an[n].priority;n++);an.splice(n,0,e),n===0&&un(e)}};function gu(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function _u(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==` react-mount-point-unstable `))}function vu(){}function yu(e,t,n,r,i){if(i){if(typeof r==`function`){var a=r;r=function(){var e=uu(o);a.call(e)}}var o=cu(t,r,e,0,null,!1,!1,``,vu);return e._reactRootContainer=o,e[Li]=o.current,di(e.nodeType===8?e.parentNode:e),Ol(),o}for(;i=e.lastChild;)e.removeChild(i);if(typeof r==`function`){var s=r;r=function(){var e=uu(c);s.call(e)}}var c=au(e,0,!1,null,null,!1,!1,``,vu);return e._reactRootContainer=c,e[Li]=c.current,di(e.nodeType===8?e.parentNode:e),Ol(function(){lu(t,c,n,r)}),c}function bu(e,t,n,r,i){var a=n._reactRootContainer;if(a){var o=a;if(typeof i==`function`){var s=i;i=function(){var e=uu(o);s.call(e)}}lu(t,o,e,i)}else o=yu(n,t,e,i,r);return uu(o)}Kt=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var n=Ft(t.pendingLanes);n!==0&&(Wt(t,n|1),vl(t,P()),!(J&6)&&(rl=P()+500,ua()))}break;case 13:Ol(function(){var t=to(e,1);t!==null&&_l(t,e,1,hl())}),fu(e,1)}},qt=function(e){if(e.tag===13){var t=to(e,134217728);t!==null&&_l(t,e,134217728,hl()),fu(e,134217728)}},Jt=function(e){if(e.tag===13){var t=gl(e),n=to(e,t);n!==null&&_l(n,e,t,hl()),fu(e,t)}},Yt=function(){return F},Xt=function(e,t){var n=F;try{return F=e,t()}finally{F=n}},Ue=function(e,t,n){switch(t){case`input`:if(be(e,n),t=n.name,n.type===`radio`&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll(`input[name=`+JSON.stringify(``+t)+`][type="radio"]`),t=0;t<n.length;t++){var i=n[t];if(i!==e&&i.form===e.form){var a=Wi(i);if(!a)throw Error(r(90));he(i),be(i,a)}}}break;case`textarea`:De(e,n);break;case`select`:t=n.value,t!=null&&we(e,!!n.multiple,t,!1)}},Ye=El,Xe=Ol;var xu={usingClientEntryPoint:!1,Events:[Hi,Ui,Wi,qe,Je,El]},Su={findFiberByHostInstance:Vi,bundleType:0,version:`18.3.1`,rendererPackageName:`react-dom`},Cu={bundleType:Su.bundleType,version:Su.version,rendererPackageName:Su.rendererPackageName,rendererConfig:Su.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:x.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=mt(e),e===null?null:e.stateNode},findFiberByHostInstance:Su.findFiberByHostInstance||pu,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:`18.3.1-next-f1338f8080-20240426`};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`){var wu=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!wu.isDisabled&&wu.supportsFiber)try{Et=wu.inject(Cu),Dt=wu}catch{}}e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=xu,e.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!gu(t))throw Error(r(200));return ou(e,t,null,n)},e.createRoot=function(e,t){if(!gu(e))throw Error(r(299));var n=!1,i=``,a=Z;return t!=null&&(!0===t.unstable_strictMode&&(n=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onRecoverableError!==void 0&&(a=t.onRecoverableError)),t=au(e,1,!1,null,null,n,!1,i,a),e[Li]=t.current,di(e.nodeType===8?e.parentNode:e),new mu(t)},e.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render==`function`?Error(r(188)):(e=Object.keys(e).join(`,`),Error(r(268,e)));return e=mt(t),e=e===null?null:e.stateNode,e},e.flushSync=function(e){return Ol(e)},e.hydrate=function(e,t,n){if(!_u(t))throw Error(r(200));return bu(null,e,t,!0,n)},e.hydrateRoot=function(e,t,n){if(!gu(e))throw Error(r(405));var i=n!=null&&n.hydratedSources||null,a=!1,o=``,s=Z;if(n!=null&&(!0===n.unstable_strictMode&&(a=!0),n.identifierPrefix!==void 0&&(o=n.identifierPrefix),n.onRecoverableError!==void 0&&(s=n.onRecoverableError)),t=cu(t,null,e,1,n??null,a,!1,o,s),e[Li]=t.current,di(e),i)for(e=0;e<i.length;e++)n=i[e],a=n._getVersion,a=a(n._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[n,a]:t.mutableSourceEagerHydrationData.push(n,a);return new hu(t)},e.render=function(e,t,n){if(!_u(t))throw Error(r(200));return bu(null,e,t,!1,n)},e.unmountComponentAtNode=function(e){if(!_u(e))throw Error(r(40));return e._reactRootContainer?(Ol(function(){bu(null,null,e,!1,function(){e._reactRootContainer=null,e[Li]=null})}),!0):!1},e.unstable_batchedUpdates=El,e.unstable_renderSubtreeIntoContainer=function(e,t,n,i){if(!_u(n))throw Error(r(200));if(e==null||e._reactInternals===void 0)throw Error(r(38));return bu(e,t,n,!1,i)},e.version=`18.3.1-next-f1338f8080-20240426`})),kl=x(((e,t)=>{function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>`u`||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!=`function`))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=Ol()})),Al=x((e=>{var t=kl();e.createRoot=t.createRoot,e.hydrateRoot=t.hydrateRoot}))(),Y=C(Tl(),1),jl=`https://github.com/visgl/luma.gl/tree/master`,Ml=420,Nl=280,Pl=160,Fl=20,Il=12,Ll=10,Rl=30,zl={boxSizing:`border-box`,width:420,minWidth:0,maxWidth:`100%`,overflow:`hidden`,zIndex:10},Bl=!0,Vl=class extends So{className=`luma-info-box-panel-container`;placement=`top-left`;infoBoxProps;hostElement=null;reactRoot=null;constructor(e){super({panel:e.panel,placement:`top-left`}),this.infoBoxProps=e}setInfoBoxProps(e){this.infoBoxProps=e,this.setProps({panel:e.panel})}renderReact(){return Y.createElement(X,this.infoBoxProps)}onRenderHTML(e){this.hostElement!==e&&(this.reactRoot?.unmount(),this.hostElement=e,this.reactRoot=(0,Al.createRoot)(e)),this.reactRoot?.render(this.renderReact())}onRemove(){this.reactRoot?.unmount(),this.reactRoot=null,this.hostElement=null}};function X(e){let t=e.appearance??`cinematic`,n=xc[t],r=ql(e),i=Y.useMemo(()=>Jl(e),[e.directory,e.id,e.sourceDirectory,e.sourceFiles,e.sourcePath]),a=i.join(`|`),o=$l(e.id,e.title),[s,c]=(0,Y.useState)(()=>Bl||typeof window<`u`&&window.matchMedia(`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`).matches),[l,u]=(0,Y.useState)(()=>e.extraTabs?.[0]?.id||`info`),[d,f]=(0,Y.useState)(``),[p,m]=(0,Y.useState)(null),[h,g]=(0,Y.useState)(null),[_,v]=(0,Y.useState)(null),y=(0,Y.useRef)(null),b=(0,Y.useRef)(null),x=(0,Y.useRef)(null),S=(0,Y.useRef)(null),[C,w]=(0,Y.useState)(!1),T=Y.useId(),ee=Y.useCallback(e=>{y.current=e,e&&Sc(e,t)},[t]),E=()=>c(e=>!e),D=_?.key===a?_:null;(0,Y.useEffect)(()=>{Bl=s},[s]),(0,Y.useEffect)(()=>{if(l!==`source`||i.length===0||D)return;let t=new AbortController;return Xl(e.websiteBaseUrl,i,t.signal).then(e=>{v({key:a,files:e}),f(e[0]?.path||``)}).catch(e=>{t.signal.aborted||v({key:a,error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>t.abort()},[l,D,e.websiteBaseUrl,i,a]),(0,Y.useEffect)(()=>{let e=b.current;if(!e||i.length===0){w(!1);return}let t=()=>{w(!!e.querySelector(`[data-panel-tabs]`))};t();let n=new MutationObserver(t);return n.observe(e,{childList:!0,subtree:!0}),()=>n.disconnect()},[i.length]),(0,Y.useEffect)(()=>{let n=x.current;if(!(!n||!e.panel))return Bc(n,t),jc(n,e.panel),()=>jc(n,null)},[t,e.panel]),(0,Y.useEffect)(()=>{let e=y.current;if(!e)return;let t=Hl(e),n=()=>{let t=Ul(e);g(e=>Kl(e,t)?e:t),m(e=>e&&Gl(e,t))};n(),window.addEventListener(`resize`,n),window.addEventListener(`scroll`,n,{capture:!0,passive:!0});let r=typeof ResizeObserver>`u`?null:new ResizeObserver(n);return t&&r?.observe(t),()=>{window.removeEventListener(`resize`,n),window.removeEventListener(`scroll`,n,!0),r?.disconnect()}},[s]);let O=e=>{let t=y.current;if(!t)return;let n=t.getBoundingClientRect();S.current={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,startWidth:n.width,startHeight:n.height},e.currentTarget.setPointerCapture(e.pointerId),e.preventDefault()},k=e=>{let t=y.current,n=S.current;!t||!n||n.pointerId!==e.pointerId||m(Wl(t,n.startWidth+e.clientX-n.startX,n.startHeight+e.clientY-n.startY))},A=e=>{S.current?.pointerId===e.pointerId&&(S.current=null,e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId))},te=e=>{let t=y.current;if(!t)return;let n=e.shiftKey?Rl:Ll,r=e.key===`ArrowLeft`?-n:e.key===`ArrowRight`?n:0,i=e.key===`ArrowUp`?-n:e.key===`ArrowDown`?n:0;if(r===0&&i===0)return;let a=t.getBoundingClientRect();m(e=>Wl(t,(e?.width??a.width)+r,(e?.height??a.height)+i)),e.preventDefault()},j=D?.files?.find(e=>e.path===d)||D?.files?.[0],M=D?.error?Y.createElement(`p`,{role:`alert`,style:{margin:0,padding:`12px 14px`,color:t===`cinematic`?`#fda4af`:`#be123c`,fontSize:12,lineHeight:1.5}},D.error):e.renderSource?e.renderSource(j?.source??`// Loading source…`,Zl(j?.path)):Y.createElement(`pre`,null,Y.createElement(`code`,null,j?.source??`// Loading source…`));return Y.createElement(`div`,{ref:ee,className:`luma-example-infobox`,"data-info-box-appearance":t,"data-luma-info-box-collapsed":s?`true`:`false`,style:{...zl,...e.style,display:`flex`,flexDirection:`column`,position:`relative`,width:p?.width??e.style?.width??Ml,height:s?void 0:p?.height??e.style?.height,maxWidth:h?.maxWidth??`100%`,maxHeight:s?void 0:h?.maxHeight}},Y.createElement(`div`,{"data-luma-example-info-header":``,style:{display:`flex`,alignItems:`flex-start`,justifyContent:`space-between`,gap:12}},Y.createElement(`button`,{type:`button`,"aria-label":s?`Expand info box`:`Collapse info box`,"aria-expanded":!s,"aria-controls":T,onClick:E,style:{minWidth:0,flex:`1 1 auto`,padding:0,border:`none`,background:`transparent`,textAlign:`left`,cursor:`pointer`,color:`inherit`}},o?Y.createElement(`span`,{style:{display:`flex`,alignItems:`center`,gap:8}},Y.createElement(`span`,{"aria-hidden":`true`,style:{width:7,height:7,flex:`0 0 7px`,borderRadius:`50%`,background:`var(--luma-example-accent, ${n.accent})`,boxShadow:`0 0 12px var(--luma-example-accent, ${n.accent})`}}),Y.createElement(`h3`,{"data-luma-example-title":``,style:{color:`inherit`,fontSize:22,fontWeight:600,letterSpacing:`-0.022em`,lineHeight:1.3,marginTop:0,marginBottom:0}},o)):null,e.subtitle?Y.createElement(`div`,{"data-luma-example-subtitle":``,style:{color:`var(--luma-example-text-muted, ${n.textMuted})`,fontSize:12,lineHeight:1.4,marginTop:5,paddingLeft:o?15:0}},e.subtitle):null),Y.createElement(`div`,{"data-luma-example-chrome-actions":``,style:{display:`flex`,alignItems:`center`,gap:8,flexShrink:0}},r?Y.createElement(`a`,{"data-luma-example-chrome-action":``,"data-luma-example-source-link":``,href:r,target:`_blank`,rel:`noreferrer`,style:{display:`inline-flex`,alignItems:`center`,gap:5,minHeight:29,padding:`0 8px`,border:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:8,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,color:`var(--luma-example-text-muted, ${n.textMuted})`,fontSize:11,fontWeight:650,textDecoration:`none`}},Y.createElement(`svg`,{"aria-hidden":`true`,viewBox:`0 0 16 16`,width:`13`,height:`13`},Y.createElement(`path`,{d:`M8 1.5a6.5 6.5 0 0 0-2.06 12.67c.33.06.45-.14.45-.32v-1.13c-1.84.4-2.23-.79-2.23-.79-.3-.75-.73-.95-.73-.95-.6-.4.04-.4.04-.4.66.05 1 .68 1 .68.59 1 1.54.71 1.91.54.06-.43.23-.72.41-.89-1.46-.17-3-.72-3-3.24 0-.72.25-1.31.68-1.77-.07-.17-.3-.83.07-1.73 0 0 .56-.18 1.83.68a6.39 6.39 0 0 1 3.33 0c1.27-.86 1.83-.68 1.83-.68.36.9.13 1.56.06 1.73.43.46.69 1.05.69 1.77 0 2.53-1.54 3.07-3.01 3.23.24.21.45.62.45 1.25v1.85c0 .18.12.38.45.32A6.5 6.5 0 0 0 8 1.5Z`,fill:`currentColor`})),Y.createElement(`span`,{"data-luma-example-source-label":``},`GitHub`)):null,Y.createElement(`button`,{"data-luma-example-chrome-action":``,"data-luma-example-info-toggle":``,type:`button`,"aria-label":s?`Expand info box`:`Collapse info box`,"aria-expanded":!s,"aria-controls":T,onClick:E,style:{flexShrink:0,border:`1px solid var(--luma-example-border, ${n.border})`,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,borderRadius:999,color:`var(--luma-example-text, ${n.text})`,minWidth:56,padding:`0 11px`,height:29,fontSize:11,fontWeight:650,lineHeight:1,whiteSpace:`nowrap`,cursor:`pointer`}},s?`Info`:`Hide`))),Y.createElement(`div`,{id:T,hidden:s,"aria-hidden":s,style:{marginTop:s?0:12,minWidth:0,minHeight:0,flex:`1 1 auto`,display:s?`none`:`flex`,flexDirection:`column`,overflowY:`auto`}},(i.length>0||e.extraTabs?.length)&&!C?Y.createElement(`div`,{role:`tablist`,"aria-label":`Example information`,style:{display:`flex`,gap:5,marginBottom:12,paddingBottom:11,borderBottom:`1px solid var(--luma-example-border, ${n.border})`}},[...e.extraTabs||[],{id:`info`,label:`Info`},...i.length?[{id:`source`,label:`Source`}]:[]].map(e=>Y.createElement(`button`,{"data-luma-example-chrome-action":``,key:e.id,type:`button`,role:`tab`,"aria-selected":l===e.id,onClick:()=>u(e.id),style:{border:l===e.id?`1px solid var(--luma-example-accent, ${n.accent})`:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:7,padding:`5px 10px`,background:l===e.id?`color-mix(in srgb, var(--luma-example-accent, ${n.accent}) 15%, var(--luma-example-surface-raised, ${n.surfaceRaised}))`:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,color:l===e.id?`var(--luma-example-accent, ${n.accent})`:`var(--luma-example-text-muted, ${n.textMuted})`,cursor:`pointer`,fontSize:11,fontWeight:l===e.id?700:500}},e.label))):null,e.extraTabs?.map(e=>Y.createElement(`div`,{key:e.id,"data-luma-example-extra-tab":e.id,hidden:l!==e.id,"aria-hidden":l!==e.id,style:{minWidth:0,minHeight:0,flex:`1 1 auto`,overflow:`auto`}})),Y.createElement(`div`,{ref:b,"data-luma-example-info-content":``,hidden:!C&&l!==`info`,"aria-hidden":!C&&l!==`info`,style:{minWidth:0,minHeight:0,flex:`1 1 auto`,overflow:`auto`}},e.html?Y.createElement(`div`,{dangerouslySetInnerHTML:{__html:e.html}}):null,e.children,e.panel?Y.createElement(`div`,{ref:x}):null),i.length>0&&!C?Y.createElement(`div`,{"data-luma-example-source":``,hidden:l!==`source`,"aria-hidden":l!==`source`,style:{border:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:9,minWidth:0,minHeight:0,flex:`1 1 auto`,maxWidth:`100%`,overflow:`auto`,background:`var(--luma-example-surface, ${n.surface})`,color:`var(--luma-example-text, ${n.text})`,colorScheme:t===`cinematic`?`dark`:`light`}},D?.files&&D.files.length>0?Y.createElement(`div`,{role:`tablist`,"aria-label":`Example source files`,style:{alignItems:`center`,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,borderBottom:`1px solid var(--luma-example-border, ${n.border})`,display:`flex`,gap:5,overflowX:`auto`,padding:`8px 9px`}},D.files.map(e=>Y.createElement(`button`,{"data-luma-example-chrome-action":``,key:e.path,type:`button`,role:`tab`,"aria-selected":e.path===j?.path,onClick:()=>f(e.path),style:{background:e.path===j?.path?`var(--luma-example-surface, ${n.surface})`:`transparent`,border:e.path===j?.path?`1px solid var(--luma-example-accent, ${n.accent})`:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:6,color:e.path===j?.path?`var(--luma-example-text, ${n.text})`:`var(--luma-example-text-muted, ${n.textMuted})`,cursor:`pointer`,fontSize:11,fontWeight:e.path===j?.path?700:500,padding:`5px 8px`,whiteSpace:`nowrap`}},e.path.split(`/`).at(-1))),e.stackBlitz?Y.createElement(`button`,{"data-luma-example-chrome-action":``,type:`button`,onClick:()=>void Ql(o,D.files||[]),style:{background:`color-mix(in srgb, var(--luma-example-accent, ${n.accent}) 18%, var(--luma-example-surface, ${n.surface}))`,border:`1px solid var(--luma-example-accent, ${n.accent})`,borderRadius:6,color:`var(--luma-example-accent, ${n.accent})`,cursor:`pointer`,fontSize:11,fontWeight:700,marginLeft:`auto`,padding:`5px 9px`,whiteSpace:`nowrap`}},`Edit in StackBlitz`):null):null,M):null),s?null:Y.createElement(`button`,{"data-luma-example-chrome-action":``,type:`button`,"aria-label":`Resize info box`,title:`Resize info box`,onPointerDown:O,onPointerMove:k,onPointerUp:A,onPointerCancel:A,onKeyDown:te,style:{position:`absolute`,right:6,bottom:6,zIndex:100,display:`grid`,placeItems:`center`,width:28,height:28,padding:0,border:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:7,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,boxShadow:`0 4px 12px rgba(2, 6, 23, 0.18)`,color:`var(--luma-example-text-muted, ${n.textMuted})`,cursor:`nwse-resize`,fontSize:19,lineHeight:1,touchAction:`none`,userSelect:`none`}},Y.createElement(`svg`,{"aria-hidden":`true`,viewBox:`0 0 16 16`,width:`16`,height:`16`},Y.createElement(`path`,{d:`M4 14L14 4M9 14L14 9M13 14L14 13`,fill:`none`,stroke:`currentColor`,strokeLinecap:`round`,strokeWidth:`1.75`}))))}function Hl(e){return e.closest(`[data-luma-example-page]`)}function Ul(e){let t=e.getBoundingClientRect(),n=window.innerWidth||document.documentElement.clientWidth,r=window.innerHeight||document.documentElement.clientHeight,i=Hl(e)?.getBoundingClientRect(),a=Math.min(n,i?.right??n),o=Math.min(r,i?.bottom??r),s=Math.max(1,a-t.left-Fl),c=Math.max(1,o-t.top-Il);return{minWidth:Math.min(Nl,s),minHeight:Math.min(Pl,c),maxWidth:s,maxHeight:c}}function Wl(e,t,n){return Gl({width:t,height:n},Ul(e))}function Gl(e,t){let{minWidth:n,minHeight:r,maxWidth:i,maxHeight:a}=t;return{width:Math.min(i,Math.max(n,e.width)),height:Math.min(a,Math.max(r,e.height))}}function Kl(e,t){return e!==null&&e.minWidth===t.minWidth&&e.minHeight===t.minHeight&&e.maxWidth===t.maxWidth&&e.maxHeight===t.maxHeight}function ql(e){return e.sourcePath?`${jl}/${e.sourcePath}`:e.id&&(e.sourceDirectory||e.directory)?`${jl}/examples/${e.sourceDirectory||e.directory}/${e.id}`:null}function Jl(e){if(e.sourceFiles&&e.sourceFiles.length>0){let t=Yl(e);return t?e.sourceFiles.map(e=>`${t}/${e}`):e.sourceFiles}if(e.sourcePath){let t=e.sourcePath.replace(/^\/?examples\//,``).replace(/^\//,``);return/\.(?:[cm]?[jt]sx?)$/.test(t)?[t]:[`${t}/app.ts`,`${t}/app.tsx`,`${t}/index.html`,`${t}/package.json`]}if(e.id&&(e.sourceDirectory||e.directory)){let t=e.sourceDirectory||e.directory;return[`${t}/${e.id}/app.ts`,`${t}/${e.id}/app.tsx`,`${t}/${e.id}/index.html`,`${t}/${e.id}/package.json`]}return[]}function Yl(e){return e.sourcePath?e.sourcePath.replace(/^\/?examples\//,``).replace(/^\//,``):e.id&&(e.sourceDirectory||e.directory)?`${e.sourceDirectory||e.directory}/${e.id}`:null}async function Xl(e,t,n){let r=[];for(let i of t){let t=await fetch(`${e}example-assets/${i}`,{signal:n});t.ok&&r.push({path:i,source:await t.text()})}if(r.length===0)throw Error(`Unable to load source code.`);return r}function Zl(e){return e?.endsWith(`.tsx`)?`tsx`:e?.endsWith(`.html`)?`html`:e?.endsWith(`.json`)?`json`:`typescript`}async function Ql(e,t){let{default:n}=await oe(async()=>{let{default:e}=await import(`./sdk.m-d7evAA4T.js`);return{default:e}},[],import.meta.url),r=Object.fromEntries(t.map(e=>[e.path.split(`/`).at(-1)||e.path,e.source]));await n.openProject({title:`luma.gl: ${e}`,description:`Runnable luma.gl example from the official documentation.`,template:`node`,files:r},{newWindow:!0,openFile:r[`app.tsx`]?`app.tsx`:`app.ts`,startScript:`start`})}function $l(e,t){return t||(e?e.split(`-`).map(eu).join(` `):``)}function eu(e){return e.charAt(0).toUpperCase()+e.slice(1)}function tu(e,t=`Rigid Body Lab`,n=`GPU physics · mechanisms and contacts`){let r=document.querySelector(`#info`);Sc(r,`cinematic`);let i=document.querySelector(`#lab-controls`),a=document.querySelector(`#lab-details`),o=(e,t)=>(Bc(t,`cinematic`),e.hidden=!1,t.append(e),()=>{e.hidden=!0,document.body.append(e)}),s=new Ao({parentElement:r});return s.setProps({components:[new Vl({title:t,subtitle:n,websiteBaseUrl:`/`,appearance:`cinematic`,panel:Pc({id:`lab-tabs`,theme:`dark`,panels:[Mc({id:`lab-controls-panel`,title:`Settings`,html:``,onRender:e=>o(i,e)}),Mc({id:`lab-details-panel`,title:`Info`,html:``,onRender:e=>o(a,e)}),e.inspectorPanel.panel,e.tracePanel.panel]})})]}),{update(){s.onRedraw({viewports:[],layers:[]})},destroy(){s.finalize(),e.clear(),r.remove(),i.remove(),a.remove()}}}var nu={geometryConvex:`Geometry Torture · scaled convex hulls`,geometryOpenings:`Geometry Torture · real mesh opening`,fastPrimitives:`Fast Motion Lab · curved obstacles`,fastMesh:`Fast Motion Lab · mesh opening / rim`,fastBudget:`Fast Motion Lab · impact budget rejection`};function ru(e){return Object.hasOwn(nu,e)}function iu(){let e=[],t=[];for(let[n,r,i,a]of[[-3,-.6,-2,2],[.6,3,-2,2],[-.6,.6,-2,-.6],[-.6,.6,.6,2]]){let o=e.length/3;e.push(n,i,0,r,i,0,r,a,0,n,a,0),t.push(o,o+1,o+2,o,o+2,o+3)}return Ir(e,t)}function au(e,t){if(e===`geometryConvex`)return{description:`Geometry Torture: the same cooked convex cube appears at three sizes with rotated faces. Contact depths are qualified separately against independent rectangle SAT at scales 0.001, 1 and 1000, with reversed collider order. The diagnostic projection displays original hull triangles. This does not qualify all convex shapes or stable feature identity.`,props:{...t,bodies:[t.bodies[0],...[.25,.6,1].map((e,t)=>({position:[-3+t*3,0,4+t],orientation:[0,Math.sin(.21),0,Math.cos(.21)],shape:{type:`convex-hull`,geometry:Fr(Array.from({length:8},(t,n)=>[n&1?e:-e,n&2?e:-e,n&4?e:-e]).flat())},restitution:.1,friction:.6}))]}};if(e===`geometryOpenings`||e===`fastMesh`)return{description:e===`geometryOpenings`?`Geometry Torture: original triangles form a two-sided surface with a real central opening. An oblique projection reveals the opening. The center sphere fits through; the outer spheres meet the rim. No convex hull fills the hole. Meshes retain surface semantics: a closed mesh does not imply solid-volume containment.`:`Fast Motion Lab: selected spheres sweep against the original mesh triangles. The center trajectory passes through the opening; rim trajectories rebound. Trails reveal motion between readbacks. Only centered spheres versus static geometry have CCD; rotating and dynamic obstacles retain discrete response.`,props:{...t,...e===`fastMesh`?{gravity:[0,0,0],continuous:{bodies:[1,2,3],maximumImpacts:8},restitutionThreshold:0}:{},bodies:[{mode:`static`,position:[0,0,3],shape:{type:`triangle-mesh`,geometry:iu()},restitution:1},...[-1.5,0,1.5].map(t=>({position:[t,0,7],velocity:[0,0,e===`fastMesh`?-180:0],shape:{type:`sphere`,radius:.25},restitution:1})),t.bodies[0],...e===`fastMesh`?[{mode:`static`,position:[0,0,8.5],shape:{type:`box`,halfExtents:[4,2,.03]},restitution:1,friction:0}]:[]]}};let n=e===`fastBudget`;return{description:n?`Fast Motion Lab: a deliberately insufficient one-impact budget rejects the whole step. The accepted pose and velocity stay at their starting values; the red REJECTED status reports incomplete CCD. Reset repeats the failure. Rejection is the expected result, not a successful completed trajectory.`:`Fast Motion Lab: a fast spinning sphere ricochets between capsule and cylinder obstacles. Curved surfaces use bounded conservative advancement; spheres, boxes and unbounded planes use exact feature sweeps. Pace is preserved at restitution 1 and zero friction. Trails show sampled centers, not an exact between-impact path. Spin is carried through, not spin-dependent CCD response.`,props:{...t,gravity:[0,0,0],continuous:{bodies:[0],maximumImpacts:n?1:8},restitutionThreshold:0,bodies:[{position:[0,0,3],velocity:[n?3e3:180,0,0],angularVelocity:[0,18,0],shape:{type:`sphere`,radius:.25},restitution:1,friction:0},...[-4,4].map((e,t)=>({mode:`static`,position:[e,0,3],shape:t===0?{type:`capsule`,height:3,radiusBottom:.4,radiusTop:.4}:{type:`cylinder`,height:3,radiusBottom:.4,radiusTop:.4},restitution:1,friction:0}))]}}}var ou={seamSliding:`Contact Continuity · seam sliding`,impactChain:`Impact Continuity · touching chain`,simultaneousImpacts:`Impact Continuity · simultaneous impacts`,sweptQueueScaling:`Swept Queue Scaling · sparse moving field`,persistentContacts:`Persistent contacts · moving platform`,fastConvexPairs:`Fast Motion Lab · dynamic convex pairs`,fastMovingWall:`Fast Motion Lab · translating wall`,fastRotatingGate:`Fast Motion Lab · rotating gate`,fastConvexQueue:`Fast Motion Lab · swept queue rejection`};function su(e){return Object.hasOwn(ou,e)}function cu(e,t){let n={restitution:1,friction:0},r=[-6,6].map(e=>({...n,mode:`static`,position:[e,0,4],shape:{type:`box`,halfExtents:[.05,2,5]}})),i={...t,gravity:[0,0,0],failurePolicy:`rollback`,restitutionThreshold:0,continuous:{mode:`convex`,bodies:[0],maximumImpacts:8,maximumCandidates:128},bodies:[]};if(e===`seamSliding`)return{description:`Spheres slide across the diagonals of an authored triangle strip. Exactly coplanar shared edges use one persistent surface feature, and analytic sphere contacts suppress internal-edge ridges. Outer boundaries and creases remain collidable. The spheres eventually leave the strip; reset restores their starting positions. This tests seam continuity, not general nonconvex CCD.`,props:{...t,failurePolicy:`rollback`,contactMatchDistance:.1,gravity:[0,0,-10],bodies:[{mode:`static`,position:[0,0,0],friction:0,shape:{type:`triangle-mesh`,geometry:Ir([-7,-2,1,0,-2,1,7,-2,1,-7,2,1,0,2,1,7,2,1],[0,1,4,0,4,3,1,2,5,1,5,4])}},...[-1,0,1].map(e=>({friction:0,position:[-6,e,1.35],velocity:[.8,0,0],shape:{type:`sphere`,radius:.35}}))]}};if(e===`impactChain`||e===`simultaneousImpacts`){let t=e===`simultaneousImpacts`;return{description:t?`Two equal-speed spheres strike the middle sphere at the same time. Deterministic pair ordering and zero-time revisits transfer the impulses until the contacts separate. This bounded ordered impact law is not a unique coupled multi-impact material model. Exhausting the global impact budget rejects the whole step.`:`A fast sphere strikes a line of touching spheres. The queue is rebuilt after each impact, so a newly closing contact is resolved even when its starting separation is zero. Energy transfers to the far sphere. The view follows the moving group; reset repeats the shot.`,props:{...i,continuous:{mode:`convex`,bodies:[0,1,2],maximumImpacts:8},bodies:[{...n,position:[-3,0,3],velocity:[12,0,0],shape:{type:`sphere`,radius:.5}},{...n,position:[0,0,3],shape:{type:`sphere`,radius:.5}},{...n,position:[t?3:1,0,3],velocity:[t?-12:0,0,0],shape:{type:`sphere`,radius:.5}}]}}}if(e===`sweptQueueScaling`)return{description:`Sixty-five separated moving spheres exercise a non-power-of-two spatial index. GPU bitonic sorting orders swept bounds along the widest center-spread axis, then interval scans stop early and reject the other two axes. Compare the reported spatial tests with 2,080 possible pairs. Dense overlapping intervals can still take quadratic work; sorting also adds dispatches and is not a universal speedup.`,props:{...i,maximumPairs:128,continuous:{mode:`convex`,bodies:Array.from({length:65},(e,t)=>t),maximumCandidates:8},bodies:Array.from({length:65},(e,t)=>({...n,position:[t%9*1.6-6.4,0,1+Math.floor(t/9)],velocity:[.1,0,0],shape:{type:`sphere`,radius:.15}}))}};if(e===`persistentContacts`)return{description:`Two bodies translate together farther than the contact matching distance each step. Local anchors and feature keys preserve the warm start. The boxes ride the moving platform; reset restores the initial scene. This is a diagnostic, not a complete difficult-stack qualification.`,props:{...t,gravity:[0,0,-10],contactMatchDistance:.001,bodies:[{mode:`kinematic`,position:[-5,0,0],velocity:[.5,0,0],shape:{type:`box`,halfExtents:[3,1,.2]},friction:.8},...[-1,0,1].map(e=>({position:[e-5,0,.7],velocity:[.5,0,0],shape:{type:`box`,halfExtents:[.4,.4,.5]},friction:.8}))]}};if(e===`fastConvexPairs`)return{description:`Fast boxes meet between rendered samples. Bounded convex CCD advances both bodies to the earliest impact, applies normal and friction impulses, then consumes the remaining timestep. The queue is rebuilt after each rebound. Single convex dynamic colliders are supported; jointed and nonconvex CCD are outside this mode.`,props:{...i,continuous:{...i.continuous,bodies:[0,1]},bodies:[{...n,position:[-4,0,3],velocity:[240,0,0],shape:{type:`box`,halfExtents:[.35,.3,.35]}},{...n,position:[4,0,3],velocity:[-180,0,0],shape:{type:`box`,halfExtents:[.35,.3,.35]}},...r]}};if(e===`fastRotatingGate`){let e={restitution:.8,friction:0};return{description:`A kinematic gate sweeps through a stationary sphere between samples. Conservative advancement includes an angular speed bound, and the impulse uses velocity at the moving contact point. A 128-iteration bound rejects unresolved grazing cases. Dissipative impacts keep this continuously driven scene from accumulating lossless rebound energy. This is bounded rotational CCD, not an unqualified guarantee for every angular speed or geometry.`,props:{...i,continuous:{...i.continuous,maximumImpacts:16},bodies:[{...e,position:[0,0,4.2],shape:{type:`sphere`,radius:.15}},{...e,mode:`kinematic`,position:[0,0,3],angularVelocity:[0,120,0],shape:{type:`box`,halfExtents:[2,.15,.05]}},...r.map(t=>({...t,...e})),...[0,9].map(t=>({...e,mode:`static`,position:[0,0,t],shape:{type:`box`,halfExtents:[6,2,.05]}}))]}}}return e===`fastMovingWall`?{description:`A fast sphere meets an approaching kinematic wall. The rebound is computed in the wall contact frame; the moving wall can add kinetic energy. Convex CCD includes translation and rotation of both colliders. Initial overlaps stay with the discrete solver. The view follows the sphere after its moving-frame rebound.`,props:{...i,bodies:[{...n,position:[-3,0,3],velocity:[240,0,0],shape:{type:`sphere`,radius:.25}},{...n,mode:`kinematic`,position:[1,0,3],velocity:[-60,0,0],shape:{type:`box`,halfExtents:[.1,1,1]}}]}}:{description:`The swept queue has one slot but two reachable walls. The entire step is deliberately rejected, preserving the accepted positions, orientations, velocities and contact cache. Reset repeats the rejection. Increasing the capacity is an explicit policy; no collider is silently dropped.`,props:{...i,continuous:{mode:`convex`,bodies:[0],maximumCandidates:1},bodies:[{...n,position:[-2,0,3],velocity:[240,0,0],shape:{type:`box`,halfExtents:[.2,.2,.2]}},...[0,1].map(e=>({...n,mode:`static`,position:[e,0,3],shape:{type:`box`,halfExtents:[.03,1,1]}}))]}}}var lu={...io,...ou,...nu,capacity:`Capacity recovery`,dense:`Dense mixed-size pile`,massRatio:`Heavy-on-light stack`,ballistic:`Ballistic convergence`,continuous:`Fast sphere / thin walls`,sparseContacts:`Sparse contact queue`,sleepingIslands:`Sleeping islands / selective wake`,geometry:`Rotated geometry torture`,deepStack:`Eight-box sustained stack`,offsetStack:`Offset COM stack`};function uu(e,t,n){if(ao(e)){let r=oo(e,e===`matchedChain`?12:e===`matchedFast`?4:32);return{description:r.description,props:so(r,n,e===`matchedChain`?`ordered`:t)}}let r={solver:t,timeStep:n,iterations:32,broadPhase:`hierarchical-grid`,sleepAfter:0,gravity:[0,0,-10],bodies:[{mode:`static`,mass:0,position:[0,0,-.5],shape:{type:`box`,halfExtents:[8,3,.5]},restitution:0,friction:.5}]};if(su(e))return cu(e,r);if(ru(e))return au(e,r);if(e===`ballistic`)return{description:`A freely falling sphere starts at height 8. The outline follows the exact ballistic solution. Halve the timestep and compare vertical error. Position uses semi-implicit Euler; the error should decrease with timestep.`,props:{...r,bodies:[{position:[-3,0,8],velocity:[2,0,0],shape:{type:`sphere`,radius:.3}}]}};if(e===`continuous`)return{description:`A sphere travels at 180 units/second between 0.06-unit walls. Sphere/static CCD should prevent escape and preserve speed. This does not qualify rotating or dynamic-pair CCD.`,props:{...r,gravity:[0,0,0],continuous:{bodies:[0],maximumImpacts:8},restitutionThreshold:0,bodies:[{position:[0,0,3],velocity:[180,0,0],shape:{type:`sphere`,radius:.3},restitution:1,friction:0},...[-5,5].map(e=>({position:[e,0,3],mode:`static`,shape:{type:`box`,halfExtents:[.03,1,3]},restitution:1,friction:0}))]}};if(e===`sleepingIslands`)return{description:`48 independent touching pairs settle with gravity disabled. Awake contact and body queues should fall to zero while manifolds remain cached. Every four seconds the lab impulses one pair; only that connected island should wake. Compare Compact queue with Full scan at the same iteration count.`,props:{...r,gravity:[0,0,0],sleepAfter:.3,linearDamping:2,maximumPairs:8192,bodies:Array.from({length:96},(e,t)=>({position:[(Math.floor(t/2)%8-3.5)*1.6+(t%2?.2:-.2),0,1+Math.floor(t/16)*1.2],shape:{type:`sphere`,radius:.2},restitution:0,friction:.5}))}};if(e===`sparseContacts`)return{description:`24 independent impacts reserve 8192 pair slots. Select Parallel and compare Compact queue with Full scan. The queue is built once on GPU and reused by every solver iteration. Empty steps dispatch zero pair workgroups. This measures work reduction; timing also includes fixed discovery and body work.`,props:{...r,gravity:[0,0,0],maximumPairs:8192,restitutionThreshold:0,bodies:Array.from({length:48},(e,t)=>({position:[(Math.floor(t/2)%6-2.5)*2+(t%2?.23:-.23),0,1+Math.floor(t/12)*2],velocity:[t%2?-1:1,0,0],shape:{type:`sphere`,radius:.23},restitution:1,friction:0}))}};if(e===`geometry`)return{description:`Spheres meet rotated thin boxes and edge/corner features. The companion numerical tests independently check signed depths, normal direction, scale and reversed collider order. This diagnostic projection shows X/Z rotation; general mesh containment remains outside this qualification.`,props:{...r,bodies:[...r.bodies,...[-3,0,3].map((e,t)=>({mode:`static`,position:[e,0,1+t],orientation:[0,Math.sin((t-1)*.25),0,Math.cos((t-1)*.25)],shape:{type:`box`,halfExtents:[1.2,.5,.12]},restitution:0,friction:.5})),...Array.from({length:12},(e,t)=>({position:[(t%6-2.5)*1.1,0,5+Math.floor(t/6)],shape:{type:`sphere`,radius:.2+t%3*.07},restitution:.1,friction:.5}))]}};if(e===`deepStack`||e===`offsetStack`)return{description:e===`deepStack`?`Eight unit boxes use sleeping disabled, 64 iterations, warm-start factor 0.8 and recovery fraction 0.1. The six-second numerical reference checks sample support separation, height drift and residual energy at 1/120 and 1/240 s; longer interactive runs are exploratory. Other timesteps are exploratory.`:`Four unit boxes have a 0.1-unit center-of-mass offset. The six-second numerical fixture measures drift, support separation and residual energy with sleeping disabled. Compare the ordered and parallel solvers.`,props:{...r,iterations:64,maximumPairs:64,warmStartFactor:.8,penetrationRecoveryFraction:.1,gravity:[0,0,-9.81],bodies:[{...r.bodies[0],friction:.8},...Array.from({length:e===`deepStack`?8:4},(t,n)=>({position:[0,0,n+.5],centerOfMass:[e===`offsetStack`?.1:0,0,0],shape:{type:`box`,halfExtents:[.5,.5,.5]},restitution:0,friction:.8}))]}};let i=[...r.bodies],a=e===`dense`?64:e===`massRatio`?5:12;for(let t=0;t<a;t++){let n=e===`dense`?.22+t%3*.08:.45;i.push({position:e===`massRatio`?[0,0,.46+t*.91]:[(t%8-3.5)*.85,0,.5+Math.floor(t/8)*.82],mass:e===`massRatio`&&t===a-1?100:1,shape:e===`massRatio`||t%2?{type:`box`,halfExtents:[n,n,n]}:{type:`sphere`,radius:n},restitution:0,friction:.5})}return{props:{...r,bodies:i,...e===`capacity`?{maximumPairs:1}:{}},description:e===`capacity`?`Starts with one pair slot. Failed steps roll back, then the runner doubles recoverable budgets and replays commands from initial state. Watch retries and allocated capacity. Reset repeats the shortage.`:e===`massRatio`?`A 100:1 load rests on four light boxes. Compare solver drift and penetration at different timesteps. This is an adversarial demonstration, not a claim that this mass ratio is qualified.`:`64 mixed-size spheres and boxes form a dense pile. Watch candidate work, memory and full-step completion latency as contacts accumulate. The front projection overlaps bodies in depth.`}}function du(e){return Object.hasOwn(lu,e)}function fu(e,t){return Math.round(t/e)}var pu=document.querySelector(`#world`),Z=pu.getContext(`2d`),mu=document.querySelector(`#scene`),hu=document.querySelector(`#solver`),gu=document.querySelector(`#pair-work`),_u=document.querySelector(`#run-limit`),vu=document.querySelector(`#timestep`),yu=document.querySelector(`#status`),bu=document.querySelector(`#pause`),xu=document.querySelector(`#reset`),Su=document.querySelector(`#export`),Cu=new Cl,wu=tu(Cu,`Physics Stress Lab`,`GPU physics · recovery and qualification`);for(let[e,t]of Object.entries(lu))mu.add(new Option(t,e));var Tu=new URLSearchParams(location.search).get(`scene`)??``,Eu=du(Tu)?Tu:`capacity`;mu.value=Eu;var Q=Eu;mu.onchange=()=>{du(mu.value)&&(Eu=mu.value,(Eu===`sparseContacts`||Eu===`sleepingIslands`)&&(hu.value=`parallel`),Uu())};var $,Du=uu(Eu,`ordered`,Number(vu.value)),Ou=!1,ku=!1,Au=!1,ju=!1,Mu=!1,Nu=[],Pu=0,Fu=0,Iu=null,Lu=null,Ru=null,zu=[],Bu=[],Vu;function Hu(e){ju=!0,document.querySelector(`#error`).textContent=String(e)}async function Uu(){if(Mu)return;if(ku){Au=!0;return}Au=!1,ku=!0,Su.disabled=!0,xu.disabled=mu.disabled=hu.disabled=vu.disabled=_u.disabled=gu.disabled=!0;let e,t=Eu;t===`matchedChain`&&(hu.value=`ordered`);try{let n=uu(t,hu.value===`parallel`?`parallel`:`ordered`,Number(vu.value));n.props.compactContacts=gu.value===`compact`;let r=fu(n.props.timeStep,Number(_u.value));if(yu.value=`Compiling…`,e=await eo.create(Vu,n.props,{maximumReplayTicks:r}),Mu)return;let i=await e.world.readState();if(Mu)return;$?.destroy(),$=e,e=void 0,Du=n,Q=t,Fu=r,yu.dataset.generation=String(++Pu),yu.dataset.scene=Q,Lu=null,Ru=null,Cu.clear(),Nu=i,Bu=[],zu=[],Iu=null,ju=!1,delete yu.dataset.accepted,yu.value=`READY · tick 0/${Fu} · ${Nu.length} bodies${Ou?`
Paused · Resume to advance`:``}`,document.querySelector(`#error`).textContent=``,document.querySelector(`#description`).textContent=Du.description}catch(e){Hu(e)}finally{e?.destroy(),ku=!1,Su.disabled=!1,xu.disabled=mu.disabled=hu.disabled=vu.disabled=_u.disabled=gu.disabled=!1,Mu?($?.destroy(),Vu.destroy()):Au&&Uu()}}xu.onclick=Uu,hu.onchange=Uu,vu.onchange=Uu,_u.onchange=Uu,gu.onchange=Uu,bu.onclick=()=>{Ou=!Ou,bu.textContent=Ou?`Resume`:`Pause`},Su.onclick=()=>{if(!$)return;let e={version:1,scene:Q,adapter:Vu.info,configuration:Du.props,capacity:$.world.getCapacityInfo(),solverWork:Lu,continuousWork:Ru,samples:Bu,finalState:Nu,notes:[`Wall time includes completion/readback; recovery includes compilation/replay.`,`Diagnostic visualization reads poses on the CPU. Not a GPU-only rendering benchmark.`,`A completed run does not qualify general shape, mass-ratio or CCD support.`]},t=URL.createObjectURL(new Blob([JSON.stringify(e,null,2)],{type:`application/json`})),n=document.createElement(`a`);n.href=t,n.download=`physics-${Q}.json`,n.click(),setTimeout(()=>URL.revokeObjectURL(t),1e3)};function Wu(){let e=window.devicePixelRatio,t=Math.round(pu.clientWidth*e),n=Math.round(pu.clientHeight*e);(pu.width!==t||pu.height!==n)&&(pu.width=t,pu.height=n),Z.clearRect(0,0,t,n);let r=Q===`geometryOpenings`||Q===`fastMesh`||Q===`seamSliding`||ao(Q)?.45:0,i=Q===`ballistic`||Q===`matchedBallistic`?Math.min(0,(Nu[0]?.position[2]??0)-1):0,a=Q===`impactChain`||Q===`simultaneousImpacts`||Q===`matchedBallistic`,o=a?Nu.map(e=>e.position[0]):[],s=Math.min(-7,...o),c=Math.max(7,...o),l=Q===`matchedChain`?Math.max(12,...Nu.map(e=>e.position[2]+2)):12,u=Math.min(t/(c-s+5),n/(l-i)),d=[t*.55-(a?(s+c)*.5*u:0)-(Q===`persistentContacts`||Q===`fastMovingWall`?(Nu[0]?.position[0]??0)*u:0),n*.85+i*u];Z.strokeStyle=`#344452`,Z.lineWidth=e;for(let e=0;e<=9;e++)Z.beginPath(),Z.moveTo(0,d[1]-e*u),Z.lineTo(t,d[1]-e*u),Z.stroke();for(let t of zu)t&&(Z.strokeStyle=`#dfb46f`,Z.lineWidth=e,Z.beginPath(),t.forEach((e,t)=>{let n=d[0]+(e[0]+r*e[1])*u,i=d[1]-(e[2]+.7*r*e[1])*u;t===0?Z.moveTo(n,i):Z.lineTo(n,i)}),Z.stroke());if(Q===`matchedChain`){Z.strokeStyle=`#b8c8d4`;for(let e of Du.props.joints??[]){let t=Nu[e.first]?.position,n=Nu[e.second]?.position;!t||!n||(Z.beginPath(),Z.moveTo(d[0]+t[0]*u,d[1]-t[2]*u),Z.lineTo(d[0]+n[0]*u,d[1]-n[2]*u),Z.stroke())}}for(let[e,t]of Nu.entries()){let n=Du.props.bodies[e],i=n.shape;Z.fillStyle=n.mode===`static`?`#576675`:t.sleeping?`#8b9b9f`:`#64c9dd`,Z.save();let[a,o,s,c]=t.orientation,l=n.centerOfMass??[0,0,0],f=[2*(o*l[2]-s*l[1]),2*(s*l[0]-a*l[2]),2*(a*l[1]-o*l[0])],p=l[0]+c*f[0]+o*f[2]-s*f[1],m=l[1]+c*f[1]+s*f[0]-a*f[2],h=l[2]+c*f[2]+a*f[1]-o*f[0];if(Z.translate(d[0]+(t.position[0]-p+r*(t.position[1]-m))*u,d[1]-(t.position[2]-h+.7*r*(t.position[1]-m))*u),i?.type===`sphere`)Z.beginPath(),Z.arc(0,0,i.radius*u,0,2*Math.PI),Z.fill();else if(i?.type===`box`&&r===0){let[e,n,r,a]=t.orientation;Z.rotate(Math.atan2(2*(a*n+e*r),1-2*(e*e+n*n))),Z.fillRect(-i.halfExtents[0]*u,-i.halfExtents[2]*u,2*i.halfExtents[0]*u,2*i.halfExtents[2]*u)}else i&&co(Z,i,t.orientation,u,r);Z.restore()}if(Q===`ballistic`&&$){let t=$.tick*$.world.timeStep;Z.strokeStyle=`#ffcd78`,Z.lineWidth=2*e,Z.beginPath(),Z.arc(d[0]+(-3+2*t)*u,d[1]-(8-5*t*t)*u,.3*u,0,2*Math.PI),Z.stroke()}}async function Gu(){if(!(!$||ku||Ou||ju||Mu)){ku=!0,Su.disabled=!0;try{let e=performance.now(),t=Math.round(4/$.world.timeStep),n=Q===`sleepingIslands`&&$.tick>0&&$.tick%t===0,r=await $.advance(n?[{type:`impulse`,body:0,impulse:[.1,0,0]}]:[]),i=performance.now()-e;if(Mu)return;if(Bu.push({milliseconds:i,result:r}),$.encoding&&Cu.record($.graph,$.encoding),Nu=await $.world.readState(),Ru=await $.world.readContinuousWork(),Q.startsWith(`fast`)||Q===`continuous`||Q===`matchedFast`)for(let[e,t]of Nu.entries()){if(Du.props.bodies[e].mode===`static`)continue;zu[e]||(zu[e]=[]);let n=zu[e];n.push([...t.position]),n.length>240&&n.shift()}Lu=await $.world.readSolverWork();let a=Bu.map(e=>e.milliseconds).sort((e,t)=>e-t),o=$.world.getCapacityInfo(),s=$.tick*$.world.timeStep;yu.dataset.accepted=String(r.accepted);let c=Q===`ballistic`?`\nVertical error: ${Math.abs(Nu[0].position[2]-(8-5*s*s)).toFixed(5)}`:``;yu.value=`${r.accepted?`ACCEPTED`:`REJECTED`} · tick ${$.tick}/${Fu} · ${s.toFixed(2)} s\nRetries: ${Bu.reduce((e,t)=>e+t.result.retries,0)} · replayed: ${Bu.reduce((e,t)=>e+t.result.replayedTicks,0)} ticks\nPairs: ${o.maximumPairs} · buffers: ${(o.ownedBufferBytes/1048576).toFixed(2)} MiB\nNodes: ${$.graph.stats.nodeOrder.length} · peak candidates: ${r.diagnostics.maximumCandidatePairs}\nIncomplete CCD bodies: ${r.diagnostics.incompleteContinuousBodies}\nCompletion p50: ${a[Math.floor((a.length-1)*.5)].toFixed(2)} ms\nCompletion p95: ${a[Math.floor((a.length-1)*.95)].toFixed(2)} ms${Lu?`\nPair workgroups/iteration: ${Lu.pairWorkgroups} / ${Math.ceil(o.maximumPairs/64)} capacity${Lu.compacted?` · ${Lu.awakeContacts}/${Lu.activeContacts} awake contacts · ${Lu.awakeBodies} awake bodies (${Lu.bodyWorkgroups} body groups)`:` · scan`}`:``}${Ru?`\nSwept queue peak: ${Ru.peakCandidates} / ${Ru.candidateCapacity} · ${Ru.peakCandidateWorkgroups} workgroups · ${Ru.impacts} impacts\nSpatial tests peak: ${Ru.peakSpatialTests} · ${Ru.rounds} rounds`:``}${c}`,Iu=Nu.every((e,t)=>{let n=Du.props.bodies[t];return n.mode===`static`||n.mass===0&&n.mode!==`dynamic`||Math.hypot(...e.velocity)<.04&&Math.hypot(...e.angularVelocity)<.04})?Iu??s:null;let l=s>=30&&Iu!==null&&s-Iu>=2;ju=!r.accepted||l||$.tick>=Fu,l?yu.value+=`
Settled · Reset to replay`:$.tick>=Fu&&(yu.value+=`
Run limit reached · increase limit or Reset to replay`)}catch(e){Hu(e)}finally{ku=!1,Su.disabled=!1,xu.disabled=mu.disabled=hu.disabled=vu.disabled=_u.disabled=gu.disabled=!1,Mu?($?.destroy(),Vu.destroy()):Au&&Uu()}}}try{Vu=await D.createDevice({adapters:[he],onError:Hu}),await Uu();function e(){Mu||(wu.update(),Wu(),Gu(),requestAnimationFrame(e))}requestAnimationFrame(e),window.addEventListener(`pagehide`,()=>{Mu=!0,wu.destroy(),ku||($?.destroy(),Vu.destroy())},{once:!0})}catch(e){Hu(e)}