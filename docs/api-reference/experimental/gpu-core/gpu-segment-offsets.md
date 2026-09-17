# GPUSegmentOffsets

<!-- -->

## Overview[​](#overview "Direct link to Overview")

`GPUSegmentOffsets` publishes dense segment indices and list-style boundaries from segment-start flags when logical-element offsets have already been materialized.

## At a glance

| Question                 | Answer                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Publish list-style boundaries when logical-element offsets are already available.                                               |
| **Reads / writes**       | Reads element flags/offsets and segment-start flags; writes segment indices, offsets, and count.                                |
| **Ownership**            | All public views are caller-owned; hierarchical segment-scan scratch is graph-owned.                                            |
| **Output contract**      | Source-aligned segment indices plus a segmentCount + 1 valid offset prefix.                                                     |
| **Expected work**        | One hierarchical exclusive scan, offset publication per aligned span, and one scalar count pass.                                |
| **Chunks**               | Slot views align by logical row across independent atomic/vector boundaries; the global list-offset destination remains atomic. |
| **Conditions / budgets** | Contributes ordinary graph nodes and never compiles, submits, maps, or reads back.                                              |
| **Neighborhood**         | GPUFlagOffsets plus segment flags → GPUSegmentOffsets → lists, groups, or nested consumers.                                     |

**Cost**Separating shared value and per-depth element scans saves work only when layouts reuse them.

**Common mistake**Mark every segment start, including the first; consume only segmentCount + 1 list offsets.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use it with `GPUFlagOffsets` when multiple list or group depths share another layout stream. The main case is a nested column: leaf validity is scanned once, then each repeated ancestor supplies its own element flags, element offsets, and segment starts. The operation is format-neutral and is also suitable for run, group, and partition boundaries.

Use `GPUSegmentedLayout` for a single depth when its combined value/element/segment API is simpler. Use `GPUScan` alone if segment indices are sufficient and list offsets are not needed.

## Contract[​](#contract "Direct link to Contract")

| View                | Length                  | Meaning                                                                  |
| ------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `elementFlags`      | slot count              | One when a slot represents a logical element, including nulls            |
| `elementOffsets`    | at least slot count     | Exclusive dense logical-element offsets                                  |
| `segmentStartFlags` | slot count              | One for every segment start, including the first                         |
| `segmentIndices`    | at least slot count     | Exclusive start-flag prefix; the destination index at each segment start |
| `segmentOffsets`    | at least slot count + 1 | Logical-element offsets plus a terminal offset                           |
| `segmentCount`      | at least 1              | Number of segments in element zero                                       |

Only the first `segmentCount + 1` entries of `segmentOffsets` are defined. A prefix before the first set start flag belongs to no segment, which lets a higher-level format gate absent nested parents without inventing an empty child. Empty input writes zero to both `segmentOffsets[0]` and `segmentCount[0]`.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUFlagOffsets, GPUSegmentOffsets} from '@luma.gl/gpgpu/gpu-core';



graph.add([

  new GPUFlagOffsets({

    id: 'list-elements',

    flags: elementFlags,

    offsets: elementOffsets,

    count: elementCount

  }),

  new GPUSegmentOffsets({

    id: 'list-rows',

    elementFlags,

    elementOffsets,

    segmentStartFlags: rowStartFlags,

    segmentIndices: rowIndices,

    segmentOffsets: listOffsets,

    segmentCount: rowCount

  })

]);
```

The operation contributes one exclusive scan, one publication pass per aligned span, and a final count pass. Every shader stays below the WebGPU CORE eight-storage-binding limit. It does not validate GPU-resident flag contents, compile or submit the graph, or read back counts.

## Chunking and reuse[​](#chunking-and-reuse "Direct link to Chunking and reuse")

Slot-aligned views may independently be atomic views or `GraphVectorView`s with different partitions. Every view must cover `elementFlags.length`; extra capacity is ignored and unwritten. Alignment borrows subviews from durable source pages without repacking their buffers. Segment indices and element offsets carry across chunks, and the operation publishes one global offset stream and count. This is important for repeated formats such as Parquet, where a logical row may begin on one page and continue on the next. The command graph can still compile once and rebind compatible imported page buffers on later executions.

`segmentOffsets` remains one atomic destination for the global offset list; chunked list-offset output is follow-up work.
