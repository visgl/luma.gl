// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/core/test/adapter/resources/texture.spec.ts',
    '../../modules/core/test/adapter/resources/webgpu-cpu-hotspots.spec.ts',
    '!../../modules/core/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
