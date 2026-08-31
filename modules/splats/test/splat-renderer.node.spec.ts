// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('makeGPUSplatData retains typed Gaussian columns and stable source metadata', async () => {
  const device = new NullDevice({});
  const prepared = makeGPUSplatData(device, makeSplatSource([0.25, 0.75], 4, 9));
  const rowIndices = await prepared.rowIndices.data[0].buffer.readAsync();

  expect(prepared.length, 'retains one logical source row per Gaussian').toBe(2);
  expect(prepared.rowCount, 'exposes the source row count alias').toBe(2);
  expect(prepared.positions.format, 'preserves packed Float32 XYZ positions').toBe('float32x3');
  expect(prepared.scales.format, 'preserves packed Float32 XYZ scales').toBe('float32x3');
  expect(prepared.rotations.format, 'preserves packed Float32 WXYZ rotations').toBe('float32x4');
  expect(prepared.colors.format, 'preserves normalized Uint8 RGBA colors').toBe('unorm8x4');
  expect(prepared.opacities.format, 'preserves decoded linear opacity').toBe('float32');
  expect(prepared.rowIndices.format, 'preserves stable global source row identity').toBe('uint32');
  expect(
    Array.from(new Uint32Array(rowIndices.buffer)),
    'uploads global source row indices'
  ).toEqual([9, 10]);
  expect(prepared.sourceInfo, 'retains source stream batch and row metadata').toEqual({
    sourceBatchIndex: 4,
    sourceRowIndexOffset: 9,
    sourceRowCount: 2
  });
  expect(prepared.table.batches.length, 'preserves exactly one prepared source batch').toBe(1);
  expect(Boolean(prepared.stats.byteLength > 0), 'reports owned source GPU allocations').toBe(true);

  const sourceBuffer = prepared.positions.data[0].buffer;
  prepared.destroy();
  prepared.destroy();
  expect(Boolean(sourceBuffer.destroyed), 'releases owned source allocations exactly once').toBe(
    true
  );
  void 0;
});

it('makeGPUSplatData preserves unclamped Float32 Gaussian radiance', async () => {
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

  expect(prepared.colors.format, 'retains linear Float32 RGBA source radiance').toBe('float32x4');
  expect(
    Array.from(uploadedColors),
    'uploads highlights and negative source radiance without clipping or quantization'
  ).toEqual(Array.from(source.colors));
  expect(
    prepared.colors.data[0].buffer.byteLength,
    'preserves every Float32 color channel in its owned GPU allocation'
  ).toBe(source.colors.byteLength);

  const sourceColorBuffer = prepared.colors.data[0].buffer;
  prepared.destroy();
  expect(
    Boolean(sourceColorBuffer.destroyed),
    'releases the caller-owned Float32 source color buffer'
  ).toBe(true);
  void 0;
});

it('SplatRenderer normalizes Float32 alpha and adapts HDR display mapping', () => {
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

  expect(
    Array.from(renderer.getSortedIndices()),
    'multiplies normalized Float32 source alpha and opacity exactly once'
  ).toEqual([0]);
  expect(renderer.props.toneMapping, 'compresses Float32 highlights on SDR targets').toBe(
    'reinhard'
  );
  expect(renderer.props.exposure, 'preserves unit exposure by default').toBe(1);

  const sortedReferences = renderer.sortedReferences;
  renderer.setProps({exposure: 0.5, toneMapping: 'none'});
  renderer.predraw(device.commandEncoder);
  expect(renderer.props.exposure, 'updates the radiance exposure control').toBe(0.5);
  expect(renderer.props.toneMapping, 'accepts an explicit display-mapping override').toBe('none');
  expect(
    renderer.sortedReferences,
    'updates display uniforms without rebuilding camera-dependent source ordering'
  ).toBe(sortedReferences);

  renderer.destroy();
  prepared.destroy();
  void 0;
});

