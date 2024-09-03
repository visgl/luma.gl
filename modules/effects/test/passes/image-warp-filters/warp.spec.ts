// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {_warp as warp} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('warp#build', t => {
  t.ok(warp.fs, 'warp module fs is ok');
  t.end();
});
