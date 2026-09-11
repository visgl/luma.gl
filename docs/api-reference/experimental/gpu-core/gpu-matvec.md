import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUMatVec

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUMatVec` multiplies a dense row-major `float32` matrix by a packed `float32` vector entirely inside the GPU command graph.

## Motivation

Elementwise arithmetic provides the dense vector glue, but many numerical algorithms also need a linear operator. Matrix-vector multiplication is the smallest useful dense linear-algebra primitive that crosses that boundary: each output row computes a dot product between one matrix row and the input vector.

Making matvec graph-native provides a reusable building block for iterative solvers, transformations, numerical methods and dense reference implementations. It also establishes matrix layout conventions before introducing the substantially more performance-sensitive matrix-matrix multiply problem.

## Contract

The initial API deliberately avoids a general tensor abstraction. The matrix is one packed row-major `GraphDataView<'float32'>` with `rows * columns` values. The vector contains `columns` values and the output contains `rows` values.

```ts
new GPUMatVec({
  matrix,
  vector: x,
  output: y,
  rows: 1024,
  columns: 1024
}).addToGraph(graph);
```

The mathematical operation is:

```text
y[row] = sum(matrix[row, column] * x[column])
```

All resources remain caller-owned and GPU-resident. The primitive contributes compute work to the graph but performs no submission or readback.

## Composition

Matvec becomes especially useful together with the other numerical primitives:

```text
          GPUMatVec
              ↓
        GPUElementwise
       residual / MADD
              ↓
         GPUReduction
          dot / norm
              ↓
       iterative solver
```

This is enough infrastructure to begin expressing algorithms such as conjugate gradient once dot-product and solver orchestration are added. A future sparse matrix-vector primitive can expose the same conceptual role while consuming an offset-delimited sparse representation instead of a dense row-major matrix.

## Why matvec before matmul?

Dense matrix multiplication is an important target but a poor place to establish basic API semantics: competitive GEMM requires tiling, shared-memory reuse, device specialization, vectorized loads and careful benchmarking. Matvec has a much smaller implementation surface while still forcing the library to define matrix shape, layout, dispatch and reduction behavior.

The initial row-major contract can therefore be validated independently before `GPUMatMul` introduces tiled execution and potentially richer layout metadata.

## Performance notes

The first implementation assigns one 256-thread workgroup to each matrix row. Lanes stride across columns, multiply matrix/vector values, then perform a workgroup-tree reduction to one output value. This is a reasonable baseline for medium and wide rows and exposes straightforward future subgroup optimization.

Matvec is typically memory-bandwidth constrained because the matrix is streamed once while the vector is repeatedly reused. Future implementations may cache vector tiles in workgroup memory, use subgroup reductions, specialize workgroup size, or choose alternate strategies for narrow matrices. Those optimizations need not change the API contract.

## Limitations and roadmap

The first API supports row-major packed `float32` only. It does not yet support transpose flags, batching, strided matrices, `float16`, mixed precision, bias/activation fusion or matrix views. Those should be introduced from demonstrated workloads rather than by prematurely creating a tensor framework.

A future sparse `GPUSpMV` should share the same role in solver graphs. `GPUMatMul` is the next dense-linear-algebra step and will require a tiled implementation plus explicit performance benchmarks.

Once the lightweight engine `Kernel` abstraction lands, this primitive should use it instead of `Computation`.
