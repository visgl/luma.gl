# API Overview

The luma.gl API enables the creation of portable GPU applications that can run on top of either WebGPU, or WebGL 2.
luma.gl is divided into different sub-APIs: the core GPU API, the shader API and the engine API.

Most applications work with the engine API (`Model`, `AnimationLoop` and related classes), leveraging the core GPU API as necessary to obtain a `Device` and use it to create GPU resources such as `Buffer` and `Texture`. 
The shader API is used to assemble shaders and define shader modules.

Most luma.gl applications will:

1. Use the core API to create a `Device` class to access the GPU (either using WebGPU or WebGL).
2. Upload data to the GPU via methods on the `Device`, using `Buffer` and `Texture` objects.
3. Use the engine API to create one or more `Model` instances from GLSL or WGSL shader code.
4. Bind attribute buffers and bindings (textures, uniform buffers or uniforms).
5. Start an engine API `AnimationLoop` loop, and draw each frame into a `RenderPass`.

## Core API

The core luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications.
It is a portable API, in the sense that the `@luma.gl/core` module provides an abstract API for writing application code
that works with both WebGPU and/or WebGL depending on which adapter modules are installed
)`@luma.gl/webgl` and/or `@luma.gl/webgpu`).

Core responsibilities for any GPU library are to enable applications to perform:

- [GPU initialization](/docs/api-guide/gpu/gpu-initialization) - Open a GPU device and query its capabilities 
- [GPU memory management](/docs/api-guide/gpu/gpu-memory) - Create, upload memory to and read from [Buffers](/docs/api-guide/gpu/gpu-buffers), [Textures](/docs/api-guide/gpu/gpu-textures) etc.
- [GPU resource management](/docs/api-guide/gpu/gpu-resources) - Create `Shader`, `Renderpipeline`, `RenderPass` etc objects.
- [GPU binding management](/docs/api-guide/gpu/gpu-bindings) - Make attribute buffers, uniforms, textures, samplers available to GPU shaders.
- [Shader execution / rendering](/docs/api-guide/gpu/gpu-rendering) - Drawing into textures, running compute shaders.
- [GPU parameter management](/docs/api-guide/gpu/gpu-parameters) - Configuring blending, clipping, depth tests etc.

## Shader API

The Shader API lets the application use a library of existing shader modules to create new customer shaders. 
It is also possible for developers to create new reusable shader modules.

## Engine API

The engine API provides higher level classes like `Model`, `AnimationLoop` and `Transform`s.
glTF support is available through `@luma.gl/gltxf`.
