import{y as e}from"./gpu-vector-chunks-C_IqND_x.js";import{t}from"./computation-BazHRsEW.js";var n=65535;function r(e,t){let n=o(t),r=Math.max(1,Math.ceil(e)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),s=Math.ceil(r/i/a);if(s>n)throw Error(`WebGPU dispatch requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:s}}function i(e,t=`workgroupId`){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function a(e,t,n=`workgroupId`,r=`localId`){return`(${i(e,n)} * ${t}u + ${r}.x)`}function o(e){return Number.isFinite(e)&&e>0?Math.floor(e):n}function s(e,t){switch(e){case`u32`:return`${t}u`;case`f32`:return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function c(e,t){switch(e){case`uint32`:return s(`u32`,Math.trunc(t));case`sint32`:return`${Math.trunc(t)}`;case`float32`:return s(`f32`,t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function l(e){switch(e){case`uint32`:return`0u`;case`sint32`:return`0`;case`float32`:return`0.0`;default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function u(e){switch(e){case`uint32`:return`u32`;case`sint32`:return`i32`;case`float32`:return`f32`;default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}var d=64,f=`GPGPU Operation Counts`,p=`Computation Runs`,m=new e;function h(e){return!e.isConstant||!e.value}function g({scope:e,module:n,elementWise:i=!1,expression:o,inputs:s,output:c,operationType:l=c.type,outputBuffer:g}){if(!n.source)throw Error(`WebGPU computation ${n.name} requires WGSL source`);let C=S(s),T=C.map(([e,t])=>({name:e,input:t})),E=T.filter(({input:e})=>h(e)).map((e,t)=>({...e,index:t})),D=u(l),O=u(c.type),k={TYPE:D,RESULT_LEN:c.size.toString()},A=r(Math.ceil(c.length/d),g.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of C)k[`${e.toUpperCase()}_LEN`]=t.size.toString();let j=`
${w(n.source,k)}
${E.map(({name:e,input:t,index:n})=>_(e,t,n)).join(`
`)}
${T.map(({name:e,input:t})=>v(e,t,l)).join(`
`)}
${y(c,E.length)}
${b(c)}

@compute @workgroup_size(${d}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${a(A,d)};
  if (rowIndex >= ${c.length}u) {
    return;
  }

${T.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join(`
`)}
  var result: array<${O}, ${c.size}>;
${x(n.name,C,c,i,o)}
  write_result(rowIndex, result);
}
`,M=new t(g.device,{source:j,modules:n.dependencies,shaderAssembler:m,shaderLayout:{bindings:[...E.map(({name:e},t)=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:E.length}]}});e&&e.retain(()=>M.destroy());let N=Object.fromEntries(E.map(({name:e,input:t})=>[e,t.buffer]));N.result=g,M.setBindings(N);let P=e?e.commandEncoder.beginComputePass({}):g.device.beginComputePass({});g.device.statsManager.getStats(f).get(p).incrementCount(),M.dispatch(P,A.x,A.y,A.z),P.end(),e||(g.device.submit(),M.destroy())}function _(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${u(t.type)}>;`}function v(e,t,n){let r=u(n),i=t.type===n?``:r,a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT;return h(t)?`fn read_${e}(rowIndex: u32) -> array<${r}, ${t.size}> {
  var value: array<${r}, ${t.size}>;
  let rowOffset = ${o}u + ${t.isConstant?`0u`:`rowIndex`} * ${a}u;
${Array.from({length:t.size},(t,n)=>i?`  value[${n}] = ${i}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`:`fn read_${e}(_rowIndex: u32) -> array<${r}, ${t.size}> {
  return array<${r}, ${t.size}>(${C(t,i)});
}`}function y(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${u(e.type)}>;`}function b(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${u(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function x(e,t,n,r,i){let a=``;if(i)for(let e=0;e<n.size;e++)a+=`  result[${e}] = ${i(e)};\n`;else if(r){let r=l(n.type),i=u(n.type);for(let o=0;o<n.size;o++){let n=t.map(([e,t])=>o<t.size?u(t.type)===i?`${e}[${o}]`:`${i}(${e}[${o}])`:r);a+=`  result[${o}] = ${e}(${n.join(`, `)});\n`}}else a+=`result = ${e}(${t.map(([e])=>e).join(`, `)});`;return a.trimEnd()}function S(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function C(e,t){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>s(t,n[r]??0)).join(`, `)}function w(e,t){for(let n in t)e=e.replaceAll(`{${n}}`,t[n]);return e}var T=({inputs:e,output:t,target:n,scope:r})=>{let i=e.map((e,t)=>[`x${t}`,e]);E(n.device.limits,i);let a=i.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(`, `),o=0;return g({scope:r,module:{name:`interleave`,source:`\
fn interleave(${a}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${i.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  out[${o+n}] = ${e}[${n}];`).join(`
`);return o+=t.size,n}).join(`
`)}
  return out;
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function E(e,t){let n=t.filter(([,e])=>h(e)).length+1;if(n>e.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${n} storage buffers, exceeding device limit ${e.maxStorageBuffersPerShaderStage}`);if(n>e.maxBindingsPerBindGroup)throw Error(`interleave() requires ${n} bindings, exceeding bind group limit ${e.maxBindingsPerBindGroup}`)}T.supportsEvaluationScope=!0;export{u as a,a as c,s as i,i as l,g as n,l as o,c as r,r as s,T as t};