// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  [
    '../../modules/core/test/**/*.spec.ts',
    '!../../modules/core/test/**/*.node.spec.ts',
    '!../../modules/core/test/shadertypes/shader-types.spec.ts'
  ],
  {eager: true}
);
