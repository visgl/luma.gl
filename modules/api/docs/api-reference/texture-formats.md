# Texture Formats

If an application wants to store the texture at a certain resolution or in a certain format, it can request the resolution and format with `internalFormat`. WebGL will choose an internal representation with least the internal component sizes, and exactly the component types shown for that format, although it may not match exactly.

WebGL 2 adds sized internal formats which enables the application to request
specific components sizes and types (float and integer formats). While sized formats offer more control, unsized formats do give the GPU freedom to select the most performant internal representation.

## Features

While a big subset of texture formats are supported on all devices, some formats are only supported if the underlying hardware supports them.
`Device.features` will be populated with constant that can be queried to determine if specific formats are supported.

| Feature                                  | Optional capabilities                                     |
| ---------------------------------------- | --------------------------------------------------------- |
| `webgl-texture-float`                    | Create floating point textures (`nearest` sampling only)  |
| `webgl-texture-half-float`               | Create half-floating point textures (`nearest` sampling)  |
| `webgl-color-buffer-float`               | Floating point textures are color-renderable and readable |
| `webgl-color-buffer-half-float`          | Half float textures are color-renderable and readable     |
| `webgl-srgb`                             | sRGB format support                                       |
| `webgl-depth-texture`                    | depth texture support                                     |
| `webgl-texture-filter-anisotropic`       | anisotropic filtering                                     |
| `webgl-texture-filter-linear_float`      | `GL.LINEAR_*` sampling of floating point textures         |
| `webgl-texture-filter-linear-half-float` | `GL.LINEAR_*` sampling of half-floating point textures    |

## Compressed Textures

