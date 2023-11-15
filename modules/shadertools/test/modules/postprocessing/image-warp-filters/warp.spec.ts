import {_warp as warp} from '@luma.gl/shadertools';

import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('warp#build', (t) => {
  normalizeShaderModule(warp);

  t.ok(warp.fs, 'warp module fs is ok');
  t.end();
});
