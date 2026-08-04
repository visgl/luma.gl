// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device, type RenderBundle} from '@luma.gl/core';
import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, ShaderPassRenderer} from '@luma.gl/engine';
import {
  decodeGPUIndexPickInfo,
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUCommandGraphInspector,
  GPUIndexPickingTarget,
  GPUReadbackRing,
  INDEX_PICKING_READBACK_BYTE_LENGTH,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GPUReadbackTicket
} from '@luma.gl/experimental';
import {
  GPUGridIndex,
  GPUPointSpatialQuery,
  type GPUGridIndexBounds,
  type GPUGridIndexSize,
  type GPUPointSpatialQueryKind
} from '@luma.gl/experimental/geospatial';
import type {Panel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {CompactDropdown} from '../../compact-dropdown';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {
  DEFAULT_RESIDENT_POINT_COUNT,
  MAXIMUM_TAXI_ZONE_POSITION_COUNT,
  MAXIMUM_TAXI_ZONE_RING_OFFSET_COUNT,
  NYC_LIDAR_POINT_COUNT,
  NYC_TAXI_SAMPLE_URL,
  NYC_TAXI_ZONES_URL,
  PAUL_TAYLOR_POINT_COUNT,
  formatCount,
  getSupportedResidentPointCounts,
  makeSyntheticTaxiPositions,
  makeTaxiZones
} from './spatial-atlas-data';
import type {NYCEPTTileSource} from './ept-source';
import {
  SPATIAL_ATLAS_CONTEXT_SHADER,
  SPATIAL_ATLAS_PICKING_SHADER,
  SPATIAL_ATLAS_RENDER_SHADER
} from './spatial-atlas-shaders';

export const title = 'Billion-Point Spatial Atlas';
export const description =
  'Indexed WebGPU spatial queries over a 169M-row taxi atlas and the 4.8B-point NYC USGS LiDAR corpus.';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const UNIFORM_BYTE_LENGTH = 96;
const TAXI_DOMAIN = [-1.25, -1.25, 1.25, 1.25] as const;
const LIDAR_DOMAIN = [-1.25, -1.25, -0.25, 1.25, 1.25, 2.5] as const;
const TAXI_GRID_SIZE = [128, 128] as const;
const LIDAR_GRID_SIZE = [64, 64, 16] as const;
const ATLAS_GENERATION_CHUNK_SIZE = 20_000;
const VISUAL_SMOKE_POINT_COUNT = 100_000;
const MINIMUM_VIEW_SCALE = 0.35;
const MAXIMUM_VIEW_SCALE = 32;
const WHEEL_ZOOM_RATE = 0.0016;
const BUTTON_ZOOM_FACTOR = 1.5;
const ATLAS_GRAPH_LABELS: Readonly<Record<string, string>> = {
  'spatial-atlas-index-build-graph': 'Index build',
  'spatial-atlas-bounds-index-graph': 'Bounds · grid index',
  'spatial-atlas-bounds-scan-graph': 'Bounds · full scan',
  'spatial-atlas-radius-index-graph': 'Radius · grid index',
  'spatial-atlas-radius-scan-graph': 'Radius · full scan',
  'spatial-atlas-polygon-index-graph': 'Polygon · grid index',
  'spatial-atlas-polygon-scan-graph': 'Polygon · full scan',
  'spatial-atlas-display-graph': 'Cached-result rendering',
  'spatial-atlas-picking-graph': 'Point picking'
};

const ATLAS_PANEL_CSS = /* css */ `
  [data-spatial-atlas-panel] {
    display: grid;
    gap: 8px;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid rgb(126 157 205 / 28%);
    border-radius: 8px;
    background: rgb(8 12 20 / 94%);
    box-shadow: 0 14px 36px rgb(0 0 0 / 30%);
    color: #edf3fc;
    color-scheme: dark;
    font: 11px/1.35 system-ui, sans-serif;
    backdrop-filter: blur(12px);
  }
  [data-spatial-atlas-panel] * { box-sizing: border-box; }
  [data-spatial-atlas-panel] a { color: #81c9ff; }
  [data-spatial-atlas-panel] [data-atlas-tier] {
    color: #c7d5e9;
    font-size: 10px;
  }
  [data-spatial-atlas-panel] [data-atlas-tier] strong { color: #f4f8ff; }
  [data-spatial-atlas-panel] details {
    border-top: 1px solid rgb(137 166 211 / 17%);
  }
  [data-spatial-atlas-panel] summary {
    padding: 7px 0 0;
    color: #8faed9;
    cursor: pointer;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  [data-spatial-atlas-panel] summary::marker { color: #7295c4; }
  [data-spatial-atlas-panel] .spatial-atlas-section { padding-top: 7px; }
  [data-spatial-atlas-panel] .spatial-atlas-controls,
  [data-spatial-atlas-panel] details > .spatial-atlas-section > div {
    display: grid;
    gap: 5px;
  }
  [data-spatial-atlas-panel] .spatial-atlas-control,
  [data-spatial-atlas-panel] details label:not(:has(input[type='checkbox'])) {
    display: grid;
    grid-template-columns: minmax(82px, .62fr) minmax(120px, 1fr);
    align-items: center;
    gap: 8px;
    min-height: 22px;
    margin: 0;
    color: #aebdd2;
  }
  [data-spatial-atlas-panel] details label:has(input[type='checkbox']) {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    color: #d6e1f0;
    font-size: 10px;
  }
  [data-spatial-atlas-panel] .spatial-atlas-control-name {
    overflow: hidden;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-spatial-atlas-panel] select,
  [data-spatial-atlas-panel] button {
    min-width: 0;
    border: 1px solid rgb(140 169 211 / 28%);
    border-radius: 5px;
    background: rgb(30 41 58 / 72%);
    color: #e5eefb;
    font: 600 10px/1.2 system-ui, sans-serif;
  }
  [data-spatial-atlas-panel] select {
    width: 100%;
    height: 20px;
    min-height: 20px;
    padding: 1px 20px 1px 8px;
    appearance: none;
    border-color: rgb(127 164 203 / 18%);
    border-bottom-color: rgb(95 180 220 / 30%);
    border-left-color: rgb(54 213 255 / 64%);
    border-radius: 1px;
    background-color: rgb(7 15 25 / 92%);
    background-image:
      linear-gradient(45deg, transparent 48%, #62dfff 50%),
      linear-gradient(135deg, #62dfff 50%, transparent 52%),
      linear-gradient(rgb(84 188 226 / 24%), rgb(84 188 226 / 24%));
    background-position:
      calc(100% - 8px) 8px,
      calc(100% - 5px) 8px,
      calc(100% - 15px) 50%;
    background-repeat: no-repeat;
    background-size: 3px 3px, 3px 3px, 1px 10px;
    box-shadow: inset 2px 0 rgb(54 213 255 / 10%), inset 0 -1px rgb(54 213 255 / 5%);
    clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
    color: #cde3f4;
    cursor: pointer;
    font: 650 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .045em;
    text-transform: uppercase;
    transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
  }
  [data-spatial-atlas-panel] button {
    min-height: 26px;
    padding: 4px 8px;
    cursor: pointer;
  }
  [data-spatial-atlas-panel] button:hover {
    border-color: rgb(133 194 255 / 55%);
    background-color: rgb(39 57 82 / 82%);
  }
  [data-spatial-atlas-panel] select:hover {
    border-color: rgb(82 209 247 / 52%);
    border-left-color: #45ddff;
    background-color: rgb(10 28 41 / 96%);
    color: #effcff;
  }
  [data-spatial-atlas-panel] select option { background: #0d1521; color: #e5eefb; }
  [data-spatial-atlas-panel] button:focus-visible,
  [data-spatial-atlas-panel] select:focus-visible,
  [data-spatial-atlas-panel] input:focus-visible {
    outline: 2px solid rgb(91 189 255 / 72%);
    outline-offset: 1px;
  }
  [data-spatial-atlas-panel] input[type='range'] {
    width: 100%;
    min-width: 0;
    margin: 0;
    accent-color: #69c8ff;
  }
  [data-spatial-atlas-panel] .spatial-atlas-toggle {
    grid-template-columns: 82px minmax(0, 1fr);
  }
  [data-spatial-atlas-panel] .spatial-atlas-toggle span:last-child {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #d6e1f0;
  }
  [data-spatial-atlas-panel] .spatial-atlas-action-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    margin-top: 2px;
  }
  [data-spatial-atlas-panel] .spatial-atlas-action-row > :only-child {
    grid-column: 1 / -1;
  }
  [data-spatial-atlas-panel] .spatial-atlas-note {
    margin: 2px 0 0;
    color: #91a2ba;
    font-size: 9px;
    line-height: 1.42;
  }
  [data-spatial-atlas-panel] details small {
    color: #91a2ba;
    font-size: 9px;
    line-height: 1.42;
  }
  [data-spatial-atlas-panel] [data-atlas-status]:empty { display: none; }
  [data-spatial-atlas-panel] [data-atlas-status] {
    padding: 6px 7px;
    border: 1px solid rgb(255 194 104 / 20%);
    border-radius: 5px;
    background: rgb(137 84 24 / 13%);
    color: #ffd18a;
    font-size: 9px;
    line-height: 1.35;
  }
  [data-spatial-atlas-panel] .spatial-atlas-footer {
    color: #71839e;
    font-size: 8px;
    letter-spacing: .02em;
  }
  @media (max-width: 390px) {
    [data-spatial-atlas-panel] .spatial-atlas-control {
      grid-template-columns: 72px minmax(0, 1fr);
    }
  }
`;

type AtlasMode = 'taxi' | 'lidar';
type AtlasInteractionMode = 'navigate' | 'query';
type AtlasPointerAction = 'pan' | 'orbit' | 'query' | null;
type QueryExecution = 'index' | 'scan';
type LidarColorMode = 'height' | 'classification' | 'intensity';
type SceneColorFormat = 'rgba8unorm' | 'rgba16float';
type QueryGraphKey = `${GPUPointSpatialQueryKind}-${QueryExecution}`;

type AtlasGraphParameters = {
  viewport: [number, number, number, number];
};

type PickingGraphParameters = AtlasGraphParameters & {
  pixel: readonly [number, number];
};

type SpatialAtlasBenchmarkResult = {
  tier: string;
  statistics: string;
  timings: string;
  counterReadbackCompleted: boolean;
};

type AtlasResources = {
  mode: AtlasMode;
  pointCount: number;
  dimension: 2 | 3;
  domain: GPUGridIndexBounds;
  gridSize: GPUGridIndexSize;
  renderPositions: Buffer;
  ownsRenderPositions: boolean;
  pointAttributes: Buffer;
  ownsPointAttributes: boolean;
  queryPositions: Buffer;
  visibleIds: Buffer;
  queryValues: Buffer;
  polygonPositions: Buffer;
  polygonRingOffsets: Buffer;
  cellOffsets: Buffer;
  indexRowIndices: Buffer;
  indexCount: Buffer;
  indexOverflow: Buffer;
  queryTotalCount: Buffer;
  queryOverflow: Buffer;
  drawCommands: DrawCommandBuffer;
  sceneColor: Texture;
  renderBundle: RenderBundle;
  buildGraph: CompiledGPUCommandGraph<void>;
  renderGraph: CompiledGPUCommandGraph<AtlasGraphParameters>;
  queryGraphs: Map<QueryGraphKey, CompiledGPUCommandGraph<AtlasGraphParameters>>;
  pickingGraph: CompiledGPUCommandGraph<PickingGraphParameters>;
  pickingReadbackIdentifier: string;
  width: number;
  height: number;
  cpuCellCounts: Uint32Array;
};

export default class BillionPointSpatialAtlasAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true, debugGPUTime: true};

  readonly device: Device;
  readonly sceneColorFormat: SceneColorFormat;
  readonly contextModel: Model;
  readonly model: Model;
  readonly pickingModel: Model;
  readonly uniformBuffer: Buffer;
  readonly postprocessingRenderer: ShaderPassRenderer;
  readonly pickingReadbackRing: GPUReadbackRing;
  readonly panels: ExamplePanelManager;
  readonly graphInspector = new GPUCommandGraphInspector({
    maxSamples: 180,
    getNodeGroup: ({graphId, id}) => getGraphNodeGroup(graphId, id)
  });

  private resources: AtlasResources | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasContainer: HTMLElement | null = null;
  private canvasContainerPosition = '';
  private navigationOverlay: HTMLDivElement | null = null;
  private hoverTooltip: HTMLDivElement | null = null;
  private queryFootprint: SVGSVGElement | null = null;
  private queryFootprintPath: SVGPathElement | null = null;
  private queryFootprintLabel: SVGTextElement | null = null;
  private mode: AtlasMode = 'taxi';
  private interactionMode: AtlasInteractionMode = 'navigate';
  private queryKind: GPUPointSpatialQueryKind = 'polygon';
  private queryExecution: QueryExecution = 'index';
  private lidarColorMode: LidarColorMode = 'height';
  private capacity = getInitialResidentPointCount();
  private queryCenter: [number, number] = [0, 0];
  private queryRadius = 0.4;
  private selectedZoneId = 230;
  private viewCenter: [number, number] = [0.12, -0.04];
  private viewScale = 1.25;
  private yaw = -0.28;
  private pitch = 0.6;
  private cinematicFlyThrough = true;
  private pointSize = 0.9;
  private pickedObjectIndex: number | null = null;
  private pointerDirty = false;
  private pointerAction: AtlasPointerAction = null;
  private lastPointer: [number, number] = [0, 0];
  private hoverPointer: [number, number] = [0, 0];
  private hoverGeneration = 0;
  private frameIndex = 0;
  private sampledMatchCount = 0;
  private sampledTotalMatchCount = 0;
  private sampledOverflow = false;
  private countReadPending = false;
  private downloadedTileCount = 0;
  private decodedPointCount = 0;
  private lidarLoadAbortController: AbortController | null = null;
  private lidarTileCache: GPULidarTileCache | null = null;
  private lidarTileSource: NYCEPTTileSource | null = null;
  private lidarLoading = false;
  private lidarRefreshPending = false;
  private lastLidarRefreshCenter: [number, number] | null = null;
  private lastLidarRefreshTime = 0;
  private lidarPublishTimer: ReturnType<typeof setTimeout> | null = null;
  private dataGenerationAbortController: AbortController | null = null;
  private loadingOverlay: HTMLDivElement | null = null;
  private lastQuerySignature: string | null = null;
  private finalized = false;
  private lastLidarPublishTime = 0;
  private readonly benchmarkSampleMilliseconds = getBenchmarkSampleMilliseconds();
  private benchmarkSampleStartTime: number | null = null;
  private benchmarkSampleStartFrame = 0;
  private benchmarkFinishing = false;
  private currentPositions: Float32Array;
  private candidateCount = 0;
  private tierElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private graphInspectorElement: HTMLElement | null = null;
  private graphInspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  private readonly compactDropdowns = new Map<HTMLSelectElement, CompactDropdown>();
  private navigationDropdownCleanup: (() => void) | null = null;
  private statusElement: HTMLElement | null = null;
  private loadLidarButtonElement: HTMLButtonElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Billion-Point Spatial Atlas requires WebGPU');
    }
    this.device = device;
    this.sceneColorFormat = getSceneColorFormat(device);
    const initialZone = makeTaxiZones().find(zone => zone.id === this.selectedZoneId);
    if (initialZone) {
      this.queryCenter = getBoundsCenter(initialZone.bounds);
    }
    this.currentPositions = new Float32Array(0);
    this.uniformBuffer = device.createBuffer({
      id: 'spatial-atlas-uniforms',
      byteLength: UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.contextModel = this.createModel('context');
    this.model = this.createModel('selection');
    this.pickingModel = this.createModel('picking');
    this.postprocessingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createBloomShaderPassPipeline({colorFormat: this.sceneColorFormat}),
        toneMapping
      ],
      colorFormat: this.sceneColorFormat
    });
    this.pickingReadbackRing = new GPUReadbackRing(device, {
      id: 'spatial-atlas-picking-readback',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      slotCount: 2
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    this.setStatus(`Preparing ${formatCount(this.capacity)} GPU-resident points…`);
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.style.cursor = 'crosshair';
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute(
        'aria-label',
        'Interactive WebGPU map of selected New York City taxi or LiDAR points'
      );
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerleave', this.handlePointerLeave);
      canvas.addEventListener('pointerup', this.handlePointerUp);
      canvas.addEventListener('pointercancel', this.handlePointerUp);
      canvas.addEventListener('wheel', this.handleWheel, {passive: false});
      canvas.addEventListener('dblclick', this.handleDoubleClick);
      canvas.addEventListener('keydown', this.handleKeyDown);
      this.mountNavigationOverlay(canvas);
      this.updateInteractionPresentation();
    }

    await this.loadSyntheticDataset(this.mode, this.capacity);
  }

  override onRender({
    animationLoop,
    device,
    time,
    width,
    height,
    _mousePosition
  }: AnimationProps): void {
    let resources = this.resources;
    if (!resources) return;
    // Stop adding work while the benchmark drains the queue and reads its final counters.
    if (this.benchmarkFinishing) return;
    const deviceSize = device.getDefaultCanvasContext().getDevicePixelSize();
    if (resources.width !== deviceSize[0] || resources.height !== deviceSize[1]) {
      this.resizeResources(resources, Math.max(1, deviceSize[0]), Math.max(1, deviceSize[1]));
    }

    if (this.mode === 'lidar' && this.cinematicFlyThrough && !this.pointerAction) {
      this.invalidateHover();
      this.yaw = -0.45 + time * 0.000075;
      this.pitch = 0.52 + Math.sin(time * 0.00016) * 0.18;
      this.queryCenter = [Math.sin(time * 0.00009) * 0.38, Math.cos(time * 0.00007) * 0.24];
    }
    this.maybeRefreshLidarTiles();
    this.writeUniforms(width, height, time);
    this.updateQueryFootprint();
    const querySignature = [
      this.queryKind,
      this.queryExecution,
      this.selectedZoneId,
      this.queryCenter[0],
      this.queryCenter[1],
      this.queryRadius
    ].join(':');
    const queryChanged =
      this.benchmarkSampleMilliseconds !== null || querySignature !== this.lastQuerySignature;
    if (queryChanged) {
      this.writeQuery(resources);
      this.lastQuerySignature = querySignature;
    }
    const graph = queryChanged ? this.getQueryGraph(resources) : resources.renderGraph;
    const encoding = graph.encode(device.commandEncoder, {
      parameters: {viewport: [0, 0, width, height]}
    });
    if (this.frameIndex >= 30) this.graphInspector.recordEncoding(graph.id, encoding);
    if (
      this.benchmarkSampleMilliseconds === null &&
      this.frameIndex >= 30 &&
      this.frameIndex % 60 === 0
    ) {
      void this.sampleCounts(resources);
      if (encoding.canReadGPUTimings) {
        setTimeout(() => void this.recordGPUTimings(graph.id, encoding), 0);
      }
    }
    this.postprocessingRenderer.encodeToScreen(device.commandEncoder, {
      sourceTexture: resources.sceneColor,
      uniforms: {
        bloomExtract: {threshold: this.sceneColorFormat === 'rgba16float' ? 1.15 : 0.82},
        bloomBlur: {radius: 3},
        bloomComposite: {intensity: 0.18},
        toneMapping: {
          exposure: this.sceneColorFormat === 'rgba16float' ? 0.96 : 1,
          maximumLuminance: device.preferredColorFormat === 'rgba16float' ? 1.8 : 1
        }
      }
    });

    if (_mousePosition && this.pointerDirty && !this.pointerAction && this.frameIndex % 4 === 0) {
      const ticket = this.pickingReadbackRing.tryAcquire();
      if (ticket) {
        const hoverGeneration = this.hoverGeneration;
        const pixel = this.getPickingPixel(_mousePosition as [number, number], resources);
        const pickingEncoding = resources.pickingGraph.encode(device.commandEncoder, {
          parameters: {viewport: [0, 0, width, height], pixel},
          buffers: {[resources.pickingReadbackIdentifier]: ticket.buffer}
        });
        this.graphInspector.recordEncoding(resources.pickingGraph.id, pickingEncoding);
        ticket.markEncoded({byteLength: 8});
        this.pointerDirty = false;
        queueMicrotask(() => void this.readPickingResult(ticket, hoverGeneration));
      }
    }

    this.frameIndex++;
    if (this.frameIndex % 10 === 0) {
      this.updateInspector(animationLoop.frameRate.getSampleHz());
    }
    this.maybeFinishBenchmark(animationLoop);
  }

  override onFinalize(): void {
    this.finalized = true;
    this.dataGenerationAbortController?.abort();
    this.loadingOverlay?.remove();
    this.loadingOverlay = null;
    this.lidarLoadAbortController?.abort();
    if (this.lidarPublishTimer) clearTimeout(this.lidarPublishTimer);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      this.canvas.removeEventListener('wheel', this.handleWheel);
      this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
      this.canvas.removeEventListener('keydown', this.handleKeyDown);
    }
    this.unmountNavigationOverlay();
    this.panels.finalize();
    this.destroyResources();
    this.lidarTileCache?.destroy();
    this.lidarTileCache = null;
    this.lidarTileSource = null;
    this.pickingReadbackRing.destroy();
    this.postprocessingRenderer.destroy();
    this.pickingModel.destroy();
    this.model.destroy();
    this.contextModel.destroy();
    this.uniformBuffer.destroy();
  }

  /** Builds large deterministic fixtures between browser tasks so navigation stays responsive. */
  private async loadSyntheticDataset(mode: AtlasMode, pointCount: number): Promise<void> {
    this.dataGenerationAbortController?.abort();
    const generationController = new AbortController();
    this.dataGenerationAbortController = generationController;
    this.mountLoadingOverlay(mode, pointCount);
    this.setStatus(
      `Preparing ${formatCount(pointCount)} GPU-resident points without blocking navigation…`
    );

    try {
      const positions = new Float32Array(pointCount * 3);

      for (let firstPointIndex = 0; firstPointIndex < pointCount; ) {
        await yieldAtlasGeneration(generationController.signal);
        generationController.signal.throwIfAborted();

        const chunkPointCount = Math.min(ATLAS_GENERATION_CHUNK_SIZE, pointCount - firstPointIndex);
        const chunk =
          mode === 'taxi'
            ? makeSyntheticTaxiPositions(chunkPointCount, firstPointIndex)
            : makeSyntheticLidarPositions(chunkPointCount, firstPointIndex);
        positions.set(chunk, firstPointIndex * 3);
        firstPointIndex += chunkPointCount;
        this.updateLoadingOverlay(firstPointIndex, pointCount);
      }

      generationController.signal.throwIfAborted();
      if (this.finalized || this.mode !== mode || this.capacity !== pointCount) return;

      this.currentPositions = positions;
      this.decodedPointCount = mode === 'taxi' ? pointCount : 0;
      this.setStatus('Building the resident GPU spatial index…');
      this.updateLoadingOverlay(pointCount, pointCount, 'Building the GPU spatial index…');
      await yieldAtlasGeneration(generationController.signal);
      generationController.signal.throwIfAborted();
      if (this.finalized || this.mode !== mode || this.capacity !== pointCount) return;

      this.rebuildResources(positions);
      this.setStatus('');
      this.updateInteractionPresentation();
    } catch (error) {
      if (!generationController.signal.aborted && !this.finalized) {
        this.setStatus(
          `GPU data initialization failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } finally {
      if (this.dataGenerationAbortController === generationController) {
        this.dataGenerationAbortController = null;
        this.loadingOverlay?.remove();
        this.loadingOverlay = null;
      }
    }
  }

  private mountLoadingOverlay(mode: AtlasMode, pointCount: number): void {
    this.loadingOverlay?.remove();
    const container = this.canvasContainer;
    if (!container) return;

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.dataset.atlasLoading = '';
    overlay.style.cssText =
      'position:absolute;inset:0;z-index:2;display:grid;place-items:center;padding:24px;pointer-events:none;background:radial-gradient(ellipse at center,rgba(6,12,22,.91),rgba(4,8,14,.46));';
    overlay.innerHTML = `<div style="width:min(340px,100%);padding:20px 22px;border:1px solid rgba(126,157,205,.3);border-radius:12px;background:rgba(8,12,20,.94);box-shadow:0 16px 48px rgba(0,0,0,.35);color:#edf3fc;font:12px/1.5 system-ui,sans-serif">
      <div style="color:#87bfff;font:700 10px ui-monospace,monospace;letter-spacing:.1em">GPU SPATIAL ATLAS</div>
      <div data-atlas-loading-message style="margin-top:8px;font-size:14px;font-weight:650">Preparing ${mode === 'taxi' ? 'NYC taxi' : 'NYC LiDAR'} points…</div>
      <div data-atlas-loading-progress role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="height:5px;margin-top:13px;overflow:hidden;border-radius:999px;background:rgba(119,145,176,.24)">
        <div data-atlas-loading-bar style="width:0%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#68a4f4,#76d7ff);transition:width 120ms linear"></div>
      </div>
      <div data-atlas-loading-count style="margin-top:8px;color:#aec1d8;font:10px ui-monospace,monospace">0 / ${formatCount(pointCount)} points</div>
      <div style="margin-top:8px;color:#8293ab;font-size:10px">Generated locally in responsive, cancellable batches.</div>
    </div>`;
    container.appendChild(overlay);
    this.loadingOverlay = overlay;
  }

  private updateLoadingOverlay(
    processedPointCount: number,
    totalPointCount: number,
    message?: string
  ): void {
    const overlay = this.loadingOverlay;
    if (!overlay) return;
    const progress = Math.round((processedPointCount / Math.max(1, totalPointCount)) * 100);
    const progressElement = overlay.querySelector<HTMLElement>('[data-atlas-loading-progress]');
    const progressBar = overlay.querySelector<HTMLElement>('[data-atlas-loading-bar]');
    const countElement = overlay.querySelector<HTMLElement>('[data-atlas-loading-count]');
    const messageElement = overlay.querySelector<HTMLElement>('[data-atlas-loading-message]');
    progressElement?.setAttribute('aria-valuenow', String(progress));
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (countElement) {
      countElement.textContent = `${formatCount(processedPointCount)} / ${formatCount(totalPointCount)} points`;
    }
    if (message && messageElement) messageElement.textContent = message;
  }

  private createModel(kind: 'context' | 'selection' | 'picking'): Model {
    const picking = kind === 'picking';
    return new Model(this.device, {
      id: `spatial-atlas-${kind}-model`,
      source: picking
        ? SPATIAL_ATLAS_PICKING_SHADER
        : kind === 'context'
          ? SPATIAL_ATLAS_CONTEXT_SHADER
          : SPATIAL_ATLAS_RENDER_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      colorAttachmentFormats: picking ? ['rgba8unorm', 'rg32sint'] : [this.sceneColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'pointPositions', type: 'read-only-storage', group: 0, location: 0},
          {name: 'visibleIds', type: 'read-only-storage', group: 0, location: 1},
          {name: 'pointAttributes', type: 'read-only-storage', group: 0, location: 2},
          {name: 'uniforms', type: 'uniform', group: 0, location: 3}
        ]
      },
      parameters: picking
        ? {blend: false, depthCompare: 'less-equal', depthWriteEnabled: true}
        : {
            blend: true,
            blendColorOperation: 'add',
            blendAlphaOperation: 'add',
            blendColorSrcFactor: 'src-alpha',
            blendColorDstFactor: 'one-minus-src-alpha',
            blendAlphaSrcFactor: 'one',
            blendAlphaDstFactor: 'one-minus-src-alpha',
            depthCompare: 'less-equal',
            depthWriteEnabled: false
          }
    });
  }

  private rebuildResources(
    renderPositions: Float32Array,
    borrowedRenderPositionsBuffer?: Buffer,
    pointAttributeValues?: Uint32Array,
    borrowedPointAttributesBuffer?: Buffer
  ): void {
    this.destroyResources();
    this.graphInspector.clear();
    this.hoverGeneration++;
    this.pointerDirty = false;
    this.frameIndex = 0;
    this.lastQuerySignature = null;
    this.currentPositions = renderPositions;
    const pointCount = Math.floor(renderPositions.length / 3);
    const dimension: 2 | 3 = this.mode === 'taxi' ? 2 : 3;
    const queryPositionValues = makeQueryPositions(renderPositions, dimension);
    const domain = this.mode === 'taxi' ? TAXI_DOMAIN : LIDAR_DOMAIN;
    const gridSize = this.mode === 'taxi' ? TAXI_GRID_SIZE : LIDAR_GRID_SIZE;
    const cellCount = gridSize.reduce((product, value) => product * value, 1);
    const renderPositionsBuffer =
      borrowedRenderPositionsBuffer ??
      this.device.createBuffer({
        id: 'spatial-atlas-render-positions',
        data: renderPositions,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
    const queryPositionsBuffer = this.device.createBuffer({
      id: 'spatial-atlas-query-positions',
      data: queryPositionValues,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const pointAttributes =
      borrowedPointAttributesBuffer ??
      this.device.createBuffer({
        id: 'spatial-atlas-point-attributes',
        data: pointAttributeValues ?? makePointAttributes(pointCount, this.mode),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
    const visibleIds = this.device.createBuffer({
      id: 'spatial-atlas-visible-ids',
      byteLength: Math.max(UINT32_BYTE_LENGTH, pointCount * UINT32_BYTE_LENGTH),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const queryValues = this.device.createBuffer({
      id: 'spatial-atlas-query-values',
      byteLength: 6 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const polygonPositions = this.device.createBuffer({
      id: 'spatial-atlas-query-polygon',
      byteLength: MAXIMUM_TAXI_ZONE_POSITION_COUNT * 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const polygonRingOffsets = this.device.createBuffer({
      id: 'spatial-atlas-query-ring-offsets',
      byteLength: MAXIMUM_TAXI_ZONE_RING_OFFSET_COUNT * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const cellOffsets = this.device.createBuffer({
      id: 'spatial-atlas-cell-offsets',
      byteLength: (cellCount + 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const indexRowIndices = this.device.createBuffer({
      id: 'spatial-atlas-index-row-indices',
      byteLength: Math.max(UINT32_BYTE_LENGTH, pointCount * UINT32_BYTE_LENGTH),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const indexCount = this.device.createBuffer({
      id: 'spatial-atlas-index-count',
      byteLength: UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const indexOverflow = this.device.createBuffer({
      id: 'spatial-atlas-index-overflow',
      byteLength: UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const queryTotalCount = this.device.createBuffer({
      id: 'spatial-atlas-query-total-count',
      byteLength: UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const queryOverflow = this.device.createBuffer({
      id: 'spatial-atlas-query-overflow',
      byteLength: UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'spatial-atlas-draw-command',
      type: 'draw',
      commands: [{vertexCount: 6, instanceCount: 0}]
    });
    const deviceSize = this.device.getDefaultCanvasContext().getDevicePixelSize();
    const width = Math.max(1, deviceSize[0]);
    const height = Math.max(1, deviceSize[1]);
    const sceneColor = this.createSceneColorTexture(width, height);
    this.postprocessingRenderer.resize([width, height]);
    const renderBundle = this.createRenderBundle(
      renderPositionsBuffer,
      pointAttributes,
      visibleIds,
      drawCommands,
      this.uniformBuffer,
      pointCount
    );
    const shared = {
      pointCount,
      dimension,
      domain,
      gridSize,
      renderPositions: renderPositionsBuffer,
      ownsRenderPositions: !borrowedRenderPositionsBuffer,
      pointAttributes,
      ownsPointAttributes: !borrowedPointAttributesBuffer,
      queryPositions: queryPositionsBuffer,
      visibleIds,
      queryValues,
      polygonPositions,
      polygonRingOffsets,
      cellOffsets,
      indexRowIndices,
      indexCount,
      indexOverflow,
      queryTotalCount,
      queryOverflow,
      drawCommands,
      sceneColor,
      renderBundle
    };
    const buildGraph = this.createBuildGraph(shared);
    const renderGraph = this.createRenderGraph(shared);
    const queryGraphs = this.createQueryGraphs(shared);
    const picking = this.createPickingGraph(shared, width, height);
    this.graphInspector.registerGraph(buildGraph);
    this.graphInspector.registerGraph(renderGraph);
    for (const queryGraph of queryGraphs.values()) this.graphInspector.registerGraph(queryGraph);
    this.graphInspector.registerGraph(picking.graph);
    const newResources: AtlasResources = {
      ...shared,
      mode: this.mode,
      buildGraph,
      renderGraph,
      queryGraphs,
      pickingGraph: picking.graph,
      pickingReadbackIdentifier: picking.readbackIdentifier,
      width,
      height,
      cpuCellCounts: makeGridCellCounts(queryPositionValues, dimension, domain, gridSize)
    };
    this.resources = newResources;
    this.writeQuery(newResources);
    const commandEncoder = this.device.createCommandEncoder({id: 'spatial-atlas-index-build'});
    const encoding = buildGraph.encode(commandEncoder, {parameters: undefined});
    this.graphInspector.recordEncoding(buildGraph.id, encoding);
    this.device.submit(commandEncoder.finish());
    if (encoding.canReadGPUTimings) {
      setTimeout(() => void this.recordGPUTimings(buildGraph.id, encoding), 0);
    }
    this.sampledMatchCount = 0;
    this.sampledTotalMatchCount = 0;
    this.sampledOverflow = false;
    this.pickedObjectIndex = null;
    this.hideHoverTooltip();
    this.updateInspector();
  }

  private createSceneColorTexture(width: number, height: number): Texture {
    return this.device.createTexture({
      id: 'spatial-atlas-scene-color',
      format: this.sceneColorFormat,
      width,
      height,
      usage: Texture.SAMPLE | Texture.RENDER,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      }
    });
  }

  /** Replaces framebuffer-sized graphs while preserving all resident points and their GPU index. */
  private resizeResources(resources: AtlasResources, width: number, height: number): void {
    this.hoverGeneration++;
    this.pointerDirty = false;
    resources.renderGraph.destroy();
    for (const graph of resources.queryGraphs.values()) graph.destroy();
    resources.pickingGraph.destroy();
    resources.sceneColor.destroy();

    resources.width = width;
    resources.height = height;
    resources.sceneColor = this.createSceneColorTexture(width, height);
    this.postprocessingRenderer.resize([width, height]);
    resources.renderGraph = this.createRenderGraph(resources);
    resources.queryGraphs = this.createQueryGraphs(resources);
    const picking = this.createPickingGraph(resources, width, height);
    resources.pickingGraph = picking.graph;
    resources.pickingReadbackIdentifier = picking.readbackIdentifier;

    this.graphInspector.clear();
    this.graphInspector.registerGraph(resources.buildGraph);
    this.graphInspector.registerGraph(resources.renderGraph);
    for (const queryGraph of resources.queryGraphs.values()) {
      this.graphInspector.registerGraph(queryGraph);
    }
    this.graphInspector.registerGraph(resources.pickingGraph);
    this.lastQuerySignature = null;
  }

  private createBuildGraph(
    resources: Pick<
      AtlasResources,
      | 'pointCount'
      | 'dimension'
      | 'domain'
      | 'gridSize'
      | 'queryPositions'
      | 'cellOffsets'
      | 'indexRowIndices'
      | 'indexCount'
      | 'indexOverflow'
    >
  ): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'spatial-atlas-index-build-graph'});
    const positionsBuffer = importBuffer(graph, 'build-positions', resources.queryPositions);
    const cellOffsetsBuffer = importBuffer(graph, 'build-cell-offsets', resources.cellOffsets);
    const rowIndicesBuffer = importBuffer(graph, 'build-row-indices', resources.indexRowIndices);
    const countBuffer = importBuffer(graph, 'build-count', resources.indexCount);
    const overflowBuffer = importBuffer(graph, 'build-overflow', resources.indexOverflow);
    const positions =
      resources.dimension === 2
        ? graph.createDataView(positionsBuffer, {
            format: 'float32x2',
            length: resources.pointCount
          })
        : graph.createDataView(positionsBuffer, {
            format: 'float32x3',
            length: resources.pointCount
          });
    const cellOffsets = graph.createDataView(cellOffsetsBuffer, {
      format: 'uint32',
      length: resources.gridSize.reduce((product, value) => product * value, 1) + 1
    });
    const rowIndices = graph.createDataView(rowIndicesBuffer, {
      format: 'uint32',
      length: resources.pointCount
    });
    const count = graph.createDataView(countBuffer, {format: 'uint32', length: 1});
    const overflow = graph.createDataView(overflowBuffer, {format: 'uint32', length: 1});
    new GPUGridIndex({
      id: 'spatial-atlas-grid',
      positions,
      gridSize: resources.gridSize,
      bounds: resources.domain,
      cellOffsets,
      objectIds: rowIndices,
      count,
      overflow
    }).addToGraph(graph);
    return graph.compile();
  }

  private createQueryGraphs(
    resources: Pick<
      AtlasResources,
      | 'pointCount'
      | 'dimension'
      | 'domain'
      | 'gridSize'
      | 'renderPositions'
      | 'pointAttributes'
      | 'queryPositions'
      | 'visibleIds'
      | 'queryValues'
      | 'polygonPositions'
      | 'polygonRingOffsets'
      | 'cellOffsets'
      | 'indexRowIndices'
      | 'indexCount'
      | 'indexOverflow'
      | 'queryTotalCount'
      | 'queryOverflow'
      | 'drawCommands'
      | 'sceneColor'
      | 'renderBundle'
    >
  ): Map<QueryGraphKey, CompiledGPUCommandGraph<AtlasGraphParameters>> {
    const graphs = new Map<QueryGraphKey, CompiledGPUCommandGraph<AtlasGraphParameters>>();
    const queryKind =
      resources.dimension === 3 && this.queryKind === 'polygon' ? 'bounds' : this.queryKind;
    graphs.set(
      `${queryKind}-${this.queryExecution}`,
      this.createQueryGraph(resources, queryKind, this.queryExecution)
    );
    return graphs;
  }

  /** Alternate query pipelines are compiled only when a visitor actually selects them. */
  private getQueryGraph(resources: AtlasResources): CompiledGPUCommandGraph<AtlasGraphParameters> {
    const graphKey = `${this.queryKind}-${this.queryExecution}` as const;
    let graph = resources.queryGraphs.get(graphKey);
    if (!graph) {
      graph = this.createQueryGraph(resources, this.queryKind, this.queryExecution);
      resources.queryGraphs.set(graphKey, graph);
      this.graphInspector.registerGraph(graph);
    }
    return graph;
  }

  /** Redraws persistent query results without dispatching a million-row spatial query again. */
  private createRenderGraph(
    resources: Pick<
      AtlasResources,
      | 'renderPositions'
      | 'pointAttributes'
      | 'visibleIds'
      | 'drawCommands'
      | 'sceneColor'
      | 'renderBundle'
    >
  ): CompiledGPUCommandGraph<AtlasGraphParameters> {
    const graph = new GPUCommandGraph<AtlasGraphParameters>(this.device, {
      id: 'spatial-atlas-display-graph'
    });
    const renderPositions = importBuffer(
      graph,
      'display-render-positions',
      resources.renderPositions
    );
    const pointAttributes = importBuffer(
      graph,
      'display-point-attributes',
      resources.pointAttributes
    );
    const visibleIds = importBuffer(graph, 'display-visible-ids', resources.visibleIds);
    const drawCommand = importBuffer(graph, 'display-draw-command', resources.drawCommands.buffer);
    const uniforms = importBuffer(graph, 'display-uniforms', this.uniformBuffer);
    const sceneColor = graph.importTexture(
      {
        id: 'display-scene-color',
        format: resources.sceneColor.format,
        width: resources.sceneColor.width,
        height: resources.sceneColor.height,
        usage: resources.sceneColor.props.usage
      },
      resources.sceneColor
    );
    const sceneDepth = graph.createTransientTexture({
      id: 'display-scene-depth',
      format: 'depth24plus',
      width: resources.sceneColor.width,
      height: resources.sceneColor.height,
      usage: Texture.RENDER
    });

    graph.addRenderPass({
      id: 'spatial-atlas-render-cached-results',
      attachments: {
        colorAttachments: [graph.createTextureView(sceneColor)],
        depthStencilAttachment: graph.createTextureView(sceneDepth)
      },
      resources: [
        {buffer: renderPositions, usage: 'storage-read'},
        {buffer: pointAttributes, usage: 'storage-read'},
        {buffer: visibleIds, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: drawCommand, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'spatial-atlas-cached-render-pass',
          clearColor: [0.001, 0.002, 0.012, 1],
          clearDepth: 1,
          clearStencil: false
        }),
        encode: ({parameters, renderPass}) => {
          renderPass.setParameters({viewport: parameters.viewport});
          renderPass.executeBundles([resources.renderBundle]);
        }
      })
    });
    return graph.compile();
  }

  private createQueryGraph(
    resources: Pick<
      AtlasResources,
      | 'pointCount'
      | 'dimension'
      | 'domain'
      | 'gridSize'
      | 'renderPositions'
      | 'pointAttributes'
      | 'queryPositions'
      | 'visibleIds'
      | 'queryValues'
      | 'polygonPositions'
      | 'polygonRingOffsets'
      | 'cellOffsets'
      | 'indexRowIndices'
      | 'indexCount'
      | 'indexOverflow'
      | 'queryTotalCount'
      | 'queryOverflow'
      | 'drawCommands'
      | 'sceneColor'
      | 'renderBundle'
    >,
    kind: GPUPointSpatialQueryKind,
    execution: QueryExecution
  ): CompiledGPUCommandGraph<AtlasGraphParameters> {
    const graph = new GPUCommandGraph<AtlasGraphParameters>(this.device, {
      id: `spatial-atlas-${kind}-${execution}-graph`
    });
    const queryPositionsBuffer = importBuffer(graph, 'query-positions', resources.queryPositions);
    const renderPositionsBuffer = importBuffer(
      graph,
      'render-positions',
      resources.renderPositions
    );
    const pointAttributesBuffer = importBuffer(
      graph,
      'point-attributes',
      resources.pointAttributes
    );
    const visibleIdsBuffer = importBuffer(graph, 'visible-ids', resources.visibleIds);
    const queryValuesBuffer = importBuffer(graph, 'query-values', resources.queryValues);
    const polygonPositionsBuffer = importBuffer(
      graph,
      'polygon-positions',
      resources.polygonPositions
    );
    const polygonRingOffsetsBuffer = importBuffer(
      graph,
      'polygon-ring-offsets',
      resources.polygonRingOffsets
    );
    const cellOffsetsBuffer = importBuffer(graph, 'cell-offsets', resources.cellOffsets);
    const indexRowIndicesBuffer = importBuffer(
      graph,
      'index-row-indices',
      resources.indexRowIndices
    );
    const indexCountBuffer = importBuffer(graph, 'index-count', resources.indexCount);
    const indexOverflowBuffer = importBuffer(graph, 'index-overflow', resources.indexOverflow);
    const totalCountBuffer = importBuffer(graph, 'query-total-count', resources.queryTotalCount);
    const queryOverflowBuffer = importBuffer(graph, 'query-overflow', resources.queryOverflow);
    const drawCommandBuffer = importBuffer(graph, 'draw-command', resources.drawCommands.buffer);
    const uniformBuffer = importBuffer(graph, 'uniforms', this.uniformBuffer);
    const sceneColor = graph.importTexture(
      {
        id: 'scene-color',
        format: resources.sceneColor.format,
        width: resources.sceneColor.width,
        height: resources.sceneColor.height,
        usage: resources.sceneColor.props.usage
      },
      resources.sceneColor
    );
    const sceneDepth = graph.createTransientTexture({
      id: 'scene-depth',
      format: 'depth24plus',
      width: resources.sceneColor.width,
      height: resources.sceneColor.height,
      usage: Texture.RENDER
    });
    const positions = graph.createDataView(queryPositionsBuffer, {
      format: resources.dimension === 2 ? 'float32x2' : 'float32x3',
      length: resources.pointCount
    });
    const queryLength = kind === 'radius' ? resources.dimension + 1 : resources.dimension * 2;
    const query = graph.createDataView(queryValuesBuffer, {format: 'float32', length: queryLength});
    const ids = graph.createDataView(visibleIdsBuffer, {
      format: 'uint32',
      length: resources.pointCount
    });
    const count = graph.createDataView(drawCommandBuffer, {
      format: 'uint32',
      length: 1,
      byteOffset: resources.drawCommands.getInstanceCountByteOffset(0)
    });
    const totalCount = graph.createDataView(totalCountBuffer, {format: 'uint32', length: 1});
    const overflow = graph.createDataView(queryOverflowBuffer, {format: 'uint32', length: 1});
    const cellOffsets = graph.createDataView(cellOffsetsBuffer, {
      format: 'uint32',
      length: resources.gridSize.reduce((product, value) => product * value, 1) + 1
    });
    const indexRowIndices = graph.createDataView(indexRowIndicesBuffer, {
      format: 'uint32',
      length: resources.pointCount
    });
    const indexCount = graph.createDataView(indexCountBuffer, {format: 'uint32', length: 1});
    const indexOverflow = graph.createDataView(indexOverflowBuffer, {format: 'uint32', length: 1});
    const polygonPositions = graph.createDataView(polygonPositionsBuffer, {
      format: 'float32x2',
      length: MAXIMUM_TAXI_ZONE_POSITION_COUNT
    });
    const polygonRingOffsets = graph.createDataView(polygonRingOffsetsBuffer, {
      format: 'uint32',
      length: MAXIMUM_TAXI_ZONE_RING_OFFSET_COUNT
    });
    new GPUPointSpatialQuery({
      id: `spatial-atlas-${kind}-${execution}`,
      positions,
      kind,
      query,
      ...(execution === 'index'
        ? {
            index: {
              gridSize: resources.gridSize,
              bounds: resources.domain,
              cellOffsets,
              rowIndices: indexRowIndices,
              count: indexCount,
              overflow: indexOverflow
            }
          }
        : {}),
      ...(kind === 'polygon'
        ? {polygon: {positions: polygonPositions, ringOffsets: polygonRingOffsets}}
        : {}),
      output: {ids, count, overflow, totalCount}
    }).addToGraph(graph);

    const sceneColorView = graph.createTextureView(sceneColor);
    const sceneDepthView = graph.createTextureView(sceneDepth);
    graph.addRenderPass({
      id: `spatial-atlas-render-${kind}-${execution}`,
      attachments: {
        colorAttachments: [sceneColorView],
        depthStencilAttachment: sceneDepthView
      },
      resources: [
        {buffer: renderPositionsBuffer, usage: 'storage-read'},
        {buffer: pointAttributesBuffer, usage: 'storage-read'},
        {buffer: visibleIdsBuffer, usage: 'storage-read'},
        {buffer: uniformBuffer, usage: 'uniform'},
        {buffer: drawCommandBuffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: `spatial-atlas-render-pass-${kind}-${execution}`,
          clearColor: [0.001, 0.002, 0.012, 1],
          clearDepth: 1,
          clearStencil: false
        }),
        encode: ({parameters, renderPass}) => {
          renderPass.setParameters({viewport: parameters.viewport});
          renderPass.executeBundles([resources.renderBundle]);
        }
      })
    });
    return graph.compile();
  }

  private createPickingGraph(
    resources: Pick<
      AtlasResources,
      'renderPositions' | 'pointAttributes' | 'visibleIds' | 'drawCommands'
    >,
    width: number,
    height: number
  ): {graph: CompiledGPUCommandGraph<PickingGraphParameters>; readbackIdentifier: string} {
    const graph = new GPUCommandGraph<PickingGraphParameters>(this.device, {
      id: 'spatial-atlas-picking-graph'
    });
    const renderPositions = importBuffer(
      graph,
      'picking-render-positions',
      resources.renderPositions
    );
    const pointAttributes = importBuffer(
      graph,
      'picking-point-attributes',
      resources.pointAttributes
    );
    const visibleIds = importBuffer(graph, 'picking-visible-ids', resources.visibleIds);
    const uniforms = importBuffer(graph, 'picking-uniforms', this.uniformBuffer);
    const drawCommand = importBuffer(graph, 'picking-draw-command', resources.drawCommands.buffer);
    const target = new GPUIndexPickingTarget(graph, {
      id: 'spatial-atlas-picking-target',
      width,
      height
    });
    graph.addRenderPass({
      id: 'spatial-atlas-render-picking',
      attachments: target.attachments,
      resources: [
        {buffer: renderPositions, usage: 'storage-read'},
        {buffer: pointAttributes, usage: 'storage-read'},
        {buffer: visibleIds, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: drawCommand, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => target.renderPassProps,
        encode: ({parameters, renderPass, getBuffer}) => {
          renderPass.setParameters({viewport: parameters.viewport});
          renderPass.setPipeline(this.pickingModel.pipeline);
          renderPass.setVertexArray(this.pickingModel.vertexArray);
          renderPass.setBindings({
            pointPositions: getBuffer(renderPositions),
            visibleIds: getBuffer(visibleIds),
            pointAttributes: getBuffer(pointAttributes),
            uniforms: getBuffer(uniforms)
          });
          resources.drawCommands.draw(renderPass, 0);
        }
      })
    });
    target.addReadbackPass({
      after: 'spatial-atlas-render-picking',
      getPixel: parameters => parameters.pixel
    });
    return {graph: graph.compile(), readbackIdentifier: target.readback.id};
  }

  private createRenderBundle(
    positions: Buffer,
    pointAttributes: Buffer,
    visibleIds: Buffer,
    drawCommands: DrawCommandBuffer,
    uniforms: Buffer,
    pointCount: number
  ): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id: 'spatial-atlas-render-bundle',
      colorAttachmentFormats: [this.sceneColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.contextModel.pipeline);
    encoder.setVertexArray(this.contextModel.vertexArray);
    encoder.setBindings({pointPositions: positions, visibleIds, pointAttributes, uniforms});
    encoder.draw({vertexCount: 6, instanceCount: pointCount});
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    encoder.setBindings({pointPositions: positions, visibleIds, pointAttributes, uniforms});
    drawCommands.draw(encoder, 0);
    return encoder.finish();
  }

  private writeQuery(resources: AtlasResources): void {
    const values = new Float32Array(6);
    let envelope: readonly number[];
    if (this.queryKind === 'polygon' && this.mode === 'taxi') {
      const zones = makeTaxiZones();
      const zone = zones.find(candidate => candidate.id === this.selectedZoneId) ?? zones[0];
      this.queryCenter = getBoundsCenter(zone.bounds);
      values.set(zone.bounds);
      const polygonPositionValues = new Float32Array(MAXIMUM_TAXI_ZONE_POSITION_COUNT * 2);
      polygonPositionValues.set(zone.positions);
      resources.polygonPositions.write(polygonPositionValues);
      const polygonRingOffsetValues = new Uint32Array(MAXIMUM_TAXI_ZONE_RING_OFFSET_COUNT);
      polygonRingOffsetValues.fill(zone.positions.length / 2);
      polygonRingOffsetValues.set(zone.ringOffsets);
      resources.polygonRingOffsets.write(polygonRingOffsetValues);
      envelope = zone.bounds;
    } else if (this.queryKind === 'radius') {
      if (resources.dimension === 2) {
        values.set([this.queryCenter[0], this.queryCenter[1], this.queryRadius]);
        envelope = [
          this.queryCenter[0] - this.queryRadius,
          this.queryCenter[1] - this.queryRadius,
          this.queryCenter[0] + this.queryRadius,
          this.queryCenter[1] + this.queryRadius
        ];
      } else {
        values.set([this.queryCenter[0], this.queryCenter[1], 0.7, this.queryRadius * 1.7]);
        envelope = [
          this.queryCenter[0] - this.queryRadius * 1.7,
          this.queryCenter[1] - this.queryRadius * 1.7,
          0.7 - this.queryRadius * 1.7,
          this.queryCenter[0] + this.queryRadius * 1.7,
          this.queryCenter[1] + this.queryRadius * 1.7,
          0.7 + this.queryRadius * 1.7
        ];
      }
    } else if (resources.dimension === 2) {
      envelope = [
        this.queryCenter[0] - this.queryRadius,
        this.queryCenter[1] - this.queryRadius,
        this.queryCenter[0] + this.queryRadius,
        this.queryCenter[1] + this.queryRadius
      ];
      values.set(envelope);
    } else {
      envelope = [
        this.queryCenter[0] - this.queryRadius,
        this.queryCenter[1] - this.queryRadius,
        0.05,
        this.queryCenter[0] + this.queryRadius,
        this.queryCenter[1] + this.queryRadius,
        1.45
      ];
      values.set(envelope);
    }
    resources.queryValues.write(values);
    this.candidateCount =
      this.queryExecution === 'scan'
        ? resources.pointCount
        : countCandidates(
            resources.cpuCellCounts,
            resources.dimension,
            resources.domain,
            resources.gridSize,
            envelope
          );
  }

  private writeUniforms(width: number, height: number, timeMilliseconds: number): void {
    const colorMode =
      this.lidarColorMode === 'classification' ? 1 : this.lidarColorMode === 'intensity' ? 2 : 0;
    const densityExposure = this.mode === 'taxi' ? 0.62 : 0.76;
    this.uniformBuffer.write(
      new Float32Array([
        Math.cos(this.yaw),
        Math.sin(this.yaw),
        Math.cos(this.pitch),
        Math.sin(this.pitch),
        width,
        height,
        this.pointSize,
        this.mode === 'lidar' ? 1 : 0,
        this.queryCenter[0],
        this.queryCenter[1],
        colorMode,
        timeMilliseconds / 420,
        densityExposure,
        densityExposure,
        densityExposure,
        this.mode === 'lidar' ? 0.82 : 0.92,
        this.pickedObjectIndex === null ? 0 : this.pickedObjectIndex + 1,
        0,
        0,
        0,
        this.viewCenter[0],
        this.viewCenter[1],
        this.viewScale,
        0
      ])
    );
  }

  private async sampleCounts(resources: AtlasResources): Promise<void> {
    if (this.countReadPending) return;
    this.countReadPending = true;
    try {
      const [drawBytes, totalCountBytes, overflowBytes] = await Promise.all([
        resources.drawCommands.buffer.readAsync(),
        resources.queryTotalCount.readAsync(),
        resources.queryOverflow.readAsync()
      ]);
      const drawValues = new Uint32Array(
        drawBytes.buffer,
        drawBytes.byteOffset,
        drawBytes.byteLength / UINT32_BYTE_LENGTH
      );
      const overflowValues = new Uint32Array(
        overflowBytes.buffer,
        overflowBytes.byteOffset,
        overflowBytes.byteLength / UINT32_BYTE_LENGTH
      );
      const totalCountValues = new Uint32Array(
        totalCountBytes.buffer,
        totalCountBytes.byteOffset,
        totalCountBytes.byteLength / UINT32_BYTE_LENGTH
      );
      if (this.resources === resources) {
        this.sampledMatchCount = drawValues[1] ?? 0;
        this.sampledTotalMatchCount = totalCountValues[0] ?? 0;
        this.sampledOverflow = Boolean(overflowValues[0]);
        this.updateInspector();
      }
    } catch (error) {
      // A resize or mode switch may destroy a superseded resource set while its diagnostic
      // readback is waiting for queued GPU work. The next stable sampling interval retries.
      if (this.resources === resources) {
        this.setStatus(
          `Counter readback unavailable: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } finally {
      this.countReadPending = false;
    }
  }

  private async recordGPUTimings(
    graphId: string,
    encoding: GPUCommandGraphEncoding
  ): Promise<void> {
    await this.graphInspector.recordGPUTimings(graphId, encoding);
    this.updateInspector();
  }

  private getPickingPixel(
    mousePosition: [number, number],
    resources: AtlasResources
  ): readonly [number, number] {
    const pixels = this.device.getDefaultCanvasContext().cssToDevicePixels(mousePosition, false);
    return [
      Math.max(0, Math.min(resources.width - 1, pixels.x)),
      Math.max(0, Math.min(resources.height - 1, pixels.y))
    ];
  }

  private async readPickingResult(
    ticket: GPUReadbackTicket,
    hoverGeneration: number
  ): Promise<void> {
    let bytes: Uint8Array;
    try {
      bytes = await ticket.read();
    } catch {
      // Resizing, rebuilding, or losing the device can invalidate an optional hover readback.
      if (hoverGeneration === this.hoverGeneration) this.hideHoverTooltip();
      return;
    }
    if (hoverGeneration !== this.hoverGeneration || this.pointerAction) return;
    this.pickedObjectIndex = decodeGPUIndexPickInfo(bytes).objectIndex;
    if (this.pickedObjectIndex === null) {
      this.hideHoverTooltip(false);
    } else {
      this.updateHoverTooltip(this.pickedObjectIndex);
    }
    this.updateInspector();
  }

  private async loadLidar(): Promise<void> {
    if (this.mode !== 'lidar') return;
    if (this.lidarLoading) {
      this.lidarRefreshPending = true;
      return;
    }

    const controller = new AbortController();
    const tileCache = this.lidarTileCache ?? new GPULidarTileCache(this.device, this.capacity);
    const initialLoad = this.lidarTileCache === null;
    this.lidarLoadAbortController = controller;
    this.lidarTileCache = tileCache;
    this.lidarLoading = true;
    this.lidarRefreshPending = false;
    if (initialLoad) {
      this.downloadedTileCount = 0;
      this.decodedPointCount = 0;
    }
    const refreshCenter: [number, number] = [...this.queryCenter];
    this.lastLidarRefreshCenter = refreshCenter;
    this.lastLidarRefreshTime = performance.now();
    this.setStatus(
      initialLoad
        ? 'Streaming public USGS EPT/LAZ tiles near the query…'
        : 'Refreshing the live EPT tile cache near the query…'
    );
    this.updateLoadLidarButton();
    this.updateInspector();
    try {
      if (!this.lidarTileSource) {
        const {createNYCEPTTileSource} = await import('./ept-source');
        this.lidarTileSource = await createNYCEPTTileSource(controller.signal);
      }
      const selections = await this.lidarTileSource.selectTiles(
        this.capacity,
        refreshCenter,
        controller.signal
      );
      const selectedKeys = new Set(selections.map(selection => selection.key));
      for (const selection of selections) {
        controller.signal.throwIfAborted();
        if (tileCache.getPointCount(selection.key) >= selection.pointLimit) {
          tileCache.touch(selection.key);
          continue;
        }
        const tile = await this.lidarTileSource.loadTile(selection, controller.signal);
        this.downloadedTileCount++;
        this.decodedPointCount += tile.decodedPointCount;
        tileCache.insert(tile.key, tile.positions, tile.attributes);
        this.scheduleLidarCachePublish(
          tileCache,
          this.resources?.renderPositions !== tileCache.positionsBuffer
        );
        this.updateInspector();
      }
      for (let selectionIndex = selections.length - 1; selectionIndex >= 0; selectionIndex--) {
        tileCache.touch(selections[selectionIndex].key);
      }
      tileCache.retain(selectedKeys);
      this.publishLidarCache(tileCache);
      this.setStatus(
        `Live EPT cache: ${formatCount(tileCache.pointCount)} resident points in ${tileCache.tileCount} tiles near (${refreshCenter[0].toFixed(2)}, ${refreshCenter[1].toFixed(2)}). Move the query to refresh.`
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        this.setStatus(
          `USGS EPT load failed: ${error instanceof Error ? error.message : String(error)}`
        );
        if (initialLoad && tileCache.pointCount === 0 && this.lidarTileCache === tileCache) {
          tileCache.destroy();
          this.lidarTileCache = null;
        }
      }
    } finally {
      if (this.lidarLoadAbortController === controller) {
        this.lidarLoading = false;
        this.lidarLoadAbortController = null;
        this.updateLoadLidarButton();
        this.updateInspector();
        if (this.lidarRefreshPending) {
          this.lidarRefreshPending = false;
          queueMicrotask(() => void this.loadLidar());
        }
      }
    }
  }

  private maybeRefreshLidarTiles(): void {
    if (
      this.mode !== 'lidar' ||
      !this.lidarTileSource ||
      !this.lidarTileCache ||
      this.lidarLoading ||
      !this.lastLidarRefreshCenter
    ) {
      return;
    }
    const elapsed = performance.now() - this.lastLidarRefreshTime;
    const distance = Math.hypot(
      this.queryCenter[0] - this.lastLidarRefreshCenter[0],
      this.queryCenter[1] - this.lastLidarRefreshCenter[1]
    );
    if ((elapsed >= 1500 && distance >= 0.12) || elapsed >= 8000) {
      void this.loadLidar();
    }
  }

  private scheduleLidarCachePublish(tileCache: GPULidarTileCache, immediate: boolean): void {
    if (immediate || performance.now() - this.lastLidarPublishTime >= 250) {
      this.publishLidarCache(tileCache);
      return;
    }
    if (this.lidarPublishTimer) return;
    this.lidarPublishTimer = setTimeout(() => {
      this.lidarPublishTimer = null;
      this.publishLidarCache(tileCache);
    }, 250);
  }

  private publishLidarCache(tileCache: GPULidarTileCache): void {
    if (this.mode !== 'lidar' || this.lidarTileCache !== tileCache || tileCache.pointCount === 0) {
      return;
    }
    if (this.lidarPublishTimer) {
      clearTimeout(this.lidarPublishTimer);
      this.lidarPublishTimer = null;
    }
    const snapshot = tileCache.synchronize();
    this.currentPositions = snapshot.positions;
    this.rebuildResources(
      snapshot.positions,
      tileCache.positionsBuffer,
      snapshot.attributes,
      tileCache.attributesBuffer
    );
    this.lastLidarPublishTime = performance.now();
  }

  private switchMode(mode: AtlasMode): void {
    if (this.mode === mode) return;
    this.lidarLoadAbortController?.abort();
    if (this.lidarPublishTimer) clearTimeout(this.lidarPublishTimer);
    const previousTileCache = this.lidarTileCache;
    this.lidarTileCache = null;
    this.lidarTileSource = null;
    this.lidarLoadAbortController = null;
    this.lidarLoading = false;
    this.lidarRefreshPending = false;
    this.lidarPublishTimer = null;
    this.lastLidarRefreshCenter = null;
    this.mode = mode;
    this.interactionMode = 'navigate';
    this.pointerAction = null;
    this.queryKind = mode === 'taxi' ? 'polygon' : 'bounds';
    this.queryCenter = [0, 0];
    if (mode === 'taxi') {
      const selectedZone = makeTaxiZones().find(zone => zone.id === this.selectedZoneId);
      if (selectedZone) this.queryCenter = getBoundsCenter(selectedZone.bounds);
    }
    this.queryRadius = mode === 'taxi' ? 0.4 : 0.32;
    this.resetView();
    this.dataGenerationAbortController?.abort();
    this.destroyResources();
    this.currentPositions = new Float32Array(0);
    this.decodedPointCount = 0;
    this.downloadedTileCount = 0;
    previousTileCache?.destroy();
    this.panels.setPanel(this.makePanel());
    this.updateInteractionPresentation();
    void this.loadSyntheticDataset(mode, this.capacity);
  }

  private changeCapacity(capacity: number): void {
    if (capacity === this.capacity) return;
    this.capacity = capacity;
    this.lidarLoadAbortController?.abort();
    if (this.lidarPublishTimer) clearTimeout(this.lidarPublishTimer);
    const previousTileCache = this.lidarTileCache;
    this.lidarTileCache = null;
    this.lidarLoadAbortController = null;
    this.lidarLoading = false;
    this.lidarRefreshPending = false;
    this.lidarPublishTimer = null;
    this.lastLidarRefreshCenter = null;
    this.dataGenerationAbortController?.abort();
    this.destroyResources();
    this.currentPositions = new Float32Array(0);
    this.decodedPointCount = 0;
    this.downloadedTileCount = 0;
    previousTileCache?.destroy();
    this.updateLoadLidarButton();
    this.updateInteractionPresentation();
    void this.loadSyntheticDataset(this.mode, capacity);
  }

  private destroyResources(): void {
    const resources = this.resources;
    if (!resources) return;
    resources.buildGraph.destroy();
    resources.renderGraph.destroy();
    for (const graph of resources.queryGraphs.values()) graph.destroy();
    resources.pickingGraph.destroy();
    resources.renderBundle.destroy();
    resources.drawCommands.destroy();
    if (resources.ownsRenderPositions) resources.renderPositions.destroy();
    if (resources.ownsPointAttributes) resources.pointAttributes.destroy();
    resources.queryPositions.destroy();
    resources.visibleIds.destroy();
    resources.queryValues.destroy();
    resources.polygonPositions.destroy();
    resources.polygonRingOffsets.destroy();
    resources.cellOffsets.destroy();
    resources.indexRowIndices.destroy();
    resources.indexCount.destroy();
    resources.indexOverflow.destroy();
    resources.queryTotalCount.destroy();
    resources.queryOverflow.destroy();
    resources.sceneColor.destroy();
    this.resources = null;
  }

  private makePanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'billion-point-spatial-atlas-panel',
      title: 'Billion-Point Spatial Atlas',
      html: `<style>${ATLAS_PANEL_CSS}</style><div data-spatial-atlas-panel>
        <div data-atlas-tier></div>
        <details open>
          <summary>Atlas controls</summary>
          <div class="spatial-atlas-section">${this.getControlsHtml()}</div>
        </details>
        <details>
          <summary>Pipeline inspector</summary>
          <div class="spatial-atlas-section"><div data-atlas-stats></div><div data-atlas-graph-inspector style="margin-top:10px"></div></div>
        </details>
        <div data-atlas-status role="status" aria-live="polite"></div>
        <div class="spatial-atlas-footer">QUERY → REFINE → INDIRECT DRAW · WEBGPU</div>
      </div>`,
      onRender: root => {
        this.tierElement = root.querySelector('[data-atlas-tier]');
        this.statsElement = root.querySelector('[data-atlas-stats]');
        const graphInspectorElement = root.querySelector<HTMLElement>(
          '[data-atlas-graph-inspector]'
        );
        this.graphInspectorElement = graphInspectorElement;
        this.graphInspectorPanel = graphInspectorElement
          ? new GPUCommandGraphInspectorPanel(graphInspectorElement, {
              graphLabels: ATLAS_GRAPH_LABELS
            })
          : null;
        this.statusElement = root.querySelector('[data-atlas-status]');
        const cleanupControls = this.bindPanelControls(root);
        this.updateInspector();
        return () => {
          cleanupControls();
          this.graphInspectorPanel?.destroy();
          this.graphInspectorPanel = null;
          this.graphInspectorElement = null;
          this.tierElement = null;
          this.statsElement = null;
          this.statusElement = null;
        };
      }
    });
  }

  private getControlsHtml(): string {
    const supportedTiers: number[] = [...getSupportedResidentPointCounts(this.device)];
    if (!supportedTiers.includes(this.capacity)) supportedTiers.unshift(this.capacity);
    const queryKinds =
      this.mode === 'taxi' ? ['polygon', 'bounds', 'radius'] : ['bounds', 'radius'];
    return `<div class="spatial-atlas-controls">
      <label>Atlas <select data-mode>
        <option value="taxi"${this.mode === 'taxi' ? ' selected' : ''}>NYC Taxi · 168.9M</option>
        <option value="lidar"${this.mode === 'lidar' ? ' selected' : ''}>NYC LiDAR · 4.76B</option>
      </select></label>
      <label>GPU resident <select data-capacity>${supportedTiers
        .map(
          value =>
            `<option value="${value}"${value === this.capacity ? ' selected' : ''}>${formatCount(value)}${
              value === VISUAL_SMOKE_POINT_COUNT
                ? ' · smoke fixture'
                : value === DEFAULT_RESIDENT_POINT_COUNT
                  ? ' · default'
                  : ' · stress'
            }</option>`
        )
        .join('')}</select></label>
      <label>Tool <select data-interaction-mode>
        <option value="navigate"${this.interactionMode === 'navigate' ? ' selected' : ''}>navigate</option>
        <option value="query"${this.interactionMode === 'query' ? ' selected' : ''}>move query</option>
      </select></label>
      <label>Query <select data-query-kind>${queryKinds
        .map(
          value =>
            `<option value="${value}"${value === this.queryKind ? ' selected' : ''}>${value}</option>`
        )
        .join('')}</select></label>
      <label>Execution <select data-execution>
        <option value="index"${this.queryExecution === 'index' ? ' selected' : ''}>uniform-grid index</option>
        <option value="scan"${this.queryExecution === 'scan' ? ' selected' : ''}>full scan comparison</option>
      </select></label>
      <label>Query radius <input data-radius type="range" min="0.04" max="0.75" step="0.01" value="${this.queryRadius}"></label>
      ${
        this.mode === 'taxi'
          ? `<label>TLC taxi zone <select data-zone>${makeTaxiZones()
              .map(
                zone =>
                  `<option value="${zone.id}"${zone.id === this.selectedZoneId ? ' selected' : ''}>${zone.name} · ${zone.borough}</option>`
              )
              .join('')}</select></label>
             <small><strong>Browser default:</strong> deterministic expansion of a <a href="${NYC_TAXI_SAMPLE_URL}" target="_blank" rel="noreferrer">small public 2015 TLC sample</a>, queried with simplified <a href="${NYC_TAXI_ZONES_URL}" target="_blank" rel="noreferrer">official TLC zone outlines</a>. The original Paul Taylor 859 MB Arrow object has no browser CORS; use the documented offline sharder for the real 168,898,952 rows.</small>`
          : `<label>Colour <select data-color-mode>
               <option value="height"${this.lidarColorMode === 'height' ? ' selected' : ''}>height</option>
               <option value="classification"${this.lidarColorMode === 'classification' ? ' selected' : ''}>classification</option>
               <option value="intensity"${this.lidarColorMode === 'intensity' ? ' selected' : ''}>intensity</option>
             </select></label>
             <button type="button" data-load-lidar${this.lidarLoading ? ' disabled' : ''}>${this.lidarLoading ? 'Refreshing nearby EPT tiles…' : this.lidarTileCache ? 'Refresh EPT near query' : 'Stream live USGS EPT/LAZ'}</button>
             <label><input data-cinematic type="checkbox"${this.cinematicFlyThrough ? ' checked' : ''}> cinematic fly-through</label>
             <small>The first view is deterministic and local. Live mode incrementally renders decoded LAZ nodes, then refreshes the bounded GPU LRU cache as the query moves.</small>`
      }
      <label>View zoom <input data-view-scale type="range" min="${MINIMUM_VIEW_SCALE}" max="${MAXIMUM_VIEW_SCALE}" step="0.05" value="${this.viewScale}"></label>
      <label>Point size <input data-point-size type="range" min="0.4" max="2.5" step="0.1" value="${this.pointSize}"></label>
      <button type="button" data-reset-view>Fit atlas</button>
      <small><strong>Navigate:</strong> drag to ${this.mode === 'taxi' ? 'pan' : 'orbit'}, scroll to zoom, and double-click to fit. <strong>Move query:</strong> drag its outline; Shift-scroll changes its radius. Hover a selected point for its available row details.</small>
    </div>`;
  }

  private bindPanelControls(root: HTMLElement): () => void {
    const listen = <ElementType extends HTMLElement>(
      selector: string,
      eventName: string,
      callback: (element: ElementType) => void
    ): (() => void) => {
      const element = root.querySelector<ElementType>(selector);
      if (!element) return () => {};
      const handler = () => callback(element);
      element.addEventListener(eventName, handler);
      return () => element.removeEventListener(eventName, handler);
    };
    this.loadLidarButtonElement = root.querySelector('[data-load-lidar]');
    this.updateLoadLidarButton();
    const cleanups = [
      listen<HTMLSelectElement>('[data-mode]', 'change', element =>
        this.switchMode(element.value as AtlasMode)
      ),
      listen<HTMLSelectElement>('[data-capacity]', 'change', element =>
        this.changeCapacity(Number(element.value))
      ),
      listen<HTMLSelectElement>('[data-interaction-mode]', 'change', element => {
        this.interactionMode = element.value as AtlasInteractionMode;
        this.updateInteractionPresentation();
      }),
      listen<HTMLSelectElement>('[data-query-kind]', 'change', element => {
        this.invalidateHover();
        this.queryKind = element.value as GPUPointSpatialQueryKind;
        if (this.queryKind === 'polygon') {
          this.selectTaxiZone(this.selectedZoneId);
        } else {
          this.updateInteractionPresentation();
        }
      }),
      listen<HTMLSelectElement>('[data-execution]', 'change', element => {
        this.invalidateHover();
        this.queryExecution = element.value as QueryExecution;
        this.updateInteractionPresentation();
      }),
      listen<HTMLInputElement>('[data-radius]', 'input', element => {
        this.invalidateHover();
        this.queryRadius = Number(element.value);
      }),
      listen<HTMLSelectElement>('[data-zone]', 'change', element => {
        this.selectTaxiZone(Number(element.value));
      }),
      listen<HTMLSelectElement>('[data-color-mode]', 'change', element => {
        this.lidarColorMode = element.value as LidarColorMode;
      }),
      listen<HTMLInputElement>('[data-cinematic]', 'change', element => {
        this.invalidateHover();
        this.cinematicFlyThrough = element.checked;
      }),
      listen<HTMLInputElement>('[data-point-size]', 'input', element => {
        this.invalidateHover();
        this.pointSize = Number(element.value);
      }),
      listen<HTMLInputElement>('[data-view-scale]', 'input', element => {
        this.invalidateHover();
        this.viewScale = Math.max(
          MINIMUM_VIEW_SCALE,
          Math.min(MAXIMUM_VIEW_SCALE, Number(element.value))
        );
        this.updateInteractionPresentation();
      }),
      listen<HTMLButtonElement>('[data-reset-view]', 'click', () => this.resetView()),
      listen<HTMLButtonElement>('[data-load-lidar]', 'click', () => void this.loadLidar())
    ];
    const cleanupDropdowns = this.mountCompactDropdowns(root);
    return () => {
      cleanupDropdowns();
      cleanups.forEach(cleanup => cleanup());
      this.loadLidarButtonElement = null;
    };
  }

  private mountCompactDropdowns(root: HTMLElement): () => void {
    const mounted: Array<readonly [HTMLSelectElement, CompactDropdown]> = [];
    for (const select of root.querySelectorAll<HTMLSelectElement>('select')) {
      const host = document.createElement('span');
      host.dataset.atlasCompactDropdownHost = '';
      select.after(host);
      select.hidden = true;
      const dropdown = new CompactDropdown(host, {
        ariaLabel: this.getSelectLabel(select),
        options: this.getCompactDropdownOptions(select),
        value: select.value,
        onChange: value => {
          select.value = value;
          select.dispatchEvent(new Event('change', {bubbles: true}));
        }
      });
      this.compactDropdowns.set(select, dropdown);
      mounted.push([select, dropdown]);
    }
    return () => {
      for (const [select, dropdown] of mounted) {
        this.compactDropdowns.delete(select);
        dropdown.destroy();
      }
    };
  }

  private getCompactDropdownOptions(select: HTMLSelectElement) {
    return Array.from(select.options, option => ({
      value: option.value,
      label: option.text,
      disabled: option.disabled || Boolean(option.hidden)
    }));
  }

  private getSelectLabel(select: HTMLSelectElement): string {
    const explicitLabel = select.getAttribute('aria-label');
    if (explicitLabel) return explicitLabel;
    const label = select.closest('label');
    const textNode = Array.from(label?.childNodes ?? []).find(
      node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
    );
    return textNode?.textContent?.trim() || 'Select option';
  }

  private syncCompactDropdown(select: HTMLSelectElement): void {
    const dropdown = this.compactDropdowns.get(select);
    if (!dropdown) return;
    dropdown.setOptions(this.getCompactDropdownOptions(select));
    dropdown.value = select.value;
  }

  private updateInspector(framesPerSecond = 0): void {
    const resources = this.resources;
    if (!resources) return;
    const corpusCount = this.mode === 'taxi' ? PAUL_TAYLOR_POINT_COUNT : NYC_LIDAR_POINT_COUNT;
    if (this.tierElement) {
      this.tierElement.innerHTML = `<p style="margin:0 0 8px"><strong>${formatCount(corpusCount)}</strong> corpus · <strong>${formatCount(resources.pointCount)}</strong> GPU resident</p>`;
    }
    if (this.statsElement) {
      const rows: Array<readonly [string, string]> = [
        ['corpus total', formatCount(corpusCount)],
        [
          'downloaded',
          this.mode === 'lidar' ? `${this.downloadedTileCount} tiles` : '0 · synthetic'
        ],
        ['decoded', formatCount(this.mode === 'taxi' ? 0 : this.decodedPointCount)],
        ['GPU resident', formatCount(resources.pointCount)],
        ...(this.mode === 'lidar' && this.lidarTileCache
          ? ([['resident tiles', String(this.lidarTileCache.tileCount)]] as Array<
              readonly [string, string]
            >)
          : []),
        ['candidate', formatCount(this.candidateCount)],
        ['matched', formatCount(this.sampledTotalMatchCount)],
        ['rendered', formatCount(this.sampledMatchCount)],
        ['overflow', this.sampledOverflow ? 'yes · incomplete' : 'no'],
        ['picked', this.pickedObjectIndex === null ? '—' : `#${this.pickedObjectIndex}`],
        ['frame rate', framesPerSecond ? `${framesPerSecond.toFixed(0)} fps` : 'warming']
      ];
      if (this.mode === 'taxi') {
        rows.splice(3, 0, ['generated', formatCount(resources.pointCount)]);
      }
      this.statsElement.innerHTML = makeStatGrid(rows);
    }
    const activeGraph = resources.queryGraphs.get(`${this.queryKind}-${this.queryExecution}`);
    this.graphInspectorPanel?.update(this.graphInspector.getSnapshot(), activeGraph?.id);
  }

  private setStatus(message: string): void {
    if (this.statusElement) this.statusElement.textContent = message;
  }

  private updateLoadLidarButton(): void {
    if (!this.loadLidarButtonElement) return;
    this.loadLidarButtonElement.disabled = this.lidarLoading;
    this.loadLidarButtonElement.textContent = this.lidarLoading
      ? 'Refreshing nearby EPT tiles…'
      : this.lidarTileCache
        ? 'Refresh EPT near query'
        : 'Stream live USGS EPT/LAZ';
  }

  private maybeFinishBenchmark(animationLoop: AnimationProps['animationLoop']): void {
    if (this.benchmarkSampleMilliseconds === null || this.frameIndex < 30) return;
    if (this.benchmarkSampleStartTime === null) {
      this.benchmarkSampleStartTime = performance.now();
      this.benchmarkSampleStartFrame = this.frameIndex;
    }
    const elapsedMilliseconds = performance.now() - this.benchmarkSampleStartTime;
    if (this.frameIndex < 90 || elapsedMilliseconds < this.benchmarkSampleMilliseconds) {
      return;
    }

    this.benchmarkFinishing = true;
    setTimeout(() => void this.finishBenchmark(animationLoop, elapsedMilliseconds), 0);
  }

  private async finishBenchmark(
    animationLoop: AnimationProps['animationLoop'],
    elapsedMilliseconds: number
  ): Promise<void> {
    const resources = this.resources;
    let counterReadbackCompleted = false;
    if (resources) {
      const counterReadback = this.sampleCounts(resources).then(() => {
        counterReadbackCompleted = true;
      });
      await Promise.race([
        counterReadback,
        new Promise<void>(resolve => setTimeout(resolve, 5_000))
      ]);
    }
    const sampledFrameCount = this.frameIndex - this.benchmarkSampleStartFrame;
    const sampledFramesPerSecond = (sampledFrameCount * 1000) / elapsedMilliseconds;
    this.updateInspector(sampledFramesPerSecond);
    const benchmarkGlobal = globalThis as typeof globalThis & {
      __lumaSpatialAtlasBenchmarkResult?: SpatialAtlasBenchmarkResult;
    };
    benchmarkGlobal.__lumaSpatialAtlasBenchmarkResult = {
      tier: this.tierElement?.textContent?.trim() ?? '',
      statistics: this.statsElement?.textContent?.trim() ?? '',
      timings: this.graphInspectorElement?.textContent?.trim() ?? '',
      counterReadbackCompleted
    };
    animationLoop.stop();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.canvas) return;
    this.hoverGeneration++;
    this.pointerDirty = false;
    this.hideHoverTooltip();
    this.canvas.focus({preventScroll: true});
    this.pointerAction =
      this.interactionMode === 'query' && this.queryKind !== 'polygon'
        ? 'query'
        : this.mode === 'lidar'
          ? 'orbit'
          : 'pan';
    if (this.pointerAction === 'orbit') {
      this.cinematicFlyThrough = false;
      const cinematicCheckbox = document.querySelector<HTMLInputElement>(
        '#example-panel-host [data-cinematic]'
      );
      if (cinematicCheckbox) cinematicCheckbox.checked = false;
    }
    this.lastPointer = [event.clientX, event.clientY];
    this.hoverPointer = [event.clientX, event.clientY];
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = this.pointerAction === 'query' ? 'crosshair' : 'grabbing';
    if (this.pointerAction === 'query') this.moveQueryToPointer(event);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.hoverPointer = [event.clientX, event.clientY];
    this.hoverGeneration++;
    this.pointerDirty = true;
    if (!this.pointerAction || !this.canvas) return;
    this.hideHoverTooltip();
    if (this.pointerAction === 'query') {
      this.moveQueryToPointer(event);
      return;
    }
    const deltaX = event.clientX - this.lastPointer[0];
    const deltaY = event.clientY - this.lastPointer[1];
    this.lastPointer = [event.clientX, event.clientY];
    if (this.pointerAction === 'orbit') {
      this.yaw -= deltaX * 0.006;
      this.pitch = Math.max(-1.1, Math.min(1.25, this.pitch + deltaY * 0.006));
      return;
    }
    const bounds = this.canvas.getBoundingClientRect();
    const aspect = bounds.width / Math.max(bounds.height, 1);
    this.viewCenter = [
      this.viewCenter[0] - ((deltaX / Math.max(bounds.width, 1)) * 2 * aspect) / this.viewScale,
      this.viewCenter[1] + ((deltaY / Math.max(bounds.height, 1)) * 2) / this.viewScale
    ];
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.canvas?.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.pointerAction = null;
    this.pointerDirty = false;
    this.hoverGeneration++;
    this.hideHoverTooltip();
    this.updateInteractionPresentation();
  };

  private readonly handlePointerLeave = (): void => {
    if (this.pointerAction) return;
    this.pointerDirty = false;
    this.hoverGeneration++;
    this.hideHoverTooltip();
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (event.shiftKey) {
      this.invalidateHover();
      this.queryRadius = Math.max(
        0.04,
        Math.min(0.75, this.queryRadius * Math.exp(event.deltaY * 0.001))
      );
      this.syncPanelRange('[data-radius]', this.queryRadius);
      return;
    }
    this.zoomView(Math.exp(-event.deltaY * WHEEL_ZOOM_RATE), event);
  };

  private readonly handleDoubleClick = (event: MouseEvent): void => {
    event.preventDefault();
    this.resetView();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Home' || event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this.resetView();
    } else if (event.key.toLowerCase() === 'q') {
      this.setInteractionMode('query');
    } else if (event.key.toLowerCase() === 'n' || event.key === 'Escape') {
      this.setInteractionMode('navigate');
    }
  };

  private readonly handleOverlayClick = (event: Event): void => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
      '[data-atlas-action]'
    );
    const action = button?.dataset.atlasAction;
    if (action === 'navigate' || action === 'query') {
      this.setInteractionMode(action);
    } else if (action === 'zoom-in') {
      this.zoomView(BUTTON_ZOOM_FACTOR);
    } else if (action === 'zoom-out') {
      this.zoomView(1 / BUTTON_ZOOM_FACTOR);
    } else if (action === 'reset') {
      this.resetView();
    }
  };

  private readonly handleOverlayChange = (event: Event): void => {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;
    if (select.hasAttribute('data-atlas-overlay-zone')) {
      this.selectTaxiZone(Number(select.value));
      return;
    }
    if (select.hasAttribute('data-atlas-overlay-query-kind')) {
      this.invalidateHover();
      this.queryKind = select.value as GPUPointSpatialQueryKind;
      this.syncPanelSelect('[data-query-kind]', this.queryKind);
      if (this.queryKind === 'polygon' && this.mode === 'taxi') {
        this.selectTaxiZone(this.selectedZoneId);
      } else {
        this.updateInteractionPresentation();
      }
      return;
    }
    if (select.hasAttribute('data-atlas-overlay-execution')) {
      this.invalidateHover();
      this.queryExecution = select.value as QueryExecution;
      this.syncPanelSelect('[data-execution]', this.queryExecution);
      this.updateInteractionPresentation();
    }
  };

  private moveQueryToPointer(event: MouseEvent): void {
    if (!this.canvas || this.queryKind === 'polygon') return;
    const bounds = this.canvas.getBoundingClientRect();
    const clipX = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
    const clipY = 1 - ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2;
    const aspect = bounds.width / Math.max(bounds.height, 1);
    this.queryCenter = [
      this.viewCenter[0] + (clipX * aspect) / this.viewScale,
      this.viewCenter[1] + clipY / this.viewScale
    ];
  }

  private zoomView(factor: number, event?: MouseEvent): void {
    const previousScale = this.viewScale;
    const nextScale = Math.max(
      MINIMUM_VIEW_SCALE,
      Math.min(MAXIMUM_VIEW_SCALE, previousScale * factor)
    );
    if (nextScale === previousScale) return;
    this.invalidateHover();
    if (event && this.canvas && this.mode === 'taxi') {
      const bounds = this.canvas.getBoundingClientRect();
      const clipX = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
      const clipY = 1 - ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2;
      const aspect = bounds.width / Math.max(bounds.height, 1);
      const worldX = this.viewCenter[0] + (clipX * aspect) / previousScale;
      const worldY = this.viewCenter[1] + clipY / previousScale;
      this.viewCenter = [worldX - (clipX * aspect) / nextScale, worldY - clipY / nextScale];
    }
    this.viewScale = nextScale;
    this.syncPanelRange('[data-view-scale]', this.viewScale);
    this.updateInteractionPresentation();
  }

  private resetView(): void {
    this.invalidateHover();
    if (this.mode === 'taxi') {
      this.viewCenter = [0.12, -0.04];
      this.viewScale = 1.25;
    } else {
      this.viewCenter = [0, 0];
      this.viewScale = 0.84;
      this.yaw = -0.28;
      this.pitch = 0.6;
    }
    this.syncPanelRange('[data-view-scale]', this.viewScale);
    this.updateInteractionPresentation();
  }

  private setInteractionMode(mode: AtlasInteractionMode): void {
    this.interactionMode = mode;
    const select = document.querySelector<HTMLSelectElement>(
      '#example-panel-host [data-interaction-mode]'
    );
    if (select) {
      select.value = mode;
      this.syncCompactDropdown(select);
    }
    this.updateInteractionPresentation();
  }

  private selectTaxiZone(zoneId: number): void {
    if (this.mode !== 'taxi') return;
    this.invalidateHover();
    const zones = makeTaxiZones();
    const zone = zones.find(candidate => candidate.id === zoneId) ?? zones[0];
    this.selectedZoneId = zone.id;
    this.queryKind = 'polygon';
    this.queryCenter = getBoundsCenter(zone.bounds);
    this.interactionMode = 'navigate';

    // Keep some city context while making the newly selected outline unmistakable.
    const width = zone.bounds[2] - zone.bounds[0];
    const height = zone.bounds[3] - zone.bounds[1];
    const aspect = this.canvas
      ? this.canvas.clientWidth / Math.max(this.canvas.clientHeight, 1)
      : 1.6;
    const fittedScale = Math.min(
      1.45 / Math.max(height, 0.01),
      (1.45 * aspect) / Math.max(width, 0.01)
    );
    this.viewCenter = [...this.queryCenter];
    this.viewScale = Math.max(1.25, Math.min(MAXIMUM_VIEW_SCALE, fittedScale));

    this.syncPanelSelect('[data-query-kind]', this.queryKind);
    this.syncPanelSelect('[data-interaction-mode]', this.interactionMode);
    this.syncPanelSelect('[data-zone]', String(this.selectedZoneId));
    this.syncPanelRange('[data-view-scale]', this.viewScale);
    this.setStatus(`${zone.name} selected · polygon query updates continuously on the GPU.`);
    this.updateInteractionPresentation();
  }

  private syncPanelSelect(selector: string, value: string): void {
    const select = document.querySelector<HTMLSelectElement>(`#example-panel-host ${selector}`);
    if (select) {
      select.value = value;
      this.syncCompactDropdown(select);
    }
  }

  private syncPanelRange(selector: string, value: number): void {
    const input = document.querySelector<HTMLInputElement>(`#example-panel-host ${selector}`);
    if (input) input.value = String(value);
  }

  private mountNavigationOverlay(canvas: HTMLCanvasElement): void {
    const container = canvas.parentElement;
    if (!container) return;
    this.canvasContainer = container;
    this.canvasContainerPosition = container.style.position;
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.dataset.atlasNavigation = '';
    overlay.setAttribute('role', 'toolbar');
    overlay.setAttribute('aria-label', 'Spatial Atlas navigation');
    overlay.style.cssText =
      'position:absolute;left:12px;bottom:12px;z-index:4;display:grid;gap:6px;width:min(336px,calc(100% - 24px));box-sizing:border-box;padding:9px 11px;border:1px solid rgba(126,157,205,.26);border-radius:8px;background:rgba(8,12,20,.86);box-shadow:0 14px 36px rgba(0,0,0,.3);backdrop-filter:blur(12px);color:#eff4fd;font:11px/1.35 system-ui,sans-serif;';
    overlay.innerHTML = `<style>
        [data-atlas-navigation] button {
          min-height: 26px;
          padding: 4px 8px;
          border: 1px solid rgba(140,169,211,.3);
          border-radius: 5px;
          background: rgba(30,41,58,.75);
          color: #e2ebf8;
          font: 600 10px/1.2 system-ui,sans-serif;
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
        }
        [data-atlas-navigation] button:hover {
          border-color: rgba(133,194,255,.56);
          background: rgba(43,61,87,.9);
        }
        [data-atlas-navigation] button:focus-visible {
          outline: 2px solid rgba(132,172,255,.9);
          outline-offset: 1px;
        }
        [data-atlas-navigation] label {
          display: grid;
          min-width: 0;
          gap: 1px;
          color: #91a6c3;
          font-size: 8px;
          letter-spacing: .06em;
        }
        [data-atlas-navigation] select {
          width: 100%;
          height: 21px;
          min-width: 0;
          padding: 1px 20px 1px 8px;
          appearance: none;
          border: 1px solid rgba(127,164,203,.18);
          border-bottom-color: rgba(95,180,220,.3);
          border-left-color: rgba(54,213,255,.64);
          border-radius: 1px;
          background-color: rgba(7,15,25,.94);
          background-image:
            linear-gradient(45deg, transparent 48%, #62dfff 50%),
            linear-gradient(135deg, #62dfff 50%, transparent 52%),
            linear-gradient(rgba(84,188,226,.24), rgba(84,188,226,.24));
          background-position:
            calc(100% - 8px) 8px,
            calc(100% - 5px) 8px,
            calc(100% - 15px) 50%;
          background-repeat: no-repeat;
          background-size: 3px 3px, 3px 3px, 1px 10px;
          box-shadow: inset 2px 0 rgba(54,213,255,.1), inset 0 -1px rgba(54,213,255,.05);
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
          color: #cde3f4;
          color-scheme: dark;
          font: 650 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
          letter-spacing: .045em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
        }
        [data-atlas-navigation] select:hover {
          border-color: rgba(82,209,247,.52);
          border-left-color: #45ddff;
          background-color: rgba(10,28,41,.98);
          color: #effcff;
        }
        [data-atlas-navigation] select:focus-visible {
          outline: 2px solid rgba(132,172,255,.9);
          outline-offset: 1px;
        }
        [data-atlas-navigation] select option { background: #0d1521; color: #e5eefb; }
        [data-atlas-tool-group] { display: flex; min-width: 0; gap: 4px; }
        [data-atlas-tool-group] button { flex: 1 1 0; min-width: 0; }
        [data-atlas-zoom-group] { display: grid; grid-template-columns: 28px 38px 28px; gap: 4px; }
      </style>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="color:#88a9d6;font-size:9px;font-weight:650;letter-spacing:.08em">SPATIAL ATLAS</span>
        <span data-atlas-navigation-context style="overflow:hidden;color:#aebed5;font:8px/1.2 ui-monospace,monospace;text-align:right;text-overflow:ellipsis;white-space:nowrap"></span>
      </div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px">
        <div data-atlas-tool-group role="group" aria-label="Map interaction tool">
          <button type="button" data-atlas-action="navigate" aria-pressed="true" aria-keyshortcuts="N Escape">Navigate</button>
          <button type="button" data-atlas-action="query" aria-pressed="false" aria-keyshortcuts="Q">Move query</button>
        </div>
        <div data-atlas-zoom-group role="group" aria-label="Map zoom">
          <button type="button" data-atlas-action="zoom-out" aria-label="Zoom out">−</button>
          <button type="button" data-atlas-action="reset" aria-label="Fit atlas" aria-keyshortcuts="Home R">Fit</button>
          <button type="button" data-atlas-action="zoom-in" aria-label="Zoom in">+</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;padding-top:6px;border-top:1px solid rgba(137,166,211,.17)">
        <label>QUERY
          <select data-atlas-overlay-query-kind aria-label="Spatial query kind">
            <option value="polygon">Polygon</option>
            <option value="bounds">Bounds</option>
            <option value="radius">Radius</option>
          </select>
        </label>
        <label>EXECUTION
          <select data-atlas-overlay-execution aria-label="Spatial query execution">
            <option value="index">Grid index</option>
            <option value="scan">Full scan</option>
          </select>
        </label>
      </div>
      <label data-atlas-overlay-zone-row>TAXI ZONE
        <select data-atlas-overlay-zone aria-label="TLC taxi zone">${makeTaxiZones()
          .map(zone => `<option value="${zone.id}">${zone.name} · ${zone.borough}</option>`)
          .join('')}</select>
      </label>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid rgba(137,166,211,.17);color:#91a2ba;font-size:9px">
        <span data-atlas-navigation-hint style="min-width:0"></span>
        <span data-atlas-navigation-scale style="flex:none;color:#bed1e9;font:8px/1.35 ui-monospace,monospace;white-space:nowrap"></span>
      </div>`;
    overlay.addEventListener('click', this.handleOverlayClick);
    overlay.addEventListener('change', this.handleOverlayChange);

    const hoverTooltip = document.createElement('div');
    hoverTooltip.dataset.atlasHoverTooltip = '';
    hoverTooltip.setAttribute('role', 'status');
    hoverTooltip.hidden = true;
    hoverTooltip.style.cssText =
      'position:absolute;z-index:5;pointer-events:none;min-width:178px;max-width:250px;padding:9px 11px;border:1px solid rgba(126,157,205,.3);border-radius:8px;background:rgba(8,12,20,.94);box-shadow:0 14px 36px rgba(0,0,0,.36);backdrop-filter:blur(12px);color:#edf3fc;font:11px/1.4 system-ui,sans-serif;';

    const footprint = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    footprint.dataset.atlasQueryFootprint = '';
    footprint.setAttribute('aria-hidden', 'true');
    footprint.style.cssText =
      'position:absolute;z-index:3;pointer-events:none;overflow:visible;filter:drop-shadow(0 0 7px rgba(56,189,248,.32));';
    const footprintPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    footprintPath.setAttribute('fill', 'rgba(56,189,248,.15)');
    footprintPath.setAttribute('fill-rule', 'evenodd');
    footprintPath.setAttribute('stroke', 'rgba(125,225,255,.98)');
    footprintPath.setAttribute('stroke-width', '1.5');
    footprintPath.setAttribute('vector-effect', 'non-scaling-stroke');
    const footprintLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    footprintLabel.setAttribute('fill', '#eaf8ff');
    footprintLabel.setAttribute('stroke', 'rgba(3,10,22,.95)');
    footprintLabel.setAttribute('stroke-width', '3');
    footprintLabel.setAttribute('paint-order', 'stroke');
    footprintLabel.setAttribute('font-family', 'system-ui, sans-serif');
    footprintLabel.setAttribute('font-size', '12');
    footprintLabel.setAttribute('font-weight', '700');
    footprint.append(footprintPath, footprintLabel);
    container.append(footprint, overlay, hoverTooltip);
    this.navigationOverlay = overlay;
    this.hoverTooltip = hoverTooltip;
    this.queryFootprint = footprint;
    this.queryFootprintPath = footprintPath;
    this.queryFootprintLabel = footprintLabel;
    this.navigationDropdownCleanup = this.mountCompactDropdowns(overlay);
    this.updateInteractionPresentation();
  }

  private unmountNavigationOverlay(): void {
    this.navigationDropdownCleanup?.();
    this.navigationDropdownCleanup = null;
    this.navigationOverlay?.removeEventListener('click', this.handleOverlayClick);
    this.navigationOverlay?.removeEventListener('change', this.handleOverlayChange);
    this.navigationOverlay?.remove();
    this.hoverTooltip?.remove();
    this.queryFootprint?.remove();
    if (this.canvasContainer) this.canvasContainer.style.position = this.canvasContainerPosition;
    this.navigationOverlay = null;
    this.hoverTooltip = null;
    this.queryFootprint = null;
    this.queryFootprintPath = null;
    this.queryFootprintLabel = null;
    this.canvasContainer = null;
  }

  private hideHoverTooltip(clearPick = true): void {
    if (clearPick) this.pickedObjectIndex = null;
    if (this.hoverTooltip) this.hoverTooltip.hidden = true;
  }

  private invalidateHover(): void {
    this.hoverGeneration++;
    this.pointerDirty = false;
    this.hideHoverTooltip();
  }

  private updateHoverTooltip(sourceIndex: number): void {
    const tooltip = this.hoverTooltip;
    const container = this.canvasContainer;
    if (!tooltip || !container || sourceIndex < 0) return;
    const positionOffset = sourceIndex * 3;
    if (positionOffset + 2 >= this.currentPositions.length) {
      this.hideHoverTooltip();
      return;
    }
    const x = this.currentPositions[positionOffset];
    const y = this.currentPositions[positionOffset + 1];
    const z = this.currentPositions[positionOffset + 2];
    if (![x, y, z].every(Number.isFinite)) {
      this.hideHoverTooltip();
      return;
    }

    const rows: Array<readonly [string, string]> = [
      ['Resident row ID', `#${sourceIndex.toLocaleString()}`],
      ['Local X', x.toFixed(5)],
      ['Local Y', y.toFixed(5)]
    ];
    let title = 'Selected synthetic row';
    if (this.mode === 'taxi') {
      const zone = makeTaxiZones().find(candidate => candidate.id === this.selectedZoneId);
      const query =
        this.queryKind === 'polygon'
          ? `polygon · ${zone?.name ?? `zone ${this.selectedZoneId}`}`
          : this.queryKind === 'radius'
            ? `radius ${this.queryRadius.toFixed(3)}`
            : 'bounds';
      rows.push(['Active query', query]);
    } else {
      title = this.lidarTileCache ? 'Selected LiDAR point' : 'Selected synthetic LiDAR point';
      rows.push(['Local Z', z.toFixed(5)]);
      if (!this.lidarTileCache) {
        const classification = 1 + (sourceIndex % 6);
        const intensity = Math.floor(hashUnit(sourceIndex ^ 0x6d2b79f5) * 0xffff);
        rows.push(['Classification', String(classification)], ['Intensity', String(intensity)]);
      }
    }

    tooltip.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = title;
    heading.style.cssText = 'display:block;margin-bottom:5px;color:#82acf2;font-size:12px;';
    const grid = document.createElement('div');
    grid.style.cssText =
      'display:grid;grid-template-columns:auto auto;gap:2px 12px;align-items:baseline;';
    for (const [label, value] of rows) {
      const labelElement = document.createElement('span');
      labelElement.textContent = label;
      labelElement.style.opacity = '.68';
      const valueElement = document.createElement('span');
      valueElement.textContent = value;
      valueElement.style.cssText = 'text-align:right;font:600 11px/1.4 ui-monospace,monospace;';
      grid.append(labelElement, valueElement);
    }
    tooltip.append(heading, grid);
    tooltip.hidden = false;

    const containerBounds = container.getBoundingClientRect();
    const localX = this.hoverPointer[0] - containerBounds.left;
    const localY = this.hoverPointer[1] - containerBounds.top;
    const offset = 14;
    let left = localX + offset;
    let top = localY + offset;
    if (left + tooltip.offsetWidth + 8 > containerBounds.width) {
      left = localX - tooltip.offsetWidth - offset;
    }
    if (top + tooltip.offsetHeight + 8 > containerBounds.height) {
      top = localY - tooltip.offsetHeight - offset;
    }
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
  }

  private updateInteractionPresentation(): void {
    if (this.canvas) {
      this.canvas.style.cursor = this.interactionMode === 'query' ? 'crosshair' : 'grab';
    }
    const navigationButton = this.navigationOverlay?.querySelector<HTMLButtonElement>(
      '[data-atlas-action="navigate"]'
    );
    const queryButton = this.navigationOverlay?.querySelector<HTMLButtonElement>(
      '[data-atlas-action="query"]'
    );
    for (const [button, selected] of [
      [navigationButton, this.interactionMode === 'navigate'],
      [queryButton, this.interactionMode === 'query']
    ] as const) {
      if (!button) continue;
      button.setAttribute('aria-pressed', String(selected));
      button.style.background = selected ? 'rgba(55,99,148,.64)' : 'rgba(30,41,58,.75)';
      button.style.borderColor = selected ? 'rgba(132,172,255,.76)' : 'rgba(140,169,211,.3)';
      button.style.color = selected ? '#ffffff' : '#e2ebf8';
    }
    const context = this.navigationOverlay?.querySelector<HTMLElement>(
      '[data-atlas-navigation-context]'
    );
    if (context) {
      context.textContent = `${this.mode === 'taxi' ? 'NYC TAXI' : 'NYC LIDAR'} · ${formatCount(this.resources?.pointCount ?? this.capacity)} GPU`;
    }
    const queryKindSelect = this.navigationOverlay?.querySelector<HTMLSelectElement>(
      '[data-atlas-overlay-query-kind]'
    );
    if (queryKindSelect) {
      queryKindSelect.value = this.queryKind;
      const polygonOption =
        queryKindSelect.querySelector<HTMLOptionElement>('option[value="polygon"]');
      if (polygonOption) {
        polygonOption.disabled = this.mode !== 'taxi';
        polygonOption.hidden = this.mode !== 'taxi';
      }
      this.syncCompactDropdown(queryKindSelect);
    }
    const executionSelect = this.navigationOverlay?.querySelector<HTMLSelectElement>(
      '[data-atlas-overlay-execution]'
    );
    if (executionSelect) {
      executionSelect.value = this.queryExecution;
      this.syncCompactDropdown(executionSelect);
    }
    const zoneRow = this.navigationOverlay?.querySelector<HTMLElement>(
      '[data-atlas-overlay-zone-row]'
    );
    if (zoneRow) zoneRow.hidden = this.mode !== 'taxi';
    const zoneSelect = this.navigationOverlay?.querySelector<HTMLSelectElement>(
      '[data-atlas-overlay-zone]'
    );
    if (zoneSelect) {
      zoneSelect.value = String(this.selectedZoneId);
      const zoneDropdown = this.compactDropdowns.get(zoneSelect);
      zoneDropdown?.setDisabled(this.mode !== 'taxi');
      if (this.mode !== 'taxi') zoneDropdown?.close();
      this.syncCompactDropdown(zoneSelect);
    }
    const scale = this.navigationOverlay?.querySelector<HTMLElement>(
      '[data-atlas-navigation-scale]'
    );
    if (scale) scale.textContent = `${this.viewScale.toFixed(this.viewScale >= 10 ? 0 : 1)}×`;
    const hint = this.navigationOverlay?.querySelector<HTMLElement>('[data-atlas-navigation-hint]');
    if (hint) {
      const selectedZone = makeTaxiZones().find(zone => zone.id === this.selectedZoneId);
      hint.textContent =
        this.mode === 'taxi' && this.queryKind === 'polygon'
          ? `${selectedZone?.name ?? 'Taxi zone'} · polygon query`
          : this.interactionMode === 'navigate'
            ? `drag ${this.mode === 'taxi' ? 'to pan' : 'to orbit'} · scroll to zoom`
            : 'drag the outline · Shift-scroll resizes';
    }
    this.updateQueryFootprint();
  }

  private updateQueryFootprint(): void {
    if (
      !this.queryFootprint ||
      !this.queryFootprintPath ||
      !this.queryFootprintLabel ||
      !this.canvas
    ) {
      return;
    }
    if (this.mode !== 'taxi') {
      this.queryFootprint.style.display = 'none';
      return;
    }
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const aspect = width / Math.max(height, 1);
    this.queryFootprint.style.display = 'block';
    this.queryFootprint.style.left = `${this.canvas.offsetLeft}px`;
    this.queryFootprint.style.top = `${this.canvas.offsetTop}px`;
    this.queryFootprint.style.width = `${width}px`;
    this.queryFootprint.style.height = `${height}px`;
    this.queryFootprint.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.queryFootprintPath.setAttribute(
      'stroke-dasharray',
      this.interactionMode === 'query' ? 'none' : '6 5'
    );

    const project = (x: number, y: number): readonly [number, number] => {
      const clipX = ((x - this.viewCenter[0]) * this.viewScale) / aspect;
      const clipY = (y - this.viewCenter[1]) * this.viewScale;
      return [(clipX * 0.5 + 0.5) * width, (0.5 - clipY * 0.5) * height];
    };

    if (this.queryKind === 'polygon') {
      const zones = makeTaxiZones();
      const zone = zones.find(candidate => candidate.id === this.selectedZoneId) ?? zones[0];
      const commands: string[] = [];
      for (let ringIndex = 0; ringIndex < zone.ringOffsets.length - 1; ringIndex++) {
        const firstVertex = zone.ringOffsets[ringIndex];
        const endVertex = zone.ringOffsets[ringIndex + 1];
        for (let vertexIndex = firstVertex; vertexIndex < endVertex; vertexIndex++) {
          const point = project(
            zone.positions[vertexIndex * 2],
            zone.positions[vertexIndex * 2 + 1]
          );
          commands.push(`${vertexIndex === firstVertex ? 'M' : 'L'}${point[0]} ${point[1]}`);
        }
        commands.push('Z');
      }
      this.queryFootprintPath.setAttribute('d', commands.join(' '));
      const labelPosition = project(zone.bounds[0], zone.bounds[3]);
      this.queryFootprintLabel.textContent = zone.name;
      this.queryFootprintLabel.setAttribute(
        'x',
        String(Math.max(8, Math.min(width - 8, labelPosition[0])))
      );
      this.queryFootprintLabel.setAttribute(
        'y',
        String(Math.max(18, Math.min(height - 8, labelPosition[1] - 8)))
      );
      return;
    }

    const center = project(this.queryCenter[0], this.queryCenter[1]);
    const radiusPixels = this.queryRadius * this.viewScale * height * 0.5;
    this.queryFootprintLabel.textContent = '';
    this.queryFootprintPath.setAttribute(
      'd',
      this.queryKind === 'radius'
        ? `M${center[0] - radiusPixels} ${center[1]} A${radiusPixels} ${radiusPixels} 0 1 0 ${center[0] + radiusPixels} ${center[1]} A${radiusPixels} ${radiusPixels} 0 1 0 ${center[0] - radiusPixels} ${center[1]}`
        : `M${center[0] - radiusPixels} ${center[1] - radiusPixels} H${center[0] + radiusPixels} V${center[1] + radiusPixels} H${center[0] - radiusPixels} Z`
    );
  }
}

