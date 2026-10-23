// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUPointCloudOctree} from '@luma.gl/gpu-graph/gpu-pointcloud';
import {makeSpatialFixture, readFloats, readIntegers} from '../spatial-test-utils';

/** Independent breadth-first CPU reference, matching the documented Morton-cell sample order. */
function buildReference(
  source: Float32Array,
  maximumDepth: number,
  nodePointLimit: number,
  samplingLevels: number
) {
  const resolution = 2 ** maximumDepth;
  const points: {row: number; key: number}[] = [];
  for (let row = 0; row < source.length / 3; row++) {
    const point = Array.from(source.slice(row * 3, row * 3 + 3));
    if (!point.every(value => Number.isFinite(value) && value >= 0 && value <= 1)) continue;
    const coordinate = point.map(value => Math.min(resolution - 1, Math.floor(value * resolution)));
    let key = 0;
    for (let bit = 0; bit < maximumDepth; bit++) {
      key |=
        (((coordinate[0] >> bit) & 1) * 4 +
          ((coordinate[1] >> bit) & 1) * 2 +
          ((coordinate[2] >> bit) & 1)) <<
        (bit * 3);
    }
    points.push({row, key});
  }
  points.sort((left, right) => left.key - right.key || left.row - right.row);
  const queue = points.length ? [{points, prefix: 0, level: 0, parent: 0xffffffff}] : [];
  const nodes: number[][] = [];
  const indices: number[] = [];
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    const retained: typeof points = [];
    const remaining: typeof points = [];
    const seen = new Set<number>();
    const terminal = node.level === maximumDepth || node.points.length <= nodePointLimit;
    for (const point of node.points) {
      const cell = point.key >>> (3 * Math.max(0, maximumDepth - node.level - samplingLevels));
      if (terminal || (!seen.has(cell) && retained.length < nodePointLimit)) retained.push(point);
      else remaining.push(point);
      seen.add(cell);
    }
    const children = new Map<number, typeof points>();
    for (const point of remaining) {
      const octant = (point.key >>> (3 * (maximumDepth - node.level - 1))) & 7;
      const group = children.get(octant) ?? [];
      group.push(point);
      children.set(octant, group);
    }
    nodes.push([
      node.prefix,
      node.level,
      node.parent,
      children.size ? queue.length : 0xffffffff,
      Array.from(children.keys()).reduce((mask, octant) => mask | (1 << octant), 0),
      indices.length,
      retained.length,
      node.points.length
    ]);
    indices.push(...retained.map(point => point.row));
    for (const [octant, childPoints] of children) {
      queue.push({
        points: childPoints,
        prefix: node.prefix * 8 + octant,
        level: node.level + 1,
        parent: index
      });
    }
  }
  return {
    nodes: nodes.flat(),
    indices,
    status: [nodes.length, indices.length, source.length / 3 - points.length, 0]
  };
}

it('GPU additive octree matches a sparse CPU tree, owns each accepted row once, and resets reused outputs', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    context.skip();
    return;
  }
  const fixture = makeSpatialFixture(device);
  const source = new Float32Array(283 * 3);
  for (let row = 0; row < 280; row++) {
    source.set(
      row < 30 ? [0.5, 0.5, 0.5] : [(row % 17) / 16, ((row * 7) % 19) / 18, ((row * 11) % 23) / 22],
      row * 3
    );
  }
  source.set([NaN, 0, 0, Infinity, 0, 0, -0.1, 0, 0], 280 * 3);
  const positions = fixture.view('float32x3', source, 268);
  const pointIndices = fixture.view('uint32', new Uint32Array(290), 260);
  const nodes = fixture.view('uint32', new Uint32Array(283 * 8), 12);
  const status = fixture.view('uint32', new Uint32Array(4), 4);
  try {
    fixture.graph.add(
      new GPUPointCloudOctree({
        positions: positions.view,
        pointIndices: pointIndices.view,
        nodes: nodes.view,
        status: status.view,
        origin: [0, 0, 0],
        size: 1,
        maximumDepth: 3,
        nodePointLimit: 3,
        samplingLevels: 1
      })
    );
    for (const input of [source, new Float32Array(source.length).fill(0.5)]) {
      positions.buffer.write(input, 268);
      await fixture.run(2);
      const expected = buildReference(input, 3, 3, 1);
      const actualIndices = await readIntegers(pointIndices.buffer, 260);
      const actualNodes = await readIntegers(nodes.buffer, 12);
      expect(await readIntegers(status.buffer, 4)).toEqual(expected.status);
      expect(actualNodes.slice(0, expected.nodes.length)).toEqual(expected.nodes);
      expect(actualNodes.slice(expected.nodes.length).every(value => value === 0)).toBe(true);
      expect(actualIndices.slice(0, expected.indices.length)).toEqual(expected.indices);
      expect(
        actualIndices.slice(expected.indices.length).every(value => value === 0xffffffff)
      ).toBe(true);
      expect(new Set(actualIndices.slice(0, expected.indices.length)).size).toBe(
        expected.indices.length
      );
      expect(await readFloats(positions.buffer, 268)).toEqual(Array.from(input));
      let previousCount = 0;
      for (let level = 0; level <= 3; level++) {
        let count = 0;
        for (let node = 0; node < expected.nodes.length; node += 8) {
          if (actualNodes[node + 1] <= level) count += actualNodes[node + 6];
        }
        expect(count).toBeGreaterThanOrEqual(previousCount);
        previousCount = count;
      }
      expect(previousCount).toBe(expected.indices.length);
    }
  } finally {
    fixture.destroy();
  }
});

