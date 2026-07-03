// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  ['../../modules/geoarrow/test/**/*.spec.ts', '!../../modules/geoarrow/test/**/*.node.spec.ts'],
  {eager: true}
);
