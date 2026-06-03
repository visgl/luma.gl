// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowFixedSizeListValues,
  isArrowFixedSizeListVector,
  makeArrowFixedSizeListVector,
  makeGPUVectorFromArrow,
  makeGPURecordBatchFromArrowRecordBatch
} from '@luma.gl/arrow';
import {Buffer, type CommandEncoder, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicBuffer, Model} from '@luma.gl/engine';
import {
  GPURenderable,
  GPUTableComputation,
  GPURecordBatch,
  GPUTable,
  getGPUVectorBuffer,
  getRequiredGPUVector,
  type GPUVector,
  TableTransform
} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  COMPUTE_SHADER_LAYOUT,
  RENDER_SHADER_LAYOUT,
  WEBGL_RENDER_FRAGMENT_SHADER,
  WEBGL_RENDER_SHADER_LAYOUT,
  WEBGL_RENDER_VERTEX_SHADER,
  WEBGL_TRANSFORM_SHADER,
  WEBGL_TRANSFORM_SHADER_LAYOUT,
  WEBGPU_RENDER_SHADER,
  WORKGROUP_SIZE,
  makeComputeShader
} from './arrow-particle-shaders';
import {loadArrowRecordBatches, type ArrowRecordBatchSource} from '../arrow-renderer-utils';

const DEFAULT_RESET_INTERVAL_MILLISECONDS = 12_000;

/** Public configuration for the Arrow particle layer. */
export type ArrowParticleRendererProps = {
  /** Optional Arrow source table, record-batch iterable, or async record-batch iterator. */
  data?: ArrowRecordBatchSource | null;
  /** Source table column name for initial particle positions. */
  positions?: string;
  /** Source table column name for particle velocities. */
  velocities?: string;
  /** Interval for resetting simulated particles back to their source Arrow rows. */
  resetIntervalMilliseconds?: number;
  /** Called after one Arrow record batch has been prepared and appended. */
  onDataBatch?: (update: ArrowParticleRendererDataBatchUpdate) => void;
  /** Called when renderer-owned Arrow batch loading fails. */
  onDataError?: (error: unknown) => void;
};

/** Notification emitted after a particle record batch is uploaded. */
export type ArrowParticleRendererDataBatchUpdate = {
  /** Number of record batches loaded so far. */
  loadedBatchCount: number;
  /** Total particle count after the batch. */
  particleCount: number;
  /** True for the first batch in a load. */
  isFirstBatch: boolean;
};

type ArrowParticleVectorType = arrow.FixedSizeList<arrow.Float32>;

type ArrowParticleRendererResolvedProps = {
  data: ArrowRecordBatchSource | null;
  positions: string;
  velocities: string;
  resetIntervalMilliseconds: number;
  onDataBatch?: (update: ArrowParticleRendererDataBatchUpdate) => void;
  onDataError?: (error: unknown) => void;
};

type InitialParticleBatchValues = {
  positions: Float32Array;
  velocities: Float32Array;
};

type ParticleRenderBatchValues = {
  colors: GPUVector<'unorm8x4'>;
};

type PreparedParticleBatch = {
  gpuRecordBatch: GPURecordBatch;
  initialValues: InitialParticleBatchValues;
  renderValues: ParticleRenderBatchValues;
};

type ParticleTransformOutputBuffers = {
  nextParticlePositions: Buffer;
  nextParticleVelocities: Buffer;
};

const DEFAULT_POSITIONS_COLUMN = 'positions';
const DEFAULT_VELOCITIES_COLUMN = 'velocities';
const PARTICLE_BATCH_COLORS: [number, number, number, number][] = [
  [0.55, 0.95, 1, 1],
  [0.36, 0.82, 0.98, 1],
  [0.22, 0.66, 0.96, 1],
  [0.16, 0.5, 0.92, 1],
  [0.12, 0.34, 0.86, 1],
  [0.1, 0.22, 0.74, 1],
  [0.08, 0.14, 0.58, 1],
  [0.05, 0.08, 0.36, 1]
];
const PARTICLE_COLOR_HIGHLIGHT = [0.64, 0.96, 1] as const;
const PARTICLE_COLOR_SHADOW = [0.04, 0.08, 0.34] as const;

