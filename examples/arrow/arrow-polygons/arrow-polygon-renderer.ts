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
import {
  getOptionalArrowColumn,
  getRequiredArrowColumn,
  hasArrowTableOrVectorSource,
  streamArrowRecordBatches,
  type ArrowColumnSelector,
  type ArrowRecordBatchStreamContext,
  type ArrowRecordBatchStreamingSession,
  type ArrowRecordBatchStreamUpdate,
  type OptionalArrowColumnSelector
} from '../arrow-renderer-utils';

export type ArrowPolygonRendererPickingInfo = {
  batchIndex: number | null;
  rowIndex: number | null;
};

export type ArrowPolygonRendererProps = {
  /** Optional Arrow source table. */
  data?: arrow.Table | null;
  /** Polygon column or source table column name. Defaults to `polygons` when data is supplied. */
  polygons?: ArrowColumnSelector<ArrowPolygonInputType>;
  /** Row/vertex color column, source table column name, or null to force constant color. */
  colors?: OptionalArrowColumnSelector<ArrowPolygonColorType>;
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

export type ArrowPolygonRendererStreamingSession = ArrowRecordBatchStreamingSession;

export type ArrowPolygonRendererRecordBatchStreamUpdate =
  ArrowRecordBatchStreamUpdate<ArrowPolygonRendererMetrics>;

export type ArrowPolygonRendererRecordBatchStreamProps = {
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  streamingSession?: ArrowPolygonRendererStreamingSession;
  onBatch?: (update: ArrowPolygonRendererRecordBatchStreamUpdate) => void;
};

const DEFAULT_POLYGON_RENDERER_COLOR: [number, number, number, number] = [0, 96, 255, 255];
const DEFAULT_POLYGON_RENDERER_CENTER: [number, number] = [0, 0];
const DEFAULT_POLYGON_RENDERER_SCALE = 1;

export type ArrowPolygonColumns = {
  polygons: arrow.Vector<ArrowPolygonInputType>;
  colors?: arrow.Vector<ArrowPolygonColorType> | null;
};

export type ConvertArrowPolygonColumnsToGPUVectorsOptions = Pick<
  ArrowPolygonRendererProps,
  'tessellated' | 'color'
> & {
  rowIndexOffset?: number;
  id?: string;
};

export type ArrowPolygonGPUVectors = {
  prepared: PreparedArrowPolygonGPUVectors;
  destroy: () => void;
};

export type ArrowPolygonRendererInput = ArrowPolygonGPUVectors & {
  polygonArrowByteLength: number;
  stylingArrowByteLength: number;
  tessellationTimeMs: number;
};

type PreparedPolygonBatch = ArrowPolygonRendererInput;

export class ArrowPolygonRenderer {
  readonly device: Device;
  readonly shaderInputs: PolygonShaderInputs;
  readonly picker: PickingManager;
  props: ArrowPolygonRendererProps;
  preparedBatches: PreparedPolygonBatch[] = [];
  model: GPUTableModel | null = null;
  pickingModel: GPUTableModel | null = null;
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
    await streamArrowRecordBatches({
      recordBatchIterator,
      streamingSession,
      isActive: session => this.isRecordBatchStreamActive(session),
      prepareBatch: (recordBatch, context) => this.createPreparedRecordBatch(recordBatch, context),
      appendBatch: preparedBatch => this.appendPreparedBatch(preparedBatch),
      destroyBatch: destroyPreparedPolygonBatch,
      getRowCount: preparedBatch => preparedBatch.prepared.tessellation.rowCount,
      getMetrics: () => this.getMetrics(),
      onBatch
    });
  }

  predraw(commandEncoder: CommandEncoder): void {
    this.model?.predraw(commandEncoder);
    this.pickingModel?.predraw(commandEncoder);
  }

  draw(renderPass: RenderPass, props: {aspect: number}): void {
    this.shaderInputs.setProps({
      polygonViewport: {
        center: this.props.center ?? DEFAULT_POLYGON_RENDERER_CENTER,
        scale: this.props.scale ?? DEFAULT_POLYGON_RENDERER_SCALE,
        aspect: props.aspect
      }
    });
    const model = this.model;
    if (!model) {
      return;
    }
    for (const [batchIndex, preparedBatch] of this.preparedBatches.entries()) {
      this.shaderInputs.setProps({picking: {isActive: false, batchIndex}});
      setPolygonModelPreparedBatch(model, preparedBatch);
      model.draw(renderPass);
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
    const pickingModel = this.pickingModel;
    if (!pickingModel) {
      pickingPass.end();
      return;
    }
    for (const [batchIndex, preparedBatch] of this.preparedBatches.entries()) {
      this.shaderInputs.setProps({picking: {batchIndex}});
      setPolygonModelPreparedBatch(pickingModel, preparedBatch);
      pickingModel.draw(pickingPass);
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
      destroyPreparedPolygonBatch(preparedBatch);
      return;
    }
    this.appendPreparedBatch(preparedBatch);
  }

  private async createPreparedRecordBatch(
    recordBatch: arrow.RecordBatch,
    context: ArrowRecordBatchStreamContext
  ): Promise<PreparedPolygonBatch> {
    const data = new arrow.Table([recordBatch]);
    return await this.createPreparedBatch(
      {...this.props, data},
      context.rowIndexOffset,
      `arrow-polygons-${context.batchIndex}`
    );
  }

  private async createPreparedBatch(
    props: ArrowPolygonRendererProps,
    rowIndexOffset: number,
    id: string
  ): Promise<PreparedPolygonBatch> {
    const preparedInput = await prepareArrowPolygonInput(this.device, props, {
      rowIndexOffset,
      id
    });
    return preparedInput;
  }

  private appendPreparedBatch(preparedBatch: PreparedPolygonBatch): void {
    this.preparedBatches.push(preparedBatch);
    this.createModels(preparedBatch);
  }

  private destroyPreparedBatches(): void {
    this.destroyModels();
    for (const preparedBatch of this.preparedBatches) {
      destroyPreparedPolygonBatch(preparedBatch);
    }
    this.preparedBatches = [];
  }

  private createModels(preparedBatch: PreparedPolygonBatch): void {
    if (this.model && this.pickingModel) {
      return;
    }
    this.model = createPolygonModel(this.device, {
      id: 'arrow-polygons',
      prepared: preparedBatch.prepared,
      shaderInputs: this.shaderInputs
    });
    this.pickingModel = createPolygonModel(this.device, {
      id: 'arrow-polygons-picking',
      prepared: preparedBatch.prepared,
      shaderInputs: this.shaderInputs,
      picking: true
    });
  }

  private destroyModels(): void {
    this.model?.destroy();
    this.pickingModel?.destroy();
    this.model = null;
    this.pickingModel = null;
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

/** Wraps polygon conversion with example metrics and timing. */
export async function prepareArrowPolygonInput(
  device: Device,
  props: ArrowPolygonRendererProps,
  options: {rowIndexOffset?: number; id?: string} = {}
): Promise<ArrowPolygonRendererInput> {
  const polygons = getPolygonVector(props);
  const colors = getColorVector(props);
  const polygonArrowByteLength = getArrowVectorByteLength(polygons);
  const stylingArrowByteLength = colors ? getArrowVectorByteLength(colors) : 0;
  const startedAt = getTimestampMilliseconds();
  const converted = await convertArrowPolygonColumnsToGPUVectors(
    device,
    {polygons, colors},
    {
      rowIndexOffset: options.rowIndexOffset,
      id: options.id,
      tessellated: props.tessellated,
      color: props.color
    }
  );

  return {
    ...converted,
    polygonArrowByteLength,
    stylingArrowByteLength,
    tessellationTimeMs: getTimestampMilliseconds() - startedAt
  };
}

/** Converts Arrow polygon columns into GPU vectors without creating render models or metrics. */
export async function convertArrowPolygonColumnsToGPUVectors(
  device: Device,
  columns: ArrowPolygonColumns,
  options: ConvertArrowPolygonColumnsToGPUVectorsOptions = {}
): Promise<ArrowPolygonGPUVectors> {
  const rowIndexOffset = options.rowIndexOffset ?? 0;
  const id = options.id ?? 'arrow-polygons';
  const {polygons, colors = null} = columns;
  const prepared = await prepareArrowPolygonGPUVectorsAsync(
    device,
    {
      polygons,
      ...(colors ? {colors} : {})
    },
    {
      id,
      tessellated: options.tessellated,
      color: options.color ?? DEFAULT_POLYGON_RENDERER_COLOR,
      rowIndexOffset
    }
  );

  return {
    prepared,
    destroy: () => prepared.destroy()
  };
}

function destroyPreparedPolygonBatch(preparedBatch: PreparedPolygonBatch): void {
  preparedBatch.destroy();
}

function setPolygonModelPreparedBatch(
  model: GPUTableModel,
  preparedBatch: PreparedPolygonBatch
): void {
  model.setProps({table: preparedBatch.prepared.table});
  model.setIndexBuffer(preparedBatch.prepared.indices);
  model.setVertexCount(preparedBatch.prepared.tessellation.indices.length);
}

function getPolygonPickingTooltip({batchIndex, objectIndex}: PickInfo): string | null {
  if (batchIndex === null || objectIndex === null) {
    return null;
  }
  return `row ${objectIndex.toLocaleString()} / batch ${(batchIndex + 1).toLocaleString()}`;
}

function getPolygonVector(props: ArrowPolygonRendererProps): arrow.Vector<ArrowPolygonInputType> {
  return getRequiredArrowColumn({
    data: props.data,
    selector: props.polygons,
    defaultColumnName: 'polygons',
    ownerName: 'ArrowPolygonRenderer'
  });
}

function getColorVector(
  props: ArrowPolygonRendererProps
): arrow.Vector<ArrowPolygonColorType> | undefined {
  if (props.colors === null) {
    return undefined;
  }
  return (
    getOptionalArrowColumn({
      data: props.data,
      selector: props.colors,
      defaultColumnName: 'colors'
    }) ?? undefined
  );
}

function hasPolygonSource(props: ArrowPolygonRendererProps): boolean {
  return hasArrowTableOrVectorSource({data: props.data, selector: props.polygons});
}

function getTimestampMilliseconds(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
