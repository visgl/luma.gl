/* eslint-disable no-inline-comments, max-len */
import GL from './gl-constants';
import {isWebGL2Context} from './context';
import assert from 'assert';

const WEBGL_LIMITS = {
  [GL.ALIASED_LINE_WIDTH_RANGE]: {webgl1: new Float32Array([1, 1])},
  [GL.ALIASED_POINT_SIZE_RANGE]: {webgl1: new Float32Array([1, 1])},
  [GL.MAX_TEXTURE_SIZE]: {webgl1: 64, webgl2: 2048}, // GLint
  [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: {webgl1: 16}, // GLint
  [GL.MAX_TEXTURE_IMAGE_UNITS]: {webgl1: 8}, // GLint
  [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: {webgl1: 8}, // GLint
  [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: {webgl1: 0}, // GLint
  [GL.MAX_RENDERBUFFER_SIZE]: {webgl1: 1}, // GLint
  [GL.MAX_VARYING_VECTORS]: {webgl1: 8}, // GLint
  [GL.MAX_VERTEX_ATTRIBS]: {webgl1: 8}, // GLint
  [GL.MAX_VERTEX_UNIFORM_VECTORS]: {webgl1: 128}, // GLint
  [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: {webgl1: 16}, // GLint
  [GL.MAX_VIEWPORT_DIMS]: {webgl1: new Int32Array([0, 0])},

  // Extensions
  [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: {webgl1: 1.0, extension: 'EXT_texture_filter_anisotropic'},

  // WebGL2 Limits
  [GL.MAX_3D_TEXTURE_SIZE]: {webgl1: 0, webgl2: 256}, //  GLint
  [GL.MAX_ARRAY_TEXTURE_LAYERS]: {webgl1: 0, webgl2: 256}, // GLint
  [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: {webgl1: 0, webgl2: 0}, //  GLint64
  [GL.MAX_COLOR_ATTACHMENTS]: {webgl1: 0, webgl2: 4}, //  GLint
  [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: {webgl1: 0, webgl2: 0}, // GLint64
  [GL.MAX_COMBINED_UNIFORM_BLOCKS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: {webgl1: 0, webgl2: 0}, // GLint64
  [GL.MAX_DRAW_BUFFERS]: {webgl1: 0, webgl2: 4, extension: 'WEBGL_draw_buffers'}, // GLint
  [GL.MAX_ELEMENT_INDEX]: {webgl1: 0, webgl2: 0}, //  GLint64
  [GL.MAX_ELEMENTS_INDICES]: {webgl1: 0, webgl2: 0}, // GLint
  [GL.MAX_ELEMENTS_VERTICES]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_PROGRAM_TEXEL_OFFSET]: {webgl1: 0, webgl2: 0}, // GLint
  [GL.MAX_SAMPLES]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_SERVER_WAIT_TIMEOUT]: {webgl1: 0, webgl2: 0}, //  GLint64
  [GL.MAX_TEXTURE_LOD_BIAS]: {webgl1: 0, webgl2: 0}, // GLfloat
  [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: {webgl1: 0, webgl2: 0}, // GLint
  [GL.MAX_UNIFORM_BLOCK_SIZE]: {webgl1: 0, webgl2: 0}, // GLint64
  [GL.MAX_UNIFORM_BUFFER_BINDINGS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_VARYING_COMPONENTS]: {webgl1: 0, webgl2: 0}, // GLint
  [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: {webgl1: 0, webgl2: 0}, // GLint
  [GL.MAX_VERTEX_UNIFORM_BLOCKS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: {webgl1: 0, webgl2: 0}, //  GLint
  [GL.MIN_PROGRAM_TEXEL_OFFSET]: {webgl1: 0, webgl2: 0}, // GLint
  [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: {webgl1: 0, webgl2: 0} // GLint
};

export const ES300 = 'ES300';
const WEBGL1 = 'WEBGL1';

const WEBGL_CAPS = {

  // DEBUG CAPABILITIS

  DEBUG_RENDERER_INFO: {
    webgl1: 'WEBGL_debug_renderer_info',
    webgl2: WEBGL1
  },
  DEBUG_SHADERS: {
    webgl1: 'WEBGL_debug_shaders',
    webgl2: WEBGL1
  },
  LOSE_CONTEXT: {
    webgl1: 'WEBGL_lose_context',
    webgl2: WEBGL1
  },
  DISJOINT_TIMER_QUERY: {
    webgl1: 'EXT_disjoint_timer_query',
    webgl2: 'EXT_disjoint_timer_query_webgl2'
  },

  // MAJOR FEATURE/OBJECT SUPPORT

  INSTANCED_ARRAYS: {
    webgl1: 'ANGLE_instanced_arrays',
    webgl2: true
  },
  VERTEX_ARRAY_OBJECT: {
    webgl1: 'OES_vertex_array_object',
    webgl2: true
  },

  ELEMENT_INDEX_UINT: {
    webgl1: 'OES_element_index_uint',
    webgl2: true
  },
  BLEND_MINMAX: {
    webgl1: 'EXT_blend_minmax',
    webgl2: true
  },
  SRGB: {
    webgl1: 'EXT_sRGB',
    webgl2: true
  },
  DEPTH_TEXTURE: {
    webgl1: 'WEBGL_depth_texture',
    webgl2: true
  },
  TEXTURE_FILTER_ANISOTROPIC: {
    webgl1: 'EXT_texture_filter_anisotropic',
    webgl2: WEBGL1
  },
  TEXTURE_FLOAT: {
    webgl1: 'OES_texture_float',
    webgl2: true
  },
  TEXTURE_FLOAT_LINEAR: {
    webgl1: 'OES_texture_float_linear',
    webgl2: WEBGL1
  },
  TEXTURE_HALF_FLOAT: {
    webgl1: 'OES_texture_half_float',
    webgl2: true
  },
  TEXTURE_HALF_FLOAT_LINEAR: {
    webgl1: 'OES_texture_half_float_linear',
    webgl2: true
  },
  // WebGL1 only supports one color buffer format (RBG32F is deprecated)
  COLOR_BUFFER_FLOAT_RGBA32F: {
    webgl1: 'WEBGL_color_buffer_float',
    webgl2: 'EXT_color_buffer_float'
  },
  // WebGL2 supports multiple color buffer formats
  COLOR_BUFFER_FLOAT: {
    webgl1: false,
    webgl2: 'EXT_color_buffer_float'
  },
  COLOR_BUFFER_HALF_FLOAT: {
    webgl1: false,
    webgl2: 'EXT_color_buffer_half_float'
  },

  // GLSL extensions

  FRAG_DEPTH: {
    webgl1: 'EXT_frag_depth',
    webgl2: ES300
  },
  SHADER_TEXTURE_LOD: {
    webgl1: 'EXT_shader_texture_lod',
    webgl2: ES300
  },
  FRAGMENT_SHADER_DERIVATIVES: {
    webgl1: 'OES_standard_derivatives',
    webgl2: ES300
  },
  MULTIPLE_RENDER_TARGETS: {
    webgl1: 'WEBGL_draw_buffers',
    webgl2: ES300
  },

  // COMPRESSED TEXTURES

  COMPRESSED_TEXTURE_S3TC: {
    webgl1: 'WEBGL_compressed_texture_s3tc',
    webgl2: WEBGL1
  },
  COMPRESSED_TEXTURE_ATC: {
    webgl1: 'WEBGL_compressed_texture_atc',
    webgl2: WEBGL1
  },
  COMPRESSED_TEXTURE_ETC: {
    webgl1: 'WEBGL_compressed_texture_etc',
    webgl2: WEBGL1
  },
  COMPRESSED_TEXTURE_ETC1: {
    webgl1: 'WEBGL_compressed_texture_etc1',
    webgl2: WEBGL1
  },
  COMPRESSED_TEXTURE_PVRTC: {
    webgl1: 'WEBGL_compressed_texture_pvrtc',
    webgl2: WEBGL1
  }
};

export function getGLContextInfo(gl) {
  gl.luma = gl.luma || {};

  if (!gl.luma.info) {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    gl.luma.info = {
      [GL.VENDOR]: gl.getParameter(GL.VENDOR),
      [GL.RENDERER]: gl.getParameter(GL.RENDERER),
      [GL.UNMASKED_VENDOR_WEBGL]:
        gl.getParameter(info ? GL.UNMASKED_VENDOR_WEBGL : GL.VENDOR),
      [GL.UNMASKED_RENDERER_WEBGL]:
        gl.getParameter(info ? GL.UNMASKED_RENDERER_WEBGL : GL.RENDERER),
      [GL.VERSION]: gl.getParameter(GL.VERSION),
      [GL.SHADING_LANGUAGE_VERSION]: gl.getParameter(GL.SHADING_LANGUAGE_VERSION)
    };
  }

  return gl.luma.info;
}

export function getContextLimits(gl) {
  gl.luma = gl.luma || {};

  if (!gl.luma.limits) {
    gl.luma.limits = {};
    gl.luma.webgl1MinLimits = {};
    gl.luma.webgl2MinLimits = {};

    const isWebgl2 = isWebGL2Context(gl);

    // WEBGL limits
    for (const parameter in WEBGL_LIMITS) {
      const limit = WEBGL_LIMITS[parameter];

      const webgl1MinLimit = limit.webgl1;
      const webgl2MinLimit = 'webgl2' in limit ? limit.webgl2 : limit.webgl1;
      const minLimit = isWebgl2 ? webgl2MinLimit : webgl1MinLimit;

      // Check if we can query for this limit
      const limitNotAvailable =
        ('webgl2' in limit && !isWebgl2) ||
        ('extension' in limit && !gl.getExtension(limit.extension));

      const value = limitNotAvailable ? minLimit : gl.getParameter(parameter);

      gl.luma.limits[parameter] = value;
      gl.luma.webgl1MinLimits[parameter] = webgl1MinLimit;
      gl.luma.webgl2MinLimits[parameter] = webgl2MinLimit;
    }
  }

  return gl.luma.limits;
}

export function getContextCaps(gl) {
  gl.luma = gl.luma || {};

  if (!gl.luma.caps) {
    const webglVersion = isWebGL2Context(gl) ? 'webgl2' : 'webgl1';
    gl.luma.caps = {};
    for (const cap in WEBGL_CAPS) {
      gl.luma.caps[cap] = getCap({gl, cap, webglVersion});
    }

  }
  return gl.luma.caps;
}

function getCap({gl, cap, webglVersion}) {

  // Get extension name, and replace if webgl2 uses the webgl1 extension
  let extensionName = WEBGL_CAPS[cap][webglVersion];
  if (extensionName === WEBGL1) {
    extensionName = WEBGL_CAPS[cap].webgl1;
  }

  let value = extensionName;
  // Check if the value is dependent on checking an extension
  if (typeof extensionName === 'string' && extensionName !== ES300) {
    value = Boolean(gl.getExtension(extensionName));
  }
  assert(value === false || value === true || value === ES300);
  return value;
}

export function getContextInfo(gl) {
  const info = getGLContextInfo(gl);
  const limits = getContextLimits(gl);
  return {
    // basic information
    vendor: info[GL.UNMASKED_VENDOR_WEBGL] || info[GL.VENDOR],
    renderer: info[GL.UNMASKED_RENDERER_WEBGL] || info[GL.RENDERER],
    version: info[GL.VERSION],
    shadingLanguageVersion: info[GL.SHADING_LANGUAGE_VERSION],
    // info, caps and limits
    info,
    caps: getContextCaps(gl),
    limits,
    webgl1MinLimits: gl.luma.webgl1MinLimits,
    webgl2MinLimits: gl.luma.webgl2MinLimits
  };
}

export const TEST_LIMITS = {
  WEBGL_LIMITS,
  WEBGL_CAPS
};
