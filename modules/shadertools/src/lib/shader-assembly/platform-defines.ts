// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PlatformInfo} from './platform-info';

/** Adds defines to help identify GPU architecture / platform */
export function getPlatformShaderDefines(platformInfo: PlatformInfo): string {
  switch (platformInfo?.gpu.toLowerCase()) {
    case 'apple':
      return /* glsl */ `\
#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;

    case 'nvidia':
      return /* glsl */ `\
#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;

    case 'intel':
      return /* glsl */ `\
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
      return /* glsl */ `\
#define AMD_GPU
`;

    default:
      // We don't know what GPU it is, could be that the GPU driver or
      // browser is not implementing UNMASKED_RENDERER constant and not
      // reporting a correct name
      return /* glsl */ `\
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
