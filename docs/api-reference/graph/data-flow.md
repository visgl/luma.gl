---
title: CPU and GPU data flow
description: Compose CPU and GPU processing, control result residency, and avoid redundant transfers.
---

# CPU and GPU data flow

Reusable `GPUGraph` and `GPUSimpleGraph` programs separate a vector's logical format and
shape from the location of its bytes. A numeric input can arrive as a `CPUVector` or
`GPUVector`. CPU callbacks run against CPU snapshots; GPU operations run against GPU
storage. Execution materializes the representation each consumer needs.

The diagrams below show logical values and transfer boundaries. A box does not imply a
separate allocation or a worker thread.

## Storage, declarations, and operations

```text
                      Logical graph value
                  format • rows • chunk lengths
                              │
                  ┌───────────┴───────────┐
                  │                      │
             CPUVector                GPUVector
          ordered CPUData          ordered GPUData
          borrowed CPU bytes       GPU buffer ranges
                  │                      │
             CPU callbacks          GPU operations
```

`gpuGraph.vector('float32x3')` declares a logical input. It does not allocate storage or
choose a device location. `CPUData` describes one CPU byte range; `CPUVector` retains an
ordered collection of those chunks. GPU equivalents describe GPU buffer ranges and their
ownership. A format describes memory, not a CRS or shader expression.

For a fixed numeric vector, `length` counts rows. For a list vector, `length` counts logical
rows and `valueLength` counts flattened elements; `valueOffsets` describes row boundaries.
Single-level list storage is available in CPUData/GPUData and explicit adapters. It does not
make lists legal inputs to portable numeric graph expressions or CPU callbacks.

## What triggers a transfer?

| Producer or binding | Consumer | Action |
| --- | --- | --- |
| CPUVector / CPU callback | CPU callback | Use CPU data; no GPU allocation or readback |
| CPUVector / CPU callback | GPU operation | Upload once, then cache GPU representation |
| GPUVector / GPU operation | CPU callback | Submit producers, read back once, then cache CPU representation |
| GPUVector / GPU operation | GPU operation | Use GPU storage |
| Any vector | Selected CPU output | Materialize CPU representation if absent |
| Any vector | Selected GPU output, the default | Materialize GPU representation if absent |

Caches belong to one invocation. Reusing a compiled program does not reuse data caches
across runs. GPU writes invalidate an earlier CPU representation of the same logical value.
CPU input arrays are borrowed: do not mutate or detach their buffers until the run settles.
Callbacks must treat their supplied arrays as read-only. Snapshot construction or packing
can still copy CPU bytes even when no CPU/GPU transfer occurs.

### CPU-only chains

```text
┌───────────┐   ┌────────────────┐   ┌─────────────┐   ┌───────────┐
│ CPUVector │ → │ CPU projection │ → │ CPU analysis│ → │ CPUVector │
└───────────┘   └────────────────┘   └─────────────┘   └───────────┘
                    zero GPU uploads / zero GPU readbacks
```

Request a CPU output explicitly. Otherwise the final result is uploaded because GPUVector
is the default result representation.

```typescript
import {CPUData, CPUVector} from '@luma.gl/graph/gpu-data';
import {GPUCPUOperation, gpuGraph} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

const source = new CPUVector({
  name: 'measurements',
  format: 'float32',
  data: [new CPUData({
    buffer: new Float32Array([1, 2, 3]), format: 'float32', length: 3
  })]
});
const graph = new GPUSimpleGraph();
graph.addInput('source', gpuGraph.vector('float32'));
graph.add(new GPUCPUOperation({
  id: 'double', inputs: {values: 'source'},
  outputs: {result: gpuGraph.vector('float32')},
  execute({inputs}) {
    const values = inputs.values;
    if (typeof values === 'number') throw new Error('Expected vector');
    return {result: {chunks: values.chunks.map(chunk => ({
      values: Float32Array.from(chunk.values, value => value * 2)
    }))}};
  }
}));
const compiled = graph.compile<{result: CPUVector}>(device, {
  outputs: ['result'], outputLocations: {result: 'cpu'}
});
try {
  const {result} = await compiled.run({inputs: {source}});
  // result retains CPU storage; CPUVector has no destroy() method.
} finally {
  compiled.destroy();
}
```

### Mixed execution and branches

```text
CPU input → CPU A → CPU B ── upload ──┬→ GPU consumer A
                                    └→ GPU consumer B
                         one shared GPU representation

GPU input → GPU producer ─ readback ─┬→ CPU consumer A
                                    └→ CPU consumer B
                         one shared CPU representation
```

Transfers are demand-driven, not optimizations inferred from callback code. The executor
knows that a `GPUCPUOperation` executes on CPU; it does not inspect its JavaScript body.
CPU callbacks can return promises, but do not automatically run in workers.

Readback introduces a submission/synchronization boundary. A CPU consumer cannot read GPU
commands that are still pending in a caller-owned encoder. CPU-containing programs use
asynchronous `run()`; their prepared/scoped encoding paths are unsupported.

## Arrow and native geometry paths

```text
Apache Arrow ── adapter ── CPUVector ───────────────┐
                                                 │
GPUVector ── demand-driven readback ── CPU arrays ─┤
                                                 ↓
                              CPU projection graph → GPUVector → layer

CPUVector ↔ math.gl GeoArrow descriptors → math.gl tessellation
                                             ↓
                           positions • indices • source row IDs
                                             ↓
                                explicit GPU upload → polygon model
```

