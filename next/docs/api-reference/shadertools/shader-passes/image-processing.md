# Image Processing

Screen space effects packaged as reusable shader modules in `@luma.gl/effects` based on the [glfx library](http://evanw.github.io/glfx.js/).

info

luma.gl shader passes can be used directly with [deck.gl](https://deck.gl)'s postprocessing system. In luma.gl, run them through [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md). The older `Pass` classes from luma.gl v7 are not the current execution API.

For guidance on similar-looking alternatives, including single-pass versus multiscale bloom, SSAO versus GTAO, environment-map versus screen-space reflections, and FXAA versus temporal AA, see [Rendering Techniques and Tradeoffs](https://luma.gl/next/docs/api-guide/shaders/rendering-techniques.md).

## Attribution[​](#attribution "Direct link to Attribution")

Most of these image post processing effects (and this documentation page) are forked from Evan Wallace's [glfx](https://github.com/evanw/glfx.js) library and have just been repackaged as luma.gl shader modules / shader passes.

## Usage[​](#usage "Direct link to Usage")

Import the shader module(s) you would like to use from `@luma.gl/effects`, e.g:

```
import {brightnessContrast} from '@luma.gl/effects';
```

Pass imported effects to [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md) when running them inside luma.gl.

Some effects also consume extra bindings in addition to the default `sourceTexture`. For example, `persistenceEffect` expects a `persistenceTexture` binding containing the previously accumulated frame.

## Shader Modules[​](#shader-modules "Direct link to Shader Modules")

|                                                                                                                         |
| :---------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/mountain.jpg)*Original Image* |

### brightnessContrast[​](#brightnesscontrast "Direct link to brightnessContrast")

Provides additive brightness and multiplicative contrast control.

* `brightness` -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white). Default value is `0`.
* `contrast` -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast). Default value is `0`.

|                                                                                                                                                 |
| :---------------------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/brightness.jpg)*Brightness / Contrast Effect* |

### hueSaturation[​](#huesaturation "Direct link to hueSaturation")

Provides rotational hue and multiplicative saturation control. RGB color space can be imagined as a cube where the axes are the red, green, and blue color values.

Hue changing works by rotating the color vector around the grayscale line, which is the straight line from black (0, 0, 0) to white (1, 1, 1).

Saturation is implemented by scaling all color channel values either toward or away from the average color channel value.

* `hue` -1 to 1 (-1 is 180 degree rotation in the negative direction, 0 is no change, and 1 is 180 degree rotation in the positive direction). Default value is `0`.
* `saturation` -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast). Default value is `0`.

|                                                                                                                                     |
| :---------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/hue.jpg)*Hue / Saturation Effect* |

### noise[​](#noise "Direct link to noise")

Adds black and white noise to the image.

* `amount` 0 to 1 (0 for no effect, 1 for maximum noise). Default value is `0.5`.

|                                                                                                                            |
| :------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/noise.jpg)*Noise Effect* |

### persistenceEffect[​](#persistenceeffect "Direct link to persistenceEffect")

Blends the current frame with a caller-provided history texture to create fading trails and similar temporal feedback effects.

* Extra binding: `persistenceTexture` - the previously accumulated frame.
* Current-frame color is boosted before blending (`color * 4.0`), then clamped back into display range.
* Alpha is rebuilt from both the current frame coverage and the faded history alpha so sparse bright samples remain visible across frames.

This pass is intended for temporal workflows where the application manages history textures explicitly, for example by alternating two `ShaderPassRenderer` instances or application-owned ping-pong textures.

### sepia[​](#sepia "Direct link to sepia")

Gives the image a reddish-brown monochrome tint that imitates an old photograph.

* `amount` 0 to 1 (0 for no effect, 1 for full sepia coloring). Default value is `0.5`.

|                                                                                                                            |
| :------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/sepia.jpg)*Sepia Effect* |

### vibrance[​](#vibrance "Direct link to vibrance")

