// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  makeArrowFixedSizeListVector,
  makeGPUVectorFromArrow,
  prepareArrowTemporalGPUVectors,
  type PreparedArrowTemporalGPUVector
} from '@luma.gl/arrow';
import {type Buffer, type CommandEncoder, type Device, type RenderPass} from '@luma.gl/core';
import {type DynamicBuffer, Model, ShaderInputs} from '@luma.gl/engine';
import {GPURenderable, GPUTable, GPUTableModel, type GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  DAY_COUNT,
  DAY_MILLISECONDS,
  EVENT_COUNT,
  HOUR_MILLISECONDS,
  MINUTE_MILLISECONDS,
  SCHEDULE_SPAN_MILLISECONDS,
  SCHEDULE_SWEEP_MILLISECONDS,
  makeTimeColumnsEventColorValues,
  makeTimeColumnsTemporalSourceVectors,
  type TimeColumnsTemporalColumnName
} from './arrow-time-columns-data';
import {
  BOARD_SHADER_LAYOUT,
  BOARD_VERTEX_GLSL_SHADER,
  BOARD_WGSL_SHADER,
  CURSOR_SHADER_LAYOUT,
  CURSOR_VERTEX_GLSL_SHADER,
  CURSOR_WGSL_SHADER,
  EVENT_ATTRIBUTE_SHADER_LAYOUT,
  EVENT_ATTRIBUTE_WGSL_SHADER,
  EVENT_FRAGMENT_GLSL_SHADER,
  EVENT_STORAGE_SHADER_LAYOUT,
  EVENT_STORAGE_WGSL_SHADER,
  EVENT_VERTEX_GLSL_SHADER,
  RENDER_PARAMETERS,
  timeColumns
} from './arrow-time-columns-shaders';
import type {TimeColumnsRenderMode} from './control-panel';

/** Public configuration for the Arrow time-columns schedule layer. */
export type ArrowTimeColumnsRendererProps = {
  /** Rendering path. `storage` requires WebGPU; WebGL falls back to attributes. */
  renderMode?: TimeColumnsRenderMode;
  /** Synthetic clock rate used to sweep through the schedule. */
  currentTimeRateMillisecondsPerSecond?: number;
  /** Initial synthetic schedule time in milliseconds. */
  initialScheduleMilliseconds?: number;
};

/** Labels displayed by the Arrow time-columns example control panel. */
export type ArrowTimeColumnsRendererLabels = {
  /** Active preparation path label. */
  preparationPath: string;
  /** Current synthetic timestamp label. */
  currentTimestamp: string;
  /** Date column origin label. */
  dateOrigin: string;
  /** Time column origin label. */
  timeOrigin: string;
  /** Timestamp column origin label. */
  timestampOrigin: string;
  /** Duration column origin label. */
  durationOrigin: string;
};

type PreparedTemporalColumns = Record<
  TimeColumnsTemporalColumnName,
  PreparedArrowTemporalGPUVector<'float32'>
>;

type TimeColumnsTableInput = {
  table: GPUTable;
  temporalColumns: PreparedTemporalColumns;
  timestampOriginMilliseconds: number;
  destroy: () => void;
};

type ActiveTimeColumnsModel = GPUTableModel | Model;

const DEFAULT_TIME_COLUMNS_RENDERER_PROPS = {
  currentTimeRateMillisecondsPerSecond: CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  initialScheduleMilliseconds: 0
} as const satisfies Required<
  Pick<
    ArrowTimeColumnsRendererProps,
    'currentTimeRateMillisecondsPerSecond' | 'initialScheduleMilliseconds'
  >
>;

/** Example layer that renders Arrow date/time/timestamp/duration columns as a schedule board. */
export class ArrowTimeColumnsRenderer extends GPURenderable<[RenderPass, {time: number}]> {
  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{timeColumns: typeof timeColumns.props}>({
    timeColumns
  });
  activeRenderMode: TimeColumnsRenderMode;
  timeColumnsTableInput: TimeColumnsTableInput | null = null;
  boardModel: Model | null = null;
  eventModel: ActiveTimeColumnsModel | null = null;
  cursorModel: Model | null = null;
  currentScheduleMilliseconds = 0;
  lastRenderSeconds: number | null = null;
  props: ArrowTimeColumnsRendererProps;

