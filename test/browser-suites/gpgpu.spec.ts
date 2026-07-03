// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  ['../../modules/gpgpu/test/**/*.spec.ts', '!../../modules/gpgpu/test/**/*.node.spec.ts'],
  {eager: true}
);
