# GPUMatVec

[Elementwise](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-elementwise.md)[MatVec](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-matvec.md)[MatMul](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-matmul.md)

## Overview[​](#overview "Direct link to Overview")

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Apply one packed row-major float32 matrix to a packed float32 vector.                                         |
| **Reads / writes**       | Reads matrix rows and one shared vector; writes one scalar per matrix row.                                    |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | Exactly rows float32 values for an explicit rows-by-columns matrix.                                           |
| **Expected work**        | One workgroup reduction per matrix row in the baseline implementation.                                        |
| **Chunks**               | Independent packed matrix/vector/output chunks; row splits retain global column indices without scratch.      |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | row-major matrix + vector → GPUMatVec → elementwise update or reduction.                                      |

**Cost**Matrix bandwidth and column count dominate; the vector is reused across rows.

**Common mistake**Do not supply column-major storage or dimensions inconsistent with buffer lengths.

Matrix-vector multiplication applies a matrix `A` to a vector `x` to produce another vector `y`:

```
y = A x
```

For example:

```
A = [1 2 3]      x = [10]

    [4 5 6]          [20]

                       [30]
```

Each output is the dot product of one matrix row with `x`:

```
y[0] = 1*10 + 2*20 + 3*30 = 140

y[1] = 4*10 + 5*20 + 6*30 = 320



A x = [140, 320]
```

So MatVec can be pictured as many row dot-products sharing the same vector:

```
matrix row 0 ─┐

              ├─ dot with x ─▶ y[0]

matrix row 1 ─┤

              ├─ dot with x ─▶ y[1]

      ...     ─┘
```

Matrices often represent linear transformations, physical operators, graph-derived systems or discretized differential equations. Repeated `A*x` operations are central to iterative numerical methods.

## Row-major storage[​](#row-major-storage "Direct link to Row-major storage")

The API stores the logical matrix in row-major order:

```
matrix = [a00,a01,a02, a10,a11,a12]

          └─ row 0 ─┘   └─ row 1 ─┘
```

For `rows × columns`, matrix element `(row,column)` is at `row * columns + column`.

## Contract[​](#contract "Direct link to Contract")

```
import {GPUMatVec} from '@luma.gl/gpgpu/gpu-core';



graph.add(new GPUMatVec({

  matrix,

  vector: x,

  output: y,

  rows: 1024,

  columns: 1024

}));
```

The matrix contains at least `rows * columns` packed `float32` values, `x` contains at least `columns`, and `y` contains at least `rows`. Extra capacity is ignored; output tails are unchanged.

## Physical chunks[​](#physical-chunks "Direct link to Physical chunks")

Each operand accepts a `GraphDataView<'float32'>` or `GraphVectorView<'float32'>`. Their partitions are independent, and a matrix chunk can split a row. Logical column indices address the whole vector. Empty chunks and nonzero aligned byte offsets are supported.

Lowering borrows the original buffers and allocates no scratch or concatenated storage. Each input-chunk pair contributes to each output chunk. The first pass initializes the output; later passes accumulate, so encoding the same graph again replaces the previous result. Different partitions can change floating-point summation order.

Output buffers must be separate from both inputs, and output chunks must not overlap. Every chunk, including empty chunks, must belong to the target graph. Active bindings must fit device limits; the logical matrix can exceed one binding when its individual chunks fit. A zero row count emits no work. A zero column count explicitly writes zero to active output rows.

## Dense vs sparse MatVec[​](#dense-vs-sparse-matvec "Direct link to Dense vs sparse MatVec")

Dense MatVec stores every matrix value, including zeros. `GPUSpMV` performs the same mathematical `Ax` operation for a sparse representation that stores only nonzero entries:

```
              y = A x

             /       \

      GPUMatVec     GPUSpMV

        dense         sparse
```

This shared linear-operator role is useful in solver design.

## Composition[​](#composition "Direct link to Composition")

```
GPUMatVec

    ↓

residual/vector update

    ↓

dot / norm

    ↓

iterative solver
```

## Execution strategy[​](#execution-strategy "Direct link to Execution strategy")

The kernel assigns one 256-thread workgroup to each matrix row for each input-chunk pair. Lanes process columns in parallel and then reduce their partial products to one output value. Large row ranges use bounded three-dimensional dispatches. Dispatch count grows with the product of matrix, vector, and output chunk counts; routing only relevant row ranges remains performance work.

WebGPU and packed scalar `float32` storage are required. Dimensions are non-negative signed 32-bit integers, with each logical operand containing at most `2^32 - 1` elements.

MatVec is usually memory-bandwidth constrained because the matrix streams through memory while `x` is repeatedly reused. Future strategies may cache vector tiles, use subgroup reductions, or specialize for narrow/wide matrices.

## Why MatVec before MatMul?[​](#why-matvec-before-matmul "Direct link to Why MatVec before MatMul?")

MatVec establishes matrix shape, row-major layout and reduction semantics with a relatively simple kernel. Competitive matrix-matrix multiplication requires tiling and substantially more performance engineering, so it is treated separately by `GPUMatMul`.
