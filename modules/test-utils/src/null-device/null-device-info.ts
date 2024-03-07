// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DeviceInfo} from '@luma.gl/core';

export const NullDeviceInfo = {
  type: 'unknown',
  gpu: 'software',
  gpuType: 'unknown',
  gpuBackend: 'unknown',
  vendor: 'no one',
  renderer: 'none',
  version: '1.0',
  shadingLanguage: 'glsl',
  shadingLanguageVersion: 300
} as const satisfies DeviceInfo;
