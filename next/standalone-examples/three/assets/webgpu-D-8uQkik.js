import{t as e}from"./get-platform-info-C3Ar5QsY.js";import{t}from"./wgsl-shader-assembler-CqcoDROr.js";import{a as n,n as r,r as i,s as a,t as o}from"./expression-9sFPax2z.js";import{n as s}from"./gpu-vector-chunks-C-q5S9Cy.js";import{t as c}from"./kernel-B1TEgo51.js";var l=65535;function u(e,t){let n=p(t),r=Math.max(1,Math.ceil(e)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`WebGPU dispatch requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function d(e,t=`workgroupId`){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function f(e,t,n=`workgroupId`,r=`localId`){return`(${d(e,n)} * ${t}u + ${r}.x)`}function p(e){return Number.isFinite(e)&&e>0?Math.floor(e):l}function m(e,t){switch(e){case`u32`:return`${t}u`;case`f32`:return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function h(e,t){switch(e){case`uint32`:return m(`u32`,Math.trunc(t));case`sint32`:return`${Math.trunc(t)}`;case`float32`:return m(`f32`,t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function g(e){switch(e){case`uint32`:return`0u`;case`sint32`:return`0`;case`float32`:return`0.0`;default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function _(e){switch(e){case`uint32`:return`u32`;case`sint32`:return`i32`;case`float32`:return`f32`;default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}var v=64,y=`GPGPU Operation Counts`,b=`Computation Runs`,x=new t;function S(e){return!e.isConstant||!e.value}function C({scope:t,module:n,elementWise:r=!1,expression:i,inputs:a,output:o,operationType:s=o.type,outputBuffer:l}){if(!n.source)throw Error(`WebGPU kernel ${n.name} requires WGSL source`);let d=ie(a),p=d.map(([e,t])=>({name:e,input:t})),m=p.filter(({input:e})=>S(e)).map((e,t)=>({...e,index:t})),h=_(s),g=_(o.type),C={TYPE:h,RESULT_LEN:o.size.toString()},T=u(Math.ceil(o.length/v),l.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of d)C[`${e.toUpperCase()}_LEN`]=t.size.toString();let E=`
${ae(n.source,C)}
${m.map(({name:e,input:t,index:n})=>ee(e,t,n)).join(`
`)}
${p.map(({name:e,input:t})=>te(e,t,s)).join(`
`)}
${ne(o,m.length)}
${re(o)}

@compute @workgroup_size(${v}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${f(T,v)};
  if (rowIndex >= ${o.length}u) {
    return;
  }

${p.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join(`
`)}
  var result: array<${g}, ${o.size}>;
${w(n.name,d,o,r,i)}
  write_result(rowIndex, result);
}
`,D=x.assembleWGSLShader({platformInfo:e(l.device),source:E,modules:n.dependencies,shaderStage:`compute`,scanVertexAttributes:!1}),O=new c(l.device,{source:D.source,shaderLayout:{bindings:[...m.map(({name:e},t)=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:m.length}]}});t&&t.retain(()=>O.destroy());let k=Object.fromEntries(m.map(({name:e,input:t})=>[e,t.buffer]));k.result=l;let A=t?t.commandEncoder.beginComputePass({}):l.device.beginComputePass({});l.device.statsManager.getStats(y).get(b).incrementCount(),O.dispatch(A,{bindings:k,...T}),A.end(),t||(l.device.submit(),O.destroy())}function ee(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${_(t.type)}>;`}function te(e,t,n){let r=_(n),i=t.type===n?``:r,a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT;return S(t)?`fn read_${e}(rowIndex: u32) -> array<${r}, ${t.size}> {
  var value: array<${r}, ${t.size}>;
  let rowOffset = ${o}u + ${t.isConstant?`0u`:`rowIndex`} * ${a}u;
${Array.from({length:t.size},(t,n)=>i?`  value[${n}] = ${i}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`:`fn read_${e}(_rowIndex: u32) -> array<${r}, ${t.size}> {
  return array<${r}, ${t.size}>(${T(t,i)});
}`}function ne(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${_(e.type)}>;`}function re(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${_(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function w(e,t,n,r,i){let a=``;if(i)for(let e=0;e<n.size;e++)a+=`  result[${e}] = ${i(e)};\n`;else if(r){let r=g(n.type),i=_(n.type);for(let o=0;o<n.size;o++){let n=t.map(([e,t])=>o<t.size?_(t.type)===i?`${e}[${o}]`:`${i}(${e}[${o}])`:r);a+=`  result[${o}] = ${e}(${n.join(`, `)});\n`}}else a+=`result = ${e}(${t.map(([e])=>e).join(`, `)});`;return a.trimEnd()}function ie(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function T(e,t){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>m(t,n[r]??0)).join(`, `)}function ae(e,t){for(let n in t)e=e.replaceAll(`{${n}}`,t[n]);return e}var E=`fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x + y;
}

fn arithmetic_subtract(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x - y;
}

fn arithmetic_multiply(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x * y;
}

fn arithmetic_divide(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x / y;
}

fn arithmetic_tan(x: f32) -> f32 {
  return tan_fp32(x);
}
`,D=({inputs:e,output:t,target:n,scope:i})=>{let s=t.type,c=_(s),l=g(s),u=e.namedInputs;return C({scope:i,module:{name:`arithmetic`,source:E,dependencies:[a]},inputs:u,output:t,operationType:s,outputBuffer:n,expression:t=>o(e.expression,{operations:r,inputs:u,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>u[e].size===1?`${e}[0]`:l,formatLiteral:e=>`${c}(${h(s,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}};D.supportsEvaluationScope=!0;var O=64,k=`GPGPU Operation Counts`,A=`Computation Runs`,oe=async({inputs:e,output:t,target:n})=>{let r=Math.ceil(t.byteLength/4),i=new c(n.device,{source:j(e,t.length),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}}),a={source:e.source.buffer,result:n};if(r>0){let e=n.device.beginComputePass({});n.device.statsManager.getStats(k).get(A).incrementCount(),i.dispatch(e,{bindings:a,x:Math.ceil(r/O)}),e.end(),n.device.submit()}return i.destroy(),{success:!0}};function j(e,t){let n=s(e.inputFormat),r=s(e.outputFormat),i=n.components,a=t*i,o=r.elementByteLength/r.components,c=4/o;return`\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  return (word >> ((byteIndex % 4u) * 8u)) & 0xffu;
}

fn readUint16(byteIndex: u32) -> u32 {
  return readByte(byteIndex) | (readByte(byteIndex + 1u) << 8u);
}

fn readSourceValue(scalarIndex: u32) -> f32 {
  let rowIndex = scalarIndex / ${i}u;
  let componentIndex = scalarIndex % ${i}u;
  let byteIndex = ${e.source.offset}u + rowIndex * ${e.source.stride}u +
    componentIndex * ${n.elementByteLength/i}u;
  ${M(n.signedDataType,n.normalized)}
}

${N(e.outputFormat)}

@compute @workgroup_size(${O}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let wordIndex = id.x;
  let firstScalarIndex = wordIndex * ${c}u;
  if (firstScalarIndex >= ${a}u) {
    return;
  }
  ${se(r.signedDataType,o,a)}
}
`}function M(e,t){switch(e){case`float32`:return`return bitcast<f32>(source[byteIndex / 4u]);`;case`float16`:return`let values = unpack2x16float(source[byteIndex / 4u]);
  return select(values.x, values.y, byteIndex % 4u == 2u);`;case`uint8`:return t?`return f32(readByte(byteIndex)) / 255.0;`:`return f32(readByte(byteIndex));`;case`sint8`:return t?`return max(f32(i32(readByte(byteIndex) << 24u) >> 24) / 127.0, -1.0);`:`return f32(i32(readByte(byteIndex) << 24u) >> 24);`;case`uint16`:return t?`return f32(readUint16(byteIndex)) / 65535.0;`:`return f32(readUint16(byteIndex));`;case`sint16`:return t?`return max(f32(i32(readUint16(byteIndex) << 16u) >> 16) / 32767.0, -1.0);`:`return f32(i32(readUint16(byteIndex) << 16u) >> 16);`;case`uint32`:return t?`return f32(source[byteIndex / 4u]) / 4294967295.0;`:`return f32(source[byteIndex / 4u]);`;case`sint32`:return t?`return max(f32(bitcast<i32>(source[byteIndex / 4u])) / 2147483647.0, -1.0);`:`return f32(bitcast<i32>(source[byteIndex / 4u]));`;default:throw Error(`castData WebGPU input does not support ${e}`)}}function N(e){let{signedDataType:t,normalized:n}=s(e);if(t===`float32`||t===`float16`)return`fn encodeValue(value: f32) -> f32 { return value; }`;let r=ce(t),i=t.startsWith(`sint`)?-r:0;return`fn encodeValue(value: f32) -> f32 { return ${n?`round(clamp(value, ${i<0?`-1.0`:`0.0`}, 1.0) * ${r}.0)`:`round(clamp(value, ${i}.0, ${r}.0))`}; }`}function se(e,t,n){if(t===4){let t=`encodeValue(readSourceValue(firstScalarIndex))`;return e===`float32`?`result[wordIndex] = bitcast<u32>(${t});`:e===`sint32`?`result[wordIndex] = bitcast<u32>(i32(${t}));`:`result[wordIndex] = u32(${t});`}if(t===2&&e===`float16`)return`let second = select(0.0, readSourceValue(firstScalarIndex + 1u), firstScalarIndex + 1u < ${n}u);
  result[wordIndex] = pack2x16float(vec2<f32>(
    encodeValue(readSourceValue(firstScalarIndex)),
    encodeValue(second)
  ));`;let r=4/t,i=t*8,a=i===8?`0xffu`:`0xffffu`;return`result[wordIndex] = ${Array.from({length:r},(t,r)=>{let o=`firstScalarIndex + ${r}u`;return`(select(0u, (${e.startsWith(`sint`)?`bitcast<u32>(i32(encodeValue(readSourceValue(${o}))))`:`u32(encodeValue(readSourceValue(${o})))`}) & ${a}, ${o} < ${n}u) << ${r*i}u)`}).join(` |
    `)};`}function ce(e){switch(e){case`sint8`:return 127;case`uint8`:return 255;case`sint16`:return 32767;case`uint16`:return 65535;case`sint32`:return 2147483647;case`uint32`:return 4294967295;default:throw Error(`castData WebGPU output does not support ${e}`)}}var P=64,le=`GPGPU Operation Counts`,ue=`Computation Runs`,F=async({inputs:e,output:t,target:n,scope:r})=>{let{source:i,inputFormat:a}=e;if(t.length===0)return{success:!0};let o=new c(n.device,{source:de(a,i.offset,i.stride,t.length,e.outputFormat),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}}),s={source:i.buffer,result:n};r&&r.retain(()=>o.destroy());try{let e=r?r.commandEncoder.beginComputePass({}):n.device.beginComputePass({});try{n.device.statsManager.getStats(le).get(ue).incrementCount(),o.dispatch(e,{bindings:s,x:Math.ceil(t.length/P)})}finally{e.end()}r||n.device.submit()}finally{r||o.destroy()}return{success:!0}};F.supportsEvaluationScope=!0;function de(e,t,n,r,i){return`\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

// Treat the storage binding as raw 32-bit words so one shader can address packed Uint8, Float16,
// and Float32 rows with arbitrary supported strides. The float readers decode IEEE bit patterns;
// they do not numerically convert integer values to floats.

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  let shift = (byteIndex % 4u) * 8u;
  return (word >> shift) & 0xffu;
}

fn readUint8(byteIndex: u32) -> f32 {
  return f32(readByte(byteIndex)) / 255.0;
}

fn readFloat16Bits(byteIndex: u32) -> f32 {
  let word = source[byteIndex / 4u];
  let values = unpack2x16float(word);
  return select(values.x, values.y, byteIndex % 4u == 2u);
}

fn readFloat32Bits(byteIndex: u32) -> f32 {
  return bitcast<f32>(source[byteIndex / 4u]);
}

fn readColor(rowIndex: u32) -> vec4<f32> {
  let rowByteOffset = ${t}u + rowIndex * ${n}u;
${I(e)}
}

@compute @workgroup_size(${P}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${r}u) {
    return;
  }

  let color = readColor(rowIndex);
${i===`unorm8x4`?`  result[rowIndex] = pack4x8unorm(color);`:i===`float16x4`?`  result[rowIndex * 2u] = pack2x16float(color.xy);
  result[rowIndex * 2u + 1u] = pack2x16float(color.zw);`:`  result[rowIndex * 4u] = bitcast<u32>(color.x);
  result[rowIndex * 4u + 1u] = bitcast<u32>(color.y);
  result[rowIndex * 4u + 2u] = bitcast<u32>(color.z);
  result[rowIndex * 4u + 3u] = bitcast<u32>(color.w);`}
}
`}function I(e){switch(e){case`uint8x3`:return`  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    1.0
  );`;case`uint8x4`:return`  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    readUint8(rowByteOffset + 3u)
  );`;case`float16x3`:return`  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    1.0
  );`;case`float16x4`:return`  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    readFloat16Bits(rowByteOffset + 6u)
  );`;case`float32x3`:return`  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    1.0
  );`;case`float32x4`:return`  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    readFloat32Bits(rowByteOffset + 12u)
  );`;default:{let t=e;throw Error(`Unsupported color input format ${t}`)}}}var L=`fn row_dot(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(y[i]);
  }
  return array<f32, 1>(sum);
}
`,R=({inputs:e,output:t,target:n,scope:r})=>(C({scope:r,module:{name:`row_dot`,source:L},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0});R.supportsEvaluationScope=!0;var z=`fn equalAll(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<u32, 1> {
  var allEqual = 1u;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    if (x[i] != y[i]) {
      allEqual = 0u;
      break;
    }
  }
  return array<u32, 1>(allEqual);
}
`,B=({inputs:e,output:t,target:n,scope:r})=>(C({scope:r,module:{name:`equalAll`,source:z},inputs:e,output:t,operationType:e.x.type,outputBuffer:n}),{success:!0});B.supportsEvaluationScope=!0;function V(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${_(t.type)}>;`}function H(e,t,n,r=e){let i=_(n);if(t.isConstant){let e=t.value;if(!e)throw Error(`Constant input ${t} is missing CPU values`);return`fn read_${r}(_sourceIndex: u32) -> array<${i}, ${t.size}> {
  return array<${i}, ${t.size}>(${Array.from({length:t.size},(t,n)=>m(i,e[n]??0)).join(`, `)});
}`}let a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT,s=_(t.type)===i?``:`${i}`;return`fn read_${r}(sourceIndex: u32) -> array<${i}, ${t.size}> {
  var value: array<${i}, ${t.size}>;
  let rowOffset = ${o}u + sourceIndex * ${a}u;
${Array.from({length:t.size},(t,n)=>s?`  value[${n}] = ${s}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`}function U(e,t){return H(`sourceValues`,e,t,`source_values`)}function W(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${_(e.type)}>;`}function G(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${_(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function fe(e,t){let n=g(e);return`fn zero_result() -> array<${_(e)}, ${t}> {
  var result: array<${_(e)}, ${t}>;
${Array.from({length:t},(e,t)=>`  result[${t}] = ${n};`).join(`
`)}
  return result;
}`}var pe=({inputs:e,output:t,target:r})=>{let{sourceValues:a}=e;if(a.length===0){let e=new t.ValueType(t.length*t.size);return r.write(e),{success:!0,value:e}}if(a.isConstant){let e=a.value;if(!e)throw Error(`Constant input ${a} is missing CPU values`);let n=new t.ValueType(t.length*t.size);for(let r=0;r<t.length;r++){let t=e[r];n[r*2]=t,n[r*2+1]=t}return r.write(n),{success:!0,value:n}}let o=[],s=a,c=`raw`,l=a.length;try{for(;;){let e=Math.ceil(l/64),a=t.length*e,u=e===1?r:n.createOrReuse(r.device,a*t.stride);if(e>1&&o.push(u),me({input:s,inputMode:c,inputGroupCount:l,channelCount:t.length,outputType:t.type,outputBuffer:u,outputLength:a,outputStride:t.stride,outputOffset:t.offset}),e===1)break;s=new i({buffer:u,type:t.type,size:2,length:a}),c=`partial`,l=e}return{success:!0}}finally{for(let e of o)n.recycle(e)}};function me({input:e,inputMode:t,inputGroupCount:n,channelCount:r,outputType:a,outputBuffer:o,outputLength:s,outputStride:l,outputOffset:f}){let p=_(a),m=u(s,o.device.limits.maxComputeWorkgroupsPerDimension),h=new i({buffer:o,type:a,size:2,length:s,stride:l,offset:f}),g=`
${e.isConstant?``:V(`sourceValues`,e,0)}
${U(e,a)}
${W(h,e.isConstant?0:1)}
${G(h)}
${he(t,a,r,n)}

var<workgroup> sharedMin: array<${p}, 64>;
var<workgroup> sharedMax: array<${p}, 64>;

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let outputRowIndex = ${d(m)};
  if (outputRowIndex >= ${s}u) {
    return;
  }

  let channelIndex = outputRowIndex % ${r}u;
  let outputGroupIndex = outputRowIndex / ${r}u;
  let inputGroupIndex = outputGroupIndex * 64u + localId.x;

  let result = extent_pass(channelIndex, inputGroupIndex);
  sharedMin[localId.x] = result[0];
  sharedMax[localId.x] = result[1];
  workgroupBarrier();

  var stride = 32u;
  loop {
    if (stride == 0u) {
      break;
    }
    if (localId.x < stride) {
      let compareIndex = localId.x + stride;
      if (sharedMin[compareIndex] < sharedMin[localId.x]) {
        sharedMin[localId.x] = sharedMin[compareIndex];
      }
      if (sharedMax[compareIndex] > sharedMax[localId.x]) {
        sharedMax[localId.x] = sharedMax[compareIndex];
      }
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  if (localId.x == 0u) {
    write_result(outputRowIndex, array<${p}, 2>(sharedMin[0], sharedMax[0]));
  }
}
`,v=new c(o.device,{source:g,shaderLayout:{bindings:[...e.isConstant?[]:[{name:`sourceValues`,type:`storage`,group:0,location:0}],{name:`result`,type:`storage`,group:0,location:e.isConstant?0:1}]}}),y={result:o};e.isConstant||(y.sourceValues=e.buffer);let b=y,x=o.device.beginComputePass({});v.dispatch(x,{bindings:b,x:m.x,y:m.y,z:m.z}),x.end(),o.device.submit(),v.destroy()}function he(e,t,n,r){let i=_(t),[a,o]=ge(t);return e===`raw`?`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${o};

  if (inputGroupIndex < ${r}u) {
    let value = read_source_values(inputGroupIndex);
    result[0] = value[channelIndex];
    result[1] = value[channelIndex];
  }

  return result;
}`:`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${o};

  if (inputGroupIndex < ${r}u) {
    let rowIndex = inputGroupIndex * ${n}u + channelIndex;
    let value = read_source_values(rowIndex);
    result[0] = value[0];
    result[1] = value[1];
  }

  return result;
}`}function ge(e){switch(e){case`uint32`:return[`0xffffffffu`,`0u`];case`sint32`:return[`2147483647`,`-2147483648`];case`float32`:return[`3.402823e38`,`-3.402823e38`];default:throw Error(`Unsupported WebGPU extent type for ${e}`)}}function _e(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var ve=`\
const LE: bool = ${_e()?`true`:`false`};
const F32_NAN: u32 = 0xffffffffu;
const F32_INF: u32 = 0x7f800000u;

fn roundShiftRight(value: u32, shift: i32) -> u32 {
  if (shift <= 0) {
    return value << u32(-shift);
  }

  if (shift >= 32) {
    if (shift == 32 && value > 0x80000000u) {
      return 1u;
    }
    return 0u;
  }

  let shiftU32 = u32(shift);
  let truncated = value >> shiftU32;
  let halfShift = 1u << u32(shift - 1);
  let remainder = value & ((1u << shiftU32) - 1u);
  if (remainder > halfShift || (remainder == halfShift && (truncated & 1u) == 1u)) {
    return truncated + 1u;
  }
  return truncated;
}

fn makeFloatImmediate(sign: u32, exponent: i32, mantissa: u32) -> u32 {
  return (sign << 31u) | (u32(exponent + 127) << 23u) | (mantissa & 0x7fffffu);
}

fn makeFloat(sign: u32, exponent: i32, significand: u32) -> u32 {
  if (significand == 0u) {
    return sign << 31u;
  }

  let leadingZeros = i32(countLeadingZeros(significand));
  var normalizedExponent = exponent + 31 - leadingZeros;

  if (normalizedExponent > 127) {
    return (sign << 31u) | F32_INF;
  }

  var mantissa: u32;
  if (normalizedExponent >= -126) {
    mantissa = roundShiftRight(significand, 8 - leadingZeros);
    if (mantissa >= 0x1000000u) {
      mantissa = mantissa >> 1u;
      normalizedExponent += 1;
      if (normalizedExponent > 127) {
        return (sign << 31u) | F32_INF;
      }
    }
    return makeFloatImmediate(sign, normalizedExponent, mantissa);
  }

  let subnormalShift = -149 - exponent;
  mantissa = roundShiftRight(significand, subnormalShift);
  if (mantissa >= 0x800000u) {
    return (sign << 31u) | (1u << 23u);
  }
  return (sign << 31u) | mantissa;
}

fn parseAsDouble(words: vec2<u32>) -> vec2<u32> {
  var d = words;
  if (LE) {
    d = d.yx;
  }

  let sign = (d.x >> 31u) & 1u;
  let exponentBits = (d.x >> 20u) & 0x7ffu;
  let exponent = i32(exponentBits) - 1023;
  let fractionHigh = d.x & 0xfffffu;
  let fractionLow = d.y;

  if (exponentBits == 0x7ffu) {
    if (fractionHigh == 0u && fractionLow == 0u) {
      return vec2<u32>((sign << 31u) | F32_INF, F32_NAN);
    }
    return vec2<u32>(F32_NAN);
  }

  if (exponentBits == 0u) {
    return vec2<u32>(sign << 31u);
  }

  if (exponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highSignificand = 0x800000u | (fractionHigh << 3u) | (fractionLow >> 29u);
  let lowSignificand = fractionLow & 0x1fffffffu;

  if (exponent < -126) {
    let highPart = makeFloat(sign, exponent - 23, highSignificand);
    let lowPart = makeFloat(sign, exponent - 52, lowSignificand);
    return vec2<u32>(highPart, lowPart);
  }

  let roundUp = lowSignificand > 0x10000000u ||
    (lowSignificand == 0x10000000u && (highSignificand & 1u) == 1u);

  var roundedSignificand = highSignificand + select(0u, 1u, roundUp);
  var highExponent = exponent;
  if (roundedSignificand == 0x1000000u) {
    roundedSignificand = 0x800000u;
    highExponent += 1;
  }

  if (highExponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highPart = makeFloatImmediate(sign, highExponent, roundedSignificand);

  var remainder = i32(lowSignificand);
  var lowSign = sign;
  if (roundUp) {
    remainder -= 0x20000000;
  }
  if (remainder < 0) {
    lowSign = 1u - sign;
    remainder = -remainder;
  }

  let lowPart = makeFloat(lowSign, exponent - 52, u32(remainder));
  return vec2<u32>(highPart, lowPart);
}

fn fround(x: array<u32, {X_LEN}>) -> array<f32, {RESULT_LEN}> {
  var result: array<f32, {RESULT_LEN}>;
  let n = {X_LEN}u / 2u;
  for (var i = 0u; i < n; i = i + 1u) {
    let parts = parseAsDouble(vec2<u32>(x[i * 2u], x[i * 2u + 1u]));
    result[i] = bitcast<f32>(parts.x);
    result[i + n] = bitcast<f32>(parts.y);
  }
  return result;
}
`,K=({inputs:e,output:t,target:n,scope:r})=>(C({scope:r,module:{name:`fround`,source:ve},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0});K.supportsEvaluationScope=!0;var ye=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=_(r.type),o=[];r.isConstant||o.push({name:`ids`,input:r,index:o.length}),i.isConstant||o.push({name:`sourceValues`,input:i,index:o.length});let s=u(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),l=`
${o.map(({name:e,input:t,index:n})=>V(e,t,n)).join(`
`)}
${be(r,a)}
${U(i,t.type)}
${W(t,o.length)}
${G(t)}
${fe(t.type,t.size)}
${xe(r.type,t.type,t.size,i.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${f(s,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let idsValue = read_ids(rowIndex);
  let result = gather(idsValue);
  write_result(rowIndex, result);
}
`,d=new c(n.device,{source:l,shaderLayout:{bindings:[...o.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:o.length}]}}),p={};r.isConstant||(p.ids=r.buffer),i.isConstant||(p.sourceValues=i.buffer),p.result=n;let m=p,h=n.device.beginComputePass({});return d.dispatch(h,{bindings:m,x:s.x,y:s.y,z:s.z}),h.end(),n.device.submit(),d.destroy(),{success:!0}};function be(e,t){if(e.isConstant){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return`fn read_ids(_rowIndex: u32) -> ${t} {
  return ${m(t,n[0]??0)};
}`}let n=e.stride/e.ValueType.BYTES_PER_ELEMENT;return`fn read_ids(rowIndex: u32) -> ${t} {
  let rowOffset = ${e.offset/e.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${n}u;
  return ids[rowOffset];
}`}function xe(e,t,n,r){let i=_(e);return`fn gather(idsValue: ${i}) -> array<${_(t)}, ${n}> {
  let sourceIndex = ${i===`u32`?`i32(idsValue)`:i===`i32`?`idsValue`:`i32(idsValue)`};
  if (sourceIndex < 0 || sourceIndex >= ${r}) {
    return zero_result();
  }
  return read_source_values(u32(sourceIndex));
}`}var q=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=r.isConstant?[]:[{name:`segments`,input:r,index:0}],a=u(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),o=`
${i.map(({name:e,input:t,index:n})=>V(e,t,n)).join(`
`)}
${H(`segments`,r,`uint32`)}
${W(t,i.length)}
${G(t)}
${Se(r.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${f(a,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let result = segmented_map(rowIndex);
  write_result(rowIndex, result);
}
`,s=new c(n.device,{source:o,shaderLayout:{bindings:[...i.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:i.length}]}}),l=Object.fromEntries(i.map(({name:e,input:t})=>[e,t.buffer]));l.result=n;let d=l,p=n.device.beginComputePass({});return s.dispatch(p,{bindings:d,x:a.x,y:a.y,z:a.z}),p.end(),n.device.submit(),s.destroy(),{success:!0}};function Se(e){return`fn segmented_map(vertexIndex: u32) -> array<u32, 2> {
  var low = 0i;
  var high = ${e}i;
  while (low < high) {
    let mid = low + (high - low) / 2i;
    let midStart = read_segments(u32(mid))[0];
    if (midStart <= vertexIndex) {
      low = mid + 1i;
    } else {
      high = mid;
    }
  }

  let segmentIndex = u32(max(low - 1i, 0i));
  let segmentStart = read_segments(segmentIndex)[0];
  return array<u32, 2>(segmentIndex, vertexIndex - segmentStart);
}`}var J=({inputs:e,output:t,target:n,scope:r})=>{let i=e.map((e,t)=>[`x${t}`,e]);Ce(n.device.limits,i);let a=i.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(`, `),o=0;return C({scope:r,module:{name:`interleave`,source:`\
fn interleave(${a}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${i.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  out[${o+n}] = ${e}[${n}];`).join(`
`);return o+=t.size,n}).join(`
`)}
  return out;
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function Ce(e,t){let n=t.filter(([,e])=>S(e)).length+1;if(n>e.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${n} storage buffers, exceeding device limit ${e.maxStorageBuffersPerShaderStage}`);if(n>e.maxBindingsPerBindGroup)throw Error(`interleave() requires ${n} bindings, exceeding bind group limit ${e.maxBindingsPerBindGroup}`)}J.supportsEvaluationScope=!0;var we=`fn row_length(x: array<{TYPE}, {X_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(x[i]);
  }
  return array<f32, 1>(sqrt(sum));
}
`,Y=({inputs:e,output:t,target:n,scope:r})=>(C({scope:r,module:{name:`row_length`,source:we},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0});Y.supportsEvaluationScope=!0;var X=async({inputs:e,output:t,target:n,scope:r})=>{let i=g(t.type);return C({scope:r,module:{name:`select`,source:`// inline expression select
`},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>{let n=Z(`condition`,e.condition,t,i),r=Z(`whenTrue`,e.whenTrue,t,i);return`select(${Z(`whenFalse`,e.whenFalse,t,i)}, ${r}, ${n} != ${i})`}}),{success:!0}};function Z(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}X.supportsEvaluationScope=!0;var Q=64,Te=({inputs:e,output:t,target:n})=>{let r=u(Math.ceil(t.length/Q),n.device.limits.maxComputeWorkgroupsPerDimension),i=`\
@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${Q}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${f(r,Q)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let rowOffset = ${t.offset/t.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${t.stride/t.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${e.start} + i32(rowIndex) * ${e.step};
}
`,a=new c(n.device,{source:i,shaderLayout:{bindings:[{name:`result`,type:`storage`,group:0,location:0}]}}),o={result:n},s=n.device.beginComputePass({});return a.dispatch(s,{bindings:o,x:r.x,y:r.y,z:r.z}),s.end(),n.device.submit(),a.destroy(),{success:!0}},$=({inputs:e,output:t,target:n,scope:r})=>{let{columns:i}=e;return C({scope:r,module:{name:`swizzle`,source:`// swizzle expression handled inline`},expression:e=>`x[${i[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};$.supportsEvaluationScope=!0;export{J as a,K as c,R as d,F as f,Y as i,pe as l,D as m,Te as n,q as o,oe as p,X as r,ye as s,$ as t,B as u};