See [Compressed Textures in 2020](https://aras-p.info/blog/2020/12/08/Texture-Compression-in-2020/).

| Feature                           | Type                                      | Description                                                    |
| --------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `texture-compression-bc`          | DXT compressed textures (BC1-BC7)         | Mainly desktops.                                               |
| `texture-compression-etc`         | Ericsson compression.                     | Generally available (CPU decode).                              |
| `texture-compression-astc`        | Intel GPUs, Nividia Tegra, Mali ARM GPUs. |                                                                |
| `webgl-texture-compression-pvrtc` | PowerVR chipsets.                         | All generations of iPhone and iPad and certain Android devices |
| `webgl-texture-compression-atc`   | Adreno GPUs                               | Qualcomm Snapdragon devices.                                   |
| `webgl-texture-compression-etc1`  | Ericsson Compression                      | Older ETC compression.                                         |

## Formats

| Format                            | Notes                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| 8-bit formats                     |                                                                                                     |
| `r8unorm`                         | gl: GL.R8, b: 1, c: 1, gl2: true                                                                    |
| `r8snorm`                         | b: 1, c: 1                                                                                          |
| `r8uint`                          | gl: GL.R8UI, b: 1, c: 1, gl2: true                                                                  |
| `r8sint`                          | gl: GL.R8I, b: 1, c: 1, gl2: true                                                                   |
| 16-bit formats                    |                                                                                                     |
| `r16uint`                         | gl: GL.R16UI, b: 2, c: 1, gl2: true                                                                 |
| `r16sint`                         | gl: GL.R16I, b: 2, c: 1, gl2: true                                                                  |
| `r16float`                        | gl: GL.R16F, b: 2, c: 1, gl2: EXT_FLOAT_WEBGL2                                                      |
| `rg8unorm`                        | gl: GL.RG8, b: 2, c: 2, gl2: true                                                                   |
| `rg8snorm`                        | b: 2, c: 2                                                                                          |
| `rg8uint`                         | gl: GL.RG8UI, b: 2, c: 2, gl2: true                                                                 |
| `rg8sint`                         | gl: GL.RG8I, b: 2, c: 2, gl2: true                                                                  |
| Packed 16-bit formats             |                                                                                                     |
| `webgl-rgba4norm`                 | GL.RGBA4, b: 2, c: 4, wgpu: false                                                                   |
| `webgl-rgb565norm`                | GL.RGB565, b: 2, c: 4, wgpu: false                                                                  |
| `webgl-rgb5a1norm`                | GL.RGB5_A1, b: 2, c: 4, wgpu: false                                                                 |
| 24-bit formats                    |                                                                                                     |
| `webgl-rbg8norm`                  | GL.RGB8, b: 3, c: 3, gl2: true, wgpu: false                                                         |
| 32-bit formats                    |                                                                                                     |
| `r32uint`                         | GL.R32UI, b: 4, c: 1, gl2: true, bpp: 4                                                             |
| `r32sint`                         | GL.R32I, b: 4, c: 1, gl2: true, bpp: 4                                                              |
| `r32float`                        | GL.R32F, b: 4, c: 1, gl2: EXT_FLOAT_WEBGL2, bpp: 4                                                  |
| `rg16uint`                        | GL.RG16UI, b: 4, c: 1, gl2: true, bpp: 4                                                            |
| `rg16sint`                        | GL.RG16I, b: 4, c: 2, gl2: true, bpp: 4                                                             |
| `rg16float`                       | GL.RG16F, b: 4, c: 2, gl2: EXT_FLOAT_WEBGL2, bpp: 4 // WebGL2 + EXT_color_buffer_float              |
| `rgba8unorm`                      | GL.RGBA8, b: 4, c: 2, gl2: true, bpp: 4 // WebGL2 + EXT_color_buffer_float                          |
| `rgba8unorm-srgb`                 | GL.SRGB8_ALPHA8, b: 4, c: 4, gl2: true, gl1: SRGB, bpp: 4                                           |
| `rgba8snorm`                      | b: 4, c: 4                                                                                          |
| `rgba8uint`                       | GL.RGBA8UI, b: 4, c: 4, gl2: true, bpp: 4                                                           |
| `rgba8sint`                       | GL.RGBA8I, b: 4, c: 4, gl2: true, bpp: 4                                                            |
| `bgra8unorm`                      | b: 4, c: 4                                                                                          |
| `bgra8unorm-srgb`                 | b: 4, c: 4                                                                                          |
| Packed 32-bit formats             |                                                                                                     |
| `rgb9e5ufloat`                    | b: 4, , gl: GL.RGB9_E5, c: 3, p: 1, gl2: true, gl1: 'WEBGL_color_buffer_half_float'                 |
| `rg11b10ufloat`                   | b: 4, , gl: GL.R11F_G11F_B10F, c: 3, p: 1, gl2: EXT_FLOAT_WEBGL2                                    |
| `rgb10a2unorm`                    | b: 4, , gl: GL.RGB10_A2, c: 4, p: 1, gl2: true                                                      |
| `webgl-rgb10a2unorm`              | b: 4, c: 4, , gl: GL.RGB10_A2UI, p: 1, webgpu: false, gl2: true, bpp: 4 webgl2 only                 |
| 64-bit formats                    |                                                                                                     |
| `rg32uint`                        | GL.RG32UI, b: 8, c: 2, gl2: true                                                                    |
| `rg32sint`                        | GL.RG32I, b: 8, c: 2, gl2: true                                                                     |
| `rg32float`                       | GL.RG32F, b: 8, c: 2, gl2: EXT_FLOAT_WEBGL2                                                         |
| `rgba16uint`                      | GL.RGBA16UI, b: 8, c: 4, gl2: true                                                                  |
| `rgba16sint`                      | GL.RGBA16I, b: 8, c: 4, gl2: true                                                                   |
| `rgba16float`                     | GL.RGBA16F, b: 8, c: 4, gl2: EXT_FLOAT_WEBGL2                                                       |
| 96-bit formats                    |                                                                                                     |
| `webgl-rgb32float`                | GL.RGB32F, dataFormat: GL.RGB, types: [GL.FLOAT], gl2: true                                         |
| 128-bit formats                   |                                                                                                     |
| `rgba32uint`                      | GL.RGBA32UI, b: 16, c: 4, gl2: true                                                                 |
| `rgba32sint`                      | GL.RGBA32I, b: 16, c: 4, gl2: true                                                                  |
| `rgba32float`                     | GL.RGBA32F, b: 16, c: 4, gl2: EXT_FLOAT_WEBGL2 // gl1: EXT_FLOAT_WEBGL1                             |
| Depth and stencil formats         |                                                                                                     |
| `stencil8`                        | GL.STENCIL_INDEX8, b: 1, c: 1}, // 8 stencil bits                                                   |
| `depth16unorm`                    | GL.DEPTH_COMPONENT16, b: 2, c: 1}, // 16 depth bits                                                 |
| `depth24plus`                     | GL.DEPTH_COMPONENT24, b: 3, c: 1, gl2: true                                                         |
| `depth24plus-stencil81`           | b: 4, gl: GL.DEPTH24_STENCIL8, c: 2, p: 1, gl2: true                                                |
| `depth32float`                    | GL.DEPTH_COMPONENT32F, b: 4, c: 1, gl2: true                                                        |
| `depth24unorm-stencil8`           | GL.DEPTH_STENCIL, b: 4, c: 2, p: 1 `depth24unorm-stencil8` feature                                  |
| `depth32float-stencil8`           | GL.DEPTH32F_STENCIL8, b: 5, c: 2, p: 1, gl2: true `depth32float-stencil8` feature }                 |
| `texture-compression-bc`;         | BC compressed formats: check device.features.has                                                    |
| `webgl-bc1-rgb-unorm`             | GL.COMPRESSED_RGB_S3TC_DXT1_EXT, x: X_S3TC                                                          |
| `webgl-bc1-rgb-unorm-srgb`        | GL.COMPRESSED_SRGB_S3TC_DXT1_EXT, x: X_S3TC_SRGB                                                    |
| `bc1-rgba-unorm`                  | GL.COMPRESSED_RGBA_S3TC_DXT1_EXT, x: X_S3TC                                                         |
| `bc1-rgba-unorm-srgb`             | GL.COMPRESSED_SRGB_S3TC_DXT1_EXT, x: X_S3TC_SRGB                                                    |
| `bc2-rgba-unorm`                  | GL.COMPRESSED_RGBA_S3TC_DXT3_EXT, x: X_S3TC                                                         |
| `bc2-rgba-unorm-srgb`             | GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT, x: X_S3TC_SRGB                                              |
| `bc3-rgba-unorm`                  | GL.COMPRESSED_RGBA_S3TC_DXT5_EXT, x: X_S3TC                                                         |
| `bc3-rgba-unorm-srgb`             | GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT, x: X_S3TC_SRGB                                              |
| `bc4-r-unorm`                     | GL.COMPRESSED_RED_RGTC1_EXT, x: X_RGTC                                                              |
| `bc4-r-snorm`                     | GL.COMPRESSED_SIGNED_RED_RGTC1_EXT, x: X_RGTC                                                       |
| `bc5-rg-unorm`                    | GL.COMPRESSED_RED_GREEN_RGTC2_EXT, x: X_RGTC                                                        |
| `bc5-rg-snorm`                    | GL.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT, x: X_RGTC                                                 |
| `bc6h-rgb-ufloat`                 | GL.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT, x: X_BPTC                                                |
| `bc6h-rgb-float`                  | GL.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT, x: X_BPTC                                                  |
| `bc7-rgba-unorm`                  | GL.COMPRESSED_RGBA_BPTC_UNORM_EXT, x: X_BPTC                                                        |
| `bc7-rgba-unorm-srgb`             | GL.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT, x: X_BPTC                                                  |
| `texture-compression-etc2`        | WEBGL_compressed_texture_etc device.features Note: Guaranteed availability CPU decompressed format. |
| `etc2-rgb8unorm`                  | GL.COMPRESSED_RGB8_ETC2, x: X_ETC2                                                                  |
| `etc2-rgb8unorm-srgb`             | GL.COMPRESSED_SRGB8_ETC2, x: X_ETC2                                                                 |
| `etc2-rgb8a1unorm`                | GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2, x: X_ETC2                                              |
| `etc2-rgb8a1unorm-srgb`           | GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2, x: X_ETC2                                             |
| `etc2-rgba8unorm`                 | GL.COMPRESSED_RGBA8_ETC2_EAC, x: X_ETC2                                                             |
| `etc2-rgba8unorm-srgb`            | GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC, x: X_ETC2                                                      |
| `eac-r11unorm`                    | GL.COMPRESSED_R11_EAC, x: X_ETC2                                                                    |
| `eac-r11snorm`                    | GL.COMPRESSED_SIGNED_R11_EAC, x: X_ETC2                                                             |
| `eac-rg11unorm`                   | GL.COMPRESSED_RG11_EAC, x: X_ETC2                                                                   |
| `eac-rg11snorm`                   | GL.COMPRESSED_SIGNED_RG11_EAC, x: X_ETC2                                                            |
| `texture-compression-astc`        | X_ASTC compressed formats device.features.has                                                       |
| `astc-4x4-unorm`                  | GL.COMPRESSED_RGBA_ASTC_4x4_KHR, x: X_ASTC                                                          |
| `astc-4x4-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR, x: X_ASTC                                                  |
| `astc-5x4-unorm`                  | GL.COMPRESSED_RGBA_ASTC_5x4_KHR, x: X_ASTC                                                          |
| `astc-5x4-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR, x: X_ASTC                                                  |
| `astc-5x5-unorm`                  | GL.COMPRESSED_RGBA_ASTC_5x5_KHR, x: X_ASTC                                                          |
| `astc-5x5-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR, x: X_ASTC                                                  |
| `astc-6x5-unorm`                  | GL.COMPRESSED_RGBA_ASTC_6x5_KHR, x: X_ASTC                                                          |
| `astc-6x5-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR, x: X_ASTC                                                  |
| `astc-6x6-unorm`                  | GL.COMPRESSED_RGBA_ASTC_6x6_KHR, x: X_ASTC                                                          |
| `astc-6x6-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR, x: X_ASTC                                                  |
| `astc-8x5-unorm`                  | GL.COMPRESSED_RGBA_ASTC_8x5_KHR, x: X_ASTC                                                          |
| `astc-8x5-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR, x: X_ASTC                                                  |
| `astc-8x6-unorm`                  | GL.COMPRESSED_RGBA_ASTC_8x6_KHR, x: X_ASTC                                                          |
| `astc-8x6-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR, x: X_ASTC                                                  |
| `astc-8x8-unorm`                  | GL.COMPRESSED_RGBA_ASTC_8x8_KHR, x: X_ASTC                                                          |
| `astc-8x8-unorm-srgb`             | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR, x: X_ASTC                                                  |
| `astc-10x5-unorm`                 | GL.COMPRESSED_RGBA_ASTC_10x10_KHR, x: X_ASTC                                                        |
| `astc-10x5-unorm-srgb`            | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR, x: X_ASTC                                                |
| `astc-10x6-unorm`                 | GL.COMPRESSED_RGBA_ASTC_10x6_KHR, x: X_ASTC                                                         |
| `astc-10x6-unorm-srgb`            | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR, x: X_ASTC                                                 |
| `astc-10x8-unorm`                 | GL.COMPRESSED_RGBA_ASTC_10x8_KHR, x: X_ASTC                                                         |
| `astc-10x8-unorm-srgb`            | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR, x: X_ASTC                                                 |
| `astc-10x10-unorm`                | GL.COMPRESSED_RGBA_ASTC_10x10_KHR, x: X_ASTC                                                        |
| `astc-10x10-unorm-srgb`           | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR, x: X_ASTC                                                |
| `astc-12x10-unorm`                | GL.COMPRESSED_RGBA_ASTC_12x10_KHR, x: X_ASTC                                                        |
| `astc-12x10-unorm-srgb`           | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR, x: X_ASTC                                                |
| `astc-12x12-unorm`                | GL.COMPRESSED_RGBA_ASTC_12x12_KHR, x: X_ASTC                                                        |
| `astc-12x12-unorm-srgb`           | GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR, x: X_ASTC                                                |
| `webgl-texture-compression-pvrtc` | WEBGL_compressed_texture_pvrtc                                                                      |
| `webgl-pvrtc-rgb4unorm`           | GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG, x: X_PVRTC                                                      |
| `webgl-pvrtc-rgba4unorm`          | GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, x: X_PVRTC                                                     |
| `webgl-pvrtc-rbg2unorm`           | GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG, x: X_PVRTC                                                      |
| `webgl-pvrtc-rgba2unorm`          | GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG, x: X_PVRTC                                                     |
| WEBGL_compressed_texture_etc1     |
| `webgl-etc1-rbg-unorm`            | GL.COMPRESSED_RGB_ETC1_WEBGL, x: X_ETC1                                                             |
| WEBGL_compressed_texture_atc      |
| `webgl-atc-rgb-unorm`             | GL.COMPRESSED_RGB_ATC_WEBGL, x: X_ETC1                                                              |
| `webgl-atc-rgba-unorm`            | GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL, x: X_ETC1                                              |
| `webgl-atc-rgbai-unorm`           | GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL, x: X_ETC1                                          |

## WebGL notes

On WebGL devices, luma.gl maps WebGPU style format strings to WebGL constants under the hood.
The following tables provide some information about WebGL texture constants

### Internal Formats

| Unsized Internal Format | Components | Description                                                                                                   |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `GL.RGB`                | 3          | sampler reads the red, green and blue components, alpha is 1.0                                                |
| `GL.RGBA`               | 4          | Red, green, blue and alpha components are sampled from the color buffer.                                      |
| `GL.LUMINANCE`          | 1          | Each color contains a single luminance value. When sampled, rgb are all set to this luminance, alpha is 1.0.  |
| `GL.LUMINANCE_ALPHA`    | 2          | Each component is a luminance/alpha double. When sampled, rgb are all set to luminance, alpha from component. |
| `GL.ALPHA`              | 1          | Discards the red, green and blue components and reads the alpha component.                                    |
| `GL.DEPTH_COMPONENT`    | 1          | WebGL 2 or `WEBGL_depth_texture`                                                                              |
| `GL.DEPTH_STENCIL`      | 2          | WebGL 2 or `WEBGL_depth_texture`                                                                              |

| Sized Internal Format                | Comp. | Size     | Description                                                                                   |
| ------------------------------------ | ----- | -------- | --------------------------------------------------------------------------------------------- |
| `GL.R8` (WebGL 2)                    | 1     | 8 bits   | red component                                                                                 |
| `GL.R16F` (WebGL 2)                  | 1     | 16 bits  | half float red component                                                                      |
| `GL.R32F` (WebGL 2)                  | 1     | 32 bits  | float red component                                                                           |
| `GL.R8UI` (WebGL 2)                  | 1     | 8 bits   | unsigned int red component, `usampler`, no filtering                                          |
| `GL.RG8` (WebGL 2)                   | 1     | 16 bits  | red and green components                                                                      |
| `GL.RG16F` (WebGL 2)                 | 2     | 32 bits  | red and green components, half float                                                          |
| `GL.RG32F` (WebGL 2)                 | 2     | 64 bits  | red and green components, float                                                               |
| `GL.RGUI` (WebGL 2)                  | 2     | 16 bits  | red and green components, `usampler`, no filtering                                            |
| `GL.RGB8` (WebGL 2)                  | 3     | 24 bits  | red, green and blue components                                                                |
| `GL.SRGB8` (WebGL 2, EXT_sRGB)       | 3     | 24 bits  | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer   |
| `GL.RGB565` (WebGL 2)                | 3     | 16 bits  | 5 bit red, 6 bit green, 5 bit blue                                                            |
| `GL.R11F_G11F_B10F` (WebGL 2)        | 3     | 32 bits  | [11 and 10 bit floating point colors](https://www.opengl.org/wiki/Small_Float_Formats)        |
| `GL.RGB9_E5` (WebGL 2)               | 3     | 32 bits  | [14 bit floating point RGB, shared exponent](https://www.opengl.org/wiki/Small_Float_Formats) |
| `GL.RGB16F` (WebGL 2)                | 3     | 48 bits  | half float RGB                                                                                |
| `GL.RGB32F` (WebGL 2)                | 3     | 96 bits  | float RBG                                                                                     |
| `GL.RGB8UI` (WebGL 2)                | 3     | 24 bits  | unsigned integer 8 bit RGB: use `usampler`, no filtering                                      |
| `GL.RGBA8` (WebGL 2)                 | 4     | 32 bits  | 8 bit RGBA, typically what `GL.RGBA` "resolves" to                                            |
| `GL.SRGB_APLHA8` (WebGL 2, EXT_sRGB) | 4     | 32 bits  | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer   |
| `GL.RGB5_A1` (WebGL 2)               | 4     | 16 bits  | 5 bit RGB, 1 bit alpha                                                                        |
| `GL.RGBA4444` (WebGL 2)              | 4     | 16 bits  | 4 bit RGBA                                                                                    |
| `GL.RGBA16F` (WebGL 2)               | 4     | 64 bits  | half float RGBA                                                                               |
| `GL.RGBA32F` (WebGL 2)               | 4     | 128 bits | float RGA                                                                                     |
| `GL.RGBA8UI` (WebGL 2)               | 4     | 32 bits  | unsigned integer 8 bit RGBA, `usampler`, no filtering                                         |

### Texture Component Type

Describes the layout of each color component in memory.

| Value                               | WebGL 2 | WebGL 1                  | Description                                         |
| ----------------------------------- | ------- | ------------------------ | --------------------------------------------------- |
| `GL.UNSIGNED_BYTE`                  | Yes     | Yes                      | GLbyte 8 bits per channel for `GL.RGBA`             |
| `GL.UNSIGNED_SHORT_5_6_5`           | Yes     | Yes                      | 5 red bits, 6 green bits, 5 blue bits               |
| `GL.UNSIGNED_SHORT_4_4_4_4`         | Yes     | Yes                      | 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits |
| `GL.UNSIGNED_SHORT_5_5_5_1`         | Yes     | Yes                      | 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit  |
| `GL.BYTE`                           | Yes     | No                       |                                                     |
| `GL.UNSIGNED_SHORT`                 | Yes     | `WEBGL_depth_texture`    |                                                     |
| `GL.SHORT`                          | Yes     | No                       |                                                     |
| `GL.UNSIGNED_INT`                   | Yes     | `WEBGL_depth_texture`    |                                                     |
| `GL.INT`                            | Yes     | No                       |                                                     |
| `GL.HALF_FLOAT`                     | Yes     | `OES_texture_half_float` |                                                     |
| `GL.FLOAT`                          | Yes     | `OES_texture_float`      |
| `GL.UNSIGNED_INT_2_10_10_10_REV`    | Yes     | No                       |                                                     |
| `GL.UNSIGNED_INT_10F_11F_11F_REV`   | Yes     | No                       |                                                     |
| `GL.UNSIGNED_INT_5_9_9_9_REV`       | Yes     | No                       |                                                     |
| `GL.UNSIGNED_INT_24_8`              | Yes     | `WEBGL_depth_texture`    |                                                     |
| `GL.FLOAT_32_UNSIGNED_INT_24_8_REV` | Yes     | No                       | (pixels must be null)                               |

### Texture Format Combinations

This a simplified table illustrating what combinations of internal formats
work with what data formats and types. Note that luma.gl deduces `dataFormat` and `type` from `format` by taking the first value from the data format and data type entries in this table.

For more details, see tables in:

- [WebGL 2 spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [OpenGL ES spec](https://www.khronos.org/opengles/sdk/docs/man3/html/glTexImage2D.xhtml)

| Internal Format      | Data Format          | Data Type                                                                  |
| -------------------- | -------------------- | -------------------------------------------------------------------------- |
| `GL.RGB`             | `GL.RGB`             | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5`                               |
| `GL.RGBA`            | `GL.RGBA`            | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4` `GL.UNSIGNED_SHORT_5_5_5_1` |
| `GL.LUMINANCE_ALPHA` | `GL.LUMINANCE_ALPHA` | `GL.UNSIGNED_BYTE`                                                         |
| `GL.LUMINANCE`       | `GL.LUMINANCE`       | `GL.UNSIGNED_BYTE`                                                         |
| `GL.ALPHA`           | `GL.ALPHA`           | `GL.UNSIGNED_BYTE`                                                         |
| `GL.R8`              | `GL.RED`             | `GL.UNSIGNED_BYTE`                                                         |
| `GL.R16F`            | `GL.RED`             | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.R32F`            | `GL.RED`             | `GL.FLOAT`                                                                 |
| `GL.R8UI`            | `GL.RED_INTEGER`     | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RG8`             | `GL.RG`              | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RG16F`           | `GL.RG`              | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RG32F`           | `GL.RG`              | `GL.FLOAT`                                                                 |
| `GL.RG8UI`           | `GL.RG_INTEGER`      | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGB8`            | `GL.RGB`             | `GL.UNSIGNED_BYTE`                                                         |
| `GL.SRGB8`           | `GL.RGB`             | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGB565`          | `GL.RGB`             | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5`                               |
| `GL.R11F_G11F_B10F`  | `GL.RGB`             | `GL.UNSIGNED_INT_10F_11F_11F_REV` `GL.HALF_FLOAT` `GL.FLOAT`               |
| `GL.RGB9_E5`         | `GL.RGB`             | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RGB16FG`         | `GL.RGB`             | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RGB32F`          | `GL.RGB`             | `GL.FLOAT`                                                                 |
| `GL.RGB8UI`          | `GL.RGB_INTEGER`     | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGBA8`           | `GL.RGBA`            | `GL.UNSIGNED_BYTE`                                                         |
| `GL.SRGB8_ALPHA8`    | `GL.RGBA`            | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGB5_A1`         | `GL.RGBA`            | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_5_5_1`                             |
| `GL.RGBA4`           | `GL.RGBA`            | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4`                             |
| `GL.RGBA16F`         | `GL.RGBA`            | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RGBA32F`         | `GL.RGBA`            | `GL.FLOAT`                                                                 |
| `GL.RGBA8UI`         | `GL.RGBA_INTEGER`    | `GL.UNSIGNED_BYTE`                                                         |
