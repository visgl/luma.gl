# luma.gl API

> This section describes the experimental, work-in-progress v9 luma.gl API.

The luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications.

Naturally, core responsibilities for any GPU library:

- GPU resource management (create and destroy GPU resources like Buffers, Textures etc)
- GPU Bindings (making attribute buffers, uniform buffers, textures, samplers etc available to GPU shaders.
- Shader execution (draw, compute)
- Shader composition
- Cross platform support: backwards compatibility with WebGL 2 (WebGL on a "best effort" basis).

## v9 API notes

The v9 API represents a break with luma.gl v8 and earlier, which was designed around providing a set of classes explicitly designed for working with the WebGL2 API.

Many key concepts have carried forward from the v8 API to the v9 API, and programmers should find themselves working on the same abstraction level as before with similar classes, such as `Model`, `AnimationLoop`, `Buffer`, `Texture` etc. But there are a number of important differences, more on that below.

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
