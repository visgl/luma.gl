// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  clearArrowPickingState,
  createArrowPickingManager,
  getArrowVectorByteLength,
  prepareArrowPolygonGPUVectorsAsync,
  resolveArrowPickInfo,
  runArrowPickingPass,
  type ArrowPolygonColorType,
  type ArrowPolygonInputType,
  type PreparedArrowPolygonGPUVectors
} from '@luma.gl/arrow';
import type {CommandEncoder, Device, RenderPass} from '@luma.gl/core';
import type {PickingManager, PickInfo} from '@luma.gl/engine';
import type {GPURecordBatchSourceInfo} from '@luma.gl/tables';
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
  loadArrowRecordBatches,
  type ArrowColumnSelector,
  type ArrowRecordBatchLoadContext,
  type ArrowRecordBatchLoadUpdate,
  type ArrowRecordBatchSource,
  type OptionalArrowColumnSelector
} from '../arrow-renderer-utils';

export type ArrowPolygonRendererPickingInfo = {
  batchIndex: number | null;
  rowIndex: number | null;
  batchRowIndex: number | null;
};

export type ArrowPolygonRendererProps = {
  /** Optional Arrow source table, record-batch iterable, or async record-batch iterator. */
  data?: ArrowRecordBatchSource | null;
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
  /** Called after one Arrow record batch has been prepared and appended. */
  onDataBatch?: (update: ArrowPolygonRendererDataBatchUpdate) => void;
  /** Called when renderer-owned Arrow batch loading fails. */
  onDataError?: (error: unknown) => void;
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

export type ArrowPolygonRendererDataBatchUpdate =
  ArrowRecordBatchLoadUpdate<ArrowPolygonRendererMetrics>;

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
  sourceBatchIndex?: number;
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
  private dataLoadVersion = 0;

  constructor(device: Device, props: ArrowPolygonRendererProps = {}) {
    this.device = device;
    this.props = props;
    this.shaderInputs = createPolygonShaderInputs(device);
    this.picker = createArrowPickingManager(device, {
      shaderInputs: this.shaderInputs,
      onObjectPicked: this.handleObjectPicked,
      getTooltip: this.getPolygonPickingTooltip
    });
    if (hasPolygonSource(props)) {
      this.replaceData(props);
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
      this.replaceData(this.props, props.data !== undefined);
    }
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
      clearArrowPickingState(this.picker, this.handleObjectPicked);
      return;
    }

    runArrowPickingPass({
      picker: this.picker,
      mousePosition,
      shaderInputs: this.shaderInputs,
      draw: pickingPass => {
        const pickingModel = this.pickingModel;
        if (!pickingModel) {
          return false;
        }
        for (const [batchIndex, preparedBatch] of this.preparedBatches.entries()) {
          this.shaderInputs.setProps({picking: {batchIndex}});
          setPolygonModelPreparedBatch(pickingModel, preparedBatch);
          pickingModel.draw(pickingPass);
        }
      }
    });
  }

  destroy(): void {
    this.dataLoadVersion++;
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

  private replaceData(props: ArrowPolygonRendererProps, hasNewDataSource = true): void {
    this.dataLoadVersion++;
    const dataLoadVersion = this.dataLoadVersion;
    clearArrowPickingState(this.picker, this.handleObjectPicked);
    this.destroyPreparedBatches();

    if (!hasPolygonSource(props) || !shouldLoadPolygonSource(props, hasNewDataSource)) {
      return;
    }

    void this.loadData(props, dataLoadVersion);
  }

  private async loadData(props: ArrowPolygonRendererProps, dataLoadVersion: number): Promise<void> {
    if (props.data) {
      await loadArrowRecordBatches<PreparedPolygonBatch, ArrowPolygonRendererMetrics>({
        data: props.data,
        isActive: () => this.isDataLoadActive(dataLoadVersion),
        prepareBatch: (recordBatch, context) =>
          this.createPreparedRecordBatch(recordBatch, context, props),
        appendBatch: preparedBatch => this.appendPreparedBatch(preparedBatch),
        destroyBatch: destroyPreparedPolygonBatch,
        getRowCount: preparedBatch => preparedBatch.prepared.tessellation.rowCount,
        getMetrics: () => this.getMetrics(),
        onBatch: props.onDataBatch,
        onError: props.onDataError
      });
      return;
    }

    const preparedBatch = await this.createPreparedBatch(props, 0, 0, 'arrow-polygons');
    if (!this.isDataLoadActive(dataLoadVersion)) {
      destroyPreparedPolygonBatch(preparedBatch);
      return;
    }
    this.appendPreparedBatch(preparedBatch);
    props.onDataBatch?.({
      loadedBatchCount: 1,
      isFirstBatch: true,
      metrics: this.getMetrics(),
      preparedBatch
    });
  }

  private async createPreparedRecordBatch(
    recordBatch: arrow.RecordBatch,
    context: ArrowRecordBatchLoadContext,
    props: ArrowPolygonRendererProps
  ): Promise<PreparedPolygonBatch> {
    const data = new arrow.Table([recordBatch]);
    return await this.createPreparedBatch(
      {...props, data},
      context.rowIndexOffset,
      context.batchIndex,
      `arrow-polygons-${context.batchIndex}`
    );
  }

  private async createPreparedBatch(
    props: ArrowPolygonRendererProps,
    rowIndexOffset: number,
    sourceBatchIndex: number,
    id: string
  ): Promise<PreparedPolygonBatch> {
    const preparedInput = await prepareArrowPolygonInput(this.device, props, {
      rowIndexOffset,
      sourceBatchIndex,
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

  private isDataLoadActive(dataLoadVersion: number): boolean {
    return dataLoadVersion === this.dataLoadVersion;
  }

  private readonly handleObjectPicked = ({batchIndex, objectIndex}: PickInfo): void => {
    const pickInfo = resolveArrowPickInfo({batchIndex, objectIndex}, this.getPickingSourceInfos());
    this.props.onPick?.(pickInfo);
  };

  private readonly getPolygonPickingTooltip = ({
    batchIndex,
    objectIndex
  }: PickInfo): string | null => {
    const pickInfo = resolveArrowPickInfo({batchIndex, objectIndex}, this.getPickingSourceInfos());
    if (pickInfo.batchIndex === null || pickInfo.rowIndex === null) {
      return null;
    }
    const batchLabel = (pickInfo.batchIndex + 1).toLocaleString();
    return `row ${pickInfo.rowIndex.toLocaleString()} / batch ${batchLabel}`;
  };

  private getPickingSourceInfos(): Array<GPURecordBatchSourceInfo | undefined> {
    return this.preparedBatches.map(
      preparedBatch => preparedBatch.prepared.table.batches[0]?.sourceInfo
    );
  }
}

/** Wraps polygon conversion with example metrics and timing. */
export async function prepareArrowPolygonInput(
  device: Device,
  props: ArrowPolygonRendererProps,
  options: {rowIndexOffset?: number; sourceBatchIndex?: number; id?: string} = {}
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
      sourceBatchIndex: options.sourceBatchIndex,
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
  const sourceBatchIndex = options.sourceBatchIndex ?? 0;
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
      rowIndexOffset,
      sourceBatchIndex
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

function getPolygonVector(props: ArrowPolygonRendererProps): arrow.Vector<ArrowPolygonInputType> {
  return getRequiredArrowColumn({
    data: getArrowTableData(props.data),
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
      data: getArrowTableData(props.data),
      selector: props.colors,
      defaultColumnName: 'colors'
    }) ?? undefined
  );
}

function hasPolygonSource(props: ArrowPolygonRendererProps): boolean {
  return hasArrowTableOrVectorSource({data: props.data, selector: props.polygons});
}

function shouldLoadPolygonSource(
  props: ArrowPolygonRendererProps,
  hasNewDataSource: boolean
): boolean {
  return (
    hasNewDataSource || !props.data || Boolean(props.polygons && typeof props.polygons !== 'string')
  );
}

function getArrowTableData(
  data: ArrowPolygonRendererProps['data']
): arrow.Table | null | undefined {
  return data instanceof arrow.Table ? data : null;
}

function getTimestampMilliseconds(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
