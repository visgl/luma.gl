# GPU program lowering

`GPUProgram` is semantic. A backend compiler owns every decision that turns those semantics into executable work.

```text
GPUProgram
  GPUOperation
  Composite
  Conditional
  Loop
      |
      | backend compiler
      v
execution graph
```

## Lowering registry

`GPUOperationLoweringRegistry` maps semantic operation types to backend implementations. Operations do not import WebGPU APIs or mutate a command graph.

A WebGPU compiler can flatten a composite because WebGPU has no child-graph primitive. A future CUDA compiler could preserve the same composite as a CUDA child graph when that improves execution.

The compiler records each choice in `compilation.lowering.decisions` so an inspector can answer not only *what nodes were emitted?* but *why was this realization selected?*

## Backend capabilities

Lowerers receive a compact capability contract rather than inspecting backend internals:

```text
backend
GPU-resident conditionals
native semantic loops
child executable graphs
```

The initial WebGPU compiler advertises GPU-resident conditional dispatch but no native loop or child-graph primitive. This is intentionally different from CUDA Graphs, which can provide native conditional WHILE nodes and executable child graphs.

## Control flow

A semantic loop does not prescribe how iteration occurs:

```text
GPULoopOperation
        |
        +-- WebGPU: bounded expansion + GPU-written indirect dispatch gates
        |
        +-- CUDA: possible native conditional WHILE graph node
```

Loops without runtime predicates can already lower by bounded unrolling. Runtime predicates remain explicit compiler errors until the WebGPU compiler has a concrete predicate binding plus per-node indirect-dispatch geometry. This is preferable to silently inserting CPU readback or pretending a single dispatch gate can condition an arbitrary composite.

## Migration

Existing algorithms that expose `addToGraph()` are temporarily accepted as legacy WebGPU contributors. Their lowering decision is recorded as `legacy-addToGraph`.

New semantic operations should instead receive registered backend lowerers. The migration bridge can disappear once the numerical library has been converted.

## Why record decisions?

Eventually an inspector should be able to explain a compilation such as:

```text
PCG
  loop
    lowering: gpu-gated bounded sequence
    reason: WebGPU has no native graph loop

  SpMV
    lowering: subgroup-row
    reason: short-row CSR workload + subgroup support

  reduction
    lowering: hierarchical
    reason: N exceeds single-workgroup capacity
```

This decision record is the beginning of the planner/compiler interface that Ploor can later own without changing `GPUProgram` or `GPUCommandGraph`.
