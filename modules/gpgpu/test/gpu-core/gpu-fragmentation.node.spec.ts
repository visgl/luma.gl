// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph, GraphVectorView, type GraphBufferHandle} from '@luma.gl/gpgpu/gpu-core';
import {getGraphDataRange, validateChunkViews} from '../../src/gpu-core/gpu-chunk-utils';
import {GPUAdaptiveSpMV} from '../../src/gpu-core/gpu-adaptive-spmv';
import {GPUGather} from '../../src/gpu-core/gpu-gather';
import {expect, test} from 'vitest';

function makeGraph() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {
      ...device.limits,
      maxComputeWorkgroupsPerDimension: 65535,
      maxStorageBufferBindingSize: 128 * 1024 * 1024
    }
  });
  return new GPUCommandGraph(device);
}

function makeVector<Format extends 'uint32' | 'float32'>(
  graph: GPUCommandGraph,
  id: string,
  format: Format,
  lengths: number[]
) {
  const data = lengths.map((length, index) =>
    graph.createDataView(
      graph.importBuffer({
        id: `${id}-${index}`,
        byteLength: Math.max(1, length) * 4,
        usage: Buffer.STORAGE
      }),
      {format, length}
    )
  );
  const length = lengths.reduce((sum, value) => sum + value, 0);
  return new GraphVectorView({
    id,
    name: id,
    format,
    length,
    valueLength: length,
    stride: 1,
    byteStride: 4,
    rowByteLength: 4,
    data
  });
}

test('fragmented range lookup preserves identities, empty boundaries and layouts', () => {
  const graph = makeGraph();
  const input = makeVector(graph, 'input', 'float32', [0, 2, 0, 3, 0]);
  expect(input.chunks).toBe(input.chunks);
  expect(Object.isFrozen(input.chunks)).toBe(true);
  expect(getGraphDataRange(graph, input, 2, 3).data).toEqual([input.data[3]]);
  expect(getGraphDataRange(graph, input, 2, 3).data[0]).toBe(input.data[3]);
  for (let start = 0; start <= input.length; start++) {
    for (let length = 0; length <= input.length - start; length++) {
      const range = getGraphDataRange(graph, input, start, length);
      expect(range.length).toBe(length);
      expect(range.data.reduce((sum, chunk) => sum + chunk.length, 0)).toBe(length);
      expect(
        range.data.every(chunk => input.data.some(source => source.buffer === chunk.buffer))
      ).toBe(true);
    }
  }
  const buffer = graph.importBuffer({id: 'strided', byteLength: 128, usage: Buffer.STORAGE});
  const strided = graph.createDataView(buffer, {
    format: 'float32',
    length: 5,
    byteOffset: 4,
    byteStride: 12
  });
  const range = getGraphDataRange(graph, strided, 2, 2).data[0];
  expect([range.byteOffset, range.byteStride, range.rowByteLength]).toEqual([28, 12, 4]);
  expect(() => getGraphDataRange(graph, input, 5, 1)).toThrow();
});

test('chunk validation detects unordered overlaps and foreign empty chunks', () => {
  const graph = makeGraph();
  const buffer = graph.importBuffer({id: 'shared', byteLength: 128, usage: Buffer.STORAGE});
  const view = (byteOffset: number, length: number) =>
    graph.createDataView(buffer, {format: 'float32', byteOffset, length});
  expect(() => validateChunkViews(graph, [], [view(16, 2), view(0, 4), view(12, 0)])).not.toThrow();
  expect(() => validateChunkViews(graph, [], [view(16, 2), view(0, 5)])).toThrow(/overlap/);
  expect(() => validateChunkViews(graph, [view(0, 0)], [view(16, 2)])).toThrow(/separate buffers/);
  expect(() =>
    validateChunkViews(graph, [makeVector(makeGraph(), 'foreign', 'float32', [0])], [])
  ).toThrow(/target graph/);
});

test('graph scheduling retains ready waves, forward references, hazards and cycle detection', () => {
  const graph = makeGraph();
  for (const [id, dependsOn] of [
    ['first', ['second']],
    ['second', []],
    ['third', []],
    ['fourth', ['first']]
  ] as const) {
    graph.addCopyPass({id, dependsOn: [...dependsOn], compile: () => ({encode: () => {}})});
  }
  const compiled = graph.compile();
  expect(compiled.stats.nodeOrder).toEqual(['second', 'third', 'first', 'fourth']);
  compiled.destroy();
  for (const missing of [false, true]) {
    const invalid = makeGraph();
    invalid.addCopyPass({id: 'a', dependsOn: ['b'], compile: () => ({encode: () => {}})});
    if (!missing)
      invalid.addCopyPass({id: 'b', dependsOn: ['a'], compile: () => ({encode: () => {}})});
    expect(() => invalid.compile()).toThrow(missing ? /missing node/ : /dependency cycle/);
  }
});

