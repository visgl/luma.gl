// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowVectorByteLength,
  prepareArrowPolygonGPUVectorsAsync,
  type ArrowPolygonColorType,
  type ArrowPolygonInputType,
  type PreparedArrowPolygonGPUVectors
} from '@luma.gl/arrow';
import type {CommandEncoder, Device, RenderPass} from '@luma.gl/core';
import {PickingManager, type PickInfo} from '@luma.gl/engine';
import type {GPUTableModel} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  createPolygonModel,
  createPolygonShaderInputs,
  type PolygonShaderInputs
} from './polygon-model';

export type ArrowPolygonRendererPickingInfo = {
  batchIndex: number | null;
  rowIndex: number | null;
};

export type ArrowPolygonRendererProps = {
  /** Optional Arrow source table. */
  data?: arrow.Table;
  /** Polygon column or source table column name. Defaults to `polygons` when data is supplied. */
  polygons?: string | arrow.Vector<ArrowPolygonInputType>;
  /** Row/vertex color column, source table column name, or null to force constant color. */
  colors?: string | arrow.Vector<ArrowPolygonColorType> | null;
  /** Treat `List<FixedSizeList<...>>` rows as pre-tessellated triangle vertices. */
  tessellated?: boolean;
  /** Constant fallback RGBA color. */
  color?: [number, number, number, number];
  /** View center in source coordinate units. */
  center?: [number, number];
  /** View scale applied after centering. */
  scale?: number;
  /** Called when the hovered polygon row changes. */
  onPick?: (info: ArrowPolygonRendererPickingInfo) => void;
};

export type ArrowPolygonRendererMetrics = {
  rowCount: number;
  polygonCount: number;
  vertexCount: number;
  triangleCount: number;
  sourceDimension: number;
  polygonArrowByteLength: number;
  stylingArrowByteLength: number;
  generatedGeometryGpuByteLength: number;
  stylingGpuByteLength: number;
  tessellationTimeMs: number;
};

export type ArrowPolygonRendererStreamingSession = {
  version: number;
};

export type ArrowPolygonRendererRecordBatchStreamUpdate = {
  loadedBatchCount: number;
  isFirstBatch: boolean;
  metrics: ArrowPolygonRendererMetrics;
};

export type ArrowPolygonRendererRecordBatchStreamProps = {
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  streamingSession?: ArrowPolygonRendererStreamingSession;
  onBatch?: (update: ArrowPolygonRendererRecordBatchStreamUpdate) => void;
};

const DEFAULT_POLYGON_RENDERER_COLOR: [number, number, number, number] = [0, 96, 255, 255];
const DEFAULT_POLYGON_RENDERER_CENTER: [number, number] = [0, 0];
const DEFAULT_POLYGON_RENDERER_SCALE = 1;

type PreparedPolygonBatch = {
  prepared: PreparedArrowPolygonGPUVectors;
  model: GPUTableModel;
  pickingModel: GPUTableModel;
  polygonArrowByteLength: number;
  stylingArrowByteLength: number;
  tessellationTimeMs: number;
};

export class ArrowPolygonRenderer {
  readonly device: Device;
  readonly shaderInputs: PolygonShaderInputs;
  readonly picker: PickingManager;
  props: ArrowPolygonRendererProps;
  preparedBatches: PreparedPolygonBatch[] = [];
  private streamingSessionVersion = 0;
  private pickedBatchIndex: number | null = null;
  private pickedRowIndex: number | null = null;

  constructor(device: Device, props: ArrowPolygonRendererProps = {}) {
    this.device = device;
    this.props = props;
    this.shaderInputs = createPolygonShaderInputs(device);
    this.picker = new PickingManager(device, {
      shaderInputs: this.shaderInputs,
      mode: 'auto',
      onObjectPicked: this.handleObjectPicked,
      getTooltip: getPolygonPickingTooltip
    });
    if (hasPolygonSource(props)) {
      void this.appendPreparedTable(props);
    }
  }

  setProps(props: Partial<ArrowPolygonRendererProps>): void {
    const shouldRecreate =
      props.data !== undefined ||
      props.polygons !== undefined ||
      props.colors !== undefined ||
      props.tessellated !== undefined ||
      props.color !== undefined;
    this.props = {...this.props, ...props};
    if (shouldRecreate) {
      this.cancelRecordBatchStream();
      this.clearPickingState();
      this.destroyPreparedBatches();
      if (hasPolygonSource(this.props)) {
        void this.appendPreparedTable(this.props);
      }
    }
  }

  beginRecordBatchStream(): ArrowPolygonRendererStreamingSession {
    this.streamingSessionVersion++;
    this.clearPickingState();
    this.destroyPreparedBatches();
    return {version: this.streamingSessionVersion};
  }

