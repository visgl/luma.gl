// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {decodeGPUIndexPickInfo, INDEX_PICKING_READBACK_BYTE_LENGTH} from '@luma.gl/experimental';
import type {GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import LuGraphExplorerAnimationLoopTemplate from '../../../../examples/experimental/lugraph-explorer/app';
import {
  GRAPH_EXPLORER_VERTEX_COUNTS,
  makeGraphExplorerDataset,
  type GraphExplorerDataset,
  type GraphExplorerLayoutMode
} from '../../../../examples/experimental/lugraph-explorer/graph-data';

type ExplorerAnimationProps = AnimationProps & {
  dataset?: GraphExplorerDataset;
  layoutMode?: GraphExplorerLayoutMode;
  pointMode?: boolean;
  maxVisibleEdges?: number;
};

type ExplorerGraphBindings = {
  frameColorId: string;
  frameDepthId: string;
  pickingReadbackId: string;
  frameWidth: number;
  frameHeight: number;
};

type ExplorerPointerBindings = {
  readPickedVertex(ticket: {read: () => Promise<Uint8Array>}): Promise<void>;
};

type ExplorerDashboardBindings = {
  colorMode: string;
  nodeSizeMode: string;
  paused: boolean;
  edgesVisible: boolean;
  viewUniforms: Buffer;
  writeViewUniforms(width: number, height: number): void;
};

test('luGraph explorer constructs actual GPU models and computes source-aligned graph analytics', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const submitSpy = vi.spyOn(device, 'submit');
  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  try {
    explorer = createExplorer(device);
    tapeTest.equal(submitSpy.mock.calls.length, 0, 'construction never submits hidden GPU work');
    submitSpy.mockRestore();

    const dataset = makeGraphExplorerDataset();
    tapeTest.equal(
      explorer.graph.vertexCount,
      dataset.vertexCount,
      'source vertex identities stay stable'
    );
    tapeTest.deepEqual(
      explorer.graph.sourceVertices.data.map(chunk => chunk.length),
      dataset.sourceChunks.map(chunk => chunk.length),
      'source edge vectors retain original nonempty, empty, and nonempty batches'
    );
    tapeTest.deepEqual(
      explorer.edgeModels.map(model => model.chunkIndex),
      [0, 2],
      'each nonempty original edge batch has its own directly bound edge model'
    );
    tapeTest.ok(
      explorer.nodeModel.pipeline,
      'actual WebGPU node shader and vertex pipeline compile'
    );
    tapeTest.ok(
      explorer.pickingModel.pipeline,
      'actual integer picking shader and pipeline compile'
    );
    tapeTest.equal(
      explorer.nodeModel.bindings['degrees'],
      explorer.degree.output.data[0].buffer,
      'node color and sizing consume the actual GPU-computed degree buffer'
    );
    tapeTest.equal(
      explorer.pickingModel.bindings['degrees'],
      explorer.degree.output.data[0].buffer,
      'integer picking uses the same degree-dependent radius as visible nodes'
    );
    tapeTest.equal(
      explorer.layout.positions.data[0].buffer.usage & (Buffer.STORAGE | Buffer.VERTEX),
      Buffer.STORAGE | Buffer.VERTEX,
      'progressive layout coordinates are the same physical render vertex allocation'
    );

    executeAnalysis(device, explorer);
    const [
      degrees,
      componentLabels,
      communityLabels,
      importance,
      forwardCount,
      reverseCount,
      invalid,
      overflow
    ] = await Promise.all([
      readUint32Vector(explorer.degree.output),
      readUint32Vector(explorer.components.output),
      readUint32Vector(explorer.communities.output),
      readFloat32Vector(explorer.pageRank.output),
      readUint32Vector(explorer.topology.forward.count),
      readUint32Vector(explorer.topology.reverse!.count),
      readUint32Vector(explorer.topology.invalidEdgeCount),
      readUint32Vector(explorer.topology.forward.overflow)
    ]);

    tapeTest.equal(
      forwardCount[0],
      explorer.graph.edgeCount,
      'GPU builds every original directed edge'
    );
    tapeTest.equal(reverseCount[0], explorer.graph.edgeCount, 'GPU builds full reverse adjacency');
    tapeTest.equal(invalid[0], 0, 'deterministic dataset contains no invalid source identifiers');
    tapeTest.equal(overflow[0], 0, 'caller-owned graph adjacency has adequate explicit capacity');
    tapeTest.equal(
      degrees.reduce((sum, degree) => sum + degree, 0),
      explorer.graph.edgeCount,
      'GPU degree outputs exactly account for all original source edges'
    );
    tapeTest.equal(degrees[dataset.vertexCount - 1], 0, 'final isolated vertex has degree zero');
    tapeTest.equal(
      componentLabels[0],
      0,
      'first community retains minimum stable source identifier'
    );
    tapeTest.equal(
      componentLabels[32],
      0,
      'one actual bridge joins the first two weak communities'
    );
    tapeTest.equal(communityLabels[0], 0, 'GPU label propagation preserves the first community');
    tapeTest.equal(
      communityLabels[32],
      32,
      'the same bridge leaves the second majority-vote community visibly distinct'
    );
    tapeTest.notEqual(
      communityLabels[32],
      componentLabels[32],
      'true GPU community coloring is not a relabeled weak-component result'
    );
    tapeTest.equal(componentLabels[64], 64, 'third disconnected community keeps its own component');
    tapeTest.equal(
      componentLabels[96],
      96,
      'fourth disconnected community keeps its own component'
    );
    tapeTest.equal(
      componentLabels[dataset.vertexCount - 1],
      dataset.vertexCount - 1,
      'isolated node retains its own stable component identifier'
    );
    tapeTest.ok(
      importance.every(score => Number.isFinite(score) && score > 0),
      'real dangling-aware PageRank supplies positive node sizing values'
    );
    tapeTest.ok(
      Math.abs(importance.reduce((sum, score) => sum + score, 0) - 1) < 5e-5,
      'GPU node importance remains correctly normalized'
    );
  } finally {
    submitSpy.mockRestore();
    explorer?.onFinalize();
  }

  tapeTest.end();
});

