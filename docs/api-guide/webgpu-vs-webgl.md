# WebGPU vs WebGL

This page attempts to list out the notable differences between WebGPU and WebGL. 
This is not intended to be a complete list but is essentially a set of luma.gl developer 
notes, included because they may be useful to understanding how the differences between the WebGPU and WebGL implementations. 

These notes also exp;lain why some of the breaking changes in the luma.gl v9 API were made, and provide more detail on the 

## Background

WebGPU is the next generation GPU API for the browser, standardized by W3C. 
Given the high profile of the project and how WebGPU was designed to embrace
all the proprietary next-gen APIs from the major manufacturers (Vulkan, Metal, DX12) 
it seems reasonable to assume that the WebGPU API will be widely adopted and 
represents the future of GPU programming on the Web. 

- The imminent completion of the WebGPU standard 
- The launch of WebGPU support in the Chrome browser.
- Announcements that no further evolution of the WebGL standard is taking place.

WebGPU essentially exposes the latest next-gen GPU APIs (Vulkan, Metal, DX12) in the browser. A primary characteristic of these APIs is that they are designed to ensure GPU usage can be optimized "to the bone" (by e.g. minimization CPU-side validation overhead, enabling multi-threading etc) and wrapping WebGPU APIs under a backwards-compatible WebGL-centric API does not make much sense.

## WebGL compatibility

The WebGPU designers had many noble goals, however backwards compatibility WebGL was very clearly not one of them. This lack of backwards is quite significant. And it is not just a simple matter of essentially the same APIs being arbitrarily renamed, but the structure of the API is quite different. 
- It is more static, and objects tend to be immutable after creation
-  and a range of WebGL features are no longer available (uniforms and transform feedback just to mention a few). There are of course good reasons for this (and In many cases these incompatibilities reflect choices made by the underlying next-gen APIs) but WebGPU does create quite an upgrade shock for existing WebGL based frameworks. 

The luma.gl API with its focus on providing direct access to the GPU is perhaps impacted more by the incompatibilities compared to other major WebGL frameworks that tend to provide higher-level, game-engine type abstractions in their APIs (such as a "renderer" class). To be sure, there effort required to support WebGPU is big in both cases, but sometimes implementation changes in other frameworks can be hidden inside their abstractions.

## General comments

## WebGPU Device vs WebGL Context

A WebGL context is associated with a specific canvas.

- The default drawing buffer is associated with the canvas
- Rendering to other canvases either requires separate WebGL contexts (with duplicated GPU resources) or going through hoops with framebuffer rendering and image copies.
- A WebGPU device enables the application to render to multiple canvases using the same resources create separate swap chains for 

## Parameters and State Management

In WebGL many parameters are set on the WebGL context using individual function calls.

- This does cause problems when trying to make different modules work together.
- But it does make it easier to change settings between draw calls.

## Programs


| WebGPU limitation                           | Alternatives                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| No GLSL support                             | 1) glslang project seems stale. 2) Use Naga (Rust) to build a WebAssembly transpiler. 3) write two sets of shaders. |
| No constant attributes                      | 1) Create dummy buffers 2) dynamically generate shaders with uniforms.                                              |
| Interleaving specified at Pipeline creation | New `PipelineProps.bufferMap` concept                                                                               |
| No transform feedback                       | Compute shaders (storage buffers)                                                                                   |
| No uniforms, only Uniform buffers           | Add strong uniform buffer support to API, WebGL1 fallback?                                                          |
