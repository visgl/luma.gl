import{C as e,E as t,G as n,H as r,S as i,U as a,V as o,a as s,b as c,c as l,d as u,l as d,n as f,p,t as m,u as h,w as g,x as _}from"./matrix4-c4eH1CYy.js";import{B as v,Bt as y,Ei as b,En as x,Ht as S,Oi as C,Ot as w,P as ee,Pr as T,Q as E,R as D,Ut as te,i as O,mn as k,mt as A,ot as j,q as M,u as ne,w as re,yn as N}from"./three.webgpu-DxN3IWBu.js";import{f as P}from"./render-pipeline-C-8x3_RN.js";import{i as ie,n as ae,r as oe}from"./gpu-vector-chunks-DJgNzXw0.js";import{t as se}from"./webgpu-device-D3URCrxK.js";import{t as ce}from"./webgpu-adapter-CT4qsnIJ.js";import{t as le}from"./OrbitControls-B4AtpIye.js";import{a as ue,c as de,d as fe,f as pe,h as me,i as he,m as ge,o as _e,p as ve,r as ye,s as be,t as xe,u as Se}from"./gpu-graph-diagnostics-Cv9VYSHp.js";import{t as Ce}from"./interop-Jq4e0mpO.js";import{t as we}from"./kernel-D6_l4PJ5.js";function Te(e){return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e}function Ee(e,t,n){n*=.5;let r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e}function De(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1],l=n[2],u=n[3];return e[0]=r*u+o*s+i*l-a*c,e[1]=i*u+o*c+a*s-r*l,e[2]=a*u+o*l+r*c-i*s,e[3]=o*u-r*s-i*c-a*l,e}function Oe(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+o*s,e[1]=i*c+a*s,e[2]=a*c-i*s,e[3]=o*c-r*s,e}function ke(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c-a*s,e[1]=i*c+o*s,e[2]=a*c+r*s,e[3]=o*c-i*s,e}function Ae(e,t,n){n*=.5;let r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+i*s,e[1]=i*c-r*s,e[2]=a*c+o*s,e[3]=o*c-a*s,e}function je(e,t){let n=t[0],r=t[1],i=t[2];return e[0]=n,e[1]=r,e[2]=i,e[3]=Math.sqrt(Math.abs(1-n*n-r*r-i*i)),e}function Me(e,t,n,r){let i=t[0],a=t[1],o=t[2],s=t[3],c=n[0],l=n[1],u=n[2],d=n[3],f,p,m,h,g;return f=i*c+a*l+o*u+s*d,f<0&&(f=-f,c=-c,l=-l,u=-u,d=-d),1-f>1e-6?(p=Math.acos(f),g=Math.sin(p),m=Math.sin((1-r)*p)/g,h=Math.sin(r*p)/g):(m=1-r,h=r),e[0]=m*i+h*c,e[1]=m*a+h*l,e[2]=m*o+h*u,e[3]=m*s+h*d,e}function Ne(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a,s=o?1/o:0;return e[0]=-n*s,e[1]=-r*s,e[2]=-i*s,e[3]=a*s,e}function Pe(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=t[3],e}function Fe(e,t){let n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[5]-t[7])*r,e[1]=(t[6]-t[2])*r,e[2]=(t[1]-t[3])*r;else{let n=0;t[4]>t[0]&&(n=1),t[8]>t[n*3+n]&&(n=2);let i=(n+1)%3,a=(n+2)%3;r=Math.sqrt(t[n*3+n]-t[i*3+i]-t[a*3+a]+1),e[n]=.5*r,r=.5/r,e[3]=(t[i*3+a]-t[a*3+i])*r,e[i]=(t[i*3+n]+t[n*3+i])*r,e[a]=(t[a*3+n]+t[n*3+a])*r}return e}var Ie=f,Le=u,Re=s,ze=d,Be=l,Ve=p,He=h,Ue=(function(){let n=c(),r=e(1,0,0),a=e(0,1,0);return function(e,o,s){let c=i(o,s);return c<-.999999?(_(n,r,o),g(n)<1e-6&&_(n,a,o),t(n,n),Ee(e,n,Math.PI),e):c>.999999?(e[0]=0,e[1]=0,e[2]=0,e[3]=1,e):(_(n,o,s),e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=1+c,He(e,e))}})();function We(e,t,n,r){if(t.length!==4||n.length!==4||[...Array.from(t),...Array.from(n),r].some(e=>!Number.isFinite(e)))throw RangeError(`Expected finite quaternions and step`);if(t.length!==4||r<0)throw RangeError(`Expected quaternions and a nonnegative step`);let i=Math.max(...Array.from(t,Math.abs)),a=Math.max(...Array.from(n,Math.abs));if(!i||!a)throw RangeError(`Zero quaternion`);let o=Array.from(t,e=>e/i),s=Array.from(n,e=>e/a),c=Math.hypot(...o),l=Math.hypot(...s);for(let e=0;e<4;e++)o[e]/=c,s[e]/=l;let u=o.reduce((e,t,n)=>e+t*s[n],0),d=2*Math.acos(Math.min(1,Math.abs(u)));if(e.length<4)throw RangeError(`Result buffer is too short`);return Me(e,o,s,d===0?0:Math.min(1,r/d)),e}var Ge=class extends r{constructor(e=0,t=0,n=0,r=1){super(-0,-0,-0,-0),Array.isArray(e)&&arguments.length===1?this.copy(e):this.set(e,t,n,r)}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}set(e,t,n,r){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this.check()}fromObject(e){return this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this.check()}fromMatrix3(e){return Fe(this,e),this.check()}fromEuler(e){switch(this.identity(),e.order){case`xyz`:return this.rotateX(e.x).rotateY(e.y).rotateZ(e.z);case`yxz`:return this.rotateY(e.y).rotateX(e.x).rotateZ(e.z);case`zxy`:return this.rotateZ(e.z).rotateX(e.x).rotateY(e.y);case`zyx`:return this.rotateZ(e.z).rotateY(e.y).rotateX(e.x);case`yzx`:return this.rotateY(e.y).rotateZ(e.z).rotateX(e.x);case`xzy`:return this.rotateX(e.x).rotateZ(e.z).rotateY(e.y);default:throw Error(`Unknown Euler angle order`)}}fromAxisRotation(e,t){return Ee(this,e,t),this.check()}rotateTowards(e,t){return We(this,this,e,t)}identity(){return Te(this),this.check()}setAxisAngle(e,t){return this.fromAxisRotation(e,t)}get ELEMENTS(){return 4}get x(){return this[0]}set x(e){this[0]=o(e)}get y(){return this[1]}set y(e){this[1]=o(e)}get z(){return this[2]}set z(e){this[2]=o(e)}get w(){return this[3]}set w(e){this[3]=o(e)}len(){return Be(this)}lengthSquared(){return Ve(this)}dot(e){return Re(this,e)}rotationTo(e,t){return Ue(this,e,t),this.check()}add(e){return Ie(this,this,e),this.check()}calculateW(){return je(this,this),this.check()}conjugate(){return Pe(this,this),this.check()}invert(){return Ne(this,this),this.check()}lerp(e,t,n){return n===void 0?this.lerp(this,e,t):(ze(this,e,t,n),this.check())}multiplyRight(e){return De(this,this,e),this.check()}multiplyLeft(e){return De(this,e,this),this.check()}normalize(){let e=this.len(),t=e>0?1/e:0;return this[0]*=t,this[1]*=t,this[2]*=t,this[3]*=t,e===0&&(this[3]=1),this.check()}rotateX(e){return Oe(this,this,e),this.check()}rotateY(e){return ke(this,this,e),this.check()}rotateZ(e){return Ae(this,this,e),this.check()}scale(e){return Le(this,this,e),this.check()}slerp(e,t,n){let r,i,a;switch(arguments.length){case 2:r=this,i=e,a=t;break;default:r=e,i=t,a=n}return Me(this,r,i,a),this.check()}lengthSq(){return this.lengthSquared()}setFromAxisAngle(e,t){return this.setAxisAngle(e,t)}premultiply(e){return this.multiplyLeft(e)}multiply(e){return this.multiplyRight(e)}};function Ke(e){return e instanceof me?e.data:[e]}function qe(e,t){let n=t[0]?.length??0;if(t.some(e=>e.length!==n))throw Error(`Aligned vectors must have equal logical lengths`);let r=t.map(Ke),i=t.map(()=>0),a=t.map(()=>0),o=[],s=0;for(;s<n;){for(let e=0;e<r.length;e++)for(;r[e][i[e]]?.length===a[e];)i[e]++,a[e]=0;let t=r.map((e,t)=>e[i[t]]),n=Math.min(...t.map((e,t)=>e.length-a[t])),c=[];for(let r=0;r<t.length;r++){let i=t[r],o=t.findIndex((e,t)=>t<r&&e===i&&a[t]===a[r]);c.push(o>=0?c[o]:a[r]===0&&n===i.length?i:e.createDataView(i.buffer,{format:i.format,length:n,byteOffset:i.byteOffset+a[r]*i.byteStride,byteStride:i.byteStride,rowByteLength:i.rowByteLength}))}o.push(c);for(let e=0;e<a.length;e++)a[e]+=n;s+=n}return o}function Je(e,t){let[n,r,i]=t;for(let[e,t]of[[`x`,n],[`y`,r],[`z`,i]])if(!Number.isSafeInteger(t)||t<0)throw Error(`compute dispatch ${e} workgroup count must be a non-negative safe integer`);return{...e,dispatchWorkgroups:Object.freeze([n,r,i])}}var Ye=4294967295,Xe=4294967296;function Ze(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>Ye)throw Error(`${e} element count must be a non-negative uint32`);return et(e,n),Qe(e,Math.max(1,Math.ceil(t/n)),r)}function Qe(e,t,n){let r=Math.floor(n);if(!Number.isSafeInteger(r)||r<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let i=Math.min(t,r),a=Math.min(Math.ceil(t/i),r),o=Math.ceil(t/i/a);if(o>r)throw Error(`${e} requires ${t} workgroups, exceeding the 3D dispatch limit of ${r} per dimension`);return{x:i,y:a,z:o}}function $e(e,t){et(`GPU dispatch`,t);let n=Math.floor(Ye/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function et(e,t){if(!Number.isSafeInteger(t)||t<2||t>Ye||Xe%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}var tt=Uint32Array.BYTES_PER_ELEMENT,nt=256;function rt(e,t,n){let r=ae(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%tt!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function it(e,t){rt(e,[`uint32`],t)}function at(e,t){let n=ot(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function ot(e){let t=Math.floor(e.byteOffset/nt)*nt,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function F(e){if(e.byteOffset%tt!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%nt/tt}function st(e,t){if(e.buffer!==t.buffer||e.length===0||t.length===0)return!1;let n=e.byteOffset+(e.length-1)*e.byteStride+e.rowByteLength,r=t.byteOffset+(t.length-1)*t.byteStride+t.rowByteLength;return e.byteOffset<r&&t.byteOffset<n}function I(e,t,n,r,i=P.STORAGE){if(!Number.isSafeInteger(r)||r<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((i&P.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(ie(n)||oe(n))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let a=ae(n),o=e.createTransientBuffer({id:t,byteLength:Math.max(r,1)*a.byteLength,usage:i});return e.createDataView(o,{format:n,length:r})}function ct(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var L=256,lt=64;function ut(e,t=!1){return t?`portable`:ct(e,{requiresSubgroupId:!0})}var dt=class{id;input;output;mode;segmentFlags;constructor(e){if(this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,gt(this.input,`${this.id} input`),gt(this.output,`${this.id} output`),this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.output instanceof me&&this.output.length!==this.input.length)throw Error(`${this.id} vector output length must equal input length`);if(this.segmentFlags){if(gt(this.segmentFlags,`${this.id} segmentFlags`),this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);if(this.segmentFlags instanceof me&&this.segmentFlags.length!==this.input.length)throw Error(`${this.id} vector segmentFlags length must equal input length`);let e=new Set(_t(this.output).map(e=>e.buffer));if(_t(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}getCommandNodes(e){let t=[];return t.push(...ft(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function ft(e,t,n){let r=[];vt(t,e.input,e.id),vt(t,e.output,e.id),e.segmentFlags&&vt(t,e.segmentFlags,e.id);let i=pt(t,e.output,e.input.length),a=e.segmentFlags?pt(t,e.segmentFlags,e.input.length):void 0,o=a?qe(t,[e.input,i,a]):qe(t,[e.input,i]);return r.push(...mt(t,{id:e.id,inputChunks:o.map(e=>e[0]),outputChunks:o.map(e=>e[1]),segmentFlagChunks:a?o.map(e=>e[2]):void 0,isVector:o.length>1,mode:e.mode},n)),r}function pt(e,t,n){return t.length===n||t instanceof me?t:e.createDataView(t.buffer,{format:t.format,length:n,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}function mt(e,t,n){let r=[],i=t.inputChunks,a=t.outputChunks,o=t.segmentFlagChunks,s=i.map((e,t)=>({chunkIndex:t,input:e,output:a[t],segmentFlags:o?.[t]})).filter(e=>e.input.length>0);if(s.length===0)return r;if(s.length===1){let i=s[0];return r.push(...ht(e,{id:t.isVector?`${t.id}-chunk-${i.chunkIndex}`:t.id,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,maxComputeWorkgroupsPerDimension:n})),r}let c=I(e,`${t.id}-chunk-totals`,`uint32`,s.length),l=I(e,`${t.id}-chunk-offsets`,`uint32`,s.length),u=o?I(e,`${t.id}-chunk-segment-flags`,`uint32`,s.length):void 0,d=o?s.map(n=>I(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[i,a]of s.entries())r.push(...ht(e,{id:`${t.id}-chunk-${a.chunkIndex}`,input:a.input,output:a.output,mode:t.mode,segmentFlags:a.segmentFlags,outputSegmentPrefixes:d?.[i],finalSum:R(e,c,i),finalSegmentFlag:u?R(e,u,i):void 0,maxComputeWorkgroupsPerDimension:n}));r.push(...ht(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n}));for(let[i,a]of s.entries())r.push(...St(e,{id:`${t.id}-chunk-${a.chunkIndex}-add-carry`,output:a.output,offsets:l,length:a.output.length,offsetIndex:i,segmentPrefixes:d?.[i],dispatchLayout:Ct(a.output.length,n)}));return r}function ht(e,t){let n=[];if(t.input.length===0)return n;let r=[],i=t.input,a=t.output,o=t.segmentFlags,s=t.input.length,c=0;for(;;){let l=Math.ceil(s/L),u,d;l>1&&(u=I(e,`${t.id}-level-${c}-block-sums`,`uint32`,l),o&&(d=I(e,`${t.id}-level-${c}-block-segment-flags`,`uint32`,l)));let f=o?c===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:l>1||c>0?I(e,`${t.id}-level-${c}-segment-prefixes`,`uint32`,s):void 0:void 0;if(n.push(...yt(e,{id:`${t.id}-level-${c}-scan`,input:i,output:a,mode:c===0?t.mode:`exclusive`,segmentFlags:o,segmentSummaryInput:!!o&&(c>0||t.segmentSummaryInput),segmentPrefixes:f,blockSums:u,blockSegmentFlags:d,finalSum:u?void 0:t.finalSum,finalSegmentFlag:u?void 0:t.finalSegmentFlag,length:s,blockCount:l,dispatchLayout:Ct(s,t.maxComputeWorkgroupsPerDimension)})),r.push({output:a,length:s,segmentPrefixes:f}),!u)break;let p=I(e,`${t.id}-level-${c}-block-offsets`,`uint32`,l);r[r.length-1].blockOffsets=p,i=u,a=p,o=d,s=l,c++}for(let i=r.length-2;i>=0;i--){let a=r[i],o=r[i+1];n.push(...St(e,{id:`${t.id}-level-${i}-add-offsets`,output:a.output,offsets:a.blockOffsets,length:a.length,segmentPrefixes:a.segmentPrefixes,offsetSegmentPrefixes:o.segmentPrefixes,dispatchLayout:Ct(a.length,t.maxComputeWorkgroupsPerDimension)}))}return n}function R(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function gt(e,t){let n=e instanceof me?e.data:[e];for(let e of n)it(e,t)}function _t(e){return e instanceof me?e.data:[e]}function vt(e,t,n){if((t instanceof me?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function yt(e,t){let n=[],r=t.blockSums??t.finalSum,i=t.blockSegmentFlags??t.finalSegmentFlag,a=r?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,o=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,s=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,c=i?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,l=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,u=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,d=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,f=t.segmentFlags?`if (lane >= stride) {
      scratch[lane] = select(addend + scratch[lane], scratch[lane], segmentScratch[lane] != 0u);
      segmentScratch[lane] = addendSegment | segmentScratch[lane];
    }`:`if (lane >= stride) {
      scratch[lane] = scratch[lane] + addend;
    }`,p=t.mode===`inclusive`?`scratch[lane]`:`scratch[lane] - inputValue`,m=t.segmentFlags&&t.mode===`exclusive`?`var scannedOutput = 0u;
    if (lane > 0u) {
      scannedOutput = scratch[lane - 1u];
    }
    ${t.segmentSummaryInput?``:`if (inputSegmentFlag != 0u) { scannedOutput = 0u; }`}
    outputValues[OUTPUT_OFFSET + index] = scannedOutput;`:`outputValues[OUTPUT_OFFSET + index] = ${p};`,h=t.segmentPrefixes?t.segmentSummaryInput?`var segmentPrefix = 0u;
    if (lane > 0u) {
      segmentPrefix = segmentScratch[lane - 1u];
    }
    segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix;`:`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentScratch[lane];`:``,g=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const BLOCK_COUNT: u32 = ${t.blockCount}u;
const INPUT_OFFSET: u32 = ${F(t.input)}u;
const OUTPUT_OFFSET: u32 = ${F(t.output)}u;
${r?`const SUM_OFFSET: u32 = ${F(r)}u;`:``}
${t.segmentFlags?`const SEGMENT_FLAGS_OFFSET: u32 = ${F(t.segmentFlags)}u;`:``}
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${F(t.segmentPrefixes)}u;`:``}
${i?`const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${F(i)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${a}
${o}
${s}
${c}
var<workgroup> scratch: array<u32, ${L}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${L}>;`:``}

@compute @workgroup_size(${L}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${wt(t.dispatchLayout)}
  if (workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = localInvocationIndex;
  var inputValue = 0u;
  var inputSegmentFlag = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
    inputSegmentFlag = ${d};
  }
  scratch[lane] = inputValue;
  ${t.segmentFlags?`segmentScratch[lane] = inputSegmentFlag;`:``}
  workgroupBarrier();

  for (var stride = 1u; stride < ${L}u; stride = stride * 2u) {
    var addend = 0u;
    ${t.segmentFlags?`var addendSegment = 0u;`:``}
    if (lane >= stride) {
      addend = scratch[lane - stride];
      ${t.segmentFlags?`addendSegment = segmentScratch[lane - stride];`:``}
    }
    workgroupBarrier();
    ${f}
    workgroupBarrier();
  }

  if (lane == ${L-1}u) {
    ${l}
    ${u}
  }
  if (index < ELEMENT_COUNT) {
    ${m}
    ${h}
  }
}`,_=bt(e,!!t.segmentFlags,t.length),v=_===`subgroups`?xt(t,r,a):g,y={bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...r?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...i?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]};return n.push(ge({id:t.id,kernel:{entryPoint:`main`,workgroupSize:[L,1,1],bindings:y.bindings,source:v},workload:{operation:`GPUScan`,variant:_,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*L,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...r?[{buffer:r,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...i?[{buffer:i,usage:`storage-write`}]:[]],compile:({device:e})=>{let n=new we(e,{id:t.id,source:v,shaderLayout:y});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:at(t.input,a),outputValues:at(t.output,a)};r&&(o.sumValues=at(r,a)),t.segmentFlags&&(o.segmentFlags=at(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=at(t.segmentPrefixes,a)),i&&(o.summarySegmentFlags=at(i,a)),n.dispatch(e,{bindings:o,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>Je(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function bt(e,t,n){let r=ut(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||ut(e.device,!1)===`subgroups`}]}).variant}function xt(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/L)+1;return`
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${e.length}u;
const BLOCK_COUNT: u32 = ${e.blockCount}u;
const INPUT_OFFSET: u32 = ${F(e.input)}u;
const OUTPUT_OFFSET: u32 = ${F(e.output)}u;
${t?`const SUM_OFFSET: u32 = ${F(t)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${n}
var<workgroup> subgroupOffsets: array<u32, ${lt}>;

@compute @workgroup_size(${L}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${L}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${L}u / subgroupSize;
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
  if (lane == ${L-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function St(e,t){let n=[],r=t.offsetIndex===void 0?`index / ${L}u`:`${t.offsetIndex}u`,i=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${F(t.output)}u;
const OFFSETS_OFFSET: u32 = ${F(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${F(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${F(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${L}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${wt(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${r}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${r}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`,a={bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]};return n.push(ge({id:t.id,kernel:{entryPoint:`main`,workgroupSize:[L,1,1],bindings:a.bindings,source:i},workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*L,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new we(e,{id:t.id,source:i,shaderLayout:a});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:at(t.output,r),offsets:at(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=at(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=at(t.offsetSegmentPrefixes,r)),n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>Je(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function Ct(e,t){return Ze(`GPUScan`,e,L,t)}function wt(e){return $e(e,L)}function Tt(e,t){let n=[...Object.entries(t.inputs??{}),...Object.entries(t.outputs)];for(let[,t]of n)if(ot(t).size>e.device.limits.maxStorageBufferBindingSize)throw Error(`Active chunks must fit a storage binding`);let r=t.dispatch.x*t.dispatch.y*t.dispatch.z;return Je(ge({id:t.id,workload:{commandCount:1,maximumWorkgroupCount:r,maximumInvocationCount:r*(t.workgroupSize??256)},resources:[...Object.values(t.inputs??{}).map(e=>({buffer:e,usage:`storage-read`})),...Object.values(t.outputs).map(e=>({buffer:e,usage:`storage-read-write`}))],compile:({device:e})=>{let r=new we(e,{id:t.id,source:t.source,shaderLayout:{bindings:n.map(([e],n)=>({name:e,group:0,location:n,type:n<Object.keys(t.inputs??{}).length?`read-only-storage`:`storage`}))}});return{encode:({computePass:e,getBuffer:i})=>{let a={};for(let[e,t]of n)a[e]=at(t,i);r.dispatch(e,{bindings:a,x:t.dispatch.x,y:t.dispatch.y,z:t.dispatch.z})},destroy:()=>r.destroy()}}}),[t.dispatch.x,t.dispatch.y,t.dispatch.z])}function Et(e,t,n){let r=[],i=qe(e,[t.keys,t.values]),a=qe(e,[t.outputKeys,t.outputValues]),o=i.map(([i,a],o)=>{let s=`${t.id}-span-${o}`,c=I(e,`${s}-keys`,`uint32`,i.length),l=I(e,`${s}-values`,`uint32`,i.length),u=I(e,`${s}-ranks`,`uint32`,i.length);return r.push(...Ft(new Pt({id:s,keys:i,values:a,outputKeys:c,outputValues:l,algorithm:t.resolvedAlgorithm,direction:t.direction,keyBits:t.keyBits}),e,n)),{keys:c,values:l,ranks:u}}),s=t.resolvedAlgorithm===`radix`&&t.keyBits<32?2**t.keyBits-1:4294967295,c=t.direction===`ascending`?`<`:`>`;for(let[i,l]of o.entries()){let u=Ze(`GPUSort merge`,l.keys.length,256,n),d=$e(u,256);r.push(Tt(e,{id:`${t.id}-ranks-${i}`,outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index < ${l.keys.length}u) { ranks[index] = index; }
}`}));for(let[n,a]of o.entries())n!==i&&r.push(Tt(e,{id:`${t.id}-rank-${i}-against-${n}`,inputs:{keys:l.keys,otherKeys:a.keys},outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> otherKeys: array<u32>;
@group(0) @binding(2) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index >= ${l.keys.length}u) { return; }
  let key = keys[index] & ${s}u;
  var first = 0u;
  var last = ${a.keys.length}u;
  loop {
    if (first == last) { break; }
    let middle = first + (last - first) / 2u;
    let otherKey = otherKeys[middle] & ${s}u;
    if (otherKey ${c} key${n<i?` || otherKey == key`:``}) { first = middle + 1u; }
    else { last = middle; }
  }
  ranks[index] += first;
}`}));let f=0;for(let[n,[o,s]]of a.entries())r.push(Tt(e,{id:`${t.id}-publish-${i}-${n}`,inputs:{keys:l.keys,values:l.values,ranks:l.ranks},outputs:{outputKeys:o,outputValues:s},dispatch:u,source:`
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> ranks: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index >= ${l.keys.length}u) { return; }
  let rank = ranks[index];
  if (rank >= ${f}u && rank - ${f}u < ${o.length}u) {
    let localRank = rank - ${f}u;
    outputKeys[${F(o)}u + localRank] = keys[index];
    outputValues[${F(s)}u + localRank] = values[index];
  }
}`})),f+=o.length}return r}var Dt=256,Ot=256,kt=4,At=Ot/32,jt=4294967295,Mt=2147483648,Nt=Dt,Pt=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])for(let n of Ke(t))it(n,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>Mt)throw Error(`${this.id} supports at most ${Mt} rows`);Lt(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=Nt?`bitonic`:`radix`:this.algorithm}getCommandNodes(e){let t=[];return t.push(...Ft(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function Ft(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])for(let r of Ke(n))if(r.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);return[e.keys,e.values,e.outputKeys,e.outputValues].some(e=>e instanceof me)?Et(t,e,n):It(e,t,n)}function It(e,t,n){let r=[];if(e.keys.length===0)return r;if(e.keys.length===1)return r.push(...Rt(t,e)),r;let i=Ze(`GPUSort`,e.keys.length,Ot,n);return e.resolvedAlgorithm===`bitonic`?r.push(...zt(t,e,i,n)):r.push(...Gt(t,e,i,n)),r}function Lt(e){let t=Ke(e.outputKeys),n=Ke(e.outputValues),r=[...Ke(e.keys),...Ke(e.values)];if([...t,...n].some(e=>r.some(t=>t.buffer===e.buffer))||t.some(e=>n.some(t=>e.buffer===t.buffer)))throw Error(`${e.id} outputs must use separate buffers from inputs and each other`);for(let r of[t,n])for(let[t,n]of r.entries())if(r.slice(0,t).some(e=>st(e,n)))throw Error(`${e.id} output chunks must not overlap`)}function Rt(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=[],s=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${F(n)}u;
const VALUES_OFFSET: u32 = ${F(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${F(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${F(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${Ot}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${$e(a,Ot)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;return o.push(...Xt(e,{id:`${t.id}-${i}`,source:s,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})),o}function zt(e,t,n,r){let i=[],a=Jt(t.keys.length);if(a<=Dt)return i.push(...Bt(e,t,a)),i;let o=Ze(`GPUSort bitonic`,a,Dt,r),s=I(e,`${t.id}-bitonic-indices-a`,`uint32`,a),c=I(e,`${t.id}-bitonic-indices-b`,`uint32`,a);i.push(...Ht(e,t,s,a,o));let l=s,u=c;for(let n of Yt(a))i.push(...Ut(e,t,l,u,a,n,o)),[l,u]=[u,l];return i.push(...Wt(e,t,l,n)),i}function Bt(e,t,n){let r=[],i=t.direction===`descending`,a=ct(e.device,{requiresSubgroupId:!0})===`subgroups`,o=`
${a?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${jt}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${n}u;
const KEYS_OFFSET: u32 = ${F(t.keys)}u;
const VALUES_OFFSET: u32 = ${F(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${F(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${F(t.outputValues)}u;
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
  return ${i?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${n}) fn main(
  ${a?`@builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32`:`@builtin(local_invocation_index) localInvocationIndex: u32`}
) {
${a?Vt():z()}
}`;return r.push(...Xt(e,{id:`${t.id}-bitonic-local`,source:o,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})),r}function z(){return`
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
  }`}function Vt(){return`
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
  }`}function Ht(e,t,n,r,i){let a=[],o=`
const INVALID_INDEX: u32 = ${jt}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${F(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${Dt}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${$e(i,Dt)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;return a.push(...Xt(e,{id:`${t.id}-bitonic-initialize`,source:o,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})),a}function Ut(e,t,n,r,i,a,o){let s=[],c=t.direction===`descending`,l=`
const INVALID_INDEX: u32 = ${jt}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${i}u;
const BLOCK_WIDTH: u32 = ${a.blockWidth}u;
const COMPARE_STRIDE: u32 = ${a.compareStride}u;
const KEYS_OFFSET: u32 = ${F(t.keys)}u;
const INDICES_IN_OFFSET: u32 = ${F(n)}u;
const INDICES_OUT_OFFSET: u32 = ${F(r)}u;
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
  return ${c?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${Dt}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${$e(o,Dt)}
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
}`;return s.push(...Xt(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})),s}function Wt(e,t,n,r){let i=[],a=`
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${F(t.keys)}u;
const VALUES_OFFSET: u32 = ${F(t.values)}u;
const INDICES_OFFSET: u32 = ${F(n)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${F(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${F(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${Dt}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${$e(r,Dt)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;return i.push(...Xt(e,{id:`${t.id}-bitonic-gather`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})),i}function Gt(e,t,n,r){let i=[],a=Math.ceil(t.keyBits/kt),o=Math.ceil(t.keys.length/Ot),s=a>1?I(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,c=a>1?I(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,l=t.keys,u=t.values;for(let d=0;d<a;d++){let f=d*kt,p=Math.min(kt,t.keyBits-f),m=2**p,h=I(e,`${t.id}-radix-digit-${f}-histogram`,`uint32`,m*o),g=I(e,`${t.id}-radix-digit-${f}-offsets`,`uint32`,m*o),_=(a-d)%2==1,v=_?t.outputKeys:s,y=_?t.outputValues:c;if(!v||!y)throw Error(`${t.id} radix scratch is missing`);i.push(...Kt(e,t,l,h,f,p,o,n));let b=new dt({id:`${t.id}-radix-digit-${f}-scan`,input:h,output:g});i.push(...ft(b,e,r)),i.push(...qt(e,t,l,u,g,v,y,f,p,o,n)),l=v,u=y}return i}function Kt(e,t,n,r,i,a,o,s){let c=[],l=2**a,u=t.direction===`descending`,d=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${i}u;
const BUCKET_COUNT: u32 = ${l}u;
const DIGIT_MASK: u32 = ${l-1}u;
const WORKGROUP_COUNT: u32 = ${o}u;
const KEYS_OFFSET: u32 = ${F(n)}u;
const HISTOGRAM_OFFSET: u32 = ${F(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${l}>;

@compute @workgroup_size(${Ot}) fn main(
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

  let index = workgroupIndex * ${Ot}u + localInvocationIndex;
  if (index < ELEMENT_COUNT) {
    let key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    let bucket = ${u?`DIGIT_MASK - digit`:`digit`};
    atomicAdd(&digitCounts[bucket], 1u);
  }
  workgroupBarrier();

  if (localInvocationIndex < BUCKET_COUNT) {
    histogram[HISTOGRAM_OFFSET + localInvocationIndex * WORKGROUP_COUNT + workgroupIndex] =
      atomicLoad(&digitCounts[localInvocationIndex]);
  }
}`;return c.push(...Xt(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:d,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})),c}function qt(e,t,n,r,i,a,o,s,c,l,u){let d=[],f=2**c,p=t.direction===`descending`,m=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${f-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${At}u;
const MASK_COUNT: u32 = ${f*At}u;
const KEYS_OFFSET: u32 = ${F(n)}u;
const VALUES_OFFSET: u32 = ${F(r)}u;
const OFFSETS_OFFSET: u32 = ${F(i)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${F(a)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${F(o)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${f*At}>;

@compute @workgroup_size(${Ot}) fn main(
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

  let index = workgroupIndex * ${Ot}u + localInvocationIndex;
  let valid = index < ELEMENT_COUNT;
  var key = 0u;
  var bucket = 0u;
  if (valid) {
    key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    bucket = ${p?`DIGIT_MASK - digit`:`digit`};
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
}`;return d.push(...Xt(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:m,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})),d}function Jt(e){let t=1;for(;t<e;)t*=2;return t}function Yt(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function Xt(e,t){let n=[];return n.push(ge({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new we(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=at(n,r);n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n}var Zt=256,Qt=128,$t=64,en=4294967295,tn=class{id;strategy;resolvedStrategy;minima;maxima;sourceIds;leafCapacity;nodeMinima;nodeMaxima;nodeChildren;leafIds;count;overflow;dimension;nodeCount;internalNodeCount;levelCount;rootNode=0;topology=`complete-binary`;updatePolicy=`refit`;stats;constructor(e){if(this.id=e.id??`gpu-bvh`,this.strategy=e.strategy??`auto`,this.minima=e.minima,this.maxima=e.maxima,this.sourceIds=e.sourceIds,this.leafCapacity=e.leafCapacity,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.count=e.count,this.overflow=e.overflow,this.dimension=this.minima.format===`float32x2`?2:3,this.minima.length>en)throw Error(`${this.id} source row count exceeds uint32 range`);if(!Number.isSafeInteger(this.leafCapacity)||!ln(this.leafCapacity))throw Error(`${this.id} leafCapacity must be a positive power of two`);if(![`auto`,`fused`,`level`].includes(this.strategy))throw Error(`${this.id} strategy must be auto, fused, or level`);let t=this.minima.buffer.graph.device.limits,n=this.leafCapacity<=Qt&&this.leafCapacity<=t.maxComputeInvocationsPerWorkgroup&&this.leafCapacity<=t.maxComputeWorkgroupSizeX&&this.leafCapacity*$t<=t.maxComputeWorkgroupStorageSize;if(this.strategy===`fused`&&!n)throw Error(`${this.id} fused strategy exceeds portable single-workgroup limits`);if(this.resolvedStrategy=this.strategy===`level`||!n?`level`:`fused`,this.nodeCount=this.leafCapacity*2-1,this.internalNodeCount=this.leafCapacity-1,this.levelCount=Math.log2(this.leafCapacity)+1,!Number.isSafeInteger(this.nodeCount)||this.nodeCount>en)throw Error(`${this.id} node count exceeds uint32 range`);if(rt(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),rt(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),rt(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),rt(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),rt(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),it(this.leafIds,`${this.id} leafIds`),it(this.count,`${this.id} count`),it(this.overflow,`${this.id} overflow`),this.sourceIds&&it(this.sourceIds,`${this.id} sourceIds`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.sourceIds&&this.sourceIds.length!==this.minima.length)throw Error(`${this.id} sourceIds.length must equal bounds length`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeCount||this.nodeMaxima.length!==this.nodeCount)throw Error(`${this.id} node bounds must match source format and node count`);if(this.nodeChildren.length!==this.nodeCount)throw Error(`${this.id} nodeChildren.length must equal node count`);if(this.leafIds.length!==this.leafCapacity)throw Error(`${this.id} leafIds.length must equal leafCapacity`);if(this.count.length<1||this.overflow.length<1)throw Error(`${this.id} count and overflow must each contain one uint32 row`);let r=ae(this.minima.format).byteLength;this.stats={dimension:this.dimension,leafCapacity:this.leafCapacity,internalNodeCount:this.internalNodeCount,nodeCount:this.nodeCount,levelCount:this.levelCount,outputByteLength:this.nodeCount*(r*2+Uint32Array.BYTES_PER_ELEMENT*2)+this.leafCapacity*Uint32Array.BYTES_PER_ELEMENT+Uint32Array.BYTES_PER_ELEMENT*2}}getCommandNodes(e){let t=[];if([this.minima,this.maxima,...this.sourceIds?[this.sourceIds]:[],this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.count,this.overflow].some(t=>t.buffer.graph!==e))throw Error(`${this.id} views must belong to the target graph`);if(this.resolvedStrategy===`fused`)t.push(...nn(e,this));else{t.push(...rn(e,this,cn(this.nodeCount,e.device.limits.maxComputeWorkgroupsPerDimension)));for(let n=this.levelCount-2;n>=0;n--)t.push(...on(e,this,n))}return this.sourceIds&&t.push(...an(e,this,this.sourceIds)),t}};function nn(e,t){let n=[],r=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${F(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${F(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${F(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${F(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${F(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${F(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${F(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${F(t.overflow)}u;
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
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${en}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${en}u;
  leafIds[LEAF_IDS_OFFSET + localIndex] = ${en}u;

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
}`,i=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];return n.push(...sn(e,{id:`${t.id}-fused-refit`,source:r,resources:i,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchCount:1})),n}function rn(e,t,n){let r=[],i=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const NODE_COUNT: u32 = ${t.nodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${F(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${F(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${F(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${F(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${F(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${F(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${F(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${F(t.overflow)}u;
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

@compute @workgroup_size(${Zt}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${n.y}u + workgroupId.y) * ${n.x}u + workgroupId.x;
  let nodeIndex = workgroupIndex * ${Zt}u + localId.x;
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
    nodeChildren[CHILDREN_OFFSET + childComponent] = ${en}u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = ${en}u;
    let leafIndex = nodeIndex - INTERNAL_NODE_COUNT;
    leafIds[LEAF_IDS_OFFSET + leafIndex] = ${en}u;
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
}`,a=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];return r.push(...sn(e,{id:`${t.id}-load-leaves`,source:i,resources:a,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchSize:n})),r}function an(e,t,n){let r=[],i=Math.min(n.length,t.leafCapacity),a=cn(i,e.device.limits.maxComputeWorkgroupsPerDimension),o=`
const STORED_COUNT: u32 = ${i}u;
const SOURCE_IDS_OFFSET: u32 = ${F(n)}u;
const LEAF_IDS_OFFSET: u32 = ${F(t.leafIds)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read_write> leafIds: array<u32>;

@compute @workgroup_size(${Zt}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${a.y}u + workgroupId.y) * ${a.x}u + workgroupId.x;
  let leafIndex = workgroupIndex * ${Zt}u + localId.x;
  if (leafIndex >= STORED_COUNT) { return; }
  let sourceIndex = leafIds[LEAF_IDS_OFFSET + leafIndex];
  if (sourceIndex == ${en}u) { return; }
  leafIds[LEAF_IDS_OFFSET + leafIndex] = sourceIds[SOURCE_IDS_OFFSET + sourceIndex];
}`;return r.push(...sn(e,{id:`${t.id}-remap-source-ids`,source:o,resources:[{buffer:n,usage:`storage-read`},{buffer:t.leafIds,usage:`storage-read-write`}],bindings:{sourceIds:n,leafIds:t.leafIds},dispatchSize:a})),r}function on(e,t,n){let r=[],i=2**n-1,a=2**n,o=`
const FIRST_NODE: u32 = ${i}u;
const LEVEL_NODE_COUNT: u32 = ${a}u;
const DIMENSION: u32 = ${t.dimension}u;
const NODE_MINIMA_OFFSET: u32 = ${F(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${F(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${F(t.nodeChildren)}u;
@group(0) @binding(0) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeChildren: array<u32>;

@compute @workgroup_size(${Zt}) fn main(
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
}`;return r.push(...sn(e,{id:`${t.id}-refit-depth-${n}`,source:o,resources:[{buffer:t.nodeMinima,usage:`storage-read-write`},{buffer:t.nodeMaxima,usage:`storage-read-write`},{buffer:t.nodeChildren,usage:`storage-read`}],bindings:{nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren},dispatchCount:Math.ceil(a/Zt)})),r}function sn(e,t){let n=[];return n.push(ge({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new we(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=at(n,r);t.dispatchSize?n.dispatch(e,{bindings:i,x:t.dispatchSize.x,y:t.dispatchSize.y,z:t.dispatchSize.z}):n.dispatch(e,{bindings:i,x:t.dispatchCount})},destroy:()=>n.destroy()}}})),n}function cn(e,t){let n=Math.floor(t),r=Math.max(1,Math.ceil(e/Zt)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`GPUBVH requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function ln(e){return e>0&&Number.isInteger(Math.log2(e))}function B(e,t){let{bindings:n={},...r}=t;return{kernel:new we(e,r),bindings:{...n}}}async function un(e,t){let{bindings:n={},...r}=t;return{kernel:await we.createAsync(e,r),bindings:{...n}}}function dn(e,t){if(!Number.isFinite(e)||e<0)throw Error(`Invalid body mass`);if(t.type===`sphere`){if(!(t.radius>0)||!Number.isFinite(t.radius))throw Error(`Invalid sphere radius`);let n=.4*e*t.radius**2;return[n,n,n]}if(t.halfExtents.some(e=>!(e>0)||!Number.isFinite(e)))throw Error(`Invalid box extents`);let[n,r,i]=t.halfExtents;return[e*(r**2+i**2)/3,e*(n**2+i**2)/3,e*(n**2+r**2)/3]}function fn(e){let t=new ArrayBuffer(4),n=new DataView(t),r=e.map(e=>e.map(e=>{n.setFloat32(0,e);let t=n.getUint32(0),r=t>>>23&255;return{mantissa:BigInt(t&8388607|(r?8388608:0))*(t>>>31?-1n:1n),exponent:r?r-150:-149}})),i=128;for(let e of r)for(let t of e)t.mantissa!==0n&&(i=Math.min(i,t.exponent));let a=r.map(e=>e.map(e=>e.mantissa===0n?0n:e.mantissa<<BigInt(e.exponent-i)));return(e,t,n,r)=>{let i=a[e],o=a[t].map((e,t)=>e-i[t]),s=a[n].map((e,t)=>e-i[t]),c=a[r].map((e,t)=>e-i[t]),l=(o[1]*s[2]-o[2]*s[1])*c[0]+(o[2]*s[0]-o[0]*s[2])*c[1]+(o[0]*s[1]-o[1]*s[0])*c[2];return l>0n?1:l<0n?-1:0}}var pn=34028230607370965e22,mn=8;function hn(e,t){let n=e*t;if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<2||t<2||n>1e6)throw Error(`Invalid height-field grid`);let r=new Map,i=e=>{if(e<=mn)return 1;let t=r.get(e);if(t!==void 0)return t;let n=Math.floor(e/2),a=i(n)+i(e-n);return r.set(e,a),a},a=i(e-1)*(t-1);return 8+Math.ceil(n/4)*4+(2*a-1)*12}function gn(e){let{width:t,height:n,heights:r,validity:i,diagonal:a=`00-11`}=e,o=t*n;if(!Number.isSafeInteger(t)||!Number.isSafeInteger(n)||t<2||n<2||o>1e6||r&&r.length!==o||i&&i.length!==o||a!==`00-11`&&a!==`10-01`)throw Error(`Invalid height-field grid`);let s=(e.origin??[0,0]).map(Math.fround),c=(e.columnStep??[1,0]).map(Math.fround),l=(e.rowStep??[0,1]).map(Math.fround),u=c[0]*l[1]-c[1]*l[0],d=[0,1].map(e=>Math.abs(s[e])+Math.abs(c[e])*(t-1)+Math.abs(l[e])*(n-1));if(s.length!==2||c.length!==2||l.length!==2||![...s,...c,...l,...d].every(e=>Number.isFinite(Math.fround(e)))||Math.abs(u)<=1e-7*Math.hypot(...c)*Math.hypot(...l))throw Error(`Invalid height-field transform`);let f=d.map(e=>e*2**-21),p=2+Math.ceil(o/4),m=Array(p*4).fill(pn);m.splice(0,8,...c,...l,...s,t,Number(a===`10-01`)+2*Number(u<0));for(let e=0;r&&e<o;e++){if(i?.[e]===0||!Number.isFinite(r[e]))continue;let t=Math.fround(r[e]);if(!Number.isFinite(t)||t===pn)throw Error(`Height-field sample exceeds float32 range`);m[8+e]=t}let h=(e,n,r,i)=>{let o=m.length;m.push(0,0,0,0,0,0,0,0,0,0,0,0);let u=1/0,d=-1/0;if(i===1&&r<=mn){let i=n*t+e;for(let e=0;e<r;e++){let n=8+i+e,r=m[n],o=m[n+1],s=m[n+t],c=m[n+t+1],l=a===`00-11`?[r,o,c,r,c,s]:[r,o,s,o,c,s];for(let e=0;e<6;e+=3){let t=l[e],n=l[e+1],r=l[e+2];t===pn||n===pn||r===pn||(u=Math.min(u,t,n,r),d=Math.max(d,t,n,r))}}m[o+7]=u<=d?r*2:0,m[o+8]=2*(n*(t-1)+e)}else{let t,a;if(r>mn&&(i===1||r>=i*mn)){let o=Math.floor(r/2);t=h(e,n,o,i),a=h(e+o,n,r-o,i)}else{let o=Math.floor(i/2);t=h(e,n,r,o),a=h(e,n+o,r,i-o)}u=Math.min(m[t+2],m[a+2]),d=Math.max(m[t+6],m[a+6])}if(u<=d)for(let t=0;t<2;t++){let a=s[t]+e*c[t]+n*l[t],u=r*c[t],d=i*l[t];m[o+t]=a+Math.min(0,u)+Math.min(0,d)-f[t],m[o+4+t]=a+Math.max(0,u)+Math.max(0,d)+f[t]}return m[o+2]=u,m[o+6]=d,m[o+3]=(m.length-p*4)/12,o},g=h(0,0,t-1,n-1),_=m[g+2]<=m[g+6];for(let e=g;e<m.length;e+=12)m[e+2]>m[e+6]&&(m[e+2]=1,m[e+6]=-1);let v=_?[0,1,2].map(e=>Math.max(Math.abs(m[g+e]),Math.abs(m[g+4+e]))):[0,0,0];if(!v.every(e=>Number.isFinite(Math.fround(e))))throw Error(`Height-field bounds exceed float32 range`);return{data:m,extent:v,nodeOffset:p,nodeCount:_?(m.length-g)/12:0,triangleCount:_?(t-1)*(n-1)*2:0}}function _n(e){if(e.type===`convex-hull`||e.type===`triangle-mesh`)return e.geometry;if(e.type===`height-field`)return{volume:0,center:[0,0,0],tensor:Array(9).fill(0)};if(e.type===`plane`){if([e.sizeX,e.sizeZ].some(e=>e!==void 0&&(!Number.isFinite(e)||e<=0)))throw Error(`Invalid plane extent`);return{volume:0,center:[0,0,0],tensor:Array(9).fill(0)}}if(e.type===`sphere`||e.type===`box`){let t=dn(1,e),n=e.type===`sphere`?4*Math.PI*e.radius**3/3:8*e.halfExtents[0]*e.halfExtents[1]*e.halfExtents[2];return{volume:n,center:[0,0,0],tensor:[t[0]*n,0,0,0,t[1]*n,0,0,0,t[2]*n]}}let{height:t,radiusBottom:n,radiusTop:r}=e;if(![t,n,r].every(Number.isFinite)||t<=0||Math.min(n,r)<0||Math.max(n,r)<=0)throw Error(`Invalid tapered shape`);let i=[],a=(e,t,n,r)=>i.push({lower:n,upper:r,radiusSquared:[t*t-e*e,2*e,-1]}),o=(e,t,n,r)=>{let a=(r-n)/(t-e),o=n-a*e;i.push({lower:e,upper:t,radiusSquared:[o*o,2*o*a,a*a]})};if(e.type===`cylinder`)o(-t/2,t/2,n,r);else if(Math.abs(r-n)>=t){let e=r>=n,i=e?t/2:-t/2,o=e?r:n;a(i,o,i-o,i+o)}else{let e=(r-n)/t,i=Math.sqrt(1-e*e),s=-t/2-n*e,c=t/2-r*e;a(-t/2,n,-t/2-n,s),o(s,c,n*i,r*i),a(t/2,r,c,t/2+r)}let s=(e,t,n,r=0)=>e.reduce((e,i,a)=>e+i*(n**(a+r+1)-t**(a+r+1))/(a+r+1),0),c=0,l=0,u=0,d=0;for(let{lower:e,upper:t,radiusSquared:n}of i){let r=[,,,,,].fill(0);for(let e=0;e<3;e++)for(let t=0;t<3;t++)r[e+t]+=n[e]*n[t];c+=Math.PI*s(n,e,t),l+=Math.PI*s(n,e,t,1),u+=Math.PI*s(r,e,t)/2,d+=Math.PI*(s(n,e,t,2)+s(r,e,t)/4)}let f=l/c;return d-=c*f*f,{volume:c,center:[0,f,0],tensor:[d,0,0,0,u,0,0,0,d]}}function vn(e,t,n,r,i,a,o,s){let c=[{name:`positions`,count:r,stride:1,offset:0,contacts:!1},{name:`targets`,count:r,stride:2,offset:0,contacts:!1},{name:`manifolds`,count:a*4,stride:0,offset:0,contacts:!0},{name:`trigger-previous`,count:i,stride:1,offset:0,contacts:!1},{name:`contact-events`,count:o,stride:4,offset:3,contacts:!1}],l=[],u=e.createBuffer({data:new Float32Array([...s,0]),usage:P.UNIFORM|P.COPY_DST});try{let r=e.createCommandEncoder(),i=r.beginComputePass();for(let r of c){let a=n.find(e=>e.id===`${t}-${r.name}`);if(!a||!r.count)continue;let o=Math.min(Math.ceil(r.count/64),e.limits.maxComputeWorkgroupsPerDimension),s=B(e,{source:`
@group(0) @binding(0) var<storage,read_write> values:array<vec4f>;
@group(0) @binding(1) var<uniform> shift:vec4f;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u) {
 let index=invocation.x+invocation.y*${o*64}u;
 if(index>=${r.count}u){return;}
 let address=${r.contacts?`(index/4u)*26u+(index%4u)*6u`:`${r.offset}u+index*${r.stride}u`};
 values[address]=vec4f(values[address].xyz-shift.xyz,values[address].w);
}`,shaderLayout:{bindings:[{name:`values`,group:0,location:0,type:`storage`},{name:`shift`,group:0,location:1,type:`uniform`}]},bindings:{values:a,shift:u}});l.push(s),s.kernel.dispatch(i,{bindings:s.bindings,x:o,y:Math.ceil(r.count/(o*64))})}i.end(),e.submit(r.finish())}finally{for(let e of l)e.kernel.destroy();u.destroy()}}function yn(e,t,n,r=!1){if(!t||!n)return`
fn bodyScheduled(body:u32)->bool{return true;}
fn colliderScheduled(collider:u32)->bool{return true;}
fn scheduledBody(index:u32)->u32{return index;}
fn scheduledCollider(index:u32)->u32{return index;}
fn scheduledBodyCount()->u32{return BODY_COUNT;}
fn scheduledColliderCount()->u32{return COLLIDER_COUNT;}
`;let i=e/t;return`
const INSTANCE_COUNT:u32=${i}u;
const INSTANCE_BODIES:u32=${t}u;
const INSTANCE_COLLIDERS:u32=${n}u;
const INSTANCE_QUEUE:u32=${16+i*8}u;
@group(0) @binding(28) var<storage,read_write> ensemble:array<atomic<u32>>;
fn bodyScheduled(body:u32)->bool{return atomicLoad(&ensemble[16u+(body/INSTANCE_BODIES)*8u+1u])!=0u;}
fn colliderScheduled(collider:u32)->bool{return atomicLoad(&ensemble[16u+(collider/INSTANCE_COLLIDERS)*8u+1u])!=0u;}
fn scheduledBodyCount()->u32{return atomicLoad(&ensemble[0])*INSTANCE_BODIES;}
fn scheduledColliderCount()->u32{return atomicLoad(&ensemble[0])*INSTANCE_COLLIDERS;}
fn scheduledBody(index:u32)->u32{return atomicLoad(&ensemble[INSTANCE_QUEUE+index/INSTANCE_BODIES])*INSTANCE_BODIES+index%INSTANCE_BODIES;}
fn scheduledCollider(index:u32)->u32{return atomicLoad(&ensemble[INSTANCE_QUEUE+index/INSTANCE_COLLIDERS])*INSTANCE_COLLIDERS+index%INSTANCE_COLLIDERS;}
@compute @workgroup_size(64) fn ensembleClear(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}
 atomicStore(&ensemble[16u+instance*8u+1u],0u);
 atomicStore(&ensemble[16u+instance*8u+4u],0u);
 if(instance==0u){atomicStore(&ensemble[0],0u);${r?`atomicStore(&meshTasks.count,0u);atomicStore(&meshTasks.overflow,0u);atomicStore(&meshTasks.unresolved,0u);atomicStore(&meshTasks.incomplete,0u);atomicStore(&targets.dispatch,0u);targets.vertical=1u;targets.depth=1u;`:``}}
}
@compute @workgroup_size(64) fn ensembleMark(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}let offset=16u+instance*8u;
 // Controls must remain pending across disabled steps after the shared wake flag is consumed.
 if(atomicLoad(&ensemble[1])!=0u){atomicStore(&ensemble[offset+6u],1u);}
 if(atomicLoad(&ensemble[offset])==0u||atomicLoad(&ensemble[offset+7u])!=0u){return;}
 if(atomicLoad(&ensemble[offset+5u])!=0u||atomicLoad(&ensemble[offset+6u])!=0u||atomicLoad(&ensemble[1])!=0u){
  atomicStore(&ensemble[offset+1u],1u);atomicStore(&ensemble[offset+6u],0u);
 }
}
@compute @workgroup_size(64) fn ensembleCompact(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}
 if(atomicLoad(&ensemble[16u+instance*8u+1u])!=0u){let slot=atomicAdd(&ensemble[0],1u);atomicStore(&ensemble[INSTANCE_QUEUE+slot],instance);}
}
@compute @workgroup_size(1) fn ensembleDispatch(){
 atomicStore(&ensemble[1],0u);
 atomicStore(&ensemble[4],(scheduledBodyCount()+63u)/64u);atomicStore(&ensemble[5],1u);atomicStore(&ensemble[6],1u);
 atomicStore(&ensemble[8],(scheduledColliderCount()+63u)/64u);atomicStore(&ensemble[9],1u);atomicStore(&ensemble[10],1u);
}
`}function bn(e){return e.replace(/@compute @workgroup_size\(64\) fn ensembleClear[\s\S]*?atomicStore\(&ensemble\[10\],1u\);\n}/,``).replace(`var<storage,read_write> ensemble:array<atomic<u32>>`,`var<storage,read> ensemble:array<u32>`).replace(/atomicLoad\(&ensemble\[([^\]]+)\]\)/g,`ensemble[$1]`)}function xn(e,t,n,r,i,a,o,s,c){let l={id:`${t}-ensemble-status`,source:`
@group(0) @binding(0) var<storage,read_write> ensemble:array<u32>;
@group(0) @binding(1) var<storage,read> statistics:array<u32>;
${c?`@group(0) @binding(4) var<storage,read> targets:array<u32>;`:``}
struct Body {inertia:vec4f,inertiaOrientation:vec4f,motion:vec4f}
@group(0) @binding(2) var<storage,read> bodies:array<Body>;
@group(0) @binding(3) var<storage,read> sleepStates:array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=${n}u){return;}
 let offset=16u+instance*8u;let sharedFault=statistics[1]!=0u||statistics[15]!=0u;
 ensemble[offset+4u]=select(0u,1u,sharedFault);
 if(ensemble[offset+1u]==0u){return;}
 ${c?`let localFailure=targets[${c.wordOffset}u+instance];`:`let localFailure=0u;`}
 if(localFailure!=0u&&!sharedFault){ensemble[offset+7u]=localFailure;}
 let failed=sharedFault||localFailure!=0u;
 var awake=failed;
 for(var local=0u;local<${r}u;local++){
  let body=instance*${r}u+local;let motion=bodies[body].motion.x;
  awake=awake||motion==2.0||(motion==1.0&&sleepStates[body].y<0.5);
 }
 ensemble[offset+5u]=select(0u,1u,awake);
 let counter=offset+select(2u,3u,failed);
 if(ensemble[counter]!=0xffffffffu){ensemble[counter]++;}
}`,shaderLayout:{bindings:[{name:`ensemble`,group:0,location:0,type:`storage`},{name:`statistics`,group:0,location:1,type:`read-only-storage`},{name:`bodies`,group:0,location:2,type:`read-only-storage`},{name:`sleepStates`,group:0,location:3,type:`read-only-storage`},...c?[{name:`targets`,group:0,location:4,type:`read-only-storage`}]:[]]},bindings:{ensemble:o.buffer,statistics:s.buffer,bodies:i.buffer,sleepStates:a.buffer,...c?{targets:c.buffer}:{}}},u=e=>({encode:({computePass:t})=>e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(n/64)}),destroy:()=>e.kernel.destroy()});e.addComputePass({id:l.id,workload:{commandCount:1},description:`Record per-instance participation and shared rollback status.`,resources:[{buffer:o.resource,usage:`storage-read-write`},{buffer:s.resource,usage:`storage-read`},{buffer:i.resource,usage:`storage-read`},{buffer:a.resource,usage:`storage-read`},...c?[{buffer:c.resource,usage:`storage-read`}]:[]],compile:({device:e})=>u(B(e,l)),compileAsync:async({device:e})=>u(await un(e,l))})}function Sn(e,t,n){let r=t?`vehicle.rows`:`vehicle`;return`
struct Wheel { mount:vec4f, flags:vec4f, state:vec4f }
struct Vehicle { controls:vec4f, geometry:vec4f, tire:vec4f, indices:vec4u, wheels:array<Wheel,4>, poses:array<mat4x4f,4> }
@group(0) @binding(12) var<storage,read_write> vehicle:${t?`VehicleStorage`:`array<Vehicle>`};
${t?`struct VehicleStorage { rows:array<Vehicle,${e}>, terrain:array<vec4u,${e}> }`:``}
struct SuspensionContact { normal:vec3f, lever:vec3f, lengthNow:f32, load:f32 }
${n?`const VEHICLES_PER_INSTANCE:u32=${n}u;`:``}
@compute @workgroup_size(${n?64:1}) fn advanceVehicle(@builtin(global_invocation_id) invocation:vec3u) {
  var vehicleIndex=invocation.x;
  ${n?`if(invocation.x>=ensemble[0]*VEHICLES_PER_INSTANCE){return;} vehicleIndex=ensemble[INSTANCE_QUEUE+invocation.x/VEHICLES_PER_INSTANCE]*VEHICLES_PER_INSTANCE+invocation.x%VEHICLES_PER_INSTANCE;`:``}
  let settingsForVehicle=${r}[vehicleIndex];
  let chassis=settingsForVehicle.indices.x;
  let primaryTerrain=settingsForVehicle.indices.y;
  if(!dynamic(chassis)){return;}
  let rotation=orientations[chassis];
  let center=positions[chassis].xyz;
  let down=rotate(rotation,vec3f(0,0,-1));
  let radius=settingsForVehicle.geometry.x;
  let travel=settingsForVehicle.geometry.y;
  let timestep=settings.gravity.w;
  let wheelbase=bitcast<f32>(settingsForVehicle.indices.z);
  let antiRollRate=bitcast<f32>(settingsForVehicle.indices.w);
  var contacts:array<SuspensionContact,4>;
  var maximumSteeringOffset=0.0;
  for(var index=0u;index<4u;index++){
    let wheel=settingsForVehicle.wheels[index];
    maximumSteeringOffset=max(maximumSteeringOffset,abs(wheel.mount.y)*wheel.flags.x);
    let mount=center+rotate(rotation,wheel.mount.xyz-bodyCenter(chassis));
    contacts[index].lengthNow=travel;
    var found=false;
    for(var surfaceIndex=0u;surfaceIndex<${t?`4u`:`1u`};surfaceIndex++){
      var terrain=primaryTerrain;
      ${t?`if(surfaceIndex>0u){terrain=vehicle.terrain[vehicleIndex][surfaceIndex-1u];if(terrain==0xffffffffu){break;}}`:``}
      if(bodies.bodies[colliderBody(terrain)].motion.x!=0.0){continue;}
      let hit=sweepSphere(terrain,colliderLocal(terrain,mount-colliderPosition(terrain)),colliderLocal(terrain,down),travel,radius,false);
      if(hit.hit!=0u && hit.complete!=0u){
        let normal=rotate(colliderRotation(terrain),hit.normal);
        let support=dot(normal,-down);
        if(support>0.15 && (!found || hit.distance<contacts[index].lengthNow)){
          let lever=colliderPosition(terrain)+rotate(colliderRotation(terrain),hit.point)-center;
          let velocity=velocities[chassis].xyz+cross(angularVelocities[chassis].xyz,lever);
          let load=max(0.0,(travel-hit.distance)*settingsForVehicle.geometry.z-settingsForVehicle.geometry.w*dot(velocity,normal)/support);
          contacts[index]=SuspensionContact(normal,lever,hit.distance,load);
          found=true;
        }
      }
    }
  }
  // Transfer load within an axle without adding lift or pulling on an airborne tire.
  for(var left=0u;left<4u;left+=2u){
    let right=left+1u;
    if(contacts[left].load>0.0 && contacts[right].load>0.0){
      let transfer=(contacts[right].lengthNow-contacts[left].lengthNow)*antiRollRate;
      let bounded=clamp(transfer,-contacts[left].load,contacts[right].load);
      contacts[left].load+=bounded;
      contacts[right].load-=bounded;
    }
  }
  // Keep the center of the turn beyond the inside steered wheel on either side.
  let steeringLimit=min(1.5,atan2(0.9*wheelbase,max(maximumSteeringOffset,0.0001)));
  var impulse=vec3f(0);
  var torque=vec3f(0);
  for(var index=0u;index<4u;index++){
    let wheel=settingsForVehicle.wheels[index];
    let contact=contacts[index];
    var speed=wheel.state.x+settingsForVehicle.controls.x*settingsForVehicle.tire.y*wheel.flags.y*timestep/settingsForVehicle.tire.w;
    speed-=sign(speed)*min(abs(speed),settingsForVehicle.controls.z*settingsForVehicle.tire.z*timestep/settingsForVehicle.tire.w);
    var steering=settingsForVehicle.controls.y*wheel.flags.x;
    if(wheelbase>0.0){
      let reference=clamp(steering,-steeringLimit,steeringLimit);
      steering=atan2(sin(reference)*wheelbase,cos(reference)*wheelbase-wheel.mount.y*sin(reference));
    }
    let load=contact.load;
    if(load>0.0){
      let velocity=velocities[chassis].xyz+cross(angularVelocities[chassis].xyz,contact.lever);
      let heading=rotate(rotation,vec3f(cos(steering),sin(steering),0));
      let side=normalize(cross(contact.normal,heading));
      let forward=cross(side,contact.normal);
      let slip=vec2f(speed*radius-dot(velocity,forward),-dot(velocity,side));
      // Zero in the packed gain fields denotes the original vehicle defaults.
      let gains=select(vec2f(1.1,1.5),vec2f(wheel.mount.w,wheel.flags.z)-1.0,vec2f(wheel.mount.w,wheel.flags.z)>vec2f(0));
      let demand=slip*load*gains;
      var friction=demand*min(1.0,settingsForVehicle.tire.x*load/max(length(demand),0.0001));
      // Bound tire feedback so a light wheel cannot overshoot rolling speed in one step.
      let longitudinalLimit=abs(slip.x)*settingsForVehicle.tire.w/(radius*radius*timestep);
      friction.x=clamp(friction.x,-longitudinalLimit,longitudinalLimit);
      let change=(contact.normal*load+forward*friction.x+side*friction.y)*timestep;
      impulse+=change;
      torque+=cross(contact.lever,change);
      speed-=friction.x*radius*timestep/settingsForVehicle.tire.w;
    }
    let lengthNow=contact.lengthNow;
    let angle=wheel.state.y+speed*timestep;
    ${r}[vehicleIndex].wheels[index].flags.w=steering;
    ${r}[vehicleIndex].wheels[index].state=vec4f(speed,angle,lengthNow,load);
    let heading=vec3f(cos(steering),sin(steering),0);
    let axle=vec3f(-sin(steering),cos(steering),0);
    let vertical=vec3f(0,0,1);
    let hub=wheel.mount.xyz-vertical*lengthNow;
    ${r}[vehicleIndex].poses[index]=mat4x4f(vec4f(heading*cos(angle)-vertical*sin(angle),0),
      vec4f(axle,0),vec4f(heading*sin(angle)+vertical*cos(angle),0),vec4f(hub,1));
  }
  velocities[chassis]=vec4f(velocities[chassis].xyz+impulse*velocities[chassis].w,velocities[chassis].w);
  angularVelocities[chassis]=vec4f(angularVelocities[chassis].xyz+inverseInertia(chassis,torque),0);
  sleepStates[chassis]=vec4f(0);
}
`}function Cn(e,t,n,r,i,a,o,s,c,l){let u=e=>n.find(n=>n.id===`${t}-${e}`),d=[],f=0;for(let e=0;e<=a;e++)e<a&&!c.has(e)||(f<e&&d.push({name:`bodies`,offset:r*48+f*96,size:(e-f)*96,stride:a*96}),f=e+1);let p=[...[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`].map(e=>({name:e,offset:0,size:i*16})),{name:`targets`,offset:0,size:i*32},{name:`bodies`,offset:0,size:i*48},...d,{name:`object-attributes`,offset:0,size:a*4},{name:`pose-metadata`,offset:0,size:i*48},...s?[{name:`vehicle`,offset:0,size:s*512}]:[]].filter(e=>u(e.name)),m=[],h=e.createBuffer({byteLength:32,usage:P.UNIFORM|P.COPY_DST}),g;try{let t=e.createCommandEncoder();for(let n of p){let r=e.createBuffer({byteLength:n.size,usage:P.COPY_SRC|P.COPY_DST});m.push(r),t.copyBufferToBuffer({sourceBuffer:u(n.name),sourceOffset:n.offset,destinationBuffer:r,size:n.size})}e.submit(t.finish());let n=u(`contact-history`),d=s?u(`vehicle`):null;g=B(e,{source:`
@group(0) @binding(0) var<uniform> settings:Settings;
struct Settings {selection:vec4u, shift:vec4f}
@group(0) @binding(6) var<storage,read_write> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read_write> metadata:array<u32>;
@group(0) @binding(2) var<storage,read_write> attributes:array<u32>;
@group(0) @binding(3) var<storage,read_write> manifolds:array<u32>;
@group(0) @binding(4) var<storage,read_write> targets:array<u32>;
${n?`@group(0) @binding(5) var<storage,read_write> history:array<u32>;`:``}
${d?`@group(0) @binding(7) var<storage,read_write> vehicle:array<u32>;`:``}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x+invocation.y*4194240u;let selection=settings.selection;
 if(index==0u){targets[${r*8+8+o*2}u+selection.x/${i}u]=0u;}
 if(index<${i}u){
  let body=selection.x+index;positions[body]=vec4f(positions[body].xyz-settings.shift.xyz,positions[body].w);
  for(var axis=0u;axis<3u;axis++){let address=body*8u+axis;targets[address]=bitcast<u32>(bitcast<f32>(targets[address])-settings.shift[axis]);}
 }
 if(index<${a}u){
  let collider=selection.y+index;let address=${r*12}u+collider*24u+7u;
  ${c.size?`if(!(bitcast<f32>(metadata[address+14u])<0.0&&metadata[address+15u]!=0u)){`:``}
  metadata[address]=bitcast<u32>(bitcast<f32>(metadata[address])+f32(selection.x));
  ${c.size?`}`:``}
  attributes[collider]=(attributes[collider]&0xffff0000u)|((attributes[collider]&0xffffu)+selection.x);
 }
 ${d?`if(index<${s}u){
  let address=(selection.x/${i}u*${s}u+index)*${512/4}u;
  vehicle[address+12u]+=selection.x;
  vehicle[address+13u]+=selection.y;
 }`:``}
 if(index>=${l??o}u){return;}
 ${l?`let pair=(selection.x/${i}u)*${l}u+index;`:`let pair=index;
 let key=targets[${r*8+8}u+pair*2u];
 if(key==0u||key==0xffffffffu){return;}
 let collider=manifolds[pair*104u+97u];
 if(collider<selection.y||collider>=selection.y+${a}u){return;}`}
 let address=pair*104u;
 for(var word=0u;word<104u;word++){manifolds[address+word]=0u;}
 targets[${r*8+8}u+pair*2u]=${l?`0u`:`0xffffffffu`};
 targets[${r*8+9}u+pair*2u]=0u;
 ${n?`for(var word=0u;word<4u;word++){history[pair*4u+word]=0u;}`:``}
}`,shaderLayout:{bindings:[{name:`settings`,group:0,location:0,type:`uniform`},{name:`positions`,group:0,location:6,type:`storage`},...d?[{name:`vehicle`,group:0,location:7,type:`storage`}]:[],...[`metadata`,`attributes`,`manifolds`,`targets`,...n?[`history`]:[]].map((e,t)=>({name:e,group:0,location:t+1,type:`storage`}))]},bindings:{settings:h,positions:u(`positions`),metadata:u(`bodies`),attributes:u(`object-attributes`),manifolds:u(`manifolds`),targets:u(`targets`),...n?{history:n}:{},...d?{vehicle:d}:{}}})}catch(e){for(let e of m)e.destroy();throw h.destroy(),g?.kernel.destroy(),e}return{byteLength:m.reduce((e,t)=>e+t.byteLength,h.byteLength),reset(t,n){let r=new ArrayBuffer(32);new Uint32Array(r).set([t*i,t*a]),new Float32Array(r).set(n,4),h.write(new Uint8Array(r));let c=e.createCommandEncoder();for(let[e,n]of p.entries())c.copyBufferToBuffer({sourceBuffer:m[e],destinationBuffer:u(n.name),destinationOffset:n.offset+t*(n.stride??n.size),size:n.size});let d=c.beginComputePass(),f=Math.ceil(Math.max(l??o,a,i,s)/64);g.kernel.dispatch(d,{bindings:g.bindings,x:Math.min(65535,f),y:Math.ceil(f/65535)}),d.end(),e.submit(c.finish())},destroy(){g.kernel.destroy(),h.destroy();for(let e of m)e.destroy()}}}function wn(e,t){return`${e}x${t}`}function Tn(e){let t=new Set,n=0;for(let{width:r,height:i,pages:a}of e){let e=wn(r,i);if(!Number.isSafeInteger(a)||a<1||t.has(e))throw Error(`Invalid terrain atlas pools`);t.add(e),n+=hn(r,i)*a*4}if(!n||n>2**28)throw Error(`Terrain atlas exceeds address capacity`);return n}function En(e,t){if(e===t)return!0;let n=new Uint32Array(e.buffer,e.byteOffset,e.length),r=new Uint32Array(t.buffer,t.byteOffset,t.length);return n.length===r.length&&n.every((e,t)=>e===r[t])}function Dn(e){let t=new Uint32Array(e.buffer,e.byteOffset,e.length),n=2166136261;for(let e of t)n=Math.imul(n^e,16777619);return n>>>0}var On=class{pools=new Map;slotPools=new Map;leases=new Map;livePages=new Map;wordLength;capacity;privateSlotBytes;constructor(e,t){this.wordLength=Tn(e)/4;let n=new Map;for(let{width:e,height:r}of t){let t=wn(e,r);n.set(t,(n.get(t)??0)+1)}let r=0,i=0;for(let{width:t,height:a,pages:o}of e){let e=hn(t,a),s=wn(t,a);if(o>(n.get(s)??0))throw Error(`Terrain atlas pool exceeds its reserved grid slots`);this.pools.set(s,{words:e,pages:o,firstPage:r,firstWord:i,free:new Set(Array.from({length:o},(e,t)=>r+t)),byHash:new Map}),r+=o,i+=e*o}this.capacity=r;let a=0;for(let{collider:e,width:n,height:r}of t){let t=this.pools.get(wn(n,r));if(!t)throw Error(`Missing terrain atlas pool for a reserved grid`);this.slotPools.set(e,t),a+=t.words*4}this.privateSlotBytes=a}bind(e){let t=new Map,n=new Map,r=new Map,i=new Set,a=new Map,o=(e,n)=>t.set(e,(t.get(e)??0)+n);for(let{collider:t,data:s}of e){let e=this.slotPools.get(t);if(!e||i.has(t)||s&&s.length!==e.words)throw Error(`Invalid terrain atlas edit`);i.add(t);let c=this.leases.get(t);if(c&&o(c,-1),!s)continue;let l=a.get(s)??Dn(s);a.set(s,l);let u=Array.from(e.byHash.get(l)??[]).find(e=>En(e.data,s));if(u){r.set(t,u),o(u,1);continue}let d=n.get(e);d||(d=new Map,n.set(e,d));let f=d.get(l);f||(f=[],d.set(l,f));let p=f.find(e=>En(e.data,s));p||(p={hash:l,data:s,references:0},f.push(p)),p.references++,r.set(t,p)}let s=new Map;for(let[e,n]of t){if(e.references+n!==0)continue;let t=s.get(e.pool);t||(t=[],s.set(e.pool,t)),t.push(e)}let c=[];for(let[e,t]of n){let n=e.free.values(),r=s.get(e)?.values();for(let i of t.values())for(let t of i){let i=n.next().value??r?.next().value?.index;if(i===void 0)throw Error(`Terrain atlas page capacity exhausted`);t.page={index:i,pool:e,hash:t.hash,data:t.data,references:t.references},c.push(t.page)}}for(let[e,n]of t)e.references+=n;for(let e of s.values())for(let t of e){let e=t.pool.byHash.get(t.hash);e.delete(t),e.size||t.pool.byHash.delete(t.hash),t.pool.free.add(t.index),this.livePages.delete(t.index)}for(let e of c)this.install(e);for(let e of i)this.leases.delete(e);let l=new Map;for(let[e,t]of r){let n=`index`in t?t:t.page;this.leases.set(e,n),l.set(e,this.getPageWord(n.pool,n.index))}return{wordsByCollider:l,uploads:c.map(e=>({word:this.getPageWord(e.pool,e.index),data:e.data}))}}getLeases(){return Array.from(this.leases,([e,t])=>[e,t.index])}snapshot(){return{leases:this.getLeases(),payloads:new Map(Array.from(this.livePages,([e,t])=>[e,t.data]))}}restore(e,t,n){let r=new Map,i=new Map;for(let[a,o]of e){let e=this.slotPools.get(a);if(!e||!Number.isInteger(o)||o<e.firstPage||o>=e.firstPage+e.pages||i.has(a))throw Error(`Invalid captured terrain atlas lease`);let s=this.getPageWord(e,o);n?.(a,s);let c=r.get(o);if(!c){let n=t(s,e.words,o);if(n.length!==e.words)throw Error(`Invalid captured terrain atlas page`);c={index:o,pool:e,data:n,hash:Dn(n),references:0},r.set(o,c)}c.references++,i.set(a,c)}for(let e of this.livePages.values())e.pool.free.add(e.index);for(let e of this.pools.values())e.byHash.clear();this.livePages.clear(),this.leases.clear();for(let e of r.values())this.install(e);for(let[e,t]of i)this.leases.set(e,t)}getStats(){return{capacityPages:this.capacity,residentPages:this.livePages.size,residentSlots:this.leases.size,reservedBytes:this.wordLength*4,privateSlotBytes:this.privateSlotBytes}}getPageWord(e,t){return e.firstWord+(t-e.firstPage)*e.words}install(e){let t=e.pool.byHash.get(e.hash);t||(t=new Set,e.pool.byHash.set(e.hash,t)),t.add(e),e.pool.free.delete(e.index),this.livePages.set(e.index,e)}};function kn(e){let t=e.indices.length/3,n=Array.from({length:t},(e,t)=>t),r=e=>{for(;n[e]!==e;)n[e]=n[n[e]],e=n[e];return e},i=t=>e.positions.slice(t*3,t*3+3),a=Array(t).fill(0),o=new Map,s=fn(Array.from({length:e.positions.length/3},(e,t)=>i(t)));for(let n=0;n<t;n++){let t=e.indices.slice(n*3,n*3+3);for(let e=0;e<3;e++){let r=i(t[e]).join(`,`),a=i(t[(e+1)%3]).join(`,`),s=r<a?`${r}/${a}`:`${a}/${r}`,c=o.get(s)??[];c.push({triangle:n,side:e,opposite:t[(e+2)%3]}),o.set(s,c)}}for(let t of o.values()){if(t.length!==2)continue;let[o,c]=t,l=e.indices.slice(o.triangle*3,o.triangle*3+3);if(s(l[0],l[1],l[2],c.opposite)!==0)continue;let u=e.indices.slice(o.triangle*3,o.triangle*3+3),d=i(u[o.side]),f=i(u[(o.side+1)%3]).map((e,t)=>e-d[t]),p=e=>{let t=i(e).map((e,t)=>e-d[t]);return[f[1]*t[2]-f[2]*t[1],f[2]*t[0]-f[0]*t[2],f[0]*t[1]-f[1]*t[0]]},m=p(o.opposite),h=p(c.opposite);if(m.reduce((e,t,n)=>e+t*h[n],0)>=0)continue;a[o.triangle]|=1<<o.side,a[c.triangle]|=1<<c.side;let g=r(o.triangle),_=r(c.triangle);n[Math.max(g,_)]=Math.min(g,_)}return{features:n.map((e,t)=>r(t)+1),internalEdges:a}}function An(e,t=!1,n,r=!1){let i=[],a=new Map,o=new Map,s=new Map,c=new Map,l=new Map;return{shapes:e.map(({shape:e},u)=>{let d=[0,0],f=[0,0,0,0],p;if(e.type===`sphere`)p=[e.radius,0,0,0];else if(e.type===`plane`)p=[(e.sizeX??0)/2,(e.sizeZ??0)/2,e.doubleSided?1:0,6];else if(e.type===`box`)p=[...e.halfExtents,1];else if(e.type===`capsule`||e.type===`cylinder`)p=[e.radiusBottom,e.radiusTop,e.height,e.type===`capsule`?4:5];else if(e.type===`height-field`){let a=!t||n?.has(u),m=a?void 0:o.get(e.field);if(m)f.splice(0,f.length,...m.padding),d.splice(0,d.length,...m.policies),p=[...m.extent,3];else{let n=l.get(e.field)??gn(e.field);if(t&&a&&l.set(e.field,n),r&&a)return f[1]=-e.field.width,p=[...n.extent,3],n.nodeCount&&c.set(u,n),{dimensions:p,policies:d,padding:f};let m=i.length/4;f[0]=m,f[1]=-e.field.width,f[3]=n.triangleCount,d[0]=m+n.nodeOffset,d[1]=n.nodeCount,p=[...n.extent,3];for(let e of n.data)i.push(e);a?s.set(u,m):o.set(e.field,{padding:f,policies:d,extent:n.extent})}}else{let t=e.geometry,n=a.get(t);if(n)f.splice(0,f.length,...n.padding),d.splice(0,d.length,...n.policies);else{f[0]=i.length/4,f[1]=t.positions.length/3;for(let e=0;e<t.positions.length;e+=3)i.push(t.positions[e],t.positions[e+1],t.positions[e+2],0);f[2]=i.length/4,f[3]=t.indices.length/3;let{features:e,internalEdges:n}=kn(t);for(let r=0;r<t.indices.length;r+=3)i.push(t.indices[r],t.indices[r+1],t.indices[r+2],e[r/3]*8+n[r/3]);d[0]=i.length/4,d[1]=t.nodes.length/12;for(let e of t.nodes)i.push(e);a.set(t,{padding:[...f],policies:[...d]})}p=[...t.minimum.map((e,n)=>Math.max(Math.abs(e),Math.abs(t.maximum[n]))),e.type===`convex-hull`?2:3]}return{dimensions:p,policies:d,padding:f}}),geometry:i,filters:e.map(e=>{let t=[...new Set(e.excludedColliders??[])].sort((e,t)=>e-t),n=i.length;for(let e of t)i.push(e);for(;i.length%4;)i.push(0);return[n,t.length]}),heightFields:s,atlasFields:c}}function jn(e,t){let n=new m().fromQuaternion(e).transformAsVector(t);return[n[0],n[1],n[2]]}function V(e=[0,0,0,1]){let t=Math.hypot(...e);if(!e.every(Number.isFinite)||t===0)throw Error(`Invalid body rotation`);return[e[0]/t,e[1]/t,e[2]/t,e[3]/t]}function Mn(e,t,n){let r=t.map(({shape:e})=>_n(e)),i=r.map((e,n)=>t[n].isTrigger?0:e.volume),a=i.reduce((e,t)=>e+t,0),o=Array(9).fill(0);for(let[s,c]of t.entries()){let t=a>0?e*i[s]/a:0,l=i[s]>0?t/i[s]:0,u=new m().fromQuaternion(V(c.orientation)),d=jn(V(c.orientation),r[s].center),f=(c.position??[0,0,0]).map((e,t)=>e+d[t]-n[t]);for(let e=0;e<3;e++)for(let n=0;n<3;n++){for(let t=0;t<3;t++)for(let i=0;i<3;i++)o[e*3+n]+=u[t*4+e]*r[s].tensor[t*3+i]*l*u[i*4+n];o[e*3+n]+=t*((e===n?f.reduce((e,t)=>e+t**2,0):0)-f[e]*f[n])}}let s=[1,0,0,0,1,0,0,0,1];for(let e=0;e<24;e++){let e=0,t=1;for(let[n,r]of[[0,2],[1,2]])Math.abs(o[n*3+r])>Math.abs(o[e*3+t])&&(e=n,t=r);if(Math.abs(o[e*3+t])<=1e-12*Math.max(...o.map(Math.abs)))break;let n=.5*Math.atan2(2*o[e*3+t],o[t*3+t]-o[e*3+e]),r=Math.cos(n),i=Math.sin(n);for(let n=0;n<3;n++){let a=o[n*3+e],c=o[n*3+t];o[n*3+e]=r*a-i*c,o[n*3+t]=i*a+r*c;let l=s[e*3+n],u=s[t*3+n];s[e*3+n]=r*l-i*u,s[t*3+n]=i*l+r*u}for(let n=0;n<3;n++){let a=o[e*3+n],s=o[t*3+n];o[e*3+n]=r*a-i*s,o[t*3+n]=i*a+r*s}}let c=new Ge().fromMatrix3(s).normalize();return{diagonal:[o[0],o[4],o[8]],orientation:[c[0],c[1],c[2],c[3]]}}function Nn(e){return{pairCount:e[0],droppedPairs:e[1],invalidBounds:e[2],candidateTests:e[3],occupiedLevelMask:e[4],oversizedBounds:e[5],incompleteQueries:e[6]}}var Pn=class{id;props;constructor(e){if(this.id=e.id??`rigid-body-broad-phase`,this.props=e,rt(e.minima,[`float32x3`],`broad-phase minima`),rt(e.maxima,[`float32x3`],`broad-phase maxima`),rt(e.pairs,[`uint32x2`],`broad-phase pairs`),rt(e.diagnostics,[`uint32`],`broad-phase diagnostics`),e.objectMetadata&&rt(e.objectMetadata,[`uint32`],`broad-phase object metadata`),e.activeInstances&&(rt(e.activeInstances,[`uint32`],`active instances`),!e.partitionSize||e.activeInstances.length!==16+9*e.minima.length/e.partitionSize))throw Error(`Invalid active instance queue`);let t=e.minima.length;if(e.bucketState&&(rt(e.bucketState,[`uint32`],`persistent buckets`),!e.activeInstances||e.bucketState.buffer.transient||e.bucketState.length!==2**Math.ceil(Math.log2(Math.max(1,t*2)))+t+2))throw Error(`Invalid persistent bucket storage`);let n=e.maximumCandidateTestsPerQuery??4096,r=e.minimumCellSize??1/1024;if(e.partitionSize!==void 0&&(!Number.isSafeInteger(e.partitionSize)||e.partitionSize<1||t%e.partitionSize!==0)||t!==e.maxima.length||e.objectMetadata&&e.objectMetadata.length!==t||t>65535||e.diagnostics.length<8||!Number.isFinite(r)||r<=0||!Number.isSafeInteger(n)||n<1||n>65535)throw Error(`Invalid rigid-body broad-phase layout`);let i=[e.pairs,e.diagnostics,...e.bucketState?[e.bucketState]:[]];for(let t of i)for(let n of[e.minima,e.maxima,...e.objectMetadata?[e.objectMetadata]:[],...e.activeInstances?[e.activeInstances]:[],...i.filter(e=>e!==t)])if(t.buffer===n.buffer){let e=ot(t),r=ot(n);if(st(t,n)||e.offset<r.offset+r.size&&r.offset<e.offset+e.size)throw Error(`Broad-phase storage bindings overlap`)}}getCommandNodes(e){let{minima:t,maxima:n,pairs:r,diagnostics:i}=this.props,a=t.length,o=I(e,`${this.id}-keys`,`uint32`,a),s=I(e,`${this.id}-values`,`uint32`,a),c=I(e,`${this.id}-sorted-keys`,`uint32`,a),l=I(e,`${this.id}-sorted-values`,`uint32`,a),u=I(e,`${this.id}-levels`,`uint32`,a*(this.props.activeInstances?2:1)),d={minima:t,maxima:n,keys:o,values:s,sortedKeys:c,sortedValues:l,levels:u,oversized:this.props.activeInstances?e.createDataView(u.buffer,{format:`uint32`,length:a,byteOffset:a*4}):I(e,`${this.id}-oversized`,`uint32`,a),pairs:r,diagnostics:i,objectMetadata:this.props.objectMetadata??s,...this.props.activeInstances?{activeInstances:this.props.activeInstances,heads:this.props.bucketState??I(e,`${this.id}-heads`,`uint32`,2**Math.ceil(Math.log2(Math.max(1,a*2)))+a+2)}:{}},f=Object.keys(d),p=Fn(this.props,d),m={clear:`Reset broad-phase diagnostics and candidate counts.`,assign:`Assign collider bounds to hierarchical spatial grid cells.`,discover:`Discover potentially overlapping collider pairs from the sorted grid.`},h=(t,n,r,i)=>{n=n.filter(e=>!this.props.activeInstances||![`keys`,`oversized`].includes(e));let a=n.map(e=>({name:e,group:0,location:f.indexOf(e),type:[`keys`,`values`,`levels`,`oversized`,`pairs`,`diagnostics`,`heads`].includes(e)?`storage`:`read-only-storage`})),o=()=>{let r=new we(e.device,{id:`${this.id}-${t}`,source:p,entryPoint:t,shaderLayout:{bindings:a}});return{encode:({computePass:e,getBuffer:a})=>{let o={};for(let e of n)o[e]=at(d[e],a);this.props.activeInstances&&[`assign`,`discover`].includes(t)?r.dispatchIndirect(e,{bindings:o,indirectBuffer:a(this.props.activeInstances.buffer),indirectOffset:ot(this.props.activeInstances).offset+32}):r.dispatch(e,{bindings:o,x:i,y:1,z:1})},destroy:()=>r.destroy()}};return ge({id:`${this.id}-${t}`,description:m[t],workload:{commandCount:1},resources:[...this.props.activeInstances&&[`assign`,`discover`].includes(t)?[{buffer:this.props.activeInstances,usage:`indirect`}]:[],...n.map(e=>({buffer:d[e],usage:r.includes(e)?`storage-read-write`:`storage-read`}))],compile:o})};return[h(`clear`,[`diagnostics`],[`diagnostics`],1),...this.props.activeInstances?[h(`clearBuckets`,[`heads`],[`heads`],1)]:[],h(`assign`,[`minima`,`maxima`,`keys`,`values`,`levels`,`oversized`,`diagnostics`,...this.props.objectMetadata?[`objectMetadata`]:[],...this.props.activeInstances?[`heads`,`activeInstances`]:[]],[`keys`,`values`,`levels`,`oversized`,`diagnostics`,...this.props.activeInstances?[`heads`]:[]],Math.max(1,Math.ceil(a/64))),...this.props.activeInstances?[]:new Pt({id:`${this.id}-sort`,keys:o,values:s,outputKeys:c,outputValues:l}).getCommandNodes(e),h(`discover`,[`minima`,`maxima`,...this.props.activeInstances?[]:[`sortedKeys`,`sortedValues`],`levels`,`oversized`,`pairs`,`diagnostics`,...this.props.activeInstances?[`heads`,`keys`,`values`,`activeInstances`]:[]],[`pairs`,`diagnostics`],Math.max(1,Math.ceil(a/64)))]}};function Fn(e,t){let n=Object.keys(t),r=Object.fromEntries(n.map(e=>[e,F(t[e])])),i=new Set([`keys`,`values`,`levels`,`oversized`,`pairs`,`diagnostics`,`heads`]),a=`
${n.map((e,t)=>`@group(0) @binding(${t}) var<storage, ${i.has(e)?`read_write`:`read`}> ${e}:array<${e===`minima`||e===`maxima`?`f32`:[`diagnostics`,`heads`].includes(e)?`atomic<u32>`:`u32`}>;`).join(`
`)}
const BODY_COUNT:u32=${e.minima.length}u;
const PAIR_CAPACITY:u32=${e.pairs.length}u;
const BASE_CELL:f32=${e.minimumCellSize??1/1024};
const MAXIMUM_CANDIDATES:u32=${e.maximumCandidateTestsPerQuery??4096}u;
fn minimum(index:u32)->vec3f{let offset=${r.minima}u+index*3u;return vec3f(minima[offset],minima[offset+1u],minima[offset+2u]);}
fn maximum(index:u32)->vec3f{let offset=${r.maxima}u+index*3u;return vec3f(maxima[offset],maxima[offset+1u],maxima[offset+2u]);}
fn valid(index:u32)->bool{let lower=minimum(index);let upper=maximum(index);return all(lower<=upper)&&all(abs(lower)<=vec3f(3.4028234663852886e38))&&all(abs(upper)<=vec3f(3.4028234663852886e38));}
fn center(index:u32)->vec3f{return minimum(index)*0.5+maximum(index)*0.5;}
fn cell(index:u32,level:u32)->vec3i{return vec3i(floor(center(index)/(BASE_CELL*exp2(f32(level)))));}
fn domain(index:u32)->u32{return ${e.partitionSize?`index/${e.partitionSize}u`:`0u`};}
fn hash(coordinate:vec3i,level:u32,domainIndex:u32)->u32{
 let words=bitcast<vec3u>(coordinate);var result=(words.x*73856093u)^(words.y*19349663u)^(words.z*83492791u)^(level*2654435761u)^(domainIndex*1597334677u);
 result=(result^(result>>16u))*2246822519u;return result^(result>>13u);
}
@compute @workgroup_size(8) fn clear(@builtin(local_invocation_index) index:u32){atomicStore(&diagnostics[${r.diagnostics}u+index],0u);}
@compute @workgroup_size(64) fn assign(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=BODY_COUNT){return;}
 values[${r.values}u+index]=index;
 if(!valid(index)){keys[${r.keys}u+index]=0xffffffffu;levels[${r.levels}u+index]=33u;atomicAdd(&diagnostics[${r.diagnostics}u+2u],1u);return;}
 let extent=maximum(index)-minimum(index);let size=max(extent.x,max(extent.y,extent.z));
 let required=ceil(log2(max(size*2.0/BASE_CELL,1.0)));
 var level=u32(clamp(required,0.0,32.0));
 // Very remote tiny objects cannot be represented by signed integer cell coordinates.
 if(level<32u&&any(abs(center(index)/(BASE_CELL*exp2(f32(level))))>vec3f(1048576.0))){level=32u;}
 levels[${r.levels}u+index]=level|(${e.objectMetadata?`(objectMetadata[${r.objectMetadata}u+index]&0x1ffffu)`:`(index|(1u<<16u))`}<<6u);
 if(level>=32u){let slot=atomicAdd(&diagnostics[${r.diagnostics}u+5u],1u);oversized[${r.oversized}u+slot]=index;keys[${r.keys}u+index]=0xffffffffu;return;}
 atomicOr(&diagnostics[${r.diagnostics}u+4u],1u<<level);keys[${r.keys}u+index]=hash(cell(index,level),level,domain(index));
}
fn lowerBound(key:u32)->u32{var lower=0u;var upper=BODY_COUNT;loop{if(lower>=upper){break;}let middle=(lower+upper)/2u;if(sortedKeys[${r.sortedKeys}u+middle]<key){lower=middle+1u;}else{upper=middle;}}return lower;}
fn emit(first:u32,second:u32){
 if(domain(first)!=domain(second)){return;}
 let firstMetadata=levels[${r.levels}u+first]>>6u;let secondMetadata=levels[${r.levels}u+second]>>6u;
 if((firstMetadata&0xffffu)==(secondMetadata&0xffffu)||((firstMetadata|secondMetadata)&0x10000u)==0u){return;}
 if(any(maximum(first)<minimum(second))||any(maximum(second)<minimum(first))){return;}
 let slot=atomicAdd(&diagnostics[${r.diagnostics}u],1u);
 if(slot>=PAIR_CAPACITY){atomicAdd(&diagnostics[${r.diagnostics}u+1u],1u);return;}
 pairs[${r.pairs}u+slot*2u]=min(first,second);pairs[${r.pairs}u+slot*2u+1u]=max(first,second);
}
@compute @workgroup_size(64) fn discover(@builtin(global_invocation_id) invocation:vec3u){
 let first=invocation.x;if(first>=BODY_COUNT){return;}let ownLevel=levels[${r.levels}u+first]&63u;if(ownLevel==33u){return;}
 var tested=0u;var occupied=0u;if(ownLevel<32u){occupied=atomicLoad(&diagnostics[${r.diagnostics}u+4u])&(0xffffffffu<<ownLevel);}
 loop{if(occupied==0u){break;}let level=firstTrailingBit(occupied);occupied&=~(1u<<level);let origin=cell(first,level);
  for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
   let coordinate=origin+vec3i(x,y,z);let key=hash(coordinate,level,domain(first));var cursor=lowerBound(key);
   loop{if(cursor>=BODY_COUNT||sortedKeys[${r.sortedKeys}u+cursor]!=key){break;}let second=sortedValues[${r.sortedValues}u+cursor];cursor++;
    if(tested>=MAXIMUM_CANDIDATES){atomicAdd(&diagnostics[${r.diagnostics}u+6u],1u);return;}tested++;atomicAdd(&diagnostics[${r.diagnostics}u+3u],1u);
    if((levels[${r.levels}u+second]&63u)!=level||(level==ownLevel&&second<=first)){continue;}
    if(domain(first)!=domain(second)||any(cell(second,level)!=coordinate)){continue;}
    emit(first,second);
   }
  }}}
 }
 let oversizedCount=atomicLoad(&diagnostics[${r.diagnostics}u+5u]);
 for(var index=0u;index<oversizedCount;index++){let second=oversized[${r.oversized}u+index];if(domain(first)!=domain(second)||second==first||(ownLevel==32u&&second<first)){continue;}
  if(tested>=MAXIMUM_CANDIDATES){atomicAdd(&diagnostics[${r.diagnostics}u+6u],1u);return;}tested++;atomicAdd(&diagnostics[${r.diagnostics}u+3u],1u);emit(first,second);
 }
}
`;if(e.activeInstances){let t=e.minima.length/e.partitionSize,n=r.activeInstances+16+t*8,i=2**Math.ceil(Math.log2(Math.max(1,e.minima.length*2))),o=i-1;a+=`
fn activeCount()->u32{return activeInstances[${r.activeInstances}u]*${e.partitionSize}u;}
fn activeObject(index:u32)->u32{return activeInstances[${n}u+index/${e.partitionSize}u]*${e.partitionSize}u+index%${e.partitionSize}u;}
@compute @workgroup_size(64) fn clearBuckets(@builtin(global_invocation_id) invocation:vec3u){
 // First use initializes the table; subsequent steps clear only buckets touched last step.
 let initialized=${e.bucketState?`atomicLoad(&heads[${r.heads}u+${i+1}u])`:`0u`};
 let count=select(${i}u,atomicLoad(&heads[${r.heads}u+${i}u]),initialized!=0u);
 for(var index=invocation.x;index<count;index+=64u){
  var bucket=index;if(initialized!=0u){bucket=atomicLoad(&heads[${r.heads}u+${i+2}u+index]);}
  atomicStore(&heads[${r.heads}u+bucket],0xffffffffu);
 }
 storageBarrier();
 if(invocation.x==0u){atomicStore(&heads[${r.heads}u+${i}u],0u);atomicStore(&heads[${r.heads}u+${i+1}u],1u);}
}
`,a=a.replace(`var tested=0u;`,`var tested=0u;var bucketVisits=0u;`).replace(`let index=invocation.x;if(index>=BODY_COUNT){return;}`,`let work=invocation.x;if(work>=activeCount()){return;}let index=activeObject(work);`).replace(`let first=invocation.x;if(first>=BODY_COUNT){return;}`,`let work=invocation.x;if(work>=activeCount()){return;}let first=activeObject(work);`).replace(`keys[`+r.keys+`u+index]=hash(cell(index,level),level,domain(index));`,`let key=hash(cell(index,level),level,domain(index));let bucket=key&${o}u;let previous=atomicExchange(&heads[${r.heads}u+bucket],index);values[${r.values}u+index]=previous;
 if(previous==0xffffffffu){let touched=atomicAdd(&heads[${r.heads}u+${i}u],1u);atomicStore(&heads[${r.heads}u+${i+2}u+touched],bucket);}`).replace(`var cursor=lowerBound(key);`,`var cursor=atomicLoad(&heads[${r.heads}u+(key&${o}u)]);`).replace(`if(cursor>=BODY_COUNT||sortedKeys[${r.sortedKeys}u+cursor]!=key){break;}let second=sortedValues[${r.sortedValues}u+cursor];cursor++;`,`if(cursor>=BODY_COUNT){break;}if(bucketVisits>=${Math.min(4294967295,(e.maximumCandidateTestsPerQuery??4096)*32)}u){atomicAdd(&diagnostics[${r.diagnostics}u+6u],1u);return;}bucketVisits++;let second=cursor;cursor=values[${r.values}u+second];if(domain(first)!=domain(second)||(levels[${r.levels}u+second]&63u)!=level||any(cell(second,level)!=coordinate)){continue;}`),a=a.replace(/keys\[[^\]]+\]=0xffffffffu;/g,``).replace(/oversized\[/g,`levels[`)}return a}function In(e){return{steps:e[0],incompleteSteps:e[1],droppedPairs:e[2],droppedManifolds:e[3],incompleteQueries:e[4],invalidBounds:e[5],droppedTriangleQueries:e[6],unresolvedQueries:e[7],incompleteIslandUnions:e[8],incompleteMeshQueries:e[11],incompleteContinuousBodies:e[12],incompleteTriggerQueries:e[13],invalidBodyStates:e[14],maximumCandidatePairs:e[9],maximumCandidateTests:e[10],saturated:e[15]!==0,complete:e[1]===0&&e[15]===0}}function Ln(e,t,n,r){let i=[...r.broadPhase?[{name:`discovery`,...r.broadPhase}]:[],...r.targets?[{name:`cache`,...r.targets}]:[],...r.meshTasks?[{name:`mesh`,...r.meshTasks}]:[],...r.parallelState?[{name:`islands`,...r.parallelState}]:[],...r.continuous?[{name:`continuous`,...r.continuous}]:[],...r.triggers?[{name:`triggers`,...r.triggers}]:[],...r.validity?[{name:`validity`,...r.validity}]:[]],a=[{name:`statistics`,buffer:n,resource:r.statisticsResource??e.importBuffer({id:t,byteLength:n.byteLength,usage:P.STORAGE},n)},...i],o={id:t,source:`
${a.map(({name:e},t)=>`@group(0) @binding(${t}) var<storage,${t===0?`read_write`:`read`}> ${e}:array<u32>;`).join(`
`)}
fn accumulate(index:u32,value:u32){
 let previous=statistics[index];
 if(value>0xffffffffu-previous){statistics[index]=0xffffffffu;statistics[15]=1u;}
 else {statistics[index]=previous+value;}
}
@compute @workgroup_size(1) fn record(){
 var failures:array<u32,7>;
 ${r.broadPhase?`failures[0]=discovery[${r.broadPhase.wordOffset+1}u];failures[2]=discovery[${r.broadPhase.wordOffset+6}u];failures[3]=discovery[${r.broadPhase.wordOffset+2}u];statistics[9]=max(statistics[9],discovery[${r.broadPhase.wordOffset}u]);statistics[10]=max(statistics[10],discovery[${r.broadPhase.wordOffset+3}u]);`:``}
 ${r.targets?`failures[1]=cache[${r.targets.wordOffset}u];`:``}
 ${r.meshTasks?`failures[4]=mesh[1];failures[5]=mesh[2];`:``}
 ${r.parallelState?`failures[6]=islands[0];`:``}
 var incomplete=false;
 for(var index=0u;index<7u;index++){accumulate(index+2u,failures[index]);incomplete=incomplete||failures[index]>0u;}
 ${r.meshTasks?`accumulate(11u,mesh[3]);incomplete=incomplete||mesh[3]>0u;`:``}
 ${r.continuous?`for(var body=0u;body<${r.continuous.count}u;body++){let failure=continuous[body*4u];accumulate(12u,failure);incomplete=incomplete||failure!=0u;}`:``}
 ${r.triggers?`for(var group=0u;group<${r.triggers.count}u;group++){let failure=select(0u,1u,(triggers[group*4u]&4u)!=0u);accumulate(13u,failure);incomplete=incomplete||failure!=0u;}`:``}
 ${r.validity?`for(var body=0u;body<${r.validity.count}u;body++){accumulate(14u,validity[body]);incomplete=incomplete||validity[body]!=0u;}`:``}
 accumulate(0u,1u);if(incomplete){accumulate(1u,1u);}
}`,entryPoint:`record`,shaderLayout:{bindings:a.map(({name:e},t)=>({name:e,location:t,group:0,type:t===0?`storage`:`read-only-storage`}))},bindings:Object.fromEntries(a.map(({name:e,buffer:t})=>[e,t]))},s=e=>({encode:({computePass:t})=>e.kernel.dispatch(t,{bindings:e.bindings,x:1}),destroy:()=>e.kernel.destroy()});e.addComputePass({id:t,workload:{commandCount:1},description:`Summarize contacts, solver limits, and simulation failures for diagnostics.`,resources:a.map(({resource:e},t)=>({buffer:e,usage:t===0?`storage-read-write`:`storage-read`})),compile:({device:e})=>s(B(e,o)),compileAsync:async({device:e})=>s(await un(e,o))})}function Rn(e,t,n,r=0){let i=new ArrayBuffer(e.length*48),a=new Float32Array(i),o=new Uint32Array(i);for(let[i,s]of e.entries()){let{origin:e,direction:c,maximumDistance:l,radius:u,excludeBody:d}=s,f=Math.hypot(...c);if(`colliderIndices`in s||e.length!==3||!e.every(e=>Number.isFinite(Math.fround(e)))||c.length!==3||!Number.isFinite(f)||f===0||!Number.isFinite(Math.fround(l))||l<0||u!==void 0&&(!Number.isFinite(Math.fround(u))||u<0)||d!==void 0&&(!Number.isInteger(d)||d<0||d>=t))throw Error(`Invalid batched collision cast`);let p=i*48/4;a.set([...e,u??0,...c.map(e=>e/f),l],p),o.set([u===void 0?0:2,r,d??4294967295,n],p+8)}return new Uint8Array(i)}function zn(e,t,n){return{body:e[n],collider:e[n+1],point:[t[n+4],t[n+5],t[n+6]],distance:t[n+7],normal:[t[n+8],t[n+9],t[n+10]]}}function Bn(e){let t=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),n=new Float32Array(e.buffer,e.byteOffset,e.byteLength/4);return Array.from({length:e.byteLength/64},(e,r)=>{let i=r*64/4;return{hits:t[i]?[zn(t,n,i+4)]:[],totalHits:t[i+1],truncated:!1,complete:t[i+2]===0}})}var Vn=`
struct Query { origin:vec4f, direction:vec4f, settings:vec4u }
struct QueryHit { identifiers:vec4u, point:vec4f, normal:vec4f }
struct QueryOutput { count:u32, total:u32, reserved:vec2u, hits:array<QueryHit> }
@group(0) @binding(12) var<uniform> query:Query;
@group(0) @binding(13) var<storage,read> querySelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> queryOutput:QueryOutput;
fn queryCollider(collider:u32,request:Query)->QueryHit {
  let shape=bodies.colliders[collider].shape;
  let origin=colliderLocal(collider,request.origin.xyz-colliderPosition(collider));
  let direction=colliderLocal(collider,request.direction.xyz);
  var point=origin;var normal=vec3f(0);var distance=0.0;var hit=false;
  var complete=1u;
  if(request.settings.x==2u||shape.w>1.0){
   if(request.settings.x==1u){let surface=closestSurface(collider,origin);hit=surface.distance<=request.origin.w;point=surface.point;normal=select(vec3f(0),(origin-point)/max(length(origin-point),1e-20),surface.distance>0.0);complete=surface.complete;if(shape.w==6.0&&shape.z==0.0&&origin.y<0.0){hit=false;}}
   else{let sweep=sweepSphere(collider,origin,direction,request.direction.w,request.origin.w,false);hit=sweep.hit!=0u;point=sweep.point;normal=sweep.normal;distance=sweep.distance;complete=sweep.complete;}
  }else if(request.settings.x==1u){
   if(shape.w==0.0){let lengthFromCenter=length(origin);hit=lengthFromCenter<=shape.x+request.origin.w;normal=select(vec3f(1,0,0),origin/max(lengthFromCenter,1e-20),lengthFromCenter>1e-20);point=normal*shape.x;}
   else {point=clamp(origin,-shape.xyz,shape.xyz);let separation=origin-point;let lengthFromSurface=length(separation);hit=lengthFromSurface<=request.origin.w;normal=separation/max(lengthFromSurface,1e-20);}
  }else if(shape.w==0.0){
   let projection=dot(origin,direction);
   // Avoid cancellation between large squared distances for distant rays.
   let perpendicular=origin-direction*projection;let discriminant=shape.x*shape.x-dot(perpendicular,perpendicular);
   if(dot(origin,origin)<=shape.x*shape.x){hit=true;}
   else if(discriminant>=0.0){distance=-projection-sqrt(discriminant);hit=distance>=0.0;point=origin+direction*distance;normal=normalize(point);}
  }else{
   var enter=0.0;var leave=request.direction.w;hit=true;
   for(var coordinate=0u;coordinate<3u;coordinate++){
    if(direction[coordinate]==0.0){if(abs(origin[coordinate])>shape[coordinate]){hit=false;}}
    else{
     let first=(-shape[coordinate]-origin[coordinate])/direction[coordinate];let second=(shape[coordinate]-origin[coordinate])/direction[coordinate];
     let lower=min(first,second);let upper=max(first,second);
     if(lower>enter){enter=lower;normal=vec3f(0);normal[coordinate]=select(1.0,-1.0,direction[coordinate]>0.0);}
     leave=min(leave,upper);
    }
   }
   distance=enter;point=origin+direction*distance;hit=hit&&enter<=leave&&leave>=0.0;
  }
  return QueryHit(vec4u(colliderBody(collider),collider,select(0u,1u,hit&&distance<=request.direction.w),complete),vec4f(colliderPosition(collider)+rotate(colliderRotation(collider),point),distance),vec4f(rotate(colliderRotation(collider),normal),0));
}
@compute @workgroup_size(64) fn queryColliders(@builtin(global_invocation_id) invocation:vec3u){
 let collider=invocation.x;if(collider>=COLLIDER_COUNT){return;}
 queryOutput.hits[collider]=QueryHit();
 if(querySelection[collider]!=0u){queryOutput.hits[collider]=queryCollider(collider,query);}
}
@compute @workgroup_size(1) fn reduceQueries(){
 queryOutput.count=0u;queryOutput.total=0u;queryOutput.reserved=vec2u(0);var nearest=query.direction.w;
 for(var collider=0u;collider<COLLIDER_COUNT;collider++){
  if(querySelection[collider]==0u){continue;}
  let candidate=queryOutput.hits[collider];if(candidate.identifiers.w==0u){queryOutput.reserved.x++;}
  if(candidate.identifiers.z==0u){continue;}queryOutput.total++;
  var slot=queryOutput.count;
  if(query.settings.x!=1u){if(candidate.point.w>nearest){continue;}if(queryOutput.count>0u&&candidate.point.w==nearest){continue;}nearest=candidate.point.w;slot=0u;}
  if(slot>=query.settings.y){continue;}queryOutput.hits[slot]=candidate;queryOutput.count=max(queryOutput.count,slot+1u);
 }
}
`;function Hn(e=0){return`
struct BatchResult {header:vec4u,hit:QueryHit}
@group(0) @binding(30) var<storage,read> batchCommands:array<Query>;
@group(0) @binding(31) var<storage,read_write> batchResults:array<BatchResult>;
var<workgroup> reducedHits:array<QueryHit,64>;
var<workgroup> reducedCounts:array<vec2u,64>;

// Match the scalar reducer: prefer the smaller collider index at equal distance.
fn closer(first:QueryHit,second:QueryHit)->bool{
 return first.identifiers.z!=0u&&(second.identifiers.z==0u||
   first.point.w<second.point.w||
   (first.point.w==second.point.w&&first.identifiers.y<second.identifiers.y));
}
${e?Un(e):``}
fn accumulateCast(
 collider:u32,command:Query,best:ptr<function,QueryHit>,counts:ptr<function,vec2u>
){
 if(colliderBody(collider)==command.settings.z){return;}
 let candidate=queryCollider(collider,command);
 (*counts)+=vec2u(candidate.identifiers.z,select(0u,1u,candidate.identifiers.w==0u));
 if(closer(candidate,*best)){*best=candidate;}
}
@compute @workgroup_size(64) fn castBatch(
 @builtin(workgroup_id) groupIndex:vec3u,
 @builtin(local_invocation_index) lane:u32
){
 let command=batchCommands[groupIndex.x];
 var best=QueryHit();var counts=vec2u(0);
 ${e?`traverseCastBounds(lane,command,&best,&counts);`:``}
 for(var work=lane+command.settings.y;work<command.settings.w;work+=64u){
  accumulateCast(querySelection[work],command,&best,&counts);
 }
 reducedHits[lane]=best;reducedCounts[lane]=counts;workgroupBarrier();
 for(var stride=32u;stride>0u;stride/=2u){
  if(lane<stride){
   let neighbor=lane+stride;
   if(closer(reducedHits[neighbor],reducedHits[lane])){reducedHits[lane]=reducedHits[neighbor];}
   reducedCounts[lane]+=reducedCounts[neighbor];
  }
  workgroupBarrier();
 }
 if(lane==0u){
  let hit=reducedHits[0];let counts=reducedCounts[0];
  batchResults[groupIndex.x]=BatchResult(vec4u(hit.identifiers.z,counts.x,counts.y,0u),hit);
 }
}
`}function Un(e){return`
@group(0) @binding(26) var<storage,read> nodeMinima:array<f32>;
@group(0) @binding(27) var<storage,read> nodeMaxima:array<f32>;
const CAST_LEAVES:u32=${e}u;
const CAST_SUBTREES:u32=min(CAST_LEAVES,8u);

fn traverseCastBounds(
 lane:u32,command:Query,best:ptr<function,QueryHit>,counts:ptr<function,vec2u>
){
 if(lane>=CAST_SUBTREES){return;}
 // One-based heap addresses make sibling and parent navigation arithmetic.
 let root=CAST_SUBTREES+lane;
 var node=root;
 // The world slab and local intersection use different arithmetic orders.
 let directionRoundoff=command.direction.w*vec3f(2e-6);
 let padding=command.origin.w*1.000002+abs(command.origin.xyz)*2e-6+directionRoundoff;
 loop{
  let offset=(node-1u)*3u;
  let lower=vec3f(nodeMinima[offset],nodeMinima[offset+1u],nodeMinima[offset+2u]);
  let upper=vec3f(nodeMaxima[offset],nodeMaxima[offset+1u],nodeMaxima[offset+2u]);
  if(all(lower<=upper)&&intersectsSweepBounds(
   command.origin.xyz,command.direction.xyz,command.direction.w,lower-padding,upper+padding
  )){
   if(node<CAST_LEAVES){node*=2u;continue;}
   let row=node-CAST_LEAVES;
   if(row<command.settings.y){accumulateCast(querySelection[row],command,best,counts);}
  }
  while(node>root&&(node&1u)!=0u){node/=2u;}
  if(node==root){break;}
  node+=1u;
 }
}
`}function Wn(e,t,n,r=!1){let i=e*8+8,a=i+n*2,o=a+t,s=o+t,c=s+n,l=c+n,u=Math.ceil((l+n)/2)*2,d=u+n*2,f=d+n,p=f+t,m=p+t,h=Math.ceil((m+8)/4)*4,g=h+n*104;return{keyOffset:i,headOffset:a,frameOffset:o,linkOffset:s,markOffset:c,journalOffset:l,savedKeyOffset:u,savedLinkOffset:d,savedHeadOffset:f,savedFrameOffset:p,savedHeaderOffset:m,savedManifoldOffset:h,failureOffset:g,byteLength:(g+(r?Math.ceil((t+1)/4)*4:0))*4}}function Gn(e){if(!e.axes.length||e.axes.length>3||new Set(e.axes).size!==e.axes.length||e.axes.some(e=>!Number.isInteger(e)||e<0||e>2)||e.drive&&e.axes.length!==1)throw Error(`Invalid constraint axes`);for(let t of[e.minimum,e.maximum,e.drive?.positionTarget,e.drive?.velocityTarget])if(t!==void 0&&!Number.isFinite(Math.fround(t)))throw Error(`Invalid constraint coordinate`);for(let t of[e.stiffness,e.damping,e.drive?.stiffness,e.drive?.damping,e.drive?.maximumForce])if(t!==void 0&&(!Number.isFinite(Math.fround(t))||t<0))throw Error(`Invalid constraint response`);if((e.minimum??-1/0)>(e.maximum??1/0)||e.drive?.mode!==void 0&&![`force`,`acceleration`].includes(e.drive.mode))throw Error(`Invalid constraint bounds`)}function Kn(){return`
fn generalJointDriven(index:u32)->bool{return targets.joints[index].general.control.y>0.0;}
fn generalConstraintRow(index:u32,row:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,coordinate:f32,warm:bool,locked:bool){
 let joint=JOINTS[index];let constraint=targets.joints[index].general;let angular=constraint.axes.w>0.0;
 let first=joint.identifiers.x;let second=joint.identifiers.y;
 // Changing radial/conical directions invalidate scalar warm starts. Rebuild these small rows each step.
 if(warm){targets.joints[index].impulses[row]=0.0;return;}
 let inverseMass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(inverseMass<=1e-20){return;}
 let speed=jointVelocity(first,second,firstPoint,secondPoint,axis,angular);
 let previous=targets.joints[index].impulses[row];let timeStep=settings.gravity.w;
 var accumulated=0.0;
 if(constraint.control.y>0.0){
  let effectiveScale=select(1.0,1.0/inverseMass,constraint.control.z>0.0);
  let stiffness=constraint.drive.z*effectiveScale;let damping=constraint.drive.w*effectiveScale;
  // Implicit spring/damper evaluated against the velocity before this row's accumulated impulse.
  let force=stiffness*(constraint.drive.x-coordinate-timeStep*speed)+damping*(constraint.drive.y-speed);
  let increment=(timeStep*force-previous)/(1.0+timeStep*(damping+timeStep*stiffness)*inverseMass);
  let cap=constraint.control.w*timeStep;
  accumulated=clamp(previous+increment,-cap,cap);
 }else{
  let minimum=select(constraint.limits.x,0.0,locked);let maximum=select(constraint.limits.y,0.0,locked);
  if(constraint.control.x>0.0){
   let error=coordinate-clamp(coordinate,minimum,maximum);
   if(error!=0.0){
    let stiffness=constraint.limits.z;let damping=constraint.limits.w;
    let force= -stiffness*(error+timeStep*speed)-damping*speed;
    accumulated=previous+(timeStep*force-previous)/(1.0+timeStep*(damping+timeStep*stiffness)*inverseMass);
    accumulated=select(min(0.0,accumulated),max(0.0,accumulated),error<0.0);
   }
  }else{
   var minimumSpeed=(minimum-coordinate)/timeStep;var maximumSpeed=(maximum-coordinate)/timeStep;
   if(coordinate<minimum){minimumSpeed=min(settings.stability.z,settings.stability.y*(minimum-coordinate)/timeStep);}
   if(coordinate>maximum){maximumSpeed=max(-settings.stability.z,settings.stability.y*(maximum-coordinate)/timeStep);}
   accumulated=previous+(clamp(speed,minimumSpeed,maximumSpeed)-speed)/inverseMass;
   if(coordinate<minimum){accumulated=max(0.0,accumulated);}else if(coordinate>maximum){accumulated=min(0.0,accumulated);}
  }
 }
 targets.joints[index].impulses[row]=accumulated;
 jointImpulse(first,second,firstPoint,secondPoint,axis,accumulated-previous,angular);
}
fn solveGeneralJoint(index:u32,firstPoint:vec3f,secondPoint:vec3f,firstRotation:vec4f,secondRotation:vec4f,warm:bool){
 let constraint=targets.joints[index].general;let angular=constraint.axes.w>0.0;
 let count=dot(constraint.axes.xyz,vec3f(1));let offset=secondPoint-firstPoint;
 var relative=multiplyRotation(vec4f(-firstRotation.xyz,firstRotation.w),secondRotation);
 if(relative.w<0.0){relative=-relative;}
 // A hard zero-radius ball/socket or cone needs independent rows. Soft limits retain their radial metric.
 if(count>1.0&&constraint.limits.x<=0.0&&constraint.limits.y==0.0&&constraint.control.y==0.0&&constraint.control.x==0.0){
  for(var component=0u;component<3u;component++){
   if(constraint.axes[component]==0.0){continue;}var basis=vec3f(0);basis[component]=1.0;
   let axis=rotate(firstRotation,basis);
   let coordinate=select(dot(offset,axis),2.0*atan2(relative[component],relative.w),angular);
   let firstConstraintPoint=select(firstPoint+offset-axis*coordinate,firstPoint,angular);
   generalConstraintRow(index,component,firstConstraintPoint,secondPoint,axis,coordinate,warm,true);
  }return;
 }
 var axis=vec3f(0);var coordinate=0.0;
 if(!angular){
  let localOffset=rotate(vec4f(-firstRotation.xyz,firstRotation.w),offset)*constraint.axes.xyz;
  coordinate=length(localOffset);axis=localOffset/max(coordinate,1e-20);
  if(count==1.0){axis=constraint.axes.xyz;coordinate=dot(localOffset,axis);}
  if(length(axis)<0.5){for(var component=0u;component<3u;component++){if(constraint.axes[component]>0.0){axis[component]=1.0;break;}}}
  axis=rotate(firstRotation,axis);
 }else if(count==1.0){
  let basis=constraint.axes.xyz;let projection=dot(relative.xyz,basis);
  coordinate=2.0*atan2(projection,relative.w);
  // The twist-coordinate gradient changes under swing; a fixed axis loses this coupling.
  let denominator=max(relative.w*relative.w+projection*projection,1e-12);
  let gradient=(relative.w*relative.w*basis+relative.w*cross(relative.xyz,basis)+projection*relative.xyz)/denominator;
  axis=rotate(firstRotation,gradient);
 }else if(count==2.0){
  let remaining=vec3f(1)-constraint.axes.xyz;let firstAxis=rotate(firstRotation,remaining);let secondAxis=rotate(secondRotation,remaining);
  let perpendicular=cross(firstAxis,secondAxis);let sine=length(perpendicular);
  coordinate=atan2(sine,clamp(dot(firstAxis,secondAxis),-1.0,1.0));axis=perpendicular/max(sine,1e-20);
  if(sine<1e-6){for(var component=0u;component<3u;component++){if(constraint.axes[component]>0.0){var basis=vec3f(0);basis[component]=1.0;axis=rotate(firstRotation,basis);break;}}}
 }else{
  let sine=length(relative.xyz);coordinate=2.0*atan2(sine,relative.w);axis=rotate(firstRotation,relative.xyz/max(sine,1e-20));
  if(sine<1e-6){axis=rotate(firstRotation,vec3f(1,0,0));}
 }
 let firstConstraintPoint=select(firstPoint+offset-axis*coordinate,firstPoint,angular);
 generalConstraintRow(index,0u,firstConstraintPoint,secondPoint,axis,coordinate,warm,false);
}
`}function qn(e,t,n){if(e.length>64)throw Error(`Unsupported joint configuration`);for(let r of e){if(![`distance`,`fixed`,`hinge`,`slider`,`general`].includes(r.type)||r.first===r.second||[r.first,r.second].some(e=>!Number.isInteger(e)||e<0||e>=t.length))throw Error(`Invalid joint bodies`);let e=[r.first,r.second].map(e=>{let n=t[e];return n.mode??((n.mass??1)===0?`static`:`dynamic`)});if(e.every(e=>e===`static`))throw Error(`Invalid joint bodies`);if(n===`parallel`&&(r.type!==`distance`||!e.includes(`static`)||!e.includes(`dynamic`)))throw Error(`Unsupported parallel joint`);r.type===`general`&&Gn(r);for(let e of[r.firstFrame,r.secondFrame]){if(e?.position&&(e.position.length!==3||!e.position.every(e=>Number.isFinite(Math.fround(e)))))throw Error(`Invalid joint anchor`);e?.orientation&&V(e.orientation)}if(r.type===`distance`&&(!Number.isFinite(Math.fround(r.distance))||r.distance<0))throw Error(`Invalid joint distance`);let i=r.type===`distance`?r.spring:void 0,a=r.type===`hinge`||r.type===`slider`?r.motor:void 0;if([i?.stiffness,i?.damping,a?.stiffness,a?.damping].some(e=>e!==void 0&&(!Number.isFinite(Math.fround(e))||e<0))||a?.position!==void 0&&!Number.isFinite(Math.fround(a.position)))throw Error(`Invalid joint drive`);if(r.type===`hinge`||r.type===`slider`){if(r.type===`hinge`&&a?.position!==void 0&&Math.abs(a.position)>Math.PI)throw Error(`Invalid hinge target`);if(r.limits&&(r.limits.length!==2||!r.limits.every(e=>Number.isFinite(Math.fround(e)))||r.limits[0]>r.limits[1]||r.type===`hinge`&&(r.limits[0]<=-Math.PI||r.limits[1]>=Math.PI)))throw Error(`Invalid joint limits`);if(r.motor&&(!Number.isFinite(Math.fround(r.motor.velocity??0))||!Number.isFinite(Math.fround(r.motor.maximumForce))||r.motor.maximumForce<0))throw Error(`Invalid joint motor`)}}}function Jn(e,t){if(!e.length)return`fn jointActive(body:u32)->bool{return false;} fn jointExcluded(first:u32,second:u32)->bool{return false;}`;let n=e=>`vec${e.length}f(${e.map(e=>`${Math.fround(e)}`).join(`,`)})`,r=(e,t)=>`${n(t?.position??[0,0,0])},${n(V(t?.orientation??[0,0,0,1]))}`,i=e.map(e=>{let t=e.type===`hinge`||e.type===`slider`?e:void 0;return`Joint(vec4u(${e.first},${e.second},${[`distance`,`fixed`,`hinge`,`slider`,`general`].indexOf(e.type)},${e.collideConnected?1:0}),${r(e.first,e.firstFrame)},${r(e.second,e.secondFrame)},${n([e.type===`distance`?e.distance:0,t?.limits?.[0]??0,t?.limits?.[1]??0,t?.limits?1:0])},${n([t?.motor?.velocity??0,t?.motor?.maximumForce??0,t?.motor?1:0,0])},${n([t?.motor?.position??0,t?.motor?.stiffness??30,t?.motor?.damping??5,t?.motor?.position===void 0?0:1])},${n([e.type===`distance`?e.spring?.stiffness??0:0,e.type===`distance`?e.spring?.damping??0:0,e.type===`distance`&&e.spring?1:0,0])})`});return`
struct Joint { identifiers:vec4u, firstAnchor:vec3f, firstFrame:vec4f, secondAnchor:vec3f, secondFrame:vec4f, limits:vec4f, motor:vec4f, drive:vec4f, spring:vec4f }
const JOINTS:array<Joint,${e.length}>=array<Joint,${e.length}>(${i.join(`,`)});
fn liveJoint(index:u32)->Joint {
 var joint=JOINTS[index];let state=targets.joints[index];
 joint.identifiers.w=u32(state.control.y);joint.limits=state.limits;joint.motor=state.motor;joint.drive=state.drive;joint.spring=state.spring;return joint;
}
${Kn()}
fn jointActive(body:u32)->bool {for(var index=0u;index<${e.length}u;index++){let joint=liveJoint(index);if(targets.joints[index].control.x<0.5){continue;}if(joint.identifiers.x==body||joint.identifiers.y==body){let first=joint.identifiers.x;let second=joint.identifiers.y;if(joint.motor.z>0.0 || generalJointDriven(index) || (bodies.bodies[first].motion.x==2.0 && length(velocities[first].xyz)+length(angularVelocities[first].xyz)>1e-6) || (bodies.bodies[second].motion.x==2.0 && length(velocities[second].xyz)+length(angularVelocities[second].xyz)>1e-6)){return true;}}}return false;}
fn connectJoints(){for(var index=0u;index<${e.length}u;index++){if(targets.joints[index].control.x<0.5){continue;}let joint=liveJoint(index);let first=joint.identifiers.x;let second=joint.identifiers.y;if(dynamic(first)&&dynamic(second)){let firstRoot=root(first);let secondRoot=root(second);sleepStates[max(firstRoot,secondRoot)].z=f32(min(firstRoot,secondRoot));}}}
fn jointExcluded(first:u32,second:u32)->bool {for(var index=0u;index<${e.length}u;index++){let identifiers=liveJoint(index).identifiers;if(targets.joints[index].control.x>0.5&&identifiers.w==0u&&((identifiers.x==first&&identifiers.y==second)||(identifiers.y==first&&identifiers.x==second))){return true;}}return false;}
fn jointMass(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,angular:bool)->f32 {
 if(angular){return dot(axis,inverseInertia(first,axis)+inverseInertia(second,axis));}
 let firstLever=firstPoint-positions[first].xyz;let secondLever=secondPoint-positions[second].xyz;
 return velocities[first].w+velocities[second].w+dot(axis,cross(inverseInertia(first,cross(firstLever,axis)),firstLever)+cross(inverseInertia(second,cross(secondLever,axis)),secondLever));
}
fn jointVelocity(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,angular:bool)->f32 {
 if(angular){return dot(angularVelocities[second].xyz-angularVelocities[first].xyz,axis);}
 return dot(pointVelocity(second,secondPoint)-pointVelocity(first,firstPoint),axis);
}
fn jointImpulse(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,impulse:f32,angular:bool){
 if(angular){if(dynamic(first)){angularVelocities[first]=vec4f(angularVelocities[first].xyz-inverseInertia(first,axis*impulse),0);}if(dynamic(second)){angularVelocities[second]=vec4f(angularVelocities[second].xyz+inverseInertia(second,axis*impulse),0);}}
 else{applyImpulse(first,firstPoint,-axis*impulse);applyImpulse(second,secondPoint,axis*impulse);}
}
fn jointRow(index:u32,row:u32,first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,error:f32,angular:bool,spring:vec4f,warm:bool){
 let previous=targets.joints[index].impulses[row];
 if(warm){let retained=previous*settings.stability.x;targets.joints[index].impulses[row]=retained;jointImpulse(first,second,firstPoint,secondPoint,axis,retained,angular);return;}
 let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){return;}
 var softness=0.0;var bias=clamp(settings.stability.y*error/settings.gravity.w,-settings.stability.z,settings.stability.z);
 if(spring.z>0){softness=1.0/max(1e-20,settings.gravity.w*(spring.y+settings.gravity.w*spring.x));bias=error*settings.gravity.w*spring.x*softness;}
 let increment=-(jointVelocity(first,second,firstPoint,secondPoint,axis,angular)+bias+softness*previous)/(mass+softness);
 targets.joints[index].impulses[row]=previous+increment;jointImpulse(first,second,firstPoint,secondPoint,axis,increment,angular);
}
fn solveJoints(warm:bool){
 for(var index=0u;index<${e.length}u;index++){
  if(targets.joints[index].control.x<0.5){continue;}
  let joint=liveJoint(index);let first=joint.identifiers.x;let second=joint.identifiers.y;let kind=joint.identifiers.z;
  if((!dynamic(first)||sleepStates[first].y>0.5)&&(!dynamic(second)||sleepStates[second].y>0.5)){continue;}
  var firstPoint=positions[first].xyz+rotate(orientations[first],joint.firstAnchor-bodyCenter(first));let secondPoint=positions[second].xyz+rotate(orientations[second],joint.secondAnchor-bodyCenter(second));
  let firstRotation=multiplyRotation(orientations[first],joint.firstFrame);let secondRotation=multiplyRotation(orientations[second],joint.secondFrame);
  let offset=secondPoint-firstPoint;
  if(kind==4u){solveGeneralJoint(index,firstPoint,secondPoint,firstRotation,secondRotation,warm);continue;}
  // A slider constrains a point on the moving axis, not the fixed frame origin.
  if(kind==3u){let axis=rotate(firstRotation,vec3f(0,0,1));firstPoint+=axis*dot(offset,axis);}
  if(kind==0u){let distance=length(offset);let axis=select(rotate(firstRotation,vec3f(1,0,0)),offset/max(distance,1e-20),distance>1e-8);jointRow(index,0u,first,second,firstPoint,secondPoint,axis,distance-joint.limits.x,false,joint.spring,warm);continue;}
  for(var component=0u;component<select(3u,2u,kind==3u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(index,component,first,second,firstPoint,secondPoint,axis,dot(offset,axis),false,vec4f(0),warm);}
  var relative=multiplyRotation(secondRotation,vec4f(-firstRotation.xyz,firstRotation.w));if(relative.w<0){relative=-relative;}
  let sine=length(relative.xyz);let rotationError=relative.xyz*(2.0*atan2(sine,relative.w)/max(sine,1e-20));
  for(var component=0u;component<select(3u,2u,kind==2u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(index,3u+component,first,second,firstPoint,secondPoint,axis,dot(rotationError,axis),true,vec4f(0),warm);}
  if(kind==1u){continue;}
  let angular=kind==2u;let axis=rotate(firstRotation,vec3f(0,0,1));
  let localRotation=multiplyRotation(vec4f(-firstRotation.xyz,firstRotation.w),secondRotation);
  var angle=2.0*atan2(localRotation.z,localRotation.w);if(angle>3.14159265){angle-=6.2831853;}if(angle < -3.14159265){angle+=6.2831853;}
  let coordinate=select(dot(offset,axis),angle,angular);let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){continue;}
  if(joint.motor.z>0){
   let previous=targets.joints[index].impulses[6];let limit=joint.motor.y*settings.gravity.w;
   var desired=joint.motor.x;var softness=0.0;
   if(joint.drive.w>0){softness=1.0/max(1e-20,settings.gravity.w*(joint.drive.z+settings.gravity.w*joint.drive.y));desired-= (coordinate-joint.drive.x)*settings.gravity.w*joint.drive.y*softness;}
   let increment=(desired-jointVelocity(first,second,firstPoint,secondPoint,axis,angular)-softness*previous)/(mass+softness);
   let accumulated=clamp(select(previous+increment,previous*settings.stability.x,warm),-limit,limit);
   jointImpulse(first,second,firstPoint,secondPoint,axis,select(accumulated-previous,accumulated,warm),angular);targets.joints[index].impulses[6]=accumulated;
  }
  if(joint.limits.w>0){
   // Limits are unilateral: discard a cached impulse when the active side changes.
   let previous=targets.joints[index].impulses[7];let minimum=(joint.limits.y-coordinate)/settings.gravity.w;let maximum=(joint.limits.z-coordinate)/settings.gravity.w;
   let speed=jointVelocity(first,second,firstPoint,secondPoint,axis,angular);
   var accumulated=previous+(clamp(speed,minimum,maximum)-speed)/mass;
   if(coordinate<joint.limits.y){accumulated=max(0.0,accumulated);}else if(coordinate>joint.limits.z){accumulated=min(0.0,accumulated);}
   if(warm){accumulated=0.0;}
   jointImpulse(first,second,firstPoint,secondPoint,axis,select(accumulated-previous,0.0,warm),angular);targets.joints[index].impulses[7]=accumulated;
  }
 }
}
`}function Yn(e){let t=new Float32Array(176/4),n=e.type===`hinge`||e.type===`slider`?e:void 0;t.set([e.enabled===!1?0:1,e.collideConnected?1:0,0,0],8),t.set([e.type===`distance`?e.distance:0,n?.limits?.[0]??0,n?.limits?.[1]??0,n?.limits?1:0],12),t.set([n?.motor?.velocity??0,n?.motor?.maximumForce??0,n?.motor?1:0,0],16),t.set([n?.motor?.position??0,n?.motor?.stiffness??30,n?.motor?.damping??5,n?.motor?.position===void 0?0:1],20),t.set([e.type===`distance`?e.spring?.stiffness??0:0,e.type===`distance`?e.spring?.damping??0:0,e.type===`distance`&&e.spring?1:0,0],24);let r=e.type===`general`?e:void 0;t.set([...[0,1,2].map(e=>r?.axes.includes(e)?1:0),r?.angular?1:0],28),t.set([r?.minimum??-1e30,r?.maximum??1e30,r?.stiffness??0,r?.damping??0],32);let i=r?.drive;return t.set([r?.stiffness===void 0?0:1,i?1:0,i?.mode===`acceleration`?1:0,i?.maximumForce??1e30],36),t.set([i?.positionTarget??0,i?.velocityTarget??0,i?.stiffness??0,i?.damping??0],40),t}function Xn(e,t,n,r,i,a,o,s=0,c=!1,l=!1,u=!1,d=0,f=0,p=!1,m=0){let h=Math.ceil((e*12+t*26)/4)*4,g=Math.ceil((h+r)/64)*64,_=Math.ceil((g+n*2)/64)*64,v=i?_+8:h+Math.max(4,r),y=Math.ceil((4+e*5+n*2)/4)*16+n*64+Math.ceil((n*2+e)/4)*16,b=[...[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`].map(t=>({name:t,byteLength:e*16,uniform:!1})),{name:`targets`,byteLength:f?Wn(e,f,n,p).byteLength:Math.ceil((e*32+(i?32+n*8:16))/16)*16+d*176,uniform:!1},{name:`manifolds`,byteLength:n*416,uniform:!1},{name:`bodies`,byteLength:v*4,uniform:!1},{name:`settings`,byteLength:64,uniform:!0},{name:`control-settings`,byteLength:64,uniform:!0},{name:`simulation-statistics`,byteLength:64,uniform:!1},...s?[{name:`contact-events`,byteLength:16+s*64,uniform:!1},{name:`contact-history`,byteLength:n*16,uniform:!1}]:[],...c?[{name:`query-settings`,byteLength:48,uniform:!0},{name:`query-selection`,byteLength:Math.max(4,t*4),uniform:!1},{name:`query-output`,byteLength:16+Math.max(1,t)*48,uniform:!1}]:[],...m?[{name:`query-batch-commands`,byteLength:m*48,uniform:!1},{name:`query-batch-results`,byteLength:m*64,uniform:!1}]:[],...a?[{name:`mesh-tasks`,byteLength:3145744,uniform:!1}]:[],...o?[{name:`parallel-state`,byteLength:y,uniform:!1},{name:`parallel-dispatch`,byteLength:48,uniform:!1}]:[],...i?[{name:`minima`,byteLength:t*12,uniform:!1},{name:`maxima`,byteLength:t*12,uniform:!1},{name:`object-attributes`,byteLength:t*4,uniform:!1}]:[]];if(u&&b.push({name:`continuous-previous`,byteLength:e*16,uniform:!1},{name:`continuous-selection`,byteLength:e*4,uniform:!1},{name:`continuous-status`,byteLength:e*16,uniform:!1}),l){b.push({name:`state-validity`,byteLength:e*4,uniform:!1});let t=[`positions`,`orientations`,`velocities`,`angular-velocities`,`sleep`,...f?[]:[`targets`,`manifolds`]].map((e,t)=>({name:`checkpoint-${t}`,byteLength:b.find(t=>t.name===e).byteLength,uniform:!1}));b.push(...t)}return{geometryOffset:h,pairOffset:g,diagnosticOffset:_,metadataLength:v,parallelByteLength:y,buffers:b}}var Zn=`
struct SurfacePoint { point:vec3f, distance:f32, complete:u32 }
fn closestSegment(point:vec3f,first:vec3f,second:vec3f)->vec3f{
 let edge=second-first;return first+edge*clamp(dot(point-first,edge)/max(dot(edge,edge),1e-30),0.0,1.0);
}
fn closestTriangle(point:vec3f,first:vec3f,second:vec3f,third:vec3f)->vec3f{
 let firstEdge=second-first;let secondEdge=third-first;let normal=cross(firstEdge,secondEdge);
 let squared=dot(normal,normal);
 if(squared>0.0){
  let projected=point-normal*(dot(point-first,normal)/squared);
  if(dot(cross(second-first,projected-first),normal)>=0.0&&dot(cross(third-second,projected-second),normal)>=0.0&&dot(cross(first-third,projected-third),normal)>=0.0){return projected;}
 }
 var nearest=closestSegment(point,first,second);
 for(var edge=0u;edge<2u;edge++){
  let candidate=closestSegment(point,select(third,second,edge==0u),select(first,third,edge==0u));
  if(distance(point,candidate)<distance(point,nearest)){nearest=candidate;}
 }
 return nearest;
}
fn closestSurface(collider:u32,point:vec3f)->SurfacePoint{
 let shape=bodies.colliders[collider].shape;var nearest=point;var inside=false;var complete=1u;
 if(shape.w==0.0){let magnitude=length(point);nearest=point/max(magnitude,1e-20)*shape.x;if(magnitude==0.0){nearest=vec3f(shape.x,0,0);}inside=magnitude<=shape.x;}
 else if(shape.w==1.0){nearest=clamp(point,-shape.xyz,shape.xyz);inside=all(abs(point)<=shape.xyz);}
 else if(shape.w==6.0){nearest=vec3f(point.x,0,point.z);if(shape.x>0.0){nearest.x=clamp(point.x,-shape.x,shape.x);}if(shape.y>0.0){nearest.z=clamp(point.z,-shape.y,shape.y);}}
 else if(shape.w==5.0){
  let radial=length(point.xz);let direction=select(vec2f(1,0),point.xz/max(radial,1e-20),radial>1e-20);
  let flattened=vec3f(radial,point.y,0);let bottom=vec3f(shape.x,-shape.z*0.5,0);let top=vec3f(shape.y,shape.z*0.5,0);
  var closest=closestSegment(flattened,bottom,top);
  let bottomCap=vec3f(clamp(radial,0.0,shape.x),bottom.y,0);let topCap=vec3f(clamp(radial,0.0,shape.y),top.y,0);
  if(distance(flattened,bottomCap)<distance(flattened,closest)){closest=bottomCap;}
  if(distance(flattened,topCap)<distance(flattened,closest)){closest=topCap;}
  nearest=vec3f(direction.x*closest.x,closest.y,direction.y*closest.x);
  inside=point.y>=bottom.y&&point.y<=top.y&&radial<=mix(shape.x,shape.y,clamp((point.y-bottom.y)/max(shape.z,1e-20),0.0,1.0));
 }else if(shape.w==4.0){
  let bottom=vec3f(0,-shape.z*0.5,0);let top=vec3f(0,shape.z*0.5,0);
  if(abs(shape.y-shape.x)>=shape.z){let center=select(bottom,top,shape.y>=shape.x);let radius=max(shape.x,shape.y);let delta=point-center;nearest=center+select(vec3f(1,0,0),delta/max(length(delta),1e-20),length(delta)>1e-20)*radius;inside=length(delta)<=radius;}
  else{
   let slope=(shape.y-shape.x)/shape.z;let radial=length(point.xz);let direction=select(vec2f(1,0),point.xz/max(radial,1e-20),radial>1e-20);
   let tangent=vec3f(sqrt(max(0.0,1.0-slope*slope)),-slope,0);
   let flattened=vec3f(radial,point.y,0);var closest=closestSegment(flattened,bottom+tangent*shape.x,top+tangent*shape.y);
   let bottomDirection=(flattened-bottom)/max(length(flattened-bottom),1e-20);let topDirection=(flattened-top)/max(length(flattened-top),1e-20);
   let bottomPoint=bottom+bottomDirection*shape.x;let topPoint=top+topDirection*shape.y;
   if(bottomDirection.y<=-slope&&distance(flattened,bottomPoint)<distance(flattened,closest)){closest=bottomPoint;}
   if(topDirection.y>=-slope&&distance(flattened,topPoint)<distance(flattened,closest)){closest=topPoint;}
   nearest=vec3f(direction.x*closest.x,closest.y,direction.y*closest.x);
   inside=length(flattened-bottom)<=shape.x||length(flattened-top)<=shape.y||(point.y>=bottom.y-shape.x*slope&&point.y<=top.y-shape.y*slope&&dot(flattened-bottom,tangent)<=shape.x);
  }
 }else{
  var best=3.402823e38;var work=0u;var node=0u;
  let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
  // Convex containment uses oriented face half-spaces. Triangle meshes retain surface semantics.
  inside=shape.w==2.0;
  if(inside){for(var triangle=0u;triangle<u32(bodies.colliders[collider].padding.w);triangle++){
   if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
   let first=triangleVertex(collider,triangle,0u);let second=triangleVertex(collider,triangle,1u);let third=triangleVertex(collider,triangle,2u);
   if(dot(point-first,cross(second-first,third-first))>0.0){inside=false;break;}
  }}
  loop{
   if(node>=nodeCount){break;}if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
   let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
   if(any(lower.xyz>upper.xyz)||distance(point,clamp(point,lower.xyz,upper.xyz))>best){node=u32(lower.w);continue;}
   if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);
    for(var offset=0u;offset<u32(upper.w);offset++){
     if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
     if(!meshTriangleActive(collider,start+offset)){continue;}
     let candidate=closestTriangle(point,triangleVertex(collider,start+offset,0u),triangleVertex(collider,start+offset,1u),triangleVertex(collider,start+offset,2u));
     let separation=distance(point,candidate);if(separation<best){best=separation;nearest=candidate;}
    }
   }if(complete==0u){break;}node++;
  }
  if(best==3.402823e38){return SurfacePoint(point,best,complete);}
 }
 return SurfacePoint(nearest,select(distance(point,nearest),0.0,inside),complete);
}
struct SphereSweep { point:vec3f, normal:vec3f, distance:f32, hit:u32, complete:u32 }
// Exact rounded-box cast: face rectangles, finite edge cylinders and corner spheres.
// Testing features separately preserves open corners instead of inflating an AABB.
fn sweepBox(origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,extent:vec3f)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;
 if(radius==0.0){
  var enter=0.0;var leave=maximumDistance;
  for(var coordinate=0u;coordinate<3u;coordinate++){
   if(direction[coordinate]==0.0){if(abs(origin[coordinate])>extent[coordinate]){return result;}}
   else{let first=(-extent[coordinate]-origin[coordinate])/direction[coordinate];let second=(extent[coordinate]-origin[coordinate])/direction[coordinate];let lower=min(first,second);
    if(lower>=enter){enter=lower;result.normal=vec3f(0);result.normal[coordinate]=select(1.0,-1.0,direction[coordinate]>0.0);}leave=min(leave,max(first,second));}
  }
  if(enter<=leave){result.hit=1u;result.distance=enter;result.point=origin+direction*enter;}
  return result;
 }
 let initial=clamp(origin,-extent,extent);let initialDelta=origin-initial;
 if(length(initialDelta)<=radius){result.hit=1u;result.point=initial;result.normal=initialDelta/max(length(initialDelta),1e-20);return result;}
 for(var coordinate=0u;coordinate<3u;coordinate++){
  let first=(coordinate+1u)%3u;let second=(coordinate+2u)%3u;
  for(var side=0u;side<2u;side++){
   let sign=select(-1.0,1.0,side==1u);
   if(direction[coordinate]*sign>=0.0){continue;}
   let travelled=(sign*(extent[coordinate]+radius)-origin[coordinate])/direction[coordinate];
   let center=origin+direction*travelled;
   if(travelled>=0.0&&travelled<=nearest&&abs(center[first])<=extent[first]&&abs(center[second])<=extent[second]){
    nearest=travelled;result.hit=1u;result.normal=vec3f(0);result.normal[coordinate]=sign;
   }
  }
  for(var corner=0u;corner<4u;corner++){
   var center=vec3f(0);center[first]=select(-extent[first],extent[first],(corner&1u)!=0u);center[second]=select(-extent[second],extent[second],(corner&2u)!=0u);
   var delta=origin-center;delta[coordinate]=0.0;var radialDirection=direction;radialDirection[coordinate]=0.0;
   let squared=dot(radialDirection,radialDirection);if(squared==0.0){continue;}
   let projection=dot(delta,radialDirection)/squared;let perpendicular=delta-radialDirection*projection;
   let discriminant=(radius*radius-dot(perpendicular,perpendicular))/squared;if(discriminant < -1e-6*radius*radius/squared){continue;}
   let travelled=-projection-sqrt(max(0.0,discriminant));let point=origin+direction*travelled;
   if(travelled>=0.0&&travelled<=nearest&&abs(point[coordinate])<=extent[coordinate]){
    nearest=travelled;result.hit=1u;center[coordinate]=point[coordinate];result.normal=(point-center)/max(radius,1e-20);
   }
  }
 }
 for(var corner=0u;corner<8u;corner++){
  let center=select(-extent,extent,vec3u(corner&1u,corner&2u,corner&4u)!=vec3u(0));
  let delta=origin-center;let projection=dot(delta,direction);let perpendicular=delta-direction*projection;
  let discriminant=radius*radius-dot(perpendicular,perpendicular);if(discriminant < -1e-6*radius*radius){continue;}
  let travelled=-projection-sqrt(max(0.0,discriminant));
  if(travelled>=0.0&&travelled<=nearest){nearest=travelled;result.hit=1u;result.normal=(origin+direction*travelled-center)/max(radius,1e-20);}
 }
 if(result.hit!=0u){result.distance=nearest;result.point=origin+direction*nearest-result.normal*radius;}
 return result;
}
// Drop the dominant normal component for ray edge tests. An on-edge ray can
// otherwise look outside when the computed plane intersection rounds off-plane.
fn rayTriangleEdge(edge:vec3f,offset:vec3f,normal:vec3f,axis:u32)->bool{
 let horizontal=(axis+1u)%3u;let vertical=(axis+2u)%3u;
 return (edge[horizontal]*offset[vertical]-edge[vertical]*offset[horizontal])*normal[axis]>=0.0;
}
// A triangle's sphere expansion is convex. Ignore only a departing initial touch
// on that triangle; other triangles in the same nonconvex mesh remain candidates.
fn sweepTriangle(origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,first:vec3f,second:vec3f,third:vec3f,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;
 let firstEdge=second-first;let secondEdge=third-first;
 let edgeScale=max(max(max(abs(firstEdge.x),abs(firstEdge.y)),abs(firstEdge.z)),max(max(abs(secondEdge.x),abs(secondEdge.y)),abs(secondEdge.z)));
 let rawNormal=cross(firstEdge/max(edgeScale,1e-30),secondEdge/max(edgeScale,1e-30));
 let normal=rawNormal/max(length(rawNormal),1e-20);
 let initial=closestTriangle(origin,first,second,third);let delta=origin-initial;
 let tolerance=max(1e-8,min(1e-5,radius*1e-5));
 if(length(delta)<=radius+tolerance){
  result.normal=select(normal,(delta)/max(length(delta),1e-20),length(delta)>0.0);
  if(skipSeparating&&dot(direction,result.normal)>=0.0){return result;}
  result.hit=1u;result.point=initial;return result;
 }
 let denominator=dot(direction,normal);
 // Clip a coplanar zero-radius ray against the triangle's three inward half-spaces.
 // A parallel offset ray remains a miss; coplanar picking retains edge intersections.
 if(radius==0.0&&denominator==0.0&&abs(dot(origin-first,normal))<=tolerance){
  var enter=0.0;var leave=maximumDistance;var enterNormal=normal;
  let corners=array<vec3f,3>(first,second,third);
  for(var edge=0u;edge<3u;edge++){
   let start=corners[edge];let side=(corners[(edge+1u)%3u]-start)/edgeScale;
   let offset=dot(cross(side,(origin-start)/edgeScale),normal);
   let change=dot(cross(side,direction/edgeScale),normal);
   if(change==0.0){if(offset<0.0){return result;}}
   else{let boundary=-offset/change;if(change>0.0){if(boundary>=enter){enter=boundary;enterNormal=normalize(cross(side,normal));}}else{leave=min(leave,boundary);}}
  }
  if(enter<=leave){result.hit=1u;result.distance=enter;result.point=origin+direction*enter;result.normal=enterNormal;}
  return result;
 }
 if(abs(denominator)>0.0){for(var side=0u;side<2u;side++){
  let sign=select(-1.0,1.0,side==1u);if(denominator*sign>=0.0){continue;}
  let travelled=(sign*radius-dot(origin-first,normal))/denominator;
  let point=origin+direction*travelled-normal*(sign*radius);
  if(travelled<0.0||travelled>nearest){continue;}
  let firstSide=(second-first)/edgeScale;let secondSide=(third-second)/edgeScale;let thirdSide=(first-third)/edgeScale;
  let firstOffset=(point-first)/edgeScale;let secondOffset=(point-second)/edgeScale;let thirdOffset=(point-third)/edgeScale;
  var inside=false;
  if(radius==0.0){
   let magnitude=abs(normal);
   var axis=select(0u,1u,magnitude.y>magnitude.x);
   if(magnitude.z>magnitude[axis]){axis=2u;}
   inside=rayTriangleEdge(firstSide,firstOffset,normal,axis)&&rayTriangleEdge(secondSide,secondOffset,normal,axis)&&rayTriangleEdge(thirdSide,thirdOffset,normal,axis);
  }else{
   inside=dot(cross(firstSide,firstOffset),normal)>=0.0&&dot(cross(secondSide,secondOffset),normal)>=0.0&&dot(cross(thirdSide,thirdOffset),normal)>=0.0;
  }
  if(inside){nearest=travelled;result.hit=1u;result.normal=normal*sign;}
 }}
 if(radius>0.0){
  var vertices=array<vec3f,3>(first,second,third);
  for(var edge=0u;edge<3u;edge++){
   let start=vertices[edge];let segment=vertices[(edge+1u)%3u]-start;
   let segmentLength=length(segment);let axis=segment/max(segmentLength,1e-20);
   let offset=origin-start;let radial=offset-axis*dot(offset,axis);let radialDirection=direction-axis*dot(direction,axis);
   let squared=dot(radialDirection,radialDirection);
   if(squared>0.0){
    let projection=dot(radial,radialDirection)/squared;let perpendicular=radial-radialDirection*projection;
    let discriminant=(radius*radius-dot(perpendicular,perpendicular))/squared;
    if(discriminant>=-1e-6*radius*radius/squared){
     let travelled=-projection-sqrt(max(0.0,discriminant));let center=origin+direction*travelled;let along=dot(center-start,axis);
     if(travelled>=0.0&&travelled<=nearest&&along>=0.0&&along<=segmentLength){nearest=travelled;result.hit=1u;result.normal=(center-start-axis*along)/radius;}
    }
   }
   let projection=dot(offset,direction);let perpendicular=offset-direction*projection;
   let discriminant=radius*radius-dot(perpendicular,perpendicular);
   if(discriminant>=-1e-6*radius*radius){
    let travelled=-projection-sqrt(max(0.0,discriminant));
    if(travelled>=0.0&&travelled<=nearest){nearest=travelled;result.hit=1u;result.normal=(origin+direction*travelled-start)/radius;}
   }
  }
 }
 if(result.hit!=0u){result.distance=nearest;result.point=origin+direction*nearest-result.normal*radius;}
 return result;
}
fn intersectsSweepBounds(origin:vec3f,direction:vec3f,maximumDistance:f32,lower:vec3f,upper:vec3f)->bool{
 var enter=0.0;var leave=maximumDistance;
 for(var coordinate=0u;coordinate<3u;coordinate++){
  if(direction[coordinate]==0.0){if(origin[coordinate]<lower[coordinate]||origin[coordinate]>upper[coordinate]){return false;}}
  else{let first=(lower[coordinate]-origin[coordinate])/direction[coordinate];let second=(upper[coordinate]-origin[coordinate])/direction[coordinate];enter=max(enter,min(first,second));leave=min(leave,max(first,second));}
 }
 return enter<=leave;
}
fn sweepMesh(collider:u32,origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;var work=0u;var node=0u;
 let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
 loop{
  if(node>=nodeCount){break;}if(work>=MESH_TRAVERSAL_BUDGET){result.complete=0u;return result;}work++;
  let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
  if(any(lower.xyz>upper.xyz)||!intersectsSweepBounds(origin,direction,nearest,lower.xyz-vec3f(radius),upper.xyz+vec3f(radius))){node=u32(lower.w);continue;}
  if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);
   for(var offset=0u;offset<u32(upper.w);offset++){
    if(work>=MESH_TRAVERSAL_BUDGET){result.complete=0u;return result;}work++;
    if(!meshTriangleActive(collider,start+offset)){continue;}
    let candidate=sweepTriangle(origin,direction,nearest,radius,triangleVertex(collider,start+offset,0u),triangleVertex(collider,start+offset,1u),triangleVertex(collider,start+offset,2u),skipSeparating);
    if(candidate.hit!=0u){nearest=candidate.distance;result=candidate;}
   }
  }node++;
 }
 return result;
}
fn sweepSphere(collider:u32,origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var travelled=0.0;
 let shape=bodies.colliders[collider].shape;
 if(shape.w==6.0&&shape.z==0.0&&origin.y<0.0){return result;}
 if(shape.w==3.0){return sweepMesh(collider,origin,direction,maximumDistance,radius,skipSeparating);}
 if(shape.w==1.0){return sweepBox(origin,direction,maximumDistance,radius,shape.xyz);}
 if(shape.w==0.0){
  let inflated=shape.x+radius;let projection=dot(origin,direction);
  let perpendicular=origin-direction*projection;let discriminant=inflated*inflated-dot(perpendicular,perpendicular);
  if(length(origin)>inflated){
   if(discriminant < -1e-6*inflated*inflated){return result;}
   travelled=-projection-sqrt(max(0.0,discriminant));
   if(travelled<0.0||travelled>maximumDistance){return result;}
  }
  let center=origin+direction*travelled;let normal=center/max(length(center),1e-20);
  result.point=normal*shape.x;result.normal=normal;result.distance=travelled;result.hit=1u;return result;
 }
 // Unbounded planes have an exact intersection, including parallel and tangent casts.
 if(shape.w==6.0&&shape.x==0.0&&shape.y==0.0){
  let side=select(-1.0,1.0,origin.y>=0.0);
  if(abs(origin.y)>radius){
   if(direction.y*side>=0.0){return result;}
   travelled=(side*radius-origin.y)/direction.y;
   if(travelled>maximumDistance){return result;}
  }
  let center=origin+direction*travelled;
  result.point=vec3f(center.x,0,center.z);result.normal=vec3f(0,side,0);result.distance=travelled;result.hit=1u;return result;
 }
 // Radius-zero rays still need a local-feature tolerance above float32 roundoff.
 // Never derive this from an elongated world AABB or the whole mesh bounds.
 let tolerance=max(1e-8,min(1e-5,max(radius,contactFeatureScale(collider,-1))*1e-6));
 for(var iteration=0u;iteration<128u;iteration++){
  let center=origin+direction*travelled;let surface=closestSurface(collider,center);
  if(surface.complete==0u){result.complete=0u;return result;}
  let separation=surface.distance-radius;
  if(separation<=tolerance){result.point=surface.point;result.normal=select(vec3f(0),(center-surface.point)/max(length(center-surface.point),1e-20),surface.distance>0.0);result.distance=travelled;result.hit=1u;return result;}
  if(travelled+separation>maximumDistance){return result;}
  let next=travelled+separation;
  if(next<=travelled){result.complete=0u;return result;}travelled=next;
 }
 result.complete=0u;return result;
}
`,Qn=`
struct SupportVertex { difference: vec3f, first: vec3f, second: vec3f }
fn meshVertex(collider:u32, index:u32)->vec3f {return readGeometry(u32(bodies.colliders[collider].padding.x)+index).xyz;}
fn localShapeSupport(collider:u32,direction:vec3f,triangle:i32)->vec3f {
 let shape=bodies.colliders[collider].shape;
 let magnitude=length(direction);let unit=select(vec3f(1,0,0),direction/max(magnitude,1e-20),magnitude>1e-20);
 if(triangle>=0){var best=triangleVertex(collider,u32(triangle),0u);for(var corner=1u;corner<3u;corner++){let candidate=triangleVertex(collider,u32(triangle),corner);if(dot(candidate,direction)>dot(best,direction)){best=candidate;}}return best;}
 if(shape.w==0.0){return unit*shape.x;}
 if(shape.w==1.0){return select(-shape.xyz,shape.xyz,direction>=vec3f(0));}
 if(shape.w==4.0){let bottom=unit*shape.x-vec3f(0,shape.z*0.5,0);let top=unit*shape.y+vec3f(0,shape.z*0.5,0);return select(bottom,top,dot(top,direction)>dot(bottom,direction));}
 if(shape.w==5.0){let radial=length(direction.xz);let ring=select(vec2f(1,0),direction.xz/max(radial,1e-20),radial>1e-20);let bottom=vec3f(ring.x*shape.x,-shape.z*0.5,ring.y*shape.x);let top=vec3f(ring.x*shape.y,shape.z*0.5,ring.y*shape.y);return select(bottom,top,dot(top,direction)>dot(bottom,direction));}
 let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
 var best=meshVertex(collider,0u);var projection=dot(best,direction);var node=0u;
 loop {if(node>=nodeCount){break;}let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
  let bound=dot(select(lower.xyz,upper.xyz,direction>=vec3f(0)),direction);
  if(bound<projection){node=u32(lower.w);continue;}
  if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);for(var face=0u;face<u32(upper.w);face++){for(var corner=0u;corner<3u;corner++){let candidate=triangleVertex(collider,start+face,corner);let value=dot(candidate,direction);if(value>projection){best=candidate;projection=value;}}}}
  node++;
 }
 return best;
}
fn triangleWeights(point:vec3f,first:vec3f,second:vec3f,third:vec3f)->vec3f {
 let firstEdge=second-first;let secondEdge=third-first;let delta=point-first;let firstProjection=dot(firstEdge,delta);let secondProjection=dot(secondEdge,delta);
 if(firstProjection<=0.0&&secondProjection<=0.0){return vec3f(1,0,0);}
 let secondDelta=point-second;let thirdProjection=dot(firstEdge,secondDelta);let fourthProjection=dot(secondEdge,secondDelta);
 if(thirdProjection>=0.0&&fourthProjection<=thirdProjection){return vec3f(0,1,0);}
 let edgeRegion=firstProjection*fourthProjection-thirdProjection*secondProjection;
 if(edgeRegion<=0.0&&firstProjection>=0.0&&thirdProjection<=0.0){let weight=firstProjection/(firstProjection-thirdProjection);return vec3f(1-weight,weight,0);}
 let thirdDelta=point-third;let fifthProjection=dot(firstEdge,thirdDelta);let sixthProjection=dot(secondEdge,thirdDelta);
 if(sixthProjection>=0.0&&fifthProjection<=sixthProjection){return vec3f(0,0,1);}
 let secondRegion=fifthProjection*secondProjection-firstProjection*sixthProjection;
 if(secondRegion<=0.0&&secondProjection>=0.0&&sixthProjection<=0.0){let weight=secondProjection/(secondProjection-sixthProjection);return vec3f(1-weight,0,weight);}
 let thirdRegion=thirdProjection*sixthProjection-fifthProjection*fourthProjection;
 if(thirdRegion<=0.0&&(fourthProjection-thirdProjection)>=0.0&&(fifthProjection-sixthProjection)>=0.0){let weight=(fourthProjection-thirdProjection)/((fourthProjection-thirdProjection)+(fifthProjection-sixthProjection));return vec3f(0,1-weight,weight);}
 let inverse=1.0/max(thirdRegion+secondRegion+edgeRegion,1e-20);return vec3f(thirdRegion,secondRegion,edgeRegion)*inverse;
}
`;function $n(e,t,n,r){return`
const CONTINUOUS_CAPACITY:u32=${e}u;
struct ContinuousCandidate { colliders:vec4u, point:vec4f, normal:vec4f }
struct ContinuousBounds { lower:vec4f, upper:vec4f }
struct ContinuousWork {
 count:atomic<u32>, overflow:atomic<u32>, remaining:f32, finished:u32,
 tests:atomic<u32>, peakTests:u32, rounds:u32, axis:u32,
 lastPair:vec4u, lastNormal:vec4f,
 bounds:array<ContinuousBounds,${r}>,
 previousPositions:array<vec4f,BODY_COUNT>, previousOrientations:array<vec4f,BODY_COUNT>,
 finalPositions:array<vec4f,BODY_COUNT>, finalOrientations:array<vec4f,BODY_COUNT>,
 candidates:array<ContinuousCandidate,CONTINUOUS_CAPACITY>
}
@group(0) @binding(15) var<storage,read_write> continuousWork:ContinuousWork;
@group(0) @binding(16) var<storage,read_write> continuousDispatch:array<atomic<u32>,4>;
struct ContinuousDistance { normal:vec3f, distance:f32, point:vec3f, complete:u32 }
fn continuousRotation(rotation:vec4f,angular:vec3f,time:f32)->vec4f {
 let speed=length(angular);if(speed<1e-12){return rotation;}
 let halfAngle=speed*time*0.5;
 return normalize(multiplyRotation(vec4f(angular*(sin(halfAngle)/speed),cos(halfAngle)),rotation));
}
fn continuousVelocity(body:u32)->vec3f {
 return select(velocities[body].xyz,vec3f(0),bodies.bodies[body].motion.x==0.0);
}
fn continuousAngular(body:u32)->vec3f {
 return select(angularVelocities[body].xyz,vec3f(0),bodies.bodies[body].motion.x==0.0);
}
fn continuousPointVelocity(body:u32,point:vec3f,time:f32)->vec3f {
 return continuousVelocity(body)+cross(continuousAngular(body),point-positions[body].xyz-continuousVelocity(body)*time);
}
fn continuousSupport(collider:u32,direction:vec3f,time:f32)->vec3f {
 let body=colliderBody(collider);
 let rotation=continuousRotation(orientations[body],continuousAngular(body),time);
 let colliderOrientation=multiplyRotation(rotation,bodies.colliders[collider].orientation);
 let localDirection=rotate(vec4f(-colliderOrientation.xyz,colliderOrientation.w),direction);
 let shape=bodies.colliders[collider].shape;
 let magnitude=length(localDirection);let unit=localDirection/max(magnitude,1e-20);
 var supportPoint=unit*shape.x;
 // Tied support faces use their center instead of an arbitrary torque-producing corner.
 if(shape.w==1.0){supportPoint=select(-shape.xyz,shape.xyz,localDirection>=vec3f(0));supportPoint=select(supportPoint,vec3f(0),localDirection==vec3f(0));}
 if(shape.w==4.0||shape.w==5.0){
  var bottom=unit*shape.x-vec3f(0,shape.z*0.5,0);var top=unit*shape.y+vec3f(0,shape.z*0.5,0);
  if(shape.w==5.0){
   let radial=length(localDirection.xz);let ring=localDirection.xz/max(radial,1e-20);
   bottom=vec3f(ring.x*shape.x,-shape.z*0.5,ring.y*shape.x);top=vec3f(ring.x*shape.y,shape.z*0.5,ring.y*shape.y);
  }
  let bottomProjection=dot(bottom,localDirection);let topProjection=dot(top,localDirection);
  supportPoint=select(bottom,top,topProjection>bottomProjection);
  if(topProjection==bottomProjection){supportPoint=(bottom+top)*0.5;}
 }
 ${n?`if(shape.w==2.0){
  supportPoint=localShapeSupport(collider,localDirection,-1);
  let projection=dot(supportPoint,localDirection);var total=vec3f(0);var count=0u;
  for(var vertex=0u;vertex<u32(bodies.colliders[collider].padding.y);vertex++){
   let point=meshVertex(collider,vertex);
   if(dot(point,localDirection)==projection){total+=point;count++;}
  }
  if(count>0u){supportPoint=total/f32(count);}
 }`:``}
 return positions[body].xyz+continuousVelocity(body)*time+rotate(rotation,bodies.colliders[collider].position.xyz)+rotate(colliderOrientation,supportPoint);
}
fn continuousVertex(first:u32,second:u32,direction:vec3f,time:f32,scale:f32)->SupportVertex {
 var vertex:SupportVertex;
 vertex.first=continuousSupport(first,direction,time);vertex.second=continuousSupport(second,-direction,time);
 vertex.difference=(vertex.first-vertex.second)/scale;return vertex;
}
// Closest-simplex distance with independently evaluated vertices, segments and faces.
// A support plane supplies a lower bound; its witness supplies an upper bound.
fn continuousDistance(first:u32,second:u32,time:f32,tolerance:f32)->ContinuousDistance {
 // Exact point-to-OBB distance avoids a near-contact smooth-support GJK degeneracy.
 let firstShape=bodies.colliders[first].shape;let secondShape=bodies.colliders[second].shape;
 if(firstShape.w==0.0&&secondShape.w==0.0){
  let firstBody=colliderBody(first);let secondBody=colliderBody(second);
  let firstCenter=positions[firstBody].xyz+continuousVelocity(firstBody)*time+rotate(continuousRotation(orientations[firstBody],continuousAngular(firstBody),time),bodies.colliders[first].position.xyz);
  let secondCenter=positions[secondBody].xyz+continuousVelocity(secondBody)*time+rotate(continuousRotation(orientations[secondBody],continuousAngular(secondBody),time),bodies.colliders[second].position.xyz);
  let offset=firstCenter-secondCenter;let magnitude=length(offset);let normal=offset/max(magnitude,1e-20);
  var exact:ContinuousDistance;exact.complete=1u;exact.distance=max(0.0,magnitude-firstShape.x-secondShape.x);exact.normal=normal;
  exact.point=(firstCenter-normal*firstShape.x+secondCenter+normal*secondShape.x)*0.5;return exact;
 }
 if(firstShape.w==1.0&&secondShape.w==1.0){
  let firstBody=colliderBody(first);let secondBody=colliderBody(second);
  let firstBodyRotation=continuousRotation(orientations[firstBody],continuousAngular(firstBody),time);
  let secondBodyRotation=continuousRotation(orientations[secondBody],continuousAngular(secondBody),time);
  let firstRotation=multiplyRotation(firstBodyRotation,bodies.colliders[first].orientation);
  let secondRotation=multiplyRotation(secondBodyRotation,bodies.colliders[second].orientation);
  let firstCenter=positions[firstBody].xyz+continuousVelocity(firstBody)*time+rotate(firstBodyRotation,bodies.colliders[first].position.xyz);
  let secondCenter=positions[secondBody].xyz+continuousVelocity(secondBody)*time+rotate(secondBodyRotation,bodies.colliders[second].position.xyz);
  var axes:array<vec3f,6>;
  for(var coordinate=0u;coordinate<3u;coordinate++){
   var unit=vec3f(0);unit[coordinate]=1.0;axes[coordinate]=rotate(firstRotation,unit);axes[coordinate+3u]=rotate(secondRotation,unit);
  }
  var separation= -1e30;var normal=vec3f(1,0,0);
  for(var index=0u;index<15u;index++){
   var direction=vec3f(0);
   if(index<6u){direction=axes[index];}else{let edge=index-6u;direction=cross(axes[edge/3u],axes[3u+edge%3u]);}
   let magnitude=length(direction);if(magnitude<1e-7){continue;}direction/=magnitude;
   var firstExtent=0.0;var secondExtent=0.0;
   for(var coordinate=0u;coordinate<3u;coordinate++){
    firstExtent+=abs(dot(direction,axes[coordinate]))*firstShape[coordinate];
    secondExtent+=abs(dot(direction,axes[coordinate+3u]))*secondShape[coordinate];
   }
   let projection=dot(firstCenter-secondCenter,direction);let gap=abs(projection)-firstExtent-secondExtent;
   if(gap>separation){separation=gap;normal=direction*select(-1.0,1.0,projection>=0.0);}
  }
  // The largest separating-axis gap is a conservative Euclidean distance bound.
  var bounds:ContinuousDistance;bounds.complete=1u;bounds.distance=max(0.0,separation);bounds.normal=normal;
  bounds.point=(continuousSupport(first,-normal,time)+continuousSupport(second,normal,time))*0.5;return bounds;
 }
 if((firstShape.w==0.0&&secondShape.w==1.0)||(firstShape.w==1.0&&secondShape.w==0.0)){
  let sphere=select(second,first,firstShape.w==0.0);let box=select(first,second,firstShape.w==0.0);
  let sphereBody=colliderBody(sphere);let boxBody=colliderBody(box);
  let sphereRotation=continuousRotation(orientations[sphereBody],continuousAngular(sphereBody),time);
  let boxBodyRotation=continuousRotation(orientations[boxBody],continuousAngular(boxBody),time);
  let boxRotation=multiplyRotation(boxBodyRotation,bodies.colliders[box].orientation);
  let center=positions[sphereBody].xyz+continuousVelocity(sphereBody)*time+rotate(sphereRotation,bodies.colliders[sphere].position.xyz);
  let boxCenter=positions[boxBody].xyz+continuousVelocity(boxBody)*time+rotate(boxBodyRotation,bodies.colliders[box].position.xyz);
  let localCenter=rotate(vec4f(-boxRotation.xyz,boxRotation.w),center-boxCenter);
  let closest=boxCenter+rotate(boxRotation,clamp(localCenter,-bodies.colliders[box].shape.xyz,bodies.colliders[box].shape.xyz));
  let offset=center-closest;let magnitude=length(offset);let radius=bodies.colliders[sphere].shape.x;
  var exact:ContinuousDistance;exact.complete=1u;exact.distance=max(0.0,magnitude-radius);
  let normal=offset/max(magnitude,1e-20);exact.normal=select(-normal,normal,firstShape.w==0.0);
  exact.point=(closest+center-normal*radius)*0.5;return exact;
 }
 let scale=max(1e-12,min(contactFeatureScale(first,-1),contactFeatureScale(second,-1)));
 let normalizedTolerance=tolerance/scale;
 var result:ContinuousDistance;
 var simplex:array<SupportVertex,4>;var count=1u;
 var direction=colliderPosition(second)-colliderPosition(first);
 if(length(direction)<1e-12){direction=vec3f(1,0,0);}
 simplex[0]=continuousVertex(first,second,direction,time,scale);
 var closest=simplex[0].difference;var witnessFirst=simplex[0].first;var witnessSecond=simplex[0].second;
 for(var iteration=0u;iteration<64u;iteration++){
  let magnitude=length(closest);
  if(magnitude<=normalizedTolerance){result.distance=0.0;result.point=(witnessFirst+witnessSecond)*0.5;result.complete=1u;return result;}
  let normal=closest/magnitude;
  let vertex=continuousVertex(first,second,-normal,time,scale);
  let lower=dot(normal,vertex.difference);
  if(magnitude-lower<=normalizedTolerance*0.25||(iteration>=8u&&lower>normalizedTolerance)){
   result.normal=normal;result.distance=max(0.0,lower)*scale;result.point=(witnessFirst+witnessSecond)*0.5;result.complete=1u;return result;
  }
  if(count>=4u){return result;}
  simplex[count]=vertex;count++;
  var best=1e30;var weights=vec4f(0);
  for(var corner=0u;corner<count;corner++){
   let squared=dot(simplex[corner].difference,simplex[corner].difference);
   if(squared<best){best=squared;weights=vec4f(0);weights[corner]=1.0;}
   for(var other=corner+1u;other<count;other++){
    let edge=simplex[other].difference-simplex[corner].difference;
    let fraction=clamp(-dot(simplex[corner].difference,edge)/max(dot(edge,edge),1e-30),0.0,1.0);
    let point=simplex[corner].difference+edge*fraction;let squaredEdge=dot(point,point);
    if(squaredEdge<best){best=squaredEdge;weights=vec4f(0);weights[corner]=1.0-fraction;weights[other]=fraction;}
    for(var third=other+1u;third<count;third++){
     let faceWeights=triangleWeights(vec3f(0),simplex[corner].difference,simplex[other].difference,simplex[third].difference);
     let point=faceWeights.x*simplex[corner].difference+faceWeights.y*simplex[other].difference+faceWeights.z*simplex[third].difference;
     let squaredFace=dot(point,point);
     if(squaredFace<best){best=squaredFace;weights=vec4f(0);weights[corner]=faceWeights.x;weights[other]=faceWeights.y;weights[third]=faceWeights.z;}
    }
   }
  }
  if(count==4u){
   let origin=simplex[0].difference;let firstEdge=simplex[1].difference-origin;let secondEdge=simplex[2].difference-origin;let thirdEdge=simplex[3].difference-origin;
   let determinant=dot(firstEdge,cross(secondEdge,thirdEdge));
   if(abs(determinant)>1e-25){
    let coordinates=vec3f(dot(-origin,cross(secondEdge,thirdEdge)),dot(firstEdge,cross(-origin,thirdEdge)),dot(firstEdge,cross(secondEdge,-origin)))/determinant;
    if(all(coordinates>=vec3f(0))&&coordinates.x+coordinates.y+coordinates.z<=1.0){
     let weights=vec4f(1.0-coordinates.x-coordinates.y-coordinates.z,coordinates);
     var firstPoint=vec3f(0);var secondPoint=vec3f(0);
     for(var corner=0u;corner<4u;corner++){firstPoint+=simplex[corner].first*weights[corner];secondPoint+=simplex[corner].second*weights[corner];}
     result.complete=1u;result.distance=0.0;result.point=(firstPoint+secondPoint)*0.5;return result;
    }
   }
  }
  closest=vec3f(0);witnessFirst=vec3f(0);witnessSecond=vec3f(0);var retained=0u;
  for(var corner=0u;corner<count;corner++){
   closest+=simplex[corner].difference*weights[corner];witnessFirst+=simplex[corner].first*weights[corner];witnessSecond+=simplex[corner].second*weights[corner];
   if(weights[corner]>0.0){simplex[retained]=simplex[corner];retained++;}
  }
  count=retained;
 }
 return result;
}
fn continuousRadius(collider:u32)->f32 {
 let shape=bodies.colliders[collider].shape;var radius=length(shape.xyz);
 if(shape.w==0.0){radius=shape.x;}
 if(shape.w==4.0){radius=max(shape.x,shape.y)+shape.z*0.5;}
 if(shape.w==5.0){radius=length(vec2f(max(shape.x,shape.y),shape.z*0.5));}
 return radius+length(bodies.colliders[collider].position.xyz);
}
@compute @workgroup_size(64) fn saveConvexContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}
 continuousWork.previousPositions[body]=positions[body];continuousWork.previousOrientations[body]=orientations[body];continuousStatus[body]=vec4u(0);
}
@compute @workgroup_size(64) fn prepareConvexContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}
 continuousWork.finalPositions[body]=positions[body];continuousWork.finalOrientations[body]=orientations[body];
 // Preserve discrete positional recovery while replaying the accepted velocity trajectory.
 positions[body]=vec4f(positions[body].xyz-continuousVelocity(body)*settings.gravity.w,positions[body].w);
 orientations[body]=continuousWork.previousOrientations[body];
 if(body==0u){continuousWork.remaining=settings.gravity.w;continuousWork.finished=0u;continuousWork.peakTests=0u;continuousWork.rounds=0u;continuousWork.lastPair=vec4u(0xffffffffu);}
}
@compute @workgroup_size(64) fn boundContinuousQueue(@builtin(global_invocation_id) invocation:vec3u){
 let collider=invocation.x;if(collider>=${r}u){return;}
 var bounds:ContinuousBounds;bounds.lower=vec4f(3.4e38);bounds.upper=vec4f(3.4e38);
 if(collider<COLLIDER_COUNT){
  let body=colliderBody(collider);let start=positions[body].xyz;
  let end=start+continuousVelocity(body)*continuousWork.remaining;let radius=vec3f(continuousRadius(collider));
  bounds.lower=vec4f(min(start,end)-radius,bitcast<f32>(collider));bounds.upper=vec4f(max(start,end)+radius,0);
 }
 continuousWork.bounds[collider]=bounds;
}
@compute @workgroup_size(1) fn resetContinuousQueue(){
 atomicStore(&continuousDispatch[0],0u);atomicStore(&continuousDispatch[1],1u);atomicStore(&continuousDispatch[2],1u);
 atomicStore(&continuousWork.count,0u);atomicStore(&continuousWork.overflow,0u);atomicStore(&continuousWork.tests,0u);
 var lower=vec3f(3.4e38);var upper=vec3f(-3.4e38);
 for(var index=0u;index<COLLIDER_COUNT;index++){
  let bounds=continuousWork.bounds[index];let center=bounds.lower.xyz*0.5+bounds.upper.xyz*0.5;
  lower=min(lower,center);upper=max(upper,center);
 }
 let extent=upper-lower;var coordinate=0u;
 if(extent.y>extent.x){coordinate=1u;}if(extent.z>extent[coordinate]){coordinate=2u;}continuousWork.axis=coordinate;
}
${Array.from({length:Math.log2(r)},(e,t)=>{let n=2**(t+1);return Array.from({length:t+1},(e,i)=>{let a=2**(t-i);return`@compute @workgroup_size(64) fn sortContinuous${n}_${a}(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;let partner=index^${a}u;if(index>=${r}u||partner<=index){return;}
 let first=continuousWork.bounds[index];let second=continuousWork.bounds[partner];let coordinate=continuousWork.axis;
 let greater=first.lower[coordinate]>second.lower[coordinate]||(first.lower[coordinate]==second.lower[coordinate]&&bitcast<u32>(first.lower.w)>bitcast<u32>(second.lower.w));
 if(greater==((index&${n}u)==0u)){continuousWork.bounds[index]=second;continuousWork.bounds[partner]=first;}
}`}).join(`
`)}).join(`
`)}
@compute @workgroup_size(64) fn buildContinuousQueue(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=COLLIDER_COUNT||continuousWork.finished!=0u){return;}
 let firstBounds=continuousWork.bounds[index];let originalFirst=bitcast<u32>(firstBounds.lower.w);
 for(var other=index+1u;other<COLLIDER_COUNT;other++){
  let secondBounds=continuousWork.bounds[other];
  if(secondBounds.lower[continuousWork.axis]>firstBounds.upper[continuousWork.axis]){break;}
  atomicAdd(&continuousWork.tests,1u);
  let originalSecond=bitcast<u32>(secondBounds.lower.w);let first=min(originalFirst,originalSecond);let second=max(originalFirst,originalSecond);
  let firstBody=colliderBody(first);let secondBody=colliderBody(second);
  if(firstBody==secondBody||(continuousSelection[firstBody]==0u&&continuousSelection[secondBody]==0u)||bodies.colliders[first].material.w!=0.0||bodies.colliders[second].material.w!=0.0||excludes(first,second)||excludes(second,first)){continue;}
  if(any(firstBounds.lower.xyz>secondBounds.upper.xyz)||any(secondBounds.lower.xyz>firstBounds.upper.xyz)){continue;}
  let slot=atomicAdd(&continuousWork.count,1u);
  if(slot>=CONTINUOUS_CAPACITY){atomicStore(&continuousWork.overflow,1u);continue;}
  continuousWork.candidates[slot].colliders=vec4u(first,second,0,0);
  atomicMax(&continuousDispatch[0],slot/64u+1u);
 }
}
// Lower bound on the fixed-plane gap rate over every material point.
// Including non-supporting box corners keeps the bound valid through feature changes.
fn continuousSupportRate(collider:u32,direction:vec3f,normal:vec3f,time:f32)->f32 {
 let body=colliderBody(collider);let angular=continuousAngular(body);
 let rotation=continuousRotation(orientations[body],angular,time);
 let colliderOrientation=multiplyRotation(rotation,bodies.colliders[collider].orientation);
 let offset=rotate(rotation,bodies.colliders[collider].position.xyz);
 let base=dot(continuousVelocity(body)+cross(angular,offset),normal);
 let shape=bodies.colliders[collider].shape;
 if(shape.w==0.0){return base;}
 if(shape.w==1.0){
  let coefficients=rotate(vec4f(-colliderOrientation.xyz,colliderOrientation.w),cross(normal,angular));
  let rate=base-dot(abs(coefficients),shape.xyz);
  return rate;
 }
 return dot(continuousVelocity(body),normal)-length(angular)*continuousRadius(collider);
}
fn continuousQuadraticLimit(available:f32,rate:f32,curvature:f32)->f32 {
 if(available<=0.0){return 0.0;}
 if(curvature>1e-20){let root=sqrt(rate*rate+2.0*curvature*available);return select(2.0*available/(root-rate),(root+rate)/curvature,rate>=0.0);}
 if(rate<0.0){return available/(-rate);}return 1e30;
}
fn continuousAdvance(first:u32,second:u32,normal:vec3f,time:f32,margin:f32)->f32 {
 let firstBody=colliderBody(first);let secondBody=colliderBody(second);
 let firstRadius=select(continuousRadius(first),length(bodies.colliders[first].position.xyz),bodies.colliders[first].shape.w==0.0);
 let secondRadius=select(continuousRadius(second),length(bodies.colliders[second].position.xyz),bodies.colliders[second].shape.w==0.0);
 let curvature=dot(continuousAngular(firstBody),continuousAngular(firstBody))*firstRadius+dot(continuousAngular(secondBody),continuousAngular(secondBody))*secondRadius;
 if(bodies.colliders[first].shape.w==1.0||bodies.colliders[second].shape.w==1.0){
  let box=select(second,first,bodies.colliders[first].shape.w==1.0);let other=select(first,second,box==first);
  let planeNormal=select(-normal,normal,box==first);let body=colliderBody(box);
  let rotation=continuousRotation(orientations[body],continuousAngular(body),time);
  let colliderOrientation=multiplyRotation(rotation,bodies.colliders[box].orientation);
  let center=positions[body].xyz+continuousVelocity(body)*time+rotate(rotation,bodies.colliders[box].position.xyz);
  let otherPoint=continuousSupport(other,planeNormal,time);
  let otherRate=continuousSupportRate(other,planeNormal,-planeNormal,time);
  var limit=1e30;
  // Each corner carries its own initial gap and rate. Taking their minimum stays
  // conservative through face changes without combining one corner's small gap
  // with a different, distant corner's worst angular velocity.
  for(var corner=0u;corner<8u;corner++){
   let signs=vec3f(select(-1.0,1.0,(corner&1u)!=0u),select(-1.0,1.0,(corner&2u)!=0u),select(-1.0,1.0,(corner&4u)!=0u));
   let point=center+rotate(colliderOrientation,signs*bodies.colliders[box].shape.xyz);
   let gap=dot(point-otherPoint,planeNormal)-margin;
   let rate=dot(continuousPointVelocity(body,point,time),planeNormal)+otherRate;
   limit=min(limit,continuousQuadraticLimit(gap,rate,curvature));
  }
  return limit;
 }
 let gap=dot(continuousSupport(first,-normal,time)-continuousSupport(second,normal,time),normal)-margin;
 let rate=continuousSupportRate(first,-normal,normal,time)+continuousSupportRate(second,normal,-normal,time);
 return continuousQuadraticLimit(gap,rate,curvature);
}
@compute @workgroup_size(64) fn findContinuousImpacts(@builtin(global_invocation_id) invocation:vec3u){
 let slot=invocation.x;if(slot>=min(atomicLoad(&continuousWork.count),CONTINUOUS_CAPACITY)||continuousWork.finished!=0u){return;}
 let pair=continuousWork.candidates[slot].colliders.xy;let first=pair.x;let second=pair.y;
 let firstBody=colliderBody(first);let secondBody=colliderBody(second);
 let relative=continuousVelocity(firstBody)-continuousVelocity(secondBody);
 // A centered sphere is rotationally invariant; spin alone must not inflate TOI work.
 let firstAngularRadius=select(continuousRadius(first),length(bodies.colliders[first].position.xyz),bodies.colliders[first].shape.w==0.0);
 let secondAngularRadius=select(continuousRadius(second),length(bodies.colliders[second].position.xyz),bodies.colliders[second].shape.w==0.0);
 let angularBound=length(continuousAngular(firstBody))*firstAngularRadius+length(continuousAngular(secondBody))*secondAngularRadius;
 let coordinate=max(length(positions[firstBody].xyz),length(positions[secondBody].xyz));
 let tolerance=max(max(1e-7,coordinate*8e-7),min(1e-5,min(contactFeatureScale(first,-1),contactFeatureScale(second,-1))*1e-4));
 let contactEnvelope=tolerance*8.0;
 var time=0.0;var lastNormal=vec3f(0);var complete=false;var leavingContact=false;var exitNormal=vec3f(0);
 for(var iteration=0u;iteration<128u;iteration++){
  var distance=continuousDistance(first,second,time,tolerance);
  if(time==0.0&&length(distance.normal)<0.5&&all(continuousWork.lastPair.xy==pair)){
   // The immediately preceding impulse owns a qualified plane at this unchanged pose.
   distance.normal=continuousWork.lastNormal.xyz;
  }
  if(distance.complete==0u){break;}
  if(time==0.0&&distance.distance<=contactEnvelope){
   // A fresh closing contact can be caused by another simultaneous impact.
   let normal=distance.normal;var closing=false;
   // A different impact may have driven an initially touching generic simplex closed.
   // Without a qualified plane, never silently call that pair separating.
   if(length(normal)<0.5&&continuousWork.rounds>0u){break;}
   if(length(normal)>0.5){closing=dot(pointVelocity(firstBody,distance.point)-pointVelocity(secondBody,distance.point),normal)< -1e-5;}
   if(closing){lastNormal=normal;}else{
    // Fixed-orientation separating convex trajectories cannot re-enter until another impact.
    if(angularBound<=1e-8){complete=true;break;}
    leavingContact=true;exitNormal=normal;
   }
  }
  if(leavingContact){
   if(length(distance.normal)>0.5){
    // Refresh the separating plane as the obstacle rotates. An old plane can cut
    // through disjoint shapes and must not be mistaken for actual penetration.
    exitNormal=distance.normal;
    let speed=dot(continuousPointVelocity(firstBody,distance.point,time)-continuousPointVelocity(secondBody,distance.point,time),exitNormal);
    if(time>0.0&&distance.distance<=contactEnvelope&&speed< -1e-5){
     continuousWork.candidates[slot].colliders.z=1u;
     continuousWork.candidates[slot].point=vec4f(distance.point,time);
     continuousWork.candidates[slot].normal=vec4f(exitNormal,contactEnvelope);complete=true;break;
    }
   }
   if(distance.distance>contactEnvelope){leavingContact=false;}else{
    // Bound fixed-plane curvature rather than sampling at velocity-sized intervals.
    // Every support-point trajectory stays above this quadratic lower envelope.
    var increment=contactEnvelope*0.5/max(length(relative)+angularBound,1e-20);
    if(length(exitNormal)>0.5){
     increment=continuousAdvance(first,second,exitNormal,time,-contactEnvelope);
     if(increment<=0.0){break;}
    }
    if(time+increment>=continuousWork.remaining){
     // The entire remaining interval is certified within the contact envelope.
     complete=true;break;
    }
    time+=increment;continue;
   }
  }
  if(distance.distance<=contactEnvelope){
   continuousWork.candidates[slot].colliders.z=1u;
   continuousWork.candidates[slot].point=vec4f(distance.point,time);
   continuousWork.candidates[slot].normal=vec4f(lastNormal,contactEnvelope);complete=true;break;
  }
  lastNormal=distance.normal;
  let increment=continuousAdvance(first,second,distance.normal,time,contactEnvelope*0.5);
  if(time+increment>continuousWork.remaining){complete=true;break;}
  if(increment<=max(1e-12,continuousWork.remaining*1e-8)){break;}
  time+=increment;
 }
 if(!complete){continuousWork.candidates[slot].colliders.z=2u;}
}
fn continuousBoxShell(collider:u32,point:vec3f,tolerance:f32)->bool {
 return all(abs(colliderLocal(collider,point-colliderPosition(collider)))<=bodies.colliders[collider].shape.xyz+vec3f(tolerance));
}
fn continuousImpactPoint(first:u32,second:u32,point:vec3f,normal:vec3f,queryTolerance:f32)->vec4f {
 if(bodies.colliders[first].shape.w!=1.0||bodies.colliders[second].shape.w!=1.0){return vec4f(point,1);}
 let tolerance=max(queryTolerance*2.0,max(1e-5,max(length(colliderPosition(first)),length(colliderPosition(second)))*2e-6));
 var reference=first;var faceAxis=0u;var maximumAlignment=0.0;
 for(var side=0u;side<2u;side++){
  let collider=select(first,second,side==1u);
  for(var coordinate=0u;coordinate<3u;coordinate++){
   let alignment=abs(dot(axis(collider,coordinate),normal));
   if(alignment>maximumAlignment){maximumAlignment=alignment;reference=collider;faceAxis=coordinate;}
  }
 }
 if(maximumAlignment>0.99999){
  // Preserve the exact authored center when an entire support face is contained.
  // Averaging translated world corners can otherwise create a tiny artificial torque.
  var contained=vec4f(0);var smallestArea=1e30;
  for(var side=0u;side<2u;side++){
   let collider=select(first,second,side==1u);let other=select(second,first,side==1u);
   let direction=select(-normal,normal,side==1u);
   for(var coordinate=0u;coordinate<3u;coordinate++){
    let faceDirection=axis(collider,coordinate);if(abs(dot(faceDirection,direction))<0.99999){continue;}
    let faceCenter=colliderPosition(collider)+faceDirection*bodies.colliders[collider].shape[coordinate]*select(-1.0,1.0,dot(faceDirection,direction)>=0.0);
    let firstTangent=axis(collider,(coordinate+1u)%3u)*bodies.colliders[collider].shape[(coordinate+1u)%3u];
    let secondTangent=axis(collider,(coordinate+2u)%3u)*bodies.colliders[collider].shape[(coordinate+2u)%3u];
    let area=length(firstTangent)*length(secondTangent);
    if(area<smallestArea&&continuousBoxShell(other,faceCenter-firstTangent-secondTangent,tolerance)&&continuousBoxShell(other,faceCenter+firstTangent-secondTangent,tolerance)&&continuousBoxShell(other,faceCenter+firstTangent+secondTangent,tolerance)&&continuousBoxShell(other,faceCenter-firstTangent+secondTangent,tolerance)){
     contained=vec4f(faceCenter,1);smallestArea=area;
    }
   }
  }
  if(contained.w>0.0){return contained;}
  let incident=select(first,second,reference==first);
  let direction=select(-normal,normal,reference==second);
  let referenceNormal=axis(reference,faceAxis)*select(-1.0,1.0,dot(axis(reference,faceAxis),direction)>=0.0);
  let referenceCenter=colliderPosition(reference)+referenceNormal*bodies.colliders[reference].shape[faceAxis];
  let contactPatch=clipBoxContact(reference,incident,faceAxis,referenceNormal,tolerance);
  var total=vec3f(0);var count=0u;
  for(var index=0u;index<contactPatch.count;index++){
   let separation=dot(referenceCenter-contactPatch.points[index],referenceNormal);
   if(abs(separation)<=tolerance*4.0){total+=contactPatch.points[index]+referenceNormal*separation*0.5;count++;}
  }
  if(count>0u){
   let centroid=total/f32(count);
   if(continuousBoxShell(first,centroid,tolerance*4.0)&&continuousBoxShell(second,centroid,tolerance*4.0)){return vec4f(centroid,1);}
  }
  // No valid clipped witness is a failed query, never permission to use an off-surface point.
  return vec4f(0);
 }
 // Edge/edge SAT axes use closest points on the actual supporting finite segments.
 var firstAxis=0u;var secondAxis=0u;var maximumCrossAlignment=0.0;
 for(var horizontal=0u;horizontal<3u;horizontal++){
  for(var vertical=0u;vertical<3u;vertical++){
   let direction=cross(axis(first,horizontal),axis(second,vertical));let magnitude=length(direction);
   if(magnitude>1e-7){let alignment=abs(dot(direction/magnitude,normal));if(alignment>maximumCrossAlignment){maximumCrossAlignment=alignment;firstAxis=horizontal;secondAxis=vertical;}}
  }
 }
 if(maximumCrossAlignment<0.99999){return vec4f(0);}
 let firstDirection=axis(first,firstAxis);let secondDirection=axis(second,secondAxis);
 var firstCenter=continuousSupport(first,-normal,0.0);var secondCenter=continuousSupport(second,normal,0.0);
 firstCenter-=firstDirection*dot(firstCenter-colliderPosition(first),firstDirection);
 secondCenter-=secondDirection*dot(secondCenter-colliderPosition(second),secondDirection);
 let delta=firstCenter-secondCenter;let alignment=dot(firstDirection,secondDirection);let denominator=1.0-alignment*alignment;
 if(denominator<=1e-12){return vec4f(0);}
 var firstDistance=clamp((alignment*dot(secondDirection,delta)-dot(firstDirection,delta))/denominator,-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
 let secondDistance=clamp(dot(secondDirection,delta)+alignment*firstDistance,-bodies.colliders[second].shape[secondAxis],bodies.colliders[second].shape[secondAxis]);
 firstDistance=clamp(alignment*secondDistance-dot(firstDirection,delta),-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
 let witness=(firstCenter+firstDirection*firstDistance+secondCenter+secondDirection*secondDistance)*0.5;
 if(continuousBoxShell(first,witness,tolerance*4.0)&&continuousBoxShell(second,witness,tolerance*4.0)){return vec4f(witness,1);}
 return vec4f(0);
}
@compute @workgroup_size(1) fn resolveConvexContinuous(){
 if(continuousWork.finished!=0u){return;}
 continuousWork.peakTests=max(continuousWork.peakTests,atomicLoad(&continuousWork.tests));continuousWork.rounds++;
 continuousStatus[0].w=max(continuousStatus[0].w,atomicLoad(&continuousWork.count));
 if(atomicLoad(&continuousWork.overflow)!=0u){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 var nearest=continuousWork.remaining;var selected=0xffffffffu;
 // Deterministic ownership even though queue reservations are parallel.
 var selectedPair=vec2u(0xffffffffu);
 for(var slot=0u;slot<min(atomicLoad(&continuousWork.count),CONTINUOUS_CAPACITY);slot++){
  let candidate=continuousWork.candidates[slot];
  if(candidate.colliders.z==2u){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
  let pair=candidate.colliders.xy;
  let precedes=pair.x<selectedPair.x||(pair.x==selectedPair.x&&pair.y<selectedPair.y);
  if(candidate.colliders.z==1u&&(candidate.point.w<nearest||(candidate.point.w==nearest&&precedes))){nearest=candidate.point.w;selected=slot;selectedPair=pair;}
 }
 if(selected!=0xffffffffu&&continuousStatus[0].z>=${t}u){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 if(selected!=0xffffffffu){continuousStatus[0].z++;}
 for(var body=0u;body<BODY_COUNT;body++){
  positions[body]=vec4f(positions[body].xyz+continuousVelocity(body)*nearest,positions[body].w);
  orientations[body]=continuousRotation(orientations[body],continuousAngular(body),nearest);
 }
 continuousWork.remaining-=nearest;
 if(selected==0xffffffffu){continuousWork.finished=1u;return;}
 let candidate=continuousWork.candidates[selected];let firstCollider=candidate.colliders.x;let secondCollider=candidate.colliders.y;
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);let normal=candidate.normal.xyz;let witness=continuousImpactPoint(firstCollider,secondCollider,candidate.point.xyz,normal,candidate.normal.w);
 if(witness.w==0.0){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 let point=witness.xyz;
 let closing=dot(pointVelocity(first,point)-pointVelocity(second,point),normal);
 let response=effectiveMass(first,second,point,normal);
 if(response<=1e-20||length(normal)<0.5){continuousStatus[0].x=1u;continuousWork.finished=1u;return;}
 let restitution=select(0.0,combineMaterial(bodies.colliders[firstCollider].material.x,bodies.colliders[secondCollider].material.x,bodies.colliders[firstCollider].policies.x,bodies.colliders[secondCollider].policies.x,false),-closing>settings.solver.z);
 var contact:Contact;contact.point=vec4f(point,0);contact.normal=vec4f(-normal,0);
 // Apply restitution once. Restoring its velocity target after friction can inject energy.
 contact.impulse.x=max(0.0,-closing)*(1.0+restitution)/response;
 let reboundImpulse=normal*contact.impulse.x;
 applyImpulse(first,point,reboundImpulse);applyImpulse(second,point,-reboundImpulse);
 for(var iteration=0u;iteration<16u;iteration++){
  let speed=dot(pointVelocity(first,point)-pointVelocity(second,point),normal);
  let normalIncrement=normal*(max(0.0,-speed)/response);
  contact.impulse.x+=length(normalIncrement);
  applyImpulse(first,point,normalIncrement);applyImpulse(second,point,-normalIncrement);
  let relative=pointVelocity(second,point)-pointVelocity(first,point);
  let tangent=solveFriction(firstCollider,secondCollider,contact,relative);
  var tangentIncrement=tangent-contact.tangent.xyz;
  // Minimize contact work along the candidate increment; never accept positive friction work.
  let slope=dot(relative,tangentIncrement);
  let curvature=dot(tangentIncrement,impulseResponse(first,second,point,tangentIncrement));
  if(slope>=0.0){tangentIncrement=vec3f(0);}else if(curvature>0.0){tangentIncrement*=min(1.0,-slope/curvature);}
  contact.tangent=vec4f(contact.tangent.xyz+tangentIncrement,0);
  applyImpulse(first,point,-tangentIncrement);applyImpulse(second,point,tangentIncrement);
  if(all(normalIncrement==vec3f(0))&&all(tangentIncrement==vec3f(0))){break;}
 }
 let residual=dot(pointVelocity(first,point)-pointVelocity(second,point),normal);
 if(residual<0.0){
  // This only increases the normal impulse, so the retained tangent stays inside its friction cone.
  let correction=normal*(-residual/response);
  applyImpulse(first,point,correction);applyImpulse(second,point,-correction);
 }
 if(dynamic(first)){sleepStates[first]=vec4f(0);}
 if(dynamic(second)){sleepStates[second]=vec4f(0);}
 continuousWork.lastPair=vec4u(firstCollider,secondCollider,0,0);continuousWork.lastNormal=vec4f(normal,0);
 continuousStatus[first].y++;continuousStatus[second].y++;
}
@compute @workgroup_size(64) fn checkConvexContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}
 if(body==0u&&continuousWork.finished==0u&&continuousWork.remaining>1e-9){continuousStatus[0].x=1u;}
 // CCD must not perturb unrelated discrete contacts, kinematic targets or torque-free integration.
 if(continuousStatus[body].y==0u||!dynamic(body)){
  positions[body]=continuousWork.finalPositions[body];orientations[body]=continuousWork.finalOrientations[body];
 }
}
`}function er(e,t,n,r,i,a,o,s,c=!1,l=0,u=r,d=!1,f=!1){if(l)return tr(e,t,d?n:n+Qn,r,i,a,o,s,l,u,f);let p=s(`continuous-previous`,r*16),m=s(`continuous-selection`,i),h=s(`continuous-status`,r*16),g=[{name:`continuousPrevious`,buffer:p,location:12},{name:`continuousSelection`,buffer:m,location:13},{name:`continuousStatus`,buffer:h,location:14}].map(n=>({...n,resource:e.importBuffer({id:`${t}-${n.name}`,byteLength:n.buffer.byteLength,usage:P.STORAGE},n.buffer)})),_=n+Zn+`
@group(0) @binding(12) var<storage,read_write> continuousPrevious:array<vec4f>;
@group(0) @binding(13) var<storage,read> continuousSelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> continuousStatus:array<vec4u>;
@compute @workgroup_size(64) fn saveContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}continuousPrevious[body]=positions[body];continuousStatus[body]=vec4u(0);
}
@compute @workgroup_size(64) fn resolveContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT||continuousSelection[body]==0u){return;}
 let movingCollider=continuousSelection[body]-1u;let radius=bodies.colliders[movingCollider].shape.x;
 let tolerance=max(1e-8,radius*1e-5);
 var position=continuousPrevious[body].xyz;var motion=positions[body].xyz-position;var velocity=velocities[body].xyz;var remaining=settings.gravity.w;
 for(var impact=0u;impact<=${a}u;impact++){
  let magnitude=length(motion);if(magnitude<=1e-8){positions[body]=vec4f(position,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  var nearest=magnitude;var hitCollider=0xffffffffu;var hitNormal=vec3f(0);
  for(var collider=0u;collider<COLLIDER_COUNT;collider++){
   if(bodies.bodies[colliderBody(collider)].motion.x!=0.0||bodies.colliders[collider].material.w!=0.0||excludes(movingCollider,collider)||excludes(collider,movingCollider)){continue;}
   // Initial penetration belongs to the discrete solver; still sweep other obstacles.
   let initialOrigin=colliderLocal(collider,continuousPrevious[body].xyz-colliderPosition(collider));
   let initialSurface=closestSurface(collider,initialOrigin);
   if(initialSurface.complete==0u){continuousStatus[body].x=1u;return;}
   if(initialSurface.distance<radius-tolerance){continue;}
   let origin=colliderLocal(collider,position-colliderPosition(collider));let direction=colliderLocal(collider,motion/magnitude);
   let result=sweepSphere(collider,origin,direction,magnitude,radius,true);
   if(result.complete==0u){continuousStatus[body].x=1u;return;}
   if(result.hit==0u){continue;}
   let normal=rotate(colliderRotation(collider),result.normal);
   // Touching and separating bodies must not repeatedly collide at time zero.
   if(result.distance<=tolerance&&dot(motion,normal)>=0.0&&length(normal)>0.5){continue;}
   if(length(normal)<0.5){continuousStatus[body].x=1u;return;}
   if(result.distance<=nearest){nearest=result.distance;hitCollider=collider;hitNormal=normal;}
  }
  if(hitCollider==0xffffffffu){positions[body]=vec4f(position+motion,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  if(impact==${a}u){continuousStatus[body].x=1u;return;}
  position+=motion*(nearest/magnitude)+hitNormal*tolerance;
  remaining*=max(0.0,1.0-nearest/magnitude);
  let closing=dot(velocity,hitNormal);
  let restitution=select(0.0,combineMaterial(bodies.colliders[movingCollider].material.x,bodies.colliders[hitCollider].material.x,bodies.colliders[movingCollider].policies.x,bodies.colliders[hitCollider].policies.x,false),-closing>settings.solver.z);
  if(closing<0.0){velocity-=hitNormal*closing*(1.0+restitution);}
  continuousStatus[body].y++;
  motion=velocity*remaining;
  if(remaining<=1e-8){positions[body]=vec4f(position,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
 }
 // The complete step is rejected by the transactional wrapper when the impact budget ends.
 continuousStatus[body].x=1u;
}
`,v=(n,i)=>{let a=[...o,...g].filter(e=>i.includes(e.name)),s={id:`${t}-${n}`,source:_,entryPoint:n,shaderLayout:{bindings:a.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:[`bodies`,`continuousSelection`].includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(a.map(e=>[e.name,e.buffer]))},c=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(r/64)})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:s.id,resources:a.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:[`bodies`,`continuousSelection`].includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>c(B(e.device,s)),compileAsync:async()=>c(await un(e.device,s))})};return v(`saveContinuous`,[`positions`,`continuousPrevious`,`continuousStatus`]),{status:{buffer:h,resource:g[2].resource},finish:()=>v(`resolveContinuous`,[`settings`,`positions`,`orientations`,`velocities`,`bodies`,`continuousPrevious`,`continuousSelection`,`continuousStatus`,...c?[`targets`]:[]])}}function tr(e,t,n,r,i,a,o,s,c,l,u){let d=2**Math.ceil(Math.log2(Math.max(1,l))),f=[{name:`continuousSelection`,buffer:s(`continuous-selection`,i),location:13},{name:`continuousStatus`,buffer:s(`continuous-status`,r*16),location:14},{name:`continuousWork`,buffer:s(`continuous-work`,64+d*32+r*64+c*48),location:15},{name:`continuousDispatch`,buffer:s(`continuous-dispatch`,16),location:16}].map(n=>({...n,resource:e.importBuffer({id:`${t}-${n.name}`,byteLength:n.buffer.byteLength,usage:P.STORAGE|(n.name===`continuousDispatch`?P.INDIRECT:0)},n.buffer)})),p=n+`
@group(0) @binding(13) var<storage,read> continuousSelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> continuousStatus:array<vec4u>;
`+$n(c,a,u,d),m=(n,i,s)=>{let c=[...o,...f].filter(e=>s.includes(e.name)),l={saveConvexContinuous:[`positions`,`orientations`,`continuousWork`,`continuousStatus`],prepareConvexContinuous:[`settings`,`positions`,`orientations`,`velocities`,`bodies`,`continuousWork`],boundContinuousQueue:[`positions`,`velocities`,`bodies`,`continuousWork`],resetContinuousQueue:[`continuousWork`,`continuousDispatch`],buildContinuousQueue:[`bodies`,`continuousSelection`,`continuousWork`,`continuousDispatch`],findContinuousImpacts:[`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`continuousWork`],resolveConvexContinuous:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`continuousWork`,`continuousStatus`],checkConvexContinuous:[`positions`,`orientations`,`bodies`,`continuousWork`,`continuousStatus`]},u=e=>{let n=c.filter(t=>(l[e]??[`continuousWork`]).includes(t.name));return{id:`${t}-${e}`,source:p,entryPoint:e,shaderLayout:{bindings:n.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:[`bodies`,`continuousSelection`].includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(n.map(e=>[e.name,e.buffer]))}},d=e=>({encode:({computePass:t})=>{if(n===`resolve`){e[0].kernel.dispatch(t,{bindings:e[0].bindings,x:Math.ceil(r/64)});for(let n=0;n<=a;n++)for(let n=1;n<e.length-1;n++)i[n].entryPoint===`findContinuousImpacts`?e[n].kernel.dispatchIndirect(t,{bindings:e[n].bindings,indirectBuffer:f[3].buffer,indirectOffset:0}):e[n].kernel.dispatch(t,{bindings:e[n].bindings,x:i[n].groups});e[e.length-1].kernel.dispatch(t,{bindings:e[e.length-1].bindings,x:Math.ceil(r/64)})}else e[0].kernel.dispatch(t,{bindings:e[0].bindings,x:Math.ceil(r/64)})},destroy:()=>e.forEach(e=>e.kernel.destroy())});e.addComputePass({id:`${t}-${n}-convex-continuous`,description:n===`save`?`Checkpoint convex CCD trajectories.`:`Rebuild bounded swept queues, find TOIs in parallel and resolve impacts with exclusive ownership.`,resources:[...n===`resolve`?[{buffer:f[3].resource,usage:`indirect`}]:[],...c.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:[`bodies`,`continuousSelection`].includes(e.name)?`storage-read`:`storage-read-write`}))],compile:()=>d(i.map(t=>B(e.device,u(t.entryPoint)))),compileAsync:async()=>d(await Promise.all(i.map(t=>un(e.device,u(t.entryPoint)))))})};return m(`save`,[{entryPoint:`saveConvexContinuous`,groups:Math.ceil(r/64)}],[`positions`,`orientations`,`continuousWork`,`continuousStatus`]),{status:{buffer:f[1].buffer,resource:f[1].resource},finish:()=>m(`resolve`,[{entryPoint:`prepareConvexContinuous`,groups:Math.ceil(r/64)},{entryPoint:`boundContinuousQueue`,groups:Math.ceil(d/64)},{entryPoint:`resetContinuousQueue`,groups:1},...Array.from({length:Math.log2(d)},(e,t)=>Array.from({length:t+1},(e,n)=>({entryPoint:`sortContinuous${2**(t+1)}_${2**(t-n)}`,groups:Math.ceil(d/64)}))).flat(),{entryPoint:`buildContinuousQueue`,groups:Math.ceil(l/64)},{entryPoint:`findContinuousImpacts`,groups:Math.ceil(c/64)},{entryPoint:`resolveConvexContinuous`,groups:1},{entryPoint:`checkConvexContinuous`,groups:1}],[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`bodies`,`continuousWork`,`continuousSelection`,`continuousStatus`,`continuousDispatch`])}}var nr=64,rr=29;function ir(e,t){let n=Math.max(1,Math.ceil(t.rowCount/nr)),r=t.source+ar(t,n);function i(n,i,a,o){let s=[...new Map(a.map(e=>[e.name,e])).values()],c=s.map(({name:e,location:t,readOnly:n})=>({name:e,location:t,group:0,type:n?`read-only-storage`:`storage`})),l={id:`${t.id}-${n}`,entryPoint:n,source:r,shaderLayout:{bindings:c}},u=e=>({encode:({computePass:t,getBuffer:n})=>{for(let t of s)e.bindings[t.name]=n(t.resource);e.kernel.dispatch(t,{bindings:e.bindings,x:o})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:l.id,description:i,resources:s.map(e=>({buffer:e.resource,usage:e.readOnly?`storage-read`:`storage-read-write`})),compile:()=>u(B(e.device,l)),compileAsync:async()=>u(await un(e.device,l))})}if(n===1){i(`publishEventTile`,`Publish ordered events in one workgroup.`,[...t.classify,...t.commit,...t.publish],1);return}let a={name:`eventWork`,location:rr,resource:e.createTransientBuffer({id:`${t.id}-compaction`,usage:P.STORAGE,byteLength:(4+t.rowCount+n)*4})};i(`classifyEventTiles`,`Classify transitions and compact one tile per workgroup.`,[...t.classify,a],n),i(`reserveEventTiles`,`Reserve ordered ring positions from tile counts.`,[...t.commit,a],1),i(`publishEventTiles`,`Write retained event records and advance transition history.`,[...t.publish,a],n)}function ar({ring:e,capacity:t,rowCount:n},r){return`
const EVENT_ROWS:u32=${n}u;
const EVENT_CAPACITY:u32=${t}u;
const EVENT_TILE_SIZE:u32=${nr}u;
var<workgroup> eventPrefix:array<u32,${nr}>;

// Each row emits at most two records, in the order chosen by its publisher.
fn scanEvents(lane:u32,count:u32)->u32{
 eventPrefix[lane]=count;
 workgroupBarrier();
 for(var stride=1u;stride<EVENT_TILE_SIZE;stride*=2u){
  var prior=0u;
  if(lane>=stride){prior=eventPrefix[lane-stride];}
  workgroupBarrier();
  eventPrefix[lane]+=prior;
  workgroupBarrier();
 }
 return eventPrefix[lane]-count;
}

// Reserve from the old sequence but keep only the newest records that fit the ring.
// x = base sequence, y = accepted count, z = step (zero for an uncommitted tick).
fn reserveEvents(total:u32)->vec3u{
 if(!eventCommit()){return vec3u(0);}
 if(${e}.step==0xffffffffu){${e}.saturated=1u;return vec3u(0);}
 let base=${e}.sequence;
 let accepted=min(total,0xffffffffu-base);
 if(accepted<total){${e}.saturated=1u;}
 ${e}.sequence=base+accepted;
 ${e}.step++;
 return vec3u(base,accepted,${e}.step);
}

fn retainedEventSequence(reservation:vec3u,offset:u32)->u32{
 if(offset>=reservation.y||reservation.y-offset>EVENT_CAPACITY){return 0u;}
 return reservation.x+offset+1u;
}

${r===1?`
var<workgroup> eventReservation:vec3u;
@compute @workgroup_size(${nr}) fn publishEventTile(
 @builtin(local_invocation_index) lane:u32
){
 var flags=0u;
 if(lane<EVENT_ROWS){flags=eventClassify(lane);}
 let offset=scanEvents(lane,eventCount(flags));
 if(lane==0u){eventReservation=reserveEvents(eventPrefix[EVENT_TILE_SIZE-1u]);}
 workgroupBarrier();
 if(lane<EVENT_ROWS&&eventReservation.z!=0u){eventPublish(lane,flags,offset,eventReservation);}
}
`:`
@group(0) @binding(${rr}) var<storage,read_write> eventWork:array<u32>;
const EVENT_TILES:u32=${r}u;

@compute @workgroup_size(${nr}) fn classifyEventTiles(
 @builtin(global_invocation_id) invocation:vec3u,
 @builtin(local_invocation_index) lane:u32,
 @builtin(workgroup_id) tile:vec3u
){
 let row=invocation.x;
 var flags=0u;
 if(row<EVENT_ROWS){flags=eventClassify(row);}
 let offset=scanEvents(lane,eventCount(flags));
 // A 64-lane tile uses at most 128 records. Keep flags above the local offset.
 if(row<EVENT_ROWS){eventWork[4u+row]=offset|(flags<<8u);}
 if(lane==0u){eventWork[4u+EVENT_ROWS+tile.x]=eventPrefix[EVENT_TILE_SIZE-1u];}
}

@compute @workgroup_size(1) fn reserveEventTiles(){
 var total=0u;
 for(var tile=0u;tile<EVENT_TILES;tile++){
  let index=4u+EVENT_ROWS+tile;
  let count=eventWork[index];
  eventWork[index]=total;
  total+=count;
 }
 let reservation=reserveEvents(total);
 eventWork[0]=reservation.x;eventWork[1]=reservation.y;eventWork[2]=reservation.z;
}

@compute @workgroup_size(${nr}) fn publishEventTiles(
 @builtin(global_invocation_id) invocation:vec3u,
 @builtin(workgroup_id) tile:vec3u
){
 let row=invocation.x;
 let reservation=vec3u(eventWork[0],eventWork[1],eventWork[2]);
 if(row>=EVENT_ROWS||reservation.z==0u){return;}
 let word=eventWork[4u+row];
 let offset=eventWork[4u+EVENT_ROWS+tile.x]+(word&255u);
 eventPublish(row,word>>8u,offset,reservation);
}
`}
`}function or(e,t){let n=[],r=[];for(let[i,a]of e.entries()){let e=[...new Set(a.colliders)];if(!e.length||e.some(e=>!Number.isInteger(e)||!t[e]?.isTrigger||a.swept&&t[e].shape.type!==`sphere`))throw Error(`Invalid sensor colliders or swept trigger shapes`);let o=[...new Set(a.targets??t.flatMap((e,t)=>e.isTrigger?[]:[t]))];if(o.some(e=>!Number.isInteger(e)||!t[e]||a.swept&&t[e].shape.type!==`sphere`))throw Error(`Invalid trigger targets`);let s=new Set((a.excludedPairs??[]).map(([t,n])=>{if(!e.includes(t)||!o.includes(n))throw Error(`Invalid excluded trigger pair`);return`${t}:${n}`})),c=a.perCollider?o.map(e=>[e]):[...new Set(o.map(e=>t[e].body))].map(e=>o.filter(n=>t[n].body===e));for(let o of c){let c=t[o[0]].body,l=r.length/2;for(let n of e)for(let e of o)t[e].body===c&&t[n].body!==c&&!s.has(`${n}:${e}`)&&r.push(n,e);let u=r.length/2-l;u&&n.push(i,c,l,u|(a.swept?2147483648:0))}}if(n.length/4>65536||r.length/2>65536)throw Error(`Trigger pair capacity exceeded`);return{groups:new Uint32Array(n.length?n:[0,0,0,0]),pairs:new Uint32Array(r.length?r:[0,0]),count:n.length/4}}function sr(e,t=0){let n=(e.length-4)/8,r=e[0],i=[];for(let a=Math.max(t,r-n);a<r;a++){let t=4+a%n*8;i.push({sequence:e[t],step:e[t+1],phase:e[t+2]===0?`enter`:`exit`,swept:e[t+3]!==0,trigger:e[t+4],body:e[t+5],triggerCollider:e[t+6],collider:e[t+7]})}return{sequence:r,step:e[1],dropped:Math.max(0,r-t-n),saturated:e[2]!==0,events:i}}function cr(e,t,n,r,i,a,o,s,c,l=!1,u=!1){let d=[{name:`triggerPrevious`,key:`trigger-previous`,data:r*16},{name:`triggerGroups`,key:`trigger-groups`,data:i.groups},{name:`triggerPairs`,key:`trigger-pairs`,data:i.pairs},{name:`triggerSamples`,key:`trigger-samples`,data:Math.max(1,i.count)*16},{name:`triggerHistory`,key:`trigger-history`,data:Math.max(1,i.count)*16},{name:`triggerEvents`,key:`trigger-events`,data:16+a*32}].map((n,r)=>{let i=c(n.key,n.data);return{name:n.name,buffer:i,location:12+r,resource:e.importBuffer({id:`${t}-${n.key}`,byteLength:i.byteLength,usage:P.STORAGE},i)}}),f=n+Zn+`
@group(0) @binding(12) var<storage,read_write> triggerPrevious:array<vec4f>;
@group(0) @binding(13) var<storage,read> triggerGroups:array<vec4u>;
@group(0) @binding(14) var<storage,read> triggerPairs:array<vec2u>;
@group(0) @binding(15) var<storage,read_write> triggerSamples:array<vec4u>;
@group(0) @binding(16) var<storage,read_write> triggerHistory:array<vec4u>;
struct TriggerRecord {stamp:vec4u,identifiers:vec4u}
struct TriggerRing {sequence:u32,step:u32,saturated:u32,reserved:u32,entries:array<TriggerRecord,${a}>}
@group(0) @binding(17) var<storage,read_write> triggerEvents:TriggerRing;
@group(0) @binding(18) var<storage,read> triggerStatistics:array<u32>;
@compute @workgroup_size(64) fn saveTriggers(@builtin(global_invocation_id) invocation:vec3u){let collider=invocation.x;if(collider<COLLIDER_COUNT){triggerPrevious[collider]=vec4f(colliderPosition(collider),0);}}
@compute @workgroup_size(64) fn sampleTriggers(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=${i.count}u){return;}let group=triggerGroups[index];var overlapping=false;var crossed=false;var incomplete=false;var selected=vec2u(0);
 for(var offset=0u;offset<(group.w&0x7fffffffu);offset++){
  let pair=triggerPairs[group.z+offset];if(excludes(pair.x,pair.y)||excludes(pair.y,pair.x)){continue;}
  let radius=bodies.colliders[pair.x].shape.x;
  // Sphere-vs-surface distance is symmetric: avoid GJK/EPA degeneracy when the sphere is the target.
  if(bodies.colliders[pair.x].shape.w==0.0||bodies.colliders[pair.y].shape.w==0.0){
  let sphere=select(pair.y,pair.x,bodies.colliders[pair.x].shape.w==0.0);
  let surfaceCollider=select(pair.x,pair.y,sphere==pair.x);
  let center=colliderLocal(surfaceCollider,colliderPosition(sphere)-colliderPosition(surfaceCollider));
  let targetShape=bodies.colliders[surfaceCollider].shape;if(targetShape.w==6.0&&targetShape.z==0.0&&center.y<0.0){continue;}
  let surface=closestSurface(surfaceCollider,center);
  incomplete=incomplete||surface.complete==0u;
  if(surface.distance<=bodies.colliders[sphere].shape.x){overlapping=true;selected=pair;}
  }${u?`else {
    let firstMesh=bodies.colliders[pair.x].shape.w==3.0;let secondMesh=bodies.colliders[pair.y].shape.w==3.0;
    let firstCount=select(1u,u32(bodies.colliders[pair.x].padding.w),firstMesh);
    let secondCount=select(1u,u32(bodies.colliders[pair.y].padding.w),secondMesh);
    var tested=0u;var found=false;
    for(var firstTriangle=0u;firstTriangle<firstCount&&!found;firstTriangle++){
      for(var secondTriangle=0u;secondTriangle<secondCount;secondTriangle++){
        if(tested>=MESH_TRAVERSAL_BUDGET){incomplete=true;break;}tested++;
        if((firstMesh&&!meshTriangleActive(pair.x,firstTriangle))||(secondMesh&&!meshTriangleActive(pair.y,secondTriangle))){continue;}
        if(!permitsPlaneContact(pair.x,pair.y)||!permitsPlaneContact(pair.y,pair.x)){continue;}
        let hit=convexContact(pair.x,pair.y,select(-1,i32(firstTriangle),firstMesh),select(-1,i32(secondTriangle),secondMesh));
        incomplete=incomplete||hit.status==2u;
        if(hit.status==1u&&hit.depth>=0.0){overlapping=true;selected=pair;found=true;break;}
      }
      if(tested>=MESH_TRAVERSAL_BUDGET){break;}
    }
  }`:``}
  if((group.w&0x80000000u)!=0u){
   let start=triggerPrevious[pair.y].xyz-triggerPrevious[pair.x].xyz;
   let finish=colliderPosition(pair.y)-colliderPosition(pair.x);
   let distance=length(closestSegment(vec3f(0),start,finish));
   if(distance<=radius+bodies.colliders[pair.y].shape.x){crossed=true;if(!overlapping){selected=pair;}}
  }
 }
 triggerSamples[index]=vec4u(select(0u,1u,overlapping)|select(0u,2u,crossed)|select(0u,4u,incomplete),selected,0u);
}
`,p=f+`
const TRIGGER_ENTER:u32=1u;
const TRIGGER_EXIT:u32=2u;
const TRIGGER_SWEPT:u32=4u;
fn eventCommit()->bool{return triggerStatistics[1]==0u&&triggerStatistics[15]==0u;}
fn eventClassify(index:u32)->u32{
 let sample=triggerSamples[index];let previous=triggerHistory[index];
 let overlapping=(sample.x&1u)!=0u;let prior=(previous.x&1u)!=0u;
 if(overlapping&&!prior){return TRIGGER_ENTER;}
 if(!overlapping&&prior){return TRIGGER_EXIT;}
 if(!overlapping&&!prior&&(sample.x&2u)!=0u){return TRIGGER_ENTER|TRIGGER_EXIT|TRIGGER_SWEPT;}
 return 0u;
}
fn eventCount(flags:u32)->u32{return countOneBits(flags&3u);}
fn emitTrigger(sequence:u32,step:u32,group:vec4u,pair:vec2u,phase:u32,swept:u32){
 let slot=(sequence-1u)%${a}u;
 triggerEvents.entries[slot]=TriggerRecord(vec4u(sequence,step,phase,swept),vec4u(group.x,group.y,pair));
}
fn eventPublish(index:u32,flags:u32,offset:u32,reservation:vec3u){
 let sample=triggerSamples[index];
 let swept=select(0u,1u,(flags&TRIGGER_SWEPT)!=0u);
 if((flags&TRIGGER_ENTER)!=0u){
  let sequence=retainedEventSequence(reservation,offset);
  if(sequence!=0u){emitTrigger(sequence,reservation.z,triggerGroups[index],sample.yz,0u,swept);}
 }
 if((flags&TRIGGER_EXIT)!=0u){
  let sequence=retainedEventSequence(reservation,offset+swept);
  if(sequence!=0u){
   let pair=select(triggerHistory[index].yz,sample.yz,swept!=0u);
   emitTrigger(sequence,reservation.z,triggerGroups[index],pair,1u,swept);
  }
 }
 triggerHistory[index]=sample;
}
`,m=(n,r,i)=>{let a=[...o,...d,s].filter(e=>r.includes(e.name)),c=[`bodies`,`triggerGroups`,`triggerPairs`,`triggerStatistics`],l={id:`${t}-${n}`,source:f,entryPoint:n,shaderLayout:{bindings:a.map(e=>{let t={name:e.name,location:e.location,group:0};return e.name===`settings`?{...t,type:`uniform`}:{...t,type:c.includes(e.name)?`read-only-storage`:`storage`}})},bindings:Object.fromEntries(a.map(e=>[e.name,e.buffer]))},u=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.max(1,Math.ceil(i/64))})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:l.id,resources:a.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:c.includes(e.name)?`storage-read`:`storage-read-write`})),compile:()=>u(B(e.device,l)),compileAsync:async()=>u(await un(e.device,l))})};return m(`saveTriggers`,[`positions`,`orientations`,`bodies`,`triggerPrevious`],r),{events:d[5].buffer,history:d[4].buffer,samples:{buffer:d[3].buffer,resource:d[3].resource,count:i.count},sample:()=>m(`sampleTriggers`,[...u?[`settings`]:[],`positions`,`orientations`,`bodies`,`triggerPrevious`,`triggerGroups`,`triggerPairs`,`triggerSamples`,...l?[`targets`]:[]],i.count),publish:()=>{let n=[...d,s].map(({name:e,resource:t,location:n})=>({name:e,resource:t,location:n,readOnly:e===`triggerGroups`||e===`triggerStatistics`}));ir(e,{id:`${t}-trigger-events`,rowCount:i.count,capacity:a,ring:`triggerEvents`,source:p,classify:n.filter(e=>[`triggerSamples`,`triggerHistory`].includes(e.name)),commit:n.filter(e=>[`triggerEvents`,`triggerStatistics`].includes(e.name)),publish:n.filter(e=>[`triggerGroups`,`triggerSamples`,`triggerHistory`,`triggerEvents`].includes(e.name))})}}}function lr(e,t,n,r,i,a,o,s,c,l,u){let d=n[0].buffer.byteLength/16,f=d/o,p=n[5],{headOffset:m,linkOffset:h,journalOffset:g,savedKeyOffset:_,savedLinkOffset:v,savedHeadOffset:y,savedHeaderOffset:b,savedManifoldOffset:x,failureOffset:S}=Wn(d,f,s,!!u),C=(t,n)=>{let r=c(t,n);return{buffer:r,resource:e.importBuffer({id:r.id,byteLength:n,usage:P.STORAGE|P.COPY_DST},r)}},w=n.slice(0,5).map((e,t)=>C(`checkpoint-${t}`,e.buffer.byteLength)),ee=l&&C(`checkpoint-vehicles`,f*l.vehiclesPerInstance*512),T=C(`state-validity`,d*4),E=(n,r,a,o=!1)=>{let s={id:`${t}-${n}`,entryPoint:`main`,source:`${r.map((e,t)=>`@group(0) @binding(${t}) var<storage,${e.writable?`read_write`:`read`}> ${e.name}:array<${e.atomic?`atomic<u32>`:`u32`}>;`).join(`
`)}\n${a}`,shaderLayout:{bindings:r.map((e,t)=>({name:e.name,group:0,location:t,type:e.writable?`storage`:`read-only-storage`}))},bindings:Object.fromEntries(r.map(e=>[e.name,e.buffer]))},c=e=>({encode:({computePass:t})=>{o?e.kernel.dispatchIndirect(t,{bindings:e.bindings,indirectBuffer:i.buffer,indirectOffset:16}):e.kernel.dispatch(t,{bindings:e.bindings,x:1})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:s.id,workload:{commandCount:1},resources:[...r.map(e=>({buffer:e.resource,usage:e.writable?`storage-read-write`:`storage-read`})),...o?[{buffer:i.resource,usage:`indirect`}]:[]],compile:()=>c(B(e.device,s)),compileAsync:async()=>c(await un(e.device,s))})},D=`statistics[1]!=0u||statistics[15]!=0u`,te=u?`${D}||targets[${S+f}u]!=0u`:D,O=e=>`targets[${S}u+${e}]!=0u`,k=u?[{...p,name:`targets`}]:[],A=`let work=invocation.x;if(work>=ensemble[0]*${o}u){return;}
 let body=ensemble[${16+f*8}u+work/${o}u]*${o}u+work%${o}u;`,j=e=>{if(!l||!ee)return;let t=l.vehiclesPerInstance;E(e?`rollback-vehicles`:`checkpoint-vehicles`,[{...l.state,name:`vehicle`,writable:e},{...ee,name:`snapshot`,writable:!e},{...i,name:`ensemble`},...e?[{...r,name:`statistics`},...k]:[]],`@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${e?`if(!(${te})){return;}`:``}
 let work=invocation.x;if(work>=ensemble[0]*${t}u){return;}
 let instance=ensemble[${16+f*8}u+work/${t}u];
 ${e&&u?`if(!(${D})&&!(${O(`instance`)})){return;}`:``}
 let row=(instance*${t}u+work%${t}u)*${512/4}u;
 for(var word=0u;word<${512/4}u;word++){
  ${e?`vehicle[row+word]=snapshot[row+word];`:`snapshot[row+word]=vehicle[row+word];`}
 }
}`,!0)};return{save:()=>{E(`checkpoint-metadata`,[{...p,name:`targets`,writable:!0},{...i,name:`ensemble`},{...T,name:`validity`,writable:!0}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(invocation.x==0u){validity[0]=0u;}
 if(invocation.x<8u){targets[${b}u+invocation.x]=targets[${d*8}u+invocation.x];}
 for(var work=invocation.x;work<ensemble[0];work+=64u){
  let instance=ensemble[${16+f*8}u+work];
  targets[${y}u+instance]=targets[${m}u+instance];
  targets[${y+f}u+instance]=targets[${m+f}u+instance];
 }
}`),j(!1),n.slice(0,5).forEach((e,t)=>E(`checkpoint-${t}`,[{...e,name:`state`},{...w[t],name:`snapshot`,writable:!0},{...i,name:`ensemble`}],`@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${A}
 for(var word=0u;word<4u;word++){snapshot[body*4u+word]=state[body*4u+word];}
}`,!0))},restore:()=>{E(`rollback-contacts`,[{...a,name:`manifolds`,writable:!0},{...p,name:`targets`},{...r,name:`statistics`}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(!(${te})){return;}
 let count=targets[${d*8+5}u];
 for(var work=invocation.x;work<count*104u;work+=64u){
  let pair=targets[${g}u+work/104u];let word=work%104u;
  ${u?`if(!(${D})&&!(${O(`pair/${u}u`)})){continue;}`:``}
  manifolds[pair*104u+word]=targets[${x}u+pair*104u+word];
 }
}`),E(`rollback-allocator`,[{...p,name:`targets`,writable:!0},{...i,name:`ensemble`},{...r,name:`statistics`}],`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(!(${te})){return;}
 let count=targets[${d*8+5}u];
 for(var index=invocation.x;index<count;index+=64u){let pair=targets[${g}u+index];
  ${u?`if(!(${D})&&!(${O(`pair/${u}u`)})){continue;}`:``}
  targets[${d*8+8}u+pair*2u]=targets[${_}u+pair*2u];
  targets[${d*8+9}u+pair*2u]=targets[${_+1}u+pair*2u];
  targets[${h}u+pair]=targets[${v}u+pair];
 }
 for(var work=invocation.x;work<ensemble[0];work+=64u){let instance=ensemble[${16+f*8}u+work];
  ${u?`if(!(${D})&&!(${O(`instance`)})){continue;}`:``}
  targets[${m}u+instance]=targets[${y}u+instance];
  targets[${m+f}u+instance]=targets[${y+f}u+instance];
 }
 // Preserve the attempted step's journal list and counters so the next prepare can clear its marks.
 if((${D})&&invocation.x<5u){targets[${d*8}u+invocation.x]=targets[${b}u+invocation.x];}
}`),j(!0),n.slice(0,5).forEach((e,t)=>E(`rollback-${t}`,[{...e,name:`state`,writable:!0},{...w[t],name:`snapshot`},{...r,name:`statistics`},{...i,name:`ensemble`},...k],`@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(!(${te})){return;}
 ${A}
 ${u?`if(!(${D})&&!(${O(`body/${o}u`)})){return;}`:``}
 for(var word=0u;word<4u;word++){state[body*4u+word]=snapshot[body*4u+word];}
}`,!0))},validate:()=>E(`validate`,[...n.slice(0,4).map((e,t)=>({...e,name:[`positions`,`orientations`,`velocities`,`angularVelocities`][t]})),{...T,name:`validity`,writable:!0,atomic:!0},{...i,name:`ensemble`}],`
fn finite(value:u32)->bool{return abs(bitcast<f32>(value))<=3.402823466e38;}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${A}
 var valid=true;
 for(var word=0u;word<4u;word++){let address=body*4u+word;valid=valid&&finite(positions[address])&&finite(orientations[address])&&finite(velocities[address])&&finite(angularVelocities[address]);}
 if(!valid){atomicAdd(&validity[0],1u);}
}`,!0),validity:{...T,count:1}}}function ur(e,t,n,r,i){let a=n.map((n,r)=>{let a=i(`checkpoint-${r}`,n.buffer.byteLength);return{...n,snapshot:a,snapshotResource:e.importBuffer({id:`${t}-checkpoint-${r}`,byteLength:a.byteLength,usage:P.STORAGE|P.COPY_DST},a)}});e.addCopyPass({id:`${t}-checkpoint`,description:`Save simulation state so an incomplete step can be rolled back.`,resources:a.flatMap(e=>[{buffer:e.resource,usage:`copy-source`},{buffer:e.snapshotResource,usage:`copy-destination`}]),compile:()=>({encode:({commandEncoder:e,getBuffer:t})=>{for(let n of a)e.copyBufferToBuffer({sourceBuffer:t(n.resource),destinationBuffer:t(n.snapshotResource),size:n.buffer.byteLength})}})});let o=()=>{let n=a.map((n,i)=>{let a=Math.ceil(n.buffer.byteLength/256),o=Math.min(a,e.device.limits.maxComputeWorkgroupsPerDimension);return{id:`${t}-restore-${i}`,entryPoint:`restore`,source:`
@group(0) @binding(0) var<storage,read_write> state:array<u32>;
@group(0) @binding(1) var<storage,read> snapshot:array<u32>;
@group(0) @binding(2) var<storage,read> statistics:array<u32>;
@compute @workgroup_size(64) fn restore(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let index=invocation.x+invocation.y*${o*64}u;
 if(index<arrayLength(&state)){state[index]=snapshot[index];}
}`,shaderLayout:{bindings:[{name:`state`,group:0,location:0,type:`storage`},{name:`snapshot`,group:0,location:1,type:`read-only-storage`},{name:`statistics`,group:0,location:2,type:`read-only-storage`}]},bindings:{state:n.buffer,snapshot:n.snapshot,statistics:r.buffer},horizontal:o,vertical:Math.ceil(a/o)}}),i=e=>({encode:({computePass:t})=>{for(let[r,i]of e.entries())i.kernel.dispatch(t,{bindings:i.bindings,x:n[r].horizontal,y:n[r].vertical})},destroy:()=>{for(let t of e)t.kernel.destroy()}});e.addComputePass({id:`${t}-rollback`,description:`Restore saved simulation state when diagnostics reject the step.`,resources:[{buffer:r.resource,usage:`storage-read`},...a.flatMap(e=>[{buffer:e.resource,usage:`storage-read-write`},{buffer:e.snapshotResource,usage:`storage-read`}])],compile:()=>i(n.map(t=>B(e.device,t))),compileAsync:async()=>i(await Promise.all(n.map(t=>un(e.device,t))))})},s=i(`state-validity`,n[0].buffer.byteLength/4),c=e.importBuffer({id:`${t}-state-validity`,byteLength:s.byteLength,usage:P.STORAGE},s);return{save:void 0,restore:o,validate:()=>{let r=[`positions`,`orientations`,`velocities`,`angularVelocities`],i={id:`${t}-validate`,source:`
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> velocities:array<vec4f>;
@group(0) @binding(3) var<storage,read> angularVelocities:array<vec4f>;
@group(0) @binding(4) var<storage,read_write> validity:array<u32>;
fn finite(value:vec4f)->bool{return all(abs(value)<=vec4f(3.402823466e38));}
@compute @workgroup_size(64) fn validate(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=arrayLength(&positions)){return;}
 validity[body]=select(1u,0u,finite(positions[body])&&finite(orientations[body])&&finite(velocities[body])&&finite(angularVelocities[body]));
}`,entryPoint:`validate`,shaderLayout:{bindings:[...r.map((e,t)=>({name:e,group:0,location:t,type:`read-only-storage`})),{name:`validity`,group:0,location:4,type:`storage`}]},bindings:{...Object.fromEntries(r.map((e,t)=>[e,n[t].buffer])),validity:s}},a=e=>({encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(n[0].buffer.byteLength/1024)})},destroy:()=>e.kernel.destroy()});e.addComputePass({id:i.id,description:`Validate body state before publishing the completed simulation step.`,resources:[...n.slice(0,4).map(e=>({buffer:e.resource,usage:`storage-read`})),{buffer:c,usage:`storage-read-write`}],compile:()=>a(B(e.device,i)),compileAsync:async()=>a(await un(e.device,i))})},validity:{buffer:s,resource:c,count:n[0].buffer.byteLength/16}}}function dr(e,t,n,r,i,a,o){let s=new Float32Array(n.length*12);for(let[e,t]of n.entries())s.set([...t.centerOfMass??[0,0,0],0,...r[e][0],0,...r[e][1],0],e*12);let c=o(`pose-metadata`,s),l=new Float32Array(n.length*16);for(let[e,t]of n.entries())l.set(new m().translate(t.position).multiplyRight(new m().fromQuaternion(V(t.orientation))),e*16);let u=o(`pose-matrices`,l),d=o(`pose-bounds`,n.length*32),f=(n,r)=>({buffer:r,resource:e.importBuffer({id:`${t}-${n}`,byteLength:r.byteLength,usage:P.STORAGE},r)}),p={positions:i,orientations:a,metadata:f(`pose-metadata`,c),matrices:f(`pose-matrices`,u),worldBounds:f(`pose-bounds`,d)},h={id:`${t}-publish-poses`,source:`
struct Bounds {minimum:vec4f,maximum:vec4f}
struct Metadata {center:vec4f,minimum:vec4f,maximum:vec4f}
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> metadata:array<Metadata>;
@group(0) @binding(3) var<storage,read_write> matrices:array<mat4x4f>;
@group(0) @binding(4) var<storage,read_write> worldBounds:array<Bounds>;
fn rotate(rotation:vec4f,point:vec3f)->vec3f{return point+2.0*cross(rotation.xyz,cross(rotation.xyz,point)+rotation.w*point);}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=${n.length}u){return;}
 let rotation=orientations[body];let origin=positions[body].xyz-rotate(rotation,metadata[body].center.xyz);
 let horizontal=rotate(rotation,vec3f(1,0,0));let vertical=rotate(rotation,vec3f(0,1,0));let depth=rotate(rotation,vec3f(0,0,1));
 matrices[body]=mat4x4f(vec4f(horizontal,0),vec4f(vertical,0),vec4f(depth,0),vec4f(origin,1));
 let center=(metadata[body].minimum.xyz+metadata[body].maximum.xyz)*0.5;let extent=(metadata[body].maximum.xyz-metadata[body].minimum.xyz)*0.5;
 let worldCenter=origin+rotate(rotation,center);let worldExtent=abs(horizontal)*extent.x+abs(vertical)*extent.y+abs(depth)*extent.z;
 worldBounds[body]=Bounds(vec4f(worldCenter-worldExtent,0),vec4f(worldCenter+worldExtent,0));
}`,shaderLayout:{bindings:Object.keys(p).map((e,t)=>({name:e,group:0,location:t,type:t<3?`read-only-storage`:`storage`}))},bindings:Object.fromEntries(Object.entries(p).map(([e,t])=>[e,t.buffer]))},g,_=e=>(g=e,{encode:({computePass:t})=>{e.kernel.dispatch(t,{bindings:e.bindings,x:Math.ceil(n.length/64)})},destroy:()=>e.kernel.destroy()});return e.addComputePass({id:h.id,resources:Object.values(p).map((e,t)=>({buffer:e.resource,usage:t<3?`storage-read`:`storage-write`})),compile:()=>_(B(e.device,h)),compileAsync:async()=>_(await un(e.device,h))}),{matrices:u,bounds:d,encode:e=>{let t=e.beginComputePass();g.kernel.dispatch(t,{bindings:g.bindings,x:Math.ceil(n.length/64)}),t.end()}}}var fr=`
fn heightFieldSample(base:u32,index:u32)->f32{return readGeometry(base+2u+index/4u)[index%4u];}
fn heightFieldCell(width:u32,triangle:u32)->vec2u{
 let cell=triangle/2u;
 return vec2u(cell%(width-1u),cell/(width-1u));
}
fn heightFieldCorners(flags:u32,triangle:u32)->vec3u{
 let second=(triangle&1u)!=0u;
 var corners=select(vec3u(0,1,3),vec3u(0,3,2),second);
 if((flags&1u)!=0u){corners=select(vec3u(0,1,2),vec3u(1,3,2),second);}
 if((flags&2u)!=0u){corners=corners.xzy;}
 return corners;
}
fn heightFieldTriangleIndices(base:u32,triangle:u32)->vec3u{
 let header=readGeometry(base+1u);
 let width=u32(header.z);
 let cell=heightFieldCell(width,triangle);
 let corners=heightFieldCorners(u32(header.w),triangle);
 return vec3u(cell.y*width+cell.x)+(corners/2u)*width+(corners%2u);
}
fn heightFieldTriangleVertex(collider:u32,triangle:u32,corner:u32)->vec3f{
 let base=u32(bodies.colliders[collider].padding.x);
 let steps=readGeometry(base);let header=readGeometry(base+1u);let width=u32(header.z);
 let index=heightFieldTriangleIndices(base,triangle)[corner];
 let position=header.xy+f32(index%width)*steps.xy+f32(index/width)*steps.zw;
 return vec3f(position,heightFieldSample(base,index));
}
fn heightFieldTriangleActive(collider:u32,triangle:u32)->bool{
 let base=u32(bodies.colliders[collider].padding.x);
 let indices=heightFieldTriangleIndices(base,triangle);
 return heightFieldSample(base,indices.x)!=3.402823e38 &&
        heightFieldSample(base,indices.y)!=3.402823e38 &&
        heightFieldSample(base,indices.z)!=3.402823e38;
}
fn heightFieldTriangleData(collider:u32,triangle:u32)->u32{
 let base=u32(bodies.colliders[collider].padding.x);
 let header=readGeometry(base+1u);
 let width=u32(header.z);let flags=u32(header.w);
 let cell=heightFieldCell(width,triangle);let start=cell.y*width+cell.x;
 let first=heightFieldSample(base,start);let second=heightFieldSample(base,start+1u);
 let third=heightFieldSample(base,start+width);let fourth=heightFieldSample(base,start+width+1u);
 if(any(vec4f(first,second,third,fourth)==vec4f(3.402823e38))){return (triangle+1u)*8u;}
 // Remove the quad diagonal only when it joins coplanar triangles.
 if((first-second)+(fourth-third)!=0.0){return (triangle+1u)*8u;}
 let odd=(triangle&1u)!=0u;
 var edge=select(2u,0u,odd);
 if((flags&1u)!=0u){edge=select(1u,2u,odd);}
 if((flags&2u)!=0u){edge=2u-edge;}
 return ((triangle & 0xfffffffeu)+1u)*8u+(1u<<edge);
}
`;function pr(e){return`
${e?fr:``}
fn meshTriangleActive(collider:u32,triangle:u32)->bool{
 ${e?`if(bodies.colliders[collider].padding.y<0.0){return heightFieldTriangleActive(collider,triangle);}`:``}
 return true;
}
fn meshTriangleData(collider:u32,triangle:u32)->u32{
 ${e?`if(bodies.colliders[collider].padding.y<0.0){return heightFieldTriangleData(collider,triangle);}`:``}
 return u32(readGeometry(u32(bodies.colliders[collider].padding.z)+triangle).w);
}
fn triangleVertex(collider:u32, triangle:u32, corner:u32)->vec3f {
 ${e?`if(bodies.colliders[collider].padding.y<0.0){return heightFieldTriangleVertex(collider,triangle,corner);}`:``}
 let indices=readGeometry(u32(bodies.colliders[collider].padding.z)+triangle);
 return readGeometry(u32(bodies.colliders[collider].padding.x)+u32(indices[corner])).xyz;
}
// Use the smaller local contact feature, not an elongated world AABB or an
// entire nonconvex mesh. A plane contributes no finite scale of its own.
fn contactFeatureScale(collider:u32,triangle:i32)->f32 {
 if(triangle>=0){
  let first=triangleVertex(collider,u32(triangle),0u);let second=triangleVertex(collider,u32(triangle),1u);let third=triangleVertex(collider,u32(triangle),2u);
  return min(length(second-first),min(length(third-second),length(first-third)));
 }
 let shape=bodies.colliders[collider].shape;
 if(shape.w==0.0){return shape.x;}
 if(shape.w==6.0){return 1e30;}
 if(shape.w==4.0){return max(shape.x,shape.y);}
 if(shape.w==5.0){return min(max(shape.x,shape.y),shape.z*0.5);}
 if(shape.w==1.0){return min(shape.x,min(shape.y,shape.z));}
 let root=u32(bodies.colliders[collider].policies.z);
 let extent=(readGeometry(root+1u).xyz-readGeometry(root).xyz)*0.5;
 return min(extent.x,min(extent.y,extent.z));
}
// Conservative world-space extents prevent a large rotated box's mesh-local
// AABB from expanding into unnecessary whole-mesh traversal.
fn shapeWorldExtent(collider:u32)->vec3f {
 let shape=bodies.colliders[collider].shape;var extent=shape.xyz;
 if(shape.w==0.0){extent=vec3f(shape.x);}
 if(shape.w==4.0){let radius=max(shape.x,shape.y);extent=vec3f(radius,radius+shape.z*0.5,radius);}
 if(shape.w==5.0){let radius=max(shape.x,shape.y);extent=vec3f(radius,shape.z*0.5,radius);}
 if(shape.w==6.0){extent=vec3f(select(1e15,shape.x,shape.x>0.0),0,select(1e15,shape.y,shape.y>0.0));}
 return abs(axis(collider,0u))*extent.x+abs(axis(collider,1u))*extent.y+abs(axis(collider,2u))*extent.z;
}
`}var mr=`
@group(0) @binding(24) var<storage,read_write> minima:array<f32>;
@group(0) @binding(25) var<storage,read_write> maxima:array<f32>;
@compute @workgroup_size(64) fn bounds(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledColliderCount()){return;}let index=scheduledCollider(work);
 let center=colliderPosition(index);let extent=shapeWorldExtent(index)+vec3f(settings.solver.x);
 for(var axisIndex=0u;axisIndex<3u;axisIndex++){
  minima[index*3u+axisIndex]=center[axisIndex]-extent[axisIndex];
  maxima[index*3u+axisIndex]=center[axisIndex]+extent[axisIndex];
 }
}
`;function hr(e,t=!1){return`
struct ParallelState {
 diagnostics:array<atomic<u32>,4>,
 heads:array<atomic<u32>,BODY_COUNT>,
 degrees:array<atomic<u32>,BODY_COUNT>,
 roots:array<atomic<u32>,BODY_COUNT>,
 flags:array<atomic<u32>,BODY_COUNT>,
 forced:array<atomic<u32>,BODY_COUNT>,
 next:array<u32,PAIR_CAPACITY*2u>,
 deltas:array<vec4f,PAIR_CAPACITY*4u>,
 activePairs:array<u32,PAIR_CAPACITY>,
 solvePairs:array<u32,PAIR_CAPACITY>,
 awakeBodies:array<u32,BODY_COUNT>
}
@group(0) @binding(26) var<storage,read_write> parallelState:ParallelState;
@group(0) @binding(27) var<storage,read_write> parallelDispatch:array<u32,12>;
fn parallelPair(index:u32)->u32 {
 if(COMPACT_CONTACTS){
  if(index>=atomicLoad(&parallelState.diagnostics[1])){return PAIR_CAPACITY;}
  return parallelState.activePairs[index];
 }
 return index;
}
// One bounded scan builds the queue; every iterative solve reuses original manifold IDs.
@compute @workgroup_size(64) fn parallelCompact(@builtin(global_invocation_id) invocation:vec3u){
 ${e?`
 let work=invocation.x;if(work>=atomicLoad(&ensemble[0])){return;}
 let instance=atomicLoad(&ensemble[INSTANCE_QUEUE+work]);var link=atomicLoad(&targets.instanceHeads[instance]);
 loop{if(link==0u){break;}let pair=link-1u;link=targets.links[pair];
  if(manifolds[pair].count==0u){continue;}
  let slot=atomicAdd(&parallelState.diagnostics[1],1u);parallelState.activePairs[slot]=pair;
 }`:`
 let pair=invocation.x;if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u){return;}
 let slot=atomicAdd(&parallelState.diagnostics[1],1u);parallelState.activePairs[slot]=pair;`}

}
@compute @workgroup_size(1) fn parallelDispatchCount(){
 parallelDispatch[0]=(atomicLoad(&parallelState.diagnostics[1])+63u)/64u;
 parallelDispatch[1]=1u;parallelDispatch[2]=1u;parallelDispatch[3]=0u;
}
// Build solver work only after island wake propagation has completed.
@compute @workgroup_size(64) fn parallelActive(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;
 if(!${e}&&index<BODY_COUNT&&bodyScheduled(index)&&dynamic(index)&&sleepStates[index].y<0.5){
  let slot=atomicAdd(&parallelState.diagnostics[2],1u);parallelState.awakeBodies[slot]=index;
 }
 let pair=parallelPair(index);
 if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u||!colliderScheduled(manifolds[pair].first)){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 if((dynamic(first)&&sleepStates[first].y<0.5)||(dynamic(second)&&sleepStates[second].y<0.5)){
  let slot=atomicAdd(&parallelState.diagnostics[3],1u);parallelState.solvePairs[slot]=pair;
 }
}
@compute @workgroup_size(64) fn parallelActiveBodies(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);
 if(dynamic(body)&&sleepStates[body].y<0.5){let slot=atomicAdd(&parallelState.diagnostics[2],1u);parallelState.awakeBodies[slot]=body;}
}
@compute @workgroup_size(1) fn parallelActiveCount(){
 parallelDispatch[4]=(atomicLoad(&parallelState.diagnostics[3])+63u)/64u;
 parallelDispatch[5]=1u;parallelDispatch[6]=1u;parallelDispatch[7]=0u;
 parallelDispatch[8]=(atomicLoad(&parallelState.diagnostics[2])+63u)/64u;
 parallelDispatch[9]=1u;parallelDispatch[10]=1u;parallelDispatch[11]=0u;
}
fn parallelSolvePair(index:u32)->u32 {
 if(!COMPACT_CONTACTS){
  if(index>=PAIR_CAPACITY||manifolds[index].count==0u){return PAIR_CAPACITY;}
  // Only scheduled contacts were linked. Reuse adjacency to avoid a ninth storage binding.
  let first=colliderBody(getFirstCollider(index));let second=colliderBody(getSecondCollider(index));
  if(atomicLoad(&parallelState.heads[first])==0xffffffffu&&atomicLoad(&parallelState.heads[second])==0xffffffffu){return PAIR_CAPACITY;}
  return index;
 }
 if(index>=atomicLoad(&parallelState.diagnostics[3])){return PAIR_CAPACITY;}
 return parallelState.solvePairs[index];
}
// Parent IDs strictly decrease. A connected chain can require up to BODY_COUNT links
// before compression completes; a fixed 64-link cap rejects valid larger islands.
fn parallelRoot(body:u32)->u32 {
 var current=body;
 for(var iteration=0u;iteration<max(64u,BODY_COUNT);iteration++){
  let parent=atomicLoad(&parallelState.roots[current]);
  if(parent==current){return current;}
  let grandparent=atomicLoad(&parallelState.roots[parent]);
  atomicMin(&parallelState.roots[current],grandparent);current=parent;
 }
 // Incomplete union work prevents sleeping, rather than treating split islands as independent.
 atomicAdd(&parallelState.diagnostics[0],1u);return current;
}
@compute @workgroup_size(1) fn parallelResetCounters(){
 for(var index=0u;index<4u;index++){atomicStore(&parallelState.diagnostics[index],0u);}
}
@compute @workgroup_size(64) fn parallelReset(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;var body=work;if(${e}&&COMPACT_CONTACTS){if(work>=scheduledBodyCount()){return;}body=scheduledBody(work);}
 if(!(${e}&&COMPACT_CONTACTS)&&body<4u){atomicStore(&parallelState.diagnostics[body],0u);}
 if(body>=BODY_COUNT||(${e}&&COMPACT_CONTACTS&&work>=scheduledBodyCount())){return;}
 atomicStore(&parallelState.heads[body],0xffffffffu);atomicStore(&parallelState.degrees[body],0u);
 atomicStore(&parallelState.roots[body],body);atomicStore(&parallelState.flags[body],1u);atomicStore(&parallelState.forced[body],0u);
}
@compute @workgroup_size(64) fn parallelLink(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelPair(invocation.x);if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u||!colliderScheduled(manifolds[pair].first)){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 for(var endpoint=0u;endpoint<2u;endpoint++){
  let body=select(first,second,endpoint==1u);let other=select(second,first,endpoint==1u);
  if(!dynamic(body)){continue;}
  let edge=pair*2u+endpoint;
  parallelState.next[edge]=atomicExchange(&parallelState.heads[body],edge);
  atomicAdd(&parallelState.degrees[body],1u);
  if(bodies.bodies[other].motion.x==2.0&&length(velocities[other].xyz)+length(angularVelocities[other].xyz)>0.000001){atomicStore(&parallelState.forced[body],1u);}
 }
}
@compute @workgroup_size(64) fn parallelUnion(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelPair(invocation.x);if(pair>=PAIR_CAPACITY||manifolds[pair].count==0u||!colliderScheduled(manifolds[pair].first)){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 if(!dynamic(first)||!dynamic(second)){return;}
 for(var iteration=0u;iteration<max(64u,BODY_COUNT);iteration++){
  let firstRoot=parallelRoot(first);let secondRoot=parallelRoot(second);
  if(firstRoot==secondRoot){return;}
  let larger=max(firstRoot,secondRoot);let smaller=min(firstRoot,secondRoot);
  if(atomicMin(&parallelState.roots[larger],smaller)==larger){return;}
 }
 atomicAdd(&parallelState.diagnostics[0],1u);
}
@compute @workgroup_size(64) fn parallelCompress(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)){return;}
 sleepStates[body].z=f32(parallelRoot(body));
}
@compute @workgroup_size(64) fn parallelWakeRoots(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(sleepStates[body].y<0.5||atomicLoad(&parallelState.forced[body])>0u){atomicStore(&parallelState.flags[u32(sleepStates[body].z)],0u);}
}
@compute @workgroup_size(64) fn parallelWakeBodies(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(atomicLoad(&parallelState.flags[u32(sleepStates[body].z)])==0u||atomicLoad(&parallelState.diagnostics[0])>0u){
  if(sleepStates[body].y>0.5||atomicLoad(&parallelState.forced[body])>0u){sleepStates[body].x=0.0;}
  sleepStates[body].y=0.0;
 }
}
fn writePairDeltas(pair:u32,first:u32,second:u32,impulse:vec3f,firstTorque:vec3f,secondTorque:vec3f){
 parallelState.deltas[pair*4u]=vec4f(select(vec3f(0),-impulse*velocities[first].w,dynamic(first)),0);
 parallelState.deltas[pair*4u+1u]=vec4f(select(vec3f(0),inverseInertia(first,firstTorque),dynamic(first)),0);
 parallelState.deltas[pair*4u+2u]=vec4f(select(vec3f(0),impulse*velocities[second].w,dynamic(second)),0);
 parallelState.deltas[pair*4u+3u]=vec4f(select(vec3f(0),inverseInertia(second,secondTorque),dynamic(second)),0);
}
@compute @workgroup_size(64) fn parallelWarm(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelSolvePair(invocation.x);if(pair>=PAIR_CAPACITY){return;}
 for(var index=0u;index<4u;index++){parallelState.deltas[pair*4u+index]=vec4f(0);}
 if(manifolds[pair].count==0u){return;}
 let first=colliderBody(getFirstCollider(pair));let second=colliderBody(getSecondCollider(pair));
 if((sleepStates[first].y>0.5||!dynamic(first))&&(sleepStates[second].y>0.5||!dynamic(second))){return;}
 var impulse=vec3f(0);var firstTorque=vec3f(0);var secondTorque=vec3f(0);
 for(var slot=0u;slot<manifolds[pair].count;slot++){
  let contact=manifolds[pair].contacts[slot];let increment=contact.normal.xyz*contact.impulse.x+contact.tangent.xyz;
  impulse+=increment;firstTorque-=cross(contact.point.xyz-positions[first].xyz,increment);secondTorque+=cross(contact.point.xyz-positions[second].xyz,increment);
 }
 writePairDeltas(pair,first,second,impulse,firstTorque,secondTorque);
}
@compute @workgroup_size(64) fn parallelPairs(@builtin(global_invocation_id) invocation:vec3u){
 let pair=parallelSolvePair(invocation.x);if(pair>=PAIR_CAPACITY){return;}
 for(var index=0u;index<4u;index++){parallelState.deltas[pair*4u+index]=vec4f(0);}
 if(manifolds[pair].count==0u){return;}
 let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
 if((sleepStates[first].y>0.5||!dynamic(first))&&(sleepStates[second].y>0.5||!dynamic(second))){return;}
 let relaxation=settings.stability.w/f32(max(1u,max(atomicLoad(&parallelState.degrees[first]),atomicLoad(&parallelState.degrees[second]))));
 var firstLinear=velocities[first].xyz;var secondLinear=velocities[second].xyz;
 var firstAngular=angularVelocities[first].xyz;var secondAngular=angularVelocities[second].xyz;
 ${t?`
 // Solve the contact patch locally, then relax the whole block once. No extra dispatches.
 var contacts:array<Contact,4>;
 for(var slot=0u;slot<manifolds[pair].count;slot++){contacts[slot]=manifolds[pair].contacts[slot];}
 for(var sweep=0u;sweep<2u;sweep++){
 `:``}
 for(var slot=0u;slot<manifolds[pair].count;slot++){
  var contact=${t?`contacts[slot]`:`manifolds[pair].contacts[slot]`};let point=contact.point.xyz;let normal=contact.normal.xyz;
  let firstLever=point-positions[first].xyz;let secondLever=point-positions[second].xyz;
  let relative=secondLinear+cross(secondAngular,secondLever)-firstLinear-cross(firstAngular,firstLever);
  let normalMass=effectiveMass(first,second,point,normal);if(normalMass<=0.0){continue;}
  let bias=min(settings.stability.z,settings.stability.y*max(0.0,contact.point.w-settings.solver.x)/settings.gravity.w);
  let desiredImpulse=max(0.0,contact.impulse.x+(max(bias,contact.normal.w)-dot(relative,normal))/normalMass);
  let change=(desiredImpulse-contact.impulse.x)*${t?`1.0`:`relaxation`};contact.impulse.x+=change;
  var impulse=normal*change;
  if(dynamic(first)){firstLinear-=impulse*velocities[first].w;firstAngular-=inverseInertia(first,cross(firstLever,impulse));}
  if(dynamic(second)){secondLinear+=impulse*velocities[second].w;secondAngular+=inverseInertia(second,cross(secondLever,impulse));}
  let after=secondLinear+cross(secondAngular,secondLever)-firstLinear-cross(firstAngular,firstLever);
  let tangent=solveFriction(firstCollider,secondCollider,contact,after);
  var relaxedTangent=contact.tangent.xyz+(tangent-contact.tangent.xyz)*${t?`1.0`:`relaxation`};
  // A falling normal impulse must shrink the cone even when under-relaxing.
  let staticLimit=frictionCoefficient(firstCollider,secondCollider,false)*contact.impulse.x;
  if(length(relaxedTangent)>staticLimit){relaxedTangent*=staticLimit/max(1e-30,length(relaxedTangent));}
  impulse=relaxedTangent-contact.tangent.xyz;contact.tangent=vec4f(relaxedTangent,0);
  if(dynamic(first)){firstLinear-=impulse*velocities[first].w;firstAngular-=inverseInertia(first,cross(firstLever,impulse));}
  if(dynamic(second)){secondLinear+=impulse*velocities[second].w;secondAngular+=inverseInertia(second,cross(secondLever,impulse));}
  ${t?`contacts[slot]`:`manifolds[pair].contacts[slot]`}=contact;
 }
 ${t?`
 }
 // Interpolation of feasible impulses preserves the friction cone, including unloading.
 for(var slot=0u;slot<manifolds[pair].count;slot++){
  let previous=manifolds[pair].contacts[slot];
  manifolds[pair].contacts[slot].impulse.x=mix(previous.impulse.x,contacts[slot].impulse.x,relaxation);
  manifolds[pair].contacts[slot].tangent=mix(previous.tangent,contacts[slot].tangent,relaxation);
 }
 `:``}
 parallelState.deltas[pair*4u]=vec4f((firstLinear-velocities[first].xyz)*${t?`relaxation`:`1.0`},0);
 parallelState.deltas[pair*4u+1u]=vec4f((firstAngular-angularVelocities[first].xyz)*${t?`relaxation`:`1.0`},0);
 parallelState.deltas[pair*4u+2u]=vec4f((secondLinear-velocities[second].xyz)*${t?`relaxation`:`1.0`},0);
 parallelState.deltas[pair*4u+3u]=vec4f((secondAngular-angularVelocities[second].xyz)*${t?`relaxation`:`1.0`},0);
}
@compute @workgroup_size(64) fn parallelGather(@builtin(global_invocation_id) invocation:vec3u){
 var body=invocation.x;
 if(COMPACT_CONTACTS){if(body>=atomicLoad(&parallelState.diagnostics[2])){return;}body=parallelState.awakeBodies[body];}if(body>=BODY_COUNT||!dynamic(body)||sleepStates[body].y>0.5){return;}
 var linear=vec3f(0);var angular=vec3f(0);var edge=atomicLoad(&parallelState.heads[body]);if(edge==0xffffffffu){return;}
 loop{if(edge==0xffffffffu){break;}let pair=edge/2u;let endpoint=edge%2u;
  linear+=parallelState.deltas[pair*4u+endpoint*2u].xyz;angular+=parallelState.deltas[pair*4u+endpoint*2u+1u].xyz;edge=parallelState.next[edge];
 }
 velocities[body]=vec4f(velocities[body].xyz+linear,velocities[body].w);angularVelocities[body]=vec4f(angularVelocities[body].xyz+angular,0);
}
@compute @workgroup_size(64) fn parallelAdvance(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);finishBody(body);${e?``:`atomicStore(&parallelState.flags[body],1u);`}
}
@compute @workgroup_size(64) fn parallelPrepareSleep(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work<scheduledBodyCount()){let body=scheduledBody(work);atomicStore(&parallelState.flags[body],1u);}
}
@compute @workgroup_size(64) fn parallelMarkSleep(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(settings.sleep.x<=0.0||sleepStates[body].x<settings.sleep.x||atomicLoad(&parallelState.diagnostics[0])>0u){atomicStore(&parallelState.flags[u32(sleepStates[body].z)],0u);}
}
@compute @workgroup_size(64) fn parallelSleep(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);if(!bodyScheduled(body)||!dynamic(body)){return;}
 if(atomicLoad(&parallelState.flags[u32(sleepStates[body].z)])>0u){sleepStates[body].y=1.0;velocities[body]=vec4f(0,0,0,velocities[body].w);angularVelocities[body]=vec4f(0);}
}
`}var gr=`
const MESH_TASK_CAPACITY:u32=65536u;
struct MeshTask { key:vec4u, point:vec4f, normal:vec4f }
struct MeshTasks { count:atomic<u32>, overflow:atomic<u32>, unresolved:atomic<u32>, incomplete:atomic<u32>, entries:array<MeshTask,65536> }
@group(0) @binding(10) var<storage,read_write> meshTasks:MeshTasks;
${Qn}
struct Simplex { points: array<SupportVertex,4>, count: u32 }
struct ConvexHit { point: vec3f, normal: vec3f, depth: f32, status: u32 }
struct EPAFace { indices: vec3u, normal: vec3f, distance: f32 }
fn shapeSupport(collider:u32,direction:vec3f,triangle:i32)->vec3f {return colliderPosition(collider)+rotate(colliderRotation(collider),localShapeSupport(collider,colliderLocal(collider,direction),triangle));}
// Clip an unbounded plane to this pair's conservative footprint. The patch
// contains every possible contact without putting huge coordinates into GJK.
fn pairShapeSupport(collider:u32,other:u32,direction:vec3f,triangle:i32)->vec3f {
 let shape=bodies.colliders[collider].shape;
 if(shape.w!=6.0){return shapeSupport(collider,direction,triangle);}
 let center=colliderLocal(collider,colliderPosition(other)-colliderPosition(collider));
 let extent=shapeWorldExtent(other);let localDirection=colliderLocal(collider,direction);
 var point=vec3f(0);
 for(var coordinate=0u;coordinate<2u;coordinate++){
  let component=coordinate*2u;let halfExtent=shape[coordinate];
  let radius=dot(abs(axis(collider,component)),extent)+settings.solver.x*2.0;
  var lower=center[component]-radius;var upper=center[component]+radius;
  if(halfExtent>0.0){lower=-halfExtent;upper=halfExtent;}
  point[component]=select(lower,upper,localDirection[component]>=0.0);
 }
 return colliderPosition(collider)+rotate(colliderRotation(collider),point);
}
fn permitsPlaneContact(plane:u32,other:u32)->bool {
 let shape=bodies.colliders[plane].shape;
 return shape.w!=6.0||shape.z!=0.0||dot(colliderPosition(other)-colliderPosition(plane),axis(plane,1u))>=0.0;
}
fn minkowski(first:u32,second:u32,direction:vec3f,firstTriangle:i32,secondTriangle:i32,scale:f32)->SupportVertex {
 let maximumComponent=max(abs(direction.x),max(abs(direction.y),abs(direction.z)));
 let searchDirection=direction/max(maximumComponent,1e-30);
 var vertex:SupportVertex;vertex.first=pairShapeSupport(first,second,searchDirection,firstTriangle);vertex.second=pairShapeSupport(second,first,-searchDirection,secondTriangle);
 vertex.difference=(vertex.first-vertex.second+searchDirection/max(length(searchDirection),1e-20)*settings.solver.x)/scale;return vertex;
}
fn perpendicular(direction:vec3f)->vec3f {return cross(direction,select(vec3f(1,0,0),vec3f(0,1,0),abs(direction.x)>abs(direction.y)));}
fn reduceLine(simplex:ptr<function,Simplex>)->vec3f {
 let start=(*simplex).points[0].difference;let edge=(*simplex).points[1].difference-start;
 if(dot(edge,-start)>0.0){var direction=cross(cross(edge,-start),edge);if(dot(direction,direction)<1e-18){direction=perpendicular(edge);}return direction;}
 (*simplex).count=1u;return -start;
}
fn reduceTriangle(simplex:ptr<function,Simplex>)->vec3f {
 let start=(*simplex).points[0].difference;let first=(*simplex).points[1].difference-start;let second=(*simplex).points[2].difference-start;let normal=cross(first,second);
 if(dot(cross(normal,second),-start)>0.0){
  if(dot(second,-start)>0.0){(*simplex).points[1]=(*simplex).points[2];(*simplex).count=2u;return reduceLine(simplex);}
  (*simplex).count=2u;return reduceLine(simplex);
 }
 if(dot(cross(first,normal),-start)>0.0){(*simplex).count=2u;return reduceLine(simplex);}
 if(dot(normal,-start)>=0.0){return normal;}
 let temporary=(*simplex).points[1];(*simplex).points[1]=(*simplex).points[2];(*simplex).points[2]=temporary;return -normal;
}
fn reduceTetrahedron(simplex:ptr<function,Simplex>)->vec4f {
 let start=(*simplex).points[0].difference;
 for(var face=0u;face<3u;face++){
  let first=1u+face%3u;let second=1u+(face+1u)%3u;let opposite=1u+(face+2u)%3u;
  var normal=cross((*simplex).points[first].difference-start,(*simplex).points[second].difference-start);
  if(dot(normal,(*simplex).points[opposite].difference-start)>0.0){normal=-normal;}
  if(dot(normal,-start)>1e-10){let firstVertex=(*simplex).points[first];let secondVertex=(*simplex).points[second];(*simplex).points[1]=firstVertex;(*simplex).points[2]=secondVertex;(*simplex).count=3u;return vec4f(reduceTriangle(simplex),0);}
 }
 return vec4f(0,0,0,1);
}
fn makeEPAFace(vertices:ptr<function,array<SupportVertex,64>>,first:u32,second:u32,third:u32,interior:vec3f)->EPAFace {
 var result:EPAFace;result.indices=vec3u(first,second,third);
 let point=(*vertices)[first].difference;var normal=cross((*vertices)[second].difference-point,(*vertices)[third].difference-point);
 if(dot(normal,interior-point)>0.0){normal=-normal;result.indices=vec3u(first,third,second);}
 result.normal=normal/max(length(normal),1e-20);result.distance=dot(result.normal,point);return result;
}
fn faceHit(vertices:ptr<function,array<SupportVertex,64>>,face:EPAFace,scale:f32)->ConvexHit {
 let first=(*vertices)[face.indices.x];let second=(*vertices)[face.indices.y];let third=(*vertices)[face.indices.z];
 let weights=triangleWeights(face.normal*face.distance,first.difference,second.difference,third.difference);
 var hit:ConvexHit;hit.point=((first.first+first.second)*weights.x+(second.first+second.second)*weights.y+(third.first+third.second)*weights.z)*0.5;
 hit.normal=face.normal;hit.depth=face.distance*scale-settings.solver.x;hit.status=1u;return hit;
}
fn convexContact(first:u32,second:u32,firstTriangle:i32,secondTriangle:i32)->ConvexHit {
 // Analytic sphere/triangle witnesses avoid EPA noise at coplanar tessellation seams.
 let sphereFirst=bodies.colliders[first].shape.w==0.0&&secondTriangle>=0;
 let sphereSecond=bodies.colliders[second].shape.w==0.0&&firstTriangle>=0;
 if(sphereFirst||sphereSecond){
  let sphere=select(second,first,sphereFirst);let mesh=select(first,second,sphereFirst);
  let triangle=u32(select(firstTriangle,secondTriangle,sphereFirst));
  let center=colliderLocal(mesh,colliderPosition(sphere)-colliderPosition(mesh));
  let firstPoint=triangleVertex(mesh,triangle,0u);let secondPoint=triangleVertex(mesh,triangle,1u);let thirdPoint=triangleVertex(mesh,triangle,2u);
  let extent=max(abs(secondPoint-firstPoint),abs(thirdPoint-firstPoint));
  let normalization=max(max(extent.x,max(extent.y,extent.z)),1e-20);
  let firstEdge=(secondPoint-firstPoint)/normalization;let secondEdge=(thirdPoint-firstPoint)/normalization;
  let weights=triangleWeights((center-firstPoint)/normalization,vec3f(0),firstEdge,secondEdge);
  let closest=firstPoint+(secondPoint-firstPoint)*weights.y+(thirdPoint-firstPoint)*weights.z;
  let faceNormal=normalize(cross(firstEdge,secondEdge));
  let delta=center-closest;let magnitude=length(delta);let radius=bodies.colliders[sphere].shape.x;
  var hit:ConvexHit;if(magnitude>radius+settings.solver.x){return hit;}
  let internalEdges=meshTriangleData(mesh,triangle)%8u;
  // Opposite barycentric coordinate identifies an edge. Internal coplanar edges are
  // not collision ridges: their adjacent triangle owns the face witness instead.
  for(var edge=0u;edge<3u;edge++){
   if((internalEdges&(1u<<edge))!=0u&&weights[(edge+2u)%3u]<=1e-7&&weights[edge]>1e-7&&weights[(edge+1u)%3u]>1e-7){
    let tangential=delta-faceNormal*dot(delta,faceNormal);
    if(length(tangential)>max(1e-8,radius*1e-6)){return hit;}
   }
  }
  var normal=faceNormal;
  if(magnitude>1e-12){normal=delta/magnitude;}
  let worldNormal=rotate(colliderRotation(mesh),normal);
  let worldClosest=colliderPosition(mesh)+rotate(colliderRotation(mesh),closest);
  hit.point=(worldClosest+colliderPosition(sphere)-worldNormal*radius)*0.5;
  hit.normal=select(worldNormal,-worldNormal,sphereFirst);hit.depth=radius-magnitude;hit.status=1u;return hit;
 }

 // Normalize by local feature size and independently cap EPA's world-space tolerance.
 let scale=max(min(contactFeatureScale(first,firstTriangle),contactFeatureScale(second,secondTriangle)),1e-12);
 let distanceTolerance=min(0.0001,0.0001/scale);
 var miss:ConvexHit;var simplex:Simplex;simplex.count=1u;var direction=colliderPosition(second)-colliderPosition(first);if(length(direction)<1e-8){direction=vec3f(1,0,0);}
 simplex.points[0]=minkowski(first,second,direction,firstTriangle,secondTriangle,scale);direction=-simplex.points[0].difference;
 var intersected=false;
 for(var iteration=0u;iteration<48u;iteration++){
  if(length(direction)<1e-12){direction=vec3f(0,1,0);}
  let vertex=minkowski(first,second,direction,firstTriangle,secondTriangle,scale);if(dot(vertex.difference,direction)<0.0){return miss;}
  for(var index=simplex.count;index>0u;index--){simplex.points[index]=simplex.points[index-1u];}simplex.points[0]=vertex;simplex.count++;
  if(simplex.count==2u){direction=reduceLine(&simplex);}else if(simplex.count==3u){direction=reduceTriangle(&simplex);}else{let reduced=reduceTetrahedron(&simplex);if(reduced.w>0.5){intersected=true;break;}direction=reduced.xyz;}
 }
 if(!intersected){miss.status=2u;return miss;}
 var vertices:array<SupportVertex,64>;for(var index=0u;index<4u;index++){vertices[index]=simplex.points[index];}
 let interior=(vertices[0].difference+vertices[1].difference+vertices[2].difference+vertices[3].difference)*0.25;
 var faces:array<EPAFace,128>;faces[0]=makeEPAFace(&vertices,0u,1u,2u,interior);faces[1]=makeEPAFace(&vertices,0u,3u,1u,interior);faces[2]=makeEPAFace(&vertices,0u,2u,3u,interior);faces[3]=makeEPAFace(&vertices,1u,3u,2u,interior);
 var faceCount=4u;var vertexCount=4u;
 for(var iteration=0u;iteration<48u;iteration++){
  var nearest=0u;var distance=1e30;
  for(var index=0u;index<faceCount;index++){if(dot(faces[index].normal,faces[index].normal)>0.5&&faces[index].distance<distance){distance=faces[index].distance;nearest=index;}}
  if(distance==1e30){miss.status=2u;return miss;}
  let face=faces[nearest];let vertex=minkowski(first,second,face.normal,firstTriangle,secondTriangle,scale);
  if(dot(vertex.difference,face.normal)-distance<distanceTolerance){return faceHit(&vertices,face,scale);}
  if(vertexCount>=64u){miss.status=2u;return miss;}
  var edges:array<vec2u,256>;var edgeCount=0u;var retained=0u;
  for(var index=0u;index<faceCount;index++){
   let candidate=faces[index];
   if(dot(candidate.normal,vertex.difference-vertices[candidate.indices.x].difference)>1e-7){
    for(var side=0u;side<3u;side++){
     let edge=vec2u(candidate.indices[side],candidate.indices[(side+1u)%3u]);var cancelled=false;
     for(var previous=0u;previous<edgeCount;previous++){if(all(edges[previous]==edge.yx)){edges[previous]=vec2u(0xffffffffu);cancelled=true;break;}}
     if(!cancelled){if(edgeCount>=256u){miss.status=2u;return miss;}edges[edgeCount]=edge;edgeCount++;}
    }
   }else{faces[retained]=candidate;retained++;}
  }
  vertices[vertexCount]=vertex;faceCount=retained;
  for(var index=0u;index<edgeCount;index++){if(edges[index].x!=0xffffffffu){if(faceCount>=128u){miss.status=2u;return miss;}faces[faceCount]=makeEPAFace(&vertices,edges[index].x,edges[index].y,vertexCount,interior);faceCount++;}}
  vertexCount++;
 }
 miss.status=2u;return miss;
}
fn appendConvexContact(pair:u32,hit:ConvexHit,previous:Manifold,first:u32,second:u32,firstTriangle:i32,secondTriangle:i32){
 if(hit.status==2u){manifolds[pair].padding.x++;atomicAdd(&meshTasks.unresolved,1u);return;}
 if(hit.status!=1u||hit.depth < -settings.solver.x){return;}
 var slot=manifolds[pair].count;
 for(var index=0u;index<slot;index++){if(distance(manifolds[pair].contacts[index].point.xyz,hit.point)<settings.solver.w&&dot(manifolds[pair].contacts[index].normal.xyz,hit.normal)>0.95){if(hit.depth>manifolds[pair].contacts[index].point.w){storeFeatureContact(pair,index,hit.point,hit.normal,hit.depth,previous,first,second,firstTriangle,secondTriangle);}return;}}
 if(slot>=4u){slot=0u;for(var index=1u;index<4u;index++){if(manifolds[pair].contacts[index].point.w<manifolds[pair].contacts[slot].point.w){slot=index;}}if(hit.depth<=manifolds[pair].contacts[slot].point.w){return;}}
 storeFeatureContact(pair,slot,hit.point,hit.normal,hit.depth,previous,first,second,firstTriangle,secondTriangle);manifolds[pair].count=min(4u,manifolds[pair].count+1u);
}

fn addMeshCounter(counter:ptr<storage,atomic<u32>,read_write>,increment:u32)->u32 {
 var previous=atomicLoad(counter);
 loop {
  let replacement=previous+min(increment,0xffffffffu-previous);
  let exchanged=atomicCompareExchangeWeak(counter,previous,replacement);
  if(exchanged.exchanged){return previous;}
  previous=exchanged.old_value;
 }
}
fn reserveMeshTasks(requested:u32)->vec2u {
 let reserved=addMeshCounter(&meshTasks.count,requested);
 let start=min(reserved,MESH_TASK_CAPACITY);
 let retained=min(requested,MESH_TASK_CAPACITY-start);
 atomicMax(&targets.dispatch,(start+retained+31u)/32u);
 if(retained<requested){addMeshCounter(&meshTasks.overflow,requested-retained);}
 return vec2u(start,retained);
}
fn queueMeshPairContacts(pair:u32,first:u32,second:u32,previous:Manifold){
 // Traverse the smaller mesh outside; every candidate still retains both original IDs.
 let outerMesh=select(first,second,bodies.colliders[first].padding.w>bodies.colliders[second].padding.w);
 let queryMesh=select(first,second,outerMesh==first);
 let outerOffset=u32(bodies.colliders[outerMesh].policies.z);
 let outerCount=u32(bodies.colliders[outerMesh].policies.w);
 let queryOffset=u32(bodies.colliders[queryMesh].policies.z);
 let queryCount=u32(bodies.colliders[queryMesh].policies.w);
 let queryCenter=colliderLocal(outerMesh,colliderPosition(queryMesh)-colliderPosition(outerMesh));
 let queryExtent=shapeWorldExtent(queryMesh);
 var outerExtent=vec3f(0);
 for(var coordinate=0u;coordinate<3u;coordinate++){
  outerExtent[coordinate]=dot(abs(axis(outerMesh,coordinate)),queryExtent)+settings.solver.x;
 }
 let outerLower=queryCenter-outerExtent;let outerUpper=queryCenter+outerExtent;
 var candidates=0u;var written=0u;var reservation=vec2u(0);
 for(var traversal=0u;traversal<2u;traversal++){
  var work=0u;var exhausted=false;var outerNode=0u;
  loop {
   if(outerNode>=outerCount){break;}
   if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
   let minimum=readGeometry(outerOffset+outerNode*3u);
   let maximum=readGeometry(outerOffset+outerNode*3u+1u);
   if(any(minimum.xyz>maximum.xyz)||any(maximum.xyz<outerLower)||any(minimum.xyz>outerUpper)){outerNode=u32(minimum.w);continue;}
   if(maximum.w>0.0){
    let start=u32(readGeometry(outerOffset+outerNode*3u+2u).x);
    for(var offset=0u;offset<u32(maximum.w);offset++){
     if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
     let outerTriangle=start+offset;
     if(!meshTriangleActive(outerMesh,outerTriangle)){continue;}
     var lower=vec3f(3.402823e38);var upper=vec3f(-3.402823e38);
     for(var corner=0u;corner<3u;corner++){
      let worldPoint=colliderPosition(outerMesh)+rotate(colliderRotation(outerMesh),triangleVertex(outerMesh,outerTriangle,corner));
      let point=colliderLocal(queryMesh,worldPoint-colliderPosition(queryMesh));
      lower=min(lower,point);upper=max(upper,point);
     }
     lower-=vec3f(settings.solver.x);upper+=vec3f(settings.solver.x);
     var queryNode=0u;
     loop {
      if(queryNode>=queryCount){break;}
      if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
      let queryMinimum=readGeometry(queryOffset+queryNode*3u);
      let queryMaximum=readGeometry(queryOffset+queryNode*3u+1u);
      if(any(queryMinimum.xyz>queryMaximum.xyz)||any(queryMaximum.xyz<lower)||any(queryMinimum.xyz>upper)){queryNode=u32(queryMinimum.w);continue;}
      if(queryMaximum.w>0.0){
       let queryStart=u32(readGeometry(queryOffset+queryNode*3u+2u).x);
       for(var queryIndex=0u;queryIndex<u32(queryMaximum.w);queryIndex++){
        if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
        let queryTriangle=queryStart+queryIndex;
        if(!meshTriangleActive(queryMesh,queryTriangle)){continue;}
        let firstPoint=triangleVertex(queryMesh,queryTriangle,0u);
        let secondPoint=triangleVertex(queryMesh,queryTriangle,1u);
        let thirdPoint=triangleVertex(queryMesh,queryTriangle,2u);
        if(any(max(firstPoint,max(secondPoint,thirdPoint))<lower)||any(min(firstPoint,min(secondPoint,thirdPoint))>upper)){continue;}
        if(traversal==0u){candidates++;}
        else if(written<reservation.y){
         meshTasks.entries[reservation.x+written].key=vec4u(first,second,
          select(queryTriangle,outerTriangle,outerMesh==first),select(outerTriangle,queryTriangle,outerMesh==first));
         written++;
        }
       }
      }
      if(exhausted){break;}queryNode++;
     }
     if(exhausted){break;}
    }
   }
   if(exhausted){break;}outerNode++;
  }
  if(traversal==0u){
   if(exhausted){addMeshCounter(&meshTasks.incomplete,1u);}
   reservation=reserveMeshTasks(candidates);
  }
 }
 manifolds[pair].padding=vec3u(previous.count,reservation.x,reservation.y);
}

fn collideExtended(pair:u32,first:u32,second:u32,previous:Manifold){
 if(any(abs(colliderPosition(second)-colliderPosition(first))>shapeWorldExtent(first)+shapeWorldExtent(second)+vec3f(settings.solver.x))){return;}
 let firstShape=bodies.colliders[first].shape;let secondShape=bodies.colliders[second].shape;
 var firstRadius=length(firstShape.xyz);var secondRadius=length(secondShape.xyz);
 if(firstShape.w==0.0){firstRadius=firstShape.x;}if(secondShape.w==0.0){secondRadius=secondShape.x;}
 if(firstShape.w==4.0||firstShape.w==5.0){firstRadius=max(firstShape.x,firstShape.y)+firstShape.z*0.5;}if(secondShape.w==4.0||secondShape.w==5.0){secondRadius=max(secondShape.x,secondShape.y)+secondShape.z*0.5;}
 if(firstShape.w!=6.0&&secondShape.w!=6.0&&distance(colliderPosition(first),colliderPosition(second))>firstRadius+secondRadius+settings.solver.x){return;}
 if(!permitsPlaneContact(first,second)||!permitsPlaneContact(second,first)){return;}
 // Two unbounded zero-volume surfaces do not define a finite contact manifold.
 if(firstShape.w==6.0&&secondShape.w==6.0){manifolds[pair].padding.x++;atomicAdd(&meshTasks.unresolved,1u);return;}
 let firstMesh=bodies.colliders[first].shape.w==3.0;let secondMesh=bodies.colliders[second].shape.w==3.0;
 if(!firstMesh&&!secondMesh){appendConvexContact(pair,convexContact(first,second,-1,-1),previous,first,second,-1,-1);return;}
 if(firstMesh&&secondMesh){queueMeshPairContacts(pair,first,second,previous);return;}
 let mesh=select(second,first,firstMesh);let convex=select(first,second,firstMesh);
 var lower=vec3f(0);var upper=vec3f(0);
 for(var index=0u;index<3u;index++){let direction=axis(mesh,index);lower[index]=colliderLocal(mesh,pairShapeSupport(convex,mesh,-direction,-1)-colliderPosition(mesh))[index]-settings.solver.x;upper[index]=colliderLocal(mesh,pairShapeSupport(convex,mesh,direction,-1)-colliderPosition(mesh))[index]+settings.solver.x;}
 let offset=u32(bodies.colliders[mesh].policies.z);let count=u32(bodies.colliders[mesh].policies.w);
 var candidates=0u;var written=0u;var taskStart=0u;var taskCount=0u;
 for(var traversal=0u;traversal<2u;traversal++){
 var node=0u;var work=0u;var exhausted=false;
 loop{if(node>=count){break;}if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;let minimum=readGeometry(offset+node*3u);let maximum=readGeometry(offset+node*3u+1u);
  if(any(minimum.xyz>maximum.xyz)||any(maximum.xyz<lower)||any(minimum.xyz>upper)){node=u32(minimum.w);continue;}
  if(maximum.w>0.0){let start=u32(readGeometry(offset+node*3u+2u).x);for(var index=0u;index<u32(maximum.w);index++){
   if(work>=MESH_TRAVERSAL_BUDGET){exhausted=true;break;}work++;
   if(!meshTriangleActive(mesh,start+index)){continue;}
   let firstPoint=triangleVertex(mesh,start+index,0u);let secondPoint=triangleVertex(mesh,start+index,1u);let thirdPoint=triangleVertex(mesh,start+index,2u);
   if(any(max(firstPoint,max(secondPoint,thirdPoint))<lower)||any(min(firstPoint,min(secondPoint,thirdPoint))>upper)){continue;}
   if(traversal==0u){candidates++;}
   else if(written<taskCount){meshTasks.entries[taskStart+written].key=vec4u(first,second,select(0xffffffffu,start+index,firstMesh),select(start+index,0xffffffffu,firstMesh));written++;}
  }}
  if(exhausted){break;}node++;
 }
 if(traversal==0u){if(exhausted){addMeshCounter(&meshTasks.incomplete,1u);}let reservation=reserveMeshTasks(candidates);taskStart=reservation.x;taskCount=reservation.y;}
 }
 manifolds[pair].padding=vec3u(previous.count,taskStart,taskCount);
}
@compute @workgroup_size(32) fn meshCollide(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=min(atomicLoad(&meshTasks.count),MESH_TASK_CAPACITY)){return;}
 let key=meshTasks.entries[index].key;
 let hit=convexContact(key.x,key.y,i32(key.z),i32(key.w));
 meshTasks.entries[index].point=vec4f(hit.point,hit.depth);meshTasks.entries[index].normal=vec4f(hit.normal,f32(hit.status));
}
fn collectMeshContacts(){
 for(var pair=0u;pair<PAIR_CAPACITY;pair++){
  let first=getFirstCollider(pair);let second=getSecondCollider(pair);
  if(first>=second||(bodies.colliders[first].shape.w!=3.0&&bodies.colliders[second].shape.w!=3.0)){continue;}
  var previous=manifolds[pair];previous.count=previous.padding.x;
  let start=manifolds[pair].padding.y;let count=manifolds[pair].padding.z;
  manifolds[pair].count=0u;manifolds[pair].padding.x=0u;
  for(var index=0u;index<count;index++){let task=meshTasks.entries[start+index];var hit:ConvexHit;hit.point=task.point.xyz;hit.depth=task.point.w;hit.normal=task.normal.xyz;hit.status=u32(task.normal.w);appendConvexContact(pair,hit,previous,first,second,i32(task.key.z),i32(task.key.w));}
 }
}
`;function _r(e,t=!1,n){let r=n?`${n}u`:`PAIR_CAPACITY`,i=`
const EMPTY_PAIR:u32=0u;
const DELETED_PAIR:u32=0xffffffffu;
fn metadataWord(component:u32)->u32{return bodies.geometry[component/4u][component%4u];}
fn candidateCount()->u32{return min(metadataWord(${e.diagnosticOffset}u),PAIR_CAPACITY);}
fn candidatePair(index:u32)->vec2u{let component=${e.pairOffset}u+index*2u;return vec2u(metadataWord(component),metadataWord(component+1u));}
fn getFirstCollider(pair:u32)->u32{return manifolds[pair].first;}
fn getSecondCollider(pair:u32)->u32{return manifolds[pair].second;}
fn claimManifold(first:u32,second:u32)->u32{
 let key=((first<<16u)|second)+1u;
 var mixed=(key^(key>>16u))*2246822519u;
 mixed=(mixed^(mixed>>13u))*3266489917u;
 ${n?`let instanceIndex=first/INSTANCE_COLLIDERS;let base=instanceIndex*${r};`:`let base=0u;`}
 let origin=(mixed^(mixed>>16u))&(${r}-1u);
 for(var attempt=0u;attempt<8u;attempt++){
  var reusable=DELETED_PAIR;var observed=DELETED_PAIR;
  for(var probe=0u;probe<min(${r},128u);probe++){
   let slot=base+((origin+probe)&(${r}-1u));let stored=atomicLoad(&targets.keys[slot].key);
   if(stored==key){targets.keys[slot].epoch=targets.frame;manifolds[slot].first=first;manifolds[slot].second=second;return slot;}
   if(stored==DELETED_PAIR&&reusable==DELETED_PAIR){reusable=slot;observed=DELETED_PAIR;}
   if(stored==EMPTY_PAIR){if(reusable==DELETED_PAIR){reusable=slot;observed=EMPTY_PAIR;}break;}
  }
  if(reusable==DELETED_PAIR){break;}
  let claimed=atomicCompareExchangeWeak(&targets.keys[reusable].key,observed,key);
  if(claimed.exchanged){
   targets.keys[reusable].epoch=targets.frame;manifolds[reusable].previousCount=0u;
   manifolds[reusable].first=first;manifolds[reusable].second=second;return reusable;
  }
 }
 ${n?`atomicStore(&targets.instanceFailures[instanceIndex],1u);atomicStore(&targets.instanceFailures[INSTANCE_COUNT],1u);`:`atomicAdd(&targets.cacheDropped,1u);`}
 return DELETED_PAIR;
}
var<workgroup> cacheEpoch:u32;
@compute @workgroup_size(64) fn prepare(@builtin(local_invocation_index) invocation:u32){
 if(invocation==0u){targets.frame++;cacheEpoch=targets.frame;atomicStore(&targets.cacheDropped,0u);}
 workgroupBarrier();
 for(var pair=invocation;pair<PAIR_CAPACITY;pair+=64u){
  let existing=atomicLoad(&targets.keys[pair].key);
  if(existing!=EMPTY_PAIR&&existing!=DELETED_PAIR&&!colliderScheduled(manifolds[pair].first)){targets.keys[pair].epoch=cacheEpoch;continue;}
  manifolds[pair].previousCount=manifolds[pair].count;
  manifolds[pair].count=0u;manifolds[pair].padding=vec3u(0);
  let key=atomicLoad(&targets.keys[pair].key);
  if(key!=EMPTY_PAIR&&key!=DELETED_PAIR&&cacheEpoch-targets.keys[pair].epoch>2u){
   atomicStore(&targets.keys[pair].key,DELETED_PAIR);manifolds[pair].previousCount=0u;
  }
 }
}
`;return t?(i=i.replaceAll(`targets.keys[slot].epoch=targets.frame;`,`targets.keys[slot].epoch=targets.instanceFrames[first/INSTANCE_COLLIDERS];`),i=i.replace(`targets.keys[reusable].epoch=targets.frame;`,`
   journalManifold(reusable,observed);atomicAdd(&targets.reserved2,1u);
   let instance=first/INSTANCE_COLLIDERS;
   targets.links[reusable]=atomicExchange(&targets.instanceHeads[instance],reusable+1u);
   targets.keys[reusable].epoch=targets.instanceFrames[instance];`),i=i.slice(0,i.indexOf(`var<workgroup> cacheEpoch`))+`
// Every slot has one owner during preparation and one successful claimant during discovery.
// A retired slot reused in this step retains its first snapshot and appears once in the journal.
fn journalManifold(pair:u32,key:u32){
 if(targets.journalMarks[pair]!=0u){return;}
 targets.journalKeys[pair]=vec2u(key,targets.keys[pair].epoch);targets.journalLinks[pair]=targets.links[pair];
 targets.journalManifolds[pair]=manifolds[pair];targets.journalMarks[pair]=1u;
 let index=atomicAdd(&targets.reserved0,1u);targets.journalSlots[index]=pair;
}
@compute @workgroup_size(64) fn prepareStart(@builtin(local_invocation_index) invocation:u32){
 let count=atomicLoad(&targets.reserved0);
 for(var index=invocation;index<count;index+=64u){targets.journalMarks[targets.journalSlots[index]]=0u;}
 storageBarrier();
 if(invocation==0u){targets.frame++;atomicStore(&targets.reserved0,0u);atomicStore(&targets.reserved1,0u);atomicStore(&targets.reserved2,0u);atomicStore(&targets.cacheDropped,0u);${n?`atomicStore(&targets.instanceFailures[INSTANCE_COUNT],0u);`:``}}
}
@compute @workgroup_size(64) fn prepare(@builtin(global_invocation_id) invocation:vec3u){
 let work=invocation.x;if(work>=atomicLoad(&ensemble[0])){return;}
 let instance=atomicLoad(&ensemble[INSTANCE_QUEUE+work]);
 ${n?`atomicStore(&targets.instanceFailures[instance],0u);`:``}
 targets.instanceFrames[instance]++;let epoch=targets.instanceFrames[instance];
 var previous=0u;var link=atomicLoad(&targets.instanceHeads[instance]);
 loop{
  if(link==0u){break;}let pair=link-1u;let next=targets.links[pair];journalManifold(pair,atomicLoad(&targets.keys[pair].key));atomicAdd(&targets.reserved1,1u);
  manifolds[pair].previousCount=manifolds[pair].count;manifolds[pair].count=0u;manifolds[pair].padding=vec3u(0);
  if(epoch-targets.keys[pair].epoch>2u){
   atomicStore(&targets.keys[pair].key,DELETED_PAIR);manifolds[pair].previousCount=0u;
   if(previous==0u){atomicStore(&targets.instanceHeads[instance],next);}else{targets.links[previous-1u]=next;}
  }else{previous=link;}
  link=next;
 }
}
`,i):i}function vr(e,t,n=e,r=!1,i,a=!1,o=65536,s=`fn jointActive(body:u32)->bool{return false;} fn jointExcluded(first:u32,second:u32)->bool{return false;}`,c=!1,l=0,u=0,d=0,f=!0,p,m,h=!1,g=!1,_){return`
const COMPACT_CONTACTS:bool=${f};
const BODY_COUNT: u32 = ${e}u;
const COLLIDER_COUNT: u32 = ${n}u;
const ITERATIONS: u32 = ${t}u;
const MESH_TRAVERSAL_BUDGET:u32=${o}u;
const PAIR_CAPACITY:u32=${i?.maximumPairs??n*n}u;
struct Body { inertia: vec4f, inertiaOrientation: vec4f, motion: vec4f }
struct Collider { shape: vec4f, position: vec4f, orientation: vec4f, material: vec4f, policies: vec4f, padding: vec4f }
struct Metadata { bodies: array<Body, BODY_COUNT>, colliders: array<Collider, COLLIDER_COUNT>, exclusions: array<vec2f, COLLIDER_COUNT>, geometry: array<vec4u> }
struct Target { position: vec4f, orientation: vec4f }
struct CacheKey { key:atomic<u32>, epoch:u32 }
struct GeneralConstraint {axes:vec4f,limits:vec4f,control:vec4f,drive:vec4f}
struct JointState {impulses:array<f32,8>, control:vec4f, limits:vec4f, motor:vec4f, drive:vec4f, spring:vec4f, general:GeneralConstraint}
struct Targets { entries:array<Target,BODY_COUNT>, dispatch:atomic<u32>, vertical:u32, depth:u32 ${i?`, frame:u32, cacheDropped:atomic<u32>, reserved0:${m?`atomic<u32>`:`u32`}, reserved1:${m?`atomic<u32>`:`u32`}, reserved2:${m?`atomic<u32>`:`u32`}, keys:array<CacheKey,PAIR_CAPACITY>`:``}${m?`, instanceHeads:array<atomic<u32>,${e/m}>, instanceFrames:array<u32,${e/m}>, links:array<u32,PAIR_CAPACITY>, journalMarks:array<u32,PAIR_CAPACITY>, journalSlots:array<u32,PAIR_CAPACITY>, journalKeys:array<vec2u,PAIR_CAPACITY>, journalLinks:array<u32,PAIR_CAPACITY>, savedHeads:array<u32,${e/m}>, savedFrames:array<u32,${e/m}>, savedHeader:array<u32,8>, journalManifolds:array<Manifold,PAIR_CAPACITY>${_?`, instanceFailures:array<atomic<u32>,${e/m+1}>`:``}`:``}${d?`, joints:array<JointState,${d}>`:``} }
struct Contact { point: vec4f, normal: vec4f, impulse: vec4f, tangent: vec4f, firstAnchor:vec4f, secondAnchor:vec4f }
struct Manifold { contacts: array<Contact, 4>, count: u32, first:u32, second:u32, previousCount:u32, padding: vec3u, terrainRevision:u32 }
struct Settings { gravity: vec4f, solver: vec4f, sleep: vec4f, stability: vec4f }
@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> orientations: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(5) var<storage, read> bodies: Metadata;
@group(0) @binding(6) var<storage, read_write> manifolds: array<Manifold>;
@group(0) @binding(7) var<storage, read_write> sleepStates: array<vec4f>;
@group(0) @binding(9) var<storage, read_write> targets: Targets;
${yn(e,m,p,r)}
${i?_r(i,!!m,_):`
fn getFirstCollider(pair:u32)->u32{return pair/COLLIDER_COUNT;}
fn getSecondCollider(pair:u32)->u32{return pair%COLLIDER_COUNT;}
`}
fn rotate(rotation: vec4f, vector: vec3f) -> vec3f {
  return vector + 2.0 * cross(rotation.xyz, cross(rotation.xyz, vector) + rotation.w * vector);
}
fn local(body: u32, vector: vec3f) -> vec3f {return rotate(vec4f(-orientations[body].xyz, orientations[body].w), vector);}
fn multiplyRotation(first: vec4f, second: vec4f) -> vec4f {return vec4f(first.w*second.xyz+second.w*first.xyz+cross(first.xyz,second.xyz),first.w*second.w-dot(first.xyz,second.xyz));}
fn colliderBody(collider: u32) -> u32 {return u32(bodies.colliders[collider].position.w);}
fn colliderPosition(collider: u32) -> vec3f {let body=colliderBody(collider);return positions[body].xyz+rotate(orientations[body],bodies.colliders[collider].position.xyz);}
fn colliderRotation(collider: u32) -> vec4f {return multiplyRotation(orientations[colliderBody(collider)],bodies.colliders[collider].orientation);}
fn colliderLocal(collider: u32, vector: vec3f) -> vec3f {let rotation=colliderRotation(collider);return rotate(vec4f(-rotation.xyz,rotation.w),vector);}
fn axis(collider: u32, index: u32) -> vec3f {var unit=vec3f(0);unit[index]=1;return rotate(colliderRotation(collider),unit);}
fn readGeometry(index:u32)->vec4f{return bitcast<vec4f>(bodies.geometry[index]);}
fn excludes(first:u32,second:u32)->bool {
 ${p?`if(first/${p}u!=second/${p}u){return true;}`:``}
 if(jointExcluded(colliderBody(first),colliderBody(second))){return true;}
 let range=bodies.exclusions[first];let start=u32(range.x);let count=u32(range.y);
 var lower=0u;var upper=count;
 loop{if(lower>=upper){break;}let middle=(lower+upper)/2u;let component=start+middle;
  if(u32(readGeometry(component/4u)[component%4u])<second){lower=middle+1u;}else{upper=middle;}}
 let component=start+lower;
 return lower<count && u32(readGeometry(component/4u)[component%4u])==second;
}
fn bodyCenter(body:u32)->vec3f {let metadata=bodies.bodies[body];return vec3f(metadata.inertia.w,metadata.motion.zw);}
fn dynamic(body: u32) -> bool {return bodies.bodies[body].motion.x==1.0;}
fn principalRotation(body: u32) -> vec4f {return multiplyRotation(orientations[body],bodies.bodies[body].inertiaOrientation);}
fn combineMaterial(first: f32, second: f32, firstPolicy: f32, secondPolicy: f32, friction: bool) -> f32 {
 let policy=min(firstPolicy,secondPolicy);
 if(policy==0.0) {return (first+second)*0.5;} if(policy==1.0) {return min(first,second);}
 if(policy==2.0) {return max(first,second);} if(policy==3.0) {return first*second;}
 return select(min(first,second),sqrt(first*second),friction);
}
fn frictionCoefficient(first: u32, second: u32, sliding: bool) -> f32 {
 let firstMaterial=bodies.colliders[first].material;let secondMaterial=bodies.colliders[second].material;
 return combineMaterial(select(firstMaterial.y,firstMaterial.z,sliding),select(secondMaterial.y,secondMaterial.z,sliding),bodies.colliders[first].policies.y,bodies.colliders[second].policies.y,true);
}
fn inverseInertia(body: u32, vector: vec3f) -> vec3f {
 let rotation=principalRotation(body);return rotate(rotation,rotate(vec4f(-rotation.xyz,rotation.w),vector)*bodies.bodies[body].inertia.xyz);
}
fn extent(body: u32, direction: vec3f) -> f32 {
 if(bodies.colliders[body].shape.w == 0.0) {return bodies.colliders[body].shape.x;}
 return dot(abs(colliderLocal(body,direction)), bodies.colliders[body].shape.xyz);
}
fn support(body: u32, direction: vec3f) -> vec3f {
 if(bodies.colliders[body].shape.w == 0.0) {return colliderPosition(body) + direction * bodies.colliders[body].shape.x;}
 let side=select(vec3f(-1),vec3f(1),colliderLocal(body,direction)>=vec3f(0));
 return colliderPosition(body) + rotate(colliderRotation(body), side*bodies.colliders[body].shape.xyz);
}
fn vertex(body: u32, index: u32) -> vec3f {
 let side=vec3f(select(-1.0,1.0,(index&1u)!=0u),select(-1.0,1.0,(index&2u)!=0u),select(-1.0,1.0,(index&4u)!=0u));
 return colliderPosition(body)+rotate(colliderRotation(body),side*bodies.colliders[body].shape.xyz);
}
fn pointVelocity(body: u32, point: vec3f) -> vec3f {
 return velocities[body].xyz+cross(angularVelocities[body].xyz,point-positions[body].xyz);
}
fn applyImpulse(body: u32, point: vec3f, impulse: vec3f) {
 if(!dynamic(body)) {return;}
 velocities[body]=vec4f(velocities[body].xyz+impulse*velocities[body].w,velocities[body].w);
 angularVelocities[body]=vec4f(angularVelocities[body].xyz+inverseInertia(body,cross(point-positions[body].xyz,impulse)),0);
}
fn impulseResponse(first:u32,second:u32,point:vec3f,direction:vec3f)->vec3f {
 let firstLever=point-positions[first].xyz;let secondLever=point-positions[second].xyz;
 return direction*(velocities[first].w+velocities[second].w)+
 cross(inverseInertia(first,cross(firstLever,direction)),firstLever)+cross(inverseInertia(second,cross(secondLever,direction)),secondLever);
}
fn effectiveMass(first:u32,second:u32,point:vec3f,direction:vec3f)->f32 {
 return dot(direction,impulseResponse(first,second,point,direction));
}
// Solve the coupled two-dimensional tangent response, then project the accumulated
// impulse into the static cone or onto the dynamic cone. No arbitrary slip-speed switch.
fn solveFriction(firstCollider:u32,secondCollider:u32,contact:Contact,relative:vec3f)->vec3f {
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
 let normal=contact.normal.xyz;let point=contact.point.xyz;
 let reference=select(vec3f(1,0,0),vec3f(0,1,0),abs(normal.x)>0.7);
 let firstTangent=normalize(cross(normal,reference));let secondTangent=cross(normal,firstTangent);
 let firstResponse=impulseResponse(first,second,point,firstTangent);
 let secondResponse=impulseResponse(first,second,point,secondTangent);
 let firstDiagonal=dot(firstTangent,firstResponse);let secondDiagonal=dot(secondTangent,secondResponse);
 let coupling=dot(firstTangent,secondResponse);let determinant=firstDiagonal*secondDiagonal-coupling*coupling;
 var increment=vec2f(0);
 let slip=vec2f(dot(relative,firstTangent),dot(relative,secondTangent));
 if(determinant>1e-6*firstDiagonal*secondDiagonal&&firstDiagonal>0.0&&secondDiagonal>0.0){
  increment=vec2f(secondDiagonal*slip.x-coupling*slip.y,firstDiagonal*slip.y-coupling*slip.x)/determinant;
 }else{
  // Locked inertia can make both coordinates describe one rotational DOF.
  // For a rank-one positive semidefinite K, K+ = K / trace(K)^2.
  let trace=firstDiagonal+secondDiagonal;
  if(trace>0.0){increment=vec2f((firstDiagonal/trace)*slip.x+(coupling/trace)*slip.y,(coupling/trace)*slip.x+(secondDiagonal/trace)*slip.y)/max(1e-30,trace);}
 }
 var tangent=contact.tangent.xyz-normal*dot(contact.tangent.xyz,normal)-firstTangent*increment.x-secondTangent*increment.y;
 let magnitude=length(tangent);let staticLimit=frictionCoefficient(firstCollider,secondCollider,false)*contact.impulse.x;
 if(magnitude>staticLimit){
  let dynamicLimit=frictionCoefficient(firstCollider,secondCollider,true)*contact.impulse.x;
  tangent*=min(1.0,dynamicLimit/max(1e-30,magnitude));
 }
 return tangent;
}
@compute @workgroup_size(64) fn integrate(@builtin(global_invocation_id) invocation: vec3u) {
 ${r&&!m?`if(invocation.x==0u){atomicStore(&meshTasks.count,0u);atomicStore(&meshTasks.overflow,0u);atomicStore(&meshTasks.unresolved,0u);atomicStore(&meshTasks.incomplete,0u);atomicStore(&targets.dispatch,0u);targets.vertical=1u;targets.depth=1u;}`:``}
 let work=invocation.x;if(work>=scheduledBodyCount()){return;}let body=scheduledBody(work);
 let rotation=orientations[body]; orientations[body]=select(vec4f(0,0,0,1),normalize(rotation),dot(rotation,rotation)>0.000001);
 if(bodies.bodies[body].motion.x==2.0 && targets.entries[body].position.w>0.0) {
  velocities[body]=vec4f((targets.entries[body].position.xyz-positions[body].xyz)/settings.gravity.w,0);
  var difference=multiplyRotation(targets.entries[body].orientation,vec4f(-rotation.xyz,rotation.w));
  if(difference.w<0.0) {difference=-difference;}
  let sine=length(difference.xyz); var angular=vec3f(0);
  if(sine>0.000001) {angular=difference.xyz*(2.0*atan2(sine,difference.w)/(sine*settings.gravity.w));}
  angularVelocities[body]=vec4f(angular,0);return;
 }
 if(!dynamic(body) || sleepStates[body].y>0.5) {return;}
 velocities[body]=vec4f(velocities[body].xyz+settings.gravity.xyz*settings.gravity.w*bodies.bodies[body].motion.y,velocities[body].w);
 velocities[body]=vec4f(velocities[body].xyz*exp(-f32(${l})*settings.gravity.w),velocities[body].w);
 angularVelocities[body]=vec4f(angularVelocities[body].xyz*exp(-f32(${u})*settings.gravity.w),angularVelocities[body].w);
}
// Keys describe analytic features or a deterministic cooked surface triangle.
// Anchor distance remains mandatory: equal face keys alone cannot transfer friction.
fn contactFeature(collider:u32,point:vec3f,normal:vec3f)->u32 {
 let shape=bodies.colliders[collider].shape;
 if(shape.w==0.0){return 1u;}
 if(shape.w==1.0){
  var key=0u;
  // The midpoint moves inside the box as depth changes. Identify its supporting
  // face/edge/vertex from the outward local normal, independently of penetration.
  let tolerance=max(abs(normal.x),max(abs(normal.y),abs(normal.z)))*1e-4;
  for(var component=0u;component<3u;component++){
   var side=0u;
   if(abs(normal[component])>tolerance){side=select(1u,2u,normal[component]>=0.0);}
   key+=side*(1u<<(component*2u));
  }
  return key+1u;
 }
 if(shape.w==6.0){return select(1u,2u,normal.y<0.0);}
 if(shape.w==4.0||shape.w==5.0){return select(select(2u,3u,point.y>shape.z*0.5-1e-6),1u,point.y< -shape.z*0.5+1e-6);}
 if(shape.w==3.0){return 0u;}
 var nearest=1e30;var feature=0u;
 // Bounded by cooked triangle count. Mesh callers can supply the exact triangle key.
 for(var triangle=0u;triangle<u32(bodies.colliders[collider].padding.w);triangle++){
  let first=triangleVertex(collider,triangle,0u);let second=triangleVertex(collider,triangle,1u);let third=triangleVertex(collider,triangle,2u);
  let crossProduct=cross(second-first,third-first);let magnitude=length(crossProduct);
  let separation=abs(dot(point-first,crossProduct))/max(magnitude,1e-20);
  let alignment=abs(dot(normal,crossProduct))/max(magnitude,1e-20);
  let score=separation+(1.0-alignment)*settings.solver.w;
  if(score<nearest){nearest=score;feature=triangle;}
 }
 return meshTriangleData(collider,feature)/8u;
}
fn cookedContactFeature(collider:u32,triangle:i32,fallback:u32)->u32 {
 if(triangle<0){return fallback;}
 return meshTriangleData(collider,u32(triangle))/8u;
}
fn storeFeatureContact(pair: u32, slot: u32, point: vec3f, normal: vec3f, depth: f32, previous: Manifold, firstCollider: u32, secondCollider: u32, firstTriangle:i32, secondTriangle:i32) {
 let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
 var contact: Contact; contact.point=vec4f(point,depth); contact.normal=vec4f(normal,0);
 let closing=dot(pointVelocity(second,point)-pointVelocity(first,point),normal);
 contact.normal.w=select(0.0,-closing*combineMaterial(bodies.colliders[firstCollider].material.x,bodies.colliders[secondCollider].material.x,bodies.colliders[firstCollider].policies.x,bodies.colliders[secondCollider].policies.x,false),closing < -settings.solver.z);
 // Match in material coordinates: common translation must not invalidate a contact.
 let firstAnchor=colliderLocal(firstCollider,point-colliderPosition(firstCollider));
 let secondAnchor=colliderLocal(secondCollider,point-colliderPosition(secondCollider));
 let firstFeature=cookedContactFeature(firstCollider,firstTriangle,contactFeature(firstCollider,firstAnchor,colliderLocal(firstCollider,normal)));
 let secondFeature=cookedContactFeature(secondCollider,secondTriangle,contactFeature(secondCollider,secondAnchor,colliderLocal(secondCollider,-normal)));
 contact.firstAnchor=vec4f(firstAnchor,f32(firstFeature));
 contact.secondAnchor=vec4f(secondAnchor,f32(secondFeature));
 var nearest=2.0*settings.solver.w*settings.solver.w; var found=false;
 for(var old=0u;old<previous.count;old++) {
  var used=false;
  for(var retained=0u;retained<max(slot,manifolds[pair].count);retained++) {if(retained!=slot&&manifolds[pair].contacts[retained].impulse.y==f32(old+1u)) {used=true;}}
  if(used) {continue;}
  let cached=previous.contacts[old];
  if(u32(cached.firstAnchor.w)!=firstFeature||u32(cached.secondAnchor.w)!=secondFeature){continue;}
  let firstDelta=cached.firstAnchor.xyz-firstAnchor;let secondDelta=cached.secondAnchor.xyz-secondAnchor;
  let firstDistance=dot(firstDelta,firstDelta);let secondDistance=dot(secondDelta,secondDelta);
  if(max(firstDistance,secondDistance)>settings.solver.w*settings.solver.w){continue;}
  let distance=firstDistance+secondDistance;
  if(distance<nearest && dot(cached.normal.xyz,normal)>0.95) {
   nearest=distance; contact.impulse=cached.impulse; contact.tangent=cached.tangent; contact.impulse.y=f32(old+1u); found=true;
  }
 }
 if(found) {
  contact.normal.w=0.0;
  contact.impulse.x*=settings.stability.x;contact.tangent=vec4f(contact.tangent.xyz*settings.stability.x,0);
  var tangent=contact.tangent.xyz-normal*dot(contact.tangent.xyz,normal);
  let limit=frictionCoefficient(firstCollider,secondCollider,false)*contact.impulse.x;
  if(length(tangent)>limit) {tangent*=limit/max(0.000001,length(tangent));}
  contact.tangent=vec4f(tangent,0);
 }
 manifolds[pair].contacts[slot]=contact;
}
struct BoxContactPatch { points:array<vec3f,16>, count:u32 }
fn clipBoxContact(reference:u32,incident:u32,faceAxis:u32,referenceNormal:vec3f,tolerance:f32)->BoxContactPatch {
 let referenceCenter=colliderPosition(reference)+referenceNormal*bodies.colliders[reference].shape[faceAxis];
 var incidentAxis=0u;var maximumAlignment=0.0;
 for(var index=0u;index<3u;index++) {let alignment=abs(dot(axis(incident,index),referenceNormal));if(alignment>maximumAlignment) {maximumAlignment=alignment;incidentAxis=index;}}
 let incidentNormal=axis(incident,incidentAxis)*select(1.0,-1.0,dot(axis(incident,incidentAxis),referenceNormal)>0.0);
 let incidentCenter=colliderPosition(incident)+incidentNormal*bodies.colliders[incident].shape[incidentAxis];
 let firstTangent=axis(incident,(incidentAxis+1u)%3u)*bodies.colliders[incident].shape[(incidentAxis+1u)%3u];
 let secondTangent=axis(incident,(incidentAxis+2u)%3u)*bodies.colliders[incident].shape[(incidentAxis+2u)%3u];
 var polygon: array<vec3f, 16>;var temporary: array<vec3f, 16>;
 polygon[0]=incidentCenter-firstTangent-secondTangent;polygon[1]=incidentCenter+firstTangent-secondTangent;
 polygon[2]=incidentCenter+firstTangent+secondTangent;polygon[3]=incidentCenter-firstTangent+secondTangent;
 var vertexCount=4u;
 for(var boundary=0u;boundary<4u;boundary++) {
  let tangentAxis=(faceAxis+1u+boundary/2u)%3u;
  let direction=axis(reference,tangentAxis)*select(-1.0,1.0,boundary%2u==0u);
  let limit=bodies.colliders[reference].shape[tangentAxis];var outputCount=0u;
  for(var index=0u;index<vertexCount;index++) {
   let start=polygon[index];let end=polygon[(index+1u)%vertexCount];
   let startDistance=dot(start-referenceCenter,direction)-limit;let endDistance=dot(end-referenceCenter,direction)-limit;
   if(startDistance<=0.0) {temporary[outputCount]=start;outputCount++;}
   if((startDistance<=0.0)!=(endDistance<=0.0)) {temporary[outputCount]=mix(start,end,startDistance/(startDistance-endDistance));outputCount++;}
  }
  vertexCount=outputCount;for(var index=0u;index<vertexCount;index++) {polygon[index]=temporary[index];}
 }
 var contactPatch:BoxContactPatch;
 for(var index=0u;index<vertexCount;index++) {if(dot(referenceCenter-polygon[index],referenceNormal)>=-tolerance) {contactPatch.points[contactPatch.count]=polygon[index];contactPatch.count++;}}
 return contactPatch;
}
fn storeContact(pair:u32,slot:u32,point:vec3f,normal:vec3f,depth:f32,previous:Manifold,first:u32,second:u32){
 storeFeatureContact(pair,slot,point,normal,depth,previous,first,second,-1,-1);
}
${pr(g)}
${i?mr:``}
${r?m?gr.replace(`for(var pair=0u;pair<PAIR_CAPACITY;pair++){`,`for(var index=0u;index<atomicLoad(&targets.reserved0);index++){let pair=targets.journalSlots[index];if(manifolds[pair].padding.z==0u){continue;}`):gr:``}
// SAT separates oriented boxes along all six face normals and nine edge cross products.
@compute @workgroup_size(64) fn collide(@builtin(global_invocation_id) invocation: vec3u) {
 ${i?`
 let candidate=invocation.x;if(candidate>=candidateCount()){return;}
 let colliders=candidatePair(candidate);let first=colliders.x;let second=colliders.y;
 if(bodies.colliders[first].material.w!=0.0||bodies.colliders[second].material.w!=0.0||first>=second||colliderBody(first)==colliderBody(second)||excludes(first,second)||excludes(second,first)||(!dynamic(colliderBody(first))&&!dynamic(colliderBody(second)))){return;}
 let pair=claimManifold(first,second);if(pair==DELETED_PAIR){return;}
 `:`
 let pair=invocation.x; if(pair>=PAIR_CAPACITY) {return;}
 let first=getFirstCollider(pair); let second=getSecondCollider(pair);
 `}
 var previous=manifolds[pair]; ${i?`previous.count=previous.previousCount;`:``} manifolds[pair].count=0u;
 ${r?`manifolds[pair].padding=vec3u(0);`:``}
 ${g?`
 // Only one side can be a static height field. Ignore ordinary mesh triangle offsets.
 let firstTerrain=bodies.colliders[first].padding;let secondTerrain=bodies.colliders[second].padding;
 let revision=max(select(0u,u32(firstTerrain.z),firstTerrain.y<0.0),select(0u,u32(secondTerrain.z),secondTerrain.y<0.0));
 if(previous.terrainRevision!=revision){previous.count=0u;}
 manifolds[pair].terrainRevision=revision;`:``}
 let firstBody=colliderBody(first);let secondBody=colliderBody(second);
 if(bodies.colliders[first].material.w!=0.0 || bodies.colliders[second].material.w!=0.0 || first>=second || firstBody==secondBody || (excludes(first,second)||excludes(second,first)) || (!dynamic(firstBody) && !dynamic(secondBody))) {return;}
 ${r?`manifolds[pair].padding=vec3u(0); if(bodies.colliders[first].shape.w>=2.0 || bodies.colliders[second].shape.w>=2.0){collideExtended(pair,first,second,previous);return;}`:``}
 let difference=colliderPosition(second)-colliderPosition(first);
 let firstSphere=bodies.colliders[first].shape.w==0.0; let secondSphere=bodies.colliders[second].shape.w==0.0;
 var normal=vec3f(0,0,1); var depth=1e20; var faceBody=first; var faceAxis=0u; var edgeContact=false;
 if(firstSphere && secondSphere) {
  let distance=length(difference); depth=bodies.colliders[first].shape.x+bodies.colliders[second].shape.x-distance;
  if(depth < -settings.solver.x) {return;}
  if(distance>0.000001) {normal=difference/distance;}
  let point=colliderPosition(first)+normal*(bodies.colliders[first].shape.x-depth*0.5);
  storeContact(pair,0u,point,normal,depth,previous,first,second); manifolds[pair].count=1u; return;
 }
 if(firstSphere || secondSphere) {
  let sphere=select(second,first,firstSphere); let box=select(first,second,firstSphere);
  let center=colliderLocal(box,colliderPosition(sphere)-colliderPosition(box)); let halfExtent=bodies.colliders[box].shape.xyz;
  var closest=clamp(center,-halfExtent,halfExtent); var delta=center-closest; let distance=length(delta);
  var boxNormal=vec3f(0,0,1);
  if(distance>0.000001) {boxNormal=rotate(colliderRotation(box),delta/distance);depth=bodies.colliders[sphere].shape.x-distance;}
  else {
   let distances=halfExtent-abs(center); var minimumAxis=0u;
   if(distances.y<distances.x) {minimumAxis=1u;} if(distances.z<distances[minimumAxis]) {minimumAxis=2u;}
   var localNormal=vec3f(0); localNormal[minimumAxis]=select(-1.0,1.0,center[minimumAxis]>=0.0);
   closest[minimumAxis]=localNormal[minimumAxis]*halfExtent[minimumAxis]; boxNormal=rotate(colliderRotation(box),localNormal);
   depth=bodies.colliders[sphere].shape.x+distances[minimumAxis];
  }
  if(depth < -settings.solver.x) {return;}
  normal=select(boxNormal,-boxNormal,firstSphere);
  storeContact(pair,0u,colliderPosition(box)+rotate(colliderRotation(box),closest),normal,depth,previous,first,second);
  manifolds[pair].count=1u;return;
 }
 for(var candidate=0u;candidate<15u;candidate++) {
  var direction=vec3f(0); var candidateBody=first; var candidateAxis=candidate;
  if(candidate<3u) {direction=axis(first,candidate);}
  else if(candidate<6u) {candidateBody=second;candidateAxis=candidate-3u;direction=axis(second,candidateAxis);}
  else {direction=cross(axis(first,(candidate-6u)/3u),axis(second,(candidate-6u)%3u));}
  let magnitude=length(direction);if(magnitude<0.0001) {continue;} direction/=magnitude;
  let overlap=extent(first,direction)+extent(second,direction)-abs(dot(difference,direction));
  if(overlap < -settings.solver.x) {return;}
  // Prefer face manifolds over nearly tied edge axes.
  if(overlap<depth-select(0.0,0.001,candidate>=6u)) {
   depth=overlap;normal=select(-direction,direction,dot(difference,direction)>=0.0);
   faceBody=candidateBody;faceAxis=candidateAxis;edgeContact=candidate>=6u;
  }
 }
 if(edgeContact) {
  // Closest points between the two supporting edge segments.
  var firstAxis=0u;var secondAxis=0u;var smallest=1e20;
  for(var horizontal=0u;horizontal<3u;horizontal++) {for(var vertical=0u;vertical<3u;vertical++) {
   let candidate=cross(axis(first,horizontal),axis(second,vertical));let magnitude=length(candidate);
   if(magnitude>0.0001) {let error=1.0-abs(dot(candidate/magnitude,normal));if(error<smallest) {smallest=error;firstAxis=horizontal;secondAxis=vertical;}}
  }}
  let firstDirection=axis(first,firstAxis);let secondDirection=axis(second,secondAxis);
  var firstCenter=support(first,normal);var secondCenter=support(second,-normal);
  firstCenter-=firstDirection*dot(firstCenter-colliderPosition(first),firstDirection);
  secondCenter-=secondDirection*dot(secondCenter-colliderPosition(second),secondDirection);
  let delta=firstCenter-secondCenter;let alignment=dot(firstDirection,secondDirection);let denominator=max(0.00001,1.0-alignment*alignment);
  var firstDistance=clamp((alignment*dot(secondDirection,delta)-dot(firstDirection,delta))/denominator,-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
  let secondDistance=clamp(dot(secondDirection,delta)+alignment*firstDistance,-bodies.colliders[second].shape[secondAxis],bodies.colliders[second].shape[secondAxis]);
  firstDistance=clamp(alignment*secondDistance-dot(firstDirection,delta),-bodies.colliders[first].shape[firstAxis],bodies.colliders[first].shape[firstAxis]);
  storeContact(pair,0u,(firstCenter+firstDirection*firstDistance+secondCenter+secondDirection*secondDistance)*0.5,normal,depth,previous,first,second);
  manifolds[pair].count=1u;return;
 }
 // Clip the incident face polygon against the four reference-face side planes.
 let reference=faceBody;let incident=select(first,second,reference==first);
 let referenceNormal=select(-normal,normal,reference==first);
 let referenceCenter=colliderPosition(reference)+referenceNormal*bodies.colliders[reference].shape[faceAxis];
 let contactPatch=clipBoxContact(reference,incident,faceAxis,referenceNormal,settings.solver.x);
 let acceptedCount=contactPatch.count;
 let contactCount=min(4u,acceptedCount);
 for(var index=0u;index<contactCount;index++) {
  let point=contactPatch.points[index*acceptedCount/contactCount];let separation=dot(referenceCenter-point,referenceNormal);
  storeContact(pair,index,point+referenceNormal*separation*0.5,normal,separation,previous,first,second);
 }
 manifolds[pair].count=contactCount;
}
${a?hr(!!m,h):``}
${(a||c)&&r?`@compute @workgroup_size(1) fn meshCollect(){collectMeshContacts();}`:``}
${s}
${a&&c?`@compute @workgroup_size(1) fn parallelJointWarm(){solveJoints(true);} @compute @workgroup_size(1) fn parallelJointSolve(){solveJoints(false);}`:``}
fn root(body: u32) -> u32 {var current=body;for(var iteration=0u;iteration<BODY_COUNT;iteration++) {let parent=u32(sleepStates[current].z);if(parent==current) {break;}current=parent;}return current;}
@compute @workgroup_size(1) fn solve() {
 ${r&&!c?`collectMeshContacts();`:``}
 // Connected components include dynamic bodies only: a shared static floor must not join islands.
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].z=f32(body);}
 for(var pair=0u;pair<PAIR_CAPACITY;pair++) {
  if(manifolds[pair].count==0u) {continue;}let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
  if(bodies.bodies[first].motion.x==2.0 && length(velocities[first].xyz)+length(angularVelocities[first].xyz)>0.000001 && dynamic(second)) {sleepStates[second].y=0.0;sleepStates[second].x=0.0;}
  if(bodies.bodies[second].motion.x==2.0 && length(velocities[second].xyz)+length(angularVelocities[second].xyz)>0.000001 && dynamic(first)) {sleepStates[first].y=0.0;sleepStates[first].x=0.0;}
  if(dynamic(first) && dynamic(second)) {let firstRoot=root(first);let secondRoot=root(second);sleepStates[max(firstRoot,secondRoot)].z=f32(min(firstRoot,secondRoot));}
 }
 ${c?`connectJoints();`:``}
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].w=1.0;}
 for(var body=0u;body<BODY_COUNT;body++) {if(dynamic(body) && sleepStates[body].y<0.5) {sleepStates[root(body)].w=0.0;}}
 for(var body=0u;body<BODY_COUNT;body++) {if(dynamic(body) && sleepStates[root(body)].w<0.5) {if(sleepStates[body].y>0.5) {sleepStates[body].x=0.0;}sleepStates[body].y=0.0;}}
 for(var pair=0u;pair<PAIR_CAPACITY;pair++) {
  if(manifolds[pair].count==0u){continue;}
  let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
  if((sleepStates[first].y>0.5 || !dynamic(first)) && (sleepStates[second].y>0.5 || !dynamic(second))) {continue;}
  for(var slot=0u;slot<manifolds[pair].count;slot++) {
   let contact=manifolds[pair].contacts[slot];let impulse=contact.normal.xyz*contact.impulse.x+contact.tangent.xyz;
   applyImpulse(first,contact.point.xyz,-impulse);applyImpulse(second,contact.point.xyz,impulse);
  }
 }
 ${c?`solveJoints(true);`:``}
 for(var iteration=0u;iteration<ITERATIONS;iteration++) {
  ${c?`solveJoints(false);`:``}
  for(var pair=0u;pair<PAIR_CAPACITY;pair++) {
   let firstCollider=getFirstCollider(pair);let secondCollider=getSecondCollider(pair);let first=colliderBody(firstCollider);let second=colliderBody(secondCollider);
   if((sleepStates[first].y>0.5 || !dynamic(first)) && (sleepStates[second].y>0.5 || !dynamic(second))) {continue;}
   for(var slot=0u;slot<manifolds[pair].count;slot++) {
    var contact=manifolds[pair].contacts[slot];let point=contact.point.xyz;let normal=contact.normal.xyz;
    let relative=pointVelocity(second,point)-pointVelocity(first,point);
    let bias=min(settings.stability.z,settings.stability.y*max(0.0,contact.point.w-settings.solver.x)/settings.gravity.w);
    if(effectiveMass(first,second,point,normal)<=0.0) {continue;}
    let increment=(max(bias,contact.normal.w)-dot(relative,normal))/max(1e-30,effectiveMass(first,second,point,normal));
    let accumulated=max(0.0,contact.impulse.x+increment);let change=accumulated-contact.impulse.x;contact.impulse.x=accumulated;
    applyImpulse(first,point,-normal*change);applyImpulse(second,point,normal*change);
    let tangent=solveFriction(firstCollider,secondCollider,contact,pointVelocity(second,point)-pointVelocity(first,point));
    let tangentChange=tangent-contact.tangent.xyz;contact.tangent=vec4f(tangent,0);
    applyImpulse(first,point,-tangentChange);applyImpulse(second,point,tangentChange);
    manifolds[pair].contacts[slot]=contact;
   }
  }
 }
}
// Exact constant-world-angular-velocity update. This removes the normalized Euler
// phase lag at high spin; torque-free asymmetric-body dynamics remain timestep dependent.
fn advanceOrientation(rotation:vec4f,angular:vec3f)->vec4f {
 let speed=length(angular);let halfAngle=speed*settings.gravity.w*0.5;
 let factor=select(settings.gravity.w*0.5,sin(halfAngle)/max(speed,1e-20),speed>1e-10);
 return normalize(multiplyRotation(vec4f(angular*factor,cos(halfAngle)),rotation));
}
fn finishBody(body:u32) {
  if(!bodyScheduled(body)||bodies.bodies[body].motion.x==0.0 || sleepStates[body].y>0.5) {return;}
  if(bodies.bodies[body].motion.x==2.0) {
   if(targets.entries[body].position.w>0.0) {positions[body]=vec4f(targets.entries[body].position.xyz,positions[body].w);orientations[body]=targets.entries[body].orientation;}
   else {positions[body]=vec4f(positions[body].xyz+velocities[body].xyz*settings.gravity.w,positions[body].w);let rotation=orientations[body];let angular=angularVelocities[body].xyz;orientations[body]=advanceOrientation(rotation,angular);}
   return;
  }
  positions[body]=vec4f(positions[body].xyz+velocities[body].xyz*settings.gravity.w,positions[body].w);
  let rotation=orientations[body];let angular=angularVelocities[body].xyz;
  let inversePrincipalInertia=bodies.bodies[body].inertia.xyz;
  let movableAxes=inversePrincipalInertia>vec3f(0);
  let principal=principalRotation(body);
  let principalAngular=rotate(vec4f(-principal.xyz,principal.w),angular);
  let principalMomentum=principalAngular/select(vec3f(1),inversePrincipalInertia,movableAxes);
  let momentum=rotate(principal,select(vec3f(0),principalMomentum,movableAxes));
  orientations[body]=advanceOrientation(rotation,angular);
  // Preserve world angular momentum as the inertia tensor rotates.
  // Infinite inertia blocks torque response without erasing prescribed spin.
  let preservedSpin=rotate(principalRotation(body),select(principalAngular,vec3f(0),movableAxes));
  angularVelocities[body]=vec4f(inverseInertia(body,momentum)+preservedSpin,0);
  let quiet=length(velocities[body].xyz)<settings.sleep.y && length(angular)<settings.sleep.z;
  sleepStates[body].x=select(0.0,sleepStates[body].x+settings.gravity.w,quiet);
 }
@compute @workgroup_size(1) fn finish() {
 for(var body=0u;body<BODY_COUNT;body++){finishBody(body);}
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].w=1.0;}
 for(var body=0u;body<BODY_COUNT;body++) {if(dynamic(body) && (jointActive(body) || settings.sleep.x<=0.0 || sleepStates[body].x<settings.sleep.x)) {sleepStates[root(body)].w=0.0;}}
 for(var body=0u;body<BODY_COUNT;body++) {
  if(dynamic(body) && sleepStates[root(body)].w>0.5) {sleepStates[body].y=1.0;velocities[body]=vec4f(0,0,0,velocities[body].w);angularVelocities[body]=vec4f(0);}
 }
}
`}function yr(e,t=0){let n=(e.length-4)/16,r=e[0],i=Math.max(t,r-n),a=new Float32Array(e.buffer,e.byteOffset,e.length),o=[];for(let t=i;t<r;t++){let r=4+t%n*16;o.push({sequence:e[r],step:e[r+1],phase:e[r+2]===0?`begin`:e[r+2]===1?`impact`:`end`,bodies:[e[r+4],e[r+5]],colliders:[e[r+6],e[r+7]],point:[a[r+8],a[r+9],a[r+10]],normalImpulse:a[r+11],normal:[a[r+12],a[r+13],a[r+14]]})}return{sequence:r,step:e[1],dropped:Math.max(0,r-t-n),saturated:e[2]!==0,events:o}}function br(e,t,n=!1,r){return`
${n?`@group(0) @binding(14) var<storage,read> eventStatistics:array<u32>;`:``}
struct ContactEvent { stamp:vec4u, identifiers:vec4u, point:vec4f, normal:vec4f }
struct EventRing { sequence:u32, step:u32, saturated:u32, reserved:u32, entries:array<ContactEvent,${e}> }
@group(0) @binding(12) var<storage,read_write> contactHistory:array<vec4u>;
@group(0) @binding(13) var<storage,read_write> contactEvents:EventRing;
const CONTACT_END:u32=1u;
const CONTACT_BEGIN:u32=2u;
const CONTACT_IMPACT:u32=4u;
const CONTACT_PROCESS:u32=8u;

fn eventCommit()->bool{
 return ${n?`eventStatistics[1]==0u&&eventStatistics[15]==0u`:`true`};
}
fn contactImpulse(pair:u32)->vec2f{
 var impulse=0.0;var strongest=0u;
 for(var contact=0u;contact<manifolds[pair].count;contact++){
  impulse+=max(0.0,manifolds[pair].contacts[contact].impulse.x);
  if(manifolds[pair].contacts[contact].impulse.x>manifolds[pair].contacts[strongest].impulse.x){strongest=contact;}
 }
 return vec2f(impulse,f32(strongest));
}
fn eventClassify(pair:u32)->u32{
 if(!eventCommit()){return 0u;}
 ${r?`let instance=pair/${r}u;
 if(instance>=INSTANCE_COUNT||atomicLoad(&ensemble[16u+instance*8u+7u])!=0u){return 0u;}`:``}
 let first=getFirstCollider(pair);let second=getSecondCollider(pair);
 if(!colliderScheduled(first)){return 0u;}
 let previous=contactHistory[pair];let hasContact=manifolds[pair].count>0u;
 let same=previous.x==first&&previous.y==second;
 var flags=CONTACT_PROCESS;
 if(previous.z!=0u&&(!hasContact||!same)){flags|=CONTACT_END;}
 if(hasContact){
  if(previous.z==0u||!same){flags|=CONTACT_BEGIN;}
  else if(contactImpulse(pair).x>${t}){flags|=CONTACT_IMPACT;}
 }
 return flags;
}
fn eventCount(flags:u32)->u32{return countOneBits(flags&7u);}
fn emitContact(sequence:u32,step:u32,first:u32,second:u32,phase:u32,point:vec3f,normal:vec3f,impulse:f32){
 let slot=(sequence-1u)%${e}u;
 contactEvents.entries[slot]=ContactEvent(vec4u(sequence,step,phase,0),vec4u(colliderBody(first),colliderBody(second),first,second),vec4f(point,impulse),vec4f(normal,0));
}
fn eventPublish(pair:u32,flags:u32,offset:u32,reservation:vec3u){
 if((flags&CONTACT_PROCESS)==0u){return;}
 let first=getFirstCollider(pair);let second=getSecondCollider(pair);
 if((flags&CONTACT_END)!=0u){
  let sequence=retainedEventSequence(reservation,offset);
  if(sequence!=0u){
   let previous=contactHistory[pair];
   emitContact(sequence,reservation.z,previous.x,previous.y,2u,vec3f(0),vec3f(0),0);
  }
 }
 if((flags&(CONTACT_BEGIN|CONTACT_IMPACT))!=0u){
  let sequence=retainedEventSequence(reservation,offset+select(0u,1u,(flags&CONTACT_END)!=0u));
  if(sequence!=0u){
   let impulse=contactImpulse(pair);
   let contact=manifolds[pair].contacts[u32(impulse.y)];
   let phase=select(1u,0u,(flags&CONTACT_BEGIN)!=0u);
   emitContact(sequence,reservation.z,first,second,phase,contact.point.xyz,contact.normal.xyz,impulse.x);
  }
 }
 contactHistory[pair]=vec4u(first,second,select(0u,1u,manifolds[pair].count>0u),0u);
}
`}async function xr(e,t,n,r){let i=e.createBuffer({id:`${t.id}-snapshot`,byteLength:16+n.byteLength,usage:P.MAP_READ|P.COPY_DST});try{let a=e.createCommandEncoder();return a.copyBufferToBuffer({sourceBuffer:t,destinationBuffer:i,size:16}),a.copyBufferToBuffer({sourceBuffer:n,destinationBuffer:i,destinationOffset:16,size:n.byteLength}),e.submit(a.finish()),await i.mapAndReadAsync(e=>{let t=new Uint32Array(e);return r({sequence:t[0],step:t[1],saturated:t[2]!==0},t.subarray(4))})}finally{i.destroy()}}function Sr(e){return e.shape.type===`sphere`||e.shape.type===`box`}function Cr(e){let t=e?2**Math.ceil(Math.log2(e)):0;return{leafCapacity:t,nodeCount:Math.max(0,t*2-1)}}function wr(e){if(!e)return 0;let{leafCapacity:t,nodeCount:n}=Cr(e);return e*24+n*32+t*4+8}function Tr(e,t){let n=[],r=[],i=[1/0,1/0,1/0],a=[-1/0,-1/0,-1/0];for(let[o,s]of e.entries()){if(!Sr(s)){r.push(o);continue}let e=t[s.body],c=s.position?jn(V(e.orientation),s.position):[0,0,0],l=e.position.map((e,t)=>e+c[t]);for(let e=0;e<3;e++)i[e]=Math.min(i[e],l[e]),a[e]=Math.max(a[e],l[e]);n.push({index:o,center:l,key:0})}for(let e of n)for(let t=0;t<3;t++){let n=a[t]-i[t],r=n>0?Math.floor((e.center[t]-i[t])/n*1023):0;for(let n=0;n<10;n++)e.key|=(r>>n&1)<<3*n+t}n.sort((e,t)=>e.key-t.key);let o=Uint32Array.from([...n.map(e=>e.index),...r]),s=new Uint32Array(o.length);for(let[e,t]of o.entries())s[t]=e;return{indices:o,ranks:s,indexedCount:n.length}}function Er(e){return`
@group(0) @binding(24) var<storage,read_write> sourceMinima:array<f32>;
@group(0) @binding(25) var<storage,read_write> sourceMaxima:array<f32>;
@group(0) @binding(30) var<storage,read> batchCommands:array<Query>;

@compute @workgroup_size(64) fn gatherCastBounds(@builtin(global_invocation_id) invocation:vec3u){
 let row=invocation.x;
 if(row>=${e}u){return;}
 let largest=0x1.fffffep127f;
 var lower=vec3f(largest);
 var upper=vec3f(-largest);
 if(row<batchCommands[0].settings.y){
  let collider=querySelection[row];
  let center=colliderPosition(collider);
  let shape=bodies.colliders[collider].shape;
  var extent=vec3f(shape.x);
  if(shape.w==1.0){extent=shapeWorldExtent(collider);}
  // Cover float32 pose and slab arithmetic, including the narrow phase's
  // near-tangent sphere sweep tolerance.
  let padding=max(vec3f(1e-7),(abs(center)+extent)*2e-6);
  lower=center-extent-padding;
  upper=center+extent+padding;
  if(!all(abs(lower)<=vec3f(largest))||!all(abs(upper)<=vec3f(largest))){
   lower=vec3f(-largest);
   upper=vec3f(largest);
  }
 }
 for(var coordinate=0u;coordinate<3u;coordinate++){
  sourceMinima[row*3u+coordinate]=lower[coordinate];
  sourceMaxima[row*3u+coordinate]=upper[coordinate];
 }
}
`}function Dr(e,{id:t,source:n,layout:r,buffers:i,indexedCount:a}){let o=new pe(e,{id:t}),s=Object.fromEntries(Object.entries(i).map(([e,t])=>[e,o.importBuffer({id:e,byteLength:t.byteLength,usage:t.usage},t)])),{leafCapacity:c,nodeCount:l}=Cr(a);function u(e,t,n){let r=t===`float32x3`?12:t===`uint32x2`?8:4;return o.createDataView(o.createTransientBuffer({id:e,byteLength:n*r,usage:P.STORAGE}),{format:t,length:n})}let d=new tn({id:t,leafCapacity:c,minima:u(`source-minima`,`float32x3`,a),maxima:u(`source-maxima`,`float32x3`,a),nodeMinima:u(`node-minima`,`float32x3`,l),nodeMaxima:u(`node-maxima`,`float32x3`,l),nodeChildren:u(`children`,`uint32x2`,l),leafIds:u(`leaf-ids`,`uint32`,c),count:u(`count`,`uint32`,1),overflow:u(`overflow`,`uint32`,1)});function f(n,i,a,s,c){let l=[...r,{name:`sourceMinima`,group:0,location:24,type:`storage`},{name:`sourceMaxima`,group:0,location:25,type:`storage`},{name:`nodeMinima`,group:0,location:26,type:`read-only-storage`},{name:`nodeMaxima`,group:0,location:27,type:`read-only-storage`}].filter(e=>e.name in a);o.addComputePass({id:`${t}-${n}`,resources:Object.entries(a).map(([e,t])=>({buffer:t,usage:s.includes(e)?`storage-read-write`:`storage-read`})),compile:()=>{let r=new we(e,{id:`${t}-${n}`,source:i,entryPoint:n,shaderLayout:{bindings:l}});return{encode:({computePass:e,getBuffer:t,parameters:n})=>r.dispatch(e,{bindings:Object.fromEntries(Object.entries(a).map(([e,n])=>[e,t(n)])),x:c??n}),destroy:()=>r.destroy()}}})}let{batchResults:p,...m}=s;return f(`gatherCastBounds`,n+Er(a),{...m,sourceMinima:d.minima.buffer,sourceMaxima:d.maxima.buffer},[`sourceMinima`,`sourceMaxima`],Math.ceil(a/64)),o.add(d),f(`castBatch`,n+Hn(c),{...s,nodeMinima:d.nodeMinima.buffer,nodeMaxima:d.nodeMaxima.buffer},[`batchResults`]),o.compile()}var Or=class{worldOrigin=[0,0,0];id;count;timeStep;colliderCount;colliderStorageCount;broadPhase;solver;maximumPairs;poseMatrices=null;poseBounds=null;encodePosePublication;positions=null;orientations=null;velocities=null;angularVelocities=null;sleepStates=null;contactEvents=null;triggerHistory=null;contactHistory=null;triggerSnapshotRead=null;contactSnapshotRead=null;triggerEvents=null;triggerCursor=0;triggerRead=null;eventCursor=0;eventRead=null;queryComputation=null;queryReduction=null;batchCast=null;batchCastIndex=null;batchCastOrder=null;batchCastIndexEstimate;batchCastCommands=null;batchCastResults=null;vehicles;multiSurfaceVehicles;vehiclesPerInstance;vehicleBuffer=null;querySettings=null;querySelection=null;queryOutput=null;queryPending=!1;targets=null;simulationStatistics=null;colliders;bodyColliderStarts;ensembleTerrainSlots;props;ownedBuffers=[];allocationPlan;ensembleBuffer=null;heightFieldSlots=new Map;terrainRevision=1;terrainWake=null;terrainAtlas;terrainAtlasWord=0;terrainGeometryWord=0;ensembleResetOrigin;ensembleReset;initialEnsembleBodies;manifolds=null;meshTasks=null;parallelState=null;parallelDispatch=null;device=null;control=null;invalidation=null;controlSettings=null;destroyed=!1;colliderShapeScales=new Map;gpuCheckpoints=new Set;broadPhaseCounters=null;constructor(e){let t=e.queryBatchCapacity??0;if(!Number.isSafeInteger(t)||t<0||t>65535||t>0&&!e.enableQueries||e.queryBatchIndex&&t===0)throw Error(`Invalid collision cast batch capacity`);for(let t of[e.linearDamping??0,e.angularDamping??0])if(!Number.isFinite(t)||t<0)throw Error(`Invalid damping`);if(e.publicationBounds&&(e.publicationBounds.length!==e.bodies.length||e.publicationBounds.some(e=>e.some(e=>e.length!==3||!e.every(e=>Number.isFinite(Math.fround(e))))||e[0].some((t,n)=>t>e[1][n]))))throw Error(`Invalid publication bounds`);if(this.id=e.id??`gpu-rigid-body-world`,this.count=e.bodies.length,this.solver=e.solver??`ordered`,![`ordered`,`parallel`].includes(this.solver))throw Error(`Invalid rigid-body solver`);if(![`scalar`,`block`].includes(e.parallelContactSolver??`scalar`))throw Error(`Invalid parallel contact solver`);qn(e.joints??[],e.bodies,this.solver);let n=e.bodies.reduce((e,t)=>e+(t.colliders?.length??1),0);this.broadPhase=e.broadPhase??(Math.max(this.count,n)>128?`hierarchical-grid`:`all-pairs`),this.timeStep=e.timeStep??1/120;let r=e.iterations??16;if([e.warmStartFactor??1,e.penetrationRecoveryFraction??.15,e.parallelRelaxation??1].some(e=>!Number.isFinite(e)||e<0||e>1)||e.parallelRelaxation===0||!Number.isFinite(e.maximumRecoverySpeed??2)||(e.maximumRecoverySpeed??2)<0)throw Error(`Invalid rigid-body stability settings`);if(e.failurePolicy&&![`report`,`rollback`].includes(e.failurePolicy))throw Error(`Invalid failure policy`);let i=e.eventCapacity??0;if(!Number.isInteger(i)||i<0||i>65536||!Number.isFinite(e.impactImpulseThreshold??1)||(e.impactImpulseThreshold??1)<0)throw Error(`Invalid contact event settings`);let a=e.maximumMeshTraversalTestsPerPair??65536;if(!Number.isInteger(a)||a<1||a>1048576)throw Error(`Invalid mesh traversal budget`);let o=e.maximumCandidateTestsPerCollider??4096;if(!Number.isInteger(o)||o<1||o>65535)throw Error(`Invalid rigid-body traversal budget`);if(this.count<1||this.count>(this.broadPhase===`all-pairs`?128:65535)||!(this.timeStep>0)||!Number.isFinite(this.timeStep)||!Number.isInteger(r)||r<1||r>64)throw Error(`Invalid rigid-body capacity or timestep`);let s=[];for(let[t,n]of e.bodies.entries()){if(!Number.isFinite(n.mass??1)||(n.mass??1)<0)throw Error(`Invalid rigid body mass`);if(n.shape?n.colliders!==void 0:n.colliders===void 0)throw Error(`Supply shape or colliders`);let e=n.colliders??(n.shape?[{shape:n.shape}]:[]);for(let r of e){if(r.shape.type===`height-field`&&(n.mode??(n.mass===0?`static`:`dynamic`))!==`static`)throw Error(`Height fields require static bodies`);let e=_n(r.shape);if(!Number.isFinite(e.volume)||!e.center.every(Number.isFinite)||!e.tensor.every(Number.isFinite))throw Error(`Invalid shape properties`);if((r.shape.type===`convex-hull`||r.shape.type===`triangle-mesh`)&&n.mode!==`static`&&n.mass!==0&&(!(e.volume>0)||(r.shape.type===`convex-hull`||r.shape.type===`triangle-mesh`)&&!r.shape.geometry.closed))throw Error(`Dynamic meshes require closed positive-volume geometry`);if(V(r.orientation),!(r.position??[]).every(Number.isFinite))throw Error(`Invalid collider position`);let i=r.material;if([i?.staticFriction??.6,i?.dynamicFriction??.6,i?.restitution??.1].some(e=>!Number.isFinite(e)||e<0)||(i?.restitution??.1)>1)throw Error(`Invalid collider material`);s.push({...r,body:t})}if(V(n.orientation),V(n.inertiaOrientation),n.inertiaOrientation&&!n.inertiaDiagonal)throw Error(`Inertia orientation requires diagonal`);if(!(n.centerOfMass??[]).every(Number.isFinite)||(n.inertiaDiagonal??[]).some(e=>!Number.isFinite(e)||e<0)||!Number.isFinite(n.gravityFactor??1))throw Error(`Invalid mass properties`);if(![...n.position,...n.velocity??[],...n.angularVelocity??[],...n.orientation??[]].every(Number.isFinite)||!Number.isFinite(n.friction??.6)||(n.friction??.6)<0||!Number.isFinite(n.restitution??.1)||(n.restitution??.1)<0||(n.restitution??.1)>1)throw Error(`Invalid rigid body`)}if(!(e.gravity??[0,0,-9.81]).every(Number.isFinite)||[e.contactSlop??.002,e.contactMatchDistance??.05,e.restitutionThreshold??.5,e.sleepAfter??.5,e.sleepLinearSpeed??.04,e.sleepAngularSpeed??.04].some(e=>!Number.isFinite(e)||e<0))throw Error(`Invalid rigid-body settings`);if(s.length>(this.broadPhase===`all-pairs`?128:65535))throw Error(`Rigid-body collider capacity exceeded`);for(let e of s)if(e.excludedColliders?.some(e=>!Number.isInteger(e)||e<0||e>=s.length))throw Error(`Invalid collider filter`);if(e.collisionPartitionSize!==void 0&&(!Number.isSafeInteger(e.collisionPartitionSize)||e.collisionPartitionSize<1||!s.length||s.length%e.collisionPartitionSize!==0||e.joints?.length||e.continuous||e.triggers?.length))throw Error(`Invalid collision partitions`);if(e.ensembleBodiesPerInstance!==void 0&&(!Number.isSafeInteger(e.ensembleBodiesPerInstance)||e.ensembleBodiesPerInstance<1||this.count%e.ensembleBodiesPerInstance!==0||!e.collisionPartitionSize||this.count/e.ensembleBodiesPerInstance!==s.length/e.collisionPartitionSize||this.solver!==`parallel`||this.broadPhase!==`hierarchical-grid`))throw Error(`Invalid ensemble scheduling layout`);if(this.colliderCount=s.length,this.colliderStorageCount=Math.max(1,s.length),s.length||s.push({body:0,shape:{type:`box`,halfExtents:[0,0,0]}}),this.maximumPairs=this.broadPhase===`all-pairs`?this.colliderStorageCount*this.colliderStorageCount:e.maximumPairs??2**Math.ceil(Math.log2(Math.max(64,this.colliderStorageCount*16))),![`all-pairs`,`hierarchical-grid`].includes(this.broadPhase)||!Number.isSafeInteger(this.maximumPairs)||this.maximumPairs<1||this.maximumPairs>1073741824||this.broadPhase===`hierarchical-grid`&&this.maximumPairs&this.maximumPairs-1)throw Error(`Invalid rigid-body pair capacity`);let c=e.ensemblePairsPerInstance;if(c!==void 0&&(!e.ensembleBodiesPerInstance||e.failurePolicy!==`rollback`||!Number.isSafeInteger(c)||c<1||c*(this.count/e.ensembleBodiesPerInstance)>this.maximumPairs||c&c-1))throw Error(`Invalid ensemble instance contact capacity`);if(e.continuous){if(e.failurePolicy!==`rollback`||!Number.isInteger(e.continuous.maximumImpacts??4)||(e.continuous.maximumImpacts??4)<1||(e.continuous.maximumImpacts??4)>16||![`sphere-static`,`convex`].includes(e.continuous.mode??`sphere-static`)||!Number.isSafeInteger(e.continuous.maximumCandidates??this.maximumPairs)||(e.continuous.maximumCandidates??this.maximumPairs)<1||(e.continuous.maximumCandidates??this.maximumPairs)>1073741824||e.continuous.mode===`convex`&&(e.joints?.length||s.some(e=>[`plane`,`triangle-mesh`,`height-field`].includes(e.shape.type))))throw Error(`Invalid continuous settings`);for(let t of e.continuous.bodies){let n=e.bodies[t],r=s.filter(e=>e.body===t);if(!Number.isInteger(t)||!n||(n.mode??((n.mass??1)===0?`static`:`dynamic`))!==`dynamic`||n.mass===0||r.length!==1||r[0].isTrigger||e.continuous.mode!==`convex`&&r[0].shape.type!==`sphere`||e.continuous.mode!==`convex`&&(r[0].position??[0,0,0]).some((e,t)=>e!==(n.centerOfMass??[0,0,0])[t]))throw Error(`Invalid continuous body geometry`)}}if(e.triggers?.length){if(e.failurePolicy!==`rollback`||!Number.isInteger(e.triggerEventCapacity??256)||(e.triggerEventCapacity??256)<1||(e.triggerEventCapacity??256)>65536)throw Error(`Invalid trigger settings`);or(e.triggers,s)}let l=structuredClone({colliders:s,props:e});if(this.props=l.props,this.colliders=l.colliders,this.batchCastIndexEstimate=this.props.queryBatchIndex&&this.colliderCount?wr(this.colliders.filter(Sr).length):0,this.ensembleTerrainSlots=new Set(this.props.ensembleTerrainSlots),this.ensembleTerrainSlots.size&&(!this.props.ensembleBodiesPerInstance||[...this.ensembleTerrainSlots].some(e=>this.colliders[e]?.shape.type!==`height-field`)))throw Error(`Invalid ensemble terrain slots`);this.props.ensembleTerrainAtlas&&(this.terrainAtlas=new On(this.props.ensembleTerrainAtlas,Array.from(this.ensembleTerrainSlots,e=>{let t=this.colliders[e].shape;if(t.type!==`height-field`)throw Error(`Invalid ensemble terrain slot`);return{collider:e,width:t.field.width,height:t.field.height}}))),this.bodyColliderStarts=new Uint32Array(this.count+1);let u=0;for(let e=0;e<this.count;e++)for(this.bodyColliderStarts[e]=u;this.colliders[u]?.body===e;)u++;if(this.bodyColliderStarts[this.count]=u,this.props.vehicle&&this.props.vehicles)throw Error(`Choose vehicle or vehicles`);this.vehicles=this.props.vehicles??(this.props.vehicle?[this.props.vehicle]:[]),this.multiSurfaceVehicles=this.vehicles.some(e=>e.additionalTerrainColliders?.length);let d=e.ensembleBodiesPerInstance,f=e.collisionPartitionSize;if(this.vehiclesPerInstance=d?this.vehicles.length/(this.count/d):0,!Number.isInteger(this.vehiclesPerInstance))throw Error(`Invalid ensemble vehicle layout`);let p=new Set;for(let[e,t]of this.vehicles.entries()){let n=d?Math.floor(e/this.vehiclesPerInstance):0,r=[t.terrainCollider,...t.additionalTerrainColliders??[]],i=this.props.bodies[t.chassis];if(!i||p.has(t.chassis)||r.length>4||new Set(r).size!==r.length||r.some(e=>{let t=this.colliders[e];return!(t&&this.props.bodies[t.body])||t.isTrigger||this.getBodyMode(t.body)!==`static`||d&&Math.floor(e/f)!==n})||(i.mode??(i.mass===0?`static`:`dynamic`))!==`dynamic`||t.wheels.length!==4||d&&Math.floor(t.chassis/d)!==n||![t.radius,t.travel,t.springRate,t.wheelInertia].every(e=>Number.isFinite(e)&&e>0)||![t.damping,t.grip,t.motorTorque,t.brakeTorque].every(e=>Number.isFinite(e)&&e>=0)||t.steeringWheelbase!==void 0&&(!Number.isFinite(Math.fround(t.steeringWheelbase))||t.steeringWheelbase<=0)||!Number.isFinite(Math.fround(t.antiRollRate??0))||(t.antiRollRate??0)<0||t.slipGain!==void 0&&(t.slipGain.length!==2||!t.slipGain.every(e=>Number.isFinite(Math.fround(e))&&e>=0))||t.wheels.some(e=>e.mount.length!==3||!e.mount.every(Number.isFinite)))throw Error(`Invalid vehicle configuration`);p.add(t.chassis)}e.ensembleBodiesPerInstance&&(this.initialEnsembleBodies=this.props.bodies.slice(0,e.ensembleBodiesPerInstance))}getVehicleByteLength(){return this.vehicles.length*(512+(this.multiSurfaceVehicles?16:0))}getStorageLayout(){let e=An(this.colliders,!!this.props.ensembleBodiesPerInstance,this.ensembleTerrainSlots,!!this.terrainAtlas),t=e.geometry.length+(this.terrainAtlas?.wordLength??0);if(this.terrainAtlas&&t>=2**26)throw Error(`Terrain atlas exceeds address capacity`);let n=this.broadPhase===`hierarchical-grid`,r=this.colliders.some(e=>e.shape.type!==`sphere`&&e.shape.type!==`box`||e.isTrigger&&e.shape.type!==`sphere`),i=this.solver===`parallel`,a={packed:e,sparse:n,extended:r,parallel:i,...Xn(this.count,this.colliderStorageCount,this.maximumPairs,t,n,r,i,this.props.eventCapacity??0,this.props.enableQueries??!1,this.props.failurePolicy===`rollback`,!!this.props.continuous,this.props.joints?.length??0,this.props.ensembleBodiesPerInstance?this.count/this.props.ensembleBodiesPerInstance:0,!!this.props.ensemblePairsPerInstance,this.props.queryBatchCapacity)};if(this.vehicles.length){let e=this.getVehicleByteLength();a.buffers.push({name:`vehicle`,byteLength:e,uniform:!1}),this.props.failurePolicy===`rollback`&&a.buffers.push({name:this.vehiclesPerInstance?`checkpoint-vehicles`:`checkpoint-7`,byteLength:this.vehiclesPerInstance?this.vehicles.length*512:e,uniform:!1})}this.props.continuous?.mode===`convex`&&(a.buffers=a.buffers.filter(e=>e.name!==`continuous-previous`),a.buffers.push({name:`continuous-dispatch`,byteLength:16,uniform:!1}),a.buffers.push({name:`continuous-work`,byteLength:64+2**Math.ceil(Math.log2(Math.max(1,this.colliders.length)))*32+this.count*64+(this.props.continuous.maximumCandidates??this.maximumPairs)*48,uniform:!1})),(this.props.publicationBounds||this.props.publishPoses)&&a.buffers.push({name:`pose-metadata`,byteLength:this.count*48,uniform:!1},{name:`pose-matrices`,byteLength:this.count*64,uniform:!1},{name:`pose-bounds`,byteLength:this.count*32,uniform:!1});let o=this.props.triggers?.length?or(this.props.triggers,this.colliders):void 0;return o&&a.buffers.push({name:`trigger-previous`,byteLength:this.colliderStorageCount*16,uniform:!1},{name:`trigger-groups`,byteLength:o.groups.byteLength,uniform:!1},{name:`trigger-pairs`,byteLength:o.pairs.byteLength,uniform:!1},{name:`trigger-samples`,byteLength:Math.max(1,o.count)*16,uniform:!1},{name:`trigger-history`,byteLength:Math.max(1,o.count)*16,uniform:!1},{name:`trigger-events`,byteLength:16+(this.props.triggerEventCapacity??256)*32,uniform:!1}),this.props.ensembleBodiesPerInstance&&a.buffers.push({name:`ensemble`,byteLength:(16+9*this.count/this.props.ensembleBodiesPerInstance)*4,uniform:!1}),this.props.ensembleBodiesPerInstance&&a.buffers.push({name:`ensemble-buckets`,byteLength:(2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2)))+this.colliderStorageCount+2)*4,uniform:!1}),{...a,triggerLayout:o}}initializeEnsembleReset(){if(!this.device||!this.ensembleBuffer||this.destroyed)throw Error(`World has no ensemble scheduler`);return this.ensembleResetOrigin??=this.origin,this.ensembleReset??=Cn(this.device,this.id,this.ownedBuffers,this.count,this.props.ensembleBodiesPerInstance,this.props.collisionPartitionSize,this.maximumPairs,this.vehiclesPerInstance,this.ensembleTerrainSlots,this.props.ensemblePairsPerInstance),this.ensembleReset.byteLength}resetEnsembleInstance(e){if(this.assertEnsembleInstance(e),!this.ensembleReset)throw Error(`Ensemble reset image unavailable`);let t=e*this.props.ensembleBodiesPerInstance,n=e*this.props.collisionPartitionSize,r=n,i=this.initialEnsembleBodies.map(e=>{let{shape:t,colliders:i,...a}=e,o=e=>{let t=r++,{body:i,...a}=this.colliders[t];return this.ensembleTerrainSlots.has(t)?a:{...e,shape:e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`?a.shape:e.shape,excludedColliders:e.excludedColliders?.map(e=>e+n)}};return t&&!this.ensembleTerrainSlots.has(r)?{...e,shape:o({shape:t}).shape}:{...a,colliders:(i??[{shape:t}]).map(o)}}),a=this.props.bodies;a.splice(t,i.length,...i),this.restoreColliderDefinitions(t,t+i.length);let o=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);for(let e=n;e<r;e++){if(this.colliderShapeScales.delete(e),!this.ensembleTerrainSlots.has(e))continue;let t=this.colliders[e],n=a[t.body].centerOfMass??[0,0,0];o.write(new Float32Array((t.position??[0,0,0]).map((e,t)=>e-n[t])),this.count*48+e*96+16)}if(this.ensembleReset.reset(e,this.origin.map((e,t)=>e-this.ensembleResetOrigin[t])),this.ensembleBuffer.write(new Uint32Array([0,0,0,0,1,1,0]),(16+e*8+1)*4),this.encodePosePublication){let e=this.device.createCommandEncoder();this.encodePosePublication(e),this.device.submit(e.finish())}}wakeEnsembleInstance(e){this.assertEnsembleInstance(e),this.ensembleBuffer.write(new Uint32Array([1]),(16+e*8+6)*4),this.sleepStates.write(new Uint32Array(this.props.ensembleBodiesPerInstance*4),e*this.props.ensembleBodiesPerInstance*16)}setEnsembleActive(e,t){this.assertEnsembleInstance(e),this.ensembleBuffer.write(new Uint32Array([t?1:0]),(16+e*8)*4)}async readEnsembleState(){if(!this.ensembleBuffer||this.destroyed)throw Error(`World has no ensemble scheduler`);return new Uint32Array((await this.ensembleBuffer.readAsync()).buffer)}async readEnsembleWork(){if(!this.ensembleBuffer||!this.targets||this.destroyed)throw Error(`World has no ensemble scheduler`);let e=this.ownedBuffers.find(e=>e.id===`${this.id}-ensemble-buckets`),t=2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2))),[n,r,i]=await Promise.all([this.ensembleBuffer.readAsync(0,4),this.targets.readAsync(this.count*32+20,12),e.readAsync(t*4,4)]),a=new Uint32Array(n.buffer)[0],[o,s,c]=new Uint32Array(r.buffer),l=a*this.props.ensembleBodiesPerInstance;return{activeInstances:a,activeBodies:l,touchedBuckets:new Uint32Array(i.buffer)[0],visitedContacts:s,claimedContacts:c,journaledContacts:o,bodySnapshotBytes:l*80,vehicleSnapshotBytes:a*this.vehiclesPerInstance*512,contactSnapshotBytes:o*416,allocatorSnapshotBytes:(8+a*2+o*3)*4,residentInstances:this.count/this.props.ensembleBodiesPerInstance,residentBodies:this.count,contactCapacity:this.maximumPairs}}assertEnsembleInstance(e){if(!this.ensembleBuffer||this.destroyed||!Number.isSafeInteger(e)||e<0||e>=this.count/this.props.ensembleBodiesPerInstance)throw Error(`Invalid ensemble instance`)}getCapacityInfo(){let e=this.allocationPlan?this.allocationPlan.map(e=>({...e})):this.getStorageLayout().buffers;return{bodyCount:this.count,colliderCount:this.colliderCount,maximumPairs:this.maximumPairs,pairWorkgroups:Math.ceil(this.maximumPairs/64),buffers:e,queryIndexScratchBytes:this.batchCastIndex?.stats.physicalTransientResourceBytes??this.batchCastIndexEstimate,ownedBufferBytes:e.reduce((e,t)=>e+t.byteLength,0)}}addToGraph(e){if(this.device||this.destroyed)throw Error(`Rigid-body world already attached or destroyed`);let{packed:t,sparse:n,extended:r,parallel:i,geometryOffset:a,pairOffset:o,diagnosticOffset:s,metadataLength:c,parallelByteLength:l,triggerLayout:u,buffers:d}=this.getStorageLayout();if(Math.ceil(this.maximumPairs/64)>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Rigid-body pair dispatch exceeds device limits`);if(this.props.continuous?.mode===`convex`&&Math.max(Math.ceil((this.props.continuous.maximumCandidates??this.maximumPairs)/64),Math.ceil(2**Math.ceil(Math.log2(Math.max(1,this.colliders.length)))/64))>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Continuous candidate dispatch exceeds device limits`);if(!this.vehiclesPerInstance&&this.vehicles.length>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Vehicle dispatch exceeds device limits`);for(let t of d){let n=t.uniform?e.device.limits.maxUniformBufferBindingSize:e.device.limits.maxStorageBufferBindingSize;if(t.byteLength>Math.min(e.device.limits.maxBufferSize,n))throw Error(`Rigid-body ${t.name} storage exceeds device limits`)}if((this.props.queryBatchCapacity??0)>e.device.limits.maxComputeWorkgroupsPerDimension)throw Error(`Collision cast batch exceeds device dispatch limits`);this.allocationPlan=d,this.device=e.device;let f=(t,n,r=!1)=>{let i=e.device.createBuffer({id:`${this.id}-${t}`,...typeof n==`number`?{byteLength:n}:{data:n},usage:(r?P.UNIFORM:P.STORAGE)|P.COPY_DST|P.COPY_SRC|([`targets`,`parallel-dispatch`,`continuous-dispatch`,`ensemble`].includes(t)?P.INDIRECT:0)});return this.ownedBuffers.push(i),i},p=new Float32Array(this.count*4),m=new Float32Array(this.count*4),h=new Float32Array(this.count*4),g=new Float32Array(this.count*4),_=n?{maximumPairs:this.maximumPairs,pairOffset:o-a,diagnosticOffset:s-a}:void 0,v=new Float32Array(c);if(v.set(t.geometry,a),this.terrainAtlas){this.terrainGeometryWord=a,this.terrainAtlasWord=a+t.geometry.length;let{wordsByCollider:e,uploads:n}=this.terrainAtlas.bind(Array.from(t.atlasFields,([e,t])=>({collider:e,data:new Float32Array(t.data)})));for(let{word:e,data:t}of n)v.set(t,this.terrainAtlasWord+e);for(let[n,r]of e){let e=t.atlasFields.get(n),i=(t.geometry.length+r)/4,a=t.shapes[n];a.padding[0]=i,a.padding[3]=e.triangleCount,a.policies[0]=i+e.nodeOffset,a.policies[1]=e.nodeCount}}this.heightFieldSlots=new Map(Array.from(t.heightFields,([e,t])=>[e,(a+t*4)*4]));let y=Array.from({length:this.count},()=>[]);if(this.colliderCount)for(let e of this.colliders)y[e.body].push(e);for(let[e,t]of this.props.bodies.entries()){let n=t.mass??1,r=t.mode??(n===0?`static`:`dynamic`),i=t.centerOfMass??[0,0,0],a=V(t.orientation),o=jn(a,i);p.set([...t.position.map((e,t)=>e+o[t]),t.shape?.type===`sphere`?t.shape.radius:0],e*4),m.set(a,e*4),h.set([...r===`static`?[0,0,0]:t.velocity??[0,0,0],r===`dynamic`&&n?1/n:0],e*4),g.set(r===`static`?[0,0,0]:t.angularVelocity??[0,0,0],e*4);let s=Mn(n,y[e],i),c=t.inertiaDiagonal??s.diagonal,l=V(t.inertiaOrientation??(t.inertiaDiagonal?void 0:s.orientation));v.set([...c.map(e=>r===`dynamic`&&e?1/e:0),i[0],...l,r===`static`?0:r===`dynamic`?1:2,t.gravityFactor??1,i[1],i[2]],e*12)}let b=[`average`,`minimum`,`maximum`,`multiply`];for(let[e,n]of this.colliders.entries()){let r=this.props.bodies[n.body],i=n.material,a=r.centerOfMass??[0,0,0],o=(n.position??[0,0,0]).map((e,t)=>e-a[t]),s=t.shapes[e];v.set([...s.dimensions,...o,n.body,...V(n.orientation),i?.restitution??r.restitution??.1,i?.staticFriction??r.friction??.6,i?.dynamicFriction??r.friction??.6,n.isTrigger?1:0,i?.restitutionCombine?b.indexOf(i.restitutionCombine):4,i?.frictionCombine?b.indexOf(i.frictionCombine):4,...s.policies,s.padding[0],s.padding[1],this.ensembleTerrainSlots.has(e)?1:s.padding[2],s.padding[3]],this.count*12+e*24)}let x=this.count*12+this.colliderStorageCount*24;for(let[e,n]of t.filters.entries())v.set(n,x+e*2);this.positions=f(`positions`,p),this.orientations=f(`orientations`,m),this.velocities=f(`velocities`,h),this.angularVelocities=f(`angular-velocities`,g),this.sleepStates=f(`sleep`,this.count*16),this.targets=f(`targets`,this.props.ensembleBodiesPerInstance?Wn(this.count,this.count/this.props.ensembleBodiesPerInstance,this.maximumPairs,!!this.props.ensemblePairsPerInstance).byteLength:Math.ceil((this.count*32+(n?32+this.maximumPairs*8:16))/16)*16+(this.props.joints?.length??0)*176);for(let[e,t]of(this.props.joints??[]).entries())this.targets.write(Yn(t),this.getJointStateOffset()+e*176);this.manifolds=f(`manifolds`,this.maximumPairs*416),r&&(this.meshTasks=f(`mesh-tasks`,3145744));let S=f(`bodies`,v);n&&(this.broadPhaseCounters={buffer:S,byteOffset:s*4});let C=f(`settings`,new Float32Array([...this.props.gravity??[0,0,-9.81],this.timeStep,this.props.contactSlop??.002,0,this.props.restitutionThreshold??.5,this.props.contactMatchDistance??.05,this.props.sleepAfter??.5,this.props.sleepLinearSpeed??.04,this.props.sleepAngularSpeed??.04,0,this.props.warmStartFactor??1,this.props.penetrationRecoveryFraction??.15,this.props.maximumRecoverySpeed??2,this.props.parallelRelaxation??1]),!0);if(i&&(this.parallelState=f(`parallel-state`,l),this.parallelDispatch=f(`parallel-dispatch`,48)),this.props.ensembleBodiesPerInstance){let e=this.count/this.props.ensembleBodiesPerInstance,t=new Uint32Array(16+e*9);for(let n=0;n<e;n++)t[16+n*8]=1,t[16+n*8+5]=1;this.ensembleBuffer=f(`ensemble`,t)}let w={settings:C,positions:this.positions,orientations:this.orientations,velocities:this.velocities,angularVelocities:this.angularVelocities,bodies:S,manifolds:this.manifolds,sleepStates:this.sleepStates,targets:this.targets,...this.meshTasks?{meshTasks:this.meshTasks}:{},...this.parallelState?{parallelState:this.parallelState,parallelDispatch:this.parallelDispatch}:{},...n?{minima:f(`minima`,this.colliderStorageCount*12),maxima:f(`maxima`,this.colliderStorageCount*12)}:{}},ee={...w,...this.ensembleBuffer?{ensemble:this.ensembleBuffer}:{}},T=Object.entries(ee).map(([t,n],r)=>({name:t,buffer:n,location:t===`ensemble`?28:t===`parallelDispatch`?27:t===`parallelState`?26:t===`minima`?24:t===`maxima`?25:r>=8?r+1:r,resource:e.importBuffer({id:`${this.id}-${t}`,byteLength:n.byteLength,usage:r===0?P.UNIFORM:P.STORAGE|P.COPY_SRC|([`targets`,`parallelDispatch`,`ensemble`].includes(t)?P.INDIRECT:0)},n)})),E={attributes:[],bindings:T.map(({name:e,location:t})=>{let n={name:e,location:t,group:0};return t===0?{...n,type:`uniform`}:{...n,type:e===`bodies`?`read-only-storage`:`storage`}})},D=n?f(`object-attributes`,Uint32Array.from(this.colliders,e=>{let t=this.props.bodies[e.body],n=t.mode??((t.mass??1)===0?`static`:`dynamic`);return e.body|(n===`dynamic`?65536:0)})):null,te=D?e.createDataView(e.importBuffer({id:`${this.id}-object-attributes`,byteLength:D.byteLength,usage:P.STORAGE},D),{format:`uint32`,length:this.colliderStorageCount}):void 0,O=vr(this.count,this.props.iterations??16,this.colliderStorageCount,r,_,i,this.props.maximumMeshTraversalTestsPerPair??65536,Jn(this.props.joints??[],this.props.bodies),!!this.props.joints?.length,this.props.linearDamping??0,this.props.angularDamping??0,this.props.joints?.length??0,this.props.compactContacts??!0,this.props.collisionPartitionSize,this.props.ensembleBodiesPerInstance,this.props.parallelContactSolver===`block`,this.colliders.some(e=>e.shape.type===`height-field`),this.props.ensemblePairsPerInstance),k={parallelReset:[`parallelState`],parallelResetCounters:[`parallelState`],parallelActiveBodies:[`bodies`,`sleepStates`,`parallelState`],parallelPrepareSleep:[`parallelState`],parallelCompact:[`manifolds`,`parallelState`,...this.ensembleBuffer?[`targets`]:[]],parallelDispatchCount:[`parallelState`,`parallelDispatch`],parallelActive:[`bodies`,`sleepStates`,`manifolds`,`parallelState`],parallelActiveCount:[`parallelState`,`parallelDispatch`],parallelLink:[`velocities`,`angularVelocities`,`bodies`,`manifolds`,`parallelState`],parallelUnion:[`bodies`,`manifolds`,`parallelState`],parallelCompress:[`sleepStates`,`parallelState`],parallelWakeRoots:[`bodies`,`sleepStates`,`parallelState`],parallelWakeBodies:[`bodies`,`sleepStates`,`parallelState`],parallelWarm:[`positions`,`orientations`,`velocities`,`bodies`,`manifolds`,`sleepStates`,`parallelState`],parallelPairs:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`manifolds`,`sleepStates`,`parallelState`],parallelGather:[`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`parallelState`],parallelAdvance:[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`targets`,...this.ensembleBuffer?[]:[`parallelState`]],parallelMarkSleep:[`settings`,`bodies`,`sleepStates`,`parallelState`],parallelSleep:[`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`parallelState`]};if(k.parallelSolve=k.parallelPairs,this.props.joints?.length){let e=[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`targets`];k.parallelJointWarm=e,k.parallelJointSolve=e,k.parallelSolve=[...new Set([...k.parallelSolve,...e])]}this.simulationStatistics=f(`simulation-statistics`,64);let A=e.importBuffer({id:`${this.id}-statistics`,byteLength:64,usage:P.STORAGE},this.simulationStatistics),j=new Uint32Array(this.count);for(let e of this.props.continuous?.bodies??[])j[e]=this.colliders.findIndex(t=>t.body===e)+1;let M=this.props.continuous?er(e,this.id,O,this.count,j,this.props.continuous.maximumImpacts??4,T,f,!!this.props.joints?.length,this.props.continuous.mode===`convex`?this.props.continuous.maximumCandidates??this.maximumPairs:0,this.colliderStorageCount,r,this.colliders.some(e=>e.shape.type===`convex-hull`)):void 0,ne=u?cr(e,this.id,O,this.colliderStorageCount,u,this.props.triggerEventCapacity??256,T,{name:`triggerStatistics`,buffer:this.simulationStatistics,resource:A,location:18},f,!!this.props.joints?.length,r):void 0;this.triggerEvents=ne?.events??null,ne&&u&&(this.triggerHistory={buffer:ne.history,groups:u.groups});let re={integrate:`Apply gravity and advance body velocities and predicted poses for this timestep.`,prepare:`Reset broad-phase counters before generating potential collider pairs.`,bounds:`Compute world-space collider bounds for broad-phase collision detection.`,collide:`Find overlapping collider pairs and generate contact manifolds.`,meshCollide:`Generate contacts against triangle meshes and heightfields.`,meshCollect:`Collect mesh contacts for the parallel constraint solver.`,solve:`Resolve contact and joint constraints, including friction and restitution.`,finish:`Publish solved body poses and update sleeping state.`,parallelReset:`Initialize body ownership for parallel contact islands.`,parallelCompact:`Compact live contact manifolds into a reusable GPU work queue.`,parallelDispatchCount:`Build indirect workgroup counts from the compact contact queue.`,parallelLink:`Link bodies connected by active contacts or joints.`,parallelUnion:`Merge connected bodies into constraint islands.`,parallelCompress:`Compress island links to their root body.`,parallelWakeRoots:`Mark islands that must wake for active constraints.`,parallelWakeBodies:`Wake bodies belonging to active constraint islands.`,parallelActive:`Compact awake bodies and contacts after connected islands wake.`,parallelActiveCount:`Build indirect dispatches for awake solver work.`,parallelAdvance:`Advance body poses using the solved velocities.`,parallelMarkSleep:`Identify islands whose bodies are quiet enough to sleep.`,parallelSleep:`Put quiet constraint islands to sleep.`},N,ie;if(this.vehicles.length){let t=new Float32Array(this.getVehicleByteLength()/4);for(let[e,n]of this.vehicles.entries()){let r=t.subarray(e*512/4,(e+1)*512/4);r.set([n.radius,n.travel,n.springRate,n.damping,n.grip,n.motorTorque,n.brakeTorque,n.wheelInertia],4),new Uint32Array(r.buffer,r.byteOffset,r.length).set([n.chassis,n.terrainCollider],12),r.set([n.steeringWheelbase??0,n.antiRollRate??0],14);let[i,a]=n.slipGain??[1.1,1.5];n.wheels.forEach((e,t)=>{let o=16+t*12;r.set([...e.mount,i+1],o),r.set([Number(!!e.steer),Number(!!e.drive),a+1],o+4),r[o+10]=n.travel,r.set([1,0,0,0,0,1,0,0,0,0,1,0,e.mount[0],e.mount[1],e.mount[2]-n.travel,1],64+16*t)})}if(this.multiSurfaceVehicles){let e=new Uint32Array(t.buffer,this.vehicles.length*512);e.fill(4294967295);for(let[t,n]of this.vehicles.entries())e.set(n.additionalTerrainColliders??[],16/4*t)}this.vehicleBuffer=f(`vehicle`,t),N={buffer:this.vehicleBuffer,resource:e.importBuffer({id:this.id+`-vehicle`,byteLength:t.byteLength,usage:P.STORAGE|P.COPY_SRC},this.vehicleBuffer)};let n=T.find(e=>e.name===`ensemble`),r=[...T.filter(e=>[`settings`,`positions`,`orientations`,`velocities`,`angularVelocities`,`bodies`,`sleepStates`,`ensemble`].includes(e.name)),{name:`vehicle`,location:12,...N}],i={id:this.id+`-suspension`,source:bn(O)+Zn+Sn(this.vehicles.length,this.multiSurfaceVehicles,this.vehiclesPerInstance),entryPoint:`advanceVehicle`,shaderLayout:{bindings:r.map(({name:e,location:t})=>e===`settings`?{name:e,location:t,group:0,type:`uniform`}:{name:e,location:t,group:0,type:e===`bodies`||e===`ensemble`?`read-only-storage`:`storage`})}},a=e=>({encode:({computePass:t,getBuffer:i})=>{Object.assign(e.bindings,Object.fromEntries(r.map(e=>[e.name,i(e.resource)]))),n?e.kernel.dispatchIndirect(t,{bindings:e.bindings,indirectBuffer:i(n.resource),indirectOffset:16}):e.kernel.dispatch(t,{bindings:e.bindings,x:this.vehicles.length})},destroy:()=>e.kernel.destroy()});ie=()=>e.addComputePass({id:i.id,description:`Sweep four wheels and apply suspension and tire forces per chassis.`,resources:[...r.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:e.name===`bodies`||e.name===`ensemble`?`storage-read`:`storage-read-write`})),...n?[{buffer:n.resource,usage:`indirect`}]:[]],compile:()=>a(B(e.device,i)),compileAsync:async()=>a(await un(e.device,i))})}let ae=[`positions`,`orientations`,`velocities`,`angularVelocities`,`sleepStates`,`targets`].map(e=>{let t=T.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}}),oe=this.props.failurePolicy===`rollback`?this.ensembleBuffer?lr(e,this.id,ae,{buffer:this.simulationStatistics,resource:A},T.find(e=>e.name===`ensemble`),T.find(e=>e.name===`manifolds`),this.props.ensembleBodiesPerInstance,this.maximumPairs,f,N&&{state:N,vehiclesPerInstance:this.vehiclesPerInstance},this.props.ensemblePairsPerInstance):ur(e,this.id,[...ae,T.find(e=>e.name===`manifolds`),...N?[N]:[]],{buffer:this.simulationStatistics,resource:A},f):void 0;for(let t of[...this.ensembleBuffer?[`ensembleClear`,`ensembleMark`,`ensembleCompact`,`ensembleDispatch`]:[],`integrate`,...n?[...this.ensembleBuffer?[`prepareStart`]:[],`prepare`,`bounds`]:[],`collide`,...r?[`meshCollide`]:[],...i?[...r?[`meshCollect`]:[],...this.ensembleBuffer&&this.props.compactContacts!==!1?[`parallelResetCounters`]:[],`parallelReset`,...this.props.compactContacts===!1?[]:[`parallelCompact`,`parallelDispatchCount`],`parallelLink`,`parallelUnion`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,...this.props.compactContacts===!1?[]:[...this.ensembleBuffer?[`parallelActiveBodies`]:[],`parallelActive`,`parallelActiveCount`],`parallelSolve`,`parallelAdvance`,...this.ensembleBuffer?[`parallelPrepareSleep`]:[],`parallelMarkSleep`,`parallelSleep`]:[...r&&this.props.joints?.length?[`meshCollect`]:[],`solve`,`finish`]]){if(t===`integrate`&&(oe?.save?.(),ie?.()),n&&t===`collide`){let t=T.find(e=>e.name===`bodies`),n=T.find(e=>e.name===`minima`),r=T.find(e=>e.name===`maxima`),i=this.ensembleBuffer?f(`ensemble-buckets`,(2**Math.ceil(Math.log2(Math.max(1,this.colliderStorageCount*2)))+this.colliderStorageCount+2)*4):void 0;ve(e,new Pn({...i?{bucketState:e.createDataView(e.importBuffer({id:i.id,byteLength:i.byteLength,usage:P.STORAGE},i),{format:`uint32`,length:i.byteLength/4})}:{},id:`${this.id}-broad-phase`,objectMetadata:te,partitionSize:this.props.collisionPartitionSize,...this.ensembleBuffer?{activeInstances:e.createDataView(T.find(e=>e.name===`ensemble`).resource,{format:`uint32`,length:this.ensembleBuffer.byteLength/4})}:{},maximumCandidateTestsPerQuery:this.props.maximumCandidateTestsPerCollider,minima:e.createDataView(n.resource,{format:`float32x3`,length:this.colliderStorageCount}),maxima:e.createDataView(r.resource,{format:`float32x3`,length:this.colliderStorageCount}),pairs:e.createDataView(t.resource,{format:`uint32x2`,length:this.maximumPairs,byteOffset:o*4}),diagnostics:e.createDataView(t.resource,{format:`uint32`,length:8,byteOffset:s*4})}).getCommandNodes(e))}let a=[...t.startsWith(`parallel`)?T.filter(e=>!k[t].includes(e.name)).map(e=>e.name):t===`meshCollect`?[`sleepStates`,...this.ensembleBuffer?[]:[`targets`],`parallelState`]:[`prepare`,`prepareStart`].includes(t)?T.filter(e=>!(t===`prepareStart`?[`targets`]:[`targets`,`manifolds`]).includes(e.name)).map(e=>e.name):t===`bounds`?T.filter(e=>![`settings`,`positions`,`orientations`,`bodies`,`minima`,`maxima`].includes(e.name)).map(e=>e.name):t===`meshCollide`?[`velocities`,`angularVelocities`,`manifolds`,`sleepStates`,`targets`]:t===`integrate`?[`manifolds`,...this.ensembleBuffer?[`meshTasks`]:[]]:t===`collide`?[`sleepStates`,...r||n||this.props.joints?.length?[]:[`targets`]]:t===`finish`?[`manifolds`,`meshTasks`]:this.props.joints?.length?[]:[`targets`],...t===`solve`&&this.props.joints?.length?[`meshTasks`]:[],...t.startsWith(`parallel`)?[]:[`parallelState`,`parallelDispatch`],...t===`bounds`?[]:[`minima`,`maxima`]],c=[`integrate`,`bounds`,`prepare`,`parallelReset`,`parallelPrepareSleep`,`parallelActiveBodies`,`parallelCompact`,`parallelActive`,`parallelLink`,`parallelUnion`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,`parallelAdvance`,`parallelMarkSleep`,`parallelSleep`].includes(t),l=e=>t.startsWith(`ensemble`)?e===`ensemble`||t===`ensembleClear`&&r&&[`meshTasks`,`targets`].includes(e):e===`ensemble`?c:!a.includes(e),u=T.filter(e=>l(e.name)),d={attributes:[],bindings:E.bindings.filter(e=>l(e.name)).map(e=>e.name===`ensemble`&&!t.startsWith(`ensemble`)?{...e,type:`read-only-storage`}:e)},p=i&&this.props.compactContacts!==!1&&[`parallelSolve`,`parallelLink`,`parallelUnion`,...this.ensembleBuffer?[`parallelActive`]:[]].includes(t),m=T.find(e=>e.name===`parallelDispatch`),h=T.find(e=>e.name===`ensemble`),g=!!(this.ensembleBuffer&&[`integrate`,`bounds`,`parallelAdvance`,`parallelCompress`,`parallelWakeRoots`,`parallelWakeBodies`,`parallelPrepareSleep`,`parallelMarkSleep`,`parallelSleep`,`parallelActiveBodies`,...this.props.compactContacts===!1?[]:[`parallelReset`]].includes(t)),_=g?[{buffer:h.resource,usage:`indirect`}]:p?[{buffer:m.resource,usage:`indirect`}]:[];if(t===`parallelSolve`){let t=[`parallelWarm`,`parallelPairs`,`parallelGather`,...this.props.joints?.length?[`parallelJointWarm`,`parallelJointSolve`]:[]],n=t.map(e=>({id:`${this.id}-${e}`,source:O,entryPoint:e,shaderLayout:{attributes:[],bindings:d.bindings.filter(t=>k[e].includes(t.name))}})),r=e=>({encode:({computePass:n,getBuffer:r})=>{let i={};for(let e of u)i[e.name]=r(e.resource);for(let[n,r]of e.entries())Object.assign(r.bindings,Object.fromEntries(Object.entries(i).filter(([e])=>k[t[n]].includes(e))));let a=e=>{p?e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(m.resource),indirectOffset:16}):e.kernel.dispatch(n,{bindings:e.bindings,x:Math.ceil(this.maximumPairs/64)})},o=e=>{p?e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(m.resource),indirectOffset:32}):e.kernel.dispatch(n,{bindings:e.bindings,x:Math.ceil(this.count/64)})};a(e[0]),o(e[2]),e[3]&&e[3].kernel.dispatch(n,{bindings:e[3].bindings,x:1});for(let t=0;t<(this.props.iterations??16);t++)a(e[1]),o(e[2]),e[4]&&e[4].kernel.dispatch(n,{bindings:e[4].bindings,x:1})},destroy:()=>{for(let t of e)t.kernel.destroy()}});e.addComputePass({id:`${this.id}-solve`,workload:{commandCount:(this.props.joints?.length?3:2)+(this.props.joints?.length?3:2)*(this.props.iterations??16)},description:re.solve,resources:[..._,...u.map(e=>({buffer:e.resource,usage:e.name===`settings`?`uniform`:e.name===`bodies`?`storage-read`:`storage-read-write`}))],compile:({device:e})=>r(n.map(t=>B(e,t))),compileAsync:async({device:e})=>r(await Promise.all(n.map(t=>un(e,t))))});continue}let v=e=>({encode:({computePass:n,getBuffer:r})=>{let i={};for(let e of u)i[e.name]=r(e.resource);if(Object.assign(e.bindings,i),g)e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(h.resource),indirectOffset:t===`bounds`?32:16});else if(p)e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(m.resource),indirectOffset:0});else if(t===`meshCollide`){let t=T.find(e=>e.name===`targets`);e.kernel.dispatchIndirect(n,{bindings:e.bindings,indirectBuffer:r(t.resource),indirectOffset:this.count*32})}else e.kernel.dispatch(n,{bindings:e.bindings,x:t===`ensembleDispatch`?1:t.startsWith(`ensemble`)||this.ensembleBuffer&&[`prepare`,`parallelCompact`].includes(t)?Math.ceil(this.count/this.props.ensembleBodiesPerInstance/64):[`parallelLink`,`parallelUnion`,`parallelCompact`].includes(t)?Math.ceil(this.maximumPairs/64):t===`parallelActive`?Math.ceil(Math.max(this.maximumPairs,this.count)/64):[`parallelDispatchCount`,`parallelActiveCount`,`parallelResetCounters`].includes(t)?1:t.startsWith(`parallel`)?Math.ceil(this.count/64):t===`collide`?Math.ceil(this.maximumPairs/64):t===`bounds`?Math.ceil(this.colliderStorageCount/64):t===`integrate`?Math.ceil(this.count/64):1})},destroy:()=>e.kernel.destroy()}),y={id:`${this.id}-${t}`,source:t.startsWith(`ensemble`)?O:bn(O),entryPoint:t,shaderLayout:d};e.addComputePass({id:y.id,workload:{commandCount:1},description:re[t],resources:[..._,...u.map(e=>({buffer:e.resource,usage:e.location===0?`uniform`:e.name===`bodies`||e.name===`ensemble`&&!t.startsWith(`ensemble`)?`storage-read`:`storage-read-write`})),...t===`meshCollide`?[{buffer:T.find(e=>e.name===`targets`).resource,usage:`indirect`}]:[]],compile:({device:e})=>v(B(e,y)),compileAsync:async({device:e})=>v(await un(e,y))})}M?.finish(),ne?.sample(),oe?.validate();let se=e=>{let t=T.find(t=>t.name===e);return{buffer:t.buffer,resource:t.resource}};if(Ln(e,`${this.id}-diagnostics`,this.simulationStatistics,{statisticsResource:A,...oe?{validity:oe.validity}:{},...ne?{triggers:ne.samples}:{},...M?{continuous:{...M.status,count:this.count}}:{},...n?{broadPhase:{...se(`bodies`),wordOffset:s},targets:{...se(`targets`),wordOffset:this.count*8+4}}:{},...r?{meshTasks:se(`meshTasks`)}:{},...i?{parallelState:se(`parallelState`)}:{}}),oe?.restore(),this.ensembleBuffer&&xn(e,this.id,this.count/this.props.ensembleBodiesPerInstance,this.props.ensembleBodiesPerInstance,se(`bodies`),se(`sleepStates`),se(`ensemble`),{buffer:this.simulationStatistics,resource:A},this.props.ensemblePairsPerInstance?{...se(`targets`),wordOffset:Wn(this.count,this.count/this.props.ensembleBodiesPerInstance,this.maximumPairs,!0).failureOffset}:void 0),ne?.publish(),this.props.publicationBounds||this.props.publishPoses){let t=dr(e,this.id,this.props.bodies,this.props.publicationBounds??this.props.bodies.map(()=>[[0,0,0],[0,0,0]]),se(`positions`),se(`orientations`),f);this.encodePosePublication=t.encode,this.poseMatrices=t.matrices,this.poseBounds=this.props.publicationBounds?t.bounds:null}if(this.props.eventCapacity){let t=f(`contact-history`,this.maximumPairs*16);this.contactHistory=t,this.contactEvents=f(`contact-events`,16+this.props.eventCapacity*64);let n=[...T.filter(e=>[`bodies`,`manifolds`,`ensemble`].includes(e.name)),...this.props.failurePolicy===`rollback`?[{name:`eventStatistics`,buffer:this.simulationStatistics,resource:A,location:14}]:[],...[{name:`contactHistory`,buffer:t,location:12},{name:`contactEvents`,buffer:this.contactEvents,location:13}].map(t=>({...t,resource:e.importBuffer({id:`${this.id}-${t.name}`,byteLength:t.buffer.byteLength,usage:P.STORAGE},t.buffer)}))].map(({name:e,resource:t,location:n})=>({name:e,resource:t,location:n,readOnly:e===`bodies`||e===`eventStatistics`}));ir(e,{id:`${this.id}-contact-events`,rowCount:this.maximumPairs,capacity:this.props.eventCapacity,ring:`contactEvents`,source:O+br(this.props.eventCapacity,this.props.impactImpulseThreshold??1,this.props.failurePolicy===`rollback`,this.props.ensemblePairsPerInstance),classify:n.filter(e=>![`bodies`,`contactEvents`].includes(e.name)),commit:n.filter(e=>[`eventStatistics`,`contactEvents`].includes(e.name)),publish:n.filter(e=>![`eventStatistics`,`ensemble`].includes(e.name))})}if(this.props.enableQueries){this.querySettings=f(`query-settings`,48,!0),this.querySelection=f(`query-selection`,Math.max(4,this.colliderStorageCount*4)),this.queryOutput=f(`query-output`,16+Math.max(1,this.colliderStorageCount)*48);let t={id:`${this.id}-queries`,source:O+Zn+Vn,entryPoint:`queryColliders`,shaderLayout:{bindings:[...E.bindings.filter(e=>[`positions`,`orientations`,`bodies`].includes(e.name)),{name:`query`,group:0,location:12,type:`uniform`},{name:`querySelection`,group:0,location:13,type:`read-only-storage`},{name:`queryOutput`,group:0,location:14,type:`storage`}]},bindings:{positions:this.positions,orientations:this.orientations,bodies:S,query:this.querySettings,querySelection:this.querySelection,queryOutput:this.queryOutput}};if(this.queryComputation=B(e.device,t),this.queryReduction=B(e.device,{...t,entryPoint:`reduceQueries`,shaderLayout:{bindings:t.shaderLayout.bindings.filter(e=>[`query`,`querySelection`,`queryOutput`].includes(e.name))},bindings:{query:this.querySettings,querySelection:this.querySelection,queryOutput:this.queryOutput}}),this.props.queryBatchCapacity){let n=this.props.queryBatchCapacity;this.batchCastCommands=f(`query-batch-commands`,n*48),this.batchCastResults=f(`query-batch-results`,n*64);let r={positions:this.positions,orientations:this.orientations,bodies:S,querySelection:this.querySelection,batchCommands:this.batchCastCommands,batchResults:this.batchCastResults},i=[...t.shaderLayout.bindings.filter(e=>[`positions`,`orientations`,`bodies`,`querySelection`].includes(e.name)),{name:`batchCommands`,group:0,location:30,type:`read-only-storage`},{name:`batchResults`,group:0,location:31,type:`storage`}];this.batchCast=B(e.device,{id:`${this.id}-batched-casts`,entryPoint:`castBatch`,source:t.source+Hn(),shaderLayout:{bindings:i},bindings:r}),this.props.queryBatchIndex&&this.colliderCount&&(this.batchCastOrder=Tr(this.colliders,this.props.bodies),this.batchCastOrder.indexedCount&&(this.batchCastIndex=Dr(e.device,{id:`${this.id}-cast-index`,source:t.source,layout:i,buffers:r,indexedCount:this.batchCastOrder.indexedCount})))}}this.controlSettings=f(`control-settings`,64,!0);let ce={id:`${this.id}-impulse`,source:O+`
struct Command { impulse: vec4f, point: vec4f, orientation: vec4f, bodyIndex: vec4u }
@group(0) @binding(8) var<uniform> command: Command;
@compute @workgroup_size(1) fn control() {
 if(command.bodyIndex.y==0u) {applyImpulse(command.bodyIndex.x,command.point.xyz,command.impulse.xyz);}
 else if(command.bodyIndex.y==6u){
  let body=command.bodyIndex.x;let shift=rotate(orientations[body],command.impulse.xyz);
  positions[body]=vec4f(positions[body].xyz+shift,positions[body].w);
  var linear=velocities[body].xyz+cross(angularVelocities[body].xyz,shift);
  var angular=angularVelocities[body].xyz;
  if(command.point.w>0.0){linear=command.point.xyz;}
  if(command.orientation.w>0.0){angular=command.orientation.xyz;}
  if(bodies.bodies[body].motion.x==0.0){linear=vec3f(0);angular=vec3f(0);}
  velocities[body]=vec4f(linear,command.impulse.w);angularVelocities[body]=vec4f(angular,0);
  if(command.bodyIndex.z!=0u){targets.entries[body].position.w=0.0;}
 }
 else if(command.bodyIndex.y==5u){let body=command.bodyIndex.x;if(dynamic(body)){angularVelocities[body]=vec4f(angularVelocities[body].xyz+inverseInertia(body,command.impulse.xyz),0);}}
 else if(command.bodyIndex.y==2u) {applyImpulse(command.bodyIndex.x,positions[command.bodyIndex.x].xyz,command.impulse.xyz);}
 ${this.props.joints?.length?`else if(command.bodyIndex.y==3u){targets.joints[command.bodyIndex.x].control.x=command.impulse.x;}`:``}
 else {targets.entries[command.bodyIndex.x].position=vec4f(command.point.xyz,1);targets.entries[command.bodyIndex.x].orientation=command.orientation;}
}
@compute @workgroup_size(64) fn invalidate(@builtin(global_invocation_id) invocation:vec3u) {
 let index=invocation.x+invocation.y*4194240u;
 if(index<BODY_COUNT){sleepStates[index]=vec4f(0);}
 if(index<PAIR_CAPACITY){manifolds[index].count=0u;}
 ${this.props.joints?.length?`if(index<${this.props.joints.length}u){for(var row=0u;row<8u;row++){targets.joints[index].impulses[row]=0.0;}}`:``}
}`,entryPoint:`control`,shaderLayout:{bindings:[...E.bindings.filter(e=>![`settings`,`meshTasks`,`parallelState`,`parallelDispatch`,`minima`,`maxima`].includes(e.name)),{name:`command`,group:0,location:8,type:`uniform`}]},bindings:{...Object.fromEntries(Object.entries(w).filter(([e])=>![`settings`,`meshTasks`,`parallelState`,`parallelDispatch`,`minima`,`maxima`].includes(e))),command:this.controlSettings}};this.control=B(e.device,{...ce,shaderLayout:{bindings:ce.shaderLayout.bindings.filter(e=>![`sleepStates`,`manifolds`].includes(e.name))},bindings:Object.fromEntries(Object.entries(ce.bindings).filter(([e])=>![`sleepStates`,`manifolds`].includes(e)))});let le=[`sleepStates`,`manifolds`,...this.props.joints?.length?[`targets`]:[]];this.invalidation=B(e.device,{...ce,id:`${this.id}-invalidate`,entryPoint:`invalidate`,shaderLayout:{bindings:ce.shaderLayout.bindings.filter(e=>le.includes(e.name))},bindings:Object.fromEntries(Object.entries(ce.bindings).filter(([e])=>le.includes(e)))}),this.heightFieldSlots.size&&!this.ensembleBuffer&&(this.terrainWake=B(e.device,{id:`${this.id}-terrain-wake`,entryPoint:`wakeTerrain`,source:ce.source+`
@group(0) @binding(26) var<storage,read_write> terrainSleep:array<atomic<u32>>;
@compute @workgroup_size(64) fn wakeTerrain(@builtin(global_invocation_id) invocation:vec3u) {
 let collider=invocation.x;if(collider>=COLLIDER_COUNT){return;}
 let body=colliderBody(collider);if(!dynamic(body)){return;}
 let tile=command.bodyIndex.x;if(bodies.colliders[tile].padding.w==0.0){return;}
 if(any(abs(colliderPosition(collider)-colliderPosition(tile))>shapeWorldExtent(collider)+shapeWorldExtent(tile)+vec3f(settings.solver.x))){return;}
 // Several colliders on one sleeping body may all overlap the tile.
 for(var axis=0u;axis<4u;axis++){atomicStore(&terrainSleep[body*4u+axis],0u);}
}`,shaderLayout:{bindings:[...E.bindings.filter(e=>[`settings`,`positions`,`orientations`,`bodies`].includes(e.name)),{name:`command`,group:0,location:8,type:`uniform`},{name:`terrainSleep`,group:0,location:26,type:`storage`}]},bindings:{settings:w.settings,positions:w.positions,orientations:w.orientations,bodies:w.bodies,command:this.controlSettings,terrainSleep:this.sleepStates}}))}wakeTerrainFootprint(e){let{kernel:t,bindings:n}=this.terrainWake;this.controlSettings.write(new Uint32Array([e]),48);let r=this.device.createCommandEncoder(),i=r.beginComputePass();t.dispatch(i,{bindings:n,x:Math.ceil(this.colliderStorageCount/64)}),i.end(),this.device.submit(r.finish())}invalidateState(e){this.ensembleBuffer?.write(new Uint32Array([1]),4);let t=Math.ceil(Math.max(this.count,this.maximumPairs,this.props.joints?.length??0)/64);this.invalidation.kernel.dispatch(e,{bindings:this.invalidation.bindings,x:Math.min(65535,t),y:Math.ceil(t/65535)})}get origin(){return[...this.worldOrigin]}shiftOrigin(e){if(!this.device||this.destroyed||this.queryPending||this.eventReadsPending)throw Error(`Origin shifting requires an idle attached world`);if(e.length!==3||e.some(e=>!Number.isFinite(e)||Math.fround(e)!==e))throw Error(`Origin shift must be an exactly representable float32 vector`);e.every(e=>e===0)||(vn(this.device,this.id,this.ownedBuffers,this.count,this.colliderStorageCount,this.maximumPairs,this.props.eventCapacity??0,e),this.worldOrigin=this.worldOrigin.map((t,n)=>t+e[n]),this.publishPoses())}getBodyMode(e){let t=this.props.bodies[e];return t?t.mode??((t.mass??1)===0?`static`:`dynamic`):void 0}setVehicleControls(e,t,n,r=0){if(!this.vehicleBuffer||this.destroyed||!this.vehicles[r]||![e,t,n].every(e=>Number.isFinite(Math.fround(e))))throw Error(`Invalid vehicle controls`);if(this.vehicleBuffer.write(new Float32Array([Math.max(-1,Math.min(1,e)),t,Math.max(0,Math.min(1,n)),0]),r*512),this.vehiclesPerInstance){let e=Math.floor(r/this.vehiclesPerInstance);this.ensembleBuffer.write(new Uint32Array([1]),(16+e*8+6)*4)}}get vehicleWheelPoses(){return this.getVehicleWheelPoses()}getVehicleWheelPoses(e=0){return this.vehicleBuffer&&!this.destroyed&&this.vehicles[e]?{buffer:this.vehicleBuffer,byteOffset:e*512+256,byteLength:256}:null}copyVehicleMotionFrom(e,t=0,n=0){let r=e.vehicleBuffer,i=this.vehicleBuffer,a=e.vehicles[n];if(!this.device||!r||!i||!a)return;let o=this.device.createCommandEncoder();this.vehicles[t]?.wheels.forEach((e,s)=>{let c=a.wheels.findIndex(t=>t.mount.every((t,n)=>t===e.mount[n]));c<0||(o.copyBufferToBuffer({sourceBuffer:r,destinationBuffer:i,sourceOffset:n*512+92+c*48,destinationOffset:t*512+92+s*48,size:20}),o.copyBufferToBuffer({sourceBuffer:r,destinationBuffer:i,sourceOffset:n*512+256+c*64,destinationOffset:t*512+256+s*64,size:64}))}),this.device.submit(o.finish())}async readVehicleWheels(e=0){if(!this.vehicleBuffer||this.destroyed||!this.vehicles[e])throw Error(`Vehicle unavailable`);let t=await this.vehicleBuffer.readAsync(e*512,256),n=new Float32Array(t.buffer,t.byteOffset,t.byteLength/4);return Array.from({length:4},(e,t)=>{let r=24+t*12;return{speed:n[r],angle:n[r+1],length:n[r+2],load:n[r+3],steering:n[r-1]}})}applyImpulse(e,t,n){if(!this.control||!this.device||!this.controlSettings||this.destroyed||!Number.isInteger(e)||e<0||e>=this.count||![...t,...n??[]].every(Number.isFinite))throw Error(`Invalid rigid-body impulse`);let r=new ArrayBuffer(64);new Float32Array(r).set([...t,0,...n??[0,0,0],0]),new Uint32Array(r)[12]=e,new Uint32Array(r)[13]=n?0:2,this.controlSettings.write(new Uint8Array(r));let i=this.device.createCommandEncoder(),a=i.beginComputePass();this.control.kernel.dispatch(a,{bindings:this.control.bindings,x:1}),this.invalidateState(a),a.end(),this.device.submit(i.finish())}getBodyParameters(e,{deriveInertia:t=!0}={}){let n=this.props.bodies[e];if(!n||this.destroyed)throw Error(`Invalid body`);let{mode:r,mass:i,centerOfMass:a,inertiaDiagonal:o,inertiaOrientation:s,velocity:c,angularVelocity:l,gravityFactor:u}=n,d=Mn(i??1,this.colliders.filter(t=>t.body===e),a??[0,0,0]);return structuredClone({mode:r??((i??1)===0?`static`:`dynamic`),mass:i??1,centerOfMass:a??[0,0,0],inertiaDiagonal:o??(t?d.diagonal:void 0),inertiaOrientation:s??(t?o?[0,0,0,1]:d.orientation:void 0),velocity:c??[0,0,0],angularVelocity:l??[0,0,0],gravityFactor:u??1})}publishPoses(){if(!this.device||this.destroyed)throw Error(`Unavailable physics world`);if(!this.encodePosePublication)return;let e=this.device.createCommandEncoder();this.encodePosePublication(e),this.device.submit(e.finish())}setPublicationBounds(e){if(!this.poseBounds||e.length!==this.count||e.some(e=>e.length!==2||e.some(e=>e.length!==3||!e.every(e=>Number.isFinite(Math.fround(e))))||e[0].some((t,n)=>t>e[1][n])))throw Error(`Invalid publication bounds`);let t=this.ownedBuffers.find(e=>e.id===`${this.id}-pose-metadata`),n=new Float32Array(this.count*12);for(let[t,r]of this.props.bodies.entries())n.set([...r.centerOfMass??[0,0,0],0,...e[t][0],0,...e[t][1],0],t*12);t.write(n),this.props.publicationBounds=structuredClone(e)}getColliderTransform(e){let t=this.colliders[e];if(!Number.isInteger(e)||!t||this.destroyed)throw Error(`Invalid collider`);return{position:[...t.position??[0,0,0]],orientation:V(t.orientation)}}getColliderShapeScale(e){return this.getColliderShape(e),[...this.colliderShapeScales.get(e)??[1,1,1]]}getColliderShape(e){let t=this.colliders[e];if(!Number.isInteger(e)||!t||this.destroyed)throw Error(`Invalid collider`);return structuredClone(t.shape)}setColliderShapes(e){if(!this.device||this.destroyed)throw Error(`World is not attached`);let t=new Set,n=e.map(e=>{let n=this.getColliderShape(e.collider),r=structuredClone(e.shape);if(e.shapeScale&&(e.shapeScale.length!==3||e.shapeScale.some(e=>!Number.isFinite(e)||e<=0)))throw Error(`Invalid collider shape scale`);if(t.has(e.collider)||n.type!==r.type||r.type===`convex-hull`||r.type===`triangle-mesh`||r.type===`height-field`)throw Error(`Shape edit requires a topology rebuild`);t.add(e.collider);let i=_n(r),a=An([{shape:r}]).shapes[0];if(![...a.dimensions,i.volume,...i.tensor,...i.center].every(e=>Number.isFinite(Math.fround(e))))throw Error(`Shape exceeds float32 range`);return{collider:e.collider,shape:r,dimensions:a.dimensions,shapeScale:e.shapeScale}}),r=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!r)throw Error(`World is not attached`);for(let e of n)r.write(new Float32Array(e.dimensions),this.count*48+e.collider*96),this.colliders[e.collider].shape=e.shape,e.shapeScale&&this.colliderShapeScales.set(e.collider,[...e.shapeScale]);for(let e of new Set(n.map(e=>this.colliders[e.collider].body)))this.updateColliderDefinitions(e),this.setBodyParameters(e,{})}setHeightFieldTiles(e){if(!e.length)return;let t=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!t||this.destroyed||this.queryPending||this.eventReadsPending)throw Error(`Terrain streaming requires an idle attached world`);let n=new Set,r=this.terrainAtlas?new Map:void 0,i=e.map(({collider:e,field:t,position:i})=>{let a=this.colliders[e],o=this.heightFieldSlots.get(e);if(o===void 0&&!(this.terrainAtlas&&this.ensembleTerrainSlots.has(e))||a?.shape.type!==`height-field`||n.has(e))throw Error(`Invalid writable height-field slot`);n.add(e);let s=a.shape.field;if(t&&(t.width!==s.width||t.height!==s.height))throw Error(`Height-field slot dimensions are fixed`);let c=this.props.bodies[a.body].centerOfMass??[0,0,0],l=i?.map((e,t)=>e-c[t]);if(i&&(i.length!==3||!l?.every(e=>Number.isFinite(Math.fround(e)))))throw Error(`Invalid height-field tile position`);let u=t?r?.get(t):void 0;if(!u){let e=t?structuredClone(t):{...s,heights:void 0,validity:void 0},n=gn(e);u={field:e,packed:n,data:r&&n.nodeCount?new Float32Array(n.data):null},t&&r?.set(t,u)}return{collider:a,colliderIndex:e,offset:o,position:i,localOffset:l,...u}}),a=this.terrainAtlas?.bind(i.map(({colliderIndex:e,data:t})=>({collider:e,data:t})));this.terrainRevision===16777215&&(this.wake(),this.terrainRevision=1);let o=++this.terrainRevision;for(let{word:e,data:n}of a?.uploads??[])t.write(n,(this.terrainAtlasWord+e)*4);let s=new Set,c=new Set;for(let e of i){let{collider:n,colliderIndex:r,offset:i,field:l,position:u,localOffset:d,packed:f}=e,p=this.count*48+r*96;if(this.terrainWake&&this.wakeTerrainFootprint(r),a){let e=a.wordsByCollider.get(r),n=e===void 0?0:(this.terrainAtlasWord-this.terrainGeometryWord+e)/4;t.write(new Float32Array([e===void 0?0:n+f.nodeOffset,f.nodeCount,n]),p+72)}else t.write(new Float32Array(f.data),i),t.write(new Float32Array([f.nodeCount]),p+76);t.write(new Float32Array(f.extent),p),t.write(new Float32Array([o,f.triangleCount]),p+88),u&&d&&(t.write(new Float32Array(d),p+16),n.position=[...u]),n.shape={type:`height-field`,field:l},s.add(n.body),this.terrainWake&&this.wakeTerrainFootprint(r),this.props.ensembleBodiesPerInstance&&c.add(Math.floor(n.body/this.props.ensembleBodiesPerInstance))}for(let e of s)this.updateColliderDefinitions(e);for(let e of c)this.wakeEnsembleInstance(e)}getTerrainAtlasStats(){return this.terrainAtlas?.getStats()}setColliderMaterial(e,t){let n=this.colliders[e];if(!this.device||this.destroyed||!Number.isInteger(e)||!n)throw Error(`Invalid collider`);let r=[`average`,`minimum`,`maximum`,`multiply`];if([t.staticFriction??.6,t.dynamicFriction??.6,t.restitution??.1].some(e=>!Number.isFinite(Math.fround(e))||e<0)||(t.restitution??.1)>1||[t.frictionCombine,t.restitutionCombine].some(e=>e!==void 0&&!r.includes(e)))throw Error(`Invalid collider material`);let i=this.props.bodies[n.body],a=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!a)throw Error(`World is not attached`);a.write(new Float32Array([t.restitution??i.restitution??.1,t.staticFriction??i.friction??.6,t.dynamicFriction??i.friction??.6]),this.count*48+e*96+48),a.write(new Float32Array([t.restitutionCombine?r.indexOf(t.restitutionCombine):4,t.frictionCombine?r.indexOf(t.frictionCombine):4]),this.count*48+e*96+64),n.material=structuredClone(t),this.updateColliderDefinitions(n.body),this.wake()}setColliderTransform(e,t,n){let r=this.colliders[e];if(this.destroyed||!this.device||!r||!t.every(e=>Number.isFinite(Math.fround(e))))throw Error(`Invalid collider transform`);let i=V(n),a=this.props.bodies[r.body].centerOfMass??[0,0,0];if(this.props.continuous?.mode!==`convex`&&this.props.continuous?.bodies.includes(r.body)&&t.some((e,t)=>e!==a[t]))throw Error(`Collider transform exceeds continuous envelope`);let o=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);if(!o)throw Error(`World is not attached`);o.write(new Float32Array([...t.map((e,t)=>e-a[t]),r.body,...i]),this.count*48+e*96+16),r.position=[...t],r.orientation=i,this.updateColliderDefinitions(r.body),this.setBodyParameters(r.body,{})}updateColliderDefinitions(e){let{shape:t,colliders:n,...r}=this.props.bodies[e],i=this.colliders.slice(this.bodyColliderStarts[e],this.bodyColliderStarts[e+1]).map(({body:e,...t})=>t);this.props.bodies[e]={...r,colliders:i}}getColliderMaterial(e){let t=this.colliders[e];if(!t||this.destroyed)throw Error(`Invalid collider`);return structuredClone(t.material??{})}restoreColliderDefinitions(e=0,t=this.count){for(let n=e;n<t;n++){let e=this.props.bodies[n],t=e.colliders??(e.shape?[{shape:e.shape}]:[]);for(let[e,r]of t.entries()){let t=this.colliders[this.bodyColliderStarts[n]+e];t.shape=r.shape,t.material=r.material,t.position=r.position,t.orientation=r.orientation}}}setBodyParameters(e,t){if(!this.device||!this.control||!this.controlSettings||this.destroyed||!Number.isInteger(e)||!this.props.bodies[e])throw Error(`Invalid body mutation`);let n=this.props.bodies[e],r={...n,...structuredClone(t)},i=r.mass??1,a=r.mode??(i===0?`static`:`dynamic`),o=r.centerOfMass??[0,0,0],s=n.centerOfMass??[0,0,0];if(![`static`,`dynamic`,`kinematic`].includes(a)||!Number.isFinite(Math.fround(i))||i<0||![...o,...r.velocity??[],...r.angularVelocity??[],r.gravityFactor??1].every(e=>Number.isFinite(Math.fround(e)))||(r.inertiaDiagonal??[]).some(e=>!Number.isFinite(Math.fround(e))||e<0)||r.inertiaOrientation&&!r.inertiaDiagonal)throw Error(`Invalid motion properties`);if(this.props.joints?.length){let t=[...this.props.bodies];t[e]=r,qn(this.props.joints,t,this.solver)}let c=this.colliders.filter(t=>t.body===e);for(let e of c){if(e.shape.type===`height-field`&&a!==`static`)throw Error(`Height fields require static bodies`);if((e.shape.type===`convex-hull`||e.shape.type===`triangle-mesh`)&&a!==`static`&&i>0&&(!e.shape.geometry.closed||!(_n(e.shape).volume>0)))throw Error(`Dynamic meshes require closed positive-volume geometry`)}if(this.props.continuous?.bodies.includes(e)&&(a!==`dynamic`||i===0||this.props.continuous.mode!==`convex`&&(c[0].position??[0,0,0]).some((e,t)=>e!==o[t])))throw Error(`Mutation exceeds the continuous body envelope`);let l=Mn(i,c,o),u=r.inertiaDiagonal??l.diagonal,d=V(r.inertiaOrientation??(r.inertiaDiagonal?void 0:l.orientation)),f=this.ownedBuffers.find(e=>e.id===`${this.id}-bodies`);f.write(new Float32Array([...u.map(e=>a===`dynamic`&&e?1/e:0),o[0],...d,a===`static`?0:a===`dynamic`?1:2,r.gravityFactor??1,o[1],o[2]]),e*48);let p=this.ownedBuffers.find(e=>e.id===`${this.id}-object-attributes`);for(let[t,n]of this.colliders.entries())n.body===e&&(f.write(new Float32Array((n.position??[0,0,0]).map((e,t)=>e-o[t])),this.count*48+t*96+16),p?.write(new Uint32Array([e|(a===`dynamic`?65536:0)]),t*4));this.ownedBuffers.find(e=>e.id===`${this.id}-pose-metadata`)?.write(new Float32Array(o),e*48);let m=new ArrayBuffer(64);new Float32Array(m).set([...o.map((e,t)=>e-s[t]),a===`dynamic`&&i?1/i:0,...t.velocity??[0,0,0],t.velocity?1:0,...t.angularVelocity??[0,0,0],t.angularVelocity?1:0]),new Uint32Array(m).set([e,6,a===this.getBodyMode(e)?0:1],12),this.controlSettings.write(new Uint8Array(m));let h=this.device.createCommandEncoder(),g=h.beginComputePass();this.control.kernel.dispatch(g,{bindings:this.control.bindings,x:1}),this.invalidateState(g),g.end(),this.device.submit(h.finish());let _=[...this.props.bodies];_[e]=r,this.props.bodies=_}applyAngularImpulse(e,t){if(!this.control||!this.device||!this.controlSettings||this.destroyed||!Number.isInteger(e)||e<0||e>=this.count||!t.every(Number.isFinite))throw Error(`Invalid angular impulse`);let n=new ArrayBuffer(64);new Float32Array(n).set(t),new Uint32Array(n)[12]=e,new Uint32Array(n)[13]=5,this.controlSettings.write(new Uint8Array(n));let r=this.device.createCommandEncoder(),i=r.beginComputePass();this.control.kernel.dispatch(i,{bindings:this.control.bindings,x:1}),this.invalidateState(i),i.end(),this.device.submit(r.finish())}setKinematicTarget(e,t,n){if(!this.control||!this.controlSettings||!this.device||this.destroyed||!Number.isInteger(e)||this.props.bodies[e]?.mode!==`kinematic`||!t.every(Number.isFinite))throw Error(`Invalid kinematic target`);let r=V(n),i=jn(r,this.props.bodies[e].centerOfMass??[0,0,0]),a=new ArrayBuffer(64);new Float32Array(a).set([...t.map((e,t)=>e+i[t]),0],4),new Float32Array(a).set(r,8),new Uint32Array(a).set([e,1],12),this.controlSettings.write(new Uint8Array(a));let o=this.device.createCommandEncoder(),s=o.beginComputePass();this.control.kernel.dispatch(s,{bindings:this.control.bindings,x:1}),this.invalidateState(s),s.end(),this.device.submit(o.finish())}getJointStateOffset(){return Math.ceil((this.count*32+(this.broadPhase===`hierarchical-grid`?32+this.maximumPairs*8:16))/16)*16}getJointParameters(e){let t=this.props.joints?.[e];if(!t||this.destroyed)throw Error(`Invalid joint`);return structuredClone(t)}setAngularDriveTargets(e){let t=[...this.props.joints??[]];if(!this.targets||!this.sleepStates||this.destroyed)throw Error(`Inactive world`);for(let[n,r]of e){let e=t[n];if(e?.type!==`general`||!e.angular||!e.drive||!Number.isFinite(Math.fround(r)))throw Error(`Invalid angular drive target`);Math.fround(e.drive.positionTarget??0)!==Math.fround(r)&&(t[n]={...e,drive:{...e.drive,positionTarget:r}})}let n=new Set;for(let[r,i]of e)t[r]!==this.props.joints?.[r]&&(n.add(t[r].first),n.add(t[r].second),this.targets.write(new Float32Array([i]),this.getJointStateOffset()+r*176+160));this.props.joints=t;for(let e of n)this.sleepStates.write(new Float32Array(2),e*16)}setJointParameters(e,t){this.setJointParameterEdits([{index:e,parameters:t}])}setJointParameterEdits(e){for(let{index:t,parameters:n}of e)this.validateJointParameters(t,n);for(let{index:t,parameters:n}of e)this.writeJointParameters(t,n)}validateJointParameters(e,t){let n=this.props.joints?.[e];if(!n||!this.targets||this.destroyed||n.type!==t.type||n.first!==t.first||n.second!==t.second||JSON.stringify(n.firstFrame)!==JSON.stringify(t.firstFrame)||JSON.stringify(n.secondFrame)!==JSON.stringify(t.secondFrame))throw Error(`Joint topology must remain unchanged`);qn([t],this.props.bodies,this.solver)}writeJointParameters(e,t){let n=[...this.props.joints];n[e]=structuredClone(t),this.props.joints=n,this.targets.write(Yn(t),this.getJointStateOffset()+e*176),this.setJointEnabled(e,t.enabled!==!1)}setJointEnabled(e,t){if(!this.control||!this.controlSettings||!this.device||this.destroyed||!Number.isInteger(e)||!this.props.joints?.[e])throw Error(`Invalid joint`);let n=new ArrayBuffer(64);new Float32Array(n)[0]=t?1:0,new Uint32Array(n).set([e,3],12),this.controlSettings.write(new Uint8Array(n));let r=this.device.createCommandEncoder(),i=r.beginComputePass();this.control.kernel.dispatch(i,{bindings:this.control.bindings,x:1}),this.invalidateState(i),i.end(),this.device.submit(r.finish());let a=[...this.props.joints];a[e]={...a[e],enabled:t},this.props.joints=a}wake(){if(this.destroyed||!this.device||!this.invalidation)return;let e=this.device.createCommandEncoder(),t=e.beginComputePass();this.invalidateState(t),t.end(),this.device.submit(e.finish())}readContactEvents(){if(!this.contactEvents||this.destroyed)return Promise.reject(Error(`Contact events are not enabled`));let e=this.contactSnapshotRead;if(this.eventRead&&(!e||this.eventRead.afterSnapshot===e))return this.eventRead.result;let t={afterSnapshot:e,result:this.contactEvents.readAsync().finally(()=>e).then(e=>{let t=yr(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.eventCursor);return this.eventCursor=t.sequence,t}).finally(()=>{this.eventRead===t&&(this.eventRead=null)})};return this.eventRead=t,t.result}raycast(e){return this.runQuery(e)}overlapSphere(e){return this.runQuery(e)}async castBatch(e,t={}){if(!this.device||!this.batchCast||!this.querySelection||!this.batchCastCommands||!this.batchCastResults||this.destroyed||this.queryPending)throw Error(`Batched collision casts are disabled or busy`);if(e.length>this.props.queryBatchCapacity)throw Error(`Collision cast batch exceeds capacity`);if(!e.length)return[];if(t.strategy===`indexed`&&!this.props.queryBatchIndex)throw Error(`Batched collision cast index is disabled`);let n=t.strategy===`scan`?null:this.batchCastOrder,r=t.colliderIndices?Uint32Array.from(new Set(this.validateQueryColliders(t.colliderIndices))):n?.indices??Uint32Array.from({length:this.colliderCount},(e,t)=>t),i=n?.indexedCount??0;if(n&&t.colliderIndices){r.sort((e,t)=>n.ranks[e]-n.ranks[t]);let e=r.findIndex(e=>n.ranks[e]>=n.indexedCount);i=e<0?r.length:e}let a=Rn(e,this.count,r.length,i);this.queryPending=!0;try{this.batchCastCommands.write(a),r.length&&this.querySelection.write(r);let t=this.device.createCommandEncoder();if(this.batchCastIndex&&i)this.batchCastIndex.encode(t,{parameters:e.length});else{let n=t.beginComputePass();this.batchCast.kernel.dispatch(n,{bindings:this.batchCast.bindings,x:e.length}),n.end()}return this.device.submit(t.finish()),Bn(await this.batchCastResults.readAsync(0,e.length*64))}finally{this.queryPending=!1}}validateQueryColliders(e){for(let t of e)if(!Number.isInteger(t)||t<0||t>=this.colliderCount)throw Error(`Invalid query collider`);return e}async runQuery(e){if(!this.device||!this.queryComputation||!this.querySettings||!this.querySelection||!this.queryOutput||this.destroyed||this.queryPending)throw Error(`Queries are disabled or busy`);let t=`origin`in e,n=t&&`radius`in e,r=t?e.origin:e.center,i=t?e.direction:[0,0,0],a=Math.hypot(...i),o=t?1:e.maximumHits??this.colliderCount;if(n&&(!Number.isFinite(e.radius)||e.radius<0)||r.length!==3||!r.every(e=>Number.isFinite(Math.fround(e)))||i.length!==3||!i.every(Number.isFinite)||(t?!Number.isFinite(a)||a===0||!Number.isFinite(e.maximumDistance)||e.maximumDistance<0:!Number.isFinite(e.radius)||e.radius<0)||!Number.isInteger(o)||o<0||o>Math.max(1,this.colliderCount)||e.excludeBody!==void 0&&(!Number.isInteger(e.excludeBody)||e.excludeBody<0||e.excludeBody>=this.count))throw Error(`Invalid collision query`);let s=e.colliderIndices??Array.from({length:this.colliderCount},(e,t)=>t),c=new Uint32Array(this.colliderStorageCount);for(let t of this.validateQueryColliders(s))this.colliders[t].body!==e.excludeBody&&(c[t]=1);this.queryPending=!0;try{let s=new ArrayBuffer(48);new Float32Array(s).set([...r,t?n?e.radius:0:e.radius,...i.map(e=>t?e/a:0),t?e.maximumDistance:1e30]),new Uint32Array(s).set([t?n?2:0:1,o,0,0],8),this.querySettings.write(new Uint8Array(s)),this.querySelection.write(c);let l=this.device.createCommandEncoder(),u=l.beginComputePass();this.queryComputation.kernel.dispatch(u,{bindings:this.queryComputation.bindings,x:Math.ceil(this.colliderStorageCount/64)}),this.queryReduction.kernel.dispatch(u,{bindings:this.queryReduction.bindings,x:1}),u.end(),this.device.submit(l.finish());let d=await this.queryOutput.readAsync(0,16+o*48),f=new Uint32Array(d.buffer,d.byteOffset,d.byteLength/4),p=new Float32Array(d.buffer,d.byteOffset,d.byteLength/4);return{hits:Array.from({length:f[0]},(e,t)=>zn(f,p,4+t*12)),totalHits:f[1],truncated:!t&&f[1]>f[0],complete:f[2]===0}}finally{this.queryPending=!1}}castSphere(e){return this.runQuery(e)}async readState(){if(!this.positions||!this.orientations||!this.velocities||!this.angularVelocities||!this.sleepStates||this.destroyed)throw Error(`Rigid-body world is not active`);let e=await Promise.all([this.positions,this.orientations,this.velocities,this.angularVelocities,this.sleepStates].map(async e=>new Float32Array((await e.readAsync()).buffer)));return Array.from({length:this.count},(t,n)=>{let r=n*4;return{position:[e[0][r],e[0][r+1],e[0][r+2]],orientation:[e[1][r],e[1][r+1],e[1][r+2],e[1][r+3]],velocity:[e[2][r],e[2][r+1],e[2][r+2]],angularVelocity:[e[3][r],e[3][r+1],e[3][r+2]],sleeping:e[4][r+1]>.5}})}readTriggerEvents(){if(!this.triggerEvents||this.destroyed)throw Error(`Triggers are disabled`);let e=this.triggerSnapshotRead;if(this.triggerRead&&(!e||this.triggerRead.afterSnapshot===e))return this.triggerRead.result;let t={afterSnapshot:e,result:this.triggerEvents.readAsync().finally(()=>e).then(e=>{let t=sr(new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),this.triggerCursor);return this.triggerCursor=t.sequence,t}).finally(()=>{this.triggerRead===t&&(this.triggerRead=null)})};return this.triggerRead=t,t.result}resyncContactEvents(){if(!this.device||!this.contactEvents||!this.contactHistory||this.destroyed)return Promise.reject(Error(`Contact events are not enabled`));if(this.contactSnapshotRead)return this.contactSnapshotRead;let e=this.eventRead?.result.catch(()=>void 0);return this.contactSnapshotRead=xr(this.device,this.contactEvents,this.contactHistory,(e,t)=>{let n=[];for(let e=0;e<t.length;e+=4){if(t[e+2]===0)continue;let r=t[e],i=t[e+1];n.push({colliders:[r,i],bodies:[this.colliders[r].body,this.colliders[i].body]})}return{...e,contacts:n}}).finally(()=>e).then(e=>(this.eventCursor=e.sequence,e)).finally(()=>{this.contactSnapshotRead=null}),this.contactSnapshotRead}resyncTriggerEvents(){if(!this.device||!this.triggerEvents||!this.triggerHistory||this.destroyed)return Promise.reject(Error(`Triggers are disabled`));if(this.triggerSnapshotRead)return this.triggerSnapshotRead;let{buffer:e,groups:t}=this.triggerHistory,n=this.triggerRead?.result.catch(()=>void 0);return this.triggerSnapshotRead=xr(this.device,this.triggerEvents,e,(e,n)=>{let r=[];for(let e=0;e<n.length;e+=4)n[e]&1&&r.push({trigger:t[e],body:t[e+1],triggerCollider:n[e+1],collider:n[e+2]});return{...e,overlaps:r}}).finally(()=>n).then(e=>(this.triggerCursor=e.sequence,e)).finally(()=>{this.triggerSnapshotRead=null}),this.triggerSnapshotRead}get eventReadsPending(){return!!(this.eventRead||this.triggerRead||this.contactSnapshotRead||this.triggerSnapshotRead)}getSnapshotBuffers(e=!0){return this.ownedBuffers.filter(t=>e||!t.id.startsWith(`${this.id}-checkpoint-`))}createGPUCheckpoint(e={}){if(!this.device||this.destroyed)throw Error(`Checkpoint requires an attached world`);let t=this.device,n=this.getSnapshotBuffers(e.includeRollbackScratch),r=[],i=!1,a=!1,o=[...this.worldOrigin],s=structuredClone(this.props.joints),c=structuredClone(this.props.bodies),l=0,u=0,d=this.terrainRevision,f=this.terrainAtlas?.snapshot();try{for(let e of n)r.push(t.createBuffer({id:`${e.id}-recovery`,byteLength:e.byteLength,usage:P.COPY_SRC|P.COPY_DST}))}catch(e){for(let e of r)e.destroy();throw e}let p=e=>{if(i||this.destroyed||this.queryPending||this.eventReadsPending)throw Error(`Checkpoint requires an idle live world`);let a=t.createCommandEncoder();for(let[t,i]of n.entries())a.copyBufferToBuffer({sourceBuffer:e?r[t]:i,destinationBuffer:e?i:r[t],size:i.byteLength});t.submit(a.finish())},m=structuredClone(this.colliderShapeScales),h=structuredClone(this.props.publicationBounds),g={byteLength:r.reduce((e,t)=>e+t.byteLength,0),save:()=>{p(!1),o=[...this.worldOrigin],s=structuredClone(this.props.joints),c=structuredClone(this.props.bodies),m=structuredClone(this.colliderShapeScales),h=structuredClone(this.props.publicationBounds),l=this.eventCursor,u=this.triggerCursor,d=this.terrainRevision,f=this.terrainAtlas?.snapshot(),a=!0},restore:()=>{if(!a)throw Error(`Checkpoint has not been saved`);p(!0),this.worldOrigin=[...o],this.props.joints=structuredClone(s),this.props.bodies=structuredClone(c),this.restoreColliderDefinitions(),this.colliderShapeScales=structuredClone(m),this.props.publicationBounds=structuredClone(h),this.eventCursor=l,this.triggerCursor=u,this.terrainRevision=d,f&&this.terrainAtlas.restore(f.leases,(e,t,n)=>f.payloads.get(n))},destroy:()=>{if(!i){i=!0;for(let e of r)e.destroy();this.gpuCheckpoints.delete(g)}}};return this.gpuCheckpoints.add(g),g}async captureState(e={}){if(!this.device||this.destroyed||this.queryPending||this.eventReadsPending)throw Error(`Capture requires an idle attached world`);return{version:1,origin:[...this.worldOrigin],includeRollbackScratch:e.includeRollbackScratch!==!1,props:structuredClone(this.props),colliderShapeScales:structuredClone([...this.colliderShapeScales]),contactCursor:this.eventCursor,triggerCursor:this.triggerCursor,terrainRevision:this.terrainRevision,terrainAtlasLeases:this.terrainAtlas?.getLeases(),buffers:await Promise.all(this.getSnapshotBuffers(e.includeRollbackScratch).map(async e=>({name:e.id.slice(this.id.length+1),data:new Uint8Array(await e.readAsync())})))}}restoreState(e){let t=this.getSnapshotBuffers(e.includeRollbackScratch),n=e.terrainRevision??1;if(!this.device||this.destroyed||this.queryPending||this.eventReadsPending||e.version!==1||!!e.terrainAtlasLeases!=!!this.terrainAtlas||!Number.isInteger(n)||n<1||n>16777215||e.origin!==void 0&&(e.origin.length!==3||!e.origin.every(Number.isFinite))||e.buffers.length!==t.length||kr(e.props)!==kr(this.props)||![e.contactCursor,e.triggerCursor].every(e=>Number.isInteger(e)&&e>=0&&e<=4294967295))throw Error(`Incompatible rigid-body capture`);let r=new Map(e.colliderShapeScales??[]);for(let[e,t]of r)if(this.getColliderShape(e),t.length!==3||t.some(e=>!Number.isFinite(e)||e<=0))throw Error(`Invalid captured collider scale`);for(let[n,r]of t.entries()){let t=e.buffers[n];if(t.name!==r.id.slice(this.id.length+1)||!(t.data instanceof Uint8Array)||t.data.byteLength!==r.byteLength)throw Error(`Incompatible rigid-body capture storage`)}if(this.terrainAtlas&&e.terrainAtlasLeases){let t=e.buffers.find(e=>e.name===`bodies`).data,n=new DataView(t.buffer,t.byteOffset,t.byteLength),r=this.count*48,i=0;for(let e of this.ensembleTerrainSlots)n.getFloat32(r+e*96+76,!0)>0&&i++;if(i!==e.terrainAtlasLeases.length)throw Error(`Incomplete captured terrain atlas leases`);this.terrainAtlas.restore(e.terrainAtlasLeases,(e,n)=>{let r=(this.terrainAtlasWord+e)*4;return new Float32Array(t.slice(r,r+n*4).buffer)},(e,t)=>{let i=r+e*96,a=(this.terrainAtlasWord-this.terrainGeometryWord+t)/4;if(n.getFloat32(i+76,!0)<=0||n.getFloat32(i+80,!0)!==a)throw Error(`Captured terrain collider has an invalid page address`)})}for(let[n,r]of t.entries())r.write(e.buffers[n].data);this.props.joints=structuredClone(e.props.joints),this.props.bodies=structuredClone(e.props.bodies),this.props.publicationBounds=structuredClone(e.props.publicationBounds),this.restoreColliderDefinitions(),this.colliderShapeScales=structuredClone(r),this.worldOrigin=[...e.origin??[0,0,0]],this.eventCursor=e.contactCursor,this.triggerCursor=e.triggerCursor,this.terrainRevision=n}async getRecoveryProps(e={}){if(this.props.failurePolicy!==`rollback`)throw Error(`Recovery requires rollback`);if(this.props.bodies.some(e=>e.mode===`kinematic`))throw Error(`Kinematic recovery requires explicit target replay`);let t=await this.readState();return{...structuredClone(this.props),...e,bodies:this.props.bodies.map((e,n)=>{let r=t[n],i=jn(r.orientation,e.centerOfMass??[0,0,0]);return{...structuredClone(e),position:r.position.map((e,t)=>e-i[t]),orientation:r.orientation,velocity:r.velocity,angularVelocity:r.angularVelocity}})}}async readContinuousWork(){if(this.props.continuous?.mode!==`convex`)return null;let e=this.ownedBuffers.find(e=>e.id===`${this.id}-continuous-status`);if(!e)return null;let t=await e.readAsync(0,16),n=new Uint32Array(t.buffer,t.byteOffset,4),r=await this.ownedBuffers.find(e=>e.id===`${this.id}-continuous-work`).readAsync(16,16),i=new Uint32Array(r.buffer,r.byteOffset,4);return{peakSpatialTests:i[1],rounds:i[2],candidateCapacity:this.props.continuous.maximumCandidates??this.maximumPairs,peakCandidates:n[3],peakCandidateWorkgroups:Math.ceil(Math.min(n[3],this.props.continuous.maximumCandidates??this.maximumPairs)/64),impacts:n[2],incomplete:n[0]!==0}}async readSolverWork(){if(!this.parallelState||this.destroyed)return null;let e=await this.parallelState.readAsync(0,16),t=new Uint32Array(e.buffer,e.byteOffset,4),n=this.props.compactContacts!==!1;return{compacted:n,activeContacts:n?t[1]:null,awakeBodies:n?t[2]:null,awakeContacts:n?t[3]:null,bodyWorkgroups:Math.ceil((n?t[2]:this.count)/64),pairCapacity:this.maximumPairs,pairWorkgroups:Math.ceil((n?t[3]:this.maximumPairs)/64)}}async readSimulationDiagnostics(){if(!this.simulationStatistics||this.destroyed)throw Error(`Rigid-body world is not active`);return In(new Uint32Array((await this.simulationStatistics.readAsync()).buffer))}async readCollisionDiagnostics(){if(!this.manifolds||this.destroyed)throw Error(`Rigid-body world is not active`);let e=this.meshTasks?new Uint32Array((await this.meshTasks.readAsync(0,16)).buffer):new Uint32Array(4),t=this.broadPhaseCounters?Nn(new Uint32Array((await this.broadPhaseCounters.buffer.readAsync(this.broadPhaseCounters.byteOffset,32)).buffer)):void 0,n=this.broadPhase===`hierarchical-grid`?new Uint32Array((await this.targets.readAsync(this.count*32+16,4)).buffer)[0]:0;return{unresolvedQueries:e[2],triangleQueries:e[0],droppedTriangleQueries:e[1],incompleteMeshQueries:e[3],droppedManifolds:n,incompleteIslandUnions:this.parallelState?new Uint32Array((await this.parallelState.readAsync(0,4)).buffer)[0]:0,broadPhase:t}}destroy(){if(!this.destroyed){this.ensembleReset?.destroy();for(let e of this.gpuCheckpoints)e.destroy();this.destroyed=!0,this.control?.kernel.destroy(),this.invalidation?.kernel.destroy(),this.terrainWake?.kernel.destroy(),this.queryComputation?.kernel.destroy(),this.queryReduction?.kernel.destroy(),this.batchCastIndex?.destroy(),this.batchCast?.kernel.destroy();for(let e of this.ownedBuffers)e.destroy();this.ownedBuffers.length=0}}};function kr(e){return JSON.stringify({...e,id:void 0,publicationBounds:e.publicationBounds?e.publicationBounds.map(()=>!0):void 0,bodies:e.bodies.map(e=>({...e,shape:void 0,colliders:(e.colliders??[{shape:e.shape}]).map(e=>({...e,shape:e.shape?.type===`convex-hull`||e.shape?.type===`triangle-mesh`?e.shape:e.shape?.type===`height-field`?{type:e.shape.type,width:e.shape.field.width,height:e.shape.field.height}:{type:e.shape?.type},material:void 0,position:void 0,orientation:void 0})),mode:void 0,mass:void 0,centerOfMass:void 0,inertiaDiagonal:void 0,inertiaOrientation:void 0,velocity:void 0,angularVelocity:void 0,gravityFactor:void 0})),joints:e.joints?.map(e=>({type:e.type,first:e.first,second:e.second,firstFrame:e.firstFrame,secondFrame:e.secondFrame}))},(e,t)=>{if(!t||typeof t!=`object`||Array.isArray(t))return t;let n=t;return Object.fromEntries(Object.keys(n).sort().map(e=>[e,n[e]]))})}var Ar=a((e=>{var t=Symbol.for(`react.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.provider`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.iterator;function p(e){return typeof e!=`object`||!e?null:(e=f&&e[f]||e[`@@iterator`],typeof e==`function`?e:null)}var m={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},h=Object.assign,g={};function _(e,t,n){this.props=e,this.context=t,this.refs=g,this.updater=n||m}_.prototype.isReactComponent={},_.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`setState(...): takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},_.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function v(){}v.prototype=_.prototype;function y(e,t,n){this.props=e,this.context=t,this.refs=g,this.updater=n||m}var b=y.prototype=new v;b.constructor=y,h(b,_.prototype),b.isPureReactComponent=!0;var x=Array.isArray,S=Object.prototype.hasOwnProperty,C={current:null},w={key:!0,ref:!0,__self:!0,__source:!0};function ee(e,n,r){var i,a={},o=null,s=null;if(n!=null)for(i in n.ref!==void 0&&(s=n.ref),n.key!==void 0&&(o=``+n.key),n)S.call(n,i)&&!w.hasOwnProperty(i)&&(a[i]=n[i]);var c=arguments.length-2;if(c===1)a.children=r;else if(1<c){for(var l=Array(c),u=0;u<c;u++)l[u]=arguments[u+2];a.children=l}if(e&&e.defaultProps)for(i in c=e.defaultProps,c)a[i]===void 0&&(a[i]=c[i]);return{$$typeof:t,type:e,key:o,ref:s,props:a,_owner:C.current}}function T(e,n){return{$$typeof:t,type:e.type,key:n,ref:e.ref,props:e.props,_owner:e._owner}}function E(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function D(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var te=/\/+/g;function O(e,t){return typeof e==`object`&&e&&e.key!=null?D(``+e.key):t.toString(36)}function k(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0}}if(c)return c=e,o=o(c),e=a===``?`.`+O(c,0):a,x(o)?(i=``,e!=null&&(i=e.replace(te,`$&/`)+`/`),k(o,r,i,``,function(e){return e})):o!=null&&(E(o)&&(o=T(o,i+(!o.key||c&&c.key===o.key?``:(``+o.key).replace(te,`$&/`)+`/`)+e)),r.push(o)),1;if(c=0,a=a===``?`.`:a+`:`,x(e))for(var l=0;l<e.length;l++){s=e[l];var u=a+O(s,l);c+=k(s,r,i,u,o)}else if(u=p(e),typeof u==`function`)for(e=u.call(e),l=0;!(s=e.next()).done;)s=s.value,u=a+O(s,l++),c+=k(s,r,i,u,o);else if(s===`object`)throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`);return c}function A(e,t,n){if(e==null)return e;var r=[],i=0;return k(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function j(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t)},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var M={current:null},ne={transition:null},re={ReactCurrentDispatcher:M,ReactCurrentBatchConfig:ne,ReactCurrentOwner:C};function N(){throw Error(`act(...) is not supported in production builds of React.`)}e.Children={map:A,forEach:function(e,t,n){A(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return A(e,function(){t++}),t},toArray:function(e){return A(e,function(e){return e})||[]},only:function(e){if(!E(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}},e.Component=_,e.Fragment=r,e.Profiler=a,e.PureComponent=y,e.StrictMode=i,e.Suspense=l,e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=re,e.act=N,e.cloneElement=function(e,n,r){if(e==null)throw Error(`React.cloneElement(...): The argument must be a React element, but you passed `+e+`.`);var i=h({},e.props),a=e.key,o=e.ref,s=e._owner;if(n!=null){if(n.ref!==void 0&&(o=n.ref,s=C.current),n.key!==void 0&&(a=``+n.key),e.type&&e.type.defaultProps)var c=e.type.defaultProps;for(l in n)S.call(n,l)&&!w.hasOwnProperty(l)&&(i[l]=n[l]===void 0&&c!==void 0?c[l]:n[l])}var l=arguments.length-2;if(l===1)i.children=r;else if(1<l){c=Array(l);for(var u=0;u<l;u++)c[u]=arguments[u+2];i.children=c}return{$$typeof:t,type:e.type,key:a,ref:o,props:i,_owner:s}},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:o,_context:e},e.Consumer=e},e.createElement=ee,e.createFactory=function(e){var t=ee.bind(null,e);return t.type=e,t},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=E,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:j}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=function(e){var t=ne.transition;ne.transition={};try{e()}finally{ne.transition=t}},e.unstable_act=N,e.useCallback=function(e,t){return M.current.useCallback(e,t)},e.useContext=function(e){return M.current.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e){return M.current.useDeferredValue(e)},e.useEffect=function(e,t){return M.current.useEffect(e,t)},e.useId=function(){return M.current.useId()},e.useImperativeHandle=function(e,t,n){return M.current.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return M.current.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return M.current.useLayoutEffect(e,t)},e.useMemo=function(e,t){return M.current.useMemo(e,t)},e.useReducer=function(e,t,n){return M.current.useReducer(e,t,n)},e.useRef=function(e){return M.current.useRef(e)},e.useState=function(e){return M.current.useState(e)},e.useSyncExternalStore=function(e,t,n){return M.current.useSyncExternalStore(e,t,n)},e.useTransition=function(){return M.current.useTransition()},e.version=`18.3.1`})),jr=a(((e,t)=>{t.exports=Ar()})),Mr=a((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=typeof setTimeout==`function`?setTimeout:null,_=typeof clearTimeout==`function`?clearTimeout:null,v=typeof setImmediate<`u`?setImmediate:null;typeof navigator<`u`&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function y(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function b(e){if(h=!1,y(e),!m)if(n(c)!==null)m=!0,A(x);else{var t=n(l);t!==null&&j(b,t.startTime-e)}}function x(t,i){m=!1,h&&(h=!1,_(w),w=-1),p=!0;var a=f;try{for(y(i),d=n(c);d!==null&&(!(d.expirationTime>i)||t&&!E());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=i);i=e.unstable_now(),typeof s==`function`?d.callback=s:d===n(c)&&r(c),y(i)}else r(c);d=n(c)}if(d!==null)var u=!0;else{var g=n(l);g!==null&&j(b,g.startTime-i),u=!1}return u}finally{d=null,f=a,p=!1}}var S=!1,C=null,w=-1,ee=5,T=-1;function E(){return!(e.unstable_now()-T<ee)}function D(){if(C!==null){var t=e.unstable_now();T=t;var n=!0;try{n=C(!0,t)}finally{n?te():(S=!1,C=null)}}else S=!1}var te;if(typeof v==`function`)te=function(){v(D)};else if(typeof MessageChannel<`u`){var O=new MessageChannel,k=O.port2;O.port1.onmessage=D,te=function(){k.postMessage(null)}}else te=function(){g(D,0)};function A(e){C=e,S||(S=!0,te())}function j(t,n){w=g(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_continueExecution=function(){m||p||(m=!0,A(x))},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):ee=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_getFirstCallbackNode=function(){return n(c)},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_pauseExecution=function(){},e.unstable_requestPaint=function(){},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(_(w),w=-1):h=!0,j(b,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,A(x))),r},e.unstable_shouldYield=E,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),Nr=a(((e,t)=>{t.exports=Mr()})),Pr=a((e=>{var t=jr(),n=Nr();function r(e){for(var t=`https://reactjs.org/docs/error-decoder.html?invariant=`+e,n=1;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n]);return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}var i=new Set,a={};function o(e,t){s(e,t),s(e+`Capture`,t)}function s(e,t){for(a[e]=t,e=0;e<t.length;e++)i.add(t[e])}var c=!(typeof window>`u`||window.document===void 0||window.document.createElement===void 0),l=Object.prototype.hasOwnProperty,u=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,d={},f={};function p(e){return l.call(f,e)?!0:l.call(d,e)?!1:u.test(e)?f[e]=!0:(d[e]=!0,!1)}function m(e,t,n,r){if(n!==null&&n.type===0)return!1;switch(typeof t){case`function`:case`symbol`:return!0;case`boolean`:return r?!1:n===null?(e=e.toLowerCase().slice(0,5),e!==`data-`&&e!==`aria-`):!n.acceptsBooleans;default:return!1}}function h(e,t,n,r){if(t==null||m(e,t,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return!1===t;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function g(e,t,n,r,i,a,o){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=r,this.attributeNamespace=i,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=a,this.removeEmptyString=o}var _={};`children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style`.split(` `).forEach(function(e){_[e]=new g(e,0,!1,e,null,!1,!1)}),[[`acceptCharset`,`accept-charset`],[`className`,`class`],[`htmlFor`,`for`],[`httpEquiv`,`http-equiv`]].forEach(function(e){var t=e[0];_[t]=new g(t,1,!1,e[1],null,!1,!1)}),[`contentEditable`,`draggable`,`spellCheck`,`value`].forEach(function(e){_[e]=new g(e,2,!1,e.toLowerCase(),null,!1,!1)}),[`autoReverse`,`externalResourcesRequired`,`focusable`,`preserveAlpha`].forEach(function(e){_[e]=new g(e,2,!1,e,null,!1,!1)}),`allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope`.split(` `).forEach(function(e){_[e]=new g(e,3,!1,e.toLowerCase(),null,!1,!1)}),[`checked`,`multiple`,`muted`,`selected`].forEach(function(e){_[e]=new g(e,3,!0,e,null,!1,!1)}),[`capture`,`download`].forEach(function(e){_[e]=new g(e,4,!1,e,null,!1,!1)}),[`cols`,`rows`,`size`,`span`].forEach(function(e){_[e]=new g(e,6,!1,e,null,!1,!1)}),[`rowSpan`,`start`].forEach(function(e){_[e]=new g(e,5,!1,e.toLowerCase(),null,!1,!1)});var v=/[\-:]([a-z])/g;function y(e){return e[1].toUpperCase()}`accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height`.split(` `).forEach(function(e){var t=e.replace(v,y);_[t]=new g(t,1,!1,e,null,!1,!1)}),`xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type`.split(` `).forEach(function(e){var t=e.replace(v,y);_[t]=new g(t,1,!1,e,`http://www.w3.org/1999/xlink`,!1,!1)}),[`xml:base`,`xml:lang`,`xml:space`].forEach(function(e){var t=e.replace(v,y);_[t]=new g(t,1,!1,e,`http://www.w3.org/XML/1998/namespace`,!1,!1)}),[`tabIndex`,`crossOrigin`].forEach(function(e){_[e]=new g(e,1,!1,e.toLowerCase(),null,!1,!1)}),_.xlinkHref=new g(`xlinkHref`,1,!1,`xlink:href`,`http://www.w3.org/1999/xlink`,!0,!1),[`src`,`href`,`action`,`formAction`].forEach(function(e){_[e]=new g(e,1,!1,e.toLowerCase(),null,!0,!0)});function b(e,t,n,r){var i=_.hasOwnProperty(t)?_[t]:null;(i===null?r||!(2<t.length)||t[0]!==`o`&&t[0]!==`O`||t[1]!==`n`&&t[1]!==`N`:i.type!==0)&&(h(t,n,i,r)&&(n=null),r||i===null?p(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,``+n)):i.mustUseProperty?e[i.propertyName]=n===null?i.type===3?!1:``:n:(t=i.attributeName,r=i.attributeNamespace,n===null?e.removeAttribute(t):(i=i.type,n=i===3||i===4&&!0===n?``:``+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}var x=t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,S=Symbol.for(`react.element`),C=Symbol.for(`react.portal`),w=Symbol.for(`react.fragment`),ee=Symbol.for(`react.strict_mode`),T=Symbol.for(`react.profiler`),E=Symbol.for(`react.provider`),D=Symbol.for(`react.context`),te=Symbol.for(`react.forward_ref`),O=Symbol.for(`react.suspense`),k=Symbol.for(`react.suspense_list`),A=Symbol.for(`react.memo`),j=Symbol.for(`react.lazy`),M=Symbol.for(`react.offscreen`),ne=Symbol.iterator;function re(e){return typeof e!=`object`||!e?null:(e=ne&&e[ne]||e[`@@iterator`],typeof e==`function`?e:null)}var N=Object.assign,P;function ie(e){if(P===void 0)try{throw Error()}catch(e){var t=e.stack.trim().match(/\n( *(at )?)/);P=t&&t[1]||``}return`
`+P+e}var ae=!1;function oe(e,t){if(!e||ae)return``;ae=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,`props`,{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(t,[])}catch(e){var r=e}Reflect.construct(e,[],t)}else{try{t.call()}catch(e){r=e}e.call(t.prototype)}else{try{throw Error()}catch(e){r=e}e()}}catch(t){if(t&&r&&typeof t.stack==`string`){for(var i=t.stack.split(`
`),a=r.stack.split(`
`),o=i.length-1,s=a.length-1;1<=o&&0<=s&&i[o]!==a[s];)s--;for(;1<=o&&0<=s;o--,s--)if(i[o]!==a[s]){if(o!==1||s!==1)do if(o--,s--,0>s||i[o]!==a[s]){var c=`
`+i[o].replace(` at new `,` at `);return e.displayName&&c.includes(`<anonymous>`)&&(c=c.replace(`<anonymous>`,e.displayName)),c}while(1<=o&&0<=s);break}}}finally{ae=!1,Error.prepareStackTrace=n}return(e=e?e.displayName||e.name:``)?ie(e):``}function se(e){switch(e.tag){case 5:return ie(e.type);case 16:return ie(`Lazy`);case 13:return ie(`Suspense`);case 19:return ie(`SuspenseList`);case 0:case 2:case 15:return e=oe(e.type,!1),e;case 11:return e=oe(e.type.render,!1),e;case 1:return e=oe(e.type,!0),e;default:return``}}function ce(e){if(e==null)return null;if(typeof e==`function`)return e.displayName||e.name||null;if(typeof e==`string`)return e;switch(e){case w:return`Fragment`;case C:return`Portal`;case T:return`Profiler`;case ee:return`StrictMode`;case O:return`Suspense`;case k:return`SuspenseList`}if(typeof e==`object`)switch(e.$$typeof){case D:return(e.displayName||`Context`)+`.Consumer`;case E:return(e._context.displayName||`Context`)+`.Provider`;case te:var t=e.render;return e=e.displayName,e||=(e=t.displayName||t.name||``,e===``?`ForwardRef`:`ForwardRef(`+e+`)`),e;case A:return t=e.displayName||null,t===null?ce(e.type)||`Memo`:t;case j:t=e._payload,e=e._init;try{return ce(e(t))}catch{}}return null}function le(e){var t=e.type;switch(e.tag){case 24:return`Cache`;case 9:return(t.displayName||`Context`)+`.Consumer`;case 10:return(t._context.displayName||`Context`)+`.Provider`;case 18:return`DehydratedFragment`;case 11:return e=t.render,e=e.displayName||e.name||``,t.displayName||(e===``?`ForwardRef`:`ForwardRef(`+e+`)`);case 7:return`Fragment`;case 5:return t;case 4:return`Portal`;case 3:return`Root`;case 6:return`Text`;case 16:return ce(t);case 8:return t===ee?`StrictMode`:`Mode`;case 22:return`Offscreen`;case 12:return`Profiler`;case 21:return`Scope`;case 13:return`Suspense`;case 19:return`SuspenseList`;case 25:return`TracingMarker`;case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t==`function`)return t.displayName||t.name||null;if(typeof t==`string`)return t}return null}function ue(e){switch(typeof e){case`boolean`:case`number`:case`string`:case`undefined`:return e;case`object`:return e;default:return``}}function de(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()===`input`&&(t===`checkbox`||t===`radio`)}function fe(e){var t=de(e)?`checked`:`value`,n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=``+e[t];if(!e.hasOwnProperty(t)&&n!==void 0&&typeof n.get==`function`&&typeof n.set==`function`){var i=n.get,a=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){r=``+e,a.call(this,e)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(e){r=``+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function pe(e){e._valueTracker||=fe(e)}function me(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r=``;return e&&(r=de(e)?e.checked?`true`:`false`:e.value),e=r,e===n?!1:(t.setValue(e),!0)}function he(e){if(e||=typeof document<`u`?document:void 0,e===void 0)return null;try{return e.activeElement||e.body}catch{return e.body}}function ge(e,t){var n=t.checked;return N({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??e._wrapperState.initialChecked})}function _e(e,t){var n=t.defaultValue==null?``:t.defaultValue,r=t.checked==null?t.defaultChecked:t.checked;n=ue(t.value==null?n:t.value),e._wrapperState={initialChecked:r,initialValue:n,controlled:t.type===`checkbox`||t.type===`radio`?t.checked!=null:t.value!=null}}function ve(e,t){t=t.checked,t!=null&&b(e,`checked`,t,!1)}function ye(e,t){ve(e,t);var n=ue(t.value),r=t.type;if(n!=null)r===`number`?(n===0&&e.value===``||e.value!=n)&&(e.value=``+n):e.value!==``+n&&(e.value=``+n);else if(r===`submit`||r===`reset`){e.removeAttribute(`value`);return}t.hasOwnProperty(`value`)?xe(e,t.type,n):t.hasOwnProperty(`defaultValue`)&&xe(e,t.type,ue(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function be(e,t,n){if(t.hasOwnProperty(`value`)||t.hasOwnProperty(`defaultValue`)){var r=t.type;if(!(r!==`submit`&&r!==`reset`||t.value!==void 0&&t.value!==null))return;t=``+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==``&&(e.name=``),e.defaultChecked=!!e._wrapperState.initialChecked,n!==``&&(e.name=n)}function xe(e,t,n){(t!==`number`||he(e.ownerDocument)!==e)&&(n==null?e.defaultValue=``+e._wrapperState.initialValue:e.defaultValue!==``+n&&(e.defaultValue=``+n))}var Se=Array.isArray;function Ce(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t[`$`+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty(`$`+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=``+ue(n),t=null,i=0;i<e.length;i++){if(e[i].value===n){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function we(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(r(91));return N({},t,{value:void 0,defaultValue:void 0,children:``+e._wrapperState.initialValue})}function Te(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(r(92));if(Se(n)){if(1<n.length)throw Error(r(93));n=n[0]}t=n}t??=``,n=t}e._wrapperState={initialValue:ue(n)}}function Ee(e,t){var n=ue(t.value),r=ue(t.defaultValue);n!=null&&(n=``+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),r!=null&&(e.defaultValue=``+r)}function De(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==``&&t!==null&&(e.value=t)}function Oe(e){switch(e){case`svg`:return`http://www.w3.org/2000/svg`;case`math`:return`http://www.w3.org/1998/Math/MathML`;default:return`http://www.w3.org/1999/xhtml`}}function ke(e,t){return e==null||e===`http://www.w3.org/1999/xhtml`?Oe(t):e===`http://www.w3.org/2000/svg`&&t===`foreignObject`?`http://www.w3.org/1999/xhtml`:e}var Ae,je=function(e){return typeof MSApp<`u`&&MSApp.execUnsafeLocalFunction?function(t,n,r,i){MSApp.execUnsafeLocalFunction(function(){return e(t,n,r,i)})}:e}(function(e,t){if(e.namespaceURI!==`http://www.w3.org/2000/svg`||`innerHTML`in e)e.innerHTML=t;else{for(Ae||=document.createElement(`div`),Ae.innerHTML=`<svg>`+t.valueOf().toString()+`</svg>`,t=Ae.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Me(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Ne={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Pe=[`Webkit`,`ms`,`Moz`,`O`];Object.keys(Ne).forEach(function(e){Pe.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Ne[t]=Ne[e]})});function Fe(e,t,n){return t==null||typeof t==`boolean`||t===``?``:n||typeof t!=`number`||t===0||Ne.hasOwnProperty(e)&&Ne[e]?(``+t).trim():t+`px`}function Ie(e,t){for(var n in e=e.style,t)if(t.hasOwnProperty(n)){var r=n.indexOf(`--`)===0,i=Fe(n,t[n],r);n===`float`&&(n=`cssFloat`),r?e.setProperty(n,i):e[n]=i}}var Le=N({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Re(e,t){if(t){if(Le[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(r(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(r(60));if(typeof t.dangerouslySetInnerHTML!=`object`||!(`__html`in t.dangerouslySetInnerHTML))throw Error(r(61))}if(t.style!=null&&typeof t.style!=`object`)throw Error(r(62))}}function ze(e,t){if(e.indexOf(`-`)===-1)return typeof t.is==`string`;switch(e){case`annotation-xml`:case`color-profile`:case`font-face`:case`font-face-src`:case`font-face-uri`:case`font-face-format`:case`font-face-name`:case`missing-glyph`:return!1;default:return!0}}var Be=null;function Ve(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var He=null,Ue=null,We=null;function Ge(e){if(e=zi(e)){if(typeof He!=`function`)throw Error(r(280));var t=e.stateNode;t&&(t=Vi(t),He(e.stateNode,e.type,t))}}function Ke(e){Ue?We?We.push(e):We=[e]:Ue=e}function qe(){if(Ue){var e=Ue,t=We;if(We=Ue=null,Ge(e),t)for(e=0;e<t.length;e++)Ge(t[e])}}function Je(e,t){return e(t)}function Ye(){}var Xe=!1;function Ze(e,t,n){if(Xe)return e(t,n);Xe=!0;try{return Je(e,t,n)}finally{Xe=!1,(Ue!==null||We!==null)&&(Ye(),qe())}}function Qe(e,t){var n=e.stateNode;if(n===null)return null;var i=Vi(n);if(i===null)return null;n=i[t];a:switch(t){case`onClick`:case`onClickCapture`:case`onDoubleClick`:case`onDoubleClickCapture`:case`onMouseDown`:case`onMouseDownCapture`:case`onMouseMove`:case`onMouseMoveCapture`:case`onMouseUp`:case`onMouseUpCapture`:case`onMouseEnter`:(i=!i.disabled)||(e=e.type,i=!(e===`button`||e===`input`||e===`select`||e===`textarea`)),e=!i;break a;default:e=!1}if(e)return null;if(n&&typeof n!=`function`)throw Error(r(231,t,typeof n));return n}var $e=!1;if(c)try{var et={};Object.defineProperty(et,`passive`,{get:function(){$e=!0}}),window.addEventListener(`test`,et,et),window.removeEventListener(`test`,et,et)}catch{$e=!1}function tt(e,t,n,r,i,a,o,s,c){var l=Array.prototype.slice.call(arguments,3);try{t.apply(n,l)}catch(e){this.onError(e)}}var nt=!1,rt=null,it=!1,at=null,ot={onError:function(e){nt=!0,rt=e}};function F(e,t,n,r,i,a,o,s,c){nt=!1,rt=null,tt.apply(ot,arguments)}function st(e,t,n,i,a,o,s,c,l){if(F.apply(this,arguments),nt){if(nt){var u=rt;nt=!1,rt=null}else throw Error(r(198));it||(it=!0,at=u)}}function I(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function ct(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function L(e){if(I(e)!==e)throw Error(r(188))}function lt(e){var t=e.alternate;if(!t){if(t=I(e),t===null)throw Error(r(188));return t===e?e:null}for(var n=e,i=t;;){var a=n.return;if(a===null)break;var o=a.alternate;if(o===null){if(i=a.return,i!==null){n=i;continue}break}if(a.child===o.child){for(o=a.child;o;){if(o===n)return L(a),e;if(o===i)return L(a),t;o=o.sibling}throw Error(r(188))}if(n.return!==i.return)n=a,i=o;else{for(var s=!1,c=a.child;c;){if(c===n){s=!0,n=a,i=o;break}if(c===i){s=!0,i=a,n=o;break}c=c.sibling}if(!s){for(c=o.child;c;){if(c===n){s=!0,n=o,i=a;break}if(c===i){s=!0,i=o,n=a;break}c=c.sibling}if(!s)throw Error(r(189))}}if(n.alternate!==i)throw Error(r(190))}if(n.tag!==3)throw Error(r(188));return n.stateNode.current===n?e:t}function ut(e){return e=lt(e),e===null?null:dt(e)}function dt(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=dt(e);if(t!==null)return t;e=e.sibling}return null}var ft=n.unstable_scheduleCallback,pt=n.unstable_cancelCallback,mt=n.unstable_shouldYield,ht=n.unstable_requestPaint,R=n.unstable_now,gt=n.unstable_getCurrentPriorityLevel,_t=n.unstable_ImmediatePriority,vt=n.unstable_UserBlockingPriority,yt=n.unstable_NormalPriority,bt=n.unstable_LowPriority,xt=n.unstable_IdlePriority,St=null,Ct=null;function wt(e){if(Ct&&typeof Ct.onCommitFiberRoot==`function`)try{Ct.onCommitFiberRoot(St,e,void 0,(e.current.flags&128)==128)}catch{}}var Tt=Math.clz32?Math.clz32:Ot,Et=Math.log,Dt=Math.LN2;function Ot(e){return e>>>=0,e===0?32:31-(Et(e)/Dt|0)|0}var kt=64,At=4194304;function jt(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function Mt(e,t){var n=e.pendingLanes;if(n===0)return 0;var r=0,i=e.suspendedLanes,a=e.pingedLanes,o=n&268435455;if(o!==0){var s=o&~i;s===0?(a&=o,a!==0&&(r=jt(a))):r=jt(s)}else o=n&~i,o===0?a!==0&&(r=jt(a)):r=jt(o);if(r===0)return 0;if(t!==0&&t!==r&&(t&i)===0&&(i=r&-r,a=t&-t,i>=a||i===16&&a&4194240))return t;if(r&4&&(r|=n&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=r;0<t;)n=31-Tt(t),i=1<<n,r|=e[n],t&=~i;return r}function Nt(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Pt(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes;0<a;){var o=31-Tt(a),s=1<<o,c=i[o];c===-1?((s&n)===0||(s&r)!==0)&&(i[o]=Nt(s,t)):c<=t&&(e.expiredLanes|=s),a&=~s}}function Ft(e){return e=e.pendingLanes&-1073741825,e===0?e&1073741824?1073741824:0:e}function It(){var e=kt;return kt<<=1,!(kt&4194240)&&(kt=64),e}function Lt(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Rt(e,t,n){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-Tt(t),e[t]=n}function zt(e,t){var n=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<n;){var i=31-Tt(n),a=1<<i;t[i]=0,r[i]=-1,e[i]=-1,n&=~a}}function Bt(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-Tt(n),i=1<<r;i&t|e[r]&t&&(e[r]|=t),n&=~i}}var z=0;function Vt(e){return e&=-e,1<e?4<e?e&268435455?16:536870912:4:1}var Ht,Ut,Wt,Gt,Kt,qt=!1,Jt=[],Yt=null,Xt=null,Zt=null,Qt=new Map,$t=new Map,en=[],tn=`mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit`.split(` `);function nn(e,t){switch(e){case`focusin`:case`focusout`:Yt=null;break;case`dragenter`:case`dragleave`:Xt=null;break;case`mouseover`:case`mouseout`:Zt=null;break;case`pointerover`:case`pointerout`:Qt.delete(t.pointerId);break;case`gotpointercapture`:case`lostpointercapture`:$t.delete(t.pointerId)}}function rn(e,t,n,r,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:a,targetContainers:[i]},t!==null&&(t=zi(t),t!==null&&Ut(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function an(e,t,n,r,i){switch(t){case`focusin`:return Yt=rn(Yt,e,t,n,r,i),!0;case`dragenter`:return Xt=rn(Xt,e,t,n,r,i),!0;case`mouseover`:return Zt=rn(Zt,e,t,n,r,i),!0;case`pointerover`:var a=i.pointerId;return Qt.set(a,rn(Qt.get(a)||null,e,t,n,r,i)),!0;case`gotpointercapture`:return a=i.pointerId,$t.set(a,rn($t.get(a)||null,e,t,n,r,i)),!0}return!1}function on(e){var t=Ri(e.target);if(t!==null){var n=I(t);if(n!==null){if(t=n.tag,t===13){if(t=ct(n),t!==null){e.blockedOn=t,Kt(e.priority,function(){Wt(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function sn(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=_n(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);Be=r,n.target.dispatchEvent(r),Be=null}else return t=zi(n),t!==null&&Ut(t),e.blockedOn=n,!1;t.shift()}return!0}function cn(e,t,n){sn(e)&&n.delete(t)}function ln(){qt=!1,Yt!==null&&sn(Yt)&&(Yt=null),Xt!==null&&sn(Xt)&&(Xt=null),Zt!==null&&sn(Zt)&&(Zt=null),Qt.forEach(cn),$t.forEach(cn)}function B(e,t){e.blockedOn===t&&(e.blockedOn=null,qt||(qt=!0,n.unstable_scheduleCallback(n.unstable_NormalPriority,ln)))}function un(e){function t(t){return B(t,e)}if(0<Jt.length){B(Jt[0],e);for(var n=1;n<Jt.length;n++){var r=Jt[n];r.blockedOn===e&&(r.blockedOn=null)}}for(Yt!==null&&B(Yt,e),Xt!==null&&B(Xt,e),Zt!==null&&B(Zt,e),Qt.forEach(t),$t.forEach(t),n=0;n<en.length;n++)r=en[n],r.blockedOn===e&&(r.blockedOn=null);for(;0<en.length&&(n=en[0],n.blockedOn===null);)on(n),n.blockedOn===null&&en.shift()}var dn=x.ReactCurrentBatchConfig,fn=!0;function pn(e,t,n,r){var i=z,a=dn.transition;dn.transition=null;try{z=1,hn(e,t,n,r)}finally{z=i,dn.transition=a}}function mn(e,t,n,r){var i=z,a=dn.transition;dn.transition=null;try{z=4,hn(e,t,n,r)}finally{z=i,dn.transition=a}}function hn(e,t,n,r){if(fn){var i=_n(e,t,n,r);if(i===null)ui(e,t,r,gn,n),nn(e,r);else if(an(i,e,t,n,r))r.stopPropagation();else if(nn(e,r),t&4&&-1<tn.indexOf(e)){for(;i!==null;){var a=zi(i);if(a!==null&&Ht(a),a=_n(e,t,n,r),a===null&&ui(e,t,r,gn,n),a===i)break;i=a}i!==null&&r.stopPropagation()}else ui(e,t,r,null,n)}}var gn=null;function _n(e,t,n,r){if(gn=null,e=Ve(r),e=Ri(e),e!==null)if(t=I(e),t===null)e=null;else if(n=t.tag,n===13){if(e=ct(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return gn=e,null}function vn(e){switch(e){case`cancel`:case`click`:case`close`:case`contextmenu`:case`copy`:case`cut`:case`auxclick`:case`dblclick`:case`dragend`:case`dragstart`:case`drop`:case`focusin`:case`focusout`:case`input`:case`invalid`:case`keydown`:case`keypress`:case`keyup`:case`mousedown`:case`mouseup`:case`paste`:case`pause`:case`play`:case`pointercancel`:case`pointerdown`:case`pointerup`:case`ratechange`:case`reset`:case`resize`:case`seeked`:case`submit`:case`touchcancel`:case`touchend`:case`touchstart`:case`volumechange`:case`change`:case`selectionchange`:case`textInput`:case`compositionstart`:case`compositionend`:case`compositionupdate`:case`beforeblur`:case`afterblur`:case`beforeinput`:case`blur`:case`fullscreenchange`:case`focus`:case`hashchange`:case`popstate`:case`select`:case`selectstart`:return 1;case`drag`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`mousemove`:case`mouseout`:case`mouseover`:case`pointermove`:case`pointerout`:case`pointerover`:case`scroll`:case`toggle`:case`touchmove`:case`wheel`:case`mouseenter`:case`mouseleave`:case`pointerenter`:case`pointerleave`:return 4;case`message`:switch(gt()){case _t:return 1;case vt:return 4;case yt:case bt:return 16;case xt:return 536870912;default:return 16}default:return 16}}var yn=null,bn=null,xn=null;function Sn(){if(xn)return xn;var e,t=bn,n=t.length,r,i=`value`in yn?yn.value:yn.textContent,a=i.length;for(e=0;e<n&&t[e]===i[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===i[a-r];r++);return xn=i.slice(e,1<r?1-r:void 0)}function Cn(e){var t=e.keyCode;return`charCode`in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function wn(){return!0}function Tn(){return!1}function En(e){function t(t,n,r,i,a){for(var o in this._reactName=t,this._targetInst=r,this.type=n,this.nativeEvent=i,this.target=a,this.currentTarget=null,e)e.hasOwnProperty(o)&&(t=e[o],this[o]=t?t(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented==null?!1===i.returnValue:i.defaultPrevented)?wn:Tn,this.isPropagationStopped=Tn,this}return N(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!=`unknown`&&(e.returnValue=!1),this.isDefaultPrevented=wn)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!=`unknown`&&(e.cancelBubble=!0),this.isPropagationStopped=wn)},persist:function(){},isPersistent:wn}),t}var Dn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},On=En(Dn),kn=N({},Dn,{view:0,detail:0}),An=En(kn),jn,V,Mn,Nn=N({},kn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Wn,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return`movementX`in e?e.movementX:(e!==Mn&&(Mn&&e.type===`mousemove`?(jn=e.screenX-Mn.screenX,V=e.screenY-Mn.screenY):V=jn=0,Mn=e),jn)},movementY:function(e){return`movementY`in e?e.movementY:V}}),Pn=En(Nn),Fn=En(N({},Nn,{dataTransfer:0})),In=En(N({},kn,{relatedTarget:0})),Ln=En(N({},Dn,{animationName:0,elapsedTime:0,pseudoElement:0})),Rn=En(N({},Dn,{clipboardData:function(e){return`clipboardData`in e?e.clipboardData:window.clipboardData}})),zn=En(N({},Dn,{data:0})),Bn={Esc:`Escape`,Spacebar:` `,Left:`ArrowLeft`,Up:`ArrowUp`,Right:`ArrowRight`,Down:`ArrowDown`,Del:`Delete`,Win:`OS`,Menu:`ContextMenu`,Apps:`ContextMenu`,Scroll:`ScrollLock`,MozPrintableKey:`Unidentified`},Vn={8:`Backspace`,9:`Tab`,12:`Clear`,13:`Enter`,16:`Shift`,17:`Control`,18:`Alt`,19:`Pause`,20:`CapsLock`,27:`Escape`,32:` `,33:`PageUp`,34:`PageDown`,35:`End`,36:`Home`,37:`ArrowLeft`,38:`ArrowUp`,39:`ArrowRight`,40:`ArrowDown`,45:`Insert`,46:`Delete`,112:`F1`,113:`F2`,114:`F3`,115:`F4`,116:`F5`,117:`F6`,118:`F7`,119:`F8`,120:`F9`,121:`F10`,122:`F11`,123:`F12`,144:`NumLock`,145:`ScrollLock`,224:`Meta`},Hn={Alt:`altKey`,Control:`ctrlKey`,Meta:`metaKey`,Shift:`shiftKey`};function Un(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Hn[e])?!!t[e]:!1}function Wn(){return Un}var Gn=En(N({},kn,{key:function(e){if(e.key){var t=Bn[e.key]||e.key;if(t!==`Unidentified`)return t}return e.type===`keypress`?(e=Cn(e),e===13?`Enter`:String.fromCharCode(e)):e.type===`keydown`||e.type===`keyup`?Vn[e.keyCode]||`Unidentified`:``},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Wn,charCode:function(e){return e.type===`keypress`?Cn(e):0},keyCode:function(e){return e.type===`keydown`||e.type===`keyup`?e.keyCode:0},which:function(e){return e.type===`keypress`?Cn(e):e.type===`keydown`||e.type===`keyup`?e.keyCode:0}})),Kn=En(N({},Nn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0})),qn=En(N({},kn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Wn})),Jn=En(N({},Dn,{propertyName:0,elapsedTime:0,pseudoElement:0})),Yn=En(N({},Nn,{deltaX:function(e){return`deltaX`in e?e.deltaX:`wheelDeltaX`in e?-e.wheelDeltaX:0},deltaY:function(e){return`deltaY`in e?e.deltaY:`wheelDeltaY`in e?-e.wheelDeltaY:`wheelDelta`in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0})),Xn=[9,13,27,32],Zn=c&&`CompositionEvent`in window,Qn=null;c&&`documentMode`in document&&(Qn=document.documentMode);var $n=c&&`TextEvent`in window&&!Qn,er=c&&(!Zn||Qn&&8<Qn&&11>=Qn),tr=` `,nr=!1;function rr(e,t){switch(e){case`keyup`:return Xn.indexOf(t.keyCode)!==-1;case`keydown`:return t.keyCode!==229;case`keypress`:case`mousedown`:case`focusout`:return!0;default:return!1}}function ir(e){return e=e.detail,typeof e==`object`&&`data`in e?e.data:null}var ar=!1;function or(e,t){switch(e){case`compositionend`:return ir(t);case`keypress`:return t.which===32?(nr=!0,tr):null;case`textInput`:return e=t.data,e===tr&&nr?null:e;default:return null}}function sr(e,t){if(ar)return e===`compositionend`||!Zn&&rr(e,t)?(e=Sn(),xn=bn=yn=null,ar=!1,e):null;switch(e){case`paste`:return null;case`keypress`:if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case`compositionend`:return er&&t.locale!==`ko`?null:t.data;default:return null}}var cr={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function lr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t===`input`?!!cr[e.type]:t===`textarea`}function ur(e,t,n,r){Ke(r),t=fi(t,`onChange`),0<t.length&&(n=new On(`onChange`,`change`,null,n,r),e.push({event:n,listeners:t}))}var dr=null,fr=null;function pr(e){ai(e,0)}function mr(e){if(me(Bi(e)))return e}function hr(e,t){if(e===`change`)return t}var gr=!1;if(c){var _r;if(c){var vr=`oninput`in document;if(!vr){var yr=document.createElement(`div`);yr.setAttribute(`oninput`,`return;`),vr=typeof yr.oninput==`function`}_r=vr}else _r=!1;gr=_r&&(!document.documentMode||9<document.documentMode)}function br(){dr&&(dr.detachEvent(`onpropertychange`,xr),fr=dr=null)}function xr(e){if(e.propertyName===`value`&&mr(fr)){var t=[];ur(t,fr,e,Ve(e)),Ze(pr,t)}}function Sr(e,t,n){e===`focusin`?(br(),dr=t,fr=n,dr.attachEvent(`onpropertychange`,xr)):e===`focusout`&&br()}function Cr(e){if(e===`selectionchange`||e===`keyup`||e===`keydown`)return mr(fr)}function wr(e,t){if(e===`click`)return mr(t)}function Tr(e,t){if(e===`input`||e===`change`)return mr(t)}function Er(e,t){return e===t&&(e!==0||1/e==1/t)||e!==e&&t!==t}var Dr=typeof Object.is==`function`?Object.is:Er;function Or(e,t){if(Dr(e,t))return!0;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!l.call(t,i)||!Dr(e[i],t[i]))return!1}return!0}function kr(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Ar(e,t){var n=kr(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}a:{for(;n;){if(n.nextSibling){n=n.nextSibling;break a}n=n.parentNode}n=void 0}n=kr(n)}}function Mr(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Mr(e,t.parentNode):`contains`in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Pr(){for(var e=window,t=he();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href==`string`}catch{n=!1}if(n)e=t.contentWindow;else break;t=he(e.document)}return t}function Fr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t===`input`&&(e.type===`text`||e.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}function Ir(e){var t=Pr(),n=e.focusedElem,r=e.selectionRange;if(t!==n&&n&&n.ownerDocument&&Mr(n.ownerDocument.documentElement,n)){if(r!==null&&Fr(n)){if(t=r.start,e=r.end,e===void 0&&(e=t),`selectionStart`in n)n.selectionStart=t,n.selectionEnd=Math.min(e,n.value.length);else if(e=(t=n.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var i=n.textContent.length,a=Math.min(r.start,i);r=r.end===void 0?a:Math.min(r.end,i),!e.extend&&a>r&&(i=r,r=a,a=i),i=Ar(n,a);var o=Ar(n,r);i&&o&&(e.rangeCount!==1||e.anchorNode!==i.node||e.anchorOffset!==i.offset||e.focusNode!==o.node||e.focusOffset!==o.offset)&&(t=t.createRange(),t.setStart(i.node,i.offset),e.removeAllRanges(),a>r?(e.addRange(t),e.extend(o.node,o.offset)):(t.setEnd(o.node,o.offset),e.addRange(t)))}}for(t=[],e=n;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof n.focus==`function`&&n.focus(),n=0;n<t.length;n++)e=t[n],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var H=c&&`documentMode`in document&&11>=document.documentMode,Lr=null,Rr=null,zr=null,Br=!1;function Vr(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Br||Lr==null||Lr!==he(r)||(r=Lr,`selectionStart`in r&&Fr(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),zr&&Or(zr,r)||(zr=r,r=fi(Rr,`onSelect`),0<r.length&&(t=new On(`onSelect`,`select`,null,t,n),e.push({event:t,listeners:r}),t.target=Lr)))}function Hr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n[`Webkit`+e]=`webkit`+t,n[`Moz`+e]=`moz`+t,n}var Ur={animationend:Hr(`Animation`,`AnimationEnd`),animationiteration:Hr(`Animation`,`AnimationIteration`),animationstart:Hr(`Animation`,`AnimationStart`),transitionend:Hr(`Transition`,`TransitionEnd`)},Wr={},Gr={};c&&(Gr=document.createElement(`div`).style,`AnimationEvent`in window||(delete Ur.animationend.animation,delete Ur.animationiteration.animation,delete Ur.animationstart.animation),`TransitionEvent`in window||delete Ur.transitionend.transition);function Kr(e){if(Wr[e])return Wr[e];if(!Ur[e])return e;var t=Ur[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in Gr)return Wr[e]=t[n];return e}var qr=Kr(`animationend`),Jr=Kr(`animationiteration`),Yr=Kr(`animationstart`),Xr=Kr(`transitionend`),Zr=new Map,Qr=`abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);function $r(e,t){Zr.set(e,t),o(t,[e])}for(var ei=0;ei<Qr.length;ei++){var ti=Qr[ei];$r(ti.toLowerCase(),`on`+(ti[0].toUpperCase()+ti.slice(1)))}$r(qr,`onAnimationEnd`),$r(Jr,`onAnimationIteration`),$r(Yr,`onAnimationStart`),$r(`dblclick`,`onDoubleClick`),$r(`focusin`,`onFocus`),$r(`focusout`,`onBlur`),$r(Xr,`onTransitionEnd`),s(`onMouseEnter`,[`mouseout`,`mouseover`]),s(`onMouseLeave`,[`mouseout`,`mouseover`]),s(`onPointerEnter`,[`pointerout`,`pointerover`]),s(`onPointerLeave`,[`pointerout`,`pointerover`]),o(`onChange`,`change click focusin focusout input keydown keyup selectionchange`.split(` `)),o(`onSelect`,`focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)),o(`onBeforeInput`,[`compositionend`,`keypress`,`textInput`,`paste`]),o(`onCompositionEnd`,`compositionend focusout keydown keypress keyup mousedown`.split(` `)),o(`onCompositionStart`,`compositionstart focusout keydown keypress keyup mousedown`.split(` `)),o(`onCompositionUpdate`,`compositionupdate focusout keydown keypress keyup mousedown`.split(` `));var ni=`abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),ri=new Set(`cancel close invalid load scroll toggle`.split(` `).concat(ni));function ii(e,t,n){var r=e.type||`unknown-event`;e.currentTarget=n,st(r,t,void 0,e),e.currentTarget=null}function ai(e,t){t=(t&4)!=0;for(var n=0;n<e.length;n++){var r=e[n],i=r.event;r=r.listeners;a:{var a=void 0;if(t)for(var o=r.length-1;0<=o;o--){var s=r[o],c=s.instance,l=s.currentTarget;if(s=s.listener,c!==a&&i.isPropagationStopped())break a;ii(i,s,l),a=c}else for(o=0;o<r.length;o++){if(s=r[o],c=s.instance,l=s.currentTarget,s=s.listener,c!==a&&i.isPropagationStopped())break a;ii(i,s,l),a=c}}}if(it)throw e=at,it=!1,at=null,e}function U(e,t){var n=t[Fi];n===void 0&&(n=t[Fi]=new Set);var r=e+`__bubble`;n.has(r)||(li(t,e,2,!1),n.add(r))}function oi(e,t,n){var r=0;t&&(r|=4),li(n,e,r,t)}var si=`_reactListening`+Math.random().toString(36).slice(2);function ci(e){if(!e[si]){e[si]=!0,i.forEach(function(t){t!==`selectionchange`&&(ri.has(t)||oi(t,!1,e),oi(t,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[si]||(t[si]=!0,oi(`selectionchange`,!1,t))}}function li(e,t,n,r){switch(vn(t)){case 1:var i=pn;break;case 4:i=mn;break;default:i=hn}n=i.bind(null,t,n,e),i=void 0,!$e||t!==`touchstart`&&t!==`touchmove`&&t!==`wheel`||(i=!0),r?i===void 0?e.addEventListener(t,n,!0):e.addEventListener(t,n,{capture:!0,passive:i}):i===void 0?e.addEventListener(t,n,!1):e.addEventListener(t,n,{passive:i})}function ui(e,t,n,r,i){var a=r;if(!(t&1)&&!(t&2)&&r!==null)a:for(;;){if(r===null)return;var o=r.tag;if(o===3||o===4){var s=r.stateNode.containerInfo;if(s===i||s.nodeType===8&&s.parentNode===i)break;if(o===4)for(o=r.return;o!==null;){var c=o.tag;if((c===3||c===4)&&(c=o.stateNode.containerInfo,c===i||c.nodeType===8&&c.parentNode===i))return;o=o.return}for(;s!==null;){if(o=Ri(s),o===null)return;if(c=o.tag,c===5||c===6){r=a=o;continue a}s=s.parentNode}}r=r.return}Ze(function(){var r=a,i=Ve(n),o=[];a:{var s=Zr.get(e);if(s!==void 0){var c=On,l=e;switch(e){case`keypress`:if(Cn(n)===0)break a;case`keydown`:case`keyup`:c=Gn;break;case`focusin`:l=`focus`,c=In;break;case`focusout`:l=`blur`,c=In;break;case`beforeblur`:case`afterblur`:c=In;break;case`click`:if(n.button===2)break a;case`auxclick`:case`dblclick`:case`mousedown`:case`mousemove`:case`mouseup`:case`mouseout`:case`mouseover`:case`contextmenu`:c=Pn;break;case`drag`:case`dragend`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`dragstart`:case`drop`:c=Fn;break;case`touchcancel`:case`touchend`:case`touchmove`:case`touchstart`:c=qn;break;case qr:case Jr:case Yr:c=Ln;break;case Xr:c=Jn;break;case`scroll`:c=An;break;case`wheel`:c=Yn;break;case`copy`:case`cut`:case`paste`:c=Rn;break;case`gotpointercapture`:case`lostpointercapture`:case`pointercancel`:case`pointerdown`:case`pointermove`:case`pointerout`:case`pointerover`:case`pointerup`:c=Kn}var u=(t&4)!=0,d=!u&&e===`scroll`,f=u?s===null?null:s+`Capture`:s;u=[];for(var p=r,m;p!==null;){m=p;var h=m.stateNode;if(m.tag===5&&h!==null&&(m=h,f!==null&&(h=Qe(p,f),h!=null&&u.push(di(p,h,m)))),d)break;p=p.return}0<u.length&&(s=new c(s,l,null,n,i),o.push({event:s,listeners:u}))}}if(!(t&7)){a:{if(s=e===`mouseover`||e===`pointerover`,c=e===`mouseout`||e===`pointerout`,s&&n!==Be&&(l=n.relatedTarget||n.fromElement)&&(Ri(l)||l[Pi]))break a;if((c||s)&&(s=i.window===i?i:(s=i.ownerDocument)?s.defaultView||s.parentWindow:window,c?(l=n.relatedTarget||n.toElement,c=r,l=l?Ri(l):null,l!==null&&(d=I(l),l!==d||l.tag!==5&&l.tag!==6)&&(l=null)):(c=null,l=r),c!==l)){if(u=Pn,h=`onMouseLeave`,f=`onMouseEnter`,p=`mouse`,(e===`pointerout`||e===`pointerover`)&&(u=Kn,h=`onPointerLeave`,f=`onPointerEnter`,p=`pointer`),d=c==null?s:Bi(c),m=l==null?s:Bi(l),s=new u(h,p+`leave`,c,n,i),s.target=d,s.relatedTarget=m,h=null,Ri(i)===r&&(u=new u(f,p+`enter`,l,n,i),u.target=m,u.relatedTarget=d,h=u),d=h,c&&l)b:{for(u=c,f=l,p=0,m=u;m;m=pi(m))p++;for(m=0,h=f;h;h=pi(h))m++;for(;0<p-m;)u=pi(u),p--;for(;0<m-p;)f=pi(f),m--;for(;p--;){if(u===f||f!==null&&u===f.alternate)break b;u=pi(u),f=pi(f)}u=null}else u=null;c!==null&&mi(o,s,c,u,!1),l!==null&&d!==null&&mi(o,d,l,u,!0)}}a:{if(s=r?Bi(r):window,c=s.nodeName&&s.nodeName.toLowerCase(),c===`select`||c===`input`&&s.type===`file`)var g=hr;else if(lr(s))if(gr)g=Tr;else{g=Cr;var _=Sr}else (c=s.nodeName)&&c.toLowerCase()===`input`&&(s.type===`checkbox`||s.type===`radio`)&&(g=wr);if(g&&=g(e,r)){ur(o,g,n,i);break a}_&&_(e,s,r),e===`focusout`&&(_=s._wrapperState)&&_.controlled&&s.type===`number`&&xe(s,`number`,s.value)}switch(_=r?Bi(r):window,e){case`focusin`:(lr(_)||_.contentEditable===`true`)&&(Lr=_,Rr=r,zr=null);break;case`focusout`:zr=Rr=Lr=null;break;case`mousedown`:Br=!0;break;case`contextmenu`:case`mouseup`:case`dragend`:Br=!1,Vr(o,n,i);break;case`selectionchange`:if(H)break;case`keydown`:case`keyup`:Vr(o,n,i)}var v;if(Zn)b:{switch(e){case`compositionstart`:var y=`onCompositionStart`;break b;case`compositionend`:y=`onCompositionEnd`;break b;case`compositionupdate`:y=`onCompositionUpdate`;break b}y=void 0}else ar?rr(e,n)&&(y=`onCompositionEnd`):e===`keydown`&&n.keyCode===229&&(y=`onCompositionStart`);y&&(er&&n.locale!==`ko`&&(ar||y!==`onCompositionStart`?y===`onCompositionEnd`&&ar&&(v=Sn()):(yn=i,bn=`value`in yn?yn.value:yn.textContent,ar=!0)),_=fi(r,y),0<_.length&&(y=new zn(y,e,null,n,i),o.push({event:y,listeners:_}),v?y.data=v:(v=ir(n),v!==null&&(y.data=v)))),(v=$n?or(e,n):sr(e,n))&&(r=fi(r,`onBeforeInput`),0<r.length&&(i=new zn(`onBeforeInput`,`beforeinput`,null,n,i),o.push({event:i,listeners:r}),i.data=v))}ai(o,t)})}function di(e,t,n){return{instance:e,listener:t,currentTarget:n}}function fi(e,t){for(var n=t+`Capture`,r=[];e!==null;){var i=e,a=i.stateNode;i.tag===5&&a!==null&&(i=a,a=Qe(e,n),a!=null&&r.unshift(di(e,a,i)),a=Qe(e,t),a!=null&&r.push(di(e,a,i))),e=e.return}return r}function pi(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function mi(e,t,n,r,i){for(var a=t._reactName,o=[];n!==null&&n!==r;){var s=n,c=s.alternate,l=s.stateNode;if(c!==null&&c===r)break;s.tag===5&&l!==null&&(s=l,i?(c=Qe(n,a),c!=null&&o.unshift(di(n,c,s))):i||(c=Qe(n,a),c!=null&&o.push(di(n,c,s)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var hi=/\r\n?/g,gi=/\u0000|\uFFFD/g;function _i(e){return(typeof e==`string`?e:``+e).replace(hi,`
`).replace(gi,``)}function vi(e,t,n){if(t=_i(t),_i(e)!==t&&n)throw Error(r(425))}function yi(){}var bi=null,xi=null;function Si(e,t){return e===`textarea`||e===`noscript`||typeof t.children==`string`||typeof t.children==`number`||typeof t.dangerouslySetInnerHTML==`object`&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Ci=typeof setTimeout==`function`?setTimeout:void 0,wi=typeof clearTimeout==`function`?clearTimeout:void 0,Ti=typeof Promise==`function`?Promise:void 0,Ei=typeof queueMicrotask==`function`?queueMicrotask:Ti===void 0?Ci:function(e){return Ti.resolve(null).then(e).catch(Di)};function Di(e){setTimeout(function(){throw e})}function Oi(e,t){var n=t,r=0;do{var i=n.nextSibling;if(e.removeChild(n),i&&i.nodeType===8)if(n=i.data,n===`/$`){if(r===0){e.removeChild(i),un(t);return}r--}else n!==`$`&&n!==`$?`&&n!==`$!`||r++;n=i}while(n);un(t)}function ki(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t===`$`||t===`$!`||t===`$?`)break;if(t===`/$`)return null}}return e}function Ai(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`$`||n===`$!`||n===`$?`){if(t===0)return e;t--}else n===`/$`&&t++}e=e.previousSibling}return null}var ji=Math.random().toString(36).slice(2),Mi=`__reactFiber$`+ji,Ni=`__reactProps$`+ji,Pi=`__reactContainer$`+ji,Fi=`__reactEvents$`+ji,Ii=`__reactListeners$`+ji,Li=`__reactHandles$`+ji;function Ri(e){var t=e[Mi];if(t)return t;for(var n=e.parentNode;n;){if(t=n[Pi]||n[Mi]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Ai(e);e!==null;){if(n=e[Mi])return n;e=Ai(e)}return t}e=n,n=e.parentNode}return null}function zi(e){return e=e[Mi]||e[Pi],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Bi(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(r(33))}function Vi(e){return e[Ni]||null}var Hi=[],Ui=-1;function Wi(e){return{current:e}}function W(e){0>Ui||(e.current=Hi[Ui],Hi[Ui]=null,Ui--)}function G(e,t){Ui++,Hi[Ui]=e.current,e.current=t}var Gi={},Ki=Wi(Gi),qi=Wi(!1),Ji=Gi;function Yi(e,t){var n=e.type.contextTypes;if(!n)return Gi;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var i={},a;for(a in n)i[a]=t[a];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=i),i}function Xi(e){return e=e.childContextTypes,e!=null}function Zi(){W(qi),W(Ki)}function Qi(e,t,n){if(Ki.current!==Gi)throw Error(r(168));G(Ki,t),G(qi,n)}function $i(e,t,n){var i=e.stateNode;if(t=t.childContextTypes,typeof i.getChildContext!=`function`)return n;for(var a in i=i.getChildContext(),i)if(!(a in t))throw Error(r(108,le(e)||`Unknown`,a));return N({},n,i)}function ea(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Gi,Ji=Ki.current,G(Ki,e),G(qi,qi.current),!0}function ta(e,t,n){var i=e.stateNode;if(!i)throw Error(r(169));n?(e=$i(e,t,Ji),i.__reactInternalMemoizedMergedChildContext=e,W(qi),W(Ki),G(Ki,e)):W(qi),G(qi,n)}var na=null,ra=!1,ia=!1;function aa(e){na===null?na=[e]:na.push(e)}function oa(e){ra=!0,aa(e)}function sa(){if(!ia&&na!==null){ia=!0;var e=0,t=z;try{var n=na;for(z=1;e<n.length;e++){var r=n[e];do r=r(!0);while(r!==null)}na=null,ra=!1}catch(t){throw na!==null&&(na=na.slice(e+1)),ft(_t,sa),t}finally{z=t,ia=!1}}return null}var ca=[],la=0,ua=null,da=0,fa=[],pa=0,ma=null,ha=1,ga=``;function _a(e,t){ca[la++]=da,ca[la++]=ua,ua=e,da=t}function va(e,t,n){fa[pa++]=ha,fa[pa++]=ga,fa[pa++]=ma,ma=e;var r=ha;e=ga;var i=32-Tt(r)-1;r&=~(1<<i),n+=1;var a=32-Tt(t)+i;if(30<a){var o=i-i%5;a=(r&(1<<o)-1).toString(32),r>>=o,i-=o,ha=1<<32-Tt(t)+i|n<<i|r,ga=a+e}else ha=1<<a|n<<i|r,ga=e}function ya(e){e.return!==null&&(_a(e,1),va(e,1,0))}function ba(e){for(;e===ua;)ua=ca[--la],ca[la]=null,da=ca[--la],ca[la]=null;for(;e===ma;)ma=fa[--pa],fa[pa]=null,ga=fa[--pa],fa[pa]=null,ha=fa[--pa],fa[pa]=null}var xa=null,Sa=null,K=!1,Ca=null;function wa(e,t){var n=Kl(5,null,null,0);n.elementType=`DELETED`,n.stateNode=t,n.return=e,t=e.deletions,t===null?(e.deletions=[n],e.flags|=16):t.push(n)}function Ta(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t===null?!1:(e.stateNode=t,xa=e,Sa=ki(t.firstChild),!0);case 6:return t=e.pendingProps===``||t.nodeType!==3?null:t,t===null?!1:(e.stateNode=t,xa=e,Sa=null,!0);case 13:return t=t.nodeType===8?t:null,t===null?!1:(n=ma===null?null:{id:ha,overflow:ga},e.memoizedState={dehydrated:t,treeContext:n,retryLane:1073741824},n=Kl(18,null,null,0),n.stateNode=t,n.return=e,e.child=n,xa=e,Sa=null,!0);default:return!1}}function Ea(e){return(e.mode&1)!=0&&(e.flags&128)==0}function Da(e){if(K){var t=Sa;if(t){var n=t;if(!Ta(e,t)){if(Ea(e))throw Error(r(418));t=ki(n.nextSibling);var i=xa;t&&Ta(e,t)?wa(i,n):(e.flags=e.flags&-4097|2,K=!1,xa=e)}}else{if(Ea(e))throw Error(r(418));e.flags=e.flags&-4097|2,K=!1,xa=e}}}function Oa(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;xa=e}function ka(e){if(e!==xa)return!1;if(!K)return Oa(e),K=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!==`head`&&t!==`body`&&!Si(e.type,e.memoizedProps)),t&&=Sa){if(Ea(e))throw Aa(),Error(r(418));for(;t;)wa(e,t),t=ki(t.nextSibling)}if(Oa(e),e.tag===13){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(r(317));a:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`/$`){if(t===0){Sa=ki(e.nextSibling);break a}t--}else n!==`$`&&n!==`$!`&&n!==`$?`||t++}e=e.nextSibling}Sa=null}}else Sa=xa?ki(e.stateNode.nextSibling):null;return!0}function Aa(){for(var e=Sa;e;)e=ki(e.nextSibling)}function ja(){Sa=xa=null,K=!1}function Ma(e){Ca===null?Ca=[e]:Ca.push(e)}var Na=x.ReactCurrentBatchConfig;function Pa(e,t,n){if(e=n.ref,e!==null&&typeof e!=`function`&&typeof e!=`object`){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(r(309));var i=n.stateNode}if(!i)throw Error(r(147,e));var a=i,o=``+e;return t!==null&&t.ref!==null&&typeof t.ref==`function`&&t.ref._stringRef===o?t.ref:(t=function(e){var t=a.refs;e===null?delete t[o]:t[o]=e},t._stringRef=o,t)}if(typeof e!=`string`)throw Error(r(284));if(!n._owner)throw Error(r(290,e))}return e}function Fa(e,t){throw e=Object.prototype.toString.call(t),Error(r(31,e===`[object Object]`?`object with keys {`+Object.keys(t).join(`, `)+`}`:e))}function Ia(e){var t=e._init;return t(e._payload)}function La(e){function t(t,n){if(e){var r=t.deletions;r===null?(t.deletions=[n],t.flags|=16):r.push(n)}}function n(n,r){if(!e)return null;for(;r!==null;)t(n,r),r=r.sibling;return null}function i(e,t){for(e=new Map;t!==null;)t.key===null?e.set(t.index,t):e.set(t.key,t),t=t.sibling;return e}function a(e,t){return e=Yl(e,t),e.index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?(r=t.alternate,r===null?(t.flags|=2,n):(r=r.index,r<n?(t.flags|=2,n):r)):(t.flags|=1048576,n)}function s(t){return e&&t.alternate===null&&(t.flags|=2),t}function c(e,t,n,r){return t===null||t.tag!==6?(t=$l(n,e.mode,r),t.return=e,t):(t=a(t,n),t.return=e,t)}function l(e,t,n,r){var i=n.type;return i===w?d(e,t,n.props.children,r,n.key):t!==null&&(t.elementType===i||typeof i==`object`&&i&&i.$$typeof===j&&Ia(i)===t.type)?(r=a(t,n.props),r.ref=Pa(e,t,n),r.return=e,r):(r=Xl(n.type,n.key,n.props,null,e.mode,r),r.ref=Pa(e,t,n),r.return=e,r)}function u(e,t,n,r){return t===null||t.tag!==4||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?(t=eu(n,e.mode,r),t.return=e,t):(t=a(t,n.children||[]),t.return=e,t)}function d(e,t,n,r,i){return t===null||t.tag!==7?(t=Zl(n,e.mode,r,i),t.return=e,t):(t=a(t,n),t.return=e,t)}function f(e,t,n){if(typeof t==`string`&&t!==``||typeof t==`number`)return t=$l(``+t,e.mode,n),t.return=e,t;if(typeof t==`object`&&t){switch(t.$$typeof){case S:return n=Xl(t.type,t.key,t.props,null,e.mode,n),n.ref=Pa(e,null,t),n.return=e,n;case C:return t=eu(t,e.mode,n),t.return=e,t;case j:var r=t._init;return f(e,r(t._payload),n)}if(Se(t)||re(t))return t=Zl(t,e.mode,n,null),t.return=e,t;Fa(e,t)}return null}function p(e,t,n,r){var i=t===null?null:t.key;if(typeof n==`string`&&n!==``||typeof n==`number`)return i===null?c(e,t,``+n,r):null;if(typeof n==`object`&&n){switch(n.$$typeof){case S:return n.key===i?l(e,t,n,r):null;case C:return n.key===i?u(e,t,n,r):null;case j:return i=n._init,p(e,t,i(n._payload),r)}if(Se(n)||re(n))return i===null?d(e,t,n,r,null):null;Fa(e,n)}return null}function m(e,t,n,r,i){if(typeof r==`string`&&r!==``||typeof r==`number`)return e=e.get(n)||null,c(t,e,``+r,i);if(typeof r==`object`&&r){switch(r.$$typeof){case S:return e=e.get(r.key===null?n:r.key)||null,l(t,e,r,i);case C:return e=e.get(r.key===null?n:r.key)||null,u(t,e,r,i);case j:var a=r._init;return m(e,t,n,a(r._payload),i)}if(Se(r)||re(r))return e=e.get(n)||null,d(t,e,r,i,null);Fa(t,r)}return null}function h(r,a,s,c){for(var l=null,u=null,d=a,h=a=0,g=null;d!==null&&h<s.length;h++){d.index>h?(g=d,d=null):g=d.sibling;var _=p(r,d,s[h],c);if(_===null){d===null&&(d=g);break}e&&d&&_.alternate===null&&t(r,d),a=o(_,a,h),u===null?l=_:u.sibling=_,u=_,d=g}if(h===s.length)return n(r,d),K&&_a(r,h),l;if(d===null){for(;h<s.length;h++)d=f(r,s[h],c),d!==null&&(a=o(d,a,h),u===null?l=d:u.sibling=d,u=d);return K&&_a(r,h),l}for(d=i(r,d);h<s.length;h++)g=m(d,r,h,s[h],c),g!==null&&(e&&g.alternate!==null&&d.delete(g.key===null?h:g.key),a=o(g,a,h),u===null?l=g:u.sibling=g,u=g);return e&&d.forEach(function(e){return t(r,e)}),K&&_a(r,h),l}function g(a,s,c,l){var u=re(c);if(typeof u!=`function`)throw Error(r(150));if(c=u.call(c),c==null)throw Error(r(151));for(var d=u=null,h=s,g=s=0,_=null,v=c.next();h!==null&&!v.done;g++,v=c.next()){h.index>g?(_=h,h=null):_=h.sibling;var y=p(a,h,v.value,l);if(y===null){h===null&&(h=_);break}e&&h&&y.alternate===null&&t(a,h),s=o(y,s,g),d===null?u=y:d.sibling=y,d=y,h=_}if(v.done)return n(a,h),K&&_a(a,g),u;if(h===null){for(;!v.done;g++,v=c.next())v=f(a,v.value,l),v!==null&&(s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return K&&_a(a,g),u}for(h=i(a,h);!v.done;g++,v=c.next())v=m(h,a,g,v.value,l),v!==null&&(e&&v.alternate!==null&&h.delete(v.key===null?g:v.key),s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return e&&h.forEach(function(e){return t(a,e)}),K&&_a(a,g),u}function _(e,r,i,o){if(typeof i==`object`&&i&&i.type===w&&i.key===null&&(i=i.props.children),typeof i==`object`&&i){switch(i.$$typeof){case S:a:{for(var c=i.key,l=r;l!==null;){if(l.key===c){if(c=i.type,c===w){if(l.tag===7){n(e,l.sibling),r=a(l,i.props.children),r.return=e,e=r;break a}}else if(l.elementType===c||typeof c==`object`&&c&&c.$$typeof===j&&Ia(c)===l.type){n(e,l.sibling),r=a(l,i.props),r.ref=Pa(e,l,i),r.return=e,e=r;break a}n(e,l);break}else t(e,l);l=l.sibling}i.type===w?(r=Zl(i.props.children,e.mode,o,i.key),r.return=e,e=r):(o=Xl(i.type,i.key,i.props,null,e.mode,o),o.ref=Pa(e,r,i),o.return=e,e=o)}return s(e);case C:a:{for(l=i.key;r!==null;){if(r.key===l)if(r.tag===4&&r.stateNode.containerInfo===i.containerInfo&&r.stateNode.implementation===i.implementation){n(e,r.sibling),r=a(r,i.children||[]),r.return=e,e=r;break a}else{n(e,r);break}else t(e,r);r=r.sibling}r=eu(i,e.mode,o),r.return=e,e=r}return s(e);case j:return l=i._init,_(e,r,l(i._payload),o)}if(Se(i))return h(e,r,i,o);if(re(i))return g(e,r,i,o);Fa(e,i)}return typeof i==`string`&&i!==``||typeof i==`number`?(i=``+i,r!==null&&r.tag===6?(n(e,r.sibling),r=a(r,i),r.return=e,e=r):(n(e,r),r=$l(i,e.mode,o),r.return=e,e=r),s(e)):n(e,r)}return _}var Ra=La(!0),za=La(!1),Ba=Wi(null),Va=null,Ha=null,Ua=null;function Wa(){Ua=Ha=Va=null}function Ga(e){var t=Ba.current;W(Ba),e._currentValue=t}function Ka(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)===t?r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t):(e.childLanes|=t,r!==null&&(r.childLanes|=t)),e===n)break;e=e.return}}function qa(e,t){Va=e,Ua=Ha=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&t)!==0&&(Ps=!0),e.firstContext=null)}function Ja(e){var t=e._currentValue;if(Ua!==e)if(e={context:e,memoizedValue:t,next:null},Ha===null){if(Va===null)throw Error(r(308));Ha=e,Va.dependencies={lanes:0,firstContext:e}}else Ha=Ha.next=e;return t}var Ya=null;function Xa(e){Ya===null?Ya=[e]:Ya.push(e)}function Za(e,t,n,r){var i=t.interleaved;return i===null?(n.next=n,Xa(t)):(n.next=i.next,i.next=n),t.interleaved=n,Qa(e,r)}function Qa(e,t){e.lanes|=t;var n=e.alternate;for(n!==null&&(n.lanes|=t),n=e,e=e.return;e!==null;)e.childLanes|=t,n=e.alternate,n!==null&&(n.childLanes|=t),n=e,e=e.return;return n.tag===3?n.stateNode:null}var $a=!1;function eo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function to(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function no(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function ro(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,Z&2){var i=r.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),r.pending=t,Qa(e,n)}return i=r.interleaved,i===null?(t.next=t,Xa(r)):(t.next=i.next,i.next=t),r.interleaved=t,Qa(e,n)}function io(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,n&4194240)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Bt(e,n)}}function ao(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var o={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};a===null?i=a=o:a=a.next=o,n=n.next}while(n!==null);a===null?i=a=t:a=a.next=t}else i=a=t;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:r.shared,effects:r.effects},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}function oo(e,t,n,r){var i=e.updateQueue;$a=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var c=s,l=c.next;c.next=null,o===null?a=l:o.next=l,o=c;var u=e.alternate;u!==null&&(u=u.updateQueue,s=u.lastBaseUpdate,s!==o&&(s===null?u.firstBaseUpdate=l:s.next=l,u.lastBaseUpdate=c))}if(a!==null){var d=i.baseState;o=0,u=l=c=null,s=a;do{var f=s.lane,p=s.eventTime;if((r&f)===f){u!==null&&(u=u.next={eventTime:p,lane:0,tag:s.tag,payload:s.payload,callback:s.callback,next:null});a:{var m=e,h=s;switch(f=t,p=n,h.tag){case 1:if(m=h.payload,typeof m==`function`){d=m.call(p,d,f);break a}d=m;break a;case 3:m.flags=m.flags&-65537|128;case 0:if(m=h.payload,f=typeof m==`function`?m.call(p,d,f):m,f==null)break a;d=N({},d,f);break a;case 2:$a=!0}}s.callback!==null&&s.lane!==0&&(e.flags|=64,f=i.effects,f===null?i.effects=[s]:f.push(s))}else p={eventTime:p,lane:f,tag:s.tag,payload:s.payload,callback:s.callback,next:null},u===null?(l=u=p,c=d):u=u.next=p,o|=f;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;f=s,s=f.next,f.next=null,i.lastBaseUpdate=f,i.shared.pending=null}}while(1);if(u===null&&(c=d),i.baseState=c,i.firstBaseUpdate=l,i.lastBaseUpdate=u,t=i.shared.interleaved,t!==null){i=t;do o|=i.lane,i=i.next;while(i!==t)}else a===null&&(i.shared.lanes=0);Yc|=o,e.lanes=o,e.memoizedState=d}}function so(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var i=e[t],a=i.callback;if(a!==null){if(i.callback=null,i=n,typeof a!=`function`)throw Error(r(191,a));a.call(i)}}}var co={},lo=Wi(co),uo=Wi(co),fo=Wi(co);function po(e){if(e===co)throw Error(r(174));return e}function mo(e,t){switch(G(fo,t),G(uo,e),G(lo,co),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:ke(null,``);break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=ke(t,e)}W(lo),G(lo,t)}function ho(){W(lo),W(uo),W(fo)}function go(e){po(fo.current);var t=po(lo.current),n=ke(t,e.type);t!==n&&(G(uo,e),G(lo,n))}function _o(e){uo.current===e&&(W(lo),W(uo))}var q=Wi(0);function vo(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data===`$?`||n.data===`$!`))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var yo=[];function bo(){for(var e=0;e<yo.length;e++)yo[e]._workInProgressVersionPrimary=null;yo.length=0}var xo=x.ReactCurrentDispatcher,So=x.ReactCurrentBatchConfig,Co=0,J=null,Y=null,wo=null,To=!1,Eo=!1,Do=0,Oo=0;function ko(){throw Error(r(321))}function Ao(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Dr(e[n],t[n]))return!1;return!0}function jo(e,t,n,i,a,o){if(Co=o,J=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,xo.current=e===null||e.memoizedState===null?ms:hs,e=n(i,a),Eo){o=0;do{if(Eo=!1,Do=0,25<=o)throw Error(r(301));o+=1,wo=Y=null,t.updateQueue=null,xo.current=gs,e=n(i,a)}while(Eo)}if(xo.current=ps,t=Y!==null&&Y.next!==null,Co=0,wo=Y=J=null,To=!1,t)throw Error(r(300));return e}function Mo(){var e=Do!==0;return Do=0,e}function No(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return wo===null?J.memoizedState=wo=e:wo=wo.next=e,wo}function Po(){if(Y===null){var e=J.alternate;e=e===null?null:e.memoizedState}else e=Y.next;var t=wo===null?J.memoizedState:wo.next;if(t!==null)wo=t,Y=e;else{if(e===null)throw Error(r(310));Y=e,e={memoizedState:Y.memoizedState,baseState:Y.baseState,baseQueue:Y.baseQueue,queue:Y.queue,next:null},wo===null?J.memoizedState=wo=e:wo=wo.next=e}return wo}function Fo(e,t){return typeof t==`function`?t(e):t}function Io(e){var t=Po(),n=t.queue;if(n===null)throw Error(r(311));n.lastRenderedReducer=e;var i=Y,a=i.baseQueue,o=n.pending;if(o!==null){if(a!==null){var s=a.next;a.next=o.next,o.next=s}i.baseQueue=a=o,n.pending=null}if(a!==null){o=a.next,i=i.baseState;var c=s=null,l=null,u=o;do{var d=u.lane;if((Co&d)===d)l!==null&&(l=l.next={lane:0,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),i=u.hasEagerState?u.eagerState:e(i,u.action);else{var f={lane:d,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null};l===null?(c=l=f,s=i):l=l.next=f,J.lanes|=d,Yc|=d}u=u.next}while(u!==null&&u!==o);l===null?s=i:l.next=c,Dr(i,t.memoizedState)||(Ps=!0),t.memoizedState=i,t.baseState=s,t.baseQueue=l,n.lastRenderedState=i}if(e=n.interleaved,e!==null){a=e;do o=a.lane,J.lanes|=o,Yc|=o,a=a.next;while(a!==e)}else a===null&&(n.lanes=0);return[t.memoizedState,n.dispatch]}function Lo(e){var t=Po(),n=t.queue;if(n===null)throw Error(r(311));n.lastRenderedReducer=e;var i=n.dispatch,a=n.pending,o=t.memoizedState;if(a!==null){n.pending=null;var s=a=a.next;do o=e(o,s.action),s=s.next;while(s!==a);Dr(o,t.memoizedState)||(Ps=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,i]}function Ro(){}function zo(e,t){var n=J,i=Po(),a=t(),o=!Dr(i.memoizedState,a);if(o&&(i.memoizedState=a,Ps=!0),i=i.queue,Zo(Ho.bind(null,n,i,e),[e]),i.getSnapshot!==t||o||wo!==null&&wo.memoizedState.tag&1){if(n.flags|=2048,Ko(9,Vo.bind(null,n,i,a,t),void 0,null),Uc===null)throw Error(r(349));Co&30||Bo(n,t,a)}return a}function Bo(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=J.updateQueue,t===null?(t={lastEffect:null,stores:null},J.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Vo(e,t,n,r){t.value=n,t.getSnapshot=r,Uo(t)&&Wo(e)}function Ho(e,t,n){return n(function(){Uo(t)&&Wo(e)})}function Uo(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Dr(e,n)}catch{return!0}}function Wo(e){var t=Qa(e,1);t!==null&&hl(t,e,1,-1)}function Go(e){var t=No();return typeof e==`function`&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Fo,lastRenderedState:e},t.queue=e,e=e.dispatch=ls.bind(null,J,e),[t.memoizedState,e]}function Ko(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},t=J.updateQueue,t===null?(t={lastEffect:null,stores:null},J.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e)),e}function qo(){return Po().memoizedState}function Jo(e,t,n,r){var i=No();J.flags|=e,i.memoizedState=Ko(1|t,n,void 0,r===void 0?null:r)}function Yo(e,t,n,r){var i=Po();r=r===void 0?null:r;var a=void 0;if(Y!==null){var o=Y.memoizedState;if(a=o.destroy,r!==null&&Ao(r,o.deps)){i.memoizedState=Ko(t,n,a,r);return}}J.flags|=e,i.memoizedState=Ko(1|t,n,a,r)}function Xo(e,t){return Jo(8390656,8,e,t)}function Zo(e,t){return Yo(2048,8,e,t)}function Qo(e,t){return Yo(4,2,e,t)}function $o(e,t){return Yo(4,4,e,t)}function es(e,t){if(typeof t==`function`)return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function ts(e,t,n){return n=n==null?null:n.concat([e]),Yo(4,4,es.bind(null,t,e),n)}function ns(){}function rs(e,t){var n=Po();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&Ao(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function is(e,t){var n=Po();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&Ao(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}function as(e,t,n){return Co&21?(Dr(n,t)||(n=It(),J.lanes|=n,Yc|=n,e.baseState=!0),t):(e.baseState&&(e.baseState=!1,Ps=!0),e.memoizedState=n)}function os(e,t){var n=z;z=n!==0&&4>n?n:4,e(!0);var r=So.transition;So.transition={};try{e(!1),t()}finally{z=n,So.transition=r}}function ss(){return Po().memoizedState}function cs(e,t,n){var r=ml(e);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},us(e))ds(t,n);else if(n=Za(e,t,n,r),n!==null){var i=pl();hl(n,e,r,i),fs(n,t,r)}}function ls(e,t,n){var r=ml(e),i={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(us(e))ds(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,n);if(i.hasEagerState=!0,i.eagerState=s,Dr(s,o)){var c=t.interleaved;c===null?(i.next=i,Xa(t)):(i.next=c.next,c.next=i),t.interleaved=i;return}}catch{}n=Za(e,t,i,r),n!==null&&(i=pl(),hl(n,e,r,i),fs(n,t,r))}}function us(e){var t=e.alternate;return e===J||t!==null&&t===J}function ds(e,t){Eo=To=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function fs(e,t,n){if(n&4194240){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Bt(e,n)}}var ps={readContext:Ja,useCallback:ko,useContext:ko,useEffect:ko,useImperativeHandle:ko,useInsertionEffect:ko,useLayoutEffect:ko,useMemo:ko,useReducer:ko,useRef:ko,useState:ko,useDebugValue:ko,useDeferredValue:ko,useTransition:ko,useMutableSource:ko,useSyncExternalStore:ko,useId:ko,unstable_isNewReconciler:!1},ms={readContext:Ja,useCallback:function(e,t){return No().memoizedState=[e,t===void 0?null:t],e},useContext:Ja,useEffect:Xo,useImperativeHandle:function(e,t,n){return n=n==null?null:n.concat([e]),Jo(4194308,4,es.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Jo(4194308,4,e,t)},useInsertionEffect:function(e,t){return Jo(4,2,e,t)},useMemo:function(e,t){var n=No();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var r=No();return t=n===void 0?t:n(t),r.memoizedState=r.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},r.queue=e,e=e.dispatch=cs.bind(null,J,e),[r.memoizedState,e]},useRef:function(e){var t=No();return e={current:e},t.memoizedState=e},useState:Go,useDebugValue:ns,useDeferredValue:function(e){return No().memoizedState=e},useTransition:function(){var e=Go(!1),t=e[0];return e=os.bind(null,e[1]),No().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,n){var i=J,a=No();if(K){if(n===void 0)throw Error(r(407));n=n()}else{if(n=t(),Uc===null)throw Error(r(349));Co&30||Bo(i,t,n)}a.memoizedState=n;var o={value:n,getSnapshot:t};return a.queue=o,Xo(Ho.bind(null,i,o,e),[e]),i.flags|=2048,Ko(9,Vo.bind(null,i,o,n,t),void 0,null),n},useId:function(){var e=No(),t=Uc.identifierPrefix;if(K){var n=ga,r=ha;n=(r&~(1<<32-Tt(r)-1)).toString(32)+n,t=`:`+t+`R`+n,n=Do++,0<n&&(t+=`H`+n.toString(32)),t+=`:`}else n=Oo++,t=`:`+t+`r`+n.toString(32)+`:`;return e.memoizedState=t},unstable_isNewReconciler:!1},hs={readContext:Ja,useCallback:rs,useContext:Ja,useEffect:Zo,useImperativeHandle:ts,useInsertionEffect:Qo,useLayoutEffect:$o,useMemo:is,useReducer:Io,useRef:qo,useState:function(){return Io(Fo)},useDebugValue:ns,useDeferredValue:function(e){return as(Po(),Y.memoizedState,e)},useTransition:function(){return[Io(Fo)[0],Po().memoizedState]},useMutableSource:Ro,useSyncExternalStore:zo,useId:ss,unstable_isNewReconciler:!1},gs={readContext:Ja,useCallback:rs,useContext:Ja,useEffect:Zo,useImperativeHandle:ts,useInsertionEffect:Qo,useLayoutEffect:$o,useMemo:is,useReducer:Lo,useRef:qo,useState:function(){return Lo(Fo)},useDebugValue:ns,useDeferredValue:function(e){var t=Po();return Y===null?t.memoizedState=e:as(t,Y.memoizedState,e)},useTransition:function(){return[Lo(Fo)[0],Po().memoizedState]},useMutableSource:Ro,useSyncExternalStore:zo,useId:ss,unstable_isNewReconciler:!1};function _s(e,t){if(e&&e.defaultProps){for(var n in t=N({},t),e=e.defaultProps,e)t[n]===void 0&&(t[n]=e[n]);return t}return t}function vs(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:N({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var ys={isMounted:function(e){return(e=e._reactInternals)?I(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var r=pl(),i=ml(e),a=no(r,i);a.payload=t,n!=null&&(a.callback=n),t=ro(e,a,i),t!==null&&(hl(t,e,i,r),io(t,e,i))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=pl(),i=ml(e),a=no(r,i);a.tag=1,a.payload=t,n!=null&&(a.callback=n),t=ro(e,a,i),t!==null&&(hl(t,e,i,r),io(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=pl(),r=ml(e),i=no(n,r);i.tag=2,t!=null&&(i.callback=t),t=ro(e,i,r),t!==null&&(hl(t,e,r,n),io(t,e,r))}};function bs(e,t,n,r,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate==`function`?e.shouldComponentUpdate(r,a,o):t.prototype&&t.prototype.isPureReactComponent?!Or(n,r)||!Or(i,a):!0}function xs(e,t,n){var r=!1,i=Gi,a=t.contextType;return typeof a==`object`&&a?a=Ja(a):(i=Xi(t)?Ji:Ki.current,r=t.contextTypes,a=(r=r!=null)?Yi(e,i):Gi),t=new t(n,a),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=ys,e.stateNode=t,t._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=i,e.__reactInternalMemoizedMaskedChildContext=a),t}function Ss(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps==`function`&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps==`function`&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&ys.enqueueReplaceState(t,t.state,null)}function Cs(e,t,n,r){var i=e.stateNode;i.props=n,i.state=e.memoizedState,i.refs={},eo(e);var a=t.contextType;typeof a==`object`&&a?i.context=Ja(a):(a=Xi(t)?Ji:Ki.current,i.context=Yi(e,a)),i.state=e.memoizedState,a=t.getDerivedStateFromProps,typeof a==`function`&&(vs(e,t,a,n),i.state=e.memoizedState),typeof t.getDerivedStateFromProps==`function`||typeof i.getSnapshotBeforeUpdate==`function`||typeof i.UNSAFE_componentWillMount!=`function`&&typeof i.componentWillMount!=`function`||(t=i.state,typeof i.componentWillMount==`function`&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount==`function`&&i.UNSAFE_componentWillMount(),t!==i.state&&ys.enqueueReplaceState(i,i.state,null),oo(e,n,i,r),i.state=e.memoizedState),typeof i.componentDidMount==`function`&&(e.flags|=4194308)}function ws(e,t){try{var n=``,r=t;do n+=se(r),r=r.return;while(r);var i=n}catch(e){i=`
Error generating stack: `+e.message+`
`+e.stack}return{value:e,source:t,stack:i,digest:null}}function Ts(e,t,n){return{value:e,source:null,stack:n??null,digest:t??null}}function Es(e,t){try{console.error(t.value)}catch(e){setTimeout(function(){throw e})}}var Ds=typeof WeakMap==`function`?WeakMap:Map;function Os(e,t,n){n=no(-1,n),n.tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){rl||(rl=!0,il=r),Es(e,t)},n}function ks(e,t,n){n=no(-1,n),n.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r==`function`){var i=t.value;n.payload=function(){return r(i)},n.callback=function(){Es(e,t)}}var a=e.stateNode;return a!==null&&typeof a.componentDidCatch==`function`&&(n.callback=function(){Es(e,t),typeof r!=`function`&&(al===null?al=new Set([this]):al.add(this));var n=t.stack;this.componentDidCatch(t.value,{componentStack:n===null?``:n})}),n}function As(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new Ds;var i=new Set;r.set(t,i)}else i=r.get(t),i===void 0&&(i=new Set,r.set(t,i));i.has(n)||(i.add(n),e=zl.bind(null,e,t,n),t.then(e,e))}function js(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t===null?!0:t.dehydrated!==null),t)return e;e=e.return}while(e!==null);return null}function Ms(e,t,n,r,i){return e.mode&1?(e.flags|=65536,e.lanes=i,e):(e===t?e.flags|=65536:(e.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(t=no(-1,1),t.tag=2,ro(n,t,1))),n.lanes|=1),e)}var Ns=x.ReactCurrentOwner,Ps=!1;function Fs(e,t,n,r){t.child=e===null?za(t,null,n,r):Ra(t,e.child,n,r)}function Is(e,t,n,r,i){n=n.render;var a=t.ref;return qa(t,i),r=jo(e,t,n,r,a,i),n=Mo(),e!==null&&!Ps?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~i,nc(e,t,i)):(K&&n&&ya(t),t.flags|=1,Fs(e,t,r,i),t.child)}function Ls(e,t,n,r,i){if(e===null){var a=n.type;return typeof a==`function`&&!ql(a)&&a.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=a,Rs(e,t,a,r,i)):(e=Xl(n.type,null,r,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,(e.lanes&i)===0){var o=a.memoizedProps;if(n=n.compare,n=n===null?Or:n,n(o,r)&&e.ref===t.ref)return nc(e,t,i)}return t.flags|=1,e=Yl(a,r),e.ref=t.ref,e.return=t,t.child=e}function Rs(e,t,n,r,i){if(e!==null){var a=e.memoizedProps;if(Or(a,r)&&e.ref===t.ref)if(Ps=!1,t.pendingProps=r=a,(e.lanes&i)!==0)e.flags&131072&&(Ps=!0);else return t.lanes=e.lanes,nc(e,t,i)}return Vs(e,t,n,r,i)}function zs(e,t,n){var r=t.pendingProps,i=r.children,a=e===null?null:e.memoizedState;if(r.mode===`hidden`)if(!(t.mode&1))t.memoizedState={baseLanes:0,cachePool:null,transitions:null},G(Kc,Gc),Gc|=n;else{if(!(n&1073741824))return e=a===null?n:a.baseLanes|n,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,G(Kc,Gc),Gc|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=a===null?n:a.baseLanes,G(Kc,Gc),Gc|=r}else a===null?r=n:(r=a.baseLanes|n,t.memoizedState=null),G(Kc,Gc),Gc|=r;return Fs(e,t,i,n),t.child}function Bs(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.flags|=512,t.flags|=2097152)}function Vs(e,t,n,r,i){var a=Xi(n)?Ji:Ki.current;return a=Yi(t,a),qa(t,i),n=jo(e,t,n,r,a,i),r=Mo(),e!==null&&!Ps?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~i,nc(e,t,i)):(K&&r&&ya(t),t.flags|=1,Fs(e,t,n,i),t.child)}function Hs(e,t,n,r,i){if(Xi(n)){var a=!0;ea(t)}else a=!1;if(qa(t,i),t.stateNode===null)tc(e,t),xs(t,n,r),Cs(t,n,r,i),r=!0;else if(e===null){var o=t.stateNode,s=t.memoizedProps;o.props=s;var c=o.context,l=n.contextType;typeof l==`object`&&l?l=Ja(l):(l=Xi(n)?Ji:Ki.current,l=Yi(t,l));var u=n.getDerivedStateFromProps,d=typeof u==`function`||typeof o.getSnapshotBeforeUpdate==`function`;d||typeof o.UNSAFE_componentWillReceiveProps!=`function`&&typeof o.componentWillReceiveProps!=`function`||(s!==r||c!==l)&&Ss(t,o,r,l),$a=!1;var f=t.memoizedState;o.state=f,oo(t,r,o,i),c=t.memoizedState,s!==r||f!==c||qi.current||$a?(typeof u==`function`&&(vs(t,n,u,r),c=t.memoizedState),(s=$a||bs(t,n,s,r,f,c,l))?(d||typeof o.UNSAFE_componentWillMount!=`function`&&typeof o.componentWillMount!=`function`||(typeof o.componentWillMount==`function`&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount==`function`&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount==`function`&&(t.flags|=4194308)):(typeof o.componentDidMount==`function`&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=c),o.props=r,o.state=c,o.context=l,r=s):(typeof o.componentDidMount==`function`&&(t.flags|=4194308),r=!1)}else{o=t.stateNode,to(e,t),s=t.memoizedProps,l=t.type===t.elementType?s:_s(t.type,s),o.props=l,d=t.pendingProps,f=o.context,c=n.contextType,typeof c==`object`&&c?c=Ja(c):(c=Xi(n)?Ji:Ki.current,c=Yi(t,c));var p=n.getDerivedStateFromProps;(u=typeof p==`function`||typeof o.getSnapshotBeforeUpdate==`function`)||typeof o.UNSAFE_componentWillReceiveProps!=`function`&&typeof o.componentWillReceiveProps!=`function`||(s!==d||f!==c)&&Ss(t,o,r,c),$a=!1,f=t.memoizedState,o.state=f,oo(t,r,o,i);var m=t.memoizedState;s!==d||f!==m||qi.current||$a?(typeof p==`function`&&(vs(t,n,p,r),m=t.memoizedState),(l=$a||bs(t,n,l,r,f,m,c)||!1)?(u||typeof o.UNSAFE_componentWillUpdate!=`function`&&typeof o.componentWillUpdate!=`function`||(typeof o.componentWillUpdate==`function`&&o.componentWillUpdate(r,m,c),typeof o.UNSAFE_componentWillUpdate==`function`&&o.UNSAFE_componentWillUpdate(r,m,c)),typeof o.componentDidUpdate==`function`&&(t.flags|=4),typeof o.getSnapshotBeforeUpdate==`function`&&(t.flags|=1024)):(typeof o.componentDidUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=m),o.props=r,o.state=m,o.context=c,r=l):(typeof o.componentDidUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!=`function`||s===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return Us(e,t,n,r,a,i)}function Us(e,t,n,r,i,a){Bs(e,t);var o=(t.flags&128)!=0;if(!r&&!o)return i&&ta(t,n,!1),nc(e,t,a);r=t.stateNode,Ns.current=t;var s=o&&typeof n.getDerivedStateFromError!=`function`?null:r.render();return t.flags|=1,e!==null&&o?(t.child=Ra(t,e.child,null,a),t.child=Ra(t,null,s,a)):Fs(e,t,s,a),t.memoizedState=r.state,i&&ta(t,n,!0),t.child}function Ws(e){var t=e.stateNode;t.pendingContext?Qi(e,t.pendingContext,t.pendingContext!==t.context):t.context&&Qi(e,t.context,!1),mo(e,t.containerInfo)}function Gs(e,t,n,r,i){return ja(),Ma(i),t.flags|=256,Fs(e,t,n,r),t.child}var Ks={dehydrated:null,treeContext:null,retryLane:0};function qs(e){return{baseLanes:e,cachePool:null,transitions:null}}function Js(e,t,n){var r=t.pendingProps,i=q.current,a=!1,o=(t.flags&128)!=0,s;if((s=o)||(s=e!==null&&e.memoizedState===null?!1:(i&2)!=0),s?(a=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(i|=1),G(q,i&1),e===null)return Da(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?(t.mode&1?e.data===`$!`?t.lanes=8:t.lanes=1073741824:t.lanes=1,null):(o=r.children,e=r.fallback,a?(r=t.mode,a=t.child,o={mode:`hidden`,children:o},!(r&1)&&a!==null?(a.childLanes=0,a.pendingProps=o):a=Ql(o,r,0,null),e=Zl(e,r,n,null),a.return=t,e.return=t,a.sibling=e,t.child=a,t.child.memoizedState=qs(n),t.memoizedState=Ks,e):Ys(t,o));if(i=e.memoizedState,i!==null&&(s=i.dehydrated,s!==null))return Zs(e,t,o,r,s,i,n);if(a){a=r.fallback,o=t.mode,i=e.child,s=i.sibling;var c={mode:`hidden`,children:r.children};return!(o&1)&&t.child!==i?(r=t.child,r.childLanes=0,r.pendingProps=c,t.deletions=null):(r=Yl(i,c),r.subtreeFlags=i.subtreeFlags&14680064),s===null?(a=Zl(a,o,n,null),a.flags|=2):a=Yl(s,a),a.return=t,r.return=t,r.sibling=a,t.child=r,r=a,a=t.child,o=e.child.memoizedState,o=o===null?qs(n):{baseLanes:o.baseLanes|n,cachePool:null,transitions:o.transitions},a.memoizedState=o,a.childLanes=e.childLanes&~n,t.memoizedState=Ks,r}return a=e.child,e=a.sibling,r=Yl(a,{mode:`visible`,children:r.children}),!(t.mode&1)&&(r.lanes=n),r.return=t,r.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=r,t.memoizedState=null,r}function Ys(e,t){return t=Ql({mode:`visible`,children:t},e.mode,0,null),t.return=e,e.child=t}function Xs(e,t,n,r){return r!==null&&Ma(r),Ra(t,e.child,null,n),e=Ys(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Zs(e,t,n,i,a,o,s){if(n)return t.flags&256?(t.flags&=-257,i=Ts(Error(r(422))),Xs(e,t,s,i)):t.memoizedState===null?(o=i.fallback,a=t.mode,i=Ql({mode:`visible`,children:i.children},a,0,null),o=Zl(o,a,s,null),o.flags|=2,i.return=t,o.return=t,i.sibling=o,t.child=i,t.mode&1&&Ra(t,e.child,null,s),t.child.memoizedState=qs(s),t.memoizedState=Ks,o):(t.child=e.child,t.flags|=128,null);if(!(t.mode&1))return Xs(e,t,s,null);if(a.data===`$!`){if(i=a.nextSibling&&a.nextSibling.dataset,i)var c=i.dgst;return i=c,o=Error(r(419)),i=Ts(o,i,void 0),Xs(e,t,s,i)}if(c=(s&e.childLanes)!==0,Ps||c){if(i=Uc,i!==null){switch(s&-s){case 4:a=2;break;case 16:a=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:a=32;break;case 536870912:a=268435456;break;default:a=0}a=(a&(i.suspendedLanes|s))===0?a:0,a!==0&&a!==o.retryLane&&(o.retryLane=a,Qa(e,a),hl(i,e,a,-1))}return kl(),i=Ts(Error(r(421))),Xs(e,t,s,i)}return a.data===`$?`?(t.flags|=128,t.child=e.child,t=Vl.bind(null,e),a._reactRetry=t,null):(e=o.treeContext,Sa=ki(a.nextSibling),xa=t,K=!0,Ca=null,e!==null&&(fa[pa++]=ha,fa[pa++]=ga,fa[pa++]=ma,ha=e.id,ga=e.overflow,ma=t),t=Ys(t,i.children),t.flags|=4096,t)}function Qs(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Ka(e.return,t,n)}function $s(e,t,n,r,i){var a=e.memoizedState;a===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i}:(a.isBackwards=t,a.rendering=null,a.renderingStartTime=0,a.last=r,a.tail=n,a.tailMode=i)}function ec(e,t,n){var r=t.pendingProps,i=r.revealOrder,a=r.tail;if(Fs(e,t,r.children,n),r=q.current,r&2)r=r&1|2,t.flags|=128;else{if(e!==null&&e.flags&128)a:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Qs(e,n,t);else if(e.tag===19)Qs(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break a;for(;e.sibling===null;){if(e.return===null||e.return===t)break a;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(G(q,r),!(t.mode&1))t.memoizedState=null;else switch(i){case`forwards`:for(n=t.child,i=null;n!==null;)e=n.alternate,e!==null&&vo(e)===null&&(i=n),n=n.sibling;n=i,n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),$s(t,!1,i,n,a);break;case`backwards`:for(n=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&vo(e)===null){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}$s(t,!0,n,null,a);break;case`together`:$s(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function tc(e,t){!(t.mode&1)&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function nc(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Yc|=t.lanes,(n&t.childLanes)===0)return null;if(e!==null&&t.child!==e.child)throw Error(r(153));if(t.child!==null){for(e=t.child,n=Yl(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Yl(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function rc(e,t,n){switch(t.tag){case 3:Ws(t),ja();break;case 5:go(t);break;case 1:Xi(t.type)&&ea(t);break;case 4:mo(t,t.stateNode.containerInfo);break;case 10:var r=t.type._context,i=t.memoizedProps.value;G(Ba,r._currentValue),r._currentValue=i;break;case 13:if(r=t.memoizedState,r!==null)return r.dehydrated===null?(n&t.child.childLanes)===0?(G(q,q.current&1),e=nc(e,t,n),e===null?null:e.sibling):Js(e,t,n):(G(q,q.current&1),t.flags|=128,null);G(q,q.current&1);break;case 19:if(r=(n&t.childLanes)!==0,e.flags&128){if(r)return ec(e,t,n);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),G(q,q.current),r)break;return null;case 22:case 23:return t.lanes=0,zs(e,t,n)}return nc(e,t,n)}var ic=function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}},ac=function(e,t,n,r){var i=e.memoizedProps;if(i!==r){e=t.stateNode,po(lo.current);var o=null;switch(n){case`input`:i=ge(e,i),r=ge(e,r),o=[];break;case`select`:i=N({},i,{value:void 0}),r=N({},r,{value:void 0}),o=[];break;case`textarea`:i=we(e,i),r=we(e,r),o=[];break;default:typeof i.onClick!=`function`&&typeof r.onClick==`function`&&(e.onclick=yi)}Re(n,r);var s;for(u in n=null,i)if(!r.hasOwnProperty(u)&&i.hasOwnProperty(u)&&i[u]!=null)if(u===`style`){var c=i[u];for(s in c)c.hasOwnProperty(s)&&(n||={},n[s]=``)}else u!==`dangerouslySetInnerHTML`&&u!==`children`&&u!==`suppressContentEditableWarning`&&u!==`suppressHydrationWarning`&&u!==`autoFocus`&&(a.hasOwnProperty(u)?o||=[]:(o||=[]).push(u,null));for(u in r){var l=r[u];if(c=i?.[u],r.hasOwnProperty(u)&&l!==c&&(l!=null||c!=null))if(u===`style`)if(c){for(s in c)!c.hasOwnProperty(s)||l&&l.hasOwnProperty(s)||(n||={},n[s]=``);for(s in l)l.hasOwnProperty(s)&&c[s]!==l[s]&&(n||={},n[s]=l[s])}else n||(o||=[],o.push(u,n)),n=l;else u===`dangerouslySetInnerHTML`?(l=l?l.__html:void 0,c=c?c.__html:void 0,l!=null&&c!==l&&(o||=[]).push(u,l)):u===`children`?typeof l!=`string`&&typeof l!=`number`||(o||=[]).push(u,``+l):u!==`suppressContentEditableWarning`&&u!==`suppressHydrationWarning`&&(a.hasOwnProperty(u)?(l!=null&&u===`onScroll`&&U(`scroll`,e),o||c===l||(o=[])):(o||=[]).push(u,l))}n&&(o||=[]).push(`style`,n);var u=o;(t.updateQueue=u)&&(t.flags|=4)}},oc=function(e,t,n,r){n!==r&&(t.flags|=4)};function sc(e,t){if(!K)switch(e.tailMode){case`hidden`:t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case`collapsed`:n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function cc(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&14680064,r|=i.flags&14680064,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function lc(e,t,n){var i=t.pendingProps;switch(ba(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return cc(t),null;case 1:return Xi(t.type)&&Zi(),cc(t),null;case 3:return i=t.stateNode,ho(),W(qi),W(Ki),bo(),i.pendingContext&&(i.context=i.pendingContext,i.pendingContext=null),(e===null||e.child===null)&&(ka(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,Ca!==null&&(yl(Ca),Ca=null))),cc(t),null;case 5:_o(t);var o=po(fo.current);if(n=t.type,e!==null&&t.stateNode!=null)ac(e,t,n,i,o),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!i){if(t.stateNode===null)throw Error(r(166));return cc(t),null}if(e=po(lo.current),ka(t)){i=t.stateNode,n=t.type;var s=t.memoizedProps;switch(i[Mi]=t,i[Ni]=s,e=(t.mode&1)!=0,n){case`dialog`:U(`cancel`,i),U(`close`,i);break;case`iframe`:case`object`:case`embed`:U(`load`,i);break;case`video`:case`audio`:for(o=0;o<ni.length;o++)U(ni[o],i);break;case`source`:U(`error`,i);break;case`img`:case`image`:case`link`:U(`error`,i),U(`load`,i);break;case`details`:U(`toggle`,i);break;case`input`:_e(i,s),U(`invalid`,i);break;case`select`:i._wrapperState={wasMultiple:!!s.multiple},U(`invalid`,i);break;case`textarea`:Te(i,s),U(`invalid`,i)}for(var c in Re(n,s),o=null,s)if(s.hasOwnProperty(c)){var l=s[c];c===`children`?typeof l==`string`?i.textContent!==l&&(!0!==s.suppressHydrationWarning&&vi(i.textContent,l,e),o=[`children`,l]):typeof l==`number`&&i.textContent!==``+l&&(!0!==s.suppressHydrationWarning&&vi(i.textContent,l,e),o=[`children`,``+l]):a.hasOwnProperty(c)&&l!=null&&c===`onScroll`&&U(`scroll`,i)}switch(n){case`input`:pe(i),be(i,s,!0);break;case`textarea`:pe(i),De(i);break;case`select`:case`option`:break;default:typeof s.onClick==`function`&&(i.onclick=yi)}i=o,t.updateQueue=i,i!==null&&(t.flags|=4)}else{c=o.nodeType===9?o:o.ownerDocument,e===`http://www.w3.org/1999/xhtml`&&(e=Oe(n)),e===`http://www.w3.org/1999/xhtml`?n===`script`?(e=c.createElement(`div`),e.innerHTML=`<script><\/script>`,e=e.removeChild(e.firstChild)):typeof i.is==`string`?e=c.createElement(n,{is:i.is}):(e=c.createElement(n),n===`select`&&(c=e,i.multiple?c.multiple=!0:i.size&&(c.size=i.size))):e=c.createElementNS(e,n),e[Mi]=t,e[Ni]=i,ic(e,t,!1,!1),t.stateNode=e;a:{switch(c=ze(n,i),n){case`dialog`:U(`cancel`,e),U(`close`,e),o=i;break;case`iframe`:case`object`:case`embed`:U(`load`,e),o=i;break;case`video`:case`audio`:for(o=0;o<ni.length;o++)U(ni[o],e);o=i;break;case`source`:U(`error`,e),o=i;break;case`img`:case`image`:case`link`:U(`error`,e),U(`load`,e),o=i;break;case`details`:U(`toggle`,e),o=i;break;case`input`:_e(e,i),o=ge(e,i),U(`invalid`,e);break;case`option`:o=i;break;case`select`:e._wrapperState={wasMultiple:!!i.multiple},o=N({},i,{value:void 0}),U(`invalid`,e);break;case`textarea`:Te(e,i),o=we(e,i),U(`invalid`,e);break;default:o=i}for(s in Re(n,o),l=o,l)if(l.hasOwnProperty(s)){var u=l[s];s===`style`?Ie(e,u):s===`dangerouslySetInnerHTML`?(u=u?u.__html:void 0,u!=null&&je(e,u)):s===`children`?typeof u==`string`?(n!==`textarea`||u!==``)&&Me(e,u):typeof u==`number`&&Me(e,``+u):s!==`suppressContentEditableWarning`&&s!==`suppressHydrationWarning`&&s!==`autoFocus`&&(a.hasOwnProperty(s)?u!=null&&s===`onScroll`&&U(`scroll`,e):u!=null&&b(e,s,u,c))}switch(n){case`input`:pe(e),be(e,i,!1);break;case`textarea`:pe(e),De(e);break;case`option`:i.value!=null&&e.setAttribute(`value`,``+ue(i.value));break;case`select`:e.multiple=!!i.multiple,s=i.value,s==null?i.defaultValue!=null&&Ce(e,!!i.multiple,i.defaultValue,!0):Ce(e,!!i.multiple,s,!1);break;default:typeof o.onClick==`function`&&(e.onclick=yi)}switch(n){case`button`:case`input`:case`select`:case`textarea`:i=!!i.autoFocus;break a;case`img`:i=!0;break a;default:i=!1}}i&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return cc(t),null;case 6:if(e&&t.stateNode!=null)oc(e,t,e.memoizedProps,i);else{if(typeof i!=`string`&&t.stateNode===null)throw Error(r(166));if(n=po(fo.current),po(lo.current),ka(t)){if(i=t.stateNode,n=t.memoizedProps,i[Mi]=t,(s=i.nodeValue!==n)&&(e=xa,e!==null))switch(e.tag){case 3:vi(i.nodeValue,n,(e.mode&1)!=0);break;case 5:!0!==e.memoizedProps.suppressHydrationWarning&&vi(i.nodeValue,n,(e.mode&1)!=0)}s&&(t.flags|=4)}else i=(n.nodeType===9?n:n.ownerDocument).createTextNode(i),i[Mi]=t,t.stateNode=i}return cc(t),null;case 13:if(W(q),i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(K&&Sa!==null&&t.mode&1&&!(t.flags&128))Aa(),ja(),t.flags|=98560,s=!1;else if(s=ka(t),i!==null&&i.dehydrated!==null){if(e===null){if(!s)throw Error(r(318));if(s=t.memoizedState,s=s===null?null:s.dehydrated,!s)throw Error(r(317));s[Mi]=t}else ja(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;cc(t),s=!1}else Ca!==null&&(yl(Ca),Ca=null),s=!0;if(!s)return t.flags&65536?t:null}return t.flags&128?(t.lanes=n,t):(i=i!==null,i!==(e!==null&&e.memoizedState!==null)&&i&&(t.child.flags|=8192,t.mode&1&&(e===null||q.current&1?qc===0&&(qc=3):kl())),t.updateQueue!==null&&(t.flags|=4),cc(t),null);case 4:return ho(),e===null&&ci(t.stateNode.containerInfo),cc(t),null;case 10:return Ga(t.type._context),cc(t),null;case 17:return Xi(t.type)&&Zi(),cc(t),null;case 19:if(W(q),s=t.memoizedState,s===null)return cc(t),null;if(i=(t.flags&128)!=0,c=s.rendering,c===null)if(i)sc(s,!1);else{if(qc!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(c=vo(e),c!==null){for(t.flags|=128,sc(s,!1),i=c.updateQueue,i!==null&&(t.updateQueue=i,t.flags|=4),t.subtreeFlags=0,i=n,n=t.child;n!==null;)s=n,e=i,s.flags&=14680066,c=s.alternate,c===null?(s.childLanes=0,s.lanes=e,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=c.childLanes,s.lanes=c.lanes,s.child=c.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=c.memoizedProps,s.memoizedState=c.memoizedState,s.updateQueue=c.updateQueue,s.type=c.type,e=c.dependencies,s.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),n=n.sibling;return G(q,q.current&1|2),t.child}e=e.sibling}s.tail!==null&&R()>tl&&(t.flags|=128,i=!0,sc(s,!1),t.lanes=4194304)}else{if(!i)if(e=vo(c),e!==null){if(t.flags|=128,i=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),sc(s,!0),s.tail===null&&s.tailMode===`hidden`&&!c.alternate&&!K)return cc(t),null}else 2*R()-s.renderingStartTime>tl&&n!==1073741824&&(t.flags|=128,i=!0,sc(s,!1),t.lanes=4194304);s.isBackwards?(c.sibling=t.child,t.child=c):(n=s.last,n===null?t.child=c:n.sibling=c,s.last=c)}return s.tail===null?(cc(t),null):(t=s.tail,s.rendering=t,s.tail=t.sibling,s.renderingStartTime=R(),t.sibling=null,n=q.current,G(q,i?n&1|2:n&1),t);case 22:case 23:return Tl(),i=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==i&&(t.flags|=8192),i&&t.mode&1?Gc&1073741824&&(cc(t),t.subtreeFlags&6&&(t.flags|=8192)):cc(t),null;case 24:return null;case 25:return null}throw Error(r(156,t.tag))}function uc(e,t){switch(ba(t),t.tag){case 1:return Xi(t.type)&&Zi(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return ho(),W(qi),W(Ki),bo(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 5:return _o(t),null;case 13:if(W(q),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(r(340));ja()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return W(q),null;case 4:return ho(),null;case 10:return Ga(t.type._context),null;case 22:case 23:return Tl(),null;case 24:return null;default:return null}}var dc=!1,fc=!1,pc=typeof WeakSet==`function`?WeakSet:Set,X=null;function mc(e,t){var n=e.ref;if(n!==null)if(typeof n==`function`)try{n(null)}catch(n){$(e,t,n)}else n.current=null}function hc(e,t,n){try{n()}catch(n){$(e,t,n)}}var gc=!1;function _c(e,t){if(bi=fn,e=Pr(),Fr(e)){if(`selectionStart`in e)var n={start:e.selectionStart,end:e.selectionEnd};else a:{n=(n=e.ownerDocument)&&n.defaultView||window;var i=n.getSelection&&n.getSelection();if(i&&i.rangeCount!==0){n=i.anchorNode;var a=i.anchorOffset,o=i.focusNode;i=i.focusOffset;try{n.nodeType,o.nodeType}catch{n=null;break a}var s=0,c=-1,l=-1,u=0,d=0,f=e,p=null;b:for(;;){for(var m;f!==n||a!==0&&f.nodeType!==3||(c=s+a),f!==o||i!==0&&f.nodeType!==3||(l=s+i),f.nodeType===3&&(s+=f.nodeValue.length),(m=f.firstChild)!==null;)p=f,f=m;for(;;){if(f===e)break b;if(p===n&&++u===a&&(c=s),p===o&&++d===i&&(l=s),(m=f.nextSibling)!==null)break;f=p,p=f.parentNode}f=m}n=c===-1||l===-1?null:{start:c,end:l}}else n=null}n||={start:0,end:0}}else n=null;for(xi={focusedElem:e,selectionRange:n},fn=!1,X=t;X!==null;)if(t=X,e=t.child,t.subtreeFlags&1028&&e!==null)e.return=t,X=e;else for(;X!==null;){t=X;try{var h=t.alternate;if(t.flags&1024)switch(t.tag){case 0:case 11:case 15:break;case 1:if(h!==null){var g=h.memoizedProps,_=h.memoizedState,v=t.stateNode;v.__reactInternalSnapshotBeforeUpdate=v.getSnapshotBeforeUpdate(t.elementType===t.type?g:_s(t.type,g),_)}break;case 3:var y=t.stateNode.containerInfo;y.nodeType===1?y.textContent=``:y.nodeType===9&&y.documentElement&&y.removeChild(y.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(r(163))}}catch(e){$(t,t.return,e)}if(e=t.sibling,e!==null){e.return=t.return,X=e;break}X=t.return}return h=gc,gc=!1,h}function vc(e,t,n){var r=t.updateQueue;if(r=r===null?null:r.lastEffect,r!==null){var i=r=r.next;do{if((i.tag&e)===e){var a=i.destroy;i.destroy=void 0,a!==void 0&&hc(t,n,a)}i=i.next}while(i!==r)}}function yc(e,t){if(t=t.updateQueue,t=t===null?null:t.lastEffect,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}function bc(e){var t=e.ref;if(t!==null){var n=e.stateNode;switch(e.tag){case 5:e=n;break;default:e=n}typeof t==`function`?t(e):t.current=e}}function xc(e){var t=e.alternate;t!==null&&(e.alternate=null,xc(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[Mi],delete t[Ni],delete t[Fi],delete t[Ii],delete t[Li])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function Sc(e){return e.tag===5||e.tag===3||e.tag===4}function Cc(e){a:for(;;){for(;e.sibling===null;){if(e.return===null||Sc(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue a;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function wc(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=yi));else if(r!==4&&(e=e.child,e!==null))for(wc(e,t,n),e=e.sibling;e!==null;)wc(e,t,n),e=e.sibling}function Tc(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(Tc(e,t,n),e=e.sibling;e!==null;)Tc(e,t,n),e=e.sibling}var Ec=null,Dc=!1;function Oc(e,t,n){for(n=n.child;n!==null;)kc(e,t,n),n=n.sibling}function kc(e,t,n){if(Ct&&typeof Ct.onCommitFiberUnmount==`function`)try{Ct.onCommitFiberUnmount(St,n)}catch{}switch(n.tag){case 5:fc||mc(n,t);case 6:var r=Ec,i=Dc;Ec=null,Oc(e,t,n),Ec=r,Dc=i,Ec!==null&&(Dc?(e=Ec,n=n.stateNode,e.nodeType===8?e.parentNode.removeChild(n):e.removeChild(n)):Ec.removeChild(n.stateNode));break;case 18:Ec!==null&&(Dc?(e=Ec,n=n.stateNode,e.nodeType===8?Oi(e.parentNode,n):e.nodeType===1&&Oi(e,n),un(e)):Oi(Ec,n.stateNode));break;case 4:r=Ec,i=Dc,Ec=n.stateNode.containerInfo,Dc=!0,Oc(e,t,n),Ec=r,Dc=i;break;case 0:case 11:case 14:case 15:if(!fc&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){i=r=r.next;do{var a=i,o=a.destroy;a=a.tag,o!==void 0&&(a&2||a&4)&&hc(n,t,o),i=i.next}while(i!==r)}Oc(e,t,n);break;case 1:if(!fc&&(mc(n,t),r=n.stateNode,typeof r.componentWillUnmount==`function`))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(e){$(n,t,e)}Oc(e,t,n);break;case 21:Oc(e,t,n);break;case 22:n.mode&1?(fc=(r=fc)||n.memoizedState!==null,Oc(e,t,n),fc=r):Oc(e,t,n);break;default:Oc(e,t,n)}}function Ac(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new pc),t.forEach(function(t){var r=Hl.bind(null,e,t);n.has(t)||(n.add(t),t.then(r,r))})}}function jc(e,t){var n=t.deletions;if(n!==null)for(var i=0;i<n.length;i++){var a=n[i];try{var o=e,s=t,c=s;a:for(;c!==null;){switch(c.tag){case 5:Ec=c.stateNode,Dc=!1;break a;case 3:Ec=c.stateNode.containerInfo,Dc=!0;break a;case 4:Ec=c.stateNode.containerInfo,Dc=!0;break a}c=c.return}if(Ec===null)throw Error(r(160));kc(o,s,a),Ec=null,Dc=!1;var l=a.alternate;l!==null&&(l.return=null),a.return=null}catch(e){$(a,t,e)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)Mc(t,e),t=t.sibling}function Mc(e,t){var n=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(jc(t,e),Nc(e),i&4){try{vc(3,e,e.return),yc(3,e)}catch(t){$(e,e.return,t)}try{vc(5,e,e.return)}catch(t){$(e,e.return,t)}}break;case 1:jc(t,e),Nc(e),i&512&&n!==null&&mc(n,n.return);break;case 5:if(jc(t,e),Nc(e),i&512&&n!==null&&mc(n,n.return),e.flags&32){var a=e.stateNode;try{Me(a,``)}catch(t){$(e,e.return,t)}}if(i&4&&(a=e.stateNode,a!=null)){var o=e.memoizedProps,s=n===null?o:n.memoizedProps,c=e.type,l=e.updateQueue;if(e.updateQueue=null,l!==null)try{c===`input`&&o.type===`radio`&&o.name!=null&&ve(a,o),ze(c,s);var u=ze(c,o);for(s=0;s<l.length;s+=2){var d=l[s],f=l[s+1];d===`style`?Ie(a,f):d===`dangerouslySetInnerHTML`?je(a,f):d===`children`?Me(a,f):b(a,d,f,u)}switch(c){case`input`:ye(a,o);break;case`textarea`:Ee(a,o);break;case`select`:var p=a._wrapperState.wasMultiple;a._wrapperState.wasMultiple=!!o.multiple;var m=o.value;m==null?p!==!!o.multiple&&(o.defaultValue==null?Ce(a,!!o.multiple,o.multiple?[]:``,!1):Ce(a,!!o.multiple,o.defaultValue,!0)):Ce(a,!!o.multiple,m,!1)}a[Ni]=o}catch(t){$(e,e.return,t)}}break;case 6:if(jc(t,e),Nc(e),i&4){if(e.stateNode===null)throw Error(r(162));a=e.stateNode,o=e.memoizedProps;try{a.nodeValue=o}catch(t){$(e,e.return,t)}}break;case 3:if(jc(t,e),Nc(e),i&4&&n!==null&&n.memoizedState.isDehydrated)try{un(t.containerInfo)}catch(t){$(e,e.return,t)}break;case 4:jc(t,e),Nc(e);break;case 13:jc(t,e),Nc(e),a=e.child,a.flags&8192&&(o=a.memoizedState!==null,a.stateNode.isHidden=o,!o||a.alternate!==null&&a.alternate.memoizedState!==null||(el=R())),i&4&&Ac(e);break;case 22:if(d=n!==null&&n.memoizedState!==null,e.mode&1?(fc=(u=fc)||d,jc(t,e),fc=u):jc(t,e),Nc(e),i&8192){if(u=e.memoizedState!==null,(e.stateNode.isHidden=u)&&!d&&e.mode&1)for(X=e,d=e.child;d!==null;){for(f=X=d;X!==null;){switch(p=X,m=p.child,p.tag){case 0:case 11:case 14:case 15:vc(4,p,p.return);break;case 1:mc(p,p.return);var h=p.stateNode;if(typeof h.componentWillUnmount==`function`){i=p,n=p.return;try{t=i,h.props=t.memoizedProps,h.state=t.memoizedState,h.componentWillUnmount()}catch(e){$(i,n,e)}}break;case 5:mc(p,p.return);break;case 22:if(p.memoizedState!==null){Lc(f);continue}}m===null?Lc(f):(m.return=p,X=m)}d=d.sibling}a:for(d=null,f=e;;){if(f.tag===5){if(d===null){d=f;try{a=f.stateNode,u?(o=a.style,typeof o.setProperty==`function`?o.setProperty(`display`,`none`,`important`):o.display=`none`):(c=f.stateNode,l=f.memoizedProps.style,s=l!=null&&l.hasOwnProperty(`display`)?l.display:null,c.style.display=Fe(`display`,s))}catch(t){$(e,e.return,t)}}}else if(f.tag===6){if(d===null)try{f.stateNode.nodeValue=u?``:f.memoizedProps}catch(t){$(e,e.return,t)}}else if((f.tag!==22&&f.tag!==23||f.memoizedState===null||f===e)&&f.child!==null){f.child.return=f,f=f.child;continue}if(f===e)break a;for(;f.sibling===null;){if(f.return===null||f.return===e)break a;d===f&&(d=null),f=f.return}d===f&&(d=null),f.sibling.return=f.return,f=f.sibling}}break;case 19:jc(t,e),Nc(e),i&4&&Ac(e);break;case 21:break;default:jc(t,e),Nc(e)}}function Nc(e){var t=e.flags;if(t&2){try{a:{for(var n=e.return;n!==null;){if(Sc(n)){var i=n;break a}n=n.return}throw Error(r(160))}switch(i.tag){case 5:var a=i.stateNode;i.flags&32&&(Me(a,``),i.flags&=-33),Tc(e,Cc(e),a);break;case 3:case 4:var o=i.stateNode.containerInfo;wc(e,Cc(e),o);break;default:throw Error(r(161))}}catch(t){$(e,e.return,t)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Pc(e,t,n){X=e,Fc(e,t,n)}function Fc(e,t,n){for(var r=(e.mode&1)!=0;X!==null;){var i=X,a=i.child;if(i.tag===22&&r){var o=i.memoizedState!==null||dc;if(!o){var s=i.alternate,c=s!==null&&s.memoizedState!==null||fc;s=dc;var l=fc;if(dc=o,(fc=c)&&!l)for(X=i;X!==null;)o=X,c=o.child,o.tag===22&&o.memoizedState!==null||c===null?Rc(i):(c.return=o,X=c);for(;a!==null;)X=a,Fc(a,t,n),a=a.sibling;X=i,dc=s,fc=l}Ic(e,t,n)}else i.subtreeFlags&8772&&a!==null?(a.return=i,X=a):Ic(e,t,n)}}function Ic(e){for(;X!==null;){var t=X;if(t.flags&8772){var n=t.alternate;try{if(t.flags&8772)switch(t.tag){case 0:case 11:case 15:fc||yc(5,t);break;case 1:var i=t.stateNode;if(t.flags&4&&!fc)if(n===null)i.componentDidMount();else{var a=t.elementType===t.type?n.memoizedProps:_s(t.type,n.memoizedProps);i.componentDidUpdate(a,n.memoizedState,i.__reactInternalSnapshotBeforeUpdate)}var o=t.updateQueue;o!==null&&so(t,o,i);break;case 3:var s=t.updateQueue;if(s!==null){if(n=null,t.child!==null)switch(t.child.tag){case 5:n=t.child.stateNode;break;case 1:n=t.child.stateNode}so(t,s,n)}break;case 5:var c=t.stateNode;if(n===null&&t.flags&4){n=c;var l=t.memoizedProps;switch(t.type){case`button`:case`input`:case`select`:case`textarea`:l.autoFocus&&n.focus();break;case`img`:l.src&&(n.src=l.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var u=t.alternate;if(u!==null){var d=u.memoizedState;if(d!==null){var f=d.dehydrated;f!==null&&un(f)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(r(163))}fc||t.flags&512&&bc(t)}catch(e){$(t,t.return,e)}}if(t===e){X=null;break}if(n=t.sibling,n!==null){n.return=t.return,X=n;break}X=t.return}}function Lc(e){for(;X!==null;){var t=X;if(t===e){X=null;break}var n=t.sibling;if(n!==null){n.return=t.return,X=n;break}X=t.return}}function Rc(e){for(;X!==null;){var t=X;try{switch(t.tag){case 0:case 11:case 15:var n=t.return;try{yc(4,t)}catch(e){$(t,n,e)}break;case 1:var r=t.stateNode;if(typeof r.componentDidMount==`function`){var i=t.return;try{r.componentDidMount()}catch(e){$(t,i,e)}}var a=t.return;try{bc(t)}catch(e){$(t,a,e)}break;case 5:var o=t.return;try{bc(t)}catch(e){$(t,o,e)}}}catch(e){$(t,t.return,e)}if(t===e){X=null;break}var s=t.sibling;if(s!==null){s.return=t.return,X=s;break}X=t.return}}var zc=Math.ceil,Bc=x.ReactCurrentDispatcher,Vc=x.ReactCurrentOwner,Hc=x.ReactCurrentBatchConfig,Z=0,Uc=null,Q=null,Wc=0,Gc=0,Kc=Wi(0),qc=0,Jc=null,Yc=0,Xc=0,Zc=0,Qc=null,$c=null,el=0,tl=1/0,nl=null,rl=!1,il=null,al=null,ol=!1,sl=null,cl=0,ll=0,ul=null,dl=-1,fl=0;function pl(){return Z&6?R():dl===-1?dl=R():dl}function ml(e){return e.mode&1?Z&2&&Wc!==0?Wc&-Wc:Na.transition===null?(e=z,e===0?(e=window.event,e=e===void 0?16:vn(e.type),e):e):(fl===0&&(fl=It()),fl):1}function hl(e,t,n,i){if(50<ll)throw ll=0,ul=null,Error(r(185));Rt(e,n,i),(!(Z&2)||e!==Uc)&&(e===Uc&&(!(Z&2)&&(Xc|=n),qc===4&&xl(e,Wc)),gl(e,i),n===1&&Z===0&&!(t.mode&1)&&(tl=R()+500,ra&&sa()))}function gl(e,t){var n=e.callbackNode;Pt(e,t);var r=Mt(e,e===Uc?Wc:0);if(r===0)n!==null&&pt(n),e.callbackNode=null,e.callbackPriority=0;else if(t=r&-r,e.callbackPriority!==t){if(n!=null&&pt(n),t===1)e.tag===0?oa(Sl.bind(null,e)):aa(Sl.bind(null,e)),Ei(function(){!(Z&6)&&sa()}),n=null;else{switch(Vt(r)){case 1:n=_t;break;case 4:n=vt;break;case 16:n=yt;break;case 536870912:n=xt;break;default:n=yt}n=Wl(n,_l.bind(null,e))}e.callbackPriority=t,e.callbackNode=n}}function _l(e,t){if(dl=-1,fl=0,Z&6)throw Error(r(327));var n=e.callbackNode;if(Ll()&&e.callbackNode!==n)return null;var i=Mt(e,e===Uc?Wc:0);if(i===0)return null;if(i&30||(i&e.expiredLanes)!==0||t)t=Al(e,i);else{t=i;var a=Z;Z|=2;var o=Ol();(Uc!==e||Wc!==t)&&(nl=null,tl=R()+500,El(e,t));do try{Ml();break}catch(t){Dl(e,t)}while(1);Wa(),Bc.current=o,Z=a,Q===null?(Uc=null,Wc=0,t=qc):t=0}if(t!==0){if(t===2&&(a=Ft(e),a!==0&&(i=a,t=vl(e,a))),t===1)throw n=Jc,El(e,0),xl(e,i),gl(e,R()),n;if(t===6)xl(e,i);else{if(a=e.current.alternate,!(i&30)&&!bl(a)&&(t=Al(e,i),t===2&&(o=Ft(e),o!==0&&(i=o,t=vl(e,o))),t===1))throw n=Jc,El(e,0),xl(e,i),gl(e,R()),n;switch(e.finishedWork=a,e.finishedLanes=i,t){case 0:case 1:throw Error(r(345));case 2:Fl(e,$c,nl);break;case 3:if(xl(e,i),(i&130023424)===i&&(t=el+500-R(),10<t)){if(Mt(e,0)!==0)break;if(a=e.suspendedLanes,(a&i)!==i){pl(),e.pingedLanes|=e.suspendedLanes&a;break}e.timeoutHandle=Ci(Fl.bind(null,e,$c,nl),t);break}Fl(e,$c,nl);break;case 4:if(xl(e,i),(i&4194240)===i)break;for(t=e.eventTimes,a=-1;0<i;){var s=31-Tt(i);o=1<<s,s=t[s],s>a&&(a=s),i&=~o}if(i=a,i=R()-i,i=(120>i?120:480>i?480:1080>i?1080:1920>i?1920:3e3>i?3e3:4320>i?4320:1960*zc(i/1960))-i,10<i){e.timeoutHandle=Ci(Fl.bind(null,e,$c,nl),i);break}Fl(e,$c,nl);break;case 5:Fl(e,$c,nl);break;default:throw Error(r(329))}}}return gl(e,R()),e.callbackNode===n?_l.bind(null,e):null}function vl(e,t){var n=Qc;return e.current.memoizedState.isDehydrated&&(El(e,t).flags|=256),e=Al(e,t),e!==2&&(t=$c,$c=n,t!==null&&yl(t)),e}function yl(e){$c===null?$c=e:$c.push.apply($c,e)}function bl(e){for(var t=e;;){if(t.flags&16384){var n=t.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var i=n[r],a=i.getSnapshot;i=i.value;try{if(!Dr(a(),i))return!1}catch{return!1}}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function xl(e,t){for(t&=~Zc,t&=~Xc,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var n=31-Tt(t),r=1<<n;e[n]=-1,t&=~r}}function Sl(e){if(Z&6)throw Error(r(327));Ll();var t=Mt(e,0);if(!(t&1))return gl(e,R()),null;var n=Al(e,t);if(e.tag!==0&&n===2){var i=Ft(e);i!==0&&(t=i,n=vl(e,i))}if(n===1)throw n=Jc,El(e,0),xl(e,t),gl(e,R()),n;if(n===6)throw Error(r(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,Fl(e,$c,nl),gl(e,R()),null}function Cl(e,t){var n=Z;Z|=1;try{return e(t)}finally{Z=n,Z===0&&(tl=R()+500,ra&&sa())}}function wl(e){sl!==null&&sl.tag===0&&!(Z&6)&&Ll();var t=Z;Z|=1;var n=Hc.transition,r=z;try{if(Hc.transition=null,z=1,e)return e()}finally{z=r,Hc.transition=n,Z=t,!(Z&6)&&sa()}}function Tl(){Gc=Kc.current,W(Kc)}function El(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,wi(n)),Q!==null)for(n=Q.return;n!==null;){var r=n;switch(ba(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Zi();break;case 3:ho(),W(qi),W(Ki),bo();break;case 5:_o(r);break;case 4:ho();break;case 13:W(q);break;case 19:W(q);break;case 10:Ga(r.type._context);break;case 22:case 23:Tl()}n=n.return}if(Uc=e,Q=e=Yl(e.current,null),Wc=Gc=t,qc=0,Jc=null,Zc=Xc=Yc=0,$c=Qc=null,Ya!==null){for(t=0;t<Ya.length;t++)if(n=Ya[t],r=n.interleaved,r!==null){n.interleaved=null;var i=r.next,a=n.pending;if(a!==null){var o=a.next;a.next=i,r.next=o}n.pending=r}Ya=null}return e}function Dl(e,t){do{var n=Q;try{if(Wa(),xo.current=ps,To){for(var i=J.memoizedState;i!==null;){var a=i.queue;a!==null&&(a.pending=null),i=i.next}To=!1}if(Co=0,wo=Y=J=null,Eo=!1,Do=0,Vc.current=null,n===null||n.return===null){qc=1,Jc=t,Q=null;break}a:{var o=e,s=n.return,c=n,l=t;if(t=Wc,c.flags|=32768,typeof l==`object`&&l&&typeof l.then==`function`){var u=l,d=c,f=d.tag;if(!(d.mode&1)&&(f===0||f===11||f===15)){var p=d.alternate;p?(d.updateQueue=p.updateQueue,d.memoizedState=p.memoizedState,d.lanes=p.lanes):(d.updateQueue=null,d.memoizedState=null)}var m=js(s);if(m!==null){m.flags&=-257,Ms(m,s,c,o,t),m.mode&1&&As(o,u,t),t=m,l=u;var h=t.updateQueue;if(h===null){var g=new Set;g.add(l),t.updateQueue=g}else h.add(l);break a}else{if(!(t&1)){As(o,u,t),kl();break a}l=Error(r(426))}}else if(K&&c.mode&1){var _=js(s);if(_!==null){!(_.flags&65536)&&(_.flags|=256),Ms(_,s,c,o,t),Ma(ws(l,c));break a}}o=l=ws(l,c),qc!==4&&(qc=2),Qc===null?Qc=[o]:Qc.push(o),o=s;do{switch(o.tag){case 3:o.flags|=65536,t&=-t,o.lanes|=t;var v=Os(o,l,t);ao(o,v);break a;case 1:c=l;var y=o.type,b=o.stateNode;if(!(o.flags&128)&&(typeof y.getDerivedStateFromError==`function`||b!==null&&typeof b.componentDidCatch==`function`&&(al===null||!al.has(b)))){o.flags|=65536,t&=-t,o.lanes|=t;var x=ks(o,c,t);ao(o,x);break a}}o=o.return}while(o!==null)}Pl(n)}catch(e){t=e,Q===n&&n!==null&&(Q=n=n.return);continue}break}while(1)}function Ol(){var e=Bc.current;return Bc.current=ps,e===null?ps:e}function kl(){(qc===0||qc===3||qc===2)&&(qc=4),Uc===null||!(Yc&268435455)&&!(Xc&268435455)||xl(Uc,Wc)}function Al(e,t){var n=Z;Z|=2;var i=Ol();(Uc!==e||Wc!==t)&&(nl=null,El(e,t));do try{jl();break}catch(t){Dl(e,t)}while(1);if(Wa(),Z=n,Bc.current=i,Q!==null)throw Error(r(261));return Uc=null,Wc=0,qc}function jl(){for(;Q!==null;)Nl(Q)}function Ml(){for(;Q!==null&&!mt();)Nl(Q)}function Nl(e){var t=Ul(e.alternate,e,Gc);e.memoizedProps=e.pendingProps,t===null?Pl(e):Q=t,Vc.current=null}function Pl(e){var t=e;do{var n=t.alternate;if(e=t.return,t.flags&32768){if(n=uc(n,t),n!==null){n.flags&=32767,Q=n;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{qc=6,Q=null;return}}else if(n=lc(n,t,Gc),n!==null){Q=n;return}if(t=t.sibling,t!==null){Q=t;return}Q=t=e}while(t!==null);qc===0&&(qc=5)}function Fl(e,t,n){var r=z,i=Hc.transition;try{Hc.transition=null,z=1,Il(e,t,n,r)}finally{Hc.transition=i,z=r}return null}function Il(e,t,n,i){do Ll();while(sl!==null);if(Z&6)throw Error(r(327));n=e.finishedWork;var a=e.finishedLanes;if(n===null)return null;if(e.finishedWork=null,e.finishedLanes=0,n===e.current)throw Error(r(177));e.callbackNode=null,e.callbackPriority=0;var o=n.lanes|n.childLanes;if(zt(e,o),e===Uc&&(Q=Uc=null,Wc=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||ol||(ol=!0,Wl(yt,function(){return Ll(),null})),o=(n.flags&15990)!=0,n.subtreeFlags&15990||o){o=Hc.transition,Hc.transition=null;var s=z;z=1;var c=Z;Z|=4,Vc.current=null,_c(e,n),Mc(n,e),Ir(xi),fn=!!bi,xi=bi=null,e.current=n,Pc(n,e,a),ht(),Z=c,z=s,Hc.transition=o}else e.current=n;if(ol&&(ol=!1,sl=e,cl=a),o=e.pendingLanes,o===0&&(al=null),wt(n.stateNode,i),gl(e,R()),t!==null)for(i=e.onRecoverableError,n=0;n<t.length;n++)a=t[n],i(a.value,{componentStack:a.stack,digest:a.digest});if(rl)throw rl=!1,e=il,il=null,e;return cl&1&&e.tag!==0&&Ll(),o=e.pendingLanes,o&1?e===ul?ll++:(ll=0,ul=e):ll=0,sa(),null}function Ll(){if(sl!==null){var e=Vt(cl),t=Hc.transition,n=z;try{if(Hc.transition=null,z=16>e?16:e,sl===null)var i=!1;else{if(e=sl,sl=null,cl=0,Z&6)throw Error(r(331));var a=Z;for(Z|=4,X=e.current;X!==null;){var o=X,s=o.child;if(X.flags&16){var c=o.deletions;if(c!==null){for(var l=0;l<c.length;l++){var u=c[l];for(X=u;X!==null;){var d=X;switch(d.tag){case 0:case 11:case 15:vc(8,d,o)}var f=d.child;if(f!==null)f.return=d,X=f;else for(;X!==null;){d=X;var p=d.sibling,m=d.return;if(xc(d),d===u){X=null;break}if(p!==null){p.return=m,X=p;break}X=m}}}var h=o.alternate;if(h!==null){var g=h.child;if(g!==null){h.child=null;do{var _=g.sibling;g.sibling=null,g=_}while(g!==null)}}X=o}}if(o.subtreeFlags&2064&&s!==null)s.return=o,X=s;else b:for(;X!==null;){if(o=X,o.flags&2048)switch(o.tag){case 0:case 11:case 15:vc(9,o,o.return)}var v=o.sibling;if(v!==null){v.return=o.return,X=v;break b}X=o.return}}var y=e.current;for(X=y;X!==null;){s=X;var b=s.child;if(s.subtreeFlags&2064&&b!==null)b.return=s,X=b;else b:for(s=y;X!==null;){if(c=X,c.flags&2048)try{switch(c.tag){case 0:case 11:case 15:yc(9,c)}}catch(e){$(c,c.return,e)}if(c===s){X=null;break b}var x=c.sibling;if(x!==null){x.return=c.return,X=x;break b}X=c.return}}if(Z=a,sa(),Ct&&typeof Ct.onPostCommitFiberRoot==`function`)try{Ct.onPostCommitFiberRoot(St,e)}catch{}i=!0}return i}finally{z=n,Hc.transition=t}}return!1}function Rl(e,t,n){t=ws(n,t),t=Os(e,t,1),e=ro(e,t,1),t=pl(),e!==null&&(Rt(e,1,t),gl(e,t))}function $(e,t,n){if(e.tag===3)Rl(e,e,n);else for(;t!==null;){if(t.tag===3){Rl(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError==`function`||typeof r.componentDidCatch==`function`&&(al===null||!al.has(r))){e=ws(n,e),e=ks(t,e,1),t=ro(t,e,1),e=pl(),t!==null&&(Rt(t,1,e),gl(t,e));break}}t=t.return}}function zl(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),t=pl(),e.pingedLanes|=e.suspendedLanes&n,Uc===e&&(Wc&n)===n&&(qc===4||qc===3&&(Wc&130023424)===Wc&&500>R()-el?El(e,0):Zc|=n),gl(e,t)}function Bl(e,t){t===0&&(e.mode&1?(t=At,At<<=1,!(At&130023424)&&(At=4194304)):t=1);var n=pl();e=Qa(e,t),e!==null&&(Rt(e,t,n),gl(e,n))}function Vl(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),Bl(e,n)}function Hl(e,t){var n=0;switch(e.tag){case 13:var i=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:i=e.stateNode;break;default:throw Error(r(314))}i!==null&&i.delete(t),Bl(e,n)}var Ul=function(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps||qi.current)Ps=!0;else{if((e.lanes&n)===0&&!(t.flags&128))return Ps=!1,rc(e,t,n);Ps=!!(e.flags&131072)}else Ps=!1,K&&t.flags&1048576&&va(t,da,t.index);switch(t.lanes=0,t.tag){case 2:var i=t.type;tc(e,t),e=t.pendingProps;var a=Yi(t,Ki.current);qa(t,n),a=jo(null,t,i,e,a,n);var o=Mo();return t.flags|=1,typeof a==`object`&&a&&typeof a.render==`function`&&a.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,Xi(i)?(o=!0,ea(t)):o=!1,t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,eo(t),a.updater=ys,t.stateNode=a,a._reactInternals=t,Cs(t,i,e,n),t=Us(null,t,i,!0,o,n)):(t.tag=0,K&&o&&ya(t),Fs(null,t,a,n),t=t.child),t;case 16:i=t.elementType;a:{switch(tc(e,t),e=t.pendingProps,a=i._init,i=a(i._payload),t.type=i,a=t.tag=Jl(i),e=_s(i,e),a){case 0:t=Vs(null,t,i,e,n);break a;case 1:t=Hs(null,t,i,e,n);break a;case 11:t=Is(null,t,i,e,n);break a;case 14:t=Ls(null,t,i,_s(i.type,e),n);break a}throw Error(r(306,i,``))}return t;case 0:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:_s(i,a),Vs(e,t,i,a,n);case 1:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:_s(i,a),Hs(e,t,i,a,n);case 3:a:{if(Ws(t),e===null)throw Error(r(387));i=t.pendingProps,o=t.memoizedState,a=o.element,to(e,t),oo(t,i,null,n);var s=t.memoizedState;if(i=s.element,o.isDehydrated)if(o={element:i,isDehydrated:!1,cache:s.cache,pendingSuspenseBoundaries:s.pendingSuspenseBoundaries,transitions:s.transitions},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){a=ws(Error(r(423)),t),t=Gs(e,t,i,n,a);break a}else if(i!==a){a=ws(Error(r(424)),t),t=Gs(e,t,i,n,a);break a}else for(Sa=ki(t.stateNode.containerInfo.firstChild),xa=t,K=!0,Ca=null,n=za(t,null,i,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(ja(),i===a){t=nc(e,t,n);break a}Fs(e,t,i,n)}t=t.child}return t;case 5:return go(t),e===null&&Da(t),i=t.type,a=t.pendingProps,o=e===null?null:e.memoizedProps,s=a.children,Si(i,a)?s=null:o!==null&&Si(i,o)&&(t.flags|=32),Bs(e,t),Fs(e,t,s,n),t.child;case 6:return e===null&&Da(t),null;case 13:return Js(e,t,n);case 4:return mo(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=Ra(t,null,i,n):Fs(e,t,i,n),t.child;case 11:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:_s(i,a),Is(e,t,i,a,n);case 7:return Fs(e,t,t.pendingProps,n),t.child;case 8:return Fs(e,t,t.pendingProps.children,n),t.child;case 12:return Fs(e,t,t.pendingProps.children,n),t.child;case 10:a:{if(i=t.type._context,a=t.pendingProps,o=t.memoizedProps,s=a.value,G(Ba,i._currentValue),i._currentValue=s,o!==null)if(Dr(o.value,s)){if(o.children===a.children&&!qi.current){t=nc(e,t,n);break a}}else for(o=t.child,o!==null&&(o.return=t);o!==null;){var c=o.dependencies;if(c!==null){s=o.child;for(var l=c.firstContext;l!==null;){if(l.context===i){if(o.tag===1){l=no(-1,n&-n),l.tag=2;var u=o.updateQueue;if(u!==null){u=u.shared;var d=u.pending;d===null?l.next=l:(l.next=d.next,d.next=l),u.pending=l}}o.lanes|=n,l=o.alternate,l!==null&&(l.lanes|=n),Ka(o.return,n,t),c.lanes|=n;break}l=l.next}}else if(o.tag===10)s=o.type===t.type?null:o.child;else if(o.tag===18){if(s=o.return,s===null)throw Error(r(341));s.lanes|=n,c=s.alternate,c!==null&&(c.lanes|=n),Ka(s,n,t),s=o.sibling}else s=o.child;if(s!==null)s.return=o;else for(s=o;s!==null;){if(s===t){s=null;break}if(o=s.sibling,o!==null){o.return=s.return,s=o;break}s=s.return}o=s}Fs(e,t,a.children,n),t=t.child}return t;case 9:return a=t.type,i=t.pendingProps.children,qa(t,n),a=Ja(a),i=i(a),t.flags|=1,Fs(e,t,i,n),t.child;case 14:return i=t.type,a=_s(i,t.pendingProps),a=_s(i.type,a),Ls(e,t,i,a,n);case 15:return Rs(e,t,t.type,t.pendingProps,n);case 17:return i=t.type,a=t.pendingProps,a=t.elementType===i?a:_s(i,a),tc(e,t),t.tag=1,Xi(i)?(e=!0,ea(t)):e=!1,qa(t,n),xs(t,i,a),Cs(t,i,a,n),Us(null,t,i,!0,e,n);case 19:return ec(e,t,n);case 22:return zs(e,t,n)}throw Error(r(156,t.tag))};function Wl(e,t){return ft(e,t)}function Gl(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Kl(e,t,n,r){return new Gl(e,t,n,r)}function ql(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Jl(e){if(typeof e==`function`)return ql(e)?1:0;if(e!=null){if(e=e.$$typeof,e===te)return 11;if(e===A)return 14}return 2}function Yl(e,t){var n=e.alternate;return n===null?(n=Kl(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&14680064,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function Xl(e,t,n,i,a,o){var s=2;if(i=e,typeof e==`function`)ql(e)&&(s=1);else if(typeof e==`string`)s=5;else a:switch(e){case w:return Zl(n.children,a,o,t);case ee:s=8,a|=8;break;case T:return e=Kl(12,n,t,a|2),e.elementType=T,e.lanes=o,e;case O:return e=Kl(13,n,t,a),e.elementType=O,e.lanes=o,e;case k:return e=Kl(19,n,t,a),e.elementType=k,e.lanes=o,e;case M:return Ql(n,a,o,t);default:if(typeof e==`object`&&e)switch(e.$$typeof){case E:s=10;break a;case D:s=9;break a;case te:s=11;break a;case A:s=14;break a;case j:s=16,i=null;break a}throw Error(r(130,e==null?e:typeof e,``))}return t=Kl(s,n,t,a),t.elementType=e,t.type=i,t.lanes=o,t}function Zl(e,t,n,r){return e=Kl(7,e,r,t),e.lanes=n,e}function Ql(e,t,n,r){return e=Kl(22,e,r,t),e.elementType=M,e.lanes=n,e.stateNode={isHidden:!1},e}function $l(e,t,n){return e=Kl(6,e,null,t),e.lanes=n,e}function eu(e,t,n){return t=Kl(4,e.children===null?[]:e.children,e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function tu(e,t,n,r,i){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Lt(0),this.expirationTimes=Lt(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Lt(0),this.identifierPrefix=r,this.onRecoverableError=i,this.mutableSourceEagerHydrationData=null}function nu(e,t,n,r,i,a,o,s,c){return e=new tu(e,t,n,s,c),t===1?(t=1,!0===a&&(t|=8)):t=0,a=Kl(3,null,null,t),e.current=a,a.stateNode=e,a.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},eo(a),e}function ru(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:C,key:r==null?null:``+r,children:e,containerInfo:t,implementation:n}}function iu(e){if(!e)return Gi;e=e._reactInternals;a:{if(I(e)!==e||e.tag!==1)throw Error(r(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break a;case 1:if(Xi(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break a}}t=t.return}while(t!==null);throw Error(r(171))}if(e.tag===1){var n=e.type;if(Xi(n))return $i(e,n,t)}return t}function au(e,t,n,r,i,a,o,s,c){return e=nu(n,r,!0,e,i,a,o,s,c),e.context=iu(null),n=e.current,r=pl(),i=ml(n),a=no(r,i),a.callback=t??null,ro(n,a,i),e.current.lanes=i,Rt(e,i,r),gl(e,r),e}function ou(e,t,n,r){var i=t.current,a=pl(),o=ml(i);return n=iu(n),t.context===null?t.context=n:t.pendingContext=n,t=no(a,o),t.payload={element:e},r=r===void 0?null:r,r!==null&&(t.callback=r),e=ro(i,t,o),e!==null&&(hl(e,i,o,a),io(e,i,o)),o}function su(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function cu(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function lu(e,t){cu(e,t),(e=e.alternate)&&cu(e,t)}function uu(){return null}var du=typeof reportError==`function`?reportError:function(e){console.error(e)};function fu(e){this._internalRoot=e}pu.prototype.render=fu.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(r(409));ou(e,t,null,null)},pu.prototype.unmount=fu.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;wl(function(){ou(null,e,null,null)}),t[Pi]=null}};function pu(e){this._internalRoot=e}pu.prototype.unstable_scheduleHydration=function(e){if(e){var t=Gt();e={blockedOn:null,target:e,priority:t};for(var n=0;n<en.length&&t!==0&&t<en[n].priority;n++);en.splice(n,0,e),n===0&&on(e)}};function mu(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function hu(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==` react-mount-point-unstable `))}function gu(){}function _u(e,t,n,r,i){if(i){if(typeof r==`function`){var a=r;r=function(){var e=su(o);a.call(e)}}var o=au(t,r,e,0,null,!1,!1,``,gu);return e._reactRootContainer=o,e[Pi]=o.current,ci(e.nodeType===8?e.parentNode:e),wl(),o}for(;i=e.lastChild;)e.removeChild(i);if(typeof r==`function`){var s=r;r=function(){var e=su(c);s.call(e)}}var c=nu(e,0,!1,null,null,!1,!1,``,gu);return e._reactRootContainer=c,e[Pi]=c.current,ci(e.nodeType===8?e.parentNode:e),wl(function(){ou(t,c,n,r)}),c}function vu(e,t,n,r,i){var a=n._reactRootContainer;if(a){var o=a;if(typeof i==`function`){var s=i;i=function(){var e=su(o);s.call(e)}}ou(t,o,e,i)}else o=_u(n,t,e,i,r);return su(o)}Ht=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var n=jt(t.pendingLanes);n!==0&&(Bt(t,n|1),gl(t,R()),!(Z&6)&&(tl=R()+500,sa()))}break;case 13:wl(function(){var t=Qa(e,1);t!==null&&hl(t,e,1,pl())}),lu(e,1)}},Ut=function(e){if(e.tag===13){var t=Qa(e,134217728);t!==null&&hl(t,e,134217728,pl()),lu(e,134217728)}},Wt=function(e){if(e.tag===13){var t=ml(e),n=Qa(e,t);n!==null&&hl(n,e,t,pl()),lu(e,t)}},Gt=function(){return z},Kt=function(e,t){var n=z;try{return z=e,t()}finally{z=n}},He=function(e,t,n){switch(t){case`input`:if(ye(e,n),t=n.name,n.type===`radio`&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll(`input[name=`+JSON.stringify(``+t)+`][type="radio"]`),t=0;t<n.length;t++){var i=n[t];if(i!==e&&i.form===e.form){var a=Vi(i);if(!a)throw Error(r(90));me(i),ye(i,a)}}}break;case`textarea`:Ee(e,n);break;case`select`:t=n.value,t!=null&&Ce(e,!!n.multiple,t,!1)}},Je=Cl,Ye=wl;var yu={usingClientEntryPoint:!1,Events:[zi,Bi,Vi,Ke,qe,Cl]},bu={findFiberByHostInstance:Ri,bundleType:0,version:`18.3.1`,rendererPackageName:`react-dom`},xu={bundleType:bu.bundleType,version:bu.version,rendererPackageName:bu.rendererPackageName,rendererConfig:bu.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:x.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=ut(e),e===null?null:e.stateNode},findFiberByHostInstance:bu.findFiberByHostInstance||uu,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:`18.3.1-next-f1338f8080-20240426`};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`){var Su=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Su.isDisabled&&Su.supportsFiber)try{St=Su.inject(xu),Ct=Su}catch{}}e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=yu,e.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!mu(t))throw Error(r(200));return ru(e,t,null,n)},e.createRoot=function(e,t){if(!mu(e))throw Error(r(299));var n=!1,i=``,a=du;return t!=null&&(!0===t.unstable_strictMode&&(n=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onRecoverableError!==void 0&&(a=t.onRecoverableError)),t=nu(e,1,!1,null,null,n,!1,i,a),e[Pi]=t.current,ci(e.nodeType===8?e.parentNode:e),new fu(t)},e.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render==`function`?Error(r(188)):(e=Object.keys(e).join(`,`),Error(r(268,e)));return e=ut(t),e=e===null?null:e.stateNode,e},e.flushSync=function(e){return wl(e)},e.hydrate=function(e,t,n){if(!hu(t))throw Error(r(200));return vu(null,e,t,!0,n)},e.hydrateRoot=function(e,t,n){if(!mu(e))throw Error(r(405));var i=n!=null&&n.hydratedSources||null,a=!1,o=``,s=du;if(n!=null&&(!0===n.unstable_strictMode&&(a=!0),n.identifierPrefix!==void 0&&(o=n.identifierPrefix),n.onRecoverableError!==void 0&&(s=n.onRecoverableError)),t=au(t,null,e,1,n??null,a,!1,o,s),e[Pi]=t.current,ci(e),i)for(e=0;e<i.length;e++)n=i[e],a=n._getVersion,a=a(n._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[n,a]:t.mutableSourceEagerHydrationData.push(n,a);return new pu(t)},e.render=function(e,t,n){if(!hu(t))throw Error(r(200));return vu(null,e,t,!1,n)},e.unmountComponentAtNode=function(e){if(!hu(e))throw Error(r(40));return e._reactRootContainer?(wl(function(){vu(null,null,e,!1,function(){e._reactRootContainer=null,e[Pi]=null})}),!0):!1},e.unstable_batchedUpdates=Cl,e.unstable_renderSubtreeIntoContainer=function(e,t,n,i){if(!hu(n))throw Error(r(200));if(e==null||e._reactInternals===void 0)throw Error(r(38));return vu(e,t,n,!1,i)},e.version=`18.3.1-next-f1338f8080-20240426`})),Fr=a(((e,t)=>{function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>`u`||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!=`function`))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=Pr()})),Ir=a((e=>{var t=Fr();e.createRoot=t.createRoot,e.hydrateRoot=t.hydrateRoot}))(),H=n(jr(),1),Lr=`https://github.com/visgl/luma.gl/tree/master`,Rr=420,zr=280,Br=160,Vr=20,Hr=12,Ur=10,Wr=30,Gr={boxSizing:`border-box`,width:420,minWidth:0,maxWidth:`100%`,overflow:`hidden`,zIndex:10},Kr=!0,qr=class extends fe{className=`luma-info-box-panel-container`;placement=`top-left`;infoBoxProps;hostElement=null;reactRoot=null;constructor(e){super({panel:e.panel,placement:`top-left`}),this.infoBoxProps=e}setInfoBoxProps(e){this.infoBoxProps=e,this.setProps({panel:e.panel})}renderReact(){return H.createElement(Jr,this.infoBoxProps)}onRenderHTML(e){this.hostElement!==e&&(this.reactRoot?.unmount(),this.hostElement=e,this.reactRoot=(0,Ir.createRoot)(e)),this.reactRoot?.render(this.renderReact())}onRemove(){this.reactRoot?.unmount(),this.reactRoot=null,this.hostElement=null}};function Jr(e){let t=e.appearance??`cinematic`,n=be[t],r=ei(e),i=H.useMemo(()=>ti(e),[e.directory,e.id,e.sourceDirectory,e.sourceFiles,e.sourcePath]),a=i.join(`|`),o=U(e.id,e.title),[s,c]=(0,H.useState)(()=>(e.initiallyCollapsed??Kr)||typeof window<`u`&&window.matchMedia(`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`).matches),[l,u]=(0,H.useState)(()=>e.extraTabs?.[0]?.id||`info`),[d,f]=(0,H.useState)(``),[p,m]=(0,H.useState)(null),[h,g]=(0,H.useState)(null),[_,v]=(0,H.useState)(null),y=(0,H.useRef)(null),b=(0,H.useRef)(null),x=(0,H.useRef)(null),S=(0,H.useRef)(null),[C,w]=(0,H.useState)(!1),ee=H.useId(),T=H.useCallback(e=>{y.current=e,e&&de(e,t)},[t]),E=()=>c(e=>!e),D=_?.key===a?_:null;(0,H.useEffect)(()=>{Kr=s},[s]),(0,H.useEffect)(()=>{if(l!==`source`||i.length===0||D)return;let t=new AbortController;return ri(e.websiteBaseUrl,i,t.signal).then(e=>{v({key:a,files:e}),f(e[0]?.path||``)}).catch(e=>{t.signal.aborted||v({key:a,error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>t.abort()},[l,D,e.websiteBaseUrl,i,a]),(0,H.useEffect)(()=>{let e=b.current;if(!e||i.length===0){w(!1);return}let t=()=>{w(!!e.querySelector(`[data-panel-tabs]`))};t();let n=new MutationObserver(t);return n.observe(e,{childList:!0,subtree:!0}),()=>n.disconnect()},[i.length]),(0,H.useEffect)(()=>{let n=x.current;if(!(!n||!e.panel))return ye(n,t),_e(n,e.panel),()=>_e(n,null)},[t,e.panel]),(0,H.useEffect)(()=>{let e=y.current;if(!e)return;let t=Yr(e),n=()=>{let t=Xr(e);g(e=>$r(e,t)?e:t),m(e=>e&&Qr(e,t))};n(),window.addEventListener(`resize`,n),window.addEventListener(`scroll`,n,{capture:!0,passive:!0});let r=typeof ResizeObserver>`u`?null:new ResizeObserver(n);return t&&r?.observe(t),()=>{window.removeEventListener(`resize`,n),window.removeEventListener(`scroll`,n,!0),r?.disconnect()}},[s]);let te=e=>{let t=y.current;if(!t)return;let n=t.getBoundingClientRect();S.current={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,startWidth:n.width,startHeight:n.height},e.currentTarget.setPointerCapture(e.pointerId),e.preventDefault()},O=e=>{let t=y.current,n=S.current;!t||!n||n.pointerId!==e.pointerId||m(Zr(t,n.startWidth+e.clientX-n.startX,n.startHeight+e.clientY-n.startY))},k=e=>{S.current?.pointerId===e.pointerId&&(S.current=null,e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId))},A=e=>{let t=y.current;if(!t)return;let n=e.shiftKey?Wr:Ur,r=e.key===`ArrowLeft`?-n:e.key===`ArrowRight`?n:0,i=e.key===`ArrowUp`?-n:e.key===`ArrowDown`?n:0;if(r===0&&i===0)return;let a=t.getBoundingClientRect();m(e=>Zr(t,(e?.width??a.width)+r,(e?.height??a.height)+i)),e.preventDefault()},j=D?.files?.find(e=>e.path===d)||D?.files?.[0],M=D?.error?H.createElement(`p`,{role:`alert`,style:{margin:0,padding:`12px 14px`,color:t===`cinematic`?`#fda4af`:`#be123c`,fontSize:12,lineHeight:1.5}},D.error):e.renderSource?e.renderSource(j?.source??`// Loading source…`,ii(j?.path)):H.createElement(`pre`,null,H.createElement(`code`,null,j?.source??`// Loading source…`));return H.createElement(`div`,{ref:T,className:`luma-example-infobox`,"data-info-box-appearance":t,"data-luma-info-box-collapsed":s?`true`:`false`,style:{...Gr,...e.style,display:`flex`,flexDirection:`column`,position:`relative`,width:p?.width??e.style?.width??Rr,height:s?void 0:p?.height??e.style?.height,maxWidth:h?.maxWidth??`100%`,maxHeight:s?void 0:h?.maxHeight}},H.createElement(`div`,{"data-luma-example-info-header":``,style:{display:`flex`,alignItems:`flex-start`,justifyContent:`space-between`,gap:12}},H.createElement(`button`,{type:`button`,"aria-label":s?`Expand info box`:`Collapse info box`,"aria-expanded":!s,"aria-controls":ee,onClick:E,style:{minWidth:0,flex:`1 1 auto`,padding:0,border:`none`,background:`transparent`,textAlign:`left`,cursor:`pointer`,color:`inherit`}},o?H.createElement(`span`,{style:{display:`flex`,alignItems:`center`,gap:8}},H.createElement(`span`,{"aria-hidden":`true`,style:{width:7,height:7,flex:`0 0 7px`,borderRadius:`50%`,background:`var(--luma-example-accent, ${n.accent})`,boxShadow:`0 0 12px var(--luma-example-accent, ${n.accent})`}}),H.createElement(`h3`,{"data-luma-example-title":``,style:{color:`inherit`,fontSize:22,fontWeight:600,letterSpacing:`-0.022em`,lineHeight:1.3,marginTop:0,marginBottom:0}},o)):null,e.subtitle?H.createElement(`div`,{"data-luma-example-subtitle":``,style:{color:`var(--luma-example-text-muted, ${n.textMuted})`,fontSize:12,lineHeight:1.4,marginTop:5,paddingLeft:o?15:0}},e.subtitle):null),H.createElement(`div`,{"data-luma-example-chrome-actions":``,style:{display:`flex`,alignItems:`center`,gap:8,flexShrink:0}},r?H.createElement(`a`,{"data-luma-example-chrome-action":``,"data-luma-example-source-link":``,href:r,target:`_blank`,rel:`noreferrer`,style:{display:`inline-flex`,alignItems:`center`,gap:5,minHeight:29,padding:`0 8px`,border:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:8,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,color:`var(--luma-example-text-muted, ${n.textMuted})`,fontSize:11,fontWeight:650,textDecoration:`none`}},H.createElement(`svg`,{"aria-hidden":`true`,viewBox:`0 0 16 16`,width:`13`,height:`13`},H.createElement(`path`,{d:`M8 1.5a6.5 6.5 0 0 0-2.06 12.67c.33.06.45-.14.45-.32v-1.13c-1.84.4-2.23-.79-2.23-.79-.3-.75-.73-.95-.73-.95-.6-.4.04-.4.04-.4.66.05 1 .68 1 .68.59 1 1.54.71 1.91.54.06-.43.23-.72.41-.89-1.46-.17-3-.72-3-3.24 0-.72.25-1.31.68-1.77-.07-.17-.3-.83.07-1.73 0 0 .56-.18 1.83.68a6.39 6.39 0 0 1 3.33 0c1.27-.86 1.83-.68 1.83-.68.36.9.13 1.56.06 1.73.43.46.69 1.05.69 1.77 0 2.53-1.54 3.07-3.01 3.23.24.21.45.62.45 1.25v1.85c0 .18.12.38.45.32A6.5 6.5 0 0 0 8 1.5Z`,fill:`currentColor`})),H.createElement(`span`,{"data-luma-example-source-label":``},`GitHub`)):null,H.createElement(`button`,{"data-luma-example-chrome-action":``,"data-luma-example-info-toggle":``,type:`button`,"aria-label":s?`Expand info box`:`Collapse info box`,"aria-expanded":!s,"aria-controls":ee,onClick:E,style:{flexShrink:0,border:`1px solid var(--luma-example-border, ${n.border})`,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,borderRadius:999,color:`var(--luma-example-text, ${n.text})`,minWidth:56,padding:`0 11px`,height:29,fontSize:11,fontWeight:650,lineHeight:1,whiteSpace:`nowrap`,cursor:`pointer`}},s?`Info`:`Hide`))),H.createElement(`div`,{id:ee,hidden:s,"aria-hidden":s,style:{marginTop:s?0:12,minWidth:0,minHeight:0,flex:`1 1 auto`,display:s?`none`:`flex`,flexDirection:`column`,overflowY:`auto`}},(i.length>0||e.extraTabs?.length)&&!C?H.createElement(`div`,{role:`tablist`,"aria-label":`Example information`,style:{display:`flex`,gap:5,marginBottom:12,paddingBottom:11,borderBottom:`1px solid var(--luma-example-border, ${n.border})`}},[...e.extraTabs||[],{id:`info`,label:`Info`},...i.length?[{id:`source`,label:`Source`}]:[]].map(e=>H.createElement(`button`,{"data-luma-example-chrome-action":``,key:e.id,type:`button`,role:`tab`,"aria-selected":l===e.id,onClick:()=>u(e.id),style:{border:l===e.id?`1px solid var(--luma-example-accent, ${n.accent})`:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:7,padding:`5px 10px`,background:l===e.id?`color-mix(in srgb, var(--luma-example-accent, ${n.accent}) 15%, var(--luma-example-surface-raised, ${n.surfaceRaised}))`:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,color:l===e.id?`var(--luma-example-accent, ${n.accent})`:`var(--luma-example-text-muted, ${n.textMuted})`,cursor:`pointer`,fontSize:11,fontWeight:l===e.id?700:500}},e.label))):null,e.extraTabs?.map(e=>H.createElement(`div`,{key:e.id,"data-luma-example-extra-tab":e.id,hidden:l!==e.id,"aria-hidden":l!==e.id,style:{minWidth:0,minHeight:0,flex:`1 1 auto`,overflow:`auto`}})),H.createElement(`div`,{ref:b,"data-luma-example-info-content":``,hidden:!C&&l!==`info`,"aria-hidden":!C&&l!==`info`,style:{minWidth:0,minHeight:0,flex:`1 1 auto`,overflow:`auto`}},e.html?H.createElement(`div`,{dangerouslySetInnerHTML:{__html:e.html}}):null,e.children,e.panel?H.createElement(`div`,{ref:x}):null),i.length>0&&!C?H.createElement(`div`,{"data-luma-example-source":``,hidden:l!==`source`,"aria-hidden":l!==`source`,style:{border:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:9,minWidth:0,minHeight:0,flex:`1 1 auto`,maxWidth:`100%`,overflow:`auto`,background:`var(--luma-example-surface, ${n.surface})`,color:`var(--luma-example-text, ${n.text})`,colorScheme:t===`cinematic`?`dark`:`light`}},D?.files&&D.files.length>0?H.createElement(`div`,{role:`tablist`,"aria-label":`Example source files`,style:{alignItems:`center`,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,borderBottom:`1px solid var(--luma-example-border, ${n.border})`,display:`flex`,gap:5,overflowX:`auto`,padding:`8px 9px`}},D.files.map(e=>H.createElement(`button`,{"data-luma-example-chrome-action":``,key:e.path,type:`button`,role:`tab`,"aria-selected":e.path===j?.path,onClick:()=>f(e.path),style:{background:e.path===j?.path?`var(--luma-example-surface, ${n.surface})`:`transparent`,border:e.path===j?.path?`1px solid var(--luma-example-accent, ${n.accent})`:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:6,color:e.path===j?.path?`var(--luma-example-text, ${n.text})`:`var(--luma-example-text-muted, ${n.textMuted})`,cursor:`pointer`,fontSize:11,fontWeight:e.path===j?.path?700:500,padding:`5px 8px`,whiteSpace:`nowrap`}},e.path.split(`/`).at(-1))),e.stackBlitz?H.createElement(`button`,{"data-luma-example-chrome-action":``,type:`button`,onClick:()=>void ai(o,D.files||[]),style:{background:`color-mix(in srgb, var(--luma-example-accent, ${n.accent}) 18%, var(--luma-example-surface, ${n.surface}))`,border:`1px solid var(--luma-example-accent, ${n.accent})`,borderRadius:6,color:`var(--luma-example-accent, ${n.accent})`,cursor:`pointer`,fontSize:11,fontWeight:700,marginLeft:`auto`,padding:`5px 9px`,whiteSpace:`nowrap`}},`Edit in StackBlitz`):null):null,M):null),s?null:H.createElement(`button`,{"data-luma-example-chrome-action":``,type:`button`,"aria-label":`Resize info box`,title:`Resize info box`,onPointerDown:te,onPointerMove:O,onPointerUp:k,onPointerCancel:k,onKeyDown:A,style:{position:`absolute`,right:6,bottom:6,zIndex:100,display:`grid`,placeItems:`center`,width:28,height:28,padding:0,border:`1px solid var(--luma-example-border, ${n.border})`,borderRadius:7,background:`var(--luma-example-surface-raised, ${n.surfaceRaised})`,boxShadow:`0 4px 12px rgba(2, 6, 23, 0.18)`,color:`var(--luma-example-text-muted, ${n.textMuted})`,cursor:`nwse-resize`,fontSize:19,lineHeight:1,touchAction:`none`,userSelect:`none`}},H.createElement(`svg`,{"aria-hidden":`true`,viewBox:`0 0 16 16`,width:`16`,height:`16`},H.createElement(`path`,{d:`M4 14L14 4M9 14L14 9M13 14L14 13`,fill:`none`,stroke:`currentColor`,strokeLinecap:`round`,strokeWidth:`1.75`}))))}function Yr(e){return e.closest(`[data-luma-example-page]`)}function Xr(e){let t=e.getBoundingClientRect(),n=window.innerWidth||document.documentElement.clientWidth,r=window.innerHeight||document.documentElement.clientHeight,i=Yr(e)?.getBoundingClientRect(),a=Math.min(n,i?.right??n),o=Math.min(r,i?.bottom??r),s=Math.max(1,a-t.left-Vr),c=Math.max(1,o-t.top-Hr);return{minWidth:Math.min(zr,s),minHeight:Math.min(Br,c),maxWidth:s,maxHeight:c}}function Zr(e,t,n){return Qr({width:t,height:n},Xr(e))}function Qr(e,t){let{minWidth:n,minHeight:r,maxWidth:i,maxHeight:a}=t;return{width:Math.min(i,Math.max(n,e.width)),height:Math.min(a,Math.max(r,e.height))}}function $r(e,t){return e!==null&&e.minWidth===t.minWidth&&e.minHeight===t.minHeight&&e.maxWidth===t.maxWidth&&e.maxHeight===t.maxHeight}function ei(e){return e.sourcePath?`${Lr}/${e.sourcePath}`:e.id&&(e.sourceDirectory||e.directory)?`${Lr}/examples/${e.sourceDirectory||e.directory}/${e.id}`:null}function ti(e){if(e.sourceFiles&&e.sourceFiles.length>0){let t=ni(e);return t?e.sourceFiles.map(e=>`${t}/${e}`):e.sourceFiles}if(e.sourcePath){let t=e.sourcePath.replace(/^\/?examples\//,``).replace(/^\//,``);return/\.(?:[cm]?[jt]sx?)$/.test(t)?[t]:[`${t}/app.ts`,`${t}/app.tsx`,`${t}/index.html`,`${t}/package.json`]}if(e.id&&(e.sourceDirectory||e.directory)){let t=e.sourceDirectory||e.directory;return[`${t}/${e.id}/app.ts`,`${t}/${e.id}/app.tsx`,`${t}/${e.id}/index.html`,`${t}/${e.id}/package.json`]}return[]}function ni(e){return e.sourcePath?e.sourcePath.replace(/^\/?examples\//,``).replace(/^\//,``):e.id&&(e.sourceDirectory||e.directory)?`${e.sourceDirectory||e.directory}/${e.id}`:null}async function ri(e,t,n){let r=[];for(let i of t){let t=await fetch(`${e}example-assets/${i}`,{signal:n});t.ok&&r.push({path:i,source:await t.text()})}if(r.length===0)throw Error(`Unable to load source code.`);return r}function ii(e){return e?.endsWith(`.tsx`)?`tsx`:e?.endsWith(`.html`)?`html`:e?.endsWith(`.json`)?`json`:`typescript`}async function ai(e,t){let{default:n}=await b(async()=>{let{default:e}=await import(`./sdk.m-B8qHt2Tp.js`);return{default:e}},[]),r=Object.fromEntries(t.map(e=>[e.path.split(`/`).at(-1)||e.path,e.source]));await n.openProject({title:`luma.gl: ${e}`,description:`Runnable luma.gl example from the official documentation.`,template:`node`,files:r},{newWindow:!0,openFile:r[`app.tsx`]?`app.tsx`:`app.ts`,startScript:`start`})}function U(e,t){return t||(e?e.split(`-`).map(oi).join(` `):``)}function oi(e){return e.charAt(0).toUpperCase()+e.slice(1)}function si(e,t){let n=document.querySelector(`#info`);de(n,`cinematic`);let r=new Se({parentElement:n});return r.setProps({components:[new qr({title:`Domino Junction`,subtitle:`GPU physics with Three.js`,appearance:`cinematic`,websiteBaseUrl:`/`,panel:he({id:`domino-course-tabs`,theme:`dark`,panels:[ue({id:`domino-course-settings`,title:`Settings`,html:``,onRender:t=>(ye(t,`cinematic`),e.hidden=!1,t.append(e),()=>{e.hidden=!0,document.body.append(e)})}),ue({id:`domino-course-info`,title:`Info`,html:`<p>The first tile starts two branches. Either branch can tip the gold receiver and start the finish.</p><p>luma.gl simulates contact and motion. Three.js renders the published GPU poses on the same WebGPU device. Drag to orbit or scroll to zoom.</p>`,onRender:e=>ye(e,`cinematic`)}),t.inspectorPanel.panel,t.tracePanel.panel]})})]}),r.onRedraw({viewports:[],layers:[]}),()=>{r.finalize(),t.clear()}}var ci=1.35,li=.64,ui=.22,di=[`#e9e5d8`,`#008b81`,`#d63713`,`#cf9000`],fi=[13,.25,13];function pi(){let e=[{mass:0,position:[0,-.25,0],shape:{type:`box`,halfExtents:fi}}],t=[];function n(n,r,i,a){let o=Math.PI/2-i;t.push({body:e.length,width:li,color:di[a]}),e.push({position:[n,ci/2,r],orientation:[0,Math.sin(o/2),0,Math.cos(o/2)],mass:1,friction:.65,restitution:.02,shape:{type:`box`,halfExtents:[li/2,ci/2,ui/2]}})}for(let e=0;e<7;e++)n(-11.2+e*.62,0,0,0);n(-6.86,0,0,0);let r=[];for(let[t,i]of[-1,1].entries()){let a=[];for(let r=0;r<=19;r++){let o=r/19,s=-6.24+11.78*o,c=i*(.34+2.65*Math.sin(Math.PI*o)**2),l=i*2.65*Math.PI*Math.sin(2*Math.PI*o)/11.78;a.push(e.length),n(s,c,Math.atan(l),t+1)}r.push(a)}let i=e.length;n(6.16,0,0,3);for(let e=1;e<=8;e++)n(6.16+e*.62,0,0,3);return{bodies:e,tiles:t,branches:r,join:i,finish:e.length-1}}var mi=document.querySelector(`#course`),hi=document.querySelector(`#start`),gi=document.querySelector(`#reset`),_i=document.querySelector(`#status`),vi=1/120,yi=1.35,bi=`
@group(0) @binding(0) var<storage, read> matrices: array<mat4x4f>;
@group(0) @binding(1) var<storage, read_write> firstColumn: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> secondColumn: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> thirdColumn: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> fourthColumn: array<vec4f>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= arrayLength(&firstColumn)) { return; }
  let pose = matrices[index + 1u]; // The static table is body zero.
  firstColumn[index] = pose[0];
  secondColumn[index] = pose[1];
  thirdColumn[index] = pose[2];
  fourthColumn[index] = pose[3];
}`;async function xi(){let e=await C.createDevice({type:`webgpu`,adapters:[ce],optionalFeatures:[`timestamp-query`]});if(!(e instanceof se))throw Error(`Domino Junction requires WebGPU`);let t=new ne({canvas:mi,device:e.handle,antialias:!0});await t.init();let n=pi(),r=new Or({bodies:n.bodies,publishPoses:!0,gravity:[0,-9.81,0],timeStep:vi,iterations:16,maximumPairs:1024,solver:`parallel`,broadPhase:`hierarchical-grid`,failurePolicy:`rollback`}),i=new pe(e);r.addToGraph(i);let a=await i.compileAsync(),o=new xe,s=si(document.querySelector(`#course-controls`),o),c=r.createGPUCheckpoint();c.save();let l=new Ce(e,t),u=Array.from({length:4},()=>e.createBuffer({byteLength:n.tiles.length*16,usage:P.VERTEX|P.STORAGE})),d=e.createShader({stage:`compute`,source:bi}),f=e.createComputePipeline({shader:d,shaderLayout:{bindings:[{name:`matrices`,type:`read-only-storage`,group:0,location:0},{name:`firstColumn`,type:`storage`,group:0,location:1},{name:`secondColumn`,type:`storage`,group:0,location:2},{name:`thirdColumn`,type:`storage`,group:0,location:3},{name:`fourthColumn`,type:`storage`,group:0,location:4}]}}),p=new j(li,ci,ui),m=new te;m.index=p.index;for(let e of[`position`,`normal`])m.setAttribute(e,p.getAttribute(e));m.instanceCount=n.tiles.length;for(let[e,t]of u.entries())m.setAttribute(`poseColumn${e}`,l.createInstancedAttribute(t,4,n.tiles.length));let h=new Float32Array(n.tiles.length*3),g=new Float32Array(n.tiles.length);for(let[e,t]of n.tiles.entries())h.set(new A(t.color).toArray(),e*3),g[e]=t.width/li;m.setAttribute(`tileTint`,new S(h,3)),m.setAttribute(`tileWidth`,new S(g,1));let _=ee(re(`poseColumn0`,`vec4`),re(`poseColumn1`,`vec4`),re(`poseColumn2`,`vec4`),re(`poseColumn3`,`vec4`)),b=re(`tileWidth`,`float`),ie=new O({roughness:.42,metalness:.12});ie.colorNode=re(`tileTint`,`vec3`),ie.positionNode=_.mul(E(v.x.mul(b),v.yz,1)).xyz,ie.normalNode=M(_.mul(E(D,0)).xyz).normalize();let ae=new T;ae.background=new A(`#111820`);let oe=new k(m,ie);oe.frustumCulled=!1;let ue=new k(new j(fi[0]*2,fi[1]*2,fi[2]*2),new N({color:`#233745`,roughness:.9}));ue.position.y=-.25;let de=new w(`#fff4e7`,2);de.position.set(-5,12,7),ae.add(oe,ue,de,new y(`#e2f6ff`,`#28252b`,1.2));let fe=new x(-14,14,7,-7,.1,100);fe.position.set(0,23,15);let me=new le(fe,mi);me.enableDamping=!0,me.target.set(0,0,0),me.minZoom=.6,me.maxZoom=3;let he=()=>{let e=mi.clientWidth/Math.max(1,mi.clientHeight),n=Math.max(14.5,13.5*e);fe.left=-n,fe.right=n,fe.top=n/e,fe.bottom=-fe.top,fe.updateProjectionMatrix(),t.setPixelRatio(Math.min(2,window.devicePixelRatio)),t.setSize(mi.clientWidth,mi.clientHeight,!1)},ge=new ResizeObserver(he);ge.observe(mi),he();let _e=!1,ve=0,ye=0,be,Se=!0;hi.disabled=!1,gi.disabled=!1,_i.textContent=`Ready`,hi.onclick=()=>{r.applyImpulse(1,[.95,0,0],[-11.2,ci*.9,0]),hi.disabled=!0,_e=!0,_i.textContent=`Dominoes in motion`},gi.onclick=()=>{c.restore(),_e=!1,ve=0,ye=0,Se=!0,hi.disabled=!1,_i.textContent=`Ready`},t.setAnimationLoop(i=>{let s=be===void 0?0:Math.min((i-be)/1e3*yi,6*vi);if(be=i,_e&&(ye+=s),Se||ye>=vi){let t=e.createCommandEncoder();for(;ye>=vi;)o.encode(a,t,{parameters:void 0}),ye-=vi,ve+=vi;let i=t.beginComputePass();i.setPipeline(f),i.setBindings({matrices:r.poseMatrices,firstColumn:u[0],secondColumn:u[1],thirdColumn:u[2],fourthColumn:u[3]}),i.dispatch(Math.ceil(n.tiles.length/64)),i.end(),e.submit(t.finish()),Se=!1}ve>=12&&(_e=!1,ye=0,_i.textContent=`Run complete`),me.update(),t.render(ae,fe)}),window.addEventListener(`pagehide`,n=>{if(!n.persisted){t.setAnimationLoop(null),ge.disconnect(),s(),me.dispose(),m.dispose(),p.dispose(),ie.dispose(),ue.geometry.dispose(),ue.material.dispose(),l.dispose(),c.destroy(),a.destroy(),r.destroy(),f.destroy(),d.destroy();for(let e of u)e.destroy();t.dispose(),e.destroy()}},{once:!0})}xi().catch(e=>{_i.textContent=e instanceof Error?e.message:String(e)});