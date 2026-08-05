// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  private neighborhoodDepth = INITIAL_NEIGHBORHOOD_DEPTH;
  private centerX = 0;
  private centerY = 0;
  private zoom = 0.55;
  private dragging = false;
  private lastPointer: [number, number] | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private statusElement: HTMLElement | null = null;

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
    this.frameGraph.encode(device.commandEncoder, {
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

    if (this.pendingPick) {
      const ticket = this.readbackRing.tryAcquire();
      if (ticket) {
        const pixel = this.pendingPick;
        this.pendingPick = null;
        this.pickingGraph.encode(device.commandEncoder, {
          parameters: {pixel},
          buffers: {[this.pickingReadbackId]: ticket.buffer}
        });
        ticket.markEncoded({byteLength: 8});
        queueMicrotask(() => void this.readPickedVertex(ticket));
      }
    }
    this.frameIndex++;
  }

  override onFinalize(): void {
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
    this.layout.addToGraph(graph);
    this.search.addToGraph(graph);

    const positions = graph.importGPUVector('render-positions', this.layout.positions).data[0];
    const importance = graph.importGPUVector('render-importance', this.pageRank.output).data[0];
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
          for (const {model} of this.edgeModels) model.draw(renderPass);
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
        view: this.viewUniforms
      },
      shaderLayout: {
        attributes: [{name: 'nodePosition', location: 0, type: 'vec2<f32>'}],
        bindings: [
          {name: 'importance', type: 'read-only-storage', group: 0, location: 0},
          {name: 'components', type: 'read-only-storage', group: 0, location: 1},
          {name: 'distances', type: 'read-only-storage', group: 0, location: 2},
          {name: 'selectionMask', type: 'read-only-storage', group: 0, location: 3},
          {name: 'view', type: 'uniform', group: 0, location: 4}
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
        view: this.viewUniforms
      },
      shaderLayout: {
        attributes: [{name: 'nodePosition', location: 0, type: 'vec2<f32>'}],
        bindings: [
          {name: 'importance', type: 'read-only-storage', group: 0, location: 0},
          {name: 'view', type: 'uniform', group: 0, location: 1}
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
      this.dragging ? 1 : 0
    ]);
    this.viewUniforms.write(new Uint8Array(values));
  }

  private async readPickedVertex(ticket: GPUReadbackTicket): Promise<void> {
    try {
      const pickedVertex = decodeGPUIndexPickInfo(await ticket.read()).objectIndex;
      this.selectedVertex = pickedVertex;
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
    if (!this.canvas) return;
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
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging || !this.canvas || !this.lastPointer) return;
    const previous = this.lastPointer;
    this.lastPointer = [event.clientX, event.clientY];
    if (this.selectedVertex === null || event.shiftKey) {
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
      this.selectedVertex * UINT32_BYTE_LENGTH
    );
    this.getVectorBuffer(this.layout.positions).write(
      Float32Array.from(position),
      this.selectedVertex * 2 * Float32Array.BYTES_PER_ELEMENT
    );
    this.getVectorBuffer(this.layout.velocities).write(
      Float32Array.of(0, 0),
      this.selectedVertex * 2 * Float32Array.BYTES_PER_ELEMENT
    );
    this.updateStatus();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.canvas?.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.dragging = false;
    this.lastPointer = null;
    if (this.canvas) this.canvas.style.cursor = 'grab';
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.zoom = Math.max(0.08, Math.min(4, this.zoom * Math.exp(-event.deltaY * 0.001)));
    this.updateStatus();
  };

  private getControlsHtml(): string {
    return `<div style="font:13px/1.5 system-ui,sans-serif">
      <p style="margin:0 0 10px">GPU topology, PageRank, components, bounded breadth-first selection,
      and progressive force integration feed these node and edge draws without per-frame readback.</p>
      <label style="display:block;margin:8px 0">Neighborhood depth
        <input data-depth type="range" min="0" max="${MAXIMUM_NEIGHBORHOOD_DEPTH}"
          value="${INITIAL_NEIGHBORHOOD_DEPTH}" style="width:100%" />
      </label>
      <div style="display:flex;gap:8px">
        <button data-reset type="button">Reset layout</button>
        <button data-unpin type="button">Release pins</button>
      </div>
      <p data-status style="margin:10px 0 0"></p>
      <p style="margin:8px 0 0;opacity:.7">Click nodes to inspect neighborhoods. Drag to pin;
      shift-drag to pan; scroll to zoom.</p>
    </div>`;
  }

  private attachControls(root: HTMLElement): () => void {
    const depth = root.querySelector<HTMLInputElement>('[data-depth]');
    const reset = root.querySelector<HTMLButtonElement>('[data-reset]');
    const unpin = root.querySelector<HTMLButtonElement>('[data-unpin]');
    this.statusElement = root.querySelector('[data-status]');
    const updateDepth = () => {
      this.neighborhoodDepth = Number(depth?.value ?? INITIAL_NEIGHBORHOOD_DEPTH);
      this.getVectorBuffer(this.activeDepth).write(Uint32Array.of(this.neighborhoodDepth));
      this.updateStatus();
    };
    const resetLayout = () => {
      this.getVectorBuffer(this.reset).write(Uint32Array.of(1));
    };
    const clearPins = () => {
      this.getVectorBuffer(this.pinned).write(new Uint32Array(this.graph.vertexCount));
      this.updateStatus();
    };
    depth?.addEventListener('input', updateDepth);
    reset?.addEventListener('click', resetLayout);
    unpin?.addEventListener('click', clearPins);
    this.updateStatus();
    return () => {
      depth?.removeEventListener('input', updateDepth);
      reset?.removeEventListener('click', resetLayout);
      unpin?.removeEventListener('click', clearPins);
      this.statusElement = null;
    };
  }

  private updateStatus(): void {
    if (!this.statusElement) return;
    const selection = this.selectedVertex === null ? 'none' : String(this.selectedVertex);
    this.statusElement.textContent = `${this.graph.vertexCount} vertices · ${this.graph.edgeCount} chunked edges · selected ${selection} · depth ${this.neighborhoodDepth}`;
  }
}