  constructor(device: Device, props: ArrowTimeColumnsRendererProps = {}) {
    super();
    this.device = device;
    this.props = props;
    this.activeRenderMode =
      props.renderMode ?? (this.device.type === 'webgpu' ? 'storage' : 'attributes');
    this.currentScheduleMilliseconds =
      props.initialScheduleMilliseconds ??
      DEFAULT_TIME_COLUMNS_RENDERER_PROPS.initialScheduleMilliseconds;
  }

  async initialize(): Promise<void> {
    this.timeColumnsTableInput = await makeTimeColumnsTableInput(this.device);
    this.boardModel = this.createBoardModel();
    this.eventModel = this.createEventModel(this.timeColumnsTableInput, this.activeRenderMode);
    this.cursorModel = this.createCursorModel();
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.boardModel?.predraw(commandEncoder);
    this.eventModel?.predraw(commandEncoder);
    this.cursorModel?.predraw(commandEncoder);
  }

  override draw(renderPass: RenderPass, props: {time: number}): void {
    if (!this.boardModel || !this.eventModel || !this.cursorModel || !this.timeColumnsTableInput) {
      return;
    }

    const seconds = props.time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    this.currentScheduleMilliseconds =
      (this.currentScheduleMilliseconds +
        elapsedSeconds *
          (this.props.currentTimeRateMillisecondsPerSecond ??
            DEFAULT_TIME_COLUMNS_RENDERER_PROPS.currentTimeRateMillisecondsPerSecond)) %
      SCHEDULE_SWEEP_MILLISECONDS;
    const currentTimestamp = getCurrentTimestampMilliseconds(this.currentScheduleMilliseconds);

    this.shaderInputs.setProps({
      timeColumns: {
        currentTimestamp
      }
    });

    this.boardModel.draw(renderPass);
    this.eventModel.draw(renderPass);
    this.cursorModel.draw(renderPass);
  }

  destroy(): void {
    this.cursorModel?.destroy();
    this.eventModel?.destroy();
    this.boardModel?.destroy();
    this.timeColumnsTableInput?.destroy();
  }

  createBoardModel(): Model {
    return new Model(this.device, {
      id: 'arrow-time-columns-board',
      source: BOARD_WGSL_SHADER,
      vs: BOARD_VERTEX_GLSL_SHADER,
      fs: EVENT_FRAGMENT_GLSL_SHADER,
      shaderLayout: BOARD_SHADER_LAYOUT,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: DAY_COUNT,
      parameters: RENDER_PARAMETERS
    });
  }

  createEventModel(
    timeColumnsTableInput: TimeColumnsTableInput,
    renderMode: TimeColumnsRenderMode
  ): ActiveTimeColumnsModel {
    if (renderMode === 'storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('Time column storage rendering requires WebGPU');
      }
      return new Model(this.device, {
        id: 'arrow-time-columns-events-storage',
        source: EVENT_STORAGE_WGSL_SHADER,
        shaderLayout: EVENT_STORAGE_SHADER_LAYOUT,
        shaderInputs: this.shaderInputs,
        bindings: getTimeColumnsStorageBindings(timeColumnsTableInput.table),
        topology: 'triangle-list',
        isInstanced: true,
        vertexCount: 6,
        instanceCount: EVENT_COUNT,
        parameters: RENDER_PARAMETERS
      });
    }

