// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowFixedSizeListValues,
  isArrowFixedSizeListVector,
  makeArrowGPURecordBatch
} from '@luma.gl/arrow';
import {Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicBuffer, Model} from '@luma.gl/engine';
import {
  GPUTableComputation,
  GPURecordBatch,
  GPUTable,
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

const DEFAULT_RESET_INTERVAL_MILLISECONDS = 8_000;

export type ArrowParticleLayerColumns = {
  positions?: string;
  velocities?: string;
};

export type ArrowParticleLayerProps = {
  data?: arrow.Table | null;
  columns?: ArrowParticleLayerColumns;
  resetIntervalMilliseconds?: number;
};

export type ArrowParticleLayerStreamingSession = {
  version: number;
};

export type ArrowParticleLayerRecordBatchStreamUpdate = {
  loadedBatchCount: number;
  particleCount: number;
};

export type ArrowParticleLayerRecordBatchStreamProps = {
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  streamingSession?: ArrowParticleLayerStreamingSession;
  onBatch?: (update: ArrowParticleLayerRecordBatchStreamUpdate) => void;
};

type ArrowParticleVectorType = arrow.FixedSizeList<arrow.Float32>;

type ArrowParticleLayerResolvedProps = {
  data: arrow.Table | null;
  columns: Required<ArrowParticleLayerColumns>;
  resetIntervalMilliseconds: number;
};

type InitialParticleBatchValues = {
  positions: Float32Array;
  velocities: Float32Array;
};

type ParticleTransformOutputBuffers = {
  nextParticlePositions: Buffer;
  nextParticleVelocities: Buffer;
};

const DEFAULT_COLUMNS: Required<ArrowParticleLayerColumns> = {
  positions: 'positions',
  velocities: 'velocities'
};

export class ArrowParticleLayer {
  readonly device: Device;
  props: ArrowParticleLayerResolvedProps;
  particleTable: GPUTable | null = null;
  computation: GPUTableComputation | null = null;
  transform: TableTransform | null = null;
  model: Model | null = null;
  particleCount = 0;
  private readonly initialBatchValues = new Map<GPURecordBatch, InitialParticleBatchValues>();
  private readonly transformOutputBuffers = new Map<
    GPURecordBatch,
    ParticleTransformOutputBuffers
  >();
  private lastResetTime: number | null = null;
  private streamingSessionVersion = 0;
  private isDestroyed = false;

  constructor(device: Device, props: ArrowParticleLayerProps = {}) {
    if (device.type !== 'webgpu' && device.type !== 'webgl') {
      throw new Error('Particles: FixedSizeList<Float32, 2> requires WebGPU or WebGL2');
    }

    this.device = device;
    this.props = {
      data: props.data ?? null,
      columns: {...DEFAULT_COLUMNS, ...props.columns},
      resetIntervalMilliseconds:
        props.resetIntervalMilliseconds ?? DEFAULT_RESET_INTERVAL_MILLISECONDS
    };
    if (this.props.data) {
      this.replaceArrowTable(this.props.data);
    }
  }

  setProps(props: ArrowParticleLayerProps): void {
    const shouldRecreate = props.data !== undefined || props.columns !== undefined;
    this.props = {
      data: props.data ?? this.props.data,
      columns: {...this.props.columns, ...props.columns},
      resetIntervalMilliseconds:
        props.resetIntervalMilliseconds ?? this.props.resetIntervalMilliseconds
    };

    if (shouldRecreate) {
      this.cancelRecordBatchStream();
      if (this.props.data) {
        this.replaceArrowTable(this.props.data);
      } else {
        this.destroyDeviceResources();
        this.destroyParticleTable();
        this.particleCount = 0;
        this.lastResetTime = null;
      }
    }
  }

  beginRecordBatchStream(): ArrowParticleLayerStreamingSession {
    this.streamingSessionVersion++;
    this.destroyDeviceResources();
    this.destroyParticleTable();
    this.particleCount = 0;
    this.lastResetTime = null;
    return {version: this.streamingSessionVersion};
  }

  cancelRecordBatchStream(): void {
    this.streamingSessionVersion++;
  }

  async streamRecordBatches({
    recordBatchIterator,
    streamingSession = this.beginRecordBatchStream(),
    onBatch
  }: ArrowParticleLayerRecordBatchStreamProps): Promise<void> {
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

      const {gpuRecordBatch, initialValues} = this.makeParticleGPURecordBatch(
        recordBatchResult.value
      );
      if (!this.isRecordBatchStreamActive(streamingSession)) {
        gpuRecordBatch.destroy();
        return;
      }

      this.addParticleGPURecordBatch(gpuRecordBatch, initialValues);
      loadedBatchCount++;
      onBatch?.({
        loadedBatchCount,
        particleCount: this.particleCount
      });
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

  draw(renderPass: RenderPass): void {
    if (!this.model || !this.particleTable) {
      return;
    }

    for (const batch of this.particleTable.batches) {
      if (batch.numRows === 0) {
        continue;
      }
      const positions = getRequiredBatchVector(batch, 'particlePositions');
      if (this.device.type === 'webgpu') {
        this.model.setBindings({particlePositions: positions.buffer});
      } else {
        this.model.setAttributes({particlePositions: positions.buffer});
      }
      this.model.setInstanceCount(batch.numRows);
      this.model.draw(renderPass);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.cancelRecordBatchStream();
    this.destroyDeviceResources();
    this.destroyParticleTable();
  }

  setNeedsRedraw(_reason: string): void {}

  needsRedraw(): false {
    return false;
  }

  private replaceArrowTable(data: arrow.Table): void {
    this.destroyDeviceResources();
    this.destroyParticleTable();

    const gpuRecordBatchInputs = data.batches.map(recordBatch =>
      this.makeParticleGPURecordBatch(recordBatch)
    );
    const firstRecordBatch = gpuRecordBatchInputs[0]?.gpuRecordBatch;
    if (!firstRecordBatch) {
      return;
    }

    this.particleTable = new GPUTable({
      batches: gpuRecordBatchInputs.map(({gpuRecordBatch}) => gpuRecordBatch),
      schema: firstRecordBatch.schema,
      bufferLayout: firstRecordBatch.bufferLayout
    });
    for (const {gpuRecordBatch, initialValues} of gpuRecordBatchInputs) {
      this.initialBatchValues.set(gpuRecordBatch, initialValues);
    }
    this.particleCount = this.particleTable.numRows;
    this.lastResetTime = null;
    this.createDeviceResources();
  }

  private addParticleGPURecordBatch(
    gpuRecordBatch: GPURecordBatch,
    initialValues: InitialParticleBatchValues
  ): void {
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
    this.particleCount = this.particleTable.numRows;
    this.recreateDeviceResources();
  }

  private makeParticleGPURecordBatch(recordBatch: arrow.RecordBatch): {
    gpuRecordBatch: GPURecordBatch;
    initialValues: InitialParticleBatchValues;
  } {
    const sourceTable = new arrow.Table([recordBatch]);
    const sourceVectors = getArrowParticleSourceVectors(sourceTable, this.props.columns);
    if (sourceVectors.velocities.length !== sourceVectors.positions.length) {
      throw new Error(
        `ArrowParticleLayer positions and velocities rows must match (${sourceVectors.positions.length} !== ${sourceVectors.velocities.length})`
      );
    }

    return {
      gpuRecordBatch: makeArrowGPURecordBatch(this.device, recordBatch, {
        shaderLayout: WEBGL_TRANSFORM_SHADER_LAYOUT,
        arrowPaths: {
          particlePositions: this.props.columns.positions,
          particleVelocities: this.props.columns.velocities
        }
      }),
      initialValues: {
        positions: getInitialParticleValues(sourceVectors.positions),
        velocities: getInitialParticleValues(sourceVectors.velocities)
      }
    };
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
    const firstPositions = getRequiredBatchVector(firstBatch, 'particlePositions');

    if (this.device.type === 'webgpu') {
      this.computation = new GPUTableComputation(this.device, {
        id: 'gpu-vector-storage-particles-compute',
        source: makeComputeShader(),
        shaderLayout: COMPUTE_SHADER_LAYOUT,
        inputVectors: this.particleTable.gpuVectors
      });

      this.model = new Model(this.device, {
        id: 'gpu-vector-storage-particles-render',
        source: WEBGPU_RENDER_SHADER,
        shaderLayout: RENDER_SHADER_LAYOUT,
        bindings: {
          particlePositions: firstPositions.buffer
        },
        topology: 'triangle-list',
        vertexCount: 6,
        instanceCount: firstBatch.numRows
      });
      return;
    }

    this.transform = new TableTransform(this.device, {
      id: 'gpu-vector-storage-particles-transform',
      vs: WEBGL_TRANSFORM_SHADER,
      shaderLayout: WEBGL_TRANSFORM_SHADER_LAYOUT,
      table: this.particleTable,
      outputs: ['nextParticlePositions', 'nextParticleVelocities']
    });

    this.model = new Model(this.device, {
      id: 'gpu-vector-storage-particles-render',
      vs: WEBGL_RENDER_VERTEX_SHADER,
      fs: WEBGL_RENDER_FRAGMENT_SHADER,
      shaderLayout: WEBGL_RENDER_SHADER_LAYOUT,
      attributes: {
        particlePositions: firstPositions.buffer
      },
      bufferLayout: [{name: 'particlePositions', format: 'float32x2', stepMode: 'instance'}],
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
      getRequiredBatchVector(batch, 'particlePositions').buffer.write(initialValues.positions);
      getRequiredBatchVector(batch, 'particleVelocities').buffer.write(initialValues.velocities);
    }
  }

  private getTransformOutputBuffers(batch: GPURecordBatch): ParticleTransformOutputBuffers {
    let outputBuffers = this.transformOutputBuffers.get(batch);
    if (outputBuffers) {
      return outputBuffers;
    }

    const positions = getRequiredBatchVector(batch, 'particlePositions');
    const velocities = getRequiredBatchVector(batch, 'particleVelocities');
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
      id: `gpu-vector-storage-particles-${label}-output-${this.particleTable?.batches.indexOf(batch) ?? 0}`,
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
        targetVector: getRequiredBatchVector(batch, 'particlePositions')
      });
      copyCount += copyOutputToBatchVector({
        commandEncoder,
        sourceBuffer: outputBuffers.nextParticleVelocities,
        targetVector: getRequiredBatchVector(batch, 'particleVelocities')
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
    this.particleTable = null;
    this.initialBatchValues.clear();
  }

  private isRecordBatchStreamActive(streamingSession: ArrowParticleLayerStreamingSession): boolean {
    return !this.isDestroyed && streamingSession.version === this.streamingSessionVersion;
  }
}

function getArrowParticleSourceVectors(
  data: arrow.Table,
  columns: Required<ArrowParticleLayerColumns>
): {
  positions: arrow.Vector<ArrowParticleVectorType>;
  velocities: arrow.Vector<ArrowParticleVectorType>;
} {
  return {
    positions: getRequiredParticleVector(data, columns.positions),
    velocities: getRequiredParticleVector(data, columns.velocities)
  };
}

function getRequiredParticleVector(
  table: arrow.Table,
  columnName: string
): arrow.Vector<ArrowParticleVectorType> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowParticleLayer data is missing Arrow column "${columnName}"`);
  }
  if (!isArrowFixedSizeListVector(vector, new arrow.Float32(), 2)) {
    throw new Error(`ArrowParticleLayer column "${columnName}" must be FixedSizeList<Float32, 2>`);
  }
  return vector;
}

function getInitialParticleValues(vector: arrow.Vector<ArrowParticleVectorType>): Float32Array {
  return new Float32Array(getArrowFixedSizeListValues(vector));
}

function getRequiredBatchVector(batch: GPURecordBatch, name: string): GPUVector {
  const vector = batch.gpuVectors[name];
  if (!vector) {
    throw new Error(`ArrowParticleLayer GPU batch is missing vector "${name}"`);
  }
  return vector;
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
    destinationBuffer: getConcreteBuffer(targetVector.buffer),
    size
  });
  return 1;
}

function getConcreteBuffer(buffer: Buffer | DynamicBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}
