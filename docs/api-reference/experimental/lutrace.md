import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUTraceSceneExample} from '@site/src/examples';

# GPU Trace Exploration

<ExperimentalDocsTabs active="lutrace" />

## Overview

`@luma.gl/experimental/lutrace` is an optional GPU-native execution-trace module. It owns canonical
span schemas, process/thread relationships, hierarchy parents, dependency links, filtering
policies, linked-span focus, and trace-specific timeline picking without adding those concepts to
the generic command graph or flat GPU scene API.

Use `lutrace` when an application needs to navigate a distributed system trace, inspect a browser
performance recording, understand a GPU capture, explore a build-system schedule, or analyze a
scientific workflow with both hierarchical ownership and explicit cross-task dependencies. Source
data remains GPU-resident while time windows, expansion state, selected spans, and visibility
change interactively.

<GPUTraceSceneExample embedded />

## Concepts

### A trace is an application domain, not a command-graph feature

The generic [`GPUCommandGraph`](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph)
knows about buffers, textures, compute passes, render passes, hazards, and encoding. It does not
need processes, threads, spans, or dependency edges to schedule a particle simulation, culling
renderer, image filter, or GPU analytics pipeline.

`lutrace` depends on those reusable scheduling and rendering primitives, but the generic primitives
do not depend on `lutrace`. Applications that never display execution timelines therefore do not
import trace-domain schemas or interaction policies.

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUTraceInteraction,
  GPUTraceScene,
  getGPUTracePickingShader
} from '@luma.gl/experimental/lutrace';
```

### Canonical spans and dependency links have stable identities

[`GPUTraceScene`](/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene) accepts packed
eight-word span records and four-word dependency links. Span records describe time, duration, lane,
render group, process, thread, stable object identity, and classification bits. Separate parent
references represent structural nesting, while incoming and outgoing adjacency represent arbitrary
cross-process dependencies.

The module exports `GPU_TRACE_SPAN_RECORD_WORD_LENGTH` and `GPU_TRACE_LINK_RECORD_WORD_LENGTH` so
producers, demonstration datasets, and consumers agree on one canonical memory layout. Empty and
uneven source partitions remain visible; a compacted display position never replaces the stable
canonical row or application object ID.

Each trace span also projects into a normal
[`GPUScene`](/docs/api-reference/experimental/gpu-primitives/gpu-scene) record. Generic visibility,
renderer-owned resource groups, and indirect draw commands can therefore render a trace without
adding trace-specific fields to the scene database.

### Interactive policies change control state, not graph topology

[`GPUTraceInteraction`](/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction)
combines reusable graph operations into a fixed trace workflow:

1. Process and thread expansion determine visible timeline lanes.
2. A scanned hierarchy layout updates effective row offsets.
3. Time, minimum-duration, and classification policies reject irrelevant spans.
4. Selected spans expand over bounded incoming, outgoing, or bidirectional dependency links.
5. Hidden children project onto their nearest visible ancestors.
6. Stable compaction and scene draw generation publish GPU-resident indirect commands.

Panning, collapsing a thread, focusing on a critical path, or changing an error filter updates
small caller-owned GPU control buffers. The application re-encodes its existing compiled graph;
it does not rebuild a JavaScript span list, perform CPU draw selection, or hand submission
ownership to `lutrace`.

### Trace picking is separate from generic picking infrastructure

`getGPUTracePickingShader(spanCount, lanesPerThread)` produces a compute shader for a timeline
coordinate. It considers only spans marked visible by the current interaction policy, reconstructs
effective display lanes from GPU-scanned thread offsets, and atomically publishes the lowest
matching canonical source-row identity.

```ts
const pickingSource = getGPUTracePickingShader(trace.stats.spanCount, lanesPerThread);
```

Applications still own the pick request, result buffer, command graph, readback, and highlighting.
General-purpose picking targets remain available separately; this helper adds only the
trace-specific time/lane interpretation.

## Public API

| Export | Responsibility |
| --- | --- |
| `GPUTraceScene` | Canonical GPU-resident spans, process/thread ownership, parents, links, partitions, and generic scene projection |
| `GPUTraceInteraction` | Reusable GPU hierarchy, time filtering, classification, dependency focus, ancestor retention, visibility, and indirect draws |
| `GPU_TRACE_SPAN_RECORD_WORD_LENGTH` | Number of 32-bit words in one canonical trace span |
| `GPU_TRACE_LINK_RECORD_WORD_LENGTH` | Number of 32-bit words in one dependency record |
| `getGPUTracePickingShader` | Capacity-bounded, visible-span-aware timeline picking shader |

Trace-specific classes, constants, helpers, and types are exported only from
`@luma.gl/experimental/lutrace`; they are intentionally absent from the root
`@luma.gl/experimental` namespace.
