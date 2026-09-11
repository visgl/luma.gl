import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPURunLengthEncode and GPUUnique

## Overview

`GPURunLengthEncode` (RLE) replaces each contiguous run of equal values with the value and the run length. `GPUUnique` exposes the corresponding distinct adjacent values.

## What is run-length encoding?

Given ordered values:

```text
input = [2, 2, 2, 5, 5, 9, 9, 9, 9]
```

RLE describes the same run structure as:

```text
values  = [2, 5, 9]
lengths = [3, 2, 4]
```

The operation is about **adjacent runs**, not global uniqueness. For example:

```text
input  = [2, 2, 5, 2]
values = [2, 5, 2]
```

If global grouping is desired, sort by key first so equal keys become adjacent.

## Why RLE matters for GPU grouping

Sorting puts equal keys together, but downstream algorithms still need to know where each group starts and ends. RLE turns adjacency into explicit group metadata:

```text
unsorted keys
     ↓
   GPUSort
     ↓
[2,2,2,5,5,9,9,9,9]
     ↓
GPURunLengthEncode
     ↓
values  [2,5,9]
lengths [3,2,4]
     ↓
offset-delimited groups / segmented reduction
```

For the example, run lengths `[3,2,4]` correspond to offsets `[0,3,5,9]`. Those offsets can describe the same groups to segmented operations and are structurally identical to the offset-delimited representation used by lists and CSR rows.

## Contract

Input is an ordered packed `uint32` vector. `values` and `lengths` are caller-owned capacity buffers; only the prefix described by `count` is valid.

```ts
new GPURunLengthEncode({
  input: sortedKeys,
  values: uniqueKeys,
  lengths: runLengths,
  count: runCount
}).addToGraph(graph);
```

The operation preserves first-occurrence order and does not sort input. Empty input writes `count = 0`.

## Composition

```text
sort
 ↓
RLE / unique
 ↓
run lengths
 ↓
offset construction
 ↓
GPUSegmentedReduction / GPUSegmentedScan
 ↓
grouped results
```

The implementation uses a boundary-detection pass, `GPUScan` to assign dense run indices, then materialization of values, lengths and count.

## GPUUnique

`GPUUnique` answers the simpler question “what are the distinct adjacent run values?” while retaining the same equality and ordering semantics. It should not introduce a second definition of uniqueness. A future optimized path may skip run-length materialization when only values are required.

## Performance notes

Boundary detection and scan are parallel. RLE is strongest when keys are already ordered, stable ordering matters, or group structure is reused. For unsorted data used only once, a hash aggregation may be cheaper than sort + RLE.
