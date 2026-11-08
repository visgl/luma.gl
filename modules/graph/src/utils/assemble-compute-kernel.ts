// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {getPlatformInfo} from '../execution/utils/get-platform-info';
import {type KernelProps} from '../execution/compute/kernel';
import {WGSLShaderAssembler} from '@luma.gl/shaders/wgsl';
import {type ShaderModule} from '@luma.gl/shaders';

/** Assemble module-based compute source before creating the executable kernel. */
export function assembleComputeKernel(
  device: Device,
  props: KernelProps & {
    modules?: ShaderModule[];
    defines?: Record<string, boolean | number>;
    shaderAssembler?: WGSLShaderAssembler;
  }
): KernelProps {
  const {modules, defines, shaderAssembler = new WGSLShaderAssembler(), ...kernelProps} = props;
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
