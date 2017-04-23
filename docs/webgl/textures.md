---
layout: docs
title: Texture
categories: [Documentation]
---

# Textures and Samplers

Textures allows elements of an image array to be read by shaders.
Samplers specify how texels should be interpolated.

There are several types of types of texture objects

* [`Texture2D`](webgl/texture-2d.md) - Contains
* [`TextureCube`](webgl/texture-cube.md) - Holds 6 textures representing sides of a cube.
* [`Texture2DArray`](webgl/texture-2d-array.md) **WebGL2** - Holds an array of textures, similar to a texture atlas.
* [`Texture3D`](webgl/texture-3d.md) **WebGL2** - Holds an array of textures representing depth.
* [`Sampler`](webgl/sampler.md) **WebGL2** - References a texture with a separate set of texture parameters

`getPixel` is used to read data from textures.

Notes:
* Textures can be supplied as uniforms to shaders that can sample them using
  texture coordinates and color pixels accordingly.
* Parameters that affect texture sampling can be set on textures or sampler
  objects.
* Textures can be created from a number of different sources,
  including typed arrays, HTML Images, HTML Canvases, HTML Videos and
  WebGLBuffers (WebGL2).
* The WebGL Context has global "pixel store" settings that control how pixel
  data is laid out, including Y direction, color space etc.
* Textures are read from supplied data and written to the specified
  format/type parameters and pixel store settings.


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

### Legal combinations

This a simplified table illustrating what combinations of internal formats
work with what formats and types. Also, luma.gl autodeduces `format` and `type`
from `internalFormat` by taking the first value from the format and type
entries in this table.

For more details, see tables in:
* [WebGL2 spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
* [OpenGL ES spec](https://www.khronos.org/opengles/sdk/docs/man3/html/glTexImage2D.xhtml)

| Internal Format      | Data Format       | Data Type          |
| -------------------- | ----------------- | ------------------ |
| `GL.RGB`             | `GL.RGB`          | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5` |
| `GL.RGBA`            | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4` `GL.UNSIGNED_SHORT_5_5_5_1` |
| `GL.LUMINANCE_ALPHA` | `GL.LUMINANCE_ALPHA` | `GL.UNSIGNED_BYTE` |
| `GL.LUMINANCE`       | `GL.LUMINANCE`    | `GL.UNSIGNED_BYTE` |
| `GL.ALPHA`           | `GL.ALPHA`        | `GL.UNSIGNED_BYTE` |
| `GL.R8`              | `GL.RED`          | `GL.UNSIGNED_BYTE` |
| `GL.R16F`            | `GL.RED`          | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.R32F`            | `GL.RED`          | `GL.FLOAT`         |
| `GL.R8UI`            | `GL.RED_INTEGER`  | `GL.UNSIGNED_BYTE` |
| `GL.RG8`             | `GL.RG`           | `GL.UNSIGNED_BYTE` |
| `GL.RG16F`           | `GL.RG`           | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RG32F`           | `GL.RG`           | `GL.FLOAT`         |
| `GL.RG8UI`           | `GL.RG_INTEGER`   | `GL.UNSIGNED_BYTE` |
| `GL.RGB8`            | `GL.RGB`          | `GL.UNSIGNED_BYTE` |
| `GL.SRGB8`           | `GL.RGB`          | `GL.UNSIGNED_BYTE` |
| `GL.RGB565`          | `GL.RGB`          | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5` |
| `GL.R11F_G11F_B10F`  | `GL.RGB`          | `GL.UNSIGNED_INT_10F_11F_11F_REV` `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGB9_E5`         | `GL.RGB`          | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGB16FG`         | `GL.RGB`          | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGB32F`          | `GL.RGB`          | `GL.FLOAT`         |
| `GL.RGB8UI`          | `GL.RGB_INTEGER`  | `GL.UNSIGNED_BYTE` |
| `GL.RGBA8`           | `GL.RGBA`         | `GL.UNSIGNED_BYTE` |
| `GL.SRGB8_ALPHA8`    | `GL.RGBA`         | `GL.UNSIGNED_BYTE` |
| `GL.RGB5_A1`         | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_5_5_1` |
| `GL.RGBA4`           | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4` |
| `GL.RGBA16F`         | `GL.RGBA`         | `GL.HALF_FLOAT` `GL.FLOAT` |
| `GL.RGBA32F`         | `GL.RGBA`         | `GL.FLOAT`         |
| `GL.RGBA8UI`         | `GL.RGBA_INTEGER` | `GL.UNSIGNED_BYTE` |

<!-- const convert = {
  [GL.UNSIGNED_SHORT_5_6_5]: (red, green, blue, alpha) =>
  [GL.UNSIGNED_SHORT_4_4_4_4]: (red, green, blue, alpha) =>
  [GL.UNSIGNED_SHORT_5_5_5_1]: (red, green, blue, alpha) =>
  [GL.BYTE]: (red, green, blue, alpha) =>
  [GL.UNSIGNED_SHORT]: (red, green, blue, alpha) =>
  [GL.SHORT]: (red, green, blue, alpha) =>
  [GL.UNSIGNED_INT]: (red, green, blue, alpha) =>
  [GL.INT]: (red, green, blue, alpha) =>
  [GL.HALF_FLOAT]: (red, green, blue, alpha) =>
  [GL.FLOAT]: (red, green, blue, alpha) =>
  [GL.UNSIGNED_INT_2_10_10_10_REV]: (red, green, blue, alpha) =>
    0 | (alpha << 30) | (blue << 20) | (green << 10) | (red << 0)
  [GL.UNSIGNED_INT_10F_11F_11F_REV]: (red, green, blue, alpha) =>
    0 | (blue << 21) | (green << 10) | (red << 0)
  [GL.UNSIGNED_INT_5_9_9_9_REV]: (red, green, blue, alpha) =>
  [GL.UNSIGNED_INT_24_8]: (red, green, blue, alpha) =>
  [GL.FLOAT_32_UNSIGNED_INT_24_8_REV]: (red, green, blue, alpha) =>
};
 -->

## Reading data from a texture

### Pack Parameters

Specifies how bitmaps are written to memory

| Parameter                             | Type          | Default  | Description             |
| ------------------------------------- | ------------- | -------- | ----------------------- |
| `GL.PACK_ALIGNMENT`                   | GLint         |      `4` | Byte alignment of pixel row in memory (1,2,4,8 bytes) when storing |
| `GL.PACK_ROW_LENGTH` **WebGL2**       | GLint         |      `0` | Number of pixels in a row |
| `GL.PACK_SKIP_PIXELS` **WebGL2**      | GLint         |      `0` | Number of pixels skipped before the first pixel is written into memory |
| `GL.PACK_SKIP_ROWS` **WebGL2**        | GLint         |      `0` | Number of rows of pixels skipped before first pixel is written to memory |