it('GPU additive octree reports node-capacity overflow without losing IDs or writing outside the output view', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    context.skip();
    return;
  }
  const fixture = makeSpatialFixture(device);
  try {
    const source = new Float32Array([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
    const positions = fixture.view('float32x3', source);
    const pointIndices = fixture.view('uint32', new Uint32Array(4));
    const nodes = fixture.view('uint32', new Uint32Array(8), 4);
    nodes.buffer.write(new Uint32Array([0x12345678]));
    const status = fixture.view('uint32', new Uint32Array(4));
    fixture.graph.add(
      new GPUPointCloudOctree({
        positions: positions.view,
        pointIndices: pointIndices.view,
        nodes: nodes.view,
        status: status.view,
        origin: [0, 0, 0],
        size: 1,
        maximumDepth: 2,
        nodePointLimit: 1
      })
    );
    await fixture.run();
    const expected = buildReference(source, 2, 1, 2);
    expect(await readIntegers(status.buffer)).toEqual([...expected.status.slice(0, 3), 1]);
    expect(await readIntegers(pointIndices.buffer)).toEqual(expected.indices);
    expect((await readIntegers(nodes.buffer))[0]).toBe(0x12345678);
  } finally {
    fixture.destroy();
  }
});

it('GPU additive octree supports empty, entirely rejected, depth-zero, and depth-ten inputs', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    context.skip();
    return;
  }
  for (const [source, maximumDepth] of [
    [new Float32Array(), 3],
    [new Float32Array([2, 0, 0, NaN, 0, 0]), 2],
    [new Float32Array([0, 0, 0, 1, 1, 1, 0.5, 0.5, 0.5]), 0],
    [new Float32Array([0, 0, 0, 1, 1, 1, 1, 1, 1]), 10]
  ] as const) {
    const fixture = makeSpatialFixture(device);
    try {
      const positions = fixture.view('float32x3', source);
      const pointIndices = fixture.view('uint32', new Uint32Array(source.length / 3));
      const nodes = fixture.view('uint32', new Uint32Array((source.length / 3) * 8));
      const status = fixture.view('uint32', new Uint32Array(4));
      fixture.graph.add(
        new GPUPointCloudOctree({
          positions: positions.view,
          pointIndices: pointIndices.view,
          nodes: nodes.view,
          status: status.view,
          origin: [0, 0, 0],
          size: 1,
          maximumDepth,
          nodePointLimit: 1
        })
      );
      await fixture.run();
      const expected = buildReference(source, maximumDepth, 1, 2);
      expect(await readIntegers(status.buffer)).toEqual(expected.status);
      expect((await readIntegers(pointIndices.buffer)).slice(0, expected.indices.length)).toEqual(
        expected.indices
      );
      expect((await readIntegers(nodes.buffer)).slice(0, expected.nodes.length)).toEqual(
        expected.nodes
      );
    } finally {
      fixture.destroy();
    }
  }
});
