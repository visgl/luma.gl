// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  LuGraphDeckEffect,
  LuGraphEdgeLayer,
  LuGraphNodeLayer,
  OrthographicView,
  type LuGraphDeckEffectStats,
  type PickingInfo
} from '@deck.gl-community/arrow-layers';
import {Buffer, type Device} from '@luma.gl/core';
import {
  ShaderAssembler,
  type GLSLShaderAssembler,
  type WGSLShaderAssembler
} from '@luma.gl/shadertools';
import {ArrowDeck} from '../arrow-deck';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {
  GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT,
  GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT,
  GRAPH_EXPLORER_MAX_VISIBLE_EDGES,
  GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT,
  GRAPH_EXPLORER_VERTEX_COUNTS,
  makeGraphExplorerDataset,
  type GraphExplorerColorMode,
  type GraphExplorerDataset,
  type GraphExplorerLayoutMode,
  type GraphExplorerNodeSizeMode
} from '../../experimental/lugraph-explorer/graph-data';
import {addGraphExplorerSampledLayoutToGraph} from '../../experimental/lugraph-explorer/graph-scale-layout';

const DEFAULT_NEIGHBORHOOD_DEPTH = 2;

type GraphExplorerControls = {
  update: () => void;
  destroy: () => void;
};

type LuGraphExplorerDeckOptions = DeckExampleDeviceOptions & {
  dataset?: GraphExplorerDataset;
  layoutMode?: GraphExplorerLayoutMode;
  pointMode?: boolean;
  maxVisibleEdges?: number;
};

type GraphExplorerControlProps = {
  getEffect: () => LuGraphDeckEffect | null;
  getStats: () => LuGraphDeckEffectStats | null;
  getPendingVertexCount: () => number | null;
  getLoadingStatus: () => string | null;
  getEdgesVisible: () => boolean;
  resize: (vertexCount: number) => void;
  setLayoutMode: (mode: GraphExplorerLayoutMode) => void;
  setColorMode: (mode: GraphExplorerColorMode) => void;
  setNodeSizeMode: (mode: GraphExplorerNodeSizeMode) => void;
  setEdgesVisible: (visible: boolean) => void;
  setPaused: (paused: boolean) => void;
  redraw: (reason: string) => void;
};

/**
 * Creates an optional deck.gl explorer using resident luGraph analytics and original edge chunks.
 *
 * Deck owns the WebGPU frame encoder, rendering, controller, and asynchronous node picking. The
 * graph module never depends on deck.gl, and no graph column is downloaded for animation, color,
 * sizing, selection, or dragging.
 */
