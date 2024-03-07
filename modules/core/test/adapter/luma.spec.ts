// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {NullDevice} from '@luma.gl/test-utils';
import {luma} from '@luma.gl/core';

test('luma#attachDevice', async t => {
  const device = await luma.attachDevice({handle: null, devices: [NullDevice]});
  t.equal(device.type, 'unknown', 'info.vendor ok');
  t.equal(device.info.vendor, 'no one', 'info.vendor ok');
  t.equal(device.info.renderer, 'none', 'info.renderer ok');
  t.end();
});
