// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferLayout, Device} from '@luma.gl/core';
import {getIndexPickingModule, indexPicking, supportsIndexPicking} from '@luma.gl/engine';
import {GPUTableModel, type GPUTableModelProps} from '../../engine/gpu-table-model';
import {GPURecordBatch} from '../../table/gpu-record-batch';
import type {GPUTypeMap} from '../../table/gpu-schema';
import {GPUTable} from '../../table/gpu-table';
import type {GPUVector} from '../../table/gpu-vector';
import {
  assertPolygonGPUVectorInputs,
  POLYGON_GPU_INPUT_SCHEMA,
  type PolygonBatchProps,
  type PolygonGPUVectors
} from './polygon-gpu-inputs';
import {
  ATTRIBUTE_POLYGON_SHADER_LAYOUT,
  ATTRIBUTE_POLYGON_VS_GLSL,
  ATTRIBUTE_POLYGON_WGSL_SHADER,
  getPolygonPickingParameters,
  POLYGON_FS_GLSL,
  POLYGON_PICKING_FS_GLSL,
  type PolygonShaderInputs
} from './polygon-shaders';

/** Flat props accepted by the GPU-only attribute-backed filled polygon model. */
export type AttributePolygonModelProps = Omit<GPUTableModelProps, 'table' | 'tableCount'> &
  PolygonBatchProps & {
    /** Shader inputs shared by render and picking polygon models. */
    shaderInputs: PolygonShaderInputs;
    /** Whether to configure the model for a picking pass. Defaults to `false`. */
    picking?: boolean;
  };

type PreparedAttributePolygonModel = {
  table: GPUTable;
  modelProps: GPUTableModelProps;
};

/** GPU-only filled polygon model consuming tessellated vectors as vertex attributes. */
export class AttributePolygonModel extends GPUTableModel {
  /** Prepared GPU vectors consumed by the attribute-backed filled polygon model. */
  static readonly gpuInputSchema = POLYGON_GPU_INPUT_SCHEMA;

  readonly polygonTable: GPUTable;

  /** Creates an attribute-backed filled polygon model from prepared GPU vectors. */
  constructor(device: Device, props: AttributePolygonModelProps) {
    const prepared = prepareAttributePolygonModel(device, props);
    super(device, prepared.modelProps);
    this.polygonTable = prepared.table;
  }

  /** Appends one retained prepared polygon batch without repacking its GPU buffers. */
  addBatch(props: PolygonBatchProps): void {
    this.polygonTable.addBatch(createAttributePolygonRecordBatch(props));
    this.setNeedsRedraw('Polygon batch added');
  }
}

function prepareAttributePolygonModel(
  device: Device,
  props: AttributePolygonModelProps
): PreparedAttributePolygonModel {
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
  const table = createAttributePolygonTable({
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
      source: ATTRIBUTE_POLYGON_WGSL_SHADER,
      vs: ATTRIBUTE_POLYGON_VS_GLSL,
      fs: picking && indexPickingSupported ? POLYGON_PICKING_FS_GLSL : POLYGON_FS_GLSL,
      ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
      modules: [
        picking && indexPickingSupported ? indexPicking : getIndexPickingModule(device)
      ] as never,
      shaderLayout: ATTRIBUTE_POLYGON_SHADER_LAYOUT,
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

function createAttributePolygonTable(props: PolygonBatchProps): GPUTable {
  const batch = createAttributePolygonRecordBatch(props);
  return new GPUTable({
    batches: [batch],
    schema: batch.schema,
    bufferLayout: batch.bufferLayout
  });
}

function createAttributePolygonRecordBatch(props: PolygonBatchProps): GPURecordBatch {
  const {sourceInfo, nullCount = 0, ...vectors} = props;
  assertPolygonGPUVectorInputs('AttributePolygonModel', vectors);
  return new GPURecordBatch<GPUTypeMap>({
    vectors: vectors as Record<string, GPUVector>,
    bufferLayout: getAttributePolygonBufferLayout(vectors),
    sourceInfo,
    nullCount
  });
}

function getAttributePolygonBufferLayout(vectors: PolygonGPUVectors): BufferLayout[] {
  return [
    {name: 'positions', byteStride: vectors.positions.byteStride, format: 'float32x4'},
    {name: 'colors', byteStride: vectors.colors.byteStride, format: 'unorm8x4'},
    {name: 'rowIndices', byteStride: vectors.rowIndices.byteStride, format: 'uint32'}
  ];
}