export function createLuGraphExplorerDeck(
  parent?: HTMLDivElement,
  options: LuGraphExplorerDeckOptions = {}
): ArrowDeck<OrthographicView> {
  const {
    dataset,
    layoutMode: initialLayoutMode = 'auto',
    pointMode,
    maxVisibleEdges = GRAPH_EXPLORER_MAX_VISIBLE_EDGES,
    ...deviceOptions
  } = options;
  const initialDataset =
    dataset ?? makeGraphExplorerDataset(GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT);
  const ownsContainer = !parent;
  const container = parent ?? createStandaloneContainer();
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  let effect: LuGraphDeckEffect | null = null;
  let activeDevice: Device | null = null;
  let latestStats: LuGraphDeckEffectStats | null = null;
  let currentLayoutMode = initialLayoutMode;
  let currentColorMode: GraphExplorerColorMode = 'community';
  let currentNodeSizeMode: GraphExplorerNodeSizeMode = 'pagerank';
  let edgesVisible = initialDataset.vertexCount < GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT;
  let pendingGraphVertexCount: number | null = null;
  let loadingStatus: string | null = null;
  let rebuildGeneration = 0;
  let rebuildFrame: number | null = null;
  let draggedVertex: number | null = null;
  let restoreShaderAssembler: (() => void) | null = null;
  let deck: ArrowDeck<OrthographicView>;
  const controls = createExplorerControls(container, {
    getEffect: () => effect,
    getStats: () => latestStats,
    getPendingVertexCount: () => pendingGraphVertexCount,
    getLoadingStatus: () => loadingStatus,
    getEdgesVisible: () => edgesVisible,
    resize: vertexCount => scheduleGraphResize(vertexCount),
    setLayoutMode: mode => {
      currentLayoutMode = mode;
      if (effect) scheduleGraphResize(effect.graph.vertexCount);
    },
    setColorMode: mode => {
      currentColorMode = mode;
      updateLayers('luGraph GPU visual color encoding changed');
    },
    setNodeSizeMode: mode => {
      currentNodeSizeMode = mode;
      updateLayers('luGraph GPU node sizing changed');
    },
    setEdgesVisible: visible => {
      edgesVisible = visible;
      updateLayers('luGraph source-chunk edge visibility changed');
    },
    setPaused: paused => {
      deck?.setProps({_animate: !paused});
      if (!paused) deck?.redraw('luGraph progressive GPU layout resumed');
    },
    redraw: reason => deck?.redraw(reason)
  });

  deck = new ArrowDeck<OrthographicView>({
    parent: container,
    ...getDeckExampleProps({...deviceOptions, deviceType: 'webgpu'}),
    views: new OrthographicView({id: 'lugraph-orthographic'}),
    initialViewState: {target: [0, 0, 0], zoom: 6.8, minZoom: 4, maxZoom: 12},
    controller: {
      dragPan: true,
      scrollZoom: {smooth: true, speed: 0.02},
      doubleClickZoom: true,
      touchZoom: true
    },
    _animate: true,
    pickAsync: 'auto',
    layers: [],
    effects: [],
    onDeviceInitialized: initializedDevice => {
      restoreShaderAssembler?.();
      restoreShaderAssembler = installLegacyDeckShaderAssemblerCompatibility(initializedDevice);
    },
    onError: error => {
      restoreShaderAssembler?.();
      restoreShaderAssembler = null;
      throw error;
    },
    getTooltip: info => getVertexTooltip(info, effect),
    onClick: info => {
      effect?.setSelectedVertex(info.picked && info.index >= 0 ? info.index : null);
      controls.update();
      deck.redraw('luGraph deck selection changed');
    },
    onDragStart: (info, event) => {
      if (!effect || !info.picked || info.index < 0) return;
      draggedVertex = info.index;
      effect.setSelectedVertex(draggedVertex);
      effect.setPinnedVertex(draggedVertex, true);
      updateDraggedVertex(effect, draggedVertex, info);
      controls.update();
      event.stopPropagation();
      deck.redraw('luGraph vertex drag started');
    },
    onDrag: (info, event) => {
      if (!effect || draggedVertex === null) return;
      updateDraggedVertex(effect, draggedVertex, info);
      event.stopPropagation();
      deck.redraw('luGraph vertex dragged');
    },
    onDragEnd: (_info, event) => {
      if (draggedVertex === null) return;
      draggedVertex = null;
      controls.update();
      event.stopPropagation();
      deck.redraw('luGraph vertex pinned');
    },
    onLoad: ({deck: loadedDeck, device}) => {
      if (device.type !== 'webgpu') throw new Error('luGraph deck explorer requires WebGPU');
      activeDevice = device;
      rebuildGraph(initialDataset, loadedDeck);
    },
    onFinalize: () => {
      restoreShaderAssembler?.();
      restoreShaderAssembler = null;
      activeDevice = null;
      rebuildGeneration++;
      if (rebuildFrame !== null) cancelAnimationFrame(rebuildFrame);
      draggedVertex = null;
      controls.destroy();
      if (ownsContainer) container.remove();
    }
  });

  return deck;

  /** Yields before large CPU generation and GPU allocation so progress remains visible. */
  function scheduleGraphResize(vertexCount: number): void {
    const generation = ++rebuildGeneration;
    pendingGraphVertexCount = vertexCount;
    loadingStatus = `Preparing ${vertexCount.toLocaleString()} resident vertices…`;
    controls.update();
    scheduleAfterPaint(generation, () => {
      let nextDataset: GraphExplorerDataset;
      try {
        nextDataset = makeGraphExplorerDataset(vertexCount);
      } catch (error) {
        loadingStatus = error instanceof Error ? error.message : 'Graph generation failed';
        pendingGraphVertexCount = null;
        controls.update();
        return;
      }
      loadingStatus = `Uploading ${vertexCount.toLocaleString()} vertices and ${nextDataset.sourceChunks.reduce((total, chunk) => total + chunk.length, 0).toLocaleString()} original edges…`;
      controls.update();
      scheduleAfterPaint(generation, () => {
        try {
          rebuildGraph(nextDataset);
          loadingStatus = null;
          pendingGraphVertexCount = null;
          controls.update();
        } catch (error) {
          loadingStatus =
            error instanceof Error ? error.message : 'The current adapter cannot hold this graph';
          pendingGraphVertexCount = null;
          controls.update();
        }
      });
    });
  }

  /** Uses two frame callbacks so the current status is painted before expensive synchronous work. */
  function scheduleAfterPaint(generation: number, callback: () => void): void {
    if (rebuildFrame !== null) cancelAnimationFrame(rebuildFrame);
    rebuildFrame = requestAnimationFrame(() => {
      if (generation !== rebuildGeneration || !activeDevice) return;
      rebuildFrame = requestAnimationFrame(() => {
        rebuildFrame = null;
        if (generation === rebuildGeneration && activeDevice) callback();
      });
    });
  }

  /** Rebuilds resident algorithms and original source layers without changing Deck's camera. */
  function rebuildGraph(
    nextDataset: GraphExplorerDataset,
    targetDeck: ArrowDeck<OrthographicView> = deck
  ): void {
    if (!activeDevice) return;
    const previousDepth = effect?.currentNeighborhoodDepth ?? DEFAULT_NEIGHBORHOOD_DEPTH;
    const previousSelection = effect?.currentSelection ?? 0;
    latestStats = null;
    draggedVertex = null;
    if (nextDataset.vertexCount >= GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT) {
      edgesVisible = false;
    }
    const nextEffect = new LuGraphDeckEffect(activeDevice, nextDataset, {
      layoutMode: currentLayoutMode,
      pointMode,
      maxVisibleEdges,
      addSampledLayoutToGraph: addGraphExplorerSampledLayoutToGraph,
      onStats: stats => {
        latestStats = stats;
        controls.update();
      }
    });
    nextEffect.setNeighborhoodDepth(previousDepth);
    nextEffect.setSelectedVertex(
      previousSelection !== null && previousSelection < nextDataset.vertexCount
        ? previousSelection
        : null
    );
    effect = nextEffect;
    targetDeck.setProps({effects: [nextEffect], layers: createLayers(nextEffect)});
    controls.update();
    // Deck updates same-ID layer bindings at the start of its next animation frame. Drawing
    // synchronously here would reuse the previous effect's already-destroyed GPU allocations.
  }

  /** Preserves stable layer IDs while custom layers rebind each newly owned physical buffer. */
  function updateLayers(reason: string): void {
    if (!effect || !deck) return;
    deck.setProps({layers: createLayers(effect)});
    controls.update();
    deck.redraw(reason);
  }

  function createLayers(graphEffect: LuGraphDeckEffect): (LuGraphEdgeLayer | LuGraphNodeLayer)[] {
    const nonemptyChunkCount = graphEffect.graph.sourceVertices.data.filter(
      chunk => chunk.length > 0
    ).length;
    let remainingVisibleEdges = graphEffect.renderedEdgeCount;
    let remainingVisibleChunks = nonemptyChunkCount;
    const edgeLayers = edgesVisible
      ? graphEffect.graph.sourceVertices.data.flatMap((source, chunkIndex) => {
          if (source.length === 0) return [];
          const target = graphEffect.graph.targetVertices.data[chunkIndex];
          const visibleEdgeCount = Math.min(
            source.length,
            Math.ceil(remainingVisibleEdges / Math.max(remainingVisibleChunks, 1))
          );
          remainingVisibleEdges -= visibleEdgeCount;
          remainingVisibleChunks--;
          if (visibleEdgeCount === 0) return [];
          return [
            new LuGraphEdgeLayer({
              id: `lugraph-edges-${chunkIndex}`,
              data: [],
              pickable: false,
              positions: graphEffect.positions,
              sourceVertices:
                source.buffer instanceof Buffer ? source.buffer : source.buffer.buffer,
              targetVertices:
                target.buffer instanceof Buffer ? target.buffer : target.buffer.buffer,
              distances: graphEffect.distances,
              edgeCount: visibleEdgeCount,
              opacity: graphEffect.graph.vertexCount > 1_024 ? 0.22 : 0.55
            })
          ];
        })
      : [];
    const nodeLayer = new LuGraphNodeLayer({
      id: 'lugraph-nodes',
      data: [],
      pickable: true,
      autoHighlight: true,
      positions: graphEffect.positions,
      importance: graphEffect.importance,
      degrees: graphEffect.degreeValues,
      components: graphEffect.componentLabels,
      communities: graphEffect.communityLabels,
      distances: graphEffect.distances,
      selectionMask: graphEffect.selectionMask,
      colorMode: currentColorMode,
      sizeMode: currentNodeSizeMode,
      pointMode: graphEffect.renderMode === 'points',
      vertexCount: graphEffect.graph.vertexCount,
      opacity: 1
    });
    return [...edgeLayers, nodeLayer];
  }
}

