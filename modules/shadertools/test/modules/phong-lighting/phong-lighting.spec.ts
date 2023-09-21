import test from 'tape-promise/tape';
import {phongLighting} from '@luma.gl/shadertools';

test.skip('shadertools#phongLighting', (t) => {
  let uniforms = phongLighting.getUniforms({});
  t.deepEqual(uniforms, {}, 'Default phong lighting uniforms ok');

  uniforms = phongLighting.getUniforms({ambient: 0.0, diffuse: 0.0, shininess: 0.0, specularColor: [255, 0, 0]});
  // t.equal(
  //   uniforms.enabled,
  //   undefined,
  //   'Does not enable lighting flag with only material'
  // );
  t.is(uniforms.ambient, 0, 'ambient');
  t.is(uniforms.diffuse, 0, 'diffuse');
  t.is(uniforms.shininess, 0, 'shininess');
  t.deepEqual(uniforms.specularColor, [1, 0, 0], 'specularColor');

  // uniforms = phongLighting.getUniforms({
  //   material: null
  // });

  // t.equal(uniforms.enabled, false, 'Disable lighting without material');

  uniforms = phongLighting.getUniforms({});
  t.equal(uniforms.ambient, 0.35, 'ambient');
  t.equal(uniforms.diffuse, 0.6, 'diffuse');
  t.equal(uniforms.shininess, 32, 'shininess');
  t.deepEqual(
    uniforms.specularColor,
    [30 / 255, 30 / 255, 30 / 255],
    'specularColor'
  );

  t.end();
});
