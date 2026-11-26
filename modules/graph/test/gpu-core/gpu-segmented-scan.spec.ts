// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUCommandGraphInspector,
  GPUScan,
  GPUSegmentedScan
} from '@luma.gl/graph/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';

describe('GPUSegmentedScan', () => {
  it('constructs exclusive and inclusive segmented scans', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device, {id: 'segmented-scan-test'});
    const input = graph.createTransientBuffer({
      id: 'input',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    const offsets = graph.createTransientBuffer({
      id: 'offsets',
      byteLength: 12,
      usage: Buffer.STORAGE
    });
    const output = graph.createTransientBuffer({
      id: 'output',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    const inputView = graph.createDataView(input, {format: 'uint32', length: 4});
    const offsetView = graph.createDataView(offsets, {format: 'uint32', length: 3});
    const outputView = graph.createDataView(output, {format: 'uint32', length: 4});
    expect(
      new GPUSegmentedScan({input: inputView, segmentOffsets: offsetView, output: outputView}).mode
    ).toBe('exclusive');
    expect(
      new GPUSegmentedScan({
        input: inputView,
        segmentOffsets: offsetView,
        output: outputView,
        mode: 'inclusive'
      }).mode
    ).toBe('inclusive');
  });
});

it.each([
  'exclusive',
  'inclusive'
] as const)('scans offset views across tiles and dispatch rows in %s mode', async mode => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const segmentCount = device.limits.maxComputeWorkgroupsPerDimension + 1;
  const input = Uint32Array.from({length: 521}, (_, index) =>
    index === 1 ? 0xffffffff : index % 7
  );
  const offsets = new Uint32Array(segmentCount + 3);
  offsets.fill(518, 3);
  offsets[segmentCount + 1] = 519;
  const output = new Uint32Array(input.length).fill(99);
  const graph = new GPUCommandGraph(device);
  const buffers: Buffer[] = [];
  function importView(id: string, values: Uint32Array) {
    const buffer = device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_SRC});
    buffers.push(buffer);
    return graph.createDataView(
      graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer),
      {format: 'uint32', length: values.length - 2, byteOffset: 4}
    );
  }

  graph.add(
    new GPUSegmentedScan({
      input: importView('input', input),
      segmentOffsets: importView('offsets', offsets),
      output: importView('output', output),
      mode
    })
  );
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    for (const [begin, end] of [
      [0, 518],
      [518, 519]
    ]) {
      let sum = 0;
      for (let index = begin; index < end; index++) {
        const next = (sum + input[index + 1]) >>> 0;
        output[index + 1] = mode === 'inclusive' ? next : sum;
        sum = next;
      }
    }
    const bytes = await buffers[2].readAsync();
    expect(new Uint32Array(bytes.buffer, bytes.byteOffset, output.length)).toEqual(output);
  } finally {
    compiled.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
});

it.each([
  undefined,
  'layout',
  'source'
] as const)('exposes declared kernel metadata to the inspector with %s collection', async kernelMetadata => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const graph = new GPUCommandGraph(device);
  const input = graph.createDataView(
    graph.createTransientBuffer({id: 'input', byteLength: 4, usage: Buffer.STORAGE}),
    {format: 'uint32', length: 1}
  );
  const output = graph.createDataView(
    graph.createTransientBuffer({id: 'output', byteLength: 4, usage: Buffer.STORAGE}),
    {format: 'uint32', length: 1}
  );
  const source = '@compute @workgroup_size(8) fn custom() {}';
  graph.addComputePass({
    id: 'custom',
    kernel: {entryPoint: 'custom', workgroupSize: [8, 1, 1], bindings: [], source},
    compile: () => ({encode: () => {}})
  });
  graph.add(new GPUScan({input, output}));
  const compiled =
    kernelMetadata === 'source'
      ? await graph.compileAsync({kernelMetadata})
      : graph.compile({kernelMetadata});
  try {
    const inspector = new GPUCommandGraphInspector();
    inspector.registerGraph(compiled);
    const nodes = inspector.getSnapshot().graphs[0].preflight?.nodes;
    expect(nodes).toHaveLength(2);
    if (!kernelMetadata) {
      expect(nodes?.every(node => node.kernel === undefined)).toBe(true);
      return;
    }
    const custom = nodes?.find(node => node.id === 'custom')?.kernel;
    const scan = nodes?.find(node => node.operation === 'GPUScan')?.kernel;
    expect(custom).toMatchObject({entryPoint: 'custom', workgroupSize: [8, 1, 1], bindings: []});
    expect(scan).toMatchObject({
      entryPoint: 'main',
      workgroupSize: [256, 1, 1],
      bindings: expect.arrayContaining([
        expect.objectContaining({name: 'inputValues', location: 0})
      ])
    });
    expect(custom?.source).toBe(kernelMetadata === 'source' ? source : undefined);
    if (kernelMetadata === 'source') expect(scan?.source).toContain('@compute');
    else expect(scan?.source).toBeUndefined();
  } finally {
    compiled.destroy();
  }
});