it('SplatRenderer recomputes automatic tone mapping when replacing source radiance', () => {
  const device = new NullDevice({});
  const highDynamicRangeSource = makeSplatSource([0.5]);
  highDynamicRangeSource.colors = new Float32Array([4, 2, 0.5, 1]);
  const highDynamicRangeBatch = makeGPUSplatData(device, highDynamicRangeSource);
  const standardDynamicRangeBatch = makeGPUSplatData(device, makeSplatSource([0.5]));
  const renderer = new SplatRenderer(device, {data: highDynamicRangeBatch});

  expect(renderer.props.toneMapping, 'automatically compresses HDR source colors').toBe('reinhard');
  renderer.setProps({data: standardDynamicRangeBatch});
  expect(renderer.props.toneMapping, 'removes automatic mapping for replacement SDR colors').toBe(
    'none'
  );
  renderer.setProps({data: highDynamicRangeBatch});
  expect(renderer.props.toneMapping, 'restores automatic mapping for replacement HDR').toBe(
    'reinhard'
  );
  renderer.setProps({data: []});
  expect(renderer.props.toneMapping, 'clears automatic mapping when all data is removed').toBe(
    'none'
  );
  renderer.destroy();

  const explicitlyMappedRenderer = new SplatRenderer(device, {
    data: highDynamicRangeBatch,
    toneMapping: 'none'
  });
  explicitlyMappedRenderer.setProps({data: standardDynamicRangeBatch});
  explicitlyMappedRenderer.setProps({data: highDynamicRangeBatch});
  expect(
    explicitlyMappedRenderer.props.toneMapping,
    'preserves an explicit unmapped override across both source formats'
  ).toBe('none');
  explicitlyMappedRenderer.setProps({toneMapping: 'reinhard', data: []});
  expect(
    explicitlyMappedRenderer.props.toneMapping,
    'preserves an explicit mapping override when retained source data is cleared'
  ).toBe('reinhard');

  explicitlyMappedRenderer.destroy();
  highDynamicRangeBatch.destroy();
  standardDynamicRangeBatch.destroy();
  void 0;
});

it('SplatRenderer preserves Float32 highlights on extended HDR presentation targets', () => {
  const device = new NullDevice({
    createCanvasContext: {colorFormat: 'rgba16float', toneMapping: 'extended'}
  });
  configureWebGPUNullDevice(device);
  Object.defineProperty(device, 'preferredColorFormat', {value: 'rgba16float'});
  const source = makeSplatSource([0.5]);
  source.colors = new Float32Array([4, 2, 0.5, 1]);
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [16, 16]});

  expect(
    renderer.props.toneMapping,
    'preserves unclamped radiance when the WebGPU presentation target supports HDR'
  ).toBe('none');
  expect(renderer.stats.visibleSplatCount, 'retains normalized Float32 source alpha').toBe(1);

  renderer.destroy();
  prepared.destroy();
  void 0;
});

it('makeGPUSplatData rejects mismatched rows and safely prepares empty sources', () => {
  const device = new NullDevice({});
  const mismatchedSource = makeSplatSource([0.5]);
  mismatchedSource.rotations = new Float32Array(8);

  expect(
    () => makeGPUSplatData(device, mismatchedSource),
    'rejects source columns with incompatible row counts'
  ).toThrow(/matching Gaussian splat rows/);
  const empty = makeGPUSplatData(device, makeSplatSource([]));
  expect(empty.length, 'preserves empty source row count').toBe(0);
  expect(
    Boolean(empty.positions.data[0].buffer.byteLength >= 4),
    'allocates WebGPU-safe nonempty buffers'
  ).toBe(true);
  empty.destroy();
  void 0;
});

it('splat covariance handles rotation, perspective, kernel inflation and degeneracy', () => {
  const axisAligned = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [1, 0, 0, 0],
    viewportSize: [100, 100]
  });
  expect(
    Boolean(Math.abs(Math.abs(axisAligned.axis0[0]) - 100) < 1e-6),
    'projects the major axis horizontally'
  ).toBe(true);

  const rotated = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    viewportSize: [100, 100]
  });
  expect(
    Boolean(Math.abs(rotated.axis0[0]) < 1e-6),
    'rotates the major axis away from screen X'
  ).toBe(true);
  expect(
    Boolean(Math.abs(Math.abs(rotated.axis0[1]) - 100) < 1e-6),
    'rotates the major axis into screen Y'
  ).toBe(true);

  const inflated = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [0, 0, 0],
    rotation: [0, 0, 0, 0],
    viewportSize: [100, 100],
    kernel2DSize: 0.5
  });
  expect(Boolean(inflated.maxAxisPixels >= 0.5), 'inflates degenerate Gaussian covariance').toBe(
    true
  );

  const clamped = projectSplatCovarianceToScreen({
    position: [0, 0, -2],
    scale: [4, 1, 1],
    rotation: [1, 0, 0, 0],
    viewportSize: [200, 100],
    maxScreenSpaceSplatSize: 10,
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0]
  });
  expect(Boolean(Number.isFinite(clamped.axis0[0])), 'keeps perspective projection finite').toBe(
    true
  );
  expect(Boolean(clamped.maxAxisPixels <= 10), 'clamps maximum projected covariance axis').toBe(
    true
  );
  void 0;
});

