// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  clearArrowPickingState,
  createArrowPickingManager,
  getArrowFixedSizeListValues,
  getArrowTemporalVectorInfo,
  getArrowVectorBufferSource,
  getArrowVectorByteLength,
  isArrowFixedSizeListVector,
  makeArrowFixedSizeListVector,
  makeArrowRecordBatchSourceInfo,
  makeArrowRowIndexGPUVector,
  makeGPUVectorFromArrow,
  convertArrowTemporalToGPUVector,
  getOptionalArrowColumn,
  getRequiredArrowColumn,
  hasArrowTableOrVectorSource,
  loadArrowRecordBatches,
  resolveArrowPickInfo,
  runArrowPickingPass,
  type ArrowColumnSelector,
  type ArrowRecordBatchLoadContext,
  type ArrowRecordBatchLoadUpdate,
  type ArrowRecordBatchSource,
  type ArrowTemporalType,
  type OptionalArrowColumnSelector
} from '@luma.gl/arrow';
import type {Device, RenderPass} from '@luma.gl/core';
import type {PickingManager, PickInfo, PickingShouldPickOptions} from '@luma.gl/engine';
import {GPUTable, type GPURecordBatch, type GPUTableModel, type GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  createPointModel,
  createPointShaderInputs,
  type PointModelTable,
  type PointModelVectors,
  type PointShaderInputs
} from './point-model';

/** Arrow point coordinate input accepted by {@link ArrowPointRenderer}. */
export type ArrowPointCoordinateType = arrow.FixedSizeList<arrow.Float32> | arrow.DenseUnion;

/**
 * Time source accepted by {@link ArrowPointRenderer}.
 *
 * Use `m` to read the coordinate measure, pass a table column name, pass a vector directly,
 * or pass `null` to disable temporal filtering.
 */
export type ArrowPointTimeColumn = 'm' | string | arrow.Vector<ArrowPointTimeInputType> | null;

/** Scalar Arrow time-like or numeric value type accepted as a separate point time column. */
export type ArrowPointTimeInputType = arrow.DataType;

/** Hover-picking row identity reported by {@link ArrowPointRenderer}. */
export type ArrowPointRendererPickingInfo = {
  /** Zero-based record-batch index in the current stream, or `null` when nothing is picked. */
  batchIndex: number | null;
  /** Zero-based row index in the full streamed table, or `null` when nothing is picked. */
  rowIndex: number | null;
  /** Zero-based row index inside the picked batch, or `null` when nothing is picked. */
  batchRowIndex: number | null;
};

/** Public configuration for {@link ArrowPointRenderer}. */
export type ArrowPointRendererProps = {
  /** Optional Arrow source table, record-batch iterable, or async record-batch iterator. */
  data?: ArrowRecordBatchSource | null;
  /** Point coordinate column or source table column name. Defaults to `positions`. */
  positions?: ArrowColumnSelector<ArrowPointCoordinateType>;
  /** Time column name, vector, `m` for the coordinate measure, or null to disable time filtering. */
  timeColumn?: ArrowPointTimeColumn;
  /** Optional origin for Arrow temporal columns. */
  timeOrigin?: number | bigint | string;
  /** Row color column, source table column name, or null to force constant color. */
  colors?: OptionalArrowColumnSelector<arrow.FixedSizeList<arrow.Uint8>>;
  /** Row radius column, source table column name, or null to force a constant radius. */
  radii?: OptionalArrowColumnSelector<arrow.Float32>;
  /** Constant fallback RGBA color. */
  color?: [number, number, number, number];
  /** Constant fallback point radius in source coordinate units. */
  radius?: number;
  /** View center in source coordinate units. */
  center?: [number, number];
  /** View scale applied after centering. */
  scale?: number;
  /** Current animation time in milliseconds relative to the selected time origin. */
  currentTime?: number;
  /** Visible temporal trail length in milliseconds. */
  trailLength?: number;
  /** Called when the hovered point row changes. */
  onPick?: (info: ArrowPointRendererPickingInfo) => void;
  /** Called after one Arrow record batch has been prepared and appended. */
  onDataBatch?: (update: ArrowPointRendererDataBatchUpdate) => void;
  /** Called when renderer-owned Arrow batch loading fails. */
  onDataError?: (error: unknown) => void;
};

