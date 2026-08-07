// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {EffectContext} from '@deck.gl/core';
import {
  LuGraphDeckEffect,
  LuGraphEdgeLayer,
  LuGraphNodeLayer
} from '@deck.gl-community/arrow-layers';
import {Buffer} from '@luma.gl/core';
import {ShaderAssembler} from '@luma.gl/shadertools';
import type {GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {userEvent} from 'vitest/browser';

import {createLuGraphExplorerDeck} from '../../../examples/deck/lugraph-explorer/app';
import {
  getGraphExplorerGridSize,
  GRAPH_EXPLORER_VERTEX_COUNTS,
  makeGraphExplorerDataset
} from '../../../examples/experimental/lugraph-explorer/graph-data';
import {addGraphExplorerSampledLayoutToGraph} from '../../../examples/experimental/lugraph-explorer/graph-scale-layout';

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
    const dataset = makeGraphExplorerDataset();
    effect = new LuGraphDeckEffect(device, dataset);
    tapeTest.equal(
      submitSpy.mock.calls.length,
      0,
      'effect construction never submits hidden GPU work'
    );
    submitSpy.mockRestore();

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
      effect.communityLabels,
      effect.communities.output.data[0].buffer,
      'community colors read real GPU label-propagation outputs, not weak-component aliases'
    );
    tapeTest.equal(
      effect.degreeValues,
      effect.degree.output.data[0].buffer,
      'degree colors and node radii read their original caller-owned GPU output'
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

    const [
      counts,
      reverseCounts,
      componentLabels,
      communityLabels,
      degrees,
      importance,
      distances,
      mask,
      pins,
      positions
    ] = await Promise.all([
      readUint32Vector(effect.topology.forward.count),
      readUint32Vector(effect.topology.reverse!.count),
      readUint32Vector(effect.components.output),
      readUint32Vector(effect.communities.output),
      readUint32Vector(effect.degree.output),
      readFloat32Vector(effect.pageRank.output),
      readUint32Vector(effect.search.distances),
      readUint32Vector(effect.search.mask!),
      readUint32Vector(effect.layout.pinned!),
      readFloat32Coordinates(effect.layout.positions)
    ]);

    tapeTest.equal(counts[0], effect.graph.edgeCount, 'GPU builds every original forward edge');
    tapeTest.equal(reverseCounts[0], effect.graph.edgeCount, 'GPU builds exact reverse adjacency');
    tapeTest.equal(componentLabels[0], 0, 'first weak community keeps its stable source ID');
    tapeTest.equal(componentLabels[32], 0, 'the narrow bridge joins both weak-component halves');
    tapeTest.equal(
      communityLabels[32],
      32,
      'actual GPU majority-vote coloring keeps the bridged community separate'
    );
    tapeTest.equal(
      degrees.reduce((sum, degree) => sum + degree, 0),
      effect.graph.edgeCount,
      'actual resident vertex degrees account for every original directed edge'
    );
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

test('luGraph Deck effect executes real spatial indexing and community analytics on a bounded fixture', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const dataset = makeGraphExplorerDataset(32);
  let effect: LuGraphDeckEffect | undefined;
  const submitSpy = vi.spyOn(device, 'submit');
  try {
    effect = new LuGraphDeckEffect(device, dataset, {
      layoutMode: 'spatial',
      addSampledLayoutToGraph: addGraphExplorerSampledLayoutToGraph
    });
    tapeTest.equal(submitSpy.mock.calls.length, 0, 'spatial graph construction never submits');
    submitSpy.mockRestore();
    tapeTest.equal(
      effect.activeLayoutMode,
      'spatial',
      'small fixtures can force real acceleration'
    );
    tapeTest.ok(effect.spatialLayout, 'the effect owns an actual GPU spatial layout contributor');
    if (!effect.spatialLayout) throw new Error('The Deck showcase did not create its spatial grid');

    tapeTest.deepEqual(
      effect.spatialLayout.gridSize,
      getGraphExplorerGridSize(dataset.vertexCount),
      'grid dimensions use the shared bounded scalable graph policy'
    );
    tapeTest.equal(
      effect.spatialLayout.vertexIds.length,
      dataset.vertexCount,
      'the caller-owned vertex index capacity covers every original vertex'
    );
    tapeTest.deepEqual(
      effect.graph.sourceVertices.data.map(chunk => chunk.length === 0),
      [false, true, false],
      'the real spatial workflow never concatenates original GPU edge batches'
    );

    const positionsReadSpy = vi.spyOn(effect.positions, 'readAsync');
    try {
      const encoder = device.createCommandEncoder({id: 'lugraph-deck-real-spatial-showcase'});
      effect.analysisGraph.encode(encoder, {parameters: undefined});
      effect.frameGraph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());

      const [indexCount, indexOverflow, offsets, weakComponents, communityLabels, degrees] =
        await Promise.all([
          readUint32Vector(effect.spatialLayout.count),
          readUint32Vector(effect.spatialLayout.overflow),
          readUint32Vector(effect.spatialLayout.cellOffsets),
          readUint32Vector(effect.components.output),
          readUint32Vector(effect.communities.output),
          readUint32Vector(effect.degree.output)
        ]);

      tapeTest.equal(indexCount[0], dataset.vertexCount, 'GPU grid accepts every bounded vertex');
      tapeTest.equal(indexOverflow[0], 0, 'the explicit GPU grid capacity does not overflow');
      tapeTest.equal(
        offsets.at(-1),
        dataset.vertexCount,
        'real GPU cell scan accounts for every row'
      );
      tapeTest.equal(weakComponents[8], 0, 'the weak component crosses the actual source bridge');
      tapeTest.equal(communityLabels[8], 8, 'majority-vote communities remain genuinely distinct');
      tapeTest.equal(
        degrees.reduce((sum, degree) => sum + degree, 0),
        effect.graph.edgeCount,
        'real graph degrees remain exact in spatial layout mode'
      );
      tapeTest.equal(
        positionsReadSpy.mock.calls.length,
        0,
        'grid construction and coloring never download render positions'
      );
    } finally {
      positionsReadSpy.mockRestore();
    }
  } finally {
    submitSpy.mockRestore();
    effect?.cleanup({} as EffectContext);
  }

  tapeTest.end();
});

