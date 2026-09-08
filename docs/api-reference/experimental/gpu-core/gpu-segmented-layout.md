import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUSegmentedLayout

<GPUCoreDocsTabs active="segmented-layout" />

## Overview

`GPUSegmentedLayout` converts three packed binary flag streams into the offsets and counts needed
to consume a nullable, segmented sequence without CPU readback.

<GPUOperationContract operation="gpu-segmented-layout" />

## When to use it

Use this operation after a parser, classifier, or application shader can answer three questions for
every source slot:

- Does this slot own one physical value?
- Does this slot represent one logical element, including a null element?
- Does this slot start a new segment after the implicit first segment?

The result supports nullable-value compaction, list or group offsets, segmented follow-up work, and
rendering that addresses an unpacked payload through dense indices. Apache Parquet definition and
repetition levels are one source of these flags, but the operation has no Parquet-specific rules.
Another columnar format can classify its own control data and reuse the same materialization stage.

Use `GPUScan` directly when only one prefix is needed. Use `GPUCompaction` when only a dense value or
ID list is needed. `GPUSegmentedLayout` is useful when a downstream consumer needs value offsets,
logical-element offsets, and group boundaries together.

## Flag and output contract

All flag values must be exactly `0` or `1`. A non-empty input has one implicit first segment, so
`segmentStartFlags[0]` must be zero. Every later one starts a new segment. Empty input produces zero
counts and writes `segmentOffsets[0] = 0`.

| View | Length | Meaning |
| --- | ---: | --- |
| `valueFlags` | slot count | One when the slot owns a physical value |
| `elementFlags` | slot count | One when the slot represents a logical element |
| `segmentStartFlags` | slot count | One when the slot starts a segment after the first |
| `valueOffsets` | slot count | Exclusive dense physical-value index for each slot |
| `elementOffsets` | slot count | Exclusive dense logical-element index for each slot |
| `segmentIndices` | slot count | Inclusive scan of segment starts; the dense segment index |
| `segmentOffsets` | at least slot count + 1 | Logical-element offset for every segment plus a terminal offset |
| `valueCount` | at least 1 | Total physical values in element zero |
| `elementCount` | at least 1 | Total logical elements in element zero |
| `segmentCount` | at least 1 | Total segments in element zero |

Only the first `segmentCount + 1` entries of `segmentOffsets` are defined. The extra capacity lets
the graph remain statically allocated even though the number of segments is data-dependent.

For example, these flags describe three segments, five logical elements, and four physical values:

```text
valueFlags        [1, 0, 1, 1, 0, 1]
elementFlags      [1, 1, 1, 0, 1, 1]
segmentStartFlags [0, 0, 1, 0, 1, 0]

valueOffsets      [0, 1, 1, 2, 3, 3]
elementOffsets    [0, 1, 2, 3, 3, 4]
segmentIndices    [0, 0, 1, 1, 2, 2]
segmentOffsets    [0, 2, 3, 5]
```

## Usage

```ts
import {GPUCommandGraph, GPUSegmentedLayout} from '@luma.gl/gpgpu/gpu-core';

const graph = new GPUCommandGraph(device, {id: 'column-layout'});

new GPUSegmentedLayout({
  id: 'nullable-lists',
  valueFlags,
  elementFlags,
  segmentStartFlags,
  valueOffsets,
  elementOffsets,
  segmentIndices,
  segmentOffsets,
  valueCount,
  elementCount,
  segmentCount
}).addToGraph(graph);
```

The operation contributes three `GPUScan` pipelines and one final publication pass. It does not
compile the graph, submit commands, map counts, or move physical payload values.

## Composition patterns

### Pack present values

Feed `valueFlags` to `GPUCompaction` when the source is one packed `uint32` value per slot. For
wider records, use `valueOffsets` as stable scatter destinations in a format-specific kernel. The
published `valueCount` names the valid output prefix.

### Retain the original payload

If a later shader can address values in place, keep the payload unchanged and use `valueOffsets` to
map logical slots to dense physical positions. This avoids a scatter and preserves zero-copy page
buffers.

### Build nested columns

Use `segmentOffsets` as one list-offset level. A format adapter can run another classification and
layout operation for an ancestor depth, retaining one offset buffer per nesting level. Keep those
buffers GPU-resident when the renderer or computation understands the nested representation.

## Costs and limits

The operation performs three complete prefix scans plus one complete publication pass. It is most
appropriate when several downstream stages reuse the resulting layout or when avoiding a CPU
decode/readback/re-upload boundary matters more than a single lightweight CPU pass.

The initial API accepts packed `GraphDataView<'uint32'>` inputs and outputs. Invoke it once per
durable source chunk rather than concatenating streaming batches implicitly. Slot counts and offsets
must fit in `uint32`; split larger datasets at existing page or batch boundaries.

`GPUSegmentedLayout` validates view formats, lengths, and graph ownership. It cannot cheaply inspect
GPU-resident flag contents during graph construction, so the classifier is responsible for binary
flags and the zero first-segment-start convention.
