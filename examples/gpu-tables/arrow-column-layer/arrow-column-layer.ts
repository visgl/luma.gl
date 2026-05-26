// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  makeArrowGPUVector,
  prepareArrowTemporalGPUVectors,
  type PreparedArrowTemporalGPUVector
} from '@luma.gl/arrow';
import {type Device, type RenderPass} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {GPURecordBatch, GPUTable, type GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  H3_RESOLUTION,
  TIME_BUCKET_COUNT,
  TIME_BUCKET_DURATION_MILLISECONDS,
  loadArrowColumnSourceData,
  type ArrowColumnSourceData
} from './arrow-column-data';
import {makeColumnLayerGeometry, type ColumnLayerGeometry} from './column-layer-geometry';
import {
  COLUMN_LAYER_SHADER_LAYOUT,
  COLUMN_LAYER_WGSL_SHADER,
  COLUMN_VERTEX_COUNT,
  RENDER_PARAMETERS,
  columnLayer
} from './column-layer-shaders';

/** Prepared render input and projection settings for the internal WebGPU column model. */
export type ColumnLayerProps = {
  /** GPU table containing aggregated H3/time/count columns. */
  table: GPUTable;
  /** GPU-decoded H3 cell boundary geometry shared by all columns. */
  geometry: ColumnLayerGeometry;
  /** Maximum aggregate count used to normalize column height. */
  maxCount: number;
  /** Duration of one synthetic time cycle in milliseconds. */
  cycleDurationMilliseconds: number;
  /** Map center in longitude/latitude used by the column shader. */
  center: [number, number];
  /** Column height multiplier. */
  heightScale: number;
  /** World scale applied after projecting H3 cell geometry. */
  scale: number;
  /** Tilt factor applied by the column shader. */
  tilt: number;
};

/** Per-frame draw inputs for the internal WebGPU column model. */
export type ColumnLayerDrawProps = {
  /** Current canvas aspect ratio. */
  aspect: number;
  /** Synthetic timestamp used to filter active time buckets. */
  currentTimestampMilliseconds: number;
};

/** Metrics displayed by the Arrow column example control panel. */
export type ArrowColumnLayerMetrics = {
  /** Number of source CSV rows before aggregation. */
  sourceRowCount: number;
  /** Number of aggregated Arrow rows uploaded to the GPU. */
  aggregateRowCount: number;
  /** Number of unique H3 cells in the source data. */
  uniqueH3CellCount: number;
  /** H3 resolution used to aggregate source coordinates. */
  h3Resolution: number;
  /** Number of temporal buckets in one synthetic cycle. */
  timeBucketCount: number;
  /** Duration of one time bucket in milliseconds. */
  timeBucketDurationMilliseconds: number;
  /** Maximum aggregate count in any rendered column. */
  maxCount: number;
  /** Approximate GPU bytes used by uploaded table and geometry buffers. */
  gpuColumnBytes: number;
  /** CPU time spent building Arrow aggregate columns. */
  arrowBuildTimeMilliseconds: number;
  /** CPU/GPU time spent preparing H3 column geometry. */
  geometryDecodeTimeMilliseconds: number;
};

/** Public configuration for the Arrow-backed animated H3 column layer. */
export type ArrowColumnLayerProps = {
  /** Optional preloaded source data. Defaults to loading the bundled deck.gl CSV source. */
  sourceData?: ArrowColumnSourceData;
  /** Map center in longitude/latitude used by the column shader. */
  center?: [number, number];
  /** Column height multiplier. */
  heightScale?: number;
  /** World scale applied after projecting H3 cell geometry. */
  scale?: number;
  /** Tilt factor applied by the column shader. */
  tilt?: number;
  /** Synthetic clock rate used to advance through the time buckets. */
  currentTimeRateMillisecondsPerSecond?: number;
  /** Initial synthetic timestamp within the data cycle. */
  initialTimestampMilliseconds?: number;
};

type ArrowColumnTableInput = {
  sourceData: ArrowColumnSourceData;
  table: GPUTable;
  geometry: ColumnLayerGeometry;
  destroy: () => void;
};

