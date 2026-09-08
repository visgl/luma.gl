# GPUFlagOffsets

<!-- -->

## Overview[​](#overview "Direct link to Overview")

`GPUFlagOffsets` turns one packed binary flag stream into exclusive dense indices and a GPU-resident count. It is the smallest useful materialization step after a classifier.

## At a glance

| Question                 | Answer                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| **Problem**              | Turn one packed binary flag stream into stable dense indices and a count.                   |
| **Reads / writes**       | Reads uint32 zero-or-one flags; writes exclusive uint32 offsets and one scalar count.       |
| **Ownership**            | Flags, offsets, and count are caller-owned; hierarchical scan scratch is graph-owned.       |
| **Output contract**      | One source-aligned exclusive offset per flag and an exact count modulo uint32.              |
| **Expected work**        | One hierarchical exclusive scan plus one scalar publication pass.                           |
| **Chunks**               | Consumes one GraphDataView; invoke once per durable source chunk to retain boundaries.      |
| **Conditions / budgets** | Contributes ordinary graph nodes and never compiles, submits, maps, or reads back.          |
| **Neighborhood**         | format classifier → GPUFlagOffsets → compaction destinations, counts, or GPUSegmentOffsets. |

**Cost**The complete flag stream is scanned even when few flags are set.

**Common mistake**Flags must be zero or one; larger values are summed rather than normalized.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use it when later GPU work needs a stable destination for every accepted slot, or when an indirect consumer needs the number of accepted slots. Typical uses include nullable-value layout, stable scatter, variable-length value offsets, and the logical-element stream at one nesting depth.

Use `GPUScan` directly if no total count is needed. Use `GPUCompaction` if the operation should also move `uint32` values. Use `GPUSegmentedLayout` if value, element, and group layout are all needed at one depth. For nested layouts, compose one shared `GPUFlagOffsets` for leaf validity with one element `GPUFlagOffsets` and `GPUSegmentOffsets` per depth.

## Contract[​](#contract "Direct link to Contract")

| View      | Length              | Meaning                                                   |
| --------- | ------------------- | --------------------------------------------------------- |
| `flags`   | slot count          | Packed values that must be exactly zero or one            |
| `offsets` | at least slot count | Exclusive prefix sum; the dense destination for each slot |
| `count`   | at least 1          | Total set flags in element zero                           |

An empty input writes `count[0] = 0`. No offset element exists for an empty input. Counts and offsets use `uint32` arithmetic, so callers must retain page or batch boundaries before overflow.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUCommandGraph, GPUFlagOffsets} from '@luma.gl/gpgpu/gpu-core';



const graph = new GPUCommandGraph(device, {id: 'nullable-column'});



new GPUFlagOffsets({

  id: 'present-values',

  flags: validity,

  offsets: valueOffsets,

  count: nonNullValueCount

}).addToGraph(graph);
```

The class contributes graph nodes only. It does not allocate public outputs, compile the graph, submit work, or map the count. A compiled graph can be reused when its view sizes and topology stay fixed; imported buffers may be rebound for each encoding.

## Costs and mistakes[​](#costs-and-mistakes "Direct link to Costs and mistakes")

The complete flag stream is scanned even when few values are present. Keep flags GPU-resident when several consumers reuse the result; a CPU round trip solely to obtain the count defeats the main benefit. Values greater than one are summed, not clamped, so normalize arbitrary predicates before calling the operation.
