import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector, type FixedSizeList} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {importGPUEmbeddingVector} from '../../src/gpu-vector-search/embedding-matrix';
import {GPUKMeans} from '../../src/gpu-vector-search/gpu-k-means';
import type {GraphEmbeddingMatrix} from '../../src/gpu-vector-search/types';

const INVALID_CLUSTER_LABEL = 0xffffffff;

it('GPUKMeans trains deterministic centroids across padded, nullable, and empty chunks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'luvs-k-means-padded'});
  const buffers: Buffer[] = [];
  const dataset = createEmbeddingView(graph, buffers, [
    {
      values: Float32Array.from([777, 0, 0, 99, 0.2, 0.1, 99, Number.NaN, 2]),
      byteOffset: Float32Array.BYTES_PER_ELEMENT,
      rowCount: 3,
      rowStride: 3
    },
    {values: new Float32Array(0), rowCount: 0, rowStride: 2},
    {
      values: Float32Array.from([10, 10, 10.2, 9.8, -0.1, 0, 99, 99]),
      rowCount: 4,
      rowStride: 2,
      validity: Uint32Array.from([1, 1, 1, 0])
    }
  ]);
  const centroids = createView(graph, buffers, 'centroids', 'float32', 4);
  const counts = createView(graph, buffers, 'counts', 'uint32', 2);
  const status = createView(graph, buffers, 'status', 'uint32', 3);
  const labelChunks = dataset.chunks.map((chunk, chunkIndex) =>
    createView(graph, buffers, `labels-${chunkIndex}`, 'uint32', chunk.rowCount)
  );
  const labels = new GraphVectorView({
    id: 'labels',
    name: 'labels',
    format: 'uint32',
    length: dataset.rowCount,
    valueLength: dataset.rowCount,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data: labelChunks
  });

  const clustering = new GPUKMeans({
    id: 'padded-k-means',
    dataset,
    clusterCount: 2,
    centroids,
    labels,
    counts,
    status,
    maxIterations: 4
  });
  clustering.addToGraph(graph);
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'luvs-k-means-padded-encoder'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());

    const labelValues = (
      await Promise.all(
        labelChunks.map(async (chunk, chunkIndex) =>
          readUnsigned(buffers[7 + chunkIndex], chunk.length)
        )
      )
    ).flat();
    const centroidValues = await readFloating(buffers[4], 4);
    expect(
      labelValues,
      'nullable and non-finite rows are excluded without changing source chunk topology'
    ).toEqual([0, 0, INVALID_CLUSTER_LABEL, 1, 1, 0, INVALID_CLUSTER_LABEL]);
    expect(await readUnsigned(buffers[5], 2), 'cluster counts ignore invalid rows').toEqual([3, 2]);
    expect(
      Boolean(Math.abs(centroidValues[0] - 1 / 30) < 1e-6),
      'low-cluster x centroid is deterministic'
    ).toBe(true);
    expect(
      Boolean(Math.abs(centroidValues[1] - 1 / 30) < 1e-6),
      'low-cluster y centroid is deterministic'
    ).toBe(true);
    expect(
      Boolean(Math.abs(centroidValues[2] - 10.1) < 1e-5),
      'high-cluster x centroid is accurate'
    ).toBe(true);
    expect(
      Boolean(Math.abs(centroidValues[3] - 9.9) < 1e-5),
      'high-cluster y centroid is accurate'
    ).toBe(true);
    expect(
      await readUnsigned(buffers[6], 3),
      'GPU status reports two executed iterations and deterministic convergence'
    ).toEqual([2, 0, 1]);

    const repeatedEncoder = device.createCommandEncoder({id: 'luvs-k-means-repeat'});
    compiled.encode(repeatedEncoder, {parameters: undefined});
    device.submit(repeatedEncoder.finish());
    expect(
      await readUnsigned(buffers[5], 2),
      'repeated graph encoding rebuilds the same deterministic clusters'
    ).toEqual([3, 2]);
  } finally {
    compiled.destroy();
    for (const buffer of buffers) {
      expect(Boolean(buffer.destroyed), 'the graph does not destroy caller-owned resources').toBe(
        false
      );
      buffer.destroy();
    }
  }
});

it('GPUKMeans preserves empty clusters and rejects overlapping writable outputs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'luvs-k-means-empty-clusters'});
  const buffers: Buffer[] = [];
  const dataset = createEmbeddingView(graph, buffers, [
    {values: Float32Array.from([4, 5]), rowCount: 1, rowStride: 2}
  ]);
  const centroids = createView(graph, buffers, 'centroids', 'float32', 6);
  const labels = createView(graph, buffers, 'labels', 'uint32', 1);
  const counts = createView(graph, buffers, 'counts', 'uint32', 3);
  const status = createView(graph, buffers, 'status', 'uint32', 3);
  const clusteringProps = {dataset, clusterCount: 3, centroids, labels, counts, status};

  for (const dimensions of [0, -1, 1.5]) {
    expect(
      () =>
        new GPUKMeans({
          ...clusteringProps,
          dataset: {...dataset, dimensions}
        }),
      `direct k-means matrix rejects ${dimensions} dimensions before allocation`
    ).toThrow(/dimensions must be a positive uint32 integer/);
  }
  for (const rowStride of [0, 1]) {
    expect(
      () =>
        new GPUKMeans({
          ...clusteringProps,
          dataset: {...dataset, chunks: [{...dataset.chunks[0], rowStride}]}
        }),
      `direct k-means matrix rejects incomplete stride ${rowStride}`
    ).toThrow(/row stride must contain every embedding dimension/);
  }

  expect(
    () =>
      new GPUKMeans({
        dataset,
        clusterCount: 3,
        centroids,
        labels,
        counts,
        status: counts
      }),
    'caller-owned status and group counts cannot alias'
  ).toThrow(/separate graph buffers/);
  const overlappingLabels = graph.createDataView(dataset.chunks[0].values.buffer, {
    format: 'uint32',
    length: 1
  });
  expect(
    () =>
      new GPUKMeans({
        dataset,
        clusterCount: 3,
        centroids,
        labels: overlappingLabels,
        counts,
        status
      }),
    'writable cluster labels cannot overwrite source embedding components'
  ).toThrow(/must not overlap source embedding data/);

  new GPUKMeans({
    dataset,
    clusterCount: 3,
    centroids,
    labels,
    counts,
    status,
    maxIterations: 3
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'luvs-k-means-empty-clusters-encoder'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await readUnsigned(buffers[3], 3), 'empty clusters have zero members').toEqual([
      1, 0, 0
    ]);
    expect(
      await readFloating(buffers[1], 6),
      'empty clusters retain their deterministic seeded centroid'
    ).toEqual([4, 5, 4, 5, 4, 5]);
    expect(await readUnsigned(buffers[4], 3), 'training converges without readback').toEqual([
      2, 0, 1
    ]);
  } finally {
    compiled.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
});

