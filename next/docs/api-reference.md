# Overview

Explore the [packages](https://luma.gl/next/docs/packages.md) for a visual overview of primary packages, smaller packages, and exploratory modules.

luma.gl provides published, composable npm modules with stable and experimental APIs, alongside optional Arrow adapters and private deck.gl adapters under active development. Applications can choose the rendering, compute, and visualization functionality they need while checking the maturity of each package.

Use the API reference when you want the class-by-class reference pages for a specific module. If you are looking for conceptual guides or an introduction to how the pieces fit together, start in the [API Guide](https://luma.gl/next/docs/api-guide.md) and then come back here for the detailed type and method docs.

If you are looking for `Model`, start with [`@luma.gl/engine`](https://luma.gl/next/docs/api-reference/engine.md). The `Model` class lives in the engine module and is one of the main entry points for rendering in luma.gl.

| Module                                                                                                    | Usage                   | Description                                                                                     |
| --------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| [`@luma.gl/core`](https://luma.gl/next/docs/api-reference/core.md)                                   | Required                | The portable `Device` API, shader types, and WebGPU and WebGL2 implementations.                 |
| [`@luma.gl/core/webgl`](https://luma.gl/next/docs/api-reference/webgl.md)                            | Core subpath            | `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources.          |
| [`@luma.gl/core/webgpu`](https://luma.gl/next/docs/api-reference/webgpu.md)                          | Core subpath            | `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources.        |
| [`@luma.gl/engine`](https://luma.gl/next/docs/api-reference/engine.md)                               | Recommended             | A set of WebGPU/WebGL independent core 3D engine style classes built on top of `@luma.gl/core`. |
| [`@luma.gl/anari`](https://luma.gl/next/docs/api-reference/anari.md)                                 | Experimental            | ANARI-inspired retained scene objects, instanced rendering, lights, materials, and HDR.         |
| [`@luma.gl/shaders`](https://luma.gl/next/docs/api-reference/shaders.md)                             | Recommended             | Reusable shader modules, portable shader assembly, and application-defined shader hooks.        |
| [`@luma.gl/shaders/glsl`](https://luma.gl/next/docs/api-reference/shaders.md)                        | Optional                | GLSL assembler and assembly helpers.                                                            |
| [`@luma.gl/shaders/wgsl`](https://luma.gl/next/docs/api-reference/shaders.md)                        | Optional                | WGSL assembler, assembly helpers and interface scanning.                                        |
| [`@luma.gl/slang`](https://luma.gl/next/docs/api-reference/slang.md)                                 | Experimental (v10)      | Optional TypeScript transpilation of a documented Slang shader subset to GLSL and WGSL.         |
| [`@luma.gl/engine/effects`](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md)            | Optional                | Composable post-processing effects, screen-space lighting, and reusable shader-pass pipelines.  |
| [`@luma.gl/graph/gpu-simple-graph`](https://luma.gl/next/docs/api-reference/graph/gpu-evaluation.md) | Optional                | Portable GPU evaluation.                                                                        |
| [`@luma.gl/graph`](https://luma.gl/next/docs/api-reference/graph.md)                                 | Experimental (v10)      | GPU execution graphs, programs, and graph-based processing through explicit subpaths.           |
| [`@luma.gl/graph/arrow`](https://luma.gl/next/docs/api-reference/arrow.md)                           | Optional / Experimental | Arrow vector and table conversion, upload, readback, analytics and geospatial preparation.      |
| [`@luma.gl/engine/arrow`](https://luma.gl/next/docs/api-reference/arrow.md)                          | Optional / Experimental | Arrow geometry, rendering, text and splat adapters.                                             |
| [`@luma.gl/engine/text`](https://luma.gl/next/docs/api-reference/engine/text.md)                     | Experimental            | `TextRenderer` facade and caller-owned GPU text data.                                           |
| [`@luma.gl/engine/splats`](https://luma.gl/next/docs/api-reference/splats.md)                        | Experimental            | Gaussian splat rendering and caller-owned prepared GPU splat data.                              |
| [`@luma.gl/engine/gltf`](https://luma.gl/next/docs/api-reference/gltf.md)                            | Optional                | Standards-first glTF assets, physical materials, character animation, and lossless interchange. |
| [`@luma.gl/core/test-utils`](https://luma.gl/next/docs/api-reference/test-utils.md)                  | Optional                | Test devices, null backend, and resource assertions.                                            |

Select at least one adapter from the core backend subpaths when creating a device.

## Start Here[​](#start-here "Direct link to Start Here")

* [`@luma.gl/engine`](https://luma.gl/next/docs/api-reference/engine.md) for `Model`, `AnimationLoop`, scenegraph helpers, and compute-oriented utilities.
* [`@luma.gl/anari`](https://luma.gl/next/docs/api-reference/anari.md) for experimental ANARI-inspired declarative scenes, retained rendering, and instancing.
* [`@luma.gl/core`](https://luma.gl/next/docs/api-reference/core.md) for `Device`, buffers, textures, shaders, render passes, and `RenderPipeline`.
* [`@luma.gl/shaders`](https://luma.gl/next/docs/api-reference/shaders.md) for shader modules and shader assembly.
* [`@luma.gl/slang`](https://luma.gl/next/docs/api-reference/slang.md) for experimental Slang shader authoring on WebGL 2 and WebGPU, available from v10.
* [`@luma.gl/engine/effects`](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) for reusable image processing, bloom, and supported screen-space effects.
* [`@luma.gl/graph/gpu-simple-graph`](https://luma.gl/next/docs/api-reference/graph/gpu-evaluation.md) for portable GPU evaluation; `@luma.gl/graph/gpu-data` for shared GPU data primitives.
* [`@luma.gl/graph`](https://luma.gl/next/docs/api-reference/graph.md) for `GPUCommandGraph`, `GPUGraph`, GPU tables, and graph-based processing.
* [GPGPU data](https://luma.gl/next/docs/api-reference/graph/gpu-data.md) for primitive `GPUData`/`GPUVector` APIs, and [Experimental GPU Tables](https://luma.gl/next/docs/api-reference/experimental/gpu-tables.md) for `GPURecordBatch`/`GPUTable` APIs.
* [`@luma.gl/engine/text`](https://luma.gl/next/docs/api-reference/engine/text.md) for `TextRenderer` and GPU text data; use [`@luma.gl/engine/arrow`](https://luma.gl/next/docs/api-reference/arrow.md) for Arrow text conversion.
* [`@luma.gl/engine/splats`](https://luma.gl/next/docs/api-reference/splats.md) for experimental Gaussian splat rendering and caller-owned prepared GPU data.
* [Engine experimental utilities](https://luma.gl/next/docs/api-reference/engine/experimental.md) for controls, material plugins, textures, and WebXR helpers.
* [`@luma.gl/graph/experimental`](https://luma.gl/next/docs/api-reference/experimental.md) for path/polygon models and flow/fluid simulations.
* [`@luma.gl/engine/gltf`](https://luma.gl/next/docs/api-reference/gltf.md) for standards-first glTF assets, physical materials, character animation, native extensions, and source-faithful `.gltf`/`.glb` interchange.
* [`@luma.gl/core/webgl`](https://luma.gl/next/docs/api-reference/webgl.md) and [`@luma.gl/core/webgpu`](https://luma.gl/next/docs/api-reference/webgpu.md) for backend adapters used by `@luma.gl/core`.
* [`@luma.gl/core/webgl-constants`](https://luma.gl/next/docs/api-reference/webgl/constants.md) when you need raw numeric WebGL enums.
