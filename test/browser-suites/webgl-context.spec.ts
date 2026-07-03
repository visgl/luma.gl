// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/webgl/test/context/**/*.spec.ts',
    '../../modules/webgl/test/utils/**/*.spec.ts',
    '!../../modules/webgl/test/context/**/*.node.spec.ts'
  ],
  {eager: true}
);
