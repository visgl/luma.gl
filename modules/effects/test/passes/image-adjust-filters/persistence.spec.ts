// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {persistenceEffect} from '@luma.gl/effects';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('persistenceEffect#bindings', t => {
  t.deepEqual(
    persistenceEffect.bindingLayout,
    [{name: 'persistenceTexture', group: 0}],
    'declares the frame-history texture binding'
  );
  t.end();
});