function getBoundsCenter(bounds: readonly [number, number, number, number]): [number, number] {
  return [(bounds[0] + bounds[2]) * 0.5, (bounds[1] + bounds[3]) * 0.5];
}

function importBuffer<Parameters>(graph: GPUCommandGraph<Parameters>, id: string, buffer: Buffer) {
  return graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer);
}

function makeQueryPositions(positions: Float32Array, dimension: 2 | 3): Float32Array {
  if (dimension === 3) return positions.slice();
  const result = new Float32Array((positions.length / 3) * 2);
  for (let sourceOffset = 0, targetOffset = 0; sourceOffset < positions.length; sourceOffset += 3) {
    result[targetOffset++] = positions[sourceOffset];
    result[targetOffset++] = positions[sourceOffset + 1];
  }
  return result;
}

function makeSyntheticLidarPositions(pointCount: number, firstPointIndex = 0): Float32Array {
  const positions = makeSyntheticTaxiPositions(pointCount, firstPointIndex);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const offset = pointIndex * 3;
    const globalPointIndex = firstPointIndex + pointIndex;
    const x = positions[offset];
    const y = positions[offset + 1];
    const skyline = Math.exp(-(x * x * 11 + y * y * 4));
    const detail = hashUnit(globalPointIndex * 3 + 1) * 0.22;
    positions[offset + 2] = 0.03 + skyline * (0.3 + hashUnit(globalPointIndex * 3) * 1.3) + detail;
  }
  return positions;
}

