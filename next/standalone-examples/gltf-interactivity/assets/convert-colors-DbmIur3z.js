import{A as e,C as t,D as n,E as r,M as i,N as a,P as o,T as s,b as c,c as l,g as u,h as d,j as f,v as p,w as m,y as h}from"./expression-DIdRDWkR.js";import{t as g}from"./common-DtjpwCBB.js";function _(e,t){return{name:v(e,t),language:`glsl`,version:y(e)}}function v(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function y(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function b(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function x(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=T(e,C),e;case`fragment`:return e=T(e,w),e;default:throw Error(t)}}var S=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],C=[...S,[E(`attribute`),`in $1`],[E(`varying`),`out $1`]],w=[...S,[E(`varying`),`in $1`]];function T(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function E(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var D=`precision highp float;
`;function O(e){let{vs:t,fs:n}=e,i=f(e.modules||[]);return{vs:k(e.platformInfo,{...e,source:t,stage:`vertex`,modules:i}),fs:k(e.platformInfo,{...e,source:n,stage:`fragment`,modules:i}),getUniforms:r(i)}}function k(r,l){let{source:d,stage:f,language:g=`glsl`,modules:v,defines:y={},hookFunctions:S=[],inject:C={},pluginInjections:w={},pluginVertexInputs:T={},pluginInterStageVariables:E={},prologue:O=!0,log:k}=l;o(typeof d==`string`,`shader source must be a string`);let j=g===`glsl`?_(d).version:-1,M=r.shaderLanguageVersion,N=j===100?`#version 100`:`#version 300 es`,P=d.split(`
`).slice(1).join(`
`),F={};v.forEach(e=>{Object.assign(F,e.defines)}),Object.assign(F,y);let I=``;switch(g){case`wgsl`:break;case`glsl`:I=O?`\
${N}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${f.toUpperCase()}`}

${b(r)}
${f===`fragment`?D:``}

// ----- APPLICATION DEFINES -------------------------

${A(F)}

`:`${N}
`;break}let L=p(S,l.pluginHooks,`glsl`),R={},z={},B={};s(w,R,z,B);for(let e in C){let t=typeof C[e]==`string`?{injection:C[e],order:0}:C[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?z[e]=[...z[e]||[],t]:B[e]=[...B[e]||[],t]:R[e]=[...R[e]||[],t]}else B[e]=[...B[e]||[],t]}if(f===`vertex`){let e=t(P,T);e&&(I+=`${e}\n`)}let V=c(P,f,E);V.declarations&&(I+=`${V.declarations}\n`),V.initialization&&(B[`vs:#main-start`]=B[`vs:#main-start`]||[],B[`vs:#main-start`].push({injection:V.initialization,order:-(2**53-1)}));for(let e of v){k&&i(e,P,k);let t=n(e,f,k);I+=t;let r=e.instance?.normalizedInjections[f]||{};for(let e in r){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let n=t[2]===`decl`?z:B;n[e]=n[e]||[],n[e].push(r[e])}else R[e]=R[e]||[],R[e].push(r[e])}}return h(L,R,f),I+=`// ----- MAIN SHADER SOURCE -------------------------`,I+=m,I=a(I,f,z),I+=u(L[f],R),I+=P,I=a(I,f,B),g===`glsl`&&j!==M&&(I=x(I,f)),g===`glsl`&&e(I,f,k),I.trim()}function A(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var j=class extends d{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._hookFunctions,...e.hookFunctions||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...O({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,hookFunctions:n}),modules:t}}},M=`#version 300 es
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;function N(e){let{input:t,inputChannels:n,output:r}=e||{};if(!t)return M;if(!n)throw Error(`inputChannels`);return`\
#version 300 es
in ${P(n)} ${t};
out vec4 ${r};
void main() {
  ${r} = ${F(t,n)};
}`}function P(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`invalid channels: ${e}`)}}function F(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}var I=null,L=new ArrayBuffer(4),R=new Float32Array(L),z=new Uint32Array(L);function B(e){I||=H(),e=g(e,-65504,65504),R[0]=e;let t=z[0],n=t>>23&511;return I.baseTable[n]+((t&8388607)>>I.shiftTable[n])}function V(e){I||=H();let t=e>>10;return z[0]=I.mantissaTable[I.offsetTable[t]+(e&1023)]+I.exponentTable[t],R[0]}function H(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let n=0;n<256;++n){let r=n-127;r<-27?(e[n]=0,e[n|256]=32768,t[n]=24,t[n|256]=24):r<-14?(e[n]=1024>>-r-14,e[n|256]=1024>>-r-14|32768,t[n]=-r-1,t[n|256]=-r-1):r<=15?(e[n]=r+15<<10,e[n|256]=r+15<<10|32768,t[n]=13,t[n|256]=13):r<128?(e[n]=31744,e[n|256]=64512,t[n]=24,t[n|256]=24):(e[n]=31744,e[n|256]=64512,t[n]=13,t[n|256]=13)}let n=new Uint32Array(2048),r=new Uint32Array(64),i=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;!(t&8388608);)t<<=1,r-=8388608;t&=-8388609,r+=947912704,n[e]=t|r}for(let e=1024;e<2048;++e)n[e]=939524096+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=1199570944,r[32]=2147483648;for(let e=33;e<63;++e)r[e]=2147483648+(e-32<<23);r[63]=3347054592;for(let e=1;e<64;++e)e!==32&&(i[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:n,exponentTable:r,offsetTable:i}}var U=({inputs:e,output:t,target:n})=>W(e,t,n);async function W(e,t,n){let r=await e.source.ensureCPUValue(),i=l(e.inputFormat),a=l(e.outputFormat),o=new t.ValueType(t.length*t.size),s=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,c=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let n=0;n<t.length;n++)for(let l=0;l<t.size;l++){let u=r[s+n*c+l],d=G(u,e.source.type,i.normalized);o[n*t.size+l]=K(d,t,a.normalized)}return n.write(o),{success:!0,value:o}}function G(e,t,n){if(t===`float16`)return V(e);if(!n)return e;let{minimum:r,maximum:i}=q(t);return Math.max(e/i,r<0?-1:0)}function K(e,t,n){if(t.type===`float16`)return B(e);if(!n&&t.type===`float32`)return e;let{minimum:r,maximum:i}=q(t.type),a=n?e*i:e;return Math.round(Math.min(i,Math.max(r,a)))}function q(e){switch(e){case`sint8`:return{minimum:-127,maximum:127};case`sint16`:return{minimum:-32767,maximum:32767};case`sint32`:return{minimum:-2147483648,maximum:2147483647};case`uint8`:return{minimum:0,maximum:255};case`uint16`:return{minimum:0,maximum:65535};case`uint32`:return{minimum:0,maximum:4294967295};default:throw Error(`castData CPU output does not support ${e}`)}}var J=async({inputs:e,output:t,target:n})=>{let{source:r,inputFormat:i}=e,a=await r.ensureCPUValue(),o=new t.ValueType(t.length*t.size),s=i.endsWith(`x3`)?3:4;for(let e=0;e<t.length;e++){let t=r.offset/r.ValueType.BYTES_PER_ELEMENT+e*(r.stride/r.ValueType.BYTES_PER_ELEMENT),n=e*4;o[n]=Y(a,t,i),o[n+1]=Y(a,t+1,i),o[n+2]=Y(a,t+2,i),o[n+3]=s===4?Y(a,t+3,i):255}return n.write(o),{success:!0,value:o}};function Y(e,t,n){if(n.startsWith(`uint8`))return e[t];let r=n.startsWith(`float16`)?X(e,t):e[t];return Math.round(Math.min(Math.max(r,0),1)*255)}function X(e,t){let n=Z();return n&&e.constructor===n?e[t]:V(e[t])}function Z(){return globalThis.Float16Array}export{j as i,U as n,N as r,J as t};