# WebGPU vs WebGL

This page is a collection of developer notes on the differences between WebGPU and WebGL. 

This is not intended to be a complete list but is included because they may be useful to someone interested in understanding the differences between WebGPU and WebGL technology. 

These notes also indirectly explain why some of the breaking changes in the luma.gl v9 API were made.

## Background

WebGPU is the next generation GPU API for the browser, standardized by W3C. 
Given the broad industry support for the project and the fact that WebGPU was designed to embrace all the proprietary next-gen APIs from the major manufacturers, i.e. Vulkan, Metal, and DX12, it is reasonable to assume that the WebGPU API will be widely adopted and represents the future of GPU programming on the Web at least for the next decade and into the 2030s. 

As of the writing of this article:

- The first version of WebGPU standard is approved and published.
- WebGPU support has launched in the Chrome browser.
- It has been announced that no further evolution of the WebGL standard is taking place.

# What is WebGPU?

WebGPU essentially exposes the latest next-gen GPU APIs (Vulkan, Metal, DX12) in the browser through a new common API. A notable characteristic of the three next-gen GPU APIs is that they are designed ground up so that unnecessary GPU processing overhead can be avoided and optimized away. 

One example of this (discussed in more detail below) is that by making GPU resources read-only, WebGPU minimizes repeated CPU-side validation overhead (no need to re-validate an object that can never change after it has been created).

But there are also explicit features such as command queues, bind groups and render bundles that allow the application to pre-record or group operations so that the minimal amount of operations need to be repeated on each draw call / shader execution.

## WebGL compatibility

The WebGPU designers had many challenging goals, however backwards compatibility WebGL was  clearly not among them. While this was likely This lack of backwards is quite significant. And it is not just a simple matter of essentially the same APIs being arbitrarily renamed, but the structure of the API is  different and the behavior of objects (immutability etc) does invalidate many reasonable assumptions made by WebGL applications. 

## Breaking changes

The luma.gl API with its focus on providing direct access to the GPU and the GPU API is perhaps impacted more by the incompatibilities between the WebGPU and the WebGL APIs thatn other  WebGL frameworks that tend to provide higher-level, game-engine type abstractions in their APIs (such as a "renderer" class). 

To be sure, the effort required to support WebGPU is big in both cases, but sometimes the required implementation changes in other frameworks can perhapsw be hidden inside their abstractions, and avoid breaking API changes, whereas in luma.gl, we have to expose the change and break some APIs.

## Differences

### WebGPU Device vs WebGL Context

A WebGL context is associated with a specific canvas:

- The default drawing buffer is associated with the canvas
- Rendering to other canvases either requires separate WebGL contexts (with duplicated GPU resources) or going through hoops with framebuffer rendering and image copies.
- A WebGPU device enables the application to render to multiple canvases using the same resources create separate swap chains for 

### GPU Resource Immutability

WebGPU API is more static, in the sense that objects tend to be immutable after creation.

By making GPU resources read-only, WebGPU minimizes repeated CPU-side validation overhead (no need to re-validate an object that can never change after it has been created).

However this means that when parameters or state does change, new resources need to be created which can create a fair amount of complication and work for the application.

### Parameters and State Management

In WebGL many parameters are set on the WebGL context using individual function calls:

- This does cause problems when trying to make different modules work together.
- But it does make it easier to change settings between draw calls.

## Programs vs Pipelines

| WebGPU limitation                           | Alternatives                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| No GLSL support                             | 1) glslang project seems stale. 2) Use Naga (Rust) to build a WebAssembly transpiler. 3) write two sets of shaders. |
| No constant attributes                      | 1) Create dummy buffers 2) dynamically generate shaders with uniforms.                                              |
| Interleaving specified at Pipeline creation | New `PipelineProps.bufferMap` concept                                                                               |
| No transform feedback                       | Compute shaders (storage buffers)                                                                                   |
| No uniforms, only Uniform buffers           | Add strong uniform buffer support to API, WebGL1 fallback?                                                          |

## No Uniforms

-  and a range of WebGL features are no longer available (uniforms and transform feedback just to mention a few). There are of course good reasons for this (and In many cases these incompatibilities reflect choices made by the underlying next-gen APIs) but WebGPU does create quite an upgrade shock for existing WebGL based frameworks. 

## Attributes

In WebGPU
- Unlike WebGL, WebGPU attribute sizes must be even multiples of 2, which means that an attribute with 1 or 3 bytes per vertex are not possible.
- Attribute formats (type, components, normalization, etc) are specified when creating a pipeline (program). This cannot be re specified when rebinding an attribute, like it can in WebGL.


## No TransformFeedback

-  and a range of WebGL features are no longer available (uniforms and transform feedback just to mention a few). There are of course good reasons for this (and In many cases these incompatibilities reflect choices made by the underlying next-gen APIs) but WebGPU does create quite an upgrade shock for existing WebGL based frameworks. 

## Explicit Optimizations

WebGPU brings explicit features such as command queues, bind groups and render bundles that allow the application to pre-record or group operations so that the minimal amount of operations need to be repeated on each draw call / shader execution.

While these are valuable, some of them require extra effort and planning when organizing your application.

## Additional Information

There are many other examples, this is only a partial list.