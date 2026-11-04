import{B as e,C as t,D as n,E as r,F as i,G as a,H as o,K as s,L as c,M as l,N as u,P as d,R as f,S as p,T as m,U as h,V as g,_,a as v,b as y,c as b,h as x,i as S,j as C,l as w,m as T,n as ee,o as E,p as te,r as ne,s as re,t as D,v as O,w as ie,x as k,y as ae,z as oe}from"./path-layer-C0s-8Fa8.js";import{$t as se,At as ce,B as le,Bt as ue,C as de,Ct as fe,Dt as A,Et as j,F as pe,Ft as me,G as he,Gt as ge,H as M,Ht as _e,I as ve,It as ye,J as be,Jt as xe,K as Se,L as Ce,Lt as we,M as Te,Mt as Ee,N as De,Nt as Oe,Ot as N,P as ke,Pt as Ae,Q as je,Qt as Me,R as Ne,Rt as Pe,St as Fe,T as Ie,Tt as P,U as Le,Ut as Re,V as ze,Vt as Be,W as Ve,Wt as He,X as Ue,Xt as F,Yt as We,Z as Ge,Zt as Ke,_t as qe,b as Je,bt as Ye,cn as Xe,ct as Ze,dn as Qe,dt as $e,en as et,et as I,f as tt,fn as nt,ft as rt,g as it,gt as at,h as ot,ht as st,in as ct,it as lt,j as ut,jt as dt,k as ft,kt as pt,ln as mt,lt as ht,mn as gt,mt as _t,nn as vt,on as yt,ot as bt,pn as xt,pt as St,rn as Ct,rt as wt,sn as Tt,st as Et,t as Dt,tn as Ot,tt as kt,un as L,ut as At,v as jt,vt as Mt,wt as R,xt as z,yt as B,zt as Nt}from"./model-CGNWrH-k.js";import{_ as Pt,m as V}from"./render-pipeline-BlTz4W4u.js";import{t as Ft}from"./texture-Cr6a0-3D.js";import{D as It,_ as Lt,c as Rt,g as zt,j as Bt,l as Vt,n as Ht,r as Ut,t as Wt,x as Gt}from"./three.tsl-tPdxQjyU.js";function Kt(e,t,n,r=!1){let i={name:`group${t}Binding${n}`,group:t,location:n,visibility:e.visibility};if(e.isUniformBuffer)return{...i,type:`uniform`};if(e.isStorageBuffer)return{...i,type:e.visibility&4&&e.access!==`readOnly`?`storage`:`read-only-storage`};if(e.store)throw Error(`LumaBackend: storage textures are not supported`);if(e.isSampledTexture)return{...i,type:`texture`,viewDimension:e.texture?.isDataArrayTexture?`2d-array`:`2d`,sampleType:e.texture?.isDepthTexture?`depth`:e.texture?.type===1015&&!r?`unfilterable-float`:`float`};if(e.isSampler)return{...i,type:`sampler`,samplerType:e.texture?.compareFunction==null?`filtering`:`comparison`};throw Error(`LumaBackend: unsupported binding`)}function qt(e,t,n=!1){let r;if(e instanceof Float32Array)r=`float32`;else if(e instanceof Uint32Array)r=`uint32`;else if(e instanceof Int32Array)r=`sint32`;else if(e instanceof Uint8Array)r=n?`unorm8`:`uint8`;else if(e instanceof Int8Array)r=n?`snorm8`:`sint8`;else if(e instanceof Uint16Array)r=n?`unorm16`:`uint16`;else if(e instanceof Int16Array)r=n?`snorm16`:`sint16`;else throw Error(`LumaBackend: unsupported vertex array type`);if(t<1||t>4||!r.endsWith(`32`)&&t!==2&&t!==4)throw Error(`LumaBackend: unsupported vertex component count`);return`${r}${t===1?``:`x${t}`}`}function Jt(e,t){if(e.stencilWrite||e.polygonOffset||e.alphaToCoverage||e.depthFunc!==3||e.blending!==1&&e.blending!==0)throw Error(`LumaBackend: unsupported material pipeline state`);return{cullMode:e.side===2?`none`:e.side===1?`front`:`back`,frontFace:t?`cw`:`ccw`,depthWriteEnabled:e.depthWrite,depthCompare:e.depthTest?`less-equal`:`always`,colorMask:e.colorWrite?15:0,blend:e.transparent&&e.blending===1,blendColorSrcFactor:e.premultipliedAlpha?`one`:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}}var Yt=class extends ot{device;compatibilityMode=!1;isWebGLBackend;extensions;capabilities;utils={getTextureSampleData:e=>({primarySamples:1,samples:1})};states=new Map;resources=new Set;renderPass=null;borrowedPass=null;borrowedParameters;borrowedRenderCounts=new WeakMap;borrowedRenderIndex=0;borrowedRenderVersion=0;renderContext=null;renderContextStack=[];computePass=null;constructor(e){super({canvas:e.getDefaultCanvasContext().canvas}),this.device=e,this.isWebGLBackend=e.type===`webgl`;let t=new Map,n=n=>(t.has(n)||t.set(n,this.isWebGLBackend?e.handle.getExtension(n):null),t.get(n));this.extensions={has:e=>!!n(e),get:n},this.capabilities={getUniformBufferLimit:()=>e.limits.maxUniformBufferBindingSize,getMaxAnisotropy:()=>1};for(let e of[`setXRTarget`,`copyTextureToTexture`,`isOccluded`,`createIndirectStorageAttribute`])Object.defineProperty(this,e,{value:()=>{throw Error(`LumaBackend: ${e} is not supported`)}})}get coordinateSystem(){return this.isWebGLBackend?xt:gt}async init(e){this.renderer=e}get(e){let t=this.states.get(e);return t||(t={},this.states.set(e,t)),t}has(e){return this.states.has(e)}delete(e){this.states.delete(e)}own(e){return this.resources.add(e),e}release(e){e&&this.resources.delete(e)&&e.destroy()}withRenderPass(e,t,n){let r=e.props.framebuffer;if(this.borrowedPass||this.renderContext||this.computePass||e.device!==this.device||!r||r.colorAttachments.length!==1||!r.depthStencilAttachment||r.colorAttachments[0].texture.samples!==1||r.depthStencilAttachment.texture.samples!==1||e.props.depthReadOnly)throw Error(`LumaBackend: expected an idle backend and a compatible single-sample caller pass`);let i=this.device.commandEncoder||e;this.borrowedRenderIndex=this.borrowedRenderCounts.get(i)||0,this.borrowedRenderCounts.set(i,this.borrowedRenderIndex+1),this.borrowedRenderVersion++,this.borrowedPass=e,this.borrowedParameters=n;try{t()}finally{this.renderPass=null,this.renderContext=null,this.borrowedPass=null,this.borrowedParameters=void 0}}dispose(){this.borrowedPass||this.renderPass?.end(),this.computePass?.end(),this.renderPass=null,this.borrowedPass=null,this.renderContext=null,this.renderContextStack.length=0,this.computePass=null;for(let e of this.resources)e.destroy();this.resources.clear(),this.states.clear()}getContext(){return this.isWebGLBackend?this.device.handle:this.device.canvasContext?.handle}updateSize(){let e=this.renderer.getDrawingBufferSize(new mt);this.device.getDefaultCanvasContext().setDrawingBufferSize(e.x,e.y)}hasFeature(e){let t={"float32-filterable":`float32-filterable`,"shader-f16":`shader-f16`};return!!(t[e]&&this.device.features.has(t[e]))}async hasFeatureAsync(e){return this.hasFeature(e)}hasCompatibility(e){return e===Ve.TEXTURE_COMPARE}setScissorTest(){}createNodeBuilder(e,t){return this.isWebGLBackend?new it(e,t):new ft(e,t)}createProgram(e){if(this.isWebGLBackend&&e.stage===`compute`)throw Error(`LumaBackend: WebGL2 compute is not supported; transform-feedback translation is deferred`);this.get(e).shader=this.own(this.device.createShader({stage:e.stage,source:e.code}))}destroyProgram(e){this.release(this.get(e).shader),this.delete(e)}getAttributeSource(e){return e.isInterleavedBufferAttribute?e.data:e}createBuffer(e,t){let n=this.getAttributeSource(e),r=this.get(n);if(r.buffer){if((r.buffer.usage&t)!==t)throw Error(`LumaBackend: attribute buffer usage cannot change`);r.attributes.add(e);return}r.attributes=new Set([e]);let i=n.array;r.buffer=this.own(this.device.createBuffer({data:i,byteLength:Math.ceil(i.byteLength/4)*4,usage:t|V.COPY_DST|V.COPY_SRC,indexType:t&V.INDEX?i instanceof Uint32Array?`uint32`:`uint16`:void 0}))}createAttribute(e){this.createBuffer(e,V.VERTEX)}createIndexAttribute(e){if(!(e.array instanceof Uint16Array||e.array instanceof Uint32Array))throw Error(`LumaBackend: indices must be uint16 or uint32`);this.createBuffer(e,V.INDEX)}createStorageAttribute(e){this.createBuffer(e,V.STORAGE|V.VERTEX)}updateAttribute(e){let t=this.getAttributeSource(e),n=this.get(t).buffer;if(t.array.byteLength>n.byteLength)throw Error(`LumaBackend: buffer resizing requires a new attribute`);if(!this.isWebGLBackend&&t.array.byteLength%4){let e=new Uint8Array(Math.ceil(t.array.byteLength/4)*4);e.set(new Uint8Array(t.array.buffer,t.array.byteOffset,t.array.byteLength)),n.write(e)}else n.write(t.array);t.clearUpdateRanges()}destroyAttribute(e){let t=this.getAttributeSource(e);if(!this.has(t))return;let n=this.get(t);!n.attributes.delete(e)||n.attributes.size||(this.release(n.buffer),this.delete(t))}createUniformBuffer(e){this.get(e).buffer=this.own(this.device.createBuffer({byteLength:e.byteLength,usage:V.UNIFORM|V.COPY_DST,data:e.buffer}))}destroyUniformBuffer(e){let t=this.get(e);this.release(t.buffer);for(let e of t.borrowedUniforms||[])e&&this.release(e.buffer);this.delete(e)}getUniformBuffer(e){let t=this.get(e);if(!this.borrowedPass||this.isWebGLBackend)return t.buffer;t.borrowedUniforms||=[];let n=t.borrowedUniforms,r=n[this.borrowedRenderIndex];return r?r.version!==this.borrowedRenderVersion&&(r.buffer.write(e.buffer),r.version=this.borrowedRenderVersion):(r={buffer:this.own(this.device.createBuffer({byteLength:e.byteLength,usage:V.UNIFORM|V.COPY_DST,data:e.buffer})),version:this.borrowedRenderVersion},n[this.borrowedRenderIndex]=r),r.buffer}updateBinding(e){this.get(e).buffer.write(e.buffer),e.clearUpdateRanges?.()}async getArrayBufferAsync(e,t=null,n=0,r=-1){this.device.submit();let i=this.getAttributeSource(e),a=i.array;if(t&&!(t instanceof ArrayBuffer))throw Error(`LumaBackend: ReadbackBuffer targets are not supported`);let o=await this.get(i).buffer.readAsync(n,r<0?a.byteLength-n:r),s=t||new ArrayBuffer(o.byteLength);return new Uint8Array(s).set(o),s}createBindings(e){this.get(e).initialized=!0}updateBindings(e){this.createBindings(e)}deleteBindGroupData(e){this.delete(e)}getBindingLayout(e){return e.flatMap((e,t)=>e.bindings.map((e,n)=>this.translateBackendBinding(e,t,n)))}translateBackendBinding(e,t,n){let r=Kt(e,t,n,this.hasFeature(`float32-filterable`));return this.isWebGLBackend?{...r,name:e.name}:r}getBindings(e){let t={};return e.forEach((e,n)=>{let r={};e.bindings.forEach((e,t)=>{let i=this.translateBackendBinding(e,n,t);this.isWebGLBackend&&e.isSampledTexture&&this.updateSampler(e),r[i.name]=e.isStorageBuffer?this.get(e.attribute).buffer:e.isSampledTexture?this.get(e.texture).texture:e.isSampler?this.get(e).sampler:this.getUniformBuffer(e)}),t[n]=r}),t}getTextureFormat(e){if(e.format===1028){if(e.type===1015)return`r32float`;if(e.type===1016)return`r16float`;if(e.type===1009)return`r8unorm`}if(e.format===1030){if(e.type===1015)return`rg32float`;if(e.type===1016)return`rg16float`;if(e.type===1009)return`rg8unorm`}if(e.format!==1023)throw Error(`LumaBackend: unsupported texture format`);if(e.type===1016)return`rgba16float`;if(e.type===1015)return`rgba32float`;if(e.type===1009)return e.colorSpace===`srgb`?`rgba8unorm-srgb`:`rgba8unorm`;throw Error(`LumaBackend: unsupported texture type`)}createDefaultTexture(e){this.createTexture(e,{width:1,height:1,levels:1}),!e.isDepthTexture&&!e.isDataArrayTexture&&this.get(e).texture.copyImageData({data:new Uint8Array([0,0,0,255]),width:1,height:1})}createTexture(e,t={}){if(e.isCubeTexture||e.isData3DTexture||e.isArrayTexture&&!e.isDataArrayTexture||e.isStorageTexture||e.isCompressedTexture)throw Error(`LumaBackend: only 2D and data-array textures are supported`);let n=this.get(e),r=t.width||e.image?.width||1,i=t.height||e.image?.height||1,a=e.isDataArrayTexture&&(t.depth||e.image?.depth)||1,o=e.isDepthTexture?`depth24plus`:this.getTextureFormat(e);n.texture?.width===r&&n.texture?.height===i&&n.texture?.depth===a&&n.texture?.format===o||(this.release(n.texture),n.texture=this.own(this.device.createTexture({width:r,height:i,depth:a,dimension:e.isDataArrayTexture?`2d-array`:`2d`,format:o,mipLevels:t.levels||1,usage:Ft.TEXTURE|Ft.RENDER_ATTACHMENT|Ft.COPY_SRC|Ft.COPY_DST})))}updateTexture(e,t={}){let n=t.image||e.image,r=this.get(e).texture;n.data?r.copyImageData({data:n.data,width:r.width,height:r.height,depthOrArrayLayers:r.depth}):r.copyExternalImage({image:n,width:r.width,height:r.height,flipY:e.flipY,premultipliedAlpha:e.premultiplyAlpha})}destroyTexture(e){this.release(this.get(e).texture),this.delete(e)}generateMipmaps(e){if(this.borrowedPass)throw Error(`LumaBackend: prepare texture mipmaps before borrowing a render pass`);this.renderPass&&(this.renderPass.end(),this.renderPass=null,this.device.submit()),this.isWebGLBackend?this.get(e).texture.generateMipmapsWebGL():this.device.generateMipmapsWebGPU(this.get(e).texture)}updateSampler(e){let t=e.texture;if(t.compareFunction!=null&&t.compareFunction!==515)throw Error(`LumaBackend: unsupported texture comparison function`);if(![1003,1006,1004,1005,1007,1008].includes(t.minFilter)||![1003,1006].includes(t.magFilter))throw Error(`LumaBackend: unsupported sampler filter`);let n=e=>e===1e3?`repeat`:e===1002?`mirror-repeat`:`clamp-to-edge`,r={type:t.compareFunction==null?`color-sampler`:`comparison-sampler`,compare:t.compareFunction==null?void 0:`less-equal`,minFilter:[1003,1004,1005].includes(t.minFilter)?`nearest`:`linear`,mipmapFilter:[1004,1007].includes(t.minFilter)?`nearest`:`linear`,lodMaxClamp:[1003,1006].includes(t.minFilter)?0:32,magFilter:t.magFilter===1003?`nearest`:`linear`,addressModeU:n(t.wrapS),addressModeV:n(t.wrapT)},i=JSON.stringify(r),a=this.get(e);return a.key!==i&&(this.release(a.sampler),a.sampler=this.own(this.device.createSampler(r)),a.key=i),this.isWebGLBackend&&this.get(t).texture&&this.get(t).texture.setSampler(a.sampler),i}destroySampler(e){this.release(this.get(e).sampler),this.delete(e)}initRenderTarget(e){this.getFramebuffer(e)}getFramebuffer(e){if(this.borrowedPass){if(e.textures)throw Error(`LumaBackend: auxiliary render targets must be prepared before borrowing a pass`);return this.borrowedPass.props.framebuffer}if(e.sampleCount>1||e.stencil||e.activeMipmapLevel||e.activeCubeFace||e.occlusionQueryCount)throw Error(`LumaBackend: unsupported render target configuration`);if(!e.textures)return this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:e.depth?`depth24plus`:!1});let t=this.get(e),n=e.textures.map(e=>this.get(e).texture),r=e.depthTexture?this.get(e.depthTexture).texture:null;return(!t.framebuffer||t.colors.some((e,t)=>e!==n[t])||t.depth!==r)&&(this.release(t.framebuffer),t.framebuffer=this.own(this.device.createFramebuffer({colorAttachments:n,depthStencilAttachment:r})),t.colors=n,t.depth=r),t.framebuffer}beginRender(e){if(this.borrowedPass){if(this.renderContext||e.textures)throw Error(`LumaBackend: nested rendering in a borrowed pass is unsupported`);this.renderContext=e,this.renderPass=this.borrowedPass,e.width=this.borrowedPass.props.framebuffer.width,e.height=this.borrowedPass.props.framebuffer.height;return}this.renderContext&&(this.renderPass?.end(),this.renderPass=null,this.device.submit(),this.renderContextStack.push(this.renderContext)),this.renderContext=e,this.openRenderPass(!0)}openRenderPass(e){let t=this.renderContext,n=this.getFramebuffer(t),r=t.clearColorValue;this.renderPass=this.device.beginRenderPass({framebuffer:n,clearColor:e&&t.clearColor?[r.r,r.g,r.b,r.a]:!1,clearDepth:e&&t.depth&&t.clearDepth?t.clearDepthValue:!1,clearStencil:!1}),this.updateViewport(t)}updateViewport(e){if(this.borrowedPass)return;let t=e.viewportValue,n=this.isWebGLBackend?e.height-t.w-t.y:t.y;if(this.renderPass?.setParameters({viewport:[t.x,n,t.z,t.w]}),e.scissor){let t=e.scissorValue;this.renderPass?.setParameters({scissorRect:[t.x,this.isWebGLBackend?e.height-t.w-t.y:t.y,t.z,t.w]})}}finishRender(){if(this.borrowedPass){this.renderPass=null,this.renderContext=null;return}this.renderPass?.end(),this.renderPass=null,this.renderContext=this.renderContextStack.pop()||null,this.device.submit()}copyFramebufferToTexture(e,t,n){if(this.borrowedPass)throw Error(`LumaBackend: framebuffer copies/transmission are unsupported in a borrowed pass`);if(e.isDepthTexture)throw Error(`LumaBackend: depth framebuffer copies are not supported`);let r=this.getFramebuffer(t).colorAttachments[0].texture,i=this.get(e).texture;if(r.format!==i.format)throw Error(`LumaBackend: framebuffer copy formats must match`);this.renderPass?.end(),this.renderPass=null,this.device.commandEncoder.copyTextureToTexture({sourceTexture:r,destinationTexture:i,origin:[n.x,n.y,0],width:n.z,height:n.w}),this.device.submit(),e.generateMipmaps&&this.generateMipmaps(e)}clear(e,t,n,r){if(this.borrowedPass)throw Error(`LumaBackend: the caller owns borrowed-pass clearing`);if(n)throw Error(`LumaBackend: stencil is not supported`);let i=this.getClearColor(),a=r?this.getFramebuffer(r):this.device.getDefaultCanvasContext().getCurrentFramebuffer();this.device.beginRenderPass({framebuffer:a,clearColor:e?[i.r,i.g,i.b,i.a]:!1,clearDepth:t?1:!1,clearStencil:!1}).end(),this.device.submit()}getPipelineState(e){let{material:t,object:n,context:r}=e,i=Jt(t,n.matrixWorld.determinant()<0);return r.depth||(delete i.depthWriteEnabled,delete i.depthCompare),{parameters:{...i,...this.borrowedParameters},formats:this.borrowedPass?this.borrowedPass.props.framebuffer.colorAttachments.map(e=>e.texture.format):r.textures?r.textures.map(e=>this.getTextureFormat(e)):[this.device.preferredColorFormat],depth:this.borrowedPass?this.borrowedPass.props.framebuffer.depthStencilAttachment?.texture.format:r.depth?`depth24plus`:void 0}}getRenderCacheKey(e){return JSON.stringify([this.getPipelineState(e),e.getGeometryCacheKey(),e.clippingContextCacheKey])}needsRenderUpdate(e){let t=this.get(e),n=this.getRenderCacheKey(e),r=t.key!==n||t.version!==e.material.version;return t.key=n,t.version=e.material.version,r}createRenderPipeline(e,t){let{pipeline:n}=e,r=e.getAttributes(),i=e.getNodeBuilderState().nodeAttributes,a=e.getVertexBuffers(),o={attributes:[],bindings:this.getBindingLayout(e.getBindings())},s=a.map((e,t)=>({name:`buffer${t}`,attributes:[]}));r.forEach((e,t)=>{let n=i[t],r=this.getAttributeSource(e),c=a.indexOf(r),l=r.array.BYTES_PER_ELEMENT,u=s[c];if(u.stepMode=e.isInstancedBufferAttribute||r.isInstancedInterleavedBuffer?`instance`:`vertex`,r.meshPerAttribute>1)throw Error(`LumaBackend: instance attribute divisors are not supported`);u.byteStride=(r.stride||e.itemSize)*l,u.attributes.push({attribute:n.name,format:qt(r.array,e.itemSize,e.normalized),byteOffset:(e.offset||0)*l});let d=n.type.startsWith(`i`)||n.type===`int`?`i32`:n.type.startsWith(`u`)||n.type===`uint`?`u32`:`f32`;o.attributes.push({name:n.name,location:t,type:e.itemSize===1?d:`vec${e.itemSize}<${d}>`})});let c=this.getPipelineState(e),l={vs:this.get(n.vertexProgram).shader,fs:this.get(n.fragmentProgram).shader,vertexEntryPoint:`main`,fragmentEntryPoint:`main`,shaderLayout:o,bufferLayout:s,topology:`triangle-list`,colorAttachmentFormats:c.formats,depthStencilAttachmentFormat:c.depth,parameters:c.parameters};if(!e.object.isMesh||e.material.wireframe)throw Error(`LumaBackend: only triangle meshes are supported`);let u=this.get(n),d=e=>{u.pipeline=this.own(e)};t?t.push(this.device.createRenderPipelineAsync(l).then(d)):d(this.device.createRenderPipeline(l))}draw(e,t){if(this.renderPass||this.openRenderPass(!1),e.object.isBatchedMesh||e.camera.isArrayCamera)throw Error(`LumaBackend: batched meshes and array cameras are not supported`);let n=e.getDrawParameters();if(!n)return;let r=this.get(e.pipeline).pipeline,i=this.get(e);if(i.pipeline!==r&&(this.release(i.vertexArray),i.vertexArray=this.own(this.device.createVertexArray({shaderLayout:r.shaderLayout,bufferLayout:r.bufferLayout})),i.pipeline=r),this.isWebGLBackend){let t=e.getNodeBuilderState().nodeAttributes;e.getAttributes().forEach((e,n)=>{let a=r.shaderLayout.attributes.find(e=>e.name===t[n].name)?.location;a!==void 0&&i.vertexArray.setBuffer(a,this.get(this.getAttributeSource(e)).buffer)})}else e.getVertexBuffers().forEach((e,t)=>i.vertexArray.setBuffer(t,this.get(e).buffer));let a=e.getIndex();i.vertexArray.setIndexBuffer(a?this.get(a).buffer:null);let o=this.renderPass;o.setPipeline(r),o.setBindings(this.getBindings(e.getBindings())),o.setVertexArray(i.vertexArray),o.draw(a?{indexCount:n.vertexCount,firstIndex:n.firstVertex,firstVertex:this.isWebGLBackend?n.firstVertex*a.array.BYTES_PER_ELEMENT:void 0,isInstanced:n.instanceCount>1,instanceCount:n.instanceCount}:{...n,isInstanced:n.instanceCount>1}),t.update(e.object,n.vertexCount,n.instanceCount)}createComputePipeline(e,t){if(this.isWebGLBackend)throw Error(`LumaBackend: WebGL2 compute is not supported; transform-feedback translation is deferred`);this.get(e).pipeline=this.own(this.device.createComputePipeline({shader:this.get(e.computeProgram).shader,shaderLayout:{bindings:this.getBindingLayout(t)}}))}beginCompute(){if(this.borrowedPass)throw Error(`LumaBackend: compute cannot run inside a borrowed pass`);if(this.isWebGLBackend)throw Error(`LumaBackend: WebGL2 compute is not supported; transform-feedback translation is deferred`);this.computePass=this.device.beginComputePass()}compute(e,t,n,r,i){let a=this.computePass;a.setPipeline(this.get(r).pipeline),a.setBindings(this.getBindings(n));let o=i??t.dispatchSize??t.count,s=typeof o==`number`?[Math.ceil(o/t.workgroupSize.reduce((e,t)=>e*t,1)),1,1]:o;if(!Array.isArray(s))throw Error(`LumaBackend: indirect compute dispatch is not supported`);a.dispatch(s[0],s[1]||1,s[2]||1)}finishCompute(){this.computePass.end(),this.computePass=null,this.device.submit()}async copyTextureToBuffer(e,t,n,r,i,a=0){if(this.borrowedPass)throw Error(`LumaBackend: readback cannot submit a borrowed pass`);if(a)throw Error(`LumaBackend: array texture readback is not supported`);let o=this.get(e).texture,s=o.computeMemoryLayout({width:r,height:i}),c=r*s.bytesPerPixel,l=this.device.createBuffer({byteLength:s.byteLength,usage:V.COPY_DST|V.COPY_SRC});try{this.device.submit(),o.readBuffer({x:t,y:n,width:r,height:i},l);let e=await l.readAsync(),a=new Uint8Array(c*i);for(let t=0;t<i;t++)a.set(e.subarray(t*s.bytesPerRow,t*s.bytesPerRow+c),t*c);return a}finally{l.destroy()}}},Xt=class extends de{constructor({device:e}){if(![`webgpu`,`webgl`].includes(e.type)||!e.canvasContext)throw Error(`LumaRenderer requires a WebGPU or WebGL2 device with a canvas context`);super(new Yt(e),{antialias:!1,outputBufferType:Xe}),this.library=new Ie}};function Zt(e,t){if(t===0)return console.warn(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.`),e;if(t===2||t===1){let n=e.getIndex();if(n===null){let t=[],r=e.getAttribute(`position`);if(r!==void 0){for(let e=0;e<r.count;e++)t.push(e);e.setIndex(t),n=e.getIndex()}else return console.error(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.`),e}let r=n.count-2,i=[];if(t===2)for(let e=1;e<=r;e++)i.push(n.getX(0)),i.push(n.getX(e)),i.push(n.getX(e+1));else for(let e=0;e<r;e++)e%2==0?(i.push(n.getX(e)),i.push(n.getX(e+1)),i.push(n.getX(e+2))):(i.push(n.getX(e+2)),i.push(n.getX(e+1)),i.push(n.getX(e)));i.length/3!==r&&console.error(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.`);let a=e.clone();return a.setIndex(i),a.clearGroups(),a}else return console.error(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:`,t),e}function Qt(e){let t=new Map,n=new Map,r=e.clone();return $t(e,r,function(e,r){t.set(r,e),n.set(e,r)}),r.traverse(function(e){if(!e.isSkinnedMesh)return;let r=e,i=t.get(e),a=i.skeleton.bones;r.skeleton=i.skeleton.clone(),r.bindMatrix.copy(i.bindMatrix),r.skeleton.bones=a.map(function(e){return n.get(e)}),r.bind(r.skeleton,r.bindMatrix)}),r}function $t(e,t,n){n(e,t);for(let r=0;r<e.children.length;r++)$t(e.children[r],t.children[r],n)}var en=class extends Ye{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(e){return new on(e)}),this.register(function(e){return new sn(e)}),this.register(function(e){return new gn(e)}),this.register(function(e){return new _n(e)}),this.register(function(e){return new vn(e)}),this.register(function(e){return new ln(e)}),this.register(function(e){return new un(e)}),this.register(function(e){return new dn(e)}),this.register(function(e){return new fn(e)}),this.register(function(e){return new an(e)}),this.register(function(e){return new pn(e)}),this.register(function(e){return new cn(e)}),this.register(function(e){return new hn(e)}),this.register(function(e){return new mn(e)}),this.register(function(e){return new nn(e)}),this.register(function(e){return new yn(e,U.EXT_MESHOPT_COMPRESSION)}),this.register(function(e){return new yn(e,U.KHR_MESHOPT_COMPRESSION)}),this.register(function(e){return new bn(e)})}load(e,t,n,r){let i=this,a;if(this.resourcePath!==``)a=this.resourcePath;else if(this.path!==``){let t=z.extractUrlBase(e);a=z.resolveURL(t,this.path)}else a=z.extractUrlBase(e);this.manager.itemStart(e);let o=function(t){r?r(t):console.error(t),i.manager.itemError(e),i.manager.itemEnd(e)},s=new Ue(this.manager);s.setPath(this.path),s.setResponseType(`arraybuffer`),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(n){try{i.parse(n,a,function(n){t(n),i.manager.itemEnd(e)},o)}catch(e){o(e)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,r){let i,a={},o={},s=new TextDecoder;if(typeof e==`string`)i=JSON.parse(e);else if(e instanceof ArrayBuffer)if(s.decode(new Uint8Array(e,0,4))===xn){try{a[U.KHR_BINARY_GLTF]=new wn(e)}catch(e){r&&r(e);return}i=JSON.parse(a[U.KHR_BINARY_GLTF].content)}else i=JSON.parse(s.decode(e));else i=e;if(i.asset===void 0||i.asset.version[0]<2){r&&r(Error(`THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.`));return}let c=new Gn(i,{path:t||this.resourcePath||``,crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let e=0;e<this.pluginCallbacks.length;e++){let t=this.pluginCallbacks[e](c);t.name||console.error(`THREE.GLTFLoader: Invalid plugin found: missing name`),o[t.name]=t,a[t.name]=!0}if(i.extensionsUsed)for(let e=0;e<i.extensionsUsed.length;++e){let t=i.extensionsUsed[e],n=i.extensionsRequired||[];switch(t){case U.KHR_MATERIALS_UNLIT:a[t]=new rn;break;case U.KHR_DRACO_MESH_COMPRESSION:a[t]=new Tn(i,this.dracoLoader);break;case U.KHR_TEXTURE_TRANSFORM:a[t]=new En;break;case U.KHR_MESH_QUANTIZATION:a[t]=new Dn;break;default:n.indexOf(t)>=0&&o[t]===void 0&&console.warn(`THREE.GLTFLoader: Unknown extension "`+t+`".`)}}c.setExtensions(a),c.setPlugins(o),c.parse(n,r)}parseAsync(e,t){let n=this;return new Promise(function(r,i){n.parse(e,t,r,i)})}};function tn(){let e={};return{get:function(t){return e[t]},add:function(t,n){e[t]=n},remove:function(t){delete e[t]},removeAll:function(){e={}}}}function H(e,t,n){let r=e.json.materials[t];return r.extensions&&r.extensions[n]?r.extensions[n]:null}var U={KHR_BINARY_GLTF:`KHR_binary_glTF`,KHR_DRACO_MESH_COMPRESSION:`KHR_draco_mesh_compression`,KHR_LIGHTS_PUNCTUAL:`KHR_lights_punctual`,KHR_MATERIALS_CLEARCOAT:`KHR_materials_clearcoat`,KHR_MATERIALS_DISPERSION:`KHR_materials_dispersion`,KHR_MATERIALS_IOR:`KHR_materials_ior`,KHR_MATERIALS_SHEEN:`KHR_materials_sheen`,KHR_MATERIALS_SPECULAR:`KHR_materials_specular`,KHR_MATERIALS_TRANSMISSION:`KHR_materials_transmission`,KHR_MATERIALS_IRIDESCENCE:`KHR_materials_iridescence`,KHR_MATERIALS_ANISOTROPY:`KHR_materials_anisotropy`,KHR_MATERIALS_UNLIT:`KHR_materials_unlit`,KHR_MATERIALS_VOLUME:`KHR_materials_volume`,KHR_TEXTURE_BASISU:`KHR_texture_basisu`,KHR_TEXTURE_TRANSFORM:`KHR_texture_transform`,KHR_MESH_QUANTIZATION:`KHR_mesh_quantization`,KHR_MATERIALS_EMISSIVE_STRENGTH:`KHR_materials_emissive_strength`,EXT_MATERIALS_BUMP:`EXT_materials_bump`,EXT_TEXTURE_WEBP:`EXT_texture_webp`,EXT_TEXTURE_AVIF:`EXT_texture_avif`,EXT_MESHOPT_COMPRESSION:`EXT_meshopt_compression`,KHR_MESHOPT_COMPRESSION:`KHR_meshopt_compression`,EXT_MESH_GPU_INSTANCING:`EXT_mesh_gpu_instancing`},nn=class{constructor(e){this.parser=e,this.name=U.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,r=t.length;n<r;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n=`light:`+e,r=t.cache.get(n);if(r)return r;let i=t.json,a=((i.extensions&&i.extensions[this.name]||{}).lights||[])[e],o,s=new M(16777215);a.color!==void 0&&s.setRGB(a.color[0],a.color[1],a.color[2],B);let c=a.range===void 0?0:a.range;switch(a.type){case`directional`:o=new be(s),o.target.position.set(0,0,-1),o.add(o.target);break;case`point`:o=new Nt(s),o.distance=c;break;case`spot`:o=new ct(s),o.distance=c,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle===void 0?0:a.spot.innerConeAngle,a.spot.outerConeAngle=a.spot.outerConeAngle===void 0?Math.PI/4:a.spot.outerConeAngle,o.angle=a.spot.outerConeAngle,o.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,o.target.position.set(0,0,-1),o.add(o.target);break;default:throw Error(`THREE.GLTFLoader: Unexpected light type: `+a.type)}return o.position.set(0,0,0),J(o,a),a.intensity!==void 0&&(o.intensity=a.intensity),o.name=t.createUniqueName(a.name||`light_`+e),r=Promise.resolve(o),t.cache.add(n,r),r}getDependency(e,t){if(e===`light`)return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],i=(r.extensions&&r.extensions[this.name]||{}).light;return i===void 0?null:this._loadLight(i).then(function(e){return n._getNodeRef(t.cache,i,e)})}},rn=class{constructor(){this.name=U.KHR_MATERIALS_UNLIT}getMaterialType(){return j}extendParams(e,t,n){let r=[];e.color=new M(1,1,1),e.opacity=1;let i=t.pbrMetallicRoughness;if(i){if(Array.isArray(i.baseColorFactor)){let t=i.baseColorFactor;e.color.setRGB(t[0],t[1],t[2],B),e.opacity=t[3]}i.baseColorTexture!==void 0&&r.push(n.assignTexture(e,`map`,i.baseColorTexture,F))}return Promise.all(r)}},an=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);return n===null||n.emissiveStrength!==void 0&&(t.emissiveIntensity=n.emissiveStrength),Promise.resolve()}},on=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];if(n.clearcoatFactor!==void 0&&(t.clearcoat=n.clearcoatFactor),n.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(t,`clearcoatMap`,n.clearcoatTexture)),n.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=n.clearcoatRoughnessFactor),n.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,`clearcoatRoughnessMap`,n.clearcoatRoughnessTexture)),n.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(t,`clearcoatNormalMap`,n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0)){let e=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new mt(e,e)}return Promise.all(r)}},sn=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_DISPERSION}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);return n===null||(t.dispersion=n.dispersion===void 0?0:n.dispersion),Promise.resolve()}},cn=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return n.iridescenceFactor!==void 0&&(t.iridescence=n.iridescenceFactor),n.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(t,`iridescenceMap`,n.iridescenceTexture)),n.iridescenceIor!==void 0&&(t.iridescenceIOR=n.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),n.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=n.iridescenceThicknessMinimum),n.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=n.iridescenceThicknessMaximum),n.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,`iridescenceThicknessMap`,n.iridescenceThicknessTexture)),Promise.all(r)}},ln=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_SHEEN}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];if(t.sheenColor=new M(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){let e=n.sheenColorFactor;t.sheenColor.setRGB(e[0],e[1],e[2],B)}return n.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=n.sheenRoughnessFactor),n.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(t,`sheenColorMap`,n.sheenColorTexture,F)),n.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,`sheenRoughnessMap`,n.sheenRoughnessTexture)),Promise.all(r)}},un=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return n.transmissionFactor!==void 0&&(t.transmission=n.transmissionFactor),n.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(t,`transmissionMap`,n.transmissionTexture)),Promise.all(r)}},dn=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_VOLUME}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];t.thickness=n.thicknessFactor===void 0?0:n.thicknessFactor,n.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,`thicknessMap`,n.thicknessTexture)),t.attenuationDistance=n.attenuationDistance||1/0;let i=n.attenuationColor||[1,1,1];return t.attenuationColor=new M().setRGB(i[0],i[1],i[2],B),Promise.all(r)}},fn=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_IOR}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);return n===null?Promise.resolve():(t.ior=n.ior===void 0?1.5:n.ior,t.ior===0&&(t.ior=1e3),Promise.resolve())}},pn=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_SPECULAR}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];t.specularIntensity=n.specularFactor===void 0?1:n.specularFactor,n.specularTexture!==void 0&&r.push(this.parser.assignTexture(t,`specularIntensityMap`,n.specularTexture));let i=n.specularColorFactor||[1,1,1];return t.specularColor=new M().setRGB(i[0],i[1],i[2],B),n.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(t,`specularColorMap`,n.specularColorTexture,F)),Promise.all(r)}},mn=class{constructor(e){this.parser=e,this.name=U.EXT_MATERIALS_BUMP}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return t.bumpScale=n.bumpFactor===void 0?1:n.bumpFactor,n.bumpTexture!==void 0&&r.push(this.parser.assignTexture(t,`bumpMap`,n.bumpTexture)),Promise.all(r)}},hn=class{constructor(e){this.parser=e,this.name=U.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return H(this.parser,e,this.name)===null?null:A}extendMaterialParams(e,t){let n=H(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return n.anisotropyStrength!==void 0&&(t.anisotropy=n.anisotropyStrength),n.anisotropyRotation!==void 0&&(t.anisotropyRotation=n.anisotropyRotation),n.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(t,`anisotropyMap`,n.anisotropyTexture)),Promise.all(r)}},gn=class{constructor(e){this.parser=e,this.name=U.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,r=n.textures[e];if(!r.extensions||!r.extensions[this.name])return null;let i=r.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw Error(`THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures`);return null}return t.loadTextureImage(e,i.source,a)}},_n=class{constructor(e){this.parser=e,this.name=U.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,r=n.json,i=r.textures[e];if(!i.extensions||!i.extensions[t])return null;let a=i.extensions[t],o=r.images[a.source],s=n.textureLoader;if(o.uri){let e=n.options.manager.getHandler(o.uri);e!==null&&(s=e)}return n.loadTextureImage(e,a.source,s)}},vn=class{constructor(e){this.parser=e,this.name=U.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,r=n.json,i=r.textures[e];if(!i.extensions||!i.extensions[t])return null;let a=i.extensions[t],o=r.images[a.source],s=n.textureLoader;if(o.uri){let e=n.options.manager.getHandler(o.uri);e!==null&&(s=e)}return n.loadTextureImage(e,a.source,s)}},yn=class{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let e=n.extensions[this.name],r=this.parser.getDependency(`buffer`,e.buffer),i=this.parser.options.meshoptDecoder;if(!i||!i.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw Error(`THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files`);return null}return r.then(function(t){let n=e.byteOffset||0,r=e.byteLength||0,a=e.count,o=e.byteStride,s=new Uint8Array(t,n,r);return i.decodeGltfBufferAsync?i.decodeGltfBufferAsync(a,o,s,e.mode,e.filter).then(function(e){return e.buffer}):i.ready.then(function(){let t=new ArrayBuffer(a*o);return i.decodeGltfBuffer(new Uint8Array(t),a,o,s,e.mode,e.filter),t})})}else return null}},bn=class{constructor(e){this.name=U.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let r=t.meshes[n.mesh];for(let e of r.primitives)if(e.mode!==W.TRIANGLES&&e.mode!==W.TRIANGLE_STRIP&&e.mode!==W.TRIANGLE_FAN&&e.mode!==void 0)return null;let i=n.extensions[this.name].attributes,a=[],o={};for(let e in i)a.push(this.parser.getDependency(`accessor`,i[e]).then(t=>(o[e]=t,o[e])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(e=>{let t=e.pop(),n=t.isGroup?t.children:[t],r=e[0].count,i=[];for(let e of n){let t=new R,n=new L,a=new Re,s=new L(1,1,1),c=new bt(e.geometry,e.material,r);for(let e=0;e<r;e++)o.TRANSLATION&&n.fromBufferAttribute(o.TRANSLATION,e),o.ROTATION&&a.fromBufferAttribute(o.ROTATION,e),o.SCALE&&s.fromBufferAttribute(o.SCALE,e),c.setMatrixAt(e,t.compose(n,a,s));for(let t in o)if(t===`_COLOR_0`){let e=o[t];c.instanceColor=new lt(e.array,e.itemSize,e.normalized)}else t!==`TRANSLATION`&&t!==`ROTATION`&&t!==`SCALE`&&e.geometry.setAttribute(t,o[t]);Ae.prototype.copy.call(c,e),this.parser.assignFinalMaterial(c),i.push(c)}return t.isGroup?(t.clear(),t.add(...i),t):i[0]}))}},xn=`glTF`,Sn=12,Cn={JSON:1313821514,BIN:5130562},wn=class{constructor(e){this.name=U.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Sn),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==xn)throw Error(`THREE.GLTFLoader: Unsupported glTF-Binary header.`);if(this.header.version<2)throw Error(`THREE.GLTFLoader: Legacy binary file detected.`);let r=this.header.length-Sn,i=new DataView(e,Sn),a=0;for(;a<r;){let t=i.getUint32(a,!0);a+=4;let r=i.getUint32(a,!0);if(a+=4,r===Cn.JSON){let r=new Uint8Array(e,Sn+a,t);this.content=n.decode(r)}else if(r===Cn.BIN){let n=Sn+a;this.body=e.slice(n,n+t)}a+=t}if(this.content===null)throw Error(`THREE.GLTFLoader: JSON content not found.`)}},Tn=class{constructor(e,t){if(!t)throw Error(`THREE.GLTFLoader: No DRACOLoader instance provided.`);this.name=U.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,r=this.dracoLoader,i=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},s={},c={};for(let e in a){let t=Pn[e]||e.toLowerCase();o[t]=a[e]}for(let t in e.attributes){let r=Pn[t]||t.toLowerCase();if(a[t]!==void 0){let i=n.accessors[e.attributes[t]];c[r]=G[i.componentType].name,s[r]=i.normalized===!0}}return t.getDependency(`bufferView`,i).then(function(e){return new Promise(function(t,n){r.decodeDracoFile(e,function(e){for(let t in e.attributes){let n=e.attributes[t],r=s[t];r!==void 0&&(n.normalized=r)}t(e)},o,c,B,n)})})}},En=class{constructor(){this.name=U.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0?e:(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0,e)}},Dn=class{constructor(){this.name=U.KHR_MESH_QUANTIZATION}},On=class extends ht{constructor(e,t,n,r){super(e,t,n,r)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r*3+r;for(let e=0;e!==r;e++)t[e]=n[i+e];return t}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=o*2,c=o*3,l=r-t,u=(n-t)/l,d=u*u,f=d*u,p=e*c,m=p-c,h=-2*f+3*d,g=f-d,_=1-h,v=g-d+u;for(let e=0;e!==o;e++){let t=a[m+e+o],n=a[m+e+s]*l,r=a[p+e+o],c=a[p+e]*l;i[e]=_*t+v*n+h*r+g*c}return i}},kn=new Re,An=class extends On{interpolate_(e,t,n,r){let i=super.interpolate_(e,t,n,r);return kn.fromArray(i).normalize().toArray(i),i}},W={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},G={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},jn={9728:ce,9729:at,9984:Ee,9985:Mt,9986:dt,9987:qe},Mn={33071:ze,33648:pt,10497:We},Nn={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Pn={POSITION:`position`,NORMAL:`normal`,TANGENT:`tangent`,TEXCOORD_0:`uv`,TEXCOORD_1:`uv1`,TEXCOORD_2:`uv2`,TEXCOORD_3:`uv3`,COLOR_0:`color`,WEIGHTS_0:`skinWeight`,JOINTS_0:`skinIndex`},K={scale:`scale`,translation:`position`,rotation:`quaternion`,weights:`morphTargetInfluences`},Fn={CUBICSPLINE:void 0,LINEAR:$e,STEP:At},In={OPAQUE:`OPAQUE`,MASK:`MASK`,BLEND:`BLEND`};function Ln(e){return e.DefaultMaterial===void 0&&(e.DefaultMaterial=new N({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:0})),e.DefaultMaterial}function q(e,t,n){for(let r in n.extensions)e[r]===void 0&&(t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[r]=n.extensions[r])}function J(e,t){t.extras!==void 0&&(typeof t.extras==`object`?Object.assign(e.userData,t.extras):console.warn(`THREE.GLTFLoader: Ignoring primitive type .extras, `+t.extras))}function Rn(e,t,n){let r=!1,i=!1,a=!1;for(let e=0,n=t.length;e<n;e++){let n=t[e];if(n.POSITION!==void 0&&(r=!0),n.NORMAL!==void 0&&(i=!0),n.COLOR_0!==void 0&&(a=!0),r&&i&&a)break}if(!r&&!i&&!a)return Promise.resolve(e);let o=[],s=[],c=[];for(let l=0,u=t.length;l<u;l++){let u=t[l];if(r){let t=u.POSITION===void 0?e.attributes.position:n.getDependency(`accessor`,u.POSITION);o.push(t)}if(i){let t=u.NORMAL===void 0?e.attributes.normal:n.getDependency(`accessor`,u.NORMAL);s.push(t)}if(a){let t=u.COLOR_0===void 0?e.attributes.color:n.getDependency(`accessor`,u.COLOR_0);c.push(t)}}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(c)]).then(function(t){let n=t[0],o=t[1],s=t[2];return r&&(e.morphAttributes.position=n),i&&(e.morphAttributes.normal=o),a&&(e.morphAttributes.color=s),e.morphTargetsRelative=!0,e})}function zn(e,t){if(e.updateMorphTargets(),t.weights!==void 0)for(let n=0,r=t.weights.length;n<r;n++)e.morphTargetInfluences[n]=t.weights[n];if(t.extras&&Array.isArray(t.extras.targetNames)){let n=t.extras.targetNames;if(e.morphTargetInfluences.length===n.length){e.morphTargetDictionary={};for(let t=0,r=n.length;t<r;t++)e.morphTargetDictionary[n[t]]=t}else console.warn(`THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.`)}}function Bn(e){let t,n=e.extensions&&e.extensions[U.KHR_DRACO_MESH_COMPRESSION];if(t=n?`draco:`+n.bufferView+`:`+n.indices+`:`+Vn(n.attributes):e.indices+`:`+Vn(e.attributes)+`:`+e.mode,e.targets!==void 0)for(let n=0,r=e.targets.length;n<r;n++)t+=`:`+Vn(e.targets[n]);return t}function Vn(e){let t=``,n=Object.keys(e).sort();for(let r=0,i=n.length;r<i;r++)t+=n[r]+`:`+e[n[r]]+`;`;return t}function Hn(e){switch(e){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw Error(`THREE.GLTFLoader: Unsupported normalized accessor component type.`)}}function Un(e){return e.search(/\.jpe?g($|\?)/i)>0||e.search(/^data\:image\/jpeg/)===0?`image/jpeg`:e.search(/\.webp($|\?)/i)>0||e.search(/^data\:image\/webp/)===0?`image/webp`:e.search(/\.ktx2($|\?)/i)>0||e.search(/^data\:image\/ktx2/)===0?`image/ktx2`:`image/png`}var Wn=new R,Gn=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new tn,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,r=-1,i=!1,a=-1;if(typeof navigator<`u`&&navigator.userAgent!==void 0){let e=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(e)===!0;let t=e.match(/Version\/(\d+)/);r=n&&t?parseInt(t[1],10):-1,i=e.indexOf(`Firefox`)>-1,a=i?e.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>`u`||n&&r<17||i&&a<98?this.textureLoader=new Tt(this.options.manager):this.textureLoader=new wt(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Ue(this.options.manager),this.fileLoader.setResponseType(`arraybuffer`),this.options.crossOrigin===`use-credentials`&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,r=this.json,i=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(e){return e._markDefs&&e._markDefs()}),Promise.all(this._invokeAll(function(e){return e.beforeRoot&&e.beforeRoot()})).then(function(){return Promise.all([n.getDependencies(`scene`),n.getDependencies(`animation`),n.getDependencies(`camera`)])}).then(function(t){let a={scene:t[0][r.scene||0],scenes:t[0],animations:t[1],cameras:t[2],asset:r.asset,parser:n,userData:{}};return q(i,a,r),J(a,r),Promise.all(n._invokeAll(function(e){return e.afterRoot&&e.afterRoot(a)})).then(function(){for(let e of a.scenes)e.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let n=0,r=t.length;n<r;n++){let r=t[n].joints;for(let t=0,n=r.length;t<n;t++)e[r[t]].isBone=!0}for(let t=0,r=e.length;t<r;t++){let r=e[t];r.mesh!==void 0&&(this._addNodeRef(this.meshCache,r.mesh),r.skin!==void 0&&(n[r.mesh].isSkinnedMesh=!0)),r.camera!==void 0&&this._addNodeRef(this.cameraCache,r.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let r=n.clone(),i=(e,t)=>{let n=this.associations.get(e);n!=null&&this.associations.set(t,n);for(let[n,r]of e.children.entries())i(r,t.children[n])};return i(n,r),r.name+=`_instance_`+ e.uses[t]++,r}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let r=e(t[n]);if(r)return r}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let r=0;r<t.length;r++){let i=e(t[r]);i&&n.push(i)}return n}getDependency(e,t){let n=e+`:`+t,r=this.cache.get(n);if(!r){switch(e){case`scene`:r=this.loadScene(t);break;case`node`:r=this._invokeOne(function(e){return e.loadNode&&e.loadNode(t)});break;case`mesh`:r=this._invokeOne(function(e){return e.loadMesh&&e.loadMesh(t)});break;case`accessor`:r=this.loadAccessor(t);break;case`bufferView`:r=this._invokeOne(function(e){return e.loadBufferView&&e.loadBufferView(t)});break;case`buffer`:r=this.loadBuffer(t);break;case`material`:r=this._invokeOne(function(e){return e.loadMaterial&&e.loadMaterial(t)});break;case`texture`:r=this._invokeOne(function(e){return e.loadTexture&&e.loadTexture(t)});break;case`skin`:r=this.loadSkin(t);break;case`animation`:r=this._invokeOne(function(e){return e.loadAnimation&&e.loadAnimation(t)});break;case`camera`:r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(n){return n!=this&&n.getDependency&&n.getDependency(e,t)}),!r)throw Error(`Unknown type: `+e);break}this.cache.add(n,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,r=this.json[e+(e===`mesh`?`es`:`s`)]||[];t=Promise.all(r.map(function(t,r){return n.getDependency(e,r)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!==`arraybuffer`)throw Error(`THREE.GLTFLoader: `+t.type+` buffer type is not supported.`);if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[U.KHR_BINARY_GLTF].body);let r=this.options;return new Promise(function(e,i){n.load(z.resolveURL(t.uri,r.path),e,void 0,function(){i(Error(`THREE.GLTFLoader: Failed to load buffer "`+t.uri+`".`))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency(`buffer`,t.buffer).then(function(e){let n=t.byteLength||0,r=t.byteOffset||0;return e.slice(r,r+n)})}loadAccessor(e){let t=this,n=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){let e=Nn[r.type],t=G[r.componentType],n=r.normalized===!0,i=new t(r.count*e);return Promise.resolve(new ve(i,e,n))}let i=[];return r.bufferView===void 0?i.push(null):i.push(this.getDependency(`bufferView`,r.bufferView)),r.sparse!==void 0&&(i.push(this.getDependency(`bufferView`,r.sparse.indices.bufferView)),i.push(this.getDependency(`bufferView`,r.sparse.values.bufferView))),Promise.all(i).then(function(e){let i=e[0],a=Nn[r.type],o=G[r.componentType],s=o.BYTES_PER_ELEMENT,c=s*a,l=r.byteOffset||0,u=r.bufferView===void 0?void 0:n.bufferViews[r.bufferView].byteStride,d=r.normalized===!0,f,p;if(u&&u!==c){let e=Math.floor(l/u),n=`InterleavedBuffer:`+r.bufferView+`:`+r.componentType+`:`+e+`:`+r.count,c=t.cache.get(n);c||(f=new o(i,e*u,r.count*u/s),c=new Et(f,u/s),t.cache.add(n,c)),p=new Ze(c,a,l%u/s,d)}else f=i===null?new o(r.count*a):new o(i,l,r.count*a),p=new ve(f,a,d);if(r.sparse!==void 0){let t=Nn.SCALAR,n=G[r.sparse.indices.componentType],s=r.sparse.indices.byteOffset||0,c=r.sparse.values.byteOffset||0,l=new n(e[1],s,r.sparse.count*t),u=new o(e[2],c,r.sparse.count*a);i!==null&&(p=new ve(p.array.slice(),p.itemSize,p.normalized)),p.normalized=!1;for(let e=0,t=l.length;e<t;e++){let t=l[e];if(p.setX(t,u[e*a]),a>=2&&p.setY(t,u[e*a+1]),a>=3&&p.setZ(t,u[e*a+2]),a>=4&&p.setW(t,u[e*a+3]),a>=5)throw Error(`THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.`)}p.normalized=d}return p})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,i=t.images[r],a=this.textureLoader;if(i.uri){let e=n.manager.getHandler(i.uri);e!==null&&(a=e)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){let r=this,i=this.json,a=i.textures[e],o=i.images[t],s=(o.uri||o.bufferView)+`:`+a.sampler;if(this.textureCache[s])return this.textureCache[s];let c=this.loadImageSource(t,n).then(function(t){t.flipY=!1,t.name=a.name||o.name||``,t.name===``&&typeof o.uri==`string`&&o.uri.startsWith(`data:image/`)===!1&&(t.name=o.uri);let n=(i.samplers||{})[a.sampler]||{};return t.magFilter=jn[n.magFilter]||1006,t.minFilter=jn[n.minFilter]||1008,t.wrapS=Mn[n.wrapS]||1e3,t.wrapT=Mn[n.wrapT]||1e3,t.generateMipmaps=!t.isCompressedTexture&&t.minFilter!==1003&&t.minFilter!==1006,r.associations.set(t,{textures:e}),t}).catch(function(){return null});return this.textureCache[s]=c,c}loadImageSource(e,t){let n=this,r=this.json,i=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(e=>e.clone());let a=r.images[e],o=self.URL||self.webkitURL,s=a.uri||``,c=!1;if(a.bufferView!==void 0)s=n.getDependency(`bufferView`,a.bufferView).then(function(e){c=!0;let t=new Blob([e],{type:a.mimeType});return s=o.createObjectURL(t),s});else if(a.uri===void 0)throw Error(`THREE.GLTFLoader: Image `+e+` is missing URI and bufferView`);let l=Promise.resolve(s).then(function(e){return new Promise(function(n,r){let a=n;t.isImageBitmapLoader===!0&&(a=function(e){let t=new yt(e);t.needsUpdate=!0,n(t)}),t.load(z.resolveURL(e,i.path),a,void 0,r)})}).then(function(e){return c===!0&&o.revokeObjectURL(s),J(e,a),e.userData.mimeType=a.mimeType||Un(a.uri),e}).catch(function(e){throw console.error(`THREE.GLTFLoader: Couldn't load texture`,s),e});return this.sourceCache[e]=l,l}assignTexture(e,t,n,r){let i=this;return this.getDependency(`texture`,n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),i.extensions[U.KHR_TEXTURE_TRANSFORM]){let e=n.extensions===void 0?void 0:n.extensions[U.KHR_TEXTURE_TRANSFORM];if(e){let t=i.associations.get(a);a=i.extensions[U.KHR_TEXTURE_TRANSFORM].extendTexture(a,e),i.associations.set(a,t)}}return r!==void 0&&(a.colorSpace=r),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,n=e.material,r=t.attributes.tangent===void 0,i=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){let e=`PointsMaterial:`+n.uuid,t=this.cache.get(e);t||(t=new Be,Fe.prototype.copy.call(t,n),t.color.copy(n.color),t.map=n.map,t.sizeAttenuation=!1,this.cache.add(e,t)),n=t}else if(e.isLine){let e=`LineBasicMaterial:`+n.uuid,t=this.cache.get(e);t||(t=new St,Fe.prototype.copy.call(t,n),t.color.copy(n.color),t.map=n.map,this.cache.add(e,t)),n=t}if(r||i||a){let e=`ClonedMaterial:`+n.uuid+`:`;r&&(e+=`derivative-tangents:`),i&&(e+=`vertex-colors:`),a&&(e+=`flat-shading:`);let t=this.cache.get(e);t||(t=n.clone(),i&&(t.vertexColors=!0),a&&(t.flatShading=!0),r&&(t.normalScale&&(t.normalScale.y*=-1),t.clearcoatNormalScale&&(t.clearcoatNormalScale.y*=-1)),this.cache.add(e,t),this.associations.set(t,this.associations.get(n))),n=t}e.material=n}getMaterialType(){return N}loadMaterial(e){let t=this,n=this.json,r=this.extensions,i=n.materials[e],a,o={},s=i.extensions||{},c=[];if(s[U.KHR_MATERIALS_UNLIT]){let e=r[U.KHR_MATERIALS_UNLIT];a=e.getMaterialType(),c.push(e.extendParams(o,i,t))}else{let n=i.pbrMetallicRoughness||{};if(o.color=new M(1,1,1),o.opacity=1,Array.isArray(n.baseColorFactor)){let e=n.baseColorFactor;o.color.setRGB(e[0],e[1],e[2],B),o.opacity=e[3]}n.baseColorTexture!==void 0&&c.push(t.assignTexture(o,`map`,n.baseColorTexture,F)),o.metalness=n.metallicFactor===void 0?1:n.metallicFactor,o.roughness=n.roughnessFactor===void 0?1:n.roughnessFactor,n.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,`metalnessMap`,n.metallicRoughnessTexture)),c.push(t.assignTexture(o,`roughnessMap`,n.metallicRoughnessTexture))),a=this._invokeOne(function(t){return t.getMaterialType&&t.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(t){return t.extendMaterialParams&&t.extendMaterialParams(e,o)})))}i.doubleSided===!0&&(o.side=2);let l=i.alphaMode||In.OPAQUE;if(l===In.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,l===In.MASK&&(o.alphaTest=i.alphaCutoff===void 0?.5:i.alphaCutoff)),i.normalTexture!==void 0&&a!==j&&(c.push(t.assignTexture(o,`normalMap`,i.normalTexture)),o.normalScale=new mt(1,1),i.normalTexture.scale!==void 0)){let e=i.normalTexture.scale;o.normalScale.set(e,e)}if(i.occlusionTexture!==void 0&&a!==j&&(c.push(t.assignTexture(o,`aoMap`,i.occlusionTexture)),i.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=i.occlusionTexture.strength)),i.emissiveFactor!==void 0&&a!==j){let e=i.emissiveFactor;o.emissive=new M().setRGB(e[0],e[1],e[2],B)}return i.emissiveTexture!==void 0&&a!==j&&c.push(t.assignTexture(o,`emissiveMap`,i.emissiveTexture,F)),Promise.all(c).then(function(){let n=new a(o);return i.name&&(n.name=i.name),J(n,i),t.associations.set(n,{materials:e}),i.extensions&&q(r,n,i),n})}createUniqueName(e){let t=_e.sanitizeNodeName(e||``);return t in this.nodeNamesUsed?t+`_`+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,r=this.primitiveCache;function i(e){return n[U.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(e,t).then(function(n){return qn(n,e,t)})}let a=[];for(let n=0,o=e.length;n<o;n++){let o=e[n],s=Bn(o),c=r[s];if(c)a.push(c.promise);else{let e;e=o.extensions&&o.extensions[U.KHR_DRACO_MESH_COMPRESSION]?i(o):qn(new Ce,o,t),r[s]={primitive:o,promise:e},a.push(e)}}return Promise.all(a)}loadMesh(e){let t=this,n=this.json,r=this.extensions,i=n.meshes[e],a=i.primitives,o=[];for(let e=0,t=a.length;e<t;e++){let t=a[e].material===void 0?Ln(this.cache):this.getDependency(`material`,a[e].material);o.push(t)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(n){let o=n.slice(0,n.length-1),s=n[n.length-1],c=[];for(let n=0,l=s.length;n<l;n++){let l=s[n],u=a[n],d,f=o[n];if(u.mode===W.TRIANGLES||u.mode===W.TRIANGLE_STRIP||u.mode===W.TRIANGLE_FAN||u.mode===void 0)d=i.isSkinnedMesh===!0?new Ot(l,f):new P(l,f),d.isSkinnedMesh===!0&&d.normalizeSkinWeights(),u.mode===W.TRIANGLE_STRIP?d.geometry=Zt(d.geometry,1):u.mode===W.TRIANGLE_FAN&&(d.geometry=Zt(d.geometry,2));else if(u.mode===W.LINES)d=new st(l,f);else if(u.mode===W.LINE_STRIP)d=new rt(l,f);else if(u.mode===W.LINE_LOOP)d=new _t(l,f);else if(u.mode===W.POINTS)d=new ue(l,f);else throw Error(`THREE.GLTFLoader: Primitive mode unsupported: `+u.mode);Object.keys(d.geometry.morphAttributes).length>0&&zn(d,i),d.name=t.createUniqueName(i.name||`mesh_`+e),J(d,i),u.extensions&&q(r,d,u),t.assignFinalMaterial(d),c.push(d)}for(let n=0,r=c.length;n<r;n++)t.associations.set(c[n],{meshes:e,primitives:n});if(c.length===1)return i.extensions&&q(r,c[0],i),c[0];let l=new I;i.extensions&&q(r,l,i),t.associations.set(l,{meshes:e});for(let e=0,t=c.length;e<t;e++)l.add(c[e]);return l})}loadCamera(e){let t,n=this.json.cameras[e],r=n[n.type];if(!r){console.warn(`THREE.GLTFLoader: Missing camera parameters.`);return}return n.type===`perspective`?t=new we(fe.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):n.type===`orthographic`&&(t=new me(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),J(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let e=0,r=t.joints.length;e<r;e++)n.push(this._loadNodeShallow(t.joints[e]));return t.inverseBindMatrices===void 0?n.push(null):n.push(this.getDependency(`accessor`,t.inverseBindMatrices)),Promise.all(n).then(function(e){let n=e.pop(),r=e,i=[],a=[];for(let e=0,o=r.length;e<o;e++){let o=r[e];if(o){i.push(o);let t=new R;n!==null&&t.fromArray(n.array,e*16),a.push(t)}else console.warn(`THREE.GLTFLoader: Joint "%s" could not be found.`,t.joints[e])}return new et(i,a)})}loadAnimation(e){let t=this.json,n=this,r=t.animations[e],i=r.name?r.name:`animation_`+e,a=[],o=[],s=[],c=[],l=[];for(let e=0,t=r.channels.length;e<t;e++){let t=r.channels[e],n=r.samplers[t.sampler],i=t.target,u=i.node,d=r.parameters===void 0?n.input:r.parameters[n.input],f=r.parameters===void 0?n.output:r.parameters[n.output];i.node!==void 0&&(a.push(this.getDependency(`node`,u)),o.push(this.getDependency(`accessor`,d)),s.push(this.getDependency(`accessor`,f)),c.push(n),l.push(i))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(s),Promise.all(c),Promise.all(l)]).then(function(e){let t=e[0],a=e[1],o=e[2],s=e[3],c=e[4],l=[];for(let e=0,r=t.length;e<r;e++){let r=t[e],i=a[e],u=o[e],d=s[e],f=c[e];if(r===void 0)continue;r.updateMatrix&&r.updateMatrix();let p=n._createAnimationTracks(r,i,u,d,f);if(p)for(let e=0;e<p.length;e++)l.push(p[e])}let u=new ut(i,void 0,l);return J(u,r),u})}createNodeMesh(e){let t=this.json,n=this,r=t.nodes[e];return r.mesh===void 0?null:n.getDependency(`mesh`,r.mesh).then(function(e){let t=n._getNodeRef(n.meshCache,r.mesh,e);return r.weights!==void 0&&t.traverse(function(e){if(e.isMesh)for(let t=0,n=r.weights.length;t<n;t++)e.morphTargetInfluences[t]=r.weights[t]}),t})}loadNode(e){let t=this.json,n=this,r=t.nodes[e],i=n._loadNodeShallow(e),a=[],o=r.children||[];for(let e=0,t=o.length;e<t;e++)a.push(n.getDependency(`node`,o[e]));let s=r.skin===void 0?Promise.resolve(null):n.getDependency(`skin`,r.skin);return Promise.all([i,Promise.all(a),s]).then(function(e){let t=e[0],n=e[1],r=e[2];r!==null&&t.traverse(function(e){e.isSkinnedMesh&&e.bind(r,Wn)});for(let e=0,r=n.length;e<r;e++)t.add(n[e]);if(t.userData.pivot!==void 0&&n.length>0){let e=t.userData.pivot,r=n[0];t.pivot=new L().fromArray(e),t.position.x-=e[0],t.position.y-=e[1],t.position.z-=e[2],r.position.set(0,0,0),delete t.userData.pivot}return t})}_loadNodeShallow(e){let t=this.json,n=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let i=t.nodes[e],a=i.name?r.createUniqueName(i.name):``,o=[],s=r._invokeOne(function(t){return t.createNodeMesh&&t.createNodeMesh(e)});return s&&o.push(s),i.camera!==void 0&&o.push(r.getDependency(`camera`,i.camera).then(function(e){return r._getNodeRef(r.cameraCache,i.camera,e)})),r._invokeAll(function(t){return t.createNodeAttachment&&t.createNodeAttachment(e)}).forEach(function(e){o.push(e)}),this.nodeCache[e]=Promise.all(o).then(function(t){let o;if(o=i.isBone===!0?new De:t.length>1?new I:t.length===1?t[0]:new Ae,o!==t[0])for(let e=0,n=t.length;e<n;e++)o.add(t[e]);if(i.name&&(o.userData.name=i.name,o.name=a),J(o,i),i.extensions&&q(n,o,i),i.matrix!==void 0){let e=new R;e.fromArray(i.matrix),o.applyMatrix4(e)}else i.translation!==void 0&&o.position.fromArray(i.translation),i.rotation!==void 0&&o.quaternion.fromArray(i.rotation),i.scale!==void 0&&o.scale.fromArray(i.scale);if(!r.associations.has(o))r.associations.set(o,{});else if(i.mesh!==void 0&&r.meshCache.refs[i.mesh]>1){let e=r.associations.get(o);r.associations.set(o,{...e})}return r.associations.get(o).nodes=e,o}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],r=this,i=new I;n.name&&(i.name=r.createUniqueName(n.name)),J(i,n),n.extensions&&q(t,i,n);let a=n.nodes||[],o=[];for(let e=0,t=a.length;e<t;e++)o.push(r.getDependency(`node`,a[e]));return Promise.all(o).then(function(e){for(let t=0,n=e.length;t<n;t++){let n=e[t];n.parent===null?i.add(n):i.add(Qt(n))}return r.associations=(e=>{let t=new Map;for(let[e,n]of r.associations)(e instanceof Fe||e instanceof yt)&&t.set(e,n);return e.traverse(e=>{let n=r.associations.get(e);n!=null&&t.set(e,n)}),t})(i),i})}_createAnimationTracks(e,t,n,r,i){let a=[],o=e.name?e.name:e.uuid,s=[];function c(e){e.morphTargetInfluences&&s.push(e.name?e.name:e.uuid)}K[i.path]===K.weights?(c(e),e.isGroup&&e.children.forEach(c)):s.push(o);let l;switch(K[i.path]){case K.weights:l=Oe;break;case K.rotation:l=He;break;case K.translation:case K.scale:l=nt;break;default:switch(n.itemSize){case 1:l=Oe;break;default:l=nt;break}break}let u=r.interpolation===void 0?$e:Fn[r.interpolation],d=this._getArrayFromAccessor(n);for(let e=0,n=s.length;e<n;e++){let n=new l(s[e]+`.`+K[i.path],t.array,d,u);r.interpolation===`CUBICSPLINE`&&this._createCubicSplineTrackInterpolant(n),a.push(n)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let e=Hn(t.constructor),n=new Float32Array(t.length);for(let r=0,i=t.length;r<i;r++)n[r]=t[r]*e;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(e){return new(this instanceof He?An:On)(this.times,this.values,this.getValueSize()/3,e)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function Kn(e,t,n){let r=t.attributes,i=new ke;if(r.POSITION!==void 0){let e=n.json.accessors[r.POSITION],t=e.min,a=e.max;if(t!==void 0&&a!==void 0){if(i.set(new L(t[0],t[1],t[2]),new L(a[0],a[1],a[2])),e.normalized){let t=Hn(G[e.componentType]);i.min.multiplyScalar(t),i.max.multiplyScalar(t)}}else{console.warn(`THREE.GLTFLoader: Missing min/max properties for accessor POSITION.`);return}}else return;let a=t.targets;if(a!==void 0){let e=new L,t=new L;for(let r=0,i=a.length;r<i;r++){let i=a[r];if(i.POSITION!==void 0){let r=n.json.accessors[i.POSITION],a=r.min,o=r.max;if(a!==void 0&&o!==void 0){if(t.setX(Math.max(Math.abs(a[0]),Math.abs(o[0]))),t.setY(Math.max(Math.abs(a[1]),Math.abs(o[1]))),t.setZ(Math.max(Math.abs(a[2]),Math.abs(o[2]))),r.normalized){let e=Hn(G[r.componentType]);t.multiplyScalar(e)}e.max(t)}else console.warn(`THREE.GLTFLoader: Missing min/max properties for accessor POSITION.`)}}i.expandByVector(e)}e.boundingBox=i;let o=new vt;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,e.boundingSphere=o}function qn(e,t,n){let r=t.attributes,i=[];function a(t,r){return n.getDependency(`accessor`,t).then(function(t){e.setAttribute(r,t)})}for(let t in r){let n=Pn[t]||t.toLowerCase();n in e.attributes||i.push(a(r[t],n))}if(t.indices!==void 0&&!e.index){let r=n.getDependency(`accessor`,t.indices).then(function(t){e.setIndex(t)});i.push(r)}return Le.workingColorSpace!==`srgb-linear`&&`COLOR_0`in r&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Le.workingColorSpace}" not supported.`),J(e,t),Kn(e,t,n),Promise.all(i).then(function(){return t.targets===void 0?e:Rn(e,t.targets,n)})}async function Jn(e,t=`gltf`){let n={gltf:new URL(`/standalone-examples/three/assets/Lantern-Bq9vywo6.glb`,``+import.meta.url).href,morph:new URL(`/standalone-examples/three/assets/AnimatedMorphCube-Cm5BnHem.glb`,``+import.meta.url).href,skin:new URL(`/standalone-examples/three/assets/RobotExpressive-BhJ5TM2m.glb`,``+import.meta.url).href},r=t===`instances`||t===`materials`||t===`transmission`?{scene:new I,animations:[]}:await new en().loadAsync(n[t]),i,a=new Ae,o=[];if(t===`materials`||t===`transmission`){let e=t===`materials`?[new A({color:4286945,roughness:.25,clearcoat:1,clearcoatRoughness:.08}),new A({color:8400960,roughness:.6,sheen:1,sheenColor:new M(16756944),sheenRoughness:.3}),new A({color:11583696,metalness:.8,roughness:.2,iridescence:1,iridescenceThicknessRange:[100,400]}),new A({color:13672544,metalness:1,roughness:.3,anisotropy:.9,anisotropyRotation:Math.PI/4})]:[new A({color:16777215,roughness:.04,transmission:1,thickness:.8,ior:1.5}),new A({color:16777215,roughness:.25,transmission:1,thickness:1.2,attenuationColor:new M(4247712),attenuationDistance:.6,dispersion:.1})];o.push(...e);for(let n=0;n<e.length;n++){let i=new P(new Ct(.55,48,32),e[n]);i.position.set((n%2-.5)*1.35,t===`materials`?(.5-Math.floor(n/2))*1.35:0,0),r.scene.add(i)}if(t===`transmission`)for(let e=0;e<9;e++){let t=new P(new pe(.4,2.2,.15),new N({color:new M().setHSL(e/9,.75,.45),roughness:.8}));t.position.set((e-4)*.4,0,-1.1),r.scene.add(t)}}if(t===`instances`){i=new bt(new pe(.3,.3,.3),new N({roughness:.35,metalness:.3}),64);for(let e=0;e<i.count;e++)a.position.set((e%8-3.5)*.4,0,(Math.floor(e/8)-3.5)*.4),a.updateMatrix(),i.setMatrixAt(e,a.matrix),i.setColorAt(e,new M().setHSL(e/i.count,.65,.5));r.scene.add(i)}let s=new Te(r.scene),c=r.animations.find(e=>e.name===`Walking`)||r.animations[0];c&&s.clipAction(c).play();let l=new Ke;l.background=new M(.04,.06,.08);let u=new ke().setFromObject(r.scene),d=u.getCenter(new L),f=u.getSize(new L),p=2.8/Math.max(f.x,f.y,f.z);r.scene.position.copy(d).multiplyScalar(-p),r.scene.scale.setScalar(p),l.add(r.scene);let m=new we(45,1,.1,100);m.position.set(3,1.2,4),m.lookAt(0,0,0);let h=new be(16769728,3);h.position.set(3,4,2),l.add(h),e.shadowMap.enabled=!0,e.shadowMap.type=1,h.castShadow=!0,h.shadow.mapSize.set(1024,1024),h.shadow.camera.left=h.shadow.camera.bottom=-3,h.shadow.camera.right=h.shadow.camera.top=3,h.shadow.camera.near=.1,h.shadow.camera.far=12,h.shadow.normalBias=.015,h.shadow.camera.updateProjectionMatrix();let g=new Pe(8,8),_=new N({color:9016475,roughness:.9,metalness:0}),v=new P(g,_);v.rotation.x=-Math.PI/2,v.position.y=-1.4,v.receiveShadow=!0,l.add(v);let y=new Float32Array(256*128*4);for(let e=0;e<128;e++)for(let t=0;t<256;t++){let n=(e*256+t)*4,r=.15+.6*(1-e/128),i=Math.exp(-((t/256-.3)**2+(e/128-.35)**2)*200)*8;y[n]=r*.7+i,y[n+1]=r*.85+i*.9,y[n+2]=r+i*.7,y[n+3]=1}let b=new Se(y,256,128,ge,je);b.mapping=303,b.minFilter=b.magFilter=at,b.needsUpdate=!0;let x=new Je(e),S=x.fromEquirectangular(b);x.dispose(),l.environment=S.texture,l.environmentIntensity=1;let C=0;return r.scene.traverse(e=>{if(e instanceof P){e.castShadow=!0,e.receiveShadow=!0;let t=Array.isArray(e.material)?e.material:[e.material];for(let e of t){if(!(e instanceof N))throw Error(`Expected glTF MeshStandardMaterial`);C++}}}),{scene:l,camera:m,light:h,materialCount:C,ground:v,animationCount:r.animations.length,physicalMaterials:o,update:e=>{if(s.setTime(e),i){for(let t=0;t<i.count;t++)a.position.set((t%8-3.5)*.4,Math.sin(e*2+t*.3)*.3,(Math.floor(t/8)-3.5)*.4),a.rotation.set(e+t*.1,e*.5,0),a.updateMatrix(),i.setMatrixAt(t,a.matrix);i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere()}},dispose:()=>{s.stopAllAction(),s.uncacheRoot(r.scene),i?.dispose(),r.scene.traverse(e=>{if(e instanceof P){e.geometry.dispose();let t=Array.isArray(e.material)?e.material:[e.material];for(let e of t){for(let t of Object.values(e))t&&typeof t==`object`&&`isTexture`in t&&`dispose`in t&&typeof t.dispose==`function`&&t.dispose();e.dispose()}}}),S.dispose(),b.dispose(),g.dispose(),_.dispose(),h.shadow.dispose()}}}function Yn(){let e=new Ke;e.background=new M(.04,.06,.08);let t=new we(45,1,.1,100);t.position.set(0,0,4);let n=new P(new pe(1.2,1.2,1.2),new j({color:14700608}));n.name=`adaptedMesh`,n.position.set(-.35,0,.25);let r=new Ce;r.setAttribute(`position`,new Ge([-1.3,-.9,0,1.3,-.9,0,.4,1.2,0],3));let i=new P(r,new j({color:4239520}));return i.name=`nativeMesh`,e.add(n,i),{scene:e,camera:t,mesh:n,nativeMesh:i,update:e=>{n.rotation.y=e*.4,i.position.z=Math.sin(e)*1.2},dispose:()=>{n.geometry.dispose(),n.material.dispose(),r.dispose(),i.material.dispose()}}}var Xn=class extends Xt{_getFrameBufferTarget(){return null}},Zn=class{renderer;device;backend;preparationTarget=new xe(16,16,{type:kt});preparedScenes=new WeakSet;disposed=!1;preparationFailed=!1;pickingContext=Vt();pickingDepthContext=Vt();pickingColor=It(new Qe);highlightingContext=Vt();highlightColor=It(new Qe);getHighlightedOutput=(e,t)=>Ht(()=>{let n=Gt(e,0,F),r=this.highlightColor.a.add(n.a.mul(this.highlightColor.a.oneMinus())),i=this.highlightColor.a.div(zt(r,1e-5)),a=Lt(t.material?.premultipliedAlpha?n.rgb.div(zt(n.a,1e-5)):n.rgb,this.highlightColor.rgb,i),o=Bt(t.material?.premultipliedAlpha?a.mul(r):a,r);return e.a.greaterThan(0).and(this.highlightColor.a.greaterThan(0)).select(o,n)})();getPickingOutput=e=>Ht(()=>(Ut(e.a.lessThanEqual(0),()=>Wt()),this.pickingColor))();getPickingDepthOutput=e=>Ht(()=>(Ut(e.a.lessThanEqual(0),()=>Wt()),Bt(Rt.z.div(Rt.w).mul(2).sub(1),0,0,1)))();constructor({device:e}){if(e.type!==`webgpu`)throw Error(`ThreeSceneAdapter requires WebGPU`);this.device=e,this.renderer=new Xn({device:e}),this.backend=this.renderer.backend,this.pickingColor.onObjectUpdate(()=>this.pickingColor.value),this.highlightColor.onObjectUpdate(()=>this.highlightColor.value);let t=this.renderer.contextNode.value;t.getOutput=e=>this.renderer.getRenderTarget()===null?Gt(e,0,F):e}async init(){await this.renderer.init()}prepare(e,t){if(this.assertUsable(),!this.renderer.initialized)throw Error(`Initialize ThreeSceneAdapter before preparing`);let n=this.renderer.getRenderTarget();this.preparedScenes.delete(e);try{try{this.renderer.setRenderTarget(this.preparationTarget),this.renderer.render(e,t)}finally{this.renderer.setRenderTarget(n)}this.preparedScenes.add(e)}catch(e){throw this.preparationFailed=!0,this.backend.finishRender(),e}}assertUsable(){if(this.disposed||this.preparationFailed)throw Error(`Create a new ThreeSceneAdapter after disposal or preparation failure`)}draw(e,t,n){this.renderScene(e,t,n)}drawHighlighted(e,t,n,r){this.renderScene(e,t,n,{getHighlightColor:r})}drawPicking(e,t,n,r,i){this.renderScene(e,t,n,{getColor:r,parameters:i})}drawPickingDepth(e,t,n,r){this.renderScene(e,t,n,{getColor:r,pickDepth:!0})}renderScene(e,t,n,{getColor:r,parameters:i,getHighlightColor:a,pickDepth:o=!1}={}){if(this.assertUsable(),!this.preparedScenes.has(e))throw Error(`Prepare the scene before drawing in a caller pass`);let s=[];e.traverse(e=>{if(e instanceof be||e instanceof ct||e instanceof Nt){let t=e.shadow;s.push({shadow:t,autoUpdate:t.autoUpdate,needsUpdate:t.needsUpdate}),t.autoUpdate=!1,t.needsUpdate=!1}});let c=this.renderer.getRenderObjectFunction(),l=this.renderer.contextNode,u=r?o?this.pickingDepthContext:this.pickingContext:this.highlightingContext;(r||a)&&(u.value={...l.value,getOutput:r?o?this.getPickingDepthOutput:this.getPickingOutput:this.getHighlightedOutput},this.renderer.contextNode=u,this.renderer.setRenderObjectFunction((...e)=>{let[t,,,,n]=e,i=r?r(t):a?.(t);if(r&&!i)return;if(n instanceof jt&&n.fragmentNode)throw Error(`Three scene picking and highlighting do not support custom fragmentNode materials`);r?this.pickingColor.value.fromArray(i):this.highlightColor.value.fromArray(i||[0,0,0,0]),e[8]=`three-${r?o?`depth`:`picking`:`highlighting`}:${e[8]||``}`;let s=n.forceSinglePass;r&&(n.forceSinglePass=!0);try{c?c.call(this.renderer,...e):this.renderer.renderObject(...e)}finally{n.forceSinglePass=s}}));try{this.backend.withRenderPass(n,()=>this.renderer.render(e,t),r?{blend:!1,depthWriteEnabled:!0,...i}:void 0)}finally{this.renderer.contextNode=l,r=void 0,a=void 0,this.renderer.setRenderObjectFunction(c);for(let{shadow:e,autoUpdate:t,needsUpdate:n}of s)e.autoUpdate=t,e.needsUpdate=n}}dispose(){this.disposed||(this.disposed=!0,this.preparationTarget.dispose(),this.renderer.dispose())}},Qn=`
struct Uniforms { transform: mat4x4<f32>, color: vec4<f32>, flags: vec4<f32> };
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@vertex fn vertexMain(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  var clip = uniforms.transform * vec4<f32>(position, 1.0);
  clip.z = mix(clip.z, (clip.z + clip.w) * 0.5, uniforms.flags.x);
  return clip;
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  let color = uniforms.color.rgb;
  let encoded = select(1.055 * pow(max(color, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055, color * 12.92, color <= vec3<f32>(0.0031308));
  let outputColor = mix(color, encoded, uniforms.flags.y);
  return vec4<f32>(mix(outputColor, outputColor * uniforms.color.a, uniforms.flags.z), uniforms.color.a);
}`,$n={attributes:[{name:`position`,location:0,type:`vec3<f32>`}],bindings:[{name:`uniforms`,group:0,location:0,type:`uniform`,visibility:3}]},er=[{name:`position`,byteStride:12,attributes:[{attribute:`position`,format:`float32x3`,byteOffset:0}]}],tr=class{device;mesh;props;vertexShader;fragmentShader;vertexArray;transform=new R;uniformBytes=new Float32Array(24);materialStates=[];positionState;indexState;disposed=!1;synchronized=!1;constructor(e){if(e.device.type!==`webgpu`)throw Error(`ThreeMeshAdapter requires WebGPU`);this.props=e,this.device=e.device,this.mesh=e.mesh,this.validateMesh(),this.vertexShader=this.device.createShader({stage:`vertex`,source:Qn}),this.fragmentShader=this.device.createShader({stage:`fragment`,source:Qn}),this.vertexArray=this.device.createVertexArray({shaderLayout:$n,bufferLayout:er})}validateMesh(){let e=this.mesh;if(!e.isMesh||`isSkinnedMesh`in e||`isInstancedMesh`in e||`isBatchedMesh`in e||e.geometry.morphAttributes.position?.length)throw Error(`ThreeMeshAdapter: only ordinary triangle meshes are supported`);let t=e.geometry.getAttribute(`position`);if(!(t instanceof ve)||!(t.array instanceof Float32Array)||t.itemSize!==3||t.normalized)throw Error(`ThreeMeshAdapter: positions must be ordinary float32x3 attributes`);let n=e.geometry.index;if(n&&!(n.array instanceof Uint16Array||n.array instanceof Uint32Array))throw Error(`ThreeMeshAdapter: indices must be uint16 or uint32`);let r=Array.isArray(e.material)?e.material:[e.material];for(let t of r){if(!(t instanceof j)||`isNodeMaterial`in t||t.map||t.alphaMap||t.aoMap||t.lightMap||t.envMap||t.vertexColors||t.wireframe||t.alphaTest||t.clippingPlanes?.length)throw Error(`ThreeMeshAdapter: only untextured MeshBasicMaterial is supported`);Jt(t,e.matrixWorld.determinant()<0)}}synchronizeAttribute(e,t,n){if(n?.attribute!==e||n.buffer.byteLength<e.array.byteLength||t&V.INDEX&&n.buffer.indexType!==(e.array instanceof Uint32Array?`uint32`:`uint16`))return n?.buffer.destroy(),{attribute:e,version:e.version,buffer:this.device.createBuffer({data:e.array,byteLength:Math.ceil(e.array.byteLength/4)*4,usage:t|V.COPY_DST,indexType:t&V.INDEX?e.array instanceof Uint32Array?`uint32`:`uint16`:void 0})};if(n.version!==e.version){if(e.array.byteLength%4){let t=new Uint8Array(Math.ceil(e.array.byteLength/4)*4);t.set(new Uint8Array(e.array.buffer,e.array.byteOffset,e.array.byteLength)),n.buffer.write(t)}else n.buffer.write(e.array);n.version=e.version}return n}synchronize(e){if(this.disposed)throw Error(`ThreeMeshAdapter is disposed`);this.validateMesh(),this.mesh.updateWorldMatrix(!0,!1),e.updateWorldMatrix(!0,!1);let t=this.mesh.geometry.getAttribute(`position`);this.positionState=this.synchronizeAttribute(t,V.VERTEX,this.positionState),this.vertexArray.setBuffer(0,this.positionState.buffer);let n=this.mesh.geometry.index;n?(this.indexState=this.synchronizeAttribute(n,V.INDEX,this.indexState),this.vertexArray.setIndexBuffer(this.indexState.buffer)):(this.indexState?.buffer.destroy(),this.indexState=void 0,this.vertexArray.setIndexBuffer(null)),this.transform.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse).multiply(this.mesh.matrixWorld),this.transform.toArray(this.uniformBytes),this.uniformBytes[20]=e.coordinateSystem===2e3?1:0,this.uniformBytes[21]=this.props.outputColorSpace===`srgb`?1:0;let r=Array.isArray(this.mesh.material)?this.mesh.material:[this.mesh.material];for(let e=0;e<r.length;e++){let t=r[e],n=Jt(t,this.mesh.matrixWorld.determinant()<0),i=JSON.stringify(n),a=this.materialStates[e];(!a||a.material!==t||a.key!==i)&&(a?.pipeline.destroy(),a={material:t,key:i,uniforms:a?.uniforms||this.device.createBuffer({byteLength:96,usage:V.UNIFORM|V.COPY_DST}),pipeline:this.device.createRenderPipeline({vs:this.vertexShader,fs:this.fragmentShader,vertexEntryPoint:`vertexMain`,fragmentEntryPoint:`fragmentMain`,shaderLayout:$n,bufferLayout:er,topology:`triangle-list`,colorAttachmentFormats:[this.props.colorAttachmentFormat||this.device.preferredColorFormat],depthStencilAttachmentFormat:this.props.depthStencilAttachmentFormat||`depth24plus`,parameters:n})},this.materialStates[e]=a),this.uniformBytes.set([t.color.r,t.color.g,t.color.b,t.transparent?t.opacity:1],16),this.uniformBytes[22]=t.premultipliedAlpha?1:0,a.uniforms.write(this.uniformBytes)}for(let e of this.materialStates.splice(r.length))e.pipeline.destroy(),e.uniforms.destroy();this.synchronized=!0}draw(e){if(this.disposed||!this.synchronized)throw Error(`ThreeMeshAdapter: synchronize before drawing`);for(let e=this.mesh;e;e=e.parent)if(!e.visible)return;let t=this.mesh.geometry,n=this.indexState?.attribute.count??this.positionState.attribute.count,r=t.drawRange.start,i=Math.min(n,r+t.drawRange.count),a=Array.isArray(this.mesh.material)?t.groups:[{start:0,count:n,materialIndex:0}];for(let t of a){let n=this.materialStates[t.materialIndex??0];if(!n)throw Error(`ThreeMeshAdapter: invalid group material index`);if(!n.material.visible)continue;let a=Math.max(r,t.start),o=Math.max(0,Math.min(i,t.start+t.count)-a);o&&(e.setPipeline(n.pipeline),e.setBindings({uniforms:n.uniforms}),e.setVertexArray(this.vertexArray),e.draw(this.indexState?{indexCount:o,firstIndex:a}:{vertexCount:o,firstVertex:a}))}}dispose(){if(!this.disposed){this.disposed=!0,this.positionState?.buffer.destroy(),this.indexState?.buffer.destroy();for(let e of this.materialStates)e.pipeline.destroy(),e.uniforms.destroy();this.vertexArray.destroy(),this.vertexShader.destroy(),this.fragmentShader.destroy()}}},nr=`
struct Uniforms { transform: mat4x4<f32>, color: vec4<f32>, flags: vec4<f32> };
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@vertex fn vertexMain(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  return uniforms.transform * vec4<f32>(position, 1.0);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  let color = uniforms.color.rgb;
  let encoded = select(1.055 * pow(max(color, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055, color * 12.92, color <= vec3<f32>(0.0031308));
  return vec4<f32>(mix(color, encoded, uniforms.flags.x), 1.0);
}`,rr=class{domElement;adapter;nativeModel;nativeBuffer;uniformBuffer;sourceScene;transform=new R;uniformBytes=new Float32Array(24);animationFrame=0;disposed=!1;constructor(e,t=e.preferredColorFormat,n=`srgb`){this.device=e,this.colorFormat=t,this.outputColorSpace=n;let r=e.getDefaultCanvasContext().canvas;if(!(r instanceof HTMLCanvasElement))throw Error(`Mixed example requires an HTML canvas`);this.domElement=r}async init(){}setSize(e,t,n=!1){this.device.getDefaultCanvasContext().setDrawingBufferSize(e,t)}setAnimationLoop(e){if(cancelAnimationFrame(this.animationFrame),!e)return;let t=()=>{e(),this.animationFrame=requestAnimationFrame(t)};this.animationFrame=requestAnimationFrame(t)}render(e,t,n){if(this.disposed)throw Error(`MixedObjectRenderer is disposed`);let r=e.getObjectByName(`adaptedMesh`),i=e.getObjectByName(`nativeMesh`);if(!(r instanceof P)||!(r.material instanceof j)||!(i instanceof P)||!(i.material instanceof j))throw Error(`Mixed example requires its two basic meshes`);if(this.sourceScene&&this.sourceScene!==e)throw Error(`Recreate the mixed renderer when replacing its scene`);if(this.adapter||(this.sourceScene=e,this.adapter=new tr({device:this.device,mesh:r,colorAttachmentFormat:this.colorFormat,outputColorSpace:this.outputColorSpace}),this.nativeBuffer=this.device.createBuffer({data:i.geometry.getAttribute(`position`).array,usage:V.VERTEX}),this.uniformBuffer=this.device.createBuffer({byteLength:96,usage:V.UNIFORM|V.COPY_DST}),this.nativeModel=new Dt(this.device,{source:nr,vertexCount:3,topology:`triangle-list`,shaderLayout:{attributes:[{name:`position`,location:0,type:`vec3<f32>`}],bindings:[{name:`uniforms`,group:0,location:0,type:`uniform`,visibility:3}]},bufferLayout:[{name:`position`,byteStride:12,attributes:[{attribute:`position`,format:`float32x3`,byteOffset:0}]}],attributes:{position:this.nativeBuffer},bindings:{uniforms:this.uniformBuffer},colorAttachmentFormats:[this.colorFormat],parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`back`}})),this.adapter.synchronize(t),i.updateWorldMatrix(!0,!1),this.transform.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse).multiply(i.matrixWorld),this.transform.toArray(this.uniformBytes),t.coordinateSystem===2e3)for(let e of[0,4,8,12])this.uniformBytes[e+2]=(this.uniformBytes[e+2]+this.uniformBytes[e+3])*.5;this.uniformBytes.set([i.material.color.r,i.material.color.g,i.material.color.b,1],16),this.uniformBytes[20]=this.outputColorSpace===`srgb`?1:0,this.uniformBuffer.write(this.uniformBytes);let a=e.background instanceof M?e.background.clone():new M;this.outputColorSpace===`srgb`&&a.convertLinearToSRGB();let o=this.device.beginRenderPass({framebuffer:n||this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:`depth24plus`}),clearColor:[a.r,a.g,a.b,1],clearDepth:1});this.adapter.draw(o),this.nativeModel.draw(o),o.end(),this.device.submit()}dispose(){this.disposed||(this.disposed=!0,this.setAnimationLoop(null),this.adapter?.dispose(),this.nativeModel?.destroy(),this.nativeBuffer?.destroy(),this.uniformBuffer?.destroy())}},Y={RGBA8UNORM:0,RGBA16FLOAT:1,RGBA32FLOAT:2},ir={rgba8unorm:4,rgba16float:8,rgba32float:16};Y.RGBA8UNORM,Y.RGBA16FLOAT,Y.RGBA32FLOAT,Y.RGBA8UNORM,Y.RGBA16FLOAT,Y.RGBA32FLOAT;var ar={useByteColors:`f32`},or={useByteColors:!0};Y.RGBA8UNORM,ir.rgba8unorm/Uint32Array.BYTES_PER_ELEMENT,lr(`colors`);var sr=lr(`floatColors`);ur(`colors`);var cr=ur(`floatColors`);`${Y.RGBA8UNORM}${Y.RGBA16FLOAT}`;function lr(e){return`\
layout(std140) uniform ${e}Uniforms {
  float useByteColors;
} ${e};

vec3 ${e}_normalize(vec3 inputColor) {
  return ${e}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${e}_normalize(vec4 inputColor) {
  return ${e}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${e}_premultiplyAlpha(vec4 inputColor) {
  return vec4(inputColor.rgb * inputColor.a, inputColor.a);
}

vec4 ${e}_unpremultiplyAlpha(vec4 inputColor) {
  return inputColor.a > 0.0 ? vec4(inputColor.rgb / inputColor.a, inputColor.a) : vec4(0.0);
}

vec4 ${e}_premultiply_alpha(vec4 inputColor) {
  return ${e}_premultiplyAlpha(inputColor);
}

vec4 ${e}_unpremultiply_alpha(vec4 inputColor) {
  return ${e}_unpremultiplyAlpha(inputColor);
}
`}function ur(e){return`\
struct ${e}Uniforms {
  useByteColors: f32
};

@group(0) @binding(auto) var<uniform> ${e} : ${e}Uniforms;

fn ${e}_normalize(inputColor: vec3<f32>) -> vec3<f32> {
  return select(inputColor, inputColor / 255.0, ${e}.useByteColors > 0.5);
}

fn ${e}_normalize4(inputColor: vec4<f32>) -> vec4<f32> {
  return select(inputColor, inputColor / 255.0, ${e}.useByteColors > 0.5);
}

fn ${e}_premultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(inputColor.rgb * inputColor.a, inputColor.a);
}

fn ${e}_unpremultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return select(
    vec4<f32>(0.0),
    vec4<f32>(inputColor.rgb / inputColor.a, inputColor.a),
    inputColor.a > 0.0
  );
}

fn ${e}_premultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${e}_premultiplyAlpha(inputColor);
}

fn ${e}_unpremultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${e}_unpremultiplyAlpha(inputColor);
}
`}var dr={name:`floatColors`,props:{},uniforms:{},vs:sr,fs:sr,source:cr,uniformTypes:ar,defaultUniforms:or},fr=`precision highp int;

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
`,pr=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,X=5,mr={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},X]},defaultUniforms:yr(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:pr,vs:fr,fs:fr,getUniforms:hr};function hr(e,t={}){if(e&&={...e},!e)return yr();e.lights&&(e={...e,..._r(e.lights),lights:void 0});let{useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o}=e||{};if(!(r||i&&i.length>0||a&&a.length>0||o&&o.length>0))return{...yr(),enabled:0};let s={...yr(),...gr({useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o})};return e.enabled!==void 0&&(s.enabled=e.enabled?1:0),s}function gr({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=br(),o=0,s=0,c=0,l=0;for(let t of n){if(o>=X)break;a[o]={...a[o],color:vr(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},o++,s++}for(let t of r){if(o>=X)break;a[o]={...a[o],color:vr(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:Sr(t)},o++,c++}for(let t of i){if(o>=X)break;a[o]={...a[o],color:vr(t,e),direction:t.direction},o++,l++}return n.length+r.length+i.length>X&&Pt.warn(`MAX_LIGHTS exceeded, truncating to ${X}`)(),{ambientColor:vr(t,e),directionalLightCount:l,pointLightCount:s,spotLightCount:c,lights:a}}function _r(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function vr(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return l(n,u(t,!0)).map(e=>e*r)}function yr(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:br()}}function br(){return Array.from({length:X},()=>xr())}function xr(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function Sr(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var Cr={props:{},name:`gouraudMaterial`,bindingLayout:[{name:`gouraudMaterial`,group:3}],vs:`layout(std140) uniform gouraudMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 view_direction, vec3 normal_worldspace, vec3 color) {
  vec3 halfway_direction = normalize(light_direction + view_direction);
  float lambertian = dot(light_direction, normal_worldspace);
  float specular = 0.0;
  if (lambertian > 0.0) {
    float specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, material.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (lambertian * material.diffuse * surfaceColor + specular * floatColors_normalize(material.specularColor)) * color;
}

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = surfaceColor;

  if (material.unlit) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  vec3 view_direction = normalize(cameraPosition - position_worldspace);
  lightColor = material.ambient * surfaceColor * lighting.ambientColor;

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 light_position_worldspace = pointLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getPointLightAttenuation(pointLight, distance(light_position_worldspace, position_worldspace));
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 light_position_worldspace = spotLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, spotLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }
  
  return lightColor;
}
`,fs:`layout(std140) uniform gouraudMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;
`,source:`struct gouraudMaterialUniforms {
  unlit: u32,
  ambient: f32,
  diffuse: f32,
  shininess: f32,
  specularColor: vec3<f32>,
};

@group(3) @binding(auto) var<uniform> gouraudMaterial : gouraudMaterialUniforms;

fn lighting_getLightColor(surfaceColor: vec3<f32>, light_direction: vec3<f32>, view_direction: vec3<f32>, normal_worldspace: vec3<f32>, color: vec3<f32>) -> vec3<f32> {
  let halfway_direction: vec3<f32> = normalize(light_direction + view_direction);
  var lambertian: f32 = dot(light_direction, normal_worldspace);
  var specular: f32 = 0.0;
  if (lambertian > 0.0) {
    let specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, gouraudMaterial.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (
    lambertian * gouraudMaterial.diffuse * surfaceColor +
    specular * floatColors_normalize(gouraudMaterial.specularColor)
  ) * color;
}

fn lighting_getLightColor2(surfaceColor: vec3<f32>, cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32> {
  var lightColor: vec3<f32> = surfaceColor;

  if (gouraudMaterial.unlit != 0u) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  let view_direction: vec3<f32> = normalize(cameraPosition - position_worldspace);
  lightColor = gouraudMaterial.ambient * surfaceColor * lighting.ambientColor;

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
      view_direction,
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
      view_direction,
      normal_worldspace,
      spotLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }  
  
  return lightColor;
}

fn lighting_getSpecularLightColor(cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32>{
  var lightColor = vec3<f32>(0, 0, 0);
  let surfaceColor = vec3<f32>(0, 0, 0);

  if (lighting.enabled != 0) {
    let view_direction = normalize(cameraPosition - position_worldspace);

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
        view_direction,
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
        view_direction,
        normal_worldspace,
        spotLight.color / light_attenuation
      );
    }

    for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
        let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
        lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
    }
  }
  return lightColor;
}
`,defines:{LIGHTING_VERTEX:!0},dependencies:[mr,dr],uniformTypes:{unlit:`i32`,ambient:`f32`,diffuse:`f32`,shininess:`f32`,specularColor:`vec3<f32>`},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms(e){return{...Cr.defaultUniforms,...e}}},wr=`compositeLayer.renderLayers`,Tr=class extends b{get isComposite(){return!0}get isDrawable(){return!1}get isLoaded(){return super.isLoaded&&this.getSubLayers().every(e=>e.isLoaded)}getSubLayers(){return this.internalState&&this.internalState.subLayers||[]}initializeState(e){}setState(e){super.setState(e),this.setNeedsUpdate()}getPickingInfo({info:e}){let{object:t}=e;return t&&t.__source&&t.__source.parent&&t.__source.parent.id===this.id?(e.object=t.__source.object,e.index=t.__source.index,e):e}filterSubLayer(e){return!0}shouldRenderSubLayer(e,t){return t&&t.length}getSubLayerClass(e,t){let{_subLayerProps:n}=this.props;return n&&n[e]&&n[e].type||t}getSubLayerRow(e,t,n){return e.__source={parent:this,object:t,index:n},e}getSubLayerAccessor(e){if(typeof e==`function`){let t={index:-1,data:this.props.data,target:[]};return(n,r)=>n&&n.__source?(t.index=n.__source.index,e(n.__source.object,t)):e(n,r)}return e}getSubLayerProps(e={}){let{opacity:t,pickable:n,visible:r,parameters:i,getPolygonOffset:a,highlightedObjectIndex:o,autoHighlight:s,highlightColor:c,coordinateSystem:l,coordinateOrigin:u,wrapLongitude:d,positionFormat:f,modelMatrix:p,extensions:m,fetch:h,operation:g,_subLayerProps:_}=this.props,v={id:``,updateTriggers:{},opacity:t,pickable:n,visible:r,parameters:i,getPolygonOffset:a,highlightedObjectIndex:o,autoHighlight:s,highlightColor:c,coordinateSystem:l,coordinateOrigin:u,wrapLongitude:d,positionFormat:f,modelMatrix:p,extensions:m,fetch:h,operation:g},y=_&&e.id&&_[e.id],b=y&&y.updateTriggers,S=e.id||`sublayer`;if(y){let t=this.props[x],n=e.type?e.type._propTypes:{};for(let e in y){let r=n[e]||t[e];r&&r.type===`accessor`&&(y[e]=this.getSubLayerAccessor(y[e]))}}Object.assign(v,e,y),v.id=`${this.props.id}-${S}`,v.updateTriggers={all:this.props.updateTriggers?.all,...e.updateTriggers,...b};for(let e of m){let t=e.getSubLayerProps.call(this,e);t&&Object.assign(v,t,{updateTriggers:Object.assign(v.updateTriggers,t.updateTriggers)})}return v}_updateAutoHighlight(e){for(let t of this.getSubLayers())t.updateAutoHighlight(e)}_getAttributeManager(){return null}_postUpdate(e,t){let n=this.internalState.subLayers,r=!n||this.needsUpdate();r&&(n=T(this.renderLayers(),Boolean),this.internalState.subLayers=n),d(wr,this,r,n);for(let e of n)e.parent=this}};Tr.layerName=`CompositeLayer`;var Z=Math.PI/180,Er=180/Math.PI,Dr=1,Or=6370972,kr=.75,Ar=1.15;function jr(e){let t=ae(e+180,360)-180;return Math.abs(t)<Dr}function Mr(){let e=256/Or,t=Math.PI/180*256;return{unitsPerMeter:[e,e,e],unitsPerMeter2:[0,0,0],metersPerUnit:[1/e,1/e,1/e],unitsPerDegree:[t,t,e],unitsPerDegree2:[0,0,0],degreesPerUnit:[1/t,1/t,1/e]}}var Nr=class extends _{constructor(e={}){let{longitude:n=0,bearing:r=0,pitch:i=0,zoom:a=0,nearZMultiplier:o=.5,farZMultiplier:s=1,resolution:l=10}=e,{latitude:u=0,height:d,altitude:f=1.5,fovy:m}=e;u=Math.max(Math.min(u,90),-90),d||=1,m?f=t(m):m=p(f);let h=2**(a-Pr(Math.max(Math.min(u,k),-k))),g=i*Z,_=e.nearZ??o,v=e.farZ??(f+256*2*h/d/Math.max(Math.cos(g),.1))*s,y=new c().lookAt({eye:[0,-f,0],up:[0,0,1]}).rotateX(-g).rotateY(-r*Z).rotateX(u*Z).rotateZ(-n*Z).scale(h/d);super({...e,height:d,viewMatrix:y,longitude:n,latitude:u,zoom:a,distanceScales:Mr(),fovy:m,focalDistance:f,near:_,far:v}),this.scale=h,this.latitude=u,this.longitude=n,this.bearing=r,this.pitch=i,this.fovy=m,this.resolution=l}get projectionMode(){return n.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,this.height/2],t),r=this.unproject([this.width/2,0],t),i=this.unproject([this.width,this.height/2],t),a=this.unproject([this.width/2,this.height],t);return i[0]<this.longitude&&(i[0]+=360),n[0]>this.longitude&&(n[0]-=360),[Math.min(n[0],i[0],r[0],a[0]),Math.min(n[1],i[1],r[1],a[1]),Math.max(n[0],i[0],r[0],a[0]),Math.max(n[1],i[1],r[1],a[1])]}_getRayToGlobe(e,{topLeft:t=!0,targetZ:n}={}){let[r,i]=e,a=t?i:this.height-i,{pixelUnprojectionMatrix:s}=this,c=Fr(s,[r,a,-1,1]),l=Fr(s,[r,a,1,1]),u=((n||0)/Or+1)*256,d=o(h([],c,l)),f=o(c),p=o(l);return{rayStartPosition:c,rayEndPosition:l,radius:u,rayLengthSquared:d,rayStartDistanceSquared:f,distanceToCenterSquared:4*((4*f*p-(d-f-p)**2)/16)/d}}_getRayDistanceToGlobeCenterRatio(e,t){let{distanceToCenterSquared:n,radius:r}=this._getRayToGlobe(e,t);return Math.sqrt(Math.max(0,n))/r}getZoomAnchorStrength(e){let t=this._getRayDistanceToGlobeCenterRatio(e);if(t>=Ar)return 0;let n=Math.max(0,Math.min(1,(t-kr)/(Ar-kr)));return 1-n*n*(3-2*n)}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,{pixelUnprojectionMatrix:s}=this,c;if(Number.isFinite(a))c=Fr(s,[r,o,a,1]);else{let{rayStartPosition:r,rayEndPosition:i,radius:a,rayLengthSquared:o,rayStartDistanceSquared:s,distanceToCenterSquared:l}=this._getRayToGlobe(e,{topLeft:t,targetZ:n});c=g([],r,i,(Math.sqrt(s-l)-Math.sqrt(Math.max(0,a*a-l)))/Math.sqrt(o))}let[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n,r=0]=e,i=t*Z,a=n*Z,o=Math.cos(a),s=(r/Or+1)*256;return[Math.sin(i)*o*s,-Math.cos(i)*o*s,Math.sin(a)*s]}unprojectPosition(t){let[n,r,i]=t,a=e(t),o=Math.asin(i/a);return[Math.atan2(n,-r)*Er,o*Er,(a/256-1)*Or]}projectFlat(e){return e}unprojectFlat(e){return e}panByPosition(e,t,n){if(!n){let n=this.getZoomAnchorStrength(t);if(n===0)return{longitude:this.longitude,latitude:this.latitude};let r=this.unproject(t),i=ae(e[0]-r[0]+180,360)-180,a=e[1]-r[1],o=Math.abs(r[1])>85.051129||Math.abs(i)>90;if(jr(this.bearing)&&o)return{longitude:this.longitude,latitude:this.latitude};if(jr(this.bearing)&&a!==0){let e=((a>0?k:-k)-this.latitude)/a;n=Math.min(n,Math.max(0,e))}return{longitude:this.longitude+i*n,latitude:Math.max(Math.min(this.latitude+a*n,90),-90)}}let[r,i,a]=e,o=.25/2**(this.zoom-Pr(this.latitude)),s=r+o*(n[0]-t[0]),c=i-o*(n[1]-t[1]);c=Math.max(Math.min(c,90),-90);let l={longitude:s,latitude:c,zoom:a-Pr(i)};return l.zoom+=Pr(l.latitude),l}};Nr.displayName=`GlobeViewport`;function Pr(e,t){t&&(e=Math.max(Math.min(e,k),-k));let n=Math.PI*Math.cos(e*Math.PI/180);return Math.log2(n)}function Fr(e,t){let n=oe([],t,e);return f(n,n,1/n[3]),n}var Ir=Math.PI/180;function Lr({height:e,focalDistance:t,orbitAxis:n,rotationX:r,rotationOrbit:i,zoom:a}){let o=n===`Z`?[0,0,1]:[0,1,0],s=n===`Z`?[0,-t,0]:[0,0,t],l=new c().lookAt({eye:s,up:o});l.rotateX(r*Ir),n===`Z`?l.rotateZ(i*Ir):l.rotateY(i*Ir);let u=2**a/e;return l.scale(u),l}var Rr=class extends _{constructor(e){let{height:n,projectionMatrix:r,fovy:i=50,orbitAxis:a=`Z`,target:o=[0,0,0],rotationX:s=0,rotationOrbit:c=0,zoom:l=0}=e,u=r?r[5]/2:t(i);super({...e,longitude:void 0,viewMatrix:Lr({height:n||1,focalDistance:u,orbitAxis:a,rotationX:s,rotationOrbit:c,zoom:l}),fovy:i,focalDistance:u,position:o,zoom:l}),this.target=o,this.orbitAxis=a,this.rotationX=s,this.rotationOrbit=c,this.fovy=i,this.projectedCenter=this.project(this.center)}unproject(e,{topLeft:t=!0}={}){let[n,r,i=this.projectedCenter[2]]=e,[a,o,s]=ie([n,t?r:this.height-r,i],this.pixelUnprojectionMatrix);return[a,o,s]}panByPosition(e,t,n){let r=this.project(e),{near:i,far:a}=O(this.projectionMatrix),o=i*a/(a-r[2]*(a-i))/(i*a/(a-this.projectedCenter[2]*(a-i))),s=[this.width/2+(r[0]-t[0])*o,this.height/2+(r[1]-t[1])*o,this.projectedCenter[2]];return{target:this.unproject(s)}}};Rr.displayName=`OrbitViewport`;var zr=class extends te{constructor(e={}){super(e),this.props.orbitAxis=e.orbitAxis||`Z`}getViewportType(){return Rr}get ControllerType(){return re}};zr.displayName=`OrbitView`;var Br={blend:!0,blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`constant`,blendAlphaDstFactor:`zero`},Vr=new R().set(1,0,0,0,0,1,0,0,0,0,.5,.5,0,0,0,1);function Hr(e,t,n=xt,r,i){if(r&&!t.isGeospatial)throw Error(`A local meter origin requires a geographic Mercator viewport`);let a=new R().fromArray(t.viewMatrix);if(t.isGeospatial){if(t instanceof Nr)throw Error(`Geographic Three scenes require Mercator projection`);if(!r||!t.projectPosition||!t.getDistanceScales)throw Error(`Geographic Three scenes require a local meter coordinate origin`);let e=t.projectPosition(r),n=t.getDistanceScales(r).unitsPerMeter;a.multiply(new R().makeTranslation(...e)),a.scale(new L(...n))}if(i){let e=new R().fromArray(i),t=e.elements;if(t[3]!==0||t[7]!==0||t[11]!==0||t[15]!==1||!(e.determinant()>0))throw Error(`Three scene modelMatrix requires an orientation-preserving affine transform`);a.multiply(e)}e.matrixAutoUpdate=!1,e.matrixWorldAutoUpdate=!1,e.coordinateSystem=n,e.matrixWorldInverse.copy(a),e.matrixWorld.copy(e.matrixWorldInverse).invert(),e.matrixWorld.decompose(e.position,e.quaternion,new L),e.quaternion.normalize(),e.scale.set(1,1,1),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrix.copy(e.matrixWorld),e.matrixWorldInverse.copy(e.matrixWorld).invert(),e.projectionMatrix.fromArray(t.projectionMatrix).multiply(a).multiply(e.matrixWorld),n===2001&&e.projectionMatrix.premultiply(Vr),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}var Ur=class extends b{static layerName=`ThreeMeshLayer`;static defaultProps={meshes:{type:`object`,value:[],compare:!1},coordinateSystem:r.CARTESIAN};getAttributeManager(){return null}initializeState(){this.setState({camera:new Ne,adapters:[]})}updateState(){if(this.context.device.type!==`webgpu`)throw Error(`ThreeMeshLayer requires WebGPU`);if(this.props.pickable||this.props.opacity!==1||this.props.extensions.length||this.props.modelMatrix||Object.keys(this.props.parameters||{}).length||this.props.coordinateOrigin.some(e=>e!==0)||this.props.coordinateSystem!==r.CARTESIAN)throw Error(`ThreeMeshLayer supports non-pickable Cartesian meshes; use Three transforms and materials`)}draw({renderPass:e}){let t=e.props.framebuffer;if(!t||t.colorAttachments.length!==1||!t.depthStencilAttachment)throw Error(`ThreeMeshLayer requires one color attachment and a shared depth attachment`);let n=t.colorAttachments[0].texture,r=t.depthStencilAttachment.texture;if(n.samples!==1)throw Error(`ThreeMeshLayer multisampling is unsupported`);let i=`${n.format}:${r.format}`;if(this.state.attachmentKey!==i||this.state.adapters.length!==this.props.meshes.length||this.state.adapters.some((e,t)=>e.mesh!==this.props.meshes[t])){for(let e of this.state.adapters)e.dispose();let e=[];try{for(let t of this.props.meshes)e.push(new tr({device:this.context.device,mesh:t,outputColorSpace:`srgb`,colorAttachmentFormat:n.format,depthStencilAttachmentFormat:r.format}))}catch(t){for(let t of e)t.dispose();throw this.setState({adapters:[],attachmentKey:void 0}),t}this.setState({adapters:e,attachmentKey:i})}Hr(this.state.camera,this.context.viewport);for(let t of this.state.adapters)t.synchronize(this.state.camera),t.draw(e)}finalizeState(e){for(let e of this.state.adapters)e.dispose();super.finalizeState(e)}},Wr=class extends b{static layerName=`ThreeSceneLayer`;static defaultProps={coordinateSystem:r.CARTESIAN,pickingObjects:{type:`object`,value:[],compare:!1}};getAttributeManager(){return null}initializeState(){this.setState({pickingIndices:new Map,disabledPickingIndices:new Set})}updateState(){if(this.context.device!==this.props.adapter.device||this.props.opacity!==1||this.props.extensions.length||Object.keys(this.props.parameters||{}).length||this.props.coordinateSystem!==r.METER_OFFSETS&&(this.props.coordinateOrigin.some(e=>e!==0)||this.props.coordinateSystem!==r.CARTESIAN))throw Error(`ThreeSceneLayer requires a prepared adapter on deck's device and a Cartesian or local meter scene`);let e=new Map,t=new Set;(this.props.pickingObjects||[]).forEach((n,r)=>{if(t.has(n.id)||e.has(n.object))throw Error(`ThreeSceneLayer picking roots and IDs must be unique`);t.add(n.id),e.set(n.object,r)}),this.setState({pickingIndices:e})}setShaderModuleProps(...e){super.setShaderModuleProps(...e);for(let t of e){let e=t.picking;e?.highlightedObjectColor!==void 0&&(this.state.highlightedObjectColor=e.highlightedObjectColor),e?.highlightColor!==void 0&&(this.state.highlightColor=e.highlightColor)}}getPickingIndex(e){for(let t=e;t;t=t.parent){let e=this.state.pickingIndices.get(t);if(e!==void 0)return e}}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.pickingObjects?.[e.index]:void 0,e}disablePickingIndex(e){this.state.disabledPickingIndices.add(e)}restorePickingColors(){this.state.disabledPickingIndices.clear()}draw({renderPass:e,shaderModuleProps:t}){let n=t?.picking;if(Hr(this.props.camera,this.context.viewport,gt,this.props.coordinateSystem===r.METER_OFFSETS?[this.props.coordinateOrigin[0],this.props.coordinateOrigin[1],this.props.coordinateOrigin[2]??0]:void 0,this.props.modelMatrix),n?.isActive){let t=e=>{let t=this.getPickingIndex(e);if(t===void 0)return[0,0,0,0];if(this.state.disabledPickingIndices.has(t))return null;let n=this.encodePickingColor(t);return[n[0]/255,n[1]/255,n[2]/255,1]};n.isAttribute?this.props.adapter.drawPickingDepth(this.props.scene,this.props.camera,e,t):this.props.adapter.drawPicking(this.props.scene,this.props.camera,e,t,Br)}else if(this.state.highlightedObjectColor&&this.state.highlightColor){let t=this.state.highlightedObjectColor,n=t[0]+t[1]*256+t[2]*65536-1,r=this.state.highlightColor,i=[r[0]/255,r[1]/255,r[2]/255,(r[3]??255)/255];this.props.adapter.drawHighlighted(this.props.scene,this.props.camera,e,e=>this.getPickingIndex(e)===n?i:null)}else this.props.adapter.draw(this.props.scene,this.props.camera,e)}},Gr={CLOCKWISE:1,COUNTER_CLOCKWISE:-1};function Kr(e,t,n={}){return qr(e,n)===t?!1:(Xr(e,n),!0)}function qr(e,t={}){return Math.sign(Yr(e,t))}var Jr={x:0,y:1,z:2};function Yr(e,t={}){let{start:n=0,end:r=e.length,plane:i=`xy`}=t,a=t.size||2,o=0,s=Jr[i[0]],c=Jr[i[1]];for(let t=n,i=r-a;t<r;t+=a)o+=(e[t+s]-e[i+s])*(e[t+c]+e[i+c]),i=t;return o/2}function Xr(e,t){let{start:n=0,end:r=e.length,size:i=2}=t,a=(r-n)/i,o=Math.floor(a/2);for(let t=0;t<o;++t){let r=n+t*i,o=n+(a-1-t)*i;for(let t=0;t<i;++t){let n=e[r+t];e[r+t]=e[o+t],e[o+t]=n}}}var Zr=s(a(((e,t)=>{t.exports=n,t.exports.default=n;function n(e,t,n){n||=2;var i=t&&t.length,o=i?t[0]*n:e.length,s=r(e,0,o,n,!0),c=[];if(!s||s.next===s.prev)return c;var l,d,f,p,m,h,g;if(i&&(s=u(e,t,s,n)),e.length>80*n){l=f=e[0],d=p=e[1];for(var _=n;_<o;_+=n)m=e[_],h=e[_+1],m<l&&(l=m),h<d&&(d=h),m>f&&(f=m),h>p&&(p=h);g=Math.max(f-l,p-d),g=g===0?0:32767/g}return a(s,c,n,l,d,g,0),c}function r(e,t,n,r,i){var a,o;if(i===ie(e,t,n,r)>0)for(a=t;a<n;a+=r)o=re(a,e[a],e[a+1],o);else for(a=n-r;a>=t;a-=r)o=re(a,e[a],e[a+1],o);return o&&S(o,o.next)&&(D(o),o=o.next),o}function i(e,t){if(!e)return e;t||=e;var n=e,r;do if(r=!1,!n.steiner&&(S(n,n.next)||x(n.prev,n,n.next)===0)){if(D(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function a(e,t,n,r,u,d,f){if(e){!f&&d&&h(e,r,u,d);for(var p=e,m,g;e.prev!==e.next;){if(m=e.prev,g=e.next,d?s(e,r,u,d):o(e)){t.push(m.i/n|0),t.push(e.i/n|0),t.push(g.i/n|0),D(e),e=g.next,p=g.next;continue}if(e=g,e===p){f?f===1?(e=c(i(e),t,n),a(e,t,n,r,u,d,2)):f===2&&l(e,t,n,r,u,d):a(i(e),t,n,r,u,d,1);break}}}}function o(e){var t=e.prev,n=e,r=e.next;if(x(t,n,r)>=0)return!1;for(var i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=i<a?i<o?i:o:a<o?a:o,d=s<c?s<l?s:l:c<l?c:l,f=i>a?i>o?i:o:a>o?a:o,p=s>c?s>l?s:l:c>l?c:l,m=r.next;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&y(i,s,a,c,o,l,m.x,m.y)&&x(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function s(e,t,n,r){var i=e.prev,a=e,o=e.next;if(x(i,a,o)>=0)return!1;for(var s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=s<c?s<l?s:l:c<l?c:l,m=u<d?u<f?u:f:d<f?d:f,h=s>c?s>l?s:l:c>l?c:l,g=u>d?u>f?u:f:d>f?d:f,v=_(p,m,t,n,r),b=_(h,g,t,n,r),S=e.prevZ,C=e.nextZ;S&&S.z>=v&&C&&C.z<=b;){if(S.x>=p&&S.x<=h&&S.y>=m&&S.y<=g&&S!==i&&S!==o&&y(s,u,c,d,l,f,S.x,S.y)&&x(S.prev,S,S.next)>=0||(S=S.prevZ,C.x>=p&&C.x<=h&&C.y>=m&&C.y<=g&&C!==i&&C!==o&&y(s,u,c,d,l,f,C.x,C.y)&&x(C.prev,C,C.next)>=0))return!1;C=C.nextZ}for(;S&&S.z>=v;){if(S.x>=p&&S.x<=h&&S.y>=m&&S.y<=g&&S!==i&&S!==o&&y(s,u,c,d,l,f,S.x,S.y)&&x(S.prev,S,S.next)>=0)return!1;S=S.prevZ}for(;C&&C.z<=b;){if(C.x>=p&&C.x<=h&&C.y>=m&&C.y<=g&&C!==i&&C!==o&&y(s,u,c,d,l,f,C.x,C.y)&&x(C.prev,C,C.next)>=0)return!1;C=C.nextZ}return!0}function c(e,t,n){var r=e;do{var a=r.prev,o=r.next.next;!S(a,o)&&C(a,r,r.next,o)&&E(a,o)&&E(o,a)&&(t.push(a.i/n|0),t.push(r.i/n|0),t.push(o.i/n|0),D(r),D(r.next),r=e=o),r=r.next}while(r!==e);return i(r)}function l(e,t,n,r,o,s){var c=e;do{for(var l=c.next.next;l!==c.prev;){if(c.i!==l.i&&b(c,l)){var u=ne(c,l);c=i(c,c.next),u=i(u,u.next),a(c,t,n,r,o,s,0),a(u,t,n,r,o,s,0);return}l=l.next}c=c.next}while(c!==e)}function u(e,t,n,i){var a=[],o,s,c,l,u;for(o=0,s=t.length;o<s;o++)c=t[o]*i,l=o<s-1?t[o+1]*i:e.length,u=r(e,c,l,i,!1),u===u.next&&(u.steiner=!0),a.push(v(u));for(a.sort(d),o=0;o<a.length;o++)n=f(a[o],n);return n}function d(e,t){return e.x-t.x}function f(e,t){var n=p(e,t);if(!n)return t;var r=ne(n,e);return i(r,r.next),i(n,n.next)}function p(e,t){var n=t,r=e.x,i=e.y,a=-1/0,o;do{if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){var s=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(s<=r&&s>a&&(a=s,o=n.x<n.next.x?n:n.next,s===r))return o}n=n.next}while(n!==t);if(!o)return null;var c=o,l=o.x,u=o.y,d=1/0,f;n=o;do r>=n.x&&n.x>=l&&r!==n.x&&y(i<u?r:a,i,l,u,i<u?a:r,i,n.x,n.y)&&(f=Math.abs(i-n.y)/(r-n.x),E(n,e)&&(f<d||f===d&&(n.x>o.x||n.x===o.x&&m(o,n)))&&(o=n,d=f)),n=n.next;while(n!==c);return o}function m(e,t){return x(e.prev,e,t.prev)<0&&x(t.next,e,e.next)<0}function h(e,t,n,r){var i=e;do i.z===0&&(i.z=_(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,g(i)}function g(e){var t,n,r,i,a,o,s,c,l=1;do{for(n=e,e=null,a=null,o=0;n;){for(o++,r=n,s=0,t=0;t<l&&(s++,r=r.nextZ,r);t++);for(c=l;s>0||c>0&&r;)s!==0&&(c===0||!r||n.z<=r.z)?(i=n,n=n.nextZ,s--):(i=r,r=r.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;n=r}a.nextZ=null,l*=2}while(o>1);return e}function _(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function v(e){var t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function y(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function b(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!ee(e,t)&&(E(e,t)&&E(t,e)&&te(e,t)&&(x(e.prev,e,t.prev)||x(e,t.prev,t))||S(e,t)&&x(e.prev,e,e.next)>0&&x(t.prev,t,t.next)>0)}function x(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function S(e,t){return e.x===t.x&&e.y===t.y}function C(e,t,n,r){var i=T(x(e,t,n)),a=T(x(e,t,r)),o=T(x(n,r,e)),s=T(x(n,r,t));return!!(i!==a&&o!==s||i===0&&w(e,n,t)||a===0&&w(e,r,t)||o===0&&w(n,e,r)||s===0&&w(n,t,r))}function w(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function T(e){return e>0?1:e<0?-1:0}function ee(e,t){var n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&C(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function E(e,t){return x(e.prev,e,e.next)<0?x(e,t,e.next)>=0&&x(e,e.prev,t)>=0:x(e,t,e.prev)<0||x(e,e.next,t)<0}function te(e,t){var n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function ne(e,t){var n=new O(e.i,e.x,e.y),r=new O(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function re(e,t,n,r){var i=new O(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function D(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function O(e,t,n){this.i=e,this.x=t,this.y=n,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}n.deviation=function(e,t,n,r){var i=t&&t.length,a=i?t[0]*n:e.length,o=Math.abs(ie(e,0,a,n));if(i)for(var s=0,c=t.length;s<c;s++){var l=t[s]*n,u=s<c-1?t[s+1]*n:e.length;o-=Math.abs(ie(e,l,u,n))}var d=0;for(s=0;s<r.length;s+=3){var f=r[s]*n,p=r[s+1]*n,m=r[s+2]*n;d+=Math.abs((e[f]-e[m])*(e[p+1]-e[f+1])-(e[f]-e[p])*(e[m+1]-e[f+1]))}return o===0&&d===0?0:Math.abs((d-o)/o)};function ie(e,t,n,r){for(var i=0,a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}n.flatten=function(e){for(var t=e[0][0].length,n={vertices:[],holes:[],dimensions:t},r=0,i=0;i<e.length;i++){for(var a=0;a<e[i].length;a++)for(var o=0;o<t;o++)n.vertices.push(e[i][a][o]);i>0&&(r+=e[i-1].length,n.holes.push(r))}return n}}))(),1),Qr=Gr.CLOCKWISE,$r=Gr.COUNTER_CLOCKWISE,Q={isClosed:!0};function ei(e){if(e=e&&e.positions||e,!Array.isArray(e)&&!ArrayBuffer.isView(e))throw Error(`invalid polygon`)}function ti(e){return`positions`in e?e.positions:e}function ni(e){return`holeIndices`in e?e.holeIndices:null}function ri(e){return Array.isArray(e[0])}function ii(e){return e.length>=1&&e[0].length>=2&&Number.isFinite(e[0][0])}function ai(e){let t=e[0],n=e[e.length-1];return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]}function oi(e,t,n,r){for(let i=0;i<t;i++)if(e[n+i]!==e[r-t+i])return!1;return!0}function si(e,t,n,r,i){let a=t,o=n.length;for(let t=0;t<o;t++)for(let i=0;i<r;i++)e[a++]=n[t][i]||0;if(!ai(n))for(let t=0;t<r;t++)e[a++]=n[0][t]||0;return Q.start=t,Q.end=a,Q.size=r,Kr(e,i,Q),a}function ci(e,t,n,r,i=0,a,o){a||=n.length;let s=a-i;if(s<=0)return t;let c=t;for(let t=0;t<s;t++)e[c++]=n[i+t];if(!oi(n,r,i,a))for(let t=0;t<r;t++)e[c++]=n[i+t];return Q.start=t,Q.end=c,Q.size=r,Kr(e,o,Q),c}function li(e,t){ei(e);let n=[],r=[];if(`positions`in e){let{positions:i,holeIndices:a}=e;if(a){let e=0;for(let o=0;o<=a.length;o++)e=ci(n,e,i,t,a[o-1],a[o],o===0?Qr:$r),r.push(e);return r.pop(),{positions:n,holeIndices:r}}e=i}if(!ri(e))return ci(n,0,e,t,0,n.length,Qr),n;if(!ii(e)){let i=0;for(let[a,o]of e.entries())i=si(n,i,o,t,a===0?Qr:$r),r.push(i);return r.pop(),{positions:n,holeIndices:r}}return si(n,0,e,t,Qr),n}function ui(e,t,n){let r=e.length/3,i=0;for(let a=0;a<r;a++){let o=(a+1)%r;i+=e[a*3+t]*e[o*3+n],i-=e[o*3+t]*e[a*3+n]}return Math.abs(i/2)}function di(e,t,n,r){let i=e.length/3;for(let a=0;a<i;a++){let i=a*3,o=e[i+0],s=e[i+1],c=e[i+2];e[i+t]=o,e[i+n]=s,e[i+r]=c}}function fi(e,t,n,r){let i=ni(e);i&&=i.map(e=>e/t);let a=ti(e),o=r&&t===3;if(n){let e=a.length;a=a.slice();let r=[];for(let i=0;i<e;i+=t){r[0]=a[i],r[1]=a[i+1],o&&(r[2]=a[i+2]);let e=n(r);a[i]=e[0],a[i+1]=e[1],o&&(a[i+2]=e[2])}}if(o){let e=ui(a,0,1),t=ui(a,0,2),r=ui(a,1,2);if(!e&&!t&&!r)return[];e>t&&e>r||(t>r?(n||(a=a.slice()),di(a,0,2,1)):(n||(a=a.slice()),di(a,2,0,1)))}return(0,Zr.default)(a,i,t)}var pi=class extends E{constructor(e){let{fp64:t,IndexType:n=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:n,size:1}}})}get(e){let{attributes:t}=this;return e===`indices`?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw Error(`missing indices buffer`)}normalizeGeometry(e){if(this.normalize){let t=li(e,this.positionSize);return this.opts.resolution?ne(ti(t),ni(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?ee(ti(t),ni(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return e}getGeometrySize(e){if(mi(e)){let t=0;for(let n of e)t+=this.getGeometrySize(n);return t}return ti(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&mi(e))for(let n of e){let e=this.getGeometrySize(n);t.geometrySize=e,this.updateGeometryAttributes(n,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else{let n=e;this._updateIndices(n,t),this._updatePositions(n,t),this._updateVertexValid(n,t)}}_updateIndices(e,{geometryIndex:t,vertexStart:n,indexStart:r}){let{attributes:i,indexStarts:a,typedArrayManager:o}=this,s=i.indices;if(!s||!e)return;let c=r,l=fi(e,this.positionSize,this.opts.preproject,this.opts.full3d);s=o.allocate(s,r+l.length,{copy:!0});for(let e=0;e<l.length;e++)s[c++]=l[e]+n;a[t+1]=r+l.length,i.indices=s}_updatePositions(e,{vertexStart:t,geometrySize:n}){let{attributes:{positions:r},positionSize:i}=this;if(!r||!e)return;let a=ti(e);for(let e=t,o=0;o<n;e++,o++){let t=a[o*i],n=a[o*i+1],s=i>2?a[o*i+2]:0;r[e*3]=t,r[e*3+1]=n,r[e*3+2]=s}}_updateVertexValid(e,{vertexStart:t,geometrySize:n}){let{positionSize:r}=this,i=this.attributes.vertexValid,a=e&&ni(e);if(e&&e.edgeTypes?i.set(e.edgeTypes,t):i.fill(1,t,t+n),a)for(let e=0;e<a.length;e++)i[t+a[e]/r-1]=0;i[t+n-1]=0}};function mi(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}var hi=`struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,gi=`layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,_i={name:`solidPolygon`,source:hi,vs:gi,fs:gi,uniformTypes:{extruded:`f32`,isWireframe:`f32`,elevationScale:`f32`}},vi=`in vec4 fillColors;
in vec4 lineColors;
in float rowIndexes;
out vec4 vColor;
struct PolygonProps {
vec3 positions;
vec3 positions64Low;
vec3 normal;
float elevations;
};
vec3 project_offset_normal(vec3 vector) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
return normalize(vector * project.commonUnitsPerWorldUnit);
}
return project_normal(vector);
}
void calculatePosition(PolygonProps props) {
vec3 pos = props.positions;
vec3 pos64Low = props.positions64Low;
vec3 normal = props.normal;
vec4 colors = solidPolygon.isWireframe ? lineColors : fillColors;
geometry.worldPosition = props.positions;
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
if (solidPolygon.extruded) {
pos.z += props.elevations * solidPolygon.elevationScale;
}
gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (solidPolygon.extruded) {
#ifdef IS_SIDE_VERTEX
normal = project_offset_normal(normal);
#else
normal = project_normal(normal);
#endif
geometry.normal = normal;
vec3 lightColor = lighting_getLightColor(colors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, colors.a * layer.opacity);
} else {
vColor = vec4(colors.rgb, colors.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,yi=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${vi}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,bi=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX
in vec2 positions;
in vec3 vertexPositions;
in vec3 nextVertexPositions;
in vec3 vertexPositions64Low;
in vec3 nextVertexPositions64Low;
in float elevations;
in float instanceVertexValid;
${vi}
void main(void) {
if(instanceVertexValid < 0.5){
gl_Position = vec4(0.);
return;
}
PolygonProps props;
vec3 pos;
vec3 pos64Low;
vec3 nextPos;
vec3 nextPos64Low;
#if RING_WINDING_ORDER_CW == 1
pos = vertexPositions;
pos64Low = vertexPositions64Low;
nextPos = nextVertexPositions;
nextPos64Low = nextVertexPositions64Low;
#else
pos = nextVertexPositions;
pos64Low = nextVertexPositions64Low;
nextPos = vertexPositions;
nextPos64Low = vertexPositions64Low;
#endif
props.positions = mix(pos, nextPos, positions.x);
props.positions64Low = mix(pos64Low, nextPos64Low, positions.x);
props.normal = vec3(
pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
0.0);
props.elevations = elevations * positions.y;
calculatePosition(props);
}
`,xi=`#version 300 es
#define SHADER_NAME solid-polygon-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;function Si(){return`fn project_offset_normal(vector: vec3<f32>) -> vec3<f32> {
  if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
    return normalize(vector * project.commonUnitsPerWorldUnit);
  }
  return project_normal(vector);
}

fn apply_polygon_color(
  colors: vec4<f32>,
  normal: vec3<f32>,
  position: vec4<f32>
) -> vec4<f32> {
  if (solidPolygon.extruded > 0.5) {
    let lightColor = lighting_getLightColor2(
      colors.rgb,
      project.cameraPosition,
      position.xyz,
      normal
    );
    return vec4<f32>(lightColor, colors.a * layer.opacity);
  }
  return vec4<f32>(colors.rgb, colors.a * layer.opacity);
}
`}function Ci(){return`@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0, 0.0);

  clip_filterColor(inp.clipCoordinates);

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = inp.vColor;

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

  return deckgl_premultiplied_alpha(fragColor);
}
`}function wi(){return`\
${Si()}

