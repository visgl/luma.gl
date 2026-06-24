// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferLayout, Device} from '@luma.gl/core';
import {getIndexPickingModule, indexPicking, supportsIndexPicking} from '@luma.gl/engine';
import {GPUTableModel, type GPUTableModelProps} from '../../engine/gpu-table-model';
import {GPURecordBatch} from '../../table/gpu-record-batch';
import type {GPUTypeMap} from '../../table/gpu-schema';
import {GPUTable} from '../../table/gpu-table';
import {getGPUVectorData} from '../../table/gpu-vector-utils';
import {
  assertPolygonGPUVectorInputs,
  POLYGON_GPU_INPUT_SCHEMA,
  type PolygonBatchProps,
  type PolygonGPUVectors
} from './polygon-gpu-inputs';
import {
  POLYGON_ATTRIBUTE_SHADER_LAYOUT,
  POLYGON_ATTRIBUTE_VS_GLSL,
  POLYGON_ATTRIBUTE_WGSL_SHADER,
  getPolygonPickingParameters,
  POLYGON_FS_GLSL,
  POLYGON_PICKING_FS_GLSL,
  type PolygonShaderInputs
} from './polygon-shaders';

/** Flat props accepted by the GPU-only attribute-backed filled polygon model. */
export type PolygonAttributeModelProps = Omit<GPUTableModelProps, 'table' | 'tableCount'> &
  PolygonBatchProps & {
    /** Shader inputs shared by render and picking polygon models. */
    shaderInputs: PolygonShaderInputs;
    /** Whether to configure the model for a picking pass. Defaults to `false`. */
    picking?: boolean;
  };

type PreparedPolygonAttributeModel = {
  table: GPUTable;
  modelProps: GPUTableModelProps;
};

/** GPU-only filled polygon model consuming tessellated vectors as vertex attributes. */
export class PolygonAttributeModel extends GPUTableModel {
  /** Prepared GPU vectors consumed by the attribute-backed filled polygon model. */
  static readonly gpuInputSchema = POLYGON_GPU_INPUT_SCHEMA;

  readonly polygonTable: GPUTable;

  /** Creates an attribute-backed filled polygon model from prepared GPU vectors. */
  constructor(device: Device, props: PolygonAttributeModelProps) {
    const prepared = preparePolygonAttributeModel(device, props);
    super(device, prepared.modelProps);
    this.polygonTable = prepared.table;
  }

  /** Appends one retained prepared polygon batch without repacking its GPU buffers. */
  addBatch(props: PolygonBatchProps): void {
    this.polygonTable.addBatch(createPolygonAttributeRecordBatch(props));
    this.setNeedsRedraw('Polygon batch added');
  }
}

function preparePolygonAttributeModel(
  device: Device,
  props: PolygonAttributeModelProps
): PreparedPolygonAttributeModel {
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
  const table = createPolygonAttributeTable({
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
      source: modelProps.source ?? POLYGON_ATTRIBUTE_WGSL_SHADER,
      vs: modelProps.vs ?? POLYGON_ATTRIBUTE_VS_GLSL,
      fs:
        modelProps.fs ??
        (picking && indexPickingSupported ? POLYGON_PICKING_FS_GLSL : POLYGON_FS_GLSL),
      ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
      modules: mergeHostShaderModules(
        [picking && indexPickingSupported ? indexPicking : getIndexPickingModule(device)],
        modelProps.modules ?? []
      ) as never,
      shaderLayout: POLYGON_ATTRIBUTE_SHADER_LAYOUT,
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

function mergeHostShaderModules(
  defaultModules: unknown[],
  hostModules: NonNullable<PolygonAttributeModelProps['modules']>
): unknown[] {
  const hostModuleNames = new Set(hostModules.map(module => module.name));
  return [
    ...defaultModules.filter(module => {
      const moduleName = (module as {name?: string}).name;
      return !moduleName || !hostModuleNames.has(moduleName);
    }),
    ...hostModules
  ];
}

function createPolygonAttributeTable(props: PolygonBatchProps): GPUTable {
  const batch = createPolygonAttributeRecordBatch(props);
  return new GPUTable({
    batches: [batch],
    schema: batch.schema,
    bufferLayout: batch.bufferLayout
  });
}

function createPolygonAttributeRecordBatch(props: PolygonBatchProps): GPURecordBatch {
  const {sourceInfo, nullCount = 0, ...vectors} = props;
  assertPolygonGPUVectorInputs('PolygonAttributeModel', vectors);
  return new GPURecordBatch<GPUTypeMap>({
    gpuData: Object.fromEntries(
      Object.entries(vectors).map(([name, vector]) => [name, getGPUVectorData(vector)])
    ),
    bufferLayout: getPolygonAttributeBufferLayout(vectors),
    sourceInfo,
    nullCount
  });
}

function getPolygonAttributeBufferLayout(vectors: PolygonGPUVectors): BufferLayout[] {
  return [
    {name: 'positions', byteStride: vectors.positions.byteStride, format: 'float32x4'},
    {name: 'colors', byteStride: vectors.colors.byteStride, format: 'unorm8x4'},
    {name: 'rowIndices', byteStride: vectors.rowIndices.byteStride, format: 'uint32'}
  ];
}
