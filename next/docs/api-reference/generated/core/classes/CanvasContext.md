# Abstract Class: CanvasContext

Defined in: [modules/core/src/adapter/canvas-context.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-context.ts#L12)

Manages a renderable backend canvas. Supports both HTML or offscreen canvas and returns backend framebuffers sourced from the canvas itself.

## Extends[​](#extends "Direct link to Extends")

* `CanvasSurface`

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new CanvasContext**(`props?`): `CanvasContext`

Defined in: [modules/core/src/adapter/canvas-surface.ts:150](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L150)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md)

#### Returns[​](#returns "Direct link to Returns")

`CanvasContext`

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

`CanvasSurface.constructor`

## Properties[​](#properties "Direct link to Properties")

### canvas[​](#canvas "Direct link to canvas")

> `readonly` **canvas**: `HTMLCanvasElement` | `OffscreenCanvas`

Defined in: [modules/core/src/adapter/canvas-surface.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L103)

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

`CanvasSurface.canvas`

***

### cssHeight[​](#cssheight "Direct link to cssHeight")

> **cssHeight**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L120)

Height of canvas in CSS units (tracked by a ResizeObserver)

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

`CanvasSurface.cssHeight`

***

### cssWidth[​](#csswidth "Direct link to cssWidth")

> **cssWidth**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L118)

Width of canvas in CSS units (tracked by a ResizeObserver)

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

`CanvasSurface.cssWidth`

***

### device[​](#device "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/adapter/canvas-surface.ts:98](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L98)

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

`CanvasSurface.device`

***

### devicePixelHeight[​](#devicepixelheight "Direct link to devicePixelHeight")

> **devicePixelHeight**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L127)

Exact height of canvas in physical pixels (tracked by a ResizeObserver)

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

`CanvasSurface.devicePixelHeight`

***

### devicePixelRatio[​](#devicepixelratio "Direct link to devicePixelRatio")

> **devicePixelRatio**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L123)

Device pixel ratio. Automatically updated via media queries

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

`CanvasSurface.devicePixelRatio`

***

### devicePixelWidth[​](#devicepixelwidth "Direct link to devicePixelWidth")

> **devicePixelWidth**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L125)

Exact width of canvas in physical pixels (tracked by a ResizeObserver)

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

`CanvasSurface.devicePixelWidth`

***

### drawingBufferHeight[​](#drawingbufferheight "Direct link to drawingBufferHeight")

> **drawingBufferHeight**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L132)

Height of drawing buffer: automatically tracks this.pixelHeight if props.autoResize is true

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

`CanvasSurface.drawingBufferHeight`

***

### drawingBufferWidth[​](#drawingbufferwidth "Direct link to drawingBufferWidth")

> **drawingBufferWidth**: `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L130)

Width of drawing buffer: automatically tracks this.pixelWidth if props.autoResize is true

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

`CanvasSurface.drawingBufferWidth`

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/canvas-context.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-context.ts#L15)

#### Overrides[​](#overrides "Direct link to Overrides")

`CanvasSurface.handle`

***

### htmlCanvas?[​](#htmlcanvas "Direct link to htmlCanvas?")

> `readonly` `optional` **htmlCanvas?**: `HTMLCanvasElement`

Defined in: [modules/core/src/adapter/canvas-surface.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L105)

Handle to HTML canvas

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

`CanvasSurface.htmlCanvas`

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/core/src/adapter/canvas-surface.ts:100](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L100)

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

`CanvasSurface.id`

***

### initialized[​](#initialized "Direct link to initialized")

> **initialized**: `Promise`<`void`>

Defined in: [modules/core/src/adapter/canvas-surface.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L111)

Promise that resolved once the resize observer has updated the pixel size

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

`CanvasSurface.initialized`

***

### isInitialized[​](#isinitialized "Direct link to isInitialized")

> **isInitialized**: `boolean` = `false`

Defined in: [modules/core/src/adapter/canvas-surface.ts:112](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L112)

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

`CanvasSurface.isInitialized`

***

### isVisible[​](#isvisible "Direct link to isVisible")

> **isVisible**: `boolean` = `true`

Defined in: [modules/core/src/adapter/canvas-surface.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L115)

Visibility is automatically updated (via an IntersectionObserver)

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

`CanvasSurface.isVisible`

***

### offscreenCanvas?[​](#offscreencanvas "Direct link to offscreenCanvas?")

> `readonly` `optional` **offscreenCanvas?**: `OffscreenCanvas`

Defined in: [modules/core/src/adapter/canvas-surface.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L107)

Handle to wrapped OffScreenCanvas

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

`CanvasSurface.offscreenCanvas`

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<[`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md)>

