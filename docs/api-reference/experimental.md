# Experimental modules

<!-- -->

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/experimental` publishes usable APIs that are still evolving. These modules let the project validate new GPU architecture, analytics, rendering, and simulation contracts before they are considered for stable packages.

Experimental APIsWebGPU features available

Install matching luma.gl package versions:

```
yarn add @luma.gl/gpgpu @luma.gl/experimental @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use an experimental module when its current contract fits your application and you can absorb changes between releases. Prefer Core, Engine, Shadertools, or another stable package when they already provide the required capability.

## Live example[​](#live-example "Direct link to Live example")

This explicitly activated example compares A-buffer, weighted-blended, and ordinary alpha blending on the same scene. It demonstrates how an experimental renderer can still compose with stable Engine models and Shadertools passes.

### Order-independent Transparency

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/a-buffer)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## Module catalog[​](#module-catalog "Direct link to Module catalog")

### GPU data and analytics[​](#gpu-data-and-analytics "Direct link to GPU data and analytics")

| Module                                                                                              | Use it for                                                                                                     |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`@luma.gl/gpgpu/gpu-data`](https://luma.gl/docs/api-reference/gpgpu/gpu-data.md)                   | Primitive GPU chunks, views, vectors, constants, memory formats, and basic layout helpers.                     |
| [`@luma.gl/experimental/gpu-tables`](https://luma.gl/docs/api-reference/experimental/gpu-tables.md) | Record batches, tables, schemas, bindings, computations, and generic table planners.                           |
| `@luma.gl/experimental/models`                                                                      | Path and polygon rendering models, GPU input helpers, and model-specific planners.                             |
| [GPU Raster](https://luma.gl/docs/api-reference/experimental/gpu-raster.md)                         | Validity-aware raster overviews, statistics, filters, morphology, contours, and bounded residency.             |
| [LuCIM](https://luma.gl/docs/api-reference/experimental/lucim.md)                                   | CuCIM-inspired dense 3D volume thresholding, morphology, connected components, and region measurements.        |
| [GPU Project](https://luma.gl/docs/api-reference/experimental/gpu-project.md)                       | Adaptive high-precision coordinate projection on WebGPU.                                                       |
| [GPU Trace](https://luma.gl/docs/api-reference/experimental/gpu-trace.md)                           | Large GPU-resident trace scenes, interaction, aggregation, temporal indexing, comparison, and causal analysis. |
| [GPU Dataframe](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)                   | Immutable GPU-resident dataframe expressions, grouping, aggregation, sorting, indexes, and joins.              |
| [GPU SQL](https://luma.gl/docs/api-reference/experimental/gpu-sql.md)                               | Bounded SQL planning over registered GPU Dataframe inputs.                                                     |
| [GPU Crossfilter](https://luma.gl/docs/api-reference/experimental/gpu-crossfilter.md)               | Linked GPU filtering, histograms, aggregates, and rendering masks.                                             |
| [Geospatial kernels](https://luma.gl/docs/api-reference/experimental/geospatial.md)                 | Projection, distance, point-in-polygon, nearest-feature, and spatial-query operations.                         |

### Scene rendering and lighting[​](#scene-rendering-and-lighting "Direct link to Scene rendering and lighting")

| Module                                                                                              | Use it for                                                                       |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [SceneRenderer](https://luma.gl/docs/api-reference/experimental/scene-renderer.md)                  | Retained physically based forward rendering on WebGPU and WebGL 2.               |
| [DeferredSceneRenderer](https://luma.gl/docs/api-reference/experimental/deferred-scene-renderer.md) | G-buffer-based opaque lighting with forward fallbacks for unsupported materials. |
| [PBR environments](https://luma.gl/docs/api-reference/experimental/pbr-environment.md)              | Diffuse irradiance, prefiltered specular cubemaps, and BRDF lookup textures.     |
| [GBuffer](https://luma.gl/docs/api-reference/experimental/g-buffer.md)                              | Standard scene color, normal, roughness, velocity, and depth attachments.        |
| [Deferred lighting](https://luma.gl/docs/api-reference/experimental/deferred-lighting.md)           | Fullscreen lighting from G-buffer material targets.                              |
| [Clustered lighting](https://luma.gl/docs/api-reference/experimental/clustered-lighting.md)         | Compute-binned local lights for deferred shading.                                |
| [Shadow maps](https://luma.gl/docs/api-reference/experimental/shadow-map-renderer.md)               | Cascaded, spot-array, and point cube-array shadows with PCSS filtering.          |

### Materials and transparency[​](#materials-and-transparency "Direct link to Materials and transparency")

| Module                                                                                             | Use it for                                                               |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [A-buffer renderer](https://luma.gl/docs/api-reference/experimental/a-buffer-renderer.md)          | Accurate bounded per-pixel fragment storage, sorting, and compositing.   |
| [Weighted blended OIT](https://luma.gl/docs/api-reference/experimental/wboit-renderer.md)          | Portable approximate order-independent transparency without sorting.     |
| [Glass material](https://luma.gl/docs/api-reference/experimental/glass-material.md)                | Screen-space refraction, Fresnel reflection, dispersion, and absorption. |
| [Reflective material](https://luma.gl/docs/api-reference/experimental/reflective-material.md)      | Lightweight glossy environment reflection.                               |
| [Spectral caustics](https://luma.gl/docs/api-reference/experimental/spectral-caustics-renderer.md) | Geometry-derived multi-wavelength planar caustic lighting.               |
| [Comparison splitter](https://luma.gl/docs/api-reference/experimental/comparison-splitter.md)      | Accessible before-and-after canvas comparisons.                          |

### Simulation and immersive input[​](#simulation-and-immersive-input "Direct link to Simulation and immersive input")

| Module                                                                                           | Use it for                                                     |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| [MLS-MPM fluid](https://luma.gl/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)     | Fixed-capacity two-dimensional particle/grid fluid simulation. |
| [Spectral ocean](https://luma.gl/docs/api-reference/experimental/spectral-ocean-simulation.md)   | Deterministic FFT-based ocean displacement and foam.           |
| [Volumetric fire](https://luma.gl/docs/api-reference/experimental/volumetric-fire-simulation.md) | GPU-resident volumetric combustion and rendering.              |
| [WebXR](https://luma.gl/docs/api-reference/experimental/webxr.md)                                | Experimental WebGPU/WebGL session, frame, and camera helpers.  |

## Core concepts[​](#core-concepts "Direct link to Core concepts")

Experimental modules follow the same ownership model as the rest of luma.gl: callers own the frame loop and command submission unless a reference explicitly says otherwise. GPU scheduling contributors declare work but do not submit it. Renderer and simulation references state which resources they own, borrow, cache, or expose.

Use the [shared glossary](https://luma.gl/docs/glossary.md) for resource, ownership, binding, pipeline, pass, submission, data hazard, indirect work, and GPU residency terminology.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

Experimental APIs may change or be removed without the compatibility guarantees of stable packages. Many GPU scheduling and simulation modules require WebGPU; individual references state backend, feature, capacity, and memory requirements. Treat benchmark results as workload- and adapter- specific rather than universal performance claims.

## Related modules[​](#related-modules "Direct link to Related modules")

* [Choosing a luma.gl API layer](https://luma.gl/docs/api-guide.md)
* [Core API](https://luma.gl/docs/api-reference/core.md)
* [Engine API](https://luma.gl/docs/api-reference/engine.md)
* [Shadertools API](https://luma.gl/docs/api-reference/shadertools.md)
* [Effects API](https://luma.gl/docs/api-reference/effects.md)
