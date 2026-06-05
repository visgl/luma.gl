// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowPickingModule, supportsArrowIndexPicking} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {indexPicking, ShaderInputs} from '@luma.gl/engine';
import {GPUTableModel, type GPUTable} from '@luma.gl/tables';
import {
  FS_GLSL,
  PICKING_FS_GLSL,
  POLYGON_SHADER_LAYOUT,
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
  table: GPUTable;
  shaderInputs: PolygonShaderInputs;
  picking?: boolean;
};

export function createPolygonShaderInputs(device: Device): PolygonShaderInputs {
  const shaderInputs: PolygonShaderInputs = new ShaderInputs<{
    polygonViewport: typeof polygonViewport.props;
    picking: typeof indexPicking.props;
  }>({
    polygonViewport,
    picking: getArrowPickingModule(device)
  });
  shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});
  return shaderInputs;
}

export function createPolygonModel(
  device: Device,
  {id, table, shaderInputs, picking = false}: PolygonModelProps
): GPUTableModel {
  const indexPickingSupported = supportsArrowIndexPicking(device);
  return new GPUTableModel(device, {
    id,
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: picking && indexPickingSupported ? PICKING_FS_GLSL : FS_GLSL,
    ...(picking && indexPickingSupported ? {fragmentEntryPoint: 'fragmentPicking'} : {}),
    modules: [
      picking && indexPickingSupported ? indexPicking : getArrowPickingModule(device)
    ] as never,
    shaderLayout: POLYGON_SHADER_LAYOUT,
    shaderInputs,
    table,
    tableCount: 'none',
    ...(picking && indexPickingSupported
      ? {
          colorAttachmentFormats: ['rgba8unorm', 'rg32sint'] as const,
          depthStencilAttachmentFormat: 'depth24plus' as const
        }
      : {}),
    parameters: getPickingParameters(picking)
  });
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
