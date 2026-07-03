// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/gpgpu/test/**/*.spec.ts', '!../../modules/gpgpu/test/**/*.node.spec.ts'],
  {eager: true}
);
