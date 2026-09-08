# GPUSegmentOffsets

<!-- -->

## Overview[​](#overview "Direct link to Overview")

`GPUSegmentOffsets` publishes dense segment indices and list-style boundaries from segment-start flags when logical-element offsets have already been materialized.

## At a glance

| Question                 | Answer                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Problem**              | Publish list-style boundaries when logical-element offsets are already available.                |
| **Reads / writes**       | Reads element flags/offsets and segment-start flags; writes segment indices, offsets, and count. |
| **Ownership**            | All public views are caller-owned; hierarchical segment-scan scratch is graph-owned.             |
| **Output contract**      | Source-aligned segment indices plus a segmentCount + 1 valid offset prefix.                      |
| **Expected work**        | One hierarchical inclusive scan, one offset publication pass, and one scalar count pass.         |
| **Chunks**               | Consumes one GraphDataView chunk and preserves its local segment coordinate space.               |
| **Conditions / budgets** | Contributes ordinary graph nodes and never compiles, submits, maps, or reads back.               |
| **Neighborhood**         | GPUFlagOffsets plus segment flags → GPUSegmentOffsets → lists, groups, or nested consumers.      |

**Cost**Separating shared value and per-depth element scans saves work only when layouts reuse them.

**Common mistake**Keep segmentStartFlags\[0] zero and consume only the prefix named by segmentCount.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use it with `GPUFlagOffsets` when multiple list or group depths share another layout stream. The main case is a nested column: leaf validity is scanned once, then each repeated ancestor supplies its own element flags, element offsets, and segment starts. The operation is format-neutral and is also suitable for run, group, and partition boundaries.

Use `GPUSegmentedLayout` for a single depth when its combined value/element/segment API is simpler. Use `GPUScan` alone if segment indices are sufficient and list offsets are not needed.

## Contract[​](#contract "Direct link to Contract")

| View                | Length                  | Meaning                                                       |
| ------------------- | ----------------------- | ------------------------------------------------------------- |
| `elementFlags`      | slot count              | One when a slot represents a logical element, including nulls |
| `elementOffsets`    | at least slot count     | Exclusive dense logical-element offsets                       |
| `segmentStartFlags` | slot count              | One for starts after the implicit first segment               |
| `segmentIndices`    | at least slot count     | Dense zero-based segment index per slot                       |
| `segmentOffsets`    | at least slot count + 1 | Logical-element offsets plus a terminal offset                |
| `segmentCount`      | at least 1              | Number of segments in element zero                            |

For non-empty input, `segmentStartFlags[0]` must be zero because segment zero is implicit. Only the first `segmentCount + 1` entries of `segmentOffsets` are defined. Empty input writes zero to both `segmentOffsets[0]` and `segmentCount[0]`.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUFlagOffsets, GPUSegmentOffsets} from '@luma.gl/gpgpu/gpu-core';



new GPUFlagOffsets({

  id: 'list-elements',

  flags: elementFlags,

  offsets: elementOffsets,

  count: elementCount

}).addToGraph(graph);



new GPUSegmentOffsets({

  id: 'list-rows',

  elementFlags,

  elementOffsets,

  segmentStartFlags: rowStartFlags,

  segmentIndices: rowIndices,

  segmentOffsets: listOffsets,

  segmentCount: rowCount

}).addToGraph(graph);
```

The operation contributes one inclusive scan and two small publication passes. Every shader stays below the WebGPU CORE eight-storage-binding limit. It does not validate GPU-resident flag contents, compile or submit the graph, or read back counts.

## Chunking and reuse[​](#chunking-and-reuse "Direct link to Chunking and reuse")

Invoke the operation once per durable source page or batch. Each chunk has its own implicit segment zero and local offsets; do not concatenate terminal offsets implicitly. A higher-level composer can retain those views in a `GraphVectorView`, allowing the command graph to compile once and rebind compatible imported page buffers on later executions.
