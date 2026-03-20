// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {_warp as warp} from '@luma.gl/effects';
import test from 'test/utils/vitest-tape';

test('warp#build', t => {
  t.ok(warp.fs, 'warp module fs is ok');
  t.end();
});
