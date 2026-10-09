import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';
import {DeviceTabs} from '@site/src/react-luma';
import {MultiCanvasExample} from '@site/src/examples';

# CanvasContext

<CoreDocsTabs group="presentation" active="canvas-context" />

A `CanvasContext` connects a GPU `Device` to an `HTMLCanvasElement` or `OffscreenCanvas`.

- A `CanvasContext` lets the application render into a canvas.
- It supplies current canvas framebuffers. End render passes and submit commands to present WebGPU work.
- It handles canvas resizing, making sure the returned `Framebuffer`s correspond to the current size of the canvas.
- It also provides support for device pixel ratios (mapping between device pixels and CSS pixels)


## Canvas Size Management

An `HTMLCanvasElement` has three relevant sizes:
- The *CSS size*, being the size in "logical units" of the canvas
- The *device pixel size*, being the exact number of "screen pixels" covered by the canvas
- The *drawing buffer size*, representing the "hidden" system texture created to render into the canvas.


Notes:
- For best results, the drawing buffer should match the device pixel size. The `autoResize` and `useDevicePixels` props control this.
- However, significant memory savings are possible by using say half resolution drawing buffers.
- A drawing buffer that differs from the device pixel size may introduce resampling artifacts. `devicePixelWidth` and `devicePixelHeight` track the canvas's physical pixel coverage.
- Use `pixelSizeSource: 'css-dpr'` to match external canvases sized with `Math.floor(cssSize * devicePixelRatio)` rather than exact device-pixel sizing.


## Canvas Monitoring

For HTML canvases, `CanvasContext` monitors changes and calls callbacks on the associated `Device`:

- `DeviceProps.onResize` - called if the size of the "device pixel content box" changes.
- `DeviceProps.onPositionChange` - called if the absolute position of the canvas changes. Requires `CanvasContextProps.trackPosition`.
- `DeviceProps.onVisibilityChange` - called when the canvas's intersection with the viewport changes.
- `DeviceProps.onDevicePixelRatioChange` - called if the DPR changes (perhaps by moving the window to another screen or zooming the browser)

## Usage

The luma.gl API is designed to allow a `Device` to create multiple associated `CanvasContext`s (or none, if only used for compute).

```ts
const device = await luma.createDevice(...);
const canvasContext1 = device.createCanvasContext(...);
const canvasContext2 = device.createCanvasContext(...);
```

WebGPU supports multiple `CanvasContext`s. A WebGL `Device` always has exactly one `CanvasContext` that must be created when the device is created, and a WebGL device can only render into that single canvas. This is a fundamental limitation of the WebGL API.

Because of this, the `Device` class provides a `DeviceProps.createCanvasContext` property that creates a default `CanvasContext`:

```ts
const device = await luma.createDevice({createCanvasContext: true});
const canvasContext = device.getDefaultCanvasContext();
```

The application can also provide properties for the default `CanvasContext`:

```ts
const device = await luma.createDevice({createCanvasContext: {width, height}}); // Creates a new HTML canvas and adds it to document.body.
const canvasContext = device.getDefaultCanvasContext();
```

A `CanvasContext` can be associated with an existing canvas:

```ts
const device = await luma.createDevice({createCanvasContext: {canvas: 'canvas-id'}});
const canvasContext = device.getDefaultCanvasContext();
```

The same `createCanvasContext` options are also used when attaching to an externally created WebGL context through `luma.attachDevice()` or `webgl2Adapter.attach()`, including compatibility options such as `pixelSizeSource`.

### HDR presentation

On an HDR-capable display, configure a WebGPU canvas with a floating-point presentation format,
wide color gamut, and extended tone mapping:

