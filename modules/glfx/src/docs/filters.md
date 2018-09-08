# glfx Filters


An image effects library packaged as reusable shadermodules based on the [glfx library](http://evanw.github.io/glfx.js/).


## Attribution / License

This is a repackaging of mostly shader code from [Evan Wallace](https://github.com/evanw/glfx.js)'s wonderful glfx library.

The code and documentation is included here under MIT license.


## Filters


### Brightness / Contrast

Provides additive brightness and multiplicative contrast control.
* `brightness` -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
* `contrast`   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)


### Curves

A powerful mapping tool that transforms the colors in the image by an arbitrary function. The function is interpolated between a set of 2D points using splines. The curves filter can take either one or three arguments which will apply the mapping to either luminance or RGB values, respectively.

* `red` -   A list of points that define the function for the red channel. Each point is a list of two values: the value before the mapping and the value after the mapping, both in the range 0 to 1. For example, [[0,1], [1,0]] would invert the red channel while [[0,0], [1,1]] would leave the red channel unchanged. If green and blue are omitted then this argument also applies to the green and blue channels.
* `green` - (optional) A list of points that define the function for the green channel (just like for red).
* `blue` -  (optional) A list of points that define the function for the blue channel (just like for red).


### Denoise

Smooths over grainy noise in dark images using an 9x9 box filter weighted by color intensity, similar to a bilateral filter.

* `exponent` - The exponent of the color intensity difference, should be greater than zero. A value of zero just gives an 9x9 box blur and high values give the original image, but ideal values are usually around 10-20.


### Hue / Saturation

Provides rotational hue and multiplicative saturation control. RGB color space can be imagined as a cube where the axes are the red, green, and blue color values.

Hue changing works by rotating the color vector around the grayscale line, which is the straight line from black (0, 0, 0) to white (1, 1, 1).

Saturation is implemented by scaling all color channel values either toward or away from the average color channel value.

* `hue` - -1 to 1 (-1 is 180 degree rotation in the negative direction, 0 is no change, and 1 is 180 degree rotation in the positive direction)
* `saturation` - -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)


### Noise

Adds black and white noise to the image.

* `amount`   0 to 1 (0 for no effect, 1 for maximum noise)


### Sepia


Gives the image a reddish-brown monochrome tint that imitates an old photograph.

* `amount`   0 to 1 (0 for no effect, 1 for full sepia coloring)


### Unsharp Mask

A form of image sharpening that amplifies high-frequencies in the image. It
is implemented by scaling pixels away from the average of their neighbors.

* `radius`   The blur radius that calculates the average of the neighboring pixels.
* `strength` A scale factor where 0 is no effect and higher values cause a stronger effect.


### Vibrance

Modifies the saturation of desaturated colors, leaving saturated colors unmodified.

* `amount` -1 to 1 (-1 is minimum vibrance, 0 is no change, and 1 is maximum vibrance)


### Vignette

Adds a simulated lens edge darkening effect.

* `size`     0 to 1 (0 for center of frame, 1 for edge of frame)
* `amount`   0 to 1 (0 for no effect, 1 for maximum lens darkening)


### Lens Blur

Imitates a camera capturing the image out of focus by using a blur that generates the large shapes known as bokeh. The polygonal shape of real bokeh is due to the blades of the aperture diaphragm when it isn't fully open. This blur renders bokeh from a 6-bladed diaphragm because the computation is more efficient. It can be separated into three rhombi, each of which is just a skewed box blur. This filter makes use of the floating point texture WebGL extension to implement the brightness parameter, so there will be severe visual artifacts if brightness is non-zero and the floating point texture extension is not available. The idea was from John White's SIGGRAPH 2011 talk but this effect has an additional brightness parameter that fakes what would otherwise come from a HDR source.

 * `radius`     the radius of the hexagonal disk convolved with the image
 * `brightness` -1 to 1 (the brightness of the bokeh, negative values will create dark bokeh)
 * `angle`      the rotation of the bokeh in radians


### Tilt Shift

Simulates the shallow depth of field normally encountered in close-up photography, which makes the scene seem much smaller than it actually is. This filter assumes the scene is relatively planar, in which case the part of the scene that is completely in focus can be described by a line (the intersection of the focal plane and the scene). An example of a planar scene might be looking at a road from above at a downward angle. The image is then blurred with a blur radius that starts at zero on the line and increases further from the line.

 * `startX`         The x coordinate of the start of the line segment.
 * `startY`         The y coordinate of the start of the line segment.
 * `endX`           The x coordinate of the end of the line segment.
 * `endY`           The y coordinate of the end of the line segment.
 * `blurRadius`     The maximum radius of the pyramid blur.
 * `gradientRadius` The distance from the line at which the maximum blur radius is reached.