struct Attributes {
  @location(0) vertexPositions: vec3<f32>,
  @location(1) vertexPositions64Low: vec3<f32>,
  @location(2) elevations: f32,
  @location(3) fillColors: vec4<f32>,
  @location(4) lineColors: vec4<f32>,
  @location(5) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) pickingColor: vec3<f32>,
  @location(2) clipCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var outp: Varyings;

  var pos = attributes.vertexPositions;
  if (solidPolygon.extruded > 0.5) {
    pos.z += attributes.elevations * solidPolygon.elevationScale;
  }

  geometry.worldPosition = attributes.vertexPositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    pos,
    attributes.vertexPositions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  outp.position = projectedPosition.clipPosition;

  let normal = project_normal(vec3<f32>(0.0, 0.0, 1.0));
  geometry.normal = normal;

  let colors = select(
    attributes.fillColors,
    attributes.lineColors,
    solidPolygon.isWireframe > 0.5
  );
  outp.vColor = apply_polygon_color(colors, normal, geometry.position);
  outp.pickingColor = geometry.pickingColor;

  outp.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&outp.position, geometry.worldPosition.xy);

  return outp;
}

${Ci()}
`}function Ti(e){return`\
const RING_WINDING_ORDER_CW: bool = ${e?`true`:`false`};

