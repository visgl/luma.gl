# GPUCOOToCSR

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Convert row-sorted COO entries into offset-delimited CSR rows on the GPU.                                     |
| **Reads / writes**       | Reads COO row, column, and value arrays; writes CSR offsets, columns, and values.                             |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | CSR structure preserving sorted entry order, empty rows, and duplicate coordinates.                           |
| **Expected work**        | Linear entry copies plus one lower-bound search per output row boundary.                                      |
| **Chunks**               | Independent source and output chunks preserve one logical sorted COO/CSR domain.                              |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | sorted COO → GPUCOOToCSR → adaptive SpMV or sparse solver.                                                    |

**Cost**Entry copies plus rows times logarithmic row-boundary search.

**Common mistake**Do not pass unsorted COO rows or assume duplicate coordinates are merged.

## Overview[​](#overview "Direct link to Overview")

`GPUCOOToCSR` converts row-sorted COO entries into CSR entirely on the GPU.

```
COO rows       [0,0 | 1 | 2,2]

                    ↓

CSR offsets    [0,   2,  3,    5]
```

The mathematical matrix does not change; only its indexing representation changes. COO is convenient during construction while CSR exposes each row as the contiguous interval `[rowOffsets[r], rowOffsets[r + 1])`, which is suitable for adaptive SpMV and sparse solvers.

The baseline copies column/value entries directly and constructs each row boundary with an independent lower-bound search over the sorted COO row IDs. Empty rows naturally produce repeated offsets. Duplicate coordinates are preserved; sorting and duplicate merging remain separate operations.

A future implementation may instead compose run-length encoding and scan. That is an execution-strategy choice rather than part of the public representation contract.

## Chunked storage[​](#chunked-storage "Direct link to Chunked storage")

All six columns accept atomic views or independently partitioned vectors. Sorted COO row IDs describe one logical matrix; a row may cross any number of chunks. Column/value copies intersect source and destination boundaries, while each row offset sums lower bounds over the sorted row-ID chunks. Empty rows and duplicate coordinates are preserved. No source array is concatenated, and the resulting CSR vectors can feed `GPUProgramSpMV` directly.
