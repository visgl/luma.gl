# Texture

A `Texture` is a WebGL object that contains one or more images that all have the same image format. Shaders can read from textures (through a sampler uniform) and they can be set up as render targets (by attaching them to a framebuffer).

Note: This section describes the `Texture` base class that implements functionality common to all four types of WebGL:
* [`Texture2D`](/docs/api-reference/webgl/texture-2d.md) - Contains a "normal" image texture
* [`TextureCube`](/docs/api-reference/webgl/texture-cube.md) - Holds 6 textures representing sides of a cube.
* [`Texture2DArray`](/docs/api-reference/webgl/texture-2d-array.md) (WebGL2) - Holds an array of textures
* [`Texture3D`](/docs/api-reference/webgl/texture-3d.md) (WebGL2) - Holds a "stack" of textures which enables 3D interpolation.

For more details see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Texture).

Note that textures have a lot of optional capabilities made available by extensions, see the Limits section below.


## Usage

* For additional usage examples, `Texture` inherits from [`Resource`](/docs/api-reference/webgl/resource.md).

Configuring a Texture
```js
const texture = new Texture2D(gl);
texture.setParameters({
  [GL.TEXTURE_WRAP_S]: GL.CLAMP
});
```

Using Textures
```js
const texture = new Texture2D(gl, ...);

// For ease of use, the `Model` class can bind textures for a draw call
model.draw({
  uniforms({uMVMatrix: matrix, texture1: texture, texture2: texture})
});

// Alternatively, bind the textures using the `Texture` API directly
texture.bind(0);
texture.bind(1);
model.draw({
  uniforms({uMVMatrix: matrix})
});
```

## Members

A number of read only accessors are available:

* `width` - width of one face of the cube map
* `height` - height of one face of the cube map
* `format` - internal format of the face textures
* `border` - Always 0.

* `type` - type used to create face textures
* `dataFormat` - data format used to create face textures.
* `offset` - offset used to create face textures. Always 0, unless specified using WebGL2 buffer constructor.

* `handle` - The underlying WebGL object.
* `id` - An identifying string that is intended to help debugging.

Sampler parameters can be accessed using `Texture.getParameter`, e.g:

`texture.getParameter(GL.TEXTURE_MAG_FILTER);`


## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

The texture class cannot be constructed directly. It is a base class that provides common methods the the concrete texture classes.
* [`Texture2D`](/docs/api-reference/webgl/texture-2d.md),
* [`TextureCube`](/docs/api-reference/webgl/texture-cube.md),
* [`Texture2DArray`](/docs/api-reference/webgl/texture-2d-array.md) and
* [`Texture3D`](/docs/api-reference/webgl/texture-3d.md).

The constructors for these classes should be used to create textures. They constructors all take common parameters, many of which are specified in this document.

* Sampling parameters are described in [`Sampler`](/docs/api-reference/webgl/sampler.md).
* Pixel store parameters are described in [`State Management`](/docs/api-reference/webgl/context/get-parameters.md).


### generateMipmap() : Texture2D

Call to regenerate mipmaps after modifying texture(s)

WebGL References [gl.generateMipmap](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap)


### setImageData(options : Object) : Texture2D

Allocates storage and sets image data

```js
  Texture.setImageData({
    target = this.target,
    pixels = null,
    data = null,
    width,
    height,
    level = 0,
    format = GL.RGBA,
    type,
    dataFormat,
    offset = 0,
    border = 0,
    compressed = false,
    parameters= {}
  });
```

* `data` (*) - Image data. Can be one of several data types see table below
* `pixels` (*) - alternative to  `data`
* `width` (GLint) -
* `height` (GLint) -
* `level` (GLint) -
* `format` (GLenum) - format of image data.
* `type` (GLenum)
 - format of array (autodetect from type) or
 - (WEBGL2) format of buffer
* `offset` (Number) - (WEBGL2) offset from start of buffer
* `border` (GLint) - must be 0.
* `compressed` (Boolean) -
* `parameters` (Object) - GL parameters to be temporarily applied (most of the time, pixelStorage parameters) when updating the texture.

Valid image data types:

* `null` - create empty texture of specified format
* Typed array - initializes from image data in typed array according to `format`
* `Buffer`|`WebGLBuffer` - (WEBGL2) initialized from image data in WebGLBuffer accoeding to `format`.
* `HTMLImageElement`|`Image` - Initializes with content of image. Auto deduces texture width/height from image.
* `HTMLCanvasElement` - Inits with contents of canvas. Auto width/height.
* `HTMLVideoElement` - Creates video texture that continuously updates. Auto width/height.


### setSubImageData(options : Object) : Texture2D

