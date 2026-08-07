// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import {AnimationLoopTemplate, Model, type AnimationProps} from '@luma.gl/engine';
import {
  decodeGPUIndexPickInfo,
  GPUCommandGraph,
  GPUIndexPickingTarget,
  GPUReadbackRing,
  INDEX_PICKING_READBACK_BYTE_LENGTH,
  type CompiledGPUCommandGraph,
  type GPUReadbackTicket,
  type GraphBufferUse
} from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphBreadthFirstSearch,
  LuGraphConnectedComponents,
  LuGraphDegree,
  LuGraphForceLayout,
  LuGraphLabelPropagation,
  LuGraphPageRank,
  LuGraphSpatialForceLayout,
  LuGraphTopology,
  type LuGraphAdjacency
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT,
  GRAPH_EXPLORER_MAX_VISIBLE_EDGES,
  GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT,
  GRAPH_EXPLORER_POINT_VERTEX_COUNT,
  GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT,
  GRAPH_EXPLORER_SPATIAL_BOUNDS,
  GRAPH_EXPLORER_VERTEX_COUNTS,
  getGraphExplorerGridSize,
  makeGraphExplorerDataset,
  type GraphExplorerColorMode,
  type GraphExplorerDataset,
  type GraphExplorerLayoutMode,
  type GraphExplorerNodeSizeMode
} from './graph-data';
import {addGraphExplorerSampledLayoutToGraph} from './graph-scale-layout';
import {
  GRAPH_EXPLORER_EDGE_SHADER,
  GRAPH_EXPLORER_NODE_SHADER,
  GRAPH_EXPLORER_PICKING_SHADER,
  GRAPH_EXPLORER_VIEW_BYTE_LENGTH
} from './graph-shaders';

export const title = 'luGraph GPU Graph Explorer';
export const description =
  'GPU-resident graph analytics, progressive force layout, neighborhood selection, and direct node/edge rendering.';

const MAXIMUM_NEIGHBORHOOD_DEPTH = 6;
const INITIAL_NEIGHBORHOOD_DEPTH = 2;
const INVALID_VERTEX = 0xffffffff;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

type ScalarVectorFormat = 'uint32' | 'float32';

type FrameParameters = {
  width: number;
  height: number;
};

type PickingParameters = {
  pixel: readonly [number, number];
};

type EdgeModel = {
  model: Model;
  chunkIndex: number;
};

type GraphExplorerAnimationProps = AnimationProps & {
  dataset?: GraphExplorerDataset;
  vertexCount?: number;
  layoutMode?: GraphExplorerLayoutMode;
  pointMode?: boolean;
  maxVisibleEdges?: number;
};

