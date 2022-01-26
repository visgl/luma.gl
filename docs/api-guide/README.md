# API Overview

# luma.gl API

The luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications.

Naturally, core responsibilities for any GPU library:

- GPU resource management (create and destroy GPU resources like Buffers, Textures etc)
- GPU Bindings (making attribute buffers, uniform buffers, textures, samplers etc available to GPU shaders.
- Shader execution (draw, compute)
- Shader composition
- Cross platform support: backwards compatibility with WebGL 2 (WebGL on a "best effort" basis).

The luma.gl API is designed to allow the creation of portable applications that can
run on top of either WebGPU, WebGL 2, or WebGL.

Most luma.gl applications will:

1. Create a `Device` class to access the GPU (either using WebGPU or WebGL).
2. Use that device to upload data to the GPU in the form of `Buffer` and `Texture` objects.
3. Create one or more `Model` objects from GLSL or WGSL shader code.
4. Bind attribute buffers and bindings (textures, uniform buffers or uniforms).
5. Start a render loop, often using the `AnimationLoop` class.

The `@luma.gl/api` module provides an abstract API for writing application code
that works with both WebGPU and WebGL.

The `@luma.gl/api` module cannot be used on its own: it relies on being backed up by another module
that implements the API. luma.gl provides adapters (implementations of the abstract API)
through the `@luma.gl/webgl` and `@luma.gl/webgpu` modules.

## A WebGPU-style API

The luma.gl v9 API design stays fairly close to the WebGPU API, just as the luma.gl v8 API followed the WebGL 2 API. The idea is to let the users' build their knowledge of the WebGPU and luma.gl API in tandem,
rather than asking users to learn another abstraction.

Some examples of similarities:

- The application must first obtain a "device"
- The application then uses methods on this device to create GPU resource classes such as buffers, textures, shaders and pipelines.
- The API uses string constants and parameter option names that mirror those in the WebGPU API.

However there are differences. Compared to the raw WebGPU API, the luma.gl v9 API is somewhat streamlined to be easier to use and also makes necessary allowances to ensure that it can also run on top of WebGL.

## Modules

| Module                  | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `@luma.gl/api`          | "Abstract" API that is implemented by both the WebGPU or WebGL.                      |
| `@luma.gl/engine`       | A set of core classes that are independent from their engine.                        |
| `@luma.gl/shadertools`  | Provides GLSL module system and transpiler as well as a selection of shader modules. |
| `@luma.gl/experimental` | Contains glTF loader, GPU algorithms, VR classes etc.                                |
| `@luma.gl/webgl`        | Contains the WebGL 1 and 2 implementations of the `@luma.gl/api`                     |
| `@luma.gl/webgpu`       | Contains the WebGPU implementation of the `@luma.gl/api`                             |
| `@luma.gl/test-utils`   | Test setups, in particular support for rendering and comparing images.               |
| `@luma.gl/gltools`      | The deprecated luma.gl v8 API can now be imported from `@luma.gl/gltools`.           |
| `@luma.gl/core`         | A module that re-exports many of the symbols in the other modules.                   |
