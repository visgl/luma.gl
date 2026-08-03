# CanvasContext

[CanvasContext](https://luma.gl/next/docs/api-reference/core/canvas-context.md)[PresentationContext](https://luma.gl/next/docs/api-reference/core/presentation-context.md)[Framebuffer](https://luma.gl/next/docs/api-reference/core/resources/framebuffer.md)

A `CanvasContext` holds a connection between a GPU `Device` and canvas, (either an HTML `<canvas />` element, aka `HTMLCanvasELement`, or an `OffscreenCanvas`).

* A `CanvasContext` enables the application to do GPU render into a canvas.
* The `CanvasContext` acts as a source of `Framebuffer`s with special `Texture` color attachments that are copied to the screen at the end of a `RenderPass`.
* It handles canvas resizing, making sure the returned `Framebuffer`s correspond to the current size of the canvas.
* It also provides support for device pixel ratios (mapping between device pixels and CSS pixels)

## Canvas Size Management[​](#canvas-size-management "Direct link to Canvas Size Management")

While an `OffscreenCanvas` only has one size, `HTMLCanvasElements` effectively has three different sizes:

* The *CSS size*, being the size in "logical units" of the canvas
* The *device pixel size*, being the exact number of "screen pixels" covered by the canvas
* The *drawing buffer size*, representing the "hidden" system texture created to render into the canvas.

Notes:

* For best results, the drawing buffer should match the device pixel size. The `autoResizeDrawingBuffer` and `useDevicePixels` props will ensure this.
* However, significant memory savings are possible by using say half resolution drawing buffers.
* If the drawing buffer size doesn't exactly match the pixel size, undesired effects like moire patterns can result.The `CanvasContext` pixelWidth and pixelHeight members tracks the exact pixel size (called the "device pixel content box" in browser APIs) is surprisingly hard.
* Some overlay integrations still expect legacy `Math.round(cssSize * devicePixelRatio)` sizing. Use `pixelSizeSource: 'css-dpr'` when luma.gl must match an external canvas that has not adopted exact device-pixel sizing.

## Canvas Monitoring[​](#canvas-monitoring "Direct link to Canvas Monitoring")

For `HTMLCanvasElements` the `CanvasContext` will monitor changes to the underlying canvas and call callbacks on the associated `Device`, see:

* `DeviceProps.onResize` - called if the size of the "device pixel content box" changes.
* `DeviceProps.onPositionChange` - called if the absolute position of the canvas changes. Requires `CanvasContextProps.trackPosition`.
* `DeviceProps.onVisibilityChange` - called if the visibility of the canvas changes (window is closed or occluded).
* `DeviceProps.onDevicePixelRatioChange` - called if the DPR changes (perhaps by moving the window to another screen or zooming the browser)

## Usage[​](#usage "Direct link to Usage")

The luma.gl API is designed to allow a `Device` to create multiple associated `CanvasContext`s (or none, if only used for compute).

```
const device = await luma.createDevice(...);
const canvasContext1 = device.createCanvasContext(...);
const canvasContext2 = device.createCanvasContext(...);
```

WebGPU supports multiple `CanvasContext`s. A WebGL `Device` always has exactly one `CanvasContext` that must be created when the device is created, and a WebGL device can only render into that single canvas. This is a fundamental limitation of the WebGL API.

Because of this, the `Device` class provides a `DeviceProps.createCanvasContext` property that creates a default `CanvasContext`:

```
const device = await luma.createDevice({createCanvasContext: true});
const canvasContext = device.getDefaultCanvasContext()
```

The application can also provide properties for the default `CanvasContext`:

```
const device = await luma.createDevice({createCanvasContext: {width, height}}); // Creates a new HTML canvas and adds it to document.body.
const canvasContext = device.getDefaultCanvasContext()
```

A `CanvasContext` can be associated with an existing canvas:

```
const device = await luma.createDevice({createCanvasContext: {canvas: document.getElementById('canvas-id')}}); // Creates a new HTML canvas and adds it to document.body.
const canvasContext = device.getDefaultCanvasContext()
```

The same `createCanvasContext` options are also used when attaching to an externally created WebGL context through `luma.attachDevice()` or `webgl2Adapter.attach()`, including compatibility options such as `pixelSizeSource`.

### HDR presentation[​](#hdr-presentation "Direct link to HDR presentation")

On an HDR-capable display, configure a WebGPU canvas with a floating-point presentation format, wide color gamut, and extended tone mapping:

```
const supportsHighDynamicRange = window.matchMedia('(dynamic-range: high)').matches;

const device = await luma.createDevice({
  adapters: [webgpuAdapter],
  createCanvasContext: supportsHighDynamicRange
    ? {
        colorFormat: 'rgba16float',
        colorSpace: 'display-p3',
        toneMapping: 'extended'
      }
    : true
});
```

`device.preferredColorFormat` becomes `'rgba16float'` for the HDR device. Render pipelines, offscreen passes, and the final fragment shader must preserve values above `1.0`; an SDR tone mapping curve that clamps every channel defeats HDR presentation even with an HDR canvas.

On non-HDR displays, use the normal 8-bit presentation format and standard tone mapping. WebGL can use floating-point intermediate textures when supported, but HDR canvas presentation is currently a WebGPU feature. See [High-dynamic-range presentation](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md#high-dynamic-range-presentation) for the complete rendering pipeline and fallback guidance.

Use a device's default canvas context to render into the associated canvas

```
const renderPass = device.beginRenderPass({});
```

This is equivalent to

```
const renderPass = device.beginRenderPass({
  framebuffer: device.getDefaultCanvasContext().getFramebuffer()
});
```

### Multiple presentation contexts[​](#multiple-presentation-contexts "Direct link to Multiple presentation contexts")

A single device can present into multiple canvases. On WebGPU each canvas is backed by its own presentation context. On WebGL the shared device renders through an `OffscreenCanvas` before presenting into the visible canvases.

<!-- -->

Initializing device...

### Additional canvas contexts[​](#additional-canvas-contexts "Direct link to Additional canvas contexts")

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

Render into an additional canvas context:

```
const newCanvasContext = device.createCanvasContext({canvas: ...});
const renderPass = device.beginRenderPass({
  framebuffer: newCanvasContext.getFramebuffer()
});
```

On high-DPI screens, the number of pixels in a canvas can be a multiple of the "CSS size" reported by HTMLCanvasElement. Because of this, luma.gl allows the resolution of the textures returned by `canvasContext.getFramebuffer` to be controlled. The `CanvasContextProps.useDevicePixels` prop if set to `true`, multiples the canvas HTML size with the system device pixel ratio. This prop can also a custom ratio (`number`), as well. This allows setting the target texture size to higher or lower resolutions that indicated by an HMTLCanvasElements CSS width and height, to ensure that screen renderings use the maximum resolution of the device (at the cost of using more GPU memory).

```
const newCanvasContext = device.createCanvasContext({canvas: ..., useDevicePixels: true});
```

Mote that when using high value (usually more than device pixel ratio), it is possible it can get clamped down outside of luma.gl's control due to system memory limitation, in such cases a warning will be logged to the browser console.

The `CanvasContext` also provides methods for converting between device and CSS pixels, e.g

```
canvasContext.getDevicePixelResolution()
```

## Types[​](#types "Direct link to Types")

### `CanvasContextProps`[​](#canvascontextprops "Direct link to canvascontextprops")

| Property           | Type                                                 |                                                                                          |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `autoResize?`      | `boolean`                                            | Whether to resize drawing buffer when canvas size changes                                |
| `useDevicePixels?` | `boolean`                                            | Whether to auto resize drawing buffer to device or CSS pixels                            |
| `pixelSizeSource?` | `'exact' \| 'css-dpr'`                               | How tracked device pixel size is derived for HTML canvases. Defaults to `'exact'`.       |
| `width?`           | `number`                                             | Width in pixels of the canvas (if `canvas` is not supplied)                              |
| `height?`          | `number`                                             | Height in pixels of the canvas (if `canvas` is not supplied)                             |
| `canvas?`          | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | A new canvas will be created if not supplied.                                            |
| `container?`       | `HTMLElement`                                        | Parent DOM element for new canvas. Defaults to first child of `document.body`            |
| `visible?`         | `boolean`                                            | Visibility (only used if new canvas is created).                                         |
| `alphaMode?`       | `'opaque' \| 'premultiplied'`                        | WebGPU presentation alpha mode.                                                          |
| `colorSpace?`      | `'srgb' \| 'display-p3'`                             | Presentation color space. Use `'display-p3'` for wide-gamut HDR output.                  |
| `colorFormat?`     | `'rgba8unorm' \| 'bgra8unorm' \| 'rgba16float'`      | Optional WebGPU presentation texture format. Use `'rgba16float'` to retain HDR values.   |
| `toneMapping?`     | `'standard' \| 'extended'`                           | WebGPU presentation tone mapping. `'extended'` preserves colors brighter than SDR white. |

### `useDevicePixels: boolean`[​](#usedevicepixels-boolean "Direct link to usedevicepixels-boolean")

Whether the framebuffer backing this canvas context is auto resized using device pixels.

* `false` - Framebuffer is sized according to CSS pixel size.
* `true` - Framebuffer is sized according to the device pixel ratio reported by the browser.

### `pixelSizeSource: 'exact' | 'css-dpr'`[​](#pixelsizesource-exact--css-dpr "Direct link to pixelsizesource-exact--css-dpr")

Controls how `CanvasContext` derives tracked device-pixel size for HTML canvases.

* `'exact'` - Prefer `ResizeObserver.devicePixelContentBoxSize` for pixel-perfect sizing.
* `'css-dpr'` - Use `Math.round(cssSize * devicePixelRatio)` for compatibility with external overlays that still size canvases this way.

## Fields[​](#fields "Direct link to Fields")

### `canvas: HMTLCanvas | OffscreenCanvas`[​](#canvas-hmtlcanvas--offscreencanvas "Direct link to canvas-hmtlcanvas--offscreencanvas")

### `initialized: Promise<void>`[​](#initialized-promisevoid "Direct link to initialized-promisevoid")

A promise that resolves when the `CanvasContext` been able to obtain its true pixel size.

### `isInitialized: boolean`[​](#isinitialized-boolean "Direct link to isinitialized-boolean")

Becomes `true` once the `CanvasContext` been able to obtain its true pixel size.

## Methods[​](#methods "Direct link to Methods")

### constructor[​](#constructor "Direct link to constructor")

info

A `CanvasContext` should not be constructed directly. Default canvas contexts are created when instantiating a `WebGPUDevice` or a `WebGLDevice` by supplying the `canvasContext` property, and can be accessed through the `device.getDefaultCanvasContext()` method. Additional canvas contexts can be explicitly created through `WebGPUDevice.createCanvasContext(...)`.

On `Device` instances that support it (see remarks below) additional canvas contexts are created using `device.createCanvasContext()`. Depending on options passed, this either:

* creates a new canvas element with the specified properties,
* or attaches the context to an existing canvas element

### getCurrentFramebuffer(): Framebuffer[​](#getcurrentframebuffer-framebuffer "Direct link to getCurrentFramebuffer(): Framebuffer")

Returns a framebuffer with properly resized current 'swap chain' textures. Rendering to this framebuffer will update the canvas associated with that `CanvasContext`. Note that a new `Framebuffer` must be requested on every redraw cycle.

### `getCSSSize(): [number, number]`[​](#getcsssize-number-number "Direct link to getcsssize-number-number")

Returns the size in logical (CSS) units. This is useful when mapping DOM events (mouse clicks etc) to the canvas, as their coordinates will be in CSS units.

*Note: For an `OffscreenCanvas` this function always returns the same value as `getDevicePixelSize()`*

### `getDevicePixelSize(): [number, number]`[​](#getdevicepixelsize-number-number "Direct link to getdevicepixelsize-number-number")

Returns the size in pixels required to cover the canvas at the current device pixel resolution. Note that this value is just informational, the render buffer can be set to any value independently of this size.

### `getDrawingBufferSize(): [number, number]`[​](#getdrawingbuffersize-number-number "Direct link to getdrawingbuffersize-number-number")

If `props.autoResize` is true, then this value will always match `getDevicePixelSize()`

*Note: For an `OffscreenCanvas` this function always returns the same value as `getDevicePixelSize()`*

### `setDrawingBufferSize(size [number, number]): void`[​](#setdrawingbuffersizesize-number-number-void "Direct link to setdrawingbuffersizesize-number-number-void")

Resize the drawing surface. Usually called after the window has been resized.

```
canvasContext.setDrawingBufferSize([width: number, height: number]});
```

* **width**: New drawing surface width.
* **height**: New drawing surface height.

*Note: if `props.autoResize` is true, then automatic resizing is performed as size changes to the underlying canvas object are detected.*
