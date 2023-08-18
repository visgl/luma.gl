# API Overview

The luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications.

Core responsibilities for any GPU library are to enable applications to perform:

- [GPU device access](/docs/api-guide/device) - Open a GPU device and query its capabilities 
- [GPU memory management](/docs/api-guide/memory) - Create, upload memory to and read from [Buffers](/docs/api-guide/buffers), [Textures](/docs/api-guide/textures) etc.
- [GPU resource management](/docs/api-guide/resources) - Create `Shader`, `Renderpipeline`, `RenderPass` etc objects.
- [GPU binding management](/docs/api-guide/bindings) - Make attribute buffers, uniforms, textures, samplers available to GPU shaders.
- [Shader execution / rendering](/docs/api-guide/rendering) - Drawing into textures, running compute shaders.
- [GPU parameter management](/docs/api-guide/parameters) - Configuring blending, clipping, depth tests etc.

## Portability 

luma.gl enables the creation of portable applications that can run on top of either WebGPU, WebGL 2, or WebGL.

The `@luma.gl/core` module provides an abstract API for writing application code
that works with both WebGPU and WebGL.

The `@luma.gl/core` module cannot be used on its own: it relies on being backed up by another module
that implements the API. luma.gl provides adapters (implementations of the abstract API)
through the `@luma.gl/webgl` and `@luma.gl/webgpu` modules.

## Usage

Most luma.gl applications will:

1. Create a `Device` class to access the GPU (either using WebGPU or WebGL).
2. Use that device to upload data to the GPU in the form of `Buffer` and `Texture` objects.
3. Create one or more `RenderingPipeline` objects from GLSL or WGSL shader code.
4. Bind attribute buffers and bindings (textures, uniform buffers or uniforms).
5. Start a render loop, and use a `RenderPass` to draw.

