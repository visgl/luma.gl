# Porting Guide

Given that the changes in the v9 API are quite extensive, this separate porting guide is provided to hopefully help plan the upgrade process.

## v9 API Design background

We'll start with motivating the changes in v9.

### Why is the v9 API a major breaking change?

The three major reasons why the v9 API made big making breaking changes are to take full advantage of WebGPU, TypeScript and to improve long-term maintainability

Basically, the v8 API design focused on providing a set of classes optimized for working with the WebGL2 API, and a significant part of the code was untyped, predating TypeScript introduction.

#### Wanted: A "WebGPU-first" API

Adding WebGPU support was the top priority for luma.gl v9. Some consideration was given towards keeping the existing WebGL2-centric API and providing a WebGPU implementation for that API, to avoid breaking applications. But ultimately that did not make sense. The WebGPU API is quite different from WebGL. WebGPU was designed to avoid the performance overhead that is unavoidable in WebGL APIs (e.g. avoid repeated validation of GPU objects, avoid repeated issuing of same commands, avoid constructs that prevent deep shader optimizations etc). WebGPU is clearly the future of GPU APIs in the browser (WebGL is no longer evolving). It seems doubtful that luma.gl would be able to remain relevant if it stuck to a WebGL-focused API.

#### Wanted: A "TypeScript-first" API

As luma.gl continued to adopt TypeScript it become clear that modern TypeScript enables a number of simpler, more intuitive API constructions. One example is that in TypeScript we can now safely specify that an "enum type" argument must be one of a few specific strings. By using string values in types, we don't need to introduce enumerations or key-value object constants. As an example the `Sampler` `minFilter` property is now specified as either `'linear'` or `'nearest'`, rather than `GL.LINEAR` or `GL.NEAREST`. This move to string constant values enabled luma.gl to align string constants with the WebGPU standard, avoiding the need to define additional mappings and abstractions on top of the WebGPU API.

#### Improved Maintainability

Another reason for the breaking changes in v9 is simply the removal and restructuring of legacy code. Over 8 releases, the luma.gl API had grown quite large. It exposed all the functionality offered by WebGL2, however many WebGL 2 functions were rarely used. luma.gl contained a lot of code for mutating WebGL resources, which would not work for an applications that also attempts to run on WebGPU, since WebGPU classes are (mostly) immutable. In addition, some core maintainers of luma.gl have moved on, so we took the opportunity to cut out some legacy code to make sure the code base remains accessible and easy to understand for the community. The new WebGPU compatible API provided the just the lens we needed to decide which particular pieces of functionality should be cut. 

## Effort Estimation

Suddenly having to upgrade an existing application to a new breaking API version is never fun. A first step for a developer is often to assess how much effort an upgrade is likely to require.

While it is impossible for us to assess here how much work will be required for your specific application, and the list of luma.gl v9 changes listed below is long, it probably looks worse than it is:

- While the entire API has been modernized, the overall structure and concepts of the classic luma.gl API have been preserved. 
- The API abstraction level has not changed, and while constants and names etc will need to be updated, programmers should find themselves comfortably working with the same classes in luma.gl v9 as they did in v8, without having to re-learn the API. 
- They key building block classes like `AnimationLoop`, `Model`, `Buffer`, `Texture` etc are still available.
- Many changes affect parts of the API that are not frequently used in most applications.
- In addition, the strong TypeScript typings in luma.gl v9 should create a strong safety net when porting. This means that the typescript compiler should be able to pinpoint most breakages in your application before you even run your code.

## Quick v9 API overview

The luma.gl v9 API is designed to provide portable WebGPU / WebGL 2 API, ground-up TypeScript support, and strong support for working with both WGSL and GLSL shaders.

The new v9 GPU API is now an abstract Device API, meaning that the API itself is specified in terms of TypeScript interfaces and abstract classes that cannot be directly instantiates. Types such as `Buffer`, `Texture` etc can not be used on their own, but a subclass that implements the functionality of that class a specific GPU API must be requested from a Device (`WebGLBuffer`, `WebGPUTexture`). 

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

## Porting Strategy

This is based on the porting strategy used to port [deck.gl](https://deck.gl), which is the biggest luma.gl-dependent code base.

### Step 1: Update Imports

- Change imports from `@luma.gl/gltools` to `@luma.gl/webgl`.
- Change imports from `@luma.gl/core` to `@luma.gl/webgl`.

### Step 2: Replace WebGLRenderingContext with Device

The quickest way to start porting would be to start updating your application to consistently use the new `Device` class instead of directly working with .

- **Feature Detection** - At the end of this stage it is also possible to replace feature detection constants with the new `device.features` functionality.

### Step 3: Replace canvas manipulation with CanvasContext

The handling of canvas related functionality (size, resolution etc) can
be a messy part of WebGL applications.

### Step 3: Replace parameter names

Recommended changes:

- Gradually reduce the number of imports `@luma.gl/constants` and start adopting string constants.

## Upgrading GPU Parameters

- Parameters are set on `Pipeline` creation. They can not be modified, or passed as parameters to draw calls.
- Parameters can now only be set, not queried. luma.gl no longer provides a way to query parameters.

## Depth testing

To set up depth testing

```typescript
const value = model.setParameters({
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
});
```
