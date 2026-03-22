import {expect, test} from 'vitest';
import type { ShaderLayout } from '../../../core/src';
import { lighting, pbrMaterial } from '../../../shadertools/src';
import { mergeShaderModuleBindingsIntoLayout } from '../../src/utils/shader-module-utils';
test('mergeShaderModuleBindingsIntoLayout does not create placeholder layouts', () => {
  const shaderLayout = mergeShaderModuleBindingsIntoLayout<ShaderLayout | null>(null, [lighting]);
  expect(shaderLayout, 'null shader layouts stay null until a real layout is inferred').toBe(null);
});
test('mergeShaderModuleBindingsIntoLayout remaps companion sampler bindings', () => {
  const shaderLayout: ShaderLayout = {
    bindings: [{
      name: 'pbr_baseColorSampler',
      location: 1,
      group: 0
    }, {
      name: 'pbr_baseColorSamplerSampler',
      location: 2,
      group: 0
    }],
    attributes: []
  };
  const mergedLayout = mergeShaderModuleBindingsIntoLayout(shaderLayout, [pbrMaterial]);
  expect(mergedLayout?.bindings.find(binding => binding.name === 'pbr_baseColorSampler')?.group, 'texture binding group is remapped').toBe(3);
  expect(mergedLayout?.bindings.find(binding => binding.name === 'pbr_baseColorSamplerSampler')?.group, 'companion sampler binding group is remapped').toBe(3);
});
