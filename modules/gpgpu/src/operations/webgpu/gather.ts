// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {getWebGPUDispatchLayout, getWebGPUDispatchRowIndex} from './common/dispatch';
import {getLiteralValue, getWGSLType} from './common/helper';
import {
  getInputBinding,
  getOutputBinding,
  getOutputWriter,
  getSourceValuesAccessor,
  getZeroResultFunction,
  RANDOM_ACCESS_WORKGROUP_SIZE
} from './common/random-access-transform';

export const gather: OperationHandler<{
  ids: GPUDataEvaluator;
  sourceValues: GPUDataEvaluator;
}> = async ({inputs, output, target}) => {
  const {ids, sourceValues} = inputs;
  const idsType = getWGSLType(ids.type);
  const bindings: {name: string; input: GPUDataEvaluator; index: number}[] = [];
  if (!ids.isConstant) {
    bindings.push({name: 'ids', input: ids, index: bindings.length});
  }
  if (!sourceValues.isConstant) {
    bindings.push({name: 'sourceValues', input: sourceValues, index: bindings.length});
  }
  const dispatchLayout = getWebGPUDispatchLayout(
    Math.ceil(output.length / RANDOM_ACCESS_WORKGROUP_SIZE),
    target.device.limits.maxComputeWorkgroupsPerDimension
  );

  const source = /* wgsl */ `
${bindings.map(({name, input, index}) => getInputBinding(name, input, index)).join('\n')}
${getIdsAccessor(ids, idsType)}
${getSourceValuesAccessor(sourceValues, output.type)}
${getOutputBinding(output, bindings.length)}
${getOutputWriter(output)}
${getZeroResultFunction(output.type, output.size)}
${getGatherFunction(ids.type, output.type, output.size, sourceValues.length)}

@compute @workgroup_size(${RANDOM_ACCESS_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${getWebGPUDispatchRowIndex(dispatchLayout, RANDOM_ACCESS_WORKGROUP_SIZE)};
  if (rowIndex >= ${output.length}u) {
    return;
  }

  let idsValue = read_ids(rowIndex);
  let result = gather(idsValue);
  write_result(rowIndex, result);
}
`;

  const computation = new Computation(target.device, {
    source,
    shaderLayout: {
      bindings: [
        ...bindings.map(({name, index}) => ({
          name,
          type: 'storage' as const,
          group: 0,
          location: index
        })),
        {name: 'result', type: 'storage' as const, group: 0, location: bindings.length}
      ]
    }
  });

  const computationBindings: Record<string, Buffer> = {};
  if (!ids.isConstant) {
    computationBindings['ids'] = ids.buffer;
  }
  if (!sourceValues.isConstant) {
    computationBindings['sourceValues'] = sourceValues.buffer;
  }
  computationBindings['result'] = target;
  computation.setBindings(computationBindings);

  const computePass = target.device.beginComputePass({});
  computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
  computePass.end();
  target.device.submit();
  computation.destroy();
  return {success: true};
};

function getIdsAccessor(input: GPUDataEvaluator, type: string): string {
  if (input.isConstant) {
    const values = input.value;
    if (!values) {
      throw new Error(`Constant input ${input} is missing CPU values`);
    }
    return `fn read_ids(_rowIndex: u32) -> ${type} {
  return ${getLiteralValue(type, values[0] ?? 0)};
}`;
  }

  const stride = input.stride / input.ValueType.BYTES_PER_ELEMENT;
  const offset = input.offset / input.ValueType.BYTES_PER_ELEMENT;
  return `fn read_ids(rowIndex: u32) -> ${type} {
  let rowOffset = ${offset}u + rowIndex * ${stride}u;
  return ids[rowOffset];
}`;
}

function getGatherFunction(
  idsType: GPUDataEvaluator['type'],
  outputType: GPUDataEvaluator['type'],
  outputSize: number,
  sourceLength: number
): string {
  const idsWGSLType = getWGSLType(idsType);
  const outputWGSLType = getWGSLType(outputType);
  const indexExpression =
    idsWGSLType === 'u32' ? 'i32(idsValue)' : idsWGSLType === 'i32' ? 'idsValue' : 'i32(idsValue)';

  return `fn gather(idsValue: ${idsWGSLType}) -> array<${outputWGSLType}, ${outputSize}> {
  let sourceIndex = ${indexExpression};
  if (sourceIndex < 0 || sourceIndex >= ${sourceLength}) {
    return zero_result();
  }
  return read_source_values(u32(sourceIndex));
}`;
}
