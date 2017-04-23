# Texture2D

For more background and details on parameters, see [Textures](textures.md).

Construct a new texture from an image
```
const texture = new Texture2D(gl, {
  data: image,
  [GL.UNPACK_FLIP_Y_WEBGL]: true,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  mipmaps: GL.NICEST
});
```

Construct a texture initialized with a data array
```
const texture = new Texture2D(gl, {
  width: 2,
  height: 1,
  format: GL.RGB,
  data: new Uint8Array([255, 0, 0,  0, 0, 255]),
  [GL.UNPACK_FLIP_Y_WEBGL]: true,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  mipmaps: true
});
```

Construct an empty 1x1 texture
```
const texture = new Texture2D(gl);
```

Resize it (this clears the texture).
```
texture.update({width: 10, height: 10});
```

Write a sub image into the texture
```
texture.subImage({data, x, y, mipmapLevel});
```

Accessing elements
```
console.log(
  texture2D.width,
  texture2D.height,
  texture2D.format,
  texture2D.type,
  texture2D.getParameter(GL.TEXTURE_MAG_FILTER)
);
```


## Methods

### Texture2D constructor


### `Texture2D.update`


### Texture Constructor

`new Texture2D(options)`

options:
* `data` (*ArrayBufferView*, optional) If not provided, a solid color texture will be allocated of the specified size.
* `format` - (*enum*, default `GL.RGBA`) - internal format that WebGL should use.
* `type` - (*enum*, default is autodeduced from format) - type of pixel data (GL.UNSIGNED_BYTE, GL.FLOAT etc).
* `dataFormat` - (*enum*, default is autodeduced from `format`) - internal format that WebGL should use.
* `width` - (*Number*, default 0) The width of the texture.
* `height` - (*Number*, default 0) The height of the texture.
* `mipmaps` (*Array* | *Boolean* | *Enum*, default false) - `n`th mipmap reduction level, 0 represents base image
* pixel unpack parameters
* texture sampler parameters

* `data`

| Type                               | Description  |
| ---------------------------------- | -----------  |
| null                               | A texture will be created with the appropriate format, size and width. Bytes will be "uninitialized". |
| `typed array`                      | bytes will be interpreted per format/type parameters and pixel store settings. |
| `Buffer` or `WebGLBuffer` (WebGL2) | bytes will be interpreted format/type parameters and pixel store settings. |
| `Image` (`HTMLImageElement`)       | image will be used to fill the texture. width and height will be deduced. |
| `Video` (`HTMLVideoElement`)       | video will be played, continously updating the texture. width and height will be deduced. |
| `Canvas` (`HTMLCanvasElement`)     | canvas will be used to fill the texture. width and height will be deduced. |
| `ImageData`                        | `canvas.getImageData()` - Used to fill the texture. width and height will be deduced. |

* `format` - the internal format of the texture. WebGL will unpack `data` into
  this format. Defaults to `GL.RGBA`.

Some common formats are listed here. See tables below for additional supported formats

| Format                  | Components | Description |
| ----------------------- | ---------- | ----------- |
| `GL.RGB`                |          3 | sampler reads the red, green and blue components, alpha is 1.0 |
| `GL.RGBA`               |          4 | Red, green, blue and alpha components are sampled from the color buffer. |
| `GL.LUMINANCE`          |          1 | Red, green, blue components are sampled from a single luminance value. alpha is 1.0. |
| `GL.LUMINANCE_ALPHA`    |          2 | Each component is a luminance/alpha double. When sampled, rgb are all set to luminance, alpha from component. |
| `GL.ALPHA`              |          1 | Discards the red, green and blue components and reads the alpha component. |

