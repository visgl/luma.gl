import{C as e,E as t,O as n,T as r,_ as i,b as a,d as o,f as s,g as c,k as l,l as u,p as d,v as f,w as p,y as m}from"./gpu-vector-chunks-CCN1Uq7J.js";function h(e,t){return{name:g(e,t),language:`glsl`,version:_(e)}}function g(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function _(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function v(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function y(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=C(e,x),e;case`fragment`:return e=C(e,S),e;default:throw Error(t)}}var b=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],x=[...b,[w(`attribute`),`in $1`],[w(`varying`),`out $1`]],S=[...b,[w(`varying`),`in $1`]];function C(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function w(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var T=`precision highp float;
`;function E(e){let{vs:t,fs:n}=e,i=r(e.modules||[]);return{vs:D(e.platformInfo,{...e,source:t,stage:`vertex`,modules:i}),fs:D(e.platformInfo,{...e,source:n,stage:`fragment`,modules:i}),getUniforms:m(i)}}function D(r,p){let{source:m,stage:g,language:_=`glsl`,modules:b,defines:x={},hookFunctions:S=[],inject:C={},pluginInjections:w={},pluginVertexInputs:E={},pluginInterStageVariables:D={},prologue:k=!0,log:A}=p;l(typeof m==`string`,`shader source must be a string`);let j=_===`glsl`?h(m).version:-1,M=r.shaderLanguageVersion,N=j===100?`#version 100`:`#version 300 es`,P=m.split(`
`).slice(1).join(`
`),F={};b.forEach(e=>{Object.assign(F,e.defines)}),Object.assign(F,x);let I=``;switch(_){case`wgsl`:break;case`glsl`:I=k?`\
${N}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${g.toUpperCase()}`}

${v(r)}
${g===`fragment`?T:``}

// ----- APPLICATION DEFINES -------------------------

${O(F)}

`:`${N}
`;break}let L=o(S,p.pluginHooks,`glsl`),R={},z={},B={};f(w,R,z,B);for(let e in C){let t=typeof C[e]==`string`?{injection:C[e],order:0}:C[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?z[e]=[...z[e]||[],t]:B[e]=[...B[e]||[],t]:R[e]=[...R[e]||[],t]}else B[e]=[...B[e]||[],t]}if(g===`vertex`){let e=c(P,E);e&&(I+=`${e}\n`)}let V=d(P,g,D);V.declarations&&(I+=`${V.declarations}\n`),V.initialization&&(B[`vs:#main-start`]=B[`vs:#main-start`]||[],B[`vs:#main-start`].push({injection:V.initialization,order:-(2**53-1)}));for(let e of b){A&&t(e,P,A);let n=a(e,g,A);I+=n;let r=e.instance?.normalizedInjections[g]||{};for(let e in r){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let n=t[2]===`decl`?z:B;n[e]=n[e]||[],n[e].push(r[e])}else R[e]=R[e]||[],R[e].push(r[e])}}return s(L,R,g),I+=`// ----- MAIN SHADER SOURCE -------------------------`,I+=i,I=n(I,g,z),I+=u(L[g],R),I+=P,I=n(I,g,B),_===`glsl`&&j!==M&&(I=y(I,g)),_===`glsl`&&e(I,g,A),I.trim()}function O(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var k=class extends p{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._hookFunctions,...e.hookFunctions||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...E({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,hookFunctions:n}),modules:t}}};export{k as t};