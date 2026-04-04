// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UniformValue} from '@luma.gl/core';
import {gouraudMaterial} from '@luma.gl/shadertools';
import type {TapeTestFunction} from '@luma.gl/devtools-extensions/tape-test-utils';

export function registerGouraudMaterialTests(test: TapeTestFunction): void {
  test('shadertools#gouraudMaterial', t => {
    let uniforms: Record<string, UniformValue | any> = gouraudMaterial.getUniforms?.({})!;
    t.deepEqual(uniforms, gouraudMaterial.defaultUniforms, 'Default phong lighting uniforms ok');

    uniforms = gouraudMaterial.getUniforms?.({
      unlit: true,
      ambient: 0.0,
      diffuse: 0.0,
      shininess: 0.0,
      specularColor: [255, 0, 0]
    })!;
    t.is(uniforms.unlit, true, 'unlit');
    t.is(uniforms.ambient, 0, 'ambient');
    t.is(uniforms.diffuse, 0, 'diffuse');
    t.is(uniforms.shininess, 0, 'shininess');
    t.deepEqual(uniforms.specularColor, [255, 0, 0], 'specularColor');

    uniforms = gouraudMaterial.getUniforms?.({})!;
    t.equal(uniforms.unlit, false, 'unlit');
    t.equal(uniforms.ambient, 0.35, 'ambient');
    t.equal(uniforms.diffuse, 0.6, 'diffuse');
    t.equal(uniforms.shininess, 32, 'shininess');
    t.deepEqual(uniforms.specularColor, [38.25, 38.25, 38.25], 'specularColor');
    t.ok(gouraudMaterial.defines?.LIGHTING_VERTEX, 'gouraudMaterial enables vertex lighting');

    uniforms = gouraudMaterial.getUniforms?.({
      specularColor: [2, 1, 0.5]
    })!;
    t.deepEqual(uniforms.specularColor, [2, 1, 0.5], 'float specular colors pass through');
    t.notOk(
      'useByteColors' in gouraudMaterial.uniformTypes,
      'gouraudMaterial no longer owns useByteColors'
    );
    t.ok(
      gouraudMaterial.dependencies?.some(module => module.name === 'floatColors'),
      'gouraudMaterial depends on floatColors'
    );
    t.ok(
      gouraudMaterial.vs?.includes('floatColors_normalize(material.specularColor)'),
      'vertex shader normalizes specularColor through floatColors'
    );
    t.ok(
      gouraudMaterial.source?.includes('floatColors_normalize(gouraudMaterial.specularColor)'),
      'WGSL shader normalizes specularColor through floatColors'
    );

    t.end();
  });
}