${Si()}

struct Attributes {
  @location(0) positions: vec2<f32>,
  @location(1) vertexPositions: vec3<f32>,
  @location(2) vertexPositions64Low: vec3<f32>,
  @location(3) nextVertexPositions: vec3<f32>,
  @location(4) nextVertexPositions64Low: vec3<f32>,
  @location(5) vertexValid: f32,
  @location(6) elevations: f32,
  @location(7) fillColors: vec4<f32>,
  @location(8) lineColors: vec4<f32>,
  @location(9) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) pickingColor: vec3<f32>,
  @location(2) clipCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var outp: Varyings;
  outp.position = vec4<f32>(0.0);
  outp.vColor = vec4<f32>(0.0);
  outp.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);
  outp.clipCoordinates = vec2<f32>(0.0);

  if (attributes.vertexValid < 0.5) {
    return outp;
  }

  let pos = select(attributes.nextVertexPositions, attributes.vertexPositions, RING_WINDING_ORDER_CW);
  let pos64Low = select(
    attributes.nextVertexPositions64Low,
    attributes.vertexPositions64Low,
    RING_WINDING_ORDER_CW
  );
  let nextPos = select(attributes.vertexPositions, attributes.nextVertexPositions, RING_WINDING_ORDER_CW);
  let nextPos64Low = select(
    attributes.vertexPositions64Low,
    attributes.nextVertexPositions64Low,
    RING_WINDING_ORDER_CW
  );

  let position = mix(pos, nextPos, attributes.positions.x);
  let position64Low = mix(pos64Low, nextPos64Low, attributes.positions.x);

  var worldPosition = position;
  if (solidPolygon.extruded > 0.5) {
    worldPosition.z += attributes.elevations * attributes.positions.y * solidPolygon.elevationScale;
  }

  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    worldPosition,
    position64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  outp.position = projectedPosition.clipPosition;

  let normal = project_offset_normal(vec3<f32>(
    pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
    nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
    0.0
  ));
  geometry.normal = normal;

  let colors = select(
    attributes.fillColors,
    attributes.lineColors,
    solidPolygon.isWireframe > 0.5
  );
  outp.vColor = apply_polygon_color(colors, normal, geometry.position);
  outp.pickingColor = geometry.pickingColor;

  outp.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&outp.position, geometry.worldPosition.xy);

  return outp;
}