it('splat depth helpers retain stable back-to-front ordering', () => {
  expect(
    Array.from(getSortedSplatIndicesByDepth(new Float32Array([1, 4, 2]))),
    'sorts farther source rows first'
  ).toEqual([1, 2, 0]);
  expect(
    Boolean(
      packSplatDepthKey(10, {depthMin: 0, depthMax: 10}) <
        packSplatDepthKey(0, {depthMin: 0, depthMax: 10})
    ),
    'packs far depths into earlier ascending keys'
  ).toBe(true);
  void 0;
});

it('large Gaussian depth domains retain exact stable ordering with Float32 radix keys', () => {
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

  expect(sortedReferences, 'reorders the original source-reference array in place').toBe(
    references
  );
  expect(
    sortedReferences.map(reference => reference.rowIndex),
    'matches exact comparator ordering for negatives, signed zero, infinities, ties, and close depths'
  ).toEqual(expectedRowIndices);
  void 0;
});

it('SplatRenderer preserves batches, stable cross-batch ordering, and source ownership', () => {
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
  expect(
    Array.from(renderer.getSortedIndices()),
    'globally sorts preserved source batches'
  ).toEqual([1, 2, 0]);
  expect(
    renderer.sortedReferences.map(reference => [reference.batchIndex, reference.batchRowIndex]),
    'retains stable source batch and batch-local row identities'
  ).toEqual([
    [0, 1],
    [1, 0],
    [0, 0]
  ]);
  expect(renderer.batches.length, 'retains both caller-owned prepared batches').toBe(2);
  expect(renderer.table?.batches.length, 'preserves both borrowed GPU table batches').toBe(2);
  expect(renderer.stats.splatCount, 'reports all retained source rows').toBe(3);
  expect(renderer.stats.visibleSplatCount, 'reports camera-visible source rows').toBe(3);
  expect(renderer.stats.batchCount, 'reports preserved source batch count').toBe(2);
  expect(
    renderer.table?.batches[0].gpuData['positions'].buffer,
    'borrows first source buffer'
  ).toBe(firstBuffer);
  expect(
    renderer.table?.batches[1].gpuData['positions'].buffer,
    'borrows second source buffer'
  ).toBe(secondBuffer);

  const renderPass = device.getDefaultRenderPass();
  expect(
    Boolean(renderer.draw(renderPass)),
    'draws retained Gaussian batches on the attribute fallback'
  ).toBe(true);
  renderer.destroy();
  renderer.destroy();
  expect(
    Boolean(firstBuffer.destroyed),
    'renderer destruction preserves first caller-owned source buffer'
  ).toBe(false);
  expect(
    Boolean(secondBuffer.destroyed),
    'renderer destruction preserves second caller-owned source buffer'
  ).toBe(false);
  firstBatch.destroy();
  secondBatch.destroy();
  expect(Boolean(firstBuffer.destroyed), 'caller releases the first source batch').toBe(true);
  expect(Boolean(secondBuffer.destroyed), 'caller releases the second source batch').toBe(true);
  void 0;
});