```ts
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

`device.preferredColorFormat` becomes `'rgba16float'` for the HDR device. Render pipelines,
offscreen passes, and the final fragment shader must preserve values above `1.0`; an SDR tone
mapping curve that clamps every channel defeats HDR presentation even with an HDR canvas.

On non-HDR displays, use the normal 8-bit presentation format and standard tone mapping. WebGL
can use floating-point intermediate textures when supported, but HDR canvas presentation is
currently a WebGPU feature. See [High-dynamic-range presentation](/docs/api-guide/gpu/gpu-rendering#high-dynamic-range-presentation)
for the complete rendering pipeline and fallback guidance.

Use a device's default canvas context to render into the associated canvas

```typescript
const renderPass = device.beginRenderPass({});
```

This is equivalent to
```ts
const renderPass = device.beginRenderPass({
  framebuffer: device.getDefaultCanvasContext().getCurrentFramebuffer()
});
```

### Multiple presentation contexts

A single device can present into multiple canvases. On WebGPU each canvas is backed by its own
presentation context. On WebGL the shared device renders through an `OffscreenCanvas` before
presenting into the visible canvases.

<DeviceTabs />
<MultiCanvasExample embedded embeddedHeight="auto" showStats={false} />

### Additional canvas contexts

<DocumentationBadges>
  <DocumentationBadge tone="webgpu">WebGPU supported</DocumentationBadge>
  <DocumentationBadge tone="neutral">WebGL 2 not supported</DocumentationBadge>
</DocumentationBadges>

Render into an additional canvas context:

```typescript
const newCanvasContext = device.createCanvasContext({canvas: ...});
const renderPass = device.beginRenderPass({
  framebuffer: newCanvasContext.getCurrentFramebuffer()
});
```

On high-DPI screens, an `HTMLCanvasElement` covers more device pixels than CSS pixels.
With automatic resizing enabled, `useDevicePixels: true` matches physical pixel coverage,
`false` uses CSS size, and a number applies a fixed pixel ratio to CSS size. Higher
resolutions use more GPU memory.

```typescript
const newCanvasContext = device.createCanvasContext({canvas: ..., useDevicePixels: true});
```

The backend may clamp dimensions that exceed its drawing-buffer limits.

To convert a CSS pixel to drawing-buffer coordinates, use:

```ts
canvasContext.cssToDevicePixels([x, y]);
```

## Types

### `CanvasContextProps`

| Property               | Type                                                 |                                                                                                                                        |
| ---------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `autoResize?` | `boolean` | Whether to resize drawing buffer when canvas size changes |
| `useDevicePixels?` | `boolean \| number` | Use physical pixels (`true`), CSS pixels (`false`), or a fixed ratio (`number`) when auto-resizing. |
| `pixelSizeSource?` | `'exact' \| 'css-dpr'` | How tracked device pixel size is derived for HTML canvases. Defaults to `'exact'`. |
| `width?` | `number` | Width in pixels of the canvas (if `canvas` is not supplied) |
| `height?` | `number` | Height in pixels of the canvas (if `canvas` is not supplied) |
| `canvas?` | `HTMLCanvasElement` \| `OffscreenCanvas` \| `string` | A new canvas will be created if not supplied. |
| `container?` | `HTMLElement \| string \| null` | Parent element or element ID for a new canvas. Defaults to `document.body`. |
| `visible?` | `boolean` | Visibility (only used if new canvas is created). |
| `alphaMode?` | `'opaque' \| 'premultiplied'` | WebGPU presentation alpha mode. |
| `colorSpace?` | `'srgb' \| 'display-p3'` | Presentation color space. Use `'display-p3'` for wide-gamut HDR output. |
| `colorFormat?` | `'rgba8unorm' \| 'bgra8unorm' \| 'rgba16float'` | Optional WebGPU presentation texture format. Use `'rgba16float'` to retain HDR values. |
| `toneMapping?` | `'standard' \| 'extended'` | WebGPU presentation tone mapping. `'extended'` preserves colors brighter than SDR white. |

### `useDevicePixels: boolean | number`

Whether the framebuffer backing this canvas context is auto resized using device pixels.

- `false` - Framebuffer is sized according to CSS pixel size.
- `true` - Framebuffer is sized according to the device pixel ratio reported by the browser.
- `number` - Drawing buffer uses CSS size multiplied by this fixed ratio.

### `pixelSizeSource: 'exact' | 'css-dpr'`

Controls how `CanvasContext` derives tracked device-pixel size for HTML canvases.

- `'exact'` - Prefer `ResizeObserver.devicePixelContentBoxSize` for pixel-perfect sizing.
- `'css-dpr'` - Use `Math.floor(cssSize * devicePixelRatio)` for compatibility with external overlays that size canvases this way.

## Fields

### `canvas: HTMLCanvasElement | OffscreenCanvas`

### `initialized: Promise<void>`

A promise that resolves when the `CanvasContext` been able to obtain its true pixel size.

### `isInitialized: boolean`

Becomes `true` once the `CanvasContext` been able to obtain its true pixel size.

## Methods

### constructor

:::info
A `CanvasContext` should not be constructed directly. Supply `createCanvasContext` when creating a device and access it with `device.getDefaultCanvasContext()`. WebGPU also supports `device.createCanvasContext(...)` for additional renderable canvases.
:::

On `Device` instances that support it (see remarks below) additional canvas contexts are created using `device.createCanvasContext()`. Depending on options passed, this either:
- creates a new canvas element with the specified properties,
- or attaches the context to an existing canvas element

### getCurrentFramebuffer(): Framebuffer

Returns a framebuffer with properly resized current 'swap chain' textures. Rendering to this framebuffer will update the canvas associated with that `CanvasContext`. Note that a new `Framebuffer` must be requested on every redraw cycle.

### `getCSSSize(): [number, number]`

Returns the size in logical (CSS) units. This is useful when mapping DOM events (mouse clicks etc) to the canvas, as their coordinates will be in CSS units.

_Note: For an `OffscreenCanvas` this function always returns the same value as `getDevicePixelSize()`_

### `getDevicePixelSize(): [number, number]`

Returns the size in pixels required to cover the canvas at the current device pixel resolution. Note that this value is just informational, the render buffer can be set to any value independently of this size.

### `getDrawingBufferSize(): [number, number]`

With `autoResize: true` and `useDevicePixels: true`, this follows `getDevicePixelSize()`, subject to backend limits. Other ratios may produce a different drawing-buffer size.

_Note: For an `OffscreenCanvas` this function always returns the same value as `getDevicePixelSize()`_

### `setDrawingBufferSize(width: number, height: number): void`

Resize the drawing surface. Usually called after the window has been resized.

```typescript
canvasContext.setDrawingBufferSize(width, height);
```

- **width**: New drawing surface width.
- **height**: New drawing surface height.

_Note: if `props.autoResize` is true, then automatic resizing is performed as size changes to the underlying canvas object are detected._
