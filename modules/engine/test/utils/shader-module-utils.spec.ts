// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderLayout} from '../../../core/src';
import {lighting, pbrMaterial} from '../../../shadertools/src';
import {mergeShaderModuleBindingsIntoLayout} from '../../src/utils/shader-module-utils';

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
