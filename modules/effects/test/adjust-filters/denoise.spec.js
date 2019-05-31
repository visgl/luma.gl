import {denoise} from '@luma.gl/effects';
import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-catch';

test('denoise#build/uniform', t => {
  normalizeShaderModule(denoise);
  const uniforms = denoise.getUniforms();

  t.ok(uniforms, 'denoise module build is ok');
  t.equal(uniforms.strength, 0.5, 'denoise strength uniform is ok');
  t.end();
});