${Ci()}
`}function Ei(e,t){return e===`top`?wi():Ti(t)}var Di=[0,0,0,255],Oi={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:`CW`,_full3d:!1,elevationScale:{type:`number`,min:0,value:1},getPolygon:{type:`accessor`,value:e=>e.polygon},getElevation:{type:`accessor`,value:1e3},getFillColor:{type:`accessor`,value:Di},getLineColor:{type:`accessor`,value:Di},material:!0},ki={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e},Ai=class extends b{getShaders(e){let t=!this.props._normalize&&this.props._windingOrder===`CCW`?0:1;return super.getShaders({vs:e===`top`?yi:bi,fs:xi,source:Ei(e,!!t),defines:{RING_WINDING_ORDER_CW:t},modules:[m,C,Cr,y,_i,...this.context.device.type===`webgpu`?[v]:[]]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds([`vertexPositions`])}initializeState(){let{viewport:e}=this.context,{coordinateSystem:t}=this.props,{_full3d:n}=this.props;e.isGeospatial&&t===`default`&&(t=`lnglat`);let r;t===`lnglat`&&(r=n?e.projectPosition.bind(e):e.projectFlat.bind(e)),this.setState({numInstances:0,polygonTesselator:new pi({preproject:r,fp64:this.use64bitPositions(),IndexType:Uint32Array})});let i=this.getAttributeManager(),a=this.context.device.type===`webgpu`;i.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{size:3,type:`float64`,stepMode:`dynamic`,fp64:this.use64bitPositions(),transition:ki,accessor:`getPolygon`,update:this.calculatePositions,noAlloc:!0,...a?{}:{shaderAttributes:{nextVertexPositions:{vertexOffset:1}}}},...a?{nextVertexPositions:{size:3,type:`float64`,stepMode:`dynamic`,fp64:this.use64bitPositions(),transition:!1,update:this.calculateNextPositions,noAlloc:!0}}:{},[a?`vertexValid`:`instanceVertexValid`]:{size:1,type:a?`float32`:`uint16`,stepMode:`instance`,update:this.calculateVertexValid,noAlloc:!0},elevations:{size:1,stepMode:`dynamic`,transition:ki,accessor:`getElevation`,bufferGroup:`solid-polygon-instance-data`},fillColors:{size:this.props.colorFormat.length,type:`unorm8`,stepMode:`dynamic`,transition:ki,accessor:`getFillColor`,defaultValue:Di,bufferGroup:`solid-polygon-instance-data`},lineColors:{size:this.props.colorFormat.length,type:`unorm8`,stepMode:`dynamic`,transition:ki,accessor:`getLineColor`,defaultValue:Di,bufferGroup:`solid-polygon-instance-data`},rowIndexes:{size:1,type:`uint32`,stepMode:`dynamic`,accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:`solid-polygon-instance-data`}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:n}=t,r=this.props.data;return r[0]&&r[0].__source&&(t.object=r.find(e=>e.__source.index===n)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let n=0;n<t.length;n++)t[n].__source.index===e&&this._disablePickingIndex(n);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:n,wireframe:r,elevationScale:i}=this.props,{topModel:a,sideModel:o,wireframeModel:s,polygonTesselator:c}=this.state,l={extruded:!!t,elevationScale:i,isWireframe:!1};s&&r&&(s.setInstanceCount(c.instanceCount-1),s.shaderInputs.setProps({solidPolygon:{...l,isWireframe:!0}}),s.draw(this.context.renderPass)),o&&n&&(o.setInstanceCount(c.instanceCount-1),o.shaderInputs.setProps({solidPolygon:l}),o.draw(this.context.renderPass)),a&&n&&(a.setVertexCount(c.vertexCount),a.shaderInputs.setProps({solidPolygon:l}),a.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:n,changeFlags:r}=e,i=this.getAttributeManager();(r.extensionsChanged||t.filled!==n.filled||t.extruded!==n.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),i.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:n}){if(n.dataChanged||n.updateTriggersChanged&&(n.updateTriggersChanged.all||n.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,r=e.data.attributes||{};t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:r.getPolygon,buffers:this.context.device.type===`webgpu`?{...r}:r,getGeometry:e.getPolygon,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:n.dataChanged,full3d:e._full3d}),this.setState({numInstances:t.instanceCount,startIndices:t.vertexStarts}),n.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){let{id:e,filled:t,extruded:n}=this.props,r,i,a;if(t){let t=this.getShaders(`top`);t.defines={...t.defines,NON_INSTANCED_MODEL:1};let n=this.getAttributeManager().getBufferLayouts({isInstanced:!1});this.context.device.type===`webgpu`&&(n=n.filter(e=>e.name!==`indices`&&e.name!==`vertexValid`&&e.name!==`instanceVertexValid`&&e.name!==`nextVertexPositions`)),r=new Dt(this.context.device,{...t,id:`${e}-top`,topology:`triangle-list`,bufferLayout:n,isIndexed:!0,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(n){let t=this.getAttributeManager().getBufferLayouts({isInstanced:!0});this.context.device.type===`webgpu`&&(t=t.filter(e=>e.name!==`indices`)),i=new Dt(this.context.device,{...this.getShaders(`side`),id:`${e}-side`,bufferLayout:t,geometry:new tt({topology:`triangle-strip`,attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),a=new Dt(this.context.device,{...this.getShaders(`side`),id:`${e}-wireframe`,bufferLayout:t,geometry:new tt({topology:`line-strip`,attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[i,a,r].filter(Boolean),topModel:r,sideModel:i,wireframeModel:a}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get(`indices`)}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts;let n=this.props.data.attributes?.getPolygon;if(this.context.device.type===`webgpu`&&ArrayBuffer.isView(n?.value)){let{value:r,size:i=3,offset:a=0,stride:o}=n,s=a/r.BYTES_PER_ELEMENT,c=o?o/r.BYTES_PER_ELEMENT:i,l=new Float64Array(t.instanceCount*3);for(let e=0;e<t.instanceCount;e++){let t=s+e*c,n=e*3;l[n]=r[t],l[n+1]=r[t+1],l[n+2]=i>2?r[t+2]:0}e.value=l;return}e.value=t.get(`positions`)}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,n=this.context.device.type===`webgpu`&&t?t:this.state.polygonTesselator.get(`vertexValid`);e.value=this.context.device.type===`webgpu`&&n?Float32Array.from(n):n}calculateNextPositions(e){let{polygonTesselator:t}=this.state,n=this.getAttributeManager().getAttributes(),r=n.vertexPositions.value,i=this.props.data.attributes?.instanceVertexValid?.value||n.vertexValid?.value||t.get(`vertexValid`);if(e.startIndices=t.vertexStarts,!r){e.value=r;return}let a=r.length/3,o=new r.constructor(r.length);for(let e=0;e<a;e++){let t=e*3,n=i?.[e]&&e+1<a?t+3:t;for(let e=0;e<3;e++)o[t+e]=r[n+e]}e.value=o}};Ai.defaultProps=Oi,Ai.layerName=`SolidPolygonLayer`;function ji({data:e,getIndex:t,dataRange:n,replace:r}){let{startRow:i=0,endRow:a=1/0}=n,o=e.length,s=o,c=o;for(let n=0;n<o;n++){let r=t(e[n]);if(s>n&&r>=i&&(s=n),r>=a){c=n;break}}let l=s,u=c-s===r.length?void 0:e.slice(c);for(let t=0;t<r.length;t++)e[l++]=r[t];if(u){for(let t=0;t<u.length;t++)e[l++]=u[t];e.length=l}return{startRow:s,endRow:s+r.length}}var Mi=[0,0,0,255],Ni={stroked:!0,filled:!0,extruded:!1,elevationScale:1,wireframe:!1,_normalize:!0,_windingOrder:`CW`,lineWidthUnits:`meters`,lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:2**53-1,lineJointRounded:!1,lineMiterLimit:4,lineAntialiasing:!1,getPolygon:{type:`accessor`,value:e=>e.polygon},getFillColor:{type:`accessor`,value:[0,0,0,255]},getLineColor:{type:`accessor`,value:Mi},getLineWidth:{type:`accessor`,value:1},getElevation:{type:`accessor`,value:1e3},material:!0},Pi=class extends Tr{initializeState(){this.state={paths:[],pathsDiff:null},this.props.getLineDashArray&&i.removed(`getLineDashArray`,`PathStyleExtension`)()}updateState({changeFlags:e}){let t=e.dataChanged||e.updateTriggersChanged&&(e.updateTriggersChanged.all||e.updateTriggersChanged.getPolygon);if(t&&Array.isArray(e.dataChanged)){let t=this.state.paths.slice(),n=e.dataChanged.map(e=>ji({data:t,getIndex:e=>e.__source.index,dataRange:e,replace:this._getPaths(e)}));this.setState({paths:t,pathsDiff:n})}else t&&this.setState({paths:this._getPaths(),pathsDiff:null})}_getPaths(e={}){let{data:t,getPolygon:n,positionFormat:r,_normalize:i}=this.props,a=[],o=r===`XY`?2:3,{startRow:s,endRow:c}=e,{iterable:l,objectInfo:u}=w(t,s,c);for(let e of l){u.index++;let t=n(e,u);i&&(t=li(t,o));let{holeIndices:r}=t,s=t.positions||t;if(r)for(let t=0;t<=r.length;t++){let n=s.slice(r[t-1]||0,r[t]||s.length);a.push(this.getSubLayerRow({path:n},e,u.index))}else a.push(this.getSubLayerRow({path:s},e,u.index))}return a}renderLayers(){let{data:e,_dataDiff:t,stroked:n,filled:r,extruded:i,wireframe:a,_normalize:o,_windingOrder:s,elevationScale:c,transitions:l,positionFormat:u}=this.props,{lineWidthUnits:d,lineWidthScale:f,lineWidthMinPixels:p,lineWidthMaxPixels:m,lineJointRounded:h,lineMiterLimit:g,lineAntialiasing:_,lineDashJustified:v}=this.props,{getFillColor:y,getLineColor:b,getLineWidth:x,getLineDashArray:S,getElevation:C,getPolygon:w,updateTriggers:T,material:ee}=this.props,{paths:E,pathsDiff:te}=this.state,ne=this.getSubLayerClass(`fill`,Ai),re=this.getSubLayerClass(`stroke`,D),O=this.shouldRenderSubLayer(`fill`,E)&&new ne({_dataDiff:t,extruded:i,elevationScale:c,filled:r,wireframe:a,_normalize:o,_windingOrder:s,getElevation:C,getFillColor:y,getLineColor:i&&a?b:Mi,material:ee,transitions:l},this.getSubLayerProps({id:`fill`,updateTriggers:T&&{getPolygon:T.getPolygon,getElevation:T.getElevation,getFillColor:T.getFillColor,lineColors:i&&a,getLineColor:T.getLineColor}}),{data:e,positionFormat:u,getPolygon:w}),ie=!i&&n&&this.shouldRenderSubLayer(`stroke`,E)&&new re({_dataDiff:te&&(()=>te),widthUnits:d,widthScale:f,widthMinPixels:p,widthMaxPixels:m,jointRounded:h,miterLimit:g,antialiasing:_,dashJustified:v,_pathType:`loop`,transitions:l&&{getWidth:l.getLineWidth,getColor:l.getLineColor,getPath:l.getPolygon},getColor:this.getSubLayerAccessor(b),getWidth:this.getSubLayerAccessor(x),getDashArray:this.getSubLayerAccessor(S)},this.getSubLayerProps({id:`stroke`,updateTriggers:T&&{getWidth:T.getLineWidth,getColor:T.getLineColor,getDashArray:T.getLineDashArray}}),{data:E,positionFormat:u,getPath:e=>e.path});return[!i&&O,ie,i&&O]}};Pi.layerName=`PolygonLayer`,Pi.defaultProps=Ni;var $=-1.4;function Fi(e){let t=new Me(e.rings[0].map(e=>new mt(e[0],e[1])));for(let n of e.rings.slice(1))t.holes.push(new ye(n.map(e=>new mt(e[0],e[1]))));let n=new j({color:new M().setRGB(e.color[0]/255,e.color[1]/255,e.color[2]/255,`srgb`),side:2}),r=new P(new se(t),n);return r.position.z=e.rings[0][0][2],r}async function Ii(e){let t=await Jn(e);t.scene.background=new M(0,0,0),t.ground.material.color.setHex(2307392);let n=new I;for(let e of t.scene.children.slice())n.add(e);n.rotation.x=Math.PI/2,t.scene.add(n),t.scene.environmentRotation.x=Math.PI/2;let r=n.children.find(e=>e!==t.ground&&e!==t.light);r.position.y+=.2;let i=new P(new he(1.1,1.2,.2,64),new N({color:1455165,metalness:.5,roughness:.4}));i.position.y=-1.3,i.castShadow=i.receiveShadow=!0,n.add(i),t.light.shadow.autoUpdate=!1,t.light.shadow.needsUpdate=!0;let a=[];for(let e=-7;e<=7;e++)for(let t=-7;t<=7;t++){let n=t*.5,r=e*.5;if(Math.abs(n)<1.8&&Math.abs(r)<1.8)continue;let i=.235,o=$+.015;a.push({rings:[[[n-i,r-i,o],[n+i,r-i,o],[n+i,r+i,o],[n-i,r+i,o]]],color:(e+t)%2==0?[30,53,64,255]:[40,65,75,255]})}for(let e of[1.28,1.5,2.7,3.65]){let t=[e+.014,e-.014].map(e=>Array.from({length:129},(t,n)=>{let r=n/128*Math.PI*2;return[Math.cos(r)*e,Math.sin(r)*e,$+.03]}));t[1].reverse(),a.push({rings:t,color:e<2?[229,175,77,255]:[40,175,175,255]})}let o=Array.from({length:16},(e,t)=>{let n=t/16*Math.PI*2;return{id:t,position:[Math.cos(n)*3.05,Math.sin(n)*3.05,$],elevation:.5,color:t%4==0?[229,175,77,255]:[47,163,177,255]}}),s=new I;for(let e of a)s.add(Fi(e));let c=o.map(e=>{let t=new he(.16,.16,1,6);t.rotateX(Math.PI/2),t.rotateZ(Math.PI/2);let n=new P(t,new j({color:new M().setRGB(e.color[0]/255,e.color[1]/255,e.color[2]/255,`srgb`)}));return s.add(n),n}),l=o.map(e=>{let t=new P(new le(.045,256),new j({color:16770732,side:2}));return t.position.set(e.position[0],e.position[1],$+.035),s.add(t),t});function u(e){o.forEach((t,n)=>{t.elevation=.25+1.1*(.5+.5*Math.sin(e*.7+n*.65)),c[n].position.set(t.position[0],t.position[1],$+t.elevation/2),c[n].scale.z=t.elevation})}u(0);let d=!1;return{...t,polygons:a,stations:o,markers:l,referenceContext:s,update:u,dispose(){d||(d=!0,s.traverse(e=>{e instanceof P&&(e.geometry.dispose(),e.material.dispose())}),i.geometry.dispose(),i.material.dispose(),t.dispose())}}}function Li(e,t,{reverseOrder:n=!1,context:i=!0}={}){let a=new Wr({id:`lantern-pbr`,scene:e.scene,camera:e.camera,adapter:t}),o={depthWriteEnabled:!0,depthCompare:`less-equal`},s=i?[new Pi({id:`courtyard-tiles-and-rings`,data:e.polygons,coordinateSystem:r.CARTESIAN,getPolygon:e=>e.rings,getFillColor:e=>e.color,stroked:!1,filled:!0,parameters:o,getPolygonOffset:()=>[0,0]}),new Pi({id:`courtyard-data-stations`,data:e.stations.map(e=>({...e})),coordinateSystem:r.CARTESIAN,getPolygon:e=>Array.from({length:6},(t,n)=>{let r=n/6*Math.PI*2;return[e.position[0]+Math.cos(r)*.16,e.position[1]+Math.sin(r)*.16,e.position[2]]}),getElevation:e=>e.elevation,getFillColor:e=>e.color,stroked:!1,material:{ambient:1,diffuse:0,shininess:0,specularColor:[0,0,0]},extruded:!0,parameters:o,pickable:!0,getPolygonOffset:()=>[0,0]}),new S({id:`courtyard-beacons`,data:e.stations,coordinateSystem:r.CARTESIAN,getPosition:e=>[e.position[0],e.position[1],$+.035],getRadius:.045,radiusUnits:`common`,getFillColor:[255,230,172,255],antialiasing:!1,billboard:!1,parameters:o,getPolygonOffset:()=>[0,0]})]:[];return n?[...s,a]:[a,...s]}export{Wr as a,rr as c,Jn as d,Xt as f,Ur as i,Zn as l,Ii as n,Hr as o,Pi as r,zr as s,Li as t,Yn as u};