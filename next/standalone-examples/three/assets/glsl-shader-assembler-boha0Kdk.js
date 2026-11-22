import{S as e,_ as t,a as n,b as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,n as d,r as f,u as p,v as m,y as h}from"./get-platform-info-6Wpq5jqk.js";function g(e,t){return{name:_(e,t),language:`glsl`,version:v(e)}}function _(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function v(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function y(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`;function D(e){let{vs:t,fs:n}=e,r=h(e.modules||[]);return{vs:O(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:O(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:a(r)}}function O(a,m){let{source:h,stage:_,language:v=`glsl`,modules:x,defines:S={},injectionTargets:C=[],inject:w={},pluginInjections:T={},pluginVertexInputs:D={},pluginInterStageVariables:O={},prologue:A=!0,log:j}=m;e(typeof h==`string`,`shader source must be a string`);let M=v===`glsl`?g(h).version:-1,N=a.shaderLanguageVersion,P=M===100?`#version 100`:`#version 300 es`,F=h.split(`
`).slice(1).join(`
`),I={};x.forEach(e=>{Object.assign(I,e.defines)}),Object.assign(I,S);let L=``;switch(v){case`wgsl`:break;case`glsl`:L=A?`\
${P}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${_.toUpperCase()}`}

${y(a)}
${_===`fragment`?E:``}

// ----- APPLICATION DEFINES -------------------------

${k(I)}

`:`${P}
`;break}let R=f(C,m.pluginInjectionTargets,`glsl`),z={},B={},V={};p(T,z,B,V),p(Array.isArray(w)?t(w,`glsl`):{},z,B,V);let H=Array.isArray(w)?{}:w;for(let e in H){let t=typeof H[e]==`string`?{injection:H[e],order:0}:H[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?B[e]=[...B[e]||[],t]:V[e]=[...V[e]||[],t]:z[e]=[...z[e]||[],t]}else V[e]=[...V[e]||[],t]}if(_===`vertex`){let e=i(F,D);e&&(L+=`${e}\n`)}let U=n(F,_,O);U.declarations&&(L+=`${U.declarations}\n`),U.initialization&&(V[`vs:#main-start`]=V[`vs:#main-start`]||[],V[`vs:#main-start`].push({injection:U.initialization,order:-(2**53-1)}));for(let e of x){j&&r(e,F,j);let t=o(e,_,j);L+=t}return l(R,z,_),L+=`// ----- MAIN SHADER SOURCE -------------------------`,L+=u,L=s(L,_,B),L+=d(R[_],z),L+=F,L=s(L,_,V),v===`glsl`&&M!==N&&(L=b(L,_)),v===`glsl`&&c(L,_,j),L.trim()}function k(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var A=class extends m{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...D({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}};export{A as t};