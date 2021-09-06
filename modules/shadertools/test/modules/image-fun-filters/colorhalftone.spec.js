import {colorHalftone, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('colorHalftone#build/uniform', (t) => {
  normalizeShaderModule(colorHalftone);
  const uniforms = colorHalftone.getUniforms();

  t.ok(uniforms, 'colorHalftone module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'colorHalftone center uniform is ok');
  t.equal(uniforms.angle, 1.1, 'colorHalftone angle uniform is ok');
  t.equal(uniforms.size, 4, 'colorHalftone size uniform is ok');
  t.end();
});
