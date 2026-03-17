// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

test('NullAdapter imports from the ESM package entry without circular init errors', async t => {
  const testUtilsModule = await import('@luma.gl/test-utils');

  t.equal(testUtilsModule.nullAdapter.type, 'null', 'exports a null adapter instance');
  t.equal(testUtilsModule.NullDevice.name, 'NullDevice', 'exports the null device class');

  t.end();
});
