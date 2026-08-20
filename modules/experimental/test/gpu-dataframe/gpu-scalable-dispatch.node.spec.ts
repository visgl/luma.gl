// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGroupAggregation,
  GPUHistogram,
  GPUReduction
} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import {
  getGPUAnalyticsInvocationIndexSource,
  validateGPUAnalyticsOutputLength
} from '../../src/gpu-dataframe/gpu-analytics-compiler-utils';

const WORKGROUP_SIZE = 256;

describe('bounded GPUDataFrame analytics dispatch', () => {
  test('expands dense output layouts across three dimensions and rejects real 3D overflow', () => {
    const {device, graph} = createBoundedGraph();

    try {
      expect(() => validateGPUAnalyticsOutputLength(graph, 4 * WORKGROUP_SIZE + 1)).not.toThrow();
      expect(() => validateGPUAnalyticsOutputLength(graph, 8 * WORKGROUP_SIZE + 1)).toThrow(
        /3D dispatch limit/i
      );

      const source = getGPUAnalyticsInvocationIndexSource(graph, 4 * WORKGROUP_SIZE + 1);
      expect(source).toContain('workgroupId.z * 2u + workgroupId.y');
      expect(source).toContain('* 2u + workgroupId.x');
      expect(source.indexOf('workgroupIndex >= 16777216u')).toBeLessThan(
        source.indexOf('workgroupIndex * 256u + localInvocationIndex')
      );
    } finally {
      device.destroy();
    }
  });

  test('declares bounded hierarchical reduction work beyond the legacy one-dimensional ceiling', () => {
    const {device, graph} = createBoundedGraph();
    const input = createView(graph, 'reduction-input', 'float32', 1_025);
    const output = createView(graph, 'reduction-output', 'float32', 1);
    const addComputePass = vi.spyOn(graph, 'addComputePass');

    try {
      expect(() =>
        new GPUReduction({id: 'bounded-reduction', input, output, operation: 'sum'}).addToGraph(
          graph
        )
      ).not.toThrow();
      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual(
        expect.arrayContaining(['bounded-reduction-level-0', 'bounded-reduction-level-1'])
      );
    } finally {
      addComputePass.mockRestore();
      device.destroy();
    }
  });

  test('declares bounded histogram accumulation and dense output initialization', () => {
    const {device, graph} = createBoundedGraph();
    const input = createView(graph, 'histogram-input', 'uint32', 1_025);
    const output = createView(graph, 'histogram-output', 'uint32', 1_025);
    const addComputePass = vi.spyOn(graph, 'addComputePass');

    try {
      expect(() =>
        new GPUHistogram({id: 'bounded-histogram', input, output, domain: [0, 1_025]}).addToGraph(
          graph
        )
      ).not.toThrow();
      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'bounded-histogram-clear',
        'bounded-histogram-global'
      ]);
    } finally {
      addComputePass.mockRestore();
      device.destroy();
    }
  });

  test('initializes and finalizes dense groups beyond one-dimensional workgroup capacity', () => {
    const {device, graph} = createBoundedGraph();
    const keys = createView(graph, 'group-keys', 'uint32', 1_025);
    const values = createView(graph, 'group-values', 'float32', 1_025);
    const output = createView(graph, 'group-output', 'float32', 1_025);
    const addComputePass = vi.spyOn(graph, 'addComputePass');

    try {
      expect(() =>
        new GPUGroupAggregation({
          id: 'bounded-groups',
          keys,
          values,
          output,
          operation: 'mean'
        }).addToGraph(graph)
      ).not.toThrow();
      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual(
        expect.arrayContaining(['bounded-groups-initialize', 'bounded-groups-finalize'])
      );
    } finally {
      addComputePass.mockRestore();
      device.destroy();
    }
  });
});

function createBoundedGraph(): {device: NullDevice; graph: GPUCommandGraph} {
  const device = new NullDevice({id: 'gpu-dataframe-scalable-dispatch-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  device.limits.maxComputeWorkgroupsPerDimension = 2;
  device.limits.maxBufferSize = 65_536;
  device.limits.maxStorageBufferBindingSize = 65_536;
  return {
    device,
    graph: new GPUCommandGraph(device, {id: 'gpu-dataframe-scalable-dispatch-node-graph'})
  };
}

function createView<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  id: string,
  format: Format,
  length: number
) {
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format, length});
}
