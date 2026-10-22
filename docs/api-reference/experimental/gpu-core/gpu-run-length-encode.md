# GPURunLengthEncode and GPUUnique

[Reduction](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-reduction.md)[Segmented Reduction](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-reduction.md)[RLE and Unique](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-run-length-encode.md)[Histogram](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-histogram.md)[Group Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md)

## Overview[​](#overview "Direct link to Overview")

`GPURunLengthEncode` (RLE) replaces each contiguous run of equal values with the value and the run length. `GPUUnique` exposes the corresponding distinct adjacent values.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Turn adjacent equal uint32 values into ordered run values and lengths.                                        |
| **Reads / writes**       | Reads ordered values; writes bounded run values, lengths, and a valid-run count.                              |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | Only the prefix named by count is valid; first-occurrence order is preserved.                                 |
| **Expected work**        | Boundary detection, an inclusive run-ID scan, and chunk-aware materialization.                                |
| **Chunks**               | Runs continue across empty and uneven input chunks; outputs may be partitioned independently.                 |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | sorted keys → GPURunLengthEncode → segment metadata or grouped aggregation.                                   |

**Cost**The whole ordered input is visited even when it contains few runs.

**Common mistake**Do not confuse adjacent-run uniqueness with global uniqueness on unsorted input.

## What is run-length encoding?[​](#what-is-run-length-encoding "Direct link to What is run-length encoding?")

Given ordered values:

```
input = [2, 2, 2, 5, 5, 9, 9, 9, 9]
```

RLE describes the same run structure as:

```
values  = [2, 5, 9]

lengths = [3, 2, 4]
```

The operation is about **adjacent runs**, not global uniqueness. For example:

```
input  = [2, 2, 5, 2]

values = [2, 5, 2]
```

If global grouping is desired, sort by key first so equal keys become adjacent.

## Why RLE matters for GPU grouping[​](#why-rle-matters-for-gpu-grouping "Direct link to Why RLE matters for GPU grouping")

Sorting puts equal keys together, but downstream algorithms still need to know where each group starts and ends. RLE turns adjacency into explicit group metadata:

```
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

## Contract[​](#contract "Direct link to Contract")

Input is an ordered packed `uint32` vector. `values` and `lengths` are caller-owned capacity buffers; only the prefix described by `count` is valid.

```
graph.add(new GPURunLengthEncode({

  input: sortedKeys,

  values: uniqueKeys,

  lengths: runLengths,

  count: runCount

}));
```

The operation preserves first-occurrence order and does not sort input. Empty input writes `count = 0`.

## Composition[​](#composition "Direct link to Composition")

```
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

## GPUUnique[​](#gpuunique "Direct link to GPUUnique")

`GPUUnique` answers the simpler question “what are the distinct adjacent run values?” while retaining the same equality and ordering semantics. It should not introduce a second definition of uniqueness. A future optimized path may skip run-length materialization when only values are required.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

Boundary detection and scan are parallel. RLE is strongest when keys are already ordered, stable ordering matters, or group structure is reused. For unsorted data used only once, a hash aggregation may be cheaper than sort + RLE.

## Chunked storage[​](#chunked-storage "Direct link to Chunked storage")

Input, values, and lengths accept atomic views or independently partitioned vectors. Adjacent equal values continue the same run across chunk seams, including intervening empty chunks. Boundary flags use the previous nonempty chunk's final value, an inclusive global scan assigns run IDs, and materialization routes values and lengths into caller-owned output chunks. Every encoding resets valid run lengths and publishes the current count. `count` remains one atomic scalar view; only its named prefix of values and lengths is valid.
