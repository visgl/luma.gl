// luma.gl
// SPDX-License-Identifier: MIT

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {DynamicTexture} from '../../src/index';

// Verify that specifying mipLevels: 0 is clamped to at least 1
// See issue or commit reference for details.
test('DynamicTexture#mipLevels clamped to minimum 1', async t => {
  const device = await getWebGLTestDevice();
  const texture = new DynamicTexture(device, {
    data: {data: new Uint8Array(4), width: 1, height: 1},
    mipLevels: 0
  });
  await texture.ready;
  t.is(texture.texture.mipLevels, 1, 'mipLevels set to 1 when specified as 0');
  texture.destroy();
  t.end();
});
