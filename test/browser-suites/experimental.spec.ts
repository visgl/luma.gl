// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/experimental/test/**/*.spec.ts',
    '!../../modules/experimental/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
