import {swirl, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('swirl#build/uniform', (t) => {
  normalizeShaderModule(swirl);
  const uniforms = swirl.getUniforms();

  t.ok(uniforms, 'swirl module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'swirl center uniform is ok');
  t.equal(uniforms.radius, 200, 'swirl radius uniform is ok');
  t.equal(uniforms.angle, 3, 'swirl angle uniform is ok');
  t.end();
});