function yieldAtlasGeneration(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', abortGeneration);
      resolve();
    }, 0);
    const abortGeneration = () => {
      clearTimeout(timeout);
      reject(signal.reason ?? new DOMException('Atlas generation was cancelled', 'AbortError'));
    };
    signal.addEventListener('abort', abortGeneration, {once: true});
  });
}

function getInitialResidentPointCount(): number {
  if (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('visual-smoke')
  ) {
    return VISUAL_SMOKE_POINT_COUNT;
  }
  return DEFAULT_RESIDENT_POINT_COUNT;
}

function getBenchmarkSampleMilliseconds(): number | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('benchmark-ms');
  if (value === null) return null;
  const milliseconds = Number(value);
  return Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : null;
}

function makeGridCellCounts(
  positions: Float32Array,
  dimension: 2 | 3,
  bounds: GPUGridIndexBounds,
  gridSize: GPUGridIndexSize
): Uint32Array {
  const cellCounts = new Uint32Array(gridSize.reduce((product, value) => product * value, 1));
  const pointCount = Math.floor(positions.length / dimension);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const offset = pointIndex * dimension;
    const horizontal = positions[offset];
    const vertical = positions[offset + 1];
    if (
      !Number.isFinite(horizontal) ||
      !Number.isFinite(vertical) ||
      horizontal < bounds[0] ||
      horizontal > bounds[dimension] ||
      vertical < bounds[1] ||
      vertical > bounds[dimension + 1]
    ) {
      continue;
    }

    const horizontalCell = getCellCoordinate(horizontal, bounds[0], bounds[dimension], gridSize[0]);
    const verticalCell = getCellCoordinate(vertical, bounds[1], bounds[dimension + 1], gridSize[1]);
    if (dimension === 2) {
      cellCounts[verticalCell * gridSize[0] + horizontalCell]++;
      continue;
    }

    const depth = positions[offset + 2];
    if (!Number.isFinite(depth) || depth < bounds[2] || depth > bounds[5]) continue;
    const depthCell = getCellCoordinate(depth, bounds[2], bounds[5], gridSize[2]);
    cellCounts[(depthCell * gridSize[1] + verticalCell) * gridSize[0] + horizontalCell]++;
  }
  return cellCounts;
}

