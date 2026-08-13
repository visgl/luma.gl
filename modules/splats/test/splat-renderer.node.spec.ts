// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer} from '@luma.gl/core';
import {
  getSortedSplatIndicesByDepth,
  makeGPUSplatData,
  packSplatDepthKey,
  projectSplatCovarianceToScreen,
  sortSplatReferences,
  SplatRenderer,
  type SplatSortReference,
  type SplatSource
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('makeGPUSplatData retains typed Gaussian columns and stable source metadata', async t => {
  const device = new NullDevice({});
  const prepared = makeGPUSplatData(device, makeSplatSource([0.25, 0.75], 4, 9));
  const rowIndices = await prepared.rowIndices.data[0].buffer.readAsync();

  t.equal(prepared.length, 2, 'retains one logical source row per Gaussian');
  t.equal(prepared.rowCount, 2, 'exposes the source row count alias');
  t.equal(prepared.positions.format, 'float32x3', 'preserves packed Float32 XYZ positions');
  t.equal(prepared.scales.format, 'float32x3', 'preserves packed Float32 XYZ scales');
  t.equal(prepared.rotations.format, 'float32x4', 'preserves packed Float32 WXYZ rotations');
  t.equal(prepared.colors.format, 'unorm8x4', 'preserves normalized Uint8 RGBA colors');
  t.equal(prepared.opacities.format, 'float32', 'preserves decoded linear opacity');
  t.equal(prepared.rowIndices.format, 'uint32', 'preserves stable global source row identity');
  t.deepEqual(
    Array.from(new Uint32Array(rowIndices.buffer)),
    [9, 10],
    'uploads global source row indices'
  );
  t.deepEqual(
    prepared.sourceInfo,
    {sourceBatchIndex: 4, sourceRowIndexOffset: 9, sourceRowCount: 2},
    'retains source stream batch and row metadata'
  );
  t.equal(prepared.table.batches.length, 1, 'preserves exactly one prepared source batch');
  t.ok(prepared.stats.byteLength > 0, 'reports owned source GPU allocations');

  const sourceBuffer = prepared.positions.data[0].buffer;
  prepared.destroy();
  prepared.destroy();
  t.ok(sourceBuffer.destroyed, 'releases owned source allocations exactly once');
  t.end();
});

test('makeGPUSplatData preserves unclamped Float32 Gaussian radiance', async t => {
  const device = new NullDevice({});
  const source = makeSplatSource([0.25, 0.75], 3, 8);
  source.colors = new Float32Array([2.5, -0.25, 0.5, 0.5, 4, 1.5, -1, 0.1]);
  const prepared = makeGPUSplatData(device, source);
  const uploadedColorBytes = await prepared.colors.data[0].buffer.readAsync();
  const uploadedColors = new Float32Array(
    uploadedColorBytes.buffer,
    uploadedColorBytes.byteOffset,
    uploadedColorBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
  );

  t.equal(prepared.colors.format, 'float32x4', 'retains linear Float32 RGBA source radiance');
  t.deepEqual(
    Array.from(uploadedColors),
    Array.from(source.colors),
    'uploads highlights and negative source radiance without clipping or quantization'
  );
  t.equal(
    prepared.colors.data[0].buffer.byteLength,
    source.colors.byteLength,
    'preserves every Float32 color channel in its owned GPU allocation'
  );

  const sourceColorBuffer = prepared.colors.data[0].buffer;
  prepared.destroy();
  t.ok(sourceColorBuffer.destroyed, 'releases the caller-owned Float32 source color buffer');
  t.end();
});

test('SplatRenderer normalizes Float32 alpha and adapts HDR display mapping', t => {
  const device = new NullDevice({});
  const source = makeSplatSource([0.25, 0.75]);
  source.colors = new Float32Array([3, -0.25, 0.5, 0.5, 2, 1, 0.25, 0.1]);
  source.opacities.set([0.5, 0.5]);
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    viewportSize: [100, 100],
    alphaCutoff: 0.1
  });

  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [0],
    'multiplies normalized Float32 source alpha and opacity exactly once'
  );
  t.equal(renderer.props.toneMapping, 'reinhard', 'compresses Float32 highlights on SDR targets');
  t.equal(renderer.props.exposure, 1, 'preserves unit exposure by default');

  const sortedReferences = renderer.sortedReferences;
  renderer.setProps({exposure: 0.5, toneMapping: 'none'});
  renderer.predraw(device.commandEncoder);
  t.equal(renderer.props.exposure, 0.5, 'updates the radiance exposure control');
  t.equal(renderer.props.toneMapping, 'none', 'accepts an explicit display-mapping override');
  t.equal(
    renderer.sortedReferences,
    sortedReferences,
    'updates display uniforms without rebuilding camera-dependent source ordering'
  );

  renderer.destroy();
  prepared.destroy();
  t.end();
});

