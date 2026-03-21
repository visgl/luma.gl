// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {phongMaterial} from '@luma.gl/shadertools';
import type {TapeTestFunction} from '@luma.gl/devtools-extensions/tape-test-utils';

export function registerPhongMaterialTests(test: TapeTestFunction): void {
  test('shadertools#phongMaterial', t => {
    let uniforms = phongMaterial.getUniforms({});
    t.deepEqual(uniforms, phongMaterial.defaultUniforms, 'Default phong lighting uniforms ok');

    uniforms = phongMaterial.getUniforms({
      ambient: 0.0,
      diffuse: 0.0,
      shininess: 0.0,
      specularColor: [255, 0, 0]
    });
    t.is(uniforms.ambient, 0, 'ambient');
    t.is(uniforms.diffuse, 0, 'diffuse');
    t.is(uniforms.shininess, 0, 'shininess');
    t.deepEqual(uniforms.specularColor, [1, 0, 0], 'specularColor');

    uniforms = phongMaterial.getUniforms({});
    t.equal(uniforms.ambient, 0.35, 'ambient');
    t.equal(uniforms.diffuse, 0.6, 'diffuse');
    t.equal(uniforms.shininess, 32, 'shininess');
    t.deepEqual(uniforms.specularColor, [0.15, 0.15, 0.15], 'specularColor');
    t.ok(phongMaterial.defines?.LIGHTING_FRAGMENT, 'phongMaterial enables fragment lighting');

    t.end();
  });
}
