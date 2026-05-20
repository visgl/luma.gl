// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Computation} from '@luma.gl/engine';
import {OperationHandler} from '../../operation/operation';

const WORKGROUP_SIZE = 64;

export const sequence: OperationHandler<{start: number; step: number}> = async ({
  inputs,
  output,
  target
}) => {
  const source = `\
@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${output.length}u) {
    return;
  }

  let rowOffset = ${output.offset / output.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${output.stride / output.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${inputs.start} + i32(rowIndex) * ${inputs.step};
}
`;

  const computation = new Computation(target.device, {
    source,
    shaderLayout: {
      bindings: [{name: 'result', type: 'storage' as const, group: 0, location: 0}]
    }
  });

  computation.setBindings({result: target});
  const computePass = target.device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(output.length / WORKGROUP_SIZE));
  computePass.end();
  target.device.submit();
  computation.destroy();
  return {success: true};
};
