import test from 'tape-catch';
import {phonglighting} from '@luma.gl/shadertools';

test('shadertools#phonglighting', t => {
  let uniforms = phonglighting.getUniforms();
  t.deepEqual(uniforms, {}, `Default phong lighting uniforms ok`);

  uniforms = phonglighting.getUniforms({
    material: {ambient: 0.0, diffuse: 0.0, shininess: 0.0, specularColor: [255, 0, 0]}
  });
  t.equal(
    uniforms.lighting_uEnabled,
    undefined,
    `Does not enable lighting flag with only material`
  );
  t.is(uniforms.lighting_uAmbient, 0, `lighting_uAmbient`);
  t.is(uniforms.lighting_uDiffuse, 0, `lighting_uDiffuse`);
  t.is(uniforms.lighting_uShininess, 0, `lighting_uShininess`);
  t.deepEqual(uniforms.lighting_uSpecularColor, [1, 0, 0], `lighting_uSpecularColor`);

  uniforms = phonglighting.getUniforms({
    material: null
  });
  t.equal(uniforms.lighting_uEnabled, false, 'Disable lighting without material');

  t.end();
});
