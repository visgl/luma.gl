# Overview

luma.gl combines published, composable npm modules with private experimental packages under active development. Applications can choose the rendering, compute, and visualization functionality they need while checking the maturity of each package.

Use the API reference when you want the class-by-class reference pages for a specific module. If you are looking for conceptual guides or an introduction to how the pieces fit together, start in the [API Guide](https://luma.gl/next/docs/api-guide.md) and then come back here for the detailed type and method docs.

If you are looking for `Model`, start with [`@luma.gl/engine`](https://luma.gl/next/docs/api-reference/engine.md). The `Model` class lives in the engine module and is one of the main entry points for rendering in luma.gl.

| Module                                                                                  | Usage                  | Description                                                                                     |
| --------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| [`@luma.gl/core`](https://luma.gl/next/docs/api-reference/core.md)                 | Required               | The "Abstract" `Device` API (implemented by both the `webgpu` and `webgl` modules).             |
| [`@luma.gl/webgl`](https://luma.gl/next/docs/api-reference/webgl.md)               | Required \*            | `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources.          |
| [`@luma.gl/webgpu`](https://luma.gl/next/docs/api-reference/webgpu.md)             | Required \*            | `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources.        |
| [`@luma.gl/engine`](https://luma.gl/next/docs/api-reference/engine.md)             | Recommended            | A set of WebGPU/WebGL independent core 3D engine style classes built on top of `@luma.gl/core`. |
| [`@luma.gl/anari`](https://luma.gl/next/docs/api-reference/anari.md)               | Experimental / Private | ANARI-inspired retained scene objects, instanced rendering, lights, materials, and HDR.         |
| [`@luma.gl/shadertools`](https://luma.gl/next/docs/api-reference/shadertools.md)   | Recommended            | Reusable shader modules, portable shader assembly, and application-defined shader hooks.        |
| [`@luma.gl/effects`](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) | Optional               | Composable post-processing effects, screen-space lighting, and reusable shader-pass pipelines.  |
| [`@luma.gl/gpgpu`](https://luma.gl/next/docs/api-reference/gpgpu.md)               | Optional               | Portable GPU data evaluation, vector operations, and backend-aware compute workflows.           |
| [`@luma.gl/tables`](https://luma.gl/next/docs/api-reference/tables.md)             | Optional               | GPU-resident table primitives, batching, table-backed rendering, and table-oriented compute.    |
| [`@luma.gl/arrow`](https://luma.gl/next/docs/api-reference/arrow.md)               | Experimental / Private | Apache Arrow adapters for GPU layouts and GPU table objects from Arrow data.                    |
| [`@luma.gl/text`](https://luma.gl/next/docs/api-reference/text.md)                 | Experimental / Private | `TextRenderer` facade and caller-owned GPU text data.                                           |
| [`@luma.gl/splats`](https://luma.gl/next/docs/api-reference/splats.md)             | Experimental / Private | Gaussian splat rendering and caller-owned prepared GPU splat data.                              |
| [`@luma.gl/experimental`](https://luma.gl/next/docs/api-reference/experimental.md) | Experimental / Private | Experimental v10 APIs, including WebGPU/WebGL WebXR and WebGL raw camera helpers.               |
| [`@luma.gl/gltf`](https://luma.gl/next/docs/api-reference/gltf.md)                 | Optional               | Standards-first glTF assets, physical materials, character animation, and lossless interchange. |
| [`@luma.gl/test-utils`](https://luma.gl/next/docs/api-reference/test-utils.md)     | Optional               | Test setups, in particular support for rendering and comparing images.                          |

\* At least one backend, either WebGL or WebGPU, must be installed to enable GPU resource creation.

## Start Here[​](#start-here "Direct link to Start Here")

* [`@luma.gl/engine`](https://luma.gl/next/docs/api-reference/engine.md) for `Model`, `AnimationLoop`, scenegraph helpers, and compute-oriented utilities.
* [`@luma.gl/anari`](https://luma.gl/next/docs/api-reference/anari.md) for experimental, private ANARI-inspired declarative scenes, retained rendering, and instancing.
* [`@luma.gl/core`](https://luma.gl/next/docs/api-reference/core.md) for `Device`, buffers, textures, shaders, render passes, and `RenderPipeline`.
* [`@luma.gl/shadertools`](https://luma.gl/next/docs/api-reference/shadertools.md) for shader modules and shader assembly.
* [`@luma.gl/effects`](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) for reusable image processing, bloom, and supported screen-space effects.
* [`@luma.gl/gpgpu`](https://luma.gl/next/docs/api-reference/gpgpu.md) for portable GPU data evaluation and vector-oriented computation.
* [`@luma.gl/tables`](https://luma.gl/next/docs/api-reference/tables.md) for `GPUData`, `GPUVector`, `GPURecordBatch`, and `GPUTable`.
* [`@luma.gl/text`](https://luma.gl/next/docs/api-reference/text.md) for `TextRenderer` and GPU text data; use [`@luma.gl/arrow`](https://luma.gl/next/docs/api-reference/arrow.md) for Arrow conversion.
* [`@luma.gl/splats`](https://luma.gl/next/docs/api-reference/splats.md) for experimental Gaussian splat rendering and caller-owned prepared GPU data.
* [`@luma.gl/experimental`](https://luma.gl/next/docs/api-reference/experimental.md) for v10 work-in-progress APIs, including experimental WebXR frame, view, and raw camera helpers.
* [`@luma.gl/gltf`](https://luma.gl/next/docs/api-reference/gltf.md) for standards-first glTF assets, physical materials, character animation, native extensions, and source-faithful `.gltf`/`.glb` interchange.
* [`@luma.gl/webgl`](https://luma.gl/next/docs/api-reference/webgl.md) and [`@luma.gl/webgpu`](https://luma.gl/next/docs/api-reference/webgpu.md) for backend adapters used by `@luma.gl/core`.
* [`@luma.gl/webgl/constants`](https://luma.gl/next/docs/api-reference/webgl/constants.md) when you need raw numeric WebGL enums.
