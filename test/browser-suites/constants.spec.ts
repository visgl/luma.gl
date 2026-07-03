// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/constants/test/**/*.spec.ts', '!../../modules/constants/test/**/*.node.spec.ts'],
  {eager: true}
);
