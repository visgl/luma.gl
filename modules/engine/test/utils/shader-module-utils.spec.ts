// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {ShaderLayout} from '../../../core/src';
import type {ShaderModule} from '../../../shadertools/src';
import {lighting, pbrMaterial} from '../../../shadertools/src';
import {
  getShaderModuleUniformBlockLayouts,
  mergeInferredShaderLayout,
  mergeShaderModuleBindingsIntoLayout
} from '../../src/utils/shader-module-utils';

it('getShaderModuleUniformBlockLayouts exposes module uniformTypes under the GLSL block name', () => {
  expect(getShaderModuleUniformBlockLayouts([lighting])).toEqual([
    {name: 'lightingUniforms', uniformTypes: lighting.uniformTypes}
  ]);

  const nonStd140Module = {
    name: 'packed',
    uniformTypes: {value: 'f32'},
    vs: 'uniform packedUniforms { float value; } packed;'
  } as const satisfies ShaderModule;
  expect(
    getShaderModuleUniformBlockLayouts([nonStd140Module]),
    'does not assume std140 packing for blocks without the qualifier'
  ).toEqual([]);
});

it('mergeShaderModuleBindingsIntoLayout does not create placeholder layouts', () => {
  const shaderLayout = mergeShaderModuleBindingsIntoLayout<ShaderLayout | null>(null, [lighting]);
  expect(shaderLayout, 'null shader layouts stay null until a real layout is inferred').toBeNull();
});

it('mergeShaderModuleBindingsIntoLayout remaps companion sampler bindings', () => {
  const shaderLayout: ShaderLayout = {
    bindings: [
      {name: 'pbr_baseColorSampler', location: 1, group: 0},
      {name: 'pbr_baseColorSamplerSampler', location: 2, group: 0}
    ],
    attributes: []
  };

  const mergedLayout = mergeShaderModuleBindingsIntoLayout(shaderLayout, [pbrMaterial]);

  expect(
    mergedLayout?.bindings.find(binding => binding.name === 'pbr_baseColorSampler')?.group,
    'texture binding group is remapped'
  ).toBe(3);
  expect(
    mergedLayout?.bindings.find(binding => binding.name === 'pbr_baseColorSamplerSampler')?.group,
    'companion sampler binding group is remapped'
  ).toBe(3);
});

it('mergeInferredShaderLayout merges compatible attributes and rejects conflicts', () => {
  const explicitLayout: ShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
    bindings: []
  };
  const inferredLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'filterValues', location: 1, type: 'f32'}
    ],
    bindings: []
  };
  const mergedLayout = mergeInferredShaderLayout(explicitLayout, inferredLayout, ['filterValues']);

  expect(
    mergedLayout?.attributes,
    'explicit metadata wins and inferred plugin attributes are appended'
  ).toEqual([
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'filterValues', location: 1, type: 'f32'}
  ]);
  expect(() =>
    mergeInferredShaderLayout(
      explicitLayout,
      {
        attributes: [{name: 'filterValues', location: 0, type: 'f32'}],
        bindings: []
      },
      ['filterValues']
    )
  ).toThrow(/both use location 0/);
  expect(() =>
    mergeInferredShaderLayout(
      explicitLayout,
      {
        attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
        bindings: []
      },
      ['positions']
    )
  ).toThrow(/conflicts with its inferred type or location/);
});

it('mergeShaderModuleBindingsIntoLayout merges binding visibility', () => {
  const shaderLayout: ShaderLayout = {
    bindings: [{type: 'storage', name: 'fragments', location: 1, group: 0}],
    attributes: []
  };
  const fragmentStorageModule = {
    name: 'fragmentStorage',
    bindingLayout: [{name: 'fragments', group: 0, visibility: 0x2}]
  } satisfies ShaderModule;

  const mergedLayout = mergeShaderModuleBindingsIntoLayout(shaderLayout, [fragmentStorageModule]);

  expect(
    mergedLayout?.bindings.find(binding => binding.name === 'fragments')?.visibility,
    'module binding visibility is merged into inferred bindings'
  ).toBe(0x2);
});
