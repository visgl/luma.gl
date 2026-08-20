---
title: GPU-animated glTF crowds
description: GPU skinning, independent playback, batching, levels of detail, and public APIs for large animated glTF crowds.
---

import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {GltfCrowdDocsTabs} from '@site/src/components/docs/gltf-crowd-docs-tabs';

# GPU-animated glTF crowds

<GltfDocsTabs active="animated-crowd" />
<GltfCrowdDocsTabs active="overview" />

`GLTFAnimatedCrowd` renders independently animated characters using one shared GPU model and one
instanced draw per compatible source primitive. Actors retain independent animation clocks,
hierarchies, morph weights, joint palettes, and placement transforms without duplicating geometry,
materials, or draw calls for every character. The default path evaluates clips on the CPU and
uploads compact pose data. An optional baked path samples skeletal clips and morph weights in the
vertex shader on both WebGPU and WebGL 2.

## Explore the Animation Studio

The glTF Asset Studio exposes this path through its **GPU Crowd Actors** control, supporting
1–100 actors and reporting the actual number of shared GPU draws.
Its default CC0 Robot Expressive model provides 14 named actions, including walking, running,
dancing, waving, and idling. Neighboring actors can play different actions without splitting a
shared primitive into separate draw calls.

1. Open the glTF example and keep the default **Robot Expressive** asset selected.
2. Increase **GPU Crowd Actors** from 1 to any value through 100.
3. Inspect the live crowd summary: it reports the actor count, actual shared draw count, and
   active action names.
4. Confirm that neighboring actors use different clips, phases, and playback speeds while the
   Robot Expressive draw count remains approximately 19.
5. Toggle **glTF Animation** to pause or resume playback, or toggle **Camera Animation** to stop
   the automatic orbit without changing actor state.
6. Enable **Auto LOD** to assign each actor a mesh detail level from its projected screen size.
7. Adjust **Detail Bias** and optionally set **Vertex Budget** to cap submitted indexed work;
   leave the budget at zero for ordinary screen-size selection without a global limit.
8. Inspect the authored/generated source, per-level actor counts, culled actors, submitted
   vertices and triangles, budget-driven demotions, and actual shared draws.
9. Choose **Simple Skin LOD** to inspect three authored skeletal detail levels, or keep
   **Robot Expressive** to inspect automatically generated index-only levels.

The model menu deliberately excludes static assets. Robot Expressive is an externally hosted CC0
model with 14 authored actions:

```text
Dance, Death, Idle, Jump, No, Punch, Running,
Sitting, Standing, ThumbsUp, Walking, WalkJump, Wave, Yes
```

The Studio's 100-actor limit is an intentional interactive-demo setting, not a hard limit of
`GLTFAnimatedCrowd`. Applications choose their own fixed `capacity`, subject to GPU limits and
CPU animation cost.

## Choose a topic

| Topic | Use it for |
| --- | --- |
| [Usage and architecture](/docs/api-reference/gltf/gltf-crowd-usage) | Creating, batching, rendering, and independently animating actors. |
| [Performance and LOD](/docs/api-reference/gltf/gltf-crowd-performance) | Palette costs, screen-space LOD, vertex budgets, and decimation. |
| [API and ownership](/docs/api-reference/gltf/gltf-crowd-api) | Exact contracts, cleanup, diagnostics, and current boundaries. |

## Related pages

- [glTF animation](/docs/api-reference/gltf/gltf-animation)
- [glTF materials](/docs/api-reference/gltf/gltf-materials)
- [Animation Studio](/examples/showcase/gltf)
