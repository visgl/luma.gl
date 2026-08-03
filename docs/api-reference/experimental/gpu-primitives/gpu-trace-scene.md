import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUTraceScene

<GPUPrimitivesDocsTabs active="trace-scene" />

## Overview

`GPUTraceScene` uploads a canonical execution trace once and projects its spans into the existing
generic [`GPUScene`](/docs/api-reference/experimental/gpu-primitives/gpu-scene) draw database.
Timing, lanes, processes, threads, parent relationships, dependency links, and bidirectional
adjacency remain GPU-resident beside the scene rather than becoming trace-specific fields inside
the shared scene abstraction.

The motivation is interactive trace exploration at a scale where rebuilding JavaScript span lists
for every pan, filter, expansion, or dependency selection becomes the bottleneck. One stable
source-row identity can feed time-range filtering, process/thread layout, ancestor projection,
graph traversal, picking, visibility compaction, indirect draw generation, and renderer-owned
resource groups without translating identities between those stages.

Useful consumers include distributed execution timelines, browser performance recordings, GPU
capture visualizers, task schedulers, service dependency traces, and scientific workflows whose
operations have both temporal ownership and explicit cross-process links.

## Concepts

### Canonical span identity is not display order

Each source span occupies eight 32-bit words:

| Word | Field | Interpretation |
| --- | --- | --- |
| 0 | `start` | `float32` trace timestamp |
| 1 | `duration` | Nonnegative `float32` duration |
| 2 | `lane` | `uint32` original display lane |
| 3 | `groupId` | Renderer-owned pipeline or resource identity |
| 4 | `processId` | Process membership |
| 5 | `threadId` | Thread membership |
| 6 | `objectId` | Unique stable application identity |
| 7 | `classification` | Application-defined status and filter bits |

The canonical row index addresses parents, adjacency, selection masks, and indirect
`firstInstance`. The independent stable object ID identifies the underlying application span.
Keeping both avoids confusing a compacted visible position with either the original source row or
the application's object identity.

### Generic scene projection keeps domain fields separate

Every span projects into one ordinary 128-byte `GPUScene` record:

- Stable scene identity comes from the source `objectId`.
- Temporal extent and lane become axis-aligned bounds: `[start, lane, 0]` through
  `[start + duration, lane + 1, 1]`.
- Source `groupId`, an optional renderer geometry ID, and the global row's command slot preserve
  ordinary scene rendering contracts.
- Parent references, process/thread membership, classification, and graph edges remain in the
  trace model's separate canonical buffers.

This means [`GPUSceneDrawGeneration`](/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation)
and [`GPUSceneResourceGroups`](/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups)
consume trace scenes without a trace-specific renderer or additional fields in `GPUScene`.

The projection is created explicitly during ingestion. Its memory cost is observable through
`stats.sceneByteLength`; a trace viewer should therefore choose a bounded scene capacity instead
of assuming that canonical 32-byte spans and projected 128-byte records cost the same.

### Source batches remain visible, including empty batches

`partitions` contains ordered `{firstSpan, spanCount, groupId?}` source ranges. Ranges must cover
the canonical rows contiguously, but zero-row partitions remain real entries. An optional group ID
asserts that every source span in the range belongs to that group.

This preserves global addressing when a streaming producer emits empty or uneven batches and
allows later culling or partition-aware traversal to retain the producer's topology. The model
does not concatenate, reorder, hide, or silently invent source partitions.

### Parents and links represent different relationships

`parents` contains one canonical parent-row index or `GPU_SCENE_INVALID_REFERENCE` per span. A
parent is useful for collapse, ancestor preservation, and projecting a hidden child onto a visible
ancestor.

Dependency links are independent four-word records: source row, destination row, family, and
application flags. Their outgoing and incoming CSR representations let graph traversal expand
dependencies in either direction while retaining cycles, disconnected components, and stable
source-edge order. Callers may provide precomputed CSR or let ingestion derive it once.
Precomputed adjacency is validated against the original dependency endpoints and stable edge
order so an inconsistent producer cannot silently change linked-span traversal.

Separating structural parenthood from arbitrary links is important: a network dependency can
cross process boundaries even when neither span is the other's hierarchy parent.

### Ownership and submission stay explicit

The trace model owns its canonical source buffers, CSR buffers, scene record buffer, and scene
state buffer. `importToGraph(graph)` borrows those allocations and exposes typed field views; it
does not compile, encode, submit, filter, or read back. `destroy()` releases every owned allocation
exactly once.

`stats` exposes span, dependency, process, thread, and partition counts plus separate canonical,
topology, scene, and total byte costs. Zero-span and zero-link inputs use minimal valid backing
allocations while keeping logical graph-view lengths at zero.

## Usage

```ts
const trace = new GPUTraceScene(device, {
  spans: canonicalSpanWords,
  parents: parentSpanRows,
  links: dependencyWords,
  partitions: [
    {firstSpan: 0, spanCount: 512, groupId: COMPUTE_GROUP},
    {firstSpan: 512, spanCount: 0, groupId: NETWORK_GROUP},
    {firstSpan: 512, spanCount: 256, groupId: STORAGE_GROUP}
  ],
  processCount: 8,
  threadCount: 32,
  geometryId: TIMELINE_RECTANGLE
});

const graph = new GPUCommandGraph(device);
const source = trace.importToGraph(graph);

new GPUSceneDrawGeneration({
  scene: source.scene,
  visibility: visibleSpanMask,
  commands: commandView,
  requiredCount,
  publishedCount,
  overflow
}).addToGraph(graph);
```

Source views such as `source.startTimes`, `source.processIds`, `source.parents`, and
`source.outgoingNeighbors` can feed independent filtering, layout, and graph traversal passes in
the same graph.

## Current scope

This tranche establishes canonical ingestion, stable trace-to-scene identity, preserved source
partitions, bidirectional topology, explicit ownership, and compatibility with the existing
indirect-rendering stack. Interactive process/thread expansion, linked-span selection, and a live
scene-backed trace consumer are separate follow-up tranches.
