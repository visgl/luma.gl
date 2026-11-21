# GPUSegmentedScan

[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scan.md)[Segmented Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-segmented-scan.md)[Scatter](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scatter.md)[Gather](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-gather.md)

## Overview[​](#overview "Direct link to Overview")

`GPUSegmentedScan` computes independent prefix sums over variable-length contiguous ranges described by **offset-delimited segments**.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Compute independent prefix sums over offset-delimited packed segments.                                        |
| **Reads / writes**       | Reads packed uint32 values and segment offsets; writes source-aligned prefixes.                               |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | One exclusive or inclusive prefix per input row, reset at each segment boundary.                              |
| **Expected work**        | One workgroup per segment in the baseline implementation.                                                     |
| **Chunks**               | Consumes one packed value domain with explicit CSR-style offsets.                                             |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | segment offsets + values → GPUSegmentedScan → local ranks or offsets.                                         |

**Cost**Large or highly skewed segments limit parallelism in the baseline kernel.

**Common mistake**Do not omit the terminal offset or assume prefixes continue across segments.

## Prefix scans and segmented scans[​](#prefix-scans-and-segmented-scans "Direct link to Prefix scans and segmented scans")

A prefix scan turns values into running totals. For example, an exclusive scan of:

```
input  = [2, 3, 4, 5]

output = [0, 2, 5, 9]
```

while the inclusive form is:

```
output = [2, 5, 9, 14]
```

A segmented scan packs several independent sequences into one buffer and resets the running total at each boundary:

```
values  = [2, 3 | 4, 5, 6 | 7]

offsets = [0,   2,        5,   6]



exclusive = [0, 2 | 0, 4, 9 | 0]

inclusive = [2, 5 | 4, 9,15 | 7]
```

Segment `s` is `[offsets[s], offsets[s + 1])`. N segments require N+1 offsets; repeated offsets describe empty segments. Offsets are nondecreasing and relative to the input view. Offsets beyond the input length are clamped, and rows outside the covered ranges are left alone. Prefix sums wrap modulo 2^32.

This general representation also appears in Arrow lists, graph adjacency and CSR matrices, but the segmented API is not matrix-specific.

## Why it matters[​](#why-it-matters "Direct link to Why it matters")

Many GPU structures contain thousands of logical lists packed into one allocation. They need local ranks, local allocation positions or prefix weights without launching a separate scan for every list. A canonical segmented scan makes that operation reusable.

## Contract[​](#contract "Direct link to Contract")

The initial operation consumes packed `uint32` values and `segmentOffsets`. The output has the same length as the input and supports `exclusive` and `inclusive` modes.

```
import {GPUSegmentedScan} from '@luma.gl/graph/gpu-core';





graph.add(new GPUSegmentedScan({

  input: weights,

  segmentOffsets,

  output: prefixWeights,

  mode: 'exclusive'

}));
```

Empty segments are valid and write no rows.

## Composition[​](#composition "Direct link to Composition")

```
sort / RLE / grouping / sparse construction

                     ↓

              segmentOffsets

                     ↓

             GPUSegmentedScan

                     ↓

       local ranks / offsets / positions
```

Together with `GPUSegmentedReduction`, this establishes the basic segmented algebra needed by grouped aggregation, graph adjacency processing, sparse structures and columnar list data.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

Each segment gets a 256-lane workgroup. The lanes scan tiles in parallel and carry the previous tile total forward. Dispatch spans multiple axes when needed. Long segments process their tiles sequentially within one workgroup.

## Limitations[​](#limitations "Direct link to Limitations")

The initial primitive supports `uint32` addition only. Input/output aliasing is rejected. The GPU trusts the producer to supply nondecreasing offsets.
