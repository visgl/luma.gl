import {default as warp} from '@luma.gl/effects/shader-modules/warp-filters/warp';

import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-catch';

test('warp#build', t => {
  normalizeShaderModule(warp);

  t.ok(warp.fs, 'warp module fs is ok');
  t.end();
});
