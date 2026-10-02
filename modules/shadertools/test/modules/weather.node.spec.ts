// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getShaderModuleUniformLayoutValidationResult, precipitation} from '@luma.gl/shadertools';
it('precipitation uniform schemas match both shader languages', () => {
  expect(getShaderModuleUniformLayoutValidationResult(precipitation, 'vertex')?.matches).toBe(true);
  expect(getShaderModuleUniformLayoutValidationResult(precipitation, 'wgsl')?.matches).toBe(true);
});