Modifies the saturation of desaturated colors, leaving saturated colors unmodified.

* `amount` -1 to 1 (-1 is minimum vibrance, 0 is no change, and 1 is maximum vibrance). Default value is `0`.

|                                                                                                                                  |
| :------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/vibrance.jpg)*Vibrance Effect* |

### vignette[​](#vignette "Direct link to vignette")

Adds a simulated lens edge darkening effect.

* `size` 0 to 1 (0 for center of frame, 1 for edge of frame). Default value is `0.5`.
* `amount` 0 to 1 (0 for no effect, 1 for maximum lens darkening). Default value is `0.5`.

|                                                                                                                                  |
| :------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/vignette.jpg)*Vignette Effect* |

### tiltShift[​](#tiltshift "Direct link to tiltShift")

Simulates the shallow depth of field normally encountered in close-up photography, which makes the scene seem much smaller than it actually is. This filter assumes the scene is relatively planar, in which case the part of the scene that is completely in focus can be described by a line (the intersection of the focal plane and the scene). An example of a planar scene might be looking at a road from above at a downward angle. The image is then blurred with a blur radius that starts at zero on the line and increases further from the line.

* `start` \[x, y] coordinate of the start of the line segment. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[0, 0]`.
* `end` \[x, y] coordinate of the end of the line segment. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[1, 1]`.
* `blurRadius` The maximum radius of the pyramid blur in pixels. Default value is `15`.
* `gradientRadius` The distance in pixels from the line at which the maximum blur radius is reached. Default value is `200`.

|                                                                                                                                      |
| :----------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/tilt_shift.jpg)*Tilt Shift Effect* |

### gaussianBlur[​](#gaussianblur "Direct link to gaussianBlur")

Applies a true separable Gaussian blur with a radius-driven kernel and soft falloff. This is a better starting point than `triangleBlur` when you want a softer, more photographic blur kernel.

* `radius` The blur radius in pixels. Default value is `12`, maximum value is `32`.

### bloom[​](#bloom "Direct link to bloom")

Adds a glow to bright areas of the image by extracting pixels above a luminance threshold, softly blurring them, and mixing them back with the source color.

* `radius` Radius of the sampling kernel in pixels. Default value is `4`.
* `threshold` Luminance threshold above which a pixel contributes to bloom. Default value is `0.8`.
* `intensity` Strength of the bloom contribution. Default value is `1`.

### triangleBlur[​](#triangleblur "Direct link to triangleBlur")

This is the most basic blur filter, which convolves the image with a pyramid filter. The pyramid filter is separable and is applied as two perpendicular triangle filters.

* `radius` The radius of the pyramid in pixels convolved with the image. Default value is `20`.

|                                                                                                                                            |
| :----------------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/triangle_blur.jpg)*Triangle Blur Effect* |

### zoomBlur[​](#zoomblur "Direct link to zoomBlur")

Blurs the image away from a certain point, which looks like radial motion blur.

* `center` \[x, y] coordinate of the blur origin. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[0.5, 0.5]`.
* `strength` The strength of the blur. Values in the range 0 to 1 are usually sufficient, where 0 doesn't change the image and 1 creates a highly blurred image. Default value is `0.3`.

|                                                                                                                                    |
| :--------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/zoom_blur.jpg)*Zoom Blur Effect* |

### colorHalftone[​](#colorhalftone "Direct link to colorHalftone")

Simulates a CMYK halftone rendering of the image by multiplying pixel values with a four rotated 2D sine wave patterns, one each for cyan, magenta, yellow, and black.

* `center` \[x, y] coordinate of the pattern origin. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[0.5, 0.5]`.
* `angle` The rotation of the pattern in radians. Default value is `1.1`.
* `size` The diameter of a dot in pixels. Default value is `4`.

|                                                                                                                                              |
| :------------------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/color_halftone.jpg)*Color Halftone Effect* |

### dotScreen[​](#dotscreen "Direct link to dotScreen")

