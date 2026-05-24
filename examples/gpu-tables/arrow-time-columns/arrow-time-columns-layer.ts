// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowModel,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector,
  prepareArrowTemporalGPUVectors,
  type PreparedArrowTemporalGPUVector
} from '@luma.gl/arrow';
import {type Device, type RenderPass} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {GPUTable, type GPUVector} from '@luma.gl/tables';
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

export type ArrowTimeColumnsLayerProps = {
  renderMode?: TimeColumnsRenderMode;
};

export type ArrowTimeColumnsLayerLabels = {
  preparationPath: string;
  currentTimestamp: string;
  dateOrigin: string;
  timeOrigin: string;
  timestampOrigin: string;
  durationOrigin: string;
};

type PreparedTemporalColumns = Record<
  TimeColumnsTemporalColumnName,
  PreparedArrowTemporalGPUVector
>;

type TimeColumnsTableInput = {
  table: GPUTable;
  temporalColumns: PreparedTemporalColumns;
  timestampOriginMilliseconds: number;
  destroy: () => void;
};

type ActiveTimeColumnsModel = ArrowModel | Model;

export class ArrowTimeColumnsLayer {
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

  constructor(device: Device, props: ArrowTimeColumnsLayerProps = {}) {
    this.device = device;
    this.activeRenderMode =
      props.renderMode ?? (this.device.type === 'webgpu' ? 'storage' : 'attributes');
  }

  async initialize(): Promise<void> {
    this.timeColumnsTableInput = await makeTimeColumnsTableInput(this.device);
    this.boardModel = this.createBoardModel();
    this.eventModel = this.createEventModel(this.timeColumnsTableInput, this.activeRenderMode);
    this.cursorModel = this.createCursorModel();
  }

  draw(renderPass: RenderPass, props: {time: number}): void {
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
        elapsedSeconds * CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND) %
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

    return new ArrowModel(this.device, {
      id: 'arrow-time-columns-events-attributes',
      arrowGPUTable: timeColumnsTableInput.table,
      arrowCount: 'instance',
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

  getLabels(): ArrowTimeColumnsLayerLabels {
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

  setProps(props: ArrowTimeColumnsLayerProps): void {
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

  setNeedsRedraw(_reason: string): void {}

  needsRedraw(): false {
    return false;
  }

  private getTimeColumnsTableInput(): TimeColumnsTableInput {
    if (!this.timeColumnsTableInput) {
      throw new Error('ArrowTimeColumnsLayer has not been initialized');
    }
    return this.timeColumnsTableInput;
  }
}

async function makeTimeColumnsTableInput(device: Device): Promise<TimeColumnsTableInput> {
  const temporalSourceVectors = makeTimeColumnsTemporalSourceVectors();
  const temporalColumns = (await prepareArrowTemporalGPUVectors(device, temporalSourceVectors, {
    columns: {
      eventDates: {id: 'arrow-time-columns-event-dates'},
      eventTimes: {id: 'arrow-time-columns-event-times'},
      eventStarts: {id: 'arrow-time-columns-event-starts'},
      eventDurations: {id: 'arrow-time-columns-event-durations'}
    }
  })) as unknown as PreparedTemporalColumns;

  try {
    const eventColors = makeArrowGPUVector(
      device,
      makeArrowFixedSizeListVector(new arrow.Uint8(), 4, makeTimeColumnsEventColorValues()),
      {name: 'eventColors', id: 'arrow-time-columns-event-colors'}
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
  preparedTemporalColumn: PreparedArrowTemporalGPUVector
): GPUVector<arrow.Float32> {
  if (!(preparedTemporalColumn.temporal.type instanceof arrow.Float32)) {
    throw new Error('Time columns example requires scalar prepared Float32 temporal rows');
  }
  return preparedTemporalColumn.temporal as GPUVector<arrow.Float32>;
}

function getTimeColumnsStorageBindings(
  timeColumnsTable: GPUTable
): Record<string, GPUVector['buffer']> {
  return {
    eventDates: getRequiredTableVector(timeColumnsTable, 'eventDates').buffer,
    eventTimes: getRequiredTableVector(timeColumnsTable, 'eventTimes').buffer,
    eventStarts: getRequiredTableVector(timeColumnsTable, 'eventStarts').buffer,
    eventDurations: getRequiredTableVector(timeColumnsTable, 'eventDurations').buffer,
    eventColors: getRequiredTableVector(timeColumnsTable, 'eventColors').buffer
  };
}

function getRequiredTableVector(timeColumnsTable: GPUTable, columnName: string): GPUVector {
  const gpuVector = timeColumnsTable.gpuVectors[columnName];
  if (!gpuVector) {
    throw new Error(`Time columns table is missing ${columnName}`);
  }
  return gpuVector;
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
