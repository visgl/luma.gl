// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowComputation} from './common/row-transform';

export const interleave: OperationHandler<GPUDataEvaluator[]> = ({inputs, output, target}) => {
  const inputEntries: [string, GPUDataEvaluator][] = inputs.map((input, index) => [
    `x${index}`,
    input
  ]);
  validateInterleaveBindings(target.device.limits, inputEntries);

  const argumentList = inputEntries
    .map(([name, input]) => `${name}: array<{TYPE}, ${input.size}>`)
    .join(', ');
  let elementOffset = 0;
  const assignments = inputEntries
    .map(([name, input]) => {
      const block = Array.from(
        {length: input.size},
        (_, elementIndex) => `  out[${elementOffset + elementIndex}] = ${name}[${elementIndex}];`
      ).join('\n');
      elementOffset += input.size;
      return block;
    })
    .join('\n');
  const source = `\
fn interleave(${argumentList}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${assignments}
  return out;
}
`;

  runRowComputation({
    module: {name: 'interleave', source},
    inputs,
    output,
    outputBuffer: target
  });
  return {success: true};
};

function validateInterleaveBindings(
  limits: {maxBindingsPerBindGroup: number; maxStorageBuffersPerShaderStage: number},
  inputEntries: [string, GPUDataEvaluator][]
): void {
  const storageInputCount = inputEntries.filter(([, input]) => !input.isConstant).length;
  const storageBindingCount = storageInputCount + 1;
  if (storageBindingCount > limits.maxStorageBuffersPerShaderStage) {
    throw new Error(
      `interleave() requires ${storageBindingCount} storage buffers, exceeding device limit ${limits.maxStorageBuffersPerShaderStage}`
    );
  }
  if (storageBindingCount > limits.maxBindingsPerBindGroup) {
    throw new Error(
      `interleave() requires ${storageBindingCount} bindings, exceeding bind group limit ${limits.maxBindingsPerBindGroup}`
    );
  }
}
