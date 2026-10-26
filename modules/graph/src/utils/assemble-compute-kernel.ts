// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {getPlatformInfo, type KernelProps} from '@luma.gl/engine';
import {ShaderAssembler, type ShaderModule, type WGSLShaderAssembler} from '@luma.gl/shadertools';

/** Assemble module-based compute source before creating the executable kernel. */
export function assembleComputeKernel(
  device: Device,
  props: KernelProps & {
    modules?: ShaderModule[];
    defines?: Record<string, boolean | number>;
    shaderAssembler?: WGSLShaderAssembler;
  }
): KernelProps {
  const {
    modules,
    defines,
    shaderAssembler = ShaderAssembler.getDefaultShaderAssembler('wgsl'),
    ...kernelProps
  } = props;
  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: getPlatformInfo(device),
    source: props.source,
    modules,
    defines,
    shaderStage: 'compute',
    computeEntryPoint: props.entryPoint,
    scanVertexAttributes: false
  });
  return {
    ...kernelProps,
    source: assembled.source,
    entryPoint: assembled.entryPoints?.compute || props.entryPoint
  };
}
