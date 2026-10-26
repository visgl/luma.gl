// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUAdaptiveSpMV} from '../../src/gpu-core/gpu-adaptive-spmv';
import {createGPUScalar} from '../../src/gpu-core/gpu-scalar';
import {GPUScalarLiteral} from '../../src/gpu-core/gpu-scalar-literal';
import {gateGPUCommandNodes} from '../../src/gpu-core/gpu-scalar-dispatch-gate';
import {BatchConformanceFixture} from './batch-conformance-utils';

for (const strategy of ['scalar-row', 'subgroup-row', 'workgroup-row', 'long-row'] as const) {
  test(`fragmented SpMV reuses gathered entries with ${strategy}`, async ({skip}) => {
    const device = await getWebGPUTestDevice(strategy === 'subgroup-row' ? 'max' : 'core');
    if (
      !device ||
      (strategy === 'subgroup-row' &&
        (!device.features.has('subgroups') || !device.wgslLanguageFeatures.has('subgroup_id')))
    )
      skip('Required WebGPU features unavailable');
    const fixture = new BatchConformanceFixture(device);
    const offsets = [0];
    const columns: number[] = [];
    const matrix: number[] = [];
    const expected: number[] = [];
    for (let row = 0; row < 8; row++) {
      if (row !== 3) {
        columns.push(row, row, (row + 1) % 8, 0xffffffff);
        matrix.push(2, 3, 4, Infinity);
        expected.push(5 * (row + 1) + 4 * (((row + 1) % 8) + 1));
      } else expected.push(0);
      offsets.push(columns.length);
    }
    const rowOffsets = fixture.column('rows', 'uint32', offsets, [2, 0, 3, 4]);
    const columnIndices = fixture.column('columns', 'uint32', columns, [7, 0, 7, 14]);
    const values = fixture.column('values', 'float32', matrix, [4, 9, 0, 15]);
    const vector = fixture.column('vector', 'float32', [1, 2, 3, 4, 5, 6, 7, 8], [0, 2, 2, 2, 2]);
    const output = fixture.column('output', 'float32', Array(8).fill(77), Array(8).fill(1));
    const nodes = new GPUAdaptiveSpMV({
      id: 'multiply',
      rowOffsets,
      columnIndices,
      values,
      vector,
      output,
      columns: 8,
      strategy
    }).getCommandNodes(fixture.graph);
    expect(nodes.some(node => node.id.startsWith('multiply-gather-'))).toBe(true);
    fixture.graph.add(nodes);
    const compiled = fixture.graph.compile();
    try {
      for (let iteration = 1; iteration <= 2; iteration++) {
        if (iteration === 2) {
          let offset = 0;
          for (const chunk of 'data' in vector ? vector.data : [vector]) {
            fixture.storage
              .get(chunk.buffer)!
              .write(
                new Float32Array(
                  Array.from({length: chunk.length}, (_, index) => (offset + index + 1) * 2)
                ),
                chunk.byteOffset
              );
            offset += chunk.length;
          }
        }
        const encoder = device.createCommandEncoder();
        compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect(await fixture.read(output)).toEqual(expected.map(value => value * iteration));
      }
      expect(await fixture.read(values)).toEqual(matrix);
    } finally {
      compiled.destroy();
      expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
      fixture.destroy();
    }
  });
}

test('GPU gates cover gathered SpMV scratch and row dispatches', async ({skip}) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) skip('WebGPU unavailable');
  const fixture = new BatchConformanceFixture(device);
  const columnIndices = fixture.column('columns', 'uint32', [0, 1, 2, 3], [2, 2]);
  const values = fixture.column('values', 'float32', [2, 3, 4, 5], [2, 2]);
  const vector = fixture.column('vector', 'float32', [10, 20, 30, 40], [1, 1, 1, 1]);
  const disabled = fixture.output('disabled', 'float32', 4);
  const enabled = fixture.output('enabled', 'float32', 4);
  // Splitting the row offsets creates several row blocks even with atomic outputs.
  const fragmentedOffsets = fixture.column(
    'split-rows',
    'uint32',
    [0, 1, 2, 3, 4],
    [1, 1, 1, 1, 1]
  );
  const active = createGPUScalar(fixture.graph, 'active', 'uint32');
  for (const [index, output] of [disabled, enabled].entries()) {
    fixture.graph.add(new GPUScalarLiteral({id: `active-${index}`, output: active, value: index}));
    const nodes = new GPUAdaptiveSpMV({
      id: `multiply-${index}`,
      rowOffsets: fragmentedOffsets,
      columnIndices,
      values,
      vector,
      output,
      columns: 4,
      strategy: 'scalar-row'
    }).getCommandNodes(fixture.graph);
    expect(nodes.some(node => node.id.includes('-gather-'))).toBe(true);
    fixture.graph.add(gateGPUCommandNodes(fixture.graph, nodes, active));
  }
  const compiled = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(disabled)).toEqual([77, 77, 77, 77]);
    expect(await fixture.read(enabled)).toEqual([20, 60, 120, 200]);
  } finally {
    compiled.destroy();
    fixture.destroy();
  }
});
