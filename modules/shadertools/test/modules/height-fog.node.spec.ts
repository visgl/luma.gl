// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getShaderModuleUniformLayoutValidationResult, heightFog} from '@luma.gl/shadertools';
it('height fog uniform schemas match both shader languages', () => {
  expect(getShaderModuleUniformLayoutValidationResult(heightFog, 'fragment')?.matches).toBe(true);
  expect(getShaderModuleUniformLayoutValidationResult(heightFog, 'wgsl')?.matches).toBe(true);
});
