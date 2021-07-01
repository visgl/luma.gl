import {noise, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('noise#build/uniform', (t) => {
  normalizeShaderModule(noise);
  const uniforms = noise.getUniforms();

  t.ok(uniforms, 'noise module build is ok');
  t.equal(uniforms.amount, 0.5, 'noise amount uniform is ok');
  t.end();
});
