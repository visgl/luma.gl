// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  ComputePass,
  type Buffer,
  type CommandEncoder,
  type ComputePassProps,
  type ComputePipeline,
  type QuerySet
} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

type ComputePassFixture = {
  device: NullDevice;
  graph: GPUCommandGraph;
  commandEncoder: CommandEncoder;
  computePasses: RecordingComputePass[];
  events: string[];
  timestampQuerySet?: QuerySet;
};

describe('GPUCommandGraph compute-pass coalescing', () => {
  test('coalesces consecutive compute nodes while preserving node order and debug groups', () => {
    const fixture = createComputePassFixture('consecutive-compute-nodes');
    addComputeNode(fixture, 'first');
    addComputeNode(fixture, 'second');
    addComputeNode(fixture, 'third');
    const compiled = fixture.graph.compile();

    try {
      const encoding = compiled.encode(fixture.commandEncoder, {parameters: undefined});

      expect(fixture.computePasses).toHaveLength(1);
      expect(fixture.events).toEqual([
        'begin:first',
        'push:first',
        'encode:first',
        'pop:first',
        'push:second',
        'encode:second',
        'pop:second',
        'push:third',
        'encode:third',
        'pop:third',
        'end:first'
      ]);
      expect(encoding.stats.nodeCount).toBe(3);
      expect(encoding.stats.computePassCount).toBe(1);
      expect(encoding.stats.coalescedComputeNodeCount).toBe(2);
      expect(encoding.stats.nodes.map(node => node.id)).toEqual(['first', 'second', 'third']);
      expect(encoding.stats.timestampedNodeCount).toBe(0);
      expect(encoding.canReadGPUTimings).toBe(false);
    } finally {
      compiled.destroy();
      destroyComputePassFixture(fixture);
    }
  });

  test('closes shared compute passes before copy and render nodes', () => {
    const fixture = createComputePassFixture('non-compute-boundaries');
    addComputeNode(fixture, 'first');
    addComputeNode(fixture, 'second');
    fixture.graph.addCopyPass({
      id: 'copy',
      compile: () => ({encode: () => fixture.events.push('encode:copy')})
    });
    addComputeNode(fixture, 'third');
    fixture.graph.addRenderPass({
      id: 'render',
      compile: () => ({encode: () => fixture.events.push('encode:render')})
    });
    addComputeNode(fixture, 'fourth');
    const compiled = fixture.graph.compile();

    try {
      const encoding = compiled.encode(fixture.commandEncoder, {parameters: undefined});

      expect(fixture.computePasses.map(computePass => computePass.id)).toEqual([
        'first',
        'third',
        'fourth'
      ]);
      expect(fixture.events.indexOf('end:first')).toBeLessThan(
        fixture.events.indexOf('encode:copy')
      );
      expect(fixture.events.indexOf('end:third')).toBeLessThan(
        fixture.events.indexOf('encode:render')
      );
      expect(fixture.events.at(-1)).toBe('end:fourth');
      expect(encoding.stats.nodeCount).toBe(6);
      expect(encoding.stats.computePassCount).toBe(3);
      expect(encoding.stats.coalescedComputeNodeCount).toBe(1);
    } finally {
      compiled.destroy();
      destroyComputePassFixture(fixture);
    }
  });

  test('allows callers to retain one compute pass for each node', () => {
    const fixture = createComputePassFixture('explicit-separate-compute-passes');
    addComputeNode(fixture, 'first');
    addComputeNode(fixture, 'second');
    addComputeNode(fixture, 'third');
    const compiled = fixture.graph.compile();

    try {
      const encoding = compiled.encode(fixture.commandEncoder, {
        parameters: undefined,
        coalesceComputePasses: false
      });

      expect(fixture.computePasses.map(computePass => computePass.id)).toEqual([
        'first',
        'second',
        'third'
      ]);
      expect(encoding.stats.computePassCount).toBe(3);
      expect(encoding.stats.coalescedComputeNodeCount).toBe(0);
    } finally {
      compiled.destroy();
      destroyComputePassFixture(fixture);
    }
  });

  test('preserves per-node GPU timestamps when the command encoder profiles passes', async () => {
    const fixture = createComputePassFixture('profiled-compute-passes');
    fixture.timestampQuerySet = fixture.device.createQuerySet({
      id: 'profiled-compute-timestamps',
      type: 'timestamp',
      count: 6
    });
    vi.spyOn(fixture.commandEncoder, 'getTimeProfilingQuerySet').mockReturnValue(
      fixture.timestampQuerySet
    );
    addComputeNode(fixture, 'first');
    addComputeNode(fixture, 'second');
    addComputeNode(fixture, 'third');
    const compiled = fixture.graph.compile();

    try {
      const encoding = compiled.encode(fixture.commandEncoder, {parameters: undefined});

      expect(fixture.computePasses).toHaveLength(3);
      expect(encoding.stats.computePassCount).toBe(3);
      expect(encoding.stats.coalescedComputeNodeCount).toBe(0);
      expect(encoding.stats.timestampedNodeCount).toBe(3);
      expect(encoding.stats.nodes.every(node => node.hasGPUTimestamps)).toBe(true);
      expect(encoding.canReadGPUTimings).toBe(true);
      expect((await encoding.readTimings()).nodes.map(node => node.gpuTimeMilliseconds)).toEqual([
        0, 0, 0
      ]);
    } finally {
      compiled.destroy();
      destroyComputePassFixture(fixture);
    }
  });

  test('disables coalescing when a compute pass unexpectedly provides its own timestamps', () => {
    const fixture = createComputePassFixture('explicit-compute-pass-timestamps');
    fixture.timestampQuerySet = fixture.device.createQuerySet({
      id: 'explicit-compute-timestamps',
      type: 'timestamp',
      count: 4
    });
    addComputeNode(fixture, 'first');
    addComputeNode(fixture, 'second');
    const compiled = fixture.graph.compile();

    try {
      const encoding = compiled.encode(fixture.commandEncoder, {parameters: undefined});

      expect(fixture.computePasses).toHaveLength(2);
      expect(encoding.stats.computePassCount).toBe(2);
      expect(encoding.stats.coalescedComputeNodeCount).toBe(0);
      expect(encoding.stats.timestampedNodeCount).toBe(2);
    } finally {
      compiled.destroy();
      destroyComputePassFixture(fixture);
    }
  });

  test('closes an active pass and debug group when a compute node throws', () => {
    const fixture = createComputePassFixture('failed-compute-node');
    addComputeNode(fixture, 'first');
    addComputeNode(fixture, 'second', () => {
      throw new Error('intentional compute-node failure');
    });
    addComputeNode(fixture, 'third');
    const compiled = fixture.graph.compile();

    try {
      expect(() => compiled.encode(fixture.commandEncoder, {parameters: undefined})).toThrow(
        'intentional compute-node failure'
      );
      expect(fixture.computePasses).toHaveLength(1);
      expect(fixture.events.at(-2)).toBe('pop:second');
      expect(fixture.events.at(-1)).toBe('end:first');
      expect(fixture.events).not.toContain('encode:third');
    } finally {
      compiled.destroy();
      destroyComputePassFixture(fixture);
    }
  });

  test('does not create a physical compute pass for a graph without compute nodes', () => {
    const fixture = createComputePassFixture('copy-only-graph');
    fixture.graph.addCopyPass({
      id: 'copy',
      compile: () => ({encode: () => fixture.events.push('encode:copy')})
    });
    const compiled = fixture.graph.compile();

    try {
      const encoding = compiled.encode(fixture.commandEncoder, {parameters: undefined});

      expect(fixture.computePasses).toHaveLength(0);
      expect(encoding.stats.computePassCount).toBe(0);
      expect(encoding.stats.coalescedComputeNodeCount).toBe(0);
    } finally {
      compiled.destroy();
      destroyComputePassFixture(fixture);
    }
  });
});