test('luGraph explorer renders original GPU chunks, highlights neighborhoods, pins, and picks stable nodes', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  let color: Texture | undefined;
  let depth: Texture | undefined;
  let pickingReadback: Buffer | undefined;
  const devicePixelSizeSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'getDevicePixelSize')
    .mockReturnValue([320, 240]);
  try {
    explorer = createExplorer(device);
    const bindings = explorer as unknown as ExplorerGraphBindings;
    tapeTest.deepEqual(
      [bindings.frameWidth, bindings.frameHeight],
      [320, 240],
      'GPU picking uses real centered device pixels rather than assuming a one-pixel test canvas'
    );
    color = device.createTexture({
      id: 'lugraph-explorer-test-color',
      format: device.preferredColorFormat,
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    depth = device.createTexture({
      id: 'lugraph-explorer-test-depth',
      format: 'depth24plus',
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    pickingReadback = device.createBuffer({
      id: 'lugraph-explorer-test-picking-readback',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });

    // Preserve one centered instance so its true rendered circle covers the current canvas center.
    (explorer.layout.positions.data[0].buffer as Buffer).write(Float32Array.from([0, 0]));
    (explorer.layout.pinned!.data[0].buffer as Buffer).write(Uint32Array.from([1]));

    const encoder = device.createCommandEncoder({id: 'lugraph-explorer-real-frame'});
    explorer.analysisGraph.encode(encoder, {parameters: undefined});
    explorer.frameGraph.encode(encoder, {
      parameters: {width: bindings.frameWidth, height: bindings.frameHeight},
      frameTextures: {
        [bindings.frameColorId]: {texture: color, frameId: 0},
        [bindings.frameDepthId]: {texture: depth, frameId: 0}
      }
    });
    explorer.pickingGraph.encode(encoder, {
      parameters: {
        pixel: [Math.floor(bindings.frameWidth / 2), Math.floor(bindings.frameHeight / 2)]
      },
      buffers: {[bindings.pickingReadbackId]: pickingReadback}
    });
    device.submit(encoder.finish());

    const [distances, mask, pin, bytes] = await Promise.all([
      readUint32Vector(explorer.search.distances),
      readUint32Vector(explorer.search.mask!),
      readUint32Vector(explorer.layout.pinned!),
      pickingReadback.readAsync(0, 8)
    ]);
    const pick = decodeGPUIndexPickInfo(bytes);

    tapeTest.equal(distances[0], 0, 'selected root is highlighted at GPU hop distance zero');
    tapeTest.ok(
      distances.some(distance => distance === 1 || distance === 2),
      'GPU traversal publishes a bounded multi-hop neighborhood'
    );
    tapeTest.equal(mask[0], 1, 'node shader receives the source-aligned GPU selection mask');
    tapeTest.equal(
      mask[explorer.graph.vertexCount - 1],
      0,
      'disconnected isolated nodes remain outside the highlighted component'
    );
    tapeTest.equal(pin[0], 1, 'dragged node remains pinned through force integration');
    tapeTest.equal(
      pick.objectIndex,
      0,
      'integer GPU picking recovers the original stable vertex ID'
    );
  } finally {
    devicePixelSizeSpy.mockRestore();
    pickingReadback?.destroy();
    depth?.destroy();
    color?.destroy();
    explorer?.onFinalize();
  }

  tapeTest.end();
});

test('luGraph explorer exposes genuine GPU analytics and only expands its own graph inspector', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const unrelatedInfoBox = document.createElement('section');
  unrelatedInfoBox.setAttribute('data-info-box-appearance', 'cinematic');
  const unrelatedToggle = document.createElement('button');
  unrelatedToggle.setAttribute('aria-expanded', 'false');
  unrelatedToggle.setAttribute('aria-label', 'Expand info box');
  unrelatedInfoBox.append(unrelatedToggle);

  const graphInfoBox = document.createElement('section');
  graphInfoBox.setAttribute('data-info-box-appearance', 'cinematic');
  const graphToggle = document.createElement('button');
  graphToggle.setAttribute('aria-expanded', 'false');
  graphToggle.setAttribute('aria-label', 'Expand info box');
  const host = document.createElement('div');
  host.id = 'example-panel-host';
  graphInfoBox.append(graphToggle, host);
  document.body.append(unrelatedInfoBox, graphInfoBox);

  const unrelatedExpansion = vi.fn();
  const graphExpansion = vi.fn(() => graphToggle.setAttribute('aria-expanded', 'true'));
  unrelatedToggle.addEventListener('click', unrelatedExpansion);
  graphToggle.addEventListener('click', graphExpansion);

  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  try {
    explorer = createExplorer(device);
    const dashboard = explorer as unknown as ExplorerDashboardBindings;
    tapeTest.equal(graphExpansion.mock.calls.length, 1, 'the graph inspector opens exactly once');
    tapeTest.equal(
      unrelatedExpansion.mock.calls.length,
      0,
      'unrelated collapsed example inspectors are never opened'
    );

    const color = host.querySelector<HTMLSelectElement>('[data-color-mode]');
    const size = host.querySelector<HTMLSelectElement>('[data-node-size]');
    const pause = host.querySelector<HTMLButtonElement>('[data-pause]');
    const edges = host.querySelector<HTMLButtonElement>('[data-edge-toggle]');
    const depth = host.querySelector<HTMLInputElement>('[data-depth]');
    tapeTest.deepEqual(
      Array.from(color!.options, option => option.value),
      ['community', 'component', 'degree', 'pagerank', 'distance'],
      'all five available GPU analytics are selectable as node colors'
    );
    tapeTest.deepEqual(
      Array.from(size!.options, option => option.value),
      ['pagerank', 'degree', 'uniform'],
      'importance, degree, and uniform node sizing are independently selectable'
    );

    color!.value = 'degree';
    color!.dispatchEvent(new Event('change', {bubbles: true}));
    size!.value = 'degree';
    size!.dispatchEvent(new Event('change', {bubbles: true}));
    tapeTest.equal(dashboard.colorMode, 'degree', 'degree coloring updates the real render state');
    tapeTest.equal(dashboard.nodeSizeMode, 'degree', 'degree sizing updates the real render state');
    tapeTest.ok(
      host.querySelector('[data-graph-legend]')?.textContent?.includes('vertex degree'),
      'the visible legend describes the active GPU-computed color metric'
    );

    const uniformWrite = vi.spyOn(dashboard.viewUniforms, 'write');
    dashboard.writeViewUniforms(320, 240);
    const uniformBytes = uniformWrite.mock.calls[0][0] as Uint8Array;
    tapeTest.equal(
      new DataView(uniformBytes.buffer, uniformBytes.byteOffset, uniformBytes.byteLength).getUint32(
        28,
        true
      ),
      (2 << 1) | (1 << 4),
      'the shared node and picking uniform packs the selected genuine GPU metric modes'
    );
    uniformWrite.mockRestore();

    depth!.value = '4';
    depth!.dispatchEvent(new Event('input', {bubbles: true}));
    tapeTest.equal(
      (await readUint32Vector(explorer.search.activeDepth!))[0],
      4,
      'the depth slider writes the existing GPU traversal control'
    );

    const layoutNode = 'lugraph-explorer-layout-initialize';
    tapeTest.ok(explorer.frameGraph.stats.nodeOrder.includes(layoutNode), 'layout starts active');
    pause!.click();
    tapeTest.equal(dashboard.paused, true, 'pausing changes actual graph execution state');
    tapeTest.equal(pause!.getAttribute('aria-pressed'), 'true', 'pause state remains accessible');
    tapeTest.equal(
      explorer.frameGraph.stats.nodeOrder.includes(layoutNode),
      false,
      'pausing removes actual force-layout compute from the compiled frame graph'
    );
    tapeTest.ok(
      explorer.frameGraph.stats.nodeOrder.includes('lugraph-explorer-neighborhood-initialize'),
      'selection and neighborhood traversal remain active while layout is paused'
    );
    pause!.click();
    tapeTest.ok(
      explorer.frameGraph.stats.nodeOrder.includes(layoutNode),
      'resuming restores real force-layout compute'
    );

    edges!.click();
    tapeTest.equal(dashboard.edgesVisible, false, 'edge visibility changes actual rendering state');
    tapeTest.equal(edges!.getAttribute('aria-pressed'), 'false', 'edge state remains accessible');
    tapeTest.ok(host.querySelector('[data-status]')?.textContent?.includes('depth 4'));
    tapeTest.ok(host.querySelector('[data-graph-adapter]')?.textContent?.includes('GPU adapter:'));
    tapeTest.ok(host.querySelector('[data-graph-memory]')?.textContent?.includes('KiB resident'));
    tapeTest.ok(
      host.querySelector('[data-graph-fps]')?.textContent?.includes('CPU command encoding'),
      'telemetry identifies CPU encoding honestly instead of inventing GPU execution timings'
    );
    tapeTest.equal(graphExpansion.mock.calls.length, 1, 'interaction never reopens the inspector');
  } finally {
    explorer?.onFinalize();
    graphInfoBox.remove();
    unrelatedInfoBox.remove();
  }

  tapeTest.end();
});

test('luGraph native showcase renders every real GPU point while sampling only forces and visible original edges', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  let color: Texture | undefined;
  let depth: Texture | undefined;
  let pickingReadback: Buffer | undefined;
  // Odd dimensions place the pinned origin on a pixel center across software GPU backends.
  const devicePixelSizeSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'getDevicePixelSize')
    .mockReturnValue([65, 49]);
  try {
    explorer = createExplorer(device, 32, 'sampled', {pointMode: true, maxVisibleEdges: 4});
    tapeTest.equal(
      explorer.activeLayoutMode,
      'sampled',
      'the actual four-sample force path is used'
    );
    tapeTest.equal(
      explorer.layout.repulsion,
      0.0015,
      'four-sample repulsion remains positive and independent of population size'
    );
    tapeTest.equal(
      explorer.layout.gravity,
      0.005,
      'bounded sampled gravity preserves visible source communities'
    );
    tapeTest.equal(explorer.pointMode, true, 'full-population point rendering is enabled');
    tapeTest.equal(explorer.renderedVertexCount, 32, 'every actual original vertex stays rendered');
    tapeTest.equal(explorer.renderedEdgeCount, 4, 'only displayed original edges are decimated');
    tapeTest.ok(explorer.graph.edgeCount > 4, 'full GPU adjacency retains all original edge rows');
    tapeTest.equal(
      explorer.spatialLayout,
      null,
      'sampled forces do not misrepresent a spatial grid'
    );
    tapeTest.deepEqual(
      explorer.edgeModels.map(({model}) => model.instanceCount),
      [2, 2],
      'edge-only detail remains source-aligned across both nonempty original batches'
    );
    tapeTest.equal(
      explorer.nodeModel.topology,
      'point-list',
      'nodes use a real GPU point pipeline'
    );
    tapeTest.equal(explorer.nodeModel.vertexCount, 1, 'each source vertex produces one GPU point');
    tapeTest.equal(
      explorer.nodeModel.instanceCount,
      32,
      'point instances cover every graph vertex'
    );
    tapeTest.equal(
      explorer.pickingModel.topology,
      'point-list',
      'integer picking consumes real points'
    );
    tapeTest.equal(
      explorer.pickingModel.instanceCount,
      32,
      'picking preserves every stable source ID'
    );

    const bindings = explorer as unknown as ExplorerGraphBindings;
    color = device.createTexture({
      id: 'lugraph-showcase-sampled-point-color',
      format: device.preferredColorFormat,
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    depth = device.createTexture({
      id: 'lugraph-showcase-sampled-point-depth',
      format: 'depth24plus',
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    pickingReadback = device.createBuffer({
      id: 'lugraph-showcase-sampled-point-picking',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    (explorer.layout.positions.data[0].buffer as Buffer).write(Float32Array.of(0, 0));
    (explorer.layout.pinned!.data[0].buffer as Buffer).write(Uint32Array.of(1));

    const encoder = device.createCommandEncoder({id: 'lugraph-showcase-real-sampled-point-frame'});
    explorer.analysisGraph.encode(encoder, {parameters: undefined});
    const searchGraph = (explorer as unknown as {searchGraph: typeof explorer.analysisGraph | null})
      .searchGraph;
    searchGraph?.encode(encoder, {parameters: undefined});
    explorer.frameGraph.encode(encoder, {
      parameters: {width: bindings.frameWidth, height: bindings.frameHeight},
      frameTextures: {
        [bindings.frameColorId]: {texture: color, frameId: 0},
        [bindings.frameDepthId]: {texture: depth, frameId: 0}
      }
    });
    explorer.pickingGraph.encode(encoder, {
      parameters: {
        pixel: [Math.floor(bindings.frameWidth / 2), Math.floor(bindings.frameHeight / 2)]
      },
      buffers: {[bindings.pickingReadbackId]: pickingReadback}
    });
    device.submit(encoder.finish());

    const [forward, reverse, degrees, components, communities, importance, bytes] =
      await Promise.all([
        readUint32Vector(explorer.topology.forward.count),
        readUint32Vector(explorer.topology.reverse!.count),
        readUint32Vector(explorer.degree.output),
        readUint32Vector(explorer.components.output),
        readUint32Vector(explorer.communities.output),
        readFloat32Vector(explorer.pageRank.output),
        pickingReadback.readAsync(0, INDEX_PICKING_READBACK_BYTE_LENGTH)
      ]);
    tapeTest.equal(forward[0], explorer.graph.edgeCount, 'GPU retains every original forward edge');
    tapeTest.equal(reverse[0], explorer.graph.edgeCount, 'GPU retains every original reverse edge');
    tapeTest.equal(
      degrees.reduce((sum, degree) => sum + degree, 0),
      explorer.graph.edgeCount,
      'GPU degrees use the complete edge graph instead of its displayed subset'
    );
    tapeTest.equal(components[8], 0, 'actual weak components still span the source bridge');
    tapeTest.equal(communities[8], 8, 'GPU majority-vote communities remain distinct');
    tapeTest.ok(
      Math.abs(importance.reduce((sum, score) => sum + score, 0) - 1) < 5e-5,
      'full-graph GPU PageRank remains normalized in sampled-force mode'
    );
    tapeTest.equal(
      decodeGPUIndexPickInfo(bytes).objectIndex,
      0,
      'actual integer GPU point picking returns the stable original source vertex'
    );
  } finally {
    devicePixelSizeSpy.mockRestore();
    pickingReadback?.destroy();
    depth?.destroy();
    color?.destroy();
    explorer?.onFinalize();
  }

  tapeTest.end();
});

test('luGraph explorer waits for the current asynchronous GPU pick before dragging a different node', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  const cleanup: Array<() => void> = [];
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  let capturedPointerId: number | null = null;

  const devicePixelSizeSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'getDevicePixelSize')
    .mockReturnValue([320, 240]);
  cleanup.push(() => devicePixelSizeSpy.mockRestore());
  const pixelConversionSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'cssToDevicePixels')
    .mockReturnValue({x: 160, y: 120, width: 1, height: 1});
  cleanup.push(() => pixelConversionSpy.mockRestore());
  const boundsSpy = vi
    .spyOn(canvas, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, 320, 240));
  cleanup.push(() => boundsSpy.mockRestore());
  const captureSpy = vi.spyOn(canvas, 'setPointerCapture').mockImplementation(pointerId => {
    capturedPointerId = pointerId;
  });
  cleanup.push(() => captureSpy.mockRestore());
  const hasCaptureSpy = vi
    .spyOn(canvas, 'hasPointerCapture')
    .mockImplementation(pointerId => capturedPointerId === pointerId);
  cleanup.push(() => hasCaptureSpy.mockRestore());
  const releaseCaptureSpy = vi.spyOn(canvas, 'releasePointerCapture').mockImplementation(() => {
    capturedPointerId = null;
  });
  cleanup.push(() => releaseCaptureSpy.mockRestore());

  try {
    explorer = createExplorer(device);
    await explorer.onInitialize({device, canvas} as unknown as AnimationProps);
    const pointerBindings = explorer as unknown as ExplorerPointerBindings;
    const pinnedBuffer = explorer.layout.pinned!.data[0].buffer as Buffer;
    const positionsBuffer = explorer.layout.positions.data[0].buffer as Buffer;
    const velocitiesBuffer = explorer.layout.velocities.data[0].buffer as Buffer;
    const pinWriteSpy = vi.spyOn(pinnedBuffer, 'write');
    const positionWriteSpy = vi.spyOn(positionsBuffer, 'write');
    const velocityWriteSpy = vi.spyOn(velocitiesBuffer, 'write');
    cleanup.push(
      () => pinWriteSpy.mockRestore(),
      () => positionWriteSpy.mockRestore(),
      () => velocityWriteSpy.mockRestore()
    );

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {pointerId: 11, clientX: 160, clientY: 120})
    );

    let resolveCurrentPick: ((value: Uint8Array) => void) | undefined;
    const currentPick = new Promise<Uint8Array>(resolve => {
      resolveCurrentPick = resolve;
    });
    const currentReadback = pointerBindings.readPickedVertex({read: () => currentPick});
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {pointerId: 11, clientX: 190, clientY: 135})
    );

    tapeTest.equal(pinWriteSpy.mock.calls.length, 0, 'the previously selected node is not pinned');
    tapeTest.equal(
      positionWriteSpy.mock.calls.length,
      0,
      'the previously selected node coordinates are not changed before GPU picking resolves'
    );
    tapeTest.equal(
      velocityWriteSpy.mock.calls.length,
      0,
      'the previously selected node velocity is not cleared while picking remains asynchronous'
    );

    resolveCurrentPick!(new Uint8Array(Int32Array.of(7, 0).buffer));
    await currentReadback;
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {pointerId: 11, clientX: 205, clientY: 145})
    );

    tapeTest.equal(pinWriteSpy.mock.calls.length, 1, 'the resolved current node is pinned once');
    tapeTest.equal(
      pinWriteSpy.mock.calls[0][1],
      7 * Uint32Array.BYTES_PER_ELEMENT,
      'pinning targets the newly picked stable vertex, never the stale selected node'
    );
    tapeTest.equal(
      positionWriteSpy.mock.calls[0][1],
      7 * 2 * Float32Array.BYTES_PER_ELEMENT,
      'position writes target only the newly picked vertex row'
    );
    tapeTest.equal(
      velocityWriteSpy.mock.calls[0][1],
      7 * 2 * Float32Array.BYTES_PER_ELEMENT,
      'velocity writes target only the newly picked vertex row'
    );
    const pinValues = await readUint32Vector(explorer.layout.pinned!);
    tapeTest.equal(pinValues[0], 0, 'the old selected vertex remains unpinned on the actual GPU');
    tapeTest.equal(pinValues[7], 1, 'the resolved drag target is pinned on the actual GPU');

    canvas.dispatchEvent(new PointerEvent('pointerup', {pointerId: 11}));
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {pointerId: 12, clientX: 215, clientY: 155})
    );
    let resolveReleasedPick: ((value: Uint8Array) => void) | undefined;
    const releasedPick = new Promise<Uint8Array>(resolve => {
      resolveReleasedPick = resolve;
    });
    const releasedReadback = pointerBindings.readPickedVertex({read: () => releasedPick});
    canvas.dispatchEvent(new PointerEvent('pointerup', {pointerId: 12}));
    resolveReleasedPick!(new Uint8Array(Int32Array.of(9, 0).buffer));
    await releasedReadback;
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {pointerId: 12, clientX: 235, clientY: 170})
    );

    tapeTest.equal(
      pinWriteSpy.mock.calls.length,
      1,
      'a GPU pick resolving after pointer release never resurrects a stale drag'
    );
    tapeTest.equal(positionWriteSpy.mock.calls.length, 1, 'released pointers never move a node');
    tapeTest.equal(
      velocityWriteSpy.mock.calls.length,
      1,
      'released pointers never clear velocities'
    );
  } finally {
    for (const restore of cleanup.reverse()) restore();
    explorer?.onFinalize();
    canvas.remove();
  }

  tapeTest.end();
});

