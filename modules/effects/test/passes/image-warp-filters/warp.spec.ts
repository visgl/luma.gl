// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {_warp as warp} from '@luma.gl/effects';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('warp#build', t => {
  t.ok(warp.fs, 'warp module fs is ok');
  t.end();
});
