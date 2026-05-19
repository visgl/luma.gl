// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BufferTransform} from '@luma.gl/engine';
import {OperationHandler} from '../../operation/operation';
import {getOutputModule} from './common/row-transform';

export const sequence: OperationHandler<{start: number; step: number}> = async ({
  inputs,
  output,
  target
}) => {
  const outputModule = getOutputModule('result', output.type, output.size);
  const transform = new BufferTransform(target.device, {
    vs: `\
#version 300 es

void main() {
  int result[1];
  result[0] = START + gl_InstanceID * STEP;
  set_result(result);
}
`,
    defines: {
      START: inputs.start.toString(),
      STEP: inputs.step.toString()
    } as any,
    modules: [outputModule],
    vertexCount: 1,
    instanceCount: output.length,
    feedbackBufferMode: 'interleaved',
    outputs: outputModule.varyings
  });

  try {
    transform.run({
      outputBuffers: {[outputModule.varyings[0]]: target}
    });
  } finally {
    transform.destroy();
  }
};
