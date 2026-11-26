import{A as e,D as t,E as n,M as r,N as i,O as a,T as o,_ as s,a as c,b as l,c as u,d,f,i as p,j as m,k as h,l as g,m as _,n as v,o as y,p as b,r as x,s as S,t as ee,u as C,v as te,x as w,y as ne}from"./robot-arm-scene-ziYSBmlF.js";import{E as T,V as E,z as D}from"./wgsl-interface-scan-Dcd6MHR-.js";var O={name:`pbrEnvironmentFilter`,bindingLayout:[{name:`pbrEnvironmentFilter`,group:0},{name:`pbrEnvironmentSource`,group:0}],fs:`layout(std140) uniform pbrEnvironmentFilterUniforms {
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
`,getUniforms:e=>e,uniformTypes:{face:`i32`,roughness:`f32`,mode:`i32`,sampleCount:`i32`,sourceEncoding:`i32`},defaultUniforms:{face:0,roughness:0,mode:0,sampleCount:64,sourceEncoding:0}},k=`#version 300 es
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
`,A=`const ENVIRONMENT_PI: f32 = 3.141592653589793;

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
`,j=(e,t)=>e.map((e,n)=>e-t[n]),M=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],N=(e,t)=>e.reduce((e,n,r)=>e+n*t[r],0);function P(e){if(!Number.isSafeInteger(e.length)||e.length%3||e.length>3e6)throw Error(`Invalid hull capacity`);let t=new Map;for(let n=0;n<e.length;n+=3){let r=[Math.fround(e[n]),Math.fround(e[n+1]),Math.fround(e[n+2])];if(!r.every(Number.isFinite))throw Error(`Invalid hull positions`);t.set(r.join(`,`),r)}let n=[...t.values()],r=w(n);if(n.length<4)throw Error(`A hull requires four noncoplanar vertices`);if(n.length>16384)throw Error(`Convex hull vertex capacity exceeded`);let i=1;for(let e=2;e<n.length;e++)N(j(n[e],n[0]),j(n[e],n[0]))>N(j(n[i],n[0]),j(n[i],n[0]))&&(i=e);let a=j(n[i],n[0]),o=0,s=0;for(let e=0;e<n.length;e++){let t=M(a,j(n[e],n[0])),r=N(t,t);r>s&&(s=r,o=e)}let c=M(a,j(n[o],n[0])),l=0;s=0;for(let e=0;e<n.length;e++){let t=Math.abs(N(c,j(n[e],n[0])));t>s&&(s=t,l=e)}let u=Math.max(...a.map(Math.abs),1e-12);if(s===0||r(0,i,o,l)===0)throw Error(`Degenerate convex hull`);let d=[0,1,2].map(e=>(n[0][e]+n[i][e]+n[o][e]+n[l][e])/4),f=(e,t,r)=>{let i=M(j(n[t],n[e]),j(n[r],n[e])),a=N(i,j(d,n[e]))>0;if(a)for(let e=0;e<3;e++)i[e]=-i[e];return{indices:a?[e,r,t]:[e,t,r],normal:i,constant:N(i,n[e]),epsilon:1e-8*u*Math.sqrt(N(i,i))}},p=[f(0,i,o),f(0,l,i),f(0,o,l),f(i,l,o)];for(let e=0;e<n.length;e++){if([0,i,o,l].includes(e))continue;let t=new Map,a=[];for(let i of p){let o=i.indices,s=n[e],c=n[o[0]],l=i.normal[0]*(s[0]-c[0])+i.normal[1]*(s[1]-c[1])+i.normal[2]*(s[2]-c[2]);if(Math.abs(l)<=i.epsilon?r(o[0],o[1],o[2],e)>0:l>0)for(let e=0;e<3;e++){let n=o[e],r=o[(e+1)%3];t.delete(`${r},${n}`)||t.set(`${n},${r}`,[n,r])}else a.push(i)}for(let[n,r]of t.values())a.push(f(n,r,e));if(p=a,p.length>n.length*2-4)throw Error(`Non-manifold convex hull`)}let m=p.flatMap(e=>e.indices),h=[...new Set(m)],g=new Map(h.map((e,t)=>[e,t]));return F(h.flatMap(e=>n[e]),m.map(e=>g.get(e)))}function F(e,t){return I(e,t,!1)}function I(e,t,n){if(!Number.isSafeInteger(e.length)||!Number.isSafeInteger(t.length)||e.length<3||t.length<3||e.length%3||t.length%3)throw Error(`Incomplete mesh geometry`);if(e.length>3e6||t.length>3e6)throw Error(`Mesh geometry capacity exceeded`);let r=Array.from(t),i=e.length/3;if(r.some(e=>!Number.isInteger(e)||e<0||e>=i))throw Error(`Invalid mesh geometry`);let a=n?re(e,r):Array.from(e,Math.fround);if(!a.every(Number.isFinite))throw Error(`Invalid mesh geometry`);let o=e=>[a[e*3],a[e*3+1],a[e*3+2]],s=r.length/3,c=new Float32Array(s*6),l=new Float64Array(s*3);for(let e=0;e<s;e++){let t=o(r[e*3]),n=o(r[e*3+1]),i=o(r[e*3+2]);if(M(j(n,t),j(i,t)).every(e=>e===0))throw Error(`Degenerate mesh triangle`);for(let r=0;r<3;r++)c[e*6+r]=Math.min(t[r],n[r],i[r]),c[e*6+r+3]=Math.max(t[r],n[r],i[r]),l[e*3+r]=t[r]+n[r]+i[r]}let u=[1/0,1/0,1/0],d=[-1/0,-1/0,-1/0];for(let e=0;e<a.length;e++){let t=e%3;u[t]=Math.min(u[t],a[e]),d[t]=Math.max(d[t],a[e])}let f=[],p=[],m=e=>{let t=f.length;f.push(...Array(12).fill(0));let n=[1/0,1/0,1/0],i=[-1/0,-1/0,-1/0];for(let t of e)for(let e=0;e<3;e++)n[e]=Math.min(n[e],c[t*6+e]),i[e]=Math.max(i[e],c[t*6+e+3]);if(e.length<=4){f[t+7]=e.length,f[t+8]=p.length/3;for(let t of e)p.push(r[t*3],r[t*3+1],r[t*3+2])}else{let t=0;for(let e=1;e<3;e++)i[e]-n[e]>i[t]-n[t]&&(t=e);e.sort((e,n)=>l[e*3+t]-l[n*3+t]);let r=e.length>>1;m(e.slice(0,r)),m(e.slice(r))}for(let e=0;e<3;e++)f[t+e]=n[e],f[t+4+e]=i[e];f[t+3]=f.length/12};if(m(Array.from({length:s},(e,t)=>t)),n)return{positions:a,indices:p,minimum:u,maximum:d,nodes:f,closed:!1,volume:0,center:[0,0,0],tensor:Array(9).fill(0)};let h=Array.from({length:a.length/3},(e,t)=>o(t).join(`,`)),g=new Map;for(let e=0;e<r.length;e+=3)for(let t=0;t<3;t++){let n=h[r[e+t]],i=h[r[e+(t+1)%3]],a=n<i,o=a?`${n}/${i}`:`${i}/${n}`,s=g.get(o)??{count:0,balance:0};s.count++,s.balance+=a?1:-1,g.set(o,s)}let _=[...g.values()].every(e=>e.count===2&&e.balance===0),v=u.map((e,t)=>(e+d[t])/2),y=0,b=[0,0,0],x=Array(9).fill(0);for(let e=0;e<r.length;e+=3){let t=[j(o(r[e]),v),j(o(r[e+1]),v),j(o(r[e+2]),v)],n=N(t[0],M(t[1],t[2]))/6;y+=n;for(let e=0;e<3;e++){b[e]+=n*t.reduce((t,n)=>t+n[e],0)/4;for(let r=0;r<3;r++){let i=0;for(let n=0;n<3;n++)for(let a=0;a<3;a++)i+=t[n][e]*t[a][r]*(n===a?2:1);x[e*3+r]+=n*i/20}}}let S=y===0?[0,0,0]:b.map(e=>e/y),ee=Math.sign(y);y=Math.abs(y);let C=x.map((e,t)=>{let n=Math.floor(t/3),r=t%3;return ee*((n===r?x[0]+x[4]+x[8]:0)-e)-y*((n===r?N(S,S):0)-S[n]*S[r])});return{positions:a,indices:p,minimum:u,maximum:d,nodes:f,closed:_,volume:y,center:S.map((e,t)=>e+v[t]),tensor:C}}function re(e,t){let n=new Int32Array(e.length/3);n.fill(-1);let r=[];for(let i=0;i<t.length;i++){let a=t[i];if(n[a]<0){n[a]=r.length/3;let t=a*3;r.push(Math.fround(e[t]),Math.fround(e[t+1]),Math.fround(e[t+2]))}t[i]=n[a]}return r}var ie=`struct VertexInputs {
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
`,ae=`#version 300 es
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
`,L=[-1,-1,1,-1,-1,1,1,1],oe=[-1,-1,3,-1,-1,3],R=class extends d{constructor(e,t){let{geometryType:n=`quad`,...r}=t,i=n===`triangle`?oe:L,a=i.map(e=>(e+1)/2),o=i.length/2;r.source&&=`${ie}\n${r.source}`,super(e,{id:r.id||b(`clip-space`),...r,vs:ae,vertexCount:o,geometry:new _({topology:n===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:o,attributes:{clipSpacePositions:{size:2,value:new Float32Array(i)},texCoords:{size:2,value:new Float32Array(a)},coordinates:{size:2,value:new Float32Array(a)}}})})}};function z(e){let{diffuseTexture:t,specularTexture:n,brdfLUTTexture:r}=e;return E(!t.destroyed&&!n.destroyed&&!r.destroyed&&t.device===n.device&&t.device===r.device&&t.dimension===`cube`&&n.dimension===`cube`&&r.dimension===`2d`),{pbr_diffuseEnvSampler:t,pbr_specularEnvSampler:n,pbr_brdfLUT:r}}var B=class{textures;ownsBrdfLUTTexture;destroyed=!1;constructor(e,t=!0){this.textures=e,this.ownsBrdfLUTTexture=t}getBindings(){return z(this.textures)}destroy(){this.destroyed||(this.destroyed=!0,this.textures.diffuseTexture.destroy(),this.textures.specularTexture.destroy(),this.ownsBrdfLUTTexture&&this.textures.brdfLUTTexture.destroy())}},se=class{device;model;modelFormat;constructor(e){this.device=e}prepare(e){E(e.source.dimension===`2d`&&e.source.device===this.device&&!e.source.destroyed);let t=Math.max(1,Math.floor(e.size??64)),n=Math.max(1,Math.floor(e.irradianceSize??16)),r=Math.max(1,Math.floor(e.brdfLUTSize??128)),i=Math.max(1,Math.min(Math.floor(e.sampleCount??64),1024)),a=e.format??`rgba16float`,o=this.device.getTextureFormatCapabilities(a);E(o.render&&o.filter&&!a.endsWith(`-srgb`)),e.brdfLUTTexture&&E(e.brdfLUTTexture.device===this.device&&!e.brdfLUTTexture.destroyed&&e.brdfLUTTexture.dimension===`2d`);let s=this.device.getMipLevelCount(t,t),c=[],l=[],u=[],d=e=>{let t=V(this.device,e);return c.push(t),t};try{let o=d({id:`pbr-environment-specular`,dimension:`cube`,size:t,mipLevels:s,format:a}),c=d({id:`pbr-environment-diffuse`,dimension:`cube`,size:n,mipLevels:1,format:a}),f=e.brdfLUTTexture??d({id:`pbr-environment-brdf-lut`,dimension:`2d`,size:r,mipLevels:1,format:a}),p=this.getFilterModel(a),m=e.sourceEncoding===`srgb`&&!e.source.format.endsWith(`-srgb`)?1:0;for(let n=0;n<s;n++){let r=Math.max(1,t>>n),a=s>1?n/(s-1):0;for(let t=0;t<6;t++)this.drawEnvironmentView({texture:o,size:r,mipLevel:n,face:t,roughness:a,mode:0,source:e.source,sourceEncoding:m,sampleCount:i,model:p,framebuffers:l,views:u})}for(let t=0;t<6;t++)this.drawEnvironmentView({texture:c,size:n,mipLevel:0,face:t,roughness:1,mode:1,source:e.source,sourceEncoding:m,sampleCount:i,model:p,framebuffers:l,views:u});return e.brdfLUTTexture||this.drawEnvironmentView({texture:f,size:r,mipLevel:0,face:0,roughness:0,mode:2,source:e.source,sourceEncoding:m,sampleCount:i,model:p,framebuffers:l,views:u}),this.device.submit(),new B({diffuseTexture:c,specularTexture:o,brdfLUTTexture:f},!e.brdfLUTTexture)}catch(e){for(let e of c)e.destroy();throw e}finally{for(let e of l)e.destroy();for(let e of u)e.destroy()}}destroy(){this.model?.destroy(),this.model=void 0,this.modelFormat=void 0}getFilterModel(e){return this.model&&this.modelFormat!==e&&(this.model.destroy(),this.model=void 0),this.model||(this.model=new R(this.device,{id:`pbr-environment-integration-model`,fs:k,source:A,modules:[O],shaderInputs:new f({pbrEnvironmentFilter:O}),colorAttachmentFormats:[e],parameters:{depthWriteEnabled:!1}}),this.modelFormat=e),this.model}drawEnvironmentView(e){let t=e.texture.createView({id:`${e.texture.id}-${e.face}-${e.mipLevel}`,dimension:`2d`,baseMipLevel:e.mipLevel,mipLevelCount:1,baseArrayLayer:e.face,arrayLayerCount:1});e.views.push(t);let n=this.device.createFramebuffer({id:`${t.id}-framebuffer`,width:e.size,height:e.size,colorAttachments:[t],depthStencilAttachment:null});e.framebuffers.push(n),e.model.shaderInputs.setProps({pbrEnvironmentFilter:{face:e.face,roughness:e.roughness,mode:e.mode,sampleCount:e.sampleCount,sourceEncoding:e.sourceEncoding,pbrEnvironmentSource:e.source}}),e.model.predraw(this.device.commandEncoder);let r=this.device.beginRenderPass({id:`${t.id}-integration`,framebuffer:n,clearColor:[0,0,0,1],clearDepth:!1});try{e.model.draw(r)}finally{r.end()}}};function V(e,t){return e.createTexture({id:t.id,dimension:t.dimension,width:t.size,height:t.size,depth:t.dimension===`cube`?6:1,mipLevels:t.mipLevels,format:t.format,usage:T.SAMPLE|T.RENDER|T.COPY_SRC,sampler:{minFilter:`linear`,magFilter:`linear`,mipmapFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}})}var H=[{direction:[1,0,0],up:[0,-1,0]},{direction:[-1,0,0],up:[0,-1,0]},{direction:[0,1,0],up:[0,0,1]},{direction:[0,-1,0],up:[0,0,-1]},{direction:[0,0,1],up:[0,-1,0]},{direction:[0,0,-1],up:[0,-1,0]}],U=class{device;origin;matrixSnapshot;capture;depth;targets;views=[];framebuffers=[];captureTargets=[];filterTargets=[];filter;size;sampleCount;activeSampleCount;budget;maximumFaces;sameFrame;projectionMatrix=new m([1,0,0,0,0,-1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(new m().perspective({fovy:Math.PI/2,aspect:1,near:.05,far:100}));pendingFaces=new Set;captureCount=0;filteredCount=0;front;back=0;credit=0;pausedFrames=0;destroyed=!1;constructor(e,t={}){E(e.type===`webgpu`),this.device=e,this.size=t.size??32,this.sampleCount=t.sampleCount??16,this.activeSampleCount=this.sampleCount,this.budget=t.frameBudgetMilliseconds??1e3/60,this.maximumFaces=t.maximumFacesPerFrame??2,this.sameFrame=t.refreshMode===`same-frame`,E(Number.isInteger(this.size)&&this.size>0&&this.size<=e.limits.maxTextureDimension2D),E(Number.isInteger(this.sampleCount)&&this.sampleCount>0&&this.sampleCount<=1024),E(Number.isFinite(this.budget)&&this.budget>0),E(Number.isInteger(this.maximumFaces)&&this.maximumFaces>0&&this.maximumFaces<=6);let n=e.getTextureFormatCapabilities(`rgba16float`);E(n.render&&n.filter);let r=t.mipLevels??4;E(Number.isSafeInteger(r)&&r>0);let i=Math.min(r,e.getMipLevelCount(this.size,this.size));this.origin=e.createBuffer({byteLength:16,usage:D.STORAGE|D.COPY_DST}),this.capture=this.createCube(`reflection-capture`,1),this.targets=[this.createCube(`reflection-filter-a`,i),this.createCube(`reflection-filter-b`,i)],this.depth=e.createTexture({width:this.size,height:this.size,format:`depth24plus`,usage:T.RENDER});for(let e=0;e<H.length;e++)this.captureTargets.push(this.createTarget(this.capture,e,0,this.depth));for(let e of this.targets)this.filterTargets.push(H.map((t,n)=>Array.from({length:i-1},(t,r)=>this.createTarget(e,n,r+1))));this.filter=new R(e,{id:`reflection-probe-filter`,source:A,defines:{PBR_ENVIRONMENT_CUBE_SOURCE:!0},modules:[O],shaderInputs:new f({pbrEnvironmentFilter:O}),colorAttachmentFormats:[`rgba16float`],parameters:{depthWriteEnabled:!1}})}get texture(){return this.front===void 0?void 0:this.targets[this.front]}update(e){if(E(!this.destroyed),E(e.matrices.device===this.device&&e.matrices.usage&D.COPY_SRC),E(Number.isSafeInteger(e.matrixIndex)&&e.matrixIndex>=0&&(e.matrixIndex+1)*64<=e.matrices.byteLength),e.refresh===!1&&this.front!==void 0&&this.captureCount===0)return 0;this.matrixSnapshot?.byteLength!==e.matrices.byteLength&&(this.matrixSnapshot?.destroy(),this.matrixSnapshot=this.device.createBuffer({byteLength:e.matrices.byteLength,usage:D.STORAGE|D.COPY_DST|D.COPY_SRC}),this.captureCount=0,this.filteredCount=0,this.pendingFaces.clear());let t=e.frameMilliseconds,n=t!==void 0&&Number.isFinite(t)?Math.max(0,Math.min(this.budget,this.budget-t)):this.budget/4,r;if(this.sameFrame)t!==void 0&&Number.isFinite(t)&&(t>this.budget?this.activeSampleCount=Math.max(Math.min(4,this.sampleCount),Math.floor(this.activeSampleCount/2)):n>=this.budget/4&&(this.activeSampleCount=Math.min(this.sampleCount,this.activeSampleCount+1))),r=H.length*2;else{if(this.credit=Math.min(this.maximumFaces,this.credit+n),r=Math.floor(this.credit),r===0&&++this.pausedFrames>=3&&(r=1),r===0)return 0;this.credit=Math.max(0,this.credit-r)}if(this.pausedFrames=0,this.captureCount===0&&this.filteredCount===0){this.device.commandEncoder.copyBufferToBuffer({sourceBuffer:e.matrices,destinationBuffer:this.matrixSnapshot,size:e.matrices.byteLength}),this.device.commandEncoder.copyBufferToBuffer({sourceBuffer:this.matrixSnapshot,sourceOffset:e.matrixIndex*64+48,destinationBuffer:this.origin,size:16});for(let e=0;e<H.length;e++)this.pendingFaces.add(e)}let i=0;for(;i<r&&this.captureCount<H.length;){let t=this.nextFace(e.viewDirections??[]),{direction:n,up:r}=H[t];e.draw({face:t,framebuffer:this.captureTargets[t],viewMatrix:new m().lookAt({eye:[0,0,0],center:n,up:r}),projectionMatrix:this.projectionMatrix,matrices:this.matrixSnapshot,origin:this.origin}),this.pendingFaces.delete(t),this.captureCount++,i++}for(;i<r&&this.filteredCount<H.length;)this.filterFace(this.filteredCount),this.filteredCount++,i++;return this.filteredCount===H.length&&(this.front=this.back,this.back=1-this.back,this.captureCount=0,this.filteredCount=0),i}destroy(){if(!this.destroyed){this.destroyed=!0,this.filter.destroy();for(let e of this.framebuffers)e.destroy();for(let e of this.views)e.destroy();for(let e of this.targets)e.destroy();this.capture.destroy(),this.depth.destroy(),this.origin.destroy(),this.matrixSnapshot?.destroy()}}nextFace(e){let t=-1,n=-1/0;for(let r of this.pendingFaces){let i=H[r].direction,a=e.length?Math.max(...e.map(e=>{let t=Math.hypot(...e);return t>0?(i[0]*e[0]+i[1]*e[1]+i[2]*e[2])/t:0})):0;a>n&&(n=a,t=r)}return t}createCube(e,t){return this.device.createTexture({id:e,dimension:`cube`,width:this.size,height:this.size,depth:6,format:`rgba16float`,mipLevels:t,usage:T.RENDER|T.SAMPLE|T.COPY_SRC|T.COPY_DST,sampler:{minFilter:`linear`,magFilter:`linear`,mipmapFilter:`linear`}})}createTarget(e,t,n,r=null){let i=e.createView({dimension:`2d`,baseArrayLayer:t,arrayLayerCount:1,baseMipLevel:n,mipLevelCount:1});this.views.push(i);let a=Math.max(1,this.size>>n),o=this.device.createFramebuffer({width:a,height:a,colorAttachments:[i],depthStencilAttachment:r});return this.framebuffers.push(o),o}filterFace(e){let t=this.filterTargets[this.back][e];this.device.commandEncoder.copyTextureToTexture({sourceTexture:this.capture,destinationTexture:this.targets[this.back],origin:[0,0,e],destinationOrigin:[0,0,e],width:this.size,height:this.size,depthOrArrayLayers:1});for(let[n,r]of t.entries()){let i=n+1;this.filter.shaderInputs.setProps({pbrEnvironmentFilter:{face:e,roughness:i/t.length,mode:0,sampleCount:this.activeSampleCount,sourceEncoding:0,pbrEnvironmentSource:this.capture}}),this.filter.predraw(this.device.commandEncoder);let a=this.device.beginRenderPass({framebuffer:r,clearColor:[0,0,0,1],clearDepth:!1});try{this.filter.draw(a)}finally{a.end()}}}},ce=class extends B{diffuseTexture;specularTexture;brdfLUTTexture;intensity;rotation;constructor(e){super(e),this.diffuseTexture=e.diffuseTexture,this.specularTexture=e.specularTexture,this.brdfLUTTexture=e.brdfLUTTexture,this.intensity=e.intensity??1,this.rotation=e.rotation??0}},W=class{device;generator;constructor(e){this.device=e,this.generator=new se(e)}prepare(e){let t=this.device.getTextureFormatCapabilities(`rgba16float`),n=e.format??(t.render&&t.filter?`rgba16float`:`rgba8unorm`);return new ce({...this.generator.prepare({...e,format:n}).textures,intensity:e.intensity,rotation:e.rotation})}destroy(){this.generator.destroy()}},le=1/60,ue={timeStep:le,iterations:16,maximumPairs:2048,linearDamping:.04,angularDamping:.08,maximumRecoverySpeed:.5},de=[0,0,12],fe=-.95;function pe(){let e=[{position:[0,0,-.5],mass:0,shape:{type:`box`,halfExtents:[18,12,.5]}},{position:de,mass:0,shape:{type:`box`,halfExtents:[.18,.18,.18]}},{position:[de[0]+10*Math.sin(fe),0,de[2]-10*Math.cos(fe)],mass:650,shape:{type:`sphere`,radius:1.1},friction:.45,restitution:.05},...[-5.5,5.5].map(e=>({position:[0,e,6],mass:0,shape:{type:`box`,halfExtents:[.2,.2,6]}})),{position:[0,0,12.2],mass:0,shape:{type:`box`,halfExtents:[.25,5.7,.25]}}];for(let t=0;t<8;t++){let n=8-t;for(let r=0;r<n;r++)for(let i=0;i<n;i++)e.push({position:[(i-(n-1)/2)*1.01,(r-(n-1)/2)*1.01,t+.5],mass:1,shape:{type:`box`,halfExtents:[.49,.49,.5]},friction:.65,restitution:0})}return{bodies:e,joints:[{type:`distance`,first:1,second:2,distance:10}]}}var me={name:`rigidBodyPose`,uniformTypes:{matrix:`mat4x4<f32>`},source:`
struct RigidBodyPose {matrix:mat4x4f}
@group(0) @binding(auto) var<uniform> rigidBodyPose:RigidBodyPose;
@group(0) @binding(auto) var<storage,read> positions:array<vec4f>;
@group(0) @binding(auto) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(auto) var<storage,read> shapes:array<vec4f>;
@group(0) @binding(auto) var<storage,read> sleepStates:array<vec4f>;
@group(0) @binding(auto) var<storage,read> meshVertices:array<vec4f>;
`,bindingLayout:[`positions`,`orientations`,`shapes`,`sleepStates`,`meshVertices`].map(e=>({name:e,group:0}))};function he(e,t,n,r,i=!1){return`
struct Output {@builtin(position) position: vec4f, @location(0) normal: vec3f, @location(1) color: vec3f, @location(2) localNormal: vec3f, @location(3) @interpolate(flat) sphere: f32, @location(4) worldPosition: vec3f, @location(5) @interpolate(flat) body: u32, @location(6) localPoint:vec3f}
fn rotate(rotation: vec4f, vector: vec3f)->vec3f {return vector+2.0*cross(rotation.xyz,cross(rotation.xyz,vector)+rotation.w*vector);}
${e===`wreckingBall`?`
// Pack box triangles and the single sphere into one draw; no collapsed sphere vertices per box.
@vertex fn vertexMain(@builtin(vertex_index) renderVertex:u32)->Output {
 let sphere=renderVertex>=${(t-(i?2:1))*36}u;
 let box=renderVertex/36u+${i?1:0}u;
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
`}var G={type:`spot`,position:[-8,-12,32],direction:[8,12,-32],color:[255,230,194],intensity:24,attenuation:[1,0,.004],innerConeAngle:.38,outerConeAngle:.48},ge=class{renderer;caster;constructor(e,t,n,r){this.renderer=new c(e,{quality:`balanced`,directionalLightCapacity:0,spotLightCapacity:1,pointLightCapacity:0,spotMapSize:2048}),this.caster=new d(e,{id:`rigid-body-shadow-casters`,modules:[me],source:n+`
@fragment fn fragmentMain(){}`,...r,colorAttachmentFormats:[],depthStencilAttachmentFormat:`depth32float`,parameters:{depthWriteEnabled:!0,depthCompare:`less-equal`,cullMode:`none`},bindings:t})}render(e,t){return this.renderer.render({camera:{viewMatrix:e,projectionMatrix:t,near:.1,far:200,clipDepth:`zero-to-one`},spotLights:[{position:G.position,direction:G.direction,outerConeAngle:G.outerConeAngle,range:80,normalBias:.008,sourceRadius:.025,depthBias:2,depthBiasSlopeScale:2}],drawShadowCasters:e=>{this.caster.shaderInputs.setProps({rigidBodyPose:{matrix:e.viewProjectionMatrix}}),this.caster.setParameters({...e.rasterParameters,cullMode:`none`}),this.caster.draw(e.renderPass)}})}destroy(){this.caster.destroy(),this.renderer.destroy()}},_e={robotArm:{title:`Mechanisms · robot arm`,description:`Four driven joints carry a calibrated payload. Lower the elbow to press the tool against the work stop, or reduce the elbow torque to see the load pull it down.`},wreckingBall:{title:`Wrecking ball`,description:`Release a 650-unit steel wrecking ball into a stepped pyramid of 204 one-unit blocks. A ten-unit distance joint suspends the ball from the gantry; gravity and real contacts drive the demolition. Pause to inspect the impact, or Reset to rebuild the pyramid and raise the ball. Drag to orbit and scroll to zoom. Parallel block contacts alternate with a distance-joint solve on the GPU; the real-time percentage shows when simulation cannot keep pace.`},dominoJunction:{title:`Domino junction`,description:`One falling row starts two branches. Both paths converge on a shared receiver that tips the final row. Reset to replay the same physical contacts.`},dominoSpiral:{title:`Spiral dominoes`,description:`A single nudge tips the innermost domino. Real box contacts carry the falling wave outward along three turns of an Archimedean spiral. Every domino is a free rigid body; no timed animation or scripted impulses drive the sequence. Reset rebuilds the upright spiral and replays the first nudge without changing your camera.`},suspension:{title:`Mechanisms · spring suspension`,description:`A suspended platform uses an implicit damped spring. It compresses under gravity and settles; push it to test damping and connected-island waking.`},servo:{title:`Mechanisms · position-driven hinge`,description:`A hinge tracks a 0.8-radian target with a compliant position drive and capped torque. Push the arm to disturb it; the drive returns it to its target within the authored limits.`},cradle:{title:`Mechanisms · Newton's cradle`,description:`Five equal-mass spheres hang from distance constraints. The raised end ball transfers momentum through nearly touching, polished balls with slightly inelastic impacts. Reset releases it again. This scene uses 480 Hz substeps and low-speed contact settling to resolve closely spaced impacts. Gentle velocity damping models air and suspension losses. The stone frame has matching static colliders, so pushed balls rebound from it. The scene restarts after one simulated minute.`},pendulum:{title:`Mechanisms · pendulum`,description:`A distance constraint suspends a sphere. Joint rows share the ordered contact solver. This first joint envelope keeps connected bodies awake and does not warm-start joints.`},hinge:{title:`Mechanisms · motorized hinge`,description:`A hinged bar has angular limits and a torque-capped velocity motor. It can interact with the loose box. The hinge axis is the attachment frame Z axis; angular limits use wrapped radians.`},slider:{title:`Mechanisms · powered slider`,description:`A motor pushes a constrained carriage toward its linear stop and into a loose box. Translation is free only along the attachment Z axis; orientation is locked. Motor force is capped per step, independently of solver iteration count.`},continuous:{title:`Fast sphere / thin walls`,description:`A fast sphere crosses many wall thicknesses each step. Bounded sphere/static-surface CCD catches the walls and restitutes the remaining motion. Failed CCD steps roll back on the GPU. This qualifies translational spheres against static surfaces, not general rotating or dynamic-pair CCD.`},mesh:{title:`Mesh openings`,description:`Two moving triangle-mesh cubes fall toward an original triangle-mesh frame. One passes through the opening and lands on the floor; the other lands on the frame. Collision uses the original triangles, not a convex hull of the frame. This is discrete surface contact: high-speed tunneling and initially contained meshes still require separate handling.`},deep:{title:`Deep stack`,description:`Eight boxes form one connected stack. Compare drift, penetration and settling between solvers and iteration counts. This is a stability fixture, not a universal supported stack-depth guarantee.`},massRatio:{title:`Heavy-on-light stack`,description:`A box ten times heavier than its supports loads a four-box stack. This exposes convergence limits; compare ordered and parallel solving at 16, 32 and 64 iterations.`},support:{title:`Moving support`,description:`A kinematic platform moves at 0.5 units per second. Contact friction carries the boxes; the platform receives no impulses and must keep supported islands awake.`},friction:{title:`Static friction`,description:`Gravity has a horizontal component. Static friction 0.8 can hold the box, while dynamic friction is only 0.1. The solver tests the required accumulated impulse against the static cone rather than switching at an arbitrary slip speed.`},stack:{title:`Independent stacks`,description:`Three five-box stacks share a static floor. Each stack can sleep independently. Push the first stack to test waking and friction; gray bodies are sleeping.`},mixed:{title:`Mixed-shape field`,description:`256 boxes and spheres with varied sizes land on one large floor. This exercises hierarchical discovery and sparse contact storage beyond the 128-body all-pairs reference limit. It is a moderate-density scene, not a dense-stack performance claim.`},impact:{title:`Unequal-mass impact`,description:`A unit-mass sphere strikes a stationary sphere of mass two without gravity or friction. At restitution one, the light sphere reverses direction. The colored bands expose rotation. Reset to replay.`},torque:{title:`Off-center impact`,description:`A sphere strikes a heavier box away from its center. Contact impulses transfer both linear momentum and angular momentum. Reset or push the box to explore rotation.`}};function ve(e){if(e===`dominoJunction`)return Se();if(e===`dominoSpiral`)return we();if(e===`continuous`)return[{position:[-3,0,1],velocity:[180,0,0],shape:{type:`sphere`,radius:.2},restitution:1,friction:0},{position:[-5,0,1],mode:`static`,shape:{type:`box`,halfExtents:[.03,2,2]},restitution:1},{position:[5,0,1],mode:`static`,shape:{type:`box`,halfExtents:[.03,2,2]},restitution:1}];if(e===`mesh`){let e=P(Array.from({length:8},(e,t)=>[t&1?.25:-.25,t&2?.25:-.25,t&4?.25:-.25]).flat()),t=[],n=[];for(let[e,r]of[[[-1.5,0,0],[.5,2,.25]],[[1.5,0,0],[.5,2,.25]],[[0,-1.5,0],[1,.5,.25]],[[0,1.5,0],[1,.5,.25]]]){let i=P(Array.from({length:8},(t,n)=>e.map((e,t)=>e+(n&1<<t?1:-1)*r[t])).flat()),a=t.length/3;t.push(...i.positions),n.push(...i.indices.map(e=>a+e))}return[{position:[0,0,-.5],mass:0,shape:{type:`box`,halfExtents:[7,7,.5]},restitution:0},{position:[0,0,3],mass:0,shape:{type:`triangle-mesh`,geometry:F(t,n)},restitution:0},{position:[0,0,5],shape:{type:`triangle-mesh`,geometry:e},restitution:0},{position:[1.5,0,5],shape:{type:`triangle-mesh`,geometry:e},restitution:0}]}if(e===`impact`)return[{shape:{type:`sphere`,radius:.5},position:[-2,0,1],velocity:[3,0,0],mass:1,restitution:1,friction:0},{shape:{type:`sphere`,radius:.5},position:[0,0,1],mass:2,restitution:1,friction:0}];let t=[{shape:{type:`box`,halfExtents:[14,14,.5]},position:[0,0,-.5],mass:0,restitution:0,friction:.7}];if(e===`torque`)t.push({shape:{type:`box`,halfExtents:[.8,.45,.6]},position:[0,0,.6],mass:3}),t.push({shape:{type:`sphere`,radius:.35},position:[-4,.3,.7],velocity:[6,0,0],restitution:.5});else if(e===`support`){t[0]={shape:{type:`box`,halfExtents:[8,4,.5]},position:[0,0,-.5],mode:`kinematic`,mass:1,velocity:[.5,0,0],friction:1,restitution:0};for(let e=0;e<4;e++)t.push({shape:{type:`box`,halfExtents:[.5,.5,.5]},position:[(e-1.5)*2,0,.5],friction:1,restitution:0})}else if(e===`friction`){let e={staticFriction:.8,dynamicFriction:.1,restitution:0};t[0]={position:[0,0,-.5],mass:0,colliders:[{shape:{type:`box`,halfExtents:[14,14,.5]},material:e}]},t.push({position:[0,0,.5],colliders:[{shape:{type:`box`,halfExtents:[.5,.5,.5]},material:e}]})}else if(e===`deep`||e===`massRatio`){let n=e===`deep`?8:4;for(let r=0;r<n;r++)t.push({shape:{type:`box`,halfExtents:[.5,.5,.5]},position:[0,0,.5+r],mass:e===`massRatio`&&r===n-1?10:1,restitution:0,friction:.8})}else if(e===`mixed`)for(let e=0;e<256;e++){let n=.25+e%4*.05;t.push({shape:e%2?{type:`sphere`,radius:n}:{type:`box`,halfExtents:[n,n,n]},position:[(e%16-7.5)*1.4,(Math.floor(e/16)-7.5)*1.4,1+e%5*.35],restitution:.15,friction:.6})}else for(let e=0;e<3;e++)for(let n=0;n<5;n++){let r=e===1?.25:0;t.push({shape:{type:`box`,halfExtents:[.5,.5,.5]},position:[(e-1)*2.5,0,.5+n*1.01],orientation:[0,0,Math.sin(r/2),Math.cos(r/2)],restitution:0,friction:.7})}return t}function ye(e){return e===`impact`||e===`continuous`?[0,0,0]:e===`friction`?[3,0,-9.81]:[0,0,-9.81]}function be(e){return Object.hasOwn(_e,e)}var xe={maximumPairs:4096,linearDamping:.2,angularDamping:1,sleepAfter:.6,sleepLinearSpeed:.2,sleepAngularSpeed:.35,penetrationRecoveryFraction:.04,maximumRecoverySpeed:.1};function K(e){return e===`dominoSpiral`||e===`dominoJunction`}function Se(){let e=[{position:[0,0,-.25],mass:0,shape:{type:`box`,halfExtents:[13,6,.25]},friction:.65}],t=(t,n,r=0)=>{e.push(Ce(t,n,r,e.length===1))};for(let e=0;e<8;e++)t(-11.2+e*.62,0);for(let e of[-1,1])for(let n=0;n<=19;n++){let r=n/19,i=-6.24+11.78*r,a=e*(.34+2.65*Math.sin(Math.PI*r)**2),o=e*2.65*Math.PI*Math.sin(2*Math.PI*r)/11.78;t(i,a,Math.atan(o))}for(let e=0;e<=8;e++)t(6.16+e*.62,0);return e}function Ce(e,t,n,r){let i=r?.22:0,a=.1*(1-Math.cos(i))+.75*Math.sin(i),o=.1*Math.sin(i)+.75*Math.cos(i);return{position:[e+a*Math.cos(n),t+a*Math.sin(n),o],orientation:[-Math.sin(n/2)*Math.sin(i/2),Math.cos(n/2)*Math.sin(i/2),Math.sin(n/2)*Math.cos(i/2),Math.cos(n/2)*Math.cos(i/2)],velocity:r?[1.5*o*Math.cos(n),1.5*o*Math.sin(n),-1.5*(-.1*Math.cos(i)+.75*Math.sin(i))]:[0,0,0],angularVelocity:r?[-Math.sin(n)*1.5,Math.cos(n)*1.5,0]:[0,0,0],shape:{type:`box`,halfExtents:[.1,.32,.75]},mass:1,friction:.65,restitution:0}}function we(){let e=[{position:[0,0,-.25],mass:0,shape:{type:`box`,halfExtents:[9,9,.25]},friction:.65,restitution:0}],t=1.8/(2*Math.PI),n=0;for(;n<Math.PI*6;){let r=3+t*n,i=t*Math.cos(n)-r*Math.sin(n),a=t*Math.sin(n)+r*Math.cos(n),o=Math.atan2(a,i);e.push(Ce(r*Math.cos(n),r*Math.sin(n),o,e.length===1)),n+=.52/Math.hypot(r,t)}return e}function Te(e,t,n){let r=new Uint8Array(t.length*4);for(let e=0;e<t.length;e++){let t=n===`wreckingBall`&&e===2,i=t?.18:e===0?.82:K(n)?.43:.72;r.set([255,Math.round(i*255),t?255:0,255],e*4)}let i=e.createTexture({id:`lab-material-parameters`,width:t.length,height:1,format:`rgba8unorm`,data:r,sampler:{minFilter:`nearest`,magFilter:`nearest`}}),a=y(e,{id:`lab-pbr-material`,uniforms:{metallicRoughnessValues:[1,1],metallicRoughnessUVSet:1,IBLenabled:!0},bindings:{pbr_metallicRoughnessSampler:i}}),o=Ee(e);return{material:a,environment:o,destroy(){a.destroy(),i.destroy(),o.destroy()}}}function Ee(e){let t=new Uint8Array(2048*4);for(let e=0;e<32;e++){let n=e<16?220:140;for(let r=0;r<64;r++)t.set([n,n,n,255],(e*64+r)*4)}let n=e.createTexture({width:64,height:32,format:`rgba8unorm`,data:t}),r=new W(e),i=r.prepare({source:n,sourceEncoding:`srgb`,size:32,sampleCount:32});return r.destroy(),n.destroy(),i}var De=[new URL(``+new URL(`impactPlate_light_000-TjuzBlrs.ogg`,import.meta.url).href,``+import.meta.url),new URL(``+new URL(`impactPlate_light_001-DPqoBP1A.ogg`,import.meta.url).href,``+import.meta.url),new URL(``+new URL(`impactPlate_light_002-B4JsT95g.ogg`,import.meta.url).href,``+import.meta.url)],Oe=class{soundEnabled=!1;audioGeneration=0;discardNextBatch=!1;get enabled(){return this.soundEnabled}set enabled(e){e!==this.soundEnabled&&(this.soundEnabled=e,this.audioGeneration++,this.discardNextBatch=e,e||this.silence())}get generation(){return this.audioGeneration}context;samples=[];loading;sources=new Set;timelineOrigin;soundedBodies=new Set;unlock(){if(this.enabled)try{this.context??=new AudioContext;let e=this.context;e.resume().catch(()=>{}),this.loading??=Promise.all(De.map(async t=>{let n=await fetch(t);if(!n.ok)throw Error(`Audio unavailable`);let r=(await e.decodeAudioData(await n.arrayBuffer())).getChannelData(0),i=0;for(let e of r)i=Math.max(i,Math.abs(e));let a=0;for(;a<r.length&&Math.abs(r[a])<i*.12;)a++;a=Math.max(0,a-Math.ceil(e.sampleRate*5e-4));let o=e.createBuffer(1,Math.ceil(e.sampleRate*.018),e.sampleRate),s=o.getChannelData(0);for(let t=0;t<s.length;t++){let n=t/e.sampleRate;s[t]=(r[a+t]??0)/Math.max(i,.001)*Math.min(1,n/4e-4)*Math.exp(-n/.0035)}return o})).then(e=>{this.samples=e}).catch(()=>{this.loading=void 0})}catch{this.enabled=!1}}play(e,t=1/60,n=e.at(-1)?.step??0,r=this.audioGeneration){if(!this.enabled||r!==this.audioGeneration)return;if(this.discardNextBatch){this.discardNextBatch=!1;return}let i=this.context;if(!this.enabled||!i||i.state!==`running`||!this.samples.length)return;let a=e.filter(e=>e.phase!==`end`&&e.normalImpulse>=.015&&!e.bodies.includes(0)&&!this.soundedBodies.has(Math.max(...e.bodies)));if(!a.length)return;let o=Math.min(...a.map(e=>e.step)),s=i.currentTime;(this.timelineOrigin===void 0||s-(this.timelineOrigin+n*t)>.2)&&(this.timelineOrigin=s+.02-o*t);for(let n of e){if(n.phase===`end`||n.normalImpulse<.015||n.bodies.includes(0))continue;let e=Math.max(...n.bodies);if(this.soundedBodies.has(e))continue;this.soundedBodies.add(e);let r=Math.max(s+.005,this.timelineOrigin+n.step*t),a=i.createGain(),o=Math.min(.12,.05+Math.sqrt(n.normalImpulse)*.04);a.gain.setValueAtTime(o,r),a.gain.setValueAtTime(o,r+.002),a.gain.exponentialRampToValueAtTime(1e-4,r+.018);let c=i.createBufferSource();c.buffer=this.samples[e%this.samples.length];let l=i.createBiquadFilter();l.type=`highpass`,l.frequency.value=700,l.Q.value=.5,c.connect(l).connect(a).connect(i.destination),this.sources.add(c),c.start(r),c.stop(r+.02),c.onended=()=>{this.sources.delete(c),c.disconnect(),l.disconnect(),a.disconnect()}}}silence(){for(let e of this.sources)e.stop();this.sources.clear()}reset(){this.audioGeneration++,this.discardNextBatch=!1,this.silence(),this.soundedBodies.clear(),this.timelineOrigin=void 0}destroy(){this.silence(),this.context?.close().catch(()=>{})}},ke=class extends u{geometry;physics;constructor(e){super(e),this.geometry=e.geometry,this.physics=e}};function Ae(e){let t={bodies:[],publicationBounds:[],bindings:[]},n=new Set;return e.traverse((e,{worldMatrix:r})=>{if(!(e instanceof ke)||e.physics.collision===!1)return;if(n.has(e.id))throw Error(`Duplicate physics node`);n.add(e.id);let i=new m(r).multiplyRight(e.matrix),a=e.physics.collision,o=a?.position??[i[12],i[13],i[14]],s=new m(new m().translate(o).multiplyRight(new m().fromQuaternion(l(a?.orientation)))).invert().multiplyRight(i),c=e.geometry.attributes.POSITION;if(!c||c.size!==3||c.value.length<9)throw Error(`Invalid physics geometry`);let u=[];for(let e=0;e<c.value.length;e+=3)u.push(...s.transformAsPoint([c.value[e],c.value[e+1],c.value[e+2]]));let d=[1/0,1/0,1/0],f=[-1/0,-1/0,-1/0];for(let e=0;e<u.length;e++)d[e%3]=Math.min(d[e%3],u[e]),f[e%3]=Math.max(f[e%3],u[e]);if(![...d,...f].every(Number.isFinite))throw Error(`Invalid geometry transform`);let p=e.geometry instanceof g&&[1,2,4,6,8,9,12,13,14].every(e=>Math.abs(s[e])<1e-8),h=()=>p?{type:`box`,halfExtents:f}:e.physics.geometryMode===`triangle-mesh`?{type:`triangle-mesh`,geometry:F(u,e.geometry.indices?Array.from(e.geometry.indices.value):Array.from({length:u.length/3},(e,t)=>t))}:{type:`convex-hull`,geometry:P(u)},_=e.physics.body?.mode??((e.physics.body?.mass??0)===0?`static`:`dynamic`);t.bindings.push({node:e,body:t.bodies.length,localMatrix:s}),t.bodies.push(a?structuredClone(a):{position:o,shape:h(),mode:_,mass:_===`static`?0:1,...e.physics.body}),t.publicationBounds.push([d,f])}),t}var je=class extends ke{constructor(e,t,n,r){super({id:e,geometry:t,matrix:n,collision:r,body:{mode:`static`,restitution:.25,friction:.5}})}};function Me(){let e=new g;return new S({id:`cradle-frame`,children:[new je(`left-leg`,e,new m().translate([-4.2,0,1.95]).scale([.3,.3,1.95])),new je(`right-leg`,e,new m().translate([4.2,0,1.95]).scale([.3,.3,1.95])),new je(`crossbar`,e,new m().translate([0,0,4.2]).scale([4.5,.3,.3]))]})}function Ne(e){return Ae(e).bodies}function Pe(e){if(e===`robotArm`)return s();if(e===`wreckingBall`)return pe();let t={position:[0,0,4],mass:0,shape:{type:`box`,halfExtents:[.2,.2,.2]}},n={position:[0,0,-.5],mass:0,shape:{type:`box`,halfExtents:[8,8,.5]}};if(e===`suspension`)return{bodies:[n,{...t,position:[0,0,4]},{position:[0,0,2],mass:2,shape:{type:`box`,halfExtents:[.8,.5,.25]}}],joints:[{type:`distance`,first:1,second:2,distance:1.5,spring:{stiffness:80,damping:6}}]};if(e===`servo`)return{bodies:[n,{...t,position:[0,0,3]},{position:[0,0,3],shape:{type:`box`,halfExtents:[1.5,.2,.2]}}],joints:[{type:`hinge`,first:1,second:2,limits:[-1.2,1.2],motor:{position:.8,stiffness:40,damping:8,maximumForce:15}}]};if(e===`pendulum`)return{bodies:[n,t,{position:[1.5,0,2],shape:{type:`sphere`,radius:.4}}],joints:[{type:`distance`,first:1,second:2,distance:2.5}]};if(e===`cradle`){let e=[n],r=[];for(let n=0;n<5;n++){let i=(n-2)*.81,a=n===0?-.65:0,o=e.length;e.push({...t,position:[i,0,4],shape:{type:`box`,halfExtents:[.08,.08,.08]}},{position:[i+2.5*Math.sin(a),0,4-2.5*Math.cos(a)],mass:1,shape:{type:`sphere`,radius:.4},restitution:.985,friction:.02}),r.push({type:`distance`,first:o,second:o+1,distance:2.5})}let i=Me();return e.push(...Ne(i)),{bodies:e,joints:r,frame:i}}return e===`hinge`?{bodies:[n,t,{position:[0,0,2.5],shape:{type:`box`,halfExtents:[.2,.2,1.5]}},{position:[1.8,0,.5],shape:{type:`box`,halfExtents:[.5,.5,.5]}}],joints:[{type:`hinge`,first:1,second:2,firstFrame:{orientation:[Math.SQRT1_2,0,0,Math.SQRT1_2]},secondFrame:{position:[0,0,1.5],orientation:[Math.SQRT1_2,0,0,Math.SQRT1_2]},limits:[-1.1,1.1],motor:{velocity:.6,maximumForce:20}}]}:e===`slider`?{bodies:[n,{position:[0,0,1],mass:0,shape:{type:`box`,halfExtents:[.15,.15,.15]}},{position:[0,0,1],shape:{type:`box`,halfExtents:[.5,.5,.5]}},{position:[1.6,0,.5],shape:{type:`box`,halfExtents:[.5,.5,.5]}}],joints:[{type:`slider`,first:1,second:2,firstFrame:{orientation:[0,Math.SQRT1_2,0,Math.SQRT1_2]},secondFrame:{orientation:[0,Math.SQRT1_2,0,Math.SQRT1_2]},limits:[-2,2],motor:{velocity:1,maximumForce:30}}]}:null}function Fe(e,t,n){let r=e.createTexture({id:`cradle-reflection-capture`,dimension:`cube`,width:256,height:256,depth:6,format:`rgba16float`,usage:T.RENDER|T.SAMPLE,sampler:{minFilter:`linear`,magFilter:`linear`}}),i=e.createTexture({width:256,height:256,format:`depth24plus`,usage:T.RENDER}),a=new m([1,0,0,0,0,-1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(new m().perspective({fovy:Math.PI/2,aspect:1,near:.05,far:50}));for(let[o,s]of[{direction:[1,0,0],up:[0,-1,0]},{direction:[-1,0,0],up:[0,-1,0]},{direction:[0,1,0],up:[0,0,1]},{direction:[0,-1,0],up:[0,0,-1]},{direction:[0,0,1],up:[0,-1,0]},{direction:[0,0,-1],up:[0,-1,0]}].entries()){let c=new m().lookAt({eye:t,center:[t[0]+s.direction[0],t[1]+s.direction[1],t[2]+s.direction[2]],up:s.up}),l=r.createView({dimension:`2d`,mipLevelCount:1,baseArrayLayer:o,arrayLayerCount:1}),u=e.createFramebuffer({width:256,height:256,colorAttachments:[l],depthStencilAttachment:i});n(u,c,a),e.submit(),u.destroy(),l.destroy()}let o=e.createTexture({width:512,height:256,format:`rgba16float`,usage:T.RENDER|T.SAMPLE,sampler:{minFilter:`linear`,magFilter:`linear`}}),s=e.createFramebuffer({colorAttachments:[o],depthStencilAttachment:null}),c=new R(e,{id:`cradle-reflection-panorama`,colorAttachmentFormats:[`rgba16float`],source:`@group(0) @binding(0) var reflectionCapture:texture_cube<f32>;
@group(0) @binding(1) var reflectionSampler:sampler;
@fragment fn fragmentMain(input:FragmentInputs)->@location(0) vec4f {
 // Fragment position uses the same top-left image origin as the environment integrator.
 let coordinate=input.Position.xy/vec2f(512,256);
 let longitude=(coordinate.x-0.5)*6.283185307;let latitude=coordinate.y*3.141592654;
 let direction=vec3f(cos(longitude)*sin(latitude),cos(latitude),sin(longitude)*sin(latitude));
 return textureSampleLevel(reflectionCapture,reflectionSampler,direction,0);
}`,bindings:{reflectionCapture:r,reflectionSampler:r.sampler},shaderLayout:{attributes:[],bindings:[{name:`reflectionCapture`,group:0,location:0,type:`texture`,viewDimension:`cube`},{name:`reflectionSampler`,group:0,location:1,type:`sampler`}]}}),l=e.beginRenderPass({framebuffer:s,clearColor:[0,0,0,1],clearDepth:!1});c.draw(l),l.end(),e.submit();let u=new W(e),d=u.prepare({source:o,sourceEncoding:`linear`,size:128,sampleCount:64});return e.submit(),u.destroy(),c.destroy(),s.destroy(),o.destroy(),i.destroy(),r.destroy(),d}var q={type:`spot`,position:[0,-10,30],direction:[0,10,-30],color:[1,244/255,230/255],intensity:16.4,attenuation:[1,0,.004],innerConeAngle:.127,outerConeAngle:.209},Ie=class{root=new S({id:`newtons-cradle`});renderer;environment;reflectionEnvironment;materials;textures;constructor(e,t,n){this.renderer=new v(e);let r=new Uint8Array(256*128*4);for(let e=0;e<128;e++)for(let t=0;t<256;t++){let n=(e*256+t)*4,i=t>25&&t<65&&e>20&&e<65||t>155&&t<180&&e>35&&e<100?255:e>64?145:100;r.set([i,i,Math.min(255,i+8),255],n)}let i=e.createTexture({width:256,height:128,format:`rgba8unorm`,data:r}),a=new W(e);this.environment=a.prepare({source:i,sourceEncoding:`srgb`,size:64,sampleCount:64}),a.destroy(),i.destroy();let o=new Uint8Array(16384*4),s=new Uint8Array(o.length);for(let e=0;e<128;e++)for(let t=0;t<128;t++){let n=(e*128+t)*4,r=Math.sin(t*.31+Math.sin(e*.23)*3)*Math.cos(e*.27);o.set([128+Math.round(r*16),128+Math.round(Math.cos(t*.29+e*.37)*16),253,255],n),s.set([255,Math.round(160+r*25),0,255],n)}let c={minFilter:`linear`,magFilter:`linear`,addressModeU:`repeat`,addressModeV:`repeat`},l=e.createTexture({width:128,height:128,format:`rgba8unorm`,data:o,sampler:c}),u=e.createTexture({width:128,height:128,format:`rgba8unorm`,data:s,sampler:c});this.textures=[l,u],this.materials={stone:{id:`cradle-stone`,uniforms:{baseColorFactor:[.16,.18,.2,1],metallicRoughnessValues:[0,1],normalScale:.5,IBLenabled:!0},bindings:{pbr_normalSampler:l,pbr_metallicRoughnessSampler:u}},steel:{id:`cradle-steel`,uniforms:{baseColorFactor:[.8,.82,.85,1],metallicRoughnessValues:[1,.07],IBLenabled:!0}},table:{id:`cradle-table`,uniforms:{baseColorFactor:[.55,.52,.47,1],metallicRoughnessValues:[0,.85],IBLenabled:!0}},thread:{id:`cradle-thread`,uniforms:{baseColorFactor:[.1,.12,.14,1],metallicRoughnessValues:[.5,.4],IBLenabled:!0}}};let d=new g,f=new C({nlat:32,nlong:64}),p=[{id:`table`,geometry:d,matrix:new m().translate([0,0,-.5]).scale([8,8,.5]),material:`table`}];n.traverse((e,{worldMatrix:t})=>{e instanceof je&&p.push({id:e.id,geometry:e.geometry,matrix:new m(t).multiplyRight(e.matrix),material:`stone`})});for(let e=0;e<5;e++)p.push({id:`ball-${e}`,geometry:f,matrix:new m().scale([.4,.4,.4]),body:e*2+2,material:`steel`}),p.push({id:`tether-${e}`,geometry:d,matrix:new m,body:e*2+2,anchor:e*2+1,material:`thread`});let h=new Map;this.root.transformSource={getFrame:()=>({matrices:t.poseMatrices,matrixCount:t.count,revision:0,bindings:h})};let _=new S({id:`cradle-reflection`}),y=[];for(let e of p){let t=new x({id:e.id,geometry:e.geometry,material:this.materials[e.material],matrix:e.matrix,...e.anchor===void 0?{}:{connection:{first:e.anchor,second:e.body,radius:.018}}});this.root.add(t),e.body===void 0?_.add(t):h.set(t,{matrixIndex:e.body,localMatrix:e.matrix}),e.material===`steel`&&y.push(t)}let b=new v(e),ee=[0,0,1.5];this.reflectionEnvironment=Fe(e,ee,(e,t,n)=>{b.render({scene:_,framebuffer:e,camera:{viewMatrix:t,projectionMatrix:n,position:ee},lights:[q],environment:this.environment,background:[.787,.828,.768,1],outputColorSpace:`linear`,toneMapMode:0})}),b.destroy();for(let e of y)e.environment=this.reflectionEnvironment}draw(e,t,n){this.renderer.render({scene:this.root,camera:{viewMatrix:e,projectionMatrix:t,position:n,near:.1,far:200,clipDepth:`zero-to-one`},lights:[q],environment:this.environment,background:[.025,.03,.04,1],spotShadows:{spotLights:[{position:q.position,direction:q.direction,outerConeAngle:q.outerConeAngle,range:60,normalBias:.015,sourceRadius:.025,depthBias:2,depthBiasSlopeScale:2}]}})}destroy(){this.renderer.destroy(),this.root.destroy();for(let e of this.textures)e.destroy();this.environment.destroy(),this.reflectionEnvironment.destroy()}},Le=[{...G,color:[1,230/255,194/255]},{type:`ambient`,color:[1,1,1],intensity:.3}],Re=[.9,.92,.89,1],ze=class{root=new S({id:`wrecking-ball`});renderer;environment;probe;captureRoots;captureMatrices;reflectionEnvironment;constructor(e,t,n){this.world=t,this.renderer=new v(e),this.environment=Ee(e),this.reflectionEnvironment={...this.environment},this.probe=new U(e,{size:64,sampleCount:8,mipLevels:2,refreshMode:`same-frame`});let r=new Map;this.root.transformSource={getFrame:()=>({matrices:t.poseMatrices,matrixCount:t.count,revision:0,bindings:r})};let i=new g,a=new C({nlat:24,nlong:48}),o=[{id:`plinth`,uniforms:{baseColorFactor:[.45,.43,.38,1],metallicRoughnessValues:[0,.8]}},{id:`frame`,uniforms:{baseColorFactor:[.2,.23,.26,1],metallicRoughnessValues:[.7,.3]}},{id:`ball`,uniforms:{baseColorFactor:[.54,.57,.61,1],metallicRoughnessValues:[.96,.15]}},{id:`blocks`,uniforms:{baseColorFactor:[.65,.36,.13,1],metallicRoughnessValues:[0,.65]}}],s=[];for(let[e,t]of n.entries()){let n=t.shape;if(n.type!==`box`&&n.type!==`sphere`)throw Error(`Wrecking ball requires primitives`);let c=new m().scale(n.type===`box`?n.halfExtents:[n.radius,n.radius,n.radius]),l=new x({id:`body-${e}`,geometry:n.type===`sphere`?a:i,material:o[e===0?0:e===2?2:e<6?1:3],matrix:new m().translate(t.position??[0,0,0]).multiplyRight(c)});r.set(l,{matrixIndex:e,localMatrix:c}),this.root.add(l),e===2&&(l.environment=this.reflectionEnvironment),(e===0||e>=6)&&s.push(l)}this.root.add(new x({id:`pendulum`,geometry:i,material:o[1],connection:{first:1,second:2,radius:.025}})),this.captureRoots=Array.from({length:6},()=>new S({children:s,transformSource:{getFrame:()=>({matrices:this.captureMatrices,matrixCount:t.count,revision:0,bindings:r})}}))}draw(e,t,n,{frameMilliseconds:r,advanced:i}={advanced:!0}){this.probe.update({matrices:this.world.poseMatrices,matrixIndex:2,frameMilliseconds:r,refresh:i,viewDirections:[[e[2],e[6],e[10]]],draw:e=>{this.captureMatrices=e.matrices,this.renderer.render({scene:this.captureRoots[e.face],framebuffer:e.framebuffer,camera:{viewMatrix:e.viewMatrix,projectionMatrix:e.projectionMatrix,position:[0,0,0],gpuOrigin:e.origin},environment:this.environment,lights:Le,background:Re,transmission:!1,rasterParameters:{frontFace:`cw`},toneMapMode:0,outputColorSpace:`linear`})}}),this.probe.texture&&(this.reflectionEnvironment.specularTexture=this.probe.texture),this.renderer.render({scene:this.root,camera:{viewMatrix:e,projectionMatrix:t,position:n,near:.1,far:200,clipDepth:`zero-to-one`},environment:this.environment,lights:Le,background:Re,spotShadows:{spotLights:[{position:G.position,direction:G.direction,outerConeAngle:G.outerConeAngle,range:80,normalBias:.008,sourceRadius:.025,depthBias:2,depthBiasSlopeScale:2}]}})}destroy(){this.renderer.destroy(),this.probe.destroy(),this.root.destroy(),this.environment.destroy()}},Be=[5,-8,5],Ve=[1.8,0,1.5],He=document.querySelector(`#status`),J=document.querySelector(`#world`),Y=document.querySelector(`#scene`),Ue=document.body.dataset.scene??new URLSearchParams(window.location.search).get(`scene`);Ue&&be(Ue)&&(Y.value=Ue);var X=document.body.dataset.scene===`wreckingBall`,Z=document.querySelector(`#solver`),We=document.querySelector(`#iterations`),Q=new Oe,Ge=document.querySelector(`#sound`);Ge.onchange=()=>{Q.enabled=Ge.checked,Q.unlock()},J.addEventListener(`pointerdown`,()=>Q.unlock());var $=document.querySelector(`#auto-play`),Ke=document.querySelector(`#playback-status`),qe=new n({traceTitle:`GPU Graph Timeline`}),Je=o(qe,X?`Wrecking Ball`:`Rigid Body Lab`,X?`GPU physics · 204 blocks and a heavy pendulum`:void 0);X&&(Y.hidden=!0,Ge.closest(`label`).style.display=`none`,$.closest(`label`).style.display=`none`,document.querySelector(`#push`).hidden=!0,Z.disabled=!0);var Ye=Array.from(document.querySelectorAll(`button`));try{let n=null,o=await i.createDevice({adapters:[r],optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:J,autoResize:!0,useDevicePixels:Math.max(2,window.devicePixelRatio)},onError:e=>{n=e}}),s=new a(45,1,.1,200);s.up.set(0,0,1),Y.value===`wreckingBall`?s.position.set(19,-21,16):Y.value===`robotArm`?s.position.set(...Be):s.position.set(13,-19,19);let c=new t(s,J);c.autoRotate=!0,c.autoRotateSpeed=.5,c.addEventListener(`start`,()=>{c.autoRotate=!1});let l=performance.now();Y.value===`robotArm`?c.target.set(...Ve):c.target.set(Y.value===`wreckingBall`?-2:0,0,Y.value===`wreckingBall`?4:2),c.update();let u=o.createBuffer({id:`rigid-body-camera`,byteLength:64,usage:D.UNIFORM|D.COPY_DST}),f=null;async function g(){let t=be(Y.value)?Y.value:`stack`;t!==f&&(We.value=t===`robotArm`?`64`:t===`cradle`?`8`:t===`wreckingBall`?`16`:`32`,(K(t)||t===`wreckingBall`)&&(Z.value=`parallel`),f=t);let n=Pe(t),r=n?.bodies??ve(t);n&&t!==`wreckingBall`&&(Z.value=`ordered`);let i=new ne({bodies:r,publishPoses:t===`robotArm`||t===`cradle`||t===`wreckingBall`,publicationBounds:t===`cradle`?r.map(e=>{let t=e.shape;if(t.type!==`sphere`&&t.type!==`box`)throw Error(`Cradle visual bounds require primitive geometry`);let n=t.type===`sphere`?[t.radius,t.radius,t.radius]:[...t.halfExtents];return[[-n[0],-n[1],-n[2]],n]}):void 0,joints:n?.joints,...K(t)?{...xe,eventCapacity:512,impactImpulseThreshold:.15}:{},...t===`wreckingBall`?ue:{},failurePolicy:`rollback`,timeStep:t===`cradle`?1/480:t===`wreckingBall`?le:K(t)?1/60:1/120,...t===`cradle`?{restitutionThreshold:.05,linearDamping:.08,angularDamping:.12}:{},...t===`continuous`?{continuous:{bodies:[0]}}:{},iterations:Number(We.value),solver:Z.value===`ordered`?`ordered`:`parallel`,broadPhase:t===`cradle`?`all-pairs`:`hierarchical-grid`,gravity:ye(t)});document.querySelector(`#description`).textContent=_e[t].description;let a=new h(o);i.addToGraph(a);let s=await a.compileAsync().catch(e=>{throw i.destroy(),e}),c=[],l=t===`cradle`?64:16,m=t===`cradle`?32:12,g=K(t)?36:l*m*6,_=o.createBuffer({data:new Float32Array(r.flatMap(e=>{let t=e.shape??e.colliders?.[0]?.shape;if(!t)throw Error(`This renderer requires centered shapes`);if(t.type===`sphere`)return[t.radius,0,0,0];if(t.type===`box`)return[...t.halfExtents,e.mass===0?2:1];if(t.type===`triangle-mesh`||t.type===`convex-hull`){let n=c.length/4;for(let e of t.geometry.indices){let n=e*3;c.push(t.geometry.positions[n],t.geometry.positions[n+1],t.geometry.positions[n+2],0)}return g=Math.max(g,t.geometry.indices.length),[n,t.geometry.indices.length,e.mass===0?1:0,3]}throw Error(`The lab renderer supports boxes, spheres and cooked mesh shapes`)})),usage:D.STORAGE}),v=o.createBuffer({id:`lab-mesh-vertices`,data:new Float32Array(c.length?c:[0,0,0,0]),usage:D.STORAGE}),y=t===`robotArm`||t===`cradle`||t===`wreckingBall`,b=y?null:Te(o,r,t),x=y?null:p(o,{id:`rigid-body-shapes`,material:b.material,defines:{HAS_NORMALS:!0,HAS_TANGENTS:!0,HAS_UV:!0,HAS_UV_1:!0,USE_LIGHTS:!0,USE_IBL:!0,USE_SCENE_ENVIRONMENT:!0,USE_TEX_LOD:!0,USE_SCENE_COLOR_MANAGEMENT:!0},modules:[me,e],source:`
${he(t,r.length,l,m)}
fn grainHash(point:vec2f)->f32{return fract(sin(dot(point,vec2f(127.1,311.7)))*43758.5453);}
fn surfaceGrain(point:vec2f)->f32{
 let cell=floor(point);let fraction=fract(point);let weight=fraction*fraction*(3.0-2.0*fraction);
 return mix(mix(grainHash(cell),grainHash(cell+vec2f(1,0)),weight.x),mix(grainHash(cell+vec2f(0,1)),grainHash(cell+vec2f(1,1)),weight.x),weight.y);
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {
 let band=select(1.0,0.3,input.sphere>0.5&&abs(input.localNormal.z)<0.13);
 var colorValue=input.color*band;

 ${K(t)?`

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
`,vertexCount:g,instanceCount:r.length,parameters:{depthWriteEnabled:!0,depthCompare:`less-equal`,depthFormat:`depth24plus`},bindings:{positions:i.positions,orientations:i.orientations,shapes:_,meshVertices:v,sleepStates:i.sleepStates}});x&&b&&x.shaderInputs.setProps({lighting:{lights:[{type:`ambient`,color:[160,190,230],intensity:.15},G]},ibl:{pbr_diffuseEnvSampler:b.environment.diffuseTexture,pbr_specularEnvSampler:b.environment.specularTexture,pbr_brdfLUT:b.environment.brdfLUTTexture},pbrScene:{environmentIntensity:.7,environmentRotation:0,environmentMipCount:b.environment.specularTexture.mipLevels,toneMapMode:1}});let S=n?.joints.filter(e=>e.type===`distance`)??[],C=!y&&S.length>0?new d(o,{id:`mechanism-tethers`,source:`
@group(0) @binding(0) var<uniform> matrix: mat4x4f;
@group(0) @binding(1) var<storage,read> positions: array<vec4f>;
const endpoints = array<vec2u, ${S.length}>(${S.map(e=>`vec2u(${e.first}u,${e.second}u)`).join(`,`)});
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
`,vertexCount:48,instanceCount:S.length,parameters:{depthWriteEnabled:!0,depthCompare:`less-equal`,depthFormat:`depth24plus`},bindings:{matrix:u,positions:i.positions},shaderLayout:{attributes:[],bindings:[{name:`matrix`,group:0,location:0,type:`uniform`},{name:`positions`,group:0,location:1,type:`read-only-storage`,visibility:1}]}}):null;return{shadows:y?null:new ge(o,{positions:i.positions,orientations:i.orientations,shapes:_,sleepStates:i.sleepStates,meshVertices:v},he(t,r.length,l,m,!0),{vertexCount:g,instanceCount:r.length}),surface:b,cradle:t===`cradle`?new Ie(o,i,n.frame):t===`robotArm`?new ee(o,i):t===`wreckingBall`?new ze(o,i,r):null,world:i,graph:s,model:x,tether:C,shapes:_,meshVertices:v,bodies:r,sceneName:t,capacity:i.getCapacityInfo()}}let _=await g(),v=document.querySelector(`#arm-controls`),y=e=>document.querySelector(`#arm-${e}`),b=()=>Number(y(`angle`).value)*Math.PI/180;function x(e){v&&(v.hidden=_.sceneName!==`robotArm`,!v.hidden&&((!e||e===y(`payload`))&&_.world.setBodyParameters(6,{mass:Number(y(`payload`).value)}),(!e||e!==y(`payload`))&&_.world.setAngularActuator(`elbow`,1,{angle:b(),...e===y(`angle`)?{}:{maximumTorque:Number(y(`torque`).value)}})))}x(),v&&(v.oninput=e=>{C||x(e.target)});let S=X,C=!1,w=!0,T=performance.now(),E=0,O=null,k=null,A=null,j=0,M=null,N=null,P=0,F=0,I=0,re=0,ie=performance.now(),ae=0,L=[],oe,R=0,z=null,B=null,se=``,V=()=>{z=B=null,se=``,R=I,Ke.value=$.checked?`Auto-play · waiting for the scene to settle`:``};$.onchange=V;let H=e=>{e.shadows?.destroy(),e.cradle?.destroy(),e.tether?.destroy(),e.model?.destroy(),e.surface?.destroy(),e.graph.destroy(),e.world.destroy(),e.shapes.destroy(),e.meshVertices.destroy()};async function U(){if(!(C||!w)){C=!0,V(),Ye.forEach(e=>{e.disabled=!0}),Y.disabled=Z.disabled=We.disabled=!0;try{if(await Promise.all([k,A,M,O]),Q.reset(),!w)return;N=g();let e=await N;if(!w){H(e);return}let t=_.sceneName!==e.sceneName;qe.clear(),H(_),_=e,x(),t&&(_.sceneName===`wreckingBall`?(s.position.set(19,-21,16),c.target.set(-2,0,4)):_.sceneName===`robotArm`?(s.position.set(...Be),c.target.set(...Ve)):(s.position.set(_.sceneName===`mixed`?24:11,_.sceneName===`mixed`?-30:-16,_.sceneName===`mixed`?25:K(_.sceneName)?_.sceneName===`dominoJunction`?25:19:12),c.target.set(0,0,2))),X&&(S=!0,document.querySelector(`#pause`).textContent=`Release ball`),E=0,I=0,L.length=0,oe=void 0,re=0,ie=performance.now(),V()}catch(e){n=e instanceof Error?e:Error(String(e))}finally{N=null,C=!1,Ye.forEach(e=>{e.disabled=!1}),Y.disabled=We.disabled=!1,Z.disabled=X}}}document.querySelector(`#reset`).onclick=U,Y.onchange=U,Z.onchange=U,We.onchange=U;let ce=document.querySelector(`#pause`);X&&(ce.textContent=`Release ball`),ce.onclick=()=>{S=!S,V(),ce.textContent=S?`Resume`:`Pause`},document.querySelector(`#push`).onclick=()=>{if(C||!w||M||_.sceneName===`impact`)return;V();let e=_;M=e.world.readState().then(t=>{if(e!==_||!w)return;let n=e.bodies.findIndex(e=>(e.mode??((e.mass??1)===0?`static`:`dynamic`))===`dynamic`);if(n<0)return;let r=t[n].position;e.world.applyImpulse(n,[3,0,0],[r[0],r[1]+.4,r[2]+.3])}).catch(e=>{n=e}).finally(()=>{M=null})};function W(e){if(!w)return;if(n){He.value=n.message,document.querySelector(`#startup-error`).textContent=n.message;return}if(Je.update(),$.checked&&B!==null&&!S&&!C&&(Ke.value=`${se} · next scene in ${Math.max(0,Math.ceil((B-e)/1e3))} s`,e>=B&&(Y.selectedIndex=(Y.selectedIndex+1)%Y.options.length,U())),_.sceneName===`cradle`&&!$.checked&&!S&&!C&&I>=120&&U(),O){F=requestAnimationFrame(W);return}let t=performance.now(),r=!S&&!C,i=I,a=Math.min(.05,(e-T)/1e3);if(T=e,!C&&!S&&B===null){E=Math.min(E+a,K(_.sceneName)||_.sceneName===`wreckingBall`?4/60:4/120);let e=o.createCommandEncoder();for(;E>=_.world.timeStep;)qe.encode(_.graph,e,{parameters:void 0}),E-=_.world.timeStep,I+=_.world.timeStep;o.submit(e.finish())}s.aspect=J.clientWidth/J.clientHeight,s.updateProjectionMatrix(),c.update(Math.min(.1,(e-l)/1e3)),l=e,s.updateMatrixWorld();let d=new m(s.projectionMatrix.elements).multiplyRight(s.matrixWorldInverse.elements),f=new m([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]);if(f.multiplyRight(d),u.write(new Float32Array(f)),_.model?.shaderInputs.setProps({rigidBodyPose:{matrix:f},pbrProjection:{camera:s.position.toArray()}}),_.cradle){let e=new m([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(s.projectionMatrix.elements),t=new m(s.matrixWorldInverse.elements),n=[s.position.x,s.position.y,s.position.z];_.cradle instanceof ze?_.cradle.draw(t,e,n,{frameMilliseconds:oe,advanced:I!==i}):_.cradle.draw(t,e,n)}else{if(_.shadows){let e=new m([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(s.projectionMatrix.elements);_.model.shaderInputs.setProps({shadow:_.shadows.render(new m(s.matrixWorldInverse.elements),e)})}let e=o.beginRenderPass({clearColor:[.9,.92,.89,1],clearDepth:1});_.model?.draw(e),_.tether?.draw(e),e.end()}o.submit();let p=o.createFence();if(O=p.signaled.then(()=>{_.sceneName===`wreckingBall`&&(oe=performance.now()-t),r&&_.sceneName===`wreckingBall`&&(L.push(performance.now()-t),L.length>180&&L.shift())}).catch(e=>{n=e}).finally(()=>{p.destroy(),O=null}),!C&&!A&&Q.enabled&&K(_.sceneName)&&e-j>50){j=e;let t=_,n=Q.generation;A=t.world.readContactEvents().then(e=>{w&&t===_&&Q.play(e.events,t.world.timeStep,e.step,n)}).catch(()=>{}).finally(()=>{A=null})}if(!C&&!k&&e-P>500){P=e;let t=_,r=I;k=Promise.all([t.world.readSimulationDiagnostics(),$.checked||t.sceneName===`robotArm`?t.world.readState():Promise.resolve(null),t.sceneName===`robotArm`?t.world.readAngularActuatorTorque(`elbow`,1):Promise.resolve(null)]).then(([n,i,a])=>{if(!w||t!==_)return;if(i&&a!==null){let e=te(i,4,b()),t=Number(y(`torque`).value);document.querySelector(`#arm-reading`).value=`${y(`payload`).value} kg · target ${y(`angle`).value}° · actual ${(e.angle*180/Math.PI).toFixed(1)}°
Tip error ${(e.tipError*100).toFixed(1)} cm · ${Math.abs(a).toFixed(1)} / ${t} N·m${Math.abs(a)>=t*.99?` · saturated`:``}`}if(ae=(r-re)/Math.max(.001,(e-ie)/1e3),re=r,ie=e,$.checked&&!n.complete)$.checked=!1,V(),Ke.value=`Auto-play stopped: incomplete simulation. Reset after correcting capacity.`;else if($.checked&&i&&!S&&!C&&!M&&B===null){z=i.every((e,n)=>t.bodies[n].mass===0||Math.hypot(...e.velocity)<.04&&Math.hypot(...e.angularVelocity)<.04)?z??r:null;let e=r-R,n=e>=10&&z!==null&&r-z>=3;(n||e>=120)&&(se=n?`Scene settled`:`120 s demonstration complete`,B=performance.now()+2e3)}let o=t.capacity,s=[...L].sort((e,t)=>e-t),c=s[Math.max(0,Math.ceil(s.length*.95)-1)],l=t.sceneName===`wreckingBall`&&s.length>=30?`\n${c.toFixed(1)} ms p95 frame work · ${Math.max(0,(1-c/(1e3/60))*100).toFixed(0)}% margin at 60 fps`:``;He.value=`${n.complete?``:`INCOMPLETE SIMULATION · `}${t.bodies.filter(e=>e.mass!==0).length} moving bodies · ${t.world.solver} solver\n${I.toFixed(1)} s simulated · ${(ae*100).toFixed(0)}% real time · ${t.graph.stats.nodeOrder.length} graph nodes\n${n.maximumCandidatePairs} peak candidate pairs · ${n.maximumCandidateTests} peak candidate tests\n${n.incompleteSteps} incomplete steps / ${n.steps} total · ${(o.ownedBufferBytes/1048576).toFixed(2)} MiB world buffers${l}`}).catch(e=>{n=e}).finally(()=>{k=null})}F=requestAnimationFrame(W)}F=requestAnimationFrame(W),window.addEventListener(`pagehide`,()=>{w=!1,cancelAnimationFrame(F),c.dispose(),Promise.allSettled([k,A,M,N,O]).then(()=>{H(_),Je.destroy(),u.destroy(),Q.destroy(),o.destroy()})},{once:!0})}catch(e){He.value=String(e),document.querySelector(`#startup-error`).textContent=String(e)}