/** Example layer that updates Arrow particle GPUVectors through compute or transform feedback. */
export class ArrowParticleRenderer extends GPURenderable<[RenderPass]> {
  readonly device: Device;
  props: ArrowParticleRendererResolvedProps;
  particleTable: GPUTable | null = null;
  computation: GPUTableComputation | null = null;
  transform: TableTransform | null = null;
  model: Model | null = null;
  particleCount = 0;
  private readonly initialBatchValues = new Map<GPURecordBatch, InitialParticleBatchValues>();
  private readonly renderBatchValues = new Map<GPURecordBatch, ParticleRenderBatchValues>();
  private readonly transformOutputBuffers = new Map<
    GPURecordBatch,
    ParticleTransformOutputBuffers
  >();
  private lastResetTime: number | null = null;
  private dataLoadVersion = 0;
  private isDestroyed = false;

  constructor(device: Device, props: ArrowParticleRendererProps = {}) {
    super();
    if (device.type !== 'webgpu' && device.type !== 'webgl') {
      throw new Error('Particles: FixedSizeList<Float32, 2> requires WebGPU or WebGL2');
    }

    this.device = device;
    this.props = {
      data: props.data ?? null,
      positions: props.positions ?? DEFAULT_POSITIONS_COLUMN,
      velocities: props.velocities ?? DEFAULT_VELOCITIES_COLUMN,
      resetIntervalMilliseconds:
        props.resetIntervalMilliseconds ?? DEFAULT_RESET_INTERVAL_MILLISECONDS,
      onDataBatch: props.onDataBatch,
      onDataError: props.onDataError
    };
    if (this.props.data) {
      this.replaceData(this.props, true);
    }
  }

  setProps(props: ArrowParticleRendererProps): void {
    const shouldRecreate =
      props.data !== undefined || props.positions !== undefined || props.velocities !== undefined;
    const hasNewDataSource = props.data !== undefined;
    this.props = {
      data: props.data !== undefined ? props.data : this.props.data,
      positions: props.positions ?? this.props.positions,
      velocities: props.velocities ?? this.props.velocities,
      resetIntervalMilliseconds:
        props.resetIntervalMilliseconds ?? this.props.resetIntervalMilliseconds,
      onDataBatch: props.onDataBatch ?? this.props.onDataBatch,
      onDataError: props.onDataError ?? this.props.onDataError
    };

    if (shouldRecreate) {
      this.replaceData(this.props, hasNewDataSource);
    }
  }

  update(time: number): boolean {
    if (!this.particleTable) {
      return false;
    }

    if (this.lastResetTime === null) {
      this.lastResetTime = time;
    }

    let didReset = false;
    if (time - this.lastResetTime >= this.props.resetIntervalMilliseconds) {
      this.resetParticleBatches();
      this.lastResetTime = time;
      didReset = true;
    }

    if (this.computation) {
      const computePass = this.device.beginComputePass({});
      this.computation.dispatchBatches(computePass, batch =>
        Math.ceil(batch.numRows / WORKGROUP_SIZE)
      );
      computePass.end();
      return didReset;
    }

    if (this.transform) {
      this.transform.dispatchBatches({
        outputBuffers: batch => this.getTransformOutputBuffers(batch)
      });
      this.copyTransformOutputsToInputBatches();
    }
    return didReset;
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.model?.predraw(commandEncoder);
  }

