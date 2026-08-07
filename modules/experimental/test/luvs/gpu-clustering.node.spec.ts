// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {GraphDataView} from '../../src/gpu-primitives/gpu-command-graph';
import {
  GPU_CLUSTERING_WORKGROUP_SIZE,
  getGPUClusteringDispatchLayout,
  getGPUClusteringInvocationIndexSource,
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
