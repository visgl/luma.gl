import {edgeWork, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('edgeWork#build/uniform', (t) => {
  normalizeShaderModule(edgeWork);
  const uniforms = edgeWork.getUniforms();

  t.ok(uniforms, 'edgeWork module build is ok');
  t.equal(uniforms.radius, 2, 'edgeWork radius uniform is ok');
  t.deepEqual(uniforms.delta, [1, 0], 'edgeWork delta uniform is ok');
  t.end();
});