Redefines an area of an existing texture
Note: does not allocate storage

```
  Texture.setSubImageData({
    target = this.target,
    pixels = null,
    data = null,
    x = 0,
    y = 0,
    width,
    height,
    level = 0,
    format = GL.RGBA,
    type,
    dataFormat,
    compressed = false,
    offset = 0,
    border = 0,
    parameters = {}
  });
```

* `x` (`GLint`) - xOffset from where texture to be updated
* `y` (`GLint`) - yOffset from where texture to be updated
* `width` (`GLint`) - width of the sub image to be updated
* `height` (`GLint`) - height of the sub image to be updated
* `level` (`GLint`) - mip level to be updated
* `format` (`GLenum`) - internal format of image data.
* `typ` (`GLenum`) - format of array (autodetect from type) or (WEBGL2) format of buffer or ArrayBufferView
* `dataFormat` (`GLenum`) - format of image data.
* `offset` (`Number`) - (WEBGL2) offset from start of buffer
* `border` (`GLint`) - must be 0.
* parameters - temporary settings to be applied, can be used to supply pixel store settings.

See also [gl.compressedTexSubImage2D](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compressedTexSubImage2D), [gl.texSubImage2D](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D), [gl.bindTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture), [gl.bindBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer)


### getActiveUnit()

Returns number of active textures.


### bind()

Binds itself to given textureUnit.

The following WebGL APIs are called in the function
[gl.activeTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture), [gl.bindTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture)


### unbind()

The following WebGL APIs are called in the function
[gl.activeTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture), [gl.bindTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture)


## Texture Image Data

WebGL allows textures to be created from a number of different data sources.

| Type                               | Description  |
| ---------------------------------- | -----------  |
| `null`                             | A texture will be created with the appropriate format, size and width. Bytes will be "uninitialized". |
| `typed array`                      | Bytes will be interpreted according to format/type parameters and pixel store parameters. |
| `Buffer` or `WebGLBuffer` (`WebGL2`) | Bytes will be interpreted according to format/type parameters and pixel store parameters. |
| `Image` (`HTMLImageElement`)       | image will be used to fill the texture. width and height will be deduced. |
| `Video` (`HTMLVideoElement`)       | video will be played, continously updating the texture. width and height will be deduced. |
| `Canvas` (`HTMLCanvasElement`)     | canvas will be used to fill the texture. width and height will be deduced. |
| `ImageData`                        | `canvas.getImageData()` - Used to fill the texture. width and height will be deduced. |



## Texture Formats

### Internal Format

If an application wants to store the texture at a certain resolution or in a certain format, it can request the resolution and format with `internalFormat`. WebGL will choose an internal representation with least the internal component sizes, and exactly the component types shown for that format, although it may not match exactly.

WebGL2 adds sized internal formats which enables the application to request
specific components sizes and types (float and integer formats). While sized formats offer more control, unsized formats do give the GPU freedom to select the most performant internal representation.


| Unsized Internal Format | Components | Description |
| ----------------------- | ---------- | ----------- |
| `GL.RGB`                | 3          | sampler reads the red, green and blue components, alpha is 1.0 |
| `GL.RGBA`               | 4          | Red, green, blue and alpha components are sampled from the color buffer. |
| `GL.LUMINANCE`          | 1          | Each color contains a single luminance value. When sampled, rgb are all set to this luminance, alpha is 1.0. |
| `GL.LUMINANCE_ALPHA`    | 2          | Each component is a luminance/alpha double. When sampled, rgb are all set to luminance, alpha from component. |
| `GL.ALPHA`              | 1          | Discards the red, green and blue components and reads the alpha component. |
| `GL.DEPTH_COMPONENT`    | 1          | WebGL2 or `WEBGL_depth_texture` |
| `GL.DEPTH_STENCIL`      | 2          | WebGL2 or `WEBGL_depth_texture` |

