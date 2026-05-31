// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowFixedSizeListValues,
  getArrowTemporalVectorInfo,
  getArrowVectorBufferSource,
  getArrowVectorByteLength,
  isArrowFixedSizeListVector,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector,
  prepareArrowTemporalGPUVector,
  type ArrowTemporalColumnType
} from '@luma.gl/arrow';
import type {Device, RenderPass} from '@luma.gl/core';
import {PickingManager, type PickInfo} from '@luma.gl/engine';
import {GPUTable, type GPUTableModel, type GPUVector} from '@luma.gl/tables';
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
  /** Optional Arrow source table. */
  data?: arrow.Table | null;
  /** Point coordinate column or source table column name. Defaults to `positions`. */
  positions?: string | arrow.Vector<ArrowPointCoordinateType>;
  /** Time column name, vector, `m` for the coordinate measure, or null to disable time filtering. */
  timeColumn?: ArrowPointTimeColumn;
  /** Optional origin for Arrow temporal columns. */
  timeOrigin?: number | bigint | string;
  /** Row color column, source table column name, or null to force constant color. */
  colors?: string | arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null;
  /** Row radius column, source table column name, or null to force a constant radius. */
  radii?: string | arrow.Vector<arrow.Float32> | null;
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
  /** CPU time spent preparing the currently loaded point batches. */
  preparationTimeMs: number;
};

/** Token used to cancel stale Arrow point record-batch streams. */
export type ArrowPointRendererStreamingSession = {
  /** Monotonic stream version owned by the renderer. */
  version: number;
};

/** Notification emitted after a point record batch is prepared and appended. */
export type ArrowPointRendererRecordBatchStreamUpdate = {
  /** Number of loaded batches in the active stream. */
  loadedBatchCount: number;
  /** True when the first batch in the stream has been loaded. */
  isFirstBatch: boolean;
  /** Aggregated metrics after the loaded batch has been appended. */
  metrics: ArrowPointRendererMetrics;
};

/** Props for incrementally streaming Arrow point record batches. */
export type ArrowPointRendererRecordBatchStreamProps = {
  /** Async iterator that yields Arrow record batches with point columns. */
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  /** Optional stream session used to cancel stale async streams. */
  streamingSession?: ArrowPointRendererStreamingSession;
  /** Callback fired after each batch is prepared and appended. */
  onBatch?: (update: ArrowPointRendererRecordBatchStreamUpdate) => void;
};

type NormalizedPointPositions = {
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  measureTimes: arrow.Vector<arrow.Float32>;
  sourceDimension: number;
};

