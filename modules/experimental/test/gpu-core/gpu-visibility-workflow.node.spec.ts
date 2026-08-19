// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, GPUCompaction, GPUVisibilityWorkflow} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import {addGPUCompactionToGraphWithDispatchLimit} from '../../src/gpu-core/gpu-compaction';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../../src/gpu-core/gpu-dispatch-utils';
import {addGPUVisibilityWorkflowToGraphWithDispatchLimit} from '../../src/gpu-core/gpu-visibility-workflow';

const WORKGROUP_SIZE = 256;

describe('bounded GPU visibility dispatch', () => {
  test('preserves exact one-dimensional boundaries and expands safely into the third dimension', () => {
    const maximum = 65_535;
    const oneDimensionalCapacity = maximum * WORKGROUP_SIZE;

    for (const operation of ['GPUMask', 'GPUVisibilityWorkflow', 'GPUCompaction']) {
      expect(getBoundedDispatchLayout(operation, 0, WORKGROUP_SIZE, maximum)).toEqual({
        x: 1,
        y: 1,
        z: 1
      });
      expect(
        getBoundedDispatchLayout(operation, oneDimensionalCapacity, WORKGROUP_SIZE, maximum)
      ).toEqual({x: maximum, y: 1, z: 1});
      expect(
        getBoundedDispatchLayout(operation, oneDimensionalCapacity + 1, WORKGROUP_SIZE, maximum)
      ).toEqual({x: maximum, y: 2, z: 1});
      expect(
        getBoundedDispatchLayout(operation, 4 * WORKGROUP_SIZE + 1, WORKGROUP_SIZE, 2)
      ).toEqual({x: 2, y: 2, z: 2});
      expect(() =>
        getBoundedDispatchLayout(operation, 8 * WORKGROUP_SIZE + 1, WORKGROUP_SIZE, 2)
      ).toThrow(/exceeding the 3D dispatch limit/i);
    }

    const source = getBoundedInvocationIndexSource({x: 2, y: 2, z: 2}, WORKGROUP_SIZE);
    expect(source).toContain('workgroupId.z * 2u + workgroupId.y');
    expect(source).toContain('* 2u + workgroupId.x');
    expect(source.indexOf('workgroupIndex >= 16777216u')).toBeLessThan(
      source.indexOf('workgroupIndex * 256u + localInvocationIndex')
    );
  });

  test('propagates a synthetic dispatch limit through every visibility workflow stage', () => {
    const fixture = createVisibilityGraphFixture(4 * WORKGROUP_SIZE + 1);
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      addGPUVisibilityWorkflowToGraphWithDispatchLimit(fixture.workflow, fixture.graph, 2);

      const passIds = addComputePass.mock.calls.map(([pass]) => pass.id);
      expect(passIds).toContain('node-visibility-compose');
      expect(passIds).toContain('node-visibility-identity');
      expect(passIds).toContain('node-visibility-compact-scan-level-0-scan');
      expect(passIds).toContain('node-visibility-compact-scan-level-0-add-offsets');
      expect(passIds).toContain('node-visibility-compact-scatter');
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('rejects source ranges beyond the complete bounded three-dimensional capacity', () => {
    const fixture = createVisibilityGraphFixture(8 * WORKGROUP_SIZE + 1);

    try {
      expect(() =>
        addGPUVisibilityWorkflowToGraphWithDispatchLimit(fixture.workflow, fixture.graph, 2)
      ).toThrow(/GPUMask.*exceeding the 3D dispatch limit/i);
    } finally {
      fixture.device.destroy();
    }
  });

  test('retains the existing single-workgroup clear-count path for empty compaction', () => {
    const device = new NullDevice({id: 'empty-compaction-node-device'});
    Object.defineProperty(device, 'type', {value: 'webgpu'});
    const graph = new GPUCommandGraph(device, {id: 'empty-compaction-node-graph'});
    const input = createTransientView(graph, 'input', 0);
    const flags = createTransientView(graph, 'flags', 0);
    const output = createTransientView(graph, 'output', 0);
    const count = createTransientView(graph, 'count', 1);
    const addComputePass = vi.spyOn(graph, 'addComputePass');

    try {
      const compaction = new GPUCompaction({id: 'empty-compaction', input, flags, output, count});
      addGPUCompactionToGraphWithDispatchLimit(compaction, graph, 0);
      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'empty-compaction-clear-count'
      ]);
    } finally {
      addComputePass.mockRestore();
      device.destroy();
    }
  });
});

function createVisibilityGraphFixture(rowCount: number): {
  device: NullDevice;
  graph: GPUCommandGraph;
  workflow: GPUVisibilityWorkflow;
} {
  const device = new NullDevice({id: 'bounded-visibility-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'bounded-visibility-node-graph'});
  const firstMask = createTransientView(graph, 'first-mask', rowCount);
  const secondMask = createTransientView(graph, 'second-mask', rowCount);
  const outputMask = createTransientView(graph, 'output-mask', rowCount);
  const output = createTransientView(graph, 'output', rowCount);
  const count = createTransientView(graph, 'count', 1);
  const workflow = new GPUVisibilityWorkflow({
    id: 'node-visibility',
    predicates: [
      {kind: 'bounds', mask: firstMask},
      {kind: 'selection', mask: secondMask}
    ],
    outputMask,
    output,
    count,
    firstSourceIndex: 40
  });
  return {device, graph, workflow};
}

function createTransientView(graph: GPUCommandGraph, id: string, length: number) {
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format: 'uint32', length});
}
