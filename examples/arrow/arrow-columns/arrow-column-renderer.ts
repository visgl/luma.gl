// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getRequiredArrowGPUVectorDataType,
  makeGPUVectorFromArrow,
  convertArrowTemporalToGPUVectors,
  type PreparedArrowTemporalGPUVector
} from '@luma.gl/arrow';
import {
  type Buffer,
  type CommandEncoder,
  type Device,
  type RenderPass,
  type RenderPipelineParameters
} from '@luma.gl/core';
import {
  Model,
  ShaderInputs,
  aBuffer,
  aBufferPlugin,
  type ABufferShaderModuleProps,
  type DynamicBuffer
} from '@luma.gl/engine';
import {
  GPURenderable,
  GPURecordBatch,
  GPUTable,
  getGPUVectorBuffer,
  getRequiredGPUVector,
  type GPUTypeMap,
  type GPUVector
} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  H3_RESOLUTION,
  TIME_BUCKET_COUNT,
  TIME_BUCKET_DURATION_MILLISECONDS,
  loadArrowColumnSourceData,
  type ArrowColumnSourceData
} from './arrow-column-data';
import {makeColumnRendererGeometry, type ColumnRendererGeometry} from './column-renderer-geometry';
import {
  COLUMN_RENDERER_SHADER_LAYOUT,
  COLUMN_RENDERER_WGSL_SHADER,
  COLUMN_VERTEX_COUNT,
  RENDER_PARAMETERS,
  columnRenderer
} from './column-renderer-shaders';

