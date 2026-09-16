import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUCOOToCSR

<GPUOperationContract operation="gpu-coo-to-csr" />

## Overview

`GPUCOOToCSR` converts row-sorted COO entries into CSR entirely on the GPU.

```text
COO rows       [0,0 | 1 | 2,2]
                    ↓
CSR offsets    [0,   2,  3,    5]
```

The mathematical matrix does not change; only its indexing representation changes. COO is convenient during construction while CSR exposes each row as the contiguous interval `[rowOffsets[r], rowOffsets[r + 1])`, which is suitable for adaptive SpMV and sparse solvers.

The baseline copies column/value entries directly and constructs each row boundary with an independent lower-bound search over the sorted COO row IDs. Empty rows naturally produce repeated offsets. Duplicate coordinates are preserved; sorting and duplicate merging remain separate operations.

A future implementation may instead compose run-length encoding and scan. That is an execution-strategy choice rather than part of the public representation contract.


## Chunked storage

All six columns accept atomic views or independently partitioned vectors. Sorted COO row IDs describe one logical matrix; a row may cross any number of chunks. Column/value copies intersect source and destination boundaries, while each row offset sums lower bounds over the sorted row-ID chunks. Empty rows and duplicate coordinates are preserved. No source array is concatenated, and the resulting CSR vectors can feed `GPUProgramSpMV` directly.
