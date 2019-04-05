import test from 'tape-catch';
import {phonglighting} from '@luma.gl/shadertools';

test('shadertools#phonglighting', t => {
  let uniforms = phonglighting.getUniforms();
  t.deepEqual(uniforms, {}, `Default phong lighting uniforms ok`);

  uniforms = phonglighting.getUniforms({
    material: {ambient: 0.0, diffuse: 0.0, shininess: 0.0, specularColor: 0.0}
  });
  t.equal(uniforms.lighting_uEnabled, undefined, `Not enable lighting flag with only material`);

  uniforms = phonglighting.getUniforms({
    material: null
  });
  t.equal(uniforms.lighting_uEnabled, false, 'Disable lighting without material');

  t.end();
});