type PreparedColumnTemporalVectors = {
  timeStarts: PreparedArrowTemporalGPUVector;
  timeDurations: PreparedArrowTemporalGPUVector;
};

const DEFAULT_COLUMN_LAYER_PROPS = {
  center: [-1.42, 52.23],
  heightScale: 0.22,
  scale: 16.8,
  tilt: 1.16,
  currentTimeRateMillisecondsPerSecond: CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  initialTimestampMilliseconds: 0
} as const satisfies Required<Omit<ArrowColumnLayerProps, 'sourceData'>>;

/** Internal low-level column renderer used by {@link ArrowColumnLayer}. */
export class ColumnLayer {
  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{columnLayer: typeof columnLayer.props}>({
    columnLayer
  });
  props: ColumnLayerProps;
  model: Model;

  constructor(device: Device, props: ColumnLayerProps) {
    if (device.type !== 'webgpu') {
      throw new Error('ColumnLayer requires WebGPU');
    }
    this.device = device;
    this.props = props;
    this.model = this.createModel(props);
  }

  setProps(props: Partial<ColumnLayerProps>): void {
    this.props = {...this.props, ...props};
    if (props.table || props.geometry) {
      this.model.setBindings(getColumnLayerBindings(this.props.table, this.props.geometry));
      if (props.table) {
        this.model.setInstanceCount(props.table.numRows);
      }
    }
  }

  draw(renderPass: RenderPass, props: ColumnLayerDrawProps): void {
    this.shaderInputs.setProps({
      columnLayer: {
        center: this.props.center,
        currentTimestamp: props.currentTimestampMilliseconds,
        cycleDuration: this.props.cycleDurationMilliseconds,
        maxCount: this.props.maxCount,
        heightScale: this.props.heightScale,
        scale: this.props.scale,
        tilt: this.props.tilt,
        aspect: props.aspect
      }
    });
    this.model.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
  }

  private createModel(props: ColumnLayerProps): Model {
    return new Model(this.device, {
      id: 'arrow-column-layer-columns',
      source: COLUMN_LAYER_WGSL_SHADER,
      shaderLayout: COLUMN_LAYER_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      bindings: getColumnLayerBindings(props.table, props.geometry),
      topology: 'triangle-list',
      vertexCount: COLUMN_VERTEX_COUNT,
      instanceCount: props.table.numRows,
      parameters: RENDER_PARAMETERS
    });
  }
}

/** Example layer that loads Arrow H3/time/count columns and renders animated WebGPU columns. */
export class ArrowColumnLayer {
  readonly device: Device;
  props: ArrowColumnLayerProps;
  tableInput: ArrowColumnTableInput | null = null;
  columnLayer: ColumnLayer | null = null;
  currentTimestampMilliseconds = 0;
  lastRenderSeconds: number | null = null;

