# Device Pixels

Most of the modern computers support retina or HD displays, which support either 2X of 4X number of pixels to the size of screen. By rendering to this bigger size window (Device) and then down sampling it to smaller window (CSS), produces sharp images, but at the cost of performance penalty by rendering more pixels.

## useDevicePixels

`luma.gl` provides control over this behavior using `AnimationLoop`'s [`useDevicePixels`](/docs/api-reference/core/animation-loop.md) prop. When `useDevicePixels` is set to true (default), it will use device's full retina/HD resolution for rendering, when `useDevicePixels` is false, it will use the same resolution as the screen window (CSS window).

As an experimental API, a custom ratio (Number) can be set to `useDevicePixels` prop, to use smaller or bigger ratio than actual device pixel ratio. This is for more advanced use cases, using the default value (`true`) is recommended for this prop. For any advanced use cases, when a value higher than actual device pixel ratio is used, `luma.gl` will first try to allocate internal resources to match this ratio, if it fails, it will reduce this ratio by half, until resources are successfully created.

When a custom ratio is used, `window.devicePixel` ratio can't be used for converting between CSS and Device locations, instead following helper methods should be used.

## Methods

`luma.gl` offers following helper methods for converting from CSS to Device pixels.


### cssToDeviceRatio(gl): Number

Returns a Number, which is the ratio of Device buffer resolution size to CSS buffer resolution.

* `gl` (WebGLContext) - WebGL context.

Returns ratio (Number).


### cssToDevicePixels(gl, cssPixel, yInvert) : Array

Converts CSS pixel location to Device pixel location.

* `gl` (WebGLContext) - WebGL context.
* `cssPixels` (Array) - Array in [x, y] form, where x and y are location in CSS window.
* `yInvert` (Boolean, optional, default: true) - when true it will perform y-inversion when converting to Device pixels.

Returns Device pixel location, [x, y].
