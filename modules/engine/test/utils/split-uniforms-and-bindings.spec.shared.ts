import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { splitUniformsAndBindings } from '@luma.gl/engine/model/split-uniforms-and-bindings';
export function registerSplitUniformsAndBindingsTests(): void {
  test('splitUniformsAndBindings', () => {
    const mixed: Parameters<typeof splitUniformsAndBindings>[0] = {
      array: [1, 2, 3, 4],
      boolean: true,
      number: 123,
      sampler: {
        sampler: true
      } as any,
      texture: {
        texture: true
      } as any
    };
    const {
      bindings,
      uniforms
    } = splitUniformsAndBindings(mixed);
    expect(Object.keys(bindings), 'bindings correctly extracted').toEqual(['sampler', 'texture']);
    expect(Object.keys(uniforms), 'bindings correctly extracted').toEqual(['array', 'boolean', 'number']);
  });
  test('splitUniformsAndBindings respects declared struct uniforms', () => {
    const mixed = {
      light: {
        position: [1, 2, 3],
        range: 10
      },
      sampler: {
        sampler: true
      } as any,
      texture: {
        texture: true
      } as any
    };
    const {
      bindings,
      uniforms
    } = splitUniformsAndBindings(mixed, {
      light: {
        position: 'vec3<f32>',
        range: 'f32'
      }
    });
    expect(Object.keys(uniforms), 'struct uniform preserved').toEqual(['light']);
    expect(Object.keys(bindings), 'bindings remain bindings').toEqual(['sampler', 'texture']);
    expect(uniforms.light, 'struct uniform value retained').toEqual(mixed.light);
  });
  test('splitUniformsAndBindings treats undeclared objects as bindings', () => {
    const nestedUniform = {
      thresholds: [1, 2, 3],
      metadata: {
        enabled: true
      }
    };
    const {
      bindings,
      uniforms
    } = splitUniformsAndBindings({
      config: nestedUniform
    });
    expect(uniforms, 'undeclared objects are not treated as uniforms').toEqual({});
    expect(bindings.config, 'undeclared objects fall back to bindings').toEqual(nestedUniform as any);
  });
}