function countCandidates(
  cellCounts: Uint32Array,
  dimension: 2 | 3,
  bounds: GPUGridIndexBounds,
  gridSize: GPUGridIndexSize,
  envelope: readonly number[]
): number {
  const minimum = new Array<number>(dimension);
  const maximum = new Array<number>(dimension);
  for (let axis = 0; axis < dimension; axis++) {
    if (envelope[axis] > bounds[axis + dimension] || envelope[axis + dimension] < bounds[axis]) {
      return 0;
    }
    const mappedMinimum = getCellCoordinate(
      Math.max(envelope[axis], bounds[axis]),
      bounds[axis],
      bounds[axis + dimension],
      gridSize[axis]
    );
    const mappedMaximum = getCellCoordinate(
      Math.min(envelope[axis + dimension], bounds[axis + dimension]),
      bounds[axis],
      bounds[axis + dimension],
      gridSize[axis]
    );
    // Match the GPU broad phase's conservative adjacent-cell expansion exactly.
    minimum[axis] = Math.max(0, mappedMinimum - 1);
    maximum[axis] = Math.min(gridSize[axis] - 1, mappedMaximum + 1);
  }
  let result = 0;
  const maximumZ = dimension === 3 ? maximum[2] : 0;
  for (let z = dimension === 3 ? minimum[2] : 0; z <= maximumZ; z++) {
    for (let y = minimum[1]; y <= maximum[1]; y++) {
      for (let x = minimum[0]; x <= maximum[0]; x++) {
        result += cellCounts[(z * gridSize[1] + y) * gridSize[0] + x];
      }
    }
  }
  return result;
}