test('SplatRenderer recomputes automatic tone mapping when replacing source radiance', t => {
  const device = new NullDevice({});
  const highDynamicRangeSource = makeSplatSource([0.5]);
  highDynamicRangeSource.colors = new Float32Array([4, 2, 0.5, 1]);
  const highDynamicRangeBatch = makeGPUSplatData(device, highDynamicRangeSource);
  const standardDynamicRangeBatch = makeGPUSplatData(device, makeSplatSource([0.5]));
  const renderer = new SplatRenderer(device, {data: highDynamicRangeBatch});

  t.equal(renderer.props.toneMapping, 'reinhard', 'automatically compresses HDR source colors');
  renderer.setProps({data: standardDynamicRangeBatch});
  t.equal(
    renderer.props.toneMapping,
    'none',
    'removes automatic mapping for replacement SDR colors'
  );
  renderer.setProps({data: highDynamicRangeBatch});
  t.equal(renderer.props.toneMapping, 'reinhard', 'restores automatic mapping for replacement HDR');
  renderer.setProps({data: []});
  t.equal(renderer.props.toneMapping, 'none', 'clears automatic mapping when all data is removed');
  renderer.destroy();

  const explicitlyMappedRenderer = new SplatRenderer(device, {
    data: highDynamicRangeBatch,
    toneMapping: 'none'
  });
  explicitlyMappedRenderer.setProps({data: standardDynamicRangeBatch});
  explicitlyMappedRenderer.setProps({data: highDynamicRangeBatch});
  t.equal(
    explicitlyMappedRenderer.props.toneMapping,
    'none',
    'preserves an explicit unmapped override across both source formats'
  );
  explicitlyMappedRenderer.setProps({toneMapping: 'reinhard', data: []});
  t.equal(
    explicitlyMappedRenderer.props.toneMapping,
    'reinhard',
    'preserves an explicit mapping override when retained source data is cleared'
  );

  explicitlyMappedRenderer.destroy();
  highDynamicRangeBatch.destroy();
  standardDynamicRangeBatch.destroy();
  t.end();
});

test('SplatRenderer preserves Float32 highlights on extended HDR presentation targets', t => {
  const device = new NullDevice({
    createCanvasContext: {colorFormat: 'rgba16float', toneMapping: 'extended'}
  });
  configureWebGPUNullDevice(device);
  Object.defineProperty(device, 'preferredColorFormat', {value: 'rgba16float'});
  const source = makeSplatSource([0.5]);
  source.colors = new Float32Array([4, 2, 0.5, 1]);
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [16, 16]});

  t.equal(
    renderer.props.toneMapping,
    'none',
    'preserves unclamped radiance when the WebGPU presentation target supports HDR'
  );
  t.equal(renderer.stats.visibleSplatCount, 1, 'retains normalized Float32 source alpha');

  renderer.destroy();
  prepared.destroy();
  t.end();
});

test('makeGPUSplatData rejects mismatched rows and safely prepares empty sources', t => {
  const device = new NullDevice({});
  const mismatchedSource = makeSplatSource([0.5]);
  mismatchedSource.rotations = new Float32Array(8);

  t.throws(
    () => makeGPUSplatData(device, mismatchedSource),
    /matching Gaussian splat rows/,
    'rejects source columns with incompatible row counts'
  );
  const empty = makeGPUSplatData(device, makeSplatSource([]));
  t.equal(empty.length, 0, 'preserves empty source row count');
  t.ok(empty.positions.data[0].buffer.byteLength >= 4, 'allocates WebGPU-safe nonempty buffers');
  empty.destroy();
  t.end();
});

