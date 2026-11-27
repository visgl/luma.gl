// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RenderPipelineParameters, Texture, TextureView} from '@luma.gl/core';
import type {CORTAOCamera, CORTAOConfiguration} from './cortao-parameters';
import type {CORTAORayCount} from './cortao-occluder-lookup-table';

/** The shader constants of the passes. A change rebuilds the pipelines. */
export type CORTAOShaderOptions = {
  sampleCount: number;
  rayCount: CORTAORayCount;
  largeFilter: boolean;
  filterSymmetry: boolean;
};

/** The inputs of one CORTAO frame. */
export type CORTAOFrame = {
  camera: CORTAOCamera;
  configuration: CORTAOConfiguration;
  /** The hardware depth of the captured layers. */
  depthView: TextureView;
  /** Apply the bilateral filter pass. */
  filter: boolean;
};

/** The CORTAO passes of one GPU backend. */
export interface CORTAOPasses {
  /** Runs the prepass, the mip pass, the main pass and the optional filter pass. */
  renderOcclusion(frame: CORTAOFrame): Texture;
  destroy(): void;
}

/** Pipeline parameters of the full-screen passes. */
export const PASS_PARAMETERS: RenderPipelineParameters = {
  depthWriteEnabled: false,
  depthCompare: 'always'
};

/** Nearest sampling. Integer and depth textures are incomplete with linear filtering in WebGL 2. */
export const NEAREST_SAMPLER = {
  minFilter: 'nearest',
  magFilter: 'nearest'
} as const;

/** The size of the occluder lookup table. Both backends use the same table. */
export const LOOKUP_TABLE_SIZE = {
  directionResolution: 24,
  radiusResolution: 16
} as const;
