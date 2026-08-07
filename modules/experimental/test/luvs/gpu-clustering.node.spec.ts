// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {GPUCommandGraph, type GraphDataView} from '../../src/gpu-primitives/gpu-command-graph';
import {getViewBindingRange} from '../../src/gpu-primitives/graph-data-view-utils';
import {
  GPU_CLUSTERING_WORKGROUP_SIZE,
  getGPUClusteringDispatchLayout,
  getGPUClusteringInvocationIndexSource,
  getGPUClusteringMatrixTiles,
  getGPUClusteringTileRowView,
  validateGPUClusteringEmbeddingMatrix
} from '../../src/luvs/gpu-clustering-utils';
import type {GraphEmbeddingMatrix} from '../../src/luvs/types';

test('luVS clustering uses bounded multidimensional dispatch without uint32 wraparound', t => {
  t.equal(GPU_CLUSTERING_WORKGROUP_SIZE, 64, 'workgroups fit portable WebGPU limits');
  t.deepEqual(getGPUClusteringDispatchLayout('k-means', 0, 2), {x: 1, y: 1, z: 1});
  t.deepEqual(getGPUClusteringDispatchLayout('k-means', 2 * 64 + 1, 2), {
    x: 2,
    y: 2,
    z: 1
  });
  t.deepEqual(getGPUClusteringDispatchLayout('k-means', 4 * 64 + 1, 2), {
    x: 2,
    y: 2,
    z: 2
  });
  t.throws(
    () => getGPUClusteringDispatchLayout('k-means', 8 * 64 + 1, 2),
    /exceeding the 3D dispatch limit/
  );

  const source = getGPUClusteringInvocationIndexSource({x: 2, y: 2, z: 2});
  t.match(source, /workgroupId\.z \* 2u \+ workgroupId\.y/);
  t.match(source, /\* 2u \+ workgroupId\.x/);
  t.ok(
    source.indexOf('workgroupIndex >= 67108864u') <
      source.indexOf('workgroupIndex * 64u + localInvocationIndex'),
    'the overflow guard executes before index multiplication'
  );
  t.end();
});

test('luVS clustering rejects malformed direct graph matrices before tiling or allocation', t => {
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

  t.doesNotThrow(() => validateGPUClusteringEmbeddingMatrix(matrix, 'fixture'));
  for (const dimensions of [0, -1, 1.5, Number.NaN]) {
    t.throws(
      () => validateGPUClusteringEmbeddingMatrix({...matrix, dimensions}, 'fixture'),
      /dimensions must be a positive uint32 integer/,
      `${dimensions} embedding dimensions are rejected before any tile loop`
    );
  }
  for (const rowCount of [-1, 1.5, Number.POSITIVE_INFINITY]) {
    t.throws(
      () => validateGPUClusteringEmbeddingMatrix({...matrix, rowCount}, 'fixture'),
      /row count must be a non-negative uint32 integer/,
      `${rowCount} logical rows are rejected`
    );
  }
  for (const rowStride of [0, -1, 1, 1.5]) {
    t.throws(
      () =>
        validateGPUClusteringEmbeddingMatrix(
          {...matrix, chunks: [{...matrix.chunks[0], rowStride}]},
          'fixture'
        ),
      /row stride must contain every embedding dimension/,
      `${rowStride} cannot advance a complete embedding row`
    );
  }
  t.throws(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], byteOffset: 4}]},
        'fixture'
      ),
    /byte offset must match/,
    'physical offsets cannot silently diverge from the imported view'
  );
  t.throws(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], rowStride: 3}]},
        'fixture'
      ),
    /rows exceed their declared/,
    'padded rows must fit inside the declared flat view'
  );
  t.throws(
    () => validateGPUClusteringEmbeddingMatrix({...matrix, rowCount: 1}, 'fixture'),
    /row count must match the sum/,
    'matrix and chunk row totals must agree exactly'
  );
  t.throws(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], sourceRowOffset: 0xffffffff}]},
        'fixture'
      ),
    /source rows must fit below/,
    'implicit source IDs cannot enter the reserved invalid-ID range'
  );

  const shortValidity = {
    ...values,
    format: 'uint32',
    length: 1
  } as GraphDataView<'uint32'>;
  t.throws(
    () =>
      validateGPUClusteringEmbeddingMatrix(
        {...matrix, chunks: [{...matrix.chunks[0], validity: shortValidity}]},
        'fixture'
      ),
    /validity flags must contain one value per source row/,
    'optional GPU metadata must cover every source row'
  );
  t.end();
});

test('luVS clustering bounds every independently aligned row-parallel scalar binding', t => {
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
    t.deepEqual(
      tiles.map(tile => tile.rowCount),
      [65, 63]
    );
    for (const tile of tiles) {
      const views = [
        tile.values,
        tile.sourceRowIds!,
        tile.validity!,
        getGPUClusteringTileRowView(graph, labels, tile),
        getGPUClusteringTileRowView(graph, filter, tile)
      ];
      t.ok(
        views.every(view => getViewBindingRange(view).size <= 512),
        'embedding values, source IDs, validity, labels, and filters all fit the binding limit'
      );
    }
  } finally {
    for (const buffer of buffers) buffer.destroy();
    device.destroy();
  }
  t.end();
});
