# Device Pixels

Many modern devices support retina or UHD displays can render 2 or 4 times the number of pixels indicated by the CSS dimensions. By rendering to a drawing surface that matches the device and then down sampling it to the smaller (CSS) area, sharper images can be produced but at the cost of rendering more pixels.

The [resizeGLContext](/docs/api-reference/gltools/context) function takes a `useDevicePixels` option that can resize the drawing buffer without resizing the the canvas as displayed on the screen. The following functions are provided to simplify calculations between the display size and device size of the drawing buffer:

### cssToDeviceRatio(gl): Number

Returns the ratio of device buffer resolution size to displayed resolution.

- `gl` (WebGLContext) - WebGL context.

Returns: ratio (Number).

### cssToDevicePixels(gl, cssPixel, yInvert) : Object

Converts CSS pixel location to Device pixel range.

- `gl` (WebGLContext) - WebGL context.
- `cssPixels` (Array) - Array in [x, y] form, where x and y are location in CSS window.
- `yInvert` (Boolean, optional, default: true) - when true it will perform y-inversion when converting to Device pixels.

Returns an Object, `{x, y, width, height}` that represents entire range of device pixels that correspond to given cssPixel location. Following fields define the rectangle.

- `x` (Number): lower x-coordinate
- `y` (Number): lower y-coordinate
- `width` (Number): width in pixels
- `height` (Number): height in pixels
  When `devicePixelRatio` is <=1, `width` and `height` are equal to `one`, otherwise `width` and `height` are greater than one.
