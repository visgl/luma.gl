# Device

The `Device` class manages the application's connection with the GPU,
providing methods to:

- create GPU resources
- query the capabilities of the GPU
- detect GPU error conditions.

A `Device` instance is created through the `luma.createDevice(...)` method.
Note that the actual `Device` returned by `luma.createDevice()` will be either
a `WebGLDevice` wrapping a WebGL context or a `WebGPUDevice` wrapping a WebGPU device
based on what the run-time environment supports.

The `Device` API is intentionally designed to be similar to the 
WebGPU [`GPUDevice`](https://www.w3.org/TR/webgpu/#gpu-device) class API
with changes to enable a WebGL2 implementation.

## Usage

Create a new `Device`, auto creating a canvas and a new WebGL 2 context. See [`luma.createDevice()`](./luma.md#lumacreatedevice).

```typescript
import {Device} from '@luma.gl/core';
const device = new luma.createDevice({type: 'webgl2', ...}); 
```

Attaching a `Device` to an externally created `WebGL2RenderingContext`.

```typescript
import {Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

const gl = canvas.getContext('webgl2', ...);
const device = Device.attach(gl);

const model = new Model(device, options);
```

Handle GPU disconnections:

```typescript
if (!device.isLost) {
  console.error('Device lost');
}

const {message} = await device.lost;
console.error(message);
```

## Types

### `DeviceProps`

:::tip
This object can also include all [`CanvasContextProps`][canvas-context-props] properties to configure how a new canvas is created. If a canvas is provided, these are ignored.
:::

[canvas-context-props]: ./canvas-context.md#canvascontextprops
[webgl-attributes]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#contextattributes

Specifies props to use when luma creates the device.

| Property                                                | Default                                      | Description                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `id?: string`                                           | `null`                                       | Optional string id, mainly intended for debugging.                                                          |
| `createCanvasContext?: CanvasContextProps` \| `true`    | [CanvasContexProps][canvas-context-props]    | Create a default `CanvasContext` for the new `Device`. `true` creates a context with default props.         |
| `onError?: (error: Error) => unknown`                   | `log.error`                                  | Error handling.                                                                                             |
| `powerPreference?: string`                              | `'high-performance'`                         | `'default' \| 'high-performance' \| 'low-power'` (WebGL).                                                   |
| `webgl?: WebGLContextAttributes`                        | [`WebGLContextAttributes`][webgl-attributes] | Attributes passed on to WebGL (`canvas.getContext('webgl2', props.webgl)`                                   |
| `debug?`: `boolean`                                     | `false`                                      | Extra checks (wait for shader compilation, framebuffer completion, WebGL API errors will throw exceptions). |
| `debugShaders?`: `'errors' 'warnings' 'always' 'never'` | `'error'`                                    | Display shader source code with inline errors in the canvas.                                                |
| `debugFramebuffers?: boolean`                           | `false`                                      | Show small copy of the contents of updated Framebuffers in the canvas.                                      |
| `debugWebGL?: boolean`                                  | `false`                                      | traces WebGL API calls to the console (via Khronos WebGLDeveloperTools).                                    |
| `debugSpectorJS?: boolean`                              | `false`                                      | Initialize the SpectorJS WebGL debugger.                                                                    |
| `debugSpectorJSUrl?: string`                            | CDN url                                      | SpectorJS URL. Override if different SpectorJS version is desired (or if CDN is down).                      |

:::tip
Learn more GPU debugging in our [Debugging](../../developer-guide/debugging.md) guide.
:::

#### WebGLContextAttributes

For detailed control over WebGL context can specify what [`WebGLContextAttributes`][webgl-attributes] to use if luma creates the WebGL context. 

| `WebGLContextAttributes`                 | Default | Description                                                                                            |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `webgl.preserveDrawingBuffers?: boolean` | `true`  | Default render target buffers will preserve their values until overwritten. Useful for screen capture. |
| `webgl.alpha?: boolean`                  | `true`  | Default render target has an alpha buffer.                                                             |
| `webgl.antialias?: boolean`              | `true`  | Boolean that indicates whether or not to perform anti-aliasing.                                        |
| `webgl.depth?: boolean`                  | `true`  | Default render target has a depth buffer of at least `16` bits.                                        |
| `webgl.premultipliedAlpha?: boolean`     | `true`  | The page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.          |
| `webgl.stencil?: boolean`                | `false` | Default render target has a stencil buffer of at least `8` bits.                                       |
| `webgl.desynchronized?: boolean`         | `false` | Hint to reduce latency by desynchronizing the canvas paint cycle from the event loop (WebGL).          |
| `webgl.failIfMajorPerformanceCaveat?`    | `false` | Do not create a Device if the system performance is low (WebGL).                                       |

Note that luma.gl v9.1 and onwards set `webgl.preserveDrawingBuffers` to `true` by default. This can be disabled for some memory savings and a minor performance boost on resource limited devices, such as mobile phones, at the cost of not being able to take screenshots or render to screen without clearing.

## Fields

### id

```typescript
readonly id: string
```

A string identifier, for debug purposes.

### statsManager

```typescript
statsManager: StatsManager
```

Provides access to bags of stats containing information about resource usage and performance of the device.

### props

```typescript
props: Required<DeviceProps>
```

A readonly copy of the props that were used to create this device.

### userData

```typescript
userData: Record<string, any>
```

Reserved for the application.

### info

```typescript
info: DeviceInfo
```

Information about the device (vendor, versions etc).

Get debug information about the device:

| Field                    | Type     | Description                           |
| ------------------------ | -------- | ------------------------------------- |
| `vendor`                 | `string` | GPU vendor (unmasked if possible)     |
| `renderer`               | `string` | Renderer (unmasked if possible)       |
| `version`                | `string` | WebGL version                         |
| `gpu`                    | `string` | GPU name                              |
| `gpuBackend?`            | `string` | `'angle' \| 'metal' \| 'unknown'`     |
| `shadingLanguage`        | `string` | shading language (`'glsl' \| 'wgsl'`) |
| `shadingLanguageVersion` | `number` | shading language version              |

Remarks:
- Shading language version is the highest supported version of the device's shading language.
- Version numbers are calculated as:  `<major version> * 100 + <minor version> * 10 + <patch version>`. 
- The WGSL version is always `100` 
- The GLSL version is always `300` (WebGL2). 
- Sometimes a vendor provides multiple backends (e.g. Apple ANGLE vs Apple Metal)
- WebGPU Devices currently do not provide much information due to limitations in the WebGPU API.
- WebGL Devices can usually provide rich information (through the `WEBGL_debug_renderer_info` extension).

### features

```typescript
features: Set<DeviceFeature>
```

Applications can determine whether the device implements an optional features by checking `device.features.has(...)`.

### limits

```typescript
limits: DeviceLimits
```

An object with various device limits. WebGPU style.

### isTextureFormatSupported

```typescript
isTextureFormatSupported(format: TextureFormat): boolean
```

Check if device supports a specific texture format (creation and `nearest` sampling).

### isTextureFormatFilterable

```typescript
isTextureFormatFilterable(format: TextureFormat): boolean
```

Check if linear filtering (sampler interpolation) is supported for a specific texture format.

### isTextureFormatRenderable

```typescript
isTextureFormatRenderable(format: TextureFormat): boolean
```

Check if device supports rendering to a specific texture format.

### isLost

```typescript
isLost: boolean
```

True if the device is already lost (GPU is disconnected).

### lost

```typescript
lost: Promise<{reason: 'destroyed', message: string}>
```


Promise that resolves with an error message if the device is lost (GPU is disconnected).

:::info
GPU disconnections normally happen when the computer goes to sleep but it can also happen
when too many applications use the GPU, too many `Device` instances are created etc.
:::

:::info
Recovering from a lost GPU device is typically challenging as all GPU resources need to be
recreated. For applications that auto-save state, it may be better to simply reload the page
or ask the user to reload the page.
:::

### canvasContext

```typescript
canvasContext?: CanvasContext
```

Returns the default [`CanvasContext`](./canvas-context).

Note that a WebGPU `Device` may not have a canvas context.

## Methods

### constructor

:::info
`Device` is an abstract class and the constructor should not be called directly.
Use the static `Device.create()` method to create classes.
:::

### destroy()

Releases resources associated with this `Device`.

:::info
WebGPU only. Calling `device.destroy()` on a WebGL `Device` will not immediately release GPU resources. 
The WebGL API does not provide a context destroy function,
instead relying on garbage collection to eventually release the resources.
:::

:::caution
Interaction between `Device.destroy()`, `Device.lost` and `Device.isLost` is implementation-dependent.
The application should not assume that destroying a device triggers a device loss, 
or that the `lost` promise is resolved before any API errors are triggered by access to the destroyed device.
:::

### createCanvasContext()

```typescript
createCanvasContext(props?: CanvasContextProps): CanvasContext
```

Creates a new [`CanvasContext`](./canvas-context).

:::info
WebGPU only. WebGL devices can only render into the canvas they were created with.
:::

### getDefaultCanvasContext()

```typescript
getDefaultCanvasContext(): CanvasContext
```

- Returns the primary / default canvas context of a device.
- Throws an error if no canvas context is available (a WebGPU compute device).

In TypeScript applications this helps applications avoid having to repeatedly check if `device.canvasContext` is null, otherwise the two are equivalent.

### submit

```typescript
submit(): void
```

The application should call `device.submit()` after rendering of a frame is complete 
to ensure that the generated command queue is submitted to the GPU.

### createBuffer

```typescript
createBuffer(props: BufferProps): Buffer
createBuffer(data: ArrayBuffer | ArrayBufferView): Buffer
```

Creates a [`Buffer`](./resources/buffer) used to manage memory on the GPU.

Deduces `indexType` if usage.

### createTexture

```typescript
createTexture(props: TextureProps): Texture
createTexture(data: Promise<TextureData>): Texture
```

Creates a [`Texture`](./resources/texture), used to manage image data memory on the GPU.

### createSampler

```typescript
createSampler(props: SamplerProps): Sampler
```

Creates a [`Sampler`](./resources/sampler).

### createFramebuffer

```typescript
createFramebuffer(props: FramebufferProps): Framebuffer
```

Creates a [`Framebuffer`](./resources/framebuffer).

### createShader

```typescript
createShader(props: ShaderProps): Shader
```

Creates a [`Shader`](./resources/shader).

### createRenderPipeline

```typescript
createRenderPipeline(props: RenderPipelineProps): RenderPipeline
```

Creates a [`RenderPipeline`](./resources/render-pipeline) (aka program)

### createComputePipeline

```typescript
createComputePipeline(props: ComputePipelineProps): ComputePipeline
```

Creates a [`ComputePipeline`](./resources/compute-pipeline) (aka program)

### beginRenderPass

```typescript
beginRenderPass(props: RenderPassProps): RenderPass
```

Creates a [`RenderPass`](./resources/render-pass).

- `props.framebuffer` If omitted, renders into the default canvas context's default framebuffer.

### beginComputePass

```typescript
beginComputePass(props?: ComputePassProps): ComputePass
```

Creates a [`ComputePass`](./resources/compute-pass) which can be used to bind data and run compute operations using compute pipelines.

### loseDevice

```typescript
loseDevice(): boolean
```

Triggers device loss (see below). After this call, the `Device.lost` promise will be resolved with an error message and `Device.isLost` will be set to true.

- Returns `true` if an actual or emulated device loss was triggered, `false` otherwise. Note that even if device loss emulation is not supported by the platform this function will still update the `Device` instance to indicate that the device was lost, however the device can still be used.


:::note
The `loseDevice()` method is primarily intended for debugging of device loss handling and should not be relied upon for production code. 
`loseDevice()` can currently only emulate context loss on WebGL devices on platform's where WebGL API provides the required `WEBGL_lose_context` WebGL debug extension. 
:::
