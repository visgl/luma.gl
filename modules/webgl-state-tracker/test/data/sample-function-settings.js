import GL from '@luma.gl/constants';

// NOTE: These settings are same as ENUM_STYLE_SETTINGS_SET1
// In unit tests for bellow settings, we use ENUM_STYLE_SETTINGS_SET1
// to verify expected state.
export const FUNCTION_STYLE_SETTINGS_SET1 = {
  blend: true,
  blendColor: new Float32Array([0.5, 0.5, 0.5, 0]),
  blendEquation: [GL.FUNC_SUBTRACT, GL.MIN],
  blendFunc: [GL.SRC_COLOR, GL.DST_COLOR, GL.SRC_ALPHA, GL.DST_ALPHA],
  clearColor: new Float32Array([0.5, 0.5, 0.5, 0]),
  colorMask: [false, false, false, true],
  cull: true,
  cullFace: GL.FRONT,
  depthTest: true,
  clearDepth: 0,
  depthFunc: GL.NEVER,
  depthRange: new Float32Array([0.5, 1]), // TBD
  depthMask: false,
  dither: false,
  frontFace: GL.CW,
  mipmapHint: GL.FASTEST,
  lineWidth: 2,
  polygonOffsetFill: true,
  polygonOffset: [1, 1],
  sampleCoverage: [0, true],
  scissorTest: true,
  // Note: Dynamic value. If scissor test enabled we expect users to set correct scissor box
  scissor: new Int32Array([0, 0, 100, 100]),
  stencilTest: true,
  clearStencil: 0xf,
  stencilMask: [0xcccccccc, 0xdddddddd],
  stencilFunc: [GL.NEVER, 0.5, 0xbbbbbbbb, GL.LEQUAL, 0.5, 0x11111111],
  stencilOp: [GL.REPLACE, GL.INCR, GL.DECR, GL.REPLACE, GL.INCR, GL.DECR],
  // Dynamic value: We use [0, 0, 1024, 1024] as default, but usually this is updated in each frame.
  viewport: new Int32Array([0, 0, 100, 100]),
  // WEBGL1 PIXEL PACK/UNPACK MODES
  [GL.PACK_ALIGNMENT]: 8,
  [GL.UNPACK_ALIGNMENT]: 8,
  [GL.UNPACK_FLIP_Y_WEBGL]: true,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: true,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: GL.NONE,

  // WEBGL2 / EXTENSIONS
  // gl1: 'OES_standard_derivatives'
  derivativeHint: GL.FASTEST,
  [GL.RASTERIZER_DISCARD]: true,
  [GL.PACK_ROW_LENGTH]: 2,
  [GL.PACK_SKIP_PIXELS]: 4,
  [GL.PACK_SKIP_ROWS]: 8,
  [GL.UNPACK_ROW_LENGTH]: 16,
  [GL.UNPACK_IMAGE_HEIGHT]: 32,
  [GL.UNPACK_SKIP_PIXELS]: 64,
  [GL.UNPACK_SKIP_ROWS]: 128,
  [GL.UNPACK_SKIP_IMAGES]: 512
};
