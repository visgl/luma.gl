// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Device} from '@luma.gl/core';
import {GPUSplatGraphRenderer, makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {getTestDevices} from '@luma.gl/test-utils';

it('GPUSplatGraphRenderer progressively sorts preserved batches with one precompiled graph', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(Boolean(devices.length > 0), 'a browser WebGPU adapter is available').toBe(true);

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

    expect(renderer.compiledGraph, 'does not compile an empty anticipated graph').toBe(undefined);
    renderer.appendData(firstBatch);
    await verifyProgressiveFrame(device, renderer, [1, 0], [2, 3, 4, 5]);
    const initialCompiledGraph = renderer.compiledGraph;
    expect(
      Boolean(initialCompiledGraph),
      'compiles the graph when its first streamed batch is encoded'
    ).toBe(true);
    expect(
      Boolean((renderer.sortedIndexBuffer?.byteLength ?? 0) >= 6 * Uint32Array.BYTES_PER_ELEMENT),
      'reserves enough globally sorted records for the complete anticipated scene'
    ).toBe(true);

    renderer.appendData(secondBatch);
    await verifyProgressiveFrame(device, renderer, [1, 2, 3, 0], [4, 5]);
    expect(
      renderer.compiledGraph,
      'binds the second independent source batch into the existing compiled graph'
    ).toBe(initialCompiledGraph);

    renderer.appendData(thirdBatch);
    expect(thirdBatch.colors.format, 'preserves streamed HDR radiance as Float32').toBe(
      'float32x4'
    );
    expect(renderer.props.toneMapping, 'automatically tone-maps streamed HDR colors').toBe(
      'reinhard'
    );
    await verifyProgressiveFrame(device, renderer, [4, 1, 2, 3, 0, 5]);
    expect(
      renderer.compiledGraph,
      'reuses one compiled graph across all three progressive source uploads'
    ).toBe(initialCompiledGraph);
    expect(
      renderer.batches.map(batch => batch.positions.data[0].buffer),
      'projects the original caller-owned source allocations without repacking or copying'
    ).toEqual(sourceBuffers);
    expect(
      renderer.encode(device.commandEncoder),
      'does not repeat GPU projection or global sorting after streaming and camera motion stop'
    ).toBe(undefined);

    firstBatch.updateRows(0, {positions: new Float32Array([0, 0, 0.98])});
    await verifyProgressiveFrame(device, renderer, [0, 4, 1, 2, 3, 5]);
    expect(
      renderer.compiledGraph,
      'reprojects dynamic source updates without rebuilding the compiled command graph'
    ).toBe(initialCompiledGraph);
    expect(
      firstBatch.positions.data[0].buffer,
      'retains the original dynamically updated source allocation'
    ).toBe(sourceBuffers[0]);
    expect(
      renderer.encode(device.commandEncoder),
      'returns to an unchanged graph after encoding the updated source revision'
    ).toBe(undefined);

    renderer.destroy();
    for (const sourceBuffer of sourceBuffers) {
      expect(
        Boolean(sourceBuffer.destroyed),
        'destroying graph slots never destroys borrowed source data'
      ).toBe(false);
    }
    firstBatch.destroy();
    secondBatch.destroy();
    thirdBatch.destroy();
  }

  void 0;
});

it('GPUSplatGraphRenderer sorts progressive culled rows and reserved slots after visible rows', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(Boolean(devices.length > 0), 'a browser WebGPU adapter is available').toBe(true);

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
    await verifyProgressiveFrame(device, renderer, [2, 0], [1, 3, 4, 5]);
    const initialCompiledGraph = renderer.compiledGraph;

    renderer.appendData(secondBatch);
    await verifyProgressiveFrame(device, renderer, [3, 2, 0], [1, 4, 5]);
    expect(
      renderer.compiledGraph,
      'reuses reserved batch bindings while visibility changes between progressive frames'
    ).toBe(initialCompiledGraph);

    renderer.destroy();
    expect(
      Boolean(firstBatch.destroyed),
      'retains first caller-owned batch after destroying placeholders'
    ).toBe(false);
    expect(
      Boolean(secondBatch.destroyed),
      'retains second caller-owned batch after destroying placeholders'
    ).toBe(false);
    firstBatch.destroy();
    secondBatch.destroy();
  }

  void 0;
});

