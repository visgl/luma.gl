# CanvasContext

[CanvasContext](https://luma.gl/docs/api-reference/core/canvas-context.md)[PresentationContext](https://luma.gl/docs/api-reference/core/presentation-context.md)[Framebuffer](https://luma.gl/docs/api-reference/core/resources/framebuffer.md)

A `CanvasContext` connects a GPU `Device` to an `HTMLCanvasElement` or `OffscreenCanvas`.

* A `CanvasContext` lets the application render into a canvas.
* It supplies current canvas framebuffers. End render passes and submit commands to present WebGPU work.
* It handles canvas resizing, making sure the returned `Framebuffer`s correspond to the current size of the canvas.
* It also provides support for device pixel ratios (mapping between device pixels and CSS pixels)

## Canvas Size Management[​](#canvas-size-management "Direct link to Canvas Size Management")

An `HTMLCanvasElement` has three relevant sizes:

* The *CSS size*, being the size in "logical units" of the canvas
* The *device pixel size*, being the exact number of "screen pixels" covered by the canvas
* The *drawing buffer size*, representing the "hidden" system texture created to render into the canvas.

Notes:

* For best results, the drawing buffer should match the device pixel size. The `autoResize` and `useDevicePixels` props control this.
* However, significant memory savings are possible by using say half resolution drawing buffers.
* A drawing buffer that differs from the device pixel size may introduce resampling artifacts. `devicePixelWidth` and `devicePixelHeight` track the canvas's physical pixel coverage.
* Use `pixelSizeSource: 'css-dpr'` to match external canvases sized with `Math.floor(cssSize * devicePixelRatio)` rather than exact device-pixel sizing.

## Canvas Monitoring[​](#canvas-monitoring "Direct link to Canvas Monitoring")

For HTML canvases, `CanvasContext` monitors changes and calls callbacks on the associated `Device`:

* `DeviceProps.onResize` - called if the size of the "device pixel content box" changes.
* `DeviceProps.onPositionChange` - called if the absolute position of the canvas changes. Requires `CanvasContextProps.trackPosition`.
* `DeviceProps.onVisibilityChange` - called when the canvas's intersection with the viewport changes.
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

const canvasContext = device.getDefaultCanvasContext();
```

The application can also provide properties for the default `CanvasContext`:

```
const device = await luma.createDevice({createCanvasContext: {width, height}}); // Creates a new HTML canvas and adds it to document.body.

const canvasContext = device.getDefaultCanvasContext();
```

A `CanvasContext` can be associated with an existing canvas:

```
const device = await luma.createDevice({createCanvasContext: {canvas: 'canvas-id'}});

const canvasContext = device.getDefaultCanvasContext();
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

On non-HDR displays, use the normal 8-bit presentation format and standard tone mapping. WebGL can use floating-point intermediate textures when supported, but HDR canvas presentation is currently a WebGPU feature. See [High-dynamic-range presentation](https://luma.gl/docs/api-guide/gpu/gpu-rendering.md#high-dynamic-range-presentation) for the complete rendering pipeline and fallback guidance.

Use a device's default canvas context to render into the associated canvas

```
const renderPass = device.beginRenderPass({});
```

This is equivalent to

```
const renderPass = device.beginRenderPass({

  framebuffer: device.getDefaultCanvasContext().getCurrentFramebuffer()

});
```

### Multiple presentation contexts[​](#multiple-presentation-contexts "Direct link to Multiple presentation contexts")

A single device can present into multiple canvases. On WebGPU each canvas is backed by its own presentation context. On WebGL the shared device renders through an `OffscreenCanvas` before presenting into the visible canvases.

<!-- -->

Initializing device...

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

### Additional canvas contexts[​](#additional-canvas-contexts "Direct link to Additional canvas contexts")

WebGPU supportedWebGL 2 not supported

Render into an additional canvas context:

```
const newCanvasContext = device.createCanvasContext({canvas: ...});

const renderPass = device.beginRenderPass({

  framebuffer: newCanvasContext.getCurrentFramebuffer()

});
```

On high-DPI screens, an `HTMLCanvasElement` covers more device pixels than CSS pixels. With automatic resizing enabled, `useDevicePixels: true` matches physical pixel coverage, `false` uses CSS size, and a number applies a fixed pixel ratio to CSS size. Higher resolutions use more GPU memory.

```
const newCanvasContext = device.createCanvasContext({canvas: ..., useDevicePixels: true});
```

The backend may clamp dimensions that exceed its drawing-buffer limits.

To convert a CSS pixel to drawing-buffer coordinates, use:

```
canvasContext.cssToDevicePixels([x, y]);
```

## Types[​](#types "Direct link to Types")

### `CanvasContextProps`[​](#canvascontextprops "Direct link to canvascontextprops")

| Property           | Type                                                 |                                                                                                     |
| ------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `autoResize?`      | `boolean`                                            | Whether to resize drawing buffer when canvas size changes                                           |
| `useDevicePixels?` | `boolean \| number`                                  | Use physical pixels (`true`), CSS pixels (`false`), or a fixed ratio (`number`) when auto-resizing. |
| `pixelSizeSource?` | `'exact' \| 'css-dpr'`                               | How tracked device pixel size is derived for HTML canvases. Defaults to `'exact'`.                  |
| `width?`           | `number`                                             | Width in pixels of the canvas (if `canvas` is not supplied)                                         |
| `height?`          | `number`                                             | Height in pixels of the canvas (if `canvas` is not supplied)                                        |
| `canvas?`          | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | A new canvas will be created if not supplied.                                                       |
| `container?`       | `HTMLElement \| string \| null`                      | Parent element or element ID for a new canvas. Defaults to `document.body`.                         |
| `visible?`         | `boolean`                                            | Visibility (only used if new canvas is created).                                                    |
| `alphaMode?`       | `'opaque' \| 'premultiplied'`                        | WebGPU presentation alpha mode.                                                                     |
| `colorSpace?`      | `'srgb' \| 'display-p3'`                             | Presentation color space. Use `'display-p3'` for wide-gamut HDR output.                             |
| `colorFormat?`     | `'rgba8unorm' \| 'bgra8unorm' \| 'rgba16float'`      | Optional WebGPU presentation texture format. Use `'rgba16float'` to retain HDR values.              |
| `toneMapping?`     | `'standard' \| 'extended'`                           | WebGPU presentation tone mapping. `'extended'` preserves colors brighter than SDR white.            |

### `useDevicePixels: boolean | number`[​](#usedevicepixels-boolean--number "Direct link to usedevicepixels-boolean--number")

Whether the framebuffer backing this canvas context is auto resized using device pixels.

* `false` - Framebuffer is sized according to CSS pixel size.
* `true` - Framebuffer is sized according to the device pixel ratio reported by the browser.
* `number` - Drawing buffer uses CSS size multiplied by this fixed ratio.

### `pixelSizeSource: 'exact' | 'css-dpr'`[​](#pixelsizesource-exact--css-dpr "Direct link to pixelsizesource-exact--css-dpr")

Controls how `CanvasContext` derives tracked device-pixel size for HTML canvases.

* `'exact'` - Prefer `ResizeObserver.devicePixelContentBoxSize` for pixel-perfect sizing.
* `'css-dpr'` - Use `Math.floor(cssSize * devicePixelRatio)` for compatibility with external overlays that size canvases this way.

## Fields[​](#fields "Direct link to Fields")

### `canvas: HTMLCanvasElement | OffscreenCanvas`[​](#canvas-htmlcanvaselement--offscreencanvas "Direct link to canvas-htmlcanvaselement--offscreencanvas")

### `initialized: Promise<void>`[​](#initialized-promisevoid "Direct link to initialized-promisevoid")

A promise that resolves when the `CanvasContext` been able to obtain its true pixel size.

### `isInitialized: boolean`[​](#isinitialized-boolean "Direct link to isinitialized-boolean")

Becomes `true` once the `CanvasContext` been able to obtain its true pixel size.

## Methods[​](#methods "Direct link to Methods")

### constructor[​](#constructor "Direct link to constructor")

info

A `CanvasContext` should not be constructed directly. Supply `createCanvasContext` when creating a device and access it with `device.getDefaultCanvasContext()`. WebGPU also supports `device.createCanvasContext(...)` for additional renderable canvases.

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

With `autoResize: true` and `useDevicePixels: true`, this follows `getDevicePixelSize()`, subject to backend limits. Other ratios may produce a different drawing-buffer size.

*Note: For an `OffscreenCanvas` this function always returns the same value as `getDevicePixelSize()`*

### `setDrawingBufferSize(width: number, height: number): void`[​](#setdrawingbuffersizewidth-number-height-number-void "Direct link to setdrawingbuffersizewidth-number-height-number-void")

Resize the drawing surface. Usually called after the window has been resized.

```
canvasContext.setDrawingBufferSize(width, height);
```

* **width**: New drawing surface width.
* **height**: New drawing surface height.

*Note: if `props.autoResize` is true, then automatic resizing is performed as size changes to the underlying canvas object are detected.*
