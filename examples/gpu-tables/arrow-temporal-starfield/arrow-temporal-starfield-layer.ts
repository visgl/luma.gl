// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowFixedSizeListValues,
  isArrowFixedSizeListVector,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector,
  prepareArrowTemporalGPUVectors,
  type PreparedArrowTemporalGPUVector
} from '@luma.gl/arrow';
import {type Device, type RenderPass} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {GPURecordBatch, GPUTable, GPUTableModel, type GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  makeFloat32Vector,
  makeTemporalStarfieldRecordBatches,
  SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS,
  STARFIELD_CYCLE_MILLISECONDS
} from './arrow-temporal-starfield-data';
import {
  RENDER_PARAMETERS,
  STAR_ATTRIBUTE_SHADER_LAYOUT,
  STAR_ATTRIBUTE_WGSL_SHADER,
  STAR_FRAGMENT_GLSL_SHADER,
  STAR_STORAGE_SHADER_LAYOUT,
  STAR_STORAGE_WGSL_SHADER,
  STAR_VERTEX_GLSL_SHADER,
  temporalStarfield
} from './arrow-temporal-starfield-shaders';

/** Public configuration for the Arrow temporal starfield layer. */
export type ArrowTemporalStarfieldLayerProps = {
  /** Rendering path. `storage` requires WebGPU; WebGL falls back to attributes. */
  renderMode?: 'attributes' | 'storage';
  /** Source time representation used for event starts. */
  timeColumn?: 'timestamp' | 'xyzm';
  /** Optional initial Arrow record batches. Defaults to generated sample star rows. */
  recordBatches?: arrow.RecordBatch[];
  /** Synthetic clock rate used to advance the star pulse timeline. */
  currentTimeRateMillisecondsPerSecond?: number;
  /** Initial synthetic timestamp within the starfield cycle. */
  initialTimestampMilliseconds?: number;
};

/** Token used to cancel stale temporal starfield streaming work. */
export type ArrowTemporalStarfieldLayerStreamingSession = {
  /** Monotonic stream version owned by the layer. */
  version: number;
};

/** Notification emitted after a temporal starfield record batch is uploaded. */
export type ArrowTemporalStarfieldLayerRecordBatchStreamUpdate = {
  /** Number of record batches loaded so far. */
  loadedBatchCount: number;
  /** Total rendered star count after the batch. */
  starCount: number;
  /** True when this update corresponds to the first batch in a stream. */
  isFirstBatch: boolean;
};

/** Props for incrementally streaming Arrow starfield record batches. */
export type ArrowTemporalStarfieldLayerRecordBatchStreamProps = {
  /** Async iterator that yields Arrow starfield record batches. */
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  /** Optional stream session used to cancel stale async streams. */
  streamingSession?: ArrowTemporalStarfieldLayerStreamingSession;
  /** Callback fired after each batch is prepared and applied. */
  onBatch?: (update: ArrowTemporalStarfieldLayerRecordBatchStreamUpdate) => void;
};

/** Labels displayed by the temporal starfield example control panel. */
export type ArrowTemporalStarfieldLayerLabels = {
  /** Active preparation path label. */
  preparationPath: string;
  /** Current synthetic timestamp label. */
  currentTimestamp: string;
  /** Active positions column label. */
  positionsColumn: string;
  /** Active event-start column label. */
  eventStartsColumn: string;
  /** Timestamp origin label. */
  timestampOrigin: string;
  /** Duration origin label. */
  durationOrigin: string;
  /** Pulse-period origin label. */
  pulsePeriodOrigin: string;
};

type PreparedEventStartsColumn = {
  vector: GPUVector<arrow.Float32>;
  originMilliseconds: number;
  destroy: () => void;
};

type PreparedTemporalColumns = {
  eventStarts: PreparedEventStartsColumn;
  eventDurations: PreparedArrowTemporalGPUVector;
  pulsePeriods: PreparedArrowTemporalGPUVector;
};

type TemporalStarfieldTableInput = {
  table: GPUTable;
  temporalColumns: PreparedTemporalColumns;
  timestampOriginMilliseconds: number;
  destroy: () => void;
};