/** Prepared Arrow/GPU byte-size diagnostics shown by the Arrow Points example. */
export type ArrowPointRendererMetrics = {
  /** Number of point rows currently prepared across all streamed batches. */
  rowCount: number;
  /** Highest coordinate dimension represented by the source positions. */
  sourceDimension: number;
  /** Bytes occupied by point coordinate and time Arrow source vectors. */
  pointArrowByteLength: number;
  /** Bytes occupied by optional color and radius Arrow source vectors. */
  stylingArrowByteLength: number;
  /** Bytes occupied by prepared point coordinate, time, and row-index GPU vectors. */
  pointGpuByteLength: number;
  /** Bytes occupied by prepared color and radius GPU vectors. */
  stylingGpuByteLength: number;
  /** CPU time spent converting the currently loaded point batches. */
  conversionTimeMs: number;
};

/** Notification emitted after a point record batch is prepared and appended. */
export type ArrowPointRendererDataBatchUpdate =
  ArrowRecordBatchLoadUpdate<ArrowPointRendererMetrics>;

type NormalizedPointPositions = {
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  measureTimes: arrow.Vector<arrow.Float32>;
  sourceDimension: number;
};

export type ArrowPointColumns = {
  positions: arrow.Vector<ArrowPointCoordinateType>;
  separateTimeColumn?: arrow.Vector | null;
  colors?: arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null;
  radii?: arrow.Vector<arrow.Float32> | null;
};

export type ConvertArrowPointColumnsToGPUVectorsOptions = Pick<
  ArrowPointRendererProps,
  'timeColumn' | 'timeOrigin' | 'color' | 'radius'
> & {
  rowIndexOffset?: number;
  sourceBatchIndex?: number;
  id?: string;
};

export type ArrowPointGPUVectors = {
  table: PointModelTable;
  rowCount: number;
  rowIndexOffset: number;
  sourceDimension: number;
  pointGpuByteLength: number;
  stylingGpuByteLength: number;
  destroy: () => void;
};

export type ArrowPointRendererInput = ArrowPointGPUVectors & {
  pointArrowByteLength: number;
  stylingArrowByteLength: number;
  conversionTimeMs: number;
};

type PreparedPointBatch = ArrowPointRendererInput;

const DEFAULT_POINT_RENDERER_COLOR: [number, number, number, number] = [73, 166, 255, 220];
const DEFAULT_POINT_RENDERER_RADIUS = 0.0075;
const DEFAULT_POINT_RENDERER_CENTER: [number, number] = [0, 0];
const DEFAULT_POINT_RENDERER_SCALE = 1;
const DEFAULT_POINT_RENDERER_CURRENT_TIME = 0;
const DEFAULT_POINT_RENDERER_TRAIL_LENGTH = 12_000;
const DEFAULT_POSITIONS_COLUMN = 'positions';
const DEFAULT_COLORS_COLUMN = 'colors';
const DEFAULT_RADII_COLUMN = 'pointSizes';

/** Deck.gl ScatterplotLayer-style point renderer backed by Arrow vectors and GPU tables. */
export class ArrowPointRenderer {
  readonly device: Device;
  readonly shaderInputs: PointShaderInputs;
  readonly picker: PickingManager;
  props: ArrowPointRendererProps;
  preparedBatches: PreparedPointBatch[] = [];
  model: GPUTableModel | null = null;
  pickingModel: GPUTableModel | null = null;
  private activeTable: PointModelTable | null = null;
  private dataLoadVersion = 0;

  /** Creates a point renderer for the supplied luma.gl device. */
  constructor(device: Device, props: ArrowPointRendererProps = {}) {
    this.device = device;
    this.props = props;
    this.shaderInputs = createPointShaderInputs(device);
    this.picker = createArrowPickingManager(device, {
      shaderInputs: this.shaderInputs,
      onObjectPicked: this.handleObjectPicked,
      getTooltip: this.getPointPickingTooltip
    });
    if (hasPointSource(props)) {
      this.replaceData(props);
    }
  }

