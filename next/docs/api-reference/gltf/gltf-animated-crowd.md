# GPU-animated glTF crowds

[Overview](https://luma.gl/next/docs/api-reference/gltf.md)[Materials](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md)[Native Extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-native-extensions.md)[Animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md)[Animated Crowd](https://luma.gl/next/docs/api-reference/gltf/gltf-animated-crowd.md)[Interchange](https://luma.gl/next/docs/api-reference/gltf/gltf-interchange.md)[Extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md)

[Overview](https://luma.gl/next/docs/api-reference/gltf/gltf-animated-crowd.md)[Usage](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-usage.md)[Performance & LOD](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-performance.md)[API](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-api.md)

`GLTFAnimatedCrowd` renders independently animated characters using one shared GPU model and one instanced draw per compatible source primitive. Actors retain independent animation clocks, hierarchies, morph weights, joint palettes, and placement transforms without duplicating geometry, materials, or draw calls for every character. The default path evaluates clips on the CPU and uploads compact pose data. An optional baked path samples skeletal clips and morph weights in the vertex shader on both WebGPU and WebGL 2.

## Explore the Animation Studio[​](#explore-the-animation-studio "Direct link to Explore the Animation Studio")

The glTF Asset Studio exposes this path through its **GPU Crowd Actors** control, supporting 1–100 actors and reporting the actual number of shared GPU draws. Its default CC0 Robot Expressive model provides 14 named actions, including walking, running, dancing, waving, and idling. Neighboring actors can play different actions without splitting a shared primitive into separate draw calls.

1. Open the glTF example and keep the default **Robot Expressive** asset selected.
2. Increase **GPU Crowd Actors** from 1 to any value through 100.
3. Inspect the live crowd summary: it reports the actor count, actual shared draw count, and active action names.
4. Confirm that neighboring actors use different clips, phases, and playback speeds while the Robot Expressive draw count remains approximately 19.
5. Toggle **glTF Animation** to pause or resume playback, or toggle **Camera Animation** to stop the automatic orbit without changing actor state.
6. Enable **Auto LOD** to assign each actor a mesh detail level from its projected screen size.
7. Adjust **Detail Bias** and optionally set **Vertex Budget** to cap submitted indexed work; leave the budget at zero for ordinary screen-size selection without a global limit.
8. Inspect the authored/generated source, per-level actor counts, culled actors, submitted vertices and triangles, budget-driven demotions, and actual shared draws.
9. Choose **Simple Skin LOD** to inspect three authored skeletal detail levels, or keep **Robot Expressive** to inspect automatically generated index-only levels.

The model menu deliberately excludes static assets. Robot Expressive is an externally hosted CC0 model with 14 authored actions:

```
Dance, Death, Idle, Jump, No, Punch, Running,

Sitting, Standing, ThumbsUp, Walking, WalkJump, Wave, Yes
```

The Studio's 100-actor limit is an intentional interactive-demo setting, not a hard limit of `GLTFAnimatedCrowd`. Applications choose their own fixed `capacity`, subject to GPU limits and CPU animation cost.

## Choose a topic[​](#choose-a-topic "Direct link to Choose a topic")

| Topic                                                                                              | Use it for                                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [Usage and architecture](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-usage.md)    | Creating, batching, rendering, and independently animating actors. |
| [Performance and LOD](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-performance.md) | Palette costs, screen-space LOD, vertex budgets, and decimation.   |
| [API and ownership](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-api.md)           | Exact contracts, cleanup, diagnostics, and current boundaries.     |

## Related pages[​](#related-pages "Direct link to Related pages")

* [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md)
* [glTF materials](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md)
* [Animation Studio](https://luma.gl/next/examples/showcase/gltf)