type TemporalStarfieldGPURecordBatchInput = {
  gpuRecordBatch: GPURecordBatch;
  temporalColumns: PreparedTemporalColumns;
  timestampOriginMilliseconds: number;
};

type TemporalStarfieldRecordBatchVectors = {
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  eventStarts: arrow.Vector<arrow.TimestampMillisecond> | null;
  eventDurations: arrow.Vector<arrow.DurationMillisecond>;
  pulsePeriods: arrow.Vector<arrow.DurationMillisecond>;
  starSizes: arrow.Vector<arrow.Float32>;
  eventColors: arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>;
};

type ActiveTemporalStarfieldModel = GPUTableModel | Model;

const DEFAULT_TEMPORAL_STARFIELD_PROPS = {
  currentTimeRateMillisecondsPerSecond: CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  initialTimestampMilliseconds: 0
} as const satisfies Required<
  Pick<
    ArrowTemporalStarfieldLayerProps,
    'currentTimeRateMillisecondsPerSecond' | 'initialTimestampMilliseconds'
  >
>;

/** Example layer that renders timestamp/duration Arrow columns as blinking star instances. */
export class ArrowTemporalStarfieldLayer {
  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{temporalStarfield: typeof temporalStarfield.props}>({
    temporalStarfield
  });
  activeRenderMode: 'attributes' | 'storage';
  activeTimeColumn: 'timestamp' | 'xyzm';
  temporalStarfieldTableInput: TemporalStarfieldTableInput | null = null;
  starModel: ActiveTemporalStarfieldModel | null = null;
  currentTimestampMilliseconds = 0;
  lastRenderSeconds: number | null = null;
  props: ArrowTemporalStarfieldLayerProps;
  private streamingSessionVersion = 0;
  private isDestroyed = false;

  constructor(device: Device, props: ArrowTemporalStarfieldLayerProps = {}) {
    this.device = device;
    this.props = props;
    this.activeRenderMode =
      props.renderMode ?? (this.device.type === 'webgpu' ? 'storage' : 'attributes');
    this.activeTimeColumn = props.timeColumn ?? 'timestamp';
    this.currentTimestampMilliseconds =
      props.initialTimestampMilliseconds ??
      DEFAULT_TEMPORAL_STARFIELD_PROPS.initialTimestampMilliseconds;
  }

  async initialize(): Promise<void> {
    await this.replaceRecordBatches(
      this.props.recordBatches ??
        makeTemporalStarfieldRecordBatches(undefined, undefined, this.activeTimeColumn)
    );
  }

  beginRecordBatchStream(): ArrowTemporalStarfieldLayerStreamingSession {
    this.streamingSessionVersion++;
    this.destroyStarModel();
    this.destroyTableInput();
    return {version: this.streamingSessionVersion};
  }

  cancelRecordBatchStream(): void {
    this.streamingSessionVersion++;
  }

