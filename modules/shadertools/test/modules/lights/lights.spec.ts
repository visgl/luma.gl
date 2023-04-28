import test from 'tape-promise/tape';
import {checkType} from '@luma.gl/test-utils';

import {lights, ShaderModule} from '@luma.gl/shadertools';

checkType<ShaderModule>(lights);

test('shadertools#lights', (t) => {
  let uniforms = lights.getUniforms();
  t.ok(uniforms, 'Generated default uniforms');

  uniforms = lights.getUniforms({
  // @ts-expect-error
    lights: [{type: 'ambient'}, {type: 'directional'}, {type: 'point'}]
  });
  t.ok(uniforms, 'Generated uniforms for empty lights');

  uniforms = lights.getUniforms({
  // @ts-expect-error
    lights: [{type: 'non-existing'}]
  });
  t.ok(uniforms, 'Generated uniforms for non-supported light object');

  t.end();
});
