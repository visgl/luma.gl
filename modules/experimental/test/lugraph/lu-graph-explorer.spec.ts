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
import {makeGraphExplorerDataset} from '../../../../examples/experimental/lugraph-explorer/graph-data';

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
    explorer = new LuGraphExplorerAnimationLoopTemplate({device} as unknown as AnimationProps);
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
    const [degrees, componentLabels, importance, forwardCount, reverseCount, invalid, overflow] =
      await Promise.all([
        readUint32Vector(explorer.degree.output),
        readUint32Vector(explorer.components.output),
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
    explorer = new LuGraphExplorerAnimationLoopTemplate({device} as unknown as AnimationProps);
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
    explorer = new LuGraphExplorerAnimationLoopTemplate({device} as unknown as AnimationProps);
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
      ['component', 'degree', 'pagerank', 'distance'],
      'all four available GPU analytics are selectable as node colors'
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
      (1 << 4) | (1 << 8),
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
    explorer = new LuGraphExplorerAnimationLoopTemplate({device} as unknown as AnimationProps);
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