test('luGraph Deck preserves every original GPU vertex and edge while sampling only forces and visible edges', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const dataset = makeGraphExplorerDataset(32);
  let effect: LuGraphDeckEffect | undefined;
  try {
    effect = new LuGraphDeckEffect(device, dataset, {
      layoutMode: 'sampled',
      pointMode: true,
      maxVisibleEdges: 4,
      addSampledLayoutToGraph: addGraphExplorerSampledLayoutToGraph
    });
    tapeTest.equal(
      effect.activeLayoutMode,
      'sampled',
      'the actual four-sample force path is selected'
    );
    tapeTest.equal(
      effect.layout.repulsion,
      0.0015,
      'four-sample GPU repulsion stays population-independent instead of collapsing at scale'
    );
    tapeTest.equal(
      effect.layout.gravity,
      0.005,
      'bounded sampled gravity preserves visible source communities'
    );
    tapeTest.equal(effect.renderMode, 'points', 'full-population point rendering is selectable');
    tapeTest.equal(effect.renderedVertexCount, 32, 'every original graph vertex remains rendered');
    tapeTest.equal(effect.renderedEdgeCount, 4, 'only visible original edge instances are capped');
    tapeTest.ok(
      effect.graph.edgeCount > effect.renderedEdgeCount,
      'the complete edge graph stays resident'
    );
    tapeTest.equal(
      effect.spatialLayout,
      undefined,
      'sampled forces do not pretend to build a flat grid'
    );
    tapeTest.ok(
      effect.searchGraph,
      'sampled-layout selection has a separately schedulable real BFS'
    );
    tapeTest.deepEqual(
      effect.graph.sourceVertices.data.map(chunk => chunk.length === 0),
      [false, true, false],
      'edge-only visual detail preserves every original GPU source partition'
    );

    const positionsReadSpy = vi.spyOn(effect.positions, 'readAsync');
    try {
      const encoder = device.createCommandEncoder({id: 'lugraph-deck-real-sampled-point-layout'});
      effect.analysisGraph.encode(encoder, {parameters: undefined});
      effect.searchGraph!.encode(encoder, {parameters: undefined});
      effect.frameGraph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());

      const [forward, reverse, degrees, components, communities, importance, distances] =
        await Promise.all([
          readUint32Vector(effect.topology.forward.count),
          readUint32Vector(effect.topology.reverse!.count),
          readUint32Vector(effect.degree.output),
          readUint32Vector(effect.components.output),
          readUint32Vector(effect.communities.output),
          readFloat32Vector(effect.pageRank.output),
          readUint32Vector(effect.search.distances)
        ]);
      tapeTest.equal(
        forward[0],
        effect.graph.edgeCount,
        'sampled layout retains every forward edge'
      );
      tapeTest.equal(
        reverse[0],
        effect.graph.edgeCount,
        'sampled layout retains every reverse edge'
      );
      tapeTest.equal(
        degrees.reduce((sum, degree) => sum + degree, 0),
        effect.graph.edgeCount,
        'complete GPU degree accounting is independent of the edge-only render limit'
      );
      tapeTest.equal(components[8], 0, 'full-graph weak components still cross the source bridge');
      tapeTest.equal(communities[8], 8, 'full-graph majority labels retain a distinct community');
      tapeTest.ok(
        Math.abs(importance.reduce((sum, score) => sum + score, 0) - 1) < 5e-5,
        'full-graph GPU PageRank remains normalized in sampled force mode'
      );
      tapeTest.equal(distances[0], 0, 'independently scheduled BFS resolves the actual selection');
      tapeTest.equal(
        positionsReadSpy.mock.calls.length,
        0,
        'sampled forces, analytics, and points never read resident positions back'
      );
    } finally {
      positionsReadSpy.mockRestore();
    }
  } finally {
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

  const framebuffer = device.createFramebuffer({
    id: 'lugraph-deck-presentation-test-framebuffer',
    width: 320,
    height: 240,
    colorAttachments: [device.preferredColorFormat],
    depthStencilAttachment: 'depth24plus'
  });
  // Shared SwiftShader suites can outlive Dawn's external presentation instance. Retain the real
  // Deck render pass, layer pipelines, queue submission, and native GPU picking on an owned target.
  const currentFramebuffer = vi
    .spyOn(canvasContext, 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  let deck: ReturnType<typeof createLuGraphExplorerDeck> | undefined;
  const originalShaderAssembler = ShaderAssembler.getDefaultShaderAssembler;
  try {
    deck = createLuGraphExplorerDeck(container, {
      device,
      dataset: makeGraphExplorerDataset(8),
      layoutMode: 'sampled',
      pointMode: true,
      maxVisibleEdges: 4
    });
    deck.setProps({_animate: false});
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

    const graphScale = container.querySelector<HTMLInputElement>('[data-lugraph-size]');
    const decreaseGraphScale = container.querySelector<HTMLButtonElement>(
      '[data-lugraph-size-decrease]'
    );
    const increaseGraphScale = container.querySelector<HTMLButtonElement>(
      '[data-lugraph-size-increase]'
    );
    const layoutMode = container.querySelector<HTMLSelectElement>('[data-lugraph-layout]');
    const colorMode = container.querySelector<HTMLSelectElement>('[data-lugraph-color]');
    const nodeSize = container.querySelector<HTMLSelectElement>('[data-lugraph-node-size]');
    const legend = container.querySelector<HTMLElement>('[data-lugraph-legend]');
    const status = container.querySelector<HTMLElement>('[role="status"]');
    tapeTest.ok(graphScale, 'Deck publishes an accessible graph-size slider');
    tapeTest.ok(
      decreaseGraphScale,
      'a real accessible decrease action complements native dragging'
    );
    tapeTest.ok(
      increaseGraphScale,
      'a real accessible increase action complements native dragging'
    );
    tapeTest.equal(graphScale?.type, 'range', 'Deck graph population is keyboard adjustable');
    tapeTest.equal(graphScale?.min, '0', 'the first graph-size step represents 128 vertices');
    tapeTest.equal(
      graphScale?.max,
      String(GRAPH_EXPLORER_VERTEX_COUNTS.length - 1),
      'all fourteen actual graph populations remain selectable'
    );
    tapeTest.equal(
      GRAPH_EXPLORER_VERTEX_COUNTS.at(-1),
      1_048_576,
      'the final population is 1,048,576 actual resident vertices'
    );
    tapeTest.ok(layoutMode, 'actual exact, spatial, and sampled force modes are selectable');
    tapeTest.ok(colorMode, 'actual GPU community and analytics colors are selectable');
    tapeTest.ok(nodeSize, 'actual GPU PageRank and degree node sizes are selectable');
    tapeTest.ok(legend, 'a real visible legend explains GPU community and selection colors');
    tapeTest.deepEqual(
      Array.from(layoutMode?.options ?? [], option => option.value),
      ['auto', 'exact', 'spatial', 'sampled'],
      'Deck layout options correspond to actual exact, flat-grid, and linear-work GPU paths'
    );
    tapeTest.deepEqual(
      Array.from(colorMode?.options ?? [], option => option.value),
      ['community', 'component', 'degree', 'pagerank', 'distance'],
      'Deck color choices bind real resident analytic buffers'
    );
    tapeTest.deepEqual(
      Array.from(nodeSize?.options ?? [], option => option.value),
      ['pagerank', 'degree', 'uniform'],
      'Deck node radii consume actual GPU PageRank or degree results'
    );
    tapeTest.equal(
      status?.getAttribute('aria-live'),
      'polite',
      'live status is screen-reader safe'
    );

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
      'Deck renders every original GPU point despite the empty CPU data array'
    );
    tapeTest.equal(
      effect.activeLayoutMode,
      'sampled',
      'Deck executes the actual linear force path'
    );
    tapeTest.equal(
      effect.renderMode,
      'points',
      'Deck renders genuine one-vertex GPU point instances'
    );
    tapeTest.equal(effect.renderedVertexCount, 8, 'point mode never samples the graph population');
    tapeTest.equal(effect.renderedEdgeCount, 4, 'only rendered original edge rows are bounded');
    tapeTest.equal(
      nodeLayer.props.pointMode,
      true,
      'the actual Deck node layer receives point mode'
    );
    tapeTest.deepEqual(
      edgeLayers.map(layer => layer.getNumInstances()),
      [2, 2],
      'the truthful edge-only cap preserves both original source chunks without packing'
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
    effect.setPinnedVertex(0, true);
    effect.setVertexPosition(0, [0, 0]);
    const positionsReadSpy = vi.spyOn(effect.positions, 'readAsync');
    const importanceReadSpy = vi.spyOn(effect.importance, 'readAsync');
    const submitSpy = vi.spyOn(device, 'submit');
    try {
      deck.redraw('real WebGPU luGraph deck rendering and picking regression');
      tapeTest.ok(
        currentFramebuffer.mock.calls.length > 0,
        'real Deck rendering targets an owned WebGPU framebuffer instead of a stale surface'
      );
      tapeTest.ok(submitSpy.mock.calls.length > 0, 'real Deck layer passes submit GPU commands');
      tapeTest.ok(
        nodeLayer.getModels()[0]?.pipeline,
        'actual node WGSL and vertex pipeline compile'
      );
      tapeTest.equal(
        nodeLayer.getModels()[0]?.topology,
        'point-list',
        'the real GPU pipeline renders one actual point for every source vertex'
      );
      tapeTest.equal(
        nodeLayer.getModels()[0]?.vertexCount,
        1,
        'point mode emits one vertex per original resident node instance'
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

      if (!graphScale) throw new Error('Deck did not mount its accessible graph-size slider');
      const previousPositions = effect.positions;
      graphScale.value = '0';
      graphScale.dispatchEvent(new Event('input', {bubbles: true}));
      tapeTest.equal(
        graphScale.value,
        '0',
        'dragging the graph-size thumb immediately retains the requested resident graph'
      );

      // A real Effect publishes diagnostics every tenth frame. Previously its HUD refresh reset
      // the pending thumb to the old graph, so the debounce silently rebuilt nothing.
      for (let frame = 0; frame < 10; frame++) {
        deck.redraw('real GPU diagnostics must not discard a pending graph-size selection');
      }
      tapeTest.equal(
        graphScale.value,
        '0',
        'real GPU statistics never snap a dragging graph-size thumb back to its old value'
      );
      tapeTest.equal(
        container.querySelector('[data-lugraph-size-value]')?.textContent,
        '128',
        'the pending graph population remains visible while resident metrics update'
      );
      graphScale.focus();
      await userEvent.keyboard('{ArrowRight}');
      tapeTest.equal(
        graphScale.value,
        '1',
        'a genuine trusted keyboard arrow advances the accessible real graph-size slider'
      );
      await waitForReplacementDeckEffect(deck, effect);
      const resizedEffect = deck.props.effects?.[0];
      if (!(resizedEffect instanceof LuGraphDeckEffect)) {
        throw new Error('The real Deck graph slider did not replace its GPU effect');
      }
      tapeTest.equal(
        resizedEffect.graph.vertexCount,
        256,
        'trusted keyboard input rebuilds the actual GPU graph'
      );
      tapeTest.equal(
        resizedEffect.renderedVertexCount,
        256,
        'all resized GPU vertices remain rendered'
      );
      tapeTest.equal(
        resizedEffect.renderedEdgeCount,
        4,
        'only resized visible edge instances stay capped'
      );
      tapeTest.equal(
        resizedEffect.activeLayoutMode,
        'sampled',
        'the actual selected force survives resize'
      );
      tapeTest.equal(
        resizedEffect.renderMode,
        'points',
        'actual all-vertex point mode survives resize'
      );
      tapeTest.notEqual(
        resizedEffect.positions,
        previousPositions,
        'resized Deck models use fresh caller-owned render positions'
      );
      tapeTest.deepEqual(
        resizedEffect.graph.sourceVertices.data.map(chunk => chunk.length === 0),
        [false, true, false],
        'resizing preserves nonempty, empty, and nonempty original edge chunks'
      );

      const resizedLayers = deck.props.layers ?? [];
      const resizedNodeLayer = resizedLayers.find(layer => layer instanceof LuGraphNodeLayer);
      const resizedEdgeLayers = resizedLayers.filter(layer => layer instanceof LuGraphEdgeLayer);
      if (!(resizedNodeLayer instanceof LuGraphNodeLayer)) {
        throw new Error('The resized Deck showcase lost its real node layer');
      }
      await waitForDeckLayerModels([resizedNodeLayer, ...resizedEdgeLayers]);
      tapeTest.equal(
        resizedNodeLayer.id,
        'lugraph-nodes',
        'the original node-layer identity stays stable'
      );
      tapeTest.equal(
        resizedNodeLayer.getNumInstances(),
        256,
        'same-ID Deck node instances track their rebuilt GPU allocation'
      );
      tapeTest.equal(
        resizedNodeLayer.props.positions,
        resizedEffect.positions,
        'same-ID Deck node models rebind their new resident vertex attribute'
      );
      tapeTest.equal(
        resizedNodeLayer.props.communities,
        resizedEffect.communityLabels,
        'same-ID Deck models bind genuine resized GPU community labels'
      );
      tapeTest.equal(
        resizedNodeLayer.props.degrees,
        resizedEffect.degreeValues,
        'same-ID Deck models bind genuine resized GPU vertex degrees'
      );
      tapeTest.deepEqual(
        resizedEdgeLayers.map(layer => layer.id),
        ['lugraph-edges-0', 'lugraph-edges-2'],
        'same-ID edge layers preserve every original source partition after resizing'
      );
      tapeTest.deepEqual(
        resizedEdgeLayers.map(layer => layer.getNumInstances()),
        [2, 2],
        'both rebuilt source partitions retain only their truthful visible edge allocation'
      );
      for (const [index, edgeLayer] of resizedEdgeLayers.entries()) {
        const chunkIndex = index === 0 ? 0 : 2;
        tapeTest.equal(
          edgeLayer.props.sourceVertices,
          resizedEffect.graph.sourceVertices.data[chunkIndex].buffer,
          'same-ID edge models rebind their rebuilt original GPU source allocation'
        );
      }

      resizedEffect.setPinnedVertex(0, true);
      resizedEffect.setVertexPosition(0, [0, 0]);
      deck.redraw('rebuilt luGraph Deck models must render from new physical allocations');
      const [resizedComponents, resizedCommunities, resizedDegrees] = await Promise.all([
        readUint32Vector(resizedEffect.components.output),
        readUint32Vector(resizedEffect.communities.output),
        readUint32Vector(resizedEffect.degree.output)
      ]);
      tapeTest.equal(resizedComponents[64], 0, 'resized weak components retain the source bridge');
      tapeTest.equal(
        resizedCommunities[64],
        64,
        'resized real GPU label propagation keeps a separate community'
      );
      tapeTest.equal(
        resizedDegrees.reduce((sum, degree) => sum + degree, 0),
        resizedEffect.graph.edgeCount,
        'resized node-degree visualizations consume actual GPU results'
      );

      const rebuiltOrigin = deck.getViewports()[0].project([0, 0, 0]);
      const resizedPick = await deck.pickObjectAsync({
        x: Math.floor(rebuiltOrigin[0]),
        y: Math.floor(rebuiltOrigin[1]),
        radius: 3,
        layerIds: ['lugraph-nodes']
      });
      tapeTest.equal(
        resizedPick?.index,
        0,
        'native asynchronous GPU picking still resolves stable IDs after graph resizing'
      );
      tapeTest.equal(
        resizedPick?.layer?.id,
        'lugraph-nodes',
        'native picking retains the original node-layer identity after rebuilding'
      );

      // Exercise a genuine fresh keyboard interaction without synthesizing an `input` event or
      // retaining pending slider state. Deck must never consume native range-control arrow keys.
      tapeTest.equal(
        graphScale.value,
        '1',
        'the settled actual graph population owns slider step one'
      );
      tapeTest.equal(
        graphScale.disabled,
        false,
        'the settled graph slider accepts real user input'
      );
      graphScale.focus();
      await userEvent.keyboard('{ArrowRight}');
      tapeTest.equal(
        graphScale.value,
        '2',
        'a trusted ArrowRight changes a pristine slider without synthetic pending state'
      );
      await waitForReplacementDeckEffect(deck, resizedEffect);
      const keyboardEffect = deck.props.effects?.[0];
      if (!(keyboardEffect instanceof LuGraphDeckEffect)) {
        throw new Error('A genuine keyboard action did not rebuild the actual WebGPU graph');
      }
      tapeTest.equal(
        keyboardEffect.graph.vertexCount,
        512,
        'a pristine trusted keyboard action rebuilds all 512 actual GPU graph vertices'
      );
      tapeTest.equal(
        keyboardEffect.renderedVertexCount,
        512,
        'fresh slider interaction preserves full real point population'
      );
      tapeTest.equal(
        keyboardEffect.renderedEdgeCount,
        4,
        'fresh slider interaction still limits only displayed original edge instances'
      );
      const keyboardNodeLayer = (deck.props.layers ?? []).find(
        layer => layer instanceof LuGraphNodeLayer
      );
      const keyboardEdgeLayers = (deck.props.layers ?? []).filter(
        layer => layer instanceof LuGraphEdgeLayer
      );
      if (!(keyboardNodeLayer instanceof LuGraphNodeLayer)) {
        throw new Error('A real trusted keyboard resize lost the Deck point layer');
      }
      await waitForDeckLayerModels([keyboardNodeLayer, ...keyboardEdgeLayers]);
      tapeTest.equal(
        keyboardNodeLayer.getNumInstances(),
        512,
        'the same-ID GPU point layer consumes every freshly resized original vertex'
      );
      tapeTest.deepEqual(
        keyboardEdgeLayers.map(layer => layer.getNumInstances()),
        [2, 2],
        'both original source partitions survive genuine keyboard-only graph resizing'
      );

      // Pointer interaction must work from settled state too; use Playwright's trusted native
      // click at the beginning of the range instead of assigning or dispatching DOM values.
      const sliderBounds = graphScale.getBoundingClientRect();
      await userEvent.click(graphScale, {
        position: {x: 1, y: Math.max(1, Math.floor(sliderBounds.height / 2))}
      });
      tapeTest.equal(
        graphScale.value,
        '0',
        'a genuine trusted pointer click changes a pristine graph-size range control'
      );
      await waitForReplacementDeckEffect(deck, keyboardEffect);
      const pointerEffect = deck.props.effects?.[0];
      if (!(pointerEffect instanceof LuGraphDeckEffect)) {
        throw new Error('A genuine pointer click did not rebuild the actual WebGPU graph');
      }
      tapeTest.equal(
        pointerEffect.graph.vertexCount,
        128,
        'a trusted native pointer click rebuilds every original resident vertex'
      );
      tapeTest.equal(
        pointerEffect.renderedVertexCount,
        128,
        'pointer resizing never samples vertices'
      );
      tapeTest.equal(
        pointerEffect.renderedEdgeCount,
        4,
        'pointer resizing limits only visible edges'
      );
      const pointerLayers = (deck.props.layers ?? []).filter(
        (layer): layer is LuGraphNodeLayer | LuGraphEdgeLayer =>
          layer instanceof LuGraphNodeLayer || layer instanceof LuGraphEdgeLayer
      );
      await waitForDeckLayerModels(pointerLayers);
      tapeTest.ok(
        !/GPU\s+(?:frame|execution|duration)\s*[:=]\s*\d/i.test(status?.textContent ?? ''),
        'the Deck dashboard never invents GPU timing or convergence samples'
      );
    } finally {
      positionsReadSpy.mockRestore();
      importanceReadSpy.mockRestore();
      submitSpy.mockRestore();
    }
  } finally {
    deck?.finalize();
    currentFramebuffer.mockRestore();
    framebuffer.destroy();
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

async function waitForReplacementDeckEffect(
  deck: ReturnType<typeof createLuGraphExplorerDeck>,
  previous: LuGraphDeckEffect
): Promise<void> {
  const deadline = performance.now() + 5_000;
  while (
    !(deck.props.effects?.[0] instanceof LuGraphDeckEffect) ||
    deck.props.effects[0] === previous
  ) {
    if (performance.now() >= deadline) {
      throw new Error('The real Deck graph-size slider did not replace its resident GPU effect');
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
