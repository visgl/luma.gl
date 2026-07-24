// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OrthographicView, type PickingInfo, type ViewStateChangeParameters} from '@deck.gl/core';
import {buildSdfFontAtlas} from '@luma.gl/text';
import {ArrowExamplePanelManager} from '../../arrow/arrow-example-panels';
import {makeHtmlCustomPanel} from '../../example-panels';
import {ArrowDeck} from '../arrow-deck';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {GPUCulledArrowTextLayer} from './gpu-culled-arrow-text-layer';
import {GPUCulledTraceLayer} from './gpu-culled-trace-layer';
import {GPUTraceCullingEffect, type GPUTraceCullingStats} from './gpu-trace-culling-effect';
import {getTraceRow, makeDeckTraceData} from './trace-data';

const TRACE_ROW_COUNT = 25_000;
const TRACE_LANE_WINDOW = 72;
let fontAtlas: ReturnType<typeof buildSdfFontAtlas> | undefined;

type TraceViewState = {
  target: [number, number, number];
  zoom: number;
};

/** Creates the WebGPU-only deck.gl trace viewer. */
export function createGPUCulledTraceDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  const traceData = makeDeckTraceData(TRACE_ROW_COUNT);
  let cullingEffect: GPUTraceCullingEffect | null = null;
  let animationFrame = 0;
  let lastAnimationTime = 0;
  let autoScroll = true;
  let viewState: TraceViewState = {target: [150, TRACE_LANE_WINDOW / 2, 0], zoom: 0};
  let statsElement: HTMLElement | null = null;
  let cullingStats: GPUTraceCullingStats = {
    totalBlocks: traceData.count,
    visibleBlocks: 0,
    outsideBlocks: 0,
    smallBlocks: 0,
    totalGlyphs: 0,
    visibleGlyphs: 0,
    encodeTimeMilliseconds: 0,
    graphNodeCount: 0,
    logicalTransientBytes: 0,
    physicalTransientBytes: 0,
    transientReusePercentage: 0,
    labelStatus: 'Waiting for label layer'
  };
  const panelManager = new ArrowExamplePanelManager({
    descriptionHtml:
      '<p style="margin:0;line-height:1.45">One WebGPU command graph culls trace blocks and row-indexed Arrow glyph records before deck.gl draws both layers indirectly.</p>',
    settingsPanel: () =>
      makeHtmlCustomPanel({
        id: 'gpu-culled-trace-culling',
        title: 'Culling',
        html: '<div data-gpu-trace-culling-stats></div>',
        onRender: root => {
          statsElement = root.querySelector('[data-gpu-trace-culling-stats]');
          renderCullingStats(statsElement, cullingStats);
          return () => {
            statsElement = null;
          };
        }
      })
  });
  panelManager.setTableEntries([
    {id: 'gpu-trace-text', label: 'Trace text', kind: 'source', table: traceData.textTable}
  ]);
  panelManager.mount();

  let deck: ArrowDeck<OrthographicView>;
  deck = new ArrowDeck({
    parent,
    ...getDeckExampleProps({...options, deviceType: 'webgpu'}),
    views: new OrthographicView({id: 'main'}),
    viewState,
    controller: {
      dragPan: true,
      scrollZoom: {smooth: true, speed: 0.02},
      doubleClickZoom: true,
      touchZoom: true
    },
    layers: [],
    effects: [],
    getTooltip: info => getTooltip(traceData, info),
    onViewStateChange: ({viewState: nextViewState}: ViewStateChangeParameters) => {
      viewState = nextViewState as TraceViewState;
      autoScroll = false;
      deck.setProps({viewState});
    },
    onLoad: ({deck: loadedDeck, device}) => {
      if (device.type !== 'webgpu') throw new Error('GPU-culled deck trace requires WebGPU');
      cullingEffect = new GPUTraceCullingEffect(device, traceData, {
        onStats: stats => {
          cullingStats = stats;
          renderCullingStats(statsElement, stats);
        }
      });
      const resources = cullingEffect.resources;
      const textLayer = new GPUCulledArrowTextLayer({
        id: 'gpu-culled-trace-labels',
        data: traceData.textTable,
        pickable: true,
        fontAtlas: getFontAtlas(),
        model: 'storage-row-indexed',
        positions: 'positions',
        texts: 'texts',
        clipRects: 'clipRects',
        angles: null,
        sizes: null,
        pixelOffsets: null,
        textAnchors: null,
        alignmentBaselines: null,
        color: [245, 248, 255, 255],
        size: 24,
        pixelOffset: [2, 0],
        textAnchor: 'start',
        alignmentBaseline: 'center',
        contentAlignHorizontal: 'start',
        contentAlignVertical: 'none',
        contentCutoffPixels: [0, 0],
        onDataError: error => cullingEffect?.setLabelError(error)
      });
      cullingEffect.setTextLayer(textLayer);
      loadedDeck.setProps({
        effects: [cullingEffect],
        layers: [
          new GPUCulledTraceLayer({
            id: 'gpu-culled-trace-blocks',
            data: [],
            pickable: true,
            spans: resources.spans,
            visibleIds: resources.visibleIds,
            viewUniforms: resources.viewUniforms,
            drawCommands: resources.blockDrawCommands
          }),
          textLayer
        ]
      });
    },
    onFinalize: () => {
      cancelAnimationFrame(animationFrame);
      panelManager.finalize();
    }
  });

  const animate = (time: number): void => {
    const labelsArePreparing = cullingEffect && cullingStats.totalGlyphs === 0;
    if (
      cullingEffect &&
      (autoScroll || labelsArePreparing) &&
      time - lastAnimationTime >= 1000 / 30
    ) {
      lastAnimationTime = time;
      if (autoScroll) {
        viewState = {
          ...viewState,
          target: [150 + ((time * 0.025) % 1000), viewState.target[1], 0]
        };
        deck.setProps({viewState});
      }
      deck.redraw('trace animation');
    }
    animationFrame = requestAnimationFrame(animate);
  };
  animationFrame = requestAnimationFrame(animate);
  return deck;
}

