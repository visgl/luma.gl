# CanvasContext

A `CanvasContext` holds a connection between a GPU `Device` and canvas, (either an HTML `<canvas />` element, aka `HTMLCanvasELement`, or an `OffscreenCanvas`).

- A `CanvasContext` enables the application to render into the associated canvas, by acting as a source of `Framebuffer`s with special `Texture` color attachments that are copied to the screen at the end of a `RenderPass`.
- It handles canvas resizing, making sure the returned `Framebuffer`s correspond to the current size of the canvas.
- It also provides support for device pixel ratios (mapping between device pixels and CSS pixels)

## Usage

The luma.gl API is designed to allow a `Device` to create multiple associated `CanvasContext`s (or none, if only used for compute).

```ts
const device = await luma.createDevice(...);
const canvasContext1 = device.createCanvasContext(...);
const canvasContext2 = device.createCanvasContext(...);
```

However this is only supported on WebGPU. A WebGL `Device` always has exactly one `CanvasContext` that must be created when the device is created, and a WebGL device can only render into that single canvas. (This is a fundamental limitation of the WebGL API, outside of luma.gl's control). 

Because of this, the `Device` class provides a `DeviceProps.createCanvasContext` property that creates a default `CanvasContext`:

```ts
const device = await luma.createDevice({createCanvasContext: true});
const canvasContext = device.getDefaultCanvasContext()
```

The application can also provide properties for the default `CanvasContext`:

```ts
const device = await luma.createDevice({createCanvasContext: {width, height}}); // Creates a new HTML canvas and adds it to document.body.
const canvasContext = device.getDefaultCanvasContext()
```

A `CanvasContext` can be associated with an existing canvas:

```ts
const device = await luma.createDevice({createCanvasContext: {canvas: document.getElementById('canvas-id')}}); // Creates a new HTML canvas and adds it to document.body.
const canvasContext = device.getDefaultCanvasContext()
```

Use a device's default canvas context to render into the associated canvas

```typescript
const renderPass = device.beginRenderPass({});
```

This is equivalent to
```ts
const renderPass = device.beginRenderPass({
  framebuffer: device.getDefaultCanvasContext().getFramebuffer()
});
```

Rendering into  additional canvas contexts (WebGPU only):

```typescript
const newCanvasContext = device.createCanvasContext({canvas: ...});
const renderPass = device.beginRenderPass({
  framebuffer: newCanvasContext.getFramebuffer()
});
```

On high-DPI screens, the number of pixels in a canvas can be a multiple of the "CSS size" reported by HTMLCanvasElement. Because of this, luma.gl allows the resolution of the textures returned by `canvasContext.getFramebuffer` to be controlled. The `CanvasContextProps.useDevicePixels` prop if set to `true`, multiples the canvas HTML size with the system device pixel ratio. This prop can also a custom ratio (`number`), as well. This allows setting the target texture size to higher or lower resolutions that indicated by an HMTLCanvasElements CSS width and height, to ensure that screen renderings use the maximum resolution of the device (at the cost of using more GPU memory).

```typescript
const newCanvasContext = device.createCanvasContext({canvas: ..., useDevicePixels: true});
```

Mote that when using high value (usually more than device pixel ratio), it is possible it can get clamped down outside of luma.gl's control due to system memory limitation, in such cases a warning will be logged to the browser console.

The `CanvasContext` also provides methods for converting between device and CSS pixels, e.g

```ts
canvasContext.getDevicePixelResolution()
```

## Types

### `CanvasContextProps`

| Property               | Type                                                 |                                                                                                                                        |
| ---------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `width?`               | `number`                                             | Width in pixels of the canvas (if `canvas` is not supplied)                                                                            |
| `height?`              | `number`                                             | Height in pixels of the canvas (if `canvas` is not supplied)                                                                           |  |
| `canvas?`              | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | A new canvas will be created if not supplied.                                                                                          |
| `container?`           | `HTMLElement`                                        | Parent DOM element for new canvas. Defaults to first child of `document.body`                                                          |
| `useDevicePixels?`     | `boolean` \| `number`                                | Device pixels scale factor (`true` uses browser DPI)                                                                                   |
| `autoResize?`          | `boolean`                                            | Whether to track resizes                                                                                                               |
| `visible?`             | `boolean`                                            | Visibility (only used if new canvas is created).                                                                                       |
| `alphaMode?: string`   | `'opaque'`                                           | `'opaque' \| 'premultiplied'`. See [alphaMode](https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#alphamode). |
| `colorSpace?: 'string` | `'srgb'`                                             | `'srgb' \| 'display-p3'`. See [colorSpace](https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#colorspace).    |


## Fields

### `canvas: HMTLCanvas | OffscreenCanvas`

### `useDevicePixels: boolean | number`

Whether the framebuffer backing this canvas context is sized using device pixels.

- `false` - Framebuffer is sized according to CSS pixel size.
- `true` - Framebuffer is sized according to the device pixel ratio reported by the browser.
- `number` - Framebuffer is sized according to the provided ratio.

## Methods

### constructor

:::info
A `CanvasContext` should not be constructed directly. Default canvas contexts are created when instantiating a `WebGPUDevice` or a `WebGLDevice` by supplying the `canvasContext` property, and can be accessed through the `device.canvasContext` field.  Additional canvas contexts can be explicitly created through `WebGPUDevice.createCanvasContext(...)`.
:::

On `Device` instances that support it (WebGPU only), additional canvas contexts are created using `device.createCanvasContext()`. Depending on options passed, this either:
- creates a new canvas element with the specified properties,
- or attaches the context to an existing canvas element

### getCurrentFramebuffer(): Framebuffer

Returns a framebuffer with properly resized current 'swap chain' textures. Rendering to this framebuffer will update the canvas associated with that `CanvasContext`. Note that a new `Framebuffer` must be requested on every redraw cycle.

### `getDevicePixelResolution(): [number, number]`

TBA

### `getPixelSize(): [number, number]`

Returns the size in pixels required to cover the canvas at the current device pixel resolution.

### `resize(): void`

Resize the drawing surface. Usually called after the window has been resized. Note that automatic resizing is performed as size changes to the underlying canvas object are detected.

```typescript
canvasContext.resize(options: {width: number, height: number; userDevicePixels})
```

- **width**: New drawing surface width.
- **height**: New drawing surface height.
- **useDevicePixels**: Whether to scale the drawing surface using the device pixel ratio.

