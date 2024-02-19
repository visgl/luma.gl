# API Design Philosophy

This article provides some background on luma.gl's API design philosophy.

## Design Goals

Goals:

- The luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications.
- Avoid creating a thick abstraction layer hiding the underlying API.
- Big data processing (thinking about the GPU as a parallel binary columnar table processor rather than a scenegraph rendering engine).
- Cross platform support: backwards compatibility with WebGL 2.

Non-goals:

- Comprehensive 3D Game Engine functionality


## A WebGPU-style API

The luma.gl v9 API design launched in 2023 stays fairly close to the WebGPU API, just as the earlier luma.gl v8 API followed the WebGL 2 API. The idea is to let users build their knowledge of WebGPU and the luma.gl API in tandem, rather than asking them to learn an abstraction and perhaps never get to work directly with WebGPU.

Accordingly the luma.gl `Device` API is designed to be similar to the WebGPU `Device` API. for example:

- The application must first obtain a `Device` instance
- It then uses methods on this device to create GPU resource classes such as buffers, textures, shaders and pipelines.
- The name of the resource classes mirror those in the WebGPU API.
- the luma.gl API uses string constants and parameter option names that mirror those in the WebGPU API.

These similarities are intentional: 

- The avoids creating a new abstraction layer that developers must learn. 
- Knowledge of the WebGPU API carries over to the luma.gl API and vice versa.
- They allow the luma.gl WebGPU Device implementation to remain thin, ensuring optimal performance and minimal overhead.

While the luma.gl Device API has many similarities to WebGPU API, it is not a trivial wrapper. The luma.gl API is:

- streamlined to be significantly less cumbersome to use.
- makes the necessary allowances to also enable a reasonable WebGL `Device` implementation.

