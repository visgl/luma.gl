// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {decodeGPUIndexPickInfo, INDEX_PICKING_READBACK_BYTE_LENGTH} from '@luma.gl/gpgpu/gpu-core';
import type {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it, vi} from 'vitest';
import GPUGraphExplorerAnimationLoopTemplate from '../../../../examples/experimental/gpu-graph-explorer/app';
import {
  GRAPH_EXPLORER_VERTEX_COUNTS,
  makeGraphExplorerDataset,
  type GraphExplorerDataset,
  type GraphExplorerLayoutMode
} from '../../../../examples/experimental/gpu-graph-explorer/graph-data';

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

it('GPU Graph explorer constructs actual GPU models and computes source-aligned graph analytics', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const submitSpy = vi.spyOn(device, 'submit');
  let explorer: GPUGraphExplorerAnimationLoopTemplate | undefined;
  try {
    explorer = createExplorer(device);
    expect(submitSpy.mock.calls.length, 'construction never submits hidden GPU work').toBe(0);
    submitSpy.mockRestore();

    const dataset = makeGraphExplorerDataset();
    expect(explorer.graph.vertexCount, 'source vertex identities stay stable').toBe(
      dataset.vertexCount
    );
    expect(
      explorer.graph.sourceVertices.data.map(chunk => chunk.length),
      'source edge vectors retain original nonempty, empty, and nonempty batches'
    ).toEqual(dataset.sourceChunks.map(chunk => chunk.length));
    expect(
      explorer.edgeModels.map(model => model.chunkIndex),
      'each nonempty original edge batch has its own directly bound edge model'
    ).toEqual([0, 2]);
    expect(
      Boolean(explorer.nodeModel.pipeline),
      'actual WebGPU node shader and vertex pipeline compile'
    ).toBe(true);
    expect(
      Boolean(explorer.pickingModel.pipeline),
      'actual integer picking shader and pipeline compile'
    ).toBe(true);
    expect(
      explorer.nodeModel.bindings['degrees'],
      'node color and sizing consume the actual GPU-computed degree buffer'
    ).toBe(explorer.degree.output.data[0].buffer);
    expect(
      explorer.pickingModel.bindings['degrees'],
      'integer picking uses the same degree-dependent radius as visible nodes'
    ).toBe(explorer.degree.output.data[0].buffer);
    expect(
      explorer.layout.positions.data[0].buffer.usage & (Buffer.STORAGE | Buffer.VERTEX),
      'progressive layout coordinates are the same physical render vertex allocation'
    ).toBe(Buffer.STORAGE | Buffer.VERTEX);

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

    expect(forwardCount[0], 'GPU builds every original directed edge').toBe(
      explorer.graph.edgeCount
    );
    expect(reverseCount[0], 'GPU builds full reverse adjacency').toBe(explorer.graph.edgeCount);
    expect(invalid[0], 'deterministic dataset contains no invalid source identifiers').toBe(0);
    expect(overflow[0], 'caller-owned graph adjacency has adequate explicit capacity').toBe(0);
    expect(
      degrees.reduce((sum, degree) => sum + degree, 0),
      'GPU degree outputs exactly account for all original source edges'
    ).toBe(explorer.graph.edgeCount);
    expect(degrees[dataset.vertexCount - 1], 'final isolated vertex has degree zero').toBe(0);
    expect(componentLabels[0], 'first community retains minimum stable source identifier').toBe(0);
    expect(componentLabels[32], 'one actual bridge joins the first two weak communities').toBe(0);
    expect(communityLabels[0], 'GPU label propagation preserves the first community').toBe(0);
    expect(
      communityLabels[32],
      'the same bridge leaves the second majority-vote community visibly distinct'
    ).toBe(32);
    expect(
      communityLabels[32],
      'true GPU community coloring is not a relabeled weak-component result'
    ).not.toBe(componentLabels[32]);
    expect(componentLabels[64], 'third disconnected community keeps its own component').toBe(64);
    expect(componentLabels[96], 'fourth disconnected community keeps its own component').toBe(96);
    expect(
      componentLabels[dataset.vertexCount - 1],
      'isolated node retains its own stable component identifier'
    ).toBe(dataset.vertexCount - 1);
    expect(
      Boolean(importance.every(score => Number.isFinite(score) && score > 0)),
      'real dangling-aware PageRank supplies positive node sizing values'
    ).toBe(true);
    expect(
      Boolean(Math.abs(importance.reduce((sum, score) => sum + score, 0) - 1) < 5e-5),
      'GPU node importance remains correctly normalized'
    ).toBe(true);
  } finally {
    submitSpy.mockRestore();
    explorer?.onFinalize();
  }
});

