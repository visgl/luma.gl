// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph} from '@luma.gl/gpu-graph/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';
import {GPUGraphDiagnostics} from '../../examples/gpu-graph-diagnostics';

test('diagnostics defer reads, sample repeated encodings, and invalidate cleared samples', async () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'diagnostics'}).compile();
  const diagnostics = new GPUGraphDiagnostics();
  const updateTrace = vi.spyOn(diagnostics.tracePanel, 'update');
  try {
    const encoding = graph.encode(device.commandEncoder, {parameters: undefined});
    let resolveRead!: (report: typeof encoding.stats) => void;
    const readTimings = vi.spyOn(encoding, 'readTimings').mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRead = resolve;
        })
    );
    diagnostics.record(graph, encoding);
    expect(readTimings).not.toHaveBeenCalled();
    expect(updateTrace).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(readTimings).toHaveBeenCalledTimes(1);
    const nextEncoding = graph.encode(device.commandEncoder, {parameters: undefined});
    const nextRead = vi.spyOn(nextEncoding, 'readTimings');
    diagnostics.record(graph, nextEncoding);
    await Promise.resolve();
    expect(nextRead).not.toHaveBeenCalled();
    diagnostics.clear();
    resolveRead(encoding.stats);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(updateTrace).toHaveBeenLastCalledWith(undefined);
  } finally {
    diagnostics.clear();
    graph.destroy();
    device.destroy();
  }
});

test('diagnostics allocate scoped timestamps only for sampled encodings', async () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  vi.spyOn(device.features, 'has').mockReturnValue(true);
  const graph = new GPUCommandGraph(device, {id: 'sampled-diagnostics'}).compile();
  const commandEncoder = device.commandEncoder;
  const profile = vi.fn();
  commandEncoder.withTimeProfilingQuerySet = (_querySet, encode) => {
    profile();
    return encode();
  };
  const createQuerySet = vi.spyOn(device, 'createQuerySet');
  const diagnostics = new GPUGraphDiagnostics();
  const updateInspector = vi.spyOn(diagnostics.inspectorPanel, 'update');
  try {
    diagnostics.encode(graph, commandEncoder, {parameters: undefined});
    diagnostics.encode(graph, commandEncoder, {parameters: undefined});
    expect(profile).toHaveBeenCalledTimes(1);
    expect(createQuerySet).toHaveBeenCalledTimes(1);
    expect(createQuerySet).toHaveBeenCalledWith({type: 'timestamp', count: 2});
    const querySet = createQuerySet.mock.results[0].value;
    const destroy = vi.spyOn(querySet, 'destroy');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(updateInspector.mock.calls.at(-1)?.[1]).toBe(graph.id);
    expect(commandEncoder.getTimeProfilingQuerySet()).toBeNull();
  } finally {
    diagnostics.clear();
    graph.destroy();
    device.destroy();
  }
});

test('diagnostics retain the completed trace while the next sampled GPU read is pending', async () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'stable-trace'}).compile();
  const diagnostics = new GPUGraphDiagnostics();
  const updateTrace = vi.spyOn(diagnostics.tracePanel, 'update');
  try {
    const firstEncoding = graph.encode(device.commandEncoder, {parameters: undefined});
    vi.spyOn(firstEncoding, 'readTimings').mockResolvedValue(firstEncoding.stats);
    diagnostics.record(graph, firstEncoding);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(updateTrace).toHaveBeenCalledTimes(1);
    expect(updateTrace).toHaveBeenLastCalledWith(firstEncoding.stats, graph.id);
    for (let index = 1; index < 60; index++) {
      diagnostics.record(graph, graph.encode(device.commandEncoder, {parameters: undefined}));
    }
    const nextEncoding = graph.encode(device.commandEncoder, {parameters: undefined});
    let resolveRead!: (report: typeof nextEncoding.stats) => void;
    vi.spyOn(nextEncoding, 'readTimings').mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRead = resolve;
        })
    );
    diagnostics.record(graph, nextEncoding);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(updateTrace).toHaveBeenCalledTimes(1);
    resolveRead(nextEncoding.stats);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(updateTrace).toHaveBeenCalledTimes(2);
    expect(updateTrace).toHaveBeenLastCalledWith(nextEncoding.stats, graph.id);
  } finally {
    diagnostics.clear();
    graph.destroy();
    device.destroy();
  }
});