  async streamRecordBatches({
    recordBatchIterator,
    streamingSession = this.beginRecordBatchStream(),
    onBatch
  }: ArrowTemporalStarfieldLayerRecordBatchStreamProps): Promise<void> {
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

      const batchInput = await makeTemporalStarfieldGPURecordBatchInput(
        this.device,
        recordBatchResult.value,
        loadedBatchCount,
        this.activeTimeColumn
      );
      if (!this.isRecordBatchStreamActive(streamingSession)) {
        batchInput.gpuRecordBatch.destroy();
        return;
      }

      const isFirstBatch = this.addGPURecordBatchInput(batchInput);
      loadedBatchCount++;
      onBatch?.({
        loadedBatchCount,
        starCount: this.temporalStarfieldTableInput?.table.numRows ?? 0,
        isFirstBatch
      });
    }
  }

  draw(renderPass: RenderPass, props: {time: number}): void {
    if (!this.starModel || !this.temporalStarfieldTableInput) {
      return;
    }

    const seconds = props.time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    this.currentTimestampMilliseconds =
      (this.currentTimestampMilliseconds +
        elapsedSeconds *
          (this.props.currentTimeRateMillisecondsPerSecond ??
            DEFAULT_TEMPORAL_STARFIELD_PROPS.currentTimeRateMillisecondsPerSecond)) %
      STARFIELD_CYCLE_MILLISECONDS;

    this.shaderInputs.setProps({
      temporalStarfield: {
        currentTimestamp: this.currentTimestampMilliseconds
      }
    });

    this.drawStarBatches(renderPass);
  }

  destroy(): void {
    this.isDestroyed = true;
    this.cancelRecordBatchStream();
    this.destroyStarModel();
    this.destroyTableInput();
  }

  createStarModel(
    temporalStarfieldTableInput: TemporalStarfieldTableInput,
    renderMode: 'attributes' | 'storage'
  ): ActiveTemporalStarfieldModel {
    const firstBatch = temporalStarfieldTableInput.table.batches[0];
    if (!firstBatch) {
      throw new Error('Temporal starfield requires at least one GPU record batch');
    }

    if (renderMode === 'storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('Temporal starfield storage rendering requires WebGPU');
      }

      return new Model(this.device, {
        id: 'arrow-temporal-starfield-storage',
        source: STAR_STORAGE_WGSL_SHADER,
        shaderLayout: STAR_STORAGE_SHADER_LAYOUT,
        shaderInputs: this.shaderInputs,
        bindings: getTemporalStarfieldStorageBindings(firstBatch),
        topology: 'triangle-list',
        isInstanced: true,
        vertexCount: 6,
        instanceCount: firstBatch.numRows,
        parameters: RENDER_PARAMETERS
      });
    }

    return new GPUTableModel(this.device, {
      id: 'arrow-temporal-starfield-attributes',
      table: temporalStarfieldTableInput.table,
      tableCount: 'instance',
      source: STAR_ATTRIBUTE_WGSL_SHADER,
      vs: STAR_VERTEX_GLSL_SHADER,
      fs: STAR_FRAGMENT_GLSL_SHADER,
      shaderLayout: STAR_ATTRIBUTE_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: RENDER_PARAMETERS
    });
  }

  getLabels(): ArrowTemporalStarfieldLayerLabels {
    const temporalStarfieldTableInput = this.getTemporalStarfieldTableInput();
    const {temporalColumns} = temporalStarfieldTableInput;
    return {
      preparationPath: this.device.type === 'webgpu' ? 'WebGPU compute' : 'CPU fallback',
      currentTimestamp: this.getCurrentTimestampLabel(),
      positionsColumn:
        this.activeTimeColumn === 'xyzm'
          ? 'positions: FixedSizeList<Float32, 4> (XYZM)'
          : 'positions: FixedSizeList<Float32, 2>',
      eventStartsColumn:
        this.activeTimeColumn === 'xyzm'
          ? 'eventStarts: M coordinate from positions'
          : 'eventStarts: TimestampMillisecond',
      timestampOrigin: formatTimestampOriginMilliseconds(
        temporalColumns.eventStarts.originMilliseconds
      ),
      durationOrigin: formatDurationOriginMilliseconds(
        temporalColumns.eventDurations.temporalInfo.origin
      ),
      pulsePeriodOrigin: formatDurationOriginMilliseconds(
        temporalColumns.pulsePeriods.temporalInfo.origin
      )
    };
  }

  getCurrentTimestampLabel(): string {
    const temporalStarfieldTableInput = this.getTemporalStarfieldTableInput();
    return formatAbsoluteTimestampMilliseconds(
      temporalStarfieldTableInput.timestampOriginMilliseconds + this.currentTimestampMilliseconds
    );
  }

  setProps(props: ArrowTemporalStarfieldLayerProps): void {
    this.props = {...this.props, ...props};
    if (props.initialTimestampMilliseconds !== undefined) {
      this.currentTimestampMilliseconds = props.initialTimestampMilliseconds;
    }
    if (props.timeColumn !== undefined && props.timeColumn !== this.activeTimeColumn) {
      this.activeTimeColumn = props.timeColumn;
    }

    if (props.renderMode === undefined) {
      return;
    }
    const nextRenderMode =
      props.renderMode === 'storage' && this.device.type !== 'webgpu'
        ? 'attributes'
        : props.renderMode;
    if (nextRenderMode === this.activeRenderMode) {
      return;
    }

    this.activeRenderMode = nextRenderMode;
    if (!this.temporalStarfieldTableInput) {
      return;
    }

    const nextStarModel = this.createStarModel(this.temporalStarfieldTableInput, nextRenderMode);
    this.destroyStarModel();
    this.starModel = nextStarModel;
  }

  setNeedsRedraw(_reason: string): void {}

  needsRedraw(): false {
    return false;
  }

  private getTemporalStarfieldTableInput(): TemporalStarfieldTableInput {
    if (!this.temporalStarfieldTableInput) {
      throw new Error('ArrowTemporalStarfieldLayer has not been initialized');
    }
    return this.temporalStarfieldTableInput;
  }

  private async replaceRecordBatches(recordBatches: arrow.RecordBatch[]): Promise<void> {
    this.destroyStarModel();
    this.destroyTableInput();

    const batchInputs = await Promise.all(
      recordBatches.map((recordBatch, batchIndex) =>
        makeTemporalStarfieldGPURecordBatchInput(
          this.device,
          recordBatch,
          batchIndex,
          this.activeTimeColumn
        )
      )
    );
    if (this.isDestroyed) {
      for (const batchInput of batchInputs) {
        batchInput.gpuRecordBatch.destroy();
      }
      return;
    }
    const firstBatchInput = batchInputs[0];
    if (!firstBatchInput) {
      return;
    }

    this.temporalStarfieldTableInput = createTemporalStarfieldTableInput(batchInputs);
    this.starModel = this.createStarModel(this.temporalStarfieldTableInput, this.activeRenderMode);
  }

  private addGPURecordBatchInput(batchInput: TemporalStarfieldGPURecordBatchInput): boolean {
    if (!this.temporalStarfieldTableInput) {
      this.temporalStarfieldTableInput = createTemporalStarfieldTableInput([batchInput]);
      this.starModel = this.createStarModel(
        this.temporalStarfieldTableInput,
        this.activeRenderMode
      );
      return true;
    }

    this.temporalStarfieldTableInput.table.addBatch(batchInput.gpuRecordBatch);
    return false;
  }

  private drawStarBatches(renderPass: RenderPass): void {
    if (!this.starModel || !this.temporalStarfieldTableInput) {
      return;
    }

    const table = this.temporalStarfieldTableInput.table;
    if (this.starModel instanceof GPUTableModel) {
      this.starModel.drawBatches(renderPass);
      return;
    }

    for (const batch of table.batches) {
      if (batch.numRows === 0) {
        continue;
      }
      this.starModel.setBindings(getTemporalStarfieldStorageBindings(batch));
      this.starModel.setInstanceCount(batch.numRows);
      this.starModel.draw(renderPass);
    }
  }

  private destroyStarModel(): void {
    this.starModel?.destroy();
    this.starModel = null;
  }

  private destroyTableInput(): void {
    this.temporalStarfieldTableInput?.destroy();
    this.temporalStarfieldTableInput = null;
  }

  private isRecordBatchStreamActive(
    streamingSession: ArrowTemporalStarfieldLayerStreamingSession
  ): boolean {
    return !this.isDestroyed && streamingSession.version === this.streamingSessionVersion;
  }
}