| Sized Internal Format   | Comp. |   Size   | Description   |
| ----------------------- | ----- | -------- | ------------- |
| `GL.R8` (WebGL2)        | 1     | 8 bits   | red component |
| `GL.R16F` (WebGL2)      | 1     | 16 bits  | half float red component |
| `GL.R32F` (WebGL2)      | 1     | 32 bits | float red component |
| `GL.R8UI` (WebGL2)      | 1     | 8 bits | unsigned int red component, `usampler`, no filtering |
| `GL.RG8` (WebGL2)       | 1     | 16 bits | red and green components |
| `GL.RG16F` (WebGL2)     | 2     | 32 bits | red and green components, half float |
| `GL.RG32F` (WebGL2)     | 2     | 64 bits | red and green components, float |
| `GL.RGUI` (WebGL2)      | 2     | 16 bits | red and green components, `usampler`, no filtering |
| `GL.RGB8` (WebGL2)      | 3     | 24 bits | red, green and blue components |
| `GL.SRGB8` (WebGL2, EXT_sRGB) |3| 24 bits | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer |
| `GL.RGB565` (WebGL2)    | 3     | 16 bits | 5 bit red, 6 bit green, 5 bit blue |
| `GL.R11F_G11F_B10F` (WebGL2) | 3| 32 bits | [11 and 10 bit floating point colors](https://www.opengl.org/wiki/Small_Float_Formats) |
| `GL.RGB9_E5` (WebGL2)   | 3     | 32 bits | [14 bit floating point RGB, shared exponent](https://www.opengl.org/wiki/Small_Float_Formats) |
| `GL.RGB16F` (WebGL2)    | 3     | 48 bits | half float RGB |
| `GL.RGB32F` (WebGL2)    | 3     | 96 bits | float RBG |
| `GL.RGB8UI` (WebGL2)    | 3     | 24 bits | unsigned integer 8 bit RGB: use `usampler`, no filtering |
| `GL.RGBA8` (WebGL2)     | 4     | 32 bits | 8 bit RGBA, typically what `GL.RGBA` "resolves" to |
| `GL.SRGB_APLHA8` (WebGL2, EXT_sRGB) | 4 | 32 bits | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer |
| `GL.RGB5_A1` (WebGL2)   | 4     | 16 bits | 5 bit RGB, 1 bit alpha |
| `GL.RGBA4444` (WebGL2)  | 4     | 16 bits | 4 bit RGBA |
| `GL.RGBA16F` (WebGL2)   | 4     | 64 bits | half float RGBA |
| `GL.RGBA32F` (WebGL2)   | 4     | 128 bits | float RGA |
| `GL.RGBA8UI` (WebGL2)   | 4     | 32 bits | unsigned integer 8 bit RGBA, `usampler`, no filtering |


### Texture Component Type

Describes the layout of each color component in memory.

| Value                         | WebGL2 | WebGL1 | Description |
| ---                           | ---    | ---    | --- |
| `GL.UNSIGNED_BYTE`            | Yes    | Yes    | GLbyte 8 bits per channel for `GL.RGBA` |
| `GL.UNSIGNED_SHORT_5_6_5`     | Yes    | Yes    | 5 red bits, 6 green bits, 5 blue bits |
| `GL.UNSIGNED_SHORT_4_4_4_4`   | Yes    | Yes    | 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits |
| `GL.UNSIGNED_SHORT_5_5_5_1`   | Yes    | Yes    | 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit |
| `GL.BYTE`                     | Yes    | No     | |
| `GL.UNSIGNED_SHORT`           | Yes    | `WEBGL_depth_texture` | |
| `GL.SHORT`                    | Yes    | No     | |
| `GL.UNSIGNED_INT`             | Yes    | `WEBGL_depth_texture` | |
| `GL.INT`                      | Yes    | No     | |
| `GL.HALF_FLOAT`               | Yes    | `OES_texture_half_float` | |
| `GL.FLOAT`                    | Yes    | `OES_texture_float` |
| `GL.UNSIGNED_INT_2_10_10_10_REV`   |Yes| No     | |
| `GL.UNSIGNED_INT_10F_11F_11F_REV`  |Yes| No     | |
| `GL.UNSIGNED_INT_5_9_9_9_REV`      |Yes| No     | |
| `GL.UNSIGNED_INT_24_8`             |Yes| `WEBGL_depth_texture` | |
| `GL.FLOAT_32_UNSIGNED_INT_24_8_REV`|Yes| No     | (pixels must be null) |


### Texture Format Combinations

This a simplified table illustrating what combinations of internal formats
work with what formats and types. Note that luma.gl deduces `format` and `type` from `internalFormat` by taking the first value from the format and type entries in this table.

For more details, see tables in:
* [WebGL2 spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
* [OpenGL ES spec](https://www.khronos.org/opengles/sdk/docs/man3/html/glTexImage2D.xhtml)

| Internal Format          | Data Format       | Data Type          |
| ------------------------ | ----------------- | ------------------ |
| `GL.RGB`                 | `GL.RGB`          | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5` |
| `GL.RGBA`                | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4` `GL.UNSIGNED_SHORT_5_5_5_1` |
| `GL.LUMINANCE_ALPHA`     | `GL.LUMINANCE_ALPHA` | `GL.UNSIGNED_BYTE` |
| `GL.LUMINANCE`           | `GL.LUMINANCE`    | `GL.UNSIGNED_BYTE` |
| `GL.ALPHA`               | `GL.ALPHA`        | `GL.UNSIGNED_BYTE` |
| `GL.R8`                  | `GL.RED`          | `GL.UNSIGNED_BYTE` |
| `GL.R16F`                | `GL.RED`          | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.R32F`                | `GL.RED`          | `GL.FLOAT`         |
| `GL.R8UI`                | `GL.RED_INTEGER`  | `GL.UNSIGNED_BYTE` |
| `GL.RG8`                 | `GL.RG`           | `GL.UNSIGNED_BYTE` |
| `GL.RG16F`               | `GL.RG`           | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RG32F`               | `GL.RG`           | `GL.FLOAT`         |
| `GL.RG8UI`               | `GL.RG_INTEGER`   | `GL.UNSIGNED_BYTE` |
| `GL.RGB8`                | `GL.RGB`          | `GL.UNSIGNED_BYTE` |
| `GL.SRGB8`               | `GL.RGB`          | `GL.UNSIGNED_BYTE` |
| `GL.RGB565`              | `GL.RGB`          | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5` |
| `GL.R11F_G11F_B10F`      | `GL.RGB`          | `GL.UNSIGNED_INT_10F_11F_11F_REV` `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGB9_E5`             | `GL.RGB`          | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGB16FG`             | `GL.RGB`          | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGB32F`              | `GL.RGB`          | `GL.FLOAT`         |
| `GL.RGB8UI`              | `GL.RGB_INTEGER`  | `GL.UNSIGNED_BYTE` |
| `GL.RGBA8`               | `GL.RGBA`         | `GL.UNSIGNED_BYTE` |
| `GL.SRGB8_ALPHA8`        | `GL.RGBA`         | `GL.UNSIGNED_BYTE` |
| `GL.RGB5_A1`             | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_5_5_1` |
| `GL.RGBA4`               | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4` |
| `GL.RGBA16F`             | `GL.RGBA`         | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGBA32F`             | `GL.RGBA`         | `GL.FLOAT`         |
| `GL.RGBA8UI`             | `GL.RGBA_INTEGER` | `GL.UNSIGNED_BYTE` |


## Limits and Capabilities

| Optional capabilities                                       | controlled by extensions |
| ---                                                         | --- |
| Create floating point textures (`GL.NEAREST` sampling only) | `TEXTURE_FLOAT` |
| Create half-floating point textures (`GL.NEAREST` sampling) | `TEXTURE_HALF_FLOAT` |
| Floating point textures are color-renderable and readable   | `COLOR_BUFFER_FLOAT` |
| Half float textures are color-renderable and readable       | `COLOR_BUFFER_HALF_FLOAT` |
| sRGB format support                                         | `SRGB` |
| depth texture support                                       | `DEPTH_TEXTURE` |
| anisotropic filtering                                       | `TEXTURE_FILTER_ANISOTROPIC` |
| `GL.LINEAR_*` sampling of floating point textures           | `TEXTURE_FILTER_LINEAR_FLOAT` |
| `GL.LINEAR_*` sampling of half-floating point textures      | `TEXTURE_FILTER_LINEAR_HALF_FLOAT` |

## NPOT Textures (WebGL1)

* Any texture with a `non power of two` dimension (width or height) is referred as `NPOT` texture, under WebGL1 NPOT textures have following limitations.

| State              | Limitation |
| ---                | --- |
| Mipmapping         | Should be disabled |
| `GL.TEXTURE_MIN_FILTER` | Must be either `GL.LINEAR` or `GL.NEAREST` |
| `GL.TEXTURE_WRAP_S`     | Must be `GL.CLAMP_TO_EDGE` |
| `GL.TEXTURE_WRAP_T`     | Must be `GL.CLAMP_TO_EDGE` |

* 'Texture' class will perform above settings when NPOT texture resource is created. When un-supported filtering is set using `Texture.setParameters`, those will be overwritten with above supported values (`GL.TEXTURE_MIN_FILTER` will be set to `GL.LINEAR`). This only happens for NPOT textures when using WebGL1, and a warning log will be printed every time a setting is overwritten.


## Remarks

* Textures can be supplied as uniforms to shaders that can sample them using texture coordinates and color pixels accordingly.
* Parameters that affect texture sampling can be set on textures or sampler objects.
* Textures can be created from a number of different sources, including typed arrays, HTML Images, HTML Canvases, HTML Videos and WebGLBuffers (WebGL2).
* The WebGL Context has global "pixel store" parameters that control how pixel data is laid out, including Y direction, color space etc.
* Textures are read from supplied data and written to the specified format/type parameters and pixel store parameters.
