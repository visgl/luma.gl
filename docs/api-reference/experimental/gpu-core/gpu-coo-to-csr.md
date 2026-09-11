# GPUCOOToCSR

## Overview

`GPUCOOToCSR` converts row-sorted coordinate-list sparse entries into compressed sparse row arrays entirely on the GPU.

## Motivation

COO is convenient while constructing sparse data because every entry carries an explicit row and column. CSR is better for row-oriented execution because rows become offset-delimited segments. A GPU-resident conversion lets construction flow directly into sparse numerical or graph execution without downloading row structure to JavaScript.

## Contract

The initial operation consumes row-sorted COO arrays:

```text
rowIndices    = [0,0,1,2,2]
columnIndices = [0,2,1,0,2]
values        = [10,20,30,40,50]
```

and produces:

```text
rowOffsets    = [0,2,3,5]
columnIndices = [0,2,1,0,2]
values        = [10,20,30,40,50]
```

Rows are described by offset-delimited ranges `[rowOffsets[r], rowOffsets[r + 1])`.

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

The initial primitive deliberately requires COO entries already sorted nondecreasing by row. Sorting and duplicate-coordinate canonicalization are separate concerns and can be composed before conversion.

## Execution strategy

The conversion has two independent GPU stages. The entry arrays are copied into CSR entry order, which is already correct because the COO input is row-sorted. Row offsets are then generated in parallel: each output boundary computes the lower bound of its row number in the sorted COO row-index array.

This produces correct offsets for empty rows as well as populated rows. For example, repeated equal offsets naturally represent empty rows.

## Composition

The intended sparse construction pipeline is:

```text
raw COO entries
      ↓
sort by row / column
      ↓
canonicalize duplicates if required
      ↓
GPUCOOToCSR
      ↓
GPUCSRMatrix
      ↓
GPUSpMV / graph / solver operations
```

The lower-bound baseline intentionally keeps this PR independent of the proposed RLE/segmented PRs. Once those primitives land, an alternative conversion strategy can be benchmarked using boundary detection, run-length encoding and scan. The public COO-to-CSR contract need not change.

## Semantics and validation

`rowIndices`, `columnIndices` and `values` must have equal logical length. `rowOffsets` must contain `rows + 1` entries. CSR column/value outputs must have capacity equal to the COO nonzero count.

The primitive assumes GPU-resident row indices are sorted and in range. It does not read them back for host validation. Duplicate `(row,column)` entries are preserved; merging duplicates is a separate canonicalization operation.

## Performance notes

The initial row-offset implementation performs one binary lower-bound search per row, giving approximately `O(rows log nnz)` row-index reads. This is attractive as a simple parallel baseline and handles empty rows naturally.

For very large row counts, a boundary/RLE/scan construction may reduce memory traffic. That alternative should be evaluated against the baseline rather than assumed faster: sparse shape, row distribution and GPU memory behavior all matter.

## Roadmap

The immediate consumer is `GPUSpMV`. Future work can add a canonicalization helper, benchmark lower-bound versus RLE/scan offset construction, and support additional sparse value formats where justified.

Once the lightweight `Kernel` abstraction lands, this primitive should use it instead of `Computation`.
