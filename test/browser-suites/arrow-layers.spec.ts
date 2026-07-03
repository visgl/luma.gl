// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/arrow-layers/test/**/*.spec.ts',
    '!../../modules/arrow-layers/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
