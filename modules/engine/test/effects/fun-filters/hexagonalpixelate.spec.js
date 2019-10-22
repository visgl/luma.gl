import {hexagonalPixelate} from '@luma.gl/engine';
import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-catch';

test('hexagonalPixelate#build/uniform', t => {
  normalizeShaderModule(hexagonalPixelate);
  const uniforms = hexagonalPixelate.getUniforms();

  t.ok(uniforms, 'hexagonalPixelate module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'hexagonalPixelate center uniform is ok');
  t.equal(uniforms.scale, 10, 'hexagonalPixelate strength uniform is ok');
  t.end();
});