/** Interactive browser-native graph exploration with no per-frame graph readback. */
export default class LuGraphExplorerAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  graph!: LuGraph;
  topology!: LuGraphTopology;
  degree!: LuGraphDegree;
  pageRank!: LuGraphPageRank;
  components!: LuGraphConnectedComponents;
  communities!: LuGraphLabelPropagation;
  search!: LuGraphBreadthFirstSearch;
  layout!: LuGraphForceLayout;
  spatialLayout: LuGraphSpatialForceLayout | null = null;
  activeLayoutMode: 'exact' | 'spatial' | 'sampled' = 'exact';
  pointMode = false;
  nodeModel!: Model;
  pickingModel!: Model;
  edgeModels!: EdgeModel[];
  analysisGraph!: CompiledGPUCommandGraph<void>;
  frameGraph!: CompiledGPUCommandGraph<FrameParameters>;
  pickingGraph!: CompiledGPUCommandGraph<PickingParameters>;
  private searchGraph: CompiledGPUCommandGraph<void> | null = null;
  private readonly analysisStages: CompiledGPUCommandGraph<void>[] = [];

  private readonly buffers: Buffer[] = [];
  private readonly vectors: GPUVector[] = [];
  private readonly viewUniforms: Buffer;
  private readonly readbackRing: GPUReadbackRing;
  private readonly panels: ExamplePanelManager;
  private readonly pointModeOverride: boolean | undefined;
  private readonly maxVisibleEdges: number;
  private seeds!: GPUVector<'uint32'>;
  private seedCount!: GPUVector<'uint32'>;
  private activeDepth!: GPUVector<'uint32'>;
  private pinned!: GPUVector<'uint32'>;
  private reset!: GPUVector<'uint32'>;
  private neighborhoodMask!: GPUVector<'uint32'>;

  private frameColorId = '';
  private frameDepthId = '';
  private pickingReadbackId = '';
  private frameWidth = 1;
  private frameHeight = 1;
  private frameIndex = 0;
  private analyticsPending = true;
  private nextAnalysisStage = 0;
  private searchPending = true;
  private selectedVertex: number | null = 0;
  private pendingPick: readonly [number, number] | null = null;
  private pendingPickSession: number | null = null;
  private pointerSession = 0;
  private activePointerId: number | null = null;
  private dragPickResolved = false;
  private dragVertex: number | null = null;
  private finalized = false;
  private neighborhoodDepth = INITIAL_NEIGHBORHOOD_DEPTH;
  private centerX = 0;
  private centerY = 0;
  private zoom = 0.42;
  private dragging = false;
  private lastPointer: [number, number] | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private statusElement: HTMLElement | null = null;
  private graphSizeElement: HTMLElement | null = null;
  private controlsRoot: HTMLElement | null = null;
  private layoutMode: GraphExplorerLayoutMode = 'auto';
  private colorMode: GraphExplorerColorMode = 'community';
  private nodeSizeMode: GraphExplorerNodeSizeMode = 'pagerank';
  private edgesVisible = true;
  private paused = false;
  private lastFrameTimestamp = 0;
  private lastStatusTimestamp = 0;
  private frameRate = 0;
  private cpuEncodeMilliseconds = 0;

  constructor({
    device,
    dataset,
    vertexCount,
    layoutMode,
    pointMode,
    maxVisibleEdges
  }: GraphExplorerAnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('luGraph GPU Graph Explorer requires WebGPU');
    }
    this.device = device;
    this.layoutMode = layoutMode ?? 'auto';
    this.pointModeOverride = pointMode;
    this.maxVisibleEdges = maxVisibleEdges ?? GRAPH_EXPLORER_MAX_VISIBLE_EDGES;
    this.viewUniforms = device.createBuffer({
      id: 'lugraph-explorer-view',
      byteLength: GRAPH_EXPLORER_VIEW_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.readbackRing = new GPUReadbackRing(device, {
      id: 'lugraph-explorer-picking-readback',
      byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
      slotCount: 2
    });

    const initialDataset =
      dataset ??
      makeGraphExplorerDataset(vertexCount ?? GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT);
    const unsupportedGraphReason = this.getUnsupportedGraphReason(initialDataset);
    if (unsupportedGraphReason) {
      this.readbackRing.destroy();
      this.viewUniforms.destroy();
      throw new Error(unsupportedGraphReason);
    }
    this.initializeGraph(initialDataset);
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'lugraph-explorer-controls',
        title: 'GPU Graph Explorer',
        html: this.getControlsHtml(),
        onRender: root => this.attachControls(root)
      })
    });
    this.panels.mount();
    // Reveal this showcase's analytics once without changing another example or reopening a
    // panel that its user subsequently chooses to collapse.
    if (typeof document !== 'undefined') {
      document
        .getElementById('example-panel-host')
        ?.closest<HTMLElement>('[data-info-box-appearance]')
        ?.querySelector<HTMLButtonElement>(
          'button[aria-label="Expand info box"][aria-expanded="false"]'
        )
        ?.click();
    }
    this.writeViewUniforms(this.frameWidth, this.frameHeight);
  }

  /** Every source-aligned resident node remains an actual rendered GPU instance. */
  get renderedVertexCount(): number {
    return this.graph.vertexCount;
  }

  /** Visible original edge instances are honestly bounded without changing resident rows. */
  get renderedEdgeCount(): number {
    return this.edgeModels.reduce((total, {model}) => total + model.instanceCount, 0);
  }

  /** Replaces one complete caller-owned scene without reusing stale source IDs or allocations. */
  resizeGraph(vertexCount: number): void {
    if (this.finalized) return;
    const dataset = makeGraphExplorerDataset(vertexCount);
    const unsupportedGraphReason = this.getUnsupportedGraphReason(dataset);
    if (unsupportedGraphReason) {
      this.syncGraphControls();
      if (this.statusElement) this.statusElement.textContent = unsupportedGraphReason;
      return;
    }
    this.pointerSession++;
    this.activePointerId = null;
    this.dragPickResolved = false;
    this.dragVertex = null;
    this.pendingPick = null;
    this.pendingPickSession = null;
    this.dragging = false;
    this.selectedVertex = 0;
    this.destroyGraph();
    this.initializeGraph(dataset);
    this.writeViewUniforms(this.frameWidth, this.frameHeight);
    this.syncGraphControls();
    this.updateStatus();
  }

  /** Rejects impossible allocations before replacing the existing caller-owned GPU graph. */
  private getUnsupportedGraphReason(dataset: GraphExplorerDataset): string | null {
    const edgeCount = dataset.sourceChunks.reduce((count, source) => count + source.length, 0);
    const requiredBufferBytes = Math.max(
      dataset.positions.byteLength,
      dataset.velocities.byteLength,
      (dataset.vertexCount + 1) * UINT32_BYTE_LENGTH,
      edgeCount * UINT32_BYTE_LENGTH
    );
    const maximumBufferBytes = Math.min(
      this.device.limits.maxStorageBufferBindingSize,
      this.device.limits.maxBufferSize
    );
    if (requiredBufferBytes <= maximumBufferBytes) return null;
    const requiredMebibytes = (requiredBufferBytes / 1024 ** 2).toFixed(1);
    const supportedMebibytes = (maximumBufferBytes / 1024 ** 2).toFixed(1);
    return (
      `${dataset.vertexCount.toLocaleString()} vertices require a ${requiredMebibytes} MiB ` +
      `storage buffer; this WebGPU adapter supports ${supportedMebibytes} MiB. ` +
      'The current graph remains active.'
    );
  }

  /** Builds exact source-preserving analytics and an adaptively bounded layout scene. */
  private initializeGraph(dataset: GraphExplorerDataset): void {
    const isLinearScale = dataset.vertexCount >= GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT;
    this.pointMode =
      this.pointModeOverride ?? dataset.vertexCount >= GRAPH_EXPLORER_POINT_VERTEX_COUNT;
    const sourceVertices = this.createChunkedVector('source-vertices', dataset.sourceChunks);
    const targetVertices = this.createChunkedVector('target-vertices', dataset.targetChunks);
    this.graph = new LuGraph({
      vertexCount: dataset.vertexCount,
      sourceVertices,
      targetVertices,
      directed: true
    });

    const forward = this.createAdjacency('forward', dataset.vertexCount, this.graph.edgeCount);
    const reverse = this.createAdjacency('reverse', dataset.vertexCount, this.graph.edgeCount);
    this.topology = new LuGraphTopology({
      id: 'lugraph-explorer-topology',
      graph: this.graph,
      forward,
      reverse,
      invalidEdgeCount: this.createScalarVector('invalid-edges', 'uint32', 1)
    });

    this.degree = new LuGraphDegree({
      id: 'lugraph-explorer-degree',
      topology: this.topology,
      output: this.createScalarVector('vertex-degrees', 'uint32', dataset.vertexCount)
    });
    this.pageRank = new LuGraphPageRank({
      id: 'lugraph-explorer-page-rank',
      topology: this.topology,
      output: this.createScalarVector('vertex-importance', 'float32', dataset.vertexCount),
      residual: this.createScalarVector('rank-residual', 'float32', 1),
      iterations: isLinearScale
        ? 2
        : dataset.vertexCount > GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT
          ? 8
          : 16
    });
    this.components = new LuGraphConnectedComponents({
      id: 'lugraph-explorer-components',
      topology: this.topology,
      output: this.createScalarVector('vertex-components', 'uint32', dataset.vertexCount),
      converged: this.createScalarVector('components-converged', 'uint32', 1),
      iterations: isLinearScale ? 4 : 12
    });
    this.communities = new LuGraphLabelPropagation({
      id: 'lugraph-explorer-communities',
      topology: this.topology,
      output: this.createScalarVector('community-labels', 'uint32', dataset.vertexCount),
      converged: this.createScalarVector('communities-converged', 'uint32', 1),
      iterations: isLinearScale ? 2 : 8
    });

    this.seeds = this.createScalarVector('selected-vertices', 'uint32', 1, [0]);
    this.seedCount = this.createScalarVector('selected-vertex-count', 'uint32', 1, [1]);
    this.activeDepth = this.createScalarVector('active-neighborhood-depth', 'uint32', 1, [
      this.neighborhoodDepth
    ]);
    this.neighborhoodMask = this.createScalarVector(
      'selected-neighborhood',
      'uint32',
      dataset.vertexCount
    );
    this.search = new LuGraphBreadthFirstSearch({
      id: 'lugraph-explorer-neighborhood',
      topology: this.topology,
      seeds: this.seeds,
      seedCount: this.seedCount,
      distances: this.createScalarVector('vertex-distances', 'uint32', dataset.vertexCount),
      predecessors: this.createScalarVector('vertex-predecessors', 'uint32', dataset.vertexCount),
      mask: this.neighborhoodMask,
      maxDepth: MAXIMUM_NEIGHBORHOOD_DEPTH,
      activeDepth: this.activeDepth,
      direction: 'both'
    });

    const positions = this.createCoordinateVector(
      'vertex-positions',
      dataset.positions,
      Buffer.VERTEX
    );
    const velocities = this.createCoordinateVector('vertex-velocities', dataset.velocities);
    this.pinned = this.createScalarVector('pinned-vertices', 'uint32', dataset.vertexCount);
    this.reset = this.createScalarVector('reset-layout', 'uint32', 1, [0]);
    const useSampledForce = this.layoutMode === 'sampled' || isLinearScale;
    this.layout = new LuGraphForceLayout({
      id: 'lugraph-explorer-layout',
      topology: this.topology,
      positions,
      velocities,
      pinned: this.pinned,
      reset: this.reset,
      seed: 0x1a2b3c4d,
      iterationsPerFrame: dataset.vertexCount > GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT ? 1 : 2,
      repulsion: useSampledForce ? 0.0015 : 0.005 * Math.min(1, 128 / dataset.vertexCount),
      attraction: useSampledForce ? 0.04 : 0.045,
      gravity: useSampledForce ? 0.005 : 0.025,
      damping: useSampledForce ? 0.9 : 0.85,
      maxVelocity: dataset.vertexCount > GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT ? 0.025 : 0.045
    });

    this.activeLayoutMode = useSampledForce
      ? 'sampled'
      : this.layoutMode === 'spatial' ||
          dataset.vertexCount > GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT
        ? 'spatial'
        : 'exact';
    const useSpatialLayout = this.activeLayoutMode === 'spatial';
    if (useSpatialLayout) {
      const gridSize = getGraphExplorerGridSize(dataset.vertexCount);
      const cellCount = gridSize[0] * gridSize[1];
      this.spatialLayout = new LuGraphSpatialForceLayout({
        id: 'lugraph-explorer-spatial-layout',
        layout: this.layout,
        gridSize,
        bounds: GRAPH_EXPLORER_SPATIAL_BOUNDS,
        theta: 0.65,
        nearCellRadius: 1,
        cellOffsets: this.createScalarVector('spatial-cell-offsets', 'uint32', cellCount + 1),
        vertexIds: this.createScalarVector('spatial-vertex-ids', 'uint32', dataset.vertexCount),
        cellCenters: this.createCoordinateVector(
          'spatial-cell-centers',
          new Float32Array(cellCount * 2)
        ),
        count: this.createScalarVector('spatial-accepted-count', 'uint32', 1),
        overflow: this.createScalarVector('spatial-overflow', 'uint32', 1)
      });
    } else {
      this.spatialLayout = null;
    }

    this.nodeModel = this.createNodeModel();
    this.pickingModel = this.createPickingModel();
    this.edgeModels = this.createEdgeModels();
    this.analysisGraph = this.createAnalysisGraph();
    this.searchGraph = isLinearScale ? this.createSearchGraph() : null;

    const [width, height] = this.getDeviceSize();
    this.frameGraph = this.createFrameGraph(width, height);
    this.pickingGraph = this.createPickingGraph(width, height);
    this.analyticsPending = true;
    this.nextAnalysisStage = 0;
    this.searchPending = true;
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerup', this.handlePointerUp);
      canvas.addEventListener('pointercancel', this.handlePointerUp);
      canvas.addEventListener('wheel', this.handleWheel, {passive: false});
    }
  }

  override onRender({device}: AnimationProps): void {
    const frameStartedAt = performance.now();
    let cpuEncodeMilliseconds = 0;
    if (this.lastFrameTimestamp > 0) {
      const elapsed = frameStartedAt - this.lastFrameTimestamp;
      if (elapsed > 0) this.frameRate = 1000 / elapsed;
    }
    this.lastFrameTimestamp = frameStartedAt;
    const [width, height] = this.getDeviceSize();
    if (width !== this.frameWidth || height !== this.frameHeight) {
      this.frameGraph.destroy();
      this.pickingGraph.destroy();
      this.frameGraph = this.createFrameGraph(width, height);
      this.pickingGraph = this.createPickingGraph(width, height);
    }
    this.writeViewUniforms(width, height);

    if (this.analyticsPending) {
      const encoding = this.analysisGraph.encode(device.commandEncoder, {parameters: undefined});
      cpuEncodeMilliseconds += encoding.stats.cpuEncodeTimeMilliseconds;
      this.analyticsPending = false;
    } else if (this.nextAnalysisStage < this.analysisStages.length) {
      const encoding = this.analysisStages[this.nextAnalysisStage++].encode(device.commandEncoder, {
        parameters: undefined
      });
      cpuEncodeMilliseconds += encoding.stats.cpuEncodeTimeMilliseconds;
    }
    if (this.searchGraph && this.searchPending) {
      const encoding = this.searchGraph.encode(device.commandEncoder, {parameters: undefined});
      cpuEncodeMilliseconds += encoding.stats.cpuEncodeTimeMilliseconds;
      this.searchPending = false;
    }

    const framebuffer = device
      .getDefaultCanvasContext()
      .getCurrentFramebuffer({depthStencilFormat: 'depth24plus'});
    const frameEncoding = this.frameGraph.encode(device.commandEncoder, {
      parameters: {width, height},
      frameTextures: {
        [this.frameColorId]: {
          texture: framebuffer.colorAttachments[0].texture,
          frameId: this.frameIndex
        },
        [this.frameDepthId]: {
          texture: framebuffer.depthStencilAttachment!.texture,
          frameId: this.frameIndex
        }
      }
    });
    cpuEncodeMilliseconds += frameEncoding.stats.cpuEncodeTimeMilliseconds;

    if (this.pendingPick) {
      const ticket = this.readbackRing.tryAcquire();
      if (ticket) {
        const pixel = this.pendingPick;
        const pointerSession = this.pendingPickSession;
        this.pendingPick = null;
        this.pendingPickSession = null;
        const encoding = this.pickingGraph.encode(device.commandEncoder, {
          parameters: {pixel},
          buffers: {[this.pickingReadbackId]: ticket.buffer}
        });
        cpuEncodeMilliseconds += encoding.stats.cpuEncodeTimeMilliseconds;
        ticket.markEncoded({byteLength: 8});
        queueMicrotask(() => void this.readPickedVertex(ticket, pointerSession ?? undefined));
      }
    }
    this.frameIndex++;
    this.cpuEncodeMilliseconds = cpuEncodeMilliseconds;
    if (frameStartedAt - this.lastStatusTimestamp >= 250) {
      this.lastStatusTimestamp = frameStartedAt;
      this.updateStatus();
    }
  }

  override onFinalize(): void {
    this.finalized = true;
    this.pointerSession++;
    this.activePointerId = null;
    this.dragPickResolved = false;
    this.dragVertex = null;
    this.pendingPick = null;
    this.pendingPickSession = null;
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      this.canvas.removeEventListener('wheel', this.handleWheel);
    }
    this.panels.finalize();
    this.destroyGraph();
    this.readbackRing.destroy();
    this.viewUniforms.destroy();
  }

  /** Releases graph-owned models and buffers exactly once while preserving the shared UI host. */
  private destroyGraph(): void {
    this.analysisGraph.destroy();
    this.frameGraph.destroy();
    this.pickingGraph.destroy();
    this.searchGraph?.destroy();
    this.searchGraph = null;
    for (const stage of this.analysisStages) stage.destroy();
    this.analysisStages.length = 0;
    for (const {model} of this.edgeModels) model.destroy();
    this.nodeModel.destroy();
    this.pickingModel.destroy();
    for (const vector of this.vectors) vector.destroy();
    for (const buffer of this.buffers) buffer.destroy();
    this.vectors.length = 0;
    this.buffers.length = 0;
    this.edgeModels.length = 0;
    this.spatialLayout = null;
  }

  /** Builds persistent analytics once; animation never reruns PageRank or components. */
  private createAnalysisGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'lugraph-explorer-analysis'});
    this.topology.addToGraph(graph);
    this.degree.addToGraph(graph);
    if (this.graph.vertexCount >= GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT) {
      for (const [name, contributor] of [
        ['components', this.components],
        ['communities', this.communities],
        ['page-rank', this.pageRank]
      ] as const) {
        const stage = new GPUCommandGraph<void>(this.device, {
          id: `lugraph-explorer-${name}-analysis`
        });
        contributor.addToGraph(stage);
        this.analysisStages.push(stage.compile());
      }
    } else {
      this.components.addToGraph(graph);
      this.communities.addToGraph(graph);
      this.pageRank.addToGraph(graph);
    }
    return graph.compile();
  }

  /** Million-scale traversal runs only when a real selection or depth changes. */
  private createSearchGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'lugraph-explorer-search'});
    this.search.addToGraph(graph);
    return graph.compile();
  }

  /** Composes GPU-resident layout, dynamic neighborhood search, and direct chunked rendering. */
  private createFrameGraph(
    width: number,
    height: number
  ): CompiledGPUCommandGraph<FrameParameters> {
    this.frameWidth = width;
    this.frameHeight = height;
    const graph = new GPUCommandGraph<FrameParameters>(this.device, {
      id: 'lugraph-explorer-frame'
    });
    if (!this.paused) {
      if (this.activeLayoutMode === 'sampled') {
        addGraphExplorerSampledLayoutToGraph(graph, this.layout);
      } else if (this.spatialLayout) {
        this.spatialLayout.addToGraph(graph);
      } else {
        this.layout.addToGraph(graph);
      }
    }
    if (!this.searchGraph) this.search.addToGraph(graph);

    const positions = graph.importGPUVector('render-positions', this.layout.positions).data[0];
    const importance = graph.importGPUVector('render-importance', this.pageRank.output).data[0];
    const componentLabels = graph.importGPUVector('render-components', this.components.output)
      .data[0];
    const communityLabels = graph.importGPUVector('render-communities', this.communities.output)
      .data[0];
    const degrees = graph.importGPUVector('render-degrees', this.degree.output).data[0];
    const distances = graph.importGPUVector('render-distances', this.search.distances).data[0];
    const mask = graph.importGPUVector('render-neighborhood', this.neighborhoodMask).data[0];
    const sourceVertices = graph.importGPUVector('render-sources', this.graph.sourceVertices);
    const targetVertices = graph.importGPUVector('render-targets', this.graph.targetVertices);
    const view = graph.importBuffer(
      {
        id: 'render-view',
        byteLength: this.viewUniforms.byteLength,
        usage: this.viewUniforms.usage
      },
      this.viewUniforms
    );
    const color = graph.importFrameTexture({
      id: 'lugraph-frame-color',
      format: this.device.preferredColorFormat,
      width,
      height,
      usage: Texture.RENDER
    });
    const depth = graph.importFrameTexture({
      id: 'lugraph-frame-depth',
      format: 'depth24plus',
      width,
      height,
      usage: Texture.RENDER
    });
    this.frameColorId = color.id;
    this.frameDepthId = depth.id;

    const resources: GraphBufferUse[] = [
      {buffer: positions, usage: 'storage-read'},
      {buffer: importance, usage: 'storage-read'},
      {buffer: componentLabels, usage: 'storage-read'},
      {buffer: communityLabels, usage: 'storage-read'},
      {buffer: degrees, usage: 'storage-read'},
      {buffer: distances, usage: 'storage-read'},
      {buffer: mask, usage: 'storage-read'},
      {buffer: view, usage: 'uniform'}
    ];
    for (const {chunkIndex} of this.edgeModels) {
      resources.push(
        {buffer: sourceVertices.data[chunkIndex], usage: 'storage-read'},
        {buffer: targetVertices.data[chunkIndex], usage: 'storage-read'}
      );
    }
    graph.addRenderPass({
      id: 'lugraph-render-edges-and-vertices',
      attachments: {
        colorAttachments: [graph.createTextureView(color)],
        depthStencilAttachment: graph.createTextureView(depth)
      },
      resources,
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'lugraph-explorer-render',
          clearColor: [0.016, 0.022, 0.045, 1],
          clearDepth: 1,
          clearStencil: false
        }),
        encode: ({renderPass}) => {
          if (this.edgesVisible) {
            for (const {model} of this.edgeModels) model.draw(renderPass);
          }
          this.nodeModel.draw(renderPass);
        }
      })
    });
    return graph.compile();
  }

  /** Compiles event-driven integer picking; no staging buffer is read during ordinary frames. */
  private createPickingGraph(
    width: number,
    height: number
  ): CompiledGPUCommandGraph<PickingParameters> {
    const graph = new GPUCommandGraph<PickingParameters>(this.device, {
      id: 'lugraph-explorer-picking'
    });
    const positions = graph.importGPUVector('picking-positions', this.layout.positions).data[0];
    const importance = graph.importGPUVector('picking-importance', this.pageRank.output).data[0];
    const degrees = graph.importGPUVector('picking-degrees', this.degree.output).data[0];
    const view = graph.importBuffer(
      {
        id: 'picking-view',
        byteLength: this.viewUniforms.byteLength,
        usage: this.viewUniforms.usage
      },
      this.viewUniforms
    );
    const target = new GPUIndexPickingTarget(graph, {
      id: 'lugraph-vertex-picking',
      width,
      height
    });
    const renderId = 'lugraph-render-picking';
    graph.addRenderPass({
      id: renderId,
      attachments: target.attachments,
      resources: [
        {buffer: positions, usage: 'vertex'},
        {buffer: importance, usage: 'storage-read'},
        {buffer: degrees, usage: 'storage-read'},
        {buffer: view, usage: 'uniform'}
      ],
      compile: () => ({
        getRenderPassProps: () => target.renderPassProps,
        encode: ({renderPass}) => {
          this.pickingModel.draw(renderPass);
        }
      })
    });
    target.addReadbackPass({after: renderId, getPixel: parameters => parameters.pixel});
    this.pickingReadbackId = target.readback.id;
    return graph.compile();
  }

  /** Binds progressive positions as real instance vertex attributes without copying. */
  private createNodeModel(): Model {
    return new Model(this.device, {
      id: 'lugraph-explorer-nodes',
      source: GRAPH_EXPLORER_NODE_SHADER,
      topology: this.pointMode ? 'point-list' : 'triangle-list',
      vertexCount: this.pointMode ? 1 : 6,
      isInstanced: true,
      instanceCount: this.graph.vertexCount,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      attributes: {nodePosition: this.getVectorBuffer(this.layout.positions)},
      bufferLayout: [{name: 'nodePosition', format: 'float32x2', stepMode: 'instance'}],
      bindings: {
        importance: this.getVectorBuffer(this.pageRank.output),
        components: this.getVectorBuffer(this.components.output),
        communities: this.getVectorBuffer(this.communities.output),
        degrees: this.getVectorBuffer(this.degree.output),
        distances: this.getVectorBuffer(this.search.distances),
        selectionMask: this.getVectorBuffer(this.neighborhoodMask),
        view: this.viewUniforms
      },
      shaderLayout: {
        attributes: [{name: 'nodePosition', location: 0, type: 'vec2<f32>'}],
        bindings: [
          {name: 'importance', type: 'read-only-storage', group: 0, location: 0},
          {name: 'components', type: 'read-only-storage', group: 0, location: 1},
          {name: 'communities', type: 'read-only-storage', group: 0, location: 2},
          {name: 'degrees', type: 'read-only-storage', group: 0, location: 3},
          {name: 'distances', type: 'read-only-storage', group: 0, location: 4},
          {name: 'selectionMask', type: 'read-only-storage', group: 0, location: 5},
          {name: 'view', type: 'uniform', group: 0, location: 6}
        ]
      },
      parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
    });
  }

  /** Uses original GPUData chunks directly; no edge source buffers are packed or copied. */
  private createEdgeModels(): EdgeModel[] {
    const edgeModels: EdgeModel[] = [];
    const nonEmptyChunks = this.graph.sourceVertices.data.filter(chunk => chunk.length > 0).length;
    let remainingVisibleEdges = this.maxVisibleEdges;
    for (const [chunkIndex, source] of this.graph.sourceVertices.data.entries()) {
      if (source.length === 0 || remainingVisibleEdges <= 0) continue;
      const visibleEdges = Math.min(
        source.length,
        remainingVisibleEdges,
        Math.ceil(this.maxVisibleEdges / nonEmptyChunks)
      );
      remainingVisibleEdges -= visibleEdges;
      const target = this.graph.targetVertices.data[chunkIndex];
      edgeModels.push({
        chunkIndex,
        model: new Model(this.device, {
          id: `lugraph-explorer-edges-${chunkIndex}`,
          source: GRAPH_EXPLORER_EDGE_SHADER,
          topology: 'line-list',
          vertexCount: 2,
          isInstanced: true,
          instanceCount: visibleEdges,
          colorAttachmentFormats: [this.device.preferredColorFormat],
          depthStencilAttachmentFormat: 'depth24plus',
          bindings: {
            positions: this.getVectorBuffer(this.layout.positions),
            sourceVertices: source.buffer,
            targetVertices: target.buffer,
            distances: this.getVectorBuffer(this.search.distances),
            view: this.viewUniforms
          },
          shaderLayout: {
            attributes: [],
            bindings: [
              {name: 'positions', type: 'read-only-storage', group: 0, location: 0},
              {name: 'sourceVertices', type: 'read-only-storage', group: 0, location: 1},
              {name: 'targetVertices', type: 'read-only-storage', group: 0, location: 2},
              {name: 'distances', type: 'read-only-storage', group: 0, location: 3},
              {name: 'view', type: 'uniform', group: 0, location: 4}
            ]
          },
          parameters: {depthCompare: 'less-equal', depthWriteEnabled: false}
        })
      });
    }
    return edgeModels;
  }

  /** Writes stable node identifiers into the existing integer picking target. */
  private createPickingModel(): Model {
    return new Model(this.device, {
      id: 'lugraph-explorer-picking-nodes',
      source: GRAPH_EXPLORER_PICKING_SHADER,
      topology: this.pointMode ? 'point-list' : 'triangle-list',
      vertexCount: this.pointMode ? 1 : 6,
      isInstanced: true,
      instanceCount: this.graph.vertexCount,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      attributes: {nodePosition: this.getVectorBuffer(this.layout.positions)},
      bufferLayout: [{name: 'nodePosition', format: 'float32x2', stepMode: 'instance'}],
      bindings: {
        importance: this.getVectorBuffer(this.pageRank.output),
        degrees: this.getVectorBuffer(this.degree.output),
        view: this.viewUniforms
      },
      shaderLayout: {
        attributes: [{name: 'nodePosition', location: 0, type: 'vec2<f32>'}],
        bindings: [
          {name: 'importance', type: 'read-only-storage', group: 0, location: 0},
          {name: 'degrees', type: 'read-only-storage', group: 0, location: 1},
          {name: 'view', type: 'uniform', group: 0, location: 2}
        ]
      },
      parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
    });
  }

  /** Preserves every edge batch, including empty partitions and borrowed buffer ownership. */
  private createChunkedVector(name: string, chunks: Uint32Array[]): GPUVector<'uint32'> {
    const data = chunks.map((values, chunkIndex) => {
      const buffer = this.device.createBuffer({
        id: `lugraph-explorer-${name}-${chunkIndex}`,
        data: values.length > 0 ? values : new Uint32Array(1),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      this.buffers.push(buffer);
      return new GPUData<'uint32'>({
        buffer,
        format: 'uint32',
        length: values.length,
        ownsBuffer: false
      });
    });
    const vector = new GPUVector<'uint32'>({
      type: 'data',
      name,
      format: 'uint32',
      data,
      ownsData: false
    });
    this.vectors.push(vector);
    return vector;
  }

  /** Creates one caller-owned packed scalar column or status without implicit transfers. */
  private createScalarVector<Format extends ScalarVectorFormat>(
    name: string,
    format: Format,
    length: number,
    values?: number[]
  ): GPUVector<Format> {
    const buffer = this.device.createBuffer({
      id: `lugraph-explorer-${name}`,
      byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    if (values?.length) {
      buffer.write(format === 'float32' ? Float32Array.from(values) : Uint32Array.from(values));
    }
    this.buffers.push(buffer);
    const vector = new GPUVector<Format>({
      type: 'buffer',
      name,
      format,
      buffer,
      length,
      ownsBuffer: false
    });
    this.vectors.push(vector);
    return vector;
  }

  /** Creates caller-owned progressive simulation state, optionally directly vertex-bindable. */
  private createCoordinateVector(
    name: string,
    values: Float32Array,
    additionalUsage = 0
  ): GPUVector<'float32x2'> {
    const buffer = this.device.createBuffer({
      id: `lugraph-explorer-${name}`,
      data: values,
      usage: Buffer.STORAGE | Buffer.COPY_DST | additionalUsage
    });
    this.buffers.push(buffer);
    const vector = new GPUVector<'float32x2'>({
      type: 'buffer',
      name,
      format: 'float32x2',
      buffer,
      length: values.length / 2,
      ownsBuffer: false
    });
    this.vectors.push(vector);
    return vector;
  }

  /** Allocates every caller-owned topology/status vector without aliasing graph sources. */
  private createAdjacency(name: string, vertexCount: number, capacity: number): LuGraphAdjacency {
    return {
      offsets: this.createScalarVector(`${name}-offsets`, 'uint32', vertexCount + 1),
      neighbors: this.createScalarVector(`${name}-neighbors`, 'uint32', capacity),
      edgeIds: this.createScalarVector(`${name}-edge-ids`, 'uint32', capacity),
      count: this.createScalarVector(`${name}-count`, 'uint32', 1),
      overflow: this.createScalarVector(`${name}-overflow`, 'uint32', 1)
    };
  }

  private getVectorBuffer(vector: GPUVector): Buffer {
    return vector.data[0].buffer as Buffer;
  }

  private getDeviceSize(): [number, number] {
    const [width, height] = this.device.getDefaultCanvasContext().getDevicePixelSize();
    return [Math.max(width, 1), Math.max(height, 1)];
  }

  private writeViewUniforms(width: number, height: number): void {
    const values = new ArrayBuffer(GRAPH_EXPLORER_VIEW_BYTE_LENGTH);
    new Float32Array(values, 0, 4).set([
      this.centerX,
      this.centerY,
      this.zoom,
      width / Math.max(height, 1)
    ]);
    new Uint32Array(values, 16, 4).set([
      this.selectedVertex ?? INVALID_VERTEX,
      this.neighborhoodDepth,
      this.graph.vertexCount,
      (this.dragging ? 1 : 0) |
        (['community', 'component', 'degree', 'pagerank', 'distance'].indexOf(this.colorMode) <<
          1) |
        (['pagerank', 'degree', 'uniform'].indexOf(this.nodeSizeMode) << 4) |
        (Number(this.pointMode) << 6)
    ]);
    this.viewUniforms.write(new Uint8Array(values));
  }

  private async readPickedVertex(
    ticket: GPUReadbackTicket,
    pointerSession: number = this.pointerSession
  ): Promise<void> {
    try {
      const pickedVertex = decodeGPUIndexPickInfo(await ticket.read()).objectIndex;
      if (this.finalized || pointerSession !== this.pointerSession) return;
      this.selectedVertex = pickedVertex;
      if (this.dragging && this.activePointerId !== null) {
        this.dragPickResolved = true;
        this.dragVertex = pickedVertex;
      }
      if (pickedVertex === null) {
        this.getVectorBuffer(this.seedCount).write(Uint32Array.of(0));
      } else {
        this.getVectorBuffer(this.seeds).write(Uint32Array.of(pickedVertex));
        this.getVectorBuffer(this.seedCount).write(Uint32Array.of(1));
      }
      this.searchPending = true;
      this.updateStatus();
    } catch {
      // Device loss or cancellation releases the staging slot without changing selection.
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.canvas || this.finalized) return;
    this.pointerSession++;
    this.activePointerId = event.pointerId;
    this.dragPickResolved = false;
    this.dragVertex = null;
    this.dragging = true;
    this.lastPointer = [event.clientX, event.clientY];
    this.canvas.style.cursor = 'grabbing';
    this.canvas.setPointerCapture(event.pointerId);
    const devicePixels = this.device
      .getDefaultCanvasContext()
      .cssToDevicePixels([event.offsetX, event.offsetY], false);
    this.pendingPick = [
      Math.max(0, Math.min(this.frameWidth - 1, devicePixels.x)),
      Math.max(0, Math.min(this.frameHeight - 1, devicePixels.y))
    ];
    this.pendingPickSession = this.pointerSession;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (
      !this.dragging ||
      !this.canvas ||
      !this.lastPointer ||
      event.pointerId !== this.activePointerId
    ) {
      return;
    }
    const previous = this.lastPointer;
    this.lastPointer = [event.clientX, event.clientY];
    if (!this.dragPickResolved && !event.shiftKey) return;
    if (this.dragVertex === null || event.shiftKey) {
      const rectangle = this.canvas.getBoundingClientRect();
      this.centerX -= (2 * (event.clientX - previous[0])) / (rectangle.height * this.zoom);
      this.centerY += (2 * (event.clientY - previous[1])) / (rectangle.height * this.zoom);
      return;
    }

    const rectangle = this.canvas.getBoundingClientRect();
    const aspect = rectangle.width / Math.max(rectangle.height, 1);
    const normalizedX = ((event.clientX - rectangle.left) / rectangle.width) * 2 - 1;
    const normalizedY = 1 - ((event.clientY - rectangle.top) / rectangle.height) * 2;
    const position = [
      this.centerX + (normalizedX * aspect) / this.zoom,
      this.centerY + normalizedY / this.zoom
    ];
    if (this.spatialLayout) {
      position[0] = Math.max(-1.9, Math.min(1.9, position[0]));
      position[1] = Math.max(-1.9, Math.min(1.9, position[1]));
    }
    this.getVectorBuffer(this.pinned).write(
      Uint32Array.of(1),
      this.dragVertex * UINT32_BYTE_LENGTH
    );
    this.getVectorBuffer(this.layout.positions).write(
      Float32Array.from(position),
      this.dragVertex * 2 * Float32Array.BYTES_PER_ELEMENT
    );
    this.getVectorBuffer(this.layout.velocities).write(
      Float32Array.of(0, 0),
      this.dragVertex * 2 * Float32Array.BYTES_PER_ELEMENT
    );
    this.updateStatus();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;
    if (this.canvas?.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.dragging = false;
    this.activePointerId = null;
    this.dragPickResolved = false;
    this.dragVertex = null;
    this.lastPointer = null;
    if (this.canvas) this.canvas.style.cursor = 'grab';
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.zoom = Math.max(0.08, Math.min(4, this.zoom * Math.exp(-event.deltaY * 0.001)));
    this.updateStatus();
  };

  private getControlsHtml(): string {
    const sizeIndex = Math.max(
      0,
      GRAPH_EXPLORER_VERTEX_COUNTS.indexOf(
        this.graph.vertexCount as (typeof GRAPH_EXPLORER_VERTEX_COUNTS)[number]
      )
    );
    return `<section data-graph-dashboard aria-label="Live GPU graph analytics"
        style="font:12px/1.55 system-ui,sans-serif;min-width:260px;max-width:340px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <strong style="font-size:15px;letter-spacing:.02em">Graph analytics</strong>
        <span style="padding:2px 8px;border:1px solid rgba(56,189,248,.45);border-radius:99px;
          color:#7dd3fc;font-size:10px">WEBGPU · LIVE</span>
      </div>
      <p style="margin:6px 0 12px;color:#a6bdd9">Real GPU topology, PageRank, majority-vote
        communities, neighborhood search, and adaptive force layout.</p>
      <label style="display:block;margin:9px 0">Graph population
        <strong data-graph-size-value style="float:right;color:#6ee7ff">${this.graph.vertexCount.toLocaleString()}</strong>
        <input data-graph-size aria-label="Graph vertex count" type="range" min="0"
          max="${GRAPH_EXPLORER_VERTEX_COUNTS.length - 1}" step="1" value="${sizeIndex}"
          style="display:block;width:100%;margin-top:5px" />
      </label>
      <label style="display:block;margin:9px 0">Layout algorithm
        <select data-layout-mode aria-label="Graph layout algorithm"
          style="display:block;width:100%;margin-top:4px">
          <option value="auto">Adaptive exact / spatial</option>
          <option value="exact">Exact pairwise (≤512)</option>
          <option value="spatial">Approximate spatial grid</option>
          <option value="sampled">Four-sample edge-aware force</option>
        </select>
      </label>
      <label style="display:block;margin:9px 0">Color nodes by
        <select data-color-mode aria-label="Node color metric"
          style="display:block;width:100%;margin-top:4px">
          <option value="community">GPU label communities</option>
          <option value="component">Weak components</option>
          <option value="degree">Vertex degree</option>
          <option value="pagerank">PageRank importance</option>
          <option value="distance">Neighborhood distance</option>
        </select>
      </label>
      <label style="display:block;margin:9px 0">Node size
        <select data-node-size aria-label="Node size metric"
          style="display:block;width:100%;margin-top:4px">
          <option value="pagerank">PageRank</option>
          <option value="degree">Degree</option>
          <option value="uniform">Uniform</option>
        </select>
      </label>
      <div data-graph-legend aria-label="GPU analytic color legend"
        style="display:flex;align-items:center;gap:5px;margin:10px 0;color:#a6bdd9">
        <span style="width:9px;height:9px;border-radius:50%;background:#42d8f4"></span>
        <span style="width:9px;height:9px;border-radius:50%;background:#ffb454"></span>
        <span style="width:9px;height:9px;border-radius:50%;background:#b794f6"></span>
        <span style="width:9px;height:9px;border-radius:50%;background:#62e59c"></span>
        <span style="width:9px;height:9px;border-radius:50%;background:#ff7892"></span>
        <span style="width:9px;height:9px;border-radius:50%;background:#ffe174"></span>
        <span style="width:9px;height:9px;border-radius:50%;background:#7caeff"></span>
        <span data-graph-legend-label style="margin-left:4px">GPU analytic groups</span>
      </div>
      <label style="display:block;margin:9px 0">Neighborhood depth
        <input data-depth aria-label="Neighborhood depth" type="range" min="0"
          max="${MAXIMUM_NEIGHBORHOOD_DEPTH}" value="${this.neighborhoodDepth}"
          style="display:block;width:100%" />
      </label>
      <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px">
        <button data-pause type="button" aria-pressed="false">Pause layout</button>
        <button data-edge-toggle type="button" aria-pressed="true">Hide edges</button>
        <button data-reset type="button">Reset</button>
        <button data-unpin type="button">Release pins</button>
      </div>
      <p data-status role="status" aria-live="polite"
        style="margin:12px 0 0;color:#b8d6ef;font-size:11px"></p>
      <p data-graph-adapter style="margin:7px 0 0;color:#8fb1cc;font-size:11px"></p>
      <p data-graph-memory style="margin:3px 0 0;color:#8fb1cc;font-size:11px"></p>
      <p data-graph-fps style="margin:3px 0 0;color:#8fb1cc;font-size:11px"></p>
      <p style="margin:9px 0 0;opacity:.68">Click to inspect · drag to pin · shift-drag to pan ·
      scroll to zoom. No per-frame graph readback.</p>
    </section>`;
  }

  private attachControls(root: HTMLElement): () => void {
    this.controlsRoot = root;
    const graphSize = root.querySelector<HTMLInputElement>('[data-graph-size]');
    const layoutMode = root.querySelector<HTMLSelectElement>('[data-layout-mode]');
    const colorMode = root.querySelector<HTMLSelectElement>('[data-color-mode]');
    const nodeSize = root.querySelector<HTMLSelectElement>('[data-node-size]');
    const edges = root.querySelector<HTMLButtonElement>('[data-edge-toggle]');
    const depth = root.querySelector<HTMLInputElement>('[data-depth]');
    const pause = root.querySelector<HTMLButtonElement>('[data-pause]');
    const reset = root.querySelector<HTMLButtonElement>('[data-reset]');
    const unpin = root.querySelector<HTMLButtonElement>('[data-unpin]');
    this.statusElement = root.querySelector('[data-status]');
    this.graphSizeElement = root.querySelector('[data-graph-size-value]');
    let pendingResizeFrame: number | null = null;
    let pendingResizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const previewGraphSize = () => {
      const size = GRAPH_EXPLORER_VERTEX_COUNTS[Number(graphSize?.value ?? 0)];
      if (size !== undefined && this.graphSizeElement) {
        this.graphSizeElement.textContent = size.toLocaleString();
      }
    };
    const updateGraphSize = () => {
      const size = GRAPH_EXPLORER_VERTEX_COUNTS[Number(graphSize?.value ?? 0)];
      if (size === undefined || size === this.graph.vertexCount) return;
      if (pendingResizeFrame !== null) cancelAnimationFrame(pendingResizeFrame);
      if (pendingResizeTimeout !== null) clearTimeout(pendingResizeTimeout);
      if (size < GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT) {
        this.resizeGraph(size);
        return;
      }
      if (this.statusElement) {
        this.statusElement.textContent = `Preparing ${size.toLocaleString()} real GPU vertices…`;
      }
      // Publish the actual target and let the browser paint before linear CPU upload generation.
      pendingResizeFrame = requestAnimationFrame(() => {
        pendingResizeFrame = null;
        pendingResizeTimeout = setTimeout(() => {
          pendingResizeTimeout = null;
          if (!this.finalized) this.resizeGraph(size);
        }, 0);
      });
    };
    const updateLayoutMode = () => {
      this.layoutMode = (layoutMode?.value ?? 'auto') as GraphExplorerLayoutMode;
      this.resizeGraph(this.graph.vertexCount);
    };
    const updateColorMode = () => {
      this.colorMode = (colorMode?.value ?? 'community') as GraphExplorerColorMode;
      this.updateStatus();
    };
    const updateNodeSize = () => {
      this.nodeSizeMode = (nodeSize?.value ?? 'pagerank') as GraphExplorerNodeSizeMode;
      this.updateStatus();
    };
    const updateEdges = () => {
      this.edgesVisible = !this.edgesVisible;
      if (edges) {
        edges.setAttribute('aria-pressed', String(this.edgesVisible));
        edges.textContent = this.edgesVisible ? 'Hide edges' : 'Show edges';
      }
      this.updateStatus();
    };
    const updateDepth = () => {
      this.neighborhoodDepth = Number(depth?.value ?? INITIAL_NEIGHBORHOOD_DEPTH);
      this.getVectorBuffer(this.activeDepth).write(Uint32Array.of(this.neighborhoodDepth));
      this.searchPending = true;
      this.updateStatus();
    };
    const resetLayout = () => {
      this.getVectorBuffer(this.reset).write(Uint32Array.of(1));
    };
    const clearPins = () => {
      this.getVectorBuffer(this.pinned).write(new Uint32Array(this.graph.vertexCount));
      this.updateStatus();
    };
    const togglePaused = () => {
      this.paused = !this.paused;
      if (pause) {
        pause.setAttribute('aria-pressed', String(this.paused));
        pause.textContent = this.paused ? 'Resume layout' : 'Pause layout';
      }
      this.frameGraph.destroy();
      this.frameGraph = this.createFrameGraph(this.frameWidth, this.frameHeight);
      this.updateStatus();
    };
    graphSize?.addEventListener('input', previewGraphSize);
    graphSize?.addEventListener('change', updateGraphSize);
    layoutMode?.addEventListener('change', updateLayoutMode);
    colorMode?.addEventListener('change', updateColorMode);
    nodeSize?.addEventListener('change', updateNodeSize);
    edges?.addEventListener('click', updateEdges);
    depth?.addEventListener('input', updateDepth);
    pause?.addEventListener('click', togglePaused);
    reset?.addEventListener('click', resetLayout);
    unpin?.addEventListener('click', clearPins);
    this.syncGraphControls();
    this.updateStatus();
    return () => {
      if (pendingResizeFrame !== null) cancelAnimationFrame(pendingResizeFrame);
      if (pendingResizeTimeout !== null) clearTimeout(pendingResizeTimeout);
      graphSize?.removeEventListener('input', previewGraphSize);
      graphSize?.removeEventListener('change', updateGraphSize);
      layoutMode?.removeEventListener('change', updateLayoutMode);
      colorMode?.removeEventListener('change', updateColorMode);
      nodeSize?.removeEventListener('change', updateNodeSize);
      edges?.removeEventListener('click', updateEdges);
      depth?.removeEventListener('input', updateDepth);
      pause?.removeEventListener('click', togglePaused);
      reset?.removeEventListener('click', resetLayout);
      unpin?.removeEventListener('click', clearPins);
      this.statusElement = null;
      this.graphSizeElement = null;
      this.controlsRoot = null;
    };
  }

  /** Keeps source-size controls and the exact-layout safety bound synchronized after rebuild. */
  private syncGraphControls(): void {
    if (this.graphSizeElement) {
      this.graphSizeElement.textContent = this.graph.vertexCount.toLocaleString();
    }
    const graphSize = this.controlsRoot?.querySelector<HTMLInputElement>('[data-graph-size]');
    const index = GRAPH_EXPLORER_VERTEX_COUNTS.indexOf(
      this.graph.vertexCount as (typeof GRAPH_EXPLORER_VERTEX_COUNTS)[number]
    );
    if (graphSize && index >= 0) graphSize.value = String(index);
    const layout = this.controlsRoot?.querySelector<HTMLSelectElement>('[data-layout-mode]');
    if (layout) layout.value = this.layoutMode;
    const exact = layout?.querySelector<HTMLOptionElement>('option[value="exact"]');
    if (exact) exact.disabled = this.graph.vertexCount > GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT;
    const spatial = layout?.querySelector<HTMLOptionElement>('option[value="spatial"]');
    if (spatial)
      spatial.disabled = this.graph.vertexCount >= GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT;
    const color = this.controlsRoot?.querySelector<HTMLSelectElement>('[data-color-mode]');
    if (color) color.value = this.colorMode;
    const nodeSize = this.controlsRoot?.querySelector<HTMLSelectElement>('[data-node-size]');
    if (nodeSize) nodeSize.value = this.nodeSizeMode;
    const edges = this.controlsRoot?.querySelector<HTMLButtonElement>('[data-edge-toggle]');
    if (edges) {
      edges.setAttribute('aria-pressed', String(this.edgesVisible));
      edges.textContent = this.edgesVisible ? 'Hide edges' : 'Show edges';
    }
    const pause = this.controlsRoot?.querySelector<HTMLButtonElement>('[data-pause]');
    if (pause) {
      pause.setAttribute('aria-pressed', String(this.paused));
      pause.textContent = this.paused ? 'Resume layout' : 'Pause layout';
    }
    const adapter = this.controlsRoot?.querySelector<HTMLElement>('[data-graph-adapter]');
    if (adapter) {
      const adapterName =
        this.device.info.vendor || this.device.info.renderer || this.device.info.gpu;
      adapter.textContent = `GPU adapter: ${adapterName} · ${this.device.info.gpuType} · WebGPU`;
    }
    const memory = this.controlsRoot?.querySelector<HTMLElement>('[data-graph-memory]');
    if (memory) {
      const residentBytes =
        this.buffers.reduce((total, buffer) => total + buffer.byteLength, 0) +
        this.viewUniforms.byteLength;
      const transientBytes =
        this.analysisGraph.stats.physicalTransientBytes +
        this.analysisStages.reduce(
          (total, stage) => total + stage.stats.physicalTransientBytes,
          0
        ) +
        (this.searchGraph?.stats.physicalTransientBytes ?? 0) +
        this.frameGraph.stats.physicalTransientBytes +
        this.pickingGraph.stats.physicalTransientBytes;
      memory.textContent =
        `GPU buffers: ${(residentBytes / 1024).toFixed(1)} KiB resident · ` +
        `${(transientBytes / 1024).toFixed(1)} KiB transient`;
    }
  }

  private updateStatus(): void {
    if (!this.statusElement) return;
    const selection = this.selectedVertex === null ? 'none' : String(this.selectedVertex);
    const layout =
      this.activeLayoutMode === 'sampled'
        ? 'sampled O(E + 4V)'
        : this.spatialLayout
          ? `spatial ${this.spatialLayout.gridSize[0]}×${this.spatialLayout.gridSize[1]}`
          : 'exact pairwise';
    const edges =
      this.renderedEdgeCount < this.graph.edgeCount
        ? `${this.renderedEdgeCount.toLocaleString()} / ${this.graph.edgeCount.toLocaleString()} visible edges`
        : `${this.graph.edgeCount.toLocaleString()} original edges`;
    const cadence = this.frameRate > 0 ? ` · ${Math.round(this.frameRate)} FPS` : '';
    const encoding =
      this.cpuEncodeMilliseconds > 0
        ? ` · CPU encode ${this.cpuEncodeMilliseconds.toFixed(1)}ms`
        : '';
    this.statusElement.textContent = `${this.graph.vertexCount.toLocaleString()} resident and rendered vertices · ${edges} · ${layout} · selected ${selection} · depth ${this.neighborhoodDepth}${cadence}${encoding}`;
    const legend = this.controlsRoot?.querySelector<HTMLElement>('[data-graph-legend-label]');
    if (legend) {
      const legends: Record<GraphExplorerColorMode, string> = {
        community: 'GPU label-propagation communities',
        component: 'GPU weakly connected components',
        degree: 'GPU-computed vertex degree',
        pagerank: 'GPU PageRank influence',
        distance: 'Bounded GPU traversal distance'
      };
      legend.textContent = legends[this.colorMode];
    }
    const frameRate = this.controlsRoot?.querySelector<HTMLElement>('[data-graph-fps]');
    if (frameRate) {
      frameRate.textContent =
        `${Math.round(this.frameRate)} FPS · ` +
        `${this.cpuEncodeMilliseconds.toFixed(2)} ms CPU command encoding`;
    }
  }
}
