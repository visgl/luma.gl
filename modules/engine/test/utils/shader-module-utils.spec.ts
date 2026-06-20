// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderLayout} from '../../../core/src';
import type {ShaderModule} from '../../../shadertools/src';
import {lighting, pbrMaterial} from '../../../shadertools/src';
import {
  mergeInferredShaderLayout,
  mergeShaderModuleBindingsIntoLayout
} from '../../src/utils/shader-module-utils';

test('mergeShaderModuleBindingsIntoLayout does not create placeholder layouts', t => {
  const shaderLayout = mergeShaderModuleBindingsIntoLayout<ShaderLayout | null>(null, [lighting]);
  t.equal(shaderLayout, null, 'null shader layouts stay null until a real layout is inferred');
  t.end();
});

test('mergeShaderModuleBindingsIntoLayout remaps companion sampler bindings', t => {
  const shaderLayout: ShaderLayout = {
    bindings: [
      {name: 'pbr_baseColorSampler', location: 1, group: 0},
      {name: 'pbr_baseColorSamplerSampler', location: 2, group: 0}
    ],
    attributes: []
  };

  const mergedLayout = mergeShaderModuleBindingsIntoLayout(shaderLayout, [pbrMaterial]);

  t.equal(
    mergedLayout?.bindings.find(binding => binding.name === 'pbr_baseColorSampler')?.group,
    3,
    'texture binding group is remapped'
  );
  t.equal(
    mergedLayout?.bindings.find(binding => binding.name === 'pbr_baseColorSamplerSampler')?.group,
    3,
    'companion sampler binding group is remapped'
  );

  t.end();
});

test('mergeInferredShaderLayout merges compatible attributes and rejects conflicts', t => {
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

  t.deepEqual(
    mergedLayout?.attributes,
    [
      {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
      {name: 'filterValues', location: 1, type: 'f32'}
    ],
    'explicit metadata wins and inferred plugin attributes are appended'
  );
  t.throws(
    () =>
      mergeInferredShaderLayout(
        explicitLayout,
        {
          attributes: [{name: 'filterValues', location: 0, type: 'f32'}],
          bindings: []
        },
        ['filterValues']
      ),
    /both use location 0/,
    'different names cannot share a location'
  );
  t.throws(
    () =>
      mergeInferredShaderLayout(
        explicitLayout,
        {
          attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
          bindings: []
        },
        ['positions']
      ),
    /conflicts with its inferred type or location/,
    'same-name declarations must have compatible types and locations'
  );
  t.end();
});

test('mergeShaderModuleBindingsIntoLayout merges binding visibility', t => {
  const shaderLayout: ShaderLayout = {
    bindings: [{type: 'storage', name: 'fragments', location: 1, group: 0}],
    attributes: []
  };
  const fragmentStorageModule = {
    name: 'fragmentStorage',
    bindingLayout: [{name: 'fragments', group: 0, visibility: 0x2}]
  } satisfies ShaderModule;

  const mergedLayout = mergeShaderModuleBindingsIntoLayout(shaderLayout, [fragmentStorageModule]);

  t.equal(
    mergedLayout?.bindings.find(binding => binding.name === 'fragments')?.visibility,
    0x2,
    'module binding visibility is merged into inferred bindings'
  );
  t.end();
});
