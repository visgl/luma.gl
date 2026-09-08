import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, getViewBindingRange, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPU_CLUSTERING_WORKGROUP_SIZE,
  getGPUClusteringDispatchLayout,
  getGPUClusteringInvocationIndexSource,
  getGPUClusteringMatrixTiles,
  getGPUClusteringTileRowView,
  validateGPUClusteringEmbeddingMatrix
} from '../../src/gpu-vector-search/gpu-clustering-utils';
import type {GraphEmbeddingMatrix} from '../../src/gpu-vector-search/types';

it('luVS clustering uses bounded multidimensional dispatch without uint32 wraparound', () => {
  expect(GPU_CLUSTERING_WORKGROUP_SIZE, 'workgroups fit portable WebGPU limits').toBe(64);
  expect(getGPUClusteringDispatchLayout('k-means', 0, 2)).toEqual({x: 1, y: 1, z: 1});
  expect(getGPUClusteringDispatchLayout('k-means', 2 * 64 + 1, 2)).toEqual({
    x: 2,
    y: 2,
    z: 1
  });
  expect(getGPUClusteringDispatchLayout('k-means', 4 * 64 + 1, 2)).toEqual({
    x: 2,
    y: 2,
    z: 2
  });
  expect(() => getGPUClusteringDispatchLayout('k-means', 8 * 64 + 1, 2)).toThrow(
    /exceeding the 3D dispatch limit/
  );

  const source = getGPUClusteringInvocationIndexSource({x: 2, y: 2, z: 2});
  expect(source).toMatch(/workgroupId\.z \* 2u \+ workgroupId\.y/);
  expect(source).toMatch(/\* 2u \+ workgroupId\.x/);
  expect(
    Boolean(
      source.indexOf('workgroupIndex >= 67108864u') <
        source.indexOf('workgroupIndex * 64u + localInvocationIndex')
    ),
    'the overflow guard executes before index multiplication'
  ).toBe(true);
});

it('luVS clustering rejects malformed direct graph matrices before tiling or allocation', () => {
  const values = {
    buffer: {byteLength: 16},
    format: 'float32',
    length: 4,
    byteOffset: 0,
    byteStride: Float32Array.BYTES_PER_ELEMENT,
    rowByteLength: Float32Array.BYTES_PER_ELEMENT
  } as GraphDataView<'float32'>;
  const matrix: GraphEmbeddingMatrix = {
    dimensions: 2,
    rowCount: 2,
    chunks: [{values, rowCount: 2, rowStride: 2, byteOffset: 0, sourceRowOffset: 0}]
  };

  expect(() => validateGPUClusteringEmbeddingMatrix(matrix, 'fixture')).not.toThrow();
  for (const dimensions of [0, -1, 1.5, Number.NaN]) {
    expect(
      () => validateGPUClusteringEmbeddingMatrix({...matrix, dimensions}, 'fixture'),
      `${dimensions} embedding dimensions are rejected before any tile loop`
    ).toThrow(/dimensions must be a positive uint32 integer/);
  }
  for (const rowCount of [-1, 1.5, Number.POSITIVE_INFINITY]) {
    expect(
      () => validateGPUClusteringEmbeddingMatrix({...matrix, rowCount}, 'fixture'),
      `${rowCount} logical rows are rejected`
    ).toThrow(/row count must be a non-negative uint32 integer/);
  }
  for (const rowStride of [0, -1, 1, 1.5]) {
    expect(
      () =>
        validateGPUClusteringEmbeddingMatrix(
          {...matrix, chunks: [{...matrix.chunks[0], rowStride}]},
          'fixture'
        ),
      `${rowStride} cannot advance a complete embedding row`
    ).toThrow(/row stride must contain every embedding dimension/);
  }
  expect(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], byteOffset: 4}]},
        'fixture'
      ),
    'physical offsets cannot silently diverge from the imported view'
  ).toThrow(/byte offset must match/);
  expect(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], rowStride: 3}]},
        'fixture'
      ),
    'padded rows must fit inside the declared flat view'
  ).toThrow(/rows exceed their declared/);
  expect(
    () => validateGPUClusteringEmbeddingMatrix({...matrix, rowCount: 1}, 'fixture'),
    'matrix and chunk row totals must agree exactly'
  ).toThrow(/row count must match the sum/);
  expect(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], sourceRowOffset: 0xffffffff}]},
        'fixture'
      ),
    'implicit source IDs cannot enter the reserved invalid-ID range'
  ).toThrow(/source rows must fit below/);

  const shortValidity = {
    ...values,
    format: 'uint32',
    length: 1
  } as GraphDataView<'uint32'>;
  expect(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], validity: shortValidity}]},
        'fixture'
      ),
    'optional GPU metadata must cover every source row'
  ).toThrow(/validity flags must contain one value per source row/);
});

it('luVS clustering bounds every independently aligned row-parallel scalar binding', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  device.limits.maxStorageBufferBindingSize = 512;
  const graph = new GPUCommandGraph(device, {id: 'clustering-independent-scalar-alignment'});
  const buffers = [512, 516, 764, 764, 516].map((byteLength, bufferIndex) =>
    device.createBuffer({
      id: `clustering-aligned-buffer-${bufferIndex}`,
      byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    })
  );
  const handles = buffers.map((buffer, bufferIndex) =>
    graph.importBuffer(
      {
        id: `clustering-aligned-handle-${bufferIndex}`,
        byteLength: buffer.byteLength,
        usage: buffer.usage
      },
      buffer
    )
  );
  const values = graph.createDataView(handles[0], {format: 'float32', length: 128});
  const sourceRowIds = graph.createDataView(handles[1], {
    format: 'uint32',
    length: 128,
    byteOffset: 4
  });
  const validity = graph.createDataView(handles[2], {
    format: 'uint32',
    length: 128,
    byteOffset: 252
  });
  const labels = graph.createDataView(handles[3], {
    format: 'uint32',
    length: 128,
    byteOffset: 252
  });
  const filter = graph.createDataView(handles[4], {
    format: 'uint32',
    length: 128,
    byteOffset: 4
  });
  const matrix: GraphEmbeddingMatrix = {
    dimensions: 1,
    rowCount: 128,
    chunks: [
      {
        values,
        rowCount: 128,
        rowStride: 1,
        byteOffset: 0,
        sourceRowOffset: 0,
        sourceRowIds,
        validity
      }
    ]
  };

  try {
    const tiles = getGPUClusteringMatrixTiles(graph, matrix);
    expect(tiles.map(tile => tile.rowCount)).toEqual([65, 63]);
    for (const tile of tiles) {
      const views = [
        tile.values,
        tile.sourceRowIds!,
        tile.validity!,
        getGPUClusteringTileRowView(graph, labels, tile),
        getGPUClusteringTileRowView(graph, filter, tile)
      ];
      expect(
        Boolean(views.every(view => getViewBindingRange(view).size <= 512)),
        'embedding values, source IDs, validity, labels, and filters all fit the binding limit'
      ).toBe(true);
    }
  } finally {
    for (const buffer of buffers) buffer.destroy();
    device.destroy();
  }
});
