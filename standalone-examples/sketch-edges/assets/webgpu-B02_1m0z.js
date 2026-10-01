import{i as e,n as t,o as n,t as r,v as i}from"./arithmetic-expression-Cwp0TjJY.js";import{t as a}from"./expression-BX0-xbxH.js";import{a as o,c as s,f as c,i as l,l as u,n as d,o as f,r as p,s as m,t as h}from"./index-BSvZIHHd.js";var g=`fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
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
`,_=({inputs:e,output:t,target:n})=>{let s=t.type,c=o(s),l=f(s),u=e.namedInputs;return d({module:{name:`arithmetic`,source:g,dependencies:[i]},inputs:u,output:t,operationType:s,outputBuffer:n,expression:t=>a(e.expression,{operations:r,inputs:u,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>u[e].size===1?`${e}[0]`:l,formatLiteral:e=>`${c}(${p(s,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}},v=64,y=`GPGPU Operation Counts`,b=`Computation Runs`,x=async({inputs:e,output:t,target:n})=>{let r=Math.ceil(t.byteLength/4),i=new c(n.device,{source:S(e,t.length),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}});if(i.setBindings({source:e.source.buffer,result:n}),r>0){let e=n.device.beginComputePass({});n.device.statsManager.getStats(y).get(b).incrementCount(),i.dispatch(e,Math.ceil(r/v)),e.end(),n.device.submit()}return i.destroy(),{success:!0}};function S(e,t){let r=n(e.inputFormat),i=n(e.outputFormat),a=r.components,o=t*a,s=i.elementByteLength/i.components,c=4/s;return`\
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
  let rowIndex = scalarIndex / ${a}u;
  let componentIndex = scalarIndex % ${a}u;
  let byteIndex = ${e.source.offset}u + rowIndex * ${e.source.stride}u +
    componentIndex * ${r.elementByteLength/a}u;
  ${C(r.signedDataType,r.normalized)}
}

${w(e.outputFormat)}

@compute @workgroup_size(${v}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let wordIndex = id.x;
  let firstScalarIndex = wordIndex * ${c}u;
  if (firstScalarIndex >= ${o}u) {
    return;
  }
  ${T(i.signedDataType,s,o)}
}
`}function C(e,t){switch(e){case`float32`:return`return bitcast<f32>(source[byteIndex / 4u]);`;case`float16`:return`let values = unpack2x16float(source[byteIndex / 4u]);
  return select(values.x, values.y, byteIndex % 4u == 2u);`;case`uint8`:return t?`return f32(readByte(byteIndex)) / 255.0;`:`return f32(readByte(byteIndex));`;case`sint8`:return t?`return max(f32(i32(readByte(byteIndex) << 24u) >> 24) / 127.0, -1.0);`:`return f32(i32(readByte(byteIndex) << 24u) >> 24);`;case`uint16`:return t?`return f32(readUint16(byteIndex)) / 65535.0;`:`return f32(readUint16(byteIndex));`;case`sint16`:return t?`return max(f32(i32(readUint16(byteIndex) << 16u) >> 16) / 32767.0, -1.0);`:`return f32(i32(readUint16(byteIndex) << 16u) >> 16);`;case`uint32`:return t?`return f32(source[byteIndex / 4u]) / 4294967295.0;`:`return f32(source[byteIndex / 4u]);`;case`sint32`:return t?`return max(f32(bitcast<i32>(source[byteIndex / 4u])) / 2147483647.0, -1.0);`:`return f32(bitcast<i32>(source[byteIndex / 4u]));`;default:throw Error(`castData WebGPU input does not support ${e}`)}}function w(e){let{signedDataType:t,normalized:r}=n(e);if(t===`float32`||t===`float16`)return`fn encodeValue(value: f32) -> f32 { return value; }`;let i=E(t),a=t.startsWith(`sint`)?-i:0;return`fn encodeValue(value: f32) -> f32 { return ${r?`round(clamp(value, ${a<0?`-1.0`:`0.0`}, 1.0) * ${i}.0)`:`round(clamp(value, ${a}.0, ${i}.0))`}; }`}function T(e,t,n){if(t===4){let t=`encodeValue(readSourceValue(firstScalarIndex))`;return e===`float32`?`result[wordIndex] = bitcast<u32>(${t});`:e===`sint32`?`result[wordIndex] = bitcast<u32>(i32(${t}));`:`result[wordIndex] = u32(${t});`}if(t===2&&e===`float16`)return`let second = select(0.0, readSourceValue(firstScalarIndex + 1u), firstScalarIndex + 1u < ${n}u);
  result[wordIndex] = pack2x16float(vec2<f32>(
    encodeValue(readSourceValue(firstScalarIndex)),
    encodeValue(second)
  ));`;let r=4/t,i=t*8,a=i===8?`0xffu`:`0xffffu`;return`result[wordIndex] = ${Array.from({length:r},(t,r)=>{let o=`firstScalarIndex + ${r}u`;return`(select(0u, (${e.startsWith(`sint`)?`bitcast<u32>(i32(encodeValue(readSourceValue(${o}))))`:`u32(encodeValue(readSourceValue(${o})))`}) & ${a}, ${o} < ${n}u) << ${r*i}u)`}).join(` |
    `)};`}function E(e){switch(e){case`sint8`:return 127;case`uint8`:return 255;case`sint16`:return 32767;case`uint16`:return 65535;case`sint32`:return 2147483647;case`uint32`:return 4294967295;default:throw Error(`castData WebGPU output does not support ${e}`)}}var D=64,ee=`GPGPU Operation Counts`,te=`Computation Runs`,O=async({inputs:e,output:t,target:n})=>{let{source:r,inputFormat:i}=e,a=new c(n.device,{source:k(i,r.offset,r.stride,t.length),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}});a.setBindings({source:r.buffer,result:n});let o=n.device.beginComputePass({});return n.device.statsManager.getStats(ee).get(te).incrementCount(),a.dispatch(o,Math.ceil(t.length/D)),o.end(),n.device.submit(),a.destroy(),{success:!0}};function k(e,t,n,r){return`\
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
${A(e)}
}

@compute @workgroup_size(${D}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${r}u) {
    return;
  }

  result[rowIndex] = pack4x8unorm(readColor(rowIndex));
}
`}function A(e){switch(e){case`uint8x3`:return`  return vec4<f32>(
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
  );`;default:{let t=e;throw Error(`Unsupported color input format ${t}`)}}}var j=`fn row_dot(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(y[i]);
  }
  return array<f32, 1>(sum);
}
`,M=({inputs:e,output:t,target:n})=>(d({module:{name:`row_dot`,source:j},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),N=`fn equalAll(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<u32, 1> {
  var allEqual = 1u;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    if (x[i] != y[i]) {
      allEqual = 0u;
      break;
    }
  }
  return array<u32, 1>(allEqual);
}
`,P=({inputs:e,output:t,target:n})=>(d({module:{name:`equalAll`,source:N},inputs:e,output:t,operationType:e.x.type,outputBuffer:n}),{success:!0});function F(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${o(t.type)}>;`}function I(e,t,n,r=e){let i=o(n);if(t.isConstant){let e=t.value;if(!e)throw Error(`Constant input ${t} is missing CPU values`);return`fn read_${r}(_sourceIndex: u32) -> array<${i}, ${t.size}> {
  return array<${i}, ${t.size}>(${Array.from({length:t.size},(t,n)=>l(i,e[n]??0)).join(`, `)});
}`}let a=t.stride/t.ValueType.BYTES_PER_ELEMENT,s=t.offset/t.ValueType.BYTES_PER_ELEMENT,c=o(t.type)===i?``:`${i}`;return`fn read_${r}(sourceIndex: u32) -> array<${i}, ${t.size}> {
  var value: array<${i}, ${t.size}>;
  let rowOffset = ${s}u + sourceIndex * ${a}u;
${Array.from({length:t.size},(t,n)=>c?`  value[${n}] = ${c}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`}function L(e,t){return I(`sourceValues`,e,t,`source_values`)}function R(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${o(e.type)}>;`}function z(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${o(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function B(e,t){let n=f(e);return`fn zero_result() -> array<${o(e)}, ${t}> {
  var result: array<${o(e)}, ${t}>;
${Array.from({length:t},(e,t)=>`  result[${t}] = ${n};`).join(`
`)}
  return result;
}`}var V=({inputs:n,output:r,target:i})=>{let{sourceValues:a}=n;if(a.length===0){let e=new r.ValueType(r.length*r.size);return i.write(e),{success:!0,value:e}}if(a.isConstant){let e=a.value;if(!e)throw Error(`Constant input ${a} is missing CPU values`);let t=new r.ValueType(r.length*r.size);for(let n=0;n<r.length;n++){let r=e[n];t[n*2]=r,t[n*2+1]=r}return i.write(t),{success:!0,value:t}}let o=[],s=a,c=`raw`,l=a.length;try{for(;;){let n=Math.ceil(l/64),a=r.length*n,u=n===1?i:e.createOrReuse(i.device,a*r.stride);if(n>1&&o.push(u),H({input:s,inputMode:c,inputGroupCount:l,channelCount:r.length,outputType:r.type,outputBuffer:u,outputLength:a,outputStride:r.stride,outputOffset:r.offset}),n===1)break;s=new t({buffer:u,type:r.type,size:2,length:a}),c=`partial`,l=n}return{success:!0}}finally{for(let t of o)e.recycle(t)}};function H({input:e,inputMode:n,inputGroupCount:r,channelCount:i,outputType:a,outputBuffer:s,outputLength:l,outputStride:d,outputOffset:f}){let p=o(a),h=m(l,s.device.limits.maxComputeWorkgroupsPerDimension),g=new t({buffer:s,type:a,size:2,length:l,stride:d,offset:f}),_=`
${e.isConstant?``:F(`sourceValues`,e,0)}
${L(e,a)}
${R(g,e.isConstant?0:1)}
${z(g)}
${U(n,a,i,r)}

var<workgroup> sharedMin: array<${p}, 64>;
var<workgroup> sharedMax: array<${p}, 64>;

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let outputRowIndex = ${u(h)};
  if (outputRowIndex >= ${l}u) {
    return;
  }

  let channelIndex = outputRowIndex % ${i}u;
  let outputGroupIndex = outputRowIndex / ${i}u;
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
`,v=new c(s.device,{source:_,shaderLayout:{bindings:[...e.isConstant?[]:[{name:`sourceValues`,type:`storage`,group:0,location:0}],{name:`result`,type:`storage`,group:0,location:e.isConstant?0:1}]}}),y={result:s};e.isConstant||(y.sourceValues=e.buffer),v.setBindings(y);let b=s.device.beginComputePass({});v.dispatch(b,h.x,h.y,h.z),b.end(),s.device.submit(),v.destroy()}function U(e,t,n,r){let i=o(t),[a,s]=W(t);return e===`raw`?`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${s};

  if (inputGroupIndex < ${r}u) {
    let value = read_source_values(inputGroupIndex);
    result[0] = value[channelIndex];
    result[1] = value[channelIndex];
  }

  return result;
}`:`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${s};

  if (inputGroupIndex < ${r}u) {
    let rowIndex = inputGroupIndex * ${n}u + channelIndex;
    let value = read_source_values(rowIndex);
    result[0] = value[0];
    result[1] = value[1];
  }

  return result;
}`}function W(e){switch(e){case`uint32`:return[`0xffffffffu`,`0u`];case`sint32`:return[`2147483647`,`-2147483648`];case`float32`:return[`3.402823e38`,`-3.402823e38`];default:throw Error(`Unsupported WebGPU extent type for ${e}`)}}function G(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var K=`\
const LE: bool = ${G()?`true`:`false`};
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
`,q=({inputs:e,output:t,target:n})=>(d({module:{name:`fround`,source:K},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0}),J=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=o(r.type),l=[];r.isConstant||l.push({name:`ids`,input:r,index:l.length}),i.isConstant||l.push({name:`sourceValues`,input:i,index:l.length});let u=m(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),d=`
${l.map(({name:e,input:t,index:n})=>F(e,t,n)).join(`
`)}
${Y(r,a)}
${L(i,t.type)}
${R(t,l.length)}
${z(t)}
${B(t.type,t.size)}
${X(r.type,t.type,t.size,i.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${s(u,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let idsValue = read_ids(rowIndex);
  let result = gather(idsValue);
  write_result(rowIndex, result);
}
`,f=new c(n.device,{source:d,shaderLayout:{bindings:[...l.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:l.length}]}}),p={};r.isConstant||(p.ids=r.buffer),i.isConstant||(p.sourceValues=i.buffer),p.result=n,f.setBindings(p);let h=n.device.beginComputePass({});return f.dispatch(h,u.x,u.y,u.z),h.end(),n.device.submit(),f.destroy(),{success:!0}};function Y(e,t){if(e.isConstant){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return`fn read_ids(_rowIndex: u32) -> ${t} {
  return ${l(t,n[0]??0)};
}`}let n=e.stride/e.ValueType.BYTES_PER_ELEMENT;return`fn read_ids(rowIndex: u32) -> ${t} {
  let rowOffset = ${e.offset/e.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${n}u;
  return ids[rowOffset];
}`}function X(e,t,n,r){let i=o(e);return`fn gather(idsValue: ${i}) -> array<${o(t)}, ${n}> {
  let sourceIndex = ${i===`u32`?`i32(idsValue)`:i===`i32`?`idsValue`:`i32(idsValue)`};
  if (sourceIndex < 0 || sourceIndex >= ${r}) {
    return zero_result();
  }
  return read_source_values(u32(sourceIndex));
}`}var Z=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=r.isConstant?[]:[{name:`segments`,input:r,index:0}],a=m(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),o=`
${i.map(({name:e,input:t,index:n})=>F(e,t,n)).join(`
`)}
${I(`segments`,r,`uint32`)}
${R(t,i.length)}
${z(t)}
${ne(r.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${s(a,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let result = segmented_map(rowIndex);
  write_result(rowIndex, result);
}
`,l=new c(n.device,{source:o,shaderLayout:{bindings:[...i.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:i.length}]}}),u=Object.fromEntries(i.map(({name:e,input:t})=>[e,t.buffer]));u.result=n,l.setBindings(u);let d=n.device.beginComputePass({});return l.dispatch(d,a.x,a.y,a.z),d.end(),n.device.submit(),l.destroy(),{success:!0}};function ne(e){return`fn segmented_map(vertexIndex: u32) -> array<u32, 2> {
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
}`}var re=`fn row_length(x: array<{TYPE}, {X_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(x[i]);
  }
  return array<f32, 1>(sqrt(sum));
}
`,ie=({inputs:e,output:t,target:n})=>(d({module:{name:`row_length`,source:re},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),ae=async({inputs:e,output:t,target:n})=>{let r=f(t.type);return d({module:{name:`select`,source:`// inline expression select
`},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>{let n=Q(`condition`,e.condition,t,r),i=Q(`whenTrue`,e.whenTrue,t,r);return`select(${Q(`whenFalse`,e.whenFalse,t,r)}, ${i}, ${n} != ${r})`}}),{success:!0}};function Q(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}var $=64,oe=({inputs:e,output:t,target:n})=>{let r=m(Math.ceil(t.length/$),n.device.limits.maxComputeWorkgroupsPerDimension),i=`\
@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${$}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${s(r,$)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let rowOffset = ${t.offset/t.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${t.stride/t.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${e.start} + i32(rowIndex) * ${e.step};
}
`,a=new c(n.device,{source:i,shaderLayout:{bindings:[{name:`result`,type:`storage`,group:0,location:0}]}});a.setBindings({result:n});let o=n.device.beginComputePass({});return a.dispatch(o,r.x,r.y,r.z),o.end(),n.device.submit(),a.destroy(),{success:!0}},se=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return d({module:{name:`swizzle`,source:`// swizzle expression handled inline`},expression:e=>`x[${r[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};export{_ as arithmetic,x as castData,O as convertColors,M as dot,P as equalAll,V as extent,q as fround,J as gather,h as interleave,ie as length,Z as segmentedMap,ae as select,oe as sequence,se as swizzle};