  /** Updates renderer props, rebuilding prepared GPU batches when source inputs change. */
  setProps(props: Partial<ArrowPointRendererProps>): void {
    const shouldRecreate =
      props.data !== undefined ||
      props.positions !== undefined ||
      props.timeColumn !== undefined ||
      props.timeOrigin !== undefined ||
      props.colors !== undefined ||
      props.radii !== undefined ||
      props.color !== undefined ||
      props.radius !== undefined;
    this.props = {...this.props, ...props};
    if (shouldRecreate) {
      this.replaceData(this.props, props.data !== undefined);
    }
  }

  /** Draws every prepared point batch into the supplied render pass. */
  draw(renderPass: RenderPass, props: {aspect: number}): void {
    this.setViewportUniforms(props.aspect);
    this.shaderInputs.setProps({picking: {isActive: false}});
    this.model?.drawBatches(renderPass, {
      onBatch: (_batch: GPURecordBatch, batchIndex: number) =>
        this.shaderInputs.setProps({picking: {batchIndex}})
    });
  }

  /** Runs a picking pass for the supplied mouse position and updates hover callbacks/tooltips. */
  pick(mousePosition: number[] | null | undefined, options: PickingShouldPickOptions = {}): void {
    if (!mousePosition) {
      clearArrowPickingState(this.picker, this.handleObjectPicked);
      return;
    }

    runArrowPickingPass({
      picker: this.picker,
      mousePosition,
      pickingOptions: options,
      shaderInputs: this.shaderInputs,
      draw: pickingPass =>
        this.pickingModel?.drawBatches(pickingPass, {
          onBatch: (_batch: GPURecordBatch, batchIndex: number) =>
            this.shaderInputs.setProps({picking: {batchIndex}})
        }) ?? false
    });
  }

  /** Releases all GPU resources owned by the renderer. */
  destroy(): void {
    this.dataLoadVersion++;
    this.picker.destroy();
    this.destroyPreparedBatches();
  }

  /** Returns aggregated metrics for all currently prepared point batches. */
  getMetrics(): ArrowPointRendererMetrics {
    return {
      rowCount: this.preparedBatches.reduce((total, batch) => total + batch.rowCount, 0),
      sourceDimension: this.preparedBatches[0]?.sourceDimension ?? 0,
      pointArrowByteLength: this.preparedBatches.reduce(
        (total, batch) => total + batch.pointArrowByteLength,
        0
      ),
      stylingArrowByteLength: this.preparedBatches.reduce(
        (total, batch) => total + batch.stylingArrowByteLength,
        0
      ),
      pointGpuByteLength: this.preparedBatches.reduce(
        (total, batch) => total + batch.pointGpuByteLength,
        0
      ),
      stylingGpuByteLength: this.preparedBatches.reduce(
        (total, batch) => total + batch.stylingGpuByteLength,
        0
      ),
      conversionTimeMs: this.preparedBatches.reduce(
        (total, batch) => total + batch.conversionTimeMs,
        0
      )
    };
  }

  private setViewportUniforms(aspect: number): void {
    this.shaderInputs.setProps({
      pointViewport: {
        center: this.props.center ?? DEFAULT_POINT_RENDERER_CENTER,
        scale: this.props.scale ?? DEFAULT_POINT_RENDERER_SCALE,
        aspect,
        currentTime: this.props.currentTime ?? DEFAULT_POINT_RENDERER_CURRENT_TIME,
        trailLength: this.props.trailLength ?? DEFAULT_POINT_RENDERER_TRAIL_LENGTH,
        timeEnabled: this.props.timeColumn ? 1 : 0
      }
    });
  }

  private replaceData(props: ArrowPointRendererProps, hasNewDataSource = true): void {
    this.dataLoadVersion++;
    const dataLoadVersion = this.dataLoadVersion;
    clearArrowPickingState(this.picker, this.handleObjectPicked);
    this.destroyPreparedBatches();

    if (!hasPointSource(props) || !shouldLoadPointSource(props, hasNewDataSource)) {
      return;
    }

    void this.loadData(props, dataLoadVersion);
  }

