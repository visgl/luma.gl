// Parameter support.
// Installs definitions that enable querying an object for all its parameters
// with resource.getParameters(). This is mainly useful during debugging.
// Note: Kept separate to avoid bundling in production applications

import GL from './gl-constants';
import Buffer from './buffer';
import FenceSync from './fence-sync';
import Framebuffer from './framebuffer';
import Program from './program';
import Renderbuffer from './renderbuffer';
import Sampler from './sampler';
// import Shader from './shader';
import Texture from './texture';

const BUFFER_PARAMETERS = {
  [GL.BUFFER_SIZE]: {webgl1: 0}, // GLint indicating the size of the buffer in bytes.
  [GL.BUFFER_USAGE]: {webgl1: 0} // GLenum indicating the usage pattern of the buffer.
};

const FENCE_SYNC_PARAMETERS = [
  GL.OBJECT_TYPE, // GLenum, type of sync object (always GL.SYNC_FENCE).
  GL.SYNC_STATUS, // GLenum, status of sync object (GL.SIGNALED/GL.UNSIGNALED)
  GL.SYNC_CONDITION, // GLenum. object condition (always GL.SYNC_GPU_COMMANDS_COMPLETE).
  GL.SYNC_FLAGS // GLenum, flags sync object was created with (always 0)
];

const FRAMEBUFFER_ATTACHMENT_PARAMETERS = [
  GL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, // WebGLRenderbuffer or WebGLTexture
  GL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, // GL.RENDERBUFFER, GL.TEXTURE, GL.NONE
  GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE, // GL.TEXTURE_CUBE_MAP_POSITIVE_X, etc.
  GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL, // GLint
  // EXT_sRGB or WebGL2
  GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING, // GL.LINEAR, GL.SRBG
  // WebGL2
  GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE
  // GL.FLOAT, GL.INT, GL.UNSIGNED_INT, GL.SIGNED_NORMALIZED, OR GL.UNSIGNED_NORMALIZED.
];

const FRAMEBUFFER_STATUS = {
  [GL.FRAMEBUFFER_COMPLETE]:
    'Success. Framebuffer is correctly set up',
  [GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]:
    'Framebuffer attachment types mismatched or some attachment point not attachment complete',
  [GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]:
    'Framebuffer has no attachment',
  [GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]:
    'Framebuffer attachments do not have the same size',
  [GL.FRAMEBUFFER_UNSUPPORTED]:
    'Framebuffer attachment format not supported or depth and stencil attachments are not same',
  // When using a WebGL 2 context, the following values can be returned
  [GL.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE]:
    'Framebuffer attachement SAMPLES differs among renderbuffers, or are mixed with textures'
};

const PROGRAM_PARAMETERS = {
  [GL.DELETE_STATUS]: {webgl1: 0}, // GLboolean
  [GL.LINK_STATUS]: {webgl1: 0}, // GLboolean
  [GL.VALIDATE_STATUS]: {webgl1: 0}, // GLboolean
  [GL.ATTACHED_SHADERS]: {webgl1: 0}, // GLint
  [GL.ACTIVE_ATTRIBUTES]: {webgl1: 0}, // GLint
  [GL.ACTIVE_UNIFORMS]: {webgl1: 0}, // GLint
  [GL.TRANSFORM_FEEDBACK_BUFFER_MODE]: {webgl2: 0}, // SEPARATE_ATTRIBS/INTERLEAVED_ATTRIBS
  [GL.TRANSFORM_FEEDBACK_VARYINGS]: {webgl2: 0}, // GLint
  [GL.ACTIVE_UNIFORM_BLOCKS]: {webgl2: 0} // GLint
};

