import {sepia, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('sepia#build/uniform', (t) => {
  normalizeShaderModule(sepia);
  const uniforms = sepia.getUniforms();

  t.ok(uniforms, 'sepia module build is ok');
  t.equal(uniforms.amount, 0.5, 'sepia amount uniform is ok');
  t.end();
});
