// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowPickingModule, supportsArrowIndexPicking} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {indexPicking, ShaderInputs} from '@luma.gl/engine';
import {GPUTableModel, type GPUColumn, type GPUInputSchema, type GPUTable} from '@luma.gl/tables';
import {
  FS_GLSL,
  PICKING_FS_GLSL,
  POINT_SHADER_LAYOUT,
  POINT_STORAGE_SHADER_LAYOUT,
  VS_GLSL,
  WGSL_SHADER,
  WGSL_STORAGE_SHADER,
  pointViewport
} from './point-model-shaders';

export type PointModelGPUTypeMap = {
  positions: 'float32x2';
  eventTimes: 'float32';
  radii: 'float32';
  colors: 'unorm8x4';
  rowIndices: 'uint32';
};

export type PointModelColumns = {
  [ColumnName in keyof PointModelGPUTypeMap]: GPUColumn<PointModelGPUTypeMap[ColumnName]>;
};

export type PointModelTable = GPUTable & {
  readonly gpuColumns: PointModelColumns;
};

export type PointModelMode = 'attributes' | 'storage';

export type PointShaderInputs = ShaderInputs<{
  pointViewport: typeof pointViewport.props;
  picking: typeof indexPicking.props;
}>;

type PointModelProps = {
  id: string;
  table: PointModelTable;
  shaderInputs: PointShaderInputs;
  picking?: boolean;
  mode?: PointModelMode;
};

export const POINT_GPU_INPUT_SCHEMA = [
  {
    columnName: 'positions',
    attributeName: 'positions',
    storageBindingName: 'pointPositions',
    kind: 'positions',
    required: true,
    formats: ['float32x2']
  },
  {
    columnName: 'eventTimes',
    attributeName: 'eventTimes',
    storageBindingName: 'pointEventTimes',
    kind: 'time',
    required: true,
    formats: ['float32']
  },
  {
    columnName: 'radii',
    attributeName: 'radii',
    storageBindingName: 'pointRadii',
    kind: 'scalars',
    required: false,
    formats: ['float32']
  },
  {
    columnName: 'colors',
    attributeName: 'colors',
    storageBindingName: 'pointColors',
    kind: 'colors',
    required: false,
    formats: ['unorm8x4']
  },
  {
    columnName: 'rowIndices',
    attributeName: 'rowIndices',
    storageBindingName: 'pointRowIndices',
    kind: 'scalars',
    required: true,
    formats: ['uint32']
  }
] as const satisfies GPUInputSchema;

const DEFAULT_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies Record<string, unknown>;

const PICKING_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: false
} as const satisfies Record<string, unknown>;

export function createPointShaderInputs(device: Device): PointShaderInputs {
  const shaderInputs: PointShaderInputs = new ShaderInputs<{
    pointViewport: typeof pointViewport.props;
    picking: typeof indexPicking.props;
  }>({
    pointViewport,
    picking: getArrowPickingModule(device)
  });
  shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});
  return shaderInputs;
}

export function createPointModel(
  device: Device,
  {id, table, shaderInputs, picking = false, mode = 'attributes'}: PointModelProps
): GPUTableModel {
  const indexPickingSupported = supportsArrowIndexPicking(device);
  const storage = mode === 'storage' && device.type === 'webgpu';
  return new GPUTableModel(device, {
    id,
    source: storage ? WGSL_STORAGE_SHADER : WGSL_SHADER,
    vs: VS_GLSL,
    fs: picking && indexPickingSupported ? PICKING_FS_GLSL : FS_GLSL,
    ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
    modules: [
      picking && indexPickingSupported ? indexPicking : getArrowPickingModule(device)
    ] as never,
    shaderLayout: storage ? POINT_STORAGE_SHADER_LAYOUT : POINT_SHADER_LAYOUT,
    gpuInputSchema: POINT_GPU_INPUT_SCHEMA,
    shaderInputs,
    table,
    tableCount: 'instance',
    topology: 'triangle-list',
    vertexCount: 6,
    ...(picking && indexPickingSupported
      ? {
          colorAttachmentFormats: ['rgba8unorm', 'rg32sint'] as const,
          depthStencilAttachmentFormat: 'depth24plus' as const
        }
      : {}),
    parameters: picking ? PICKING_RENDER_PARAMETERS : DEFAULT_RENDER_PARAMETERS
  });
}
