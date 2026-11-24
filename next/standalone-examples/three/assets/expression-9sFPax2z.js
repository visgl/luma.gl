import{r as e,t}from"./buffer-D799a7Pe.js";import{a as n,r,t as i}from"./vertex-format-decoder-HY--wCE8.js";import{t as a}from"./dynamic-buffer-C9jIheKT.js";import{i as o,n as s,r as c}from"./gpu-vector-chunks-C-q5S9Cy.js";import{n as l,r as u,t as d}from"./gpu-vector-_cYO6bk8.js";var f={name:`fp32`,source:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`,vs:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`};function p(t,n){let r=new Map,i=[],a=new Set;function o(t){e(!a.has(t));let s=r.get(t);if(s)return s;let c=n?.(t,r.size)??`value-${r.size}`;a.add(t),r.set(t,c);let l=t.source,u=l instanceof g,d=(u?[l]:l?.dependencies??[]).map(o);return i.push(Object.freeze({id:c,label:t.id,kind:u?`alias`:l?`operation`:`source`,operation:l&&!u?l.name:void 0,dependencies:Object.freeze(d),type:t.type,size:t.size,format:m(t),length:t.length,normalized:t.normalized,isConstant:t.isConstant,offset:t.offset,stride:t.stride,byteLength:t.byteLength,evaluated:t.evaluated})),a.delete(t),c}let s=t.map(o);return Object.freeze({outputs:Object.freeze(s),nodes:Object.freeze(i)})}function m(e){if(e.format)return e.format;let t=e.size;if(!(t!==1&&t!==2&&t!==3&&t!==4)){if(t===3&&!e.normalized&&(e.type===`uint8`||e.type===`sint8`))return e.type===`uint8`?`uint8x3-webgl`:`sint8x3-webgl`;try{return i.makeVertexFormat(e.type,t,e.normalized)}catch{return}}}var h=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,n){if(n>e.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${n} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let r=this.bufferPools.get(e),i=r?r.findIndex(e=>e.byteLength>=n):-1;if(i<0)return e.createBuffer({usage:t.VERTEX|t.STORAGE|t.COPY_DST|t.COPY_SRC,byteLength:n});let[a]=r.splice(i,1);return a}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let n=this.bufferPools.get(t),r=n.findIndex(t=>t.byteLength>e.byteLength);r<0?n.push(e):n.splice(r,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let n=e.isLost?0:this.poolSize;for(;t.length>n;)t.shift().destroy();t.length===0&&this.bufferPools.delete(e)}}},g=class e{static get bufferPoolSize(){return h.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw Error(`GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer`);h.poolSize=e,h.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_evaluationScope;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership=`owned`;_targetBuffer;static fromArray(t,{type:i,size:a=1,offset:o=0,stride:s=0,normalized:c=!1}){let l=i,u;return Array.isArray(t)?(l||=`float32`,u=new(n(l))(t)):t instanceof Float64Array?(l=`uint32`,a*=2,o*=2,s*=2,u=new Uint32Array(t.buffer,t.byteOffset,t.byteLength/4)):(l||=r(t),u=t),new e({id:`<${l} * ${a}>`,type:l,size:a,offset:o,stride:s,normalized:c,value:u})}static fromConstant(t,r=`float32`){let i=n(r),a;return Array.isArray(t)?a=`[${t.join(`,`)}]`:(a=String(t),t=[t]),new e({id:a,isConstant:!0,type:r,size:t.length,value:new i(t)})}static fromGPUData(t,n={}){return y(t),new e({...b(new u({buffer:t.buffer,format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride})),id:n.id,gpuData:t})}static fromGPUDataView(t,n={}){return new e({...b(t),id:n.id,buffer:t.buffer})}constructor(t){let{id:r,value:i,buffer:a,gpuData:o,format:s,source:c=null,isConstant:l=!1}=t;if(!c&&!i&&!a&&!o)throw Error(`GPUDataEvaluator must have a value source`);let{type:u,size:f,offset:p,stride:m,normalized:h,length:g}=t;if(c instanceof e?(u??=c.type,f??=c.size,p??=c.offset,m??=c.stride,h??=c.normalized,g??=c.length):(f??=1,p??=0,h??=!1,g=l?1:g),!u)throw Error(`GPUDataEvaluator: type not defined`);if(this._id=r,this.type=u,this.size=f,this.ValueType=n(this.type),this._offset=p,this._stride=m||this.ValueType.BYTES_PER_ELEMENT*f,this.normalized=h,this.source=c,this.format=s,g===void 0)if(l)g=1;else{if(!i)throw Error(`GPUDataEvaluator: length not defined`);g=Math.ceil(i.byteLength/this.stride)}this.isConstant=l,this.length=g;let _=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=g===0?0:(g-1)*this.stride+_,this._value=i,this._bufferOwnership=c instanceof e||a||o?`borrowed`:`owned`,o?this._gpuVector=new d({type:`data`,name:this._id??`data`,format:o.format,data:[o],stride:o.stride,byteStride:o.byteStride,rowByteLength:o.rowByteLength}):a&&(this._gpuVector=this.createGPUVectorView({buffer:a,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof e?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}getInspection(){return p([this])}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return x(this.gpuVector)}setTargetBuffer({buffer:t,byteOffset:n=0,byteStride:r=this.stride}){if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof e)throw Error(`GPUDataEvaluator target buffers require a deferred operation source`);this._targetBuffer={buffer:t,byteOffset:n,byteStride:r}}async evaluate(t,n={}){if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this.assertScopeAccess(n.scope),n.scope&&(n.scope.assertEvaluating(t),!this._evaluationScope)){let e=!!this._gpuVector,t={offset:this._offset,stride:this._stride,byteLength:this._byteLength,ownership:this._bufferOwnership,target:this._targetBuffer};this._evaluationScope=n.scope,n.scope.retain(n=>{this._evaluationScope=void 0,!n&&!e&&this._gpuVector&&(this._bufferOwnership===`owned`&&h.recycle(x(this._gpuVector)),this._gpuVector=void 0),!n&&!e&&(this._offset=t.offset,this._stride=t.stride,this._byteLength=t.byteLength,this._bufferOwnership=t.ownership,this._targetBuffer=t.target)})}if(this._gpuVector){if(n.scope&&this.source instanceof e&&await this.source.evaluate(t,{scope:n.scope}),n.scope&&this.buffer.device!==t)throw Error(`Evaluator buffer belongs to a different device`);return this._gpuVector}let r;if(this.source instanceof e){let e=await this.source.evaluate(t,{scope:n.scope});return this._gpuVector=this.createGPUVectorView({...n,buffer:x(e)}),this._gpuVector}if(r=this._getEvaluationBuffer(t),this._value)r.write(this._value);else{let e;try{e=await this.source.execute(t,r,n.scope)}catch(e){throw n.scope&&this._bufferOwnership===`owned`&&h.recycle(r),e}if(!e.success)throw n.scope&&this._bufferOwnership===`owned`&&h.recycle(r),e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...n,buffer:r}),this._gpuVector}evaluateSync(t,n={}){if(n.scope)throw Error(`Use scope.evaluate() for deferred submission`);if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let r;if(this.source instanceof e){let e=this.source.evaluateSync(t);return this._gpuVector=this.createGPUVectorView({...n,buffer:x(e)}),this._gpuVector}if(r=this._getEvaluationBuffer(t),this._value)r.write(this._value);else{let e=this.source.executeSync(t,r);if(!e.success)throw e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...n,buffer:r}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??`vector`,n=e.format??this.format??E(this.type,this.size,this.normalized);if(e.interleaved){let n=typeof e.interleaved==`object`&&e.interleaved.attributes?e.interleaved.attributes:C(this);return new d({type:`interleaved`,name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:n,ownsBuffer:!1})}return new d({type:`buffer`,name:t,buffer:e.buffer,format:n,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return h.createOrReuse(e,Math.max(this.offset+this.byteLength,this._value?.byteLength??0));if(t.buffer.device!==e)throw Error(`GPUDataEvaluator target buffer belongs to a different device`);let n=this.ValueType.BYTES_PER_ELEMENT*this.size,r=this.length===0?0:(this.length-1)*t.byteStride+n;if(t.byteOffset+r>t.buffer.byteLength)throw Error(`GPUDataEvaluator target buffer is too small for the output layout`);return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=r,this._bufferOwnership=`borrowed`,this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){this.assertScopeAccess();let{ValueType:n}=this,{size:r,offset:i,stride:a,length:o}=this,s=n.BYTES_PER_ELEMENT*r;if(t??=o,e=Math.max(0,Math.min(o,e)),t=Math.max(e,Math.min(o,t)),this._value)return _(this,this._value,e,t);let c=t-e;if(c===0)return new n(0);let l=i+e*a,u=a===s?c*s:(c-1)*a+s,d=await this.buffer.readAsync(l,u),f=new n(d.buffer,d.byteOffset,d.byteLength/n.BYTES_PER_ELEMENT);if(a===s)return f;let p=new Uint8Array(s*c);for(let e=0;e<c;e++){let t=e*a;p.set(d.subarray(t,t+s),e*s)}return new n(p.buffer)}async ensureCPUValue(){this.assertScopeAccess();let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!==0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let n=t.slice();return this._value=new this.ValueType(n.buffer,n.byteOffset,n.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){this.assertScopeAccess();let e=this.value;if(e)return e;throw Error(`${this} CPU value is not available for synchronous evaluation`)}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error(`Evaluator is retained by an unsubmitted scope`)}toString(){return this._id??this.source?.toString()??this.constructor.name}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error(`Cannot invalidate a destroyed evaluator`);if((this.source||this._bufferOwnership===`borrowed`)&&(this._value=void 0),!(!this.source&&this._bufferOwnership===`borrowed`)&&this._gpuVector){let t=x(this._gpuVector);this._bufferOwnership===`owned`?h.recycle(t):this.source instanceof e||(this._targetBuffer={buffer:t,byteOffset:this.offset,byteStride:this.stride}),this._gpuVector=void 0}}destroy(){this.assertScopeAccess(),this._gpuVector&&=(this._bufferOwnership===`owned`&&h.recycle(x(this._gpuVector)),void 0),this._targetBuffer=void 0,this._destroyed=!0}};function _(e,t,n,r){let{ValueType:i,size:a,offset:o,stride:s}=e,c=s/i.BYTES_PER_ELEMENT,l=o/i.BYTES_PER_ELEMENT,u=r-n;if(c===a){let e=l+n*c;return t.subarray(e,e+u*a)}let d=new i(u*a);for(let e=0;e<u;e++){let r=l+(n+e)*c;d.set(t.subarray(r,r+a),e*a)}return d}function v(e){if(e instanceof g)return e;if(typeof e==`number`||Array.isArray(e))return g.fromConstant(e);if(e instanceof l)return g.fromGPUData(e);if(e instanceof u)return g.fromGPUDataView(e);throw Error(`getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]`)}function y(e){if(!e.format)throw Error(`GPUDataEvaluator.fromGPUData() requires GPUData format metadata`);if(o(e.format)||c(e.format))throw Error(`GPUDataEvaluator.fromGPUData() does not support variable-length input`);let t=s(e.format).byteLength;if(e.rowByteLength!==t)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}function b(e){let t=s(e.format),r=n(t.signedDataType),i=r.BYTES_PER_ELEMENT*t.components;if(t.byteLength!==i)throw Error(`GPUDataEvaluator does not support packed vertex format ${e.format}: ${t.byteLength} physical bytes cannot expose ${t.components} ${t.signedDataType} components`);if(e.byteOffset%r.BYTES_PER_ELEMENT!==0||e.byteStride%r.BYTES_PER_ELEMENT!==0)throw Error(`GPUDataEvaluator requires ${e.format} offset and stride aligned to ${r.BYTES_PER_ELEMENT} bytes`);return{type:t.signedDataType,size:t.components,offset:e.byteOffset,stride:e.byteStride,normalized:t.normalized,length:e.length,format:e.format}}function x(e){let t=S(e).buffer;return t instanceof a?t.buffer:t}function S(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${e.name}"`);return t}function C(e){let t=[];return w(e,t,{byteOffset:0}),t}function w(e,t,n){let r=e.source;if(r&&!(r instanceof g)&&r.name===`interleave`){for(let e of Object.values(r.inputs))e instanceof g&&w(e,t,n);return}t.push({attribute:e.id??e.toString(),format:T(e.type,e.size,e.normalized),byteOffset:n.byteOffset}),n.byteOffset+=e.ValueType.BYTES_PER_ELEMENT*e.size}function T(e,t,n=!1){if(t<1||t>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${t} components`);if(e===`float16`&&t===3&&!n)return`uint16x3-webgl`;let r=e;if(n)switch(e){case`uint8`:r=`unorm8`;break;case`sint8`:r=`snorm8`;break;case`uint16`:r=`unorm16`;break;case`sint16`:r=`snorm16`;break;case`float32`:r=`float32`;break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}return(r===`uint8`||r===`sint8`||r===`uint16`||r===`sint16`||r===`unorm8`||r===`snorm8`||r===`unorm16`||r===`snorm16`)&&t===3?`${r}x3-webgl`:`${r}${t===1?``:`x${t}`}`}function E(e,t,n=!1){return t>=1&&t<=4?T(e,t,n):void 0}var D={add:{arity:2,symbol:`arithmetic_add`},subtract:{arity:2,symbol:`arithmetic_subtract`},multiply:{arity:2,symbol:`arithmetic_multiply`},divide:{arity:2,symbol:`arithmetic_divide`},pow:{arity:2,symbol:`pow`},sqrt:{arity:1,symbol:`sqrt`},abs:{arity:1,symbol:`abs`},sin:{arity:1,symbol:`sin`},cos:{arity:1,symbol:`cos`},tan:{arity:1,symbol:`arithmetic_tan`},exp:{arity:1,symbol:`exp`},log:{arity:1,symbol:`log`}};function O(e,{operations:t,inputs:n}){switch(e.kind){case`input`:if(!(e.name in n))throw Error(`Unknown expression input '${e.name}'`);return;case`literal`:if(Array.isArray(e.value)){for(let t of e.value)if(!Number.isFinite(t))throw Error(`Expression literal array must contain only finite values, got ${t}`)}else if(!Number.isFinite(e.value))throw Error(`Expression literal must be finite, got ${e.value}`);return;case`call`:{let r=t[e.op];if(!r)throw Error(`Unknown expression op '${e.op}'`);if(e.args.length!==r.arity)throw Error(`Expression op '${e.op}' expects ${r.arity} args, got ${e.args.length}`);for(let r of e.args)O(r,{operations:t,inputs:n});return}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}function k(e,t){return O(e,t),A(e,t)}function A(e,t){switch(e.kind){case`input`:{let n=t.inputs[e.name];return t.laneIndex<n.size?t.formatInput(e.name):t.formatOutOfBoundsInput(e.name)}case`literal`:return t.formatLiteral(e.value);case`call`:{let n=t.operations[e.op],r=e.args.map(e=>A(e,t));return t.formatCall(n.symbol,r)}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}export{h as a,v as i,D as n,p as o,g as r,f as s,k as t};