  private async loadData(props: ArrowPointRendererProps, dataLoadVersion: number): Promise<void> {
    if (props.data) {
      await loadArrowRecordBatches<PreparedPointBatch, ArrowPointRendererMetrics>({
        data: props.data,
        isActive: () => this.isDataLoadActive(dataLoadVersion),
        prepareBatch: (recordBatch, context) =>
          this.createPreparedRecordBatch(recordBatch, context, props),
        appendBatch: preparedBatch => this.appendPreparedBatch(preparedBatch),
        destroyBatch: destroyPreparedPointBatch,
        getRowCount: preparedBatch => preparedBatch.rowCount,
        getMetrics: () => this.getMetrics(),
        onBatch: props.onDataBatch,
        onError: props.onDataError
      });
      return;
    }

    const preparedBatch = await this.createPreparedBatch(props, 0, 0, 'arrow-points');
    if (!this.isDataLoadActive(dataLoadVersion)) {
      destroyPreparedPointBatch(preparedBatch);
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
    props: ArrowPointRendererProps
  ): Promise<PreparedPointBatch> {
    const data = new arrow.Table([recordBatch]);
    return await this.createPreparedBatch(
      {...props, data},
      context.rowIndexOffset,
      context.batchIndex,
      `arrow-points-${context.batchIndex}`
    );
  }

  private async createPreparedBatch(
    props: ArrowPointRendererProps,
    rowIndexOffset: number,
    sourceBatchIndex: number,
    id: string
  ): Promise<PreparedPointBatch> {
    const preparedInput = await prepareArrowPointInput(this.device, props, {
      rowIndexOffset,
      sourceBatchIndex,
      id
    });
    return preparedInput;
  }

  private appendPreparedBatch(preparedBatch: PreparedPointBatch): void {
    this.preparedBatches.push(preparedBatch);
    this.rebuildModels();
  }

  private destroyPreparedBatches(): void {
    this.destroyModels();
    for (const preparedBatch of this.preparedBatches) {
      destroyPreparedPointBatch(preparedBatch);
    }
    this.preparedBatches = [];
  }

  private rebuildModels(): void {
    this.destroyModels();
    if (this.preparedBatches.length === 0) {
      return;
    }
    this.activeTable = makeRetainedPointTable(this.preparedBatches);
    this.model = createPointModel(this.device, {
      id: 'arrow-points',
      table: this.activeTable,
      shaderInputs: this.shaderInputs
    });
    this.pickingModel = createPointModel(this.device, {
      id: 'arrow-points-picking',
      table: this.activeTable,
      shaderInputs: this.shaderInputs,
      picking: true
    });
  }

  private destroyModels(): void {
    this.model?.destroy();
    this.pickingModel?.destroy();
    this.model = null;
    this.pickingModel = null;
    this.activeTable = null;
  }

  private isDataLoadActive(dataLoadVersion: number): boolean {
    return dataLoadVersion === this.dataLoadVersion;
  }

  private readonly handleObjectPicked = ({batchIndex, objectIndex}: PickInfo): void => {
    const pickInfo = resolveArrowPickInfo({batchIndex, objectIndex}, this.activeTable);
    this.props.onPick?.({
      batchIndex: pickInfo.batchIndex,
      rowIndex: pickInfo.rowIndex,
      batchRowIndex: pickInfo.batchRowIndex
    });
  };

  private readonly getPointPickingTooltip = ({
    batchIndex,
    objectIndex
  }: PickInfo): string | null => {
    const pickInfo = resolveArrowPickInfo({batchIndex, objectIndex}, this.activeTable);
    if (pickInfo.batchIndex === null || pickInfo.rowIndex === null) {
      return null;
    }
    return formatPointPickingLabel(pickInfo.batchIndex, pickInfo.rowIndex, pickInfo.batchRowIndex);
  };
}

/** Wraps point conversion with example metrics and timing. */
export async function prepareArrowPointInput(
  device: Device,
  props: ArrowPointRendererProps,
  options: {rowIndexOffset?: number; sourceBatchIndex?: number; id?: string} = {}
): Promise<ArrowPointRendererInput> {
  const positions = getPositionVector(props);
  const colors = getColorVector(props);
  const radii = getRadiusVector(props);
  const separateTimeColumn = getSeparateTimeColumnVector(props);
  const pointArrowByteLength =
    getArrowVectorByteLength(positions) +
    (separateTimeColumn ? getArrowVectorByteLength(separateTimeColumn) : 0);
  const stylingArrowByteLength =
    (colors ? getArrowVectorByteLength(colors) : 0) + (radii ? getArrowVectorByteLength(radii) : 0);
  const startedAt = getTimestampMilliseconds();
  const converted = await convertArrowPointColumnsToGPUVectors(
    device,
    {positions, separateTimeColumn, colors, radii},
    {
      rowIndexOffset: options.rowIndexOffset,
      sourceBatchIndex: options.sourceBatchIndex,
      id: options.id,
      timeColumn: props.timeColumn,
      timeOrigin: props.timeOrigin,
      color: props.color,
      radius: props.radius
    }
  );

  return {
    ...converted,
    pointArrowByteLength,
    stylingArrowByteLength,
    conversionTimeMs: getTimestampMilliseconds() - startedAt
  };
}

/** Converts Arrow point columns into GPU vectors without creating render models or metrics. */
export async function convertArrowPointColumnsToGPUVectors(
  device: Device,
  columns: ArrowPointColumns,
  options: ConvertArrowPointColumnsToGPUVectorsOptions = {}
): Promise<ArrowPointGPUVectors> {
  const rowIndexOffset = options.rowIndexOffset ?? 0;
  const sourceBatchIndex = options.sourceBatchIndex ?? 0;
  const id = options.id ?? 'arrow-points';
  const {positions, separateTimeColumn = null, colors = null, radii = null} = columns;
  const normalizedPositions = normalizePointPositions(positions);
  const rowCount = normalizedPositions.positions.length;

  const pointPositions = makeGPUVectorFromArrow(device, normalizedPositions.positions, {
    name: 'positions',
    id: `${id}-positions`,
    format: 'float32x2'
  });
  const eventTimes = await makeEventTimesGPUVector(device, {
    timeColumn: options.timeColumn,
    separateTimeColumn,
    measureTimes: normalizedPositions.measureTimes,
    rowCount,
    timeOrigin: options.timeOrigin,
    id: `${id}-event-times`
  });
  const pointRadii = makeGPUVectorFromArrow(
    device,
    radii ?? makeConstantRadiusVector(rowCount, options.radius ?? DEFAULT_POINT_RENDERER_RADIUS),
    {name: 'radii', id: `${id}-radii`, format: 'float32'}
  );
  const pointColors = makeGPUVectorFromArrow(
    device,
    colors ?? makeConstantColorVector(rowCount, options.color ?? DEFAULT_POINT_RENDERER_COLOR),
    {name: 'colors', id: `${id}-colors`, format: 'unorm8x4'}
  );
  const rowIndices = makeArrowRowIndexGPUVector(device, {
    rowCount,
    rowIndexOffset,
    id: `${id}-row-indices`
  });
  const vectors: PointModelVectors = {
    positions: pointPositions,
    eventTimes,
    radii: pointRadii,
    colors: pointColors,
    rowIndices
  };
  const table = new GPUTable({
    vectors,
    sourceInfo: makeArrowRecordBatchSourceInfo({
      sourceBatchIndex,
      sourceRowIndexOffset: rowIndexOffset,
      sourceRowCount: rowCount
    })
  }) as PointModelTable;
  const pointGpuByteLength =
    getGPUVectorByteLength(pointPositions) +
    getGPUVectorByteLength(eventTimes) +
    getGPUVectorByteLength(rowIndices);
  const stylingGpuByteLength =
    getGPUVectorByteLength(pointRadii) + getGPUVectorByteLength(pointColors);

  return {
    table,
    rowCount,
    rowIndexOffset,
    sourceDimension: normalizedPositions.sourceDimension,
    pointGpuByteLength,
    stylingGpuByteLength,
    destroy: () => table.destroy()
  };
}

function destroyPreparedPointBatch(preparedBatch: PreparedPointBatch): void {
  preparedBatch.destroy();
}

function makeRetainedPointTable(preparedBatches: readonly PreparedPointBatch[]): PointModelTable {
  const firstBatch = preparedBatches[0];
  if (!firstBatch) {
    throw new Error('ArrowPointRenderer requires at least one prepared batch');
  }
  const batches = preparedBatches.flatMap(preparedBatch => preparedBatch.table.batches);
  return new GPUTable({
    batches,
    schema: firstBatch.table.schema,
    bufferLayout: firstBatch.table.bufferLayout
  }) as PointModelTable;
}

function normalizePointPositions(
  positions: arrow.Vector<ArrowPointCoordinateType>
): NormalizedPointPositions {
  if (arrow.DataType.isDenseUnion(positions.type)) {
    return normalizeDenseUnionPointPositions(positions as arrow.Vector<arrow.DenseUnion>);
  }
  return normalizeFixedSizeListPointPositions(
    positions as arrow.Vector<arrow.FixedSizeList<arrow.Float32>>
  );
}

function normalizeFixedSizeListPointPositions(
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>
): NormalizedPointPositions {
  const sourceDimension = getFixedSizeListPointDimension(positions);
  const sourceValues = getArrowFixedSizeListValues(positions);
  const rowCount = positions.length;
  const normalizedValues = new Float32Array(rowCount * 2);
  const measureTimes = new Float32Array(rowCount);
  const measureIndex = sourceDimension === 4 ? 3 : 2;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const sourceOffset = rowIndex * sourceDimension;
    normalizedValues[rowIndex * 2] = sourceValues[sourceOffset];
    normalizedValues[rowIndex * 2 + 1] = sourceValues[sourceOffset + 1];
    measureTimes[rowIndex] = sourceDimension >= 3 ? sourceValues[sourceOffset + measureIndex] : 0;
  }

