# Overview

[Overview](https://luma.gl/next/docs/api-guide/gpu.md)[Initialization](https://luma.gl/next/docs/api-guide/gpu/gpu-initialization.md)[Resources](https://luma.gl/next/docs/api-guide/gpu/gpu-resources.md)[Data Processing](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing.md)[Rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md)[Antialiasing](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md)[Parameters](https://luma.gl/next/docs/api-guide/gpu/gpu-parameters.md)

* [GPU initialization](https://luma.gl/next/docs/api-guide/gpu/gpu-initialization.md) - Open a GPU device and query its capabilities.
* [GPU memory management](https://luma.gl/next/docs/api-guide/gpu/gpu-memory.md) - Create, upload memory to and read from [Buffers](https://luma.gl/next/docs/api-guide/gpu/gpu-buffers.md), [Textures](https://luma.gl/next/docs/api-guide/gpu/gpu-textures.md) etc.
* [GPU tables](https://luma.gl/next/docs/api-guide/gpu/gpu-tables.md) - Represent typed, batch-preserving columns and lower varying or constant values to attributes and storage buffers.
* [GPU data processing](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing.md) - Choose between portable GPGPU evaluators, reusable WebGPU command graphs, and lower-level compute helpers.
* [Video textures](https://luma.gl/next/docs/api-guide/gpu/video-textures.md) - Choose copied texture bindings or WebGPU external-texture sampling for live video.
* [HTML-in-Canvas](https://luma.gl/next/docs/api-guide/gpu/html-in-canvas.md) - Detect experimental DOM subtree rasterization into Canvas, WebGL, or WebGPU texture paths.
* [GPU command encoding](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md) - Decide when to use immediate resource helpers versus explicit `CommandEncoder` recording.
* [GPU resource management](https://luma.gl/next/docs/api-guide/gpu/gpu-resources.md) - Create `Shader`, `RenderPipeline`, `RenderPass` etc. objects.
* [GPU binding management](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md) - Make attribute buffers, uniforms, textures, samplers available to GPU shaders.
* [Tabular data in WGSL](https://luma.gl/next/docs/api-guide/gpu/tabular-data-in-wgsl.md) - Map logical table columns to vertex attributes or WebGPU storage arrays and structs.
* [Shader execution / rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md) - Drawing into textures, running compute shaders.
* [Antialiasing and multisampling](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md) - Choose between canvas antialiasing, MSAA, supersampling, postprocess AA, and texture filtering.
* [GPU parameter management](https://luma.gl/next/docs/api-guide/gpu/gpu-parameters.md) - Configuring blending, clipping, depth tests etc.
