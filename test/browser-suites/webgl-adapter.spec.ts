// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/webgl/test/adapter/**/*.spec.ts',
    '!../../modules/webgl/test/adapter/**/*.node.spec.ts',
    '!../../modules/webgl/test/adapter/**/wip/**/*.spec.ts',
    '!../../modules/webgl/test/adapter/helpers/get-shader-layout.spec.ts'
  ],
  {eager: true}
);