  return {
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, normalizedValues),
    measureTimes: makeFloat32Vector(measureTimes),
    sourceDimension
  };
}

function normalizeDenseUnionPointPositions(
  positions: arrow.Vector<arrow.DenseUnion>
): NormalizedPointPositions {
  const normalizedValues = new Float32Array(positions.length * 2);
  const measureTimes = new Float32Array(positions.length);
  let targetRowIndex = 0;
  let sourceDimension = 0;

  for (const data of positions.data) {
    const typeIds = data.typeIds as ArrayLike<number>;
    const valueOffsets = data.valueOffsets as ArrayLike<number>;
    const type = data.type as arrow.DenseUnion & {
      typeIdToChildIndex: Record<number, number | undefined>;
    };

    for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
      const dataRowIndex = (data.offset ?? 0) + localRowIndex;
      const typeId = typeIds[dataRowIndex];
      const childIndex = type.typeIdToChildIndex[typeId];
      if (childIndex === undefined) {
        throw new Error(`ArrowPointRenderer DenseUnion has unsupported type id ${typeId}`);
      }
      const childData = data.children[childIndex] as arrow.Data<arrow.FixedSizeList<arrow.Float32>>;
      const childRowIndex = valueOffsets[dataRowIndex];
      const childDimension = getFixedSizeListPointDimensionFromData(childData);
      const childValues = getFixedSizeListDataValues(childData);
      const sourceOffset = ((childData.offset ?? 0) + childRowIndex) * childDimension;
      const measureIndex = childDimension === 4 ? 3 : 2;

      normalizedValues[targetRowIndex * 2] = childValues[sourceOffset];
      normalizedValues[targetRowIndex * 2 + 1] = childValues[sourceOffset + 1];
      measureTimes[targetRowIndex] =
        childDimension >= 3 ? childValues[sourceOffset + measureIndex] : 0;
      sourceDimension = Math.max(sourceDimension, childDimension);
      targetRowIndex++;
    }
  }

  return {
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, normalizedValues),
    measureTimes: makeFloat32Vector(measureTimes),
    sourceDimension
  };
}

