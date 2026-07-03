// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  ['../../modules/constants/test/**/*.spec.ts', '!../../modules/constants/test/**/*.node.spec.ts'],
  {eager: true}
);
