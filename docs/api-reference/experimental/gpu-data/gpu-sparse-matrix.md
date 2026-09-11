# GPU sparse matrices

## Overview

`GPUCOOMatrix` and `GPUCSRMatrix` are lightweight views over GPU-resident sparse matrix data. They define representation and shape only; conversion, multiplication and other algorithms remain separate graph operations.

This separation lets sparse data structures participate in the same GPU data model as the rest of luma.gl without coupling storage to one execution strategy.

## COO: construction-oriented representation

Coordinate format stores one `(row, column, value)` triple for every nonzero matrix entry:

```text
rowIndices    = [0, 0, 1, 2, 2]
columnIndices = [0, 2, 1, 0, 2]
values        = [10,20,30,40,50]
```

This describes:

```text
(0,0)=10  (0,2)=20
(1,1)=30
(2,0)=40  (2,2)=50
```

COO is intentionally simple and is well suited to construction pipelines. Entries can be generated, compacted, concatenated, sorted by `(row,column)`, and optionally merged before conversion to a row-oriented representation.

```ts
const matrix = new GPUCOOMatrix({
  rows: 3,
  columns: 3,
  rowIndices,
  columnIndices,
  values
});
```

The data structure does not require entries to be sorted and does not currently define duplicate-coordinate semantics. Algorithms that require canonical COO should establish those properties explicitly.

## CSR: execution-oriented row representation

Compressed sparse row format removes the repeated row index and describes each row as an offset-delimited segment:

```text
rowOffsets    = [0, 2, 3, 5]
columnIndices = [0, 2, 1, 0, 2]
values        = [10,20,30,40,50]
```

Row `r` owns the half-open range:

```text
[rowOffsets[r], rowOffsets[r + 1])
```

Therefore the example contains:

```text
row 0 -> entries [0,2)
row 1 -> entries [2,3)
row 2 -> entries [3,5)
```

This is the same general offset-delimited-segment representation used by segmented GPU primitives and variable-length columnar data. CSR is one important application of that pattern; the generic segmented APIs deliberately do not use sparse-matrix terminology.

```ts
const matrix = new GPUCSRMatrix({
  rows: 3,
  columns: 3,
  rowOffsets,
  columnIndices,
  values
});
```

`rowOffsets.length` must equal `rows + 1`, while `columnIndices` and `values` contain one row for each stored nonzero.

## Why both?

COO and CSR optimize different stages of a sparse workflow:

```text
entry generation
      ↓
     COO
      ↓
sort / canonicalize / merge
      ↓
  COO -> CSR
      ↓
     CSR
      ↓
SpMV / graph / solver operations
```

COO makes individual sparse entries explicit, which is convenient during construction. CSR groups those entries by row, avoiding a stored row index per nonzero and making row-oriented execution such as sparse matrix-vector multiplication efficient.

## Composition with GPU primitives

The Jarnevon primitive vocabulary should make sparse construction increasingly compositional:

```text
GPUCompact / GPUScatter
          ↓
         COO
          ↓
       GPUSort
          ↓
GPURunLengthEncode(rows)
          ↓
 offset construction
          ↓
         CSR
```

A future `GPUCOOToCSR` graph operation can package that workflow while reusing the underlying primitives rather than introducing an unrelated sparse conversion subsystem.

Similarly, `GPUSpMV` can consume `GPUCSRMatrix` and a dense vector while remaining an algorithm separate from the storage representation.

## Validation and semantics

The lightweight data structures validate host-visible shape relationships only. They do not read GPU memory back to verify that row/column indices are in bounds, that CSR offsets are monotonic, or that the terminal offset equals the nonzero count. Producers are responsible for establishing those GPU-resident invariants.

The initial value format is `float32` and indices/offsets are `uint32`. Additional value types should be driven by concrete sparse workloads.

## Roadmap

The intended progression is:

1. `GPUCOOMatrix` / `GPUCSRMatrix` representation
2. graph-native `GPUCOOToCSR`
3. `GPUSpMV`
4. sparse solver composition
5. additional sparse operations only where they share reusable infrastructure

This keeps the sparse layer focused: representation first, then composable graph operations, rather than embedding execution policy into matrix containers.
