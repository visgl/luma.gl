# A Tale of Three APIs

[A Tale of Three APIs](https://luma.gl/next/docs/api-guide.md)[Design Philosophy](https://luma.gl/next/docs/api-guide/background/api-design.md)[Learning Resources](https://luma.gl/next/docs/api-guide/background/learning-resources.md)[WebGPU vs WebGL](https://luma.gl/next/docs/api-guide/background/webgpu-vs-webgl.md)

The luma.gl API enables the creation of portable GPU applications that can run on top of either WebGPU, or WebGL 2. luma.gl is divided into different sub-APIs: the core GPU API, the shader API and the engine API.

## Engine API[​](#engine-api "Direct link to Engine API")

The engine API provides higher-level classes like `Model`, `AnimationLoop`, `BufferTransform`, `TextureTransform`, and `Computation`. Scenegraphs are included and glTF support is available through the `@luma.gl/gltf` add-on module.

For an experimental retained, renderer-independent scene contract, see [Declarative Rendering with ANARI](https://luma.gl/next/docs/api-guide/engine/anari-rendering.md). It introduces the experimental, private `@luma.gl/anari` workspace, scene objects, committed parameters, instancing, physically based lighting, and HDR presentation.

## Core API[​](#core-api "Direct link to Core API")

The core luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications. It is a portable API, in the sense that the `@luma.gl/core` module provides an abstract API for writing application code that works with both WebGPU and/or WebGL depending on which adapter modules are installed (`@luma.gl/webgl` and/or `@luma.gl/webgpu`).

Core responsibilities for any GPU library are to enable applications to perform:

* [GPU initialization](https://luma.gl/next/docs/api-guide/gpu/gpu-initialization.md) - Open a GPU device and query its capabilities
* [GPU memory management](https://luma.gl/next/docs/api-guide/gpu/gpu-memory.md) - Create, upload memory to and read from [Buffers](https://luma.gl/next/docs/api-guide/gpu/gpu-buffers.md), [Textures](https://luma.gl/next/docs/api-guide/gpu/gpu-textures.md) etc.
* [GPU command encoding](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md) - Decide when to use immediate resource helpers versus explicit `CommandEncoder` recording.
* [GPU resource management](https://luma.gl/next/docs/api-guide/gpu/gpu-resources.md) - Create `Shader`, `Renderpipeline`, `RenderPass` etc objects.
* [GPU binding management](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md) - Make attribute buffers, uniforms, textures, samplers available to GPU shaders.
* [Shader execution / rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md) - Drawing into textures, running compute shaders.
* [GPU parameter management](https://luma.gl/next/docs/api-guide/gpu/gpu-parameters.md) - Configuring blending, clipping, depth tests etc.

## Shader API[​](#shader-api "Direct link to Shader API")

The Shader API lets the application use a library of existing shader modules to create new custom shaders. It is also possible for developers to create new reusable shader modules.

Most applications work with the engine API (`Model`, `AnimationLoop` and related classes), leveraging the core GPU API as necessary to obtain a `Device` and use it to create GPU resources such as `Buffer` and `Texture`. The shader API is used to assemble shaders and define shader modules.

## General Usage[​](#general-usage "Direct link to General Usage")

Most luma.gl applications will:

1. Use the core API to create a `Device` class to access the GPU (either using WebGPU or WebGL).
2. Upload data to the GPU via methods on the `Device`, using `Buffer` and `Texture` objects.
3. Use the engine API to create one or more `Model` instances from GLSL or WGSL shader code.
4. Bind attribute buffers and bindings (textures, uniform buffers or uniforms).
5. Start an engine API `AnimationLoop` loop, and draw each frame into a `RenderPass`.
