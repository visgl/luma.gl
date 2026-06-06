// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PreparedDggsCellPathGPUVector} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {ShaderInputs} from '@luma.gl/engine';
import {StoragePathModel} from '@luma.gl/tables';
import {DGGS_PATH_SOURCE, dggsViewport} from './dggs-polygon-model-shaders';

export type DggsPolygonShaderInputs = ShaderInputs<{
  dggsViewport: typeof dggsViewport.props;
}>;

export type DggsPolygonPathModelProps = {
  id: string;
  paths: PreparedDggsCellPathGPUVector['paths'];
  shaderInputs: DggsPolygonShaderInputs;
  color: [number, number, number, number];
  width: number;
};

export function createDggsPolygonShaderInputs(): DggsPolygonShaderInputs {
  return new ShaderInputs<{dggsViewport: typeof dggsViewport.props}>({
    dggsViewport
  });
}

export function createDggsPolygonPathModel(
  device: Device,
  {id, paths, shaderInputs, color, width}: DggsPolygonPathModelProps
): StoragePathModel {
  return new StoragePathModel(device, {
    id,
    paths,
    source: DGGS_PATH_SOURCE,
    shaderInputs,
    topology: 'line-list',
    vertexCount: 2,
    color,
    width,
    parameters: DEFAULT_DGGS_RENDER_PARAMETERS
  });
}

const DEFAULT_DGGS_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies Record<string, unknown>;
