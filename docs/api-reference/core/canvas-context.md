# CanvasContext

A `CanvasContext` holds a connection between a GPU `Device` and an HTML `canvas` or `OffscreenCanvas` into which it can render.
a `CanvasContext` handles the following responsibilities:

- A source of `Framebuffer`s that will render into the display.
- Handles canvas resizing
- Manages device pixel ratio (mapping between device and CSS pixels)

## Usage

Use a device's default canvas context:

```typescript
const renderPass = device.beginRenderPass({});
// or
const renderPass = device.beginRenderPass({
  framebuffer: device.getCanvasContext().getFramebuffer()
});
```

Create additional canvas contexts (WebGPU only):

```typescript
const canvasContext2 = device.createCanvasContext({canvas: ...});
const renderPass = device.beginRenderPass({
  framebuffer: canvasContext2.getFramebuffer()
});

const renderPass = device.beginRenderPass({
  framebuffer: canvasContext2.getFramebuffer()
});

```

## Types

### `CanvasContextProps`

| Property                | Type                                                 |                                                                               |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `canvas?`               | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | A new canvas will be created if not supplied.                                 |
| `container?`            | `HTMLElement`                                        | Parent DOM element for new canvas. Defaults to first child of `document.body` |
| `width?`                | `number`                                             | Width in pixels of the canvas                                                 |
| `height?`               | `number`                                             | Height in pixels of the canvas                                                |
| `useDevicePixels?`      | `boolean` \| `number`                                | Device pixels scale factor (`true` uses browser DPI)                          |
| `autoResize?`           | `boolean`                                            | Whether to track resizes                                                      |
| `visible?`              | `boolean`                                            | Visibility (only used if new canvas is created).                              |
| `alphaMode?: string`    | `'opaque'`         | `'opaque' \| 'premultiplied'`. See [alphaMode](https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#alphamode). |
| `colorSpace?: 'string`  | `'srgb'`           | `'srgb' \| 'display-p3'`. See [colorSpace](https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#colorspace). |


## Static Fields

### `CanvasContext.isPageLoaded: boolean`

A boolean that indicates if the web page has been loaded. This is sometimes useful as a canvas element specified in the page HTML will not be available until the page has loaded.

### `CanvasContext.pageLoaded: Promise<void>`

A promise that resolves when the page is loaded.

```typescript
  await CanvasContex.isPageLoaded;
  const canvas = document.getElementById('canvas');
```

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

On `Device` instances that support it (see [remarks](#remarks) below) additional canvas contexts are created using `device.createCanvasContext()`. Depending on options passed, this either:
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

## Remarks

- A WebGPU `Device` can have multiple associated `CanvasContext` instances (or none, if only used for compute).
- A WebGL `Device` always has exactly one `CanvasContext` and can only render into that single canvas. (This is a fundamental limitation of the WebGL API.)
- `useDevicePixels` can accept a custom ratio (`number`), instead of `true` or `false`. This allows rendering to a smaller or higher resolutions. When using high value (usually more than device pixel ratio), it is possible it can get clamped down outside of luma.gl's control due to system memory limitation, in such cases a warning will be logged to the browser console.
