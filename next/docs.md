# Introduction

luma.gl is a TypeScript toolkit for high-performance GPU rendering and compute on the web. It provides one application-facing API with pluggable WebGPU and WebGL2 backends, plus higher-level building blocks for models, animation, shader composition, and GPU data processing.

## Explore the documentation[​](#explore-the-documentation "Direct link to Explore the documentation")

Follow a topic based on what you want to build. Start with the higher-level APIs and use the package reference when you need a specific class, method, or option.

| Topic                     | Start here                                                                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Getting Started           | [Install luma.gl and render your first triangle](https://luma.gl/next/docs/getting-started.md)                                                                                                                                                                                    |
| Creating GPU Resources    | [Create a device](https://luma.gl/next/docs/api-guide/gpu/gpu-initialization.md), then work with [buffers](https://luma.gl/next/docs/api-guide/gpu/gpu-buffers.md) and [textures](https://luma.gl/next/docs/api-guide/gpu/gpu-textures.md)                              |
| Computing on the GPU      | [Run GPU computations](https://luma.gl/next/docs/api-guide/gpu/gpgpu.md) and [schedule GPU graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-core/concepts.md)                                                                                                |
| Rendering                 | [Build with the engine](https://luma.gl/next/docs/api-guide/engine.md) or follow the [triangle tutorial](https://luma.gl/next/docs/tutorials/hello-triangle.md)                                                                                                              |
| Materials and Lighting    | [Work with materials](https://luma.gl/next/docs/api-guide/engine/materials.md) and [physically based rendering](https://luma.gl/next/docs/api-guide/engine/features.md)                                                                                                      |
| Writing Shaders           | [Compose and customize shaders](https://luma.gl/next/docs/api-guide/shaders.md)                                                                                                                                                                                                   |
| Debugging and Performance | [Debug GPU applications](https://luma.gl/next/docs/developer-guide/debugging.md), [inspect command graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-core/debugging.md), and [profile execution](https://luma.gl/next/docs/developer-guide/profiling.md) |
| API Reference             | [Look up packages and APIs](https://luma.gl/next/docs/api-reference.md)                                                                                                                                                                                                           |

## Packages[​](#packages "Direct link to Packages")

Start with `@luma.gl/core` and `@luma.gl/engine`, then add the modules your application needs. WebGPU and WebGL2 adapters are included in core and imported through their own entry points.

Browse the [packages](https://luma.gl/next/docs/packages.md) to explore primary packages, smaller packages, and exploratory modules.

## Why luma.gl?[​](#why-lumagl "Direct link to Why luma.gl?")

* **Low Level Access** - luma.gl offers a thin abstraction layer over the underlying graphics API.
* **Portable GPU API** — write against luma.gl resources and select WebGPU, WebGL2, or both at application startup.
* **Composable shaders** — package shader functions, typed inputs, hooks, and injections into reusable modules and plugins.
* **Visualization-scale data** — luma.gl is the rendering foundation for deck.gl and includes dedicated support for GPU tables and Apache Arrow workflows.

## A WebGPU-style API[​](#a-webgpu-style-api "Direct link to A WebGPU-style API")

Core follows WebGPU resource and command concepts while supporting a WebGL 2 backend. See [Design philosophy](https://luma.gl/next/docs/api-guide/background/api-design.md) for the design goals.

## Three Key APIs[​](#three-key-apis "Direct link to Three Key APIs")

### 1. Core API[​](#1-core-api "Direct link to 1. Core API")

The Core API exposes low level GPU resources such as devices, buffers, textures, shaders, bindings, pipelines, and render or compute passes. `@luma.gl/core/webgpu` and `@luma.gl/core/webgl` provide the concrete backends.

### 2. Engine API[​](#2-engine-api "Direct link to 2. Engine API")

The Engine API provides `Model`, `AnimationLoop`, geometry, scenegraph, dynamic texture, and GPU transformation helpers. It is the recommended starting point for applications.

### 3. Shader API[​](#3-shader-api "Direct link to 3. Shader API")

Shaders assembles WGSL and GLSL from reusable shader modules and application-defined hooks. It is used by luma.gl, deck.gl, and custom renderers.

## Contributors and credits[​](#contributors-and-credits "Direct link to Contributors and credits")

See [Attributions and Credits](https://luma.gl/next/docs/credits.md) for upstream implementation credits, research citations, and example asset notices.

## Next steps[​](#next-steps "Direct link to Next steps")

Ready for your first `Hello Triangle`? Proceed to [Getting Started](https://luma.gl/next/docs/getting-started.md).
