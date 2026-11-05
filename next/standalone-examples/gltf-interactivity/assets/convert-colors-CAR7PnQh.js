import{A as e,C as t,E as n,M as r,N as i,P as a,S as o,T as s,_ as c,c as l,g as u,h as d,j as f,k as p,v as m,w as h,y as g}from"./expression-BFa5PVbr.js";import{t as _}from"./common-DtjpwCBB.js";function v(e,t){return{name:y(e,t),language:`glsl`,version:b(e)}}function y(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function b(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function x(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function S(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=E(e,w),e;case`fragment`:return e=E(e,T),e;default:throw Error(t)}}var C=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],w=[...C,[D(`attribute`),`in $1`],[D(`varying`),`out $1`]],T=[...C,[D(`varying`),`in $1`]];function E(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function D(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var O=`precision highp float;
`;function k(e){let{vs:t,fs:n}=e,i=r(e.modules||[]);return{vs:A(e.platformInfo,{...e,source:t,stage:`vertex`,modules:i}),fs:A(e.platformInfo,{...e,source:n,stage:`fragment`,modules:i}),getUniforms:s(i)}}function A(r,s){let{source:l,stage:d,language:_=`glsl`,modules:y,defines:b={},injectionTargets:C=[],inject:w={},pluginInjections:T={},pluginVertexInputs:E={},pluginInterStageVariables:D={},prologue:k=!0,log:A}=s;a(typeof l==`string`,`shader source must be a string`);let M=_===`glsl`?v(l).version:-1,N=r.shaderLanguageVersion,P=M===100?`#version 100`:`#version 300 es`,F=l.split(`
`).slice(1).join(`
`),I={};y.forEach(e=>{Object.assign(I,e.defines)}),Object.assign(I,b);let L=``;switch(_){case`wgsl`:break;case`glsl`:L=k?`\
${P}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${d.toUpperCase()}`}

${x(r)}
${d===`fragment`?O:``}

// ----- APPLICATION DEFINES -------------------------

${j(I)}

`:`${P}
`;break}let R=c(C,s.pluginInjectionTargets,`glsl`),z={},B={},V={};h(T,z,B,V),h(Array.isArray(w)?f(w,`glsl`):{},z,B,V);let H=Array.isArray(w)?{}:w;for(let e in H){let t=typeof H[e]==`string`?{injection:H[e],order:0}:H[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?B[e]=[...B[e]||[],t]:V[e]=[...V[e]||[],t]:z[e]=[...z[e]||[],t]}else V[e]=[...V[e]||[],t]}if(d===`vertex`){let e=o(F,E);e&&(L+=`${e}\n`)}let U=g(F,d,D);U.declarations&&(L+=`${U.declarations}\n`),U.initialization&&(V[`vs:#main-start`]=V[`vs:#main-start`]||[],V[`vs:#main-start`].push({injection:U.initialization,order:-(2**53-1)}));for(let e of y){A&&i(e,F,A);let t=n(e,d,A);L+=t}return m(R,z,d),L+=`// ----- MAIN SHADER SOURCE -------------------------`,L+=t,L=e(L,d,B),L+=u(R[d],z),L+=F,L=e(L,d,V),_===`glsl`&&M!==N&&(L=S(L,d)),_===`glsl`&&p(L,d,A),L.trim()}function j(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var M=class extends d{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...k({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}},N=`#version 300 es
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;function P(e){let{input:t,inputChannels:n,output:r}=e||{};if(!t)return N;if(!n)throw Error(`inputChannels`);return`\
#version 300 es
in ${F(n)} ${t};
out vec4 ${r};
void main() {
  ${r} = ${I(t,n)};
}`}function F(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`invalid channels: ${e}`)}}function I(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}var L=null,R=new ArrayBuffer(4),z=new Float32Array(R),B=new Uint32Array(R);function V(e){L||=U(),e=_(e,-65504,65504),z[0]=e;let t=B[0],n=t>>23&511;return L.baseTable[n]+((t&8388607)>>L.shiftTable[n])}function H(e){L||=U();let t=e>>10;return B[0]=L.mantissaTable[L.offsetTable[t]+(e&1023)]+L.exponentTable[t],z[0]}function U(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let n=0;n<256;++n){let r=n-127;r<-27?(e[n]=0,e[n|256]=32768,t[n]=24,t[n|256]=24):r<-14?(e[n]=1024>>-r-14,e[n|256]=1024>>-r-14|32768,t[n]=-r-1,t[n|256]=-r-1):r<=15?(e[n]=r+15<<10,e[n|256]=r+15<<10|32768,t[n]=13,t[n|256]=13):r<128?(e[n]=31744,e[n|256]=64512,t[n]=24,t[n|256]=24):(e[n]=31744,e[n|256]=64512,t[n]=13,t[n|256]=13)}let n=new Uint32Array(2048),r=new Uint32Array(64),i=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;!(t&8388608);)t<<=1,r-=8388608;t&=-8388609,r+=947912704,n[e]=t|r}for(let e=1024;e<2048;++e)n[e]=939524096+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=1199570944,r[32]=2147483648;for(let e=33;e<63;++e)r[e]=2147483648+(e-32<<23);r[63]=3347054592;for(let e=1;e<64;++e)e!==32&&(i[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:n,exponentTable:r,offsetTable:i}}var W=({inputs:e,output:t,target:n})=>G(e,t,n);async function G(e,t,n){let r=await e.source.ensureCPUValue(),i=l(e.inputFormat),a=l(e.outputFormat),o=new t.ValueType(t.length*t.size),s=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,c=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let n=0;n<t.length;n++)for(let l=0;l<t.size;l++){let u=r[s+n*c+l],d=K(u,e.source.type,i.normalized);o[n*t.size+l]=q(d,t,a.normalized)}return n.write(o),{success:!0,value:o}}function K(e,t,n){if(t===`float16`)return H(e);if(!n)return e;let{minimum:r,maximum:i}=J(t);return Math.max(e/i,r<0?-1:0)}function q(e,t,n){if(t.type===`float16`)return V(e);if(!n&&t.type===`float32`)return e;let{minimum:r,maximum:i}=J(t.type),a=n?e*i:e;return Math.round(Math.min(i,Math.max(r,a)))}function J(e){switch(e){case`sint8`:return{minimum:-127,maximum:127};case`sint16`:return{minimum:-32767,maximum:32767};case`sint32`:return{minimum:-2147483648,maximum:2147483647};case`uint8`:return{minimum:0,maximum:255};case`uint16`:return{minimum:0,maximum:65535};case`uint32`:return{minimum:0,maximum:4294967295};default:throw Error(`castData CPU output does not support ${e}`)}}var Y=async({inputs:e,output:t,target:n})=>{let{source:r,inputFormat:i}=e,a=await r.ensureCPUValue(),o=new t.ValueType(t.length*t.size),s=i.endsWith(`x3`)?3:4;for(let e=0;e<t.length;e++){let t=r.offset/r.ValueType.BYTES_PER_ELEMENT+e*(r.stride/r.ValueType.BYTES_PER_ELEMENT),n=e*4;o[n]=X(a,t,i),o[n+1]=X(a,t+1,i),o[n+2]=X(a,t+2,i),o[n+3]=s===4?X(a,t+3,i):255}return n.write(o),{success:!0,value:o}};function X(e,t,n){if(n.startsWith(`uint8`))return e[t];let r=n.startsWith(`float16`)?Z(e,t):e[t];return Math.round(Math.min(Math.max(r,0),1)*255)}function Z(e,t){let n=Q();return n&&e.constructor===n?e[t]:H(e[t])}function Q(){return globalThis.Float16Array}export{M as i,W as n,P as r,Y as t};