Defined in: [modules/core/src/adapter/canvas-surface.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L102)

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

`CanvasSurface.props`

***

### type[​](#type "Direct link to type")

> `readonly` **type**: `"html-canvas"` | `"offscreen-canvas"` | `"node"`

Defined in: [modules/core/src/adapter/canvas-surface.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L108)

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

`CanvasSurface.type`

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md)> = `CanvasSurface.defaultProps`

Defined in: [modules/core/src/adapter/canvas-context.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-context.ts#L13)

#### Overrides[​](#overrides-1 "Direct link to Overrides")

`CanvasSurface.defaultProps`

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** `abstract` **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/canvas-surface.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L144)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

`CanvasSurface.[toStringTag]`

## Methods[​](#methods "Direct link to Methods")

### \_observeDevicePixelRatio()[​](#_observedevicepixelratio "Direct link to _observeDevicePixelRatio()")

> **\_observeDevicePixelRatio**(): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:449](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L449)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

`CanvasSurface._observeDevicePixelRatio`

***

### \_resizeDrawingBufferIfNeeded()[​](#_resizedrawingbufferifneeded "Direct link to _resizeDrawingBufferIfNeeded()")

> **\_resizeDrawingBufferIfNeeded**(): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:435](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L435)

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-20 "Direct link to Inherited from")

`CanvasSurface._resizeDrawingBufferIfNeeded`

***

### \_startObservers()[​](#_startobservers "Direct link to _startObservers()")

> **\_startObservers**(): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:322](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L322)

Starts DOM observation after the derived context and its device are fully initialized.

`CanvasSurface` construction runs before subclasses can assign `this.device`, and the default WebGL canvas context is created before `WebGLDevice` has initialized `limits`, `features`, and the rest of its runtime state. Deferring observer startup avoids early `ResizeObserver` and DPR callbacks running against a partially initialized device.

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-21 "Direct link to Inherited from")

`CanvasSurface._startObservers`

***

### \_stopObservers()[​](#_stopobservers "Direct link to _stopObservers()")

> **\_stopObservers**(): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:337](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L337)

Stops all DOM observation and timers associated with a canvas surface.

This pairs with `_startObservers()` so teardown uses the same lifecycle whether a context is explicitly destroyed, abandoned during device reuse, or temporarily has not started observing yet. Centralizing shutdown here keeps resize/DPR/position watchers from surviving past the lifetime of the owning device.

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-22 "Direct link to Inherited from")

`CanvasSurface._stopObservers`

***

### cssToDevicePixels()[​](#csstodevicepixels "Direct link to cssToDevicePixels()")

> **cssToDevicePixels**(`cssPixel`, `yInvert?`): `object`

Defined in: [modules/core/src/adapter/canvas-surface.ts:261](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L261)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### cssPixel[​](#csspixel "Direct link to cssPixel")

\[`number`, `number`]

##### yInvert?[​](#yinvert "Direct link to yInvert?")

`boolean` = `true`

#### Returns[​](#returns-6 "Direct link to Returns")

`object`

##### height[​](#height "Direct link to height")

> **height**: `number`

##### width[​](#width "Direct link to width")

> **width**: `number`

##### x[​](#x "Direct link to x")

> **x**: `number`

##### y[​](#y "Direct link to y")

> **y**: `number`

