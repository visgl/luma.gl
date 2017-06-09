withParameters(gl, {
  blend: false,
  blendColor: [0, 0, 0, 0],
  blendEquation: [GL.FUNC_ADD, GL.FUNC_ADD], // [GL.BLEND_EQUATION_RGB, GL.BLEND_EQUATION_ALPHA],
  blendFunc: [GL.ONE, GL.ZERO, GL.ONE, GL.ZERO],

  clearColor: [0, 0, 0, 0],
  colorMask: [true, true, true, true],
  colorWritemask: ,

  cullFace: false,
  cullFaceMode: GL.BACK,

  depthTest: false,
  depthClearValue: 1,
  depthFunc: GL.LESS,
  depthRange: [0, 1],
  depthWritemask: true,

  dither: true,

  frontFace: GL.CCW,

  generateMipmapHint: GL.DONT_CARE,

  lineWidth: 1,

  polygonOffsetFill: false,
  polygonOffset: [0, 0],

  sampleCoverage: GL_SAMPLE_COVERAGE,

  scissorTest: false,
  scissorBox: [0, 0, 1024, 1024],

  stencilTest: false,
  stencilClearValue: 0,
  stencilMask: [0xFFFFFFFF, 0xFFFFFFFF],
  stencilFunc: [GL.ALWAYS, 0, 0xFFFFFFFF, GL.ALWAYS, 0, 0xFFFFFFFF],
  stencilOp: [GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP],

  viewport: [0, 0, 1024, 1024],

  [GL.PACK_ALIGNMENT: 4,
  [GL.UNPACK_ALIGNMENT: 4,
  [GL.UNPACK_FLIP_Y_WEBGL]: false,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: GL.BROWSER_DEFAULT_WEBGL,

  // WEBGL2 PIXEL PACK/UNPACK MODES

  [GL.PACK_ROW_LENGTH: 0,
  [GL.PACK_SKIP_PIXELS: 0,
  [GL.PACK_SKIP_ROWS: 0,
  [GL.UNPACK_ROW_LENGTH: 0,
  [GL.UNPACK_IMAGE_HEIGHT: 0,
  [GL.UNPACK_SKIP_PIXELS: 0,
  [GL.UNPACK_SKIP_ROWS: 0,
  [GL.UNPACK_SKIP_IMAGES: 0

---

| `blend` | `false` | |
| `blendColor` | `new Float32Array([0, 0, 0, 0])` | |
| `blendEquation` | `[GL.FUNC_ADD, GL.FUNC_ADD]` | |
| `blendFunc` | `[GL.ONE, GL.ZERO, GL.ONE, GL.ZERO]` | |

| `clearColor` | `new Float32Array([0, 0, 0, 0])` | |
| `colorMask` | `[true, true, true, true]` | |

| `cullFace` | `false` | |
| `cullFaceMode` | `GL.BACK` | |

| `depthTest` | `false` | |
| `depthClearValue` | `1` | |
| `depthFunc` | `GL.LESS` | |
| `depthRange` | `new Float32Array([0, 1])` | |
| `depthWritemask` | `true` | |

| `dither` | `true` | |

| `fragmentShaderDerivativeHint` | `GL.DONT_CARE` | |

| `frontFace` | `GL.CCW` | |
| `generateMipmapHint` | `GL.DONT_CARE, // Hint for quality of images generated with` glGenerateMipmap |

| `lineWidth` | `1` | No longer supported by most browsers |

| `polygonOffsetFill` | `false` | Add small offset to fragment depth values |
| `polygonOffset` | `[0, 0]` | factor × DZ + r × units |

| `sampleCoverage` | 
| GL_SAMPLE_ALPHA_TO_COVERAGE |
| GL_SAMPLE_COVERAGE | specify multisample coverage parameters |

| `sampleCoverage` | `[1.0, false]`,
| `scissorTest` | `false` | |
| `scissorBox` | `new Int32Array([0, 0, 1024, 1024])` | |
| `stencilTest` | `false` | |
| `stencilClearValue` | `0` | Sets index used when stencil buffer is cleared |
| `stencilMask` | `[0xFFFFFFFF, 0xFFFFFFFF]` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `stencilFunc` | `[GL.ALWAYS, 0, 0xFFFFFFFF, GL.ALWAYS, 0, 0xFFFFFFFF]` | Set stencil testing function, reference value and mask for front and back |
| `stencilOp` | `[GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP]` | Specifies the action to take when the stencil test fails, front and back |
| viewport | new Int32Array([0, 0, 1024, 1024]) | |

| WEBGL1 PIXEL PACK/UNPACK MODES | | |

| [GL.PACK_ALIGNMENT] | 4,   // Packing of pixel data in memory (1,2,4,8)
| [GL.UNPACK_ALIGNMENT] | 4,   // Unpacking pixel data from memory(1,2,4,8)
| [GL.UNPACK_FLIP_Y_WEBGL]: false, // Flip source data along its vertical axis
| [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]:GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, // Multiplies the alpha channel into the other color channels
| [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]:GL.BROWSER_DEFAULT_WEBGL, // Default color space conversion or no color space conversion.

WEBGL2 PIXEL PACK/UNPACK MODES


| [GL.PACK_ROW_LENGTH] | 0,   // Number of pixels in a row.
| [GL.PACK_SKIP_PIXELS] | 0,// Number of pixels skipped before the first pixel is written into memory.
| [GL.PACK_SKIP_ROWS] | 0, // Number of rows of pixels skipped before first pixel is written to memory.
| [GL.UNPACK_ROW_LENGTH] | 0, // Number of pixels in a row.
| [GL.UNPACK_IMAGE_HEIGHT] | 0, // Image height used for reading pixel data from memory
| [GL.UNPACK_SKIP_PIXELS] | 0, // Number of pixel images skipped before first pixel is read from memory
| [GL.UNPACK_SKIP_ROWS] | 0, // Number of rows of pixels skipped before first pixel is read from memory
| [GL.UNPACK_SKIP_IMAGES] | 0 | Number of pixel images skipped before first pixel is read from memory
