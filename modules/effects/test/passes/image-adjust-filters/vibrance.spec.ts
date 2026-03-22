import {expect, test} from 'vitest';
import { vibrance } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('vibrance#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(vibrance, {}, {});
  expect(uniforms, 'vibrance module build is ok').toBeTruthy();
  expect(uniforms.amount, 'vibrance amount uniform is ok').toBe(0);
});
