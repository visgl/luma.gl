// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OrthographicView, type PickingInfo} from '@deck.gl/core';
import {Buffer, type Device} from '@luma.gl/core';
import {
  ShaderAssembler,
  type GLSLShaderAssembler,
  type WGSLShaderAssembler
} from '@luma.gl/shadertools';
import {ArrowDeck} from '../arrow-deck';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import type {GraphExplorerDataset} from '../../experimental/lugraph-explorer/graph-data';
import {LuGraphDeckEffect} from './lugraph-effect';
import {LuGraphEdgeLayer} from './lugraph-edge-layer';
import {LuGraphNodeLayer} from './lugraph-node-layer';

const DEFAULT_NEIGHBORHOOD_DEPTH = 2;

type GraphExplorerControls = {
  update: () => void;
  destroy: () => void;
};

type LuGraphExplorerDeckOptions = DeckExampleDeviceOptions & {
  dataset?: GraphExplorerDataset;
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
  const {dataset, ...deviceOptions} = options;
  const ownsContainer = !parent;
  const container = parent ?? createStandaloneContainer();
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  let effect: LuGraphDeckEffect | null = null;
  let draggedVertex: number | null = null;
  let restoreShaderAssembler: (() => void) | null = null;
  let deck: ArrowDeck<OrthographicView>;
  const controls = createExplorerControls(container, {
    getEffect: () => effect,
    redraw: reason => deck?.redraw(reason)
  });

  deck = new ArrowDeck<OrthographicView>({
    parent: container,
    ...getDeckExampleProps({...deviceOptions, deviceType: 'webgpu'}),
    views: new OrthographicView({id: 'lugraph-orthographic'}),
    initialViewState: {target: [0, 0, 0], zoom: 7.7, minZoom: 5, maxZoom: 11},
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
      effect = new LuGraphDeckEffect(device, dataset);
      const edgeLayers = effect.graph.sourceVertices.data.flatMap((source, chunkIndex) => {
        if (source.length === 0) return [];
        const target = effect!.graph.targetVertices.data[chunkIndex];
        return [
          new LuGraphEdgeLayer({
            id: `lugraph-edges-${chunkIndex}`,
            data: [],
            pickable: false,
            positions: effect!.positions,
            sourceVertices: source.buffer instanceof Buffer ? source.buffer : source.buffer.buffer,
            targetVertices: target.buffer instanceof Buffer ? target.buffer : target.buffer.buffer,
            distances: effect!.distances,
            edgeCount: source.length,
            opacity: 0.85
          })
        ];
      });
      const nodeLayer = new LuGraphNodeLayer({
        id: 'lugraph-nodes',
        data: [],
        pickable: true,
        autoHighlight: true,
        positions: effect.positions,
        importance: effect.importance,
        components: effect.componentLabels,
        distances: effect.distances,
        selectionMask: effect.selectionMask,
        vertexCount: effect.graph.vertexCount,
        opacity: 1
      });
      loadedDeck.setProps({effects: [effect], layers: [...edgeLayers, nodeLayer]});
      controls.update();
      loadedDeck.redraw('luGraph deck analytics initialized');
    },
    onFinalize: () => {
      restoreShaderAssembler?.();
      restoreShaderAssembler = null;
      draggedVertex = null;
      controls.destroy();
      if (ownsContainer) container.remove();
    }
  });

  return deck;
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
  return `Vertex ${info.index} · ${state}\nGPU PageRank sizing · component color`;
}

/** Provides explicit selection/reset controls without polling or transferring graph metrics. */
function createExplorerControls(
  container: HTMLDivElement,
  props: {getEffect: () => LuGraphDeckEffect | null; redraw: (reason: string) => void}
): GraphExplorerControls {
  const panel = document.createElement('section');
  Object.assign(panel.style, {
    position: 'absolute',
    left: '14px',
    top: '14px',
    zIndex: '2',
    width: '250px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: 'rgba(9, 15, 28, 0.86)',
    border: '1px solid rgba(127, 173, 230, 0.2)',
    color: '#eaf3ff',
    font: '12px/1.5 system-ui, sans-serif'
  });
  panel.innerHTML = `
    <strong style="display:block;font-size:14px">luGraph + deck.gl</strong>
    <p style="margin:6px 0 9px;opacity:.8">Resident graph analytics, source-chunk edge layers,
      direct instance vertices, and real asynchronous deck.gl picking.</p>
    <label style="display:block;margin-bottom:8px">Neighborhood depth
      <input data-lugraph-depth type="range" min="0" max="8"
        value="${DEFAULT_NEIGHBORHOOD_DEPTH}" style="display:block;width:100%" />
    </label>
    <div style="display:flex;gap:8px">
      <button data-lugraph-reset type="button">Reset layout</button>
      <button data-lugraph-release type="button">Release pins</button>
    </div>
    <p data-lugraph-status style="margin:9px 0 0;opacity:.85">Initializing WebGPU graph…</p>
    <p style="margin:6px 0 0;opacity:.64">Click to inspect · drag to pin · scroll to zoom</p>`;
  container.appendChild(panel);

  const depth = panel.querySelector<HTMLInputElement>('[data-lugraph-depth]');
  const reset = panel.querySelector<HTMLButtonElement>('[data-lugraph-reset]');
  const release = panel.querySelector<HTMLButtonElement>('[data-lugraph-release]');
  const status = panel.querySelector<HTMLElement>('[data-lugraph-status]');
  const update = (): void => {
    const effect = props.getEffect();
    if (!effect || !status) return;
    const selected = effect.currentSelection === null ? 'none' : `${effect.currentSelection}`;
    status.textContent = `${effect.graph.vertexCount} vertices · ${effect.graph.edgeCount} chunked edges · selected ${selected}`;
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
  depth?.addEventListener('input', updateDepth);
  reset?.addEventListener('click', resetLayout);
  release?.addEventListener('click', clearPins);

  return {
    update,
    destroy: () => {
      depth?.removeEventListener('input', updateDepth);
      reset?.removeEventListener('click', resetLayout);
      release?.removeEventListener('click', clearPins);
      panel.remove();
    }
  };
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
