// luma.gl, MIT license
// Copyright (c) vis.gl contributors
import { glsl } from '../glsl-utils/highlight';
/** Adds defines to help identify GPU architecture / platform */
export function getPlatformShaderDefines(platformInfo) {
    switch (platformInfo?.gpu.toLowerCase()) {
        case 'apple':
            return glsl `\
#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;
        case 'nvidia':
            return glsl `\
#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;
        case 'intel':
            return glsl `\
#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;
        case 'amd':
            // AMD Does not eliminate fp64 code
            return glsl `\
#define AMD_GPU
`;
        default:
            // We don't know what GPU it is, could be that the GPU driver or
            // browser is not implementing UNMASKED_RENDERER constant and not
            // reporting a correct name
            return glsl `\
#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;
    }
}
/** Adds defines to let shaders portably v1/v3 check for features */
export function getVersionDefines(platformInfo) {
    let versionDefines = '';
    if (platformInfo.features.has('webgl2')) {
        versionDefines += glsl `\
# define FEATURE_GLSL_DERIVATIVES
# define FEATURE_GLSL_DRAW_BUFFERS
# define FEATURE_GLSL_FRAG_DEPTH
# define FEATURE_GLSL_TEXTURE_LOD
`;
    }
    if (!platformInfo.features.has('webgl2')) {
        if (platformInfo.features.has('glsl-frag-depth')) {
            versionDefines += glsl `\

// FEATURE_GLSL_FRAG_DEPTH => gl_FragDepth is available
#ifdef GL_EXT_frag_depth
# extension GL_EXT_frag_depth : enable
# define FEATURE_GLSL_FRAG_DEPTH
# define FRAG_DEPTH
# define gl_FragDepth gl_FragDepthEXT
#endif
`;
        }
        if (platformInfo?.features.has('glsl-derivatives')) {
            versionDefines += glsl `\

// FEATURE_GLSL_DERIVATIVES => dxdF, dxdY and fwidth are available
#if defined(GL_OES_standard_derivatives) || defined(FEATURE_GLSL_DERIVATIVES)
# extension GL_OES_standard_derivatives : enable
# define FEATURE_GLSL_DERIVATIVES
#endif
`;
        }
        if (platformInfo?.features.has('glsl-frag-data')) {
            versionDefines += glsl `\

// FEATURE_GLSL_DRAW_BUFFERS => gl_FragData[] is available
#ifdef GL_EXT_draw_buffers
# extension GL_EXT_draw_buffers : require
# define FEATURE_GLSL_DRAW_BUFFERS
#endif
`;
        }
        if (platformInfo?.features.has('glsl-texture-lod')) {
            versionDefines += glsl `\
// TEXTURE_LOD => texture2DLod etc are available
#ifdef GL_EXT_shader_texture_lod
# extension GL_EXT_shader_texture_lod : enable
# define FEATURE_GLSL_TEXTURE_LOD
# define TEXTURE_LOD
#endif
`;
        }
    }
    return versionDefines;
}
