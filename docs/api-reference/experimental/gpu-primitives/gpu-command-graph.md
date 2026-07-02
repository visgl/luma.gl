import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUCommandGraph

<GPUPrimitivesDocsTabs active="command-graph" />

`GPUCommandGraph<Parameters>` declares fixed-capacity WebGPU buffer resources and ordered compute,
render, and copy nodes. `compile()` returns a `CompiledGPUCommandGraph` that owns transient buffers
and node resources but borrows every import.

```ts
const graph = new GPUCommandGraph<{time: number}>(device, {id: 'simulation'});
const source = graph.importBuffer(
  {id: 'source', byteLength: sourceBuffer.byteLength, usage: sourceBuffer.usage},
  sourceBuffer
);
const scratch = graph.createTransientBuffer({
  id: 'scratch',
  byteLength: sourceBuffer.byteLength,
  usage: Buffer.STORAGE
});

graph.addComputePass({
  id: 'update',
  resources: [
    {buffer: source, usage: 'storage-read'},
    {buffer: scratch, usage: 'storage-write'}
  ],
  compile: ({device}) => makeExecutableNode(device)
});

const compiled = graph.compile();
compiled.encode(device.commandEncoder, {parameters: {time}});
```

## Buffer APIs

### `importBuffer(descriptor, defaultBuffer?)`

Declares caller-owned storage. A default `Buffer` or `DynamicBuffer` may be supplied during graph
construction, or the caller may provide a compatible override to each encoding.

### `createTransientBuffer(descriptor)`

Declares graph-owned scratch storage. Compatible logical transients with non-overlapping lifetimes
may share one physical buffer.

### `createBufferView(handle, props)`

Creates a `GraphBufferView<T extends GPUVectorFormat>` with `format`, `length`, `byteOffset`,
`byteStride`, and `rowByteLength` metadata.

### `importGPUData(id, data)`

Imports the backing allocation and preserves the supplied `GPUData` range.

### `importGPUVector(id, vector)`

Imports a packed vector containing exactly one `GPUData` chunk. Multi-chunk and interleaved vectors
are rejected in the current experiment.

## Node APIs

- `addComputePass(node)` compiles an executable callback that receives a graph-owned `ComputePass`.
- `addRenderPass(node)` may resolve `RenderPassProps` for each encoding and receives a graph-owned
  `RenderPass`.
- `addCopyPass(node)` records directly on the caller's `CommandEncoder`.

Nodes declare resource uses with `storage-read`, `storage-write`, `storage-read-write`, `uniform`,
`copy-source`, `copy-destination`, `indirect`, `vertex`, or `index`. `dependsOn` adds explicit
ordering where buffers do not express the dependency.

## `CompiledGPUCommandGraph`

### `encode(commandEncoder, options)`

Records every compiled node. `options.parameters` is forwarded to callbacks. `options.buffers` may
override imported resources by ID if capacity and usage remain compatible.

`encode()` never submits, maps, reads, or grows resources.

### `stats`

Reports node order, logical and physical transient counts and bytes, bytes reused, and reuse
percentage.

### `destroy()`

Destroys compiled node resources and physical transients. Imported buffers remain caller-owned.