function getTooltip(
  data: ReturnType<typeof makeDeckTraceData>,
  info: PickingInfo
): {html: string} | null {
  const row = getTraceRow(data, info.index);
  if (!row) return null;
  return {
    html: `<div><strong>${escapeHtml(row.name)}</strong></div>
      <div>group: ${row.group}</div>
      <div>start: ${row.start.toFixed(3)}</div>
      <div>duration: ${row.duration.toFixed(3)}</div>
      <div>lane: ${row.lane}</div>`
  };
}

function getFontAtlas(): ReturnType<typeof buildSdfFontAtlas> {
  fontAtlas ??= buildSdfFontAtlas({
    characterSet: ' abcdefghijklmnopqrstuvwxyz0123456789-μé',
    fontFamily: 'Monaco, Menlo, monospace',
    fontWeight: '600',
    fontSize: 48,
    buffer: 5,
    radius: 10
  });
  return fontAtlas;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return entities[character]!;
  });
}

function renderCullingStats(element: HTMLElement | null, stats: GPUTraceCullingStats): void {
  if (!element) return;
  const glyphCounts = stats.totalGlyphs
    ? `${formatCount(stats.visibleGlyphs)} / ${formatCount(stats.totalGlyphs)}`
    : escapeHtml(stats.labelStatus);
  element.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:5px 16px;font:12px/1.45 system-ui,sans-serif;font-variant-numeric:tabular-nums">
    <span>Visible blocks</span><strong>${formatCount(stats.visibleBlocks)} / ${formatCount(stats.totalBlocks)}</strong>
    <span>Outside view</span><strong>${formatCount(stats.outsideBlocks)}</strong>
    <span>Too small (&lt;1 px)</span><strong>${formatCount(stats.smallBlocks)}</strong>
    <span>Visible glyphs</span><strong>${glyphCounts}</strong>
    <span>Graph nodes</span><strong>${stats.graphNodeCount}</strong>
    <span>CPU graph encode</span><strong>${stats.encodeTimeMilliseconds.toFixed(2)} ms</strong>
    <span>Logical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)}</strong>
    <span>Physical scratch</span><strong>${formatBytes(stats.physicalTransientBytes)}</strong>
    <span>Transient reuse</span><strong>${stats.transientReusePercentage.toFixed(0)}%</strong>
  </div>`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1}).format(
    value
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 / 1024).toFixed(1)} MiB`;
}
