# About luma.gl V9?

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

The luma.gl v9 API is a major new iteration of the luma.gl API, optimized around providing WebGPU and TypeScript support. It is a big breaking change.

## What has not changed?

First it is important to call out that while the v9 API has been modernized, the "spirit" and concepts of the classic luma.gl API have been carried forward from the v8 API to the v9 API. The abstraction level has not changed, and while some constants and names etc will need to be updated, programmers should find themselves comfortably working on with essentially the same classes in luma.gl v9, just as they did in v8, without having to re-learn the API (e.g. `Model`, `AnimationLoop`, `Buffer`, `Texture` etc). 

## What is New?

The new v9 GPU API is now an abstract API, meaning that the API itself is specified in terms of TypeScript interfaces (or rather abstract classes). Types such as `Buffer`, `Texture` etc can not be used on their own, but a subclass that implements that concept for a specific GPU API must be used (`WebGLBuffer`, `WebGPUTexture`). However portability is achieved by writing applications against the abstract classes.

The new `Device` class provides the access point to the new GPU interface. It creates and instruments the WebGL context or the WebGPU adapter, and provides methods to create all the implementation classes (`WebGLDevice.createBuffer(... =>  WebGLBuffer`, `WebGPUDevice.createTexture(... =>  WebGLGPUTexture`)

The new `CanvasContext` class handles context sizing, resolution etc.

The v9 API no longer accepts/returns `GL` constants, but instead uses the corresponding string values from the WebGPU standard (mapping those transparently under WebGL).

- The parameter API has been updated to more closely match the WebGPU API. Also parameters are specified on pipelines and render pass creation and are and not as easy to change per draw call as they were in luma.gl v8.


In progress
- Reading and writing buffers is now an async operation. While WebGL does not support async reads and writes on MacOS, the API is still async to ensure portability to WebGPU.

- Uniform buffers are now the standard way for the application to specify uniforms. Uniform buffers are "emulated" under WebGL.

A subset of the new interfaces in the luma.gl v9 API:


| Interface | Description |
| --- | --- |
| `Adapter` | luma.gl exposes GPU capabilities on the device in the form of one or more as `Adapter`s. |
| `Device`  | Manages resources, and the device’s GPUQueues, which execute commands. |
| `Buffer`  | The physical resources backed by GPU memory. A `Device` may have its own memory with high-speed access to the processing units. |
| `Texture` | Like buffer, but supports random access |
GPUCommandBuffer and GPURenderBundle are containers for user-recorded commands.
| `Shader` | Compiled shader code.
| `Sampler` | or GPUBindGroup, configure the way physical resources are used by the GPU. |

GPUs execute commands encoded in GPUCommandBuffers by feeding data through a pipeline, which is a mix of fixed-function and programmable stages. Programmable stages execute shaders, which are special programs designed to run on GPU hardware. Most of the state of a pipeline is defined by a GPURenderPipeline or a GPUComputePipeline object. The state not included in these pipeline objects is set during encoding with commands, such as beginRenderPass() or setBlendColor().


## Why is the v9 API a major breaking change?

The proposed luma.gl v9 API does represents a significant break with the v8 API. No luma.gl application would be completely unaffected. 

The three major reasons why the v9 API are making breaking changes are to take full advantage of WebGPU, TypeScript and to improve long-term maintainability, discussed in more detail below.

In contrast to new focus on WebGPU and TypeScript, the v8 API design focused on providing a set of WebGL2 classes optimized for working with the WebGL2 API, and most of the code was untyped, predating TypeScript introduction.

### Wanted: A "WebGPU-first" API

Adding WebGPU support was the top priority for luma.gl v9. Some consideration was given towards keeping the existing WebGL2-centric API and providing a WebGPU implementation for that API, to avoid breaking applications. But ultimately that did not make sense. The WebGPU API is quite different from WebGL. WebGPU was designed to avoid the performance overhead that is unavoidable in WebGL APIs (e.g. avoid repeated validation of GPU objects, avoid repeated issuing of same commands, avoid constructs that prevent deep shader optimizations etc). WebGPU is clearly the future of GPU APIs in the browser (WebGL is no longer evolving). It seems doubtful that luma.gl would be able to remain relevant if it stuck to a WebGL-focused API.

### Wanted: A "TypeScript-first" API

As luma.gl continued to adopt TypeScript it become clear that modern TypeScript enables a number of simpler, more intuitive API constructions. One example is that in TypeScript we can now safely specify that an "enum type" argument must be one of a few specific strings. By using string values in types, we don't need to introduce enumerations or key-value object constants. As an example the `Sampler` `minFilter` property is now specified as either `'linear'` or `'nearest'`, rather than `GL.LINEAR` or `GL.NEAREST`. This move to simpler interface mechanismss like string constant values also allowed us to align string constants with the WebGPU standard, avoiding the need to define additional mappings and abstractions on top of the WebGPU API.

### Improved Maintainability

Another reason for the breaking changes in v9 is simply the removal and restructuring of legacy code. Over 8 releases, the luma.gl API had grown quite large. It exposed all the functionality offered by WebGL2, however many WebGL 2 functions were rarely used. luma.gl contained a lot of code for mutating WebGL resources, which would not work for an applications that also attempts to run on WebGPU, since WebGPU classes are (mostly) immutable. In addition, some core maintainers of luma.gl have moved on, so we took the opportunity to cut out some legacy code to make sure the code base remains accessible and easy to understand for the community. The new WebGPU compatible API provided the just the lens we needed to decide which particular pieces of functionality should be cut. 

## But wait, the v8 API is still available?

Yes, the v8 classes are still available, though they have been moved into a new, already deprecated `@luma.gl/webgl-legacy` module. The new module is mainly there to be a way for applications to start the porting process in a slightly more incremental way. The current plan is to remove the `@luma.gl/webgl-legacy` module completely in luma.gl v10.


