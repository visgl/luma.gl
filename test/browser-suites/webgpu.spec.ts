// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  ['../../modules/webgpu/test/**/*.spec.ts', '!../../modules/webgpu/test/**/*.node.spec.ts'],
  {eager: true}
);
