// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {getTestDevices, NullDevice} from '@luma.gl/test-utils';
import {GPUPagedSplatRenderer} from '../src/gpu-paged-splat-renderer';
import {
  GPU_PAGED_SPLAT_RENDER_SHADER,
  GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT
} from '../src/gpu-paged-splat-shaders';
import './gpu-paged-splat-renderer.node.spec';

it('GPUPagedSplatRenderer executes sparse source lifecycle on every browser WebGPU adapter', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(
    Boolean(devices.length > 0),
    'a browser WebGPU adapter is available, including software adapters'
  ).toBe(true);
  const unsupportedDevice = new NullDevice({});
  expect(
    () => new GPUPagedSplatRenderer(unsupportedDevice),
    'rejects unsupported graphics backends without accessing source data'
  ).toThrow(/requires a WebGPU device/);

  for (const device of devices) {
    const firstSource = makeBrowserPagedSplatSource([0.9, 0.1, 0.6, 0.3], 100, 17);
    firstSource.colors = new Float32Array([
      2, 0.5, 0.25, 1, 1, 0.75, 0.5, 1, 0.75, 1, 0.25, 1, 0.5, 0.25, 1, 1
    ]);
    firstSource.semanticIds = new Uint32Array([4, 9, 4, 7]);
    firstSource.sphericalHarmonics = new Float32Array(4 * 45);
    firstSource.sphericalHarmonicsDegree = 3;
    firstSource.sphericalHarmonics[2 * 3] = 0.25;
    firstSource.opacities[0] = 1.5;
    const secondSource = makeBrowserPagedSplatSource([0.8, 0.2, 0.4], 200, 18);
    secondSource.semanticIds = new Uint32Array([4, 9, 7]);
    const firstPage = makeGPUSplatData(device, firstSource);
    const secondPage = makeGPUSplatData(device, secondSource);
    const initialPages = [
      {id: 'browser-directional-page', data: firstPage, activeRows: new Uint32Array([0, 2, 3])},
      {id: 'browser-semantic-page', data: secondPage, activeRows: new Uint32Array([0, 1])}
    ];
    const renderer = new GPUPagedSplatRenderer(device, {
      pages: initialPages,
      viewportSize: [16, 16],
      cameraPosition: [-1, 0, 0.9],
      sphericalHarmonicsDegree: 2,
      semanticFilter: {include: [4, 9], exclude: [7], includeUnlabeled: true},
      maxProjectedSplatsPerSegment: 2,
      clearColor: [0, 0, 0, 0],
      lodOpacity: true
    });

    expect(renderer.batches[0], 'retains the first independent original source page').toBe(
      firstPage
    );
    expect(renderer.batches[1], 'retains the second independent source allocation').toBe(
      secondPage
    );
    expect(renderer.props.toneMapping, 'automatically maps Float32 source radiance').toBe(
      'reinhard'
    );
    expect(
      Boolean(renderer.props.lodOpacity),
      'enables nonlinear Spark parents with Float32 source colors'
    ).toBe(true);
    expect(
      renderer.stats.activeRowCount,
      'retains only requested original sparse source rows'
    ).toBe(5);
    expect(
      renderer.stats.sourceSegmentCount,
      'retains bounded source projections while sparse row cardinality changes'
    ).toBe(4);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'encodes the real device command graph'
    ).toBe(true);
    expect(
      Boolean(renderer.compiledGraph),
      'compiles GPU projection, global sorting, and ordered gather'
    ).toBe(true);
    expect(
      Boolean(renderer.graphStats),
      'exposes real graph diagnostics without mapping a GPU buffer'
    ).toBe(true);
    expect(Boolean(renderer.lastEncoding), 'records the current sparse GPU graph encoding').toBe(
      true
    );
    expect(Boolean(renderer.uniformBuffer), 'retains shared GPU camera presentation uniforms').toBe(
      true
    );
    expect(
      Boolean(renderer.sortedIndexBuffer),
      'retains one compact global GPU source permutation'
    ).toBe(true);
    expect(renderer.projectedRecordBuffers.length, 'allocates bucketed ordered outputs').toBe(4);
    expect(
      renderer.stats.segmentCount,
      'tracks output capacity independently of source pages'
    ).toBe(4);
    expect(renderer.stats.globalSortCapacity, 'buckets five active cross-page rows').toBe(8);
    expect(
      Boolean(renderer.stats.rendererGpuByteLength > 0 && renderer.stats.sourceGpuByteLength > 0),
      'separates owned graph storage from original caller-owned source bytes'
    ).toBe(true);
    device.submit();

    const originalGraph = renderer.compiledGraph;
    expect(
      renderer.encode(device.commandEncoder),
      'avoids work when no source, camera, or sparse visibility changed'
    ).toBe(undefined);
    const updatedMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.1, 0, 0, 1];
    renderer.setProps({
      modelViewProjectionMatrix: updatedMatrix,
      viewportSize: [24, 24],
      cameraPosition: [1, 0, 0.9],
      sphericalHarmonicsDegree: 3,
      semanticFilter: {include: new Set([4, 7, 9]), exclude: [7]},
      opacityThreshold: 0.02,
      pointSize: 1.25,
      screenSizeCutoffPixels: 0.1,
      gaussianSupportRadius: 2.75,
      kernel2DSize: 0.4,
      maxScreenSpaceSplatSize: 256,
      alphaScale: 0.8,
      exposure: 1.1,
      toneMapping: 'none',
      lodOpacity: false
    });
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'updates camera, semantics, SH, and presentation'
    ).toBe(true);
    expect(renderer.compiledGraph, 'reuses its existing GPU graph for style changes').toBe(
      originalGraph
    );
    expect(
      Boolean(renderer.props.lodOpacity),
      'restores ordinary splat opacity without rebuilding'
    ).toBe(false);
    device.submit();

    renderer.setProps({lodOpacity: true});
    expect(
      Boolean(encodePagedHighDynamicRangeFrame(device, renderer)),
      'converts mixed Uint8 and RAD Float32 source colors for linear HDR presentation'
    ).toBe(true);
    expect(renderer.compiledGraph, 'preserves source graph identity on HDR targets').toBe(
      originalGraph
    );
    device.submit();
    renderer.setProps({lodOpacity: false});

    renderer.setFrontier([
      {id: 'browser-directional-page', data: firstPage, activeRows: new Uint32Array([1, 2, 3])},
      {id: 'browser-semantic-page', data: secondPage, activeRows: new Uint32Array([1, 2])}
    ]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'updates compact sparse original source offsets'
    ).toBe(true);
    expect(renderer.compiledGraph, 'reuses stable-cardinality source projections').toBe(
      originalGraph
    );
    device.submit();

    renderer.setFrontier([
      {id: 'browser-directional-page', data: firstPage, activeRows: new Uint32Array([2])},
      {id: 'browser-semantic-page', data: secondPage, activeRows: new Uint32Array([1, 2])}
    ]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'updates a smaller sparse frontier in place'
    ).toBe(true);
    expect(
      renderer.compiledGraph,
      'reuses the compiled graph when active cardinality stays inside its bucket'
    ).toBe(originalGraph);
    expect(renderer.stats.activeRowCount, 'reports the smaller exact sparse frontier').toBe(3);
    expect(renderer.stats.globalSortCapacity, 'retains the active sort bucket').toBe(8);
    device.submit();

    firstPage.updateRows(1, {opacities: new Float32Array([0.75])});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'detects in-place caller-owned source revisions'
    ).toBe(true);
    expect(renderer.compiledGraph, 'reuses its graph for original source updates').toBe(
      originalGraph
    );
    device.submit();

    renderer.setProps({semanticFilter: {include: Array.from({length: 70}, (_, index) => index)}});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'grows GPU-owned semantic-selection capacity'
    ).toBe(true);
    expect(renderer.compiledGraph, 'rebuilds only for expanded semantic storage').not.toBe(
      originalGraph
    );
    device.submit();

    const replacementGraph = renderer.compiledGraph;
    renderer.setFrontier([]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'clears an empty hierarchy frontier exactly once'
    ).toBe(true);
    expect(renderer.compiledGraph, 'retains graph allocations while empty').toBe(replacementGraph);
    device.submit();
    expect(renderer.encode(device.commandEncoder), 'does not clear a clean scene twice').toBe(
      undefined
    );
    renderer.setPages([
      {id: 'browser-directional-page', data: firstPage, activeRows: new Uint32Array([1, 2, 3])},
      {id: 'browser-semantic-page', data: secondPage, activeRows: new Uint32Array([1, 2])}
    ]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'reactivates original sparse page allocations'
    ).toBe(true);
    expect(renderer.compiledGraph, 'restores the original bounded graph').toBe(replacementGraph);
    device.submit();

    renderer.setProps({pages: [{id: 'replacement-page', data: secondPage}]});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'rebuilds for a different independent page set'
    ).toBe(true);
    expect(renderer.stats.activeRowCount, 'renders complete original replacement page rows').toBe(
      3
    );
    device.submit();
    renderer.setProps({data: firstPage, semanticFilter: undefined});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'supports existing graph-compatible source props'
    ).toBe(true);
    device.submit();

    expect(
      () =>
        renderer.setFrontier([{id: 'invalid', data: firstPage, activeRows: new Uint32Array([4])}]),
      'rejects sparse source offsets outside the original borrowed page'
    ).toThrow(/source-page-local/);
    expect(
      () => renderer.setProps({semanticFilter: {predicate: () => true}}),
      'rejects host callbacks that cannot execute inside the GPU graph'
    ).toThrow(/JavaScript predicates/);
    expect(
      () => renderer.setProps({semanticFilter: {include: [-1]}}),
      'rejects classes incompatible with original unsigned semantic storage'
    ).toThrow(/unsigned 32-bit/);

    const firstPositions = firstPage.positions.data[0].buffer;
    const secondPositions = secondPage.positions.data[0].buffer;
    const drawCommands = renderer.drawCommands.buffer;
    renderer.destroy();
    renderer.destroy();
    expect(Boolean(renderer.destroyed), 'makes renderer destruction safe and idempotent').toBe(
      true
    );
    expect(
      Boolean(drawCommands.destroyed),
      'destroys renderer-owned indirect command storage'
    ).toBe(true);
    expect(
      Boolean(firstPositions.destroyed),
      'preserves independently borrowed first-page source storage'
    ).toBe(false);
    expect(
      Boolean(secondPositions.destroyed),
      'preserves independently borrowed second-page source storage'
    ).toBe(false);
    expect(renderer.encode(device.commandEncoder), 'does not encode destroyed graphs').toBe(
      undefined
    );
    expect(
      () => renderer.setFrontier([{id: 'destroyed', data: firstPage}]),
      'rejects further source updates after destruction'
    ).toThrow(/destroyed/);

    const compatibleRenderer = new GPUPagedSplatRenderer(device, {data: [firstPage, secondPage]});
    expect(
      compatibleRenderer.batches,
      'preserves graph-compatible streamed batch arrays without copying source rows'
    ).toEqual([firstPage, secondPage]);
    compatibleRenderer.setProps({data: secondPage});
    compatibleRenderer.destroy();
    firstPage.destroy();
    secondPage.destroy();
  }

  unsupportedDevice.destroy();
  void 0;
});

