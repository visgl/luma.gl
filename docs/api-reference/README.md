# Overview

luma.gl is packaged and published as a suite of composable npm modules, so that applications can choose what functionality they need.

| Module                                | Usage       | Description                                                                                          |
| ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| [`@luma.gl/core`][core]               | Required    | The "Abstract" `Device` API (implemented by both the `webgpu` and `webgl` modules).                  |
| [`@luma.gl/webgl`][webgl]             | Required \* | `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources              |
| [`@luma.gl/webgpu`][webgpu]           | Required \* | `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources.               |
| [`@luma.gl/engine`][engine]           | Recommended | A set of WebGPU/WebGL independent core 3D engine style classes built on top of `@luma.gl/core`.      |
| [`@luma.gl/shadertools`][shadertools] | Recommended | System for modularizing and composing shader code, shader module system, transpiler, shader modules. |
| [`@luma.gl/gltf`][gltf]               | Optional    | glTF scenegraph loading and instantiation etc.                                                       |
| [`@luma.gl/test-utils`][test-utils]   | Optional    | Test setups, in particular support for rendering and comparing images.                               |

\* At least one backend, either WebGL or WebGPU, must be installed to enable GPU resource creation.

luma.gl also publishes a legacy moduls that should be avoided in new applications.

| Legacy Module                     | Status     | Description      | Replacement                   |
| --------------------------------- | ---------- | ---------------- | ----------------------------- |
| [`@luma.gl/constants`][constants] | Deprecated | WebGL constants. | No longer used in luma.gl v9. |

[webgl]: /docs/api-reference/webgl
[webgpu]: /docs/api-reference/webgpu
[core]: /docs/api-reference/core
[shadertools]: /docs/api-reference/shadertools
[gltf]: /docs/api-reference/gltf
[test-utils]: /docs/api-reference/test-utils
[engine]: /docs/api-reference/engine
[constants]: /docs/api-reference-v8/constants
