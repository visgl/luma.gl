# PresentationContext

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
  <img src="https://img.shields.io/badge/Experimental-orange.svg?style=flat-square" alt="Experimental" />
</p>

`PresentationContext` is intended for multi-canvas presentation workflows that are portable across both WebGPU and WebGL.

:::caution Experimental
`PresentationContext` and `device.createPresentationContext()` are experimental APIs and may change in a future release.
:::

## Usage

```ts
const offscreenCanvas = new OffscreenCanvas(1, 1);

const device = await luma.createDevice({
  type: 'best-available',
  adapters: [webgl2Adapter, webgpuAdapter],
  createCanvasContext: {canvas: offscreenCanvas}
});

const presentationContext = device.createPresentationContext({canvas});
const framebuffer = presentationContext.getCurrentFramebuffer();

const renderPass = device.beginRenderPass({framebuffer});
// draw...
renderPass.end();

presentationContext.present();
```

## Remarks

- For a portable app, create the device with a default `CanvasContext` backed by an `OffscreenCanvas`.
- On WebGL, `device.createPresentationContext()` requires the device's default `CanvasContext` to be backed by an `OffscreenCanvas`.
- On WebGL, all `PresentationContext` instances on a device share that single default `CanvasContext`, so they must be used sequentially.
- On WebGPU, each `PresentationContext` owns its own destination `GPUCanvasContext`.
- `present()` is explicit. On WebGL it performs the copy to the destination canvas. On WebGPU it submits the frame.

## Backend Behavior

WebGPU supports rendering into multiple canvases from a single `Device`, and `PresentationContext` works similarly to a normal `CanvasContext`.

On WebGL, however, a `PresentationContext` tracks a destination canvas but renders under the hood using the device's default `CanvasContext` as the actual GPU render target and then copies the results into the `PresentationContext` canvas.

### WebGPU

1. `getCurrentFramebuffer()` returns a framebuffer backed by the destination canvas.
2. Rendering happens directly into that destination canvas.
3. `present()` submits work for that canvas.

### WebGL

1. `getCurrentFramebuffer()` resizes the default `CanvasContext` to the presentation size.
2. Rendering happens into that default canvas.
3. `present()` submits work and copies the rendered image into the destination canvas.

Because of this design, WebGL presentation contexts are sequential and require the default canvas context to be backed by an `OffscreenCanvas`.

## Types

### `PresentationContextProps`

`PresentationContextProps` is currently the same type as `CanvasContextProps`.

| Property               | Type                                                 | Description                                                     |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| `autoResize?`          | `boolean`                                            | Whether to resize the tracked drawing buffer when canvas size changes |
| `useDevicePixels?`     | `boolean \| number`                                  | Whether to size the drawing buffer from device pixels or a fixed pixel ratio |
| `width?`               | `number`                                             | Width in pixels of a newly created destination canvas           |
| `height?`              | `number`                                             | Height in pixels of a newly created destination canvas          |
| `canvas?`              | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | Destination canvas to present into                              |
| `container?`           | `HTMLElement` \| `string`                            | Parent DOM element for a newly created destination canvas       |
| `visible?`             | `boolean`                                            | Visibility for a newly created destination canvas               |
| `alphaMode?`           | `'opaque' \| 'premultiplied'`                        | Canvas alpha mode metadata                                      |
| `colorSpace?`          | `'srgb'`                                             | Canvas color space metadata                                     |
| `trackPosition?`       | `boolean`                                            | Whether to track destination canvas position                    |

## Fields

### `canvas: HTMLCanvasElement | OffscreenCanvas`

The destination canvas associated with this presentation context.

### `initialized: Promise<void>`

Resolves when the `PresentationContext` has observed its initial size.

### `isInitialized: boolean`

Becomes `true` once the initial size is known.

## Methods

### `device.createPresentationContext(props?: PresentationContextProps): PresentationContext`

Creates a presentation context associated with the device.

:::caution Experimental
This method is experimental and may change in a future release.
:::

:::info
`PresentationContext` should not be constructed directly. Use `device.createPresentationContext(...)`.
:::

### `getCurrentFramebuffer(): Framebuffer`

Returns the framebuffer that should be used for the current frame.

- On WebGL this delegates to the device's default `CanvasContext` after resizing it to the presentation context's drawing buffer size.
- On WebGPU this returns a framebuffer for the destination canvas itself.

### `present(): void`

Completes presentation for the destination canvas.

- On WebGL it submits pending work and copies the rendered image from the device's default `CanvasContext` into the destination canvas.
- On WebGPU it submits pending work for the destination canvas.

### `getCSSSize(): [number, number]`

Returns the destination canvas size in CSS pixels.

### `getDevicePixelSize(): [number, number]`

Returns the destination canvas size in device pixels.

### `getDrawingBufferSize(): [number, number]`

Returns the drawing buffer size used when borrowing the default `CanvasContext`.

### `setDrawingBufferSize(width: number, height: number): void`

Overrides the drawing buffer size used for the next `getCurrentFramebuffer()` / `present()` cycle.
