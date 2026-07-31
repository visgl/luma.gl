// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowTransform} from './common/row-transform';

export const interleave: OperationHandler<GPUDataEvaluator[]> = ({inputs, output, target}) => {
  const inputEntries: [string, GPUDataEvaluator][] = inputs.map((input, index) => [
    `x${index}`,
    input
  ]);
  validateInterleaveInputs(target.device.limits.maxVertexAttributes, inputEntries);
  validateInterleaveOutput(target.device.limits.maxInterStageShaderVariables, output);

  const argumentList = inputEntries
    .map(([name, input]) => `in TYPE ${name}[${input.size}]`)
    .join(', ');
  let elementOffset = 0;
  const assignments = inputEntries
    .map(([name, input]) => {
      const block = Array.from(
        {length: input.size},
        (_, elementIndex) => `  result[${elementOffset + elementIndex}] = ${name}[${elementIndex}];`
      ).join('\n');
      elementOffset += input.size;
      return block;
    })
    .join('\n');
  const vs = `\
void interleave(${argumentList}, out TYPE result[RESULT_LEN]) {
${assignments}
}
`;

  runRowTransform({
    module: {name: 'interleave', vs},
    inputs,
    output,
    outputBuffer: target
  });
  return {success: true};
};

function validateInterleaveInputs(
  maxVertexAttributes: number,
  inputEntries: [string, GPUDataEvaluator][]
): void {
  const attributeCount = inputEntries.reduce(
    (count, [, input]) => count + Math.ceil(input.size / 4),
    0
  );
  if (attributeCount > maxVertexAttributes) {
    throw new Error(
      `interleave() requires ${attributeCount} vertex attributes, exceeding device limit ${maxVertexAttributes}`
    );
  }
}

function validateInterleaveOutput(
  maxInterStageShaderVariables: number,
  output: GPUDataEvaluator
): void {
  if (output.size > maxInterStageShaderVariables) {
    throw new Error(
      `interleave() output size ${output.size} exceeds device inter-stage component limit ${maxInterStageShaderVariables}`
    );
  }
}
