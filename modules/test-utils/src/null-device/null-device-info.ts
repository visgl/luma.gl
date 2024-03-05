// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DeviceInfo} from '@luma.gl/core';

export const NullDeviceInfo: DeviceInfo = {
  type: 'webgl',
  gpu: 'software',
  gpuType: 'unknown',
  gpuBackend: 'unknown',
  vendor: '',
  renderer: 'none',
  version: '1.0',
  shadingLanguage: 'glsl' as const,
  shadingLanguageVersion: 300
} as const;
