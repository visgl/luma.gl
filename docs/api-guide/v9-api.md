# luma.gl v9 API

> Proposed luma.gl v9 API. Open for comments.

The v9 API represents a break with the luma.gl v8 API, which was designed around providing a set of classes explicitly designed for working with the WebGL2 API.

While there are breaking changes, the "spirit" and concepts of the classic luma.gl API have carried forward from the v8 API to the v9 API, and programmers should find themselves comfortably working on the same abstraction level as before with essentially the same classes, such as `Model`, `AnimationLoop`, `Buffer`, `Texture` etc. 

But there are a number of important differences, more on that below.

luma.gl v9 is an abstract API, specified in terms of TypeScript interfaces (such as `Buffer`, `Texture` etc). A `Device` class provides concrete classes that implement these interfaces using the corresponding implementation API.

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

## Why a major breaking change?

There a couple of reasons why making breaking changes in the v9 API makes a lot of sense.

### A "WebGPU first" API

Making luma.gl work both on WebGPU and WebGL was the top priority for luma.gl v9. Initially, keeping the existing WebGL2 centric API and providing a WebGPU implementation of that was considered, but ultimately that did not make sense.

- The imminent completion of the WebGPU standard and launch of WebGPU support in the Chrome browser.
- Announcements that no further evolution of the WebGL standard is taking place.
- WebGPU essentially exposes the latest next-gen GPU APIs (Vulkan, Metal, DX12) in the browser. A primary characteristic of these APIs is that they are designed to ensure GPU usage can be optimized "to the bone" (by e.g. minimization CPU-side validation overhead, enabling multi-threading etc) and wrapping WebGPU APIs under a backwards-compatible WebGL-centric API does not make much sense.
- It made sense to make a breaking change now, and introduce

Another reason is that luma.gl API had grown quite large as it exposed all the functionality offered by WebGL2. However as core maintainers move on, and luma.gl increasingly becomes a community project, there is significant value 
## v9 vs v8 API

- The API is now abstract, specified in terms of TypeScript interfaces, such as `Buffer`, `Texture` etc. A `Device` class provides concrete classes that implement these interfaces using the corresponding implementation API.
- Reading and writing buffers is now an async operation. While WebGL does not support async reads and writes on MacOS, the API is still async to ensure portability.
- Uniform buffers are now the standard way for the application to specify uniforms. Uniform buffers are "emulated" under WebGL.
- The v9 API no longer accepts/returns `GL` constants, but instead uses the corresponding string values from the WebGPU standard (mapping those transparently under WebGL).
- The parameter API has been updated to more closely match the WebGPU API. Also parameters are built into pipelines and not as easy to change in a draw call.

## Get Started

```js
import {GPU} from '@luma.gl/webgpu';

const device = GPU.getDevice({canvas});

const {Buffer, Model, AnimationLoop} = device;
const buffer = new Buffer(device, {});

const animationLoop = new AnimationLoop({
  device,
  onInitialize({device}) {

  },
  onFinalize({device}) {

  },
  onRender({device}) {

  }
});

animationLoop.run();
```