type PreparedPointBatch = {
  table: PointModelTable;
  model: GPUTableModel;
  pickingModel: GPUTableModel;
  rowCount: number;
  rowIndexOffset: number;
  sourceDimension: number;
  pointArrowByteLength: number;
  stylingArrowByteLength: number;
  pointGpuByteLength: number;
  stylingGpuByteLength: number;
  preparationTimeMs: number;
};

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
  private streamingSessionVersion = 0;
  private pickedBatchIndex: number | null = null;
  private pickedRowIndex: number | null = null;

  /** Creates a point renderer for the supplied luma.gl device. */
  constructor(device: Device, props: ArrowPointRendererProps = {}) {
    this.device = device;
    this.props = props;
    this.shaderInputs = createPointShaderInputs(device);
    this.picker = new PickingManager(device, {
      shaderInputs: this.shaderInputs,
      mode: 'auto',
      onObjectPicked: this.handleObjectPicked,
      getTooltip: this.getPointPickingTooltip
    });
    if (hasPointSource(props)) {
      void this.appendPreparedTable(props);
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
      this.cancelRecordBatchStream();
      this.clearPickingState();
      this.destroyPreparedBatches();
      if (hasPointSource(this.props)) {
        void this.appendPreparedTable(this.props);
      }
    }
  }

  /** Starts a new record-batch stream and clears any previously prepared batches. */
  beginRecordBatchStream(): ArrowPointRendererStreamingSession {
    this.streamingSessionVersion++;
    this.clearPickingState();
    this.destroyPreparedBatches();
    return {version: this.streamingSessionVersion};
  }

  /** Invalidates the active record-batch stream without destroying already prepared batches. */
  cancelRecordBatchStream(): void {
    this.streamingSessionVersion++;
  }

  /** Prepares and appends record batches from an async iterator. */
  async streamRecordBatches({
    recordBatchIterator,
    streamingSession = this.beginRecordBatchStream(),
    onBatch
  }: ArrowPointRendererRecordBatchStreamProps): Promise<void> {
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
        preparedBatch.table.destroy();
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

  /** Draws every prepared point batch into the supplied render pass. */
  draw(renderPass: RenderPass, props: {aspect: number}): void {
    this.setViewportUniforms(props.aspect);
    for (const [batchIndex, preparedBatch] of this.preparedBatches.entries()) {
      this.shaderInputs.setProps({picking: {isActive: false, batchIndex}});
      preparedBatch.model.draw(renderPass);
    }
  }

  /** Runs a picking pass for the supplied mouse position and updates hover callbacks/tooltips. */
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

  /** Releases all GPU resources owned by the renderer. */
  destroy(): void {
    this.cancelRecordBatchStream();
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
      preparationTimeMs: this.preparedBatches.reduce(
        (total, batch) => total + batch.preparationTimeMs,
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

  private async appendPreparedTable(props: ArrowPointRendererProps): Promise<void> {
    const streamingSessionVersion = this.streamingSessionVersion;
    const preparedBatch = await this.createPreparedBatch(props, 0, 'arrow-points');
    if (streamingSessionVersion !== this.streamingSessionVersion) {
      preparedBatch.model.destroy();
      preparedBatch.pickingModel.destroy();
      preparedBatch.table.destroy();
      return;
    }
    this.preparedBatches.push(preparedBatch);
  }

  private async createPreparedRecordBatch(
    recordBatch: arrow.RecordBatch,
    rowIndexOffset: number
  ): Promise<PreparedPointBatch> {
    const data = new arrow.Table([recordBatch]);
    const batchIndex = this.preparedBatches.length;
    return await this.createPreparedBatch(
      {...this.props, data},
      rowIndexOffset,
      `arrow-points-${batchIndex}`
    );
  }

  private async createPreparedBatch(
    props: ArrowPointRendererProps,
    rowIndexOffset: number,
    id: string
  ): Promise<PreparedPointBatch> {
    const batchIndex = this.preparedBatches.length;
    const positions = getPositionVector(props);
    const colors = getColorVector(props);
    const radii = getRadiusVector(props);
    const separateTimeColumn = getSeparateTimeColumnVector(props);
    const pointArrowByteLength =
      getArrowVectorByteLength(positions) +
      (separateTimeColumn ? getArrowVectorByteLength(separateTimeColumn) : 0);
    const stylingArrowByteLength =
      (colors ? getArrowVectorByteLength(colors) : 0) +
      (radii ? getArrowVectorByteLength(radii) : 0);
    const startedAt = getTimestampMilliseconds();
    const normalizedPositions = normalizePointPositions(positions);
    const rowCount = normalizedPositions.positions.length;

    const pointPositions = makeArrowGPUVector(this.device, normalizedPositions.positions, {
      name: 'positions',
      id: `${id}-positions`
    });
    const eventTimes = await makeEventTimesGPUVector(this.device, {
      timeColumn: props.timeColumn,
      separateTimeColumn,
      measureTimes: normalizedPositions.measureTimes,
      rowCount,
      timeOrigin: props.timeOrigin,
      id: `${id}-event-times`
    });
    const pointRadii = makeArrowGPUVector(
      this.device,
      radii ?? makeConstantRadiusVector(rowCount, props.radius ?? DEFAULT_POINT_RENDERER_RADIUS),
      {name: 'radii', id: `${id}-radii`}
    );
    const pointColors = makeArrowGPUVector(
      this.device,
      colors ?? makeConstantColorVector(rowCount, props.color ?? DEFAULT_POINT_RENDERER_COLOR),
      {name: 'colors', id: `${id}-colors`}
    );
    const rowIndices = makeArrowGPUVector(
      this.device,
      makeRowIndexVector(rowCount, rowIndexOffset),
      {name: 'rowIndices', id: `${id}-row-indices`}
    );
    const vectors: PointModelVectors = {
      positions: pointPositions,
      eventTimes,
      radii: pointRadii,
      colors: pointColors,
      rowIndices
    };
    const table = new GPUTable({vectors}) as PointModelTable;

    const pointGpuByteLength =
      getGPUVectorByteLength(pointPositions) +
      getGPUVectorByteLength(eventTimes) +
      getGPUVectorByteLength(rowIndices);
    const stylingGpuByteLength =
      getGPUVectorByteLength(pointRadii) + getGPUVectorByteLength(pointColors);

    return {
      table,
      model: createPointModel(this.device, {
        id: `arrow-points-${batchIndex}`,
        table,
        shaderInputs: this.shaderInputs
      }),
      pickingModel: createPointModel(this.device, {
        id: `arrow-points-${batchIndex}-picking`,
        table,
        shaderInputs: this.shaderInputs,
        picking: true
      }),
      rowCount,
      rowIndexOffset,
      sourceDimension: normalizedPositions.sourceDimension,
      pointArrowByteLength,
      stylingArrowByteLength,
      pointGpuByteLength,
      stylingGpuByteLength,
      preparationTimeMs: getTimestampMilliseconds() - startedAt
    };
  }

  private destroyPreparedBatches(): void {
    for (const preparedBatch of this.preparedBatches) {
      preparedBatch.model.destroy();
      preparedBatch.pickingModel.destroy();
      preparedBatch.table.destroy();
    }
    this.preparedBatches = [];
  }

  private isRecordBatchStreamActive(streamingSession: ArrowPointRendererStreamingSession): boolean {
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
    this.props.onPick?.({
      batchIndex,
      rowIndex: objectIndex,
      batchRowIndex: this.getBatchRowIndex(batchIndex, objectIndex)
    });
  };

  private getBatchRowIndex(batchIndex: number | null, rowIndex: number | null): number | null {
    if (batchIndex === null || rowIndex === null) {
      return null;
    }
    const preparedBatch = this.preparedBatches[batchIndex];
    if (!preparedBatch) {
      return null;
    }
    const batchRowIndex = rowIndex - preparedBatch.rowIndexOffset;
    return batchRowIndex >= 0 && batchRowIndex < preparedBatch.rowCount ? batchRowIndex : null;
  }

  private readonly getPointPickingTooltip = ({
    batchIndex,
    objectIndex
  }: PickInfo): string | null => {
    if (batchIndex === null || objectIndex === null) {
      return null;
    }
    const batchRowIndex = this.getBatchRowIndex(batchIndex, objectIndex);
    return formatPointPickingLabel(batchIndex, objectIndex, batchRowIndex);
  };
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
): Promise<GPUVector<arrow.Float32>> {
  if (!props.timeColumn) {
    return makeArrowGPUVector(device, makeFloat32Vector(new Float32Array(props.rowCount)), {
      name: 'eventTimes',
      id: props.id
    });
  }
  if (props.timeColumn === 'm') {
    return makeArrowGPUVector(device, props.measureTimes, {name: 'eventTimes', id: props.id});
  }
  if (!props.separateTimeColumn) {
    throw new Error('ArrowPointRenderer time column is missing');
  }
  if (props.separateTimeColumn.length !== props.rowCount) {
    throw new Error(
      `ArrowPointRenderer time column rows must match point rows (${props.separateTimeColumn.length} !== ${props.rowCount})`
    );
  }
  if (getArrowTemporalVectorInfo(props.separateTimeColumn)) {
    const preparedTimeColumn = await prepareArrowTemporalGPUVector(
      device,
      props.separateTimeColumn as arrow.Vector<ArrowTemporalColumnType>,
      {
        name: 'eventTimes',
        id: props.id,
        origin: props.timeOrigin
      }
    );
    if (!(preparedTimeColumn.temporal.type instanceof arrow.Float32)) {
      preparedTimeColumn.destroy();
      throw new Error('ArrowPointRenderer temporal time column did not prepare as Float32');
    }
    return preparedTimeColumn.temporal as GPUVector<arrow.Float32>;
  }
  return makeArrowGPUVector(device, makeFloat32VectorFromNumeric(props.separateTimeColumn), {
    name: 'eventTimes',
    id: props.id
  });
}

function getPositionVector(props: ArrowPointRendererProps): arrow.Vector<ArrowPointCoordinateType> {
  if (typeof props.positions === 'string' || !props.positions) {
    const columnName =
      typeof props.positions === 'string' ? props.positions : DEFAULT_POSITIONS_COLUMN;
    const vector = props.data?.getChild(columnName);
    if (!vector) {
      throw new Error(`ArrowPointRenderer data is missing Arrow column "${columnName}"`);
    }
    return vector as arrow.Vector<ArrowPointCoordinateType>;
  }
  return props.positions;
}

function getSeparateTimeColumnVector(props: ArrowPointRendererProps): arrow.Vector | null {
  const {timeColumn} = props;
  if (!timeColumn || timeColumn === 'm') {
    return null;
  }
  if (typeof timeColumn === 'string') {
    const vector = props.data?.getChild(timeColumn);
    if (!vector) {
      throw new Error(`ArrowPointRenderer data is missing Arrow time column "${timeColumn}"`);
    }
    return vector;
  }
  return timeColumn;
}

function getColorVector(
  props: ArrowPointRendererProps
): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null {
  if (props.colors === null) {
    return null;
  }
  const colors =
    typeof props.colors === 'string' || !props.colors
      ? props.data?.getChild(
          typeof props.colors === 'string' ? props.colors : DEFAULT_COLORS_COLUMN
        )
      : props.colors;
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
  const radii =
    typeof props.radii === 'string' || !props.radii
      ? props.data?.getChild(typeof props.radii === 'string' ? props.radii : DEFAULT_RADII_COLUMN)
      : props.radii;
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

function makeRowIndexVector(rowCount: number, rowIndexOffset: number): arrow.Vector<arrow.Uint32> {
  const values = new Uint32Array(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    values[rowIndex] = rowIndexOffset + rowIndex;
  }
  const data = new arrow.Data(new arrow.Uint32(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.Uint32>;
  return new arrow.Vector([data]);
}

function getGPUVectorByteLength(vector: GPUVector): number {
  return vector.length * vector.byteStride;
}

function hasPointSource(props: ArrowPointRendererProps): boolean {
  return Boolean(props.positions && typeof props.positions !== 'string') || Boolean(props.data);
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
