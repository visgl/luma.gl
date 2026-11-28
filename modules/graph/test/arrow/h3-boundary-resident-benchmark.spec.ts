// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {it, expect} from 'vitest';
import {convertDggsCellKeysToGPUPaths} from '@luma.gl/graph/arrow';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {cellToBoundary, gridDisk, latLngToCell} from 'h3-js';
import * as arrow from 'apache-arrow';

it('measures existing H3 boundary extraction against CPU polygons plus upload', async context => {
  const device = await getWebGPUTestDevice();
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  )
    return context.skip();
  const localCells = gridDisk(latLngToCell(37.8, -122.4, 9), 24);
  const wait = async () => {
    const fence = device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
  };
  for (const count of [16384, 131072]) {
    const cells = Array.from({length: count}, (_, index) => localCells[index % localCells.length]);
    const input = device.createBuffer({
      data: new Uint32Array(BigUint64Array.from(cells, cell => BigInt(`0x${cell}`)).buffer),
      usage: Buffer.STORAGE
    });
    const vector = new GPUVector({
      type: 'data',
      name: 'h3',
      dataType: new arrow.Uint64(),
      format: 'uint32x2',
      data: [new GPUData({format: 'uint32x2', buffer: input, length: count})]
    });
    const correctness = convertDggsCellKeysToGPUPaths(device, vector, {encoding: 'h3'});
    const pathBuffer = correctness.paths.data[0].buffer;
    const bytes = await pathBuffer.readAsync();
    const data = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    // The benchmark covers the existing fixed-width path for supported single-face cells.
    let unsupported = 0;
    for (let index = 0; index < count; index++) {
      if (data[index * 14] === 0 && data[index * 14 + 1] === 0) unsupported++;
    }
    expect(unsupported).toBe(0);
    expect(data[0]).toBeCloseTo(-122.4, 0);
    expect(data[1]).toBeCloseTo(37.8, 0);
    correctness.destroy();
    const gpu: number[] = [];
    const cpuAndUpload: number[] = [];
    for (let sample = 0; sample <= 6; sample++) {
      let start = performance.now();
      const result = convertDggsCellKeysToGPUPaths(device, vector, {encoding: 'h3'});
      await wait();
      if (sample) gpu.push(performance.now() - start);
      result.destroy();
      start = performance.now();
      const output = new Float32Array(count * 14);
      for (let index = 0; index < count; index++) {
        const boundary = cellToBoundary(cells[index], true);
        for (let vertex = 0; vertex < 7; vertex++) {
          const [longitude, latitude] = boundary[vertex];
          output[index * 14 + vertex * 2] = longitude;
          output[index * 14 + vertex * 2 + 1] = latitude;
        }
      }
      const uploaded = device.createBuffer({data: output, usage: Buffer.VERTEX | Buffer.STORAGE});
      await wait();
      if (sample) cpuAndUpload.push(performance.now() - start);
      uploaded.destroy();
    }
    console.log('H3_BOUNDARY_PROBE', {count, gpu, cpuAndUpload, adapter: device.info});
    input.destroy();
  }
}, 120000);