Simulates a black and white halftone rendering of the image by multiplying pixel values with a rotated 2D sine wave pattern.

* `center` \[x, y] coordinate of the pattern origin. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[0.5, 0.5]`.
* `angle` The rotation of the pattern in radians. Default value is `1.1`.
* `size` The diameter of a dot in pixels. Default value is `3`.

|                                                                                                                                      |
| :----------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/dot_screen.jpg)*Dot Screen Effect* |

### edgeWork[​](#edgework "Direct link to edgeWork")

Picks out different frequencies in the image by subtracting two copies of the image blurred with different radii.

* `radius` The radius of the effect in pixels. Default value is `2`.

|                                                                                                                                    |
| :--------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/edge_work.jpg)*Edge Work Effect* |

### hexagonalPixelate[​](#hexagonalpixelate "Direct link to hexagonalPixelate")

Renders the image using a pattern of hexagonal tiles. Tile colors are nearest-neighbor sampled from the centers of the tiles.

* `center` \[x, y] coordinate of the pattern center. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[0.5, 0.5]`.
* `scale` The width of an individual tile in pixels. Default value is `10`.

|                                                                                                                                           |
| :---------------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/hexagon.jpg)*Hexagonal Pixelate Effect* |

### ink[​](#ink "Direct link to ink")

Simulates outlining the image in ink by darkening edges stronger than a certain threshold. The edge detection value is the difference of two copies of the image, each blurred using a blur of a different radius.

* `strength` The multiplicative scale of the ink edges. Values in the range 0 to 1 are usually sufficient, where 0 doesn't change the image and 1 adds lots of black edges. Negative strength values will create white ink edges instead of black ones. Default value is `0.25`.

|                                                                                                                        |
| :--------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/ink.jpg)*Ink Effect* |

### bulgePinch[​](#bulgepinch "Direct link to bulgePinch")

Bulges or pinches the image in a circle.

* `center` \[x, y] coordinate of the center of the circle of effect. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[0.5, 0.5]`.
* `radius` The radius of the circle of effect in pixels. Default value is `200`.
* `strength` -1 to 1 (-1 is strong pinch, 0 is no effect, 1 is strong bulge). Default value is `0.5`.

|                                                                                                                                        |
| :------------------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/bulge_pinch.jpg)*Bulge Pinch Effect* |

### swirl[​](#swirl "Direct link to swirl")

Warps a circular region of the image in a swirl.

* `center` \[x, y] coordinate of the center of the circular region. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner. Default value is `[0.5, 0.5]`.
* `radius` The radius of the circular region in pixels. Default value is `200`.
* `angle` The angle in radians that the pixels in the center of the circular region will be rotated by. Default value is `3`.

|                                                                                                                            |
| :------------------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/uber-common/deck.gl-data/master/images/samples/glfx/results/swirl.jpg)*Swirl Effect* |

### magnify[​](#magnify "Direct link to magnify")

Apply magnify effect to the surrounding area of a given position.

* `screenXY`: x, y position in screen coords, both x and y is normalized and in range `[0, 1]`. `[0, 0]` is the up left corner, `[1, 1]` is the bottom right corner. Default value is `[0, 0]`.
* `radiusPixels`: effect radius in pixels. Default value is `100`.
* `zoom`: magnify level. Default value is `2`.
* `borderWidthPixels`: border width of the effect circle, will not show border if value <= 0.0. Default value is `0`.
* `borderColor`: border color of the effect circle. Default value is `[255, 255, 255, 255]`.

|                                                                                                                     |
| :-----------------------------------------------------------------------------------------------------------------: |
| ![](https://raw.githubusercontent.com/visgl/deck.gl-data/master/luma.gl/examples/effects/magnify.png)*Swirl Effect* |

## Remarks[​](#remarks "Direct link to Remarks")

* Coordinate is based on the original image. `[0, 0]` is the bottom left corner, `[1, 1]` is the up right corner.
