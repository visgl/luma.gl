# Overview

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[SceneRenderer](https://luma.gl/next/docs/api-reference/experimental/scene-renderer.md)[Deferred Scenes](https://luma.gl/next/docs/api-reference/experimental/deferred-scene-renderer.md)[PBR Environments](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[GPU Rasters](https://luma.gl/next/docs/api-reference/experimental/luraster.md)[GPU Graphs](https://luma.gl/next/docs/api-reference/experimental/lugraph.md)[luDF](https://luma.gl/next/docs/api-reference/experimental/ludf.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GPU Traces](https://luma.gl/next/docs/api-reference/experimental/lutrace.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`@luma.gl/experimental` publishes incubating luma.gl APIs that are usable by applications but may change or be removed without the compatibility guarantees applied to stable modules.

Install the package alongside matching luma.gl core, engine, and shadertools versions:

```
yarn add @luma.gl/experimental @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

## Physically Based Scene Rendering[​](#physically-based-scene-rendering "Direct link to Physically Based Scene Rendering")

[`SceneRenderer`](https://luma.gl/next/docs/api-reference/experimental/scene-renderer.md) renders retained, physically based surfaces on WebGPU and WebGL using the canonical `@luma.gl/shadertools` PBR modules. Its format-independent scene descriptors support one-draw instancing, opaque/masked/blended materials, source-faithful geometry attributes and UV sets, existing skinning and morph-target primitives, advanced physical material factors, roughness-aware image-based lighting, physically based refraction through captured opaque scene color, transparent ordering, and retained pipeline invalidation.

[`PBREnvironmentGenerator`](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md) prepares a complete lighting environment from a caller-owned equirectangular GPU texture. Portable WGSL/GLSL passes integrate a GGX-prefiltered specular cubemap at every roughness mip, a cosine-weighted diffuse irradiance cubemap, and a split-sum BRDF lookup texture with explicit linear/sRGB source handling.

[`DeferredSceneRenderer`](https://luma.gl/next/docs/api-reference/experimental/deferred-scene-renderer.md) consumes the same scene descriptors on WebGPU and resolves compatible opaque/masked metallic-roughness surfaces through the shared G-buffer and deferred-lighting pass. Its four HDR-preserving color attachments fit the default 32-byte WebGPU CORE limit without requesting elevated adapter limits. Advanced materials, blended surfaces, environment lighting, and debug views automatically fall back to the forward renderer.

`RayTracingSceneRenderer` consumes the same scene descriptors on WebGPU through a [`GPUCommandGraph`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md). Compute passes derive tight world-space instance bounds directly from retained mesh BLAS roots, Morton-sort active object/instance leaves into an explicit retained permutation, build and refit a complete-binary TLAS through [`GPUBVH`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md), and traverse it for nearest-hit rays and early-exit shadows. Transform-only animation gathers updated bounds through the retained permutation and refits without sorting; topology changes and periodic spatial refreshes rebuild the Morton order. A topology-only graph Morton-sorts each mesh's triangles into GPU-built BLASes, which transform-only updates reuse. The general-purpose graph sorter fuses inputs of up to 256 rows into one workgroup and uses stable four-bit radix passes for larger inputs; `GPUSegmentedSort` and `GPUSegmentedBVH` group many small packed mesh permutations and hierarchies into at most eight dispatches each. Traversal caches inverse ray directions and queued box-entry distances without changing visibility or temporal jitter. Consecutive compute nodes automatically share a compute pass when per-node GPU timestamp profiling is inactive. `RayTracingSceneRenderOptions` add analytic sphere metadata, perspective/orthographic camera selection, adaptive half-resolution rendering, interleaved pixel phases, retained-identity temporal reprojection, bounded rotating shadow samples, progressive accumulation, and upsampled HDR presentation. Reusable `GPUTextureHistory` pairs rotate color and metadata graph bindings without full-frame copies; sparse phases carry only untouched pixels. The default `0.5` resolution scale can decrease to `0.25` toward a `33.3` millisecond smoothed animation-frame budget; GPU timestamp queries are not required. Acceleration passes run only when geometry or instance transforms change. Shared scene adapters can provide categorized committed-scene revisions so camera-only frames avoid repeatedly serializing every instance transform, material, and light. The canvas or a caller-owned offscreen framebuffer determines the actual attachment formats and target dimensions; scalar metallic-roughness lighting follows GGX/Smith/Fresnel, and presentation uses the shared tone-mapping and exact linear/sRGB output conventions. Shared scene statistics expose internal dimensions, effective scale, sampled-pixel coverage, frame timing, accumulated samples, and per-stage command-graph node, physical-pass, coalescing, and CPU encoding costs. The ray pass uses exactly eight storage buffers, and every TLAS or BLAS construction pass fits the default WebGPU CORE limit of eight storage buffers. Applications retain command-submission ownership.

The Morton-sorted TLAS accelerates objects and instances, while GPU-built Morton-sorted BLASes accelerate each mesh's triangles. Hardware ray tracing, SAH/Karras hierarchy topology, indirect path tracing, denoising, and volume rendering are not implemented. Skeletal/morph deformation, material textures, alpha/transmission, and advanced PBR material extensions remain on the forward/deferred renderer paths.

`createPBRMaterialFactory`, `createPBRMaterial`, and `createPBRModel` are also available when an application needs lower-level composition with the same canonical material and shader contracts. These opinionated orchestration helpers remain experimental; `@luma.gl/engine` continues to own stable, generic rendering and animation primitives.

## Interactive View Comparisons[​](#interactive-view-comparisons "Direct link to Interactive View Comparisons")

[`ComparisonSplitter`](https://luma.gl/next/docs/api-reference/experimental/comparison-splitter.md) adds an accessible, draggable divider to a canvas without depending on a renderer or graphics backend. Its self-contained DOM overlay supports pointer, touch, and keyboard interactions, per-instance styling, embedded documentation, and before/after shader or viewport comparisons.

## WebXR[​](#webxr "Direct link to WebXR")

![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

* [WebXR](https://luma.gl/next/docs/api-reference/experimental/webxr.md): WebGPU/WebGL session and frame helpers, with WebGL-only raw camera textures.

## Surface Targets and Composable Effects[​](#surface-targets-and-composable-effects "Direct link to Surface Targets and Composable Effects")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`GBuffer`](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md) owns the standard scene color, normal-roughness, velocity, and depth attachments used by depth-aware and temporal shader-pass pipelines. Velocity remains enabled by default; applications that do not use motion vectors can pass `velocity: false` to omit that target and reserve the attachment budget for named extra MRT channels carrying application-specific lighting, material, picking, or debug data.

[`deferredLighting`](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md) is a composable fullscreen consumer of those targets. It reconstructs view position from depth and resolves a directional light plus a fixed-capacity storage buffer of point lights from two named material attachments.

[`ClusteredLightGrid`](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md) scales the same material contract to hundreds of local lights. A WebGPU compute pass bins view-space light spheres into screen/depth clusters, and `clusteredDeferredLighting` normally evaluates the current pixel's compact retained list. Saturated clusters fall back to checking all active lights so opaque direct lighting remains complete.

The [Shader Passes guide](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) explains how a scene render, `GBuffer` bindings, deferred lighting, ordered `ShaderPassPipeline` effects, temporal history, and OIT resolve pipelines compose into one render stack.

## GPU Primitives and Command Graphs[​](#gpu-primitives-and-command-graphs "Direct link to GPU Primitives and Command Graphs")

![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

The [GPU Primitives and Command Graphs guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md) introduces explicit command scheduling, typed table-backed graph views, hierarchical scan, stable compaction, stable key/value sorting, bounded two-dimensional complex FFTs, and GPU-written indirect draw commands.

## GPU-resident Raster Analytics[​](#gpu-resident-raster-analytics "Direct link to GPU-resident Raster Analytics")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`@luma.gl/experimental/luraster`](https://luma.gl/next/docs/api-reference/experimental/luraster.md) analyzes scientific and geospatial raster bands directly inside caller-owned WebGPU command graphs. It distinguishes missing observations from valid zeroes, preserves source calibration and spatial metadata, and composes vegetation indices, distributions, thresholds, neighborhood filters, morphology, and contour geometry without downloading raster pixels.

Applications can optionally add bounded tile residency, seam-safe neighboring samples, validity-aware analytical overviews, and dataset-wide histogram replay. The [raster concepts and execution guide](https://luma.gl/next/docs/api-reference/experimental/luraster/concepts.md) explains nodata, validity masks, owned tile cores, halos, overviews, and replay before introducing the API. The [Satellite Raster Lab](https://luma.gl/next/examples/showcase/raster-lab) demonstrates every completed capability with real GPU computation and a fixed-size analytical summary.

## GPU-native Trace Exploration[​](#gpu-native-trace-exploration "Direct link to GPU-native Trace Exploration")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`@luma.gl/experimental/lutrace`](https://luma.gl/next/docs/api-reference/experimental/lutrace.md) keeps execution-trace schemas, GPU-resident spans, process/thread hierarchy, dependency focus, interactive filtering, and timeline picking in a dedicated optional submodule. It composes generic command graphs, visibility, flat scenes, and indirect rendering without adding trace concepts to their APIs.

## GPU-resident Graph Analytics[​](#gpu-resident-graph-analytics "Direct link to GPU-resident Graph Analytics")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`@luma.gl/experimental/lugraph`](https://luma.gl/next/docs/api-reference/experimental/lugraph.md) turns existing GPU edge columns into reusable compressed adjacency, vertex degrees, unweighted and nonnegative weighted shortest paths, weakly connected components, label-propagation communities, local clustering coefficients, durable core numbers, community modularity scores, bounded weighted community optimization, and dangling-aware PageRank scores. Social networks, dependency graphs, transaction investigations, and infrastructure maps can compose those operations into one WebGPU command graph without copying source batches or reading complete results back to JavaScript. The optimizer considers genuinely empty community labels, so over-merged starting groups can split; weighted `float32` accumulation can vary with GPU execution order, and stable tie-breaking does not guarantee identical weighted partitions. The [interactive graph explorer](https://luma.gl/next/examples/experimental/lugraph-explorer) adds directly renderable exact force-layout coordinates, neighborhood highlighting, stable GPU picking, dragging, and pinning. An opt-in live benchmark compares nine actual CPU and WebGPU graph workloads across five graph families, covering all six [LDBC Graphalytics algorithm families](https://ldbcouncil.org/benchmarks/graphalytics/algorithms/) defined by the [Graph Data Council (GDC)](https://ldbcouncil.org/) while reporting command encoding, completion fences, setup costs, and layout accuracy. The council was formerly the Linked Data Benchmark Council (LDBC); its benchmark name remains LDBC Graphalytics. Core numbers and modularity scoring and optimization extend beyond those six families. Optimization is single-level local moving, not full multilevel Louvain or Leiden. Feature coverage and the local benchmark do not claim an official submission, certification, or published result.

## GPU-Resident Dataframes[​](#gpu-resident-dataframes "Direct link to GPU-Resident Dataframes")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`luDF`](https://luma.gl/next/docs/api-reference/experimental/ludf.md) adds immutable, GPU-resident dataframe queries on top of existing `GPUTable` batches. Its optional `@luma.gl/experimental/ludf` entry point provides nullable expressions, derived columns, categorical and global aggregation, histograms, stable per-batch sorting, top-K selection, and bounded unique-right joins without hidden GPU submission, source repacking, or CPU readback. The existing [GPU Data Analysis example](https://luma.gl/next/examples/experimental/gpu-data-analysis) demonstrates Arrow ingestion and opt-in, explicitly fenced GPU-versus-CPU benchmarks.

## GPU-resident Linked Crossfiltering[​](#gpu-resident-linked-crossfiltering "Direct link to GPU-resident Linked Crossfiltering")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`LuxFilter`](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md) connects numeric ranges and rectangular brushes to linked histograms, grouped aggregates, stable visible-row identifiers, and rendering masks through one reusable WebGPU command graph. Source rows stay on the GPU; applications control chart rendering, command submission, and any compact summary readback.

## WebGPU Geospatial Kernels[​](#webgpu-geospatial-kernels "Direct link to WebGPU Geospatial Kernels")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

The [WebGPU Geospatial Kernels](https://luma.gl/next/docs/api-reference/experimental/geospatial.md) entry point contributes projection, distance, point-in-polygon, nearest-linestring, uniform-grid indexing, and spatial-query work to a `GPUCommandGraph`. It accepts either local f32 coordinates or raw binary64 coordinate words where supported and makes the f32-transcendental versus precise planar arithmetic boundary explicit.

## High-precision GPU Coordinate Projection[​](#high-precision-gpu-coordinate-projection "Direct link to High-precision GPU Coordinate Projection")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`@luma.gl/experimental/luproj`](https://luma.gl/next/docs/api-reference/experimental/luproj.md) compiles arbitrary CPU projection providers into adaptive, origin-relative WebGPU polynomial patches. It preserves raw binary64 coordinate precision without native WGSL `f64`, supports optional preassigned patch IDs, and includes a live browser benchmark comparing direct CPU, compiled CPU, and four real WebGPU execution paths.

## GPU Simulations[​](#gpu-simulations "Direct link to GPU Simulations")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`MLSMPMFluidSimulation`](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md) evolves a fixed-capacity two-dimensional weakly compressible fluid with MLS-MPM/APIC transfers. It records ordered compute work into a caller-owned command encoder, exposes the current particle storage buffer for application rendering, and provides deterministic particle seeding and reset without hidden submission or readback.

[`SpectralOceanSimulation`](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md) evolves a deterministic Phillips spectrum, composes three inverse `GPUFFT2D` transforms, and exposes render-ready displacement and normal/foam buffers without taking command-submission ownership.

## Order-independent Transparency[​](#order-independent-transparency "Direct link to Order-independent Transparency")

OIT keeps scene-level geometry capture in its renderers and exposes fullscreen resolve as standard `ShaderPassPipeline`s. The resolve pipelines run through the existing `ShaderPassRenderer`, where they can be ordered alongside color, blur, bloom, and other advanced effects.

![Order-independent transparency architecture showing renderer-owned capture feeding reusable WBOIT and A-buffer resolve pipelines in the advanced effects system](/next/assets/images/oit-resolve-pipelines-white-af77be5d51c61a5922017fa07492b375.png)

* [`ABufferRenderer`](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md) captures, sorts, and composites per-pixel fragment lists on WebGPU. It offers the most accurate result but consumes bounded storage and performs per-pixel sorting.
* [`WBOITRenderer`](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md) accumulates weighted color and revealage on WebGPU or WebGL2. It avoids sorting and storage buffers, but the result is approximate and requires two translucent geometry passes.

Both renderers leave scene models, shader inputs, command submission, and fallback selection under application control.

Compare A-buffer, weighted-blended, and ordinary alpha blending on the same overlapping scene:

### Order-independent Transparency

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/a-buffer)Info

InfoSource

```
// Loading source…
```

## Optical Materials[​](#optical-materials "Direct link to Optical Materials")

[`glassMaterial`](https://luma.gl/next/docs/api-reference/experimental/glass-material.md) provides portable WGSL and GLSL screen-space refraction, Schlick Fresnel reflection, chromatic dispersion, and Beer-Lambert absorption. [`reflectiveMaterial`](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md) adds lightweight glossy highlights and Fresnel-weighted environment reflection for other surfaces.

Both modules share `opticalLighting`, expose a `ShaderPlugin`, and can be composed with sorted alpha, weighted-blended OIT, or A-buffer OIT. `emissiveMaterial` shades self-illuminated objects, and `opticalPointLights` supplies a bounded, portable array of moving colored lights for the illuminated glass and reflective helpers. HDR transparency output can then feed reusable bloom and tone-mapping shader passes.

The [Transparency](https://luma.gl/next/docs/api-guide/shaders/transparency.md) and [Glass Effects](https://luma.gl/next/docs/api-guide/shaders/glass-effects.md) guides describe render ordering, backend constraints, local lighting, and physically based limitations.

[`SpectralCausticsRenderer`](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md) provides a WebGPU-only geometry-derived alternative to the analytic `opticalCaustics` helper. It captures one convex refractor from a light view, traces six wavelength bands on the GPU, accumulates an HDR XYZ map, and exposes the `spectralCaustics` receiver module for additive planar lighting.

## Hybrid Shadows[​](#hybrid-shadows "Direct link to Hybrid Shadows")

[`ShadowMapRenderer`](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md) provides WebGPU-only cascaded directional, spot-array, and point cube-array maps with PCSS filtering. Applications draw casters through a per-view callback and explicitly multiply the `shadow` module's factors into their direct-light terms. A companion shader-pass pipeline adds primary-sun contact refinement.

## Packed Pixel Formats[​](#packed-pixel-formats "Direct link to Packed Pixel Formats")

`RGBADecoder` and `TEXTURE_FORMAT_PIXEL_DECODERS` provide the existing experimental helpers for encoding and decoding packed texture formats.
