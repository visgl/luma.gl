// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/webgpu/test/**/*.spec.ts', '!../../modules/webgpu/test/**/*.node.spec.ts'],
  {eager: true}
);
