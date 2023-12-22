# CanvasContext

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A `CanvasContext` holds a connection between a GPU `Device` and an HTML `canvas` or `OffscreenCanvas` into which it can render.

Canvas contexts are created using `device.createCanvasContext()`. Depending on options passed, this either: 
- creates a new canvas element, or 
- attaches the context to an existing canvas element 
- 
- (see [remarks](#remarks) below for WebGL limitations).

a `CanvasContext` handles the following responsibilities:

- Provides a `Framebuffer` representing the display, with freshly updated and resized textures for every render frame. On WebGPU it manages the "swap chain".
- Handles canvas resizing
- Manages device pixel ratio (mapping between device and CSS pixels)

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
A `CanvasContext` should not be constructed directly. Default canvas contexts are created when instantiating a `WebGPUDevice` or a `WebGLDevice`, and can be accessed through the `device.canvasContext` field.  Additional canvas contexts can be explicitly created through `WebGPUDevice.createCanvasContext(...)`.
:::

### `getDevicePixelResolution(): [number, number]`

T

### `getPixelSize(): [number, number]`

Returns the size in pixels required to cover the canvas at the current device pixel resolution.

### `resize(): void`

Resize the drawing surface.

```typescript
canvasContext.resize(options)
```

  - **width**: New drawing surface width.
  - **height**: New drawing surface height.
  - **useDevicePixels**: Whether to scale the drawing surface using the device pixel ratio.

## Remarks

- Note that a WebGPU `Device` can have multiple associated `CanvasContext` instances (or none, if only used for compute). 
- However a WebGL `Device` always has exactly one `CanvasContext` and can only render into that single canvas. (This is a fundamental limitation of WebGL.)
- `useDevicePixels` can accept a custom ratio (Number), instead of `true` or `false`. This allows rendering to a much smaller or higher resolutions. When using high value (usually more than device pixel ratio), it is possible it can get clamped down outside of luma.gl's control due to system memory limitation, in such cases a warning will be logged to the browser console.
