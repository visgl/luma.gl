// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/core/test/factories/**/*.spec.ts',
    '../../modules/core/test/portable/**/*.spec.ts',
    '../../modules/core/test/shadertypes/**/*.spec.ts',
    '../../modules/core/test/utils/**/*.spec.ts',
    '!../../modules/core/test/**/*.node.spec.ts',
    '!../../modules/core/test/shadertypes/shader-types.spec.ts'
  ],
  {eager: true}
);
