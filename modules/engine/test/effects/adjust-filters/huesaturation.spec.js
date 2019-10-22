import {hueSaturation} from '@luma.gl/engine';
import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-catch';

test('hueSaturation#build/uniform', t => {
  normalizeShaderModule(hueSaturation);
  const uniforms = hueSaturation.getUniforms();

  t.ok(uniforms, 'hueSaturation module build is ok');
  t.equal(uniforms.hue, 0, 'hueSaturation hue uniform is ok');
  t.equal(uniforms.saturation, 0, 'hueSaturation saturation uniform is ok');
  t.end();
});
