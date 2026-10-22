import{A as e,Et as t,F as n,It as r,K as i,L as a,O as o,Qt as s,Tt as c,U as l,Zt as u,a as d,an as f,f as p,g as m,l as h,o as g,pt as _,q as v,s as y,t as b,u as x,v as ee,zt as te}from"./OrbitControls-D_EJvESG.js";import{_ as S,m as C}from"./shader-type-decoder-BLygFN_M.js";import{n as ne,t as re}from"./image-types-BAfTQyZr.js";import{d as ie,f as ae,u as w}from"./buffer-layout-utils-DobW9w6a.js";import{S as oe,T as se,a as ce,c as le,g as ue,i as T,n as de,r as fe,t as pe}from"./gpu-vector-chunks-C_IqND_x.js";import{A as me,E as he,N as E,O as ge,P as _e,S as ve,_ as ye,b as be,c as xe,g as D,i as O,j as Se,k,l as Ce,m as we,n as Te,o as Ee,p as De,s as Oe,t as ke,w as Ae,x as je,y as A}from"./interop-CU0bYHch.js";import{n as Me,t as Ne}from"./model-DL_gbJz9.js";import{t as Pe}from"./computation-BazHRsEW.js";var Fe=`struct VertexInputs {
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
`,Ie=`#version 300 es
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
`,Le=[-1,-1,1,-1,-1,1,1,1],Re=[-1,-1,3,-1,-1,3],ze=class extends Ne{constructor(e,t){let{geometryType:n=`quad`,...r}=t,i=n===`triangle`?Re:Le,a=i.map(e=>(e+1)/2),o=i.length/2;r.source&&=`${Fe}\n${r.source}`,super(e,{id:r.id||ue(`clip-space`),...r,vs:Ie,vertexCount:o,geometry:new Me({topology:n===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:o,attributes:{clipSpacePositions:{size:2,value:new Float32Array(i)},texCoords:{size:2,value:new Float32Array(a)},coordinates:{size:2,value:new Float32Array(a)}}})})}},Be={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function j(e){return e?Array.isArray(e)?e[0]??null:e:null}function Ve(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=j(n);if(!e)return null;let{width:t}=He(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=j(n);return e?He(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=j(n[0]);return e?He(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=j(t);return r?He(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=j(e[t]);return r?He(r):null}default:return null}}function He(e){if(ne(e))return re(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function Ue(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function We(e){return ArrayBuffer.isView(e)}function Ge(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function Ke(e){let t=Be[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function qe(e,t){return 6*e+Ke(t)}function Je(e){throw Error(`setTexture1DData not supported in WebGL.`)}function Ye(e){return Array.isArray(e)?e:[e]}function Xe(e,t,n,r){let i=Ye(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(ne(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(Ue(t))o.push({type:`texture-data`,data:t,textureFormat:Ge(t),z:a,mipLevel:e});else if(We(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function Ze(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Xe(n,e[n]));return t}function Qe(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Xe(n,e[n]));return t}function $e(e){let t=[];for(let[n,r]of Object.entries(e)){let e=Ke(n);t.push(...Xe(e,r))}return t}function et(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=qe(n,r);t.push(...Xe(e,i))}}),t}var tt=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=ue(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?nt({...t,width:e.width,height:e.height,format:e.format}):[],r=`format`in e&&e.format!==void 0,i=`usage`in e&&e.usage!==void 0,a=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:Ve(t)||{width:this.props.width||1,height:this.props.height||1};if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let o=rt(this.device,n,a,{format:r?e.format:void 0}),s=o.format??this.props.format,c={...this.props,...a,format:s,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(s)&&!i&&(c.usage=w.SAMPLE|w.COPY_DST);let l=this.props.mipmaps&&!o.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(s);if(this.device.type===`webgpu`&&l){let e=this.props.dimension===`3d`?w.SAMPLE|w.STORAGE|w.COPY_DST|w.COPY_SRC:w.SAMPLE|w.RENDER|w.COPY_DST|w.COPY_SRC;c.usage|=e}let u=this.device.getMipLevelCount(c.width,c.height),d=o.hasExplicitMipChain?o.mipLevels:this.props.mipLevels===`auto`?u:Math.max(1,Math.min(u,this.props.mipLevels??1)),f={...c,mipLevels:d};this._texture=this.device.createTexture(f),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),o.subresources.length&&this._setTextureSubresources(o.subresources),this.props.mipmaps&&!o.hasExplicitMipChain&&!l&&S.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),l&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),S.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):S.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof ie?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:C.COPY_DST|C.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let o=this.device.createFence();return await o.signaled,o.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),S.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=Be[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=Je(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=Xe(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=Ze(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=Qe(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=$e(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=et(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await st(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&S.warn(`${this} already destroyed`)}_checkReady(){this.isReady||S.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...w.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function nt(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return Je(e.data);case`2d`:return Xe(0,e.data,t,n);case`3d`:return Ze(e.data);case`2d-array`:return Qe(e.data);case`cube`:return $e(e.data);case`cube-array`:return et(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function rt(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=at(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=it(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?ot(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=at(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=it(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function it(e){if(e.type===`texture-data`)return e.textureFormat??Ge(e.data)}function at(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function ot(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function st(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(st));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(st)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}var ct={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},lt=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
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
`,ut=`#version 300 es
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
`,dt=class extends ze{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:lt,fs:ut,modules:[...t.modules||[],ct],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof tt?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:this.flipY?1:0}})}},ft=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},pt=class extends ft{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:w.SAMPLE|w.RENDER|w.COPY_SRC|w.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:w.SAMPLE|w.RENDER|w.COPY_SRC|w.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),mt(this.current),t.destroy(),this.next=n.clone(e),mt(this.next),n.destroy(),!0}};function mt(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}function ht(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?gt(e):vt(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?_t(n):yt(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function gt(e){return`\
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
`}function _t(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function vt(e){return`\
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
`}function yt(e){return`\
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
`}var bt={name:`textureTransform`,source:`
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
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},xt=new Set([`original`,`previous`]),St=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(e,t){this.device=e;let n=Et(t.shaderPasses);n.map(e=>oe(e));let r=n.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=t.shaderInputs||new le(r);let i=e.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new pt(e,{colorAttachments:[t.colorFormat||e.preferredColorFormat],width:i[0],height:i[1]}),this.textureModel=new dt(e,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:t.flipY??e.type===`webgpu`});let a=t.flipY??e.type===`webgpu`;this.passRenderers=t.shaderPasses.map(t=>new Ct(e,t,this.shaderInputs,a))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);if(!n)return!1;let r=this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:n}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});return this.textureModel.draw(i),i.end(),!0}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof tt&&!n.isReady)return null;let r=n instanceof tt?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=Kt(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=Wt(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?Gt(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=Wt(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=Nt(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:qt(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},Ct=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,Dt(t)){At(t.name,t.renderTargets||{}),this.renderTargets=Pt(e,t.renderTargets||{}),Ot(e,t)&&(this.computeRenderer=new wt(e,t.compute,this.renderTargets,n)),this.subPassExecutions=(this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps).flatMap(e=>this.createStepExecutions(t,e,r));return}kt(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();Lt(this.renderTargets)}resize(e){Rt(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=Ht(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=Vt(t),n=Ht(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return kt(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return jt(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new Tt(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:Mt(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?Vt(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},wt=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,t,n,r){this.optimization=t,this.renderTargets=n,this.shaderInputs=r,this.parameterBuffer=e.createBuffer({id:`${t.name}-parameters`,byteLength:Math.max(Math.ceil(t.uniformNames.length/4)*16,16),usage:C.UNIFORM|C.COPY_DST});let i=Object.entries(t.outputs).map(([e,t],r)=>({name:e,type:`storage`,group:0,location:r+2,access:`write-only`,format:n[t].texture.format}));try{this.computation=new Pe(e,{id:t.name,source:t.source,shaderLayout:{bindings:[{name:t.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...i]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},Tt=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=ht({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new ze(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[bt,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:this.flipY?1:0}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function Et(e){return e.flatMap(e=>Dt(e)?e.steps.map(e=>e.shaderPass):[e])}function Dt(e){return`steps`in e}function Ot(e,t){let n=t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function kt(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use CompositeShaderPass.renderTargets instead`)}function At(e,t){for(let n of Object.keys(t))if(xt.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function jt(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function Mt(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function Nt(e,t,n){return Mt(Mt(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function Pt(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=Ut(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!Ft(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!It(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=zt(e,i,a,n)}return r}function Ft(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function It(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function Lt(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function Rt(e,t,n){for(let r of new Set(Object.values(t))){let t=Ut(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=zt(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function zt(e,t,n,r){let i=Ut(r,n.scale),{texture:a,framebuffer:o}=Bt(e,t,n,i),s,c;if(n.lifetime===`history`){let r=Bt(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function Bt(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:w.SAMPLE|w.RENDER|w.COPY_SRC|w.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?w.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function Vt(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function Ht(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function Ut(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function Wt(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function Gt(e,t){return t===e.current?e.next:e.current}function Kt(e,t){return Wt(e.current)===t?e.next:e.current}function qt(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}var Jt=class{values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function Yt(e){let t=un(e.nodes),n=hn(t,e.buffers.values()),r=gn(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return Zt(e,t,o,i,a,n,r)}async function Xt(e){let t=un(e.nodes),n=hn(t,e.buffers.values()),r=gn(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=se.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));se.endAsyncCompilation(e.device,o);let[c,l]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),u=[],d=l.find(e=>e.status===`rejected`),f=d?.status===`rejected`?d.reason:void 0;for(let e of c)e.status===`fulfilled`?u.push(e.value):f??=e.reason;if(f){for(let e of u)e.executable.destroy?.();throw f}return Zt(e,t,u,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function Zt(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=Sn(c.map(e=>e.byteLength),`imported buffer capacities`),d=Sn(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=xn(u,d,`logical buffer capacities`),p=Sn(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=Sn(g.map(bn),`imported texture estimates`),y=Sn(_.map(bn),`logical transient texture estimates`),b=xn(v,y,`logical texture estimates`),x=Sn(o.map(e=>e.byteLength),`physical transient texture estimates`),ee=Math.max(0,y-x),te={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:ee,textureReusePercentage:y>0?ee/y*100:0,logicalResourceBytes:xn(f,b,`logical resource estimates`),physicalTransientResourceBytes:xn(p,x,`physical transient resource estimates`)},S=Qt(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:te,preflight:S}}function Qt(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,type:e.type,...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])en(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,rn(n.buffer).size));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?xn(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function M(e){return`buffer`in e?e.buffer:e}function $t(e){return`texture`in e?e.texture:e}function en(e){return`buffer`in e}function tn(e){return`texture`in e}function nn(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>en(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||M(r.buffer)!==M(n.buffer)||!sn(r.usage)&&!sn(n.usage))continue;let a=rn(r.buffer),o=rn(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=M(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${an(a)} and ${an(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function rn(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function an(e){return`${e.offset}–${e.offset+e.size} bytes`}function on(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function sn(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function cn(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function ln(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function un(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(en(t)){let n=M(t.buffer);if(on(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(sn(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(tn(t)){let n=$t(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&dn(n.resource,t)&&(cn(t.usage)&&ln(n.resource.usage)||ln(t.usage)&&(cn(n.resource.usage)||ln(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function dn(e,t){if($t(e.texture)!==$t(t.texture))return!1;let n=fn(e.texture),r=fn(t.texture);return pn(n.aspect,r.aspect)&&mn(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&mn(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function fn(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function pn(e,t){return e===`all`||t===`all`||e===t}function mn(e,t,n,r){return e<n+r&&n<e+t}function hn(e,t){let n=_n(e,e=>en(e)?M(e.buffer):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),a=new Jt((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),o=new Jt((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index);for(let{buffer:e,lifetime:t}of i){if(!t)continue;for(;a.peek()&&a.peek().allocation.lastUse<t.firstUse;)o.push(a.pop());let n=o.pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:r.length},r.push(n.allocation));let{allocation:i}=n;i.byteLength=Math.max(i.byteLength,e.byteLength),i.usage|=e.usage,i.lastUse=t.lastUse,i.handles.push(e),a.push(n)}return r}function gn(e,t){let n=_n(e,e=>tn(e)?$t(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&yn(n.descriptor,e));n||(n={descriptor:vn(e),byteLength:bn(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function _n(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function vn(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function yn(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function bn(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=xn(t,ae.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function xn(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function Sn(e,t){return e.reduce((e,n)=>xn(e,n,t),0)}var Cn=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},wn=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},Tn=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=pe(this.data)}},En=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},Dn=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},On=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}};function kn(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function An(e,t){for(let n of t)kn(e,n)}var jn=4,Mn=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){Rn(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function Nn(e,t,n={}){Rn(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=Pn();for(;s<a.length;){let r=Fn(n,a[s]);if(s>e&&In(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||Ln(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:In(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>Fn(e,t),Pn());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function Pn(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function Fn(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function In(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function Ln(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function Rn(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function zn(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var Bn=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i){this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let a=e.filter(e=>e.stats.condition?.outcome!==`skipped`),o=a.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:a.length,skippedNodeCount:e.length-a.length,computePassCount:n,coalescedComputeNodeCount:o-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},Vn=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);Xn(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),Qn(e,this.device),t&&rr(t,e,this.device);let n=this.addBuffer(new Cn(this,e,!1,t));if(t){let e=Un(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof ce&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),Qn(e,this.device),this.addBuffer(new Cn(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=de(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return nr(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new wn(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(T(n)||fe(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=de(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new Tn({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=er(e,this.device);return t&&ir(t,n,this.device),this.addTexture(new En(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=er(e,this.device);return this.addTexture(new En(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),$n(e,this.device),this.addExternalTexture(new Dn(this,e))}createTransientTexture(e){this.assertMutable();let t=er(e,this.device);return this.addTexture(new En(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new On(e,tr(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)An(this,e.getCommandNodes(this));else if(`type`in e)kn(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),Xn(this.device,`compilation`),this.compiled=!0,new Hn(Yt({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}async compileAsync(){return this.assertMutable(),Xn(this.device,`compilation`),this.compiled=!0,new Hn(await Xt({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*jn>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>en(e)&&M(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(en(t)){let e=M(t.buffer);this.assertBuffer(e),or(e,t.usage)}else if(tn(t)){let e=$t(t.texture);this.assertTexture(e),sr(e,t.usage),cr(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}nn(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=Un(t.buffer),r={byteLength:Wn(t),usage:n.usage},i=t.buffer instanceof ce?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof ce?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&Gn(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&Gn(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&Un(n.defaultBuffer)===e&&Gn(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&Gn(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&Gn(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},Hn=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(en(t)){let e=M(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(tn(t)){let e=$t(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=Yn(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return Nn(this.preflight,e,t)}createExecution(e,t={}){return new Mn({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(Xn(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=Zn(),a=this.resolveImportedBuffers(t.buffers??{});qn(t.frameTextures??{},t.externalTextures??{});let o=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),s=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of o.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of s.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of s.textures.values())this.consumedExternalTextures.add(e);let c=o.textures,l=e=>{let t=M(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},u=e=>{let t=$t(e),n=t.transient?this.transientTextures.get(t):c.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},d=e=>{let t=u(e);if(e instanceof En||dr(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},f={commandEncoder:e,parameters:t.parameters,getBuffer:l,getTexture:u,getTextureView:d,getExternalTexture:e=>{let t=s.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},p=[],m,h=0,g=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,_=()=>{let e=m;m=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=Zn();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){let e=Zn();p.push({stats:{id:n.id,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{m||(m=e.beginComputePass({id:n.id}),h++);let t=m;o=Jn(t,e),o&&(g=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?zn(t,l(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...f,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}g||_();break}case`render`:{_();let t=r,i=t.getRenderPassProps?.(f)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,d):void 0,s=n.attachments?.resolveTargets?.map(e=>e?d(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=Jn(c,e),c.pushDebugGroup(n.id);try{t.encode({...f,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:_(),r.encode(f);break}let s=Zn();p.push({stats:{id:n.id,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{_()}let v=Zn();return new Bn(p,v-i,h,i,v)}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);rr(a,i,this.device);let o=Un(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);ir(e.texture,a,this.device),n.set(a,Kn(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);ir(o,a,this.device),n.set(a,Kn(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);ar(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function Un(e){return e instanceof ce?e.buffer:e}function Wn(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function Gn(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function Kn(e){if(e instanceof tt){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function qn(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function Jn(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function Yn(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function Xn(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function Zn(){return globalThis.performance?.now()??Date.now()}function Qn(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function $n(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function er(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,r))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function tr(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function nr(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function rr(e,t,n){let r=Un(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function ir(e,t,n){let r=Kn(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function ar(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function or(e,t){let n=lr(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function sr(e,t){let n=ur(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function cr(e,t){if(e instanceof On&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function lr(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return C.STORAGE;case`uniform`:return C.UNIFORM;case`copy-source`:return C.COPY_SRC;case`copy-destination`:return C.COPY_DST;case`indirect`:return C.INDIRECT;case`vertex`:return C.VERTEX;case`index`:return C.INDEX}}function ur(e){switch(e){case`sampled`:return w.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return w.STORAGE;case`render-attachment`:return w.RENDER;case`copy-source`:return w.COPY_SRC;case`copy-destination`:return w.COPY_DST}}function dr(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var fr=120,pr=class{maxSamples;getNodeGroup;graphs=new Map;encodingGraphs=new WeakMap;constructor(e={}){let t=e.maxSamples??fr;if(!Number.isSafeInteger(t)||t<=0)throw Error(`GPUCommandGraphInspector maxSamples must be a positive safe integer`);this.maxSamples=t,this.getNodeGroup=e.getNodeGroup}registerGraph(e){this.graphs.set(e.id,{id:e.id,stats:mr(e.stats),capabilities:Object.freeze({...e.capabilities}),...e.preflight?{preflight:hr(e.preflight)}:{},encodingCount:0,timingReadFailureCount:0,cpuSamples:[],gpuSamples:[],counters:new Map,nodes:new Map});let t=this.getGraph(e.id);for(let n of e.preflight?.nodes??[])this.getNode(t,n)}observeGraph(e){this.registerGraph(e);let t=this.getGraph(e.id),n=new WeakMap,r=!0,i=()=>r&&this.graphs.get(e.id)===t;return Object.freeze({graph:e,encode:(n,r)=>{let a=e.encode(n,r);return i()&&this.recordGraphEncoding(t,a),a},recordGPUTimings:async r=>{let a=n.get(r);if(a)return await a;if(i()&&this.encodingGraphs.get(r)===t){let i=this.recordGraphGPUTimings(e.id,t,r);return n.set(r,i),await i}},recordCounters:e=>{i()&&this.recordGraphCounters(t,e)},detach:()=>{r&&(r=!1,this.graphs.get(e.id)===t&&this.graphs.delete(e.id))}})}clear(){this.graphs.clear()}recordEncoding(e,t){let n=this.getGraph(e);this.recordGraphEncoding(n,t)}recordCounters(e,t){this.recordGraphCounters(this.getGraph(e),t)}recordGraphEncoding(e,t){this.encodingGraphs.set(t,e);let{stats:n}=t;e.encodingCount++,this.addSample(e.cpuSamples,n.cpuEncodeTimeMilliseconds);for(let t of n.nodes){let n=this.getNode(e,t);this.addSample(n.cpuSamples,t.cpuEncodeTimeMilliseconds)}}recordGraphCounters(e,t){let n=Object.entries(t);for(let[e,t]of n)if(!e||!Number.isFinite(t)||t<0)throw Error(`GPUCommandGraphInspector counters require an ID and a finite, non-negative value`);for(let[t,r]of n){let n=e.counters.get(t);n||(n=[],e.counters.set(t,n)),this.addSample(n,r)}}async recordGPUTimings(e,t){let n=this.encodingGraphs.get(t)??this.getGraph(e);return await this.recordGraphGPUTimings(e,n,t)}async recordGraphGPUTimings(e,t,n){if(this.graphs.get(e)!==t)return;let r;try{r=await n.readTimings()}catch{this.graphs.get(e)===t&&t.timingReadFailureCount++;return}if(this.graphs.get(e)===t){r.gpuTimeMilliseconds!==void 0&&this.addSample(t.gpuSamples,r.gpuTimeMilliseconds);for(let e of r.nodes)if(e.gpuTimeMilliseconds!==void 0){let n=this.getNode(t,e);this.addSample(n.gpuSamples,e.gpuTimeMilliseconds)}return r}}getSnapshot(){let e=Array.from(this.graphs.values(),e=>this.getGraphSnapshot(e));return Object.freeze({graphs:Object.freeze(e)})}getGraph(e){let t=this.graphs.get(e);if(!t)throw Error(`GPUCommandGraphInspector graph "${e}" is not registered`);return t}getNode(e,t){let n=e.nodes.get(t.id);if(n)return n;let r=this.getNodeGroup?.({graphId:e.id,id:t.id,type:t.type}),i={id:t.id,type:t.type,...r===void 0?{}:{group:r},cpuSamples:[],gpuSamples:[]};return e.nodes.set(i.id,i),i}addSample(e,t){e.push(t),e.length>this.maxSamples&&e.splice(0,e.length-this.maxSamples)}getGraphSnapshot(e){let t=[],n=new Set;for(let r of e.stats.nodeOrder){let i=e.nodes.get(r);i&&(t.push(i),n.add(r))}for(let r of e.nodes.values())n.has(r.id)||t.push(r);let r=t.map(e=>Object.freeze({id:e.id,type:e.type,...e.group===void 0?{}:{group:e.group},cpu:gr(e.cpuSamples),gpu:gr(e.gpuSamples)})),i=Array.from(e.counters,([e,t])=>_r(e,t));return Object.freeze({id:e.id,stats:e.stats,capabilities:e.capabilities,...e.preflight?{preflight:e.preflight}:{},encodingCount:e.encodingCount,timingReadFailureCount:e.timingReadFailureCount,totals:Object.freeze({cpu:gr(e.cpuSamples),gpu:gr(e.gpuSamples)}),counters:Object.freeze(i),nodes:Object.freeze(r)})}};function mr(e){return Object.freeze({...e,nodeOrder:Object.freeze([...e.nodeOrder])})}function hr(e){return Object.freeze({...e,nodes:Object.freeze(e.nodes.map(e=>Object.freeze({...e})))})}function gr(e){if(e.length===0)return Object.freeze({sampleCount:0});let t=[...e].sort((e,t)=>e-t);return Object.freeze({sampleCount:e.length,latestMilliseconds:e[e.length-1],p50Milliseconds:vr(t,.5),p95Milliseconds:vr(t,.95)})}function _r(e,t){let n=[...t].sort((e,t)=>e-t);return Object.freeze({id:e,sampleCount:t.length,latestValue:t[t.length-1],p50Value:vr(n,.5),p95Value:vr(n,.95)})}function vr(e,t){return e[Math.ceil(t*e.length)-1]}var yr=20,br=`\
const DEPTH_OF_FIELD_MAX_BLUR: i32 = ${yr};

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
`,xr=`\
#define DEPTH_OF_FIELD_MAX_BLUR ${yr}.0

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
`,Sr={name:`dof`,source:br,fs:xr,bindingLayout:[{name:`depthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{depthRange:`vec2<f32>`,focusDistance:`f32`,blurCoefficient:`f32`,pixelsPerMillimeter:`f32`,texelOffset:`vec2<f32>`,circularAperture:`f32`},propTypes:{depthRange:{value:[.1,100]},focusDistance:{value:1,min:1e-4},blurCoefficient:{value:1,min:0},pixelsPerMillimeter:{value:1,min:0},texelOffset:{value:[1,0],private:!0},circularAperture:{value:0,private:!0}},passes:[{sampler:!0}]},Cr={...Sr,name:`bokehDof`,source:br.replaceAll(`dof`,`bokehDof`),fs:xr.replaceAll(`dof`,`bokehDof`),propTypes:{...Sr.propTypes,circularAperture:{value:1,private:!0}}},wr=class{output=new a;passes;backend;source;depth;sourceHandle;outputHandle;constructor(e,t){this.device=e,this.backend=t.backend,this.output.flipY=!1,this.passes=new St(e,{shaderPasses:[Cr],colorFormat:`rgba16float`,flipY:!0})}render(e,t,n,r,i){let a=this.backend.get(e).texture;this.sourceHandle!==a&&(this.source?.destroy(),this.depth?.destroy(),this.sourceHandle=a,this.source=this.borrowTexture(a),this.depth=this.borrowTexture(this.backend.get(t).texture),this.device.getCanvasContext().setDrawingBufferSize(a.width,a.height),this.passes.resize([a.width,a.height]));let o=this.passes.renderToTexture({sourceTexture:this.source,bindings:{depthTexture:this.depth},uniforms:{bokehDof:{depthRange:i,focusDistance:n,blurCoefficient:r*24,pixelsPerMillimeter:a.height/850}}});this.device.submit();let s=o.handle;this.outputHandle!==s&&(this.outputHandle&&this.output.dispose(),this.outputHandle=s,this.output.sourceTexture=s,this.output.needsUpdate=!0)}dispose(){this.output.dispose(),this.source?.destroy(),this.depth?.destroy(),this.passes.destroy()}borrowTexture(e){return this.device.createTexture({handle:e,_isHandleBorrowed:!0,width:e.width,height:e.height,format:e.format,sampler:{minFilter:`nearest`,magFilter:`nearest`}})}},Tr=`// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
//
// GPUCommandGraph -> borrowed GPU buffers -> upstream Three.js WebGPURenderer.
// Three 0.185.1 is intentionally pinned: the bridge uses private renderer hooks.
import {Buffer, luma, log} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
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
  const resize = () => {
    const width = container.clientWidth,
      height = container.clientHeight;
    renderer.setSize(width, height, false);
    sceneTarget.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();
  status.textContent = \`\${PARTICLE_COUNT.toLocaleString('en-US')} instances · GPU graph → shared buffers → Three.js\`;
  let time = 0,
    previousTimestamp = performance.now(),
    running = true;
  const animate = (now: number) => {
    if (!running) return;
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
      window.removeEventListener('resize', resize);
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
  document.querySelector<HTMLElement>('#status')!.textContent = String(error);
  log.error(error instanceof Error ? error.message : String(error))();
});
`,Er=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!kr(t.style,n.style)&&(Or(r,t.style),Dr(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return Dr(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function Dr(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(Ar(n),String(r))}function Or(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(Ar(n))}function kr(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length?n.every(n=>e?.[n]===t?.[n]):!1}function Ar(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var jr=class extends Er{static defaultProps={...Er.defaultProps,panel:void 0,placement:`top-left`}},Mr=`data-deck-gl-community-panels-styles`,Nr=`.deck-widget {
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
`;function Pr(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function Fr(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(Pr))return!0}return!1}function Ir(e){if(e.querySelector(`style[${Mr}]`)||Fr(e))return;let t=e.createElement(`style`);t.setAttribute(Mr,`true`),t.textContent=Nr,e.head.appendChild(t)}var Lr={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Rr=`top-left`,zr=`root`,Br=class{deck;parentElement;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,deck:t=null,className:n}){this.deck=t,this.parentElement=e,this.className=n,Ir(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),n&&this.parentElement.classList.add(n)}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!Vr(e.components,this.components)){let t=e.components.filter(Hr);this._setComponents(t)}}finalize(){for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e}_addComponent(e){let{viewId:t=null,placement:n=Rr}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:zr,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Lr[t]),r.append(i)),i}_updateContainers(){let e=this.deck,t=e?.width??this.parentElement.clientWidth,n=e?.height??this.parentElement.clientHeight;for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===zr||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function Vr(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Hr(e){return e instanceof Er}var Ur,N,Wr,P,Gr,Kr,qr,Jr,Yr,Xr,Zr,Qr,$r,ei,ti,ni={},ri=[],ii=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ai=Array.isArray;function F(e,t){for(var n in t)e[n]=t[n];return e}function oi(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function I(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?Ur.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return si(e,o,r,i,null)}function si(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Wr,__i:-1,__u:0};return i==null&&N.vnode!=null&&N.vnode(a),a}function ci(e){return e.children}function L(e,t){this.props=e,this.context=t}function li(e,t){if(t==null)return e.__?li(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?li(e):null}function ui(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=F({},t);a.__v=t.__v+1,N.vnode&&N.vnode(a),Si(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??li(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,wi(r,a,i),t.__e=t.__=null,a.__e!=n&&di(a)}}function di(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),di(e)}function fi(e){(!e.__d&&(e.__d=!0)&&P.push(e)&&!pi.__r++||Gr!=N.debounceRendering)&&((Gr=N.debounceRendering)||Kr)(pi)}function pi(){try{for(var e,t=1;P.length;)P.length>t&&P.sort(qr),e=P.shift(),t=P.length,ui(e)}finally{P.length=pi.__r=0}}function mi(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||ri,y=t.length;for(c=hi(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||ni,p.__i=d,g=Si(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&Di(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=gi(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function hi(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=si(null,o,null,null,null):ai(o)?o=e.__k[a]=si(ci,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=si(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=vi(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=li(s)),Oi(s,s));return r}function gi(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=gi(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=li(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function _i(e,t){return t||=[],e==null||typeof e==`boolean`||(ai(e)?e.some(function(e){_i(e,t)}):t.push(e)),t}function vi(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>(u?1:0)){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function yi(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||ii.test(t)?n:n+`px`}function bi(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||yi(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||yi(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(Zr,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[Xr]=r[Xr]:(n[Xr]=Qr,e.addEventListener(t,a?ei:$r,a)):e.removeEventListener(t,a?ei:$r,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function xi(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[Yr]==null)t[Yr]=Qr++;else if(t[Yr]<n[Xr])return;return n(N.event?N.event(t):t)}}}function Si(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,ee,te,S,C=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=N.__b)&&u(t);n:if(typeof C==`function`)try{if(_=t.props,v=C.prototype&&C.prototype.render,y=(u=C.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new C(_,b):(t.__c=d=new L(_,b),d.constructor=C,d.render=ki),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&C.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=F({},d.__s)),F(d.__s,C.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&C.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&C.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),ri.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=N.__r,ee=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),ri.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++ee<25);d.state=d.__s,d.getChildContext!=null&&(r=F(F({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),te=u!=null&&u.type===ci&&u.key==null?Ti(u.props.children):u,s=mi(e,ai(te)?te:[te],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(S=a.length;S--;)oi(a[S]);Ci(t)}else t.__e=n.__e,t.__k=n.__k,e.then||Ci(t);N.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=Ei(n.__e,t,n,r,i,a,o,c,l);return(u=N.diffed)&&u(t),128&t.__u?void 0:s}function Ci(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(Ci))}function wi(e,t,n){for(var r=0;r<n.length;r++)Di(n[r],n[++r],n[++r]);N.__c&&N.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){N.__e(e,t.__v)}})}function Ti(e){return typeof e!=`object`||!e||e.__b>0?e:ai(e)?e.map(Ti):e.constructor===void 0?F({},e):null}function Ei(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||ni,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(N.__m&&N.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&Ur.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||bi(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||bi(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),mi(t.type==`template`?e.content:e,ai(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&li(n,0),s,c),a!=null)for(l=a.length;l--;)oi(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&bi(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&bi(e,l,h,g[l],i))}return e}function Di(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){N.__e(e,n)}}function Oi(e,t,n){var r,i;if(N.unmount&&N.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||Di(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){N.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&Oi(r[i],t,n||typeof e.type!=`function`);n||oi(e.__e),e.__c=e.__=e.__e=void 0}function ki(e,t,n){return this.constructor(e,n)}function R(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),N.__&&N.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],Si(t,e=(!r&&n||t).__k=I(ci,null,[e]),i||ni,ni,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?Ur.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),wi(a,e,o)}function Ai(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,fi(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+ ti++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}Ur=ri.slice,N={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},Wr=0,L.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=F({},this.state);typeof e==`function`&&(e=e(F({},n),this.props)),e&&F(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),fi(this))},L.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),fi(this))},L.prototype.render=ci,P=[],Kr=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,qr=function(e,t){return e.__v.__b-t.__v.__b},pi.__r=0,Jr=Math.random().toString(8),Yr=`__d`+Jr,Xr=`__a`+Jr,Zr=/(PointerCapture)$|Capture$/i,Qr=0,$r=xi(!1),ei=xi(!0),ti=0;var ji=0;Array.isArray;function z(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--ji,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return N.vnode&&N.vnode(l),l}var Mi,B,Ni,Pi,Fi=0,Ii=[],V=N,Li=V.__b,Ri=V.__r,zi=V.diffed,Bi=V.__c,Vi=V.unmount,Hi=V.__;function Ui(e,t){V.__h&&V.__h(B,e,Fi||t),Fi=0;var n=B.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function H(e){return Fi=1,Wi(ta,e)}function Wi(e,t,n){var r=Ui(Mi++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):ta(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=B,!B.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};B.__f=!0;var a=B.shouldComponentUpdate,o=B.componentWillUpdate;B.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},B.shouldComponentUpdate=i}return r.__N||r.__}function U(e,t){var n=Ui(Mi++,3);!V.__s&&ea(n.__H,t)&&(n.__=e,n.u=t,B.__H.__h.push(n))}function Gi(e,t){var n=Ui(Mi++,4);!V.__s&&ea(n.__H,t)&&(n.__=e,n.u=t,B.__h.push(n))}function Ki(e){return Fi=5,W(function(){return{current:e}},[])}function W(e,t){var n=Ui(Mi++,7);return ea(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function qi(e,t){return Fi=8,W(function(){return e},t)}function Ji(e){var t=B.context[e.__c],n=Ui(Mi++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(B)),t.props.value):e.__}function Yi(){for(var e;e=Ii.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(Qi),t.__h.some($i),t.__h=[]}catch(n){t.__h=[],V.__e(n,e.__v)}}}V.__b=function(e){B=null,Li&&Li(e)},V.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Hi&&Hi(e,t)},V.__r=function(e){Ri&&Ri(e),Mi=0;var t=(B=e.__c).__H;t&&(Ni===B?(t.__h=[],B.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(Qi),t.__h.some($i),t.__h=[],Mi=0)),Ni=B},V.diffed=function(e){zi&&zi(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(Ii.push(t)!==1&&Pi===V.requestAnimationFrame||((Pi=V.requestAnimationFrame)||Zi)(Yi)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),Ni=B=null},V.__c=function(e,t){t.some(function(e){try{e.__h.some(Qi),e.__h=e.__h.filter(function(e){return!e.__||$i(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],V.__e(n,e.__v)}}),Bi&&Bi(e,t)},V.unmount=function(e){Vi&&Vi(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{Qi(e)}catch(e){t=e}}),n.__H=void 0,t&&V.__e(t,n.__v))};var Xi=typeof requestAnimationFrame==`function`;function Zi(e){var t,n=function(){clearTimeout(r),Xi&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);Xi&&(t=requestAnimationFrame(n))}function Qi(e){var t=B,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),B=t}function $i(e){var t=B;e.__c=e.__(),B=t}function ea(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function ta(e,t){return typeof t==`function`?t(e):t}var na={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},ra={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},ia=Ai(void 0);function aa({panel:e,children:t}){let n=Ji(ia),r=Ki(null),[i,a]=H(`light`),o=oa(n??i,e.theme);return Gi(()=>{if(!n){let e=r.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=la(t);a(t=>t===e?t:e)};n();let i=new MutationObserver(()=>{n()});for(let e of sa(t))i.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{i.disconnect()}}},[n]),z(ia.Provider,{value:o,children:z(`div`,{ref:r,"data-panel-theme-mode":o,style:ca(o),children:t})})}function oa(e,t){return t===`dark`?`dark`:t===`light`?`light`:t===`invert`?e===`dark`?`light`:`dark`:e}function sa(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function ca(e){return{...e===`dark`?ra:na}}function la(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=ua(t.getComputedStyle(e).getPropertyValue(`--menu-background`).trim());return n&&da(n)<.5?`dark`:`light`}function ua(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function da([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}var fa;function pa(e){let t=Math.max(220,Math.floor(e));return Number.isFinite(t)?t:360}function ma({panel:e,title:t,widthPx:n,maxHeightPx:r,open:i,collapsible:a,onOpenChange:o}){return z(`section`,{style:_a(n,r),"aria-label":t??`Panel box`,onPointerDown:G,onPointerMove:G,onPointerUp:G,onMouseDown:G,onMouseMove:G,onMouseUp:G,onTouchStart:G,onTouchMove:G,onTouchEnd:G,onClick:G,onContextMenu:G,onWheel:G,children:[t?z(`header`,{style:va,children:a?z(`button`,{type:`button`,"aria-expanded":i,style:ya,onClick:()=>o(!i),children:[z(`span`,{children:t}),z(`span`,{"aria-hidden":`true`,style:ba(i),children:i?`▾`:`▸`})]}):z(`span`,{children:t})}):null,z(`div`,{style:xa(i),children:e?z(aa,{panel:e,children:e.content}):null})]})}var ha=class extends jr{static defaultProps={...jr.defaultProps,id:`box-panel-container`,placement:`bottom-left`,title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0};className=`deck-widget-box`;placement=fa.defaultProps.placement;title=fa.defaultProps.title;widthPx=fa.defaultProps.widthPx;collapsible=fa.defaultProps.collapsible;isOpen=fa.defaultProps.defaultOpen;#e=fa.defaultProps.panel;#t=null;#n=void 0;#r=!1;#i=!1;#a=void 0;constructor(e={}){super({...fa.defaultProps,...e}),this.setProps(this.props)}setProps(e){e.placement!==void 0&&(this.placement=e.placement),`title`in e&&(this.title=e.title),e.widthPx!==void 0&&(this.widthPx=pa(e.widthPx)),e.collapsible!==void 0&&(this.collapsible=e.collapsible),this.#c(e),`panel`in e&&(this.#e=e.panel),this.#s(),super.setProps(e)}onRemove(){this.#t&&R(null,this.#t)}onRenderHTML(e){this.#t=e,e.style.margin=`0`,this.#s()}onViewportChange(){this.#s()}#o=e=>{this.#i||(this.isOpen=e),this.#a?.(e),this.#s()};#s=()=>{this.#t&&(this.#n=ga(this.#t),R(z(ma,{panel:this.#e,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#o}),this.#t))};#c(e){if(this.#i=e.open!==void 0,e.onOpenChange!==void 0&&(this.#a=e.onOpenChange),e.open!==void 0){this.isOpen=e.open,this.#r=!0;return}!this.#r&&e.defaultOpen!==void 0&&(this.isOpen=e.defaultOpen,this.#r=!0)}};fa=ha;function G(e){e.stopPropagation()}function ga(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow===`hidden`||n?.overflowX===`hidden`||n?.overflowY===`hidden`)&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}var _a=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...t===void 0?{}:{maxHeight:`${t}px`},boxSizing:`border-box`,display:`flex`,flexDirection:`column`,pointerEvents:`auto`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`12px`,background:`var(--menu-background, rgba(255, 255, 255, 0.96))`,backdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))`,overflow:`hidden`}),va={padding:`14px 16px 10px`,fontSize:`18px`,fontWeight:700,lineHeight:1.2,color:`var(--button-text, currentColor)`},ya={width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`12px`,border:`none`,background:`none`,color:`inherit`,padding:`0`,margin:`0`,cursor:`pointer`,font:`inherit`,textAlign:`left`},ba=e=>({fontSize:`18px`,lineHeight:1,color:`var(--button-icon-idle, #616166)`,transform:e?`translateY(1px)`:`translateY(-1px)`}),xa=e=>({display:e?`block`:`none`,flex:`1 1 auto`,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`0 16px 16px`});function Sa(e,t){let[n,r]=H(t),i=e!==void 0,a=i?e:n;return U(()=>{i&&r(e)},[i,e]),[a,qi(e=>{i||r(e)},[i])]}var Ca=class extends Er{static defaultProps={...Er.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){R(I(aa,{panel:this},this.content),e)}onRemove(){this.rootElement&&R(null,this.rootElement)}},wa=class extends Ca{constructor({panels:e,id:t=`tabbed-panels`,title:n=`Panels`,tabListLayout:r=`wrap`,theme:i=`inherit`}){super({id:t,title:n,theme:i,content:z(Ta,{panels:e,tabListLayout:r})})}};function Ta({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=Sa(r,n),c=W(()=>e.filter(e=>!e.disabled),[e]),l=W(()=>o&&c.some(e=>e.id===o)?o:c[0]?.id,[o,c]);return U(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),z(`div`,{className:t,style:Ea,children:[z(`div`,{"data-panel-tabs":``,style:Da(a),children:e.map(e=>{let t=e.id===l;return z(`button`,{type:`button`,style:{...Oa,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border, rgba(148, 163, 184, 0.35))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onPointerDown:t=>{if(e.disabled){t.stopPropagation();return}t.preventDefault(),s(e.id),i?.(e.id)},children:e.title},e.id)})}),z(`div`,{style:ka,children:e.map(e=>{let t=e.id===l;return z(`div`,{"aria-hidden":!t,style:{...Aa,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:z(aa,{panel:e,children:e.content})},e.id)})})]})}var Ea={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--button-corner-radius, 8px)`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,color:`var(--menu-text, rgb(24, 24, 26))`};function Da(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`4px`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`4px 6px`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var Oa={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`4px`,margin:0,padding:`4px 8px`,fontSize:`12px`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},ka={display:`grid`,alignItems:`start`,padding:`10px`,overflow:`auto`},Aa={gridArea:`1 / 1`,minWidth:0};function ja({className:e,onRenderHTML:t}){let n=Ki(null);return Gi(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),z(`div`,{ref:n,className:e})}var Ma=class extends Ca{constructor({id:e,title:t,onRenderHTML:n,disabled:r,keepMounted:i,className:a,theme:o=`inherit`}){super({id:e,title:t,theme:o,disabled:r,keepMounted:i,content:z(ja,{className:a,onRenderHTML:n})})}};function Na(e,t){let n=Ga(t);if(!n.length)return;let r=e;for(let e of n){if(!Wa(r))return;r=r[e]}return r}function Pa(e,t,n){let r=e;return Number.isFinite(t)&&(r=Math.max(t,r)),Number.isFinite(n)&&(r=Math.min(n,r)),r}function Fa(e,t,n){let r=Ga(t);if(!r.length)return e;let i={...e},a=i,o=e;return r.forEach((e,t)=>{if(t===r.length-1){a[e]=n;return}let i=o[e],s=Wa(i)?{...i}:{};a[e]=s,a=s,o=Wa(i)?i:{}}),i}function Ia(e,t){return e.id?.trim()||e.name?.trim()||`section-${t}`}function La(e){return e.initiallyCollapsed??!0}function Ra(e){return e.reduce((e,t,n)=>(e[Ia(t,n)]=La(t),e),{})}function za(e){return Wa(e)&&`label`in e&&`value`in e?{label:String(e.label),value:e.value,description:typeof e.description==`string`?e.description:void 0}:{label:String(e),value:e}}function Ba(e){return e&&e.persist?e.persist:`local-storage`}function Va(e){return e.defaultValue===void 0?e.type===`boolean`?!1:e.type===`number`?Number.isFinite(e.min)?e.min:0:e.type===`select`?e.options?.length?za(e.options[0]).value:``:e.type===`multi-select`?[]:``:e.defaultValue}function Ha(e,t){let n=Na(t,e.name);if(e.type===`boolean`)return typeof n==`boolean`?n:Va(e);if(e.type===`number`)return Pa(typeof n==`number`?n:Number.isFinite(Number(n))?Number(n):Va(e),e.min,e.max);if(e.type===`select`){let t=(e.options??[]).map(za),r=Va(e),i=typeof n==`string`||typeof n==`number`||typeof n==`boolean`?n:r;if(!t.length)return String(i);let a=t.find(e=>e.value===i);return a?a.value:t[0].value}if(e.type===`multi-select`){if(Array.isArray(n))return n.filter(e=>typeof e==`string`&&e.length>0);let t=Va(e);return Array.isArray(t)?t:[]}if(typeof n==`string`)return n;let r=Va(e);return typeof r==`string`?r:String(r)}function Ua(e,t){let n={};return t.forEach((t,r)=>{let i=Ia(t,r);n[i]=e[i]??La(t)}),n}function Wa(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function Ga(e){return e.split(`.`).map(e=>e.trim()).filter(Boolean)}function Ka(e,t){for(var n in t)e[n]=t[n];return e}function qa(e,t){for(var n in e)if(n!==`__source`&&!(n in t))return!0;for(var r in t)if(r!==`__source`&&e[r]!==t[r])return!0;return!1}function Ja(e,t){this.props=e,this.context=t}(Ja.prototype=new L).isPureReactComponent=!0,Ja.prototype.shouldComponentUpdate=function(e,t){return qa(this.props,e)||qa(this.state,t)};var Ya=N.__b;N.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),Ya&&Ya(e)},typeof Symbol<`u`&&Symbol.for;var Xa=N.__e;N.__e=function(e,t,n,r){if(e.then){for(var i,a=t;a=a.__;)if((i=a.__c)&&i.__c)return t.__e??(t.__e=n.__e,t.__k=n.__k),i.__c(e,t)}Xa(e,t,n,r)};var Za=N.unmount;function Qa(e,t,n){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(e){typeof e.__c==`function`&&e.__c()}),e.__c.__H=null),(e=Ka({},e)).__c!=null&&(e.__c.__P===n&&(e.__c.__P=t),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(e){return Qa(e,t,n)})),e}function $a(e,t,n){return e&&n&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(e){return $a(e,t,n)}),e.__c&&e.__c.__P===t&&(e.__e&&n.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=n)),e}function eo(){this.__u=0,this.o=null,this.__b=null}function to(e){var t=e.__&&e.__.__c;return t&&t.__a&&t.__a(e)}function no(){this.i=null,this.l=null}N.unmount=function(e){var t=e.__c;t&&(t.__z=!0),t&&t.__R&&t.__R(),t&&32&e.__u&&(e.type=null),Za&&Za(e)},(eo.prototype=new L).__c=function(e,t){var n=t.__c,r=this;r.o??=[],r.o.push(n);var i=to(r.__v),a=!1,o=function(){a||r.__z||(a=!0,n.__R=null,i?i(c):c())};n.__R=o;var s=n.__P;n.__P=null;var c=function(){if(!--r.__u){if(r.state.__a){var e=r.state.__a;r.__v.__k[0]=$a(e,e.__c.__P,e.__c.__O)}var t;for(r.setState({__a:r.__b=null});t=r.o.pop();)t.__P=s,t.forceUpdate()}};r.__u++||32&t.__u||r.setState({__a:r.__b=r.__v.__k[0]}),e.then(o,o)},eo.prototype.componentWillUnmount=function(){this.o=[]},eo.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var n=document.createElement(`div`),r=this.__v.__k[0].__c;this.__v.__k[0]=Qa(this.__b,n,r.__O=r.__P)}this.__b=null}var i=t.__a&&I(ci,null,e.fallback);return i&&(i.__u&=-33),[I(ci,null,t.__a?null:e.children),i]};var ro=function(e,t,n){if(++n[1]===n[0]&&e.l.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!==`t`||!e.l.size))for(n=e.i;n;){for(;n.length>3;)n.pop()();if(n[1]<n[0])break;e.i=n=n[2]}};function io(e){return this.getChildContext=function(){return e.context},e.children}function ao(e){var t=this,n=e.h;if(t.componentWillUnmount=function(){R(null,t.v),t.v=null,t.h=null},t.h&&t.h!==n&&t.componentWillUnmount(),!t.v){for(var r=t.__v;r!==null&&!r.__m&&r.__!==null;)r=r.__;t.h=n,t.v={nodeType:1,parentNode:n,childNodes:[],__k:{__m:r.__m},contains:function(){return!0},namespaceURI:n.namespaceURI,insertBefore:function(e,n){this.childNodes.push(e),t.h.insertBefore(e,n)},removeChild:function(e){this.childNodes.splice(this.childNodes.indexOf(e)>>>1,1),t.h.removeChild(e)}}}R(I(io,{context:t.context},e.__v),t.v)}function oo(e,t){var n=I(ao,{__v:e,h:t});return n.containerInfo=t,n}(no.prototype=new L).__a=function(e){var t=this,n=to(t.__v),r=t.l.get(e);return r[0]++,function(i){var a=function(){t.props.revealOrder?(r.push(i),ro(t,e,r)):i()};n?n(a):a()}},no.prototype.render=function(e){this.i=null,this.l=new Map;var t=_i(e.children);e.revealOrder&&e.revealOrder[0]===`b`&&t.reverse();for(var n=t.length;n--;)this.l.set(t[n],this.i=[1,0,this.i]);return e.children},no.prototype.componentDidUpdate=no.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(t,n){ro(e,n,t)})};var so=typeof Symbol<`u`&&Symbol.for&&Symbol.for(`react.element`)||60103,co=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,lo=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,uo=/[A-Z0-9]/g,fo=typeof document<`u`,po=function(e){return(typeof Symbol<`u`&&typeof Symbol()==`symbol`?/fil|che|rad/:/fil|che|ra/).test(e)};L.prototype.isReactComponent=!0,[`componentWillMount`,`componentWillReceiveProps`,`componentWillUpdate`].forEach(function(e){Object.defineProperty(L.prototype,e,{configurable:!0,get:function(){return this[`UNSAFE_`+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var mo=N.event;N.event=function(e){return mo&&(e=mo(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var ho={configurable:!0,get:function(){return this.class}},go=N.vnode;N.vnode=function(e){typeof e.type==`string`&&function(e){var t=e.props,n=e.type,r={},i=n.indexOf(`-`)==-1;for(var a in t){var o=t[a];if(!(a===`value`&&`defaultValue`in t&&o==null||fo&&a===`children`&&n===`noscript`||a===`class`||a===`className`)){var s=a.toLowerCase();a===`defaultValue`&&`value`in t&&t.value==null?a=`value`:a===`download`&&!0===o?o=``:s===`translate`&&o===`no`?o=!1:s[0]===`o`&&s[1]===`n`?s===`ondoubleclick`?a=`ondblclick`:s!==`onchange`||n!==`input`&&n!==`textarea`||po(t.type)?s===`onfocus`?a=`onfocusin`:s===`onblur`?a=`onfocusout`:lo.test(a)&&(a=s):s=a=`oninput`:i&&co.test(a)?a=a.replace(uo,`-$&`).toLowerCase():o===null&&(o=void 0),s===`oninput`&&r[a=s]&&(a=`oninputCapture`),r[a]=o}}n==`select`&&(r.multiple&&Array.isArray(r.value)&&(r.value=_i(t.children).forEach(function(e){e.props.selected=r.value.indexOf(e.props.value)!=-1})),r.defaultValue!=null&&(r.value=_i(t.children).forEach(function(e){e.props.selected=r.multiple?r.defaultValue.indexOf(e.props.value)!=-1:r.defaultValue==e.props.value}))),t.class&&!t.className?(r.class=t.class,Object.defineProperty(r,`className`,ho)):t.className&&(r.class=r.className=t.className),e.props=r}(e),e.$$typeof=so,go&&go(e)};var _o=N.__r;N.__r=function(e){_o&&_o(e),e.__c};var vo=N.diffed;N.diffed=function(e){vo&&vo(e);var t=e.props,n=e.__e;n!=null&&e.type===`textarea`&&`value`in t&&t.value!==n.value&&(n.value=t.value==null?``:t.value)};function yo({id:e,ariaLabel:t,value:n,options:r,onChange:i,fontSize:a,placeholder:o=`All`,trailingIcon:s,style:c}){let l=Ki(null),u=Ki(null),[d,f]=H(!1),[p,m]=H(``),[h,g]=H(q.menu),_=W(()=>n.filter(e=>typeof e==`string`&&e.length>0),[n]),v=W(()=>xo(r,_),[r,_]),y=W(()=>new Set(_),[_]),b=W(()=>{let e=p.trim().toLowerCase();return e?v.filter(t=>t.label.toLowerCase().includes(e)||t.value.toLowerCase().includes(e)):v},[v,p]),x=`${e??t.toLowerCase().replace(/[^a-z0-9]+/g,`-`)}-options`,ee=So(_,v,o);U(()=>{let e=l.current?.ownerDocument;if(!d||!e)return;let t=e=>{let t=l.current,n=u.current;!t||!e.target||t.contains(e.target)||n?.contains(e.target)||f(!1)};return e.addEventListener(`pointerdown`,t),()=>e.removeEventListener(`pointerdown`,t)},[d]),Gi(()=>{let e=l.current?.ownerDocument?.defaultView;if(!d||!l.current||!e)return;let t=()=>{let e=l.current;if(!e)return;let t=e.getBoundingClientRect();g({...q.menu,top:`${t.bottom+4}px`,left:`${t.left}px`,width:`${t.width}px`})};return t(),e.addEventListener(`resize`,t),e.addEventListener(`scroll`,t,!0),()=>{e.removeEventListener(`resize`,t),e.removeEventListener(`scroll`,t,!0)}},[d]);let te=e=>{i(y.has(e.value)?_.filter(t=>t!==e.value):[..._,e.value])};return z(`div`,{ref:l,style:{...q.shell,...c},onPointerDown:e=>K(e),onMouseDown:e=>K(e),onWheel:e=>K(e),onClick:e=>K(e),children:[z(`button`,{id:e,type:`button`,"aria-label":t,"aria-haspopup":`listbox`,"aria-expanded":d,"aria-controls":d?x:void 0,style:{...q.button,...a===void 0?{}:{fontSize:a},...d?q.buttonOpen:{},opacity:v.length?1:.58,cursor:v.length?`pointer`:`default`},disabled:!v.length,onClick:()=>f(e=>!e),onKeyDown:e=>{K(e),(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),f(e=>!e)),e.key===`Escape`&&(e.preventDefault(),f(!1))},onKeyUp:e=>K(e),children:[z(`span`,{style:q.summaryText,children:ee}),s??z(bo,{})]}),d&&l.current?.ownerDocument.body?oo(z(`div`,{ref:u,id:x,role:`listbox`,"aria-label":`${t} options`,"aria-multiselectable":`true`,style:h,onPointerDown:e=>K(e),onMouseDown:e=>K(e),onWheel:e=>K(e),onClick:e=>K(e),children:[z(`input`,{"aria-label":`${t} search`,type:`search`,value:p,placeholder:`Search...`,style:{...q.searchInput,...a===void 0?{}:{fontSize:a}},onInput:e=>m(e.currentTarget.value),onKeyDown:e=>K(e),onKeyUp:e=>K(e)}),b.map(e=>{let t=y.has(e.value);return z(`button`,{type:`button`,role:`option`,"aria-selected":t,style:{...q.option,...a===void 0?{}:{fontSize:a},...t?q.optionSelected:{}},onMouseDown:e=>{e.preventDefault(),K(e)},onClick:()=>te(e),children:[z(`span`,{children:e.label}),t?z(`span`,{"aria-hidden":!0,children:`✓`}):null]},e.value)}),b.length===0?z(`div`,{style:{...q.emptyState,...a===void 0?{}:{fontSize:a}},children:`No matching options`}):null,_.length>0?z(`button`,{type:`button`,style:{...q.clearButton,...a===void 0?{}:{fontSize:a}},onMouseDown:e=>{e.preventDefault(),K(e)},onClick:()=>i([]),children:`Clear selection`}):null]}),l.current.ownerDocument.body):null]})}function bo(){return z(`svg`,{viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.8`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,style:q.chevron,children:z(`path`,{d:`m6 9 6 6 6-6`})})}function xo(e,t){let n=new Set(e.map(e=>e.value));return[...e,...t.filter(e=>!n.has(e)).map(e=>({label:e,value:e}))]}function So(e,t,n){if(e.length===0)return n;let r=new Map(t.map(e=>[e.value,e.label])),i=e.map(e=>r.get(e)??e);return i.length<=2?i.join(`, `):`${i.length} selected`}function K(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation()}var q={shell:{position:`relative`,width:`100%`,minWidth:0},button:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:12,width:`100%`,minHeight:36,borderRadius:13,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.24))`,background:`var(--menu-background, rgba(51, 65, 85, 0.78))`,color:`var(--menu-text, #f8fafc)`,padding:`0 14px`,font:`inherit`,fontSize:12,fontWeight:650,textAlign:`left`,cursor:`pointer`},buttonOpen:{borderColor:`var(--button-icon-hover, rgba(96, 165, 250, 0.78))`,boxShadow:`0 0 0 2px rgba(96, 165, 250, 0.16)`},menu:{position:`fixed`,zIndex:1e4,display:`grid`,gap:2,maxHeight:260,overflow:`auto`,borderRadius:13,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.28))`,background:`var(--menu-background, #334155)`,boxShadow:`var(--menu-shadow, 0 16px 34px rgba(0, 0, 0, 0.32))`,padding:4},option:{minHeight:30,border:`none`,borderRadius:9,background:`transparent`,color:`var(--menu-text, #f8fafc)`,font:`inherit`,fontSize:12,fontWeight:430,textAlign:`left`,cursor:`pointer`,padding:`0 10px`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:8},optionActive:{background:`var(--menu-item-hover, rgba(148, 163, 184, 0.16))`},optionSelected:{background:`var(--button-background, rgba(96, 165, 250, 0.36))`,color:`var(--menu-text, #f8fafc)`,fontWeight:520},summaryText:{minWidth:0,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},searchInput:{minHeight:30,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.28))`,borderRadius:9,background:`var(--button-background, rgba(15, 23, 42, 0.22))`,color:`var(--menu-text, #f8fafc)`,font:`inherit`,fontSize:12,padding:`0 10px`,outline:`none`},emptyState:{color:`var(--button-text, #94a3b8)`,fontSize:12,padding:`8px 10px`},clearButton:{minHeight:30,border:`none`,borderRadius:9,background:`transparent`,color:`var(--button-text, #94a3b8)`,font:`inherit`,fontSize:12,fontWeight:520,textAlign:`left`,cursor:`pointer`,padding:`0 10px`},chevron:{width:18,height:18,flex:`0 0 auto`,color:`var(--button-text, #94a3b8)`,pointerEvents:`none`}},Co=new WeakMap,wo={position:`relative`,width:`100%`,minWidth:0},To={width:`100%`,minHeight:`32px`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:`8px`,border:`var(--button-inner-stroke, 1px solid rgba(148, 163, 184, 0.48))`,borderRadius:`var(--button-corner-radius, 8px)`,background:`var(--button-background, rgba(255, 255, 255, 0.94))`,color:`var(--button-text, currentColor)`,boxSizing:`border-box`,padding:`6px 8px 6px 10px`,fontSize:`12px`,fontWeight:600,cursor:`pointer`,boxShadow:`none`,outline:`none`},Eo={borderColor:`var(--button-icon-hover, rgba(59, 130, 246, 0.82))`,boxShadow:`0 0 0 2px rgba(59, 130, 246, 0.16)`},Do={overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,textAlign:`left`},Oo={width:`16px`,height:`16px`,display:`inline-flex`,alignItems:`center`,justifyContent:`center`,color:`var(--button-icon-idle, currentColor)`,fontSize:`10px`,lineHeight:1,transition:`transform 120ms ease`},ko={position:`fixed`,zIndex:1e4,width:`max-content`,maxWidth:`calc(100vw - 16px)`,maxHeight:`192px`,overflowX:`hidden`,overflowY:`auto`,padding:`4px`,border:`var(--button-inner-stroke, 1px solid rgba(148, 163, 184, 0.48))`,borderRadius:`var(--button-corner-radius, 8px)`,background:`var(--container-background, var(--button-background, rgba(255, 255, 255, 0.98)))`,color:`var(--button-text, currentColor)`,boxShadow:`0 12px 28px rgba(15, 23, 42, 0.18)`,boxSizing:`border-box`},Ao={width:`100%`,minHeight:`28px`,border:0,borderRadius:`calc(var(--button-corner-radius, 8px) - 1px)`,display:`grid`,gridTemplateColumns:`minmax(0, 1fr) auto`,alignItems:`center`,gap:`8px`,margin:0,padding:`5px 8px`,background:`transparent`,color:`var(--button-text, currentColor)`,cursor:`pointer`,fontSize:`12px`,textAlign:`left`},jo={minWidth:0,display:`grid`,gap:`1px`},Mo={whiteSpace:`nowrap`,textAlign:`left`},No={color:`var(--button-icon-idle, currentColor)`,fontSize:`11px`,fontWeight:400,lineHeight:1.25,opacity:.78,textAlign:`left`,whiteSpace:`normal`},Po={background:`var(--menu-item-hover, rgba(148, 163, 184, 0.16))`},Fo={color:`var(--button-icon-hover, currentColor)`,fontWeight:700};function J(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation()}function Io(e,t){return e.findIndex(e=>e.value===t)}function Lo(e,t,n){return n===0?-1:((e>=0?e:t>0?-1:0)+t+n)%n}function Ro(e,t){let n=e.ownerDocument,r=Co.get(n);r&&r.root!==e&&r.close(),Co.set(n,{close:t,root:e})}function zo(e){let t=e.ownerDocument;Co.get(t)?.root===e&&Co.delete(t)}function Bo({id:e,label:t,value:n,options:r,onValueChange:i,fontSize:a}){let[o,s]=H(!1),[c,l]=H(()=>Io(r,n)),[u,d]=H(ko),f=Ki(null),p=Ki(null),m=Ki([]),h=`${e}-listbox`,g=W(()=>Io(r,n),[r,n]),_=(g>=0?r[g]:void 0)?.label??String(n),v=()=>{let e=f.current;e&&zo(e),s(!1)},y=()=>{let e=f.current;e&&Ro(e,v),s(!0)},b=e=>{i(e.value),v()};U(()=>{m.current=m.current.slice(0,r.length)},[r.length]),U(()=>{o||l(g)},[o,g]),U(()=>{let e=f.current?.ownerDocument;if(!o||!e)return;let t=e=>{if(!f.current||!e.target)return;let t=e.target;!f.current.contains(t)&&!p.current?.contains(t)&&v()};return e.addEventListener(`pointerdown`,t,!0),()=>{e.removeEventListener(`pointerdown`,t,!0)}},[o]),U(()=>{let e=f.current;if(!(!o||!e))return Ro(e,v),()=>{zo(e)}},[o]),Gi(()=>{let e=f.current?.ownerDocument,t=e?.defaultView;if(!o||!f.current||!t)return;let n=()=>{if(!f.current)return;let n=f.current.getBoundingClientRect(),r=e.documentElement.clientWidth||t.innerWidth||n.right,i=r-n.right<n.left,a=i?Math.max(r-n.right,8):Math.max(n.left,8),o=i?Math.max(n.right-8,0):Math.max(r-a-8,0);d({...ko,top:`${n.bottom+4}px`,left:i?void 0:`${a}px`,right:i?`${a}px`:void 0,minWidth:`${Math.min(n.width,o)}px`,maxWidth:`${o}px`})};return n(),t.addEventListener(`resize`,n),t.addEventListener(`scroll`,n,!0),()=>{t.removeEventListener(`resize`,n),t.removeEventListener(`scroll`,n,!0)}},[o]),U(()=>{!o||c<0||m.current[c]?.scrollIntoView?.({block:`nearest`})},[c,o]);let x=()=>{if(o){v();return}y()},ee=e=>{if(J(e),e.key===`ArrowDown`||e.key===`ArrowUp`){e.preventDefault(),y(),l(t=>Lo(t,e.key===`ArrowDown`?1:-1,r.length));return}if(e.key===`Enter`||e.key===` `){if(e.preventDefault(),o&&c>=0){let e=r[c];e&&b(e);return}y(),l(g);return}e.key===`Escape`&&(e.preventDefault(),v())};return z(`div`,{ref:f,style:wo,onPointerDown:e=>J(e),onMouseDown:e=>J(e),onWheel:e=>J(e),onClick:e=>J(e),children:[z(`button`,{id:e,type:`button`,"aria-label":t,"aria-haspopup":`listbox`,"aria-expanded":o,"aria-controls":o?h:void 0,style:{...To,...a===void 0?{}:{fontSize:a},...o?Eo:{},opacity:r.length?1:.58,cursor:r.length?`pointer`:`default`},disabled:!r.length,onClick:x,onKeyDown:ee,onKeyUp:e=>J(e),children:[z(`span`,{style:Do,children:_}),z(`span`,{"aria-hidden":!0,style:{...Oo,transform:o?`rotate(180deg)`:`rotate(0deg)`},children:`▾`})]}),o&&f.current?.ownerDocument.body&&oo(z(`div`,{ref:p,id:h,role:`listbox`,"aria-label":t,style:u,onPointerDown:e=>J(e),onMouseDown:e=>J(e),onWheel:e=>J(e),onClick:e=>J(e),children:r.map((t,n)=>{let r=n===g,i=n===c,o=t.description?.trim();return z(`button`,{ref:e=>{m.current[n]=e},type:`button`,role:`option`,"aria-selected":r,style:{...Ao,...a===void 0?{}:{fontSize:a},...i?Po:{},...r?Fo:{}},onPointerEnter:()=>l(n),onMouseDown:e=>{e.preventDefault(),J(e)},onClick:()=>b(t),children:[z(`span`,{style:jo,children:[z(`span`,{"data-select-option-label":`true`,style:Mo,children:t.label}),o&&z(`span`,{"data-select-option-description":`true`,style:No,children:o})]}),r&&z(`span`,{"aria-hidden":!0,children:`✓`})]},`${e}-${n}-${String(t.value)}`)})}),f.current.ownerDocument.body)]})}var Vo={width:`100%`,border:0,margin:0,padding:`8px 12px`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`8px`,background:`transparent`,color:`inherit`,cursor:`pointer`,fontSize:`12px`},Ho={display:`grid`,gap:`8px`,padding:`8px 12px 12px 18px`},Uo={display:`grid`,gap:`8px`,padding:`10px 12px 12px`},Wo={display:`grid`,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 1.4fr)`,alignItems:`center`,gap:`8px`},Go={fontSize:`12px`,fontWeight:600,color:`var(--button-text, currentColor)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},Ko={width:`100%`,minWidth:0,display:`flex`,alignItems:`center`},qo={width:`100%`,border:`var(--button-inner-stroke, 1px solid rgba(128, 128, 128, 0.35))`,borderRadius:`calc(var(--button-corner-radius, 8px) - 2px)`,backgroundColor:`var(--button-background, #fff)`,backdropFilter:`var(--button-backdrop-filter, unset)`,color:`var(--button-text, currentColor)`,fontSize:`12px`,padding:`4px 6px`,boxSizing:`border-box`},Jo={...qo,flex:1},Yo={border:`var(--button-inner-stroke, 1px solid rgba(128, 128, 128, 0.35))`,borderRadius:`calc(var(--button-corner-radius, 8px) - 2px)`,backgroundColor:`var(--button-background, #fff)`,color:`var(--button-text, currentColor)`,fontSize:`11px`,padding:`4px 8px`,cursor:`pointer`,whiteSpace:`nowrap`},Xo={width:`100%`,minWidth:`120px`,margin:0},Zo={...qo,width:`84px`,flexShrink:0,height:`28px`,lineHeight:`16px`,padding:`2px 6px`},Qo={width:`14px`,height:`14px`,margin:0,accentColor:`var(--button-icon-hover, currentColor)`};function $o(e,t){return t===void 0?e:{...e,fontSize:t}}function Y(e){e.stopPropagation()}function es(e){e.stopPropagation(),typeof e.stopImmediatePropagation==`function`&&e.stopImmediatePropagation?.()}function ts({fontSize:e,inputId:t,label:n,value:r,onApply:i}){let[a,o]=H(r),[s,c]=H(()=>r?[r]:[]),l=a!==r;U(()=>{o(r)},[r]),U(()=>{r&&c(e=>e.includes(r)?e:[r,...e].slice(0,8))},[r]);let u=e=>{o(e.currentTarget.value)},d=()=>{a!==r&&(i(a),c(e=>[a,...e.filter(e=>e!==a)].slice(0,8)))};return z(`div`,{style:Ko,children:[z(`input`,{id:t,type:`text`,value:a,onInput:u,list:`${t}-recent-values`,onKeyDown:e=>{e.key===`Enter`&&(e.preventDefault(),d()),es(e)},onKeyUp:es,onPointerDown:es,"aria-label":n,style:$o(Jo,e)}),s.length>0&&z(`datalist`,{id:`${t}-recent-values`,children:s.map(e=>z(`option`,{value:e},`${t}-${e}`))}),z(`button`,{type:`button`,disabled:!l,style:{...$o(Yo,e),opacity:l?1:.55,cursor:l?`pointer`:`default`,marginLeft:`6px`},onClick:d,onPointerDown:es,onKeyDown:es,onKeyUp:es,children:l?`✓`:`✅`})]})}function ns({fontSize:e,inputId:t,label:n,setting:r,value:i,onValueChange:a}){let o=Number.isFinite(r.min)&&Number.isFinite(r.max),s=Pa(i,r.min,r.max),c=rs(r),l=Ki(null),[u,d]=H(s);U(()=>{d(s)},[s]),U(()=>()=>{is(l)},[]);let f=e=>{if(!Number.isFinite(e))return;let t=Pa(e,r.min,r.max);is(l),d(t),a(t)},p=e=>{if(!Number.isFinite(e))return;let t=Pa(e,r.min,r.max);if(d(t),c<=0){a(t);return}is(l),l.current=setTimeout(()=>{l.current=null,a(t)},c)};return o?z(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`,minWidth:0,width:`100%`},children:[z(`input`,{id:t,type:`range`,min:String(r.min),max:String(r.max),step:String(r.step??1),value:String(u),onInput:e=>p(Number(e.currentTarget.value)),"aria-label":n,style:Xo}),z(`input`,{type:`number`,min:Number.isFinite(r.min)?String(r.min):void 0,max:Number.isFinite(r.max)?String(r.max):void 0,step:String(r.step??1),value:String(u),onInput:e=>f(Number(e.currentTarget.value)),onChange:e=>f(Number(e.currentTarget.value)),"aria-label":`${n} numeric value`,style:$o(Zo,e)})]}):z(`input`,{id:t,type:`number`,step:String(r.step??1),value:String(u),onInput:e=>f(Number(e.currentTarget.value)),onChange:e=>f(Number(e.currentTarget.value)),"aria-label":n,style:$o(qo,e)})}function rs(e){return Number.isFinite(e.sliderDebounceMs)?Math.max(0,e.sliderDebounceMs):0}function is(e){e.current!=null&&(clearTimeout(e.current),e.current=null)}function as({fontSize:e,setting:t,value:n,onValueChange:r}){let i=t.label??t.name,a=t.description?.trim(),o=`settings-panel-input-${t.name.replace(/[^a-zA-Z0-9_-]/g,`-`)}`,s=e=>{r(e.currentTarget.checked)},c;c=t.type===`boolean`?z(`input`,{id:o,type:`checkbox`,checked:!!n,onInput:s,onChange:s,"aria-label":i,style:Qo}):t.type===`number`?z(ns,{fontSize:e,inputId:o,label:i,setting:t,value:Number(n),onValueChange:r}):t.type===`select`?z(Bo,{id:o,value:n,label:i,options:(t.options??[]).map(za),onValueChange:r,fontSize:e}):t.type===`multi-select`?z(yo,{id:o,ariaLabel:i,value:Array.isArray(n)?n.filter(e=>typeof e==`string`&&e.length>0):[],options:(t.options??[]).map(e=>{let t=za(e);return{label:t.label,value:String(t.value)}}),onChange:r,fontSize:e}):z(ts,{fontSize:e,inputId:o,label:i,value:String(n),onApply:r});let l=t.type===`select`||t.type===`multi-select`;return z(`div`,{"data-setting-row-for":t.name,style:Wo,title:a,children:[z(`label`,{htmlFor:l?void 0:o,style:$o(Go,e),children:i}),z(`div`,{style:Ko,children:c})]})}function os({contentStyle:e,fontSize:t,onValueChange:n,section:r,settings:i}){return z(`div`,{style:e,children:r.settings.map(e=>z(as,{fontSize:t,setting:e,value:Ha(e,i),onValueChange:t=>n(e.name,t)},e.name))})}function ss({fontSize:e,onSettingsChange:t,section:n,settings:r}){let[i,a]=H(r);return U(()=>{a(r)},[r]),z(`div`,{style:{minWidth:0,paddingBottom:`8px`},onPointerMove:e=>Y(e),onMouseMove:e=>Y(e),onPointerDown:e=>Y(e),onMouseDown:e=>Y(e),onWheel:e=>Y(e),onClick:e=>Y(e),onKeyDown:e=>Y(e),onKeyUp:e=>Y(e),children:z(os,{contentStyle:Uo,fontSize:e,onValueChange:(e,n)=>{a(r=>{let i=Fa(r,e,n);return t?.(i),i})},section:n,settings:i})})}var cs={sections:[]},ls={};function us({fontSize:e,schema:t,settings:n,onSettingsChange:r}){let[i,a]=H(n),[o,s]=H(()=>Ra(t.sections));U(()=>{a(n)},[n]),U(()=>{s(e=>Ua(e,t.sections))},[t.sections]);let c=W(()=>t.sections.map((e,t)=>({key:Ia(e,t),section:e})),[t.sections]),l=c.length===1&&!c[0].section.name&&!c[0].section.description,u=(e,t)=>{a(n=>{let i=Fa(n,e,t);return r?.(i),i})};return z(`div`,{style:{minWidth:0,paddingBottom:`8px`},onPointerMove:e=>Y(e),onMouseMove:e=>Y(e),onPointerDown:e=>Y(e),onMouseDown:e=>Y(e),onWheel:e=>Y(e),onClick:e=>Y(e),onKeyDown:e=>Y(e),onKeyUp:e=>Y(e),children:l?z(os,{contentStyle:Ho,fontSize:e,onValueChange:u,section:c[0].section,settings:i}):c.map(({key:t,section:n})=>{let r=o[t]??!1;return z(`div`,{style:{borderBottom:`1px solid var(--menu-item-hover, rgba(128, 128, 128, 0.22))`},children:[z(`button`,{type:`button`,style:Vo,onClick:()=>s(e=>({...e,[t]:!r})),"aria-expanded":!r,children:[z(`span`,{style:{display:`grid`,gap:`2px`,textAlign:`left`},children:[z(`span`,{style:{fontWeight:700,fontSize:`12px`},children:n.name}),n.description&&z(`span`,{style:{fontSize:`11px`,color:`var(--button-icon-idle, currentColor)`},children:n.description})]}),z(`span`,{"aria-hidden":!0,children:r?`▸`:`▾`})]}),!r&&z(os,{contentStyle:Ho,fontSize:e,onValueChange:u,section:n,settings:i})]},t)})})}var ds=class extends Ca{static createSectionPanels({label:e=`Settings`,schema:t=cs,settings:n=ls,onSettingsChange:r,fontSize:i,theme:a=`inherit`}){return t.sections.map((t,o)=>new fs({id:Ia(t,o),title:t.name||e,theme:a,content:z(ss,{fontSize:i,onSettingsChange:r,section:t,settings:n})}))}constructor({id:e=`settings-panel`,label:t=`Settings`,schema:n=cs,settings:r=ls,onSettingsChange:i,fontSize:a,theme:o=`inherit`}={}){super({id:e,title:n.title??t,theme:o,content:z(us,{fontSize:a,schema:n,settings:r,onSettingsChange:i})})}},fs=class extends Ca{},ps=class{#e={};#t;#n=new Set;#r=new Map;setLocalStoragePersistence(e){this.#t=e}getSettingsWithLocalStorage(e,t=this.#r){let n=this.getLocalStorageSettings(t),r=e;for(let[e,t]of Object.entries(n))r=Fa(r,e,t);return r}getLocalStorageSettings(e=this.#r){let t=this.#s(),n={};for(let[r,i]of e){let e=t[r];ys(i)&&hs(e)&&(n[r]=Ha(i,Fa({},r,e)))}return n}setCurrentSettings(e){this.#e=this.#a(e)}setOnSettingsChange(e){return e?(this.#n.add(e),()=>{this.#n.delete(e)}):()=>{}}setSettingDefinitions(e){this.#r=new Map(e)}emitSettingsChange(e,t){let n=this.#a(e),r=t??this.#i(n);if(r.length===0){this.#e=n;return}this.#e=n,this.#c(r,n),this.#n.forEach(e=>e(n,r))}setSettingValue(e,t){let n=this.#r.get(e),r=Fa(this.#e,e,hs(t)?t:``),i=n?Ha(n,r):t,a=Na(this.#e,e);if(gs(a,i))return;let o=Fa(this.#e,e,i),s=[{type:`setting`,name:e,previousValue:a,nextValue:i,descriptor:n}];this.emitSettingsChange(o,s)}setSettings(e){this.emitSettingsChange(e)}#i(e){let t=[];for(let[n,r]of this.#r){let i=Na(this.#e,n),a=Na(e,n);gs(i,a)||t.push({type:`setting`,name:n,previousValue:i,nextValue:a,descriptor:r})}return t}#a(e){let t=e;for(let[n,r]of this.#r)Na(e,n)!==void 0&&(t=Fa(t,n,Ha(r,t)));return t}#o(){return this.#t?.getStorage?this.#t.getStorage()??null:typeof window>`u`?null:window.localStorage}#s(){let e=this.#t?.storageKey,t=this.#o();if(!e||!t)return{};try{let n=t.getItem(e);if(!n)return{};let r=JSON.parse(n);return ms(r)?r:{}}catch{return{}}}#c(e,t){let n=this.#t?.storageKey,r=this.#o();if(!n||!r)return;let i=this.#s(),a=!1;for(let n of e){if(!ys(n.descriptor))continue;let e=Na(t,n.name);hs(e)&&(a=!0,i[n.name]=e)}if(a)try{if(Object.keys(i).length===0){r.removeItem(n);return}r.setItem(n,JSON.stringify(i))}catch{}}};function ms(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function hs(e){return typeof e==`boolean`||typeof e==`number`||typeof e==`string`||vs(e)}function gs(e,t){return Array.isArray(e)||Array.isArray(t)?_s(e,t):Object.is(e,t)}function _s(e,t){return!vs(e)||!vs(t)||e.length!==t.length?!1:e.every((e,n)=>e===t[n])}function vs(e){return Array.isArray(e)&&e.every(e=>typeof e==`string`)}function ys(e){return Ba(e)===`local-storage`}new ps;var bs=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],xs={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function Ss(e,t){let n=xs[t];for(let[t,r]of bs)e.style.setProperty(r,n[t])}function Cs(e){for(let[,t]of bs)e.style.removeProperty(t)}var ws=`data-example-panel-host`,Ts=`data-example-settings-panel`,Es=`data-example-settings-sections`,Ds=`example-source`,Os=`/examples/`,ks=new Set([`modelKind`,`renderMode`]),As=`data-example-panel-appearance`,js=`
[data-example-panel-host] [aria-hidden='true'] {
  display: none !important;
}
[data-example-panel-host][${As}='cinematic'] [data-panel-theme-mode] {
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
[${Ts}] [data-setting-row-for] > label,
[${Ts}] [data-setting-row-for] button,
[${Ts}] [data-setting-row-for] input[type='number'],
[${Ts}] [data-setting-row-for] input[type='text'],
[id^='settings-panel-input-'][role='listbox'] > button[role='option'] {
  font-size: 11px !important;
}
[${Ts}][${Es}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) {
  margin-top: 4px !important;
  padding: 8px !important;
  border-radius: 7px !important;
  background: rgba(70, 104, 159, 0.08) !important;
}
[${Ts}][${Es}='accordion']
button[aria-expanded]:not([aria-haspopup='listbox']) > span:first-child > span:first-child {
  font-size: 11px !important;
  letter-spacing: 0.01em;
}
`;function Ms(e,t){R(t?I(aa,{panel:t},I(`style`,{},js),t.content):null,e)}function Ns({id:e,title:t,html:n,onRender:r}){return new Ma({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function Ps({id:e,title:t,content:n}){return new Ma({id:e,title:t,onRenderHTML:e=>(R(I(ci,{},n),e),()=>R(null,e))})}function Fs(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===Ds),i=Rs()&&!r?[...e.panels,Is(t)]:e.panels;return new wa({...n,panels:i})}function Is(e){return Ps({id:Ds,title:`Source`,content:I(Ls,{sourcePaths:e})})}function Ls({sourcePaths:e}){let[t,n]=H({});return U(()=>{let t=e??zs();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return Bs(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?I(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):I(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},I(`code`,{},t.source??`// Loading source…`))}function Rs(){return typeof window<`u`&&!!window.website}function zs(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(Os);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function Bs(e,t){let n=window.location.pathname.indexOf(Os),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}var Vs=class{id;label;sectionPresentation;settingsManager=new ps;unsubscribe;schema;settings;constructor({id:e,label:t=`Settings`,schema:n,settings:r,sectionPresentation:i=`inline`,onSettingsChange:a,localStorageConfig:o}){this.id=e,this.label=t,this.sectionPresentation=i,this.schema=n,this.settings=r,this.settingsManager.setLocalStoragePersistence(o),this.setSchemaAndSettings(n,r),this.unsubscribe=this.settingsManager.setOnSettingsChange((e,t)=>{this.settings=e,a?.(e,t)})}getSettingsWithLocalStorage(e){return this.settingsManager.getSettingsWithLocalStorage(e)}setSchemaAndSettings(e,t){this.schema=e,this.settings=t,this.settingsManager.setSettingDefinitions(Hs(e)),this.settingsManager.setCurrentSettings(t)}setSettings(e){this.settings=e,this.settingsManager.setCurrentSettings(e)}setSettingsFromPanel(e){this.settingsManager.setSettings(e)}setSettingValue(e,t){this.settingsManager.setSettingValue(e,t)}makePanel(){if(this.sectionPresentation===`accordion`)return Ws(new ds({id:this.id,label:this.label,schema:this.schema,settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)}),this.sectionPresentation);let[e]=ds.createSectionPanels({label:this.label,schema:Us(this.schema),settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)});return e?(e.setProps({id:this.id,title:this.schema.title??this.label}),Ws(e)):Ws(new ds({id:this.id,label:this.label,schema:Us(this.schema),settings:this.settings,onSettingsChange:e=>this.setSettingsFromPanel(e)}))}finalize(){this.unsubscribe()}};function Hs(e){let t=new Map;for(let n of e.sections)for(let e of n.settings)t.set(e.name,e);return t}function Us(e){let t=e.sections.flatMap(e=>e.settings);return{title:e.title,sections:[{id:`settings`,name:``,initiallyCollapsed:!1,settings:[...t.filter(e=>ks.has(e.name)),...t.filter(e=>!ks.has(e.name))]}]}}function Ws(e,t=`inline`){return e.setProps({content:I(`div`,{[Ts]:``,[Es]:t},e.content)}),e}function Gs(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute(ws,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(As,r),r===`cinematic`||r===`light`?Ss(e,r):Cs(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?xs[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}function Ks(e){let t=document.querySelector(`#hud`),n=document.querySelector(`#galaxy-info`);Ss(n,`cinematic`);let r={speed:1,aperture:.2,paused:!1},i=null,a=new Vs({id:`galaxy-settings`,label:`Controls`,schema:{title:`Controls`,sections:[{id:`animation`,name:``,settings:[{name:`speed`,label:`Speed`,type:`number`,min:0,max:3,step:.05,persist:`none`},{name:`aperture`,label:`Aperture`,type:`number`,min:0,max:1.5,step:.05,persist:`none`},{name:`paused`,label:`Pause`,type:`boolean`,persist:`none`}]}]},settings:r,onSettingsChange:e=>{typeof e.speed==`number`&&(r.speed=e.speed),typeof e.aperture==`number`&&(r.aperture=e.aperture),typeof e.paused==`boolean`&&(r.paused=e.paused),i&&Ms(i,a.makePanel())}}),o=new ha({id:`galaxy-info-box`,title:`Galactic Vortex`,placement:`top-left`,widthPx:340,collapsible:!0,defaultOpen:!0,panel:Fs({id:`galaxy-info-tabs`,theme:`dark`,panels:[Ns({id:`galaxy-controls`,title:`Controls`,html:``,onRender:e=>(Gs(e,`cinematic`),t.hidden=!1,e.append(t),i=document.createElement(`div`),Gs(i,`cinematic`),e.append(i),Ms(i,a.makePanel()),()=>{i&&=(Ms(i,null),i.remove(),null),t.hidden=!0,document.body.append(t)})}),Ns({id:`galaxy-info`,title:`Info`,html:`<h3>GPU architecture</h3><p>A luma GPU graph calculates star positions and colors in buffers shared with Three.js, without per-frame geometry readback or upload. Graph and Trace show the animation pass; Three rendering and postprocessing are submitted separately.</p>`,onRender:e=>Gs(e,`cinematic`)}),e.inspectorPanel.panel,e.tracePanel.panel,Ns({id:`example-source`,title:`Source`,html:``,onRender:e=>{Gs(e,`cinematic`);let t=document.createElement(`pre`);return t.style.cssText=`margin:0;max-height:60vh;overflow:auto;font:11px/1.5 monospace;white-space:pre-wrap;overflow-wrap:anywhere`,t.textContent=Tr,e.append(t),()=>t.remove()}})]})}),s=new Br({parentElement:n});return s.setProps({components:[o]}),s.onRedraw({viewports:[],layers:[]}),{settings:r,update(){s.onRedraw({viewports:[],layers:[]})},destroy(){s.finalize(),a.finalize(),e.clear(),n.remove()}}}var qs=1,Js=class{element;document;trigger;valueElement;listbox;ariaLabel;onChange;options;selectedValue=null;activeIndex=-1;disabled;openState=!1;destroyed=!1;typeaheadText=``;typeaheadTimer=null;constructor(e,t){this.document=e.ownerDocument,this.options=[...t.options],this.ariaLabel=t.ariaLabel??`Select option`,this.onChange=t.onChange,this.disabled=t.disabled??!1;let n=qs++,r=`compact-dropdown-trigger-${n}`,i=`compact-dropdown-listbox-${n}`;this.element=this.document.createElement(`div`),this.element.dataset.compactDropdown=``,this.element.innerHTML=`<style>${Ys}</style>`,this.trigger=this.document.createElement(`button`),this.trigger.id=r,this.trigger.type=`button`,this.trigger.setAttribute(`role`,`combobox`),this.trigger.setAttribute(`aria-label`,this.ariaLabel),this.trigger.setAttribute(`aria-haspopup`,`listbox`),this.trigger.setAttribute(`aria-controls`,i),this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.dataset.compactDropdownTrigger=``,this.valueElement=this.document.createElement(`span`),this.valueElement.dataset.compactDropdownValue=``;let a=this.document.createElement(`span`);a.dataset.compactDropdownChevron=``,a.setAttribute(`aria-hidden`,`true`),this.trigger.append(this.valueElement,a),this.element.append(this.trigger),this.listbox=this.document.createElement(`div`),this.listbox.id=i,this.listbox.hidden=!0,this.listbox.setAttribute(`role`,`listbox`),this.listbox.setAttribute(`aria-label`,this.ariaLabel),this.listbox.dataset.compactDropdownPopup=``,e.append(this.element),this.document.body.append(this.listbox),this.trigger.addEventListener(`click`,this.handleTriggerClick),this.trigger.addEventListener(`keydown`,this.handleKeyDown),this.listbox.addEventListener(`click`,this.handleOptionClick),this.listbox.addEventListener(`pointermove`,this.handleOptionPointerMove),this.document.addEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.addEventListener(`focusin`,this.handleDocumentFocusIn),this.renderOptions();let o=t.value??this.getFirstEnabledOption()?.value;o!==void 0&&this.setValue(o),this.updateDisabledState()}get value(){return this.selectedValue}set value(e){e===null?(this.selectedValue=null,this.activeIndex=-1,this.updateSelection()):this.setValue(e)}setValue(e,t={}){let n=this.options.find(t=>t.value===e);if(!n)return!1;let r=this.selectedValue!==e;return this.selectedValue=e,this.activeIndex=this.options.indexOf(n),this.updateSelection(),r&&t.emitChange&&this.onChange?.(e,n),!0}setOptions(e){this.options=[...e],this.selectedValue=this.options.find(e=>e.value===this.selectedValue)?.value??this.getFirstEnabledOption()?.value??null,this.activeIndex=this.getSelectedIndex(),this.renderOptions(),this.updateSelection(),this.updateDisabledState(),this.openState&&this.updatePopupPosition()}setDisabled(e){this.disabled=e,this.updateDisabledState(),this.trigger.disabled&&this.close()}focus(){this.trigger.focus()}open(){this.openState||this.trigger.disabled||this.destroyed||(this.openState=!0,this.activeIndex=this.getSelectedIndex(),this.activeIndex<0&&(this.activeIndex=this.getNextEnabledIndex(-1,1)),this.listbox.hidden=!1,this.trigger.setAttribute(`aria-expanded`,`true`),this.element.dataset.open=`true`,this.updateActiveOption(!0),this.updatePopupPosition(),this.document.defaultView?.addEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.addEventListener(`scroll`,this.handleViewportChange,!0))}close(e={}){this.openState&&(this.openState=!1,this.listbox.hidden=!0,this.trigger.setAttribute(`aria-expanded`,`false`),this.trigger.removeAttribute(`aria-activedescendant`),delete this.element.dataset.open,this.document.defaultView?.removeEventListener(`resize`,this.handleViewportChange),this.document.defaultView?.removeEventListener(`scroll`,this.handleViewportChange,!0),e.restoreFocus&&this.trigger.focus())}destroy(){this.destroyed||(this.close(),this.destroyed=!0,this.trigger.removeEventListener(`click`,this.handleTriggerClick),this.trigger.removeEventListener(`keydown`,this.handleKeyDown),this.listbox.removeEventListener(`click`,this.handleOptionClick),this.listbox.removeEventListener(`pointermove`,this.handleOptionPointerMove),this.document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.document.removeEventListener(`focusin`,this.handleDocumentFocusIn),this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.listbox.remove(),this.element.remove())}handleTriggerClick=()=>{this.openState?this.close():this.open()};handleKeyDown=e=>{switch(e.key){case`ArrowDown`:e.preventDefault(),this.openState?this.moveActiveOption(1):this.open();break;case`ArrowUp`:e.preventDefault(),this.openState?this.moveActiveOption(-1):this.open();break;case`Home`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(-1,1));break;case`End`:e.preventDefault(),this.openState||this.open(),this.setActiveIndex(this.getNextEnabledIndex(this.options.length,-1));break;case`Enter`:case` `:e.preventDefault(),this.openState?this.selectActiveOption():this.open();break;case`Escape`:this.openState&&(e.preventDefault(),this.close({restoreFocus:!0}));break;case`Tab`:this.close();break;default:e.key.length===1&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.preventDefault(),this.openState||this.open(),this.moveActiveOptionByText(e.key));break}};handleOptionClick=e=>{let t=this.getOptionIndex(e.target);t<0||this.options[t]?.disabled||(this.activeIndex=t,this.selectActiveOption())};handleOptionPointerMove=e=>{let t=this.getOptionIndex(e.target);t>=0&&!this.options[t]?.disabled&&t!==this.activeIndex&&this.setActiveIndex(t)};handleDocumentPointerDown=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleDocumentFocusIn=e=>{let t=e.target;this.openState&&t&&!this.element.contains(t)&&!this.listbox.contains(t)&&this.close()};handleViewportChange=()=>{this.openState&&this.updatePopupPosition()};renderOptions(){this.listbox.replaceChildren(...this.options.map((e,t)=>{let n=this.document.createElement(`div`);n.id=`${this.listbox.id}-option-${t}`,n.setAttribute(`role`,`option`),n.setAttribute(`aria-selected`,String(e.value===this.selectedValue)),e.disabled&&n.setAttribute(`aria-disabled`,`true`),n.dataset.compactDropdownOption=``,n.dataset.optionIndex=String(t);let r=this.document.createElement(`span`);r.textContent=e.label;let i=this.document.createElement(`span`);return i.dataset.compactDropdownStatus=``,i.setAttribute(`aria-hidden`,`true`),n.append(r,i),n}))}updateSelection(){let e=this.options.find(e=>e.value===this.selectedValue);this.valueElement.textContent=e?.label??`—`,this.trigger.title=e?.label??this.ariaLabel;for(let[e,t]of this.getOptionElements().entries())t.setAttribute(`aria-selected`,String(this.options[e]?.value===this.selectedValue));this.updateActiveOption(!1)}updateDisabledState(){this.trigger.disabled=this.disabled||!this.options.some(e=>!e.disabled)}moveActiveOption(e){this.setActiveIndex(this.getNextEnabledIndex(this.activeIndex,e))}moveActiveOptionByText(e){this.typeaheadTimer!==null&&clearTimeout(this.typeaheadTimer),this.typeaheadText+=e.toLocaleLowerCase();let t=this.getMatchingOptionIndex(this.typeaheadText);t<0&&this.typeaheadText.length>1&&(this.typeaheadText=e.toLocaleLowerCase(),t=this.getMatchingOptionIndex(this.typeaheadText)),t>=0&&this.setActiveIndex(t),this.typeaheadTimer=setTimeout(()=>{this.typeaheadText=``,this.typeaheadTimer=null},650)}getMatchingOptionIndex(e){for(let t=1;t<=this.options.length;t++){let n=(this.activeIndex+t+this.options.length)%this.options.length,r=this.options[n];if(!r?.disabled&&r.label.toLocaleLowerCase().startsWith(e))return n}return-1}getNextEnabledIndex(e,t){if(!this.options.length)return-1;let n=e;for(let e=0;e<this.options.length;e++)if(n=(n+t+this.options.length)%this.options.length,!this.options[n]?.disabled)return n;return-1}setActiveIndex(e){e<0||this.options[e]?.disabled||(this.activeIndex=e,this.updateActiveOption(!0))}updateActiveOption(e){let t=this.getOptionElements();for(let[e,n]of t.entries())e===this.activeIndex&&this.openState?n.dataset.active=`true`:delete n.dataset.active;let n=t[this.activeIndex];this.openState&&n&&(this.trigger.setAttribute(`aria-activedescendant`,n.id),e&&n.scrollIntoView({block:`nearest`}))}selectActiveOption(){let e=this.options[this.activeIndex];!e||e.disabled||(this.setValue(e.value,{emitChange:!0}),this.close({restoreFocus:!0}))}getFirstEnabledOption(){return this.options.find(e=>!e.disabled)}getSelectedIndex(){return this.options.findIndex(e=>e.value===this.selectedValue)}getOptionIndex(e){let t=e?.closest(`[data-compact-dropdown-option]`);return!t||!this.listbox.contains(t)?-1:Number(t.dataset.optionIndex??-1)}getOptionElements(){return Array.from(this.listbox.querySelectorAll(`[role="option"]`))}updatePopupPosition(){let e=this.document.defaultView;if(!e)return;let t=this.trigger.getBoundingClientRect(),n=Math.min(Math.max(t.width,128),e.innerWidth-8),r=Math.max(4,Math.min(t.left,e.innerWidth-n-4)),i=e.innerHeight-t.bottom-3-4,a=t.top-3-4,o=Math.min(176,this.options.length*20+2),s=i<Math.min(o,80)&&a>i,c=s?a:i;Object.assign(this.listbox.style,{left:`${r}px`,top:s?`auto`:`${t.bottom+3}px`,bottom:s?`${e.innerHeight-t.top+3}px`:`auto`,width:`${n}px`,maxHeight:`${Math.max(40,Math.min(176,c))}px`})}},Ys=`
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
`,Xs=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:1}),Zs=new Intl.NumberFormat(`en-US`,{notation:`compact`,maximumFractionDigits:1}),Qs=class{element;graphLabels;nodeLabels;counterLabels;snapshot={graphs:[]};selectedGraphId=null;selectionIsManual=!1;graphOptionsSignature=``;graphDropdown;constructor(e,t={}){this.element=e,this.graphLabels=t.graphLabels??{},this.nodeLabels=t.nodeLabels??{},this.counterLabels=t.counterLabels??{},this.element.innerHTML=`<div data-gpu-command-graph-inspector>
      <style>${ec}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div class="graph-inspector-summary">
          ${tc(`encodings`,``,`encoding-count`)}
          ${tc(`CPU p50 / p95 (ms)`,``,`cpu-totals`)}
          ${tc(`GPU p50 / p95 (ms)`,``,`gpu-totals`)}
          ${tc(`GPU samples`,``,`gpu-samples`)}
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
    </div>`,this.graphDropdown=new Js(this.element.querySelector(`[data-graph-inspector-picker-host]`),{ariaLabel:`Graph`,options:[],onChange:e=>{this.selectedGraphId=e,this.selectionIsManual=!0,this.render()}})}update(e,t){if(this.snapshot=e,e.graphs.some(e=>e.id===this.selectedGraphId)||(this.selectedGraphId=null,this.selectionIsManual=!1),!this.selectionIsManual&&t){let n=e.graphs.find(e=>e.id===t);n&&(this.selectedGraphId=n.id)}this.selectedGraphId??=e.graphs[0]?.id??null,this.render()}destroy(){this.graphDropdown.destroy(),this.element.replaceChildren()}render(){let e=this.snapshot.graphs.find(e=>e.id===this.selectedGraphId),t=this.element.querySelector(`[data-graph-inspector-empty]`),n=this.element.querySelector(`[data-graph-inspector-content]`);if(!e){t.hidden=!1,n.hidden=!0;return}t.hidden=!0,n.hidden=!1;let r=this.snapshot.graphs.map(e=>`${e.id}\u0000${this.getGraphLabel(e.id)}`).join(``);r!==this.graphOptionsSignature&&(this.graphDropdown.setOptions(this.snapshot.graphs.map(e=>({value:e.id,label:this.getGraphLabel(e.id)}))),this.graphOptionsSignature=r),this.graphDropdown.value!==e.id&&(this.graphDropdown.value=e.id);let i=e.stats.logicalTransientBytes+e.stats.logicalTransientTextureBytes,a=e.stats.reusedTransientBytes+e.stats.reusedTransientTextureBytes,o=i?a/i*100:0,s=e.totals.gpu.sampleCount,c=e.nodes.map(t=>`<div class="graph-inspector-node" data-node-type="${X(t.type)}" data-full-name="${X(t.id)}">
          <span><i title="${X(t.type===`render`?`draw`:t.type)}" aria-label="${X(t.type===`render`?`draw`:t.type)}"></i>${X(sc(this.nodeLabels,t.id)===t.id?nc(t.id,e.id):this.nodeLabels[t.id])}</span>
          <strong>${rc(t.cpu)}</strong>
          <strong>${rc(t.gpu)}</strong>
        </div>`).join(``),l=e.counters.map(e=>`<div class="graph-inspector-counter" title="${X(e.id)} · ${e.sampleCount} samples">
          <span>${X(this.getCounterLabel(e.id))}</span>
          <strong>${ac(e.latestValue)}</strong>
          <strong>${ac(e.p50Value)} / ${ac(e.p95Value)}</strong>
        </div>`).join(``);this.setText(`encoding-count`,String(e.encodingCount)),this.setText(`cpu-totals`,rc(e.totals.cpu)),this.setText(`gpu-totals`,rc(e.totals.gpu)),this.setText(`gpu-samples`,`${s}${e.timingReadFailureCount?` · ${e.timingReadFailureCount} failed`:``}`),this.element.querySelector(`[data-graph-inspector-memory]`).innerHTML=`
      <span>${e.stats.nodeOrder.length} nodes</span>
      <span>${oc(e.stats.logicalResourceBytes)} logical</span>
      <span>${oc(e.stats.physicalTransientResourceBytes)} scratch</span>
      ${e.preflight?.annotatedNodeCount?`<span>${e.preflight.annotatedNodeCount}/${e.stats.nodeOrder.length} costed nodes</span>`:``}
      ${e.preflight?.maximumInvocationCount?`<span>${$s(e.preflight.maximumInvocationCount)} max invocations</span>`:``}
      ${e.preflight?.readByteLength?`<span>${oc(e.preflight.readByteLength)} max reads</span>`:``}
      ${e.preflight?.writeByteLength?`<span>${oc(e.preflight.writeByteLength)} max writes</span>`:``}
      <span>${o?`${o.toFixed(0)}% reuse`:`no reuse`}</span>
      <span>${s?`GPU timings sampled`:`CPU timings only`}</span>`;let u=this.element.querySelector(`[data-graph-inspector-counters]`);u.hidden=e.counters.length===0,this.element.querySelector(`[data-graph-inspector-counter-rows]`).innerHTML=l,this.element.querySelector(`[data-graph-inspector-nodes]`).innerHTML=c}setText(e,t){this.element.querySelector(`[data-graph-inspector-${e}]`).textContent=t}getGraphLabel(e){return sc(this.graphLabels,e)}getCounterLabel(e){return sc(this.counterLabels,e)}};function $s(e){return Zs.format(e)}var ec=`
  [data-gpu-command-graph-inspector] { min-width: 0; }
  [data-gpu-command-graph-inspector] * { box-sizing: border-box; }
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
  [data-gpu-command-graph-inspector] .graph-inspector-node:not(.graph-inspector-node-header)::after {
    position: absolute;
    z-index: 4;
    inset: 1px 0;
    display: flex;
    align-items: center;
    padding: 3px 6px;
    border: 1px solid rgb(114 158 212 / 30%);
    border-radius: 4px;
    background: rgb(8 16 27 / 98%);
    box-shadow: 0 5px 16px rgb(0 0 0 / 35%);
    color: #e4effc;
    content: attr(data-full-name);
    font: 8px/1.25 ui-monospace, monospace;
    opacity: 0;
    overflow-wrap: anywhere;
    pointer-events: none;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node:not(.graph-inspector-node-header):hover::after {
    opacity: 1;
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
  [data-gpu-command-graph-inspector] .graph-inspector-empty { color: #8192aa; font-size: 9px; }
`;function tc(e,t,n){return`<span class="graph-inspector-metric"><span>${X(e)}</span><strong data-graph-inspector-${n}>${X(t)}</strong></span>`}function nc(e,t){let n=t.endsWith(`-graph`)?t.slice(0,-6):t,r=e.startsWith(`${n}-`)?e.slice(n.length+1):e;return r.length>32?`${r.slice(0,30)}…`:r}function rc(e){return e.p50Milliseconds===void 0?`—`:`${ic(e.p50Milliseconds)} / ${ic(e.p95Milliseconds??e.p50Milliseconds)}`}function ic(e){return e.toFixed(e<1?3:2)}function ac(e){return(e>=1e4?Zs:Xs).format(e)}function oc(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(1)} KiB`:e<1024**3?`${(e/1024**2).toFixed(1)} MiB`:`${(e/1024**3).toFixed(1)} GiB`}function sc(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:t}function X(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}var cc=class{panel;renderer=null;snapshot={graphs:[]};preferredGraphId;constructor(e={}){this.panel=Ns({id:e.id??`gpu-command-graph-debug`,title:e.title??`GPU Graph`,html:`<p class="hint">Compiled nodes, memory, and recorded timings. GPU timings appear when supplied by the application.</p><div data-graph-debug-host></div>`,onRender:t=>{let n=new Qs(t.querySelector(`[data-graph-debug-host]`),e);return this.renderer=n,n.update(this.snapshot,this.preferredGraphId),()=>{n.destroy(),this.renderer===n&&(this.renderer=null)}}})}update(e,t){this.snapshot=e,this.preferredGraphId=t,this.renderer?.update(e,t)}},lc=new Intl.NumberFormat(`en-US`,{maximumSignificantDigits:3,useGrouping:!1}),uc=class{panel;renderer=null;report;label=``;constructor(e={}){this.panel=Ns({id:e.id??`gpu-trace`,title:e.title??`GPU Trace`,html:`<div data-gpu-trace-host></div>`,onRender:e=>{let t=new dc(e.querySelector(`[data-gpu-trace-host]`));return this.renderer=t,t.update(this.report,this.label),()=>{t.destroy(),this.renderer===t&&(this.renderer=null)}}})}update(e,t=``){this.report=e,this.label=t,this.renderer?.update(e,t)}},dc=class{combinedTimeline=!1;constructor(e){this.element=e}update(e,t=``){let n=document.createElement(`section`);n.setAttribute(`data-gpu-trace`,``),n.setAttribute(`aria-label`,`GPU Trace`);let r=document.createElement(`style`);if(r.textContent=pc,n.append(r),Z(n,`strong`,t||`Latest graph execution`),!e)Z(n,`p`,`No trace collected yet.`);else{let r=e.clockCorrelation,i=!!(r&&Number.isFinite(r.offsetMilliseconds)&&Number.isFinite(r.uncertaintyMilliseconds)&&r.uncertaintyMilliseconds>=0),a=document.createElement(`label`),o=document.createElement(`input`);o.type=`checkbox`,o.checked=this.combinedTimeline,o.disabled=!i,o.addEventListener(`change`,()=>{this.combinedTimeline=o.checked,this.update(e,t)}),a.append(o,` Combined timeline (estimated)`),n.append(a);let s=this.combinedTimeline&&i;Z(n,`p`,s?`Alignment ±${fc(r.uncertaintyMilliseconds)}ms, plus timestamp precision. Submission-time estimate.`:`CPU and GPU use separate clocks. Each timeline starts at its own origin.`),i||Z(n,`p`,`Combined timeline requires submission clock correlation.`);let c=s?r.offsetMilliseconds:0,l=s?e.nodes.flatMap(e=>[e.cpuEncodeStartTimeMilliseconds,e.gpuStartTimeMilliseconds===void 0?void 0:e.gpuStartTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[],u=s?e.nodes.flatMap(e=>[e.cpuEncodeEndTimeMilliseconds,e.gpuEndTimeMilliseconds===void 0?void 0:e.gpuEndTimeMilliseconds+c]).filter(e=>e!==void 0&&Number.isFinite(e)):[];s&&e.cpuEncodeStartTimeMilliseconds!==void 0&&l.push(e.cpuEncodeStartTimeMilliseconds),s&&e.cpuEncodeEndTimeMilliseconds!==void 0&&u.push(e.cpuEncodeEndTimeMilliseconds);for(let t of[`gpu`,`cpu`]){let r=e.nodes.flatMap(e=>{let n=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,r=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds;return n!==void 0&&r!==void 0&&Number.isFinite(n)&&Number.isFinite(r)&&r>=n?[{node:e,start:n+(t===`gpu`?c:0),end:r+(t===`gpu`?c:0)}]:[]}),i=document.createElement(`section`);if(i.dataset.traceClock=t,n.append(i),Z(i,`h4`,t===`cpu`?`CPU encoding`:`GPU execution`),!r.length){Z(i,`p`,t===`cpu`?`CPU span endpoints unavailable.`:`GPU span endpoints unavailable. Timestamp queries are required.`);continue}let a=t===`cpu`?e.cpuEncodeStartTimeMilliseconds:e.gpuStartTimeMilliseconds,o=t===`cpu`?e.cpuEncodeEndTimeMilliseconds:e.gpuEndTimeMilliseconds,d=s?Math.min(...l):Math.min(...r.map(e=>e.start),a??1/0),f=(s?Math.max(...u):Math.max(...r.map(e=>e.end),o??-1/0))-d;Z(i,`p`,`0 – ${fc(f)}ms · ${r.length}/${e.nodes.length} nodes`);let p=document.createElement(`div`);p.className=`gpu-trace-rows`,i.append(p);for(let e of r){let n=document.createElement(`div`);n.className=`gpu-trace-row`;let r=Z(n,`span`,e.node.operation??e.node.type);r.title=e.node.id;let i=document.createElement(`div`);i.className=`gpu-trace-track`;let a=document.createElement(`span`);a.className=`gpu-trace-bar`,a.tabIndex=0,a.style.left=`${f?(e.start-d)/f*100:0}%`,a.style.width=`${f?(e.end-e.start)/f*100:0}%`;let o=t===`cpu`?e.node.cpuEncodeTimeMilliseconds:e.node.gpuTimeMilliseconds,s=`${e.node.id} (${e.node.type}${e.node.condition?.outcome===`skipped`?`, skipped`:``}): ${fc(e.start-d)}–${fc(e.end-d)}ms; duration ${fc(o??e.end-e.start)}ms`;a.title=s,a.setAttribute(`aria-label`,s),i.append(a),n.append(i),Z(n,`span`,`${fc(o??e.end-e.start)}ms`),p.append(n)}}}let i=Z(n,`p`,`Hover or focus a span for details.`);i.setAttribute(`aria-live`,`polite`);let a=e=>{let t=e.target.closest(`.gpu-trace-bar`);t&&(i.textContent=t.getAttribute(`aria-label`))};n.addEventListener(`mouseover`,a),n.addEventListener(`focusin`,a),this.element.replaceChildren(n)}destroy(){this.element.replaceChildren()}};function Z(e,t,n){let r=document.createElement(t);return r.textContent=n,e.append(r),r}function fc(e){return lc.format(e)}var pc=`
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
`,mc=class{inspectorPanel=new cc;tracePanel;inspector=new pr;graphs=new Map;sampleCounts=new Map;latestEncoding=null;generation=0;latestGraphId;constructor(e={}){this.tracePanel=new uc({title:e.traceTitle})}encode(e,t,n){let r=(this.graphs.get(e.id)===e?this.sampleCounts.get(e.id):0)%60==0&&t.getTimeProfilingQuerySet()===null&&t.device.features.has(`timestamp-query`)&&t.withTimeProfilingQuerySet?t.device.createQuerySet({type:`timestamp`,count:Math.min(8192,Math.max(2,e.stats.nodeOrder.length*2))}):void 0,i;try{i=r?t.withTimeProfilingQuerySet(r,()=>e.encode(t,n)):e.encode(t,n)}catch(e){throw r?.destroy(),e}return this.record(e,i,r),i}record(e,t,n){this.graphs.get(e.id)!==e&&(this.graphs.set(e.id,e),this.sampleCounts.set(e.id,0),this.inspector.registerGraph(e)),this.inspector.recordEncoding(e.id,t);let r=this.sampleCounts.get(e.id);if(this.sampleCounts.set(e.id,r+1),r%60!=0)return;this.latestEncoding=t,this.latestGraphId=e.id,this.inspectorPanel.update(this.inspector.getSnapshot(),e.id);let i=this.generation;queueMicrotask(()=>{if(i!==this.generation||this.graphs.get(e.id)!==e){n?.destroy();return}this.inspector.recordGPUTimings(e.id,t).then(n=>{i!==this.generation||this.graphs.get(e.id)!==e||(this.inspectorPanel.update(this.inspector.getSnapshot(),this.latestGraphId),this.latestEncoding===t&&this.tracePanel.update(n??t.stats,e.id))}).catch(()=>{i===this.generation&&this.latestEncoding===t&&this.tracePanel.update(t.stats,e.id)}).finally(()=>n?.destroy())})}clear(){this.generation++,this.latestEncoding=null,this.latestGraphId=void 0,this.graphs.clear(),this.sampleCounts.clear(),this.inspector.clear(),this.inspectorPanel.update(this.inspector.getSnapshot()),this.tracePanel.update(void 0)}},Q=new h,hc=new u,gc=new u(1,0),_c=new u(0,1),vc,yc=O(({input:e,threshold:t,smoothWidth:n})=>{let r=ye(e.rgb),i=he(t,t.add(n),r);return A(E(0),e,i)}),bc=class extends m{static get type(){return`BloomNode`}constructor(e,t=1,n=0,i=0){super(`vec4`),this.inputNode=e,this.strength=t.isNode?t:k(t),this.radius=n.isNode?n:k(n),this.threshold=i.isNode?i:k(i),this.smoothWidth=k(.01),this._resolutionScale=.5,this.highPassFn=yc,this._renderTargetsHorizontal=[],this._renderTargetsVertical=[],this._nMips=5,this._renderTargetBright=new r(1,1,{depthBuffer:!1,type:l}),this._renderTargetBright.texture.name=`UnrealBloomPass.bright`,this._renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this._nMips;e++){let t=new r(1,1,{depthBuffer:!1,type:l});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this._renderTargetsHorizontal.push(t);let n=new r(1,1,{depthBuffer:!1,type:l});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this._renderTargetsVertical.push(n)}this._compositeMaterial=null,this._highPassFilterMaterial=null,this._separableBlurMaterials=[],this._textureNodeBright=ge(this._renderTargetBright.texture),this._textureNodeBlur0=ge(this._renderTargetsVertical[0].texture),this._textureNodeBlur1=ge(this._renderTargetsVertical[1].texture),this._textureNodeBlur2=ge(this._renderTargetsVertical[2].texture),this._textureNodeBlur3=ge(this._renderTargetsVertical[3].texture),this._textureNodeBlur4=ge(this._renderTargetsVertical[4].texture),this._textureOutput=je(this,this._renderTargetsHorizontal[0].texture),this.updateBeforeType=y.FRAME}getTextureNode(){return this._textureOutput}setResolutionScale(e){return this._resolutionScale=e,this}getResolutionScale(){return this._resolutionScale}setSize(e,t){let n=Math.floor(e*this._resolutionScale),r=Math.floor(t*this._resolutionScale);this._renderTargetBright.setSize(n,r);for(let e=0;e<this._nMips;e++)this._renderTargetsHorizontal[e].setSize(n,r),this._renderTargetsVertical[e].setSize(n,r),this._separableBlurMaterials[e].invSize.value.set(1/n,1/r),n=Math.floor(n/2),r=Math.floor(r/2)}updateBefore(e){let{renderer:t}=e;vc=p.resetRendererState(t,vc);let n=t.getDrawingBufferSize(hc);this.setSize(n.width,n.height),t.setRenderTarget(this._renderTargetBright),Q.material=this._highPassFilterMaterial,Q.name=`Bloom [ High Pass ]`,Q.render(t);let r=this._renderTargetBright;for(let e=0;e<this._nMips;e++)Q.material=this._separableBlurMaterials[e],this._separableBlurMaterials[e].colorTexture.value=r.texture,this._separableBlurMaterials[e].direction.value=gc,t.setRenderTarget(this._renderTargetsHorizontal[e]),Q.name=`Bloom [ Blur Horizontal - ${e} ]`,Q.render(t),this._separableBlurMaterials[e].colorTexture.value=this._renderTargetsHorizontal[e].texture,this._separableBlurMaterials[e].direction.value=_c,t.setRenderTarget(this._renderTargetsVertical[e]),Q.name=`Bloom [ Blur Vertical - ${e} ]`,Q.render(t),r=this._renderTargetsVertical[e];t.setRenderTarget(this._renderTargetsHorizontal[0]),Q.material=this._compositeMaterial,Q.name=`Bloom [ Composite ]`,Q.render(t),p.restoreRendererState(t,vc)}setup(e){this._highPassFilterMaterial=this._highPassFilterMaterial||new g,this._highPassFilterMaterial.fragmentNode=this.highPassFn({input:this.inputNode,threshold:this.threshold,smoothWidth:this.smoothWidth}).context(e.getSharedContext()),this._highPassFilterMaterial.name=`Bloom_highPass`,this._highPassFilterMaterial.needsUpdate=!0;let t=[6,10,14,18,22];for(let n=0;n<this._nMips;n++)this._separableBlurMaterials.push(this._getSeparableBlurMaterial(e,t[n]));let n=me([1,.8,.6,.4,.2]),r=me([new s(1,1,1),new s(1,1,1),new s(1,1,1),new s(1,1,1),new s(1,1,1)]),i=O(([e,t])=>A(e,we(1.2).sub(e),t)).setLayout({name:`lerpBloomFactor`,type:`float`,inputs:[{name:`factor`,type:`float`},{name:`radius`,type:`float`}]}),a=O(()=>{let e=i(n.element(0),this.radius).mul(E(r.element(0),1)).mul(this._textureNodeBlur0),t=i(n.element(1),this.radius).mul(E(r.element(1),1)).mul(this._textureNodeBlur1),a=i(n.element(2),this.radius).mul(E(r.element(2),1)).mul(this._textureNodeBlur2),o=i(n.element(3),this.radius).mul(E(r.element(3),1)).mul(this._textureNodeBlur3),s=i(n.element(4),this.radius).mul(E(r.element(4),1)).mul(this._textureNodeBlur4);return e.add(t).add(a).add(o).add(s).mul(this.strength)});return this._compositeMaterial=this._compositeMaterial||new g,this._compositeMaterial.fragmentNode=a().context(e.getSharedContext()),this._compositeMaterial.name=`Bloom_comp`,this._compositeMaterial.needsUpdate=!0,this._textureOutput}dispose(){for(let e=0;e<this._renderTargetsHorizontal.length;e++)this._renderTargetsHorizontal[e].dispose();for(let e=0;e<this._renderTargetsVertical.length;e++)this._renderTargetsVertical[e].dispose();this._renderTargetBright.dispose(),this._highPassFilterMaterial!==null&&this._highPassFilterMaterial.dispose(),this._compositeMaterial!==null&&this._compositeMaterial.dispose();for(let e=0;e<this._separableBlurMaterials.length;e++)this._separableBlurMaterials[e].dispose()}_getSeparableBlurMaterial(e,t){let n=[],r=t/3;for(let e=0;e<t;e++)n.push(.39894*Math.exp(-.5*e*e/(r*r))/r);let i=ge(null),a=me(n),o=k(new u),s=k(new u(.5,.5)),c=Se(),l=e=>i.sample(e),d=O(()=>{let e=l(c).rgb.mul(a.element(0)).toVar();return Ee({start:D(1),end:D(t),type:`int`,condition:`<`},({i:t})=>{let n=we(t),r=a.element(t),i=s.mul(o).mul(n),u=l(c.add(i)).rgb,d=l(c.sub(i)).rgb;e.addAssign(Oe(u,d).mul(r))}),E(e,1)}),f=new g;return f.fragmentNode=d().context(e.getSharedContext()),f.name=`Bloom_separable`,f.needsUpdate=!0,f.colorTexture=i,f.direction=s,f.invSize=o,f}},xc=(e,t,n,r)=>new bc(be(e),t,n,r),Sc=98304,$=Sc+98304,Cc=250*.2/(2*Math.PI),wc=`
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
  let population = select(particleIndex % 16u, 4u, particleIndex >= ${Sc}u);
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
}`;async function Tc(){if(!navigator.gpu)throw Error(`This showcase requires WebGPU.`);let a=document.querySelector(`#viewport`),s=document.querySelector(`#status`),u=document.querySelector(`#elapsed-time`),p=new mc,m=Ks(p),h=document.createElement(`canvas`);a.append(h),s.textContent=`Requesting shared WebGPU device…`;let g=await f.createDevice({adapters:[_e],type:`webgpu`,optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:document.createElement(`canvas`),autoResize:!1}}),y=new ee({canvas:h,device:g.handle,antialias:!0});s.textContent=`Initializing Three renderer…`,await y.init();let S=Te(g,y);if(!S.supported)throw Error(S.reason);let ne=new ke(g,y),re=g.createBuffer({id:`galaxy-positions`,byteLength:$*12,usage:C.STORAGE|C.VERTEX}),ie=g.createBuffer({id:`galaxy-colors`,byteLength:$*12,usage:C.STORAGE|C.VERTEX}),ae=g.createBuffer({id:`galaxy-params`,byteLength:16,usage:C.UNIFORM|C.COPY_DST}),w=new Vn(g,{id:`galaxy-animation`}),oe=w.importBuffer({id:`positions`,byteLength:re.byteLength,usage:re.usage},re),se=w.importBuffer({id:`colors`,byteLength:ie.byteLength,usage:ie.usage},ie),ce=w.importBuffer({id:`params`,byteLength:ae.byteLength,usage:ae.usage},ae);w.addComputePass({id:`animate-and-color`,resources:[{buffer:oe,usage:`storage-write`},{buffer:se,usage:`storage-write`},{buffer:ce,usage:`uniform`}],compile:({device:e})=>{let t=new Pe(e,{id:`galaxy-kernel`,source:wc,shaderLayout:{bindings:[{name:`offsets`,type:`storage`,group:0,location:0},{name:`colors`,type:`storage`,group:0,location:1},{name:`parameters`,type:`uniform`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:n})=>{t.setBindings({offsets:n(oe),colors:n(se),parameters:n(ce)}),t.dispatch(e,$/256)},destroy:()=>t.destroy()}}}),s.textContent=`Compiling galaxy animation…`;let le=await w.compileAsync(),ue=new t(1,1),T=new v;T.index=ue.index,T.setAttribute(`position`,ue.getAttribute(`position`)),T.setAttribute(`uv`,ue.getAttribute(`uv`));let de=new Float32Array($);for(let e=0;e<$;e++){let t=e>=Sc?4:e%16,n=e*16807%65521/65521;de[e]=t<2?.7+n*1.4:t===2?.08+n**8*.9:t===4?.05+n**4*.08:t>=5&&t<=8?.07+n*.12:.024+n**4*.09}T.setAttribute(`instanceSize`,new i(de,1)),T.instanceCount=$,T.setAttribute(`instanceOffset`,ne.createInstancedAttribute(re,3,$)),T.setAttribute(`instanceColor`,ne.createInstancedAttribute(ie,3,$));let fe=new d({color:`#ffffff`,transparent:!0,opacity:.85,blending:2,depthWrite:!1}),pe=xe(`instanceSize`,`float`),me=ve.mul(pe);fe.positionNode=xe(`instanceOffset`,`vec3`).add(Ce.mul(E(me,0)).xyz);let he=De(Se().sub(.5).length().pow(2).mul(4).mul(-5)).sub(Math.exp(-5)).max(0);fe.opacityNode=he,fe.colorNode=xe(`instanceColor`,`vec3`);let ye=new _(T,fe);ye.frustumCulled=!1;let be=new te;be.background=new e(`#010409`),be.add(ye);let D=new c(50,1,.01,200);D.position.set(0,8.2,19.2),D.up.set(.3,1,0);let O=new b(D,h);O.enableDamping=!0;let k=!1,we=0,Ee=0;O.addEventListener(`start`,()=>{k=!0}),O.addEventListener(`end`,()=>{k=!1,we=performance.now()+6e3});let Oe=new wr(g,y),je=new r(1,1,{type:l});je.depthTexture=new n(1,1);let A=fe.clone();A.transparent=!1,A.blending=0,A.colorWrite=!1,A.depthWrite=!0,A.alphaTest=.2,A.opacityNode=he.mul(pe.lessThan(.25).select(1,0));let Me=new te,Ne=new _(T,A);Ne.frustumCulled=!1,Me.add(Ne);let Fe=new o(10.1,96),Ie=new d({colorWrite:!1,depthWrite:!0,side:2}),Le=new _(Fe,Ie);Le.rotation.x=-Math.PI/2,Le.position.y=-1,Me.add(Le);let Re=new x(y),ze=ge(Oe.output,Ae),Be=xc(ze,.45,.3,1.1);Re.outputNode=ze.add(Be),y.toneMapping=4,y.toneMappingExposure=1.05;let j=()=>{let e=a.clientWidth,t=a.clientHeight;y.setSize(e,t,!1),je.setSize(e,t),D.aspect=e/t,D.updateProjectionMatrix()};window.addEventListener(`resize`,j),j(),s.textContent=`${$.toLocaleString(`en-US`)} instances · GPU graph → shared buffers → Three.js`;let Ve=0,He=performance.now(),Ue=!0,We=e=>{if(!Ue)return;let t=Math.min((e-He)/1e3,.05);He=e;let n=m.settings.paused;n||(Ve+=t*m.settings.speed);let r=`${(Ve*Cc).toFixed(0)} Ma`;if(u.textContent!==r&&(u.textContent=r),ae.write(new Float32Array([Ve,1,$,0])),p.encode(le,g.commandEncoder,{parameters:void 0}),g.submit(),O.update(),!n&&!k&&e>=we){Ee+=t;let e=D.position.clone().sub(O.target),n=e.length(),r=Math.atan2(e.x,e.z)+t*Math.PI/180,i=(21.5+13.5*Math.cos(Ee*Math.PI/40))*Math.PI/180,a=Math.asin(Math.max(-1,Math.min(1,e.y/n))),o=a+(i-a)*(1-Math.exp(-t*.5)),s=n*Math.cos(o);D.position.set(O.target.x+Math.sin(r)*s,O.target.y+Math.sin(o)*n,O.target.z+Math.cos(r)*s),D.lookAt(O.target)}y.setRenderTarget(je),y.render(be,D),y.autoClear=!1,y.render(Me,D),y.autoClear=!0,y.setRenderTarget(null),Oe.render(je.texture,je.depthTexture,D.position.distanceTo(O.target),m.settings.aperture,[D.near,D.far]),Re.render(),m.update(),requestAnimationFrame(We)};requestAnimationFrame(We),window.addEventListener(`pagehide`,()=>{Ue=!1,O.dispose(),m.destroy(),window.removeEventListener(`resize`,j),Re.dispose(),Be.dispose(),je.dispose(),A.dispose(),Fe.dispose(),Ie.dispose(),Oe.dispose(),ue.dispose(),T.dispose(),fe.dispose(),ne.dispose(),le.destroy(),ae.destroy(),re.destroy(),ie.destroy(),y.dispose(),g.destroy()},{once:!0})}Tc().catch(e=>{document.querySelector(`#status`).textContent=String(e),S.error(e instanceof Error?e.message:String(e))()});