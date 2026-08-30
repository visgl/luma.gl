// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type VertexFormat} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUVolumeConnectedComponents,
  GPUVolumeDilation,
  GPUVolumeRegionMeasurements,
  GPUVolumeThreshold
} from '@luma.gl/experimental/lucim';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from '../../../../test/utils/vitest-tape';

test('LuCIM composes threshold, morphology, 3D components, and region bounds without readback', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 3;
  const height = 3;
  const depth = 2;
  const voxelCount = width * height * depth;
  const graph = new GPUCommandGraph(device, {id: 'lucim-volume-pipeline'});
  const source = makeBuffer(
    device,
    Float32Array.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
  );
  const thresholdMask = makeBuffer(device, voxelCount);
  const dilatedMask = makeBuffer(device, voxelCount);
  const morphologyValidity = makeBuffer(device, voxelCount);
  const labels = makeBuffer(device, voxelCount);
  const labelValidity = makeBuffer(device, voxelCount);
  const converged = makeBuffer(device, 1);
  const iterationCount = makeBuffer(device, 1);
  const voxelCounts = makeBuffer(device, voxelCount);
  const minimumCoordinates = makeBuffer(device, voxelCount * 3);
  const maximumCoordinates = makeBuffer(device, voxelCount * 3);
  const overflow = makeBuffer(device, 1);

  const sourceView = importView(graph, 'source', source, 'float32', voxelCount);
  const thresholdView = importView(graph, 'threshold-mask', thresholdMask, 'uint32', voxelCount);
  const dilatedView = importView(graph, 'dilated-mask', dilatedMask, 'uint32', voxelCount);
  const morphologyValidityView = importView(
    graph,
    'morphology-validity',
    morphologyValidity,
    'uint32',
    voxelCount
  );
  const labelView = importView(graph, 'labels', labels, 'uint32', voxelCount);
  const labelValidityView = importView(
    graph,
    'label-validity',
    labelValidity,
    'uint32',
    voxelCount
  );

  new GPUVolumeThreshold({
    id: 'select-seeds',
    width,
    height,
    depth,
    input: {id: 'density', format: 'float32', values: sourceView},
    output: thresholdView,
    threshold: 0.5
  }).addToGraph(graph);
  new GPUVolumeDilation({
    id: 'expand-seeds',
    mode: 'binary',
    width,
    height,
    depth,
    radius: 1,
    structuringElement: 'octahedron',
    borderMode: 'constant',
    borderValue: 0,
    input: {id: 'seed-mask', format: 'uint32', values: thresholdView},
    output: dilatedView,
    outputValidity: morphologyValidityView
  }).addToGraph(graph);
  new GPUVolumeConnectedComponents({
    id: 'label-expanded-seeds',
    width,
    height,
    depth,
    input: {
      id: 'expanded-seeds',
      format: 'uint32',
      values: dilatedView,
      validity: morphologyValidityView
    },
    output: labelView,
    outputValidity: labelValidityView,
    converged: importView(graph, 'converged', converged, 'uint32', 1),
    iterationCount: importView(graph, 'iteration-count', iterationCount, 'uint32', 1),
    connectivity: 6,
    maximumIterations: 8
  }).addToGraph(graph);
  new GPUVolumeRegionMeasurements({
    id: 'measure-expanded-seeds',
    width,
    height,
    depth,
    labels: labelView,
    labelValidity: labelValidityView,
    output: {
      voxelCounts: importView(graph, 'voxel-counts', voxelCounts, 'uint32', voxelCount),
      minimumCoordinates: importView(
        graph,
        'minimum-coordinates',
        minimumCoordinates,
        'uint32x3',
        voxelCount
      ),
      maximumCoordinates: importView(
        graph,
        'maximum-coordinates',
        maximumCoordinates,
        'uint32x3',
        voxelCount
      )
    },
    overflow: importView(graph, 'overflow', overflow, 'uint32', 1)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'lucim-volume-pipeline'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  testCase.deepEqual(
    await readUint32(thresholdMask, voxelCount),
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    'threshold publishes two canonical seed voxels'
  );
  testCase.deepEqual(
    await readUint32(dilatedMask, voxelCount),
    [1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1],
    'octahedral dilation expands each corner through face neighbors'
  );
  testCase.deepEqual(
    await readUint32(labels, voxelCount),
    [1, 1, 0, 1, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 9, 0, 9, 9],
    'six-connectivity publishes deterministic sparse minimum-root labels'
  );
  testCase.equal((await readUint32(converged, 1))[0], 1, 'component rounds converge');
  testCase.ok(
    (await readUint32(iterationCount, 1))[0]! <= 8,
    'component rounds stay within the explicit budget'
  );

  const counts = await readUint32(voxelCounts, voxelCount);
  testCase.equal(counts[0], 4, 'first sparse root owns four voxels');
  testCase.equal(counts[8], 4, 'second sparse root owns four voxels');
  testCase.equal(
    counts.reduce((sum, count) => sum + count, 0),
    8,
    'background and empty sparse slots do not contribute'
  );
  const minimums = await readUint32(minimumCoordinates, voxelCount * 3);
  const maximums = await readUint32(maximumCoordinates, voxelCount * 3);
  testCase.deepEqual(minimums.slice(0, 3), [0, 0, 0], 'first component minimum is exact');
  testCase.deepEqual(maximums.slice(0, 3), [2, 2, 2], 'first exclusive maximum is exact');
  testCase.deepEqual(minimums.slice(8 * 3, 9 * 3), [1, 1, 0], 'second minimum is exact');
  testCase.deepEqual(maximums.slice(8 * 3, 9 * 3), [3, 3, 2], 'second maximum is exact');
  testCase.equal((await readUint32(overflow, 1))[0], 0, 'measurement capacity is sufficient');

  compiled.destroy();
  testCase.notOk(source.destroyed, 'compiled graph borrows the source volume');
  for (const buffer of [
    source,
    thresholdMask,
    dilatedMask,
    morphologyValidity,
    labels,
    labelValidity,
    converged,
    iterationCount,
    voxelCounts,
    minimumCoordinates,
    maximumCoordinates,
    overflow
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

function makeBuffer(device: Device, dataOrLength: Float32Array | number): Buffer {
  const usage = Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST;
  return typeof dataOrLength === 'number'
    ? device.createBuffer({byteLength: Math.max(dataOrLength, 1) * 4, usage})
    : device.createBuffer({data: dataOrLength, usage});
}

function importView<Format extends VertexFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
