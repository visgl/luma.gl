# luma.gl v9 API

> The luma.gl v9 API is currently in [public review](/docs/open-governance).

The proposed luma.gl v9 API does represents a break with the v8 API. The new v9 API is optimized around WebGPU and TypeScript, while the v8 API design focused on providing a set of classes optimized for working with the WebGL2 API, and predated TypeScript introduction.

While the v9 API has been modernized, the "spirit" and concepts of the classic luma.gl API have been carried forward from the v8 API to the v9 API. The abstraction level has not changed, and while some constants and names etc will need to be updated, programmers should find themselves comfortably working on with essentially the same classes in luma.gl v9, as they did in v8 without having to re-learn the API (e.g. `Model`, `AnimationLoop`, `Buffer`, `Texture` etc). 

## Why a major breaking change?

The three major reasons why the v9 API are making breaking changes are to take full advantage of WebGPU, TypeScript and to improve long-term maintainability.

### A "WebGPU-first" API

Adding WebGPU support was top priority for luma.gl v9. Keeping the existing WebGL2-centric API and providing a WebGPU implementation of it was an option, but ultimately that did not make sense. The WebGPU API itself is quite different from WebGL (it was designed to avoid performance overhead induced by WebGL APIs), and WebGPU is clearly the future of WebGPU compute in the browser (WebGL is no longer evolving). It seems doubtful that luma.gl would be able to remain relevant if it remained optimized for WebGL.

### A "TypeScript-first" API

As luma.gl continued to adopt TypeScript it become clear that TypeScript enables a number simpler, more intuitive API constructions. One example is that in TypeScript we can now safely specify that an argument must be one of a few specific strings. By using string values in types, we don't need to introduce enumerations or key-value object constants. As an example the `Sampler` `minFilter` property is now specified as either `'linear'` or `'nearest'`, rather than `GL.LINEAR` or `GL.NEAREST`. The move to simpler interface mechanisms like string constant values also allowed us to align string constants with the WebGPU standard, avoiding the need to define additional mappings on top of the WebGPU API.

### Improved Maintainability

Another reason for breaking changes is the removal and restructuring of legacy code. The luma.gl API had grown quite large. It exposed all the functionality offered by WebGL2, however many WebGL 2 functions were rarely used. luma.gl contained a lot of code for mutating WebGL resources, which would not work when applications ran on WebGPU, since WebGPU classes are immutable. Some core maintainers have moved on, so we took the opportunity to cut out some legacy code to make sure the code base remains accessible and easy to understand for the community. The new WebGPU compatible API provided the just the lens we needed to decide which particular pieces of functionality could be cut. 

Note tha in luma.gl v9, the v8 classes are still available (they have been moved into the `gltools` module, which is now considered deprecated) but the plan is to remove it completely in v10.

## v9 vs v8 API highlighs

- The v9 API is now abstract, specified in terms of TypeScript interfaces, such as `Buffer`, `Texture` etc. 
- 
- The `Device` class provides the interface  implement these interfaces using the corresponding implementation API.
- Reading and writing buffers is now an async operation. While WebGL does not support async reads and writes on MacOS, the API is still async to ensure portability.
- Uniform buffers are now the standard way for the application to specify uniforms. Uniform buffers are "emulated" under WebGL.
- The v9 API no longer accepts/returns `GL` constants, but instead uses the corresponding string values from the WebGPU standard (mapping those transparently under WebGL).
- The parameter API has been updated to more closely match the WebGPU API. Also parameters are built into pipelines and not as easy to change in a draw call.

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


## String constants (GL no longer used)

