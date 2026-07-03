// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/shadertools/test/modules/math/**/*.spec.ts',
    '../../modules/shadertools/test/modules/utils/**/*.spec.ts',
    '../../modules/shadertools/test/modules/modules.spec.ts',
    '!../../modules/shadertools/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
