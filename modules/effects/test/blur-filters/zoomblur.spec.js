import {zoomBlur} from '@luma.gl/effects';
import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-catch';

test('zoomBlur#build/uniform', t => {
  normalizeShaderModule(zoomBlur);
  const uniforms = zoomBlur.getUniforms();

  t.ok(uniforms, 'zoomBlur module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'zoomBlur center uniform is ok');
  t.equal(uniforms.strength, 0.3, 'zoomBlur strength uniform is ok');
  t.end();
});