it('SplatRenderer draws sorted WebGL rows and interleaved source batches exactly once', async () => {
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
    expect(false, 'creates an attribute-backed Gaussian splat model').toBe(true);
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    void 0;
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
  expect(Boolean(renderer.draw(renderPass)), 'draws every globally sorted source-batch run').toBe(
    true
  );

  const drawnRows: number[] = [];
  for (const {buffer, rowCount} of drawnRowBuffers) {
    const rowBytes = await buffer.readAsync();
    drawnRows.push(...new Uint32Array(rowBytes.buffer, rowBytes.byteOffset, rowCount).values());
  }
  expect(drawnRows, 'honors globally sorted cross-batch row identities').toEqual([11, 20, 10]);
  expect(
    drawnRowBuffers.map(({rowCount}) => rowCount),
    'draws each source row once without redrawing complete source batches'
  ).toEqual([1, 1, 1]);
  const sortedPositionBuffer = renderer.getDrawRuns()[0]?.attributeBuffers?.positions;
  if (!(sortedPositionBuffer instanceof Buffer)) {
    expect(false, 'creates an independently owned, reordered WebGL position buffer').toBe(true);
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    void 0;
    return;
  }
  const sortedPositionBytes = await sortedPositionBuffer.readAsync();
  const sortedPositions = new Float32Array(
    sortedPositionBytes.buffer,
    sortedPositionBytes.byteOffset,
    sortedPositionBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
  expect(
    Boolean(Math.abs(sortedPositions[2] - 0.8) < 1e-6),
    'reorders the furthest source row first'
  ).toBe(true);
  expect(
    Boolean(Math.abs(firstSource.positions[2] - 0.2) < 1e-6),
    'preserves the caller-owned CPU source row order'
  ).toBe(true);
  expect(
    Boolean(renderer.stats.rendererGpuByteLength > 0),
    'accounts for renderer-owned sorted attributes'
  ).toBe(true);

  renderer.destroy();
  expect(
    Boolean(sortedPositionBuffer.destroyed),
    'releases renderer-owned sorted WebGL attributes'
  ).toBe(true);
  expect(
    Boolean(firstSourceBuffer.destroyed),
    'preserves the first caller-owned source GPU buffer'
  ).toBe(false);
  expect(
    Boolean(secondSourceBuffer.destroyed),
    'preserves the second caller-owned source GPU buffer'
  ).toBe(false);
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
});

it('SplatRenderer updates sorting, camera direction and visibility thresholds', () => {
  const device = new NullDevice({});
  const source = makeSplatSource([0.2, 0.8]);
  source.opacities[0] = 0.2;
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    viewportSize: [100, 100],
    sortMode: 'none'
  });

  expect(Array.from(renderer.getSortedIndices()), 'none sorting preserves source order').toEqual([
    0, 1
  ]);
  renderer.setProps({sortMode: 'global'});
  expect(Array.from(renderer.getSortedIndices()), 'global sorting uses camera depth').toEqual([
    1, 0
  ]);
  renderer.setProps({
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1]
  });
  expect(Array.from(renderer.getSortedIndices()), 'camera changes update depth order').toEqual([
    0, 1
  ]);
  renderer.setProps({opacityThreshold: 0.5});
  expect(Array.from(renderer.getSortedIndices()), 'opacity threshold culls dim rows').toEqual([1]);
  renderer.setProps({alphaCutoff: 0, screenSizeCutoffPixels: 1000});
  expect(renderer.stats.visibleSplatCount, 'screen-size threshold culls small projected rows').toBe(
    0
  );
  renderer.setProps({screenSizeCutoffPixels: 0, sortMode: 'tile', pointSize: 2});
  expect(renderer.stats.visibleSplatCount, 'tile sorting retains visible source rows').toBe(2);
  expect(renderer.props.radiusScale, 'point-size alias updates Gaussian support scaling').toBe(2);

  renderer.destroy();
  prepared.destroy();
  void 0;
});

it('SplatRenderer skips projection, sorting, and uploads for unchanged camera frames', () => {
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
    expect(false, 'creates a renderer-owned WebGPU sorted-index buffer').toBe(true);
    renderer.destroy();
    prepared.destroy();
    void 0;
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

  expect(
    renderer.sortedReferences,
    'does not reproject or resort equivalent camera, viewport, source, and styling values'
  ).toBe(sortedReferences);
  expect(
    sortedIndexBuffer.updateTimestamp,
    'does not reupload unchanged WebGPU sorted indices'
  ).toBe(uploadTimestamp);

  renderer.setProps({
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1]
  });
  renderer.predraw(device.commandEncoder);

  expect(renderer.sortedReferences, 'reprojects after the camera changes').not.toBe(
    sortedReferences
  );
  expect(Array.from(renderer.getSortedIndices()), 'resorts the updated camera depth').toEqual([
    0, 1
  ]);
  expect(
    renderer.sortedReferences.find(reference => reference.rowIndex === 0),
    'reuses stable source-row reference objects across camera changes'
  ).toBe(firstSourceReference);
  expect(
    Boolean(sortedIndexBuffer.updateTimestamp > uploadTimestamp),
    'uploads updated WebGPU sorted indices when camera values change'
  ).toBe(true);

  renderer.destroy();
  prepared.destroy();
  void 0;
});

it('SplatRenderer updates visual-only uniforms without rebuilding source ordering', () => {
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
    expect(false, 'creates a renderer-owned WebGPU sorted-index buffer').toBe(true);
    renderer.destroy();
    prepared.destroy();
    void 0;
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

  expect(
    renderer.sortedReferences,
    'preserves depth ordering when only Gaussian uniforms and the global viewport change'
  ).toBe(sortedReferences);
  expect(
    sortedIndexBuffer.updateTimestamp,
    'does not upload sorted indices for visual-only Gaussian controls'
  ).toBe(uploadTimestamp);
  expect(renderer.props.radiusScale, 'updates the Gaussian radius uniform').toBe(1.5);
  expect(renderer.props.kernel2DSize, 'updates the Gaussian kernel uniform').toBe(0.5);

  renderer.setProps({screenSizeCutoffPixels: 1000});
  renderer.predraw(device.commandEncoder);
  expect(renderer.stats.visibleSplatCount, 'still rebuilds ordering for active size culling').toBe(
    0
  );

  renderer.destroy();
  prepared.destroy();
  void 0;
});