test('splat covariance handles rotation, perspective, kernel inflation and degeneracy', t => {
  const axisAligned = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [1, 0, 0, 0],
    viewportSize: [100, 100]
  });
  t.ok(
    Math.abs(Math.abs(axisAligned.axis0[0]) - 100) < 1e-6,
    'projects the major axis horizontally'
  );

  const rotated = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    viewportSize: [100, 100]
  });
  t.ok(Math.abs(rotated.axis0[0]) < 1e-6, 'rotates the major axis away from screen X');
  t.ok(Math.abs(Math.abs(rotated.axis0[1]) - 100) < 1e-6, 'rotates the major axis into screen Y');

  const inflated = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [0, 0, 0],
    rotation: [0, 0, 0, 0],
    viewportSize: [100, 100],
    kernel2DSize: 0.5
  });
  t.ok(inflated.maxAxisPixels >= 0.5, 'inflates degenerate Gaussian covariance');

  const clamped = projectSplatCovarianceToScreen({
    position: [0, 0, -2],
    scale: [4, 1, 1],
    rotation: [1, 0, 0, 0],
    viewportSize: [200, 100],
    maxScreenSpaceSplatSize: 10,
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0]
  });
  t.ok(Number.isFinite(clamped.axis0[0]), 'keeps perspective projection finite');
  t.ok(clamped.maxAxisPixels <= 10, 'clamps maximum projected covariance axis');
  t.end();
});

test('splat depth helpers retain stable back-to-front ordering', t => {
  t.deepEqual(
    Array.from(getSortedSplatIndicesByDepth(new Float32Array([1, 4, 2]))),
    [1, 2, 0],
    'sorts farther source rows first'
  );
  t.ok(
    packSplatDepthKey(10, {depthMin: 0, depthMax: 10}) <
      packSplatDepthKey(0, {depthMin: 0, depthMax: 10}),
    'packs far depths into earlier ascending keys'
  );
  t.end();
});

test('large Gaussian depth domains retain exact stable ordering with Float32 radix keys', t => {
  const referenceCount = 9000;
  const references: SplatSortReference[] = Array.from(
    {length: referenceCount},
    (_, referenceIndex) => ({
      batchIndex: referenceIndex % 7,
      batchRowIndex: Math.floor(referenceIndex / 7),
      rowIndex: referenceCount - referenceIndex,
      depth: ((Math.imul(referenceIndex + 1, 2_654_435_761) >>> 0) / 0xffff_ffff) * 2 - 1,
      tileIndex: referenceIndex % 19
    })
  );
  references[0].depth = Number.NEGATIVE_INFINITY;
  references[1].depth = Number.POSITIVE_INFINITY;
  references[2].depth = -0;
  references[3].depth = 0;
  references[4].depth = 0.125;
  references[5].depth = 0.125 + 1e-10;
  references[6].depth = 0.125 + 2e-10;
  references[7].depth = -0.5;
  references[8].depth = -0.5;
  references[9].depth = Number.POSITIVE_INFINITY;
  references[10].depth = Number.NEGATIVE_INFINITY;

  const expectedRowIndices = [...references]
    .sort((left, right) => right.depth - left.depth || left.rowIndex - right.rowIndex)
    .map(reference => reference.rowIndex);
  const sortedReferences = sortSplatReferences(references, 'global');

  t.equal(sortedReferences, references, 'reorders the original source-reference array in place');
  t.deepEqual(
    sortedReferences.map(reference => reference.rowIndex),
    expectedRowIndices,
    'matches exact comparator ordering for negatives, signed zero, infinities, ties, and close depths'
  );
  t.end();
});

