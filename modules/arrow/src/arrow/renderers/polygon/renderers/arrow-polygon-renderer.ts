// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder, Device, RenderPass} from '@luma.gl/core';
import type {PickingManager, PickInfo} from '@luma.gl/engine';
import {
  PolygonAttributeModel,
  createPolygonShaderInputs,
  PolygonStorageModel,
  type PolygonAttributeModelProps,
  type PolygonBatchProps,
  type PolygonShaderInputs,
  type PolygonStorageModelProps
} from '@luma.gl/tables';
import {RecordBatch, Table} from 'apache-arrow';
import {
  clearArrowPickingState,
  createArrowPickingManager,
  resolveArrowPickInfo,
  runArrowPickingPass
} from '../../../engine/arrow-picking';
import {getArrowVectorByteLength} from '../../../vectors/arrow-vector-utils';
import {
  convertArrowPolygonToGPUVectorsAsync,
  type ArrowPolygonColorType,
  type ArrowPolygonInputType,
  type ArrowPolygonSourceVectors,
  type PreparedArrowPolygonGPUVectors
} from '../conversion/arrow-polygon-gpu-vectors';
import {
  resolveArrowPolygonSourceVectors,
  type ArrowPolygonColumnSelector,
  type ArrowPolygonSourceData,
  type OptionalArrowPolygonColumnSelector
} from '../source/arrow-polygon-source-mapping';
import {
  hasArrowTableOrVectorSource,
  loadArrowRecordBatches,
  type ArrowRecordBatchLoadContext,
  type ArrowRecordBatchLoadUpdate,
  type ArrowRecordBatchSource
} from '../../../renderers/arrow-renderer-utils';

/** Source Arrow row identity resolved from a polygon picking pass. */
export type ArrowPolygonRendererPickingInfo = {
  batchIndex: number | null;
  rowIndex: number | null;
  batchRowIndex: number | null;
};