### Triangle Blur

This is the most basic blur filter, which convolves the image with a pyramid filter. The pyramid filter is separable and is applied as two perpendicular triangle filters.

* `radius` The radius of the pyramid convolved with the image.


### Zoom Blur

Blurs the image away from a certain point, which looks like radial motion blur.

* `centerX`  The x coordinate of the blur origin.
* `centerY`  The y coordinate of the blur origin.
* `strength` The strength of the blur. Values in the range 0 to 1 are usually sufficient, where 0 doesn't change the image and 1 creates a highly blurred image.


###  Color Halftone

 Simulates a CMYK halftone rendering of the image by multiplying pixel values with a four rotated 2D sine wave patterns, one each for cyan, magenta, yellow, and black.

* `centerX` - The x coordinate of the pattern origin.
* `centerY` - The y coordinate of the pattern origin.
* `angle` -   The rotation of the pattern in radians.
* `size` -    The diameter of a dot in pixels.


### Dot Screen

Simulates a black and white halftone rendering of the image by multiplying pixel values with a rotated 2D sine wave pattern.

* `centerX` The x coordinate of the pattern origin.
* `centerY` The y coordinate of the pattern origin.
* `angle`   The rotation of the pattern in radians.
* `size`    The diameter of a dot in pixels.


### Edge Work

Picks out different frequencies in the image by subtracting two copies of the image blurred with different radii.

* `radius` - The radius of the effect in pixels.


### Hexagonal Pixelate

Renders the image using a pattern of hexagonal tiles. Tile colors are nearest-neighbor sampled from the centers of the tiles.

* `centerX` The x coordinate of the pattern center.
* `centerY` The y coordinate of the pattern center.
* `scale`   The width of an individual tile, in pixels.


### Ink

Simulates outlining the image in ink by darkening edges stronger than a certain threshold. The edge detection value is the difference of two copies of the image, each blurred using a blur of a different radius.

* `strength` The multiplicative scale of the ink edges. Values in the range 0 to 1 are usually sufficient, where 0 doesn't change the image and 1 adds lots of black edges. Negative strength values will create white ink edges instead of black ones.


### Bulge / Pinch

Bulges or pinches the image in a circle.

* `centerX`  The x coordinate of the center of the circle of effect.
* `centerY`  The y coordinate of the center of the circle of effect.
* `radius`   The radius of the circle of effect.
* `strength` -1 to 1 (-1 is strong pinch, 0 is no effect, 1 is strong bulge)


### Matrix Warp

Transforms an image by a 2x2 or 3x3 matrix. The coordinates used in the transformation are (x, y) for a 2x2 matrix or (x, y, 1) for a 3x3 matrix, where x and y are in units of pixels.

* `matrix`          A 2x2 or 3x3 matrix represented as either a list or a list of lists. For example, the 3x3 matrix [[2,0,0],[0,3,0],[0,0,1]] can also be represented as [2,0,0,0,3,0,0,0,1] or just [2,0,0,3].
* `inverse`         A boolean value that, when true, applies the inverse transformation instead. (optional, defaults to false)
* `useTextureSpace` A boolean value that, when true, uses texture-space coordinates instead of screen-space coordinates. Texture-space coordinates range from -1 to 1 instead of 0 to width - 1 or height - 1, and are easier to use for simple operations like flipping and rotating.


### Perspective

Warps one quadrangle to another with a perspective transform. This can be used to make a 2D image look 3D or to recover a 2D image captured in a 3D environment.

* `before` The x and y coordinates of four points before the transform in a flat list. This would look like [ax, ay, bx, by, cx, cy, dx, dy] for four points (ax, ay), (bx, by), (cx, cy), and (dx, dy).
* `after`  The x and y coordinates of four points after the transform in a flat list, just like the other argument.


### Swirl

Warps a circular region of the image in a swirl.

* `centerX` The x coordinate of the center of the circular region.
* `centerY` The y coordinate of the center of the circular region.
* `radius`  The radius of the circular region.
* `angle`   The angle in radians that the pixels in the center of the circular region will be rotated by.

