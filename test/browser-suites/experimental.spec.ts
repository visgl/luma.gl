// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  [
    '../../modules/experimental/test/**/*.spec.ts',
    '!../../modules/experimental/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