it('GPUPagedSplatRenderer globally sorts overlapping real WebGPU pages across bounded segments', async () => {
  const devices = await getTestDevices(['webgpu']);
  expect(Boolean(devices.length > 0), 'a browser WebGPU adapter is available').toBe(true);

  for (const device of devices) {
    if (isSoftwareBackedPagedDevice(device)) {
      void 0;
      continue;
    }

    const textureSize = 16;
    const firstSource = makeBrowserPagedSplatSource([0.9, 0.1], 100, 4);
    firstSource.colors.set([255, 0, 0, 255, 0, 0, 255, 255]);
    firstSource.opacities.fill(0.5);
    const secondSource = makeBrowserPagedSplatSource([0.7, 0.3], 800, 9);
    secondSource.colors.set([0, 255, 0, 255, 255, 255, 0, 255]);
    secondSource.opacities.fill(0.5);
    const firstPage = makeGPUSplatData(device, firstSource);
    const secondPage = makeGPUSplatData(device, secondSource);
    const renderer = new GPUPagedSplatRenderer(device, {
      pages: [
        {id: 'red-blue-page', data: firstPage},
        {id: 'green-yellow-page', data: secondPage}
      ],
      viewportSize: [textureSize, textureSize],
      maxProjectedSplatsPerSegment: 2,
      alphaCutoff: 0
    });

    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'encodes the globally ordered segmented graph'
    ).toBe(true);
    expect(renderer.stats.pageCount, 'preserves two independently allocated source pages').toBe(2);
    expect(
      renderer.stats.sourceSegmentCount,
      'projects each preserved source page separately'
    ).toBe(2);
    expect(renderer.stats.segmentCount, 'gathers exact global order into two bounded outputs').toBe(
      2
    );
    expect(
      renderer.stats.globalSortCapacity,
      'sorts all active pages in one global GPU domain'
    ).toBe(4);
    expect(
      Boolean(
        renderer.compiledGraph?.stats.nodeOrder.some(nodeId =>
          nodeId.includes('paged-gaussian-global-depth-sort')
        )
      ),
      'schedules a single cross-page GPU radix ordering'
    ).toBe(true);
    expect(
      Boolean(renderer.compiledGraph?.stats.nodeOrder.includes('paged-gaussian-segmented-render')),
      'presents ordered segments within one final render pass'
    ).toBe(true);
    device.submit();

    const sortedBytes = await renderer.sortedIndexBuffer!.readAsync();
    const sortedIndices = new Uint32Array(
      sortedBytes.buffer,
      sortedBytes.byteOffset,
      sortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(
      Array.from(sortedIndices),
      'interleaves overlapping page depths in exact global far-to-near order'
    ).toEqual([0, 2, 3, 1]);

    const indirectBytes = await renderer.drawCommands.buffer.readAsync();
    const indirectCommands = new Uint32Array(
      indirectBytes.buffer,
      indirectBytes.byteOffset,
      indirectBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(
      Array.from(indirectCommands),
      'publishes global visibility and exact GPU-driven counts for each bounded segment'
    ).toEqual([4, 4, 0, 0, 4, 2, 0, 0, 4, 2, 0, 0]);

    const firstOutputBytes = await renderer.projectedRecordBuffers[0].readAsync();
    const firstOutput = new Float32Array(
      firstOutputBytes.buffer,
      firstOutputBytes.byteOffset,
      firstOutputBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    const secondOutputBytes = await renderer.projectedRecordBuffers[1].readAsync();
    const secondOutput = new Float32Array(
      secondOutputBytes.buffer,
      secondOutputBytes.byteOffset,
      secondOutputBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    expect(
      [
        Array.from(firstOutput.slice(8, 11)),
        Array.from(firstOutput.slice(20, 23)),
        Array.from(secondOutput.slice(8, 11)),
        Array.from(secondOutput.slice(20, 23))
      ],
      'gathers only renderer-owned projected records into exact cross-page depth order'
    ).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 1]
    ]);

    const colorTexture = device.createTexture({
      format: 'rgba8unorm',
      width: textureSize,
      height: textureSize,
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: textureSize,
      height: textureSize,
      colorAttachments: [colorTexture],
      depthStencilAttachment: 'depth24plus'
    });
    const presentationModel = new Model(device, {
      id: 'paged-gaussian-global-order-readback',
      source: GPU_PAGED_SPLAT_RENDER_SHADER,
      shaderLayout: GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT,
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus',
      isInstanced: true,
      instanceCount: 2,
      vertexCount: 4,
      topology: 'triangle-strip',
      bindings: {
        graphUniforms: renderer.uniformBuffer!,
        projectedRecords: renderer.projectedRecordBuffers[0]
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    presentationModel.predraw(device.commandEncoder);
    const renderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    renderPass.setPipeline(presentationModel.pipeline);
    renderPass.setVertexArray(presentationModel.vertexArray);
    for (const [segmentIndex, projectedRecords] of renderer.projectedRecordBuffers.entries()) {
      renderPass.setBindings({graphUniforms: renderer.uniformBuffer!, projectedRecords});
      renderer.drawCommands.draw(renderPass, segmentIndex + 1);
    }
    renderPass.end();
    device.submit();

    const pixelLayout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
    const pixelReadback = device.createBuffer({
      byteLength: pixelLayout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    colorTexture.readBuffer({width: textureSize, height: textureSize}, pixelReadback);
    const pixels = await pixelReadback.readAsync(0, pixelLayout.byteLength);
    const centerPixelOffset =
      Math.floor(textureSize / 2) * pixelLayout.bytesPerRow + Math.floor(textureSize / 2) * 4;
    const pixel = pixels.slice(centerPixelOffset, centerPixelOffset + 4);
    expect(
      Boolean(pixel[2] > pixel[1] && pixel[1] > pixel[0] && pixel[0] > 60),
      `real pixel [${Array.from(pixel)}] blends red→green→yellow→blue globally across page and segment boundaries`
    ).toBe(true);
    expect(
      Boolean(presentationModel.pipeline.isErrored),
      'compiles the real segmented splat pipeline'
    ).toBe(false);

    const originalFirstSource = firstPage.positions.data[0].buffer;
    const originalSecondSource = secondPage.positions.data[0].buffer;
    pixelReadback.destroy();
    presentationModel.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
    renderer.destroy();
    expect(
      Boolean(originalFirstSource.destroyed),
      'preserves the first original borrowed GPU source'
    ).toBe(false);
    expect(
      Boolean(originalSecondSource.destroyed),
      'preserves the second original borrowed GPU source'
    ).toBe(false);
    firstPage.destroy();
    secondPage.destroy();
  }

  void 0;
});

it('GPUPagedSplatRenderer calibrates perspective, antialiasing, and Spark RAD parent opacity', async () => {
  const devices = await getTestDevices(['webgpu']);

  for (const device of devices) {
    if (isSoftwareBackedPagedDevice(device)) {
      void 0;
      continue;
    }

    const source = makeBrowserPagedSplatSource([0.2], 1900, 31);
    source.positions.set([0.4, 0, 0.2]);
    source.scales.set([0.12, 0.08, 0.6]);
    source.colors = new Float32Array([1, 1, 1, 1]);
    source.opacities[0] = 0.8;
    const page = makeGPUSplatData(device, source);
    const viewportSize = 96;
    const gaussianSupportRadius = Math.sqrt(8);
    const perspectiveMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1];
    const renderer = new GPUPagedSplatRenderer(device, {
      pages: [{id: 'calibrated-rad-parent', data: page}],
      modelViewProjectionMatrix: perspectiveMatrix,
      viewportSize: [viewportSize, viewportSize],
      gaussianSupportRadius,
      kernel2DSize: Math.sqrt(0.3),
      alphaCutoff: 0,
      toneMapping: 'none'
    });

    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'encodes analytic perspective covariance'
    ).toBe(true);
    const originalGraph = renderer.compiledGraph;
    device.submit();
    const perspectiveRecord = await readPagedProjectedRecord(renderer);
    const clipW = 1.2;
    const halfViewport = viewportSize * 0.5;
    const horizontalDeviation = Math.hypot(
      (halfViewport * 0.12) / clipW,
      (halfViewport * 0.4 * 0.6) / (clipW * clipW)
    );
    const verticalDeviation = (halfViewport * 0.08) / clipW;
    const expectedHorizontalRadius =
      Math.sqrt(horizontalDeviation * horizontalDeviation + 0.3) * gaussianSupportRadius;
    const actualHorizontalRadius = Math.hypot(perspectiveRecord[4], perspectiveRecord[5]);
    expect(
      Boolean(Math.abs(actualHorizontalRadius - expectedHorizontalRadius) < 0.03),
      `projects the exact perspective Jacobian radius ${actualHorizontalRadius.toFixed(3)} ≈ ${expectedHorizontalRadius.toFixed(3)}`
    ).toBe(true);
    const originalDeterminant =
      horizontalDeviation * horizontalDeviation * verticalDeviation * verticalDeviation;
    const filteredDeterminant =
      (horizontalDeviation * horizontalDeviation + 0.3) *
      (verticalDeviation * verticalDeviation + 0.3);
    const expectedFilteredOpacity = 0.8 * Math.sqrt(originalDeterminant / filteredDeterminant);
    expect(
      Boolean(Math.abs(perspectiveRecord[11] - expectedFilteredOpacity) < 0.001),
      'preserves integrated projected opacity under Spark-compatible screen-space filtering'
    ).toBe(true);

    page.updateRows(0, {scales: new Float32Array([0.002, 0.002, 0.002])});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'updates borrowed subpixel source covariance'
    ).toBe(true);
    device.submit();
    const subpixelRecord = await readPagedProjectedRecord(renderer);
    expect(
      Boolean(subpixelRecord[11] < 0.03),
      `attenuates a subpixel Gaussian by its true filtered-area ratio (${subpixelRecord[11].toFixed(4)})`
    ).toBe(true);

    page.updateRows(0, {
      positions: new Float32Array([0, 0, 0]),
      scales: new Float32Array([0.15, 0.15, 0.15]),
      opacities: new Float32Array([1.5])
    });
    const parentTextureSize = 64;
    renderer.setProps({
      modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      viewportSize: [parentTextureSize, parentTextureSize],
      kernel2DSize: 0,
      lodOpacity: false
    });
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'preserves ordinary opacity when RAD mode is off'
    ).toBe(true);
    device.submit();
    const conventionalRecord = await readPagedProjectedRecord(renderer);
    expect(
      Boolean(Math.abs(conventionalRecord[11] - 1.5) < 0.001),
      'does not reinterpret non-RAD source opacity above one'
    ).toBe(true);
    const conventionalPixel = await readPagedSplatPixel(
      device,
      renderer,
      parentTextureSize,
      parentTextureSize / 2 + 9,
      parentTextureSize / 2
    );

    renderer.setProps({lodOpacity: true});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'enables decoded Spark parent opacity in place'
    ).toBe(true);
    expect(renderer.compiledGraph, 'keeps the same bounded sparse GPU graph').toBe(originalGraph);
    device.submit();
    const parentRecord = await readPagedProjectedRecord(renderer);
    expect(
      Boolean(Math.abs(parentRecord[11] - 3) < 0.001),
      'maps decoded RAD opacity 1.5 to Spark parent opacity 3 without decoding twice'
    ).toBe(true);
    const conventionalRadius = Math.hypot(conventionalRecord[4], conventionalRecord[5]);
    const parentRadius = Math.hypot(parentRecord[4], parentRecord[5]);
    const expectedParentRadius =
      (conventionalRadius * (gaussianSupportRadius + 0.7 * (3 - 1))) / gaussianSupportRadius;
    expect(
      Boolean(Math.abs(parentRadius - expectedParentRadius) < 0.03),
      "expands the opaque parent support by Spark's authored 0.7-per-opacity-unit rule"
    ).toBe(true);
    const parentPixel = await readPagedSplatPixel(
      device,
      renderer,
      parentTextureSize,
      parentTextureSize / 2 + 9,
      parentTextureSize / 2
    );
    expect(
      Boolean(parentPixel[3] > 220 && conventionalPixel[3] < 100),
      `real parent-opacity pixel ${parentPixel[3]} uses Spark\'s nonlinear falloff instead of ordinary alpha ${conventionalPixel[3]}`
    ).toBe(true);

    page.updateRows(0, {scales: new Float32Array([0.3, 0.05, 0.15])});
    renderer.setProps({maxScreenSpaceSplatSize: 8});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'caps expanded parent support independently'
    ).toBe(true);
    device.submit();
    const cappedParentRecord = await readPagedProjectedRecord(renderer);
    const cappedMajorAxis = Math.hypot(cappedParentRecord[4], cappedParentRecord[5]);
    const cappedMinorAxis = Math.hypot(cappedParentRecord[6], cappedParentRecord[7]);
    const expectedMinorAxis =
      parentTextureSize * 0.5 * 0.05 * (gaussianSupportRadius + 0.7 * (3 - 1));
    expect(
      Boolean(Math.abs(cappedMajorAxis - 8) < 0.01),
      "caps the final expanded major support radius at Spark's maximum pixel size"
    ).toBe(true);
    expect(
      Boolean(Math.abs(cappedMinorAxis - expectedMinorAxis) < 0.03),
      'does not shrink the independent minor axis when only the major support is capped'
    ).toBe(true);

    page.updateRows(0, {
      positions: new Float32Array([1.2, 0, 0]),
      scales: new Float32Array([0.15, 0.15, 0.15])
    });
    renderer.setProps({lodOpacity: false, maxScreenSpaceSplatSize: 1024});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'retains a Gaussian crossing the viewport edge'
    ).toBe(true);
    device.submit();
    let commandBytes = await renderer.drawCommands.buffer.readAsync();
    let commands = new Uint32Array(
      commandBytes.buffer,
      commandBytes.byteOffset,
      commandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(commands[1], 'keeps off-frustum centers whose calibrated support remains visible').toBe(
      1
    );
    page.updateRows(0, {positions: new Float32Array([1.6, 0, 0])});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'rejects fully disjoint projected support'
    ).toBe(true);
    device.submit();
    commandBytes = await renderer.drawCommands.buffer.readAsync();
    commands = new Uint32Array(
      commandBytes.buffer,
      commandBytes.byteOffset,
      commandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(commands[1], 'culls only splats whose complete conservative extent is offscreen').toBe(
      0
    );

    renderer.destroy();
    expect(
      Boolean(page.colors.data[0].buffer.destroyed),
      'retains the borrowed HDR source color storage'
    ).toBe(false);
    page.destroy();
  }

  void 0;
});

