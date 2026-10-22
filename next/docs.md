# Introduction

luma.gl is a TypeScript toolkit for high-performance GPU rendering and compute on the web. It provides one application-facing API with pluggable WebGPU and WebGL2 backends, plus higher-level building blocks for models, animation, shader composition, and GPU data processing.

## Modules[​](#modules "Direct link to Modules")

Start with `@luma.gl/core` and `@luma.gl/engine`, then add the modules your application needs. WebGPU and WebGL2 adapters are included in core and imported through their own entry points.

* [![](/next/images/examples/tutorials/hello-cube.jpg)](https://luma.gl/next/docs/api-reference/core.md)
  ### [@luma.gl/<!-- -->core](https://luma.gl/next/docs/api-reference/core.md)
  [Portable GPU resources, shader types, and WebGPU and WebGL2 backends.](https://luma.gl/next/docs/api-reference/core.md)

  [API reference →](https://luma.gl/next/docs/api-reference/core.md)
* [![](/next/images/examples/showcase/instancing.jpg)](https://luma.gl/next/docs/api-reference/engine.md)
  ### [@luma.gl/<!-- -->engine](https://luma.gl/next/docs/api-reference/engine.md)
  [Models, geometry, animation, picking, and rendering helpers.](https://luma.gl/next/docs/api-reference/engine.md)

  [API reference →](https://luma.gl/next/docs/api-reference/engine.md)
* [![](/next/images/examples/tutorials/shader-modules.jpg)](https://luma.gl/next/docs/api-reference/shadertools.md)
  ### [@luma.gl/<!-- -->shadertools](https://luma.gl/next/docs/api-reference/shadertools.md)
  [Compose WGSL and GLSL with reusable shader modules and hooks.](https://luma.gl/next/docs/api-reference/shadertools.md)

  [API reference →](https://luma.gl/next/docs/api-reference/shadertools.md)
* [![](/next/images/examples/showcase/postprocessing.jpg)](https://luma.gl/next/docs/api-reference/effects.md)
  ### [@luma.gl/<!-- -->effects](https://luma.gl/next/docs/api-reference/effects.md)
  [Build post-processing pipelines with composable image and lighting effects.](https://luma.gl/next/docs/api-reference/effects.md)

  [API reference →](https://luma.gl/next/docs/api-reference/effects.md)
* [![](/next/images/examples/experimental/gpu-parquet-constellation.jpg)](https://luma.gl/next/docs/api-reference/gpgpu.md)
  ### [@luma.gl/<!-- -->gpgpu](https://luma.gl/next/docs/api-reference/gpgpu.md)
  [Connect compute operations, GPU data, and rendering without CPU readback.](https://luma.gl/next/docs/api-reference/gpgpu.md)

  [API reference →](https://luma.gl/next/docs/api-reference/gpgpu.md)
* [![](/next/images/examples/arrow/arrow-points.jpg)](https://luma.gl/next/docs/api-reference/arrow.md)
  ### [@luma.gl/<!-- -->arrow](https://luma.gl/next/docs/api-reference/arrow.md)
  [Upload Apache Arrow columns and connect tabular data to GPU workflows.](https://luma.gl/next/docs/api-reference/arrow.md)

  [API reference →](https://luma.gl/next/docs/api-reference/arrow.md)
* [![](/next/images/examples/deck/city-scene.jpg)](https://luma.gl/next/docs/api-reference/scene.md)
  ### [@luma.gl/<!-- -->scene](https://luma.gl/next/docs/api-reference/scene.md)
  [Describe 3D scenes and switch renderers through the ANARI scene API.](https://luma.gl/next/docs/api-reference/scene.md)

  [API reference →](https://luma.gl/next/docs/api-reference/scene.md)
* [![](/next/images/examples/gltf/asset-studio.jpg)](https://luma.gl/next/docs/api-reference/gltf.md)
  ### [@luma.gl/<!-- -->gltf](https://luma.gl/next/docs/api-reference/gltf.md)
  [Load glTF assets, materials, lights, skins, and animations.](https://luma.gl/next/docs/api-reference/gltf.md)

  [API reference →](https://luma.gl/next/docs/api-reference/gltf.md)
* [![](/next/images/examples/showcase/gaussian-splats.jpg)](https://luma.gl/next/docs/api-reference/splats.md)
  ### [@luma.gl/<!-- -->splats](https://luma.gl/next/docs/api-reference/splats.md)
  [Stream, sort, and render Gaussian splat scenes.](https://luma.gl/next/docs/api-reference/splats.md)

  [API reference →](https://luma.gl/next/docs/api-reference/splats.md)
* [![](/next/images/examples/tutorials/slang-shaders.jpg)](https://luma.gl/next/docs/api-reference/slang.md)
  ### [@luma.gl/<!-- -->slang](https://luma.gl/next/docs/api-reference/slang.md)
  [Compile Slang shaders with reflection and typed shader contracts.](https://luma.gl/next/docs/api-reference/slang.md)

  [API reference →](https://luma.gl/next/docs/api-reference/slang.md)
* [![](/next/images/examples/experimental/text-space-crawl.jpg)](https://luma.gl/next/docs/api-reference/text.md)
  ### [@luma.gl/<!-- -->text](https://luma.gl/next/docs/api-reference/text.md)
  [Render GPU text with font atlases and reusable layout helpers.](https://luma.gl/next/docs/api-reference/text.md)

  [API reference →](https://luma.gl/next/docs/api-reference/text.md)
* [![](/next/images/examples/experimental/three.jpg)](https://luma.gl/next/docs/api-reference/three.md)
  ### [@luma.gl/<!-- -->three](https://luma.gl/next/docs/api-reference/three.md)
  [Combine luma.gl GPU workflows with Three.js scenes and renderers.](https://luma.gl/next/docs/api-reference/three.md)

  [API reference →](https://luma.gl/next/docs/api-reference/three.md)
* [![](/next/images/examples/showcase/million-row-crossfilter.jpg)](https://luma.gl/next/docs/api-reference/experimental.md)
  ### [@luma.gl/<!-- -->experimental](https://luma.gl/next/docs/api-reference/experimental.md)
  [Explore emerging GPU tables, rendering models, and spatial tools.](https://luma.gl/next/docs/api-reference/experimental.md)

  [API reference →](https://luma.gl/next/docs/api-reference/experimental.md)

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

Shadertools assembles WGSL and GLSL from reusable shader modules and application-defined hooks. It is used by luma.gl, deck.gl, and custom renderers.

## Next steps[​](#next-steps "Direct link to Next steps")

Ready for your first `Hello Triangle`? Proceed to [Getting Started](https://luma.gl/next/docs/getting-started.md).
