// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/arrow/test/**/*.spec.ts',
    '!../../modules/arrow/test/**/*.node.spec.ts',
    '!../../modules/arrow/test/arrow/arrow-column-info.spec.ts',
    '!../../modules/arrow/test/arrow/get-arrow-data.spec.ts'
  ],
  {eager: true}
);
