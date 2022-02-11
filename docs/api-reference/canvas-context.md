# CanvasContext

> The luma.gl v9 API is currently in [public review](/docs/open-governance).

A `CanvasContext` holds a connection between the GPU `Device` and an HTML `canvas` or `OffscreenCanvas` into which it can render.

Canvas contexts are created using `device.createCanvasContext()`. Depending on options passed, this either creates a new canvas element, or attaches the context to an existing canvas element (see [remarks](#remarks) below for WebGL limitations).

a `CanvasContext` handles the following responsibilities:

- manages the "swap chain" (provides a `Framebuffer` representing the display, with freshly updated and resized textures for every render frame)
- manages canvas resizing
- manages device pixel ratio

## Usage

Use a device's default canvas context:

```typescript
const renderPass = device.beginRenderPass({
  framebuffer: device.canvasContext.getFramebuffer()
});
```

Create additional canvas contexts (WebGPU only):

```typescript
const canvasContext2 = device.createCanvasContext({canvas: ...});
const renderPass = device.beginRenderPass({
  framebuffer: canvasContext2.getFramebuffer()
});
```

## Types

### `CanvasContextProps`

| Property                | Type                                                 |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `canvas?`               | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | A new canvas will be created if not supplied.                                 |
| `container?`            | `HTMLElement`                                        | Parent DOM element for new canvas. Defaults to first child of `document.body` |
| `width?`                | `number`                                             | Width in pixels of the canvas                                                 |
| `height?`               | `number`                                             | Height in pixels of the canvas                                                |
| `useDevicePixels?`      | `boolean` \| `number`                                | Device pixels scale factor (`true` uses browser DPI)                          |
| `autoResize?`           | `boolean`                                            | Whether to track resizes                                                      |
| `visible?`              | `boolean`                                            | Visibility (only used if new canvas is created).                              |
| `colorSpace?`           | `'srgb'`                                             | WebGPU only https://www.w3.org/TR/webgpu/#canvas-configuration                |
| `compositingAlphaMode?` | `'opaque'` \| `'premultiplied'`                      | WebGPU only https://www.w3.org/TR/webgpu/#canvas-configuration                |

## Static Fields

### `CanvasContext.isPageLoaded: boolean`

### `CanvasContext.pageLoaded: Promise<void>`

## Fields

### `canvas: HMTLCanvas | OffscreenCanvas`

### `useDevicePixels: boolean | number`

## Methods

### constructor

A `CanvasContext` can not be constructed directly. It must be created by instantiating a `WebGPUDevice` or a `WebGLDevice`, or through `WebGPUDevice.createCanvasContext()`.

### `getDevicePixelResolution(): [number, number]`

### `getPixelSize(): [number, number]`

Returns the size in pixels required to cover the canvas at the current device pixel resolution.

### `resize()`

Resize the drawing surface.

```
canvasContext.resize(options)
```

  - **width**: New drawing surface width.
  - **height**: New drawing surface height.
  - **useDevicePixels**: Whether to scale the drawing surface using the device pixel ratio.

## Remarks

- Note that a WebGPU `Device` can have multiple associated `CanvasContext` instances (or none, if only used for compute). However a WebGL `Device` always has exactly one `CanvasContext` and can only render into that single canvas. (This is a fundamental limitation of the WebGL API.)
- `useDevicePixels` can accept a custom ratio (Number), instead of `true` or `false`. This allows rendering to a much smaller or higher resolutions. When using high value (usually more than device pixel ratio), it is possible it can get clamped down, this happens due to system memory limitation, in such cases a warning will be logged to the browser console. For additional details check device pixels [`document`](<(/docs/api-reference/gltools/device-pixels)>).
