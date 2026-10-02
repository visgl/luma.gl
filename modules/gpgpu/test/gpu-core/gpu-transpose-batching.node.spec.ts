// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUTranspose, GraphVectorView} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('transpose limits dispatch to shared tiles without packing or allocating buffers', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'uint32', Array(1024).fill(1), [0, 512, 0, 512]);
    const output = fixture.column('output', 'uint32', Array(1024).fill(0), [512, 0, 512, 0]);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUTranspose({input, output, rows: 32, columns: 32}).getCommandNodes(
      fixture.graph
    );
    expect(nodes).toHaveLength(4);
    expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);
    expect(nodes.map(node => node.workload?.maximumWorkgroupCount)).toEqual([1, 1, 1, 1]);
    expect(nodes.reduce((sum, node) => sum + (node.workload?.readByteLength ?? 0), 0)).toBe(4096);
    expect(nodes.reduce((sum, node) => sum + (node.workload?.writeByteLength ?? 0), 0)).toBe(4096);
    expect(allocate).not.toHaveBeenCalled();
    allocate.mockRestore();
    const rowInput = fixture.column('row-input', 'uint32', [1, 2, 3, 4], [1, 1, 1, 1]);
    const rowOutput = fixture.column('row-output', 'uint32', [0, 0, 0, 0], [1, 1, 1, 1]);
    expect(
      new GPUTranspose({input: rowInput, output: rowOutput, rows: 1, columns: 4}).getCommandNodes(
        fixture.graph
      )
    ).toHaveLength(4);
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

test('transpose validates all chunk layouts, aliases, capacities, and graph ownership', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'uint32', [1, 2, 3, 4, 5, 6], [2, 0, 4]);
    const output = fixture.column('output', 'uint32', Array(8).fill(77), [0, 1, 4, 3]);
    const props = {input, output, rows: 2, columns: 3};
    const strided = fixture.column('strided', 'uint32', Array(8).fill(0), [1, 7], {stride: 2});
    for (const name of ['input', 'output'] as const) {
      expect(() => new GPUTranspose({...props, [name]: strided})).toThrow(/packed/);
      expect(
        () => new GPUTranspose({...props, [name]: fixture.output(`short-${name}`, 'uint32', 5)})
      ).toThrow(/at least/);
      const original = props[name];
      if (!('data' in original)) throw new Error('Expected vector');
      const data = [...original.data];
      const last = data.length - 1;
      data[last] = foreign.output(name, 'uint32', data[last].length);
      const invalid = new GraphVectorView({...original, data});
      expect(() =>
        new GPUTranspose({...props, [name]: invalid}).getCommandNodes(fixture.graph)
      ).toThrow(/different GPUCommandGraph/);
    }
    expect(() => new GPUTranspose({...props, output: input})).toThrow(/separate buffers/);
    if (!('data' in output)) throw new Error('Expected vector');
    const duplicate = new GraphVectorView({...output, data: [output.data[2], output.data[2]]});
    expect(() => new GPUTranspose({...props, output: duplicate})).toThrow(/must not overlap/);
    const spareForeign = new GraphVectorView({
      ...output,
      length: 9,
      valueLength: 9,
      data: [...output.data, foreign.output('spare', 'uint32', 1)]
    });
    expect(() =>
      new GPUTranspose({...props, output: spareForeign}).getCommandNodes(fixture.graph)
    ).toThrow(/different GPUCommandGraph/);
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});

function makeDevice() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  for (const [name, value] of Object.entries({
    maxComputeWorkgroupsPerDimension: 65535,
    maxComputeInvocationsPerWorkgroup: 256,
    maxComputeWorkgroupSizeX: 256,
    maxComputeWorkgroupSizeY: 256
  })) {
    Object.defineProperty(device.limits, name, {value});
  }
  return device;
}
