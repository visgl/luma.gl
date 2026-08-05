// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {EffectContext} from '@deck.gl/core';
import {Buffer} from '@luma.gl/core';
import {ShaderAssembler} from '@luma.gl/shadertools';
import type {GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

import {createLuGraphExplorerDeck} from '../../../../examples/deck/lugraph-explorer/app';
import {LuGraphDeckEffect} from '../../../../examples/deck/lugraph-explorer/lugraph-effect';
import {LuGraphEdgeLayer} from '../../../../examples/deck/lugraph-explorer/lugraph-edge-layer';
import {LuGraphNodeLayer} from '../../../../examples/deck/lugraph-explorer/lugraph-node-layer';
import {makeGraphExplorerDataset} from '../../../../examples/experimental/lugraph-explorer/graph-data';

test('luGraph deck.gl effect composes actual GPU analytics, zero-copy selection, and pinned layout', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  let effect: LuGraphDeckEffect | undefined;
  const submitSpy = vi.spyOn(device, 'submit');
  try {
    effect = new LuGraphDeckEffect(device);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'effect construction never submits hidden GPU work'
    );
    submitSpy.mockRestore();

    const dataset = makeGraphExplorerDataset();
    tapeTest.deepEqual(
      effect.graph.sourceVertices.data.map(chunk => chunk.length),
      dataset.sourceChunks.map(chunk => chunk.length),
      'original nonempty, empty, and nonempty edge source batches remain intact'
    );
    tapeTest.equal(
      effect.positions,
      effect.layout.positions.data[0].buffer,
      'Deck nodes consume the exact progressive layout allocation without copying'
    );
    tapeTest.equal(
      effect.positions.usage & (Buffer.STORAGE | Buffer.VERTEX),
      Buffer.STORAGE | Buffer.VERTEX,
      'shared graph coordinates are simultaneously writable storage and vertex attributes'
    );
    tapeTest.equal(
      effect.importance,
      effect.pageRank.output.data[0].buffer,
      'PageRank stays resident'
    );
    tapeTest.equal(
      effect.componentLabels,
      effect.components.output.data[0].buffer,
      'weak-component colors read the original GPU output allocation'
    );
    tapeTest.equal(
      effect.selectionMask,
      effect.search.mask!.data[0].buffer,
      'Deck highlighting reads source-aligned GPU neighborhood masks'
    );

    effect.setPinnedVertex(7, true);
    effect.setVertexPosition(7, [0.375, -0.25]);
    effect.setNeighborhoodDepth(2);
    const firstEncoder = device.createCommandEncoder({id: 'lugraph-deck-effect-real-analysis'});
    effect.analysisGraph.encode(firstEncoder, {parameters: undefined});
    effect.frameGraph.encode(firstEncoder, {parameters: undefined});
    device.submit(firstEncoder.finish());

    const [counts, reverseCounts, componentLabels, importance, distances, mask, pins, positions] =
      await Promise.all([
        readUint32Vector(effect.topology.forward.count),
        readUint32Vector(effect.topology.reverse!.count),
        readUint32Vector(effect.components.output),
        readFloat32Vector(effect.pageRank.output),
        readUint32Vector(effect.search.distances),
        readUint32Vector(effect.search.mask!),
        readUint32Vector(effect.layout.pinned!),
        readFloat32Coordinates(effect.layout.positions)
      ]);

    tapeTest.equal(counts[0], effect.graph.edgeCount, 'GPU builds every original forward edge');
    tapeTest.equal(reverseCounts[0], effect.graph.edgeCount, 'GPU builds exact reverse adjacency');
    tapeTest.equal(componentLabels[0], 0, 'first weak community keeps its stable source ID');
    tapeTest.equal(componentLabels[64], 64, 'disconnected component retains its minimum source ID');
    tapeTest.equal(
      componentLabels[effect.graph.vertexCount - 1],
      effect.graph.vertexCount - 1,
      'isolated node remains its own weak component'
    );
    tapeTest.ok(
      Math.abs(importance.reduce((sum, score) => sum + score, 0) - 1) < 5e-5,
      'actual GPU PageRank sizing remains normalized'
    );
    tapeTest.equal(distances[0], 0, 'GPU neighborhood root matches the stable selected vertex');
    tapeTest.equal(mask[0], 1, 'source-aligned mask highlights the selected vertex');
    tapeTest.equal(
      mask[effect.graph.vertexCount - 1],
      0,
      'disconnected vertices remain unselected'
    );
    tapeTest.equal(pins[7], 1, 'dragging pins the requested resident vertex row');
    tapeTest.ok(Math.abs(positions[14] - 0.375) < 1e-6, 'pinned X survives force integration');
    tapeTest.ok(Math.abs(positions[15] + 0.25) < 1e-6, 'pinned Y survives force integration');

    effect.setSelectedVertex(64);
    effect.setNeighborhoodDepth(1);
    const secondEncoder = device.createCommandEncoder({id: 'lugraph-deck-effect-selected-root'});
    effect.frameGraph.encode(secondEncoder, {parameters: undefined});
    device.submit(secondEncoder.finish());
    const [updatedDistances, updatedMask] = await Promise.all([
      readUint32Vector(effect.search.distances),
      readUint32Vector(effect.search.mask!)
    ]);
    tapeTest.equal(updatedDistances[64], 0, 'newly picked stable source ID becomes the GPU root');
    tapeTest.equal(updatedMask[64], 1, 'new root directly updates the Deck highlight buffer');
    tapeTest.equal(updatedMask[0], 0, 'unrelated components stop receiving selection highlights');
  } finally {
    submitSpy.mockRestore();
    effect?.cleanup({} as EffectContext);
  }

  tapeTest.end();
});

