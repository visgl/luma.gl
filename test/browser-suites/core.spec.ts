// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

// Keep core tests in their own realm because they verify the core resource-stat registry
// before backend packages register additional resource types.
import.meta.glob(
  [
    '../../modules/core/test/**/*.spec.ts',
    '!../../modules/core/test/**/*.node.spec.ts',
    '!../../modules/core/test/**/wip/**/*.spec.ts',
    '!../../modules/core/test/shadertypes/shader-types.spec.ts'
  ],
  {eager: true}
);
