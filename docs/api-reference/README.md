---
title: API reference
description: Find the curated and generated API references for every stable and experimental luma.gl package.
---

# Overview

Explore the [packages](/docs/packages) for a visual overview of primary packages, smaller packages, and exploratory modules.

luma.gl provides published, composable npm modules with stable and experimental APIs, alongside
private Arrow and deck.gl adapters under active development. Applications can choose the rendering,
compute, and visualization functionality they need while checking the maturity of each package.

Use the API reference when you want the class-by-class reference pages for a specific module. If you are looking for conceptual guides or an introduction to how the pieces fit together, start in the [API Guide](/docs/api-guide) and then come back here for the detailed type and method docs.

If you are looking for `Model`, start with [`@luma.gl/engine`][engine]. The `Model` class lives in the engine module and is one of the main entry points for rendering in luma.gl.

| Module                                | Usage       | Description                                                                                     |
| ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| [`@luma.gl/core`][core] | Required | The portable `Device` API, shader types, and WebGPU and WebGL2 implementations. |
| [`@luma.gl/core/webgl`][webgl] | Core subpath | `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources. |
| [`@luma.gl/core/webgpu`][webgpu] | Core subpath | `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources. |
| [`@luma.gl/engine`][engine] | Recommended | A set of WebGPU/WebGL independent core 3D engine style classes built on top of `@luma.gl/core`. |
| [`@luma.gl/anari`][anari] | Experimental | ANARI-inspired retained scene objects, instanced rendering, lights, materials, and HDR. |
| [`@luma.gl/shadertools`][shadertools] | Recommended | Reusable shader modules, portable shader assembly, and application-defined shader hooks. |
| [`@luma.gl/slang`][slang] | Experimental (v10) | Optional TypeScript transpilation of a documented Slang shader subset to GLSL and WGSL. |
| [`@luma.gl/engine/effects`][engine/effects] | Optional | Composable post-processing effects, screen-space lighting, and reusable shader-pass pipelines. |
| [`@luma.gl/gpgpu`][gpgpu] | Optional | Portable GPU evaluation and GPU data primitives. |
| [`@luma.gl/graph`][graph] | Experimental (v10) | GPU execution graphs, programs, and graph-based processing through explicit subpaths. |
| [`@luma.gl/arrow`][arrow] | Experimental / Private | Apache Arrow adapters for GPU layouts and GPU table objects from Arrow data. |
| [`@luma.gl/engine/text`][text] | Experimental | `TextRenderer` facade and caller-owned GPU text data. |
| [`@luma.gl/engine/splats`][splats] | Experimental | Gaussian splat rendering and caller-owned prepared GPU splat data. |
| [`@luma.gl/engine/gltf`][gltf] | Optional | Standards-first glTF assets, physical materials, character animation, and lossless interchange. |
| [`@luma.gl/core/test-utils`][test-utils] | Optional | Test devices, null backend, and resource assertions. |

Select at least one adapter from the core backend subpaths when creating a device.

## Start Here

- [`@luma.gl/engine`][engine] for `Model`, `AnimationLoop`, scenegraph helpers, and compute-oriented utilities.
- [`@luma.gl/anari`][anari] for experimental ANARI-inspired declarative scenes, retained rendering, and instancing.
- [`@luma.gl/core`][core] for `Device`, buffers, textures, shaders, render passes, and `RenderPipeline`.
- [`@luma.gl/shadertools`][shadertools] for shader modules and shader assembly.
- [`@luma.gl/slang`][slang] for experimental Slang shader authoring on WebGL 2 and WebGPU, available from v10.
- [`@luma.gl/engine/effects`][engine/effects] for reusable image processing, bloom, and supported screen-space effects.
- [`@luma.gl/gpgpu`][gpgpu] for portable GPU evaluation and GPU data primitives.
- [`@luma.gl/graph`][graph] for `GPUCommandGraph`, `GPUGraph`, GPU tables, and graph-based processing.
- [GPGPU data][gpu-data] for primitive `GPUData`/`GPUVector` APIs, and [Experimental GPU Tables][gpu-tables] for `GPURecordBatch`/`GPUTable` APIs.
- [`@luma.gl/engine/text`][text] for `TextRenderer` and GPU text data; use [`@luma.gl/arrow`][arrow] for Arrow conversion.
- [`@luma.gl/engine/splats`][splats] for experimental Gaussian splat rendering and caller-owned prepared GPU data.
- [Engine experimental utilities](/docs/api-reference/engine/experimental) for controls, material plugins, textures, and WebXR helpers.
- [`@luma.gl/graph/experimental`](/docs/api-reference/experimental) for path/polygon models and flow/fluid simulations.
- [`@luma.gl/engine/gltf`][gltf] for standards-first glTF assets, physical materials, character animation, native extensions, and source-faithful `.gltf`/`.glb` interchange.
- [`@luma.gl/core/webgl`][webgl] and [`@luma.gl/core/webgpu`][webgpu] for backend adapters used by `@luma.gl/core`.
- [`@luma.gl/core/webgl-constants`](/docs/api-reference/webgl/constants) when you need raw numeric WebGL enums.

[webgl]: /docs/api-reference/webgl
[webgpu]: /docs/api-reference/webgpu
[core]: /docs/api-reference/core
[anari]: /docs/api-reference/scene
[shadertools]: /docs/api-reference/shadertools
[slang]: /docs/api-reference/slang
[engine/effects]: /docs/api-guide/shaders/shader-passes
[gpgpu]: /docs/api-reference/gpgpu
[graph]: /docs/api-reference/graph
[gpu-data]: /docs/api-reference/gpgpu/gpu-data
[gpu-tables]: /docs/api-reference/experimental/gpu-tables
[arrow]: /docs/api-reference/arrow
[text]: /docs/api-reference/engine/text
[splats]: /docs/api-reference/splats
[experimental]: /docs/api-reference/experimental
[gltf]: /docs/api-reference/gltf
[test-utils]: /docs/api-reference/test-utils
[engine]: /docs/api-reference/engine
