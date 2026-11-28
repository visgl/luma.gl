# What's New

## Version 10.0[​](#version-100 "Direct link to Version 10.0")

* **Persistent and spherical advection.** [RK45 survivor queues](https://luma.gl/next/docs/api-reference/experimental/scientific-flow-tracer.md#persistent-survivor-queues) avoid repeated full-slot scans. [Adaptive spherical tracing](https://luma.gl/next/docs/api-reference/experimental/spherical-flow-tracer.md) adds physical error control, continuation and graph inspection across poles and the seam.

* **Active advection scheduling.** [RK45 tracing](https://luma.gl/next/docs/api-reference/experimental/scientific-flow-tracer.md#gpu-active-scheduling) adds opt-in GPU compaction and indirect dispatch, scheduling counters, and sparse/dense cost qualification. Vector Observatory exposes scheduling and batch controls.

* **Staggered advection and batching.** [Cartesian C-grid fields](https://luma.gl/next/docs/api-reference/experimental/staggered-flow-fields.md) retain face velocities and masks. RK45 supports bounded dispatch batches with one counter synchronization per batch.

* **Spherical transport.** [Unit-sphere RK2/RK4](https://luma.gl/next/docs/api-reference/experimental/spherical-flow-graph.md) crosses poles with stable particle identities. Vector Observatory adds geodesic spherical trails, stronger weather streaks and adjustable trail persistence. Direct GPU sampling tests qualify near-pole precision independently of integration.

* **Scientific trajectories.** [RK45 tracing](https://luma.gl/next/docs/api-reference/experimental/scientific-flow-tracer.md) adds crossed-cell mask checks, bounded GPU trajectory history with explicit readback, and offline GFS trajectory qualification. Vector Observatory adds archived-wind playback, trajectory CSV export and controlled accuracy/cost sweeps.

* **Font atlas cache capacity.** Use `ensureFontAtlasCacheCapacity()` from `@luma.gl/engine/text-fonts` to grow the shared bitmap and SDF atlas cache while retaining cached atlases.

* **Independent graph state.** Reuse a compiled graph with separate [mutable state instances](https://luma.gl/next/docs/api-reference/graph/gpu-graph-state.md) that borrow or copy GPU vectors and can be reset explicitly.

* **GPU graphs.** [Graph](https://luma.gl/next/docs/api-reference/graph.md) composes compute and render operations, manages transient resources, and processes GPU vectors and tables.

* **Fixed-width Arrow column streams.** [Arrow column streams](https://luma.gl/next/docs/api-reference/arrow/arrow-conversion.md#fixed-width-column-streams) preserve transforms, residual-low values, and validity vectors with abortable reads.

* **Shaders.** [Shaders](https://luma.gl/next/docs/api-reference/shaders.md) provides language-specific assemblers and reusable WGSL and GLSL shader modules.

* **Rendering.** [Engine](https://luma.gl/next/docs/api-reference/engine.md) brings together models, glTF, scenegraphs, effects, text, and physics integration. [ANARI](https://luma.gl/next/docs/api-reference/anari.md) adds forward, deferred, ray-traced, and ray-marched rendering.

* **GPU resources.** [Core](https://luma.gl/next/docs/api-reference/core.md) owns devices, buffers, textures, and pipelines for both WebGL2 and WebGPU.

* Fused GPU physics ensembles can share packed terrain atlas pages across instances and recover from local contact-cache exhaustion while healthy instances keep stepping. [GPU Physics](https://luma.gl/next/docs/api-reference/graph/gpu-physics.md)

* GPU physics can batch rays and sphere sweeps with ordered nearest-hit results in one GPU dispatch and compact readback. [Batched collision casts](https://luma.gl/next/docs/api-reference/graph/gpu-physics.md#batched-collision-casts)

* Opt-in GPU BVH refits for batched ray and sphere casts against sphere and box colliders, with indexed and direct scan comparisons in Physics Batch Lab.

* GPU weighted shortest paths stop on the GPU once converged, continue past 1,024 rounds with `run()`, and read their sources from caller-owned `seeds`, so a new source compiles nothing. [Weighted routes](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-traversal.md#find-least-cost-routes-with-gpugraphalgorithmssinglesourceshortestpath)

* WebGPU Cartesian point rendering and CPU picking share a prepared CRS transform. The GPU subtracts the destination origin before narrowing to float32 and draws directly from borrowed coordinate buffers. [GPU Project](https://luma.gl/next/docs/api-reference/experimental/gpu-project.md#inline-cartesian-rendering-and-cpu-picking)

* **Deterministic grouped sums** - [`GPUGroupAggregation`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md) `sum` and `mean`, and the GPU dataframe and crossfilter group-bys built on it, now reduce per-workgroup partials in a fixed order instead of contending on float compare-exchange atomics. Results are bitwise-identical from run to run, and few-group sums no longer slow down as rows per group grow.

* Arrow analytics uploads can pack small streamed record batches into one buffer per column with `packBatches`. [GPU DataFrame operations](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe-operations.md#upload-arrow-data-or-borrow-an-existing-table)

See the [Upgrade Guide](https://luma.gl/next/docs/upgrade-guide.md#upgrading-to-v100) to move from v9.

## Version 9.4[​](#version-94 "Direct link to Version 9.4")

Expanded GPU computation, text rendering, and scene and shader tools.

## Version 9.3[​](#version-93 "Direct link to Version 9.3")

Expanded WebGPU coverage and standardized shader types and layouts.

## Version 9.2[​](#version-92 "Direct link to Version 9.2")

Improved WebGPU rendering, shader assembly, and engine integration.

## Version 9.1[​](#version-91 "Direct link to Version 9.1")

Expanded device and resource APIs and added more WebGPU support.

## Version 9.0[​](#version-90 "Direct link to Version 9.0")

Introduced a device API spanning WebGL2 and WebGPU. See the [Porting Guide](https://luma.gl/next/docs/legacy/porting-guide) for the architecture changes.

## Versions 8 and earlier[​](#versions-8-and-earlier "Direct link to Versions 8 and earlier")

Older release notes are available in the [v9.4.2 archive](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md).

[v8.5](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-85) · [v8.4](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-84) · [v8.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-83) · [v8.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-81) · [v8.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-80) · [v7.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-73) · [v7.2](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-72) · [v7.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-71) · [v7.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-70) · [v6.4](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-64) · [v6.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-63) · [v6.2](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-62) · [v6.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-61) · [v6.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-60) · [v5.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-53) · [v5.2](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-52) · [v5.1](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-51) · [v5.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-50) · [v4.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-40) · [v3.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-30) · [v2.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-20) · [v1.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-whats-new.md#version-10)

See the [changelog](https://github.com/visgl/luma.gl/blob/master/CHANGELOG.md) for release-by-release details.