#### Inherited from[​](#inherited-from-23 "Direct link to Inherited from")

`CanvasSurface.cssToDevicePixels`

***

### ~~cssToDeviceRatio()~~[​](#csstodeviceratio "Direct link to csstodeviceratio")

> **cssToDeviceRatio**(): `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:287](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L287)

#### Returns[​](#returns-7 "Direct link to Returns")

`number`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Returns multiplier need to convert CSS size to Device size

#### Inherited from[​](#inherited-from-24 "Direct link to Inherited from")

`CanvasSurface.cssToDeviceRatio`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:199](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L199)

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-25 "Direct link to Inherited from")

`CanvasSurface.destroy`

***

### ~~getAspect()~~[​](#getaspect "Direct link to getaspect")

> **getAspect**(): `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:281](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L281)

#### Returns[​](#returns-9 "Direct link to Returns")

`number`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use the current drawing buffer size for projection setup.

#### Inherited from[​](#inherited-from-26 "Direct link to Inherited from")

`CanvasSurface.getAspect`

***

### getCSSSize()[​](#getcsssize "Direct link to getCSSSize()")

> **getCSSSize**(): \[`number`, `number`]

Defined in: [modules/core/src/adapter/canvas-surface.ts:224](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L224)

#### Returns[​](#returns-10 "Direct link to Returns")

\[`number`, `number`]

#### Inherited from[​](#inherited-from-27 "Direct link to Inherited from")

`CanvasSurface.getCSSSize`

***

### getCurrentFramebuffer()[​](#getcurrentframebuffer "Direct link to getCurrentFramebuffer()")

> **getCurrentFramebuffer**(`options?`): [`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)

Defined in: [modules/core/src/adapter/canvas-surface.ts:217](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L217)

Returns a framebuffer with properly resized current 'swap chain' textures

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### options?[​](#options "Direct link to options?")

###### depthStencilFormat?[​](#depthstencilformat "Direct link to depthStencilFormat?")

`false` | [`TextureFormatDepthStencil`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatDepthStencil.md)

#### Returns[​](#returns-11 "Direct link to Returns")

[`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)

#### Inherited from[​](#inherited-from-28 "Direct link to Inherited from")

`CanvasSurface.getCurrentFramebuffer`

***

### getDevicePixelRatio()[​](#getdevicepixelratio "Direct link to getDevicePixelRatio()")

> **getDevicePixelRatio**(): `number`

Defined in: [modules/core/src/adapter/canvas-surface.ts:256](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L256)

#### Returns[​](#returns-12 "Direct link to Returns")

`number`

#### Inherited from[​](#inherited-from-29 "Direct link to Inherited from")

`CanvasSurface.getDevicePixelRatio`

***

### getDevicePixelSize()[​](#getdevicepixelsize "Direct link to getDevicePixelSize()")

> **getDevicePixelSize**(): \[`number`, `number`]

Defined in: [modules/core/src/adapter/canvas-surface.ts:232](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L232)

#### Returns[​](#returns-13 "Direct link to Returns")

\[`number`, `number`]

#### Inherited from[​](#inherited-from-30 "Direct link to Inherited from")

`CanvasSurface.getDevicePixelSize`

***

### getDrawingBufferSize()[​](#getdrawingbuffersize "Direct link to getDrawingBufferSize()")

> **getDrawingBufferSize**(): \[`number`, `number`]

Defined in: [modules/core/src/adapter/canvas-surface.ts:236](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L236)

#### Returns[​](#returns-14 "Direct link to Returns")

\[`number`, `number`]

#### Inherited from[​](#inherited-from-31 "Direct link to Inherited from")

`CanvasSurface.getDrawingBufferSize`

***

### getMaxDrawingBufferSize()[​](#getmaxdrawingbuffersize "Direct link to getMaxDrawingBufferSize()")

> **getMaxDrawingBufferSize**(): \[`number`, `number`]

Defined in: [modules/core/src/adapter/canvas-surface.ts:240](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L240)

