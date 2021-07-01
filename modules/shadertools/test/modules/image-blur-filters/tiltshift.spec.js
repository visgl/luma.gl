import {tiltShift, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('tiltShift#build/uniform', (t) => {
  normalizeShaderModule(tiltShift);
  const uniforms = tiltShift.getUniforms();

  t.ok(uniforms, 'tiltShift module build is ok');
  t.equal(uniforms.blurRadius, 15, 'tiltShift blurRadius uniform is ok');
  t.equal(uniforms.gradientRadius, 200, 'tiltShift gradientRadius uniform is ok');
  t.deepEqual(uniforms.start, [0, 0], 'tiltShift start uniform is ok');
  t.deepEqual(uniforms.end, [1, 1], 'tiltShift end uniform is ok');
  t.equal(uniforms.invert, false, 'tiltShift invert uniform is ok');
  t.end();
});
