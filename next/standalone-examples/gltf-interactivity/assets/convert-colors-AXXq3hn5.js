import{r as e}from"./buffer-BovtX3qk.js";import{A as t,C as n,D as r,M as i,O as a,S as o,_ as s,b as c,g as l,h as u,j as d,k as f,m as p,p as m,w as h,x as g}from"./expression-CwJ2DKzu.js";import{t as _}from"./common-CQ0KA7K9.js";import{i as v}from"./gpu-vector-CguWXzI9.js";function y(e,t){return{name:b(e,t),language:`glsl`,version:x(e)}}function b(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function x(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function S(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function C(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=D(e,T),e;case`fragment`:return e=D(e,E),e;default:throw Error(t)}}var w=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],T=[...w,[O(`attribute`),`in $1`],[O(`varying`),`out $1`]],E=[...w,[O(`varying`),`in $1`]];function D(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function O(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var k=`precision highp float;
`;function A(e){let{vs:r,fs:i}=e,a=t(e.modules||[]);return{vs:j(e.platformInfo,{...e,source:r,stage:`vertex`,modules:a}),fs:j(e.platformInfo,{...e,source:i,stage:`fragment`,modules:a}),getUniforms:n(a)}}function j(e,t){let{source:n,stage:m,language:_=`glsl`,modules:v,defines:b={},injectionTargets:x=[],inject:w={},pluginInjections:T={},pluginVertexInputs:E={},pluginInterStageVariables:D={},prologue:O=!0,log:A}=t;i(typeof n==`string`,`shader source must be a string`);let j=_===`glsl`?y(n).version:-1,N=e.shaderLanguageVersion,P=j===100?`#version 100`:`#version 300 es`,F=n.split(`
`).slice(1).join(`
`),I={};v.forEach(e=>{Object.assign(I,e.defines)}),Object.assign(I,b);let L=``;switch(_){case`wgsl`:break;case`glsl`:L=O?`\
${P}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${m.toUpperCase()}`}

${S(e)}
${m===`fragment`?k:``}

// ----- APPLICATION DEFINES -------------------------

${M(I)}

`:`${P}
`;break}let R=u(x,t.pluginInjectionTargets,`glsl`),z={},B={},V={};o(T,z,B,V),o(Array.isArray(w)?f(w,`glsl`):{},z,B,V);let H=Array.isArray(w)?{}:w;for(let e in H){let t=typeof H[e]==`string`?{injection:H[e],order:0}:H[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?B[e]=[...B[e]||[],t]:V[e]=[...V[e]||[],t]:z[e]=[...z[e]||[],t]}else V[e]=[...V[e]||[],t]}if(m===`vertex`){let e=c(F,E);e&&(L+=`${e}\n`)}let U=s(F,m,D);U.declarations&&(L+=`${U.declarations}\n`),U.initialization&&(V[`vs:#main-start`]=V[`vs:#main-start`]||[],V[`vs:#main-start`].push({injection:U.initialization,order:-(2**53-1)}));for(let e of v){A&&d(e,F,A);let t=h(e,m,A);L+=t}return l(R,z,m),L+=`// ----- MAIN SHADER SOURCE -------------------------`,L+=g,L=a(L,m,B),L+=p(R[m],z),L+=F,L=a(L,m,V),_===`glsl`&&j!==N&&(L=C(L,m)),_===`glsl`&&r(L,m,A),L.trim()}function M(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var N=class extends m{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...A({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}},P=`#version 300 es
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;function F(e){let{input:t,inputChannels:n,output:r}=e||{};if(!t)return P;if(!n)throw Error(`inputChannels`);return`\
#version 300 es
in ${I(n)} ${t};
out vec4 ${r};
void main() {
  ${r} = ${L(t,n)};
}`}function I(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`invalid channels: ${e}`)}}function L(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}var R=null,z=new ArrayBuffer(4),B=new Float32Array(z),V=new Uint32Array(z);function H(e){R||=W(),e=_(e,-65504,65504),B[0]=e;let t=V[0],n=t>>23&511;return R.baseTable[n]+((t&8388607)>>R.shiftTable[n])}function U(e){R||=W();let t=e>>10;return V[0]=R.mantissaTable[R.offsetTable[t]+(e&1023)]+R.exponentTable[t],B[0]}function W(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let n=0;n<256;++n){let r=n-127;r<-27?(e[n]=0,e[n|256]=32768,t[n]=24,t[n|256]=24):r<-14?(e[n]=1024>>-r-14,e[n|256]=1024>>-r-14|32768,t[n]=-r-1,t[n|256]=-r-1):r<=15?(e[n]=r+15<<10,e[n|256]=r+15<<10|32768,t[n]=13,t[n|256]=13):r<128?(e[n]=31744,e[n|256]=64512,t[n]=24,t[n|256]=24):(e[n]=31744,e[n|256]=64512,t[n]=13,t[n|256]=13)}let n=new Uint32Array(2048),r=new Uint32Array(64),i=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;!(t&8388608);)t<<=1,r-=8388608;t&=-8388609,r+=947912704,n[e]=t|r}for(let e=1024;e<2048;++e)n[e]=939524096+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=1199570944,r[32]=2147483648;for(let e=33;e<63;++e)r[e]=2147483648+(e-32<<23);r[63]=3347054592;for(let e=1;e<64;++e)e!==32&&(i[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:n,exponentTable:r,offsetTable:i}}var G=class{buffer;format;length;valueLength;byteOffset;byteStride;rowByteLength;valueOffsets;nullBitmap;constructor(t){let n=v(t.format),r=ArrayBuffer.isView(t.buffer)?t.buffer:void 0;this.buffer=r?r.buffer:t.buffer,this.format=t.format,this.length=t.length,this.valueLength=t.valueLength??t.length*(n.listSize??1);let i=t.byteOffset??0;this.byteOffset=(r?.byteOffset??0)+i,this.rowByteLength=t.rowByteLength??n.byteLength,this.byteStride=t.byteStride??this.rowByteLength,this.valueOffsets=t.valueOffsets,this.nullBitmap=t.nullBitmap;let a=n.vertexList||n.valueList,o=a?this.valueLength:this.length;e([this.length,this.valueLength,i,this.rowByteLength,this.byteStride].every(e=>Number.isSafeInteger(e)&&e>=0)),e(this.rowByteLength>=n.byteLength&&this.byteStride>=this.rowByteLength),e(a||this.valueLength===this.length*(n.listSize??1)),e(i+(o?(o-1)*this.byteStride+this.rowByteLength:0)<=t.buffer.byteLength)}};function K(t,n,r){let i=v(t.format),a=r?.startsWith(`float16`)?`float16`:i.signedDataType,o=r?.endsWith(`x3`)?3:i.components;e((o===3||o===4)&&[`uint8`,`float16`,`float32`].includes(a));let s=a===`uint8`?1:a===`float16`?2:4,c=new DataView(t.buffer,t.byteOffset),l=n===`unorm8x4`?new Uint8Array(t.length*4):n===`float16x4`?new Uint16Array(t.length*4):new Float32Array(t.length*4),u=new DataView(new ArrayBuffer(4));for(let e=0;e<t.length;e++)for(let r=0;r<4;r++){let i=e*t.byteStride+r*s,d=r>=o?1:a===`uint8`?c.getUint8(i)/255:a===`float16`?U(c.getUint16(i,!0)):c.getFloat32(i,!0);l[e*4+r]=n===`unorm8x4`?Math.round(Math.min(Math.max(d,0),1)*255):n===`float16x4`?q(d,u):d}return new G({buffer:l,format:n,length:t.length,nullBitmap:t.nullBitmap&&new Uint8Array(t.nullBitmap)})}function q(e,t){t.setFloat32(0,e,!0);let n=t.getUint32(0,!0),r=n>>>16&32768,i=n>>>23&255,a=n&8388607;if(i===255)return r|31744|(a?512:0);if(i>142)return r|31744;if(i<102)return r;let o=i<113?126-i:13,s=i<113?a|8388608:a,c=2**o,l=Math.floor(s/c),u=s%c,d=l+(u>c/2||u===c/2&&l%2?1:0);return r|(i<113?0:(i-112)*1024)+d}var J=({inputs:e,output:t,target:n})=>Y(e,t,n);async function Y(e,t,n){let r=await e.source.ensureCPUValue(),i=v(e.inputFormat),a=v(e.outputFormat),o=new t.ValueType(t.length*t.size),s=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,c=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let n=0;n<t.length;n++)for(let l=0;l<t.size;l++){let u=r[s+n*c+l],d=X(u,e.source.type,i.normalized);o[n*t.size+l]=Z(d,t,a.normalized)}return n.write(o),{success:!0,value:o}}function X(e,t,n){if(t===`float16`)return U(e);if(!n)return e;let{minimum:r,maximum:i}=Q(t);return Math.max(e/i,r<0?-1:0)}function Z(e,t,n){if(t.type===`float16`)return H(e);if(!n&&t.type===`float32`)return e;let{minimum:r,maximum:i}=Q(t.type),a=n?e*i:e;return Math.round(Math.min(i,Math.max(r,a)))}function Q(e){switch(e){case`sint8`:return{minimum:-127,maximum:127};case`sint16`:return{minimum:-32767,maximum:32767};case`sint32`:return{minimum:-2147483648,maximum:2147483647};case`uint8`:return{minimum:0,maximum:255};case`uint16`:return{minimum:0,maximum:65535};case`uint32`:return{minimum:0,maximum:4294967295};default:throw Error(`castData CPU output does not support ${e}`)}}var $=async({inputs:e,target:t})=>{let{source:n,inputFormat:r,outputFormat:i}=e,a=K(new G({buffer:await n.ensureCPUValue(),format:n.format??(r===`uint8x3`?`uint8x3-webgl`:r===`float16x3`?`uint16x3-webgl`:r),length:n.length,byteOffset:n.offset,byteStride:n.stride}),i,r),o=new Uint8Array(a.buffer,a.byteOffset,a.length*a.byteStride);return t.write(o),{success:!0}};export{N as i,J as n,F as r,$ as t};