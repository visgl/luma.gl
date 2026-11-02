// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUConstant, GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUVectorBindings} from '../../src/model/gpu-vector-bindings';

for (const backend of ['webgl', 'webgpu'] as const) {
  it(`consolidates inferred constant and interleaved layouts on ${backend}`, async ({skip}) => {
    const device =
      backend === 'webgl' ? await getWebGLTestDevice() : await getWebGPUTestDevice('core');
    if (!device) return skip();
    const buffers = [0, 1].map(() =>
      device.createBuffer({data: new Float32Array([99, 1, 2, 3, 4, 5, 6])})
    );
    const vector = (byteOffset: number) =>
      new GPUVector({
        type: 'data',
        format: 'float32',
        data: buffers.map(
          buffer => new GPUData({buffer, format: 'float32', length: 2, byteOffset, byteStride: 12})
        )
      });
    const first = vector(4);
    const second = vector(8);
    const color = new GPUConstant({format: 'unorm8x2', value: new Uint8Array([128, 255])});
    const scale = new GPUConstant({format: 'float32', value: new Float32Array([3])});
    const bindings = new GPUVectorBindings(device, 'inferred');
    bindings.setInputs({second, first, color, scale}, undefined, 'instance');
    expect(bindings.layouts).toHaveLength(2);
    const shared = bindings.layouts.find(layout => layout.name === 'first')!;
    expect(shared.attributes).toEqual([
      {attribute: 'first', format: 'float32', byteOffset: 0},
      {attribute: 'second', format: 'float32', byteOffset: 4}
    ]);
    expect(bindings.byteOffsets.first).toBe(4);
    expect(bindings.buffers.first).toBe(buffers[0]);
    expect(bindings.constants.color).toEqual(new Float32Array([128 / 255, 1]));
    if (backend === 'webgpu') {
      const constantBuffer = bindings.buffers.color;
      const bytes = await constantBuffer.readAsync();
      expect(Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 2))).toEqual([128, 255]);
      expect(new Float32Array(bytes.buffer, bytes.byteOffset + 4, 1)[0]).toBe(3);
    }
    bindings.setInputs(bindings.getBatch(1), undefined, 'instance');
    expect(bindings.buffers.first).toBe(buffers[1]);
    expect(bindings.byteOffsets.first).toBe(4);
    const explicit = [
      {name: 'first', format: 'float32' as const, byteStride: 12},
      {name: 'second', format: 'float32' as const, byteStride: 12}
    ];
    bindings.setInputs({first, second}, explicit, 'instance');
    expect(bindings.layouts).toHaveLength(2);
    expect(explicit).toEqual([
      {name: 'first', format: 'float32', byteStride: 12},
      {name: 'second', format: 'float32', byteStride: 12}
    ]);
    bindings.destroy();
    for (const buffer of buffers) {
      expect(buffer.destroyed).toBe(false);
      buffer.destroy();
    }
  });
}