test('luGraph showcase rebuilds an accessible graph slider with real spatial indexing and community colors', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const previousHost = document.getElementById('example-panel-host');
  const host = previousHost ?? document.createElement('div');
  const previousParent = previousHost?.parentNode ?? null;
  const previousSibling = previousHost?.nextSibling ?? null;
  const infoBox = document.createElement('section');
  infoBox.setAttribute('data-info-box-appearance', 'cinematic');
  const expandInfoBox = document.createElement('button');
  expandInfoBox.type = 'button';
  expandInfoBox.setAttribute('aria-label', 'Expand info box');
  expandInfoBox.setAttribute('aria-expanded', 'false');
  expandInfoBox.addEventListener('click', () => {
    expandInfoBox.setAttribute('aria-expanded', 'true');
    host.hidden = false;
    host.setAttribute('aria-hidden', 'false');
  });
  const unrelatedInfoBox = document.createElement('button');
  unrelatedInfoBox.type = 'button';
  unrelatedInfoBox.setAttribute('aria-label', 'Expand info box');
  unrelatedInfoBox.setAttribute('aria-expanded', 'false');
  const ownExpandSpy = vi.spyOn(expandInfoBox, 'click');
  const unrelatedExpandSpy = vi.spyOn(unrelatedInfoBox, 'click');
  document.body.appendChild(unrelatedInfoBox);
  if (previousParent) previousParent.insertBefore(infoBox, host);
  else document.body.appendChild(infoBox);
  if (!previousHost) host.id = 'example-panel-host';
  host.hidden = true;
  host.setAttribute('aria-hidden', 'true');
  infoBox.append(expandInfoBox, host);

  const devicePixelSizeSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'getDevicePixelSize')
    .mockReturnValue([64, 48]);
  let explorer: LuGraphExplorerAnimationLoopTemplate | undefined;
  let color: Texture | undefined;
  let depth: Texture | undefined;
  try {
    explorer = createExplorer(device, 32, 'spatial');
    tapeTest.equal(explorer.graph.vertexCount, 32, 'the tiny real-GPU fixture remains injectable');
    tapeTest.ok(explorer.spatialLayout, 'explicit spatial mode creates a real caller-owned index');
    if (!explorer.spatialLayout) throw new Error('The showcase did not create its spatial layout');
    tapeTest.equal(
      ownExpandSpy.mock.calls.length,
      1,
      'the native showcase opens its own collapsed graph-inspector controls once'
    );
    tapeTest.equal(
      expandInfoBox.getAttribute('aria-expanded'),
      'true',
      'the actual accessible website InfoBox becomes visible immediately'
    );
    tapeTest.equal(host.hidden, false, 'the graph-size slider is visible without a hidden InfoBox');
    tapeTest.equal(
      unrelatedExpandSpy.mock.calls.length,
      0,
      'other unrelated website InfoBox controls are never opened'
    );

    const slider = host.querySelector<HTMLInputElement>('[data-graph-size]');
    const layoutMode = host.querySelector<HTMLSelectElement>('[data-layout-mode]');
    const colorMode = host.querySelector<HTMLSelectElement>('[data-color-mode]');
    const sizeMode = host.querySelector<HTMLSelectElement>('[data-node-size]');
    const edgeVisibility = host.querySelector<HTMLInputElement>('[data-edge-toggle]');
    const legend = host.querySelector<HTMLElement>('[data-graph-legend]');
    const adapter = host.querySelector<HTMLElement>('[data-graph-adapter]');
    const memory = host.querySelector<HTMLElement>('[data-graph-memory]');
    const status = host.querySelector<HTMLElement>('[role="status"]');
    tapeTest.ok(slider, 'the native showcase publishes a keyboard-accessible graph-size slider');
    tapeTest.equal(slider?.type, 'range', 'graph scale is an actual accessible range control');
    tapeTest.equal(slider?.min, '0', 'the first slider step maps to 128 resident vertices');
    tapeTest.equal(
      slider?.max,
      String(GRAPH_EXPLORER_VERTEX_COUNTS.length - 1),
      'the fourteenth slider step maps to the actual 1,048,576-vertex graph'
    );
    tapeTest.equal(
      GRAPH_EXPLORER_VERTEX_COUNTS.at(-1),
      1_048_576,
      'the final scale represents actual original resident vertices'
    );
    tapeTest.ok(layoutMode, 'exact, automatic, spatial, and four-sample modes are user-visible');
    tapeTest.ok(colorMode, 'actual analytic color choices are user-visible');
    tapeTest.ok(sizeMode, 'GPU PageRank, degree, and uniform sizes are selectable');
    tapeTest.deepEqual(
      Array.from(layoutMode?.options ?? [], option => option.value),
      ['auto', 'exact', 'spatial', 'sampled'],
      'layout choices select real exact, flat-grid, and linear-work GPU contributors'
    );
    tapeTest.deepEqual(
      Array.from(colorMode?.options ?? [], option => option.value),
      ['community', 'component', 'degree', 'pagerank', 'distance'],
      'all advertised node colors correspond to real GPU analytics'
    );
    tapeTest.deepEqual(
      Array.from(sizeMode?.options ?? [], option => option.value),
      ['pagerank', 'degree', 'uniform'],
      'all advertised node sizes use real resident metrics or a uniform radius'
    );
    tapeTest.ok(edgeVisibility, 'original source-chunk edges can be hidden accessibly');
    tapeTest.ok(legend, 'a visible accessible legend describes actual GPU analytic colors');
    tapeTest.ok(
      legend?.getAttribute('aria-label'),
      'color meaning remains screen-reader accessible'
    );
    tapeTest.ok(adapter?.textContent, 'the graph inspector reports real adapter information');
    tapeTest.ok(
      memory?.textContent,
      'the graph inspector reports actual GPU allocation accounting'
    );
    tapeTest.ok(
      /resident|transient/i.test(memory?.textContent ?? ''),
      'GPU memory statistics distinguish owned graph and transient allocations'
    );
    tapeTest.equal(status?.getAttribute('aria-live'), 'polite', 'graph changes announce politely');

    const firstBindings = explorer as unknown as ExplorerGraphBindings;
    color = device.createTexture({
      id: 'lugraph-showcase-test-color',
      format: device.preferredColorFormat,
      width: firstBindings.frameWidth,
      height: firstBindings.frameHeight,
      usage: Texture.RENDER
    });
    depth = device.createTexture({
      id: 'lugraph-showcase-test-depth',
      format: 'depth24plus',
      width: firstBindings.frameWidth,
      height: firstBindings.frameHeight,
      usage: Texture.RENDER
    });

    executeShowcaseFrame(device, explorer, color, depth);
    const [initialCount, initialOverflow, initialCommunity, initialComponents] = await Promise.all([
      readUint32Vector(explorer.spatialLayout.count),
      readUint32Vector(explorer.spatialLayout.overflow),
      readUint32Vector(explorer.communities.output),
      readUint32Vector(explorer.components.output)
    ]);
    tapeTest.equal(initialCount[0], 32, 'the actual GPU grid accepts every original vertex');
    tapeTest.equal(initialOverflow[0], 0, 'caller-owned vertex-ID capacity does not overflow');
    tapeTest.equal(initialComponents[8], 0, 'one bridge joins the first two weak components');
    tapeTest.equal(initialCommunity[8], 8, 'actual majority votes retain a separate community');

    const previousPositions = explorer.layout.positions.data[0].buffer;
    const previousAnalysis = explorer.analysisGraph;
    if (!slider) throw new Error('The native graph-size control was not mounted');
    slider.value = '0';
    slider.dispatchEvent(new Event('change', {bubbles: true}));
    tapeTest.equal(explorer.graph.vertexCount, 128, 'a real slider change rebuilds the GPU graph');
    tapeTest.equal(
      ownExpandSpy.mock.calls.length,
      1,
      'resizing never repeatedly reopens a user-controlled website InfoBox'
    );
    tapeTest.notEqual(
      explorer.layout.positions.data[0].buffer,
      previousPositions,
      'new vertex attributes use fresh caller-owned physical storage'
    );
    tapeTest.notEqual(explorer.analysisGraph, previousAnalysis, 'analytics graphs are rebuilt');
    tapeTest.deepEqual(
      explorer.graph.sourceVertices.data.map(chunk => chunk.length === 0),
      [false, true, false],
      'graph resizing still preserves the original empty source batch'
    );
    tapeTest.ok(explorer.spatialLayout, 'the selected spatial mode survives graph resizing');
    if (!explorer.spatialLayout) throw new Error('The rebuilt showcase lost its spatial layout');

    executeShowcaseFrame(device, explorer, color, depth);
    const [resizedCount, resizedOverflow, resizedCommunities, resizedComponents] =
      await Promise.all([
        readUint32Vector(explorer.spatialLayout.count),
        readUint32Vector(explorer.spatialLayout.overflow),
        readUint32Vector(explorer.communities.output),
        readUint32Vector(explorer.components.output)
      ]);
    tapeTest.equal(resizedCount[0], 128, 'rebuilt spatial passes index all resized vertices');
    tapeTest.equal(resizedOverflow[0], 0, 'rebuilt explicit index buffers remain large enough');
    tapeTest.equal(resizedComponents[32], 0, 'resized weak components still cross the bridge');
    tapeTest.equal(resizedCommunities[32], 32, 'resized GPU community labels remain distinct');
    tapeTest.ok(
      !/GPU\s+(?:frame|execution|duration)\s*[:=]\s*\d/i.test(status?.textContent ?? ''),
      'the live inspector never fabricates GPU execution timings'
    );
  } finally {
    devicePixelSizeSpy.mockRestore();
    ownExpandSpy.mockRestore();
    unrelatedExpandSpy.mockRestore();
    depth?.destroy();
    color?.destroy();
    explorer?.onFinalize();
    if (previousHost && previousParent) previousParent.insertBefore(host, previousSibling);
    else host.remove();
    infoBox.remove();
    unrelatedInfoBox.remove();
  }

  tapeTest.end();
});

