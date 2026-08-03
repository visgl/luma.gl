// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Effect, EffectContext} from '@deck.gl/core';
import {Buffer, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUCommandGraphInspector,
  type GPUCommandGraphInspectorSnapshot,
  type CompiledGPUCommandGraph
} from '@luma.gl/experimental';
import {
  GPUGridIndex,
  GPUPointSpatialQuery,
  GPUSinusoidalProjection
} from '@luma.gl/experimental/geospatial';
import {
  TAXI_GRID_SIZE,
  TAXI_PROJECTION_ORIGIN,
  projectTaxiLongitudeLatitude,
  type LuSpatialTaxiData
} from './taxi-data';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

export type LuSpatialTaxiQueryStats = {
  residentPointCount: number;
  visiblePointCount: number;
  selectedPointCount: number;
  graphNodeCount: number;
  buildEncodingMilliseconds: number;
  queryEncodingMilliseconds: number;
  inspectorSnapshot: GPUCommandGraphInspectorSnapshot;
};

export type LuSpatialTaxiQueryEffectOptions = {
  onStats?: (stats: LuSpatialTaxiQueryStats) => void;
};

/** Deck effect that projects, indexes, and queries the resident taxi window on WebGPU. */
export class LuSpatialTaxiQueryEffect implements Effect {
  readonly id = 'luspatial-taxi-query-effect';
  readonly props = {};
  readonly useInPicking = true;
  readonly longitudeLatitudes: Buffer;
  readonly viewportIds: Buffer;
  readonly selectedIds: Buffer;
  readonly drawCommands: DrawCommandBuffer;
  readonly inspector = new GPUCommandGraphInspector({
    maxSamples: 120,
    getNodeGroup: node => {
      if (node.id.includes('project')) return 'projection';
      if (node.id.includes('grid')) return 'index';
      if (node.id.includes('query')) return 'query';
      return undefined;
    }
  });

  private readonly device: Device;
  private readonly data: LuSpatialTaxiData;
  private readonly projectedPositions: Buffer;
  private readonly cellOffsets: Buffer;
  private readonly indexObjectIds: Buffer;
  private readonly indexCount: Buffer;
  private readonly indexOverflow: Buffer;
  private readonly viewportQuery: Buffer;
  private readonly selectionQuery: Buffer;
  private readonly viewportTotalCount: Buffer;
  private readonly selectionTotalCount: Buffer;
  private readonly viewportOverflow: Buffer;
  private readonly selectionOverflow: Buffer;
  private readonly buildGraph: CompiledGPUCommandGraph<void>;
  private readonly queryGraph: CompiledGPUCommandGraph<void>;
  private readonly onStats?: (stats: LuSpatialTaxiQueryStats) => void;
  private selectionCenter: readonly [number, number] = [-73.9855, 40.758];
  private selectionRadiusKilometres = 0.35;
  private visiblePointCount = 0;
  private selectedPointCount = 0;
  private buildEncodingMilliseconds = 0;
  private queryEncodingMilliseconds = 0;
  private frameIndex = 0;
  private countReadPending = false;
  private countSampleRequested = true;
  private countSampleTimer: ReturnType<typeof setTimeout> | null = null;
  private queryInputsChanged = true;
  private lastViewportBounds: Float32Array | null = null;
  private destroyed = false;

