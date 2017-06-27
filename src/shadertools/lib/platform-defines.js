import {getContextInfo} from '../../webgl';

export function checkRendererVendor(debugInfo, gpuVendor) {
  const {vendor, renderer} = debugInfo;
  let result;
  switch (gpuVendor) {
  case 'nvidia':
    result = vendor.match(/NVIDIA/i) || renderer.match(/NVIDIA/i);
    break;
  case 'intel':
    result = vendor.match(/INTEL/i) || renderer.match(/INTEL/i);
    break;
  case 'amd':
    result =
      vendor.match(/AMD/i) || renderer.match(/AMD/i) ||
      vendor.match(/ATI/i) || renderer.match(/ATI/i);
    break;
  default:
    result = false;
  }
  return result;
}

export function getPlatformShaderDefines(gl) {
  /* eslint-disable */
  let platformDefines = '';
  const debugInfo = getContextInfo(gl);

  if (checkRendererVendor(debugInfo, 'nvidia')) {
    platformDefines += `\
#define NVIDIA_GPU
#define NVIDIA_FP64_WORKAROUND 1
#define NVIDIA_EQUATION_WORKAROUND 1
`;
  } else if (checkRendererVendor(debugInfo, 'intel')) {
    platformDefines += `\
#define INTEL_GPU
#define INTEL_FP64_WORKAROUND 1
#define NVIDIA_EQUATION_WORKAROUND 1\n \
#define INTEL_TAN_WORKAROUND 1
`;
  } else if (checkRendererVendor(debugInfo, 'amd')) {
    platformDefines += `\
#define AMD_GPU
`;
  } else {
    platformDefines += `\
#define DEFAULT_GPU
`;
  }

  return platformDefines;
}

export const VERSION_DEFINES = `\
// Defines for shader portability
#if (__VERSION__ > 120)
# define attribute in
# define varying out
#else
# define in attribute
# define out varying
#endif // __VERSION

// FRAG_DEPTH => gl_FragDepth is available
#ifdef GL_EXT_frag_depth
#extension GL_EXT_frag_depth : enable
# define FRAG_DEPTH
# define gl_FragDepth gl_FragDepthEXT
#endif
#if (__VERSION__ > 120)
# define FRAG_DEPTH
#endif

// DERIVATIVES => dxdF, dxdY and fwidth are available
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
# define DERIVATIVES
#endif
#if (__VERSION__ > 120)
# define DERIVATIVES
#endif

// DRAW_BUFFERS => gl_FragData[] is available
#ifdef GL_EXT_draw_buffers
#extension GL_EXT_draw_buffers : require
#define DRAW_BUFFERS
#endif
#if (__VERSION__ > 120)
# define DRAW_BUFFERS
#endif

// TEXTURE_LOD => texture2DLod etc are available
#ifdef GL_EXT_shader_texture_lod
#extension GL_EXT_shader_texture_lod : enable
# define TEXTURE_LOD
#define texture2DLod texture2DLodEXT
#define texture2DProjLod texture2DProjLodEXT
#define texture2DProjLod texture2DProjLodEXT
#define textureCubeLod textureCubeLodEXT
#define texture2DGrad texture2DGradEXT
#define texture2DProjGrad texture2DProjGradEXT
#define texture2DProjGrad texture2DProjGradEXT
#define textureCubeGrad textureCubeGradEXT
#endif
#if (__VERSION__ > 120)
# define TEXTURE_LOD
#endif

// Some common constants
#define EPSILON 1e-6
`;