it('SplatRenderer computes screen size and tile coordinates only when required', () => {
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

  expect(
    Boolean(renderer.sortedReferences.every(reference => reference.tileIndex === 0)),
    'does not calculate unused tile coordinates during global depth sorting'
  ).toBe(true);

  renderer.setProps({sortMode: 'none'});
  renderer.predraw(device.commandEncoder);
  expect(
    Boolean(renderer.sortedReferences.every(reference => reference.tileIndex === 0)),
    'does not calculate unused tile coordinates when source order is retained'
  ).toBe(true);

  renderer.setProps({sortMode: 'tile'});
  renderer.predraw(device.commandEncoder);
  expect(
    renderer.sortedReferences[0]?.tileIndex,
    'calculates distinct screen coordinates when tile sorting is enabled'
  ).not.toBe(renderer.sortedReferences[1]?.tileIndex);

  renderer.setProps({sortMode: 'global', screenSizeCutoffPixels: 1000});
  expect(renderer.stats.visibleSplatCount, 'projects covariance for active size thresholds').toBe(
    0
  );
  renderer.setProps({screenSizeCutoffPixels: 0});
  expect(renderer.stats.visibleSplatCount, 'restores both rows without covariance projection').toBe(
    2
  );

  renderer.destroy();
  prepared.destroy();
  void 0;
});

it('SplatRenderer bounds dense interleaved draw runs while retaining global ordering', () => {
  const device = new NullDevice({});
  const firstDepths = Array.from({length: 100}, (_, rowIndex) => (rowIndex * 2) / 200);
  const secondDepths = Array.from({length: 100}, (_, rowIndex) => (rowIndex * 2 + 1) / 200);
  const firstBatch = makeGPUSplatData(device, makeSplatSource(firstDepths, 0, 0));
  const secondBatch = makeGPUSplatData(device, makeSplatSource(secondDepths, 1, 100));
  const renderer = new SplatRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [100, 100]
  });

  expect(renderer.sortedReferences.length, 'retains globally sorted references for every row').toBe(
    200
  );
  expect(
    Boolean(
      renderer.sortedReferences.every(
        (reference, rowIndex, references) =>
          rowIndex === 0 || references[rowIndex - 1].depth >= reference.depth
      )
    ),
    'preserves exact globally sorted source diagnostics for dense interleaved batches'
  ).toBe(true);
  expect(
    renderer.stats.drawCallCount,
    'bounds dense interleaved rendering to 64 depth-sliced draw runs'
  ).toBe(64);

  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
});

it('SplatRenderer keeps dense source-batch compositing stable across small camera changes', () => {
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
    expect(false, 'creates a Gaussian splat render model').toBe(true);
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
    void 0;
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
  expect(renderer.sortedReferences[0].batchIndex, 'first view has a distant second-batch row').toBe(
    1
  );
  renderer.draw(renderPass);
  const firstViewDrawOrder = drawBatchOrder.splice(0);
  const firstViewDrawCounts = drawInstanceCounts.splice(0);

  renderer.setProps({
    modelViewProjectionMatrix: [1, 0, 0.006, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  });
  renderer.predraw(device.commandEncoder);
  expect(
    renderer.sortedReferences[0].batchIndex,
    'small camera change swaps only the outlier'
  ).toBe(0);
  renderer.draw(renderPass);

  expect(
    drawBatchOrder,
    'retains deterministic source-batch ordering inside every globally ordered depth slab'
  ).toEqual(firstViewDrawOrder);
  expect(firstViewDrawOrder.length, 'bounds both views to 64 source-preserving draw runs').toBe(64);
  expect(
    firstViewDrawCounts.reduce((totalRows, instanceCount) => totalRows + instanceCount, 0),
    'draws every interleaved source row exactly once'
  ).toBe(200);
  expect(
    Boolean(firstViewDrawCounts.every(instanceCount => instanceCount < firstBatch.length)),
    'never swaps an entire source batch when the furthest row changes'
  ).toBe(true);

  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
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
