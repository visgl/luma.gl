// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getTestDevices} from '@luma.gl/test-utils';

// import {luma} from '@luma.gl/core';

// TODO - add full reference table, more exhaustive test
it('Device#isTextureFormatCompressed', async () => {
  for (const device of await getTestDevices()) {
    expect(device.isTextureFormatCompressed('rgba8unorm'), '').toBe(false);
    expect(device.isTextureFormatCompressed('bc3-rgba-unorm'), '').toBe(true);
  }
  void 0;
});
