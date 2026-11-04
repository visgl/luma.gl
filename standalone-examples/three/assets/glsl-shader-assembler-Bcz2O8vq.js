import{C as e,D as t,E as n,S as r,T as i,_ as a,d as o,f as s,g as c,h as l,k as u,l as d,u as f,v as p,w as m,y as h}from"./gpu-vector-chunks-jU0_QPy4.js";function g(e,t){return{name:_(e,t),language:`glsl`,version:v(e)}}function _(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function v(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function y(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function b(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=w(e,S),e;case`fragment`:return e=w(e,C),e;default:throw Error(t)}}var x=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],S=[...x,[T(`attribute`),`in $1`],[T(`varying`),`out $1`]],C=[...x,[T(`varying`),`in $1`]];function w(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function T(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var E=`precision highp float;
`;function D(e){let{vs:t,fs:r}=e,i=n(e.modules||[]);return{vs:O(e.platformInfo,{...e,source:t,stage:`vertex`,modules:i}),fs:O(e.platformInfo,{...e,source:r,stage:`fragment`,modules:i}),getUniforms:p(i)}}function O(n,i){let{source:p,stage:_,language:v=`glsl`,modules:x,defines:S={},injectionTargets:C=[],inject:w={},pluginInjections:T={},pluginVertexInputs:D={},pluginInterStageVariables:O={},prologue:A=!0,log:j}=i;u(typeof p==`string`,`shader source must be a string`);let M=v===`glsl`?g(p).version:-1,N=n.shaderLanguageVersion,P=M===100?`#version 100`:`#version 300 es`,F=p.split(`
`).slice(1).join(`
`),I={};x.forEach(e=>{Object.assign(I,e.defines)}),Object.assign(I,S);let L=``;switch(v){case`wgsl`:break;case`glsl`:L=A?`\
${P}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${_.toUpperCase()}`}

${y(n)}
${_===`fragment`?E:``}

// ----- APPLICATION DEFINES -------------------------

${k(I)}

`:`${P}
`;break}let R=f(C,i.pluginInjectionTargets,`glsl`),z={},B={},V={};a(T,z,B,V),a(Array.isArray(w)?m(w,`glsl`):{},z,B,V);let H=Array.isArray(w)?{}:w;for(let e in H){let t=typeof H[e]==`string`?{injection:H[e],order:0}:H[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?B[e]=[...B[e]||[],t]:V[e]=[...V[e]||[],t]:z[e]=[...z[e]||[],t]}else V[e]=[...V[e]||[],t]}if(_===`vertex`){let e=l(F,D);e&&(L+=`${e}\n`)}let U=s(F,_,O);U.declarations&&(L+=`${U.declarations}\n`),U.initialization&&(V[`vs:#main-start`]=V[`vs:#main-start`]||[],V[`vs:#main-start`].push({injection:U.initialization,order:-(2**53-1)}));for(let e of x){j&&t(e,F,j);let n=h(e,_,j);L+=n}return o(R,z,_),L+=`// ----- MAIN SHADER SOURCE -------------------------`,L+=c,L=e(L,_,B),L+=d(R[_],z),L+=F,L=e(L,_,V),v===`glsl`&&M!==N&&(L=b(L,_)),v===`glsl`&&r(L,_,j),L.trim()}function k(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var A=class extends i{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...D({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}};export{A as t};