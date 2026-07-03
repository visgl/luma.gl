// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/engine/test/application-utils/**/*.spec.ts',
    '../../modules/engine/test/debug/**/*.spec.ts',
    '../../modules/engine/test/geometry/**/*.spec.ts',
    '../../modules/engine/test/scenegraph/**/*.spec.ts',
    '../../modules/engine/test/shader-inputs.spec.ts',
    '../../modules/engine/test/utils/**/*.spec.ts',
    '!../../modules/engine/test/**/*.node.spec.ts',
    '!../../modules/engine/test/geometry/gpu-geometry.spec.ts'
  ],
  {eager: true}
);
