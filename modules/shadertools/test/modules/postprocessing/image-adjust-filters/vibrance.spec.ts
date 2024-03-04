import {vibrance, ShaderModuleInstance} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('vibrance#build/uniform', t => {
  const vibranceModule = new ShaderModuleInstance(vibrance);
  const uniforms = vibranceModule.getUniforms({}, {});

  t.ok(uniforms, 'vibrance module build is ok');
  t.equal(uniforms.amount, 0, 'vibrance amount uniform is ok');
  t.end();
});