  constructor(
    device: Device,
    data: LuSpatialTaxiData,
    options: LuSpatialTaxiQueryEffectOptions = {}
  ) {
    if (device.type !== 'webgpu') {
      throw new Error('LuSpatialTaxiQueryEffect requires WebGPU');
    }
    this.device = device;
    this.data = data;
    this.onStats = options.onStats;

    const cellCount = TAXI_GRID_SIZE[0] * TAXI_GRID_SIZE[1];
    this.longitudeLatitudes = device.createBuffer({
      id: 'luspatial-taxi-longitude-latitudes',
      data: data.longitudeLatitudes,
      usage: Buffer.STORAGE
    });
    this.projectedPositions = device.createBuffer({
      id: 'luspatial-taxi-projected-positions',
      byteLength: data.pointCount * 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    this.cellOffsets = device.createBuffer({
      id: 'luspatial-taxi-cell-offsets',
      byteLength: (cellCount + 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    this.indexObjectIds = device.createBuffer({
      id: 'luspatial-taxi-index-object-ids',
      byteLength: data.pointCount * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    this.indexCount = createScalarBuffer(device, 'luspatial-taxi-index-count');
    this.indexOverflow = createScalarBuffer(device, 'luspatial-taxi-index-overflow');
    this.viewportIds = device.createBuffer({
      id: 'luspatial-taxi-viewport-ids',
      byteLength: data.pointCount * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    this.selectedIds = device.createBuffer({
      id: 'luspatial-taxi-selected-ids',
      byteLength: data.pointCount * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    this.viewportQuery = device.createBuffer({
      id: 'luspatial-taxi-viewport-query',
      byteLength: 4 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.selectionQuery = device.createBuffer({
      id: 'luspatial-taxi-selection-query',
      byteLength: 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.viewportTotalCount = createScalarBuffer(device, 'luspatial-taxi-viewport-total-count');
    this.selectionTotalCount = createScalarBuffer(device, 'luspatial-taxi-selection-total-count');
    this.viewportOverflow = createScalarBuffer(device, 'luspatial-taxi-viewport-overflow');
    this.selectionOverflow = createScalarBuffer(device, 'luspatial-taxi-selection-overflow');
    this.drawCommands = new DrawCommandBuffer(device, {
      id: 'luspatial-taxi-draw-commands',
      type: 'draw',
      capacity: 2,
      commands: [
        {vertexCount: 6, instanceCount: 0},
        {vertexCount: 6, instanceCount: 0}
      ]
    });

    this.buildGraph = this.createBuildGraph();
    this.queryGraph = this.createQueryGraph();
    this.inspector.registerGraph(this.buildGraph);
    this.inspector.registerGraph(this.queryGraph);
    const commandEncoder = device.createCommandEncoder({id: 'luspatial-taxi-index-build'});
    const encoding = this.buildGraph.encode(commandEncoder, {parameters: undefined});
    this.inspector.recordEncoding(this.buildGraph.id, encoding);
    this.buildEncodingMilliseconds = encoding.stats.cpuEncodeTimeMilliseconds;
    device.submit(commandEncoder.finish());
    if (encoding.canReadGPUTimings) {
      setTimeout(() => void this.inspector.recordGPUTimings(this.buildGraph.id, encoding), 0);
    }
    this.publishStats();
  }

  setup(_context: EffectContext): void {}

  setSelection(center: readonly [number, number], radiusKilometres?: number): void {
    this.selectionCenter = center;
    if (radiusKilometres !== undefined) {
      this.selectionRadiusKilometres = clamp(radiusKilometres, 0.05, 5);
    }
    this.queryInputsChanged = true;
  }

  setSelectionRadius(radiusKilometres: number): void {
    this.selectionRadiusKilometres = clamp(radiusKilometres, 0.05, 5);
    this.queryInputsChanged = true;
  }

  getSelection(): {center: readonly [number, number]; radiusKilometres: number} {
    return {
      center: this.selectionCenter,
      radiusKilometres: this.selectionRadiusKilometres
    };
  }

  preRender(options: Parameters<Effect['preRender']>[0]): void {
    const viewport = options.viewports[0];
    if (!viewport || viewport.width <= 0 || viewport.height <= 0) return;

    const projectedCorners = [
      viewport.unproject([0, 0]),
      viewport.unproject([viewport.width, 0]),
      viewport.unproject([0, viewport.height]),
      viewport.unproject([viewport.width, viewport.height])
    ].map(coordinate => projectTaxiLongitudeLatitude([coordinate[0], coordinate[1]]));
    const viewportBounds = new Float32Array([
      Math.min(...projectedCorners.map(coordinate => coordinate[0])),
      Math.min(...projectedCorners.map(coordinate => coordinate[1])),
      Math.max(...projectedCorners.map(coordinate => coordinate[0])),
      Math.max(...projectedCorners.map(coordinate => coordinate[1]))
    ]);
    const viewportBoundsChanged =
      !this.lastViewportBounds ||
      viewportBounds.some((value, index) => value !== this.lastViewportBounds?.[index]);
    this.lastViewportBounds = viewportBounds;
    const projectedSelection = projectTaxiLongitudeLatitude(this.selectionCenter);
    this.viewportQuery.write(viewportBounds);
    this.selectionQuery.write(
      new Float32Array([
        projectedSelection[0],
        projectedSelection[1],
        this.selectionRadiusKilometres
      ])
    );

    const encoding = this.queryGraph.encode(this.device.commandEncoder, {parameters: undefined});
    this.inspector.recordEncoding(this.queryGraph.id, encoding);
    this.queryEncodingMilliseconds = encoding.stats.cpuEncodeTimeMilliseconds;
    this.frameIndex++;
    if (viewportBoundsChanged || this.queryInputsChanged) {
      this.queryInputsChanged = false;
      this.scheduleCountSample(80);
    }
    if (this.frameIndex === 1 || this.frameIndex % 30 === 0) {
      this.scheduleCountSample(0);
      if (encoding.canReadGPUTimings) {
        setTimeout(() => void this.inspector.recordGPUTimings(this.queryGraph.id, encoding), 0);
      }
    }
    if (this.frameIndex === 1 || this.frameIndex % 15 === 0) this.publishStats();
  }

  cleanup(_context: EffectContext): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.countSampleTimer !== null) clearTimeout(this.countSampleTimer);
    this.buildGraph.destroy();
    this.queryGraph.destroy();
    this.drawCommands.destroy();
    this.longitudeLatitudes.destroy();
    this.projectedPositions.destroy();
    this.cellOffsets.destroy();
    this.indexObjectIds.destroy();
    this.indexCount.destroy();
    this.indexOverflow.destroy();
    this.viewportIds.destroy();
    this.selectedIds.destroy();
    this.viewportQuery.destroy();
    this.selectionQuery.destroy();
    this.viewportTotalCount.destroy();
    this.selectionTotalCount.destroy();
    this.viewportOverflow.destroy();
    this.selectionOverflow.destroy();
  }

  private createBuildGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'luspatial-taxi-build-graph'});
    const sourceBuffer = importBuffer(graph, 'longitude-latitudes', this.longitudeLatitudes);
    const projectedBuffer = importBuffer(graph, 'projected-positions', this.projectedPositions);
    const cellOffsetsBuffer = importBuffer(graph, 'cell-offsets', this.cellOffsets);
    const objectIdsBuffer = importBuffer(graph, 'index-object-ids', this.indexObjectIds);
    const countBuffer = importBuffer(graph, 'index-count', this.indexCount);
    const overflowBuffer = importBuffer(graph, 'index-overflow', this.indexOverflow);
    const source = graph.createDataView(sourceBuffer, {
      format: 'float32x2',
      length: this.data.pointCount
    });
    const projected = graph.createDataView(projectedBuffer, {
      format: 'float32x2',
      length: this.data.pointCount
    });
    const cellOffsets = graph.createDataView(cellOffsetsBuffer, {
      format: 'uint32',
      length: TAXI_GRID_SIZE[0] * TAXI_GRID_SIZE[1] + 1
    });
    const objectIds = graph.createDataView(objectIdsBuffer, {
      format: 'uint32',
      length: this.data.pointCount
    });
    const count = graph.createDataView(countBuffer, {format: 'uint32', length: 1});
    const overflow = graph.createDataView(overflowBuffer, {format: 'uint32', length: 1});

    new GPUSinusoidalProjection({
      id: 'luspatial-taxi-project',
      positions: source,
      output: projected,
      origin: TAXI_PROJECTION_ORIGIN
    }).addToGraph(graph);
    new GPUGridIndex({
      id: 'luspatial-taxi-grid',
      positions: projected,
      gridSize: TAXI_GRID_SIZE,
      bounds: this.data.projectedBounds,
      cellOffsets,
      objectIds,
      count,
      overflow
    }).addToGraph(graph);
    return graph.compile();
  }

  private createQueryGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'luspatial-taxi-query-graph'});
    const projectedBuffer = importBuffer(graph, 'projected-positions', this.projectedPositions);
    const cellOffsetsBuffer = importBuffer(graph, 'cell-offsets', this.cellOffsets);
    const objectIdsBuffer = importBuffer(graph, 'index-object-ids', this.indexObjectIds);
    const indexCountBuffer = importBuffer(graph, 'index-count', this.indexCount);
    const indexOverflowBuffer = importBuffer(graph, 'index-overflow', this.indexOverflow);
    const viewportIdsBuffer = importBuffer(graph, 'viewport-ids', this.viewportIds);
    const selectedIdsBuffer = importBuffer(graph, 'selected-ids', this.selectedIds);
    const viewportQueryBuffer = importBuffer(graph, 'viewport-query', this.viewportQuery);
    const selectionQueryBuffer = importBuffer(graph, 'selection-query', this.selectionQuery);
    const viewportTotalCountBuffer = importBuffer(
      graph,
      'viewport-total-count',
      this.viewportTotalCount
    );
    const selectionTotalCountBuffer = importBuffer(
      graph,
      'selection-total-count',
      this.selectionTotalCount
    );
    const viewportOverflowBuffer = importBuffer(graph, 'viewport-overflow', this.viewportOverflow);
    const selectionOverflowBuffer = importBuffer(
      graph,
      'selection-overflow',
      this.selectionOverflow
    );
    const drawCommandBuffer = importBuffer(graph, 'draw-commands', this.drawCommands.buffer);

    const positions = graph.createDataView(projectedBuffer, {
      format: 'float32x2',
      length: this.data.pointCount
    });
    const cellOffsets = graph.createDataView(cellOffsetsBuffer, {
      format: 'uint32',
      length: TAXI_GRID_SIZE[0] * TAXI_GRID_SIZE[1] + 1
    });
    const objectIds = graph.createDataView(objectIdsBuffer, {
      format: 'uint32',
      length: this.data.pointCount
    });
    const index = {
      gridSize: TAXI_GRID_SIZE,
      bounds: this.data.projectedBounds,
      cellOffsets,
      objectIds,
      count: graph.createDataView(indexCountBuffer, {format: 'uint32', length: 1}),
      overflow: graph.createDataView(indexOverflowBuffer, {format: 'uint32', length: 1})
    };

    new GPUPointSpatialQuery({
      id: 'luspatial-taxi-viewport-query',
      positions,
      index,
      kind: 'bounds',
      query: graph.createDataView(viewportQueryBuffer, {format: 'float32', length: 4}),
      output: {
        ids: graph.createDataView(viewportIdsBuffer, {
          format: 'uint32',
          length: this.data.pointCount
        }),
        count: graph.createDataView(drawCommandBuffer, {
          format: 'uint32',
          length: 1,
          byteOffset: this.drawCommands.getInstanceCountByteOffset(0)
        }),
        overflow: graph.createDataView(viewportOverflowBuffer, {format: 'uint32', length: 1}),
        totalCount: graph.createDataView(viewportTotalCountBuffer, {
          format: 'uint32',
          length: 1
        })
      }
    }).addToGraph(graph);

    new GPUPointSpatialQuery({
      id: 'luspatial-taxi-radius-query',
      positions,
      index,
      kind: 'radius',
      query: graph.createDataView(selectionQueryBuffer, {format: 'float32', length: 3}),
      output: {
        ids: graph.createDataView(selectedIdsBuffer, {
          format: 'uint32',
          length: this.data.pointCount
        }),
        count: graph.createDataView(drawCommandBuffer, {
          format: 'uint32',
          length: 1,
          byteOffset: this.drawCommands.getInstanceCountByteOffset(1)
        }),
        overflow: graph.createDataView(selectionOverflowBuffer, {format: 'uint32', length: 1}),
        totalCount: graph.createDataView(selectionTotalCountBuffer, {
          format: 'uint32',
          length: 1
        })
      }
    }).addToGraph(graph);
    return graph.compile();
  }

  private async sampleCounts(): Promise<void> {
    if (this.destroyed) return;
    if (this.countReadPending) {
      this.countSampleRequested = true;
      return;
    }
    this.countReadPending = true;
    try {
      const bytes = await this.drawCommands.buffer.readAsync();
      if (this.destroyed) return;
      const values = new Uint32Array(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength / UINT32_BYTE_LENGTH
      );
      this.visiblePointCount = values[this.drawCommands.getInstanceCountByteOffset(0) / 4] ?? 0;
      this.selectedPointCount = values[this.drawCommands.getInstanceCountByteOffset(1) / 4] ?? 0;
      this.publishStats();
    } catch {
      // Device loss or teardown can reject optional diagnostics after the render path has ended.
      // Rendering stays entirely GPU-driven, so the next requested sample can retry safely.
    } finally {
      this.countReadPending = false;
      if (this.countSampleRequested && !this.destroyed) {
        this.countSampleRequested = false;
        this.scheduleCountSample(0);
      }
    }
  }

  private scheduleCountSample(delayMilliseconds: number): void {
    if (this.destroyed) return;
    this.countSampleRequested = false;
    if (this.countSampleTimer !== null) clearTimeout(this.countSampleTimer);
    this.countSampleTimer = setTimeout(() => {
      this.countSampleTimer = null;
      void this.sampleCounts();
    }, delayMilliseconds);
  }

  private publishStats(): void {
    this.onStats?.({
      residentPointCount: this.data.pointCount,
      visiblePointCount: this.visiblePointCount,
      selectedPointCount: this.selectedPointCount,
      graphNodeCount:
        this.buildGraph.stats.nodeOrder.length + this.queryGraph.stats.nodeOrder.length,
      buildEncodingMilliseconds: this.buildEncodingMilliseconds,
      queryEncodingMilliseconds: this.queryEncodingMilliseconds,
      inspectorSnapshot: this.inspector.getSnapshot()
    });
  }
}

function createScalarBuffer(device: Device, id: string): Buffer {
  return device.createBuffer({
    id,
    byteLength: UINT32_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importBuffer<Parameters>(graph: GPUCommandGraph<Parameters>, id: string, buffer: Buffer) {
  return graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
