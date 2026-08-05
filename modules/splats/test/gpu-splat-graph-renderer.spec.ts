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
        Array.from(sortedIndices),
        [1, 2, 0, 3],
        'globally sorts visible rows far-to-near and moves the culled sentinel to the end'
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
