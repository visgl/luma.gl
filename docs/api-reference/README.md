---
title: API reference
description: Find the curated and generated API references for every stable and experimental luma.gl package.
---

# Overview

luma.gl combines published, composable npm modules with private experimental packages under active
development. Applications can choose the rendering, compute, and visualization functionality they
need while checking the maturity of each package.

Use the API reference when you want the class-by-class reference pages for a specific module. If you are looking for conceptual guides or an introduction to how the pieces fit together, start in the [API Guide](/docs/api-guide) and then come back here for the detailed type and method docs.

If you are looking for `Model`, start with [`@luma.gl/engine`][engine]. The `Model` class lives in the engine module and is one of the main entry points for rendering in luma.gl.

| Module                                | Usage       | Description                                                                                     |
| ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| [`@luma.gl/core`][core] | Required | The "Abstract" `Device` API (implemented by both the `webgpu` and `webgl` modules). |
| [`@luma.gl/webgl`][webgl] | Required \* | `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources. |
| [`@luma.gl/webgpu`][webgpu] | Required \* | `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources. |
| [`@luma.gl/engine`][engine] | Recommended | A set of WebGPU/WebGL independent core 3D engine style classes built on top of `@luma.gl/core`. |
| [`@luma.gl/scene`][anari] | Experimental / Private | ANARI-inspired retained scene objects, instanced rendering, lights, materials, and HDR. |
| [`@luma.gl/shadertools`][shadertools] | Recommended | Reusable shader modules, portable shader assembly, and application-defined shader hooks. |
| [`@luma.gl/effects`][effects] | Optional | Composable post-processing effects, screen-space lighting, and reusable shader-pass pipelines. |
| [`@luma.gl/gpgpu`][gpgpu] | Optional | Portable GPU evaluation plus experimental `gpu-data`, `gpu-core`, and `gpu-graph` subpaths. |
| [`@luma.gl/arrow`][arrow] | Experimental / Private | Apache Arrow adapters for GPU layouts and GPU table objects from Arrow data. |
| [`@luma.gl/text`][text] | Experimental / Private | `TextRenderer` facade and caller-owned GPU text data. |
| [`@luma.gl/splats`][splats] | Experimental / Private | Gaussian splat rendering and caller-owned prepared GPU splat data. |
| [`@luma.gl/experimental`][experimental] | Experimental / Private | Incubating APIs, including `gpu-tables`, rendering `models`, WebXR, and GPU analytics. |
| [`@luma.gl/gltf`][gltf] | Optional | Standards-first glTF assets, physical materials, character animation, and lossless interchange. |
| [`@luma.gl/test-utils`][test-utils] | Optional | Test setups, in particular support for rendering and comparing images. |

\* At least one backend, either WebGL or WebGPU, must be installed to enable GPU resource creation.

## Start Here

- [`@luma.gl/engine`][engine] for `Model`, `AnimationLoop`, scenegraph helpers, and compute-oriented utilities.
- [`@luma.gl/scene`][anari] for experimental, private ANARI-inspired declarative scenes, retained rendering, and instancing.
- [`@luma.gl/core`][core] for `Device`, buffers, textures, shaders, render passes, and `RenderPipeline`.
- [`@luma.gl/shadertools`][shadertools] for shader modules and shader assembly.
- [`@luma.gl/effects`][effects] for reusable image processing, bloom, and supported screen-space effects.
- [`@luma.gl/gpgpu`][gpgpu] for portable GPU evaluation, plus its experimental `gpu-data`, `gpu-core`, and `gpu-graph` subpaths.
- [GPGPU data][gpu-data] for primitive `GPUData`/`GPUVector` APIs, and [Experimental GPU Tables][gpu-tables] for private `GPURecordBatch`/`GPUTable` APIs.
- [`@luma.gl/text`][text] for `TextRenderer` and GPU text data; use [`@luma.gl/arrow`][arrow] for Arrow conversion.
- [`@luma.gl/splats`][splats] for experimental Gaussian splat rendering and caller-owned prepared GPU data.
- [`@luma.gl/experimental`][experimental] for incubating v10 APIs, including experimental WebXR frame, view, and raw camera helpers.
- [`@luma.gl/gltf`][gltf] for standards-first glTF assets, physical materials, character animation, native extensions, and source-faithful `.gltf`/`.glb` interchange.
- [`@luma.gl/webgl`][webgl] and [`@luma.gl/webgpu`][webgpu] for backend adapters used by `@luma.gl/core`.
- [`@luma.gl/webgl/constants`](/docs/api-reference/webgl/constants) when you need raw numeric WebGL enums.

[webgl]: /docs/api-reference/webgl
[webgpu]: /docs/api-reference/webgpu
[core]: /docs/api-reference/core
[anari]: /docs/api-reference/scene
[shadertools]: /docs/api-reference/shadertools
[effects]: /docs/api-guide/shaders/shader-passes
[gpgpu]: /docs/api-reference/gpgpu
[gpu-data]: /docs/api-reference/gpgpu/gpu-data
[gpu-tables]: /docs/api-reference/experimental/gpu-tables
[arrow]: /docs/api-reference/arrow
[text]: /docs/api-reference/text
[splats]: /docs/api-reference/splats
[experimental]: /docs/api-reference/experimental
[gltf]: /docs/api-reference/gltf
[test-utils]: /docs/api-reference/test-utils
[engine]: /docs/api-reference/engine
