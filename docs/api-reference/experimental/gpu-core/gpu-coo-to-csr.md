# GPUCOOToCSR

## Overview

`GPUCOOToCSR` converts a sparse matrix from coordinate (COO) representation into compressed sparse row (CSR) representation entirely on the GPU.

## What changes during COO → CSR?

Consider:

```text
A = [10  0 20]
    [ 0 30  0]
    [40  0 50]
```

COO explicitly stores a row number for every nonzero:

```text
rowIndices    = [0,0,1,2,2]
columnIndices = [0,2,1,0,2]
values        = [10,20,30,40,50]
```

CSR removes `rowIndices` and replaces them with N+1 row boundaries:

```text
rowOffsets    = [0,2,3,5]
columnIndices = [0,2,1,0,2]
values        = [10,20,30,40,50]
```

Visually:

```text
COO rows:      [0,0 | 1 | 2,2]
                    ↓ compress row identity
CSR offsets:   [0,   2,  3,    5]
```

Nothing about the mathematical matrix changes. Only its indexing representation changes.

## Why convert?

COO is easy to construct because every entry is independent. CSR is efficient for row-oriented execution because all entries for row `r` are immediately available as:

```text
[rowOffsets[r], rowOffsets[r + 1])
```

This makes conversion a natural boundary between construction and execution:

```text
generate entries
      ↓
     COO
      ↓
sort/canonicalize
      ↓
 GPUCOOToCSR
      ↓
     CSR
      ↓
SpMV / graph / solver
```

## Empty rows

Offset-delimited representation handles empty rows without special records. If row 1 contains no entries:

```text
rowOffsets = [0, 2, 2, 5]
                       ↑
               [2,2) is empty
```

Repeated offsets therefore have useful semantics and are not malformed data.

## Contract

The initial operation requires COO entries sorted nondecreasing by row:

```ts
new GPUCOOToCSR({
  rowIndices,
  columnIndices,
  values,
  rows,
  rowOffsets,
  outputColumnIndices,
  outputValues
}).addToGraph(graph);
```

Sorting and duplicate-coordinate canonicalization are separate operations. Duplicate `(row,column)` entries are preserved by conversion.

## Execution strategy

Because input is row-sorted, column/value arrays are already in CSR entry order and can be copied directly. Each CSR boundary independently finds the first COO entry whose row is at least that boundary's row number—a lower-bound search.

```text
sorted COO row indices
[0 0 0 2 2 4]
 ↑     ↑   ↑ ↑
row0  row1 row3 row5 boundaries
```

Rows missing from COO naturally map to repeated boundaries.

## Alternative composition

Once the general grouping primitives land, row offsets can also be viewed as a grouping problem:

```text
sorted row IDs
      ↓
run boundaries / RLE
      ↓
run lengths
      ↓
scan
      ↓
row offsets
```

The lower-bound implementation is a simple independent baseline. RLE/scan may reduce traffic for some shapes and should be benchmarked rather than assumed superior.

## Performance notes

The baseline performs one binary search per row, approximately `O(rows log nnz)` row-index reads. It remains entirely GPU-resident and handles populated and empty rows uniformly.
