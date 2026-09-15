// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUCommandGraph,
  GPUScan,
  type GPUCommandNodeProducer,
  addGPUCommandNodes,
  createTransientView
} from '@luma.gl/gpgpu/gpu-core';

test('core primitives expose no graph-mutation compatibility hook', () => {
  const directory = new URL('../../src/gpu-core/', import.meta.url);
  for (const file of readdirSync(directory).filter(file => file.endsWith('.ts'))) {
    expect(readFileSync(new URL(file, directory), 'utf8'), file).not.toContain('addToGraph');
  }
});

test('constructing a multi-level scan leaves scheduling to its caller', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {...device.limits, maxComputeWorkgroupsPerDimension: 65535}
  });
  const graph = new GPUCommandGraph(device);
  const schedule = vi.spyOn(graph, 'addComputePass');
  const input = createTransientView(graph, 'input', 'uint32', 1024);
  const output = createTransientView(graph, 'output', 'uint32', 1024);
  const nodes = new GPUScan({input, output}).getCommandNodes(graph);
  expect(nodes.length).toBeGreaterThan(1);
  expect(schedule).not.toHaveBeenCalled();
  addGPUCommandNodes(graph, nodes);
  expect(schedule).toHaveBeenCalledTimes(nodes.length);
  device.destroy();
});

test('graph.add passes the graph to a typed producer and schedules mixed nodes in order', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph<{count: number}>(device);
  const scheduled: string[] = [];
  vi.spyOn(graph, 'addComputePass').mockImplementation(node => {
    scheduled.push(node.id);
  });
  vi.spyOn(graph, 'addRenderPass').mockImplementation(node => {
    scheduled.push(node.id);
  });
  vi.spyOn(graph, 'addCopyPass').mockImplementation(node => {
    scheduled.push(node.id);
  });
  const getCommandNodes = vi.fn<GPUCommandNodeProducer<{count: number}>['getCommandNodes']>(
    receivedGraph => {
      expect(receivedGraph).toBe(graph);
      return [
        {type: 'copy', id: 'upload', compile: () => ({encode() {}})},
        {type: 'compute', id: 'compute', compile: () => ({encode() {}})},
        {type: 'render', id: 'render', compile: () => ({encode() {}})}
      ];
    }
  );
  graph.add({getCommandNodes});
  expect(getCommandNodes).toHaveBeenCalledTimes(1);
  expect(scheduled).toEqual(['upload', 'compute', 'render']);
  device.destroy();
});

test('graph.add rejects compiled graphs before invoking a producer, including empty producers', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device);
  const getCommandNodes = vi.fn(() => []);
  graph.add({getCommandNodes});
  expect(getCommandNodes).toHaveBeenCalledTimes(1);
  const compiled = graph.compile();
  getCommandNodes.mockClear();
  expect(() => graph.add({getCommandNodes})).toThrow();
  expect(getCommandNodes).not.toHaveBeenCalled();
  compiled.destroy();
  device.destroy();
});
