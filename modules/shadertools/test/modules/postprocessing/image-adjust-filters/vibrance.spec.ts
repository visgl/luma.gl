import {vibrance, getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('vibrance#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(vibrance, {}, {});

  t.ok(uniforms, 'vibrance module build is ok');
  t.equal(uniforms.amount, 0, 'vibrance amount uniform is ok');
  t.end();
});