async function makeEventTimesGPUVector(
  device: Device,
  props: {
    timeColumn: ArrowPointTimeColumn | undefined;
    separateTimeColumn: arrow.Vector | null;
    measureTimes: arrow.Vector<arrow.Float32>;
    rowCount: number;
    timeOrigin: ArrowPointRendererProps['timeOrigin'];
    id: string;
  }
): Promise<GPUVector<'float32'>> {
  if (!props.timeColumn) {
    return makeGPUVectorFromArrow(device, makeFloat32Vector(new Float32Array(props.rowCount)), {
      name: 'eventTimes',
      id: props.id,
      format: 'float32'
    });
  }
  if (props.timeColumn === 'm') {
    return makeGPUVectorFromArrow(device, props.measureTimes, {
      name: 'eventTimes',
      id: props.id,
      format: 'float32'
    });
  }
  if (!props.separateTimeColumn) {
    throw new Error('ArrowPointRenderer time column is missing');
  }
  if (props.separateTimeColumn.length !== props.rowCount) {
    throw new Error(
      `ArrowPointRenderer time column rows must match point rows (${props.separateTimeColumn.length} !== ${props.rowCount})`
    );
  }
  if (isScalarArrowTemporalVector(props.separateTimeColumn)) {
    const preparedTimeColumn = await convertArrowTemporalToGPUVector(
      device,
      props.separateTimeColumn,
      {
        name: 'eventTimes',
        id: props.id,
        origin: props.timeOrigin
      }
    );
    if (!(preparedTimeColumn.temporal.dataType instanceof arrow.Float32)) {
      preparedTimeColumn.destroy();
      throw new Error('ArrowPointRenderer temporal time column did not convert to Float32');
    }
    return preparedTimeColumn.temporal;
  }
  if (getArrowTemporalVectorInfo(props.separateTimeColumn)) {
    throw new Error('ArrowPointRenderer time column must be scalar temporal values');
  }
  return makeGPUVectorFromArrow(device, makeFloat32VectorFromNumeric(props.separateTimeColumn), {
    name: 'eventTimes',
    id: props.id,
    format: 'float32'
  });
}