function createExplorer(
  device: Device,
  vertexCount = 128,
  layoutMode?: GraphExplorerLayoutMode,
  options: Pick<ExplorerAnimationProps, 'pointMode' | 'maxVisibleEdges'> = {}
): LuGraphExplorerAnimationLoopTemplate {
  return new LuGraphExplorerAnimationLoopTemplate({
    device,
    dataset: makeGraphExplorerDataset(vertexCount),
    ...(layoutMode ? {layoutMode} : {}),
    ...options
  } as ExplorerAnimationProps);
}

function executeShowcaseFrame(
  device: Device,
  explorer: LuGraphExplorerAnimationLoopTemplate,
  color: Texture,
  depth: Texture
): void {
  const bindings = explorer as unknown as ExplorerGraphBindings;
  const encoder = device.createCommandEncoder({id: 'lugraph-showcase-real-spatial-frame'});
  explorer.analysisGraph.encode(encoder, {parameters: undefined});
  explorer.frameGraph.encode(encoder, {
    parameters: {width: bindings.frameWidth, height: bindings.frameHeight},
    frameTextures: {
      [bindings.frameColorId]: {texture: color, frameId: 0},
      [bindings.frameDepthId]: {texture: depth, frameId: 0}
    }
  });
  device.submit(encoder.finish());
}

function executeAnalysis(device: Device, explorer: LuGraphExplorerAnimationLoopTemplate): void {
  const encoder = device.createCommandEncoder({id: 'lugraph-explorer-analysis-test'});
  explorer.analysisGraph.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 4);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

async function readFloat32Vector(vector: GPUVector<'float32'>): Promise<number[]> {
  if (vector.length === 0) return [];
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 4);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length));
}
