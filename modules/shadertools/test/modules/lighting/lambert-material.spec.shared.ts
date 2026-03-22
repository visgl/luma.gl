// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {lambertMaterial} from '@luma.gl/shadertools';
import type {TapeTestFunction} from '@luma.gl/devtools-extensions/tape-test-utils';

export function registerLambertMaterialTests(test: TapeTestFunction): void {
  test('shadertools#lambertMaterial', t => {
    let uniforms = lambertMaterial.getUniforms({});
    t.deepEqual(uniforms, lambertMaterial.defaultUniforms, 'Default lambert lighting uniforms ok');

    uniforms = lambertMaterial.getUniforms({
      unlit: true,
      ambient: 0.0,
      diffuse: 0.0
    });
    t.is(uniforms.unlit, true, 'unlit');
    t.is(uniforms.ambient, 0, 'ambient');
    t.is(uniforms.diffuse, 0, 'diffuse');

    uniforms = lambertMaterial.getUniforms({});
    t.equal(uniforms.unlit, false, 'unlit');
    t.equal(uniforms.ambient, 0.35, 'ambient');
    t.equal(uniforms.diffuse, 0.6, 'diffuse');
    t.ok(lambertMaterial.defines?.LIGHTING_FRAGMENT, 'lambertMaterial enables fragment lighting');

    t.end();
  });
}