test('SplatRenderer preserves batches, stable cross-batch ordering, and source ownership', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatSource([0.2, 0.8], 0, 0));
  const secondBatch = makeGPUSplatData(device, makeSplatSource([0.5], 1, 2));
  const firstBuffer = firstBatch.positions.data[0].buffer;
  const secondBuffer = secondBatch.positions.data[0].buffer;
  const renderer = new SplatRenderer(device, {
    data: firstBatch,
    viewportSize: [100, 100],
    sortMode: 'global'
  });

  renderer.appendData(secondBatch);
  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [1, 2, 0],
    'globally sorts preserved source batches'
  );
  t.deepEqual(
    renderer.sortedReferences.map(reference => [reference.batchIndex, reference.batchRowIndex]),
    [
      [0, 1],
      [1, 0],
      [0, 0]
    ],
    'retains stable source batch and batch-local row identities'
  );
  t.equal(renderer.batches.length, 2, 'retains both caller-owned prepared batches');
  t.equal(renderer.table?.batches.length, 2, 'preserves both borrowed GPU table batches');
  t.equal(renderer.stats.splatCount, 3, 'reports all retained source rows');
  t.equal(renderer.stats.visibleSplatCount, 3, 'reports camera-visible source rows');
  t.equal(renderer.stats.batchCount, 2, 'reports preserved source batch count');
  t.equal(
    renderer.table?.batches[0].gpuData['positions'].buffer,
    firstBuffer,
    'borrows first source buffer'
  );
  t.equal(
    renderer.table?.batches[1].gpuData['positions'].buffer,
    secondBuffer,
    'borrows second source buffer'
  );

  const renderPass = device.getDefaultRenderPass();
  t.ok(renderer.draw(renderPass), 'draws retained Gaussian batches on the attribute fallback');
  renderer.destroy();
  renderer.destroy();
  t.notOk(firstBuffer.destroyed, 'renderer destruction preserves first caller-owned source buffer');
  t.notOk(
    secondBuffer.destroyed,
    'renderer destruction preserves second caller-owned source buffer'
  );
  firstBatch.destroy();
  secondBatch.destroy();
  t.ok(firstBuffer.destroyed, 'caller releases the first source batch');
  t.ok(secondBuffer.destroyed, 'caller releases the second source batch');
  t.end();
});

test('SplatRenderer draws sorted WebGL rows and interleaved source batches exactly once', async t => {
  const device = new NullDevice({});
  const firstSource = makeSplatSource([0.2, 0.8], 0, 10);
  const secondSource = makeSplatSource([0.5], 1, 20);
  const firstBatch = makeGPUSplatData(device, firstSource);
  const secondBatch = makeGPUSplatData(device, secondSource);
  const firstSourceBuffer = firstBatch.positions.data[0].buffer;
  const secondSourceBuffer = secondBatch.positions.data[0].buffer;
  const renderer = new SplatRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [32, 32],
    sortMode: 'global'
  });
  const model = renderer.model;
  if (!model) {
    t.fail('creates an attribute-backed Gaussian splat model');
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    t.end();
    return;
  }

  const originalDraw = model.draw.bind(model);
  const drawnRowBuffers: Array<{buffer: Buffer; rowCount: number}> = [];
  model.draw = renderPass => {
    const rowIndexBuffer = model.vertexArray.attributes[5];
    if (rowIndexBuffer instanceof Buffer) {
      drawnRowBuffers.push({buffer: rowIndexBuffer, rowCount: model.instanceCount});
    }
    return originalDraw(renderPass);
  };
  const renderPass = device.getDefaultRenderPass();
  t.ok(renderer.draw(renderPass), 'draws every globally sorted source-batch run');

  const drawnRows: number[] = [];
  for (const {buffer, rowCount} of drawnRowBuffers) {
    const rowBytes = await buffer.readAsync();
    drawnRows.push(...new Uint32Array(rowBytes.buffer, rowBytes.byteOffset, rowCount).values());
  }
  t.deepEqual(drawnRows, [11, 20, 10], 'honors globally sorted cross-batch row identities');
  t.deepEqual(
    drawnRowBuffers.map(({rowCount}) => rowCount),
    [1, 1, 1],
    'draws each source row once without redrawing complete source batches'
  );
  const sortedPositionBuffer = renderer.getDrawRuns()[0]?.attributeBuffers?.positions;
  if (!(sortedPositionBuffer instanceof Buffer)) {
    t.fail('creates an independently owned, reordered WebGL position buffer');
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    t.end();
    return;
  }
  const sortedPositionBytes = await sortedPositionBuffer.readAsync();
  const sortedPositions = new Float32Array(
    sortedPositionBytes.buffer,
    sortedPositionBytes.byteOffset,
    sortedPositionBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
  t.ok(Math.abs(sortedPositions[2] - 0.8) < 1e-6, 'reorders the furthest source row first');
  t.ok(
    Math.abs(firstSource.positions[2] - 0.2) < 1e-6,
    'preserves the caller-owned CPU source row order'
  );
  t.ok(renderer.stats.rendererGpuByteLength > 0, 'accounts for renderer-owned sorted attributes');

  renderer.destroy();
  t.ok(sortedPositionBuffer.destroyed, 'releases renderer-owned sorted WebGL attributes');
  t.notOk(firstSourceBuffer.destroyed, 'preserves the first caller-owned source GPU buffer');
  t.notOk(secondSourceBuffer.destroyed, 'preserves the second caller-owned source GPU buffer');
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

test('SplatRenderer updates sorting, camera direction and visibility thresholds', t => {
  const device = new NullDevice({});
  const source = makeSplatSource([0.2, 0.8]);
  source.opacities[0] = 0.2;
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    viewportSize: [100, 100],
    sortMode: 'none'
  });

  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [0, 1],
    'none sorting preserves source order'
  );
  renderer.setProps({sortMode: 'global'});
  t.deepEqual(Array.from(renderer.getSortedIndices()), [1, 0], 'global sorting uses camera depth');
  renderer.setProps({
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1]
  });
  t.deepEqual(Array.from(renderer.getSortedIndices()), [0, 1], 'camera changes update depth order');
  renderer.setProps({opacityThreshold: 0.5});
  t.deepEqual(Array.from(renderer.getSortedIndices()), [1], 'opacity threshold culls dim rows');
  renderer.setProps({alphaCutoff: 0, screenSizeCutoffPixels: 1000});
  t.equal(renderer.stats.visibleSplatCount, 0, 'screen-size threshold culls small projected rows');
  renderer.setProps({screenSizeCutoffPixels: 0, sortMode: 'tile', pointSize: 2});
  t.equal(renderer.stats.visibleSplatCount, 2, 'tile sorting retains visible source rows');
  t.equal(renderer.props.radiusScale, 2, 'point-size alias updates Gaussian support scaling');

  renderer.destroy();
  prepared.destroy();
  t.end();
});

