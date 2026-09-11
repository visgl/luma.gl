import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUSpMV

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUSpMV` multiplies a sparse matrix in compressed sparse row (CSR) form by a dense `float32` vector entirely inside the GPU command graph.

## Motivation

Dense `GPUMatVec` establishes the linear-operator role for ordinary matrices. Sparse numerical methods need the same operation without storing or reading zeros. SpMV is the canonical CSR execution primitive and is central to iterative sparse solvers, graph-derived linear systems, discretized PDEs and many scientific workloads.

Adding SpMV also connects two previously separate parts of the GPU roadmap: offset-delimited irregular data and numerical linear algebra.

## Contract

The matrix is supplied as three packed views:

```text
rowOffsets    uint32[rows + 1]
columnIndices uint32[nnz]
values        float32[nnz]
```

Matrix row `r` owns the offset-delimited range:

```text
[rowOffsets[r], rowOffsets[r + 1])
```

Each entry `i` contributes:

```text
values[i] * vector[columnIndices[i]]
```

to the output for that row.

```ts
new GPUSpMV({
  rowOffsets,
  columnIndices,
  values,
  vector: x,
  output: y,
  columns
}).addToGraph(graph);
```

`output.length` defines the matrix row count. `vector.length` must equal `columns`. Empty matrix rows naturally produce zero.

The primitive assumes GPU-resident CSR invariants such as monotonic offsets and valid terminal offsets. It bounds-checks column indices in the baseline kernel but does not force CPU readback to validate the representation.

## Composition

The sparse construction and execution path becomes:

```text
COO generation
     ↓
sort / canonicalize
     ↓
GPUCOOToCSR
     ↓
CSR matrix
     ↓
  GPUSpMV
     ↓
GPUElementwise / GPUReduction
     ↓
iterative solver
```

This is enough infrastructure to begin constructing conjugate-gradient and related solver graphs once dot products and scalar-coefficient updates are formalized.

## Execution strategy

The baseline assigns one 256-thread workgroup to each sparse row. Lanes stride through that row's nonzeros, compute `value * x[column]` partials, then reduce the partial sums in workgroup memory.

This maps naturally to medium and wide rows and parallels the dense `GPUMatVec` reduction structure. Unlike dense matvec, however, sparse row lengths can vary dramatically.

## Performance notes

SpMV is generally memory-bandwidth and access-pattern limited. The matrix values and column indices are streamed, while accesses into the dense vector are indirect. Sparse row-length distributions strongly affect utilization.

One-workgroup-per-row is therefore a portable baseline, not a universal optimum. Future strategy selection should consider short-row subgroup kernels, multiple rows per workgroup, very-long-row splitting, subgroup reductions and row-length bucketing. The command graph/autotuner can eventually choose among strategies using matrix statistics rather than exposing those choices in the public API.

## Relationship to graph processing

CSR matrices and graph adjacency structures share the same offset-delimited shape. A weighted graph adjacency list can often be interpreted directly as a sparse matrix: row offsets identify each vertex's outgoing edge segment, column indices identify neighboring vertices, and values provide edge weights.

The sparse numerical layer should reuse that structural commonality without forcing graph algorithms and linear algebra into the same high-level API.

## Limitations and roadmap

The first implementation supports CSR `float32` values and a dense `float32` vector. It does not yet support transpose SpMV, multiple right-hand sides, alternative sparse layouts, `float16`, mixed precision or symmetric-matrix specialization.

Next numerical steps include reusable dot/norm operations and a conjugate-gradient solver graph. Performance work should add representative sparse matrices and row-distribution benchmarks before proliferating alternative storage formats.

Once the lightweight engine `Kernel` abstraction lands, this primitive should use it instead of `Computation`.