  constructor(device: Device, props: ArrowColumnLayerProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('ArrowColumnLayer requires WebGPU');
    }
    this.device = device;
    this.props = props;
    this.currentTimestampMilliseconds =
      props.initialTimestampMilliseconds ?? DEFAULT_COLUMN_LAYER_PROPS.initialTimestampMilliseconds;
  }

  async initialize(): Promise<void> {
    const sourceData = this.props.sourceData ?? (await loadArrowColumnSourceData());
    const tableInput = await makeArrowColumnTableInput(this.device, sourceData);
    this.tableInput = tableInput;
    this.columnLayer = new ColumnLayer(this.device, {
      table: tableInput.table,
      geometry: tableInput.geometry,
      maxCount: sourceData.maxCount,
      cycleDurationMilliseconds: sourceData.cycleDurationMilliseconds,
      center: this.props.center ?? DEFAULT_COLUMN_LAYER_PROPS.center,
      heightScale: this.props.heightScale ?? DEFAULT_COLUMN_LAYER_PROPS.heightScale,
      scale: this.props.scale ?? DEFAULT_COLUMN_LAYER_PROPS.scale,
      tilt: this.props.tilt ?? DEFAULT_COLUMN_LAYER_PROPS.tilt
    });
  }

  setProps(props: Partial<ArrowColumnLayerProps>): void {
    this.props = {...this.props, ...props};
    this.columnLayer?.setProps({
      ...(props.center ? {center: props.center} : {}),
      ...(props.heightScale !== undefined ? {heightScale: props.heightScale} : {}),
      ...(props.scale !== undefined ? {scale: props.scale} : {}),
      ...(props.tilt !== undefined ? {tilt: props.tilt} : {})
    });
    if (props.initialTimestampMilliseconds !== undefined) {
      this.currentTimestampMilliseconds = props.initialTimestampMilliseconds;
    }
  }

  draw(renderPass: RenderPass, props: {time: number; aspect: number}): void {
    if (!this.columnLayer || !this.tableInput) {
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
            DEFAULT_COLUMN_LAYER_PROPS.currentTimeRateMillisecondsPerSecond)) %
      this.tableInput.sourceData.cycleDurationMilliseconds;

    this.columnLayer.draw(renderPass, {
      aspect: props.aspect,
      currentTimestampMilliseconds: this.currentTimestampMilliseconds
    });
  }

  destroy(): void {
    this.columnLayer?.destroy();
    this.tableInput?.destroy();
  }

  getMetrics(): ArrowColumnLayerMetrics {
    const tableInput = this.getTableInput();
    return {
      sourceRowCount: tableInput.sourceData.sourceRowCount,
      aggregateRowCount: tableInput.table.numRows,
      uniqueH3CellCount: tableInput.sourceData.uniqueH3CellCount,
      h3Resolution: tableInput.sourceData.h3Resolution,
      timeBucketCount: tableInput.sourceData.timeBucketCount,
      timeBucketDurationMilliseconds: tableInput.sourceData.timeBucketDurationMilliseconds,
      maxCount: tableInput.sourceData.maxCount,
      gpuColumnBytes:
        getGPUTableByteLength(tableInput.table) +
        getGPUVectorByteLength(tableInput.geometry.points),
      arrowBuildTimeMilliseconds: tableInput.sourceData.arrowBuildTimeMilliseconds,
      geometryDecodeTimeMilliseconds: tableInput.geometry.decodeTimeMilliseconds
    };
  }

  getActiveTimeBucket(): number {
    return (
      Math.floor(this.currentTimestampMilliseconds / TIME_BUCKET_DURATION_MILLISECONDS) %
      TIME_BUCKET_COUNT
    );
  }

  private getTableInput(): ArrowColumnTableInput {
    if (!this.tableInput) {
      throw new Error('ArrowColumnLayer has not been initialized');
    }
    return this.tableInput;
  }
}

async function makeArrowColumnTableInput(
  device: Device,
  sourceData: ArrowColumnSourceData
): Promise<ArrowColumnTableInput> {
  const h3Cells = makeArrowGPUVector(
    device,
    getRequiredArrowVector<arrow.Uint64>(sourceData.table, 'h3Cells'),
    {name: 'h3Cells', id: 'arrow-column-layer-h3-cells'}
  );
  const counts = makeArrowGPUVector(
    device,
    getRequiredArrowVector<arrow.Float32>(sourceData.table, 'counts'),
    {name: 'counts', id: 'arrow-column-layer-counts'}
  );
  const cellGeometryIndices = makeArrowGPUVector(
    device,
    getRequiredArrowVector<arrow.Uint32>(sourceData.table, 'cellGeometryIndices'),
    {name: 'cellGeometryIndices', id: 'arrow-column-layer-cell-geometry-indices'}
  );
  let geometry: ColumnLayerGeometry | null = null;
  let temporalVectors: PreparedColumnTemporalVectors | null = null;

  try {
    geometry = await makeColumnLayerGeometry(device, sourceData.geometryTable);
    temporalVectors = (await prepareArrowTemporalGPUVectors(
      device,
      {
        timeStarts: getRequiredArrowVector<arrow.TimestampMillisecond>(
          sourceData.table,
          'timeStarts'
        ),
        timeDurations: getRequiredArrowVector<arrow.DurationMillisecond>(
          sourceData.table,
          'timeDurations'
        )
      },
      {
        columns: {
          timeStarts: {id: 'arrow-column-layer-time-starts'},
          timeDurations: {id: 'arrow-column-layer-time-durations'}
        }
      }
    )) as unknown as PreparedColumnTemporalVectors;

    const vectors = {
      h3Cells,
      cellGeometryIndices,
      timeStarts: getPreparedFloat32Vector(temporalVectors.timeStarts),
      timeDurations: getPreparedFloat32Vector(temporalVectors.timeDurations),
      counts
    };
    const fields = Object.entries(vectors).map(
      ([name, vector]) => new arrow.Field(name, vector.type, false)
    );
    const batch = new GPURecordBatch({
      vectors,
      fields,
      bufferLayout: [],
      bindings: getColumnVectorBindings(vectors)
    });
    const table = new GPUTable({
      batches: [batch],
      schema: batch.schema,
      bufferLayout: []
    });

    return {
      sourceData,
      table,
      geometry,
      destroy: () => {
        table.destroy();
        geometry?.destroy();
      }
    };
  } catch (error) {
    h3Cells.destroy();
    counts.destroy();
    cellGeometryIndices.destroy();
    geometry?.destroy();
    temporalVectors?.timeStarts.destroy();
    temporalVectors?.timeDurations.destroy();
    throw error;
  }
}

