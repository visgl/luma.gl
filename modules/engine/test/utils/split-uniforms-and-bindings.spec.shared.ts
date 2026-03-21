// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {splitUniformsAndBindings} from '@luma.gl/engine/model/split-uniforms-and-bindings';
import type {TapeTestFunction} from '@luma.gl/devtools-extensions/tape-test-utils';

export function registerSplitUniformsAndBindingsTests(test: TapeTestFunction): void {
  test('splitUniformsAndBindings', t => {
    const mixed: Parameters<typeof splitUniformsAndBindings>[0] = {
      array: [1, 2, 3, 4],
      boolean: true,
      number: 123,
      sampler: {sampler: true} as any,
      texture: {texture: true} as any
    };
    const {bindings, uniforms} = splitUniformsAndBindings(mixed);
    t.deepEquals(Object.keys(bindings), ['sampler', 'texture'], 'bindings correctly extracted');
    t.deepEquals(
      Object.keys(uniforms),
      ['array', 'boolean', 'number'],
      'bindings correctly extracted'
    );
    t.end();
  });

  test('splitUniformsAndBindings respects declared struct uniforms', t => {
    const mixed = {
      light: {
        position: [1, 2, 3],
        range: 10
      },
      sampler: {sampler: true} as any,
      texture: {texture: true} as any
    };

    const {bindings, uniforms} = splitUniformsAndBindings(mixed, {
      light: {
        position: 'vec3<f32>',
        range: 'f32'
      }
    });

    t.deepEquals(Object.keys(uniforms), ['light'], 'struct uniform preserved');
    t.deepEquals(Object.keys(bindings), ['sampler', 'texture'], 'bindings remain bindings');
    t.deepEqual(uniforms.light, mixed.light, 'struct uniform value retained');
    t.end();
  });

  test('splitUniformsAndBindings treats undeclared objects as bindings', t => {
    const nestedUniform = {thresholds: [1, 2, 3], metadata: {enabled: true}};
    const {bindings, uniforms} = splitUniformsAndBindings({config: nestedUniform});

    t.deepEquals(uniforms, {}, 'undeclared objects are not treated as uniforms');
    t.deepEqual(bindings.config, nestedUniform as any, 'undeclared objects fall back to bindings');
    t.end();
  });
}
