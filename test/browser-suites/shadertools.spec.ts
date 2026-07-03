// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  [
    '../../modules/shadertools/test/**/*.spec.ts',
    '!../../modules/shadertools/test/**/*.node.spec.ts',
    '!../../modules/shadertools/test/lib/uniform-types.spec.ts',
    '!../../modules/shadertools/test/modules/lighting/dirlight.spec.ts'
  ],
  {eager: true}
);
