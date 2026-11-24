import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUGraph

For portable fullscreen image processing on WebGPU, use
[`GPUShaderPassOperation`](../../graph/gpu-shader-pass-operation.md) with named texture inputs
and scalar parameters. The same operation description also runs on WebGPU GPUSimpleGraph.

## Overview

`GPUGraph` describes operations and logical values without requiring a device during authoring.
Its execution implementation currently requires WebGPU. `GPUCommandGraph` is the lower-level
pass and resource graph produced by lowering. Start with the
[graph tutorial](/docs/api-reference/graph/getting-started) for reusable compilation and runtime inputs;
this reference also covers the advanced, concrete-dimension compiler interface.

Built-in reusable operations include
[GPUUploadOperation and GPUCopyOperation](/docs/api-reference/graph/gpu-transfer-operations),
which also work in reusable SimpleGraph, and WebGPU
[GPUCompactionOperation](/docs/api-reference/graph/gpu-compaction-operation), which produces
capacity and a GPU logical count.

<GPUOperationContract operation="gpu-graph" />

```text
GPUGraph                       semantic / portable
  GPUOperation
  GPUCompositeOperation
  GPUConditionalOperation
  GPULoopOperation
        |
        | GPUGraphCompiler
        v
GPUCommandGraph                  execution / WebGPU
  compute pass
  render pass
  copy pass
  resources / hazards
  dispatch / indirect dispatch
        |
        v
CompiledGPUCommandGraph
```

## Why two graphs?

A mathematical operation and an executable GPU command are different abstractions. `SpMV` describes sparse matrix-vector multiplication; it does not prescribe a workgroup size, shader, dispatch count, storage binding layout, or even a GPU backend.

`GPUGraph` therefore owns **what** the application asks the GPU to do. `GPUCommandGraph` owns **how WebGPU work is organized and executed**.

This separation is also compatible with native execution systems such as CUDA Graphs. A semantic `GPULoopOperation` may lower on WebGPU to a bounded sequence of GPU-gated indirect dispatches, while a CUDA backend could lower the same semantic loop to a native CUDA conditional WHILE graph node.

## External inputs and operation-defined results

Use `addInput(name, gpuGraph.scalar(...))` or `addInput(name, gpuGraph.vector(...))` for
external inputs, and `addState()` for initialized borrowed vector state. Operations declare
their results through contracts; expressions infer theirs automatically. Applications select
returned outputs at compilation and supply `{inputs, state, outputTargets}` at execution.
See [Graph inputs, results, and state](/docs/api-reference/graph/gpu-graph-values) for examples,
ownership, dynamic dimension support, and current boundaries.

## API

```ts
const graph = new GPUGraph({id: 'pcg'});
graph.add([
  initialize,
  new GPULoopOperation({
    id: 'iterations',
    predicate: residualAboveTolerance,
    maximumIterations: 256,
    body: iteration
  })
]);

const compilation = new GPUGraphCompiler(device).compile(graph);
const commandGraph = compilation.graph;
```

Arrays are root-level construction sugar. `GPUCompositeOperation` preserves semantic grouping.

The public semantic value and operation types are `GPUGraphScalar`, `GPUGraphVector`, `GPUGraphTexture`, `GPUGraphTextureView`,
`GPUGraphScalarLiteral`, `GPUGraphScalarOperation`, `GPUGraphVectorMADD`,
`GPUGraphDotProduct`, `GPUGraphCSRMatrix`, and `GPUGraphSpMV`. The WebGPU
`GPUGraphCompiler` lowers these built-ins using explicit `GPUOperationLowering` descriptors; custom
semantic operation types can supply an equally explicit backend lowering.

## Hard boundary

A semantic `GPUOperation` does not expose `getCommandNodes()`. Operations do not own a `Device`, command encoder, bindings, dispatch dimensions, or command-graph nodes.

`GPUGraph` also accepts `GPUGraphPrimitive` objects that construct explicit command nodes against the compiler-supplied graph. There is no graph-mutation compatibility fallback. Semantic operations require an explicit backend lowerer.

