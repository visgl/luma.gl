// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/shadertools/test/lib/**/*.spec.ts',
    '!../../modules/shadertools/test/**/*.node.spec.ts',
    '!../../modules/shadertools/test/lib/uniform-types.spec.ts'
  ],
  {eager: true}
);
