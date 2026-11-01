// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {addGeospatialPass} from '../../src/geospatial/geospatial-utils';

it('classic FP64 passes upload their constants before the first dispatch', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const output = device.createBuffer({byteLength: 8, usage: Buffer.STORAGE | Buffer.COPY_SRC});
  const graph = new GPUCommandGraph(device);
  const handle = graph.importBuffer({id: 'constants', byteLength: 8, usage: output.usage}, output);
  const view = graph.createDataView(handle, {format: 'float32', length: 2});
  addGeospatialPass(graph, {
    id: 'classic-fp64-constants',
    precise: true,
    fp64Arithmetic: 'classic',
    source: `
@group(0) @binding(0) var<storage, read_write> result: array<f32>;
@compute @workgroup_size(1) fn main() {
  result[0] = fp64arithmetic.ONE;
  result[1] = fp64arithmetic.SPLIT;
}`,
    resources: [{buffer: handle, usage: 'storage-write'}],
    bindings: {result: view},
    dispatchLayout: {x: 1, y: 1, z: 1}
  });
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const data = await output.readAsync();
    expect(Array.from(new Float32Array(data.buffer, data.byteOffset, 2))).toEqual([1, 4097]);
  } finally {
    compiled.destroy();
    output.destroy();
  }
});
