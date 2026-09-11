import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUMatMul

<GPUCoreDocsTabs active="reduction" />

## What is matrix multiplication?

Matrix multiplication combines two matrices by taking dot products between rows of `A` and columns of `B`:

```text
C = A B
```

If `A` is M×K and `B` is K×N, the result `C` is M×N:

```text
C[row,col] = Σ A[row,k] * B[k,col]
```

Example:

```text
A = [1 2]    B = [5 6]
    [3 4]        [7 8]

C = [1*5+2*7   1*6+2*8] = [19 22]
    [3*5+4*7   3*6+4*8]   [43 50]
```

The operation is often called **GEMM** (general matrix-matrix multiplication) in numerical libraries. GEMM is foundational because many dense numerical, scientific and ML workloads reduce to large amounts of matrix multiplication.

## Why tiling matters on a GPU

A naive implementation computes each output independently and repeatedly reloads the same A/B values from storage memory. Matrix multiplication has enormous data reuse, so good GPU kernels load a small block—or **tile**—once into fast workgroup memory and reuse it for many multiply-adds.

Conceptually:

```text
A                         B
┌──────────────┐          ┌──────────────┐
│   A tile     │          │   B tile     │
└──────┬───────┘          └──────┬───────┘
       └──────────┬──────────────┘
                  ▼
          workgroup memory
                  │
        many multiply-adds
                  │
                  ▼
              C tile
```

The baseline uses 16×16 tiles. Each workgroup computes one 16×16 region of C and walks across K in 16-value slices.

```text
K dimension
A row tiles:  [ A0 ][ A1 ][ A2 ] ...
                 ×     ×     ×
B col tiles:  [ B0 ][ B1 ][ B2 ] ...
                 │     │     │
                 └── accumulate ──▶ C tile
```

This is the first major difference between GEMM and simpler elementwise GPU operations: execution strategy is fundamental to useful performance.

## Contract

```ts
new GPUMatMul({
  left: a,
  right: b,
  output: c,
  m: 1024,
  k: 512,
  n: 1024
}).addToGraph(graph);
```

All matrices are initially packed row-major `float32`. Edge tiles are bounds-checked, so dimensions need not be multiples of 16.

## Relationship to MatVec

```text
GPUMatVec: matrix × vector → vector
GPUMatMul: matrix × matrix → matrix
```

MatVec is frequently memory-bandwidth dominated. GEMM has much greater arithmetic reuse and can become compute-bound when tiling and blocking are effective.

## Performance strategy

A fixed 16×16 tile is a portable baseline, not a universal optimum. Performance depends on tile dimensions, per-thread output blocking, vectorized loads, workgroup-memory behavior, register pressure, matrix shape and GPU architecture.

This makes GEMM a strong target for Jarnevon autotuning:

```text
matrix shape + device limits
            ↓
      strategy candidates
  8×8 / 16×16 / asymmetric
  subgroup / blocked / vectorized
            ↓
         autotuner
            ↓
       selected kernel
```

Benchmarks should cover square, tall/skinny, short-K and non-aligned matrices rather than reporting one headline dimension.

## Scope

The initial API deliberately avoids a tensor framework. Future additions such as transpose flags, batching, `float16`, mixed precision and richer layouts should be driven by demonstrated workloads. Sparse multiplication belongs to the CSR/SpMV substrate rather than complicating dense GEMM.