function isScalarArrowTemporalVector(
  vector: arrow.Vector<arrow.DataType>
): vector is arrow.Vector<ArrowTemporalType> {
  const temporalInfo = getArrowTemporalVectorInfo(vector);
  return Boolean(temporalInfo && !temporalInfo.variableLength);
}

function getPositionVector(props: ArrowPointRendererProps): arrow.Vector<ArrowPointCoordinateType> {
  return getRequiredArrowColumn({
    data: getArrowTableData(props.data),
    selector: props.positions,
    defaultColumnName: DEFAULT_POSITIONS_COLUMN,
    ownerName: 'ArrowPointRenderer'
  });
}

function getSeparateTimeColumnVector(props: ArrowPointRendererProps): arrow.Vector | null {
  const {timeColumn} = props;
  if (!timeColumn || timeColumn === 'm') {
    return null;
  }
  if (typeof timeColumn === 'string') {
    return getRequiredArrowColumn({
      data: getArrowTableData(props.data),
      selector: timeColumn,
      defaultColumnName: timeColumn,
      ownerName: 'ArrowPointRenderer'
    });
  }
  return timeColumn;
}

function getColorVector(
  props: ArrowPointRendererProps
): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null {
  if (props.colors === null) {
    return null;
  }
  const colors = getOptionalArrowColumn({
    data: getArrowTableData(props.data),
    selector: props.colors,
    defaultColumnName: DEFAULT_COLORS_COLUMN
  });
  if (!colors) {
    return null;
  }
  if (!isArrowFixedSizeListVector(colors, new arrow.Uint8(), 4)) {
    throw new Error('ArrowPointRenderer colors must be FixedSizeList<Uint8, 4>');
  }
  return colors;
}

function getRadiusVector(props: ArrowPointRendererProps): arrow.Vector<arrow.Float32> | null {
  if (props.radii === null) {
    return null;
  }
  const radii = getOptionalArrowColumn({
    data: getArrowTableData(props.data),
    selector: props.radii,
    defaultColumnName: DEFAULT_RADII_COLUMN
  });
  if (!radii) {
    return null;
  }
  if (!(radii.type instanceof arrow.Float32)) {
    throw new Error('ArrowPointRenderer radii must be Float32');
  }
  return radii as arrow.Vector<arrow.Float32>;
}

