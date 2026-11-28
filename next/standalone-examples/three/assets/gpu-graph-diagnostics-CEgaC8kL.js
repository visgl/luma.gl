import{c as e,u as t}from"./render-pipeline-iM0U8Hca.js";import{d as n,u as r}from"./buffer-layout-utils-BcDHVNXR.js";import{a as i,t as a}from"./buffer-nQFj-suN.js";import{n as o,t as s}from"./texture-i7LE4STQ.js";import{a as c,t as l}from"./dynamic-buffer-Bib4Yswa.js";import{i as u,n as d,r as f,t as p}from"./gpu-vector-chunks-qU0E7iZ4.js";var m={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function h(e){return e?Array.isArray(e)?e[0]??null:e:null}function g(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=h(n);if(!e)return null;let{width:t}=_(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=h(n);return e?_(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=h(n[0]);return e?_(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=h(t);return r?_(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=h(e[t]);return r?_(r):null}default:return null}}function _(e){if(n(e))return r(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function v(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function y(e){return ArrayBuffer.isView(e)}function b(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function x(e){let t=m[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function ee(e,t){return 6*e+x(t)}function S(e){throw Error(`setTexture1DData not supported in WebGL.`)}function te(e){return Array.isArray(e)?e:[e]}function C(e,t,r,i){let a=te(t),o=e,s=[];for(let e=0;e<a.length;e++){let t=a[e];if(n(t))s.push({type:`external-image`,image:t,z:o,mipLevel:e});else if(v(t))s.push({type:`texture-data`,data:t,textureFormat:b(t),z:o,mipLevel:e});else if(y(t)&&r)s.push({type:`texture-data`,data:{data:t,width:Math.max(1,r.width>>e),height:Math.max(1,r.height>>e),...i?{format:i}:{}},textureFormat:i,z:o,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return s}function ne(e){let t=[];for(let n=0;n<e.length;n++)t.push(...C(n,e[n]));return t}function re(e){let t=[];for(let n=0;n<e.length;n++)t.push(...C(n,e[n]));return t}function ie(e){let t=[];for(let[n,r]of Object.entries(e)){let e=x(n);t.push(...C(e,r))}return t}function ae(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=ee(n,r);t.push(...C(e,i))}}),t}var oe=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=i(`dynamic-texture`),a=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(a)}async initAsync(e){try{let n=await this._loadAllData(e);this._checkNotDestroyed();let r=n.data?se({...n,width:e.width,height:e.height,format:e.format}):[],i=`format`in e&&e.format!==void 0,a=`usage`in e&&e.usage!==void 0,o=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:g(n)||{width:this.props.width||1,height:this.props.height||1};if(!o||o.width<=0||o.height<=0)throw Error(`${this} size could not be determined or was zero`);let c=ce(this.device,r,o,{format:i?e.format:void 0}),l=c.format??this.props.format,u={...this.props,...o,format:l,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(l)&&!a&&(u.usage=s.SAMPLE|s.COPY_DST);let d=this.props.mipmaps&&!c.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(l);if(this.device.type===`webgpu`&&d){let e=this.props.dimension===`3d`?s.SAMPLE|s.STORAGE|s.COPY_DST|s.COPY_SRC:s.SAMPLE|s.RENDER|s.COPY_DST|s.COPY_SRC;u.usage|=e}let f=this.device.getMipLevelCount(u.width,u.height),p=c.hasExplicitMipChain?c.mipLevels:this.props.mipLevels===`auto`?f:Math.max(1,Math.min(f,this.props.mipLevels??1)),m={...u,mipLevels:p};this._texture=this.device.createTexture(m),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),c.subresources.length&&this._setTextureSubresources(c.subresources),this.props.mipmaps&&!c.hasExplicitMipChain&&!d&&t.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),d&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),t.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):t.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof o?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),o=this.device.createBuffer({byteLength:i.byteLength,usage:a.COPY_DST|a.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},o);let s=this.device.createFence();return await s.signaled,s.destroy(),o}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let n=this.texture;return this._texture=n.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,n.destroy(),this._touchGeneration(),t.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=m[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=S(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=C(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=ne(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=re(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=ie(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=ae(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await fe(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&t.warn(`${this} already destroyed`)}_checkReady(){this.isReady||t.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...s.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function se(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return S(e.data);case`2d`:return C(0,e.data,t,n);case`3d`:return ne(e.data);case`2d-array`:return re(e.data);case`cube`:return ie(e.data);case`cube-array`:return ae(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function ce(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=ue(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=le(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?de(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=ue(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=le(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function le(e){if(e.type===`texture-data`)return e.textureFormat??b(e.data)}function ue(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function de(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function fe(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(fe));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(fe)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}async function pe(e,t){if(e.destroyed)throw Error(`Resource has been destroyed.`);if(e instanceof a){if(!(e.usage&a.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);let n=t.byteOffset??0,r=Math.min(256,t.byteLength??e.byteLength-n);if(n<0||r<0||n+r>e.byteLength)throw Error(`Preview range is outside the buffer.`);return{data:r?await e.readAsync(n,r):new Uint8Array,format:t.format}}let n=e.device.getTextureFormatInfo(e.format);if(n.packed)throw Error(`Packed texture previews are not supported.`);if(e.device.type!==`webgpu`)throw Error(`Texture previews require WebGPU.`);if(!((e.props.usage??0)&s.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);if(e.samples!==1||n.compressed||e.format.startsWith(`depth`)||e.format.startsWith(`stencil`))throw Error(`Preview requires a single-sample, uncompressed color texture.`);let r=t.baseMipLevel??0,i=Math.min(32,t.width??Math.max(1,e.width>>r)),o=Math.min(32,t.height??Math.max(1,e.height>>r)),c=e.computeMemoryLayout({width:i,height:o,depthOrArrayLayers:1}),l=e.device.createBuffer({byteLength:c.byteLength,usage:a.MAP_READ|a.COPY_DST}),u=e.device.createCommandEncoder();try{u.copyTextureToBuffer({sourceTexture:e,destinationBuffer:l,mipLevel:r,origin:[0,0,t.baseArrayLayer??0],width:i,height:o,depthOrArrayLayers:1,bytesPerRow:c.bytesPerRow}),e.device.submit(u.finish());let a=await l.readAsync(),s=i*n.bytesPerPixel,d=new Uint8Array(s*o);for(let e=0;e<o;e++)d.set(a.subarray(e*c.bytesPerRow,e*c.bytesPerRow+s),e*s);return{data:d,width:i,height:o,format:e.format}}finally{l.destroy(),u.destroy()}}var me=class{compare;values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function he(e){let t=ke(e.nodes),n=Pe(t,e.buffers.values()),r=Fe(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return _e(e,t,o,i,a,n,r)}async function ge(e){let t=ke(e.nodes),n=Pe(t,e.buffers.values()),r=Fe(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=c.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));c.endAsyncCompilation(e.device,o);let[l,u]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),d=[],f=u.find(e=>e.status===`rejected`),p=f?.status===`rejected`?f.reason:void 0;for(let e of l)e.status===`fulfilled`?d.push(e.value):p??=e.reason;if(p){for(let e of d)e.executable.destroy?.();throw p}return _e(e,t,d,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function _e(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=Ve(c.map(e=>e.byteLength),`imported buffer capacities`),d=Ve(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=Be(u,d,`logical buffer capacities`),p=Ve(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=Ve(g.map(ze),`imported texture estimates`),y=Ve(_.map(ze),`logical transient texture estimates`),b=Be(v,y,`logical texture estimates`),x=Ve(o.map(e=>e.byteLength),`physical transient texture estimates`),ee=Math.max(0,y-x),S={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:ee,textureReusePercentage:y>0?ee/y*100:0,logicalResourceBytes:Be(f,b,`logical resource estimates`),physicalTransientResourceBytes:Be(p,x,`physical transient resource estimates`)},te=ye(e.device,s,t,e.kernelMetadata);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:S,preflight:te}}function ve(e){if(`buffer`in e){let t=e.buffer,n=`buffer`in t?t:void 0;return Object.freeze({id:n?n.buffer.id:t.id,kind:`buffer`,usage:e.usage,byteOffset:n?.byteOffset??0,byteLength:n?n.length===0?0:(n.length-1)*n.byteStride+n.rowByteLength:t.byteLength,...n?{format:n.format,length:n.length}:{}})}let t=`texture`in e?e.texture:e.externalTexture;return Object.freeze({id:`texture`in t?t.texture.id:t.id,kind:`externalTexture`in e?`external-texture`:`texture`,usage:e.usage,width:t.width,height:t.height,...`texture`in t?{baseMipLevel:t.baseMipLevel,baseArrayLayer:t.baseArrayLayer,mipLevelCount:t.mipLevelCount,arrayLayerCount:t.arrayLayerCount,aspect:t.aspect}:{},...`format`in t?{format:t.format,depth:t.depth}:{}})}function ye(e,t,n,r){let i=n.map(e=>{let t=e.workload??{},n=r&&e.type===`compute`?e.kernel:void 0;return Object.freeze({id:e.id,...e.description===void 0?{}:{description:e.description},type:e.type,...n&&{kernel:Object.freeze({entryPoint:n.entryPoint,workgroupSize:Object.freeze([...n.workgroupSize]),bindings:Object.freeze(n.bindings.map(({name:e,type:t,group:n,location:r})=>Object.freeze({name:e,type:t,group:n,location:r}))),...r===`source`&&n.source!==void 0?{source:n.source}:{}})},resources:Object.freeze((e.resources??[]).map(ve)),...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),a=t.reduce((e,t)=>Math.max(e,t.byteLength),0),o=n.reduce((e,t)=>{for(let n of t.resources??[])be(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,Ce(n.buffer).size));return e},0),s=e=>i.reduce((t,n)=>{let r=n[e];return typeof r==`number`?Be(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(i),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:s(`commandCount`),maximumWorkgroupCount:s(`maximumWorkgroupCount`),maximumInvocationCount:s(`maximumInvocationCount`),readByteLength:s(`readByteLength`),writeByteLength:s(`writeByteLength`),largestBufferByteLength:a,largestStorageBufferBindingByteLength:o,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:a<=e.limits.maxBufferSize&&o<=e.limits.maxStorageBufferBindingSize})}function w(e){return`buffer`in e?e.buffer:e}function T(e){return`texture`in e?e.texture:e}function be(e){return`buffer`in e}function xe(e){return`texture`in e}function Se(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>be(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||w(r.buffer)!==w(n.buffer)||!Ee(r.usage)&&!Ee(n.usage))continue;let a=Ce(r.buffer),o=Ce(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=w(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${we(a)} and ${we(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function Ce(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function we(e){return`${e.offset}–${e.offset+e.size} bytes`}function Te(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function Ee(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function De(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function Oe(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function ke(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(be(t)){let n=w(t.buffer);if(Te(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(Ee(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(xe(t)){let n=T(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&Ae(n.resource,t)&&(De(t.usage)&&Oe(n.resource.usage)||Oe(t.usage)&&(De(n.resource.usage)||Oe(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function Ae(e,t){if(T(e.texture)!==T(t.texture))return!1;let n=je(e.texture),r=je(t.texture);return Me(n.aspect,r.aspect)&&Ne(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&Ne(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function je(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function Me(e,t){return e===`all`||t===`all`||e===t}function Ne(e,t,n,r){return e<n+r&&n<e+t}function Pe(e,t){let n=Ie(e,e=>be(e)?w(e.buffer):null),r=new Map;e.forEach((e,t)=>{if(!e.retainedBuffers?.length)return;let n=r.get(e.retainedBuffers);n?n.lastUse=t:r.set(e.retainedBuffers,{firstUse:t,lastUse:t})});for(let[e,t]of r)for(let r of e){if(!r.transient)continue;let e=n.get(r);n.set(r,{firstUse:Math.min(e?.firstUse??t.firstUse,t.firstUse),lastUse:Math.max(e?.lastUse??t.lastUse,t.lastUse)})}let i=[],o=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),s=new me((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),c=new Map,l=e=>{let t=e&(a.MAP_READ|a.MAP_WRITE),n=c.get(t);return n||(n=new me((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index),c.set(t,n)),n};for(let{buffer:e,lifetime:t}of o){if(!t)continue;for(;s.peek()&&s.peek().allocation.lastUse<t.firstUse;){let e=s.pop();l(e.allocation.usage).push(e)}let n=l(e.usage).pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:i.length},i.push(n.allocation));let{allocation:r}=n;r.byteLength=Math.max(r.byteLength,e.byteLength),r.usage|=e.usage,r.lastUse=t.lastUse,r.handles.push(e),s.push(n)}return i}function Fe(e,t){let n=Ie(e,e=>xe(e)?T(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&Re(n.descriptor,e));n||(n={descriptor:Le(e),byteLength:ze(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function Ie(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function Le(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function Re(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function ze(t){let n=0;for(let r=0;r<t.mipLevels;r++)n=Be(n,e.computeMemoryLayout({format:t.format,width:Math.max(1,t.width>>r),height:t.dimension===`1d`?1:Math.max(1,t.height>>r),depth:t.dimension===`3d`?Math.max(1,t.depth>>r):t.depth,byteAlignment:1}).byteLength,`texture "${t.id}" mip estimates`);let r=n*t.samples;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph texture "${t.id}" byte estimate exceeds safe integer range`);return r}function Be(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function Ve(e,t){return e.reduce((e,n)=>Be(e,n,t),0)}var He=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},Ue=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},We=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=p(this.data)}},Ge=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},Ke=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},qe=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}};function Je(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function Ye(e,t){for(let n of t)Je(e,n)}function Xe(e){return{...e,type:`compute`}}var Ze=4,Qe=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){it(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function $e(e,t,n={}){it(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=et();for(;s<a.length;){let r=tt(n,a[s]);if(s>e&&nt(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||rt(n,t))break}let c=Object.freeze(i===`progressive`?a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[]):[]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:nt(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>tt(e,t),et());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function et(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function tt(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+ +!!t.condition}}function nt(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function rt(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function it(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function at(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var ot=class{readResource;stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i,a){this.readResource=a,this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let o=e.filter(e=>e.stats.condition?.outcome!==`skipped`),s=o.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:o.length,skippedNodeCount:e.length-o.length,computePassCount:n,coalescedComputeNodeCount:s-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},st=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){gt(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),vt(e,this.device),t&&Ct(t,e,this.device);let n=this.addBuffer(new He(this,e,!1,t));if(t){let e=lt(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof l&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),vt(e,this.device),this.addBuffer(new He(this,e,!0))}getUniqueResourceId(e){let t=e,n=1;for(;this.buffers.has(t)||this.textures.has(t)||this.externalTextures.has(t);)t=`${e}-${n++}`;return t}createDataView(e,t){this.assertBuffer(e);let n=d(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return St(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new Ue(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(u(n)||f(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=d(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new We({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=bt(e,this.device);return t&&wt(t,n,this.device),this.addTexture(new Ge(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=bt(e,this.device);return this.addTexture(new Ge(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),yt(e,this.device),this.addExternalTexture(new Ke(this,e))}createTransientTexture(e){this.assertMutable();let t=bt(e,this.device);return this.addTexture(new Ge(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new qe(e,xt(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)Ye(this,e.getCommandNodes(this));else if(`type`in e)Je(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){if(this.device.type!==`webgpu`&&e.inputs?.getResourceUses().some(e=>`buffer`in e&&e.usage.startsWith(`storage-`)))throw Error(`Storage render inputs require WebGPU`);e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...e.inputs?.getResourceUses()??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(e={}){return this.assertMutable(),gt(this.device,`compilation`),this.compiled=!0,new ct(he({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes,kernelMetadata:e.kernelMetadata}))}async compileAsync(e={}){return this.assertMutable(),gt(this.device,`compilation`),this.compiled=!0,new ct(await ge({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes,kernelMetadata:e.kernelMetadata}))}addNode(e){if(this.device.type!==`webgpu`&&e.type!==`render`)throw Error(`WebGL graphs support render passes only`);if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*Ze>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>be(e)&&w(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(be(t)){let e=w(t.buffer);this.assertBuffer(e),Et(e,t.usage)}else if(xe(t)){let e=T(t.texture);if(this.assertTexture(e),Dt(e,t.usage),Ot(t.texture,t.usage),this.device.type===`webgl`&&t.usage===`sampled`&&t.texture instanceof qe&&!jt(t.texture))throw Error(`WebGL sampled textures require a full-resource view`)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}Se(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=lt(t.buffer),r={byteLength:ut(t),usage:n.usage},i=t.buffer instanceof l?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof l?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&dt(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&dt(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&lt(n.defaultBuffer)===e&&dt(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&dt(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&dt(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},ct=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(be(t)){let e=w(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(xe(t)){let e=T(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=ht(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return $e(this.preflight,e,t)}createExecution(e,t={}){return new Qe({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(gt(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=_t(),o=this.resolveImportedBuffers(t.buffers??{});pt(t.frameTextures??{},t.externalTextures??{});let s=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),c=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of s.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of c.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of c.textures.values())this.consumedExternalTextures.add(e);let l=s.textures,u=e=>{let t=w(e),n=t.transient?this.transientBuffers.get(t):o.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},d=e=>{let t=T(e),n=t.transient?this.transientTextures.get(t):l.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},f=e=>{let t=d(e);if(e instanceof Ge||jt(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},p={commandEncoder:e,parameters:t.parameters,getBuffer:u,getTexture:d,getTextureView:f,getExternalTexture:e=>{let t=c.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},m=[],h,g=0,_=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,v=()=>{let e=h;h=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=_t();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){let e=_t();m.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{h||(h=e.beginComputePass({id:n.id}),g++);let t=h;o=mt(t,e),o&&(_=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?at(t,u(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...p,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}_||v();break}case`render`:{v();let t=r,i=t.getRenderPassProps?.(p)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,f):void 0,s=n.attachments?.resolveTargets?.map(e=>e?f(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=mt(c,e),c.pushDebugGroup(n.id);try{t.encode({...p,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:v(),r.encode(p);break}let s=_t();m.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{v()}let y=_t();return new ot(m,y-i,g,i,y,async(e,t)=>{if(this.destroyed)throw Error(`Graph has been destroyed.`);let n=this.compiledNodes.findIndex(({node:t})=>t.id===e),r=this.compiledNodes[n]?.node.resources?.[t],i=this.preflight.nodes[n]?.resources?.[t];if(!r||!i)throw Error(`Resource is unavailable.`);if(`externalTexture`in r)throw Error(`External images cannot be read back.`);let o=`buffer`in r?w(r.buffer):T(r.texture);if(`frameScoped`in o&&o.frameScoped)throw Error(`Frame textures expire after presentation.`);let s=`buffer`in r?u(r.buffer):d(r.texture),c=s instanceof a?this.transientBuffers:this.transientTextures;if(o.transient&&[...c].some(([e,t])=>e!==o&&t===s))throw Error(`Transient allocation is reused; logical contents are no longer available.`);return pe(s,i)})}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);Ct(a,i,this.device);let o=lt(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);wt(e.texture,a,this.device),n.set(a,ft(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);wt(o,a,this.device),n.set(a,ft(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);Tt(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function lt(e){return e instanceof l?e.buffer:e}function ut(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function dt(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function ft(e){if(e instanceof oe){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function pt(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function mt(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function ht(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function gt(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function _t(){return globalThis.performance?.now()??Date.now()}function vt(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function yt(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function bt(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,n===`3d`?r:1))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function xt(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function St(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function Ct(e,t,n){let r=lt(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function wt(e,t,n){let r=ft(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function Tt(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function Et(e,t){let n=kt(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function Dt(e,t){let n=At(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function Ot(e,t){if(e instanceof qe&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function kt(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return a.STORAGE;case`uniform`:return a.UNIFORM;case`copy-source`:return a.COPY_SRC;case`copy-destination`:return a.COPY_DST;case`indirect`:return a.INDIRECT;case`vertex`:return a.VERTEX;case`index`:return a.INDEX}}function At(e){switch(e){case`sampled`:return s.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return s.STORAGE;case`render-attachment`:return s.RENDER;case`copy-source`:return s.COPY_SRC;case`copy-destination`:return s.COPY_DST}}function jt(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var Mt=class extends st{constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);super(e,t)}},Nt=120,Pt=class{maxSamples;getNodeGroup;graphs=new Map;encodingGraphs=new WeakMap;constructor(e={}){let t=e.maxSamples??Nt;if(!Number.isSafeInteger(t)||t<=0)throw Error(`GPUCommandGraphInspector maxSamples must be a positive safe integer`);this.maxSamples=t,this.getNodeGroup=e.getNodeGroup}registerGraph(e){this.graphs.set(e.id,{id:e.id,stats:Ft(e.stats),capabilities:Object.freeze({...e.capabilities}),...e.preflight?{preflight:It(e.preflight)}:{},encodingCount:0,timingReadFailureCount:0,cpuSamples:[],gpuSamples:[],counters:new Map,nodes:new Map});let t=this.getGraph(e.id);for(let n of e.preflight?.nodes??[])this.getNode(t,n)}observeGraph(e){this.registerGraph(e);let t=this.getGraph(e.id),n=new WeakMap,r=!0,i=()=>r&&this.graphs.get(e.id)===t;return Object.freeze({graph:e,encode:(n,r)=>{let a=e.encode(n,r);return i()&&this.recordGraphEncoding(t,a),a},recordGPUTimings:async r=>{let a=n.get(r);if(a)return await a;if(i()&&this.encodingGraphs.get(r)===t){let i=this.recordGraphGPUTimings(e.id,t,r);return n.set(r,i),await i}},recordCounters:e=>{i()&&this.recordGraphCounters(t,e)},detach:()=>{r&&(r=!1,this.graphs.get(e.id)===t&&this.graphs.delete(e.id))}})}clear(){this.graphs.clear()}recordEncoding(e,t){let n=this.getGraph(e);this.recordGraphEncoding(n,t)}async readResource(e,t,n){let r=this.getGraph(e);if(!r.encoding?.readResource)throw Error(`No live resource readback is available.`);let i=await r.encoding.readResource(t,n);if(this.graphs.get(e)!==r)throw Error(`Graph registration changed during readback.`);return i}recordCounters(e,t){this.recordGraphCounters(this.getGraph(e),t)}recordGraphEncoding(e,t){e.encoding=t,this.encodingGraphs.set(t,e);let{stats:n}=t;e.encodingCount++,this.addSample(e.cpuSamples,n.cpuEncodeTimeMilliseconds);for(let t of n.nodes){let n=this.getNode(e,t);this.addSample(n.cpuSamples,t.cpuEncodeTimeMilliseconds)}}recordGraphCounters(e,t){let n=Object.entries(t);for(let[e,t]of n)if(!e||!Number.isFinite(t)||t<0)throw Error(`GPUCommandGraphInspector counters require an ID and a finite, non-negative value`);for(let[t,r]of n){let n=e.counters.get(t);n||(n=[],e.counters.set(t,n)),this.addSample(n,r)}}async recordGPUTimings(e,t){let n=this.encodingGraphs.get(t)??this.getGraph(e);return await this.recordGraphGPUTimings(e,n,t)}async recordGraphGPUTimings(e,t,n){if(this.graphs.get(e)!==t)return;let r;try{r=await n.readTimings()}catch{this.graphs.get(e)===t&&t.timingReadFailureCount++;return}if(this.graphs.get(e)===t){r.gpuTimeMilliseconds!==void 0&&this.addSample(t.gpuSamples,r.gpuTimeMilliseconds);for(let e of r.nodes)if(e.gpuTimeMilliseconds!==void 0){let n=this.getNode(t,e);this.addSample(n.gpuSamples,e.gpuTimeMilliseconds)}return r}}getSnapshot(){let e=Array.from(this.graphs.values(),e=>this.getGraphSnapshot(e));return Object.freeze({graphs:Object.freeze(e)})}getGraph(e){let t=this.graphs.get(e);if(!t)throw Error(`GPUCommandGraphInspector graph "${e}" is not registered`);return t}getNode(e,t){let n=e.nodes.get(t.id);if(n)return t.description!==void 0&&(n.description=t.description),t.resources!==void 0&&(n.resources=Bt(t.resources)),n;let r=Bt(t.resources),i=this.getNodeGroup?.({graphId:e.id,id:t.id,type:t.type,description:t.description,resources:r}),a={id:t.id,resources:r,...t.description===void 0?{}:{description:t.description},type:t.type,...i===void 0?{}:{group:i},cpuSamples:[],gpuSamples:[]};return e.nodes.set(a.id,a),a}addSample(e,t){e.push(t),e.length>this.maxSamples&&e.splice(0,e.length-this.maxSamples)}getGraphSnapshot(e){let t=[],n=new Set;for(let r of e.stats.nodeOrder){let i=e.nodes.get(r);i&&(t.push(i),n.add(r))}for(let r of e.nodes.values())n.has(r.id)||t.push(r);let r=t.map(e=>Object.freeze({id:e.id,resources:e.resources,...e.description===void 0?{}:{description:e.description},type:e.type,...e.group===void 0?{}:{group:e.group},cpu:Lt(e.cpuSamples),gpu:Lt(e.gpuSamples)})),i=Array.from(e.counters,([e,t])=>Rt(e,t));return Object.freeze({id:e.id,stats:e.stats,capabilities:e.capabilities,...e.preflight?{preflight:e.preflight}:{},encodingCount:e.encodingCount,timingReadFailureCount:e.timingReadFailureCount,totals:Object.freeze({cpu:Lt(e.cpuSamples),gpu:Lt(e.gpuSamples)}),counters:Object.freeze(i),nodes:Object.freeze(r)})}};function Ft(e){return Object.freeze({...e,nodeOrder:Object.freeze([...e.nodeOrder])})}function It(e){return Object.freeze({...e,nodes:Object.freeze(e.nodes.map(e=>Object.freeze({...e,resources:Bt(e.resources)})))})}function Lt(e){if(e.length===0)return Object.freeze({sampleCount:0});let t=[...e].sort((e,t)=>e-t);return Object.freeze({sampleCount:e.length,latestMilliseconds:e[e.length-1],p50Milliseconds:zt(t,.5),p95Milliseconds:zt(t,.95)})}function Rt(e,t){let n=[...t].sort((e,t)=>e-t);return Object.freeze({id:e,sampleCount:t.length,latestValue:t[t.length-1],p50Value:zt(n,.5),p95Value:zt(n,.95)})}function zt(e,t){return e[Math.ceil(t*e.length)-1]}function Bt(e){return e&&Object.freeze(e.map(e=>Object.freeze({...e})))}var Vt=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!Wt(t.style,n.style)&&(Ut(r,t.style),Ht(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return Ht(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function Ht(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(Gt(n),String(r))}function Ut(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(Gt(n))}function Wt(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length&&n.every(n=>e?.[n]===t?.[n])}function Gt(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var Kt=class extends Vt{static defaultProps={...Vt.defaultProps,panel:void 0,placement:`top-left`};stopObservingPanel;_onAdd(e){let t=super._onAdd(e);return this.observePanel(),t}setProps(e){super.setProps(e),this.rootElement&&this.observePanel()}onRemove(){this.stopObservingPanel?.(),this.stopObservingPanel=void 0,super.onRemove()}getObservedPanels(){return this.props.panel?[this.props.panel]:[]}observePanel(){this.stopObservingPanel?.();let e=[...new Set(this.getObservedPanels())].map(e=>e.subscribe(()=>this.updateHTML()));this.stopObservingPanel=()=>e.forEach(e=>e())}},qt,E,Jt,D,Yt,Xt,Zt,Qt,$t,en,tn,nn,rn,an,on,sn={},cn=[],ln=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,un=Array.isArray;function O(e,t){for(var n in t)e[n]=t[n];return e}function dn(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function k(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?qt.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return fn(e,o,r,i,null)}function fn(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Jt,__i:-1,__u:0};return i==null&&E.vnode!=null&&E.vnode(a),a}function A(e){return e.children}function j(e,t){this.props=e,this.context=t}function pn(e,t){if(t==null)return e.__?pn(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?pn(e):null}function mn(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=O({},t);a.__v=t.__v+1,E.vnode&&E.vnode(a),En(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??pn(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,On(r,a,i),t.__e=t.__=null,a.__e!=n&&hn(a)}}function hn(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),hn(e)}function gn(e){(!e.__d&&(e.__d=!0)&&D.push(e)&&!_n.__r++||Yt!=E.debounceRendering)&&((Yt=E.debounceRendering)||Xt)(_n)}function _n(){try{for(var e,t=1;D.length;)D.length>t&&D.sort(Zt),e=D.shift(),t=D.length,mn(e)}finally{D.length=_n.__r=0}}function vn(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||cn,y=t.length;for(c=yn(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||sn,p.__i=d,g=En(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&jn(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=bn(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function yn(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=fn(null,o,null,null,null):un(o)?o=e.__k[a]=fn(A,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=fn(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=Sn(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=pn(s)),Mn(s,s));return r}function bn(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=bn(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=pn(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function xn(e,t){return t||=[],e==null||typeof e==`boolean`||(un(e)?e.some(function(e){xn(e,t)}):t.push(e)),t}function Sn(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>+!!u){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function Cn(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||ln.test(t)?n:n+`px`}function wn(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||Cn(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||Cn(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(tn,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[en]=r[en]:(n[en]=nn,e.addEventListener(t,a?an:rn,a)):e.removeEventListener(t,a?an:rn,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function Tn(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[$t]==null)t[$t]=nn++;else if(t[$t]<n[en])return;return n(E.event?E.event(t):t)}}}function En(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,ee,S,te,C=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=E.__b)&&u(t);n:if(typeof C==`function`)try{if(_=t.props,v=C.prototype&&C.prototype.render,y=(u=C.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new C(_,b):(t.__c=d=new j(_,b),d.constructor=C,d.render=Nn),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&C.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=O({},d.__s)),O(d.__s,C.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&C.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&C.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),cn.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=E.__r,ee=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),cn.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++ee<25);d.state=d.__s,d.getChildContext!=null&&(r=O(O({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),S=u!=null&&u.type===A&&u.key==null?kn(u.props.children):u,s=vn(e,un(S)?S:[S],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(te=a.length;te--;)dn(a[te]);Dn(t)}else t.__e=n.__e,t.__k=n.__k,e.then||Dn(t);E.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=An(n.__e,t,n,r,i,a,o,c,l);return(u=E.diffed)&&u(t),128&t.__u?void 0:s}function Dn(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(Dn))}function On(e,t,n){for(var r=0;r<n.length;r++)jn(n[r],n[++r],n[++r]);E.__c&&E.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){E.__e(e,t.__v)}})}function kn(e){return typeof e!=`object`||!e||e.__b>0?e:un(e)?e.map(kn):e.constructor===void 0?O({},e):null}function An(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||sn,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(E.__m&&E.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&qt.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||wn(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||wn(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),vn(t.type==`template`?e.content:e,un(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&pn(n,0),s,c),a!=null)for(l=a.length;l--;)dn(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&wn(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&wn(e,l,h,g[l],i))}return e}function jn(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){E.__e(e,n)}}function Mn(e,t,n){var r,i;if(E.unmount&&E.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||jn(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){E.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&Mn(r[i],t,n||typeof e.type!=`function`);n||dn(e.__e),e.__c=e.__=e.__e=void 0}function Nn(e,t,n){return this.constructor(e,n)}function M(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),E.__&&E.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],En(t,e=(!r&&n||t).__k=k(A,null,[e]),i||sn,sn,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?qt.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),On(a,e,o)}function Pn(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,gn(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+on++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}qt=cn.slice,E={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},Jt=0,j.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=O({},this.state);typeof e==`function`&&(e=e(O({},n),this.props)),e&&O(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),gn(this))},j.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),gn(this))},j.prototype.render=A,D=[],Xt=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Zt=function(e,t){return e.__v.__b-t.__v.__b},_n.__r=0,Qt=Math.random().toString(8),$t=`__d`+Qt,en=`__a`+Qt,tn=/(PointerCapture)$|Capture$/i,nn=0,rn=Tn(!1),an=Tn(!0),on=0;var Fn=0;Array.isArray;function N(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Fn,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return E.vnode&&E.vnode(l),l}var P,F,In,Ln,Rn=0,zn=[],I=E,Bn=I.__b,Vn=I.__r,Hn=I.diffed,Un=I.__c,Wn=I.unmount,Gn=I.__;function Kn(e,t){I.__h&&I.__h(F,e,Rn||t),Rn=0;var n=F.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function L(e){return Rn=1,qn(nr,e)}function qn(e,t,n){var r=Kn(P++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):nr(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=F,!F.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};F.__f=!0;var a=F.shouldComponentUpdate,o=F.componentWillUpdate;F.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},F.shouldComponentUpdate=i}return r.__N||r.__}function R(e,t){var n=Kn(P++,3);!I.__s&&tr(n.__H,t)&&(n.__=e,n.u=t,F.__H.__h.push(n))}function z(e,t){var n=Kn(P++,4);!I.__s&&tr(n.__H,t)&&(n.__=e,n.u=t,F.__h.push(n))}function B(e){return Rn=5,V(function(){return{current:e}},[])}function V(e,t){var n=Kn(P++,7);return tr(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function Jn(e,t){return Rn=8,V(function(){return e},t)}function Yn(e){var t=F.context[e.__c],n=Kn(P++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(F)),t.props.value):e.__}function Xn(){for(var e;e=zn.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some($n),t.__h.some(er),t.__h=[]}catch(n){t.__h=[],I.__e(n,e.__v)}}}I.__b=function(e){F=null,Bn&&Bn(e)},I.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Gn&&Gn(e,t)},I.__r=function(e){Vn&&Vn(e),P=0;var t=(F=e.__c).__H;t&&(In===F?(t.__h=[],F.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some($n),t.__h.some(er),t.__h=[],P=0)),In=F},I.diffed=function(e){Hn&&Hn(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(zn.push(t)!==1&&Ln===I.requestAnimationFrame||((Ln=I.requestAnimationFrame)||Qn)(Xn)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),In=F=null},I.__c=function(e,t){t.some(function(e){try{e.__h.some($n),e.__h=e.__h.filter(function(e){return!e.__||er(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],I.__e(n,e.__v)}}),Un&&Un(e,t)},I.unmount=function(e){Wn&&Wn(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{$n(e)}catch(e){t=e}}),n.__H=void 0,t&&I.__e(t,n.__v))};var Zn=typeof requestAnimationFrame==`function`;function Qn(e){var t,n=function(){clearTimeout(r),Zn&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);Zn&&(t=requestAnimationFrame(n))}function $n(e){var t=F,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),F=t}function er(e){var t=F;e.__c=e.__(),F=t}function tr(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function nr(e,t){return typeof t==`function`?t(e):t}var rr=`--panel-preset.--panel-font-size.--panel-padding.--panel-control-height.--panel-control-padding.--panel-surface-radius.--panel-input-corner-radius.--panel-content-background.--panel-gap.--panel-corner-radius.--panel-round-radius.--panel-switch-padding.--panel-focus-color.--panel-accent-color.--panel-hover-background.--panel-disabled-opacity.--menu-corner-radius.--menu-weak-background.--menu-divider.--widget-margin.--button-size.--button-corner-radius.--button-background.--button-stroke.--button-inner-stroke.--button-shadow.--button-backdrop-filter.--button-icon-idle.--button-icon-hover.--button-text.--icon-compass-north-color.--icon-compass-south-color.--menu-gap.--menu-background.--menu-backdrop-filter.--menu-border.--menu-border-color.--menu-shadow.--menu-text.--menu-item-hover.--range-step-button-size.--range-track-size.--range-thumb-size.--range-track-color.--range-thumb-color.--range-decoration-active-color`.split(`.`),ir={"--panel-preset":`light`,"--panel-font-size":`initial`,"--panel-padding":`initial`,"--panel-control-height":`initial`,"--panel-control-padding":`initial`,"--panel-surface-radius":`initial`,"--panel-input-corner-radius":`initial`,"--panel-content-background":`initial`,"--panel-gap":`initial`,"--panel-corner-radius":`initial`,"--panel-round-radius":`initial`,"--panel-switch-padding":`initial`,"--menu-border-color":`initial`,"--panel-focus-color":`initial`,"--panel-accent-color":`initial`,"--panel-hover-background":`initial`,"--panel-disabled-opacity":`initial`,"--menu-corner-radius":`initial`,"--menu-weak-background":`initial`,"--menu-divider":`initial`,"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},ar={"--panel-preset":`dark`,"--panel-font-size":`initial`,"--panel-padding":`initial`,"--panel-control-height":`initial`,"--panel-control-padding":`initial`,"--panel-surface-radius":`initial`,"--panel-input-corner-radius":`initial`,"--panel-content-background":`initial`,"--panel-gap":`initial`,"--panel-corner-radius":`initial`,"--panel-round-radius":`initial`,"--panel-switch-padding":`initial`,"--menu-border-color":`initial`,"--panel-focus-color":`initial`,"--panel-accent-color":`initial`,"--panel-hover-background":`initial`,"--panel-disabled-opacity":`initial`,"--menu-corner-radius":`initial`,"--menu-weak-background":`initial`,"--menu-divider":`initial`,"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},or={"--widget-margin":`8px`,"--button-size":`20px`,"--button-corner-radius":`4px`,"--panel-font-size":`10px`,"--panel-padding":`4px 6px`,"--panel-control-height":`20px`,"--panel-control-padding":`1px 5px`,"--panel-gap":`3px`,"--panel-corner-radius":`4px`,"--panel-round-radius":`999px`,"--panel-switch-padding":`2px`,"--panel-surface-radius":`8px`,"--panel-input-corner-radius":`3px`,"--panel-content-background":`transparent`,"--menu-corner-radius":`8px`,"--menu-backdrop-filter":`none`,"--button-backdrop-filter":`none`,"--menu-gap":`4px`,"--range-step-button-size":`20px`,"--range-track-size":`12px`,"--range-thumb-size":`8px`},sr={light:ir,dark:ar,"sleek-light":{...ir,...or,"--panel-preset":`sleek-light`,"--button-background":`rgba(241, 245, 251, 0.78)`,"--button-stroke":`rgba(82, 111, 157, 0.28)`,"--button-inner-stroke":`1px solid rgba(82, 111, 157, 0.28)`,"--button-shadow":`inset 0 1px 0 rgba(255, 255, 255, 0.7)`,"--button-text":`#24344c`,"--button-icon-idle":`#526985`,"--button-icon-hover":`#16385e`,"--menu-background":`rgba(248, 251, 255, 0.72)`,"--menu-text":`#24344c`,"--menu-border":`1px solid rgba(82, 111, 157, 0.28)`,"--menu-border-color":`rgba(82, 111, 157, 0.28)`,"--menu-divider":`1px solid rgba(82, 111, 157, 0.16)`,"--menu-weak-background":`rgba(210, 225, 245, 0.18)`,"--menu-item-hover":`rgba(70, 125, 196, 0.12)`,"--menu-shadow":`0 12px 30px rgba(15, 32, 60, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.65)`,"--panel-focus-color":`#2563eb`,"--panel-accent-color":`#167565`,"--panel-hover-background":`rgba(201, 221, 247, 0.76)`,"--panel-disabled-opacity":`0.5`,"--range-track-color":`rgba(111, 137, 173, 0.38)`,"--range-thumb-color":`#527caa`,"--range-decoration-active-color":`#267cba`},"sleek-dark":{...ar,...or,"--panel-preset":`sleek-dark`,"--button-background":`rgba(15, 23, 42, 0.72)`,"--button-stroke":`rgba(140, 169, 211, 0.28)`,"--button-inner-stroke":`initial`,"--button-shadow":`inset 0 1px 0 rgba(255, 255, 255, 0.04)`,"--button-text":`#e2e8f0`,"--button-icon-idle":`#94a3b8`,"--button-icon-hover":`#eff4fd`,"--menu-background":`rgba(8, 12, 20, 0.91)`,"--menu-text":`#e2e8f0`,"--menu-border":`1px solid rgba(126, 155, 205, 0.26)`,"--menu-border-color":`rgba(126, 155, 205, 0.26)`,"--menu-divider":`1px solid rgba(126, 155, 205, 0.18)`,"--menu-weak-background":`rgba(15, 23, 42, 0.48)`,"--menu-item-hover":`rgba(125, 211, 252, 0.12)`,"--menu-shadow":`0 12px 30px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04)`,"--panel-focus-color":`#8bb4ff`,"--panel-accent-color":`#86cbbd`,"--panel-hover-background":`rgba(70, 104, 159, 0.38)`,"--panel-disabled-opacity":`0.5`,"--range-track-color":`rgba(71, 85, 105, 0.8)`,"--range-thumb-color":`#7dd3fc`,"--range-decoration-active-color":`#86cbbd`}};function cr(e){return{...sr[e.base],...e.variables,"--panel-preset":e.base}}function lr(e){let t=e.ownerDocument.defaultView?.getComputedStyle(e),n={};for(let e of rr){let r=t?.getPropertyValue(e).trim();r&&(n[e]=r)}return n}function ur(e,t){let n=new MutationObserver(t),r=e;for(;r;)n.observe(r,{attributes:!0,attributeFilter:[`style`,`class`]}),r=r.parentElement;return()=>n.disconnect()}var dr=`data-deck-gl-community-panels-styles`,fr=`/* Stop at nested scopes so explicit original presets retain their native states. */
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
`,pr=`.deck-panel-layout {
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
`,mr=`.deck-widget {
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
`;function hr(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function gr(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(hr))return!0}return!1}function _r(e){if(!e.querySelector(`style[data-panel-theme-styles]`)){let t=e.createElement(`style`);t.setAttribute(`data-panel-theme-styles`,`true`),t.textContent=fr,e.head.appendChild(t)}if(e.querySelector(`style[${dr}]`)||gr(e))return;let t=e.createElement(`style`);t.setAttribute(dr,`true`),t.textContent=mr,e.head.appendChild(t)}function vr(e){if(e.querySelector(`style[data-panel-chrome-styles]`))return;let t=e.createElement(`style`);t.setAttribute(`data-panel-chrome-styles`,`true`),t.textContent=pr,e.head.append(t)}var yr=Pn(void 0);function br({panel:e,children:t}){let[,n]=qn(e=>e+1,0);z(()=>e.subscribe(()=>n(void 0),!1),[e]);let r=Yn(yr),i=B(null),[a,o]=L(!1),[s,c]=L(`light`),l=Sr(r??s,e.theme);return z(()=>{if(i.current&&_r(i.current.ownerDocument),!r){let e=i.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=t.ownerDocument.defaultView?.getComputedStyle(t).getPropertyValue(`--panel-preset`).trim();o(!!(e&&Object.hasOwn(sr,e)));let n=Tr(t);c(e=>e===n?e:n)};n();let r=new MutationObserver(()=>{n()});for(let e of Cr(t))r.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{r.disconnect()}}},[r]),N(yr.Provider,{value:l,children:N(`div`,{ref:i,"data-panel-theme-mode":xr(l),"data-panel-theme-preset":l,style:(!e.theme||e.theme===`inherit`)&&(r||a)?void 0:wr(l,e.theme),children:t})})}function xr(e){return e===`dark`||e===`sleek-dark`?`dark`:`light`}function Sr(e,t){if(typeof t==`object`)return t.base;if(t&&t!==`inherit`&&t!==`invert`)return t;if(t===`invert`){let t=xr(e)===`dark`?`light`:`dark`;return e.startsWith(`sleek-`)?`sleek-${t}`:t}return e}function Cr(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function wr(e,t){return{...typeof t==`object`?cr(t):sr[e]}}function Tr(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=t.getComputedStyle(e),r=n.getPropertyValue(`--panel-preset`).trim();if(Object.hasOwn(sr,r))return r;let i=Er(n.getPropertyValue(`--menu-background`).trim());return i&&Dr(i)<.5?`dark`:`light`}function Er(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function Dr([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}var Or=Pn(void 0),kr=class extends Kt{static defaultProps={...Kt.defaultProps,title:void 0,widthPx:320,heightPx:240,fitContent:!1,resizable:!1};className=`deck-panel-chrome`;placement=`top-left`;get overlayPlacement(){return this.placement}resizedWidth;resizedHeight;stopDrag;eventRoot;get isPinned(){return!0}get isDocked(){return this.isPinned}get isPinnable(){return!1}get canPin(){return!!this.panelManager?.contentElement}setProps(e){e.fitContent===!0&&(this.resizedWidth=void 0,this.resizedHeight=void 0),e.widthPx!==void 0&&e.widthPx!==this.props.widthPx&&(this.resizedWidth=void 0),e.heightPx!==void 0&&e.heightPx!==this.props.heightPx&&(this.resizedHeight=void 0),super.setProps(e)}reconcileProps(e){let t={...e};t.fitContent===this.props.fitContent&&delete t.fitContent,this.setProps(t)}onRenderHTML(e){this.prepareRoot(e);let{panel:t,title:n}=this.props,r={pinned:this.isPinned,side:this.side,canPin:this.canPin};M(N(Or.Provider,{value:r,children:N(`section`,{className:`deck-panel-chrome-shell`,"aria-label":n??`Panel`,children:[n||this.isPinnable||this.hasHeaderActions?N(`header`,{className:`deck-panel-chrome-header`,children:[this.renderHeaderTitle(),this.renderHeaderActions(),this.renderPinControl()]}):null,this.renderHeaderPanel(),N(`div`,{className:`deck-panel-chrome-content`,hidden:!this.isContentOpen,children:t?N(br,{panel:t,children:t.content}):null}),this.renderResizeHandle()]})}),e)}prepareRoot(e){if(this.eventRoot!==e){this.removeEventListeners(),this.eventRoot=e;for(let t of jr)e.addEventListener(t,Mr)}vr(e.ownerDocument),e.style.margin=this.isDocked?`0`:`${this.floatingOffsetPx}px`,this.panelManager?.updateDockedContainer?.(this),e.hidden=this.isPinned&&!this.canPin;let{fitContent:t}=this.props,n=this.side===`left`||this.side===`right`,r=this.resizedWidth??Ar(this.props.widthPx,320),i=this.resizedHeight??Ar(this.props.heightPx,240);e.dataset.side=this.side,e.dataset.pinned=String(this.isPinned),e.dataset.docked=String(this.isDocked),e.dataset.pinnable=String(this.isPinnable),e.style.width=this.isDocked&&!n?`100%`:t&&this.resizedWidth===void 0?`max-content`:`${r}px`,e.style.height=this.isDocked&&!n?t&&this.resizedHeight===void 0?`max-content`:`${i}px`:``}renderPinControl(){return this.isPinnable?N(`button`,{type:`button`,disabled:!this.canPin,"aria-label":this.isPinned?`Unpin panel`:`Pin panel`,title:this.isPinned?`Unpin panel`:`Pin panel`,"aria-pressed":this.isPinned,onClick:()=>this.changePinned(!this.isPinned),children:N(`svg`,{width:`18`,height:`18`,viewBox:`0 0 24 24`,fill:this.isPinned?`currentColor`:`none`,stroke:`currentColor`,strokeWidth:`1.75`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,focusable:`false`,style:{transform:this.isPinned?`none`:`rotate(45deg)`},children:[N(`path`,{d:`M9 3h6l-1 7 4 4v2H6v-2l4-4-1-7Z`}),N(`path`,{d:`M12 16v5`})]})}):null}renderResizeHandle(){let e=this.rootElement,t=this.props.title,n=this.side===`left`||this.side===`right`;return this.isDocked&&this.canPin&&this.props.resizable?N(`div`,{className:`deck-panel-chrome-divider`,role:`separator`,tabIndex:0,"aria-label":`Resize ${t??`panel`}`,"aria-orientation":n?`vertical`:`horizontal`,"aria-valuemin":0,"aria-valuemax":Math.floor(this.getSizeLimit()),"aria-valuenow":Math.round(n?e.getBoundingClientRect().width:e.getBoundingClientRect().height),onPointerDown:e=>this.startResize(e),onKeyDown:t=>{let r=(n?{ArrowLeft:-1,ArrowRight:1}:{ArrowUp:-1,ArrowDown:1})[t.key];if(r){t.preventDefault();let i=e.getBoundingClientRect();this.resizePanel((n?i.width:i.height)+r*10*this.getResizeSign())}}}):null}onRemove(){super.onRemove(),this.stopDrag?.(),this.removeEventListeners(),this.rootElement&&M(null,this.rootElement)}get floatingOffsetPx(){return 0}get hasHeaderActions(){return!1}renderHeaderActions(){return null}get isContentOpen(){return!0}renderHeaderPanel(){return null}renderHeaderTitle(){return N(`span`,{children:this.props.title})}changePinned(e){}removeEventListeners(){if(this.eventRoot)for(let e of jr)this.eventRoot.removeEventListener(e,Mr);this.eventRoot=void 0}getResizeSign(){return this.side===`right`||this.side===`bottom`?-1:1}getSizeLimit(){let e=this.panelManager?.parentElement;return e?(this.side===`left`||this.side===`right`?e.clientWidth:e.clientHeight)*.45:0}resizePanel(e){let t=Math.max(0,Math.min(e,this.getSizeLimit()));this.side===`left`||this.side===`right`?this.resizedWidth=t:this.resizedHeight=t,this.updateHTML()}startResize(e){if(e.button!==0||!this.rootElement)return;e.preventDefault(),this.stopDrag?.();let t=e.currentTarget,n=this.side===`left`||this.side===`right`,r=this.rootElement.getBoundingClientRect(),i=n?r.width:r.height,a=n?e.clientX:e.clientY,o=this.side;t.setPointerCapture(e.pointerId);let s=e=>{if(this.side!==o||!this.isDocked){this.stopDrag?.();return}this.resizePanel(i+((n?e.clientX:e.clientY)-a)*this.getResizeSign())},c=()=>{t.removeEventListener(`pointermove`,s),t.removeEventListener(`pointerup`,c),t.removeEventListener(`pointercancel`,c),t.removeEventListener(`lostpointercapture`,c),t.hasPointerCapture(e.pointerId)&&t.releasePointerCapture(e.pointerId),this.stopDrag=void 0};this.stopDrag=c,t.addEventListener(`pointermove`,s),t.addEventListener(`pointerup`,c),t.addEventListener(`pointercancel`,c),t.addEventListener(`lostpointercapture`,c)}};function Ar(e,t){return Number.isFinite(e)?Math.max(0,e):t}var jr=[`pointerdown`,`pointermove`,`pointerup`,`pointercancel`,`mousedown`,`mousemove`,`mouseup`,`touchstart`,`touchmove`,`touchend`,`touchcancel`,`click`,`dblclick`,`contextmenu`,`wheel`];function Mr(e){e.stopPropagation()}var Nr=class{parent;content;root;center;edges;marker;originalStyles;observer;constructor(e,t,n){this.parent=e,this.content=t;let r=e.ownerDocument;this.marker=r.createComment(`panel-content`),t.before(this.marker),this.root=r.createElement(`div`),this.root.className=`deck-panel-layout`,this.center=r.createElement(`div`),this.center.className=`deck-panel-layout-center`,this.edges={};for(let e of[`top`,`left`,`right`,`bottom`]){let t=r.createElement(`div`);t.className=`deck-panel-layout-edge`,t.dataset.side=e,this.edges[e]=t,this.root.append(t)}this.root.append(this.center),this.marker.after(this.root),this.center.append(t),this.originalStyles=new Map;for(let[e,n]of Object.entries({position:`absolute`,top:`0px`,right:`0px`,bottom:`0px`,left:`0px`,width:`100%`,height:`100%`,"min-width":`0px`,"min-height":`0px`,"margin-top":`0px`,"margin-right":`0px`,"margin-bottom":`0px`,"margin-left":`0px`,"box-sizing":`border-box`}))this.originalStyles.set(e,{value:t.style.getPropertyValue(e),priority:t.style.getPropertyPriority(e)}),t.style.setProperty(e,n);this.observer=new ResizeObserver(n),this.observer.observe(this.root),this.observer.observe(this.center)}updateLimits(){let{width:e,height:t}=this.root.getBoundingClientRect();for(let n of[`top`,`left`,`right`,`bottom`]){let r=n===`left`||n===`right`;for(let i of this.edges[n].children){let n=i.style;n.maxWidth=r?`${e*.45}px`:``,n.maxHeight=r?``:`${t*.45}px`}}}finalize(){this.observer.disconnect(),this.marker.parentNode?this.marker.before(this.content):this.parent.append(this.content);for(let[e,{value:t,priority:n}]of this.originalStyles)t?this.content.style.setProperty(e,t,n):this.content.style.removeProperty(e);this.root.remove(),this.marker.remove()}},Pr={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Fr=`top-left`,Ir=`root`,Lr=class{deck;parentElement;contentElement;layout;resizeObserver;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,contentElement:t,components:n,deck:r=null,className:i}){if(t&&t.parentElement!==e)throw Error(`PanelManager contentElement must be a direct child of parentElement`);this.contentElement=t,this.deck=r,this.parentElement=e,this.className=i,_r(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),i&&this.parentElement.classList.add(i),typeof ResizeObserver<`u`&&(this.resizeObserver=new ResizeObserver(()=>this._updateContainers()),this.resizeObserver.observe(e)),this.setProps({components:n})}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!Rr(e.components,this.components)){let t=e.components.filter(zr);this._setComponents(t)}}finalize(){this.resizeObserver?.disconnect(),this.resizeObserver=void 0;for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.layout?.finalize(),this.layout=void 0,this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}updateDockedContainer(e){let t=e.rootElement;if(!t)return;if(vr(this.parentElement.ownerDocument),this.contentElement&&!this.layout){this.layout=new Nr(this.parentElement,this.contentElement,()=>this._updateContainers());for(let e of Object.values(this.containers))this.layout.center.append(e)}t.hidden=e.isPinned&&!this.contentElement;let n=e.isDocked&&this.layout?this.layout.edges[e.side]:this._getContainer(e._container??e.viewId??null,e.overlayPlacement);if(t.parentElement!==n){let r=t.ownerDocument.activeElement,i=this.resolvedComponents.indexOf(e),a=e.isDocked&&i>=0?this.resolvedComponents.slice(i+1).find(t=>t instanceof kr&&t.isDocked&&t.side===e.side&&t.rootElement?.parentElement===n):void 0;n.insertBefore(t,a?.rootElement??null),r instanceof HTMLElement&&t.contains(r)&&r.focus({preventScroll:!0})}t.style.maxWidth=``,t.style.maxHeight=``,this._updateContainers()}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e instanceof kr?e.reconcileProps(n.props):e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e;for(let e of this.resolvedComponents)e instanceof kr&&e.isDocked&&this.layout&&e.rootElement&&this.layout.edges[e.side].append(e.rootElement);this._updateContainers()}_addComponent(e){let{viewId:t=null,placement:n=Fr}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:Ir,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,(this.layout?.center??this.parentElement).append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Pr[t]),r.append(i)),i}_updateContainers(){let e=this.deck;this.layout?.updateLimits();let t=this.layout?.center.clientWidth??e?.width??this.parentElement.clientWidth,n=this.layout?.center.clientHeight??e?.height??this.parentElement.clientHeight;for(let e of this.resolvedComponents)if(e instanceof kr&&!e.isDocked&&e.rootElement){let r=e.rootElement.style,i=(parseFloat(r.marginLeft)||0)+(parseFloat(r.marginRight)||0),a=(parseFloat(r.marginTop)||0)+(parseFloat(r.marginBottom)||0);r.maxWidth=`${Math.max(0,t-i)}px`,r.maxHeight=`${Math.max(0,n-a)}px`}for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===Ir||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function Rr(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function zr(e){return e instanceof Vt}var H;function Br(e){let t=Math.max(220,Math.floor(e));return Number.isFinite(t)?t:360}function Vr({panel:e,headerPanel:t,title:n,widthPx:r,maxHeightPx:i,open:a,collapsible:o,onOpenChange:s}){return N(`section`,{style:Kr(r,i),"aria-label":n??`Panel box`,onPointerDown:U,onPointerMove:U,onPointerUp:U,onMouseDown:U,onMouseMove:U,onMouseUp:U,onTouchStart:U,onTouchMove:U,onTouchEnd:U,onClick:U,onContextMenu:U,onWheel:U,children:[n?N(`header`,{style:qr,children:o?N(`button`,{type:`button`,"aria-expanded":a,style:Jr,onClick:()=>s(!a),children:[N(`span`,{children:n}),N(`span`,{"aria-hidden":`true`,style:Yr(a),children:a?`▾`:`▸`})]}):N(`span`,{children:n})}):null,Ur(t),N(`div`,{style:Xr(a),children:e?N(br,{panel:e,children:e.content}):null})]})}var Hr=class extends kr{static defaultProps={...kr.defaultProps,pinnable:!1,side:`right`,pinned:void 0,defaultPinned:!1,onPinnedChange:void 0,offsetPx:0,resizable:!0,id:`box-panel-container`,placement:`bottom-left`,title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0,headerPanel:void 0};className=`deck-widget-box`;placement=H.defaultProps.placement;title=H.defaultProps.title;widthPx=H.defaultProps.widthPx;collapsible=H.defaultProps.collapsible;isOpen=H.defaultProps.defaultOpen;uncontrolledPinned=!1;#e=H.defaultProps.panel;#t=null;#n=void 0;#r=!1;#i=!1;#a=void 0;constructor(e={}){super({...H.defaultProps,...e}),this.uncontrolledPinned=this.props.defaultPinned,this.setProps(this.props)}get side(){return this.props.side}get isPinned(){return this.props.pinnable&&(this.props.pinned??this.uncontrolledPinned)}get isDocked(){return this.isPinned&&this.isOpen}get isPinnable(){return this.props.pinnable}get floatingOffsetPx(){return Number.isFinite(this.props.offsetPx)?Math.max(0,this.props.offsetPx):0}get isContentOpen(){return this.isOpen}getObservedPanels(){return[this.props.panel,this.props.headerPanel].filter(e=>!!e)}renderHeaderPanel(){return Ur(this.props.headerPanel)}renderHeaderTitle(){let e=this.title??this.#e?.title??`Panel`;return this.collapsible?N(`button`,{type:`button`,className:`deck-panel-chrome-toggle`,"aria-expanded":this.isOpen,"aria-label":`${this.isOpen?`Collapse`:`Expand`} ${e}`,title:`${this.isOpen?`Collapse`:`Expand`} ${e}`,onClick:()=>this.#o(!this.isOpen),children:[N(`span`,{children:e}),N(`svg`,{width:`14`,height:`14`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.75`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,focusable:`false`,children:N(`path`,{d:this.isOpen?`m6 9 6 6 6-6`:`m9 6 6 6-6 6`})})]}):N(`span`,{children:e})}changePinned(e){!this.canPin||!this.props.pinnable||(this.props.pinned===void 0&&(this.uncontrolledPinned=e),this.props.onPinnedChange?.(e),this.updateHTML())}setProps(e){this.props.pinned!==void 0&&`pinned`in e&&e.pinned===void 0&&(this.uncontrolledPinned=this.props.pinned),e.placement!==void 0&&(this.placement=e.placement),`title`in e&&(this.title=e.title),e.widthPx!==void 0&&(this.widthPx=Br(e.widthPx)),e.collapsible!==void 0&&(this.collapsible=e.collapsible),this.#c(e),`panel`in e&&(this.#e=e.panel),super.setProps(e),this.#s()}onRemove(){super.onRemove(),this.#t&&M(null,this.#t)}onRenderHTML(e){this.#t=e,this.#s()}onViewportChange(){this.#s()}#o=e=>{this.#i||(this.isOpen=e),this.#a?.(e),this.#s()};#s=()=>{if(!this.#t)return;let e=this.#t;if(e.classList.toggle(`deck-panel-chrome`,this.props.pinnable),this.props.pinnable?super.onRenderHTML(e):(e.dataset.pinnable===`true`&&(this.panelManager?.updateDockedContainer(this),e.hidden=!1,e.style.width=``,e.style.height=``,e.style.maxWidth=``,e.style.maxHeight=``,e.dataset.pinnable=`false`),this.#n=Gr(e)),e.style.margin=this.isDocked?`0`:`${this.floatingOffsetPx}px`,this.props.pinnable){this.isOpen||(e.style.width=`max-content`);return}M(N(Vr,{panel:this.#e,headerPanel:this.props.headerPanel,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#o}),this.#t)};#c(e){if(this.#i=(`open`in e?e.open:this.props.open)!==void 0,e.onOpenChange!==void 0&&(this.#a=e.onOpenChange),e.open!==void 0){this.isOpen=e.open,this.#r=!0;return}!this.#r&&e.defaultOpen!==void 0&&(this.isOpen=e.defaultOpen,this.#r=!0)}};H=Hr;function Ur(e){return e?N(`div`,{"data-panel-header":``,style:Wr,children:N(br,{panel:e,children:e.content})}):null}var Wr={flex:`0 1 auto`,minWidth:0,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`var(--panel-padding, 8px 12px)`};function U(e){e.stopPropagation()}function Gr(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow===`hidden`||n?.overflowX===`hidden`||n?.overflowY===`hidden`)&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}var Kr=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...t===void 0?{}:{maxHeight:`${t}px`},boxSizing:`border-box`,display:`flex`,flexDirection:`column`,pointerEvents:`auto`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--panel-surface-radius, var(--panel-corner-radius, 12px))`,background:`var(--menu-background, rgba(255, 255, 255, 0.96))`,backdropFilter:`var(--menu-backdrop-filter, unset)`,WebkitBackdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))`,overflow:`hidden`}),qr={padding:`var(--panel-padding, 14px 16px 10px)`,fontSize:`var(--panel-font-size, 18px)`,fontWeight:700,lineHeight:1.2,color:`var(--button-text, currentColor)`},Jr={width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`var(--panel-gap, 12px)`,border:`none`,background:`none`,color:`inherit`,padding:`0`,margin:`0`,cursor:`pointer`,font:`inherit`,textAlign:`left`},Yr=e=>({fontSize:`var(--panel-font-size, 18px)`,lineHeight:1,color:`var(--button-icon-idle, #616166)`,transform:e?`translateY(1px)`:`translateY(-1px)`}),Xr=e=>({display:e?`block`:`none`,flex:`1 1 auto`,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`var(--panel-padding, 0 16px 16px)`});function Zr(e,t){let[n,r]=L(t),i=e!==void 0,a=i?e:n;return R(()=>{i&&r(e)},[i,e]),[a,Jn(e=>{i||r(e)},[i])]}var W=class extends Vt{static defaultProps={...Vt.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;listeners=new Set;constructor(e){super($r(e,new.target.defaultProps))}get title(){return this.props.title}get content(){return k(Qr,{panel:this})}get theme(){return this.props.theme}get disabled(){return this.props.disabled}get keepMounted(){return this.props.keepMounted}renderContent(){return this.props.content}getChildPanels(){return[]}subscribe(e,t=!0){this.listeners.add(e);let n=t?this.getChildPanels().map(t=>t.subscribe(e)):[];return()=>{this.listeners.delete(e),n.forEach(e=>e())}}setProps(e){super.setProps($r(e,this.constructor.defaultProps));for(let e of this.listeners)e()}onRenderHTML(e){M(k(br,{panel:this},this.content),e)}onRemove(){this.rootElement&&M(null,this.rootElement)}};function Qr({panel:e}){let[,t]=qn(e=>e+1,0);return z(()=>e.subscribe(()=>t(void 0))),e.renderContent()}function $r(e,t){return Object.fromEntries(Object.entries(e).map(([e,n])=>[e,n===void 0&&Object.hasOwn(t,e)?t[e]:n]))}var ei=class extends W{static defaultProps={...W.defaultProps,id:`tabbed-panels`,title:`Panels`,tabListLayout:`wrap`,theme:`inherit`};getChildPanels(){return this.props.panels}renderContent(){let{panels:e,tabListLayout:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i}=this.props;return N(ti,{panels:e,tabListLayout:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i})}};function ti({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=Zr(r,n),c=e.filter(e=>!e.disabled),l=c.some(e=>e.id===o)?o:c[0]?.id;return z(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),N(`div`,{className:t,style:ni,children:[N(`div`,{"data-panel-tabs":``,style:ri(a),children:e.map(e=>{let t=e.id===l;return N(`button`,{"data-panel-active":t,type:`button`,style:{...ii,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border-color, var(--menu-border, rgba(148, 163, 184, 0.35)))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onClick:()=>{e.disabled||(s(e.id),i?.(e.id))},children:e.title},e.id)})}),N(`div`,{style:ai,children:e.map(e=>{let t=e.id===l;return N(`div`,{"aria-hidden":!t,style:{...oi,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:N(br,{panel:e,children:e.content})},e.id)})})]})}var ni={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--panel-surface-radius, var(--button-corner-radius, 8px))`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,backdropFilter:`var(--menu-backdrop-filter, unset)`,WebkitBackdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, none)`};function ri(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`var(--panel-gap, 4px)`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`var(--panel-padding, 4px 6px)`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var ii={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`var(--panel-corner-radius, 4px)`,margin:0,padding:`var(--panel-control-padding, 4px 8px)`,fontSize:`var(--panel-font-size, 12px)`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},ai={display:`grid`,alignItems:`start`,padding:`var(--panel-padding, 10px)`,overflow:`auto`},oi={gridArea:`1 / 1`,minWidth:0};function si({className:e,onRenderHTML:t}){let n=B(null);return z(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),N(`div`,{ref:n,className:e})}var ci=class extends W{static defaultProps={...W.defaultProps,id:`custom-panel`};renderContent(){let{onRenderHTML:e,className:t}=this.props;return N(si,{className:t,onRenderHTML:e})}};function li(e,t){let n=xi(t);if(!n.length)return;let r=e;for(let e of n){if(!bi(r))return;r=r[e]}return r}function ui(e,t,n){let r=e;return Number.isFinite(t)&&(r=Math.max(t,r)),Number.isFinite(n)&&(r=Math.min(n,r)),r}function di(e,t,n){let r=xi(t);if(!r.length)return e;let i={...e},a=i,o=e;return r.forEach((e,t)=>{if(t===r.length-1){a[e]=n;return}let i=o[e],s=bi(i)?{...i}:{};a[e]=s,a=s,o=bi(i)?i:{}}),i}function fi(e,t){return e.id?.trim()||e.name?.trim()||`section-${t}`}function pi(e){return e.initiallyCollapsed??!0}function mi(e){return e.reduce((e,t,n)=>(e[fi(t,n)]=pi(t),e),{})}function hi(e){return bi(e)&&`label`in e&&`value`in e?{label:String(e.label),value:e.value,description:typeof e.description==`string`?e.description:void 0}:{label:String(e),value:e}}function gi(e){return e&&e.persist?e.persist:`local-storage`}function _i(e){return e.defaultValue===void 0?e.type===`boolean`?!1:e.type===`number`?Number.isFinite(e.min)?e.min:0:e.type===`select`?e.options?.length?hi(e.options[0]).value:``:e.type===`multi-select`?[]:``:e.defaultValue}function vi(e,t){let n=li(t,e.name);if(e.type===`boolean`)return typeof n==`boolean`?n:_i(e);if(e.type===`number`)return ui(typeof n==`number`?n:Number.isFinite(Number(n))?Number(n):_i(e),e.min,e.max);if(e.type===`select`){let t=(e.options??[]).map(hi),r=_i(e),i=typeof n==`string`||typeof n==`number`||typeof n==`boolean`?n:r;if(!t.length)return String(i);let a=t.find(e=>e.value===i);return a?a.value:t[0].value}if(e.type===`multi-select`){if(Array.isArray(n))return n.filter(e=>typeof e==`string`&&e.length>0);let t=_i(e);return Array.isArray(t)?t:[]}if(typeof n==`string`)return n;let r=_i(e);return typeof r==`string`?r:String(r)}function yi(e,t){let n={};return t.forEach((t,r)=>{let i=fi(t,r);n[i]=e[i]??pi(t)}),n}function bi(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function xi(e){return e.split(`.`).map(e=>e.trim()).filter(Boolean)}function Si(e,t){for(var n in t)e[n]=t[n];return e}function Ci(e,t){for(var n in e)if(n!==`__source`&&!(n in t))return!0;for(var r in t)if(r!==`__source`&&e[r]!==t[r])return!0;return!1}function wi(e,t){this.props=e,this.context=t}(wi.prototype=new j).isPureReactComponent=!0,wi.prototype.shouldComponentUpdate=function(e,t){return Ci(this.props,e)||Ci(this.state,t)};var Ti=E.__b;E.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),Ti&&Ti(e)},typeof Symbol<`u`&&Symbol.for;var Ei=E.__e;E.__e=function(e,t,n,r){if(e.then){for(var i,a=t;a=a.__;)if((i=a.__c)&&i.__c)return t.__e??(t.__e=n.__e,t.__k=n.__k),i.__c(e,t)}Ei(e,t,n,r)};var Di=E.unmount;function Oi(e,t,n){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(e){typeof e.__c==`function`&&e.__c()}),e.__c.__H=null),(e=Si({},e)).__c!=null&&(e.__c.__P===n&&(e.__c.__P=t),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(e){return Oi(e,t,n)})),e}function ki(e,t,n){return e&&n&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(e){return ki(e,t,n)}),e.__c&&e.__c.__P===t&&(e.__e&&n.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=n)),e}function Ai(){this.__u=0,this.o=null,this.__b=null}function ji(e){var t=e.__&&e.__.__c;return t&&t.__a&&t.__a(e)}function Mi(){this.i=null,this.l=null}E.unmount=function(e){var t=e.__c;t&&(t.__z=!0),t&&t.__R&&t.__R(),t&&32&e.__u&&(e.type=null),Di&&Di(e)},(Ai.prototype=new j).__c=function(e,t){var n=t.__c,r=this;r.o??=[],r.o.push(n);var i=ji(r.__v),a=!1,o=function(){a||r.__z||(a=!0,n.__R=null,i?i(c):c())};n.__R=o;var s=n.__P;n.__P=null;var c=function(){if(!--r.__u){if(r.state.__a){var e=r.state.__a;r.__v.__k[0]=ki(e,e.__c.__P,e.__c.__O)}var t;for(r.setState({__a:r.__b=null});t=r.o.pop();)t.__P=s,t.forceUpdate()}};r.__u++||32&t.__u||r.setState({__a:r.__b=r.__v.__k[0]}),e.then(o,o)},Ai.prototype.componentWillUnmount=function(){this.o=[]},Ai.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var n=document.createElement(`div`),r=this.__v.__k[0].__c;this.__v.__k[0]=Oi(this.__b,n,r.__O=r.__P)}this.__b=null}var i=t.__a&&k(A,null,e.fallback);return i&&(i.__u&=-33),[k(A,null,t.__a?null:e.children),i]};var Ni=function(e,t,n){if(++n[1]===n[0]&&e.l.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!==`t`||!e.l.size))for(n=e.i;n;){for(;n.length>3;)n.pop()();if(n[1]<n[0])break;e.i=n=n[2]}};function Pi(e){return this.getChildContext=function(){return e.context},e.children}function Fi(e){var t=this,n=e.h;if(t.componentWillUnmount=function(){M(null,t.v),t.v=null,t.h=null},t.h&&t.h!==n&&t.componentWillUnmount(),!t.v){for(var r=t.__v;r!==null&&!r.__m&&r.__!==null;)r=r.__;t.h=n,t.v={nodeType:1,parentNode:n,childNodes:[],__k:{__m:r.__m},contains:function(){return!0},namespaceURI:n.namespaceURI,insertBefore:function(e,n){this.childNodes.push(e),t.h.insertBefore(e,n)},removeChild:function(e){this.childNodes.splice(this.childNodes.indexOf(e)>>>1,1),t.h.removeChild(e)}}}M(k(Pi,{context:t.context},e.__v),t.v)}function Ii(e,t){var n=k(Fi,{__v:e,h:t});return n.containerInfo=t,n}(Mi.prototype=new j).__a=function(e){var t=this,n=ji(t.__v),r=t.l.get(e);return r[0]++,function(i){var a=function(){t.props.revealOrder?(r.push(i),Ni(t,e,r)):i()};n?n(a):a()}},Mi.prototype.render=function(e){this.i=null,this.l=new Map;var t=xn(e.children);e.revealOrder&&e.revealOrder[0]===`b`&&t.reverse();for(var n=t.length;n--;)this.l.set(t[n],this.i=[1,0,this.i]);return e.children},Mi.prototype.componentDidUpdate=Mi.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(t,n){Ni(e,n,t)})};var Li=typeof Symbol<`u`&&Symbol.for&&Symbol.for(`react.element`)||60103,Ri=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,zi=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,Bi=/[A-Z0-9]/g,Vi=typeof document<`u`,Hi=function(e){return(typeof Symbol<`u`&&typeof Symbol()==`symbol`?/fil|che|rad/:/fil|che|ra/).test(e)};j.prototype.isReactComponent=!0,[`componentWillMount`,`componentWillReceiveProps`,`componentWillUpdate`].forEach(function(e){Object.defineProperty(j.prototype,e,{configurable:!0,get:function(){return this[`UNSAFE_`+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var Ui=E.event;E.event=function(e){return Ui&&(e=Ui(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Wi={configurable:!0,get:function(){return this.class}},Gi=E.vnode;E.vnode=function(e){typeof e.type==`string`&&function(e){var t=e.props,n=e.type,r={},i=n.indexOf(`-`)==-1;for(var a in t){var o=t[a];if(!(a===`value`&&`defaultValue`in t&&o==null||Vi&&a===`children`&&n===`noscript`||a===`class`||a===`className`)){var s=a.toLowerCase();a===`defaultValue`&&`value`in t&&t.value==null?a=`value`:a===`download`&&!0===o?o=``:s===`translate`&&o===`no`?o=!1:s[0]===`o`&&s[1]===`n`?s===`ondoubleclick`?a=`ondblclick`:s!==`onchange`||n!==`input`&&n!==`textarea`||Hi(t.type)?s===`onfocus`?a=`onfocusin`:s===`onblur`?a=`onfocusout`:zi.test(a)&&(a=s):s=a=`oninput`:i&&Ri.test(a)?a=a.replace(Bi,`-$&`).toLowerCase():o===null&&(o=void 0),s===`oninput`&&r[a=s]&&(a=`oninputCapture`),r[a]=o}}n==`select`&&(r.multiple&&Array.isArray(r.value)&&(r.value=xn(t.children).forEach(function(e){e.props.selected=r.value.indexOf(e.props.value)!=-1})),r.defaultValue!=null&&(r.value=xn(t.children).forEach(function(e){e.props.selected=r.multiple?r.defaultValue.indexOf(e.props.value)!=-1:r.defaultValue==e.props.value}))),t.class&&!t.className?(r.class=t.class,Object.defineProperty(r,"className",Wi)):t.className&&(r.class=r.className=t.className),e.props=r}(e),e.$$typeof=Li,Gi&&Gi(e)};var Ki=E.__r;E.__r=function(e){Ki&&Ki(e),e.__c};var qi=E.diffed;E.diffed=function(e){qi&&qi(e);var t=e.props,n=e.__e;n!=null&&e.type===`textarea`&&`value`in t&&t.value!==n.value&&(n.value=t.value==null?``:t.value)};function Ji({id:e,ariaLabel:t,value:n,options:r,onChange:i,fontSize:a,placeholder:o=`All`,trailingIcon:s,style:c}){let l=B(null),u=B(null),[d,f]=L(!1),[p,m]=L(``),[h,g]=L(K.menu),_=V(()=>n.filter(e=>typeof e==`string`&&e.length>0),[n]),v=V(()=>Xi(r,_),[r,_]),y=V(()=>new Set(_),[_]),b=V(()=>{let e=p.trim().toLowerCase();return e?v.filter(t=>t.label.toLowerCase().includes(e)||t.value.toLowerCase().includes(e)):v},[v,p]),x=`${e??t.toLowerCase().replace(/[^a-z0-9]+/g,`-`)}-options`,ee=Zi(_,v,o);R(()=>{let e=l.current?.ownerDocument;if(!d||!e)return;let t=e=>{let t=l.current,n=u.current;!t||!e.target||t.contains(e.target)||n?.contains(e.target)||f(!1)};return e.addEventListener(`pointerdown`,t),()=>e.removeEventListener(`pointerdown`,t)},[d]),z(()=>{let e=l.current?.ownerDocument?.defaultView;if(!d||!l.current||!e)return;let t=()=>{let e=l.current;if(!e)return;let t=e.getBoundingClientRect();g({...K.menu,...lr(e),top:`${t.bottom+4}px`,left:`${t.left}px`,width:`${t.width}px`})};t();let n=ur(l.current,t);return e.addEventListener(`resize`,t),e.addEventListener(`scroll`,t,!0),()=>{n(),e.removeEventListener(`resize`,t),e.removeEventListener(`scroll`,t,!0)}},[d]);let S=e=>{i(y.has(e.value)?_.filter(t=>t!==e.value):[..._,e.value])};return N(`div`,{ref:l,style:{...K.shell,...c},onPointerDown:e=>G(e),onMouseDown:e=>G(e),onWheel:e=>G(e),onClick:e=>G(e),children:[N(`button`,{id:e,type:`button`,"aria-label":t,"aria-haspopup":`listbox`,"aria-expanded":d,"aria-controls":d?x:void 0,style:{...K.button,...a===void 0?{}:{fontSize:a},...d?K.buttonOpen:{},opacity:v.length?1:.58,cursor:v.length?`pointer`:`default`},disabled:!v.length,onClick:()=>f(e=>!e),onKeyDown:e=>{G(e),(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),f(e=>!e)),e.key===`Escape`&&(e.preventDefault(),f(!1))},onKeyUp:e=>G(e),children:[N(`span`,{style:K.summaryText,children:ee}),s??N(Yi,{})]}),d&&l.current?.ownerDocument.body?Ii(N(`div`,{ref:u,id:x,role:`listbox`,"data-panel-theme-preset":h[`--panel-preset`],"aria-label":`${t} options`,"aria-multiselectable":`true`,style:h,onPointerDown:e=>G(e),onMouseDown:e=>G(e),onWheel:e=>G(e),onClick:e=>G(e),children:[N(`input`,{"aria-label":`${t} search`,type:`search`,value:p,placeholder:`Search...`,style:{...K.searchInput,...a===void 0?{}:{fontSize:a}},onInput:e=>m(e.currentTarget.value),onKeyDown:e=>G(e),onKeyUp:e=>G(e)}),b.map(e=>{let t=y.has(e.value);return N(`button`,{type:`button`,role:`option`,"aria-selected":t,style:{...K.option,...a===void 0?{}:{fontSize:a},...t?K.optionSelected:{}},onMouseDown:e=>{e.preventDefault(),G(e)},onClick:()=>S(e),children:[N(`span`,{children:e.label}),t?N(`span`,{"aria-hidden":!0,children:`✓`}):null]},e.value)}),b.length===0?N(`div`,{style:{...K.emptyState,...a===void 0?{}:{fontSize:a}},children:`No matching options`}):null,_.length>0?N(`button`,{type:`button`,style:{...K.clearButton,...a===void 0?{}:{fontSize:a}},onMouseDown:e=>{e.preventDefault(),G(e)},onClick:()=>i([]),children:`Clear selection`}):null]}),l.current.ownerDocument.body):null]})}function Yi(){return N(`svg`,{viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.8`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,style:K.chevron,children:N(`path`,{d:`m6 9 6 6 6-6`})})}function Xi(e,t){let n=new Set(e.map(e=>e.value));return[...e,...t.filter(e=>!n.has(e)).map(e=>({label:e,value:e}))]}function Zi(e,t,n){if(e.length===0)return n;let r=new Map(t.map(e=>[e.value,e.label])),i=e.map(e=>r.get(e)??e);return i.length<=2?i.join(`, `):`${i.length} selected`}function G(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation()}var K={shell:{position:`relative`,width:`100%`,minWidth:0},button:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`var(--panel-gap, 12px)`,width:`100%`,minHeight:`var(--panel-control-height, 36px)`,borderRadius:`var(--panel-corner-radius, 13px)`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.24))`,background:`var(--menu-background, rgba(51, 65, 85, 0.78))`,color:`var(--menu-text, #f8fafc)`,padding:`var(--panel-control-padding, 0 14px)`,font:`inherit`,fontSize:`var(--panel-font-size, 12px)`,fontWeight:650,textAlign:`left`,cursor:`pointer`},buttonOpen:{borderColor:`var(--button-icon-hover, rgba(96, 165, 250, 0.78))`,boxShadow:`0 0 0 2px rgba(96, 165, 250, 0.16)`},menu:{position:`fixed`,backdropFilter:`var(--menu-backdrop-filter, unset)`,WebkitBackdropFilter:`var(--menu-backdrop-filter, unset)`,fontSize:`var(--panel-font-size)`,zIndex:1e4,display:`grid`,gap:`var(--panel-gap, 2px)`,maxHeight:260,overflow:`auto`,borderRadius:`var(--panel-corner-radius, 13px)`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.28))`,background:`var(--menu-background, #334155)`,boxShadow:`var(--menu-shadow, 0 16px 34px rgba(0, 0, 0, 0.32))`,padding:`var(--panel-control-padding, 4px)`},option:{minHeight:`var(--panel-control-height, 30px)`,border:`none`,borderRadius:`var(--panel-corner-radius, 9px)`,background:`transparent`,color:`var(--menu-text, #f8fafc)`,font:`inherit`,fontSize:`var(--panel-font-size, 12px)`,fontWeight:430,textAlign:`left`,cursor:`pointer`,padding:`var(--panel-control-padding, 0 10px)`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:`var(--panel-gap, 8px)`},optionActive:{background:`var(--menu-item-hover, rgba(148, 163, 184, 0.16))`},optionSelected:{background:`var(--button-background, rgba(96, 165, 250, 0.36))`,color:`var(--menu-text, #f8fafc)`,fontWeight:520},summaryText:{minWidth:0,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},searchInput:{minHeight:`var(--panel-control-height, 30px)`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.28))`,borderRadius:`var(--panel-corner-radius, 9px)`,background:`var(--button-background, rgba(15, 23, 42, 0.22))`,color:`var(--menu-text, #f8fafc)`,font:`inherit`,fontSize:`var(--panel-font-size, 12px)`,padding:`var(--panel-control-padding, 0 10px)`,outline:`none`},emptyState:{color:`var(--button-text, #94a3b8)`,fontSize:`var(--panel-font-size, 12px)`,padding:`var(--panel-control-padding, 8px 10px)`},clearButton:{minHeight:`var(--panel-control-height, 30px)`,border:`none`,borderRadius:`var(--panel-corner-radius, 9px)`,background:`transparent`,color:`var(--button-text, #94a3b8)`,font:`inherit`,fontSize:`var(--panel-font-size, 12px)`,fontWeight:520,textAlign:`left`,cursor:`pointer`,padding:`var(--panel-control-padding, 0 10px)`},chevron:{width:18,height:18,flex:`0 0 auto`,color:`var(--button-text, #94a3b8)`,pointerEvents:`none`}},Qi=new WeakMap,$i={position:`relative`,width:`100%`,minWidth:0},ea={width:`100%`,minHeight:`var(--panel-control-height, 32px)`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:`var(--panel-gap, 8px)`,border:`var(--button-inner-stroke, 1px solid rgba(148, 163, 184, 0.48))`,borderRadius:`var(--button-corner-radius, 8px)`,background:`var(--button-background, rgba(255, 255, 255, 0.94))`,color:`var(--button-text, currentColor)`,boxSizing:`border-box`,padding:`var(--panel-control-padding, 6px 8px 6px 10px)`,fontSize:`var(--panel-font-size, 12px)`,fontWeight:600,cursor:`pointer`,boxShadow:`none`,outline:`none`},ta={borderColor:`var(--button-icon-hover, rgba(59, 130, 246, 0.82))`,boxShadow:`0 0 0 2px rgba(59, 130, 246, 0.16)`},na={overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,textAlign:`left`},ra={width:`16px`,height:`16px`,display:`inline-flex`,alignItems:`center`,justifyContent:`center`,color:`var(--button-icon-idle, currentColor)`,fontSize:`var(--panel-font-size, 10px)`,lineHeight:1,transition:`transform 120ms ease`},ia={position:`fixed`,backdropFilter:`var(--menu-backdrop-filter, unset)`,WebkitBackdropFilter:`var(--menu-backdrop-filter, unset)`,fontSize:`var(--panel-font-size)`,zIndex:1e4,width:`max-content`,maxWidth:`calc(100vw - 16px)`,maxHeight:`192px`,overflowX:`hidden`,overflowY:`auto`,padding:`var(--panel-control-padding, 4px)`,border:`var(--button-inner-stroke, 1px solid rgba(148, 163, 184, 0.48))`,borderRadius:`var(--button-corner-radius, 8px)`,background:`var(--menu-background, var(--container-background, var(--button-background, rgba(255, 255, 255, 0.98))))`,color:`var(--button-text, currentColor)`,boxShadow:`0 12px 28px rgba(15, 23, 42, 0.18)`,boxSizing:`border-box`},aa={width:`100%`,minHeight:`var(--panel-control-height, 28px)`,border:0,borderRadius:`calc(var(--button-corner-radius, 8px) - 1px)`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:`var(--panel-gap, 8px)`,margin:0,padding:`var(--panel-control-padding, 5px 8px)`,background:`transparent`,color:`var(--button-text, currentColor)`,cursor:`pointer`,fontSize:`var(--panel-font-size, 12px)`,textAlign:`left`},oa={minWidth:0,display:`grid`,gap:`var(--panel-gap, 1px)`},sa={whiteSpace:`nowrap`,textAlign:`left`},ca={color:`var(--button-icon-idle, currentColor)`,fontSize:`var(--panel-font-size, 11px)`,fontWeight:400,lineHeight:1.25,opacity:.78,textAlign:`left`,whiteSpace:`normal`},la={background:`var(--menu-item-hover, rgba(148, 163, 184, 0.16))`},ua={color:`var(--button-icon-hover, currentColor)`,fontWeight:700};function q(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation()}function da(e,t){return e.findIndex(e=>e.value===t)}function fa(e,t,n){return n===0?-1:((e>=0?e:t>0?-1:0)+t+n)%n}function pa(e,t){let n=e.ownerDocument,r=Qi.get(n);r&&r.root!==e&&r.close(),Qi.set(n,{close:t,root:e})}function ma(e){let t=e.ownerDocument;Qi.get(t)?.root===e&&Qi.delete(t)}function ha({id:e,label:t,value:n,options:r,onValueChange:i,fontSize:a}){let[o,s]=L(!1),[c,l]=L(()=>da(r,n)),[u,d]=L(ia),f=B(null),p=B(null),m=B([]),h=`${e}-listbox`,g=V(()=>da(r,n),[r,n]),_=(g>=0?r[g]:void 0)?.label??String(n),v=()=>{let e=f.current;e&&ma(e),s(!1)},y=()=>{let e=f.current;e&&pa(e,v),s(!0)},b=e=>{i(e.value),v()};R(()=>{m.current=m.current.slice(0,r.length)},[r.length]),R(()=>{o||l(g)},[o,g]),R(()=>{let e=f.current?.ownerDocument;if(!o||!e)return;let t=e=>{if(!f.current||!e.target)return;let t=e.target;!f.current.contains(t)&&!p.current?.contains(t)&&v()};return e.addEventListener(`pointerdown`,t,!0),()=>{e.removeEventListener(`pointerdown`,t,!0)}},[o]),R(()=>{let e=f.current;if(!(!o||!e))return pa(e,v),()=>{ma(e)}},[o]),z(()=>{let e=f.current?.ownerDocument,t=e?.defaultView;if(!o||!f.current||!t)return;let n=()=>{if(!f.current)return;let n=f.current.getBoundingClientRect(),r=e.documentElement.clientWidth||t.innerWidth||n.right,i=r-n.right<n.left,a=Math.max(i?r-n.right:n.left,8),o=Math.max(i?n.right-8:r-a-8,0);d({...ia,...lr(f.current),top:`${n.bottom+4}px`,left:i?void 0:`${a}px`,right:i?`${a}px`:void 0,minWidth:`${Math.min(n.width,o)}px`,maxWidth:`${o}px`})};n();let r=ur(f.current,n);return t.addEventListener(`resize`,n),t.addEventListener(`scroll`,n,!0),()=>{r(),t.removeEventListener(`resize`,n),t.removeEventListener(`scroll`,n,!0)}},[o]),R(()=>{!o||c<0||m.current[c]?.scrollIntoView?.({block:`nearest`})},[c,o]);let x=()=>{if(o){v();return}y()},ee=e=>{if(q(e),e.key===`ArrowDown`||e.key===`ArrowUp`){e.preventDefault(),y(),l(t=>fa(t,e.key===`ArrowDown`?1:-1,r.length));return}if(e.key===`Enter`||e.key===` `){if(e.preventDefault(),o&&c>=0){let e=r[c];e&&b(e);return}y(),l(g);return}e.key===`Escape`&&(e.preventDefault(),v())};return N(`div`,{ref:f,style:$i,onPointerDown:e=>q(e),onMouseDown:e=>q(e),onWheel:e=>q(e),onClick:e=>q(e),children:[N(`button`,{id:e,type:`button`,"aria-label":t,"aria-haspopup":`listbox`,"aria-expanded":o,"aria-controls":o?h:void 0,style:{...ea,...a===void 0?{}:{fontSize:a},...o?ta:{},opacity:r.length?1:.58,cursor:r.length?`pointer`:`default`},disabled:!r.length,onClick:x,onKeyDown:ee,onKeyUp:e=>q(e),children:[N(`span`,{style:na,children:_}),N(`span`,{"aria-hidden":!0,style:{...ra,transform:o?`rotate(180deg)`:`rotate(0deg)`},children:`▾`})]}),o&&f.current?.ownerDocument.body&&Ii(N(`div`,{ref:p,id:h,role:`listbox`,"data-panel-theme-preset":u[`--panel-preset`],"aria-label":t,style:u,onPointerDown:e=>q(e),onMouseDown:e=>q(e),onWheel:e=>q(e),onClick:e=>q(e),children:r.map((t,n)=>{let r=n===g,i=n===c,o=t.description?.trim();return N(`button`,{ref:e=>{m.current[n]=e},type:`button`,role:`option`,"aria-selected":r,"data-panel-active":i,style:{...aa,...a===void 0?{}:{fontSize:a},...i?la:{},...r?ua:{}},onPointerEnter:()=>l(n),onMouseDown:e=>{e.preventDefault(),q(e)},onClick:()=>b(t),children:[N(`span`,{style:oa,children:[N(`span`,{"data-select-option-label":`true`,style:sa,children:t.label}),o&&N(`span`,{"data-select-option-description":`true`,style:ca,children:o})]}),r&&N(`span`,{"aria-hidden":!0,children:`✓`})]},`${e}-${n}-${String(t.value)}`)})}),f.current.ownerDocument.body)]})}var ga={width:`100%`,border:0,margin:0,padding:`var(--panel-padding, 8px 12px)`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`var(--panel-gap, 8px)`,background:`transparent`,color:`inherit`,cursor:`pointer`,fontSize:`var(--panel-font-size, 12px)`},_a={display:`grid`,gap:`var(--panel-gap, 8px)`,padding:`var(--panel-padding, 8px 12px 12px 18px)`},va={display:`grid`,gap:`var(--panel-gap, 8px)`,padding:`var(--panel-padding, 10px 12px 12px)`},ya={display:`grid`,minHeight:`var(--panel-control-height, 0px)`,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 1.4fr)`,alignItems:`center`,gap:`var(--panel-gap, 8px)`},ba={fontSize:`var(--panel-font-size, 12px)`,fontWeight:600,color:`var(--button-text, currentColor)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},xa={width:`100%`,minWidth:0,display:`flex`,alignItems:`center`},Sa={width:`100%`,border:`var(--button-inner-stroke, 1px solid rgba(128, 128, 128, 0.35))`,borderRadius:`var(--panel-input-corner-radius, var(--panel-corner-radius, calc(var(--button-corner-radius, 8px) - 2px)))`,backgroundColor:`var(--button-background, #fff)`,backdropFilter:`var(--button-backdrop-filter, unset)`,color:`var(--button-text, currentColor)`,fontSize:`var(--panel-font-size, 12px)`,padding:`var(--panel-control-padding, 4px 6px)`,boxSizing:`border-box`},Ca={...Sa,flex:1},wa={border:`var(--button-inner-stroke, 1px solid rgba(128, 128, 128, 0.35))`,borderRadius:`var(--panel-corner-radius, calc(var(--button-corner-radius, 8px) - 2px))`,backgroundColor:`var(--button-background, #fff)`,color:`var(--button-text, currentColor)`,fontSize:`var(--panel-font-size, 11px)`,padding:`var(--panel-padding, 4px 8px)`,cursor:`pointer`,whiteSpace:`nowrap`},Ta={width:`100%`,minWidth:`120px`,margin:0},Ea={...Sa,width:`84px`,flexShrink:0,height:`var(--panel-control-height, 28px)`,lineHeight:`16px`,padding:`var(--panel-control-padding, 2px 6px)`},Da={width:`14px`,height:`14px`,margin:0,accentColor:`var(--panel-accent-color, var(--button-icon-hover, currentColor))`};function Oa(e,t){return t===void 0?e:{...e,fontSize:t}}function J(e){e.stopPropagation()}function ka(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation?.()}function Aa({fontSize:e,inputId:t,label:n,value:r,onApply:i}){let[a,o]=L(r),[s,c]=L(()=>r?[r]:[]),l=a!==r;R(()=>{o(r)},[r]),R(()=>{r&&c(e=>e.includes(r)?e:[r,...e].slice(0,8))},[r]);let u=e=>{o(e.currentTarget.value)},d=()=>{a!==r&&(i(a),c(e=>[a,...e.filter(e=>e!==a)].slice(0,8)))};return N(`div`,{style:xa,children:[N(`input`,{id:t,type:`text`,value:a,onInput:u,list:`${t}-recent-values`,onKeyDown:e=>{e.key===`Enter`&&(e.preventDefault(),d()),ka(e)},onKeyUp:ka,onPointerDown:ka,"aria-label":n,style:Oa(Ca,e)}),s.length>0&&N(`datalist`,{id:`${t}-recent-values`,children:s.map(e=>N(`option`,{value:e},`${t}-${e}`))}),N(`button`,{type:`button`,disabled:!l,style:{...Oa(wa,e),opacity:l?1:.55,cursor:l?`pointer`:`default`,marginLeft:`6px`},onClick:d,onPointerDown:ka,onKeyDown:ka,onKeyUp:ka,children:l?`✓`:`✅`})]})}function ja({fontSize:e,inputId:t,label:n,setting:r,value:i,onValueChange:a}){let o=Number.isFinite(r.min)&&Number.isFinite(r.max),s=ui(i,r.min,r.max),c=Ma(r),l=B(null),[u,d]=L(s);R(()=>{d(s)},[s]),R(()=>()=>{Na(l)},[]);let f=e=>{if(!Number.isFinite(e))return;let t=ui(e,r.min,r.max);Na(l),d(t),a(t)},p=e=>{if(!Number.isFinite(e))return;let t=ui(e,r.min,r.max);if(d(t),c<=0){a(t);return}Na(l),l.current=setTimeout(()=>{l.current=null,a(t)},c)};return o?N(`div`,{style:{display:`flex`,alignItems:`center`,gap:`var(--panel-gap, 8px)`,minWidth:0,width:`100%`},children:[N(`input`,{id:t,type:`range`,min:String(r.min),max:String(r.max),step:String(r.step??1),value:String(u),onInput:e=>p(Number(e.currentTarget.value)),"aria-label":n,style:Ta}),N(`input`,{type:`number`,min:Number.isFinite(r.min)?String(r.min):void 0,max:Number.isFinite(r.max)?String(r.max):void 0,step:String(r.step??1),value:String(u),onInput:e=>f(Number(e.currentTarget.value)),onChange:e=>f(Number(e.currentTarget.value)),"aria-label":`${n} numeric value`,style:Oa(Ea,e)})]}):N(`input`,{id:t,type:`number`,step:String(r.step??1),value:String(u),onInput:e=>f(Number(e.currentTarget.value)),onChange:e=>f(Number(e.currentTarget.value)),"aria-label":n,style:Oa(Sa,e)})}function Ma(e){return Number.isFinite(e.sliderDebounceMs)?Math.max(0,e.sliderDebounceMs):0}function Na(e){e.current!=null&&(clearTimeout(e.current),e.current=null)}function Pa({fontSize:e,setting:t,value:n,onValueChange:r}){let i=t.label??t.name,a=t.description?.trim(),o=`settings-panel-input-${t.name.replace(/[^a-zA-Z0-9_-]/g,`-`)}`,s=e=>{r(e.currentTarget.checked)},c;c=t.type===`boolean`?N(`input`,{id:o,type:`checkbox`,checked:!!n,onInput:s,onChange:s,"aria-label":i,style:Da}):t.type===`number`?N(ja,{fontSize:e,inputId:o,label:i,setting:t,value:Number(n),onValueChange:r}):t.type===`select`?N(ha,{id:o,value:n,label:i,options:(t.options??[]).map(hi),onValueChange:r,fontSize:e}):t.type===`multi-select`?N(Ji,{id:o,ariaLabel:i,value:Array.isArray(n)?n.filter(e=>typeof e==`string`&&e.length>0):[],options:(t.options??[]).map(e=>{let t=hi(e);return{label:t.label,value:String(t.value)}}),onChange:r,fontSize:e}):N(Aa,{fontSize:e,inputId:o,label:i,value:String(n),onApply:r});let l=t.type===`select`||t.type===`multi-select`;return N(`div`,{"data-setting-row-for":t.name,style:ya,title:a,children:[N(`label`,{htmlFor:l?void 0:o,style:Oa(ba,e),children:i}),N(`div`,{style:xa,children:c})]})}function Fa({contentStyle:e,fontSize:t,onValueChange:n,section:r,settings:i}){return N(`div`,{style:e,children:r.settings.map(e=>N(Pa,{fontSize:t,setting:e,value:vi(e,i),onValueChange:t=>n(e.name,t)},e.name))})}function Ia({fontSize:e,onSettingsChange:t,section:n,settings:r}){let[i,a]=L(r);return R(()=>{a(r)},[r]),N(`div`,{style:{minWidth:0,paddingBottom:`8px`},onPointerMove:e=>J(e),onMouseMove:e=>J(e),onPointerDown:e=>J(e),onMouseDown:e=>J(e),onWheel:e=>J(e),onClick:e=>J(e),onKeyDown:e=>J(e),onKeyUp:e=>J(e),children:N(Fa,{contentStyle:va,fontSize:e,onValueChange:(e,n)=>{a(r=>{let i=di(r,e,n);return t?.(i),i})},section:n,settings:i})})}var La={sections:[]},Ra={};function za({fontSize:e,schema:t,settings:n,onSettingsChange:r}){let[i,a]=L(n),[o,s]=L(()=>mi(t.sections));R(()=>{a(n)},[n]),R(()=>{s(e=>yi(e,t.sections))},[t.sections]);let c=V(()=>t.sections.map((e,t)=>({key:fi(e,t),section:e})),[t.sections]),l=c.length===1&&!c[0].section.name&&!c[0].section.description,u=(e,t)=>{a(n=>{let i=di(n,e,t);return r?.(i),i})};return N(`div`,{style:{minWidth:0,paddingBottom:`8px`},onPointerMove:e=>J(e),onMouseMove:e=>J(e),onPointerDown:e=>J(e),onMouseDown:e=>J(e),onWheel:e=>J(e),onClick:e=>J(e),onKeyDown:e=>J(e),onKeyUp:e=>J(e),children:l?N(Fa,{contentStyle:_a,fontSize:e,onValueChange:u,section:c[0].section,settings:i}):c.map(({key:t,section:n})=>{let r=o[t]??!1;return N(`div`,{style:{borderBottom:`1px solid var(--menu-item-hover, rgba(128, 128, 128, 0.22))`},children:[N(`button`,{type:`button`,style:ga,onClick:()=>s(e=>({...e,[t]:!r})),"aria-expanded":!r,children:[N(`span`,{style:{display:`grid`,gap:`var(--panel-gap, 2px)`,textAlign:`left`},children:[N(`span`,{style:{fontWeight:700,fontSize:`var(--panel-font-size, 12px)`},children:n.name}),n.description&&N(`span`,{style:{fontSize:`var(--panel-font-size, 11px)`,color:`var(--button-icon-idle, currentColor)`},children:n.description})]}),N(`span`,{"aria-hidden":!0,children:r?`▸`:`▾`})]}),!r&&N(Fa,{contentStyle:_a,fontSize:e,onValueChange:u,section:n,settings:i})]},t)})})}var Ba=class extends W{static createSectionPanels({label:e=`Settings`,schema:t=La,settings:n=Ra,onSettingsChange:r,fontSize:i,theme:a=`inherit`}){return t.sections.map((t,o)=>new Va({id:fi(t,o),title:t.name||e,theme:a,fontSize:i,onSettingsChange:r,section:t,settings:n}))}get title(){return this.props.title??this.props.schema?.title??this.props.label}static defaultProps={...W.defaultProps,id:`settings-panel`,label:`Settings`,schema:La,settings:Ra,theme:`inherit`,title:void 0};constructor(e={}){super(e)}renderContent(){let{schema:e,settings:t,onSettingsChange:n,fontSize:r}=this.props;return N(za,{fontSize:r,schema:e,settings:t,onSettingsChange:n})}},Va=class extends W{static defaultProps={...W.defaultProps,id:`settings-section-panel`};renderContent(){return N(Ia,{...this.props})}},Ha=class{#e={};#t;#n=new Set;#r=new Map;setLocalStoragePersistence(e){this.#t=e}getSettingsWithLocalStorage(e,t=this.#r){let n=this.getLocalStorageSettings(t),r=e;for(let[e,t]of Object.entries(n))r=di(r,e,t);return r}getLocalStorageSettings(e=this.#r){let t=this.#s(),n={};for(let[r,i]of e){let e=t[r];Ja(i)&&Wa(e)&&(n[r]=vi(i,di({},r,e)))}return n}setCurrentSettings(e){this.#e=this.#a(e)}setOnSettingsChange(e){return e?(this.#n.add(e),()=>{this.#n.delete(e)}):()=>{}}setSettingDefinitions(e){this.#r=new Map(e)}emitSettingsChange(e,t){let n=this.#a(e),r=t??this.#i(n);if(r.length===0){this.#e=n;return}this.#e=n,this.#c(r,n),this.#n.forEach(e=>e(n,r))}setSettingValue(e,t){let n=this.#r.get(e),r=di(this.#e,e,Wa(t)?t:``),i=n?vi(n,r):t,a=li(this.#e,e);if(Ga(a,i))return;let o=di(this.#e,e,i),s=[{type:`setting`,name:e,previousValue:a,nextValue:i,descriptor:n}];this.emitSettingsChange(o,s)}setSettings(e){this.emitSettingsChange(e)}#i(e){let t=[];for(let[n,r]of this.#r){let i=li(this.#e,n),a=li(e,n);Ga(i,a)||t.push({type:`setting`,name:n,previousValue:i,nextValue:a,descriptor:r})}return t}#a(e){let t=e;for(let[n,r]of this.#r)li(e,n)!==void 0&&(t=di(t,n,vi(r,t)));return t}#o(){return this.#t?.getStorage?this.#t.getStorage()??null:typeof window>`u`?null:window.localStorage}#s(){let e=this.#t?.storageKey,t=this.#o();if(!e||!t)return{};try{let n=t.getItem(e);if(!n)return{};let r=JSON.parse(n);return Ua(r)?r:{}}catch{return{}}}#c(e,t){let n=this.#t?.storageKey,r=this.#o();if(!n||!r)return;let i=this.#s(),a=!1;for(let n of e){if(!Ja(n.descriptor))continue;let e=li(t,n.name);Wa(e)&&(a=!0,i[n.name]=e)}if(a)try{if(Object.keys(i).length===0){r.removeItem(n);return}r.setItem(n,JSON.stringify(i))}catch{}}};function Ua(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function Wa(e){return typeof e==`boolean`||typeof e==`number`||typeof e==`string`||qa(e)}function Ga(e,t){return Array.isArray(e)||Array.isArray(t)?Ka(e,t):Object.is(e,t)}function Ka(e,t){return!qa(e)||!qa(t)||e.length!==t.length?!1:e.every((e,n)=>e===t[n])}function qa(e){return Array.isArray(e)&&e.every(e=>typeof e==`string`)}function Ja(e){return gi(e)===`local-storage`}new Ha;var Ya=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],Xa={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function Za(e,t){let n=Xa[t];for(let[t,r]of Ya)e.style.setProperty(r,n[t])}function Qa(e){for(let[,t]of Ya)e.style.removeProperty(t)}var $a=`data-example-panel-host`,Y=`data-example-settings-panel`,eo=`data-example-settings-sections`,to=`example-source`,no=`/examples/`,ro=new WeakMap,io=new Set([`modelKind`,`renderMode`]),ao=`data-example-panel-appearance`,oo=`
[data-example-panel-host] [data-panel-tabs] + div > [aria-hidden='true'] {
  display: none !important;
}
[data-example-panel-host][${ao}='cinematic'] [data-panel-theme-mode] {
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
[${Y}] [data-setting-row-for] > label,
[${Y}] [data-setting-row-for] button,
[${Y}] [data-setting-row-for] input[type='number'],
[${Y}] [data-setting-row-for] input[type='text'],
[id^='settings-panel-input-'][role='listbox'] > button[role='option'] {
  font-size: 11px !important;
}
[${Y}][${eo}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) {
  margin-top: 4px !important;
  padding: 8px !important;
  border-radius: 7px !important;
  background: rgba(70, 104, 159, 0.08) !important;
}
[${Y}][${eo}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) > span:first-child > span:first-child {
  font-size: 11px !important;
  letter-spacing: 0.01em;
}
`;function so(e,t){let n=e.dataset.examplePanelTitle;if(n){let r=ro.get(e);if(!t){r?.container.onRemove(),r&&window.removeEventListener(`resize`,r.resize),ro.delete(e);return}let i=new ci({id:t.id,title:n,theme:t.theme,onRenderHTML:e=>(M(k(A,{},k(`style`,{},oo),t.content),e),()=>M(null,e))});if(r)r.container.setProps({title:n,panel:i});else{let t=new Hr({title:n,panel:i,collapsible:!0}),a=()=>t.onViewportChange();r={container:t,resize:a},ro.set(e,r),window.addEventListener(`resize`,a),t.onRenderHTML(e)}return}M(t?k(br,{panel:t},k(`style`,{},oo),t.content):null,e)}function co({id:e,title:t,html:n,onRender:r}){return new ci({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function lo({id:e,title:t,content:n}){return new ci({id:e,title:t,onRenderHTML:e=>(M(k(A,{},n),e),()=>M(null,e))})}function uo(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===to),i=mo()&&!r?[...e.panels,fo(t)]:e.panels;return e.onActivePanelIdChange?lo({id:e.id??`tabbed-panels`,title:e.title??`Panels`,content:k(ti,{...n,panels:i})}):new ei({...n,panels:i})}function fo(e){return lo({id:to,title:`Source`,content:k(po,{sourcePaths:e})})}function po({sourcePaths:e}){let[t,n]=L({});return R(()=>{let t=e??ho();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return go(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?k(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):k(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},k(`code`,{},t.source??`// Loading source…`))}function mo(){return typeof window<`u`&&!!window.website}function ho(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(no);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function go(e,t){let n=window.location.pathname.indexOf(no),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}var _o=class{id;label;sectionPresentation;settingsManager=new Ha;unsubscribe;schema;settings;constructor({id:e,label:t=`Settings`,schema:n,settings:r,sectionPresentation:i=`inline`,onSettingsChange:a,localStorageConfig:o}){this.id=e,this.label=t,this.sectionPresentation=i,this.schema=n,this.settings=r,this.settingsManager.setLocalStoragePersistence(o),this.setSchemaAndSettings(n,r),this.unsubscribe=this.settingsManager.setOnSettingsChange((e,t)=>{this.settings=e,a?.(e,t)})}getSettingsWithLocalStorage(e){return this.settingsManager.getSettingsWithLocalStorage(e)}setSchemaAndSettings(e,t){this.schema=e,this.settings=t,this.settingsManager.setSettingDefinitions(vo(e)),this.settingsManager.setCurrentSettings(t)}setSettings(e){this.settings=e,this.settingsManager.setCurrentSettings(e)}setSettingsFromPanel(e){this.settingsManager.setSettings(e)}setSettingValue(e,t){this.settingsManager.setSettingValue(e,t)}makePanel(){if(this.sectionPresentation===`accordion`)return bo(new Ba({id:this.id,label:this.label,schema:this.schema,settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)}),this.sectionPresentation);let[e]=Ba.createSectionPanels({label:this.label,schema:yo(this.schema),settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)});return e?(e.setProps({id:this.id,title:this.schema.title??this.label}),bo(e)):bo(new Ba({id:this.id,label:this.label,schema:yo(this.schema),settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)}))}finalize(){this.unsubscribe()}};function vo(e){let t=new Map;for(let n of e.sections)for(let e of n.settings)t.set(e.name,e);return t}function yo(e){let t=e.sections.flatMap(e=>e.settings);return{title:e.title,sections:[{id:`settings`,name:``,initiallyCollapsed:!1,settings:[...t.filter(e=>io.has(e.name)),...t.filter(e=>!io.has(e.name))]}]}}function bo(e,t=`inline`){return e.setProps({content:k(`div`,{[Y]:``,[eo]:t},e.content)}),e}function xo(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute($a,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(ao,r),r===`cinematic`||r===`light`?Za(e,r):Qa(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?Xa[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}function So(e){let t=/^(r|rg|rgba|bgra)(8unorm|8snorm|16float|32float)(-srgb)?$/.exec(e.format??``);if(!t||!e.width||!e.height)return;let n=t[1]===`r`?1:t[1]===`rg`?2:4,r=t[2],i=r===`16float`?2:r===`32float`?4:1,a=e.width*e.height;if(e.data.byteLength!==a*n*i)return;let o=new DataView(e.data.buffer,e.data.byteOffset,e.data.byteLength),s=new Uint8ClampedArray(a*4),c=e=>{let t=e*i;if(r===`8unorm`)return o.getUint8(t)/255;if(r===`8snorm`)return Math.max(-1,o.getInt8(t)/127);if(r===`32float`)return o.getFloat32(t,!0);let n=o.getUint16(t,!0),a=n&32768?-1:1,s=n>>10&31,c=n&1023;return a*(s===31?c?NaN:1/0:s===0?c*2**-24:(1+c/1024)*2**(s-15))};for(let e=0;e<a;e++)for(let r=0;r<4;r++){let i=t[1]===`bgra`&&r<3?2-r:r,a=+(r===3);i<n?a=c(e*n+i):n===1&&r<3&&(a=c(e)),a=Number.isNaN(a)?0:Math.max(0,Math.min(1,a)),r<3&&!t[3]&&(a=a<=.0031308?12.92*a:1.055*a**(1/2.4)-.055),s[e*4+r]=Math.round(a*255)}return s}function Co(e,t){let n=So(t);if(!n)return;let r=e.createElement(`canvas`);return r.width=t.width,r.height=t.height,r.setAttribute(`role`,`img`),r.setAttribute(`aria-label`,`Current texture allocation, top-left ${r.width} by ${r.height} pixels; display range 0 to 1`),r.title=`Current allocation · top-left crop · display range 0–1`,r.getContext(`2d`)?.putImageData(new ImageData(n,r.width,r.height),0,0),r.style.cssText=`width:${128*r.width/Math.max(r.width,r.height)}px;max-width:100%;height:auto;image-rendering:pixelated;background:repeating-conic-gradient(#888 0% 25%,#bbb 0% 50%) 0/12px 12px`,r}var wo=1,To=class{element;document;trigger;valueElement;listbox;ariaLabel;onChange;options;selectedValue=null;activeIndex=-1;disabled;openState=!1;destroyed=!1;typeaheadText=``;typeaheadTimer=null;constructor(e,t){this.document=e.ownerDocument,this.options=[...t.options],this.ariaLabel=t.ariaLabel??`Select option`,this.onChange=t.onChange,this.disabled=t.disabled??!1;let n=wo++,r=`compact-dropdown-trigger-${n}`,i=`compact-dropdown-listbox-${n}`;this.element=this.document.createElement(`div`),this.element.dataset.compactDropdown=``,this.element.innerHTML=`<style>${Eo}</style>`,this.trigger=this.document.createElement(`button`),this.trigger.id=r,this.trigger.type=`button`,this.trigger.setAttribute(`role`,`combobox`),this.trigger.setAttribute(`aria-label`,this.ariaLabel),this.trigger.setAttribute(`aria-haspopup`,`listbox`),this.trigger.setAttribute(`aria-controls`,i),this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.dataset.compactDropdownTrigger=``,this.valueElement=this.document.createElement(`span`),this.valueElement.dataset.compactDropdownValue=``;let a=this.document.createElement(`span`);a.dataset.compactDropdownChevron=``,a.setAttribute(`aria-hidden`,`true`),this.trigger.append(this.valueElement,a),this.element.append(this.trigger),this.listbox=this.document.createElement(`div`),this.listbox.id=i,this.listbox.hidden=!0,this.listbox.setAttribute(`role`,`listbox`),this.listbox.setAttribute(`aria-label`,this.ariaLabel),this.listbox.dataset.compactDropdownPopup=``,e.append(this.element),this.document.body.append(this.listbox),this.trigger.addEventListener(`click`,this.handleTriggerClick),this.trigger.addEventListener(`keydown`,this.handleKeyDown),this.listbox.addEventListener(`click`,this.handleOptionClick),this.listbox.addEventListener(`pointermove`,this.handleOptionPointerMove),this.document.addEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.addEventListener(`focusin`,this.handleDocumentFocusIn),this.renderOptions();let o=t.value??this.getFirstEnabledOption()?.value;o!==void 0&&this.setValue(o),this.updateDisabledState()}get value(){return this.selectedValue}set value(e){e===null?(this.selectedValue=null,this.activeIndex=-1,this.updateSelection()):this.setValue(e)}setValue(e,t={}){let n=this.options.find(t=>t.value===e);if(!n)return!1;let r=this.selectedValue!==e;return this.selectedValue=e,this.activeIndex=this.options.indexOf(n),this.updateSelection(),r&&t.emitChange&&this.onChange?.(e,n),!0}setOptions(e){this.options=[...e];let t=this.options.find(e=>e.value===this.selectedValue);this.selectedValue=t?.value??this.getFirstEnabledOption()?.value??null,this.activeIndex=this.getSelectedIndex(),this.renderOptions(),this.updateSelection(),this.updateDisabledState(),this.openState&&this.updatePopupPosition()}setDisabled(e){this.disabled=e,this.updateDisabledState(),this.trigger.disabled&&this.close()}focus(){this.trigger.focus()}open(){this.openState||this.trigger.disabled||this.destroyed||(this.openState=!0,this.activeIndex=this.getSelectedIndex(),this.activeIndex<0&&(this.activeIndex=this.getNextEnabledIndex(-1,1)),this.listbox.hidden=!1,this.trigger.setAttribute(`aria-expanded`,`true`),this.element.dataset.open=`true`,this.updateActiveOption(!0),this.updatePopupPosition(),this.document.defaultView?.addEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.addEventListener(`scroll`,this.handleViewportChange,!0))}close(e={}){this.openState&&(this.openState=!1,this.listbox.hidden=!0,this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.removeAttribute(`aria-activedescendant`),delete this.element.dataset.open,this.document.defaultView?.removeEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.removeEventListener(`scroll`,this.handleViewportChange,!0),e.restoreFocus&&this.trigger.focus())}destroy(){this.destroyed||(this.close(),this.destroyed=!0,this.trigger.removeEventListener(`click`,this.handleTriggerClick),this.trigger.removeEventListener(`keydown`,this.handleKeyDown),this.listbox.removeEventListener(`click`,this.handleOptionClick),this.listbox.removeEventListener(`pointermove`,this.handleOptionPointerMove),this.document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.removeEventListener(`focusin`,this.handleDocumentFocusIn),this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.listbox.remove(),this.element.remove())}handleTriggerClick=()=>{this.openState?this.close():this.open()};handleKeyDown=e=>{switch(e.key){case`ArrowDown`:e.preventDefault(),this.openState?this.moveActiveOption(1):this.open();break;case`ArrowUp`:e.preventDefault(),this.openState?this.moveActiveOption(-1):this.open();break;case`Home`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(-1,1));break;case`End`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(this.options.length,-1));break;case`Enter`:case` `:e.preventDefault(),this.openState?this.selectActiveOption():this.open();break;case`Escape`:this.openState&&(e.preventDefault(),this.close({restoreFocus:!0}));break;case`Tab`:this.close();break;default:e.key.length===1&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.preventDefault(),this.openState||this.open(),this.moveActiveOptionByText(e.key));break}};handleOptionClick=e=>{let t=this.getOptionIndex(e.target);t<0||this.options[t]?.disabled||(this.activeIndex=t,this.selectActiveOption())};handleOptionPointerMove=e=>{let t=this.getOptionIndex(e.target);t>=0&&!this.options[t]?.disabled&&t!==this.activeIndex&&this.setActiveIndex(t)};handleDocumentPointerDown=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleDocumentFocusIn=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleViewportChange=()=>{this.openState&&this.updatePopupPosition()};renderOptions(){this.listbox.replaceChildren(...this.options.map((e,t)=>{let n=this.document.createElement(`div`);n.id=`${this.listbox.id}-option-${t}`,n.setAttribute(`role`,`option`),n.setAttribute(`aria-selected`,String(e.value===this.selectedValue)),e.disabled&&n.setAttribute(`aria-disabled`,`true`),n.dataset.compactDropdownOption=``,n.dataset.optionIndex=String(t);let r=this.document.createElement(`span`);r.textContent=e.label;let i=this.document.createElement(`span`);return i.dataset.compactDropdownStatus=``,i.setAttribute(`aria-hidden`,`true`),n.append(r,i),n}))}updateSelection(){let e=this.options.find(e=>e.value===this.selectedValue);this.valueElement.textContent=e?.label??`—`,this.trigger.title=e?.label??this.ariaLabel;for(let[e,t]of this.getOptionElements().entries())t.setAttribute(`aria-selected`,String(this.options[e]?.value===this.selectedValue));this.updateActiveOption(!1)}updateDisabledState(){this.trigger.disabled=this.disabled||!this.options.some(e=>!e.disabled)}moveActiveOption(e){this.setActiveIndex(this.getNextEnabledIndex(this.activeIndex,e))}moveActiveOptionByText(e){this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.typeaheadText+=e.toLocaleLowerCase();let t=this.getMatchingOptionIndex(this.typeaheadText);t<0&&this.typeaheadText.length>1&&(this.typeaheadText=e.toLocaleLowerCase(),t=this.getMatchingOptionIndex(this.typeaheadText)),t>=0&&this.setActiveIndex(t),this.typeaheadTimer=setTimeout(()=>{this.typeaheadText=``,this.typeaheadTimer=null},650)}getMatchingOptionIndex(e){for(let t=1;t<=this.options.length;t++){let n=(this.activeIndex+t+this.options.length)%this.options.length,r=this.options[n];if(!r?.disabled&&r.label.toLocaleLowerCase().startsWith(e))return n}return-1}getNextEnabledIndex(e,t){if(!this.options.length)return-1;let n=e;for(let e=0;e<this.options.length;e++)if(n=(n+t+this.options.length)%this.options.length,!this.options[n]?.disabled)return n;return-1}setActiveIndex(e){e<0||this.options[e]?.disabled||(this.activeIndex=e,this.updateActiveOption(!0))}updateActiveOption(e){let t=this.getOptionElements();for(let[e,n]of t.entries())e===this.activeIndex&&this.openState?n.dataset.active=`true`:delete n.dataset.active;let n=t[this.activeIndex];this.openState&&n&&(this.trigger.setAttribute(`aria-activedescendant`,n.id),e&&n.scrollIntoView({block:`nearest`}))}selectActiveOption(){let e=this.options[this.activeIndex];!e||e.disabled||(this.setValue(e.value,{emitChange:!0}),this.close({restoreFocus:!0}))}getFirstEnabledOption(){return this.options.find(e=>!e.disabled)}getSelectedIndex(){return this.options.findIndex(e=>e.value===this.selectedValue)}getOptionIndex(e){let t=e?.closest(`[data-compact-dropdown-option]`);return!t||!this.listbox.contains(t)?-1:Number(t.dataset.optionIndex??-1)}getOptionElements(){return Array.from(this.listbox.querySelectorAll(`[role="option"]`))}updatePopupPosition(){let e=this.document.defaultView;if(!e)return;let t=this.trigger.getBoundingClientRect(),n=Math.min(Math.max(t.width,128),e.innerWidth-8),r=Math.max(4,Math.min(t.left,e.innerWidth-n-4)),i=e.innerHeight-t.bottom-3-4,a=t.top-3-4,o=Math.min(176,this.options.length*20+2),s=i<Math.min(o,80)&&a>i,c=s?a:i;Object.assign(this.listbox.style,{left:`${r}px`,top:s?`auto`:`${t.bottom+3}px`,bottom:s?`${e.innerHeight-t.top+3}px`:`auto`,width:`${n}px`,maxHeight:`${Math.max(40,Math.min(176,c))}px`})}},Eo=`
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
`,Do=0;function Oo(e){let t=e.createElement(`div`);t.id=`gpu-operation-tooltip-${Do++}`,t.setAttribute(`role`,`tooltip`),t.setAttribute(`data-gpu-operation-tooltip`,``),t.hidden=!0,Object.assign(t.style,{position:`fixed`,zIndex:`2147483647`,pointerEvents:`none`,boxSizing:`border-box`,width:`560px`,maxWidth:`calc(100vw - 24px)`,maxHeight:`min(440px, calc(100vh - 24px))`,overflow:`hidden`,padding:`18px`,border:`1px solid rgb(125 170 212 / 32%)`,borderRadius:`12px`,background:`linear-gradient(145deg, #111e30, #080f1b 70%)`,color:`#e4effc`,boxShadow:`0 8px 28px rgb(0 0 0 / 45%)`,font:`14px/1.5 system-ui, sans-serif`,whiteSpace:`normal`,overflowWrap:`anywhere`});let n=e.createElement(`style`);return n.textContent=No,t.append(n),e.body.append(t),t}function ko(e,t){let n=t.getBoundingClientRect(),r=t.ownerDocument.documentElement,i=e.getBoundingClientRect();e.style.left=`${Math.max(12,Math.min(n.left,r.clientWidth-i.width-12))}px`;let a=n.bottom+i.height+12<r.clientHeight?n.bottom+6:n.top-i.height-6;e.style.top=`${Math.max(12,Math.min(a,r.clientHeight-i.height-12))}px`}function Ao(e,t=e.id){let n=[t];if(e.description&&n.push(e.description),e.resources?.length){n.push(``,`Declared inputs / outputs`);for(let t of e.resources){let e=t.usage===`storage-read-write`||t.usage===`render-attachment`?`Input/output`:[`storage-write`,`copy-destination`].includes(t.usage)?`Output`:`Input`,r=t.width===void 0?t.length===void 0?void 0:`${t.length.toLocaleString()} rows`:`${t.width} × ${t.height}${t.depth&&t.depth>1?` × ${t.depth}`:``}`,i=t.byteLength===void 0?void 0:`${t.byteLength.toLocaleString()} B${t.byteOffset?` @ ${t.byteOffset.toLocaleString()}`:``}`;n.push(`${e}: ${t.id}`,`  ${[t.usage,t.format??t.kind,r,i].filter(Boolean).join(` · `)}`)}}return n.join(`
`)}function jo(e,t,n={}){let r=e.ownerDocument,i=r.createElement(`div`);i.className=`gpu-operation-content`;let a=(e,t,n,i)=>{let a=r.createElement(t);return a.className=n,a.textContent=i,e.append(a),a},o=a(i,`div`,`gpu-operation-header`,``),s=t.id.split(`-`).filter(Boolean).at(-1)??t.id,c=n.name??t.operation??s.replace(/([a-z])([A-Z])/g,`$1 $2`);if(a(o,`strong`,`gpu-operation-name`,c.charAt(0).toUpperCase()+c.slice(1)),t.type&&a(o,`span`,`gpu-operation-kind`,t.type===`render`?`draw`:t.type),a(i,`code`,`gpu-operation-id`,t.id),t.description&&a(i,`p`,`gpu-operation-description`,t.description),t.resources?.length){let e=a(i,`section`,`gpu-operation-resources`,``);a(e,`div`,`gpu-operation-section-label`,`Declared inputs / outputs`);let n=r.createElement(`table`);n.className=`gpu-operation-table`;let o=r.createElement(`caption`);o.textContent=`Declared resource inputs and outputs`,o.hidden=!0,n.append(o);let s=n.createTHead().insertRow();for(let e of[`Access`,`Resource`,`Format / shape`,`Size`]){let t=r.createElement(`th`);t.scope=`col`,t.textContent=e,s.append(t)}let c=n.createTBody(),l=t.id.slice(0,t.id.lastIndexOf(`-`)+1),u=t.resources.slice(0,6);for(let e of u){let t=c.insertRow(),n=e.usage===`storage-read-write`||e.usage===`render-attachment`?`In / out`:[`storage-write`,`copy-destination`].includes(e.usage)?`Output`:`Input`,r=a(t.insertCell(),`span`,`gpu-operation-access`,n);r.dataset.access=n;let i=a(t.insertCell(),`code`,`gpu-operation-resource-id`,l&&e.id.startsWith(l)?e.id.slice(l.length):e.id);i.title=`${e.id} · ${e.usage}`;let o=t.insertCell(),s=e.width===void 0?e.length===void 0?``:`${e.length.toLocaleString()} rows`:`${e.width} × ${e.height}${e.depth&&e.depth>1?` × ${e.depth}`:``}`,u=a(o,`code`,`gpu-operation-format`,[e.format??e.kind,s].filter(Boolean).join(` · `));u.title=u.textContent??``;let d=t.insertCell();d.className=`gpu-operation-size`,d.textContent=e.byteLength===void 0?`—`:e.byteLength>=1024?`${(e.byteLength/1024).toFixed(1)} KiB`:`${e.byteLength} B`,e.byteLength!==void 0&&(d.title=`${e.byteLength.toLocaleString()} bytes`),e.byteOffset&&(d.title+=` · offset ${e.byteOffset.toLocaleString()} bytes`)}e.append(n),Mo(a(e,`div`,`gpu-operation-resource-overflow`,``),t.resources.length,u.length)}n.timing&&a(i,`div`,`gpu-operation-timing`,n.timing),e.querySelector(`.gpu-operation-content`)?.remove(),e.append(i);let l=e.hidden;e.hidden=!1;let u=i.querySelector(`tbody`),d=i.querySelector(`.gpu-operation-resource-overflow`);for(;u?.rows.length&&e.scrollHeight>e.clientHeight;)u.deleteRow(-1),Mo(d,t.resources.length,u.rows.length),u.rows.length===0&&(u.closest(`table`).hidden=!0);e.hidden=l}function Mo(e,t,n){let r=t-n;e.hidden=r===0,e.textContent=r?`+ ${r} more ${r===1?`resource`:`resources`}`:``}var No=`
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
`,Po=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:1}),Fo=new Intl.NumberFormat(`en-US`,{notation:`compact`,maximumFractionDigits:1}),Io=class{element;graphLabels;nodeLabels;counterLabels;snapshot={graphs:[]};selectedGraphId=null;selectionIsManual=!1;graphOptionsSignature=``;memoryMarkup=``;nodeRows=new Map;counterRows=new Map;graphDropdown;tooltip;tooltipEvents=new AbortController;inspector;resourceRows=new Map;resources=new Map;activeResourceKey;previewGeneration=0;renderedGraphId;selectedResourceKey;viewerGeneration=0;pendingPreviews=new Map;thumbnailGeneration=0;activeNodeId;constructor(e,t={}){this.element=e,this.inspector=t.inspector,this.tooltip=Oo(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-graph-tooltip`,``);let n=e=>{let t=e.target.closest(`[data-resource-key]`);if(t&&this.element.contains(t)){this.showResourceTooltip(t);return}let n=e.target.closest(`[data-full-name]`);n&&this.element.contains(n)&&this.showTooltip(n)},r=e=>{let t=e.target.closest(`[data-full-name], [data-resource-key]`),n=e.relatedTarget;(!(n instanceof Node)||!t?.contains(n))&&this.hideTooltip()},i={signal:this.tooltipEvents.signal};e.addEventListener(`mouseover`,n,i),e.addEventListener(`focusin`,n,i),e.addEventListener(`mouseout`,r,i),e.addEventListener(`focusout`,r,i),e.addEventListener(`scroll`,()=>this.hideTooltip(),{...i,capture:!0}),e.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip();let t=e.target.closest(`[data-resource-key]`);t&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.selectResource(t.dataset.resourceKey))},i),e.ownerDocument.defaultView?.addEventListener(`resize`,()=>this.hideTooltip(),i),this.graphLabels=t.graphLabels??{},this.nodeLabels=t.nodeLabels??{},this.counterLabels=t.counterLabels??{},this.element.innerHTML=`<div data-gpu-command-graph-inspector>
      <style>${zo}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div role="tablist" aria-label="Graph inspector views">
          <button type="button" role="tab" aria-selected="true" data-inspector-tab="timings">Graph</button>
          <button type="button" role="tab" aria-selected="false" data-inspector-tab="resources">Graph Resources</button>
        </div>
        <div data-inspector-view="timings">
        <div class="graph-inspector-summary">
          ${Bo(`encodings`,``,`encoding-count`)}
          ${Bo(`CPU p50 / p95 (ms)`,``,`cpu-totals`)}
          ${Bo(`GPU p50 / p95 (ms)`,``,`gpu-totals`)}
          ${Bo(`GPU samples`,``,`gpu-samples`)}
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
    </div>`,e.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-inspector-tab]`);if(r){this.hideTooltip();for(let t of e.querySelectorAll(`[data-inspector-tab]`))t.setAttribute(`aria-selected`,String(t===r));for(let t of e.querySelectorAll(`[data-inspector-view]`))t.hidden=t.dataset.inspectorView!==r.dataset.inspectorTab}n.closest(`[data-texture-previews]`)&&this.refreshTextureThumbnails();let i=n.closest(`[data-resource-key]`);i&&this.selectResource(i.dataset.resourceKey),n.closest(`[data-resource-refresh]`)&&this.selectedResourceKey&&this.selectResource(this.selectedResourceKey)},i);let a=this.element.querySelector(`[data-graph-inspector-picker-host]`);this.graphDropdown=new To(a,{ariaLabel:`Graph`,options:[],onChange:e=>{this.hideTooltip(),this.selectedGraphId=e,this.selectionIsManual=!0,this.render()}})}update(e,t){if(this.snapshot=e,e.graphs.some(e=>e.id===this.selectedGraphId)||(this.selectedGraphId=null,this.selectionIsManual=!1),!this.selectionIsManual&&t){let n=e.graphs.find(e=>e.id===t);n&&(this.selectedGraphId=n.id)}this.selectedGraphId??=e.graphs[0]?.id??null,this.render()}destroy(){this.hideTooltip(),this.viewerGeneration++,this.thumbnailGeneration++,this.tooltipEvents.abort(),this.tooltip.remove(),this.graphDropdown.destroy(),this.element.replaceChildren(),this.nodeRows.clear(),this.counterRows.clear(),this.resourceRows.clear(),this.resources.clear()}showTooltip(e){this.activeResourceKey&&this.hideTooltip(),this.activeNodeId=e.getAttribute(`data-full-name`)??void 0;let t=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId)?.nodes.find(e=>e.id===this.activeNodeId);if(!t)return;let n=Ko(this.nodeLabels,t.id);jo(this.tooltip,t,{name:n===t.id?void 0:n}),this.tooltip.hidden=!1,ko(this.tooltip,e)}async showResourceTooltip(e){let t=e.dataset.resourceKey;if(this.activeResourceKey===t)return;this.hideTooltip(),this.activeResourceKey=t;let n=this.previewGeneration,r=this.resources.get(t),i=this.selectedGraphId;if(!r||!i)return;let a=this.tooltip.ownerDocument.createElement(`div`);a.className=`gpu-operation-content`;let o=this.tooltip.ownerDocument.createElement(`strong`);o.textContent=r.summary.id;let s=this.tooltip.ownerDocument.createElement(`div`);s.textContent=Jo(r.summary);let c=this.tooltip.ownerDocument.createElement(`pre`);c.style.whiteSpace=`pre-wrap`,c.style.fontSize=`11px`,c.textContent=`Reading current GPU data…`,a.append(o,s,c),this.tooltip.querySelector(`.gpu-operation-content`)?.remove(),this.tooltip.append(a),this.tooltip.hidden=!1,ko(this.tooltip,e);try{if(!this.inspector)throw Error(`No live inspector is connected.`);let e=await this.readPreview(t,i,r);if(n!==this.previewGeneration)return;this.showTextureThumbnail(t,e),c.textContent=Yo(e);let o=Co(this.tooltip.ownerDocument,e);o&&a.insertBefore(o,c)}catch(e){if(n!==this.previewGeneration)return;c.textContent=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`}n===this.previewGeneration&&ko(this.tooltip,e)}readPreview(e,t,n){let r=`${t}/${e}`,i=this.pendingPreviews.get(r);if(i)return i;let a=this.inspector?this.inspector.readResource(t,n.nodeId,n.index):Promise.reject(Error(`No live inspector is connected.`));return this.pendingPreviews.set(r,a),a.finally(()=>this.pendingPreviews.delete(r)).catch(()=>{}),a}async selectResource(e){this.hideTooltip();let t=this.resources.get(e),n=this.selectedGraphId;if(!t||!n)return;this.selectedResourceKey=e;let r=++this.viewerGeneration;for(let[t,n]of this.resourceRows)n.setAttribute(`aria-pressed`,String(t===e));let i=this.element.querySelector(`[data-resource-viewer]`);i.textContent=`${t.summary.id} · ${Jo(t.summary)}\nReading current GPU data…`;try{let a=await this.readPreview(e,n,t);if(r!==this.viewerGeneration)return;this.showTextureThumbnail(e,a),i.textContent=`${t.summary.id} · ${Jo(t.summary)}\n${Yo(a)}`;let o=Co(i.ownerDocument,a);o&&i.prepend(o)}catch(e){r===this.viewerGeneration&&(i.textContent=`${t.summary.id}\nPreview unavailable: ${e instanceof Error?e.message:String(e)}`)}}showTextureThumbnail(e,t){let n=this.resourceRows.get(e);if(!n)return;let r=Co(n.ownerDocument,t);if(!r)return;let i=Math.max(r.width,r.height);r.style.width=`${48*r.width/i}px`,r.style.height=`${48*r.height/i}px`,r.style.flexShrink=`0`,n.removeAttribute(`title`),n.querySelector(`canvas`)?.remove(),n.prepend(r)}async refreshTextureThumbnails(){let e=this.selectedGraphId;if(!e)return;let t=++this.thumbnailGeneration,n=this.element.querySelector(`[data-texture-previews]`);n.disabled=!0;let r=[...this.resources].filter(([,e])=>e.summary.kind===`texture`).slice(0,32);n.textContent=`Reading up to 32 textures…`;try{for(let[n,i]of r){if(t!==this.thumbnailGeneration)return;this.resourceRows.get(n)?.querySelector(`canvas`)?.remove();try{let r=await this.readPreview(n,e,i);if(t!==this.thumbnailGeneration)return;this.showTextureThumbnail(n,r)}catch(e){if(t!==this.thumbnailGeneration)return;let r=this.resourceRows.get(n);r&&(r.title=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`)}}}finally{n.disabled=!1,n.textContent=`Refresh texture thumbnails`}}hideTooltip(){this.previewGeneration++,this.activeResourceKey=void 0,this.activeNodeId=void 0,this.tooltip.hidden=!0}render(){let e=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId),t=this.element.querySelector(`[data-graph-inspector-empty]`),n=this.element.querySelector(`[data-graph-inspector-content]`);if(!e){this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.thumbnailGeneration++,this.renderedGraphId=void 0,t.hidden=!1,n.hidden=!0;return}if(this.renderedGraphId!==e.id){this.thumbnailGeneration++;for(let e of this.resourceRows.values())e.querySelector(`canvas`)?.remove();this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`}this.renderedGraphId=e.id,this.resources.clear();for(let t of e.nodes)for(let[e,n]of(t.resources??[]).entries()){let{usage:r,...i}=n,a=JSON.stringify(i);this.resources.set(a,{nodeId:t.id,index:e,summary:n})}this.selectedResourceKey&&!this.resources.has(this.selectedResourceKey)&&(this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`),Lo(this.element.querySelector(`[data-graph-inspector-resources]`),this.resourceRows,[...this.resources].map(([e,t])=>({id:e,...t})),(e,t)=>{e.className=`graph-inspector-resource`,e.tabIndex=0,Z(e,`role`,`button`),Z(e,`aria-pressed`,String(t.id===this.selectedResourceKey)),Z(e,`data-resource-key`,t.id),Z(e,`aria-describedby`,this.tooltip.id);let n=e.querySelector(`span`);n||(n=e.ownerDocument.createElement(`span`),e.append(n)),X(n,`${t.summary.kind===`buffer`?`Buffer`:`Texture`} · ${t.summary.id} · ${Jo(t.summary)}`)}),this.activeResourceKey&&!this.resources.has(this.activeResourceKey)&&this.hideTooltip(),t.hidden=!0,n.hidden=!1;let r=this.snapshot.graphs.map(e=>`${e.id}\u0000${this.getGraphLabel(e.id)}`).join(``);r!==this.graphOptionsSignature&&(this.graphDropdown.setOptions(this.snapshot.graphs.map(e=>({value:e.id,label:this.getGraphLabel(e.id)}))),this.graphOptionsSignature=r),this.graphDropdown.value!==e.id&&(this.graphDropdown.value=e.id);let i=e.stats.logicalTransientBytes+e.stats.logicalTransientTextureBytes,a=e.stats.reusedTransientBytes+e.stats.reusedTransientTextureBytes,o=i?a/i*100:0,s=e.totals.gpu.sampleCount;Lo(this.element.querySelector(`[data-graph-inspector-nodes]`),this.nodeRows,e.nodes,(t,n)=>{t.hasChildNodes()||(t.className=`graph-inspector-node`,t.innerHTML=`<span><i></i><span data-node-label></span></span><strong data-node-cpu></strong><strong data-node-gpu></strong>`),Z(t,`data-node-type`,n.type),Z(t,`data-full-name`,n.id),Z(t,`data-operation-details`,Ao(n)),Z(t,`aria-describedby`,this.tooltip.id),t.tabIndex=0,this.activeNodeId===n.id&&this.showTooltip(t);let r=t.querySelector(`i`),i=n.type===`render`?`draw`:n.type;Z(r,`title`,i),Z(r,`aria-label`,i);let a=Ko(this.nodeLabels,n.id);X(t.querySelector(`[data-node-label]`),a===n.id?Vo(n.id,e.id):a),X(t.querySelector(`[data-node-cpu]`),Ho(n.cpu)),X(t.querySelector(`[data-node-gpu]`),Ho(n.gpu))}),this.activeNodeId&&!e.nodes.some(e=>e.id===this.activeNodeId)&&this.hideTooltip(),Lo(this.element.querySelector(`[data-graph-inspector-counter-rows]`),this.counterRows,e.counters,(e,t)=>{e.hasChildNodes()||(e.className=`graph-inspector-counter`,e.innerHTML=`<span></span><strong data-counter-latest></strong><strong data-counter-percentiles></strong>`),Z(e,`title`,`${t.id} · ${t.sampleCount} samples`),X(e.querySelector(`span`),this.getCounterLabel(t.id)),X(e.querySelector(`[data-counter-latest]`),Wo(t.latestValue)),X(e.querySelector(`[data-counter-percentiles]`),`${Wo(t.p50Value)} / ${Wo(t.p95Value)}`)}),this.setText(`encoding-count`,String(e.encodingCount)),this.setText(`cpu-totals`,Ho(e.totals.cpu)),this.setText(`gpu-totals`,Ho(e.totals.gpu)),this.setText(`gpu-samples`,`${s}${e.timingReadFailureCount?` · ${e.timingReadFailureCount} failed`:``}`);let c=`
      <span>${e.stats.nodeOrder.length} nodes</span>
      <span>${Go(e.stats.logicalResourceBytes)} logical</span>
      <span>${Go(e.stats.physicalTransientResourceBytes)} scratch</span>
      ${e.preflight?.annotatedNodeCount?`<span>${e.preflight.annotatedNodeCount}/${e.stats.nodeOrder.length} costed nodes</span>`:``}
      ${e.preflight?.maximumInvocationCount?`<span>${Ro(e.preflight.maximumInvocationCount)} max invocations</span>`:``}
      ${e.preflight?.readByteLength?`<span>${Go(e.preflight.readByteLength)} max reads</span>`:``}
      ${e.preflight?.writeByteLength?`<span>${Go(e.preflight.writeByteLength)} max writes</span>`:``}
      <span>${o?`${o.toFixed(0)}% reuse`:`no reuse`}</span>
      <span>${s?`GPU timings sampled`:`CPU timings only`}</span>`;c!==this.memoryMarkup&&(this.element.querySelector(`[data-graph-inspector-memory]`).innerHTML=c,this.memoryMarkup=c);let l=this.element.querySelector(`[data-graph-inspector-counters]`);l.hidden=e.counters.length===0}setText(e,t){X(this.element.querySelector(`[data-graph-inspector-${e}]`),t)}getGraphLabel(e){return Ko(this.graphLabels,e)}getCounterLabel(e){return Ko(this.counterLabels,e)}};function Lo(e,t,n,r){let i=new Set(n.map(e=>e.id));for(let[e,n]of t)i.has(e)||(n.remove(),t.delete(e));for(let[i,a]of n.entries()){let n=t.get(a.id);n||(n=e.ownerDocument.createElement(`div`),t.set(a.id,n)),r(n,a);let o=e.children[i]??null;o!==n&&e.insertBefore(n,o)}}function X(e,t){e.textContent!==t&&(e.textContent=t)}function Z(e,t,n){e.getAttribute(t)!==n&&e.setAttribute(t,n)}function Ro(e){return Fo.format(e)}var zo=`
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
`;function Bo(e,t,n){return`<span class="graph-inspector-metric"><span>${qo(e)}</span><strong data-graph-inspector-${n}>${qo(t)}</strong></span>`}function Vo(e,t){let n=t.endsWith(`-graph`)?t.slice(0,-6):t,r=e.startsWith(`${n}-`)?e.slice(n.length+1):e;return r.length>32?`${r.slice(0,30)}…`:r}function Ho(e){return e.p50Milliseconds===void 0?`—`:`${Uo(e.p50Milliseconds)} / ${Uo(e.p95Milliseconds??e.p50Milliseconds)}`}function Uo(e){return e.toFixed(e<1?3:2)}function Wo(e){return(e>=1e4?Fo:Po).format(e)}function Go(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(1)} KiB`:e<1024**3?`${(e/1024**2).toFixed(1)} MiB`:`${(e/1024**3).toFixed(1)} GiB`}function Ko(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:t}function qo(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Jo(e){return e.kind===`buffer`?`${e.format??`raw bytes`} · ${e.byteLength??0} B @ ${e.byteOffset??0}`:`${e.format??e.kind} · ${e.width} × ${e.height} · mip ${e.baseMipLevel??0}, layer ${e.baseArrayLayer??0}`}function Yo(e){let t=e.data,n,r=`bytes`;return/^float32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Float32Array(t.slice().buffer)),r=`float32`):/^uint32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Uint32Array(t.slice().buffer)),r=`uint32`):n=Array.from(t),`Current allocation · ${t.length} bytes read${e.width?` · top-left ${e.width} × ${e.height}`:``}\n${r}: ${n.slice(0,64).join(`, `)}${n.length>64?`, …`:``}`}var Xo=class{panel;renderer=null;snapshot={graphs:[]};preferredGraphId;constructor(e={}){this.panel=co({id:e.id??`gpu-command-graph-debug`,title:e.title??`GPU Graph`,html:`<p class="hint">Compiled nodes, memory, and recorded timings. GPU timings appear when supplied by the application.</p><div data-graph-debug-host></div>`,onRender:t=>{let n=new Io(t.querySelector(`[data-graph-debug-host]`),e);return this.renderer=n,n.update(this.snapshot,this.preferredGraphId),()=>{n.destroy(),this.renderer===n&&(this.renderer=null)}}})}update(e,t){this.snapshot=e,this.preferredGraphId=t,this.renderer?.update(e,t)}},Zo=new Intl.NumberFormat(`en-US`,{maximumSignificantDigits:3,useGrouping:!1}),Qo=class{panel;renderer=null;report;label=``;constructor(e={}){this.panel=co({id:e.id??`gpu-trace`,title:e.title??`GPU Trace`,html:`<div data-gpu-trace-host></div>`,onRender:e=>{let t=new $o(e.querySelector(`[data-gpu-trace-host]`));return this.renderer=t,t.update(this.report,this.label),()=>{t.destroy(),this.renderer===t&&(this.renderer=null)}}})}update(e,t=``){this.report=e,this.label=t,this.renderer?.update(e,t)}},$o=class{element;combinedTimeline=!1;tooltip;activeSpanKey;tooltipNodes=new Map;constructor(e){this.element=e,this.tooltip=Oo(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-trace-tooltip`,``)}update(e,t=``){this.tooltipNodes.clear();let n=document.createElement(`section`);n.setAttribute(`data-gpu-trace`,``),n.setAttribute(`aria-label`,`GPU Trace`);let r=document.createElement(`style`);if(r.textContent=es,n.append(r),Q(n,`strong`,t||`Latest graph execution`),!e)Q(n,`p`,`No trace collected yet.`);else{let r=e.clockCorrelation,i=!!(r&&Number.isFinite(r.offsetMilliseconds)&&Number.isFinite(r.uncertaintyMilliseconds)&&r.uncertaintyMilliseconds>=0),a=document.createElement(`label`),o=document.createElement(`input`);o.type=`checkbox`,o.checked=this.combinedTimeline,o.disabled=!i,o.addEventListener(`change`,()=>{this.combinedTimeline=o.checked,this.update(e,t)}),a.append(o,` Combined timeline (estimated)`),n.append(a);let s=this.combinedTimeline&&i;Q(n,`p`,s?`Alignment ±${$(r.uncertaintyMilliseconds)}ms, plus timestamp precision. Submission-time estimate.`:`CPU and GPU use separate clocks. Each timeline starts at its own origin.`),i||Q(n,`p`,`Combined timeline requires submission clock correlation.`);let c=s?r.offsetMilliseconds:0,l=s?e.nodes.flatMap(e=>[e.cpuEncodeStartTimeMilliseconds,e.gpuStartTimeMilliseconds===void 0?void 0:e.gpuStartTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[],u=s?e.nodes.flatMap(e=>[e.cpuEncodeEndTimeMilliseconds,e.gpuEndTimeMilliseconds===void 0?void 0:e.gpuEndTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[];s&&e.cpuEncodeStartTimeMilliseconds!==void 0&&l.push(e.cpuEncodeStartTimeMilliseconds),s&&e.cpuEncodeEndTimeMilliseconds!==void 0&&u.push(e.cpuEncodeEndTimeMilliseconds);for(let t of[`gpu`,`cpu`]){let r=e.nodes.flatMap(e=>{let n=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,r=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds;return n!==void 0&&r!==void 0&&Number.isFinite(n)&&Number.isFinite(r)&&r>=n?[{node:e,start:n+(t===`gpu`?c:0),end:r+(t===`gpu`?c:0)}]:[]}),i=document.createElement(`section`);if(i.dataset.traceClock=t,n.append(i),Q(i,`h4`,t===`cpu`?`CPU encoding`:`GPU execution`),!r.length){Q(i,`p`,t===`cpu`?`CPU span endpoints unavailable.`:`GPU span endpoints unavailable. Timestamp queries are required.`);continue}let a=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,o=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds,d=s?Math.min(...l):Math.min(...r.map(e=>e.start),a??1/0),f=(s?Math.max(...u):Math.max(...r.map(e=>e.end),o??-1/0))-d;Q(i,`p`,`0 – ${$(f)}ms · ${r.length}/${e.nodes.length} nodes`);let p=document.createElement(`div`);p.className=`gpu-trace-rows`,i.append(p);for(let e of r){let n=document.createElement(`div`);n.className=`gpu-trace-row`,Q(n,`span`,e.node.operation??e.node.type).setAttribute(`aria-label`,Ao(e.node));let r=document.createElement(`div`);r.className=`gpu-trace-track`;let i=document.createElement(`span`);i.className=`gpu-trace-bar`,i.tabIndex=0,i.style.left=`${f?(e.start-d)/f*100:0}%`,i.style.width=`${f?(e.end-e.start)/f*100:0}%`;let a=t===`cpu`?e.node.cpuEncodeTimeMilliseconds:e.node.gpuTimeMilliseconds,o=`${e.node.id} (${e.node.type}${e.node.condition?.outcome===`skipped`?`, skipped`:``}): ${$(e.start-d)}–${$(e.end-d)}ms; duration ${$(a??e.end-e.start)}ms`;n.dataset.spanKey=JSON.stringify([t,e.node.id]),this.tooltipNodes.set(n.dataset.spanKey,{node:e.node,timing:`${t.toUpperCase()} · ${$(a??e.end-e.start)}ms duration · ${$(e.start-d)}–${$(e.end-d)}ms${e.node.condition?.outcome===`skipped`?` · skipped`:``}`});let s=Ao(e.node,o);n.dataset.spanDetails=s,i.setAttribute(`aria-describedby`,this.tooltip.id),i.setAttribute(`aria-label`,s),r.append(i),n.append(r),Q(n,`span`,`${$(a??e.end-e.start)}ms`),p.append(n)}}}let i=Q(n,`p`,`Hover or focus a span for details.`);i.setAttribute(`aria-live`,`polite`);let a=e=>{let t=e.target.closest(`.gpu-trace-row`);t&&(i.textContent=t.dataset.spanDetails,this.showTooltip(t))},o=e=>{let t=e.relatedTarget,n=e.target.closest(`.gpu-trace-row`);(!(t instanceof Node)||!n?.contains(t))&&this.hideTooltip()};n.addEventListener(`mouseover`,a),n.addEventListener(`focusin`,a),n.addEventListener(`mouseout`,o),n.addEventListener(`focusout`,o),n.addEventListener(`scroll`,()=>this.hideTooltip(),!0),n.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip()});let s=this.element.ownerDocument.activeElement,c=s&&this.element.contains(s)?s.closest(`.gpu-trace-row`)?.dataset.spanKey:void 0,l=this.activeSpanKey;this.element.replaceChildren(n);let u=Array.from(n.querySelectorAll(`.gpu-trace-row`)),d=u.find(e=>e.dataset.spanKey===c);d&&d.querySelector(`.gpu-trace-bar`).focus({preventScroll:!0});let f=u.find(e=>e.dataset.spanKey===l);f?(i.textContent=f.dataset.spanDetails,this.showTooltip(f)):this.hideTooltip()}showTooltip(e){this.activeSpanKey=e.dataset.spanKey;let t=this.tooltipNodes.get(this.activeSpanKey);t&&(jo(this.tooltip,t.node,{timing:t.timing}),this.tooltip.hidden=!1,ko(this.tooltip,e))}hideTooltip(){this.activeSpanKey=void 0,this.tooltip.hidden=!0}destroy(){this.hideTooltip(),this.tooltip.remove(),this.tooltipNodes.clear(),this.element.replaceChildren()}};function Q(e,t,n){let r=document.createElement(t);return r.textContent=n,e.append(r),r}function $(e){return Zo.format(e)}var es=`
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
`,ts=class{inspector=new Pt;inspectorPanel=new Xo({inspector:this.inspector});tracePanel;graphs=new Map;sampleCounts=new Map;latestEncoding=null;generation=0;latestGraphId;constructor(e={}){this.tracePanel=new Qo({title:e.traceTitle})}encode(e,t,n){let r=(this.graphs.get(e.id)===e?this.sampleCounts.get(e.id):0)%60==0&&t.getTimeProfilingQuerySet()===null&&t.device.features.has(`timestamp-query`)&&t.withTimeProfilingQuerySet?t.device.createQuerySet({type:`timestamp`,count:Math.min(8192,Math.max(2,e.stats.nodeOrder.length*2))}):void 0,i;try{i=r?t.withTimeProfilingQuerySet(r,()=>e.encode(t,n)):e.encode(t,n)}catch(e){throw r?.destroy(),e}return this.record(e,i,r),i}record(e,t,n){this.graphs.get(e.id)!==e&&(this.graphs.set(e.id,e),this.sampleCounts.set(e.id,0),this.inspector.registerGraph(e)),this.inspector.recordEncoding(e.id,t);let r=this.sampleCounts.get(e.id);if(this.sampleCounts.set(e.id,r+1),r%60!=0)return;this.latestEncoding=t,this.latestGraphId=e.id,this.inspectorPanel.update(this.inspector.getSnapshot(),e.id);let i=this.generation;queueMicrotask(()=>{if(i!==this.generation||this.graphs.get(e.id)!==e){n?.destroy();return}this.inspector.recordGPUTimings(e.id,t).then(n=>{i!==this.generation||this.graphs.get(e.id)!==e||(this.inspectorPanel.update(this.inspector.getSnapshot(),this.latestGraphId),this.latestEncoding===t&&this.tracePanel.update(n??t.stats,e.id))}).catch(()=>{i===this.generation&&this.latestEncoding===t&&this.tracePanel.update(t.stats,e.id)}).finally(()=>n?.destroy())})}clear(){this.generation++,this.latestEncoding=null,this.latestGraphId=void 0,this.graphs.clear(),this.sampleCounts.clear(),this.inspector.clear(),this.inspectorPanel.update(this.inspector.getSnapshot()),this.tracePanel.update(void 0)}};export{co as a,Za as c,Kt as d,Mt as f,oe as g,We as h,uo as i,Hr as l,Xe as m,_o as n,so as o,Ye as p,xo as r,Xa as s,ts as t,Lr as u};