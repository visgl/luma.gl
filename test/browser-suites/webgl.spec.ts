// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  [
    '../../modules/webgl/test/**/*.spec.ts',
    '!../../modules/webgl/test/**/*.node.spec.ts',
    '!../../modules/webgl/test/**/wip/**/*.spec.ts',
    '!../../modules/webgl/test/adapter/helpers/get-shader-layout.spec.ts'
  ],
  {eager: true}
);