function getFixedSizeListPointDimension(
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>
): 2 | 3 | 4 {
  if (!arrow.DataType.isFixedSizeList(positions.type)) {
    throw new Error('ArrowPointRenderer positions must be FixedSizeList or DenseUnion');
  }
  const sourceDimension = positions.type.listSize;
  if (
    (sourceDimension !== 2 && sourceDimension !== 3 && sourceDimension !== 4) ||
    !(positions.type.children[0].type instanceof arrow.Float32)
  ) {
    throw new Error('ArrowPointRenderer positions must be FixedSizeList<Float32, 2 | 3 | 4>');
  }
  return sourceDimension;
}

function getFixedSizeListPointDimensionFromData(
  data: arrow.Data<arrow.FixedSizeList<arrow.Float32>>
): 2 | 3 | 4 {
  if (!arrow.DataType.isFixedSizeList(data.type)) {
    throw new Error('ArrowPointRenderer DenseUnion point children must be FixedSizeList');
  }
  const sourceDimension = data.type.listSize;
  if (
    (sourceDimension !== 2 && sourceDimension !== 3 && sourceDimension !== 4) ||
    !(data.type.children[0].type instanceof arrow.Float32)
  ) {
    throw new Error(
      'ArrowPointRenderer DenseUnion point children must be FixedSizeList<Float32, 2 | 3 | 4>'
    );
  }
  return sourceDimension;
}

function getFixedSizeListDataValues(
  data: arrow.Data<arrow.FixedSizeList<arrow.Float32>>
): Float32Array {
  const childData = data.children[0] as arrow.Data<arrow.Float32> | undefined;
  const values = childData?.values;
  if (!(values instanceof Float32Array)) {
    throw new Error('ArrowPointRenderer FixedSizeList child values must be Float32Array');
  }
  return values;
}

function makeFloat32VectorFromNumeric(vector: arrow.Vector): arrow.Vector<arrow.Float32> {
  const sourceValues = getArrowVectorBufferSource(vector as arrow.Vector<any>) as ArrayLike<
    number | bigint
  >;
  const values = new Float32Array(vector.length);
  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    values[rowIndex] = Number(sourceValues[rowIndex] ?? 0);
  }
  return makeFloat32Vector(values);
}

function makeFloat32Vector(values: Float32Array): arrow.Vector<arrow.Float32> {
  const data = new arrow.Data(new arrow.Float32(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.Float32>;
  return new arrow.Vector([data]);
}

function makeConstantRadiusVector(rowCount: number, radius: number): arrow.Vector<arrow.Float32> {
  const values = new Float32Array(rowCount);
  values.fill(radius);
  return makeFloat32Vector(values);
}

function makeConstantColorVector(
  rowCount: number,
  color: [number, number, number, number]
): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> {
  const values = new Uint8Array(rowCount * 4);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    values.set(color, rowIndex * 4);
  }
  return makeArrowFixedSizeListVector(new arrow.Uint8(), 4, values);
}

function getGPUVectorByteLength(vector: GPUVector): number {
  return vector.length * vector.byteStride;
}

function hasPointSource(props: ArrowPointRendererProps): boolean {
  return hasArrowTableOrVectorSource({data: props.data, selector: props.positions});
}

function shouldLoadPointSource(props: ArrowPointRendererProps, hasNewDataSource: boolean): boolean {
  // Table-backed column/style changes do not replay the previous table implicitly. Pass `data`
  // again in the same prop update to rebuild from a table or iterable source.
  return (
    hasNewDataSource ||
    !props.data ||
    Boolean(props.positions && typeof props.positions !== 'string')
  );
}

function getArrowTableData(data: ArrowPointRendererProps['data']): arrow.Table | null | undefined {
  return data instanceof arrow.Table ? data : null;
}

function formatPointPickingLabel(
  batchIndex: number,
  rowIndex: number,
  batchRowIndex: number | null
): string {
  const batchLabel = (batchIndex + 1).toLocaleString();
  const batchRowLabel = batchRowIndex === null ? '-' : batchRowIndex.toLocaleString();
  return `rowIndex ${rowIndex.toLocaleString()} / batch ${batchLabel} / batch row ${batchRowLabel}`;
}

function getTimestampMilliseconds(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}