/** Bridges exactly one legacy Deck assembler call while preserving strict language separation. */
function installLegacyDeckShaderAssemblerCompatibility(device: Device): () => void {
  const original = ShaderAssembler.getDefaultShaderAssembler;
  let restored = false;

  function restore(): void {
    if (restored) return;
    if (ShaderAssembler.getDefaultShaderAssembler === getLegacyDeckShaderAssembler) {
      ShaderAssembler.getDefaultShaderAssembler = original;
    }
    restored = true;
  }

  function getLegacyDeckShaderAssembler(shaderLanguage: 'glsl'): GLSLShaderAssembler;
  function getLegacyDeckShaderAssembler(shaderLanguage: 'wgsl'): WGSLShaderAssembler;
  function getLegacyDeckShaderAssembler(
    shaderLanguage: 'glsl' | 'wgsl'
  ): GLSLShaderAssembler | WGSLShaderAssembler;
  function getLegacyDeckShaderAssembler(
    shaderLanguage?: 'glsl' | 'wgsl'
  ): GLSLShaderAssembler | WGSLShaderAssembler {
    if (shaderLanguage === undefined) {
      // TODO: Remove after deck.gl forwards its known shading language to luma.gl.
      // Restore before forwarding so later user calls retain strict explicit-language behavior.
      restore();
      return device.info.shadingLanguage === 'wgsl'
        ? original.call(ShaderAssembler, 'wgsl')
        : original.call(ShaderAssembler, 'glsl');
    }
    return shaderLanguage === 'wgsl'
      ? original.call(ShaderAssembler, 'wgsl')
      : original.call(ShaderAssembler, 'glsl');
  }

  ShaderAssembler.getDefaultShaderAssembler = getLegacyDeckShaderAssembler;
  return restore;
}

