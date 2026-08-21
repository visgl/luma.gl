# Type Alias: CanvasContextProps

> **CanvasContextProps** = `object`

Defined in: [modules/core/src/adapter/canvas-surface.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L17)

Properties for a CanvasContext

## Properties[​](#properties "Direct link to Properties")

### alphaMode?[​](#alphamode "Direct link to alphaMode?")

> `optional` **alphaMode?**: `"opaque"` | `"premultiplied"`

Defined in: [modules/core/src/adapter/canvas-surface.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L44)

#### See[​](#see "Direct link to See")

<https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#alphamode>

***

### autoResize?[​](#autoresize "Direct link to autoResize?")

> `optional` **autoResize?**: `boolean`

Defined in: [modules/core/src/adapter/canvas-surface.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L42)

Whether to track window resizes.

***

### canvas?[​](#canvas "Direct link to canvas?")

> `optional` **canvas?**: `HTMLCanvasElement` | `OffscreenCanvas` | `string` | `null`

Defined in: [modules/core/src/adapter/canvas-surface.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L21)

If a canvas not supplied, one will be created and added to the DOM. If a string, a canvas with that id will be looked up in the DOM

***

### colorFormat?[​](#colorformat "Direct link to colorFormat?")

> `optional` **colorFormat?**: `"rgba8unorm"` | `"bgra8unorm"` | `"rgba16float"`

Defined in: [modules/core/src/adapter/canvas-surface.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L48)

Optional WebGPU presentation texture format. Use rgba16float for HDR presentation.

***

### colorSpace?[​](#colorspace "Direct link to colorSpace?")

> `optional` **colorSpace?**: `"srgb"` | `"display-p3"`

Defined in: [modules/core/src/adapter/canvas-surface.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L46)

#### See[​](#see-1 "Direct link to See")

<https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure#colorspace>

***

### container?[​](#container "Direct link to container?")

> `optional` **container?**: `HTMLElement` | `string` | `null`

Defined in: [modules/core/src/adapter/canvas-surface.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L23)

If new canvas is created, it will be created in the specified container, otherwise is appended as a child of document.body

***

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L27)

Height in pixels of the canvas - used when creating a new canvas

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/core/src/adapter/canvas-surface.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L19)

Identifier, for debugging

***

### pixelSizeSource?[​](#pixelsizesource "Direct link to pixelSizeSource?")

> `optional` **pixelSizeSource?**: `"exact"` | `"css-dpr"`

Defined in: [modules/core/src/adapter/canvas-surface.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L40)

How to derive the tracked device pixel size for HTML canvases when auto-resizing.

* `'exact'` uses `ResizeObserver.devicePixelContentBoxSize` when available to match the browser's exact physical pixel coverage.
* `'css-dpr'` uses `Math.floor(cssSize * devicePixelRatio)` to match overlays and external canvases that size their drawing buffer via implicit truncation (e.g. `canvas.width = css * dpr`).

***

### toneMapping?[​](#tonemapping "Direct link to toneMapping?")

> `optional` **toneMapping?**: `"standard"` | `"extended"`

Defined in: [modules/core/src/adapter/canvas-surface.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L50)

Whether WebGPU presentation preserves colors brighter than SDR white.

***

### trackPosition?[​](#trackposition "Direct link to trackPosition?")

> `optional` **trackPosition?**: `boolean`

Defined in: [modules/core/src/adapter/canvas-surface.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L52)

Whether to track position changes. Calls this.device.onPositionChange

***

### useDevicePixels?[​](#usedevicepixels "Direct link to useDevicePixels?")

> `optional` **useDevicePixels?**: `boolean` | `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L31)

Whether to size the drawing buffer to the pixel size during auto resize. If a number is provided it is used as a static pixel ratio

***

### visible?[​](#visible "Direct link to visible?")

> `optional` **visible?**: `boolean`

Defined in: [modules/core/src/adapter/canvas-surface.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L29)

Visibility (only used if new canvas is created).

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L25)

Width in pixels of the canvas - used when creating a new canvas
