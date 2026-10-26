// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUPointCloudVoxelDownsample,
  GPUPointCloudRadiusFilter
} from '@luma.gl/graph/gpu-pointcloud';
import {makeSpatialFixture, readFloats, readIntegers} from '../spatial-test-utils';

it('GPU voxel sampling selects stable IDs, ignores outside points, and resets each encoding', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = makeSpatialFixture(device);
  try {
    const positions = fixture.view(
      'float32x3',
      new Float32Array([
        0.2,
        0,
        0,
        0.8,
        0,
        0,
        1.1,
        0,
        0,
        2,
        0,
        0,
        -1,
        0,
        0,
        NaN,
        0,
        0,
        Infinity,
        0,
        0
      ]),
      4
    );
    const representatives = fixture.view('uint32', new Uint32Array(3), 8);
    const counts = fixture.view('uint32', new Uint32Array(3), 4);
    const output = fixture.view('float32x3', new Float32Array(9), 12);
    fixture.graph.add(
      new GPUPointCloudVoxelDownsample({
        positions: positions.view,
        representatives: representatives.view,
        counts: counts.view,
        output: output.view,
        origin: [0, 0, 0],
        voxelSize: 1,
        gridSize: [3, 1, 1]
      })
    );
    await fixture.run(2);
    expect(await readIntegers(representatives.buffer, 8)).toEqual([0, 2, 3]);
    expect(await readIntegers(counts.buffer, 4)).toEqual([2, 1, 1]);
    const result = await readFloats(output.buffer, 12);
    [0.2, 0, 0, 1.1, 0, 0, 2, 0, 0].forEach((value, index) =>
      expect(result[index]).toBeCloseTo(value)
    );
    positions.buffer.write(
      new Float32Array([3, 0, 0, 3, 0, 0, 3, 0, 0, 3, 0, 0, -1, 0, 0, NaN, 0, 0, Infinity, 0, 0]),
      4
    );
    await fixture.run();
    expect(await readIntegers(representatives.buffer, 8)).toEqual([
      0xffffffff, 0xffffffff, 0xffffffff
    ]);
    expect(await readIntegers(counts.buffer, 4)).toEqual([0, 0, 0]);
    expect(await readFloats(output.buffer, 12)).toEqual(new Array(9).fill(0));
  } finally {
    fixture.destroy();
  }
});

it('GPU radius filtering matches a CPU oracle, including duplicates and inclusive boundaries', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = makeSpatialFixture(device);
  try {
    const source = [0, 0, 0, 1, 0, 0, 1, 0, 0, 4, 0, 0, NaN, 0, 0, 0.5, 0, 0];
    const valid = [1, 1, 1, 1, 1, 0];
    const positions = fixture.view('float32x3', new Float32Array(source), 8);
    const validity = fixture.view('uint32', new Uint32Array(valid));
    const counts = fixture.view('uint32', new Uint32Array(6));
    const mask = fixture.view('uint32', new Uint32Array(6));
    fixture.graph.add(
      new GPUPointCloudRadiusFilter({
        positions: positions.view,
        validity: validity.view,
        radius: 1,
        minimumNeighbors: 2,
        counts: counts.view,
        mask: mask.view
      })
    );
    await fixture.run();
    const expected = valid.map((flag, row) => {
      let count = 0;
      for (let neighbor = 0; neighbor < valid.length; neighbor++) {
        const distance = Math.hypot(
          ...[0, 1, 2].map(axis => source[row * 3 + axis] - source[neighbor * 3 + axis])
        );
        if (flag && valid[neighbor] && row !== neighbor && distance <= 1) count++;
      }
      return count;
    });
    expect(await readIntegers(counts.buffer)).toEqual(expected);
    expect(await readIntegers(mask.buffer)).toEqual([1, 1, 1, 0, 0, 0]);
  } finally {
    fixture.destroy();
  }
});

it('GPU empty clouds clear voxel outputs and compose into radius filtering', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = makeSpatialFixture(device);
  try {
    const positions = fixture.view('float32x3', new Float32Array());
    const representatives = fixture.view('uint32', new Uint32Array([42]));
    const counts = fixture.view('uint32', new Uint32Array([42]));
    const output = fixture.view('float32x3', new Float32Array([9, 9, 9]));
    const neighbors = fixture.view('uint32', new Uint32Array(1));
    const mask = fixture.view('uint32', new Uint32Array(1));
    fixture.graph.add(
      new GPUPointCloudVoxelDownsample({
        positions: positions.view,
        representatives: representatives.view,
        counts: counts.view,
        output: output.view,
        origin: [0, 0, 0],
        voxelSize: 1,
        gridSize: [1, 1, 1]
      })
    );
    fixture.graph.add(
      new GPUPointCloudRadiusFilter({
        positions: output.view,
        validity: counts.view,
        counts: neighbors.view,
        mask: mask.view,
        radius: 1,
        minimumNeighbors: 0
      })
    );
    await fixture.run();
    expect(await readIntegers(counts.buffer)).toEqual([0]);
    expect(await readIntegers(representatives.buffer)).toEqual([0xffffffff]);
    expect(await readFloats(output.buffer)).toEqual([0, 0, 0]);
    expect(await readIntegers(mask.buffer)).toEqual([0]);
  } finally {
    fixture.destroy();
  }
});
