import{c as e,d as t,m as n,p as r}from"./shader-type-decoder-BLygFN_M.js";import{a as i,i as a,n as o,r as s,t as c}from"./gpu-vector-chunks-C_IqND_x.js";import{r as l}from"./shader-block-layout-92_aKAG9.js";var u={name:`fp32`,source:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
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
`},d=class{buffer;format;length;byteOffset;byteStride;constructor(t){let n=e.getVertexFormatInfo(t.format).byteLength,r=t.byteOffset??0,i=t.byteStride??n;if(f(t.length,`GPUDataView length`),f(r,`GPUDataView byteOffset`),f(i,`GPUDataView byteStride`),i<n)throw Error(`GPUDataView byteStride ${i} is smaller than ${t.format} byte length ${n}`);let a=t.length===0?0:(t.length-1)*i+n,o=r+a;if(!Number.isSafeInteger(a)||!Number.isSafeInteger(o))throw Error(`GPUDataView byte range must use safe integers`);if(o>t.buffer.byteLength)throw Error(`GPUDataView exceeds its backing buffer byte length`);this.buffer=t.buffer,this.format=t.format,this.length=t.length,this.byteOffset=r,this.byteStride=i}get elementByteLength(){return e.getVertexFormatInfo(this.format).byteLength}get byteLength(){return this.length===0?0:(this.length-1)*this.byteStride+this.elementByteLength}};function f(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}function p(e){return!!(e&&typeof e==`object`&&e.type===`struct`)}function m(e,t){let n=Object.entries(e);if(n.length===0)throw Error(`GPUData struct format must declare at least one field`);return t===`packed`?h(n):g(n)}function h(t){let n=[],r=0,i=0;for(let[a,o]of t){let t=e.getVertexFormatInfo(o);if(t.webglOnly)throw Error(`Packed GPUData struct field "${a}" uses WebGL-only format ${o}`);r=y(r,Math.min(4,t.byteLength)),n.push([a,Object.freeze({format:o,byteOffset:r,byteLength:t.byteLength})]),r+=t.byteLength,i+=t.components}return Object.freeze({type:`struct`,layout:`packed`,fields:Object.freeze(Object.fromEntries(n)),components:i,byteStride:y(r,4),rowByteLength:r})}function g(t){let n=l(Object.fromEntries(t.map(([e,t])=>[e,_(t)])),{layout:`wgsl-storage`}),r=[],i=0,a=0;for(let[o,s]of t){let t=e.getVertexFormatInfo(s),c=n.fields[o].offset*4;r.push([o,Object.freeze({format:s,byteOffset:c,byteLength:t.byteLength})]),i=Math.max(i,c+t.byteLength),a+=t.components}return Object.freeze({type:`struct`,layout:`wgsl-storage`,fields:Object.freeze(Object.fromEntries(r)),components:a,byteStride:n.byteLength,rowByteLength:i})}function _(t){let n=e.getVertexFormatInfo(t);switch(n.type){case`float32`:return v(`f32`,n.components);case`sint32`:return v(`i32`,n.components);case`uint32`:return v(`u32`,n.components);default:return v(`u32`,Math.ceil(n.byteLength/4))}}function v(e,t){return t===1?e:`vec${t}<${e}>`}function y(e,t){return Math.ceil(e/t)*t}var b=class{buffer;ownsDataBuffer;constructor(e,t){this.buffer=e,this.ownsDataBuffer=t}get ownsBuffer(){return this.ownsDataBuffer}transferBufferOwnership(e){if(e.buffer!==this.buffer)throw Error(`GPUData ownership can only be transferred to the same buffer`);e.ownsDataBuffer=this.ownsDataBuffer,this.ownsDataBuffer=!1}destroy(){this.ownsDataBuffer&&=(this.buffer.destroy(),!1)}},x=class extends b{dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;readbackMetadata;valueOffsets;nullBitmap;valueByteLength;constructor(e){let{buffer:t,format:n,length:r,valueLength:i,stride:a,byteOffset:s=0,byteStride:c,rowByteLength:l,ownsBuffer:u=!1,readbackMetadata:d,valueOffsets:f,nullBitmap:h,valueByteLength:g,dataType:_}=e;super(t,u);let v;v=n?typeof n==`string`?n:m(n,e.layout??`wgsl-storage`):void 0;let y=p(v)?v:void 0,b=typeof v==`string`?o(v):void 0;if(this.dataType=_,this.format=v,this.length=r,this.valueLength=i??r*(b?.listSize??1),this.stride=a??(b?b.components*(b.listSize??1):void 0)??y?.components??c??l??1,this.byteOffset=s,this.rowByteLength=l??y?.rowByteLength??b?.byteLength??c??this.stride,this.byteStride=c??y?.byteStride??this.rowByteLength,b?.fixedSizeList){let e=r*b.listSize;if(!Number.isSafeInteger(r)||r<0||!Number.isSafeInteger(e)||!Number.isSafeInteger(this.byteOffset)||this.byteOffset<0||!Number.isSafeInteger(this.byteStride)||!Number.isSafeInteger(this.rowByteLength)||!Number.isSafeInteger(this.stride))throw Error(`GPUData fixed-size-list row layout must use safe non-negative integers`);if(this.valueLength!==e)throw Error(`GPUData fixed-size-list valueLength must equal its flattened row elements`);if(this.stride<b.components*b.listSize)throw Error(`GPUData fixed-size-list stride cannot truncate its row components`);if(this.rowByteLength<b.byteLength)throw Error(`GPUData fixed-size-list rowByteLength cannot truncate its row payload`);if(this.byteStride<this.rowByteLength)throw Error(`GPUData fixed-size-list byteStride cannot overlap its row payload`);let n=r===0?0:(r-1)*this.byteStride+this.rowByteLength,i=this.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(i))throw Error(`GPUData fixed-size-list byte range must use safe integers`);if(i>t.byteLength)throw Error(`GPUData fixed-size-list exceeds its backing buffer byte length`)}if(y){if(this.rowByteLength<y.rowByteLength)throw Error(`GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${y.rowByteLength}`);if(this.byteStride<Math.max(y.byteStride,this.rowByteLength))throw Error(`GPUData byteStride ${this.byteStride} is smaller than its struct row layout`)}this.readbackMetadata=d,this.valueOffsets=f,this.nullBitmap=h,this.valueByteLength=g}getChild(e){if(!p(this.format))return null;let t=this.format.fields[e];return t?new d({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}getChildAt(e){if(!p(this.format))return null;let t=Object.values(this.format.fields)[e];return t?new d({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}},S=class{name;dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;bufferLayout;data=[];device;bufferProps;isAppendable=!1;ownsDataChunks=!0;ownedVectors=[];appendableByteLength=0;get chunks(){return c(this.data)}constructor(e){switch(e.type){case`buffer`:{let{name:t,buffer:n,format:r,length:i,valueLength:a,byteOffset:o=0,ownsBuffer:s=!1}=e,{stride:c,byteStride:l,rowByteLength:u,listSize:d}=C(e),f=a??i*(d??1);this.name=t,this.dataType=e.dataType,this.format=r,this.length=i,this.valueLength=f,this.stride=c,this.byteOffset=o,this.byteStride=l,this.rowByteLength=u,this.data.push(new x({buffer:n,format:r,length:i,valueLength:f,stride:c,byteOffset:o,byteStride:l,rowByteLength:u,ownsBuffer:s,dataType:e.dataType}));return}case`interleaved`:{let{name:t,buffer:n,format:r,length:i,valueLength:a,byteOffset:s=0,byteStride:c,attributes:l,ownsBuffer:u=!1}=e,d=r?o(r):void 0,f=a??i*(d?.listSize??1),p=d?.fixedSizeList?d.components*d.listSize:c,m=d?.fixedSizeList?d.byteLength:c;this.name=t,this.dataType=e.dataType,this.format=r,this.length=i,this.valueLength=f,this.stride=p,this.byteOffset=s,this.byteStride=c,this.rowByteLength=m,this.bufferLayout={name:t,byteStride:c,attributes:l},this.data.push(new x({buffer:n,format:r,length:i,valueLength:f,stride:p,byteOffset:s,byteStride:c,rowByteLength:m,ownsBuffer:u,dataType:e.dataType}));return}case`data`:{let t=e.format??w(e.data),n=t?o(t):void 0,{name:r,data:i,stride:a=i[0]?.stride??(n?n.components*(n.listSize??1):1),valueLength:s=i.reduce((e,t)=>e+t.valueLength,0),byteStride:c=i[0]?.byteStride??n?.byteLength,rowByteLength:l=i[0]?.rowByteLength??n?.byteLength,bufferLayout:u,ownsData:d=!1}=e;if(c===void 0||l===void 0)throw Error(`GPUVector requires format or explicit byte layout metadata`);t&&T(i,t),this.name=r,this.dataType=e.dataType,this.format=t,this.length=i.reduce((e,t)=>e+t.length,0),this.valueLength=s,this.stride=a,this.byteOffset=i.length===1?i[0].byteOffset:0,this.byteStride=c,this.rowByteLength=l,this.bufferLayout=u,this.ownsDataChunks=d,this.data.push(...i);return}case`appendable`:{let{name:t,device:n,format:r,valueLength:i=0,bufferProps:a}=e,{stride:o,byteStride:s,rowByteLength:c}=C(e);this.name=t,this.dataType=e.dataType,this.format=r,this.length=0,this.valueLength=i,this.stride=o,this.byteOffset=0,this.byteStride=s,this.rowByteLength=c,this.device=n,this.bufferProps=a,this.isAppendable=!0;return}}}get ownsBuffer(){return this.ownsDataChunks&&this.data.some(e=>e.ownsBuffer)||this.ownedVectors.some(e=>e.ownsBuffer)}get capacityRows(){return this.isAppendable?this.length:void 0}get appendedByteLength(){return this.appendableByteLength}addData(e){if(this.format&&e.format!==this.format)throw Error(`GPUVector.addData() requires matching formats`);if(e.byteStride!==this.byteStride)throw Error(`GPUVector.addData() requires matching byteStride`);if(e.rowByteLength!==this.rowByteLength)throw Error(`GPUVector.addData() requires matching rowByteLength`);return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this}appendDataChunk(e,t=this.appendableByteLength+e.buffer.byteLength){if(!this.isAppendable)throw Error(`GPUVector.appendDataChunk() requires appendable vector storage`);if(this.format&&e.format!==this.format)throw Error(`GPUVector.appendDataChunk() requires matching formats`);if(e.byteStride!==this.byteStride||e.rowByteLength!==this.rowByteLength)throw Error(`GPUVector.appendDataChunk() requires matching byte layout metadata`);return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this.appendableByteLength=t,this}resetLastBatch(){if(!this.isAppendable)throw Error(`GPUVector.resetLastBatch() requires appendable vector storage`);for(let e of this.data.splice(0))e.destroy();return this.length=0,this.valueLength=0,this.appendableByteLength=0,this}retainOwnedVectors(e){return this.ownedVectors.push(...e),this}transferBufferOwnership(e){let t=this.data[0],n=e.data[0];if(!t||!n||t.buffer!==n.buffer)throw Error(`GPUVector ownership can only be transferred to the same buffer`);t.transferBufferOwnership(n)}destroy(){if(this.ownsDataChunks)for(let e of this.data)e.destroy();for(let e of this.ownedVectors.splice(0))e.destroy()}};function C(e){let t=e.format?o(e.format):void 0,n=e.rowByteLength??(t?.fixedSizeList?t.byteLength:e.byteStride)??t?.byteLength;if(n===void 0)throw Error(`GPUVector requires format or explicit rowByteLength`);return{stride:e.stride??(t?t.components*(t.listSize??1):1),byteStride:e.byteStride??n,rowByteLength:n,...t?.listSize?{listSize:t.listSize}:{}}}function w(e){return e[0]?.format}function T(e,t){if(e.find(e=>e.format!==t))throw Error(`GPUVector data chunks must share the declared format`)}var E=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,t){if(t>e.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${t} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let r=this.bufferPools.get(e),i=r?r.findIndex(e=>e.byteLength>=t):-1;if(i<0)return e.createBuffer({usage:n.VERTEX|n.STORAGE|n.COPY_DST|n.COPY_SRC,byteLength:t});let[a]=r.splice(i,1);return a}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let n=this.bufferPools.get(t),r=n.findIndex(t=>t.byteLength>e.byteLength);r<0?n.push(e):n.splice(r,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let n=e.isLost?0:this.poolSize;for(;t.length>n;)t.shift().destroy();t.length===0&&this.bufferPools.delete(e)}}},D=class e{static get bufferPoolSize(){return E.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw Error(`GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer`);E.poolSize=e,E.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_evaluationScope;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership=`owned`;_targetBuffer;static fromArray(n,{type:i,size:a=1,offset:o=0,stride:s=0,normalized:c=!1}){let l=i,u;return Array.isArray(n)?(l||=`float32`,u=new(r(l))(n)):n instanceof Float64Array?(l=`uint32`,a*=2,o*=2,s*=2,u=new Uint32Array(n.buffer,n.byteOffset,n.byteLength/4)):(l||=t(n),u=n),new e({id:`<${l} * ${a}>`,type:l,size:a,offset:o,stride:s,normalized:c,value:u})}static fromConstant(t,n=`float32`){let i=r(n),a;return Array.isArray(t)?a=`[${t.join(`,`)}]`:(a=String(t),t=[t]),new e({id:a,isConstant:!0,type:n,size:t.length,value:new i(t)})}static fromGPUData(t,n={}){return A(t),new e({...j(new d({buffer:t.buffer,format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride})),id:n.id,gpuData:t})}static fromGPUDataView(t,n={}){return new e({...j(t),id:n.id,buffer:t.buffer})}constructor(t){let{id:n,value:i,buffer:a,gpuData:o,format:s,source:c=null,isConstant:l=!1}=t;if(!c&&!i&&!a&&!o)throw Error(`GPUDataEvaluator must have a value source`);let{type:u,size:d,offset:f,stride:p,normalized:m,length:h}=t;if(c instanceof e?(u??=c.type,d??=c.size,f??=c.offset,p??=c.stride,m??=c.normalized,h??=c.length):(d??=1,f??=0,m??=!1,h=l?1:h),!u)throw Error(`GPUDataEvaluator: type not defined`);if(this._id=n,this.type=u,this.size=d,this.ValueType=r(this.type),this._offset=f,this._stride=p||this.ValueType.BYTES_PER_ELEMENT*d,this.normalized=m,this.source=c,this.format=s,h===void 0)if(l)h=1;else{if(!i)throw Error(`GPUDataEvaluator: length not defined`);h=Math.ceil(i.byteLength/this.stride)}this.isConstant=l,this.length=h;let g=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=h===0?0:(h-1)*this.stride+g,this._value=i,this._bufferOwnership=c instanceof e||a||o?`borrowed`:`owned`,o?this._gpuVector=new S({type:`data`,name:this._id??`data`,format:o.format,data:[o],stride:o.stride,byteStride:o.byteStride,rowByteLength:o.rowByteLength}):a&&(this._gpuVector=this.createGPUVectorView({buffer:a,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof e?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return M(this.gpuVector)}setTargetBuffer({buffer:t,byteOffset:n=0,byteStride:r=this.stride}){if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof e)throw Error(`GPUDataEvaluator target buffers require a deferred operation source`);this._targetBuffer={buffer:t,byteOffset:n,byteStride:r}}async evaluate(t,n={}){if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this.assertScopeAccess(n.scope),n.scope&&(n.scope.assertEvaluating(t),!this._evaluationScope)){let e=!!this._gpuVector,t={offset:this._offset,stride:this._stride,byteLength:this._byteLength,ownership:this._bufferOwnership,target:this._targetBuffer};this._evaluationScope=n.scope,n.scope.retain(n=>{this._evaluationScope=void 0,!n&&!e&&this._gpuVector&&(this._bufferOwnership===`owned`&&E.recycle(M(this._gpuVector)),this._gpuVector=void 0),!n&&!e&&(this._offset=t.offset,this._stride=t.stride,this._byteLength=t.byteLength,this._bufferOwnership=t.ownership,this._targetBuffer=t.target)})}if(this._gpuVector){if(n.scope&&this.source instanceof e&&await this.source.evaluate(t,{scope:n.scope}),n.scope&&this.buffer.device!==t)throw Error(`Evaluator buffer belongs to a different device`);return this._gpuVector}let r;if(this.source instanceof e){let e=await this.source.evaluate(t,{scope:n.scope});return this._gpuVector=this.createGPUVectorView({...n,buffer:M(e)}),this._gpuVector}if(r=this._getEvaluationBuffer(t),this._value)r.write(this._value);else{let e;try{e=await this.source.execute(t,r,n.scope)}catch(e){throw n.scope&&this._bufferOwnership===`owned`&&E.recycle(r),e}if(!e.success)throw n.scope&&this._bufferOwnership===`owned`&&E.recycle(r),e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...n,buffer:r}),this._gpuVector}evaluateSync(t,n={}){if(n.scope)throw Error(`Use scope.evaluate() for deferred submission`);if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let r;if(this.source instanceof e){let e=this.source.evaluateSync(t);return this._gpuVector=this.createGPUVectorView({...n,buffer:M(e)}),this._gpuVector}if(r=this._getEvaluationBuffer(t),this._value)r.write(this._value);else{let e=this.source.executeSync(t,r);if(!e.success)throw e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...n,buffer:r}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??`vector`,n=e.format??this.format??L(this.type,this.size,this.normalized);if(e.interleaved){let n=typeof e.interleaved==`object`&&e.interleaved.attributes?e.interleaved.attributes:P(this);return new S({type:`interleaved`,name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:n,ownsBuffer:!1})}return new S({type:`buffer`,name:t,buffer:e.buffer,format:n,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return E.createOrReuse(e,this.byteLength);if(t.buffer.device!==e)throw Error(`GPUDataEvaluator target buffer belongs to a different device`);let n=this.ValueType.BYTES_PER_ELEMENT*this.size,r=this.length===0?0:(this.length-1)*t.byteStride+n;if(t.byteOffset+r>t.buffer.byteLength)throw Error(`GPUDataEvaluator target buffer is too small for the output layout`);return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=r,this._bufferOwnership=`borrowed`,this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){this.assertScopeAccess();let{ValueType:n}=this,{size:r,offset:i,stride:a,length:o}=this,s=n.BYTES_PER_ELEMENT*r;if(t??=o,e=Math.max(0,Math.min(o,e)),t=Math.max(e,Math.min(o,t)),this._value)return O(this,this._value,e,t);let c=t-e;if(c===0)return new n(0);let l=i+e*a,u=a===s?c*s:(c-1)*a+s,d=await this.buffer.readAsync(l,u),f=new n(d.buffer,d.byteOffset,d.byteLength/n.BYTES_PER_ELEMENT);if(a===s)return f;let p=new Uint8Array(s*c);for(let e=0;e<c;e++){let t=e*a;p.set(d.subarray(t,t+s),e*s)}return new n(p.buffer)}async ensureCPUValue(){this.assertScopeAccess();let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!==0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let n=t.slice();return this._value=new this.ValueType(n.buffer,n.byteOffset,n.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){this.assertScopeAccess();let e=this.value;if(e)return e;throw Error(`${this} CPU value is not available for synchronous evaluation`)}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error(`Evaluator is retained by an unsubmitted scope`)}toString(){return this._id??this.source?.toString()??this.constructor.name}destroy(){this.assertScopeAccess(),this._gpuVector&&=(this._bufferOwnership===`owned`&&E.recycle(M(this._gpuVector)),void 0),this._targetBuffer=void 0,this._destroyed=!0}};function O(e,t,n,r){let{ValueType:i,size:a,offset:o,stride:s}=e,c=s/i.BYTES_PER_ELEMENT,l=o/i.BYTES_PER_ELEMENT,u=r-n;if(c===a){let e=l+n*c;return t.subarray(e,e+u*a)}let d=new i(u*a);for(let e=0;e<u;e++){let r=l+(n+e)*c;d.set(t.subarray(r,r+a),e*a)}return d}function k(e){if(e instanceof D)return e;if(typeof e==`number`||Array.isArray(e))return D.fromConstant(e);if(e instanceof x)return D.fromGPUData(e);if(e instanceof d)return D.fromGPUDataView(e);throw Error(`getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]`)}function A(e){if(!e.format)throw Error(`GPUDataEvaluator.fromGPUData() requires GPUData format metadata`);if(a(e.format)||s(e.format))throw Error(`GPUDataEvaluator.fromGPUData() does not support variable-length input`);let t=o(e.format).byteLength;if(e.rowByteLength!==t)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}function j(e){let t=o(e.format),n=r(t.signedDataType),i=n.BYTES_PER_ELEMENT*t.components;if(t.byteLength!==i)throw Error(`GPUDataEvaluator does not support packed vertex format ${e.format}: ${t.byteLength} physical bytes cannot expose ${t.components} ${t.signedDataType} components`);if(e.byteOffset%n.BYTES_PER_ELEMENT!==0||e.byteStride%n.BYTES_PER_ELEMENT!==0)throw Error(`GPUDataEvaluator requires ${e.format} offset and stride aligned to ${n.BYTES_PER_ELEMENT} bytes`);return{type:t.signedDataType,size:t.components,offset:e.byteOffset,stride:e.byteStride,normalized:t.normalized,length:e.length,format:e.format}}function M(e){let t=N(e).buffer;return t instanceof i?t.buffer:t}function N(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${e.name}"`);return t}function P(e){let t=[];return F(e,t,{byteOffset:0}),t}function F(e,t,n){let r=e.source;if(r&&!(r instanceof D)&&r.name===`interleave`){for(let e of Object.values(r.inputs))e instanceof D&&F(e,t,n);return}t.push({attribute:e.id??e.toString(),format:I(e.type,e.size,e.normalized),byteOffset:n.byteOffset}),n.byteOffset+=e.ValueType.BYTES_PER_ELEMENT*e.size}function I(e,t,n=!1){if(t<1||t>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${t} components`);let r=e;if(n)switch(e){case`uint8`:r=`unorm8`;break;case`sint8`:r=`snorm8`;break;case`uint16`:r=`unorm16`;break;case`sint16`:r=`snorm16`;break;case`float32`:r=`float32`;break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}return(r===`uint8`||r===`sint8`||r===`uint16`||r===`sint16`||r===`unorm8`||r===`snorm8`||r===`unorm16`||r===`snorm16`)&&t===3?`${r}x3-webgl`:`${r}${t===1?``:`x${t}`}`}function L(e,t,n=!1){return t>=1&&t<=4?I(e,t,n):void 0}var R={add:{arity:2,symbol:`arithmetic_add`},subtract:{arity:2,symbol:`arithmetic_subtract`},multiply:{arity:2,symbol:`arithmetic_multiply`},divide:{arity:2,symbol:`arithmetic_divide`},pow:{arity:2,symbol:`pow`},sqrt:{arity:1,symbol:`sqrt`},abs:{arity:1,symbol:`abs`},sin:{arity:1,symbol:`sin`},cos:{arity:1,symbol:`cos`},tan:{arity:1,symbol:`arithmetic_tan`},exp:{arity:1,symbol:`exp`},log:{arity:1,symbol:`log`}};export{S as a,E as i,D as n,u as o,k as r,R as t};