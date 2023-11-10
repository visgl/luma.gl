# Device

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

The `Device` class manages the application's connection with the GPU,
providing methods to:

- create GPU resources
- query the capabilities of the GPU
- detect error conditions.

A `Device` is created through static `Device.create(...)` method.

Note that the actual `Device` returned by `Device.create()` will be either
a `WebGLDevice` wrapping a WebGL context or a `WebGPUDevice` wrapping a WebGPU device
based on what the run-time environment (ie. browser or Node.js) supports.

## Usage

Creates a WebGL2 or WebGL context, auto creating a canvas

```typescript
import {Device} from '@luma.gl/core';
const device = new Device(); // Prefers WebGL 2 but falls back to WebGL 1
```

Creates a WebGL 2 context (throws if WebGL2 not supported)

```typescript
import {Device} from '@luma.gl/core';
const device = createGLContext({
  webgl1: false
});
```

Attaching a Device to an externally created WebGLRendering context instruments it
so that it works with other luma.gl classes.

```typescript
import {Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

const device = Device.attach(gl); // "instruments" the external context

// Instrumentation ensures the context works with higher-level classes.
const model = new Model(gl, options);
```

Attaching a device to a WebGL1 context adds WebGL2 "polyfills" to the WebGLRendering context
extends that context with a subset of WebGL2 APIs that are available via WebGL extensions.

```typescript
const gl = canvas.createContext('webgl'); // A WebGL 1 context
const device = Device.attach(gl);

// Can now use a subset of WebGL2 APIs on
const vao = device.gl.createVertexArray();
```

Handle GPU disconnections:

```typescript
if (!device.isLost) {
  ...
}

const {message} = await device.lost;
console.error(message);
```

## Types

### `DeviceProps`

| Parameter                       | Default            | Description                                                                                                                 |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `type`                          | `'best-available'` | `'webgpu`', `'webgl'`, `'webgl1'`, `'webgl2'`                                                                               |
| `canvas`                        | N/A                | A _string_ `id` of an existing HTML element or a _DOMElement_. If not provided, a new canvas will be created.               |
| priority.                       |
| `debug?: boolean`               | `false`            | WebGL API calls will be logged to the console and WebGL errors will generate JavaScript exceptions.                         |
| `break?: string[]`              | `[]`               | Insert a break point (`debugger`) if one of the listed gl functions is called.                                              |
| `alpha?: boolean`               | `true`             | Default render target has an alpha buffer.                                                                                  |
| `depth?: boolean`               | `true`             | Default render target has a depth buffer of at least `16` bits.                                                             |
| `stencil?`                      | `false`            | Default render target has a stencil buffer of at least `8` bits.                                                            |
| `antialias?`                    | `true`             | Boolean that indicates whether or not to perform anti-aliasing.                                                             |
| `premultipliedAlpha?`           | `true`             | Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.   |
| `preserveDrawingBuffer?`        | `false`            | Default render target buffers will preserve their values until cleared or overwritten. Useful for screen capture. |
| `failIfMajorPerformanceCaveat?` | `false`            | Do not create if the system performance is low.                                                                             |

## Static Methods

### create

```typescript
Device.create(props: DeviceProps): Promise<Device>
```

Creating device is done with the static `Device.create()` method.
Creates and returns a WebGL context, both in browsers and in Node.js.

```typescript
const device = await Device.create(props);
```

- `props` (_Object_) - key/value pairs containing context creation options

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

Get debug information about the device

| Field                    | Type     | Description                       |
| ------------------------ | -------- | --------------------------------- |
| `vendor`                 | `string` | GPU vendor (unmasked if possible) |
| `renderer`               | `string` | Renderer (unmasked if possible)   |
| `version`                | `string` | WebGL version                     |
| `shadingLanguageVersion` | `string` | shading language version          |

Remarks:

- WebGPU Devices currently do not provide much information due to limitations in the WebGPU API.
- WebGL Devices can usually provide the full set of information (through the `WEBGL_debug_renderer_info` extension).

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
Whether destroying a device actually releases resources depends on the underlying `Device` implementation in use.
- WebGL does not have a context destroy function.
- However, if headless gl is running the destroy extension will be called.
:::

:::info
Interaction between `Device.destroy()`, `Device.lost` and `Device.isLost` is implementation-dependent.
Whether destroying a device trigger a device loss, the order of isLost promise resolution versus API errors caused by destroyed device etc, should not be relied upon.
:::

### createCanvasContext()

```typescript
createCanvasContext(props?: CanvasContextProps): CanvasContext
```
:::info
WebGPU only. (WebGL devices can only render into the canvas they were created with).
:::

Creates a new [`CanvasContext`](./canvas-context).

### getCanvasContext()

```typescript
getCanvasContext(): CanvasContext
```

Returns the primary canvas context of a device.
In TypeScript applications this helps applications avoid having to repeatedly check if `device.canvasContext` is null,
otherwise the two are equivalent.

Throws an error if no canvas context is available (a WebGPU compute device).


### submit

```typescript
submit(): void
```

Call after rendering a frame is complete.

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

### beginComputePass

```typescript
beginComputePass(props?: ComputePassProps): ComputePass
```

Creates a [`ComputePass`](./resources/compute-pass) which can be used to bind data and run compute operations using compute pipelines.

### getDefaultRenderPass

```typescript
getDefaultRenderPass(): RenderPass
```

A default `RenderPass` is provided for applications that don't need to create
multiple or specially configured render passes.

Note that a new default `RenderPass` is returned every animation frame.

## Remarks

- Note that the actual `Device` returned by `Device.create()` can be either
  a `WebGLDevice` wrapping a WebGL context or a `WebGPUDevice` wrapping a WebGPU device
  based on what the run-time environment (ie. browser or Node.js) supports.
- The `Device` API is intentionally similar, but not identical, to the [WebGPU `GPUDevice`](https://www.w3.org/TR/webgpu/#gpu-device) class API.

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

## WebGL specific fields

### isWebGL

```typescript
isWebGL: boolean
```

`true` if the context is a WebGL 1 or 2 Context.

### isWebGL2

```typescript
isWebGL2: boolean
```

Test if an object is a WebGL context.

Returns `true` if the context is a WebGL 2 Context.