//  parameters
const RENDERBUFFER_PARAMETERS = {
  // WebGL1 parameters
  [GL.RENDERBUFFER_WIDTH]: {webgl1: 0}, // {GLint} - height of the image of renderbuffer.
  [GL.RENDERBUFFER_HEIGHT]: {webgl1: 0}, // {GLint} - height of the image of renderbuffer.

  // Internal format of the currently bound renderbuffer.
  // The default is GL.RGBA4. Possible return values:
  // GL.RGBA4: 4 red bits, 4 green bits, 4 blue bits 4 alpha bits.
  // GL.RGB565: 5 red bits, 6 green bits, 5 blue bits.
  // GL.RGB5_A1: 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
  // GL.DEPTH_COMPONENT16: 16 depth bits.
  // GL.STENCIL_INDEX8: 8 stencil bits.
  [GL.RENDERBUFFER_INTERNAL_FORMAT]: {type: 'GLenum', webgl1: GL.RGBA4},

  [GL.RENDERBUFFER_GREEN_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of green color
  [GL.RENDERBUFFER_BLUE_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of blue color
  [GL.RENDERBUFFER_RED_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of red color
  [GL.RENDERBUFFER_ALPHA_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of alpha component
  [GL.RENDERBUFFER_DEPTH_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of depth component
  [GL.RENDERBUFFER_STENCIL_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of stencil component

  // When using a WebGL 2 context, the following value is available
  [GL.RENDERBUFFER_SAMPLES]: {webgl2: 1}
};

const SAMPLER_PARAMETERS = {
  [GL.TEXTURE_MAG_FILTER]: {webgl2: true}, // texture magnification filter
  [GL.TEXTURE_MIN_FILTER]: {webgl2: true}, // texture minification filter
  [GL.TEXTURE_WRAP_S]: {webgl2: true}, // texture wrapping function for texture coordinate s
  [GL.TEXTURE_WRAP_T]: {webgl2: true}, // texture wrapping function for texture coordinate t
  [GL.TEXTURE_WRAP_R]: {webgl2: true}, // texture wrapping function for texture coordinate r
  [GL.TEXTURE_BASE_LEVEL]: {webgl2: true}, // Texture mipmap level
  [GL.TEXTURE_MAX_LEVEL]: {webgl2: true}, // Maximum texture mipmap array level
  [GL.TEXTURE_COMPARE_FUNC]: {webgl2: true}, // texture comparison function
  [GL.TEXTURE_COMPARE_MODE]: {webgl2: true}, // texture comparison mode
  [GL.TEXTURE_MIN_LOD]: {webgl2: true}, // minimum level-of-detail value
  [GL.TEXTURE_MAX_LOD]: {webgl2: true}, // maximum level-of-detail value

  [GL.TEXTURE_MAX_ANISOTROPY_EXT]: {webgl2: 'EXT_texture_filter_anisotropic'}
};

// const SHADER_PARAMETERS = [
//   GL.DELETE_STATUS, // GLboolean - whether shader is flagged for deletion.
//   GL.COMPILE_STATUS, // GLboolean - was last shader compilation successful.
//   GL.SHADER_TYPE // GLenum - GL.VERTEX_SHADER or GL.FRAGMENT_SHADER.
// ];

const TEXTURE_PARAMETERS = {
  // WEBGL1
  [GL.TEXTURE_MAG_FILTER]: {type: 'GLenum', webgl1: GL.LINEAR}, // texture magnification filter
  [GL.TEXTURE_MIN_FILTER]: {type: 'GLenum', webgl1: GL.NEAREST_MIPMAP_LINEAR}, // minification filt.
  [GL.TEXTURE_WRAP_S]: {type: 'GLenum', webgl1: GL.REPEAT}, // texture wrapping for coordinate s
  [GL.TEXTURE_WRAP_T]: {type: 'GLenum', webgl1: GL.REPEAT}, // texture wrapping for texture t

  // WEBGL2
  [GL.TEXTURE_WRAP_R]: {type: 'GLenum', webgl2: GL.REPEAT}, // texture wrapping for texture r
  [GL.TEXTURE_BASE_LEVEL]: {webgl2: 0}, // Texture mipmap level
  [GL.TEXTURE_MAX_LEVEL]: {webgl2: 1000}, // Maximum texture mipmap array level
  [GL.TEXTURE_COMPARE_FUNC]: {type: 'GLenum', webgl2: GL.LEQUAL}, // texture comparison function
  [GL.TEXTURE_COMPARE_MODE]: {type: 'GLenum', webgl2: GL.NONE}, // texture comparison mode
  [GL.TEXTURE_MIN_LOD]: {webgl2: -1000}, // minimum level-of-detail value
  [GL.TEXTURE_MAX_LOD]: {webgl2: 1000}, // maximum level-of-detail value

  // WebGL Extensions
  [GL.TEXTURE_MAX_ANISOTROPY_EXT]: {webgl1: 1.0, extension: 'EXT_texture_filter_anisotropic'},

  // Emulated parameters - These OpenGL parameters are not supported by OpenGL ES
  [GL.TEXTURE_WIDTH]: {webgl1: 0},
  [GL.TEXTURE_HEIGHT]: {webgl1: 0}
};

export function installParameterDefinitions() {
  Buffer.PARAMETERS = BUFFER_PARAMETERS;
  FenceSync.PARAMETERS = FENCE_SYNC_PARAMETERS;
  Framebuffer.ATTACHMENT_PARAMETERS = FRAMEBUFFER_ATTACHMENT_PARAMETERS;
  Framebuffer.STATUS = FRAMEBUFFER_STATUS;
  Program.PARAMETERS = PROGRAM_PARAMETERS;
  Renderbuffer.PARAMETERS = RENDERBUFFER_PARAMETERS;
  Sampler.PARAMETERS = SAMPLER_PARAMETERS;
  // Shader.PARAMETERS = SHADER_PARAMETERS;
  Texture.PARAMETERS = TEXTURE_PARAMETERS;
}