function createTemporalStarfieldTableInput(
  batchInputs: TemporalStarfieldGPURecordBatchInput[]
): TemporalStarfieldTableInput {
  const firstBatchInput = batchInputs[0];
  if (!firstBatchInput) {
    throw new Error('Temporal starfield requires at least one GPU record batch');
  }

  const table = new GPUTable({
    batches: batchInputs.map(batchInput => batchInput.gpuRecordBatch),
    schema: firstBatchInput.gpuRecordBatch.schema,
    bufferLayout: firstBatchInput.gpuRecordBatch.bufferLayout
  });

  return {
    table,
    temporalColumns: firstBatchInput.temporalColumns,
    timestampOriginMilliseconds: firstBatchInput.timestampOriginMilliseconds,
    destroy: () => table.destroy()
  };
}

async function makeTemporalStarfieldGPURecordBatchInput(
  device: Device,
  recordBatch: arrow.RecordBatch,
  batchIndex: number,
  timeColumn: 'timestamp' | 'xyzm'
): Promise<TemporalStarfieldGPURecordBatchInput> {
  const sourceTable = new arrow.Table([recordBatch]);
  const sourceVectors = getTemporalStarfieldRecordBatchVectors(sourceTable, timeColumn);
  const preparedDurationColumns = (await prepareArrowTemporalGPUVectors(
    device,
    {
      eventDurations: sourceVectors.eventDurations,
      pulsePeriods: sourceVectors.pulsePeriods
    },
    {
      columns: {
        eventDurations: {id: `arrow-temporal-starfield-event-durations-${batchIndex}`},
        pulsePeriods: {id: `arrow-temporal-starfield-pulse-periods-${batchIndex}`}
      }
    }
  )) as unknown as Pick<PreparedTemporalColumns, 'eventDurations' | 'pulsePeriods'>;

  let positions: GPUVector | null = null;
  let preparedEventStarts: PreparedEventStartsColumn | null = null;
  let starSizes: GPUVector | null = null;
  let eventColors: GPUVector | null = null;
  try {
    let modelPositions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
    if (timeColumn === 'xyzm') {
      const modelInputs = makeTemporalStarfieldXYZMModelInputs(sourceVectors.positions);
      modelPositions = modelInputs.positions;
      preparedEventStarts = makeXYZMEventStartsGPUVector(
        device,
        modelInputs.eventStarts,
        batchIndex
      );
    } else {
      modelPositions = sourceVectors.positions;
      preparedEventStarts = await prepareTimestampEventStartsGPUVector(
        device,
        getRequiredTimestampVector(sourceVectors.eventStarts),
        batchIndex
      );
    }
    positions = makeArrowGPUVector(device, modelPositions, {
      name: 'positions',
      id: `arrow-temporal-starfield-positions-${batchIndex}`
    });
    starSizes = makeArrowGPUVector(device, sourceVectors.starSizes, {
      name: 'starSizes',
      id: `arrow-temporal-starfield-star-sizes-${batchIndex}`
    });
    eventColors = makeArrowGPUVector(device, sourceVectors.eventColors, {
      name: 'eventColors',
      id: `arrow-temporal-starfield-event-colors-${batchIndex}`
    });
    const temporalColumns: PreparedTemporalColumns = {
      eventStarts: preparedEventStarts,
      eventDurations: preparedDurationColumns.eventDurations,
      pulsePeriods: preparedDurationColumns.pulsePeriods
    };
    const gpuRecordBatch = new GPURecordBatch({
      vectors: {
        positions,
        eventStarts: temporalColumns.eventStarts.vector,
        eventDurations: getPreparedScalarTemporalVector(temporalColumns.eventDurations),
        pulsePeriods: getPreparedScalarTemporalVector(temporalColumns.pulsePeriods),
        starSizes,
        eventColors
      }
    });

    return {
      gpuRecordBatch,
      temporalColumns,
      timestampOriginMilliseconds: temporalColumns.eventStarts.originMilliseconds
    };
  } catch (error) {
    positions?.destroy();
    preparedEventStarts?.destroy();
    starSizes?.destroy();
    eventColors?.destroy();
    preparedDurationColumns.eventDurations.destroy();
    preparedDurationColumns.pulsePeriods.destroy();
    throw error;
  }
}

