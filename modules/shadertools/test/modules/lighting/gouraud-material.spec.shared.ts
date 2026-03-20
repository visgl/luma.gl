// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UniformValue} from '@luma.gl/core';
import {gouraudMaterial} from '@luma.gl/shadertools';
import type {TapeTestFunction} from 'test/utils/vitest-tape';

export function registerGouraudMaterialTests(test: TapeTestFunction): void {
  test('shadertools#gouraudMaterial', t => {
    let uniforms: Record<string, UniformValue | any> = gouraudMaterial.getUniforms?.({})!;
    t.deepEqual(uniforms, gouraudMaterial.defaultUniforms, 'Default phong lighting uniforms ok');

    uniforms = gouraudMaterial.getUniforms?.({
      ambient: 0.0,
      diffuse: 0.0,
      shininess: 0.0,
      specularColor: [255, 0, 0]
    })!;
    t.is(uniforms.ambient, 0, 'ambient');
    t.is(uniforms.diffuse, 0, 'diffuse');
    t.is(uniforms.shininess, 0, 'shininess');
    t.deepEqual(uniforms.specularColor, [1, 0, 0], 'specularColor');

    uniforms = gouraudMaterial.getUniforms?.({})!;
    t.equal(uniforms.ambient, 0.35, 'ambient');
    t.equal(uniforms.diffuse, 0.6, 'diffuse');
    t.equal(uniforms.shininess, 32, 'shininess');
    t.deepEqual(uniforms.specularColor, [0.15, 0.15, 0.15], 'specularColor');
    t.ok(gouraudMaterial.defines?.LIGHTING_VERTEX, 'gouraudMaterial enables vertex lighting');

    t.end();
  });
}