test('luGraph deck.gl renders real source-chunk layers and asynchronously picks stable GPU node IDs', async tapeTest => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const canvasContext = device.getDefaultCanvasContext();
  const canvas = canvasContext.canvas;
  if (!(canvas instanceof HTMLCanvasElement)) {
    tapeTest.fail('real deck.gl integration requires an HTML canvas presentation surface');
    tapeTest.end();
    return;
  }

  const originalParent = canvas.parentNode;
  const originalNextSibling = canvas.nextSibling;
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  const originalStyle = canvas.getAttribute('style');
  const originalDrawingBufferSize = canvasContext.getDrawingBufferSize();
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '320px',
    height: '240px',
    overflow: 'hidden'
  });
  document.body.appendChild(container);
  container.appendChild(canvas);
  canvas.width = 320;
  canvas.height = 240;
  canvas.style.width = '320px';
  canvas.style.height = '240px';
  canvasContext.setDrawingBufferSize(320, 240);

  let deck: ReturnType<typeof createLuGraphExplorerDeck> | undefined;
  const originalShaderAssembler = ShaderAssembler.getDefaultShaderAssembler;
  try {
    deck = createLuGraphExplorerDeck(container, {device});
    await waitForDeckEffect(deck);
    tapeTest.equal(
      ShaderAssembler.getDefaultShaderAssembler,
      originalShaderAssembler,
      'the real application restores luma.gl shader-assembler isolation before Deck is ready'
    );

    const effect = deck.props.effects?.[0];
    tapeTest.ok(
      effect instanceof LuGraphDeckEffect,
      'actual Deck owns a real resident graph effect'
    );
    if (!(effect instanceof LuGraphDeckEffect)) {
      throw new Error('Deck did not initialize its luGraph WebGPU effect');
    }

    const layers = deck.props.layers ?? [];
    const edgeLayers = layers.filter(layer => layer instanceof LuGraphEdgeLayer);
    const nodeLayer = layers.find(layer => layer instanceof LuGraphNodeLayer);
    tapeTest.equal(
      edgeLayers.length,
      2,
      'Deck creates exactly one layer per original nonempty edge chunk'
    );
    tapeTest.deepEqual(
      edgeLayers.map(layer => layer.id),
      ['lugraph-edges-0', 'lugraph-edges-2'],
      'the empty source batch is preserved and not rendered or concatenated'
    );
    tapeTest.ok(
      nodeLayer instanceof LuGraphNodeLayer,
      'Deck instantiates the actual custom node layer'
    );
    if (!(nodeLayer instanceof LuGraphNodeLayer)) {
      throw new Error('Deck did not initialize its luGraph node layer');
    }
    tapeTest.equal(
      nodeLayer.getNumInstances(),
      effect.graph.vertexCount,
      'Deck receives the real GPU vertex instance count despite the empty CPU data array'
    );
    tapeTest.deepEqual(
      edgeLayers.map(layer => layer.getNumInstances()),
      [effect.graph.sourceVertices.data[0].length, effect.graph.sourceVertices.data[2].length],
      'Deck receives actual source-chunk edge counts without a CPU edge array'
    );
    tapeTest.equal(
      nodeLayer.props.positions,
      effect.positions,
      'node attributes share exact GPU layout storage'
    );
    tapeTest.equal(
      edgeLayers[0].props.sourceVertices,
      effect.graph.sourceVertices.data[0].buffer,
      'first edge model binds its original caller-owned source allocation'
    );
    tapeTest.equal(
      edgeLayers[1].props.sourceVertices,
      effect.graph.sourceVertices.data[2].buffer,
      'second edge model binds the untouched third source partition'
    );

    await waitForDeckLayerModels([nodeLayer, ...edgeLayers]);
    deck.setProps({_animate: false});
    effect.setPinnedVertex(0, true);
    effect.setVertexPosition(0, [0, 0]);
    const positionsReadSpy = vi.spyOn(effect.positions, 'readAsync');
    const importanceReadSpy = vi.spyOn(effect.importance, 'readAsync');
    try {
      deck.redraw('real WebGPU luGraph deck rendering and picking regression');
      tapeTest.ok(
        nodeLayer.getModels()[0]?.pipeline,
        'actual node WGSL and vertex pipeline compile'
      );
      for (const edgeLayer of edgeLayers) {
        tapeTest.ok(
          edgeLayer.getModels()[0]?.pipeline,
          'actual original-chunk edge WGSL pipeline compiles'
        );
      }

      const projectedOrigin = deck.getViewports()[0].project([0, 0, 0]);
      const pick = await deck.pickObjectAsync({
        x: Math.floor(projectedOrigin[0]),
        y: Math.floor(projectedOrigin[1]),
        radius: 3,
        layerIds: ['lugraph-nodes']
      });

      tapeTest.ok(deck.width > 1 && deck.height > 1, 'Deck uses a real multi-pixel viewport');
      tapeTest.equal(
        pick?.index,
        0,
        'real asynchronous WebGPU Deck picking recovers stable source ID zero'
      );
      tapeTest.equal(
        pick?.layer?.id,
        'lugraph-nodes',
        'GPU picking identifies the actual node layer'
      );
      tapeTest.equal(
        positionsReadSpy.mock.calls.length,
        0,
        'normal rendering and explicit Deck picking never read graph positions back'
      );
      tapeTest.equal(
        importanceReadSpy.mock.calls.length,
        0,
        'node sizing and picking never download GPU PageRank scores'
      );
    } finally {
      positionsReadSpy.mockRestore();
      importanceReadSpy.mockRestore();
    }
  } finally {
    deck?.finalize();
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    if (originalStyle === null) canvas.removeAttribute('style');
    else canvas.setAttribute('style', originalStyle);
    canvasContext.setDrawingBufferSize(originalDrawingBufferSize[0], originalDrawingBufferSize[1]);
    if (originalParent) {
      originalParent.insertBefore(canvas, originalNextSibling);
    } else {
      canvas.remove();
    }
    container.remove();
  }

  tapeTest.equal(
    ShaderAssembler.getDefaultShaderAssembler,
    originalShaderAssembler,
    'finalizing the real Deck application never leaves a global shader-assembler override'
  );

  tapeTest.end();
});

