# Overview

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GPU Traces](https://luma.gl/next/docs/api-reference/experimental/lutrace.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`@luma.gl/experimental` publishes incubating luma.gl APIs that are usable by applications but may change or be removed without the compatibility guarantees applied to stable modules.

Install the package alongside matching luma.gl core, engine, and shadertools versions:

```
yarn add @luma.gl/experimental @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

## WebXR[​](#webxr "Direct link to WebXR")

![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

* [WebXR](https://luma.gl/next/docs/api-reference/experimental/webxr.md): WebGL-only session, frame, and raw camera helpers.

## Surface Targets and Composable Effects[​](#surface-targets-and-composable-effects "Direct link to Surface Targets and Composable Effects")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`GBuffer`](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md) owns the standard scene color, normal-roughness, velocity, and depth attachments used by depth-aware and temporal shader-pass pipelines. It also exposes named extra MRT channels for application-specific lighting, material, picking, or debug data.

[`deferredLighting`](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md) is a composable fullscreen consumer of those targets. It reconstructs view position from depth and resolves a directional light plus a fixed-capacity storage buffer of point lights from two named material attachments.

[`ClusteredLightGrid`](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md) scales the same material contract to hundreds of local lights. A WebGPU compute pass bins view-space light spheres into screen/depth clusters, and `clusteredDeferredLighting` normally evaluates the current pixel's compact retained list. Saturated clusters fall back to checking all active lights so opaque direct lighting remains complete.

The [Shader Passes guide](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) explains how a scene render, `GBuffer` bindings, deferred lighting, ordered `ShaderPassPipeline` effects, temporal history, and OIT resolve pipelines compose into one render stack.

## GPU Primitives and Command Graphs[​](#gpu-primitives-and-command-graphs "Direct link to GPU Primitives and Command Graphs")

![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

The [GPU Primitives and Command Graphs guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md) introduces explicit command scheduling, typed table-backed graph views, hierarchical scan, stable compaction, stable key/value sorting, bounded two-dimensional complex FFTs, and GPU-written indirect draw commands.

## GPU-native Trace Exploration[​](#gpu-native-trace-exploration "Direct link to GPU-native Trace Exploration")

![WebGPU required](https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square)

[`@luma.gl/experimental/lutrace`](https://luma.gl/next/docs/api-reference/experimental/lutrace.md) keeps execution-trace schemas, GPU-resident spans, process/thread hierarchy, dependency focus, interactive filtering, and timeline picking in a dedicated optional submodule. It composes generic command graphs, visibility, flat scenes, and indirect rendering without adding trace concepts to their APIs.

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
