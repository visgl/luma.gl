// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/effects/test/**/*.spec.ts', '!../../modules/effects/test/**/*.node.spec.ts'],
  {eager: true}
);