it('GPU Graph explorer renders original GPU chunks, highlights neighborhoods, pins, and picks stable nodes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  let explorer: GPUGraphExplorerAnimationLoopTemplate | undefined;
  let color: Texture | undefined;
  let depth: Texture | undefined;
  let pickingReadback: Buffer | undefined;
  const devicePixelSizeSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'getDevicePixelSize')
    .mockReturnValue([320, 240]);
  try {
    explorer = createExplorer(device);
    const bindings = explorer as unknown as ExplorerGraphBindings;
    expect(
      [bindings.frameWidth, bindings.frameHeight],
      'GPU picking uses real centered device pixels rather than assuming a one-pixel test canvas'
    ).toEqual([320, 240]);
    color = device.createTexture({
      id: 'gpu-graph-explorer-test-color',
      format: device.preferredColorFormat,
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    depth = device.createTexture({
      id: 'gpu-graph-explorer-test-depth',
      format: 'depth24plus',
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    pickingReadback = device.createBuffer({
      id: 'gpu-graph-explorer-test-picking-readback',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });

    // Preserve one centered instance so its true rendered circle covers the current canvas center.
    (explorer.layout.positions.data[0].buffer as Buffer).write(Float32Array.from([0, 0]));
    (explorer.layout.pinned!.data[0].buffer as Buffer).write(Uint32Array.from([1]));

    const encoder = device.createCommandEncoder({id: 'gpu-graph-explorer-real-frame'});
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

    expect(distances[0], 'selected root is highlighted at GPU hop distance zero').toBe(0);
    expect(
      Boolean(distances.some(distance => distance === 1 || distance === 2)),
      'GPU traversal publishes a bounded multi-hop neighborhood'
    ).toBe(true);
    expect(mask[0], 'node shader receives the source-aligned GPU selection mask').toBe(1);
    expect(
      mask[explorer.graph.vertexCount - 1],
      'disconnected isolated nodes remain outside the highlighted component'
    ).toBe(0);
    expect(pin[0], 'dragged node remains pinned through force integration').toBe(1);
    expect(pick.objectIndex, 'integer GPU picking recovers the original stable vertex ID').toBe(0);
  } finally {
    devicePixelSizeSpy.mockRestore();
    pickingReadback?.destroy();
    depth?.destroy();
    color?.destroy();
    explorer?.onFinalize();
  }
});

it('GPU Graph explorer exposes genuine GPU analytics and only expands its own graph inspector', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  let explorer: GPUGraphExplorerAnimationLoopTemplate | undefined;
  try {
    explorer = createExplorer(device);
    const dashboard = explorer as unknown as ExplorerDashboardBindings;
    expect(graphExpansion.mock.calls.length, 'the graph inspector opens exactly once').toBe(1);
    expect(
      unrelatedExpansion.mock.calls.length,
      'unrelated collapsed example inspectors are never opened'
    ).toBe(0);

    const color = host.querySelector<HTMLSelectElement>('[data-color-mode]');
    const size = host.querySelector<HTMLSelectElement>('[data-node-size]');
    const pause = host.querySelector<HTMLButtonElement>('[data-pause]');
    const edges = host.querySelector<HTMLButtonElement>('[data-edge-toggle]');
    const depth = host.querySelector<HTMLInputElement>('[data-depth]');
    expect(
      Array.from(color!.options, option => option.value),
      'all five available GPU analytics are selectable as node colors'
    ).toEqual(['community', 'component', 'degree', 'pagerank', 'distance']);
    expect(
      Array.from(size!.options, option => option.value),
      'importance, degree, and uniform node sizing are independently selectable'
    ).toEqual(['pagerank', 'degree', 'uniform']);

    color!.value = 'degree';
    color!.dispatchEvent(new Event('change', {bubbles: true}));
    size!.value = 'degree';
    size!.dispatchEvent(new Event('change', {bubbles: true}));
    expect(dashboard.colorMode, 'degree coloring updates the real render state').toBe('degree');
    expect(dashboard.nodeSizeMode, 'degree sizing updates the real render state').toBe('degree');
    expect(
      Boolean(host.querySelector('[data-graph-legend]')?.textContent?.includes('vertex degree')),
      'the visible legend describes the active GPU-computed color metric'
    ).toBe(true);

    const uniformWrite = vi.spyOn(dashboard.viewUniforms, 'write');
    dashboard.writeViewUniforms(320, 240);
    const uniformBytes = uniformWrite.mock.calls[0][0] as Uint8Array;
    expect(
      new DataView(uniformBytes.buffer, uniformBytes.byteOffset, uniformBytes.byteLength).getUint32(
        28,
        true
      ),
      'the shared node and picking uniform packs the selected genuine GPU metric modes'
    ).toBe((2 << 1) | (1 << 4));
    uniformWrite.mockRestore();

    depth!.value = '4';
    depth!.dispatchEvent(new Event('input', {bubbles: true}));
    expect(
      (await readUint32Vector(explorer.search.activeDepth!))[0],
      'the depth slider writes the existing GPU traversal control'
    ).toBe(4);

    const layoutNode = 'gpu-graph-explorer-layout-initialize';
    expect(
      Boolean(explorer.frameGraph.stats.nodeOrder.includes(layoutNode)),
      'layout starts active'
    ).toBe(true);
    pause!.click();
    expect(dashboard.paused, 'pausing changes actual graph execution state').toBe(true);
    expect(pause!.getAttribute('aria-pressed'), 'pause state remains accessible').toBe('true');
    expect(
      explorer.frameGraph.stats.nodeOrder.includes(layoutNode),
      'pausing removes actual force-layout compute from the compiled frame graph'
    ).toBe(false);
    expect(
      Boolean(
        explorer.frameGraph.stats.nodeOrder.includes('gpu-graph-explorer-neighborhood-initialize')
      ),
      'selection and neighborhood traversal remain active while layout is paused'
    ).toBe(true);
    pause!.click();
    expect(
      Boolean(explorer.frameGraph.stats.nodeOrder.includes(layoutNode)),
      'resuming restores real force-layout compute'
    ).toBe(true);

    edges!.click();
    expect(dashboard.edgesVisible, 'edge visibility changes actual rendering state').toBe(false);
    expect(edges!.getAttribute('aria-pressed'), 'edge state remains accessible').toBe('false');
    expect(Boolean(host.querySelector('[data-status]')?.textContent?.includes('depth 4'))).toBe(
      true
    );
    expect(
      Boolean(host.querySelector('[data-graph-adapter]')?.textContent?.includes('GPU adapter:'))
    ).toBe(true);
    expect(
      Boolean(host.querySelector('[data-graph-memory]')?.textContent?.includes('KiB resident'))
    ).toBe(true);
    expect(
      Boolean(
        host.querySelector('[data-graph-fps]')?.textContent?.includes('CPU command encoding')
      ),
      'telemetry identifies CPU encoding honestly instead of inventing GPU execution timings'
    ).toBe(true);
    expect(graphExpansion.mock.calls.length, 'interaction never reopens the inspector').toBe(1);
  } finally {
    explorer?.onFinalize();
    graphInfoBox.remove();
    unrelatedInfoBox.remove();
  }
});

it('GPU Graph native showcase renders every real GPU point while sampling only forces and visible original edges', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  let explorer: GPUGraphExplorerAnimationLoopTemplate | undefined;
  let color: Texture | undefined;
  let depth: Texture | undefined;
  let pickingReadback: Buffer | undefined;
  // Odd dimensions place the pinned origin on a pixel center across software GPU backends.
  const devicePixelSizeSpy = vi
    .spyOn(device.getDefaultCanvasContext(), 'getDevicePixelSize')
    .mockReturnValue([65, 49]);
  try {
    explorer = createExplorer(device, 32, 'sampled', {pointMode: true, maxVisibleEdges: 4});
    expect(explorer.activeLayoutMode, 'the actual four-sample force path is used').toBe('sampled');
    expect(
      explorer.layout.repulsion,
      'four-sample repulsion remains positive and independent of population size'
    ).toBe(0.0015);
    expect(
      explorer.layout.gravity,
      'bounded sampled gravity preserves visible source communities'
    ).toBe(0.005);
    expect(explorer.pointMode, 'full-population point rendering is enabled').toBe(true);
    expect(explorer.renderedVertexCount, 'every actual original vertex stays rendered').toBe(32);
    expect(explorer.renderedEdgeCount, 'only displayed original edges are decimated').toBe(4);
    expect(
      Boolean(explorer.graph.edgeCount > 4),
      'full GPU adjacency retains all original edge rows'
    ).toBe(true);
    expect(explorer.spatialLayout, 'sampled forces do not misrepresent a spatial grid').toBe(null);
    expect(
      explorer.edgeModels.map(({model}) => model.instanceCount),
      'edge-only detail remains source-aligned across both nonempty original batches'
    ).toEqual([2, 2]);
    expect(explorer.nodeModel.topology, 'nodes use a real GPU point pipeline').toBe('point-list');
    expect(explorer.nodeModel.vertexCount, 'each source vertex produces one GPU point').toBe(1);
    expect(explorer.nodeModel.instanceCount, 'point instances cover every graph vertex').toBe(32);
    expect(explorer.pickingModel.topology, 'integer picking consumes real points').toBe(
      'point-list'
    );
    expect(explorer.pickingModel.instanceCount, 'picking preserves every stable source ID').toBe(
      32
    );

    const bindings = explorer as unknown as ExplorerGraphBindings;
    color = device.createTexture({
      id: 'gpu-graph-showcase-sampled-point-color',
      format: device.preferredColorFormat,
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    depth = device.createTexture({
      id: 'gpu-graph-showcase-sampled-point-depth',
      format: 'depth24plus',
      width: bindings.frameWidth,
      height: bindings.frameHeight,
      usage: Texture.RENDER
    });
    pickingReadback = device.createBuffer({
      id: 'gpu-graph-showcase-sampled-point-picking',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    (explorer.layout.positions.data[0].buffer as Buffer).write(Float32Array.of(0, 0));
    (explorer.layout.pinned!.data[0].buffer as Buffer).write(Uint32Array.of(1));

    const encoder = device.createCommandEncoder({
      id: 'gpu-graph-showcase-real-sampled-point-frame'
    });
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
    expect(forward[0], 'GPU retains every original forward edge').toBe(explorer.graph.edgeCount);
    expect(reverse[0], 'GPU retains every original reverse edge').toBe(explorer.graph.edgeCount);
    expect(
      degrees.reduce((sum, degree) => sum + degree, 0),
      'GPU degrees use the complete edge graph instead of its displayed subset'
    ).toBe(explorer.graph.edgeCount);
    expect(components[8], 'actual weak components still span the source bridge').toBe(0);
    expect(communities[8], 'GPU majority-vote communities remain distinct').toBe(8);
    expect(
      Boolean(Math.abs(importance.reduce((sum, score) => sum + score, 0) - 1) < 5e-5),
      'full-graph GPU PageRank remains normalized in sampled-force mode'
    ).toBe(true);
    expect(
      decodeGPUIndexPickInfo(bytes).objectIndex,
      'actual integer GPU point picking returns the stable original source vertex'
    ).toBe(0);
  } finally {
    devicePixelSizeSpy.mockRestore();
    pickingReadback?.destroy();
    depth?.destroy();
    color?.destroy();
    explorer?.onFinalize();
  }
});

it('GPU Graph explorer waits for the current asynchronous GPU pick before dragging a different node', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  let explorer: GPUGraphExplorerAnimationLoopTemplate | undefined;
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

    expect(pinWriteSpy.mock.calls.length, 'the previously selected node is not pinned').toBe(0);
    expect(
      positionWriteSpy.mock.calls.length,
      'the previously selected node coordinates are not changed before GPU picking resolves'
    ).toBe(0);
    expect(
      velocityWriteSpy.mock.calls.length,
      'the previously selected node velocity is not cleared while picking remains asynchronous'
    ).toBe(0);

    resolveCurrentPick!(new Uint8Array(Int32Array.of(7, 0).buffer));
    await currentReadback;
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {pointerId: 11, clientX: 205, clientY: 145})
    );

    expect(pinWriteSpy.mock.calls.length, 'the resolved current node is pinned once').toBe(1);
    expect(
      pinWriteSpy.mock.calls[0][1],
      'pinning targets the newly picked stable vertex, never the stale selected node'
    ).toBe(7 * Uint32Array.BYTES_PER_ELEMENT);
    expect(
      positionWriteSpy.mock.calls[0][1],
      'position writes target only the newly picked vertex row'
    ).toBe(7 * 2 * Float32Array.BYTES_PER_ELEMENT);
    expect(
      velocityWriteSpy.mock.calls[0][1],
      'velocity writes target only the newly picked vertex row'
    ).toBe(7 * 2 * Float32Array.BYTES_PER_ELEMENT);
    const pinValues = await readUint32Vector(explorer.layout.pinned!);
    expect(pinValues[0], 'the old selected vertex remains unpinned on the actual GPU').toBe(0);
    expect(pinValues[7], 'the resolved drag target is pinned on the actual GPU').toBe(1);

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

    expect(
      pinWriteSpy.mock.calls.length,
      'a GPU pick resolving after pointer release never resurrects a stale drag'
    ).toBe(1);
    expect(positionWriteSpy.mock.calls.length, 'released pointers never move a node').toBe(1);
    expect(velocityWriteSpy.mock.calls.length, 'released pointers never clear velocities').toBe(1);
  } finally {
    for (const restore of cleanup.reverse()) restore();
    explorer?.onFinalize();
    canvas.remove();
  }
});