#### Returns[​](#returns-15 "Direct link to Returns")

\[`number`, `number`]

#### Inherited from[​](#inherited-from-32 "Direct link to Inherited from")

`CanvasSurface.getMaxDrawingBufferSize`

***

### ~~getPixelSize()~~[​](#getpixelsize "Direct link to getpixelsize")

> **getPixelSize**(): \[`number`, `number`]

Defined in: [modules/core/src/adapter/canvas-surface.ts:276](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L276)

#### Returns[​](#returns-16 "Direct link to Returns")

\[`number`, `number`]

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

* use .getDevicePixelSize()

#### Inherited from[​](#inherited-from-33 "Direct link to Inherited from")

`CanvasSurface.getPixelSize`

***

### getPosition()[​](#getposition "Direct link to getPosition()")

> **getPosition**(): \[`number`, `number`]

Defined in: [modules/core/src/adapter/canvas-surface.ts:228](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L228)

#### Returns[​](#returns-17 "Direct link to Returns")

\[`number`, `number`]

#### Inherited from[​](#inherited-from-34 "Direct link to Inherited from")

`CanvasSurface.getPosition`

***

### ~~resize()~~[​](#resize "Direct link to resize")

> **resize**(`size`): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:298](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L298)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### size[​](#size "Direct link to size")

###### height[​](#height-1 "Direct link to height")

`number`

###### width[​](#width-1 "Direct link to width")

`number`

#### Returns[​](#returns-18 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

Use canvasContext.setDrawingBufferSize()

#### Inherited from[​](#inherited-from-35 "Direct link to Inherited from")

`CanvasSurface.resize`

***

### setDrawingBufferSize()[​](#setdrawingbuffersize "Direct link to setDrawingBufferSize()")

> **setDrawingBufferSize**(`width`, `height`): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:245](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L245)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### width[​](#width-2 "Direct link to width")

`number`

##### height[​](#height-2 "Direct link to height")

`number`

#### Returns[​](#returns-19 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-36 "Direct link to Inherited from")

`CanvasSurface.setDrawingBufferSize`

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `this`

Defined in: [modules/core/src/adapter/canvas-surface.ts:208](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L208)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

`MutableCanvasContextProps`

#### Returns[​](#returns-20 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-37 "Direct link to Inherited from")

`CanvasSurface.setProps`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/canvas-surface.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L146)

#### Returns[​](#returns-21 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-38 "Direct link to Inherited from")

`CanvasSurface.toString`

***

### updatePosition()[​](#updateposition "Direct link to updatePosition()")

> **updatePosition**(): `void`

Defined in: [modules/core/src/adapter/canvas-surface.ts:472](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L472)

#### Returns[​](#returns-22 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-39 "Direct link to Inherited from")

`CanvasSurface.updatePosition`

***

### isHTMLCanvas()[​](#ishtmlcanvas "Direct link to isHTMLCanvas()")

> `static` **isHTMLCanvas**(`canvas`): `canvas is HTMLCanvasElement`

Defined in: [modules/core/src/adapter/canvas-surface.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L73)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### canvas[​](#canvas-1 "Direct link to canvas")

`unknown`

#### Returns[​](#returns-23 "Direct link to Returns")

`canvas is HTMLCanvasElement`

#### Inherited from[​](#inherited-from-40 "Direct link to Inherited from")

`CanvasSurface.isHTMLCanvas`

***

### isOffscreenCanvas()[​](#isoffscreencanvas "Direct link to isOffscreenCanvas()")

> `static` **isOffscreenCanvas**(`canvas`): `canvas is OffscreenCanvas`

Defined in: [modules/core/src/adapter/canvas-surface.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/canvas-surface.ts#L77)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### canvas[​](#canvas-2 "Direct link to canvas")

`unknown`

#### Returns[​](#returns-24 "Direct link to Returns")

`canvas is OffscreenCanvas`

#### Inherited from[​](#inherited-from-41 "Direct link to Inherited from")

`CanvasSurface.isOffscreenCanvas`
