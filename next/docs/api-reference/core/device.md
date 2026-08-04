# Device

[luma](https://luma.gl/next/docs/api-reference/core/luma.md)[Adapter](https://luma.gl/next/docs/api-reference/core/adapter.md)[Device](https://luma.gl/next/docs/api-reference/core/device.md)[DeviceInfo](https://luma.gl/next/docs/api-reference/core/device-info.md)[DeviceLimits](https://luma.gl/next/docs/api-reference/core/device-limits.md)[DeviceFeatures](https://luma.gl/next/docs/api-reference/core/device-features.md)

The `Device` class manages the application's connection with the GPU, providing methods to:

* create GPU resources
* query the capabilities of the GPU
* detect GPU error conditions.

A `Device` instance is created through the `luma.createDevice(...)` method. Note that the actual `Device` returned by `luma.createDevice()` will be either a `WebGLDevice` wrapping a WebGL context or a `WebGPUDevice` wrapping a WebGPU device based on what the run-time environment supports.

The `Device` API is intentionally designed to be similar to the WebGPU [`GPUDevice`](https://www.w3.org/TR/webgpu/#gpu-device) class API with changes to enable a WebGL2 implementation.

## Usage[​](#usage "Direct link to Usage")

Create a new `Device`, auto creating a canvas and a new WebGL 2 context. See [`luma.createDevice()`](https://luma.gl/next/docs/api-reference/core/luma.md#lumacreatedevice).

```
import {Device} from '@luma.gl/core';

const device = new luma.createDevice({type: 'webgl2', ...});
```

Attaching a `Device` to an externally created `WebGL2RenderingContext`.

```
import {Device} from '@luma.gl/core';

import {Model} from '@luma.gl/engine';



const gl = canvas.getContext('webgl2', ...);

const device = Device.attach(gl);



const model = new Model(device, options);
```

Handle GPU disconnections:

```
if (!device.isLost) {

  console.error('Device lost');

}



const {message} = await device.lost;

console.error(message);
```

## Types[​](#types "Direct link to Types")

### `DeviceProps`[​](#deviceprops "Direct link to deviceprops")

tip

This object can also include all [`CanvasContextProps`](https://luma.gl/next/docs/api-reference/core/canvas-context.md#canvascontextprops) properties to configure how a new canvas is created. If a canvas is provided, these are ignored.

Specifies props to use when luma creates the device.

| Property                                                                | Default                                                                                                                     | Description                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id?: string`                                                           | `null`                                                                                                                      | Optional string id, mainly intended for debugging.                                                                                                                                                                                                                                                          |
| `createCanvasContext?: CanvasContextProps` \| `true`                    | [CanvasContexProps](https://luma.gl/next/docs/api-reference/core/canvas-context.md#canvascontextprops)                 | Create a default `CanvasContext` for the new `Device`. `true` creates a context with default props.                                                                                                                                                                                                         |
| `powerPreference?: string`                                              | `'high-performance'`                                                                                                        | `'default' \| 'high-performance' \| 'low-power'` (WebGL).                                                                                                                                                                                                                                                   |
| `featureLevel?: 'core' \| 'max' \| 'compatibility' \| 'best-available'` | `'core'`                                                                                                                    | WebGPU feature/limit profile to request. `'core'` is the portable default; `'max'` requests every supported adapter feature and limit; `'compatibility'` opts into compatibility mode; `'best-available'` upgrades a compatibility adapter to core when available. WebGL and null devices ignore this prop. |
| `failIfMajorPerformanceCaveat?: boolean`                                | `false`                                                                                                                     | Fail device creation if only a low-performance or software GPU is available.                                                                                                                                                                                                                                |
| `webgl?: WebGLContextAttributes`                                        | [`WebGLContextAttributes`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#contextattributes) | Attributes passed on to WebGL (`canvas.getContext('webgl2', props.webgl)`                                                                                                                                                                                                                                   |
| `onError?: (error: Error) => unknown`                                   | `log.error()`                                                                                                               | Called if an unhandled error is generated by luma.gl.                                                                                                                                                                                                                                                       |
| `onResize?: (ctx: CanvasContext)`                                       | `log.info(1)`                                                                                                               | Called if the size of the "device pixel content box" changes.                                                                                                                                                                                                                                               |
| `onPositionChange?: (ctx: CanvasContext) => unknown`                    | `log.info(1)`                                                                                                               | Called if the canvas position changes. Requires `CanvasContextProps.trackPosition` to be enabled.                                                                                                                                                                                                           |
| `onVisibilityChange?: (ctx: CanvasContext)`                             | `log.info(1)`                                                                                                               | Called if the visibility of the canvas changes (window is closed or occluded).                                                                                                                                                                                                                              |
| `onDevicePixelRatioChange?: (ctx: CanvasContext)`                       | `log.info(1)`                                                                                                               | Called if the DPR changes (perhaps by moving the window to another screen                                                                                                                                                                                                                                   |
| `debug?`: `boolean`                                                     | `false`                                                                                                                     | Extra checks (wait for shader compilation, framebuffer completion, WebGL API errors will throw exceptions).                                                                                                                                                                                                 |
| `debugGPUTime?: boolean`                                                | `false`                                                                                                                     | Enable GPU timestamp collection without enabling all debug validation paths.                                                                                                                                                                                                                                |
| `debugShaders?`: `'errors' 'warnings' 'always' 'never'`                 | `'error'`                                                                                                                   | Display shader source code with inline errors in the canvas.                                                                                                                                                                                                                                                |
| `debugFramebuffers?: boolean`                                           | `false`                                                                                                                     | Show small copy of the contents of updated Framebuffers in the canvas.                                                                                                                                                                                                                                      |
| `debugFactories?: boolean`                                              | `false`                                                                                                                     | Log pipeline-factory cache create/reuse/release activity.                                                                                                                                                                                                                                                   |
| `debugWebGL?: boolean`                                                  | `false`                                                                                                                     | traces WebGL API calls to the console (via Khronos WebGLDeveloperTools).                                                                                                                                                                                                                                    |
| `debugSpectorJS?: boolean`                                              | `false`                                                                                                                     | Initialize the SpectorJS WebGL debugger.                                                                                                                                                                                                                                                                    |
| `debugSpectorJSUrl?: string`                                            | CDN url                                                                                                                     | SpectorJS URL. Override if different SpectorJS version is desired (or if CDN is down).                                                                                                                                                                                                                      |

tip

Learn more GPU debugging in our [Debugging](https://luma.gl/next/docs/developer-guide/debugging.md) guide.

#### Internal caching props[​](#internal-caching-props "Direct link to Internal caching props")

These props are primarily intended for internal tuning and testing of factory-managed resource reuse.

| Property                      | Default | Description                                                                                                                                                                                                                                                                            |
| ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_cacheShaders?: boolean`     | `true`  | Enable shader caching through [`ShaderFactory`](https://luma.gl/next/docs/api-reference/core/shader-factory.md).                                                                                                                                                                  |
| `_destroyShaders?: boolean`   | `false` | Destroy cached shaders when their factory reference count reaches zero. Keep this `false` by default so repeated create/destroy cycles can still hit the shader cache; enable it when an application creates very large numbers of distinct shaders and needs eviction.                |
| `_cachePipelines?: boolean`   | `true`  | Enable [`PipelineFactory`](https://luma.gl/next/docs/api-reference/core/pipeline-factory.md) wrapper caching.                                                                                                                                                                     |
| `_sharePipelines?: boolean`   | `true`  | When pipeline caching is enabled, allow compatible WebGL render-pipeline wrappers to share a linked `WebGLProgram`. See [`PipelineFactory`](https://luma.gl/next/docs/api-reference/core/pipeline-factory.md) for the distinction between wrapper reuse and shared-program reuse. |
| `_destroyPipelines?: boolean` | `false` | Destroy cached pipelines when their factory reference count reaches zero. Keep this `false` by default so repeated create/destroy cycles can still hit the pipeline cache; enable it when an application creates very large numbers of distinct pipelines and needs eviction.          |

#### WebGLContextAttributes[​](#webglcontextattributes "Direct link to WebGLContextAttributes")

For detailed control over WebGL context can specify what [`WebGLContextAttributes`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#contextattributes) to use if luma creates the WebGL context.

| `WebGLContextAttributes`                 | Default | Description                                                                                                                                                                |
| ---------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webgl.preserveDrawingBuffers?: boolean` | `true`  | Default render target buffers will preserve their values until overwritten. Useful for screen capture.                                                                     |
| `webgl.alpha?: boolean`                  | `true`  | Default render target has an alpha buffer.                                                                                                                                 |
| `webgl.antialias?: boolean`              | `true`  | Best-effort request to antialias the WebGL default drawing buffer. See [Antialiasing and Multisampling](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md). |
| `webgl.depth?: boolean`                  | `true`  | Default render target has a depth buffer of at least `16` bits.                                                                                                            |
| `webgl.premultipliedAlpha?: boolean`     | `true`  | The page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.                                                                              |
| `webgl.stencil?: boolean`                | `false` | Default render target has a stencil buffer of at least `8` bits.                                                                                                           |
| `webgl.desynchronized?: boolean`         | `false` | Hint to reduce latency by desynchronizing the canvas paint cycle from the event loop (WebGL).                                                                              |
| `webgl.failIfMajorPerformanceCaveat?`    | `false` | Do not create a Device if the system performance is low (WebGL).                                                                                                           |

Note that luma.gl v9.1 and onwards set `webgl.preserveDrawingBuffers` to `true` by default. This can be disabled for some memory savings and a minor performance boost on resource limited devices, such as mobile phones, at the cost of not being able to take screenshots or render to screen without clearing.

## Fields[​](#fields "Direct link to Fields")

### id[​](#id "Direct link to id")

```
readonly id: string
```

A string identifier, for debug purposes.

### statsManager[​](#statsmanager "Direct link to statsManager")

```
statsManager: StatsManager;
```

Provides access to bags of stats containing information about resource usage and performance of the device.

### props[​](#props "Direct link to props")

```
props: Required<DeviceProps>;
```

A readonly copy of the props that were used to create this device.

### userData[​](#userdata "Direct link to userData")

```
userData: Record<string, any>;
```

Reserved for the application.

### info[​](#info "Direct link to info")

```
info: DeviceInfo;
```

Information about the device (vendor, versions etc).

Get debug information about the device:

| Field                    | Type                                 | Description                           |
| ------------------------ | ------------------------------------ | ------------------------------------- |
| `vendor`                 | `string`                             | GPU vendor (unmasked if possible)     |
| `renderer`               | `string`                             | Renderer (unmasked if possible)       |
| `version`                | `string`                             | WebGL version                         |
| `gpu`                    | `string`                             | GPU name                              |
| `gpuBackend?`            | `string`                             | `'angle' \| 'metal' \| 'unknown'`     |
| `featureLevel?`          | `'core' \| 'max' \| 'compatibility'` | Effective WebGPU feature level.       |
| `shadingLanguage`        | `string`                             | shading language (`'glsl' \| 'wgsl'`) |
| `shadingLanguageVersion` | `number`                             | shading language version              |

Remarks:

* Shading language version is the highest supported version of the device's shading language.
* Version numbers are calculated as: `<major version> * 100 + <minor version> * 10 + <patch version>`.
* The WGSL version is always `100`
* The GLSL version is always `300` (WebGL2).
* Sometimes a vendor provides multiple backends (e.g. Apple ANGLE vs Apple Metal)
* WebGPU Devices currently do not provide much information due to limitations in the WebGPU API.
* WebGL Devices can usually provide rich information (through the `WEBGL_debug_renderer_info` extension).
* Use `device.info.featureLevel === 'compatibility'` to detect a WebGPU compatibility-mode device.

### features[​](#features "Direct link to features")

```
features: Set<DeviceFeature>;
```

Applications can determine whether the device implements an optional features by checking `device.features.has(...)`.

### limits[​](#limits "Direct link to limits")

```
limits: DeviceLimits;
```

An object with various device limits. WebGPU style.

### isTextureFormatSupported[​](#istextureformatsupported "Direct link to isTextureFormatSupported")

```
isTextureFormatSupported(format: TextureFormat): boolean
```

Check if device supports a specific texture format (creation and `nearest` sampling).

### isTextureFormatFilterable[​](#istextureformatfilterable "Direct link to isTextureFormatFilterable")

```
isTextureFormatFilterable(format: TextureFormat): boolean
```

Check if linear filtering (sampler interpolation) is supported for a specific texture format.

### isTextureFormatRenderable[​](#istextureformatrenderable "Direct link to isTextureFormatRenderable")

```
isTextureFormatRenderable(format: TextureFormat): boolean
```

Check if device supports rendering to a specific texture format.

### isLost[​](#islost "Direct link to isLost")

```
isLost: boolean;
```

True if the device is already lost (GPU is disconnected).

### lost[​](#lost "Direct link to lost")

```
lost: Promise<{reason: 'destroyed'; message: string}>;
```

Promise that resolves with an error message if the device is lost (GPU is disconnected).

info

GPU disconnections normally happen when the computer goes to sleep but it can also happen when too many applications use the GPU, too many `Device` instances are created etc.

info

Recovering from a lost GPU device is typically challenging as all GPU resources need to be recreated. For applications that auto-save state, it may be better to simply reload the page or ask the user to reload the page.

### canvasContext[​](#canvascontext "Direct link to canvasContext")

```
canvasContext?: CanvasContext
```

Returns the default [`CanvasContext`](https://luma.gl/next/docs/api-reference/core/canvas-context.md).

Note that a WebGPU `Device` may not have a canvas context.

## Methods[​](#methods "Direct link to Methods")

### constructor[​](#constructor "Direct link to constructor")

info

`Device` is an abstract class and the constructor should not be called directly. Use the static `Device.create()` method to create classes.

### destroy()[​](#destroy "Direct link to destroy()")

Releases resources associated with this `Device`.

info

Calling `device.destroy()` releases GPU resources immediately on WebGPU. On WebGL it will not immediately release GPU resources. The WebGL API does not provide a context destroy function, instead relying on garbage collection to eventually release the resources.

caution

Interaction between `Device.destroy()`, `Device.lost` and `Device.isLost` is implementation-dependent. The application should not assume that destroying a device triggers a device loss, or that the `lost` promise is resolved before any API errors are triggered by access to the destroyed device.

### createCanvasContext()[​](#createcanvascontext "Direct link to createCanvasContext()")

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

```
createCanvasContext(props?: CanvasContextProps): CanvasContext
```

Creates a new [`CanvasContext`](https://luma.gl/next/docs/api-reference/core/canvas-context.md). WebGL devices can only render into the canvas they were created with.

### createPresentationContext()[​](#createpresentationcontext "Direct link to createPresentationContext()")

![From-v9.3](https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Experimental-orange.svg?style=flat-square)

```
createPresentationContext(props?: PresentationContextProps): PresentationContext
```

Creates a new [`PresentationContext`](https://luma.gl/next/docs/api-reference/core/presentation-context.md) for multi-canvas presentation.

Experimental

`createPresentationContext()` is experimental and may change in a future release.

info

For portable WebGL and WebGPU multi-canvas rendering, create the device with a default `CanvasContext` backed by an `OffscreenCanvas`.

info

On WebGL, all `PresentationContext` instances on a device share the device's default `CanvasContext` as the actual GPU render target, so they must be used sequentially.

### getDefaultCanvasContext()[​](#getdefaultcanvascontext "Direct link to getDefaultCanvasContext()")

```
getDefaultCanvasContext(): CanvasContext
```

* Returns the primary / default canvas context of a device.
* Throws an error if no canvas context is available (a WebGPU compute device).

In TypeScript applications this helps applications avoid having to repeatedly check if `device.canvasContext` is null, otherwise the two are equivalent.

### submit[​](#submit "Direct link to submit")

```
submit(): void
```

The application should call `device.submit()` after rendering of a frame is complete to ensure that the generated command queue is submitted to the GPU.

See [GPU Commands](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md) for when `submit()` is required, how it relates to `CommandEncoder.finish()`, and why WebGL and WebGPU differ here.

### createBuffer[​](#createbuffer "Direct link to createBuffer")

```
createBuffer(props: BufferProps): Buffer

createBuffer(data: ArrayBuffer | ArrayBufferView): Buffer
```

Creates a [`Buffer`](https://luma.gl/next/docs/api-reference/core/resources/buffer.md) used to manage memory on the GPU. See [`BufferProps`](https://luma.gl/next/docs/api-reference/core/resources/buffer.md#bufferprops) for available options.

Deduces `indexType` if usage.

### createTexture[​](#createtexture "Direct link to createTexture")

```
createTexture(props: TextureProps): Texture

createTexture(data: Promise<TextureData>): Texture
```

Creates a [`Texture`](https://luma.gl/next/docs/api-reference/core/resources/texture.md), used to manage image data memory on the GPU. See [`TextureProps`](https://luma.gl/next/docs/api-reference/core/resources/texture.md#textureprops) for available options.

### createSampler[​](#createsampler "Direct link to createSampler")

```
createSampler(props: SamplerProps): Sampler
```

Creates a [`Sampler`](https://luma.gl/next/docs/api-reference/core/resources/sampler.md). See [`SamplerProps`](https://luma.gl/next/docs/api-reference/core/resources/sampler.md#samplerprops) for available options.

### createFramebuffer[​](#createframebuffer "Direct link to createFramebuffer")

```
createFramebuffer(props: FramebufferProps): Framebuffer
```

Creates a [`Framebuffer`](https://luma.gl/next/docs/api-reference/core/resources/framebuffer.md). See [`FramebufferProps`](https://luma.gl/next/docs/api-reference/core/resources/framebuffer.md#framebufferprops) for available options.

### createShader[​](#createshader "Direct link to createShader")

```
createShader(props: ShaderProps): Shader
```

Creates a [`Shader`](https://luma.gl/next/docs/api-reference/core/resources/shader.md). See [`ShaderProps`](https://luma.gl/next/docs/api-reference/core/resources/shader.md#shaderprops) for available options.

### createRenderPipeline[​](#createrenderpipeline "Direct link to createRenderPipeline")

```
createRenderPipeline(props: RenderPipelineProps): RenderPipeline
```

Creates a [`RenderPipeline`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md) (aka program). See [`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md#renderpipelineprops) for available options.

### createComputePipeline[​](#createcomputepipeline "Direct link to createComputePipeline")

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

```
createComputePipeline(props: ComputePipelineProps): ComputePipeline
```

Creates a [`ComputePipeline`](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md) (aka program). See [`ComputePipelineProps`](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md#computepipelineprops) for available options.

### createRenderBundleEncoder[​](#createrenderbundleencoder "Direct link to createRenderBundleEncoder")

![From-v9.4](https://img.shields.io/badge/From-v9.4-blue.svg?style=flat-square)![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

```
createRenderBundleEncoder(props?: RenderBundleEncoderProps): RenderBundleEncoder
```

Creates a reusable render command encoder. Call `finish()` on the encoder, then replay the returned bundle from a `RenderPass` with `executeBundles()`.

### createFence[​](#createfence "Direct link to createFence")

```
createFence(): Fence
```

Creates a [`Fence`](https://luma.gl/next/docs/api-reference/core/resources/fence.md) used to wait for completion of submitted GPU work. See [`FenceProps`](https://luma.gl/next/docs/api-reference/core/resources/fence.md#fenceprops) for available options.

### beginRenderPass[​](#beginrenderpass "Direct link to beginRenderPass")

```
beginRenderPass(props: RenderPassProps): RenderPass
```

Creates a [`RenderPass`](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md). See [`RenderPassProps`](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md#renderpassprops) for available options.

* `props.framebuffer` If omitted, renders into the default canvas context's default framebuffer.
* See [GPU Commands](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md) for the difference between pass recording on WebGPU and best-effort immediate behavior on WebGL.

### beginComputePass[​](#begincomputepass "Direct link to beginComputePass")

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

```
beginComputePass(props?: ComputePassProps): ComputePass
```

Creates a [`ComputePass`](https://luma.gl/next/docs/api-reference/core/resources/compute-pass.md) which can be used to bind data and run compute operations using compute pipelines. See [`ComputePassProps`](https://luma.gl/next/docs/api-reference/core/resources/compute-pass.md#computepassprops) for available options.

See [GPU Commands](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md) for how compute work is recorded and submitted.

### loseDevice[​](#losedevice "Direct link to loseDevice")

```
loseDevice(): boolean
```

Triggers device loss (see below). After this call, the `Device.lost` promise will be resolved with an error message and `Device.isLost` will be set to true.

* Returns `true` if an actual or emulated device loss was triggered, `false` otherwise. Note that even if device loss emulation is not supported by the platform this function will still update the `Device` instance to indicate that the device was lost, however the device can still be used.

note

The `loseDevice()` method is primarily intended for debugging of device loss handling and should not be relied upon for production code. `loseDevice()` can currently only emulate context loss on WebGL devices on platform's where WebGL API provides the required `WEBGL_lose_context` WebGL debug extension.
