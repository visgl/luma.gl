// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {indexColorPicking, indexPicking, ShaderInputs, supportsIndexPicking} from '@luma.gl/engine';
import {GPUTableModel, type GPUTable, type GPUVector} from '@luma.gl/tables';
import {
  FS_GLSL,
  PICKING_FS_GLSL,
  POINT_SHADER_LAYOUT,
  VS_GLSL,
  WGSL_SHADER,
  pointViewport
} from './point-model-shaders';

export type PointModelGPUTypeMap = {
  positions: 'float32x2';
  eventTimes: 'float32';
  radii: 'float32';
  colors: 'unorm8x4';
  rowIndices: 'uint32';
};

export type PointModelVectors = Record<string, GPUVector> & {
  [ColumnName in keyof PointModelGPUTypeMap]: GPUVector<PointModelGPUTypeMap[ColumnName]>;
};

export type PointModelTable = GPUTable & {
  readonly gpuVectors: PointModelVectors;
};

export type PointShaderInputs = ShaderInputs<{
  pointViewport: typeof pointViewport.props;
  picking: typeof indexPicking.props;
}>;

type PointModelProps = {
  id: string;
  table: PointModelTable;
  shaderInputs: PointShaderInputs;
  picking?: boolean;
};

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
    picking: getPointPickingModule(device)
  });
  shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});
  return shaderInputs;
}

export function createPointModel(
  device: Device,
  {id, table, shaderInputs, picking = false}: PointModelProps
): GPUTableModel {
  const indexPickingSupported = supportsIndexPicking(device);
  return new GPUTableModel(device, {
    id,
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: picking && indexPickingSupported ? PICKING_FS_GLSL : FS_GLSL,
    ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
    modules: [
      picking && indexPickingSupported ? indexPicking : getPointPickingModule(device)
    ] as never,
    shaderLayout: POINT_SHADER_LAYOUT,
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

function getPointPickingModule(device: Device): typeof indexPicking {
  return (supportsIndexPicking(device) ? indexPicking : indexColorPicking) as typeof indexPicking;
}
