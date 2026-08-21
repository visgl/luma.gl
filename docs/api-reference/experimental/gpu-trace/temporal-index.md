import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';
import {GPUTraceViewerExample} from '@site/src/examples';

# GPUTraceTemporalIndex

<ExperimentalDocsTabs active="trace-temporal-index" />

## Overview

`GPUTraceTemporalIndex` converts immutable per-batch trace summaries into stable, source-ordered
candidate lists for the current viewport and semantic zoom level. It is exported from
`@luma.gl/experimental/gpu-trace` because time intervals, span duration, and trace renderer groups
are domain concepts; its scan and stable compaction stages reuse generic GPU scheduling primitives.

<GPUTraceViewerExample embedded />

The live viewer feeds the same candidate output to exact spans, density aggregation, labels,
dependencies, and picking. This prevents independent viewport tests from disagreeing or visibly
flickering as the view changes.

<GPUOperationContract operation="gpu-trace-temporal-index" />

## Usage

```ts
import {
  GPUTraceTemporalIndex,
  GPUTraceTemporalIndexBuilder
} from '@luma.gl/experimental/gpu-trace';

new GPUTraceTemporalIndexBuilder({
  id: 'timeline-index-builder',
  batches: packedBatchRecords,
  batchCount,
  batchLayout,
  hierarchy: packedHierarchyRecords,
  hierarchyLayout,
  levels,
  partitionBatchCount: 256,
  dirtyPartitions,
  validationErrors
}).addToGraph(graph);

new GPUTraceTemporalIndex({
  id: 'timeline-index',
  batches: {
    minimumTimes,
    maximumTimes,
    groupIds,
    minimumLanes,
    maximumLanes
  },
  hierarchy: {
    minimumTimes: nodeMinimumTimes,
    maximumTimes: nodeMaximumTimes,
    groupIds: nodeGroupIds,
    firstBatchIndices,
    batchCounts,
    minimumLanes: nodeMinimumLanes,
    maximumLanes: nodeMaximumLanes,
    levels
  },
  query: {
    timeWindow,
    laneWindow,
    enabledGroups,
    level
  },
  output: {
    candidates,
    candidateCount
  }
}).addToGraph(graph);
```

`timeWindow` is a packed three-element `float32` view containing minimum time, maximum time, and
guard padding. `laneWindow` contains the minimum and exclusive maximum visible lane.
`enabledGroups` is one 32-bit renderer-group mask. `level` selects one persistent hierarchy level
using a small GPU-resident control word. Hierarchy nodes own bounded, contiguous leaf ranges and
never cross renderer-group boundaries.

Matching time-and-lane hierarchy nodes expand into source-ordered leaf batches in `candidates`.
Without a hierarchy, every intersecting leaf is queried directly. Every interactive consumer reads
this one conservative publication and applies its row-level policy: exact shaders retain visible or
sufficiently wide spans, density omits those retained rows, representative search chooses one span
per lane/pixel cell, and labels, dependencies, and picking use the same canonical batch IDs. Coarse
false positives cost bounded shader work but cannot make an offscreen row visible.

## Execution contract

- Batch summaries and outputs may be interleaved graph views but must use aligned scalar words.
- Candidate order always follows source batch order, independent of workgroup scheduling.
- `GPUTraceTemporalIndexBuilder` rebuilds every hierarchy resolution for dirty source partitions,
  then clears their dirty words. Clean partitions retain their persistent summaries.
- Hierarchy levels are persistent summaries; viewport changes select a level without rebuilding
  graph topology or index storage.
- Validation bit `1` reports an invalid leaf range, bit `2` a range crossing its declared source
  partition, and bit `4` a hierarchy node crossing a renderer-group boundary.
- Coarse nodes may conservatively include offscreen leaves, but they cannot omit an intersecting
  leaf represented by their interval and group bounds.
- The query buffer may change between encodings without recompiling graph topology.
- The contributor performs no submission or readback and keeps candidate counts GPU-resident.
- Wide-span exceptions are selected from the shared conservative batches by the exact row shader.
