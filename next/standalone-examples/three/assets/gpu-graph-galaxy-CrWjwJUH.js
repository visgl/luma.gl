import{A as e,An as t,At as n,B as r,C as i,D as a,Dt as o,Ei as s,H as c,Ht as l,I as u,J as d,K as f,L as p,M as m,N as h,On as g,Pr as _,Q as v,S as y,T as ee,Tr as b,Ut as te,W as x,X as ne,Y as S,_ as C,a as re,b as w,f as T,ft as ie,g as E,h as ae,k as oe,m as se,mn as ce,mt as le,oi as D,r as ue,si as O,u as de,w as fe,y as pe,z as k,zt as A}from"./three.webgpu-dDUMYEaA.js";import{u as j}from"./render-pipeline-iM0U8Hca.js";import{r as me,t as M}from"./buffer-nQFj-suN.js";import{n as he}from"./vertex-format-decoder-BVeNMr4-.js";import{t as N}from"./texture-i7LE4STQ.js";import{u as ge}from"./wgsl-binding-scan-DjK3d1cI.js";import{a as P,i as F}from"./dynamic-buffer-Bib4Yswa.js";import{a as I,c as L,d as _e,f as R,i as z,l as B,m as V,p as ve,s as H,t as ye,u as U}from"./model-DA0Z81Uw.js";import{t as be}from"./webgpu-adapter-EUdgZ265.js";import{t as W,x as xe}from"./get-platform-info-9k0a7ees.js";import{t as G}from"./wgsl-shader-assembler-C3hCOXwb.js";import{t as Se}from"./OrbitControls-D_x_Sj_K.js";import{a as K,c as Ce,f as we,g as q,i as J,l as Te,n as Ee,o as Y,r as X,t as De,u as Oe}from"./gpu-graph-diagnostics-DyQeNX8P.js";import{n as ke,t as Ae}from"./interop-D9xgapE2.js";var je=`struct VertexInputs {
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
`,Me=`#version 300 es
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
`,Ne=[-1,-1,1,-1,-1,1,1,1],Pe=[-1,-1,3,-1,-1,3],Fe=class extends ye{constructor(e,t){let{geometryType:n=`quad`,...r}=t,i=n===`triangle`?Pe:Ne,a=i.map(e=>(e+1)/2),o=i.length/2;r.source&&=`${je}\n${r.source}`,super(e,{id:r.id||H(`clip-space`),...r,vs:Me,vertexCount:o,geometry:new ve({topology:n===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:o,attributes:{clipSpacePositions:{size:2,value:new Float32Array(i)},texCoords:{size:2,value:new Float32Array(a)},coordinates:{size:2,value:new Float32Array(a)}}})})}},Ie={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Le=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
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
`,Re=`#version 300 es
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
`,ze=class extends Fe{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:Le,fs:Re,modules:[...t.modules||[],Ie],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof q?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:+!!this.flipY}})}},Be=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},Ve=class extends Be{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:N.SAMPLE|N.RENDER|N.COPY_SRC|N.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:N.SAMPLE|N.RENDER|N.COPY_SRC|N.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),He(this.current),t.destroy(),this.next=n.clone(e),He(this.next),n.destroy(),!0}};function He(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}var Ue=2,We=1e4,Ge=class e{static async createAsync(t,n){let r=!P.getAsyncCompilation(t),i=r?P.beginAsyncCompilation(t):P.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&P.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}static defaultProps={...ge.defaultProps,id:`unnamed`,handle:void 0,userData:{},source:``,sourceLanguage:void 0,modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:void 0,debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate=`newly created`;_getModuleUniforms;props;_destroyed=!1;_pipelineInitialization;constructor(t,n){if(t.type!==`webgpu`)throw Error(`Computation is only supported in WebGPU`);this.props={...e.defaultProps,...n,shaderAssembler:n.shaderAssembler??e.defaultProps.shaderAssembler??new G},n=this.props,this.id=n.id||H(`model`),this.device=t,Object.assign(this.userData,n.userData);let r=W(t),i=R(this.props.plugins,r.shaderLanguage);if(i.injectionTargets.length>0)throw Error(`Computation does not support ShaderPlugin render hooks`);if(Object.keys(i.vertexInputs).length>0||Object.keys(i.interStageVariables).length>0)throw Error(`Computation does not support ShaderPlugin vertex inputs or interStageVariables`);let a=_e(this.props.modules,i.modules),o=Object.fromEntries(a.map(e=>[e.name,e]));this.shaderInputs=n.shaderInputs||new z(o),n.shaderInputs&&i.modules.length>0&&this.shaderInputs.addModules(i.modules),this.setShaderInputs(this.shaderInputs);let s=B(this.props.modules,this.shaderInputs?.getModules()),c={...i.defines,...this.props.defines};this.props.shaderLayout=L(this.props.shaderLayout,s)||null,this.pipelineFactory=n.pipelineFactory||P.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||F.getDefaultShaderFactory(this.device);let l=this.props.shaderAssembler;me(l instanceof G);let{source:u,getUniforms:d,entryPoints:f={},shaderLayout:p}=l.assembleWGSLShader({platformInfo:r,...this.props,modules:s,defines:c,shaderStage:`compute`,computeEntryPoint:this.props.entryPoint,scanVertexAttributes:!1,pluginInjections:i.injections});this.source=u,this.props.entryPoint=f.compute||this.props.entryPoint,this._getModuleUniforms=d;let m=p??t.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=L(this.props.shaderLayout||m||null,s)||null;let h=P.getAsyncCompilation(this.device);h?(this._pipelineInitialization=this._updatePipelineAsync(),h.push(this._pipelineInitialization)):this.pipeline=this._updatePipeline(),n.bindings&&this.setBindings(n.bindings)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shader&&this.shaderFactory.release(this.shader),this._uniformStore.destroy(),!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new V(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(U(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(e=>{let n=t[e];return!I(n)}),r={};for(let e of n)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){let e=this._preparePipelineUpdate();return e&&(this.pipeline=this.pipelineFactory.createComputePipeline(e.props),this._finishPipelineUpdate(e.previousShader)),this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createComputePipelineAsync(e.props)}catch(t){throw this.shaderFactory.release(this.shader),this.shader=e.previousShader,this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e.previousShader)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?this.shader:null;return this.pipeline&&j.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`compute`,source:this.source,debugShaders:this.props.debugShaders}),{props:{...this.props,shader:this.shader},previousShader:e}}_finishPipelineUpdate(e){e&&this.shaderFactory.release(e)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=j.level>3?0:We;j.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,j.group(Ue,`>>> DRAWING MODEL ${this.id}`,{collapsed:j.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();j.table(Ue,e)(),j.groupEnd(Ue)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let n=he.getTypedArrayConstructor(t);return(e instanceof M?new n(e.debugData):e).toString()}};function Ke(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?qe(e):Ye(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?Je(n):Xe(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function qe(e){return`\
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
`}function Je(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function Ye(e){return`\
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
`}function Xe(e){return`\
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
`}var Ze={name:`textureTransform`,source:`
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
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Qe=new Set([`original`,`previous`]),$e=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(e,t){this.device=e;let n=rt(t.shaderPasses);n.map(e=>xe(e));let r=n.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=t.shaderInputs||new z(r);let i=e.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new Ve(e,{colorAttachments:[t.colorFormat||e.preferredColorFormat],width:i[0],height:i[1]}),this.textureModel=new ze(e,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:t.flipY??e.type===`webgpu`});let a=t.flipY??e.type===`webgpu`;this.passRenderers=t.shaderPasses.map(t=>new et(e,t,this.shaderInputs,a))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);return n?(this.drawOutput(e,n,null),!0):!1}drawOutput(e,t,n){let r=n??this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:t}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});try{this.textureModel.draw(i)}finally{i.end()}}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof q&&!n.isReady)return null;let r=n instanceof q?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=Ct(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=xt(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?St(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=xt(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=ut(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:wt(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},et=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,it(t)){st(t.name,t.renderTargets||{}),this.renderTargets=dt(e,t.renderTargets||{});let i=t.initialPasses?t.initialPasses.compute:t.compute;i&&at(e,t)&&(this.computeRenderer=new tt(e,i,this.renderTargets,n));let a=t.initialPasses?[...this.computeRenderer?[]:t.initialPasses.fragment,...t.steps]:this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps;this.subPassExecutions=a.flatMap(e=>this.createStepExecutions(t,e,r));return}ot(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();mt(this.renderTargets)}resize(e){ht(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=yt(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=vt(t),n=yt(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return ot(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return ct(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new nt(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:lt(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?vt(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},tt=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,t,n,r){this.optimization=t,this.renderTargets=n,this.shaderInputs=r,this.parameterBuffer=e.createBuffer({id:`${t.name}-parameters`,byteLength:Math.max(Math.ceil(t.uniformNames.length/4)*16,16),usage:M.UNIFORM|M.COPY_DST});let i=Object.entries(t.outputs).map(([e,t],r)=>({name:e,type:`storage`,group:0,location:r+2,access:`write-only`,format:n[t].texture.format}));try{this.computation=new Ge(e,{id:t.name,source:t.source,shaderLayout:{bindings:[{name:t.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...i]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},nt=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=Ke({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new Fe(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[Ze,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:+!!this.flipY}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function rt(e){return e.flatMap(e=>it(e)?[...e.initialPasses?.fragment??[],...e.steps].map(e=>e.shaderPass):[e])}function it(e){return`steps`in e}function at(e,t){let n=t.initialPasses?t.initialPasses.compute:t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function ot(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use CompositeShaderPass.renderTargets instead`)}function st(e,t){for(let n of Object.keys(t))if(Qe.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function ct(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function lt(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function ut(e,t,n){return lt(lt(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function dt(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=bt(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!ft(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!pt(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=gt(e,i,a,n)}return r}function ft(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function pt(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function mt(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function ht(e,t,n){for(let r of new Set(Object.values(t))){let t=bt(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=gt(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function gt(e,t,n,r){let i=bt(r,n.scale),{texture:a,framebuffer:o}=_t(e,t,n,i),s,c;if(n.lifetime===`history`){let r=_t(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function _t(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:N.SAMPLE|N.RENDER|N.COPY_SRC|N.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?N.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function vt(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function yt(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function bt(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function xt(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function St(e,t){return t===e.current?e.next:e.current}function Ct(e,t){return xt(e.current)===t?e.next:e.current}function wt(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}function Tt(e,t){if(`configure`in e)return e.configure(t);let{scaleResources:n,variants:r,optionDefaults:i}=e,a=t,o=i,s=r&&String(a?.[r.option]??o[r.option]),c=r&&s!==void 0&&Object.hasOwn(r.values,s)?r.values[s]:void 0,l={...e,...c},u={...l.resources};if(n){let t=a?.[n.option]??o[n.option];if(typeof t!=`number`||!Number.isFinite(t)||t<=0)throw Error(e.name+`: resource scale must be a finite positive number`);for(let e of n.targets){let n=u[e];n&&(u[e]={...n,scale:[t,t]})}}return{...l,resources:u}}function Et(e){return{name:e.name,renderTargets:e.resources,initialPasses:e.initialPasses&&{...e.initialPasses,fragment:e.initialPasses.fragment.map(Dt)},steps:e.passes.map(Dt)}}function Dt(e){if(e.kind===`fullscreen`)return e;let{kind:t,module:n,...r}=e;return{...r,shaderPass:{...n,passes:[{action:t}]}}}var Ot=class extends $e{constructor(e,{effects:t,...n}){super(e,{...n,shaderPasses:t.map(e=>{if(!(`effect`in e))return Et(e);let{effect:t}=e;return`configure`in t&&t.configure||`optionDefaults`in t?Et(Tt(t,e.options)):Et(t)})})}render({target:e,commandEncoder:t=this.device.commandEncoder,...n}){if(e&&e.device!==this.device)throw Error(`EffectRenderer target must belong to the renderer device`);let r=this.encodeToTexture(t,n);return e===void 0?r:r?(this.drawOutput(t,r,e),!0):!1}},kt=20,At=`\
const DEPTH_OF_FIELD_MAX_BLUR: i32 = ${kt};

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
`,jt=`\
#define DEPTH_OF_FIELD_MAX_BLUR ${kt}.0

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
`,Mt={name:`dof`,source:At,fs:jt,bindingLayout:[{name:`depthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{depthRange:`vec2<f32>`,focusDistance:`f32`,blurCoefficient:`f32`,pixelsPerMillimeter:`f32`,texelOffset:`vec2<f32>`,circularAperture:`f32`},propTypes:{depthRange:{value:[.1,100]},focusDistance:{value:1,min:1e-4},blurCoefficient:{value:1,min:0},pixelsPerMillimeter:{value:1,min:0},texelOffset:{value:[1,0],private:!0},circularAperture:{value:0,private:!0}},passes:[{sampler:!0}]},Nt={name:`dofCompositeShaderPass`,resources:{blurScratch:{}},passes:[{kind:`fullscreen`,shaderPass:Mt,inputs:{sourceTexture:`previous`},output:`blurScratch`,uniforms:{texelOffset:[1,0]}},{kind:`fullscreen`,shaderPass:Mt,inputs:{sourceTexture:`blurScratch`},output:`previous`,uniforms:{texelOffset:[0,1]}}]};Nt.name,Nt.resources,Nt.passes;var Pt={...Mt,name:`bokehDof`,source:At.replaceAll(`dof`,`bokehDof`),fs:jt.replaceAll(`dof`,`bokehDof`),propTypes:{...Mt.propTypes,circularAperture:{value:1,private:!0}}},Ft={name:Pt.name,resources:{},passes:[{kind:`fullscreen`,shaderPass:Pt,output:`previous`}]},It=class{device;output=new n;passes;backend;source;depth;sourceHandle;outputHandle;constructor(e,t){this.device=e,this.backend=t.backend,this.output.flipY=!1,this.passes=new Ot(e,{effects:[Ft],colorFormat:`rgba16float`,flipY:!0})}render(e,t,n,r,i){let a=this.backend.get(e).texture;this.sourceHandle!==a&&(this.source?.destroy(),this.depth?.destroy(),this.sourceHandle=a,this.source=this.borrowTexture(a),this.depth=this.borrowTexture(this.backend.get(t).texture),this.device.getCanvasContext().setDrawingBufferSize(a.width,a.height),this.passes.resize([a.width,a.height]));let o=this.passes.renderToTexture({sourceTexture:this.source,bindings:{depthTexture:this.depth},uniforms:{bokehDof:{depthRange:i,focusDistance:n,blurCoefficient:r*24,pixelsPerMillimeter:a.height/850}}});this.device.submit();let s=o.handle;this.outputHandle!==s&&(this.outputHandle&&this.output.dispose(),this.outputHandle=s,this.output.sourceTexture=s,this.output.needsUpdate=!0)}dispose(){this.output.dispose(),this.source?.destroy(),this.depth?.destroy(),this.passes.destroy()}borrowTexture(e){return this.device.createTexture({handle:e,_isHandleBorrowed:!0,width:e.width,height:e.height,format:e.format,sampler:{minFilter:`nearest`,magFilter:`nearest`}})}},Lt=`// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
//
// GPUCommandGraph -> borrowed GPU buffers -> upstream Three.js WebGPURenderer.
// Three 0.187.0 is intentionally pinned: the bridge uses private renderer hooks.
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
`;function Rt(e){let t=document.querySelector(`#hud`),n=document.querySelector(`#galaxy-info`);Ce(n,`cinematic`);let r={speed:1,aperture:.2,paused:!1},i=null,a=new Ee({id:`galaxy-settings`,label:`Controls`,schema:{title:`Controls`,sections:[{id:`animation`,name:``,settings:[{name:`speed`,label:`Speed`,type:`number`,min:0,max:3,step:.05,persist:`none`},{name:`aperture`,label:`Aperture`,type:`number`,min:0,max:1.5,step:.05,persist:`none`},{name:`paused`,label:`Pause`,type:`boolean`,persist:`none`}]}]},settings:r,onSettingsChange:e=>{typeof e.speed==`number`&&(r.speed=e.speed),typeof e.aperture==`number`&&(r.aperture=e.aperture),typeof e.paused==`boolean`&&(r.paused=e.paused),i&&Y(i,a.makePanel())}}),o=new Te({id:`galaxy-info-box`,title:`Galactic Vortex`,placement:`top-left`,widthPx:340,collapsible:!0,defaultOpen:!0,panel:J({id:`galaxy-info-tabs`,theme:`dark`,panels:[K({id:`galaxy-controls`,title:`Controls`,html:``,onRender:e=>(X(e,`cinematic`),t.hidden=!1,e.append(t),i=document.createElement(`div`),X(i,`cinematic`),e.append(i),Y(i,a.makePanel()),()=>{i&&=(Y(i,null),i.remove(),null),t.hidden=!0,document.body.append(t)})}),K({id:`galaxy-info`,title:`Info`,html:`<h3>GPU architecture</h3><p>A luma GPU graph calculates star positions and colors in buffers shared with Three.js, without per-frame geometry readback or upload. Graph and Trace show the animation pass; Three rendering and postprocessing are submitted separately.</p>`,onRender:e=>X(e,`cinematic`)}),e.inspectorPanel.panel,e.tracePanel.panel,K({id:`example-source`,title:`Source`,html:``,onRender:e=>{X(e,`cinematic`);let t=document.createElement(`pre`);return t.style.cssText=`margin:0;max-height:60vh;overflow:auto;font:11px/1.5 monospace;white-space:pre-wrap;overflow-wrap:anywhere`,t.textContent=Lt,e.append(t),()=>t.remove()}})]})}),s=new Oe({parentElement:n});return s.setProps({components:[o]}),s.onRedraw({viewports:[],layers:[]}),{settings:r,update(){s.onRedraw({viewports:[],layers:[]})},destroy(){s.finalize(),a.finalize(),e.clear(),n.remove()}}}var Z=new pe,zt=new D,Bt=new D(1,0),Vt=new D(0,1),Ht,Ut=T(({input:e,threshold:t,smoothWidth:n})=>{let r=h(e.rgb),i=x(t,t.add(n),r);return u(v(0),e,i)}),Wt=class extends ae{static get type(){return`BloomNode`}constructor(e,t=1,n=0,r=0){super(`vec4`),this.inputNode=e,this.strength=t.isNode?t:d(t),this.radius=n.isNode?n:d(n),this.threshold=r.isNode?r:d(r),this.smoothWidth=d(.01),this.bloomTintColors=[new O(1,1,1),new O(1,1,1),new O(1,1,1),new O(1,1,1),new O(1,1,1)],this._resolutionScale=.5,this.highPassFn=Ut,this._renderTargetsHorizontal=[],this._renderTargetsVertical=[],this._nMips=5,this._renderTargetBright=new b(1,1,{depthBuffer:!1,type:A}),this._renderTargetBright.texture.name=`UnrealBloomPass.bright`,this._renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this._nMips;e++){let t=new b(1,1,{depthBuffer:!1,type:A});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this._renderTargetsHorizontal.push(t);let n=new b(1,1,{depthBuffer:!1,type:A});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this._renderTargetsVertical.push(n)}this._compositeMaterial=null,this._highPassFilterMaterial=null,this._separableBlurMaterials=[],this._textureNodeBright=f(this._renderTargetBright.texture),this._textureNodeBlur0=f(this._renderTargetsVertical[0].texture),this._textureNodeBlur1=f(this._renderTargetsVertical[1].texture),this._textureNodeBlur2=f(this._renderTargetsVertical[2].texture),this._textureNodeBlur3=f(this._renderTargetsVertical[3].texture),this._textureNodeBlur4=f(this._renderTargetsVertical[4].texture),this._textureOutput=k(this,this._renderTargetsHorizontal[0].texture),this.updateBeforeType=C.FRAME}getTextureNode(){return this._textureOutput}setResolutionScale(e){return this._resolutionScale=e,this}getResolutionScale(){return this._resolutionScale}setSize(e,t){let n=Math.floor(e*this._resolutionScale),r=Math.floor(t*this._resolutionScale);this._renderTargetBright.setSize(n,r);for(let e=0;e<this._nMips;e++)this._renderTargetsHorizontal[e].setSize(n,r),this._renderTargetsVertical[e].setSize(n,r),this._separableBlurMaterials[e].invSize.value.set(1/n,1/r),n=Math.floor(n/2),r=Math.floor(r/2)}updateBefore(e){let{renderer:t}=e;Ht=w.resetRendererState(t,Ht);let n=t.getDrawingBufferSize(zt);this.setSize(n.width,n.height),t.setRenderTarget(this._renderTargetBright),Z.material=this._highPassFilterMaterial,Z.name=`Bloom [ High Pass ]`,Z.render(t);let r=this._renderTargetBright;for(let e=0;e<this._nMips;e++)Z.material=this._separableBlurMaterials[e],this._separableBlurMaterials[e].colorTexture.value=r.texture,this._separableBlurMaterials[e].direction.value=Bt,t.setRenderTarget(this._renderTargetsHorizontal[e]),Z.name=`Bloom [ Blur Horizontal - ${e} ]`,Z.render(t),this._separableBlurMaterials[e].colorTexture.value=this._renderTargetsHorizontal[e].texture,this._separableBlurMaterials[e].direction.value=Vt,t.setRenderTarget(this._renderTargetsVertical[e]),Z.name=`Bloom [ Blur Vertical - ${e} ]`,Z.render(t),r=this._renderTargetsVertical[e];t.setRenderTarget(this._renderTargetsHorizontal[0]),Z.material=this._compositeMaterial,Z.name=`Bloom [ Composite ]`,Z.render(t),w.restoreRendererState(t,Ht)}setup(e){let t=a(e.getSharedContext());this._highPassFilterMaterial=this._highPassFilterMaterial||new E,this._highPassFilterMaterial.contextNode=t,this._highPassFilterMaterial.fragmentNode=this.highPassFn({input:this.inputNode,threshold:this.threshold,smoothWidth:this.smoothWidth}),this._highPassFilterMaterial.name=`Bloom_highPass`,this._highPassFilterMaterial.needsUpdate=!0;let n=[6,10,14,18,22];for(let e=0;e<this._nMips;e++)this._separableBlurMaterials.push(this._getSeparableBlurMaterial(t,n[e]));let r=i([1,.8,.6,.4,.2]),o=S(this.bloomTintColors),s=T(()=>{let e=Q(r.element(0),this.radius).mul(v(o.element(0),1)).mul(this._textureNodeBlur0),t=Q(r.element(1),this.radius).mul(v(o.element(1),1)).mul(this._textureNodeBlur1),n=Q(r.element(2),this.radius).mul(v(o.element(2),1)).mul(this._textureNodeBlur2),i=Q(r.element(3),this.radius).mul(v(o.element(3),1)).mul(this._textureNodeBlur3),a=Q(r.element(4),this.radius).mul(v(o.element(4),1)).mul(this._textureNodeBlur4);return e.add(t).add(n).add(i).add(a).mul(this.strength)});return this._compositeMaterial=this._compositeMaterial||new E,this._compositeMaterial.contextNode=t,this._compositeMaterial.fragmentNode=s(),this._compositeMaterial.name=`Bloom_comp`,this._compositeMaterial.needsUpdate=!0,this._textureOutput}dispose(){super.dispose();for(let e=0;e<this._renderTargetsHorizontal.length;e++)this._renderTargetsHorizontal[e].dispose();for(let e=0;e<this._renderTargetsVertical.length;e++)this._renderTargetsVertical[e].dispose();this._renderTargetBright.dispose(),this._highPassFilterMaterial!==null&&this._highPassFilterMaterial.dispose(),this._compositeMaterial!==null&&this._compositeMaterial.dispose();for(let e=0;e<this._separableBlurMaterials.length;e++)this._separableBlurMaterials[e].dispose()}_getSeparableBlurMaterial(e,t){let n=[],r=t/3;for(let e=0;e<t;e++)n.push(.39894*Math.exp(-.5*e*e/(r*r))/r);let a=n[0],o=[],s=[];for(let e=1;e<t;e+=2){let r=n[e],i=e+1<t?n[e+1]:0,a=r+i;o.push((e*r+(e+1)*i)/a),s.push(a)}let c=f(null),l=i(o),u=i(s),p=d(new D),h=d(new D(.5,.5)),g=ne(),_=e=>c.sample(e),ee=T(()=>{let e=_(g).rgb.mul(a).toVar();return se({start:m(0),end:m(o.length),type:`int`,condition:`<`},({i:t})=>{let n=u.element(t),r=h.mul(p).mul(l.element(t)),i=_(g.add(r)).rgb,a=_(g.sub(r)).rgb;e.addAssign(y(i,a).mul(n))}),v(e,1)}),b=new E;return b.contextNode=e,b.fragmentNode=ee(),b.name=`Bloom_separable`,b.needsUpdate=!0,b.colorTexture=c,b.direction=h,b.invSize=p,b}},Q=T(({factor:t,radius:n})=>u(t,e(1.2).sub(t),n),{factor:`float`,radius:`float`,return:`float`}),Gt=(e,t,n,r)=>new Wt(p(e),t,n,r),Kt=98304,$=196608,qt=250*.2/(2*Math.PI),Jt=`
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
  let population = select(particleIndex % 16u, 4u, particleIndex >= ${Kt}u);
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
}`;async function Yt(){if(!navigator.gpu)throw Error(`This showcase requires WebGPU.`);let e=document.querySelector(`#viewport`),n=document.querySelector(`#status`),i=document.querySelector(`#elapsed-time`),a=new De,u=Rt(a),d=document.createElement(`canvas`);e.append(d),n.textContent=`Requesting shared WebGPU device…`;let p=await s.createDevice({adapters:[be],type:`webgpu`,optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:document.createElement(`canvas`),autoResize:!1}}),m=new de({canvas:d,device:p.handle,antialias:!0});n.textContent=`Initializing Three renderer…`,await m.init();let h=ke(p,m);if(!h.supported)throw Error(h.reason);let y=new Ae(p,m),x=p.createBuffer({id:`galaxy-positions`,byteLength:$*12,usage:M.STORAGE|M.VERTEX}),S=p.createBuffer({id:`galaxy-colors`,byteLength:$*12,usage:M.STORAGE|M.VERTEX}),C=p.createBuffer({id:`galaxy-params`,byteLength:16,usage:M.UNIFORM|M.COPY_DST}),w=new we(p,{id:`galaxy-animation`}),T=w.importBuffer({id:`positions`,byteLength:x.byteLength,usage:x.usage},x),E=w.importBuffer({id:`colors`,byteLength:S.byteLength,usage:S.usage},S),ae=w.importBuffer({id:`params`,byteLength:C.byteLength,usage:C.usage},C);w.addComputePass({id:`animate-and-color`,resources:[{buffer:T,usage:`storage-write`},{buffer:E,usage:`storage-write`},{buffer:ae,usage:`uniform`}],compile:({device:e})=>{let t=new Ge(e,{id:`galaxy-kernel`,source:Jt,shaderLayout:{bindings:[{name:`offsets`,type:`storage`,group:0,location:0},{name:`colors`,type:`storage`,group:0,location:1},{name:`parameters`,type:`uniform`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:n})=>{t.setBindings({offsets:n(T),colors:n(E),parameters:n(ae)}),t.dispatch(e,$/256)},destroy:()=>t.destroy()}}}),n.textContent=`Compiling galaxy animation…`;let se=await w.compileAsync(),D=new t(1,1),O=new te;O.index=D.index,O.setAttribute(`position`,D.getAttribute(`position`)),O.setAttribute(`uv`,D.getAttribute(`uv`));let pe=new Float32Array($);for(let e=0;e<$;e++){let t=e>=Kt?4:e%16,n=e*16807%65521/65521;pe[e]=t<2?.7+n*1.4:t===2?.08+n**8*.9:t===4?.05+n**4*.08:t>=5&&t<=8?.07+n*.12:.024+n**4*.09}O.setAttribute(`instanceSize`,new l(pe,1)),O.instanceCount=$,O.setAttribute(`instanceOffset`,y.createInstancedAttribute(x,3,$)),O.setAttribute(`instanceColor`,y.createInstancedAttribute(S,3,$));let k=new ue({color:`#ffffff`,transparent:!0,opacity:.85,blending:2,depthWrite:!1}),j=fe(`instanceSize`,`float`),me=r.mul(j);k.positionNode=fe(`instanceOffset`,`vec3`).add(ee.mul(v(me,0)).xyz);let he=oe(ne().sub(.5).length().pow(2).mul(4).mul(-5)).sub(Math.exp(-5)).max(0);k.opacityNode=he,k.colorNode=fe(`instanceColor`,`vec3`);let N=new ce(O,k);N.frustumCulled=!1;let ge=new _;ge.background=new le(`#010409`),ge.add(N);let P=new g(50,1,.01,200);P.position.set(0,8.2,19.2),P.up.set(.3,1,0);let F=new Se(P,d);F.enableDamping=!0;let I=!1,L=0,_e=0;F.addEventListener(`start`,()=>{I=!0}),F.addEventListener(`end`,()=>{I=!1,L=performance.now()+6e3});let R=new It(p,m),z=new b(1,1,{type:A});z.depthTexture=new o(1,1);let B=k.clone();B.transparent=!1,B.blending=0,B.colorWrite=!1,B.depthWrite=!0,B.alphaTest=.2,B.opacityNode=he.mul(j.lessThan(.25).select(1,0));let V=new _,ve=new ce(O,B);ve.frustumCulled=!1,V.add(ve);let H=new ie(10.1,96),ye=new ue({colorWrite:!1,depthWrite:!0,side:2}),U=new ce(H,ye);U.rotation.x=-Math.PI/2,U.position.y=-1,V.add(U);let W=new re(m),xe=f(R.output,c),G=Gt(xe,.45,.3,1.1);W.outputNode=xe.add(G),m.toneMapping=4,m.toneMappingExposure=1.05;let K=window.devicePixelRatio,Ce=()=>{let t=Math.max(1,e.clientWidth),n=Math.max(1,e.clientHeight);K=window.devicePixelRatio,m.setPixelRatio(K),m.setSize(t,n,!1),z.setSize(d.width,d.height),P.aspect=t/n,P.updateProjectionMatrix()},q=new ResizeObserver(Ce);q.observe(e),Ce(),n.textContent=`${$.toLocaleString(`en-US`)} instances · GPU graph → shared buffers → Three.js`;let J=0,Te=performance.now(),Ee=!0,Y=!1,X=e=>{if(!Ee)return;window.devicePixelRatio!==K&&Ce();let t=Math.min((e-Te)/1e3,.05);Te=e;let n=u.settings.paused;n||(J+=t*u.settings.speed);let r=`${(J*qt).toFixed(0)} Ma`;if(i.textContent!==r&&(i.textContent=r),C.write(new Float32Array([J,1,$,0])),a.encode(se,p.commandEncoder,{parameters:void 0}),p.submit(),F.update(),!n&&!I&&e>=L){_e+=t;let e=P.position.clone().sub(F.target),n=e.length(),r=Math.atan2(e.x,e.z)+t*Math.PI/180,i=(21.5+13.5*Math.cos(_e*Math.PI/40))*Math.PI/180,a=Math.asin(Math.max(-1,Math.min(1,e.y/n))),o=a+(i-a)*(1-Math.exp(-t*.5)),s=n*Math.cos(o);P.position.set(F.target.x+Math.sin(r)*s,F.target.y+Math.sin(o)*n,F.target.z+Math.cos(r)*s),P.lookAt(F.target)}m.setRenderTarget(z),m.render(ge,P),m.autoClear=!1,m.render(V,P),m.autoClear=!0,m.setRenderTarget(null),R.render(z.texture,z.depthTexture,P.position.distanceTo(F.target),u.settings.aperture,[P.near,P.far]),W.render(),Y||(Y=!0,window.parent.postMessage({type:`luma-example-ready`},window.location.origin)),u.update(),requestAnimationFrame(X)};requestAnimationFrame(X),window.addEventListener(`pagehide`,()=>{Ee=!1,F.dispose(),u.destroy(),q.disconnect(),W.dispose(),G.dispose(),z.dispose(),B.dispose(),H.dispose(),ye.dispose(),R.dispose(),D.dispose(),O.dispose(),k.dispose(),y.dispose(),se.destroy(),C.destroy(),x.destroy(),S.destroy(),m.dispose(),p.destroy()},{once:!0})}Yt().catch(e=>{window.parent.postMessage({type:`luma-example-error`,message:String(e)},window.location.origin),document.querySelector(`#status`).textContent=String(e),j.error(e instanceof Error?e.message:String(e))()});