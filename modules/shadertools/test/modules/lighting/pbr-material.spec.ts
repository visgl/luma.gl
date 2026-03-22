import {expect, test} from 'vitest';
import { pbrMaterial, getShaderModuleUniforms } from '@luma.gl/shadertools';
test('shadertools#pbrMaterial', () => {
  // @ts-expect-error Fix typing
  const uniforms = getShaderModuleUniforms(pbrMaterial, {}, {});
  expect(uniforms, 'Default pbr lighting uniforms ok').toBeTruthy();
});
