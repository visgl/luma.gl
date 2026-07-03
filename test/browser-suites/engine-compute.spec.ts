// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/engine/test/compute/**/*.spec.ts',
    '../../modules/engine/test/dynamic-buffer/**/*.spec.ts',
    '../../modules/engine/test/dynamic-texture/**/*.spec.ts',
    '!../../modules/engine/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