/** Prepared render input and projection settings for the internal WebGPU column model. */
export type ColumnRendererProps = {
  /** GPU table containing aggregated H3/time/count columns. */
  table: GPUTable;
  /** GPU-decoded H3 cell boundary geometry shared by all columns. */
  geometry: ColumnRendererGeometry;
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
export type ColumnRendererDrawProps = {
  /** Current canvas aspect ratio. */
  aspect: number;
  /** Synthetic timestamp used to filter active time buckets. */
  currentTimestampMilliseconds: number;
};

/** Metrics displayed by the Arrow column example control panel. */
export type ArrowColumnRendererMetrics = {
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
export type ArrowColumnRendererProps = {
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
  geometry: ColumnRendererGeometry;
  destroy: () => void;
};

type PreparedColumnTemporalVectors = {
  timeStarts: PreparedArrowTemporalGPUVector<'float32'>;
  timeDurations: PreparedArrowTemporalGPUVector<'float32'>;
};

const DEFAULT_COLUMN_RENDERER_PROPS = {
  center: [-1.42, 52.23],
  heightScale: 0.22,
  scale: 16.8,
  tilt: 1.16,
  currentTimeRateMillisecondsPerSecond: CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  initialTimestampMilliseconds: 0
} as const satisfies Required<Omit<ArrowColumnRendererProps, 'sourceData'>>;

/** Internal low-level column renderer used by {@link ArrowColumnRenderer}. */
export class ColumnRenderer extends GPURenderable<[RenderPass, ColumnRendererDrawProps]> {
  readonly device: Device;
  readonly shaderInputs = new ShaderInputs<{columnRenderer: typeof columnRenderer.props}>({
    columnRenderer
  });
  readonly aBufferShaderInputs = new ShaderInputs<{
    columnRenderer: typeof columnRenderer.props;
    aBuffer: ABufferShaderModuleProps;
  }>({columnRenderer, aBuffer});
  props: ColumnRendererProps;
  model: Model;
  aBufferModel: Model;

  constructor(device: Device, props: ColumnRendererProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('ColumnRenderer requires WebGPU');
    }
    this.device = device;
    this.props = props;
    this.model = this.createModel(props, false);
    this.aBufferModel = this.createModel(props, true);
  }

  setProps(props: Partial<ColumnRendererProps>): void {
    this.props = {...this.props, ...props};
    if (props.table || props.geometry) {
      const bindings = getColumnRendererBindings(this.props.table, this.props.geometry);
      this.model.setBindings(bindings);
      this.aBufferModel.setBindings(bindings);
      if (props.table) {
        this.model.setInstanceCount(props.table.numRows);
        this.aBufferModel.setInstanceCount(props.table.numRows);
      }
    }
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.model.predraw(commandEncoder);
  }

  override draw(renderPass: RenderPass, props: ColumnRendererDrawProps): void {
    this.shaderInputs.setProps({columnRenderer: this.getShaderModuleProps(props)});
    this.model.draw(renderPass);
  }

  prepareABufferDraw(
    commandEncoder: CommandEncoder,
    props: ColumnRendererDrawProps,
    shaderModuleProps: ABufferShaderModuleProps,
    captureParameters: Readonly<RenderPipelineParameters>
  ): void {
    this.aBufferShaderInputs.setProps({
      columnRenderer: this.getShaderModuleProps(props),
      aBuffer: shaderModuleProps
    });
    this.aBufferModel.setParameters({...RENDER_PARAMETERS, ...captureParameters});
    this.aBufferModel.predraw(commandEncoder);
  }

  drawABuffer(renderPass: RenderPass): void {
    this.aBufferModel.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
    this.aBufferModel.destroy();
    this.shaderInputs.destroy();
    this.aBufferShaderInputs.destroy();
  }

  private createModel(props: ColumnRendererProps, aBufferEnabled: boolean): Model {
    return new Model(this.device, {
      id: `arrow-columns-columns-${aBufferEnabled ? 'a-buffer' : 'alpha'}`,
      source: COLUMN_RENDERER_WGSL_SHADER,
      shaderLayout: COLUMN_RENDERER_SHADER_LAYOUT,
      shaderInputs: aBufferEnabled ? this.aBufferShaderInputs : this.shaderInputs,
      defines: {A_BUFFER_ENABLED: aBufferEnabled},
      plugins: aBufferEnabled ? [aBufferPlugin] : [],
      bindings: getColumnRendererBindings(props.table, props.geometry),
      topology: 'triangle-list',
      vertexCount: COLUMN_VERTEX_COUNT,
      instanceCount: props.table.numRows,
      parameters: RENDER_PARAMETERS
    });
  }

  private getShaderModuleProps(props: ColumnRendererDrawProps): typeof columnRenderer.props {
    return {
      center: this.props.center,
      currentTimestamp: props.currentTimestampMilliseconds,
      cycleDuration: this.props.cycleDurationMilliseconds,
      maxCount: this.props.maxCount,
      heightScale: this.props.heightScale,
      scale: this.props.scale,
      tilt: this.props.tilt,
      aspect: props.aspect
    };
  }
}

/** Example layer that loads Arrow H3/time/count columns and renders animated WebGPU columns. */
export class ArrowColumnRenderer extends GPURenderable<
  [RenderPass, {time: number; aspect: number}]
> {
  readonly device: Device;
  props: ArrowColumnRendererProps;
  tableInput: ArrowColumnTableInput | null = null;
  columnRenderer: ColumnRenderer | null = null;
  currentTimestampMilliseconds = 0;
  lastRenderSeconds: number | null = null;

  constructor(device: Device, props: ArrowColumnRendererProps = {}) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('ArrowColumnRenderer requires WebGPU');
    }
    this.device = device;
    this.props = props;
    this.currentTimestampMilliseconds =
      props.initialTimestampMilliseconds ??
      DEFAULT_COLUMN_RENDERER_PROPS.initialTimestampMilliseconds;
  }

  async initialize(): Promise<void> {
    const sourceData = this.props.sourceData ?? (await loadArrowColumnSourceData());
    const tableInput = await makeArrowColumnTableInput(this.device, sourceData);
    this.tableInput = tableInput;
    this.columnRenderer = new ColumnRenderer(this.device, {
      table: tableInput.table,
      geometry: tableInput.geometry,
      maxCount: sourceData.maxCount,
      cycleDurationMilliseconds: sourceData.cycleDurationMilliseconds,
      center: this.props.center ?? DEFAULT_COLUMN_RENDERER_PROPS.center,
      heightScale: this.props.heightScale ?? DEFAULT_COLUMN_RENDERER_PROPS.heightScale,
      scale: this.props.scale ?? DEFAULT_COLUMN_RENDERER_PROPS.scale,
      tilt: this.props.tilt ?? DEFAULT_COLUMN_RENDERER_PROPS.tilt
    });
  }

  setProps(props: Partial<ArrowColumnRendererProps>): void {
    this.props = {...this.props, ...props};
    this.columnRenderer?.setProps({
      ...(props.center ? {center: props.center} : {}),
      ...(props.heightScale !== undefined ? {heightScale: props.heightScale} : {}),
      ...(props.scale !== undefined ? {scale: props.scale} : {}),
      ...(props.tilt !== undefined ? {tilt: props.tilt} : {})
    });
    if (props.initialTimestampMilliseconds !== undefined) {
      this.currentTimestampMilliseconds = props.initialTimestampMilliseconds;
    }
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.columnRenderer?.predraw(commandEncoder);
  }

  override draw(renderPass: RenderPass, props: {time: number; aspect: number}): void {
    if (!this.columnRenderer || !this.tableInput) {
      return;
    }

    this.updateCurrentTimestamp(props.time);

    this.columnRenderer.draw(renderPass, {
      aspect: props.aspect,
      currentTimestampMilliseconds: this.currentTimestampMilliseconds
    });
  }

  prepareABufferDraw(
    commandEncoder: CommandEncoder,
    props: {time: number; aspect: number},
    shaderModuleProps: ABufferShaderModuleProps,
    captureParameters: Readonly<RenderPipelineParameters>
  ): void {
    if (!this.columnRenderer || !this.tableInput) {
      return;
    }

    this.updateCurrentTimestamp(props.time);
    this.columnRenderer.prepareABufferDraw(
      commandEncoder,
      {
        aspect: props.aspect,
        currentTimestampMilliseconds: this.currentTimestampMilliseconds
      },
      shaderModuleProps,
      captureParameters
    );
  }

  drawABuffer(renderPass: RenderPass): void {
    this.columnRenderer?.drawABuffer(renderPass);
  }

  destroy(): void {
    this.columnRenderer?.destroy();
    this.tableInput?.destroy();
  }

  getMetrics(): ArrowColumnRendererMetrics {
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

  getSourceData(): ArrowColumnSourceData {
    return this.getTableInput().sourceData;
  }

  private getTableInput(): ArrowColumnTableInput {
    if (!this.tableInput) {
      throw new Error('ArrowColumnRenderer has not been initialized');
    }
    return this.tableInput;
  }

  private updateCurrentTimestamp(time: number): void {
    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    this.currentTimestampMilliseconds =
      (this.currentTimestampMilliseconds +
        elapsedSeconds *
          (this.props.currentTimeRateMillisecondsPerSecond ??
            DEFAULT_COLUMN_RENDERER_PROPS.currentTimeRateMillisecondsPerSecond)) %
      this.getTableInput().sourceData.cycleDurationMilliseconds;
  }
}