function getCellCoordinate(value: number, minimum: number, maximum: number, size: number): number {
  if (maximum === minimum || value <= minimum) return 0;
  if (value >= maximum) return size - 1;
  return Math.min(size - 1, Math.floor(((value - minimum) / (maximum - minimum)) * size));
}

function getGraphNodeGroup(graphIdentifier: string, nodeIdentifier: string): string | undefined {
  if (graphIdentifier === 'spatial-atlas-index-build-graph') return 'build';
  if (graphIdentifier === 'spatial-atlas-picking-graph') return 'picking';
  if (nodeIdentifier.includes('-prepare')) return 'query';
  if (nodeIdentifier.includes('-refine') || nodeIdentifier.includes('-finalize'))
    return 'refinement';
  if (nodeIdentifier.includes('-render-')) return 'render';
  return undefined;
}

function makeStatGrid(rows: readonly (readonly [string, string])[]): string {
  return `<div style="display:grid;grid-template-columns:1fr auto;gap:3px 12px;font:11px/1.45 ui-monospace,monospace">${rows
    .map(([label, value]) => `<span style="opacity:.72">${label}</span><strong>${value}</strong>`)
    .join('')}</div>`;
}

function getSceneColorFormat(device: Device): SceneColorFormat {
  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  return capabilities.render && capabilities.filter ? 'rgba16float' : 'rgba8unorm';
}

