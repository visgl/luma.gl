import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# Semantic conjugate gradient

## Overview

The conjugate-gradient program is the first end-to-end pressure test of the semantic GPU program layer. The solver itself contains no WebGPU buffers, command nodes, bindings, WGSL, dispatch counts, or indirect-command implementation details.

<GPUOperationContract operation="gpu-program-pcg" />

```text
GPUProgram
  external CSR matrix
  external rhs + initial solution
  scalar literals
  initial SpMV
  residual/search initialization
  dot
  GPULoopOperation(residual² > tolerance²)
    SpMV
    dot
    scalar divide
    vector MADD
    scalar compare
        |
        v
GPUProgramCompiler (WebGPU)
        |
        +-- external vectors -> imported graph buffers
        +-- scratch vectors  -> transient graph storage
        +-- scalars          -> packed GPUValueArena
        +-- SpMV             -> adaptive WebGPU strategy
        +-- loop             -> bounded GPU-gated dispatch sequence
        v
GPUCommandGraph
```

## External resource binding

`GPUProgram` declares logical external vectors. Typed GPUData chunks are supplied only when the program is compiled:

```ts
const solver = createGPUConjugateGradientProgram({
  size: n,
  nonZeros: nnz,
  maxIterations: 128,
  toleranceSquared: 1e-10
});

const compilation = new GPUProgramCompiler(device).compile(solver.program, {
  vectors: {
    [solver.rowOffsets.id]: rowOffsetsData,
    [solver.columnIndices.id]: columnIndicesData,
    [solver.values.id]: valuesData,
    [solver.rhs.id]: rhsData,
    [solver.solution.id]: solutionData
  }
});
```

The current CSR backend requires one physical chunk for each operand. Wrap existing buffers in `GPUData` with their format and length; binding never concatenates batches.

A future CUDA compiler can bind the same logical vectors to CUDA allocations without changing the program.

## Adaptive SpMV inside runtime control

SpMV is an important compiler test because one semantic operation may emit one or two compute nodes depending on the selected strategy. The WebGPU lowering records exact dispatch geometry for every emitted node. This lets the runtime-control lowering gate each concrete dispatch independently rather than assuming one operation equals one dispatch.

## Iteration semantics

The first PCG iteration is unconditional. It computes the convergence flag on the GPU. Remaining iterations are pre-encoded to the declared maximum and every compute dispatch is gated by that GPU-resident flag. Once the residual reaches tolerance, subsequent work receives a zero indirect dispatch dimension and performs no numerical work.

There is no convergence readback between iterations.

This is a WebGPU realization, not part of PCG semantics. A backend with native graph loops can lower the same `GPULoopOperation` differently.