async function makeArrowColumnTableInput(
  device: Device,
  sourceData: ArrowColumnSourceData
): Promise<ArrowColumnTableInput> {
  const h3Cells = makeGPUVectorFromArrow(
    device,
    getRequiredArrowVector<arrow.Uint64>(sourceData.table, 'h3Cells'),
    {name: 'h3Cells', id: 'arrow-columns-h3-cells', format: 'uint32x2'}
  );
  const counts = makeGPUVectorFromArrow(
    device,
    getRequiredArrowVector<arrow.Float32>(sourceData.table, 'counts'),
    {name: 'counts', id: 'arrow-columns-counts', format: 'float32'}
  );
  const cellGeometryIndices = makeGPUVectorFromArrow(
    device,
    getRequiredArrowVector<arrow.Uint32>(sourceData.table, 'cellGeometryIndices'),
    {name: 'cellGeometryIndices', id: 'arrow-columns-cell-geometry-indices', format: 'uint32'}
  );
  let geometry: ColumnRendererGeometry | null = null;
  let temporalVectors: PreparedColumnTemporalVectors | null = null;

  try {
    geometry = await makeColumnRendererGeometry(device, sourceData.geometryTable);
    temporalVectors = await convertArrowTemporalToGPUVectors(
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
          timeStarts: {id: 'arrow-columns-time-starts'},
          timeDurations: {id: 'arrow-columns-time-durations'}
        }
      }
    );

    const vectors = {
      h3Cells,
      cellGeometryIndices,
      timeStarts: getPreparedFloat32Vector(temporalVectors.timeStarts),
      timeDurations: getPreparedFloat32Vector(temporalVectors.timeDurations),
      counts
    };
    const fields = Object.entries(vectors).map(
      ([name, vector]) => new arrow.Field(name, getRequiredArrowGPUVectorDataType(vector), false)
    );
    const batch = new GPURecordBatch<GPUTypeMap>({
      vectors,
      fields,
      bufferLayout: [],
      bindings: getColumnVectorBindings(vectors)
    });
    const table = new GPUTable<GPUTypeMap>({
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
  preparedTemporalVector: PreparedArrowTemporalGPUVector<'float32'>
): GPUVector<'float32'> {
  if (!(preparedTemporalVector.temporal.dataType instanceof arrow.Float32)) {
    throw new Error('ArrowColumnRenderer requires scalar prepared Float32 temporal columns');
  }
  return preparedTemporalVector.temporal;
}

function getColumnRendererBindings(
  table: GPUTable,
  geometry: ColumnRendererGeometry
): Record<string, Buffer | DynamicBuffer> {
  return {
    ...getColumnVectorBindings({
      cellGeometryIndices: getRequiredGPUVector(
        table,
        'cellGeometryIndices',
        'ArrowColumnRenderer table'
      ),
      timeStarts: getRequiredGPUVector(table, 'timeStarts', 'ArrowColumnRenderer table'),
      timeDurations: getRequiredGPUVector(table, 'timeDurations', 'ArrowColumnRenderer table'),
      counts: getRequiredGPUVector(table, 'counts', 'ArrowColumnRenderer table')
    }),
    cellGeometryPoints: getGPUVectorBuffer(geometry.points)
  };
}

function getColumnVectorBindings(
  vectors: Record<'cellGeometryIndices' | 'timeStarts' | 'timeDurations' | 'counts', GPUVector>
): Record<string, Buffer | DynamicBuffer> {
  return {
    cellGeometryIndices: getGPUVectorBuffer(vectors.cellGeometryIndices),
    timeStarts: getGPUVectorBuffer(vectors.timeStarts),
    timeDurations: getGPUVectorBuffer(vectors.timeDurations),
    counts: getGPUVectorBuffer(vectors.counts)
  };
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowColumnRenderer data is missing Arrow column "${columnName}"`);
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

export function getDefaultColumnRendererMetricDefaults(): ArrowColumnRendererMetrics {
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
