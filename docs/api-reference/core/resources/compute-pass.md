# ComputePass

:::info
WebGPU only
:::

A pass on which to run computations with compute pipelines.

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

### `ComputePassProps`

`ComputePassProps` extends [`ResourceProps`](../resource.md#resourceprops) and accepts the following fields.

| Property               | Type            | Default     | Description |
| ---------------------- | --------------- | ----------- | ----------- |
| `timestampQuerySet?`   | `QuerySet`      | `undefined` | Query set that will receive timestamps at the beginning and end of the pass. |
| `beginTimestampIndex?` | `number`        | `undefined` | Query set index that records the timestamp when the pass begins. No timestamp is written when omitted. |
| `endTimestampIndex?`   | `number`        | `undefined` | Query set index that records the timestamp when the pass ends. No timestamp is written when omitted. |

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `ComputePass`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `ComputePassProps` - holds a copy of the `ComputePassProps` used to create this `ComputePass`.

## Methods

### `constructor(props: ComputePassProps)`

`ComputePass` is an abstract class and cannot be instantiated directly. Create with `device.beginComputePass(...)`.

### `end(): void`

Free up any GPU resources associated with this compute pass.

### `pushDebugGroup(groupLabel: string): void`

Adds a debug group (implementation dependent).

### `popDebugGroup(): void`

Removes a debug group (implementation dependent).

### `insertDebugMarker(markerLabel: string): void`

Adds a debug marker (implementation dependent).
