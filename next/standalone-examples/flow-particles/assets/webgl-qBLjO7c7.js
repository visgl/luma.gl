import{r as e}from"./render-pipeline-B_DVfmJJ.js";import{t}from"./texture-TAAMwJlv.js";import{a as n,f as r,n as i,p as a,r as o,t as s}from"./expression-qJkyoRIK.js";import{a as c,i as l,n as u,r as d,t as f}from"./render-kernel-jDAzhRbu.js";function p(t,n,i){let{vs:a,fs:o}=(n.shaderAssembler??new c).assembleGLSLShaderPair({platformInfo:r(t),vs:n.vs,fs:l(),modules:n.modules,defines:n.defines}),s=n.bufferLayout??[],u=new f(t,{vertexSource:a,fragmentSource:o,topology:`point-list`,bufferLayout:s,varyings:n.outputs,bufferMode:35980}),d,p;try{d=t.createVertexArray({shaderLayout:u.pipeline.shaderLayout,bufferLayout:s});let r={...n.attributes,...i.inputBuffers};for(let t of u.pipeline.shaderLayout.attributes){let n=s.find(e=>e.attributes?e.attributes.some(e=>e.attribute===t.name):e.name===t.name),i=n&&r[n.name];e(i),d.setBuffer(t.location,i)}p=t.createTransformFeedback({layout:u.pipeline.shaderLayout,buffers:i.outputBuffers});let a=t.beginRenderPass({discard:!0});try{u.draw(a,{vertexArray:d,transformFeedback:p,bindings:n.bindings,vertexCount:n.vertexCount,instanceCount:n.instanceCount})}finally{a.end()}}finally{p?.destroy(),d?.destroy(),u.destroy()}}function m(e,t,n=!1){if(n)return t===1?`float`:`vec${t}`;switch(e){case`uint8`:case`uint16`:case`uint32`:return t===1?`uint`:`uvec${t}`;case`sint8`:case`sint16`:case`sint32`:return t===1?`int`:`ivec${t}`;default:return t===1?`float`:`vec${t}`}}function h(e,t,n=!1){let r;if(n)switch(e){case`uint8`:r=`unorm8`;break;case`sint8`:r=`snorm8`;break;case`uint16`:r=`unorm16`;break;case`sint16`:r=`snorm16`;break;case`float32`:r=`float32`;break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}else r=e;return t===1?r:t===3&&!r.startsWith(`float32`)&&!r.endsWith(`32`)?`${r}x3-webgl`:`${r}x${t}`}function g(e){switch(e[0]){case`u`:return`0u`;case`s`:return`0`;default:return`0.`}}function _(e,t){switch(e){case`uint8`:case`uint16`:case`uint32`:return`${Math.trunc(t)}u`;case`sint8`:case`sint16`:case`sint32`:return`${Math.trunc(t)}`;default:return Number.isInteger(t)?`${t}.0`:`${t}`}}function v(e){switch(e){case`uint8`:return`r8uint`;case`sint8`:return`r8sint`;case`uint16`:return`r16uint`;case`sint16`:return`r16sint`;case`uint32`:return`r32uint`;case`sint32`:return`r32sint`;case`float32`:return`r32float`;default:throw Error(`Unsupported WebGL gather texture format for ${e}`)}}function y(e){return e}function b(e){switch(e){case`uint32`:return`usampler2D`;case`sint32`:return`isampler2D`;case`float32`:return`sampler2D`;default:throw Error(`Unsupported WebGL gather sampler type for ${e}`)}}var x=`GPGPU Operation Counts`,S=`Transform Runs`,C=new c;function w({module:e,elementWise:t=!1,expression:r,inputs:i,output:a,operationType:s=a.type,outputBuffer:c}){let l=c.device,u=O(`result`,a.type,a.size,a.normalized),d=[e,u],f=[],h={},_=m(a.type,1,a.normalized),v=m(s,1,a.normalized),y=``,b=null,w={TYPE:v,RESULT_LEN:a.size.toString()},k=T(i);for(let[e,t]of k)d.push(E(e,t.type,t.size,t.normalized,s)),f.push(D(e,t)),t instanceof o?h[e]=t.buffer:(b||=n.createOrReuse(l,c.byteLength),h[e]=b),y+=`TYPE ${e}[${t.size}]; get_${e}(${e});\n`,w[`${e.toUpperCase()}_LEN`]=t.size.toString();let A=``;if(r)for(let e=0;e<a.size;e++)A+=`result[${e}]=${r(e)};\n`;else if(t)for(let t=0;t<a.size;t++){let n=g(v),r=k.map(([e,r])=>t<r.size?`${e}[${t}]`:n);A+=`result[${t}]=${e.name}(${r.join(`, `)});\n`}else A=`${e.name}(${k.map(([e])=>e).join(`, `)}, result);`;let j={vs:`\
#version 300 es

void main() {
${y}
${_} result[${a.size}];
${A}
set_result(result);
}
  `,shaderAssembler:C,defines:w,modules:d,bufferLayout:f,vertexCount:1,instanceCount:a.length,attributes:h,outputs:u.varyings};l.statsManager.getStats(x).get(S).incrementCount();try{p(l,j,{inputBuffers:h,outputBuffers:{[u.varyings[0]]:a.offset===0?c:{buffer:c,byteOffset:a.offset,byteLength:a.byteLength}}})}finally{b&&n.recycle(b)}}function T(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function E(e,t,n,r=!1,i=t){let a=``,o=``;for(let s=0;s<n;s+=4){let c=Math.min(n-s,4),l=m(t,c,r);a+=`in ${l} a${e}_${s};\n`;for(let n=0;n<c;n++){let a=`a${e}_${s}`;c>1&&(a=`${a}[${n}]`),(r||t!==i)&&(a=`TYPE(${a})`),o+=`v[${s+n}]=${a};\n`}}return{name:e,vs:`
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
`,A=({inputs:e,output:t,target:n})=>{let r=t.type,o=m(r,1,t.normalized),c=g(o),l=e.namedInputs;return w({module:{name:`arithmetic`,dependencies:[a],vs:k},inputs:l,output:t,operationType:r,outputBuffer:n,expression:t=>s(e.expression,{operations:i,inputs:l,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>l[e].size===1?`${e}[0]`:c,formatLiteral:e=>`${o}(${_(r,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}},j=`GPGPU Operation Counts`,M=`Transform Runs`,ee=({inputs:e,output:i,target:a})=>{let{sourceValues:s}=e,l=a.device;if(s.length===0){let e=new i.ValueType(i.length*i.size);return a.write(e),{success:!0,value:e}}if(s.isConstant){let e=s.value,t=new i.ValueType(i.length*i.size);for(let n=0;n<i.length;n++){let r=e[n];t[n*2]=r,t[n*2+1]=r}return a.write(t),{success:!0,value:t}}let u=l.createTexture({width:1,height:i.length,format:`rg32float`,usage:t.RENDER|t.COPY_SRC|t.COPY_DST}),d=l.createFramebuffer({colorAttachments:[u]}),{vs:p,fs:m}=new c().assembleGLSLShaderPair({platformInfo:r(l),vs:`#version 300 es

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
  `,modules:[E(`sourceValues`,s.type,s.size,s.normalized)],defines:{TYPE:`float`,SOURCE_VALUES_LEN:s.size,CHANNEL_COUNT:i.length}}),h=[D(`sourceValues`,s)],g=new f(l,{vertexSource:p,fragmentSource:m,topology:`point-list`,parameters:{depthCompare:`always`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendColorOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`,blendAlphaOperation:`max`},bufferLayout:h,disableWarnings:!0}),_=l.createVertexArray({shaderLayout:g.pipeline.shaderLayout,bufferLayout:h});for(let e of g.pipeline.shaderLayout.attributes)_.setBuffer(e.location,s.buffer);let v=n.createOrReuse(l,i.byteLength);try{let e=l.beginRenderPass({framebuffer:d,parameters:{viewport:[0,0,1,i.length]},clearColor:[-N,-N,0,0],clearDepth:!1,clearStencil:!1});l.statsManager.getStats(j).get(M).incrementCount(),g.draw(e,{vertexArray:_,vertexCount:i.length,instanceCount:s.length}),e.end();let t=l.createCommandEncoder();return t.copyTextureToBuffer({sourceTexture:u,width:1,height:i.length,destinationBuffer:v,byteOffset:0,bytesPerRow:8}),l.submit(t.finish()),A({device:l,inputs:{expression:{kind:`call`,op:`multiply`,args:[{kind:`input`,name:`x`},{kind:`literal`,value:[-1,1]}]},namedInputs:{x:new o({buffer:v,size:2,type:`float32`,length:i.length})}},output:i,target:a})}finally{_.destroy(),g.destroy(),n.recycle(v),d.destroy(),u.destroy()}},N=3e38,P=({inputs:e,output:t,target:n})=>{let r=e.map((e,t)=>[`x${t}`,e]);F(n.device.limits.maxVertexAttributes,r),I(n.device.limits.maxInterStageShaderVariables,t);let i=r.map(([e,t])=>`in TYPE ${e}[${t.size}]`).join(`, `),a=0;return w({module:{name:`interleave`,vs:`\
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
`}}function V(e,n,r){let i=r.createTexture({width:Math.max(e.size,1),height:e.length,format:v(n),usage:t.SAMPLE|t.COPY_DST});if(e.length===0)return i;let a=r.createCommandEncoder();return a.copyBufferToTexture({sourceBuffer:e.buffer,destinationTexture:i,byteOffset:e.offset,bytesPerRow:e.stride,rowsPerImage:e.length,size:[e.size,e.length,1]}),r.submit(a.finish()),i}var H=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=n.device,o=O(`result`,t.type,t.size),s=m(r.type,1),c=m(t.type,1),l=y(t.type),u=V(i,l,a),d={vs:`\
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
`,defines:{START:e.start.toString(),STEP:e.step.toString()},modules:[r],vertexCount:1,instanceCount:t.length,outputs:r.varyings};return p(n.device,i,{outputBuffers:{[r.varyings[0]]:n}}),{success:!0}},ae=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return w({module:{name:`swizzle`,vs:`// swizzle expression handled inline`},expression:e=>`x[${r[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};export{A as arithmetic,d as castData,u as convertColors,J as dot,X as equalAll,ee as extent,z as fround,H as gather,P as interleave,Q as length,te as segmentedMap,re as select,ie as sequence,ae as swizzle};