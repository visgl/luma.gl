// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTableGeometry} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {indexColorPicking, indexPicking, ShaderInputs, supportsIndexPicking} from '@luma.gl/engine';
import {GPUTableModel, type GPUTable, type GPUVector} from '@luma.gl/tables';
import type {ShaderModule} from '@luma.gl/shadertools';
import {
  FS_GLSL,
  PICKING_FS_GLSL,
  VS_GLSL,
  WEBGL_MESH_SHADER_LAYOUT,
  WEBGPU_MESH_SHADER_LAYOUT,
  WGSL_SHADER,
  app
} from './mesh-geometry-model-shaders';

export const MESH_GEOMETRY_MATRIX_ARROW_PATHS = {
  matrixColumn0: 'matrix',
  matrixColumn1: 'matrix',
  matrixColumn2: 'matrix',
  matrixColumn3: 'matrix'
};

export type MeshGeometryShaderInputs = ShaderInputs<{
  app: typeof app.props;
  picking: typeof indexPicking.props;
}>;

export type MeshGeometryModelProps = {
  id: string;
  geometry: ArrowTableGeometry;
  table: GPUTable;
  shaderInputs: MeshGeometryShaderInputs;
  faceColors?: GPUVector<'float32x4'>;
  parameters?: Record<string, unknown>;
};

export function createMeshGeometryShaderInputs(): MeshGeometryShaderInputs {
  const shaderInputs: MeshGeometryShaderInputs = new ShaderInputs<{
    app: typeof app.props;
    picking: typeof indexPicking.props;
  }>({app, picking: indexPicking});
  shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});
  return shaderInputs;
}

export function getMeshGeometryShaderLayout(device: Device) {
  return device.type === 'webgpu' ? WEBGPU_MESH_SHADER_LAYOUT : WEBGL_MESH_SHADER_LAYOUT;
}

export function createMeshGeometryModel(
  device: Device,
  {id, geometry, table, shaderInputs, faceColors, parameters}: MeshGeometryModelProps
): GPUTableModel {
  return new GPUTableModel(device, {
    id,
    geometry,
    table,
    tableCount: 'instance',
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: FS_GLSL,
    shaderLayout: getMeshGeometryShaderLayout(device),
    shaderInputs,
    modules: [getMeshGeometryPickingModule(device)] as ShaderModule[],
    ...(faceColors ? {bindings: {faceColors: getGPUVectorBuffer(faceColors)}} : {}),
    parameters: parameters ?? DEFAULT_RENDER_PARAMETERS
  });
}

export function createMeshGeometryPickingModel(
  device: Device,
  {id, geometry, table, shaderInputs, faceColors, parameters}: MeshGeometryModelProps
): GPUTableModel | null {
  if (!supportsIndexPicking(device)) {
    return null;
  }

  return new GPUTableModel(device, {
    id,
    geometry,
    table,
    tableCount: 'instance',
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: PICKING_FS_GLSL,
    fragmentEntryPoint: 'fragmentPicking',
    modules: [indexPicking] as ShaderModule[],
    shaderLayout: getMeshGeometryShaderLayout(device),
    ...(faceColors ? {bindings: {faceColors: getGPUVectorBuffer(faceColors)}} : {}),
    shaderInputs,
    colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
    depthStencilAttachmentFormat: 'depth24plus',
    parameters: parameters ?? DEFAULT_RENDER_PARAMETERS
  });
}

function getMeshGeometryPickingModule(device: Device): typeof indexPicking {
  return (supportsIndexPicking(device) ? indexPicking : indexColorPicking) as typeof indexPicking;
}

function getGPUVectorBuffer(vector: GPUVector) {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`ArrowMeshRenderer vector "${vector.name}" requires one GPUData chunk`);
  }
  return data.buffer;
}

const DEFAULT_RENDER_PARAMETERS = {
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
} as const satisfies Record<string, unknown>;
