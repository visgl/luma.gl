import {default as random} from '@luma.gl/engine/effects/shader-modules/utils/random';

import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-catch';

test('random#build', t => {
  normalizeShaderModule(random);

  t.ok(random.fs, 'random module fs is ok');
  t.end();
});
