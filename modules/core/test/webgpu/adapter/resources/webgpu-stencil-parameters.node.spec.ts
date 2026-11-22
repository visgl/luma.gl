// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {applyParametersToRenderPipelineDescriptor} from '../../../../src/webgpu/adapter/helpers/webgpu-parameters';

/** Creates a descriptor without depth-stencil state. */
function makePipelineDescriptor(): GPURenderPipelineDescriptor {
  return {
    layout: 'auto',
    vertex: {module: {} as GPUShaderModule},
    fragment: {module: {} as GPUShaderModule, targets: [{format: 'rgba8unorm'}]}
  };
}

for (const presetDepthStencil of [false, true]) {
  test(`stencil parameters map to GPUDepthStencilState (preset depthStencil: ${presetDepthStencil})`, () => {
    const pipelineDescriptor = makePipelineDescriptor();
    if (presetDepthStencil) {
      // WebGPURenderPipeline creates this state when a depth-stencil attachment format is given
      pipelineDescriptor.depthStencil = {
        format: 'depth24plus-stencil8',
        depthWriteEnabled: false,
        depthCompare: 'less-equal'
      };
    }

    applyParametersToRenderPipelineDescriptor(pipelineDescriptor, {
      stencilReadMask: 0x0f,
      stencilWriteMask: 0xf0,
      stencilCompare: 'equal',
      stencilPassOperation: 'replace',
      stencilFailOperation: 'invert',
      stencilDepthFailOperation: 'decrement-wrap'
    });

    const depthStencil = pipelineDescriptor.depthStencil!;
    expect(depthStencil.stencilReadMask).toBe(0x0f);
    expect(depthStencil.stencilWriteMask).toBe(0xf0);
    const expectedFaceState: GPUStencilFaceState = {
      compare: 'equal',
      passOp: 'replace',
      failOp: 'invert',
      depthFailOp: 'decrement-wrap'
    };
    expect(depthStencil.stencilFront).toEqual(expectedFaceState);
    expect(depthStencil.stencilBack).toEqual(expectedFaceState);
    expect(depthStencil.stencilFront, 'faces are separate objects').not.toBe(
      depthStencil.stencilBack
    );
  });
}

test('one stencil parameter leaves the other face members at the WebGPU defaults', () => {
  const pipelineDescriptor = makePipelineDescriptor();
  pipelineDescriptor.depthStencil = {
    format: 'depth24plus-stencil8',
    depthWriteEnabled: false,
    depthCompare: 'less-equal'
  };

  applyParametersToRenderPipelineDescriptor(pipelineDescriptor, {stencilPassOperation: 'replace'});

  // Members that stay undefined take the WebGPU defaults: compare 'always' and operations 'keep'
  expect(pipelineDescriptor.depthStencil.stencilFront).toEqual({passOp: 'replace'});
  expect(pipelineDescriptor.depthStencil.stencilBack).toEqual({passOp: 'replace'});
});
