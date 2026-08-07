# GPU Trace Exploration

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[SceneRenderer](https://luma.gl/next/docs/api-reference/experimental/scene-renderer.md)[Deferred Scenes](https://luma.gl/next/docs/api-reference/experimental/deferred-scene-renderer.md)[PBR Environments](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[GPU Rasters](https://luma.gl/next/docs/api-reference/experimental/luraster.md)[GPU Graphs](https://luma.gl/next/docs/api-reference/experimental/lugraph.md)[luDF](https://luma.gl/next/docs/api-reference/experimental/ludf.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GPU Traces](https://luma.gl/next/docs/api-reference/experimental/lutrace.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/experimental/lutrace` is an optional GPU-native execution-trace module. It owns canonical span schemas, process/thread relationships, hierarchy parents, dependency links, filtering policies, linked-span focus, and trace-specific timeline picking without adding those concepts to the generic command graph or flat GPU scene API.

Use `lutrace` when an application needs to navigate a distributed system trace, inspect a browser performance recording, understand a GPU capture, explore a build-system schedule, or analyze a scientific workflow with both hierarchical ownership and explicit cross-task dependencies. Source data remains GPU-resident while time windows, expansion state, selected spans, and visibility change interactively.

The scene-backed explorer below combines canonical trace ingestion, process/thread collapse, linked-span selection, stable indirect drawing, and trace-aware GPU picking. Expand or collapse a process, change the classification filters, and click a span to see the same compiled GPU graph respond to small control-buffer updates.

### GPU Scene Trace Explorer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-scene)Info

InfoSource

```
// Loading source…
```

## Concepts[​](#concepts "Direct link to Concepts")

### A trace is an application domain, not a command-graph feature[​](#a-trace-is-an-application-domain-not-a-command-graph-feature "Direct link to A trace is an application domain, not a command-graph feature")

The generic [`GPUCommandGraph`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md) knows about buffers, textures, compute passes, render passes, hazards, and encoding. It does not need processes, threads, spans, or dependency edges to schedule a particle simulation, culling renderer, image filter, or GPU analytics pipeline.

`lutrace` depends on those reusable scheduling and rendering primitives, but the generic primitives do not depend on `lutrace`. Applications that never display execution timelines therefore do not import trace-domain schemas or interaction policies.

```
import {GPUCommandGraph} from '@luma.gl/experimental';

import {

  GPUTraceInteraction,

  GPUTraceScene,

  getGPUTracePickingShader

} from '@luma.gl/experimental/lutrace';
```

### Canonical spans and dependency links have stable identities[​](#canonical-spans-and-dependency-links-have-stable-identities "Direct link to Canonical spans and dependency links have stable identities")

[`GPUTraceScene`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md) accepts packed eight-word span records and four-word dependency links. Span records describe time, duration, lane, render group, process, thread, stable object identity, and classification bits. Separate parent references represent structural nesting, while incoming and outgoing adjacency represent arbitrary cross-process dependencies.

The module exports `GPU_TRACE_SPAN_RECORD_WORD_LENGTH` and `GPU_TRACE_LINK_RECORD_WORD_LENGTH` so producers, demonstration datasets, and consumers agree on one canonical memory layout. Empty and uneven source partitions remain visible; a compacted display position never replaces the stable canonical row or application object ID.

Each trace span also projects into a normal [`GPUScene`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md) record. Generic visibility, renderer-owned resource groups, and indirect draw commands can therefore render a trace without adding trace-specific fields to the scene database.

For example, a distributed request can retain canonical row `417`, application object ID `9021`, and compacted visible position `12` simultaneously. Dependencies and picking resolve row `417`; application inspection resolves object `9021`; a compacted label pass consumes position `12`. Treating these identities as interchangeable would attach selections or dependency endpoints to the wrong operation whenever filtering changes.

### Interactive policies change control state, not graph topology[​](#interactive-policies-change-control-state-not-graph-topology "Direct link to Interactive policies change control state, not graph topology")

[`GPUTraceInteraction`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md) combines reusable graph operations into a fixed trace workflow:

1. Process and thread expansion determine visible timeline lanes.
2. A scanned hierarchy layout updates effective row offsets.
3. Time, minimum-duration, and classification policies reject irrelevant spans.
4. Selected spans expand over bounded incoming, outgoing, or bidirectional dependency links.
5. Hidden children project onto their nearest visible ancestors.
6. Stable compaction and scene draw generation publish GPU-resident indirect commands.

Panning, collapsing a thread, focusing on a critical path, or changing an error filter updates small caller-owned GPU control buffers. The application re-encodes its existing compiled graph; it does not rebuild a JavaScript span list, perform CPU draw selection, or hand submission ownership to `lutrace`.

The hierarchy-first trace viewer below demonstrates the same underlying generic layout, dependency traversal, filtering, and stable row identity from a different application composition. Collapse a process or isolate linked spans to compare its direct primitive orchestration with the scene-backed workflow above.

### GPU Hierarchical Trace Viewer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-viewer)Info

InfoSource

```
// Loading source…
```

### Trace picking is separate from generic picking infrastructure[​](#trace-picking-is-separate-from-generic-picking-infrastructure "Direct link to Trace picking is separate from generic picking infrastructure")

[`getGPUTracePickingShader`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md) produces a compute shader for a timeline coordinate. It considers only spans marked visible by the current interaction policy, reconstructs effective display lanes from GPU-scanned thread offsets, and atomically publishes the lowest matching canonical source-row identity.

```
const pickingSource = getGPUTracePickingShader(trace.stats.spanCount, lanesPerThread);
```

Applications still own the pick request, result buffer, command graph, readback, and highlighting. General-purpose picking targets remain available separately; this helper adds only the trace-specific time/lane interpretation.

### Choose the right level of composition[​](#choose-the-right-level-of-composition "Direct link to Choose the right level of composition")

| Requirement                                                        | Recommended API            | Reason                                                                  |
| ------------------------------------------------------------------ | -------------------------- | ----------------------------------------------------------------------- |
| Schedule arbitrary compute and render passes                       | `GPUCommandGraph`          | No trace assumptions or domain-specific schemas                         |
| Upload canonical spans, ownership, hierarchy, and dependencies     | `GPUTraceScene`            | Preserves source identity and projects into a generic `GPUScene`        |
| Apply reusable timeline controls without rebuilding graph topology | `GPUTraceInteraction`      | Composes hierarchy, focus, visibility, ancestors, and indirect drawing  |
| Resolve a timeline coordinate to its visible canonical span        | `getGPUTracePickingShader` | Understands trace timing, scanned lanes, and interaction visibility     |
| Control queue submission, asynchronous readback, or UI state       | Application-owned code     | Keeps scheduling, resource lifetime, and presentation policies explicit |

The first embedded explorer uses all four GPU layers together. The hierarchy-first explorer shows that applications can also compose the generic primitives directly when they need a different rendering model or interaction policy.

## Public API[​](#public-api "Direct link to Public API")

| Export                                                                                                                      | Responsibility                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GPUTraceScene`                                                                                                             | Canonical GPU-resident spans, process/thread ownership, parents, links, partitions, and generic scene projection             |
| `GPUTraceInteraction`                                                                                                       | Reusable GPU hierarchy, time filtering, classification, dependency focus, ancestor retention, visibility, and indirect draws |
| `GPU_TRACE_SPAN_RECORD_WORD_LENGTH`                                                                                         | Number of 32-bit words in one canonical trace span                                                                           |
| `GPU_TRACE_LINK_RECORD_WORD_LENGTH`                                                                                         | Number of 32-bit words in one dependency record                                                                              |
| [`getGPUTracePickingShader`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md) | Capacity-bounded, visible-span-aware timeline picking shader                                                                 |

Trace-specific classes, constants, helpers, and types are exported only from `@luma.gl/experimental/lutrace`; they are intentionally absent from the root `@luma.gl/experimental` namespace.
