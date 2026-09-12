# GPUProgram

`GPUProgram` is Jarnevon's backend-independent semantic intermediate representation. It is intentionally distinct from `GPUCommandGraph`, which is the WebGPU execution graph.

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

## Hard boundary

A semantic `GPUOperation` does not expose `addToGraph()`. Operations do not own a `Device`, command encoder, bindings, dispatch dimensions, or command-graph nodes.

During migration, `GPUProgram` also accepts existing `GPUCommandGraphContributor` implementations. `GPUProgramCompiler` recognizes those legacy contributors and invokes `addToGraph()` as a temporary backend adapter. New semantic operations without a registered WebGPU lowering are rejected rather than silently acquiring execution responsibilities.

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