class RecordingComputePass extends ComputePass {
  private readonly events: string[];
  private readonly debugGroups: string[] = [];

  constructor(device: NullDevice, props: ComputePassProps, events: string[]) {
    super(device, props);
    this.events = events;
  }

  override destroy(): void {
    this.destroyResource();
  }

  override end(): void {
    this.events.push(`end:${this.id}`);
    this.destroy();
  }

  override setPipeline(_pipeline: ComputePipeline): void {}

  override dispatch(_x: number, _y?: number, _z?: number): void {}

  override dispatchIndirect(_indirectBuffer: Buffer, _indirectOffset?: number): void {}

  override pushDebugGroup(groupLabel: string): void {
    this.debugGroups.push(groupLabel);
    this.events.push(`push:${groupLabel}`);
  }

  override popDebugGroup(): void {
    this.events.push(`pop:${this.debugGroups.pop()}`);
  }

  override insertDebugMarker(_markerLabel: string): void {}
}

function createComputePassFixture(identifier: string): ComputePassFixture {
  const device = new NullDevice({id: `${identifier}-device`});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const fixture: ComputePassFixture = {
    device,
    graph: new GPUCommandGraph(device, {id: identifier}),
    commandEncoder: device.createCommandEncoder({id: `${identifier}-encoder`}),
    computePasses: [],
    events: []
  };

  vi.spyOn(fixture.commandEncoder, 'beginComputePass').mockImplementation((props = {}) => {
    const beginTimestampIndex = fixture.computePasses.length * 2;
    const computePass = new RecordingComputePass(
      fixture.device,
      {
        ...props,
        ...(fixture.timestampQuerySet
          ? {
              timestampQuerySet: fixture.timestampQuerySet,
              beginTimestampIndex,
              endTimestampIndex: beginTimestampIndex + 1
            }
          : {})
      },
      fixture.events
    );
    fixture.computePasses.push(computePass);
    fixture.events.push(`begin:${computePass.id}`);
    return computePass;
  });

  return fixture;
}

function addComputeNode(
  fixture: ComputePassFixture,
  identifier: string,
  encode?: () => void
): void {
  fixture.graph.addComputePass({
    id: identifier,
    compile: () => ({
      encode: () => {
        fixture.events.push(`encode:${identifier}`);
        encode?.();
      }
    })
  });
}

function destroyComputePassFixture(fixture: ComputePassFixture): void {
  fixture.timestampQuerySet?.destroy();
  fixture.commandEncoder.destroy();
  fixture.device.destroy();
}
