// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import * as core from '@luma.gl/core';
import * as contracts from '@luma.gl/shaders/types';
import * as coreWGSL from '@luma.gl/core/wgsl';
import * as shaderWGSL from '@luma.gl/shaders/wgsl';

it('keeps core type decoders and uniform block layouts identical to standalone shader contracts', () => {
  expect(core.shaderTypeDecoder).toBe(contracts.shaderTypeDecoder);
  expect(core.getVariableShaderTypeInfo).toBe(contracts.getVariableShaderTypeInfo);
  expect(core.makeShaderBlockLayout).toBe(contracts.makeShaderBlockLayout);
  expect(coreWGSL.scanWGSLInterface).toBe(shaderWGSL.scanWGSLInterface);
});
