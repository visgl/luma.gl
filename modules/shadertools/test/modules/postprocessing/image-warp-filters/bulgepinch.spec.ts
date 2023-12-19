import {bulgePinch, normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('bulgePinch#build/uniform', (t) => {
  normalizeShaderModule(bulgePinch);
  const uniforms = bulgePinch.getUniforms();

  t.ok(uniforms, 'bulgePinch module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'bulgePinch center uniform is ok');
  t.equal(uniforms.radius, 200, 'bulgePinch radius uniform is ok');
  t.equal(uniforms.strength, 0.5, 'bulgePinch strength uniform is ok');
  t.end();
});
