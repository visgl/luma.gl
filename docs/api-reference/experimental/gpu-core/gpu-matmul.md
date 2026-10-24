# GPUMatMul

[Elementwise](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-elementwise.md)[MatVec](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-matvec.md)[MatMul](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-matmul.md)

## Overview[​](#overview "Direct link to Overview")

## At a glance

| Question                 | Answer                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Multiply packed row-major float32 matrices with explicit M, K, and N dimensions.                                 |
| **Reads / writes**       | Reads M-by-K and K-by-N matrices; writes one M-by-N destination matrix.                                          |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                     |
| **Output contract**      | One row-major float32 result; partitioning can change floating-point summation order.                            |
| **Expected work**        | A tiled two-dimensional dispatch with cooperative workgroup-memory reuse.                                        |
| **Chunks**               | Independent packed matrix chunks may split rows and tiles; shared-memory tile loads borrow the original buffers. |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned.    |
| **Neighborhood**         | dense matrices → GPUMatMul → dense numerical or machine-learning graph stages.                                   |

**Cost**M×K×N arithmetic with performance governed by tile reuse and matrix shape.

**Common mistake**Do not swap K/N dimensions or assume transpose and batched layouts are implicit.

Matrix multiplication combines two matrices by taking dot products between rows of `A` and columns of `B`:

```
C = A B
```

If `A` is M×K and `B` is K×N, the result `C` is M×N:

```
C[row,col] = Σ A[row,k] * B[k,col]
```

Example:

```
A = [1 2]    B = [5 6]

    [3 4]        [7 8]



C = [1*5+2*7   1*6+2*8] = [19 22]

    [3*5+4*7   3*6+4*8]   [43 50]
```

The operation is often called **GEMM** (general matrix-matrix multiplication) in numerical libraries. GEMM is foundational because many dense numerical, scientific and ML workloads reduce to large amounts of matrix multiplication.

## Why tiling matters on a GPU[​](#why-tiling-matters-on-a-gpu "Direct link to Why tiling matters on a GPU")

A naive implementation computes each output independently and repeatedly reloads the same A/B values from storage memory. Matrix multiplication has enormous data reuse, so good GPU kernels load a small block—or **tile**—once into fast workgroup memory and reuse it for many multiply-adds.

Conceptually:

```
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

```
K dimension

A row tiles:  [ A0 ][ A1 ][ A2 ] ...

                 ×     ×     ×

B col tiles:  [ B0 ][ B1 ][ B2 ] ...

                 │     │     │

                 └── accumulate ──▶ C tile
```

This is the first major difference between GEMM and simpler elementwise GPU operations: execution strategy is fundamental to useful performance.

## Contract[​](#contract "Direct link to Contract")

```
import {GPUMatMul} from '@luma.gl/gpgpu/gpu-core';



graph.add(new GPUMatMul({

  left: a,

  right: b,

  output: c,

  m: 1024,

  k: 512,

  n: 1024

}));
```

All matrices are packed row-major `float32`. Edge tiles are bounds-checked, so dimensions need not be multiples of 16. Each operand must have capacity for its matrix shape; extra input rows are ignored and spare output rows are preserved.

## Physical chunks[​](#physical-chunks "Direct link to Physical chunks")

`left`, `right`, and `output` each accept a `GraphDataView<'float32'>` or `GraphVectorView<'float32'>`. Their partitions can differ and can split rows or tiles. Empty chunks and nonzero aligned byte offsets are supported.

Each source-chunk pair contributes through the existing 16×16 workgroup tiles, using global matrix coordinates and bounds-checked chunk loads. Output passes cover the rows intersecting each destination chunk and store only that chunk's elements. Workgroup memory retains tile reuse; no scratch buffers or concatenated caller storage are allocated.

The first contribution initializes each output chunk, and later contributions accumulate. Repeated encodings replace the previous result. Partitioning can change floating-point summation order. Outputs must use separate buffers from inputs, and output chunks must not overlap. All chunks must belong to the graph, including unused or empty chunks.

Each active chunk binding must fit device limits; logical matrices can exceed one binding. Zero output dimensions emit no work. When `k = 0`, active output elements are explicitly zeroed. Dimensions are non-negative signed 32-bit integers, and each logical matrix contains at most `2^32 - 1` elements.

## Relationship to MatVec[​](#relationship-to-matvec "Direct link to Relationship to MatVec")

```
GPUMatVec: matrix × vector → vector

GPUMatMul: matrix × matrix → matrix
```

MatVec is frequently memory-bandwidth dominated. GEMM has much greater arithmetic reuse and can become compute-bound when tiling and blocking are effective.

## Performance strategy[​](#performance-strategy "Direct link to Performance strategy")

A fixed 16×16 tile is a portable baseline, not a universal optimum. Performance depends on tile dimensions, per-thread output blocking, vectorized loads, workgroup-memory behavior, register pressure, matrix shape and GPU architecture.

This makes GEMM a strong target for Jarnevon autotuning:

```
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

Chunked dispatch count grows with the product of left, right, and output chunk counts. Small chunks can repeat tile and inner-dimension work. Selective chunk-pair routing and crossover tuning remain performance work. Dispatches are bounded across three workgroup dimensions.

## Scope[​](#scope "Direct link to Scope")

The API deliberately avoids a tensor framework. Physical chunking represents one logical matrix. Independent tensor batches, transpose flags, `float16`, mixed precision, and richer layouts remain future work. Sparse multiplication belongs to the CSR/SpMV substrate.
