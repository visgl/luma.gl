import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUProgram

## Overview

`GPUProgram` is Jarnevon's backend-independent semantic intermediate representation. It is intentionally distinct from `GPUCommandGraph`, which is the WebGPU execution graph.

<GPUOperationContract operation="gpu-program" />

```text
GPUProgram                       semantic / portable
  GPUOperation
  GPUCompositeOperation
  GPUConditionalOperation
  GPULoopOperation
        |
        | GPUProgramCompiler
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

`GPUProgram` therefore owns **what** the application asks the GPU to do. `GPUCommandGraph` owns **how WebGPU work is organized and executed**.

This separation is also compatible with native execution systems such as CUDA Graphs. A semantic `GPULoopOperation` may lower on WebGPU to a bounded sequence of GPU-gated indirect dispatches, while a CUDA backend could lower the same semantic loop to a native CUDA conditional WHILE graph node.

## API

```ts
const program = new GPUProgram({id: 'pcg'});
program.add([
  initialize,
  new GPULoopOperation({
    id: 'iterations',
    predicate: residualAboveTolerance,
    maximumIterations: 256,
    body: iteration
  })
]);

const compilation = new GPUProgramCompiler(device).compile(program);
const graph = compilation.graph;
```

Arrays are root-level construction sugar. `GPUCompositeOperation` preserves semantic grouping.

The public semantic value and operation types are `GPUProgramScalar`, `GPUProgramVector`,
`GPUProgramScalarLiteral`, `GPUProgramScalarOperation`, `GPUProgramVectorMADD`,
`GPUProgramDotProduct`, `GPUProgramCSRMatrix`, and `GPUProgramSpMV`. The WebGPU
`GPUProgramCompiler` lowers these built-ins through its `GPUOperationLoweringRegistry`; custom
semantic operation types can register an equally explicit backend lowering.

## Hard boundary

A semantic `GPUOperation` does not expose `getCommandNodes()`. Operations do not own a `Device`, command encoder, bindings, dispatch dimensions, or command-graph nodes.

`GPUProgram` also accepts `GPUProgramPrimitive` objects that construct explicit command nodes against the compiler-supplied graph. There is no graph-mutation compatibility fallback. Semantic operations require a registered backend lowerer.

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

`GPUProgram` should remain constructible without a WebGPU `Device`. This keeps open a future architecture where the same semantic program targets multiple execution backends:

```text
                 GPUProgram
                     |
                planning
              /              \
     GPUProgramCompiler    CUDA compiler
              |               |
     GPUCommandGraph       CUDA Graph
              |               |
           WebGPU             CUDA
```

Backend portability is a design constraint, not a promise of an immediate CUDA implementation.

## Vector bindings and chunk topology

A `GPUData` describes one physical chunk. A `GPUVector` is an ordered logical sequence of chunks.
`GPUProgramVector` declares its logical format and length, plus optional `chunkLengths` when the
application needs a particular partition. A single chunk follows the same compilation path.

```ts
const input = program.vector('input', 'float32', batch0.length + batch1.length, {external: true});
const output = program.vector('output', 'float32', input.length, {
  chunkLengths: [batch0.length, batch1.length]
});
const compilation = new GPUProgramCompiler(device).compile(program, {
  vectors: {input: [batch0, batch1]} // Existing GPUData chunks; no upload or concatenation.
});
const chunks = compilation.vectors.get(input.id).chunks;
// Each descriptor has offset (logical rows), length, and data (a physical GraphDataView).
```

Bindings accept a `GPUVector`, a single `GPUData`, or a readonly `GPUData[]`. Raw `Buffer` bindings
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

The current CSR SpMV backend requires one physical chunk per operand and rejects multi-chunk
bindings explicitly. General sparse indexing, global reordering, and the library-wide operation
batching audit remain follow-up work; this foundation does not claim universal algorithm coverage.