async function waitForDeckEffect(
  deck: ReturnType<typeof createLuGraphExplorerDeck>
): Promise<void> {
  const deadline = performance.now() + 5_000;
  while (!(deck.props.effects?.[0] instanceof LuGraphDeckEffect)) {
    if (performance.now() >= deadline) {
      throw new Error('The real WebGPU Deck did not finish initializing its luGraph effect');
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
}

async function waitForDeckLayerModels(
  layers: Array<LuGraphNodeLayer | LuGraphEdgeLayer>
): Promise<void> {
  const deadline = performance.now() + 5_000;
  while (layers.some(layer => !getDeckLayerModelState(layer)?.pipeline)) {
    if (performance.now() >= deadline) {
      throw new Error('The real WebGPU Deck did not initialize its graph node and edge models');
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  while (layers.some(layer => getDeckLayerModelState(layer)?.pipeline?.linkStatus === 'pending')) {
    if (performance.now() >= deadline) {
      throw new Error('The real WebGPU graph node and edge pipelines did not finish linking');
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  for (const layer of layers) {
    if (getDeckLayerModelState(layer)?.pipeline?.linkStatus !== 'success') {
      throw new Error(`The real WebGPU ${layer.id} graph pipeline failed to link`);
    }
  }
}

function getDeckLayerModelState(
  layer: LuGraphNodeLayer | LuGraphEdgeLayer
): {pipeline?: {linkStatus?: string}} | undefined {
  return (layer as unknown as {state?: {model?: {pipeline?: {linkStatus?: string}}}}).state?.model;
}

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<number[]> {
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 4);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

async function readFloat32Vector(vector: GPUVector<'float32'>): Promise<number[]> {
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 4);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length));
}

async function readFloat32Coordinates(vector: GPUVector<'float32x2'>): Promise<number[]> {
  const chunk = vector.data[0];
  const bytes = await (chunk.buffer as Buffer).readAsync(chunk.byteOffset, vector.length * 8);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, vector.length * 2));
}
