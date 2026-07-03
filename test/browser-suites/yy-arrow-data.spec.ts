// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import.meta.glob(
  [
    '../../modules/arrow/test/**/*.spec.ts',
    '../../modules/geoarrow/test/**/*.spec.ts',
    '../../modules/tables/test/**/*.spec.ts',
    '../../modules/text/test/**/*.spec.ts',
    '!../../modules/**/test/**/*.node.spec.ts',
    '!../../modules/**/test/**/wip/**/*.spec.ts',
    '!../../modules/arrow/test/arrow/arrow-column-info.spec.ts',
    '!../../modules/arrow/test/arrow/get-arrow-data.spec.ts'
  ],
  {eager: true}
);
