# Overview

luma.gl is packaged and published as a suite of composable npm modules, so that applications can choose what functionality they need.

| Module                                  | Usage       | Description                                                                                          |
| --------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| [`@luma.gl/core`][api]                   | Required    | The "Abstract" `Device` API (implemented by both the `webgpu` and `webgl` modules).                  |
| [`@luma.gl/webgl`][webgl]               | Required \* | `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources              |
| [`@luma.gl/webgpu`][webgpu]             | Required \* | `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources.               |
| [`@luma.gl/core`][core]                 | Recommended | A set of WebGPU/WebGL independent core 3D engine style classes built on top of `@luma.gl/core`.       |
| [`@luma.gl/shadertools`][shadertools]   | Recommended | System for modularizing and composing shader code, shader module system, transpiler, shader modules. |
| [`@luma.gl/experimental`][experimental] | Optional    | Contains Scenegraph, glTF loader, GPU algorithms, VR classes etc.                                    |
| [`@luma.gl/test-utils`][test-utils]     | Optional    | Test setups, in particular support for rendering and comparing images.                               |
| [`@luma.gl/debug`][debug]               | Optional    | Tooling to aid in WebGL debugging                                                                    |

\* At least one backend, either WebGL or WebGPU, must be installed to enable GPU resource creation.

luma.gl also includes some legacy modules that should be avoided in new applications.

| Legacy Module                           | Status     | Description                                                                     | Replacement                          |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| [`@luma.gl/webgl-legacy`][webgl-legacy] | Deprecated | The deprecated luma.gl v8 API can now be imported from `@luma.gl/webgl-legacy`. |
| [`@luma.gl/constants`][constants]       | Deprecated | WebGL constants.                                                                | No longer used in luma.gl v9.        |
| [`@luma.gl/engine`][engine]             | Deprecated | A set of core classes that are independent from their engine                    | Use `@luma.gl/core`.                 |
| [`@luma.gl/gltools`][webgl-legacy]      | Removed    | Legacy WebGL Context API from luma.gl v8                                        | part of `Device` and `CanvasContext` |

[api]: /docs/api-reference/api
[webgl]: /docs/api-reference/webgl
[webgpu]: /docs/api-reference/webgpu
[core]: /docs/api-reference/core
[shadertools]: /docs/api-reference/shadertools
[experimental]: /docs/api-reference/experimental
[test-utils]: /docs/api-reference/test-utils
[debug]: /docs/api-reference/debug

[engine]: /docs/api-reference/engine
[webgl-legacy]: /docs/api-reference-v8/webgl-legacy
[constants]: /docs/api-reference-v8/constants
