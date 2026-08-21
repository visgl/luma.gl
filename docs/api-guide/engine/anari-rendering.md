---
title: Declarative rendering with ANARI
description: Choose and learn luma.gl's experimental retained ANARI scene workflow and renderers.
---

import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {AnariGuideDocsTabs} from '@site/src/components/docs/anari-guide-docs-tabs';

# Declarative rendering with ANARI

<AnariGuideDocsTabs active="overview" />

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="neutral">Published package</DocumentationBadge>
  <DocumentationBadge tone="version">From v9.4</DocumentationBadge>
</DocumentationBadges>

`@luma.gl/scene` is an experimental retained-mode rendering layer inspired by ANARI. Instead of building pipelines, binding buffers, and issuing individual draw calls, an application describes a world containing geometry, materials, lights, and cameras. A renderer compiles that description into luma.gl models and renders it through either WebGPU or WebGL 2.

This guide explains the complete application workflow, object lifecycle, animation, HDR configuration, batching strategy, and current proof-of-concept limitations. For exact signatures and parameter defaults, see the [`@luma.gl/scene` API reference](/docs/api-reference/scene).

For a function-by-function comparison with the Khronos ANARI 1.1 C API and a conceptual THREE.js migration table, see [ANARI C API and THREE.js Mapping](/docs/api-reference/scene/anari-api-mapping).

:::caution
This package is ANARI-inspired, not a JavaScript binding for the ANARI C API. It implements a useful subset of ANARI concepts but does not claim Khronos conformance.
:::

## Choose a workflow

| Goal | Continue with |
| --- | --- |
| Create, commit, render, resize, and animate a retained scene | [Build an ANARI scene](/docs/api-guide/engine/anari-first-scene) |
| Understand forward, deferred, and graph-based ray-tracing renderers | [Renderer architecture](/docs/api-guide/engine/anari-architecture) |
| Validate, author, generate, animate, and import scene descriptions | [JSON scenes](/docs/api-guide/engine/anari-json-scenes) |
| Look up exact object, schema, and renderer contracts | [ANARI API reference](/docs/api-reference/scene) |

## Run the showcase

From the repository root:

```bash
yarn workspace luma.gl-examples-showcase-scene start
```

The showcase provides three scenes:

- **Chromatic Atlas**: repeated metallic and iridescent surfaces with animated lighting.
- **Crystal Cathedral**: architectural geometry, emissive accents, and atmospheric lighting.
- **Celestial Engine**: heavily instanced structures and animated orbiting emitters.

Interactive controls switch scenes, select forward/deferred/ray-tracing/debug renderers, toggle
bloom, orbit the camera, and show retained instance and draw-call counts. Select **JSON LAB** to
open the live JSON scene playground. Add `?backend=webgl` to either page to force the WebGL 2 path;
the deferred and ray-tracing controls are disabled when WebGPU is unavailable.

The showcase implementation lives in `examples/showcase/scene/app.ts`; the playground lives in
`examples/showcase/scene/playground.ts`, `playground-scene.ts`, and `playground-presets.ts`.
Package-level tests demonstrate staged parameters, animated lights, shared-surface batching,
zero-copy arrays, and rendering on available graphics backends.

## Current limitations

The current package is a focused proof of concept, not a complete ANARI implementation:

- No ANARI C API binding, binary protocol, conformance claim, or dynamic native renderer-library loading; custom runtimes use the local renderer registry.
- Geometry subtypes are limited to triangle meshes, spheres, cylinders, cones, and quads.
- Only one-dimensional data/reference arrays are implemented; array metadata is not interpreted or validated.
- Automatically generated triangle normals assume non-indexed triangle-list positions.
- Group-attached lights are not transformed by their owning instance.
- The `deferred` renderer is WebGPU-only and does not yet include clustered lighting, screen-space effects, bloom, or temporal velocity history.
- The WebGPU-only `raytrace` renderer builds Morton-sorted object/instance TLAS and per-mesh triangle BLAS hierarchies on the GPU and supports scalar metallic/roughness direct lighting; hardware ray tracing, SAH/Karras hierarchy topology, skeletal/morph deformation, material textures, alpha/transmission, advanced PBR extensions, indirect bounces, and denoising are unsupported.
- Visibility, picking, volumes, clipping planes, raster shadow maps, and asynchronous frame mapping are not implemented; direct shadow rays are available only in the `raytrace` renderer.
- Experimental OpenUSD import does not support binary USDC crates or complete USD composition semantics.
- Imported glTF skin attributes require an application-supplied retained joint palette; automatic
  skin-palette binding in the showcase importer and animated glTF export are not yet implemented.
- Scene-color transmission samples an opaque-background capture and does not recursively refract
  multiple overlapping transmissive surfaces.
- WebGL 2 preserves the same scene API but does not support the WebGPU HDR presentation path.
- The ANARI device releases its renderer resources but does not destroy the underlying shared luma.gl graphics device.

For exact supported parameters and defaults, continue to the [`@luma.gl/scene` API reference](/docs/api-reference/scene).

## Related pages

- [Engine programming](/docs/api-guide/engine)
- [How luma.gl fits together](/docs/api-guide/luma-layers)
- [Experimental renderers](/docs/api-reference/experimental)
