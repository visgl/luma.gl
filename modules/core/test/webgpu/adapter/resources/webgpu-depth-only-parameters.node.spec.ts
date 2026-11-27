// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {applyParametersToRenderPipelineDescriptor} from '../../../../src/webgpu/adapter/helpers/webgpu-parameters';

test.each([
  {targets: []},
  {targets: [null]}
])('color parameters preserve depth-only target layout %j', ({targets}) => {
  const descriptor: GPURenderPipelineDescriptor = {
    layout: 'auto',
    vertex: {module: {} as GPUShaderModule},
    fragment: {module: {} as GPUShaderModule, targets},
    depthStencil: {format: 'depth32float'}
  };

  applyParametersToRenderPipelineDescriptor(descriptor, {
    colorMask: 15,
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'one',
    blendColorDstFactor: 'one-minus-src-alpha',
    depthWriteEnabled: true
  });

  expect(descriptor.fragment?.targets).toEqual(targets.length ? [null] : []);
  expect(descriptor.depthStencil?.depthWriteEnabled).toBe(true);
});
