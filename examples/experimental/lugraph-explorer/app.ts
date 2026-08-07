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
  LuGraphPageRank,
  LuGraphTopology,
  type LuGraphAdjacency
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {makeGraphExplorerDataset} from './graph-data';
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
type GraphExplorerColorMode = 'component' | 'degree' | 'pagerank' | 'distance';
type GraphExplorerNodeSizeMode = 'pagerank' | 'degree' | 'uniform';

const GRAPH_EXPLORER_COLOR_MODES: GraphExplorerColorMode[] = [
  'component',
  'degree',
  'pagerank',
  'distance'
];
const GRAPH_EXPLORER_NODE_SIZE_MODES: GraphExplorerNodeSizeMode[] = [
  'pagerank',
  'degree',
  'uniform'
];

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

/** Interactive browser-native graph exploration with no per-frame graph readback. */
export default class LuGraphExplorerAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly graph: LuGraph;
  readonly topology: LuGraphTopology;
  readonly degree: LuGraphDegree;
  readonly pageRank: LuGraphPageRank;
  readonly components: LuGraphConnectedComponents;
  readonly search: LuGraphBreadthFirstSearch;
  readonly layout: LuGraphForceLayout;
  readonly nodeModel: Model;
  readonly pickingModel: Model;
  readonly edgeModels: EdgeModel[];
  readonly analysisGraph: CompiledGPUCommandGraph<void>;
  frameGraph: CompiledGPUCommandGraph<FrameParameters>;
  pickingGraph: CompiledGPUCommandGraph<PickingParameters>;

  private readonly buffers: Buffer[] = [];
  private readonly vectors: GPUVector[] = [];
  private readonly viewUniforms: Buffer;
  private readonly readbackRing: GPUReadbackRing;
  private readonly panels: ExamplePanelManager;
  private readonly seeds: GPUVector<'uint32'>;
  private readonly seedCount: GPUVector<'uint32'>;
  private readonly activeDepth: GPUVector<'uint32'>;
  private readonly pinned: GPUVector<'uint32'>;
  private readonly reset: GPUVector<'uint32'>;
  private readonly neighborhoodMask: GPUVector<'uint32'>;

  private frameColorId = '';
  private frameDepthId = '';
  private pickingReadbackId = '';
  private frameWidth = 1;
  private frameHeight = 1;
  private frameIndex = 0;
  private analyticsPending = true;
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
  private zoom = 0.55;
  private dragging = false;
  private paused = false;
  private edgesVisible = true;
  private colorMode: GraphExplorerColorMode = 'component';
  private nodeSizeMode: GraphExplorerNodeSizeMode = 'pagerank';
  private sampledFrameCount = 0;
  private sampledFrameTime = 0;
  private framesPerSecond = 0;
  private cpuEncodeTimeMilliseconds = 0;
  private lastPointer: [number, number] | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private statusElement: HTMLElement | null = null;
  private legendElement: HTMLElement | null = null;
  private adapterElement: HTMLElement | null = null;
  private memoryElement: HTMLElement | null = null;
  private frameRateElement: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('luGraph GPU Graph Explorer requires WebGPU');
    }
    this.device = device;
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

    const dataset = makeGraphExplorerDataset();
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
      iterations: 16
    });
    this.components = new LuGraphConnectedComponents({
      id: 'lugraph-explorer-components',
      topology: this.topology,
      output: this.createScalarVector('vertex-components', 'uint32', dataset.vertexCount),
      converged: this.createScalarVector('components-converged', 'uint32', 1),
      iterations: 12
    });

    this.seeds = this.createScalarVector('selected-vertices', 'uint32', 1, [0]);
    this.seedCount = this.createScalarVector('selected-vertex-count', 'uint32', 1, [1]);
    this.activeDepth = this.createScalarVector('active-neighborhood-depth', 'uint32', 1, [
      INITIAL_NEIGHBORHOOD_DEPTH
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
    this.layout = new LuGraphForceLayout({
      id: 'lugraph-explorer-layout',
      topology: this.topology,
      positions,
      velocities,
      pinned: this.pinned,
      reset: this.reset,
      seed: 0x1a2b3c4d,
      iterationsPerFrame: 2,
      repulsion: 0.005,
      attraction: 0.045,
      gravity: 0.025,
      damping: 0.85,
      maxVelocity: 0.045
    });

    this.nodeModel = this.createNodeModel();
    this.pickingModel = this.createPickingModel();
    this.edgeModels = this.createEdgeModels();
    this.analysisGraph = this.createAnalysisGraph();

    const [width, height] = this.getDeviceSize();
    this.frameGraph = this.createFrameGraph(width, height);
    this.pickingGraph = this.createPickingGraph(width, height);
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'lugraph-explorer-controls',
        title: 'GPU Graph Explorer',
        html: this.getControlsHtml(),
        onRender: root => this.attachControls(root)
      })
    });
    this.panels.mount();
    if (typeof document !== 'undefined') {
      document
        .getElementById('example-panel-host')
        ?.closest('[data-info-box-appearance]')
        ?.querySelector<HTMLButtonElement>(
          'button[aria-expanded="false"][aria-label="Expand info box"]'
        )
        ?.click();
    }
    this.writeViewUniforms(width, height);
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
    const [width, height] = this.getDeviceSize();
    if (width !== this.frameWidth || height !== this.frameHeight) {
      this.frameGraph.destroy();
      this.pickingGraph.destroy();
      this.frameGraph = this.createFrameGraph(width, height);
      this.pickingGraph = this.createPickingGraph(width, height);
    }
    this.writeViewUniforms(width, height);

    if (this.analyticsPending) {
      this.analysisGraph.encode(device.commandEncoder, {parameters: undefined});
      this.analyticsPending = false;
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
    this.cpuEncodeTimeMilliseconds = frameEncoding.stats.cpuEncodeTimeMilliseconds;
    this.updateFrameRate();

    if (this.pendingPick) {
      const ticket = this.readbackRing.tryAcquire();
      if (ticket) {
        const pixel = this.pendingPick;
        const pointerSession = this.pendingPickSession;
        this.pendingPick = null;
        this.pendingPickSession = null;
        this.pickingGraph.encode(device.commandEncoder, {
          parameters: {pixel},
          buffers: {[this.pickingReadbackId]: ticket.buffer}
        });
        ticket.markEncoded({byteLength: 8});
        queueMicrotask(() => void this.readPickedVertex(ticket, pointerSession ?? undefined));
      }
    }
    this.frameIndex++;
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
    this.analysisGraph.destroy();
    this.frameGraph.destroy();
    this.pickingGraph.destroy();
    for (const {model} of this.edgeModels) model.destroy();
    this.nodeModel.destroy();
    this.pickingModel.destroy();
    for (const vector of this.vectors) vector.destroy();
    for (const buffer of this.buffers) buffer.destroy();
    this.readbackRing.destroy();
    this.viewUniforms.destroy();
  }

  /** Builds persistent analytics once; animation never reruns PageRank or components. */
  private createAnalysisGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'lugraph-explorer-analysis'});
    this.topology.addToGraph(graph);
    this.degree.addToGraph(graph);
    this.components.addToGraph(graph);
    this.pageRank.addToGraph(graph);
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
    if (!this.paused) this.layout.addToGraph(graph);
    this.search.addToGraph(graph);

    const positions = graph.importGPUVector('render-positions', this.layout.positions).data[0];
    const importance = graph.importGPUVector('render-importance', this.pageRank.output).data[0];
    const degrees = graph.importGPUVector('render-degrees', this.degree.output).data[0];
    const componentLabels = graph.importGPUVector('render-components', this.components.output)
      .data[0];
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
      {buffer: degrees, usage: 'storage-read'},
      {buffer: componentLabels, usage: 'storage-read'},
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
      topology: 'triangle-list',
      vertexCount: 6,
      isInstanced: true,
      instanceCount: this.graph.vertexCount,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      attributes: {nodePosition: this.getVectorBuffer(this.layout.positions)},
      bufferLayout: [{name: 'nodePosition', format: 'float32x2', stepMode: 'instance'}],
      bindings: {
        importance: this.getVectorBuffer(this.pageRank.output),
        components: this.getVectorBuffer(this.components.output),
        distances: this.getVectorBuffer(this.search.distances),
        selectionMask: this.getVectorBuffer(this.neighborhoodMask),
        degrees: this.getVectorBuffer(this.degree.output),
        view: this.viewUniforms
      },
      shaderLayout: {
        attributes: [{name: 'nodePosition', location: 0, type: 'vec2<f32>'}],
        bindings: [
          {name: 'importance', type: 'read-only-storage', group: 0, location: 0},
          {name: 'components', type: 'read-only-storage', group: 0, location: 1},
          {name: 'distances', type: 'read-only-storage', group: 0, location: 2},
          {name: 'selectionMask', type: 'read-only-storage', group: 0, location: 3},
          {name: 'degrees', type: 'read-only-storage', group: 0, location: 4},
          {name: 'view', type: 'uniform', group: 0, location: 5}
        ]
      },
      parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
    });
  }

  /** Uses original GPUData chunks directly; no edge source buffers are packed or copied. */
  private createEdgeModels(): EdgeModel[] {
    const edgeModels: EdgeModel[] = [];
    for (const [chunkIndex, source] of this.graph.sourceVertices.data.entries()) {
      if (source.length === 0) continue;
      const target = this.graph.targetVertices.data[chunkIndex];
      edgeModels.push({
        chunkIndex,
        model: new Model(this.device, {
          id: `lugraph-explorer-edges-${chunkIndex}`,
          source: GRAPH_EXPLORER_EDGE_SHADER,
          topology: 'line-list',
          vertexCount: 2,
          isInstanced: true,
          instanceCount: source.length,
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
      topology: 'triangle-list',
      vertexCount: 6,
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
        (GRAPH_EXPLORER_COLOR_MODES.indexOf(this.colorMode) << 4) |
        (GRAPH_EXPLORER_NODE_SIZE_MODES.indexOf(this.nodeSizeMode) << 8)
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
    const selectStyle =
      'width:100%;padding:7px 9px;border:1px solid rgba(148,163,184,.26);' +
      'border-radius:8px;background:rgba(15,23,42,.8);color:inherit';
    const buttonStyle =
      'padding:7px 10px;border:1px solid rgba(148,163,184,.28);border-radius:8px;' +
      'background:rgba(30,41,59,.8);color:inherit;cursor:pointer';
    return `<section data-graph-dashboard aria-label="Live GPU graph analytics"
        style="min-width:260px;font:12px/1.5 system-ui,sans-serif;color:inherit">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <strong style="font-size:15px;letter-spacing:.02em">Graph analytics</strong>
        <span style="padding:2px 8px;border:1px solid rgba(56,189,248,.45);border-radius:99px;
          color:#7dd3fc;font-size:10px">WEBGPU · LIVE</span>
      </div>
      <p style="margin:6px 0 12px;color:#aebed4">Real GPU topology, influence,
        connected components, and neighborhood traversal.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
        <label>Node color
          <select data-color-mode aria-label="Node color metric" style="${selectStyle}">
            <option value="component">Connected component</option>
            <option value="degree">Vertex degree</option>
            <option value="pagerank">PageRank influence</option>
            <option value="distance">Neighborhood distance</option>
          </select>
        </label>
        <label>Node size
          <select data-node-size aria-label="Node size metric" style="${selectStyle}">
            <option value="pagerank">PageRank</option>
            <option value="degree">Vertex degree</option>
            <option value="uniform">Uniform</option>
          </select>
        </label>
      </div>
      <label style="display:block;margin:12px 0 8px">Neighborhood depth
        <input data-depth aria-label="Neighborhood depth" type="range" min="0"
          max="${MAXIMUM_NEIGHBORHOOD_DEPTH}" value="${INITIAL_NEIGHBORHOOD_DEPTH}"
          style="width:100%;accent-color:#38bdf8" />
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
        <button data-pause type="button" aria-pressed="false" style="${buttonStyle}">
          Pause layout
        </button>
        <button data-edge-toggle type="button" aria-pressed="true" style="${buttonStyle}">
          Hide edges
        </button>
        <button data-reset type="button" style="${buttonStyle}">Reset layout</button>
        <button data-unpin type="button" style="${buttonStyle}">Release pins</button>
      </div>
      <div data-graph-legend aria-label="Active graph color legend"
        style="margin:12px 0 8px;padding:8px 10px;border-radius:8px;
        background:rgba(56,189,248,.08);color:#dbeafe"></div>
      <p data-status role="status" aria-live="polite"
        style="margin:0;color:#f1f5f9;font-variant-numeric:tabular-nums"></p>
      <p data-graph-adapter style="margin:5px 0 0;color:#aebed4"></p>
      <p data-graph-memory style="margin:3px 0 0;color:#aebed4"></p>
      <p data-graph-fps style="margin:3px 0 0;color:#aebed4"></p>
      <p style="margin:10px 0 0;color:#94a3b8">Click to select · drag to pin ·
        Shift-drag to pan · scroll to zoom</p>
    </section>`;
  }

  private attachControls(root: HTMLElement): () => void {
    const depth = root.querySelector<HTMLInputElement>('[data-depth]');
    const color = root.querySelector<HTMLSelectElement>('[data-color-mode]');
    const size = root.querySelector<HTMLSelectElement>('[data-node-size]');
    const pause = root.querySelector<HTMLButtonElement>('[data-pause]');
    const edges = root.querySelector<HTMLButtonElement>('[data-edge-toggle]');
    const reset = root.querySelector<HTMLButtonElement>('[data-reset]');
    const unpin = root.querySelector<HTMLButtonElement>('[data-unpin]');
    this.statusElement = root.querySelector('[data-status]');
    this.legendElement = root.querySelector('[data-graph-legend]');
    this.adapterElement = root.querySelector('[data-graph-adapter]');
    this.memoryElement = root.querySelector('[data-graph-memory]');
    this.frameRateElement = root.querySelector('[data-graph-fps]');
    const updateColor = () => {
      const selectedMode = GRAPH_EXPLORER_COLOR_MODES.find(mode => mode === color?.value);
      if (selectedMode) this.colorMode = selectedMode;
      this.updateStatus();
    };
    const updateSize = () => {
      const selectedMode = GRAPH_EXPLORER_NODE_SIZE_MODES.find(mode => mode === size?.value);
      if (selectedMode) this.nodeSizeMode = selectedMode;
      this.updateStatus();
    };
    const updateDepth = () => {
      this.neighborhoodDepth = Number(depth?.value ?? INITIAL_NEIGHBORHOOD_DEPTH);
      this.getVectorBuffer(this.activeDepth).write(Uint32Array.of(this.neighborhoodDepth));
      this.updateStatus();
    };
    const togglePause = () => {
      this.paused = !this.paused;
      if (pause) {
        pause.textContent = this.paused ? 'Resume layout' : 'Pause layout';
        pause.setAttribute('aria-pressed', String(this.paused));
      }
      this.frameGraph.destroy();
      this.frameGraph = this.createFrameGraph(this.frameWidth, this.frameHeight);
      this.updateStatus();
    };
    const toggleEdges = () => {
      this.edgesVisible = !this.edgesVisible;
      if (edges) {
        edges.textContent = this.edgesVisible ? 'Hide edges' : 'Show edges';
        edges.setAttribute('aria-pressed', String(this.edgesVisible));
      }
      this.updateStatus();
    };
    const resetLayout = () => {
      this.getVectorBuffer(this.reset).write(Uint32Array.of(1));
      this.updateStatus();
    };
    const clearPins = () => {
      this.getVectorBuffer(this.pinned).write(new Uint32Array(this.graph.vertexCount));
      this.updateStatus();
    };
    depth?.addEventListener('input', updateDepth);
    color?.addEventListener('change', updateColor);
    size?.addEventListener('change', updateSize);
    pause?.addEventListener('click', togglePause);
    edges?.addEventListener('click', toggleEdges);
    reset?.addEventListener('click', resetLayout);
    unpin?.addEventListener('click', clearPins);
    this.updateStatus();
    return () => {
      depth?.removeEventListener('input', updateDepth);
      color?.removeEventListener('change', updateColor);
      size?.removeEventListener('change', updateSize);
      pause?.removeEventListener('click', togglePause);
      edges?.removeEventListener('click', toggleEdges);
      reset?.removeEventListener('click', resetLayout);
      unpin?.removeEventListener('click', clearPins);
      this.statusElement = null;
      this.legendElement = null;
      this.adapterElement = null;
      this.memoryElement = null;
      this.frameRateElement = null;
    };
  }

  private updateStatus(): void {
    if (!this.statusElement) return;
    const selection = this.selectedVertex === null ? 'none' : String(this.selectedVertex);
    this.statusElement.textContent = `${this.graph.vertexCount} vertices · ${this.graph.edgeCount} chunked edges · selected ${selection} · depth ${this.neighborhoodDepth}`;
    if (this.legendElement) {
      const legends: Record<GraphExplorerColorMode, string> = {
        component: '● Colors identify GPU weakly connected components',
        degree: '● Blue → amber shows GPU-computed vertex degree',
        pagerank: '● Teal → violet shows GPU PageRank influence',
        distance: '● Bright → dim shows bounded GPU traversal distance'
      };
      this.legendElement.textContent = legends[this.colorMode];
    }
    if (this.adapterElement) {
      const adapter = this.device.info.renderer || this.device.info.vendor || this.device.info.gpu;
      this.adapterElement.textContent = `GPU adapter: ${adapter}`;
    }
    if (this.memoryElement) {
      const residentBytes = this.buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
      const transientBytes =
        this.analysisGraph.stats.physicalTransientBytes +
        this.frameGraph.stats.physicalTransientBytes +
        this.pickingGraph.stats.physicalTransientBytes;
      this.memoryElement.textContent =
        `GPU buffers: ${(residentBytes / 1024).toFixed(1)} KiB resident · ` +
        `${(transientBytes / 1024).toFixed(1)} KiB transient`;
    }
    if (this.frameRateElement) {
      this.frameRateElement.textContent =
        `${this.framesPerSecond.toFixed(0)} FPS · ` +
        `${this.cpuEncodeTimeMilliseconds.toFixed(2)} ms CPU command encoding`;
    }
  }

  private updateFrameRate(): void {
    const currentTime = performance.now();
    if (this.sampledFrameTime === 0) this.sampledFrameTime = currentTime;
    this.sampledFrameCount++;
    const elapsedMilliseconds = currentTime - this.sampledFrameTime;
    if (elapsedMilliseconds < 500) return;
    this.framesPerSecond = (this.sampledFrameCount * 1000) / elapsedMilliseconds;
    this.sampledFrameTime = currentTime;
    this.sampledFrameCount = 0;
    this.updateStatus();
  }
}
