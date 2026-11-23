// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {applyParametersToRenderPipelineDescriptor} from '../../../../src/webgpu/adapter/helpers/webgpu-parameters';

it('scopes unclippedDepth to the configured pipeline', () => {
  const makeDescriptor = (): GPURenderPipelineDescriptor => ({
    layout: 'auto',
    vertex: {module: {} as GPUShaderModule}
  });
  const enabled = makeDescriptor();
  applyParametersToRenderPipelineDescriptor(
    enabled,
    {unclippedDepth: true},
    {has: feature => feature === 'depth-clip-control'}
  );
  expect(enabled.primitive?.unclippedDepth).toBe(true);
  const ordinary = makeDescriptor();
  applyParametersToRenderPipelineDescriptor(ordinary);
  expect(ordinary.primitive?.unclippedDepth).toBeUndefined();
  applyParametersToRenderPipelineDescriptor(ordinary, {unclippedDepth: true}, {has: () => false});
  expect(ordinary.primitive?.unclippedDepth).toBe(false);
  applyParametersToRenderPipelineDescriptor(enabled, {unclippedDepth: false});
  expect(enabled.primitive?.unclippedDepth).toBe(false);
});
