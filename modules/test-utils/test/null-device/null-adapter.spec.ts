// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

test('NullAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const testUtilsModule = await import('../../src/index');

  t.equal(testUtilsModule.nullAdapter.type, 'null', 'exports a null adapter instance');
  t.equal(testUtilsModule.NullDevice.name, 'NullDevice', 'exports the null device class');
});