    return new GPUTableModel(this.device, {
      id: 'arrow-time-columns-events-attributes',
      table: timeColumnsTableInput.table,
      tableCount: 'instance',
      source: EVENT_ATTRIBUTE_WGSL_SHADER,
      vs: EVENT_VERTEX_GLSL_SHADER,
      fs: EVENT_FRAGMENT_GLSL_SHADER,
      shaderLayout: EVENT_ATTRIBUTE_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: RENDER_PARAMETERS
    });
  }

  createCursorModel(): Model {
    return new Model(this.device, {
      id: 'arrow-time-columns-cursor',
      source: CURSOR_WGSL_SHADER,
      vs: CURSOR_VERTEX_GLSL_SHADER,
      fs: EVENT_FRAGMENT_GLSL_SHADER,
      shaderLayout: CURSOR_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: RENDER_PARAMETERS
    });
  }

  getLabels(): ArrowTimeColumnsRendererLabels {
    const timeColumnsTableInput = this.getTimeColumnsTableInput();
    const {temporalColumns} = timeColumnsTableInput;
    return {
      preparationPath: this.device.type === 'webgpu' ? 'WebGPU compute' : 'CPU fallback',
      currentTimestamp: this.getCurrentTimestampLabel(),
      dateOrigin: formatDateDayOrigin(temporalColumns.eventDates.temporalInfo.origin),
      timeOrigin: formatTimeOriginMilliseconds(temporalColumns.eventTimes.temporalInfo.origin),
      timestampOrigin: formatTimestampOriginMilliseconds(
        temporalColumns.eventStarts.temporalInfo.origin
      ),
      durationOrigin: formatDurationOriginMilliseconds(
        temporalColumns.eventDurations.temporalInfo.origin
      )
    };
  }

  getCurrentTimestampLabel(): string {
    const timeColumnsTableInput = this.getTimeColumnsTableInput();
    const currentTimestamp = getCurrentTimestampMilliseconds(this.currentScheduleMilliseconds);
    return formatAbsoluteTimestampMilliseconds(
      timeColumnsTableInput.timestampOriginMilliseconds + currentTimestamp
    );
  }

  setProps(props: ArrowTimeColumnsRendererProps): void {
    this.props = {...this.props, ...props};
    if (props.initialScheduleMilliseconds !== undefined) {
      this.currentScheduleMilliseconds = props.initialScheduleMilliseconds;
    }
    if (!this.timeColumnsTableInput || props.renderMode === undefined) {
      return;
    }
    const nextRenderMode =
      props.renderMode === 'storage' && this.device.type !== 'webgpu'
        ? 'attributes'
        : props.renderMode;
    if (nextRenderMode === this.activeRenderMode) {
      return;
    }
    const nextEventModel = this.createEventModel(this.timeColumnsTableInput, nextRenderMode);
    this.eventModel?.destroy();
    this.eventModel = nextEventModel;
    this.activeRenderMode = nextRenderMode;
  }

  private getTimeColumnsTableInput(): TimeColumnsTableInput {
    if (!this.timeColumnsTableInput) {
      throw new Error('ArrowTimeColumnsRenderer has not been initialized');
    }
    return this.timeColumnsTableInput;
  }
}

async function makeTimeColumnsTableInput(device: Device): Promise<TimeColumnsTableInput> {
  const temporalSourceVectors = makeTimeColumnsTemporalSourceVectors();
  const temporalColumns = await prepareArrowTemporalGPUVectors(device, temporalSourceVectors, {
    columns: {
      eventDates: {id: 'arrow-time-columns-event-dates'},
      eventTimes: {id: 'arrow-time-columns-event-times'},
      eventStarts: {id: 'arrow-time-columns-event-starts'},
      eventDurations: {id: 'arrow-time-columns-event-durations'}
    }
  });

  try {
    const eventColors = makeGPUVectorFromArrow(
      device,
      makeArrowFixedSizeListVector(new arrow.Uint8(), 4, makeTimeColumnsEventColorValues()),
      {name: 'eventColors', id: 'arrow-time-columns-event-colors', format: 'unorm8x4'}
    );
    const table = new GPUTable({
      vectors: {
        eventDates: getPreparedScalarTemporalVector(temporalColumns.eventDates),
        eventTimes: getPreparedScalarTemporalVector(temporalColumns.eventTimes),
        eventStarts: getPreparedScalarTemporalVector(temporalColumns.eventStarts),
        eventDurations: getPreparedScalarTemporalVector(temporalColumns.eventDurations),
        eventColors
      }
    });
    const timestampOriginMilliseconds = Number(temporalColumns.eventStarts.temporalInfo.origin);

    return {
      table,
      temporalColumns,
      timestampOriginMilliseconds,
      destroy: () => table.destroy()
    };
  } catch (error) {
    for (const temporalColumn of Object.values(temporalColumns)) {
      temporalColumn.destroy();
    }
    throw error;
  }
}

