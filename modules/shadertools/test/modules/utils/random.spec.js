import {random} from '@luma.gl/shadertools';

import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('random#build', (t) => {
  normalizeShaderModule(random);

  t.ok(random.fs, 'random module fs is ok');
  t.end();
});
