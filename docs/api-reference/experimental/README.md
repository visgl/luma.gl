---
title: Experimental modules
description: A catalog of incubating luma.gl renderers, GPU algorithms, simulations, and WebXR helpers.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {OITExample} from '@site/src/examples';

# Experimental modules

<ExperimentalDocsTabs active="overview" />

## Overview

`@luma.gl/experimental` publishes usable APIs that are still evolving. These modules let the
project validate new GPU architecture, analytics, rendering, and simulation contracts before they
are considered for stable packages.

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental APIs</DocumentationBadge>
  <DocumentationBadge tone="webgpu">WebGPU features available</DocumentationBadge>
</DocumentationBadges>

Install matching luma.gl package versions:

```bash
yarn add @luma.gl/gpgpu @luma.gl/experimental @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

## When to use it

Use an experimental module when its current contract fits your application and you can absorb
changes between releases. Prefer Core, Engine, Shadertools, or another stable package when they
already provide the required capability.

## Live example

This explicitly activated example compares A-buffer, weighted-blended, and ordinary alpha
blending on the same scene. It demonstrates how an experimental renderer can still compose with
stable Engine models and Shadertools passes.

<OITExample embedded showStats={false} />

## Module catalog

### GPU Core and GPU analytics

| Module | Use it for |
| --- | --- |
| [`@luma.gl/gpgpu/gpu-data`](/docs/api-reference/tables) | Primitive GPU chunks, views, vectors, constants, memory formats, and basic layout helpers. |
| [`@luma.gl/experimental/gpu-tables`](/docs/api-reference/tables) | Private record batches, tables, schemas, bindings, computations, and generic table planners. |
| [`@luma.gl/experimental/models`](/docs/api-reference/tables) | Private path and polygon rendering models, GPU input helpers, and model-specific planners. |
| [`@luma.gl/gpgpu/gpu-core`](/docs/api-reference/experimental/gpu-core) | Schedule reusable GPU algorithms, validate resource dependencies, reuse transient storage, and drive indirect work. |
| [`@luma.gl/gpgpu/gpu-graph`](/docs/api-reference/experimental/gpu-graph) | GPU-resident topology, traversal, connectivity, ranking, community, and layout algorithms. |
| [GPU Raster](/docs/api-reference/experimental/gpu-raster) | Validity-aware raster overviews, statistics, filters, morphology, contours, and bounded residency. |
| [LuCIM](/docs/api-reference/experimental/lucim) | CuCIM-inspired dense 3D volume thresholding, morphology, connected components, and region measurements. |
| [GPU Project](/docs/api-reference/experimental/gpu-project) | Adaptive high-precision coordinate projection on WebGPU. |
| [GPU Trace](/docs/api-reference/experimental/gpu-trace) | Large GPU-resident trace scenes, interaction, aggregation, temporal indexing, comparison, and causal analysis. |
| [GPU Dataframe](/docs/api-reference/experimental/gpu-dataframe) | Immutable GPU-resident dataframe expressions, grouping, aggregation, sorting, indexes, and joins. |
| [GPU SQL](/docs/api-reference/experimental/gpu-sql) | Bounded SQL planning over registered GPU Dataframe inputs. |
| [GPU Crossfilter](/docs/api-reference/experimental/gpu-crossfilter) | Linked GPU filtering, histograms, aggregates, and rendering masks. |
| [Geospatial kernels](/docs/api-reference/experimental/geospatial) | Projection, distance, point-in-polygon, nearest-feature, and spatial-query operations. |

### Scene rendering and lighting

| Module | Use it for |
| --- | --- |
| [SceneRenderer](/docs/api-reference/experimental/scene-renderer) | Retained physically based forward rendering on WebGPU and WebGL 2. |
| [DeferredSceneRenderer](/docs/api-reference/experimental/deferred-scene-renderer) | G-buffer-based opaque lighting with forward fallbacks for unsupported materials. |
| [PBR environments](/docs/api-reference/experimental/pbr-environment) | Diffuse irradiance, prefiltered specular cubemaps, and BRDF lookup textures. |
| [GBuffer](/docs/api-reference/experimental/g-buffer) | Standard scene color, normal, roughness, velocity, and depth attachments. |
| [Deferred lighting](/docs/api-reference/experimental/deferred-lighting) | Fullscreen lighting from G-buffer material targets. |
| [Clustered lighting](/docs/api-reference/experimental/clustered-lighting) | Compute-binned local lights for deferred shading. |
| [Shadow maps](/docs/api-reference/experimental/shadow-map-renderer) | Cascaded, spot-array, and point cube-array shadows with PCSS filtering. |

### Materials and transparency

| Module | Use it for |
| --- | --- |
| [A-buffer renderer](/docs/api-reference/experimental/a-buffer-renderer) | Accurate bounded per-pixel fragment storage, sorting, and compositing. |
| [Weighted blended OIT](/docs/api-reference/experimental/wboit-renderer) | Portable approximate order-independent transparency without sorting. |
| [Glass material](/docs/api-reference/experimental/glass-material) | Screen-space refraction, Fresnel reflection, dispersion, and absorption. |
| [Reflective material](/docs/api-reference/experimental/reflective-material) | Lightweight glossy environment reflection. |
| [Spectral caustics](/docs/api-reference/experimental/spectral-caustics-renderer) | Geometry-derived multi-wavelength planar caustic lighting. |
| [Comparison splitter](/docs/api-reference/experimental/comparison-splitter) | Accessible before-and-after canvas comparisons. |

### Simulation and immersive input

| Module | Use it for |
| --- | --- |
| [MLS-MPM fluid](/docs/api-reference/experimental/mls-mpm-fluid-simulation) | Fixed-capacity two-dimensional particle/grid fluid simulation. |
| [Spectral ocean](/docs/api-reference/experimental/spectral-ocean-simulation) | Deterministic FFT-based ocean displacement and foam. |
| [Volumetric fire](/docs/api-reference/experimental/volumetric-fire-simulation) | GPU-resident volumetric combustion and rendering. |
| [WebXR](/docs/api-reference/experimental/webxr) | Experimental WebGPU/WebGL session, frame, and camera helpers. |

## Core concepts

Experimental modules follow the same ownership model as the rest of luma.gl: callers own the frame
loop and command submission unless a reference explicitly says otherwise. GPU Core contributors
declare work but do not submit it. Renderer and simulation references state which resources they
own, borrow, cache, or expose.

Use the [shared glossary](/docs/glossary) for resource, ownership, binding, pipeline, pass,
submission, data hazard, indirect work, and GPU residency terminology.

## Limits and compatibility

Experimental APIs may change or be removed without the compatibility guarantees of stable
packages. Many GPU Core and simulation modules require WebGPU; individual references state backend,
feature, capacity, and memory requirements. Treat benchmark results as workload- and adapter-
specific rather than universal performance claims.

## Related modules

- [Choosing a luma.gl API layer](/docs/api-guide)
- [Core API](/docs/api-reference/core)
- [Engine API](/docs/api-reference/engine)
- [Shadertools API](/docs/api-reference/shadertools)
- [Effects API](/docs/api-reference/effects)