/** Updates the same float32x2 allocation bound directly by the node layer's instance attribute. */
function updateDraggedVertex(effect: LuGraphDeckEffect, vertex: number, info: PickingInfo): void {
  const coordinate = info.coordinate;
  if (!coordinate || coordinate.length < 2) return;
  effect.setVertexPosition(vertex, [coordinate[0], coordinate[1]]);
}

function getVertexTooltip(info: PickingInfo, effect: LuGraphDeckEffect | null): string | null {
  if (!info.picked || info.index < 0 || !effect) return null;
  const state = effect.isVertexPinned(info.index) ? 'pinned' : 'movable';
  return `Vertex ${info.index} · ${state}\nGPU communities · PageRank · neighborhood`;
}

/** Provides an accessible, resident-graph control surface without polling GPU columns. */
function createExplorerControls(
  container: HTMLDivElement,
  props: GraphExplorerControlProps
): GraphExplorerControls {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'GPU graph explorer controls and live diagnostics');
  panel.setAttribute('data-lugraph-inspector', '');
  Object.assign(panel.style, {
    position: 'absolute',
    left: '18px',
    top: '76px',
    zIndex: '2',
    width: 'min(324px, calc(100% - 36px))',
    maxHeight: 'calc(100% - 94px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: '16px',
    borderRadius: '16px',
    background: 'linear-gradient(160deg, rgba(11, 18, 38, 0.96), rgba(8, 13, 27, 0.92))',
    border: '1px solid rgba(113, 161, 242, 0.24)',
    boxShadow: '0 18px 55px rgba(0, 0, 0, 0.34)',
    backdropFilter: 'blur(16px)',
    pointerEvents: 'auto',
    touchAction: 'auto',
    color: '#edf4ff',
    font: '12px/1.48 system-ui, sans-serif'
  });
  const initialSizeIndex = Math.max(
    0,
    GRAPH_EXPLORER_VERTEX_COUNTS.indexOf(GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT)
  );
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <strong style="font-size:16px;letter-spacing:-.25px">Graph Observatory</strong>
      <span style="padding:3px 8px;border-radius:99px;background:#123a45;color:#80eadb;
        font-size:10px;font-weight:700;letter-spacing:.4px">LIVE GPU</span>
    </div>
    <p style="margin:7px 0 14px;color:#a9b8d0">Resident graph analytics and direct
      deck.gl rendering. No per-frame graph readback.</p>

    <label style="display:block;margin-bottom:13px">
      <span style="display:flex;justify-content:space-between;color:#b9c8df">Graph size
        <strong data-lugraph-size-value style="color:#8ccfff">1,024</strong>
      </span>
      <input data-lugraph-size aria-label="Graph vertex count" type="range" min="0"
        max="${GRAPH_EXPLORER_VERTEX_COUNTS.length - 1}" step="1"
        value="${initialSizeIndex}" style="width:100%;margin:8px 0 0;accent-color:#76bbff" />
      <span style="display:flex;justify-content:space-between;color:#8798b2;font-size:10px">
        <span>128</span>
        <span>${GRAPH_EXPLORER_VERTEX_COUNTS[GRAPH_EXPLORER_VERTEX_COUNTS.length - 1].toLocaleString()} vertices</span>
      </span>
    </label>

    <div style="display:flex;align-items:center;justify-content:space-between;margin:-5px 0 12px">
      <button data-lugraph-size-decrease type="button"
        aria-label="Decrease graph population">−</button>
      <span style="font-size:10px;color:#8798b2">14 actual resident graph populations</span>
      <button data-lugraph-size-increase type="button"
        aria-label="Increase graph population">+</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:11px">
      <label>Color by
        <select data-lugraph-color aria-label="Node color encoding"
          style="display:block;width:100%;margin-top:4px">
          <option value="community">Communities</option>
          <option value="component">Components</option>
          <option value="degree">Degree</option>
          <option value="pagerank">PageRank</option>
          <option value="distance">Distance</option>
        </select>
      </label>
      <label>Node size
        <select data-lugraph-node-size aria-label="Node size encoding"
          style="display:block;width:100%;margin-top:4px">
          <option value="pagerank">PageRank</option>
          <option value="degree">Degree</option>
          <option value="uniform">Uniform</option>
        </select>
      </label>
    </div>

    <label style="display:block;margin-bottom:10px">Force layout
      <select data-lugraph-layout aria-label="GPU force layout algorithm"
        style="display:block;width:100%;margin-top:4px">
        <option value="auto">Adaptive · exact / spatial / sampled</option>
        <option value="exact">Exact · bounded population</option>
        <option value="spatial">Spatial · near / far grid</option>
        <option value="sampled">Linear · four sampled repulsions</option>
      </select>
    </label>

    <label style="display:block;margin-bottom:10px">Neighborhood depth
      <input data-lugraph-depth aria-label="GPU neighborhood breadth-first search depth"
        type="range" min="0" max="8" value="${DEFAULT_NEIGHBORHOOD_DEPTH}"
        style="display:block;width:100%;margin-top:5px;accent-color:#d692ff" />
    </label>

    <label style="display:flex;align-items:center;gap:7px;margin-bottom:12px;color:#c4d0e2">
      <input data-lugraph-edges type="checkbox" checked aria-label="Show original graph edges" />
      Show original source-chunk edges <span data-lugraph-edge-count></span>
    </label>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:10px;
      border:1px solid rgba(113,161,242,.16);border-radius:11px;background:rgba(4,9,20,.48)">
      <span style="color:#9dafc8">Frame rate</span>
      <strong data-lugraph-fps style="text-align:right">—</strong>
      <span style="color:#9dafc8">CPU encode</span>
      <strong data-lugraph-encode style="text-align:right">—</strong>
      <span style="color:#9dafc8">Resident memory</span>
      <strong data-lugraph-memory style="text-align:right">—</strong>
      <span style="color:#9dafc8">Spatial index</span>
      <strong data-lugraph-index style="text-align:right">—</strong>
      <span style="color:#9dafc8">GPU pipeline</span>
      <strong data-lugraph-pipeline style="text-align:right">—</strong>
      <span style="color:#9dafc8">Bounded rounds</span>
      <strong data-lugraph-iterations style="text-align:right">—</strong>
    </div>

    <div data-lugraph-legend aria-label="GPU graph visualization legend"
      style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:11px 0;color:#b9c8df">
      <span style="width:9px;height:9px;border-radius:50%;background:#42c9ff"></span>Community
      <span style="width:9px;height:9px;border-radius:50%;background:#ffb04b"></span>Selected
      <span style="width:9px;height:9px;border-radius:50%;background:#ad7bff"></span>Neighborhood
    </div>

    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button data-lugraph-pause type="button" aria-label="Pause progressive GPU layout">Pause</button>
      <button data-lugraph-reset type="button">Reset layout</button>
      <button data-lugraph-release type="button">Release pins</button>
    </div>
    <p data-lugraph-status role="status" aria-live="polite"
      style="margin:11px 0 3px;color:#b4c5df">Initializing WebGPU graph…</p>
    <p style="margin:4px 0 0;color:#8293ad;font-size:11px">Click a node · drag to pin · scroll to zoom</p>`;
  container.appendChild(panel);

  for (const control of panel.querySelectorAll<HTMLElement>('select, button')) {
    Object.assign(control.style, {
      border: '1px solid rgba(136, 170, 222, 0.26)',
      borderRadius: '7px',
      background: '#121d32',
      color: '#e6efff',
      padding: '5px 7px',
      font: '11px system-ui, sans-serif'
    });
  }

  const size = panel.querySelector<HTMLInputElement>('[data-lugraph-size]');
  const sizeValue = panel.querySelector<HTMLElement>('[data-lugraph-size-value]');
  const decreaseSize = panel.querySelector<HTMLButtonElement>('[data-lugraph-size-decrease]');
  const increaseSize = panel.querySelector<HTMLButtonElement>('[data-lugraph-size-increase]');
  const layout = panel.querySelector<HTMLSelectElement>('[data-lugraph-layout]');
  const color = panel.querySelector<HTMLSelectElement>('[data-lugraph-color]');
  const nodeSize = panel.querySelector<HTMLSelectElement>('[data-lugraph-node-size]');
  const edges = panel.querySelector<HTMLInputElement>('[data-lugraph-edges]');
  const depth = panel.querySelector<HTMLInputElement>('[data-lugraph-depth]');
  const edgeCount = panel.querySelector<HTMLElement>('[data-lugraph-edge-count]');
  const pause = panel.querySelector<HTMLButtonElement>('[data-lugraph-pause]');
  const reset = panel.querySelector<HTMLButtonElement>('[data-lugraph-reset]');
  const release = panel.querySelector<HTMLButtonElement>('[data-lugraph-release]');
  const status = panel.querySelector<HTMLElement>('[data-lugraph-status]');
  const framesPerSecond = panel.querySelector<HTMLElement>('[data-lugraph-fps]');
  const encoding = panel.querySelector<HTMLElement>('[data-lugraph-encode]');
  const memory = panel.querySelector<HTMLElement>('[data-lugraph-memory]');
  const spatialIndex = panel.querySelector<HTMLElement>('[data-lugraph-index]');
  const pipeline = panel.querySelector<HTMLElement>('[data-lugraph-pipeline]');
  const iterations = panel.querySelector<HTMLElement>('[data-lugraph-iterations]');
  const isolatedInteractionEvents = [
    'pointerdown',
    'pointermove',
    'pointerup',
    'mousedown',
    'mouseup',
    'touchstart',
    'touchmove',
    'touchend',
    'keydown',
    'keyup'
  ] as const;
  const stopDeckInteraction = (event: Event): void => {
    event.stopPropagation();
  };
  for (const eventName of isolatedInteractionEvents) {
    panel.addEventListener(eventName, stopDeckInteraction);
  }
  let sizeDebounce: ReturnType<typeof setTimeout> | null = null;
  let pendingVertexCount: number | null = null;
  let activeSizePointer: number | null = null;
  let paused = false;

  const update = (): void => {
    const effect = props.getEffect();
    if (!effect || !status) return;
    const statistics = props.getStats();
    const selected = effect.currentSelection === null ? 'none' : `${effect.currentSelection}`;
    const vertexCount = effect.graph.vertexCount;
    const sizeIndex = GRAPH_EXPLORER_VERTEX_COUNTS.findIndex(count => count === vertexCount);
    const pendingGraph = props.getPendingVertexCount();
    if (size) size.disabled = pendingGraph !== null;
    if (decreaseSize) decreaseSize.disabled = pendingGraph !== null;
    if (increaseSize) increaseSize.disabled = pendingGraph !== null;
    if (pendingVertexCount === null && pendingGraph === null) {
      if (size && sizeIndex >= 0) size.value = `${sizeIndex}`;
      if (sizeValue) sizeValue.textContent = vertexCount.toLocaleString();
    } else if (sizeValue && pendingGraph !== null) {
      sizeValue.textContent = pendingGraph.toLocaleString();
    }
    const exactOption = layout?.querySelector<HTMLOptionElement>('option[value="exact"]');
    if (exactOption) {
      exactOption.disabled = vertexCount > GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT;
    }
    if (edges) edges.checked = props.getEdgesVisible();
    const visibleEdges = props.getEdgesVisible() ? effect.renderedEdgeCount : 0;
    if (edgeCount) {
      edgeCount.textContent = `${visibleEdges.toLocaleString()} / ${effect.graph.edgeCount.toLocaleString()}`;
    }
    const boundedAnalysis =
      effect.activeLayoutMode === 'sampled' &&
      effect.graph.vertexCount >= GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT
        ? ' · bounded analytics; convergence not sampled'
        : '';
    status.textContent =
      props.getLoadingStatus() ??
      `${vertexCount.toLocaleString()} resident vertices · ${visibleEdges.toLocaleString()} / ${effect.graph.edgeCount.toLocaleString()} original edges drawn · ${effect.activeLayoutMode} GPU layout · ${effect.renderMode} · selected ${selected}${boundedAnalysis}`;
    if (framesPerSecond) {
      framesPerSecond.textContent = statistics?.framesPerSecond
        ? `${Math.round(statistics.framesPerSecond)} fps`
        : 'warming up';
    }
    if (encoding) {
      encoding.textContent = statistics
        ? `${statistics.frameEncodeMilliseconds.toFixed(2)} ms`
        : 'pending';
    }
    if (memory) {
      memory.textContent = statistics
        ? formatGraphBytes(statistics.residentBufferBytes + statistics.transientBufferBytes)
        : 'pending';
    }
    if (spatialIndex) {
      spatialIndex.textContent = statistics?.gridCellCount
        ? `${statistics.gridCellCount} cells · ${formatGraphBytes(statistics.spatialIndexBytes)}`
        : effect.activeLayoutMode === 'sampled'
          ? '4 samples / vertex'
          : 'exact';
    }
    if (pipeline) {
      pipeline.textContent = statistics
        ? `${statistics.completedAnalysisStages}/${statistics.totalAnalysisStages} init · ${statistics.frameNodeCount} frame`
        : 'compiling';
    }
    if (iterations) {
      iterations.textContent = statistics
        ? `P${statistics.pageRankIterations} · W${statistics.componentIterations} · L${statistics.communityIterations}`
        : 'pending';
    }
  };

  const getSelectedVertexCount = (): number =>
    GRAPH_EXPLORER_VERTEX_COUNTS[Number(size?.value ?? initialSizeIndex)] ??
    GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT;

  const commitSize = (): void => {
    if (sizeDebounce !== null) {
      clearTimeout(sizeDebounce);
      sizeDebounce = null;
    }
    const vertexCount = pendingVertexCount ?? getSelectedVertexCount();
    pendingVertexCount = null;
    if (props.getEffect()?.graph.vertexCount !== vertexCount) props.resize(vertexCount);
  };

  const previewSize = (): void => {
    pendingVertexCount = getSelectedVertexCount();
    if (sizeValue) sizeValue.textContent = pendingVertexCount.toLocaleString();
    if (sizeDebounce !== null) clearTimeout(sizeDebounce);
    sizeDebounce = setTimeout(commitSize, 140);
  };

  /** Implements native range keyboard semantics before Deck can reinterpret arrows as panning. */
  const stepSize = (step: number): void => {
    if (!size || size.disabled) return;
    const index = Math.max(
      0,
      Math.min(GRAPH_EXPLORER_VERTEX_COUNTS.length - 1, Number(size.value) + step)
    );
    size.value = `${index}`;
    previewSize();
    commitSize();
  };

  const updateSizeFromKeyboard = (event: KeyboardEvent): void => {
    if (!size || size.disabled) return;
    let index = Number(size.value);
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        index++;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        index--;
        break;
      case 'Home':
        index = 0;
        break;
      case 'End':
        index = GRAPH_EXPLORER_VERTEX_COUNTS.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    const bounded = Math.max(0, Math.min(GRAPH_EXPLORER_VERTEX_COUNTS.length - 1, index));
    size.value = `${bounded}`;
    previewSize();
    commitSize();
  };

  /** Maps real pointer coordinates to the same discrete populations used by keyboard controls. */
  const previewSizeFromPointer = (event: PointerEvent): void => {
    if (!size || size.disabled) return;
    const bounds = size.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    size.value = `${Math.round(fraction * (GRAPH_EXPLORER_VERTEX_COUNTS.length - 1))}`;
    previewSize();
    if (sizeDebounce !== null) {
      clearTimeout(sizeDebounce);
      sizeDebounce = null;
    }
  };

  const startSizePointer = (event: PointerEvent): void => {
    if (!size || size.disabled || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    activeSizePointer = event.pointerId;
    size.focus();
    size.setPointerCapture(event.pointerId);
    previewSizeFromPointer(event);
  };

  const moveSizePointer = (event: PointerEvent): void => {
    if (event.pointerId !== activeSizePointer) return;
    event.stopPropagation();
    previewSizeFromPointer(event);
  };

  const finishSizePointer = (event: PointerEvent): void => {
    if (!size || event.pointerId !== activeSizePointer) return;
    event.stopPropagation();
    previewSizeFromPointer(event);
    activeSizePointer = null;
    if (size.hasPointerCapture(event.pointerId)) size.releasePointerCapture(event.pointerId);
    commitSize();
  };

  const decreaseGraphSize = (): void => stepSize(-1);
  const increaseGraphSize = (): void => stepSize(1);

  const updateLayoutMode = (): void => {
    const mode = layout?.value;
    if (mode === 'auto' || mode === 'exact' || mode === 'spatial' || mode === 'sampled') {
      props.setLayoutMode(mode);
    }
  };

  const updateColorMode = (): void => {
    const mode = color?.value;
    if (
      mode === 'community' ||
      mode === 'component' ||
      mode === 'degree' ||
      mode === 'pagerank' ||
      mode === 'distance'
    ) {
      props.setColorMode(mode);
    }
  };

  const updateNodeSizeMode = (): void => {
    const mode = nodeSize?.value;
    if (mode === 'pagerank' || mode === 'degree' || mode === 'uniform') {
      props.setNodeSizeMode(mode);
    }
  };

  const updateEdgeVisibility = (): void => {
    props.setEdgesVisible(edges?.checked ?? true);
  };

  const togglePause = (): void => {
    paused = !paused;
    if (pause) {
      pause.textContent = paused ? 'Resume' : 'Pause';
      pause.setAttribute(
        'aria-label',
        paused ? 'Resume progressive GPU layout' : 'Pause progressive GPU layout'
      );
    }
    props.setPaused(paused);
  };

  const updateDepth = (): void => {
    props.getEffect()?.setNeighborhoodDepth(Number(depth?.value ?? DEFAULT_NEIGHBORHOOD_DEPTH));
    props.redraw('luGraph deck neighborhood depth changed');
  };
  const resetLayout = (): void => {
    props.getEffect()?.requestReset();
    props.redraw('luGraph deck deterministic layout reset');
  };
  const clearPins = (): void => {
    props.getEffect()?.clearPins();
    update();
    props.redraw('luGraph deck pins released');
  };
  size?.addEventListener('input', previewSize);
  size?.addEventListener('change', commitSize);
  size?.addEventListener('keydown', updateSizeFromKeyboard);
  size?.addEventListener('pointerdown', startSizePointer);
  size?.addEventListener('pointermove', moveSizePointer);
  size?.addEventListener('pointerup', finishSizePointer);
  size?.addEventListener('pointercancel', finishSizePointer);
  decreaseSize?.addEventListener('click', decreaseGraphSize);
  increaseSize?.addEventListener('click', increaseGraphSize);
  layout?.addEventListener('change', updateLayoutMode);
  color?.addEventListener('change', updateColorMode);
  nodeSize?.addEventListener('change', updateNodeSizeMode);
  edges?.addEventListener('change', updateEdgeVisibility);
  depth?.addEventListener('input', updateDepth);
  pause?.addEventListener('click', togglePause);
  reset?.addEventListener('click', resetLayout);
  release?.addEventListener('click', clearPins);

  return {
    update,
    destroy: () => {
      if (sizeDebounce !== null) clearTimeout(sizeDebounce);
      for (const eventName of isolatedInteractionEvents) {
        panel.removeEventListener(eventName, stopDeckInteraction);
      }
      size?.removeEventListener('input', previewSize);
      size?.removeEventListener('change', commitSize);
      size?.removeEventListener('keydown', updateSizeFromKeyboard);
      size?.removeEventListener('pointerdown', startSizePointer);
      size?.removeEventListener('pointermove', moveSizePointer);
      size?.removeEventListener('pointerup', finishSizePointer);
      size?.removeEventListener('pointercancel', finishSizePointer);
      decreaseSize?.removeEventListener('click', decreaseGraphSize);
      increaseSize?.removeEventListener('click', increaseGraphSize);
      layout?.removeEventListener('change', updateLayoutMode);
      color?.removeEventListener('change', updateColorMode);
      nodeSize?.removeEventListener('change', updateNodeSizeMode);
      edges?.removeEventListener('change', updateEdgeVisibility);
      depth?.removeEventListener('input', updateDepth);
      pause?.removeEventListener('click', togglePause);
      reset?.removeEventListener('click', resetLayout);
      release?.removeEventListener('click', clearPins);
      panel.remove();
    }
  };
}

/** Formats measured buffer allocation sizes without inventing GPU timing measurements. */
function formatGraphBytes(byteLength: number): string {
  if (byteLength < 1_024) return `${byteLength} B`;
  if (byteLength < 1_048_576) return `${(byteLength / 1_024).toFixed(1)} KB`;
  return `${(byteLength / 1_048_576).toFixed(2)} MB`;
}

function createStandaloneContainer(): HTMLDivElement {
  document.body.style.margin = '0';
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    overflow: 'hidden',
    background: '#070d18'
  });
  document.body.appendChild(container);
  return container;
}