test('SplatRenderer skips projection, sorting, and uploads for unchanged camera frames', t => {
  const device = new NullDevice({});
  configureWebGPUNullDevice(device);
  const prepared = makeGPUSplatData(device, makeSplatSource([0.2, 0.8]));
  const renderer = new SplatRenderer(device, {
    data: prepared,
    viewportSize: [100, 100],
    sortMode: 'global'
  });
  const renderPass = device.getDefaultRenderPass();
  renderer.predraw(device.commandEncoder);
  renderer.draw(renderPass);

  const sortedIndexBuffer = renderer.model?.bindings['splatSortedIndices'];
  if (!(sortedIndexBuffer instanceof Buffer)) {
    t.fail('creates a renderer-owned WebGPU sorted-index buffer');
    renderer.destroy();
    prepared.destroy();
    t.end();
    return;
  }

  const sortedReferences = renderer.sortedReferences;
  const firstSourceReference = sortedReferences.find(reference => reference.rowIndex === 0);
  const uploadTimestamp = sortedIndexBuffer.updateTimestamp;
  renderer.setProps({
    data: [prepared],
    modelViewProjectionMatrix: new Float32Array(renderer.props.modelViewProjectionMatrix),
    viewportSize: [100, 100],
    sortMode: 'global',
    alphaCutoff: 1 / 255,
    opacityThreshold: 1 / 255,
    screenSizeCutoffPixels: 0,
    gaussianSupportRadius: 3,
    kernel2DSize: 0.3,
    maxScreenSpaceSplatSize: 1024,
    radiusScale: 1,
    pointSize: 1,
    alphaScale: 1
  });
  renderer.setProps({});
  renderer.predraw(device.commandEncoder);
  renderer.draw(renderPass);

  t.equal(
    renderer.sortedReferences,
    sortedReferences,
    'does not reproject or resort equivalent camera, viewport, source, and styling values'
  );
  t.equal(
    sortedIndexBuffer.updateTimestamp,
    uploadTimestamp,
    'does not reupload unchanged WebGPU sorted indices'
  );

  renderer.setProps({
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1]
  });
  renderer.predraw(device.commandEncoder);

  t.notEqual(renderer.sortedReferences, sortedReferences, 'reprojects after the camera changes');
  t.deepEqual(Array.from(renderer.getSortedIndices()), [0, 1], 'resorts the updated camera depth');
  t.equal(
    renderer.sortedReferences.find(reference => reference.rowIndex === 0),
    firstSourceReference,
    'reuses stable source-row reference objects across camera changes'
  );
  t.ok(
    sortedIndexBuffer.updateTimestamp > uploadTimestamp,
    'uploads updated WebGPU sorted indices when camera values change'
  );

  renderer.destroy();
  prepared.destroy();
  t.end();
});

