# PresentationContext

[CanvasContext](https://luma.gl/docs/api-reference/core/canvas-context.md)[PresentationContext](https://luma.gl/docs/api-reference/core/presentation-context.md)[Framebuffer](https://luma.gl/docs/api-reference/core/resources/framebuffer.md)

From v9.3Experimental

`PresentationContext` is intended for multi-canvas presentation workflows that are portable across both WebGPU and WebGL.

Experimental

`PresentationContext` and `device.createPresentationContext()` are experimental APIs and may change in a future release.

## Usage[​](#usage "Direct link to Usage")

```
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

## Remarks[​](#remarks "Direct link to Remarks")

* For a portable app, create the device with a default `CanvasContext` backed by an `OffscreenCanvas`.
* On WebGL, `device.createPresentationContext()` requires the device's default `CanvasContext` to be backed by an `OffscreenCanvas`.
* On WebGL, all `PresentationContext` instances on a device share that single default `CanvasContext`, so they must be used sequentially.
* On WebGPU, each `PresentationContext` owns its own destination `GPUCanvasContext`.
* `present()` is explicit. On WebGL it performs the copy to the destination canvas. On WebGPU it submits the frame.

## Backend Behavior[​](#backend-behavior "Direct link to Backend Behavior")

WebGPU supports rendering into multiple canvases from a single `Device`, and `PresentationContext` works similarly to a normal `CanvasContext`.

On WebGL, however, a `PresentationContext` tracks a destination canvas but renders under the hood using the device's default `CanvasContext` as the actual GPU render target and then copies the results into the `PresentationContext` canvas.

### WebGPU[​](#webgpu "Direct link to WebGPU")

1. `getCurrentFramebuffer()` returns a framebuffer backed by the destination canvas.
2. Rendering happens directly into that destination canvas.
3. `present()` submits work for that canvas.

### WebGL[​](#webgl "Direct link to WebGL")

1. `getCurrentFramebuffer()` resizes the default `CanvasContext` to the presentation size.
2. Rendering happens into that default canvas.
3. `present()` submits work and copies the rendered image into the destination canvas.

Because of this design, WebGL presentation contexts are sequential and require the default canvas context to be backed by an `OffscreenCanvas`.

## Types[​](#types "Direct link to Types")

### `PresentationContextProps`[​](#presentationcontextprops "Direct link to presentationcontextprops")

`PresentationContextProps` is currently the same type as `CanvasContextProps`.

| Property           | Type                                                 | Description                                                                  |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `autoResize?`      | `boolean`                                            | Whether to resize the tracked drawing buffer when canvas size changes        |
| `useDevicePixels?` | `boolean \| number`                                  | Whether to size the drawing buffer from device pixels or a fixed pixel ratio |
| `width?`           | `number`                                             | Width in pixels of a newly created destination canvas                        |
| `height?`          | `number`                                             | Height in pixels of a newly created destination canvas                       |
| `canvas?`          | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | Destination canvas to present into                                           |
| `container?`       | `HTMLElement` \| `string`                            | Parent DOM element for a newly created destination canvas                    |
| `visible?`         | `boolean`                                            | Visibility for a newly created destination canvas                            |
| `alphaMode?`       | `'opaque' \| 'premultiplied'`                        | Canvas alpha mode metadata                                                   |
| `colorSpace?`      | `'srgb' \| 'display-p3'`                             | Presentation color space                                                     |
| `colorFormat?`     | `'rgba8unorm' \| 'bgra8unorm' \| 'rgba16float'`      | Requested WebGPU presentation texture format                                 |
| `toneMapping?`     | `'standard' \| 'extended'`                           | Whether WebGPU presentation preserves HDR luminance                          |
| `trackPosition?`   | `boolean`                                            | Whether to track destination canvas position                                 |

## Fields[​](#fields "Direct link to Fields")

### `canvas: HTMLCanvasElement | OffscreenCanvas`[​](#canvas-htmlcanvaselement--offscreencanvas "Direct link to canvas-htmlcanvaselement--offscreencanvas")

The destination canvas associated with this presentation context.

### `initialized: Promise<void>`[​](#initialized-promisevoid "Direct link to initialized-promisevoid")

Resolves when the `PresentationContext` has observed its initial size.

### `isInitialized: boolean`[​](#isinitialized-boolean "Direct link to isinitialized-boolean")

Becomes `true` once the initial size is known.

## Methods[​](#methods "Direct link to Methods")

### `device.createPresentationContext(props?: PresentationContextProps): PresentationContext`[​](#devicecreatepresentationcontextprops-presentationcontextprops-presentationcontext "Direct link to devicecreatepresentationcontextprops-presentationcontextprops-presentationcontext")

Creates a presentation context associated with the device.

Experimental

This method is experimental and may change in a future release.

info

`PresentationContext` should not be constructed directly. Use `device.createPresentationContext(...)`.

### `getCurrentFramebuffer(): Framebuffer`[​](#getcurrentframebuffer-framebuffer "Direct link to getcurrentframebuffer-framebuffer")

Returns the framebuffer that should be used for the current frame.

* On WebGL this delegates to the device's default `CanvasContext` after resizing it to the presentation context's drawing buffer size.
* On WebGPU this returns a framebuffer for the destination canvas itself.

### `present(): void`[​](#present-void "Direct link to present-void")

Completes presentation for the destination canvas.

* On WebGL it submits pending work and copies the rendered image from the device's default `CanvasContext` into the destination canvas.
* On WebGPU it submits pending work for the destination canvas.

### `getCSSSize(): [number, number]`[​](#getcsssize-number-number "Direct link to getcsssize-number-number")

Returns the destination canvas size in CSS pixels.

### `getDevicePixelSize(): [number, number]`[​](#getdevicepixelsize-number-number "Direct link to getdevicepixelsize-number-number")

Returns the destination canvas size in device pixels.

### `getDrawingBufferSize(): [number, number]`[​](#getdrawingbuffersize-number-number "Direct link to getdrawingbuffersize-number-number")

Returns the drawing buffer size used when borrowing the default `CanvasContext`.

### `setDrawingBufferSize(width: number, height: number): void`[​](#setdrawingbuffersizewidth-number-height-number-void "Direct link to setdrawingbuffersizewidth-number-height-number-void")

Overrides the drawing buffer size used for the next `getCurrentFramebuffer()` / `present()` cycle.