/** Arrow-aware props accepted by the filled polygon renderer. */
export type ArrowPolygonRendererProps = {
  /** GPU polygon model selected after Arrow conversion. Defaults to `attribute`. */
  model?: ArrowPolygonRendererModel;
  /** Optional Arrow source table, record-batch iterable, or async record-batch iterator. */
  data?: ArrowRecordBatchSource | null;
  /** Polygon column or source table column path. Defaults to `polygons` when data is supplied. */
  polygons?: ArrowPolygonColumnSelector<ArrowPolygonInputType>;
  /** Row/vertex color column, source table column path, or null to force constant color. */
  colors?: OptionalArrowPolygonColumnSelector<ArrowPolygonColorType>;
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

/** GPU polygon model selected by the Arrow-facing renderer. */
export type ArrowPolygonRendererModel = 'attribute' | 'storage';

/** Flat GPU props accepted by the Arrow polygon renderer after conversion. */
export type ArrowPolygonRendererModelProps =
  | ({model?: 'attribute'} & PolygonAttributeModelProps)
  | ({model: 'storage'} & PolygonStorageModelProps);

/** Aggregated source/GPU conversion metrics emitted by the filled polygon renderer. */
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

/** One streamed polygon renderer conversion update. */
export type ArrowPolygonRendererDataBatchUpdate = ArrowRecordBatchLoadUpdate<
  ArrowPolygonRendererMetrics,
  ArrowPolygonRendererInput
>;

/** Options for converting Arrow polygon columns into prepared GPU vectors. */
export type ConvertArrowPolygonColumnsToGPUVectorsOptions = Pick<
  ArrowPolygonRendererProps,
  'tessellated' | 'color'
> & {
  rowIndexOffset?: number;
  sourceBatchIndex?: number;
  id?: string;
};

/** Prepared polygon GPU vectors plus renderer-facing metrics. */
export type ArrowPolygonRendererInput = PreparedArrowPolygonGPUVectors & {
  polygonArrowByteLength: number;
  stylingArrowByteLength: number;
  tessellationTimeMs: number;
};

type PreparedPolygonBatch = ArrowPolygonRendererInput;

const DEFAULT_POLYGON_RENDERER_COLOR: [number, number, number, number] = [0, 96, 255, 255];
const DEFAULT_POLYGON_RENDERER_CENTER: [number, number] = [0, 0];
const DEFAULT_POLYGON_RENDERER_SCALE = 1;

/** Arrow-aware filled polygon renderer that converts source vectors for a GPU-only model. */
export class ArrowPolygonRenderer {
  readonly device: Device;
  readonly shaderInputs: PolygonShaderInputs;
  readonly picker: PickingManager;
  props: ArrowPolygonRendererProps;
  preparedBatches: PreparedPolygonBatch[] = [];
  model: PolygonAttributeModel | PolygonStorageModel | null = null;
  pickingModel: PolygonAttributeModel | PolygonStorageModel | null = null;
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
    const previousModel = this.props.model ?? 'attribute';
    const shouldRecreate =
      props.data !== undefined ||
      props.polygons !== undefined ||
      props.colors !== undefined ||
      props.tessellated !== undefined ||
      props.color !== undefined;
    this.props = {...this.props, ...props};
    if (shouldRecreate) {
      this.replaceData(this.props, props.data !== undefined);
      return;
    }
    if (props.model !== undefined && props.model !== previousModel) {
      this.recreateModels();
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
    this.shaderInputs.setProps({picking: {isActive: false}});
    this.model?.drawBatches(renderPass, {
      onBatch: (_batch, batchIndex) => this.shaderInputs.setProps({picking: {batchIndex}})
    });
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
      draw: pickingPass =>
        this.pickingModel?.drawBatches(pickingPass, {
          onBatch: (_batch, batchIndex) => this.shaderInputs.setProps({picking: {batchIndex}})
        }) ?? false
    });
  }

  destroy(): void {
    this.dataLoadVersion++;
    this.picker.destroy();
    this.destroyPreparedBatches();
  }

  getMetrics(): ArrowPolygonRendererMetrics {
    const tessellations = this.preparedBatches.map(batch => batch.tessellation);
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
        getRowCount: preparedBatch => preparedBatch.tessellation.rowCount,
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
    recordBatch: RecordBatch,
    context: ArrowRecordBatchLoadContext,
    props: ArrowPolygonRendererProps
  ): Promise<PreparedPolygonBatch> {
    const data = new Table([recordBatch]);
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
    return await prepareArrowPolygonInput(this.device, props, {
      rowIndexOffset,
      sourceBatchIndex,
      id
    });
  }

  private appendPreparedBatch(preparedBatch: PreparedPolygonBatch): void {
    this.preparedBatches.push(preparedBatch);
    if (!this.model || !this.pickingModel) {
      this.createModels(preparedBatch);
      return;
    }

    const modelBatchProps = getPolygonBatchProps(preparedBatch);
    this.model.addBatch(modelBatchProps);
    this.pickingModel.addBatch(modelBatchProps);
  }

  private destroyPreparedBatches(): void {
    this.destroyModels();
    for (const preparedBatch of this.preparedBatches) {
      destroyPreparedPolygonBatch(preparedBatch);
    }
    this.preparedBatches = [];
  }

  private createModels(preparedBatch: PreparedPolygonBatch): void {
    const modelBatchProps = getPolygonBatchProps(preparedBatch);
    this.model = this.createModel({
      id: 'arrow-polygons',
      ...modelBatchProps,
      shaderInputs: this.shaderInputs
    });
    this.pickingModel = this.createModel({
      id: 'arrow-polygons-picking',
      ...modelBatchProps,
      shaderInputs: this.shaderInputs,
      picking: true
    });
  }

  private recreateModels(): void {
    const [firstPreparedBatch, ...remainingPreparedBatches] = this.preparedBatches;
    this.destroyModels();
    if (!firstPreparedBatch) {
      return;
    }
    this.createModels(firstPreparedBatch);
    for (const preparedBatch of remainingPreparedBatches) {
      const modelBatchProps = getPolygonBatchProps(preparedBatch);
      this.model?.addBatch(modelBatchProps);
      this.pickingModel?.addBatch(modelBatchProps);
    }
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

  private getPickingSourceInfos() {
    return this.model?.table?.batches.map(batch => batch.sourceInfo) ?? [];
  }

  private createModel(
    props: Omit<PolygonAttributeModelProps, 'picking'> & {picking?: boolean}
  ): PolygonAttributeModel | PolygonStorageModel {
    if (this.props.model === 'storage') {
      return ArrowPolygonRenderer.createModel(this.device, {model: 'storage', ...props});
    }
    return ArrowPolygonRenderer.createModel(this.device, {model: 'attribute', ...props});
  }

  /** Converts raw Arrow polygon/style vectors for a GPU-only polygon model. */
  static async convertToGPUVectors(
    device: Device,
    sourceVectors: ArrowPolygonSourceVectors,
    options: ConvertArrowPolygonColumnsToGPUVectorsOptions = {}
  ): Promise<PreparedArrowPolygonGPUVectors> {
    return await convertArrowPolygonColumnsToGPUVectors(device, sourceVectors, options);
  }

  /** Creates the selected GPU-only polygon model after Arrow conversion produced GPU vectors. */
  static createModel(
    device: Device,
    props: {model?: 'attribute'} & PolygonAttributeModelProps
  ): PolygonAttributeModel;
  static createModel(
    device: Device,
    props: {model: 'storage'} & PolygonStorageModelProps
  ): PolygonStorageModel;
  static createModel(
    device: Device,
    props: ArrowPolygonRendererModelProps
  ): PolygonAttributeModel | PolygonStorageModel {
    switch (props.model) {
      case 'storage': {
        const {model, ...modelProps} = props;
        void model;
        return new PolygonStorageModel(device, modelProps);
      }
      case 'attribute':
      case undefined: {
        const {model, ...modelProps} = props;
        void model;
        return new PolygonAttributeModel(device, modelProps);
      }
    }
  }
}

