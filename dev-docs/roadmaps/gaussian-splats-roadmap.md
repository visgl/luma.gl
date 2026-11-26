# Gaussian splat implementation roadmap

This maintainer roadmap tracks completed and planned Gaussian-splat work. The user-facing
[`@luma.gl/engine/splats` documentation](../../docs/api-reference/splats/README.md) describes current
behavior and supported contracts.

The [SPZ and procedural material integration plan](spz-materialx-integration-roadmap.md) details
qualification of loaders.gl beta.4 decoding, the decoded-data bridge, and opt-in glTF scene integration.

The completed tranches establish portable rendering, interaction, bounded out-of-core scenes, and
a live 50,937,127-source-row Coit Tower viewer. Planned tranches describe remaining work; the
current viewer does not retain all source rows simultaneously or claim measured Spark parity.

## Current implementation status

| Track | Current status | Remaining work |
| --- | --- | --- |
| GPU graph feature parity | Implemented for the portable renderer and contiguous WebGPU command graph: directional harmonics, semantic filtering, stable GPU picking, and mixed mesh composition. The paged renderer also supports host-pass composition through `prepare()` and `draw()`. | Extend picking and dedicated mixed-mesh helpers to the segmented out-of-core renderer. |
| Out-of-core RAD rendering | Implemented: authored row hierarchies, camera-selected pages, bounded module-worker decoding, foveated refinement, parent fallback, cancellation, and active-frontier residency. | Move hierarchy traversal and demand scheduling off the main thread; coordinate with the related [RAD renderer draft #3431](https://github.com/visgl/loaders.gl/pull/3431). |
| 50-million-splat Spark parity | In progress: the 50,937,127-source-row Coit capture streams through a bounded one-million-row resident window with calibrated camera, covariance, antialiasing, and coarse-level opacity. | Establish reproducible Spark visual/performance benchmarks, larger active sort domains, and near-linear cross-segment routing. |
| 3D Tiles integration | Partial: decoded Gaussian glTF primitives, feature identifiers, and caller-decoded SPZ v2 handoff work; loaders.gl already provides `Tileset3D` and `Tiles3DSource` traversal, transport, computed transforms, caching, and feature metadata. | Connect selected tiles to prepared splat batches or the existing `SplatLayer`, applying loader-computed transforms per tile/page in the renderer; qualify the beta.4 Gaussian glTF extension handler and legacy SPZ v2/v3 decoding alongside v4; see [tracking issue #1245](https://github.com/visgl/loaders.gl/issues/1245). |

## Delivery tranches

| Tranche | Scope | Status |
| --- | --- | --- |
| T0: portable rendering foundation | Caller-owned typed batches, anisotropic WebGPU/WebGL2 rendering, Arrow adapters, HDR source radiance, and the initial Gaussian showcase. | Implemented in [#2929](https://github.com/visgl/luma.gl/pull/2929). |
| T0a: progressive GPU graphs | Captured-scene website viewer, reusable WebGPU command graphs, preserved-batch streaming, global GPU sorting, and indirect draws. | Implemented in [#2932](https://github.com/visgl/luma.gl/pull/2932), [#2938](https://github.com/visgl/luma.gl/pull/2938), and [#2966](https://github.com/visgl/luma.gl/pull/2966). |
| T1: interaction and residency | Degree-one through degree-three harmonics, semantic filtering, GPU picking, dynamic source updates, mixed mesh composition, and bounded residency. | Implemented in [#3035](https://github.com/visgl/luma.gl/pull/3035). |
| T2: graph and hierarchy parity | Graph-native harmonics, filtering, picking, and mixed rendering; parent-preserving hierarchical paging; decoded glTF splats, feature IDs, and external SPZ handoff. | Implemented in [#3041](https://github.com/visgl/luma.gl/pull/3041). |
| T3: out-of-core RAD scenes | Authored row hierarchies, camera-prioritized cancellable page requests, bounded resident windows, and globally sorted segmented WebGPU rendering. | Implemented in [#3051](https://github.com/visgl/luma.gl/pull/3051). |
| T4: Spark-calibrated Coit showcase | Analytic covariance, area-preserving antialiasing, nonlinear coarse opacity, angular refinement, a 75-degree camera, and bounded module-worker page decoding. | Implemented in [#3057](https://github.com/visgl/luma.gl/pull/3057). |
| T5: documentation and correctness hardening | Embedded Coit documentation, asynchronous module-worker fallback, exact sorted WebGL compositing, unclamped WebGL harmonics, constructor-only graph allocation options, and validated Arrow source metadata. | Implemented in this follow-up. |
| T6: incremental hierarchy scheduling | Move camera-driven hierarchy traversal, row selection, and page-demand scheduling into incremental worker/GPU workflows with bounded per-frame work. | Planned; authored row traversal currently runs on the CPU. |
| T7: segmented picking and mixed composition | Resolve stable picking identities across paged GPU segments and composite paged splats with caller-owned meshes in one depth-aware render pass. | Partial: `prepare()` and `draw()` support paged host-pass composition; dedicated picking and mesh helpers still target non-paged renderers. |
| T8: partitioned global sorting | Sort beyond 33,554,432 active four-byte references on a 128 MiB storage-binding limit and replace segment-pair scatter with near-linear routing. | Planned; projected segments already exist, but global sorting still uses one binding. |
| T9: streamed 3D Tiles and glTF transport | Reuse existing loaders.gl tileset traversal, fetching, computed transforms, caching, and feature metadata; qualify the beta.4 Gaussian glTF handler and SPZ v2/v3/v4 decoding; connect selected content to prepared splats or the existing `SplatLayer` with per-tile/page renderer transforms. | Planned; beta.4 upstream source includes legacy SPZ v2/v3 and v4 decoding, but published-package qualification and end-to-end transformed Gaussian tile integration remain. |
| T10: reproducible Spark visual and performance evidence | Measure comparable scene imagery, frame times, startup, bandwidth, cancellation, and bounded residency against Spark's complete Coit source. | Planned; no measured visual or performance parity is claimed. |
