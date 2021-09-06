import test from 'tape-promise/tape';
import {phongLighting} from '@luma.gl/shadertools';

test('shadertools#phongLighting', (t) => {
  let uniforms = phongLighting.getUniforms();
  t.deepEqual(uniforms, {}, `Default phong lighting uniforms ok`);

  uniforms = phongLighting.getUniforms({
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

  uniforms = phongLighting.getUniforms({
    material: null
  });
  t.equal(uniforms.lighting_uEnabled, false, 'Disable lighting without material');

  uniforms = phongLighting.getUniforms({
    material: true
  });
  t.equal(uniforms.lighting_uAmbient, 0.35, `lighting_uAmbient`);
  t.equal(uniforms.lighting_uDiffuse, 0.6, `lighting_uDiffuse`);
  t.equal(uniforms.lighting_uShininess, 32, `lighting_uShininess`);
  t.deepEqual(
    uniforms.lighting_uSpecularColor,
    [30 / 255, 30 / 255, 30 / 255],
    `lighting_uSpecularColor`
  );

  t.end();
});
