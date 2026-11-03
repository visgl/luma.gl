import{A as e,C as t,E as n,M as r,N as i,S as a,T as o,_ as s,c,h as l,j as u,k as d,m as f,v as p,w as m,y as h}from"./expression-qJkyoRIK.js";1/Math.PI*180;var g=1/180*Math.PI,_={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{..._}};var v=globalThis.mathgl.config;function y(e,{precision:t=v.precision}={}){return e=T(e),`${parseFloat(e.toPrecision(t))}`}function b(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function x(e,t){return D(e,e=>e*g,t)}function S(e,t,n){return D(e,e=>Math.max(t,Math.min(n,e)))}function C(e,t,n){return b(e)?e.map((e,r)=>C(e,t[r],n)):n*t+(1-n)*e}function w(e,t,n){let r=v.EPSILON;n&&(v.EPSILON=n);try{if(e===t)return!0;if(b(e)&&b(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!w(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`?Math.abs(e-t)<=v.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{v.EPSILON=r}}function T(e){return Math.round(e/v.EPSILON)*v.EPSILON}function E(e){return e.clone?e.clone():Array(e.length)}function D(e,t,n){if(b(e)){let r=e;n||=E(r);for(let i=0;i<n.length&&i<r.length;++i){let r=typeof e==`number`?e:e[i];n[i]=t(r,i,n)}return n}return t(e)}function O(e,t){return{name:k(e,t),language:`glsl`,version:A(e)}}function k(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function A(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function ee(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function j(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=F(e,N),e;case`fragment`:return e=F(e,P),e;default:throw Error(t)}}var M=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],N=[...M,[I(`attribute`),`in $1`],[I(`varying`),`out $1`]],P=[...M,[I(`varying`),`in $1`]];function F(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function I(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var L=`precision highp float;
`;function R(t){let{vs:n,fs:r}=t,i=e(t.modules||[]);return{vs:z(t.platformInfo,{...t,source:n,stage:`vertex`,modules:i}),fs:z(t.platformInfo,{...t,source:r,stage:`fragment`,modules:i}),getUniforms:o(i)}}function z(e,o){let{source:c,stage:f,language:g=`glsl`,modules:_,defines:v={},hookFunctions:y=[],inject:b={},pluginInjections:x={},pluginVertexInputs:S={},pluginInterStageVariables:C={},prologue:w=!0,log:T}=o;i(typeof c==`string`,`shader source must be a string`);let E=g===`glsl`?O(c).version:-1,D=e.shaderLanguageVersion,k=E===100?`#version 100`:`#version 300 es`,A=c.split(`
`).slice(1).join(`
`),M={};_.forEach(e=>{Object.assign(M,e.defines)}),Object.assign(M,v);let N=``;switch(g){case`wgsl`:break;case`glsl`:N=w?`\
${k}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${f.toUpperCase()}`}

${ee(e)}
${f===`fragment`?L:``}

// ----- APPLICATION DEFINES -------------------------

${B(M)}

`:`${k}
`;break}let P=s(y,o.pluginHooks,`glsl`),F={},I={},R={};m(x,F,I,R);for(let e in b){let t=typeof b[e]==`string`?{injection:b[e],order:0}:b[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?I[e]=[...I[e]||[],t]:R[e]=[...R[e]||[],t]:F[e]=[...F[e]||[],t]}else R[e]=[...R[e]||[],t]}if(f===`vertex`){let e=a(A,S);e&&(N+=`${e}\n`)}let z=h(A,f,C);z.declarations&&(N+=`${z.declarations}\n`),z.initialization&&(R[`vs:#main-start`]=R[`vs:#main-start`]||[],R[`vs:#main-start`].push({injection:z.initialization,order:-(2**53-1)}));for(let e of _){T&&u(e,A,T);let t=n(e,f,T);N+=t;let r=e.instance?.normalizedInjections[f]||{};for(let e in r){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let n=t[2]===`decl`?I:R;n[e]=n[e]||[],n[e].push(r[e])}else F[e]=F[e]||[],F[e].push(r[e])}}return p(P,F,f),N+=`// ----- MAIN SHADER SOURCE -------------------------`,N+=t,N=r(N,f,I),N+=l(P[f],F),N+=A,N=r(N,f,R),g===`glsl`&&E!==D&&(N=j(N,f)),g===`glsl`&&d(N,f,T),N.trim()}function B(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var V=class extends f{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._hookFunctions,...e.hookFunctions||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...R({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,hookFunctions:n}),modules:t}}},H=`#version 300 es
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;function U(e){let{input:t,inputChannels:n,output:r}=e||{};if(!t)return H;if(!n)throw Error(`inputChannels`);return`\
#version 300 es
in ${W(n)} ${t};
out vec4 ${r};
void main() {
  ${r} = ${G(t,n)};
}`}function W(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`invalid channels: ${e}`)}}function G(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}var K=null,q=new ArrayBuffer(4),J=new Float32Array(q),Y=new Uint32Array(q);function te(e){K||=Z(),e=S(e,-65504,65504),J[0]=e;let t=Y[0],n=t>>23&511;return K.baseTable[n]+((t&8388607)>>K.shiftTable[n])}function X(e){K||=Z();let t=e>>10;return Y[0]=K.mantissaTable[K.offsetTable[t]+(e&1023)]+K.exponentTable[t],J[0]}function Z(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let n=0;n<256;++n){let r=n-127;r<-27?(e[n]=0,e[n|256]=32768,t[n]=24,t[n|256]=24):r<-14?(e[n]=1024>>-r-14,e[n|256]=1024>>-r-14|32768,t[n]=-r-1,t[n|256]=-r-1):r<=15?(e[n]=r+15<<10,e[n|256]=r+15<<10|32768,t[n]=13,t[n|256]=13):r<128?(e[n]=31744,e[n|256]=64512,t[n]=24,t[n|256]=24):(e[n]=31744,e[n|256]=64512,t[n]=13,t[n|256]=13)}let n=new Uint32Array(2048),r=new Uint32Array(64),i=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;!(t&8388608);)t<<=1,r-=8388608;t&=-8388609,r+=947912704,n[e]=t|r}for(let e=1024;e<2048;++e)n[e]=939524096+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=1199570944,r[32]=2147483648;for(let e=33;e<63;++e)r[e]=2147483648+(e-32<<23);r[63]=3347054592;for(let e=1;e<64;++e)e!==32&&(i[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:n,exponentTable:r,offsetTable:i}}var ne=({inputs:e,output:t,target:n})=>re(e,t,n);async function re(e,t,n){let r=await e.source.ensureCPUValue(),i=c(e.inputFormat),a=c(e.outputFormat),o=new t.ValueType(t.length*t.size),s=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,l=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let n=0;n<t.length;n++)for(let c=0;c<t.size;c++){let u=r[s+n*l+c],d=ie(u,e.source.type,i.normalized);o[n*t.size+c]=ae(d,t,a.normalized)}return n.write(o),{success:!0,value:o}}function ie(e,t,n){if(t===`float16`)return X(e);if(!n)return e;let{minimum:r,maximum:i}=Q(t);return Math.max(e/i,r<0?-1:0)}function ae(e,t,n){if(t.type===`float16`)return te(e);if(!n&&t.type===`float32`)return e;let{minimum:r,maximum:i}=Q(t.type),a=n?e*i:e;return Math.round(Math.min(i,Math.max(r,a)))}function Q(e){switch(e){case`sint8`:return{minimum:-127,maximum:127};case`sint16`:return{minimum:-32767,maximum:32767};case`sint32`:return{minimum:-2147483648,maximum:2147483647};case`uint8`:return{minimum:0,maximum:255};case`uint16`:return{minimum:0,maximum:65535};case`uint32`:return{minimum:0,maximum:4294967295};default:throw Error(`castData CPU output does not support ${e}`)}}var oe=async({inputs:e,output:t,target:n})=>{let{source:r,inputFormat:i}=e,a=await r.ensureCPUValue(),o=new t.ValueType(t.length*t.size),s=i.endsWith(`x3`)?3:4;for(let e=0;e<t.length;e++){let t=r.offset/r.ValueType.BYTES_PER_ELEMENT+e*(r.stride/r.ValueType.BYTES_PER_ELEMENT),n=e*4;o[n]=$(a,t,i),o[n+1]=$(a,t+1,i),o[n+2]=$(a,t+2,i),o[n+3]=s===4?$(a,t+3,i):255}return n.write(o),{success:!0,value:o}};function $(e,t,n){if(n.startsWith(`uint8`))return e[t];let r=n.startsWith(`float16`)?se(e,t):e[t];return Math.round(Math.min(Math.max(r,0),1)*255)}function se(e,t){let n=ce();return n&&e.constructor===n?e[t]:X(e[t])}function ce(){return globalThis.Float16Array}export{S as a,y as c,x as d,V as i,b as l,ne as n,v as o,U as r,w as s,oe as t,C as u};