// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {Device} from '@luma.gl/core';
import {GPUSplatGraphRenderer, makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {getTestDevices} from '@luma.gl/test-utils';

test('GPUSplatGraphRenderer projects, culls, globally sorts, and indirectly draws preserved WebGPU batches', async t => {
  const devices = await getTestDevices(['webgpu']);
  t.ok(devices.length > 0, 'a browser WebGPU adapter is available');

  for (const device of devices) {
    const firstBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.2, 0.9], 0));
    const secondSource = makeBrowserGraphSplatSource([0.6, 0.4], 2);
    secondSource.opacities[1] = 0;
    const secondBatch = makeGPUSplatData(device, secondSource);
    const renderer = new GPUSplatGraphRenderer(device, {
      data: [firstBatch, secondBatch],
      viewportSize: [32, 32],
      alphaCutoff: 0.01,
      clearColor: [0, 0, 0, 0]
    });

    const encoding = renderer.encode(device.commandEncoder);
    t.ok(
      encoding,
      'encodes every projection, global sort, and render node into the caller encoder'
    );
    t.ok(
      renderer.compiledGraph?.stats.nodeOrder.includes('gaussian-splat-project-batch-0'),
      'projects the first preserved source batch on the GPU'
    );
    t.ok(
      renderer.compiledGraph?.stats.nodeOrder.includes('gaussian-splat-project-batch-1'),
      'projects the second preserved source batch on the GPU'
    );
    t.ok(
      renderer.compiledGraph?.stats.nodeOrder.includes('gaussian-splat-indirect-render'),
      'schedules exactly one graph-native indirect render pass'
    );
    t.equal(
      renderer.stats.drawCallCount,
      1,
      'renders all source batches through one indirect draw'
    );
    device.submit();

    if (isSoftwareBackedGraphDevice(device)) {
      t.comment('Skipping Gaussian splat GPU buffer readback on a software-backed adapter');
    } else {
      const commandBytes = await renderer.drawCommands.buffer.readAsync();
      const commandWords = new Uint32Array(
        commandBytes.buffer,
        commandBytes.byteOffset,
        commandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      t.deepEqual(
        Array.from(commandWords),
        [4, 3, 0, 0],
        'GPU projection publishes three visible quad instances into its indirect command'
      );

      const sortedIndexBytes = await renderer.sortedIndexBuffer!.readAsync();
      const sortedIndices = new Uint32Array(
        sortedIndexBytes.buffer,
        sortedIndexBytes.byteOffset,
        sortedIndexBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      t.deepEqual(
        Array.from(sortedIndices.slice(0, 4)),
        [1, 2, 0, 3],
        'globally sorts visible rows far-to-near and moves the culled sentinel to the end'
      );
      t.deepEqual(
        Array.from(sortedIndices.slice(4)),
        [4, 5, 6, 7],
        'retains inactive reserved row identifiers behind every populated source row'
      );
    }

    t.equal(
      renderer.encode(device.commandEncoder),
      undefined,
      'does not repeat GPU projection and sorting when the camera remains stationary'
    );
    const previousGraph = renderer.compiledGraph;
    renderer.setProps({radiusScale: 1.5});
    t.ok(renderer.encode(device.commandEncoder), 'encodes updated camera/style uniforms');
    t.equal(
      renderer.compiledGraph,
      previousGraph,
      'reuses the compiled graph for property changes'
    );
    device.submit();

    const firstPositionBuffer = firstBatch.positions.data[0].buffer;
    renderer.destroy();
    t.notOk(
      firstPositionBuffer.destroyed,
      'destroying the renderer preserves borrowed source data'
    );
    firstBatch.destroy();
    secondBatch.destroy();
  }

  t.end();
});