  override draw(renderPass: RenderPass): void {
    if (!this.model || !this.particleTable) {
      return;
    }

    for (const batch of this.particleTable.batches) {
      if (batch.numRows === 0) {
        continue;
      }
      const positions = getRequiredGPUVector(
        batch,
        'particlePositions',
        'ArrowParticleRenderer GPU batch'
      );
      const renderValues = this.getParticleRenderBatchValues(batch);
      if (this.device.type === 'webgpu') {
        this.model.setBindings({particlePositions: getGPUVectorBuffer(positions)});
        this.model.setAttributes({particleColors: getGPUVectorBuffer(renderValues.colors)});
      } else {
        this.model.setAttributes({
          particlePositions: getGPUVectorBuffer(positions),
          particleColors: getGPUVectorBuffer(renderValues.colors)
        });
      }
      this.model.setInstanceCount(batch.numRows);
      this.model.draw(renderPass);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.dataLoadVersion++;
    this.destroyDeviceResources();
    this.destroyParticleTable();
  }

  private replaceData(props: ArrowParticleRendererResolvedProps, hasNewDataSource: boolean): void {
    this.dataLoadVersion++;
    const dataLoadVersion = this.dataLoadVersion;
    this.destroyDeviceResources();
    this.destroyParticleTable();
    this.particleCount = 0;
    this.lastResetTime = null;

    if (!props.data || !shouldLoadParticleSource(props, hasNewDataSource)) {
      return;
    }

    void loadArrowRecordBatches({
      data: props.data,
      isActive: () => this.isDataLoadActive(dataLoadVersion),
      prepareBatch: (recordBatch, context) =>
        Promise.resolve(this.makeParticleGPURecordBatch(recordBatch, context.batchIndex)),
      appendBatch: preparedBatch => this.addParticleGPURecordBatch(preparedBatch),
      destroyBatch: preparedBatch => destroyPreparedParticleBatch(preparedBatch),
      getRowCount: ({gpuRecordBatch}) => gpuRecordBatch.numRows,
      getMetrics: () => this.particleCount,
      onBatch: update =>
        props.onDataBatch?.({
          loadedBatchCount: update.loadedBatchCount,
          particleCount: update.metrics,
          isFirstBatch: update.isFirstBatch
        }),
      onError: props.onDataError
    });
  }

  private addParticleGPURecordBatch(preparedBatch: PreparedParticleBatch): void {
    const {gpuRecordBatch, initialValues, renderValues} = preparedBatch;
    if (this.particleTable) {
      this.particleTable.addBatch(gpuRecordBatch);
    } else {
      this.particleTable = new GPUTable({
        batches: [gpuRecordBatch],
        schema: gpuRecordBatch.schema,
        bufferLayout: gpuRecordBatch.bufferLayout
      });
    }
    this.initialBatchValues.set(gpuRecordBatch, initialValues);
    this.renderBatchValues.set(gpuRecordBatch, renderValues);
    this.particleCount = this.particleTable.numRows;
    this.recreateDeviceResources();
  }

  private makeParticleGPURecordBatch(
    recordBatch: arrow.RecordBatch,
    batchIndex: number
  ): PreparedParticleBatch {
    const sourceTable = new arrow.Table([recordBatch]);
    const sourceVectors = getArrowParticleSourceVectors(sourceTable, this.props);
    if (sourceVectors.velocities.length !== sourceVectors.positions.length) {
      throw new Error(
        `ArrowParticleRenderer positions and velocities rows must match (${sourceVectors.positions.length} !== ${sourceVectors.velocities.length})`
      );
    }

    let gpuRecordBatch: GPURecordBatch | null = null;
    let colors: GPUVector<'unorm8x4'> | null = null;
    try {
      gpuRecordBatch = makeGPURecordBatchFromArrowRecordBatch(this.device, recordBatch, {
        shaderLayout: WEBGL_TRANSFORM_SHADER_LAYOUT,
        arrowPaths: {
          particlePositions: this.props.positions,
          particleVelocities: this.props.velocities
        }
      });
      colors = makeGPUVectorFromArrow(
        this.device,
        makeParticleBatchColorVector(batchIndex, recordBatch.numRows),
        {
          name: 'particleColors',
          id: `arrow-particles-colors-${batchIndex}`,
          format: 'unorm8x4'
        }
      );

      return {
        gpuRecordBatch,
        initialValues: {
          positions: getInitialParticleValues(sourceVectors.positions),
          velocities: getInitialParticleValues(sourceVectors.velocities)
        },
        renderValues: {
          colors
        }
      };
    } catch (error) {
      gpuRecordBatch?.destroy();
      colors?.destroy();
      throw error;
    }
  }

  private recreateDeviceResources(): void {
    this.destroyDeviceResources();
    this.createDeviceResources();
  }

  private createDeviceResources(): void {
    if (!this.particleTable) {
      return;
    }

    const firstBatch = this.particleTable.batches[0];
    if (!firstBatch) {
      return;
    }
    const firstPositions = getRequiredGPUVector(
      firstBatch,
      'particlePositions',
      'ArrowParticleRenderer GPU batch'
    );
    const firstRenderValues = this.getParticleRenderBatchValues(firstBatch);

    if (this.device.type === 'webgpu') {
      this.computation = new GPUTableComputation(this.device, {
        id: 'arrow-particles-compute',
        source: makeComputeShader(),
        shaderLayout: COMPUTE_SHADER_LAYOUT,
        inputVectors: this.particleTable.gpuVectors
      });

      this.model = new Model(this.device, {
        id: 'arrow-particles-render',
        source: WEBGPU_RENDER_SHADER,
        shaderLayout: RENDER_SHADER_LAYOUT,
        bindings: {
          particlePositions: getGPUVectorBuffer(firstPositions)
        },
        attributes: {
          particleColors: getGPUVectorBuffer(firstRenderValues.colors)
        },
        bufferLayout: [{name: 'particleColors', format: 'unorm8x4', stepMode: 'instance'}],
        topology: 'triangle-list',
        vertexCount: 6,
        instanceCount: firstBatch.numRows
      });
      return;
    }

    this.transform = new TableTransform(this.device, {
      id: 'arrow-particles-transform',
      vs: WEBGL_TRANSFORM_SHADER,
      shaderLayout: WEBGL_TRANSFORM_SHADER_LAYOUT,
      table: this.particleTable,
      outputs: ['nextParticlePositions', 'nextParticleVelocities']
    });

    this.model = new Model(this.device, {
      id: 'arrow-particles-render',
      vs: WEBGL_RENDER_VERTEX_SHADER,
      fs: WEBGL_RENDER_FRAGMENT_SHADER,
      shaderLayout: WEBGL_RENDER_SHADER_LAYOUT,
      attributes: {
        particlePositions: getGPUVectorBuffer(firstPositions),
        particleColors: getGPUVectorBuffer(firstRenderValues.colors)
      },
      bufferLayout: [
        {name: 'particlePositions', format: 'float32x2', stepMode: 'instance'},
        {name: 'particleColors', format: 'unorm8x4', stepMode: 'instance'}
      ],
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: firstBatch.numRows
    });
  }

  private resetParticleBatches(): void {
    for (const batch of this.particleTable?.batches ?? []) {
      const initialValues = this.initialBatchValues.get(batch);
      if (!initialValues) {
        continue;
      }
      getGPUVectorBuffer(
        getRequiredGPUVector(batch, 'particlePositions', 'ArrowParticleRenderer GPU batch')
      ).write(initialValues.positions);
      getGPUVectorBuffer(
        getRequiredGPUVector(batch, 'particleVelocities', 'ArrowParticleRenderer GPU batch')
      ).write(initialValues.velocities);
    }
  }

  private getTransformOutputBuffers(batch: GPURecordBatch): ParticleTransformOutputBuffers {
    let outputBuffers = this.transformOutputBuffers.get(batch);
    if (outputBuffers) {
      return outputBuffers;
    }

    const positions = getRequiredGPUVector(
      batch,
      'particlePositions',
      'ArrowParticleRenderer GPU batch'
    );
    const velocities = getRequiredGPUVector(
      batch,
      'particleVelocities',
      'ArrowParticleRenderer GPU batch'
    );
    outputBuffers = {
      nextParticlePositions: this.createTransformOutputBuffer(batch, positions, 'positions'),
      nextParticleVelocities: this.createTransformOutputBuffer(batch, velocities, 'velocities')
    };
    this.transformOutputBuffers.set(batch, outputBuffers);
    return outputBuffers;
  }

  private createTransformOutputBuffer(
    batch: GPURecordBatch,
    vector: GPUVector,
    label: string
  ): Buffer {
    return this.device.createBuffer({
      id: `arrow-particles-${label}-output-${this.particleTable?.batches.indexOf(batch) ?? 0}`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
      byteLength: Math.max(1, vector.length * vector.byteStride)
    });
  }

  private copyTransformOutputsToInputBatches(): void {
    const commandEncoder = this.device.createCommandEncoder();
    let copyCount = 0;

    for (const batch of this.particleTable?.batches ?? []) {
      const outputBuffers = this.transformOutputBuffers.get(batch);
      if (!outputBuffers) {
        continue;
      }
      copyCount += copyOutputToBatchVector({
        commandEncoder,
        sourceBuffer: outputBuffers.nextParticlePositions,
        targetVector: getRequiredGPUVector(
          batch,
          'particlePositions',
          'ArrowParticleRenderer GPU batch'
        )
      });
      copyCount += copyOutputToBatchVector({
        commandEncoder,
        sourceBuffer: outputBuffers.nextParticleVelocities,
        targetVector: getRequiredGPUVector(
          batch,
          'particleVelocities',
          'ArrowParticleRenderer GPU batch'
        )
      });
    }

    if (copyCount > 0) {
      this.device.submit(commandEncoder.finish());
      return;
    }
    commandEncoder.destroy();
  }

  private destroyDeviceResources(): void {
    this.model?.destroy();
    this.computation?.destroy();
    this.transform?.destroy();
    for (const outputBuffers of this.transformOutputBuffers.values()) {
      outputBuffers.nextParticlePositions.destroy();
      outputBuffers.nextParticleVelocities.destroy();
    }
    this.model = null;
    this.computation = null;
    this.transform = null;
    this.transformOutputBuffers.clear();
  }

  private destroyParticleTable(): void {
    this.particleTable?.destroy();
    for (const renderValues of this.renderBatchValues.values()) {
      renderValues.colors.destroy();
    }
    this.particleTable = null;
    this.initialBatchValues.clear();
    this.renderBatchValues.clear();
  }

  private isDataLoadActive(dataLoadVersion: number): boolean {
    return !this.isDestroyed && dataLoadVersion === this.dataLoadVersion;
  }

  private getParticleRenderBatchValues(batch: GPURecordBatch): ParticleRenderBatchValues {
    const renderValues = this.renderBatchValues.get(batch);
    if (!renderValues) {
      throw new Error('ArrowParticleRenderer GPU batch is missing render colors');
    }
    return renderValues;
  }
}

function shouldLoadParticleSource(
  props: ArrowParticleRendererResolvedProps,
  hasNewDataSource: boolean
): boolean {
  return hasNewDataSource || !props.data;
}

function getArrowParticleSourceVectors(
  data: arrow.Table,
  props: Pick<ArrowParticleRendererResolvedProps, 'positions' | 'velocities'>
): {
  positions: arrow.Vector<ArrowParticleVectorType>;
  velocities: arrow.Vector<ArrowParticleVectorType>;
} {
  return {
    positions: getRequiredParticleVector(data, props.positions),
    velocities: getRequiredParticleVector(data, props.velocities)
  };
}

function getRequiredParticleVector(
  table: arrow.Table,
  columnName: string
): arrow.Vector<ArrowParticleVectorType> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowParticleRenderer data is missing Arrow column "${columnName}"`);
  }
  if (!isArrowFixedSizeListVector(vector, new arrow.Float32(), 2)) {
    throw new Error(
      `ArrowParticleRenderer column "${columnName}" must be FixedSizeList<Float32, 2>`
    );
  }
  return vector;
}

function getInitialParticleValues(vector: arrow.Vector<ArrowParticleVectorType>): Float32Array {
  return new Float32Array(getArrowFixedSizeListValues(vector));
}

function makeParticleBatchColorVector(
  batchIndex: number,
  particleCount: number
): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> {
  const values = new Uint8Array(particleCount * 4);
  const batchColor = PARTICLE_BATCH_COLORS[batchIndex % PARTICLE_BATCH_COLORS.length];

  for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
    const colorPhase = (particleIndex % 11) / 10;
    const colorOffset = particleIndex * 4;
    values[colorOffset] = toUint8Color(getParticleColorComponent(batchColor[0], 0, colorPhase));
    values[colorOffset + 1] = toUint8Color(getParticleColorComponent(batchColor[1], 1, colorPhase));
    values[colorOffset + 2] = toUint8Color(getParticleColorComponent(batchColor[2], 2, colorPhase));
    values[colorOffset + 3] = 255;
  }

  return makeArrowFixedSizeListVector(new arrow.Uint8(), 4, values);
}

function getParticleColorComponent(
  batchColor: number,
  componentIndex: 0 | 1 | 2,
  colorPhase: number
): number {
  const shadowedColor = mixColorComponent(
    batchColor,
    PARTICLE_COLOR_SHADOW[componentIndex],
    (1 - colorPhase) * 0.12
  );
  return mixColorComponent(
    shadowedColor,
    PARTICLE_COLOR_HIGHLIGHT[componentIndex],
    colorPhase * 0.18
  );
}

function mixColorComponent(startColor: number, endColor: number, amount: number): number {
  return startColor * (1 - amount) + endColor * amount;
}

function toUint8Color(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value * 255)));
}

function destroyPreparedParticleBatch(preparedBatch: PreparedParticleBatch): void {
  preparedBatch.gpuRecordBatch.destroy();
  preparedBatch.renderValues.colors.destroy();
}

function copyOutputToBatchVector({
  commandEncoder,
  sourceBuffer,
  targetVector
}: {
  commandEncoder: ReturnType<Device['createCommandEncoder']>;
  sourceBuffer: Buffer;
  targetVector: GPUVector;
}): number {
  const size = targetVector.length * targetVector.byteStride;
  if (size === 0) {
    return 0;
  }
  commandEncoder.copyBufferToBuffer({
    sourceBuffer,
    destinationBuffer: getConcreteBuffer(getGPUVectorBuffer(targetVector)),
    size
  });
  return 1;
}

function getConcreteBuffer(buffer: Buffer | DynamicBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}
