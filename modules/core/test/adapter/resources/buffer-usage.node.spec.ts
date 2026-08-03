// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, BufferUsage} from '@luma.gl/core';

test('BufferUsage preserves Buffer static aliases', t => {
  for (const name of Object.keys(BufferUsage) as (keyof typeof BufferUsage)[]) {
    t.is(BufferUsage[name], Buffer[name], `${name} alias matches`);
  }
  t.end();
});
