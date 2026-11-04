import{A as e,C as t,M as n,N as r,O as i,S as a,T as o,_ as s,c,g as l,h as u,j as d,k as f,m as p,v as m,w as h,x as ee}from"./expression-bZKAPYc5.js";1/Math.PI*180,1/180*Math.PI;var g={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...g}};var _=globalThis.mathgl.config;function v(e,{precision:t=_.precision}={}){return e=C(e),`${parseFloat(e.toPrecision(t))}`}function y(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function b(e,t,n){return T(e,e=>Math.max(t,Math.min(n,e)))}function x(e,t,n){return y(e)?e.map((e,r)=>x(e,t[r],n)):n*t+(1-n)*e}function S(e,t,n){let r=_.EPSILON;n&&(_.EPSILON=n);try{if(e===t)return!0;if(y(e)&&y(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!S(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`?Math.abs(e-t)<=_.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{_.EPSILON=r}}function C(e){return Math.round(e/_.EPSILON)*_.EPSILON}function w(e){return e.clone?e.clone():Array(e.length)}function T(e,t,n){if(y(e)){let r=e;n||=w(r);for(let i=0;i<n.length&&i<r.length;++i){let r=typeof e==`number`?e:e[i];n[i]=t(r,i,n)}return n}return t(e)}function E(e,t){return{name:D(e,t),language:`glsl`,version:O(e)}}function D(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function O(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function k(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function A(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=P(e,M),e;case`fragment`:return e=P(e,N),e;default:throw Error(t)}}var j=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],M=[...j,[F(`attribute`),`in $1`],[F(`varying`),`out $1`]],N=[...j,[F(`varying`),`in $1`]];function P(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function F(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var I=`precision highp float;
`;function L(e){let{vs:t,fs:n}=e,r=d(e.modules||[]);return{vs:R(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:R(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:h(r)}}function R(c,d){let{source:p,stage:h,language:g=`glsl`,modules:_,defines:v={},injectionTargets:y=[],inject:b={},pluginInjections:x={},pluginVertexInputs:S={},pluginInterStageVariables:C={},prologue:w=!0,log:T}=d;r(typeof p==`string`,`shader source must be a string`);let D=g===`glsl`?E(p).version:-1,O=c.shaderLanguageVersion,j=D===100?`#version 100`:`#version 300 es`,M=p.split(`
`).slice(1).join(`
`),N={};_.forEach(e=>{Object.assign(N,e.defines)}),Object.assign(N,v);let P=``;switch(g){case`wgsl`:break;case`glsl`:P=w?`\
${j}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${h.toUpperCase()}`}

${k(c)}
${h===`fragment`?I:``}

// ----- APPLICATION DEFINES -------------------------

${z(N)}

`:`${j}
`;break}let F=l(y,d.pluginInjectionTargets,`glsl`),L={},R={},B={};t(x,L,R,B),t(Array.isArray(b)?e(b,`glsl`):{},L,R,B);let V=Array.isArray(b)?{}:b;for(let e in V){let t=typeof V[e]==`string`?{injection:V[e],order:0}:V[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?R[e]=[...R[e]||[],t]:B[e]=[...B[e]||[],t]:L[e]=[...L[e]||[],t]}else B[e]=[...B[e]||[],t]}if(h===`vertex`){let e=ee(M,S);e&&(P+=`${e}\n`)}let H=m(M,h,C);H.declarations&&(P+=`${H.declarations}\n`),H.initialization&&(B[`vs:#main-start`]=B[`vs:#main-start`]||[],B[`vs:#main-start`].push({injection:H.initialization,order:-(2**53-1)}));for(let e of _){T&&n(e,M,T);let t=o(e,h,T);P+=t}return s(F,L,h),P+=`// ----- MAIN SHADER SOURCE -------------------------`,P+=a,P=f(P,h,R),P+=u(F[h],L),P+=M,P=f(P,h,B),g===`glsl`&&D!==O&&(P=A(P,h)),g===`glsl`&&i(P,h,T),P.trim()}function z(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var B=class extends p{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...L({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}},V=`#version 300 es
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;function H(e){let{input:t,inputChannels:n,output:r}=e||{};if(!t)return V;if(!n)throw Error(`inputChannels`);return`\
#version 300 es
in ${U(n)} ${t};
out vec4 ${r};
void main() {
  ${r} = ${W(t,n)};
}`}function U(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`invalid channels: ${e}`)}}function W(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}var G=null,K=new ArrayBuffer(4),q=new Float32Array(K),J=new Uint32Array(K);function Y(e){G||=Z(),e=b(e,-65504,65504),q[0]=e;let t=J[0],n=t>>23&511;return G.baseTable[n]+((t&8388607)>>G.shiftTable[n])}function X(e){G||=Z();let t=e>>10;return J[0]=G.mantissaTable[G.offsetTable[t]+(e&1023)]+G.exponentTable[t],q[0]}function Z(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let n=0;n<256;++n){let r=n-127;r<-27?(e[n]=0,e[n|256]=32768,t[n]=24,t[n|256]=24):r<-14?(e[n]=1024>>-r-14,e[n|256]=1024>>-r-14|32768,t[n]=-r-1,t[n|256]=-r-1):r<=15?(e[n]=r+15<<10,e[n|256]=r+15<<10|32768,t[n]=13,t[n|256]=13):r<128?(e[n]=31744,e[n|256]=64512,t[n]=24,t[n|256]=24):(e[n]=31744,e[n|256]=64512,t[n]=13,t[n|256]=13)}let n=new Uint32Array(2048),r=new Uint32Array(64),i=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;!(t&8388608);)t<<=1,r-=8388608;t&=-8388609,r+=947912704,n[e]=t|r}for(let e=1024;e<2048;++e)n[e]=939524096+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=1199570944,r[32]=2147483648;for(let e=33;e<63;++e)r[e]=2147483648+(e-32<<23);r[63]=3347054592;for(let e=1;e<64;++e)e!==32&&(i[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:n,exponentTable:r,offsetTable:i}}var te=({inputs:e,output:t,target:n})=>ne(e,t,n);async function ne(e,t,n){let r=await e.source.ensureCPUValue(),i=c(e.inputFormat),a=c(e.outputFormat),o=new t.ValueType(t.length*t.size),s=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,l=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let n=0;n<t.length;n++)for(let c=0;c<t.size;c++){let u=r[s+n*l+c],d=re(u,e.source.type,i.normalized);o[n*t.size+c]=ie(d,t,a.normalized)}return n.write(o),{success:!0,value:o}}function re(e,t,n){if(t===`float16`)return X(e);if(!n)return e;let{minimum:r,maximum:i}=Q(t);return Math.max(e/i,r<0?-1:0)}function ie(e,t,n){if(t.type===`float16`)return Y(e);if(!n&&t.type===`float32`)return e;let{minimum:r,maximum:i}=Q(t.type),a=n?e*i:e;return Math.round(Math.min(i,Math.max(r,a)))}function Q(e){switch(e){case`sint8`:return{minimum:-127,maximum:127};case`sint16`:return{minimum:-32767,maximum:32767};case`sint32`:return{minimum:-2147483648,maximum:2147483647};case`uint8`:return{minimum:0,maximum:255};case`uint16`:return{minimum:0,maximum:65535};case`uint32`:return{minimum:0,maximum:4294967295};default:throw Error(`castData CPU output does not support ${e}`)}}var ae=async({inputs:e,output:t,target:n})=>{let{source:r,inputFormat:i}=e,a=await r.ensureCPUValue(),o=new t.ValueType(t.length*t.size),s=i.endsWith(`x3`)?3:4;for(let e=0;e<t.length;e++){let t=r.offset/r.ValueType.BYTES_PER_ELEMENT+e*(r.stride/r.ValueType.BYTES_PER_ELEMENT),n=e*4;o[n]=$(a,t,i),o[n+1]=$(a,t+1,i),o[n+2]=$(a,t+2,i),o[n+3]=s===4?$(a,t+3,i):255}return n.write(o),{success:!0,value:o}};function $(e,t,n){if(n.startsWith(`uint8`))return e[t];let r=n.startsWith(`float16`)?oe(e,t):e[t];return Math.round(Math.min(Math.max(r,0),1)*255)}function oe(e,t){let n=se();return n&&e.constructor===n?e[t]:X(e[t])}function se(){return globalThis.Float16Array}export{b as a,v as c,B as i,y as l,te as n,_ as o,H as r,S as s,ae as t,x as u};