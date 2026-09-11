# GPU sparse matrices

## What is a sparse matrix?

A sparse matrix contains mostly zeros. For example:

```text
A = [10  0 20]
    [ 0 30  0]
    [40  0 50]
```

A dense representation stores all nine values. A sparse representation stores only the five nonzero entries plus enough indexing information to recover their positions. For large matrices arising from graphs, meshes, PDE discretizations and optimization problems, avoiding the zeros can reduce storage and memory traffic dramatically.

`GPUCOOMatrix` and `GPUCSRMatrix` represent the same sparse matrix in two different ways. They define GPU-resident data and shape only; conversion and numerical operations remain separate graph operations.

## COO: coordinate format

COO stores every nonzero explicitly as `(row, column, value)`:

```text
rowIndices    = [0, 0, 1, 2, 2]
columnIndices = [0, 2, 1, 0, 2]
values        = [10,20,30,40,50]
```

which means:

```text
(0,0)=10  (0,2)=20
(1,1)=30
(2,0)=40  (2,2)=50
```

or visually:

```text
      col 0  col 1  col 2
row 0   10      0     20
row 1    0     30      0
row 2   40      0     50
```

COO is convenient during construction because entries are independent records. GPU pipelines can generate, compact, concatenate and sort entries without first building row metadata.

```ts
const matrix = new GPUCOOMatrix({rows: 3, columns: 3, rowIndices, columnIndices, values});
```

COO does not inherently require sorting. Duplicate coordinates can also exist; canonicalization may sort by `(row,column)` and merge duplicates when an algorithm requires that property.

## CSR: compressed sparse row format

CSR reorganizes the same entries by row and removes the repeated row index:

```text
rowOffsets    = [0, 2, 3, 5]
columnIndices = [0, 2, 1, 0, 2]
values        = [10,20,30,40,50]
```

The offsets divide the column/value arrays into rows:

```text
entries       = [0,2 | 1 | 0,2]
values        = [10,20|30|40,50]
rowOffsets    = [0,   2,  3,    5]
```

Row `r` owns `[rowOffsets[r], rowOffsets[r + 1])`. Thus row 0 uses entries `[0,2)`, row 1 `[2,3)`, and row 2 `[3,5)`.

This is an example of the general **offset-delimited segment** representation used throughout the GPU graph library. Repeated offsets represent empty rows:

```text
rowOffsets = [0, 2, 2, 5]
                    ↑
              row 1 is empty
```

```ts
const matrix = new GPUCSRMatrix({rows: 3, columns: 3, rowOffsets, columnIndices, values});
```

## COO vs CSR

They are not competing mathematical formats; they favor different phases:

```text
                    easy to generate
                          │
                          ▼
                         COO
                    (row,col,value)
                          │
                  sort / canonicalize
                          │
                          ▼
                         CSR
              (row offsets + col + value)
                          │
                    row execution
                          ▼
                SpMV / graphs / solvers
```

COO spends one row index per nonzero but makes entries explicit. CSR stores only `rows + 1` row offsets and makes all entries belonging to a row contiguous, which is valuable for row-oriented GPU algorithms.

## Connection to graphs

A weighted graph adjacency list has almost the same shape as CSR:

```text
rowOffsets    -> where each vertex's neighbors begin/end
columnIndices -> neighboring vertex IDs
values        -> edge weights
```

This structural commonality is why sparse linear algebra and graph processing can share low-level offset-delimited infrastructure without sharing the same high-level API.

## Sparse construction pipeline

```text
entry generation
      ↓
GPUCOOMatrix
      ↓
sort by row/column
      ↓
optional duplicate merge
      ↓
GPUCOOToCSR
      ↓
GPUCSRMatrix
      ↓
GPUSpMV / solver operations
```

RLE, scan and segmented primitives can provide reusable pieces of this construction pipeline.

## Validation and semantics

The data structures validate host-visible shape relationships only. They do not read GPU memory back to verify index bounds, monotonic CSR offsets, or terminal offset values. Producers establish those GPU-resident invariants.

The initial value format is `float32`; indices and offsets are `uint32`.
