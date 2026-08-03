// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {persistenceEffect} from '@luma.gl/effects';
import test from 'test/utils/vitest-tape';

test('persistenceEffect#bindings', t => {
  t.deepEqual(
    persistenceEffect.bindingLayout,
    [{name: 'persistenceTexture', group: 0}],
    'declares the frame-history texture binding'
  );
  t.end();
});
