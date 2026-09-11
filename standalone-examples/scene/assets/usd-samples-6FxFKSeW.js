import{t as e}from"./chunk-BRNzzbbm.js";import{Z as t,ct as n,et as r,mt as i,pt as a,z as o}from"./src-ED4JTD0c.js";import{A as s,D as c,H as l,L as u,M as d,N as f,O as p,P as m,U as h,V as g,_,a as v,d as y,g as b,j as x,k as S,l as C,n as w,o as ee,p as te,s as T,t as ne,v as re,y as ie,z as ae}from"./src-blALRukZ.js";var oe=0,E=class{device;type;subtype;id;version=0;pendingParameters;committedParameters={};constructor(e,t,n,r={}){this.device=e,this.type=t,this.subtype=n,this.id=`${t}-${++oe}`,this.pendingParameters={...r},this.commitParameters()}setParameter(e,t){return this.pendingParameters[e]=t,this}setParameters(e){return Object.assign(this.pendingParameters,e),this}unsetParameter(e){return delete this.pendingParameters[e],this}getParameter(e){return this.committedParameters[e]}getParameters(){return this.committedParameters}commitParameters(){let e=this.committedParameters;this.committedParameters={...this.pendingParameters},this.version++;let t=this.type===`instance`&&Reflect.get(e,`group`)!==Reflect.get(this.committedParameters,`group`);return this.device.recordSceneObjectCommit(this.type,this.id,t),this}},D=class extends E{constructor(e,t){super(e,`array`,`array1D`,t)}get data(){return this.getParameter(`data`)}get length(){return this.data.length}},se=class extends E{constructor(e,t,n={}){super(e,`geometry`,t,n)}},ce=class extends E{constructor(e,t,n={}){super(e,`material`,t,n)}},le=class extends E{constructor(e,t,n){super(e,`sampler`,t,n)}},ue=class extends E{constructor(e,t){super(e,`surface`,`default`,t)}},de=class extends E{constructor(e,t={}){super(e,`group`,`default`,t)}},fe=class extends E{constructor(e,t){super(e,`instance`,`transform`,t)}},pe=class extends E{constructor(e,t={}){super(e,`world`,`default`,t)}},me=class extends E{constructor(e,t,n={}){super(e,`light`,t,n)}},he=class extends E{constructor(e,t,n={}){super(e,`camera`,t,n)}},ge=class extends E{constructor(e,t,n={}){super(e,`renderer`,t,n)}},_e=class extends E{statistics={surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};constructor(e,t){super(e,`frame`,`default`,t)}render(){return this.statistics=this.device.renderFrame(this),this.statistics}destroy(){this.device.destroyFrame(this)}};function ve(e,t){if(e===t){let n=t[1],r=t[2],i=t[5];e[1]=t[3],e[2]=t[6],e[3]=n,e[5]=t[7],e[6]=r,e[7]=i}else e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8];return e}function ye(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=u*o-s*l,f=-u*a+s*c,p=l*a-o*c,m=n*d+r*f+i*p;return m?(m=1/m,e[0]=d*m,e[1]=(-u*r+i*l)*m,e[2]=(s*r-i*o)*m,e[3]=f*m,e[4]=(u*n-i*c)*m,e[5]=(-s*n+i*a)*m,e[6]=p*m,e[7]=(-l*n+r*c)*m,e[8]=(o*n-r*a)*m,e):null}function be(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*(l*a-o*c)+n*(-l*i+o*s)+r*(c*i-a*s)}function xe(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=n[0],p=n[1],m=n[2],h=n[3],g=n[4],_=n[5],v=n[6],y=n[7],b=n[8];return e[0]=f*r+p*o+m*l,e[1]=f*i+p*s+m*u,e[2]=f*a+p*c+m*d,e[3]=h*r+g*o+_*l,e[4]=h*i+g*s+_*u,e[5]=h*a+g*c+_*d,e[6]=v*r+y*o+b*l,e[7]=v*i+y*s+b*u,e[8]=v*a+y*c+b*d,e}function Se(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=n[0],p=n[1];return e[0]=r,e[1]=i,e[2]=a,e[3]=o,e[4]=s,e[5]=c,e[6]=f*r+p*o+l,e[7]=f*i+p*s+u,e[8]=f*a+p*c+d,e}function Ce(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=Math.sin(n),p=Math.cos(n);return e[0]=p*r+f*o,e[1]=p*i+f*s,e[2]=p*a+f*c,e[3]=p*o-f*r,e[4]=p*s-f*i,e[5]=p*c-f*a,e[6]=l,e[7]=u,e[8]=d,e}function we(e,t,n){let r=n[0],i=n[1];return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=i*t[3],e[4]=i*t[4],e[5]=i*t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e}function Te(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[3]=u-_,e[6]=f+g,e[1]=u+_,e[4]=1-l-m,e[7]=p-h,e[2]=f-g,e[5]=p+h,e[8]=1-l-d,e}var Ee;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL1ROW0=3]=`COL1ROW0`,e[e.COL1ROW1=4]=`COL1ROW1`,e[e.COL1ROW2=5]=`COL1ROW2`,e[e.COL2ROW0=6]=`COL2ROW0`,e[e.COL2ROW1=7]=`COL2ROW1`,e[e.COL2ROW2=8]=`COL2ROW2`})(Ee||={});var De=Object.freeze([1,0,0,0,1,0,0,0,1]),Oe=class extends S{static get IDENTITY(){return Me()}static get ZERO(){return je()}get ELEMENTS(){return 9}get RANK(){return 3}get INDICES(){return Ee}constructor(e,...t){super(-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):t.length>0?this.copy([e,...t]):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this.check()}identity(){return this.copy(De)}fromObject(e){return this.check()}fromQuaternion(e){return Te(this,e),this.check()}set(e,t,n,r,i,a,o,s,c){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c){return this[0]=e,this[1]=r,this[2]=o,this[3]=t,this[4]=i,this[5]=s,this[6]=n,this[7]=a,this[8]=c,this.check()}determinant(){return be(this)}transpose(){return ve(this,this),this.check()}invert(){return ye(this,this),this.check()}multiplyLeft(e){return xe(this,e,this),this.check()}multiplyRight(e){return xe(this,this,e),this.check()}rotate(e){return Ce(this,this,e),this.check()}scale(e){return Array.isArray(e)?we(this,this,e):we(this,this,[e,e]),this.check()}translate(e){return Se(this,this,e),this.check()}transform(e,t){let n;switch(e.length){case 2:n=f(t||[-0,-0],e,this);break;case 3:n=x(t||[-0,-0,-0],e,this);break;case 4:n=d(t||[-0,-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return m(n,e.length),n}transformVector(e,t){return this.transform(e,t)}transformVector2(e,t){return this.transform(e,t)}transformVector3(e,t){return this.transform(e,t)}},ke,Ae=null;function je(){return ke||(ke=new Oe([0,0,0,0,0,0,0,0,0]),Object.freeze(ke)),ke}function Me(){return Ae||(Ae=new Oe,Object.freeze(Ae)),Ae}function Ne(e,t=!0){return e??t}function Pe(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}var Fe={props:{},uniforms:{},bindings:{},name:`skin`,bindingLayout:[{name:`skin`,group:0},{name:`skinJointMatrices`,group:0,visibility:1}],dependencies:[],source:`
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
#endif

fn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4<f32> {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
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
#endif

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
}

`,fs:``,defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:n,skinJointMatrices:r,scenegraphsFromGLTF:i,skinIndex:a=0,meshWorldMatrix:o}=e,s=r?{skinJointMatrices:r}:{};if(n)return{jointMatrix:Ie(n),...s};let c=i?.gltf?.skins?.[a];if(!c)return{jointMatrix:[],...s};let{inverseBindMatrices:l,joints:u,skeleton:d}=c,f=i.gltfNodeIndexToNodeMap,m=new Map,h=d===void 0?void 0:f?.get(d),g=h?[h]:i.scenes||[];for(let e of g)e.preorderTraversal((e,{worldMatrix:t})=>{m.set(e.id,t)});let _=o?new p(o).invert():null,v=new Float32Array(1024),y=l?.value;for(let e=0;e<Math.min(u.length,64);e++){let t=f?.get(u[e]);if(!t)continue;let n=m.get(t.id)||t.matrix,r=_?new p(_).multiplyRight(n):new p(n);y&&y.length>=(e+1)*16&&r.multiplyRight(new p(Array.from(y.slice(e*16,(e+1)*16)))),v.set(r,e*16)}return{jointMatrix:v,...s}},uniformTypes:{jointMatrix:[`mat4x4<f32>`,64]}};function Ie(e){let t=new Float32Array(1024);return t.set(e instanceof Float32Array?e.subarray(0,t.length):e.slice(0,t.length)),t}var Le=`precision highp int;

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
`,Re=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,ze=5,Be={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},ze]},defaultUniforms:Ge(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:Re,vs:Le,fs:Le,getUniforms:Ve};function Ve(e,t={}){if(e&&={...e},!e)return Ge();e.lights&&(e={...e,...Ue(e.lights),lights:void 0});let{useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o}=e||{};if(!(r||i&&i.length>0||a&&a.length>0||o&&o.length>0))return{...Ge(),enabled:0};let s={...Ge(),...He({useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o})};return e.enabled!==void 0&&(s.enabled=e.enabled?1:0),s}function He({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let o=Ke(),s=0,c=0,l=0,u=0;for(let t of n){if(s>=ze)break;o[s]={...o[s],color:We(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},s++,c++}for(let t of r){if(s>=ze)break;o[s]={...o[s],color:We(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:Je(t)},s++,l++}for(let t of i){if(s>=ze)break;o[s]={...o[s],color:We(t,e),direction:t.direction},s++,u++}return n.length+r.length+i.length>ze&&a.warn(`MAX_LIGHTS exceeded, truncating to ${ze}`)(),{ambientColor:We(t,e),directionalLightCount:u,pointLightCount:c,spotLightCount:l,lights:o}}function Ue(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function We(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return Pe(n,Ne(t,!0)).map(e=>e*r)}function Ge(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:Ke()}}function Ke(){return Array.from({length:ze},()=>qe())}function qe(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function Je(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var Ye=`#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,Xe=`#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`,Ze={name:`ibl`,firstBindingSlot:32,bindingLayout:[{name:`pbr_diffuseEnvSampler`,group:2},{name:`pbr_specularEnvSampler`,group:2},{name:`pbr_brdfLUT`,group:2}],source:Ye,vs:Xe,fs:Xe},Qe=`out vec3 pbr_vPosition;
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
  pbr_vNormal = normalize(vec3(pbrProjection.modelMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV0 = uv0;
#else
  pbr_vUV0 = vec2(0.,0.);
#endif

  pbr_vUV1 = uv1;
}
`,$e=`precision highp float;

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

vec4 pbr_filterColor(vec4 vertexColor)
{
  vec2 baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  vec2 metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  vec2 normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  vec2 occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  vec2 emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
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

  if(pbrMaterial.unlit){
    color.rgb = baseColor.rgb;
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
      color += calculateFinalColor(pbrInfo, lighting.ambientColor);

      for(int i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(pbrInfo, lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
        }
      }

      for(int i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
          float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
        }
      }

      for(int i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(pbrInfo, lighting_getSpotLight(i));
          float attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), pbr_vPosition);
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color / attenuation);
        }
      }
#endif

#ifdef USE_IBL
      if (pbrMaterial.IBLenabled) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
#endif

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
      lighting.ambientColor,
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
        PBRInfo_setDirectionalLight(pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
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
          lighting_getDirectionalLight(i).color,
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
          lighting_getPointLight(i).color / attenuation,
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
          lighting_getPointLight(i).color / attenuation,
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
          lighting_getSpotLight(i).color / attenuation,
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
          lighting_getSpotLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
#endif

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
`,et=`struct PBRFragmentInputs {
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

fn pbr_filterColor(vertexColor: vec4<f32>) -> vec4<f32> {
  let baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  let metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  let emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
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

  if (pbrMaterial.unlit != 0u) {
    color = baseColor.rgb;
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
    let v = normalize(pbrProjection.camera - fragmentInputs.pbr_vPosition);  // Vector from surface point to camera
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
      color += calculateFinalColor(pbrInfo, lighting.ambientColor);

      for (var i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(&pbrInfo, lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
        }
      }

      for (var i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
          let attenuation = getPointLightAttenuation(
            lighting_getPointLight(i),
            distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
          );
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
        }
      }

      for (var i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(&pbrInfo, lighting_getSpotLight(i));
          let attenuation = getSpotLightAttenuation(
            lighting_getSpotLight(i),
            fragmentInputs.pbr_vPosition
          );
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color / attenuation);
        }
      }
      #endif

      #ifdef USE_IBL
      if (pbrMaterial.IBLenabled != 0) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
      #endif

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
      lighting.ambientColor,
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
        PBRInfo_setDirectionalLight(&pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
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
          lighting_getDirectionalLight(i).color,
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
          lighting_getPointLight(i).color / attenuation,
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
          lighting_getPointLight(i).color / attenuation,
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
          lighting_getSpotLight(i).color / attenuation,
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
          lighting_getSpotLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
    #endif

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
`,tt=`layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,nt={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:`pbrMaterial`,firstBindingSlot:0,bindingLayout:[{name:`pbrMaterial`,group:3},{name:`pbr_baseColorSampler`,group:3},{name:`pbr_normalSampler`,group:3},{name:`pbr_emissiveSampler`,group:3},{name:`pbr_metallicRoughnessSampler`,group:3},{name:`pbr_occlusionSampler`,group:3},{name:`pbr_specularColorSampler`,group:3},{name:`pbr_specularIntensitySampler`,group:3},{name:`pbr_transmissionSampler`,group:3},{name:`pbr_thicknessSampler`,group:3},{name:`pbr_clearcoatSampler`,group:3},{name:`pbr_clearcoatRoughnessSampler`,group:3},{name:`pbr_clearcoatNormalSampler`,group:3},{name:`pbr_sheenColorSampler`,group:3},{name:`pbr_sheenRoughnessSampler`,group:3},{name:`pbr_iridescenceSampler`,group:3},{name:`pbr_iridescenceThicknessSampler`,group:3},{name:`pbr_anisotropySampler`,group:3},{name:`pbr_bumpSampler`,group:3},{name:`pbr_diffuseTransmissionSampler`,group:3},{name:`pbr_diffuseTransmissionColorSampler`,group:3},{name:`pbr_multiscatterColorSampler`,group:3}],dependencies:[Be,Ze,{name:`pbrProjection`,bindingLayout:[{name:`pbrProjection`,group:0}],source:`struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,vs:tt,fs:tt,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:`mat4x4<f32>`,modelMatrix:`mat4x4<f32>`,normalMatrix:`mat4x4<f32>`,camera:`vec3<f32>`}}],source:et,vs:Qe,fs:$e,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:`i32`,baseColorMapEnabled:`i32`,baseColorFactor:`vec4<f32>`,normalMapEnabled:`i32`,normalScale:`f32`,emissiveMapEnabled:`i32`,emissiveFactor:`vec3<f32>`,metallicRoughnessValues:`vec2<f32>`,metallicRoughnessMapEnabled:`i32`,occlusionMapEnabled:`i32`,occlusionStrength:`f32`,alphaCutoffEnabled:`i32`,alphaCutoff:`f32`,specularColorFactor:`vec3<f32>`,specularIntensityFactor:`f32`,specularColorMapEnabled:`i32`,specularIntensityMapEnabled:`i32`,ior:`f32`,transmissionFactor:`f32`,transmissionMapEnabled:`i32`,thicknessFactor:`f32`,attenuationDistance:`f32`,attenuationColor:`vec3<f32>`,clearcoatFactor:`f32`,clearcoatRoughnessFactor:`f32`,clearcoatMapEnabled:`i32`,clearcoatRoughnessMapEnabled:`i32`,sheenColorFactor:`vec3<f32>`,sheenRoughnessFactor:`f32`,sheenColorMapEnabled:`i32`,sheenRoughnessMapEnabled:`i32`,iridescenceFactor:`f32`,iridescenceIor:`f32`,iridescenceThicknessRange:`vec2<f32>`,iridescenceMapEnabled:`i32`,anisotropyStrength:`f32`,anisotropyRotation:`f32`,anisotropyDirection:`vec2<f32>`,anisotropyMapEnabled:`i32`,emissiveStrength:`f32`,dispersion:`f32`,IBLenabled:`i32`,scaleIBLAmbient:`vec2<f32>`,scaleDiffBaseMR:`vec4<f32>`,scaleFGDSpec:`vec4<f32>`,baseColorUVSet:`i32`,baseColorUVTransform:`mat3x3<f32>`,metallicRoughnessUVSet:`i32`,metallicRoughnessUVTransform:`mat3x3<f32>`,normalUVSet:`i32`,normalUVTransform:`mat3x3<f32>`,occlusionUVSet:`i32`,occlusionUVTransform:`mat3x3<f32>`,emissiveUVSet:`i32`,emissiveUVTransform:`mat3x3<f32>`,specularColorUVSet:`i32`,specularColorUVTransform:`mat3x3<f32>`,specularIntensityUVSet:`i32`,specularIntensityUVTransform:`mat3x3<f32>`,transmissionUVSet:`i32`,transmissionUVTransform:`mat3x3<f32>`,thicknessUVSet:`i32`,thicknessUVTransform:`mat3x3<f32>`,clearcoatUVSet:`i32`,clearcoatUVTransform:`mat3x3<f32>`,clearcoatRoughnessUVSet:`i32`,clearcoatRoughnessUVTransform:`mat3x3<f32>`,clearcoatNormalUVSet:`i32`,clearcoatNormalUVTransform:`mat3x3<f32>`,sheenColorUVSet:`i32`,sheenColorUVTransform:`mat3x3<f32>`,sheenRoughnessUVSet:`i32`,sheenRoughnessUVTransform:`mat3x3<f32>`,iridescenceUVSet:`i32`,iridescenceUVTransform:`mat3x3<f32>`,iridescenceThicknessUVSet:`i32`,iridescenceThicknessUVTransform:`mat3x3<f32>`,anisotropyUVSet:`i32`,anisotropyUVTransform:`mat3x3<f32>`,bumpFactor:`f32`,bumpMapEnabled:`i32`,diffuseTransmissionFactor:`f32`,diffuseTransmissionMapEnabled:`i32`,diffuseTransmissionColorFactor:`vec3<f32>`,diffuseTransmissionColorMapEnabled:`i32`,multiscatterColorFactor:`vec3<f32>`,multiscatterColorMapEnabled:`i32`,scatterAnisotropy:`f32`,bumpUVSet:`i32`,bumpUVTransform:`mat3x3<f32>`,diffuseTransmissionUVSet:`i32`,diffuseTransmissionUVTransform:`mat3x3<f32>`,diffuseTransmissionColorUVSet:`i32`,diffuseTransmissionColorUVTransform:`mat3x3<f32>`,multiscatterColorUVSet:`i32`,multiscatterColorUVTransform:`mat3x3<f32>`}},rt={NONE:0,REINHARD:1,KHRONOS_PBR_NEUTRAL:2,ACES:3},it=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],at=`layout(std140) uniform pbrSceneUniforms {
  float exposure;
  int toneMapMode;
  float environmentIntensity;
  float environmentRotation;
  float environmentMipCount;
  int outputEncoding;
  vec2 framebufferSize;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} pbrScene;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
uniform sampler2D pbr_transmissionFramebufferSampler;
#endif
`,ot={name:`pbrScene`,bindingLayout:[{name:`pbrScene`,group:1},{name:`pbr_transmissionFramebufferSampler`,group:1}],source:`struct pbrSceneUniforms {
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
`,vs:at,fs:at,getUniforms:e=>e,uniformTypes:{exposure:`f32`,toneMapMode:`i32`,environmentIntensity:`f32`,environmentRotation:`f32`,environmentMipCount:`f32`,outputEncoding:`i32`,framebufferSize:`vec2<f32>`,viewMatrix:`mat4x4<f32>`,projectionMatrix:`mat4x4<f32>`},defaultUniforms:{exposure:1,toneMapMode:rt.KHRONOS_PBR_NEUTRAL,environmentIntensity:1,environmentRotation:Math.PI*.5,environmentMipCount:1,outputEncoding:1,framebufferSize:[1,1],viewMatrix:it,projectionMatrix:it}};function st(e){return new b(e,{modules:[nt]})}function ct(e,t={}){let n=t.factory||st(e),r={};for(let[e,i]of Object.entries(t.bindings||{}))i&&n.ownsBinding(e)&&(r[e]=i);let i=n.createMaterial({id:t.id,bindings:r});return i.setProps({pbrMaterial:{...lt(r),...t.uniforms}}),i}function lt(e){return{baseColorMapEnabled:!!e.pbr_baseColorSampler,normalMapEnabled:!!e.pbr_normalSampler,emissiveMapEnabled:!!e.pbr_emissiveSampler,metallicRoughnessMapEnabled:!!e.pbr_metallicRoughnessSampler,occlusionMapEnabled:!!e.pbr_occlusionSampler,specularColorMapEnabled:!!e.pbr_specularColorSampler,specularIntensityMapEnabled:!!e.pbr_specularIntensitySampler,transmissionMapEnabled:!!e.pbr_transmissionSampler,clearcoatMapEnabled:!!e.pbr_clearcoatSampler,clearcoatRoughnessMapEnabled:!!e.pbr_clearcoatRoughnessSampler,sheenColorMapEnabled:!!e.pbr_sheenColorSampler,sheenRoughnessMapEnabled:!!e.pbr_sheenRoughnessSampler,iridescenceMapEnabled:!!e.pbr_iridescenceSampler,anisotropyMapEnabled:!!e.pbr_anisotropySampler,bumpMapEnabled:!!e.pbr_bumpSampler,diffuseTransmissionMapEnabled:!!e.pbr_diffuseTransmissionSampler,diffuseTransmissionColorMapEnabled:!!e.pbr_diffuseTransmissionColorSampler,multiscatterColorMapEnabled:!!e.pbr_multiscatterColorSampler}}var ut=`
struct ScenePBRVertexInputs {
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
#ifdef HAS_INSTANCING
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
#endif
};

struct ScenePBRFragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
  @location(4) pbrColor: vec4f,
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
fn vertexMain(inputs: ScenePBRVertexInputs) -> ScenePBRFragmentInputs {
  var outputs: ScenePBRFragmentInputs;
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
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

#ifdef HAS_INSTANCING
  let instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = instanceMatrix * position;
  let normalMatrix = getPBRInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz,
    instanceMatrix[1].xyz,
    instanceMatrix[2].xyz
  ));
  normal = normalize(normalMatrix * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * worldPosition;
#else
  let worldPosition = pbrProjection.modelMatrix * position;
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(
    normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz),
    tangent.w
  );
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
#endif

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

@fragment
fn fragmentMain(inputs: ScenePBRFragmentInputs) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
#ifdef DEBUG_NORMALS
  return vec4f(normalize(inputs.pbrNormal) * 0.5 + vec3f(0.5), 1.0);
#endif
#ifdef DEBUG_DEPTH
  return vec4f(vec3f(inputs.position.z), 1.0);
#endif
  return pbr_filterColor(inputs.pbrColor);
}
`,dt=`#version 300 es
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
  normal = skinMatrix * normal;
  tangent = vec4((skinMatrix * vec4(tangent.xyz, 0.0)).xyz, tangent.w);
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
  tangent = vec4(normalize(mat3(instanceMatrix) * tangent.xyz), tangent.w);
#endif

  pbr_setPositionNormalTangentUV(
    position,
    normal,
    tangent,
    textureCoordinates,
    secondTextureCoordinates
  );
  gl_Position = pbrProjection.modelViewProjectionMatrix * position;
}
`,ft=`#version 300 es
in vec4 sceneVertexColor;
out vec4 fragmentColor;

void main(void) {
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
  fragmentColor = pbr_filterColor(sceneVertexColor);
#endif
#endif
}
`;function pt(e,t){let n=[ot,nt,...t.modules||[]],r=n.filter((e,t)=>n.findIndex(t=>t.name===e.name)===t),i=mt(t.geometry);return(t.defines?.HAS_SKIN??i.HAS_SKIN)&&!r.some(e=>e.name===Fe.name)&&r.push(Fe),new _(e,{source:ut,vs:dt,fs:ft,...t,modules:r,defines:{...i,...ht(t.material.getResourceBindings()),...t.defines}})}function mt(e){let t=e&&`attributes`in e?e.attributes:{},n=t.COLOR_0||t.colors;return{HAS_NORMALS:!!(t.NORMAL||t.normals),HAS_TANGENTS:!!(t.TANGENT||t.tangents),HAS_UV:!!(t.TEXCOORD_0||t.texCoords),HAS_UV_1:!!(t.TEXCOORD_1||t.texCoords1),HAS_SKIN:!!(t.JOINTS_0&&t.WEIGHTS_0),HAS_COLORS:!!n,HAS_RGBA_COLORS:!!(n&&`size`in n&&n.size===4)}}function ht(e){return{HAS_BASECOLORMAP:!!e.pbr_baseColorSampler,HAS_NORMALMAP:!!e.pbr_normalSampler,HAS_EMISSIVEMAP:!!e.pbr_emissiveSampler,HAS_METALROUGHNESSMAP:!!e.pbr_metallicRoughnessSampler,HAS_OCCLUSIONMAP:!!e.pbr_occlusionSampler,HAS_SPECULARCOLORMAP:!!e.pbr_specularColorSampler,HAS_SPECULARINTENSITYMAP:!!e.pbr_specularIntensitySampler,HAS_TRANSMISSIONMAP:!!e.pbr_transmissionSampler,HAS_THICKNESSMAP:!!e.pbr_thicknessSampler,HAS_CLEARCOATMAP:!!e.pbr_clearcoatSampler,HAS_CLEARCOATROUGHNESSMAP:!!e.pbr_clearcoatRoughnessSampler,HAS_CLEARCOATNORMALMAP:!!e.pbr_clearcoatNormalSampler,HAS_SHEENCOLORMAP:!!e.pbr_sheenColorSampler,HAS_SHEENROUGHNESSMAP:!!e.pbr_sheenRoughnessSampler,HAS_IRIDESCENCEMAP:!!e.pbr_iridescenceSampler,HAS_IRIDESCENCETHICKNESSMAP:!!e.pbr_iridescenceThicknessSampler,HAS_ANISOTROPYMAP:!!e.pbr_anisotropySampler,HAS_BUMPMAP:!!e.pbr_bumpSampler,HAS_DIFFUSETRANSMISSIONMAP:!!e.pbr_diffuseTransmissionSampler,HAS_DIFFUSETRANSMISSIONCOLORMAP:!!e.pbr_diffuseTransmissionColorSampler,HAS_MULTISCATTERCOLORMAP:!!e.pbr_multiscatterColorSampler}}var gt=new p,_t=class{device;materialFactory;frames=new Map;constructor(e){this.device=e,this.materialFactory=st(e)}render(e){let t=this.getTransmissionResources(e),n=e.background||[0,0,0,1];if(t){let r={...e,id:kt(e.id),surfaces:e.surfaces.filter(e=>!Dt(e)&&yt(e.material)!==`BLEND`),framebuffer:t.framebuffer,exposure:1,toneMapMode:rt.NONE,outputColorSpace:`linear`,transmission:!1},i=this.prepareScene(r),a=this.device.beginRenderPass({id:`scene-${e.id}-transmission`,framebuffer:t.framebuffer,clearColor:[n[0],n[1],n[2],n[3]??1],clearDepth:1});this.drawPreparedScene(i,a),a.end()}else this.destroyFrame(kt(e.id));let r=this.prepareScene(e,t?.colorTexture),i=this.device.beginRenderPass({id:`scene-${e.id}`,framebuffer:e.framebuffer,clearColor:Ft(this.device,e,n),clearDepth:1});return r.statistics.drawCount=this.drawPreparedScene(r,i),i.end(),r.statistics}destroyFrame(e){let t=this.frames.get(e);if(t){for(let e of t.surfaces.values())Bt(e);Rt(t.transmission),this.frames.delete(e),t.transmission&&this.destroyFrame(kt(e))}}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e)}prepareScene(e,t){let n=this.frames.get(e.id);n||(n={surfaces:new Map},this.frames.set(e.id,n));let r=new Set,i=[],a=0,o=0;for(let s of e.surfaces){if(s.transforms.length===0)continue;let c=Dt(s)?t:void 0,l=this.getCompiledSurface(n,s,e,c);St(l,s.transforms),Ot(s)&&l.model.shaderInputs.setProps({skin:s.skin}),vt(l,s),l.material.setProps({pbrMaterial:{...lt(s.material.bindings||{}),...s.material.uniforms,alphaCutoffEnabled:l.alphaMode===`MASK`,IBLenabled:Tt(e.environment)}}),Ct(l.model,e,c),l.model.predraw(this.device.commandEncoder),l.depth=zt(s.transforms,e.camera.viewMatrix),r.add(s.id),i.push(l),a+=s.transforms.length,o+=l.triangleCount*s.transforms.length}for(let[e,t]of n.surfaces)r.has(e)||(Bt(t),n.surfaces.delete(e));return i.sort((e,t)=>{let n=e.alphaMode===`BLEND`;return n===(t.alphaMode===`BLEND`)?!n&&e.transmissive!==t.transmissive?e.transmissive?1:-1:n?t.depth-e.depth:0:n?1:-1}),{surfaces:i,statistics:{surfaceCount:i.length,instanceCount:a,drawCount:0,triangleCount:o}}}drawPreparedScene(e,t){let n=0;for(let r of e.surfaces)r.model.draw(t)&&n++;return n}getSurfaceModelOptions(e,t){return{}}getCompiledSurface(e,t,r,i){let a=yt(t.material),o=bt(t,r,a,i),s=Object.entries(t.material.bindings||{}).filter(([,e])=>!!e),c=e.surfaces.get(t.id);if(c&&(c.source.geometry!==t.geometry||c.signature!==o||!xt(c.textureBindings,s))&&(Bt(c),e.surfaces.delete(t.id),c=void 0),!c){let l=ct(this.device,{id:t.material.id,uniforms:t.material.uniforms,bindings:t.material.bindings,factory:this.materialFactory}),u=[],d=[],f={},p=[];for(let e=0;e<4;e++){let r=new Float32Array(t.transforms.length*4),i=this.device.createBuffer({id:`${t.id}-instance-column-${e}`,data:r,usage:n.VERTEX|n.COPY_DST}),a=`instanceModelMatrixCol${e}`;f[a]=i,p.push({name:a,format:`float32x4`,stepMode:`instance`}),u.push(i),d.push(r)}let m=this.getSurfaceModelOptions(t,r),h=Ot(t),g=pt(this.device,{id:`${t.id}-model`,geometry:t.geometry,topology:t.geometry.topology,material:l,attributes:f,bufferLayout:p,instanceCount:t.transforms.length,shaderInputs:new ie({pbrMaterial:nt,pbrScene:ot,...h?{skin:Fe}:{}}),colorAttachmentFormats:r.framebuffer?.colorAttachments.map(e=>e.texture.format),parameters:{cullMode:t.material.doubleSided?`none`:`back`,depthWriteEnabled:a!==`BLEND`,depthCompare:`less-equal`,blend:a===`BLEND`,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`,...m.parameters},...m,defines:{HAS_INSTANCING:!0,USE_LIGHTS:!!r.lights?.length,USE_MATERIAL_EXTENSIONS:!0,ALPHA_CUTOFF:a===`MASK`,USE_IBL:Tt(r.environment),USE_SCENE_ENVIRONMENT:Tt(r.environment),USE_TEX_LOD:Et(r.environment),USE_TRANSMISSION_FRAMEBUFFER:!!i,USE_SCENE_COLOR_MANAGEMENT:!0,DEBUG_NORMALS:r.renderMode===`debugNormals`,DEBUG_DEPTH:r.renderMode===`debugDepth`,...t.material.defines,...m.defines,HAS_SKIN:h}});c={id:t.id,source:t,material:l,model:g,instanceBuffers:u,instanceColumns:d,signature:o,textureBindings:s,triangleCount:Math.floor((t.geometry.indices?.value.length||t.geometry.vertexCount)/3),alphaMode:a,transmissive:!!i,depth:0},e.surfaces.set(t.id,c)}return c.source=t,c}getTransmissionResources(e){let t=e.transmission!==!1&&(!e.renderMode||e.renderMode===`default`)&&e.surfaces.some(Dt),n=this.frames.get(e.id);if(!t){n?.transmission&&(Rt(n.transmission),n.transmission=void 0);return}n||(n={surfaces:new Map},this.frames.set(e.id,n));let[r,i]=Lt(this.device,e);if(n.transmission&&(n.transmission.colorTexture.width!==r||n.transmission.colorTexture.height!==i)&&(Rt(n.transmission),n.transmission=void 0),!n.transmission){let t=this.device.createTexture({id:`scene-${e.id}-transmission-color`,width:r,height:i,format:At(this.device),usage:o.SAMPLE|o.RENDER,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),a=this.device.createTexture({id:`scene-${e.id}-transmission-depth`,width:r,height:i,format:`depth24plus`,usage:o.RENDER}),s=this.device.createFramebuffer({id:`scene-${e.id}-transmission-framebuffer`,width:r,height:i,colorAttachments:[t],depthStencilAttachment:a});n.transmission={colorTexture:t,depthTexture:a,framebuffer:s}}return n.transmission}};function vt(e,t){if(!t.morphTargets?.length)return;let n=t.morphWeights||[];e.morphWeights?.length===n.length&&e.morphWeights.every((e,t)=>e===n[t])||(u(e.model,t.geometry,t.morphTargets,n),e.morphWeights=[...n])}function yt(e){return e.alphaMode?e.alphaMode:(e.uniforms?.baseColorFactor?.[3]??1)<1?`BLEND`:`OPAQUE`}function bt(e,t,n,r){return JSON.stringify({geometryVersion:e.geometryVersion,material:e.material.id,instanceCount:e.transforms.length,alphaMode:n,doubleSided:!!e.material.doubleSided,skin:Ot(e),defines:Object.entries(e.material.defines||{}).sort(([e],[t])=>e.localeCompare(t)),environment:Tt(t.environment),lights:!!t.lights?.length,environmentMipmapped:Et(t.environment),transmission:!!r,transmissionWidth:r?.width,transmissionHeight:r?.height,colorFormat:t.framebuffer?.colorAttachments[0]?.texture.format,renderMode:t.renderMode||`default`})}function xt(e,t){return e.length===t.length?e.every(([e,n])=>t.some(([t,r])=>e===t&&n===r)):!1}function St(e,t){for(let n=0;n<t.length;n++){let r=t[n];for(let t=0;t<4;t++)for(let i=0;i<4;i++)e.instanceColumns[t][n*4+i]=r[t*4+i]}for(let t=0;t<4;t++)e.instanceBuffers[t].write(e.instanceColumns[t])}function Ct(e,t,n){let r=new p(t.camera.viewMatrix),i=new p(t.camera.projectionMatrix),a=t.framebuffer?.width||t.width||n?.width||1,o=t.framebuffer?.height||t.height||n?.height||1;e.shaderInputs.setProps({pbrProjection:{modelViewProjectionMatrix:new p(i).multiplyRight(r),modelMatrix:gt,normalMatrix:gt,camera:t.camera.position},pbrScene:{exposure:t.exposure??1,toneMapMode:Nt(e.device,t),environmentIntensity:t.environment?.intensity??1,environmentRotation:t.environment?.rotation??0,environmentMipCount:t.environment?.specularTexture?.mipLevels??1,outputEncoding:Pt(e.device,t),framebufferSize:[a,o],viewMatrix:r,projectionMatrix:i,...n?{pbr_transmissionFramebufferSampler:n}:{}},lighting:{lights:wt(t.lights),useByteColors:!1},...Tt(t.environment)?{ibl:{pbr_diffuseEnvSampler:t.environment.diffuseTexture,pbr_specularEnvSampler:t.environment.specularTexture,pbr_brdfLUT:t.environment.brdfLUTTexture}}:{}})}function wt(e=[]){let t=e.map(e=>e.type===`directional`?{...e,direction:[-e.direction[0],-e.direction[1],-e.direction[2]]}:e),n=t.filter(e=>e.type===`ambient`);if(n.length<=1)return t;let r=[0,0,0];for(let e of n){let t=e.color??[1,1,1],n=e.intensity??1;r[0]+=t[0]*n,r[1]+=t[1]*n,r[2]+=t[2]*n}return[{type:`ambient`,color:r,intensity:1},...t.filter(e=>e.type!==`ambient`)]}function Tt(e){return!!(e?.diffuseTexture&&e.specularTexture&&e.brdfLUTTexture)}function Et(e){return Tt(e)&&(e?.specularTexture?.mipLevels??1)>1}function Dt(e){return(e.material.uniforms?.transmissionFactor??0)>0}function Ot(e){return!!(e.skin?.jointMatrices?.length&&mt(e.geometry).HAS_SKIN)}function kt(e){return`${e}::linear-transmission-capture`}function At(e){let t=e.getTextureFormatCapabilities(`rgba16float`);return t.render&&t.filter?`rgba16float`:`rgba8unorm`}function jt(e,t){return t.framebuffer?.colorAttachments[0]?.texture.format||e.preferredColorFormat}function Mt(e){return!!(t.getInfo(e).dataType?.startsWith(`float`)||e.endsWith(`ufloat`))}function Nt(e,t){return t.toneMapMode??(Mt(jt(e,t))?rt.NONE:rt.KHRONOS_PBR_NEUTRAL)}function Pt(e,t){if(t.outputColorSpace)return t.outputColorSpace===`srgb`?1:0;let n=jt(e,t);return Mt(n)||n.endsWith(`-srgb`)?0:1}function Ft(e,t,n){let r=Math.max(t.exposure??1,0),i=[Math.max(n[0],0)*r,Math.max(n[1],0)*r,Math.max(n[2],0)*r];switch(Nt(e,t)){case rt.REINHARD:i=i.map(e=>e/(1+e));break;case rt.KHRONOS_PBR_NEUTRAL:i=It(i);break;case rt.ACES:i=i.map(e=>Math.min(Math.max(e*(2.51*e+.03)/(e*(2.43*e+.59)+.14),0),1));break}return Pt(e,t)!==0&&(i=i.map(e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055)),[...i,n[3]??1]}function It(e){let t=Math.min(...e),n=t<.08?t-6.25*t*t:.04,r=e.map(e=>e-n),i=Math.max(...r),a=.76;if(i<a)return r;let o=1-a,s=1-o*o/(i+o-a),c=s/Math.max(i,1e-4),l=1-1/(.15*(i-s)+1);return r.map(e=>e*c*(1-l)+s*l)}function Lt(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function Rt(e){e&&(e.framebuffer.destroy(),e.colorTexture.destroy(),e.depthTexture.destroy())}function zt(e,t){let n=new p(t),r=0;for(let t of e){let e=n.transformAsPoint([t[12],t[13],t[14]]);r-=e[2]}return r/e.length}function Bt(e){e.model.destroy(),e.material.destroy();for(let t of e.instanceBuffers)t.destroy()}var Vt=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];function Ht(e,t=64){if(!Number.isSafeInteger(t)||t<1)throw Error(`maxLightCount must be a positive safe integer.`);if(e.length>t)throw Error(`Point light count exceeds maxLightCount.`);let n=new Float32Array(t*8);for(let t=0;t<e.length;t++){let r=e[t];if(!(r.range>0)||!(r.intensity>=0))throw Error(`Point light range must be positive and intensity must be non-negative.`);let i=t*8;n.set(r.position,i),n[i+3]=r.range,n.set(r.color,i+4),n[i+7]=r.intensity}return n}var Ut={name:`deferredLighting`,source:`const DEFERRED_LIGHTING_PI: f32 = 3.141592653589793;
const DEFERRED_LIGHTING_MAX_POINT_LIGHTS: u32 = 64u;

struct DeferredLightingUniforms {
  inverseProjectionMatrix: mat4x4f,
  ambientColor: vec3f,
  exposure: f32,
  fogColor: vec3f,
  fogDensity: f32,
  directionalLightDirectionView: vec3f,
  directionalLightColor: vec3f,
  directionalLightIntensity: f32,
  pointLightCount: u32,
};

struct DeferredPointLight {
  positionRange: vec4f,
  colorIntensity: vec4f,
};

@group(0) @binding(auto) var<uniform> deferredLighting: DeferredLightingUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<f32>;
@group(0) @binding(auto) var<storage, read> pointLights: array<DeferredPointLight>;

fn deferredLighting_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = deferredLighting.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn deferredLighting_distributionGGX(normal: vec3f, halfVector: vec3f, roughness: f32) -> f32 {
  let alpha = roughness * roughness;
  let alphaSquared = alpha * alpha;
  let normalDotHalf = max(dot(normal, halfVector), 0.0);
  let normalDotHalfSquared = normalDotHalf * normalDotHalf;
  let denominator = normalDotHalfSquared * (alphaSquared - 1.0) + 1.0;
  return alphaSquared / max(DEFERRED_LIGHTING_PI * denominator * denominator, 0.0001);
}

fn deferredLighting_geometrySchlickGGX(normalDotDirection: f32, roughness: f32) -> f32 {
  let radius = roughness + 1.0;
  let k = radius * radius / 8.0;
  return normalDotDirection / max(normalDotDirection * (1.0 - k) + k, 0.0001);
}

fn deferredLighting_geometrySmith(
  normal: vec3f, viewDirection: vec3f, lightDirection: vec3f, roughness: f32
) -> f32 {
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  return deferredLighting_geometrySchlickGGX(normalDotView, roughness) *
    deferredLighting_geometrySchlickGGX(normalDotLight, roughness);
}

fn deferredLighting_fresnelSchlick(cosine: f32, baseReflectance: vec3f) -> vec3f {
  return baseReflectance + (vec3f(1.0) - baseReflectance) * pow(1.0 - cosine, 5.0);
}

fn deferredLighting_evaluateLight(
  normal: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  radiance: vec3f,
  baseColor: vec3f,
  metallic: f32,
  roughness: f32
) -> vec3f {
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  if (normalDotLight <= 0.0) {
    return vec3f(0.0);
  }
  let halfVector = normalize(viewDirection + lightDirection);
  let baseReflectance = mix(vec3f(0.04), baseColor, metallic);
  let fresnel = deferredLighting_fresnelSchlick(
    max(dot(halfVector, viewDirection), 0.0),
    baseReflectance
  );
  let distribution = deferredLighting_distributionGGX(normal, halfVector, roughness);
  let geometry = deferredLighting_geometrySmith(normal, viewDirection, lightDirection, roughness);
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let specular = distribution * geometry * fresnel /
    max(4.0 * normalDotView * normalDotLight, 0.0001);
  let diffuseWeight = (vec3f(1.0) - fresnel) * (1.0 - metallic);
  let diffuse = diffuseWeight * baseColor / DEFERRED_LIGHTING_PI;
  return (diffuse + specular) * radiance * normalDotLight;
}

fn deferredLighting_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (depth >= 0.99999) {
    return textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  }

  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0);
  let normal = normalize(normalRoughness.rgb * 2.0 - 1.0);
  let roughness = clamp(normalRoughness.a, 0.045, 1.0);
  let baseColorMetallic = textureSampleLevel(
    baseColorMetallicTexture,
    baseColorMetallicTextureSampler,
    sceneCoord,
    0
  );
  let baseColor = max(baseColorMetallic.rgb, vec3f(0.0));
  let metallic = clamp(baseColorMetallic.a, 0.0, 1.0);
  let emissiveOcclusionCoordinates = vec2i(
    clamp(sceneCoord * texSize, vec2f(0.0), texSize - vec2f(1.0))
  );
  let emissiveOcclusion = textureLoad(emissiveOcclusionTexture, emissiveOcclusionCoordinates, 0);
  let emissive = max(emissiveOcclusion.rgb, vec3f(0.0));
  let occlusion = clamp(emissiveOcclusion.a, 0.0, 1.0);
  let viewPosition = deferredLighting_reconstructViewPosition(sceneCoord, depth);
  let viewDirection = normalize(-viewPosition);

  var color = baseColor * deferredLighting.ambientColor * occlusion + emissive;
  let directionalLightDirection = normalize(deferredLighting.directionalLightDirectionView);
  color += deferredLighting_evaluateLight(
    normal,
    viewDirection,
    directionalLightDirection,
    deferredLighting.directionalLightColor * deferredLighting.directionalLightIntensity,
    baseColor,
    metallic,
    roughness
  );

  let lightCount = min(
    min(deferredLighting.pointLightCount, arrayLength(&pointLights)),
    DEFERRED_LIGHTING_MAX_POINT_LIGHTS
  );
  for (var lightIndex = 0u; lightIndex < lightCount; lightIndex++) {
    let light = pointLights[lightIndex];
    let toLight = light.positionRange.xyz - viewPosition;
    let distance = length(toLight);
    if (distance >= light.positionRange.w || distance <= 0.0001) {
      continue;
    }
    let lightDirection = toLight / distance;
    let rangeFade = pow(clamp(1.0 - distance / light.positionRange.w, 0.0, 1.0), 2.0);
    let attenuation = rangeFade / max(1.0, distance * distance * 0.06);
    let radiance = light.colorIntensity.rgb * light.colorIntensity.a * attenuation;
    color += deferredLighting_evaluateLight(
      normal,
      viewDirection,
      lightDirection,
      radiance,
      baseColor,
      metallic,
      roughness
    );
  }

  let cameraDistance = length(viewPosition);
  let fogAmount = 1.0 - exp(-cameraDistance * cameraDistance * deferredLighting.fogDensity);
  color = mix(color, deferredLighting.fogColor, clamp(fogAmount, 0.0, 0.93));
  color *= deferredLighting.exposure;

  return vec4f(color, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0},{name:`baseColorMetallicTexture`,group:0},{name:`emissiveOcclusionTexture`,group:0},{name:`pointLights`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,ambientColor:`vec3<f32>`,exposure:`f32`,fogColor:`vec3<f32>`,fogDensity:`f32`,directionalLightDirectionView:`vec3<f32>`,directionalLightColor:`vec3<f32>`,directionalLightIntensity:`f32`,pointLightCount:`u32`},propTypes:{inverseProjectionMatrix:{value:Vt,private:!0},ambientColor:{value:[.04,.04,.05],private:!0},exposure:{value:1,min:0,softMax:4},fogColor:{value:[.025,.035,.075],private:!0},fogDensity:{value:0,min:0,softMax:.01},directionalLightDirectionView:{value:[.3,.75,.55],private:!0},directionalLightColor:{value:[1,.95,.86],private:!0},directionalLightIntensity:{value:2.5,min:0,softMax:8},pointLightCount:{value:0,min:0,max:64}},passes:[{sampler:!0}]};function Wt(){return{name:`deferredLightingShaderPassPipeline`,steps:[{shaderPass:Ut,inputs:{sourceTexture:`previous`},output:`previous`}]}}var Gt={minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Kt={minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},qt=new Set([`color`,`normalRoughness`,`velocity`,`depth`]),Jt=new Set([`rgba8unorm`,`rgba8unorm-srgb`,`rgba8snorm`,`bgra8unorm`,`bgra8unorm-srgb`,`rgb10a2uint`,`rgb10a2unorm`,`rg11b10ufloat`]),Yt=0,Xt=class{device;id;props;renderTargets;constructor(e,t){if(e.type!==`webgpu`)throw Error(`GBuffer requires a WebGPU device.`);this.device=e,this.id=t.id||cn(`g-buffer`),this.props=Zt(this.id,t),Qt(e,this.props),this.renderTargets=an(e,this.props)}get framebuffer(){return this.renderTargets.framebuffer}get colorTexture(){return this.renderTargets.colorTexture}get normalRoughnessTexture(){return this.renderTargets.normalRoughnessTexture}get velocityTexture(){let e=this.renderTargets.velocityTexture;if(!e)throw Error(`GBuffer velocity attachment is disabled.`);return e}get depthTexture(){return this.renderTargets.depthTexture}get width(){return this.renderTargets.framebuffer.width}get height(){return this.renderTargets.framebuffer.height}getShaderPassBindings(){return{depthTexture:this.depthTexture,normalTexture:this.normalRoughnessTexture,velocityTexture:this.velocityTexture}}getExtraColorTexture(e){let t=this.renderTargets.extraColorTextures.get(e);if(!t)throw Error(`GBuffer has no extra color attachment named "`+e+`".`);return t}resize(e){if(tn(e.width,e.height),e.width===this.width&&e.height===this.height)return!1;let t=this.renderTargets;return this.renderTargets=an(this.device,{...this.props,width:e.width,height:e.height}),sn(t),!0}destroy(){sn(this.renderTargets)}};function Zt(e,t){return{id:e,width:t.width,height:t.height,colorFormat:t.colorFormat||`rgba8unorm`,normalRoughnessFormat:t.normalRoughnessFormat||`rgba8unorm`,velocity:t.velocity??!0,velocityFormat:t.velocityFormat||`rg16float`,depthStencilFormat:t.depthStencilFormat||`depth24plus`,extraColorAttachments:t.extraColorAttachments||[]}}function Qt(e,t){tn(t.width,t.height);let n=[t.colorFormat,t.normalRoughnessFormat,...t.velocity?[t.velocityFormat]:[],...t.extraColorAttachments.map(e=>e.format)],r=n.length;if(r>e.limits.maxColorAttachments)throw Error(`GBuffer requires `+r+` color attachments, but the device supports `+e.limits.maxColorAttachments+`.`);nn(e,t.colorFormat,`color`),nn(e,t.normalRoughnessFormat,`normalRoughness`),t.velocity&&nn(e,t.velocityFormat,`velocity`),rn(e,t.depthStencilFormat,`depth`);let i=new Set;for(let n of t.extraColorAttachments){if(!n.name)throw Error(`GBuffer extra color attachment name is required.`);if(qt.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is reserved.`);if(i.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is duplicated.`);i.add(n.name),nn(e,n.format,n.name)}let a=$t(e,n);if(a>e.limits.maxColorAttachmentBytesPerSample)throw Error(`GBuffer color attachments require `+a+` bytes per sample, but the device supports `+e.limits.maxColorAttachmentBytesPerSample+`.`)}function $t(e,t){let n=0;for(let r of t){let t=en(r);n=Math.ceil(n/t)*t;let i=e.getTextureFormatInfo(r).bytesPerPixel;n+=Jt.has(r)?8:i}return n}function en(e){return e.startsWith(`r8`)||e.startsWith(`rg8`)||e.startsWith(`rgba8`)||e.startsWith(`bgra8`)?1:e.startsWith(`r16`)||e.startsWith(`rg16`)||e.startsWith(`rgba16`)?2:4}function tn(e,t){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<=0||t<=0)throw Error(`GBuffer size must use positive safe integer dimensions.`)}function nn(e,t,n){if(!e.getTextureFormatCapabilities(t).render)throw Error(`GBuffer attachment "`+n+`" requires renderable format `+t+`.`)}function rn(e,t,n){if(!e.getTextureFormatCapabilities(t).create)throw Error(`GBuffer attachment "`+n+`" requires supported format `+t+`.`)}function an(e,t){let n=on(e,t,`color`,t.colorFormat),r=on(e,t,`normal-roughness`,t.normalRoughnessFormat),i=t.velocity?on(e,t,`velocity`,t.velocityFormat):void 0,a=new Map(t.extraColorAttachments.map(n=>[n.name,on(e,t,n.name,n.format,n.sampler)])),s=e.createTexture({id:t.id+`-depth`,format:t.depthStencilFormat,width:t.width,height:t.height,usage:o.SAMPLE|o.RENDER|o.COPY_DST,sampler:Kt});return{framebuffer:e.createFramebuffer({id:t.id+`-framebuffer`,width:t.width,height:t.height,colorAttachments:[n,r,...i?[i]:[],...a.values()],depthStencilAttachment:s}),colorTexture:n,normalRoughnessTexture:r,velocityTexture:i,depthTexture:s,extraColorTextures:a}}function on(e,t,n,r,i=Gt){return e.createTexture({id:t.id+`-`+n,format:r,width:t.width,height:t.height,usage:o.SAMPLE|o.RENDER|o.COPY_DST,sampler:i})}function sn(e){e.framebuffer.destroy(),e.colorTexture.destroy(),e.normalRoughnessTexture.destroy(),e.velocityTexture?.destroy(),e.depthTexture.destroy();for(let t of e.extraColorTextures.values())t.destroy()}function cn(e){return Yt+=1,e+`-`+Yt}var ln=`
struct DeferredSceneVertexInputs {
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
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  @location(7) colors: vec4f,
#else
  @location(7) colors: vec3f,
#endif
#endif
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
};

struct DeferredSceneVertexOutputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) color: vec4f,
  @location(3) textureCoordinates: vec2f,
  @location(4) secondTextureCoordinates: vec2f,
#ifdef HAS_TANGENTS
  @location(5) worldTangent: vec4f,
#endif
};

struct DeferredSceneFragmentOutputs {
  @location(0) color: vec4f,
  @location(1) normalRoughness: vec4f,
  @location(2) baseColorMetallic: vec4f,
  @location(3) emissiveOcclusion: vec4f,
};

fn getDeferredSceneNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}

@vertex
fn vertexMain(inputs: DeferredSceneVertexInputs) -> DeferredSceneVertexOutputs {
  let modelMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = modelMatrix * vec4f(inputs.positions, 1.0);
  let normalMatrix = getDeferredSceneNormalMatrix(mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  ));

  var outputs: DeferredSceneVertexOutputs;
  outputs.position = pbrProjection.modelViewProjectionMatrix * worldPosition;
  outputs.worldPosition = worldPosition.xyz;
  outputs.worldNormal = vec3f(0.0, 0.0, 1.0);
  outputs.textureCoordinates = vec2f(0.0);
  outputs.secondTextureCoordinates = vec2f(0.0);
  outputs.color = vec4f(1.0);

#ifdef HAS_NORMALS
  outputs.worldNormal = normalize(normalMatrix * inputs.normals);
#endif
#ifdef HAS_UV
  outputs.textureCoordinates = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  outputs.secondTextureCoordinates = inputs.texCoords1;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  outputs.color = inputs.colors;
#else
  outputs.color = vec4f(inputs.colors, 1.0);
#endif
#endif
#ifdef HAS_TANGENTS
  outputs.worldTangent = vec4f(
    normalize((modelMatrix * vec4f(inputs.TANGENT.xyz, 0.0)).xyz),
    inputs.TANGENT.w
  );
#endif
  return outputs;
}

@fragment
fn fragmentMain(inputs: DeferredSceneVertexOutputs) -> DeferredSceneFragmentOutputs {
  fragmentInputs.pbr_vPosition = inputs.worldPosition;
  fragmentInputs.pbr_vNormal = normalize(inputs.worldNormal);
  fragmentInputs.pbr_vUV0 = inputs.textureCoordinates;
  fragmentInputs.pbr_vUV1 = inputs.secondTextureCoordinates;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.worldTangent.xyz);
  let bitangent = normalize(cross(inputs.worldNormal, tangent)) * inputs.worldTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.worldNormal);
#endif

  let normalCoordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let worldNormal = getNormal(getTBN(normalCoordinates), normalCoordinates);
  let viewNormal = normalize((pbrScene.viewMatrix * vec4f(worldNormal, 0.0)).xyz);

  var baseColor = pbrMaterial.baseColorFactor * inputs.color;
#ifdef HAS_BASECOLORMAP
  let baseColorCoordinates = getMaterialUV(
    pbrMaterial.baseColorUVSet,
    pbrMaterial.baseColorUVTransform
  );
  baseColor *= SRGBtoLINEAR(textureSample(
    pbr_baseColorSampler,
    pbr_baseColorSamplerSampler,
    baseColorCoordinates
  ));
#endif
#ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
#endif

  var metallic = pbrMaterial.metallicRoughnessValues.x;
  var roughness = pbrMaterial.metallicRoughnessValues.y;
#ifdef HAS_METALROUGHNESSMAP
  let metallicRoughnessCoordinates = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let metallicRoughness = textureSample(
    pbr_metallicRoughnessSampler,
    pbr_metallicRoughnessSamplerSampler,
    metallicRoughnessCoordinates
  );
  roughness *= metallicRoughness.g;
  metallic *= metallicRoughness.b;
#endif

  var emissive = pbrMaterial.emissiveFactor * pbrMaterial.emissiveStrength;
#ifdef HAS_EMISSIVEMAP
  let emissiveCoordinates = getMaterialUV(
    pbrMaterial.emissiveUVSet,
    pbrMaterial.emissiveUVTransform
  );
  emissive *= SRGBtoLINEAR(textureSample(
    pbr_emissiveSampler,
    pbr_emissiveSamplerSampler,
    emissiveCoordinates
  )).rgb;
#endif

  var occlusion = 1.0;
#ifdef HAS_OCCLUSIONMAP
  let occlusionCoordinates = getMaterialUV(
    pbrMaterial.occlusionUVSet,
    pbrMaterial.occlusionUVTransform
  );
  let sampledOcclusion = textureSample(
    pbr_occlusionSampler,
    pbr_occlusionSamplerSampler,
    occlusionCoordinates
  ).r;
  occlusion = mix(1.0, sampledOcclusion, pbrMaterial.occlusionStrength);
#endif

  var outputs: DeferredSceneFragmentOutputs;
  outputs.color = vec4f(baseColor.rgb * 0.015 + emissive, baseColor.a);
  outputs.normalRoughness = vec4f(viewNormal * 0.5 + 0.5, clamp(roughness, 0.045, 1.0));
  outputs.baseColorMetallic = vec4f(baseColor.rgb, clamp(metallic, 0.0, 1.0));
  outputs.emissiveOcclusion = vec4f(max(emissive, vec3f(0.0)), clamp(occlusion, 0.0, 1.0));
  return outputs;
}
`,un=[`rgba16float`,`rgba8unorm`,`rgba8unorm`,`rgba16float`];function dn(e){if(e.renderMode&&e.renderMode!==`default`)return!1;let t=0,n=0;for(let r of e.lights||[])if(r.type===`spot`||r.type===`directional`&&++t>1||r.type===`point`&&++n>64)return!1;return e.environment?.diffuseTexture||e.environment?.specularTexture||e.environment?.brdfLUTTexture?!1:e.surfaces.every(e=>{let t=e.material.uniforms||{},n=e.material.bindings||{};return yt(e.material)!==`BLEND`&&!t.unlit&&!(t.transmissionFactor&&t.transmissionFactor>0)&&!(t.diffuseTransmissionFactor&&t.diffuseTransmissionFactor>0)&&!(t.multiscatterColorFactor||[]).some(e=>e>0)&&!t.bumpMapEnabled&&!n.pbr_bumpSampler&&!(t.thicknessFactor&&t.thicknessFactor>0)&&!(t.clearcoatFactor&&t.clearcoatFactor>0)&&!(t.iridescenceFactor&&t.iridescenceFactor>0)&&!(t.anisotropyStrength&&t.anisotropyStrength>0)&&!(t.sheenColorFactor||[]).some(e=>e>0)&&(t.ior===void 0||t.ior===1.5)&&(t.specularIntensityFactor===void 0||t.specularIntensityFactor===1)&&(t.specularColorFactor||[1,1,1]).every(e=>e===1)&&!t.specularColorMapEnabled&&!t.specularIntensityMapEnabled&&!n.pbr_specularColorSampler&&!n.pbr_specularIntensitySampler})}var fn=class extends _t{buffers=new Map;pointLightBuffer;lightingRenderer;forwardRenderer=null;lastDeferredFrameIdentifiers=new Set;constructor(e){if(e.type!==`webgpu`)throw Error(`Deferred scene rendering requires a WebGPU device.`);super(e),this.pointLightBuffer=e.createBuffer({id:`deferred-scene-point-lights`,data:Ht([],64),usage:n.STORAGE|n.COPY_DST}),this.lightingRenderer=new ne(e,{shaderPasses:[Wt()],colorFormat:`rgba16float`,flipY:!0})}render(e){if(!dn(e))return this.lastDeferredFrameIdentifiers.delete(e.id),this.forwardRenderer||=new _t(this.device),this.forwardRenderer.render(e);let[t,n]=pn(this.device,e),r=this.getGBuffer(e.id,t,n);this.lastDeferredFrameIdentifiers.add(e.id);let i=this.prepareScene(e),a=e.background||[0,0,0,1],o=this.device.beginRenderPass({id:`scene-${e.id}-deferred-gbuffer`,framebuffer:r.framebuffer,clearColors:[new Float32Array([a[0],a[1],a[2],a[3]??1]),new Float32Array([.5,.5,1,1]),new Float32Array([0,0,0,0]),new Float32Array([0,0,0,0])],clearDepth:1});i.statistics.drawCount=this.drawPreparedScene(i,o),o.end();let s=mn(e.lights||[],new p(e.camera.viewMatrix));this.pointLightBuffer.write(Ht(s.pointLights,64)),this.lightingRenderer.resize([t,n]);let c={sourceTexture:r.colorTexture,bindings:{depthTexture:r.depthTexture,normalTexture:r.normalRoughnessTexture,baseColorMetallicTexture:r.getExtraColorTexture(`baseColorMetallic`),emissiveOcclusionTexture:r.getExtraColorTexture(`emissiveOcclusion`),pointLights:this.pointLightBuffer},uniforms:{deferredLighting:{inverseProjectionMatrix:new p(e.camera.projectionMatrix).invert(),ambientColor:s.ambientColor,exposure:e.exposure??1,fogColor:e.fogColor||[0,0,0],fogDensity:e.fogDensity??0,directionalLightDirectionView:s.directionalLightDirectionView,directionalLightColor:s.directionalLightColor,directionalLightIntensity:s.directionalLightIntensity,pointLightCount:s.pointLights.length}}};if(e.framebuffer){let t=this.lightingRenderer.renderToTexture(c);if(t){let n=this.lightingRenderer.textureModel;n.setProps({backgroundTexture:t}),n.predraw(this.device.commandEncoder);let r=this.device.beginRenderPass({id:`scene-${e.id}-deferred-resolve`,framebuffer:e.framebuffer,clearDepth:!1});n.draw(r),r.end()}}else this.lightingRenderer.renderToScreen(c);return i.statistics}getLastDepthTexture(e){return this.lastDeferredFrameIdentifiers.has(e)&&this.buffers.get(e)?.depthTexture||null}destroyFrame(e){super.destroyFrame(e),this.forwardRenderer?.destroyFrame(e),this.buffers.get(e)?.destroy(),this.buffers.delete(e),this.lastDeferredFrameIdentifiers.delete(e)}destroy(){super.destroy(),this.forwardRenderer?.destroy();for(let e of this.buffers.values())e.destroy();this.buffers.clear(),this.lastDeferredFrameIdentifiers.clear(),this.lightingRenderer.destroy(),this.pointLightBuffer.destroy()}getSurfaceModelOptions(e,t){return{source:ln,colorAttachmentFormats:un,depthStencilAttachmentFormat:`depth24plus`}}getGBuffer(e,t,n){let r=this.buffers.get(e);return r?r.resize({width:t,height:n}):(r=new Xt(this.device,{id:`scene-${e}-deferred`,width:t,height:n,colorFormat:`rgba16float`,normalRoughnessFormat:`rgba8unorm`,velocity:!1,depthStencilFormat:`depth24plus`,extraColorAttachments:[{name:`baseColorMetallic`,format:`rgba8unorm`},{name:`emissiveOcclusion`,format:`rgba16float`}]}),this.buffers.set(e,r)),r}};function pn(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function mn(e,t){let n=[0,0,0],r=[0,0,1],i=[1,1,1],a=[],o=0;for(let s of e){let e=hn(s.color||[1,1,1]),c=s.intensity??1;switch(s.type){case`ambient`:n[0]+=e[0]*c,n[1]+=e[1]*c,n[2]+=e[2]*c;break;case`directional`:{let n=t.transformAsVector(s.direction),a=Math.hypot(n[0],n[1],n[2])||1;r[0]=-n[0]/a,r[1]=-n[1]/a,r[2]=-n[2]/a,i[0]=e[0],i[1]=e[1],i[2]=e[2],o=c;break}case`point`:if(a.length<64){let n=t.transformAsPoint(s.position);a.push({position:[n[0],n[1],n[2]],range:Math.max(4,Math.sqrt(Math.max(c,0))*3),color:e,intensity:c})}break}}return{ambientColor:n,directionalLightDirectionView:r,directionalLightColor:i,directionalLightIntensity:o,pointLights:a}}function hn(e){let t=e[0]>1||e[1]>1||e[2]>1?1/255:1;return[e[0]*t,e[1]*t,e[2]*t]}var gn=/^vertex-list<([^<>]+)>$/,_n=/^value-list<([^<>]+)>$/;function vn(e){return gn.test(e)}function yn(e){return _n.test(e)}function bn(e){let t=gn.exec(e),n=_n.exec(e),i=t?.[1]??n?.[1]??e;try{r.getVertexFormatInfo(i)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return i}function xn(e){let t=bn(e),n=vn(e),i=yn(e),a=r.getVertexFormatInfo(t),o=a.type,s=a.normalized,c=Sn(o,s);return{format:e,elementFormat:t,vertexList:n,valueList:i,type:o,signedDataType:Cn(t,o),primitiveType:c,components:a.components,byteLength:a.byteLength,integer:a.integer,signed:a.signed,normalized:s,...a.webglOnly?{webglOnly:!0}:{}}}function Sn(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function Cn(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function wn(e){let t=In(e.nodes),n=Vn(t,e.buffers.values()),r=Hn(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=Jn(c.map(e=>e.byteLength),`imported buffer capacities`),d=Jn(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=qn(u,d,`logical buffer capacities`),p=Jn(n.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=Jn(g.map(Kn),`imported texture estimates`),y=Jn(_.map(Kn),`logical transient texture estimates`),b=qn(v,y,`logical texture estimates`),x=Jn(r.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:n.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:r.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:qn(f,b,`logical resource estimates`),physicalTransientResourceBytes:qn(p,x,`physical transient resource estimates`)},w=Tn(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:o,transientBuffers:i,transientTextures:a,bufferTransientAllocations:n,textureTransientAllocations:r,stats:C,preflight:w}}function Tn(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,type:e.type,...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])Dn(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,O(n.buffer).byteLength));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?qn(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function O(e){return`buffer`in e?e.buffer:e}function En(e){return`texture`in e?e.texture:e}function Dn(e){return`buffer`in e}function On(e){return`texture`in e}function kn(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>Dn(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||O(r.buffer)!==O(n.buffer)||!Nn(r.usage)&&!Nn(n.usage))continue;let a=An(r.buffer),o=An(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=O(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${jn(a)} and ${jn(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function An(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function jn(e){return`${e.offset}–${e.offset+e.size} bytes`}function Mn(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function Nn(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function Pn(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function Fn(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function In(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(Dn(t)){let n=O(t.buffer);if(Mn(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(Nn(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(On(t)){let n=En(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&Ln(n.resource,t)&&(Pn(t.usage)&&Fn(n.resource.usage)||Fn(t.usage)&&(Pn(n.resource.usage)||Fn(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=new Map(e.map((e,t)=>[e.id,t])),s=new Map(Array.from(n,([e,t])=>[e,new Set(t)])),c=[];for(;s.size>0;){let e=Array.from(s).filter(([,e])=>e.size===0).map(([e])=>e).sort((e,t)=>o.get(e)-o.get(t));if(e.length===0)throw Error(`GPUCommandGraph contains a dependency cycle`);for(let n of e){c.push(t.get(n)),s.delete(n);for(let e of s.values())e.delete(n)}}return c}function Ln(e,t){if(En(e.texture)!==En(t.texture))return!1;let n=Rn(e.texture),r=Rn(t.texture);return zn(n.aspect,r.aspect)&&Bn(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&Bn(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function Rn(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function zn(e,t){return e===`all`||t===`all`||e===t}function Bn(e,t,n,r){return e<n+r&&n<e+t}function Vn(e,t){let n=Un(e,e=>Dn(e)?O(e.buffer):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{buffer:e,lifetime:t}of i){if(!t)continue;let n=r.filter(e=>e.lastUse<t.firstUse).sort((e,t)=>e.byteLength-t.byteLength)[0];n||(n={byteLength:0,usage:0,lastUse:-1,handles:[]},r.push(n)),n.byteLength=Math.max(n.byteLength,e.byteLength),n.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function Hn(e,t){let n=Un(e,e=>On(e)?En(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&Gn(n.descriptor,e));n||(n={descriptor:Wn(e),byteLength:Kn(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function Un(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function Wn(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function Gn(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function Kn(e){let n=0;for(let r=0;r<e.mipLevels;r++)n=qn(n,t.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>r),height:e.dimension===`1d`?1:Math.max(1,e.height>>r),depth:e.dimension===`3d`?Math.max(1,e.depth>>r):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let r=n*e.samples;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return r}function qn(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function Jn(e,t){return e.reduce((e,n)=>qn(e,n,t),0)}var Yn=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},Xn=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},k=class{id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,this.data=e.data}},Zn=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},Qn=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},$n=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}},er=4,tr=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){sr(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function nr(e,t,n={}){sr(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=rr();for(;s<a.length;){let r=ir(n,a[s]);if(s>e&&ar(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||or(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:ar(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>ir(e,t),rr());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function rr(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function ir(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function ar(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function or(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function sr(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function cr(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var lr=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length){this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let r=e.filter(e=>e.stats.condition?.outcome!==`skipped`),i=r.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,nodeCount:r.length,skippedNodeCount:e.length-r.length,computePassCount:n,coalescedComputeNodeCount:i-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>({...e,...t?{gpuTimeMilliseconds:await t.querySet.readTimestampDuration(t.beginIndex,t.endIndex)}:{}}))),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0);return{cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},ur=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;tableBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);_r(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){return this.assertMutable(),yr(e,this.device),t&&wr(t,e,this.device),this.addBuffer(new Yn(this,e,!1,t))}createTransientBuffer(e){return this.assertMutable(),yr(e,this.device),this.addBuffer(new Yn(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=xn(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return Cr(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new Xn(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(vn(n)||yn(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new k({id:e,name:t.name,format:n,length:t.length,valueLength:t.valueLength,stride:t.stride,byteStride:t.byteStride,rowByteLength:t.rowByteLength,data:r})}importTexture(e,t){this.assertMutable();let n=xr(e,this.device);return t&&Tr(t,n,this.device),this.addTexture(new Zn(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=xr(e,this.device);return this.addTexture(new Zn(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),br(e,this.device),this.addExternalTexture(new Qn(this,e))}createTransientTexture(e){this.assertMutable();let t=xr(e,this.device);return this.addTexture(new Zn(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new $n(e,Sr(e,t))}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),_r(this.device,`compilation`),this.compiled=!0,new dr(wn({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*er>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>Dn(e)&&O(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(Dn(t)){let e=O(t.buffer);this.assertBuffer(e),Dr(e,t.usage)}else if(On(t)){let e=En(t.texture);this.assertTexture(e),Or(e,t.usage),kr(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}kn(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=fr(t.buffer),r=this.tableBufferHandles.get(n);return r||(r=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),this.tableBufferHandles.set(n,r)),this.createDataView(r,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},dr=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(Dn(t)){let e=O(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(On(t)){let e=En(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=gr(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return nr(this.preflight,e,t)}createExecution(e,t={}){return new tr({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(_r(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=vr(),a=this.resolveImportedBuffers(t.buffers??{});mr(t.frameTextures??{},t.externalTextures??{});let o=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),s=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of o.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of s.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of s.textures.values())this.consumedExternalTextures.add(e);let c=o.textures,l=e=>{let t=O(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},u=e=>{let t=En(e),n=t.transient?this.transientTextures.get(t):c.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},d=e=>{let t=u(e);if(e instanceof Zn||Mr(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},f={commandEncoder:e,parameters:t.parameters,getBuffer:l,getTexture:u,getTextureView:d,getExternalTexture:e=>{let t=s.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},p=[],m,h=0,g=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,_=()=>{let e=m;m=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=vr();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){p.push({stats:{id:n.id,type:n.type,cpuEncodeTimeMilliseconds:vr()-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{m||(m=e.beginComputePass({id:n.id}),h++);let t=m;o=hr(t),o&&(g=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?cr(t,l(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...f,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}g||_();break}case`render`:{_();let t=r,i=t.getRenderPassProps?.(f)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,d):void 0,s=n.attachments?.resolveTargets?.map(e=>e?d(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=hr(c),c.pushDebugGroup(n.id);try{t.encode({...f,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:_(),r.encode(f);break}p.push({stats:{id:n.id,type:n.type,cpuEncodeTimeMilliseconds:vr()-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{_()}return new lr(p,vr()-i,h)}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);wr(a,i,this.device);let o=fr(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);Tr(e.texture,a,this.device),n.set(a,pr(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);Tr(o,a,this.device),n.set(a,pr(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);Er(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function fr(e){return e instanceof re?e.buffer:e}function pr(e){if(e instanceof te){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function mr(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function hr(e){let{timestampQuerySet:t,beginTimestampIndex:n,endTimestampIndex:r}=e.props;return t&&Number.isSafeInteger(n)&&Number.isSafeInteger(r)&&n>=0&&r>n?{querySet:t,beginIndex:n,endIndex:r}:void 0}function gr(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function _r(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function vr(){return globalThis.performance?.now()??Date.now()}function yr(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function br(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function xr(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,r))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function Sr(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function Cr(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function wr(e,t,n){let r=fr(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function Tr(e,t,n){let r=pr(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function Er(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function Dr(e,t){let n=Ar(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function Or(e,t){let n=jr(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function kr(e,t){if(e instanceof $n&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function Ar(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return n.STORAGE;case`uniform`:return n.UNIFORM;case`copy-source`:return n.COPY_SRC;case`copy-destination`:return n.COPY_DST;case`indirect`:return n.INDIRECT;case`vertex`:return n.VERTEX;case`index`:return n.INDEX}}function jr(e){switch(e){case`sampled`:return o.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return o.STORAGE;case`render-attachment`:return o.RENDER;case`copy-source`:return o.COPY_SRC;case`copy-destination`:return o.COPY_DST}}function Mr(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var Nr=class{device;id;textures;previousIndex=0;destroyed=!1;constructor(e,t){this.device=e,this.id=t.id??`gpu-texture-history`;let n=e.createTexture({...t,id:`${this.id}-previous`});try{this.textures=[n,e.createTexture({...t,id:`${this.id}-current`})]}catch(e){throw n.destroy(),e}}get previousTexture(){return this.assertAvailable(),this.textures[this.previousIndex]}get currentTexture(){return this.assertAvailable(),this.textures[1-this.previousIndex]}getBindings(e,t){if(this.assertAvailable(),e===t)throw Error(`GPUTextureHistory previous and current identifiers must differ`);return{[e]:this.previousTexture,[t]:this.currentTexture}}advance(){this.assertAvailable(),this.previousIndex=1-this.previousIndex}reset(){this.assertAvailable(),this.previousIndex=0}destroy(){this.destroyed||(this.destroyed=!0,this.textures[0].destroy(),this.textures[1].destroy())}assertAvailable(){if(this.destroyed)throw Error(`GPUTextureHistory has been destroyed`)}},Pr=Uint32Array.BYTES_PER_ELEMENT,Fr=256;function A(e,t,n){let r=xn(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%Pr!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function j(e,t){A(e,[`uint32`],t)}function M(e,t){let n=Ir(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function Ir(e){let t=Math.floor(e.byteOffset/Fr)*Fr,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function N(e){if(e.byteOffset%Pr!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%Fr/Pr}function P(e,t,r,i,a=n.STORAGE){if(!Number.isSafeInteger(i)||i<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((a&n.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(vn(r)||yn(r))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let o=xn(r),s=e.createTransientBuffer({id:t,byteLength:Math.max(i,1)*o.byteLength,usage:a});return e.createDataView(s,{format:r,length:i})}function Lr(e,t,n){if(e.length!==t.length||e.data.length!==t.data.length||e.data.some((e,n)=>e.length!==t.data[n].length))throw Error(`${n} must preserve the same chunk topology`)}var Rr=4294967295,zr=4294967296;function Br(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>Rr)throw Error(`${e} element count must be a non-negative uint32`);Hr(e,n);let i=Math.floor(r);if(!Number.isSafeInteger(i)||i<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let a=Math.max(1,Math.ceil(t/n)),o=Math.min(a,i),s=Math.min(Math.ceil(a/o),i),c=Math.ceil(a/o/s);if(c>i)throw Error(`${e} requires ${a} workgroups, exceeding the 3D dispatch limit of ${i} per dimension`);return{x:o,y:s,z:c}}function Vr(e,t){Hr(`GPU dispatch`,t);let n=Math.floor(Rr/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function Hr(e,t){if(!Number.isSafeInteger(t)||t<2||t>Rr||zr%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function Ur(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var F=256,Wr=64;function Gr(e,t=!1){return t?`portable`:Ur(e,{requiresSubgroupId:!0})}var Kr=class{id;input;output;mode;segmentFlags;constructor(e){this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,Zr(this.input,`${this.id} input`),Zr(this.output,`${this.id} output`);let t=this.input instanceof k;if(t!==this.output instanceof k)throw Error(`${this.id} input and output must both be data views or vector views`);if(this.input instanceof k&&this.output instanceof k)Lr(this.input,this.output,`${this.id} output`);else if(this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.segmentFlags){if(Zr(this.segmentFlags,`${this.id} segmentFlags`),t!==this.segmentFlags instanceof k)throw Error(`${this.id} input and segmentFlags must both be data views or vector views`);if(this.input instanceof k&&this.segmentFlags instanceof k)Lr(this.input,this.segmentFlags,`${this.id} segmentFlags`);else if(this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);let e=new Set(Qr(this.output).map(e=>e.buffer));if(Qr(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}addToGraph(e){qr(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function qr(e,t,n){$r(t,e.input,e.id),$r(t,e.output,e.id),e.segmentFlags&&$r(t,e.segmentFlags,e.id),Jr(t,{id:e.id,input:e.input,output:e.output,mode:e.mode,segmentFlags:e.segmentFlags},n)}function Jr(e,t,n){let r=Qr(t.input),i=Qr(t.output),a=t.segmentFlags?Qr(t.segmentFlags):void 0,o=r.map((e,t)=>({chunkIndex:t,input:e,output:i[t],segmentFlags:a?.[t]})).filter(e=>e.input.length>0);if(o.length===0)return;let s=t.input instanceof k;if(o.length===1){let r=o[0];Yr(e,{id:s?`${t.id}-chunk-${r.chunkIndex}`:t.id,input:r.input,output:r.output,mode:t.mode,segmentFlags:r.segmentFlags,maxComputeWorkgroupsPerDimension:n});return}let c=P(e,`${t.id}-chunk-totals`,`uint32`,o.length),l=P(e,`${t.id}-chunk-offsets`,`uint32`,o.length),u=t.segmentFlags?P(e,`${t.id}-chunk-segment-flags`,`uint32`,o.length):void 0,d=t.segmentFlags?o.map(n=>P(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[r,i]of o.entries())Yr(e,{id:`${t.id}-chunk-${i.chunkIndex}`,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,outputSegmentPrefixes:d?.[r],finalSum:Xr(e,c,r),finalSegmentFlag:u?Xr(e,u,r):void 0,maxComputeWorkgroupsPerDimension:n});Yr(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n});for(let[r,i]of o.entries())ri(e,{id:`${t.id}-chunk-${i.chunkIndex}-add-carry`,output:i.output,offsets:l,length:i.output.length,offsetIndex:r,segmentPrefixes:d?.[r],dispatchLayout:ii(i.output.length,n)})}function Yr(e,t){if(t.input.length===0)return;let n=[],r=t.input,i=t.output,a=t.segmentFlags,o=t.input.length,s=0;for(;;){let c=Math.ceil(o/F),l,u;c>1&&(l=P(e,`${t.id}-level-${s}-block-sums`,`uint32`,c),a&&(u=P(e,`${t.id}-level-${s}-block-segment-flags`,`uint32`,c)));let d=a?s===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:c>1||s>0?P(e,`${t.id}-level-${s}-segment-prefixes`,`uint32`,o):void 0:void 0;if(ei(e,{id:`${t.id}-level-${s}-scan`,input:r,output:i,mode:s===0?t.mode:`exclusive`,segmentFlags:a,segmentSummaryInput:!!a&&(s>0||t.segmentSummaryInput),segmentPrefixes:d,blockSums:l,blockSegmentFlags:u,finalSum:l?void 0:t.finalSum,finalSegmentFlag:l?void 0:t.finalSegmentFlag,length:o,blockCount:c,dispatchLayout:ii(o,t.maxComputeWorkgroupsPerDimension)}),n.push({output:i,length:o,segmentPrefixes:d}),!l)break;let f=P(e,`${t.id}-level-${s}-block-offsets`,`uint32`,c);n[n.length-1].blockOffsets=f,r=l,i=f,a=u,o=c,s++}for(let r=n.length-2;r>=0;r--){let i=n[r],a=n[r+1];ri(e,{id:`${t.id}-level-${r}-add-offsets`,output:i.output,offsets:i.blockOffsets,length:i.length,segmentPrefixes:i.segmentPrefixes,offsetSegmentPrefixes:a.segmentPrefixes,dispatchLayout:ii(i.length,t.maxComputeWorkgroupsPerDimension)})}}function Xr(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function Zr(e,t){let n=e instanceof k?e.data:[e];for(let e of n)j(e,t)}function Qr(e){return e instanceof k?e.data:[e]}function $r(e,t,n){if((t instanceof k?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function ei(e,t){let n=t.blockSums??t.finalSum,r=t.blockSegmentFlags??t.finalSegmentFlag,i=n?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,a=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,o=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,s=r?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,c=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,l=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,u=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,d=t.segmentFlags?`if (lane >= stride) {
      scratch[lane] = select(addend + scratch[lane], scratch[lane], segmentScratch[lane] != 0u);
      segmentScratch[lane] = addendSegment | segmentScratch[lane];
    }`:`if (lane >= stride) {
      scratch[lane] = scratch[lane] + addend;
    }`,f=t.mode===`inclusive`?`scratch[lane]`:`scratch[lane] - inputValue`,p=t.segmentFlags&&t.mode===`exclusive`?`var scannedOutput = 0u;
    if (lane > 0u) {
      scannedOutput = scratch[lane - 1u];
    }
    ${t.segmentSummaryInput?``:`if (inputSegmentFlag != 0u) { scannedOutput = 0u; }`}
    outputValues[OUTPUT_OFFSET + index] = scannedOutput;`:`outputValues[OUTPUT_OFFSET + index] = ${f};`,m=t.segmentPrefixes?t.segmentSummaryInput?`var segmentPrefix = 0u;
    if (lane > 0u) {
      segmentPrefix = segmentScratch[lane - 1u];
    }
    segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix;`:`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentScratch[lane];`:``,h=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const BLOCK_COUNT: u32 = ${t.blockCount}u;
const INPUT_OFFSET: u32 = ${N(t.input)}u;
const OUTPUT_OFFSET: u32 = ${N(t.output)}u;
${n?`const SUM_OFFSET: u32 = ${N(n)}u;`:``}
${t.segmentFlags?`const SEGMENT_FLAGS_OFFSET: u32 = ${N(t.segmentFlags)}u;`:``}
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${N(t.segmentPrefixes)}u;`:``}
${r?`const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${N(r)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${i}
${a}
${o}
${s}
var<workgroup> scratch: array<u32, ${F}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${F}>;`:``}

@compute @workgroup_size(${F}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${ai(t.dispatchLayout)}
  if (workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = localInvocationIndex;
  var inputValue = 0u;
  var inputSegmentFlag = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
    inputSegmentFlag = ${u};
  }
  scratch[lane] = inputValue;
  ${t.segmentFlags?`segmentScratch[lane] = inputSegmentFlag;`:``}
  workgroupBarrier();

  for (var stride = 1u; stride < ${F}u; stride = stride * 2u) {
    var addend = 0u;
    ${t.segmentFlags?`var addendSegment = 0u;`:``}
    if (lane >= stride) {
      addend = scratch[lane - stride];
      ${t.segmentFlags?`addendSegment = segmentScratch[lane - stride];`:``}
    }
    workgroupBarrier();
    ${d}
    workgroupBarrier();
  }

  if (lane == ${F-1}u) {
    ${c}
    ${l}
  }
  if (index < ELEMENT_COUNT) {
    ${p}
    ${m}
  }
}`,g=ti(e,!!t.segmentFlags,t.length),_=g===`subgroups`?ni(t,n,i):h;e.addComputePass({id:t.id,workload:{operation:`GPUScan`,variant:g,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*F,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...n?[{buffer:n,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...r?[{buffer:r,usage:`storage-write`}]:[]],compile:({device:e})=>{let i=new w(e,{id:t.id,source:_,shaderLayout:{bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...n?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...r?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]}});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:M(t.input,a),outputValues:M(t.output,a)};n&&(o.sumValues=M(n,a)),t.segmentFlags&&(o.segmentFlags=M(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=M(t.segmentPrefixes,a)),r&&(o.summarySegmentFlags=M(r,a)),i.setBindings(o),i.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>i.destroy()}}})}function ti(e,t,n){let r=Gr(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||Gr(e.device,!1)===`subgroups`}]}).variant}function ni(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/F)+1;return`
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${e.length}u;
const BLOCK_COUNT: u32 = ${e.blockCount}u;
const INPUT_OFFSET: u32 = ${N(e.input)}u;
const OUTPUT_OFFSET: u32 = ${N(e.output)}u;
${t?`const SUM_OFFSET: u32 = ${N(t)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${n}
var<workgroup> subgroupOffsets: array<u32, ${Wr}>;

@compute @workgroup_size(${F}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${F}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${F}u / subgroupSize;
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
  if (lane == ${F-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function ri(e,t){let n=t.offsetIndex===void 0?`index / ${F}u`:`${t.offsetIndex}u`,r=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${N(t.output)}u;
const OFFSETS_OFFSET: u32 = ${N(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${N(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${N(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${F}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${ai(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${n}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${n}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`;e.addComputePass({id:t.id,workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*F,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new w(e,{id:t.id,source:r,shaderLayout:{bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]}});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:M(t.output,r),offsets:M(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=M(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=M(t.offsetSegmentPrefixes,r)),n.setBindings(i),n.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>n.destroy()}}})}function ii(e,t){return Br(`GPUScan`,e,F,t)}function ai(e){return Vr(e,F)}var oi=256,si=4294967295,ci=4294967295,li=class{id;keys;values;outputKeys;outputValues;segments;direction;constructor(e){this.id=e.id??`gpu-segmented-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.direction=e.direction??`ascending`;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])j(t,`${this.id} ${e}`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(this.outputKeys.buffer===this.outputValues.buffer||this.outputKeys.buffer===this.keys.buffer||this.outputKeys.buffer===this.values.buffer||this.outputValues.buffer===this.keys.buffer||this.outputValues.buffer===this.values.buffer)throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>di(this,e,t)),fi(this.segments,`outputKeysOffset`,`${this.id} output keys`),fi(this.segments,`outputValuesOffset`,`${this.id} output values`)}addToGraph(e){ui(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function ui(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);let r=pi(e.segments),i=Array.from(r,([t,r])=>({width:t,segments:r,dispatchLayout:Br(`${e.id} ${t}-wide segments`,r.length*t,t,n)}));for(let n of i)mi(t,e,n.width,n.segments,n.dispatchLayout)}function di(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isInteger(t.length)||t.length<0||t.length>oi)throw Error(`${r} length must be an integer from 0 to ${oi}`);for(let[n,i]of[[`keysOffset`,e.keys],[`valuesOffset`,e.values],[`outputKeysOffset`,e.outputKeys],[`outputValuesOffset`,e.outputValues]]){let e=t[n];if(!Number.isSafeInteger(e)||e<0||e>ci)throw Error(`${r} ${n} must be a non-negative uint32`);if(e>i.length||t.length>i.length-e)throw Error(`${r} ${n} and length exceed the parent view`)}return{keysOffset:t.keysOffset,valuesOffset:t.valuesOffset,outputKeysOffset:t.outputKeysOffset,outputValuesOffset:t.outputValuesOffset,length:t.length}}function fi(e,t,n){let r=e.filter(e=>e.length>0).slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+i.length)throw Error(`${n} segments must not overlap`)}}function pi(e){let t=new Map;for(let n of e){if(n.length===0)continue;let e=2;for(;e<n.length;)e*=2;let r=t.get(e);r?r.push(n):t.set(e,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function mi(e,t,n,r,i){let a=r.map(e=>`  SortSegment(${e.keysOffset}u, ${e.valuesOffset}u, ${e.outputKeysOffset}u, ${e.outputValuesOffset}u, ${e.length}u)`).join(`,
`),o=t.direction===`descending`,s=Ur(e.device,{requiresSubgroupId:!0})===`subgroups`,c=`
${s?`enable subgroups;
requires subgroup_id;`:``}
struct SortSegment {
  keysOffset: u32,
  valuesOffset: u32,
  outputKeysOffset: u32,
  outputValuesOffset: u32,
  length: u32,
};

const INVALID_INDEX: u32 = ${si}u;
const SEGMENT_COUNT: u32 = ${r.length}u;
const KEYS_OFFSET: u32 = ${N(t.keys)}u;
const VALUES_OFFSET: u32 = ${N(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${N(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${N(t.outputValues)}u;
const SEGMENTS: array<SortSegment, ${r.length}> = array<SortSegment, ${r.length}>(
${a}
);

@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
var<workgroup> indices: array<u32, ${n}>;
var<workgroup> cachedKeys: array<u32, ${n}>;

fn comes_before(leftIndex: u32, rightIndex: u32, length: u32) -> bool {
  let leftValid = leftIndex != INVALID_INDEX && leftIndex < length;
  let rightValid = rightIndex != INVALID_INDEX && rightIndex < length;
  if (leftValid != rightValid) { return leftValid; }
  if (!leftValid) { return false; }
  let leftKey = cachedKeys[leftIndex];
  let rightKey = cachedKeys[rightIndex];
  if (leftKey == rightKey) { return leftIndex < rightIndex; }
  return ${o?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${n}) fn main(
  ${s?`@builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,`:`@builtin(local_invocation_index) localInvocationIndex: u32,`}
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let segmentIndex =
    (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  if (segmentIndex >= SEGMENT_COUNT) { return; }
  let segment = SEGMENTS[segmentIndex];
${s?gi(n):hi(n)}
}`,l=`${t.id}-bitonic-local-${n}`,u={keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues};e.addComputePass({id:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],compile:({device:e})=>{let t=new w(e,{id:l,source:c,shaderLayout:{bindings:Object.keys(u).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(u))r[e]=M(t,n);t.setBindings(r),t.dispatch(e,i.x,i.y,i.z)},destroy:()=>t.destroy()}}})}function hi(e){return`
  indices[localInvocationIndex] = select(
    INVALID_INDEX,
    localInvocationIndex,
    localInvocationIndex < segment.length
  );
  if (localInvocationIndex < segment.length) {
    cachedKeys[localInvocationIndex] =
      keys[KEYS_OFFSET + segment.keysOffset + localInvocationIndex];
  } else {
    cachedKeys[localInvocationIndex] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= ${e}u; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      let partnerIndex = localInvocationIndex ^ compareStride;
      if (partnerIndex > localInvocationIndex) {
        let leftIndex = indices[localInvocationIndex];
        let rightIndex = indices[partnerIndex];
        let ascending = (localInvocationIndex & blockWidth) == 0u;
        let shouldSwap = select(
          comes_before(leftIndex, rightIndex, segment.length),
          comes_before(rightIndex, leftIndex, segment.length),
          ascending
        );
        indices[localInvocationIndex] = select(leftIndex, rightIndex, shouldSwap);
        indices[partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
      }
      workgroupBarrier();
    }
  }

  if (localInvocationIndex < segment.length) {
    let sourceIndex = indices[localInvocationIndex];
    outputKeys[OUTPUT_KEYS_OFFSET + segment.outputKeysOffset + localInvocationIndex] =
      cachedKeys[sourceIndex];
    outputValues[OUTPUT_VALUES_OFFSET + segment.outputValuesOffset + localInvocationIndex] =
      values[VALUES_OFFSET + segment.valuesOffset + sourceIndex];
  }`}function gi(e){return`
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  var currentIndex = select(INVALID_INDEX, lane, lane < segment.length);
  if (lane < segment.length) {
    cachedKeys[lane] = keys[KEYS_OFFSET + segment.keysOffset + lane];
  } else {
    cachedKeys[lane] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= ${e}u; blockWidth <<= 1u) {
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
        comes_before(leftIndex, rightIndex, segment.length),
        comes_before(rightIndex, leftIndex, segment.length),
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

  if (lane < segment.length) {
    outputKeys[OUTPUT_KEYS_OFFSET + segment.outputKeysOffset + lane] = cachedKeys[currentIndex];
    outputValues[OUTPUT_VALUES_OFFSET + segment.outputValuesOffset + lane] =
      values[VALUES_OFFSET + segment.valuesOffset + currentIndex];
  }`}var _i=256,vi=256,yi=4,bi=vi/32,xi=4294967295,Si=2147483648,Ci=_i,wi=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])j(t,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>Si)throw Error(`${this.id} supports at most ${Si} rows`);Ei(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=Ci?`bitonic`:`radix`:this.algorithm}addToGraph(e){Ti(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function Ti(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);if(e.keys.length===0)return;if(e.keys.length===1){Di(t,e);return}let r=Br(`GPUSort`,e.keys.length,vi,n);e.resolvedAlgorithm===`bitonic`?Oi(t,e,r,n):Fi(t,e,r,n)}function Ei(e){if(e.outputKeys.buffer===e.outputValues.buffer||e.outputKeys.buffer===e.keys.buffer||e.outputKeys.buffer===e.values.buffer||e.outputValues.buffer===e.keys.buffer||e.outputValues.buffer===e.values.buffer)throw Error(`${e.id} outputs must use separate buffers from inputs and each other`)}function Di(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${N(n)}u;
const VALUES_OFFSET: u32 = ${N(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${N(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${N(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${vi}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Vr(a,vi)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;Bi(e,{id:`${t.id}-${i}`,source:o,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})}function Oi(e,t,n,r){let i=Ri(t.keys.length);if(i<=_i){ki(e,t,i);return}let a=Br(`GPUSort bitonic`,i,_i,r),o=P(e,`${t.id}-bitonic-indices-a`,`uint32`,i),s=P(e,`${t.id}-bitonic-indices-b`,`uint32`,i);Mi(e,t,o,i,a);let c=o,l=s;for(let n of zi(i))Ni(e,t,c,l,i,n,a),[c,l]=[l,c];Pi(e,t,c,n)}function ki(e,t,n){let r=t.direction===`descending`,i=Ur(e.device,{requiresSubgroupId:!0})===`subgroups`,a=`
${i?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${xi}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${n}u;
const KEYS_OFFSET: u32 = ${N(t.keys)}u;
const VALUES_OFFSET: u32 = ${N(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${N(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${N(t.outputValues)}u;
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
  return ${r?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${n}) fn main(
  ${i?`@builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32`:`@builtin(local_invocation_index) localInvocationIndex: u32`}
) {
${i?ji():Ai()}
}`;Bi(e,{id:`${t.id}-bitonic-local`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})}function Ai(){return`
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
  }`}function ji(){return`
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
  }`}function Mi(e,t,n,r,i){let a=`
const INVALID_INDEX: u32 = ${xi}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${N(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${_i}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Vr(i,_i)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;Bi(e,{id:`${t.id}-bitonic-initialize`,source:a,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})}function Ni(e,t,n,r,i,a,o){let s=t.direction===`descending`,c=`
const INVALID_INDEX: u32 = ${xi}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${i}u;
const BLOCK_WIDTH: u32 = ${a.blockWidth}u;
const COMPARE_STRIDE: u32 = ${a.compareStride}u;
const KEYS_OFFSET: u32 = ${N(t.keys)}u;
const INDICES_IN_OFFSET: u32 = ${N(n)}u;
const INDICES_OUT_OFFSET: u32 = ${N(r)}u;
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
  return ${s?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${_i}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Vr(o,_i)}
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
}`;Bi(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:c,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})}function Pi(e,t,n,r){let i=`
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${N(t.keys)}u;
const VALUES_OFFSET: u32 = ${N(t.values)}u;
const INDICES_OFFSET: u32 = ${N(n)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${N(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${N(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${_i}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Vr(r,_i)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;Bi(e,{id:`${t.id}-bitonic-gather`,source:i,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})}function Fi(e,t,n,r){let i=Math.ceil(t.keyBits/yi),a=Math.ceil(t.keys.length/vi),o=i>1?P(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,s=i>1?P(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,c=t.keys,l=t.values;for(let u=0;u<i;u++){let d=u*yi,f=Math.min(yi,t.keyBits-d),p=2**f,m=P(e,`${t.id}-radix-digit-${d}-histogram`,`uint32`,p*a),h=P(e,`${t.id}-radix-digit-${d}-offsets`,`uint32`,p*a),g=(i-u)%2==1,_=g?t.outputKeys:o,v=g?t.outputValues:s;if(!_||!v)throw Error(`${t.id} radix scratch is missing`);Ii(e,t,c,m,d,f,a,n),qr(new Kr({id:`${t.id}-radix-digit-${d}-scan`,input:m,output:h}),e,r),Li(e,t,c,l,h,_,v,d,f,a,n),c=_,l=v}}function Ii(e,t,n,r,i,a,o,s){let c=2**a,l=t.direction===`descending`,u=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${i}u;
const BUCKET_COUNT: u32 = ${c}u;
const DIGIT_MASK: u32 = ${c-1}u;
const WORKGROUP_COUNT: u32 = ${o}u;
const KEYS_OFFSET: u32 = ${N(n)}u;
const HISTOGRAM_OFFSET: u32 = ${N(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${c}>;

@compute @workgroup_size(${vi}) fn main(
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

  let index = workgroupIndex * ${vi}u + localInvocationIndex;
  if (index < ELEMENT_COUNT) {
    let key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    let bucket = ${l?`DIGIT_MASK - digit`:`digit`};
    atomicAdd(&digitCounts[bucket], 1u);
  }
  workgroupBarrier();

  if (localInvocationIndex < BUCKET_COUNT) {
    histogram[HISTOGRAM_OFFSET + localInvocationIndex * WORKGROUP_COUNT + workgroupIndex] =
      atomicLoad(&digitCounts[localInvocationIndex]);
  }
}`;Bi(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:u,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})}function Li(e,t,n,r,i,a,o,s,c,l,u){let d=2**c,f=t.direction===`descending`,p=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${d-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${bi}u;
const MASK_COUNT: u32 = ${d*bi}u;
const KEYS_OFFSET: u32 = ${N(n)}u;
const VALUES_OFFSET: u32 = ${N(r)}u;
const OFFSETS_OFFSET: u32 = ${N(i)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${N(a)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${N(o)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${d*bi}>;

@compute @workgroup_size(${vi}) fn main(
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

  let index = workgroupIndex * ${vi}u + localInvocationIndex;
  let valid = index < ELEMENT_COUNT;
  var key = 0u;
  var bucket = 0u;
  if (valid) {
    key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    bucket = ${f?`DIGIT_MASK - digit`:`digit`};
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
}`;Bi(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:p,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})}function Ri(e){let t=1;for(;t<e;)t*=2;return t}function zi(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function Bi(e,t){e.addComputePass({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new w(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=M(n,r);n.setBindings(i),n.dispatch(e,t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z)},destroy:()=>n.destroy()}}})}var Vi=256,Hi=128,Ui=64,Wi=4294967295,Gi=class{id;strategy;resolvedStrategy;minima;maxima;sourceIds;leafCapacity;nodeMinima;nodeMaxima;nodeChildren;leafIds;count;overflow;dimension;nodeCount;internalNodeCount;levelCount;rootNode=0;topology=`complete-binary`;updatePolicy=`refit`;stats;constructor(e){if(this.id=e.id??`gpu-bvh`,this.strategy=e.strategy??`auto`,this.minima=e.minima,this.maxima=e.maxima,this.sourceIds=e.sourceIds,this.leafCapacity=e.leafCapacity,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.count=e.count,this.overflow=e.overflow,this.dimension=this.minima.format===`float32x2`?2:3,this.minima.length>Wi)throw Error(`${this.id} source row count exceeds uint32 range`);if(!Number.isSafeInteger(this.leafCapacity)||!Qi(this.leafCapacity))throw Error(`${this.id} leafCapacity must be a positive power of two`);if(![`auto`,`fused`,`level`].includes(this.strategy))throw Error(`${this.id} strategy must be auto, fused, or level`);let t=this.minima.buffer.graph.device.limits,n=this.leafCapacity<=Hi&&this.leafCapacity<=t.maxComputeInvocationsPerWorkgroup&&this.leafCapacity<=t.maxComputeWorkgroupSizeX&&this.leafCapacity*Ui<=t.maxComputeWorkgroupStorageSize;if(this.strategy===`fused`&&!n)throw Error(`${this.id} fused strategy exceeds portable single-workgroup limits`);if(this.resolvedStrategy=this.strategy===`level`||!n?`level`:`fused`,this.nodeCount=this.leafCapacity*2-1,this.internalNodeCount=this.leafCapacity-1,this.levelCount=Math.log2(this.leafCapacity)+1,!Number.isSafeInteger(this.nodeCount)||this.nodeCount>Wi)throw Error(`${this.id} node count exceeds uint32 range`);if(A(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),A(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),A(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),A(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),A(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),j(this.leafIds,`${this.id} leafIds`),j(this.count,`${this.id} count`),j(this.overflow,`${this.id} overflow`),this.sourceIds&&j(this.sourceIds,`${this.id} sourceIds`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.sourceIds&&this.sourceIds.length!==this.minima.length)throw Error(`${this.id} sourceIds.length must equal bounds length`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeCount||this.nodeMaxima.length!==this.nodeCount)throw Error(`${this.id} node bounds must match source format and node count`);if(this.nodeChildren.length!==this.nodeCount)throw Error(`${this.id} nodeChildren.length must equal node count`);if(this.leafIds.length!==this.leafCapacity)throw Error(`${this.id} leafIds.length must equal leafCapacity`);if(this.count.length<1||this.overflow.length<1)throw Error(`${this.id} count and overflow must each contain one uint32 row`);let r=xn(this.minima.format).byteLength;this.stats={dimension:this.dimension,leafCapacity:this.leafCapacity,internalNodeCount:this.internalNodeCount,nodeCount:this.nodeCount,levelCount:this.levelCount,outputByteLength:this.nodeCount*(r*2+Uint32Array.BYTES_PER_ELEMENT*2)+this.leafCapacity*Uint32Array.BYTES_PER_ELEMENT+Uint32Array.BYTES_PER_ELEMENT*2}}addToGraph(e){if([this.minima,this.maxima,...this.sourceIds?[this.sourceIds]:[],this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.count,this.overflow].some(t=>t.buffer.graph!==e))throw Error(`${this.id} views must belong to the target graph`);if(this.resolvedStrategy===`fused`)Ki(e,this);else{qi(e,this,Zi(this.nodeCount,e.device.limits.maxComputeWorkgroupsPerDimension));for(let t=this.levelCount-2;t>=0;t--)Yi(e,this,t)}this.sourceIds&&Ji(e,this,this.sourceIds)}};function Ki(e,t){let n=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${N(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${N(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${N(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${N(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${N(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${N(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${N(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${N(t.overflow)}u;
@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflow: array<u32>;

var<workgroup> sharedMinima: array<vec4<f32>, ${t.leafCapacity*2}>;
var<workgroup> sharedMaxima: array<vec4<f32>, ${t.leafCapacity*2}>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${t.leafCapacity}) fn main(
  @builtin(local_invocation_index) localIndex: u32
) {
  var minimum = vec4<f32>(3.402823466e+38);
  var maximum = vec4<f32>(-3.402823466e+38);
  let leafNode = INTERNAL_NODE_COUNT + localIndex;
  let leafComponent = leafNode * DIMENSION;
  let leafChildComponent = leafNode * 2u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${Wi}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${Wi}u;
  leafIds[LEAF_IDS_OFFSET + localIndex] = ${Wi}u;

  if (localIndex < STORED_COUNT) {
    let sourceComponent = localIndex * DIMENSION;
    var valid = true;
    for (var axis = 0u; axis < DIMENSION; axis++) {
      let sourceMinimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
      let sourceMaximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      valid = valid && finite(sourceMinimum) && finite(sourceMaximum) &&
        sourceMinimum <= sourceMaximum;
    }
    leafIds[LEAF_IDS_OFFSET + localIndex] = localIndex;
    if (valid) {
      for (var axis = 0u; axis < DIMENSION; axis++) {
        minimum[axis] = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        maximum[axis] = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      }
    }
  }

  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + leafComponent + axis] = minimum[axis];
    nodeMaxima[NODE_MAXIMA_OFFSET + leafComponent + axis] = maximum[axis];
  }
  sharedMinima[localIndex] = minimum;
  sharedMaxima[localIndex] = maximum;

  if (localIndex < INTERNAL_NODE_COUNT) {
    let childComponent = localIndex * 2u;
    nodeChildren[CHILDREN_OFFSET + childComponent] = localIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = localIndex * 2u + 2u;
  }
  if (localIndex == 0u) {
    outputCount[COUNT_OFFSET] = SOURCE_COUNT;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, SOURCE_COUNT > LEAF_CAPACITY);
  }
  workgroupBarrier();

  var sourceOffset = 0u;
  var destinationOffset = LEAF_CAPACITY;
  for (var levelNodeCount = LEAF_CAPACITY / 2u;
       levelNodeCount > 0u;
       levelNodeCount = levelNodeCount / 2u) {
    if (localIndex < levelNodeCount) {
      let firstChild = sourceOffset + localIndex * 2u;
      let reducedMinimum = min(sharedMinima[firstChild], sharedMinima[firstChild + 1u]);
      let reducedMaximum = max(sharedMaxima[firstChild], sharedMaxima[firstChild + 1u]);
      sharedMinima[destinationOffset + localIndex] = reducedMinimum;
      sharedMaxima[destinationOffset + localIndex] = reducedMaximum;

      let nodeIndex = levelNodeCount - 1u + localIndex;
      let nodeComponent = nodeIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = reducedMinimum[axis];
        nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = reducedMaximum[axis];
      }
    }
    workgroupBarrier();
    let previousSourceOffset = sourceOffset;
    sourceOffset = destinationOffset;
    destinationOffset = previousSourceOffset;
  }
}`,r=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];Xi(e,{id:`${t.id}-fused-refit`,source:n,resources:r,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchCount:1})}function qi(e,t,n){let r=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const NODE_COUNT: u32 = ${t.nodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${N(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${N(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${N(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${N(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${N(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${N(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${N(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${N(t.overflow)}u;
@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflow: array<u32>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${Vi}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${n.y}u + workgroupId.y) * ${n.x}u + workgroupId.x;
  let nodeIndex = workgroupIndex * ${Vi}u + localId.x;
  if (nodeIndex >= NODE_COUNT) { return; }
  let nodeComponent = nodeIndex * DIMENSION;
  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = 3.402823466e+38;
    nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = -3.402823466e+38;
  }
  let childComponent = nodeIndex * 2u;
  if (nodeIndex < INTERNAL_NODE_COUNT) {
    nodeChildren[CHILDREN_OFFSET + childComponent] = nodeIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = nodeIndex * 2u + 2u;
  } else {
    nodeChildren[CHILDREN_OFFSET + childComponent] = ${Wi}u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = ${Wi}u;
    let leafIndex = nodeIndex - INTERNAL_NODE_COUNT;
    leafIds[LEAF_IDS_OFFSET + leafIndex] = ${Wi}u;
    if (leafIndex < STORED_COUNT) {
      var valid = true;
      let sourceComponent = leafIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        let minimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        let maximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
        valid = valid && finite(minimum) && finite(maximum) && minimum <= maximum;
      }
      leafIds[LEAF_IDS_OFFSET + leafIndex] = leafIndex;
      if (valid) {
        for (var axis = 0u; axis < DIMENSION; axis++) {
          nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] =
            sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
          nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] =
            sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
        }
      }
    }
  }
  if (nodeIndex == 0u) {
    outputCount[COUNT_OFFSET] = SOURCE_COUNT;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, SOURCE_COUNT > LEAF_CAPACITY);
  }
}`,i=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];Xi(e,{id:`${t.id}-load-leaves`,source:r,resources:i,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchSize:n})}function Ji(e,t,n){let r=Math.min(n.length,t.leafCapacity),i=Zi(r,e.device.limits.maxComputeWorkgroupsPerDimension),a=`
const STORED_COUNT: u32 = ${r}u;
const SOURCE_IDS_OFFSET: u32 = ${N(n)}u;
const LEAF_IDS_OFFSET: u32 = ${N(t.leafIds)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read_write> leafIds: array<u32>;

@compute @workgroup_size(${Vi}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  let leafIndex = workgroupIndex * ${Vi}u + localId.x;
  if (leafIndex >= STORED_COUNT) { return; }
  let sourceIndex = leafIds[LEAF_IDS_OFFSET + leafIndex];
  if (sourceIndex == ${Wi}u) { return; }
  leafIds[LEAF_IDS_OFFSET + leafIndex] = sourceIds[SOURCE_IDS_OFFSET + sourceIndex];
}`;Xi(e,{id:`${t.id}-remap-source-ids`,source:a,resources:[{buffer:n,usage:`storage-read`},{buffer:t.leafIds,usage:`storage-read-write`}],bindings:{sourceIds:n,leafIds:t.leafIds},dispatchSize:i})}function Yi(e,t,n){let r=2**n-1,i=2**n,a=`
const FIRST_NODE: u32 = ${r}u;
const LEVEL_NODE_COUNT: u32 = ${i}u;
const DIMENSION: u32 = ${t.dimension}u;
const NODE_MINIMA_OFFSET: u32 = ${N(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${N(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${N(t.nodeChildren)}u;
@group(0) @binding(0) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeChildren: array<u32>;

@compute @workgroup_size(${Vi}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x >= LEVEL_NODE_COUNT) { return; }
  let nodeIndex = FIRST_NODE + globalId.x;
  let childComponent = nodeIndex * 2u;
  let left = nodeChildren[CHILDREN_OFFSET + childComponent];
  let right = nodeChildren[CHILDREN_OFFSET + childComponent + 1u];
  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + nodeIndex * DIMENSION + axis] = min(
      nodeMinima[NODE_MINIMA_OFFSET + left * DIMENSION + axis],
      nodeMinima[NODE_MINIMA_OFFSET + right * DIMENSION + axis]
    );
    nodeMaxima[NODE_MAXIMA_OFFSET + nodeIndex * DIMENSION + axis] = max(
      nodeMaxima[NODE_MAXIMA_OFFSET + left * DIMENSION + axis],
      nodeMaxima[NODE_MAXIMA_OFFSET + right * DIMENSION + axis]
    );
  }
}`;Xi(e,{id:`${t.id}-refit-depth-${n}`,source:a,resources:[{buffer:t.nodeMinima,usage:`storage-read-write`},{buffer:t.nodeMaxima,usage:`storage-read-write`},{buffer:t.nodeChildren,usage:`storage-read`}],bindings:{nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren},dispatchCount:Math.ceil(i/Vi)})}function Xi(e,t){e.addComputePass({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new w(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=M(n,r);n.setBindings(i),t.dispatchSize?n.dispatch(e,t.dispatchSize.x,t.dispatchSize.y,t.dispatchSize.z):n.dispatch(e,t.dispatchCount)},destroy:()=>n.destroy()}}})}function Zi(e,t){let n=Math.floor(t),r=Math.max(1,Math.ceil(e/Vi)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`GPUBVH requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function Qi(e){return e>0&&Number.isInteger(Math.log2(e))}var $i=128,ea=64,ta=4294967295,na=class{id;minima;maxima;nodeMinima;nodeMaxima;nodeChildren;leafIds;counts;overflows;segments;dimension;topology=`complete-binary`;updatePolicy=`refit`;constructor(e){if(this.id=e.id??`gpu-segmented-bvh`,this.minima=e.minima,this.maxima=e.maxima,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.counts=e.counts,this.overflows=e.overflows,this.dimension=this.minima.format===`float32x2`?2:3,A(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),A(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),A(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),A(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),A(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),j(this.leafIds,`${this.id} leafIds`),j(this.counts,`${this.id} counts`),j(this.overflows,`${this.id} overflows`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeMaxima.length||this.nodeMinima.length!==this.nodeChildren.length)throw Error(`${this.id} node views must have matching formats and lengths`);if(this.counts.length!==this.overflows.length)throw Error(`${this.id} counts and overflows must have matching lengths`);let t=[this.minima,this.maxima],n=[this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.counts,this.overflows];for(let[e,r]of n.entries())if(t.some(e=>e.buffer===r.buffer)||n.slice(0,e).some(e=>e.buffer===r.buffer))throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>ia(this,e,t)),oa(this.segments,`nodeOffset`,e=>e.leafCapacity*2-1),oa(this.segments,`leafOffset`,e=>e.leafCapacity),oa(this.segments,`metadataOffset`,()=>1)}addToGraph(e){ra(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)}};function ra(e,t,n){for(let n of[e.minima,e.maxima,e.nodeMinima,e.nodeMaxima,e.nodeChildren,e.leafIds,e.counts,e.overflows])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);let r=sa(e.segments),i=Array.from(r,([t,r])=>{let i=Math.max(2,t);return{leafCapacity:t,segments:r,dispatchLayout:Br(`${e.id} ${t}-leaf hierarchies`,r.length*i,i,n)}});for(let n of i)ca(t,e,n.leafCapacity,n.segments,n.dispatchLayout)}function ia(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isSafeInteger(t.leafCapacity)||t.leafCapacity<1||t.leafCapacity>$i||t.leafCapacity&t.leafCapacity-1)throw Error(`${r} leafCapacity must be a positive power of two from 1 through 128`);let i=e.minima.buffer.graph.device.limits;if(t.leafCapacity>i.maxComputeInvocationsPerWorkgroup||t.leafCapacity>i.maxComputeWorkgroupSizeX||t.leafCapacity*ea>i.maxComputeWorkgroupStorageSize)throw Error(`${r} leafCapacity exceeds portable single-workgroup limits`);for(let e of[`sourceOffset`,`sourceCount`,`nodeOffset`,`leafOffset`,`metadataOffset`]){let n=t[e];if(!Number.isSafeInteger(n)||n<0||n>ta)throw Error(`${r} ${e} must be a non-negative uint32`)}return aa(r,`sourceOffset`,t.sourceOffset,t.sourceCount,e.minima.length),aa(r,`nodeOffset`,t.nodeOffset,t.leafCapacity*2-1,e.nodeMinima.length),aa(r,`leafOffset`,t.leafOffset,t.leafCapacity,e.leafIds.length),aa(r,`metadataOffset`,t.metadataOffset,1,e.counts.length),{sourceOffset:t.sourceOffset,sourceCount:t.sourceCount,nodeOffset:t.nodeOffset,leafOffset:t.leafOffset,metadataOffset:t.metadataOffset,leafCapacity:t.leafCapacity}}function aa(e,t,n,r,i){if(n>i||r>i-n)throw Error(`${e} ${t} and required rows exceed the parent view`)}function oa(e,t,n){let r=e.slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+n(i))throw Error(`GPUSegmentedBVH ${t} ranges must not overlap`)}}function sa(e){let t=new Map;for(let n of e){let e=t.get(n.leafCapacity);e?e.push(n):t.set(n.leafCapacity,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function ca(e,t,n,r,i){let a=r.map(e=>`  BVHSegment(${e.sourceOffset}u, ${e.sourceCount}u, ${e.nodeOffset}u, ${e.leafOffset}u, ${e.metadataOffset}u)`).join(`,
`),o=`
struct BVHSegment {
  sourceOffset: u32,
  sourceCount: u32,
  nodeOffset: u32,
  leafOffset: u32,
  metadataOffset: u32,
};

const SEGMENT_COUNT: u32 = ${r.length}u;
const LEAF_CAPACITY: u32 = ${n}u;
const INTERNAL_NODE_COUNT: u32 = ${n-1}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${N(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${N(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${N(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${N(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${N(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${N(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${N(t.counts)}u;
const OVERFLOW_OFFSET: u32 = ${N(t.overflows)}u;
const SEGMENTS: array<BVHSegment, ${r.length}> = array<BVHSegment, ${r.length}>(
${a}
);

@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCounts: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflows: array<u32>;

var<workgroup> sharedMinima: array<vec4<f32>, ${n*2}>;
var<workgroup> sharedMaxima: array<vec4<f32>, ${n*2}>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${n}) fn main(
  @builtin(local_invocation_index) localIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let segmentIndex =
    (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  if (segmentIndex >= SEGMENT_COUNT) { return; }
  let segment = SEGMENTS[segmentIndex];
  let storedCount = min(segment.sourceCount, LEAF_CAPACITY);
  var minimum = vec4<f32>(3.402823466e+38);
  var maximum = vec4<f32>(-3.402823466e+38);
  let localLeafNode = INTERNAL_NODE_COUNT + localIndex;
  let globalLeafNode = segment.nodeOffset + localLeafNode;
  let leafComponent = globalLeafNode * DIMENSION;
  let leafChildComponent = globalLeafNode * 2u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${ta}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${ta}u;
  leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = ${ta}u;

  if (localIndex < storedCount) {
    let sourceComponent = (segment.sourceOffset + localIndex) * DIMENSION;
    var valid = true;
    for (var axis = 0u; axis < DIMENSION; axis++) {
      let sourceMinimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
      let sourceMaximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      valid = valid && finite(sourceMinimum) && finite(sourceMaximum) &&
        sourceMinimum <= sourceMaximum;
    }
    leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = localIndex;
    if (valid) {
      for (var axis = 0u; axis < DIMENSION; axis++) {
        minimum[axis] = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        maximum[axis] = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      }
    }
  }

  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + leafComponent + axis] = minimum[axis];
    nodeMaxima[NODE_MAXIMA_OFFSET + leafComponent + axis] = maximum[axis];
  }
  sharedMinima[localIndex] = minimum;
  sharedMaxima[localIndex] = maximum;

  if (localIndex < INTERNAL_NODE_COUNT) {
    let childComponent = (segment.nodeOffset + localIndex) * 2u;
    nodeChildren[CHILDREN_OFFSET + childComponent] = localIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = localIndex * 2u + 2u;
  }
  if (localIndex == 0u) {
    outputCounts[COUNT_OFFSET + segment.metadataOffset] = segment.sourceCount;
    outputOverflows[OVERFLOW_OFFSET + segment.metadataOffset] =
      select(0u, 1u, segment.sourceCount > LEAF_CAPACITY);
  }
  workgroupBarrier();

  var sourceOffset = 0u;
  var destinationOffset = LEAF_CAPACITY;
  for (var levelNodeCount = LEAF_CAPACITY / 2u;
       levelNodeCount > 0u;
       levelNodeCount = levelNodeCount / 2u) {
    if (localIndex < levelNodeCount) {
      let firstChild = sourceOffset + localIndex * 2u;
      let reducedMinimum = min(sharedMinima[firstChild], sharedMinima[firstChild + 1u]);
      let reducedMaximum = max(sharedMaxima[firstChild], sharedMaxima[firstChild + 1u]);
      sharedMinima[destinationOffset + localIndex] = reducedMinimum;
      sharedMaxima[destinationOffset + localIndex] = reducedMaximum;

      let nodeIndex = segment.nodeOffset + levelNodeCount - 1u + localIndex;
      let nodeComponent = nodeIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = reducedMinimum[axis];
        nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = reducedMaximum[axis];
      }
    }
    workgroupBarrier();
    let previousSourceOffset = sourceOffset;
    sourceOffset = destinationOffset;
    destinationOffset = previousSourceOffset;
  }
}`,s=`${t.id}-fused-refit-${n}`,c={sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCounts:t.counts,outputOverflows:t.overflows};e.addComputePass({id:s,resources:[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.counts,usage:`storage-write`},{buffer:t.overflows,usage:`storage-write`}],compile:({device:e})=>{let t=new w(e,{id:s,source:o,shaderLayout:{bindings:Object.keys(c).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(c))r[e]=M(t,n);t.setBindings(r),t.dispatch(e,i.x,i.y,i.z)},destroy:()=>t.destroy()}}})}var la=`
struct RayTracingUniforms {
  inverseViewProjection: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  background: vec4<f32>,
  dimensions: vec4<u32>,
  settings: vec4<f32>,
  fog: vec4<f32>,
  acceleration: vec4<u32>,
  displayPhase: vec4<u32>,
  temporal: vec4<f32>,
  previousViewProjection: mat4x4<f32>,
  previousCameraPosition: vec4<f32>,
};

struct RayPrimitive {
  transform: mat4x4<f32>,
  inverseTransform: mat4x4<f32>,
  baseColor: vec4<f32>,
  emissive: vec4<f32>,
  properties: vec4<f32>,
  bounds: vec4<f32>,
  blas: vec4<f32>,
  previousTransform: mat4x4<f32>,
};

struct RayBlasNode {
  minimum: vec4<f32>,
  maximum: vec4<f32>,
};
`,ua=`
${la}

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read_write> primitiveMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> primitiveMaxima: array<f32>;
@group(0) @binding(4) var<storage, read> blasNodes: array<RayBlasNode>;

const INVALID_BOUND = 3.402823466e+38;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= uniforms.acceleration.z) {
    return;
  }

  let componentIndex = primitiveIndex * 3u;
  if (primitiveIndex >= uniforms.dimensions.z) {
    for (var axis = 0u; axis < 3u; axis++) {
      primitiveMinima[componentIndex + axis] = INVALID_BOUND;
      primitiveMaxima[componentIndex + axis] = -INVALID_BOUND;
    }
    return;
  }

  let primitive = primitives[primitiveIndex];
  var localCenter = primitive.bounds.xyz;
  var localExtent = vec3<f32>(max(primitive.bounds.w, 0.0));
  let usesMeshBounds = primitive.properties.y <= 0.0 && primitive.properties.w > 0.0;
  if (usesMeshBounds) {
    let rootNode = blasNodes[u32(primitive.blas.x)];
    localCenter = (rootNode.minimum.xyz + rootNode.maximum.xyz) * 0.5;
    localExtent = max((rootNode.maximum.xyz - rootNode.minimum.xyz) * 0.5, vec3<f32>(0.0));
  }
  let center = (primitive.transform * vec4<f32>(localCenter, 1.0)).xyz;
  let firstRow = vec3<f32>(
    primitive.transform[0].x,
    primitive.transform[1].x,
    primitive.transform[2].x
  );
  let secondRow = vec3<f32>(
    primitive.transform[0].y,
    primitive.transform[1].y,
    primitive.transform[2].y
  );
  let thirdRow = vec3<f32>(
    primitive.transform[0].z,
    primitive.transform[1].z,
    primitive.transform[2].z
  );
  let sphereExtent = vec3<f32>(length(firstRow), length(secondRow), length(thirdRow)) *
    max(primitive.bounds.w, 0.0);
  let meshExtent = vec3<f32>(
    dot(abs(firstRow), localExtent),
    dot(abs(secondRow), localExtent),
    dot(abs(thirdRow), localExtent)
  );
  let extent = select(sphereExtent, meshExtent, usesMeshBounds);
  let minimum = center - extent;
  let maximum = center + extent;
  for (var axis = 0u; axis < 3u; axis++) {
    primitiveMinima[componentIndex + axis] = minimum[axis];
    primitiveMaxima[componentIndex + axis] = maximum[axis];
  }
}
`,da=`
${la}

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var historyImage: texture_2d<f32>;
@group(0) @binding(2) var historyMetadata: texture_2d<f32>;
@group(0) @binding(3) var outputImage: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var outputMetadata: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let phaseCount = max(uniforms.displayPhase.w, 1u);
  if (phaseCount <= 1u || invocation.y >= uniforms.dimensions.y) {
    return;
  }

  let untouchedPhaseCount = phaseCount - 1u;
  let compactWidth =
    (uniforms.dimensions.x * untouchedPhaseCount + phaseCount - 1u) / phaseCount;
  if (invocation.x >= compactWidth) {
    return;
  }

  let selectedPhase = (uniforms.displayPhase.z + invocation.y) % phaseCount;
  let blockIndex = invocation.x / untouchedPhaseCount;
  let laneIndex = invocation.x % untouchedPhaseCount;
  let pixelX = blockIndex * phaseCount + laneIndex + select(0u, 1u, laneIndex >= selectedPhase);
  if (pixelX >= uniforms.dimensions.x) {
    return;
  }

  let pixel = vec2<i32>(i32(pixelX), i32(invocation.y));
  textureStore(outputImage, pixel, textureLoad(historyImage, pixel, 0));
  textureStore(outputMetadata, pixel, textureLoad(historyMetadata, pixel, 0));
}
`,fa=`
${la}

struct RayTriangle {
  firstPosition: vec4<f32>,
  secondPosition: vec4<f32>,
  thirdPosition: vec4<f32>,
  firstNormal: vec4<f32>,
  secondNormal: vec4<f32>,
  thirdNormal: vec4<f32>,
};

struct RayLight {
  colorIntensity: vec4<f32>,
  positionInnerCone: vec4<f32>,
  directionType: vec4<f32>,
  attenuationOuterCone: vec4<f32>,
};

struct Ray {
  origin: vec3<f32>,
  direction: vec3<f32>,
};

struct RayHit {
  distance: f32,
  normal: vec3<f32>,
  primitiveIndex: u32,
};

struct PendingRayNode {
  nodeIndex: u32,
  entryDistance: f32,
};

struct HistoricalRaySample {
  color: vec3<f32>,
  sampleCount: f32,
  valid: bool,
};

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read> triangles: array<RayTriangle>;
@group(0) @binding(3) var<storage, read> lights: array<RayLight>;
@group(0) @binding(4) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(5) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(6) var<storage, read> leafPrimitiveIds: array<u32>;
@group(0) @binding(7) var<storage, read> blasNodes: array<RayBlasNode>;
@group(0) @binding(8) var<storage, read> blasTriangleIds: array<u32>;
@group(0) @binding(9) var historyImage: texture_2d<f32>;
@group(0) @binding(10) var historyMetadata: texture_2d<f32>;
@group(0) @binding(11) var outputImage: texture_storage_2d<rgba16float, write>;
@group(0) @binding(12) var outputMetadata: texture_storage_2d<rgba16float, write>;

const RAY_EPSILON = 0.0005;
const RAY_INFINITY = 1.0e20;
const PI = 3.141592653589793;
const BVH_STACK_CAPACITY = 32u;
const BLAS_STACK_CAPACITY = 32u;
const MAXIMUM_HISTORY_SAMPLES = 64.0;
const MINIMUM_HISTORY_NORMAL_ALIGNMENT = 0.75;
const MAXIMUM_HISTORY_RELATIVE_DEPTH_DIFFERENCE = 0.06;
const MAXIMUM_EXACT_HISTORY_PRIMITIVE_INDEX = 2047u;
const OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER = 65504.0;

fn makeRandom(seed: u32) -> f32 {
  var value = seed * 747796405u + 2891336453u;
  value = ((value >> ((value >> 28u) + 4u)) ^ value) * 277803737u;
  value = (value >> 22u) ^ value;
  return f32(value) / 4294967295.0;
}

fn makeCameraRayAtOffset(pixel: vec2<u32>, offset: vec2<f32>) -> Ray {
  let coordinates = (vec2<f32>(pixel) + offset) / vec2<f32>(uniforms.dimensions.xy);
  let clipCoordinates = vec2<f32>(coordinates.x * 2.0 - 1.0, 1.0 - coordinates.y * 2.0);
  let farPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, 1.0, 1.0);
  let farPosition = farPoint.xyz / farPoint.w;
  var origin = uniforms.cameraPosition.xyz;
  if (uniforms.cameraPosition.w > 0.5) {
    let nearPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, -1.0, 1.0);
    origin = nearPoint.xyz / nearPoint.w;
  }
  return Ray(origin, normalize(farPosition - origin));
}

fn makeRadianceSampleOffset(pixel: vec2<u32>, sampleIndex: u32) -> vec2<f32> {
  let pixelIndex = pixel.y * uniforms.dimensions.x + pixel.x;
  let pixelRotation = vec2<f32>(
    makeRandom(pixelIndex * 1973u + 17u),
    makeRandom(pixelIndex * 26699u + 101u)
  );
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let lowDiscrepancyOffset = vec2<f32>(
    f32(sequenceIndex) * 0.7548776662466927,
    f32(sequenceIndex) * 0.5698402909980532
  );
  return fract(pixelRotation + lowDiscrepancyOffset);
}

fn makeCameraRay(pixel: vec2<u32>, sampleIndex: u32) -> Ray {
  return makeCameraRayAtOffset(pixel, makeRadianceSampleOffset(pixel, sampleIndex));
}

fn makeGuideCameraRay(pixel: vec2<u32>) -> Ray {
  return makeCameraRayAtOffset(pixel, vec2<f32>(0.5));
}

fn intersectSphere(ray: Ray, radius: f32, maximumDistance: f32) -> f32 {
  let directionLength = dot(ray.direction, ray.direction);
  let halfProjection = dot(ray.origin, ray.direction);
  let discriminant = halfProjection * halfProjection -
    directionLength * (dot(ray.origin, ray.origin) - radius * radius);
  if (discriminant < 0.0) {
    return RAY_INFINITY;
  }
  let root = sqrt(discriminant);
  let firstDistance = (-halfProjection - root) / directionLength;
  let secondDistance = (-halfProjection + root) / directionLength;
  let distance = select(secondDistance, firstDistance, firstDistance > RAY_EPSILON);
  return select(RAY_INFINITY, distance, distance > RAY_EPSILON && distance < maximumDistance);
}

fn intersectTriangle(ray: Ray, triangle: RayTriangle, maximumDistance: f32) -> vec3<f32> {
  let firstEdge = triangle.secondPosition.xyz - triangle.firstPosition.xyz;
  let secondEdge = triangle.thirdPosition.xyz - triangle.firstPosition.xyz;
  let perpendicular = cross(ray.direction, secondEdge);
  let determinant = dot(firstEdge, perpendicular);
  if (abs(determinant) < 0.0000001) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let inverseDeterminant = 1.0 / determinant;
  let originOffset = ray.origin - triangle.firstPosition.xyz;
  let firstWeight = dot(originOffset, perpendicular) * inverseDeterminant;
  if (firstWeight < 0.0 || firstWeight > 1.0) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let projectedOrigin = cross(originOffset, firstEdge);
  let secondWeight = dot(ray.direction, projectedOrigin) * inverseDeterminant;
  if (secondWeight < 0.0 || firstWeight + secondWeight > 1.0) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let distance = dot(secondEdge, projectedOrigin) * inverseDeterminant;
  if (distance <= RAY_EPSILON || distance >= maximumDistance) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  return vec3<f32>(distance, firstWeight, secondWeight);
}

fn makeInverseRayDirection(direction: vec3<f32>) -> vec3<f32> {
  let parallelAxes = abs(direction) < vec3<f32>(0.0000001);
  let safeDirection = select(direction, vec3<f32>(1.0), parallelAxes);
  return vec3<f32>(1.0) / safeDirection;
}

fn intersectNodeBounds(
  ray: Ray,
  inverseDirection: vec3<f32>,
  nodeIndex: u32,
  maximumDistance: f32
) -> f32 {
  var nearestDistance = 0.0;
  var farthestDistance = maximumDistance;
  let componentIndex = nodeIndex * 3u;

  for (var axis = 0u; axis < 3u; axis++) {
    let minimum = nodeMinima[componentIndex + axis];
    let maximum = nodeMaxima[componentIndex + axis];
    if (minimum > maximum) {
      return RAY_INFINITY;
    }

    let origin = ray.origin[axis];
    let direction = ray.direction[axis];
    if (abs(direction) < 0.0000001) {
      if (origin < minimum || origin > maximum) {
        return RAY_INFINITY;
      }
    } else {
      let firstDistance = (minimum - origin) * inverseDirection[axis];
      let secondDistance = (maximum - origin) * inverseDirection[axis];
      nearestDistance = max(nearestDistance, min(firstDistance, secondDistance));
      farthestDistance = min(farthestDistance, max(firstDistance, secondDistance));
      if (nearestDistance > farthestDistance) {
        return RAY_INFINITY;
      }
    }
  }

  if (farthestDistance <= RAY_EPSILON || nearestDistance >= maximumDistance) {
    return RAY_INFINITY;
  }
  return nearestDistance;
}

fn intersectBlasNodeBounds(
  ray: Ray,
  inverseDirection: vec3<f32>,
  nodeIndex: u32,
  maximumDistance: f32
) -> f32 {
  var nearestDistance = 0.0;
  var farthestDistance = maximumDistance;
  let node = blasNodes[nodeIndex];

  for (var axis = 0u; axis < 3u; axis++) {
    let minimum = node.minimum[axis];
    let maximum = node.maximum[axis];
    if (minimum > maximum) {
      return RAY_INFINITY;
    }

    let origin = ray.origin[axis];
    let direction = ray.direction[axis];
    if (abs(direction) < 0.0000001) {
      if (origin < minimum || origin > maximum) {
        return RAY_INFINITY;
      }
    } else {
      let firstDistance = (minimum - origin) * inverseDirection[axis];
      let secondDistance = (maximum - origin) * inverseDirection[axis];
      nearestDistance = max(nearestDistance, min(firstDistance, secondDistance));
      farthestDistance = min(farthestDistance, max(firstDistance, secondDistance));
      if (nearestDistance > farthestDistance) {
        return RAY_INFINITY;
      }
    }
  }

  if (farthestDistance <= RAY_EPSILON || nearestDistance >= maximumDistance) {
    return RAY_INFINITY;
  }
  return nearestDistance;
}

fn intersectPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u);
  let primitive = primitives[primitiveIndex];
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    let distance = intersectSphere(localRay, sphereRadius, closestHit.distance);
    if (distance < closestHit.distance) {
      let localNormal = normalize(localOrigin + localDirection * distance);
      let worldNormal = normalize((transpose(primitive.inverseTransform) *
        vec4<f32>(localNormal, 0.0)).xyz);
      closestHit = RayHit(distance, worldNormal, primitiveIndex);
    }
    return closestHit;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleCount = u32(primitive.properties.w);
  let packedNodeStart = u32(primitive.blas.x);
  let triangleIdStart = u32(primitive.blas.y);
  let internalNodeCount = u32(primitive.blas.z);
  let leafCapacity = u32(primitive.blas.w);
  if (triangleCount == 0u || leafCapacity == 0u) {
    return closestHit;
  }

  let inverseLocalDirection = makeInverseRayDirection(localDirection);
  let rootBlasDistance = intersectBlasNodeBounds(
    localRay,
    inverseLocalDirection,
    packedNodeStart,
    closestHit.distance
  );
  if (rootBlasDistance >= closestHit.distance) {
    return closestHit;
  }

  var pendingBlasNodes: array<PendingRayNode, BLAS_STACK_CAPACITY>;
  var pendingBlasCount = 1u;
  pendingBlasNodes[0] = PendingRayNode(0u, rootBlasDistance);
  while (pendingBlasCount > 0u) {
    pendingBlasCount--;
    let pendingBlasNode = pendingBlasNodes[pendingBlasCount];
    if (pendingBlasNode.entryDistance >= closestHit.distance) {
      continue;
    }
    let localNodeIndex = pendingBlasNode.nodeIndex;

    if (localNodeIndex >= internalNodeCount) {
      let leafIndex = localNodeIndex - internalNodeCount;
      if (leafIndex < leafCapacity) {
        let localTriangleIndex = blasTriangleIds[triangleIdStart + leafIndex];
        if (localTriangleIndex < triangleCount) {
          let triangleIndex = triangleStart + localTriangleIndex;
          let triangle = triangles[triangleIndex];
          let intersection = intersectTriangle(localRay, triangle, closestHit.distance);
          if (intersection.x < closestHit.distance) {
            let normalWeight = 1.0 - intersection.y - intersection.z;
            var localNormal = normalize(triangle.firstNormal.xyz * normalWeight +
              triangle.secondNormal.xyz * intersection.y +
              triangle.thirdNormal.xyz * intersection.z);
            if (dot(localNormal, localDirection) > 0.0) {
              localNormal = -localNormal;
            }
            let worldNormal = normalize((transpose(primitive.inverseTransform) *
              vec4<f32>(localNormal, 0.0)).xyz);
            closestHit = RayHit(intersection.x, worldNormal, primitiveIndex);
          }
        }
      }
      continue;
    }

    let leftNode = localNodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + leftNode,
      closestHit.distance
    );
    let rightBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + rightNode,
      closestHit.distance
    );
    let leftFirst = leftBlasDistance <= rightBlasDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerBlasDistance = min(leftBlasDistance, rightBlasDistance);
    let fartherBlasDistance = max(leftBlasDistance, rightBlasDistance);

    if (fartherBlasDistance < closestHit.distance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(fartherNode, fartherBlasDistance);
      pendingBlasCount++;
    }
    if (nearerBlasDistance < closestHit.distance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(nearerNode, nearerBlasDistance);
      pendingBlasCount++;
    }
  }
  return closestHit;
}

fn intersectsPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> bool {
  let primitive = primitives[primitiveIndex];
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    return intersectSphere(localRay, sphereRadius, maximumDistance) < maximumDistance;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleCount = u32(primitive.properties.w);
  let packedNodeStart = u32(primitive.blas.x);
  let triangleIdStart = u32(primitive.blas.y);
  let internalNodeCount = u32(primitive.blas.z);
  let leafCapacity = u32(primitive.blas.w);
  if (triangleCount == 0u || leafCapacity == 0u) {
    return false;
  }

  let inverseLocalDirection = makeInverseRayDirection(localDirection);
  let rootBlasDistance = intersectBlasNodeBounds(
    localRay,
    inverseLocalDirection,
    packedNodeStart,
    maximumDistance
  );
  if (rootBlasDistance >= maximumDistance) {
    return false;
  }

  var pendingBlasNodes: array<PendingRayNode, BLAS_STACK_CAPACITY>;
  var pendingBlasCount = 1u;
  pendingBlasNodes[0] = PendingRayNode(0u, rootBlasDistance);
  while (pendingBlasCount > 0u) {
    pendingBlasCount--;
    let pendingBlasNode = pendingBlasNodes[pendingBlasCount];
    if (pendingBlasNode.entryDistance >= maximumDistance) {
      continue;
    }
    let localNodeIndex = pendingBlasNode.nodeIndex;

    if (localNodeIndex >= internalNodeCount) {
      let leafIndex = localNodeIndex - internalNodeCount;
      if (leafIndex < leafCapacity) {
        let localTriangleIndex = blasTriangleIds[triangleIdStart + leafIndex];
        if (localTriangleIndex < triangleCount) {
          let triangleIndex = triangleStart + localTriangleIndex;
          if (intersectTriangle(localRay, triangles[triangleIndex], maximumDistance).x <
              maximumDistance) {
            return true;
          }
        }
      }
      continue;
    }

    let leftNode = localNodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + leftNode,
      maximumDistance
    );
    let rightBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + rightNode,
      maximumDistance
    );
    let leftFirst = leftBlasDistance <= rightBlasDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerBlasDistance = min(leftBlasDistance, rightBlasDistance);
    let fartherBlasDistance = max(leftBlasDistance, rightBlasDistance);

    if (fartherBlasDistance < maximumDistance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(fartherNode, fartherBlasDistance);
      pendingBlasCount++;
    }
    if (nearerBlasDistance < maximumDistance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(nearerNode, nearerBlasDistance);
      pendingBlasCount++;
    }
  }
  return false;
}

fn intersectScene(ray: Ray, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u);
  if (uniforms.dimensions.z == 0u) {
    return closestHit;
  }

  let inverseDirection = makeInverseRayDirection(ray.direction);
  let rootDistance = intersectNodeBounds(ray, inverseDirection, 0u, closestHit.distance);
  if (rootDistance >= closestHit.distance) {
    return closestHit;
  }

  var pendingNodes: array<PendingRayNode, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = PendingRayNode(0u, rootDistance);

  while (pendingCount > 0u) {
    pendingCount--;
    let pendingNode = pendingNodes[pendingCount];
    if (pendingNode.entryDistance >= closestHit.distance) {
      continue;
    }
    let nodeIndex = pendingNode.nodeIndex;

    if (nodeIndex >= uniforms.acceleration.x) {
      let leafIndex = nodeIndex - uniforms.acceleration.x;
      let primitiveIndex = leafPrimitiveIds[leafIndex];
      if (primitiveIndex < uniforms.dimensions.z) {
        let primitiveHit = intersectPrimitive(ray, primitiveIndex, closestHit.distance);
        if (primitiveHit.distance < closestHit.distance) {
          closestHit = primitiveHit;
        }
      }
      continue;
    }

    let leftNode = nodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftDistance = intersectNodeBounds(ray, inverseDirection, leftNode, closestHit.distance);
    let rightDistance = intersectNodeBounds(ray, inverseDirection, rightNode, closestHit.distance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < closestHit.distance) {
      pendingNodes[pendingCount] = PendingRayNode(fartherNode, fartherDistance);
      pendingCount++;
    }
    if (nearerDistance < closestHit.distance) {
      pendingNodes[pendingCount] = PendingRayNode(nearerNode, nearerDistance);
      pendingCount++;
    }
  }
  return closestHit;
}

fn intersectsScene(ray: Ray, maximumDistance: f32) -> bool {
  if (uniforms.dimensions.z == 0u || maximumDistance <= RAY_EPSILON) {
    return false;
  }

  let inverseDirection = makeInverseRayDirection(ray.direction);
  let rootDistance = intersectNodeBounds(ray, inverseDirection, 0u, maximumDistance);
  if (rootDistance >= maximumDistance) {
    return false;
  }

  var pendingNodes: array<PendingRayNode, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = PendingRayNode(0u, rootDistance);

  while (pendingCount > 0u) {
    pendingCount--;
    let pendingNode = pendingNodes[pendingCount];
    if (pendingNode.entryDistance >= maximumDistance) {
      continue;
    }
    let nodeIndex = pendingNode.nodeIndex;

    if (nodeIndex >= uniforms.acceleration.x) {
      let leafIndex = nodeIndex - uniforms.acceleration.x;
      let primitiveIndex = leafPrimitiveIds[leafIndex];
      if (primitiveIndex < uniforms.dimensions.z &&
          intersectsPrimitive(ray, primitiveIndex, maximumDistance)) {
        return true;
      }
      continue;
    }

    let leftNode = nodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftDistance = intersectNodeBounds(ray, inverseDirection, leftNode, maximumDistance);
    let rightDistance = intersectNodeBounds(ray, inverseDirection, rightNode, maximumDistance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < maximumDistance) {
      pendingNodes[pendingCount] = PendingRayNode(fartherNode, fartherDistance);
      pendingCount++;
    }
    if (nearerDistance < maximumDistance) {
      pendingNodes[pendingCount] = PendingRayNode(nearerNode, nearerDistance);
      pendingCount++;
    }
  }
  return false;
}

fn evaluateDirectLighting(ray: Ray, hit: RayHit) -> vec3<f32> {
  let primitive = primitives[hit.primitiveIndex];
  let hitPosition = ray.origin + ray.direction * hit.distance;
  let normal = hit.normal;
  let viewDirection = -ray.direction;
  let baseColor = primitive.baseColor.rgb;
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let dielectricReflectance = vec3<f32>(0.04);
  let reflectance = mix(dielectricReflectance, baseColor, metallic);
  let maximumReflectance = max(reflectance.r, max(reflectance.g, reflectance.b));
  let grazingReflectance = vec3<f32>(clamp(maximumReflectance * 25.0, 0.0, 1.0));
  let alphaRoughness = roughness * roughness;
  let alphaRoughnessSquared = alphaRoughness * alphaRoughness;
  let diffuse = baseColor * (vec3<f32>(1.0) - dielectricReflectance) *
    (1.0 - metallic) / PI;
  let normalView = clamp(abs(dot(normal, viewDirection)), 0.001, 1.0);
  var result = primitive.emissive.rgb;
  let directLightCount = u32(max(uniforms.temporal.y, 0.0));
  let boundedDirectLightCount = max(directLightCount, 1u);
  let requestedShadowSamples = u32(max(uniforms.temporal.z, 0.0));
  let shadowSampleCount = select(
    min(requestedShadowSamples, directLightCount),
    directLightCount,
    requestedShadowSamples == 0u || uniforms.settings.w <= 0.5
  );
  let rotatingLightOffset = uniforms.acceleration.w % boundedDirectLightCount;
  let lightSampleWeight = f32(directLightCount) / f32(max(shadowSampleCount, 1u));
  var directLightIndex = 0u;

  for (var lightIndex = 0u; lightIndex < uniforms.dimensions.w; lightIndex++) {
    let light = lights[lightIndex];
    let lightType = u32(light.directionType.w);
    let lightColor = light.colorIntensity.rgb * light.colorIntensity.w;
    if (lightType == 0u) {
      result += baseColor * lightColor;
      continue;
    }

    let rotatingLightIndex = (directLightIndex + directLightCount - rotatingLightOffset) %
      boundedDirectLightCount;
    directLightIndex++;
    if (rotatingLightIndex >= shadowSampleCount) {
      continue;
    }

    var lightDirection = vec3<f32>(0.0);
    var lightDistance = RAY_INFINITY;
    var attenuation = 1.0;
    if (lightType >= 2u) {
      let offset = light.positionInnerCone.xyz - hitPosition;
      lightDistance = length(offset);
      lightDirection = offset / max(lightDistance, RAY_EPSILON);
      let factors = light.attenuationOuterCone.xyz;
      attenuation = 1.0 / max(factors.x + factors.y * lightDistance +
        factors.z * lightDistance * lightDistance, 0.0001);
      if (lightType == 3u) {
        let angle = dot(-lightDirection, normalize(light.directionType.xyz));
        let innerCone = light.positionInnerCone.w;
        let outerCone = light.attenuationOuterCone.w;
        attenuation *= smoothstep(outerCone, innerCone, angle);
      }
    } else {
      lightDirection = normalize(-light.directionType.xyz);
    }

    let normalLight = max(dot(normal, lightDirection), 0.0);
    if (normalLight <= 0.0 || attenuation <= 0.0) {
      continue;
    }
    if (uniforms.settings.w > 0.5) {
      let shadowRay = Ray(hitPosition + normal * 0.002, lightDirection);
      let shadowDistance = select(lightDistance - 0.003, RAY_INFINITY, lightType == 1u);
      if (intersectsScene(shadowRay, shadowDistance)) {
        continue;
      }
    }

    let halfDirection = normalize(lightDirection + viewDirection);
    let normalHalf = max(dot(normal, halfDirection), 0.0);
    let viewHalf = max(dot(viewDirection, halfDirection), 0.0);
    let fresnel = reflectance + (grazingReflectance - reflectance) *
      pow(clamp(1.0 - viewHalf, 0.0, 1.0), 5.0);
    let distributionDenominator =
      (normalHalf * alphaRoughnessSquared - normalHalf) * normalHalf + 1.0;
    let distribution = alphaRoughnessSquared /
      (PI * distributionDenominator * distributionDenominator);
    let lightVisibility = 2.0 * normalLight /
      (normalLight + sqrt(alphaRoughnessSquared +
        (1.0 - alphaRoughnessSquared) * normalLight * normalLight));
    let viewVisibility = 2.0 * normalView /
      (normalView + sqrt(alphaRoughnessSquared +
        (1.0 - alphaRoughnessSquared) * normalView * normalView));
    let geometricOcclusion = lightVisibility * viewVisibility;
    let diffuseContribution = (vec3<f32>(1.0) - fresnel) * diffuse;
    let specular = fresnel * geometricOcclusion * distribution /
      (4.0 * normalLight * normalView);
    result += (diffuseContribution + specular) * lightColor * normalLight *
      attenuation * lightSampleWeight;
  }

  if (uniforms.fog.w > 0.0) {
    let visibility = exp(-uniforms.fog.w * hit.distance);
    result = mix(uniforms.fog.rgb, result, visibility);
  }
  return result;
}

fn rejectHistoricalRaySample() -> HistoricalRaySample {
  return HistoricalRaySample(vec3<f32>(0.0), 0.0, false);
}

fn signNotZero(value: f32) -> f32 {
  return select(-1.0, 1.0, value >= 0.0);
}

fn encodeRayNormal(normal: vec3<f32>) -> vec2<f32> {
  let normalizedNormal = normal / max(
    abs(normal.x) + abs(normal.y) + abs(normal.z),
    RAY_EPSILON
  );
  var encodedNormal = normalizedNormal.xy;
  if (normalizedNormal.z < 0.0) {
    encodedNormal = (vec2<f32>(1.0) - abs(encodedNormal.yx)) * vec2<f32>(
      signNotZero(encodedNormal.x),
      signNotZero(encodedNormal.y)
    );
  }
  return encodedNormal * 0.5 + vec2<f32>(0.5);
}

fn decodeRayNormal(encodedNormal: vec2<f32>) -> vec3<f32> {
  let signedNormal = encodedNormal * 2.0 - vec2<f32>(1.0);
  var normal = vec3<f32>(
    signedNormal,
    1.0 - abs(signedNormal.x) - abs(signedNormal.y)
  );
  let fold = max(-normal.z, 0.0);
  normal.x += select(-fold, fold, normal.x < 0.0);
  normal.y += select(-fold, fold, normal.y < 0.0);
  return normalize(normal);
}

fn encodeRayPrimitiveIdentifier(primitiveIndex: u32) -> f32 {
  return select(
    OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER,
    f32(primitiveIndex + 1u),
    primitiveIndex <= MAXIMUM_EXACT_HISTORY_PRIMITIVE_INDEX
  );
}

fn isHistoricalRayMetadataValid(
  historicalMetadata: vec4<f32>,
  hit: RayHit,
  previousDistance: f32
) -> bool {
  if (hit.distance >= RAY_INFINITY) {
    return historicalMetadata.a <= RAY_EPSILON;
  }

  let expectedPrimitiveIdentifier = encodeRayPrimitiveIdentifier(hit.primitiveIndex);
  let primitiveIdentifierOverflow =
    expectedPrimitiveIdentifier == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER ||
    historicalMetadata.a == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER;
  let primitiveIdentifierMatches =
    abs(historicalMetadata.a - expectedPrimitiveIdentifier) <= 0.5;
  if (historicalMetadata.a <= RAY_EPSILON ||
      primitiveIdentifierOverflow ||
      !primitiveIdentifierMatches ||
      dot(decodeRayNormal(historicalMetadata.xy), hit.normal) <
        MINIMUM_HISTORY_NORMAL_ALIGNMENT) {
    return false;
  }
  let relativeDepthDifference = abs(historicalMetadata.z - previousDistance) /
    max(previousDistance, RAY_EPSILON);
  return relativeDepthDifference <= MAXIMUM_HISTORY_RELATIVE_DEPTH_DIFFERENCE;
}

fn clampHistoricalRayColor(
  historyPixel: vec2<i32>,
  historicalColor: vec3<f32>,
  currentColor: vec3<f32>
) -> vec3<f32> {
  let maximumPixel = vec2<i32>(uniforms.dimensions.xy) - vec2<i32>(1);
  var minimumColor = currentColor;
  var maximumColor = currentColor;
  for (var verticalOffset = -1; verticalOffset <= 1; verticalOffset++) {
    for (var horizontalOffset = -1; horizontalOffset <= 1; horizontalOffset++) {
      let neighborhoodPixel = clamp(
        historyPixel + vec2<i32>(horizontalOffset, verticalOffset),
        vec2<i32>(0),
        maximumPixel
      );
      let neighborhoodColor = textureLoad(historyImage, neighborhoodPixel, 0);
      if (neighborhoodColor.a > 0.0) {
        minimumColor = min(minimumColor, neighborhoodColor.rgb);
        maximumColor = max(maximumColor, neighborhoodColor.rgb);
      }
    }
  }
  let neighborhoodRadius = max((maximumColor - minimumColor) * 0.5, vec3<f32>(0.04));
  return clamp(historicalColor, currentColor - neighborhoodRadius, currentColor + neighborhoodRadius);
}

fn loadHistoricalRaySample(
  historyPixel: vec2<i32>,
  hit: RayHit,
  previousDistance: f32
) -> HistoricalRaySample {
  let historicalMetadata = textureLoad(historyMetadata, historyPixel, 0);
  if (!isHistoricalRayMetadataValid(historicalMetadata, hit, previousDistance)) {
    return rejectHistoricalRaySample();
  }

  let historicalColor = textureLoad(historyImage, historyPixel, 0);
  if (historicalColor.a <= 0.0) {
    return rejectHistoricalRaySample();
  }
  return HistoricalRaySample(
    historicalColor.rgb,
    min(historicalColor.a, MAXIMUM_HISTORY_SAMPLES),
    true
  );
}

fn getHistoricalRaySample(
  pixel: vec2<u32>,
  ray: Ray,
  hit: RayHit,
  currentColor: vec3<f32>
) -> HistoricalRaySample {
  if (uniforms.settings.y <= 0.0) {
    return rejectHistoricalRaySample();
  }

  var historySamplePosition = vec2<f32>(pixel);
  var previousDistance = distance(
    ray.origin + ray.direction * min(hit.distance, 65504.0),
    uniforms.cameraPosition.xyz
  );
  if (hit.distance < RAY_INFINITY && uniforms.temporal.w > 0.5) {
    let primitive = primitives[hit.primitiveIndex];
    let hitPosition = ray.origin + ray.direction * hit.distance;
    let localHitPosition = primitive.inverseTransform * vec4<f32>(hitPosition, 1.0);
    let previousHitPosition = (primitive.previousTransform * localHitPosition).xyz;
    let previousClipPosition = uniforms.previousViewProjection *
      vec4<f32>(previousHitPosition, 1.0);
    if (previousClipPosition.w <= RAY_EPSILON) {
      return rejectHistoricalRaySample();
    }

    let previousNormalizedPosition = previousClipPosition.xy / previousClipPosition.w;
    let previousTextureCoordinates = vec2<f32>(
      previousNormalizedPosition.x * 0.5 + 0.5,
      0.5 - previousNormalizedPosition.y * 0.5
    );
    if (any(previousTextureCoordinates < vec2<f32>(0.0)) ||
        any(previousTextureCoordinates >= vec2<f32>(1.0))) {
      return rejectHistoricalRaySample();
    }

    historySamplePosition = previousTextureCoordinates *
      vec2<f32>(uniforms.dimensions.xy) - vec2<f32>(0.5);
    previousDistance = distance(previousHitPosition, uniforms.previousCameraPosition.xyz);
  }

  let maximumPixel = vec2<i32>(uniforms.dimensions.xy) - vec2<i32>(1);
  let clampedHistorySamplePosition = clamp(
    historySamplePosition,
    vec2<f32>(0.0),
    vec2<f32>(maximumPixel)
  );
  let firstHistoryPixel = vec2<i32>(floor(clampedHistorySamplePosition));
  let secondHistoryPixel = min(firstHistoryPixel + vec2<i32>(1), maximumPixel);
  let historyFraction = fract(clampedHistorySamplePosition);
  let topLeftWeight = (1.0 - historyFraction.x) * (1.0 - historyFraction.y);
  let topRightWeight = historyFraction.x * (1.0 - historyFraction.y);
  let bottomLeftWeight = (1.0 - historyFraction.x) * historyFraction.y;
  let bottomRightWeight = historyFraction.x * historyFraction.y;
  var historicalColor = vec3<f32>(0.0);
  var historicalSampleCount = 0.0;
  var totalWeight = 0.0;
  if (topLeftWeight > 0.0) {
    let topLeftSample = loadHistoricalRaySample(firstHistoryPixel, hit, previousDistance);
    if (topLeftSample.valid) {
      historicalColor += topLeftSample.color * topLeftWeight;
      historicalSampleCount += topLeftSample.sampleCount * topLeftWeight;
      totalWeight += topLeftWeight;
    }
  }
  if (topRightWeight > 0.0) {
    let topRightSample = loadHistoricalRaySample(
      vec2<i32>(secondHistoryPixel.x, firstHistoryPixel.y),
      hit,
      previousDistance
    );
    if (topRightSample.valid) {
      historicalColor += topRightSample.color * topRightWeight;
      historicalSampleCount += topRightSample.sampleCount * topRightWeight;
      totalWeight += topRightWeight;
    }
  }
  if (bottomLeftWeight > 0.0) {
    let bottomLeftSample = loadHistoricalRaySample(
      vec2<i32>(firstHistoryPixel.x, secondHistoryPixel.y),
      hit,
      previousDistance
    );
    if (bottomLeftSample.valid) {
      historicalColor += bottomLeftSample.color * bottomLeftWeight;
      historicalSampleCount += bottomLeftSample.sampleCount * bottomLeftWeight;
      totalWeight += bottomLeftWeight;
    }
  }
  if (bottomRightWeight > 0.0) {
    let bottomRightSample = loadHistoricalRaySample(secondHistoryPixel, hit, previousDistance);
    if (bottomRightSample.valid) {
      historicalColor += bottomRightSample.color * bottomRightWeight;
      historicalSampleCount += bottomRightSample.sampleCount * bottomRightWeight;
      totalWeight += bottomRightWeight;
    }
  }

  if (totalWeight <= 0.0) {
    return rejectHistoricalRaySample();
  }
  let nearestHistoryPixel = clamp(
    vec2<i32>(round(clampedHistorySamplePosition)),
    vec2<i32>(0),
    maximumPixel
  );
  return HistoricalRaySample(
    clampHistoricalRayColor(nearestHistoryPixel, historicalColor / totalWeight, currentColor),
    min(historicalSampleCount / totalWeight, MAXIMUM_HISTORY_SAMPLES),
    true
  );
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let phaseCount = max(uniforms.displayPhase.w, 1u);
  let phaseOffset = (uniforms.displayPhase.z + invocation.y) % phaseCount;
  let pixel = vec2<u32>(invocation.x * phaseCount + phaseOffset, invocation.y);
  if (pixel.x >= uniforms.dimensions.x || pixel.y >= uniforms.dimensions.y) {
    return;
  }

  let sampleCount = clamp(u32(uniforms.settings.z), 1u, 16u);
  let guideRay = makeGuideCameraRay(pixel);
  let guideHit = intersectScene(guideRay, RAY_INFINITY);
  let useStableGuideSample = sampleCount == 1u &&
    uniforms.previousCameraPosition.w < 0.5 && uniforms.temporal.w < 0.5;
  var accumulatedColor = vec3<f32>(0.0);
  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    var ray = guideRay;
    var hit = guideHit;
    if (!useStableGuideSample) {
      ray = makeCameraRay(pixel, sampleIndex);
      hit = intersectScene(ray, RAY_INFINITY);
    }
    var color = uniforms.background.rgb;
    if (hit.distance < RAY_INFINITY) {
      color = evaluateDirectLighting(ray, hit);
    }
    accumulatedColor += color;
  }

  var color = accumulatedColor / f32(sampleCount) * uniforms.settings.x;
  let historicalSample = getHistoricalRaySample(pixel, guideRay, guideHit, color);
  var totalSampleCount = f32(sampleCount);
  if (historicalSample.valid) {
    totalSampleCount = min(
      historicalSample.sampleCount + f32(sampleCount),
      MAXIMUM_HISTORY_SAMPLES
    );
    let currentWeight = f32(sampleCount) / totalSampleCount;
    color = mix(historicalSample.color, color, currentWeight);
  }
  let guideHitPosition = guideRay.origin +
    guideRay.direction * min(guideHit.distance, 65504.0);
  let metadata = select(
    vec4<f32>(0.0),
    vec4<f32>(
      encodeRayNormal(guideHit.normal),
      min(distance(guideHitPosition, uniforms.cameraPosition.xyz), 65504.0),
      encodeRayPrimitiveIdentifier(guideHit.primitiveIndex)
    ),
    guideHit.distance < RAY_INFINITY
  );
  textureStore(outputImage, vec2<i32>(pixel), vec4<f32>(color, totalSampleCount));
  textureStore(outputMetadata, vec2<i32>(pixel), metadata);
}
`;function pa(e){let t=typeof e==`boolean`?e?0:2:e.toneMapMode;return`
@group(0) @binding(0) var image: texture_2d<f32>;

struct PresentationVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) textureCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> PresentationVertexOutput {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  let position = positions[vertexIndex];
  var output: PresentationVertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.textureCoordinates = vec2<f32>(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  return output;
}

fn sampleRayTracingImage(textureCoordinates: vec2<f32>) -> vec3<f32> {
  let dimensions = textureDimensions(image);
  let maximumPixel = vec2<i32>(dimensions) - vec2<i32>(1);
  let samplePosition = clamp(
    textureCoordinates * vec2<f32>(dimensions) - vec2<f32>(0.5),
    vec2<f32>(0.0),
    vec2<f32>(maximumPixel)
  );
  let firstPixel = vec2<i32>(floor(samplePosition));
  let secondPixel = min(firstPixel + vec2<i32>(1), maximumPixel);
  let fraction = fract(samplePosition);
  let topLeft = textureLoad(image, firstPixel, 0).rgb;
  let topRight = textureLoad(image, vec2<i32>(secondPixel.x, firstPixel.y), 0).rgb;
  let bottomLeft = textureLoad(image, vec2<i32>(firstPixel.x, secondPixel.y), 0).rgb;
  let bottomRight = textureLoad(image, secondPixel, 0).rgb;
  return mix(mix(topLeft, topRight, fraction.x), mix(bottomLeft, bottomRight, fraction.x), fraction.y);
}

fn encodeRayTracingLinearSRGB(linearColor: vec3<f32>) -> vec3<f32> {
  let positiveColor = max(linearColor, vec3<f32>(0.0));
  return select(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3<f32>(1.0 / 2.4)) - 0.055,
    positiveColor > vec3<f32>(0.0031308)
  );
}

fn toneMapRayTracingKhronosPBRNeutral(inputColor: vec3<f32>) -> vec3<f32> {
  let startCompression = 0.76;
  let darkestChannel = min(inputColor.r, min(inputColor.g, inputColor.b));
  let offset = select(
    0.04,
    darkestChannel - 6.25 * darkestChannel * darkestChannel,
    darkestChannel < 0.08
  );
  var color = inputColor - vec3<f32>(offset);
  let peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) {
    return color;
  }

  let compressionRange = 1.0 - startCompression;
  let compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  let desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3<f32>(compressedPeak), desaturation);
}

@fragment
fn fragmentMain(@location(0) textureCoordinates: vec2<f32>) -> @location(0) vec4<f32> {
  let radiance = sampleRayTracingImage(textureCoordinates);
  var color = max(radiance, vec3<f32>(0.0));
  if (${t} == 1) {
    color /= vec3<f32>(1.0) + color;
  } else if (${t} == 2) {
    color = toneMapRayTracingKhronosPBRNeutral(color);
  } else if (${t} == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3<f32>(0.0),
      vec3<f32>(1.0)
    );
  }
  if (${typeof e==`boolean`?e?0:1:e.outputEncoding} == 0) {
    return vec4<f32>(color, 1.0);
  }
  return vec4<f32>(encodeRayTracingLinearSRGB(color), 1.0);
}
`}var ma=68,ha=24,ga=8,_a=16,va=68,ya=.5,ba=.25,xa=33.3,Sa=[.25,.375,.5,.75,1],Ca=750,wa=1.2,Ta=.65,Ea=6,Da=45,Oa=8,ka=64,Aa=4294967295,ja=32,Ma=.25,Na=`
const INVALID_BOUND = 3.402823466e+38;

@group(0) @binding(0) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(1)
fn main() {
  for (var axis = 0u; axis < 3u; axis++) {
    atomicStore(&sceneBounds[axis], encodeOrderedFloat(INVALID_BOUND));
    atomicStore(&sceneBounds[axis + 3u], encodeOrderedFloat(-INVALID_BOUND));
  }
}
`,Pa=`
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  let componentIndex = primitiveIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = primitiveMinima[componentIndex + axis];
    maximum[axis] = primitiveMaxima[componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    return;
  }

  for (var axis = 0u; axis < 3u; axis++) {
    atomicMin(&sceneBounds[axis], encodeOrderedFloat(minimum[axis]));
    atomicMax(&sceneBounds[axis + 3u], encodeOrderedFloat(maximum[axis]));
  }
}
`,Fa=`
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;
const INVALID_PRIMITIVE_ID = 0xffffffffu;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sceneBounds: array<u32>;
@group(0) @binding(3) var<storage, read_write> mortonKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> primitiveIds: array<u32>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(value ^ 0x80000000u, ~value, (value & 0x80000000u) == 0u);
  return bitcast<f32>(bits);
}

fn expandMortonBits(value: u32) -> u32 {
  var bits = value & 1023u;
  bits = (bits | (bits << 16u)) & 0x030000ffu;
  bits = (bits | (bits << 8u)) & 0x0300f00fu;
  bits = (bits | (bits << 4u)) & 0x030c30c3u;
  bits = (bits | (bits << 2u)) & 0x09249249u;
  return bits;
}

fn makeMortonKey(position: vec3<f32>) -> u32 {
  let coordinates = clamp(position, vec3<f32>(0.0), vec3<f32>(0.99999994)) * 1024.0;
  let quantized = vec3<u32>(
    u32(coordinates.x),
    u32(coordinates.y),
    u32(coordinates.z)
  );
  return expandMortonBits(quantized.x) * 4u +
    expandMortonBits(quantized.y) * 2u +
    expandMortonBits(quantized.z);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  primitiveIds[primitiveIndex] = primitiveIndex;
  let componentIndex = primitiveIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = primitiveMinima[componentIndex + axis];
    maximum[axis] = primitiveMaxima[componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    mortonKeys[primitiveIndex] = INVALID_PRIMITIVE_ID;
    return;
  }

  var sceneMinimum = vec3<f32>();
  var sceneMaximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    sceneMinimum[axis] = decodeOrderedFloat(sceneBounds[axis]);
    sceneMaximum[axis] = decodeOrderedFloat(sceneBounds[axis + 3u]);
  }
  let extent = max(sceneMaximum - sceneMinimum, vec3<f32>(0.000001));
  let center = (minimum + maximum) * 0.5;
  mortonKeys[primitiveIndex] = makeMortonKey((center - sceneMinimum) / extent);
}
`,Ia=`
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;
const INVALID_BOUND = 3.402823466e+38;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sortedPrimitiveIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> sortedMinima: array<f32>;
@group(0) @binding(4) var<storage, read_write> sortedMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sortedIndex = invocation.x;
  if (sortedIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  let destinationComponent = sortedIndex * 3u;
  let primitiveIndex = sortedPrimitiveIds[sortedIndex];
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    for (var axis = 0u; axis < 3u; axis++) {
      sortedMinima[destinationComponent + axis] = INVALID_BOUND;
      sortedMaxima[destinationComponent + axis] = -INVALID_BOUND;
    }
    return;
  }

  let sourceComponent = primitiveIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    sortedMinima[destinationComponent + axis] = primitiveMinima[sourceComponent + axis];
    sortedMaxima[destinationComponent + axis] = primitiveMaxima[sourceComponent + axis];
  }
}
`,La=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;

struct RayTriangle {
  firstPosition: vec4<f32>,
  secondPosition: vec4<f32>,
  thirdPosition: vec4<f32>,
  firstNormal: vec4<f32>,
  secondNormal: vec4<f32>,
  thirdNormal: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> triangles: array<RayTriangle>;
@group(0) @binding(1) var<storage, read_write> triangleMinima: array<f32>;
@group(0) @binding(2) var<storage, read_write> triangleMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  let triangle = triangles[triangleIndex];
  let minimum = min(
    min(triangle.firstPosition.xyz, triangle.secondPosition.xyz),
    triangle.thirdPosition.xyz
  );
  let maximum = max(
    max(triangle.firstPosition.xyz, triangle.secondPosition.xyz),
    triangle.thirdPosition.xyz
  );
  let componentIndex = triangleIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    triangleMinima[componentIndex + axis] = minimum[axis];
    triangleMaxima[componentIndex + axis] = maximum[axis];
  }
}
`,Ra=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  let componentIndex = triangleIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = triangleMinima[MINIMA_OFFSET + componentIndex + axis];
    maximum[axis] = triangleMaxima[MAXIMA_OFFSET + componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    return;
  }

  for (var axis = 0u; axis < 3u; axis++) {
    atomicMin(&sceneBounds[axis], encodeOrderedFloat(minimum[axis]));
    atomicMax(&sceneBounds[axis + 3u], encodeOrderedFloat(maximum[axis]));
  }
}
`,za=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;
const MORTON_KEYS_OFFSET = __MORTON_KEYS_OFFSET__u;
const TRIANGLE_IDS_OFFSET = __TRIANGLE_IDS_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sceneBounds: array<u32>;
@group(0) @binding(3) var<storage, read_write> mortonKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> triangleIds: array<u32>;

fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(value ^ 0x80000000u, ~value, (value & 0x80000000u) == 0u);
  return bitcast<f32>(bits);
}

fn expandMortonBits(value: u32) -> u32 {
  var bits = value & 1023u;
  bits = (bits | (bits << 16u)) & 0x030000ffu;
  bits = (bits | (bits << 8u)) & 0x0300f00fu;
  bits = (bits | (bits << 4u)) & 0x030c30c3u;
  bits = (bits | (bits << 2u)) & 0x09249249u;
  return bits;
}

fn makeMortonKey(position: vec3<f32>) -> u32 {
  let coordinates = clamp(position, vec3<f32>(0.0), vec3<f32>(0.99999994)) * 1024.0;
  let quantized = vec3<u32>(
    u32(coordinates.x),
    u32(coordinates.y),
    u32(coordinates.z)
  );
  return expandMortonBits(quantized.x) * 4u +
    expandMortonBits(quantized.y) * 2u +
    expandMortonBits(quantized.z);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  triangleIds[TRIANGLE_IDS_OFFSET + triangleIndex] = triangleIndex;
  let componentIndex = triangleIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = triangleMinima[MINIMA_OFFSET + componentIndex + axis];
    maximum[axis] = triangleMaxima[MAXIMA_OFFSET + componentIndex + axis];
  }

  var sceneMinimum = vec3<f32>();
  var sceneMaximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    sceneMinimum[axis] = decodeOrderedFloat(sceneBounds[axis]);
    sceneMaximum[axis] = decodeOrderedFloat(sceneBounds[axis + 3u]);
  }
  let extent = max(sceneMaximum - sceneMinimum, vec3<f32>(0.000001));
  let center = (minimum + maximum) * 0.5;
  mortonKeys[MORTON_KEYS_OFFSET + triangleIndex] =
    makeMortonKey((center - sceneMinimum) / extent);
}
`,Ba=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;
const SORTED_TRIANGLE_IDS_OFFSET = __SORTED_TRIANGLE_IDS_OFFSET__u;
const SORTED_MINIMA_OFFSET = __SORTED_MINIMA_OFFSET__u;
const SORTED_MAXIMA_OFFSET = __SORTED_MAXIMA_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sortedTriangleIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> sortedMinima: array<f32>;
@group(0) @binding(4) var<storage, read_write> sortedMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sortedIndex = invocation.x;
  if (sortedIndex >= TRIANGLE_COUNT) {
    return;
  }

  let triangleIndex = sortedTriangleIds[SORTED_TRIANGLE_IDS_OFFSET + sortedIndex];
  let sourceComponent = triangleIndex * 3u;
  let destinationComponent = sortedIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    sortedMinima[SORTED_MINIMA_OFFSET + destinationComponent + axis] =
      triangleMinima[MINIMA_OFFSET + sourceComponent + axis];
    sortedMaxima[SORTED_MAXIMA_OFFSET + destinationComponent + axis] =
      triangleMaxima[MAXIMA_OFFSET + sourceComponent + axis];
  }
}
`,Va=`
const NODE_COUNT = __NODE_COUNT__u;
const NODE_MINIMA_OFFSET = __NODE_MINIMA_OFFSET__u;
const NODE_MAXIMA_OFFSET = __NODE_MAXIMA_OFFSET__u;
const PACKED_NODES_OFFSET = __PACKED_NODES_OFFSET__u;

@group(0) @binding(0) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> packedNodes: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let nodeIndex = invocation.x;
  if (nodeIndex >= NODE_COUNT) {
    return;
  }

  let sourceComponent = nodeIndex * 3u;
  let destinationComponent = nodeIndex * 8u;
  for (var axis = 0u; axis < 3u; axis++) {
    packedNodes[PACKED_NODES_OFFSET + destinationComponent + axis] =
      nodeMinima[NODE_MINIMA_OFFSET + sourceComponent + axis];
    packedNodes[PACKED_NODES_OFFSET + destinationComponent + 4u + axis] =
      nodeMaxima[NODE_MAXIMA_OFFSET + sourceComponent + axis];
  }
  packedNodes[PACKED_NODES_OFFSET + destinationComponent + 3u] = 0.0;
  packedNodes[PACKED_NODES_OFFSET + destinationComponent + 7u] = 0.0;
}
`,Ha=class{device;frames=new Map;geometryCache=new Map;constructor(e){if(e.type!==`webgpu`)throw Error(`Ray tracing scene rendering requires a WebGPU device.`);this.device=e}render(e){let[t,n]=Ua(this.device,e),r=Wa(this.device,e),i=e.lights??[],a=ho(e),o=new p(e.camera.projectionMatrix).multiplyRight(e.camera.viewMatrix),s=new p(o).invert(),c=Qa(e),l=eo(e),u=$a(e,l),d=to(e,i),f=this.frames.get(e.id),m=To();if(f){_o(f,m),go(f,a)&&(f.historyNeedsReset=!0);let s=f.topologyRevision!==c,p=f.primitiveRevision!==u,h=f.transformRevision!==l,g=f.lightRevision!==d,_=Ya(e,f,s,h),v=!s&&!p&&f.previousTransformsNeedCommit&&f.pendingPreviousTransformInstanceIds.size>0&&f.pendingPreviousTransformInstanceIds.size<=Ja(f),y,b,x;if(s&&(y=ro(e.surfaces,e.primitives??{},this.geometryCache)),s||p&&!_?b=io(e.surfaces,e.primitives??{},y?.geometryLayouts??f.geometryLayouts,f.previousTransforms):f.previousTransformsNeedCommit&&!_&&!v&&(b=io(e.surfaces,e.primitives??{},f.geometryLayouts,f.previousTransforms)),g&&(x=lo(i)),s||b&&f.primitiveBuffer.byteLength<b.primitives.byteLength||y&&f.triangleBuffer.byteLength<y.triangles.byteLength||x&&f.lightBuffer.byteLength<x.byteLength){y??=ro(e.surfaces,e.primitives??{},this.geometryCache),b??=io(e.surfaces,e.primitives??{},y.geometryLayouts,f.previousTransforms);let s=ao(b,y.triangles,i),p=f.previousTransformsNeedCommit||h;this.destroyFrame(e.id),f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:s,topology:y,primitiveData:b,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.previousTransformsNeedCommit=p;let m=f.primitivePlacements;f.pendingPreviousTransformInstanceIds=new Set(p?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>m.has(e)):[]),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}else{if(y&&(f.triangleBuffer.write(y.triangles),f.geometryLayouts=y.geometryLayouts,f.historyNeedsReset=!0,f.accelerationUpdateMode=`rebuild`),b){f.primitiveBuffer.write(b.primitives),f.previousTransforms=b.previousTransforms,f.primitivePlacements=b.placements,f.retainedSurfaces=e.surfaces;let t=b.placements;f.pendingPreviousTransformInstanceIds=new Set(h?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>t.has(e)):[]),f.previousTransformsNeedCommit=h,f.primitiveCount=b.primitiveCount,f.triangleCount=b.triangleCount,h?(Za(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)):p&&(f.historyNeedsReset=!0)}else (_||v)&&(Xa(f,_??[]),h&&(Za(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)));if(x){let t=f.lightCount!==i.length;f.lightBuffer.write(x),f.lightCount=i.length,(t||!(e.temporalReprojection??!0))&&(f.historyNeedsReset=!0)}f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d}}else{let s=ro(e.surfaces,e.primitives??{},this.geometryCache),p=io(e.surfaces,e.primitives??{},s.geometryLayouts,new Map),m=ao(p,s.triangles,i);f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:m,topology:s,primitiveData:p,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}f.lastRenderTimeMilliseconds||=m;let h=no(e,s);f.renderRevision!==h&&(f.renderRevision=h,f.historyNeedsReset=!0),(e.temporalReprojection??!0)&&wo(f.previousViewProjection,o,f.previousCameraPosition,e.camera.position)&&(f.historyNeedsReset=!0),(f.displayWidth!==t||f.displayHeight!==n)&&(f.historyNeedsReset=!0),vo(f,m);let g=yo(t,n,f.resolutionScale);f.displayWidth!==t||f.displayHeight!==n||f.internalWidth!==g.width||f.internalHeight!==g.height?this.recreateTraceResources(e.id,f,t,n,g.width,g.height,r):Ga(f.presentation,r)||this.recreateTraceGraph(e.id,f,r);let _=e.progressive??!0;f.historyNeedsReset&&(f.accumulatedFrameCount=0,f.phaseCount=1,f.phaseIndex=0);let v=f.historyNeedsReset?1:f.phaseCount,y=f.historyNeedsReset?0:f.phaseIndex%v,b=_?f.accumulatedFrameCount:0;f.uniformBuffer.write(fo({options:e,inverseViewProjection:s,previousViewProjection:f.previousViewProjection,previousCameraPosition:f.previousCameraPosition,displayWidth:t,displayHeight:n,internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,phaseIndex:y,phaseCount:v,primitiveCount:f.primitiveCount,primitiveCapacity:f.primitiveCapacity,leafCapacity:f.leafCapacity,lightCount:f.lightCount,directLightCount:i.reduce((e,t)=>e+Number(t.type!==`ambient`),0),accumulatedFrameCount:b,frameIndex:f.frameIndex}));let x,S,C;f.topologyNeedsUpdate&&(x=f.topologyGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.topologyNeedsUpdate=!1),f.accelerationUpdateMode===`rebuild`?(S=f.accelerationGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild=0):f.accelerationUpdateMode===`refit`&&(C=f.refitGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild++),f.accelerationUpdateMode=`none`;let w=f.traceGraph.encode(this.device.commandEncoder,{parameters:{dispatchWidth:Math.ceil(f.internalWidth/v),carryWidth:v>1?Math.ceil(f.internalWidth*(v-1)/v):0,...e.framebuffer?{framebuffer:e.framebuffer}:{}},textures:{...f.colorHistory.getBindings(`history`,`output`),...f.metadataHistory.getBindings(`history-metadata`,`output-metadata`)}}).stats;f.colorHistory.advance(),f.metadataHistory.advance(),f.previousViewProjection=new p(o),f.previousCameraPosition=Array.from(e.camera.position),f.historyNeedsReset=!1,f.phaseIndex=(y+1)%f.phaseCount,f.frameIndex++,f.accumulatedFrameCount=_?b+1:0;let ee=Co(e);return{surfaceCount:e.surfaces.length,instanceCount:f.primitiveCount,drawCount:1,triangleCount:f.triangleCount,rayTracing:{internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,sampledPixelCoverage:1/v,frameTimeMilliseconds:f.averageFrameTimeMilliseconds??f.targetFrameTimeMilliseconds,accumulatedSamples:_?Math.min(f.accumulatedFrameCount*ee,ka):ee,graph:qa({topology:x,acceleration:S,refit:C,trace:w})}}}destroyFrame(e){let t=this.frames.get(e);t&&(t.topologyGraph.destroy(),t.accelerationGraph.destroy(),t.refitGraph.destroy(),t.traceGraph.destroy(),t.uniformBuffer.destroy(),t.primitiveBuffer.destroy(),t.triangleBuffer.destroy(),t.lightBuffer.destroy(),t.nodeMinimaBuffer.destroy(),t.nodeMaximaBuffer.destroy(),t.nodeChildrenBuffer.destroy(),t.leafIdsBuffer.destroy(),t.sortedPrimitiveIdsBuffer.destroy(),t.blasNodesBuffer.destroy(),t.blasTriangleIdsBuffer.destroy(),t.bvhCountBuffer.destroy(),t.bvhOverflowBuffer.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e)}createFrameResources(e){let{frameIdentifier:t,scene:r}=e,i=this.device.createBuffer({id:`${t}-ray-tracing-uniforms`,byteLength:va*Float32Array.BYTES_PER_ELEMENT,usage:n.UNIFORM|n.COPY_DST}),a=this.device.createBuffer({id:`${t}-ray-tracing-primitives`,data:r.primitives,usage:n.STORAGE|n.COPY_DST}),o=this.device.createBuffer({id:`${t}-ray-tracing-triangles`,data:r.triangles,usage:n.STORAGE|n.COPY_DST}),s=this.device.createBuffer({id:`${t}-ray-tracing-lights`,data:r.lights,usage:n.STORAGE|n.COPY_DST}),c=Math.max(1,Math.floor(a.byteLength/(ma*Float32Array.BYTES_PER_ELEMENT))),l=2**Math.ceil(Math.log2(c)),u=l*2-1,d=this.device.createBuffer({id:`${t}-ray-tracing-node-minima`,byteLength:u*3*Float32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),f=this.device.createBuffer({id:`${t}-ray-tracing-node-maxima`,byteLength:u*3*Float32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),m=this.device.createBuffer({id:`${t}-ray-tracing-node-children`,byteLength:u*2*Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),h=this.device.createBuffer({id:`${t}-ray-tracing-leaf-ids`,byteLength:l*Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),g=this.device.createBuffer({id:`${t}-ray-tracing-sorted-primitive-ids`,data:new Uint32Array(l).fill(Aa),usage:n.STORAGE}),_=this.device.createBuffer({id:`${t}-ray-tracing-blas-nodes`,byteLength:Math.max(1,e.topology.blasNodeCount)*ga*Float32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),v=this.device.createBuffer({id:`${t}-ray-tracing-blas-triangle-ids`,data:new Uint32Array(Math.max(1,e.topology.blasTriangleIdCount)).fill(Aa),usage:n.STORAGE}),y=this.device.createBuffer({id:`${t}-ray-tracing-bvh-count`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),b=this.device.createBuffer({id:`${t}-ray-tracing-bvh-overflow`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:n.STORAGE}),x=yo(e.displayWidth,e.displayHeight,e.quality.resolutionScale),S=this.createTextureHistory(t,`history`,x.width,x.height),C=this.createTextureHistory(t,`history-metadata`,x.width,x.height),w=this.createTopologyGraph({frameIdentifier:t,topology:e.topology,triangleBuffer:o,blasNodesBuffer:_,blasTriangleIdsBuffer:v}),ee=this.createAccelerationGraph({frameIdentifier:t,uniformBuffer:i,primitiveBuffer:a,blasNodesBuffer:_,primitiveCapacity:c,leafCapacity:l,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:m,leafIdsBuffer:h,sortedPrimitiveIdsBuffer:g,bvhCountBuffer:y,bvhOverflowBuffer:b}),te=this.createRefitGraph({frameIdentifier:t,uniformBuffer:i,primitiveBuffer:a,blasNodesBuffer:_,primitiveCapacity:c,leafCapacity:l,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:m,leafIdsBuffer:h,sortedPrimitiveIdsBuffer:g,bvhCountBuffer:y,bvhOverflowBuffer:b}),T=this.createTraceGraph({frameIdentifier:t,internalWidth:x.width,internalHeight:x.height,presentation:e.presentation,uniformBuffer:i,primitiveBuffer:a,triangleBuffer:o,lightBuffer:s,nodeMinimaBuffer:d,nodeMaximaBuffer:f,sortedPrimitiveIdsBuffer:g,blasNodesBuffer:_,blasTriangleIdsBuffer:v,colorHistory:S,metadataHistory:C});return{displayWidth:e.displayWidth,displayHeight:e.displayHeight,presentation:e.presentation,internalWidth:x.width,internalHeight:x.height,resolutionScale:e.quality.resolutionScale,requestedResolutionScale:e.quality.requestedResolutionScale,minimumResolutionScale:e.quality.minimumResolutionScale,adaptiveResolution:e.quality.adaptiveResolution,targetFrameTimeMilliseconds:e.quality.targetFrameTimeMilliseconds,phaseCount:1,phaseIndex:0,overBudgetFrameCount:0,underBudgetFrameCount:0,lastBudgetAdjustmentTimeMilliseconds:0,uniformBuffer:i,primitiveBuffer:a,triangleBuffer:o,lightBuffer:s,nodeMinimaBuffer:d,nodeMaximaBuffer:f,nodeChildrenBuffer:m,leafIdsBuffer:h,sortedPrimitiveIdsBuffer:g,blasNodesBuffer:_,blasTriangleIdsBuffer:v,bvhCountBuffer:y,bvhOverflowBuffer:b,colorHistory:S,metadataHistory:C,topologyGraph:w,accelerationGraph:ee,refitGraph:te,traceGraph:T,topologyRevision:``,primitiveRevision:``,transformRevision:``,lightRevision:``,renderRevision:``,geometryLayouts:e.topology.geometryLayouts,retainedSurfaces:e.surfaces,previousTransforms:e.primitiveData.previousTransforms,primitivePlacements:e.primitiveData.placements,pendingPreviousTransformInstanceIds:new Set,previousTransformsNeedCommit:!1,previousViewProjection:new p(e.viewProjection),previousCameraPosition:Array.from(e.cameraPosition),historyNeedsReset:!0,topologyNeedsUpdate:!0,accelerationUpdateMode:`rebuild`,refitsSinceMortonRebuild:0,frameIndex:0,accumulatedFrameCount:0,primitiveCount:r.primitiveCount,primitiveCapacity:c,leafCapacity:l,lightCount:r.lightCount,triangleCount:r.triangleCount}}recreateTraceResources(e,t,n,r,i,a,o){t.traceGraph.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),t.colorHistory=this.createTextureHistory(e,`history`,i,a),t.metadataHistory=this.createTextureHistory(e,`history-metadata`,i,a),t.traceGraph=this.createTraceGraph({frameIdentifier:e,internalWidth:i,internalHeight:a,presentation:o,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory}),t.displayWidth=n,t.displayHeight=r,t.presentation=o,t.internalWidth=i,t.internalHeight=a,t.phaseIndex=0,t.historyNeedsReset=!0}recreateTraceGraph(e,t,n){let r=this.createTraceGraph({frameIdentifier:e,internalWidth:t.internalWidth,internalHeight:t.internalHeight,presentation:n,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory});t.traceGraph.destroy(),t.traceGraph=r,t.presentation=n}createTextureHistory(e,t,n,r){return new Nr(this.device,{id:`${e}-ray-tracing-${t}`,width:n,height:r,format:`rgba16float`,usage:o.SAMPLE|o.STORAGE})}createTopologyGraph(e){let t=new ur(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-topology`}),n=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),r=Math.max(1,e.topology.triangleCount),i=Math.max(1,e.topology.blasNodeCount),a=Math.max(1,e.topology.blasTriangleIdCount),o=P(t,`triangle-minima`,`float32x3`,r),s=P(t,`triangle-maxima`,`float32x3`,r),c=P(t,`blas-morton-keys`,`uint32`,a),l=P(t,`blas-local-triangle-ids`,`uint32`,a),u=P(t,`blas-sorted-morton-keys`,`uint32`,a),d=L(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,a),f=P(t,`blas-sorted-minima`,`float32x3`,r),p=P(t,`blas-sorted-maxima`,`float32x3`,r),m=P(t,`blas-node-minima`,`float32x3`,i),h=P(t,`blas-node-maxima`,`float32x3`,i),g=P(t,`blas-node-children`,`uint32x2`,i),_=P(t,`blas-leaf-ids`,`uint32`,a),v=L(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,i*2),y=Math.max(1,e.topology.geometryLayouts.size),b=P(t,`blas-counts`,`uint32`,y),x=P(t,`blas-overflows`,`uint32`,y);t.addComputePass({id:`${e.frameIdentifier}-build-triangle-bounds`,resources:[{buffer:n,usage:`storage-read`},{buffer:o,usage:`storage-write`},{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let i=new w(t,{id:`${e.frameIdentifier}-triangle-bounds-computation`,source:po(La,{TRIANGLE_COUNT:e.topology.triangleCount}),shaderLayout:{bindings:[{name:`triangles`,type:`read-only-storage`,group:0,location:0},{name:`triangleMinima`,type:`storage`,group:0,location:1},{name:`triangleMaxima`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangles:t(n),triangleMinima:M(o,t),triangleMaxima:M(s,t)}),i.dispatch(e,Math.ceil(r/128))},destroy:()=>i.destroy()}}});let S=[],C=[],ee=[];for(let[n,r]of Array.from(e.topology.geometryLayouts.values()).entries()){if(r.triangleCount===0)continue;let i=r.blasLeafCapacity*2-1,a=I(t,o,`float32x3`,r.triangleStart,r.triangleCount),y=I(t,s,`float32x3`,r.triangleStart,r.triangleCount),te=I(t,c,`uint32`,r.blasTriangleIdStart,r.triangleCount),T=I(t,l,`uint32`,r.blasTriangleIdStart,r.triangleCount),ne=I(t,u,`uint32`,r.blasTriangleIdStart,r.triangleCount),re=I(t,d,`uint32`,r.blasTriangleIdStart,r.triangleCount),ie=I(t,f,`float32x3`,r.triangleStart,r.triangleCount),ae=I(t,p,`float32x3`,r.triangleStart,r.triangleCount),oe=I(t,m,`float32x3`,r.blasNodeStart,i),E=I(t,h,`float32x3`,r.blasNodeStart,i),D=I(t,g,`uint32x2`,r.blasNodeStart,i),se=I(t,_,`uint32`,r.blasTriangleIdStart,r.blasLeafCapacity),ce=I(t,v,`float32x4`,r.blasNodeStart*2,i*2),le=I(t,b,`uint32`,n,1),ue=I(t,x,`uint32`,n,1),de=r.triangleCount<=256;if(r.triangleCount>0){let o=P(t,`blas-${n}-scene-bounds`,`uint32`,6);if(t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-initialize-scene-bounds`,resources:[{buffer:o,usage:`storage-write`}],compile:({device:t})=>{let r=new w(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-initialize-computation`,source:Na,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({sceneBounds:M(o,t)}),r.dispatch(e,1)},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read-write`}],compile:({device:t})=>{let i=new w(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-reduce-computation`,source:po(Ra,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:N(a),MAXIMA_OFFSET:N(y)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:M(a,t),triangleMaxima:M(y,t),sceneBounds:M(o,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:te,usage:`storage-write`},{buffer:T,usage:`storage-write`}],compile:({device:t})=>{let i=new w(t,{id:`${e.frameIdentifier}-blas-${n}-morton-keys-computation`,source:po(za,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:N(a),MAXIMA_OFFSET:N(y),MORTON_KEYS_OFFSET:N(te),TRIANGLE_IDS_OFFSET:N(T)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`triangleIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:M(a,t),triangleMaxima:M(y,t),sceneBounds:M(o,t),mortonKeys:M(te,t),triangleIds:M(T,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),de){let e=r.blasTriangleIdStart;S.push({keysOffset:e,valuesOffset:e,outputKeysOffset:e,outputValuesOffset:e,length:r.triangleCount})}else new wi({id:`${e.frameIdentifier}-blas-${n}-sort-triangle-morton-keys`,keys:te,values:T,outputKeys:ne,outputValues:re}).addToGraph(t);let s=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:re,usage:`storage-read`},{buffer:ie,usage:`storage-write`},{buffer:ae,usage:`storage-write`}],compile:({device:t})=>{let i=new w(t,{id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds-computation`,source:po(Ba,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:N(a),MAXIMA_OFFSET:N(y),SORTED_TRIANGLE_IDS_OFFSET:N(re),SORTED_MINIMA_OFFSET:N(ie),SORTED_MAXIMA_OFFSET:N(ae)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedTriangleIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:M(a,t),triangleMaxima:M(y,t),sortedTriangleIds:M(re,t),sortedMinima:M(ie,t),sortedMaxima:M(ae,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}})},c=()=>{new Gi({id:`${e.frameIdentifier}-blas-${n}-bvh`,minima:ie,maxima:ae,leafCapacity:r.blasLeafCapacity,nodeMinima:oe,nodeMaxima:E,nodeChildren:D,leafIds:se,count:le,overflow:ue}).addToGraph(t)},l=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-pack-nodes`,resources:[{buffer:oe,usage:`storage-read`},{buffer:E,usage:`storage-read`},{buffer:ce,usage:`storage-write`}],compile:({device:t})=>{let r=new w(t,{id:`${e.frameIdentifier}-blas-${n}-pack-nodes-computation`,source:po(Va,{NODE_COUNT:i,NODE_MINIMA_OFFSET:N(oe),NODE_MAXIMA_OFFSET:N(E),PACKED_NODES_OFFSET:N(ce)}),shaderLayout:{bindings:[{name:`nodeMinima`,type:`read-only-storage`,group:0,location:0},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:1},{name:`packedNodes`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({nodeMinima:M(oe,t),nodeMaxima:M(E,t),packedNodes:M(ce,t)}),r.dispatch(e,Math.ceil(i/128))},destroy:()=>r.destroy()}}})};if(de){let e=r.blasLeafCapacity<=128;e&&C.push({sourceOffset:r.triangleStart,sourceCount:r.triangleCount,nodeOffset:r.blasNodeStart,leafOffset:r.blasTriangleIdStart,metadataOffset:n,leafCapacity:r.blasLeafCapacity}),ee.push({addGatherPass:s,addHierarchyPass:c,addPackPass:l,usesSegmentedHierarchy:e})}else s(),c(),l()}}if(S.length>0){new li({id:`${e.frameIdentifier}-blas-sort-triangle-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d,segments:S}).addToGraph(t);for(let e of ee)e.addGatherPass();C.length>0&&new na({id:`${e.frameIdentifier}-blas-bvh`,minima:f,maxima:p,nodeMinima:m,nodeMaxima:h,nodeChildren:g,leafIds:_,counts:b,overflows:x,segments:C}).addToGraph(t);for(let e of ee)e.usesSegmentedHierarchy||e.addHierarchyPass(),e.addPackPass()}return t.compile()}createAccelerationGraph(e){let t=new ur(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-acceleration`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=P(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=P(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=P(t,`scene-bounds`,`uint32`,6),c=P(t,`primitive-morton-keys`,`uint32`,e.primitiveCapacity),l=P(t,`primitive-ids`,`uint32`,e.primitiveCapacity),u=P(t,`sorted-primitive-morton-keys`,`uint32`,e.primitiveCapacity),d=L(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),f=P(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),p=P(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),m=e.leafCapacity*2-1,h=L(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,m),g=L(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,m),_=L(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,m),v=L(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),y=new Gi({id:`${e.frameIdentifier}-ray-tracing-bvh`,minima:f,maxima:p,leafCapacity:e.leafCapacity,nodeMinima:h,nodeMaxima:g,nodeChildren:_,leafIds:v,count:L(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:L(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-build-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new w(t,{id:`${e.frameIdentifier}-primitive-bounds-computation`,source:ua,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:M(a,c),primitiveMaxima:M(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-initialize-scene-bounds`,resources:[{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let n=new w(t,{id:`${e.frameIdentifier}-scene-bounds-initialize-computation`,source:Na,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{n.setBindings({sceneBounds:M(s,t)}),n.dispatch(e,1)},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read-write`}],compile:({device:t})=>{let n=new w(t,{id:`${e.frameIdentifier}-scene-bounds-reduce-computation`,source:Pa.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:M(a,r),primitiveMaxima:M(o,r),sceneBounds:M(s,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new w(t,{id:`${e.frameIdentifier}-morton-keys-computation`,source:Fa.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`primitiveIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:M(a,r),primitiveMaxima:M(o,r),sceneBounds:M(s,r),mortonKeys:M(c,r),primitiveIds:M(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),new wi({id:`${e.frameIdentifier}-sort-primitive-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d}).addToGraph(t),t.addComputePass({id:`${e.frameIdentifier}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:d,usage:`storage-read`},{buffer:f,usage:`storage-write`},{buffer:p,usage:`storage-write`}],compile:({device:t})=>{let n=new w(t,{id:`${e.frameIdentifier}-gather-sorted-bounds-computation`,source:Ia.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:M(a,r),primitiveMaxima:M(o,r),sortedPrimitiveIds:M(d,r),sortedMinima:M(f,r),sortedMaxima:M(p,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),y.addToGraph(t),t.compile()}createRefitGraph(e){let t=new ur(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-refit`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=P(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=P(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=L(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),c=P(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),l=P(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),u=e.leafCapacity*2-1,d=L(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,u),f=L(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,u),p=L(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,u),m=L(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),h=new Gi({id:`${e.frameIdentifier}-ray-tracing-refit-bvh`,minima:c,maxima:l,leafCapacity:e.leafCapacity,nodeMinima:d,nodeMaxima:f,nodeChildren:p,leafIds:m,count:L(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:L(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-refit-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new w(t,{id:`${e.frameIdentifier}-refit-primitive-bounds-computation`,source:ua,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:M(a,c),primitiveMaxima:M(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-refit-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new w(t,{id:`${e.frameIdentifier}-refit-gather-sorted-bounds-computation`,source:Ia.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:M(a,r),primitiveMaxima:M(o,r),sortedPrimitiveIds:M(s,r),sortedMinima:M(c,r),sortedMaxima:M(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),h.addToGraph(t),t.compile()}createTraceGraph(e){let t=new ur(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-trace`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),a=t.importBuffer({id:`lights`,byteLength:e.lightBuffer.byteLength,usage:e.lightBuffer.usage},e.lightBuffer),s=Math.max(1,Math.floor(e.nodeMinimaBuffer.byteLength/(3*Float32Array.BYTES_PER_ELEMENT))),c=L(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,s),l=L(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,s),u=L(t,`leaf-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,Math.max(1,Math.floor(e.sortedPrimitiveIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),d=L(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,Math.max(1,Math.floor(e.blasNodesBuffer.byteLength/(4*Float32Array.BYTES_PER_ELEMENT)))),f=L(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,Math.max(1,Math.floor(e.blasTriangleIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),p=t.importTexture({id:`history`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:o.SAMPLE|o.STORAGE},e.colorHistory.previousTexture),m=t.importTexture({id:`history-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:o.SAMPLE|o.STORAGE},e.metadataHistory.previousTexture),h=t.importTexture({id:`output`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:o.SAMPLE|o.STORAGE},e.colorHistory.currentTexture),g=t.importTexture({id:`output-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:o.SAMPLE|o.STORAGE},e.metadataHistory.currentTexture),v=t.createTextureView(p),y=t.createTextureView(m),b=t.createTextureView(h),x=t.createTextureView(g);return t.addComputePass({id:`${e.frameIdentifier}-carry-ray-tracing-history`,resources:[{buffer:n,usage:`uniform`},{texture:v,usage:`sampled`},{texture:y,usage:`sampled`},{texture:b,usage:`storage-write`},{texture:x,usage:`storage-write`}],compile:({device:t})=>{let r=new w(t,{id:`${e.frameIdentifier}-ray-tracing-history-carry-computation`,source:da,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`historyImage`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:2,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:3,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:4,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:i,getTextureView:a,parameters:o})=>{o.carryWidth!==0&&(r.setBindings({uniforms:i(n),historyImage:a(v),historyMetadata:a(y),outputImage:a(b),outputMetadata:a(x)}),r.dispatch(t,Math.ceil(o.carryWidth/8),Math.ceil(e.internalHeight/8),1))},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-trace-rays`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-read`},{buffer:c,usage:`storage-read`},{buffer:l,usage:`storage-read`},{buffer:u,usage:`storage-read`},{buffer:d,usage:`storage-read`},{buffer:f,usage:`storage-read`},{texture:v,usage:`sampled`},{texture:y,usage:`sampled`},{texture:b,usage:`storage-write`},{texture:x,usage:`storage-write`}],compile:({device:t})=>{let o=new w(t,{id:`${e.frameIdentifier}-ray-tracing-computation`,source:fa,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`triangles`,type:`read-only-storage`,group:0,location:2},{name:`lights`,type:`read-only-storage`,group:0,location:3},{name:`nodeMinima`,type:`read-only-storage`,group:0,location:4},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:5},{name:`leafPrimitiveIds`,type:`read-only-storage`,group:0,location:6},{name:`blasNodes`,type:`read-only-storage`,group:0,location:7},{name:`blasTriangleIds`,type:`read-only-storage`,group:0,location:8},{name:`historyImage`,type:`texture`,group:0,location:9,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:10,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:11,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:12,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:s,getTextureView:p,parameters:m})=>{o.setBindings({uniforms:s(n),primitives:s(r),triangles:s(i),lights:s(a),nodeMinima:M(c,s),nodeMaxima:M(l,s),leafPrimitiveIds:M(u,s),blasNodes:M(d,s),blasTriangleIds:M(f,s),historyImage:p(v),historyMetadata:p(y),outputImage:p(b),outputMetadata:p(x)}),o.dispatch(t,Math.ceil(m.dispatchWidth/8),Math.ceil(e.internalHeight/8),1)},destroy:()=>o.destroy()}}}),t.addRenderPass({id:`${e.frameIdentifier}-present-ray-tracing`,resources:[{texture:b,usage:`sampled`}],compile:({device:t})=>{let n=new _(t,{id:`${e.frameIdentifier}-ray-tracing-presentation`,source:pa({toneMapMode:e.presentation.toneMapMode,outputEncoding:e.presentation.outputEncoding}),vertexCount:3,colorAttachmentFormats:[e.presentation.colorFormat],...e.presentation.depthStencilFormat?{depthStencilAttachmentFormat:e.presentation.depthStencilFormat}:{},shaderLayout:{attributes:[],bindings:[{name:`image`,type:`texture`,group:0,location:0,sampleType:`unfilterable-float`}]},parameters:{depthWriteEnabled:!1,...e.presentation.depthStencilFormat?{depthCompare:`always`}:{}}});return{getRenderPassProps:({parameters:t})=>({id:`${e.frameIdentifier}-present-ray-tracing`,...t.framebuffer?{framebuffer:t.framebuffer}:{}}),encode:({renderPass:e,getTextureView:t})=>{n.setBindings({image:t(b)}),n.draw(e)},destroy:()=>n.destroy()}}}),t.compile()}};function Ua(e,t){if(t.framebuffer)return[t.framebuffer.width,t.framebuffer.height];if(t.width!==void 0&&t.height!==void 0)return[t.width,t.height];let[n,r]=e.getDefaultCanvasContext().getDrawingBufferSize();return[t.width??n,t.height??r]}function Wa(e,n){let r=n.framebuffer?.colorAttachments[0]?.texture.format??e.preferredColorFormat,i=!!(t.getInfo(r).dataType?.startsWith(`float`)||r.endsWith(`ufloat`)),a=n.framebuffer?n.framebuffer.depthStencilAttachment?.texture.format:`depth24plus`;return{colorFormat:r,...a?{depthStencilFormat:a}:{},toneMapMode:n.toneMapMode??(i?rt.NONE:rt.KHRONOS_PBR_NEUTRAL),outputEncoding:n.outputColorSpace?Number(n.outputColorSpace===`srgb`):Number(!i&&!r.endsWith(`-srgb`))}}function Ga(e,t){return e.colorFormat===t.colorFormat&&e.depthStencilFormat===t.depthStencilFormat&&e.toneMapMode===t.toneMapMode&&e.outputEncoding===t.outputEncoding}function Ka(e){return{nodeCount:e.nodeCount,computePassCount:e.computePassCount,coalescedComputeNodeCount:e.coalescedComputeNodeCount,cpuEncodeTimeMilliseconds:e.cpuEncodeTimeMilliseconds}}function qa(e){let t=e.topology&&Ka(e.topology),n=e.acceleration&&Ka(e.acceleration),r=e.refit&&Ka(e.refit),i=Ka(e.trace),a=[t,n,r,i].filter(e=>!!e);return{nodeCount:a.reduce((e,t)=>e+t.nodeCount,0),computePassCount:a.reduce((e,t)=>e+t.computePassCount,0),coalescedComputeNodeCount:a.reduce((e,t)=>e+t.coalescedComputeNodeCount,0),cpuEncodeTimeMilliseconds:a.reduce((e,t)=>e+t.cpuEncodeTimeMilliseconds,0),...t?{topology:t}:{},...n?{acceleration:n}:{},...r?{refit:r}:{},trace:i}}function Ja(e){return Math.max(1,Math.floor(e.primitiveCount*Ma))}function Ya(e,t,n,r){let i=e.sceneRevisions,a=i?.dirtyInstanceIds;if(n||!r||!i||!a||a.length===0||e.surfaces!==t.retainedSurfaces||t.materialRevision!==i.materials)return;let o=Array.from(new Set(a));if(!(o.length>Ja(t)||o.some(n=>{let r=t.primitivePlacements.get(n);return!r||e.surfaces[r.surfaceIndex]!==r.surface||r.surface.instanceIds?.[r.transformIndex]!==n})))return o}function Xa(e,t){let n=new Set(t);for(let t of e.pendingPreviousTransformInstanceIds){if(n.has(t))continue;let r=e.primitivePlacements.get(t);if(!r)continue;let i=e.previousTransforms.get(r.placementIdentifier);i&&e.primitiveBuffer.write(Float32Array.from(i),(r.primitiveIndex*ma+52)*Float32Array.BYTES_PER_ELEMENT)}for(let t of n){let n=e.primitivePlacements.get(t);if(!n)continue;let r=n.surface.transforms[n.transformIndex],i=e.previousTransforms.get(n.placementIdentifier)??r,a=new Float32Array(32);a.set(r),a.set(new p(r).invert(),16);let o=n.primitiveIndex*ma*Float32Array.BYTES_PER_ELEMENT;e.primitiveBuffer.write(a,o),e.primitiveBuffer.write(Float32Array.from(i),o+52*Float32Array.BYTES_PER_ELEMENT),e.previousTransforms.set(n.placementIdentifier,new p(r))}e.pendingPreviousTransformInstanceIds=n,e.previousTransformsNeedCommit=n.size>0}function Za(e){e.accelerationUpdateMode!==`rebuild`&&(e.accelerationUpdateMode=e.refitsSinceMortonRebuild>=ja?`rebuild`:`refit`)}function Qa(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.topology}`:JSON.stringify(e.surfaces.map(t=>[t.id,t.geometry.id,t.geometryVersion,t.transforms.length,t.morphWeights,e.primitives?.[t.id]]))}function $a(e,t){return e.sceneRevisions?`${t}:${e.sceneRevisions.materials}`:JSON.stringify([t,e.surfaces.map(t=>[t.material.id,t.material.version,t.material.uniforms,e.primitives?.[t.id]])])}function eo(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.transforms}`:JSON.stringify(e.surfaces.map(e=>[e.id,e.transforms.map(e=>Array.from(e)),e.instanceIds]))}function to(e,t){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.lights}`:JSON.stringify(t)}function no(e,t){let n=e.temporalReprojection??!0?void 0:[Array.from(t),Array.from(e.camera.position)];return JSON.stringify([e.cameraProjection,n,e.background,e.exposure,e.fogColor,e.fogDensity,e.samplesPerPixel,e.maxBounces,e.progressive,e.shadows,e.temporalReprojection,e.shadowSamplesPerFrame])}function ro(e,t,n){let r=[],i=new Map,a=0,o=0;for(let s of e){if(t[s.id]?.type===`sphere`)continue;let e=so(s);if(i.has(e))continue;let c=oo(s,n),l=r.length/ha,u=mo(Math.max(1,c.triangleCount)),d=u*2-1;for(let e of c.triangles)r.push(e);i.set(e,{triangleStart:l,triangleCount:c.triangleCount,blasNodeStart:a,blasTriangleIdStart:o,blasInternalNodeCount:u-1,blasLeafCapacity:u,bounds:c.bounds}),a+=d,o+=u}return{triangles:uo(r,ha),geometryLayouts:i,triangleCount:r.length/ha,blasNodeCount:a,blasTriangleIdCount:o}}function io(e,t,n,r){let i=e.reduce((e,t)=>e+t.transforms.length,0),a=new Float32Array(Math.max(i,1)*ma),o=new Map,s=new Map,c=0,l=0;for(let[i,u]of e.entries()){let e=t[u.id],d=e?.type===`sphere`?e.radius:0,f=d>0?void 0:n.get(so(u)),m=f?.bounds??[0,0,0,d],h=u.material.uniforms,g=h?.baseColorFactor??[.8,.8,.8,1],_=h?.emissiveFactor??[0,0,0],v=h?.emissiveStrength??1,y=h?.metallicRoughnessValues??[0,.5],b=u.instanceIds;for(let e=0;e<u.transforms.length;e++){let t=u.transforms[e],n=new p(t).invert(),h=b?.[e]??String(e),x=`${u.id}:${h}`,S=r.get(x)??t,C=c*ma;a.set(t,C),a.set(n,C+16),a[C+32]=g[0],a[C+33]=g[1],a[C+34]=g[2],a[C+35]=g[3]??1,a[C+36]=_[0]*v,a[C+37]=_[1]*v,a[C+38]=_[2]*v,a[C+39]=y[0],a[C+40]=y[1],a[C+41]=d,a[C+42]=f?.triangleStart??0,a[C+43]=f?.triangleCount??0,a[C+44]=m[0],a[C+45]=m[1],a[C+46]=m[2],a[C+47]=m[3],a[C+48]=f?.blasNodeStart??0,a[C+49]=f?.blasTriangleIdStart??0,a[C+50]=f?.blasInternalNodeCount??0,a[C+51]=f?.blasLeafCapacity??0,a.set(S,C+52),o.set(x,new p(t)),s.set(b?.[e]??x,{surface:u,surfaceIndex:i,transformIndex:e,primitiveIndex:c,placementIdentifier:x}),c++,l+=f?.triangleCount??0}}return{primitives:a,primitiveCount:i,triangleCount:l,previousTransforms:o,placements:s}}function ao(e,t,n){return{primitives:e.primitives,triangles:t,lights:lo(n),primitiveCount:e.primitiveCount,lightCount:n.length,triangleCount:e.triangleCount}}function oo(e,t){let n=so(e),r=t.get(n);if(r)return r;let i=e.geometry,a=i.attributes.POSITION?.value,o=i.attributes.NORMAL?.value;if(!a||!o)throw Error(`Ray tracing scene geometry requires positions and normals.`);let s=[],c=co(i),l=i.indices?.value,u=l?.length??a.length/3;for(let e=0;e+2<u;e+=3){for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(a[n]),Number(a[n+1]),Number(a[n+2]),0)}for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(o[n]),Number(o[n+1]),Number(o[n+2]),0)}}let d={triangles:new Float32Array(s),triangleCount:s.length/ha,bounds:c};return t.set(n,d),d}function so(e){return`${e.geometry.id}:${e.geometryVersion??0}`}function co(e){let t=e.attributes.POSITION?.value;if(!t||t.length===0)return[0,0,0,0];let n=[1/0,1/0,1/0],r=[-1/0,-1/0,-1/0];for(let e=0;e+2<t.length;e+=3)for(let i=0;i<3;i++){let a=Number(t[e+i]);n[i]=Math.min(n[i],a),r[i]=Math.max(r[i],a)}let i=n.map((e,t)=>(e+r[t])*.5),a=0;for(let e=0;e+2<t.length;e+=3){let n=(Number(t[e])-i[0])**2+(Number(t[e+1])-i[1])**2+(Number(t[e+2])-i[2])**2;a=Math.max(a,n)}return[i[0],i[1],i[2],Math.sqrt(a)+1e-4]}function lo(e){let t=[];for(let n of e){let e=n.color??[1,1,1],r=n.intensity??1,i=n.type===`point`||n.type===`spot`?n.position:[0,0,0],a=n.type===`directional`||n.type===`spot`?n.direction:[0,-1,0],o=n.type===`point`||n.type===`spot`?n.attenuation??[1,0,0]:[1,0,0],s=n.type===`ambient`?0:n.type===`directional`?1:n.type===`point`?2:3,c=n.type===`spot`?Math.cos(n.innerConeAngle??.35):1,l=n.type===`spot`?Math.cos(n.outerConeAngle??.5):0;t.push(e[0],e[1],e[2],r,i[0],i[1],i[2],c,a[0],a[1],a[2],s,o[0],o[1],o[2],l)}return uo(t,_a)}function uo(e,t){return e.length>0?new Float32Array(e):new Float32Array(t)}function fo(e){let t=new Float32Array(va),n=new Uint32Array(t.buffer),r=e.options.background??[.015,.018,.038,1],i=e.options.fogColor??[.025,.035,.075];return t.set(e.inverseViewProjection,0),t.set(e.options.camera.position,16),t[19]=e.options.cameraProjection===`orthographic`?1:0,t.set(r,20),n[24]=e.internalWidth,n[25]=e.internalHeight,n[26]=e.primitiveCount,n[27]=e.lightCount,t[28]=e.options.exposure??1.35,t[29]=e.accumulatedFrameCount,t[30]=e.options.samplesPerPixel??1,t[31]=e.options.shadows??!0?1:0,t.set(i,32),t[35]=e.options.fogDensity??0,n[36]=e.leafCapacity-1,n[37]=e.leafCapacity,n[38]=e.primitiveCapacity,n[39]=e.frameIndex,n[40]=e.displayWidth,n[41]=e.displayHeight,n[42]=e.phaseIndex,n[43]=e.phaseCount,t[44]=e.resolutionScale,t[45]=e.directLightCount,t[46]=e.options.shadowSamplesPerFrame??1,t[47]=e.options.temporalReprojection??!0?1:0,t.set(e.previousViewProjection,48),t.set(e.previousCameraPosition,64),t[67]=e.options.progressive??!0?1:0,t}function I(e,t,n,r,i){return e.createDataView(t.buffer,{format:n,length:i,byteOffset:t.byteOffset+r*t.byteStride})}function L(e,t,n,r,i){let a=e.importBuffer({id:t,byteLength:n.byteLength,usage:n.usage},n);return e.createDataView(a,{format:r,length:i})}function po(e,t){let n=e;for(let[e,r]of Object.entries(t))n=n.replaceAll(`__${e}__`,String(r));return n}function mo(e){return 2**Math.ceil(Math.log2(Math.max(1,e)))}function ho(e){let t=e.adaptiveResolution??!0,n=So(e.minimumResolutionScale??ba,.125,1),r=So(e.resolutionScale??ya,n,1);return{resolutionScale:r,requestedResolutionScale:r,minimumResolutionScale:n,adaptiveResolution:t,targetFrameTimeMilliseconds:Math.max(1,e.targetFrameTimeMilliseconds??xa)}}function go(e,t){return e.minimumResolutionScale===t.minimumResolutionScale&&e.adaptiveResolution===t.adaptiveResolution&&e.targetFrameTimeMilliseconds===t.targetFrameTimeMilliseconds&&e.requestedResolutionScale===t.requestedResolutionScale?!1:(e.resolutionScale=t.resolutionScale,e.requestedResolutionScale=t.requestedResolutionScale,e.minimumResolutionScale=t.minimumResolutionScale,e.adaptiveResolution=t.adaptiveResolution,e.targetFrameTimeMilliseconds=t.targetFrameTimeMilliseconds,e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0,e.averageFrameTimeMilliseconds=void 0,!0)}function _o(e,t){let n=e.lastRenderTimeMilliseconds;if(e.lastRenderTimeMilliseconds=t,n===void 0)return;let r=t-n;r<=0||r>1e3||(e.averageFrameTimeMilliseconds=e.averageFrameTimeMilliseconds===void 0?r:e.averageFrameTimeMilliseconds*.8+r*.2)}function vo(e,t){if(e.historyNeedsReset){e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0;return}if(!e.adaptiveResolution||e.averageFrameTimeMilliseconds===void 0)return;let n=e.averageFrameTimeMilliseconds,r=e.targetFrameTimeMilliseconds;if(n>r*wa?(e.overBudgetFrameCount=Math.min(Ea,e.overBudgetFrameCount+1),e.underBudgetFrameCount=0):n<r*Ta?(e.underBudgetFrameCount=Math.min(Da,e.underBudgetFrameCount+1),e.overBudgetFrameCount=0):(e.overBudgetFrameCount=0,e.underBudgetFrameCount=0),!(t-e.lastBudgetAdjustmentTimeMilliseconds<Ca)){if(e.overBudgetFrameCount>=Ea){let n=bo(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,-1);if(n<e.resolutionScale)e.resolutionScale=n,e.historyNeedsReset=!0;else if(e.accumulatedFrameCount>=Oa)e.phaseCount=Math.min(4,e.phaseCount*2),e.phaseIndex%=e.phaseCount;else return;e.overBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t;return}if(e.underBudgetFrameCount>=Da){if(e.phaseCount>1)e.phaseCount=Math.max(1,e.phaseCount/2),e.phaseIndex%=e.phaseCount;else{let t=bo(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,1);if(t<=e.resolutionScale){e.underBudgetFrameCount=0;return}e.resolutionScale=t,e.historyNeedsReset=!0}e.underBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t}}}function yo(e,t,n){return{width:Math.max(1,Math.ceil(e*n)),height:Math.max(1,Math.ceil(t*n))}}function bo(e,t,n,r){let i=xo(t,n),a=i.findIndex(t=>t>=e-1e-4),o=a<0?i.length-1:a;return i[Math.max(0,Math.min(i.length-1,o+r))]}function xo(e,t){let n=[e,...Sa.filter(n=>n>e&&n<t),t].sort((e,t)=>e-t);return n.filter((e,t)=>t===0||Math.abs(e-n[t-1])>1e-4)}function So(e,t,n){return Math.max(t,Math.min(n,Number.isFinite(e)?e:t))}function Co(e){return Math.max(1,Math.min(16,Math.floor(e.samplesPerPixel??1)))}function wo(e,t,n,r){let i=0;for(let n=0;n<16;n++)i=Math.max(i,Math.abs(Number(e[n])-Number(t[n])));let a=Math.hypot(Number(n[0]??0)-Number(r[0]??0),Number(n[1]??0)-Number(r[1]??0),Number(n[2]??0)-Number(r[2]??0));return i>.75||a>4}function To(){return globalThis.performance?.now()??Date.now()}var Eo=new p,Do=[1,0,0,0,1,0,0,0,1],Oo=[{parameter:`baseColorTexture`,binding:`pbr_baseColorSampler`,enabled:`baseColorMapEnabled`,textureCoordinateSet:`baseColorUVSet`,transform:`baseColorUVTransform`},{parameter:`normalTexture`,binding:`pbr_normalSampler`,enabled:`normalMapEnabled`,textureCoordinateSet:`normalUVSet`,transform:`normalUVTransform`},{parameter:`metallicRoughnessTexture`,binding:`pbr_metallicRoughnessSampler`,enabled:`metallicRoughnessMapEnabled`,textureCoordinateSet:`metallicRoughnessUVSet`,transform:`metallicRoughnessUVTransform`},{parameter:`emissiveTexture`,binding:`pbr_emissiveSampler`,enabled:`emissiveMapEnabled`,textureCoordinateSet:`emissiveUVSet`,transform:`emissiveUVTransform`},{parameter:`occlusionTexture`,binding:`pbr_occlusionSampler`,enabled:`occlusionMapEnabled`,textureCoordinateSet:`occlusionUVSet`,transform:`occlusionUVTransform`},{parameter:`specularColorTexture`,binding:`pbr_specularColorSampler`,enabled:`specularColorMapEnabled`,textureCoordinateSet:`specularColorUVSet`,transform:`specularColorUVTransform`},{parameter:`specularIntensityTexture`,binding:`pbr_specularIntensitySampler`,enabled:`specularIntensityMapEnabled`,textureCoordinateSet:`specularIntensityUVSet`,transform:`specularIntensityUVTransform`},{parameter:`transmissionTexture`,binding:`pbr_transmissionSampler`,enabled:`transmissionMapEnabled`,textureCoordinateSet:`transmissionUVSet`,transform:`transmissionUVTransform`},{parameter:`thicknessTexture`,binding:`pbr_thicknessSampler`,enabled:null,textureCoordinateSet:`thicknessUVSet`,transform:`thicknessUVTransform`},{parameter:`clearcoatTexture`,binding:`pbr_clearcoatSampler`,enabled:`clearcoatMapEnabled`,textureCoordinateSet:`clearcoatUVSet`,transform:`clearcoatUVTransform`},{parameter:`clearcoatRoughnessTexture`,binding:`pbr_clearcoatRoughnessSampler`,enabled:`clearcoatRoughnessMapEnabled`,textureCoordinateSet:`clearcoatRoughnessUVSet`,transform:`clearcoatRoughnessUVTransform`},{parameter:`clearcoatNormalTexture`,binding:`pbr_clearcoatNormalSampler`,enabled:null,textureCoordinateSet:`clearcoatNormalUVSet`,transform:`clearcoatNormalUVTransform`},{parameter:`sheenColorTexture`,binding:`pbr_sheenColorSampler`,enabled:`sheenColorMapEnabled`,textureCoordinateSet:`sheenColorUVSet`,transform:`sheenColorUVTransform`},{parameter:`sheenRoughnessTexture`,binding:`pbr_sheenRoughnessSampler`,enabled:`sheenRoughnessMapEnabled`,textureCoordinateSet:`sheenRoughnessUVSet`,transform:`sheenRoughnessUVTransform`},{parameter:`iridescenceTexture`,binding:`pbr_iridescenceSampler`,enabled:`iridescenceMapEnabled`,textureCoordinateSet:`iridescenceUVSet`,transform:`iridescenceUVTransform`},{parameter:`iridescenceThicknessTexture`,binding:`pbr_iridescenceThicknessSampler`,enabled:null,textureCoordinateSet:`iridescenceThicknessUVSet`,transform:`iridescenceThicknessUVTransform`},{parameter:`anisotropyTexture`,binding:`pbr_anisotropySampler`,enabled:`anisotropyMapEnabled`,textureCoordinateSet:`anisotropyUVSet`,transform:`anisotropyUVTransform`},{parameter:`bumpTexture`,binding:`pbr_bumpSampler`,enabled:`bumpMapEnabled`,textureCoordinateSet:`bumpUVSet`,transform:`bumpUVTransform`},{parameter:`diffuseTransmissionTexture`,binding:`pbr_diffuseTransmissionSampler`,enabled:`diffuseTransmissionMapEnabled`,textureCoordinateSet:`diffuseTransmissionUVSet`,transform:`diffuseTransmissionUVTransform`},{parameter:`diffuseTransmissionColorTexture`,binding:`pbr_diffuseTransmissionColorSampler`,enabled:`diffuseTransmissionColorMapEnabled`,textureCoordinateSet:`diffuseTransmissionColorUVSet`,transform:`diffuseTransmissionColorUVTransform`},{parameter:`multiscatterColorTexture`,binding:`pbr_multiscatterColorSampler`,enabled:`multiscatterColorMapEnabled`,textureCoordinateSet:`multiscatterColorUVSet`,transform:`multiscatterColorUVTransform`}],ko=class{geometries=new Map;materials=new Map;worlds=new Map;makeRenderOptions(e){let t=e.getParameter(`world`),n=e.getParameter(`camera`),r=e.getParameter(`renderer`);if(!t||!n||!r)return null;let[i,a]=Mo(e,e.device.device),o=r.getParameter(`ambientRadiance`)??.12,s=r.getParameter(`toneMapMode`),c=r.getParameter(`outputColorSpace`),l=this.worlds.get(t);return l?this.updateCachedWorld(l,o):(l=this.createCachedWorld(t,o),this.worlds.set(t,l)),{id:e.id,surfaces:l.surfaces,sceneRevisions:{...l.revisions},camera:Lo(n,i,a),lights:l.lights,background:r.getParameter(`background`)||[.015,.018,.038,1],width:i,height:a,environment:r.getParameter(`environment`),exposure:r.getParameter(`exposure`)??1.35,...s===void 0?{}:{toneMapMode:s},...c===void 0?{}:{outputColorSpace:c},fogColor:r.getParameter(`fogColor`)||[.025,.035,.075],fogDensity:r.getParameter(`fogDensity`)??0,renderMode:r.subtype===`debugNormals`?`debugNormals`:r.subtype===`debugDepth`?`debugDepth`:`default`}}getAnalyticPrimitives(e){let t=this.worlds.get(e);return t||(t=this.createCachedWorld(e,.12),this.worlds.set(e,t)),t.analyticPrimitives}destroy(){this.geometries.clear(),this.materials.clear(),this.worlds.clear()}createCachedWorld(e,t){let n={world:e,surfaces:[],surfaceEntries:[],lights:[],analyticPrimitives:{},ambientRadiance:t,observedCommitRevision:e.device.getSceneCommitRevision(),topologyObjectIds:new Set,lightObjectIds:new Set,instancePlacements:new Map,materialSurfaces:new Map,samplerMaterials:new Map,revisions:{identity:e.id,topology:0,transforms:0,materials:0,lights:0}};return this.rebuildCachedWorld(n,t),n}updateCachedWorld(e,t){let n=e.world.device.getSceneCommitRevision(),r=e.ambientRadiance!==t;if(n===e.observedCommitRevision&&!r)return;let i=e.world.device.getSceneCommitsSince(e.observedCommitRevision),a=i===null,o=r||i===null,s=i===null,c=new Set,l=new Set;for(let t of i??[])if(t.categories.includes(`topology`)&&e.topologyObjectIds.has(t.objectId)&&(a=!0),t.categories.includes(`lights`)&&e.lightObjectIds.has(t.objectId)&&(o=!0,t.categories.includes(`topology`)&&(s=!0)),t.categories.includes(`transforms`)&&e.instancePlacements.has(t.objectId)&&c.add(t.objectId),t.categories.includes(`materials`)){for(let n of e.materialSurfaces.get(t.objectId)??[])l.add(n.material);for(let n of e.samplerMaterials.get(t.objectId)??[])l.add(n)}if(a){this.rebuildCachedWorld(e,t),e.revisions.topology++,e.revisions.lights++,delete e.revisions.dirtyInstanceIds;return}if(c.size>0){let t=new Set;for(let n of c)for(let r of e.instancePlacements.get(n)??[])r.transforms[r.transformIndex]=r.instance.getParameter(`transform`)||Eo,t.add(r.instanceId);e.revisions.transforms++,e.revisions.dirtyInstanceIds=Array.from(t)}if(l.size>0){for(let t of l){let n=this.getMaterial(t);for(let r of e.materialSurfaces.get(t.id)??[])r.surface.material=n}this.updateMaterialDependencies(e),e.revisions.materials++}o&&(e.lights=Fo(e.world,t),e.ambientRadiance=t,e.revisions.lights++,s&&this.updateLightDependencies(e)),e.observedCommitRevision=n}rebuildCachedWorld(e,t){e.topologyObjectIds.clear(),e.lightObjectIds.clear(),e.instancePlacements.clear(),e.materialSurfaces.clear(),e.samplerMaterials.clear(),e.surfaceEntries=[],e.analyticPrimitives={},e.surfaces=this.makeSceneSurfaces(e),e.lights=Fo(e.world,t),this.updateLightDependencies(e),e.ambientRadiance=t,e.observedCommitRevision=e.world.device.getSceneCommitRevision()}makeSceneSurfaces(e){let t=new Map;for(let n of No(e.world,e)){let e=t.get(n.surface)||[];e.push(n),t.set(n.surface,e)}let n=[];for(let[r,i]of t){let t=r.getParameter(`geometry`),a=r.getParameter(`material`);if(!t||!a)continue;let o=this.getGeometry(t),s=this.geometries.get(t),c=i.map(e=>e.transform),l={id:r.id,geometry:o,geometryVersion:s.structuralVersion,material:this.getMaterial(a),transforms:c,instanceIds:i.map(e=>e.instanceId),...r.getParameter(`skin`)?{skin:r.getParameter(`skin`)}:{},...t.getParameter(`morphTargets`)?{morphTargets:t.getParameter(`morphTargets`),morphWeights:t.getParameter(`morphWeights`)||[]}:{}};n.push(l),e.topologyObjectIds.add(r.id),e.topologyObjectIds.add(t.id);for(let n of Object.values(t.getParameters()))n instanceof D&&e.topologyObjectIds.add(n.id);let u={source:r,material:a,surface:l};e.surfaceEntries.push(u);let d=e.materialSurfaces.get(a.id)??[];d.push(u),e.materialSurfaces.set(a.id,d),t.subtype===`sphere`&&(e.analyticPrimitives[r.id]={type:`sphere`,radius:t.getParameter(`radius`)??1});for(let[t,n]of i.entries()){if(!n.instance)continue;let r=e.instancePlacements.get(n.instance.id)??[];r.push({instance:n.instance,transforms:c,transformIndex:t,instanceId:n.instanceId}),e.instancePlacements.set(n.instance.id,r)}}return this.updateMaterialDependencies(e),n}updateMaterialDependencies(e){e.samplerMaterials.clear();for(let t of e.surfaceEntries){let n=t.material.getParameters();for(let r of Oo){let i=n[r.parameter];if(!i)continue;let a=e.samplerMaterials.get(i.id)??new Set;a.add(t.material),e.samplerMaterials.set(i.id,a)}}}updateLightDependencies(e){let{world:t}=e,n=t.getParameters();e.lightObjectIds.clear(),e.lightObjectIds.add(t.id),n.light instanceof D&&e.lightObjectIds.add(n.light.id);for(let t of R(n.light,n.lights))e.lightObjectIds.add(t.id);n.instance instanceof D&&e.lightObjectIds.add(n.instance.id);for(let t of R(n.instance,n.instances)){e.lightObjectIds.add(t.id);let n=t.getParameter(`group`);n instanceof D&&e.lightObjectIds.add(n.id);let r=n instanceof D?n.data:Array.isArray(n)?n:n?[n]:[];for(let t of r){if(!(t instanceof de))continue;e.lightObjectIds.add(t.id);let n=t.getParameters();n.light instanceof D&&e.lightObjectIds.add(n.light.id);for(let t of R(n.light,n.lights))e.lightObjectIds.add(t.id)}}}getMaterial(e){let t=this.materials.get(e);if(t?.version===e.version&&Array.from(t.samplers).every(([e,t])=>e.version===t))return t.material;let n=new Map,r=e.getParameters();for(let e of Oo){let t=r[e.parameter];t&&n.set(t,t.version)}let i=jo(e);return this.materials.set(e,{version:e.version,samplers:n,material:i}),i}getGeometry(e){let t=this.geometries.get(e),n=t!==void 0&&Array.from(t.arrayVersions).every(([e,t])=>e.version===t);if(t?.version===e.version&&n)return t.geometry;let r=e.getParameters();if(t&&n&&Ao(t.parameters,r))return t.version=e.version,t.parameters=r,t.geometry;let i=Ro(e),a=new Map;for(let e of Object.values(r))e instanceof D&&a.set(e,e.version);return this.geometries.set(e,{version:e.version,structuralVersion:Math.max(e.version,(t?.structuralVersion??0)+1),geometry:i,parameters:r,arrayVersions:a}),i}};function Ao(e,t){let n=new Set([...Object.keys(e),...Object.keys(t)]);return n.delete(`morphWeights`),Array.from(n).every(n=>{let r=n;return e[r]===t[r]})}function jo(e){let t=e.getParameters(),n=t.baseColor||t.color||[.8,.8,.8],r=t.opacity??(n.length>3?n[3]??1:1),i=t.alphaMode?t.alphaMode.toUpperCase():r<1?`BLEND`:`OPAQUE`,a={...nt.defaultUniforms,unlit:t.unlit??!1,baseColorFactor:[n[0],n[1],n[2],r],metallicRoughnessValues:[e.subtype===`matte`?0:t.metallic??0,e.subtype===`matte`?.92:t.roughness??.38],normalScale:t.normalScale??1,occlusionStrength:t.occlusionStrength??1,emissiveFactor:t.emissive||[0,0,0],emissiveStrength:t.emissiveStrength??1,alphaCutoffEnabled:i===`MASK`,alphaCutoff:t.alphaCutoff??.5,specularColorFactor:t.specularColor||[1,1,1],specularIntensityFactor:t.specularIntensity??1,ior:t.indexOfRefraction??1.5,transmissionFactor:t.transmission??0,diffuseTransmissionFactor:t.diffuseTransmission??0,diffuseTransmissionColorFactor:t.diffuseTransmissionColor||[1,1,1],dispersion:t.dispersion??0,thicknessFactor:t.thickness??0,attenuationDistance:t.attenuationDistance??1e9,attenuationColor:t.attenuationColor||[1,1,1],multiscatterColorFactor:t.multiscatterColor||[0,0,0],scatterAnisotropy:t.scatterAnisotropy??0,clearcoatFactor:t.clearcoat??0,clearcoatRoughnessFactor:t.clearcoatRoughness??.18,sheenColorFactor:t.sheenColor||[0,0,0],sheenRoughnessFactor:t.sheenRoughness??.5,iridescenceFactor:t.iridescence??0,iridescenceIor:t.iridescenceIndexOfRefraction??1.3,iridescenceThicknessRange:[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400],anisotropyStrength:t.anisotropyStrength??0,anisotropyRotation:t.anisotropyRotation??0,anisotropyDirection:t.anisotropyDirection||[1,0],bumpFactor:t.bumpFactor??1},o={};for(let e of Oo){let n=t[e.parameter];if(!n)continue;let r=n.getParameter(`image`);r&&(o[e.binding]=r,e.enabled&&(a[e.enabled]=!0),a[e.textureCoordinateSet]=n.getParameter(`textureCoordinateSet`)??0,a[e.transform]=n.getParameter(`transform`)||Do)}return{id:e.id,version:e.version,uniforms:a,bindings:o,alphaMode:i===`MASK`?`MASK`:i===`BLEND`?`BLEND`:`OPAQUE`,doubleSided:t.doubleSided??!0}}function Mo(e,t){let n=e.getParameter(`size`);return n?[n[0],n[1]]:t.getDefaultCanvasContext().getDrawingBufferSize()}function No(e,t){let n=[],r=e.getParameters();t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),r.surface instanceof D&&t?.topologyObjectIds.add(r.surface.id),r.instance instanceof D&&(t?.topologyObjectIds.add(r.instance.id),t?.lightObjectIds.add(r.instance.id)),r.light instanceof D&&t?.lightObjectIds.add(r.light.id);for(let e of R(r.light,r.lights))t?.lightObjectIds.add(e.id);let i=new Map;for(let e of R(r.surface,r.surfaces)){t?.topologyObjectIds.add(e.id);let r=i.get(e.id)||0;i.set(e.id,r+1),n.push({surface:e,transform:Eo,instanceId:r===0?e.id:`${e.id}:${r}`})}let a=new Map;for(let e of R(r.instance,r.instances))t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),Po(e,n,t,a);return n}function Po(e,t,n,r){let i=e.getParameters();i.group instanceof D&&(n?.topologyObjectIds.add(i.group.id),n?.lightObjectIds.add(i.group.id));let a=i.group instanceof D?i.group.data:Array.isArray(i.group)?i.group:i.group?[i.group]:[];for(let o of a){if(!(o instanceof de))continue;n?.topologyObjectIds.add(o.id),n?.lightObjectIds.add(o.id);let a=o.getParameters();a.surface instanceof D&&n?.topologyObjectIds.add(a.surface.id),a.light instanceof D&&n?.lightObjectIds.add(a.light.id);for(let e of R(a.light,a.lights))n?.lightObjectIds.add(e.id);for(let s of R(a.surface,a.surfaces)){n?.topologyObjectIds.add(s.id);let a=`${e.id}:${o.id}:${s.id}`,c=r.get(a)||0;r.set(a,c+1),t.push({surface:s,transform:i.transform||Eo,instanceId:c===0?a:`${a}:${c}`,instance:e})}}}function R(e,t){let n=e||t||[];if(n instanceof D){let e=n.data;return ArrayBuffer.isView(e)?[]:e.filter(e=>typeof e==`object`&&!!e&&`type`in e)}return Array.from(n)}function Fo(e,t){let n=[{type:`ambient`,color:[1,1,1],intensity:t}],r=e.getParameters();for(let e of R(r.light,r.lights))Io(e,n);for(let e of R(r.instance,r.instances)){let t=e.getParameter(`group`),r=t instanceof D?t.data:Array.isArray(t)?t:t?[t]:[];for(let e of r){if(!(e instanceof de))continue;let t=e.getParameters();for(let e of R(t.light,t.lights))Io(e,n)}}return n}function Io(e,t){let n=e.getParameters(),r=n.color||[1,1,1];switch(e.subtype){case`ambient`:t.push({type:`ambient`,color:r,intensity:n.radiance??n.intensity??1});break;case`directional`:t.push({type:`directional`,color:r,direction:n.direction||[0,-1,-1],intensity:n.irradiance??n.intensity??1});break;case`point`:t.push({type:`point`,color:r,position:n.position||[0,0,0],intensity:n.intensity??1,attenuation:[1,0,.025]});break;case`spot`:t.push({type:`spot`,color:r,position:n.position||[0,0,0],direction:n.direction||[0,-1,0],intensity:n.intensity??1,attenuation:[1,0,.018],innerConeAngle:n.falloffAngle??(n.openingAngle??.5)*.7,outerConeAngle:n.openingAngle??.5});break}}function Lo(e,t,n){let r=e.getParameters(),i=r.position||[0,0,5],a=r.direction||[0,0,-1],o=[i[0]+a[0],i[1]+a[1],i[2]+a[2]],s=r.aspect||t/Math.max(n,1),c=r.near??.05,l=r.far??500;return{projectionMatrix:e.subtype===`orthographic`?new p().ortho({left:-(r.height??12)*s*.5,right:(r.height??12)*s*.5,bottom:-(r.height??12)*.5,top:(r.height??12)*.5,near:c,far:l}):new p().perspective({fovy:r.fovy??Math.PI/3,aspect:s,near:c,far:l}),viewMatrix:new p().lookAt({eye:i,center:o,up:r.up||[0,1,0]}),position:i}}function Ro(e){let t=e.getParameters(),n=t.segments??32,r;switch(e.subtype){case`sphere`:r=new y({radius:t.radius??1,nlat:n,nlong:n*2});break;case`cylinder`:r=new ee({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,topCap:!0,bottomCap:!0});break;case`cone`:r=new C({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,cap:!0});break;case`quad`:r=new v({type:`x,z`,xlen:t.width??1,zlen:t.height??t.width??1,flipCull:!0});break;case`triangle`:{let e=zo(t[`vertex.position`]),n=zo(t[`vertex.normal`]),i=zo(t[`vertex.tangent`]),a=zo(t[`vertex.joint`]),o=zo(t[`vertex.weight`]),s=zo(t[`vertex.attribute1`]),c=zo(t[`vertex.attribute2`]),l=zo(t[`primitive.index`]);if(!(e instanceof Float32Array))throw Error(`Triangle geometry requires vertex.position`);r=new ae({topology:`triangle-list`,attributes:{POSITION:{size:3,value:e},NORMAL:{size:3,value:n instanceof Float32Array?n:Bo(e)},...i instanceof Float32Array?{TANGENT:{size:4,value:i}}:{},...a instanceof Uint8Array||a instanceof Uint16Array||a instanceof Uint32Array?{JOINTS_0:{size:4,value:a}}:{},...o instanceof Float32Array?{WEIGHTS_0:{size:4,value:o}}:{},TEXCOORD_0:{size:2,value:s instanceof Float32Array?s:new Float32Array(e.length/3*2)},...c instanceof Float32Array?{TEXCOORD_1:{size:2,value:c}}:{}},indices:l instanceof Uint16Array||l instanceof Uint32Array?l:void 0});break}}let i=r.attributes.POSITION?.value,a=i?i.length/3:r.vertexCount,o=zo(t[`vertex.attribute0`]),s=o instanceof Float32Array?o:new Float32Array(a*3).fill(1),c=s.length===a*4?4:3,l=r.attributes.TEXCOORD_0?.value;return new ae({topology:r.topology||`triangle-list`,attributes:{...r.attributes,COLOR_0:{size:c,value:s},TEXCOORD_0:{size:2,value:l instanceof Float32Array?l:new Float32Array(a*2)}},indices:r.indices})}function zo(e){return e instanceof D?e.data:e}function Bo(e){let t=new Float32Array(e.length);for(let n=0;n<e.length;n+=9){let r=e[n+3]-e[n],i=e[n+4]-e[n+1],a=e[n+5]-e[n+2],o=e[n+6]-e[n],s=e[n+7]-e[n+1],c=e[n+8]-e[n+2],l=i*c-a*s,u=a*o-r*c,d=r*s-i*o,f=Math.hypot(l,u,d)||1;for(let e=0;e<3;e++)t[n+e*3]=l/f,t[n+e*3+1]=u/f,t[n+e*3+2]=d/f}return t}var Vo=class{adapter=new ko;renderer;constructor(e){this.renderer=new Ha(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`world`),r=e.getParameter(`camera`),i=e.getParameter(`renderer`);if(!t||!n||!r||!i)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let a=this.adapter.getAnalyticPrimitives(n);return this.renderer.render({...t,primitives:a,cameraProjection:r.subtype,samplesPerPixel:i.getParameter(`samplesPerPixel`),maxBounces:i.getParameter(`maxBounces`),progressive:i.getParameter(`progressive`),shadows:i.getParameter(`shadows`),resolutionScale:i.getParameter(`resolutionScale`),minimumResolutionScale:i.getParameter(`minimumResolutionScale`),adaptiveResolution:i.getParameter(`adaptiveResolution`),targetFrameTimeMilliseconds:i.getParameter(`targetFrameTimeMilliseconds`),temporalReprojection:i.getParameter(`temporalReprojection`),shadowSamplesPerFrame:i.getParameter(`shadowSamplesPerFrame`)})}destroyFrame(e){this.renderer.destroyFrame(e.id)}destroy(){this.renderer.destroy(),this.adapter.destroy()}},Ho=24,Uo={minFilter:`linear`,magFilter:`linear`},Wo={name:`bloomExtract`,source:`
struct bloomExtractUniforms {
  threshold: f32,
  softKnee: f32,
  fireflyReduction: f32,
  exposure: f32,
  exposureCompensation: f32,
};

@group(0) @binding(auto) var<uniform> bloomExtract: bloomExtractUniforms;

fn bloomExtract_applyThreshold(sourceColor: vec4f) -> vec4f {
  let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
  let exposure = max(bloomExtract.exposure * exp2(bloomExtract.exposureCompensation), 0.0001);
  let threshold = bloomExtract.threshold / exposure;
  let knee = max(threshold * bloomExtract.softKnee, 0.00001);
  let soft = clamp((luminance - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  let softContribution = soft * soft * knee;
  let hardContribution = max(luminance - threshold, 0.0);
  let bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4f(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
}

fn bloomExtract_loadColor(sourceTexture: texture_2d<f32>, coordinate: vec2i) -> vec4f {
  let maximumCoordinate = vec2i(textureDimensions(sourceTexture)) - vec2i(1);
  return textureLoad(sourceTexture, clamp(coordinate, vec2i(0), maximumCoordinate), 0);
}

fn bloomExtract_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2i(textureDimensions(sourceTexture));
  let sourceCenter = texCoord * vec2f(sourceDimensions) - vec2f(0.5);
  let sourceFootprint = max(
    (abs(dpdx(texCoord)) + abs(dpdy(texCoord))) * vec2f(sourceDimensions),
    vec2f(1.0)
  );
  let filterRadius = max(sourceFootprint, vec2f(2.0));
  let minimumCoordinate = vec2i(floor(sourceCenter - filterRadius)) + vec2i(1);
  let maximumCoordinate = vec2i(ceil(sourceCenter + filterRadius)) - vec2i(1);
  var color = vec4f(0.0);
  var totalWeight = 0.0;

  // The tent radius follows the actual source-to-target ratio so reduced-resolution pyramids do
  // not leave unsampled bands. At the default half resolution this is the original 4x4 tent.
  for (var sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY += 1) {
    let weightY = max(1.0 - abs(f32(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (var sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX += 1) {
      let weightX = max(1.0 - abs(f32(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      let sourceColor = bloomExtract_loadColor(
        sourceTexture,
        vec2i(sourceX, sourceY)
      );
      let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
      let fireflyWeight = mix(
        1.0,
        1.0 / (1.0 + max(luminance, 0.0)),
        clamp(bloomExtract.fireflyReduction, 0.0, 1.0)
      );
      let weight = weightX * weightY * fireflyWeight;
      color += bloomExtract_applyThreshold(sourceColor) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,fs:`
layout(std140) uniform bloomExtractUniforms {
  float threshold;
  float softKnee;
  float fireflyReduction;
  float exposure;
  float exposureCompensation;
} bloomExtract;

vec4 bloomExtract_applyThreshold(vec4 sourceColor) {
  float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float exposure = max(bloomExtract.exposure * exp2(bloomExtract.exposureCompensation), 0.0001);
  float threshold = bloomExtract.threshold / exposure;
  float knee = max(threshold * bloomExtract.softKnee, 0.00001);
  float soft = clamp((luminance - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  float softContribution = soft * soft * knee;
  float hardContribution = max(luminance - threshold, 0.0);
  float bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
}

vec4 bloomExtract_loadColor(sampler2D sourceTexture, ivec2 coordinate) {
  ivec2 maximumCoordinate = textureSize(sourceTexture, 0) - ivec2(1);
  return texelFetch(sourceTexture, clamp(coordinate, ivec2(0), maximumCoordinate), 0);
}

vec4 bloomExtract_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 sourceDimensions = textureSize(sourceTexture, 0);
  vec2 sourceCenter = texCoord * vec2(sourceDimensions) - vec2(0.5);
  vec2 sourceFootprint = max(
    (abs(dFdx(texCoord)) + abs(dFdy(texCoord))) * vec2(sourceDimensions),
    vec2(1.0)
  );
  vec2 filterRadius = max(sourceFootprint, vec2(2.0));
  ivec2 minimumCoordinate = ivec2(floor(sourceCenter - filterRadius)) + ivec2(1);
  ivec2 maximumCoordinate = ivec2(ceil(sourceCenter + filterRadius)) - ivec2(1);
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  // Keep this kernel identical to the WGSL path so WebGL and WebGPU conserve the same energy.
  for (int sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY++) {
    float weightY = max(1.0 - abs(float(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (int sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX++) {
      float weightX = max(1.0 - abs(float(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      vec4 sourceColor = bloomExtract_loadColor(
        sourceTexture,
        ivec2(sourceX, sourceY)
      );
      float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float fireflyWeight = mix(
        1.0,
        1.0 / (1.0 + max(luminance, 0.0)),
        clamp(bloomExtract.fireflyReduction, 0.0, 1.0)
      );
      float weight = weightX * weightY * fireflyWeight;
      color += bloomExtract_applyThreshold(sourceColor) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,uniformTypes:{threshold:`f32`,softKnee:`f32`,fireflyReduction:`f32`,exposure:`f32`,exposureCompensation:`f32`},defaultUniforms:{threshold:.8,softKnee:.5,fireflyReduction:0,exposure:1,exposureCompensation:0},propTypes:{threshold:{value:.8,min:0,max:1},softKnee:{value:.5,min:0,max:1},fireflyReduction:{value:0,min:0,max:1},exposure:{value:1,min:1e-4,softMax:8},exposureCompensation:{value:0,min:-8,max:8}},passes:[{sampler:!0}]},Go={name:`bloomDownsample`,source:`
fn bloomDownsample_loadColor(sourceTexture: texture_2d<f32>, coordinate: vec2i) -> vec4f {
  let maximumCoordinate = vec2i(textureDimensions(sourceTexture)) - vec2i(1);
  return textureLoad(sourceTexture, clamp(coordinate, vec2i(0), maximumCoordinate), 0);
}

fn bloomDownsample_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2i(textureDimensions(sourceTexture));
  let sourceCenter = texCoord * vec2f(sourceDimensions) - vec2f(0.5);
  let sourceFootprint = max(
    (abs(dpdx(texCoord)) + abs(dpdy(texCoord))) * vec2f(sourceDimensions),
    vec2f(1.0)
  );
  let filterRadius = max(sourceFootprint, vec2f(2.0));
  let minimumCoordinate = vec2i(floor(sourceCenter - filterRadius)) + vec2i(1);
  let maximumCoordinate = vec2i(ceil(sourceCenter + filterRadius)) - vec2i(1);
  var color = vec4f(0.0);
  var totalWeight = 0.0;

  for (var sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY += 1) {
    let weightY = max(1.0 - abs(f32(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (var sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX += 1) {
      let weightX = max(1.0 - abs(f32(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      let weight = weightX * weightY;
      color += bloomDownsample_loadColor(
        sourceTexture,
        vec2i(sourceX, sourceY)
      ) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,fs:`
vec4 bloomDownsample_loadColor(sampler2D sourceTexture, ivec2 coordinate) {
  ivec2 maximumCoordinate = textureSize(sourceTexture, 0) - ivec2(1);
  return texelFetch(sourceTexture, clamp(coordinate, ivec2(0), maximumCoordinate), 0);
}

vec4 bloomDownsample_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 sourceDimensions = textureSize(sourceTexture, 0);
  vec2 sourceCenter = texCoord * vec2(sourceDimensions) - vec2(0.5);
  vec2 sourceFootprint = max(
    (abs(dFdx(texCoord)) + abs(dFdy(texCoord))) * vec2(sourceDimensions),
    vec2(1.0)
  );
  vec2 filterRadius = max(sourceFootprint, vec2(2.0));
  ivec2 minimumCoordinate = ivec2(floor(sourceCenter - filterRadius)) + ivec2(1);
  ivec2 maximumCoordinate = ivec2(ceil(sourceCenter + filterRadius)) - ivec2(1);
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  for (int sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY++) {
    float weightY = max(1.0 - abs(float(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (int sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX++) {
      float weightX = max(1.0 - abs(float(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      float weight = weightX * weightY;
      color += bloomDownsample_loadColor(
        sourceTexture,
        ivec2(sourceX, sourceY)
      ) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,passes:[{sampler:!0}]},Ko={name:`bloomBlur`,source:`
const BLOOM_BLUR_MAX_RADIUS = ${Ho}.0;
const BLOOM_BLUR_MAX_PAIRS = ${Math.ceil(Ho/2)};

struct bloomBlurUniforms {
  radius: f32,
  delta: vec2f,
};

@group(0) @binding(auto) var<uniform> bloomBlur: bloomBlurUniforms;

fn bloomBlur_applySample(color: vec4f) -> vec4f {
  return color;
}

fn bloomBlur_getEffectiveRadius() -> f32 {
  return clamp(bloomBlur.radius, 0.0, BLOOM_BLUR_MAX_RADIUS);
}

fn bloomBlur_getSigma(radius: f32) -> f32 {
  return max(radius / 3.0, 0.00001);
}

fn bloomBlur_getWeight(offset: f32, sigma: f32) -> f32 {
  let normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

fn bloomBlur_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let effectiveRadius = bloomBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return textureSample(sourceTexture, sourceTextureSampler, texCoord);
  }

  let adjustedDelta = bloomBlur.delta / texSize;
  let sigma = bloomBlur_getSigma(effectiveRadius);
  let centerWeight = bloomBlur_getWeight(0.0, sigma);

  var color = vec4f(0.0);
  var totalWeight = centerWeight;

  let centerColor = bloomBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord)
  );
  color += centerColor * centerWeight;

  for (var pairIndex = 0; pairIndex < BLOOM_BLUR_MAX_PAIRS; pairIndex += 1) {
    let firstOffset = f32(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    let secondOffset = firstOffset + 1.0;
    let firstWeight = bloomBlur_getWeight(firstOffset, sigma);
    let secondWeight =
      select(0.0, bloomBlur_getWeight(secondOffset, sigma), secondOffset <= effectiveRadius);
    let combinedWeight = firstWeight + secondWeight;
    let combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    let positiveColor = bloomBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord + adjustedDelta * combinedOffset)
    );
    let negativeColor = bloomBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord - adjustedDelta * combinedOffset)
    );

    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  return color / totalWeight;
}
`,fs:`
#define BLOOM_BLUR_MAX_RADIUS ${Ho}.0
#define BLOOM_BLUR_MAX_PAIRS ${Math.ceil(Ho/2)}

layout(std140) uniform bloomBlurUniforms {
  float radius;
  vec2 delta;
} bloomBlur;

vec4 bloomBlur_applySample(vec4 color) {
  return color;
}

float bloomBlur_getEffectiveRadius() {
  return clamp(bloomBlur.radius, 0.0, BLOOM_BLUR_MAX_RADIUS);
}

float bloomBlur_getSigma(float radius) {
  return max(radius / 3.0, 0.00001);
}

float bloomBlur_getWeight(float offset, float sigma) {
  float normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

vec4 bloomBlur_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  float effectiveRadius = bloomBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return texture(sourceTexture, texCoord);
  }

  vec2 adjustedDelta = bloomBlur.delta / texSize;
  float sigma = bloomBlur_getSigma(effectiveRadius);
  float centerWeight = bloomBlur_getWeight(0.0, sigma);

  vec4 color = vec4(0.0);
  float totalWeight = centerWeight;

  vec4 centerColor = bloomBlur_applySample(texture(sourceTexture, texCoord));
  color += centerColor * centerWeight;

  for (int pairIndex = 0; pairIndex < BLOOM_BLUR_MAX_PAIRS; pairIndex++) {
    float firstOffset = float(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    float secondOffset = firstOffset + 1.0;
    float firstWeight = bloomBlur_getWeight(firstOffset, sigma);
    float secondWeight = secondOffset <= effectiveRadius ? bloomBlur_getWeight(secondOffset, sigma) : 0.0;
    float combinedWeight = firstWeight + secondWeight;
    float combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    vec4 positiveColor = bloomBlur_applySample(texture(sourceTexture, texCoord + adjustedDelta * combinedOffset));
    vec4 negativeColor = bloomBlur_applySample(texture(sourceTexture, texCoord - adjustedDelta * combinedOffset));
    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  color /= totalWeight;
  return color;
}
`,uniformTypes:{radius:`f32`,delta:`vec2<f32>`},propTypes:{radius:{value:8,min:0,max:Ho,softMax:Ho},delta:{value:[1,0],private:!0}},passes:[{sampler:!0}]},qo={name:`bloomShaderPassPipeline`,renderTargets:{extractHalf:{scale:[.5,.5],sampler:Uo},blurHalfScratch:{scale:[.5,.5],sampler:Uo},blurHalf:{scale:[.5,.5],sampler:Uo},extractQuarter:{scale:[.25,.25],sampler:Uo},blurQuarterScratch:{scale:[.25,.25],sampler:Uo},blurQuarter:{scale:[.25,.25],sampler:Uo},extractEighth:{scale:[.125,.125],sampler:Uo},blurEighthScratch:{scale:[.125,.125],sampler:Uo},blurEighth:{scale:[.125,.125],sampler:Uo}},steps:[{shaderPass:Wo,inputs:{sourceTexture:`previous`},output:`extractHalf`,uniforms:{threshold:.8}},{shaderPass:Ko,inputs:{sourceTexture:`extractHalf`},output:`blurHalfScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:Ko,inputs:{sourceTexture:`blurHalfScratch`},output:`blurHalf`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:Go,inputs:{sourceTexture:`extractHalf`},output:`extractQuarter`},{shaderPass:Ko,inputs:{sourceTexture:`extractQuarter`},output:`blurQuarterScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:Ko,inputs:{sourceTexture:`blurQuarterScratch`},output:`blurQuarter`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:Go,inputs:{sourceTexture:`extractQuarter`},output:`extractEighth`},{shaderPass:Ko,inputs:{sourceTexture:`extractEighth`},output:`blurEighthScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:Ko,inputs:{sourceTexture:`blurEighthScratch`},output:`blurEighth`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:{name:`bloomComposite`,source:`
struct bloomCompositeUniforms {
  intensity: f32,
};

@group(0) @binding(auto) var<uniform> bloomComposite: bloomCompositeUniforms;
@group(0) @binding(auto) var glowHalf: texture_2d<f32>;
@group(0) @binding(auto) var glowHalfSampler: sampler;
@group(0) @binding(auto) var glowQuarter: texture_2d<f32>;
@group(0) @binding(auto) var glowQuarterSampler: sampler;
@group(0) @binding(auto) var glowEighth: texture_2d<f32>;
@group(0) @binding(auto) var glowEighthSampler: sampler;

fn bloomComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let halfGlow = textureSample(glowHalf, glowHalfSampler, texCoord).rgb;
  let quarterGlow = textureSample(glowQuarter, glowQuarterSampler, texCoord).rgb;
  let eighthGlow = textureSample(glowEighth, glowEighthSampler, texCoord).rgb;
  let glowColor = halfGlow * 0.50 + quarterGlow * 0.32 + eighthGlow * 0.18;
  return vec4f(sourceColor.rgb + glowColor * bloomComposite.intensity, sourceColor.a);
}
`,fs:`
layout(std140) uniform bloomCompositeUniforms {
  float intensity;
} bloomComposite;

uniform sampler2D glowHalf;
uniform sampler2D glowQuarter;
uniform sampler2D glowEighth;

vec4 bloomComposite_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec3 halfGlow = texture(glowHalf, texCoord).rgb;
  vec3 quarterGlow = texture(glowQuarter, texCoord).rgb;
  vec3 eighthGlow = texture(glowEighth, texCoord).rgb;
  vec3 glowColor = halfGlow * 0.50 + quarterGlow * 0.32 + eighthGlow * 0.18;
  return vec4(sourceColor.rgb + glowColor * bloomComposite.intensity, sourceColor.a);
}
`,bindingLayout:[{name:`glowHalf`,group:0},{name:`glowQuarter`,group:0},{name:`glowEighth`,group:0}],uniforms:{},bindings:{},uniformTypes:{intensity:`f32`},propTypes:{intensity:{value:1,min:0,softMax:3}},passes:[{sampler:!0}]},inputs:{sourceTexture:`previous`,glowHalf:`blurHalf`,glowQuarter:`blurQuarter`,glowEighth:`blurEighth`},output:`previous`,uniforms:{intensity:1}}]},Jo={name:`advancedCopy`,source:`fn advancedCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { return textureSample(sourceTexture, sourceTextureSampler, texCoord); }`,passes:[{sampler:!0}]},Yo=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Xo={name:`cameraReprojectionTaaResolve`,source:`const CAMERA_REPROJECTION_TAA_EPSILON: f32 = 0.00001;

struct CameraReprojectionTaaResolveUniforms {
  inverseViewProjectionMatrix: mat4x4f,
  previousViewProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
  currentJitter: vec2f,
  previousJitter: vec2f,
};

@group(0) @binding(auto) var<uniform> cameraReprojectionTaaResolve:
  CameraReprojectionTaaResolveUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;

fn cameraReprojectionTaaResolve_previousFrameCoordinate(
  texCoord: vec2f,
  depth: f32
) -> vec4f {
  let unjitteredCoordinate = texCoord - cameraReprojectionTaaResolve.currentJitter;
  if (any(unjitteredCoordinate < vec2f(0.0)) ||
      any(unjitteredCoordinate > vec2f(1.0))) {
    return vec4f(0.0);
  }

  let currentClip = vec4f(
    unjitteredCoordinate.x * 2.0 - 1.0,
    1.0 - unjitteredCoordinate.y * 2.0,
    depth,
    1.0
  );
  let worldPositionHomogeneous =
    cameraReprojectionTaaResolve.inverseViewProjectionMatrix * currentClip;
  if (abs(worldPositionHomogeneous.w) <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return vec4f(0.0);
  }

  let worldPosition = worldPositionHomogeneous.xyz / worldPositionHomogeneous.w;
  let previousClip =
    cameraReprojectionTaaResolve.previousViewProjectionMatrix * vec4f(worldPosition, 1.0);
  if (previousClip.w <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return vec4f(0.0);
  }

  let previousNormalizedDeviceCoordinate = previousClip.xyz / previousClip.w;
  let previousCoordinate =
    previousNormalizedDeviceCoordinate.xy * vec2f(0.5, -0.5) +
    vec2f(0.5) +
    cameraReprojectionTaaResolve.previousJitter;
  let expectedPreviousDepth = previousNormalizedDeviceCoordinate.z;
  let validCoordinate = all(previousCoordinate >= vec2f(0.0)) &&
    all(previousCoordinate <= vec2f(1.0));
  let validDepthRange = expectedPreviousDepth >= 0.0 && expectedPreviousDepth <= 1.0;
  return vec4f(
    previousCoordinate,
    expectedPreviousDepth,
    select(0.0, 1.0, validCoordinate && validDepthRange)
  );
}

fn cameraReprojectionTaaResolve_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let currentColor = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (currentDepth >= 0.99999) {
    return currentColor;
  }

  let previousFrame = cameraReprojectionTaaResolve_previousFrameCoordinate(
    texCoord,
    currentDepth
  );
  if (previousFrame.w < 0.5) {
    return currentColor;
  }

  let sourceTexel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimumColor = currentColor.rgb;
  var maximumColor = currentColor.rgb;
  for (var sampleY: i32 = -1; sampleY <= 1; sampleY++) {
    for (var sampleX: i32 = -1; sampleX <= 1; sampleX++) {
      let sampleCoordinate = clamp(
        texCoord + vec2f(f32(sampleX), f32(sampleY)) * sourceTexel,
        vec2f(0.0),
        vec2f(1.0)
      );
      let sampleColor = textureSampleLevel(
        sourceTexture,
        sourceTextureSampler,
        sampleCoordinate,
        0
      ).rgb;
      minimumColor = min(minimumColor, sampleColor);
      maximumColor = max(maximumColor, sampleColor);
    }
  }

  let historyDimensions = textureDimensions(historyTexture);
  let historyPosition = previousFrame.xy * vec2f(historyDimensions) - vec2f(0.5);
  let baseHistoryCoordinate = vec2i(floor(historyPosition));
  let historyFraction = fract(historyPosition);
  var accumulatedHistoryColor = vec3f(0.0);
  var accumulatedHistoryWeight = 0.0;
  for (var tapY: i32 = 0; tapY <= 1; tapY++) {
    for (var tapX: i32 = 0; tapX <= 1; tapX++) {
      let historyCoordinate = clamp(
        baseHistoryCoordinate + vec2i(tapX, tapY),
        vec2i(0),
        vec2i(historyDimensions) - vec2i(1)
      );
      let tapDepth = textureLoad(previousDepthTexture, historyCoordinate, 0).r;
      let validTapDepth =
        abs(tapDepth - previousFrame.z) <= cameraReprojectionTaaResolve.depthThreshold;
      let horizontalWeight = select(1.0 - historyFraction.x, historyFraction.x, tapX == 1);
      let verticalWeight = select(1.0 - historyFraction.y, historyFraction.y, tapY == 1);
      let tapWeight = select(0.0, horizontalWeight * verticalWeight, validTapDepth);
      accumulatedHistoryColor += textureLoad(historyTexture, historyCoordinate, 0).rgb *
        tapWeight;
      accumulatedHistoryWeight += tapWeight;
    }
  }

  if (accumulatedHistoryWeight <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return currentColor;
  }

  let historyColor = accumulatedHistoryColor / accumulatedHistoryWeight;
  let clampedHistoryColor = clamp(historyColor, minimumColor, maximumColor);
  let resolvedColor = mix(
    currentColor.rgb,
    clampedHistoryColor,
    cameraReprojectionTaaResolve.historyWeight
  );
  return vec4f(resolvedColor, currentColor.a);
}`,bindingLayout:[{name:`historyTexture`,group:0},{name:`depthTexture`,group:0},{name:`previousDepthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseViewProjectionMatrix:`mat4x4<f32>`,previousViewProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`,currentJitter:`vec2<f32>`,previousJitter:`vec2<f32>`},propTypes:{inverseViewProjectionMatrix:{value:Yo,private:!0},previousViewProjectionMatrix:{value:Yo,private:!0},historyWeight:{value:.9,min:0,max:.98},depthThreshold:{value:.0025,min:1e-5,softMax:.05},currentJitter:{value:[0,0],private:!0},previousJitter:{value:[0,0],private:!0}},passes:[{sampler:!0}]},Zo={name:`cameraReprojectionTaaDepthHistoryCopy`,source:`@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn cameraReprojectionTaaDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]};function Qo(){return{name:`cameraReprojectionTaaShaderPassPipeline`,renderTargets:{cameraReprojectionTaaHistoryColor:{format:`rgba16float`,lifetime:`history`,initialize:`original`},cameraReprojectionTaaHistoryDepth:{format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[1,0,0,1]}}},steps:[{shaderPass:Xo,inputs:{sourceTexture:`previous`,historyTexture:`cameraReprojectionTaaHistoryColor`,previousDepthTexture:`cameraReprojectionTaaHistoryDepth`},output:`cameraReprojectionTaaHistoryColor`},{shaderPass:Jo,inputs:{sourceTexture:`cameraReprojectionTaaHistoryColor`},output:`previous`},{shaderPass:Zo,inputs:{sourceTexture:`previous`},output:`cameraReprojectionTaaHistoryDepth`}]}}var $o=8,es=.5,ts=class{device;adapter=new ko;renderer;frames=new Map;constructor(e,{deferred:t=!1}={}){this.device=e,this.renderer=t?new fn(e):new _t(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`renderer`);if(!t||!n)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let r=t.renderMode===`default`?n.getParameter(`bloomIntensity`)??0:0,i=this.device.type===`webgpu`&&t.renderMode===`default`&&(n.getParameter(`temporalAntialiasing`)??!0),a=i||r>0?this.getFrameResources(e):null,o=!1,s=null;if(a){let n=this.getFramebuffer(e,a,i);t.framebuffer=n.framebuffer,o=n.resized}i&&a?(s=is(t,a.temporalAntialiasingState,o),t.camera={...t.camera,projectionMatrix:s.jitteredProjectionMatrix}):a&&rs(a.temporalAntialiasingState);let c=this.renderer.render(t);if(!a||!t.framebuffer)return c;let l=t.framebuffer.colorAttachments[0].texture;if(s){let t=this.getTemporalAntialiasingRenderer(a),[n,i]=Mo(e,this.device);t.resize([n,i]);let o=this.getTemporalAntialiasingDepthTexture(e.id,a),c={sourceTexture:l,bindings:{depthTexture:o},uniforms:{cameraReprojectionTaaResolve:{inverseViewProjectionMatrix:new p(s.currentViewProjectionMatrix).invert(),previousViewProjectionMatrix:s.previousViewProjectionMatrix,currentJitter:s.currentJitter,previousJitter:s.previousJitter}},resetHistory:s.resetHistory};if(r>0){let e=t.renderToTexture(c);e&&(l=e)}else t.renderToScreen(c);as(a.temporalAntialiasingState,s)}if(r>0){let t=this.getBloomRenderer(a);t.resize(Mo(e,this.device)),t.renderToScreen({sourceTexture:l,uniforms:{bloomExtract:{threshold:n.getParameter(`bloomThreshold`)??.62},bloomBlur:{radius:n.getParameter(`bloomRadius`)??7},bloomComposite:{intensity:r}}})}return c}destroyFrame(e){this.renderer.destroyFrame(e.id);let t=this.frames.get(e);t&&(t.framebuffer?.destroy(),t.colorTexture?.destroy(),t.depthTexture?.destroy(),t.bloomRenderer?.destroy(),t.temporalAntialiasingRenderer?.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e);this.renderer.destroy(),this.adapter.destroy()}getFrameResources(e){let t=this.frames.get(e);return t||(t={framebuffer:null,colorTexture:null,depthTexture:null,bloomRenderer:null,temporalAntialiasingRenderer:null,temporalAntialiasingState:ns()},this.frames.set(e,t)),t}getFramebuffer(e,t,n){let[r,i]=Mo(e,this.device),a=this.device.preferredColorFormat,s=t.framebuffer&&(t.framebuffer.width!==r||t.framebuffer.height!==i||t.colorTexture?.format!==a||!!t.depthTexture!==n);return s&&fs(t),t.framebuffer||=(t.colorTexture=this.device.createTexture({id:`anari-${e.id}-color-texture`,width:r,height:i,format:a,usage:o.RENDER_ATTACHMENT|o.SAMPLE}),t.depthTexture=n?this.device.createTexture({id:`anari-${e.id}-depth-texture`,width:r,height:i,format:`depth24plus`,usage:o.RENDER_ATTACHMENT|o.SAMPLE,sampler:{minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}):null,this.device.createFramebuffer({id:`anari-${e.id}-color`,width:r,height:i,colorAttachments:[t.colorTexture],depthStencilAttachment:t.depthTexture||`depth24plus`})),{framebuffer:t.framebuffer,resized:!!s}}getTemporalAntialiasingDepthTexture(e,t){if(this.renderer instanceof fn){let t=this.renderer.getLastDepthTexture(e);if(t)return t}if(!t.depthTexture)throw Error(`ANARI temporal antialiasing requires a sampleable scene depth texture.`);return t.depthTexture}getBloomRenderer(e){return e.bloomRenderer||=new ne(this.device,{shaderPasses:[qo]}),e.bloomRenderer}getTemporalAntialiasingRenderer(e){return e.temporalAntialiasingRenderer||=new ne(this.device,{shaderPasses:[Qo()],colorFormat:`rgba16float`}),e.temporalAntialiasingRenderer}};function ns(){return{frameIndex:0,previousViewProjectionMatrix:null,previousViewMatrix:null,previousProjectionMatrix:null,previousJitter:[0,0],topologySignature:null}}function rs(e){e.frameIndex=0,e.previousViewProjectionMatrix=null,e.previousViewMatrix=null,e.previousProjectionMatrix=null,e.previousJitter=[0,0],e.topologySignature=null}function is(e,t,n){let r=new p(e.camera.viewMatrix),i=new p(e.camera.projectionMatrix),a=new p(i).multiplyRight(r),o=cs(e),s=n||!t.previousViewProjectionMatrix||t.topologySignature!==o||os(t,r,i),c=s?0:t.frameIndex,l=ls(c,e.width||1,e.height||1);return{currentViewMatrix:r,currentProjectionMatrix:i,currentViewProjectionMatrix:a,previousViewProjectionMatrix:s?a:t.previousViewProjectionMatrix,jitteredProjectionMatrix:us(i,l),currentJitter:l,previousJitter:s?l:t.previousJitter,topologySignature:o,resetHistory:s,nextFrameIndex:(c+1)%$o}}function as(e,t){e.frameIndex=t.nextFrameIndex,e.previousViewProjectionMatrix=t.currentViewProjectionMatrix,e.previousViewMatrix=t.currentViewMatrix,e.previousProjectionMatrix=t.currentProjectionMatrix,e.previousJitter=t.currentJitter,e.topologySignature=t.topologySignature}function os(e,t,n){return e.previousViewMatrix!==null&&ss(e.previousViewMatrix,t)>es||e.previousProjectionMatrix!==null&&ss(e.previousProjectionMatrix,n)>es}function ss(e,t){let n=0;for(let r=0;r<16;r++)n=Math.max(n,Math.abs((e[r]||0)-(t[r]||0)));return n}function cs(e){return e.surfaces.map(e=>`${e.id}:${e.geometryVersion??0}:${e.material.id}:${e.material.version??0}:${e.transforms.length}:${e.instanceIds?.join(`,`)||``}`).sort().join(`|`)}function ls(e,t,n){let r=e%$o+1;return[(ds(r,2)-.5)/Math.max(t,1),(ds(r,3)-.5)/Math.max(n,1)]}function us(e,t){let n=new p(e),r=t[0]*2,i=t[1]*-2;for(let e=0;e<4;e++){let t=e*4,a=n[t+3];n[t]+=r*a,n[t+1]+=i*a}return n}function ds(e,t){let n=0,r=1,i=e;for(;i>0;)r/=t,n+=i%t*r,i=Math.floor(i/t);return n}function fs(e){e.framebuffer?.destroy(),e.colorTexture?.destroy(),e.depthTexture?.destroy(),e.framebuffer=null,e.colorTexture=null,e.depthTexture=null}var ps={array:[`array1D`],camera:[`perspective`,`orthographic`],frame:[`default`],geometry:[`triangle`,`sphere`,`cylinder`,`cone`,`quad`],group:[`default`],instance:[`transform`],light:[`ambient`,`directional`,`point`,`spot`],material:[`matte`,`physicallyBased`],sampler:[`image2D`],surface:[`default`],world:[`default`]},ms=[`KHR_CAMERA_PERSPECTIVE`,`KHR_CAMERA_ORTHOGRAPHIC`,`KHR_GEOMETRY_TRIANGLE`,`KHR_GEOMETRY_SPHERE`,`KHR_GEOMETRY_CYLINDER`,`KHR_GEOMETRY_CONE`,`KHR_GEOMETRY_QUAD`,`KHR_INSTANCE_TRANSFORM`,`KHR_LIGHT_DIRECTIONAL`,`KHR_LIGHT_POINT`,`KHR_LIGHT_SPOT`,`KHR_MATERIAL_MATTE`,`KHR_MATERIAL_PHYSICALLY_BASED`,`KHR_SAMPLER_IMAGE2D`],hs=256,gs=class{device;extensions=ms;rendererRuntimeFactories=new Map;renderingRuntimes=new Map;sceneCommits=[];sceneCommitRevision=0;constructor(e){this.device=e;let t=e=>new ts(e);this.registerRenderer(`default`,t),this.registerRenderer(`deferred`,e=>new ts(e,{deferred:!0})),this.registerRenderer(`debugNormals`,t),this.registerRenderer(`debugDepth`,t),this.registerRenderer(`raytrace`,e=>new Vo(e))}newArray(e){return new D(this,e)}newGeometry(e,t={}){return new se(this,e,t)}newMaterial(e,t={}){return new ce(this,e,t)}newSampler(e,t){return new le(this,e,t)}newSurface(e){return new ue(this,e)}newGroup(e={}){return new de(this,e)}newInstance(e){return new fe(this,e)}newWorld(e={}){return new pe(this,e)}newLight(e,t={}){return new me(this,e,t)}newCamera(e,t={}){return new he(this,e,t)}newRenderer(e=`default`,t={}){return new ge(this,e,t)}registerRenderer(e,t){let n=this.rendererRuntimeFactories.get(e);return this.rendererRuntimeFactories.set(e,t),n&&n!==t&&!Array.from(this.rendererRuntimeFactories.values()).includes(n)&&(this.renderingRuntimes.get(n)?.destroy(),this.renderingRuntimes.delete(n)),this}newFrame(e){return new _e(this,e)}getObjectSubtypes(e){return e===`renderer`?Array.from(this.rendererRuntimeFactories.keys()):ps[e]}getObjectInfo(e){return{type:e,subtypes:this.getObjectSubtypes(e),extensions:this.extensions}}getSceneCommitRevision(){return this.sceneCommitRevision}getSceneCommitsSince(e){return e===this.sceneCommitRevision?[]:this.sceneCommits.length===0||e<this.sceneCommits[0].revision-1?null:this.sceneCommits.filter(t=>t.revision>e)}recordSceneObjectCommit(e,t,n=!1){let r;switch(e){case`world`:case`group`:case`array`:r=[`topology`,`lights`];break;case`geometry`:case`surface`:r=[`topology`];break;case`instance`:r=n?[`topology`,`lights`]:[`transforms`];break;case`material`:case`sampler`:r=[`materials`];break;case`light`:r=[`lights`];break;default:return}this.sceneCommitRevision++,this.sceneCommits.push({revision:this.sceneCommitRevision,objectId:t,categories:r}),this.sceneCommits.length>hs&&this.sceneCommits.shift()}renderFrame(e){let t=e.getParameter(`renderer`)?.subtype??`default`,n=this.rendererRuntimeFactories.get(t);if(!n)throw Error(`ANARI renderer "${t}" is not registered.`);let r=this.renderingRuntimes.get(n);return r||(r=n(this.device),this.renderingRuntimes.set(n,r)),r.render(e)}destroyFrame(e){for(let t of this.renderingRuntimes.values())t.destroyFrame(e)}destroy(){for(let e of this.renderingRuntimes.values())e.destroy();this.renderingRuntimes.clear(),this.sceneCommits.length=0}},z=function(e){return e[e.POINTS=0]=`POINTS`,e[e.LINES=1]=`LINES`,e[e.LINE_LOOP=2]=`LINE_LOOP`,e[e.LINE_STRIP=3]=`LINE_STRIP`,e[e.TRIANGLES=4]=`TRIANGLES`,e[e.TRIANGLE_STRIP=5]=`TRIANGLE_STRIP`,e[e.TRIANGLE_FAN=6]=`TRIANGLE_FAN`,e[e.ONE=1]=`ONE`,e[e.SRC_ALPHA=770]=`SRC_ALPHA`,e[e.ONE_MINUS_SRC_ALPHA=771]=`ONE_MINUS_SRC_ALPHA`,e[e.FUNC_ADD=32774]=`FUNC_ADD`,e[e.LINEAR=9729]=`LINEAR`,e[e.NEAREST=9728]=`NEAREST`,e[e.NEAREST_MIPMAP_NEAREST=9984]=`NEAREST_MIPMAP_NEAREST`,e[e.LINEAR_MIPMAP_NEAREST=9985]=`LINEAR_MIPMAP_NEAREST`,e[e.NEAREST_MIPMAP_LINEAR=9986]=`NEAREST_MIPMAP_LINEAR`,e[e.LINEAR_MIPMAP_LINEAR=9987]=`LINEAR_MIPMAP_LINEAR`,e[e.TEXTURE_MAG_FILTER=10240]=`TEXTURE_MAG_FILTER`,e[e.TEXTURE_MIN_FILTER=10241]=`TEXTURE_MIN_FILTER`,e[e.TEXTURE_WRAP_S=10242]=`TEXTURE_WRAP_S`,e[e.TEXTURE_WRAP_T=10243]=`TEXTURE_WRAP_T`,e[e.REPEAT=10497]=`REPEAT`,e[e.CLAMP_TO_EDGE=33071]=`CLAMP_TO_EDGE`,e[e.MIRRORED_REPEAT=33648]=`MIRRORED_REPEAT`,e[e.UNPACK_FLIP_Y_WEBGL=37440]=`UNPACK_FLIP_Y_WEBGL`,e}({}),_s=[B(`baseColor`,`pbr_baseColorSampler`,`baseColorTexture`,[`pbrMetallicRoughness`,`baseColorTexture`]),B(`metallicRoughness`,`pbr_metallicRoughnessSampler`,`metallicRoughnessTexture`,[`pbrMetallicRoughness`,`metallicRoughnessTexture`]),B(`normal`,`pbr_normalSampler`,`normalTexture`,[`normalTexture`]),B(`occlusion`,`pbr_occlusionSampler`,`occlusionTexture`,[`occlusionTexture`]),B(`emissive`,`pbr_emissiveSampler`,`emissiveTexture`,[`emissiveTexture`]),B(`specularColor`,`pbr_specularColorSampler`,`KHR_materials_specular.specularColorTexture`,[`extensions`,`KHR_materials_specular`,`specularColorTexture`]),B(`specularIntensity`,`pbr_specularIntensitySampler`,`KHR_materials_specular.specularTexture`,[`extensions`,`KHR_materials_specular`,`specularTexture`]),B(`transmission`,`pbr_transmissionSampler`,`KHR_materials_transmission.transmissionTexture`,[`extensions`,`KHR_materials_transmission`,`transmissionTexture`]),B(`thickness`,`pbr_thicknessSampler`,`KHR_materials_volume.thicknessTexture`,[`extensions`,`KHR_materials_volume`,`thicknessTexture`]),B(`clearcoat`,`pbr_clearcoatSampler`,`KHR_materials_clearcoat.clearcoatTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatTexture`]),B(`clearcoatRoughness`,`pbr_clearcoatRoughnessSampler`,`KHR_materials_clearcoat.clearcoatRoughnessTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatRoughnessTexture`]),B(`clearcoatNormal`,`pbr_clearcoatNormalSampler`,`KHR_materials_clearcoat.clearcoatNormalTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatNormalTexture`]),B(`sheenColor`,`pbr_sheenColorSampler`,`KHR_materials_sheen.sheenColorTexture`,[`extensions`,`KHR_materials_sheen`,`sheenColorTexture`]),B(`sheenRoughness`,`pbr_sheenRoughnessSampler`,`KHR_materials_sheen.sheenRoughnessTexture`,[`extensions`,`KHR_materials_sheen`,`sheenRoughnessTexture`]),B(`iridescence`,`pbr_iridescenceSampler`,`KHR_materials_iridescence.iridescenceTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceTexture`]),B(`iridescenceThickness`,`pbr_iridescenceThicknessSampler`,`KHR_materials_iridescence.iridescenceThicknessTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceThicknessTexture`]),B(`anisotropy`,`pbr_anisotropySampler`,`KHR_materials_anisotropy.anisotropyTexture`,[`extensions`,`KHR_materials_anisotropy`,`anisotropyTexture`]),B(`bump`,`pbr_bumpSampler`,`EXT_materials_bump.bumpTexture`,[`extensions`,`EXT_materials_bump`,`bumpTexture`]),B(`diffuseTransmission`,`pbr_diffuseTransmissionSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionTexture`]),B(`diffuseTransmissionColor`,`pbr_diffuseTransmissionColorSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionColorTexture`]),B(`multiscatterColor`,`pbr_multiscatterColorSampler`,`KHR_materials_volume_scatter.multiscatterColorTexture`,[`extensions`,`KHR_materials_volume_scatter`,`multiscatterColorTexture`])];new Map(_s.map(e=>[e.slot,e]));function B(e,t,n,r){return{slot:e,binding:t,displayName:n,pathSegments:r,colorSpace:e===`baseColor`||e===`emissive`||e===`specularColor`||e===`sheenColor`||e===`diffuseTransmissionColor`||e===`multiscatterColor`?`srgb`:`linear`,uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function vs(){return _s}function ys(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function bs(e){return e?.extensions?.KHR_texture_transform?.texCoord??e?.texCoord??0}function xs(e){return _s.find(t=>t.pathSegments.length===e.length&&t.pathSegments.every((t,n)=>e[n]===t))||null}function Ss(e){let t=new Oe().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),n=new Oe().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),r=new Oe().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(n).multiplyRight(r))}function Cs(e={}){let t=e.wrapS??e.parameters?.[z.TEXTURE_WRAP_S],n=e.wrapT??e.parameters?.[z.TEXTURE_WRAP_T],r=e.magFilter??e.parameters?.[z.TEXTURE_MAG_FILTER],i=e.minFilter??e.parameters?.[z.TEXTURE_MIN_FILTER],a=Ts(t),o=Ts(n),s=ks(r);return{...a?{addressModeU:a}:{},...o?{addressModeV:o}:{},...s?{magFilter:s}:{},...As(i)}}function ws(e){let t=Es(e.addressModeU),n=Es(e.addressModeV),r=Ds(e.magFilter),i=Os(e.minFilter,e.mipmapFilter);return{...t===void 0?{}:{wrapS:t},...n===void 0?{}:{wrapT:n},...r===void 0?{}:{magFilter:r},...i===void 0?{}:{minFilter:i}}}function Ts(e){switch(e){case z.CLAMP_TO_EDGE:return`clamp-to-edge`;case z.REPEAT:return`repeat`;case z.MIRRORED_REPEAT:return`mirror-repeat`;default:return}}function Es(e){switch(e){case`clamp-to-edge`:return z.CLAMP_TO_EDGE;case`repeat`:return z.REPEAT;case`mirror-repeat`:return z.MIRRORED_REPEAT;default:return}}function Ds(e){switch(e){case`nearest`:return z.NEAREST;case`linear`:return z.LINEAR;default:return}}function Os(e,t){if(e)return t===`nearest`?e===`nearest`?z.NEAREST_MIPMAP_NEAREST:z.LINEAR_MIPMAP_NEAREST:t===`linear`?e===`nearest`?z.NEAREST_MIPMAP_LINEAR:z.LINEAR_MIPMAP_LINEAR:e===`nearest`?z.NEAREST:z.LINEAR}function ks(e){switch(e){case z.NEAREST:return`nearest`;case z.LINEAR:return`linear`;default:return}}function As(e){switch(e){case z.NEAREST:return{minFilter:`nearest`};case z.LINEAR:return{minFilter:`linear`};case z.NEAREST_MIPMAP_NEAREST:return{minFilter:`nearest`,mipmapFilter:`nearest`};case z.LINEAR_MIPMAP_NEAREST:return{minFilter:`linear`,mipmapFilter:`nearest`};case z.NEAREST_MIPMAP_LINEAR:return{minFilter:`nearest`,mipmapFilter:`linear`};case z.LINEAR_MIPMAP_LINEAR:return{minFilter:`linear`,mipmapFilter:`linear`};default:return{}}}function js(e,t,n){if(`compressed`in t)return Fs(e,t,{id:n.id,sampler:n.sampler});let r=n.width!==void 0&&n.height!==void 0?{width:n.width,height:n.height}:e.getExternalImageSize(t),i=n.sampler.mipmapFilter===`nearest`||n.sampler.mipmapFilter===`linear`,a=i?e.getMipLevelCount(r.width,r.height):1,s=e.createTexture({id:n.id,sampler:n.sampler,width:r.width,height:r.height,mipLevels:a,...i?{usage:o.SAMPLE|o.RENDER|o.COPY_DST|o.COPY_SRC}:{},...n.colorSpace?{format:n.colorSpace===`srgb`?`rgba8unorm-srgb`:`rgba8unorm`}:{},data:t});return a>1&&(e.type===`webgl`?s.generateMipmapsWebGL():e.type===`webgpu`&&e.generateMipmapsWebGPU(s)),s}function Ms(e,t){return e.createTexture({...t,format:`rgba8unorm`,width:1,height:1,mipLevels:1})}function Ns(e){return e.textureFormat}function Ps(e,n,r){let{blockWidth:i=1,blockHeight:a=1}=t.getInfo(r),o=1;for(let t=1;;t++){let r=Math.max(1,e>>t),s=Math.max(1,n>>t);if(r<i||s<a)break;o++}return o}function Fs(e,t,n){let r;if(r=Array.isArray(t.data)&&t.data[0]?.data?t.data:`mipmaps`in t&&Array.isArray(t.mipmaps)?t.mipmaps:[],r.length===0||!r[0]?.data)return a.warn(`createCompressedTexture: compressed image has no valid mip levels, creating fallback`)(),Ms(e,n);let i=r[0],s=i.width??t.width??0,c=i.height??t.height??0;if(s<=0||c<=0)return a.warn(`createCompressedTexture: base level has invalid dimensions, creating fallback`)(),Ms(e,n);let l=Ns(i);if(!l)return a.warn(`createCompressedTexture: compressed image has no textureFormat, creating fallback`)(),Ms(e,n);if(!e.isTextureFormatSupported(l))return a.warn(`createCompressedTexture: ${e.type} device does not support '${l}', creating fallback`)(),Ms(e,n);let u=Ps(s,c,l),d=Math.min(r.length,u),f=1;for(let e=1;e<d;e++){let t=r[e];if(!t.data||t.width<=0||t.height<=0){a.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let n=Ns(t);if(n&&n!==l){a.warn(`createCompressedTexture: mip level ${e} format '${n}' differs from base '${l}', truncating`)();break}let i=Math.max(1,s>>e),o=Math.max(1,c>>e);if(t.width!==i||t.height!==o){a.warn(`createCompressedTexture: mip level ${e} dimensions ${t.width}x${t.height} don't match expected ${i}x${o}, truncating`)();break}f++}let p=e.createTexture({...n,format:l,usage:o.TEXTURE|o.COPY_DST,width:s,height:c,mipLevels:f,data:i.data});for(let e=1;e<f;e++)p.writeData(r[e].data,{width:r[e].width,height:r[e].height,mipLevel:e});return p}function Is(e,t={}){let n=t.lightDefinitions||e.lights||e.extensions?.KHR_lights_punctual?.lights;if(!n||!Array.isArray(n)||n.length===0)return[];let r=[],i=Hs(e.nodes||[]),a=new Map;for(let o of e.nodes||[]){if(!Ls(o,i,t.nodeVisibility))continue;let e=o.light??o.extensions?.KHR_lights_punctual?.light;if(typeof e!=`number`||t.nodeIdentifiers&&!t.nodeIdentifiers.has(o.id))continue;let s=n[e];if(!s)continue;let c=Rs(s.color||[1,1,1],t.useByteColors??!0),l=s.intensity??1,u=s.range,d=Us(o,i,a);switch(s.type){case`directional`:r.push(Bs(d,c,l));break;case`point`:r.push(zs(d,c,l,u));break;case`spot`:r.push(Vs(d,c,l,u,s.spot));break;default:break}}return r}function Ls(e,t,n){let r=e;for(;r;){let e=n?.get(r.id);if(e?!e.display:r.extensions?.KHR_node_visibility?.visible===!1)return!1;r=t.get(r.id)}return!0}function Rs(e,t){return t?e.map(e=>e*255):Pe(e,!1)}function zs(e,t,n,r){let i=Gs(e),a=[1,0,0];return r!==void 0&&r>0&&(a=[1,0,1/(r*r)]),{type:`point`,position:i,color:t,intensity:n,attenuation:a}}function Bs(e,t,n){return{type:`directional`,direction:Ks(e),color:t,intensity:n}}function Vs(e,t,n,r,i={}){let a=Gs(e),o=Ks(e),s=[1,0,0];return r!==void 0&&r>0&&(s=[1,0,1/(r*r)]),{type:`spot`,position:a,direction:o,color:t,intensity:n,attenuation:s,innerConeAngle:i.innerConeAngle??0,outerConeAngle:i.outerConeAngle??Math.PI/4}}function Hs(e){let t=new Map;for(let n of e)for(let e of n.children||[])t.set(e.id,n);return t}function Us(e,t,n){let r=n.get(e.id);if(r)return r;let i=Ws(e),a=t.get(e.id),o=a?new p(Us(a,t,n)).multiplyRight(i):i;return n.set(e.id,o),o}function Ws(e){if(e.matrix)return new p(e.matrix);let t=new p;return e.translation&&t.translate(e.translation),e.rotation&&t.multiplyRight(new p().fromQuaternion(e.rotation)),e.scale&&t.scale(e.scale),t}function Gs(e){return e.transformAsPoint([0,0,0])}function Ks(e){return e.transformDirection([0,0,-1])}function qs(e,t){return typeof t==`number`?t:(e.skins||[]).findIndex(n=>{if(n===t||t.id&&n.id===t.id)return!0;if(n.joints.length!==t.joints?.length||!n.joints.every((e,n)=>e===t.joints?.[n]))return!1;if(typeof t.inverseBindMatrices==`number`){let r=e.accessors[t.inverseBindMatrices];return!n.inverseBindMatrices||n.inverseBindMatrices===r}return!0})}var Js={KHR_draco_mesh_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Decoded by loaders.gl before luma.gl builds the scenegraph.`},EXT_meshopt_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering.`},KHR_meshopt_compression:{supportLevel:`none`,standardStatus:`release-candidate`,comment:`The installed loaders.gl GLTFLoader supports EXT_meshopt_compression, not the KHR release candidate.`},KHR_mesh_quantization:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Loader-materialized quantized accessors retain their typed values and normalization.`},EXT_mesh_features:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned.`},EXT_structural_metadata:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned.`},KHR_lights_punctual:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Parsed into luma.gl Light objects.`},KHR_materials_unlit:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Unlit materials bypass the default lighting path.`},KHR_materials_emissive_strength:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Applied by the stock PBR shader.`},KHR_texture_basisu:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`BasisU / KTX2 textures pass through when the device supports them.`},KHR_texture_transform:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking.`},EXT_texture_webp:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Texture source is resolved during load; final support depends on browser and device decode support.`},EXT_texture_avif:{supportLevel:`none`,standardStatus:`ratified`,comment:`The image loader can decode supported AVIF images, but GLTFLoader does not select EXT_texture_avif sources.`},KHR_materials_specular:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies specular factors and textures to the dielectric F0 term.`},KHR_materials_ior:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now drives dielectric reflectance from the glTF IOR value.`},KHR_materials_transmission:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer.`},KHR_materials_volume:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Thickness and attenuation now tint transmitted light in the stock shader.`},KHR_materials_clearcoat:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a secondary clearcoat specular lobe.`},KHR_materials_sheen:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a sheen lobe for cloth-like materials.`},KHR_materials_iridescence:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now tints specular response with a view-dependent thin-film iridescence approximation.`},KHR_materials_anisotropy:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation.`},KHR_materials_pbrSpecularGlossiness:{supportLevel:`loader-only`,standardStatus:`archived`,comment:`Extension data can be loaded, but it is not translated into the default metallic-roughness material path.`},KHR_materials_variants:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Primitive material variants can be selected and restored on the generated scenegraph.`},EXT_mesh_gpu_instancing:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Accessor-backed instance transforms use one instanced draw per source primitive.`},KHR_node_visibility:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Recursive node visibility controls rendered geometry, punctual lights, and animation.`},KHR_animation_pointer:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates.`},EXT_materials_bump:{supportLevel:`built-in`,standardStatus:`draft`,comment:`The experimental bump-map draft perturbs the canonical surface normal from a linear height texture.`},KHR_materials_diffuse_transmission:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures.`},KHR_materials_dispersion:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction.`},KHR_materials_volume_scatter:{supportLevel:`parsed-and-wired`,standardStatus:`draft`,comment:`The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented.`},KHR_xmp:{supportLevel:`none`,standardStatus:`archived`,comment:`Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them.`},KHR_xmp_json_ld:{supportLevel:`none`,standardStatus:`ratified`,comment:`Metadata is preserved in the glTF, but luma.gl does not interpret it.`},EXT_lights_image_based:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Use loadPBREnvironment() or custom environment setup instead.`},EXT_texture_video:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Video textures are not created automatically by the stock pipeline.`},MSFT_lod:{supportLevel:`parsed-and-wired`,standardStatus:`vendor`,comment:`Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented.`}};function Ys(e){return Js[e]||null}function Xs(e){let t=e.animations||[],n=new Map,r=new Map;return t.flatMap((t,i)=>{let a=t.name||`Animation-${i}`,o=new Map,s=t.channels.flatMap(({sampler:i,target:a})=>{let s=nc(e,a),c=`${i}:${s??0}`,l=o.get(c);if(!l){let a=t.samplers[i];if(!a)throw Error(`Cannot find animation sampler ${i}`);let{input:u,interpolation:d=`LINEAR`,output:f}=a,p=pc(e.accessors[u],n),m=mc(e.accessors[f],r);l={input:p,interpolation:d,output:s===void 0?m:rc(m,p.length,d,s)},o.set(c,l)}let u=Zs(e,a,l);return u?[u]:[]});return s.length?[{name:a,channels:s}]:[]})}function Zs(e,t,n){if(t.path===`pointer`)return Qs(e,t,n);let r=ac(t.path);if(!r)return null;let i=e.nodes[t.node??0];if(!i)throw Error(`Cannot find animation target ${t.node}`);return{type:`node`,sampler:n,targetNodeId:i.id,path:r}}function Qs(e,t,n){let r=t.extensions?.KHR_animation_pointer?.pointer;if(typeof r!=`string`||!r.startsWith(`/`))return a.warn(`KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped`)(),null;let i=lc(r);switch(i[0]){case`nodes`:return tc(e,i,n,r);case`materials`:return ic(e,i,n,r);case`cameras`:return $s(e,i,n,r);case`extensions`:if(i[1]===`KHR_lights_punctual`)return ec(e,i,n,r);break;default:break}return fc(r,`top-level target "${i[0]}" has no runtime animation mapping`),null}function $s(e,t,n,r){let i=Number(t[1]),a=e.cameras?.[i],o=t[2],s=t[3];return t.length!==4||!Number.isInteger(i)||!a||o!==`perspective`&&o!==`orthographic`||a.type!==o||!(o===`perspective`?[`aspectRatio`,`yfov`,`znear`,`zfar`]:[`xmag`,`ymag`,`znear`,`zfar`]).includes(s)?(fc(r,`camera pointers must target a supported projection property`),null):{type:`camera`,sampler:n,pointer:r,targetCameraIndex:i,projection:o,property:s}}function ec(e,t,n,r){let i=Number(t[3]),a=e.lights||e.extensions?.KHR_lights_punctual?.lights,o=t[4]===`spot`,s=o?t[5]:t[4],c=!o&&s===`color`?t[5]:void 0,l=[`color`,`intensity`,`range`,`innerConeAngle`,`outerConeAngle`],u=o||c!==void 0?6:5;return t[2]!==`lights`||t.length!==u||!Number.isInteger(i)||!Array.isArray(a)||!a[i]||!l.includes(s)||o&&s!==`innerConeAngle`&&s!==`outerConeAngle`||c!==void 0&&(!/^[0-2]$/.test(c)||s!==`color`)?(fc(r,`punctual-light pointers must target supported typed light properties`),null):{type:`light`,sampler:n,pointer:r,targetLightIndex:i,property:s,...c===void 0?{}:{component:Number(c)}}}function tc(e,t,n,r){let i=t.length===5&&t[2]===`extensions`&&t[3]===`KHR_node_visibility`&&t[4]===`visible`;if(t.length!==3&&!i)return fc(r,`node pointers must target transforms, morph weights, or KHR_node_visibility.visible`),null;let o=Number(t[1]),s=e.nodes[o];if(!Number.isInteger(o)||!s)return a.warn(`KHR_animation_pointer target ${r} references a missing node and will be skipped`)(),null;if(i&&n.interpolation!==`STEP`)return fc(r,`boolean visibility animation requires STEP interpolation`),null;let c=i?`visibility`:ac(t[2]);return c?{type:`node`,sampler:n,targetNodeId:s.id,path:c}:(fc(r,`node property "${t[2]}" has no runtime animation mapping`),null)}function nc(e,t){let n;if(t.path===`weights`)n=t.node;else if(t.path===`pointer`){let e=t.extensions?.KHR_animation_pointer?.pointer,r=typeof e==`string`?/^\/nodes\/(\d+)\/weights$/.exec(e):null;if(!r)return;n=Number(r[1])}else return;let r=e.nodes[n??0],i=typeof r?.mesh==`number`?e.meshes[r.mesh]:r?.mesh;return r?.weights?.length||i?.weights?.length||i?.primitives?.[0]?.targets?.length||1}function rc(e,t,n,r){let i=n===`CUBICSPLINE`?3:1,a=e.length/(Math.max(t,1)*i),o=r>1?r:Number.isInteger(a)&&a>1?a:r;if(o<=1)return e;let s=e.flat(),c=[];for(let e=0;e<s.length;e+=o)c.push(s.slice(e,e+o));return c}function ic(e,t,n,r){if(t.length<3)return fc(r,`material pointers must include a material index and target property path`),null;let i=Number(t[1]),o=e.materials[i];if(!Number.isInteger(i)||!o)return a.warn(`KHR_animation_pointer target ${r} references a missing material and will be skipped`)(),null;let s=oc(o,t.slice(2));return`reason`in s?(fc(r,s.reason),null):{sampler:n,pointer:r,targetMaterialIndex:i,...s}}function ac(e){switch(e){case`translation`:case`rotation`:case`scale`:case`weights`:return e;default:return null}}function oc(e,t){let n=sc(e,t);if(!(`reason`in n)||n.reason!==`not-a-texture-transform-target`)return n;switch(t.join(`/`)){case`pbrMetallicRoughness/baseColorFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`baseColorFactor`}:{reason:V(t)};case`pbrMetallicRoughness/metallicFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:0}:{reason:V(t)};case`pbrMetallicRoughness/roughnessFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:1}:{reason:V(t)};case`normalTexture/scale`:return e.normalTexture?{type:`material`,property:`normalScale`}:{reason:V(t)};case`occlusionTexture/strength`:return e.occlusionTexture?{type:`material`,property:`occlusionStrength`}:{reason:V(t)};case`emissiveFactor`:return{type:`material`,property:`emissiveFactor`};case`alphaCutoff`:return{type:`material`,property:`alphaCutoff`};case`extensions/KHR_materials_specular/specularFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularIntensityFactor`}:{reason:V(t)};case`extensions/KHR_materials_specular/specularColorFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularColorFactor`}:{reason:V(t)};case`extensions/KHR_materials_ior/ior`:return e.extensions?.KHR_materials_ior?{type:`material`,property:`ior`}:{reason:V(t)};case`extensions/EXT_materials_bump/bumpFactor`:return e.extensions?.EXT_materials_bump?{type:`material`,property:`bumpFactor`}:{reason:V(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionFactor`}:{reason:V(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionColorFactor`}:{reason:V(t)};case`extensions/KHR_materials_volume_scatter/multiscatterColorFactor`:case`extensions/KHR_materials_volume_scatter/multiscatterColor`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`multiscatterColorFactor`}:{reason:V(t)};case`extensions/KHR_materials_volume_scatter/scatterAnisotropy`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`scatterAnisotropy`}:{reason:V(t)};case`extensions/KHR_materials_dispersion/dispersion`:return e.extensions?.KHR_materials_dispersion?{type:`material`,property:`dispersion`}:{reason:V(t)};case`extensions/KHR_materials_transmission/transmissionFactor`:return e.extensions?.KHR_materials_transmission?{type:`material`,property:`transmissionFactor`}:{reason:V(t)};case`extensions/KHR_materials_volume/thicknessFactor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`thicknessFactor`}:{reason:V(t)};case`extensions/KHR_materials_volume/attenuationDistance`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationDistance`}:{reason:V(t)};case`extensions/KHR_materials_volume/attenuationColor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationColor`}:{reason:V(t)};case`extensions/KHR_materials_clearcoat/clearcoatFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatFactor`}:{reason:V(t)};case`extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatRoughnessFactor`}:{reason:V(t)};case`extensions/KHR_materials_sheen/sheenColorFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenColorFactor`}:{reason:V(t)};case`extensions/KHR_materials_sheen/sheenRoughnessFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenRoughnessFactor`}:{reason:V(t)};case`extensions/KHR_materials_iridescence/iridescenceFactor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceFactor`}:{reason:V(t)};case`extensions/KHR_materials_iridescence/iridescenceIor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceIor`}:{reason:V(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMinimum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:0}:{reason:V(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMaximum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:1}:{reason:V(t)};case`extensions/KHR_materials_anisotropy/anisotropyStrength`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyStrength`}:{reason:V(t)};case`extensions/KHR_materials_anisotropy/anisotropyRotation`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyRotation`}:{reason:V(t)};case`extensions/KHR_materials_emissive_strength/emissiveStrength`:return e.extensions?.KHR_materials_emissive_strength?{type:`material`,property:`emissiveStrength`}:{reason:V(t)};default:return{reason:V(t)}}}function sc(e,t){let n=t.lastIndexOf(`extensions`);if(n<0||t[n+1]!==`KHR_texture_transform`||n<1)return{reason:`not-a-texture-transform-target`};let r=xs(t.slice(0,n));if(!r)return{reason:uc(t.slice(0,n))};let i=cc(e,r.pathSegments);if(!i)return{reason:`texture-transform target "${t.slice(0,n).join(`/`)}" does not exist on the referenced material`};let a=t[n+2];if(a===`texCoord`)return{reason:`animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update`};if(a!==`offset`&&a!==`rotation`&&a!==`scale`)return{reason:`KHR_texture_transform property "${a}" is not animatable; supported properties are offset, rotation, and scale`};let o=t[n+3];if(t.length>n+4)return{reason:`KHR_texture_transform.${a} does not support nested property paths`};let s;if(o!==void 0){if(s=Number(o),a===`rotation`)return{reason:`KHR_texture_transform.rotation does not support component indices`};if(!Number.isInteger(s)||s<0||s>1)return{reason:`KHR_texture_transform.${a} component index "${o}" is invalid; only 0 and 1 are supported`}}return{type:`textureTransform`,textureSlot:r.slot,path:a,component:s,baseTransform:ys(i)}}function cc(e,t){let n=e;for(let e of t)if(n=n?.[e],!n)return null;return n}function lc(e){return e.slice(1).split(`/`).map(e=>e.replace(/~1/g,`/`).replace(/~0/g,`~`))}function V(e){let t=dc(e);if(t){let e=Ys(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join(`/`)}"`}function uc(e){let t=dc(e);if(t){let e=Ys(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join(`/`)}" has no runtime texture-slot mapping`}function dc(e){let t=e.indexOf(`extensions`),n=e[t+1];return t>=0&&n?n:null}function fc(e,t){a.warn(`KHR_animation_pointer target ${e} will be skipped because ${t}`)()}function pc(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=hc(e);gc(r===1,`accessorToJsArray1D must have exactly 1 component`);let i=Array.from(n);return t.set(e,i),i}function mc(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=hc(e);gc(r>=1,`accessorToJsArray2D must have at least 1 component`);let i=[];for(let e=0;e<n.length;e+=r)i.push(Array.from(n.slice(e,e+r)));return t.set(e,i),i}function hc(e){if(e.value)return{value:e.value,components:e.components};let t=e.bufferView?.data;gc(t!==void 0),gc(e.componentType===5126);let n=e.type===`SCALAR`?1:Number(e.type.slice(3));return{value:new Float32Array(t.buffer,t.byteOffset+(e.byteOffset||0),e.count*n),components:n}}function gc(e,t){if(!e)throw Error(t)}var _c=`4.4.5`;async function vc(e,t,n,r){return r._parse(e,t,n,r)}function yc(e,t){if(!e)throw Error(t||`loader assertion failed.`)}var H={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};H.self||H.window||H.global,H.window||H.self||H.global,H.global||H.self||H.window,H.document;var bc=!!(typeof process!=`object`||String(process)!==`[object process]`||process.browser),xc=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);xc&&parseFloat(xc[1]);var Sc=`v4.4.5`;function Cc(){let e=new i({id:`loaders.gl`});return globalThis.loaders||={},globalThis.loaders.log=e,globalThis.loaders.version=Sc,globalThis.probe||={},globalThis.probe.loaders=e,e}var wc=Cc(),Tc=e=>typeof e==`boolean`,U=e=>typeof e==`function`,Ec=e=>typeof e==`object`&&!!e,Dc=e=>Ec(e)&&e.constructor==={}.constructor,Oc=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer,kc=e=>Ec(e)&&typeof e.byteLength==`number`&&typeof e.slice==`function`,Ac=e=>!!e&&U(e[Symbol.iterator]),jc=e=>!!e&&U(e[Symbol.asyncIterator]),Mc=e=>typeof Response<`u`&&e instanceof Response||Ec(e)&&U(e.arrayBuffer)&&U(e.text)&&U(e.json),Nc=e=>typeof Blob<`u`&&e instanceof Blob,Pc=e=>typeof ReadableStream<`u`&&e instanceof ReadableStream||Ec(e)&&U(e.tee)&&U(e.cancel)&&U(e.getReader),Fc=e=>Ec(e)&&U(e.read)&&U(e.pipe)&&Tc(e.readable),Ic=e=>Pc(e)||Fc(e);function Lc(e,t){return Rc(e||{},t)}function Rc(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))i&&typeof i==`object`&&!Array.isArray(i)?r[e]=Rc(r[e]||{},t[e],n+1):r[e]=t[e];return r}function zc(e){globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,e)}function Bc(e){return globalThis.loaders?.modules?.[e]||null}var Vc=`latest`;function Hc(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version=`4.4.5`),globalThis._loadersgl_.version}var Uc=Hc();function Wc(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var Gc={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};Gc.self||Gc.window||Gc.global,Gc.window||Gc.self||Gc.global,Gc.global||Gc.self||Gc.window,Gc.document;var W=typeof process!=`object`||String(process)!==`[object process]`||process.browser,Kc=typeof importScripts==`function`,qc=typeof window<`u`&&window.orientation!==void 0,Jc=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);Jc&&parseFloat(Jc[1]);var Yc=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){Wc(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){Wc(this.isRunning),this.isRunning=!1,this._reject(e)}},Xc=class{terminate(){}},Zc=new Map;function Qc(e){Wc(e.source&&!e.url||!e.source&&e.url);let t=Zc.get(e.source||e.url);return t||(e.url&&(t=$c(e.url),Zc.set(e.url,t)),e.source&&(t=el(e.source),Zc.set(e.source,t))),Wc(t),t}function $c(e){return e.startsWith(`http`)?el(tl(e)):e}function el(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function tl(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function nl(e,t=!0,n){let r=n||new Set;if(e){if(rl(e))r.add(e);else if(rl(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)nl(e[n],t,r)}return n===void 0?Array.from(r):[]}function rl(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}var il=()=>{},al=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&W||Xc!==void 0&&!W}constructor(e){let{name:t,source:n,url:r}=e;Wc(n||r),this.name=t,this.source=n,this.url=r,this.onMessage=il,this.onError=e=>console.log(e),this.worker=W?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=il,this.onError=il,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=nl(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){this._loadableURL=Qc({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url)e=new Xc(this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`});else if(this.source)e=new Xc(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},ol=class{name=`unnamed`;source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return al.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new Yc(t.name,e);e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!W||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new al({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return qc?this.maxMobileConcurrency:this.maxConcurrency}},sl={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},cl=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return al.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...sl},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r}=e,i=this.workerPools.get(t);return i||(i=new ol({name:t,source:n,url:r}),i.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,i)),i}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function ll(e,t={}){let n=t[e.id]||{},r=W?`${e.id}-worker.js`:`${e.id}-worker-node.js`,i=n.workerUrl;if(!i&&e.id===`compression`&&(i=t.workerUrl),(t._workerType||t?.core?._workerType)===`test`&&(i=W?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!i){let t=e.version;t===`latest`&&(t=Vc);let n=t?`@${t}`:``;i=`https://unpkg.com/@loaders.gl/${e.module}${n}/dist/${r}`}return Wc(i),i}function ul(e,t=Uc){Wc(e,`no worker provided`);let n=e.version;return!(!t||!n)}var dl={};function fl(e={}){let t=e.useLocalLibraries??e.core?.useLocalLibraries,n=e.CDN??e.core?.CDN,r=e.modules;return{...t===void 0?{}:{useLocalLibraries:t},...n===void 0?{}:{CDN:n},...r===void 0?{}:{modules:r}}}async function pl(e,t=null,n={},r=null){return t&&(e=ml(e,t,n,r)),dl[e]=dl[e]||hl(e),await dl[e]}function ml(e,t,n={},r=null){if(n?.core)throw Error(`loadLibrary: options.core must be pre-normalized`);if(!n.useLocalLibraries&&e.startsWith(`http`))return e;r||=e;let i=n.modules||{};return i[r]?i[r]:W?n.CDN?(Wc(n.CDN.startsWith(`http`)),`${n.CDN}/${t}@${Uc}/dist/libs/${r}`):Kc?`../src/libs/${r}`:`modules/${t}/src/libs/${r}`:`modules/${t}/dist/libs/${r}`}async function hl(e){if(e.endsWith(`wasm`))return await _l(e);if(!W){let{requireFromFile:t}=globalThis.loaders||{};try{let n=await t?.(e);return n||!e.includes(`/dist/libs/`)?n:await t?.(e.replace(`/dist/libs/`,`/src/libs/`))}catch(n){if(e.includes(`/dist/libs/`))try{return await t?.(e.replace(`/dist/libs/`,`/src/libs/`))}catch{}return console.error(n),null}}return Kc?importScripts(e):gl(await vl(e),e)}function gl(e,t){if(!W){let{requireFromString:n}=globalThis.loaders||{};return n?.(e,t)}if(Kc)return eval.call(globalThis,e),null;let n=document.createElement(`script`);n.id=t;try{n.appendChild(document.createTextNode(e))}catch{n.text=e}return document.body.appendChild(n),null}async function _l(e){let{readFileAsArrayBuffer:t}=globalThis.loaders||{};if(W||!t||e.startsWith(`http`))return await(await fetch(e)).arrayBuffer();try{return await t(e)}catch{if(e.includes(`/dist/libs/`))return await t(e.replace(`/dist/libs/`,`/src/libs/`));throw Error(`Failed to load ArrayBuffer from ${e}`)}}async function vl(e){let{readFileAsText:t}=globalThis.loaders||{};if(W||!t||e.startsWith(`http`))return await(await fetch(e)).text();try{return await t(e)}catch{if(e.includes(`/dist/libs/`))return await t(e.replace(`/dist/libs/`,`/src/libs/`));throw Error(`Failed to load text from ${e}`)}}function yl(e,t){if(!cl.isSupported())return!1;let n=t?._nodeWorkers??t?.core?._nodeWorkers;if(!W&&!n)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}async function bl(e,t,n,r,i){let a=e.id,o=ll(e,n),s=cl.getWorkerFarm(n?.core).getWorkerPool({name:a,url:o});n=JSON.parse(JSON.stringify(n)),r=JSON.parse(JSON.stringify(r||{}));let c=await s.startJob(`process-on-worker`,xl.bind(null,i));return c.postMessage(`process`,{input:t,options:n,context:r}),await(await c.result).result}async function xl(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{let n=await e(a,o);t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`parse-with-worker unknown message ${n}`)}}function Sl(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?Cl(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?Cl(e,0,t):``}function Cl(e,t,n){if(e.byteLength<=t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}function wl(e){try{return JSON.parse(e)}catch{throw Error(`Failed to parse JSON from data starting with "${Sl(e)}"`)}}function Tl(e,t,n){if(n||=e.byteLength,e.byteLength<n||t.byteLength<n)return!1;let r=new Uint8Array(e),i=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==i[e])return!1;return!0}function El(...e){return Dl(e)}function Dl(e){let t=e.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=t.reduce((e,t)=>e+t.byteLength,0),r=new Uint8Array(n),i=0;for(let e of t)r.set(e,i),i+=e.byteLength;return r.buffer}function Ol(e,t,n){let r=n===void 0?new Uint8Array(e).subarray(t):new Uint8Array(e).subarray(t,t+n);return new Uint8Array(r).buffer}function kl(e,t){return yc(e>=0),yc(t>0),e+(t-1)&~(t-1)}function Al(e,t,n){let r;if(e instanceof ArrayBuffer)r=new Uint8Array(e);else{let t=e.byteOffset,n=e.byteLength;r=new Uint8Array(e.buffer||e.arrayBuffer,t,n)}return t.set(r,n),n+kl(r.byteLength,4)}async function jl(e){let t=[];for await(let n of e)t.push(Ml(n));return El(...t)}function Ml(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return Nl(t,n,r)}return Nl(e)}function Nl(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}var Pl=``,Fl={};function Il(e){for(let t in Fl)if(e.startsWith(t)){let n=Fl[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${Pl}${e}`),e}function Ll(e){return e}function Rl(e){return e&&typeof e==`object`&&e.isBuffer}function zl(e){if(Rl(e))return Ll(e);if(e instanceof ArrayBuffer)return e;if(Oc(e))return Vl(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(typeof e==`string`){let t=e;return new TextEncoder().encode(t).buffer}if(e&&typeof e==`object`&&e._toArrayBuffer)return e._toArrayBuffer();throw Error(`toArrayBuffer`)}function Bl(e){if(e instanceof ArrayBuffer)return e;if(Oc(e))return Vl(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:Vl(t,n,r)}function Vl(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function Hl(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}function Ul(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function Wl(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}var Gl=globalThis.loaders?.parseImageNode,Kl=typeof Image<`u`,ql=typeof ImageBitmap<`u`,Jl=bc?!0:!!Gl;function Yl(e){switch(e){case`auto`:return ql||Kl||Jl;case`imagebitmap`:return ql;case`image`:return Kl;case`data`:return Jl;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}function Xl(){if(ql)return`imagebitmap`;if(Kl)return`image`;if(Jl)return`data`;throw Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`)}function Zl(e){let t=$l(e);if(!t)throw Error(`Not an image`);return t}function Ql(e){switch(Zl(e)){case`data`:return e;case`image`:case`imagebitmap`:let t=document.createElement(`canvas`),n=t.getContext(`2d`);if(!n)throw Error(`getImageData`);return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw Error(`getImageData`)}}function $l(e){return typeof ImageBitmap<`u`&&e instanceof ImageBitmap?`imagebitmap`:typeof Image<`u`&&e instanceof Image?`image`:e&&typeof e==`object`&&e.data&&e.width&&e.height?`data`:null}var eu=/^data:image\/svg\+xml/,tu=/\.svg((\?|#).*)?$/;function nu(e){return e&&(eu.test(e)||tu.test(e))}function ru(e,t){if(nu(t)){let t=new TextDecoder().decode(e);try{typeof unescape==`function`&&typeof encodeURIComponent==`function`&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return iu(e,t)}function iu(e,t){if(nu(t))throw Error(`SVG cannot be parsed directly to imagebitmap`);return new Blob([new Uint8Array(e)])}async function au(e,t,n){let r=ru(e,n),i=self.URL||self.webkitURL,a=typeof r!=`string`&&i.createObjectURL(r);try{return await ou(a||r,t)}finally{a&&i.revokeObjectURL(a)}}async function ou(e,t){let n=new Image;return n.src=e,t.image&&t.image.decode&&n.decode?(await n.decode(),n):await new Promise((e,t)=>{try{n.onload=()=>e(n),n.onerror=e=>{let n=e instanceof Error?e.message:`error`;t(Error(n))}}catch(e){t(e)}})}var su=!0;async function cu(e,t,n){let r;r=nu(n)?await au(e,t,n):iu(e,n);let i=t&&t.imagebitmap;return await lu(r,i)}async function lu(e,t=null){if((uu(t)||!su)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),su=!1}return await createImageBitmap(e)}function uu(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function du(e){return!hu(e,`ftyp`,4)||!(e[8]&96)?null:fu(e)}function fu(e){switch(pu(e,8,12).replace(`\0`,` `).trim()){case`avif`:case`avis`:return{extension:`avif`,mimeType:`image/avif`};default:return null}}function pu(e,t,n){return String.fromCharCode(...e.slice(t,n))}function mu(e){return[...e].map(e=>e.charCodeAt(0))}function hu(e,t,n=0){let r=mu(t);for(let t=0;t<r.length;++t)if(r[t]!==e[t+n])return!1;return!0}var gu=!1,_u=!0;function vu(e){let t=Tu(e);return bu(t)||Cu(t)||xu(t)||Su(t)||yu(t)}function yu(e){let t=du(new Uint8Array(e instanceof DataView?e.buffer:e));return t?{mimeType:t.mimeType,width:0,height:0}:null}function bu(e){let t=Tu(e);return t.byteLength>=24&&t.getUint32(0,gu)===2303741511?{mimeType:`image/png`,width:t.getUint32(16,gu),height:t.getUint32(20,gu)}:null}function xu(e){let t=Tu(e);return t.byteLength>=10&&t.getUint32(0,gu)===1195984440?{mimeType:`image/gif`,width:t.getUint16(6,_u),height:t.getUint16(8,_u)}:null}function Su(e){let t=Tu(e);return t.byteLength>=14&&t.getUint16(0,gu)===16973&&t.getUint32(2,_u)===t.byteLength?{mimeType:`image/bmp`,width:t.getUint32(18,_u),height:t.getUint32(22,_u)}:null}function Cu(e){let t=Tu(e);if(!(t.byteLength>=3&&t.getUint16(0,gu)===65496&&t.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:r}=wu(),i=2;for(;i+9<t.byteLength;){let e=t.getUint16(i,gu);if(r.has(e))return{mimeType:`image/jpeg`,height:t.getUint16(i+5,gu),width:t.getUint16(i+7,gu)};if(!n.has(e))return null;i+=2,i+=t.getUint16(i,gu)}return null}function wu(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function Tu(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error(`toDataView`)}async function Eu(e,t){let{mimeType:n}=vu(e)||{},r=globalThis.loaders?.parseImageNode;return yc(r),await r(e,n)}async function Du(e,t,n){t||={};let r=(t.image||{}).type||`auto`,{url:i}=n||{},a=Ou(r),o;switch(a){case`imagebitmap`:o=await cu(e,t,i);break;case`image`:o=await au(e,t,i);break;case`data`:o=await Eu(e,t);break;default:yc(!1)}return r===`data`&&(o=Ql(o)),o}function Ou(e){switch(e){case`auto`:case`data`:return Xl();default:return Yl(e),e}}var ku={dataType:null,batchType:null,id:`image`,module:`images`,name:`Images`,version:_c,mimeTypes:[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/bmp`,`image/vnd.microsoft.icon`,`image/svg+xml`],extensions:[`png`,`jpg`,`jpeg`,`gif`,`webp`,`bmp`,`ico`,`svg`,`avif`],parse:Du,tests:[e=>!!vu(new DataView(e))],options:{image:{type:`auto`,decode:!0}}},Au={};function ju(e){return Au[e]===void 0&&(Au[e]=bc?Nu(e):Mu(e)),Au[e]}function Mu(e){let t=globalThis.loaders?.imageFormatsNode||[`image/png`,`image/jpeg`,`image/gif`];return!!globalThis.loaders?.parseImageNode&&t.includes(e)}function Nu(e){switch(e){case`image/avif`:case`image/webp`:return Pu(e);default:return!0}}function Pu(e){try{return document.createElement(`canvas`).toDataURL(e).indexOf(`data:${e}`)===0}catch{return!1}}function G(e,t){if(!e)throw Error(t||`assert failed: gltf`)}var Fu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Iu={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Lu=[`SCALAR`,`VEC2`,`VEC3`,`VEC4`],Ru=[[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125],[Float32Array,5126],[Float64Array,5130]],zu=new Map(Ru),Bu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Vu={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Hu={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function Uu(e){return Lu[e-1]||Lu[0]}function Wu(e){let t=zu.get(e.constructor);if(!t)throw Error(`Illegal typed array`);return t}function Gu(e,t){let n=Hu[e.componentType],r=Bu[e.type],i=Vu[e.componentType],a=e.count*r,o=e.count*r*i;return G(o>=0&&o<=t.byteLength),{ArrayType:n,length:a,byteLength:o,componentByteSize:Iu[e.componentType],numberOfComponentsInElement:Fu[e.type]}}function Ku(e,t,n){let r=e.bufferViews[n];G(r);let i=t[r.buffer];G(i);let a=(r.byteOffset||0)+i.byteOffset;return new Uint8Array(i.arrayBuffer,a,r.byteLength)}function qu(e,t,n){let r=typeof n==`number`?e.accessors?.[n]:n;if(!r)throw Error(`No gltf accessor ${JSON.stringify(n)}`);let i=e.bufferViews?.[r.bufferView||0];if(!i)throw Error(`No gltf buffer view for accessor ${i}`);let{arrayBuffer:a,byteOffset:o}=t[i.buffer],s=(o||0)+(r.byteOffset||0)+(i.byteOffset||0),{ArrayType:c,length:l,componentByteSize:u,numberOfComponentsInElement:d}=Gu(r,i),f=u*d,p=i.byteStride||f;if(i.byteStride===void 0||i.byteStride===f)return new c(a,s,l);let m=new c(l);for(let e=0;e<r.count;e++){let t=new c(a,s+e*p,d);m.set(t,e*d)}return m}function Ju(){return{asset:{version:`2.0`,generator:`loaders.gl`},buffers:[],extensions:{},extensionsRequired:[],extensionsUsed:[]}}var K=class{gltf;sourceBuffers;byteLength;constructor(e){this.gltf={json:e?.json||Ju(),buffers:e?.buffers||[],images:e?.images||[]},this.sourceBuffers=[],this.byteLength=0,this.gltf.buffers&&this.gltf.buffers[0]&&(this.byteLength=this.gltf.buffers[0].byteLength,this.sourceBuffers=[this.gltf.buffers[0]])}get json(){return this.gltf.json}getApplicationData(e){return this.json[e]}getExtraData(e){return(this.json.extras||{})[e]}hasExtension(e){let t=this.getUsedExtensions().find(t=>t===e),n=this.getRequiredExtensions().find(t=>t===e);return typeof t==`string`||typeof n==`string`}getExtension(e){let t=this.getUsedExtensions().find(t=>t===e),n=this.json.extensions||{};return t?n[e]:null}getRequiredExtension(e){return this.getRequiredExtensions().find(t=>t===e)?this.getExtension(e):null}getRequiredExtensions(){return this.json.extensionsRequired||[]}getUsedExtensions(){return this.json.extensionsUsed||[]}getRemovedExtensions(){return this.json.extensionsRemoved||[]}getObjectExtension(e,t){return(e.extensions||{})[t]}getScene(e){return this.getObject(`scenes`,e)}getNode(e){return this.getObject(`nodes`,e)}getSkin(e){return this.getObject(`skins`,e)}getMesh(e){return this.getObject(`meshes`,e)}getMaterial(e){return this.getObject(`materials`,e)}getAccessor(e){return this.getObject(`accessors`,e)}getTexture(e){return this.getObject(`textures`,e)}getSampler(e){return this.getObject(`samplers`,e)}getImage(e){return this.getObject(`images`,e)}getBufferView(e){return this.getObject(`bufferViews`,e)}getBuffer(e){return this.getObject(`buffers`,e)}getObject(e,t){if(typeof t==`object`)return t;let n=this.json[e]&&this.json[e][t];if(!n)throw Error(`glTF file error: Could not find ${e}[${t}]`);return n}getTypedArrayForBufferView(e){e=this.getBufferView(e);let t=e.buffer,n=this.gltf.buffers[t];G(n);let r=(e.byteOffset||0)+n.byteOffset;return new Uint8Array(n.arrayBuffer,r,e.byteLength)}getTypedArrayForAccessor(e){let t=this.getAccessor(e);return qu(this.gltf.json,this.gltf.buffers,t)}getTypedArrayForImageData(e){e=this.getAccessor(e);let t=this.getBufferView(e.bufferView),n=this.getBuffer(t.buffer).data,r=t.byteOffset||0;return new Uint8Array(n,r,t.byteLength)}addApplicationData(e,t){return this.json[e]=t,this}addExtraData(e,t){return this.json.extras=this.json.extras||{},this.json.extras[e]=t,this}addObjectExtension(e,t,n){return e.extensions=e.extensions||{},e.extensions[t]=n,this.registerUsedExtension(t),this}setObjectExtension(e,t,n){let r=e.extensions||{};r[t]=n}removeObjectExtension(e,t){let n=e?.extensions||{};if(n[t]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let e=this.json.extensionsRemoved;e.includes(t)||e.push(t)}delete n[t]}addExtension(e,t={}){return G(t),this.json.extensions=this.json.extensions||{},this.json.extensions[e]=t,this.registerUsedExtension(e),t}addRequiredExtension(e,t={}){return G(t),this.addExtension(e,t),this.registerRequiredExtension(e),t}registerUsedExtension(e){this.json.extensionsUsed=this.json.extensionsUsed||[],this.json.extensionsUsed.find(t=>t===e)||this.json.extensionsUsed.push(e)}registerRequiredExtension(e){this.registerUsedExtension(e),this.json.extensionsRequired=this.json.extensionsRequired||[],this.json.extensionsRequired.find(t=>t===e)||this.json.extensionsRequired.push(e)}removeExtension(e){if(this.json.extensions?.[e]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let t=this.json.extensionsRemoved;t.includes(e)||t.push(e)}this.json.extensions&&delete this.json.extensions[e],this.json.extensionsRequired&&this._removeStringFromArray(this.json.extensionsRequired,e),this.json.extensionsUsed&&this._removeStringFromArray(this.json.extensionsUsed,e)}setDefaultScene(e){this.json.scene=e}addScene(e){let{nodeIndices:t}=e;return this.json.scenes=this.json.scenes||[],this.json.scenes.push({nodes:t}),this.json.scenes.length-1}addNode(e){let{meshIndex:t,matrix:n}=e;this.json.nodes=this.json.nodes||[];let r={mesh:t};return n&&(r.matrix=n),this.json.nodes.push(r),this.json.nodes.length-1}addMesh(e){let{attributes:t,indices:n,material:r,mode:i=4}=e,a={primitives:[{attributes:this._addAttributes(t),mode:i}]};if(n){let e=this._addIndices(n);a.primitives[0].indices=e}return Number.isFinite(r)&&(a.primitives[0].material=r),this.json.meshes=this.json.meshes||[],this.json.meshes.push(a),this.json.meshes.length-1}addPointCloud(e){let t={primitives:[{attributes:this._addAttributes(e),mode:0}]};return this.json.meshes=this.json.meshes||[],this.json.meshes.push(t),this.json.meshes.length-1}addImage(e,t){let n=vu(e),r=t||n?.mimeType,i={bufferView:this.addBufferView(e),mimeType:r};return this.json.images=this.json.images||[],this.json.images.push(i),this.json.images.length-1}addBufferView(e,t=0,n=this.byteLength){let r=e.byteLength;G(Number.isFinite(r)),this.sourceBuffers=this.sourceBuffers||[],this.sourceBuffers.push(e);let i={buffer:t,byteOffset:n,byteLength:r};return this.byteLength+=kl(r,4),this.json.bufferViews=this.json.bufferViews||[],this.json.bufferViews.push(i),this.json.bufferViews.length-1}addAccessor(e,t){let n={bufferView:e,type:Uu(t.size),componentType:t.componentType,count:t.count,max:t.max,min:t.min};return this.json.accessors=this.json.accessors||[],this.json.accessors.push(n),this.json.accessors.length-1}addBinaryBuffer(e,t={size:3}){let n=this.addBufferView(e),r={min:t.min,max:t.max};(!r.min||!r.max)&&(r=this._getAccessorMinMax(e,t.size));let i={size:t.size,componentType:Wu(e),count:Math.round(e.length/t.size),min:r.min,max:r.max};return this.addAccessor(n,Object.assign(i,t))}addTexture(e){let{imageIndex:t}=e,n={source:t};return this.json.textures=this.json.textures||[],this.json.textures.push(n),this.json.textures.length-1}addMaterial(e){return this.json.materials=this.json.materials||[],this.json.materials.push(e),this.json.materials.length-1}createBinaryChunk(){let e=this.byteLength,t=new ArrayBuffer(e),n=new Uint8Array(t),r=0;for(let e of this.sourceBuffers||[])r=Al(e,n,r);this.json?.buffers?.[0]?this.json.buffers[0].byteLength=e:this.json.buffers=[{byteLength:e}],this.gltf.binary=t,this.sourceBuffers=[t],this.gltf.buffers=[{arrayBuffer:t,byteOffset:0,byteLength:t.byteLength}]}_removeStringFromArray(e,t){let n=!0;for(;n;){let r=e.indexOf(t);r>-1?e.splice(r,1):n=!1}}_addAttributes(e={}){let t={};for(let n in e){let r=e[n],i=this._getGltfAttributeName(n);t[i]=this.addBinaryBuffer(r.value,r)}return t}_addIndices(e){return this.addBinaryBuffer(e,{size:1})}_getGltfAttributeName(e){switch(e.toLowerCase()){case`position`:case`positions`:case`vertices`:return`POSITION`;case`normal`:case`normals`:return`NORMAL`;case`color`:case`colors`:return`COLOR_0`;case`texcoord`:case`texcoords`:return`TEXCOORD_0`;default:return e}}_getAccessorMinMax(e,t){let n={min:null,max:null};if(e.length<t)return n;n.min=[],n.max=[];let r=e.subarray(0,t);for(let e of r)n.min.push(e),n.max.push(e);for(let r=t;r<e.length;r+=t)for(let i=0;i<t;i++)n.min[0+i]=Math.min(n.min[0+i],e[r+i]),n.max[0+i]=Math.max(n.max[0+i],e[r+i]);return n}};function Yu(e){return(e%1+1)%1}var Xu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16,BOOLEAN:1,STRING:1,ENUM:1},Zu={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:BigInt64Array,UINT64:BigUint64Array,FLOAT32:Float32Array,FLOAT64:Float64Array},Qu={INT8:1,UINT8:1,INT16:2,UINT16:2,INT32:4,UINT32:4,INT64:8,UINT64:8,FLOAT32:4,FLOAT64:8};function $u(e,t){return Qu[t]*Xu[e]}function ed(e,t,n,r){if(n!==`UINT8`&&n!==`UINT16`&&n!==`UINT32`&&n!==`UINT64`)return null;let i=td(e.getTypedArrayForBufferView(t),`SCALAR`,n,r+1);return i instanceof BigInt64Array||i instanceof BigUint64Array?null:i}function td(e,t,n,r=1){let i=Xu[t],a=Zu[n],o=Qu[n],s=r*i,c=s*o,l=e.buffer,u=e.byteOffset;return u%o!==0&&(l=new Uint8Array(l).slice(u,u+c).buffer,u=0),new a(Bl(l),u,s)}function nd(e,t,n){let r=`TEXCOORD_${t.texCoord||0}`,i=n.attributes[r],a=e.getTypedArrayForAccessor(i),o=e.gltf.json,s=t.index,c=o.textures?.[s]?.source;if(c!==void 0){let n=o.images?.[c]?.mimeType,r=e.gltf.images?.[c];if(r&&r.width!==void 0){let e=[];for(let i=0;i<a.length;i+=2){let o=id(r,n,a,i,t.channels);e.push(o)}return e}}return[]}function rd(e,t,n,r,i){if(!n?.length)return;let a=[];for(let e of n){let t=r.findIndex(t=>t===e);t===-1&&(t=r.push(e)-1),a.push(t)}let o=new Uint32Array(a),s=e.gltf.buffers.push({arrayBuffer:o.buffer,byteOffset:o.byteOffset,byteLength:o.byteLength})-1,c=e.addBufferView(o,s,0),l=e.addAccessor(c,{size:1,componentType:Wu(o),count:o.length});i.attributes[t]=l}function id(e,t,n,r,i=[0]){let a={r:{offset:0,shift:0},g:{offset:1,shift:8},b:{offset:2,shift:16},a:{offset:3,shift:24}},o=n[r],s=n[r+1],c=1;t&&(t.indexOf(`image/jpeg`)!==-1||t.indexOf(`image/png`)!==-1)&&(c=4);let l=ad(o,s,e,c),u=0;for(let t of i){let n=typeof t==`number`?Object.values(a)[t]:a[t],r=l+n.offset,i=Ql(e);if(i.data.length<=r)throw Error(`${i.data.length} <= ${r}`);let o=i.data[r];u|=o<<n.shift}return u}function ad(e,t,n,r=1){let i=n.width,a=Yu(e)*(i-1),o=Math.round(a),s=n.height,c=Yu(t)*(s-1),l=Math.round(c),u=n.components?n.components:r;return(l*i+o)*u}function od(e,t,n,r,i){let a=[];for(let o=0;o<t;o++){let t=n[o],s=n[o+1]-n[o];if(s+t>r)break;let c=t/i,l=s/i;a.push(e.slice(c,c+l))}return a}function sd(e,t,n){let r=[];for(let i=0;i<t;i++){let t=i*n;r.push(e.slice(t,t+n))}return r}function cd(e,t,n,r){if(n)throw Error(`Not implemented - arrayOffsets for strings is specified`);if(r){let n=[],i=new TextDecoder(`utf8`),a=0;for(let o=0;o<e;o++){let e=r[o+1]-r[o];if(e+a<=t.length){let r=t.subarray(a,e+a),o=i.decode(r);n.push(o),a+=e}}return n}return[]}var ld=e({createExtMeshFeatures:()=>_d,decode:()=>fd,encode:()=>pd,name:()=>dd}),ud=`EXT_mesh_features`,dd=ud;async function fd(e,t){md(new K(e),t)}function pd(e,t){let n=new K(e);return gd(n,t),n.createBinaryChunk(),n.gltf}function md(e,t){let n=e.gltf.json;if(n.meshes)for(let r of n.meshes)for(let n of r.primitives)hd(e,n,t)}function hd(e,t,n){if(!n?.gltf?.loadBuffers)return;let r=t.extensions?.[ud]?.featureIds;if(r)for(let i of r){let r;if(i.attribute!==void 0){let n=`_FEATURE_ID_${i.attribute}`,a=t.attributes[n];r=e.getTypedArrayForAccessor(a)}else r=i.texture!==void 0&&n?.gltf?.loadImages?nd(e,i.texture,t):[];i.data=r}}function gd(e,t){let n=e.gltf.json.meshes;if(n)for(let t of n)for(let n of t.primitives)vd(e,n)}function _d(e,t,n,r){t.extensions||={};let i=t.extensions[ud];i||(i={featureIds:[]},t.extensions[ud]=i);let{featureIds:a}=i,o={featureCount:n.length,propertyTable:r,data:n};a.push(o),e.addObjectExtension(t,ud,i)}function vd(e,t){let n=t.extensions?.[ud];if(!n)return;let r=n.featureIds;r.forEach((n,i)=>{if(n.data){let{accessorKey:a,index:o}=yd(t.attributes),s=new Uint32Array(n.data);r[i]={featureCount:s.length,propertyTable:n.propertyTable,attribute:o},e.gltf.buffers.push({arrayBuffer:s.buffer,byteOffset:s.byteOffset,byteLength:s.byteLength});let c=e.addBufferView(s),l=e.addAccessor(c,{size:1,componentType:Wu(s),count:s.length});t.attributes[a]=l}})}function yd(e){let t=`_FEATURE_ID_`,n=Object.keys(e).filter(e=>e.indexOf(t)===0),r=-1;for(let e of n){let t=Number(e.substring(12));t>r&&(r=t)}return r++,{accessorKey:`${t}${r}`,index:r}}var bd=e({createExtStructuralMetadata:()=>Wd,decode:()=>Cd,encode:()=>wd,name:()=>Sd}),xd=`EXT_structural_metadata`,Sd=xd;async function Cd(e,t){Td(new K(e),t)}function wd(e,t){let n=new K(e);return Hd(n,t),n.createBinaryChunk(),n.gltf}function Td(e,t){if(!t.gltf?.loadBuffers)return;let n=e.getExtension(xd);n&&(t.gltf?.loadImages&&Ed(e,n),Dd(e,n))}function Ed(e,t){let n=t.propertyTextures,r=e.gltf.json;if(n&&r.meshes)for(let i of r.meshes)for(let r of i.primitives)kd(e,n,r,t)}function Dd(e,t){let n=t.schema;if(!n)return;let r=n.classes,i=t.propertyTables;if(r&&i)for(let t in r){let r=Od(i,t);r&&jd(e,n,r)}}function Od(e,t){for(let n of e)if(n.class===t)return n;return null}function kd(e,t,n,r){if(!t)return;let i=n.extensions?.[xd]?.propertyTextures;if(i)for(let a of i){let i=t[a];Ad(e,i,n,r)}}function Ad(e,t,n,r){if(!t.properties)return;r.dataAttributeNames||=[];let i=t.class;for(let a in t.properties){let o=`${i}_${a}`,s=t.properties?.[a];if(!s)continue;s.data||=[];let c=s.data,l=nd(e,s,n);l!==null&&(rd(e,o,l,c,n),s.data=c,r.dataAttributeNames.push(o))}}function jd(e,t,n){let r=t.classes?.[n.class];if(!r)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${n.class}`);let i=n.count;for(let a in r.properties){let o=r.properties[a],s=n.properties?.[a];s&&(s.data=Md(e,t,o,i,s))}}function Md(e,t,n,r,i){let a=[],o=i.values,s=e.getTypedArrayForBufferView(o),c=Nd(e,n,i,r),l=Pd(e,i,r);switch(n.type){case`SCALAR`:case`VEC2`:case`VEC3`:case`VEC4`:case`MAT2`:case`MAT3`:case`MAT4`:a=Fd(n,r,s,c);break;case`BOOLEAN`:throw Error(`Not implemented - classProperty.type=${n.type}`);case`STRING`:a=cd(r,s,c,l);break;case`ENUM`:a=Id(t,n,r,s,c);break;default:throw Error(`Unknown classProperty type ${n.type}`)}return a}function Nd(e,t,n,r){return t.array&&t.count===void 0&&n.arrayOffsets!==void 0?ed(e,n.arrayOffsets,n.arrayOffsetType||`UINT32`,r):null}function Pd(e,t,n){return t.stringOffsets===void 0?null:ed(e,t.stringOffsets,t.stringOffsetType||`UINT32`,n)}function Fd(e,t,n,r){let i=e.array,a=e.count,o=$u(e.type,e.componentType),s=n.byteLength/o,c;return c=e.componentType?td(n,e.type,e.componentType,s):n,i?r?od(c,t,r,n.length,o):a?sd(c,t,a):[]:c}function Id(e,t,n,r,i){let a=t.enumType;if(!a)throw Error(`Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM`);let o=e.enums?.[a];if(!o)throw Error(`Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${a}`);let s=o.valueType||`UINT16`,c=$u(t.type,s),l=r.byteLength/c,u=td(r,t.type,s,l);if(u||=r,t.array){if(i)return Ld({valuesData:u,numberOfElements:n,arrayOffsets:i,valuesDataBytesLength:r.length,elementSize:c,enumEntry:o});let e=t.count;return e?Rd(u,n,e,o):[]}return zd(u,0,n,o)}function Ld(e){let{valuesData:t,numberOfElements:n,arrayOffsets:r,valuesDataBytesLength:i,elementSize:a,enumEntry:o}=e,s=[];for(let e=0;e<n;e++){let n=r[e],c=r[e+1]-r[e];if(c+n>i)break;let l=zd(t,n/a,c/a,o);s.push(l)}return s}function Rd(e,t,n,r){let i=[];for(let a=0;a<t;a++){let t=zd(e,n*a,n,r);i.push(t)}return i}function zd(e,t,n,r){let i=[];for(let a=0;a<n;a++)if(e instanceof BigInt64Array||e instanceof BigUint64Array)i.push(``);else{let n=e[t+a],o=Bd(r,n);o?i.push(o.name):i.push(``)}return i}function Bd(e,t){for(let n of e.values)if(n.value===t)return n;return null}var Vd=`schemaClassId`;function Hd(e,t){let n=e.getExtension(xd);if(n&&n.propertyTables)for(let t of n.propertyTables){let r=t.class,i=n.schema?.classes?.[r];t.properties&&i&&Ud(t,i,e)}}function Ud(e,t,n){for(let r in e.properties){let i=e.properties[r].data;if(i){let a=t.properties[r];if(a){let t=qd(i,a,n);e.properties[r]=t}}}}function Wd(e,t,n=Vd){let r=e.getExtension(xd);r||=e.addExtension(xd),r.schema=Gd(t,n,r.schema);let i=Kd(t,n,r.schema);return r.propertyTables||=[],r.propertyTables.push(i)-1}function Gd(e,t,n){let r=n??{id:`schema_id`},i={properties:{}};for(let t of e){let e={type:t.elementType,componentType:t.componentType};i.properties[t.name]=e}return r.classes={},r.classes[t]=i,r}function Kd(e,t,n){let r={class:t,count:0},i=0,a=n.classes?.[t];for(let t of e){if(i===0&&(i=t.values.length),i!==t.values.length&&t.values.length)throw Error(`Illegal values in attributes`);a?.properties[t.name]&&(r.properties||={},r.properties[t.name]={values:0,data:t.values})}return r.count=i,r}function qd(e,t,n){let r={values:0};if(t.type===`STRING`){let{stringData:t,stringOffsets:i}=Xd(e);r.stringOffsets=Zd(i,n),r.values=Zd(t,n)}else t.type===`SCALAR`&&t.componentType&&(r.values=Zd(Yd(e,t.componentType),n));return r}var Jd={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:Int32Array,UINT64:Uint32Array,FLOAT32:Float32Array,FLOAT64:Float64Array};function Yd(e,t){let n=[];for(let t of e)n.push(Number(t));let r=Jd[t];if(!r)throw Error(`Illegal component type`);return new r(n)}function Xd(e){let t=new TextEncoder,n=[],r=0;for(let i of e){let e=t.encode(i);r+=e.length,n.push(e)}let i=new Uint8Array(r),a=[],o=0;for(let e of n)i.set(e,o),a.push(o),o+=e.length;return a.push(o),{stringData:i,stringOffsets:new Uint32Array(a)}}function Zd(e,t){return t.gltf.buffers.push({arrayBuffer:Bl(e.buffer),byteOffset:e.byteOffset,byteLength:e.byteLength}),t.addBufferView(e)}var Qd=e({decode:()=>tf,name:()=>ef}),$d=`EXT_feature_metadata`,ef=$d;async function tf(e,t){nf(new K(e),t)}function nf(e,t){if(!t.gltf?.loadBuffers)return;let n=e.getExtension($d);n&&(t.gltf?.loadImages&&rf(e,n),af(e,n))}function rf(e,t){let n=t.schema;if(!n)return;let r=n.classes,{featureTextures:i}=t;if(r&&i)for(let t in r){let n=r[t],a=sf(i,t);a&&lf(e,a,n)}}function af(e,t){let n=t.schema;if(!n)return;let r=n.classes,i=t.featureTables;if(r&&i)for(let t in r){let r=of(i,t);r&&cf(e,n,r)}}function of(e,t){for(let n in e){let r=e[n];if(r.class===t)return r}return null}function sf(e,t){for(let n in e){let r=e[n];if(r.class===t)return r}return null}function cf(e,t,n){if(!n.class)return;let r=t.classes?.[n.class];if(!r)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${n.class}`);let i=n.count;for(let a in r.properties){let o=r.properties[a],s=n.properties?.[a];s&&(s.data=uf(e,t,o,i,s))}}function lf(e,t,n){let r=t.class;for(let i in n.properties){let n=t?.properties?.[i];n&&(n.data=hf(e,n,r))}}function uf(e,t,n,r,i){let a=[],o=i.bufferView,s=e.getTypedArrayForBufferView(o),c=df(e,n,i,r),l=ff(e,n,i,r);return n.type===`STRING`||n.componentType===`STRING`?a=cd(r,s,c,l):pf(n)&&(a=mf(n,r,s,c)),a}function df(e,t,n,r){return t.type===`ARRAY`&&t.componentCount===void 0&&n.arrayOffsetBufferView!==void 0?ed(e,n.arrayOffsetBufferView,n.offsetType||`UINT32`,r):null}function ff(e,t,n,r){return n.stringOffsetBufferView===void 0?null:ed(e,n.stringOffsetBufferView,n.offsetType||`UINT32`,r)}function pf(e){let t=[`UINT8`,`INT16`,`UINT16`,`INT32`,`UINT32`,`INT64`,`UINT64`,`FLOAT32`,`FLOAT64`];return t.includes(e.type)||e.componentType!==void 0&&t.includes(e.componentType)}function mf(e,t,n,r){let i=e.type===`ARRAY`,a=e.componentCount,o=`SCALAR`,s=e.componentType||e.type,c=$u(o,s),l=td(n,o,s,n.byteLength/c);return i?r?od(l,t,r,n.length,c):a?sd(l,t,a):[]:l}function hf(e,t,n){let r=e.gltf.json;if(!r.meshes)return[];let i=[];for(let a of r.meshes)for(let r of a.primitives)gf(e,n,t,i,r);return i}function gf(e,t,n,r,i){let a=nd(e,{channels:n.channels,...n.texture},i);a&&rd(e,t,a,r,i)}var _f=`4.4.5`,vf=`4.4.5`,yf={TRANSCODER:`basis_transcoder.js`,TRANSCODER_WASM:`basis_transcoder.wasm`,ENCODER:`basis_encoder.js`,ENCODER_WASM:`basis_encoder.wasm`},bf;async function xf(e){return zc(e.modules),Bc(`basis`)||(bf||=Sf(e),await bf)}async function Sf(e){let t=null,n=null;return[t,n]=await Promise.all([await pl(yf.TRANSCODER,`textures`,e),await pl(yf.TRANSCODER_WASM,`textures`,e)]),t||=globalThis.BASIS,await Cf(t,n)}function Cf(e,t){let n={};return t&&(n.wasmBinary=t),new Promise(t=>{e(n).then(e=>{let{BasisFile:n,initializeBasis:r}=e;r(),t({BasisFile:n})})})}var wf;async function Tf(e){let t=e.modules||{};return t.basisEncoder?t.basisEncoder:(wf||=Ef(e),await wf)}async function Ef(e){let t=null,n=null;return[t,n]=await Promise.all([await pl(yf.ENCODER,`textures`,e),await pl(yf.ENCODER_WASM,`textures`,e)]),t||=globalThis.BASIS,await Df(t,n)}function Df(e,t){let n={};return t&&(n.wasmBinary=t),new Promise(t=>{e(n).then(e=>{let{BasisFile:n,KTX2File:r,initializeBasis:i,BasisEncoder:a}=e;i(),t({BasisFile:n,KTX2File:r,BasisEncoder:a})})})}var Of=32854,kf=32856,Af=36194,jf=33776,Mf=33779,Nf=37493,Pf=35840,Ff=35842,If=36196,Lf=35986,Rf=34798,zf=37808,Bf=36283,Vf=36285,Hf=36492,Uf=[``,`WEBKIT_`,`MOZ_`],Wf={WEBGL_compressed_texture_s3tc:[`bc1-rgb-unorm-webgl`,`bc1-rgba-unorm`,`bc2-rgba-unorm`,`bc3-rgba-unorm`],WEBGL_compressed_texture_s3tc_srgb:[`bc1-rgb-unorm-srgb-webgl`,`bc1-rgba-unorm-srgb`,`bc2-rgba-unorm-srgb`,`bc3-rgba-unorm-srgb`],EXT_texture_compression_rgtc:[`bc4-r-unorm`,`bc4-r-snorm`,`bc5-rg-unorm`,`bc5-rg-snorm`],EXT_texture_compression_bptc:[`bc6h-rgb-ufloat`,`bc6h-rgb-float`,`bc7-rgba-unorm`,`bc7-rgba-unorm-srgb`],WEBGL_compressed_texture_etc1:[`etc1-rgb-unorm-webgl`],WEBGL_compressed_texture_etc:[`etc2-rgb8unorm`,`etc2-rgb8unorm-srgb`,`etc2-rgb8a1unorm`,`etc2-rgb8a1unorm-srgb`,`etc2-rgba8unorm`,`etc2-rgba8unorm-srgb`,`eac-r11unorm`,`eac-r11snorm`,`eac-rg11unorm`,`eac-rg11snorm`],WEBGL_compressed_texture_pvrtc:[`pvrtc-rgb4unorm-webgl`,`pvrtc-rgba4unorm-webgl`,`pvrtc-rgb2unorm-webgl`,`pvrtc-rgba2unorm-webgl`],WEBGL_compressed_texture_atc:[`atc-rgb-unorm-webgl`,`atc-rgba-unorm-webgl`,`atc-rgbai-unorm-webgl`],WEBGL_compressed_texture_astc:`astc-4x4-unorm.astc-4x4-unorm-srgb.astc-5x4-unorm.astc-5x4-unorm-srgb.astc-5x5-unorm.astc-5x5-unorm-srgb.astc-6x5-unorm.astc-6x5-unorm-srgb.astc-6x6-unorm.astc-6x6-unorm-srgb.astc-8x5-unorm.astc-8x5-unorm-srgb.astc-8x6-unorm.astc-8x6-unorm-srgb.astc-8x8-unorm.astc-8x8-unorm-srgb.astc-10x5-unorm.astc-10x5-unorm-srgb.astc-10x6-unorm.astc-10x6-unorm-srgb.astc-10x8-unorm.astc-10x8-unorm-srgb.astc-10x10-unorm.astc-10x10-unorm-srgb.astc-12x10-unorm.astc-12x10-unorm-srgb.astc-12x12-unorm.astc-12x12-unorm-srgb`.split(`.`)},Gf=null;function Kf(e){if(!Gf){e=e||qf()||void 0,Gf=new Set;for(let t of Uf)for(let n in Wf)if(e&&e.getExtension(`${t}${n}`))for(let e of Wf[n])Gf.add(e)}return Gf}function qf(){try{return document.createElement(`canvas`).getContext(`webgl`)}catch{return null}}var q=[171,75,84,88,32,50,48,187,13,10,26,10];function Jf(e){let t=new Uint8Array(e);return!(t.byteLength<q.length||t[0]!==q[0]||t[1]!==q[1]||t[2]!==q[2]||t[3]!==q[3]||t[4]!==q[4]||t[5]!==q[5]||t[6]!==q[6]||t[7]!==q[7]||t[8]!==q[8]||t[9]!==q[9]||t[10]!==q[10]||t[11]!==q[11])}var Yf=Promise.resolve(),Xf={etc1:{basisFormat:0,compressed:!0,format:If,textureFormat:`etc1-rgb-unorm-webgl`},etc2:{basisFormat:1,compressed:!0,format:Nf,textureFormat:`etc2-rgba8unorm`},bc1:{basisFormat:2,compressed:!0,format:jf,textureFormat:`bc1-rgb-unorm-webgl`},bc3:{basisFormat:3,compressed:!0,format:Mf,textureFormat:`bc3-rgba-unorm`},bc4:{basisFormat:4,compressed:!0,format:Bf,textureFormat:`bc4-r-unorm`},bc5:{basisFormat:5,compressed:!0,format:Vf,textureFormat:`bc5-rg-unorm`},"bc7-m6-opaque-only":{basisFormat:6,compressed:!0,format:Hf,textureFormat:`bc7-rgba-unorm`},"bc7-m5":{basisFormat:7,compressed:!0,format:Hf,textureFormat:`bc7-rgba-unorm`},"pvrtc1-4-rgb":{basisFormat:8,compressed:!0,format:Pf,textureFormat:`pvrtc-rgb4unorm-webgl`},"pvrtc1-4-rgba":{basisFormat:9,compressed:!0,format:Ff,textureFormat:`pvrtc-rgba4unorm-webgl`},"astc-4x4":{basisFormat:10,compressed:!0,format:zf,textureFormat:`astc-4x4-unorm`},"atc-rgb":{basisFormat:11,compressed:!0,format:Lf,textureFormat:`atc-rgb-unorm-webgl`},"atc-rgba-interpolated-alpha":{basisFormat:12,compressed:!0,format:Rf,textureFormat:`atc-rgbai-unorm-webgl`},rgba32:{basisFormat:13,compressed:!1,format:kf,textureFormat:`rgba8unorm`},rgb565:{basisFormat:14,compressed:!1,format:Af,textureFormat:`rgb565unorm-webgl`},bgr565:{basisFormat:15,compressed:!1,format:Af,textureFormat:`rgb565unorm-webgl`},rgba4444:{basisFormat:16,compressed:!1,format:Of,textureFormat:`rgba4unorm-webgl`}};Object.freeze(Object.keys(Xf));async function Zf(e){let t=Yf,n;Yf=new Promise(e=>{n=e}),await t;try{return await e()}finally{n()}}async function Qf(e,t={}){let n=fl(t);return await Zf(async()=>{if(!t.basis?.containerFormat||t.basis.containerFormat===`auto`){if(Jf(e))return tp((await Tf(n)).KTX2File,e,t);let{BasisFile:r}=await xf(n);return $f(r,e,t)}switch(t.basis.module){case`encoder`:let r=await Tf(n);switch(t.basis.containerFormat){case`ktx2`:return tp(r.KTX2File,e,t);default:return $f(r.BasisFile,e,t)}default:let{BasisFile:i}=await xf(n);return $f(i,e,t)}})}function $f(e,t,n){let r=new e(new Uint8Array(t));try{if(!r.startTranscoding())throw Error(`Failed to start basis transcoding`);let e=r.getNumImages(),t=[];for(let i=0;i<e;i++){let e=r.getNumLevels(i),a=[];for(let t=0;t<e;t++)a.push(ep(r,i,t,n));t.push(a)}return t}finally{r.close(),r.delete()}}function ep(e,t,n,r){let i=e.getImageWidth(t,n),a=e.getImageHeight(t,n),o=e.getHasAlpha(),{compressed:s,format:c,basisFormat:l,textureFormat:u}=rp(r,o),d=e.getImageTranscodedSizeInBytes(t,n,l),f=new Uint8Array(d);if(!e.transcodeImage(f,t,n,l,0,0))throw Error(`failed to start Basis transcoding`);return{shape:`texture-level`,width:i,height:a,data:f,compressed:s,...c===void 0?{}:{format:c},...u===void 0?{}:{textureFormat:u},hasAlpha:o}}function tp(e,t,n){let r=new e(new Uint8Array(t));try{if(!r.startTranscoding())throw Error(`failed to start KTX2 transcoding`);let e=r.getLevels(),t=[];for(let i=0;i<e;i++)t.push(np(r,i,n));return[t]}finally{r.close(),r.delete()}}function np(e,t,n){let{alphaFlag:r,height:i,width:a}=e.getImageLevelInfo(t,0,0),{compressed:o,format:s,basisFormat:c,textureFormat:l}=rp(n,r),u=e.getImageTranscodedSizeInBytes(t,0,0,c),d=new Uint8Array(u);if(!e.transcodeImage(d,t,0,0,c,0,-1,-1))throw Error(`Failed to transcode KTX2 image`);return{shape:`texture-level`,width:a,height:i,data:d,compressed:o,...s===void 0?{}:{format:s},...l===void 0?{}:{textureFormat:l},levelSize:u,hasAlpha:r}}function rp(e,t){let n=e.basis?.format||`auto`;n===`auto`&&(n=e.basis?.supportedTextureFormats?ip(e.basis.supportedTextureFormats):ip()),typeof n==`object`&&(n=t?n.alpha:n.noAlpha);let r=Xf[n.toLowerCase()];if(!r)throw Error(`Unknown Basis format ${n}`);return r}function ip(e=Kf()){let t=new Set(e);return ap(t,[`astc-4x4-unorm`,`astc-4x4-unorm-srgb`])?`astc-4x4`:ap(t,[`bc7-rgba-unorm`,`bc7-rgba-unorm-srgb`])?{alpha:`bc7-m5`,noAlpha:`bc7-m6-opaque-only`}:ap(t,[`bc1-rgb-unorm-webgl`,`bc1-rgb-unorm-srgb-webgl`,`bc1-rgba-unorm`,`bc1-rgba-unorm-srgb`,`bc2-rgba-unorm`,`bc2-rgba-unorm-srgb`,`bc3-rgba-unorm`,`bc3-rgba-unorm-srgb`])?{alpha:`bc3`,noAlpha:`bc1`}:ap(t,[`pvrtc-rgb4unorm-webgl`,`pvrtc-rgba4unorm-webgl`,`pvrtc-rgb2unorm-webgl`,`pvrtc-rgba2unorm-webgl`])?{alpha:`pvrtc1-4-rgba`,noAlpha:`pvrtc1-4-rgb`}:ap(t,[`etc2-rgb8unorm`,`etc2-rgb8unorm-srgb`,`etc2-rgb8a1unorm`,`etc2-rgb8a1unorm-srgb`,`etc2-rgba8unorm`,`etc2-rgba8unorm-srgb`,`eac-r11unorm`,`eac-r11snorm`,`eac-rg11unorm`,`eac-rg11snorm`])?`etc2`:t.has(`etc1-rgb-unorm-webgl`)?`etc1`:ap(t,[`atc-rgb-unorm-webgl`,`atc-rgba-unorm-webgl`,`atc-rgbai-unorm-webgl`])?{alpha:`atc-rgba-interpolated-alpha`,noAlpha:`atc-rgb`}:`rgb565`}function ap(e,t){return t.some(t=>e.has(t))}var op={dataType:null,batchType:null,name:`Basis`,id:`basis`,module:`textures`,version:vf,worker:!0,extensions:[`basis`,`ktx2`],mimeTypes:[`application/octet-stream`,`image/ktx2`],tests:[`sB`],binary:!0,options:{basis:{format:`auto`,containerFormat:`auto`,module:`transcoder`}},parse:Qf},sp=!0,cp=1735152710,lp=12,up=8,dp=1313821514,fp=5130562,pp=0,mp=0,hp=1;function gp(e,t=0){return`\
${String.fromCharCode(e.getUint8(t+0))}\
${String.fromCharCode(e.getUint8(t+1))}\
${String.fromCharCode(e.getUint8(t+2))}\
${String.fromCharCode(e.getUint8(t+3))}`}function _p(e,t=0,n={}){let r=new DataView(e),{magic:i=cp}=n,a=r.getUint32(t,!1);return a===i||a===cp}function vp(e,t,n=0,r={}){let i=new DataView(t),a=gp(i,n+0),o=i.getUint32(n+4,sp),s=i.getUint32(n+8,sp);switch(Object.assign(e,{header:{byteOffset:n,byteLength:s,hasBinChunk:!1},type:a,version:o,json:{},binChunks:[]}),n+=lp,e.version){case 1:return yp(e,i,n);case 2:return bp(e,i,n,r={});default:throw Error(`Invalid GLB version ${e.version}. Only supports version 1 and 2.`)}}function yp(e,t,n){yc(e.header.byteLength>lp+up);let r=t.getUint32(n+0,sp),i=t.getUint32(n+4,sp);return n+=up,yc(i===pp),Sp(e,t,n,r),n+=r,n+=Cp(e,t,n,e.header.byteLength),n}function bp(e,t,n,r){return yc(e.header.byteLength>lp+up),xp(e,t,n,r),n+e.header.byteLength}function xp(e,t,n,r){for(;n+8<=e.header.byteLength;){let i=t.getUint32(n+0,sp),a=t.getUint32(n+4,sp);switch(n+=up,a){case dp:Sp(e,t,n,i);break;case fp:Cp(e,t,n,i);break;case mp:r.strict||Sp(e,t,n,i);break;case hp:r.strict||Cp(e,t,n,i);break;default:break}n+=kl(i,4)}return n}function Sp(e,t,n,r){let i=new Uint8Array(t.buffer,n,r),a=new TextDecoder(`utf8`).decode(i);return e.json=JSON.parse(a),kl(r,4)}function Cp(e,t,n,r){return e.header.hasBinChunk=!0,e.binChunks.push({byteOffset:n,byteLength:r,arrayBuffer:t.buffer}),kl(r,4)}function wp(e,t,n){if(e.startsWith(`data:`)||e.startsWith(`http:`)||e.startsWith(`https:`))return e;let r=n?.baseUrl||Tp(t?.core?.baseUrl);if(!r)throw Error(`'baseUrl' must be provided to resolve relative url ${e}`);return r.endsWith(`/`)?`${r}${e}`:`${r}/${e}`}function Tp(e){if(!e)return;if(e.endsWith(`/`))return e;let t=e.lastIndexOf(`/`);return t>=0?e.slice(0,t+1):``}var Ep=(function(){var e=`b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuixkbeeeddddillviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WboY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbrl79IV9Rbwq1Zkdbk:kYi5ud9:du8Jjjjjbcjq9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz:jjjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCaAcethXaxaDfhiaOaeaoaeao6E9RhQalcl4cifcd4hLazcjdfaAfhKcbhYabaOad2fg8AhEaHh3incbh5dnawTmbaxaYcd4fRbbh5kcbh8Eazcjdfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcjdfa8EaA2fa8FaAz:jjjjb8Aa8FaAfhixdkazcjdfa8EaA2fcbaAz:kjjjb8Aa8FhixekaPa8F9RaL6mva8FaLfhidnaCTmbaPai9RcK6mbaocdtc:q:G:cjbfcj:G:cjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bwar9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfcbaicdfa8J9c8N1:NfghRbbag9cjjjjjw:dg8J9qE86bbarcVfcbaha8J9c8M1:NfghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fcbaha8J9c8N1:NfgiRbbag9cjjjjjw:dg8J9qE86bbarc96fcbaia8J9c8M1:NfgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbw83bwarai8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasaYcd4fRbbgociGPlbedrbkaATmdazaYfh8Fazcjdfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeazaYfhaazcjdfhhcbhoceh8EaKh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaQaocefgofmbka8FaXfh8FcdhoaacdfhaahaXfhha8EceGhlcbh8EalmbxdkkaATmbaocl4h8EazaYfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaKhainazcjdfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E94aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3aYclfgYad6mbkaza8AaAcufad2fadz:jjjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcjqf8Kjjjjbaok:ysezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:kjjjb8Aav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk:4ioiue99dud99dud99dnaeTmbcbhiabhlindndnal8Uebgv:YgoJ:ji:1Salcof8UebgrciVgw:Y:vgDNJbbbZJbbb:;avcu9kEMgq:lJbbb9p9DTmbaq:Ohkxekcjjjj94hkkalclf8Uebhvalcdf8UebhxalarcefciGcetfak87ebdndnax:YgqaDNJbbbZJbbb:;axcu9kEMgm:lJbbb9p9DTmbam:Ohxxekcjjjj94hxkabaiarciGgkfcd7cetfax87ebdndnav:YgmaDNJbbbZJbbb:;avcu9kEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkalarcufciGcetfav87ebdndnawaw2:ZgPaPMaoaoN:taqaqN:tamamN:tgoJbbbbaoJbbbb9GE:raDNJbbbZMgD:lJbbb9p9DTmbaD:Ohrxekcjjjj94hrkalakcetfar87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk:Tvirud99eudndnadcl9hmbaeTmeindndnabRbbgiabcefgl8Sbbgvabcdfgo8Sbbgrf9R:YJbbuJabcifgwRbbgdce4adVgDcd4aDVgDcl4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax86bbdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao86bbdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai86bbdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad86bbabclfhbaecufgembxdkkaeTmbindndnab8Vebgiabcdfgl8Uebgvabclfgo8Uebgrf9R:YJbFu9habcofgw8Vebgdce4adVgDcd4aDVgDcl4aDVgDcw4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax87ebdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao87ebdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai87ebdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad87ebabcwfhbaecufgembkkk9teiucbcbyd:K:G:cjbgeabcifc98GfgbBd:K:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk83dbcj:Gdk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:K:Gdkl8W:qbb`,t=`b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuixkbbebeeddddilve9Weeeviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WbwY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbDl79IV9Rbqq:59Dklbzik94evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaeai86b:q:W:cjbaecitab8Piw83i:q:G:cjbaecefgecjd9hmbkk:SBlEud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaialfgxar9RhodnadTgmmbavaoad;8qbbkaicefhPcj;abad9Uc;WFbGcjdadca0EhsdndndnadTmbaoadfhzcbhHinaeaH9nmdaxaP9RaD6miabaHad2fgOavcjdfasaeaH9RaHasfae6EgAaAcsfgoc9WGgCSEhXaPaDfhQaocl4cifcd4hLavcj;cbfaCcetfhKavcj;cbfaCci2fhYavcj;cbfaCfh8AcbhEaoc;ab6h3incbh5dnawTmbaPaEcd4fRbbh5kcbh8Eavcj;cbfh8Findndndndna5a8Ecet4ciGgoc9:fPdebdkaxaQ9RaC6mwdnaCTmbavcj;cbfa8EaC2faQaC;8qbbkaQaAfhQxdkaCTmeavcj;cbfa8EaC2fcbaC;8kbxekaxaQ9RaL6moaoclVcbawEhraQaLfhocbhidna3mbaxao9Rc;Gb6mbcbhlina8FalfhidndndndndndnaQalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiczfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaicafaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaoclffaqRb:q:W:cjbfhoxikaic8Wfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaocwffaqRb:q:W:cjbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitpbi:q:G:cjbaiRb:q:W:cjbgipsaoRbegqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqRb:q:W:cjbfhokalc;abfhialcjefaC0meaihlaxao9Rc;Fb0mbkkdnaiaC9pmbaici4hlinaxao9RcK6mwa8FaifhqdndndndndndnaQaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaoclffa8JRb:q:W:cjbfhoxikaqaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaocwffa8JRb:q:W:cjbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpkbbagaocdffa8JRb:q:W:cjbfhokalcdfhlaiczfgiaC6mbkkaohQaoTmoka8FaCfh8Fa8Ecefg8Ecl9hmbkdndndndnawTmbazaEcd4fRbbglciGPlbedwbkaCTmdaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep9Taapxeeeeeeeeeeeeeeeeghp9op9Hp9rgaa8Kp9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ughp9Abbbaladfglahaaaapmlvorlvorlvorlvorp9Ughp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp9Ughp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9AbbbaladfhlaoczfgoaC6mbxikkaCTmeaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep:neaapxebebebebebebebebghp9op:bep9rgaa8Kp:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeghp9Abbbaladfglahaaaapmlvorlvorlvorlvorp:oeghp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp:oeghp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9AbbbaladfhlaoczfgoaC6mbxdkkaCTmbaXaEfhrcbhocbalcl4gl9Rc8FGhiavaEfpbdbhhinaravcj;cbfaofpblbg8Ka8Aaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaKaofpblbg8NaYaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgaahp9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ma8PpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9AbbbaradfhraoczfgoaC6mbkkaEclfgEad6mbkdnaXavcjdf9hmbaAad2goTmbaOavcjdfao;8qbbkdnammbavaXaAcufad2fad;8qbbkaAaHfhHc9:hoaQhPaQmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdasaeao9Raoasfae6Eaofgoae6mbkaial9RhPkcbc99axaP9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbkNsezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk;Toio97eue97aec98Ghedndnadcl9hmbaeTmecbhdinababpbbbgicKp:RecKp:Sep;6eglaicwp:RecKp:Sep;6ealp;Geaiczp:RecKp:Sep;6egvp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgwp9op9rp;Keglpxbb;:9cbb;:9cbb;:9cbb;:9calalp;Meaoaop;Meavaravawp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFbbbFbbbFbbbFbbbp9oaipxbbbFbbbFbbbFbbbFp9op9qalavp;Mearp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaoavp;Mearp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgDaDpbbbgipxbbbbbbFFbbbbbbFFgwp9oabpbbbgoaipmbediwDqkzHOAKY8AEgvczp:Reczp:Sep;6eglaoaipmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eavczp:Sep;6egvp;Gealp;Gep;Kep;Legipxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgqp9op9rp;Keglpxb;:FSb;:FSb;:FSb;:FSalalp;Meaiaip;Meavaravaqp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbp9oaiavp;Mearp;Keczp:Rep9qgialavp;Mearp;KepxFFbbFFbbFFbbFFbbp9oglpmwDKYqk8AExm35Ps8E8Fp9qpkbbabaoawp9oaialpmbezHdiOAlvCXorQLp9qpkbbabcafhbadclfgdae6mbkkk;2ileue97euo97dnaec98GgiTmbcbheinabcKfpx:ji:1S:ji:1S:ji:1S:ji:1SabpbbbglabczfgvpbbbgopmlvorxmPsCXQL358E8Fgrczp:Segwpxibbbibbbibbbibbbp9qp;6egDp;NegqaDaDp;MegDaDp;KealaopmbediwDqkzHOAKY8AEgDczp:Reczp:Sep;6eglalp;MeaDczp:Sep;6egoaop;Mearczp:Reczp:Sep;6egrarp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jep;Mepxbbn0bbn0bbn0bbn0gDp;KepxFFbbFFbbFFbbFFbbgkp9oaqaop;MeaDp;Keczp:Rep9qgoaqalp;MeaDp;Keakp9oaqarp;MeaDp;Keczp:Rep9qgDpmwDKYqk8AExm35Ps8E8Fglp5eawclp:RegqpEi:T:j83ibavalp5baqpEd:T:j83ibabcwfaoaDpmbezHdiOAlvCXorQLgDp5eaqpEe:T:j83ibabaDp5baqpEb:T:j83ibabcafhbaeclfgeai6mbkkkuee97dnadcd4ae2c98GgeTmbcbhdinababpbbbgicwp:Recwp:Sep;6eaicep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbabczfhbadclfgdae6mbkkk:Sodw97euaec98Ghedndnadcl9hmbaeTmecbhdinabpxbbuJbbuJbbuJbbuJabpbbbgicKp:TeglaicYp:Tep9qgvcdp:Teavp9qgvclp:Teavp9qgop;6ep;Negvaicwp:RecKp:SegraipxFbbbFbbbFbbbFbbbgwp9ogDp:Uep;6ep;Mepxbbn0bbn0bbn0bbn0gqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9oavaDarp:Xeaiczp:RecKp:Segip:Uep;6ep;Meaqp;Keawp9op9qavaDaraip:Uep:Xep;6ep;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qavaoalcep:Rep9oalpxebbbebbbebbbebbbp9op9qp;6ep;Meaqp;KecKp:Rep9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgkpxbFu9hbFu9hbFu9hbFu9habpbbbglakpbbbgrpmlvorxmPsCXQL358E8Fgvczp:TegqavcHp:Tep9qgicdp:Teaip9qgiclp:Teaip9qgicwp:Teaip9qgop;6ep;NegialarpmbediwDqkzHOAKY8AEgDpxFFbbFFbbFFbbFFbbglp9ograDczp:Segwp:Ueavczp:Reczp:SegDp:Xep;6ep;Mepxbbn0bbn0bbn0bbn0gvp;Kealp9oaiarawaDp:Uep:Xep;6ep;Meavp;Keczp:Rep9qgwaiaoaqcep:Rep9oaqpxebbbebbbebbbebbbp9op9qp;6ep;Meavp;Keczp:ReaiaDarp:Uep;6ep;Meavp;Kealp9op9qgipmwDKYqk8AExm35Ps8E8FpkbbabawaipmbezHdiOAlvCXorQLpkbbabcafhbadclfgdae6mbkkk9teiucbcbydj:G:cjbgeabcifc98GfgbBdj:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkxebcj:Gdklz:zbb`,n=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),r=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!=`object`)return{supported:!1};var i=WebAssembly.validate(n)?s(t):s(e),a,o=WebAssembly.instantiate(i,{}).then(function(e){a=e.instance,a.exports.__wasm_call_ctors()});function s(e){for(var t=new Uint8Array(e.length),n=0;n<e.length;++n){var i=e.charCodeAt(n);t[n]=i>96?i-97:i>64?i-39:i+4}for(var a=0,n=0;n<e.length;++n)t[a++]=t[n]<60?r[t[n]]:(t[n]-60)*64+t[++n];return t.buffer.slice(0,a)}function c(e,t,n,r,i,a,o){var s=e.exports.sbrk,c=r+3&-4,l=s(c*i),u=s(a.length),d=new Uint8Array(e.exports.memory.buffer);d.set(a,u);var f=t(l,r,i,u,a.length);if(f==0&&o&&o(l,c,i),n.set(d.subarray(l,l+r*i)),s(l-s(0)),f!=0)throw Error(`Malformed buffer data: `+f)}var l={NONE:``,OCTAHEDRAL:`meshopt_decodeFilterOct`,QUATERNION:`meshopt_decodeFilterQuat`,EXPONENTIAL:`meshopt_decodeFilterExp`,COLOR:`meshopt_decodeFilterColor`},u={ATTRIBUTES:`meshopt_decodeVertexBuffer`,TRIANGLES:`meshopt_decodeIndexBuffer`,INDICES:`meshopt_decodeIndexSequence`},d=[],f=0;function p(e){var t={object:new Worker(e),pending:0,requests:{}};return t.object.onmessage=function(e){var n=e.data;t.pending-=n.count,t.requests[n.id][n.action](n.value),delete t.requests[n.id]},t}function m(e){for(var t=`self.ready = WebAssembly.instantiate(new Uint8Array([`+new Uint8Array(i)+`]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = `+g.name+`;`+c.toString()+g.toString(),n=new Blob([t],{type:`text/javascript`}),r=URL.createObjectURL(n),a=d.length;a<e;++a)d[a]=p(r);for(var a=e;a<d.length;++a)d[a].object.postMessage({});d.length=e,URL.revokeObjectURL(r)}function h(e,t,n,r,i){for(var a=d[0],o=1;o<d.length;++o)d[o].pending<a.pending&&(a=d[o]);return new Promise(function(o,s){var c=new Uint8Array(n),l=++f;a.pending+=e,a.requests[l]={resolve:o,reject:s},a.object.postMessage({id:l,count:e,size:t,source:c,mode:r,filter:i},[c.buffer])})}function g(e){var t=e.data;self.ready.then(function(e){if(!t.id)return self.close();try{var n=new Uint8Array(t.count*t.size);c(e,e.exports[t.mode],n,t.count,t.size,t.source,e.exports[t.filter]),self.postMessage({id:t.id,count:t.count,action:`resolve`,value:n},[n.buffer])}catch(e){self.postMessage({id:t.id,count:t.count,action:`reject`,value:e})}})}return{ready:o,supported:!0,useWorkers:function(e){m(e)},decodeVertexBuffer:function(e,t,n,r,i){c(a,a.exports.meshopt_decodeVertexBuffer,e,t,n,r,a.exports[l[i]])},decodeIndexBuffer:function(e,t,n,r){c(a,a.exports.meshopt_decodeIndexBuffer,e,t,n,r)},decodeIndexSequence:function(e,t,n,r){c(a,a.exports.meshopt_decodeIndexSequence,e,t,n,r)},decodeGltfBuffer:function(e,t,n,r,i,o){c(a,a.exports[u[i]],e,t,n,r,a.exports[l[o]])},decodeGltfBufferAsync:function(e,t,n,r,i){return d.length>0?h(e,t,n,u[r],l[i]):o.then(function(){var o=new Uint8Array(e*t);return c(a,a.exports[u[r]],o,e,t,n,a.exports[l[i]]),o})}}})();function Dp(e){return typeof e==`string`?e:[`NONE`,`OCTAHEDRAL`,`QUATERNION`,`EXPONENTIAL`,`COLOR`][e]}async function Op(e,t,n,r,i,a=`NONE`){await Ep.ready,Ep.decodeGltfBuffer(e,t,n,r,i,Dp(a))}async function kp(e,t,n){if(!t.gltf?.decompressMeshes||!t.gltf.loadBuffers)return;Ap(e.json);let r=new K(e),i=e.json.bufferViews||[],a=i.map(e=>jp(r,e,n));await Promise.all(a);for(let e of i)r.removeObjectExtension(e,n);for(let t of e.json.buffers||[])r.removeObjectExtension(t,n);r.removeExtension(n)}function Ap(e){let t=e.bufferViews||[];for(let e=0;e<t.length;e++){let n=t[e].extensions;if(n?.KHR_meshopt_compression&&n.EXT_meshopt_compression)throw Error(`glTF bufferView ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}let n=e.buffers||[];for(let e=0;e<n.length;e++){let t=n[e].extensions;if(t?.KHR_meshopt_compression&&t.EXT_meshopt_compression)throw Error(`glTF buffer ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}}async function jp(e,t,n){let r=e.getObjectExtension(t,n);if(!r)return;let{byteOffset:i=0,byteLength:a,byteStride:o,count:s,mode:c,filter:l=`NONE`,buffer:u}=r,d=e.gltf.buffers[u],f=e.gltf.buffers[t.buffer],p=new Uint8Array(d.arrayBuffer,d.byteOffset+i,a);await Op(new Uint8Array(f.arrayBuffer,f.byteOffset+(t.byteOffset||0),t.byteLength),s,o,p,c,l)}var Mp=e({decode:()=>Pp,name:()=>Np}),Np=`EXT_meshopt_compression`;async function Pp(e,t){await kp(e,t,Np)}var Fp=e({decode:()=>Lp,name:()=>Ip}),Ip=`KHR_meshopt_compression`;async function Lp(e,t){await kp(e,t,Ip)}var Rp=e({name:()=>Bp,preprocess:()=>Vp}),zp=`EXT_texture_webp`,Bp=zp;function Vp(e,t){let n=new K(e);if(!ju(`image/webp`)){if(n.getRequiredExtensions().includes(zp))throw Error(`gltf: Required extension ${zp} not supported by browser`);return}let{json:r}=n;for(let e of r.textures||[]){let t=n.getObjectExtension(e,zp);t&&(e.source=t.source),n.removeObjectExtension(e,zp)}n.removeExtension(zp)}var Hp=e({name:()=>Wp,preprocess:()=>Gp}),Up=`KHR_texture_basisu`,Wp=Up;function Gp(e,t){let n=new K(e),{json:r}=n;for(let e of r.textures||[]){let t=n.getObjectExtension(e,Up);t&&(e.source=t.source,n.removeObjectExtension(e,Up))}n.removeExtension(Up)}var Kp=`1.5.6`,qp=`1.4.1`,Jp=`https://www.gstatic.com/draco/versioned/decoders/${Kp}`,J={DECODER:`draco_wasm_wrapper.js`,DECODER_WASM:`draco_decoder.wasm`,FALLBACK_DECODER:`draco_decoder.js`,ENCODER:`draco_encoder.js`},Yp={[J.DECODER]:`${Jp}/${J.DECODER}`,[J.DECODER_WASM]:`${Jp}/${J.DECODER_WASM}`,[J.FALLBACK_DECODER]:`${Jp}/${J.FALLBACK_DECODER}`,[J.ENCODER]:`https://raw.githubusercontent.com/google/draco/${qp}/javascript/${J.ENCODER}`},Xp;async function Zp(e={},t){let n=e.modules||{};return n.draco3d?Xp||=n.draco3d.createDecoderModule({}).then(e=>({draco:e})):Xp||=$p(e,t),await Xp}function Qp(e,t){if(e&&typeof e==`object`){if(e.default)return e.default;if(e[t])return e[t]}return e}async function $p(e,t){let n,r;switch(t){case`js`:n=await pl(Yp[J.FALLBACK_DECODER],`draco`,e,J.FALLBACK_DECODER);break;default:try{[n,r]=await Promise.all([await pl(Yp[J.DECODER],`draco`,e,J.DECODER),await pl(Yp[J.DECODER_WASM],`draco`,e,J.DECODER_WASM)])}catch{n=null,r=null}}return n=Qp(n,`DracoDecoderModule`),n||=globalThis.DracoDecoderModule,!n&&!W&&([n,r]=await Promise.all([await pl(Yp[J.DECODER],`draco`,{...e,useLocalLibraries:!0},J.DECODER),await pl(Yp[J.DECODER_WASM],`draco`,{...e,useLocalLibraries:!0},J.DECODER_WASM)]),n=Qp(n,`DracoDecoderModule`),n||=globalThis.DracoDecoderModule),await em(n,r)}function em(e,t){if(typeof e!=`function`)throw Error(`DracoDecoderModule could not be loaded`);let n={};return t&&(n.wasmBinary=t),new Promise(t=>{e({...n,onModuleLoaded:e=>t({draco:e})})})}var tm=`4.4.5`;function nm(e){switch(e.constructor){case Int8Array:return`int8`;case Uint8Array:case Uint8ClampedArray:return`uint8`;case Int16Array:return`int16`;case Uint16Array:return`uint16`;case Int32Array:return`int32`;case Uint32Array:return`uint32`;case Float32Array:return`float32`;case Float64Array:return`float64`;default:return`null`}}function rm(e){let t=1/0,n=1/0,r=1/0,i=-1/0,a=-1/0,o=-1/0,s=e.POSITION?e.POSITION.value:[],c=s&&s.length;for(let e=0;e<c;e+=3){let c=s[e],l=s[e+1],u=s[e+2];t=c<t?c:t,n=l<n?l:n,r=u<r?u:r,i=c>i?c:i,a=l>a?l:a,o=u>o?u:o}return[[t,n,r],[i,a,o]]}function im(e,t,n){let r=nm(t.value),i=n||am(t);return{name:e,type:{type:`fixed-size-list`,listSize:t.size,children:[{name:`value`,type:r}]},nullable:!1,metadata:i}}function am(e){let t={};return`byteOffset`in e&&(t.byteOffset=e.byteOffset.toString(10)),`byteStride`in e&&(t.byteStride=e.byteStride.toString(10)),`normalized`in e&&(t.normalized=e.normalized.toString()),t}function om(e,t,n){let r=lm(t.metadata),i=[],a=sm(t.attributes);for(let t in e){let n=e[t],r=cm(t,n,a[t]);i.push(r)}if(n){let e=cm(`indices`,n);i.push(e)}return{fields:i,metadata:r}}function sm(e){let t={};for(let n in e){let r=e[n];t[r.name||`undefined`]=r}return t}function cm(e,t,n){return im(e,t,n?lm(n.metadata):void 0)}function lm(e){Object.entries(e);let t={};for(let n in e)t[`${n}.string`]=JSON.stringify(e[n]);return t}var um={POSITION:`POSITION`,NORMAL:`NORMAL`,COLOR:`COLOR_0`,TEX_COORD:`TEXCOORD_0`},dm={1:Int8Array,2:Uint8Array,3:Int16Array,4:Uint16Array,5:Int32Array,6:Uint32Array,9:Float32Array},fm=4,pm=class{draco;decoder;metadataQuerier;constructor(e){this.draco=e,this.decoder=new this.draco.Decoder,this.metadataQuerier=new this.draco.MetadataQuerier}destroy(){this.draco.destroy(this.decoder),this.draco.destroy(this.metadataQuerier)}parseSync(e,t={}){let n=new this.draco.DecoderBuffer;n.Init(new Int8Array(e),e.byteLength),this._disableAttributeTransforms(t);let r=this.decoder.GetEncodedGeometryType(n),i=r===this.draco.TRIANGULAR_MESH?new this.draco.Mesh:new this.draco.PointCloud;try{let e;switch(r){case this.draco.TRIANGULAR_MESH:e=this.decoder.DecodeBufferToMesh(n,i);break;case this.draco.POINT_CLOUD:e=this.decoder.DecodeBufferToPointCloud(n,i);break;default:throw Error(`DRACO: Unknown geometry type.`)}if(!e.ok()||!i.ptr){let t=`DRACO decompression failed: ${e.error_msg()}`;throw Error(t)}let a=this._getDracoLoaderData(i,r,t),o=this._getMeshData(i,a,t),s=rm(o.attributes),c=om(o.attributes,a,o.indices);return{loader:`draco`,loaderData:a,header:{vertexCount:i.num_points(),boundingBox:s},...o,schema:c}}finally{this.draco.destroy(n),i&&this.draco.destroy(i)}}_getDracoLoaderData(e,t,n){let r=this._getTopLevelMetadata(e),i=this._getDracoAttributes(e,n);return{geometry_type:t,num_attributes:e.num_attributes(),num_points:e.num_points(),num_faces:e instanceof this.draco.Mesh?e.num_faces():0,metadata:r,attributes:i}}_getDracoAttributes(e,t){let n={};for(let r=0;r<e.num_attributes();r++){let i=this.decoder.GetAttribute(e,r),a=this._getAttributeMetadata(e,r);n[i.unique_id()]={unique_id:i.unique_id(),attribute_type:i.attribute_type(),data_type:i.data_type(),num_components:i.num_components(),byte_offset:i.byte_offset(),byte_stride:i.byte_stride(),normalized:i.normalized(),attribute_index:r,metadata:a};let o=this._getQuantizationTransform(i,t);o&&(n[i.unique_id()].quantization_transform=o);let s=this._getOctahedronTransform(i,t);s&&(n[i.unique_id()].octahedron_transform=s)}return n}_getMeshData(e,t,n){let r=this._getMeshAttributes(t,e,n);if(!r.POSITION)throw Error(`DRACO: No position attribute found.`);if(e instanceof this.draco.Mesh)switch(n.topology){case`triangle-strip`:return{topology:`triangle-strip`,mode:4,attributes:r,indices:{value:this._getTriangleStripIndices(e),size:1}};default:return{topology:`triangle-list`,mode:5,attributes:r,indices:{value:this._getTriangleListIndices(e),size:1}}}return{topology:`point-list`,mode:0,attributes:r}}_getMeshAttributes(e,t,n){let r={};for(let i of Object.values(e.attributes)){let e=this._deduceAttributeName(i,n);i.name=e;let a=this._getAttributeValues(t,i);if(a){let{value:t,size:n}=a;r[e]={value:t,size:n,byteOffset:i.byte_offset,byteStride:i.byte_stride,normalized:i.normalized}}}return r}_getTriangleListIndices(e){let t=e.num_faces()*3,n=t*fm,r=this.draco._malloc(n);try{return this.decoder.GetTrianglesUInt32Array(e,n,r),new Uint32Array(this.draco.HEAPF32.buffer,r,t).slice()}finally{this.draco._free(r)}}_getTriangleStripIndices(e){let t=new this.draco.DracoInt32Array;try{return this.decoder.GetTriangleStripsFromMesh(e,t),gm(t)}finally{this.draco.destroy(t)}}_getAttributeValues(e,t){let n=dm[t.data_type];if(!n)return console.warn(`DRACO: Unsupported attribute type ${t.data_type}`),null;let r=t.num_components,i=e.num_points()*r,a=i*n.BYTES_PER_ELEMENT,o=mm(this.draco,n),s,c=this.draco._malloc(a);try{let r=this.decoder.GetAttribute(e,t.attribute_index);this.decoder.GetAttributeDataArrayForAllPoints(e,r,o,a,c),s=new n(this.draco.HEAPF32.buffer,c,i).slice()}finally{this.draco._free(c)}return{value:s,size:r}}_deduceAttributeName(e,t){let n=e.unique_id;for(let[e,r]of Object.entries(t.extraAttributes||{}))if(r===n)return e;let r=e.attribute_type;for(let e in um)if(this.draco[e]===r)return um[e];let i=t.attributeNameEntry||`name`;return e.metadata[i]?e.metadata[i].string:`CUSTOM_ATTRIBUTE_${n}`}_getTopLevelMetadata(e){let t=this.decoder.GetMetadata(e);return this._getDracoMetadata(t)}_getAttributeMetadata(e,t){let n=this.decoder.GetAttributeMetadata(e,t);return this._getDracoMetadata(n)}_getDracoMetadata(e){if(!e||!e.ptr)return{};let t={},n=this.metadataQuerier.NumEntries(e);for(let r=0;r<n;r++){let n=this.metadataQuerier.GetEntryName(e,r);t[n]=this._getDracoMetadataField(e,n)}return t}_getDracoMetadataField(e,t){let n=new this.draco.DracoInt32Array;try{this.metadataQuerier.GetIntEntryArray(e,t,n);let r=hm(n);return{int:this.metadataQuerier.GetIntEntry(e,t),string:this.metadataQuerier.GetStringEntry(e,t),double:this.metadataQuerier.GetDoubleEntry(e,t),intArray:r}}finally{this.draco.destroy(n)}}_disableAttributeTransforms(e){let{quantizedAttributes:t=[],octahedronAttributes:n=[]}=e,r=[...t,...n];for(let e of r)this.decoder.SkipAttributeTransform(this.draco[e])}_getQuantizationTransform(e,t){let{quantizedAttributes:n=[]}=t,r=e.attribute_type();if(n.map(e=>this.decoder[e]).includes(r)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits(),range:t.range(),min_values:new Float32Array([1,2,3]).map(e=>t.min_value(e))}}finally{this.draco.destroy(t)}}return null}_getOctahedronTransform(e,t){let{octahedronAttributes:n=[]}=t,r=e.attribute_type();if(n.map(e=>this.decoder[e]).includes(r)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits()}}finally{this.draco.destroy(t)}}return null}};function mm(e,t){switch(t){case Float32Array:return e.DT_FLOAT32;case Int8Array:return e.DT_INT8;case Int16Array:return e.DT_INT16;case Int32Array:return e.DT_INT32;case Uint8Array:return e.DT_UINT8;case Uint16Array:return e.DT_UINT16;case Uint32Array:return e.DT_UINT32;default:return e.DT_INVALID}}function hm(e){let t=e.size(),n=new Int32Array(t);for(let r=0;r<t;r++)n[r]=e.GetValue(r);return n}function gm(e){let t=e.size(),n=new Int32Array(t);for(let r=0;r<t;r++)n[r]=e.GetValue(r);return n}var _m={dataType:null,batchType:null,name:`Draco`,id:`draco`,module:`draco`,version:tm,worker:!0,extensions:[`drc`],mimeTypes:[`application/octet-stream`],binary:!0,tests:[`DRACO`],options:{draco:{decoderType:typeof WebAssembly==`object`?`wasm`:`js`,extraAttributes:{},attributeNameEntry:void 0}},parse:vm};async function vm(e,t){let{draco:n}=await Zp(fl(t),t?.draco?.decoderType||`wasm`),r=new pm(n);try{return r.parseSync(e,t?.draco)}finally{r.destroy()}}function ym(e){let t={};for(let n in e){let r=e[n];n!==`indices`&&(t[n]=bm(r))}return t}function bm(e){let{buffer:t,size:n,count:r}=xm(e);return{value:t,size:n,byteOffset:0,count:r,type:Uu(n),componentType:Wu(t)}}function xm(e){let t=e,n=1,r=0;return e&&e.value&&(t=e.value,n=e.size||1),t&&(ArrayBuffer.isView(t)||(t=Sm(t,Float32Array)),r=t.length/n),{buffer:t,size:n,count:r}}function Sm(e,t,n=!1){return e?Array.isArray(e)||n&&!(e instanceof t)?new t(e):e:null}var Cm=e({decode:()=>Dm,encode:()=>Om,name:()=>Tm,preprocess:()=>Em}),wm=`KHR_draco_mesh_compression`,Tm=wm;function Em(e,t,n){let r=new K(e);for(let e of Mm(r))r.getObjectExtension(e,wm)}async function Dm(e,t,n){if(!t?.gltf?.decompressMeshes)return;let r=new K(e),i=[];for(let e of Mm(r))r.getObjectExtension(e,wm)&&i.push(km(r,e,t,n));await Promise.all(i),r.removeExtension(wm)}function Om(e,t={}){let n=new K(e);for(let e of n.json.meshes||[])Am(e,t),n.addRequiredExtension(wm)}async function km(e,t,n,r){let i=e.getObjectExtension(t,wm);if(!i)return;let a=e.getTypedArrayForBufferView(i.bufferView),o=Ol(a.buffer,a.byteOffset),s={...n};delete s[`3d-tiles`];let c=await vc(o,_m,s,r),l=ym(c.attributes);for(let[n,r]of Object.entries(l))if(n in t.attributes){let i=t.attributes[n],a=e.getAccessor(i);a?.min&&a?.max&&(r.min=a.min,r.max=a.max)}t.attributes=l,c.indices&&(t.indices=bm(c.indices)),e.removeObjectExtension(t,wm),jm(t)}function Am(e,t,n=4,r,i){if(!r.DracoWriter)throw Error(`options.gltf.DracoWriter not provided`);let a=r.DracoWriter.encodeSync({attributes:e}),o=i?.parseSync?.({attributes:e}),s=r._addFauxAttributes(o.attributes),c=r.addBufferView(a);return{primitives:[{attributes:s,mode:n,extensions:{[wm]:{bufferView:c,attributes:s}}}]}}function jm(e){if(!e.attributes&&Object.keys(e.attributes).length>0)throw Error(`glTF: Empty primitive detected: Draco decompression failure?`)}function*Mm(e){for(let t of e.json.meshes||[])for(let e of t.primitives)yield e}var Nm=e({decode:()=>zm,name:()=>Fm}),Pm=`KHR_texture_transform`,Fm=Pm,Im=new s,Lm=new Oe,Rm=new Oe;async function zm(e,t){if(!new K(e).hasExtension(Pm)||!t.gltf?.loadBuffers)return;let n=e.json.materials||[];for(let t=0;t<n.length;t++)Bm(t,e)}function Bm(e,t){let n=t.json.materials?.[e],r=[n?.pbrMetallicRoughness?.baseColorTexture,n?.emissiveTexture,n?.normalTexture,n?.occlusionTexture,n?.pbrMetallicRoughness?.metallicRoughnessTexture],i=[];for(let n of r)n&&n?.extensions?.[Pm]&&Vm(t,e,n,i)}function Vm(e,t,n,r){let i=Hm(n,r);if(!i)return;let a=e.json.meshes||[];for(let n of a)for(let r of n.primitives){let n=r.material;Number.isFinite(n)&&t===n&&Um(e,r,i)}}function Hm(e,t){let n=e.extensions?.[Pm],{texCoord:r=0}=e,{texCoord:i=r}=n;if(t.findIndex(([e,t])=>e===r&&t===i)===-1){let a=Km(n);return r!==i&&(e.texCoord=i),t.push([r,i]),{originalTexCoord:r,texCoord:i,matrix:a}}return null}function Um(e,t,n){let{originalTexCoord:r,texCoord:i,matrix:a}=n,o=t.attributes[`TEXCOORD_${r}`];if(Number.isFinite(o)){let n=e.json.accessors?.[o];if(n&&n.bufferView!==void 0){let o=e.json.bufferViews?.[n.bufferView];if(o){let{arrayBuffer:s,byteOffset:c}=e.buffers[o.buffer],l=(c||0)+(n.byteOffset||0)+(o.byteOffset||0),{ArrayType:u,length:d}=Gu(n,o),f=Iu[n.componentType],p=Fu[n.type],m=o.byteStride||f*p,h=new Float32Array(d);for(let e=0;e<n.count;e++){let t=new u(s,l+e*m,2);Im.set(t[0],t[1],1),Im.transformByMatrix3(a),h.set([Im[0],Im[1]],e*p)}r===i?Wm(n,e,h,n.bufferView):Gm(i,n,t,e,h)}}}}function Wm(e,t,n,r){e.componentType=5126,e.byteOffset=0;let i=(t.json.accessors||[]).reduce((e,t)=>t.bufferView===r?e+1:e,0)>1;t.buffers.push({arrayBuffer:Bl(n.buffer),byteOffset:0,byteLength:n.buffer.byteLength});let a=t.buffers.length-1;if(t.json.bufferViews=t.json.bufferViews||[],i){t.json.bufferViews.push({buffer:a,byteLength:n.buffer.byteLength,byteOffset:0}),e.bufferView=t.json.bufferViews.length-1;return}let o=t.json.bufferViews[r];o&&(o.buffer=a,o.byteOffset=0,o.byteLength=n.buffer.byteLength,o.byteStride!==void 0&&delete o.byteStride)}function Gm(e,t,n,r,i){r.buffers.push({arrayBuffer:Bl(i.buffer),byteOffset:0,byteLength:i.buffer.byteLength}),r.json.bufferViews=r.json.bufferViews||[];let a=r.json.bufferViews;a.push({buffer:r.buffers.length-1,byteLength:i.buffer.byteLength,byteOffset:0});let o=r.json.accessors;o&&(o.push({bufferView:a?.length-1,byteOffset:0,componentType:5126,count:t.count,type:`VEC2`}),n.attributes[`TEXCOORD_${e}`]=o.length-1)}function Km(e){let{offset:t=[0,0],rotation:n=0,scale:r=[1,1]}=e,i=new Oe().set(1,0,0,0,1,0,t[0],t[1],1),a=Lm.set(Math.cos(n),Math.sin(n),0,-Math.sin(n),Math.cos(n),0,0,0,1),o=Rm.set(r[0],0,0,0,r[1],0,0,0,1);return i.multiplyRight(a).multiplyRight(o)}var qm=e({decode:()=>Xm,encode:()=>Zm,name:()=>Ym}),Jm=`KHR_lights_punctual`,Ym=Jm;async function Xm(e){let t=new K(e),{json:n}=t,r=t.getExtension(Jm);r&&(t.json.lights=r.lights,t.removeExtension(Jm));for(let e of n.nodes||[]){let n=t.getObjectExtension(e,Jm);n&&(e.light=n.light),t.removeObjectExtension(e,Jm)}}async function Zm(e){let t=new K(e),{json:n}=t;if(n.lights){let e=t.addExtension(Jm);G(!e.lights),e.lights=n.lights,delete n.lights}if(t.json.lights){for(let e of t.json.lights){let n=e.node;t.addObjectExtension(n,Jm,e)}delete t.json.lights}}var Qm=e({decode:()=>th,encode:()=>nh,name:()=>eh}),$m=`KHR_materials_unlit`,eh=$m;async function th(e){let t=new K(e),{json:n}=t;for(let e of n.materials||[])e.extensions&&e.extensions.KHR_materials_unlit&&(e.unlit=!0),t.removeObjectExtension(e,$m);t.removeExtension($m)}function nh(e){let t=new K(e),{json:n}=t;if(t.materials)for(let e of n.materials||[])e.unlit&&(delete e.unlit,t.addObjectExtension(e,$m,{}),t.addExtension($m))}var rh=e({decode:()=>oh,encode:()=>sh,name:()=>ah}),ih=`KHR_techniques_webgl`,ah=ih;async function oh(e){let t=new K(e),{json:n}=t,r=t.getExtension(ih);if(r){let e=ch(r,t);for(let r of n.materials||[]){let n=t.getObjectExtension(r,ih);n&&(r.technique=Object.assign({},n,e[n.technique]),r.technique.values=lh(r.technique,t)),t.removeObjectExtension(r,ih)}t.removeExtension(ih)}}async function sh(e,t){}function ch(e,t){let{programs:n=[],shaders:r=[],techniques:i=[]}=e,a=new TextDecoder;return r.forEach(e=>{if(Number.isFinite(e.bufferView))e.code=a.decode(t.getTypedArrayForBufferView(e.bufferView));else throw Error(`KHR_techniques_webgl: no shader code`)}),n.forEach(e=>{e.fragmentShader=r[e.fragmentShader],e.vertexShader=r[e.vertexShader]}),i.forEach(e=>{e.program=n[e.program]}),i}function lh(e,t){let n=Object.assign({},e.values);return Object.keys(e.uniforms||{}).forEach(t=>{e.uniforms[t].value&&!(t in n)&&(n[t]=e.uniforms[t].value)}),Object.keys(n).forEach(e=>{typeof n[e]==`object`&&n[e].index!==void 0&&(n[e].texture=t.getTexture(n[e].index))}),n}var uh=[bd,ld,Fp,Mp,Rp,Hp,Cm,qm,Qm,rh,Nm,Qd];function dh(e,t={},n){let r=uh.filter(e=>ph(e.name,t));for(let i of r)i.preprocess?.(e,t,n)}async function fh(e,t={},n){let r=uh.filter(e=>ph(e.name,t));for(let i of r)await i.decode?.(e,t,n)}function ph(e,t){let n=t?.gltf?.excludeExtensions||{};return!(e in n&&!n[e])}var mh=`KHR_binary_glTF`;function hh(e){let t=new K(e),{json:n}=t;for(let e of n.images||[]){let n=t.getObjectExtension(e,mh);n&&Object.assign(e,n),t.removeObjectExtension(e,mh)}n.buffers&&n.buffers[0]&&delete n.buffers[0].uri,t.removeExtension(mh)}var gh={accessors:`accessor`,animations:`animation`,buffers:`buffer`,bufferViews:`bufferView`,images:`image`,materials:`material`,meshes:`mesh`,nodes:`node`,samplers:`sampler`,scenes:`scene`,skins:`skin`,textures:`texture`},_h={accessor:`accessors`,animations:`animation`,buffer:`buffers`,bufferView:`bufferViews`,image:`images`,material:`materials`,mesh:`meshes`,node:`nodes`,sampler:`samplers`,scene:`scenes`,skin:`skins`,texture:`textures`},vh=class{idToIndexMap={animations:{},accessors:{},buffers:{},bufferViews:{},images:{},materials:{},meshes:{},nodes:{},samplers:{},scenes:{},skins:{},textures:{}};json;normalize(e,t){this.json=e.json;let n=e.json;switch(n.asset&&n.asset.version){case`2.0`:return;case void 0:case`1.0`:break;default:console.warn(`glTF: Unknown version ${n.asset.version}`);return}if(!t.normalize)throw Error(`glTF v1 is not supported.`);console.warn(`Converting glTF v1 to glTF v2 format. This is experimental and may fail.`),this._addAsset(n),this._convertTopLevelObjectsToArrays(n),hh(e),this._convertObjectIdsToArrayIndices(n),this._updateObjects(n),this._updateMaterial(n)}_addAsset(e){e.asset=e.asset||{},e.asset.version=`2.0`,e.asset.generator=e.asset.generator||`Normalized to glTF 2.0 by loaders.gl`}_convertTopLevelObjectsToArrays(e){for(let t in gh)this._convertTopLevelObjectToArray(e,t)}_convertTopLevelObjectToArray(e,t){let n=e[t];if(!(!n||Array.isArray(n))){e[t]=[];for(let r in n){let i=n[r];i.id=i.id||r;let a=e[t].length;e[t].push(i),this.idToIndexMap[t][r]=a}}}_convertObjectIdsToArrayIndices(e){for(let t in gh)this._convertIdsToIndices(e,t);`scene`in e&&(e.scene=this._convertIdToIndex(e.scene,`scene`));for(let t of e.textures)this._convertTextureIds(t);for(let t of e.meshes)this._convertMeshIds(t);for(let t of e.nodes)this._convertNodeIds(t);for(let t of e.scenes)this._convertSceneIds(t)}_convertTextureIds(e){e.source&&=this._convertIdToIndex(e.source,`image`)}_convertMeshIds(e){for(let t of e.primitives){let{attributes:e,indices:n,material:r}=t;for(let t in e)e[t]=this._convertIdToIndex(e[t],`accessor`);n&&(t.indices=this._convertIdToIndex(n,`accessor`)),r&&(t.material=this._convertIdToIndex(r,`material`))}}_convertNodeIds(e){e.children&&=e.children.map(e=>this._convertIdToIndex(e,`node`)),e.meshes&&=e.meshes.map(e=>this._convertIdToIndex(e,`mesh`))}_convertSceneIds(e){e.nodes&&=e.nodes.map(e=>this._convertIdToIndex(e,`node`))}_convertIdsToIndices(e,t){e[t]||(console.warn(`gltf v1: json doesn't contain attribute ${t}`),e[t]=[]);for(let n of e[t])for(let e in n){let t=n[e];n[e]=this._convertIdToIndex(t,e)}}_convertIdToIndex(e,t){let n=_h[t];if(n in this.idToIndexMap){let r=this.idToIndexMap[n][e];if(!Number.isFinite(r))throw Error(`gltf v1: failed to resolve ${t} with id ${e}`);return r}return e}_updateObjects(e){for(let e of this.json.buffers)delete e.type}_updateMaterial(e){for(let t of e.materials){t.pbrMetallicRoughness={baseColorFactor:[1,1,1,1],metallicFactor:1,roughnessFactor:1};let n=t.values?.tex||t.values?.texture2d_0||t.values?.diffuseTex,r=e.textures.findIndex(e=>e.id===n);r!==-1&&(t.pbrMetallicRoughness.baseColorTexture={index:r})}}};function yh(e,t={}){return new vh().normalize(e,t)}function bh(e,t){let n=e.basis,r=n?.format;return{...e,core:{...e.core,mimeType:t},basis:{...n,format:r&&r!==`auto`?r:ip(n?.supportedTextureFormats)}}}async function xh(e,t,n=0,r,i){return Sh(e,t,n,r),yh(e,{normalize:r?.gltf?.normalize}),dh(e,r,i),r?.gltf?.loadBuffers&&e.json.buffers&&await Ch(e,r,i),r?.gltf?.loadImages&&await wh(e,r,i),await fh(e,r,i),e}function Sh(e,t,n,r){if(r.core?.baseUrl&&(e.baseUri=r.core?.baseUrl),t instanceof ArrayBuffer&&!_p(t,n,r.glb)&&(t=new TextDecoder().decode(t)),typeof t==`string`)e.json=wl(t);else if(t instanceof ArrayBuffer){let i={};n=vp(i,t,n,r.glb),G(i.type===`glTF`,`Invalid GLB magic string ${i.type}`),e._glb=i,e.json=i.json}else G(!1,`GLTF: must be ArrayBuffer or string`);let i=e.json.buffers||[];if(e.buffers=Array(i.length).fill(null),e._glb&&e._glb.header.hasBinChunk){let{binChunks:t}=e._glb;e.buffers[0]={arrayBuffer:t[0].arrayBuffer,byteOffset:t[0].byteOffset,byteLength:t[0].byteLength}}let a=e.json.images||[];e.images=Array(a.length).fill({})}async function Ch(e,t,n){let r=e.json.buffers||[];for(let i=0;i<r.length;++i){let a=r[i];if(a.uri){let{fetch:r}=n;G(r);let o=wp(a.uri,t,n),s=await(await n?.fetch?.(o))?.arrayBuffer?.();e.buffers[i]={arrayBuffer:s,byteOffset:0,byteLength:s.byteLength},delete a.uri}else e.buffers[i]===null&&(e.buffers[i]={arrayBuffer:new ArrayBuffer(a.byteLength),byteOffset:0,byteLength:a.byteLength})}}async function wh(e,t,n){let r=Th(e),i=e.json.images||[],a=[];for(let o of r)a.push(Eh(e,i[o],o,t,n));return await Promise.all(a)}function Th(e){let t=new Set,n=e.json.textures||[];for(let e of n)e.source!==void 0&&t.add(e.source);return Array.from(t).sort()}async function Eh(e,t,n,r,i){let a;if(t.uri&&!t.hasOwnProperty(`bufferView`)){let e=wp(t.uri,r,i),{fetch:n}=i;a=await(await n(e)).arrayBuffer(),t.bufferView={data:a}}if(Number.isFinite(t.bufferView)){let n=Ku(e.json,e.buffers,t.bufferView);a=Ol(n.buffer,n.byteOffset,n.byteLength)}G(a,`glTF image has no data`);let o=bh(r,t.mimeType),s=await vc(a,[ku,op],o,i);s&&s[0]&&(s={compressed:!0,mipmaps:!1,width:s[0].width,height:s[0].height,data:s[0]}),e.images=e.images||[],e.images[n]=s}var Dh={dataType:null,batchType:null,name:`glTF`,id:`gltf`,module:`gltf`,version:_f,extensions:[`gltf`,`glb`],mimeTypes:[`model/gltf+json`,`model/gltf-binary`],text:!0,binary:!0,tests:[`glTF`],parse:Oh,options:{gltf:{normalize:!0,loadBuffers:!0,loadImages:!0,decompressMeshes:!0}}};async function Oh(e,t={},n){let r={...Dh.options,...t};return r.gltf={...Dh.options.gltf,...r.gltf},await xh({},e,t?.glb?.byteOffset||0,r,n)}var kh={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Ah={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Y={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},jh={magFilter:Y.TEXTURE_MAG_FILTER,minFilter:Y.TEXTURE_MIN_FILTER,wrapS:Y.TEXTURE_WRAP_S,wrapT:Y.TEXTURE_WRAP_T},Mh={[Y.TEXTURE_MAG_FILTER]:Y.LINEAR,[Y.TEXTURE_MIN_FILTER]:Y.NEAREST_MIPMAP_LINEAR,[Y.TEXTURE_WRAP_S]:Y.REPEAT,[Y.TEXTURE_WRAP_T]:Y.REPEAT};function Nh(){return{id:`default-sampler`,parameters:Mh}}function Ph(e){return Ah[e]}function Fh(e){return kh[e]}var Ih=class{baseUri=``;jsonUnprocessed;json;buffers=[];images=[];postProcess(e,t={}){let{json:n,buffers:r=[],images:i=[]}=e,{baseUri:a=``}=e;return G(n),this.baseUri=a,this.buffers=r,this.images=i,this.jsonUnprocessed=n,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){let n={...e};return this.json=n,e.bufferViews&&(n.bufferViews=e.bufferViews.map((e,t)=>this._resolveBufferView(e,t))),e.images&&(n.images=e.images.map((e,t)=>this._resolveImage(e,t))),e.samplers&&(n.samplers=e.samplers.map((e,t)=>this._resolveSampler(e,t))),e.textures&&(n.textures=e.textures.map((e,t)=>this._resolveTexture(e,t))),e.accessors&&(n.accessors=e.accessors.map((e,t)=>this._resolveAccessor(e,t))),e.materials&&(n.materials=e.materials.map((e,t)=>this._resolveMaterial(e,t))),e.meshes&&(n.meshes=e.meshes.map((e,t)=>this._resolveMesh(e,t))),e.nodes&&(n.nodes=e.nodes.map((e,t)=>this._resolveNode(e,t)),n.nodes=n.nodes.map((e,t)=>this._resolveNodeChildren(e))),e.skins&&(n.skins=e.skins.map((e,t)=>this._resolveSkin(e,t))),e.scenes&&(n.scenes=e.scenes.map((e,t)=>this._resolveScene(e,t))),typeof this.json.scene==`number`&&n.scenes&&(n.scene=n.scenes[this.json.scene]),n}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t==`object`)return t;let n=e&&e[t];return n||console.warn(`glTF file error: Could not find ${e}[${t}]`),n}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(e=>this.getNode(e))}}_resolveNode(e,t){let n={...e,id:e?.id||`node-${t}`};return e.mesh!==void 0&&(n.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(n.camera=this.getCamera(e.camera)),e.skin!==void 0&&(n.skin=this.getSkin(e.skin)),e.meshes!==void 0&&e.meshes.length&&(n.mesh=e.meshes.reduce((e,t)=>{let n=this.getMesh(t);return e.id=n.id,e.primitives=e.primitives.concat(n.primitives),e},{primitives:[]})),n}_resolveNodeChildren(e){return e.children&&=e.children.map(e=>this.getNode(e)),e}_resolveSkin(e,t){let n=typeof e.inverseBindMatrices==`number`?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:n}}_resolveMesh(e,t){let n={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(n.primitives=e.primitives.map((e,t)=>{let r={...e,attributes:{},indices:void 0,material:void 0},i=e.attributes;for(let e in i)r.attributes[e]=this.getAccessor(i[e]);return e.indices!==void 0&&(r.indices=this.getAccessor(e.indices)),e.material!==void 0&&(r.material=this.getMaterial(e.material)),Lh(r,n.id,t)})),n}_resolveMaterial(e,t){let n={...e,id:e.id||`material-${t}`};if(n.normalTexture&&(n.normalTexture={...n.normalTexture},n.normalTexture.texture=this.getTexture(n.normalTexture.index)),n.occlusionTexture&&(n.occlusionTexture={...n.occlusionTexture},n.occlusionTexture.texture=this.getTexture(n.occlusionTexture.index)),n.emissiveTexture&&(n.emissiveTexture={...n.emissiveTexture},n.emissiveTexture.texture=this.getTexture(n.emissiveTexture.index)),n.emissiveFactor||=n.emissiveTexture?[1,1,1]:[0,0,0],n.pbrMetallicRoughness){n.pbrMetallicRoughness={...n.pbrMetallicRoughness};let e=n.pbrMetallicRoughness;e.baseColorTexture&&(e.baseColorTexture={...e.baseColorTexture},e.baseColorTexture.texture=this.getTexture(e.baseColorTexture.index)),e.metallicRoughnessTexture&&(e.metallicRoughnessTexture={...e.metallicRoughnessTexture},e.metallicRoughnessTexture.texture=this.getTexture(e.metallicRoughnessTexture.index))}return n}_resolveAccessor(e,t){let n=Ph(e.componentType),r=Fh(e.type),i=n*r,a={...e,id:e.id||`accessor-${t}`,bytesPerComponent:n,components:r,bytesPerElement:i,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(a.bufferView=this.getBufferView(e.bufferView)),a.bufferView){let e=a.bufferView.buffer,{ArrayType:t,byteLength:n}=Gu(a,a.bufferView),r=(a.bufferView.byteOffset||0)+(a.byteOffset||0)+e.byteOffset,i=Vl(e.arrayBuffer,r,n);a.bufferView.byteStride&&(i=this._getValueFromInterleavedBuffer(e,r,a.bufferView.byteStride,a.bytesPerElement,a.count)),a.value=new t(i)}else{let{ArrayType:e}=Gu(a,{byteLength:a.count*a.bytesPerElement});a.value=new e(a.count*a.components)}return e.sparse&&this._applySparseAccessor(a,e.sparse),a}_applySparseAccessor(e,t){let n=Rh(t.indices.componentType),r=this._getTypedArrayFromBufferView(n,this.getBufferView(t.indices.bufferView),t.indices.byteOffset||0,t.count),i=e.value.constructor,a=this._getTypedArrayFromBufferView(i,this.getBufferView(t.values.bufferView),t.values.byteOffset||0,t.count*e.components);for(let n=0;n<t.count;n++){let t=Number(r[n]);G(Number.isInteger(t)&&t>=0&&t<e.count,`glTF sparse accessor index is out of bounds`);for(let r=0;r<e.components;r++){let i=t*e.components+r,o=n*e.components+r;Reflect.set(e.value,i,a[o])}}}_getTypedArrayFromBufferView(e,t,n,r){let i=r*e.BYTES_PER_ELEMENT;G(n+i<=t.byteLength,`glTF sparse accessor data exceeds its buffer view`);let a=t.buffer,o=a.byteOffset+(t.byteOffset||0)+n;return new e(Vl(a.arrayBuffer,o,i))}_getValueFromInterleavedBuffer(e,t,n,r,i){let a=new Uint8Array(i*r);for(let o=0;o<i;o++){let i=t+o*n;a.set(new Uint8Array(e.arrayBuffer.slice(i,i+r)),o*r)}return a.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler==`number`?this.getSampler(e.sampler):Nh(),source:typeof e.source==`number`?this.getImage(e.source):void 0}}_resolveSampler(e,t){let n={id:e.id||`sampler-${t}`,...e,parameters:{}};for(let e in n){let t=this._enumSamplerParameter(e);t!==void 0&&(n.parameters[t]=n[e])}return n}_enumSamplerParameter(e){return jh[e]}_resolveImage(e,t){let n={...e,id:e.id||`image-${t}`,image:null,bufferView:e.bufferView===void 0?void 0:this.getBufferView(e.bufferView)},r=this.images[t];return r&&(n.image=r),n}_resolveBufferView(e,t){let n=e.buffer,r=this.buffers[n].arrayBuffer,i=this.buffers[n].byteOffset||0;return e.byteOffset&&(i+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[n],data:new Uint8Array(r,i,e.byteLength)}}_resolveCamera(e,t){let n={...e,id:e.id||`camera-${t}`};return n.perspective,n.orthographic,n}};function Lh(e,t,n){if(e.mode!==2&&e.mode!==6)return e;let r=e.indices?.value,i=e.indices?.count??zh(e),a=Bh(r,i),o=a<=65535?Uint16Array:Uint32Array,s=e.mode===2?Uh(r,i,o):Wh(r,i,o);return e.mode=e.mode===2?1:4,e.indices={id:`${t}-primitive-${n}-portable-indices`,components:1,bytesPerComponent:o.BYTES_PER_ELEMENT,bytesPerElement:o.BYTES_PER_ELEMENT,componentType:o===Uint16Array?5123:5125,normalized:!1,count:s.length,type:`SCALAR`,min:s.length?[Vh(s)]:void 0,max:s.length?[a]:void 0,value:s},e}function Rh(e){switch(e){case 5121:return Uint8Array;case 5123:return Uint16Array;case 5125:return Uint32Array;default:throw Error(`Invalid glTF sparse index component type ${e}`)}}function zh(e){let t=Object.values(e.attributes)[0];return G(t,`glTF primitive must define at least one attribute`),t.count}function Bh(e,t){if(!e)return Math.max(0,t-1);let n=0;for(let r=0;r<t;r++)n=Math.max(n,Number(e[r]));return n}function Vh(e){let t=1/0;for(let n of e)t=Math.min(t,n);return t}function Hh(e,t){return e?Number(e[t]):t}function Uh(e,t,n){if(t<2)return new n(0);let r=new n(t*2);for(let n=0;n<t;n++)r[n*2]=Hh(e,n),r[n*2+1]=Hh(e,(n+1)%t);return r}function Wh(e,t,n){let r=Math.max(0,t-2),i=new n(r*3);for(let t=0;t<r;t++)i[t*3]=Hh(e,0),i[t*3+1]=Hh(e,t+1),i[t*3+2]=Hh(e,t+2);return i}function Gh(e,t){return new Ih().postProcess(e,t)}var Kh={alphaCutoff:`alphaCutoff`,anisotropyRotation:`anisotropyRotation`,anisotropyStrength:`anisotropyStrength`,attenuationColor:`attenuationColor`,attenuationDistance:`attenuationDistance`,baseColorFactor:`baseColor`,clearcoatFactor:`clearcoat`,clearcoatRoughnessFactor:`clearcoatRoughness`,bumpFactor:`bumpFactor`,diffuseTransmissionFactor:`diffuseTransmission`,diffuseTransmissionColorFactor:`diffuseTransmissionColor`,dispersion:`dispersion`,emissiveFactor:`emissive`,emissiveStrength:`emissiveStrength`,ior:`indexOfRefraction`,iridescenceFactor:`iridescence`,iridescenceIor:`iridescenceIndexOfRefraction`,normalScale:`normalScale`,multiscatterColorFactor:`multiscatterColor`,scatterAnisotropy:`scatterAnisotropy`,occlusionStrength:`occlusionStrength`,sheenColorFactor:`sheenColor`,sheenRoughnessFactor:`sheenRoughness`,specularColorFactor:`specularColor`,specularIntensityFactor:`specularIntensity`,thicknessFactor:`thickness`,transmissionFactor:`transmission`};function qh(e,t={}){return e.flatMap(e=>{let n=e.channels.flatMap(e=>Xh(e,t));return n.length>0?[{name:e.name,tracks:n}]:[]})}function Jh(e,t){let n=e.nodes||{},r=new Map,i=new Map,a=new Map,o=!1,s;for(let[e,t]of Object.entries(n)){let n=new T({id:e,...t.translation?{position:[...t.translation]}:{},...t.rotation?{rotation:[...t.rotation]}:{},...t.scale?{scale:[...t.scale]}:{},...t.matrix?{matrix:[...t.matrix]}:{}});t.weights&&(n.userData.morphWeights=[...t.weights]),r.set(e,n)}for(let[e,t]of Object.entries(n))t.parent&&r.get(t.parent)?.add(r.get(e));let u=(e,t,n)=>{let r=i.get(e)||{};if(t.component!==void 0){let i=e.getParameters(),a=r[t.path]||i[t.path],o=Array.isArray(a)?[...a]:[];o[t.component]=n[0],r[t.path]=o}else r[t.path]=n.length===1?n[0]:[...n];i.set(e,r)},d=e=>{let{target:s}=e,c=`${s.type}:${s.identifier}:${s.path}:${s.component??`*`}`;if(s.type===`node`){let e=r.get(s.identifier);return e?{id:c,getValue:()=>s.path===`translation`?e.position:s.path===`rotation`?e.rotation:s.path===`scale`?e.scale:e.userData.morphWeights||[],setValue:r=>{if(s.path===`translation`)e.setPosition(r);else if(s.path===`rotation`)e.setRotation(r);else if(s.path===`scale`)e.setScale(r);else if(s.path===`weights`){e.userData.morphWeights=[...r];for(let e of n[s.identifier]?.geometries||[]){let n=t.geometries?.get(e);if(n){let e=i.get(n)||{};e.morphWeights=[...r],i.set(n,e)}}return}e.updateMatrix(),o=!0}}:null}if(s.type===`sampler`){let n=t.samplers?.get(s.identifier);if(!n)return null;let r=e.baseTransform||{offset:[0,0],rotation:0,scale:[1,1]},o=a.get(s.identifier);o||(o={offset:[...r.offset],rotation:r.rotation,scale:[...r.scale]},a.set(s.identifier,o));let l=o;return{id:c,setValue:e=>{s.path===`rotation`?l.rotation=e[0]:(s.path===`offset`||s.path===`scale`)&&(s.component===void 0?l[s.path]=[e[0],e[1]]:l[s.path][s.component]=e[0]);let t=i.get(n)||{};t.transform=Ss(l),i.set(n,t)}}}let l=s.type===`instance`?t.instances.get(s.identifier):s.type===`material`?t.materials?.get(s.identifier):s.type===`light`?t.lights?.get(s.identifier):s.type===`camera`?t.camera:void 0;return l?{id:c,getValue:()=>{let e=l.getParameters()[s.path];return Array.isArray(e)?s.component===void 0?e:[e[s.component]||0]:typeof e==`number`?[e]:[]},setValue:e=>u(l,s,e)}:null},f=(e.clips||[]).map(e=>{let t=e.tracks.flatMap(e=>{let t=d(e);return t?[new h({name:`${e.target.type}:${e.target.identifier}:${e.target.path}`,times:e.times,values:e.values,interpolation:e.interpolation,valueType:e.target.path===`rotation`&&e.target.type===`node`?`quaternion`:`vector`,binding:t})]:[]});return new l({name:e.name,tracks:t,duration:e.duration})}),m=new g(f),_=e.playback?.clip||f[0]?.name;if(_){let t=m.clipAction(_,{loop:e.playback?.loop,timeScale:e.playback?.speed});t.play(),e.playback?.playing===!1&&t.pause()}let v=(e,a)=>{let o=r.get(e);if(!o)return;let s=new p(a).multiplyRight(o.matrix);for(let r of n[e]?.instances||[]){let e=t.instances.get(r);if(e){let t=i.get(e)||{};t.transform=Array.from(s),i.set(e,t)}}for(let[t,r]of Object.entries(n))r.parent===e&&v(t,s)},y=()=>{if(!t.skins?.size)return;let e=new Map;for(let[t,i]of Object.entries(n))i.parent||r.get(t)?.preorderTraversal((t,{worldMatrix:n})=>{t instanceof T&&e.set(t,new p(n))});for(let[n,a]of t.skins){let t=r.get(a.node),o=a.joints.flatMap(e=>{let t=r.get(e);return t?[t]:[]});if(!t||o.length!==a.joints.length)continue;let s=c({joints:o,meshNode:t,worldMatrices:e,inverseBindMatrices:a.inverseBindMatrices}),l=n.getParameter(`skin`)?.jointMatrices;if(l?.length===s.length&&s.every((e,t)=>e===l[t]))continue;let u=i.get(n)||{};u.skin={jointMatrices:s},i.set(n,u)}},b=()=>{if(o){for(let[e,t]of Object.entries(n))t.parent||v(e,new p);y(),o=!1}for(let[e,t]of i){let n=e.getParameters(),r=Object.fromEntries(Object.entries(t).filter(([e,t])=>!Yh(n[e],t)));Object.keys(r).length!==0&&(e.type===`geometry`||e.type===`material`||e.type===`light`||e.type===`camera`||e.type===`surface`?e.setParameters(r):(e.type===`sampler`||e.type===`instance`)&&e.setParameter(`transform`,r.transform),e.commitParameters())}i.clear()};return t.skins?.size&&(y(),b()),{mixer:m,clipNames:f.map(e=>e.name),get activeClip(){return _},update(e){let t=s===void 0?0:e-s;s=e,m.update(t),b()},selectClip(e){_&&_!==e&&m.getAction(_)?.stop(),_=e,m.clipAction(e).play(),b()},play(){_&&m.clipAction(_).play()},pause(){_&&m.clipAction(_).pause()},seek(e){let t=_?m.getAction(_):void 0;t?(t.setTime(e),m.time=e,m.update(0)):m.setTime(e),b()},setSpeed(e){_&&m.clipAction(_).setEffectiveTimeScale(e)}}}function Yh(e,t){return Array.isArray(e)&&Array.isArray(t)?e.length===t.length&&e.every((e,n)=>e===t[n]):e===t}function Xh(e,t){let n,r;if(e.type===`node`)n={type:`node`,identifier:t.nodeIdentifiers?.[e.targetNodeId]||e.targetNodeId,path:e.path};else if(e.type===`material`){let r=t.materialIdentifiers?.[e.targetMaterialIndex];if(!r)return[];let i=e.property===`baseColorFactor`&&e.component===3;if(i&&t.materialAlphaModes?.[e.targetMaterialIndex]===`OPAQUE`)return[];let a=e.property===`metallicRoughnessValues`||e.property===`iridescenceThicknessRange`||i,o=i?`opacity`:e.property===`metallicRoughnessValues`?e.component===0?`metallic`:`roughness`:e.property===`iridescenceThicknessRange`?e.component===0?`iridescenceThicknessMinimum`:`iridescenceThicknessMaximum`:Kh[e.property];if(!o)return[];n={type:`material`,identifier:r,path:o,...e.component!==void 0&&!a?{component:e.component}:{}}}else if(e.type===`textureTransform`){let i=t.samplerIdentifiers?.[`${e.targetMaterialIndex}:${e.textureSlot}`];if(!i)return[];n={type:`sampler`,identifier:i,path:e.path,...e.component===void 0?{}:{component:e.component}},r={offset:[...e.baseTransform.offset],rotation:e.baseTransform.rotation,scale:[...e.baseTransform.scale]}}else return[];let i=e.sampler.interpolation,a={target:n,times:[...e.sampler.input],values:e.sampler.output.map(e=>[...e]),...i===`LINEAR`?{}:{interpolation:i},...r?{baseTransform:r}:{}};return e.type===`material`&&e.property===`baseColorFactor`&&e.component===void 0&&e.sampler.output.every(e=>e.length>3)&&t.materialAlphaModes?.[e.targetMaterialIndex]!==`OPAQUE`?[a,{...a,target:{...n,path:`opacity`},values:e.sampler.output.map(e=>[e[3]])}]:[a]}var Zh=[`triangle`,`sphere`,`cylinder`,`cone`,`quad`],Qh=[`matte`,`physicallyBased`],$h=[`ambient`,`directional`,`point`,`spot`],eg=[`perspective`,`orthographic`],tg=[`default`,`deferred`,`raytrace`,`debugNormals`,`debugDepth`],ng={"@@type":`default`,background:[.016,.019,.044,1],ambientRadiance:.1,exposure:1.5,bloomIntensity:.82,bloomThreshold:.64,bloomRadius:8,fogColor:[.018,.025,.065],fogDensity:24e-5},rg={resolutionScale:.5,minimumResolutionScale:.25,adaptiveResolution:!0,targetFrameTimeMilliseconds:33.3,temporalReprojection:!0,shadowSamplesPerFrame:1,progressive:!0,shadows:!0},ig=[`baseColorTexture`,`normalTexture`,`bumpTexture`,`metallicRoughnessTexture`,`emissiveTexture`,`occlusionTexture`,`specularColorTexture`,`specularIntensityTexture`,`clearcoatTexture`,`clearcoatRoughnessTexture`,`clearcoatNormalTexture`,`transmissionTexture`,`diffuseTransmissionTexture`,`diffuseTransmissionColorTexture`,`thicknessTexture`,`multiscatterColorTexture`,`sheenColorTexture`,`sheenRoughnessTexture`,`iridescenceTexture`,`iridescenceThicknessTexture`,`anisotropyTexture`],ag=new Map;async function og(e){if(typeof createImageBitmap!=`function`)return;let t=new Map;for(let n of Object.values(e.textures||{}))ag.has(n.source)||t.has(n.source)||t.set(n.source,fetch(n.source).then(async e=>{if(!e.ok)throw Error(`Unable to load texture "${n.source}": ${e.status}.`);return createImageBitmap(await e.blob())}).then(e=>{ag.set(n.source,e)}).catch(e=>{throw Error(`Unable to load texture "${n.source}": ${String(e)}`)}));await Promise.all(t.values())}function sg(e,t,n={}){if(t.version!==1)throw Error(`Scene "version" must be 1.`);let r=new Map,i=new Map,a=[],o=new Map,s=new Map,c=new Map,l=new Map,u=new Map,d=new Map,f=new Map,p=[],m=[],h=cg(t),g=[];for(let[n,i]of Object.entries(t.geometries)){let{"@@type":t,"vertex.position":a,"vertex.normal":o,"vertex.tangent":s,"vertex.joint":c,"vertex.weight":l,"vertex.attribute0":u,"vertex.attribute1":d,"vertex.attribute2":f,"primitive.index":p,morphTargets:m,generator:h,...g}=i;Sg(`geometry`,t,Zh);let _={...g};if(a&&(_[`vertex.position`]=new Float32Array(a)),o&&(_[`vertex.normal`]=new Float32Array(o)),s&&(_[`vertex.tangent`]=new Float32Array(s)),c&&(_[`vertex.joint`]=new Uint16Array(c)),l&&(_[`vertex.weight`]=new Float32Array(l)),u&&(_[`vertex.attribute0`]=new Float32Array(u)),d&&(_[`vertex.attribute1`]=new Float32Array(d)),f&&Object.assign(_,{"vertex.attribute2":new Float32Array(f)}),p&&(_[`primitive.index`]=new Uint32Array(p)),m&&(_.morphTargets=m.map(e=>({...e.POSITION?{POSITION:new Float32Array(e.POSITION)}:{},...e.NORMAL?{NORMAL:new Float32Array(e.NORMAL)}:{},...e.TANGENT?{TANGENT:new Float32Array(e.TANGENT)}:{}}))),h){if(t!==`triangle`)throw Error(`Geometry "${n}" generators require the "triangle" subtype.`);Object.assign(_,pg(h))}r.set(n,e.newGeometry(t,_))}for(let[n,r]of Object.entries(t.textures||{})){let t=ag.get(r.source);if(!t)throw Error(`Texture "${n}" must be loaded before creating its ANARI scene.`);let o=js(e.device,t,{id:`anari-${n}`,width:t.width,height:t.height,colorSpace:r.colorSpace||`linear`,sampler:{addressModeU:`repeat`,addressModeV:`repeat`,minFilter:`linear`,magFilter:`linear`,...r.sampler}});a.push(o),i.set(n,e.newSampler(`image2D`,{image:o,transform:r.transform,textureCoordinateSet:r.textureCoordinateSet}))}for(let[n,r]of Object.entries(t.materials)){let{"@@type":t,...a}=r;Sg(`material`,t,Qh);let s={};for(let[e,t]of Object.entries(a))ig.includes(e)?s[e]=X(i,String(t),`texture`):Object.assign(s,{[e]:t});o.set(n,e.newMaterial(t,s))}for(let[n,i]of Object.entries(t.surfaces)){let t=X(r,i.geometry,`geometry`),a=X(o,i.material,`material`),l=e.newSurface({geometry:t,material:a,...i.skin?{skin:{jointMatrices:new Float32Array(i.skin.joints.length*16)}}:{}});s.set(n,l),i.skin&&c.set(l,i.skin)}for(let n of t.lights||[]){let{"@@id":t,"@@type":r,animation:i,...a}=n;Sg(`light`,r,$h),xg(l,t,`light`);let o=e.newLight(r,a);l.set(t,o),i&&g.push({identifier:t,light:o,parameters:a,animation:i})}for(let[n,r]of Object.entries(t.groups||{}))u.set(n,e.newGroup({surface:r.surfaces.map(e=>X(s,e,`surface`)),light:r.lights?.map(e=>X(l,e,`light`))}));let _=t=>{let n=t[`@@id`];xg(d,n,`instance`);let r;if(t.group)r=X(u,t.group,`group`);else if(t.surface){let n=f.get(t.surface);r=n||e.newGroup({surface:[X(s,t.surface,`surface`)]}),n||f.set(t.surface,r)}else throw Error(`Instance "${n}" must declare a "group" or "surface".`);let i=e.newInstance({group:r,transform:yg(t)});d.set(n,i);let a=t.animations||(t.animation?[t.animation]:[]);a.length>0&&!h.instances.has(n)&&p.push(lg(i,t,a))};for(let e of t.instances||[])_(e);for(let e of t.distributions||[]){if(e[`@@type`]!==`starfield`)throw Error(`Unsupported distribution "${e[`@@type`]}".`);for(let t of fg(e))_(t)}for(let{identifier:e,light:t,parameters:n,animation:r}of g)h.lights.has(e)||m.push(ug(t,n,r,d));let v=e.newWorld({surface:(t.world?.surfaces||[]).map(e=>X(s,e,`surface`)),instance:t.world?.instances?t.world.instances.map(e=>X(d,e,`instance`)):Array.from(d.values()),light:t.world?.lights?t.world.lights.map(e=>X(l,e,`light`)):Array.from(l.values())}),{"@@type":y,target:b=[0,0,0],orbit:x,...S}=t.camera;Sg(`camera`,y,eg);let C=S.position||[0,4,12],w=e.newCamera(y,{...S,position:C,direction:S.direction||bg(b,C)}),{"@@type":ee,...te}=t.renderer||ng,T=n.rendererSubtype||ee;Sg(`renderer`,T,tg);let ne=e.newRenderer(T,{...T===`raytrace`?rg:{},...te}),re=e.newFrame({world:v,camera:w,renderer:ne}),ie=t.clips?.length||c.size>0?Jh(t,{instances:d,geometries:r,materials:o,samplers:i,lights:l,camera:w,skins:c}):void 0;return{frame:re,name:t.name,description:t.description||``,cameraTarget:b,cameraPosition:C,cameraOrbitSpeed:x?.speed||0,animations:ie,update(e){ie?.update(e);for(let t of p)t(e);for(let t of m)t(e)},destroy(){re.destroy();for(let e of a)e.destroy()}}}function cg(e){let t=new Set,n=new Set,r=new Set;for(let i of e.clips||[])for(let{target:e}of i.tracks)e.type===`instance`?t.add(e.identifier):e.type===`light`?n.add(e.identifier):e.type===`node`&&r.add(e.identifier);for(let[n,i]of Object.entries(e.nodes||{})){let a=new Set,o=n;for(;o&&!a.has(o);){if(r.has(o)){for(let e of i.instances||[])t.add(e);break}a.add(o),o=e.nodes?.[o]?.parent}}return{instances:t,lights:n}}function lg(e,t,n){let r=t.position||[0,0,0],i=t.rotation||[0,0,0];for(let e of n)if(e[`@@type`]!==`orbit`&&e[`@@type`]!==`bob`&&e[`@@type`]!==`spin`&&e[`@@type`]!==`wobble`)throw Error(`Instance "${t[`@@id`]}" does not support "${e[`@@type`]}" animation.`);return a=>{let o=r,s=[...i];for(let e of n)if(e[`@@type`]===`orbit`)o=dg(e,r,a);else if(e[`@@type`]===`bob`)o=[o[0],o[1]+Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.4),o[2]];else if(e[`@@type`]===`spin`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=a*(e.speed??1)+(e.phase||0)}else if(e[`@@type`]===`wobble`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.08)}e.setParameter(`transform`,yg({...t,position:o,rotation:s})).commitParameters()}}function ug(e,t,n,r){if(n[`@@type`]===`orbit`){let r=t.position||[3,2,0];return t=>{e.setParameter(`position`,dg(n,r,t)).commitParameters()}}if(n[`@@type`]===`pulse`){let r=t.intensity??1,i=n.amplitude??.5,a=n.speed??1,o=n.phase||0;return t=>{e.setParameter(`intensity`,r*(1+Math.sin(t*a+o)*i)).commitParameters()}}if(n[`@@type`]===`follow`){let t=X(r,n.target,`instance`),i=n.offset||[0,0,0];return()=>{let n=t.getParameter(`transform`);n&&e.setParameter(`position`,[n[12]+i[0],n[13]+i[1],n[14]+i[2]]).commitParameters()}}throw Error(`Lights do not support "${n[`@@type`]}" animation.`)}function dg(e,t,n){let r=e.center||[0,t[1],0],i=e.radius||Math.hypot(t[0]-r[0],t[2]-r[2])||3,a=n*(e.speed??1)+(e.phase||0),o=Math.sin(a)*Math.sin(e.inclination||0)*i,s=(e.height||0)*Math.sin(a*(e.verticalFrequency??2));return[r[0]+Math.cos(a)*i,r[1]+o+s,r[2]+Math.sin(a)*i]}function fg(e){let t=[],n=e.seed||0;for(let r=0;r<e.count;r++){let i=vg(r*7+1+n)*Math.PI*2,a=vg(r*11+3+n)*.82+.08,o=e.radius*(.72+vg(r*13+5+n)*.32),s=.7+vg(r*19+n)*2;t.push({"@@id":`${e[`@@id`]}-${r}`,surface:e.surface,position:[Math.cos(i)*Math.cos(a)*o,Math.sin(a)*o,Math.sin(i)*Math.cos(a)*o],scale:[s,s,s]})}return t}function pg(e){return e[`@@type`]===`torus`?mg(e):e[`@@type`]===`crystal`?hg(e):gg(e)}function mg(e){let t=e.majorRadius??1,n=e.minorRadius??.035,r=e.majorSegments??64,i=e.minorSegments??8,a=(r+1)*(i+1),o=new Float32Array(a*3),s=new Float32Array(a*3),c=new Uint32Array(r*i*6);for(let e=0;e<=r;e++){let a=e/r*Math.PI*2,c=Math.cos(a),l=Math.sin(a);for(let r=0;r<=i;r++){let a=r/i*Math.PI*2,u=Math.cos(a),d=Math.sin(a),f=(e*(i+1)+r)*3,p=t+n*u;o[f]=p*c,o[f+1]=n*d,o[f+2]=p*l,s[f]=u*c,s[f+1]=d,s[f+2]=u*l}}let l=0;for(let e=0;e<r;e++)for(let t=0;t<i;t++){let n=e*(i+1)+t,r=(e+1)*(i+1)+t;c[l++]=n,c[l++]=r,c[l++]=n+1,c[l++]=n+1,c[l++]=r,c[l++]=r+1}return{"vertex.position":o,"vertex.normal":s,"primitive.index":c}}function hg(e){let t=e.radius??.5,n=e.height??1.8,r=e.sides??6,i=[],a=[];for(let e=0;e<r;e++){let o=e/r*Math.PI*2,s=(e+1)/r*Math.PI*2,c=[Math.cos(o)*t,0,Math.sin(o)*t],l=[Math.cos(s)*t,0,Math.sin(s)*t];_g(i,a,[0,n*.66,0],l,c),_g(i,a,[0,-n*.34,0],c,l)}return{"vertex.position":new Float32Array(i),"vertex.normal":new Float32Array(a)}}function gg(e){let t=e.radius??.5,n=e.height??1,r=e.sides??12,i=Math.min(e.bevel??.11,n*.24),a=[],o=[];for(let e=0;e<r;e++){let s=e/r*Math.PI*2,c=(e+1)/r*Math.PI*2,l=(e,t,n)=>[Math.cos(e)*t,n,Math.sin(e)*t],u=l(s,t*.77,-n/2),d=l(c,t*.77,-n/2),f=l(s,t,-n/2+i),p=l(c,t,-n/2+i),m=l(s,t,n/2-i),h=l(c,t,n/2-i),g=l(s,t*.77,n/2),_=l(c,t*.77,n/2);_g(a,o,u,f,p),_g(a,o,u,p,d),_g(a,o,f,m,h),_g(a,o,f,h,p),_g(a,o,m,g,_),_g(a,o,m,_,h),_g(a,o,[0,-n/2,0],u,d),_g(a,o,[0,n/2,0],_,g)}return{"vertex.position":new Float32Array(a),"vertex.normal":new Float32Array(o)}}function _g(e,t,n,r,i){let a=bg(r,n),o=bg(i,n),s=[a[1]*o[2]-a[2]*o[1],a[2]*o[0]-a[0]*o[2],a[0]*o[1]-a[1]*o[0]],c=Math.hypot(...s)||1,l=[s[0]/c,s[1]/c,s[2]/c];e.push(...n,...r,...i),t.push(...l,...l,...l)}function vg(e){let t=Math.sin(e*91.7341+19.19)*43758.5453;return t-Math.floor(t)}function yg(e){if(e.matrix)return e.matrix;let t=new p().translate(e.position||[0,0,0]);return e.rotation&&(t.rotateX(e.rotation[0]),t.rotateY(e.rotation[1]),t.rotateZ(e.rotation[2])),e.scale&&t.scale(e.scale),t}function bg(e,t){return[e[0]-t[0],e[1]-t[1],e[2]-t[2]]}function X(e,t,n){let r=e.get(t);if(!r)throw Error(`Unknown ${n} reference "${t}".`);return r}function xg(e,t,n){if(!t)throw Error(`Every ${n} requires an "@@id".`);if(e.has(t))throw Error(`Duplicate ${n} identifier "${t}".`)}function Sg(e,t,n){if(!n.some(e=>e===t))throw Error(`Unsupported ${e} subtype "${t}". Expected ${n.join(`, `)}.`)}var Cg=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},wg=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,Tg=/^([-\w.]+\/[-\w.+]+)/;function Eg(e,t){return e.toLowerCase()===t.toLowerCase()}function Dg(e){let t=Tg.exec(e);return t?t[1]:e}function Og(e){let t=wg.exec(e);return t?t[1]:``}var kg=/\?.*/;function Ag(e){let t=e.match(kg);return t&&t[0]}function jg(e){return e.replace(kg,``)}function Mg(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function Ng(e){return Mc(e)?e.url:Nc(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function Pg(e){if(Mc(e)){let t=e.headers.get(`content-type`)||``,n=jg(e.url);return Dg(t)||Og(n)}return Nc(e)?e.type||``:typeof e==`string`?Og(e):``}function Fg(e){return Mc(e)?e.headers[`content-length`]||-1:Nc(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function Ig(e){if(Mc(e))return e;let t={},n=Fg(e);n>=0&&(t[`content-length`]=String(n));let r=Ng(e),i=Pg(e);i&&(t[`content-type`]=i);let a=await zg(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function Lg(e){if(!e.ok)throw await Rg(e)}async function Rg(e){let t=Mg(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new Cg(n,r)}async function zg(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${Bg(e.slice(0,5))}`:null}function Bg(e){let t=``,n=new Uint8Array(e);for(let e=0;e<n.byteLength;e++)t+=String.fromCharCode(n[e]);return btoa(t)}function Vg(e){return!Hg(e)&&!Ug(e)}function Hg(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function Ug(e){return e.startsWith(`data:`)}async function Wg(e,t){if(typeof e==`string`){let n=Il(e);return Vg(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await Ig(e)}var Gg=new i({id:`loaders.gl`}),Kg=class{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},qg={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:bc,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},Jg={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},Yg=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function Xg(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function Zg(){let e=Xg();return e.globalOptions=e.globalOptions||{...qg,core:{...qg.core}},$g(e.globalOptions)}function Qg(e,t,n,r){return n||=[],n=Array.isArray(n)?n:[n],e_(e,n),$g(r_(t,e,r))}function $g(e){let t=o_(e);s_(t);for(let e of Yg)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function e_(e,t){t_(e,null,qg,Jg,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};t_(r,n.id,i,a,t)}}function t_(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&Ec(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)Gg.level>0&&Gg.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&Gg.level>0){let e=n_(s,i);Gg.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function n_(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function r_(e,t,n){let r=e.options||{},i={...r};return r.core&&(i.core={...r.core}),s_(i),i.core?.log===null&&(i.core={...i.core,log:new Kg}),i_(i,$g(Zg())),i_(i,$g(t)),a_(i,n),c_(i),i}function i_(e,t){for(let n in t)if(n in t){let r=t[n];Dc(r)&&Dc(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function a_(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=Wl(jg(t)))}function o_(e){let t={...e};return e.core&&(t.core={...e.core}),t}function s_(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of Yg)if(e[t]!==void 0){let n=e.core=e.core||{};n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function c_(e){let t=e.core;if(t)for(let n of Yg)t[n]!==void 0&&(e[n]=t[n])}function l_(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function u_(e){yc(e,`null loader`),yc(l_(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var d_=()=>{let e=Xg();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function f_(){return d_()}var p_=/\.([^.]+)$/;async function m_(e,t=[],n,r){if(!v_(e))return null;let i=$g(n||{});if(i.core||={},e instanceof Response&&h_(e)){let n=g_(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=g_(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(Nc(e)&&(e=await e.slice(0,10).arrayBuffer(),a=g_(e,t,i,r)),!a&&e instanceof Response&&h_(e)&&(a=g_(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(y_(e));return a}function h_(e){let t=Pg(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function g_(e,t=[],n,r){if(!v_(e))return null;let i=$g(n||{});if(i.core||={},t&&!Array.isArray(t))return u_(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...f_()),b_(a);let o=__(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(y_(e));return o}function __(e,t,n,r){let i=Ng(e),a=Pg(e),o=jg(i)||r?.url,s=null,c=``;return n?.core?.mimeType&&(s=C_(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=x_(t,o),c||=s?`matched url ${o}`:``,s||=C_(t,a),c||=s?`matched MIME type ${a}`:``,s||=w_(t,e),c||=s?`matched initial data ${O_(e)}`:``,n?.core?.fallbackMimeType&&(s||=C_(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&wc.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function v_(e){return!(e instanceof Response&&e.status===204)}function y_(e){let t=Ng(e),n=Pg(e),r=`No valid loader found (`;r+=t?`${Ul(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?O_(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function b_(e){for(let t of e)u_(t)}function x_(e,t){let n=t&&p_.exec(t),r=n&&n[1];return r?S_(e,r):null}function S_(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function C_(e,t){for(let n of e)if(n.mimeTypes?.some(e=>Eg(t,e))||Eg(t,`application/x.${n.id}`))return n;return null}function w_(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(T_(t,n))return n}else if(ArrayBuffer.isView(t)){if(E_(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&E_(t,0,n))return n;return null}function T_(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function E_(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>D_(e,t,n,r))}function D_(e,t,n,r){if(kc(r))return Tl(r,e,r.byteLength);switch(typeof r){case`function`:return r(Bl(e));case`string`:return r===k_(e,t,r.length);default:return!1}}function O_(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?k_(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?k_(e,0,t):``}function k_(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var A_=256*1024;function*j_(e,t){let n=t?.chunkSize||A_,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield Bl(i.encode(a))}}var M_=256*1024;function*N_(e,t={}){let{chunkSize:n=M_}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var P_=1024*1024;async function*F_(e,t){let n=t?.chunkSize||P_,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function I_(e,t){return bc?L_(e,t):R_(e,t)}async function*L_(e,t){let n=e.getReader(),r;try{for(;;){let e=r||n.read();t?._streamReadAhead&&(r=n.read());let{done:i,value:a}=await e;if(i)return;yield zl(a)}}catch{n.releaseLock()}}async function*R_(e,t){for await(let t of e)yield zl(t)}function z_(e,t){if(typeof e==`string`)return j_(e,t);if(e instanceof ArrayBuffer)return N_(e,t);if(Nc(e))return F_(e,t);if(Ic(e))return I_(e,t);if(Mc(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return I_(n,t)}throw Error(`makeIterator`)}var B_=`Cannot convert supplied data type`;function V_(e,t,n){if(t.text&&typeof e==`string`)return e;if(Rl(e)&&(e=e.buffer),kc(e)){let n=Hl(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):zl(n)}throw Error(B_)}async function H_(e,t,n){if(typeof e==`string`||kc(e))return V_(e,t,n);if(Nc(e)&&(e=await Ig(e)),Mc(e))return await Lg(e),t.binary?await e.arrayBuffer():await e.text();if(Ic(e)&&(e=z_(e,n)),Ac(e)||jc(e))return jl(e);throw Error(B_)}function U_(e,t){let n=Zg(),r=e||n,i=r.fetch??r.core?.fetch;return typeof i==`function`?i:Ec(i)?e=>Wg(e,i):t?.fetch?t?.fetch:Wg}function W_(e,t,n){if(n)return n;let r={fetch:U_(t,e),...e};if(r.url){let e=jg(r.url);r.baseUrl=e,r.queryString=Ag(r.url),r.filename=Ul(e),r.baseUrl=Wl(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function G_(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function K_(e,t,n,r){t&&!Array.isArray(t)&&!l_(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=Ng(e),a=G_(t,r),o=await m_(e,a,n);if(!o)return null;let s=Qg(n,o,a,i);return r=W_({url:i,_parse:K_,loaders:a},s,r||null),await q_(o,e,s,r)}async function q_(e,t,n,r){if(ul(e),n=Lc(e.options,n),Mc(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}t=await H_(t,e,n);let i=e;if(i.parseTextSync&&typeof t==`string`)return i.parseTextSync(t,n,r);if(yl(e,n))return await bl(e,t,n,r,K_);if(i.parseText&&typeof t==`string`)return await i.parseText(t,n,r);if(i.parse)return await i.parse(t,n,r);throw Wc(!i.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function J_(e,t,n,r){let i,a;!Array.isArray(t)&&!l_(t)?(i=[],a=t,r=void 0):(i=t,a=n);let o=U_(a),s=e;return typeof e==`string`&&(s=await o(e)),Nc(e)&&(s=await o(e)),typeof e==`string`&&($g(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await K_(s,i,a)}function Y_(e,t){let n={version:1,name:t||pv(e),description:`Imported OpenUSD · ${e.layers.length} composed ${e.layers.length===1?`layer`:`layers`}`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.105,exposure:1.55,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={scene:n,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},nextIdentifier:0};for(let t of e.rootPrims)uv(t,r.materials);let i=new p;e.metadata.upAxis===`Z`&&i.rotateX(-Math.PI/2);for(let t of e.rootPrims)Z_(t,i,r);return nv(r),n}function X_(e,t){nv({scene:e,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:t,nextIdentifier:Object.keys(e.geometries).length})}function Z_(e,t,n){if(Z(e,`visibility`)===`invisible`)return;let r=new p(t).multiplyRight(dv(e));if(e.type===`Mesh`)Q_(e,r,n);else if(e.type===`Sphere`||e.type===`Cylinder`||e.type===`Cone`||e.type===`Cube`||e.type===`Capsule`)$_(e,r,n);else if(e.type===`DistantLight`||e.type===`SphereLight`||e.type===`DiskLight`)tv(e,r,n);else if(e.type===`PointInstancer`){ev(e,r,n);return}if(e.type!==`Material`&&e.type!==`Shader`&&e.type!==`GeomSubset`)for(let t of e.children)Z_(t,r,n)}function Q_(e,t,n){let r=yv(Z(e,`points`)),i=vv(Z(e,`faceVertexCounts`)),a=vv(Z(e,`faceVertexIndices`));if(r.length===0||i.length===0||a.length===0)return;let o=[],s=0;for(let e of i)o.push(s),s+=e;let c=yv((e.attributes.normals||e.attributes[`primvars:normals`])?.value),l=e.attributes[`primvars:st`]||e.attributes[`primvars:map1`]||e.attributes[`primvars:st0`]||e.attributes[`primvars:uv`],u=yv(l?.value),d=l?vv(Z(e,`${l.name}:indices`)):[],f=mv(e),p=e.children.filter(e=>e.type===`GeomSubset`),m=new Set,h=p.map(e=>{let t=vv(Z(e,`indices`));for(let e of t)m.add(e);return{name:e.name,faceIndices:t,materialPath:mv(e)||f}}),g=i.map((e,t)=>t).filter(e=>!m.has(e));(g.length>0||h.length===0)&&h.push({name:e.name,faceIndices:g,materialPath:f});for(let s of h){if(s.faceIndices.length===0)continue;let l=av(s.materialPath,s.name,n),f=`${e.sourceUrl||e.path}:${e.name}:${s.name}:${l}`,p=n.surfaceIdentifiers.get(f);if(!p){let t=[],m=[],h=[];for(let e of s.faceIndices){let n=i[e],s=o[e];for(let e=1;e<n-1;e++)for(let n of[0,e,e+1]){let e=a[s+n],i=r[e];if(!i)continue;t.push(i[0],i[1],i[2]);let o=c.length===a.length?c[s+n]:c.length===r.length?c[e]:void 0;o&&m.push(o[0],o[1],o[2]);let l=u[d[s+n]??(u.length===a.length?s+n:e)];l&&l.length>=2&&h.push(l[0],l[1])}}if(t.length===0)continue;let g=Cv(e.name,s.name,n),_={"@@type":`triangle`,"vertex.position":t};m.length===t.length&&(_[`vertex.normal`]=m),h.length===t.length/3*2&&(_[`vertex.attribute1`]=h),n.scene.geometries[g]=_,n.scene.surfaces[g]={geometry:g,material:l},p=g,n.surfaceIdentifiers.set(f,g)}fv(n,p,t,`${e.name}-${s.name}`);for(let e of s.faceIndices){let s=i[e],c=o[e];for(let e=0;e<s;e++){let i=r[a[c+e]];i&&wv(n.bounds,t.transformAsPoint(i))}}}}function $_(e,t,n){let r=xv(Z(e,`radius`),.5),i=xv(Z(e,`height`),1),a=xv(Z(e,`size`),1),o=Z(e,`axis`),s=av(mv(e),e.name,n,e),c=`${e.sourceUrl||``}:${e.path}:${e.type}:${s}:${r}:${i}:${a}:${o}`,l=n.surfaceIdentifiers.get(c);if(!l){l=Cv(e.name,e.type,n);let t;t=e.type===`Sphere`?{"@@type":`sphere`,radius:r,segments:24}:e.type===`Cylinder`?{"@@type":`cylinder`,radius:r,height:i,segments:32}:e.type===`Cone`?{"@@type":`cone`,radius:r,height:i,segments:32}:e.type===`Capsule`?{"@@type":`sphere`,radius:r,segments:24}:{"@@type":`triangle`,"vertex.position":Tv(a)},n.scene.geometries[l]=t,n.scene.surfaces[l]={geometry:l,material:s},n.surfaceIdentifiers.set(c,l)}e.type===`Capsule`&&t.scale([1,Math.max(1,i/Math.max(r*2,.001)),1]),(e.type===`Cylinder`||e.type===`Cone`)&&o===`Z`&&t.rotateX(Math.PI/2),(e.type===`Cylinder`||e.type===`Cone`)&&o===`X`&&t.rotateZ(Math.PI/2),fv(n,l,t,e.name);let u=e.type===`Cube`?a/2:Math.max(r,i/2);wv(n.bounds,t.transformAsPoint([-u,-u,-u])),wv(n.bounds,t.transformAsPoint([u,u,u]))}function ev(e,t,n){let r=yv(Z(e,`positions`)),i=vv(Z(e,`protoIndices`)),a=gv(Z(e,`prototypes`));for(let o=0;o<r.length;o++){let s=a[i[o]||0]?.split(`/`).pop(),c=e.children.find(e=>e.name===s);c&&Z_(c,new p(t).translate(r[o]),n)}}function tv(e,t,n){let r=bv(Z(e,`inputs:color`))||[1,1,1],i=xv(Z(e,`inputs:intensity`),1),a=Cv(e.name,`light`,n),o;if(e.type===`DistantLight`){let e=t.transformAsVector([0,0,-1]);o={"@@id":a,"@@type":`directional`,direction:[e[0],e[1],e[2]],color:r,irradiance:Math.min(4,Math.max(.6,i*.003))}}else o={"@@id":a,"@@type":`point`,position:[t[12],t[13],t[14]],color:r,intensity:Math.min(70,Math.max(8,i*.02))};n.scene.lights=[...n.scene.lights||[],o]}function nv(e){if(!Number.isFinite(e.bounds.minimum[0]))throw Error(`The imported OpenUSD stage contains no supported renderable geometry.`);rv(e);let t=e.bounds.minimum,n=e.bounds.maximum,r=[(t[0]+n[0])/2,t[1]+(n[1]-t[1])*.41,(t[2]+n[2])/2],i=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.5);e.scene.camera.target=r,e.scene.camera.position=[r[0]+i*.76,r[1]+i*.43,r[2]+i*.96],e.scene.camera.near=Math.max(.01,i*.001),e.scene.camera.far=Math.max(200,i*18),e.scene.renderer||={"@@type":`default`},e.scene.renderer.fogDensity=.003/i;let a=Cv(`gallery`,`floor`,e);e.scene.geometries[a]={"@@type":`quad`,width:i*8,height:i*8},e.scene.materials[a]={"@@type":`physicallyBased`,baseColor:[.033,.046,.084],metallic:.48,roughness:.23,clearcoat:.78},e.scene.surfaces[a]={geometry:a,material:a},e.scene.instances=[...e.scene.instances||[],{"@@id":`${a}-placement`,surface:a,position:[r[0],t[1]-i*.035,r[2]]}];let o=iv(e,{identifier:`cyan`,color:[.12,.65,1],center:[r[0],r[1]+i*.28,r[2]],radius:i*.76,height:i*.14,phase:.2,speed:.36,size:i*.015}),s=iv(e,{identifier:`amber`,color:[1,.43,.14],center:[r[0],r[1]+i*.43,r[2]],radius:i*.68,height:i*.1,phase:Math.PI*.75,speed:-.28,size:i*.013}),c=(e.scene.lights||[]).some(e=>e[`@@type`]===`directional`);e.scene.lights=[...e.scene.lights||[],{"@@id":`gallery-key-light`,"@@type":`directional`,direction:[-.36,-1,-.42],color:[1,.91,.8],irradiance:c?1.45:2.35},{"@@id":`gallery-fill-light`,"@@type":`point`,position:[r[0]+i*.76,r[1]+i*.28,r[2]],color:[.12,.62,1],intensity:46,animation:{"@@type":`follow`,target:o}},{"@@id":`gallery-rim-light`,"@@type":`point`,position:[r[0]-i*.58,r[1]+i*.43,r[2]],color:[1,.41,.14],intensity:39,animation:{"@@type":`follow`,target:s}}];let l=Object.keys(e.scene.geometries).length-1;e.scene.description+=` · ${l} ${l===1?`mesh`:`meshes`}`}function rv(e){let t=e.bounds.minimum,n=e.bounds.maximum,r=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.001),i=[(t[0]+n[0])/2,t[1],(t[2]+n[2])/2],a=new p().scale(11.5/r).translate([-i[0],-i[1],-i[2]]);e.scene.instances=(e.scene.instances||[]).map(e=>({...e,matrix:e.matrix?Array.from(new p(a).multiplyRight(e.matrix)):Array.from(a)})),e.scene.lights=(e.scene.lights||[]).map(e=>{if(!e.position)return e;let t=a.transformAsPoint(e.position);return{...e,position:[t[0],t[1],t[2]]}});let o=a.transformAsPoint(t),s=a.transformAsPoint(n);e.bounds={minimum:[o[0],o[1],o[2]],maximum:[s[0],s[1],s[2]]}}function iv(e,t){let n=`studio-${t.identifier}-emitter`;e.scene.geometries[n]={"@@type":`sphere`,radius:t.size,segments:18},e.scene.materials[n]={"@@type":`physicallyBased`,baseColor:t.color,emissive:t.color,emissiveStrength:11,roughness:.09,clearcoat:.82},e.scene.surfaces[n]={geometry:n,material:n};let r=`${n}-placement`;return e.scene.instances=[...e.scene.instances||[],{"@@id":r,surface:n,position:[t.center[0]+Math.cos(t.phase)*t.radius,t.center[1],t.center[2]+Math.sin(t.phase)*t.radius],animation:{"@@type":`orbit`,center:t.center,radius:t.radius,height:t.height,phase:t.phase,speed:t.speed}}],r}function av(e,t,n,r){let i=e||t,a=n.materialIdentifiers.get(i);if(a)return a;a=Cv(i.split(`/`).pop()||t,`material`,n);let o=e?cv(e,n):void 0,s=o?lv(o):void 0,c=o&&s?ov(o,s,`inputs:diffuseColor`,`srgb`,n):void 0,l=yv(r?Z(r,`primvars:displayColor`):void 0),u=l[0]?[l[0][0],l[0][1],l[0][2]]:void 0,d=bv(s?Z(s,`inputs:diffuseColor`):void 0)||bv(s?Z(s,`inputs:base_color`):void 0)||u||(c?[1,1,1]:Sv(i)),f=i.toLowerCase(),p=f.includes(`window`)||f.includes(`glass`),m=f.includes(`frontlight`)||f.includes(`backlight`)||f.includes(`headlight`)||f.includes(`taillight`)||f.includes(`emissive`),h=bv(s?Z(s,`inputs:emissiveColor`):void 0)||(m?d:void 0),g={"@@type":`physicallyBased`,baseColor:d,metallic:xv(s?Z(s,`inputs:metallic`):void 0,p?.22:f.includes(`grey`)?.82:.48),roughness:xv(s?Z(s,`inputs:roughness`):void 0,p?.07:f.includes(`grey`)?.16:.13),clearcoat:p?.96:.89,iridescence:p?.25:.045};if(c&&(g.baseColorTexture=c),o&&s){let e=ov(o,s,`inputs:normal`,`linear`,n);e&&(g.normalTexture=e)}return p&&(g.opacity=xv(s?Z(s,`inputs:opacity`):void 0,.52)),h&&(g.emissive=h,g.emissiveStrength=m?3.6:1.2,c&&m&&(g.emissiveTexture=c)),n.scene.materials[a]=g,n.materialIdentifiers.set(i,a),a}function ov(e,t,n,r,i){let a=Z(t,`${n}.connect`)||Z(t,n);if(!hv(a))return;let o=a.path.split(`.outputs:`)[0],s=sv(e,o);if(!s||Z(s,`info:id`)!==`UsdUVTexture`)return;let c=Z(s,`inputs:file`);if(!c||typeof c!=`object`||Array.isArray(c)||!(`assetPath`in c))return;let l=s.sourceUrl||e.sourceUrl;if(!l)return;let u=new URL(String(c.assetPath),l).href,d=`${u}:${r}`,f=i.textureIdentifiers.get(d);return f||(f=Cv(s.name,`texture`,i),i.scene.textures||={},i.scene.textures[f]={source:u,colorSpace:r},i.textureIdentifiers.set(d,f)),f}function sv(e,t){if(e.path===t||t.endsWith(`/${e.name}`))return e;for(let n of e.children){let e=sv(n,t);if(e)return e}}function cv(e,t){let n=t.materials.get(e);if(n)return n;let r=e.split(`/`).pop();if(r)return Array.from(t.materials.values()).find(e=>e.name===r)}function lv(e){for(let t of e.children){let e=Z(t,`info:id`);if(t.type===`Shader`&&(e===`UsdPreviewSurface`||e===`ND_standard_surface_surfaceshader`||e===`ND_UsdPreviewSurface_surfaceshader`))return t;let n=lv(t);if(n)return n}}function uv(e,t){e.type===`Material`&&t.set(e.path,e);for(let n of e.children)uv(n,t)}function dv(e){let t=new p,n=_v(Z(e,`xformOpOrder`)),r=n.length?n:Object.keys(e.attributes).filter(e=>e.startsWith(`xformOp:`));for(let n of r){let r=Z(e,n);if(n.startsWith(`xformOp:translate`)){let e=bv(r);e&&t.translate(e)}else if(n.startsWith(`xformOp:scale`)){let e=bv(r);e&&t.scale(e)}else if(n.startsWith(`xformOp:transform`)){let e=yv(r);e.length===4&&e.every(e=>e.length===4)&&t.multiplyRight(new p(e.flat()))}else if(n.startsWith(`xformOp:rotate`)){let e=n.slice(14).split(`:`)[0],i=Array.isArray(r)?r:[r];for(let n=0;n<e.length;n++){let r=xv(i[n],0)*(Math.PI/180);e[n]===`X`?t.rotateX(r):e[n]===`Y`?t.rotateY(r):e[n]===`Z`&&t.rotateZ(r)}}else if(n.startsWith(`xformOp:orient`)&&Array.isArray(r)){let e=r.map(e=>xv(e,0));e.length===4&&t.multiplyRight(new p().fromQuaternion([e[1],e[2],e[3],e[0]]))}}return t}function fv(e,t,n,r){let i={"@@id":Cv(r,`instance`,e),surface:t,matrix:Array.from(n)};e.scene.instances=[...e.scene.instances||[],i]}function pv(e){let t=e.metadata.defaultPrim;return typeof t==`string`?t.replace(/([a-z])([A-Z])/g,`$1 $2`).toUpperCase():`IMPORTED OPENUSD STAGE`}function Z(e,t){return e.attributes[t]?.value}function mv(e){let t=Z(e,`material:binding`);return hv(t)?t.path:void 0}function hv(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`path`in e)}function gv(e){return hv(e)?[e.path]:Array.isArray(e)?e.filter(hv).map(e=>e.path):[]}function _v(e){return Array.isArray(e)?e.filter(e=>typeof e==`string`):[]}function vv(e){return Array.isArray(e)?e.filter(e=>typeof e==`number`):[]}function yv(e){return Array.isArray(e)?e.filter(e=>Array.isArray(e)).map(e=>e.filter(e=>typeof e==`number`)):[]}function bv(e){if(!(!Array.isArray(e)||e.length<3)&&!(typeof e[0]!=`number`||typeof e[1]!=`number`||typeof e[2]!=`number`))return[e[0],e[1],e[2]]}function xv(e,t){return typeof e==`number`&&Number.isFinite(e)?e:t}function Sv(e){let t=e.toLowerCase();return t.includes(`frontlight`)?[1,.87,.58]:t.includes(`backlight`)?[1,.12,.055]:t.includes(`red`)?[.92,.065,.085]:t.includes(`blue`)?[.075,.36,.96]:t.includes(`green`)?[.09,.66,.31]:t.includes(`gold`)?[1,.69,.2]:t.includes(`window`)||t.includes(`glass`)?[.31,.67,.96]:t.includes(`lightgrey`)||t.includes(`greylight`)?[.78,.84,.93]:t.includes(`mediumgrey`)||t.includes(`greymedium`)?[.22,.27,.35]:[.52,.65,.83]}function Cv(e,t,n){return`${e.replace(/[^a-zA-Z0-9]+/g,`-`).replace(/^-|-$/g,``).toLowerCase()||`usd`}-${t}-${++n.nextIdentifier}`}function wv(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function Tv(e){let t=e/2,n=[[-t,-t,-t],[t,-t,-t],[t,t,-t],[-t,t,-t],[-t,-t,t],[t,-t,t],[t,t,t],[-t,t,t]];return[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,2,3,7,2,7,6,1,2,6,1,6,5,3,0,4,3,4,7].flatMap(e=>n[e])}async function Ev(e,t){let n={version:1,name:t,description:`Imported glTF · full PBR textures, mapped emission, and retained meshes`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.16,exposure:1.62,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={gltf:e,scene:n,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},imageSources:new Map,textureIdentifiers:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,nodeIdentifiers:{},nextIdentifier:0},i=e.scene?.nodes||e.scenes[0]?.nodes||e.nodes;for(let e of i)kv(e,new p,r);r.scene.lights=Dv(e,r);let a=(e.materials||[]).map(e=>r.materialIdentifiers.get(e)),o={};for(let[e,t]of a.entries()){if(!t)continue;let r=n.materials[t];for(let{slot:t}of vs()){let n=r[`${t}Texture`];n&&(o[`${e}:${t}`]=n)}}let s=qh(Xs(e),{nodeIdentifiers:r.nodeIdentifiers,materialIdentifiers:a,materialAlphaModes:(e.materials||[]).map(e=>e.alphaMode===`BLEND`?`BLEND`:e.alphaMode===`MASK`?`MASK`:`OPAQUE`),samplerIdentifiers:o});s.length>0&&(n.clips=s,n.playback={clip:s[0].name,playing:!0,loop:`repeat`},n.description=`Imported glTF · ${s.length} animation clip${s.length===1?``:`s`} · retained PBR scene`);let c=Ov(r.bounds);if(X_(n,r.bounds),n.nodes&&Object.keys(n.nodes).length>0){let e=`anari-presentation-root`;for(;e in n.nodes;)e+=`-root`;for(let t of Object.values(n.nodes))t.parent||=e;n.nodes[e]={matrix:Array.from(c)}}return n}function Dv(e,t){return Is(e,{nodeIdentifiers:new Set(Object.keys(t.nodeIdentifiers)),useByteColors:!1}).flatMap(e=>{if(e.type===`ambient`)return[];let n={"@@id":Bv(`source-${e.type}`,`light`,t),"@@type":e.type,color:Rv(e.color,[1,1,1]),intensity:e.intensity??1};return`position`in e&&(n.position=Rv(e.position,[0,0,0])),`direction`in e&&(n.direction=Rv(e.direction,[0,0,-1])),e.type===`spot`&&(n.openingAngle=e.outerConeAngle??Math.PI/4,n.falloffAngle=e.innerConeAngle??0),[n]})}function Ov(e){let t=Math.max(e.maximum[0]-e.minimum[0],e.maximum[1]-e.minimum[1],e.maximum[2]-e.minimum[2],.001);return new p().scale(11.5/t).translate([-(e.minimum[0]+e.maximum[0])/2,-e.minimum[1],-(e.minimum[2]+e.maximum[2])/2])}function kv(e,t,n,r){let i=e.id,a=e.mesh?.primitives.find(e=>e.targets?.length)?.targets?.length||0,o=e.weights||e.mesh?.weights||(a?Array(a).fill(0):void 0);n.nodeIdentifiers[e.id]=i,n.scene.nodes||={};let s={...r?{parent:r}:{},...e.translation?{translation:[e.translation[0],e.translation[1],e.translation[2]]}:{},...e.rotation?{rotation:[e.rotation[0],e.rotation[1],e.rotation[2],e.rotation[3]]}:{},...e.scale?{scale:[e.scale[0],e.scale[1],e.scale[2]]}:{},...e.matrix?{matrix:Array.from(e.matrix)}:{},...o?{weights:[...o]}:{}};n.scene.nodes[i]=s;let c=new p(t);if(e.matrix?c.multiplyRight(e.matrix):(e.translation&&c.translate(e.translation),e.rotation&&c.multiplyRight(new p().fromQuaternion(e.rotation)),e.scale&&c.scale(e.scale)),e.mesh)for(let[t,r]of e.mesh.primitives.entries()){if(r.mode!==void 0&&r.mode!==4)continue;let i=Av(e.mesh.id,t,r,n,e);if(!i)continue;let a=r.attributes.POSITION;for(let e=0;e<a.value.length;e+=3){let t=c.transformAsPoint([a.value[e],a.value[e+1],a.value[e+2]]);zv(n.bounds,t)}let o=Bv(e.name||e.id,`instance`,n);n.scene.instances=[...n.scene.instances||[],{"@@id":o,surface:i,matrix:Array.from(c)}],s.instances=[...s.instances||[],o],r.targets?.length&&(s.geometries=[...s.geometries||[],i])}for(let t of e.children||[])kv(t,c,n,i)}function Av(e,t,n,r,i){let a=n.attributes.POSITION;if(!a)return;let o=`${e}:${t}${n.targets?.length||i.skin!==void 0?`:${i.id}`:``}`,s=r.surfaceIdentifiers.get(o);if(s)return s;s=Bv(e,`primitive-${t}`,r);let c={"@@type":`triangle`,"vertex.position":Array.from(a.value)},l=n.attributes.NORMAL;l&&(c[`vertex.normal`]=Array.from(l.value));let u=n.attributes.TANGENT;u&&(c[`vertex.tangent`]=Array.from(u.value));let d=n.attributes.JOINTS_0;d&&(c[`vertex.joint`]=Array.from(d.value));let f=n.attributes.WEIGHTS_0;if(f){let e=f.normalized?f.value instanceof Uint8Array?255:f.value instanceof Uint16Array?65535:1:1;c[`vertex.weight`]=Array.from(f.value,t=>t/e)}n.indices&&(c[`primitive.index`]=Array.from(n.indices.value));let p=Mv(n,a.count);p&&(c[`vertex.attribute0`]=p);let m=n.attributes.TEXCOORD_0;m&&(c[`vertex.attribute1`]=Array.from(m.value));let h=n.attributes.TEXCOORD_1;h&&(c[`vertex.attribute2`]=Array.from(h.value)),n.targets?.length&&(c.morphTargets=n.targets.map(e=>{let t={};for(let n of[`POSITION`,`NORMAL`,`TANGENT`]){let i=e[n],a=typeof i==`number`?r.gltf.accessors[i]:i;a&&(t[n]=Array.from(a.value))}return t}),c.morphWeights=[...i.weights||i.mesh?.weights||Array(n.targets.length).fill(0)]);let g=jv(n.material,r),_=i.skin===void 0?void 0:r.gltf.skins?.[qs(r.gltf,i.skin)],v=_?{node:i.id,joints:_.joints.map(e=>r.gltf.nodes[e].id),..._.inverseBindMatrices?.value?{inverseBindMatrices:Array.from(_.inverseBindMatrices.value)}:{}}:void 0;return r.scene.geometries[s]=c,r.scene.surfaces[s]={geometry:s,material:g,...v?{skin:v}:{}},r.surfaceIdentifiers.set(o,s),s}function jv(e,t){if(!e){let e=`default-material`;return t.scene.materials[e]||={"@@type":`physicallyBased`,baseColor:[1,1,1],metallic:1,roughness:1,clearcoat:0},e}let n=t.materialIdentifiers.get(e);if(n)return n;let r=Bv(e.name||e.id,`material`,t),i=e.pbrMetallicRoughness,a=i?.baseColorFactor||[1,1,1,1],o=e.alphaMode===`BLEND`?`blend`:e.alphaMode===`MASK`?`mask`:`opaque`,s=e.extensions?.KHR_materials_clearcoat,c=e.extensions?.EXT_materials_bump,l=e.extensions?.KHR_materials_diffuse_transmission,u=e.extensions?.KHR_materials_dispersion,d=e.extensions?.KHR_materials_iridescence,f=e.extensions?.KHR_materials_transmission,p=e.extensions?.KHR_materials_sheen,m=e.extensions?.KHR_materials_specular,h=e.extensions?.KHR_materials_volume,g=e.extensions?.KHR_materials_volume_scatter,_=e.extensions?.KHR_materials_anisotropy,v=e.extensions?.KHR_materials_ior,y={"@@type":`physicallyBased`,baseColor:[a[0],a[1],a[2]],alphaMode:o,doubleSided:e.doubleSided??!1,metallic:Q(i?.metallicFactor??1,0,1),roughness:Q(i?.roughnessFactor??1,0,1),unlit:!!(`unlit`in e&&e.unlit||e.extensions?.KHR_materials_unlit),specularColor:Rv(m?.specularColorFactor,[1,1,1]),specularIntensity:Q(m?.specularFactor??1,0,1),clearcoat:Q(s?.clearcoatFactor??0,0,1),clearcoatRoughness:Q(s?.clearcoatRoughnessFactor??0,0,1),iridescence:Q(d?.iridescenceFactor??0,0,1),transmission:Q(f?.transmissionFactor??0,0,1),diffuseTransmission:Q(l?.diffuseTransmissionFactor??0,0,1),diffuseTransmissionColor:Rv(l?.diffuseTransmissionColorFactor,[1,1,1]),dispersion:Math.max(u?.dispersion??0,0),thickness:Math.max(h?.thicknessFactor??0,0),attenuationColor:Rv(h?.attenuationColor,[1,1,1]),multiscatterColor:h?Rv(g?.multiscatterColorFactor||g?.multiscatterColor,[0,0,0]):[0,0,0],scatterAnisotropy:h?Q(g?.scatterAnisotropy??0,-.999,.999):0,indexOfRefraction:Q(v?.ior??1.5,1,2.5),sheenColor:Rv(p?.sheenColorFactor,[0,0,0]),sheenRoughness:Q(p?.sheenRoughnessFactor??0,0,1),iridescenceIndexOfRefraction:Math.max(d?.iridescenceIor??1.3,1),iridescenceThicknessMinimum:Math.max(d?.iridescenceThicknessMinimum??100,0),iridescenceThicknessMaximum:Math.max(d?.iridescenceThicknessMaximum??400,0),anisotropyStrength:Q(_?.anisotropyStrength??0,0,1),anisotropyRotation:_?.anisotropyRotation??0,bumpFactor:Math.max(c?.bumpFactor??1,0),normalScale:Q(e.normalTexture?.scale??1,0,4),occlusionStrength:Q(e.occlusionTexture?.strength??1,0,1)};h?.attenuationDistance!==void 0&&h.attenuationDistance>0&&(y.attenuationDistance=h.attenuationDistance);for(let{slot:n,pathSegments:r,colorSpace:i}of vs())Pv(y,`${n}Texture`,Fv(e,r),i,t);let b=e.emissiveFactor||[0,0,0];return(e.emissiveTexture||b.some(e=>e>0))&&(y.emissive=Rv(b,[1,1,1]),y.emissiveStrength=e.extensions?.KHR_materials_emissive_strength?.emissiveStrength??1),o===`mask`&&(y.alphaCutoff=Q(e.alphaCutoff??.5,0,1)),(o===`blend`||o===`mask`)&&(y.opacity=Q(a[3],0,1)),t.scene.materials[r]=y,t.materialIdentifiers.set(e,r),r}function Mv(e,t){let n=e.attributes.COLOR_0;if(!n)return;let r=n.components===4?4:3,i=Array(t*r);for(let e=0;e<t;e++){let t=Nv(n,e),a=e*r;if(i[a]=t[0],i[a+1]=t[1],i[a+2]=t[2],r===4){let t=n.value[e*n.components+3],r=n.normalized?n.componentType===5121?255:n.componentType===5123?65535:1:1;i[a+3]=t/r}}return i}function Nv(e,t){if(!e)return[1,1,1];let n=t*e.components,r=e.normalized?e.componentType===5121?255:e.componentType===5123?65535:1:1;return[e.value[n]/r,e.value[n+1]/r,e.value[n+2]/r]}function Pv(e,t,n,r,i){if(!n)return;let a=n.texture||(typeof n.index==`number`?i.gltf.textures[n.index]:void 0),o=a?.source;if(!o)return;let s=Lv(n),c=bs(n)===1?1:0,l=Cs(a.sampler),u=Object.entries(l).map(([e,t])=>`${e}:${t}`).join(`,`),d=`${o.id}:${r}:${c}:${s?.join(`,`)||`identity`}:${u}`,f=i.textureIdentifiers.get(d);if(!f){let e=Iv(o,i);if(!e)return;f=Bv(o.name||o.id,`texture`,i);let t={source:e,colorSpace:r};c===1&&(t.textureCoordinateSet=c),s&&(t.transform=s),Object.keys(l).length>0&&(t.sampler=l),i.scene.textures||={},i.scene.textures[f]=t,i.textureIdentifiers.set(d,f)}e[t]=f}function Fv(e,t){let n=e;for(let e of t){if(!n||typeof n!=`object`)return;n=Reflect.get(n,e)}return n&&typeof n==`object`?n:void 0}function Iv(e,t){let n=t.imageSources.get(e);if(n)return n;let r=e.bufferView?.data||e.image?.data,i=r?URL.createObjectURL(new Blob([new Uint8Array(r)],{type:e.mimeType||`image/png`})):e.uri;return i&&t.imageSources.set(e,i),i}function Lv(e){if(!e.extensions?.KHR_texture_transform)return;let t=Ss(ys(e));return[t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8]]}function Rv(e,t){return e&&e.length>=3?[e[0],e[1],e[2]]:t}function zv(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function Bv(e,t,n){return`${e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`gltf`}-${t}-${n.nextIdentifier++}`}function Q(e,t,n){return Math.max(t,Math.min(n,e))}var Vv=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/,Hv=new Set([`uniform`,`varying`,`custom`,`prepend`,`append`,`add`,`delete`,`reorder`]);function Uv(e,t){if(!e.trimStart().startsWith(`#usda`))throw Error(`OpenUSD ASCII layers must begin with the #usda header.`);return new Wv(e,t).parse()}var Wv=class{tokenizer;url;constructor(e,t){this.tokenizer=new Gv(e),this.url=t}parse(){let e=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{},t=[];for(;!this.tokenizer.isAtEnd();)this.isPrimDeclaration()?t.push(this.parsePrim(``)):this.tokenizer.read();return{format:`usda`,url:this.url,metadata:e,rootPrims:t,layers:this.url?[this.url]:[]}}parsePrim(e){let t=this.tokenizer.read().value,n=this.tokenizer.read(),r=this.tokenizer.peek().kind===`string`,i=r?n.value:``,a=r?this.tokenizer.read().value:n.value,o=`${e}/${a}`,s=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{};this.tokenizer.expect(`{`);let c=this.parsePrimContents(o);return{name:a,path:o,sourceUrl:this.url,type:i,specifier:t,attributes:c.attributes,metadata:{...s,...c.metadata},variants:c.variants,children:c.children}}parsePrimContents(e){let t={},n={},r=[],i={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);)if(this.isPrimDeclaration())r.push(this.parsePrim(e));else if(this.tokenizer.peek().value===`variantSet`)this.parseVariantSet(e,i);else{let e=this.parseAttribute();e&&(t[e.name]=e)}return{attributes:t,metadata:n,children:r,variants:i}}parseVariantSet(e,t){this.tokenizer.expect(`variantSet`);let n=this.tokenizer.read().value;this.tokenizer.expect(`=`),this.tokenizer.expect(`{`);let r={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);){let t=this.tokenizer.read().value;this.tokenizer.expect(`{`);let n=this.parsePrimContents(e);r[t]={attributes:n.attributes,metadata:n.metadata,children:n.children}}t[n]=r}parseAttribute(){let e=this.tokenizer.read();if(e.kind===`end`)return null;let t=[e];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===e.line;){let e=this.tokenizer.peek();if(e.value===`=`){this.tokenizer.read();break}if(e.value===`{`||e.value===`}`)return null;t.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`)return null;let n=t.filter(e=>!Hv.has(e.value));return n.length===0?null:{name:n[n.length-1].value,type:n.slice(0,-1).map(e=>e.value).join(``),value:this.parseValue(),metadata:this.tokenizer.match(`(`)?this.parseMetadata(`)`):{}}}parseMetadata(e){let t={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);){if(this.tokenizer.match(`,`),this.tokenizer.peek().value===e){this.tokenizer.read();break}let n=this.tokenizer.read(),r=[n];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===n.line;){if(this.tokenizer.peek().value===`=`||this.tokenizer.peek().value===`:`){this.tokenizer.read();break}if(this.tokenizer.peek().value===e)break;r.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`&&this.tokenizer.previousValue!==`:`)continue;let i=r[r.length-1].value;t[i]=this.parseValue(),this.tokenizer.match(`,`)}return t}parseValue(){let e=this.tokenizer.read();if(e.value===`[`)return this.parseList(`]`);if(e.value===`(`)return this.parseList(`)`);if(e.value===`{`)return this.parseMetadata(`}`);if(e.kind===`asset`){let t={assetPath:e.value};return this.tokenizer.peek().kind===`path`&&this.tokenizer.peek().line===e.line&&(t.primPath=this.tokenizer.read().value),t}return e.kind===`path`?{path:e.value}:e.kind===`number`?Number(e.value):e.value===`true`?!0:e.value===`false`?!1:e.value===`None`||e.value===`null`?null:e.value}parseList(e){let t=[];for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);)this.tokenizer.match(`,`)||(t.push(this.parseValue()),this.tokenizer.match(`,`));return t}isPrimDeclaration(){let e=this.tokenizer.peek().value;return e===`def`||e===`over`||e===`class`}},Gv=class{source;offset=0;line=1;bufferedToken=null;previousValue=``;constructor(e){this.source=e}peek(){return this.bufferedToken||=this.readToken(),this.bufferedToken}read(){let e=this.peek();return this.bufferedToken=null,this.previousValue=e.value,e}match(e){return this.peek().value===e?(this.read(),!0):!1}expect(e){let t=this.read();if(t.value!==e)throw Error(`Expected "${e}" at USDA line ${t.line}, received "${t.value}".`)}isAtEnd(){return this.peek().kind===`end`}readToken(){this.skipIgnoredText();let e=this.line,t=this.source[this.offset];if(t===void 0)return{value:``,line:e,kind:`end`};if(`{}[](),=`.includes(t))return this.offset++,{value:t,line:e,kind:`punctuation`};if(t===`"`||t===`'`)return{value:this.readQuotedString(t),line:e,kind:`string`};if(t===`@`)return{value:this.readDelimitedValue(`@`),line:e,kind:`asset`};if(t===`<`)return{value:this.readDelimitedValue(`>`),line:e,kind:`path`};let n=this.source.slice(this.offset).match(Vv);if(n)return this.offset+=n[0].length,{value:n[0],line:e,kind:`number`};let r=this.offset;for(;this.offset<this.source.length;){let e=this.source[this.offset];if(/\s/.test(e)||`{}[](),=@<>`.includes(e))break;this.offset++}return this.offset===r&&this.offset++,{value:this.source.slice(r,this.offset),line:e,kind:`word`}}skipIgnoredText(){for(;this.offset<this.source.length;){let e=this.source[this.offset];if(e===`
`)this.line++,this.offset++;else if(/\s/.test(e))this.offset++;else if(e===`#`)for(;this.offset<this.source.length&&this.source[this.offset]!==`
`;)this.offset++;else if(e===`/`&&this.source[this.offset+1]===`*`){for(this.offset+=2;this.offset<this.source.length&&!this.source.startsWith(`*/`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=2}else if(this.source.startsWith(`"""`,this.offset)){for(this.offset+=3;this.offset<this.source.length&&!this.source.startsWith(`"""`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=3}else break}}readQuotedString(e){this.offset++;let t=``;for(;this.offset<this.source.length;){let n=this.source[this.offset++];if(n===e)break;if(n===`\\`&&this.offset<this.source.length){let e=this.source[this.offset++];t+=e===`n`?`
`:e}else t+=n}return t}readDelimitedValue(e){this.offset++;let t=this.offset;for(;this.offset<this.source.length&&this.source[this.offset]!==e;)this.offset++;let n=this.source.slice(t,this.offset);return this.offset++,n}},Kv=101010256,qv=33639248,Jv=67324752;function Yv(e){let t=new DataView(e),n=Xv(t),r=t.getUint16(n+10,!0),i=t.getUint32(n+16,!0),a=new Map,o=new TextDecoder;for(let n=0;n<r;n++){if(t.getUint32(i,!0)!==qv)throw Error(`USDZ archive contains an invalid ZIP central-directory entry.`);let n=t.getUint16(i+10,!0),r=t.getUint32(i+20,!0),s=t.getUint16(i+28,!0),c=t.getUint16(i+30,!0),l=t.getUint16(i+32,!0),u=t.getUint32(i+42,!0),d=o.decode(new Uint8Array(e,i+46,s));if(n!==0)throw Error(`USDZ entry "${d}" is compressed; USDZ requires stored ZIP entries.`);if(t.getUint32(u,!0)!==Jv)throw Error(`USDZ entry "${d}" has an invalid local ZIP header.`);let f=t.getUint16(u+26,!0),p=t.getUint16(u+28,!0),m=u+30+f+p;a.set(d,e.slice(m,m+r)),i+=46+s+c+l}return a}function Xv(e){let t=Math.max(0,e.byteLength-65557);for(let n=e.byteLength-22;n>=t;n--)if(e.getUint32(n,!0)===Kv)return n;throw Error(`USDZ archive does not contain a ZIP end-of-central-directory record.`)}var Zv=new TextDecoder,Qv=`PXR-USDC`,$v=67324752,ey={dataType:null,batchType:null,name:`Universal Scene Description`,id:`usd`,module:`usd`,version:`0.0.0-experimental`,extensions:[`usd`,`usda`,`usdz`],mimeTypes:[`model/vnd.usd`,`model/vnd.usda`,`model/vnd.usdz+zip`],text:!0,binary:!0,tests:[`#usda`,`PK`],parse:ty,options:{usd:{compose:!0,loadReferences:!0,maxReferenceDepth:12,variantSelections:{}}}};async function ty(e,t={},n){let r=n?.url||t.core?.baseUrl,i={fetch:async e=>{let t=await(n?.fetch||fetch)(e);if(!(t instanceof Response))throw Error(`OpenUSD reference "${e}" did not return an HTTP response.`);if(!t.ok)throw Error(`Unable to load OpenUSD reference "${e}": ${t.status}.`);return t},cache:new Map,archiveFiles:new Map,layers:new Set,options:{...t,usd:{...ey.options.usd,...t.usd}}},a;if(py(e)){let t=Yv(e),n=Array.from(t.keys()).find(e=>/\.usda?$/i.test(e));if(!n)throw Error(`USDZ archives with binary USDC root layers are not implemented yet.`);let r=`https://usd.archive/`;for(let[e,n]of t)i.archiveFiles.set(new URL(e,r).href,n);let o=new URL(n,r).href;a=ny(t.get(n),o),a.format=`usdz`}else a=ny(e,r);return a.url&&i.layers.add(a.url),i.options.usd?.compose!==!1&&(a.rootPrims=await ry(a.rootPrims,a.url,{},i,0)),a.layers=Array.from(i.layers),r&&(a.url=r),a}function ny(e,t){if(Zv.decode(e.slice(0,8))===Qv)throw Error(`Binary USDC crate layers are not implemented yet; use ASCII USDA layers.`);return Uv(Zv.decode(e),t)}async function ry(e,t,n,r,i){if(i>(r.options.usd?.maxReferenceDepth??12))throw Error(`OpenUSD reference composition exceeded the configured depth limit.`);let a=[];for(let o of e){if(o.specifier===`class`)continue;let e={...cy(o.metadata.variants),...n,...r.options.usd?.variantSelections},s=o.sourceUrl||t,c=uy(o);for(let[t,n]of Object.entries(c.variants)){let r=n[e[t]||Object.keys(n)[0]];r&&(c=fy(c,{...c,attributes:r.attributes,metadata:r.metadata,children:r.children,variants:{}}))}let l=sy(c);if(r.options.usd?.loadReferences!==!1&&l.length>0)for(let t of l){if(!s)throw Error(`OpenUSD references require a source URL or options.core.baseUrl.`);let n=new URL(t.assetPath,s).href,a=await ry(ay(await iy(n,r),t.primPath),n,e,r,i+1);for(let e of a)c=fy(dy(e,c.path),c)}c.children=await ry(c.children,s,e,r,i+1),a.push(c)}return a}async function iy(e,t){let n=t.cache.get(e);return n||(n=(async()=>{let n=t.archiveFiles.get(e);if(!n){let r;try{r=await t.fetch(e)}catch(t){throw Error(`Unable to fetch USD layer "${e}": ${String(t)}`)}if(!r.ok)throw Error(`Unable to fetch USD layer "${e}": ${r.status}.`);n=r.arrayBuffer()}let r=ny(await n,e);return t.layers.add(e),r})(),t.cache.set(e,n)),n}function ay(e,t){let n=t||e.metadata.defaultPrim;if(typeof n!=`string`)return e.rootPrims;let r=n.startsWith(`/`)?n:`/${n}`,i=oy(e.rootPrims,r);return i?[i]:[]}function oy(e,t){for(let n of e){if(n.path===t)return n;let e=oy(n.children,t);if(e)return e}}function sy(e){let t=[];for(let n of[e.metadata.references,e.metadata.payload,e.metadata.payloads])Array.isArray(n)?t.push(...n.filter(ly)):ly(n)&&t.push(n);return t}function cy(e){return!e||typeof e!=`object`||Array.isArray(e)||ly(e)?{}:Object.fromEntries(Object.entries(e).filter(e=>typeof e[1]==`string`))}function ly(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`assetPath`in e)}function uy(e){return{...e,attributes:{...e.attributes},metadata:{...e.metadata},variants:{...e.variants},children:e.children.map(uy)}}function dy(e,t){let n=uy(e);return n.path=t,n.children=n.children.map(e=>dy(e,`${t}/${e.name}`)),n}function fy(e,t){let n=e.children.map(uy);for(let e of t.children){let t=n.findIndex(t=>t.name===e.name);t>=0?n[t]=fy(n[t],e):n.push(uy(e))}return{...e,...t,sourceUrl:sy(t).length>0?t.sourceUrl:e.sourceUrl||t.sourceUrl,type:t.type||e.type,attributes:{...e.attributes,...t.attributes},metadata:{...e.metadata,...t.metadata},variants:{...e.variants,...t.variants},children:n}}function py(e){return e.byteLength>=4&&new DataView(e).getUint32(0,!0)===$v}var my={usd:{variantSelections:{wheels:`wheelNormal`}}};function $(e){return new URL(e,document.baseURI).href}var hy=[{identifier:`gltf-expressive-robot`,label:`glTF · Expressive Robot · 14 Animated Clips`,url:$(`./gltf/RobotExpressive.glb`),format:`gltf`},{identifier:`gltf-animated-morphs`,label:`glTF · Animated Morph Targets`,url:$(`./gltf/AnimatedMorphCube.glb`),format:`gltf`},{identifier:`gltf-animated-skin`,label:`glTF · Animated Skeleton`,url:$(`./gltf/SimpleSkin.gltf`),format:`gltf`},{identifier:`gltf-animated-colors`,label:`glTF · Animated Colors`,url:$(`./gltf/AnimatedColorsCube.glb`),format:`gltf`},{identifier:`gltf-antique-camera`,label:`glTF · Antique Camera`,url:$(`./gltf/AntiqueCamera.glb`),format:`gltf`},{identifier:`gltf-lantern`,label:`glTF · Brass Lantern`,url:$(`./gltf/Lantern.glb`),format:`gltf`},{identifier:`gltf-toy-car`,label:`glTF · Vintage Toy Car`,url:$(`./gltf/ToyCar.glb`),format:`gltf`},{identifier:`porcelain-atelier`,label:`OpenUSD · Porcelain Atelier`,url:$(`./usd/porcelain-atelier.usda`),format:`usd`},{identifier:`knights-gambit`,label:`OpenUSD · Knight’s Gambit`,url:$(`./usd/knights-gambit.usda`),format:`usd`},{identifier:`vehicle-gallery`,label:`OpenUSD · Vehicle Gallery`,url:$(`./usd/vehicle-gallery.usda`),format:`usd`,options:my},{identifier:`material-laboratory`,label:`OpenUSD · Prismatic Materials`,url:$(`./usd/material-laboratory.usda`),format:`usd`},{identifier:`formula-racer`,label:`OpenUSD · Formula Racer`,url:$(`./usd/mini-vehicles/assets/vehicles/formula/asset/formulaFullAsset.usda`),format:`usd`,options:my},{identifier:`crimson-sedan`,label:`OpenUSD · Crimson Sedan`,url:$(`./usd/mini-vehicles/assets/vehicles/sedan/asset/sedanFullAsset.usda`),format:`usd`,options:my},{identifier:`precision-wheel`,label:`OpenUSD · Precision Wheel`,url:$(`./usd/mini-vehicles/assets/wheels/wheelNormal/asset/wheelNormalAsset.usda`),format:`usd`}];async function gy(e){let t=hy.find(t=>t.identifier===e);if(!t)throw Error(`Unknown 3D sample "${e}".`);let n=t.label.replace(/^(OpenUSD|glTF) · /,``).toUpperCase();if(t.format===`gltf`){let e=await Ev(Gh(await J_(t.url,Dh,{gltf:{loadImages:!1}})),n);return await og(e),e}let r=Y_(await J_(t.url,ey,t.options),n);return await og(r),r}async function _y(e){let t=e.name.replace(/\.(usd|usda|usdz|gltf|glb)$/i,``).replace(/[-_]/g,` `).toUpperCase();if(/\.(gltf|glb)$/i.test(e.name)){let n=await Ev(Gh(await K_(await e.arrayBuffer(),Dh,{gltf:{loadImages:!1}})),t);return await og(n),n}let n=Y_(await ey.parse(await e.arrayBuffer()),t);return await og(n),n}export{pg as a,_f as c,vs as d,gs as f,sg as i,kl as l,_y as n,yg as o,gy as r,fg as s,hy as t,ws as u};