test('SplatRenderer updates visual-only uniforms without rebuilding source ordering', t => {
  const device = new NullDevice({});
  configureWebGPUNullDevice(device);
  const prepared = makeGPUSplatData(device, makeSplatSource([0.2, 0.8]));
  const renderer = new SplatRenderer(device, {
    data: prepared,
    viewportSize: [100, 100],
    sortMode: 'global'
  });
  const renderPass = device.getDefaultRenderPass();
  renderer.predraw(device.commandEncoder);
  renderer.draw(renderPass);

  const sortedIndexBuffer = renderer.model?.bindings['splatSortedIndices'];
  if (!(sortedIndexBuffer instanceof Buffer)) {
    t.fail('creates a renderer-owned WebGPU sorted-index buffer');
    renderer.destroy();
    prepared.destroy();
    t.end();
    return;
  }

  const sortedReferences = renderer.sortedReferences;
  const uploadTimestamp = sortedIndexBuffer.updateTimestamp;
  renderer.setProps({
    radiusScale: 1.5,
    gaussianSupportRadius: 2.5,
    kernel2DSize: 0.5,
    maxScreenSpaceSplatSize: 512,
    viewportSize: [200, 100]
  });
  renderer.predraw(device.commandEncoder);

  t.equal(
    renderer.sortedReferences,
    sortedReferences,
    'preserves depth ordering when only Gaussian uniforms and the global viewport change'
  );
  t.equal(
    sortedIndexBuffer.updateTimestamp,
    uploadTimestamp,
    'does not upload sorted indices for visual-only Gaussian controls'
  );
  t.equal(renderer.props.radiusScale, 1.5, 'updates the Gaussian radius uniform');
  t.equal(renderer.props.kernel2DSize, 0.5, 'updates the Gaussian kernel uniform');

  renderer.setProps({screenSizeCutoffPixels: 1000});
  renderer.predraw(device.commandEncoder);
  t.equal(renderer.stats.visibleSplatCount, 0, 'still rebuilds ordering for active size culling');

  renderer.destroy();
  prepared.destroy();
  t.end();
});

test('SplatRenderer computes screen size and tile coordinates only when required', t => {
  const device = new NullDevice({});
  const source = makeSplatSource([0.2, 0.8]);
  source.positions[0] = -0.75;
  source.positions[3] = 0.75;
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    viewportSize: [100, 100],
    sortMode: 'global'
  });

  t.ok(
    renderer.sortedReferences.every(reference => reference.tileIndex === 0),
    'does not calculate unused tile coordinates during global depth sorting'
  );

  renderer.setProps({sortMode: 'none'});
  renderer.predraw(device.commandEncoder);
  t.ok(
    renderer.sortedReferences.every(reference => reference.tileIndex === 0),
    'does not calculate unused tile coordinates when source order is retained'
  );

  renderer.setProps({sortMode: 'tile'});
  renderer.predraw(device.commandEncoder);
  t.notEqual(
    renderer.sortedReferences[0]?.tileIndex,
    renderer.sortedReferences[1]?.tileIndex,
    'calculates distinct screen coordinates when tile sorting is enabled'
  );

  renderer.setProps({sortMode: 'global', screenSizeCutoffPixels: 1000});
  t.equal(renderer.stats.visibleSplatCount, 0, 'projects covariance for active size thresholds');
  renderer.setProps({screenSizeCutoffPixels: 0});
  t.equal(renderer.stats.visibleSplatCount, 2, 'restores both rows without covariance projection');

  renderer.destroy();
  prepared.destroy();
  t.end();
});

