// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {
  GPUSplatGraphMixedRenderer,
  GPUSplatGraphRenderer,
  makeGPUSplatData,
  type SplatSource
} from '@luma.gl/splats';
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

test('GPUSplatGraphRenderer evaluates higher-order spherical harmonics on real WebGPU buffers', async t => {
  const devices = await getTestDevices(['webgpu']);
  t.ok(devices.length > 0, 'a browser WebGPU adapter is available');

  for (const device of devices) {
    if (isSoftwareBackedGraphDevice(device)) {
      t.comment('Skipping directional Gaussian source readback on a software-backed adapter');
      continue;
    }

    const source = makeBrowserGraphSplatSource([0.5], 0);
    source.colors = new Float32Array([0.5, 0.25, 0.25, 1]);
    source.sphericalHarmonics = new Float32Array(45);
    source.sphericalHarmonics[2 * 3] = 0.75;
    source.sphericalHarmonics[5 * 3 + 1] = 0.5;
    source.sphericalHarmonics[11 * 3 + 2] = 0.5;
    source.sphericalHarmonicsDegree = 3;
    const batch = makeGPUSplatData(device, source);
    const sourceCoefficientBuffer = batch.sphericalHarmonics!.data[0].buffer;
    const renderer = new GPUSplatGraphRenderer(device, {
      data: batch,
      viewportSize: [16, 16],
      cameraPosition: [-1, 0, 0.5],
      sphericalHarmonicsDegree: 1,
      toneMapping: 'none'
    });
    const textureSize = 16;
    const mixedRenderer = new GPUSplatGraphMixedRenderer(renderer, {
      colorAttachmentFormat: 'rgba8unorm',
      depthStencilAttachmentFormat: 'depth24plus'
    });
    const colorTexture = device.createTexture({
      width: textureSize,
      height: textureSize,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: textureSize,
      height: textureSize,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus'
    });
    const pixelLayout = colorTexture.computeMemoryLayout({
      width: textureSize,
      height: textureSize
    });
    const pixelReadback = device.createBuffer({
      byteLength: pixelLayout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const renderDirectionalPixel = async (): Promise<Uint8Array> => {
      mixedRenderer.predraw(device.commandEncoder);
      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      mixedRenderer.draw(renderPass);
      renderPass.end();
      device.submit();
      colorTexture.readBuffer({width: textureSize, height: textureSize}, pixelReadback);
      const pixels = await pixelReadback.readAsync(0, pixelLayout.byteLength);
      const pixelOffset = (textureSize / 2) * pixelLayout.bytesPerRow + (textureSize / 2) * 4;
      return pixels.slice(pixelOffset, pixelOffset + 4);
    };

    renderer.encode(device.commandEncoder);
    device.submit();
    const initialGraph = renderer.compiledGraph;
    const firstRecordBytes = await renderer.projectedRecordBuffer!.readAsync();
    const firstRecord = new Float32Array(
      firstRecordBytes.buffer,
      firstRecordBytes.byteOffset,
      firstRecordBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    const firstRed = firstRecord[8];
    const firstGreen = firstRecord[9];
    t.ok(firstRed < 0.2, 'evaluates negative first-order directional red radiance directly on GPU');
    const firstPixel = await renderDirectionalPixel();

    renderer.setProps({cameraPosition: [1, 0, 0.5]});
    renderer.encode(device.commandEncoder);
    device.submit();
    const secondRecordBytes = await renderer.projectedRecordBuffer!.readAsync();
    const secondRecord = new Float32Array(
      secondRecordBytes.buffer,
      secondRecordBytes.byteOffset,
      secondRecordBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    t.ok(secondRecord[8] > firstRed + 0.7, 'reverses the SH basis when the camera crosses the row');
    t.ok(
      Math.abs(secondRecord[9] - firstGreen) < 0.0001,
      'retains unrelated diffuse color channels'
    );
    const secondPixel = await renderDirectionalPixel();
    t.ok(
      secondPixel[0] > firstPixel[0] + 120,
      'reverses the actual rendered WebGPU pixel as the camera crosses the degree-one Gaussian'
    );
    t.ok(
      Math.abs(secondPixel[1] - firstPixel[1]) < 5,
      'leaves unrelated rendered diffuse channels unchanged across degree-one camera movement'
    );
    t.equal(
      renderer.compiledGraph,
      initialGraph,
      'reuses the graph across camera-direction changes'
    );
    t.equal(batch.sphericalHarmonics?.data[0].buffer, sourceCoefficientBuffer, 'borrows source SH');
    t.deepEqual(
      Array.from(source.colors),
      [0.5, 0.25, 0.25, 1],
      'never rewrites source-owned diffuse radiance'
    );

    renderer.setProps({cameraPosition: [0, 0, -0.5], sphericalHarmonicsDegree: 2});
    renderer.encode(device.commandEncoder);
    device.submit();
    const secondDegreeBytes = await renderer.projectedRecordBuffer!.readAsync();
    const secondDegreeRecord = new Float32Array(
      secondDegreeBytes.buffer,
      secondDegreeBytes.byteOffset,
      secondDegreeBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    t.ok(secondDegreeRecord[9] > 0.55, 'evaluates the complete second-order zonal green basis');
    t.ok(Math.abs(secondDegreeRecord[10] - 0.25) < 0.0001, 'caps third-order blue at degree two');

    renderer.setProps({sphericalHarmonicsDegree: 3});
    renderer.encode(device.commandEncoder);
    device.submit();
    const thirdDegreeBytes = await renderer.projectedRecordBuffer!.readAsync();
    const thirdDegreeRecord = new Float32Array(
      thirdDegreeBytes.buffer,
      thirdDegreeBytes.byteOffset,
      thirdDegreeBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    t.ok(thirdDegreeRecord[10] > 0.6, 'evaluates the complete third-order zonal blue basis');
    t.equal(
      renderer.compiledGraph,
      initialGraph,
      'changes SH degree without recompiling the graph'
    );

    renderer.setProps({sphericalHarmonicsDegree: 0});
    renderer.encode(device.commandEncoder);
    device.submit();
    const restoredRecordBytes = await renderer.projectedRecordBuffer!.readAsync();
    const restoredRecord = new Float32Array(
      restoredRecordBytes.buffer,
      restoredRecordBytes.byteOffset,
      restoredRecordBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    t.ok(
      Math.abs(restoredRecord[8] - 0.5) < 0.0001,
      'restores DC radiance when bands are disabled'
    );

    pixelReadback.destroy();
    mixedRenderer.destroy();
    renderer.destroy();
    t.notOk(sourceCoefficientBuffer.destroyed, 'graph destruction preserves caller-owned SH data');
    batch.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
  }

  t.end();
});

test('GPUSplatGraphRenderer filters semantic rows before the real GPU global sort and indirect draw', async t => {
  const devices = await getTestDevices(['webgpu']);
  t.ok(devices.length > 0, 'a browser WebGPU adapter is available');

  for (const device of devices) {
    if (isSoftwareBackedGraphDevice(device)) {
      t.comment('Skipping semantic Gaussian source readback on a software-backed adapter');
      continue;
    }

    const labeledSource = makeBrowserGraphSplatSource([0.8, 0.2], 0);
    labeledSource.semanticIds = new Uint32Array([3, 7]);
    const labeledBatch = makeGPUSplatData(device, labeledSource);
    const unlabeledBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.5], 2));
    const renderer = new GPUSplatGraphRenderer(device, {
      data: [labeledBatch, unlabeledBatch],
      expectedSplatCount: 5,
      expectedBatchCount: 3,
      viewportSize: [16, 16],
      semanticFilter: {include: [7]}
    });

    renderer.encode(device.commandEncoder);
    device.submit();
    const initialGraph = renderer.compiledGraph;
    await assertVisibleGraphInstanceCount(t, device, renderer, 1);
    let sortedBytes = await renderer.sortedIndexBuffer!.readAsync();
    let sortedIndices = new Uint32Array(
      sortedBytes.buffer,
      sortedBytes.byteOffset,
      sortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    t.equal(sortedIndices[0], 1, 'retains only the included source semantic class before sorting');
    t.ok(
      renderer.graphStats?.nodeOrder.includes('gaussian-splat-features-batch-0'),
      'schedules semantic visibility and SH as a reusable GPU feature node'
    );

    renderer.setProps({semanticFilter: {exclude: new Set([7]), includeUnlabeled: true}});
    renderer.encode(device.commandEncoder);
    device.submit();
    await assertVisibleGraphInstanceCount(t, device, renderer, 2);
    sortedBytes = await renderer.sortedIndexBuffer!.readAsync();
    sortedIndices = new Uint32Array(
      sortedBytes.buffer,
      sortedBytes.byteOffset,
      sortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    t.deepEqual(
      Array.from(sortedIndices.subarray(0, 2)),
      [0, 2],
      'retains accepted labeled and unlabeled rows in their original far-to-near order'
    );
    t.equal(renderer.compiledGraph, initialGraph, 'changes semantic selections without rebuilding');

    renderer.setProps({semanticFilter: undefined});
    renderer.encode(device.commandEncoder);
    device.submit();
    await assertVisibleGraphInstanceCount(t, device, renderer, 3);
    t.equal(
      renderer.compiledGraph,
      initialGraph,
      'restores every source row in the original graph'
    );

    renderer.destroy();
    labeledBatch.destroy();
    unlabeledBatch.destroy();
  }

  t.end();
});

test('GPUSplatGraphRenderer reuses fixed graph slots across bounded residency frontier replacement', async t => {
  const devices = await getTestDevices(['webgpu']);

  for (const device of devices) {
    const firstBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.9, 0.4], 10));
    const secondBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.7], 30));
    const replacementBatch = makeGPUSplatData(device, makeBrowserGraphSplatSource([0.8, 0.2], 100));
    const renderer = new GPUSplatGraphRenderer(device, {
      data: [firstBatch, secondBatch],
      expectedSplatCount: 4,
      expectedBatchCount: 2,
      viewportSize: [16, 16]
    });
    renderer.encode(device.commandEncoder);
    device.submit();
    const originalGraph = renderer.compiledGraph;
    const originalProjectedBuffer = renderer.projectedRecordBuffer;
    const originalSortedBuffer = renderer.sortedIndexBuffer;

    renderer.setProps({data: replacementBatch});
    t.equal(renderer.compiledGraph, originalGraph, 'keeps the compiled graph during page swap');
    renderer.encode(device.commandEncoder);
    device.submit();
    t.equal(
      renderer.compiledGraph,
      originalGraph,
      'reuses fixed source slots after page replacement'
    );
    t.equal(
      renderer.projectedRecordBuffer,
      originalProjectedBuffer,
      'retains projected allocations'
    );
    t.equal(
      renderer.sortedIndexBuffer,
      originalSortedBuffer,
      'retains globally sorted allocations'
    );
    await assertVisibleGraphInstanceCount(t, device, renderer, 2);
    t.deepEqual(renderer.batches, [replacementBatch], 'renders only the caller-selected frontier');
    t.notOk(firstBatch.destroyed, 'never destroys the evicted caller-owned page');
    t.notOk(secondBatch.destroyed, 'never destroys another caller-owned evicted page');

    renderer.setProps({data: []});
    t.equal(renderer.compiledGraph, originalGraph, 'retains the graph across an empty frontier');
    const emptyEncoding = renderer.encode(device.commandEncoder);
    t.equal(emptyEncoding?.stats.nodeCount, 1, 'encodes exactly one empty-frontier clearing pass');
    t.equal(
      emptyEncoding?.stats.nodes[0].id,
      'gaussian-splat-clear',
      'clears previously presented splats when every resident page leaves the frontier'
    );
    device.submit();
    await assertVisibleGraphInstanceCount(t, device, renderer, 0);
    t.equal(
      renderer.encode(device.commandEncoder),
      undefined,
      'does not repeatedly clear a stationary empty residency frontier'
    );
    t.equal(renderer.projectedRecordBuffer, originalProjectedBuffer, 'keeps reserved empty rows');
    t.equal(renderer.sortedIndexBuffer, originalSortedBuffer, 'keeps reserved empty sort slots');

    renderer.setProps({data: secondBatch});
    t.ok(renderer.encode(device.commandEncoder), 'restores a newly resident source page');
    device.submit();
    t.equal(renderer.compiledGraph, originalGraph, 'reuses the same graph after an empty frontier');
    await assertVisibleGraphInstanceCount(t, device, renderer, 1);

    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    replacementBatch.destroy();
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