it('GPUKMeans keeps large finite same-sign centroid coordinates finite', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'luvs-k-means-finite-centroids'});
  const buffers: Buffer[] = [];
  const dataset = createEmbeddingView(graph, buffers, [
    {
      values: Float32Array.from([3e38, -3e38, 3e38, -3e38]),
      rowCount: 2,
      rowStride: 2
    }
  ]);
  const centroids = createView(graph, buffers, 'finite-centroids', 'float32', 2);
  const labels = createView(graph, buffers, 'finite-labels', 'uint32', 2);
  const counts = createView(graph, buffers, 'finite-counts', 'uint32', 1);
  const status = createView(graph, buffers, 'finite-status', 'uint32', 3);
  new GPUKMeans({
    id: 'finite-k-means',
    dataset,
    clusterCount: 1,
    centroids,
    labels,
    counts,
    status,
    maxIterations: 3
  }).addToGraph(graph);
  const compiled = graph.compile();

  try {
    const encoder = device.createCommandEncoder({id: 'finite-centroids-encoder'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());

    const centroidValues = await readFloating(buffers[1], 2);
    expect(
      Boolean(centroidValues.every(Number.isFinite)),
      'finite rows never create infinite centroids'
    ).toBe(true);
    expect(
      Boolean(Math.abs(centroidValues[0] / 3e38 - 1) < 1e-6),
      'positive mean remains near 3e38'
    ).toBe(true);
    expect(
      Boolean(Math.abs(centroidValues[1] / -3e38 - 1) < 1e-6),
      'negative mean remains near -3e38'
    ).toBe(true);
    expect(await readUnsigned(buffers[2], 2), 'both finite rows retain their labels').toEqual([
      0, 0
    ]);
    expect(await readUnsigned(buffers[3], 1), 'both finite rows remain in the cluster').toEqual([
      2
    ]);
  } finally {
    compiled.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
});

type EmbeddingChunkFixture = {
  values: Float32Array;
  rowCount: number;
  rowStride: number;
  byteOffset?: number;
  validity?: Uint32Array;
};

function createEmbeddingView(
  graph: GPUCommandGraph,
  buffers: Buffer[],
  chunks: EmbeddingChunkFixture[]
): GraphEmbeddingMatrix {
  let sourceRowOffset = 0;
  const matrixChunks = chunks.map((chunk, chunkIndex) => {
    const valueBuffer = graph.device.createBuffer({
      id: `values-${chunkIndex}`,
      data: chunk.values.length > 0 ? chunk.values : new Float32Array(1),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    buffers.push(valueBuffer);
    const byteOffset = chunk.byteOffset ?? 0;
    const valueData = new GPUData<FixedSizeList<'float32', 2>>({
      buffer: valueBuffer,
      format: 'fixed-size-list<float32,2>',
      length: chunk.rowCount,
      byteOffset,
      byteStride: chunk.rowStride * Float32Array.BYTES_PER_ELEMENT
    });
    const values = new GPUVector({
      type: 'data',
      name: `values-${chunkIndex}`,
      format: 'fixed-size-list<float32,2>',
      data: [valueData]
    });
    let validity: GPUVector<'uint32'> | undefined;
    if (chunk.validity) {
      const validityBuffer = graph.device.createBuffer({
        id: `validity-${chunkIndex}`,
        data: chunk.validity,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      buffers.push(validityBuffer);
      validity = new GPUVector({
        type: 'buffer',
        name: `validity-${chunkIndex}`,
        buffer: validityBuffer,
        format: 'uint32',
        length: chunk.rowCount
      });
    }
    const imported = importGPUEmbeddingVector(graph, values, {
      id: `values-${chunkIndex}`,
      sourceRowOffset,
      ...(validity ? {validity} : {})
    });
    sourceRowOffset += chunk.rowCount;
    return imported.chunks[0];
  });
  return {dimensions: 2, rowCount: sourceRowOffset, chunks: matrixChunks};
}

function createView<T extends 'uint32' | 'float32'>(
  graph: GPUCommandGraph,
  buffers: Buffer[],
  id: string,
  format: T,
  length: number
): GraphDataView<T> {
  const buffer = graph.device.createBuffer({
    id,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  buffers.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readUnsigned(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) return [];
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readFloating(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}
