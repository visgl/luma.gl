import GL from '@luma.gl/constants';

// Define local extension strings to optimize minification
// const SRGB = 'EXT_sRGB';
// const EXT_FLOAT_WEBGL1 = 'WEBGL.color_buffer_float';
const EXT_FLOAT_WEBGL2 = 'EXT_color_buffer_float';
// const EXT_HALF_FLOAT_WEBGL1 = 'EXT_color_buffer_half_float';

export default {
  [GL.DEPTH_COMPONENT16]: {}, // 16 depth bits.
  [GL.DEPTH_COMPONENT24]: {gl2: true},
  [GL.DEPTH_COMPONENT32F]: {gl2: true},

  [GL.STENCIL_INDEX8]: {}, // 8 stencil bits.

  [GL.DEPTH_STENCIL]: {},
  [GL.DEPTH24_STENCIL8]: {gl2: true},
  [GL.DEPTH32F_STENCIL8]: {gl2: true},

  // When using a WebGL 1 context, color renderbuffer formats are limited
  [GL.RGBA4]: {},
  [GL.RGB565]: {},
  [GL.RGB5_A1]: {},

  // When using a WebGL 2 context, the following values are available additionally:
  [GL.R8]: {gl2: true},
  [GL.R8UI]: {gl2: true},
  [GL.R8I]: {gl2: true},
  [GL.R16UI]: {gl2: true},
  [GL.R16I]: {gl2: true},
  [GL.R32UI]: {gl2: true},
  [GL.R32I]: {gl2: true},
  [GL.RG8]: {gl2: true},
  [GL.RG8UI]: {gl2: true},
  [GL.RG8I]: {gl2: true},
  [GL.RG16UI]: {gl2: true},
  [GL.RG16I]: {gl2: true},
  [GL.RG32UI]: {gl2: true},
  [GL.RG32I]: {gl2: true},
  [GL.RGB8]: {gl2: true},
  [GL.RGBA8]: {gl2: true},
  // [GL.SRGB8_ALPHA8]: {gl2: true, gl1: SRGB}, // When using the EXT_sRGB WebGL1 extension
  [GL.RGB10_A2]: {gl2: true},
  [GL.RGBA8UI]: {gl2: true},
  [GL.RGBA8I]: {gl2: true},
  [GL.RGB10_A2UI]: {gl2: true},
  [GL.RGBA16UI]: {gl2: true},
  [GL.RGBA16I]: {gl2: true},
  [GL.RGBA32I]: {gl2: true},
  [GL.RGBA32UI]: {gl2: true},

  // When using a WebGL 2 context and the EXT_color_buffer_float WebGL2 extension
  [GL.R16F]: {gl2: EXT_FLOAT_WEBGL2},
  [GL.RG16F]: {gl2: EXT_FLOAT_WEBGL2},
  [GL.RGBA16F]: {gl2: EXT_FLOAT_WEBGL2},
  [GL.R32F]: {gl2: EXT_FLOAT_WEBGL2},
  [GL.RG32F]: {gl2: EXT_FLOAT_WEBGL2},
  // TODO - can't get WEBGL.color_buffer_float to work on renderbuffers
  [GL.RGBA32F]: {gl2: EXT_FLOAT_WEBGL2},
  // [GL.RGBA32F]: {gl2: EXT_FLOAT_WEBGL2, gl1: EXT_FLOAT_WEBGL1},
  [GL.R11F_G11F_B10F]: {gl2: EXT_FLOAT_WEBGL2}
};
