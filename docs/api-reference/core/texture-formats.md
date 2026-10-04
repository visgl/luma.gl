# Texture Formats

[Shader Types](https://luma.gl/docs/api-reference/core/shader-types.md)[Vertex Formats](https://luma.gl/docs/api-reference/core/vertex-formats.md)[Texture Formats](https://luma.gl/docs/api-reference/core/texture-formats.md)

The term "texture format" here refers to how pixels are stored in memory, which is an important property of a GPU Texture which must be specified on Texture creation.

In luma.gl, texture formats are identified using string constants, and the `TextureFormat` type can be used to ensure texture format strings are valid.

The following table lists all the texture formats constants supported by luma.gl (ordered by how many bytes each pixel occupies).

Note that even though a GPU supports creating and sampling textures of a certain format, additional capabilities may need to be checked separatey, more information below the table.

<!-- -->

| `TextureFormat`                       | Available | Filterable | Renderable | Notes / WebGL counterpart                                                                                                                                          |
| ------------------------------------- | --------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1 byte per pixel formats**          | —         | —          | —          | —                                                                                                                                                                  |
| `r8unorm`                             | N/A       | N/A        | N/A        | `GL.R8`                                                                                                                                                            |
| `r8snorm`                             | N/A       | N/A        | N/A        | `GL.R8_SNORM`                                                                                                                                                      |
| `r8uint`                              | N/A       | N/A        | N/A        | `GL.R8UI`                                                                                                                                                          |
| `r8sint`                              | N/A       | N/A        | N/A        | `GL.R8I`                                                                                                                                                           |
| **2 bytes per pixel formats**         | —         | —          | —          | —                                                                                                                                                                  |
| `r16uint`                             | N/A       | N/A        | N/A        | `GL.R16UI`                                                                                                                                                         |
| `r16sint`                             | N/A       | N/A        | N/A        | `GL.R16I`                                                                                                                                                          |
| `r16unorm`                            | N/A       | N/A        | N/A        | `GL.R16_EXT` `EXT_texture_norm16`                                                                                                                                  |
| `r16snorm`                            | N/A       | N/A        | N/A        | `GL.R16_SNORM_EXT` `EXT_texture_norm16`                                                                                                                            |
| `r16float`                            | N/A       | N/A        | N/A        | `GL.R16F`                                                                                                                                                          |
| `rg8unorm`                            | N/A       | N/A        | N/A        | `GL.RG8`                                                                                                                                                           |
| `rg8snorm`                            | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rg8uint`                             | N/A       | N/A        | N/A        | `GL.RG8UI`                                                                                                                                                         |
| `rg8sint`                             | N/A       | N/A        | N/A        | `GL.RG8I`                                                                                                                                                          |
| **Packed 2 bytes per pixel formats**  | —         | —          | —          | —                                                                                                                                                                  |
| `rgba4norm-webgl`                     | N/A       | N/A        | N/A        | `GL.RGBA4`                                                                                                                                                         |
| `rgb565norm-webgl`                    | N/A       | N/A        | N/A        | `GL.RGB565`                                                                                                                                                        |
| `rgb5a1norm-webgl`                    | N/A       | N/A        | N/A        | `GL.RGB5_A1`                                                                                                                                                       |
| **3 bytes per pixel formats**         | —         | —          | —          | —                                                                                                                                                                  |
| `rbg8norm-webgl`                      | N/A       | N/A        | N/A        | `GL.RGB8`                                                                                                                                                          |
| **4 bytes per pixel formats**         | —         | —          | —          | —                                                                                                                                                                  |
| `r32uint`                             | N/A       | N/A        | N/A        | `GL.R32UI`                                                                                                                                                         |
| `r32sint`                             | N/A       | N/A        | N/A        | `GL.R32I`                                                                                                                                                          |
| `r32float`                            | N/A       | N/A        | N/A        | `GL.R32F`                                                                                                                                                          |
| `rg16uint`                            | N/A       | N/A        | N/A        | `GL.RG16UI`                                                                                                                                                        |
| `rg16sint`                            | N/A       | N/A        | N/A        | `GL.RG16I`                                                                                                                                                         |
| `rg16unorm`                           | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rg16snorm`                           | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rg16float`                           | N/A       | N/A        | N/A        | `GL.RG16F`                                                                                                                                                         |
| `rgba8unorm`                          | N/A       | N/A        | N/A        | `GL.RGBA8`                                                                                                                                                         |
| `rgba8unorm-srgb`                     | N/A       | N/A        | N/A        | `GL.SRGB8_ALPHA8`                                                                                                                                                  |
| `rgba8snorm`                          | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rgba8uint`                           | N/A       | N/A        | N/A        | `GL.RGBA8UI`                                                                                                                                                       |
| `rgba8sint`                           | N/A       | N/A        | N/A        | `GL.RGBA8I`                                                                                                                                                        |
| `bgra8unorm`                          | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bgra8unorm-srgb`                     | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| **Packed 4 bytes per pixel formats**  | —         | —          | —          | —                                                                                                                                                                  |
| `rgb9e5ufloat`                        | N/A       | N/A        | N/A        | `GL.RGB9_E5`                                                                                                                                                       |
| `rg11b10ufloat`                       | N/A       | N/A        | N/A        | `GL.R11F_G11F_B10F`                                                                                                                                                |
| `rgb10a2unorm`                        | N/A       | N/A        | N/A        | `GL.RGB10_A2`                                                                                                                                                      |
| `rgb10a2uint`                         | N/A       | N/A        | N/A        | `GL.RGB10_A2UI`                                                                                                                                                    |
| **6 bytes per pixel formats**         | —         | —          | —          | —                                                                                                                                                                  |
| `rgb16unorm-webgl`                    | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rgb16snorm-webgl`                    | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| **8 bytes per pixel formats**         | —         | —          | —          | —                                                                                                                                                                  |
| `rg32uint`                            | N/A       | N/A        | N/A        | `GL.RG32UI`                                                                                                                                                        |
| `rg32sint`                            | N/A       | N/A        | N/A        | `GL.RG32I`                                                                                                                                                         |
| `rg32float`                           | N/A       | N/A        | N/A        | `GL.RG32F`                                                                                                                                                         |
| `rgba16uint`                          | N/A       | N/A        | N/A        | `GL.RGBA16UI`                                                                                                                                                      |
| `rgba16sint`                          | N/A       | N/A        | N/A        | `GL.RGBA16I`                                                                                                                                                       |
| `rgba16unorm`                         | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rgba16snorm`                         | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rgba16float`                         | N/A       | N/A        | N/A        | `GL.RGBA16F`                                                                                                                                                       |
| **12 bytes per pixel formats**        | —         | —          | —          | —                                                                                                                                                                  |
| `rgb32float-webgl`                    | N/A       | N/A        | N/A        | `GL.RGB32F` Deprecated format.                                                                                                                                     |
| **16 bytes per pixel formats**        | —         | —          | —          | —                                                                                                                                                                  |
| `rgba32uint`                          | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rgba32sint`                          | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `rgba32float`                         | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| **Depth and stencil formats**         | —         | —          | —          | —                                                                                                                                                                  |
| `stencil8`                            | N/A       | N/A        | N/A        | Platform dependent: Might use `depth24stencil8` with hidden depth.                                                                                                 |
| `depth16unorm`                        | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `depth24plus`                         | N/A       | N/A        | N/A        | Platform dependent: Maps to "`depth24unorm`" or `depth32float`.                                                                                                    |
| `depth24plus-stencil81`               | N/A       | N/A        | N/A        | Platform dependent: Maps to "`depth24unorm`" or `depth32float`.                                                                                                    |
| `depth32float`                        | N/A       | N/A        | N/A        | Higher precision than `depth24unorm` in representable range (0.0 to 1.0)                                                                                           |
| `depth32float-stencil8`               | N/A       | N/A        | N/A        | Platform dependent: Check via `depth32float-stencil8` feature.                                                                                                     |
| **`texture-compression-bc(5)`**       | —         | —          | —          | *[S3 Texture Compression](https://en.wikipedia.org/wiki/S3_Texture_Compression), aka BC (Block Compression) using FourCC DXTn file identifiers. 4-6x compression.* |
| `bc1-rgb-unorm-webgl`                 | N/A       | N/A        | N/A        | BC1 / DXT1: 16 input pixels in 64 bits.                                                                                                                            |
| `bc1-rgb-unorm-srgb-webgl`            | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc1-rgba-unorm`                      | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc1-rgba-unorm-srgb`                 | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc2-rgba-unorm`                      | N/A       | N/A        | N/A        | BC2 / DXT3: 16 input pixels in 128 bits                                                                                                                            |
| `bc2-rgba-unorm-srgb`                 | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc3-rgba-unorm`                      | N/A       | N/A        | N/A        | BC3 / DXT5: as BC2 with interpolated alpha.                                                                                                                        |
| `bc3-rgba-unorm-srgb`                 | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc4-r-unorm`                         | N/A       | N/A        | N/A        | BC4: 16 input single-channel (e.g. greyscale) pixels into 64 bits of output.                                                                                       |
| `bc4-r-snorm`                         | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc5-rg-unorm`                        | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc5-rg-snorm`                        | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| **`texture-compression-bc`**          | —         | —          | —          | —                                                                                                                                                                  |
| `bc6h-rgb-ufloat`                     | N/A       | N/A        | N/A        | BC6H: 6 input RGB HDR (float16) pixels into 128 bits of output                                                                                                     |
| `bc6h-rgb-float`                      | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| `bc7-rgba-unorm`                      | N/A       | N/A        | N/A        | BC7: encodes 16 input RGB8/RGBA8 pixels into 128 bits of output                                                                                                    |
| `bc7-rgba-unorm-srgb`                 | N/A       | N/A        | N/A        | —                                                                                                                                                                  |
| **`texture-compression-etc2`**        | —         | —          | —          | Performance caveat: Often CPU decompressed.                                                                                                                        |
| `etc2-rgb8unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGB8_ETC2`                                                                                                                                          |
| `etc2-rgb8unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ETC2`                                                                                                                                         |
| `etc2-rgb8a1unorm`                    | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2`                                                                                                                      |
| `etc2-rgb8a1unorm-srgb`               | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2`                                                                                                                     |
| `etc2-rgba8unorm`                     | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA8_ETC2_EAC`                                                                                                                                     |
| `etc2-rgba8unorm-srgb`                | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC`                                                                                                                              |
| `eac-r11unorm`                        | N/A       | N/A        | N/A        | `GL.COMPRESSED_R11_EAC`                                                                                                                                            |
| `eac-r11snorm`                        | N/A       | N/A        | N/A        | `GL.COMPRESSED_SIGNED_R11_EAC`                                                                                                                                     |
| `eac-rg11unorm`                       | N/A       | N/A        | N/A        | `GL.COMPRESSED_RG11_EAC`                                                                                                                                           |
| `eac-rg11snorm`                       | N/A       | N/A        | N/A        | `GL.COMPRESSED_SIGNED_RG11_EAC`                                                                                                                                    |
| **`texture-compression-astc`**        | —         | —          | —          | X\_ASTC compressed formats device.features.has                                                                                                                     |
| `astc-4x4-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_4x4_KHR`                                                                                                                                  |
| `astc-4x4-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR`                                                                                                                          |
| `astc-5x4-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_5x4_KHR`                                                                                                                                  |
| `astc-5x4-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR`                                                                                                                          |
| `astc-5x5-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_5x5_KHR`                                                                                                                                  |
| `astc-5x5-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR`                                                                                                                          |
| `astc-6x5-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_6x5_KHR`                                                                                                                                  |
| `astc-6x5-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR`                                                                                                                          |
| `astc-6x6-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_6x6_KHR`                                                                                                                                  |
| `astc-6x6-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR`                                                                                                                          |
| `astc-8x5-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_8x5_KHR`                                                                                                                                  |
| `astc-8x5-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR`                                                                                                                          |
| `astc-8x6-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_8x6_KHR`                                                                                                                                  |
| `astc-8x6-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR`                                                                                                                          |
| `astc-8x8-unorm`                      | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_8x8_KHR`                                                                                                                                  |
| `astc-8x8-unorm-srgb`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR`                                                                                                                          |
| `astc-10x5-unorm`                     | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_10x10_KHR`                                                                                                                                |
| `astc-10x5-unorm-srgb`                | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR`                                                                                                                        |
| `astc-10x6-unorm`                     | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_10x6_KHR`                                                                                                                                 |
| `astc-10x6-unorm-srgb`                | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR`                                                                                                                         |
| `astc-10x8-unorm`                     | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_10x8_KHR`                                                                                                                                 |
| `astc-10x8-unorm-srgb`                | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR`                                                                                                                         |
| `astc-10x10-unorm`                    | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_10x10_KHR`                                                                                                                                |
| `astc-10x10-unorm-srgb`               | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR`                                                                                                                        |
| `astc-12x10-unorm`                    | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_12x10_KHR`                                                                                                                                |
| `astc-12x10-unorm-srgb`               | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR`                                                                                                                        |
| `astc-12x12-unorm`                    | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ASTC_12x12_KHR`                                                                                                                                |
| `astc-12x12-unorm-srgb`               | N/A       | N/A        | N/A        | `GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR`                                                                                                                        |
| **`texture-compression-pvrtc-webgl`** | —         | —          | —          | `WEBGL_compressed_texture_pvrtc`                                                                                                                                   |
| `pvrtc-rgb4unorm-webgl`               | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG`                                                                                                                               |
| `pvrtc-rgba4unorm-webgl`              | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG`                                                                                                                              |
| `pvrtc-rgb2unorm-webgl`               | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG`                                                                                                                               |
| `pvrtc-rgba2unorm-webgl`              | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG`                                                                                                                              |
| **`texture-compression-etc1-webgl`**  | —         | —          | —          | —                                                                                                                                                                  |
| `etc1-rbg-unorm-webgl`                | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGB_ETC1_WEBGL`                                                                                                                                     |
| **`texture-compression-pvrtc-webgl`** | —         | —          | —          | —                                                                                                                                                                  |
| `atc-rgb-unorm-webgl`                 | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGB_ATC_WEBGL`                                                                                                                                      |
| `atc-rgba-unorm-webgl`                | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL`                                                                                                                      |
| `atc-rgbai-unorm-webgl`               | N/A       | N/A        | N/A        | `GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL`                                                                                                                  |

## Texture Format detection[​](#texture-format-detection "Direct link to Texture Format detection")

While a subset of texture formats are supported on all devices of a certain type, many texture formats are only supported if the underlying hardware supports them.

You can use `device.isTextureFormatSupported(format)` check if it is possible to create and sample textures with a specific texture format on your current device.

## Texture Format Capabilities[​](#texture-format-capabilities "Direct link to Texture Format Capabilities")

Even though a device allows a `Texture` to be created with a certain texture format, there may still be limitations in what operations can be done with that texture. luma provides `Device` methods to help applications determine the capabilities of a texture format.

| Can textures with the format...                        | Check using                                |
| ------------------------------------------------------ | ------------------------------------------ |
| be **created and sampled** (using `nearest` filters)?  | `device.isTextureFormatSupported(format)`  |
| be sampled using **linear filtering**?                 | `device.isTextureFormatFilterable(format)` |
| be rendered into? (render targets / color attachments) | `device.isTextureFormatRenderable(format)` |
| be used for storage bindings?                          | N/A                                        |
| be blended?                                            | Yes, if sampler type `float` is supported  |
| support multisampling?                                 | N/A                                        |

Remarks

* Mipmaps can only be auto created for formats that are both filterable and renderable.
* A renderable format is either a color renderable format, or a depth-or-stencil format
* All depth/stencil formats are renderable.
* Samplers always read a "vec4" regardless of which texture format is used. For formats with less than 4 components, missing red, green and blue components in the texture format are read as `0.0`, alpha as `1.0`/
* Note that some formats are not mandated by the base standard but represent additional capabilities (e.g. a WebGL2 device running on top of an OpenGL ES 3.2 driver). .

## Texture Format Groups[​](#texture-format-groups "Direct link to Texture Format Groups")

Support for some types of texture formats come in groups. As an alternative to checking texture support format-by-format, [`Device.features`](https://luma.gl/docs/api-reference/core/device-features.md) can be queried to determine if specific groups or classes of texture formats are supported.

| Feature                                | Optional capabilities                                     |
| -------------------------------------- | --------------------------------------------------------- |
| `texture-srgb-webgl1`                  | sRGB formats are supported                                |
| `texture-depth-webgl`                  | depth texture formats are supported                       |
| `texture-float32-webgl`                | Create floating point textures (`nearest` sampling only)  |
| `texture-float16-webgl`                | Create half-floating point textures (`nearest` sampling)  |
| `float32-renderable-webgl`             | Floating point textures are color-renderable and readable |
| `texture-renderable-float15-webgl`     | Half float textures are color-renderable and readable     |
| `texture-filterable-anisotropic-webgl` | anisotropic filtering                                     |
| `float32-filterable-linear-webgl`      | `linear` sampling of floating point textures              |
| `float16-filterable-linear-webgl`      | `linear` sampling of half-floating point textures         |

## Compressed Textures[​](#compressed-textures "Direct link to Compressed Textures")

For more information on compressed textures, see e.g. [Compressed Textures in 2020](https://aras-p.info/blog/2020/12/08/Texture-Compression-in-2020/).

| Feature                           | Type                                      | Devices                          | Description                              |
| --------------------------------- | ----------------------------------------- | -------------------------------- | ---------------------------------------- |
| `texture-compression-bc5-webgl`   | DXT compressed textures (BC1-BC5)         | Mainly desktops.                 | —                                        |
| `texture-compression-bc`          | DXT compressed textures (BC1-BC7)         | Mainly desktops.                 | Includes `texture-compression-bc5-webgl` |
| `texture-compression-etc`         | Ericsson compression.                     | "Always" available (CPU decode). | Slow, not recommended                    |
| `texture-compression-astc`        | Intel GPUs, Nividia Tegra, Mali ARM GPUs. | —                                | —                                        |
| `texture-compression-pvrtc-webgl` | PowerVR chipsets.                         | iPhone, iPad, certain Android    | —                                        |
| `texture-compression-atc-webgl`   | Adreno GPUs                               | Qualcomm Snapdragon devices.     | —                                        |
| `texture-compression-etc1-webgl`  | Ericsson Compression                      | Older ETC compression.           | —                                        |

The live capability sampler loads representative Basis/KTX2, BC/DXT, ASTC, and ETC assets. Unsupported cards are expected and reflect the formats exposed by the selected backend and GPU.

**Compressed texture support on this device**

Hover a preview for upload, format, and memory details.

Initializing device...

Scroll page · Ctrl/⌘ + scroll to interact

## Supercompressed Textures[​](#supercompressed-textures "Direct link to Supercompressed Textures")

To use Basis supercompressed textures in luma.gl, see the [loaders.gl](https://loaders.gl) `BasisLoader` which can extract compressed textures from a basis encoded texture.

## WebGL notes[​](#webgl-notes "Direct link to WebGL notes")

> Below is WebGL specific technical reference information that has been kept since luma.gl v8, it can be ignored for most applications

On WebGL devices, luma.gl maps WebGPU style texture format strings to WebGL constants under the hood. It is however possible to provide overrides for the WebGL constants. The following tables provide some information about WebGL texture constants

If an application wants to store the texture at a certain resolution or in a certain format, it can request the resolution and format with `internalFormat`. WebGL will choose an internal representation with least the internal component sizes, and exactly the component types shown for that format, although it may not match exactly.

### Internal Formats[​](#internal-formats "Direct link to Internal Formats")

| Sized Internal Format        | Comp. | Size     | Description                                                                                   |
| ---------------------------- | ----- | -------- | --------------------------------------------------------------------------------------------- |
| `GL.R8`                      | 1     | 8 bits   | red component                                                                                 |
| `GL.R16F`                    | 1     | 16 bits  | half float red component                                                                      |
| `GL.R32F`                    | 1     | 32 bits  | float red component                                                                           |
| `GL.R8UI`                    | 1     | 8 bits   | unsigned int red component, `usampler`, no filtering                                          |
| `GL.RG8`                     | 1     | 16 bits  | red and green components                                                                      |
| `GL.RG16F`                   | 2     | 32 bits  | red and green components, half float                                                          |
| `GL.RG32F`                   | 2     | 64 bits  | red and green components, float                                                               |
| `GL.RGUI`                    | 2     | 16 bits  | red and green components, `usampler`, no filtering                                            |
| `GL.RGB8`                    | 3     | 24 bits  | red, green and blue components                                                                |
| `GL.SRGB8` (EXT\_sRGB)       | 3     | 24 bits  | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer   |
| `GL.RGB565`                  | 3     | 16 bits  | 5 bit red, 6 bit green, 5 bit blue                                                            |
| `GL.R11F_G11F_B10F`          | 3     | 32 bits  | [11 and 10 bit floating point colors](https://www.opengl.org/wiki/Small_Float_Formats)        |
| `GL.RGB9_E5`                 | 3     | 32 bits  | [14 bit floating point RGB, shared exponent](https://www.opengl.org/wiki/Small_Float_Formats) |
| `GL.RGB16F`                  | 3     | 48 bits  | half float RGB                                                                                |
| `GL.RGB32F`                  | 3     | 96 bits  | float RBG                                                                                     |
| `GL.RGB8UI`                  | 3     | 24 bits  | unsigned integer 8 bit RGB: use `usampler`, no filtering                                      |
| `GL.RGBA8`                   | 4     | 32 bits  | 8 bit RGBA, typically what `GL.RGBA` "resolves" to                                            |
| `GL.SRGB_APLHA8` (EXT\_sRGB) | 4     | 32 bits  | Color values are encoded to/decoded from sRGB before being written to/read from framebuffer   |
| `GL.RGB5_A1`                 | 4     | 16 bits  | 5 bit RGB, 1 bit alpha                                                                        |
| `GL.RGBA4444`                | 4     | 16 bits  | 4 bit RGBA                                                                                    |
| `GL.RGBA16F`                 | 4     | 64 bits  | half float RGBA                                                                               |
| `GL.RGBA32F`                 | 4     | 128 bits | float RGA                                                                                     |
| `GL.RGBA8UI`                 | 4     | 32 bits  | unsigned integer 8 bit RGBA, `usampler`, no filtering                                         |

### Texture Component Type[​](#texture-component-type "Direct link to Texture Component Type")

Describes the layout of each color component in memory.

| Value                               | WebGL 2 |                                                     |
| ----------------------------------- | ------- | --------------------------------------------------- |
| `GL.UNSIGNED_BYTE`                  | Yes     | GLbyte 8 bits per channel for `GL.RGBA`             |
| `GL.UNSIGNED_SHORT_5_6_5`           | Yes     | 5 red bits, 6 green bits, 5 blue bits               |
| `GL.UNSIGNED_SHORT_4_4_4_4`         | Yes     | 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits |
| `GL.UNSIGNED_SHORT_5_5_5_1`         | Yes     | 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit  |
| `GL.BYTE`                           | Yes     | —                                                   |
| `GL.UNSIGNED_SHORT`                 | Yes     | —                                                   |
| `GL.SHORT`                          | Yes     | —                                                   |
| `GL.UNSIGNED_INT`                   | Yes     | —                                                   |
| `GL.INT`                            | Yes     | —                                                   |
| `GL.HALF_FLOAT`                     | Yes     | —                                                   |
| `GL.FLOAT`                          | Yes     | —                                                   |
| `GL.UNSIGNED_INT_2_10_10_10_REV`    | Yes     | —                                                   |
| `GL.UNSIGNED_INT_10F_11F_11F_REV`   | Yes     | —                                                   |
| `GL.UNSIGNED_INT_5_9_9_9_REV`       | Yes     | —                                                   |
| `GL.UNSIGNED_INT_24_8`              | Yes     | —                                                   |
| `GL.FLOAT_32_UNSIGNED_INT_24_8_REV` | Yes     | (pixels must be null)                               |

### Texture Format Combinations[​](#texture-format-combinations "Direct link to Texture Format Combinations")

This a simplified table illustrating what combinations of internal formats work with what data formats and types. Note that luma.gl deduces `dataFormat` and `type` from `format` by taking the first value from the data format and data type entries in this table.

For more details, see tables in:

* [WebGL 2 spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
* [OpenGL ES spec](https://www.khronos.org/opengles/sdk/docs/man3/html/glTexImage2D.xhtml)

| Internal Format     | Data Format       | Data Type                                                                  |
| ------------------- | ----------------- | -------------------------------------------------------------------------- |
| `GL.RGB`            | `GL.RGB`          | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5`                               |
| `GL.RGBA`           | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4` `GL.UNSIGNED_SHORT_5_5_5_1` |
| `GL.R8`             | `GL.RED`          | `GL.UNSIGNED_BYTE`                                                         |
| `GL.R16F`           | `GL.RED`          | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.R32F`           | `GL.RED`          | `GL.FLOAT`                                                                 |
| `GL.R8UI`           | `GL.RED_INTEGER`  | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RG8`            | `GL.RG`           | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RG16F`          | `GL.RG`           | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RG32F`          | `GL.RG`           | `GL.FLOAT`                                                                 |
| `GL.RG8UI`          | `GL.RG_INTEGER`   | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGB8`           | `GL.RGB`          | `GL.UNSIGNED_BYTE`                                                         |
| `GL.SRGB8`          | `GL.RGB`          | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGB565`         | `GL.RGB`          | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_6_5`                               |
| `GL.R11F_G11F_B10F` | `GL.RGB`          | `GL.UNSIGNED_INT_10F_11F_11F_REV` `GL.HALF_FLOAT` `GL.FLOAT`               |
| `GL.RGB9_E5`        | `GL.RGB`          | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RGB16FG`        | `GL.RGB`          | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RGB32F`         | `GL.RGB`          | `GL.FLOAT`                                                                 |
| `GL.RGB8UI`         | `GL.RGB_INTEGER`  | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGBA8`          | `GL.RGBA`         | `GL.UNSIGNED_BYTE`                                                         |
| `GL.SRGB8_ALPHA8`   | `GL.RGBA`         | `GL.UNSIGNED_BYTE`                                                         |
| `GL.RGB5_A1`        | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_5_5_5_1`                             |
| `GL.RGBA4`          | `GL.RGBA`         | `GL.UNSIGNED_BYTE` `GL.UNSIGNED_SHORT_4_4_4_4`                             |
| `GL.RGBA16F`        | `GL.RGBA`         | `GL.HALF_FLOAT` `GL.FLOAT`                                                 |
| `GL.RGBA32F`        | `GL.RGBA`         | `GL.FLOAT`                                                                 |
| `GL.RGBA8UI`        | `GL.RGBA_INTEGER` | `GL.UNSIGNED_BYTE`                                                         |
