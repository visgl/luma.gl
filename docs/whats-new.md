# What's New

## Version 10.0

- **GPU graphs.** [Graph](./api-reference/graph/README.md) composes compute and render
  operations, manages transient resources, and processes GPU vectors and tables.
- **Shaders.** [Shaders](./api-reference/shaders/README.md) provides language-specific
  assemblers and reusable WGSL and GLSL shader modules.
- **Rendering.** [Engine](./api-reference/engine/README.md) brings together models,
  glTF, scenegraphs, effects, text, and physics integration. [ANARI](./api-reference/anari/README.md)
  adds forward, deferred, ray-traced, and ray-marched rendering.
- **GPU resources.** [Core](./api-reference/core/README.md) owns devices, buffers,
  textures, and pipelines for both WebGL2 and WebGPU.

- Fused GPU physics ensembles can share packed terrain atlas pages across instances and
  recover from local contact-cache exhaustion while healthy instances keep stepping.
  [GPU Physics](./api-reference/graph/gpu-physics.md)

- GPU physics can batch rays and sphere sweeps with ordered nearest-hit results in one
  GPU dispatch and compact readback. [Batched collision casts](./api-reference/graph/gpu-physics.md#batched-collision-casts)
- Opt-in GPU BVH refits for batched ray and sphere casts against sphere and box
  colliders, with indexed and direct scan comparisons in Physics Batch Lab.
- GPU weighted shortest paths stop on the GPU once converged, continue past 1,024 rounds with
  `run()`, and read their sources from caller-owned `seeds`, so a new source compiles nothing.
  [Weighted routes](./api-reference/experimental/gpu-graph-traversal.md#find-least-cost-routes-with-gpugraphalgorithmssinglesourceshortestpath)
- [Model](./api-reference/engine/model.md) keeps one render pipeline per attachment-format
  variant and now releases the pipeline and shader references it replaces, so with
  `_destroyPipelines: true` replaced and evicted pipelines and their shaders are destroyed.

See the [Upgrade Guide](./upgrade-guide.md#upgrading-to-v100) to move from v9.

## Version 9.4

Expanded GPU computation, text rendering, and scene and shader tools.

## Version 9.3

Expanded WebGPU coverage and standardized shader types and layouts.

## Version 9.2

Improved WebGPU rendering, shader assembly, and engine integration.

## Version 9.1

Expanded device and resource APIs and added more WebGPU support.

## Version 9.0

Introduced a device API spanning WebGL2 and WebGPU. See the
[Porting Guide](./legacy/porting-guide.md) for the architecture changes.

## Versions 8 and earlier

Older release notes are available in the [v9.4.2 archive](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md).

[v8.5](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-85) · [v8.4](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-84) · [v8.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-83) · [v8.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-81) · [v8.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-80) · [v7.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-73) · [v7.2](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-72) · [v7.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-71) · [v7.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-70) · [v6.4](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-64) · [v6.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-63) · [v6.2](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-62) · [v6.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-61) · [v6.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-60) · [v5.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-53) · [v5.2](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-52) · [v5.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-51) · [v5.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-50) · [v4.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-40) · [v3.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-30) · [v2.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-20) · [v1.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-10)

See the [changelog](https://github.com/visgl/luma.gl/blob/master/CHANGELOG.md) for release-by-release details.
