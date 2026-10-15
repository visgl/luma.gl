// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {applyParametersToRenderPipelineDescriptor} from '../../../src/adapter/helpers/webgpu-parameters';

for (const blendFirst of [true, false]) {
  test(`explicit blend disabling wins over factors (blend first: ${blendFirst})`, () => {
    const target: GPUColorTargetState = {
      format: 'rgba32float',
      blend: {color: {srcFactor: 'one'}, alpha: {srcFactor: 'one'}}
    };
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      layout: 'auto',
      vertex: {module: {} as GPUShaderModule},
      fragment: {module: {} as GPUShaderModule, targets: [target]}
    };
    const factors = {
      blendColorSrcFactor: 'src-alpha',
      blendAlphaDstFactor: 'one-minus-src-alpha'
    } as const;
    applyParametersToRenderPipelineDescriptor(
      pipelineDescriptor,
      blendFirst
        ? {blend: false, ...factors, colorMask: 15}
        : {...factors, colorMask: 15, blend: false}
    );
    expect(target.blend).toBeUndefined();
    expect(target.writeMask).toBe(15);
    applyParametersToRenderPipelineDescriptor(pipelineDescriptor, {blend: true, ...factors});
    expect(target.blend?.color.srcFactor).toBe('src-alpha');
    expect(target.blend?.alpha.dstFactor).toBe('one-minus-src-alpha');
  });
}
