import {vibrance} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('vibrance#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(vibrance, {}, {});

  expect(Boolean(uniforms), 'vibrance module build is ok').toBe(true);
  expect(uniforms.amount, 'vibrance amount uniform is ok').toBe(0);
  void 0;
});
