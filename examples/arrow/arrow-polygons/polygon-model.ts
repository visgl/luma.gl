// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PreparedArrowPolygonGPUVectors} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {
  indexColorPicking,
  indexPicking,
  Model,
  ShaderInputs,
  supportsIndexPicking
} from '@luma.gl/engine';
import {getGPUVectorBuffer, GPUTableModel} from '@luma.gl/tables';
import {
  FS_GLSL,
  PICKING_FS_GLSL,
  POLYGON_SHADER_LAYOUT,
  POLYGON_STORAGE_SHADER_LAYOUT,
  STORAGE_WGSL_SHADER,
  VS_GLSL,
  WGSL_SHADER,
  polygonViewport
} from './polygon-model-shaders';

export type PolygonShaderInputs = ShaderInputs<{
  polygonViewport: typeof polygonViewport.props;
  picking: typeof indexPicking.props;
}>;

export type PolygonModelProps = {
  id: string;
  prepared: PreparedArrowPolygonGPUVectors;
  shaderInputs: PolygonShaderInputs;
  picking?: boolean;
  renderModel?: PolygonRenderModel;
};

export type PolygonRenderModel = 'attributes' | 'storage';
export type PolygonModel = GPUTableModel | Model;

export function createPolygonShaderInputs(device: Device): PolygonShaderInputs {
  const shaderInputs: PolygonShaderInputs = new ShaderInputs<{
    polygonViewport: typeof polygonViewport.props;
    picking: typeof indexPicking.props;
  }>({
    polygonViewport,
    picking: getPolygonPickingModule(device)
  });
  shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});
  return shaderInputs;
}

export function createPolygonModel(
  device: Device,
  {id, prepared, shaderInputs, picking = false, renderModel = 'attributes'}: PolygonModelProps
): PolygonModel {
  if (renderModel === 'storage') {
    return createStoragePolygonModel(device, {id, prepared, shaderInputs, picking});
  }

  const indexPickingSupported = supportsIndexPicking(device);
  return new GPUTableModel(device, {
    id,
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: picking && indexPickingSupported ? PICKING_FS_GLSL : FS_GLSL,
    ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
    modules: [
      picking && indexPickingSupported ? indexPicking : getPolygonPickingModule(device)
    ] as never,
    shaderLayout: POLYGON_SHADER_LAYOUT,
    shaderInputs,
    table: prepared.table,
    tableCount: 'none',
    // Indexed WebGL draws use Model.vertexCount as the drawElements index count.
    vertexCount: prepared.tessellation.indices.length,
    indexBuffer: prepared.indices,
    ...(picking && indexPickingSupported
      ? {
          colorAttachmentFormats: ['rgba8unorm', 'rg32sint'] as const,
          depthStencilAttachmentFormat: 'depth24plus' as const
        }
      : {}),
    parameters: getPickingParameters(picking)
  });
}

export function getPolygonStorageBindings(
  prepared: PreparedArrowPolygonGPUVectors
): Record<string, ReturnType<typeof getGPUVectorBuffer>> {
  return {
    polygonPositions: getGPUVectorBuffer(prepared.positions),
    polygonColors: getGPUVectorBuffer(prepared.colors),
    polygonRowIndices: getGPUVectorBuffer(prepared.rowIndices)
  };
}

function createStoragePolygonModel(
  device: Device,
  {id, prepared, shaderInputs, picking = false}: Omit<PolygonModelProps, 'renderModel'>
): Model {
  if (device.type !== 'webgpu') {
    throw new Error('ArrowPolygonRenderer storage model requires WebGPU');
  }

  const indexPickingSupported = supportsIndexPicking(device);
  return new Model(device, {
    id,
    source: STORAGE_WGSL_SHADER,
    ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
    modules: [
      picking && indexPickingSupported ? indexPicking : getPolygonPickingModule(device)
    ] as never,
    shaderLayout: POLYGON_STORAGE_SHADER_LAYOUT,
    shaderInputs,
    bindings: getPolygonStorageBindings(prepared),
    topology: 'triangle-list',
    vertexCount: prepared.tessellation.indices.length,
    indexBuffer: prepared.indices,
    ...(picking && indexPickingSupported
      ? {
          colorAttachmentFormats: ['rgba8unorm', 'rg32sint'] as const,
          depthStencilAttachmentFormat: 'depth24plus' as const
        }
      : {}),
    parameters: getPickingParameters(picking)
  });
}

function getPolygonPickingModule(device: Device): typeof indexPicking {
  return (supportsIndexPicking(device) ? indexPicking : indexColorPicking) as typeof indexPicking;
}

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

function getPickingParameters(picking: boolean): Record<string, unknown> {
  return picking ? PICKING_RENDER_PARAMETERS : DEFAULT_RENDER_PARAMETERS;
}