it('GPUSplatGraphRenderer grows unknown progressive capacity geometrically', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(Boolean(devices.length > 0), 'a browser WebGPU adapter is available').toBe(true);

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
      expect(
        Boolean(renderer.encode(device.commandEncoder)),
        'encodes each progressively available frame'
      ).toBe(true);
      device.submit();
      if (renderer.compiledGraph) {
        compiledGraphs.add(renderer.compiledGraph);
      }
      const sortedRecordCapacity =
        (renderer.sortedIndexBuffer?.byteLength ?? 0) / Uint32Array.BYTES_PER_ELEMENT;
      sortedRecordCapacities.push(sortedRecordCapacity);
      expect(
        Boolean(sortedRecordCapacity >= batchIndex + 1),
        'never sorts beyond allocated scene capacity'
      ).toBe(true);
    }

    expect(
      Boolean(compiledGraphs.size < streamedBatches.length),
      'geometric capacity growth avoids rebuilding the graph for every streamed batch'
    ).toBe(true);
    expect(
      Boolean(sortedRecordCapacities[0] >= streamedBatches[0].length * 4),
      'unknown scene sizes reserve at least four times the first streamed batch length'
    ).toBe(true);
    expect(
      Boolean(
        sortedRecordCapacities.every(
          (capacity, capacityIndex) =>
            capacityIndex === 0 || capacity >= sortedRecordCapacities[capacityIndex - 1]
        )
      ),
      'progressive scene capacity never shrinks while source batches are appended'
    ).toBe(true);

    await verifySubmittedProgressiveBuffers(device, renderer, [5, 4, 3, 2, 1, 0]);
    renderer.destroy();
    for (const batch of streamedBatches) {
      expect(
        Boolean(batch.destroyed),
        'capacity growth retains caller ownership of every source batch'
      ).toBe(false);
      batch.destroy();
    }
  }

  void 0;
});

it('GPUSplatGraphRenderer safely outgrows underestimated progressive scene hints', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(Boolean(devices.length > 0), 'a browser WebGPU adapter is available').toBe(true);

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
    await verifyProgressiveFrame(device, renderer, [0]);
    const originalCompiledGraph = renderer.compiledGraph;

    renderer.appendData(streamedBatches[1]);
    renderer.appendData(streamedBatches[2]);
    await verifyProgressiveFrame(device, renderer, [1, 2, 0], [3]);
    const grownCompiledGraph = renderer.compiledGraph;
    expect(
      grownCompiledGraph,
      'rebuilds the underestimated graph once after accumulated source rows and slots overflow'
    ).not.toBe(originalCompiledGraph);
    expect(
      Boolean((renderer.sortedIndexBuffer?.byteLength ?? 0) >= 4 * Uint32Array.BYTES_PER_ELEMENT),
      'geometrically reserves space beyond the underestimated initial scene capacity'
    ).toBe(true);

    renderer.appendData(streamedBatches[3]);
    await verifyProgressiveFrame(device, renderer, [1, 3, 2, 0]);
    expect(
      renderer.compiledGraph,
      'reuses the grown graph when another streamed batch fits its expanded capacities'
    ).toBe(grownCompiledGraph);

    renderer.destroy();
    for (const [batchIndex, sourceBuffer] of sourceBuffers.entries()) {
      expect(
        Boolean(sourceBuffer.destroyed),
        'growth never destroys a caller-owned source allocation'
      ).toBe(false);
      streamedBatches[batchIndex].destroy();
    }
  }

  void 0;
});

async function verifyProgressiveFrame(
  device: Device,
  renderer: GPUSplatGraphRenderer,
  expectedVisibleIndices: readonly number[],
  expectedSentinelIndices: readonly number[] = []
): Promise<void> {
  expect(Boolean(renderer.encode(device.commandEncoder)), 'encodes the newly appended batch').toBe(
    true
  );
  device.submit();
  await verifySubmittedProgressiveBuffers(
    device,
    renderer,
    expectedVisibleIndices,
    expectedSentinelIndices
  );
}

async function verifySubmittedProgressiveBuffers(
  device: Device,
  renderer: GPUSplatGraphRenderer,
  expectedVisibleIndices: readonly number[],
  expectedSentinelIndices: readonly number[] = []
): Promise<void> {
  if (isSoftwareBackedProgressiveDevice(device)) {
    void 0;
    return;
  }

  const commandBytes = await renderer.drawCommands.buffer.readAsync();
  const commandWords = new Uint32Array(
    commandBytes.buffer,
    commandBytes.byteOffset,
    commandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  expect(
    Array.from(commandWords),
    'GPU projection publishes the exact visible progressive instance count'
  ).toEqual([4, expectedVisibleIndices.length, 0, 0]);

  const sortedIndexBytes = await renderer.sortedIndexBuffer!.readAsync();
  const sortedIndices = new Uint32Array(
    sortedIndexBytes.buffer,
    sortedIndexBytes.byteOffset,
    sortedIndexBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  expect(
    Array.from(sortedIndices.subarray(0, expectedVisibleIndices.length)),
    'globally sorts every visible progressive batch far-to-near with stable ties'
  ).toEqual(expectedVisibleIndices);
  if (expectedSentinelIndices.length > 0) {
    expect(
      Array.from(
        sortedIndices.subarray(
          expectedVisibleIndices.length,
          expectedVisibleIndices.length + expectedSentinelIndices.length
        )
      ),
      'places culled rows and currently inactive reserved slots after every visible row'
    ).toEqual(expectedSentinelIndices);
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
