// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/geoarrow/test/**/*.spec.ts', '!../../modules/geoarrow/test/**/*.node.spec.ts'],
  {eager: true}
);
