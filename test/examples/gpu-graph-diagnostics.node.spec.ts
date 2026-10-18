// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
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
    expect(updateTrace).toHaveBeenLastCalledWith(encoding.stats, graph.id);
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
  try {
    diagnostics.encode(graph, commandEncoder, {parameters: undefined});
    diagnostics.encode(graph, commandEncoder, {parameters: undefined});
    expect(profile).toHaveBeenCalledTimes(1);
    expect(createQuerySet).toHaveBeenCalledTimes(1);
    const querySet = createQuerySet.mock.results[0].value;
    const destroy = vi.spyOn(querySet, 'destroy');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(commandEncoder.getTimeProfilingQuerySet()).toBeNull();
  } finally {
    diagnostics.clear();
    graph.destroy();
    device.destroy();
  }
});
