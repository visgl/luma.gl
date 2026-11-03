import{r as e}from"./render-pipeline-B_DVfmJJ.js";import{t}from"./texture-TAAMwJlv.js";import{F as n,P as r,a as i,f as a,n as o,p as s,r as c,t as l}from"./expression-qJkyoRIK.js";import{i as u,n as d,r as f,t as p}from"./convert-colors-CXz-xosx.js";var m=class e{static async createAsync(t,r){let i=!n.getAsyncCompilation(t),a=i?n.beginAsyncCompilation(t):n.getAsyncCompilation(t),o;try{o=new e(t,r)}finally{i&&n.endAsyncCompilation(t,a)}try{return i?await Promise.all(a):await o._pipelineInitialization,o}catch(e){throw o.destroy(),e}}device;id;vertexSource;fragmentSource;pipelineFactory;shaderFactory;vertexShader;fragmentShader;pipeline;_pipelineInitialization;_destroyed=!1;drawDefaults;constructor(e,t){if(e.type!==`webgpu`&&e.type!==`webgl`)throw Error(`RenderKernel requires WebGL or WebGPU`);if(e.type===`webgl`&&!t.fragmentSource)throw Error(`WebGL RenderKernel requires a fragment shader`);let{vertexSource:i,fragmentSource:a,pipelineFactory:o,shaderFactory:s,debugShaders:c,...l}=t;this.device=e,this.drawDefaults={parameters:t.parameters??{},topology:t.topology??`triangle-list`},this.id=t.id??`render-kernel`,this.vertexSource=i,this.fragmentSource=a,this.pipelineFactory=o??n.getDefaultPipelineFactory(e),this.shaderFactory=s??r.getDefaultShaderFactory(e),this.vertexShader=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.vertexSource,debugShaders:c}),this.fragmentShader=this.fragmentSource?this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fragmentSource,debugShaders:c}):null;let u={...l,vs:this.vertexShader,fs:this.fragmentShader},d=n.getAsyncCompilation(e);if(d){let e=this.pipelineFactory.createRenderPipelineAsync(u);this._pipelineInitialization=e,d.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createRenderPipeline(u)}draw(e,t){let{bindings:n={},vertexArray:r,...i}=t;return this._setPipeline(e,n,r),e.draw(this.device.type===`webgl`?{...this.drawDefaults,...i,isInstanced:i.isInstanced??i.instanceCount!==void 0}:i)}drawIndirect(e,t){if(this.device.type!==`webgpu`)throw Error(`Indirect drawing is only supported in WebGPU`);let{bindings:n={},vertexArray:r,indirectBuffer:i,indirectOffset:a=0}=t;this._setPipeline(e,n,r),e.drawIndirect(i,a)}drawIndexedIndirect(e,t){if(this.device.type!==`webgpu`)throw Error(`Indirect drawing is only supported in WebGPU`);let{bindings:n={},vertexArray:r,indirectBuffer:i,indirectOffset:a=0}=t;this._setPipeline(e,n,r),e.drawIndexedIndirect(i,a)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.vertexShader),this.fragmentShader&&this.shaderFactory.release(this.fragmentShader),!0)}_setPipeline(e,t,n){e.setPipeline(this.pipeline),e.setBindings(t),e.setVertexArray(n)}};function h(t,n,r){let{vs:i,fs:o}=(n.shaderAssembler??new u).assembleGLSLShaderPair({platformInfo:a(t),vs:n.vs,fs:f(),modules:n.modules,defines:n.defines}),s=n.bufferLayout??[],c=new m(t,{vertexSource:i,fragmentSource:o,topology:`point-list`,bufferLayout:s,varyings:n.outputs,bufferMode:35980}),l,d;try{l=t.createVertexArray({shaderLayout:c.pipeline.shaderLayout,bufferLayout:s});let i={...n.attributes,...r.inputBuffers};for(let t of c.pipeline.shaderLayout.attributes){let n=s.find(e=>e.attributes?e.attributes.some(e=>e.attribute===t.name):e.name===t.name),r=n&&i[n.name];e(r),l.setBuffer(t.location,r)}d=t.createTransformFeedback({layout:c.pipeline.shaderLayout,buffers:r.outputBuffers});let a=t.beginRenderPass({discard:!0});try{c.draw(a,{vertexArray:l,transformFeedback:d,bindings:n.bindings,vertexCount:n.vertexCount,instanceCount:n.instanceCount})}finally{a.end()}}finally{d?.destroy(),l?.destroy(),c.destroy()}}function g(e,t,n=!1){if(n)return t===1?`float`:`vec${t}`;switch(e){case`uint8`:case`uint16`:case`uint32`:return t===1?`uint`:`uvec${t}`;case`sint8`:case`sint16`:case`sint32`:return t===1?`int`:`ivec${t}`;default:return t===1?`float`:`vec${t}`}}function _(e,t,n=!1){let r;if(n)switch(e){case`uint8`:r=`unorm8`;break;case`sint8`:r=`snorm8`;break;case`uint16`:r=`unorm16`;break;case`sint16`:r=`snorm16`;break;case`float32`:r=`float32`;break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}else r=e;return t===1?r:t===3&&!r.startsWith(`float32`)&&!r.endsWith(`32`)?`${r}x3-webgl`:`${r}x${t}`}function v(e){switch(e[0]){case`u`:return`0u`;case`s`:return`0`;default:return`0.`}}function y(e,t){switch(e){case`uint8`:case`uint16`:case`uint32`:return`${Math.trunc(t)}u`;case`sint8`:case`sint16`:case`sint32`:return`${Math.trunc(t)}`;default:return Number.isInteger(t)?`${t}.0`:`${t}`}}function b(e){switch(e){case`uint8`:return`r8uint`;case`sint8`:return`r8sint`;case`uint16`:return`r16uint`;case`sint16`:return`r16sint`;case`uint32`:return`r32uint`;case`sint32`:return`r32sint`;case`float32`:return`r32float`;default:throw Error(`Unsupported WebGL gather texture format for ${e}`)}}function x(e){return e}function S(e){switch(e){case`uint32`:return`usampler2D`;case`sint32`:return`isampler2D`;case`float32`:return`sampler2D`;default:throw Error(`Unsupported WebGL gather sampler type for ${e}`)}}var ee=`GPGPU Operation Counts`,C=`Transform Runs`,w=new u;function T({module:e,elementWise:t=!1,expression:n,inputs:r,output:a,operationType:o=a.type,outputBuffer:s}){let l=s.device,u=O(`result`,a.type,a.size,a.normalized),d=[e,u],f=[],p={},m=g(a.type,1,a.normalized),_=g(o,1,a.normalized),y=``,b=null,x={TYPE:_,RESULT_LEN:a.size.toString()},S=te(r);for(let[e,t]of S)d.push(E(e,t.type,t.size,t.normalized,o)),f.push(D(e,t)),t instanceof c?p[e]=t.buffer:(b||=i.createOrReuse(l,s.byteLength),p[e]=b),y+=`TYPE ${e}[${t.size}]; get_${e}(${e});\n`,x[`${e.toUpperCase()}_LEN`]=t.size.toString();let T=``;if(n)for(let e=0;e<a.size;e++)T+=`result[${e}]=${n(e)};\n`;else if(t)for(let t=0;t<a.size;t++){let n=v(_),r=S.map(([e,r])=>t<r.size?`${e}[${t}]`:n);T+=`result[${t}]=${e.name}(${r.join(`, `)});\n`}else T=`${e.name}(${S.map(([e])=>e).join(`, `)}, result);`;let k={vs:`\
#version 300 es

void main() {
${y}
${m} result[${a.size}];
${T}
set_result(result);
}
  `,shaderAssembler:w,defines:x,modules:d,bufferLayout:f,vertexCount:1,instanceCount:a.length,attributes:p,outputs:u.varyings};l.statsManager.getStats(ee).get(C).incrementCount();try{h(l,k,{inputBuffers:p,outputBuffers:{[u.varyings[0]]:a.offset===0?s:{buffer:s,byteOffset:a.offset,byteLength:a.byteLength}}})}finally{b&&i.recycle(b)}}function te(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function E(e,t,n,r=!1,i=t){let a=``,o=``;for(let s=0;s<n;s+=4){let c=Math.min(n-s,4),l=g(t,c,r);a+=`in ${l} a${e}_${s};\n`;for(let n=0;n<c;n++){let a=`a${e}_${s}`;c>1&&(a=`${a}[${n}]`),(r||t!==i)&&(a=`TYPE(${a})`),o+=`v[${s+n}]=${a};\n`}}return{name:e,vs:`
${a}
void get_${e}(out TYPE v[${n}]) {
  ${o}
}
`}}function D(e,t){let n={name:e,stepMode:t.isConstant?`vertex`:`instance`,byteStride:t.stride,attributes:[]};for(let r=0;r<t.size;r+=4){let i=Math.min(t.size-r,4);n.attributes.push({attribute:`a${e}_${r}`,format:_(t.type,i,t.normalized),byteOffset:t.offset+t.ValueType.BYTES_PER_ELEMENT*r})}return n}function O(e,t,n,r=!1){let i=[],a=g(t,1,r),o=``,s=``;for(let a=0;a<n;a+=4){let c=Math.min(n-a,4),l=g(t,c,r);i.push(`${e}_${a}`),o+=`flat out ${l} ${e}_${a};\n`;let u=Array.from({length:c},(e,t)=>a+t);s+=`${e}_${a} = ${l}(${u.map(e=>`v[${e}]`).join(`,`)});\n`}return{name:e,varyings:i,vs:`
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
`,A=({inputs:e,output:t,target:n})=>{let r=t.type,i=g(r,1,t.normalized),a=v(i),c=e.namedInputs;return T({module:{name:`arithmetic`,dependencies:[s],vs:k},inputs:c,output:t,operationType:r,outputBuffer:n,expression:t=>l(e.expression,{operations:o,inputs:c,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>c[e].size===1?`${e}[0]`:a,formatLiteral:e=>`${i}(${y(r,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}},j=`GPGPU Operation Counts`,M=`Transform Runs`,N=({inputs:e,output:n,target:r})=>{let{sourceValues:o}=e,s=r.device;if(o.length===0){let e=new n.ValueType(n.length*n.size);return r.write(e),{success:!0,value:e}}if(o.isConstant){let e=o.value,t=new n.ValueType(n.length*n.size);for(let r=0;r<n.length;r++){let n=e[r];t[r*2]=n,t[r*2+1]=n}return r.write(t),{success:!0,value:t}}let l=s.createTexture({width:1,height:n.length,format:`rg32float`,usage:t.RENDER|t.COPY_SRC|t.COPY_DST}),d=s.createFramebuffer({colorAttachments:[l]}),{vs:f,fs:p}=new u().assembleGLSLShaderPair({platformInfo:a(s),vs:`#version 300 es

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
  `,modules:[E(`sourceValues`,o.type,o.size,o.normalized)],defines:{TYPE:`float`,SOURCE_VALUES_LEN:o.size,CHANNEL_COUNT:n.length}}),h=[D(`sourceValues`,o)],g=new m(s,{vertexSource:f,fragmentSource:p,topology:`point-list`,parameters:{depthCompare:`always`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendColorOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`,blendAlphaOperation:`max`},bufferLayout:h,disableWarnings:!0}),_=s.createVertexArray({shaderLayout:g.pipeline.shaderLayout,bufferLayout:h});for(let e of g.pipeline.shaderLayout.attributes)_.setBuffer(e.location,o.buffer);let v=i.createOrReuse(s,n.byteLength);try{let e=s.beginRenderPass({framebuffer:d,parameters:{viewport:[0,0,1,n.length]},clearColor:[-P,-P,0,0],clearDepth:!1,clearStencil:!1});s.statsManager.getStats(j).get(M).incrementCount(),g.draw(e,{vertexArray:_,vertexCount:n.length,instanceCount:o.length}),e.end();let t=s.createCommandEncoder();return t.copyTextureToBuffer({sourceTexture:l,width:1,height:n.length,destinationBuffer:v,byteOffset:0,bytesPerRow:8}),s.submit(t.finish()),A({device:s,inputs:{expression:{kind:`call`,op:`multiply`,args:[{kind:`input`,name:`x`},{kind:`literal`,value:[-1,1]}]},namedInputs:{x:new c({buffer:v,size:2,type:`float32`,length:n.length})}},output:n,target:r})}finally{_.destroy(),g.destroy(),i.recycle(v),d.destroy(),l.destroy()}},P=3e38,F=({inputs:e,output:t,target:n})=>{let r=e.map((e,t)=>[`x${t}`,e]);I(n.device.limits.maxVertexAttributes,r),L(n.device.limits.maxInterStageShaderVariables,t);let i=r.map(([e,t])=>`in TYPE ${e}[${t.size}]`).join(`, `),a=0;return T({module:{name:`interleave`,vs:`\
void interleave(${i}, out TYPE result[RESULT_LEN]) {
${r.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  result[${a+n}] = ${e}[${n}];`).join(`
`);return a+=t.size,n}).join(`
`)}
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function I(e,t){let n=t.reduce((e,[,t])=>e+Math.ceil(t.size/4),0);if(n>e)throw Error(`interleave() requires ${n} vertex attributes, exceeding device limit ${e}`)}function L(e,t){if(t.size>e)throw Error(`interleave() output size ${t.size} exceeds device inter-stage component limit ${e}`)}function R(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var z=`\
#define LE ${R()?1:0}
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
`,B=({inputs:e,output:t,target:n})=>(T({module:{name:`fround`,vs:z},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0});function V(e,t,n){let r=S(n),i=g(t,1),a=Array.from({length:e.size},(e,t)=>`  v[${t}] = ${i}(texelFetch(source_values_texture, ivec2(${t}, rowIndex), 0).r);`).join(`
`);return{name:`source_values_texture`,vs:`
uniform highp ${r} source_values_texture;
void read_source_values(int rowIndex, out TYPE v[${e.size}]) {
${a}
}
`}}function H(e,n,r){let i=r.createTexture({width:Math.max(e.size,1),height:e.length,format:b(n),usage:t.SAMPLE|t.COPY_DST});if(e.length===0)return i;let a=r.createCommandEncoder();return a.copyBufferToTexture({sourceBuffer:e.buffer,destinationTexture:i,byteOffset:e.offset,bytesPerRow:e.stride,rowsPerImage:e.length,size:[e.size,e.length,1]}),r.submit(a.finish()),i}var U=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=n.device,o=O(`result`,t.type,t.size),s=g(r.type,1),c=g(t.type,1),l=x(t.type),u=H(i,l,a),d={vs:`\
#version 300 es

void main() {
  INDEX_TYPE ids[1];
  get_ids(ids);
  TYPE result[${t.size}];
  gather(ids, result);
  set_result(result);
}
  `,defines:{INDEX_TYPE:s,TYPE:c,RESULT_LEN:t.size.toString(),SOURCE_VALUES_ROWS:i.length.toString()},modules:[W(r,s),V(i,t.type,l),K(t.type),o],bindings:{source_values_texture:u},bufferLayout:[G(r)],vertexCount:1,instanceCount:t.length,outputs:o.varyings};try{return h(a,d,{inputBuffers:{ids:r.buffer},outputBuffers:{[o.varyings[0]]:n}}),{success:!0}}finally{u.destroy()}};function W(e,t){let n=g(e.type,1),r=`aids_0`;return e.type!==q(t)&&(r=`${t}(${r})`),{name:`ids`,vs:`
in ${n} aids_0;
void get_ids(out INDEX_TYPE v[1]) {
  v[0] = ${r};
}
`}}function G(e){return{name:`ids`,stepMode:e.isConstant?`vertex`:`instance`,byteStride:e.stride,attributes:[{attribute:`aids_0`,format:_(e.type,1,e.normalized),byteOffset:e.offset}]}}function K(e){return{name:`gather`,vs:`
void zero_result(out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < RESULT_LEN; i++) {
    result[i] = ${v(e)};
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
`}}function q(e){switch(e){case`uint`:return`uint32`;case`int`:return`sint32`;default:return`float32`}}var J=`void row_dot(in TYPE x[X_LEN], in TYPE y[Y_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(y[i]);
  }
  result[0] = sum;
}
`,Y=({inputs:e,output:t,target:n})=>(T({module:{name:`row_dot`,vs:J},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),X=`void equalAll(in TYPE x[X_LEN], in TYPE y[Y_LEN], out uint result[1]) {
  uint allEqual = uint(1);
  for (int i = 0; i < X_LEN; i++) {
    if (x[i] != y[i]) {
      allEqual = uint(0);
      break;
    }
  }
  result[0] = allEqual;
}
`,Z=({inputs:e,output:t,target:n})=>(T({module:{name:`equalAll`,vs:X},inputs:e,output:t,operationType:t.type===`uint32`?e.x.type:t.type,outputBuffer:n}),{success:!0}),ne=`void row_length(in TYPE x[X_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(x[i]);
  }
  result[0] = sqrt(sum);
}
`,Q=({inputs:e,output:t,target:n})=>(T({module:{name:`row_length`,vs:ne},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),re=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=n.device,a=O(`result`,t.type,t.size),o=x(r.type),s=H(r,o,i),c={vs:`#version 300 es

void main() {
  TYPE result[RESULT_LEN];
  segmentedMap(result);
  set_result(result);
}
`,defines:{TYPE:`uint`,RESULT_LEN:t.size.toString(),SEGMENTS_LENGTH:r.length.toString()},modules:[V(r,t.type,o),ie(),a],bindings:{source_values_texture:s},vertexCount:1,instanceCount:t.length,outputs:a.varyings};try{return h(i,c,{outputBuffers:{[a.varyings[0]]:n}}),{success:!0}}finally{s.destroy()}};function ie(){return{name:`segmentedMap`,vs:`
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
`}}var ae=async({inputs:e,output:t,target:n})=>{let r=v(g(t.type,1,t.normalized));return T({module:{name:`select`,vs:``},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>`(${$(`condition`,e.condition,t,r)} != ${r} ? ${$(`whenTrue`,e.whenTrue,t,r)} : ${$(`whenFalse`,e.whenFalse,t,r)})`}),{success:!0}};function $(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}var oe=({inputs:e,output:t,target:n})=>{let r=O(`result`,t.type,t.size),i={vs:`#version 300 es

void main() {
  int result[1];
  result[0] = START + gl_InstanceID * STEP;
  set_result(result);
}
`,defines:{START:e.start.toString(),STEP:e.step.toString()},modules:[r],vertexCount:1,instanceCount:t.length,outputs:r.varyings};return h(n.device,i,{outputBuffers:{[r.varyings[0]]:n}}),{success:!0}},se=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return T({module:{name:`swizzle`,vs:`// swizzle expression handled inline`},expression:e=>`x[${r[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};export{A as arithmetic,d as castData,p as convertColors,Y as dot,Z as equalAll,N as extent,B as fround,U as gather,F as interleave,Q as length,re as segmentedMap,ae as select,oe as sequence,se as swizzle};