  cancelRecordBatchStream(): void {
    this.streamingSessionVersion++;
  }

  async streamRecordBatches({
    recordBatchIterator,
    streamingSession = this.beginRecordBatchStream(),
    onBatch
  }: ArrowPolygonRendererRecordBatchStreamProps): Promise<void> {
    let loadedBatchCount = 0;

    if (!this.isRecordBatchStreamActive(streamingSession)) {
      return;
    }

    for (
      let recordBatchResult = await recordBatchIterator.next();
      !recordBatchResult.done;
      recordBatchResult = await recordBatchIterator.next()
    ) {
      if (!this.isRecordBatchStreamActive(streamingSession)) {
        return;
      }

      const rowIndexOffset = this.getMetrics().rowCount;
      const preparedBatch = await this.createPreparedRecordBatch(
        recordBatchResult.value,
        rowIndexOffset
      );
      if (!this.isRecordBatchStreamActive(streamingSession)) {
        preparedBatch.model.destroy();
        preparedBatch.pickingModel.destroy();
        preparedBatch.prepared.destroy();
        return;
      }

      this.preparedBatches.push(preparedBatch);
      loadedBatchCount++;
      onBatch?.({
        loadedBatchCount,
        isFirstBatch: loadedBatchCount === 1,
        metrics: this.getMetrics()
      });
    }
  }

  predraw(commandEncoder: CommandEncoder): void {
    for (const preparedBatch of this.preparedBatches) {
      preparedBatch.model.predraw(commandEncoder);
      preparedBatch.pickingModel.predraw(commandEncoder);
    }
  }

  draw(renderPass: RenderPass, props: {aspect: number}): void {
    this.shaderInputs.setProps({
      polygonViewport: {
        center: this.props.center ?? DEFAULT_POLYGON_RENDERER_CENTER,
        scale: this.props.scale ?? DEFAULT_POLYGON_RENDERER_SCALE,
        aspect: props.aspect
      }
    });
    for (const [batchIndex, preparedBatch] of this.preparedBatches.entries()) {
      this.shaderInputs.setProps({picking: {isActive: false, batchIndex}});
      preparedBatch.model.draw(renderPass);
    }
  }

