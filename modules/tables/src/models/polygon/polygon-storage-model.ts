// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device} from '@luma.gl/core';
import {getIndexPickingModule, indexPicking, supportsIndexPicking} from '@luma.gl/engine';
import {GPUTableModel, type GPUTableModelProps} from '../../engine/gpu-table-model';
import {GPURecordBatch} from '../../table/gpu-record-batch';
import {GPUConstant} from '../../table/gpu-constant';
import type {GPUTypeMap} from '../../table/gpu-schema';
import {GPUTable} from '../../table/gpu-table';
import {getGPUVectorData} from '../../table/gpu-vector-utils';
import {
  assertPolygonGPUVectorInputs,
  POLYGON_GPU_INPUT_SCHEMA,
  type PolygonBatchProps
} from './polygon-gpu-inputs';
import {
  getPolygonPickingParameters,
  mergePolygonShaderModules,
  POLYGON_STORAGE_SHADER_LAYOUT,
  POLYGON_STORAGE_WGSL_SHADER,
  type PolygonShaderInputs
} from './polygon-shaders';

/** Flat props accepted by the GPU-only storage-backed filled polygon model. */
export type PolygonStorageModelProps = Omit<GPUTableModelProps, 'table' | 'tableCount'> &
  PolygonBatchProps & {
    /** Shader inputs shared by render and picking polygon models. */
    shaderInputs: PolygonShaderInputs;
    /** Whether to configure the model for a picking pass. Defaults to `false`. */
    picking?: boolean;
  };

type PreparedPolygonStorageModel = {
  table: GPUTable;
  modelProps: GPUTableModelProps;
};

/** GPU-only filled polygon model consuming tessellated vectors through storage bindings. */
export class PolygonStorageModel extends GPUTableModel {
  /** Prepared GPU vectors consumed by the storage-backed filled polygon model. */
  static readonly gpuInputSchema = POLYGON_GPU_INPUT_SCHEMA;

  readonly polygonTable: GPUTable;

  /** Creates a storage-backed filled polygon model from prepared GPU vectors. */
  constructor(device: Device, props: PolygonStorageModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('PolygonStorageModel is WebGPU-only');
    }
    const prepared = preparePolygonStorageModel(device, props);
    super(device, prepared.modelProps);
    this.polygonTable = prepared.table;
  }

  /** Appends one retained prepared polygon batch without repacking its GPU buffers. */
  addBatch(props: PolygonBatchProps): void {
    assertPolygonBatchColorMode(this.polygonTable, props.colors);
    this.polygonTable.addBatch(createPolygonStorageRecordBatch(props));
    this.setTable(this.polygonTable);
    this.setNeedsRedraw('Polygon batch added');
  }
}

function preparePolygonStorageModel(
  device: Device,
  props: PolygonStorageModelProps
): PreparedPolygonStorageModel {
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
  const table = createPolygonStorageTable({
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
      source: modelProps.source ?? POLYGON_STORAGE_WGSL_SHADER,
      ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
      modules: mergePolygonShaderModules(
        [picking && indexPickingSupported ? indexPicking : getIndexPickingModule(device)],
        modelProps.modules ?? []
      ) as never,
      shaderLayout: modelProps.shaderLayout ?? POLYGON_STORAGE_SHADER_LAYOUT,
      shaderInputs,
      table,
      tableCount: 'none',
      gpuInputSchema: POLYGON_GPU_INPUT_SCHEMA,
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

function createPolygonStorageTable(props: PolygonBatchProps): GPUTable {
  const batch = createPolygonStorageRecordBatch(props);
  return new GPUTable({
    batches: [batch],
    constants: props.colors instanceof GPUConstant ? {colors: props.colors} : undefined
  });
}

function createPolygonStorageRecordBatch(props: PolygonBatchProps): GPURecordBatch {
  const {sourceInfo, nullCount = 0, colors, ...vectors} = props;
  assertPolygonGPUVectorInputs('PolygonStorageModel', {...vectors, colors});
  const varyingVectors = colors instanceof GPUConstant ? vectors : {...vectors, colors};
  return new GPURecordBatch<GPUTypeMap>({
    gpuData: Object.fromEntries(
      Object.entries(varyingVectors).map(([name, vector]) => [name, getGPUVectorData(vector)])
    ),
    bufferLayout: [],
    sourceInfo,
    nullCount
  });
}

function assertPolygonBatchColorMode(table: GPUTable, colors: PolygonBatchProps['colors']): void {
  const tableUsesConstant = Boolean(table.gpuConstants['colors']);
  if (tableUsesConstant !== colors instanceof GPUConstant) {
    throw new Error('PolygonStorageModel appended batches must use the same color input mode');
  }
}
