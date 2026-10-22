import{t as e}from"./compute-pipeline-DMOuMYt6.js";import{C as t,D as n,E as r,S as i,T as a,_ as o,a as s,d as c,f as l,g as u,h as d,n as f,r as p,t as m,u as h,v as g,w as _,x as v,y}from"./expression-CNK1BYV5.js";import{_ as b,l as x,m as S,o as ee}from"./shader-type-decoder-DAw-4A6z.js";var C=2,w=1e4,T=class s{static async createAsync(e,t){let r=!n.getAsyncCompilation(e),i=r?n.beginAsyncCompilation(e):n.getAsyncCompilation(e),a;try{a=new s(e,t)}finally{r&&n.endAsyncCompilation(e,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}static defaultProps={...e.defaultProps,id:`unnamed`,handle:void 0,userData:{},source:``,sourceLanguage:void 0,modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:v.getDefaultShaderAssembler(`wgsl`),debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate=`newly created`;_getModuleUniforms;props;_destroyed=!1;_pipelineInitialization;constructor(e,a){if(e.type!==`webgpu`)throw Error(`Computation is only supported in WebGPU`);this.props={...s.defaultProps,...a},a=this.props,this.id=a.id||g(`model`),this.device=e,Object.assign(this.userData,a.userData);let o=l(e),c=_(this.props.plugins,o.shaderLanguage);if(Object.keys(c.vertexInputs).length>0||Object.keys(c.varyings).length>0)throw Error(`Computation does not support ShaderPlugin vertex inputs or varyings`);let f=t(this.props.modules,c.modules),p=Object.fromEntries(f.map(e=>[e.name,e]));this.shaderInputs=a.shaderInputs||new h(p),a.shaderInputs&&c.modules.length>0&&this.shaderInputs.addModules(c.modules),this.setShaderInputs(this.shaderInputs);let m=u(this.props.modules,this.shaderInputs?.getModules()),v={...c.defines,...this.props.defines};this.props.shaderLayout=d(this.props.shaderLayout,m)||null,this.pipelineFactory=a.pipelineFactory||n.getDefaultPipelineFactory(this.device),this.shaderFactory=a.shaderFactory||r.getDefaultShaderFactory(this.device);let y=this.props.shaderAssembler;ee(y instanceof i);let{source:b,getUniforms:x,entryPoints:S={},shaderLayout:C}=y.assembleWGSLShader({platformInfo:o,...this.props,modules:m,defines:v,shaderStage:`compute`,computeEntryPoint:this.props.entryPoint,scanVertexAttributes:!1,pluginInjections:c.injections});this.source=b,this.props.entryPoint=S.compute||this.props.entryPoint,this._getModuleUniforms=x;let w=C??e.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=d(this.props.shaderLayout||w||null,m)||null;let T=n.getAsyncCompilation(this.device);T?(this._pipelineInitialization=this._updatePipelineAsync(),T.push(this._pipelineInitialization)):this.pipeline=this._updatePipeline(),a.bindings&&this.setBindings(a.bindings)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shader&&this.shaderFactory.release(this.shader),this._uniformStore.destroy(),!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new a(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(o(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(e=>{let n=t[e];return!c(n)&&typeof n!=`number`&&typeof n!=`boolean`}),r={};for(let e of n)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){let e=this._preparePipelineUpdate();return e&&(this.pipeline=this.pipelineFactory.createComputePipeline(e.props),this._finishPipelineUpdate(e.previousShader)),this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createComputePipelineAsync(e.props)}catch(t){throw this.shaderFactory.release(this.shader),this.shader=e.previousShader,this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e.previousShader)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?this.shader:null;return this.pipeline&&b.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`compute`,source:this.source,debugShaders:this.props.debugShaders}),{props:{...this.props,shader:this.shader},previousShader:e}}_finishPipelineUpdate(e){e&&this.shaderFactory.release(e)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=b.level>3?0:w;b.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,b.group(C,`>>> DRAWING MODEL ${this.id}`,{collapsed:b.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();b.table(C,e)(),b.groupEnd(C)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let n=x.getTypedArrayConstructor(t);return(e instanceof S?new n(e.debugData):e).toString()}},te=65535;function E(e,t){let n=ne(t),r=Math.max(1,Math.ceil(e)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`WebGPU dispatch requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function D(e,t=`workgroupId`){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function O(e,t,n=`workgroupId`,r=`localId`){return`(${D(e,n)} * ${t}u + ${r}.x)`}function ne(e){return Number.isFinite(e)&&e>0?Math.floor(e):te}function k(e,t){switch(e){case`u32`:return`${t}u`;case`f32`:return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function re(e,t){switch(e){case`uint32`:return k(`u32`,Math.trunc(t));case`sint32`:return`${Math.trunc(t)}`;case`float32`:return k(`f32`,t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function A(e){switch(e){case`uint32`:return`0u`;case`sint32`:return`0`;case`float32`:return`0.0`;default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function j(e){switch(e){case`uint32`:return`u32`;case`sint32`:return`i32`;case`float32`:return`f32`;default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}var M=64,ie=`GPGPU Operation Counts`,ae=`Computation Runs`,oe=new i;function N({module:e,elementWise:t=!1,expression:n,inputs:r,output:i,operationType:a=i.type,outputBuffer:o}){if(!e.source)throw Error(`WebGPU computation ${e.name} requires WGSL source`);let s=L(r),c=s.map(([e,t])=>({name:e,input:t})),l=c.filter(({input:e})=>!e.isConstant).map((e,t)=>({...e,index:t})),u=j(a),d=j(i.type),f={TYPE:u,RESULT_LEN:i.size.toString()},p=E(Math.ceil(i.length/M),o.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of s)f[`${e.toUpperCase()}_LEN`]=t.size.toString();let m=`
${z(e.source,f)}
${l.map(({name:e,input:t,index:n})=>se(e,t,n)).join(`
`)}
${c.map(({name:e,input:t})=>ce(e,t,a)).join(`
`)}
${P(i,l.length)}
${F(i)}

@compute @workgroup_size(${M}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${O(p,M)};
  if (rowIndex >= ${i.length}u) {
    return;
  }

${c.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join(`
`)}
  var result: array<${d}, ${i.size}>;
${I(e.name,s,i,t,n)}
  write_result(rowIndex, result);
}
`,h=new T(o.device,{source:m,modules:e.dependencies,shaderAssembler:oe,shaderLayout:{bindings:[...l.map(({name:e},t)=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:l.length}]}}),g=Object.fromEntries(l.map(({name:e,input:t})=>[e,t.buffer]));g.result=o,h.setBindings(g);let _=o.device.beginComputePass({});o.device.statsManager.getStats(ie).get(ae).incrementCount(),h.dispatch(_,p.x,p.y,p.z),_.end(),o.device.submit(),h.destroy()}function se(e,t,n){return t.isConstant?``:`@group(0) @binding(${n}) var<storage, read> ${e}: array<${j(t.type)}>;`}function ce(e,t,n){let r=j(n),i=t.type===n?``:r,a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT;return t.isConstant?`fn read_${e}(_rowIndex: u32) -> array<${r}, ${t.size}> {
  return array<${r}, ${t.size}>(${R(t,i)});
}`:`fn read_${e}(rowIndex: u32) -> array<${r}, ${t.size}> {
  var value: array<${r}, ${t.size}>;
  let rowOffset = ${o}u + rowIndex * ${a}u;
${Array.from({length:t.size},(t,n)=>i?`  value[${n}] = ${i}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`}function P(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${j(e.type)}>;`}function F(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${j(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function I(e,t,n,r,i){let a=``;if(i)for(let e=0;e<n.size;e++)a+=`  result[${e}] = ${i(e)};\n`;else if(r){let r=A(n.type),i=j(n.type);for(let o=0;o<n.size;o++){let n=t.map(([e,t])=>o<t.size?j(t.type)===i?`${e}[${o}]`:`${i}(${e}[${o}])`:r);a+=`  result[${o}] = ${e}(${n.join(`, `)});\n`}}else a+=`result = ${e}(${t.map(([e])=>e).join(`, `)});`;return a.trimEnd()}function L(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function R(e,t){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>k(t,n[r]??0)).join(`, `)}function z(e,t){for(let n in t)e=e.replaceAll(`{${n}}`,t[n]);return e}var B=`fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
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
`,V=({inputs:e,output:t,target:n})=>{let r=t.type,i=j(r),a=A(r),o=e.namedInputs;return N({module:{name:`arithmetic`,source:B,dependencies:[y]},inputs:o,output:t,operationType:r,outputBuffer:n,expression:t=>m(e.expression,{operations:f,inputs:o,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>o[e].size===1?`${e}[0]`:a,formatLiteral:e=>`${i}(${re(r,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}},H=`fn row_dot(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(y[i]);
  }
  return array<f32, 1>(sum);
}
`,U=({inputs:e,output:t,target:n})=>(N({module:{name:`row_dot`,source:H},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),W=`fn equalAll(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<u32, 1> {
  var allEqual = 1u;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    if (x[i] != y[i]) {
      allEqual = 0u;
      break;
    }
  }
  return array<u32, 1>(allEqual);
}
`,G=({inputs:e,output:t,target:n})=>(N({module:{name:`equalAll`,source:W},inputs:e,output:t,operationType:e.x.type,outputBuffer:n}),{success:!0});function K(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${j(t.type)}>;`}function q(e,t,n,r=e){let i=j(n);if(t.isConstant){let e=t.value;if(!e)throw Error(`Constant input ${t} is missing CPU values`);return`fn read_${r}(_sourceIndex: u32) -> array<${i}, ${t.size}> {
  return array<${i}, ${t.size}>(${Array.from({length:t.size},(t,n)=>k(i,e[n]??0)).join(`, `)});
}`}let a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT,s=j(t.type)===i?``:`${i}`;return`fn read_${r}(sourceIndex: u32) -> array<${i}, ${t.size}> {
  var value: array<${i}, ${t.size}>;
  let rowOffset = ${o}u + sourceIndex * ${a}u;
${Array.from({length:t.size},(t,n)=>s?`  value[${n}] = ${s}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`}function J(e,t){return q(`sourceValues`,e,t,`source_values`)}function Y(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${j(e.type)}>;`}function X(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${j(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function le(e,t){let n=A(e);return`fn zero_result() -> array<${j(e)}, ${t}> {
  var result: array<${j(e)}, ${t}>;
${Array.from({length:t},(e,t)=>`  result[${t}] = ${n};`).join(`
`)}
  return result;
}`}var ue=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(r.length===0){let e=new t.ValueType(t.length*t.size);return n.write(e),{success:!0,value:e}}if(r.isConstant){let e=r.value;if(!e)throw Error(`Constant input ${r} is missing CPU values`);let i=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let t=e[n];i[n*2]=t,i[n*2+1]=t}return n.write(i),{success:!0,value:i}}let i=[],a=r,o=`raw`,c=r.length;try{for(;;){let e=Math.ceil(c/64),r=t.length*e,l=e===1?n:s.createOrReuse(n.device,r*t.stride);if(e>1&&i.push(l),de({input:a,inputMode:o,inputGroupCount:c,channelCount:t.length,outputType:t.type,outputBuffer:l,outputLength:r,outputStride:t.stride,outputOffset:t.offset}),e===1)break;a=new p({buffer:l,type:t.type,size:2,length:r}),o=`partial`,c=e}return{success:!0}}finally{for(let e of i)s.recycle(e)}};function de({input:e,inputMode:t,inputGroupCount:n,channelCount:r,outputType:i,outputBuffer:a,outputLength:o,outputStride:s,outputOffset:c}){let l=j(i),u=E(o,a.device.limits.maxComputeWorkgroupsPerDimension),d=new p({buffer:a,type:i,size:2,length:o,stride:s,offset:c}),f=`
${e.isConstant?``:K(`sourceValues`,e,0)}
${J(e,i)}
${Y(d,e.isConstant?0:1)}
${X(d)}
${fe(t,i,r,n)}

var<workgroup> sharedMin: array<${l}, 64>;
var<workgroup> sharedMax: array<${l}, 64>;

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let outputRowIndex = ${D(u)};
  if (outputRowIndex >= ${o}u) {
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
    write_result(outputRowIndex, array<${l}, 2>(sharedMin[0], sharedMax[0]));
  }
}
`,m=new T(a.device,{source:f,shaderLayout:{bindings:[...e.isConstant?[]:[{name:`sourceValues`,type:`storage`,group:0,location:0}],{name:`result`,type:`storage`,group:0,location:e.isConstant?0:1}]}}),h={result:a};e.isConstant||(h.sourceValues=e.buffer),m.setBindings(h);let g=a.device.beginComputePass({});m.dispatch(g,u.x,u.y,u.z),g.end(),a.device.submit(),m.destroy()}function fe(e,t,n,r){let i=j(t),[a,o]=pe(t);return e===`raw`?`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
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
}`}function pe(e){switch(e){case`uint32`:return[`0xffffffffu`,`0u`];case`sint32`:return[`2147483647`,`-2147483648`];case`float32`:return[`3.402823e38`,`-3.402823e38`];default:throw Error(`Unsupported WebGPU extent type for ${e}`)}}function me(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var he=`\
const LE: bool = ${me()?`true`:`false`};
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
`,ge=({inputs:e,output:t,target:n})=>(N({module:{name:`fround`,source:he},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0}),_e=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=j(r.type),o=[];r.isConstant||o.push({name:`ids`,input:r,index:o.length}),i.isConstant||o.push({name:`sourceValues`,input:i,index:o.length});let s=E(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),c=`
${o.map(({name:e,input:t,index:n})=>K(e,t,n)).join(`
`)}
${ve(r,a)}
${J(i,t.type)}
${Y(t,o.length)}
${X(t)}
${le(t.type,t.size)}
${ye(r.type,t.type,t.size,i.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${O(s,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let idsValue = read_ids(rowIndex);
  let result = gather(idsValue);
  write_result(rowIndex, result);
}
`,l=new T(n.device,{source:c,shaderLayout:{bindings:[...o.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:o.length}]}}),u={};r.isConstant||(u.ids=r.buffer),i.isConstant||(u.sourceValues=i.buffer),u.result=n,l.setBindings(u);let d=n.device.beginComputePass({});return l.dispatch(d,s.x,s.y,s.z),d.end(),n.device.submit(),l.destroy(),{success:!0}};function ve(e,t){if(e.isConstant){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return`fn read_ids(_rowIndex: u32) -> ${t} {
  return ${k(t,n[0]??0)};
}`}let n=e.stride/e.ValueType.BYTES_PER_ELEMENT;return`fn read_ids(rowIndex: u32) -> ${t} {
  let rowOffset = ${e.offset/e.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${n}u;
  return ids[rowOffset];
}`}function ye(e,t,n,r){let i=j(e);return`fn gather(idsValue: ${i}) -> array<${j(t)}, ${n}> {
  let sourceIndex = ${i===`u32`?`i32(idsValue)`:i===`i32`?`idsValue`:`i32(idsValue)`};
  if (sourceIndex < 0 || sourceIndex >= ${r}) {
    return zero_result();
  }
  return read_source_values(u32(sourceIndex));
}`}var be=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=r.isConstant?[]:[{name:`segments`,input:r,index:0}],a=E(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),o=`
${i.map(({name:e,input:t,index:n})=>K(e,t,n)).join(`
`)}
${q(`segments`,r,`uint32`)}
${Y(t,i.length)}
${X(t)}
${xe(r.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${O(a,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let result = segmented_map(rowIndex);
  write_result(rowIndex, result);
}
`,s=new T(n.device,{source:o,shaderLayout:{bindings:[...i.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:i.length}]}}),c=Object.fromEntries(i.map(({name:e,input:t})=>[e,t.buffer]));c.result=n,s.setBindings(c);let l=n.device.beginComputePass({});return s.dispatch(l,a.x,a.y,a.z),l.end(),n.device.submit(),s.destroy(),{success:!0}};function xe(e){return`fn segmented_map(vertexIndex: u32) -> array<u32, 2> {
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
}`}var Se=({inputs:e,output:t,target:n})=>{let r=e.map((e,t)=>[`x${t}`,e]);Z(n.device.limits,r);let i=r.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(`, `),a=0;return N({module:{name:`interleave`,source:`\
fn interleave(${i}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${r.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  out[${a+n}] = ${e}[${n}];`).join(`
`);return a+=t.size,n}).join(`
`)}
  return out;
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function Z(e,t){let n=t.filter(([,e])=>!e.isConstant).length+1;if(n>e.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${n} storage buffers, exceeding device limit ${e.maxStorageBuffersPerShaderStage}`);if(n>e.maxBindingsPerBindGroup)throw Error(`interleave() requires ${n} bindings, exceeding bind group limit ${e.maxBindingsPerBindGroup}`)}var Ce=`fn row_length(x: array<{TYPE}, {X_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(x[i]);
  }
  return array<f32, 1>(sqrt(sum));
}
`,we=({inputs:e,output:t,target:n})=>(N({module:{name:`row_length`,source:Ce},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0}),Te=async({inputs:e,output:t,target:n})=>{let r=A(t.type);return N({module:{name:`select`,source:`// inline expression select
`},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>{let n=Q(`condition`,e.condition,t,r),i=Q(`whenTrue`,e.whenTrue,t,r);return`select(${Q(`whenFalse`,e.whenFalse,t,r)}, ${i}, ${n} != ${r})`}}),{success:!0}};function Q(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}var $=64,Ee=({inputs:e,output:t,target:n})=>{let r=E(Math.ceil(t.length/$),n.device.limits.maxComputeWorkgroupsPerDimension),i=`\
@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${$}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${O(r,$)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let rowOffset = ${t.offset/t.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${t.stride/t.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${e.start} + i32(rowIndex) * ${e.step};
}
`,a=new T(n.device,{source:i,shaderLayout:{bindings:[{name:`result`,type:`storage`,group:0,location:0}]}});a.setBindings({result:n});let o=n.device.beginComputePass({});return a.dispatch(o,r.x,r.y,r.z),o.end(),n.device.submit(),a.destroy(),{success:!0}},De=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return N({module:{name:`swizzle`,source:`// swizzle expression handled inline`},expression:e=>`x[${r[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};export{Se as a,ge as c,U as d,V as f,we as i,ue as l,Ee as n,be as o,Te as r,_e as s,De as t,G as u};