function makePointAttributes(pointCount: number, mode: AtlasMode): Uint32Array {
  const attributes = new Uint32Array(pointCount);
  if (mode === 'taxi') return attributes;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const classification = 1 + (pointIndex % 6);
    const intensity = Math.floor(hashUnit(pointIndex ^ 0x6d2b79f5) * 0xffff);
    attributes[pointIndex] = (intensity << 8) | classification;
  }
  return attributes;
}

function hashUnit(seed: number): number {
  let value = (seed + 0x9e3779b9) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x21f0aaad);
  value ^= value >>> 15;
  value = Math.imul(value, 0x735a2d97);
  value ^= value >>> 15;
  return value / 0x1_0000_0000;
}

/** Bounded least-recently-used LAZ tile cache backed by one directly renderable GPU atlas. */
class GPULidarTileCache {
  readonly positionsBuffer: Buffer;
  readonly attributesBuffer: Buffer;

  private readonly pointCapacity: number;
  private readonly tiles = new Map<string, {positions: Float32Array; attributes: Uint32Array}>();
  private residentPointCount = 0;
  private destroyed = false;

  get pointCount(): number {
    return this.residentPointCount;
  }

  get tileCount(): number {
    return this.tiles.size;
  }

  constructor(device: Device, pointCapacity: number) {
    this.pointCapacity = pointCapacity;
    this.positionsBuffer = device.createBuffer({
      id: 'spatial-atlas-lidar-lru',
      byteLength: Math.max(
        Float32Array.BYTES_PER_ELEMENT * 3,
        pointCapacity * 3 * Float32Array.BYTES_PER_ELEMENT
      ),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.attributesBuffer = device.createBuffer({
      id: 'spatial-atlas-lidar-lru-attributes',
      byteLength: Math.max(
        Uint32Array.BYTES_PER_ELEMENT,
        pointCapacity * Uint32Array.BYTES_PER_ELEMENT
      ),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }

  insert(key: string, sourcePositions: Float32Array, sourceAttributes: Uint32Array): void {
    if (this.destroyed) return;
    const positions =
      sourcePositions.length / 3 > this.pointCapacity
        ? sourcePositions.slice(0, this.pointCapacity * 3)
        : sourcePositions;
    const pointCount = positions.length / 3;
    const attributes =
      sourceAttributes.length === pointCount
        ? sourceAttributes
        : sourceAttributes.slice(0, pointCount);
    const existing = this.tiles.get(key);
    if (existing) {
      this.residentPointCount -= existing.positions.length / 3;
      this.tiles.delete(key);
    }
    while (
      this.tiles.size > 0 &&
      this.residentPointCount + positions.length / 3 > this.pointCapacity
    ) {
      const oldestKey = this.tiles.keys().next().value as string;
      const oldest = this.tiles.get(oldestKey)!;
      this.tiles.delete(oldestKey);
      this.residentPointCount -= oldest.positions.length / 3;
    }
    this.tiles.set(key, {positions, attributes});
    this.residentPointCount += positions.length / 3;
  }

  getPointCount(key: string): number {
    return (this.tiles.get(key)?.positions.length ?? 0) / 3;
  }

  touch(key: string): void {
    const tile = this.tiles.get(key);
    if (!tile) return;
    this.tiles.delete(key);
    this.tiles.set(key, tile);
  }

  retain(keys: ReadonlySet<string>): boolean {
    let changed = false;
    for (const [key, tile] of this.tiles) {
      if (!keys.has(key)) {
        this.tiles.delete(key);
        this.residentPointCount -= tile.positions.length / 3;
        changed = true;
      }
    }
    return changed;
  }

  getSnapshot(): {positions: Float32Array; attributes: Uint32Array} {
    const positions = new Float32Array(this.residentPointCount * 3);
    const attributes = new Uint32Array(this.residentPointCount);
    let pointOffset = 0;
    for (const tile of this.tiles.values()) {
      positions.set(tile.positions, pointOffset * 3);
      attributes.set(tile.attributes, pointOffset);
      pointOffset += tile.positions.length / 3;
    }
    return {positions, attributes};
  }

  synchronize(): {positions: Float32Array; attributes: Uint32Array} {
    const snapshot = this.getSnapshot();
    if (snapshot.positions.length > 0) this.positionsBuffer.write(snapshot.positions);
    if (snapshot.attributes.length > 0) this.attributesBuffer.write(snapshot.attributes);
    return snapshot;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.positionsBuffer.destroy();
    this.attributesBuffer.destroy();
    this.tiles.clear();
    this.residentPointCount = 0;
  }
}
