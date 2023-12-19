import {ink, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('ink#build/uniform', (t) => {
  normalizeShaderModule(ink);
  const uniforms = ink.getUniforms();

  t.ok(uniforms, 'ink module build is ok');
  t.equal(uniforms.strength, 0.25, 'ink strength uniform is ok');
  t.end();
});
