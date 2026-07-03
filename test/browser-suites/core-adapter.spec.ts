// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/core/test/adapter-utils/**/*.spec.ts',
    '../../modules/core/test/adapter/*.spec.ts',
    '../../modules/core/test/adapter/device-helpers/**/*.spec.ts',
    '../../modules/core/test/adapter/helpers/**/*.spec.ts',
    '!../../modules/core/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
