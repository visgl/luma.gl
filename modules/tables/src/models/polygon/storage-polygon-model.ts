// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device} from '@luma.gl/core';
import {DynamicBuffer, getIndexPickingModule, indexPicking, supportsIndexPicking} from '@luma.gl/engine';
import {GPUTableModel, type GPUTableModelProps} from '../../engine/gpu-table-model';
import {GPURecordBatch} from '../../table/gpu-record-batch';
import type {GPUData} from '../../table/gpu-data';
import type {GPUTypeMap} from '../../table/gpu-schema';
import {GPUTable} from '../../table/gpu-table';
import type {GPUVector} from '../../table/gpu-vector';
import {getGPUVectorData} from '../../table/gpu-vector-utils';
import {
  assertPolygonGPUVectorInputs,
  POLYGON_GPU_INPUT_SCHEMA,
  type PolygonBatchProps,
  type PolygonGPUVectors
} from './polygon-gpu-inputs';
import {
  getPolygonPickingParameters,
  STORAGE_POLYGON_SHADER_LAYOUT,
  STORAGE_POLYGON_WGSL_SHADER,
  type PolygonShaderInputs
} from './polygon-shaders';

/** Flat props accepted by the GPU-only storage-backed filled polygon model. */
export type StoragePolygonModelProps = Omit<GPUTableModelProps, 'table' | 'tableCount'> &
  PolygonBatchProps & {
    /** Shader inputs shared by render and picking polygon models. */
    shaderInputs: PolygonShaderInputs;
    /** Whether to configure the model for a picking pass. Defaults to `false`. */
    picking?: boolean;
  };

type PreparedStoragePolygonModel = {
  table: GPUTable;
  modelProps: GPUTableModelProps;
};

/** GPU-only filled polygon model consuming tessellated vectors through storage bindings. */
export class StoragePolygonModel extends GPUTableModel {
  /** Prepared GPU vectors consumed by the storage-backed filled polygon model. */
  static readonly gpuInputSchema = POLYGON_GPU_INPUT_SCHEMA;

  readonly polygonTable: GPUTable;

  /** Creates a storage-backed filled polygon model from prepared GPU vectors. */
  constructor(device: Device, props: StoragePolygonModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('StoragePolygonModel is WebGPU-only');
    }
    const prepared = prepareStoragePolygonModel(device, props);
    super(device, prepared.modelProps);
    this.polygonTable = prepared.table;
  }

  /** Appends one retained prepared polygon batch without repacking its GPU buffers. */
  addBatch(props: PolygonBatchProps): void {
    this.polygonTable.addBatch(createStoragePolygonRecordBatch(props));
    this.setNeedsRedraw('Polygon batch added');
  }
}

function prepareStoragePolygonModel(
  device: Device,
  props: StoragePolygonModelProps
): PreparedStoragePolygonModel {
  const {
    positions,
    colors,
    rowIndices,
    indices,
    sourceInfo,
    nullCount,
    picking = false,
    parameters,
    shaderInputs,
    ...modelProps
  } = props;
  const table = createStoragePolygonTable({
    positions,
    colors,
    rowIndices,
    indices,
    sourceInfo,
    nullCount
  });
  const indexPickingSupported = supportsIndexPicking(device);

  return {
    table,
    modelProps: {
      ...modelProps,
      source: STORAGE_POLYGON_WGSL_SHADER,
      ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
      modules: [
        picking && indexPickingSupported ? indexPicking : getIndexPickingModule(device)
      ] as never,
      shaderLayout: STORAGE_POLYGON_SHADER_LAYOUT,
      shaderInputs,
      table,
      tableCount: 'none',
      topology: 'triangle-list',
      ...(picking && indexPickingSupported
        ? {
            colorAttachmentFormats: ['rgba8unorm', 'rg32sint'] as const,
            depthStencilAttachmentFormat: 'depth24plus' as const
          }
        : {}),
      parameters: parameters ?? getPolygonPickingParameters(picking)
    }
  };
}

function createStoragePolygonTable(props: PolygonBatchProps): GPUTable {
  const batch = createStoragePolygonRecordBatch(props);
  return new GPUTable({
    batches: [batch],
    schema: batch.schema,
    bufferLayout: batch.bufferLayout
  });
}

function createStoragePolygonRecordBatch(props: PolygonBatchProps): GPURecordBatch {
  const {sourceInfo, nullCount = 0, ...vectors} = props;
  assertPolygonGPUVectorInputs('StoragePolygonModel', vectors);
  return new GPURecordBatch<GPUTypeMap>({
    vectors: vectors as Record<string, GPUVector>,
    bufferLayout: [],
    bindings: getStoragePolygonBindings(vectors),
    sourceInfo,
    nullCount
  });
}

function getStoragePolygonBindings(vectors: PolygonGPUVectors): Record<string, Binding> {
  return {
    polygonPositions: getStoragePolygonBinding(vectors.positions),
    polygonColors: getStoragePolygonBinding(vectors.colors),
    polygonRowIndices: getStoragePolygonBinding(vectors.rowIndices)
  };
}

function getStoragePolygonBinding(vector: GPUVector): Binding {
  const data = getGPUVectorData(vector);
  const buffer = getStoragePolygonBuffer(data);
  if (!(buffer.usage & Buffer.STORAGE)) {
    throw new Error(`StoragePolygonModel ${vector.name} requires Buffer.STORAGE usage`);
  }
  return {
    buffer,
    offset: data.byteOffset,
    size: data.valueLength * data.byteStride
  };
}

function getStoragePolygonBuffer(data: GPUData): Buffer {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}