function getTemporalStarfieldRecordBatchVectors(
  table: arrow.Table,
  timeColumn: 'timestamp' | 'xyzm'
): TemporalStarfieldRecordBatchVectors {
  return {
    positions: getRequiredArrowVector(table, 'positions'),
    eventStarts:
      timeColumn === 'timestamp'
        ? getRequiredArrowVector(table, 'eventStarts')
        : (table.getChild('eventStarts') as arrow.Vector<arrow.TimestampMillisecond> | null),
    eventDurations: getRequiredArrowVector(table, 'eventDurations'),
    pulsePeriods: getRequiredArrowVector(table, 'pulsePeriods'),
    starSizes: getRequiredArrowVector(table, 'starSizes'),
    eventColors: getRequiredArrowVector(table, 'eventColors')
  };
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`Temporal starfield record batch is missing Arrow column "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

function getRequiredTimestampVector(
  vector: arrow.Vector<arrow.TimestampMillisecond> | null
): arrow.Vector<arrow.TimestampMillisecond> {
  if (!vector) {
    throw new Error('Temporal starfield timestamp mode requires eventStarts');
  }
  return vector;
}

async function prepareTimestampEventStartsGPUVector(
  device: Device,
  eventStarts: arrow.Vector<arrow.TimestampMillisecond>,
  batchIndex: number
): Promise<PreparedEventStartsColumn> {
  const preparedColumns = await prepareArrowTemporalGPUVectors(
    device,
    {eventStarts},
    {
      columns: {
        eventStarts: {
          id: `arrow-temporal-starfield-event-starts-${batchIndex}`,
          origin: SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS
        }
      }
    }
  );
  const preparedEventStarts = preparedColumns.eventStarts;
  if (!preparedEventStarts) {
    throw new Error('Temporal starfield failed to prepare eventStarts');
  }
  return {
    vector: getPreparedScalarTemporalVector(preparedEventStarts),
    originMilliseconds: Number(preparedEventStarts.temporalInfo.origin),
    destroy: () => preparedEventStarts.destroy()
  };
}

function makeTemporalStarfieldXYZMModelInputs(
  positionsXYZM: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>
): {
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  eventStarts: arrow.Vector<arrow.Float32>;
} {
  if (!isArrowFixedSizeListVector(positionsXYZM, new arrow.Float32(), 4)) {
    throw new Error('Temporal starfield XYZM mode requires positions: FixedSizeList<Float32, 4>');
  }

  const rowCount = positionsXYZM.length;
  const xyzmValues = getArrowFixedSizeListValues(positionsXYZM);
  const positions = new Float32Array(rowCount * 2);
  const eventStarts = new Float32Array(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const sourceOffset = rowIndex * 4;
    positions[rowIndex * 2] = xyzmValues[sourceOffset];
    positions[rowIndex * 2 + 1] = xyzmValues[sourceOffset + 1];
    eventStarts[rowIndex] = xyzmValues[sourceOffset + 3];
  }

  return {
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    eventStarts: makeFloat32Vector(eventStarts)
  };
}

function makeXYZMEventStartsGPUVector(
  device: Device,
  eventStarts: arrow.Vector<arrow.Float32>,
  batchIndex: number
): PreparedEventStartsColumn {
  const vector = makeArrowGPUVector(device, eventStarts, {
    name: 'eventStarts',
    id: `arrow-temporal-starfield-event-starts-${batchIndex}`
  });
  return {
    vector,
    originMilliseconds: SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS,
    destroy: () => vector.destroy()
  };
}

function getPreparedScalarTemporalVector(
  preparedTemporalColumn: PreparedArrowTemporalGPUVector
): GPUVector<arrow.Float32> {
  if (!(preparedTemporalColumn.temporal.type instanceof arrow.Float32)) {
    throw new Error('Temporal starfield requires scalar prepared Float32 temporal rows');
  }
  return preparedTemporalColumn.temporal as GPUVector<arrow.Float32>;
}

function getTemporalStarfieldStorageBindings(
  temporalStarfieldTable: GPUTable | GPURecordBatch
): Record<string, GPUVector['buffer']> {
  return {
    positions: getRequiredTableVector(temporalStarfieldTable, 'positions').buffer,
    eventStarts: getRequiredTableVector(temporalStarfieldTable, 'eventStarts').buffer,
    eventDurations: getRequiredTableVector(temporalStarfieldTable, 'eventDurations').buffer,
    pulsePeriods: getRequiredTableVector(temporalStarfieldTable, 'pulsePeriods').buffer,
    starSizes: getRequiredTableVector(temporalStarfieldTable, 'starSizes').buffer,
    eventColors: getRequiredTableVector(temporalStarfieldTable, 'eventColors').buffer
  };
}

function getRequiredTableVector(
  temporalStarfieldTable: GPUTable | GPURecordBatch,
  columnName: string
): GPUVector {
  const gpuVector = temporalStarfieldTable.gpuVectors[columnName];
  if (!gpuVector) {
    throw new Error(`Temporal starfield table is missing ${columnName}`);
  }
  return gpuVector;
}

function formatTimestampOriginMilliseconds(origin: number | bigint): string {
  return `${formatAbsoluteTimestampMilliseconds(Number(origin))} (${origin} ms)`;
}

function formatDurationOriginMilliseconds(origin: number | bigint): string {
  return `${origin} ms`;
}

function formatAbsoluteTimestampMilliseconds(timestampMilliseconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  }).format(timestampMilliseconds);
}
