import test from 'tape-promise/tape';
import {checkType} from '@luma.gl/test-utils';

import {lighting, ShaderModule} from '@luma.gl/shadertools';

checkType<ShaderModule>(lighting);

test('shadertools#lighting', (t) => {
  let uniforms = lighting.getUniforms({});
  t.ok(uniforms, 'Generated default uniforms');

  uniforms = lighting.getUniforms({
    // @ts-ignore
    lights: [{type: 'ambient'}, {type: 'directional'}, {type: 'point'}]
  });
  t.ok(uniforms, 'Generated uniforms for empty lighting');

  uniforms = lighting.getUniforms({
    // @ts-ignore
    lights: [{type: 'non-existing'}]
  });
  t.ok(uniforms, 'Generated uniforms for non-supported light object');

  t.end();
});
