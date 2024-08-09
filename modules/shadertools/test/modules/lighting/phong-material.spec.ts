// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {phongMaterial} from '@luma.gl/shadertools';

test('shadertools#phongMaterial', t => {
  let uniforms = phongMaterial.getUniforms({});
  t.deepEqual(uniforms, phongMaterial.defaultUniforms, 'Default phong lighting uniforms ok');

  uniforms = phongMaterial.getUniforms({
    ambient: 0.0,
    diffuse: 0.0,
    shininess: 0.0,
    specularColor: [255, 0, 0]
  });
  // t.equal(
  //   uniforms.enabled,
  //   undefined,
  //   'Does not enable lighting flag with only material'
  // );
  t.is(uniforms.ambient, 0, 'ambient');
  t.is(uniforms.diffuse, 0, 'diffuse');
  t.is(uniforms.shininess, 0, 'shininess');
  t.deepEqual(uniforms.specularColor, [1, 0, 0], 'specularColor');

  // uniforms = phongMaterial.getUniforms({
  //   material: null
  // });

  // t.equal(uniforms.enabled, false, 'Disable lighting without material');

  uniforms = phongMaterial.getUniforms({});
  t.equal(uniforms.ambient, 0.35, 'ambient');
  t.equal(uniforms.diffuse, 0.6, 'diffuse');
  t.equal(uniforms.shininess, 32, 'shininess');
  t.deepEqual(uniforms.specularColor, [0.15, 0.15, 0.15], 'specularColor');

  t.end();
});