  pick(mousePosition: number[] | null | undefined): void {
    if (!mousePosition) {
      this.clearPickingState();
      return;
    }
    if (!this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    const pickingPass = this.picker.beginRenderPass();
    for (const [batchIndex, preparedBatch] of this.preparedBatches.entries()) {
      this.shaderInputs.setProps({picking: {batchIndex}});
      preparedBatch.pickingModel.draw(pickingPass);
    }
    pickingPass.end();

    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  destroy(): void {
    this.cancelRecordBatchStream();
    this.picker.destroy();
    this.destroyPreparedBatches();
  }

  getMetrics(): ArrowPolygonRendererMetrics {
    const tessellations = this.preparedBatches.map(batch => batch.prepared.tessellation);
    const firstTessellation = tessellations[0];
    return {
      rowCount: tessellations.reduce((total, tessellation) => total + tessellation.rowCount, 0),
      polygonCount: tessellations.reduce(
        (total, tessellation) => total + tessellation.polygonCount,
        0
      ),
      vertexCount: tessellations.reduce(
        (total, tessellation) => total + tessellation.vertexCount,
        0
      ),
      triangleCount: tessellations.reduce(
        (total, tessellation) => total + tessellation.triangleCount,
        0
      ),
      sourceDimension: firstTessellation?.sourceDimension ?? 0,
      polygonArrowByteLength: this.preparedBatches.reduce(
        (total, preparedBatch) => total + preparedBatch.polygonArrowByteLength,
        0
      ),
      stylingArrowByteLength: this.preparedBatches.reduce(
        (total, preparedBatch) => total + preparedBatch.stylingArrowByteLength,
        0
      ),
      generatedGeometryGpuByteLength: tessellations.reduce(
        (total, tessellation) =>
          total +
          tessellation.positions.byteLength +
          tessellation.rowIndices.byteLength +
          tessellation.indices.byteLength,
        0
      ),
      stylingGpuByteLength: tessellations.reduce(
        (total, tessellation) => total + tessellation.colors.byteLength,
        0
      ),
      tessellationTimeMs: this.preparedBatches.reduce(
        (total, preparedBatch) => total + preparedBatch.tessellationTimeMs,
        0
      )
    };
  }

  private async appendPreparedTable(props: ArrowPolygonRendererProps): Promise<void> {
    const streamingSessionVersion = this.streamingSessionVersion;
    const preparedBatch = await this.createPreparedBatch(props, 0, 'arrow-polygons');
    if (streamingSessionVersion !== this.streamingSessionVersion) {
      preparedBatch.model.destroy();
      preparedBatch.pickingModel.destroy();
      preparedBatch.prepared.destroy();
      return;
    }
    this.preparedBatches.push(preparedBatch);
  }

  private async createPreparedRecordBatch(
    recordBatch: arrow.RecordBatch,
    rowIndexOffset: number
  ): Promise<PreparedPolygonBatch> {
    const data = new arrow.Table([recordBatch]);
    const batchIndex = this.preparedBatches.length;
    return await this.createPreparedBatch(
      {...this.props, data},
      rowIndexOffset,
      `arrow-polygons-${batchIndex}`
    );
  }

  private async createPreparedBatch(
    props: ArrowPolygonRendererProps,
    rowIndexOffset: number,
    id: string
  ): Promise<PreparedPolygonBatch> {
    const batchIndex = this.preparedBatches.length;
    const polygons = getPolygonVector(props);
    const colors = getColorVector(props);
    const polygonArrowByteLength = getArrowVectorByteLength(polygons);
    const stylingArrowByteLength = colors ? getArrowVectorByteLength(colors) : 0;
    const startedAt = getTimestampMilliseconds();
    const prepared = await prepareArrowPolygonGPUVectorsAsync(
      this.device,
      {
        polygons,
        ...(colors ? {colors} : {})
      },
      {
        id,
        tessellated: props.tessellated,
        color: props.color ?? DEFAULT_POLYGON_RENDERER_COLOR,
        rowIndexOffset
      }
    );
    return {
      prepared,
      model: createPolygonModel(this.device, {
        id: `arrow-polygons-${batchIndex}`,
        prepared,
        shaderInputs: this.shaderInputs
      }),
      pickingModel: createPolygonModel(this.device, {
        id: `arrow-polygons-${batchIndex}-picking`,
        prepared,
        shaderInputs: this.shaderInputs,
        picking: true
      }),
      polygonArrowByteLength,
      stylingArrowByteLength,
      tessellationTimeMs: getTimestampMilliseconds() - startedAt
    };
  }

  private destroyPreparedBatches(): void {
    for (const preparedBatch of this.preparedBatches) {
      preparedBatch.model.destroy();
      preparedBatch.pickingModel.destroy();
      preparedBatch.prepared.destroy();
    }
    this.preparedBatches = [];
  }

  private isRecordBatchStreamActive(
    streamingSession: ArrowPolygonRendererStreamingSession
  ): boolean {
    return streamingSession.version === this.streamingSessionVersion;
  }

  private clearPickingState(): void {
    this.picker.clearPickState();
    this.picker.pickInfo = {batchIndex: null, objectIndex: null};
    if (this.pickedBatchIndex !== null || this.pickedRowIndex !== null) {
      this.handleObjectPicked({batchIndex: null, objectIndex: null});
    }
  }

  private readonly handleObjectPicked = ({batchIndex, objectIndex}: PickInfo): void => {
    this.pickedBatchIndex = batchIndex;
    this.pickedRowIndex = objectIndex;
    this.props.onPick?.({batchIndex, rowIndex: objectIndex});
  };
}

function getPolygonPickingTooltip({batchIndex, objectIndex}: PickInfo): string | null {
  if (batchIndex === null || objectIndex === null) {
    return null;
  }
  return `row ${objectIndex.toLocaleString()} / batch ${(batchIndex + 1).toLocaleString()}`;
}

function getPolygonVector(props: ArrowPolygonRendererProps): arrow.Vector<ArrowPolygonInputType> {
  if (typeof props.polygons === 'string' || !props.polygons) {
    const columnName = typeof props.polygons === 'string' ? props.polygons : 'polygons';
    const vector = props.data?.getChild(columnName);
    if (!vector) {
      throw new Error(`ArrowPolygonRenderer data is missing polygon column "${columnName}"`);
    }
    return vector as arrow.Vector<ArrowPolygonInputType>;
  }
  return props.polygons;
}

function getColorVector(
  props: ArrowPolygonRendererProps
): arrow.Vector<ArrowPolygonColorType> | undefined {
  if (props.colors === null) {
    return undefined;
  }
  if (typeof props.colors === 'string' || props.colors === undefined) {
    const columnName = typeof props.colors === 'string' ? props.colors : 'colors';
    const vector = props.data?.getChild(columnName);
    return vector as arrow.Vector<ArrowPolygonColorType> | undefined;
  }
  return props.colors;
}

function hasPolygonSource(props: ArrowPolygonRendererProps): boolean {
  return Boolean(props.data || (props.polygons && typeof props.polygons !== 'string'));
}

function getTimestampMilliseconds(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
