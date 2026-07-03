// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/shadertools/test/modules/color/**/*.spec.ts',
    '../../modules/shadertools/test/modules/engine/**/*.spec.ts',
    '../../modules/shadertools/test/modules/geospatial/**/*.spec.ts',
    '../../modules/shadertools/test/modules/lighting/**/*.spec.ts',
    '!../../modules/shadertools/test/**/*.node.spec.ts',
    '!../../modules/shadertools/test/modules/lighting/dirlight.spec.ts'
  ],
  {eager: true}
);
