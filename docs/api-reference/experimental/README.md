import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {OITExample} from '@site/src/examples';

# Overview

<ExperimentalDocsTabs active="overview" />

`@luma.gl/experimental` publishes incubating luma.gl APIs that are usable by applications but may
change or be removed without the compatibility guarantees applied to stable modules.

Install the package alongside matching luma.gl core, engine, and shadertools versions:

```bash
yarn add @luma.gl/experimental @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

## Physically Based Scene Rendering

[`SceneRenderer`](/docs/api-reference/experimental/scene-renderer) renders retained, physically
based surfaces on WebGPU and WebGL using the canonical `@luma.gl/shadertools` PBR modules. Its
format-independent scene descriptors support one-draw instancing, opaque/masked/blended materials,
source-faithful geometry attributes and UV sets, existing skinning and morph-target primitives,
advanced physical material factors, roughness-aware image-based lighting, physically based
refraction through captured opaque scene color, transparent ordering, and retained pipeline
invalidation.

[`PBREnvironmentGenerator`](/docs/api-reference/experimental/pbr-environment) prepares a complete
lighting environment from a caller-owned equirectangular GPU texture. Portable WGSL/GLSL passes
integrate a GGX-prefiltered specular cubemap at every roughness mip, a cosine-weighted diffuse
irradiance cubemap, and a split-sum BRDF lookup texture with explicit linear/sRGB source handling.

[`DeferredSceneRenderer`](/docs/api-reference/experimental/deferred-scene-renderer) consumes the
same scene descriptors on WebGPU and resolves compatible opaque/masked metallic-roughness surfaces
through the shared G-buffer and deferred-lighting pass. Its four HDR-preserving color attachments
fit the default 32-byte WebGPU CORE limit without requesting elevated adapter limits. Advanced
materials, blended surfaces, environment lighting, and debug views automatically fall back to the
forward renderer.

`RayTracingSceneRenderer` consumes the same scene descriptors on WebGPU through a
[`GPUCommandGraph`](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph). Compute
passes derive world-space instance bounds, build and refit the existing
[`GPUBVH`](/docs/api-reference/experimental/gpu-primitives/gpu-bvh), and traverse its complete
binary hierarchy for nearest-hit rays and early-exit shadows. `RayTracingSceneRenderOptions` add
analytic sphere metadata, perspective/orthographic camera selection, progressive primary-ray
accumulation, and HDR presentation. The ray pass uses five storage buffers and the existing BVH
builder uses eight, fitting default WebGPU CORE limits. Applications retain command-submission
ownership.

The source-order BVH accelerates objects and instances, not individual mesh triangles. Hardware ray
tracing, spatial sorting, per-mesh BVHs, indirect path tracing, denoising, and volume rendering are
not implemented. Skeletal/morph deformation, material textures, alpha/transmission, and advanced
PBR shading remain on the forward/deferred renderer paths.

`createPBRMaterialFactory`, `createPBRMaterial`, and `createPBRModel` are also available when an
application needs lower-level composition with the same canonical material and shader contracts.
These opinionated orchestration helpers remain experimental; `@luma.gl/engine` continues to own
stable, generic rendering and animation primitives.

## Interactive View Comparisons

[`ComparisonSplitter`](/docs/api-reference/experimental/comparison-splitter) adds an accessible,
draggable divider to a canvas without depending on a renderer or graphics backend. Its
self-contained DOM overlay supports pointer, touch, and keyboard interactions, per-instance
styling, embedded documentation, and before/after shader or viewport comparisons.

## WebXR

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

- [WebXR](/docs/api-reference/experimental/webxr): WebGPU/WebGL session and frame helpers, with WebGL-only raw camera textures.

## Surface Targets and Composable Effects

<p class="badges">
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

[`GBuffer`](/docs/api-reference/experimental/g-buffer) owns the standard scene color,
normal-roughness, velocity, and depth attachments used by depth-aware and temporal shader-pass
pipelines. Velocity remains enabled by default; applications that do not use motion vectors can
pass `velocity: false` to omit that target and reserve the attachment budget for named extra MRT
channels carrying application-specific lighting, material, picking, or debug data.

[`deferredLighting`](/docs/api-reference/experimental/deferred-lighting) is a composable fullscreen
consumer of those targets. It reconstructs view position from depth and resolves a directional
light plus a fixed-capacity storage buffer of point lights from two named material attachments.

[`ClusteredLightGrid`](/docs/api-reference/experimental/clustered-lighting) scales the same
material contract to hundreds of local lights. A WebGPU compute pass bins view-space light spheres
into screen/depth clusters, and `clusteredDeferredLighting` normally evaluates the current pixel's
compact retained list. Saturated clusters fall back to checking all active lights so opaque direct
lighting remains complete.

The [Shader Passes guide](/docs/api-guide/shaders/shader-passes) explains how a scene render,
`GBuffer` bindings, deferred lighting, ordered `ShaderPassPipeline` effects, temporal history, and
OIT resolve pipelines compose into one render stack.

## GPU Primitives and Command Graphs

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

The [GPU Primitives and Command Graphs guide](/docs/api-reference/experimental/gpu-primitives)
introduces explicit command scheduling, typed table-backed graph views, hierarchical scan, stable
compaction, stable key/value sorting, bounded two-dimensional complex FFTs, and GPU-written
indirect draw commands.

## GPU-native Trace Exploration

<p class="badges">
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

[`@luma.gl/experimental/lutrace`](/docs/api-reference/experimental/lutrace) keeps execution-trace
schemas, GPU-resident spans, process/thread hierarchy, dependency focus, interactive filtering,
and timeline picking in a dedicated optional submodule. It composes generic command graphs,
visibility, flat scenes, and indirect rendering without adding trace concepts to their APIs.

## GPU-resident Graph Analytics

<p class="badges">
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

[`@luma.gl/experimental/lugraph`](/docs/api-reference/experimental/lugraph) turns existing GPU
edge columns into reusable compressed adjacency, vertex degrees, bounded shortest-path searches,
weakly connected components, and dangling-aware PageRank scores. Social networks, dependency graphs,
transaction investigations, and infrastructure maps can compose those operations into one WebGPU
command graph without copying source batches or reading complete results back to JavaScript.

## GPU-resident Linked Crossfiltering

<p class="badges">
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

[`LuxFilter`](/docs/api-reference/experimental/luxfilter) connects numeric ranges and rectangular
brushes to linked histograms, grouped aggregates, stable visible-row identifiers, and rendering
masks through one reusable WebGPU command graph. Source rows stay on the GPU; applications control
chart rendering, command submission, and any compact summary readback.

## WebGPU Geospatial Kernels

<p class="badges">
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

The [WebGPU Geospatial Kernels](/docs/api-reference/experimental/geospatial) entry point contributes
projection, distance, point-in-polygon, nearest-linestring, uniform-grid indexing, and spatial-query
work to a `GPUCommandGraph`. It accepts either local f32 coordinates or raw binary64 coordinate
words where supported and makes the f32-transcendental versus precise planar arithmetic boundary
explicit.

## High-precision GPU Coordinate Projection

<p class="badges">
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

[`@luma.gl/experimental/luproj`](/docs/api-reference/experimental/luproj) compiles arbitrary CPU
projection providers into adaptive, origin-relative WebGPU polynomial patches. It preserves raw
binary64 coordinate precision without native WGSL `f64`, supports optional preassigned patch IDs,
and includes a live browser benchmark comparing direct CPU, compiled CPU, and four real WebGPU
execution paths.

## GPU Simulations

<p class="badges">
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
</p>

[`MLSMPMFluidSimulation`](/docs/api-reference/experimental/mls-mpm-fluid-simulation) evolves a
fixed-capacity two-dimensional weakly compressible fluid with MLS-MPM/APIC transfers. It records
ordered compute work into a caller-owned command encoder, exposes the current particle storage
buffer for application rendering, and provides deterministic particle seeding and reset without
hidden submission or readback.

[`SpectralOceanSimulation`](/docs/api-reference/experimental/spectral-ocean-simulation) evolves a
deterministic Phillips spectrum, composes three inverse `GPUFFT2D` transforms, and exposes
render-ready displacement and normal/foam buffers without taking command-submission ownership.

## Order-independent Transparency

OIT keeps scene-level geometry capture in its renderers and exposes fullscreen resolve as standard
`ShaderPassPipeline`s. The resolve pipelines run through the existing `ShaderPassRenderer`, where
they can be ordered alongside color, blur, bloom, and other advanced effects.

![Order-independent transparency architecture showing renderer-owned capture feeding reusable WBOIT and A-buffer resolve pipelines in the advanced effects system](/images/docs/oit-resolve-pipelines-white.png)

- [`ABufferRenderer`](/docs/api-reference/experimental/a-buffer-renderer) captures, sorts, and
  composites per-pixel fragment lists on WebGPU. It offers the most accurate result but consumes
  bounded storage and performs per-pixel sorting.
- [`WBOITRenderer`](/docs/api-reference/experimental/wboit-renderer) accumulates weighted color and
  revealage on WebGPU or WebGL2. It avoids sorting and storage buffers, but the result is
  approximate and requires two translucent geometry passes.

Both renderers leave scene models, shader inputs, command submission, and fallback selection under
application control.

Compare A-buffer, weighted-blended, and ordinary alpha blending on the same overlapping scene:

<OITExample embedded showStats={false} />

## Optical Materials

[`glassMaterial`](/docs/api-reference/experimental/glass-material) provides portable WGSL and GLSL
screen-space refraction, Schlick Fresnel reflection, chromatic dispersion, and Beer-Lambert
absorption. [`reflectiveMaterial`](/docs/api-reference/experimental/reflective-material) adds
lightweight glossy highlights and Fresnel-weighted environment reflection for other surfaces.

Both modules share `opticalLighting`, expose a `ShaderPlugin`, and can be composed with sorted
alpha, weighted-blended OIT, or A-buffer OIT. `emissiveMaterial` shades self-illuminated objects,
and `opticalPointLights` supplies a bounded, portable array of moving colored lights for the
illuminated glass and reflective helpers. HDR transparency output can then feed reusable bloom
and tone-mapping shader passes.

The [Transparency](/docs/api-guide/shaders/transparency) and
[Glass Effects](/docs/api-guide/shaders/glass-effects) guides describe render ordering, backend
constraints, local lighting, and physically based limitations.

[`SpectralCausticsRenderer`](/docs/api-reference/experimental/spectral-caustics-renderer) provides
a WebGPU-only geometry-derived alternative to the analytic `opticalCaustics` helper. It captures
one convex refractor from a light view, traces six wavelength bands on the GPU, accumulates an HDR
XYZ map, and exposes the `spectralCaustics` receiver module for additive planar lighting.

## Hybrid Shadows

[`ShadowMapRenderer`](/docs/api-reference/experimental/shadow-map-renderer) provides WebGPU-only
cascaded directional, spot-array, and point cube-array maps with PCSS filtering. Applications draw
casters through a per-view callback and explicitly multiply the `shadow` module's factors into
their direct-light terms. A companion shader-pass pipeline adds primary-sun contact refinement.

## Packed Pixel Formats

`RGBADecoder` and `TEXTURE_FORMAT_PIXEL_DECODERS` provide the existing experimental helpers for
encoding and decoding packed texture formats.