it('GPU Graph showcase rebuilds an accessible graph slider with real spatial indexing and community colors', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  let explorer: GPUGraphExplorerAnimationLoopTemplate | undefined;
  let color: Texture | undefined;
  let depth: Texture | undefined;
  try {
    explorer = createExplorer(device, 32, 'spatial');
    expect(explorer.graph.vertexCount, 'the tiny real-GPU fixture remains injectable').toBe(32);
    expect(
      Boolean(explorer.spatialLayout),
      'explicit spatial mode creates a real caller-owned index'
    ).toBe(true);
    if (!explorer.spatialLayout) throw new Error('The showcase did not create its spatial layout');
    expect(
      ownExpandSpy.mock.calls.length,
      'the native showcase opens its own collapsed graph-inspector controls once'
    ).toBe(1);
    expect(
      expandInfoBox.getAttribute('aria-expanded'),
      'the actual accessible website InfoBox becomes visible immediately'
    ).toBe('true');
    expect(host.hidden, 'the graph-size slider is visible without a hidden InfoBox').toBe(false);
    expect(
      unrelatedExpandSpy.mock.calls.length,
      'other unrelated website InfoBox controls are never opened'
    ).toBe(0);

    const slider = host.querySelector<HTMLInputElement>('[data-graph-size]');
    const layoutMode = host.querySelector<HTMLSelectElement>('[data-layout-mode]');
    const colorMode = host.querySelector<HTMLSelectElement>('[data-color-mode]');
    const sizeMode = host.querySelector<HTMLSelectElement>('[data-node-size]');
    const edgeVisibility = host.querySelector<HTMLInputElement>('[data-edge-toggle]');
    const legend = host.querySelector<HTMLElement>('[data-graph-legend]');
    const adapter = host.querySelector<HTMLElement>('[data-graph-adapter]');
    const memory = host.querySelector<HTMLElement>('[data-graph-memory]');
    const status = host.querySelector<HTMLElement>('[role="status"]');
    expect(
      Boolean(slider),
      'the native showcase publishes a keyboard-accessible graph-size slider'
    ).toBe(true);
    expect(slider?.type, 'graph scale is an actual accessible range control').toBe('range');
    expect(slider?.min, 'the first slider step maps to 128 resident vertices').toBe('0');
    expect(
      slider?.max,
      'the fourteenth slider step maps to the actual 1,048,576-vertex graph'
    ).toBe(String(GRAPH_EXPLORER_VERTEX_COUNTS.length - 1));
    expect(
      GRAPH_EXPLORER_VERTEX_COUNTS.at(-1),
      'the final scale represents actual original resident vertices'
    ).toBe(1_048_576);
    expect(
      Boolean(layoutMode),
      'exact, automatic, spatial, and four-sample modes are user-visible'
    ).toBe(true);
    expect(Boolean(colorMode), 'actual analytic color choices are user-visible').toBe(true);
    expect(Boolean(sizeMode), 'GPU PageRank, degree, and uniform sizes are selectable').toBe(true);
    expect(
      Array.from(layoutMode?.options ?? [], option => option.value),
      'layout choices select real exact, flat-grid, and linear-work GPU contributors'
    ).toEqual(['auto', 'exact', 'spatial', 'sampled']);
    expect(
      Array.from(colorMode?.options ?? [], option => option.value),
      'all advertised node colors correspond to real GPU analytics'
    ).toEqual(['community', 'component', 'degree', 'pagerank', 'distance']);
    expect(
      Array.from(sizeMode?.options ?? [], option => option.value),
      'all advertised node sizes use real resident metrics or a uniform radius'
    ).toEqual(['pagerank', 'degree', 'uniform']);
    expect(Boolean(edgeVisibility), 'original source-chunk edges can be hidden accessibly').toBe(
      true
    );
    expect(
      Boolean(legend),
      'a visible accessible legend describes actual GPU analytic colors'
    ).toBe(true);
    expect(
      Boolean(legend?.getAttribute('aria-label')),
      'color meaning remains screen-reader accessible'
    ).toBe(true);
    expect(
      Boolean(adapter?.textContent),
      'the graph inspector reports real adapter information'
    ).toBe(true);
    expect(
      Boolean(memory?.textContent),
      'the graph inspector reports actual GPU allocation accounting'
    ).toBe(true);
    expect(
      Boolean(/resident|transient/i.test(memory?.textContent ?? '')),
      'GPU memory statistics distinguish owned graph and transient allocations'
    ).toBe(true);
    expect(status?.getAttribute('aria-live'), 'graph changes announce politely').toBe('polite');

    const firstBindings = explorer as unknown as ExplorerGraphBindings;
    color = device.createTexture({
      id: 'gpu-graph-showcase-test-color',
      format: device.preferredColorFormat,
      width: firstBindings.frameWidth,
      height: firstBindings.frameHeight,
      usage: Texture.RENDER
    });
    depth = device.createTexture({
      id: 'gpu-graph-showcase-test-depth',
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
    expect(initialCount[0], 'the actual GPU grid accepts every original vertex').toBe(32);
    expect(initialOverflow[0], 'caller-owned vertex-ID capacity does not overflow').toBe(0);
    expect(initialComponents[8], 'one bridge joins the first two weak components').toBe(0);
    expect(initialCommunity[8], 'actual majority votes retain a separate community').toBe(8);

    const previousPositions = explorer.layout.positions.data[0].buffer;
    const previousAnalysis = explorer.analysisGraph;
    if (!slider) throw new Error('The native graph-size control was not mounted');
    slider.value = '0';
    slider.dispatchEvent(new Event('change', {bubbles: true}));
    expect(explorer.graph.vertexCount, 'a real slider change rebuilds the GPU graph').toBe(128);
    expect(
      ownExpandSpy.mock.calls.length,
      'resizing never repeatedly reopens a user-controlled website InfoBox'
    ).toBe(1);
    expect(
      explorer.layout.positions.data[0].buffer,
      'new vertex attributes use fresh caller-owned physical storage'
    ).not.toBe(previousPositions);
    expect(explorer.analysisGraph, 'analytics graphs are rebuilt').not.toBe(previousAnalysis);
    expect(
      explorer.graph.sourceVertices.data.map(chunk => chunk.length === 0),
      'graph resizing still preserves the original empty source batch'
    ).toEqual([false, true, false]);
    expect(
      Boolean(explorer.spatialLayout),
      'the selected spatial mode survives graph resizing'
    ).toBe(true);
    if (!explorer.spatialLayout) throw new Error('The rebuilt showcase lost its spatial layout');

    executeShowcaseFrame(device, explorer, color, depth);
    const [resizedCount, resizedOverflow, resizedCommunities, resizedComponents] =
      await Promise.all([
        readUint32Vector(explorer.spatialLayout.count),
        readUint32Vector(explorer.spatialLayout.overflow),
        readUint32Vector(explorer.communities.output),
        readUint32Vector(explorer.components.output)
      ]);
    expect(resizedCount[0], 'rebuilt spatial passes index all resized vertices').toBe(128);
    expect(resizedOverflow[0], 'rebuilt explicit index buffers remain large enough').toBe(0);
    expect(resizedComponents[32], 'resized weak components still cross the bridge').toBe(0);
    expect(resizedCommunities[32], 'resized GPU community labels remain distinct').toBe(32);
    expect(
      Boolean(!/GPU\s+(?:frame|execution|duration)\s*[:=]\s*\d/i.test(status?.textContent ?? '')),
      'the live inspector never fabricates GPU execution timings'
    ).toBe(true);
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
});

function createExplorer(
  device: Device,
  vertexCount = 128,
  layoutMode?: GraphExplorerLayoutMode,
  options: Pick<ExplorerAnimationProps, 'pointMode' | 'maxVisibleEdges'> = {}
): GPUGraphExplorerAnimationLoopTemplate {
  return new GPUGraphExplorerAnimationLoopTemplate({
    device,
    dataset: makeGraphExplorerDataset(vertexCount),
    ...(layoutMode ? {layoutMode} : {}),
    ...options
  } as ExplorerAnimationProps);
}

function executeShowcaseFrame(
  device: Device,
  explorer: GPUGraphExplorerAnimationLoopTemplate,
  color: Texture,
  depth: Texture
): void {
  const bindings = explorer as unknown as ExplorerGraphBindings;
  const encoder = device.createCommandEncoder({id: 'gpu-graph-showcase-real-spatial-frame'});
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

function executeAnalysis(device: Device, explorer: GPUGraphExplorerAnimationLoopTemplate): void {
  const encoder = device.createCommandEncoder({id: 'gpu-graph-explorer-analysis-test'});
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
