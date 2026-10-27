// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture} from '@luma.gl/core';
import {RenderKernel, getPlatformInfo} from '@luma.gl/gpgpu';
import {ShaderAssembler} from '@luma.gl/shadertools';
import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {bufferPool} from '../../utils/buffer-pool';
import {arithmetic} from './arithmetic';
import {getInputBufferLayout, getInputModule} from './common/row-transform';

const GPGPU_OPERATION_STATS = 'GPGPU Operation Counts';
const TRANSFORM_RUNS = 'Transform Runs';

export const extent: OperationHandler<{sourceValues: GPUDataEvaluator}> = ({
  inputs,
  output,
  target
}) => {
  const {sourceValues} = inputs;
  const device = target.device;
  if (sourceValues.length === 0) {
    const value = new output.ValueType(output.length * output.size);
    target.write(value);
    return {success: true, value};
  }
  if (sourceValues.isConstant) {
    const constantValue = sourceValues.value!;
    const result = new output.ValueType(output.length * output.size);
    for (let channelIndex = 0; channelIndex < output.length; channelIndex++) {
      const value = constantValue[channelIndex];
      result[channelIndex * 2] = value;
      result[channelIndex * 2 + 1] = value;
    }
    target.write(result);
    return {success: true, value: result};
  }

  const resultTexture = device.createTexture({
    width: 1,
    height: output.length,
    format: 'rg32float',
    usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST
  });
  const framebuffer = device.createFramebuffer({colorAttachments: [resultTexture]});

  const vertexShader = /* glsl */ `\
#version 300 es

flat out float extent_value;

void main() {
  float sourceValues[SOURCE_VALUES_LEN];
  get_sourceValues(sourceValues);
  extent_value = sourceValues[gl_VertexID];

  float y = (float(gl_VertexID) + 0.5) / float(CHANNEL_COUNT) * 2.0 - 1.0;
  gl_Position = vec4(0.0, y, 0.0, 1.0);
  gl_PointSize = 1.0;
}
  `;

  const fragmentShader = /* glsl */ `\
#version 300 es

precision highp float;

flat in float extent_value;
out vec2 fragColor;

void main() {
  fragColor = vec2(-extent_value, extent_value);
}
  `;

  const {vs, fs} = ShaderAssembler.getDefaultShaderAssembler('glsl').assembleGLSLShaderPair({
    platformInfo: getPlatformInfo(device),
    vs: vertexShader,
    fs: fragmentShader,
    modules: [
      getInputModule('sourceValues', sourceValues.type, sourceValues.size, sourceValues.normalized)
    ],
    defines: {
      // The GLSL assembler supports token-valued macros used by the input module.
      // @ts-expect-error ShaderAssembler's public define type only lists numeric/boolean values.
      TYPE: 'float',
      SOURCE_VALUES_LEN: sourceValues.size,
      CHANNEL_COUNT: output.length
    }
  });
  const bufferLayout = [getInputBufferLayout('sourceValues', sourceValues)];
  const reductionKernel = new RenderKernel(device, {
    vertexSource: vs,
    fragmentSource: fs,
    topology: 'point-list',
    parameters: {
      depthCompare: 'always',
      blend: true,
      blendColorSrcFactor: 'one',
      blendColorDstFactor: 'one',
      blendColorOperation: 'max',
      blendAlphaSrcFactor: 'one',
      blendAlphaDstFactor: 'one',
      blendAlphaOperation: 'max'
    },
    bufferLayout,
    disableWarnings: true
  });

  const vertexArray = device.createVertexArray({
    shaderLayout: reductionKernel.pipeline.shaderLayout,
    bufferLayout
  });
  // WebGL vertex-array slots are reflected attribute locations, including split vectors.
  for (const attribute of reductionKernel.pipeline.shaderLayout.attributes) {
    vertexArray.setBuffer(attribute.location, sourceValues.buffer);
  }
  const intermediateBuffer = bufferPool.createOrReuse(device, output.byteLength);

  try {
    const renderPass = device.beginRenderPass({
      framebuffer,
      parameters: {
        viewport: [0, 0, 1, output.length]
      },
      clearColor: [-MAX_FLOAT32, -MAX_FLOAT32, 0, 0],
      clearDepth: false,
      clearStencil: false
    });
    device.statsManager.getStats(GPGPU_OPERATION_STATS).get(TRANSFORM_RUNS).incrementCount();
    reductionKernel.draw(renderPass, {
      vertexArray,
      vertexCount: output.length,
      instanceCount: sourceValues.length
    });
    renderPass.end();
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer({
      sourceTexture: resultTexture,
      width: 1,
      height: output.length,
      destinationBuffer: intermediateBuffer,
      byteOffset: 0,
      bytesPerRow: 8
    });
    device.submit(commandEncoder.finish());

    return arithmetic({
      device,
      inputs: {
        expression: {
          kind: 'call',
          op: 'multiply',
          args: [
            {kind: 'input', name: 'x'},
            {kind: 'literal', value: [-1, 1]}
          ]
        },
        namedInputs: {
          x: new GPUDataEvaluator({
            buffer: intermediateBuffer,
            size: 2,
            type: 'float32',
            length: output.length
          })
        }
      },
      output,
      target
    });
  } finally {
    vertexArray.destroy();
    reductionKernel.destroy();
    bufferPool.recycle(intermediateBuffer);
    framebuffer.destroy();
    resultTexture.destroy();
  }
};
const MAX_FLOAT32 = 3.0e38;