function getPreparedFloat32Vector(
  preparedTemporalVector: PreparedArrowTemporalGPUVector
): GPUVector<arrow.Float32> {
  if (!(preparedTemporalVector.temporal.type instanceof arrow.Float32)) {
    throw new Error('ArrowColumnLayer requires scalar prepared Float32 temporal columns');
  }
  return preparedTemporalVector.temporal as GPUVector<arrow.Float32>;
}

function getColumnLayerBindings(
  table: GPUTable,
  geometry: ColumnLayerGeometry
): Record<string, GPUVector['buffer']> {
  return {
    ...getColumnVectorBindings({
      cellGeometryIndices: getRequiredTableVector(table, 'cellGeometryIndices'),
      timeStarts: getRequiredTableVector(table, 'timeStarts'),
      timeDurations: getRequiredTableVector(table, 'timeDurations'),
      counts: getRequiredTableVector(table, 'counts')
    }),
    cellGeometryPoints: geometry.points.buffer
  };
}

function getColumnVectorBindings(
  vectors: Record<'cellGeometryIndices' | 'timeStarts' | 'timeDurations' | 'counts', GPUVector>
): Record<string, GPUVector['buffer']> {
  return {
    cellGeometryIndices: vectors.cellGeometryIndices.buffer,
    timeStarts: vectors.timeStarts.buffer,
    timeDurations: vectors.timeDurations.buffer,
    counts: vectors.counts.buffer
  };
}

function getRequiredTableVector(table: GPUTable, columnName: string): GPUVector {
  const vector = table.gpuVectors[columnName];
  if (!vector) {
    throw new Error(`ArrowColumnLayer table is missing GPU column "${columnName}"`);
  }
  return vector;
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowColumnLayer data is missing Arrow column "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

function getGPUTableByteLength(table: GPUTable): number {
  return Object.values(table.gpuVectors).reduce(
    (byteLength, vector) => byteLength + getGPUVectorByteLength(vector),
    0
  );
}

function getGPUVectorByteLength(vector: GPUVector): number {
  return vector.data.reduce((byteLength, data) => byteLength + data.length * data.byteStride, 0);
}

export function formatActiveTimeBucket(bucketIndex: number): string {
  const hour = bucketIndex % TIME_BUCKET_COUNT;
  return `${hour.toString().padStart(2, '0')}:00 synthetic UTC`;
}

export function getDefaultColumnLayerMetricDefaults(): ArrowColumnLayerMetrics {
  return {
    sourceRowCount: 0,
    aggregateRowCount: 0,
    uniqueH3CellCount: 0,
    h3Resolution: H3_RESOLUTION,
    timeBucketCount: TIME_BUCKET_COUNT,
    timeBucketDurationMilliseconds: TIME_BUCKET_DURATION_MILLISECONDS,
    maxCount: 0,
    gpuColumnBytes: 0,
    arrowBuildTimeMilliseconds: 0,
    geometryDecodeTimeMilliseconds: 0
  };
}
