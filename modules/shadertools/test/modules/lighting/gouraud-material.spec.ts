// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {UniformValue} from '@luma.gl/core';
import {gouraudMaterial} from '@luma.gl/shadertools';

test('shadertools#gouraudMaterial', (t) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  let uniforms: Record<string, UniformValue> = gouraudMaterial.getUniforms?.({})!;
  t.deepEqual(uniforms, gouraudMaterial.defaultUniforms, 'Default phong lighting uniforms ok');

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  uniforms = gouraudMaterial.getUniforms?.({ambient: 0.0, diffuse: 0.0, shininess: 0.0, specularColor: [255, 0, 0]})!;
  // t.equal(
  //   uniforms.enabled,
  //   undefined,
  //   'Does not enable lighting flag with only material'
  // );
  t.is(uniforms.ambient, 0, 'ambient');
  t.is(uniforms.diffuse, 0, 'diffuse');
  t.is(uniforms.shininess, 0, 'shininess');
  t.deepEqual(uniforms.specularColor, [255, 0, 0], 'specularColor');

  // uniforms = gouraudMaterial.getUniforms({
  //   material: null
  // });

  // t.equal(uniforms.enabled, false, 'Disable lighting without material');

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  uniforms = gouraudMaterial.getUniforms?.({})!;
  t.equal(uniforms.ambient, 0.35, 'ambient');
  t.equal(uniforms.diffuse, 0.6, 'diffuse');
  t.equal(uniforms.shininess, 32, 'shininess');
  // t.deepEqual(
  //   uniforms.specularColor,
  //   [30 / 255, 30 / 255, 30 / 255],
  //   'specularColor'
  // );

  t.end();
});
