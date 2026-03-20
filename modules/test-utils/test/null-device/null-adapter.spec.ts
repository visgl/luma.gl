// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

test('NullAdapter imports from the ESM package entry without circular init errors', async () => {
  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const testUtilsModule = await import('../../src/index');

  expect(testUtilsModule.nullAdapter.type).toBe('null');
  expect(testUtilsModule.NullDevice.name).toBe('NullDevice');
}, 15000);
