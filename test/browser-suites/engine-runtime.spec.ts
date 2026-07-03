// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/engine/test/animation/**/*.spec.ts',
    '../../modules/engine/test/lib/**/*.spec.ts',
    '../../modules/engine/test/models/**/*.spec.ts',
    '../../modules/engine/test/passes/**/*.spec.ts',
    '!../../modules/engine/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
