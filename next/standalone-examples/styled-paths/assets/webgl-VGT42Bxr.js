import{i as e,n as t,t as n,v as r,y as i}from"./arithmetic-expression-CIRa3iuM.js";import{u as a}from"./buffer-layout-utils-DTWE1EXl.js";import{i as o,n as s,r as c,t as l}from"./convert-colors-C2A3J3Uy.js";import{t as u}from"./expression-DmLk9S9K.js";function d(e,t,n=!1){if(n)return t===1?`float`:`vec${t}`;switch(e){case`uint8`:case`uint16`:case`uint32`:return t===1?`uint`:`uvec${t}`;case`sint8`:case`sint16`:case`sint32`:return t===1?`int`:`ivec${t}`;default:return t===1?`float`:`vec${t}`}}function f(e,t,n=!1){let r;if(n)switch(e){case`uint8`:r=`unorm8`;break;case`sint8`:r=`snorm8`;break;case`uint16`:r=`unorm16`;break;case`sint16`:r=`snorm16`;break;case`float32`:r=`float32`;break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}else r=e;return t===1?r:t===3&&!r.startsWith(`float32`)&&!r.endsWith(`32`)?`${r}x3-webgl`:`${r}x${t}`}function p(e){switch(e[0]){case`u`:return`0u`;case`s`:return`0`;default:return`0.`}}function m(e,t){switch(e){case`uint8`:case`uint16`:case`uint32`:return`${Math.trunc(t)}u`;case`sint8`:case`sint16`:case`sint32`:return`${Math.trunc(t)}`;default:return Number.isInteger(t)?`${t}.0`:`${t}`}}function h(e){switch(e){case`uint8`:return`r8uint`;case`sint8`:return`r8sint`;case`uint16`:return`r16uint`;case`sint16`:return`r16sint`;case`uint32`:return`r32uint`;case`sint32`:return`r32sint`;case`float32`:return`r32float`;default:throw Error(`Unsupported WebGL gather texture format for ${e}`)}}function g(e){return e}function _(e){switch(e){case`uint32`:return`usampler2D`;case`sint32`:return`isampler2D`;case`float32`:return`sampler2D`;default:throw Error(`Unsupported WebGL gather sampler type for ${e}`)}}var v=`GPGPU Operation Counts`,y=`Transform Runs`,b=new i;function x({module:n,elementWise:r=!1,expression:i,inputs:a,output:o,operationType:s=o.type,outputBuffer:l}){let u=l.device,f=T(`result`,o.type,o.size,o.normalized),m=[n,f],h=[],g={},_=d(o.type,1,o.normalized),x=d(s,1,o.normalized),E=``,D=null,O={TYPE:x,RESULT_LEN:o.size.toString()},k=S(a);for(let[n,r]of k)m.push(C(n,r.type,r.size,r.normalized,s)),h.push(w(n,r)),r instanceof t?g[n]=r.buffer:(D||=e.createOrReuse(u,l.byteLength),g[n]=D),E+=`TYPE ${n}[${r.size}]; get_${n}(${n});\n`,O[`${n.toUpperCase()}_LEN`]=r.size.toString();let A=``;if(i)for(let e=0;e<o.size;e++)A+=`result[${e}]=${i(e)};\n`;else if(r)for(let e=0;e<o.size;e++){let t=p(x),r=k.map(([n,r])=>e<r.size?`${n}[${e}]`:t);A+=`result[${e}]=${n.name}(${r.join(`, `)});\n`}else A=`${n.name}(${k.map(([e])=>e).join(`, `)}, result);`;let j=new c(u,{vs:`\
#version 300 es

void main() {
${E}
${_} result[${o.size}];
${A}
set_result(result);
}
  `,shaderAssembler:b,defines:O,modules:m,bufferLayout:h,vertexCount:1,instanceCount:o.length,attributes:g,feedbackBufferMode:`interleaved`,outputs:f.varyings});u.statsManager.getStats(v).get(y).incrementCount(),j.run({inputBuffers:g,outputBuffers:{[f.varyings[0]]:o.offset===0?l:{buffer:l,byteOffset:o.offset,byteLength:o.byteLength}}}),D&&e.recycle(D)}function S(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function C(e,t,n,r=!1,i=t){let a=``,o=``;for(let s=0;s<n;s+=4){let c=Math.min(n-s,4),l=d(t,c,r);a+=`in ${l} a${e}_${s};\n`;for(let n=0;n<c;n++){let a=`a${e}_${s}`;c>1&&(a=`${a}[${n}]`),(r||t!==i)&&(a=`TYPE(${a})`),o+=`v[${s+n}]=${a};\n`}}return{name:e,vs:`
${a}
void get_${e}(out TYPE v[${n}]) {
  ${o}
}
`}}function w(e,t){let n={name:e,stepMode:t.isConstant?`vertex`:`instance`,byteStride:t.stride,attributes:[]};for(let r=0;r<t.size;r+=4){let i=Math.min(t.size-r,4);n.attributes.push({attribute:`a${e}_${r}`,format:f(t.type,i,t.normalized),byteOffset:t.offset+t.ValueType.BYTES_PER_ELEMENT*r})}return n}function T(e,t,n,r=!1){let i=[],a=d(t,1,r),o=``,s=``;for(let a=0;a<n;a+=4){let c=Math.min(n-a,4),l=d(t,c,r);i.push(`${e}_${a}`),o+=`flat out ${l} ${e}_${a};\n`;let u=Array.from({length:c},(e,t)=>a+t);s+=`${e}_${a} = ${l}(${u.map(e=>`v[${e}]`).join(`,`)});\n`}return{name:e,varyings:i,vs:`
${o}
void set_${e}(in ${a} v[${n}]) {
  ${s}
}
`}}var E=`TYPE arithmetic_add(TYPE x, TYPE y) {
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
`,D=({inputs:e,output:t,target:i})=>{let a=t.type,o=d(a,1,t.normalized),s=p(o),c=e.namedInputs;return x({module:{name:`arithmetic`,dependencies:[r],vs:E},inputs:c,output:t,operationType:a,outputBuffer:i,expression:t=>u(e.expression,{operations:n,inputs:c,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>c[e].size===1?`${e}[0]`:s,formatLiteral:e=>`${o}(${m(a,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}},O=`GPGPU Operation Counts`,k=`Transform Runs`,A=({inputs:n,output:r,target:i})=>{let{sourceValues:s}=n,c=i.device;if(s.length===0){let e=new r.ValueType(r.length*r.size);return i.write(e),{success:!0,value:e}}if(s.isConstant){let e=s.value,t=new r.ValueType(r.length*r.size);for(let n=0;n<r.length;n++){let r=e[n];t[n*2]=r,t[n*2+1]=r}return i.write(t),{success:!0,value:t}}let l=c.createTexture({width:1,height:r.length,format:`rg32float`,usage:a.RENDER|a.COPY_SRC|a.COPY_DST}),u=c.createFramebuffer({colorAttachments:[l]}),d=new o(c,{vs:`#version 300 es

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
  `,topology:`point-list`,parameters:{depthCompare:`always`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendColorOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`,blendAlphaOperation:`max`},modules:[C(`sourceValues`,s.type,s.size,s.normalized)],defines:{TYPE:`float`,SOURCE_VALUES_LEN:s.size.toString(),CHANNEL_COUNT:r.length.toString()},attributes:{sourceValues:s.buffer},bufferLayout:[w(`sourceValues`,s)],instanceCount:s.length,vertexCount:r.length,disableWarnings:!0}),f=e.createOrReuse(c,r.byteLength);try{let e=c.beginRenderPass({framebuffer:u,parameters:{viewport:[0,0,1,r.length]},clearColor:[-j,-j,0,0],clearDepth:!1,clearStencil:!1});c.statsManager.getStats(O).get(k).incrementCount(),d.draw(e),e.end();let n=c.createCommandEncoder();return n.copyTextureToBuffer({sourceTexture:l,width:1,height:r.length,destinationBuffer:f,byteOffset:0,bytesPerRow:8}),c.submit(n.finish()),D({device:c,inputs:{expression:{kind:`call`,op:`multiply`,args:[{kind:`input`,name:`x`},{kind:`literal`,value:[-1,1]}]},namedInputs:{x:new t({buffer:f,size:2,type:`float32`,length:r.length})}},output:r,target:i})}finally{d.destroy(),e.recycle(f),u.destroy(),l.destroy()}},j=3e38,ee=({inputs:e,output:t,target:n})=>{let r=e.map((e,t)=>[`x${t}`,e]);M(n.device.limits.maxVertexAttributes,r),N(n.device.limits.maxInterStageShaderVariables,t);let i=r.map(([e,t])=>`in TYPE ${e}[${t.size}]`).join(`, `),a=0;return x({module:{name:`interleave`,vs:`\
void interleave(${i}, out TYPE result[RESULT_LEN]) {
${r.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  result[${a+n}] = ${e}[${n}];`).join(`
`);return a+=t.size,n}).join(`
`)}
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function M(e,t){let n=t.reduce((e,[,t])=>e+Math.ceil(t.size/4),0);if(n>e)throw Error(`interleave() requires ${n} vertex attributes, exceeding device limit ${e}`)}function N(e,t){if(t.size>e)throw Error(`interleave() output size ${t.size} exceeds device inter-stage component limit ${e}`)}function P(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var F=`\
#define LE ${P()?1:0}
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
`,I=({inputs:e,output:t,target:n})=>(x({module:{name:`fround`,vs:F},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0});function L(e,t,n){let r=_(n),i=d(t,1),a=Array.from({length:e.size},(e,t)=>`  v[${t}] = ${i}(texelFetch(source_values_texture, ivec2(${t}, rowIndex), 0).r);`).join(`
`);return{name:`source_values_texture`,vs:`
uniform highp ${r} source_values_texture;
void read_source_values(int rowIndex, out TYPE v[${e.size}]) {
${a}
}
`}}function R(e,t,n){let r=n.createTexture({width:Math.max(e.size,1),height:e.length,format:h(t),usage:a.SAMPLE|a.COPY_DST});if(e.length===0)return r;let i=n.createCommandEncoder();return i.copyBufferToTexture({sourceBuffer:e.buffer,destinationTexture:r,byteOffset:e.offset,bytesPerRow:e.stride,rowsPerImage:e.length,size:[e.size,e.length,1]}),n.submit(i.finish()),r}var z=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=n.device,o=T(`result`,t.type,t.size),s=d(r.type,1),l=d(t.type,1),u=g(t.type),f=R(i,u,a),p=new c(a,{vs:`\
#version 300 es

void main() {
  INDEX_TYPE ids[1];
  get_ids(ids);
  TYPE result[${t.size}];
  gather(ids, result);
  set_result(result);
}
  `,defines:{INDEX_TYPE:s,TYPE:l,RESULT_LEN:t.size.toString(),SOURCE_VALUES_ROWS:i.length.toString()},modules:[B(r,s),L(i,t.type,u),H(t.type),o],bindings:{source_values_texture:f},bufferLayout:[V(r)],vertexCount:1,instanceCount:t.length,feedbackBufferMode:`interleaved`,outputs:o.varyings});try{return p.run({inputBuffers:{ids:r.buffer},outputBuffers:{[o.varyings[0]]:n}}),{success:!0}}finally{p.destroy(),f.destroy()}};function B(e,t){let n=d(e.type,1),r=`aids_0`;return e.type!==U(t)&&(r=`${t}(${r})`),{name:`ids`,vs:`
in ${n} aids_0;
void get_ids(out INDEX_TYPE v[1]) {
  v[0] = ${r};
}
`}}function V(e){return{name:`ids`,stepMode:e.isConstant?`vertex`:`instance`,byteStride:e.stride,attributes:[{attribute:`aids_0`,format:f(e.type,1,e.normalized),byteOffset:e.offset}]}}function H(e){return{name:`gather`,vs:`
void zero_result(out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < RESULT_LEN; i++) {
    result[i] = ${p(e)};
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
`}}function U(e){switch(e){case`uint`:return`uint32`;case`int`:return`sint32`;default:return`float32`}}var W=`void row_dot(in TYPE x[X_LEN], in TYPE y[Y_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(y[i]);
  }
  result[0] = sum;
}
`,G=({inputs:e,output:t,target:n})=>(x({module:{name:`row_dot`,vs:W},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),K=`void equalAll(in TYPE x[X_LEN], in TYPE y[Y_LEN], out uint result[1]) {
  uint allEqual = uint(1);
  for (int i = 0; i < X_LEN; i++) {
    if (x[i] != y[i]) {
      allEqual = uint(0);
      break;
    }
  }
  result[0] = allEqual;
}
`,q=({inputs:e,output:t,target:n})=>(x({module:{name:`equalAll`,vs:K},inputs:e,output:t,operationType:t.type===`uint32`?e.x.type:t.type,outputBuffer:n}),{success:!0}),J=`void row_length(in TYPE x[X_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(x[i]);
  }
  result[0] = sqrt(sum);
}
`,Y=({inputs:e,output:t,target:n})=>(x({module:{name:`row_length`,vs:J},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),X=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=n.device,a=T(`result`,t.type,t.size),o=g(r.type),s=R(r,o,i),l=new c(i,{vs:`#version 300 es

void main() {
  TYPE result[RESULT_LEN];
  segmentedMap(result);
  set_result(result);
}
`,defines:{TYPE:`uint`,RESULT_LEN:t.size.toString(),SEGMENTS_LENGTH:r.length.toString()},modules:[L(r,t.type,o),Z(),a],bindings:{source_values_texture:s},vertexCount:1,instanceCount:t.length,feedbackBufferMode:`interleaved`,outputs:a.varyings});try{return l.run({outputBuffers:{[a.varyings[0]]:n}}),{success:!0}}finally{l.destroy(),s.destroy()}};function Z(){return{name:`segmentedMap`,vs:`
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
`}}var Q=async({inputs:e,output:t,target:n})=>{let r=p(d(t.type,1,t.normalized));return x({module:{name:`select`,vs:``},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>`(${$(`condition`,e.condition,t,r)} != ${r} ? ${$(`whenTrue`,e.whenTrue,t,r)} : ${$(`whenFalse`,e.whenFalse,t,r)})`}),{success:!0}};function $(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}var te=({inputs:e,output:t,target:n})=>{let r=T(`result`,t.type,t.size),i=new c(n.device,{vs:`#version 300 es

void main() {
  int result[1];
  result[0] = START + gl_InstanceID * STEP;
  set_result(result);
}
`,defines:{START:e.start.toString(),STEP:e.step.toString()},modules:[r],vertexCount:1,instanceCount:t.length,feedbackBufferMode:`interleaved`,outputs:r.varyings});try{return i.run({outputBuffers:{[r.varyings[0]]:n}}),{success:!0}}finally{i.destroy()}},ne=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return x({module:{name:`swizzle`,vs:`// swizzle expression handled inline`},expression:e=>`x[${r[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};export{D as arithmetic,s as castData,l as convertColors,G as dot,q as equalAll,A as extent,I as fround,z as gather,ee as interleave,Y as length,X as segmentedMap,Q as select,te as sequence,ne as swizzle};