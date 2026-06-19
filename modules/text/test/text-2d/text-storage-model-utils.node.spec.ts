// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {applyPreparedTextStorageState} from '../../src/text-2d/model-utils/text-storage-model-utils';

test('applyPreparedTextStorageState preserves Model render props', t => {
  const target = {
    source: 'assembled source',
    shaderLayout: {attributes: [], bindings: []},
    bindings: {existingBinding: {}},
    vertexCount: 6,
    glyphCount: 0
  };

  applyPreparedTextStorageState(target, {
    destroy: () => {},
    source: 'raw source',
    shaderLayout: {attributes: [{name: 'raw'}], bindings: []},
    bindings: {rawBinding: {}},
    vertexCount: 0,
    glyphCount: 12
  });

  t.equal(target.source, 'assembled source', 'raw shader source is not copied over the model');
  t.deepEqual(
    target.shaderLayout,
    {attributes: [], bindings: []},
    'shader layout remains model-owned'
  );
  t.deepEqual(target.bindings, {existingBinding: {}}, 'bindings remain model-owned');
  t.equal(target.vertexCount, 6, 'draw counts remain model-owned');
  t.equal(target.glyphCount, 12, 'prepared storage metrics are copied');
  t.end();
});
