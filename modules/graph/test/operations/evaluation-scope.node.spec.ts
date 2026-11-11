// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUDataEvaluator, interleave} from '@luma.gl/graph/gpu-simple-graph';
import {NullDevice} from '@luma.gl/core/test-utils';
import {interleave as interleaveWebGPU} from '../../src/gpu-simple-graph/operations/webgpu/interleave';

for (const limit of ['maxStorageBuffersPerShaderStage', 'maxBindingsPerBindGroup'] as const) {
  it(`interleave counts GPU-resident constants against ${limit}`, () => {
    const device = new NullDevice({});
    Object.defineProperties(device.limits, {
      maxStorageBuffersPerShaderStage: {value: limit === 'maxStorageBuffersPerShaderStage' ? 1 : 8},
      maxBindingsPerBindGroup: {value: limit === 'maxBindingsPerBindGroup' ? 1 : 8}
    });
    const buffer = device.createBuffer({byteLength: 4, usage: Buffer.STORAGE});
    const gpuConstant = new GPUDataEvaluator({
      type: 'float32',
      size: 1,
      length: 1,
      isConstant: true,
      buffer
    });
    const cpuConstant = GPUDataEvaluator.fromConstant(2);
    const output = interleave(gpuConstant, cpuConstant);
    const target = device.createBuffer({byteLength: 8, usage: Buffer.STORAGE});
    try {
      expect(gpuConstant.value).toBeUndefined();
      expect(() =>
        interleaveWebGPU({device, inputs: [gpuConstant, cpuConstant], output, target})
      ).toThrow(
        limit === 'maxStorageBuffersPerShaderStage'
          ? 'requires 2 storage buffers, exceeding device limit 1'
          : 'requires 2 bindings, exceeding bind group limit 1'
      );
    } finally {
      output.destroy();
      gpuConstant.destroy();
      cpuConstant.destroy();
      target.destroy();
      buffer.destroy();
      device.destroy();
    }
  });
}