`makeCPUVectorFromArrow` and `makeArrowVectorFromCPUVector` live in
`@luma.gl/graph/arrow`. They support compatible numeric rows and one-level numeric lists,
retain chunks and parent validity, and reject nullable children. Sliced offsets/validity are
normalized; compatible payloads are borrowed. Reverse conversion packs strided or unaligned
payloads when Arrow requires contiguous aligned arrays. Normalized formats and Float64
are outside this adapter's initial supported memory formats.

`makeGeoArrowColumnFromCPUVector` and `makeCPUVectorFromGeoArrowColumn` live in the optional
`@luma.gl/graph/gpu-project/geoarrow` entry. Packed Float32 coordinate buffers are borrowed
without constructing Apache Arrow objects. Reverse conversion accepts normalized interleaved
point, linestring and multipoint layouts representable by CPUVector. Deeper geometry topology
stays in math.gl GeoArrow descriptors. Unsupported layouts are rejected, not silently flattened.

`projectCPUVector` uses these direct descriptors, batches contiguous valid coordinate spans,
skips null rows, and preserves the original name, format, chunks and list topology.
`tessellateGeoArrowColumnToCPUVectors` calls math.gl directly for full polygon descriptors,
including holes and multipolygons. Resource limits are forwarded. No renderer color arrays
are generated. Math.gl's current tessellator still materializes geometry rows internally;
this path is not a zero-allocation tessellator. Clipping/resampling streams and worker
scheduling remain explicit math.gl/application concerns.

## Layer-facing point preparation

`CoordinateProjectionGraph` provides a reusable boundary for Arrow-enabled and GPUVector-native
layers. It selects GPUGraph on WebGPU and GPUSimpleGraph on other supported devices.

```typescript
import {CoordinateProjectionGraph} from '@luma.gl/graph/gpu-project/graph';
import {projectArrowCoordinates} from '@luma.gl/graph/arrow';
import {projectionEngine} from '@math.gl/geospatial/projection';

const projection = await projectionEngine.createProjectionAsync({
  from: 'EPSG:4326', to: 'EPSG:3857'
});
const pipeline = new CoordinateProjectionGraph(device, {
  format: 'float32x2', projection
});
const first = await projectArrowCoordinates(pipeline, arrowCoordinates);
const second = await pipeline.run(nextCoordinatesGPUVector);
// Each input is expressed in the prepared transform's source CRS.
// Bind first.positions or second.positions to a layer/model as appropriate.
// After downstream GPU consumers have finished:
first.destroy();
second.destroy();
pipeline.destroy();
```

This first API accepts non-null Float32 xy/xyz point rows. Null filtering and list geometry
preparation happen before this boundary. Reuse the graph for data changes, including new
row counts/chunks; construct a new graph when the projection changes. This API prepares data;
it does not update a deck.gl layer, schedule redraws, or dispose a layer's previous result.

## API and lifetime reference

| API | Contract |
| --- | --- |
| `new CPUData({buffer, format, length, ...layout})` | Borrow one buffer/view. Supplied byteOffset is relative to the view; stored byteOffset is absolute in its underlying buffer. Optional stride, flattened count, offsets and bitmap describe storage. |
| `new CPUVector({name?, format, data})` | Preserve ordered compatible chunks. CPU memory is garbage-collected; no destroy method. |
| `new GPUCPUOperation({id, inputs, outputs, execute})` | Named reads and typed results. Callback receives scalars or CPU snapshots with chunks/pack(); returns typed arrays or explicit chunks, synchronously or asynchronously. Dynamic output lengths resolve after execution. |
| `compile(device, {outputs, outputLocations})` | Select escaped results. Omitted location means GPU. Use the existing compile generic to describe CPU result types. |
| `new CPUProjectionOperation({id, input, output, format, projection})` | Flat Float32 xy/xyz forward projection. Copies inputs and awaits the transform; CRS/loading/axis semantics remain caller-owned. |
| `new CoordinateProjectionGraph(device, {format, projection})` | Compile the point preparation pipeline. `run(source)` returns independent `{positions, destroy()}` results. |
| `projectArrowCoordinates(pipeline, arrowVector)` | Adapt Arrow coordinate chunks into that same pipeline. |
| `makeGPUVectorFromCPUVector(device, source, options?)` | Explicit transfer preserving metadata/chunks. GPU result owns buffers. Index usage infers compatible uint16/uint32 type; incompatible types are rejected. |
| `makeCPUVectorFromGPUVector(source)` | Async explicit readback preserving list offsets and parent validity in returned CPU chunks. |

Graph inputs are borrowed. Selected GPU outputs belong to the caller; release them after
consumers finish. Unselected GPU intermediates belong to the invocation and are released on
success or failure. Destroying a compiled graph does not destroy previously returned selected
outputs. An active CPU invocation retains its executor until it settles; concurrent CPU runs
and destruction during a run are rejected. Failed callbacks reject the run and permit retry.
Destroy each compiled program when it is no longer used.

## Supported boundaries and verification

Portable graph CPU residency currently supports float32, sint32 and uint32 rows with one to
four components. It rejects validity/list metadata rather than discarding it. Explicit storage
adapters and transfers support a broader set of memory formats. Textures, mutable state,
output targets and caller-owned encoding are outside the CPU residency path; GPU-only paths
retain their existing contracts.

Transfer-count tests assert no GPU allocation for CPU chains, one shared readback across CPU
branches, and one upload for a CPU input feeding multiple GPU consumers. Adapter tests cover
nullable slices, chunks, offsets, Float16, projection and polygon tessellation. Layer preparation
tests read both returned buffers after graph destruction to verify independent ownership.

See [inputs/results/state](./gpu-graph-values.md), [SimpleGraph](./gpu-simple-graph.md), and
[upload/copy operations](./gpu-transfer-operations.md) for the underlying execution contracts.
