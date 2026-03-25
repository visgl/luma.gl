// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UniformValue} from '../utils/uniform-types';
import type {ShaderPass, ShaderPassInputSource, ShaderPassRenderTarget} from './shader-pass';

export type ShaderPassPipelineStep<TargetNameT extends string = string> = {
  shaderPass: ShaderPass<any, any, any, any>;
  inputs?: Record<string, ShaderPassInputSource<TargetNameT>>;
  output?: 'previous' | TargetNameT;
  uniforms?: Record<string, UniformValue>;
};

export type ShaderPassPipeline<TargetNameT extends string = string> = {
  name: string;
  renderTargets?: Record<TargetNameT, ShaderPassRenderTarget>;
  steps: ShaderPassPipelineStep<TargetNameT>[];
};