test('GPUSplatGraphRenderer progressively binds borrowed batches without rebuilding its reserved graph', async t => {
  const devices = await getTestDevices(['webgpu']);

  for (const device of devices) {
    const firstBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.2, 0.9], 0));
    const renderer = new GPUSplatGraphRenderer(device, {
      data: firstBatch,
      expectedSplatCount: 6,
      expectedBatchCount: 3,
      viewportSize: [32, 32],
      alphaCutoff: 0.01
    });
    t.ok(renderer.encode(device.commandEncoder), 'renders the first streamed source batch');
    device.submit();
    const originalGraph = renderer.compiledGraph;
    t.deepEqual(renderer.capacity, {splatCount: 6, batchCount: 3}, 'reserves exact stream totals');
    await assertVisibleGraphInstanceCount(t, device, renderer, 2);

    const secondSource = makeBrowserGraphSplatSource([0.6, 0.4], 2);
    secondSource.colors = new Float32Array([2, 0.5, 0.25, 1, 3, 1, 0.5, 1]);
    secondSource.opacities[1] = 0;
    const secondBatch = makeGPUSplatData(device, secondSource);
    renderer.appendData(secondBatch);
    t.ok(renderer.encode(device.commandEncoder), 'renders the newly appended Float32 HDR batch');
    device.submit();
    t.equal(
      renderer.compiledGraph,
      originalGraph,
      'reuses the original graph for the second batch'
    );
    t.equal(renderer.props.toneMapping, 'reinhard', 'adapts mixed HDR source colors on SDR');
    await assertVisibleGraphInstanceCount(t, device, renderer, 3);

    const thirdBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.75, 0.3], 4));
    renderer.appendData(thirdBatch);
    t.ok(renderer.encode(device.commandEncoder), 'renders the final appended Uint8 source batch');
    device.submit();
    t.equal(renderer.compiledGraph, originalGraph, 'still uses the graph compiled for batch one');
    await assertVisibleGraphInstanceCount(t, device, renderer, 5);
    if (!isSoftwareBackedGraphDevice(device)) {
      const sortedBytes = await renderer.sortedIndexBuffer!.readAsync();
      const sortedIndices = new Uint32Array(
        sortedBytes.buffer,
        sortedBytes.byteOffset,
        sortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      t.deepEqual(
        Array.from(sortedIndices),
        [1, 4, 2, 5, 0, 3],
        'globally sorts three original mixed-format batches and retains the culled sentinel last'
      );
    }

    const firstSourceBuffer = firstBatch.positions.data[0].buffer;
    const secondSourceBuffer = secondBatch.colors.data[0].buffer;
    renderer.destroy();
    t.notOk(firstSourceBuffer.destroyed, 'preserves the original borrowed first source allocation');
    t.notOk(secondSourceBuffer.destroyed, 'preserves the original borrowed HDR color allocation');
    firstBatch.destroy();
    secondBatch.destroy();
    thirdBatch.destroy();
  }

  t.end();
});

test('GPUSplatGraphRenderer grows unknown stream capacity geometrically', async t => {
  const devices = await getTestDevices(['webgpu']);

  for (const device of devices) {
    const batches = [makeGPUSplatData(device, makeBrowserGraphSplatSource([0.1], 0))];
    const renderer = new GPUSplatGraphRenderer(device, {
      data: batches[0],
      viewportSize: [32, 32]
    });
    renderer.encode(device.commandEncoder);
    device.submit();
    const initialGraph = renderer.compiledGraph;
    t.deepEqual(renderer.capacity, {splatCount: 4, batchCount: 4}, 'reserves four unknown slots');

    for (let batchIndex = 1; batchIndex < 4; batchIndex++) {
      const batch = makeGPUSplatData(
        device,
        makeBrowserGraphSplatSource([0.1 + batchIndex * 0.1], batchIndex)
      );
      batches.push(batch);
      renderer.appendData(batch);
      renderer.encode(device.commandEncoder);
      device.submit();
      t.equal(renderer.compiledGraph, initialGraph, 'keeps the graph until its capacity fills');
    }

    const overflowBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.8], 4));
    batches.push(overflowBatch);
    renderer.appendData(overflowBatch);
    renderer.encode(device.commandEncoder);
    device.submit();
    t.notEqual(renderer.compiledGraph, initialGraph, 'rebuilds once when both capacities overflow');
    t.deepEqual(
      renderer.capacity,
      {splatCount: 8, batchCount: 8},
      'doubles reserved row and slot capacity'
    );

    renderer.destroy();
    for (const batch of batches) {
      batch.destroy();
    }
  }

  t.end();
});

async function assertVisibleGraphInstanceCount(
  assertion: {equal: (actual: number, expected: number, message: string) => void},
  device: Device,
  renderer: GPUSplatGraphRenderer,
  expectedCount: number
): Promise<void> {
  if (isSoftwareBackedGraphDevice(device)) {
    return;
  }
  const commandBytes = await renderer.drawCommands.buffer.readAsync();
  const commandWords = new Uint32Array(
    commandBytes.buffer,
    commandBytes.byteOffset,
    commandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  assertion.equal(
    commandWords[1],
    expectedCount,
    `GPU culling publishes ${expectedCount} progressive indirect-draw instances`
  );
}

function isSoftwareBackedGraphDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

function makeBrowserGraphSplatSource(depths: readonly number[], rowIndexBase: number): SplatSource {
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
