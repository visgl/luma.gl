import {vignette, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('vignette#build/uniform', (t) => {
  normalizeShaderModule(vignette);
  const uniforms = vignette.getUniforms();

  t.ok(uniforms, 'vignette module build is ok');
  t.equal(uniforms.radius, 0.5, 'vignette radius uniform is ok');
  t.equal(uniforms.amount, 0.5, 'vignette amount uniform is ok');
  t.end();
});