/** Wraps polygon conversion with renderer metrics and timing. */
export async function prepareArrowPolygonInput(
  device: Device,
  props: ArrowPolygonRendererProps,
  options: {rowIndexOffset?: number; sourceBatchIndex?: number; id?: string} = {}
): Promise<ArrowPolygonRendererInput> {
  const sourceVectors = resolveArrowPolygonSourceVectors({
    data: getArrowPolygonSourceData(props.data),
    selectors: {polygons: props.polygons, colors: props.colors}
  });
  const polygonArrowByteLength = getArrowVectorByteLength(sourceVectors.polygons);
  const stylingArrowByteLength = sourceVectors.colors
    ? getArrowVectorByteLength(sourceVectors.colors)
    : 0;
  const startedAt = getTimestampMilliseconds();
  const converted = await convertArrowPolygonColumnsToGPUVectors(device, sourceVectors, {
    rowIndexOffset: options.rowIndexOffset,
    sourceBatchIndex: options.sourceBatchIndex,
    id: options.id,
    tessellated: props.tessellated,
    color: props.color
  });

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
  columns: ArrowPolygonSourceVectors,
  options: ConvertArrowPolygonColumnsToGPUVectorsOptions = {}
): Promise<PreparedArrowPolygonGPUVectors> {
  const rowIndexOffset = options.rowIndexOffset ?? 0;
  const sourceBatchIndex = options.sourceBatchIndex ?? 0;
  const id = options.id ?? 'arrow-polygons';
  return await convertArrowPolygonToGPUVectorsAsync(device, columns, {
    id,
    tessellated: options.tessellated,
    color: options.color ?? DEFAULT_POLYGON_RENDERER_COLOR,
    rowIndexOffset,
    sourceBatchIndex
  });
}

function destroyPreparedPolygonBatch(preparedBatch: PreparedPolygonBatch): void {
  preparedBatch.destroy();
}

function getPolygonBatchProps(preparedBatch: PreparedArrowPolygonGPUVectors): PolygonBatchProps {
  const {positions, colors, rowIndices, indices, sourceInfo} = preparedBatch;
  return {positions, colors, rowIndices, indices, sourceInfo};
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

function getArrowPolygonSourceData(
  data: ArrowPolygonRendererProps['data']
): ArrowPolygonSourceData | null {
  return data instanceof Table ? data : null;
}

function getTimestampMilliseconds(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
