// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUCommandGraph,
  GPUScan,
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
