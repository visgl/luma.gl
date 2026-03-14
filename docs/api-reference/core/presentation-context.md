# PresentationContext

A `PresentationContext` tracks a destination canvas while borrowing a device's default `CanvasContext` as the actual GPU render target.

- `PresentationContext` is intended for multi-canvas presentation workflows.
- Rendering still happens into the device's default `CanvasContext`.
- Calling `present()` copies the rendered image into the destination canvas tracked by the `PresentationContext`.

## Usage

```ts
const presentationContext = device.createPresentationContext({canvas});
const framebuffer = presentationContext.getCurrentFramebuffer();

const renderPass = device.beginRenderPass({framebuffer});
// draw...
renderPass.end();

presentationContext.present();
```

## Remarks

- In v1, `PresentationContext` is only implemented on WebGL devices.
- On WebGL, `device.createPresentationContext()` requires the device's default `CanvasContext` to be backed by an `OffscreenCanvas`.
- All `PresentationContext` instances on a device share that single default `CanvasContext`, so they must be used sequentially.
- `present()` is explicit. Rendering is not copied into the destination canvas until `present()` is called.

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

The destination canvas that receives the copied presentation result.

### `initialized: Promise<void>`

Resolves when the `PresentationContext` has observed its initial size.

### `isInitialized: boolean`

Becomes `true` once the initial size is known.

## Methods

### `device.createPresentationContext(props?: PresentationContextProps): PresentationContext`

Creates a presentation context associated with the device.

:::info
`PresentationContext` should not be constructed directly. Use `device.createPresentationContext(...)`.
:::

### `getCurrentFramebuffer(): Framebuffer`

Returns the framebuffer that should be used for the current frame. On WebGL this delegates to the device's default `CanvasContext` after resizing it to the presentation context's drawing buffer size.

### `present(): void`

Submits pending work and copies the rendered image from the device's default `CanvasContext` into the destination canvas.

### `getCSSSize(): [number, number]`

Returns the destination canvas size in CSS pixels.

### `getDevicePixelSize(): [number, number]`

Returns the destination canvas size in device pixels.

### `getDrawingBufferSize(): [number, number]`

Returns the drawing buffer size used when borrowing the default `CanvasContext`.

### `setDrawingBufferSize(width: number, height: number): void`

Overrides the drawing buffer size used for the next `getCurrentFramebuffer()` / `present()` cycle.
