# Choosing a luma.gl API layer

[Choose a layer](https://luma.gl/docs/api-guide.md)[How layers fit](https://luma.gl/docs/api-guide/luma-layers.md)[Design philosophy](https://luma.gl/docs/api-guide/background/api-design.md)[Learning resources](https://luma.gl/docs/api-guide/background/learning-resources.md)[WebGPU vs WebGL](https://luma.gl/docs/api-guide/background/webgpu-vs-webgl.md)

The luma.gl API enables portable GPU applications on WebGPU or WebGL 2. Choose the highest-level layer that expresses the work clearly, then move down only when the application needs more control.

| If you need to…                                                                      | Start with      |
| ------------------------------------------------------------------------------------ | --------------- |
| Render geometry, manage redraws, animate, or pick objects                            | **Engine**      |
| Create and control buffers, textures, passes, pipelines, and submission              | **Core**        |
| Compose reusable WGSL/GLSL behavior                                                  | **Shadertools** |
| Schedule several dependent WebGPU operations with indirect work or transient storage | **GPU Core**    |

Start with [How luma.gl fits together](https://luma.gl/docs/api-guide/luma-layers.md) for one small rendered application viewed through each layer and concrete guidance on when to move up or down.

## Engine[​](#engine "Direct link to Engine")

The engine API provides higher-level classes like `Model`, `AnimationLoop`, `BufferTransform`, `TextureTransform`, and `Computation`. Its [shared animation system](https://luma.gl/docs/api-guide/engine/animation.md) adds keyframe tracks, clips, weighted mixing, crossfades, and portable morph-target deformation. Scenegraphs are included, while [glTF loading, physical materials, skeletal animation, and morph animation](https://luma.gl/docs/api-reference/gltf.md) live in the format-specific `@luma.gl/gltf` module.

The experimental [`SceneRenderer`](https://luma.gl/docs/api-reference/experimental/scene-renderer.md) and [`DeferredSceneRenderer`](https://luma.gl/docs/api-reference/experimental/deferred-scene-renderer.md) consume format-independent scene descriptions instead of introducing a second glTF renderer. Their [physical lighting environments](https://luma.gl/docs/api-reference/experimental/pbr-environment.md) can be prepared from caller-owned equirectangular textures.

For an experimental retained, renderer-independent scene contract, see [Declarative Scene Rendering](https://luma.gl/docs/api-guide/engine/anari-rendering.md). It introduces the experimental, private `@luma.gl/scene` workspace, scene objects, committed parameters, instancing, physically based lighting, and HDR presentation.

## Core[​](#core "Direct link to Core")

The core luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications. It is a portable API, in the sense that the `@luma.gl/core` module provides an abstract API for writing application code that works with both WebGPU and/or WebGL depending on which adapter modules are installed (`@luma.gl/webgl` and/or `@luma.gl/webgpu`).

Core responsibilities for any GPU library are to enable applications to perform:

* [GPU initialization](https://luma.gl/docs/api-guide/gpu/gpu-initialization.md) - Open a GPU device and query its capabilities
* [GPU memory management](https://luma.gl/docs/api-guide/gpu/gpu-memory.md) - Create, upload memory to and read from [Buffers](https://luma.gl/docs/api-guide/gpu/gpu-buffers.md), [Textures](https://luma.gl/docs/api-guide/gpu/gpu-textures.md) etc.
* [GPU command encoding](https://luma.gl/docs/api-guide/gpu/gpu-commands.md) - Decide when to use immediate resource helpers versus explicit `CommandEncoder` recording.
* [GPU resource management](https://luma.gl/docs/api-guide/gpu/gpu-resources.md) - Create `Shader`, `Renderpipeline`, `RenderPass` etc objects.
* [GPU binding management](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md) - Make attribute buffers, uniforms, textures, samplers available to GPU shaders.
* [Shader execution / rendering](https://luma.gl/docs/api-guide/gpu/gpu-rendering.md) - Drawing into textures, running compute shaders.
* [GPU parameter management](https://luma.gl/docs/api-guide/gpu/gpu-parameters.md) - Configuring blending, clipping, depth tests etc.

## Shadertools[​](#shadertools "Direct link to Shadertools")

The Shader API lets the application use a library of existing shader modules to create new custom shaders. It is also possible for developers to create new reusable shader modules.

Most applications work with the engine API (`Model`, `AnimationLoop` and related classes), leveraging the core GPU API as necessary to obtain a `Device` and use it to create GPU resources such as `Buffer` and `Texture`. The shader API is used to assemble shaders and define shader modules.

## Typical application flow[​](#typical-application-flow "Direct link to Typical application flow")

Most luma.gl applications will:

1. Use the core API to create a `Device` class to access the GPU (either using WebGPU or WebGL).
2. Upload data to the GPU via methods on the `Device`, using `Buffer` and `Texture` objects.
3. Use the engine API to create one or more `Model` instances from GLSL or WGSL shader code.
4. Bind attribute buffers and bindings (textures, uniform buffers or uniforms).
5. Start an engine API `AnimationLoop` loop, and draw each frame into a `RenderPass`.
