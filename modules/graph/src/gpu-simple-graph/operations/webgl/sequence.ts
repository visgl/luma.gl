// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {runTransformKernel} from './common/transform-kernel';
import {OperationHandler} from '../../operation/operation';
import {getOutputModule} from './common/row-transform';

export const sequence: OperationHandler<{start: number; step: number}> = ({
  inputs,
  output,
  target
}) => {
  const outputModule = getOutputModule('result', output.type, output.size);
  const transformProps = {
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
    outputs: outputModule.varyings
  };

  runTransformKernel(target.device, transformProps, {
    outputBuffers: {[outputModule.varyings[0]]: target}
  });
  return {success: true};
};
