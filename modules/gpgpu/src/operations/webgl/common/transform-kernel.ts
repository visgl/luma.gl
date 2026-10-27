// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  type Binding,
  type Buffer,
  type BufferLayout,
  type BufferRange,
  type Device,
  type TransformFeedback,
  type VertexArray
} from '@luma.gl/core';
import {
  getPassthroughFS,
  ShaderAssembler,
  type GLSLShaderAssembler,
  type ShaderModule
} from '@luma.gl/shadertools';
import {RenderKernel} from '../../../execution/compute/render-kernel';
import {getPlatformInfo} from '../../../execution/utils/get-platform-info';

type TransformKernelProps = {
  vs: string;
  defines?: Record<string, string | number | boolean>;
  modules?: ShaderModule[];
  shaderAssembler?: GLSLShaderAssembler;
  bufferLayout?: BufferLayout[];
  attributes?: Record<string, Buffer>;
  bindings?: Record<string, Binding>;
  vertexCount: number;
  instanceCount: number;
  outputs: string[];
};

/** Executes one operation's assembled vertex shader with borrowed input/output buffers. */
export function runTransformKernel(
  device: Device,
  props: TransformKernelProps,
  buffers: {
    inputBuffers?: Record<string, Buffer>;
    outputBuffers: Record<string, Buffer | BufferRange>;
  }
): void {
  const assembler = props.shaderAssembler ?? ShaderAssembler.getDefaultShaderAssembler('glsl');
  const {vs, fs} = assembler.assembleGLSLShaderPair({
    platformInfo: getPlatformInfo(device),
    vs: props.vs,
    fs: getPassthroughFS(),
    modules: props.modules,
    // GLSL operations use token-valued macros in addition to numeric/boolean defines.
    // @ts-expect-error The assembler supports these tokens but its public type is narrower.
    defines: props.defines
  });
  const bufferLayout = props.bufferLayout ?? [];
  const kernel = new RenderKernel(device, {
    vertexSource: vs,
    fragmentSource: fs,
    topology: 'point-list',
    bufferLayout,
    varyings: props.outputs,
    bufferMode: 0x8c8c // GL_INTERLEAVED_ATTRIBS: operation outputs are dense row records.
  });
  let vertexArray: VertexArray | undefined;
  let feedback: TransformFeedback | undefined;
  try {
    vertexArray = device.createVertexArray({
      shaderLayout: kernel.pipeline.shaderLayout,
      bufferLayout
    });
    const inputs = {...props.attributes, ...buffers.inputBuffers};
    for (const attribute of kernel.pipeline.shaderLayout.attributes) {
      const layout = bufferLayout.find(layout =>
        layout.attributes
          ? layout.attributes.some(field => field.attribute === attribute.name)
          : layout.name === attribute.name
      );
      const buffer = layout && inputs[layout.name];
      // Every active input attribute must have a supplied logical buffer binding.
      assert(buffer);
      vertexArray.setBuffer(attribute.location, buffer);
    }
    feedback = device.createTransformFeedback({
      layout: kernel.pipeline.shaderLayout,
      buffers: buffers.outputBuffers
    });
    const pass = device.beginRenderPass({discard: true});
    try {
      kernel.draw(pass, {
        vertexArray,
        transformFeedback: feedback,
        bindings: props.bindings,
        vertexCount: props.vertexCount,
        instanceCount: props.instanceCount
      });
    } finally {
      pass.end();
    }
  } finally {
    feedback?.destroy();
    vertexArray?.destroy();
    kernel.destroy();
  }
}
