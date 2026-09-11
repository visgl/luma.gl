import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUSpMV

<GPUCoreDocsTabs active="reduction" />

## Overview

**SpMV** means sparse matrix-vector multiplication: `y = A x` where `A` stores only its nonzero entries. `GPUSpMV` performs this operation for a CSR matrix entirely inside the GPU command graph.

## Dense MatVec vs sparse SpMV

For a dense matrix:

```text
A = [10  0 20]
    [ 0 30  0]
    [40  0 50]
```

ordinary matrix-vector multiplication conceptually evaluates every matrix position, including zeros. Sparse storage keeps only:

```text
rowOffsets    = [0,2,3,5]
columnIndices = [0,2,1,0,2]
values        = [10,20,30,40,50]
```

SpMV then visits only those five stored entries.

For:

```text
x = [1, 2, 3]
```

we compute:

```text
y[0] = 10*x[0] + 20*x[2] = 70
y[1] = 30*x[1]           = 60
y[2] = 40*x[0] + 50*x[2] = 190

result = [70, 60, 190]
```

So SpMV is not a different mathematical multiplication; it is a representation-aware way to compute the same `Ax` while avoiding explicit zeros.

## How CSR maps to the operation

Each CSR row is an offset-delimited segment:

```text
row 0 -> entries [0,2)
row 1 -> entries [2,3)
row 2 -> entries [3,5)
```

For each stored entry `i` in row `r`:

```text
column = columnIndices[i]
contribution = values[i] * x[column]
y[r] += contribution
```

This can be viewed as **indirect gather + multiply + segmented reduction**:

```text
columnIndices ──▶ gather x[column]
                       │
values ────────────────×
                       │
                 reduce by CSR row
                       │
                       ▼
                       y
```

That connection is important: sparse numerical compute reuses the same irregular-data concepts as the rest of the GPU graph library.

## Contract

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

`output.length` defines the row count; `vector.length` equals the matrix column count. Empty rows naturally produce zero. CSR offsets are assumed monotonic and valid without CPU readback.

## Why SpMV matters

Large sparse systems appear in graph-derived linear algebra, finite-element/finite-difference discretizations, optimization and iterative solvers. In algorithms such as conjugate gradient, the dominant operation each iteration is often:

```text
p ──▶ A p
```

which is exactly SpMV.

```text
COO construction
      ↓
GPUCOOToCSR
      ↓
CSR matrix
      ↓
   GPUSpMV
      ↓
dot + vector updates
      ↓
iterative solver
```

## Execution strategy

The baseline assigns one 256-thread workgroup per sparse row. Lanes stride through the row's nonzeros, compute `value * x[column]` partials, then reduce them in workgroup memory.

## Performance notes

SpMV is usually memory/access-pattern limited. Matrix values and column indices stream sequentially, while `x[column]` is an indirect access. Row lengths may vary from zero to thousands of entries, so no single scheduling strategy is optimal.

Future strategies should include subgroup processing for short rows, multiple rows per workgroup, long-row splitting, row-length bucketing and autotuned selection. These strategies can preserve the CSR API.

## Relationship to graphs

A weighted graph adjacency list has the same structural arrays: row offsets identify a vertex's edge segment, column indices identify neighbors, and values are edge weights. Sparse algebra and graph processing can therefore share low-level offset-delimited infrastructure while retaining distinct high-level APIs.