test('transient allocation matches smallest-capacity reuse over overlapping lifetimes', () => {
  const graph = makeGraph();
  // Deterministic irregular lifetimes include capacity ties, unused gaps and same-node endpoints.
  const lifetimes = Array.from({length: 256}, (_, index) => ({
    first: (index * 37) % 100,
    last: ((index * 37) % 100) + 1 + (index % 13),
    bytes: 4 * (1 + (index % 17)),
    index
  }));
  const handles = lifetimes.map(({bytes, index}) =>
    graph.createTransientBuffer({id: `scratch-${index}`, byteLength: bytes, usage: Buffer.STORAGE})
  );
  const actual = new Map<GraphBufferHandle, Buffer>();
  for (let step = 0; step < 114; step++) {
    const used = lifetimes
      .filter(lifetime => lifetime.first === step || lifetime.last === step)
      .map(lifetime => handles[lifetime.index]);
    graph.addCopyPass({
      id: `step-${step}`,
      dependsOn: step ? [`step-${step - 1}`] : [],
      resources: used.map(buffer => ({buffer, usage: 'storage-read-write'})),
      compile: () => ({
        encode: ({getBuffer}) => {
          for (const handle of used) actual.set(handle, getBuffer(handle));
        }
      })
    });
  }
  const expected: {last: number; bytes: number; handles: number[]}[] = [];
  for (const lifetime of [...lifetimes].sort((left, right) => left.first - right.first)) {
    let allocation = expected
      .filter(candidate => candidate.last < lifetime.first)
      .sort((left, right) => left.bytes - right.bytes)[0];
    if (!allocation) {
      allocation = {last: -1, bytes: 0, handles: []};
      expected.push(allocation);
    }
    allocation.last = lifetime.last;
    allocation.bytes = Math.max(allocation.bytes, lifetime.bytes);
    allocation.handles.push(lifetime.index);
  }
  const compiled = graph.compile();
  try {
    expect(compiled.stats.physicalTransientBufferCount).toBe(expected.length);
    expect(compiled.stats.physicalTransientBytes).toBe(
      expected.reduce((sum, allocation) => sum + allocation.bytes, 0)
    );
    const encoder = graph.device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    graph.device.submit(encoder.finish());
    for (const allocation of expected) {
      expect(new Set(allocation.handles.map(index => actual.get(handles[index]))).size).toBe(1);
    }
  } finally {
    compiled.destroy();
  }
});

test('fragmented SpMV removes the row-by-matrix-by-vector dispatch product', () => {
  const graph = makeGraph();
  const rowCount = 32;
  const matrixSpans = 16;
  const vectorChunks = 16;
  const operation = new GPUAdaptiveSpMV({
    id: 'multiply',
    rowOffsets: makeVector(graph, 'rows', 'uint32', [rowCount + 1]),
    columnIndices: makeVector(graph, 'indices', 'uint32', Array(matrixSpans).fill(2)),
    values: makeVector(graph, 'values', 'float32', Array(matrixSpans).fill(2)),
    vector: makeVector(graph, 'vector', 'float32', Array(vectorChunks).fill(2)),
    output: makeVector(graph, 'output', 'float32', Array(rowCount).fill(1)),
    columns: 32,
    strategy: 'scalar-row'
  });
  const nodes = operation.getCommandNodes(graph);
  expect(nodes.length).toBe(matrixSpans * (rowCount + vectorChunks));
  expect(nodes.length).toBeLessThan((rowCount * matrixSpans * vectorChunks) / 10);
  // Compile planning without creating native kernels, preserving resource/dependency declarations.
  graph.add(nodes.map(node => ({...node, compile: () => ({encode: () => {}})})));
  const compiled = graph.compile();
  try {
    expect(compiled.stats.physicalTransientBufferCount).toBe(1);
    expect(compiled.stats.physicalTransientBytes).toBe(8);
  } finally {
    compiled.destroy();
  }
});

test('gather routing rejects oversized active bindings before shader compilation', () => {
  const graph = makeGraph();
  Object.defineProperty(graph.device.limits, 'maxStorageBufferBindingSize', {value: 16});
  const source = makeVector(graph, 'source', 'float32', [5]);
  const indices = makeVector(graph, 'indices', 'uint32', [1]);
  const output = makeVector(graph, 'output', 'float32', [1]);
  expect(() => new GPUGather({source, indices, output}).getCommandNodes(graph)).toThrow(
    /storage binding/
  );
});
