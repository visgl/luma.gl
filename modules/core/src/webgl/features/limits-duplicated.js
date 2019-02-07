import GL from '@luma.gl/constants';
import {isWebGL2} from '../utils';

const WEBGL_LIMITS = {
  [GL.ALIASED_LINE_WIDTH_RANGE]: [new Float32Array([1, 1])],
  [GL.ALIASED_POINT_SIZE_RANGE]: [new Float32Array([1, 1])],
  [GL.MAX_TEXTURE_SIZE]: [64, 2048],
  [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: [16],
  [GL.MAX_TEXTURE_IMAGE_UNITS]: [8],
  [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: [8],
  [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: [0],
  [GL.MAX_RENDERBUFFER_SIZE]: [1],
  [GL.MAX_VARYING_VECTORS]: [8],
  [GL.MAX_VERTEX_ATTRIBS]: [8],
  [GL.MAX_VERTEX_UNIFORM_VECTORS]: [128],
  [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: [16],
  [GL.MAX_VIEWPORT_DIMS]: [new Int32Array([0, 0])],

  // Extensions
  // [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: [1]

  // WebGL2 Limits
  [GL.MAX_3D_TEXTURE_SIZE]: [0, 256],
  [GL.MAX_ARRAY_TEXTURE_LAYERS]: [0, 256],
  [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: [0, 0],
  [GL.MAX_COLOR_ATTACHMENTS]: [0, 4],
  [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: [0, 0],
  [GL.MAX_COMBINED_UNIFORM_BLOCKS]: [0, 0],
  [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: [0, 0],
  [GL.MAX_DRAW_BUFFERS]: [0, 4],
  [GL.MAX_ELEMENT_INDEX]: [0, 0],
  [GL.MAX_ELEMENTS_INDICES]: [0, 0],
  [GL.MAX_ELEMENTS_VERTICES]: [0, 0],
  [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: [0, 0],
  [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: [0, 0],
  [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: [0, 0],
  [GL.MAX_SAMPLES]: [0, 0],
  [GL.MAX_SERVER_WAIT_TIMEOUT]: [0, 0],
  [GL.MAX_TEXTURE_LOD_BIAS]: [0, 0],
  [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: [0, 0],
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: [0, 0],
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: [0, 0],
  [GL.MAX_UNIFORM_BLOCK_SIZE]: [0, 0],
  [GL.MAX_UNIFORM_BUFFER_BINDINGS]: [0, 0],
  [GL.MAX_VARYING_COMPONENTS]: [0, 0],
  [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: [0, 0],
  [GL.MAX_VERTEX_UNIFORM_BLOCKS]: [0, 0],
  [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: [0, 0],
  [GL.MIN_PROGRAM_TEXEL_OFFSET]: [0, -8],
  [GL.MAX_PROGRAM_TEXEL_OFFSET]: [0, 7],
  [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: [0, 0]
};

// const EXTENSION_SETTINGS = {
//   [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: 'anisotropy'
// };

export function getContextLimits(gl) {
  gl.luma = gl.luma || {};

  if (!gl.luma.limits) {
    gl.luma.limits = {};
    gl.luma.webgl1MinLimits = {};
    gl.luma.webgl2MinLimits = {};

    const isWebgl2 = isWebGL2(gl);

    // WEBGL limits
    for (const parameter in WEBGL_LIMITS) {
      const limit = WEBGL_LIMITS[parameter];

      const webgl1MinLimit = limit.gl1;
      const webgl2MinLimit = 'gl2' in limit ? limit.gl2 : limit.gl1;
      const minLimit = isWebgl2 ? webgl2MinLimit : webgl1MinLimit;

      // Check if we can query for this limit
      const limitNotAvailable =
        ('gl2' in limit && !isWebgl2) ||
        ('extension' in limit && !gl.getExtension(limit.extension));

      const value = limitNotAvailable ? minLimit : gl.getParameter(parameter);
      gl.luma.limits[parameter] = value;
      gl.luma.webgl1MinLimits[parameter] = webgl1MinLimit;
      gl.luma.webgl2MinLimits[parameter] = webgl2MinLimit;
    }
  }

  return gl.luma.limits;
}
