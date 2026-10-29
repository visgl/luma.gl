// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  isUniformValue,
  splitUniformsAndBindings
} from '@luma.gl/engine/model/split-uniforms-and-bindings';
import {expect, it} from 'vitest';

export function registerSplitUniformsAndBindingsTests(): void {
  it('splitUniformsAndBindings', () => {
    const mixed: Parameters<typeof splitUniformsAndBindings>[0] = {
      array: [1, 2, 3, 4],
      boolean: true,
      number: 123,
      sampler: {sampler: true} as any,
      texture: {texture: true} as any
    };
    const {bindings, uniforms} = splitUniformsAndBindings(mixed);
    expect(Object.keys(bindings), 'bindings correctly extracted').toEqual(['sampler', 'texture']);
    expect(Object.keys(uniforms), 'uniforms correctly extracted').toEqual([
      'array',
      'boolean',
      'number'
    ]);
  });

  it('routes numeric arrays as uniforms and preserves resource bindings', () => {
    const mixed: Parameters<typeof splitUniformsAndBindings>[0] = {
      empty: [],
      floatSamples: new Float32Array([1, 2, 3]),
      integerSamples: new Uint16Array([4, 5, 6]),
      dataView: new DataView(new ArrayBuffer(8)) as any,
      stringArray: ['texture'] as any,
      texture: {texture: true} as any
    };
    const {uniforms, bindings} = splitUniformsAndBindings(mixed);

    expect(Object.keys(uniforms)).toEqual(['empty', 'floatSamples', 'integerSamples']);
    expect(Object.keys(bindings)).toEqual(['dataView', 'stringArray', 'texture']);
    for (const name of ['empty', 'floatSamples', 'integerSamples']) {
      expect(isUniformValue(mixed[name])).toBe(true);
      expect(uniforms[name]).toBe(mixed[name]);
    }
    for (const name of ['dataView', 'stringArray', 'texture']) {
      expect(isUniformValue(mixed[name])).toBe(false);
      expect(bindings[name]).toBe(mixed[name]);
    }
  });

  it('splitUniformsAndBindings respects declared struct uniforms', () => {
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

    expect(Object.keys(uniforms), 'struct uniform preserved').toEqual(['light']);
    expect(Object.keys(bindings), 'bindings remain bindings').toEqual(['sampler', 'texture']);
    expect(uniforms.light, 'struct uniform value retained').toEqual(mixed.light);
  });

  it('splitUniformsAndBindings treats undeclared objects as bindings', () => {
    const nestedUniform = {thresholds: [1, 2, 3], metadata: {enabled: true}};
    const {bindings, uniforms} = splitUniformsAndBindings({config: nestedUniform});

    expect(uniforms, 'undeclared objects are not treated as uniforms').toEqual({});
    expect(bindings.config, 'undeclared objects fall back to bindings').toEqual(nestedUniform);
  });
}
