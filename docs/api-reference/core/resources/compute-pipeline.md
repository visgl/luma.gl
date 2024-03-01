# ComputePipeline

:::info
`ComputePipeline` is only available on WebGPU. Note on WebGL you can still perform
many GPU computations on `RenderPipeline` using `TransformFeedback`.
:::

A `ComputePipeline` holds a compiled and linked compute shader.

## Usage

Create and run a compute shader that multiplies an array of numbers by 2.

```ts
const source = /*WGSL*/`\
@group(0) @binding(0) var<storage, read_write> data: array<i32>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  data[i] = 2 * data[i];
}`;

const shader = webgpuDevice.createShader({source});
const computePipeline = webgpuDevice.createComputePipeline({
  shader,
  shaderLayout: {
    bindings: [{name: 'data', type: 'storage', location: 0}]
  }
});

const workBuffer = webgpuDevice.createBuffer({
  byteLength: 4,
  usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
});

workBuffer.write(new Int32Array([2]));

computePipeline.setBindings({data: workBuffer});

const computePass = webgpuDevice.beginComputePass({});
computePass.setPipeline(computePipeline);
computePass.dispatch(1);
computePass.end();

webgpuDevice.submit();

const computedData = new Int32Array(await workBuffer.readAsync());
// computedData[0] === 4
```

## Types

### `ComputePipelineProps`

- `handle`: `unknown` - holds the underlying WebGPU object

## Members

- `device`: `Device` - holds a reference to the device that created this resource
- `handle`: `unknown` - holds the underlying WebGPU object
- `props`: `ComputePipelineProps` - holds a copy of the `ComputePipelineProps` used to create this `ComputePipeline`.

## Methods

### `constructor()`

`ComputePipeline` is an abstract class and cannot be instantiated directly. Create with 

```typescript
const computePipeline = device.createComputePipeline({...})
```

### `destroy(): void`

```typescript
destroy(): void
```
Free up any GPU resources associated with this compute pipeline immediately (instead of waiting for garbage collection).
