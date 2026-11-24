import"./log-C3csoXOC.js";import{a as e,f as t,h as n,n as r,r as i,t as a}from"./expression-ugY8pv4f.js";import{_ as o}from"./render-pipeline-DM0TuH--.js";import{d as s,n as c,r as l,t as u,u as d}from"./convert-colors-B_n3rngH.js";import{t as f}from"./texture-CUNOmMP2.js";function p(e,n,r){let{vs:i,fs:a}=(n.shaderAssembler??new s).assembleGLSLShaderPair({platformInfo:t(e),vs:n.vs,fs:d(),modules:n.modules,defines:n.defines}),c=n.bufferLayout??[],u=new l(e,{vertexSource:i,fragmentSource:a,topology:`point-list`,bufferLayout:c,varyings:n.outputs,bufferMode:35980}),f,p;try{f=e.createVertexArray({shaderLayout:u.pipeline.shaderLayout,bufferLayout:c});let t={...n.attributes,...r.inputBuffers};for(let e of u.pipeline.shaderLayout.attributes){let n=c.find(t=>t.attributes?t.attributes.some(t=>t.attribute===e.name):t.name===e.name),r=n&&t[n.name];o(r),f.setBuffer(e.location,r)}p=e.createTransformFeedback({layout:u.pipeline.shaderLayout,buffers:r.outputBuffers});let i=e.beginRenderPass({discard:!0});try{u.draw(i,{vertexArray:f,transformFeedback:p,bindings:n.bindings,vertexCount:n.vertexCount,instanceCount:n.instanceCount})}finally{i.end()}}finally{p?.destroy(),f?.destroy(),u.destroy()}}function m(e,t,n=!1){if(n)return t===1?`float`:`vec${t}`;switch(e){case`uint8`:case`uint16`:case`uint32`:return t===1?`uint`:`uvec${t}`;case`sint8`:case`sint16`:case`sint32`:return t===1?`int`:`ivec${t}`;default:return t===1?`float`:`vec${t}`}}function h(e,t,n=!1){let r;if(n)switch(e){case`uint8`:r=`unorm8`;break;case`sint8`:r=`snorm8`;break;case`uint16`:r=`unorm16`;break;case`sint16`:r=`snorm16`;break;case`float32`:r=`float32`;break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}else r=e;return t===1?r:t===3&&!r.startsWith(`float32`)&&!r.endsWith(`32`)?`${r}x3-webgl`:`${r}x${t}`}function g(e){switch(e[0]){case`u`:return`0u`;case`s`:return`0`;default:return`0.`}}function _(e,t){switch(e){case`uint8`:case`uint16`:case`uint32`:return`${Math.trunc(t)}u`;case`sint8`:case`sint16`:case`sint32`:return`${Math.trunc(t)}`;default:return Number.isInteger(t)?`${t}.0`:`${t}`}}function v(e){switch(e){case`uint8`:return`r8uint`;case`sint8`:return`r8sint`;case`uint16`:return`r16uint`;case`sint16`:return`r16sint`;case`uint32`:return`r32uint`;case`sint32`:return`r32sint`;case`float32`:return`r32float`;default:throw Error(`Unsupported WebGL gather texture format for ${e}`)}}function y(e){return e}function b(e){switch(e){case`uint32`:return`usampler2D`;case`sint32`:return`isampler2D`;case`float32`:return`sampler2D`;default:throw Error(`Unsupported WebGL gather sampler type for ${e}`)}}var x=`GPGPU Operation Counts`,S=`Transform Runs`,C=new s;function w({module:t,elementWise:n=!1,expression:r,inputs:a,output:o,operationType:s=o.type,outputBuffer:c}){let l=c.device,u=O(`result`,o.type,o.size,o.normalized),d=[t,u],f=[],h={},_=m(o.type,1,o.normalized),v=m(s,1,o.normalized),y=``,b=null,w={TYPE:v,RESULT_LEN:o.size.toString()},k=T(a);for(let[t,n]of k)d.push(E(t,n.type,n.size,n.normalized,s)),f.push(D(t,n)),n instanceof i?h[t]=n.buffer:(b||=e.createOrReuse(l,c.byteLength),h[t]=b),y+=`TYPE ${t}[${n.size}]; get_${t}(${t});\n`,w[`${t.toUpperCase()}_LEN`]=n.size.toString();let A=``;if(r)for(let e=0;e<o.size;e++)A+=`result[${e}]=${r(e)};\n`;else if(n)for(let e=0;e<o.size;e++){let n=g(v),r=k.map(([t,r])=>e<r.size?`${t}[${e}]`:n);A+=`result[${e}]=${t.name}(${r.join(`, `)});\n`}else A=`${t.name}(${k.map(([e])=>e).join(`, `)}, result);`;let j={vs:`\
#version 300 es

void main() {
${y}
${_} result[${o.size}];
${A}
set_result(result);
}
  `,shaderAssembler:C,defines:w,modules:d,bufferLayout:f,vertexCount:1,instanceCount:o.length,attributes:h,outputs:u.varyings};l.statsManager.getStats(x).get(S).incrementCount();try{p(l,j,{inputBuffers:h,outputBuffers:{[u.varyings[0]]:o.offset===0?c:{buffer:c,byteOffset:o.offset,byteLength:o.byteLength}}})}finally{b&&e.recycle(b)}}function T(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function E(e,t,n,r=!1,i=t){let a=``,o=``;for(let s=0;s<n;s+=4){let c=Math.min(n-s,4),l=m(t,c,r);a+=`in ${l} a${e}_${s};\n`;for(let n=0;n<c;n++){let a=`a${e}_${s}`;c>1&&(a=`${a}[${n}]`),(r||t!==i)&&(a=`TYPE(${a})`),o+=`v[${s+n}]=${a};\n`}}return{name:e,vs:`
${a}
void get_${e}(out TYPE v[${n}]) {
  ${o}
}
`}}function D(e,t){let n={name:e,stepMode:t.isConstant?`vertex`:`instance`,byteStride:t.stride,attributes:[]};for(let r=0;r<t.size;r+=4){let i=Math.min(t.size-r,4);n.attributes.push({attribute:`a${e}_${r}`,format:h(t.type,i,t.normalized),byteOffset:t.offset+t.ValueType.BYTES_PER_ELEMENT*r})}return n}function O(e,t,n,r=!1){let i=[],a=m(t,1,r),o=``,s=``;for(let a=0;a<n;a+=4){let c=Math.min(n-a,4),l=m(t,c,r);i.push(`${e}_${a}`),o+=`flat out ${l} ${e}_${a};\n`;let u=Array.from({length:c},(e,t)=>a+t);s+=`${e}_${a} = ${l}(${u.map(e=>`v[${e}]`).join(`,`)});\n`}return{name:e,varyings:i,vs:`
${o}
void set_${e}(in ${a} v[${n}]) {
  ${s}
}
`}}var k=`TYPE arithmetic_add(TYPE x, TYPE y) {
  return x + y;
}

TYPE arithmetic_subtract(TYPE x, TYPE y) {
  return x - y;
}

TYPE arithmetic_multiply(TYPE x, TYPE y) {
  return x * y;
}

TYPE arithmetic_divide(TYPE x, TYPE y) {
  return x / y;
}

float arithmetic_tan(float x) {
  return tan_fp32(x);
}
`,A=({inputs:e,output:t,target:i})=>{let o=t.type,s=m(o,1,t.normalized),c=g(s),l=e.namedInputs;return w({module:{name:`arithmetic`,dependencies:[n],vs:k},inputs:l,output:t,operationType:o,outputBuffer:i,expression:t=>a(e.expression,{operations:r,inputs:l,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>l[e].size===1?`${e}[0]`:c,formatLiteral:e=>`${s}(${_(o,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}},j=`GPGPU Operation Counts`,ee=`Transform Runs`,M=({inputs:n,output:r,target:a})=>{let{sourceValues:o}=n,c=a.device;if(o.length===0){let e=new r.ValueType(r.length*r.size);return a.write(e),{success:!0,value:e}}if(o.isConstant){let e=o.value,t=new r.ValueType(r.length*r.size);for(let n=0;n<r.length;n++){let r=e[n];t[n*2]=r,t[n*2+1]=r}return a.write(t),{success:!0,value:t}}let u=c.createTexture({width:1,height:r.length,format:`rg32float`,usage:f.RENDER|f.COPY_SRC|f.COPY_DST}),d=c.createFramebuffer({colorAttachments:[u]}),{vs:p,fs:m}=new s().assembleGLSLShaderPair({platformInfo:t(c),vs:`#version 300 es

flat out float extent_value;

void main() {
  float sourceValues[SOURCE_VALUES_LEN];
  get_sourceValues(sourceValues);
  extent_value = sourceValues[gl_VertexID];

  float y = (float(gl_VertexID) + 0.5) / float(CHANNEL_COUNT) * 2.0 - 1.0;
  gl_Position = vec4(0.0, y, 0.0, 1.0);
  gl_PointSize = 1.0;
}
  `,fs:`#version 300 es

precision highp float;

flat in float extent_value;
out vec2 fragColor;

void main() {
  fragColor = vec2(-extent_value, extent_value);
}
  `,modules:[E(`sourceValues`,o.type,o.size,o.normalized)],defines:{TYPE:`float`,SOURCE_VALUES_LEN:o.size,CHANNEL_COUNT:r.length}}),h=[D(`sourceValues`,o)],g=new l(c,{vertexSource:p,fragmentSource:m,topology:`point-list`,parameters:{depthCompare:`always`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendColorOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`,blendAlphaOperation:`max`},bufferLayout:h,disableWarnings:!0}),_=c.createVertexArray({shaderLayout:g.pipeline.shaderLayout,bufferLayout:h});for(let e of g.pipeline.shaderLayout.attributes)_.setBuffer(e.location,o.buffer);let v=e.createOrReuse(c,r.byteLength);try{let e=c.beginRenderPass({framebuffer:d,parameters:{viewport:[0,0,1,r.length]},clearColor:[-N,-N,0,0],clearDepth:!1,clearStencil:!1});c.statsManager.getStats(j).get(ee).incrementCount(),g.draw(e,{vertexArray:_,vertexCount:r.length,instanceCount:o.length}),e.end();let t=c.createCommandEncoder();return t.copyTextureToBuffer({sourceTexture:u,width:1,height:r.length,destinationBuffer:v,byteOffset:0,bytesPerRow:8}),c.submit(t.finish()),A({device:c,inputs:{expression:{kind:`call`,op:`multiply`,args:[{kind:`input`,name:`x`},{kind:`literal`,value:[-1,1]}]},namedInputs:{x:new i({buffer:v,size:2,type:`float32`,length:r.length})}},output:r,target:a})}finally{_.destroy(),g.destroy(),e.recycle(v),d.destroy(),u.destroy()}},N=3e38,P=({inputs:e,output:t,target:n})=>{let r=e.map((e,t)=>[`x${t}`,e]);F(n.device.limits.maxVertexAttributes,r),I(n.device.limits.maxInterStageShaderVariables,t);let i=r.map(([e,t])=>`in TYPE ${e}[${t.size}]`).join(`, `),a=0;return w({module:{name:`interleave`,vs:`\
void interleave(${i}, out TYPE result[RESULT_LEN]) {
${r.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  result[${a+n}] = ${e}[${n}];`).join(`
`);return a+=t.size,n}).join(`
`)}
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function F(e,t){let n=t.reduce((e,[,t])=>e+Math.ceil(t.size/4),0);if(n>e)throw Error(`interleave() requires ${n} vertex attributes, exceeding device limit ${e}`)}function I(e,t){if(t.size>e)throw Error(`interleave() output size ${t.size} exceeds device inter-stage component limit ${e}`)}function L(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var R=`\
#define LE ${L()?1:0}
const uint F32_NAN = 0xffffffffu;
const uint F32_INF = 0x7f800000u;

// Find first set bit using binary search
// https://en.wikipedia.org/wiki/Find_first_set#CLZ
int countLeadingZeros(uint a) {
  if (a == 0u) return 32;
  int n = 0;
  if ((a & 0xffff0000u) == 0u) { n += 16; a = a << 16; }
  if ((a & 0xff000000u) == 0u) { n += 8;  a = a << 8;  }
  if ((a & 0xf0000000u) == 0u) { n += 4;  a = a << 4;  }
  if ((a & 0xc0000000u) == 0u) { n += 2;  a = a << 2;  }
  if ((a & 0x80000000u) == 0u) return n + 1;
  return n;
}

uint roundShiftRight(uint value, int shift) {
  if (shift <= 0) {
    return value << (-shift);
  }

  if (shift >= 32) {
    if (shift == 32 && value > 0x80000000u) {
      return 1u;
    }
    return 0u;
  }

  uint truncated = value >> shift;
  uint halfShift = 1u << (shift - 1);
  uint remainder = value & ((1u << shift) - 1u);
  if (remainder > halfShift || (remainder == halfShift && (truncated & 1u) == 1u)) {
    return truncated + 1u;
  }
  return truncated;
}

uint makeFloat_(uint sign, int exponent, uint mantissa) {
  return (sign << 31) | (uint(exponent + 127) << 23) | (mantissa & 0x7fffffu);
}

/**
 * Assemble a float32 in bit representation according to IEEE 754
 * https://en.wikipedia.org/wiki/Single-precision_floating-point_format
 */
uint makeFloat(uint sign, int exponent, uint significand) {
  if (significand == 0u) {
    return sign << 31;
  }

  // Remove any extra leading zeros for better precision
  int lead_zeros = countLeadingZeros(significand);
  // Significand is encoded as 1.fraction
  int normalizedExponent = exponent + 31 - lead_zeros;

  if (normalizedExponent > 127) {
    return (sign << 31) | F32_INF;
  }

  uint mantissa;
  if (normalizedExponent >= -126) {
    mantissa = roundShiftRight(significand, 8 - lead_zeros);
    if (mantissa >= 0x1000000u) {
      mantissa >>= 1;
      normalizedExponent++;
      if (normalizedExponent > 127) {
        return (sign << 31) | F32_INF;
      }
    }
    return makeFloat_(sign, normalizedExponent, mantissa);
  }

  int subnormalShift = -149 - exponent;
  mantissa = roundShiftRight(significand, subnormalShift);
  if (mantissa >= 0x800000u) {
    return (sign << 31) | (1u << 23);
  }
  return (sign << 31) | mantissa;
}

/**
 * Parse 8-byte memory as a float64 number according to IEEE 754
 * https://en.wikipedia.org/wiki/Double-precision_floating-point_format
 * Returns 8-byte memory as 2 float32 numbers, consisting of
 * high part: fround(d)
 * low part: d - fround(d)
 */
uvec2 parseAsDouble(uvec2 d) {
  #if LE
  d = d.yx; // to big endian
  #endif

  uint sign = (d[0] >> 31) & 1u; // first bit
  uint exponentBits = (d[0] >> 20) & 0x7ffu;
  int exponent = int(exponentBits) - 1023; // next 11 bits
  uint fractionHigh = d[0] & 0xfffffu;
  uint fractionLow = d[1];

  if (exponentBits == 0x7ffu) {
    if (fractionHigh == 0u && fractionLow == 0u) {
      return uvec2((sign << 31) | F32_INF, F32_NAN);
    }
    return uvec2(F32_NAN);
  }
  
  if (exponentBits == 0u) {
    // All float64 subnormals are too small to survive a float32 split.
    return uvec2(sign << 31);
  }

  if (exponent > 127) {
    return uvec2((sign << 31) | F32_INF, ((1u - sign) << 31) | F32_INF);
  }

  uint hi_part;
  uint low_part;

  // float64 significand has 52 bits
  // float32 significand has 23 bits
  // The significand of the high part is the significand of the double, trimmed
  uint f_hi = 0x800000u | (fractionHigh << 3) | (fractionLow >> 29);
  uint f_low = fractionLow & 0x1fffffffu;

  if (exponent < -126) {
    // For tiny normals, the top 24 significand bits still contribute to the float32
    // high part, but they land in the float32 subnormal range.
    hi_part = makeFloat(sign, exponent - 23, f_hi);

    // The residual keeps the remaining 29 significand bits at the original double scale.
    low_part = makeFloat(sign, exponent - 52, f_low);
    return uvec2(hi_part, low_part);
  }

  bool roundUp = f_low > 0x10000000u || (f_low == 0x10000000u && (f_hi & 1u) == 1u);

  uint f_rounded = f_hi + (roundUp ? 1u : 0u);
  int exponent_hi = exponent;
  if (f_rounded == 0x1000000u) {
    f_rounded = 0x800000u;
    exponent_hi++;
  }

  if (exponent_hi > 127) {
    // Overflows float32 limit
    hi_part = (sign << 31) | F32_INF;
    low_part = ((1u - sign) << 31) | F32_INF;
    return uvec2(hi_part, low_part);
  }
  
  hi_part = makeFloat_(sign, exponent_hi, f_rounded);

  int remainder = int(f_low);
  uint sign_low = sign;
  if (roundUp) {
    remainder -= 0x20000000;
  }
  if (remainder < 0) {
    sign_low = 1u - sign;
    remainder = -remainder;
  }
  low_part = makeFloat(sign_low, exponent - 52, uint(remainder));

  return uvec2(hi_part, low_part);
}

void fround(in uint x[X_LEN], out float result[X_LEN]) {
  int n = X_LEN / 2;
  for (int i = 0; i < n; i++) {
    uvec2 f = parseAsDouble(uvec2(x[i * 2], x[i * 2 + 1]));
    result[i] = uintBitsToFloat(f.x);
    result[i + n] = uintBitsToFloat(f.y);
  }
}
`,z=({inputs:e,output:t,target:n})=>(w({module:{name:`fround`,vs:R},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0});function B(e,t,n){let r=b(n),i=m(t,1),a=Array.from({length:e.size},(e,t)=>`  v[${t}] = ${i}(texelFetch(source_values_texture, ivec2(${t}, rowIndex), 0).r);`).join(`
`);return{name:`source_values_texture`,vs:`
uniform highp ${r} source_values_texture;
void read_source_values(int rowIndex, out TYPE v[${e.size}]) {
${a}
}
`}}function V(e,t,n){let r=n.createTexture({width:Math.max(e.size,1),height:e.length,format:v(t),usage:f.SAMPLE|f.COPY_DST});if(e.length===0)return r;let i=n.createCommandEncoder();return i.copyBufferToTexture({sourceBuffer:e.buffer,destinationTexture:r,byteOffset:e.offset,bytesPerRow:e.stride,rowsPerImage:e.length,size:[e.size,e.length,1]}),n.submit(i.finish()),r}var H=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=n.device,o=O(`result`,t.type,t.size),s=m(r.type,1),c=m(t.type,1),l=y(t.type),u=V(i,l,a),d={vs:`\
#version 300 es

void main() {
  INDEX_TYPE ids[1];
  get_ids(ids);
  TYPE result[${t.size}];
  gather(ids, result);
  set_result(result);
}
  `,defines:{INDEX_TYPE:s,TYPE:c,RESULT_LEN:t.size.toString(),SOURCE_VALUES_ROWS:i.length.toString()},modules:[U(r,s),B(i,t.type,l),G(t.type),o],bindings:{source_values_texture:u},bufferLayout:[W(r)],vertexCount:1,instanceCount:t.length,outputs:o.varyings};try{return p(a,d,{inputBuffers:{ids:r.buffer},outputBuffers:{[o.varyings[0]]:n}}),{success:!0}}finally{u.destroy()}};function U(e,t){let n=m(e.type,1),r=`aids_0`;return e.type!==K(t)&&(r=`${t}(${r})`),{name:`ids`,vs:`
in ${n} aids_0;
void get_ids(out INDEX_TYPE v[1]) {
  v[0] = ${r};
}
`}}function W(e){return{name:`ids`,stepMode:e.isConstant?`vertex`:`instance`,byteStride:e.stride,attributes:[{attribute:`aids_0`,format:h(e.type,1,e.normalized),byteOffset:e.offset}]}}function G(e){return{name:`gather`,vs:`
void zero_result(out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < RESULT_LEN; i++) {
    result[i] = ${g(e)};
  }
}

void gather(in INDEX_TYPE ids[1], out TYPE result[RESULT_LEN]) {
  int sourceIndex = int(ids[0]);
  if (sourceIndex < 0 || sourceIndex >= SOURCE_VALUES_ROWS) {
    zero_result(result);
    return;
  }
  read_source_values(sourceIndex, result);
}
`}}function K(e){switch(e){case`uint`:return`uint32`;case`int`:return`sint32`;default:return`float32`}}var q=`void row_dot(in TYPE x[X_LEN], in TYPE y[Y_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(y[i]);
  }
  result[0] = sum;
}
`,J=({inputs:e,output:t,target:n})=>(w({module:{name:`row_dot`,vs:q},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),Y=`void equalAll(in TYPE x[X_LEN], in TYPE y[Y_LEN], out uint result[1]) {
  uint allEqual = uint(1);
  for (int i = 0; i < X_LEN; i++) {
    if (x[i] != y[i]) {
      allEqual = uint(0);
      break;
    }
  }
  result[0] = allEqual;
}
`,X=({inputs:e,output:t,target:n})=>(w({module:{name:`equalAll`,vs:Y},inputs:e,output:t,operationType:t.type===`uint32`?e.x.type:t.type,outputBuffer:n}),{success:!0}),Z=`void row_length(in TYPE x[X_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(x[i]);
  }
  result[0] = sqrt(sum);
}
`,Q=({inputs:e,output:t,target:n})=>(w({module:{name:`row_length`,vs:Z},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),te=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=n.device,a=O(`result`,t.type,t.size),o=y(r.type),s=V(r,o,i),c={vs:`#version 300 es

void main() {
  TYPE result[RESULT_LEN];
  segmentedMap(result);
  set_result(result);
}
`,defines:{TYPE:`uint`,RESULT_LEN:t.size.toString(),SEGMENTS_LENGTH:r.length.toString()},modules:[B(r,t.type,o),ne(),a],bindings:{source_values_texture:s},vertexCount:1,instanceCount:t.length,outputs:a.varyings};try{return p(i,c,{outputBuffers:{[a.varyings[0]]:n}}),{success:!0}}finally{s.destroy()}};function ne(){return{name:`segmentedMap`,vs:`
uint read_segment_start(int segmentIndex) {
  TYPE value[1];
  read_source_values(segmentIndex, value);
  return uint(value[0]);
}

void segmentedMap(out TYPE result[RESULT_LEN]) {
  uint vertexIndex = uint(gl_InstanceID);
  int low = 0;
  int high = SEGMENTS_LENGTH;

  while (low < high) {
    int mid = low + (high - low) / 2;
    uint midStart = read_segment_start(mid);
    if (midStart <= vertexIndex) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  uint segmentIndex = uint(max(low - 1, 0));
  uint segmentStart = read_segment_start(int(segmentIndex));
  result[0] = segmentIndex;
  result[1] = vertexIndex - segmentStart;
}
`}}var re=async({inputs:e,output:t,target:n})=>{let r=g(m(t.type,1,t.normalized));return w({module:{name:`select`,vs:``},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>`(${$(`condition`,e.condition,t,r)} != ${r} ? ${$(`whenTrue`,e.whenTrue,t,r)} : ${$(`whenFalse`,e.whenFalse,t,r)})`}),{success:!0}};function $(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}var ie=({inputs:e,output:t,target:n})=>{let r=O(`result`,t.type,t.size),i={vs:`#version 300 es

void main() {
  int result[1];
  result[0] = START + gl_InstanceID * STEP;
  set_result(result);
}
`,defines:{START:e.start.toString(),STEP:e.step.toString()},modules:[r],vertexCount:1,instanceCount:t.length,outputs:r.varyings};return p(n.device,i,{outputBuffers:{[r.varyings[0]]:n}}),{success:!0}},ae=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return w({module:{name:`swizzle`,vs:`// swizzle expression handled inline`},expression:e=>`x[${r[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};export{A as arithmetic,c as castData,u as convertColors,J as dot,X as equalAll,M as extent,z as fround,H as gather,P as interleave,Q as length,te as segmentedMap,re as select,ie as sequence,ae as swizzle};