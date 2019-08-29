# Device Pixels

Most of the modern computers support retina or HD displays, which support either 2X of 4X number of pixels to the size of screen. By rendering to this bigger size window (Device) and then down sampling it to smaller window (CSS), produces sharp images, but at the cost of performance penalty by rendering more pixels.

## useDevicePixels

`luma.gl` provides control over this behavior using `AnimationLoop`'s `useDevicePixels` prop. When `useDevicePixels` is set to true (default), it will use device's full retina/HD resolution for rendering, when `useDevicePixels` is false, it will use the same resolution as the screen window (CSS window).

## Methods

`luma.gl` offers following helper methods for converting between CSS and Device pixels.


### getDevicePixelRatio (useDevicePixels) : Number

Depending on `useDevicePixels` value, returns current device pixel ratio or 1.

* `useDevicePixels` (Boolean) - whether to use device resolution or not.

Returns ratio of Device pixels to CSS pixels.

### cssToDevicePixels(gl, cssPixel, yInvert) : Array

Converts CSS pixel location to Device pixel location.

* `gl` (WebGLContext) - WebGL context.
* `cssPixels` (Array) - Array in [x, y] form, where x and y are location in CSS window.
* `yInvert` (Boolean, optional, default: true) - when true it will perform y-inversion when converting to Device pixels.

Returns Device pixel location, [x, y].

### deviceToCssPixels(gl, devicePixel, yInvert) : Array

Converts Device pixel location to CSS pixel location.

* `gl` (WebGLContext) - WebGL context.
* `devicePixel` (Array) - Array in [x, y] form, where x and y are location in Device window.
* `yInvert` (Boolean, optional, default: true) - when true it will perform y-inversion when converting to Device pixels.

Returns CSS pixel location, [x, y].
