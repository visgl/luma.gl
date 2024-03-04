// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {random} from '@luma.gl/shadertools';

test('random#build', t => {
  t.ok(random.fs, 'random module fs is ok');
  t.end();
});
