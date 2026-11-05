import{A as e,B as t,H as n,Jt as r,Lt as i,O as a,Rt as o,S as s,Tt as c,Y as l,Zt as u,_ as d,at as f,c as p,d as m,f as h,gn as g,i as _,it as v,l as y,ln as b,o as x,p as ee,q as te,r as S,s as C,t as ne,tt as re,u as ie,un as ae,v as oe,vn as se,w as ce,x as le,y as ue}from"./model-Cn3ZhxKf.js";import{_ as w,g as de,m as T,o as fe,r as pe}from"./render-pipeline-BlTz4W4u.js";import{d as me,u as he}from"./buffer-layout-utils-C8lGbEpo.js";import{n as ge,r as _e,t as E}from"./texture-Cr6a0-3D.js";import{u as D}from"./wgsl-binding-scan-UOkSB9Qm.js";import{A as ve,O as ye,a as be,c as xe,i as Se,j as O,n as Ce,r as we,t as Te}from"./gpu-vector-chunks-jU0_QPy4.js";import{D as k,E as Ee,M as De,O as Oe,S as ke,_ as Ae,a as je,b as Me,d as Ne,f as Pe,h as Fe,i as Ie,j as Le,k as Re,m as ze,n as Be,o as Ve,s as He,v as Ue,w as We,y as Ge}from"./three.tsl-D9hOAccn.js";import{t as Ke}from"./wgsl-shader-assembler-dNYiC-av.js";import{n as qe,t as Je}from"./interop-Dg_KvpvE.js";var Ye={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function Xe(e){return e?Array.isArray(e)?e[0]??null:e:null}function Ze(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=Xe(n);if(!e)return null;let{width:t}=Qe(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=Xe(n);return e?Qe(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=Xe(n[0]);return e?Qe(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=Xe(t);return r?Qe(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=Xe(e[t]);return r?Qe(r):null}default:return null}}function Qe(e){if(me(e))return he(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function $e(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function et(e){return ArrayBuffer.isView(e)}function tt(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function nt(e){let t=Ye[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function rt(e,t){return 6*e+nt(t)}function it(e){throw Error(`setTexture1DData not supported in WebGL.`)}function at(e){return Array.isArray(e)?e:[e]}function ot(e,t,n,r){let i=at(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(me(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if($e(t))o.push({type:`texture-data`,data:t,textureFormat:tt(t),z:a,mipLevel:e});else if(et(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function st(e){let t=[];for(let n=0;n<e.length;n++)t.push(...ot(n,e[n]));return t}function ct(e){let t=[];for(let n=0;n<e.length;n++)t.push(...ot(n,e[n]));return t}function lt(e){let t=[];for(let[n,r]of Object.entries(e)){let e=nt(n);t.push(...ot(e,r))}return t}function ut(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=rt(n,r);t.push(...ot(e,i))}}),t}var dt=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=de(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?ft({...t,width:e.width,height:e.height,format:e.format}):[],r=`format`in e&&e.format!==void 0,i=`usage`in e&&e.usage!==void 0,a=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:Ze(t)||{width:this.props.width||1,height:this.props.height||1};if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let o=pt(this.device,n,a,{format:r?e.format:void 0}),s=o.format??this.props.format,c={...this.props,...a,format:s,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(s)&&!i&&(c.usage=E.SAMPLE|E.COPY_DST);let l=this.props.mipmaps&&!o.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(s);if(this.device.type===`webgpu`&&l){let e=this.props.dimension===`3d`?E.SAMPLE|E.STORAGE|E.COPY_DST|E.COPY_SRC:E.SAMPLE|E.RENDER|E.COPY_DST|E.COPY_SRC;c.usage|=e}let u=this.device.getMipLevelCount(c.width,c.height),d=o.hasExplicitMipChain?o.mipLevels:this.props.mipLevels===`auto`?u:Math.max(1,Math.min(u,this.props.mipLevels??1)),f={...c,mipLevels:d};this._texture=this.device.createTexture(f),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),o.subresources.length&&this._setTextureSubresources(o.subresources),this.props.mipmaps&&!o.hasExplicitMipChain&&!l&&w.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),l&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),w.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):w.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof ge?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:T.COPY_DST|T.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let o=this.device.createFence();return await o.signaled,o.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),w.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=Ye[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=it(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=ot(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=st(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=ct(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=lt(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=ut(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await _t(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&w.warn(`${this} already destroyed`)}_checkReady(){this.isReady||w.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...E.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function ft(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return it(e.data);case`2d`:return ot(0,e.data,t,n);case`3d`:return st(e.data);case`2d-array`:return ct(e.data);case`cube`:return lt(e.data);case`cube-array`:return ut(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function pt(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=ht(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=mt(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?gt(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=ht(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=mt(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function mt(e){if(e.type===`texture-data`)return e.textureFormat??tt(e.data)}function ht(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function gt(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function _t(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(_t));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(_t)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}var vt=`struct VertexInputs {
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
`,yt=`#version 300 es
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
`,bt=[-1,-1,1,-1,-1,1,1,1],xt=[-1,-1,3,-1,-1,3],St=class extends ne{constructor(e,t){let{geometryType:n=`quad`,...r}=t,i=n===`triangle`?xt:bt,a=i.map(e=>(e+1)/2),o=i.length/2;r.source&&=`${vt}\n${r.source}`,super(e,{id:r.id||x(`clip-space`),...r,vs:yt,vertexCount:o,geometry:new h({topology:n===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:o,attributes:{clipSpacePositions:{size:2,value:new Float32Array(i)},texCoords:{size:2,value:new Float32Array(a)},coordinates:{size:2,value:new Float32Array(a)}}})})}},Ct={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},wt=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
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
`,Tt=`#version 300 es
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
`,Et=class extends St{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:wt,fs:Tt,modules:[...t.modules||[],Ct],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof dt?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:this.flipY?1:0}})}},Dt=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},Ot=class extends Dt{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:E.SAMPLE|E.RENDER|E.COPY_SRC|E.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:E.SAMPLE|E.RENDER|E.COPY_SRC|E.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),kt(this.current),t.destroy(),this.next=n.clone(e),kt(this.next),n.destroy(),!0}};function kt(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}var At=2,jt=1e4,Mt=class e{static async createAsync(t,n){let r=!O.getAsyncCompilation(t),i=r?O.beginAsyncCompilation(t):O.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&O.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}static defaultProps={...D.defaultProps,id:`unnamed`,handle:void 0,userData:{},source:``,sourceLanguage:void 0,modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:void 0,debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate=`newly created`;_getModuleUniforms;props;_destroyed=!1;_pipelineInitialization;constructor(t,n){if(t.type!==`webgpu`)throw Error(`Computation is only supported in WebGPU`);this.props={...e.defaultProps,...n,shaderAssembler:n.shaderAssembler??e.defaultProps.shaderAssembler??new Ke},n=this.props,this.id=n.id||x(`model`),this.device=t,Object.assign(this.userData,n.userData);let r=xe(t),i=m(this.props.plugins,r.shaderLanguage);if(i.injectionTargets.length>0)throw Error(`Computation does not support ShaderPlugin render hooks`);if(Object.keys(i.vertexInputs).length>0||Object.keys(i.interStageVariables).length>0)throw Error(`Computation does not support ShaderPlugin vertex inputs or interStageVariables`);let a=ie(this.props.modules,i.modules),o=Object.fromEntries(a.map(e=>[e.name,e]));this.shaderInputs=n.shaderInputs||new S(o),n.shaderInputs&&i.modules.length>0&&this.shaderInputs.addModules(i.modules),this.setShaderInputs(this.shaderInputs);let s=p(this.props.modules,this.shaderInputs?.getModules()),c={...i.defines,...this.props.defines};this.props.shaderLayout=C(this.props.shaderLayout,s)||null,this.pipelineFactory=n.pipelineFactory||O.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||ve.getDefaultShaderFactory(this.device);let l=this.props.shaderAssembler;pe(l instanceof Ke);let{source:u,getUniforms:d,entryPoints:f={},shaderLayout:h}=l.assembleWGSLShader({platformInfo:r,...this.props,modules:s,defines:c,shaderStage:`compute`,computeEntryPoint:this.props.entryPoint,scanVertexAttributes:!1,pluginInjections:i.injections});this.source=u,this.props.entryPoint=f.compute||this.props.entryPoint,this._getModuleUniforms=d;let g=h??t.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=C(this.props.shaderLayout||g||null,s)||null;let _=O.getAsyncCompilation(this.device);_?(this._pipelineInitialization=this._updatePipelineAsync(),_.push(this._pipelineInitialization)):this.pipeline=this._updatePipeline(),n.bindings&&this.setBindings(n.bindings)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shader&&this.shaderFactory.release(this.shader),this._uniformStore.destroy(),!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new g(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(y(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(e=>{let n=t[e];return!_(n)}),r={};for(let e of n)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){let e=this._preparePipelineUpdate();return e&&(this.pipeline=this.pipelineFactory.createComputePipeline(e.props),this._finishPipelineUpdate(e.previousShader)),this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createComputePipelineAsync(e.props)}catch(t){throw this.shaderFactory.release(this.shader),this.shader=e.previousShader,this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e.previousShader)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?this.shader:null;return this.pipeline&&w.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`compute`,source:this.source,debugShaders:this.props.debugShaders}),{props:{...this.props,shader:this.shader},previousShader:e}}_finishPipelineUpdate(e){e&&this.shaderFactory.release(e)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=w.level>3?0:jt;w.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,w.group(At,`>>> DRAWING MODEL ${this.id}`,{collapsed:w.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();w.table(At,e)(),w.groupEnd(At)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let n=fe.getTypedArrayConstructor(t);return(e instanceof T?new n(e.debugData):e).toString()}};function Nt(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?Pt(e):It(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?Ft(n):Lt(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function Pt(e){return`\
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
`}function Ft(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function It(e){return`\
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
`}function Lt(e){return`\
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
`}var Rt={name:`textureTransform`,source:`
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
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},zt=new Set([`original`,`previous`]),Bt=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(e,t){this.device=e;let n=Wt(t.shaderPasses);n.map(e=>ye(e));let r=n.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=t.shaderInputs||new S(r);let i=e.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new Ot(e,{colorAttachments:[t.colorFormat||e.preferredColorFormat],width:i[0],height:i[1]}),this.textureModel=new Et(e,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:t.flipY??e.type===`webgpu`});let a=t.flipY??e.type===`webgpu`;this.passRenderers=t.shaderPasses.map(t=>new Vt(e,t,this.shaderInputs,a))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);if(!n)return!1;let r=this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:n}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});return this.textureModel.draw(i),i.end(),!0}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof dt&&!n.isReady)return null;let r=n instanceof dt?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=dn(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=ln(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?un(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=ln(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=Zt(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:fn(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},Vt=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,Gt(t)){Jt(t.name,t.renderTargets||{}),this.renderTargets=Qt(e,t.renderTargets||{}),Kt(e,t)&&(this.computeRenderer=new Ht(e,t.compute,this.renderTargets,n)),this.subPassExecutions=(this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps).flatMap(e=>this.createStepExecutions(t,e,r));return}qt(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();tn(this.renderTargets)}resize(e){nn(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=sn(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=on(t),n=sn(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return qt(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return Yt(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new Ut(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:Xt(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?on(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},Ht=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,t,n,r){this.optimization=t,this.renderTargets=n,this.shaderInputs=r,this.parameterBuffer=e.createBuffer({id:`${t.name}-parameters`,byteLength:Math.max(Math.ceil(t.uniformNames.length/4)*16,16),usage:T.UNIFORM|T.COPY_DST});let i=Object.entries(t.outputs).map(([e,t],r)=>({name:e,type:`storage`,group:0,location:r+2,access:`write-only`,format:n[t].texture.format}));try{this.computation=new Mt(e,{id:t.name,source:t.source,shaderLayout:{bindings:[{name:t.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...i]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},Ut=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=Nt({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new St(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[Rt,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:this.flipY?1:0}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function Wt(e){return e.flatMap(e=>Gt(e)?e.steps.map(e=>e.shaderPass):[e])}function Gt(e){return`steps`in e}function Kt(e,t){let n=t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function qt(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use CompositeShaderPass.renderTargets instead`)}function Jt(e,t){for(let n of Object.keys(t))if(zt.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function Yt(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function Xt(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function Zt(e,t,n){return Xt(Xt(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function Qt(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=cn(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!$t(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!en(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=rn(e,i,a,n)}return r}function $t(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function en(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function tn(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function nn(e,t,n){for(let r of new Set(Object.values(t))){let t=cn(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=rn(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function rn(e,t,n,r){let i=cn(r,n.scale),{texture:a,framebuffer:o}=an(e,t,n,i),s,c;if(n.lifetime===`history`){let r=an(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function an(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:E.SAMPLE|E.RENDER|E.COPY_SRC|E.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?E.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function on(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function sn(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function cn(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function ln(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function un(e,t){return t===e.current?e.next:e.current}function dn(e,t){return ln(e.current)===t?e.next:e.current}function fn(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}function pn(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function mn(e,t){for(let n of t)pn(e,n)}async function hn(e,t){if(e.destroyed)throw Error(`Resource has been destroyed.`);if(e instanceof T){if(!(e.usage&T.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);let n=t.byteOffset??0,r=Math.min(256,t.byteLength??e.byteLength-n);if(n<0||r<0||n+r>e.byteLength)throw Error(`Preview range is outside the buffer.`);return{data:r?await e.readAsync(n,r):new Uint8Array,format:t.format}}let n=e.device.getTextureFormatInfo(e.format);if(n.packed)throw Error(`Packed texture previews are not supported.`);if(e.device.type!==`webgpu`)throw Error(`Texture previews require WebGPU.`);if(!((e.props.usage??0)&E.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);if(e.samples!==1||n.compressed||e.format.startsWith(`depth`)||e.format.startsWith(`stencil`))throw Error(`Preview requires a single-sample, uncompressed color texture.`);let r=t.baseMipLevel??0,i=Math.min(32,t.width??Math.max(1,e.width>>r)),a=Math.min(32,t.height??Math.max(1,e.height>>r)),o=e.computeMemoryLayout({width:i,height:a,depthOrArrayLayers:1}),s=e.device.createBuffer({byteLength:o.byteLength,usage:T.MAP_READ|T.COPY_DST}),c=e.device.createCommandEncoder();try{c.copyTextureToBuffer({sourceTexture:e,destinationBuffer:s,mipLevel:r,origin:[0,0,t.baseArrayLayer??0],width:i,height:a,depthOrArrayLayers:1,bytesPerRow:o.bytesPerRow}),e.device.submit(c.finish());let l=await s.readAsync(),u=i*n.bytesPerPixel,d=new Uint8Array(u*a);for(let e=0;e<a;e++)d.set(l.subarray(e*o.bytesPerRow,e*o.bytesPerRow+u),e*u);return{data:d,width:i,height:a,format:e.format}}finally{s.destroy(),c.destroy()}}var gn=class{values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function _n(e){let t=Mn(e.nodes),n=Ln(t,e.buffers.values()),r=Rn(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return yn(e,t,o,i,a,n,r)}async function vn(e){let t=Mn(e.nodes),n=Ln(t,e.buffers.values()),r=Rn(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=O.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));O.endAsyncCompilation(e.device,o);let[c,l]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),u=[],d=l.find(e=>e.status===`rejected`),f=d?.status===`rejected`?d.reason:void 0;for(let e of c)e.status===`fulfilled`?u.push(e.value):f??=e.reason;if(f){for(let e of u)e.executable.destroy?.();throw f}return yn(e,t,u,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function yn(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=Wn(c.map(e=>e.byteLength),`imported buffer capacities`),d=Wn(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=Un(u,d,`logical buffer capacities`),p=Wn(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=Wn(g.map(Hn),`imported texture estimates`),y=Wn(_.map(Hn),`logical transient texture estimates`),b=Un(v,y,`logical texture estimates`),x=Wn(o.map(e=>e.byteLength),`physical transient texture estimates`),ee=Math.max(0,y-x),te={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:ee,textureReusePercentage:y>0?ee/y*100:0,logicalResourceBytes:Un(f,b,`logical resource estimates`),physicalTransientResourceBytes:Un(p,x,`physical transient resource estimates`)},S=xn(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:te,preflight:S}}function bn(e){if(`buffer`in e){let t=e.buffer,n=`buffer`in t?t:void 0;return Object.freeze({id:n?n.buffer.id:t.id,kind:`buffer`,usage:e.usage,byteOffset:n?.byteOffset??0,byteLength:n?n.length===0?0:(n.length-1)*n.byteStride+n.rowByteLength:t.byteLength,...n?{format:n.format,length:n.length}:{}})}let t=`texture`in e?e.texture:e.externalTexture;return Object.freeze({id:`texture`in t?t.texture.id:t.id,kind:`externalTexture`in e?`external-texture`:`texture`,usage:e.usage,width:t.width,height:t.height,...`texture`in t?{baseMipLevel:t.baseMipLevel,baseArrayLayer:t.baseArrayLayer,mipLevelCount:t.mipLevelCount,arrayLayerCount:t.arrayLayerCount,aspect:t.aspect}:{},...`format`in t?{format:t.format,depth:t.depth}:{}})}function xn(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,...e.description===void 0?{}:{description:e.description},type:e.type,resources:Object.freeze((e.resources??[]).map(bn)),...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])Cn(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,En(n.buffer).size));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?Un(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function A(e){return`buffer`in e?e.buffer:e}function Sn(e){return`texture`in e?e.texture:e}function Cn(e){return`buffer`in e}function wn(e){return`texture`in e}function Tn(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>Cn(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||A(r.buffer)!==A(n.buffer)||!kn(r.usage)&&!kn(n.usage))continue;let a=En(r.buffer),o=En(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=A(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${Dn(a)} and ${Dn(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function En(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function Dn(e){return`${e.offset}–${e.offset+e.size} bytes`}function On(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function kn(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function An(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function jn(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function Mn(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(Cn(t)){let n=A(t.buffer);if(On(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(kn(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(wn(t)){let n=Sn(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&Nn(n.resource,t)&&(An(t.usage)&&jn(n.resource.usage)||jn(t.usage)&&(An(n.resource.usage)||jn(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function Nn(e,t){if(Sn(e.texture)!==Sn(t.texture))return!1;let n=Pn(e.texture),r=Pn(t.texture);return Fn(n.aspect,r.aspect)&&In(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&In(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function Pn(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function Fn(e,t){return e===`all`||t===`all`||e===t}function In(e,t,n,r){return e<n+r&&n<e+t}function Ln(e,t){let n=zn(e,e=>Cn(e)?A(e.buffer):null),r=new Map;e.forEach((e,t)=>{if(!e.retainedBuffers?.length)return;let n=r.get(e.retainedBuffers);n?n.lastUse=t:r.set(e.retainedBuffers,{firstUse:t,lastUse:t})});for(let[e,t]of r)for(let r of e){if(!r.transient)continue;let e=n.get(r);n.set(r,{firstUse:Math.min(e?.firstUse??t.firstUse,t.firstUse),lastUse:Math.max(e?.lastUse??t.lastUse,t.lastUse)})}let i=[],a=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),o=new gn((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),s=new Map,c=e=>{let t=e&(T.MAP_READ|T.MAP_WRITE),n=s.get(t);return n||(n=new gn((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index),s.set(t,n)),n};for(let{buffer:e,lifetime:t}of a){if(!t)continue;for(;o.peek()&&o.peek().allocation.lastUse<t.firstUse;){let e=o.pop();c(e.allocation.usage).push(e)}let n=c(e.usage).pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:i.length},i.push(n.allocation));let{allocation:r}=n;r.byteLength=Math.max(r.byteLength,e.byteLength),r.usage|=e.usage,r.lastUse=t.lastUse,r.handles.push(e),o.push(n)}return i}function Rn(e,t){let n=zn(e,e=>wn(e)?Sn(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&Vn(n.descriptor,e));n||(n={descriptor:Bn(e),byteLength:Hn(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function zn(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function Bn(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function Vn(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function Hn(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=Un(t,_e.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function Un(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function Wn(e,t){return e.reduce((e,n)=>Un(e,n,t),0)}var Gn=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},Kn=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},qn=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=Te(this.data)}},Jn=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},Yn=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},Xn=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}},Zn=4,Qn=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){ir(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function $n(e,t,n={}){ir(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=er();for(;s<a.length;){let r=tr(n,a[s]);if(s>e&&nr(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||rr(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:nr(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>tr(e,t),er());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function er(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function tr(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function nr(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function rr(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function ir(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function ar(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var or=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i,a){this.readResource=a,this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let o=e.filter(e=>e.stats.condition?.outcome!==`skipped`),s=o.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:o.length,skippedNodeCount:e.length-o.length,computePassCount:n,coalescedComputeNodeCount:s-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},sr=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);gr(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),vr(e,this.device),t&&Cr(t,e,this.device);let n=this.addBuffer(new Gn(this,e,!1,t));if(t){let e=lr(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof be&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),vr(e,this.device),this.addBuffer(new Gn(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=Ce(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return Sr(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new Kn(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(Se(n)||we(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=Ce(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new qn({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=br(e,this.device);return t&&wr(t,n,this.device),this.addTexture(new Jn(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=br(e,this.device);return this.addTexture(new Jn(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),yr(e,this.device),this.addExternalTexture(new Yn(this,e))}createTransientTexture(e){this.assertMutable();let t=br(e,this.device);return this.addTexture(new Jn(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new Xn(e,xr(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)mn(this,e.getCommandNodes(this));else if(`type`in e)pn(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),gr(this.device,`compilation`),this.compiled=!0,new cr(_n({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}async compileAsync(){return this.assertMutable(),gr(this.device,`compilation`),this.compiled=!0,new cr(await vn({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*Zn>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>Cn(e)&&A(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(Cn(t)){let e=A(t.buffer);this.assertBuffer(e),Er(e,t.usage)}else if(wn(t)){let e=Sn(t.texture);this.assertTexture(e),Dr(e,t.usage),Or(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}Tn(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=lr(t.buffer),r={byteLength:ur(t),usage:n.usage},i=t.buffer instanceof be?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof be?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&dr(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&dr(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&lr(n.defaultBuffer)===e&&dr(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&dr(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&dr(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},cr=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(Cn(t)){let e=A(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(wn(t)){let e=Sn(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=hr(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return $n(this.preflight,e,t)}createExecution(e,t={}){return new Qn({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(gr(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=_r(),a=this.resolveImportedBuffers(t.buffers??{});pr(t.frameTextures??{},t.externalTextures??{});let o=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),s=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of o.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of s.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of s.textures.values())this.consumedExternalTextures.add(e);let c=o.textures,l=e=>{let t=A(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},u=e=>{let t=Sn(e),n=t.transient?this.transientTextures.get(t):c.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},d=e=>{let t=u(e);if(e instanceof Jn||jr(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},f={commandEncoder:e,parameters:t.parameters,getBuffer:l,getTexture:u,getTextureView:d,getExternalTexture:e=>{let t=s.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},p=[],m,h=0,g=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,_=()=>{let e=m;m=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=_r();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){let e=_r();p.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{m||(m=e.beginComputePass({id:n.id}),h++);let t=m;o=mr(t,e),o&&(g=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?ar(t,l(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...f,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}g||_();break}case`render`:{_();let t=r,i=t.getRenderPassProps?.(f)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,d):void 0,s=n.attachments?.resolveTargets?.map(e=>e?d(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=mr(c,e),c.pushDebugGroup(n.id);try{t.encode({...f,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:_(),r.encode(f);break}let s=_r();p.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{_()}let v=_r();return new or(p,v-i,h,i,v,async(e,t)=>{if(this.destroyed)throw Error(`Graph has been destroyed.`);let n=this.compiledNodes.findIndex(({node:t})=>t.id===e),r=this.compiledNodes[n]?.node.resources?.[t],i=this.preflight.nodes[n]?.resources?.[t];if(!r||!i)throw Error(`Resource is unavailable.`);if(`externalTexture`in r)throw Error(`External images cannot be read back.`);let a=`buffer`in r?A(r.buffer):Sn(r.texture);if(`frameScoped`in a&&a.frameScoped)throw Error(`Frame textures expire after presentation.`);let o=`buffer`in r?l(r.buffer):u(r.texture),s=o instanceof T?this.transientBuffers:this.transientTextures;if(a.transient&&[...s].some(([e,t])=>e!==a&&t===o))throw Error(`Transient allocation is reused; logical contents are no longer available.`);return hn(o,i)})}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);Cr(a,i,this.device);let o=lr(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);wr(e.texture,a,this.device),n.set(a,fr(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);wr(o,a,this.device),n.set(a,fr(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);Tr(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function lr(e){return e instanceof be?e.buffer:e}function ur(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function dr(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function fr(e){if(e instanceof dt){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function pr(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function mr(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function hr(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function gr(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function _r(){return globalThis.performance?.now()??Date.now()}function vr(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function yr(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function br(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,n===`3d`?r:1))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function xr(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function Sr(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function Cr(e,t,n){let r=lr(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function wr(e,t,n){let r=fr(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function Tr(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function Er(e,t){let n=kr(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function Dr(e,t){let n=Ar(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function Or(e,t){if(e instanceof Xn&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function kr(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return T.STORAGE;case`uniform`:return T.UNIFORM;case`copy-source`:return T.COPY_SRC;case`copy-destination`:return T.COPY_DST;case`indirect`:return T.INDIRECT;case`vertex`:return T.VERTEX;case`index`:return T.INDEX}}function Ar(e){switch(e){case`sampled`:return E.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return E.STORAGE;case`render-attachment`:return E.RENDER;case`copy-source`:return E.COPY_SRC;case`copy-destination`:return E.COPY_DST}}function jr(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var Mr=120,Nr=class{maxSamples;getNodeGroup;graphs=new Map;encodingGraphs=new WeakMap;constructor(e={}){let t=e.maxSamples??Mr;if(!Number.isSafeInteger(t)||t<=0)throw Error(`GPUCommandGraphInspector maxSamples must be a positive safe integer`);this.maxSamples=t,this.getNodeGroup=e.getNodeGroup}registerGraph(e){this.graphs.set(e.id,{id:e.id,stats:Pr(e.stats),capabilities:Object.freeze({...e.capabilities}),...e.preflight?{preflight:Fr(e.preflight)}:{},encodingCount:0,timingReadFailureCount:0,cpuSamples:[],gpuSamples:[],counters:new Map,nodes:new Map});let t=this.getGraph(e.id);for(let n of e.preflight?.nodes??[])this.getNode(t,n)}observeGraph(e){this.registerGraph(e);let t=this.getGraph(e.id),n=new WeakMap,r=!0,i=()=>r&&this.graphs.get(e.id)===t;return Object.freeze({graph:e,encode:(n,r)=>{let a=e.encode(n,r);return i()&&this.recordGraphEncoding(t,a),a},recordGPUTimings:async r=>{let a=n.get(r);if(a)return await a;if(i()&&this.encodingGraphs.get(r)===t){let i=this.recordGraphGPUTimings(e.id,t,r);return n.set(r,i),await i}},recordCounters:e=>{i()&&this.recordGraphCounters(t,e)},detach:()=>{r&&(r=!1,this.graphs.get(e.id)===t&&this.graphs.delete(e.id))}})}clear(){this.graphs.clear()}recordEncoding(e,t){let n=this.getGraph(e);this.recordGraphEncoding(n,t)}async readResource(e,t,n){let r=this.getGraph(e);if(!r.encoding?.readResource)throw Error(`No live resource readback is available.`);let i=await r.encoding.readResource(t,n);if(this.graphs.get(e)!==r)throw Error(`Graph registration changed during readback.`);return i}recordCounters(e,t){this.recordGraphCounters(this.getGraph(e),t)}recordGraphEncoding(e,t){e.encoding=t,this.encodingGraphs.set(t,e);let{stats:n}=t;e.encodingCount++,this.addSample(e.cpuSamples,n.cpuEncodeTimeMilliseconds);for(let t of n.nodes){let n=this.getNode(e,t);this.addSample(n.cpuSamples,t.cpuEncodeTimeMilliseconds)}}recordGraphCounters(e,t){let n=Object.entries(t);for(let[e,t]of n)if(!e||!Number.isFinite(t)||t<0)throw Error(`GPUCommandGraphInspector counters require an ID and a finite, non-negative value`);for(let[t,r]of n){let n=e.counters.get(t);n||(n=[],e.counters.set(t,n)),this.addSample(n,r)}}async recordGPUTimings(e,t){let n=this.encodingGraphs.get(t)??this.getGraph(e);return await this.recordGraphGPUTimings(e,n,t)}async recordGraphGPUTimings(e,t,n){if(this.graphs.get(e)!==t)return;let r;try{r=await n.readTimings()}catch{this.graphs.get(e)===t&&t.timingReadFailureCount++;return}if(this.graphs.get(e)===t){r.gpuTimeMilliseconds!==void 0&&this.addSample(t.gpuSamples,r.gpuTimeMilliseconds);for(let e of r.nodes)if(e.gpuTimeMilliseconds!==void 0){let n=this.getNode(t,e);this.addSample(n.gpuSamples,e.gpuTimeMilliseconds)}return r}}getSnapshot(){let e=Array.from(this.graphs.values(),e=>this.getGraphSnapshot(e));return Object.freeze({graphs:Object.freeze(e)})}getGraph(e){let t=this.graphs.get(e);if(!t)throw Error(`GPUCommandGraphInspector graph "${e}" is not registered`);return t}getNode(e,t){let n=e.nodes.get(t.id);if(n)return t.description!==void 0&&(n.description=t.description),t.resources!==void 0&&(n.resources=zr(t.resources)),n;let r=zr(t.resources),i=this.getNodeGroup?.({graphId:e.id,id:t.id,type:t.type,description:t.description,resources:r}),a={id:t.id,resources:r,...t.description===void 0?{}:{description:t.description},type:t.type,...i===void 0?{}:{group:i},cpuSamples:[],gpuSamples:[]};return e.nodes.set(a.id,a),a}addSample(e,t){e.push(t),e.length>this.maxSamples&&e.splice(0,e.length-this.maxSamples)}getGraphSnapshot(e){let t=[],n=new Set;for(let r of e.stats.nodeOrder){let i=e.nodes.get(r);i&&(t.push(i),n.add(r))}for(let r of e.nodes.values())n.has(r.id)||t.push(r);let r=t.map(e=>Object.freeze({id:e.id,resources:e.resources,...e.description===void 0?{}:{description:e.description},type:e.type,...e.group===void 0?{}:{group:e.group},cpu:Ir(e.cpuSamples),gpu:Ir(e.gpuSamples)})),i=Array.from(e.counters,([e,t])=>Lr(e,t));return Object.freeze({id:e.id,stats:e.stats,capabilities:e.capabilities,...e.preflight?{preflight:e.preflight}:{},encodingCount:e.encodingCount,timingReadFailureCount:e.timingReadFailureCount,totals:Object.freeze({cpu:Ir(e.cpuSamples),gpu:Ir(e.gpuSamples)}),counters:Object.freeze(i),nodes:Object.freeze(r)})}};function Pr(e){return Object.freeze({...e,nodeOrder:Object.freeze([...e.nodeOrder])})}function Fr(e){return Object.freeze({...e,nodes:Object.freeze(e.nodes.map(e=>Object.freeze({...e,resources:zr(e.resources)})))})}function Ir(e){if(e.length===0)return Object.freeze({sampleCount:0});let t=[...e].sort((e,t)=>e-t);return Object.freeze({sampleCount:e.length,latestMilliseconds:e[e.length-1],p50Milliseconds:Rr(t,.5),p95Milliseconds:Rr(t,.95)})}function Lr(e,t){let n=[...t].sort((e,t)=>e-t);return Object.freeze({id:e,sampleCount:t.length,latestValue:t[t.length-1],p50Value:Rr(n,.5),p95Value:Rr(n,.95)})}function Rr(e,t){return e[Math.ceil(t*e.length)-1]}function zr(e){return e&&Object.freeze(e.map(e=>Object.freeze({...e})))}var Br=20,Vr=`\
const DEPTH_OF_FIELD_MAX_BLUR: i32 = ${Br};

struct dofUniforms {
  depthRange: vec2<f32>,
  focusDistance: f32,
  blurCoefficient: f32,
  pixelsPerMillimeter: f32,
  texelOffset: vec2<f32>,
  circularAperture: f32,
};

@group(0) @binding(auto) var<uniform> dof: dofUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn dof_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let resolution = vec2<i32>(textureDimensions(sourceTexture, 0));
  let maxCoordinate = resolution - vec2<i32>(1, 1);
  let fragmentCoordinate = min(vec2<i32>(vec2<f32>(resolution) * texCoord), maxCoordinate);

  let depthSample = textureSample(depthTexture, depthTextureSampler, texCoord);
  let linearDepth =
    (dof.depthRange.x * dof.depthRange.y) /
    (dof.depthRange.y -
      depthSample * (dof.depthRange.y - dof.depthRange.x));

  let deltaDepth = abs(dof.focusDistance - linearDepth);
  let foregroundCompensation = select(
    abs(dof.focusDistance + deltaDepth),
    abs(dof.focusDistance - deltaDepth),
    linearDepth < dof.focusDistance
  );
  let blurRadius = min(
    floor(
      dof.blurCoefficient *
        (deltaDepth / max(foregroundCompensation, 0.0001)) *
        dof.pixelsPerMillimeter
    ),
    f32(DEPTH_OF_FIELD_MAX_BLUR)
  );

  var color = vec4f(0.0);

  if (blurRadius > 1.0 && dof.circularAperture > 0.5) {
    // Equal-area golden-angle samples cover a circular lens aperture in one pass.
    // Normalize the gather so constant HDR radiance is preserved.
    for (var sampleIndex = 0; sampleIndex < 48; sampleIndex++) {
      let sampleRadius = sqrt((f32(sampleIndex) + 0.5) / 48.0) * blurRadius * 0.5;
      let sampleAngle = f32(sampleIndex) * 2.39996323;
      let sampleCoordinate = clamp(fragmentCoordinate + vec2i(round(
        vec2f(cos(sampleAngle), sin(sampleAngle)) * sampleRadius)), vec2i(0), maxCoordinate);
      color += textureLoad(sourceTexture, sampleCoordinate, 0);
    }
    color /= 48.0;
  } else if (blurRadius > 1.0) {
    let halfBlur = blurRadius * 0.5;
    var sampleCount = 0.0;

    for (var sampleIndex: i32 = 0; sampleIndex <= DEPTH_OF_FIELD_MAX_BLUR; sampleIndex++) {
      if (f32(sampleIndex) > blurRadius) {
        break;
      }

      let sampleOffset = round((f32(sampleIndex) - halfBlur) * dof.texelOffset);
      let sampleCoordinate = clamp(
        fragmentCoordinate + vec2<i32>(sampleOffset),
        vec2<i32>(0, 0),
        maxCoordinate
      );
      color += textureLoad(sourceTexture, sampleCoordinate, 0);
      sampleCount += 1.0;
    }

    color /= sampleCount;
  } else {
    color = textureLoad(sourceTexture, fragmentCoordinate, 0);
  }

  return color;
}
`,Hr=`\
#define DEPTH_OF_FIELD_MAX_BLUR ${Br}.0

uniform sampler2D depthTexture;

layout(std140) uniform dofUniforms {
  vec2 depthRange;
  float focusDistance;
  float blurCoefficient;
  float pixelsPerMillimeter;
  vec2 texelOffset;
  float circularAperture;
} dof;

vec4 dof_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 resolution = textureSize(sourceTexture, 0);
  ivec2 maxCoordinate = resolution - 1;
  ivec2 fragmentCoordinate = min(ivec2(texCoord * vec2(resolution)), maxCoordinate);

  float depthSample = texelFetch(depthTexture, fragmentCoordinate, 0).r;
  float ndcDepth = depthSample * 2.0 - 1.0;
  float linearDepth = -(2.0 * dof.depthRange.y * dof.depthRange.x) /
    (ndcDepth * (dof.depthRange.y - dof.depthRange.x) -
      dof.depthRange.y -
      dof.depthRange.x);

  float deltaDepth = abs(dof.focusDistance - linearDepth);
  float foregroundCompensation =
    linearDepth < dof.focusDistance
      ? abs(dof.focusDistance - deltaDepth)
      : abs(dof.focusDistance + deltaDepth);
  float blurRadius = min(
    floor(
      dof.blurCoefficient *
        (deltaDepth / max(foregroundCompensation, 0.0001)) *
        dof.pixelsPerMillimeter
    ),
    DEPTH_OF_FIELD_MAX_BLUR
  );

  vec4 color = vec4(0.0);

  if (blurRadius > 1.0 && dof.circularAperture > 0.5) {
    for (int sampleIndex = 0; sampleIndex < 48; sampleIndex++) {
      float sampleRadius = sqrt((float(sampleIndex) + 0.5) / 48.0) * blurRadius * 0.5;
      float sampleAngle = float(sampleIndex) * 2.39996323;
      ivec2 sampleCoordinate = clamp(fragmentCoordinate + ivec2(round(
        vec2(cos(sampleAngle), sin(sampleAngle)) * sampleRadius)), ivec2(0), maxCoordinate);
      color += texelFetch(sourceTexture, sampleCoordinate, 0);
    }
    color /= 48.0;
  } else if (blurRadius > 1.0) {
    float halfBlur = blurRadius * 0.5;
    float sampleCount = 0.0;

    for (float sampleIndex = 0.0; sampleIndex <= DEPTH_OF_FIELD_MAX_BLUR; sampleIndex++) {
      if (sampleIndex > blurRadius) {
        break;
      }

      ivec2 sampleCoordinate = clamp(
        fragmentCoordinate + ivec2((sampleIndex - halfBlur) * dof.texelOffset),
        ivec2(0),
        maxCoordinate
      );
      color += texelFetch(sourceTexture, sampleCoordinate, 0);
      sampleCount += 1.0;
    }

    color /= sampleCount;
  } else {
    color = texelFetch(sourceTexture, fragmentCoordinate, 0);
  }

  return color;
}
`,Ur={name:`dof`,source:Vr,fs:Hr,bindingLayout:[{name:`depthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{depthRange:`vec2<f32>`,focusDistance:`f32`,blurCoefficient:`f32`,pixelsPerMillimeter:`f32`,texelOffset:`vec2<f32>`,circularAperture:`f32`},propTypes:{depthRange:{value:[.1,100]},focusDistance:{value:1,min:1e-4},blurCoefficient:{value:1,min:0},pixelsPerMillimeter:{value:1,min:0},texelOffset:{value:[1,0],private:!0},circularAperture:{value:0,private:!0}},passes:[{sampler:!0}]},Wr={...Ur,name:`bokehDof`,source:Vr.replaceAll(`dof`,`bokehDof`),fs:Hr.replaceAll(`dof`,`bokehDof`),propTypes:{...Ur.propTypes,circularAperture:{value:1,private:!0}}},Gr=class{output=new l;passes;backend;source;depth;sourceHandle;outputHandle;constructor(e,t){this.device=e,this.backend=t.backend,this.output.flipY=!1,this.passes=new Bt(e,{shaderPasses:[Wr],colorFormat:`rgba16float`,flipY:!0})}render(e,t,n,r,i){let a=this.backend.get(e).texture;this.sourceHandle!==a&&(this.source?.destroy(),this.depth?.destroy(),this.sourceHandle=a,this.source=this.borrowTexture(a),this.depth=this.borrowTexture(this.backend.get(t).texture),this.device.getCanvasContext().setDrawingBufferSize(a.width,a.height),this.passes.resize([a.width,a.height]));let o=this.passes.renderToTexture({sourceTexture:this.source,bindings:{depthTexture:this.depth},uniforms:{bokehDof:{depthRange:i,focusDistance:n,blurCoefficient:r*24,pixelsPerMillimeter:a.height/850}}});this.device.submit();let s=o.handle;this.outputHandle!==s&&(this.outputHandle&&this.output.dispose(),this.outputHandle=s,this.output.sourceTexture=s,this.output.needsUpdate=!0)}dispose(){this.output.dispose(),this.source?.destroy(),this.depth?.destroy(),this.passes.destroy()}borrowTexture(e){return this.device.createTexture({handle:e,_isHandleBorrowed:!0,width:e.width,height:e.height,format:e.format,sampler:{minFilter:`nearest`,magFilter:`nearest`}})}},Kr=`// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
//
// GPUCommandGraph -> borrowed GPU buffers -> upstream Three.js WebGPURenderer.
// Three 0.185.1 is intentionally pinned: the bridge uses private renderer hooks.
import {Buffer, luma, log} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {ThreeBufferBridge, getThreeBufferBridgeSupport} from '@luma.gl/three/interop';
import {
  WebGPURenderer,
  Scene,
  PerspectiveCamera,
  Color,
  PlaneGeometry,
  InstancedBufferAttribute,
  RenderPipeline,
  RenderTarget,
  DepthTexture,
  CircleGeometry,
  DoubleSide,
  HalfFloatType,
  NoBlending,
  ACESFilmicToneMapping,
  InstancedBufferGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  AdditiveBlending
} from 'three/webgpu';
import {
  attribute,
  cameraWorldMatrix,
  exp,
  positionLocal,
  screenUV,
  texture,
  uv,
  vec4
} from 'three/tsl';
import {GalaxyDepthOfField} from './galaxy-depth-of-field';
import {createGalaxyInfoBox} from './galaxy-info-box';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const DISK_PARTICLE_COUNT = 98304;
const BULGE_PARTICLE_COUNT = 98304;
const PARTICLE_COUNT = DISK_PARTICLE_COUNT + BULGE_PARTICLE_COUNT;
// Match the main disk's 0.2 radians per animation second to an illustrative 250 Ma orbit.
const MILLION_YEARS_PER_ANIMATION_SECOND = (250 * 0.2) / (2 * Math.PI);
const PARTICLE_ANIMATION_SHADER = \`
struct SimulationParameters { time: f32, radius: f32, count: f32, padding: f32 };
@group(0) @binding(0) var<storage, read_write> offsets: array<f32>;
@group(0) @binding(1) var<storage, read_write> colors: array<f32>;
@group(0) @binding(2) var<uniform> parameters: SimulationParameters;

// Integer hashing avoids correlated bands from large floating-point sine arguments.
fn getRandomValue(seed: u32) -> f32 {
  var value = seed + 0x9e3779b9u;
  value = (value ^ (value >> 16u)) * 0x85ebca6bu;
  value = (value ^ (value >> 13u)) * 0xc2b2ae35u;
  value = value ^ (value >> 16u);
  return f32(value & 0x00ffffffu) / 16777216.0;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) invocationId: vec3u) {
  let particleIndex = invocationId.x;
  if (particleIndex >= u32(parameters.count)) { return; }
  let seed = particleIndex * 16u;
  var position: vec3f;
  var starColor: vec3f;
  var brightness: f32;

  // Added stars fill the warm bulge without taking particles away from the arms or disk.
  let population = select(particleIndex % 16u, 4u, particleIndex >= \${DISK_PARTICLE_COUNT}u);
  let radialFraction = pow(getRandomValue(seed), 0.65);
  let radialDistance = (0.08 + 9.8 * radialFraction) * parameters.radius;
  // Use a separate index from population so every stellar population fills all four arms.
  let arm = f32((particleIndex / 16u) % 4u) * 1.5707963;
  let filament = getRandomValue(seed + 6u);
  let strand = floor(filament * 4.0);
  let armVariation = sin(arm + 0.8);
  // Preserve arm structure during long sessions instead of winding it into rings.
  let orbitalAngle = parameters.time * 0.2
    + sin(parameters.time * 0.08) * 0.45 * (1.0 - radialFraction);
  // Correlated waves bend entire filaments; fine scatter breaks up their edges.
  let turbulence = sin(radialFraction * 23.0 + arm * 3.0 + parameters.time * 0.12) * 0.16
    + sin(radialFraction * 51.0 + filament * 5.0) * 0.035;
  var angle = arm + log(1.0 + radialFraction * 8.0) * (2.8 + armVariation * 0.2) + orbitalAngle + turbulence;
  let scatter = getRandomValue(seed + 1u) - 0.5;
  // Discrete braided ribbons leave dark channels between the luminous streams.
  angle += (strand - 1.5) * 0.105 + sin(radialFraction * 14.0 + strand * 1.7) * 0.07;
  angle += scatter * (0.055 + 0.14 * filament * filament);
  // Sculpt each arm around a raised centerline while retaining a thin underlying disk.
  // Coherent ridges and braided strands give the arms volume without scattering them apart.
  let armEnvelope = smoothstep(0.05, 0.25, radialFraction);
  let ridgePhase = radialFraction * 9.0 + arm + parameters.time * 0.12;
  let ridgeHeight = sin(ridgePhase) * (0.12 + radialFraction * (0.55 + 0.25 * armVariation)) * armEnvelope;
  let strandPhase = radialFraction * 12.0 + floor(filament * 4.0) * 1.5707963 + arm;
  let strandHeight = sin(strandPhase) * (0.04 + radialFraction * 0.24) * armEnvelope;
  let crossSection = getRandomValue(seed + 2u) * 6.2831853;
  let thickness = (0.035 + radialFraction * 0.24) * (1.0 - abs(scatter));
  let height = ridgeHeight + strandHeight + cos(crossSection) * thickness;
  position = vec3f(cos(angle) * radialDistance, height, sin(angle) * radialDistance);
  let gold = mix(vec3f(1.0, 0.16, 0.005), vec3f(1.0, 0.52, 0.07), getRandomValue(seed + 3u));
  let cyan = mix(vec3f(0.005, 0.18, 0.5), vec3f(0.04, 0.8, 1.0), getRandomValue(seed + 4u));
  // Warm and cool filaments overlap instead of forming uniform concentric color bands.
  let coolWeight = smoothstep(0.25, 0.8, radialFraction + sin(arm + strand * 0.7) * 0.23);
  starColor = mix(gold, cyan, coolWeight);
  // A brighter face and dimmer underside make the stream's rounded cross-section readable.
  let strandLight = 0.65 + 0.5 * (0.5 + 0.5 * cos(crossSection - 0.7));
  brightness = (0.38 + 3.2 * pow(getRandomValue(seed + 5u), 7.0)) * strandLight;
  if (population == 0u || population == 1u) {
    // Soft, oversized sprites trace translucent dust clouds above and below the stars.
    position.x += (getRandomValue(seed + 7u) - 0.5) * radialFraction * 1.2;
    position.z += (getRandomValue(seed + 8u) - 0.5) * radialFraction * 1.2;
    // Dust curls around the same arm centerline rather than forming a separate cloud.
    position.y += sin(strandPhase + crossSection * 0.35) * (0.1 + radialFraction * 0.3);
    brightness = 0.0015 + 0.003 * getRandomValue(seed + 5u);
    if (population == 0u) {
      // A continuous luminous disk supports the arm ridges rather than leaving empty gaps.
      let diskAngle = getRandomValue(seed + 9u) * 6.2831853 + parameters.time * 0.2;
      position = vec3f(cos(diskAngle) * radialDistance,
        (getRandomValue(seed + 2u) - 0.5) * 0.18, sin(diskAngle) * radialDistance);
      brightness = 0.004 * (1.0 - smoothstep(0.65, 1.0, radialFraction));
    }
  } else if (population == 2u) {
    // A loose foreground population supplies depth and a handful of defocused lights.
    angle = getRandomValue(seed + 1u) * 6.2831853 + parameters.time * 0.04;
    position = vec3f(cos(angle) * radialDistance * 1.2,
      (getRandomValue(seed + 2u) - 0.5) * 4.5, sin(angle) * radialDistance * 1.2);
    brightness = 0.018 + 0.07 * getRandomValue(seed + 5u);
  } else if (population == 3u || population == 4u) {
    // Keep a compact nucleus inside a broader, dimmer warm stellar envelope.
    // Independent azimuths avoid an artificial double spiral through the nucleus.
    // Rotation blends gently into the disk, with a soft outer falloff into the inner arms.
    let coreFraction = pow(getRandomValue(seed), 1.1);
    // Retain an exponential nucleus inside a filled, softly fading warm envelope.
    let isOuterBulge = population == 4u;
    let normalizedCoreRadius = select(-log(1.0 - coreFraction * 0.985) * 0.55,
      pow(getRandomValue(seed), 0.3333333) * 2.856, isOuterBulge);
    // Sample a filled ellipsoid: height and planar radius share the same spherical shell.
    // This avoids piling tall stars over tiny planar radii into a vertical column.
    let verticalDirection = getRandomValue(seed + 2u) * 2.0 - 1.0;
    let planarFraction = select(1.0, sqrt(1.0 - verticalDirection * verticalDirection), isOuterBulge);
    let coreRadius = normalizedCoreRadius * planarFraction * parameters.radius;
    let coreAngle = getRandomValue(seed + 1u) * 6.2831853;
    // Keep the visual angular-speed difference within ten percent of the main disk.
    let coreAngularSpeed = 0.2 + 0.02 * (1.0 - smoothstep(0.0, 2.856, normalizedCoreRadius));
    angle = coreAngle + parameters.time * coreAngularSpeed;
    let coreHeight = select(verticalDirection * sqrt(1.0 - coreFraction) * 0.275,
      verticalDirection * normalizedCoreRadius * 0.3168, isOuterBulge);
    position = vec3f(cos(angle) * coreRadius, coreHeight * parameters.radius,
      sin(angle) * coreRadius);
    // Define the white center in world radius so widening the envelope cannot widen it.
    let coreWhite = (1.0 - smoothstep(0.08, 0.55, normalizedCoreRadius))
      * select(1.0, 0.25, isOuterBulge);
    starColor = mix(vec3f(1.0, 0.48, 0.06), vec3f(1.0, 0.93, 0.72), coreWhite);
    let coreFade = select(1.0 - smoothstep(0.55, 1.0, coreFraction),
      1.1 * (1.0 - smoothstep(1.224, 2.856, normalizedCoreRadius)), isOuterBulge);
    brightness = (0.4 + 1.3 * getRandomValue(seed + 5u)) * coreFade
      * (0.7 + 0.3 * sin(coreAngle * 3.0 + coreFraction * 9.0));
  } else if (population >= 5u && population <= 8u) {
    // A dim stellar disk connects the bright filaments into a substantial galaxy.
    // These stars fill the gaps without adding another layer of blurry bloom.
    angle = getRandomValue(seed + 9u) * 6.2831853 + parameters.time * 0.2;
    position = vec3f(cos(angle) * radialDistance,
      (getRandomValue(seed + 2u) - 0.5) * (0.06 + radialFraction * 0.16),
      sin(angle) * radialDistance);
    brightness = (0.12 + 0.24 * getRandomValue(seed + 5u))
      * (1.0 - smoothstep(0.75, 1.0, radialFraction));
  }
  let color = starColor * brightness;
  offsets[particleIndex * 3u] = position.x;
  offsets[particleIndex * 3u + 1u] = position.y;
  offsets[particleIndex * 3u + 2u] = position.z;
  colors[particleIndex * 3u] = color.r;
  colors[particleIndex * 3u + 1u] = color.g;
  colors[particleIndex * 3u + 2u] = color.b;
}\`;

async function main() {
  if (!navigator.gpu) throw new Error('This showcase requires WebGPU.');
  const container = document.querySelector<HTMLElement>('#viewport')!;
  const status = document.querySelector<HTMLElement>('#status')!;
  const elapsedTime = document.querySelector<HTMLOutputElement>('#elapsed-time')!;
  const diagnostics = new GPUGraphDiagnostics();
  const infoBox = createGalaxyInfoBox(diagnostics);
  const canvas = document.createElement('canvas');
  container.append(canvas);
  status.textContent = 'Requesting shared WebGPU device…';
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    type: 'webgpu',
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {canvas: document.createElement('canvas'), autoResize: false}
  });
  const renderer = new WebGPURenderer({
    canvas,
    device: device.handle as GPUDevice,
    antialias: true
  });
  status.textContent = 'Initializing Three renderer…';
  await renderer.init();
  const support = getThreeBufferBridgeSupport(device, renderer);
  if (!support.supported) throw new Error(support.reason);
  const bridge = new ThreeBufferBridge(device, renderer);
  // vec4 layout avoids alignment ambiguity in storage; Three consumes xyz with stride 16.
  // The bridge currently supports packed Float32 attributes, so use vec3 arrays instead.
  const positions = device.createBuffer({
    id: 'galaxy-positions',
    byteLength: PARTICLE_COUNT * 12,
    usage: Buffer.STORAGE | Buffer.VERTEX
  });
  const colors = device.createBuffer({
    id: 'galaxy-colors',
    byteLength: PARTICLE_COUNT * 12,
    usage: Buffer.STORAGE | Buffer.VERTEX
  });
  const parameterBuffer = device.createBuffer({
    id: 'galaxy-params',
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const graph = new GPUCommandGraph(device, {id: 'galaxy-animation'});
  const positionHandle = graph.importBuffer(
    {id: 'positions', byteLength: positions.byteLength, usage: positions.usage},
    positions
  );
  const colorHandle = graph.importBuffer(
    {id: 'colors', byteLength: colors.byteLength, usage: colors.usage},
    colors
  );
  const parameterHandle = graph.importBuffer(
    {id: 'params', byteLength: parameterBuffer.byteLength, usage: parameterBuffer.usage},
    parameterBuffer
  );
  graph.addComputePass({
    id: 'animate-and-color',
    resources: [
      {buffer: positionHandle, usage: 'storage-write'},
      {buffer: colorHandle, usage: 'storage-write'},
      {buffer: parameterHandle, usage: 'uniform'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: 'galaxy-kernel',
        source: PARTICLE_ANIMATION_SHADER,
        shaderLayout: {
          bindings: [
            {name: 'offsets', type: 'storage', group: 0, location: 0},
            {name: 'colors', type: 'storage', group: 0, location: 1},
            {name: 'parameters', type: 'uniform', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            offsets: getBuffer(positionHandle),
            colors: getBuffer(colorHandle),
            parameters: getBuffer(parameterHandle)
          });
          computation.dispatch(computePass, PARTICLE_COUNT / 256);
        },
        destroy: () => computation.destroy()
      };
    }
  });
  status.textContent = 'Compiling galaxy animation…';
  const compiled = await graph.compileAsync();
  // Camera-facing quads with analytic falloff read as light, rather than solid polyhedra.
  const base = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute('position', base.getAttribute('position'));
  geometry.setAttribute('uv', base.getAttribute('uv'));
  const particleSizes = new Float32Array(PARTICLE_COUNT);
  for (let particleIndex = 0; particleIndex < PARTICLE_COUNT; particleIndex++) {
    const population = particleIndex >= DISK_PARTICLE_COUNT ? 4 : particleIndex % 16;
    const variation = ((particleIndex * 16807) % 65521) / 65521;
    particleSizes[particleIndex] =
      population < 2
        ? 0.7 + variation * 1.4
        : population === 2
          ? 0.08 + variation ** 8 * 0.9
          : population === 4
            ? 0.05 + variation ** 4 * 0.08
            : population >= 5 && population <= 8
              ? 0.07 + variation * 0.12
              : 0.024 + variation ** 4 * 0.09;
  }
  geometry.setAttribute('instanceSize', new InstancedBufferAttribute(particleSizes, 1));
  geometry.instanceCount = PARTICLE_COUNT;
  geometry.setAttribute(
    'instanceOffset',
    bridge.createInstancedAttribute(positions, 3, PARTICLE_COUNT)
  );
  geometry.setAttribute(
    'instanceColor',
    bridge.createInstancedAttribute(colors, 3, PARTICLE_COUNT)
  );
  const material = new MeshBasicNodeMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.85,
    blending: AdditiveBlending,
    depthWrite: false
  });
  const instanceSize = attribute<'float'>('instanceSize', 'float');
  const spritePosition = positionLocal.mul(instanceSize);
  material.positionNode = attribute<'vec3'>('instanceOffset', 'vec3').add(
    cameraWorldMatrix.mul(vec4(spritePosition, 0)).xyz
  );
  const squaredRadius = uv().sub(0.5).length().pow(2).mul(4);
  const spriteOpacity = exp(squaredRadius.mul(-5)).sub(Math.exp(-5)).max(0);
  material.opacityNode = spriteOpacity;
  material.colorNode = attribute<'vec3'>('instanceColor', 'vec3');
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.background = new Color('#010409');
  scene.add(mesh);
  const camera = new PerspectiveCamera(50, 1, 0.01, 200);
  camera.position.set(0, 8.2, 19.2);
  camera.up.set(0.3, 1, 0);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  // Keep manual orbit/zoom, but drive the automatic camera in the galaxy's world-space plane.
  let cameraInteracting = false;
  let cameraResumeTime = 0;
  let cameraOrbitTime = 0;
  controls.addEventListener('start', () => {
    cameraInteracting = true;
  });
  controls.addEventListener('end', () => {
    cameraInteracting = false;
    cameraResumeTime = performance.now() + 6000;
  });
  const depthOfField = new GalaxyDepthOfField(device, renderer);
  const sceneTarget = new RenderTarget(1, 1, {type: HalfFloatType});
  sceneTarget.depthTexture = new DepthTexture(1, 1);
  // Capture nearest sharp star depth separately; luminous dust must not mask the whole disk.
  const depthMaterial = material.clone();
  depthMaterial.transparent = false;
  depthMaterial.blending = NoBlending;
  depthMaterial.colorWrite = false;
  depthMaterial.depthWrite = true;
  depthMaterial.alphaTest = 0.2;
  depthMaterial.opacityNode = spriteOpacity.mul(instanceSize.lessThan(0.25).select(1, 0));
  const depthScene = new Scene();
  const depthStars = new Mesh(geometry, depthMaterial);
  depthStars.frustumCulled = false;
  depthScene.add(depthStars);
  // The stellar disk supplies continuous depth between sparse additive star sprites.
  // Otherwise empty pixels read as the far plane and turn every filament into a blur edge.
  const diskGeometry = new CircleGeometry(10.1, 96);
  const diskMaterial = new MeshBasicNodeMaterial({
    colorWrite: false,
    depthWrite: true,
    side: DoubleSide
  });
  const depthDisk = new Mesh(diskGeometry, diskMaterial);
  depthDisk.rotation.x = -Math.PI / 2;
  // Keep the gap-filling depth proxy below the raised and recessed stellar streams.
  depthDisk.position.y = -1;
  depthScene.add(depthDisk);
  const renderPipeline = new RenderPipeline(renderer);
  const sceneColor = texture(depthOfField.output, screenUV);
  const glow = bloom(sceneColor, 0.45, 0.3, 1.1);
  renderPipeline.outputNode = sceneColor.add(glow);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  let pixelRatio = window.devicePixelRatio;
  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    pixelRatio = window.devicePixelRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    sceneTarget.setSize(canvas.width, canvas.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  status.textContent = \`\${PARTICLE_COUNT.toLocaleString('en-US')} instances · GPU graph → shared buffers → Three.js\`;
  let time = 0,
    previousTimestamp = performance.now(),
    running = true;
  let isReady = false;
  const animate = (now: number) => {
    if (!running) return;
    if (window.devicePixelRatio !== pixelRatio) resize();
    const deltaTimeSeconds = Math.min((now - previousTimestamp) / 1000, 0.05);
    previousTimestamp = now;
    const paused = infoBox.settings.paused;
    if (!paused) time += deltaTimeSeconds * infoBox.settings.speed;
    // The main stellar disk completes one turn per 250 Ma; other motion remains illustrative.
    const elapsedTimeLabel = \`\${(time * MILLION_YEARS_PER_ANIMATION_SECOND).toFixed(0)} Ma\`;
    if (elapsedTime.textContent !== elapsedTimeLabel) elapsedTime.textContent = elapsedTimeLabel;
    parameterBuffer.write(new Float32Array([time, 1, PARTICLE_COUNT, 0]));
    diagnostics.encode(compiled, device.commandEncoder, {parameters: undefined});
    device.submit(); // Same GPU queue; no readback, no intermediate upload.
    controls.update();
    if (!paused && !cameraInteracting && now >= cameraResumeTime) {
      cameraOrbitTime += deltaTimeSeconds;
      const offset = camera.position.clone().sub(controls.target);
      const distance = offset.length();
      // One revolution takes six minutes; an 80-second cycle moves from 35° to 8° above the disk.
      const azimuth = Math.atan2(offset.x, offset.z) + (deltaTimeSeconds * Math.PI) / 180;
      const targetElevation =
        ((21.5 + 13.5 * Math.cos((cameraOrbitTime * Math.PI) / 40)) * Math.PI) / 180;
      const currentElevation = Math.asin(Math.max(-1, Math.min(1, offset.y / distance)));
      // Ease back from a user's chosen elevation rather than snapping after interaction.
      const elevation =
        currentElevation +
        (targetElevation - currentElevation) * (1 - Math.exp(-deltaTimeSeconds * 0.5));
      const planarDistance = distance * Math.cos(elevation);
      camera.position.set(
        controls.target.x + Math.sin(azimuth) * planarDistance,
        controls.target.y + Math.sin(elevation) * distance,
        controls.target.z + Math.cos(azimuth) * planarDistance
      );
      camera.lookAt(controls.target);
    }
    renderer.setRenderTarget(sceneTarget);
    renderer.render(scene, camera);
    // Preserve additive color while filling only the depth attachment.
    renderer.autoClear = false;
    renderer.render(depthScene, camera);
    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    depthOfField.render(
      sceneTarget.texture,
      sceneTarget.depthTexture!,
      camera.position.distanceTo(controls.target),
      infoBox.settings.aperture,
      [camera.near, camera.far]
    );
    renderPipeline.render();
    if (!isReady) {
      isReady = true;
      window.parent.postMessage({type: 'luma-example-ready'}, window.location.origin);
    }
    infoBox.update();
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  window.addEventListener(
    'pagehide',
    () => {
      running = false;
      controls.dispose();
      infoBox.destroy();
      resizeObserver.disconnect();
      renderPipeline.dispose();
      glow.dispose();
      sceneTarget.dispose();
      depthMaterial.dispose();
      diskGeometry.dispose();
      diskMaterial.dispose();
      depthOfField.dispose();
      base.dispose();
      geometry.dispose();
      material.dispose();
      bridge.dispose();
      compiled.destroy();
      parameterBuffer.destroy();
      positions.destroy();
      colors.destroy();
      renderer.dispose();
      device.destroy();
    },
    {once: true}
  );
}
main().catch(error => {
  window.parent.postMessage(
    {type: 'luma-example-error', message: String(error)},
    window.location.origin
  );
  document.querySelector<HTMLElement>('#status')!.textContent = String(error);
  log.error(error instanceof Error ? error.message : String(error))();
});
`,qr=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!Xr(t.style,n.style)&&(Yr(r,t.style),Jr(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return Jr(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function Jr(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(Zr(n),String(r))}function Yr(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(Zr(n))}function Xr(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length?n.every(n=>e?.[n]===t?.[n]):!1}function Zr(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var Qr=class extends qr{static defaultProps={...qr.defaultProps,panel:void 0,placement:`top-left`}},$r=`data-deck-gl-community-panels-styles`,ei=`.deck-widget {
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
`;function ti(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function ni(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(ti))return!0}return!1}function ri(e){if(e.querySelector(`style[${$r}]`)||ni(e))return;let t=e.createElement(`style`);t.setAttribute($r,`true`),t.textContent=ei,e.head.appendChild(t)}var ii={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},ai=`top-left`,oi=`root`,si=class{deck;parentElement;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,deck:t=null,className:n}){this.deck=t,this.parentElement=e,this.className=n,ri(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),n&&this.parentElement.classList.add(n)}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!ci(e.components,this.components)){let t=e.components.filter(li);this._setComponents(t)}}finalize(){for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e}_addComponent(e){let{viewId:t=null,placement:n=ai}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:oi,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,ii[t]),r.append(i)),i}_updateContainers(){let e=this.deck,t=e?.width??this.parentElement.clientWidth,n=e?.height??this.parentElement.clientHeight;for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===oi||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function ci(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function li(e){return e instanceof qr}var ui,j,di,M,fi,pi,mi,hi,gi,_i,vi,yi,bi,xi,Si,Ci={},wi=[],Ti=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Ei=Array.isArray;function N(e,t){for(var n in t)e[n]=t[n];return e}function Di(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function P(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?ui.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return Oi(e,o,r,i,null)}function Oi(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++di,__i:-1,__u:0};return i==null&&j.vnode!=null&&j.vnode(a),a}function ki(e){return e.children}function F(e,t){this.props=e,this.context=t}function Ai(e,t){if(t==null)return e.__?Ai(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?Ai(e):null}function ji(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=N({},t);a.__v=t.__v+1,j.vnode&&j.vnode(a),Ui(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??Ai(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,Gi(r,a,i),t.__e=t.__=null,a.__e!=n&&Mi(a)}}function Mi(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),Mi(e)}function Ni(e){(!e.__d&&(e.__d=!0)&&M.push(e)&&!Pi.__r++||fi!=j.debounceRendering)&&((fi=j.debounceRendering)||pi)(Pi)}function Pi(){try{for(var e,t=1;M.length;)M.length>t&&M.sort(mi),e=M.shift(),t=M.length,ji(e)}finally{M.length=Pi.__r=0}}function Fi(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||wi,y=t.length;for(c=Ii(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||Ci,p.__i=d,g=Ui(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&Ji(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=Li(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function Ii(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=Oi(null,o,null,null,null):Ei(o)?o=e.__k[a]=Oi(ki,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=Oi(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=zi(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=Ai(s)),Yi(s,s));return r}function Li(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=Li(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=Ai(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function Ri(e,t){return t||=[],e==null||typeof e==`boolean`||(Ei(e)?e.some(function(e){Ri(e,t)}):t.push(e)),t}function zi(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>(u?1:0)){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function Bi(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||Ti.test(t)?n:n+`px`}function Vi(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||Bi(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||Bi(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(vi,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[_i]=r[_i]:(n[_i]=yi,e.addEventListener(t,a?xi:bi,a)):e.removeEventListener(t,a?xi:bi,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function Hi(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[gi]==null)t[gi]=yi++;else if(t[gi]<n[_i])return;return n(j.event?j.event(t):t)}}}function Ui(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,ee,te,S,C=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=j.__b)&&u(t);n:if(typeof C==`function`)try{if(_=t.props,v=C.prototype&&C.prototype.render,y=(u=C.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new C(_,b):(t.__c=d=new F(_,b),d.constructor=C,d.render=Xi),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&C.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=N({},d.__s)),N(d.__s,C.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&C.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&C.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),wi.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=j.__r,ee=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),wi.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++ee<25);d.state=d.__s,d.getChildContext!=null&&(r=N(N({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),te=u!=null&&u.type===ki&&u.key==null?Ki(u.props.children):u,s=Fi(e,Ei(te)?te:[te],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(S=a.length;S--;)Di(a[S]);Wi(t)}else t.__e=n.__e,t.__k=n.__k,e.then||Wi(t);j.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=qi(n.__e,t,n,r,i,a,o,c,l);return(u=j.diffed)&&u(t),128&t.__u?void 0:s}function Wi(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(Wi))}function Gi(e,t,n){for(var r=0;r<n.length;r++)Ji(n[r],n[++r],n[++r]);j.__c&&j.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){j.__e(e,t.__v)}})}function Ki(e){return typeof e!=`object`||!e||e.__b>0?e:Ei(e)?e.map(Ki):e.constructor===void 0?N({},e):null}function qi(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||Ci,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(j.__m&&j.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&ui.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||Vi(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||Vi(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),Fi(t.type==`template`?e.content:e,Ei(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&Ai(n,0),s,c),a!=null)for(l=a.length;l--;)Di(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&Vi(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&Vi(e,l,h,g[l],i))}return e}function Ji(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){j.__e(e,n)}}function Yi(e,t,n){var r,i;if(j.unmount&&j.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||Ji(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){j.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&Yi(r[i],t,n||typeof e.type!=`function`);n||Di(e.__e),e.__c=e.__=e.__e=void 0}function Xi(e,t,n){return this.constructor(e,n)}function I(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),j.__&&j.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],Ui(t,e=(!r&&n||t).__k=P(ki,null,[e]),i||Ci,Ci,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?ui.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),Gi(a,e,o)}function Zi(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,Ni(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+ Si++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}ui=wi.slice,j={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},di=0,F.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=N({},this.state);typeof e==`function`&&(e=e(N({},n),this.props)),e&&N(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),Ni(this))},F.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),Ni(this))},F.prototype.render=ki,M=[],pi=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,mi=function(e,t){return e.__v.__b-t.__v.__b},Pi.__r=0,hi=Math.random().toString(8),gi=`__d`+hi,_i=`__a`+hi,vi=/(PointerCapture)$|Capture$/i,yi=0,bi=Hi(!1),xi=Hi(!0),Si=0;var Qi=0;Array.isArray;function L(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Qi,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return j.vnode&&j.vnode(l),l}var $i,R,ea,ta,na=0,ra=[],z=j,ia=z.__b,aa=z.__r,oa=z.diffed,sa=z.__c,ca=z.unmount,la=z.__;function ua(e,t){z.__h&&z.__h(R,e,na||t),na=0;var n=R.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function B(e){return na=1,da(Sa,e)}function da(e,t,n){var r=ua($i++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):Sa(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=R,!R.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};R.__f=!0;var a=R.shouldComponentUpdate,o=R.componentWillUpdate;R.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},R.shouldComponentUpdate=i}return r.__N||r.__}function V(e,t){var n=ua($i++,3);!z.__s&&xa(n.__H,t)&&(n.__=e,n.u=t,R.__H.__h.push(n))}function fa(e,t){var n=ua($i++,4);!z.__s&&xa(n.__H,t)&&(n.__=e,n.u=t,R.__h.push(n))}function pa(e){return na=5,H(function(){return{current:e}},[])}function H(e,t){var n=ua($i++,7);return xa(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function ma(e,t){return na=8,H(function(){return e},t)}function ha(e){var t=R.context[e.__c],n=ua($i++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(R)),t.props.value):e.__}function ga(){for(var e;e=ra.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(ya),t.__h.some(ba),t.__h=[]}catch(n){t.__h=[],z.__e(n,e.__v)}}}z.__b=function(e){R=null,ia&&ia(e)},z.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),la&&la(e,t)},z.__r=function(e){aa&&aa(e),$i=0;var t=(R=e.__c).__H;t&&(ea===R?(t.__h=[],R.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(ya),t.__h.some(ba),t.__h=[],$i=0)),ea=R},z.diffed=function(e){oa&&oa(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(ra.push(t)!==1&&ta===z.requestAnimationFrame||((ta=z.requestAnimationFrame)||va)(ga)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),ea=R=null},z.__c=function(e,t){t.some(function(e){try{e.__h.some(ya),e.__h=e.__h.filter(function(e){return!e.__||ba(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],z.__e(n,e.__v)}}),sa&&sa(e,t)},z.unmount=function(e){ca&&ca(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{ya(e)}catch(e){t=e}}),n.__H=void 0,t&&z.__e(t,n.__v))};var _a=typeof requestAnimationFrame==`function`;function va(e){var t,n=function(){clearTimeout(r),_a&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);_a&&(t=requestAnimationFrame(n))}function ya(e){var t=R,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),R=t}function ba(e){var t=R;e.__c=e.__(),R=t}function xa(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function Sa(e,t){return typeof t==`function`?t(e):t}var Ca={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},wa={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},Ta=Zi(void 0);function Ea({panel:e,children:t}){let n=ha(Ta),r=pa(null),[i,a]=B(`light`),o=Da(n??i,e.theme);return fa(()=>{if(!n){let e=r.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=Aa(t);a(t=>t===e?t:e)};n();let i=new MutationObserver(()=>{n()});for(let e of Oa(t))i.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{i.disconnect()}}},[n]),L(Ta.Provider,{value:o,children:L(`div`,{ref:r,"data-panel-theme-mode":o,style:ka(o),children:t})})}function Da(e,t){return t===`dark`?`dark`:t===`light`?`light`:t===`invert`?e===`dark`?`light`:`dark`:e}function Oa(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function ka(e){return{...e===`dark`?wa:Ca}}function Aa(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=ja(t.getComputedStyle(e).getPropertyValue(`--menu-background`).trim());return n&&Ma(n)<.5?`dark`:`light`}function ja(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function Ma([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}var Na;function Pa(e){let t=Math.max(220,Math.floor(e));return Number.isFinite(t)?t:360}function Fa({panel:e,title:t,widthPx:n,maxHeightPx:r,open:i,collapsible:a,onOpenChange:o}){return L(`section`,{style:Ra(n,r),"aria-label":t??`Panel box`,onPointerDown:U,onPointerMove:U,onPointerUp:U,onMouseDown:U,onMouseMove:U,onMouseUp:U,onTouchStart:U,onTouchMove:U,onTouchEnd:U,onClick:U,onContextMenu:U,onWheel:U,children:[t?L(`header`,{style:za,children:a?L(`button`,{type:`button`,"aria-expanded":i,style:Ba,onClick:()=>o(!i),children:[L(`span`,{children:t}),L(`span`,{"aria-hidden":`true`,style:Va(i),children:i?`▾`:`▸`})]}):L(`span`,{children:t})}):null,L(`div`,{style:Ha(i),children:e?L(Ea,{panel:e,children:e.content}):null})]})}var Ia=class extends Qr{static defaultProps={...Qr.defaultProps,id:`box-panel-container`,placement:`bottom-left`,title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0};className=`deck-widget-box`;placement=Na.defaultProps.placement;title=Na.defaultProps.title;widthPx=Na.defaultProps.widthPx;collapsible=Na.defaultProps.collapsible;isOpen=Na.defaultProps.defaultOpen;#e=Na.defaultProps.panel;#t=null;#n=void 0;#r=!1;#i=!1;#a=void 0;constructor(e={}){super({...Na.defaultProps,...e}),this.setProps(this.props)}setProps(e){e.placement!==void 0&&(this.placement=e.placement),`title`in e&&(this.title=e.title),e.widthPx!==void 0&&(this.widthPx=Pa(e.widthPx)),e.collapsible!==void 0&&(this.collapsible=e.collapsible),this.#c(e),`panel`in e&&(this.#e=e.panel),this.#s(),super.setProps(e)}onRemove(){this.#t&&I(null,this.#t)}onRenderHTML(e){this.#t=e,e.style.margin=`0`,this.#s()}onViewportChange(){this.#s()}#o=e=>{this.#i||(this.isOpen=e),this.#a?.(e),this.#s()};#s=()=>{this.#t&&(this.#n=La(this.#t),I(L(Fa,{panel:this.#e,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#o}),this.#t))};#c(e){if(this.#i=e.open!==void 0,e.onOpenChange!==void 0&&(this.#a=e.onOpenChange),e.open!==void 0){this.isOpen=e.open,this.#r=!0;return}!this.#r&&e.defaultOpen!==void 0&&(this.isOpen=e.defaultOpen,this.#r=!0)}};Na=Ia;function U(e){e.stopPropagation()}function La(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow===`hidden`||n?.overflowX===`hidden`||n?.overflowY===`hidden`)&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}var Ra=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...t===void 0?{}:{maxHeight:`${t}px`},boxSizing:`border-box`,display:`flex`,flexDirection:`column`,pointerEvents:`auto`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`12px`,background:`var(--menu-background, rgba(255, 255, 255, 0.96))`,backdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))`,overflow:`hidden`}),za={padding:`14px 16px 10px`,fontSize:`18px`,fontWeight:700,lineHeight:1.2,color:`var(--button-text, currentColor)`},Ba={width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`12px`,border:`none`,background:`none`,color:`inherit`,padding:`0`,margin:`0`,cursor:`pointer`,font:`inherit`,textAlign:`left`},Va=e=>({fontSize:`18px`,lineHeight:1,color:`var(--button-icon-idle, #616166)`,transform:e?`translateY(1px)`:`translateY(-1px)`}),Ha=e=>({display:e?`block`:`none`,flex:`1 1 auto`,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`0 16px 16px`});function Ua(e,t){let[n,r]=B(t),i=e!==void 0,a=i?e:n;return V(()=>{i&&r(e)},[i,e]),[a,ma(e=>{i||r(e)},[i])]}var Wa=class extends qr{static defaultProps={...qr.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){I(P(Ea,{panel:this},this.content),e)}onRemove(){this.rootElement&&I(null,this.rootElement)}},Ga=class extends Wa{constructor({panels:e,id:t=`tabbed-panels`,title:n=`Panels`,tabListLayout:r=`wrap`,theme:i=`inherit`}){super({id:t,title:n,theme:i,content:L(Ka,{panels:e,tabListLayout:r})})}};function Ka({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=Ua(r,n),c=H(()=>e.filter(e=>!e.disabled),[e]),l=H(()=>o&&c.some(e=>e.id===o)?o:c[0]?.id,[o,c]);return V(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),L(`div`,{className:t,style:qa,children:[L(`div`,{"data-panel-tabs":``,style:Ja(a),children:e.map(e=>{let t=e.id===l;return L(`button`,{type:`button`,style:{...Ya,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border, rgba(148, 163, 184, 0.35))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onPointerDown:t=>{if(e.disabled){t.stopPropagation();return}t.preventDefault(),s(e.id),i?.(e.id)},children:e.title},e.id)})}),L(`div`,{style:Xa,children:e.map(e=>{let t=e.id===l;return L(`div`,{"aria-hidden":!t,style:{...Za,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:L(Ea,{panel:e,children:e.content})},e.id)})})]})}var qa={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--button-corner-radius, 8px)`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,color:`var(--menu-text, rgb(24, 24, 26))`};function Ja(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`4px`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`4px 6px`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var Ya={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`4px`,margin:0,padding:`4px 8px`,fontSize:`12px`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},Xa={display:`grid`,alignItems:`start`,padding:`10px`,overflow:`auto`},Za={gridArea:`1 / 1`,minWidth:0};function Qa({className:e,onRenderHTML:t}){let n=pa(null);return fa(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),L(`div`,{ref:n,className:e})}var $a=class extends Wa{constructor({id:e,title:t,onRenderHTML:n,disabled:r,keepMounted:i,className:a,theme:o=`inherit`}){super({id:e,title:t,theme:o,disabled:r,keepMounted:i,content:L(Qa,{className:a,onRenderHTML:n})})}};function eo(e,t){let n=po(t);if(!n.length)return;let r=e;for(let e of n){if(!fo(r))return;r=r[e]}return r}function to(e,t,n){let r=e;return Number.isFinite(t)&&(r=Math.max(t,r)),Number.isFinite(n)&&(r=Math.min(n,r)),r}function no(e,t,n){let r=po(t);if(!r.length)return e;let i={...e},a=i,o=e;return r.forEach((e,t)=>{if(t===r.length-1){a[e]=n;return}let i=o[e],s=fo(i)?{...i}:{};a[e]=s,a=s,o=fo(i)?i:{}}),i}function ro(e,t){return e.id?.trim()||e.name?.trim()||`section-${t}`}function io(e){return e.initiallyCollapsed??!0}function ao(e){return e.reduce((e,t,n)=>(e[ro(t,n)]=io(t),e),{})}function oo(e){return fo(e)&&`label`in e&&`value`in e?{label:String(e.label),value:e.value,description:typeof e.description==`string`?e.description:void 0}:{label:String(e),value:e}}function so(e){return e&&e.persist?e.persist:`local-storage`}function co(e){return e.defaultValue===void 0?e.type===`boolean`?!1:e.type===`number`?Number.isFinite(e.min)?e.min:0:e.type===`select`?e.options?.length?oo(e.options[0]).value:``:e.type===`multi-select`?[]:``:e.defaultValue}function lo(e,t){let n=eo(t,e.name);if(e.type===`boolean`)return typeof n==`boolean`?n:co(e);if(e.type===`number`)return to(typeof n==`number`?n:Number.isFinite(Number(n))?Number(n):co(e),e.min,e.max);if(e.type===`select`){let t=(e.options??[]).map(oo),r=co(e),i=typeof n==`string`||typeof n==`number`||typeof n==`boolean`?n:r;if(!t.length)return String(i);let a=t.find(e=>e.value===i);return a?a.value:t[0].value}if(e.type===`multi-select`){if(Array.isArray(n))return n.filter(e=>typeof e==`string`&&e.length>0);let t=co(e);return Array.isArray(t)?t:[]}if(typeof n==`string`)return n;let r=co(e);return typeof r==`string`?r:String(r)}function uo(e,t){let n={};return t.forEach((t,r)=>{let i=ro(t,r);n[i]=e[i]??io(t)}),n}function fo(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function po(e){return e.split(`.`).map(e=>e.trim()).filter(Boolean)}function mo(e,t){for(var n in t)e[n]=t[n];return e}function ho(e,t){for(var n in e)if(n!==`__source`&&!(n in t))return!0;for(var r in t)if(r!==`__source`&&e[r]!==t[r])return!0;return!1}function go(e,t){this.props=e,this.context=t}(go.prototype=new F).isPureReactComponent=!0,go.prototype.shouldComponentUpdate=function(e,t){return ho(this.props,e)||ho(this.state,t)};var _o=j.__b;j.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),_o&&_o(e)},typeof Symbol<`u`&&Symbol.for;var vo=j.__e;j.__e=function(e,t,n,r){if(e.then){for(var i,a=t;a=a.__;)if((i=a.__c)&&i.__c)return t.__e??(t.__e=n.__e,t.__k=n.__k),i.__c(e,t)}vo(e,t,n,r)};var yo=j.unmount;function bo(e,t,n){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(e){typeof e.__c==`function`&&e.__c()}),e.__c.__H=null),(e=mo({},e)).__c!=null&&(e.__c.__P===n&&(e.__c.__P=t),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(e){return bo(e,t,n)})),e}function xo(e,t,n){return e&&n&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(e){return xo(e,t,n)}),e.__c&&e.__c.__P===t&&(e.__e&&n.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=n)),e}function So(){this.__u=0,this.o=null,this.__b=null}function Co(e){var t=e.__&&e.__.__c;return t&&t.__a&&t.__a(e)}function wo(){this.i=null,this.l=null}j.unmount=function(e){var t=e.__c;t&&(t.__z=!0),t&&t.__R&&t.__R(),t&&32&e.__u&&(e.type=null),yo&&yo(e)},(So.prototype=new F).__c=function(e,t){var n=t.__c,r=this;r.o??=[],r.o.push(n);var i=Co(r.__v),a=!1,o=function(){a||r.__z||(a=!0,n.__R=null,i?i(c):c())};n.__R=o;var s=n.__P;n.__P=null;var c=function(){if(!--r.__u){if(r.state.__a){var e=r.state.__a;r.__v.__k[0]=xo(e,e.__c.__P,e.__c.__O)}var t;for(r.setState({__a:r.__b=null});t=r.o.pop();)t.__P=s,t.forceUpdate()}};r.__u++||32&t.__u||r.setState({__a:r.__b=r.__v.__k[0]}),e.then(o,o)},So.prototype.componentWillUnmount=function(){this.o=[]},So.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var n=document.createElement(`div`),r=this.__v.__k[0].__c;this.__v.__k[0]=bo(this.__b,n,r.__O=r.__P)}this.__b=null}var i=t.__a&&P(ki,null,e.fallback);return i&&(i.__u&=-33),[P(ki,null,t.__a?null:e.children),i]};var To=function(e,t,n){if(++n[1]===n[0]&&e.l.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!==`t`||!e.l.size))for(n=e.i;n;){for(;n.length>3;)n.pop()();if(n[1]<n[0])break;e.i=n=n[2]}};function Eo(e){return this.getChildContext=function(){return e.context},e.children}function Do(e){var t=this,n=e.h;if(t.componentWillUnmount=function(){I(null,t.v),t.v=null,t.h=null},t.h&&t.h!==n&&t.componentWillUnmount(),!t.v){for(var r=t.__v;r!==null&&!r.__m&&r.__!==null;)r=r.__;t.h=n,t.v={nodeType:1,parentNode:n,childNodes:[],__k:{__m:r.__m},contains:function(){return!0},namespaceURI:n.namespaceURI,insertBefore:function(e,n){this.childNodes.push(e),t.h.insertBefore(e,n)},removeChild:function(e){this.childNodes.splice(this.childNodes.indexOf(e)>>>1,1),t.h.removeChild(e)}}}I(P(Eo,{context:t.context},e.__v),t.v)}function Oo(e,t){var n=P(Do,{__v:e,h:t});return n.containerInfo=t,n}(wo.prototype=new F).__a=function(e){var t=this,n=Co(t.__v),r=t.l.get(e);return r[0]++,function(i){var a=function(){t.props.revealOrder?(r.push(i),To(t,e,r)):i()};n?n(a):a()}},wo.prototype.render=function(e){this.i=null,this.l=new Map;var t=Ri(e.children);e.revealOrder&&e.revealOrder[0]===`b`&&t.reverse();for(var n=t.length;n--;)this.l.set(t[n],this.i=[1,0,this.i]);return e.children},wo.prototype.componentDidUpdate=wo.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(t,n){To(e,n,t)})};var ko=typeof Symbol<`u`&&Symbol.for&&Symbol.for(`react.element`)||60103,Ao=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,jo=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,Mo=/[A-Z0-9]/g,No=typeof document<`u`,Po=function(e){return(typeof Symbol<`u`&&typeof Symbol()==`symbol`?/fil|che|rad/:/fil|che|ra/).test(e)};F.prototype.isReactComponent=!0,[`componentWillMount`,`componentWillReceiveProps`,`componentWillUpdate`].forEach(function(e){Object.defineProperty(F.prototype,e,{configurable:!0,get:function(){return this[`UNSAFE_`+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var Fo=j.event;j.event=function(e){return Fo&&(e=Fo(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Io={configurable:!0,get:function(){return this.class}},Lo=j.vnode;j.vnode=function(e){typeof e.type==`string`&&function(e){var t=e.props,n=e.type,r={},i=n.indexOf(`-`)==-1;for(var a in t){var o=t[a];if(!(a===`value`&&`defaultValue`in t&&o==null||No&&a===`children`&&n===`noscript`||a===`class`||a===`className`)){var s=a.toLowerCase();a===`defaultValue`&&`value`in t&&t.value==null?a=`value`:a===`download`&&!0===o?o=``:s===`translate`&&o===`no`?o=!1:s[0]===`o`&&s[1]===`n`?s===`ondoubleclick`?a=`ondblclick`:s!==`onchange`||n!==`input`&&n!==`textarea`||Po(t.type)?s===`onfocus`?a=`onfocusin`:s===`onblur`?a=`onfocusout`:jo.test(a)&&(a=s):s=a=`oninput`:i&&Ao.test(a)?a=a.replace(Mo,`-$&`).toLowerCase():o===null&&(o=void 0),s===`oninput`&&r[a=s]&&(a=`oninputCapture`),r[a]=o}}n==`select`&&(r.multiple&&Array.isArray(r.value)&&(r.value=Ri(t.children).forEach(function(e){e.props.selected=r.value.indexOf(e.props.value)!=-1})),r.defaultValue!=null&&(r.value=Ri(t.children).forEach(function(e){e.props.selected=r.multiple?r.defaultValue.indexOf(e.props.value)!=-1:r.defaultValue==e.props.value}))),t.class&&!t.className?(r.class=t.class,Object.defineProperty(r,`className`,Io)):t.className&&(r.class=r.className=t.className),e.props=r}(e),e.$$typeof=ko,Lo&&Lo(e)};var Ro=j.__r;j.__r=function(e){Ro&&Ro(e),e.__c};var zo=j.diffed;j.diffed=function(e){zo&&zo(e);var t=e.props,n=e.__e;n!=null&&e.type===`textarea`&&`value`in t&&t.value!==n.value&&(n.value=t.value==null?``:t.value)};function Bo({id:e,ariaLabel:t,value:n,options:r,onChange:i,fontSize:a,placeholder:o=`All`,trailingIcon:s,style:c}){let l=pa(null),u=pa(null),[d,f]=B(!1),[p,m]=B(``),[h,g]=B(G.menu),_=H(()=>n.filter(e=>typeof e==`string`&&e.length>0),[n]),v=H(()=>Ho(r,_),[r,_]),y=H(()=>new Set(_),[_]),b=H(()=>{let e=p.trim().toLowerCase();return e?v.filter(t=>t.label.toLowerCase().includes(e)||t.value.toLowerCase().includes(e)):v},[v,p]),x=`${e??t.toLowerCase().replace(/[^a-z0-9]+/g,`-`)}-options`,ee=Uo(_,v,o);V(()=>{let e=l.current?.ownerDocument;if(!d||!e)return;let t=e=>{let t=l.current,n=u.current;!t||!e.target||t.contains(e.target)||n?.contains(e.target)||f(!1)};return e.addEventListener(`pointerdown`,t),()=>e.removeEventListener(`pointerdown`,t)},[d]),fa(()=>{let e=l.current?.ownerDocument?.defaultView;if(!d||!l.current||!e)return;let t=()=>{let e=l.current;if(!e)return;let t=e.getBoundingClientRect();g({...G.menu,top:`${t.bottom+4}px`,left:`${t.left}px`,width:`${t.width}px`})};return t(),e.addEventListener(`resize`,t),e.addEventListener(`scroll`,t,!0),()=>{e.removeEventListener(`resize`,t),e.removeEventListener(`scroll`,t,!0)}},[d]);let te=e=>{i(y.has(e.value)?_.filter(t=>t!==e.value):[..._,e.value])};return L(`div`,{ref:l,style:{...G.shell,...c},onPointerDown:e=>W(e),onMouseDown:e=>W(e),onWheel:e=>W(e),onClick:e=>W(e),children:[L(`button`,{id:e,type:`button`,"aria-label":t,"aria-haspopup":`listbox`,"aria-expanded":d,"aria-controls":d?x:void 0,style:{...G.button,...a===void 0?{}:{fontSize:a},...d?G.buttonOpen:{},opacity:v.length?1:.58,cursor:v.length?`pointer`:`default`},disabled:!v.length,onClick:()=>f(e=>!e),onKeyDown:e=>{W(e),(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),f(e=>!e)),e.key===`Escape`&&(e.preventDefault(),f(!1))},onKeyUp:e=>W(e),children:[L(`span`,{style:G.summaryText,children:ee}),s??L(Vo,{})]}),d&&l.current?.ownerDocument.body?Oo(L(`div`,{ref:u,id:x,role:`listbox`,"aria-label":`${t} options`,"aria-multiselectable":`true`,style:h,onPointerDown:e=>W(e),onMouseDown:e=>W(e),onWheel:e=>W(e),onClick:e=>W(e),children:[L(`input`,{"aria-label":`${t} search`,type:`search`,value:p,placeholder:`Search...`,style:{...G.searchInput,...a===void 0?{}:{fontSize:a}},onInput:e=>m(e.currentTarget.value),onKeyDown:e=>W(e),onKeyUp:e=>W(e)}),b.map(e=>{let t=y.has(e.value);return L(`button`,{type:`button`,role:`option`,"aria-selected":t,style:{...G.option,...a===void 0?{}:{fontSize:a},...t?G.optionSelected:{}},onMouseDown:e=>{e.preventDefault(),W(e)},onClick:()=>te(e),children:[L(`span`,{children:e.label}),t?L(`span`,{"aria-hidden":!0,children:`✓`}):null]},e.value)}),b.length===0?L(`div`,{style:{...G.emptyState,...a===void 0?{}:{fontSize:a}},children:`No matching options`}):null,_.length>0?L(`button`,{type:`button`,style:{...G.clearButton,...a===void 0?{}:{fontSize:a}},onMouseDown:e=>{e.preventDefault(),W(e)},onClick:()=>i([]),children:`Clear selection`}):null]}),l.current.ownerDocument.body):null]})}function Vo(){return L(`svg`,{viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.8`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,style:G.chevron,children:L(`path`,{d:`m6 9 6 6 6-6`})})}function Ho(e,t){let n=new Set(e.map(e=>e.value));return[...e,...t.filter(e=>!n.has(e)).map(e=>({label:e,value:e}))]}function Uo(e,t,n){if(e.length===0)return n;let r=new Map(t.map(e=>[e.value,e.label])),i=e.map(e=>r.get(e)??e);return i.length<=2?i.join(`, `):`${i.length} selected`}function W(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation()}var G={shell:{position:`relative`,width:`100%`,minWidth:0},button:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:12,width:`100%`,minHeight:36,borderRadius:13,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.24))`,background:`var(--menu-background, rgba(51, 65, 85, 0.78))`,color:`var(--menu-text, #f8fafc)`,padding:`0 14px`,font:`inherit`,fontSize:12,fontWeight:650,textAlign:`left`,cursor:`pointer`},buttonOpen:{borderColor:`var(--button-icon-hover, rgba(96, 165, 250, 0.78))`,boxShadow:`0 0 0 2px rgba(96, 165, 250, 0.16)`},menu:{position:`fixed`,zIndex:1e4,display:`grid`,gap:2,maxHeight:260,overflow:`auto`,borderRadius:13,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.28))`,background:`var(--menu-background, #334155)`,boxShadow:`var(--menu-shadow, 0 16px 34px rgba(0, 0, 0, 0.32))`,padding:4},option:{minHeight:30,border:`none`,borderRadius:9,background:`transparent`,color:`var(--menu-text, #f8fafc)`,font:`inherit`,fontSize:12,fontWeight:430,textAlign:`left`,cursor:`pointer`,padding:`0 10px`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:8},optionActive:{background:`var(--menu-item-hover, rgba(148, 163, 184, 0.16))`},optionSelected:{background:`var(--button-background, rgba(96, 165, 250, 0.36))`,color:`var(--menu-text, #f8fafc)`,fontWeight:520},summaryText:{minWidth:0,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},searchInput:{minHeight:30,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.28))`,borderRadius:9,background:`var(--button-background, rgba(15, 23, 42, 0.22))`,color:`var(--menu-text, #f8fafc)`,font:`inherit`,fontSize:12,padding:`0 10px`,outline:`none`},emptyState:{color:`var(--button-text, #94a3b8)`,fontSize:12,padding:`8px 10px`},clearButton:{minHeight:30,border:`none`,borderRadius:9,background:`transparent`,color:`var(--button-text, #94a3b8)`,font:`inherit`,fontSize:12,fontWeight:520,textAlign:`left`,cursor:`pointer`,padding:`0 10px`},chevron:{width:18,height:18,flex:`0 0 auto`,color:`var(--button-text, #94a3b8)`,pointerEvents:`none`}},Wo=new WeakMap,Go={position:`relative`,width:`100%`,minWidth:0},Ko={width:`100%`,minHeight:`32px`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:`8px`,border:`var(--button-inner-stroke, 1px solid rgba(148, 163, 184, 0.48))`,borderRadius:`var(--button-corner-radius, 8px)`,background:`var(--button-background, rgba(255, 255, 255, 0.94))`,color:`var(--button-text, currentColor)`,boxSizing:`border-box`,padding:`6px 8px 6px 10px`,fontSize:`12px`,fontWeight:600,cursor:`pointer`,boxShadow:`none`,outline:`none`},qo={borderColor:`var(--button-icon-hover, rgba(59, 130, 246, 0.82))`,boxShadow:`0 0 0 2px rgba(59, 130, 246, 0.16)`},Jo={overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,textAlign:`left`},Yo={width:`16px`,height:`16px`,display:`inline-flex`,alignItems:`center`,justifyContent:`center`,color:`var(--button-icon-idle, currentColor)`,fontSize:`10px`,lineHeight:1,transition:`transform 120ms ease`},Xo={position:`fixed`,zIndex:1e4,width:`max-content`,maxWidth:`calc(100vw - 16px)`,maxHeight:`192px`,overflowX:`hidden`,overflowY:`auto`,padding:`4px`,border:`var(--button-inner-stroke, 1px solid rgba(148, 163, 184, 0.48))`,borderRadius:`var(--button-corner-radius, 8px)`,background:`var(--container-background, var(--button-background, rgba(255, 255, 255, 0.98)))`,color:`var(--button-text, currentColor)`,boxShadow:`0 12px 28px rgba(15, 23, 42, 0.18)`,boxSizing:`border-box`},Zo={width:`100%`,minHeight:`28px`,border:0,borderRadius:`calc(var(--button-corner-radius, 8px) - 1px)`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:`8px`,margin:0,padding:`5px 8px`,background:`transparent`,color:`var(--button-text, currentColor)`,cursor:`pointer`,fontSize:`12px`,textAlign:`left`},Qo={minWidth:0,display:`grid`,gap:`1px`},$o={whiteSpace:`nowrap`,textAlign:`left`},es={color:`var(--button-icon-idle, currentColor)`,fontSize:`11px`,fontWeight:400,lineHeight:1.25,opacity:.78,textAlign:`left`,whiteSpace:`normal`},ts={background:`var(--menu-item-hover, rgba(148, 163, 184, 0.16))`},ns={color:`var(--button-icon-hover, currentColor)`,fontWeight:700};function K(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation()}function rs(e,t){return e.findIndex(e=>e.value===t)}function is(e,t,n){return n===0?-1:((e>=0?e:t>0?-1:0)+t+n)%n}function as(e,t){let n=e.ownerDocument,r=Wo.get(n);r&&r.root!==e&&r.close(),Wo.set(n,{close:t,root:e})}function os(e){let t=e.ownerDocument;Wo.get(t)?.root===e&&Wo.delete(t)}function ss({id:e,label:t,value:n,options:r,onValueChange:i,fontSize:a}){let[o,s]=B(!1),[c,l]=B(()=>rs(r,n)),[u,d]=B(Xo),f=pa(null),p=pa(null),m=pa([]),h=`${e}-listbox`,g=H(()=>rs(r,n),[r,n]),_=(g>=0?r[g]:void 0)?.label??String(n),v=()=>{let e=f.current;e&&os(e),s(!1)},y=()=>{let e=f.current;e&&as(e,v),s(!0)},b=e=>{i(e.value),v()};V(()=>{m.current=m.current.slice(0,r.length)},[r.length]),V(()=>{o||l(g)},[o,g]),V(()=>{let e=f.current?.ownerDocument;if(!o||!e)return;let t=e=>{if(!f.current||!e.target)return;let t=e.target;!f.current.contains(t)&&!p.current?.contains(t)&&v()};return e.addEventListener(`pointerdown`,t,!0),()=>{e.removeEventListener(`pointerdown`,t,!0)}},[o]),V(()=>{let e=f.current;if(!(!o||!e))return as(e,v),()=>{os(e)}},[o]),fa(()=>{let e=f.current?.ownerDocument,t=e?.defaultView;if(!o||!f.current||!t)return;let n=()=>{if(!f.current)return;let n=f.current.getBoundingClientRect(),r=e.documentElement.clientWidth||t.innerWidth||n.right,i=r-n.right<n.left,a=i?Math.max(r-n.right,8):Math.max(n.left,8),o=i?Math.max(n.right-8,0):Math.max(r-a-8,0);d({...Xo,top:`${n.bottom+4}px`,left:i?void 0:`${a}px`,right:i?`${a}px`:void 0,minWidth:`${Math.min(n.width,o)}px`,maxWidth:`${o}px`})};return n(),t.addEventListener(`resize`,n),t.addEventListener(`scroll`,n,!0),()=>{t.removeEventListener(`resize`,n),t.removeEventListener(`scroll`,n,!0)}},[o]),V(()=>{!o||c<0||m.current[c]?.scrollIntoView?.({block:`nearest`})},[c,o]);let x=()=>{if(o){v();return}y()},ee=e=>{if(K(e),e.key===`ArrowDown`||e.key===`ArrowUp`){e.preventDefault(),y(),l(t=>is(t,e.key===`ArrowDown`?1:-1,r.length));return}if(e.key===`Enter`||e.key===` `){if(e.preventDefault(),o&&c>=0){let e=r[c];e&&b(e);return}y(),l(g);return}e.key===`Escape`&&(e.preventDefault(),v())};return L(`div`,{ref:f,style:Go,onPointerDown:e=>K(e),onMouseDown:e=>K(e),onWheel:e=>K(e),onClick:e=>K(e),children:[L(`button`,{id:e,type:`button`,"aria-label":t,"aria-haspopup":`listbox`,"aria-expanded":o,"aria-controls":o?h:void 0,style:{...Ko,...a===void 0?{}:{fontSize:a},...o?qo:{},opacity:r.length?1:.58,cursor:r.length?`pointer`:`default`},disabled:!r.length,onClick:x,onKeyDown:ee,onKeyUp:e=>K(e),children:[L(`span`,{style:Jo,children:_}),L(`span`,{"aria-hidden":!0,style:{...Yo,transform:o?`rotate(180deg)`:`rotate(0deg)`},children:`▾`})]}),o&&f.current?.ownerDocument.body&&Oo(L(`div`,{ref:p,id:h,role:`listbox`,"aria-label":t,style:u,onPointerDown:e=>K(e),onMouseDown:e=>K(e),onWheel:e=>K(e),onClick:e=>K(e),children:r.map((t,n)=>{let r=n===g,i=n===c,o=t.description?.trim();return L(`button`,{ref:e=>{m.current[n]=e},type:`button`,role:`option`,"aria-selected":r,style:{...Zo,...a===void 0?{}:{fontSize:a},...i?ts:{},...r?ns:{}},onPointerEnter:()=>l(n),onMouseDown:e=>{e.preventDefault(),K(e)},onClick:()=>b(t),children:[L(`span`,{style:Qo,children:[L(`span`,{"data-select-option-label":`true`,style:$o,children:t.label}),o&&L(`span`,{"data-select-option-description":`true`,style:es,children:o})]}),r&&L(`span`,{"aria-hidden":!0,children:`✓`})]},`${e}-${n}-${String(t.value)}`)})}),f.current.ownerDocument.body)]})}var cs={width:`100%`,border:0,margin:0,padding:`8px 12px`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`8px`,background:`transparent`,color:`inherit`,cursor:`pointer`,fontSize:`12px`},ls={display:`grid`,gap:`8px`,padding:`8px 12px 12px 18px`},us={display:`grid`,gap:`8px`,padding:`10px 12px 12px`},ds={display:`grid`,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 1.4fr)`,alignItems:`center`,gap:`8px`},fs={fontSize:`12px`,fontWeight:600,color:`var(--button-text, currentColor)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},ps={width:`100%`,minWidth:0,display:`flex`,alignItems:`center`},ms={width:`100%`,border:`var(--button-inner-stroke, 1px solid rgba(128, 128, 128, 0.35))`,borderRadius:`calc(var(--button-corner-radius, 8px) - 2px)`,backgroundColor:`var(--button-background, #fff)`,backdropFilter:`var(--button-backdrop-filter, unset)`,color:`var(--button-text, currentColor)`,fontSize:`12px`,padding:`4px 6px`,boxSizing:`border-box`},hs={...ms,flex:1},gs={border:`var(--button-inner-stroke, 1px solid rgba(128, 128, 128, 0.35))`,borderRadius:`calc(var(--button-corner-radius, 8px) - 2px)`,backgroundColor:`var(--button-background, #fff)`,color:`var(--button-text, currentColor)`,fontSize:`11px`,padding:`4px 8px`,cursor:`pointer`,whiteSpace:`nowrap`},_s={width:`100%`,minWidth:`120px`,margin:0},vs={...ms,width:`84px`,flexShrink:0,height:`28px`,lineHeight:`16px`,padding:`2px 6px`},ys={width:`14px`,height:`14px`,margin:0,accentColor:`var(--button-icon-hover, currentColor)`};function bs(e,t){return t===void 0?e:{...e,fontSize:t}}function q(e){e.stopPropagation()}function xs(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation?.()}function Ss({fontSize:e,inputId:t,label:n,value:r,onApply:i}){let[a,o]=B(r),[s,c]=B(()=>r?[r]:[]),l=a!==r;V(()=>{o(r)},[r]),V(()=>{r&&c(e=>e.includes(r)?e:[r,...e].slice(0,8))},[r]);let u=e=>{o(e.currentTarget.value)},d=()=>{a!==r&&(i(a),c(e=>[a,...e.filter(e=>e!==a)].slice(0,8)))};return L(`div`,{style:ps,children:[L(`input`,{id:t,type:`text`,value:a,onInput:u,list:`${t}-recent-values`,onKeyDown:e=>{e.key===`Enter`&&(e.preventDefault(),d()),xs(e)},onKeyUp:xs,onPointerDown:xs,"aria-label":n,style:bs(hs,e)}),s.length>0&&L(`datalist`,{id:`${t}-recent-values`,children:s.map(e=>L(`option`,{value:e},`${t}-${e}`))}),L(`button`,{type:`button`,disabled:!l,style:{...bs(gs,e),opacity:l?1:.55,cursor:l?`pointer`:`default`,marginLeft:`6px`},onClick:d,onPointerDown:xs,onKeyDown:xs,onKeyUp:xs,children:l?`✓`:`✅`})]})}function Cs({fontSize:e,inputId:t,label:n,setting:r,value:i,onValueChange:a}){let o=Number.isFinite(r.min)&&Number.isFinite(r.max),s=to(i,r.min,r.max),c=ws(r),l=pa(null),[u,d]=B(s);V(()=>{d(s)},[s]),V(()=>()=>{Ts(l)},[]);let f=e=>{if(!Number.isFinite(e))return;let t=to(e,r.min,r.max);Ts(l),d(t),a(t)},p=e=>{if(!Number.isFinite(e))return;let t=to(e,r.min,r.max);if(d(t),c<=0){a(t);return}Ts(l),l.current=setTimeout(()=>{l.current=null,a(t)},c)};return o?L(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`,minWidth:0,width:`100%`},children:[L(`input`,{id:t,type:`range`,min:String(r.min),max:String(r.max),step:String(r.step??1),value:String(u),onInput:e=>p(Number(e.currentTarget.value)),"aria-label":n,style:_s}),L(`input`,{type:`number`,min:Number.isFinite(r.min)?String(r.min):void 0,max:Number.isFinite(r.max)?String(r.max):void 0,step:String(r.step??1),value:String(u),onInput:e=>f(Number(e.currentTarget.value)),onChange:e=>f(Number(e.currentTarget.value)),"aria-label":`${n} numeric value`,style:bs(vs,e)})]}):L(`input`,{id:t,type:`number`,step:String(r.step??1),value:String(u),onInput:e=>f(Number(e.currentTarget.value)),onChange:e=>f(Number(e.currentTarget.value)),"aria-label":n,style:bs(ms,e)})}function ws(e){return Number.isFinite(e.sliderDebounceMs)?Math.max(0,e.sliderDebounceMs):0}function Ts(e){e.current!=null&&(clearTimeout(e.current),e.current=null)}function Es({fontSize:e,setting:t,value:n,onValueChange:r}){let i=t.label??t.name,a=t.description?.trim(),o=`settings-panel-input-${t.name.replace(/[^a-zA-Z0-9_-]/g,`-`)}`,s=e=>{r(e.currentTarget.checked)},c;c=t.type===`boolean`?L(`input`,{id:o,type:`checkbox`,checked:!!n,onInput:s,onChange:s,"aria-label":i,style:ys}):t.type===`number`?L(Cs,{fontSize:e,inputId:o,label:i,setting:t,value:Number(n),onValueChange:r}):t.type===`select`?L(ss,{id:o,value:n,label:i,options:(t.options??[]).map(oo),onValueChange:r,fontSize:e}):t.type===`multi-select`?L(Bo,{id:o,ariaLabel:i,value:Array.isArray(n)?n.filter(e=>typeof e==`string`&&e.length>0):[],options:(t.options??[]).map(e=>{let t=oo(e);return{label:t.label,value:String(t.value)}}),onChange:r,fontSize:e}):L(Ss,{fontSize:e,inputId:o,label:i,value:String(n),onApply:r});let l=t.type===`select`||t.type===`multi-select`;return L(`div`,{"data-setting-row-for":t.name,style:ds,title:a,children:[L(`label`,{htmlFor:l?void 0:o,style:bs(fs,e),children:i}),L(`div`,{style:ps,children:c})]})}function Ds({contentStyle:e,fontSize:t,onValueChange:n,section:r,settings:i}){return L(`div`,{style:e,children:r.settings.map(e=>L(Es,{fontSize:t,setting:e,value:lo(e,i),onValueChange:t=>n(e.name,t)},e.name))})}function Os({fontSize:e,onSettingsChange:t,section:n,settings:r}){let[i,a]=B(r);return V(()=>{a(r)},[r]),L(`div`,{style:{minWidth:0,paddingBottom:`8px`},onPointerMove:e=>q(e),onMouseMove:e=>q(e),onPointerDown:e=>q(e),onMouseDown:e=>q(e),onWheel:e=>q(e),onClick:e=>q(e),onKeyDown:e=>q(e),onKeyUp:e=>q(e),children:L(Ds,{contentStyle:us,fontSize:e,onValueChange:(e,n)=>{a(r=>{let i=no(r,e,n);return t?.(i),i})},section:n,settings:i})})}var ks={sections:[]},As={};function js({fontSize:e,schema:t,settings:n,onSettingsChange:r}){let[i,a]=B(n),[o,s]=B(()=>ao(t.sections));V(()=>{a(n)},[n]),V(()=>{s(e=>uo(e,t.sections))},[t.sections]);let c=H(()=>t.sections.map((e,t)=>({key:ro(e,t),section:e})),[t.sections]),l=c.length===1&&!c[0].section.name&&!c[0].section.description,u=(e,t)=>{a(n=>{let i=no(n,e,t);return r?.(i),i})};return L(`div`,{style:{minWidth:0,paddingBottom:`8px`},onPointerMove:e=>q(e),onMouseMove:e=>q(e),onPointerDown:e=>q(e),onMouseDown:e=>q(e),onWheel:e=>q(e),onClick:e=>q(e),onKeyDown:e=>q(e),onKeyUp:e=>q(e),children:l?L(Ds,{contentStyle:ls,fontSize:e,onValueChange:u,section:c[0].section,settings:i}):c.map(({key:t,section:n})=>{let r=o[t]??!1;return L(`div`,{style:{borderBottom:`1px solid var(--menu-item-hover, rgba(128, 128, 128, 0.22))`},children:[L(`button`,{type:`button`,style:cs,onClick:()=>s(e=>({...e,[t]:!r})),"aria-expanded":!r,children:[L(`span`,{style:{display:`grid`,gap:`2px`,textAlign:`left`},children:[L(`span`,{style:{fontWeight:700,fontSize:`12px`},children:n.name}),n.description&&L(`span`,{style:{fontSize:`11px`,color:`var(--button-icon-idle, currentColor)`},children:n.description})]}),L(`span`,{"aria-hidden":!0,children:r?`▸`:`▾`})]}),!r&&L(Ds,{contentStyle:ls,fontSize:e,onValueChange:u,section:n,settings:i})]},t)})})}var Ms=class extends Wa{static createSectionPanels({label:e=`Settings`,schema:t=ks,settings:n=As,onSettingsChange:r,fontSize:i,theme:a=`inherit`}){return t.sections.map((t,o)=>new Ns({id:ro(t,o),title:t.name||e,theme:a,content:L(Os,{fontSize:i,onSettingsChange:r,section:t,settings:n})}))}constructor({id:e=`settings-panel`,label:t=`Settings`,schema:n=ks,settings:r=As,onSettingsChange:i,fontSize:a,theme:o=`inherit`}={}){super({id:e,title:n.title??t,theme:o,content:L(js,{fontSize:a,schema:n,settings:r,onSettingsChange:i})})}},Ns=class extends Wa{},Ps=class{#e={};#t;#n=new Set;#r=new Map;setLocalStoragePersistence(e){this.#t=e}getSettingsWithLocalStorage(e,t=this.#r){let n=this.getLocalStorageSettings(t),r=e;for(let[e,t]of Object.entries(n))r=no(r,e,t);return r}getLocalStorageSettings(e=this.#r){let t=this.#s(),n={};for(let[r,i]of e){let e=t[r];Bs(i)&&Is(e)&&(n[r]=lo(i,no({},r,e)))}return n}setCurrentSettings(e){this.#e=this.#a(e)}setOnSettingsChange(e){return e?(this.#n.add(e),()=>{this.#n.delete(e)}):()=>{}}setSettingDefinitions(e){this.#r=new Map(e)}emitSettingsChange(e,t){let n=this.#a(e),r=t??this.#i(n);if(r.length===0){this.#e=n;return}this.#e=n,this.#c(r,n),this.#n.forEach(e=>e(n,r))}setSettingValue(e,t){let n=this.#r.get(e),r=no(this.#e,e,Is(t)?t:``),i=n?lo(n,r):t,a=eo(this.#e,e);if(Ls(a,i))return;let o=no(this.#e,e,i),s=[{type:`setting`,name:e,previousValue:a,nextValue:i,descriptor:n}];this.emitSettingsChange(o,s)}setSettings(e){this.emitSettingsChange(e)}#i(e){let t=[];for(let[n,r]of this.#r){let i=eo(this.#e,n),a=eo(e,n);Ls(i,a)||t.push({type:`setting`,name:n,previousValue:i,nextValue:a,descriptor:r})}return t}#a(e){let t=e;for(let[n,r]of this.#r)eo(e,n)!==void 0&&(t=no(t,n,lo(r,t)));return t}#o(){return this.#t?.getStorage?this.#t.getStorage()??null:typeof window>`u`?null:window.localStorage}#s(){let e=this.#t?.storageKey,t=this.#o();if(!e||!t)return{};try{let n=t.getItem(e);if(!n)return{};let r=JSON.parse(n);return Fs(r)?r:{}}catch{return{}}}#c(e,t){let n=this.#t?.storageKey,r=this.#o();if(!n||!r)return;let i=this.#s(),a=!1;for(let n of e){if(!Bs(n.descriptor))continue;let e=eo(t,n.name);Is(e)&&(a=!0,i[n.name]=e)}if(a)try{if(Object.keys(i).length===0){r.removeItem(n);return}r.setItem(n,JSON.stringify(i))}catch{}}};function Fs(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function Is(e){return typeof e==`boolean`||typeof e==`number`||typeof e==`string`||zs(e)}function Ls(e,t){return Array.isArray(e)||Array.isArray(t)?Rs(e,t):Object.is(e,t)}function Rs(e,t){return!zs(e)||!zs(t)||e.length!==t.length?!1:e.every((e,n)=>e===t[n])}function zs(e){return Array.isArray(e)&&e.every(e=>typeof e==`string`)}function Bs(e){return so(e)===`local-storage`}new Ps;var Vs=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],Hs={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function Us(e,t){let n=Hs[t];for(let[t,r]of Vs)e.style.setProperty(r,n[t])}function Ws(e){for(let[,t]of Vs)e.style.removeProperty(t)}var Gs=`data-example-panel-host`,Ks=`data-example-settings-panel`,qs=`data-example-settings-sections`,Js=`example-source`,Ys=`/examples/`,Xs=new Set([`modelKind`,`renderMode`]),Zs=`data-example-panel-appearance`,Qs=`
[data-example-panel-host] [aria-hidden='true'] {
  display: none !important;
}
[data-example-panel-host][${Zs}='cinematic'] [data-panel-theme-mode] {
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
[${Ks}] [data-setting-row-for] > label,
[${Ks}] [data-setting-row-for] button,
[${Ks}] [data-setting-row-for] input[type='number'],
[${Ks}] [data-setting-row-for] input[type='text'],
[id^='settings-panel-input-'][role='listbox'] > button[role='option'] {
  font-size: 11px !important;
}
[${Ks}][${qs}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) {
  margin-top: 4px !important;
  padding: 8px !important;
  border-radius: 7px !important;
  background: rgba(70, 104, 159, 0.08) !important;
}
[${Ks}][${qs}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) > span:first-child > span:first-child {
  font-size: 11px !important;
  letter-spacing: 0.01em;
}
`;function $s(e,t){I(t?P(Ea,{panel:t},P(`style`,{},Qs),t.content):null,e)}function ec({id:e,title:t,html:n,onRender:r}){return new $a({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function tc({id:e,title:t,content:n}){return new $a({id:e,title:t,onRenderHTML:e=>(I(P(ki,{},n),e),()=>I(null,e))})}function nc(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===Js),i=ac()&&!r?[...e.panels,rc(t)]:e.panels;return new Ga({...n,panels:i})}function rc(e){return tc({id:Js,title:`Source`,content:P(ic,{sourcePaths:e})})}function ic({sourcePaths:e}){let[t,n]=B({});return V(()=>{let t=e??oc();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return sc(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?P(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):P(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},P(`code`,{},t.source??`// Loading source…`))}function ac(){return typeof window<`u`&&!!window.website}function oc(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(Ys);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function sc(e,t){let n=window.location.pathname.indexOf(Ys),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}var cc=class{id;label;sectionPresentation;settingsManager=new Ps;unsubscribe;schema;settings;constructor({id:e,label:t=`Settings`,schema:n,settings:r,sectionPresentation:i=`inline`,onSettingsChange:a,localStorageConfig:o}){this.id=e,this.label=t,this.sectionPresentation=i,this.schema=n,this.settings=r,this.settingsManager.setLocalStoragePersistence(o),this.setSchemaAndSettings(n,r),this.unsubscribe=this.settingsManager.setOnSettingsChange((e,t)=>{this.settings=e,a?.(e,t)})}getSettingsWithLocalStorage(e){return this.settingsManager.getSettingsWithLocalStorage(e)}setSchemaAndSettings(e,t){this.schema=e,this.settings=t,this.settingsManager.setSettingDefinitions(lc(e)),this.settingsManager.setCurrentSettings(t)}setSettings(e){this.settings=e,this.settingsManager.setCurrentSettings(e)}setSettingsFromPanel(e){this.settingsManager.setSettings(e)}setSettingValue(e,t){this.settingsManager.setSettingValue(e,t)}makePanel(){if(this.sectionPresentation===`accordion`)return dc(new Ms({id:this.id,label:this.label,schema:this.schema,settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)}),this.sectionPresentation);let[e]=Ms.createSectionPanels({label:this.label,schema:uc(this.schema),settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)});return e?(e.setProps({id:this.id,title:this.schema.title??this.label}),dc(e)):dc(new Ms({id:this.id,label:this.label,schema:uc(this.schema),settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)}))}finalize(){this.unsubscribe()}};function lc(e){let t=new Map;for(let n of e.sections)for(let e of n.settings)t.set(e.name,e);return t}function uc(e){let t=e.sections.flatMap(e=>e.settings);return{title:e.title,sections:[{id:`settings`,name:``,initiallyCollapsed:!1,settings:[...t.filter(e=>Xs.has(e.name)),...t.filter(e=>!Xs.has(e.name))]}]}}function dc(e,t=`inline`){return e.setProps({content:P(`div`,{[Ks]:``,[qs]:t},e.content)}),e}function fc(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute(Gs,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(Zs,r),r===`cinematic`||r===`light`?Us(e,r):Ws(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?Hs[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}function pc(e){let t=document.querySelector(`#hud`),n=document.querySelector(`#galaxy-info`);Us(n,`cinematic`);let r={speed:1,aperture:.2,paused:!1},i=null,a=new cc({id:`galaxy-settings`,label:`Controls`,schema:{title:`Controls`,sections:[{id:`animation`,name:``,settings:[{name:`speed`,label:`Speed`,type:`number`,min:0,max:3,step:.05,persist:`none`},{name:`aperture`,label:`Aperture`,type:`number`,min:0,max:1.5,step:.05,persist:`none`},{name:`paused`,label:`Pause`,type:`boolean`,persist:`none`}]}]},settings:r,onSettingsChange:e=>{typeof e.speed==`number`&&(r.speed=e.speed),typeof e.aperture==`number`&&(r.aperture=e.aperture),typeof e.paused==`boolean`&&(r.paused=e.paused),i&&$s(i,a.makePanel())}}),o=new Ia({id:`galaxy-info-box`,title:`Galactic Vortex`,placement:`top-left`,widthPx:340,collapsible:!0,defaultOpen:!0,panel:nc({id:`galaxy-info-tabs`,theme:`dark`,panels:[ec({id:`galaxy-controls`,title:`Controls`,html:``,onRender:e=>(fc(e,`cinematic`),t.hidden=!1,e.append(t),i=document.createElement(`div`),fc(i,`cinematic`),e.append(i),$s(i,a.makePanel()),()=>{i&&=($s(i,null),i.remove(),null),t.hidden=!0,document.body.append(t)})}),ec({id:`galaxy-info`,title:`Info`,html:`<h3>GPU architecture</h3><p>A luma GPU graph calculates star positions and colors in buffers shared with Three.js, without per-frame geometry readback or upload. Graph and Trace show the animation pass; Three rendering and postprocessing are submitted separately.</p>`,onRender:e=>fc(e,`cinematic`)}),e.inspectorPanel.panel,e.tracePanel.panel,ec({id:`example-source`,title:`Source`,html:``,onRender:e=>{fc(e,`cinematic`);let t=document.createElement(`pre`);return t.style.cssText=`margin:0;max-height:60vh;overflow:auto;font:11px/1.5 monospace;white-space:pre-wrap;overflow-wrap:anywhere`,t.textContent=Kr,e.append(t),()=>t.remove()}})]})}),s=new si({parentElement:n});return s.setProps({components:[o]}),s.onRedraw({viewports:[],layers:[]}),{settings:r,update(){s.onRedraw({viewports:[],layers:[]})},destroy(){s.finalize(),a.finalize(),e.clear(),n.remove()}}}function mc(e){let t=/^(r|rg|rgba|bgra)(8unorm|8snorm|16float|32float)(-srgb)?$/.exec(e.format??``);if(!t||!e.width||!e.height)return;let n=t[1]===`r`?1:t[1]===`rg`?2:4,r=t[2],i=r===`16float`?2:r===`32float`?4:1,a=e.width*e.height;if(e.data.byteLength!==a*n*i)return;let o=new DataView(e.data.buffer,e.data.byteOffset,e.data.byteLength),s=new Uint8ClampedArray(a*4),c=e=>{let t=e*i;if(r===`8unorm`)return o.getUint8(t)/255;if(r===`8snorm`)return Math.max(-1,o.getInt8(t)/127);if(r===`32float`)return o.getFloat32(t,!0);let n=o.getUint16(t,!0),a=n&32768?-1:1,s=n>>10&31,c=n&1023;return a*(s===31?c?NaN:1/0:s===0?c*2**-24:(1+c/1024)*2**(s-15))};for(let e=0;e<a;e++)for(let r=0;r<4;r++){let i=t[1]===`bgra`&&r<3?2-r:r,a=r===3?1:0;i<n?a=c(e*n+i):n===1&&r<3&&(a=c(e)),a=Number.isNaN(a)?0:Math.max(0,Math.min(1,a)),r<3&&!t[3]&&(a=a<=.0031308?12.92*a:1.055*a**(1/2.4)-.055),s[e*4+r]=Math.round(a*255)}return s}function hc(e,t){let n=mc(t);if(!n)return;let r=e.createElement(`canvas`);return r.width=t.width,r.height=t.height,r.setAttribute(`role`,`img`),r.setAttribute(`aria-label`,`Current texture allocation, top-left ${r.width} by ${r.height} pixels; display range 0 to 1`),r.title=`Current allocation · top-left crop · display range 0–1`,r.getContext(`2d`)?.putImageData(new ImageData(n,r.width,r.height),0,0),r.style.cssText=`width:${128*r.width/Math.max(r.width,r.height)}px;max-width:100%;height:auto;image-rendering:pixelated;background:repeating-conic-gradient(#888 0% 25%,#bbb 0% 50%) 0/12px 12px`,r}var gc=1,_c=class{element;document;trigger;valueElement;listbox;ariaLabel;onChange;options;selectedValue=null;activeIndex=-1;disabled;openState=!1;destroyed=!1;typeaheadText=``;typeaheadTimer=null;constructor(e,t){this.document=e.ownerDocument,this.options=[...t.options],this.ariaLabel=t.ariaLabel??`Select option`,this.onChange=t.onChange,this.disabled=t.disabled??!1;let n=gc++,r=`compact-dropdown-trigger-${n}`,i=`compact-dropdown-listbox-${n}`;this.element=this.document.createElement(`div`),this.element.dataset.compactDropdown=``,this.element.innerHTML=`<style>${vc}</style>`,this.trigger=this.document.createElement(`button`),this.trigger.id=r,this.trigger.type=`button`,this.trigger.setAttribute(`role`,`combobox`),this.trigger.setAttribute(`aria-label`,this.ariaLabel),this.trigger.setAttribute(`aria-haspopup`,`listbox`),this.trigger.setAttribute(`aria-controls`,i),this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.dataset.compactDropdownTrigger=``,this.valueElement=this.document.createElement(`span`),this.valueElement.dataset.compactDropdownValue=``;let a=this.document.createElement(`span`);a.dataset.compactDropdownChevron=``,a.setAttribute(`aria-hidden`,`true`),this.trigger.append(this.valueElement,a),this.element.append(this.trigger),this.listbox=this.document.createElement(`div`),this.listbox.id=i,this.listbox.hidden=!0,this.listbox.setAttribute(`role`,`listbox`),this.listbox.setAttribute(`aria-label`,this.ariaLabel),this.listbox.dataset.compactDropdownPopup=``,e.append(this.element),this.document.body.append(this.listbox),this.trigger.addEventListener(`click`,this.handleTriggerClick),this.trigger.addEventListener(`keydown`,this.handleKeyDown),this.listbox.addEventListener(`click`,this.handleOptionClick),this.listbox.addEventListener(`pointermove`,this.handleOptionPointerMove),this.document.addEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.addEventListener(`focusin`,this.handleDocumentFocusIn),this.renderOptions();let o=t.value??this.getFirstEnabledOption()?.value;o!==void 0&&this.setValue(o),this.updateDisabledState()}get value(){return this.selectedValue}set value(e){e===null?(this.selectedValue=null,this.activeIndex=-1,this.updateSelection()):this.setValue(e)}setValue(e,t={}){let n=this.options.find(t=>t.value===e);if(!n)return!1;let r=this.selectedValue!==e;return this.selectedValue=e,this.activeIndex=this.options.indexOf(n),this.updateSelection(),r&&t.emitChange&&this.onChange?.(e,n),!0}setOptions(e){this.options=[...e],this.selectedValue=this.options.find(e=>e.value===this.selectedValue)?.value??this.getFirstEnabledOption()?.value??null,this.activeIndex=this.getSelectedIndex(),this.renderOptions(),this.updateSelection(),this.updateDisabledState(),this.openState&&this.updatePopupPosition()}setDisabled(e){this.disabled=e,this.updateDisabledState(),this.trigger.disabled&&this.close()}focus(){this.trigger.focus()}open(){this.openState||this.trigger.disabled||this.destroyed||(this.openState=!0,this.activeIndex=this.getSelectedIndex(),this.activeIndex<0&&(this.activeIndex=this.getNextEnabledIndex(-1,1)),this.listbox.hidden=!1,this.trigger.setAttribute(`aria-expanded`,`true`),this.element.dataset.open=`true`,this.updateActiveOption(!0),this.updatePopupPosition(),this.document.defaultView?.addEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.addEventListener(`scroll`,this.handleViewportChange,!0))}close(e={}){this.openState&&(this.openState=!1,this.listbox.hidden=!0,this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.removeAttribute(`aria-activedescendant`),delete this.element.dataset.open,this.document.defaultView?.removeEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.removeEventListener(`scroll`,this.handleViewportChange,!0),e.restoreFocus&&this.trigger.focus())}destroy(){this.destroyed||(this.close(),this.destroyed=!0,this.trigger.removeEventListener(`click`,this.handleTriggerClick),this.trigger.removeEventListener(`keydown`,this.handleKeyDown),this.listbox.removeEventListener(`click`,this.handleOptionClick),this.listbox.removeEventListener(`pointermove`,this.handleOptionPointerMove),this.document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.removeEventListener(`focusin`,this.handleDocumentFocusIn),this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.listbox.remove(),this.element.remove())}handleTriggerClick=()=>{this.openState?this.close():this.open()};handleKeyDown=e=>{switch(e.key){case`ArrowDown`:e.preventDefault(),this.openState?this.moveActiveOption(1):this.open();break;case`ArrowUp`:e.preventDefault(),this.openState?this.moveActiveOption(-1):this.open();break;case`Home`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(-1,1));break;case`End`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(this.options.length,-1));break;case`Enter`:case` `:e.preventDefault(),this.openState?this.selectActiveOption():this.open();break;case`Escape`:this.openState&&(e.preventDefault(),this.close({restoreFocus:!0}));break;case`Tab`:this.close();break;default:e.key.length===1&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.preventDefault(),this.openState||this.open(),this.moveActiveOptionByText(e.key));break}};handleOptionClick=e=>{let t=this.getOptionIndex(e.target);t<0||this.options[t]?.disabled||(this.activeIndex=t,this.selectActiveOption())};handleOptionPointerMove=e=>{let t=this.getOptionIndex(e.target);t>=0&&!this.options[t]?.disabled&&t!==this.activeIndex&&this.setActiveIndex(t)};handleDocumentPointerDown=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleDocumentFocusIn=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleViewportChange=()=>{this.openState&&this.updatePopupPosition()};renderOptions(){this.listbox.replaceChildren(...this.options.map((e,t)=>{let n=this.document.createElement(`div`);n.id=`${this.listbox.id}-option-${t}`,n.setAttribute(`role`,`option`),n.setAttribute(`aria-selected`,String(e.value===this.selectedValue)),e.disabled&&n.setAttribute(`aria-disabled`,`true`),n.dataset.compactDropdownOption=``,n.dataset.optionIndex=String(t);let r=this.document.createElement(`span`);r.textContent=e.label;let i=this.document.createElement(`span`);return i.dataset.compactDropdownStatus=``,i.setAttribute(`aria-hidden`,`true`),n.append(r,i),n}))}updateSelection(){let e=this.options.find(e=>e.value===this.selectedValue);this.valueElement.textContent=e?.label??`—`,this.trigger.title=e?.label??this.ariaLabel;for(let[e,t]of this.getOptionElements().entries())t.setAttribute(`aria-selected`,String(this.options[e]?.value===this.selectedValue));this.updateActiveOption(!1)}updateDisabledState(){this.trigger.disabled=this.disabled||!this.options.some(e=>!e.disabled)}moveActiveOption(e){this.setActiveIndex(this.getNextEnabledIndex(this.activeIndex,e))}moveActiveOptionByText(e){this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.typeaheadText+=e.toLocaleLowerCase();let t=this.getMatchingOptionIndex(this.typeaheadText);t<0&&this.typeaheadText.length>1&&(this.typeaheadText=e.toLocaleLowerCase(),t=this.getMatchingOptionIndex(this.typeaheadText)),t>=0&&this.setActiveIndex(t),this.typeaheadTimer=setTimeout(()=>{this.typeaheadText=``,this.typeaheadTimer=null},650)}getMatchingOptionIndex(e){for(let t=1;t<=this.options.length;t++){let n=(this.activeIndex+t+this.options.length)%this.options.length,r=this.options[n];if(!r?.disabled&&r.label.toLocaleLowerCase().startsWith(e))return n}return-1}getNextEnabledIndex(e,t){if(!this.options.length)return-1;let n=e;for(let e=0;e<this.options.length;e++)if(n=(n+t+this.options.length)%this.options.length,!this.options[n]?.disabled)return n;return-1}setActiveIndex(e){e<0||this.options[e]?.disabled||(this.activeIndex=e,this.updateActiveOption(!0))}updateActiveOption(e){let t=this.getOptionElements();for(let[e,n]of t.entries())e===this.activeIndex&&this.openState?n.dataset.active=`true`:delete n.dataset.active;let n=t[this.activeIndex];this.openState&&n&&(this.trigger.setAttribute(`aria-activedescendant`,n.id),e&&n.scrollIntoView({block:`nearest`}))}selectActiveOption(){let e=this.options[this.activeIndex];!e||e.disabled||(this.setValue(e.value,{emitChange:!0}),this.close({restoreFocus:!0}))}getFirstEnabledOption(){return this.options.find(e=>!e.disabled)}getSelectedIndex(){return this.options.findIndex(e=>e.value===this.selectedValue)}getOptionIndex(e){let t=e?.closest(`[data-compact-dropdown-option]`);return!t||!this.listbox.contains(t)?-1:Number(t.dataset.optionIndex??-1)}getOptionElements(){return Array.from(this.listbox.querySelectorAll(`[role="option"]`))}updatePopupPosition(){let e=this.document.defaultView;if(!e)return;let t=this.trigger.getBoundingClientRect(),n=Math.min(Math.max(t.width,128),e.innerWidth-8),r=Math.max(4,Math.min(t.left,e.innerWidth-n-4)),i=e.innerHeight-t.bottom-3-4,a=t.top-3-4,o=Math.min(176,this.options.length*20+2),s=i<Math.min(o,80)&&a>i,c=s?a:i;Object.assign(this.listbox.style,{left:`${r}px`,top:s?`auto`:`${t.bottom+3}px`,bottom:s?`${e.innerHeight-t.top+3}px`:`auto`,width:`${n}px`,maxHeight:`${Math.max(40,Math.min(176,c))}px`})}},vc=`
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
`,yc=0;function bc(e){let t=e.createElement(`div`);t.id=`gpu-operation-tooltip-${yc++}`,t.setAttribute(`role`,`tooltip`),t.setAttribute(`data-gpu-operation-tooltip`,``),t.hidden=!0,Object.assign(t.style,{position:`fixed`,zIndex:`2147483647`,pointerEvents:`none`,boxSizing:`border-box`,width:`560px`,maxWidth:`calc(100vw - 24px)`,maxHeight:`min(440px, calc(100vh - 24px))`,overflow:`hidden`,padding:`18px`,border:`1px solid rgb(125 170 212 / 32%)`,borderRadius:`12px`,background:`linear-gradient(145deg, #111e30, #080f1b 70%)`,color:`#e4effc`,boxShadow:`0 8px 28px rgb(0 0 0 / 45%)`,font:`14px/1.5 system-ui, sans-serif`,whiteSpace:`normal`,overflowWrap:`anywhere`});let n=e.createElement(`style`);return n.textContent=Tc,t.append(n),e.body.append(t),t}function xc(e,t){let n=t.getBoundingClientRect(),r=t.ownerDocument.documentElement,i=e.getBoundingClientRect();e.style.left=`${Math.max(12,Math.min(n.left,r.clientWidth-i.width-12))}px`;let a=n.bottom+i.height+12<r.clientHeight?n.bottom+6:n.top-i.height-6;e.style.top=`${Math.max(12,Math.min(a,r.clientHeight-i.height-12))}px`}function Sc(e,t=e.id){let n=[t];if(e.description&&n.push(e.description),e.resources?.length){n.push(``,`Declared inputs / outputs`);for(let t of e.resources){let e=t.usage===`storage-read-write`||t.usage===`render-attachment`?`Input/output`:[`storage-write`,`copy-destination`].includes(t.usage)?`Output`:`Input`,r=t.width===void 0?t.length===void 0?void 0:`${t.length.toLocaleString()} rows`:`${t.width} × ${t.height}${t.depth&&t.depth>1?` × ${t.depth}`:``}`,i=t.byteLength===void 0?void 0:`${t.byteLength.toLocaleString()} B${t.byteOffset?` @ ${t.byteOffset.toLocaleString()}`:``}`;n.push(`${e}: ${t.id}`,`  ${[t.usage,t.format??t.kind,r,i].filter(Boolean).join(` · `)}`)}}return n.join(`
`)}function Cc(e,t,n={}){let r=e.ownerDocument,i=r.createElement(`div`);i.className=`gpu-operation-content`;let a=(e,t,n,i)=>{let a=r.createElement(t);return a.className=n,a.textContent=i,e.append(a),a},o=a(i,`div`,`gpu-operation-header`,``),s=t.id.split(`-`).filter(Boolean).at(-1)??t.id,c=n.name??t.operation??s.replace(/([a-z])([A-Z])/g,`$1 $2`);if(a(o,`strong`,`gpu-operation-name`,c.charAt(0).toUpperCase()+c.slice(1)),t.type&&a(o,`span`,`gpu-operation-kind`,t.type===`render`?`draw`:t.type),a(i,`code`,`gpu-operation-id`,t.id),t.description&&a(i,`p`,`gpu-operation-description`,t.description),t.resources?.length){let e=a(i,`section`,`gpu-operation-resources`,``);a(e,`div`,`gpu-operation-section-label`,`Declared inputs / outputs`);let n=r.createElement(`table`);n.className=`gpu-operation-table`;let o=r.createElement(`caption`);o.textContent=`Declared resource inputs and outputs`,o.hidden=!0,n.append(o);let s=n.createTHead().insertRow();for(let e of[`Access`,`Resource`,`Format / shape`,`Size`]){let t=r.createElement(`th`);t.scope=`col`,t.textContent=e,s.append(t)}let c=n.createTBody(),l=t.id.slice(0,t.id.lastIndexOf(`-`)+1),u=t.resources.slice(0,6);for(let e of u){let t=c.insertRow(),n=e.usage===`storage-read-write`||e.usage===`render-attachment`?`In / out`:[`storage-write`,`copy-destination`].includes(e.usage)?`Output`:`Input`,r=a(t.insertCell(),`span`,`gpu-operation-access`,n);r.dataset.access=n;let i=a(t.insertCell(),`code`,`gpu-operation-resource-id`,l&&e.id.startsWith(l)?e.id.slice(l.length):e.id);i.title=`${e.id} · ${e.usage}`;let o=t.insertCell(),s=e.width===void 0?e.length===void 0?``:`${e.length.toLocaleString()} rows`:`${e.width} × ${e.height}${e.depth&&e.depth>1?` × ${e.depth}`:``}`,u=a(o,`code`,`gpu-operation-format`,[e.format??e.kind,s].filter(Boolean).join(` · `));u.title=u.textContent??``;let d=t.insertCell();d.className=`gpu-operation-size`,d.textContent=e.byteLength===void 0?`—`:e.byteLength>=1024?`${(e.byteLength/1024).toFixed(1)} KiB`:`${e.byteLength} B`,e.byteLength!==void 0&&(d.title=`${e.byteLength.toLocaleString()} bytes`),e.byteOffset&&(d.title+=` · offset ${e.byteOffset.toLocaleString()} bytes`)}e.append(n),wc(a(e,`div`,`gpu-operation-resource-overflow`,``),t.resources.length,u.length)}n.timing&&a(i,`div`,`gpu-operation-timing`,n.timing),e.querySelector(`.gpu-operation-content`)?.remove(),e.append(i);let l=e.hidden;e.hidden=!1;let u=i.querySelector(`tbody`),d=i.querySelector(`.gpu-operation-resource-overflow`);for(;u?.rows.length&&e.scrollHeight>e.clientHeight;)u.deleteRow(-1),wc(d,t.resources.length,u.rows.length),u.rows.length===0&&(u.closest(`table`).hidden=!0);e.hidden=l}function wc(e,t,n){let r=t-n;e.hidden=r===0,e.textContent=r?`+ ${r} more ${r===1?`resource`:`resources`}`:``}var Tc=`
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
`,Ec=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:1}),Dc=new Intl.NumberFormat(`en-US`,{notation:`compact`,maximumFractionDigits:1}),Oc=class{element;graphLabels;nodeLabels;counterLabels;snapshot={graphs:[]};selectedGraphId=null;selectionIsManual=!1;graphOptionsSignature=``;memoryMarkup=``;nodeRows=new Map;counterRows=new Map;graphDropdown;tooltip;tooltipEvents=new AbortController;inspector;resourceRows=new Map;resources=new Map;activeResourceKey;previewGeneration=0;renderedGraphId;selectedResourceKey;viewerGeneration=0;pendingPreviews=new Map;thumbnailGeneration=0;activeNodeId;constructor(e,t={}){this.element=e,this.inspector=t.inspector,this.tooltip=bc(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-graph-tooltip`,``);let n=e=>{let t=e.target.closest(`[data-resource-key]`);if(t&&this.element.contains(t)){this.showResourceTooltip(t);return}let n=e.target.closest(`[data-full-name]`);n&&this.element.contains(n)&&this.showTooltip(n)},r=e=>{let t=e.target.closest(`[data-full-name], [data-resource-key]`),n=e.relatedTarget;(!(n instanceof Node)||!t?.contains(n))&&this.hideTooltip()},i={signal:this.tooltipEvents.signal};e.addEventListener(`mouseover`,n,i),e.addEventListener(`focusin`,n,i),e.addEventListener(`mouseout`,r,i),e.addEventListener(`focusout`,r,i),e.addEventListener(`scroll`,()=>this.hideTooltip(),{...i,capture:!0}),e.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip();let t=e.target.closest(`[data-resource-key]`);t&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.selectResource(t.dataset.resourceKey))},i),e.ownerDocument.defaultView?.addEventListener(`resize`,()=>this.hideTooltip(),i),this.graphLabels=t.graphLabels??{},this.nodeLabels=t.nodeLabels??{},this.counterLabels=t.counterLabels??{},this.element.innerHTML=`<div data-gpu-command-graph-inspector>
      <style>${jc}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div role="tablist" aria-label="Graph inspector views">
          <button type="button" role="tab" aria-selected="true" data-inspector-tab="timings">Graph</button>
          <button type="button" role="tab" aria-selected="false" data-inspector-tab="resources">Graph Resources</button>
        </div>
        <div data-inspector-view="timings">
        <div class="graph-inspector-summary">
          ${Mc(`encodings`,``,`encoding-count`)}
          ${Mc(`CPU p50 / p95 (ms)`,``,`cpu-totals`)}
          ${Mc(`GPU p50 / p95 (ms)`,``,`gpu-totals`)}
          ${Mc(`GPU samples`,``,`gpu-samples`)}
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
    </div>`,e.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-inspector-tab]`);if(r){this.hideTooltip();for(let t of e.querySelectorAll(`[data-inspector-tab]`))t.setAttribute(`aria-selected`,String(t===r));for(let t of e.querySelectorAll(`[data-inspector-view]`))t.hidden=t.dataset.inspectorView!==r.dataset.inspectorTab}n.closest(`[data-texture-previews]`)&&this.refreshTextureThumbnails();let i=n.closest(`[data-resource-key]`);i&&this.selectResource(i.dataset.resourceKey),n.closest(`[data-resource-refresh]`)&&this.selectedResourceKey&&this.selectResource(this.selectedResourceKey)},i),this.graphDropdown=new _c(this.element.querySelector(`[data-graph-inspector-picker-host]`),{ariaLabel:`Graph`,options:[],onChange:e=>{this.hideTooltip(),this.selectedGraphId=e,this.selectionIsManual=!0,this.render()}})}update(e,t){if(this.snapshot=e,e.graphs.some(e=>e.id===this.selectedGraphId)||(this.selectedGraphId=null,this.selectionIsManual=!1),!this.selectionIsManual&&t){let n=e.graphs.find(e=>e.id===t);n&&(this.selectedGraphId=n.id)}this.selectedGraphId??=e.graphs[0]?.id??null,this.render()}destroy(){this.hideTooltip(),this.viewerGeneration++,this.thumbnailGeneration++,this.tooltipEvents.abort(),this.tooltip.remove(),this.graphDropdown.destroy(),this.element.replaceChildren(),this.nodeRows.clear(),this.counterRows.clear(),this.resourceRows.clear(),this.resources.clear()}showTooltip(e){this.activeResourceKey&&this.hideTooltip(),this.activeNodeId=e.getAttribute(`data-full-name`)??void 0;let t=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId)?.nodes.find(e=>e.id===this.activeNodeId);if(!t)return;let n=Rc(this.nodeLabels,t.id);Cc(this.tooltip,t,{name:n===t.id?void 0:n}),this.tooltip.hidden=!1,xc(this.tooltip,e)}async showResourceTooltip(e){let t=e.dataset.resourceKey;if(this.activeResourceKey===t)return;this.hideTooltip(),this.activeResourceKey=t;let n=this.previewGeneration,r=this.resources.get(t),i=this.selectedGraphId;if(!r||!i)return;let a=this.tooltip.ownerDocument.createElement(`div`);a.className=`gpu-operation-content`;let o=this.tooltip.ownerDocument.createElement(`strong`);o.textContent=r.summary.id;let s=this.tooltip.ownerDocument.createElement(`div`);s.textContent=Bc(r.summary);let c=this.tooltip.ownerDocument.createElement(`pre`);c.style.whiteSpace=`pre-wrap`,c.style.fontSize=`11px`,c.textContent=`Reading current GPU data…`,a.append(o,s,c),this.tooltip.querySelector(`.gpu-operation-content`)?.remove(),this.tooltip.append(a),this.tooltip.hidden=!1,xc(this.tooltip,e);try{if(!this.inspector)throw Error(`No live inspector is connected.`);let e=await this.readPreview(t,i,r);if(n!==this.previewGeneration)return;this.showTextureThumbnail(t,e),c.textContent=Vc(e);let o=hc(this.tooltip.ownerDocument,e);o&&a.insertBefore(o,c)}catch(e){if(n!==this.previewGeneration)return;c.textContent=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`}n===this.previewGeneration&&xc(this.tooltip,e)}readPreview(e,t,n){let r=`${t}/${e}`,i=this.pendingPreviews.get(r);if(i)return i;let a=this.inspector?this.inspector.readResource(t,n.nodeId,n.index):Promise.reject(Error(`No live inspector is connected.`));return this.pendingPreviews.set(r,a),a.finally(()=>this.pendingPreviews.delete(r)).catch(()=>{}),a}async selectResource(e){this.hideTooltip();let t=this.resources.get(e),n=this.selectedGraphId;if(!t||!n)return;this.selectedResourceKey=e;let r=++this.viewerGeneration;for(let[t,n]of this.resourceRows)n.setAttribute(`aria-pressed`,String(t===e));let i=this.element.querySelector(`[data-resource-viewer]`);i.textContent=`${t.summary.id} · ${Bc(t.summary)}\nReading current GPU data…`;try{let a=await this.readPreview(e,n,t);if(r!==this.viewerGeneration)return;this.showTextureThumbnail(e,a),i.textContent=`${t.summary.id} · ${Bc(t.summary)}\n${Vc(a)}`;let o=hc(i.ownerDocument,a);o&&i.prepend(o)}catch(e){r===this.viewerGeneration&&(i.textContent=`${t.summary.id}\nPreview unavailable: ${e instanceof Error?e.message:String(e)}`)}}showTextureThumbnail(e,t){let n=this.resourceRows.get(e);if(!n)return;let r=hc(n.ownerDocument,t);if(!r)return;let i=Math.max(r.width,r.height);r.style.width=`${48*r.width/i}px`,r.style.height=`${48*r.height/i}px`,r.style.flexShrink=`0`,n.removeAttribute(`title`),n.querySelector(`canvas`)?.remove(),n.prepend(r)}async refreshTextureThumbnails(){let e=this.selectedGraphId;if(!e)return;let t=++this.thumbnailGeneration,n=this.element.querySelector(`[data-texture-previews]`);n.disabled=!0;let r=[...this.resources].filter(([,e])=>e.summary.kind===`texture`).slice(0,32);n.textContent=`Reading up to 32 textures…`;try{for(let[n,i]of r){if(t!==this.thumbnailGeneration)return;this.resourceRows.get(n)?.querySelector(`canvas`)?.remove();try{let r=await this.readPreview(n,e,i);if(t!==this.thumbnailGeneration)return;this.showTextureThumbnail(n,r)}catch(e){if(t!==this.thumbnailGeneration)return;let r=this.resourceRows.get(n);r&&(r.title=`Preview unavailable: ${e instanceof Error?e.message:String(e)}`)}}}finally{n.disabled=!1,n.textContent=`Refresh texture thumbnails`}}hideTooltip(){this.previewGeneration++,this.activeResourceKey=void 0,this.activeNodeId=void 0,this.tooltip.hidden=!0}render(){let e=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId),t=this.element.querySelector(`[data-graph-inspector-empty]`),n=this.element.querySelector(`[data-graph-inspector-content]`);if(!e){this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.thumbnailGeneration++,this.renderedGraphId=void 0,t.hidden=!1,n.hidden=!0;return}if(this.renderedGraphId!==e.id){this.thumbnailGeneration++;for(let e of this.resourceRows.values())e.querySelector(`canvas`)?.remove();this.hideTooltip(),this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`}this.renderedGraphId=e.id,this.resources.clear();for(let t of e.nodes)for(let[e,n]of(t.resources??[]).entries()){let{usage:r,...i}=n,a=JSON.stringify(i);this.resources.set(a,{nodeId:t.id,index:e,summary:n})}this.selectedResourceKey&&!this.resources.has(this.selectedResourceKey)&&(this.viewerGeneration++,this.selectedResourceKey=void 0,this.element.querySelector(`[data-resource-viewer]`).textContent=`Select a buffer or texture.`),kc(this.element.querySelector(`[data-graph-inspector-resources]`),this.resourceRows,[...this.resources].map(([e,t])=>({id:e,...t})),(e,t)=>{e.className=`graph-inspector-resource`,e.tabIndex=0,Y(e,`role`,`button`),Y(e,`aria-pressed`,String(t.id===this.selectedResourceKey)),Y(e,`data-resource-key`,t.id),Y(e,`aria-describedby`,this.tooltip.id);let n=e.querySelector(`span`);n||(n=e.ownerDocument.createElement(`span`),e.append(n)),J(n,`${t.summary.kind===`buffer`?`Buffer`:`Texture`} · ${t.summary.id} · ${Bc(t.summary)}`)}),this.activeResourceKey&&!this.resources.has(this.activeResourceKey)&&this.hideTooltip(),t.hidden=!0,n.hidden=!1;let r=this.snapshot.graphs.map(e=>`${e.id}\u0000${this.getGraphLabel(e.id)}`).join(``);r!==this.graphOptionsSignature&&(this.graphDropdown.setOptions(this.snapshot.graphs.map(e=>({value:e.id,label:this.getGraphLabel(e.id)}))),this.graphOptionsSignature=r),this.graphDropdown.value!==e.id&&(this.graphDropdown.value=e.id);let i=e.stats.logicalTransientBytes+e.stats.logicalTransientTextureBytes,a=e.stats.reusedTransientBytes+e.stats.reusedTransientTextureBytes,o=i?a/i*100:0,s=e.totals.gpu.sampleCount;kc(this.element.querySelector(`[data-graph-inspector-nodes]`),this.nodeRows,e.nodes,(t,n)=>{t.hasChildNodes()||(t.className=`graph-inspector-node`,t.innerHTML=`<span><i></i><span data-node-label></span></span><strong data-node-cpu></strong><strong data-node-gpu></strong>`),Y(t,`data-node-type`,n.type),Y(t,`data-full-name`,n.id),Y(t,`data-operation-details`,Sc(n)),Y(t,`aria-describedby`,this.tooltip.id),t.tabIndex=0,this.activeNodeId===n.id&&this.showTooltip(t);let r=t.querySelector(`i`),i=n.type===`render`?`draw`:n.type;Y(r,`title`,i),Y(r,`aria-label`,i);let a=Rc(this.nodeLabels,n.id);J(t.querySelector(`[data-node-label]`),a===n.id?Nc(n.id,e.id):a),J(t.querySelector(`[data-node-cpu]`),Pc(n.cpu)),J(t.querySelector(`[data-node-gpu]`),Pc(n.gpu))}),this.activeNodeId&&!e.nodes.some(e=>e.id===this.activeNodeId)&&this.hideTooltip(),kc(this.element.querySelector(`[data-graph-inspector-counter-rows]`),this.counterRows,e.counters,(e,t)=>{e.hasChildNodes()||(e.className=`graph-inspector-counter`,e.innerHTML=`<span></span><strong data-counter-latest></strong><strong data-counter-percentiles></strong>`),Y(e,`title`,`${t.id} · ${t.sampleCount} samples`),J(e.querySelector(`span`),this.getCounterLabel(t.id)),J(e.querySelector(`[data-counter-latest]`),Ic(t.latestValue)),J(e.querySelector(`[data-counter-percentiles]`),`${Ic(t.p50Value)} / ${Ic(t.p95Value)}`)}),this.setText(`encoding-count`,String(e.encodingCount)),this.setText(`cpu-totals`,Pc(e.totals.cpu)),this.setText(`gpu-totals`,Pc(e.totals.gpu)),this.setText(`gpu-samples`,`${s}${e.timingReadFailureCount?` · ${e.timingReadFailureCount} failed`:``}`);let c=`
      <span>${e.stats.nodeOrder.length} nodes</span>
      <span>${Lc(e.stats.logicalResourceBytes)} logical</span>
      <span>${Lc(e.stats.physicalTransientResourceBytes)} scratch</span>
      ${e.preflight?.annotatedNodeCount?`<span>${e.preflight.annotatedNodeCount}/${e.stats.nodeOrder.length} costed nodes</span>`:``}
      ${e.preflight?.maximumInvocationCount?`<span>${Ac(e.preflight.maximumInvocationCount)} max invocations</span>`:``}
      ${e.preflight?.readByteLength?`<span>${Lc(e.preflight.readByteLength)} max reads</span>`:``}
      ${e.preflight?.writeByteLength?`<span>${Lc(e.preflight.writeByteLength)} max writes</span>`:``}
      <span>${o?`${o.toFixed(0)}% reuse`:`no reuse`}</span>
      <span>${s?`GPU timings sampled`:`CPU timings only`}</span>`;c!==this.memoryMarkup&&(this.element.querySelector(`[data-graph-inspector-memory]`).innerHTML=c,this.memoryMarkup=c);let l=this.element.querySelector(`[data-graph-inspector-counters]`);l.hidden=e.counters.length===0}setText(e,t){J(this.element.querySelector(`[data-graph-inspector-${e}]`),t)}getGraphLabel(e){return Rc(this.graphLabels,e)}getCounterLabel(e){return Rc(this.counterLabels,e)}};function kc(e,t,n,r){let i=new Set(n.map(e=>e.id));for(let[e,n]of t)i.has(e)||(n.remove(),t.delete(e));for(let[i,a]of n.entries()){let n=t.get(a.id);n||(n=e.ownerDocument.createElement(`div`),t.set(a.id,n)),r(n,a);let o=e.children[i]??null;o!==n&&e.insertBefore(n,o)}}function J(e,t){e.textContent!==t&&(e.textContent=t)}function Y(e,t,n){e.getAttribute(t)!==n&&e.setAttribute(t,n)}function Ac(e){return Dc.format(e)}var jc=`
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
`;function Mc(e,t,n){return`<span class="graph-inspector-metric"><span>${zc(e)}</span><strong data-graph-inspector-${n}>${zc(t)}</strong></span>`}function Nc(e,t){let n=t.endsWith(`-graph`)?t.slice(0,-6):t,r=e.startsWith(`${n}-`)?e.slice(n.length+1):e;return r.length>32?`${r.slice(0,30)}…`:r}function Pc(e){return e.p50Milliseconds===void 0?`—`:`${Fc(e.p50Milliseconds)} / ${Fc(e.p95Milliseconds??e.p50Milliseconds)}`}function Fc(e){return e.toFixed(e<1?3:2)}function Ic(e){return(e>=1e4?Dc:Ec).format(e)}function Lc(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(1)} KiB`:e<1024**3?`${(e/1024**2).toFixed(1)} MiB`:`${(e/1024**3).toFixed(1)} GiB`}function Rc(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:t}function zc(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Bc(e){return e.kind===`buffer`?`${e.format??`raw bytes`} · ${e.byteLength??0} B @ ${e.byteOffset??0}`:`${e.format??e.kind} · ${e.width} × ${e.height} · mip ${e.baseMipLevel??0}, layer ${e.baseArrayLayer??0}`}function Vc(e){let t=e.data,n,r=`bytes`;return/^float32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Float32Array(t.slice().buffer)),r=`float32`):/^uint32(x[234])?$/.test(e.format??``)&&t.byteLength%4==0?(n=Array.from(new Uint32Array(t.slice().buffer)),r=`uint32`):n=Array.from(t),`Current allocation · ${t.length} bytes read${e.width?` · top-left ${e.width} × ${e.height}`:``}\n${r}: ${n.slice(0,64).join(`, `)}${n.length>64?`, …`:``}`}var Hc=class{panel;renderer=null;snapshot={graphs:[]};preferredGraphId;constructor(e={}){this.panel=ec({id:e.id??`gpu-command-graph-debug`,title:e.title??`GPU Graph`,html:`<p class="hint">Compiled nodes, memory, and recorded timings. GPU timings appear when supplied by the application.</p><div data-graph-debug-host></div>`,onRender:t=>{let n=new Oc(t.querySelector(`[data-graph-debug-host]`),e);return this.renderer=n,n.update(this.snapshot,this.preferredGraphId),()=>{n.destroy(),this.renderer===n&&(this.renderer=null)}}})}update(e,t){this.snapshot=e,this.preferredGraphId=t,this.renderer?.update(e,t)}},Uc=new Intl.NumberFormat(`en-US`,{maximumSignificantDigits:3,useGrouping:!1}),Wc=class{panel;renderer=null;report;label=``;constructor(e={}){this.panel=ec({id:e.id??`gpu-trace`,title:e.title??`GPU Trace`,html:`<div data-gpu-trace-host></div>`,onRender:e=>{let t=new Gc(e.querySelector(`[data-gpu-trace-host]`));return this.renderer=t,t.update(this.report,this.label),()=>{t.destroy(),this.renderer===t&&(this.renderer=null)}}})}update(e,t=``){this.report=e,this.label=t,this.renderer?.update(e,t)}},Gc=class{combinedTimeline=!1;tooltip;activeSpanKey;tooltipNodes=new Map;constructor(e){this.element=e,this.tooltip=bc(e.ownerDocument),this.tooltip.setAttribute(`data-gpu-trace-tooltip`,``)}update(e,t=``){this.tooltipNodes.clear();let n=document.createElement(`section`);n.setAttribute(`data-gpu-trace`,``),n.setAttribute(`aria-label`,`GPU Trace`);let r=document.createElement(`style`);if(r.textContent=Kc,n.append(r),X(n,`strong`,t||`Latest graph execution`),!e)X(n,`p`,`No trace collected yet.`);else{let r=e.clockCorrelation,i=!!(r&&Number.isFinite(r.offsetMilliseconds)&&Number.isFinite(r.uncertaintyMilliseconds)&&r.uncertaintyMilliseconds>=0),a=document.createElement(`label`),o=document.createElement(`input`);o.type=`checkbox`,o.checked=this.combinedTimeline,o.disabled=!i,o.addEventListener(`change`,()=>{this.combinedTimeline=o.checked,this.update(e,t)}),a.append(o,` Combined timeline (estimated)`),n.append(a);let s=this.combinedTimeline&&i;X(n,`p`,s?`Alignment ±${Z(r.uncertaintyMilliseconds)}ms, plus timestamp precision. Submission-time estimate.`:`CPU and GPU use separate clocks. Each timeline starts at its own origin.`),i||X(n,`p`,`Combined timeline requires submission clock correlation.`);let c=s?r.offsetMilliseconds:0,l=s?e.nodes.flatMap(e=>[e.cpuEncodeStartTimeMilliseconds,e.gpuStartTimeMilliseconds===void 0?void 0:e.gpuStartTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[],u=s?e.nodes.flatMap(e=>[e.cpuEncodeEndTimeMilliseconds,e.gpuEndTimeMilliseconds===void 0?void 0:e.gpuEndTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[];s&&e.cpuEncodeStartTimeMilliseconds!==void 0&&l.push(e.cpuEncodeStartTimeMilliseconds),s&&e.cpuEncodeEndTimeMilliseconds!==void 0&&u.push(e.cpuEncodeEndTimeMilliseconds);for(let t of[`gpu`,`cpu`]){let r=e.nodes.flatMap(e=>{let n=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,r=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds;return n!==void 0&&r!==void 0&&Number.isFinite(n)&&Number.isFinite(r)&&r>=n?[{node:e,start:n+(t===`gpu`?c:0),end:r+(t===`gpu`?c:0)}]:[]}),i=document.createElement(`section`);if(i.dataset.traceClock=t,n.append(i),X(i,`h4`,t===`cpu`?`CPU encoding`:`GPU execution`),!r.length){X(i,`p`,t===`cpu`?`CPU span endpoints unavailable.`:`GPU span endpoints unavailable. Timestamp queries are required.`);continue}let a=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,o=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds,d=s?Math.min(...l):Math.min(...r.map(e=>e.start),a??1/0),f=(s?Math.max(...u):Math.max(...r.map(e=>e.end),o??-1/0))-d;X(i,`p`,`0 – ${Z(f)}ms · ${r.length}/${e.nodes.length} nodes`);let p=document.createElement(`div`);p.className=`gpu-trace-rows`,i.append(p);for(let e of r){let n=document.createElement(`div`);n.className=`gpu-trace-row`,X(n,`span`,e.node.operation??e.node.type).setAttribute(`aria-label`,Sc(e.node));let r=document.createElement(`div`);r.className=`gpu-trace-track`;let i=document.createElement(`span`);i.className=`gpu-trace-bar`,i.tabIndex=0,i.style.left=`${f?(e.start-d)/f*100:0}%`,i.style.width=`${f?(e.end-e.start)/f*100:0}%`;let a=t===`cpu`?e.node.cpuEncodeTimeMilliseconds:e.node.gpuTimeMilliseconds,o=`${e.node.id} (${e.node.type}${e.node.condition?.outcome===`skipped`?`, skipped`:``}): ${Z(e.start-d)}–${Z(e.end-d)}ms; duration ${Z(a??e.end-e.start)}ms`;n.dataset.spanKey=JSON.stringify([t,e.node.id]),this.tooltipNodes.set(n.dataset.spanKey,{node:e.node,timing:`${t.toUpperCase()} · ${Z(a??e.end-e.start)}ms duration · ${Z(e.start-d)}–${Z(e.end-d)}ms${e.node.condition?.outcome===`skipped`?` · skipped`:``}`});let s=Sc(e.node,o);n.dataset.spanDetails=s,i.setAttribute(`aria-describedby`,this.tooltip.id),i.setAttribute(`aria-label`,s),r.append(i),n.append(r),X(n,`span`,`${Z(a??e.end-e.start)}ms`),p.append(n)}}}let i=X(n,`p`,`Hover or focus a span for details.`);i.setAttribute(`aria-live`,`polite`);let a=e=>{let t=e.target.closest(`.gpu-trace-row`);t&&(i.textContent=t.dataset.spanDetails,this.showTooltip(t))},o=e=>{let t=e.relatedTarget,n=e.target.closest(`.gpu-trace-row`);(!(t instanceof Node)||!n?.contains(t))&&this.hideTooltip()};n.addEventListener(`mouseover`,a),n.addEventListener(`focusin`,a),n.addEventListener(`mouseout`,o),n.addEventListener(`focusout`,o),n.addEventListener(`scroll`,()=>this.hideTooltip(),!0),n.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.hideTooltip()});let s=this.element.ownerDocument.activeElement,c=s&&this.element.contains(s)?s.closest(`.gpu-trace-row`)?.dataset.spanKey:void 0,l=this.activeSpanKey;this.element.replaceChildren(n);let u=Array.from(n.querySelectorAll(`.gpu-trace-row`)),d=u.find(e=>e.dataset.spanKey===c);d&&d.querySelector(`.gpu-trace-bar`).focus({preventScroll:!0});let f=u.find(e=>e.dataset.spanKey===l);f?(i.textContent=f.dataset.spanDetails,this.showTooltip(f)):this.hideTooltip()}showTooltip(e){this.activeSpanKey=e.dataset.spanKey;let t=this.tooltipNodes.get(this.activeSpanKey);t&&(Cc(this.tooltip,t.node,{timing:t.timing}),this.tooltip.hidden=!1,xc(this.tooltip,e))}hideTooltip(){this.activeSpanKey=void 0,this.tooltip.hidden=!0}destroy(){this.hideTooltip(),this.tooltip.remove(),this.tooltipNodes.clear(),this.element.replaceChildren()}};function X(e,t,n){let r=document.createElement(t);return r.textContent=n,e.append(r),r}function Z(e){return Uc.format(e)}var Kc=`
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
`,qc=class{inspector=new Nr;inspectorPanel=new Hc({inspector:this.inspector});tracePanel;graphs=new Map;sampleCounts=new Map;latestEncoding=null;generation=0;latestGraphId;constructor(e={}){this.tracePanel=new Wc({title:e.traceTitle})}encode(e,t,n){let r=(this.graphs.get(e.id)===e?this.sampleCounts.get(e.id):0)%60==0&&t.getTimeProfilingQuerySet()===null&&t.device.features.has(`timestamp-query`)&&t.withTimeProfilingQuerySet?t.device.createQuerySet({type:`timestamp`,count:Math.min(8192,Math.max(2,e.stats.nodeOrder.length*2))}):void 0,i;try{i=r?t.withTimeProfilingQuerySet(r,()=>e.encode(t,n)):e.encode(t,n)}catch(e){throw r?.destroy(),e}return this.record(e,i,r),i}record(e,t,n){this.graphs.get(e.id)!==e&&(this.graphs.set(e.id,e),this.sampleCounts.set(e.id,0),this.inspector.registerGraph(e)),this.inspector.recordEncoding(e.id,t);let r=this.sampleCounts.get(e.id);if(this.sampleCounts.set(e.id,r+1),r%60!=0)return;this.latestEncoding=t,this.latestGraphId=e.id,this.inspectorPanel.update(this.inspector.getSnapshot(),e.id);let i=this.generation;queueMicrotask(()=>{if(i!==this.generation||this.graphs.get(e.id)!==e){n?.destroy();return}this.inspector.recordGPUTimings(e.id,t).then(n=>{i!==this.generation||this.graphs.get(e.id)!==e||(this.inspectorPanel.update(this.inspector.getSnapshot(),this.latestGraphId),this.latestEncoding===t&&this.tracePanel.update(n??t.stats,e.id))}).catch(()=>{i===this.generation&&this.latestEncoding===t&&this.tracePanel.update(t.stats,e.id)}).finally(()=>n?.destroy())})}clear(){this.generation++,this.latestEncoding=null,this.latestGraphId=void 0,this.graphs.clear(),this.sampleCounts.clear(),this.inspector.clear(),this.inspectorPanel.update(this.inspector.getSnapshot()),this.tracePanel.update(void 0)}},Q=new le,Jc=new b,Yc=new b(1,0),Xc=new b(0,1),Zc,Qc=Be(({input:e,threshold:t,smoothWidth:n})=>{let r=Fe(e.rgb),i=We(t,t.add(n),r);return Ae(Le(0),e,i)}),$c=class extends a{static get type(){return`BloomNode`}constructor(e,t=1,n=0,i=0){super(`vec4`),this.inputNode=e,this.strength=t.isNode?t:k(t),this.radius=n.isNode?n:k(n),this.threshold=i.isNode?i:k(i),this.smoothWidth=k(.01),this._resolutionScale=.5,this.highPassFn=Qc,this._renderTargetsHorizontal=[],this._renderTargetsVertical=[],this._nMips=5,this._renderTargetBright=new r(1,1,{depthBuffer:!1,type:re}),this._renderTargetBright.texture.name=`UnrealBloomPass.bright`,this._renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this._nMips;e++){let t=new r(1,1,{depthBuffer:!1,type:re});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this._renderTargetsHorizontal.push(t);let n=new r(1,1,{depthBuffer:!1,type:re});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this._renderTargetsVertical.push(n)}this._compositeMaterial=null,this._highPassFilterMaterial=null,this._separableBlurMaterials=[],this._textureNodeBright=Ee(this._renderTargetBright.texture),this._textureNodeBlur0=Ee(this._renderTargetsVertical[0].texture),this._textureNodeBlur1=Ee(this._renderTargetsVertical[1].texture),this._textureNodeBlur2=Ee(this._renderTargetsVertical[2].texture),this._textureNodeBlur3=Ee(this._renderTargetsVertical[3].texture),this._textureNodeBlur4=Ee(this._renderTargetsVertical[4].texture),this._textureOutput=Ge(this,this._renderTargetsHorizontal[0].texture),this.updateBeforeType=ue.FRAME}getTextureNode(){return this._textureOutput}setResolutionScale(e){return this._resolutionScale=e,this}getResolutionScale(){return this._resolutionScale}setSize(e,t){let n=Math.floor(e*this._resolutionScale),r=Math.floor(t*this._resolutionScale);this._renderTargetBright.setSize(n,r);for(let e=0;e<this._nMips;e++)this._renderTargetsHorizontal[e].setSize(n,r),this._renderTargetsVertical[e].setSize(n,r),this._separableBlurMaterials[e].invSize.value.set(1/n,1/r),n=Math.floor(n/2),r=Math.floor(r/2)}updateBefore(e){let{renderer:t}=e;Zc=ce.resetRendererState(t,Zc);let n=t.getDrawingBufferSize(Jc);this.setSize(n.width,n.height),t.setRenderTarget(this._renderTargetBright),Q.material=this._highPassFilterMaterial,Q.name=`Bloom [ High Pass ]`,Q.render(t);let r=this._renderTargetBright;for(let e=0;e<this._nMips;e++)Q.material=this._separableBlurMaterials[e],this._separableBlurMaterials[e].colorTexture.value=r.texture,this._separableBlurMaterials[e].direction.value=Yc,t.setRenderTarget(this._renderTargetsHorizontal[e]),Q.name=`Bloom [ Blur Horizontal - ${e} ]`,Q.render(t),this._separableBlurMaterials[e].colorTexture.value=this._renderTargetsHorizontal[e].texture,this._separableBlurMaterials[e].direction.value=Xc,t.setRenderTarget(this._renderTargetsVertical[e]),Q.name=`Bloom [ Blur Vertical - ${e} ]`,Q.render(t),r=this._renderTargetsVertical[e];t.setRenderTarget(this._renderTargetsHorizontal[0]),Q.material=this._compositeMaterial,Q.name=`Bloom [ Composite ]`,Q.render(t),ce.restoreRendererState(t,Zc)}setup(e){this._highPassFilterMaterial=this._highPassFilterMaterial||new oe,this._highPassFilterMaterial.fragmentNode=this.highPassFn({input:this.inputNode,threshold:this.threshold,smoothWidth:this.smoothWidth}).context(e.getSharedContext()),this._highPassFilterMaterial.name=`Bloom_highPass`,this._highPassFilterMaterial.needsUpdate=!0;let t=[6,10,14,18,22];for(let n=0;n<this._nMips;n++)this._separableBlurMaterials.push(this._getSeparableBlurMaterial(e,t[n]));let n=Oe([1,.8,.6,.4,.2]),r=Oe([new ae(1,1,1),new ae(1,1,1),new ae(1,1,1),new ae(1,1,1),new ae(1,1,1)]),i=Be(([e,t])=>Ae(e,Pe(1.2).sub(e),t)).setLayout({name:`lerpBloomFactor`,type:`float`,inputs:[{name:`factor`,type:`float`},{name:`radius`,type:`float`}]}),a=Be(()=>{let e=i(n.element(0),this.radius).mul(Le(r.element(0),1)).mul(this._textureNodeBlur0),t=i(n.element(1),this.radius).mul(Le(r.element(1),1)).mul(this._textureNodeBlur1),a=i(n.element(2),this.radius).mul(Le(r.element(2),1)).mul(this._textureNodeBlur2),o=i(n.element(3),this.radius).mul(Le(r.element(3),1)).mul(this._textureNodeBlur3),s=i(n.element(4),this.radius).mul(Le(r.element(4),1)).mul(this._textureNodeBlur4);return e.add(t).add(a).add(o).add(s).mul(this.strength)});return this._compositeMaterial=this._compositeMaterial||new oe,this._compositeMaterial.fragmentNode=a().context(e.getSharedContext()),this._compositeMaterial.name=`Bloom_comp`,this._compositeMaterial.needsUpdate=!0,this._textureOutput}dispose(){for(let e=0;e<this._renderTargetsHorizontal.length;e++)this._renderTargetsHorizontal[e].dispose();for(let e=0;e<this._renderTargetsVertical.length;e++)this._renderTargetsVertical[e].dispose();this._renderTargetBright.dispose(),this._highPassFilterMaterial!==null&&this._highPassFilterMaterial.dispose(),this._compositeMaterial!==null&&this._compositeMaterial.dispose();for(let e=0;e<this._separableBlurMaterials.length;e++)this._separableBlurMaterials[e].dispose()}_getSeparableBlurMaterial(e,t){let n=[],r=t/3;for(let e=0;e<t;e++)n.push(.39894*Math.exp(-.5*e*e/(r*r))/r);let i=Ee(null),a=Oe(n),o=k(new b),s=k(new b(.5,.5)),c=Re(),l=e=>i.sample(e),u=Be(()=>{let e=l(c).rgb.mul(a.element(0)).toVar();return Ie({start:ze(1),end:ze(t),type:`int`,condition:`<`},({i:t})=>{let n=Pe(t),r=a.element(t),i=s.mul(o).mul(n),u=l(c.add(i)).rgb,d=l(c.sub(i)).rgb;e.addAssign(je(u,d).mul(r))}),Le(e,1)}),d=new oe;return d.fragmentNode=u().context(e.getSharedContext()),d.name=`Bloom_separable`,d.needsUpdate=!0,d.colorTexture=i,d.direction=s,d.invSize=o,d}},el=(e,t,n,r)=>new $c(Ue(e),t,n,r),tl=98304,$=tl+98304,nl=250*.2/(2*Math.PI),rl=`
struct SimulationParameters { time: f32, radius: f32, count: f32, padding: f32 };
@group(0) @binding(0) var<storage, read_write> offsets: array<f32>;
@group(0) @binding(1) var<storage, read_write> colors: array<f32>;
@group(0) @binding(2) var<uniform> parameters: SimulationParameters;

// Integer hashing avoids correlated bands from large floating-point sine arguments.
fn getRandomValue(seed: u32) -> f32 {
  var value = seed + 0x9e3779b9u;
  value = (value ^ (value >> 16u)) * 0x85ebca6bu;
  value = (value ^ (value >> 13u)) * 0xc2b2ae35u;
  value = value ^ (value >> 16u);
  return f32(value & 0x00ffffffu) / 16777216.0;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) invocationId: vec3u) {
  let particleIndex = invocationId.x;
  if (particleIndex >= u32(parameters.count)) { return; }
  let seed = particleIndex * 16u;
  var position: vec3f;
  var starColor: vec3f;
  var brightness: f32;

  // Added stars fill the warm bulge without taking particles away from the arms or disk.
  let population = select(particleIndex % 16u, 4u, particleIndex >= ${tl}u);
  let radialFraction = pow(getRandomValue(seed), 0.65);
  let radialDistance = (0.08 + 9.8 * radialFraction) * parameters.radius;
  // Use a separate index from population so every stellar population fills all four arms.
  let arm = f32((particleIndex / 16u) % 4u) * 1.5707963;
  let filament = getRandomValue(seed + 6u);
  let strand = floor(filament * 4.0);
  let armVariation = sin(arm + 0.8);
  // Preserve arm structure during long sessions instead of winding it into rings.
  let orbitalAngle = parameters.time * 0.2
    + sin(parameters.time * 0.08) * 0.45 * (1.0 - radialFraction);
  // Correlated waves bend entire filaments; fine scatter breaks up their edges.
  let turbulence = sin(radialFraction * 23.0 + arm * 3.0 + parameters.time * 0.12) * 0.16
    + sin(radialFraction * 51.0 + filament * 5.0) * 0.035;
  var angle = arm + log(1.0 + radialFraction * 8.0) * (2.8 + armVariation * 0.2) + orbitalAngle + turbulence;
  let scatter = getRandomValue(seed + 1u) - 0.5;
  // Discrete braided ribbons leave dark channels between the luminous streams.
  angle += (strand - 1.5) * 0.105 + sin(radialFraction * 14.0 + strand * 1.7) * 0.07;
  angle += scatter * (0.055 + 0.14 * filament * filament);
  // Sculpt each arm around a raised centerline while retaining a thin underlying disk.
  // Coherent ridges and braided strands give the arms volume without scattering them apart.
  let armEnvelope = smoothstep(0.05, 0.25, radialFraction);
  let ridgePhase = radialFraction * 9.0 + arm + parameters.time * 0.12;
  let ridgeHeight = sin(ridgePhase) * (0.12 + radialFraction * (0.55 + 0.25 * armVariation)) * armEnvelope;
  let strandPhase = radialFraction * 12.0 + floor(filament * 4.0) * 1.5707963 + arm;
  let strandHeight = sin(strandPhase) * (0.04 + radialFraction * 0.24) * armEnvelope;
  let crossSection = getRandomValue(seed + 2u) * 6.2831853;
  let thickness = (0.035 + radialFraction * 0.24) * (1.0 - abs(scatter));
  let height = ridgeHeight + strandHeight + cos(crossSection) * thickness;
  position = vec3f(cos(angle) * radialDistance, height, sin(angle) * radialDistance);
  let gold = mix(vec3f(1.0, 0.16, 0.005), vec3f(1.0, 0.52, 0.07), getRandomValue(seed + 3u));
  let cyan = mix(vec3f(0.005, 0.18, 0.5), vec3f(0.04, 0.8, 1.0), getRandomValue(seed + 4u));
  // Warm and cool filaments overlap instead of forming uniform concentric color bands.
  let coolWeight = smoothstep(0.25, 0.8, radialFraction + sin(arm + strand * 0.7) * 0.23);
  starColor = mix(gold, cyan, coolWeight);
  // A brighter face and dimmer underside make the stream's rounded cross-section readable.
  let strandLight = 0.65 + 0.5 * (0.5 + 0.5 * cos(crossSection - 0.7));
  brightness = (0.38 + 3.2 * pow(getRandomValue(seed + 5u), 7.0)) * strandLight;
  if (population == 0u || population == 1u) {
    // Soft, oversized sprites trace translucent dust clouds above and below the stars.
    position.x += (getRandomValue(seed + 7u) - 0.5) * radialFraction * 1.2;
    position.z += (getRandomValue(seed + 8u) - 0.5) * radialFraction * 1.2;
    // Dust curls around the same arm centerline rather than forming a separate cloud.
    position.y += sin(strandPhase + crossSection * 0.35) * (0.1 + radialFraction * 0.3);
    brightness = 0.0015 + 0.003 * getRandomValue(seed + 5u);
    if (population == 0u) {
      // A continuous luminous disk supports the arm ridges rather than leaving empty gaps.
      let diskAngle = getRandomValue(seed + 9u) * 6.2831853 + parameters.time * 0.2;
      position = vec3f(cos(diskAngle) * radialDistance,
        (getRandomValue(seed + 2u) - 0.5) * 0.18, sin(diskAngle) * radialDistance);
      brightness = 0.004 * (1.0 - smoothstep(0.65, 1.0, radialFraction));
    }
  } else if (population == 2u) {
    // A loose foreground population supplies depth and a handful of defocused lights.
    angle = getRandomValue(seed + 1u) * 6.2831853 + parameters.time * 0.04;
    position = vec3f(cos(angle) * radialDistance * 1.2,
      (getRandomValue(seed + 2u) - 0.5) * 4.5, sin(angle) * radialDistance * 1.2);
    brightness = 0.018 + 0.07 * getRandomValue(seed + 5u);
  } else if (population == 3u || population == 4u) {
    // Keep a compact nucleus inside a broader, dimmer warm stellar envelope.
    // Independent azimuths avoid an artificial double spiral through the nucleus.
    // Rotation blends gently into the disk, with a soft outer falloff into the inner arms.
    let coreFraction = pow(getRandomValue(seed), 1.1);
    // Retain an exponential nucleus inside a filled, softly fading warm envelope.
    let isOuterBulge = population == 4u;
    let normalizedCoreRadius = select(-log(1.0 - coreFraction * 0.985) * 0.55,
      pow(getRandomValue(seed), 0.3333333) * 2.856, isOuterBulge);
    // Sample a filled ellipsoid: height and planar radius share the same spherical shell.
    // This avoids piling tall stars over tiny planar radii into a vertical column.
    let verticalDirection = getRandomValue(seed + 2u) * 2.0 - 1.0;
    let planarFraction = select(1.0, sqrt(1.0 - verticalDirection * verticalDirection), isOuterBulge);
    let coreRadius = normalizedCoreRadius * planarFraction * parameters.radius;
    let coreAngle = getRandomValue(seed + 1u) * 6.2831853;
    // Keep the visual angular-speed difference within ten percent of the main disk.
    let coreAngularSpeed = 0.2 + 0.02 * (1.0 - smoothstep(0.0, 2.856, normalizedCoreRadius));
    angle = coreAngle + parameters.time * coreAngularSpeed;
    let coreHeight = select(verticalDirection * sqrt(1.0 - coreFraction) * 0.275,
      verticalDirection * normalizedCoreRadius * 0.3168, isOuterBulge);
    position = vec3f(cos(angle) * coreRadius, coreHeight * parameters.radius,
      sin(angle) * coreRadius);
    // Define the white center in world radius so widening the envelope cannot widen it.
    let coreWhite = (1.0 - smoothstep(0.08, 0.55, normalizedCoreRadius))
      * select(1.0, 0.25, isOuterBulge);
    starColor = mix(vec3f(1.0, 0.48, 0.06), vec3f(1.0, 0.93, 0.72), coreWhite);
    let coreFade = select(1.0 - smoothstep(0.55, 1.0, coreFraction),
      1.1 * (1.0 - smoothstep(1.224, 2.856, normalizedCoreRadius)), isOuterBulge);
    brightness = (0.4 + 1.3 * getRandomValue(seed + 5u)) * coreFade
      * (0.7 + 0.3 * sin(coreAngle * 3.0 + coreFraction * 9.0));
  } else if (population >= 5u && population <= 8u) {
    // A dim stellar disk connects the bright filaments into a substantial galaxy.
    // These stars fill the gaps without adding another layer of blurry bloom.
    angle = getRandomValue(seed + 9u) * 6.2831853 + parameters.time * 0.2;
    position = vec3f(cos(angle) * radialDistance,
      (getRandomValue(seed + 2u) - 0.5) * (0.06 + radialFraction * 0.16),
      sin(angle) * radialDistance);
    brightness = (0.12 + 0.24 * getRandomValue(seed + 5u))
      * (1.0 - smoothstep(0.75, 1.0, radialFraction));
  }
  let color = starColor * brightness;
  offsets[particleIndex * 3u] = position.x;
  offsets[particleIndex * 3u + 1u] = position.y;
  offsets[particleIndex * 3u + 2u] = position.z;
  colors[particleIndex * 3u] = color.r;
  colors[particleIndex * 3u + 1u] = color.g;
  colors[particleIndex * 3u + 2u] = color.b;
}`;async function il(){if(!navigator.gpu)throw Error(`This showcase requires WebGPU.`);let a=document.querySelector(`#viewport`),l=document.querySelector(`#status`),p=document.querySelector(`#elapsed-time`),m=new qc,h=pc(m),g=document.createElement(`canvas`);a.append(g),l.textContent=`Requesting shared WebGPU device…`;let _=await se.createDevice({adapters:[De],type:`webgpu`,optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:document.createElement(`canvas`),autoResize:!1}}),y=new e({canvas:g,device:_.handle,antialias:!0});l.textContent=`Initializing Three renderer…`,await y.init();let b=qe(_,y);if(!b.supported)throw Error(b.reason);let x=new Je(_,y),S=_.createBuffer({id:`galaxy-positions`,byteLength:$*12,usage:T.STORAGE|T.VERTEX}),C=_.createBuffer({id:`galaxy-colors`,byteLength:$*12,usage:T.STORAGE|T.VERTEX}),ne=_.createBuffer({id:`galaxy-params`,byteLength:16,usage:T.UNIFORM|T.COPY_DST}),ie=new sr(_,{id:`galaxy-animation`}),ae=ie.importBuffer({id:`positions`,byteLength:S.byteLength,usage:S.usage},S),oe=ie.importBuffer({id:`colors`,byteLength:C.byteLength,usage:C.usage},C),ce=ie.importBuffer({id:`params`,byteLength:ne.byteLength,usage:ne.usage},ne);ie.addComputePass({id:`animate-and-color`,resources:[{buffer:ae,usage:`storage-write`},{buffer:oe,usage:`storage-write`},{buffer:ce,usage:`uniform`}],compile:({device:e})=>{let t=new Mt(e,{id:`galaxy-kernel`,source:rl,shaderLayout:{bindings:[{name:`offsets`,type:`storage`,group:0,location:0},{name:`colors`,type:`storage`,group:0,location:1},{name:`parameters`,type:`uniform`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:n})=>{t.setBindings({offsets:n(ae),colors:n(oe),parameters:n(ce)}),t.dispatch(e,$/256)},destroy:()=>t.destroy()}}}),l.textContent=`Compiling galaxy animation…`;let le=await ie.compileAsync(),ue=new o(1,1),w=new f;w.index=ue.index,w.setAttribute(`position`,ue.getAttribute(`position`)),w.setAttribute(`uv`,ue.getAttribute(`uv`));let de=new Float32Array($);for(let e=0;e<$;e++){let t=e>=tl?4:e%16,n=e*16807%65521/65521;de[e]=t<2?.7+n*1.4:t===2?.08+n**8*.9:t===4?.05+n**4*.08:t>=5&&t<=8?.07+n*.12:.024+n**4*.09}w.setAttribute(`instanceSize`,new v(de,1)),w.instanceCount=$,w.setAttribute(`instanceOffset`,x.createInstancedAttribute(S,3,$)),w.setAttribute(`instanceColor`,x.createInstancedAttribute(C,3,$));let fe=new d({color:`#ffffff`,transparent:!0,opacity:.85,blending:2,depthWrite:!1}),pe=Ve(`instanceSize`,`float`),me=Me.mul(pe);fe.positionNode=Ve(`instanceOffset`,`vec3`).add(He.mul(Le(me,0)).xyz);let he=Ne(Re().sub(.5).length().pow(2).mul(4).mul(-5)).sub(Math.exp(-5)).max(0);fe.opacityNode=he,fe.colorNode=Ve(`instanceColor`,`vec3`);let ge=new c(w,fe);ge.frustumCulled=!1;let _e=new u;_e.background=new n(`#010409`),_e.add(ge);let E=new i(50,1,.01,200);E.position.set(0,8.2,19.2),E.up.set(.3,1,0);let D=new ee(E,g);D.enableDamping=!0;let ve=!1,ye=0,be=0;D.addEventListener(`start`,()=>{ve=!0}),D.addEventListener(`end`,()=>{ve=!1,ye=performance.now()+6e3});let xe=new Gr(_,y),Se=new r(1,1,{type:re});Se.depthTexture=new te(1,1);let O=fe.clone();O.transparent=!1,O.blending=0,O.colorWrite=!1,O.depthWrite=!0,O.alphaTest=.2,O.opacityNode=he.mul(pe.lessThan(.25).select(1,0));let Ce=new u,we=new c(w,O);we.frustumCulled=!1,Ce.add(we);let Te=new t(10.1,96),k=new d({colorWrite:!1,depthWrite:!0,side:2}),Oe=new c(Te,k);Oe.rotation.x=-Math.PI/2,Oe.position.y=-1,Ce.add(Oe);let Ae=new s(y),je=Ee(xe.output,ke),Pe=el(je,.45,.3,1.1);Ae.outputNode=je.add(Pe),y.toneMapping=4,y.toneMappingExposure=1.05;let Fe=window.devicePixelRatio,Ie=()=>{let e=Math.max(1,a.clientWidth),t=Math.max(1,a.clientHeight);Fe=window.devicePixelRatio,y.setPixelRatio(Fe),y.setSize(e,t,!1),Se.setSize(g.width,g.height),E.aspect=e/t,E.updateProjectionMatrix()},ze=new ResizeObserver(Ie);ze.observe(a),Ie(),l.textContent=`${$.toLocaleString(`en-US`)} instances · GPU graph → shared buffers → Three.js`;let Be=0,Ue=performance.now(),We=!0,Ge=!1,Ke=e=>{if(!We)return;window.devicePixelRatio!==Fe&&Ie();let t=Math.min((e-Ue)/1e3,.05);Ue=e;let n=h.settings.paused;n||(Be+=t*h.settings.speed);let r=`${(Be*nl).toFixed(0)} Ma`;if(p.textContent!==r&&(p.textContent=r),ne.write(new Float32Array([Be,1,$,0])),m.encode(le,_.commandEncoder,{parameters:void 0}),_.submit(),D.update(),!n&&!ve&&e>=ye){be+=t;let e=E.position.clone().sub(D.target),n=e.length(),r=Math.atan2(e.x,e.z)+t*Math.PI/180,i=(21.5+13.5*Math.cos(be*Math.PI/40))*Math.PI/180,a=Math.asin(Math.max(-1,Math.min(1,e.y/n))),o=a+(i-a)*(1-Math.exp(-t*.5)),s=n*Math.cos(o);E.position.set(D.target.x+Math.sin(r)*s,D.target.y+Math.sin(o)*n,D.target.z+Math.cos(r)*s),E.lookAt(D.target)}y.setRenderTarget(Se),y.render(_e,E),y.autoClear=!1,y.render(Ce,E),y.autoClear=!0,y.setRenderTarget(null),xe.render(Se.texture,Se.depthTexture,E.position.distanceTo(D.target),h.settings.aperture,[E.near,E.far]),Ae.render(),Ge||(Ge=!0,window.parent.postMessage({type:`luma-example-ready`},window.location.origin)),h.update(),requestAnimationFrame(Ke)};requestAnimationFrame(Ke),window.addEventListener(`pagehide`,()=>{We=!1,D.dispose(),h.destroy(),ze.disconnect(),Ae.dispose(),Pe.dispose(),Se.dispose(),O.dispose(),Te.dispose(),k.dispose(),xe.dispose(),ue.dispose(),w.dispose(),fe.dispose(),x.dispose(),le.destroy(),ne.destroy(),S.destroy(),C.destroy(),y.dispose(),_.destroy()},{once:!0})}il().catch(e=>{window.parent.postMessage({type:`luma-example-error`,message:String(e)},window.location.origin),document.querySelector(`#status`).textContent=String(e),w.error(e instanceof Error?e.message:String(e))()});