// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {type Test} from 'test/utils/vitest-tape';
import type {Device} from '@luma.gl/core';
import {GPUSplatGraphRenderer, makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {getTestDevices} from '@luma.gl/test-utils';

test('GPUSplatGraphRenderer progressively sorts preserved batches with one precompiled graph', async t => {
  const devices = await getTestDevices(['webgpu']);
  t.ok(devices.length > 0, 'a browser WebGPU adapter is available');

  for (const device of devices) {
    const firstBatch = makeGPUSplatData(device, makeProgressiveSplatSource([0.2, 0.8], 0));
    const secondBatch = makeGPUSplatData(device, makeProgressiveSplatSource([0.8, 0.4], 2));
    const highDynamicRangeSource = makeProgressiveSplatSource([0.95, 0.1], 4);
    highDynamicRangeSource.colors = new Float32Array([4, 2, 0.5, 1, 2, 1, 0.25, 1]);
    const thirdBatch = makeGPUSplatData(device, highDynamicRangeSource);
    const sourceBuffers = [firstBatch, secondBatch, thirdBatch].map(
      batch => batch.positions.data[0].buffer
    );
    const renderer = new GPUSplatGraphRenderer(device, {
      expectedSplatCount: 6,
      expectedBatchCount: 3,
      viewportSize: [32, 32],
      alphaCutoff: 0.01,
      clearColor: [0, 0, 0, 0]
    });

    t.equal(renderer.compiledGraph, undefined, 'does not compile an empty anticipated graph');
    renderer.appendData(firstBatch);
    await verifyProgressiveFrame(t, device, renderer, [1, 0], [2, 3, 4, 5]);
    const initialCompiledGraph = renderer.compiledGraph;
    t.ok(initialCompiledGraph, 'compiles the graph when its first streamed batch is encoded');
    t.ok(
      (renderer.sortedIndexBuffer?.byteLength ?? 0) >= 6 * Uint32Array.BYTES_PER_ELEMENT,
      'reserves enough globally sorted records for the complete anticipated scene'
    );

    renderer.appendData(secondBatch);
    await verifyProgressiveFrame(t, device, renderer, [1, 2, 3, 0], [4, 5]);
    t.equal(
      renderer.compiledGraph,
      initialCompiledGraph,
      'binds the second independent source batch into the existing compiled graph'
    );

    renderer.appendData(thirdBatch);
    t.equal(thirdBatch.colors.format, 'float32x4', 'preserves streamed HDR radiance as Float32');
    t.equal(renderer.props.toneMapping, 'reinhard', 'automatically tone-maps streamed HDR colors');
    await verifyProgressiveFrame(t, device, renderer, [4, 1, 2, 3, 0, 5]);
    t.equal(
      renderer.compiledGraph,
      initialCompiledGraph,
      'reuses one compiled graph across all three progressive source uploads'
    );
    t.deepEqual(
      renderer.batches.map(batch => batch.positions.data[0].buffer),
      sourceBuffers,
      'projects the original caller-owned source allocations without repacking or copying'
    );
    t.equal(
      renderer.encode(device.commandEncoder),
      undefined,
      'does not repeat GPU projection or global sorting after streaming and camera motion stop'
    );

    renderer.destroy();
    for (const sourceBuffer of sourceBuffers) {
      t.notOk(sourceBuffer.destroyed, 'destroying graph slots never destroys borrowed source data');
    }
    firstBatch.destroy();
    secondBatch.destroy();
    thirdBatch.destroy();
  }

  t.end();
});

test('GPUSplatGraphRenderer sorts progressive culled rows and reserved slots after visible rows', async t => {
  const devices = await getTestDevices(['webgpu']);
  t.ok(devices.length > 0, 'a browser WebGPU adapter is available');

  for (const device of devices) {
    const firstSource = makeProgressiveSplatSource([0.2, 0.8, 0.4], 0);
    firstSource.opacities[1] = 0;
    const firstBatch = makeGPUSplatData(device, firstSource);
    const secondSource = makeProgressiveSplatSource([0.9, 0.6], 3);
    secondSource.positions[3] = Number.NaN;
    const secondBatch = makeGPUSplatData(device, secondSource);
    const renderer = new GPUSplatGraphRenderer(device, {
      expectedSplatCount: 6,
      expectedBatchCount: 2,
      viewportSize: [32, 32],
      alphaCutoff: 0.01,
      clearColor: [0, 0, 0, 0]
    });

    renderer.appendData(firstBatch);
    await verifyProgressiveFrame(t, device, renderer, [2, 0], [1, 3, 4, 5]);
    const initialCompiledGraph = renderer.compiledGraph;

    renderer.appendData(secondBatch);
    await verifyProgressiveFrame(t, device, renderer, [3, 2, 0], [1, 4, 5]);
    t.equal(
      renderer.compiledGraph,
      initialCompiledGraph,
      'reuses reserved batch bindings while visibility changes between progressive frames'
    );

    renderer.destroy();
    t.notOk(firstBatch.destroyed, 'retains first caller-owned batch after destroying placeholders');
    t.notOk(
      secondBatch.destroyed,
      'retains second caller-owned batch after destroying placeholders'
    );
    firstBatch.destroy();
    secondBatch.destroy();
  }

  t.end();
});

test('GPUSplatGraphRenderer grows unknown progressive capacity geometrically', async t => {
  const devices = await getTestDevices(['webgpu']);
  t.ok(devices.length > 0, 'a browser WebGPU adapter is available');

  for (const device of devices) {
    const renderer = new GPUSplatGraphRenderer(device, {
      viewportSize: [32, 32],
      alphaCutoff: 0.01,
      clearColor: [0, 0, 0, 0]
    });
    const streamedBatches = Array.from({length: 6}, (_, rowIndex) =>
      makeGPUSplatData(device, makeProgressiveSplatSource([(rowIndex + 1) / 10], rowIndex))
    );
    const compiledGraphs = new Set<NonNullable<typeof renderer.compiledGraph>>();
    const sortedRecordCapacities: number[] = [];

    for (const [batchIndex, batch] of streamedBatches.entries()) {
      renderer.appendData(batch);
      t.ok(renderer.encode(device.commandEncoder), 'encodes each progressively available frame');
      device.submit();
      if (renderer.compiledGraph) {
        compiledGraphs.add(renderer.compiledGraph);
      }
      const sortedRecordCapacity =
        (renderer.sortedIndexBuffer?.byteLength ?? 0) / Uint32Array.BYTES_PER_ELEMENT;
      sortedRecordCapacities.push(sortedRecordCapacity);
      t.ok(sortedRecordCapacity >= batchIndex + 1, 'never sorts beyond allocated scene capacity');
    }

    t.ok(
      compiledGraphs.size < streamedBatches.length,
      'geometric capacity growth avoids rebuilding the graph for every streamed batch'
    );
    t.ok(
      sortedRecordCapacities[0] >= streamedBatches[0].length * 4,
      'unknown scene sizes reserve at least four times the first streamed batch length'
    );
    t.ok(
      sortedRecordCapacities.every(
        (capacity, capacityIndex) =>
          capacityIndex === 0 || capacity >= sortedRecordCapacities[capacityIndex - 1]
      ),
      'progressive scene capacity never shrinks while source batches are appended'
    );

    await verifySubmittedProgressiveBuffers(t, device, renderer, [5, 4, 3, 2, 1, 0]);
    renderer.destroy();
    for (const batch of streamedBatches) {
      t.notOk(batch.destroyed, 'capacity growth retains caller ownership of every source batch');
      batch.destroy();
    }
  }

  t.end();
});

test('GPUSplatGraphRenderer safely outgrows underestimated progressive scene hints', async t => {
  const devices = await getTestDevices(['webgpu']);
  t.ok(devices.length > 0, 'a browser WebGPU adapter is available');

  for (const device of devices) {
    const streamedBatches = [0.2, 0.9, 0.4, 0.6].map((depth, rowIndex) =>
      makeGPUSplatData(device, makeProgressiveSplatSource([depth], rowIndex))
    );
    const sourceBuffers = streamedBatches.map(batch => batch.positions.data[0].buffer);
    const renderer = new GPUSplatGraphRenderer(device, {
      expectedSplatCount: 1,
      expectedBatchCount: 1,
      viewportSize: [32, 32],
      alphaCutoff: 0.01,
      clearColor: [0, 0, 0, 0]
    });

    renderer.appendData(streamedBatches[0]);
    await verifyProgressiveFrame(t, device, renderer, [0]);
    const originalCompiledGraph = renderer.compiledGraph;

    renderer.appendData(streamedBatches[1]);
    renderer.appendData(streamedBatches[2]);
    await verifyProgressiveFrame(t, device, renderer, [1, 2, 0], [3]);
    const grownCompiledGraph = renderer.compiledGraph;
    t.notEqual(
      grownCompiledGraph,
      originalCompiledGraph,
      'rebuilds the underestimated graph once after accumulated source rows and slots overflow'
    );
    t.ok(
      (renderer.sortedIndexBuffer?.byteLength ?? 0) >= 4 * Uint32Array.BYTES_PER_ELEMENT,
      'geometrically reserves space beyond the underestimated initial scene capacity'
    );

    renderer.appendData(streamedBatches[3]);
    await verifyProgressiveFrame(t, device, renderer, [1, 3, 2, 0]);
    t.equal(
      renderer.compiledGraph,
      grownCompiledGraph,
      'reuses the grown graph when another streamed batch fits its expanded capacities'
    );

    renderer.destroy();
    for (const [batchIndex, sourceBuffer] of sourceBuffers.entries()) {
      t.notOk(sourceBuffer.destroyed, 'growth never destroys a caller-owned source allocation');
      streamedBatches[batchIndex].destroy();
    }
  }

  t.end();
});

async function verifyProgressiveFrame(
  assertions: Test,
  device: Device,
  renderer: GPUSplatGraphRenderer,
  expectedVisibleIndices: readonly number[],
  expectedSentinelIndices: readonly number[] = []
): Promise<void> {
  assertions.ok(renderer.encode(device.commandEncoder), 'encodes the newly appended batch');
  device.submit();
  await verifySubmittedProgressiveBuffers(
    assertions,
    device,
    renderer,
    expectedVisibleIndices,
    expectedSentinelIndices
  );
}

async function verifySubmittedProgressiveBuffers(
  assertions: Test,
  device: Device,
  renderer: GPUSplatGraphRenderer,
  expectedVisibleIndices: readonly number[],
  expectedSentinelIndices: readonly number[] = []
): Promise<void> {
  if (isSoftwareBackedProgressiveDevice(device)) {
    assertions.comment('Skipping progressive Gaussian splat readback on a software-backed adapter');
    return;
  }

  const commandBytes = await renderer.drawCommands.buffer.readAsync();
  const commandWords = new Uint32Array(
    commandBytes.buffer,
    commandBytes.byteOffset,
    commandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  assertions.deepEqual(
    Array.from(commandWords),
    [4, expectedVisibleIndices.length, 0, 0],
    'GPU projection publishes the exact visible progressive instance count'
  );

  const sortedIndexBytes = await renderer.sortedIndexBuffer!.readAsync();
  const sortedIndices = new Uint32Array(
    sortedIndexBytes.buffer,
    sortedIndexBytes.byteOffset,
    sortedIndexBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  assertions.deepEqual(
    Array.from(sortedIndices.subarray(0, expectedVisibleIndices.length)),
    expectedVisibleIndices,
    'globally sorts every visible progressive batch far-to-near with stable ties'
  );
  if (expectedSentinelIndices.length > 0) {
    assertions.deepEqual(
      Array.from(
        sortedIndices.subarray(
          expectedVisibleIndices.length,
          expectedVisibleIndices.length + expectedSentinelIndices.length
        )
      ),
      expectedSentinelIndices,
      'places culled rows and currently inactive reserved slots after every visible row'
    );
  }
}

function isSoftwareBackedProgressiveDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

function makeProgressiveSplatSource(depths: readonly number[], rowIndexBase: number): SplatSource {
  const positions = new Float32Array(depths.length * 3);
  const scales = new Float32Array(depths.length * 3);
  const rotations = new Float32Array(depths.length * 4);
  const colors = new Uint8Array(depths.length * 4);
  const opacities = new Float32Array(depths.length);
  for (const [rowIndex, depth] of depths.entries()) {
    positions[rowIndex * 3 + 2] = depth;
    scales.set([0.2, 0.1, 0.03], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([255, 128, 32, 255], rowIndex * 4);
    opacities[rowIndex] = 1;
  }
  return {positions, scales, rotations, colors, opacities, rowIndexBase};
}
