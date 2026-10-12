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
  <DocumentationBadge tone="neutral">Private workspace</DocumentationBadge>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
</DocumentationBadges>

`@luma.gl/scene` is an experimental, private retained-mode rendering layer inspired by ANARI. Instead of building pipelines, binding buffers, and issuing individual draw calls, an application describes a world containing geometry, materials, lights, and cameras. A renderer compiles that description into luma.gl models and renders it through either WebGPU or WebGL 2.

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

The JSON playground supports click-to-inspect selection with the WebGPU ray-tracing renderer.
Applications can use [`frame.pick(x, y)`](/docs/api-reference/scene/anari-rendering#pickx-y)
to retrieve retained surface/instance identities and world-space hit information. Selected
marks also receive an inward outline that follows animation and camera movement.

## Primary-hit GPU channels

After rendering and submitting a ray-traced frame, `frame.captureChannels()` returns
full-output-resolution integer-ID, ray-distance, and world-normal textures, together
with a retained placement identity table. Captures are independent caller-owned
snapshots and must be released with `channels.destroy()`. They perform an additional
primary-ray traversal without CPU readback. See the
[frame channel reference](/docs/api-reference/scene/anari-rendering#capturechannels)
for formats, ownership, and coordinate conventions. Ray distance is not projected
device depth. The experimental `SelectionOutline` overlay consumes exact ID snapshots
for visible selection boundaries. `projectedDepthTexture` and
[`DepthTextureCopy`](/docs/api-reference/experimental/depth-texture-copy) support
depth-tested raster overlays with matching camera and viewport conventions.

## Current limitations

The current package is a focused proof of concept, not a complete ANARI implementation:

- No ANARI C API binding, binary protocol, conformance claim, or dynamic native renderer-library loading; custom runtimes use the local renderer registry.
- Geometry subtypes are limited to triangle meshes, spheres, cylinders, cones, and quads.
- Only one-dimensional data/reference arrays are implemented; array metadata is not interpreted or validated.
- Automatically generated triangle normals assume non-indexed triangle-list positions.
- Group-attached lights are not transformed by their owning instance.
- The `deferred` renderer is WebGPU-only and does not yet include clustered lighting, screen-space effects, bloom, or temporal velocity history.
- The WebGPU-only `raytrace` renderer builds Morton-sorted object/instance TLAS and per-mesh triangle BLAS hierarchies on the GPU and supports scalar metallic/roughness direct lighting, optional bounded diffuse or opaque GGX reflective bounces, opt-in emissive geometry sampling, scalar alpha masks, and guided spatial presentation filtering. Hardware ray tracing, SAH/Karras hierarchy topology, skeletal/morph deformation, material textures, alpha blending/transmission, advanced PBR extensions, transmissive bounces, and advanced temporal denoising are unsupported.
- Visibility, raster picking, volumes, clipping planes, raster shadow maps, and asynchronous frame mapping are not implemented; direct shadow rays are available only in the `raytrace` renderer.
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


### Chart motion and capture

In the JSON playground, choose **Chart Motion** on WebGPU and click an animated mark.
Six raster labels follow retained point instances. The playground copies current ray
projected depth before drawing labels, so other chart marks can occlude their glyphs.
Selection remains attached to the retained placement as it moves. Labels and outlines
are composited after radiance presentation and do not enter temporal history. This
example captures full-resolution hit channels each frame while labels are visible,
adding a primary traversal and 28 bytes per output pixel of snapshot storage.

The **Ray quality** selector is available over the preview, including when the editor
is hidden. **Interactive** enables adaptive resolution and temporal reprojection;
**Still / capture** chooses full resolution, four primary samples per frame, and fixed
quality. Quality changes retain the inspected camera and selection; the disabled
**Scene settings** entry reports custom JSON parameters. A moving scene will not converge as a still scene would. For application-owned
controls, use [`getRayTracingQualityPreset`](/docs/api-reference/experimental/ray-tracing-quality-presets).

For a repeatable baseline capture, start the scene example and run:

```bash
yarn workspace luma.gl-examples-showcase-scene start --host 127.0.0.1 --port 5180
node scripts/playwright/chart-baseline-capture.mjs --seed 17 --frames 8 --output /tmp/chart-ray
node scripts/playwright/chart-baseline-capture.mjs --renderer default --frames 8 --output /tmp/chart-raster
node scripts/playwright/chart-baseline-capture.mjs --motion --frames 8 --output /tmp/chart-motion
```

The harness writes `chart.png` and `metadata.json`, including scene JSON, drawing-buffer
size, renderer settings, seed, frame count, browser version, and an optional `--hardware`
label. `--software-gpu` uses the repository's software GPU launch configuration; Linux
headless presentation requires an X display. Capture uses a fixed viewport, pixel ratio
one, and exactly N submitted scene frames. Motion captures use frame-index time at 60 Hz;
ordinary interactive rendering uses elapsed time. Keep captures on the same backend and
hardware when comparing pixels. Reported elapsed time includes startup and capture;
existing frame telemetry is CPU timing, not GPU timestamps. GPU memory measurement and
hardware convergence baselines remain follow-up work.

### Compare diffuse transport

Choose **Chart Diffuse** in the JSON playground on WebGPU. It retains the baseline marks and
camera, adds emissive materials, and requests `maxBounces: 2` with seed 17. Set `maxBounces`
to `0` in the editor to compare direct-only lighting. Let the stationary scene accumulate
frames; small emissive marks need many samples. Interactive/still quality presets preserve
the bounce budget. This preset uses diffuse transport; the opt-in `pbr` mode below adds
opaque reflection. Glass paths and emissive importance sampling remain unimplemented.

Capture a fixed frame count with:

```bash
node scripts/playwright/chart-baseline-capture.mjs --diffuse --frames 32 --seed 17 --output /tmp/chart-diffuse
```


### Compare opaque material transport

Choose **Chart Materials** to compare matte bars, metallic columns with increasing
roughness, and emissive marks reflected in a glossy floor. `transportMode: 'pbr'`
enables the opaque reflective path; `diffuse` remains the default. The same
`maxBounces` budget and `samplingSeed` control both modes. Use the Transport and
Bounces controls for comparison, or pass `--materials --transport pbr --bounces 3`
to the capture harness. See the [quality reference](/docs/api-reference/experimental/ray-tracing-quality-presets)
for probability weighting, roughness bounds, and remaining material limitations.

### Bounded ray image export

The lower-level experimental scene renderer exposes
[`exportRayTracingImage`](/docs/api-reference/experimental/scene-renderer#tiled-ray-image-export)
for fixed-camera RGBA8 tile export. Tiles share global sample coordinates and
include clipped spatial/history halos, so guided filtering and progressive
clamping agree at tile seams. The API keeps readback bounded to one tile,
preserves the authored exposure, and cleans up on completion or cancellation.
Applications provide full-image camera matrices and their own image encoder.
This export API is separate from JSON playground scene-file export.
