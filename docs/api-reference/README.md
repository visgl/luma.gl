# Overview

luma.gl is packaged and published as a suite of composable npm modules, so that applications can choose what functionality they need.

Use the API reference when you want the class-by-class reference pages for a specific module. If you are looking for conceptual guides or an introduction to how the pieces fit together, start in the [API Guide](/docs/api-guide) and then come back here for the detailed type and method docs.

If you are looking for `Model`, start with [`@luma.gl/engine`][engine]. The `Model` class lives in the engine module and is one of the main entry points for rendering in luma.gl.

| Module                                | Usage       | Description                                                                                     |
| ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| [`@luma.gl/core`][core]               | Required    | The "Abstract" `Device` API (implemented by both the `webgpu` and `webgl` modules).             |
| [`@luma.gl/webgl`][webgl]             | Required \* | `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources         |
| [`@luma.gl/webgpu`][webgpu]           | Required \* | `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources.          |
| [`@luma.gl/engine`][engine]           | Recommended | A set of WebGPU/WebGL independent core 3D engine style classes built on top of `@luma.gl/core`. |
| [`@luma.gl/shadertools`][shadertools] | Recommended | System for modularizing and composing shader code, shader module system,, shader modules.       |
| [`@luma.gl/gltf`][gltf]               | Optional    | glTF scenegraph loading and instantiation etc.                                                  |
| [`@luma.gl/test-utils`][test-utils]   | Optional    | Test setups, in particular support for rendering and comparing images.                          |

\* At least one backend, either WebGL or WebGPU, must be installed to enable GPU resource creation.

## Start Here

- [`@luma.gl/engine`][engine] for `Model`, `AnimationLoop`, scenegraph helpers, and compute-oriented utilities.
- [`@luma.gl/core`][core] for `Device`, buffers, textures, shaders, render passes, and `RenderPipeline`.
- [`@luma.gl/shadertools`][shadertools] for shader modules and shader assembly.
- [`@luma.gl/gltf`][gltf] for glTF scenegraph loading and extensions.
- [`@luma.gl/webgl`][webgl] and [`@luma.gl/webgpu`][webgpu] for backend adapters used by `@luma.gl/core`.

luma.gl also publishes legacy modules that should be avoided in new applications.

| Legacy Module        | Status     | Description      | Replacement                   |
| -------------------- | ---------- | ---------------- | ----------------------------- |
| `@luma.gl/constants` | Deprecated | WebGL constants. | No longer used in luma.gl v9. |

[webgl]: /docs/api-reference/webgl
[webgpu]: /docs/api-reference/webgpu
[core]: /docs/api-reference/core
[shadertools]: /docs/api-reference/shadertools
[gltf]: /docs/api-reference/gltf
[test-utils]: /docs/api-reference/test-utils
[engine]: /docs/api-reference/engine