* `type` - Format of pixel data (i.e. format of color components in the
  `data` memory block (only applies to typed arrays/WebGL buffers).

Some common types are listed here. See tables below for additional supported types.

| `GL.UNSIGNED_BYTE` | GLbyte 8 bits per channel for `GL.RGBA` |
| `GL.HALF_FLOAT` (WebGL2, OES_texture_half_float) | |
| `GL.FLOAT` (WebGL2, OES_texture_float) | |

Note: luma.gl attempts to autodeduce `type` from the `format` parameter, so
for common formats you would not need to specify this parameter.

* `dataFormat` - Normally autodeduced from the `format` parameter. Does
  not need to be specified for any texture format specified in the WebGL standard.

* Pixel unpack parameters

Specifies the texture should be read from memory (i.e. typed arrays or `WebGLBuffer`s).

The most common usage is setting `GL.UNPACK_FLIP_Y_WEBGL` to true to flip
loaded images to match WebGL's bottom-left coordinate system.

| Parameter                             | Type          | Default  | Description             |
| ------------------------------------- | ------------- | -------- | ----------------------- |
| `GL.UNPACK_ALIGNMENT`                 | GLint         |      `4` | Byte alignment of pixel row in memory (1,2,4,8 bytes) when reading |
| `GL.UNPACK_FLIP_Y_WEBGL`              | GLboolean     |  `false` | Flip source data along its vertical axis |
| `GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL`   | GLboolean     |  `false` | Multiplies the alpha channel into the other color channels |
| `GL.UNPACK_COLORSPACE_CONVERSION_WEBGL` | GLenum      | `GL.BROWSER_DEFAULT_WEBGL` | Color space conversion, use default or none. |
| `GL.UNPACK_ROW_LENGTH` **WebGL2**     | GLint         |      `0` | Number of pixels in a row. |
| `GL.UNPACK_IMAGE_HEIGHT` **WebGL2**   | GLint         |      `0` | Image height used for reading pixel data from memory |
| `GL.UNPACK_SKIP_PIXELS` **WebGL2**    | GLint         |      `0` | Number of pixel images skipped before first pixel is read from memory |
| `GL.UNPACK_SKIP_ROWS` **WebGL2**      | GLint         |      `0` | Number of rows of pixels skipped before first pixel is read from memory |
| `GL.UNPACK_SKIP_IMAGES` **WebGL2**    | GLint         |      `0` | Number of pixel images skipped before first pixel is read from memory |

* Texture sampler parameters

* `...parameters` -
  key, value options that will be set with `gl.texParameteri`.
  Example: `{..., [GL.TEXTURE_MAG_FILTER]: GL.NEAREST, [GL.TEXTURE_MIN_FILTER]: GL.NEAREST}`.

## Texture Sampler Parameters

Texture parameters control how textures are sampled in the shaders.
Also see [`Sampler`](sampler.md).

| Sampler Parameter                    | Default        | Description |
| ------------------------------------ | -------------- | ----------- |
| `GL.TEXTURE_MAG_FILTER`              | `GL.LINEAR`    | texture magnification filter |
| `GL.TEXTURE_MIN_FILTER`              | `GL.NEAREST_MIPMAP_LINEAR` | texture minification filter |
| `GL.TEXTURE_WRAP_S`                  | `GL.REPEAT`    | texture wrapping function for texture coordinate `s` |
| `GL.TEXTURE_WRAP_T`                  | `GL.REPEAT`    | texture wrapping function for texture coordinate `t` |
| ------------------------------------ | -------------- | ----------- |
| `GL.TEXTURE_WRAP_R` **WebGL2**       | `GL.REPEAT`    | texture wrapping function for texture coordinate `r` |
| `GL.TEXTURE_BASE_LEVEL` **WebGL2**   | `0`            | Texture mipmap level |
| `GL.TEXTURE_MAX_LEVEL` **WebGL2**    | `1000`         | Maximum texture mipmap array level |
| `GL.TEXTURE_COMPARE_FUNC` **WebGL2** | `GL.LEQUAL`    | texture comparison function |
| `GL.TEXTURE_COMPARE_MODE` **WebGL2** | `GL.NONE`      | whether r tex coord should be compared to depth texture |
| `GL.TEXTURE_MIN_LOD` **WebGL2**      | `-1000`        | minimum level-of-detail value |
| `GL.TEXTURE_MAX_LOD` **WebGL2**      | `1000`         | maximum level-of-detail value |

* `GL.TEXTURE_MAG_FILTER` can take the following values

| `GL.TEXTURE_MAG_FILTER`     | Description                     |
| --------------------------- | ------------------------------- |
| `GL.LINEAR` (default)       | interpolated texel              |
| `GL.NEAREST`                | nearest texel                   |

* `GL.TEXTURE_MIN_FILTER` can take the following values

| `GL.TEXTURE_MIN_FILTER`     | Description                     |
| --------------------------- | ------------------------------- |
| `GL.LINEAR`                 | interpolated texel              |
| `GL.NEAREST`                | nearest texel                   |
| `GL.NEAREST_MIPMAP_NEAREST` | nearest texel in closest mipmap |
| `GL.LINEAR_MIPMAP_NEAREST`  | interpolated texel in closest mipmap |
| `GL.NEAREST_MIPMAP_LINEAR` (default) | average texel from two closest mipmaps |
| `GL.LINEAR_MIPMAP_LINEAR`   | interpolated texel from two closest mipmaps |

* `GL.TEXTURE_WRAP_S`, `GL.TEXTURE_WRAP_S`, `GL.TEXTURE_WRAP_R` can take the following values

| `GL.TEXTURE_WRAP_`*         | Description                     |
| --------------------------- | ------------------------------- |
| `GL.REPEAT` (default)       | use fractional part of texture coordinates |
| `GL.CLAMP_TO_EDGE`          | clamp texture coordinates                |
| `GL.MIRRORED_REPEAT`        | use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac` |

* `GL.TEXTURE_COMPARE_MODE` can take the following values

| `GL.TEXTURE_COMPARE_MODE`   | Description                     |
| --------------------------- | ------------------------------- |
| `GL.NONE` (default)         | no comparison of `r` coordinate is performed |
| `GL.COMPARE_REF_TO_TEXTURE` | interpolated and clamped `r` texture coordinate is compared to currently bound depth texture, result is assigned to the red channel |

* `GL.TEXTURE_COMPARE_FUNC` can take the following values

| `GL.TEXTURE_COMPARE_FUNC`   | Computed result                    |
| --------------------------- | ---------------------------------- |
| `GL.LEQUAL` (default)       | result = 1.0 0.0, r <= D t r > D t |
| `GL.GEQUAL`                 | result = 1.0 0.0, r >= D t r < D t |
| `GL.LESS`                   | result = 1.0 0.0, r < D t r >= D t |
| `GL.GREATER`                | result = 1.0 0.0, r > D t r <= D t |
| `GL.EQUAL`                  | result = 1.0 0.0, r = D t r ≠ D t  |
| `GL.NOTEQUAL`               | result = 1.0 0.0, r ≠ D t r = D t  |
| `GL.ALWAYS`                 | result = 1.0                       |
| `GL.NEVER`                  | result = 0.0                       |

## Formats

If an application wants to store the texture at a certain resolution or in a
certain format, it can request the resolution and format with `internalFormat`.
WebGL will choose an internal representation with least the internal component
sizes, and exactly the component types shown for that format, although it may
not match exactly.

| Unsized Internal Format | Components | Description |
| ----------------------- | ---------- | ----------- |
| `GL.RGB`                |          3 | sampler reads the red, green and blue components, alpha is 1.0 |
| `GL.RGBA`               |          4 | Red, green, blue and alpha components are sampled from the color buffer. |
| `GL.LUMINANCE`          |          1 | Each color contains a single luminance value. When sampled, rgb are all set to this luminance, alpha is 1.0. |
| `GL.LUMINANCE_ALPHA`    |          2 | Each component is a luminance/alpha double. When sampled, rgb are all set to luminance, alpha from component. |
| `GL.ALPHA`              |          1 | Discards the red, green and blue components and reads the alpha component. |
| `GL.DEPTH_COMPONENT` (WebGL2, WEBGL_depth_texture) | 1 |
| `GL.DEPTH_STENCIL` (WebGL2, WEBGL_depth_texture)   | 2 |

WebGL2 adds sized internal formats which enables the application to request
specific components sizes and types (float and integer formats).

| Sized Internal Format   | Components |   Size   | Description   |
| ----------------------- | ---------- | -------- | ------------- |
| `GL.R8` (WebGL2)        |          1 | 8 bits   | red component |
| `GL.R16F` (WebGL2)      |          1 | 16 bits  | half float red component |
| `GL.R32F` (WebGL2)      |            | 32 bits | float red component |
| `GL.R8UI` (WebGL2)      |            | 8 bits | unsigned int red component, `usampler`, no filtering |
| `GL.RG8` (WebGL2)       | 16 bits | red and green components |
| `GL.RG16F` (WebGL2)     | 32 bits | red and green components, half float |
| `GL.RG32F` (WebGL2)     | 64 bits | red and green components, float |
| `GL.RGUI` (WebGL2)      | 16 bits | red and green components, `usampler`, no filtering |
| `GL.RGB8` (WebGL2)      | 24 bits | red, green and blue components |
| `GL.SRGB8` (WebGL2, EXT_sRGB) | 24 bits | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer |
| `GL.RGB565` (WebGL2)    | 16 bits | 5 bit red, 6 bit green, 5 bit blue |
| `GL.R11F_G11F_B10F` (WebGL2) | 32 bits | [11 and 10 bit floating point colors](https://www.opengl.org/wiki/Small_Float_Formats) |
| `GL.RGB9_E5` (WebGL2)   | 32 bits | [14 bit floating point RGB, shared exponent](https://www.opengl.org/wiki/Small_Float_Formats) |
| `GL.RGB16F` (WebGL2)    | 48 bits | half float RGB |
| `GL.RGB32F` (WebGL2)    | 96 bits | float RBG |
| `GL.RGB8UI` (WebGL2)    | 24 bits | unsigned integer 8 bit RGB: use `usampler`, no filtering |
| `GL.RGBA8` (WebGL2)     | 32 bits | 8 bit RGBA, typically what `GL.RGBA` "resolves" to |
| `GL.SRGB_APLHA8` (WebGL2, EXT_sRGB) | 32 bits | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer |
| `GL.RGB5_A1` (WebGL2)   | 16 bits | 5 bit RGB, 1 bit alpha |
| `GL.RGBA4444` (WebGL2)  | 16 bits | 4 bit RGBA |
| `GL.RGBA16F` (WebGL2)   | 64 bits | half float RGBA |
| `GL.RGBA32F` (WebGL2)   | 128 bits | float RGA |
| `GL.RGBA8UI` (WebGL2)   | 32 bits | unsigned integer 8 bit RGBA, `usampler`, no filtering |

Remarks:
* While sized formats offer more control, unsized formats give the GPU
  freedom to select the most performant internal representation.

### Types

Describes the layout of each color component in memory.

| `GL.UNSIGNED_BYTE`          | GLbyte 8 bits per channel for `GL.RGBA` |
| `GL.UNSIGNED_SHORT_5_6_5`   | 5 red bits, 6 green bits, 5 blue bits |
| `GL.UNSIGNED_SHORT_4_4_4_4` | 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits |
| `GL.UNSIGNED_SHORT_5_5_5_1` | 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit |
| `GL.BYTE` (WebGL2)          | |
| `GL.UNSIGNED_SHORT`(WebGL2, WEBGL_depth_texture) | |
| `GL.SHORT` (WebGL2)         | |
| `GL.UNSIGNED_INT` (WebGL2, WEBGL_depth_texture) | |
| `GL.INT` (WebGL2)           | |
| `GL.HALF_FLOAT` (WebGL2, OES_texture_half_float) | |
| `GL.FLOAT` (WebGL2, OES_texture_float) | |
| `GL.UNSIGNED_INT_2_10_10_10_REV` (WebGL2) | |
| `GL.UNSIGNED_INT_10F_11F_11F_REV` (WebGL2) | |
| `GL.UNSIGNED_INT_5_9_9_9_REV` (WebGL2) | |
| `GL.UNSIGNED_INT_24_8` (WebGL2, WEBGL_depth_texture) | |
| `GL.FLOAT_32_UNSIGNED_INT_24_8_REV` (WebGL2) | (pixels must be null) |

## Reading data from a texture

### Pack Parameters

Specifies how bitmaps are written to memory

| Parameter                             | Type          | Default  | Description             |
| ------------------------------------- | ------------- | -------- | ----------------------- |
| `GL.PACK_ALIGNMENT`                   | GLint         |      `4` | Byte alignment of pixel row in memory (1,2,4,8 bytes) when storing |
| `GL.PACK_ROW_LENGTH` **WebGL2**       | GLint         |      `0` | Number of pixels in a row |
| `GL.PACK_SKIP_PIXELS` **WebGL2**      | GLint         |      `0` | Number of pixels skipped before the first pixel is written into memory |
| `GL.PACK_SKIP_ROWS` **WebGL2**        | GLint         |      `0` | Number of rows of pixels skipped before first pixel is written to memory |

