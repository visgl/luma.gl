# CanvasContext

> This class is still experimental

A `CanvasContext` holds a connection between the GPU `Device` and an HTML `canvas` into which it can render.

A `CanvasContext` handles the following responsibilities:
- manages the "swap chain" (provides fresh texture view every frame on WebGPU)
- manages canvas resizing
- manages device pixel ratio
- can look up canvas elements in DOM, or create a new canvas elements if needed

Note that:
- A `WebGPUDevice` can have multiple associated `CanvasContext` instances, or none, if only used for compute.
- A `WebGLDevice` always has exactly one `CanvasContext` (and can thus only render into a single canvas). This is due to fundamental limitations of the WebGL API.

## CanvasContextProps

| Property | Type |
| --- | --- |
| `canvas?` | HTMLCanvasElement \| OffscreenCanvas \| string |
| `width?` | number |
| `height?` | number |
| `useDevicePixels?` | boolean \| number |
| `autoResize?` | boolean |

Remarks:
- `useDevicePixels` can accept a custom ratio (Number), instead of `true` or `false`. This allows rendering to a much smaller or higher resolutions. When using high value (usually more than device pixel ratio), it is possible it can get clamped down, this happens due to system memory limitation, in such cases a warning will be logged to the browser console. For additional details check device pixels [`document`](<(/docs/api-reference/gltools/device-pixels)>).

## Methods

### constructor

A `CanvasContext` can not be constructed directly. It must be created by instantiating a `WebGPUDevice` or a `WebGLDevice`, or through `WebGPUDevice.createCanvasContext()`.

### `getDevicePixelResolution(): [number, number]`

### `getPixelSize(): [number, number]`

Returns the size in pixels required to cover the canvas at the current device pixel resolution.

## Static Fields

### `CanvasContext.isPageLoaded: boolean`

### `CanvasContext.pageLoaded: Promise<void>`

## Fields

### `canvas: HMTLCanvas | OffscreenCanvas`

### `useDevicePixels: boolean | number`
