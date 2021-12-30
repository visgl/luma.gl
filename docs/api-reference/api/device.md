# Device

> The luma.gl v9 API is currently in [public review](/docs/public-review).

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

Create a WebGL2 or WebGL context, auto creating a canvas

```typescript
import {Device} from '@luma.gl/api';
const device = new Device(); // Prefers WebGL 2 but falls back to WebGL 1
```

Create a WebGL 2 context (throws if WebGL2 not supported)

```typescript
import {Device} from '@luma.gl/api';
const device = createGLContext({
  webgl1: false
});
```

Attaching a Device to an externally created WebGLRendering context instruments it
so that it works with other luma.gl classes.

```typescript
import {Device} from '@luma.gl/api';
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

| Parameter                       | Default            | Description                                                                                                                                                                   |
| ------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                          | `'best-available'` | `'webgpu`', `'webgl'`, `'webgl1'`, `'webgl2'`                                                                                                                                 |
| `canvas`                        | N/A                | A _string_ `id` of an existing HTML element or a _DOMElement_. If not provided, a new canvas will be created.                                                                 |
| priority.                       |
| `debug?: boolean`               | `false`            | WebGL API calls will be logged to the console and WebGL errors will generate JavaScript exceptions. **NOTE:** requires importing [@luma.gl/debug](/docs/api-reference/debug). |
| `break?: string[]`              | `[]`               | Insert a break point (`debugger`) if one of the listed gl functions is called.                                                                                                |
| `alpha?: boolean`               | `true`             | Default render target has an alpha buffer.                                                                                                                                    |
| `depth?: boolean`               | `true`             | Default render target has a depth buffer of at least `16` bits.                                                                                                               |
| `stencil?`                      | `false`            | Default render target has a stencil buffer of at least `8` bits.                                                                                                              |
| `antialias?`                    | `true`             | Boolean that indicates whether or not to perform anti-aliasing.                                                                                                               |
| `premultipliedAlpha?`           | `true`             | Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.                                                     |
| `preserveDrawingBuffer?`        | `false`            | Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten                                                   |
| `failIfMajorPerformanceCaveat?` | `false`            | Do not create if the system performance is low.                                                                                                                               |

## Static Methods

###` Device.create(props: DeviceProps): Promise<Device>`

Creating device is done with the static `Device.create()` method.

Creates and returns a WebGL context, both in browsers and in Node.js.

```typescript
const device = await Device.create(props);
```

- `props` (_Object_) - key/value pairs containing context creation options

## Fields

### `readonly id: string`

A string identifier, for debug purposes.

### `readonly statsManager: StatsManager`

Provides access to bags of stats containing information about resource usage and performance of the device.

### `readonly props: Required<DeviceProps>`

A readonly copy of the props that were used to create this device.

### `userData: Record<string, any>`

Reserved for the application.

### info: DeviceInfo

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

## Functions

### constructor

`Device` is an abstract class and the constructor can not be called directly.
Use the static `Device.create()` method to create classes.

### `features: Set<DeviceFeature>`

Determine whether the device implements an optional features by checking `device.features.has(...)`.

### `limits: DeviceLimits`

An object with various device limits. WebGPU style.

### `isTextureFormatSupported(format: TextureFormat): boolean`

Check if device supports a specific texture format (creation and `nearest` sampling).

### `isTextureFormatFilterable(format: TextureFormat): boolean`

Check if linear filtering (sampler interpolation) is supported for a specific texture format.

### `isTextureFormatRenderable(format: TextureFormat): boolean`

Check if device supports rendering to a specific texture format.

### `isLost: boolean`

True if the device is already lost (GPU is disconnected).

### `lost: Promise<{reason: 'destroyed', message: string}>`

Promise that resolves with an error message if the device is lost (GPU is disconnected).

GPU disconnections normally happen when the computer goes to sleep but it can also happen
when too many applications use the GPU, too many `Device` instances are created etc.

### `canvasContext: CanvasContext`

Returns the default [`CanvasContext`](./canvas-context).

Note that a WebGPU `Device` may not have a canvas context.

### `createCanvasContext(props?: CanvasContextProps): CanvasContext`

> WebGPU only. (WebGL devices can only render to the single canvas they were created for.)

Creates a new [`CanvasContext`](./canvas-context).

### `submit(): void`

Call after rendering a frame is complete.

### `createBuffer(props: BufferProps): Buffer`

### `createBuffer(data: ArrayBuffer | ArrayBufferView): Buffer`

Create a buffer,

Deduces `indexType` if usage.

### `createTexture(props: TextureProps): Texture`

### `createTexture(data: Promise<TextureData>): Texture`

### `createTexture(url: string): Texture`

Create a [`Texture`](./resources/sampler).

### `createSampler(props: SamplerProps): Sampler`

Create a [`Sampler`](./resources/sampler).

### `createFramebuffer(props: FramebufferProps): Framebuffer`

Create a [`Framebuffer`](./resources/framebuffer).

### `createShader(props: ShaderProps): Shader`

Create a [`Shader`](./resources/shader).

### `createRenderPipeline(props: RenderPipelineProps): RenderPipeline`

Create a [`RenderPipeline`](./resources/render-pipeline) (aka program)

### `createComputePipeline(props: ComputePipelineProps): ComputePipeline`

Create a [`ComputePipeline`](./resources/compute-pipeline) (aka program)

### `beginRenderPass(props: RenderPassProps): RenderPass`

Create a [`RenderPass`](./resources/render-pass).

### `beginComputePass(props?: ComputePassProps): ComputePass`

Create a [`ComputePass`](./resources/compute-pass) which can be used to bind data and run compute operations using compute pipelines.

### `getDefaultRenderPass(): RenderPass`

A default `RenderPass` is provided for applications that don't need to create
multiple or specially configured render passes.

Note that a new default `RenderPass` is returned every animation frame.

## Remarks

- Note that the actual `Device` returned by `Device.create()` will be either
  a `WebGLDevice` wrapping a WebGL context or a `WebGPUDevice` wrapping a WebGPU device
  based on what the run-time environment (ie. browser or Node.js) supports.
- The `Device` API is intentionally similar, but not identical, to the [WebGPU `GPUDevice`](https://www.w3.org/TR/webgpu/#gpu-device) class API.

## WebGL specifics

### isWebGL: boolean

True if the is a WebGL context. Both WebGL 1 and WebGL 2 contexts will be

`device.isWebGL`

Returns true if the context is a WebGL 1 or 2 Context.

### isWebGL2: boolean

Test if an object is a WebGL context.

`device.isWebGL2`

Returns true if the context is a WebGL 2 Context.
