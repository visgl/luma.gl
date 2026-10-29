// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {getPlatformInfo, Kernel, type KernelProps} from '@luma.gl/gpgpu';
import {WGSLShaderAssembler, type ShaderModule} from '@luma.gl/shaders';

const ARROW_SHADER_ASSEMBLER = new WGSLShaderAssembler();

/** Assemble the existing Arrow compute source without engine shader-input state. */
export function createArrowComputeKernel(
  device: Device,
  props: KernelProps & {modules?: ShaderModule[]}
): Kernel {
  const {modules, ...kernelProps} = props;
  const assembled = ARROW_SHADER_ASSEMBLER.assembleWGSLShader({
    platformInfo: getPlatformInfo(device),
    source: props.source,
    modules,
    shaderStage: 'compute',
    computeEntryPoint: props.entryPoint,
    scanVertexAttributes: false
  });
  return new Kernel(device, {
    ...kernelProps,
    source: assembled.source,
    entryPoint: assembled.entryPoints?.compute || props.entryPoint
  });
}