it('GPUPagedSplatRenderer converts mixed sRGB pages without corrupting Float32 HDR radiance', async () => {
  const devices = await getTestDevices(['webgpu']);

  for (const device of devices) {
    if (isSoftwareBackedPagedDevice(device)) {
      void 0;
      continue;
    }

    const floatSource = makeBrowserPagedSplatSource([0.2], 2100, 41);
    floatSource.colors = new Float32Array([0.5, 0.25, 0.75, 1]);
    const packedSource = makeBrowserPagedSplatSource([0.8], 2300, 42);
    packedSource.colors.set([128, 64, 192, 255]);
    const floatPage = makeGPUSplatData(device, floatSource);
    const packedPage = makeGPUSplatData(device, packedSource);
    const textureSize = 32;
    const renderer = new GPUPagedSplatRenderer(device, {
      pages: [
        {id: 'linear-float-source', data: floatPage},
        {id: 'srgb-packed-source', data: packedPage}
      ],
      viewportSize: [textureSize, textureSize],
      kernel2DSize: 0,
      alphaCutoff: 0,
      toneMapping: 'none'
    });

    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'compiles mixed source columns on an SDR canvas'
    ).toBe(true);
    expect(
      renderer.props.toneMapping,
      'preserves explicit Spark-like Float32 source brightness without SDR Reinhard mapping'
    ).toBe('none');
    const originalGraph = renderer.compiledGraph;
    device.submit();
    renderer.setProps({exposure: 1.001});
    expect(
      Boolean(encodePagedHighDynamicRangeFrame(device, renderer)),
      'encodes per-source color flags into existing 128-byte uniforms'
    ).toBe(true);
    expect(renderer.compiledGraph, 'reuses one exact globally sorted source graph').toBe(
      originalGraph
    );
    device.submit();
    const mixedBytes = await renderer.projectedRecordBuffers[0].readAsync();
    const mixedRecords = new Float32Array(
      mixedBytes.buffer,
      mixedBytes.byteOffset,
      mixedBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    expect(
      Boolean(Math.abs(mixedRecords[8] - (128 / 255) ** 2.2) < 0.002),
      'converts the far Uint8 sRGB page to linear light before global gathering'
    ).toBe(true);
    expect(
      Boolean(Math.abs(mixedRecords[20] - 0.5) < 0.001),
      'preserves already-linear near Float32 HDR radiance in the same ordered output'
    ).toBe(true);
    const linearFloatPixel = await readPagedSplatPixel(
      device,
      renderer,
      textureSize,
      textureSize / 2,
      textureSize / 2
    );

    renderer.setProps({lodOpacity: true});
    expect(
      Boolean(encodePagedHighDynamicRangeFrame(device, renderer)),
      'interprets opt-in RAD Float32 source coefficients as Spark sRGB-domain colors'
    ).toBe(true);
    expect(renderer.compiledGraph, 'retains the same mixed-page compute graph').toBe(originalGraph);
    device.submit();
    const radBytes = await renderer.projectedRecordBuffers[0].readAsync();
    const radRecords = new Float32Array(
      radBytes.buffer,
      radBytes.byteOffset,
      radBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    expect(
      Boolean(Math.abs(radRecords[20] - 0.5 ** 2.2) < 0.002),
      'converts actual Float32 RAD DC plus SH radiance after source feature evaluation'
    ).toBe(true);
    const linearRadPixel = await readPagedSplatPixel(
      device,
      renderer,
      textureSize,
      textureSize / 2,
      textureSize / 2
    );
    expect(
      Boolean(linearFloatPixel[0] > 110 && linearRadPixel[0] < 70),
      `real HDR-target pixels preserve generic Float32 ${linearFloatPixel[0]} but linearize RAD sRGB ${linearRadPixel[0]}`
    ).toBe(true);

    renderer.destroy();
    expect(
      Boolean(floatPage.colors.data[0].buffer.destroyed),
      'retains original Float32 HDR source storage'
    ).toBe(false);
    expect(
      Boolean(packedPage.colors.data[0].buffer.destroyed),
      'retains original packed sRGB page storage'
    ).toBe(false);
    floatPage.destroy();
    packedPage.destroy();
  }

  void 0;
});

it('GPUPagedSplatRenderer reuses sparse real WebGPU graphs for semantic and row-frontier updates', async () => {
  const devices = await getTestDevices(['webgpu']);

  for (const device of devices) {
    if (isSoftwareBackedPagedDevice(device)) {
      void 0;
      continue;
    }

    const firstSource = makeBrowserPagedSplatSource([0.9, 0.1, 0.6], 100, 7);
    firstSource.semanticIds = new Uint32Array([4, 9, 4]);
    firstSource.sphericalHarmonics = new Float32Array(27);
    firstSource.sphericalHarmonicsDegree = 1;
    firstSource.sphericalHarmonics[2 * 3] = 0.5;
    const secondSource = makeBrowserPagedSplatSource([0.8, 0.2], 200, 8);
    secondSource.semanticIds = new Uint32Array([4, 9]);
    const firstPage = makeGPUSplatData(device, firstSource);
    const secondPage = makeGPUSplatData(device, secondSource);
    const renderer = new GPUPagedSplatRenderer(device, {
      pages: [
        {id: 'directional-page', data: firstPage, activeRows: new Uint32Array([0, 1])},
        {id: 'semantic-page', data: secondPage, activeRows: new Uint32Array([0, 1])}
      ],
      viewportSize: [16, 16],
      cameraPosition: [-1, 0, 0.9],
      sphericalHarmonicsDegree: 1,
      maxProjectedSplatsPerSegment: 2,
      semanticFilter: {include: [4]}
    });

    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'projects sparse original GPU row selections'
    ).toBe(true);
    device.submit();
    const originalGraph = renderer.compiledGraph;
    const originalSortedIndices = renderer.sortedIndexBuffer;
    const originalOutput = renderer.projectedRecordBuffers[0];
    const initialCommandBytes = await renderer.drawCommands.buffer.readAsync();
    const initialCommands = new Uint32Array(
      initialCommandBytes.buffer,
      initialCommandBytes.byteOffset,
      initialCommandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(
      [initialCommands[1], initialCommands[5], initialCommands[9]],
      'keeps only two semantically selected sparse rows in globally ordered indirect segments'
    ).toEqual([2, 2, 0]);

    const initialProjectedBytes = await originalOutput.readAsync();
    const initialProjected = new Float32Array(
      initialProjectedBytes.buffer,
      initialProjectedBytes.byteOffset,
      initialProjectedBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    const initialDirectionalRed = initialProjected[8];
    renderer.setProps({cameraPosition: [1, 0, 0.9], semanticFilter: {include: [4, 9]}});
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'updates sparse semantic and directional controls'
    ).toBe(true);
    expect(renderer.compiledGraph, 'reuses the same compiled cross-page graph').toBe(originalGraph);
    expect(renderer.sortedIndexBuffer, 'reuses the global GPU permutation').toBe(
      originalSortedIndices
    );
    device.submit();
    const updatedCommandBytes = await renderer.drawCommands.buffer.readAsync();
    const updatedCommands = new Uint32Array(
      updatedCommandBytes.buffer,
      updatedCommandBytes.byteOffset,
      updatedCommandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(
      [updatedCommands[1], updatedCommands[5], updatedCommands[9]],
      'restores all included sparse rows and splits GPU visibility over ordered output segments'
    ).toEqual([4, 2, 2]);
    const updatedProjectedBytes = await originalOutput.readAsync();
    const updatedProjected = new Float32Array(
      updatedProjectedBytes.buffer,
      updatedProjectedBytes.byteOffset,
      updatedProjectedBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    expect(
      Boolean(Math.abs(initialDirectionalRed - updatedProjected[8]) > 0.2),
      'evaluates original page-owned higher-order SH against the updated camera direction'
    ).toBe(true);

    renderer.setFrontier([
      {id: 'directional-page', data: firstPage, activeRows: new Uint32Array([2, 1])},
      {id: 'semantic-page', data: secondPage, activeRows: new Uint32Array([0, 1])}
    ]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'replaces sparse page-local row selections'
    ).toBe(true);
    expect(renderer.compiledGraph, 'retains graph identity for stable cardinality').toBe(
      originalGraph
    );
    expect(renderer.projectedRecordBuffers[0], 'retains bounded output storage').toBe(
      originalOutput
    );
    device.submit();
    const frontierSortedBytes = await renderer.sortedIndexBuffer!.readAsync();
    const frontierSorted = new Uint32Array(
      frontierSortedBytes.buffer,
      frontierSortedBytes.byteOffset,
      frontierSortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(
      Array.from(frontierSorted),
      'resorts replaced original source offsets exactly across overlapping page depths'
    ).toEqual([2, 0, 3, 1]);

    renderer.setFrontier([
      {id: 'directional-page', data: firstPage, activeRows: new Uint32Array([2])},
      {id: 'semantic-page', data: secondPage, activeRows: new Uint32Array([0, 1])}
    ]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'shrinks a stable sparse frontier in place'
    ).toBe(true);
    expect(
      renderer.compiledGraph,
      'retains graph identity while active cardinality changes inside its sort bucket'
    ).toBe(originalGraph);
    expect(renderer.sortedIndexBuffer, 'retains bucketed sort storage').toBe(originalSortedIndices);
    expect(renderer.stats.activeRowCount, 'reports the exact smaller active frontier').toBe(3);
    expect(renderer.stats.globalSortCapacity, 'does not shrink the reusable sort bucket').toBe(4);
    device.submit();
    const smallerFrontierSortedBytes = await renderer.sortedIndexBuffer!.readAsync();
    const smallerFrontierSorted = new Uint32Array(
      smallerFrontierSortedBytes.buffer,
      smallerFrontierSortedBytes.byteOffset,
      smallerFrontierSortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(
      Array.from(smallerFrontierSorted.slice(0, 3)),
      'keeps exact global source identities after sparse cardinality shrinks'
    ).toEqual([1, 0, 2]);

    renderer.setFrontier([]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'encodes one clear when a hierarchy empties'
    ).toBe(true);
    expect(renderer.compiledGraph, 'preserves graph allocations while empty').toBe(originalGraph);
    device.submit();
    renderer.setFrontier([
      {id: 'directional-page', data: firstPage, activeRows: new Uint32Array([2, 1])},
      {id: 'semantic-page', data: secondPage, activeRows: new Uint32Array([0, 1])}
    ]);
    expect(
      Boolean(renderer.encode(device.commandEncoder)),
      'reactivates the preserved sparse page frontier'
    ).toBe(true);
    expect(renderer.compiledGraph, 'restores the original reusable graph').toBe(originalGraph);
    device.submit();

    const sourceHarmonics = firstPage.sphericalHarmonics!.data[0].buffer;
    const sourceSemantics = secondPage.semanticIds!.data[0].buffer;
    renderer.destroy();
    expect(
      Boolean(sourceHarmonics.destroyed),
      'never destroys borrowed original higher-order SH buffers'
    ).toBe(false);
    expect(
      Boolean(sourceSemantics.destroyed),
      'never destroys borrowed original semantic source buffers'
    ).toBe(false);
    firstPage.destroy();
    secondPage.destroy();
  }

  void 0;
});

it('GPUPagedSplatRenderer binds aligned real WebGPU source ranges across sparse degree-three pages', async () => {
  const devices = await getTestDevices(['webgpu']);

  for (const device of devices) {
    if (isSoftwareBackedPagedDevice(device)) {
      void 0;
      continue;
    }

    const rowCount = 130;
    const firstSource = makeBrowserPagedSplatSource(
      Array.from({length: rowCount}, (_, rowIndex) => rowIndex / rowCount),
      2_000,
      22
    );
    firstSource.sphericalHarmonics = new Float32Array(rowCount * 45);
    firstSource.sphericalHarmonicsDegree = 3;
    firstSource.semanticIds = new Uint32Array(rowCount).fill(4);
    const secondSource = makeBrowserPagedSplatSource(
      Array.from({length: rowCount}, (_, rowIndex) => (rowCount - rowIndex) / (rowCount + 1)),
      8_000,
      23
    );
    secondSource.colors = new Float32Array(rowCount * 4);
    secondSource.sphericalHarmonics = new Float32Array(rowCount * 45);
    secondSource.sphericalHarmonicsDegree = 3;
    secondSource.semanticIds = new Uint32Array(rowCount).fill(9);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      firstSource.sphericalHarmonics[rowIndex * 45 + 2 * 3] = 0.25;
      secondSource.sphericalHarmonics[rowIndex * 45 + 2 * 3] = 0.25;
      secondSource.colors.set([2, 0.25, 0.125, 1], rowIndex * 4);
    }
    const firstPage = makeGPUSplatData(device, firstSource);
    const secondPage = makeGPUSplatData(device, secondSource);
    const originalLimits = device.limits;
    const forcedBindingByteLength = 12_288;
    Object.defineProperty(device, 'limits', {
      configurable: true,
      value: new Proxy(originalLimits, {
        get(target, property) {
          if (property === 'maxStorageBufferBindingSize') {
            return forcedBindingByteLength;
          }
          return Reflect.get(target, property);
        }
      })
    });
    let renderer: GPUPagedSplatRenderer | undefined;

    try {
      renderer = new GPUPagedSplatRenderer(device, {
        pages: [{id: 'aligned-packed-page', data: firstPage}],
        viewportSize: [16, 16],
        cameraPosition: [1, 0, 0.5],
        sphericalHarmonicsDegree: 3,
        maxProjectedSplatsPerSegment: 20,
        toneMapping: 'none',
        semanticFilter: {include: [4, 9]}
      });
      expect(
        Boolean(firstPage.sphericalHarmonics!.data[0].buffer.byteLength > forcedBindingByteLength),
        'retains a degree-three source allocation larger than the simulated device binding limit'
      ).toBe(true);
      expect(
        renderer.stats.sourceSegmentCount,
        'projects source rows through two aligned 64-row windows and one original tail'
      ).toBe(9);
      expect(
        Boolean(renderer.encode(device.commandEncoder)),
        'encodes aligned original source storage ranges'
      ).toBe(true);
      expect(
        renderer.stats.segmentCount,
        'splits power-of-two global output capacity into bounded segments'
      ).toBe(13);
      device.submit();
      const completeSortedBytes = await renderer.sortedIndexBuffer!.readAsync();
      const completeSortedIndices = new Uint32Array(
        completeSortedBytes.buffer,
        completeSortedBytes.byteOffset,
        completeSortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(
        Array.from(completeSortedIndices.slice(0, rowCount)),
        'retains exact global ordering across every aligned source and output window'
      ).toEqual(Array.from({length: rowCount}, (_, sortedRow) => rowCount - sortedRow - 1));

      renderer.setFrontier([
        {
          id: 'aligned-packed-page',
          data: firstPage,
          activeRows: new Uint32Array([63, 64, 129])
        },
        {
          id: 'aligned-float-page',
          data: secondPage,
          activeRows: new Uint32Array([0, 65, 128])
        }
      ]);
      expect(
        renderer.stats.sourceSegmentCount,
        'retains stable aligned source windows for both sparse pages'
      ).toBe(18);
      expect(
        renderer.stats.activeRowCount,
        'dispatches only six selected original source rows'
      ).toBe(6);
      expect(
        Boolean(renderer.encode(device.commandEncoder)),
        'binds original Uint8 and Float32 source columns without uploading merged row buffers'
      ).toBe(true);
      device.submit();
      const sparseSortedBytes = await renderer.sortedIndexBuffer!.readAsync();
      const sparseSortedIndices = new Uint32Array(
        sparseSortedBytes.buffer,
        sparseSortedBytes.byteOffset,
        sparseSortedBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(
        Array.from(sparseSortedIndices.slice(0, 6)),
        'globally interleaves preserved sparse page rows across three source-binding windows'
      ).toEqual([3, 2, 4, 1, 0, 5]);
      const projectedBytes = await renderer.projectedRecordBuffers[0].readAsync();
      const projectedRecords = new Float32Array(
        projectedBytes.buffer,
        projectedBytes.byteOffset,
        projectedBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
      );
      expect(
        Boolean(projectedRecords[8] > 1.5),
        'retains unquantized Float32 page radiance while evaluating degree-three source SH'
      ).toBe(true);
    } finally {
      renderer?.destroy();
      Object.defineProperty(device, 'limits', {configurable: true, value: originalLimits});
      expect(
        Boolean(firstPage.sphericalHarmonics!.data[0].buffer.destroyed),
        'never destroys an oversized borrowed Uint8-page SH source allocation'
      ).toBe(false);
      expect(
        Boolean(secondPage.colors.data[0].buffer.destroyed),
        'never destroys an independently borrowed Float32 source color allocation'
      ).toBe(false);
      firstPage.destroy();
      secondPage.destroy();
    }
  }

  void 0;
});

function makeBrowserPagedSplatSource(
  depths: readonly number[],
  rowIndexBase: number,
  sourceBatchIndex: number
): SplatSource {
  const positions = new Float32Array(depths.length * 3);
  const scales = new Float32Array(depths.length * 3);
  const rotations = new Float32Array(depths.length * 4);
  const colors = new Uint8Array(depths.length * 4);
  const opacities = new Float32Array(depths.length);
  for (const [rowIndex, depth] of depths.entries()) {
    positions[rowIndex * 3 + 2] = depth;
    scales.set([0.8, 0.8, 0.1], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([128, 64, 32, 255], rowIndex * 4);
    opacities[rowIndex] = 1;
  }
  return {positions, scales, rotations, colors, opacities, rowIndexBase, sourceBatchIndex};
}

async function readPagedProjectedRecord(renderer: GPUPagedSplatRenderer): Promise<Float32Array> {
  const bytes = await renderer.projectedRecordBuffers[0].readAsync();
  return new Float32Array(bytes.buffer, bytes.byteOffset, 12);
}

function encodePagedHighDynamicRangeFrame(
  device: Device,
  renderer: GPUPagedSplatRenderer
): boolean {
  const canvasContext = device.canvasContext;
  if (!canvasContext) {
    return false;
  }
  const originalColorFormat = device.preferredColorFormat;
  const originalToneMapping = canvasContext.props.toneMapping;
  Object.defineProperty(device, 'preferredColorFormat', {configurable: true, value: 'rgba16float'});
  canvasContext.props.toneMapping = 'extended';
  try {
    return Boolean(renderer.encode(device.commandEncoder));
  } finally {
    Object.defineProperty(device, 'preferredColorFormat', {
      configurable: true,
      value: originalColorFormat
    });
    canvasContext.props.toneMapping = originalToneMapping;
  }
}

async function readPagedSplatPixel(
  device: Device,
  renderer: GPUPagedSplatRenderer,
  textureSize: number,
  pixelX: number,
  pixelY: number
): Promise<Uint8Array> {
  const colorTexture = device.createTexture({
    format: 'rgba8unorm',
    width: textureSize,
    height: textureSize,
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: textureSize,
    height: textureSize,
    colorAttachments: [colorTexture],
    depthStencilAttachment: 'depth24plus'
  });
  const model = new Model(device, {
    id: 'paged-gaussian-calibrated-parent-readback',
    source: GPU_PAGED_SPLAT_RENDER_SHADER,
    shaderLayout: GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT,
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: 'depth24plus',
    isInstanced: true,
    instanceCount: 1,
    vertexCount: 4,
    topology: 'triangle-strip',
    bindings: {
      graphUniforms: renderer.uniformBuffer!,
      projectedRecords: renderer.projectedRecordBuffers[0]
    },
    parameters: {
      depthWriteEnabled: false,
      depthCompare: 'less-equal',
      blend: true,
      blendColorOperation: 'add',
      blendAlphaOperation: 'add',
      blendColorSrcFactor: 'src-alpha',
      blendColorDstFactor: 'one-minus-src-alpha',
      blendAlphaSrcFactor: 'one',
      blendAlphaDstFactor: 'one-minus-src-alpha'
    }
  });
  model.predraw(device.commandEncoder);
  const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0], clearDepth: 1});
  renderPass.setPipeline(model.pipeline);
  renderPass.setVertexArray(model.vertexArray);
  renderPass.setBindings({
    graphUniforms: renderer.uniformBuffer!,
    projectedRecords: renderer.projectedRecordBuffers[0]
  });
  renderer.drawCommands.draw(renderPass, 1);
  renderPass.end();
  device.submit();

  const pixelLayout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
  const pixelReadback = device.createBuffer({
    byteLength: pixelLayout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  colorTexture.readBuffer({width: textureSize, height: textureSize}, pixelReadback);
  const pixels = await pixelReadback.readAsync(0, pixelLayout.byteLength);
  const pixelOffset = pixelY * pixelLayout.bytesPerRow + pixelX * 4;
  const pixel = pixels.slice(pixelOffset, pixelOffset + 4);
  pixelReadback.destroy();
  model.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  return pixel;
}

function isSoftwareBackedPagedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