function getPreparedScalarTemporalVector(
  preparedTemporalColumn: PreparedArrowTemporalGPUVector<'float32'>
): GPUVector<'float32'> {
  if (!(preparedTemporalColumn.temporal.type instanceof arrow.Float32)) {
    throw new Error('Time columns example requires scalar prepared Float32 temporal rows');
  }
  return preparedTemporalColumn.temporal;
}

function getTimeColumnsStorageBindings(
  timeColumnsTable: GPUTable
): Record<string, Buffer | DynamicBuffer> {
  return {
    eventDates: getGPUVectorBuffer(getRequiredTableVector(timeColumnsTable, 'eventDates')),
    eventTimes: getGPUVectorBuffer(getRequiredTableVector(timeColumnsTable, 'eventTimes')),
    eventStarts: getGPUVectorBuffer(getRequiredTableVector(timeColumnsTable, 'eventStarts')),
    eventDurations: getGPUVectorBuffer(getRequiredTableVector(timeColumnsTable, 'eventDurations')),
    eventColors: getGPUVectorBuffer(getRequiredTableVector(timeColumnsTable, 'eventColors'))
  };
}

function getRequiredTableVector(timeColumnsTable: GPUTable, columnName: string): GPUVector {
  const gpuVector = timeColumnsTable.gpuVectors[columnName];
  if (!gpuVector) {
    throw new Error(`Time columns table is missing ${columnName}`);
  }
  return gpuVector;
}

function getGPUVectorBuffer(vector: GPUVector): Buffer | DynamicBuffer {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`Time columns vector "${vector.name}" requires one GPUData chunk`);
  }
  return data.buffer;
}

function getCurrentTimestampMilliseconds(currentScheduleMilliseconds: number): number {
  const currentDay = Math.floor(currentScheduleMilliseconds / SCHEDULE_SPAN_MILLISECONDS);
  const currentTime = currentScheduleMilliseconds - currentDay * SCHEDULE_SPAN_MILLISECONDS;
  return currentDay * DAY_MILLISECONDS + currentTime;
}

function formatDateDayOrigin(origin: number | bigint): string {
  return `${formatUtcDateMilliseconds(Number(origin) * DAY_MILLISECONDS)} (day ${origin})`;
}

function formatTimeOriginMilliseconds(origin: number | bigint): string {
  return `${formatTimeOfDayMilliseconds(Number(origin))} (${origin} ms)`;
}

function formatTimestampOriginMilliseconds(origin: number | bigint): string {
  return `${formatAbsoluteTimestampMilliseconds(Number(origin))} (${origin} ms)`;
}

function formatDurationOriginMilliseconds(origin: number | bigint): string {
  return `${origin} ms`;
}

function formatUtcDateMilliseconds(timestampMilliseconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(timestampMilliseconds);
}

function formatAbsoluteTimestampMilliseconds(timestampMilliseconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  }).format(timestampMilliseconds);
}

function formatTimeOfDayMilliseconds(timeMilliseconds: number): string {
  const hour = Math.floor(timeMilliseconds / HOUR_MILLISECONDS);
  const minute = Math.floor((timeMilliseconds % HOUR_MILLISECONDS) / MINUTE_MILLISECONDS);
  return `${padTwoDigits(hour)}:${padTwoDigits(minute)} UTC`;
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}