The intended end state is:

```text
operation -> compiler lowering -> command graph
```

not:

```text
operation -> mutates command graph
```

## Compilation owns provenance

Semantic-to-command provenance belongs to the compilation result:

```ts
compilation.lowering
```

rather than to `GPUCommandGraph`. The same execution graph could in principle be produced from different semantic programs or by direct low-level construction.

The lowering report links command nodes back to root-to-leaf operation paths, enabling semantic timing, memory attribution, strategy explanations, WGSL navigation, control-flow lowering, and future planning layers.

## Backend direction

`GPUGraph` should remain constructible without a WebGPU `Device`. This keeps open a future architecture where the same semantic program targets multiple execution backends:

```text
                 GPUGraph
                     |
                planning
              /              \
     GPUGraphCompiler    CUDA compiler
              |               |
     GPUCommandGraph       CUDA Graph
              |               |
           WebGPU             CUDA
```

Backend portability is a design constraint, not a promise of an immediate CUDA implementation.

## Vector bindings and chunk topology

A `GPUData` describes one physical chunk. A `GPUVector` is an ordered logical sequence of chunks.
`GPUGraphVector` declares its logical format and length, plus optional `chunkLengths` when the
application needs a particular partition. A single chunk follows the same compilation path.

```ts
const input = graph.vector('input', 'float32', batch0.length + batch1.length, {external: true});
const output = graph.vector('output', 'float32', input.length, {
  chunkLengths: [batch0.length, batch1.length]
});
const compilation = new GPUGraphCompiler(device).compile(graph, {
  vectors: {input: [batch0, batch1]} // Existing GPUData chunks; no upload or concatenation.
});
const chunks = compilation.vectors.get(input.id).chunks;
// Each descriptor has offset (logical rows), length, and data (a physical GraphDataView).
```

Bindings accept a `GPUVectorLike` (including `GPUVector`), a single `GPUData`, or a readonly
`GPUData[]`. Raw `Buffer` bindings
must be wrapped in `GPUData` with explicit format and layout. Import preserves physical buffers,
byte offsets, row strides, empty chunks, and source order. Shared physical buffers share graph
hazard tracking. Imports borrow storage; destroying a compiled program does not destroy the source.

Both `GPUVector.chunks` and `GraphVectorView.chunks` use the same metadata definition. A descriptor's
`data` holds canonical physical format, byte offset, byte stride and row payload size. Compiler
bindings snapshot the current source chunks; later appends require recompilation to participate.

`resolveVector()` and `compilation.vectors` always return `GraphVectorView`. Explicit transient
`chunkLengths` are retained; otherwise the compiler partitions transients to fit the device's
storage-buffer binding capacity. External bindings must match logical format and length, and must
match explicit chunk lengths when supplied. They are never repacked to satisfy a declaration.

MADD intersects source and destination chunk boundaries through borrowed views. Dot product sums
chunk partials into one scalar, resetting the result on every invocation. These lowerings retain
per-node dispatch geometry for GPU predicates. Neither requires matching source batches or a
contiguous copy. Current numeric kernels require packed float32 rows; strided layout can be bound
and inspected but is rejected by kernels that do not support it.

CSR SpMV resolves all operands as graph vectors. Row offsets, nonzero columns/values, the dense
input, and output may have independent chunk boundaries. Cross-chunk rows use global indices;
source buffers remain borrowed, long-row scratch is bounded, and GPU predicates retain each
node's exact dispatch geometry. See the individual operation contracts for specialized domain
constraints and performance costs.


### Shared vector shape

`GPUVectorLike<Format, Data>` is the structural, read-only contract for an ordered vector. Its
required fields are `length` and `data`; `format` can be inferred from nonempty chunks. Optional
aggregate metadata is inferred during graph import. `GPUVector` and `GraphVectorView` implement
this contract using their respective physical and graph-managed chunk types. It carries no
allocation or destruction methods, so other implementations do not need to subclass `GPUVector`.

WebGPU graph bindings accept structural vectors whose chunks are `GPUData`, without creating
an intermediate `GPUVector` wrapper:

```ts
compiler.compile(graph, {
  vectors: {input: {format: 'float32', length: 5, data: inputChunks}}
});
```

`GPUVectorInput` names the shared storage input union in `gpu-data`; there is no program-specific
vector-binding type. `GPUGraphBindings` is only a TypeScript object type for the named bindings,
not a runtime wrapper. `GPUGraphVector` remains a symbolic declaration: it can describe transient
storage before a device or buffer exists. Keeping this declaration separate avoids adding program
identity, external-binding flags, or compiler allocation state to ordinary `GPUVector` instances.

## Buffer and texture management

See [Buffers and textures](/docs/api-reference/experimental/gpu-core/resources) for logical values,
views, imported and transient ownership, hazard tracking, history, resizing, and encoding contracts.

`graph.texture(id, props)` declares logical texture storage using the graph texture descriptor
fields plus `external`. `graph.textureView(texture, props)` selects subresources without allocating
storage. `GPUGraphCompiler.compile()` accepts optional `textures` defaults; imported textures may
also be supplied when encoding. `compilation.textures` exposes logical graph texture handles.
Custom lowerers resolve storage with `resolveTexture()` and views with `resolveTextureView()`.

Reusable `compile(device)` programs also support named texture inputs and operation-produced
texture results. See [texture values and execution bindings](/docs/api-reference/graph/gpu-graph-textures).

## Grouped aggregation and scalar reduction

`GPUGraphGroupAggregation` and `GPUGraphReduction` are built-in semantic operations.
They lower to the existing [GPUGroupAggregation](./gpu-group-aggregation.md) and
[GPUReduction](./gpu-reduction.md) kernels without custom compiler registration:

```ts
import {
  GPUGraph, GPUGraphGroupAggregation, GPUGraphReduction, gpuGraph
} from '@luma.gl/graph/gpu-graph';

const graph = new GPUGraph();
graph.addInput('keys', gpuGraph.vector('uint32'));
graph.addInput('weights', gpuGraph.vector('float32'));
graph.addInput('selection', gpuGraph.vector('uint32'));
graph.add([
  new GPUGraphGroupAggregation({
    keys: 'keys', values: 'weights', mask: 'selection',
    output: 'groups', groupCount: 100, operation: 'sum'
  }),
  new GPUGraphReduction({input: 'groups', output: 'domain', operation: 'extent'})
]);
const compiled = graph.compile(device, {outputs: ['groups', 'domain']});
const result = await compiled.run({inputs: {keys, weights, selection}});
// Both outputs are GPUVectors. Readback is explicit.
result.groups.destroy();
result.domain.destroy();
compiled.destroy();
```

### Inputs and outputs

- `GPUGraphGroupAggregation` accepts dense `uint32` keys and an optional `uint32` mask.
  Nonzero mask values select rows; keys outside `[0, groupCount)` are ignored.
  `count` returns `uint32`; `sum`, `min`, `max`, and `mean` accept finite `float32`
  contributions and return `float32`. `groupCount` infers a packed result length.
  It can be omitted with the concrete compiler API when output dimensions are
  declared explicitly using `graph.vector(...)`.
- `GPUGraphReduction` accepts scalar `uint32`, `sint32`, or `float32` inputs and an
  optional `uint32` mask. `sum`, `min`, and `max` return one row; `extent` returns
  two rows containing minimum and maximum. Output format matches input format.
- Logical references may be names or typed `GPUGraphVector` objects. Inputs retain
  their supported chunk/stride layouts and masks may have independent partitions.
  Destinations must be one packed chunk. Use `outputTargets` for caller-owned
  result storage; operation-defined results cannot overwrite inputs or `addState()`.

### Execution and ownership

The compiler uses existing kernels and graph-owned scratch storage. Operations
encode no CPU readback. Inputs and caller-provided targets remain borrowed; returned
results belong to the caller. Repeated executions reset grouped statistics, including
empty groups. Empty counts and sums are zero; empty min/max/mean groups are NaN.
Scalar reductions retain the underlying kernel's masking and nonfinite-value rules.