test('SplatRenderer bounds dense interleaved draw runs while retaining global ordering', t => {
  const device = new NullDevice({});
  const firstDepths = Array.from({length: 100}, (_, rowIndex) => (rowIndex * 2) / 200);
  const secondDepths = Array.from({length: 100}, (_, rowIndex) => (rowIndex * 2 + 1) / 200);
  const firstBatch = makeGPUSplatData(device, makeSplatSource(firstDepths, 0, 0));
  const secondBatch = makeGPUSplatData(device, makeSplatSource(secondDepths, 1, 100));
  const renderer = new SplatRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [100, 100]
  });

  t.equal(
    renderer.sortedReferences.length,
    200,
    'retains globally sorted references for every row'
  );
  t.ok(
    renderer.sortedReferences.every(
      (reference, rowIndex, references) =>
        rowIndex === 0 || references[rowIndex - 1].depth >= reference.depth
    ),
    'preserves exact globally sorted source diagnostics for dense interleaved batches'
  );
  t.equal(
    renderer.stats.drawCallCount,
    64,
    'bounds dense interleaved rendering to 64 depth-sliced draw runs'
  );

  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

test('SplatRenderer keeps dense source-batch compositing stable across small camera changes', t => {
  const device = new NullDevice({});
  configureWebGPUNullDevice(device);
  const firstSource = makeSplatSource(
    Array.from({length: 100}, (_, rowIndex) => (rowIndex * 2) / 200),
    0,
    0
  );
  const secondSource = makeSplatSource(
    Array.from({length: 100}, (_, rowIndex) => (rowIndex * 2 + 1) / 200),
    1,
    100
  );
  firstSource.positions[99 * 3] = 1;
  secondSource.positions[99 * 3] = -1;
  const firstBatch = makeGPUSplatData(device, firstSource);
  const secondBatch = makeGPUSplatData(device, secondSource);
  const renderer = new SplatRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [100, 100]
  });
  const model = renderer.model;
  if (!model) {
    t.fail('creates a Gaussian splat render model');
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    t.end();
    return;
  }

  const originalDraw = model.draw.bind(model);
  const drawBatchOrder: number[] = [];
  const drawInstanceCounts: number[] = [];
  model.draw = renderPass => {
    drawBatchOrder.push(
      model.bindings['splatPositions'] === firstBatch.positions.data[0].buffer ? 0 : 1
    );
    drawInstanceCounts.push(model.instanceCount);
    return originalDraw(renderPass);
  };

  const renderPass = device.getDefaultRenderPass();
  renderer.setProps({
    modelViewProjectionMatrix: [1, 0, -0.006, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  });
  renderer.predraw(device.commandEncoder);
  t.equal(renderer.sortedReferences[0].batchIndex, 1, 'first view has a distant second-batch row');
  renderer.draw(renderPass);
  const firstViewDrawOrder = drawBatchOrder.splice(0);
  const firstViewDrawCounts = drawInstanceCounts.splice(0);

  renderer.setProps({
    modelViewProjectionMatrix: [1, 0, 0.006, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  });
  renderer.predraw(device.commandEncoder);
  t.equal(renderer.sortedReferences[0].batchIndex, 0, 'small camera change swaps only the outlier');
  renderer.draw(renderPass);

  t.deepEqual(
    drawBatchOrder,
    firstViewDrawOrder,
    'retains deterministic source-batch ordering inside every globally ordered depth slab'
  );
  t.equal(firstViewDrawOrder.length, 64, 'bounds both views to 64 source-preserving draw runs');
  t.equal(
    firstViewDrawCounts.reduce((totalRows, instanceCount) => totalRows + instanceCount, 0),
    200,
    'draws every interleaved source row exactly once'
  );
  t.ok(
    firstViewDrawCounts.every(instanceCount => instanceCount < firstBatch.length),
    'never swaps an entire source batch when the furthest row changes'
  );

  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

function configureWebGPUNullDevice(device: NullDevice): void {
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
}

function makeSplatSource(
  depths: readonly number[],
  sourceBatchIndex = 0,
  rowIndexBase = 0
): SplatSource {
  const positions = new Float32Array(depths.length * 3);
  const scales = new Float32Array(depths.length * 3);
  const rotations = new Float32Array(depths.length * 4);
  const colors = new Uint8Array(depths.length * 4);
  const opacities = new Float32Array(depths.length);

  for (const [rowIndex, depth] of depths.entries()) {
    positions[rowIndex * 3 + 2] = depth;
    scales.set([0.1, 0.06, 0.03], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([255, 128, 32, 255], rowIndex * 4);
    opacities[rowIndex] = 1;
  }

  return {positions, scales, rotations, colors, opacities, sourceBatchIndex, rowIndexBase};
}
