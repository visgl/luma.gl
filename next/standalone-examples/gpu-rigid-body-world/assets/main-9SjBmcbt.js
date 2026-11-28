import{A as e,B as t,D as n,L as r,M as i,O as a,_ as o,c as s,d as c,f as l,g as u,j as d,k as f,l as p,o as m,p as ee,s as h,t as te,u as g,w as _,y as v,z as y}from"./gpu-rigid-body-world-WacThrOi.js";import{E as b,V as x,z as S}from"./wgsl-interface-scan-BeLN4x0P.js";import{c as C,l as w,n as ne,o as T,r as E,s as re,t as ie}from"./robot-arm-scene-CJrOu8k8.js";var D={name:`pbrEnvironmentFilter`,bindingLayout:[{name:`pbrEnvironmentFilter`,group:0},{name:`pbrEnvironmentSource`,group:0}],fs:`layout(std140) uniform pbrEnvironmentFilterUniforms {
  int face;
  float roughness;
  int mode;
  int sampleCount;
  int sourceEncoding;
} pbrEnvironmentFilter;

uniform sampler2D pbrEnvironmentSource;
`,source:`struct PBREnvironmentFilterUniforms {
  face: i32,
  roughness: f32,
  mode: i32,
  sampleCount: i32,
  sourceEncoding: i32,
};

@group(0) @binding(auto) var<uniform> pbrEnvironmentFilter: PBREnvironmentFilterUniforms;
#ifdef PBR_ENVIRONMENT_CUBE_SOURCE
@group(0) @binding(auto) var pbrEnvironmentSource: texture_cube<f32>;
#else
@group(0) @binding(auto) var pbrEnvironmentSource: texture_2d<f32>;
#endif
@group(0) @binding(auto) var pbrEnvironmentSourceSampler: sampler;
`,getUniforms:e=>e,uniformTypes:{face:`i32`,roughness:`f32`,mode:`i32`,sampleCount:`i32`,sourceEncoding:`i32`},defaultUniforms:{face:0,roughness:0,mode:0,sampleCount:64,sourceEncoding:0}},O=`#version 300 es
precision highp float;
precision highp int;

in vec2 uv;
out vec4 fragmentColor;

const float ENVIRONMENT_PI = 3.141592653589793;

vec2 getEnvironmentHammersley(uint index, uint sampleCount)
{
  uint reversedBits = (index << 16u) | (index >> 16u);
  reversedBits = ((reversedBits & 0x55555555u) << 1u) |
    ((reversedBits & 0xAAAAAAAAu) >> 1u);
  reversedBits = ((reversedBits & 0x33333333u) << 2u) |
    ((reversedBits & 0xCCCCCCCCu) >> 2u);
  reversedBits = ((reversedBits & 0x0F0F0F0Fu) << 4u) |
    ((reversedBits & 0xF0F0F0F0u) >> 4u);
  reversedBits = ((reversedBits & 0x00FF00FFu) << 8u) |
    ((reversedBits & 0xFF00FF00u) >> 8u);
  return vec2(
    float(index) / float(sampleCount),
    float(reversedBits) * 2.3283064365386963e-10
  );
}

vec3 getEnvironmentFaceDirection(int face, vec2 textureCoordinate)
{
  vec2 coordinate = textureCoordinate * 2.0 - 1.0;
  if (face == 0) return normalize(vec3(1.0, -coordinate.y, -coordinate.x));
  if (face == 1) return normalize(vec3(-1.0, -coordinate.y, coordinate.x));
  if (face == 2) return normalize(vec3(coordinate.x, 1.0, coordinate.y));
  if (face == 3) return normalize(vec3(coordinate.x, -1.0, -coordinate.y));
  if (face == 4) return normalize(vec3(coordinate.x, -coordinate.y, 1.0));
  return normalize(vec3(-coordinate.x, -coordinate.y, -1.0));
}

mat3 getEnvironmentTangentBasis(vec3 normal)
{
  vec3 up = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, normal));
  return mat3(tangent, cross(normal, tangent), normal);
}

vec3 sampleEnvironmentDirection(vec3 direction)
{
  vec3 normalizedDirection = normalize(direction);
  vec2 textureCoordinate = vec2(
    atan(normalizedDirection.z, normalizedDirection.x) / (2.0 * ENVIRONMENT_PI) + 0.5,
    acos(clamp(normalizedDirection.y, -1.0, 1.0)) / ENVIRONMENT_PI
  );
  vec3 color = texture(pbrEnvironmentSource, textureCoordinate).rgb;
  if (pbrEnvironmentFilter.sourceEncoding == 1) {
    vec3 lower = color / 12.92;
    vec3 upper = pow((color + 0.055) / 1.055, vec3(2.4));
    color = mix(lower, upper, step(vec3(0.04045), color));
  }
  return color;
}

vec3 importanceSampleEnvironment(vec2 sequence, vec3 normal, float roughness)
{
  float alpha = max(roughness * roughness, 0.0001);
  float azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
  float cosine = sqrt(
    (1.0 - sequence.y) / max(1.0 + (alpha * alpha - 1.0) * sequence.y, 0.0001)
  );
  float sine = sqrt(max(1.0 - cosine * cosine, 0.0));
  vec3 halfVector = vec3(cos(azimuth) * sine, sin(azimuth) * sine, cosine);
  return normalize(getEnvironmentTangentBasis(normal) * halfVector);
}

float getEnvironmentGeometry(float normalDotDirection, float roughness)
{
  float alpha = roughness * roughness;
  float factor = alpha * 0.5;
  return normalDotDirection / max(normalDotDirection * (1.0 - factor) + factor, 0.0001);
}

vec2 integrateEnvironmentBRDF(vec2 textureCoordinate, int sampleCount)
{
  float normalDotView = max(textureCoordinate.x, 0.001);
  float roughness = 1.0 - textureCoordinate.y;
  vec3 viewDirection = vec3(sqrt(max(1.0 - normalDotView * normalDotView, 0.0)), 0.0, normalDotView);
  vec2 integration = vec2(0.0);

  for (int sampleIndex = 0; sampleIndex < 1024; sampleIndex++) {
    if (sampleIndex >= sampleCount) break;
    vec3 halfVector = importanceSampleEnvironment(
      getEnvironmentHammersley(uint(sampleIndex), uint(sampleCount)),
      vec3(0.0, 0.0, 1.0),
      roughness
    );
    vec3 lightDirection = normalize(2.0 * dot(viewDirection, halfVector) * halfVector - viewDirection);
    float normalDotLight = max(lightDirection.z, 0.0);
    float normalDotHalf = max(halfVector.z, 0.0);
    float viewDotHalf = max(dot(viewDirection, halfVector), 0.0);
    if (normalDotLight > 0.0) {
      float visibility = getEnvironmentGeometry(normalDotView, roughness) *
        getEnvironmentGeometry(normalDotLight, roughness) * viewDotHalf /
        max(normalDotHalf * normalDotView, 0.0001);
      float fresnel = pow(1.0 - viewDotHalf, 5.0);
      integration += vec2(1.0 - fresnel, fresnel) * visibility;
    }
  }
  return integration / float(sampleCount);
}

vec3 integrateEnvironmentDirection(vec3 normal, int sampleCount)
{
  vec3 accumulatedColor = vec3(0.0);
  float accumulatedWeight = 0.0;

  for (int sampleIndex = 0; sampleIndex < 1024; sampleIndex++) {
    if (sampleIndex >= sampleCount) break;
    vec2 sequence = getEnvironmentHammersley(uint(sampleIndex), uint(sampleCount));
    vec3 direction;
    float sampleWeight;

    if (pbrEnvironmentFilter.mode == 1) {
      float azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
      float cosine = sqrt(1.0 - sequence.y);
      float sine = sqrt(sequence.y);
      direction = normalize(
        getEnvironmentTangentBasis(normal) *
        vec3(cos(azimuth) * sine, sin(azimuth) * sine, cosine)
      );
      sampleWeight = 1.0;
    } else {
      vec3 halfVector = importanceSampleEnvironment(sequence, normal, pbrEnvironmentFilter.roughness);
      direction = normalize(2.0 * dot(normal, halfVector) * halfVector - normal);
      sampleWeight = max(dot(normal, direction), 0.0);
    }

    accumulatedColor += sampleEnvironmentDirection(direction) * sampleWeight;
    accumulatedWeight += sampleWeight;
  }

  return accumulatedColor / max(accumulatedWeight, 0.0001);
}

void main(void)
{
  int sampleCount = max(pbrEnvironmentFilter.sampleCount, 1);
  if (pbrEnvironmentFilter.mode == 2) {
    fragmentColor = vec4(integrateEnvironmentBRDF(uv, sampleCount), 0.0, 1.0);
    return;
  }

  vec3 direction = getEnvironmentFaceDirection(pbrEnvironmentFilter.face, uv);
  fragmentColor = vec4(integrateEnvironmentDirection(direction, sampleCount), 1.0);
}
`,k=`const ENVIRONMENT_PI: f32 = 3.141592653589793;

fn getEnvironmentHammersley(index: u32, sampleCount: u32) -> vec2f {
  return vec2f(f32(index) / f32(sampleCount), f32(reverseBits(index)) * 2.3283064365386963e-10);
}

fn getEnvironmentFaceDirection(face: i32, textureCoordinate: vec2f) -> vec3f {
  let coordinate = textureCoordinate * 2.0 - 1.0;
  if (face == 0) { return normalize(vec3f(1.0, -coordinate.y, -coordinate.x)); }
  if (face == 1) { return normalize(vec3f(-1.0, -coordinate.y, coordinate.x)); }
  if (face == 2) { return normalize(vec3f(coordinate.x, 1.0, coordinate.y)); }
  if (face == 3) { return normalize(vec3f(coordinate.x, -1.0, -coordinate.y)); }
  if (face == 4) { return normalize(vec3f(coordinate.x, -coordinate.y, 1.0)); }
  return normalize(vec3f(-coordinate.x, -coordinate.y, -1.0));
}

fn getEnvironmentTangentBasis(normal: vec3f) -> mat3x3f {
  var up = vec3f(1.0, 0.0, 0.0);
  if (abs(normal.z) < 0.999) {
    up = vec3f(0.0, 0.0, 1.0);
  }
  let tangent = normalize(cross(up, normal));
  return mat3x3f(tangent, cross(normal, tangent), normal);
}

fn sampleEnvironmentDirection(direction: vec3f) -> vec3f {
  let normalizedDirection = normalize(direction);
#ifdef PBR_ENVIRONMENT_CUBE_SOURCE
  var color = textureSampleLevel(pbrEnvironmentSource, pbrEnvironmentSourceSampler, normalizedDirection, 0.0).rgb;
#else
  let textureCoordinate = vec2f(
    atan2(normalizedDirection.z, normalizedDirection.x) / (2.0 * ENVIRONMENT_PI) + 0.5,
    acos(clamp(normalizedDirection.y, -1.0, 1.0)) / ENVIRONMENT_PI
  );
  var color = textureSampleLevel(
    pbrEnvironmentSource,
    pbrEnvironmentSourceSampler,
    textureCoordinate,
    0.0
  ).rgb;
#endif
  if (pbrEnvironmentFilter.sourceEncoding == 1) {
    let lower = color / 12.92;
    let upper = pow((color + 0.055) / 1.055, vec3f(2.4));
    color = mix(lower, upper, step(vec3f(0.04045), color));
  }
  return color;
}

fn importanceSampleEnvironment(sequence: vec2f, normal: vec3f, roughness: f32) -> vec3f {
  let alpha = max(roughness * roughness, 0.0001);
  let azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
  let cosine = sqrt(
    (1.0 - sequence.y) / max(1.0 + (alpha * alpha - 1.0) * sequence.y, 0.0001)
  );
  let sine = sqrt(max(1.0 - cosine * cosine, 0.0));
  let halfVector = vec3f(cos(azimuth) * sine, sin(azimuth) * sine, cosine);
  return normalize(getEnvironmentTangentBasis(normal) * halfVector);
}

fn getEnvironmentGeometry(normalDotDirection: f32, roughness: f32) -> f32 {
  let alpha = roughness * roughness;
  let factor = alpha * 0.5;
  return normalDotDirection / max(normalDotDirection * (1.0 - factor) + factor, 0.0001);
}

fn integrateEnvironmentBRDF(textureCoordinate: vec2f, sampleCount: u32) -> vec2f {
  let normalDotView = max(textureCoordinate.x, 0.001);
  let roughness = 1.0 - textureCoordinate.y;
  let viewDirection = vec3f(
    sqrt(max(1.0 - normalDotView * normalDotView, 0.0)),
    0.0,
    normalDotView
  );
  var integration = vec2f(0.0);

  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let halfVector = importanceSampleEnvironment(
      getEnvironmentHammersley(sampleIndex, sampleCount),
      vec3f(0.0, 0.0, 1.0),
      roughness
    );
    let lightDirection = normalize(
      2.0 * dot(viewDirection, halfVector) * halfVector - viewDirection
    );
    let normalDotLight = max(lightDirection.z, 0.0);
    let normalDotHalf = max(halfVector.z, 0.0);
    let viewDotHalf = max(dot(viewDirection, halfVector), 0.0);
    if (normalDotLight > 0.0) {
      let visibility = getEnvironmentGeometry(normalDotView, roughness) *
        getEnvironmentGeometry(normalDotLight, roughness) * viewDotHalf /
        max(normalDotHalf * normalDotView, 0.0001);
      let fresnel = pow(1.0 - viewDotHalf, 5.0);
      integration += vec2f(1.0 - fresnel, fresnel) * visibility;
    }
  }
  return integration / f32(sampleCount);
}

fn integrateEnvironmentDirection(normal: vec3f, sampleCount: u32) -> vec3f {
  var accumulatedColor = vec3f(0.0);
  var accumulatedWeight = 0.0;

  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let sequence = getEnvironmentHammersley(sampleIndex, sampleCount);
    var direction: vec3f;
    var sampleWeight: f32;

    if (pbrEnvironmentFilter.mode == 1) {
      let azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
      let cosine = sqrt(1.0 - sequence.y);
      let sine = sqrt(sequence.y);
      direction = normalize(
        getEnvironmentTangentBasis(normal) *
        vec3f(cos(azimuth) * sine, sin(azimuth) * sine, cosine)
      );
      sampleWeight = 1.0;
    } else {
      let halfVector = importanceSampleEnvironment(sequence, normal, pbrEnvironmentFilter.roughness);
      direction = normalize(2.0 * dot(normal, halfVector) * halfVector - normal);
      sampleWeight = max(dot(normal, direction), 0.0);
    }

    accumulatedColor += sampleEnvironmentDirection(direction) * sampleWeight;
    accumulatedWeight += sampleWeight;
  }
  return accumulatedColor / max(accumulatedWeight, 0.0001);
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  // ClipSpace UVs increase upward; WebGPU texture rows increase downward.
  let textureCoordinate = vec2f(inputs.uv.x, 1.0 - inputs.uv.y);
  let sampleCount = u32(max(pbrEnvironmentFilter.sampleCount, 1));
  if (pbrEnvironmentFilter.mode == 2) {
    return vec4f(integrateEnvironmentBRDF(textureCoordinate, sampleCount), 0.0, 1.0);
  }

  let direction = getEnvironmentFaceDirection(pbrEnvironmentFilter.face, textureCoordinate);
  return vec4f(integrateEnvironmentDirection(direction, sampleCount), 1.0);
}
`,A=`struct VertexInputs {
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
`,j=`#version 300 es
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
`,ae=[-1,-1,1,-1,-1,1,1,1],M=[-1,-1,3,-1,-1,3],N=class extends a{constructor(t,n){let{geometryType:r=`quad`,...a}=n,o=r===`triangle`?M:ae,s=o.map(e=>(e+1)/2),c=o.length/2;a.source&&=`${A}\n${a.source}`,super(t,{id:a.id||e(`clip-space`),...a,vs:j,vertexCount:c,geometry:new i({topology:r===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:c,attributes:{clipSpacePositions:{size:2,value:new Float32Array(o)},texCoords:{size:2,value:new Float32Array(s)},coordinates:{size:2,value:new Float32Array(s)}}})})}};function P(e){let{diffuseTexture:t,specularTexture:n,brdfLUTTexture:r}=e;return x(!t.destroyed&&!n.destroyed&&!r.destroyed&&t.device===n.device&&t.device===r.device&&t.dimension===`cube`&&n.dimension===`cube`&&r.dimension===`2d`),{pbr_diffuseEnvSampler:t,pbr_specularEnvSampler:n,pbr_brdfLUT:r}}var F=class{textures;ownsBrdfLUTTexture;destroyed=!1;constructor(e,t=!0){this.textures=e,this.ownsBrdfLUTTexture=t}getBindings(){return P(this.textures)}destroy(){this.destroyed||(this.destroyed=!0,this.textures.diffuseTexture.destroy(),this.textures.specularTexture.destroy(),this.ownsBrdfLUTTexture&&this.textures.brdfLUTTexture.destroy())}},oe=class{device;model;modelFormat;constructor(e){this.device=e}prepare(e){x(e.source.dimension===`2d`&&e.source.device===this.device&&!e.source.destroyed);let t=Math.max(1,Math.floor(e.size??64)),n=Math.max(1,Math.floor(e.irradianceSize??16)),r=Math.max(1,Math.floor(e.brdfLUTSize??128)),i=Math.max(1,Math.min(Math.floor(e.sampleCount??64),1024)),a=e.format??`rgba16float`,o=this.device.getTextureFormatCapabilities(a);x(o.render&&o.filter&&!a.endsWith(`-srgb`)),e.brdfLUTTexture&&x(e.brdfLUTTexture.device===this.device&&!e.brdfLUTTexture.destroyed&&e.brdfLUTTexture.dimension===`2d`);let s=this.device.getMipLevelCount(t,t),c=[],l=[],u=[],d=e=>{let t=I(this.device,e);return c.push(t),t};try{let o=d({id:`pbr-environment-specular`,dimension:`cube`,size:t,mipLevels:s,format:a}),c=d({id:`pbr-environment-diffuse`,dimension:`cube`,size:n,mipLevels:1,format:a}),f=e.brdfLUTTexture??d({id:`pbr-environment-brdf-lut`,dimension:`2d`,size:r,mipLevels:1,format:a}),p=this.getFilterModel(a),m=+(e.sourceEncoding===`srgb`&&!e.source.format.endsWith(`-srgb`));for(let n=0;n<s;n++){let r=Math.max(1,t>>n),a=s>1?n/(s-1):0;for(let t=0;t<6;t++)this.drawEnvironmentView({texture:o,size:r,mipLevel:n,face:t,roughness:a,mode:0,source:e.source,sourceEncoding:m,sampleCount:i,model:p,framebuffers:l,views:u})}for(let t=0;t<6;t++)this.drawEnvironmentView({texture:c,size:n,mipLevel:0,face:t,roughness:1,mode:1,source:e.source,sourceEncoding:m,sampleCount:i,model:p,framebuffers:l,views:u});return e.brdfLUTTexture||this.drawEnvironmentView({texture:f,size:r,mipLevel:0,face:0,roughness:0,mode:2,source:e.source,sourceEncoding:m,sampleCount:i,model:p,framebuffers:l,views:u}),this.device.submit(),new F({diffuseTexture:c,specularTexture:o,brdfLUTTexture:f},!e.brdfLUTTexture)}catch(e){for(let e of c)e.destroy();throw e}finally{for(let e of l)e.destroy();for(let e of u)e.destroy()}}destroy(){this.model?.destroy(),this.model=void 0,this.modelFormat=void 0}getFilterModel(e){return this.model&&this.modelFormat!==e&&(this.model.destroy(),this.model=void 0),this.model||(this.model=new N(this.device,{id:`pbr-environment-integration-model`,fs:O,source:k,modules:[D],shaderInputs:new f({pbrEnvironmentFilter:D}),colorAttachmentFormats:[e],parameters:{depthWriteEnabled:!1}}),this.modelFormat=e),this.model}drawEnvironmentView(e){let t=e.texture.createView({id:`${e.texture.id}-${e.face}-${e.mipLevel}`,dimension:`2d`,baseMipLevel:e.mipLevel,mipLevelCount:1,baseArrayLayer:e.face,arrayLayerCount:1});e.views.push(t);let n=this.device.createFramebuffer({id:`${t.id}-framebuffer`,width:e.size,height:e.size,colorAttachments:[t],depthStencilAttachment:null});e.framebuffers.push(n),e.model.shaderInputs.setProps({pbrEnvironmentFilter:{face:e.face,roughness:e.roughness,mode:e.mode,sampleCount:e.sampleCount,sourceEncoding:e.sourceEncoding,pbrEnvironmentSource:e.source}}),e.model.predraw(this.device.commandEncoder);let r=this.device.beginRenderPass({id:`${t.id}-integration`,framebuffer:n,clearColor:[0,0,0,1],clearDepth:!1});try{e.model.draw(r)}finally{r.end()}}};function I(e,t){return e.createTexture({id:t.id,dimension:t.dimension,width:t.size,height:t.size,depth:t.dimension===`cube`?6:1,mipLevels:t.mipLevels,format:t.format,usage:b.SAMPLE|b.RENDER|b.COPY_SRC,sampler:{minFilter:`linear`,magFilter:`linear`,mipmapFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}})}var L=[{direction:[1,0,0],up:[0,-1,0]},{direction:[-1,0,0],up:[0,-1,0]},{direction:[0,1,0],up:[0,0,1]},{direction:[0,-1,0],up:[0,0,-1]},{direction:[0,0,1],up:[0,-1,0]},{direction:[0,0,-1],up:[0,-1,0]}],se=class{device;origin;matrixSnapshot;capture;depth;targets;views=[];framebuffers=[];captureTargets=[];filterTargets=[];filter;size;sampleCount;activeSampleCount;budget;maximumFaces;sameFrame;projectionMatrix=new r([1,0,0,0,0,-1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(new r().perspective({fovy:Math.PI/2,aspect:1,near:.05,far:100}));pendingFaces=new Set;captureCount=0;filteredCount=0;front;back=0;credit=0;pausedFrames=0;destroyed=!1;constructor(e,t={}){x(e.type===`webgpu`),this.device=e,this.size=t.size??32,this.sampleCount=t.sampleCount??16,this.activeSampleCount=this.sampleCount,this.budget=t.frameBudgetMilliseconds??1e3/60,this.maximumFaces=t.maximumFacesPerFrame??2,this.sameFrame=t.refreshMode===`same-frame`,x(Number.isInteger(this.size)&&this.size>0&&this.size<=e.limits.maxTextureDimension2D),x(Number.isInteger(this.sampleCount)&&this.sampleCount>0&&this.sampleCount<=1024),x(Number.isFinite(this.budget)&&this.budget>0),x(Number.isInteger(this.maximumFaces)&&this.maximumFaces>0&&this.maximumFaces<=6);let n=e.getTextureFormatCapabilities(`rgba16float`);x(n.render&&n.filter);let r=t.mipLevels??4;x(Number.isSafeInteger(r)&&r>0);let i=Math.min(r,e.getMipLevelCount(this.size,this.size));this.origin=e.createBuffer({byteLength:16,usage:S.STORAGE|S.COPY_DST}),this.capture=this.createCube(`reflection-capture`,1),this.targets=[this.createCube(`reflection-filter-a`,i),this.createCube(`reflection-filter-b`,i)],this.depth=e.createTexture({width:this.size,height:this.size,format:`depth24plus`,usage:b.RENDER});for(let e=0;e<L.length;e++)this.captureTargets.push(this.createTarget(this.capture,e,0,this.depth));for(let e of this.targets)this.filterTargets.push(L.map((t,n)=>Array.from({length:i-1},(t,r)=>this.createTarget(e,n,r+1))));this.filter=new N(e,{id:`reflection-probe-filter`,source:k,defines:{PBR_ENVIRONMENT_CUBE_SOURCE:!0},modules:[D],shaderInputs:new f({pbrEnvironmentFilter:D}),colorAttachmentFormats:[`rgba16float`],parameters:{depthWriteEnabled:!1}})}get texture(){return this.front===void 0?void 0:this.targets[this.front]}update(e){if(x(!this.destroyed),x(e.matrices.device===this.device&&e.matrices.usage&S.COPY_SRC),x(Number.isSafeInteger(e.matrixIndex)&&e.matrixIndex>=0&&(e.matrixIndex+1)*64<=e.matrices.byteLength),e.refresh===!1&&this.front!==void 0&&this.captureCount===0)return 0;this.matrixSnapshot?.byteLength!==e.matrices.byteLength&&(this.matrixSnapshot?.destroy(),this.matrixSnapshot=this.device.createBuffer({byteLength:e.matrices.byteLength,usage:S.STORAGE|S.COPY_DST|S.COPY_SRC}),this.captureCount=0,this.filteredCount=0,this.pendingFaces.clear());let t=e.frameMilliseconds,n=t!==void 0&&Number.isFinite(t)?Math.max(0,Math.min(this.budget,this.budget-t)):this.budget/4,i;if(this.sameFrame)t!==void 0&&Number.isFinite(t)&&(t>this.budget?this.activeSampleCount=Math.max(Math.min(4,this.sampleCount),Math.floor(this.activeSampleCount/2)):n>=this.budget/4&&(this.activeSampleCount=Math.min(this.sampleCount,this.activeSampleCount+1))),i=L.length*2;else{if(this.credit=Math.min(this.maximumFaces,this.credit+n),i=Math.floor(this.credit),i===0&&++this.pausedFrames>=3&&(i=1),i===0)return 0;this.credit=Math.max(0,this.credit-i)}if(this.pausedFrames=0,this.captureCount===0&&this.filteredCount===0){this.device.commandEncoder.copyBufferToBuffer({sourceBuffer:e.matrices,destinationBuffer:this.matrixSnapshot,size:e.matrices.byteLength}),this.device.commandEncoder.copyBufferToBuffer({sourceBuffer:this.matrixSnapshot,sourceOffset:e.matrixIndex*64+48,destinationBuffer:this.origin,size:16});for(let e=0;e<L.length;e++)this.pendingFaces.add(e)}let a=0;for(;a<i&&this.captureCount<L.length;){let t=this.nextFace(e.viewDirections??[]),{direction:n,up:i}=L[t];e.draw({face:t,framebuffer:this.captureTargets[t],viewMatrix:new r().lookAt({eye:[0,0,0],center:n,up:i}),projectionMatrix:this.projectionMatrix,matrices:this.matrixSnapshot,origin:this.origin}),this.pendingFaces.delete(t),this.captureCount++,a++}for(;a<i&&this.filteredCount<L.length;)this.filterFace(this.filteredCount),this.filteredCount++,a++;return this.filteredCount===L.length&&(this.front=this.back,this.back=1-this.back,this.captureCount=0,this.filteredCount=0),a}destroy(){if(!this.destroyed){this.destroyed=!0,this.filter.destroy();for(let e of this.framebuffers)e.destroy();for(let e of this.views)e.destroy();for(let e of this.targets)e.destroy();this.capture.destroy(),this.depth.destroy(),this.origin.destroy(),this.matrixSnapshot?.destroy()}}nextFace(e){let t=-1,n=-1/0;for(let r of this.pendingFaces){let i=L[r].direction,a=e.length?Math.max(...e.map(e=>{let t=Math.hypot(...e);return t>0?(i[0]*e[0]+i[1]*e[1]+i[2]*e[2])/t:0})):0;a>n&&(n=a,t=r)}return t}createCube(e,t){return this.device.createTexture({id:e,dimension:`cube`,width:this.size,height:this.size,depth:6,format:`rgba16float`,mipLevels:t,usage:b.RENDER|b.SAMPLE|b.COPY_SRC|b.COPY_DST,sampler:{minFilter:`linear`,magFilter:`linear`,mipmapFilter:`linear`}})}createTarget(e,t,n,r=null){let i=e.createView({dimension:`2d`,baseArrayLayer:t,arrayLayerCount:1,baseMipLevel:n,mipLevelCount:1});this.views.push(i);let a=Math.max(1,this.size>>n),o=this.device.createFramebuffer({width:a,height:a,colorAttachments:[i],depthStencilAttachment:r});return this.framebuffers.push(o),o}filterFace(e){let t=this.filterTargets[this.back][e];this.device.commandEncoder.copyTextureToTexture({sourceTexture:this.capture,destinationTexture:this.targets[this.back],origin:[0,0,e],destinationOrigin:[0,0,e],width:this.size,height:this.size,depthOrArrayLayers:1});for(let[n,r]of t.entries()){let i=n+1;this.filter.shaderInputs.setProps({pbrEnvironmentFilter:{face:e,roughness:i/t.length,mode:0,sampleCount:this.activeSampleCount,sourceEncoding:0,pbrEnvironmentSource:this.capture}}),this.filter.predraw(this.device.commandEncoder);let a=this.device.beginRenderPass({framebuffer:r,clearColor:[0,0,0,1],clearDepth:!1});try{this.filter.draw(a)}finally{a.end()}}}},R=class extends F{diffuseTexture;specularTexture;brdfLUTTexture;intensity;rotation;constructor(e){super(e),this.diffuseTexture=e.diffuseTexture,this.specularTexture=e.specularTexture,this.brdfLUTTexture=e.brdfLUTTexture,this.intensity=e.intensity??1,this.rotation=e.rotation??0}},z=class{device;generator;constructor(e){this.device=e,this.generator=new oe(e)}prepare(e){let t=this.device.getTextureFormatCapabilities(`rgba16float`),n=e.format??(t.render&&t.filter?`rgba16float`:`rgba8unorm`);return new R({...this.generator.prepare({...e,format:n}).textures,intensity:e.intensity,rotation:e.rotation})}destroy(){this.generator.destroy()}},ce=1/60,le={timeStep:ce,iterations:16,maximumPairs:2048,linearDamping:.04,angularDamping:.08,maximumRecoverySpeed:.5},B=[0,0,12],V=-.95;function ue(){let e=[{position:[0,0,-.5],mass:0,shape:{type:`box`,halfExtents:[18,12,.5]}},{position:B,mass:0,shape:{type:`box`,halfExtents:[.18,.18,.18]}},{position:[B[0]+10*Math.sin(V),0,B[2]-10*Math.cos(V)],mass:650,shape:{type:`sphere`,radius:1.1},friction:.45,restitution:.05},...[-5.5,5.5].map(e=>({position:[0,e,6],mass:0,shape:{type:`box`,halfExtents:[.2,.2,6]}})),{position:[0,0,12.2],mass:0,shape:{type:`box`,halfExtents:[.25,5.7,.25]}}];for(let t=0;t<8;t++){let n=8-t;for(let r=0;r<n;r++)for(let i=0;i<n;i++)e.push({position:[(i-(n-1)/2)*1.01,(r-(n-1)/2)*1.01,t+.5],mass:1,shape:{type:`box`,halfExtents:[.49,.49,.5]},friction:.65,restitution:0})}return{bodies:e,joints:[{type:`distance`,first:1,second:2,distance:10}]}}var de={name:`rigidBodyPose`,uniformTypes:{matrix:`mat4x4<f32>`},source:`
struct RigidBodyPose {matrix:mat4x4f}
@group(0) @binding(auto) var<uniform> rigidBodyPose:RigidBodyPose;
@group(0) @binding(auto) var<storage,read> positions:array<vec4f>;
@group(0) @binding(auto) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(auto) var<storage,read> shapes:array<vec4f>;
@group(0) @binding(auto) var<storage,read> sleepStates:array<vec4f>;
@group(0) @binding(auto) var<storage,read> meshVertices:array<vec4f>;
`,bindingLayout:[`positions`,`orientations`,`shapes`,`sleepStates`,`meshVertices`].map(e=>({name:e,group:0}))};function fe(e,t,n,r,i=!1){return`
struct Output {@builtin(position) position: vec4f, @location(0) normal: vec3f, @location(1) color: vec3f, @location(2) localNormal: vec3f, @location(3) @interpolate(flat) sphere: f32, @location(4) worldPosition: vec3f, @location(5) @interpolate(flat) body: u32, @location(6) localPoint:vec3f}
fn rotate(rotation: vec4f, vector: vec3f)->vec3f {return vector+2.0*cross(rotation.xyz,cross(rotation.xyz,vector)+rotation.w*vector);}
${e===`wreckingBall`?`
// Pack box triangles and the single sphere into one draw; no collapsed sphere vertices per box.
@vertex fn vertexMain(@builtin(vertex_index) renderVertex:u32)->Output {
 let sphere=renderVertex>=${(t-(i?2:1))*36}u;
 let box=renderVertex/36u+${+!!i}u;
 let body=select(box+select(0u,1u,box>=2u),2u,sphere);
 let vertex=select(renderVertex%36u,renderVertex-${(t-(i?2:1))*36}u,sphere);
`:`@vertex fn vertexMain(@builtin(vertex_index) vertex: u32,@builtin(instance_index) body: u32)->Output {`}
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];var point=vec3f(0);var normal=vec3f(0);
 if(shapes[body].w==3.0) {
  if(vertex<u32(shapes[body].y)) {
   let first=u32(shapes[body].x)+(vertex/3u)*3u;
   point=meshVertices[u32(shapes[body].x)+vertex].xyz;
   normal=normalize(cross(meshVertices[first+1u].xyz-meshVertices[first].xyz,meshVertices[first+2u].xyz-meshVertices[first].xyz));
  } else {normal=vec3f(0,0,1);}
 } else if(shapes[body].w==0.0) {
  let tile=vertex/6u;let longitude=(f32(tile%${n}u)+corner.x)*6.2831853/${n}.0;let latitude=(f32(tile/${n}u)+corner.y)*3.14159265/${r}.0;
  normal=vec3f(cos(longitude)*sin(latitude),sin(longitude)*sin(latitude),cos(latitude));point=normal*shapes[body].x;
 } else {
  let face=(vertex/6u)%6u;let axis=face/2u;let direction=select(-1.0,1.0,face%2u==0u);normal[axis]=direction;point[axis]=direction;
  point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;point*=shapes[body].xyz;
  // Remaining sphere tessellation vertices collapse for boxes.
  if(vertex>=36u) {point=vec3f(0);}
 }
 var output:Output;output.localPoint=point;output.worldPosition=positions[body].xyz+rotate(orientations[body],point);output.body=body;
 output.position=rigidBodyPose.matrix*vec4f(output.worldPosition,1);
 output.localNormal=normal;output.sphere=1.0-shapes[body].w;output.normal=rotate(orientations[body],normal);output.color=select(vec3f(0.28+0.45*fract(f32(body)*0.27),0.48+0.25*fract(f32(body)*0.39),0.42+0.25*fract(f32(body)*0.17)),vec3f(0.68,0.73,0.67),(shapes[body].w==2.0||(shapes[body].w==3.0&&shapes[body].z>0.5)));output.color=mix(output.color,vec3f(0.55),select(0.0,0.7,sleepStates[body].y>0.5));return output;
}
`}var H={type:`spot`,position:[-8,-12,32],direction:[8,12,-32],color:[255,230,194],intensity:24,attenuation:[1,0,.004],innerConeAngle:.38,outerConeAngle:.48},pe=class{renderer;caster;constructor(e,t,n,r){this.renderer=new u(e,{quality:`balanced`,directionalLightCapacity:0,spotLightCapacity:1,pointLightCapacity:0,spotMapSize:2048}),this.caster=new a(e,{id:`rigid-body-shadow-casters`,modules:[de],source:n+`
@fragment fn fragmentMain(){}`,...r,colorAttachmentFormats:[],depthStencilAttachmentFormat:`depth32float`,parameters:{depthWriteEnabled:!0,depthCompare:`less-equal`,cullMode:`none`},bindings:t})}render(e,t){return this.renderer.render({camera:{viewMatrix:e,projectionMatrix:t,near:.1,far:200,clipDepth:`zero-to-one`},spotLights:[{position:H.position,direction:H.direction,outerConeAngle:H.outerConeAngle,range:80,normalBias:.008,sourceRadius:.025,depthBias:2,depthBiasSlopeScale:2}],drawShadowCasters:e=>{this.caster.shaderInputs.setProps({rigidBodyPose:{matrix:e.viewProjectionMatrix}}),this.caster.setParameters({...e.rasterParameters,cullMode:`none`}),this.caster.draw(e.renderPass)}})}destroy(){this.caster.destroy(),this.renderer.destroy()}},me={robotArm:{title:`Mechanisms · robot arm`,description:`Four driven joints carry a calibrated payload. Lower the elbow to press the tool against the work stop, or reduce the elbow torque to see the load pull it down.`},wreckingBall:{title:`Wrecking ball`,description:`Release a 650-unit steel wrecking ball into a stepped pyramid of 204 one-unit blocks. A ten-unit distance joint suspends the ball from the gantry; gravity and real contacts drive the demolition. Pause to inspect the impact, or Reset to rebuild the pyramid and raise the ball. Drag to orbit and scroll to zoom. Parallel block contacts alternate with a distance-joint solve on the GPU; the real-time percentage shows when simulation cannot keep pace.`},dominoJunction:{title:`Domino junction`,description:`One falling row starts two branches. Both paths converge on a shared receiver that tips the final row. Reset to replay the same physical contacts.`},dominoSpiral:{title:`Spiral dominoes`,description:`A single nudge tips the innermost domino. Real box contacts carry the falling wave outward along three turns of an Archimedean spiral. Every domino is a free rigid body; no timed animation or scripted impulses drive the sequence. Reset rebuilds the upright spiral and replays the first nudge without changing your camera.`},suspension:{title:`Mechanisms · spring suspension`,description:`A suspended platform uses an implicit damped spring. It compresses under gravity and settles; push it to test damping and connected-island waking.`},servo:{title:`Mechanisms · position-driven hinge`,description:`A hinge tracks a 0.8-radian target with a compliant position drive and capped torque. Push the arm to disturb it; the drive returns it to its target within the authored limits.`},cradle:{title:`Mechanisms · Newton's cradle`,description:`Five equal-mass spheres hang from distance constraints. The raised end ball transfers momentum through nearly touching, polished balls with slightly inelastic impacts. Reset releases it again. This scene uses 480 Hz substeps and low-speed contact settling to resolve closely spaced impacts. Gentle velocity damping models air and suspension losses. The stone frame has matching static colliders, so pushed balls rebound from it. The scene restarts after one simulated minute.`},pendulum:{title:`Mechanisms · pendulum`,description:`A distance constraint suspends a sphere. Joint rows share the ordered contact solver. This first joint envelope keeps connected bodies awake and does not warm-start joints.`},hinge:{title:`Mechanisms · motorized hinge`,description:`A hinged bar has angular limits and a torque-capped velocity motor. It can interact with the loose box. The hinge axis is the attachment frame Z axis; angular limits use wrapped radians.`},slider:{title:`Mechanisms · powered slider`,description:`A motor pushes a constrained carriage toward its linear stop and into a loose box. Translation is free only along the attachment Z axis; orientation is locked. Motor force is capped per step, independently of solver iteration count.`},continuous:{title:`Fast sphere / thin walls`,description:`A fast sphere crosses many wall thicknesses each step. Bounded sphere/static-surface CCD catches the walls and restitutes the remaining motion. Failed CCD steps roll back on the GPU. This qualifies translational spheres against static surfaces, not general rotating or dynamic-pair CCD.`},mesh:{title:`Mesh openings`,description:`Two moving triangle-mesh cubes fall toward an original triangle-mesh frame. One passes through the opening and lands on the floor; the other lands on the frame. Collision uses the original triangles, not a convex hull of the frame. This is discrete surface contact: high-speed tunneling and initially contained meshes still require separate handling.`},deep:{title:`Deep stack`,description:`Eight boxes form one connected stack. Compare drift, penetration and settling between solvers and iteration counts. This is a stability fixture, not a universal supported stack-depth guarantee.`},massRatio:{title:`Heavy-on-light stack`,description:`A box ten times heavier than its supports loads a four-box stack. This exposes convergence limits; compare ordered and parallel solving at 16, 32 and 64 iterations.`},support:{title:`Moving support`,description:`A kinematic platform moves at 0.5 units per second. Contact friction carries the boxes; the platform receives no impulses and must keep supported islands awake.`},friction:{title:`Static friction`,description:`Gravity has a horizontal component. Static friction 0.8 can hold the box, while dynamic friction is only 0.1. The solver tests the required accumulated impulse against the static cone rather than switching at an arbitrary slip speed.`},stack:{title:`Independent stacks`,description:`Three five-box stacks share a static floor. Each stack can sleep independently. Push the first stack to test waking and friction; gray bodies are sleeping.`},mixed:{title:`Mixed-shape field`,description:`256 boxes and spheres with varied sizes land on one large floor. This exercises hierarchical discovery and sparse contact storage beyond the 128-body all-pairs reference limit. It is a moderate-density scene, not a dense-stack performance claim.`},impact:{title:`Unequal-mass impact`,description:`A unit-mass sphere strikes a stationary sphere of mass two without gravity or friction. At restitution one, the light sphere reverses direction. The colored bands expose rotation. Reset to replay.`},torque:{title:`Off-center impact`,description:`A sphere strikes a heavier box away from its center. Contact impulses transfer both linear momentum and angular momentum. Reset or push the box to explore rotation.`}};function he(e){if(e===`dominoJunction`)return W();if(e===`dominoSpiral`)return ye();if(e===`continuous`)return[{position:[-3,0,1],velocity:[180,0,0],shape:{type:`sphere`,radius:.2},restitution:1,friction:0},{position:[-5,0,1],mode:`static`,shape:{type:`box`,halfExtents:[.03,2,2]},restitution:1},{position:[5,0,1],mode:`static`,shape:{type:`box`,halfExtents:[.03,2,2]},restitution:1}];if(e===`mesh`){let e=C(Array.from({length:8},(e,t)=>[t&1?.25:-.25,t&2?.25:-.25,t&4?.25:-.25]).flat()),t=[],n=[];for(let[e,r]of[[[-1.5,0,0],[.5,2,.25]],[[1.5,0,0],[.5,2,.25]],[[0,-1.5,0],[1,.5,.25]],[[0,1.5,0],[1,.5,.25]]]){let i=C(Array.from({length:8},(t,n)=>e.map((e,t)=>e+(n&1<<t?1:-1)*r[t])).flat()),a=t.length/3;t.push(...i.positions),n.push(...i.indices.map(e=>a+e))}return[{position:[0,0,-.5],mass:0,shape:{type:`box`,halfExtents:[7,7,.5]},restitution:0},{position:[0,0,3],mass:0,shape:{type:`triangle-mesh`,geometry:w(t,n)},restitution:0},{position:[0,0,5],shape:{type:`triangle-mesh`,geometry:e},restitution:0},{position:[1.5,0,5],shape:{type:`triangle-mesh`,geometry:e},restitution:0}]}if(e===`impact`)return[{shape:{type:`sphere`,radius:.5},position:[-2,0,1],velocity:[3,0,0],mass:1,restitution:1,friction:0},{shape:{type:`sphere`,radius:.5},position:[0,0,1],mass:2,restitution:1,friction:0}];let t=[{shape:{type:`box`,halfExtents:[14,14,.5]},position:[0,0,-.5],mass:0,restitution:0,friction:.7}];if(e===`torque`)t.push({shape:{type:`box`,halfExtents:[.8,.45,.6]},position:[0,0,.6],mass:3}),t.push({shape:{type:`sphere`,radius:.35},position:[-4,.3,.7],velocity:[6,0,0],restitution:.5});else if(e===`support`){t[0]={shape:{type:`box`,halfExtents:[8,4,.5]},position:[0,0,-.5],mode:`kinematic`,mass:1,velocity:[.5,0,0],friction:1,restitution:0};for(let e=0;e<4;e++)t.push({shape:{type:`box`,halfExtents:[.5,.5,.5]},position:[(e-1.5)*2,0,.5],friction:1,restitution:0})}else if(e===`friction`){let e={staticFriction:.8,dynamicFriction:.1,restitution:0};t[0]={position:[0,0,-.5],mass:0,colliders:[{shape:{type:`box`,halfExtents:[14,14,.5]},material:e}]},t.push({position:[0,0,.5],colliders:[{shape:{type:`box`,halfExtents:[.5,.5,.5]},material:e}]})}else if(e===`deep`||e===`massRatio`){let n=e===`deep`?8:4;for(let r=0;r<n;r++)t.push({shape:{type:`box`,halfExtents:[.5,.5,.5]},position:[0,0,.5+r],mass:e===`massRatio`&&r===n-1?10:1,restitution:0,friction:.8})}else if(e===`mixed`)for(let e=0;e<256;e++){let n=.25+e%4*.05;t.push({shape:e%2?{type:`sphere`,radius:n}:{type:`box`,halfExtents:[n,n,n]},position:[(e%16-7.5)*1.4,(Math.floor(e/16)-7.5)*1.4,1+e%5*.35],restitution:.15,friction:.6})}else for(let e=0;e<3;e++)for(let n=0;n<5;n++){let r=e===1?.25:0;t.push({shape:{type:`box`,halfExtents:[.5,.5,.5]},position:[(e-1)*2.5,0,.5+n*1.01],orientation:[0,0,Math.sin(r/2),Math.cos(r/2)],restitution:0,friction:.7})}return t}function ge(e){return e===`impact`||e===`continuous`?[0,0,0]:e===`friction`?[3,0,-9.81]:[0,0,-9.81]}function _e(e){return Object.hasOwn(me,e)}var ve={maximumPairs:4096,linearDamping:.2,angularDamping:1,sleepAfter:.6,sleepLinearSpeed:.2,sleepAngularSpeed:.35,penetrationRecoveryFraction:.04,maximumRecoverySpeed:.1};function U(e){return e===`dominoSpiral`||e===`dominoJunction`}function W(){let e=[{position:[0,0,-.25],mass:0,shape:{type:`box`,halfExtents:[13,6,.25]},friction:.65}],t=(t,n,r=0)=>{e.push(G(t,n,r,e.length===1))};for(let e=0;e<8;e++)t(-11.2+e*.62,0);for(let e of[-1,1])for(let n=0;n<=19;n++){let r=n/19,i=-6.24+11.78*r,a=e*(.34+2.65*Math.sin(Math.PI*r)**2),o=e*2.65*Math.PI*Math.sin(2*Math.PI*r)/11.78;t(i,a,Math.atan(o))}for(let e=0;e<=8;e++)t(6.16+e*.62,0);return e}function G(e,t,n,r){let i=r?.22:0,a=.1*(1-Math.cos(i))+.75*Math.sin(i),o=.1*Math.sin(i)+.75*Math.cos(i);return{position:[e+a*Math.cos(n),t+a*Math.sin(n),o],orientation:[-Math.sin(n/2)*Math.sin(i/2),Math.cos(n/2)*Math.sin(i/2),Math.sin(n/2)*Math.cos(i/2),Math.cos(n/2)*Math.cos(i/2)],velocity:r?[1.5*o*Math.cos(n),1.5*o*Math.sin(n),-1.5*(-.1*Math.cos(i)+.75*Math.sin(i))]:[0,0,0],angularVelocity:r?[-Math.sin(n)*1.5,Math.cos(n)*1.5,0]:[0,0,0],shape:{type:`box`,halfExtents:[.1,.32,.75]},mass:1,friction:.65,restitution:0}}function ye(){let e=[{position:[0,0,-.25],mass:0,shape:{type:`box`,halfExtents:[9,9,.25]},friction:.65,restitution:0}],t=1.8/(2*Math.PI),n=0;for(;n<Math.PI*6;){let r=3+t*n,i=t*Math.cos(n)-r*Math.sin(n),a=t*Math.sin(n)+r*Math.cos(n),o=Math.atan2(a,i);e.push(G(r*Math.cos(n),r*Math.sin(n),o,e.length===1)),n+=.52/Math.hypot(r,t)}return e}function be(e,t,n){let r=new Uint8Array(t.length*4);for(let e=0;e<t.length;e++){let t=n===`wreckingBall`&&e===2,i=t?.18:e===0?.82:U(n)?.43:.72;r.set([255,Math.round(i*255),t?255:0,255],e*4)}let i=e.createTexture({id:`lab-material-parameters`,width:t.length,height:1,format:`rgba8unorm`,data:r,sampler:{minFilter:`nearest`,magFilter:`nearest`}}),a=o(e,{id:`lab-pbr-material`,uniforms:{metallicRoughnessValues:[1,1],metallicRoughnessUVSet:1,IBLenabled:!0},bindings:{pbr_metallicRoughnessSampler:i}}),s=xe(e);return{material:a,environment:s,destroy(){a.destroy(),i.destroy(),s.destroy()}}}function xe(e){let t=new Uint8Array(2048*4);for(let e=0;e<32;e++){let n=e<16?220:140;for(let r=0;r<64;r++)t.set([n,n,n,255],(e*64+r)*4)}let n=e.createTexture({width:64,height:32,format:`rgba8unorm`,data:t}),r=new z(e),i=r.prepare({source:n,sourceEncoding:`srgb`,size:32,sampleCount:32});return r.destroy(),n.destroy(),i}var Se=[new URL(``+new URL(`impactPlate_light_000-TjuzBlrs.ogg`,import.meta.url).href,``+import.meta.url),new URL(``+new URL(`impactPlate_light_001-DPqoBP1A.ogg`,import.meta.url).href,``+import.meta.url),new URL(``+new URL(`impactPlate_light_002-B4JsT95g.ogg`,import.meta.url).href,``+import.meta.url)],Ce=class{soundEnabled=!1;audioGeneration=0;discardNextBatch=!1;get enabled(){return this.soundEnabled}set enabled(e){e!==this.soundEnabled&&(this.soundEnabled=e,this.audioGeneration++,this.discardNextBatch=e,e||this.silence())}get generation(){return this.audioGeneration}context;samples=[];loading;sources=new Set;timelineOrigin;soundedBodies=new Set;unlock(){if(this.enabled)try{this.context??=new AudioContext;let e=this.context;e.resume().catch(()=>{}),this.loading??=Promise.all(Se.map(async t=>{let n=await fetch(t);if(!n.ok)throw Error(`Audio unavailable`);let r=(await e.decodeAudioData(await n.arrayBuffer())).getChannelData(0),i=0;for(let e of r)i=Math.max(i,Math.abs(e));let a=0;for(;a<r.length&&Math.abs(r[a])<i*.12;)a++;a=Math.max(0,a-Math.ceil(e.sampleRate*5e-4));let o=e.createBuffer(1,Math.ceil(e.sampleRate*.018),e.sampleRate),s=o.getChannelData(0);for(let t=0;t<s.length;t++){let n=t/e.sampleRate;s[t]=(r[a+t]??0)/Math.max(i,.001)*Math.min(1,n/4e-4)*Math.exp(-n/.0035)}return o})).then(e=>{this.samples=e}).catch(()=>{this.loading=void 0})}catch{this.enabled=!1}}play(e,t=1/60,n=e.at(-1)?.step??0,r=this.audioGeneration){if(!this.enabled||r!==this.audioGeneration)return;if(this.discardNextBatch){this.discardNextBatch=!1;return}let i=this.context;if(!this.enabled||!i||i.state!==`running`||!this.samples.length)return;let a=e.filter(e=>e.phase!==`end`&&e.normalImpulse>=.015&&!e.bodies.includes(0)&&!this.soundedBodies.has(Math.max(...e.bodies)));if(!a.length)return;let o=Math.min(...a.map(e=>e.step)),s=i.currentTime;(this.timelineOrigin===void 0||s-(this.timelineOrigin+n*t)>.2)&&(this.timelineOrigin=s+.02-o*t);for(let n of e){if(n.phase===`end`||n.normalImpulse<.015||n.bodies.includes(0))continue;let e=Math.max(...n.bodies);if(this.soundedBodies.has(e))continue;this.soundedBodies.add(e);let r=Math.max(s+.005,this.timelineOrigin+n.step*t),a=i.createGain(),o=Math.min(.12,.05+Math.sqrt(n.normalImpulse)*.04);a.gain.setValueAtTime(o,r),a.gain.setValueAtTime(o,r+.002),a.gain.exponentialRampToValueAtTime(1e-4,r+.018);let c=i.createBufferSource();c.buffer=this.samples[e%this.samples.length];let l=i.createBiquadFilter();l.type=`highpass`,l.frequency.value=700,l.Q.value=.5,c.connect(l).connect(a).connect(i.destination),this.sources.add(c),c.start(r),c.stop(r+.02),c.onended=()=>{this.sources.delete(c),c.disconnect(),l.disconnect(),a.disconnect()}}}silence(){for(let e of this.sources)e.stop();this.sources.clear()}reset(){this.audioGeneration++,this.discardNextBatch=!1,this.silence(),this.soundedBodies.clear(),this.timelineOrigin=void 0}destroy(){this.silence(),this.context?.close().catch(()=>{})}},we=class extends ne{constructor(e,t,n,r){super({id:e,geometry:t,matrix:n,collision:r,body:{mode:`static`,restitution:.25,friction:.5}})}};function Te(){let e=new _;return new v({id:`cradle-frame`,children:[new we(`left-leg`,e,new r().translate([-4.2,0,1.95]).scale([.3,.3,1.95])),new we(`right-leg`,e,new r().translate([4.2,0,1.95]).scale([.3,.3,1.95])),new we(`crossbar`,e,new r().translate([0,0,4.2]).scale([4.5,.3,.3]))]})}function Ee(e){return E(e).bodies}function De(e){if(e===`robotArm`)return T();if(e===`wreckingBall`)return ue();let t={position:[0,0,4],mass:0,shape:{type:`box`,halfExtents:[.2,.2,.2]}},n={position:[0,0,-.5],mass:0,shape:{type:`box`,halfExtents:[8,8,.5]}};if(e===`suspension`)return{bodies:[n,{...t,position:[0,0,4]},{position:[0,0,2],mass:2,shape:{type:`box`,halfExtents:[.8,.5,.25]}}],joints:[{type:`distance`,first:1,second:2,distance:1.5,spring:{stiffness:80,damping:6}}]};if(e===`servo`)return{bodies:[n,{...t,position:[0,0,3]},{position:[0,0,3],shape:{type:`box`,halfExtents:[1.5,.2,.2]}}],joints:[{type:`hinge`,first:1,second:2,limits:[-1.2,1.2],motor:{position:.8,stiffness:40,damping:8,maximumForce:15}}]};if(e===`pendulum`)return{bodies:[n,t,{position:[1.5,0,2],shape:{type:`sphere`,radius:.4}}],joints:[{type:`distance`,first:1,second:2,distance:2.5}]};if(e===`cradle`){let e=[n],r=[];for(let n=0;n<5;n++){let i=(n-2)*.81,a=n===0?-.65:0,o=e.length;e.push({...t,position:[i,0,4],shape:{type:`box`,halfExtents:[.08,.08,.08]}},{position:[i+2.5*Math.sin(a),0,4-2.5*Math.cos(a)],mass:1,shape:{type:`sphere`,radius:.4},restitution:.985,friction:.02}),r.push({type:`distance`,first:o,second:o+1,distance:2.5})}let i=Te();return e.push(...Ee(i)),{bodies:e,joints:r,frame:i}}return e===`hinge`?{bodies:[n,t,{position:[0,0,2.5],shape:{type:`box`,halfExtents:[.2,.2,1.5]}},{position:[1.8,0,.5],shape:{type:`box`,halfExtents:[.5,.5,.5]}}],joints:[{type:`hinge`,first:1,second:2,firstFrame:{orientation:[Math.SQRT1_2,0,0,Math.SQRT1_2]},secondFrame:{position:[0,0,1.5],orientation:[Math.SQRT1_2,0,0,Math.SQRT1_2]},limits:[-1.1,1.1],motor:{velocity:.6,maximumForce:20}}]}:e===`slider`?{bodies:[n,{position:[0,0,1],mass:0,shape:{type:`box`,halfExtents:[.15,.15,.15]}},{position:[0,0,1],shape:{type:`box`,halfExtents:[.5,.5,.5]}},{position:[1.6,0,.5],shape:{type:`box`,halfExtents:[.5,.5,.5]}}],joints:[{type:`slider`,first:1,second:2,firstFrame:{orientation:[0,Math.SQRT1_2,0,Math.SQRT1_2]},secondFrame:{orientation:[0,Math.SQRT1_2,0,Math.SQRT1_2]},limits:[-2,2],motor:{velocity:1,maximumForce:30}}]}:null}function Oe(e,t,n){let i=e.createTexture({id:`cradle-reflection-capture`,dimension:`cube`,width:256,height:256,depth:6,format:`rgba16float`,usage:b.RENDER|b.SAMPLE,sampler:{minFilter:`linear`,magFilter:`linear`}}),a=e.createTexture({width:256,height:256,format:`depth24plus`,usage:b.RENDER}),o=new r([1,0,0,0,0,-1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(new r().perspective({fovy:Math.PI/2,aspect:1,near:.05,far:50}));for(let[s,c]of[{direction:[1,0,0],up:[0,-1,0]},{direction:[-1,0,0],up:[0,-1,0]},{direction:[0,1,0],up:[0,0,1]},{direction:[0,-1,0],up:[0,0,-1]},{direction:[0,0,1],up:[0,-1,0]},{direction:[0,0,-1],up:[0,-1,0]}].entries()){let l=new r().lookAt({eye:t,center:[t[0]+c.direction[0],t[1]+c.direction[1],t[2]+c.direction[2]],up:c.up}),u=i.createView({dimension:`2d`,mipLevelCount:1,baseArrayLayer:s,arrayLayerCount:1}),d=e.createFramebuffer({width:256,height:256,colorAttachments:[u],depthStencilAttachment:a});n(d,l,o),e.submit(),d.destroy(),u.destroy()}let s=e.createTexture({width:512,height:256,format:`rgba16float`,usage:b.RENDER|b.SAMPLE,sampler:{minFilter:`linear`,magFilter:`linear`}}),c=e.createFramebuffer({colorAttachments:[s],depthStencilAttachment:null}),l=new N(e,{id:`cradle-reflection-panorama`,colorAttachmentFormats:[`rgba16float`],source:`@group(0) @binding(0) var reflectionCapture:texture_cube<f32>;
@group(0) @binding(1) var reflectionSampler:sampler;
@fragment fn fragmentMain(input:FragmentInputs)->@location(0) vec4f {
 // Fragment position uses the same top-left image origin as the environment integrator.
 let coordinate=input.Position.xy/vec2f(512,256);
 let longitude=(coordinate.x-0.5)*6.283185307;let latitude=coordinate.y*3.141592654;
 let direction=vec3f(cos(longitude)*sin(latitude),cos(latitude),sin(longitude)*sin(latitude));
 return textureSampleLevel(reflectionCapture,reflectionSampler,direction,0);
}`,bindings:{reflectionCapture:i,reflectionSampler:i.sampler},shaderLayout:{attributes:[],bindings:[{name:`reflectionCapture`,group:0,location:0,type:`texture`,viewDimension:`cube`},{name:`reflectionSampler`,group:0,location:1,type:`sampler`}]}}),u=e.beginRenderPass({framebuffer:c,clearColor:[0,0,0,1],clearDepth:!1});l.draw(u),u.end(),e.submit();let d=new z(e),f=d.prepare({source:s,sourceEncoding:`linear`,size:128,sampleCount:64});return e.submit(),d.destroy(),l.destroy(),c.destroy(),s.destroy(),a.destroy(),i.destroy(),f}var K={type:`spot`,position:[0,-10,30],direction:[0,10,-30],color:[1,244/255,230/255],intensity:16.4,attenuation:[1,0,.004],innerConeAngle:.127,outerConeAngle:.209},ke=class{root=new v({id:`newtons-cradle`});renderer;environment;reflectionEnvironment;materials;textures;constructor(e,t,i){this.renderer=new g(e);let a=new Uint8Array(256*128*4);for(let e=0;e<128;e++)for(let t=0;t<256;t++){let n=(e*256+t)*4,r=t>25&&t<65&&e>20&&e<65||t>155&&t<180&&e>35&&e<100?255:e>64?145:100;a.set([r,r,Math.min(255,r+8),255],n)}let o=e.createTexture({width:256,height:128,format:`rgba8unorm`,data:a}),s=new z(e);this.environment=s.prepare({source:o,sourceEncoding:`srgb`,size:64,sampleCount:64}),s.destroy(),o.destroy();let l=new Uint8Array(16384*4),u=new Uint8Array(l.length);for(let e=0;e<128;e++)for(let t=0;t<128;t++){let n=(e*128+t)*4,r=Math.sin(t*.31+Math.sin(e*.23)*3)*Math.cos(e*.27);l.set([128+Math.round(r*16),128+Math.round(Math.cos(t*.29+e*.37)*16),253,255],n),u.set([255,Math.round(160+r*25),0,255],n)}let d={minFilter:`linear`,magFilter:`linear`,addressModeU:`repeat`,addressModeV:`repeat`},f=e.createTexture({width:128,height:128,format:`rgba8unorm`,data:l,sampler:d}),p=e.createTexture({width:128,height:128,format:`rgba8unorm`,data:u,sampler:d});this.textures=[f,p],this.materials={stone:{id:`cradle-stone`,uniforms:{baseColorFactor:[.16,.18,.2,1],metallicRoughnessValues:[0,1],normalScale:.5,IBLenabled:!0},bindings:{pbr_normalSampler:f,pbr_metallicRoughnessSampler:p}},steel:{id:`cradle-steel`,uniforms:{baseColorFactor:[.8,.82,.85,1],metallicRoughnessValues:[1,.07],IBLenabled:!0}},table:{id:`cradle-table`,uniforms:{baseColorFactor:[.55,.52,.47,1],metallicRoughnessValues:[0,.85],IBLenabled:!0}},thread:{id:`cradle-thread`,uniforms:{baseColorFactor:[.1,.12,.14,1],metallicRoughnessValues:[.5,.4],IBLenabled:!0}}};let m=new _,ee=new n({nlat:32,nlong:64}),h=[{id:`table`,geometry:m,matrix:new r().translate([0,0,-.5]).scale([8,8,.5]),material:`table`}];i.traverse((e,{worldMatrix:t})=>{e instanceof we&&h.push({id:e.id,geometry:e.geometry,matrix:new r(t).multiplyRight(e.matrix),material:`stone`})});for(let e=0;e<5;e++)h.push({id:`ball-${e}`,geometry:ee,matrix:new r().scale([.4,.4,.4]),body:e*2+2,material:`steel`}),h.push({id:`tether-${e}`,geometry:m,matrix:new r,body:e*2+2,anchor:e*2+1,material:`thread`});let te=new Map;this.root.transformSource={getFrame:()=>({matrices:t.poseMatrices,matrixCount:t.count,revision:0,bindings:te})};let y=new v({id:`cradle-reflection`}),b=[];for(let e of h){let t=new c({id:e.id,geometry:e.geometry,material:this.materials[e.material],matrix:e.matrix,...e.anchor===void 0?{}:{connection:{first:e.anchor,second:e.body,radius:.018}}});this.root.add(t),e.body===void 0?y.add(t):te.set(t,{matrixIndex:e.body,localMatrix:e.matrix}),e.material===`steel`&&b.push(t)}let x=new g(e),S=[0,0,1.5];this.reflectionEnvironment=Oe(e,S,(e,t,n)=>{x.render({scene:y,framebuffer:e,camera:{viewMatrix:t,projectionMatrix:n,position:S},lights:[K],environment:this.environment,background:[.787,.828,.768,1],outputColorSpace:`linear`,toneMapMode:0})}),x.destroy();for(let e of b)e.environment=this.reflectionEnvironment}draw(e,t,n){this.renderer.render({scene:this.root,camera:{viewMatrix:e,projectionMatrix:t,position:n,near:.1,far:200,clipDepth:`zero-to-one`},lights:[K],environment:this.environment,background:[.025,.03,.04,1],spotShadows:{spotLights:[{position:K.position,direction:K.direction,outerConeAngle:K.outerConeAngle,range:60,normalBias:.015,sourceRadius:.025,depthBias:2,depthBiasSlopeScale:2}]}})}destroy(){this.renderer.destroy(),this.root.destroy();for(let e of this.textures)e.destroy();this.environment.destroy(),this.reflectionEnvironment.destroy()}},Ae=[{...H,color:[1,230/255,194/255]},{type:`ambient`,color:[1,1,1],intensity:.3}],je=[.9,.92,.89,1],Me=class{world;root=new v({id:`wrecking-ball`});renderer;environment;probe;captureRoots;captureMatrices;reflectionEnvironment;constructor(e,t,i){this.world=t,this.renderer=new g(e),this.environment=xe(e),this.reflectionEnvironment={...this.environment},this.probe=new se(e,{size:64,sampleCount:8,mipLevels:2,refreshMode:`same-frame`});let a=new Map;this.root.transformSource={getFrame:()=>({matrices:t.poseMatrices,matrixCount:t.count,revision:0,bindings:a})};let o=new _,s=new n({nlat:24,nlong:48}),l=[{id:`plinth`,uniforms:{baseColorFactor:[.45,.43,.38,1],metallicRoughnessValues:[0,.8]}},{id:`frame`,uniforms:{baseColorFactor:[.2,.23,.26,1],metallicRoughnessValues:[.7,.3]}},{id:`ball`,uniforms:{baseColorFactor:[.54,.57,.61,1],metallicRoughnessValues:[.96,.15]}},{id:`blocks`,uniforms:{baseColorFactor:[.65,.36,.13,1],metallicRoughnessValues:[0,.65]}}],u=[];for(let[e,t]of i.entries()){let n=t.shape;if(n.type!==`box`&&n.type!==`sphere`)throw Error(`Wrecking ball requires primitives`);let i=new r().scale(n.type===`box`?n.halfExtents:[n.radius,n.radius,n.radius]),d=new c({id:`body-${e}`,geometry:n.type===`sphere`?s:o,material:l[e===0?0:e===2?2:e<6?1:3],matrix:new r().translate(t.position??[0,0,0]).multiplyRight(i)});a.set(d,{matrixIndex:e,localMatrix:i}),this.root.add(d),e===2&&(d.environment=this.reflectionEnvironment),(e===0||e>=6)&&u.push(d)}this.root.add(new c({id:`pendulum`,geometry:o,material:l[1],connection:{first:1,second:2,radius:.025}})),this.captureRoots=Array.from({length:6},()=>new v({children:u,transformSource:{getFrame:()=>({matrices:this.captureMatrices,matrixCount:t.count,revision:0,bindings:a})}}))}draw(e,t,n,{frameMilliseconds:r,advanced:i}={advanced:!0}){this.probe.update({matrices:this.world.poseMatrices,matrixIndex:2,frameMilliseconds:r,refresh:i,viewDirections:[[e[2],e[6],e[10]]],draw:e=>{this.captureMatrices=e.matrices,this.renderer.render({scene:this.captureRoots[e.face],framebuffer:e.framebuffer,camera:{viewMatrix:e.viewMatrix,projectionMatrix:e.projectionMatrix,position:[0,0,0],gpuOrigin:e.origin},environment:this.environment,lights:Ae,background:je,transmission:!1,rasterParameters:{frontFace:`cw`},toneMapMode:0,outputColorSpace:`linear`})}}),this.probe.texture&&(this.reflectionEnvironment.specularTexture=this.probe.texture),this.renderer.render({scene:this.root,camera:{viewMatrix:e,projectionMatrix:t,position:n,near:.1,far:200,clipDepth:`zero-to-one`},environment:this.environment,lights:Ae,background:je,spotShadows:{spotLights:[{position:H.position,direction:H.direction,outerConeAngle:H.outerConeAngle,range:80,normalBias:.008,sourceRadius:.025,depthBias:2,depthBiasSlopeScale:2}]}})}destroy(){this.renderer.destroy(),this.probe.destroy(),this.root.destroy(),this.environment.destroy()}},Ne=[5,-8,5],Pe=[1.8,0,1.5],Fe=document.querySelector(`#status`),q=document.querySelector(`#world`),J=document.querySelector(`#scene`),Ie=document.body.dataset.scene??new URLSearchParams(window.location.search).get(`scene`);Ie&&_e(Ie)&&(J.value=Ie);var Y=document.body.dataset.scene===`wreckingBall`,X=document.querySelector(`#solver`),Z=document.querySelector(`#iterations`),Q=new Ce,Le=document.querySelector(`#sound`);Le.onchange=()=>{Q.enabled=Le.checked,Q.unlock()},q.addEventListener(`pointerdown`,()=>Q.unlock());var $=document.querySelector(`#auto-play`),Re=document.querySelector(`#playback-status`),ze=new h({traceTitle:`GPU Graph Timeline`}),Be=m(ze,Y?`Wrecking Ball`:`Rigid Body Lab`,Y?`GPU physics · 204 blocks and a heavy pendulum`:void 0);Y&&(J.hidden=!0,Le.closest(`label`).style.display=`none`,$.closest(`label`).style.display=`none`,document.querySelector(`#push`).hidden=!0,X.disabled=!0);var Ve=Array.from(document.querySelectorAll(`button`));try{let e=null,n=await t.createDevice({adapters:[y],optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:q,autoResize:!0,useDevicePixels:Math.max(2,window.devicePixelRatio)},onError:t=>{e=t}}),i=new p(45,1,.1,200);i.up.set(0,0,1),J.value===`wreckingBall`?i.position.set(19,-21,16):J.value===`robotArm`?i.position.set(...Ne):i.position.set(13,-19,19);let o=new s(i,q);o.autoRotate=!0,o.autoRotateSpeed=.5,o.addEventListener(`start`,()=>{o.autoRotate=!1});let c=performance.now();J.value===`robotArm`?o.target.set(...Pe):o.target.set(J.value===`wreckingBall`?-2:0,0,J.value===`wreckingBall`?4:2),o.update();let u=n.createBuffer({id:`rigid-body-camera`,byteLength:64,usage:S.UNIFORM|S.COPY_DST}),f=null;async function m(){let e=_e(J.value)?J.value:`stack`;e!==f&&(Z.value=e===`robotArm`?`64`:e===`cradle`?`8`:e===`wreckingBall`?`16`:`32`,(U(e)||e===`wreckingBall`)&&(X.value=`parallel`),f=e);let t=De(e),r=t?.bodies??he(e);t&&e!==`wreckingBall`&&(X.value=`ordered`);let i=new te({bodies:r,publishPoses:e===`robotArm`||e===`cradle`||e===`wreckingBall`,publicationBounds:e===`cradle`?r.map(e=>{let t=e.shape;if(t.type!==`sphere`&&t.type!==`box`)throw Error(`Cradle visual bounds require primitive geometry`);let n=t.type===`sphere`?[t.radius,t.radius,t.radius]:[...t.halfExtents];return[[-n[0],-n[1],-n[2]],n]}):void 0,joints:t?.joints,...U(e)?{...ve,eventCapacity:512,impactImpulseThreshold:.15}:{},...e===`wreckingBall`?le:{},failurePolicy:`rollback`,timeStep:e===`cradle`?1/480:e===`wreckingBall`?ce:U(e)?1/60:1/120,...e===`cradle`?{restitutionThreshold:.05,linearDamping:.08,angularDamping:.12}:{},...e===`continuous`?{continuous:{bodies:[0]}}:{},iterations:Number(Z.value),solver:X.value===`ordered`?`ordered`:`parallel`,broadPhase:e===`cradle`?`all-pairs`:`hierarchical-grid`,gravity:ge(e)});document.querySelector(`#description`).textContent=me[e].description;let o=new ee(n);i.addToGraph(o);let s=await o.compileAsync().catch(e=>{throw i.destroy(),e}),c=[],p=e===`cradle`?64:16,m=e===`cradle`?32:12,h=U(e)?36:p*m*6,g=n.createBuffer({data:new Float32Array(r.flatMap(e=>{let t=e.shape??e.colliders?.[0]?.shape;if(!t)throw Error(`This renderer requires centered shapes`);if(t.type===`sphere`)return[t.radius,0,0,0];if(t.type===`box`)return[...t.halfExtents,e.mass===0?2:1];if(t.type===`triangle-mesh`||t.type===`convex-hull`){let n=c.length/4;for(let e of t.geometry.indices){let n=e*3;c.push(t.geometry.positions[n],t.geometry.positions[n+1],t.geometry.positions[n+2],0)}return h=Math.max(h,t.geometry.indices.length),[n,t.geometry.indices.length,+(e.mass===0),3]}throw Error(`The lab renderer supports boxes, spheres and cooked mesh shapes`)})),usage:S.STORAGE}),_=n.createBuffer({id:`lab-mesh-vertices`,data:new Float32Array(c.length?c:[0,0,0,0]),usage:S.STORAGE}),v=e===`robotArm`||e===`cradle`||e===`wreckingBall`,y=v?null:be(n,r,e),b=v?null:l(n,{id:`rigid-body-shapes`,material:y.material,defines:{HAS_NORMALS:!0,HAS_TANGENTS:!0,HAS_UV:!0,HAS_UV_1:!0,USE_LIGHTS:!0,USE_IBL:!0,USE_SCENE_ENVIRONMENT:!0,USE_TEX_LOD:!0,USE_SCENE_COLOR_MANAGEMENT:!0},modules:[de,d],source:`
${fe(e,r.length,p,m)}
fn grainHash(point:vec2f)->f32{return fract(sin(dot(point,vec2f(127.1,311.7)))*43758.5453);}
fn surfaceGrain(point:vec2f)->f32{
 let cell=floor(point);let fraction=fract(point);let weight=fraction*fraction*(3.0-2.0*fraction);
 return mix(mix(grainHash(cell),grainHash(cell+vec2f(1,0)),weight.x),mix(grainHash(cell+vec2f(0,1)),grainHash(cell+vec2f(1,1)),weight.x),weight.y);
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {
 let band=select(1.0,0.3,input.sphere>0.5&&abs(input.localNormal.z)<0.13);
 var colorValue=input.color*band;

 ${U(e)?`

 let distanceToPip=min(length(input.localPoint.yz-vec2f(0,0.38)),length(input.localPoint.yz+vec2f(0,0.38)));
 let edge=max(fwidth(distanceToPip),0.001);
 let grain=surfaceGrain((input.localPoint.xy+input.localPoint.z*vec2f(0.73,0.29))*75.0);
 var color=vec3f(0.20,0.23,0.24)*(0.94+grain*0.12);

 if(input.body>0u){
  color=vec3f(0.018,0.022,0.028)*(0.87+grain*0.26);

  if(abs(input.localNormal.x)>0.9){
   let pip=1.0-smoothstep(0.085-edge,0.085+edge,distanceToPip);
   let divider=(1.0-smoothstep(0.006,0.013,abs(input.localPoint.z)))*select(0.0,1.0,abs(input.localPoint.y)<0.27);
   color=mix(color,vec3f(0.85,0.83,0.77),max(pip,divider*0.65));
  }
 }

 colorValue=color;

 `:``}
 let normal=normalize(input.normal);
 let reference=select(vec3f(0,0,1),vec3f(0,1,0),abs(normal.z)>0.9);
 let tangent=normalize(cross(reference,normal));
 fragmentInputs.pbr_vPosition=input.worldPosition;
 fragmentInputs.pbr_vNormal=normal;
 fragmentInputs.pbr_vTBN=mat3x3f(tangent,cross(normal,tangent),normal);
 fragmentInputs.pbr_vUV0=input.localPoint.xy;
 fragmentInputs.pbr_vUV1=vec2f((f32(input.body)+0.5)/${r.length}.0,0.5);
 let visibility=shadow_getSpotFactor(0,input.worldPosition,normal);
 return pbr_filterColorWithSpotShadows(vec4f(colorValue,1),vec4f(visibility,1,1,1));}
`,vertexCount:h,instanceCount:r.length,parameters:{depthWriteEnabled:!0,depthCompare:`less-equal`,depthFormat:`depth24plus`},bindings:{positions:i.positions,orientations:i.orientations,shapes:g,meshVertices:_,sleepStates:i.sleepStates}});b&&y&&b.shaderInputs.setProps({lighting:{lights:[{type:`ambient`,color:[160,190,230],intensity:.15},H]},ibl:{pbr_diffuseEnvSampler:y.environment.diffuseTexture,pbr_specularEnvSampler:y.environment.specularTexture,pbr_brdfLUT:y.environment.brdfLUTTexture},pbrScene:{environmentIntensity:.7,environmentRotation:0,environmentMipCount:y.environment.specularTexture.mipLevels,toneMapMode:1}});let x=t?.joints.filter(e=>e.type===`distance`)??[],C=!v&&x.length>0?new a(n,{id:`mechanism-tethers`,source:`
@group(0) @binding(0) var<uniform> matrix: mat4x4f;
@group(0) @binding(1) var<storage,read> positions: array<vec4f>;
const endpoints = array<vec2u, ${x.length}>(${x.map(e=>`vec2u(${e.first}u,${e.second}u)`).join(`,`)});
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32,@builtin(instance_index) tether: u32)->@builtin(position) vec4f {
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];
 let first=positions[endpoints[tether].x].xyz;let second=positions[endpoints[tether].y].xyz;
 let direction=normalize(second-first);
 let reference=select(vec3f(0,0,1),vec3f(0,1,0),abs(direction.z)>0.9);
 let tangent=normalize(cross(direction,reference));let bitangent=cross(direction,tangent);
 let angle=(f32(vertex/6u)+corner.x)*6.2831853/8.0;
 let offset=0.025*(cos(angle)*tangent+sin(angle)*bitangent);
 return matrix*vec4f(mix(first,second,corner.y)+offset,1);
}
@fragment fn fragmentMain()->@location(0) vec4f {return vec4f(0.12,0.16,0.18,1);}
`,vertexCount:48,instanceCount:x.length,parameters:{depthWriteEnabled:!0,depthCompare:`less-equal`,depthFormat:`depth24plus`},bindings:{matrix:u,positions:i.positions},shaderLayout:{attributes:[],bindings:[{name:`matrix`,group:0,location:0,type:`uniform`},{name:`positions`,group:0,location:1,type:`read-only-storage`,visibility:1}]}}):null;return{shadows:v?null:new pe(n,{positions:i.positions,orientations:i.orientations,shapes:g,sleepStates:i.sleepStates,meshVertices:_},fe(e,r.length,p,m,!0),{vertexCount:h,instanceCount:r.length}),surface:y,cradle:e===`cradle`?new ke(n,i,t.frame):e===`robotArm`?new ie(n,i):e===`wreckingBall`?new Me(n,i,r):null,world:i,graph:s,model:b,tether:C,shapes:g,meshVertices:_,bodies:r,sceneName:e,capacity:i.getCapacityInfo()}}let h=await m(),g=document.querySelector(`#arm-controls`),_=e=>document.querySelector(`#arm-${e}`),v=()=>Number(_(`angle`).value)*Math.PI/180;function b(e){g&&(g.hidden=h.sceneName!==`robotArm`,!g.hidden&&((!e||e===_(`payload`))&&h.world.setBodyParameters(6,{mass:Number(_(`payload`).value)}),(!e||e!==_(`payload`))&&h.world.setAngularActuator(`elbow`,1,{angle:v(),...e===_(`angle`)?{}:{maximumTorque:Number(_(`torque`).value)}})))}b(),g&&(g.oninput=e=>{C||b(e.target)});let x=Y,C=!1,w=!0,ne=performance.now(),T=0,E=null,D=null,O=null,k=0,A=null,j=null,ae=0,M=0,N=0,P=0,F=performance.now(),oe=0,I=[],L,se=0,R=null,z=null,B=``,V=()=>{R=z=null,B=``,se=N,Re.value=$.checked?`Auto-play · waiting for the scene to settle`:``};$.onchange=V;let ue=e=>{e.shadows?.destroy(),e.cradle?.destroy(),e.tether?.destroy(),e.model?.destroy(),e.surface?.destroy(),e.graph.destroy(),e.world.destroy(),e.shapes.destroy(),e.meshVertices.destroy()};async function W(){if(!(C||!w)){C=!0,V(),Ve.forEach(e=>{e.disabled=!0}),J.disabled=X.disabled=Z.disabled=!0;try{if(await Promise.all([D,O,A,E]),Q.reset(),!w)return;j=m();let e=await j;if(!w){ue(e);return}let t=h.sceneName!==e.sceneName;ze.clear(),ue(h),h=e,b(),t&&(h.sceneName===`wreckingBall`?(i.position.set(19,-21,16),o.target.set(-2,0,4)):h.sceneName===`robotArm`?(i.position.set(...Ne),o.target.set(...Pe)):(i.position.set(h.sceneName===`mixed`?24:11,h.sceneName===`mixed`?-30:-16,h.sceneName===`mixed`?25:U(h.sceneName)?h.sceneName===`dominoJunction`?25:19:12),o.target.set(0,0,2))),Y&&(x=!0,document.querySelector(`#pause`).textContent=`Release ball`),T=0,N=0,I.length=0,L=void 0,P=0,F=performance.now(),V()}catch(t){e=t instanceof Error?t:Error(String(t))}finally{j=null,C=!1,Ve.forEach(e=>{e.disabled=!1}),J.disabled=Z.disabled=!1,X.disabled=Y}}}document.querySelector(`#reset`).onclick=W,J.onchange=W,X.onchange=W,Z.onchange=W;let G=document.querySelector(`#pause`);Y&&(G.textContent=`Release ball`),G.onclick=()=>{x=!x,V(),G.textContent=x?`Resume`:`Pause`},document.querySelector(`#push`).onclick=()=>{if(C||!w||A||h.sceneName===`impact`)return;V();let t=h;A=t.world.readState().then(e=>{if(t!==h||!w)return;let n=t.bodies.findIndex(e=>(e.mode??((e.mass??1)===0?`static`:`dynamic`))===`dynamic`);if(n<0)return;let r=e[n].position;t.world.applyImpulse(n,[3,0,0],[r[0],r[1]+.4,r[2]+.3])}).catch(t=>{e=t}).finally(()=>{A=null})};function ye(t){if(!w)return;if(e){Fe.value=e.message,document.querySelector(`#startup-error`).textContent=e.message;return}if(Be.update(),$.checked&&z!==null&&!x&&!C&&(Re.value=`${B} · next scene in ${Math.max(0,Math.ceil((z-t)/1e3))} s`,t>=z&&(J.selectedIndex=(J.selectedIndex+1)%J.options.length,W())),h.sceneName===`cradle`&&!$.checked&&!x&&!C&&N>=120&&W(),E){M=requestAnimationFrame(ye);return}let a=performance.now(),s=!x&&!C,l=N,d=Math.min(.05,(t-ne)/1e3);if(ne=t,!C&&!x&&z===null){T=Math.min(T+d,U(h.sceneName)||h.sceneName===`wreckingBall`?4/60:4/120);let e=n.createCommandEncoder();for(;T>=h.world.timeStep;)ze.encode(h.graph,e,{parameters:void 0}),T-=h.world.timeStep,N+=h.world.timeStep;n.submit(e.finish())}i.aspect=q.clientWidth/q.clientHeight,i.updateProjectionMatrix(),o.update(Math.min(.1,(t-c)/1e3)),c=t,i.updateMatrixWorld();let f=new r(i.projectionMatrix.elements).multiplyRight(i.matrixWorldInverse.elements),p=new r([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]);if(p.multiplyRight(f),u.write(new Float32Array(p)),h.model?.shaderInputs.setProps({rigidBodyPose:{matrix:p},pbrProjection:{camera:i.position.toArray()}}),h.cradle){let e=new r([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(i.projectionMatrix.elements),t=new r(i.matrixWorldInverse.elements),n=[i.position.x,i.position.y,i.position.z];h.cradle instanceof Me?h.cradle.draw(t,e,n,{frameMilliseconds:L,advanced:N!==l}):h.cradle.draw(t,e,n)}else{if(h.shadows){let e=new r([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(i.projectionMatrix.elements);h.model.shaderInputs.setProps({shadow:h.shadows.render(new r(i.matrixWorldInverse.elements),e)})}let e=n.beginRenderPass({clearColor:[.9,.92,.89,1],clearDepth:1});h.model?.draw(e),h.tether?.draw(e),e.end()}n.submit();let m=n.createFence();if(E=m.signaled.then(()=>{h.sceneName===`wreckingBall`&&(L=performance.now()-a),s&&h.sceneName===`wreckingBall`&&(I.push(performance.now()-a),I.length>180&&I.shift())}).catch(t=>{e=t}).finally(()=>{m.destroy(),E=null}),!C&&!O&&Q.enabled&&U(h.sceneName)&&t-k>50){k=t;let e=h,n=Q.generation;O=e.world.readContactEvents().then(t=>{w&&e===h&&Q.play(t.events,e.world.timeStep,t.step,n)}).catch(()=>{}).finally(()=>{O=null})}if(!C&&!D&&t-ae>500){ae=t;let n=h,r=N;D=Promise.all([n.world.readSimulationDiagnostics(),$.checked||n.sceneName===`robotArm`?n.world.readState():Promise.resolve(null),n.sceneName===`robotArm`?n.world.readAngularActuatorTorque(`elbow`,1):Promise.resolve(null)]).then(([e,i,a])=>{if(!w||n!==h)return;if(i&&a!==null){let e=re(i,4,v()),t=Number(_(`torque`).value);document.querySelector(`#arm-reading`).value=`${_(`payload`).value} kg · target ${_(`angle`).value}° · actual ${(e.angle*180/Math.PI).toFixed(1)}°
Tip error ${(e.tipError*100).toFixed(1)} cm · ${Math.abs(a).toFixed(1)} / ${t} N·m${Math.abs(a)>=t*.99?` · saturated`:``}`}if(oe=(r-P)/Math.max(.001,(t-F)/1e3),P=r,F=t,$.checked&&!e.complete)$.checked=!1,V(),Re.value=`Auto-play stopped: incomplete simulation. Reset after correcting capacity.`;else if($.checked&&i&&!x&&!C&&!A&&z===null){R=i.every((e,t)=>n.bodies[t].mass===0||Math.hypot(...e.velocity)<.04&&Math.hypot(...e.angularVelocity)<.04)?R??r:null;let e=r-se,t=e>=10&&R!==null&&r-R>=3;(t||e>=120)&&(B=t?`Scene settled`:`120 s demonstration complete`,z=performance.now()+2e3)}let o=n.capacity,s=[...I].sort((e,t)=>e-t),c=s[Math.max(0,Math.ceil(s.length*.95)-1)],l=n.sceneName===`wreckingBall`&&s.length>=30?`\n${c.toFixed(1)} ms p95 frame work · ${Math.max(0,(1-c/(1e3/60))*100).toFixed(0)}% margin at 60 fps`:``;Fe.value=`${e.complete?``:`INCOMPLETE SIMULATION · `}${n.bodies.filter(e=>e.mass!==0).length} moving bodies · ${n.world.solver} solver\n${N.toFixed(1)} s simulated · ${(oe*100).toFixed(0)}% real time · ${n.graph.stats.nodeOrder.length} graph nodes\n${e.maximumCandidatePairs} peak candidate pairs · ${e.maximumCandidateTests} peak candidate tests\n${e.incompleteSteps} incomplete steps / ${e.steps} total · ${(o.ownedBufferBytes/1048576).toFixed(2)} MiB world buffers${l}`}).catch(t=>{e=t}).finally(()=>{D=null})}M=requestAnimationFrame(ye)}M=requestAnimationFrame(ye),window.addEventListener(`pagehide`,()=>{w=!1,cancelAnimationFrame(M),o.dispose(),Promise.allSettled([D,O,A,j,E]).then(()=>{ue(h),Be.destroy(),u.destroy(),Q.destroy(),n.destroy()})},{once:!0})}catch(e){Fe.value=String(e),document.querySelector(`#startup-error`).textContent=String(e)}